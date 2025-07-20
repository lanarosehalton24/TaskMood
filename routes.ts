import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertTaskSchema, 
  insertChatMessageSchema, 
  insertMoodEntrySchema,
  insertNotificationSchema 
} from "@shared/schema";
import { analyzeMood, generateTaskSuggestions, generateAIGreeting } from "./openai";

interface WebSocketClient extends WebSocket {
  userId?: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Task routes
  app.get('/api/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const status = req.query.status as string;
      const tasks = await storage.getTasksByUser(userId, status);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post('/api/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const taskData = insertTaskSchema.parse({
        ...req.body,
        assignedTo: userId,
        assignedBy: userId
      });
      
      const task = await storage.createTask(taskData);
      res.json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.put('/api/tasks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const updates = insertTaskSchema.partial().parse(req.body);
      
      const task = await storage.updateTask(taskId, updates);
      res.json(task);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete('/api/tasks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const taskId = parseInt(req.params.id);
      await storage.deleteTask(taskId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  app.get('/api/tasks/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getTaskStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching task stats:", error);
      res.status(500).json({ message: "Failed to fetch task stats" });
    }
  });

  // Mood routes
  app.post('/api/mood', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { moodInput } = req.body;
      
      // Analyze mood with AI
      const analysis = await analyzeMood(moodInput);
      
      // Save mood entry
      const moodEntry = await storage.createMoodEntry({
        userId,
        mood: analysis.mood,
        rating: analysis.rating,
        confidence: analysis.confidence,
        aiSuggestions: JSON.stringify(analysis.suggestions)
      });

      // Get user tasks for suggestions
      const tasks = await storage.getTasks(userId);
      const taskSuggestions = await generateTaskSuggestions(
        analysis.mood, 
        analysis.rating, 
        tasks
      );

      res.json({
        mood: moodEntry,
        suggestions: analysis.suggestions,
        taskSuggestions
      });
    } catch (error) {
      console.error("Error processing mood:", error);
      res.status(500).json({ message: "Failed to process mood" });
    }
  });

  app.get('/api/mood/latest', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const latestMood = await storage.getLatestMoodEntry(userId);
      res.json(latestMood);
    } catch (error) {
      console.error("Error fetching latest mood:", error);
      res.status(500).json({ message: "Failed to fetch latest mood" });
    }
  });

  // AI greeting route
  app.get('/api/ai/greeting', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const latestMood = await storage.getLatestMoodEntry(userId);
      
      const hour = new Date().getHours();
      const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
      
      const greeting = await generateAIGreeting(
        user?.firstName || 'there',
        latestMood?.mood || 'neutral',
        timeOfDay
      );
      
      res.json({ greeting });
    } catch (error) {
      console.error("Error generating greeting:", error);
      res.status(500).json({ message: "Failed to generate greeting" });
    }
  });

  // Chat routes
  app.get('/api/chat/messages', isAuthenticated, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const messages = await storage.getChatMessages(limit);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });

  // Notification routes
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notifications = await storage.getNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.put('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      await storage.markNotificationAsRead(notificationId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket setup for real-time chat
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocketClient, req) => {
    console.log('New WebSocket connection');
    
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'auth') {
          ws.userId = message.userId;
        } else if (message.type === 'chat_message') {
          const chatMessage = await storage.createChatMessage({
            content: message.content,
            senderId: ws.userId!,
            messageType: message.messageType || 'text'
          });

          // Broadcast to all connected clients
          wss.clients.forEach((client: WebSocketClient) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'new_message',
                message: chatMessage
              }));
            }
          });
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
  });

  return httpServer;
}
