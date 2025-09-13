import React, { useEffect, useRef, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Target, Plus, TrendingUp, Award, Star, BookOpen, Dumbbell, Palette, Users, Settings, User } from 'lucide-react';
import { type Task, type Event, clientTaskSchema } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

interface QuarterViewProps {
  currentDate: Date;
  tasks: Task[];
  events: Event[];
  onDateSelect: (date: Date) => void;
  selectedDate: Date | null;
  onViewChange?: (view: 'month' | 'week' | 'day' | 'quarter') => void;
  onDateChange?: (date: Date) => void;
}

const domainColors = {
  academic: 'bg-primary/80 border-primary',
  fitness: 'bg-green-400/80 border-green-400',
  creative: 'bg-purple-400/80 border-purple-400',
  social: 'bg-pink-400/80 border-pink-400',
  maintenance: 'bg-gray-400/80 border-gray-400',
  personal: 'bg-cyan-400/80 border-cyan-400',
};

const domainIcons = {
  academic: BookOpen,
  fitness: Dumbbell,
  creative: Palette,
  social: Users,
  maintenance: Settings,
  personal: User,
};

const quarterColors = {
  Q1: 'bg-gradient-to-br from-emerald-500/20 to-green-600/20 border-emerald-400/30',
  Q2: 'bg-gradient-to-br from-blue-500/20 to-cyan-600/20 border-blue-400/30',
  Q3: 'bg-gradient-to-br from-amber-500/20 to-orange-600/20 border-amber-400/30',
  Q4: 'bg-gradient-to-br from-purple-500/20 to-violet-600/20 border-purple-400/30',
};

const quarterIcons = {
  Q1: Award,
  Q2: TrendingUp,
  Q3: Target,
  Q4: Calendar,
};

