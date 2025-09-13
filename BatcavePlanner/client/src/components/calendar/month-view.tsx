import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { type Task, type Event } from '@shared/schema';

interface MonthViewProps {
  currentDate: Date;
  tasks: Task[];
  events: Event[];
  onDateSelect: (date: Date) => void;
  selectedDate: Date | null;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const priorityColors = {
  low: 'bg-blue-400/20 border-blue-400/40',
  medium: 'bg-yellow-400/20 border-yellow-400/40', 
  high: 'bg-orange-400/20 border-orange-400/40',
  urgent: 'bg-red-400/20 border-red-400/40',
};

const domainColors = {
  academic: 'bg-primary/20 border-primary/40',
  fitness: 'bg-green-400/20 border-green-400/40',
  creative: 'bg-purple-400/20 border-purple-400/40',
  social: 'bg-pink-400/20 border-pink-400/40',
  maintenance: 'bg-gray-400/20 border-gray-400/40',
  personal: 'bg-cyan-400/20 border-cyan-400/40',
};

export function MonthView({ currentDate, tasks, events, onDateSelect, selectedDate }: MonthViewProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  // Generate calendar grid
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // First day of the month and its day of week
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay();
    
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Previous month's trailing days
    const prevMonth = new Date(year, month - 1, 0);
    const daysInPrevMonth = prevMonth.getDate();
    
    const days: Array<{
      date: Date;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      tasks: Task[];
      events: Event[];
    }> = [];

    // Add previous month's trailing days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, daysInPrevMonth - i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        tasks: [],
        events: [],
      });
    }

    // Add current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isToday = new Date().toDateString() === date.toDateString();
      const isSelected = selectedDate?.toDateString() === date.toDateString();
      
      // Filter tasks for this day
      const dayTasks = tasks.filter(task => {
        if (!task.dueDate) return false;
        const taskDate = new Date(task.dueDate);
        return taskDate.toDateString() === date.toDateString();
      });

      // Filter events for this day (once we have events)
      const dayEvents = events.filter(event => {
        const startDate = new Date(event.startTime);
        return startDate.toDateString() === date.toDateString();
      });

      days.push({
        date,
        isCurrentMonth: true,
        isToday,
        isSelected,
        tasks: dayTasks,
        events: dayEvents,
      });
    }

    // Add next month's leading days
    const totalCells = 42; // 6 weeks × 7 days
    const remainingCells = totalCells - days.length;
    for (let day = 1; day <= remainingCells; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        tasks: [],
        events: [],
      });
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  // Animate cells on mount and date changes
  useEffect(() => {
    if (gridRef.current) {
      const cells = gridRef.current.querySelectorAll('.calendar-cell');
      
      gsap.fromTo(cells, 
        { 
          opacity: 0, 
          scale: 0.8,
          y: 20,
        },
        { 
          opacity: 1, 
          scale: 1,
          y: 0,
          duration: 0.6,
          stagger: {
            amount: 0.8,
            grid: [6, 7],
            from: "center"
          },
          ease: 'power3.out'
        }
      );
    }
  }, [currentDate]);

  const TaskIndicator = ({ task }: { task: Task }) => (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, delay: Math.random() * 0.2 }}
      className={`
        h-1.5 rounded-full mb-0.5 
        ${domainColors[task.domain as keyof typeof domainColors] || domainColors.personal}
        ${task.isCompleted ? 'opacity-50' : ''}
      `}
      title={`${task.title} (${task.domain})`}
    />
  );

  const EventIndicator = ({ event }: { event: Event }) => (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, delay: Math.random() * 0.2 }}
      className={`
        h-1.5 rounded-full mb-0.5 border
        ${domainColors[event.category as keyof typeof domainColors] || domainColors.personal}
      `}
      title={`${event.title} (${event.category})`}
    />
  );

  return (
    <div className="space-y-4">
      {/* Days header */}
      <div className="grid grid-cols-7 gap-2">
        {DAYS.map((day) => (
          <div 
            key={day} 
            className="text-center font-medium text-muted-foreground py-3 text-sm tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div ref={gridRef} className="grid grid-cols-7 gap-2">
        {calendarDays.map((day, index) => {
          const totalItems = day.tasks.length + day.events.length;
          const completedTasks = day.tasks.filter(t => t.isCompleted).length;
          const pendingTasks = day.tasks.length - completedTasks;
          
          return (
            <motion.div
              key={`${day.date.toISOString()}-${index}`}
              className="calendar-cell"
              whileHover={{ 
                scale: 1.02,
                transition: { duration: 0.2 }
              }}
              whileTap={{ scale: 0.98 }}
            >
              <Card 
                className={`
                  h-24 p-2 cursor-pointer transition-all duration-300 overflow-hidden
                  ${day.isCurrentMonth 
                    ? 'bg-card/95 hover:bg-card border-border/50 hover:border-border' 
                    : 'bg-muted/30 border-muted/30 text-muted-foreground'
                  }
                  ${day.isToday 
                    ? 'ring-2 ring-primary/50 bg-primary/5' 
                    : ''
                  }
                  ${day.isSelected 
                    ? 'ring-2 ring-accent/50 bg-accent/5' 
                    : ''
                  }
                  ${totalItems > 0 ? 'glow-subtle' : ''}
                `}
                onClick={() => onDateSelect(day.date)}
              >
                <div className="flex flex-col h-full">
                  {/* Date number */}
                  <div className={`
                    text-sm font-medium mb-1
                    ${day.isToday ? 'text-primary font-bold' : ''}
                    ${day.isSelected ? 'text-accent font-bold' : ''}
                  `}>
                    {day.date.getDate()}
                  </div>

                  {/* Task and event indicators */}
                  <div className="flex-1 space-y-0.5 overflow-hidden">
                    {/* Show up to 3 task indicators */}
                    {day.tasks.slice(0, 3).map((task, taskIndex) => (
                      <TaskIndicator key={`task-${task.id}-${taskIndex}`} task={task} />
                    ))}
                    
                    {/* Show up to 3 event indicators */}
                    {day.events.slice(0, 3).map((event, eventIndex) => (
                      <EventIndicator key={`event-${event.id}-${eventIndex}`} event={event} />
                    ))}

                    {/* Show overflow indicator */}
                    {totalItems > 3 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-muted-foreground font-medium"
                      >
                        +{totalItems - 3} more
                      </motion.div>
                    )}
                  </div>

                  {/* Task summary for current month days */}
                  {day.isCurrentMonth && totalItems > 0 && (
                    <div className="flex gap-1 text-xs text-muted-foreground mt-1">
                      {pendingTasks > 0 && (
                        <Badge 
                          variant="outline" 
                          className="text-xs px-1 py-0 h-4 border-primary/30 text-primary/80"
                        >
                          {pendingTasks}
                        </Badge>
                      )}
                      {completedTasks > 0 && (
                        <Badge 
                          variant="outline" 
                          className="text-xs px-1 py-0 h-4 border-green-400/30 text-green-400/80"
                        >
                          ✓{completedTasks}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}