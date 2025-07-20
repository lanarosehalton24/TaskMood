import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_SECRET_KEY || process.env.OPENAI_TOKEN
});

export interface MoodAnalysis {
  mood: string;
  rating: number;
  confidence: number;
  suggestions: string[];
}

export interface TaskSuggestion {
  priority: 'high' | 'medium' | 'low';
  reason: string;
  estimatedTime: string;
  category: string;
}

export async function analyzeMood(moodInput: string): Promise<MoodAnalysis> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant that analyzes user mood and provides helpful suggestions. 
          Analyze the mood input and respond with JSON in this exact format:
          {
            "mood": "one of: happy, neutral, stressed, tired, excited, focused, overwhelmed, calm",
            "rating": "number from 1-5 where 5 is very positive",
            "confidence": "number from 1-100 indicating confidence in analysis",
            "suggestions": ["array of 2-3 helpful suggestions based on the mood"]
          }`
        },
        {
          role: "user",
          content: `Analyze this mood input: "${moodInput}"`
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      mood: result.mood || 'neutral',
      rating: Math.max(1, Math.min(5, result.rating || 3)),
      confidence: Math.max(1, Math.min(100, result.confidence || 50)),
      suggestions: result.suggestions || []
    };
  } catch (error) {
    console.error("Error analyzing mood:", error);
    return {
      mood: 'neutral',
      rating: 3,
      confidence: 50,
      suggestions: ['Take breaks when needed', 'Stay hydrated', 'Focus on one task at a time']
    };
  }
}

export async function generateTaskSuggestions(
  mood: string, 
  rating: number, 
  existingTasks: any[]
): Promise<TaskSuggestion[]> {
  try {
    const taskSummary = existingTasks.map(t => `${t.title} (${t.priority}, due: ${t.dueDate})`).join(', ');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI task management assistant. Based on user mood and existing tasks, 
          suggest how to prioritize and approach tasks. Respond with JSON array of suggestions:
          [
            {
              "priority": "high|medium|low",
              "reason": "explanation for priority level",
              "estimatedTime": "time estimate like '30 min' or '2 hours'",
              "category": "category like 'Focus Work', 'Quick Tasks', 'Creative Work'"
            }
          ]`
        },
        {
          role: "user",
          content: `User mood: ${mood} (rating: ${rating}/5). Existing tasks: ${taskSummary}. 
          Suggest how to approach their work today.`
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '[]');
    return Array.isArray(result) ? result : result.suggestions || [];
  } catch (error) {
    console.error("Error generating task suggestions:", error);
    return [];
  }
}

export async function generateAIGreeting(
  userName: string, 
  mood: string, 
  timeOfDay: string
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a friendly AI assistant for a task management app. Generate a personalized, encouraging greeting based on the user's mood and time of day. Keep it concise (1-2 sentences) and motivational."
        },
        {
          role: "user",
          content: `Generate a greeting for ${userName}. Time: ${timeOfDay}. Mood: ${mood}.`
        },
      ],
    });

    return response.choices[0].message.content || `Good ${timeOfDay}, ${userName}! Ready to tackle your tasks today?`;
  } catch (error) {
    console.error("Error generating AI greeting:", error);
    return `Good ${timeOfDay}, ${userName}! Ready to tackle your tasks today?`;
  }
}