export function QuarterView({ currentDate, tasks, events, onDateSelect, selectedDate, onViewChange, onDateChange }: QuarterViewProps) {
  const quarterRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const currentYear = currentDate.getFullYear();
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [selectedQuarterForGoal, setSelectedQuarterForGoal] = useState<string>('Q1');
  const [goalData, setGoalData] = useState({
    title: '',
    description: '',
    domain: '',
    estimatedHours: 10,
    priority: 'medium'
  });

  // Goal creation mutation
  const createGoalMutation = useMutation({
    mutationFn: async (goalTaskData: any) => {
      // Validate data with client schema before sending
      const validatedData = clientTaskSchema.parse(goalTaskData);
      return apiRequest('POST', '/api/tasks', validatedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      setShowGoalDialog(false);
      setGoalData({ title: '', description: '', domain: '', estimatedHours: 10, priority: 'medium' });
      toast({
        title: 'Quarterly Goal Created',
        description: `Your ${selectedQuarterForGoal} strategic goal has been added to your mission queue.`,
      });
    },
    onError: (error) => {
      console.error('Goal creation failed:', error);
      toast({
        title: 'Goal Creation Failed',
        description: 'Failed to create quarterly goal. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Define quarters with their date ranges
  const quarters = useMemo(() => [
    {
      id: 'Q1',
      name: 'Q1 - New Beginnings',
      description: 'January - March',
      start: new Date(currentYear, 0, 1), // Jan 1
      end: new Date(currentYear, 2, 31), // Mar 31
      icon: quarterIcons.Q1,
      color: quarterColors.Q1,
    },
    {
      id: 'Q2',
      name: 'Q2 - Growth Phase',
      description: 'April - June',
      start: new Date(currentYear, 3, 1), // Apr 1
      end: new Date(currentYear, 5, 30), // Jun 30
      icon: quarterIcons.Q2,
      color: quarterColors.Q2,
    },
    {
      id: 'Q3',
      name: 'Q3 - Peak Performance',
      description: 'July - September',
      start: new Date(currentYear, 6, 1), // Jul 1
      end: new Date(currentYear, 8, 30), // Sep 30
      icon: quarterIcons.Q3,
      color: quarterColors.Q3,
    },
    {
      id: 'Q4',
      name: 'Q4 - Achievement',
      description: 'October - December',
      start: new Date(currentYear, 9, 1), // Oct 1
      end: new Date(currentYear, 11, 31), // Dec 31
      icon: quarterIcons.Q4,
      color: quarterColors.Q4,
    },
  ], [currentYear]);

  // Group tasks and events by quarter
  const quarterData = useMemo(() => {
    return quarters.map(quarter => {
      // Filter tasks for this quarter
      const quarterTasks = tasks.filter(task => {
        if (!task.dueDate) return false;
        const taskDate = new Date(task.dueDate);
        return taskDate >= quarter.start && taskDate <= quarter.end;
      });

      // Filter events for this quarter
      const quarterEvents = events.filter(event => {
        const eventDate = new Date(event.startTime);
        return eventDate >= quarter.start && eventDate <= quarter.end;
      });

      // Calculate statistics
      const completedTasks = quarterTasks.filter(task => task.isCompleted).length;
      const totalTasks = quarterTasks.length;
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      // Separate goals from regular tasks
      const goals = quarterTasks.filter(task => 
        task.description?.includes('#goal') || 
        task.priority === 'urgent' || 
        (task.estimatedHours && Number(task.estimatedHours) >= 20)
      );
      const regularTasks = quarterTasks.filter(task => 
        !task.description?.includes('#goal') && 
        task.priority !== 'urgent' && 
        (!task.estimatedHours || Number(task.estimatedHours) < 20)
      );

      // Group regular tasks by domain
      const domainGroups = regularTasks.reduce((acc, task) => {
        const domain = task.domain || 'personal';
        if (!acc[domain]) {
          acc[domain] = [];
        }
        acc[domain].push(task);
        return acc;
      }, {} as Record<string, Task[]>);

      // Group goals by domain
      const goalGroups = goals.reduce((acc, task) => {
        const domain = task.domain || 'personal';
        if (!acc[domain]) {
          acc[domain] = [];
        }
        acc[domain].push(task);
        return acc;
      }, {} as Record<string, Task[]>);

      const completedGoals = goals.filter(task => task.isCompleted).length;
      const totalGoals = goals.length;
      const goalCompletionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

      return {
        ...quarter,
        tasks: quarterTasks,
        regularTasks,
        goals,
        events: quarterEvents,
        completedTasks,
        totalTasks,
        completionRate,
        domainGroups,
        goalGroups,
        completedGoals,
        totalGoals,
        goalCompletionRate,
      };
    });
  }, [quarters, tasks, events]);

  // Determine current quarter based on today's date
  const currentQuarter = useMemo(() => {
    const today = new Date();
    return quarters.find(quarter => today >= quarter.start && today <= quarter.end)?.id || 'Q1';
  }, [quarters]);

  // Determine displayed quarter based on currentDate
  const displayedQuarter = useMemo(() => {
    return quarters.find(quarter => currentDate >= quarter.start && currentDate <= quarter.end)?.id || 'Q1';
  }, [quarters, currentDate]);

  // Check if we're viewing the current year
  const isCurrentYear = useMemo(() => {
    const today = new Date();
    return currentDate.getFullYear() === today.getFullYear();
  }, [currentDate]);

  // Helper function to handle goal creation
  const handleCreateGoal = () => {
    if (!goalData.title.trim() || !goalData.domain) return;
    
    // Find the selected quarter's end date for the goal
    const selectedQuarter = quarters.find(q => q.id === selectedQuarterForGoal);
    if (!selectedQuarter) return;
    
    // Prepare goal data for API
    const goalTaskData = {
      title: goalData.title,
      description: `${goalData.description}\n\n#goal #${selectedQuarterForGoal.toLowerCase()} #quarterly-strategic-planning`,
      domain: goalData.domain,
      priority: goalData.priority,
      estimatedHours: goalData.estimatedHours,
      dueDate: selectedQuarter.end.toISOString(),
    };
    
    // Create the goal through the API
    createGoalMutation.mutate(goalTaskData);
  };

  // GSAP Animations
  useEffect(() => {
    if (!quarterRef.current) return;
    
    // Use a small timeout to ensure DOM is fully rendered
    const timeoutId = setTimeout(() => {
      if (!quarterRef.current) return;
      
      const quarterCards = quarterRef.current.querySelectorAll('.quarter-card');
      const headerElements = quarterRef.current.querySelectorAll('.quarter-header');
      
      if (quarterCards && quarterCards.length > 0) {
        gsap.fromTo(quarterCards, 
          { opacity: 0, y: 50, rotationX: -15 },
          { 
            opacity: 1, 
            y: 0, 
            rotationX: 0,
            duration: 1.2, 
            stagger: 0.2,
            ease: "power3.out"
          }
        );
      }

      if (headerElements && headerElements.length > 0) {
        gsap.fromTo(headerElements,
          { opacity: 0, x: -30 },
          {
            opacity: 1,
            x: 0,
            duration: 0.8,
            stagger: 0.1,
            ease: "power2.out"
          }
        );
      }
    }, 50);
    
    return () => clearTimeout(timeoutId);
  }, [currentYear]);

  return (
    <div ref={quarterRef} className="h-full">
      {/* Year Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2 font-orbitron">
              {currentYear} - Mission Overview
            </h1>
            <p className="text-lg text-muted-foreground">
              Strategic quarterly planning and goal tracking
            </p>
          </div>
          <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="lg"
                className="gap-3 bg-primary/10 border-primary/20 hover:bg-primary/20 text-lg px-6 py-3 glow-subtle"
              >
                <Star className="h-5 w-5" />
                Set Quarterly Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Star className="h-6 w-6 text-primary" />
                  Create Quarterly Goal
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6 mt-6">
                <div className="space-y-2">
                  <Label>Target Quarter</Label>
                  <Select value={selectedQuarterForGoal} onValueChange={setSelectedQuarterForGoal}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {quarters.map(quarter => (
                        <SelectItem key={quarter.id} value={quarter.id}>
                          {quarter.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Goal Title</Label>
                  <Input
                    placeholder="Enter your quarterly goal..."
                    value={goalData.title}
                    onChange={(e) => setGoalData(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Describe your goal and success criteria..."
                    value={goalData.description}
                    onChange={(e) => setGoalData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Domain</Label>
                    <Select value={goalData.domain} onValueChange={(value) => setGoalData(prev => ({ ...prev, domain: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select domain" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(domainColors).map(domain => {
                          const Icon = domainIcons[domain as keyof typeof domainIcons];
                          return (
                            <SelectItem key={domain} value={domain}>
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                <span className="capitalize">{domain}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={goalData.priority} onValueChange={(value) => setGoalData(prev => ({ ...prev, priority: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowGoalDialog(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateGoal}
                    disabled={!goalData.title.trim() || !goalData.domain}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    Create Goal
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Quarter Grid */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
      >
        {quarterData.map((quarter, index) => {
          const IconComponent = quarter.icon;
          const isCurrentQuarter = quarter.id === currentQuarter && isCurrentYear;
          const isDisplayedQuarter = quarter.id === displayedQuarter;
          
          return (
            <motion.div
              key={quarter.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.15 }}
              className="quarter-card"
            >
              <Card className={`${quarter.color} backdrop-blur-sm border-2 overflow-hidden h-full
                ${isCurrentQuarter ? 'ring-2 ring-primary/50 shadow-2xl shadow-primary/20' : ''}`}>
                <div className="p-8">
                  {/* Quarter Header */}
                  <div className="quarter-header flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-full transition-all duration-300 ${
                        isCurrentQuarter 
                          ? 'bg-primary/20 text-primary ring-2 ring-primary/30' 
                          : isDisplayedQuarter
                          ? 'bg-foreground/15 text-foreground'
                          : 'bg-white/10 text-white'
                      }`}>
                        <IconComponent className="h-8 w-8" />
                      </div>
                      <div>
                        <h2 className={`text-2xl font-bold mb-1 font-orbitron ${
                          isDisplayedQuarter && !isCurrentQuarter 
                            ? 'text-foreground' 
                            : 'text-primary-foreground'
                        }`}>
                          {quarter.name}
                        </h2>
                        <p className={`text-lg ${
                          isDisplayedQuarter && !isCurrentQuarter 
                            ? 'text-muted-foreground' 
                            : 'text-white/80'
                        }`}>
                          {quarter.description}
                        </p>
                      </div>
                    </div>
                    {isCurrentQuarter && (
                      <Badge className="bg-primary text-primary-foreground text-sm font-semibold px-3 py-1">
                        CURRENT
                      </Badge>
                    )}
                  </div>

                  {/* Progress Overview */}
                  <div className="mb-6">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {/* Tasks Progress */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-sm font-medium ${
                            isDisplayedQuarter && !isCurrentQuarter ? 'text-foreground' : 'text-white'
                          }`}>Tasks</span>
                          <span className={`text-lg font-bold ${
                            isDisplayedQuarter && !isCurrentQuarter ? 'text-foreground' : 'text-white'
                          }`}>
                            {Math.round(quarter.completionRate)}%
                          </span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${quarter.completionRate}%` }}
                            transition={{ duration: 1.5, delay: index * 0.2 + 0.5 }}
                            className="bg-gradient-to-r from-blue-400 to-cyan-500 h-2 rounded-full shadow-lg"
                          />
                        </div>
                        <div className={`text-xs mt-1 ${
                          isDisplayedQuarter && !isCurrentQuarter ? 'text-muted-foreground' : 'text-white/70'
                        }`}>
                          {quarter.completedTasks} / {quarter.totalTasks} tasks
                        </div>
                      </div>
                      
                      {/* Goals Progress */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-sm font-medium ${
                            isDisplayedQuarter && !isCurrentQuarter ? 'text-foreground' : 'text-white'
                          }`}>Goals</span>
                          <span className={`text-lg font-bold ${
                            isDisplayedQuarter && !isCurrentQuarter ? 'text-foreground' : 'text-white'
                          }`}>
                            {Math.round(quarter.goalCompletionRate)}%
                          </span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${quarter.goalCompletionRate}%` }}
                            transition={{ duration: 1.5, delay: index * 0.2 + 0.7 }}
                            className="bg-gradient-to-r from-emerald-400 to-green-500 h-2 rounded-full shadow-lg"
                          />
                        </div>
                        <div className={`text-xs mt-1 ${
                          isDisplayedQuarter && !isCurrentQuarter ? 'text-muted-foreground' : 'text-white/70'
                        }`}>
                          {quarter.completedGoals} / {quarter.totalGoals} goals
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Strategic Goals */}
                  <div className="mb-6">
                    <h3 className={`text-lg font-semibold mb-3 flex items-center gap-2 ${
                      isDisplayedQuarter && !isCurrentQuarter ? 'text-foreground' : 'text-white'
                    }`}>
                      <Star className="h-5 w-5" />
                      Strategic Goals
                    </h3>
                    <div className="space-y-2">
                      {Object.entries(quarter.goalGroups).map(([domain, goals]) => {
                        const Icon = domainIcons[domain as keyof typeof domainIcons];
                        return (
                          <motion.div
                            key={`goal-${domain}`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            className={`rounded-lg p-3 border ${
                              isDisplayedQuarter && !isCurrentQuarter 
                                ? 'bg-background/20 border-border/30' 
                                : 'bg-white/10 border-white/20'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`p-1.5 rounded-md ${
                                  domainColors[domain as keyof typeof domainColors] || 'bg-gray-400 border-gray-400'
                                }`}>
                                  <Icon className="h-3 w-3 text-white" />
                                </div>
                                <span className={`capitalize font-medium text-sm ${
                                  isDisplayedQuarter && !isCurrentQuarter ? 'text-foreground' : 'text-white'
                                }`}>
                                  {domain}
                                </span>
                              </div>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  isDisplayedQuarter && !isCurrentQuarter 
                                    ? 'text-primary border-primary/40 bg-primary/10' 
                                    : 'text-emerald-300 border-emerald-400/40 bg-emerald-500/20'
                                }`}
                              >
                                {goals.length} goals
                              </Badge>
                            </div>
                            <div className={`text-xs mt-2 ${
                              isDisplayedQuarter && !isCurrentQuarter ? 'text-muted-foreground' : 'text-white/70'
                            }`}>
                              {goals.filter(g => g.isCompleted).length} completed
                            </div>
                          </motion.div>
                        );
                      })}
                      {Object.keys(quarter.goalGroups).length === 0 && (
                        <div className={`text-center py-3 text-sm ${
                          isDisplayedQuarter && !isCurrentQuarter ? 'text-muted-foreground' : 'text-white/60'
                        }`}>
                          <p>No strategic goals set</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`mt-2 text-xs ${
                              isDisplayedQuarter && !isCurrentQuarter
                                ? 'text-primary hover:bg-primary/10'
                                : 'text-emerald-300 hover:bg-white/10'
                            }`}
                            onClick={() => {
                              setSelectedQuarterForGoal(quarter.id);
                              setShowGoalDialog(true);
                            }}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Set Goal
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Regular Tasks Summary */}
                  <div className="mb-6">
                    <h3 className={`text-lg font-semibold mb-3 ${
                      isDisplayedQuarter && !isCurrentQuarter ? 'text-foreground' : 'text-white'
                    }`}>Task Breakdown</h3>
                    <div className="space-y-2">
                      {Object.entries(quarter.domainGroups).map(([domain, domainTasks]) => {
                        const Icon = domainIcons[domain as keyof typeof domainIcons];
                        return (
                          <motion.div
                            key={domain}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <Icon className={`h-4 w-4 ${
                                isDisplayedQuarter && !isCurrentQuarter ? 'text-foreground' : 'text-white'
                              }`} />
                              <span className={`capitalize font-medium ${
                                isDisplayedQuarter && !isCurrentQuarter ? 'text-foreground' : 'text-white'
                              }`}>
                                {domain}
                              </span>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={`${
                                isDisplayedQuarter && !isCurrentQuarter 
                                  ? 'text-foreground border-border/40 bg-background/10' 
                                  : 'text-white border-white/30 bg-white/10'
                              }`}
                            >
                              {domainTasks.length} tasks
                            </Badge>
                          </motion.div>
                        );
                      })}
                      {Object.keys(quarter.domainGroups).length === 0 && (
                        <p className={`text-center py-4 text-sm ${
                          isDisplayedQuarter && !isCurrentQuarter ? 'text-muted-foreground' : 'text-white/60'
                        }`}>
                          No regular tasks planned
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Events Summary */}
                  {quarter.events.length > 0 && (
                    <div className="mb-6">
                      <h3 className={`text-lg font-semibold mb-3 ${
                        isDisplayedQuarter && !isCurrentQuarter ? 'text-foreground' : 'text-white'
                      }`}>Key Events</h3>
                      <div className="space-y-2">
                        {quarter.events.slice(0, 3).map(event => (
                          <motion.div
                            key={event.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            className={`rounded-lg p-3 backdrop-blur-sm ${
                              isDisplayedQuarter && !isCurrentQuarter ? 'bg-background/20' : 'bg-white/10'
                            }`}
                          >
                            <div className={`font-medium truncate text-sm ${
                              isDisplayedQuarter && !isCurrentQuarter ? 'text-foreground' : 'text-white'
                            }`}>
                              {event.title}
                            </div>
                            <div className={`text-xs ${
                              isDisplayedQuarter && !isCurrentQuarter ? 'text-muted-foreground' : 'text-white/70'
                            }`}>
                              {new Date(event.startTime).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </div>
                          </motion.div>
                        ))}
                        {quarter.events.length > 3 && (
                          <p className={`text-sm text-center ${
                            isDisplayedQuarter && !isCurrentQuarter ? 'text-muted-foreground' : 'text-white/60'
                          }`}>
                            +{quarter.events.length - 3} more events
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: index * 0.1 + 0.8 }}
                  >
                    <Button
                      variant="ghost"
                      className={`w-full border transition-all duration-300 text-lg py-3 ${
                        isDisplayedQuarter && !isCurrentQuarter
                          ? 'text-foreground border-border/40 hover:bg-background/20 hover:border-border/60'
                          : 'text-white border-white/30 hover:bg-white/10 hover:border-white/50'
                      }`}
                      onClick={() => {
                        if (onDateChange && onViewChange) {
                          onDateChange(quarter.start);
                          onViewChange('month');
                        } else {
                          onDateSelect(quarter.start);
                        }
                      }}
                    >
                      View {quarter.id} Details
                    </Button>
                  </motion.div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Year Summary Footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.2 }}
        className="mt-8"
      >
        <Card className="bg-card/95 backdrop-blur-sm border-border/50">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">
                  {quarterData.reduce((sum, q) => sum + q.totalTasks, 0)}
                </div>
                <div className="text-lg text-muted-foreground">Total Tasks</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-500 mb-1">
                  {quarterData.reduce((sum, q) => sum + q.completedTasks, 0)}
                </div>
                <div className="text-lg text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-500 mb-1">
                  {quarterData.reduce((sum, q) => sum + q.events.length, 0)}
                </div>
                <div className="text-lg text-muted-foreground">Events</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-500 mb-1">
                  {Math.round(quarterData.reduce((sum, q) => sum + q.completionRate, 0) / 4)}%
                </div>
                <div className="text-lg text-muted-foreground">Avg Progress</div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}