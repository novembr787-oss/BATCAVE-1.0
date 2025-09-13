import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Plus, Calendar, Clock, Zap, Target, CheckCircle, Circle, Trash2, Edit3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useTheme } from '@/lib/theme-context';
import { clientTaskSchema, clientUpdateTaskSchema, type Task, type ClientTask } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { TaskSuggestions } from '@/components/task-suggestions';

// Use the client schema directly from shared
const createTaskSchema = clientTaskSchema;

type CreateTaskForm = z.infer<typeof createTaskSchema>;

const priorityColors = {
  low: 'text-blue-400 border-blue-400/20 bg-blue-400/10',
  medium: 'text-yellow-400 border-yellow-400/20 bg-yellow-400/10',
  high: 'text-orange-400 border-orange-400/20 bg-orange-400/10',
  urgent: 'text-red-400 border-red-400/20 bg-red-400/10',
};

const domainIcons = {
  academic: Target,
  fitness: Zap,
  creative: Edit3,
  social: Circle,
  maintenance: CheckCircle,
};

export function Tasks() {
  const { calculateEU, euMultipliers } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const tasksRef = useRef<HTMLDivElement>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const form = useForm<CreateTaskForm>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: '',
      description: '',
      domain: 'academic',
      priority: 'medium',
      estimatedHours: 1,
      dueDate: '',
    },
  });

  // Fetch tasks
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: CreateTaskForm) => {
      // Send data directly - the backend will handle conversion
      return apiRequest('POST', '/api/tasks', taskData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      setIsCreateOpen(false);
      form.reset();
      toast({
        title: 'Task Created',
        description: 'Your new task has been added to the mission queue.',
      });
    },
    onError: () => {
      toast({
        title: 'Mission Failed',
        description: 'Failed to create task. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Complete task mutation
  const completeTaskMutation = useMutation({
    mutationFn: async ({ id, actualHours }: { id: string; actualHours: number }) => {
      return apiRequest('PATCH', `/api/tasks/${id}`, {
        isCompleted: true,
        actualHours,
        // completedAt is handled server-side for security
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: 'Mission Accomplished',
        description: 'XP and EU rewards have been calculated and added to your profile.',
      });
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: 'Task Removed',
        description: 'Task has been deleted from the mission queue.',
      });
    },
  });

  // Filter tasks
  const filteredTasks = tasks.filter((task: Task) => {
    if (filter === 'pending') return !task.isCompleted;
    if (filter === 'completed') return task.isCompleted;
    return true;
  });

  // Cinematic entrance animation
  useEffect(() => {
    if (tasksRef.current && filteredTasks.length > 0) {
      const taskCards = tasksRef.current.querySelectorAll('[data-task-card]');
      gsap.fromTo(taskCards,
        { y: 30, opacity: 0, rotationX: 15 },
        {
          y: 0,
          opacity: 1,
          rotationX: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power3.out'
        }
      );
    }
  }, [filteredTasks.length]);

  const onSubmit = (data: CreateTaskForm) => {
    createTaskMutation.mutate(data);
  };

  const handleCompleteTask = (task: Task) => {
    // Convert string hours to number for mutation
    const actualHours = typeof task.estimatedHours === 'string' ? parseFloat(task.estimatedHours) : task.estimatedHours;
    completeTaskMutation.mutate({ id: task.id, actualHours });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-orbitron font-bold text-foreground mb-2">
              Mission Control
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage your tasks and track progress through the command center
            </p>
          </div>
          
          <div className="flex gap-3">
            <TaskSuggestions />
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="gap-2" data-testid="button-create-task">
                  <Plus className="h-5 w-5" />
                  New Mission
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-orbitron">Create New Mission</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mission Title</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter task title..."
                            data-testid="input-task-title"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Optional task description..."
                            data-testid="input-task-description"
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="domain"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Domain</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-task-domain">
                                <SelectValue placeholder="Select domain" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="academic">Academic</SelectItem>
                              <SelectItem value="fitness">Fitness</SelectItem>
                              <SelectItem value="creative">Creative</SelectItem>
                              <SelectItem value="social">Social</SelectItem>
                              <SelectItem value="maintenance">Maintenance</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-task-priority">
                                <SelectValue placeholder="Select priority" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="estimatedHours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estimated Hours</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.5"
                              min="0.5"
                              max="24"
                              data-testid="input-task-hours"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Due Date</FormLabel>
                          <FormControl>
                            <Input 
                              type="date"
                              data-testid="input-task-due-date"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreateOpen(false)}
                      className="flex-1"
                      data-testid="button-cancel-task"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1" 
                      disabled={createTaskMutation.isPending}
                      data-testid="button-submit-task"
                    >
                      {createTaskMutation.isPending ? 'Creating...' : 'Create Mission'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'All Missions', count: tasks.length },
            { key: 'pending', label: 'Active', count: tasks.filter((t: Task) => !t.isCompleted).length },
            { key: 'completed', label: 'Completed', count: tasks.filter((t: Task) => t.isCompleted).length },
          ].map((tab) => (
            <Button
              key={tab.key}
              variant={filter === tab.key ? 'default' : 'outline'}
              onClick={() => setFilter(tab.key as typeof filter)}
              className="gap-2"
              data-testid={`button-filter-${tab.key}`}
            >
              {tab.label}
              <Badge variant="secondary" className="text-xs">
                {tab.count}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      {/* Tasks Grid */}
      <div ref={tasksRef} className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground">Loading missions...</div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-muted-foreground mb-4">
                {filter === 'all' ? 'No missions in the queue' : `No ${filter} missions`}
              </div>
              {filter === 'all' && (
                <Button onClick={() => setIsCreateOpen(true)} variant="outline">
                  Create your first mission
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task: Task) => {
            const DomainIcon = domainIcons[task.domain as keyof typeof domainIcons] || Target;
            // Convert string hours to number for calculation
            const estimatedHours = typeof task.estimatedHours === 'string' ? parseFloat(task.estimatedHours) : task.estimatedHours;
            const euValue = calculateEU(estimatedHours, task.domain as keyof typeof euMultipliers);
            
            return (
              <Card 
                key={task.id} 
                data-task-card
                className={`hover-elevate transition-all duration-300 ${
                  task.isCompleted ? 'opacity-75 bg-muted/20' : 'bg-card/95 backdrop-blur-sm'
                }`}
              >
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg border ${
                      task.isCompleted ? 'bg-green-500/20 border-green-500/30' : 'bg-primary/20 border-primary/30'
                    }`}>
                      <DomainIcon className={`h-4 w-4 ${
                        task.isCompleted ? 'text-green-400' : 'text-primary'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className={`text-lg ${
                          task.isCompleted ? 'line-through text-muted-foreground' : ''
                        }`}>
                          {task.title}
                        </CardTitle>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${priorityColors[task.priority as keyof typeof priorityColors]}`}
                        >
                          {task.priority}
                        </Badge>
                      </div>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {estimatedHours}h estimated
                        </div>
                        <div className="flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          {euValue.toFixed(1)} EU
                        </div>
                        {task.dueDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(task.dueDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {!task.isCompleted ? (
                      <Button
                        size="sm"
                        onClick={() => handleCompleteTask(task)}
                        disabled={completeTaskMutation.isPending}
                        className="gap-1"
                        data-testid={`button-complete-${task.id}`}
                      >
                        <CheckCircle className="h-3 w-3" />
                        Complete
                      </Button>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteTaskMutation.mutate(task.id)}
                      disabled={deleteTaskMutation.isPending}
                      data-testid={`button-delete-${task.id}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}