import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Mic, Users } from "lucide-react";
import VoiceInput from "./voice-input";
import { useWebSocket } from "@/lib/websocket";
import { useAuth } from "@/hooks/useAuth";

export default function ChatPanel() {
  const [message, setMessage] = useState("");
  const { user } = useAuth();
  const { messages, sendMessage, isConnected } = useWebSocket();

  const { data: chatHistory = [] } = useQuery({
    queryKey: ["/api/chat/messages"],
    select: (data) => data.slice(-5), // Show only last 5 messages in panel
  });

  // Combine history and real-time messages, show only recent ones
  const recentMessages = [...chatHistory, ...messages]
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .slice(-3); // Show only 3 most recent messages

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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-lg">
            <MessageSquare className="h-5 w-5 mr-2 text-primary" />
            Team Chat
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant={isConnected ? "default" : "destructive"} className="text-xs">
              {isConnected ? "Online" : "Offline"}
            </Badge>
            <div className="flex items-center space-x-1">
              <Users className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">3</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Messages */}
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {recentMessages.length === 0 ? (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No recent messages</p>
              </div>
            ) : (
              recentMessages.map((msg: any, index) => {
                const isOwnMessage = msg.senderId === user?.id;
                return (
                  <div key={msg.id || index} className="flex items-start space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={msg.sender?.profileImageUrl} />
                      <AvatarFallback className="text-xs">
                        {msg.sender?.firstName?.[0] || msg.senderId?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-xs font-medium text-gray-900 dark:text-white">
                            {isOwnMessage ? 'You' : (msg.sender?.firstName || 'Unknown')}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-300">{msg.content}</p>
                        {msg.messageType === 'voice' && (
                          <div className="flex items-center space-x-1 mt-1">
                            <Mic className="h-2 w-2" />
                            <span className="text-xs opacity-75">Voice</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Input */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 text-sm"
                disabled={!isConnected}
              />
              <Button 
                onClick={handleSendMessage}
                disabled={!message.trim() || !isConnected}
                size="icon"
                className="h-8 w-8"
              >
                <Send className="h-3 w-3" />
              </Button>
              <VoiceInput 
                onTranscript={handleVoiceMessage} 
                variant="ghost" 
                size="icon"
                className="h-8 w-8"
              />
            </div>
            
            {!isConnected && (
              <p className="text-xs text-destructive">
                Connection lost. Trying to reconnect...
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
