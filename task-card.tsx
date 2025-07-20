import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Clock, User, Tag, MoreVertical, Edit, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: any;
  showActions?: boolean;
}

export default function TaskCard({ task, showActions = false }: TaskCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCompleted, setIsCompleted] = useState(task.completed);

  const updateTaskMutation = useMutation({
    mutationFn: async (updates: any) => {
      await apiRequest("PUT", `/api/tasks/${task.id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/stats"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/tasks/${task.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/stats"] });
      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    },
  });

  const handleCompletionToggle = (checked: boolean) => {
    setIsCompleted(checked);
    updateTaskMutation.mutate({
      completed: checked,
      status: checked ? 'completed' : 'pending'
    });
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this task?")) {
      deleteTaskMutation.mutate();
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getPriorityBorder = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'task-priority-high';
      case 'medium':
        return 'task-priority-medium';
      case 'low':
        return 'task-priority-low';
      default:
        return '';
    }
  };

  const formatDueDate = (date: string | null) => {
    if (!date) return null;
    const dueDate = new Date(date);
    const now = new Date();
    const isOverdue = dueDate < now && !isCompleted;
    const isToday = dueDate.toDateString() === now.toDateString();
    
    return {
      text: isToday ? 'Today' : dueDate.toLocaleDateString(),
      time: dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOverdue,
      isToday
    };
  };

  const dueDateInfo = formatDueDate(task.dueDate);

  return (
    <Card className={cn(
      "p-4 hover:shadow-md transition-shadow",
      getPriorityBorder(task.priority),
      isCompleted && "opacity-75"
    )}>
      <div className="flex items-start space-x-4">
        <Checkbox
          checked={isCompleted}
          onCheckedChange={handleCompletionToggle}
          className="mt-1"
          disabled={updateTaskMutation.isPending}
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h4 className={cn(
              "font-medium text-gray-900 dark:text-white",
              isCompleted && "line-through"
            )}>
              {task.title}
            </h4>
            <Badge variant={getPriorityColor(task.priority)}>
              {task.priority}
            </Badge>
          </div>
          
          {task.description && (
            <p className={cn(
              "text-sm text-gray-600 dark:text-gray-300 mb-2",
              isCompleted && "line-through"
            )}>
              {task.description}
            </p>
          )}
          
          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
            {dueDateInfo && (
              <span className={cn(
                "flex items-center space-x-1",
                dueDateInfo.isOverdue && "text-destructive",
                dueDateInfo.isToday && "text-warning font-medium"
              )}>
                <Clock className="h-3 w-3" />
                <span>
                  Due: {dueDateInfo.text} {dueDateInfo.time}
                </span>
              </span>
            )}
            
            {task.category && (
              <span className="flex items-center space-x-1">
                <Tag className="h-3 w-3" />
                <span>{task.category}</span>
              </span>
            )}
            
            {task.assignedByUser && (
              <span className="flex items-center space-x-1">
                <User className="h-3 w-3" />
                <span>
                  {task.assignedBy === task.assignedTo ? 'Self-assigned' : 
                   `Assigned by: ${task.assignedByUser.firstName || 'Unknown'}`}
                </span>
              </span>
            )}
          </div>
        </div>
        
        {showActions && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Edit className="h-4 w-4 mr-2" />
                Edit Task
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleDelete}
                className="text-destructive focus:text-destructive"
                disabled={deleteTaskMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleteTaskMutation.isPending ? "Deleting..." : "Delete Task"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </Card>
  );
}
