import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Bot, Plus, Clock, CheckCircle, AlertTriangle, Trophy } from "lucide-react";
import Navigation from "@/components/navigation";
import MoodCheck from "@/components/mood-check";
import TaskCard from "@/components/task-card";
import ChatPanel from "@/components/chat-panel";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: tasks = [] } = useQuery({
    queryKey: ["/api/tasks"],
    enabled: isAuthenticated,
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      }
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/tasks/stats"],
    enabled: isAuthenticated,
  });

  const { data: greetingData } = useQuery({
    queryKey: ["/api/ai/greeting"],
    enabled: isAuthenticated,
  });

  const todayTasks = tasks.filter((task: any) => {
    const today = new Date().toDateString();
    const taskDate = task.dueDate ? new Date(task.dueDate).toDateString() : null;
    return taskDate === today;
  });

  const priorityTasks = tasks
    .filter((task: any) => task.priority === 'high' && !task.completed)
    .slice(0, 3);

  const upcomingTasks = tasks
    .filter((task: any) => {
      const taskDate = new Date(task.dueDate || '');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      return taskDate > tomorrow && taskDate <= weekFromNow;
    })
    .slice(0, 3);

  if (isLoading || !isAuthenticated) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <main className="flex-1 overflow-auto">
        <div className="p-4 md:p-8">
          {/* AI Greeting */}
          <div className="mb-8">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 gradient-bg rounded-full flex items-center justify-center">
                    <Bot className="text-white text-lg" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {greetingData?.greeting || `Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, ${user?.firstName || 'there'}! 👋`}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-3">
                      I've organized your tasks to help you have a productive day. Ready to get started?
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">AI Suggestions Active</Badge>
                      <Badge variant="outline">{tasks.length} Tasks Scheduled</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Today's Priority Tasks */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Today's Priority Tasks</CardTitle>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Task
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {priorityTasks.length > 0 ? (
                      priorityTasks.map((task: any) => (
                        <TaskCard key={task.id} task={task} />
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No high priority tasks for today. Great job!</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Mood Check */}
              <MoodCheck />

              {/* Quick Chat */}
              <ChatPanel />
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upcoming Tasks */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming This Week</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingTasks.length > 0 ? (
                    upcomingTasks.map((task: any) => (
                      <div key={task.id} className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className={`w-3 h-3 rounded-full ${
                          task.priority === 'high' ? 'bg-destructive' :
                          task.priority === 'medium' ? 'bg-warning' : 'bg-success'
                        }`} />
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                            {task.title}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {task.category || 'General'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                      <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No upcoming tasks this week</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Productivity Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Productivity Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-300">This Week's Progress</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {stats ? Math.round((stats.completed / (stats.completed + stats.pending + stats.overdue)) * 100) : 0}%
                      </span>
                    </div>
                    <Progress 
                      value={stats ? (stats.completed / (stats.completed + stats.pending + stats.overdue)) * 100 : 0} 
                      className="h-2"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {stats?.completedThisWeek || 0}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-warning">
                        {stats?.pending || 0}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Pending</div>
                    </div>
                  </div>

                  {stats?.completedThisWeek && stats.completedThisWeek >= 5 && (
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Trophy className="h-4 w-4 text-secondary" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">Achievement Unlocked!</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        Completed {stats.completedThisWeek} tasks this week. Keep up the great work!
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
