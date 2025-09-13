import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Filter, 
  Grid3x3, 
  AlignJustify, 
  Clock, 
  Grid,
  Lightbulb
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useTheme } from '@/lib/theme-context';
import { type Task, type Event } from '@shared/schema';
import { MonthView } from '@/components/calendar/month-view';
import { WeekView } from '@/components/calendar/week-view';
import { DayView } from '@/components/calendar/day-view';
import { QuarterView } from '@/components/calendar/quarter-view';

type CalendarView = 'month' | 'week' | 'day' | 'quarter';

interface CalendarData {
  tasks: Task[];
  events: Event[];
}

const viewIcons = {
  month: Grid3x3,
  week: AlignJustify,
  day: Clock,
  quarter: Grid,
};

export function Calendar() {
  const { theme } = useTheme();
  const [currentView, setCurrentView] = useState<CalendarView>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  
  const calendarRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Fetch tasks using the default queryFn pattern
  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
  });

  // For now, we'll use empty events array since the API endpoint doesn't exist yet
  const events: Event[] = [];
  
  const calendarData = { tasks, events };
  const isLoading = tasksLoading;

  // Entrance animation
  useEffect(() => {
    if (calendarRef.current) {
      // Background glow with radar sweep
      gsap.fromTo(calendarRef.current, 
        { 
          opacity: 0,
          background: 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 70%)'
        },
        { 
          opacity: 1,
          duration: 1.2,
          ease: 'power3.out',
          background: 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.05) 0%, transparent 70%)'
        }
      );
      
      // Radar sweep animation
      const radarElement = document.querySelector('.radar-sweep');
      if (radarElement) {
        gsap.fromTo(radarElement,
          { rotation: 0, opacity: 0.8 },
          { 
            rotation: 360, 
            opacity: 0, 
            duration: 2, 
            ease: 'power2.out',
            repeat: 0
          }
        );
      }
    }
  }, []);

  // View transition animation
  useEffect(() => {
    if (gridRef.current) {
      const cells = gridRef.current.querySelectorAll('.calendar-cell');
      gsap.fromTo(cells, 
        { 
          opacity: 0, 
          scale: 0.8,
          rotationY: -15 
        },
        { 
          opacity: 1, 
          scale: 1,
          rotationY: 0,
          duration: 0.6,
          stagger: 0.02,
          ease: 'power3.out'
        }
      );
    }
  }, [currentView, currentDate]);

  const navigateDate = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      switch (currentView) {
        case 'month':
          newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
          break;
        case 'week':
          newDate.setDate(prev.getDate() + (direction === 'next' ? 7 : -7));
          break;
        case 'day':
          newDate.setDate(prev.getDate() + (direction === 'next' ? 1 : -1));
          break;
        case 'quarter':
          newDate.setMonth(prev.getMonth() + (direction === 'next' ? 3 : -3));
          break;
      }
      return newDate;
    });
  };

  const formatDateHeader = () => {
    const options: Intl.DateTimeFormatOptions = {};
    switch (currentView) {
      case 'month':
        options.year = 'numeric';
        options.month = 'long';
        break;
      case 'week':
        const weekStart = new Date(currentDate);
        const weekEnd = new Date(currentDate);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      case 'day':
        options.weekday = 'long';
        options.year = 'numeric';
        options.month = 'long';
        options.day = 'numeric';
        break;
      case 'quarter':
        const quarter = Math.floor(currentDate.getMonth() / 3) + 1;
        return `Q${quarter} ${currentDate.getFullYear()}`;
    }
    return currentDate.toLocaleDateString('en-US', options);
  };

  const ViewButton = ({ view, label }: { view: CalendarView; label: string }) => {
    const Icon = viewIcons[view];
    return (
      <Button
        variant={currentView === view ? "default" : "ghost"}
        size="sm"
        onClick={() => setCurrentView(view)}
        className={`gap-2 transition-all duration-300 ${
          currentView === view 
            ? 'bg-primary text-primary-foreground glow-primary' 
            : 'hover:bg-primary/10'
        }`}
      >
        <Icon className="h-4 w-4" />
        {label}
      </Button>
    );
  };

  return (
    <div ref={calendarRef} className="p-6 min-h-screen relative overflow-hidden">
      {/* Radar Sweep Background Effect */}
      <div className="radar-sweep absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/2 left-1/2 w-96 h-96 -translate-x-1/2 -translate-y-1/2 border border-primary/30 rounded-full"></div>
      </div>

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-4xl font-orbitron font-bold text-foreground mb-2 bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
            Temporal Command Center
          </h1>
          <div className="h-0.5 w-32 bg-gradient-to-r from-primary to-transparent"></div>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsQuickAddOpen(true)}
            className="gap-2 bg-primary/10 border-primary/20 hover:bg-primary/20 glow-subtle"
          >
            <Plus className="h-4 w-4" />
            Quick Add
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={`gap-2 transition-all duration-300 ${
              showFilters 
                ? 'bg-primary/20 border-primary/40' 
                : 'bg-secondary/10 border-border/20 hover:bg-secondary/20'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="gap-2 bg-accent/10 border-accent/20 hover:bg-accent/20"
          >
            <Lightbulb className="h-4 w-4" />
            ALFRED Schedule
          </Button>
        </div>
      </motion.div>

      {/* View Controls */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="flex items-center justify-between mb-6"
      >
        <div className="flex items-center gap-2">
          <ViewButton view="month" label="Month" />
          <ViewButton view="week" label="Week" />
          <ViewButton view="day" label="Day" />
          <ViewButton view="quarter" label="Quarter" />
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateDate('prev')}
              className="hover:bg-primary/10"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="min-w-[200px] text-center">
              <h2 className="text-lg font-semibold text-foreground">
                {formatDateHeader()}
              </h2>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateDate('next')}
              className="hover:bg-primary/10"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
            className="text-primary hover:bg-primary/10"
          >
            Today
          </Button>
        </div>
      </motion.div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <Card className="bg-card/95 backdrop-blur-sm border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="text-sm font-medium text-muted-foreground">Filter by:</span>
                  <div className="flex gap-2 flex-wrap">
                    {['academic', 'fitness', 'creative', 'social', 'maintenance', 'personal'].map((category) => (
                      <Badge
                        key={category}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary/10 capitalize"
                      >
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Calendar Grid */}
      <motion.div
        ref={gridRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="relative"
      >
        <Card className="bg-card/95 backdrop-blur-sm border-border/50 overflow-hidden">
          <CardContent className="p-6">
            {currentView === 'month' ? (
              <MonthView
                currentDate={currentDate}
                tasks={tasks}
                events={events}
                onDateSelect={setSelectedDate}
                selectedDate={selectedDate}
              />
            ) : currentView === 'week' ? (
              <WeekView
                currentDate={currentDate}
                tasks={tasks}
                events={events}
                onDateSelect={setSelectedDate}
                selectedDate={selectedDate}
              />
            ) : currentView === 'day' ? (
              <DayView
                currentDate={currentDate}
                tasks={tasks}
                events={events}
                onDateSelect={setSelectedDate}
                selectedDate={selectedDate}
              />
            ) : currentView === 'quarter' ? (
              <QuarterView
                currentDate={currentDate}
                tasks={tasks}
                events={events}
                onDateSelect={setSelectedDate}
                selectedDate={selectedDate}
                onViewChange={setCurrentView}
                onDateChange={setCurrentDate}
              />
            ) : null}
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Add Modal placeholder */}
      {isQuickAddOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="w-96 bg-card/95 backdrop-blur-sm border-border/50">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Add</h3>
              <p className="text-muted-foreground mb-4">Quick add functionality coming soon...</p>
              <Button 
                onClick={() => setIsQuickAddOpen(false)}
                className="w-full"
              >
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}