import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, Lightbulb } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const moods = [
  { emoji: "😊", value: "happy", label: "Happy" },
  { emoji: "😐", value: "neutral", label: "Neutral" },
  { emoji: "😰", value: "stressed", label: "Stressed" },
  { emoji: "😴", value: "tired", label: "Tired" },
  { emoji: "🎯", value: "focused", label: "Focused" },
  { emoji: "😤", value: "overwhelmed", label: "Overwhelmed" },
];

export default function MoodCheck() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const moodMutation = useMutation({
    mutationFn: async (mood: string) => {
      const response = await apiRequest("POST", "/api/mood", { moodInput: mood });
      return response.json();
    },
    onSuccess: (data) => {
      setSuggestions(data.suggestions || []);
      queryClient.invalidateQueries({ queryKey: ["/api/ai/greeting"] });
      toast({
        title: "Mood recorded!",
        description: "I've updated your task suggestions based on how you're feeling.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to record mood",
        variant: "destructive",
      });
    },
  });

  const handleMoodSelect = (mood: string) => {
    setSelectedMood(mood);
    moodMutation.mutate(mood);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Bot className="h-5 w-5 mr-2 text-primary" />
          AI Assistant
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">How are you feeling today?</p>
          
          <div className="grid grid-cols-3 gap-2">
            {moods.map((mood) => (
              <Button
                key={mood.value}
                variant="ghost"
                size="sm"
                className={`mood-button ${selectedMood === mood.value ? 'selected' : ''}`}
                onClick={() => handleMoodSelect(mood.value)}
                disabled={moodMutation.isPending}
              >
                <span className="text-lg">{mood.emoji}</span>
              </Button>
            ))}
          </div>

          {selectedMood && (
            <div className="mt-4">
              <Badge variant="outline" className="mb-3">
                Current mood: {moods.find(m => m.value === selectedMood)?.label}
              </Badge>
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <Lightbulb className="h-4 w-4 text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">AI Suggestions</p>
                  <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    {suggestions.map((suggestion, index) => (
                      <li key={index} className="text-xs">• {suggestion}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {moodMutation.isPending && (
            <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Analyzing your mood...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
