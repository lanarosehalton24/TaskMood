import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, Clock, Target, Calendar, Trophy } from "lucide-react";
import Navigation from "@/components/navigation";

export default function Analytics() {
  const { data: stats } = useQuery({
    queryKey: ["/api/tasks/stats"],
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["/api/tasks"],
  });

  const { data: moodEntries = [] } = useQuery({
    queryKey: ["/api/mood/latest"],
  });

  // Calculate additional metrics
  const totalTasks = stats ? stats.pending + stats.completed + stats.overdue : 0;
  const completionRate = totalTasks > 0 ? (stats?.completed || 0) / totalTasks * 100 : 0;
  
  const tasksByPriority = {
    high: tasks.filter((t: any) => t.priority === 'high').length,
    medium: tasks.filter((t: any) => t.priority === 'medium').length,
    low: tasks.filter((t: any) => t.priority === 'low').length,
  };

  const tasksByCategory = tasks.reduce((acc: any, task: any) => {
    const category = task.category || 'Uncategorized';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  const topCategories = Object.entries(tasksByCategory)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <main className="flex-1 overflow-auto">
        <div className="p-4 md:p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
            <p className="text-gray-600 dark:text-gray-300">Track your productivity and performance insights</p>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Tasks</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalTasks}</p>
                  </div>
                  <Target className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Completed</p>
                    <p className="text-2xl font-bold text-success">{stats?.completed || 0}</p>
                  </div>
                  <Trophy className="h-8 w-8 text-success" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Pending</p>
                    <p className="text-2xl font-bold text-warning">{stats?.pending || 0}</p>
                  </div>
                  <Clock className="h-8 w-8 text-warning" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Overdue</p>
                    <p className="text-2xl font-bold text-destructive">{stats?.overdue || 0}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-destructive" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Completion Rate */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Completion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Overall Progress</span>
                    <span className="text-sm font-medium">{completionRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={completionRate} className="h-3" />
                  
                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="text-center">
                      <div className="text-lg font-bold text-success">{stats?.completed || 0}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-warning">{stats?.pending || 0}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Pending</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-destructive">{stats?.overdue || 0}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Overdue</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Task Distribution by Priority */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Task Priority Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-destructive rounded-full"></div>
                      <span className="text-sm">High Priority</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{tasksByPriority.high}</span>
                      <Badge variant="destructive">{totalTasks > 0 ? Math.round((tasksByPriority.high / totalTasks) * 100) : 0}%</Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-warning rounded-full"></div>
                      <span className="text-sm">Medium Priority</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{tasksByPriority.medium}</span>
                      <Badge variant="secondary">{totalTasks > 0 ? Math.round((tasksByPriority.medium / totalTasks) * 100) : 0}%</Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-success rounded-full"></div>
                      <span className="text-sm">Low Priority</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{tasksByPriority.low}</span>
                      <Badge variant="outline">{totalTasks > 0 ? Math.round((tasksByPriority.low / totalTasks) * 100) : 0}%</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Top Task Categories</CardTitle>
            </CardHeader>
            <CardContent>
              {topCategories.length > 0 ? (
                <div className="space-y-4">
                  {topCategories.map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{category}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${((count as number) / totalTasks) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400 w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No task data available yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
