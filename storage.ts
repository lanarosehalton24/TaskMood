import {
  users,
  tasks,
  chatMessages,
  moodEntries,
  notifications,
  type User,
  type UpsertUser,
  type Task,
  type InsertTask,
  type ChatMessage,
  type InsertChatMessage,
  type MoodEntry,
  type InsertMoodEntry,
  type Notification,
  type InsertNotification,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Task operations
  getTasks(userId: string): Promise<Task[]>;
  getTasksByUser(userId: string, status?: string): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, updates: Partial<InsertTask>): Promise<Task>;
  deleteTask(id: number): Promise<void>;
  getTasksDueToday(userId: string): Promise<Task[]>;
  getOverdueTasks(userId: string): Promise<Task[]>;
  
  // Chat operations
  getChatMessages(limit?: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  
  // Mood operations
  getMoodEntries(userId: string, limit?: number): Promise<MoodEntry[]>;
  createMoodEntry(entry: InsertMoodEntry): Promise<MoodEntry>;
  getLatestMoodEntry(userId: string): Promise<MoodEntry | undefined>;
  
  // Notification operations
  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<void>;
  
  // Analytics operations
  getTaskStats(userId: string): Promise<{
    pending: number;
    completed: number;
    overdue: number;
    completedThisWeek: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Task operations
  async getTasks(userId: string): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.assignedTo, userId))
      .orderBy(desc(tasks.createdAt));
  }

  async getTasksByUser(userId: string, status?: string): Promise<Task[]> {
    const conditions = [eq(tasks.assignedTo, userId)];
    if (status) {
      conditions.push(eq(tasks.status, status));
    }
    
    return await db
      .select()
      .from(tasks)
      .where(and(...conditions))
      .orderBy(desc(tasks.createdAt));
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }

  async updateTask(id: number, updates: Partial<InsertTask>): Promise<Task> {
    const [updatedTask] = await db
      .update(tasks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return updatedTask;
  }

  async deleteTask(id: number): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  async getTasksDueToday(userId: string): Promise<Task[]> {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    return await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.assignedTo, userId),
          gte(tasks.dueDate, startOfDay),
          lte(tasks.dueDate, endOfDay)
        )
      );
  }

  async getOverdueTasks(userId: string): Promise<Task[]> {
    const now = new Date();
    return await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.assignedTo, userId),
          lte(tasks.dueDate, now),
          eq(tasks.completed, false)
        )
      );
  }

  // Chat operations
  async getChatMessages(limit: number = 50): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [newMessage] = await db.insert(chatMessages).values(message).returning();
    return newMessage;
  }

  // Mood operations
  async getMoodEntries(userId: string, limit: number = 10): Promise<MoodEntry[]> {
    return await db
      .select()
      .from(moodEntries)
      .where(eq(moodEntries.userId, userId))
      .orderBy(desc(moodEntries.createdAt))
      .limit(limit);
  }

  async createMoodEntry(entry: InsertMoodEntry): Promise<MoodEntry> {
    const [newEntry] = await db.insert(moodEntries).values(entry).returning();
    return newEntry;
  }

  async getLatestMoodEntry(userId: string): Promise<MoodEntry | undefined> {
    const [entry] = await db
      .select()
      .from(moodEntries)
      .where(eq(moodEntries.userId, userId))
      .orderBy(desc(moodEntries.createdAt))
      .limit(1);
    return entry;
  }

  // Notification operations
  async getNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationAsRead(id: number): Promise<void> {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id));
  }

  // Analytics operations
  async getTaskStats(userId: string): Promise<{
    pending: number;
    completed: number;
    overdue: number;
    completedThisWeek: number;
  }> {
    const allTasks = await this.getTasks(userId);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const pending = allTasks.filter(t => t.status === 'pending').length;
    const completed = allTasks.filter(t => t.status === 'completed').length;
    const overdue = allTasks.filter(t => 
      t.dueDate && t.dueDate < now && !t.completed
    ).length;
    const completedThisWeek = allTasks.filter(t => 
      t.status === 'completed' && 
      t.updatedAt && 
      t.updatedAt > weekAgo
    ).length;

    return { pending, completed, overdue, completedThisWeek };
  }
}

export const storage = new DatabaseStorage();
