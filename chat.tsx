import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Mic, Users } from "lucide-react";
import Navigation from "@/components/navigation";
import VoiceInput from "@/components/voice-input";
import { useWebSocket } from "@/lib/websocket";
import { useAuth } from "@/hooks/useAuth";

export default function Chat() {
  const [message, setMessage] = useState("");
  const [onlineUsers] = useState(3); // Mock online count
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  
  const { messages, sendMessage, isConnected } = useWebSocket();

  const { data: chatHistory = [] } = useQuery({
    queryKey: ["/api/chat/messages"],
  });

  // Combine history and real-time messages
  const allMessages = [...chatHistory, ...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [allMessages]);

  const handleSendMessage = () => {
    if (message.trim() && isConnected) {
      sendMessage(message, "text");
      setMessage("");
    }
  };

  const handleVoiceMessage = (transcript: string) => {
    if (transcript.trim() && isConnected) {
      sendMessage(transcript, "voice");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <main className="flex-1 overflow-hidden">
        <div className="h-[calc(100vh-4rem)] flex flex-col">
          {/* Chat Header */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Team Chat</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Stay connected with your team
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={isConnected ? "default" : "destructive"}>
                  {isConnected ? "Connected" : "Disconnected"}
                </Badge>
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {onlineUsers} online
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {allMessages.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-500 dark:text-gray-400">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              </div>
            ) : (
              allMessages.map((msg: any, index) => {
                const isOwnMessage = msg.senderId === user?.id;
                return (
                  <div key={msg.id || index} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex max-w-xs md:max-w-md ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} space-x-2`}>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={msg.sender?.profileImageUrl} />
                        <AvatarFallback>
                          {msg.sender?.firstName?.[0] || msg.senderId?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`${isOwnMessage ? 'mr-2' : 'ml-2'}`}>
                        <div className={`rounded-lg p-3 ${
                          isOwnMessage 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                        }`}>
                          {!isOwnMessage && (
                            <div className="text-xs font-medium mb-1">
                              {msg.sender?.firstName || 'Unknown User'}
                            </div>
                          )}
                          <p className="text-sm">{msg.content}</p>
                          {msg.messageType === 'voice' && (
                            <div className="flex items-center space-x-1 mt-1">
                              <Mic className="h-3 w-3" />
                              <span className="text-xs opacity-75">Voice message</span>
                            </div>
                          )}
                        </div>
                        <div className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${
                          isOwnMessage ? 'text-right' : 'text-left'
                        }`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
                disabled={!isConnected}
              />
              <VoiceInput onTranscript={handleVoiceMessage} variant="ghost" size="icon" />
              <Button 
                onClick={handleSendMessage}
                disabled={!message.trim() || !isConnected}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
