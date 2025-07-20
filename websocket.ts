import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";

interface ChatMessage {
  id?: string;
  content: string;
  senderId: string;
  messageType?: string;
  createdAt: string;
  sender?: {
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  };
}

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export function useWebSocket() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { user, isAuthenticated } = useAuth();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000;

  const connect = useCallback(() => {
    if (!isAuthenticated || !user || socket) return; // Don't connect if already connected

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
        
        // Authenticate the connection
        ws.send(JSON.stringify({
          type: "auth",
          userId: user.id
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          
          if (data.type === "new_message") {
            setMessages(prev => [...prev, data.message]);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.onclose = (event) => {
        console.log("WebSocket disconnected:", event.code, event.reason);
        setIsConnected(false);
        setSocket(null);
        
        // Attempt to reconnect if it wasn't a manual close and user is still authenticated
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts && isAuthenticated && user) {
          reconnectAttemptsRef.current++;
          console.log(`Attempting to reconnect... (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelay * Math.pow(2, reconnectAttemptsRef.current)); // Exponential backoff
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      setSocket(ws);
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
    }
  }, [isAuthenticated, user]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.close(1000, "Manual disconnect");
    }
    
    setSocket(null);
    setIsConnected(false);
    setMessages([]);
  }, [socket]);

  const sendMessage = useCallback((content: string, messageType: string = "text") => {
    if (socket && socket.readyState === WebSocket.OPEN && user) {
      const message = {
        type: "chat_message",
        content,
        messageType,
        senderId: user.id,
        timestamp: new Date().toISOString()
      };
      
      socket.send(JSON.stringify(message));
    }
  }, [socket, user]);

  // Connect when component mounts and user is authenticated
  useEffect(() => {
    if (isAuthenticated && user && !socket) {
      const timer = setTimeout(() => {
        connect();
      }, 1000);
      
      return () => {
        clearTimeout(timer);
      };
    }
  }, [isAuthenticated, user, socket, connect]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    socket,
    isConnected,
    messages,
    sendMessage,
    connect,
    disconnect
  };
}
