import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Plus } from 'lucide-react';
import { type Task, type Event } from '@shared/schema';

interface WeekViewProps {
  currentDate: Date;
  tasks: Task[];
  events: Event[];
  onDateSelect: (date: Date) => void;
  selectedDate: Date | null;
}

const domainColors = {
  academic: 'bg-primary/80 border-primary',
  fitness: 'bg-green-400/80 border-green-400',
  creative: 'bg-purple-400/80 border-purple-400',
  social: 'bg-pink-400/80 border-pink-400',
  maintenance: 'bg-gray-400/80 border-gray-400',
  personal: 'bg-cyan-400/80 border-cyan-400',
};

const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };

// Time utilities for positioning
const HOUR_HEIGHT = 60; // 60px per hour
const START_HOUR = 6; // 6 AM
const END_HOUR = 23; // 11 PM
const TOTAL_HOURS = END_HOUR - START_HOUR + 1;
const MIN_EVENT_HEIGHT = 20;

type TimePosition = {
  top: number;
  height: number;
  lane: number;
  maxLanes?: number;
};

type PositionedEvent = Omit<Event, 'startTime' | 'endTime'> & TimePosition & {
  startTime: string; // Converted from Date for positioning calculations
  endTime: string | null; // Converted from Date for positioning calculations
};
type PositionedTask = Task & TimePosition & {
  startTime: string; // Converted from dueDate for positioning calculations
};

// Unified type for lane allocation
type TimedItem = {
  id: string;
  type: 'event' | 'task';
  startTime: string;
  endTime?: string;
  data: Event | Task;
};

export function WeekView({ currentDate, tasks, events, onDateSelect, selectedDate }: WeekViewProps) {
  const weekRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Get week start (Sunday) and generate 7 days
  const getWeekDays = () => {
    const weekStart = new Date(currentDate);
    const day = weekStart.getDay();
    weekStart.setDate(weekStart.getDate() - day);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const weekDays = getWeekDays();

  // Generate hours for timeline
  const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => i + START_HOUR);

  // Time calculation utilities
  const getMinutesFromMidnight = (date: Date): number => {
    return date.getHours() * 60 + date.getMinutes();
  };

  const calculateTimePosition = (startTime: Date, endTime?: Date): { top: number; height: number } => {
    const startMinutes = getMinutesFromMidnight(startTime);
    const startHourOffset = Math.max(0, (startTime.getHours() - START_HOUR) * 60 + startTime.getMinutes());
    const top = (startHourOffset / 60) * HOUR_HEIGHT;
    
    let height = MIN_EVENT_HEIGHT;
    if (endTime) {
      const endMinutes = getMinutesFromMidnight(endTime);
      const durationMinutes = endMinutes - startMinutes;
      height = Math.max(MIN_EVENT_HEIGHT, (durationMinutes / 60) * HOUR_HEIGHT);
    }
    
    return { top, height };
  };

  // Overlap detection and lane allocation
  const allocateLanes = <T extends { startTime: string; endTime?: string }>(items: T[]): (T & { lane: number; maxLanes: number })[] => {
    const sortedItems = [...items].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    const positioned: (T & { lane: number; maxLanes: number })[] = [];
    
    sortedItems.forEach((item) => {
      const itemStart = new Date(item.startTime).getTime();
      const itemEnd = item.endTime ? new Date(item.endTime).getTime() : itemStart + (60 * 60 * 1000); // Default 1 hour
      
      // Find conflicting items
      const conflicts = positioned.filter(existing => {
        const existingStart = new Date(existing.startTime).getTime();
        const existingEnd = existing.endTime ? new Date(existing.endTime).getTime() : existingStart + (60 * 60 * 1000);
        return (itemStart < existingEnd && itemEnd > existingStart);
      });
      
      // Find available lane
      const usedLanes = conflicts.map(c => c.lane);
      let lane = 0;
      while (usedLanes.includes(lane)) {
        lane++;
      }
      
      const maxLanes = Math.max(lane + 1, ...conflicts.map(c => c.maxLanes));
      
      // Update max lanes for all conflicting items
      conflicts.forEach(conflict => {
        conflict.maxLanes = maxLanes;
      });
      
      positioned.push({ ...item, lane, maxLanes });
    });
    
    return positioned;
  };

  // Get and position tasks and events for the week
  const positionedData = useMemo(() => {
    const weekData: Record<string, { events: PositionedEvent[]; tasks: PositionedTask[]; allDayTasks: Task[] }> = {};

    weekDays.forEach((date) => {
      const dateKey = date.toDateString();
      
      // Filter events for this day
      const dayEvents = events.filter(event => {
        const startDate = new Date(event.startTime);
        return startDate.toDateString() === dateKey;
      });
      
      // Filter tasks for this day  
      const dayTasks = tasks.filter(task => {
        if (!task.dueDate) return false;
        const taskDate = new Date(task.dueDate);
        return taskDate.toDateString() === dateKey;
      });
      
      // Separate timed tasks from all-day tasks
      const timedTasks = dayTasks.filter(task => {
        if (!task.dueDate) return false;
        const taskDate = new Date(task.dueDate);
        const hours = taskDate.getHours();
        return hours >= START_HOUR && hours <= END_HOUR;
      });
      
      const allDayTasks = dayTasks.filter(task => {
        if (!task.dueDate) return true;
        const taskDate = new Date(task.dueDate);
        const hours = taskDate.getHours();
        return hours < START_HOUR || hours > END_HOUR;
      });
      
      // Create unified list of timed items for shared lane allocation
      const timedItems: TimedItem[] = [
        // Add events
        ...dayEvents.map(event => ({
          id: event.id,
          type: 'event' as const,
          startTime: event.startTime.toString(),
          endTime: event.endTime?.toString(),
          data: event
        })),
        // Add timed tasks
        ...timedTasks.map(task => ({
          id: task.id,
          type: 'task' as const,
          startTime: task.dueDate!.toString(),
          endTime: undefined,
          data: task
        }))
      ];
      
      // Allocate lanes for all timed items together
      const timedItemsWithLanes = allocateLanes(timedItems);
      
      // Separate events and tasks with shared lane info
      const positionedEvents: PositionedEvent[] = [];
      const positionedTasks: PositionedTask[] = [];
      
      timedItemsWithLanes.forEach(item => {
        if (item.type === 'event') {
          const event = item.data as Event;
          const { top, height } = calculateTimePosition(
            new Date(item.startTime), 
            item.endTime ? new Date(item.endTime) : undefined
          );
          positionedEvents.push({
            ...event,
            top,
            height,
            lane: item.lane,
            maxLanes: item.maxLanes,
            startTime: item.startTime,
            endTime: item.endTime || null
          });
        } else {
          const task = item.data as Task;
          const { top, height } = calculateTimePosition(new Date(item.startTime));
          positionedTasks.push({
            ...task,
            top,
            height: Math.max(height, 30),
            lane: item.lane,
            maxLanes: item.maxLanes,
            startTime: item.startTime
          });
        }
      });
      
      weekData[dateKey] = {
        events: positionedEvents,
        tasks: positionedTasks,
        allDayTasks: allDayTasks.sort((a, b) => {
          const priorityDiff = priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder];
          return priorityDiff;
        })
      };
    });
    
    return weekData;
  }, [tasks, events, weekDays]);

  // Current time indicator position
  const currentTimePosition = useMemo(() => {
    const now = new Date();
    if (now.getHours() < START_HOUR || now.getHours() > END_HOUR) {
      return null;
    }
    const { top } = calculateTimePosition(now);
    return top;
  }, [currentTime]);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Entrance animation
  useEffect(() => {
    if (weekRef.current && timelineRef.current) {
      const tl = gsap.timeline();
      
      // Animate timeline header
      const weekHeader = weekRef.current.querySelector('.week-header');
      if (weekHeader) {
        tl.fromTo(weekHeader,
          { opacity: 0, y: -20 },
          { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
        );
      }

      // Animate time grid
      const timeGrid = timelineRef.current.querySelector('.time-grid');
      if (timeGrid) {
        tl.fromTo(timeGrid,
          { opacity: 0, scale: 0.95 },
          { opacity: 1, scale: 1, duration: 0.8, ease: 'power3.out' },
          weekHeader ? '-=0.3' : '0'
        );
      }

      // Animate time labels
      const timeLabels = timelineRef.current.querySelectorAll('.time-label');
      if (timeLabels.length > 0) {
        tl.fromTo(timeLabels,
          { opacity: 0, x: -20 },
          {
            opacity: 1,
            x: 0,
            duration: 0.4,
            stagger: 0.03,
            ease: 'power2.out'
          },
          (weekHeader || timeGrid) ? '-=0.5' : '0'
        );
      }

      // Animate day headers
      const dayHeaders = weekRef.current.querySelectorAll('.day-header');
      if (dayHeaders.length > 0) {
        tl.fromTo(dayHeaders,
          { opacity: 0, y: -10 },
          { 
            opacity: 1, 
            y: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: 'power3.out'
          },
          (weekHeader || timeGrid || timeLabels.length > 0) ? '-=0.6' : '0'
        );
      }
    }
  }, [currentDate]);

  // Component for positioned events
  const PositionedEventCard = ({ event, maxLanes = 1 }: { event: PositionedEvent; maxLanes?: number }) => {
    const width = maxLanes > 1 ? `${100 / maxLanes}%` : '100%';
    const left = maxLanes > 1 ? `${(event.lane / maxLanes) * 100}%` : '0%';
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, delay: Math.random() * 0.2 }}
        whileHover={{ scale: 1.02, zIndex: 10 }}
        className="absolute cursor-pointer transition-all duration-300"
        style={{
          top: `${event.top}px`,
          height: `${event.height}px`,
          left,
          width,
          zIndex: 5
        }}
      >
        <Card className={`
          h-full p-2 border transition-all duration-300
          ${domainColors[event.category as keyof typeof domainColors] || domainColors.personal}
          hover:shadow-lg glow-subtle border-dashed border-2
        `}>
          <div className="text-xs font-medium text-white truncate mb-1">
            {event.title}
          </div>
          <div className="text-xs text-white/80 truncate">
            {new Date(event.startTime).toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit', 
              hour12: true 
            })}
            {event.endTime && (
              <span> - {new Date(event.endTime).toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit', 
                hour12: true 
              })}</span>
            )}
          </div>
          {event.category && (
            <Badge variant="outline" className="text-xs mt-1 border-white/30 text-white/90">
              {event.category}
            </Badge>
          )}
        </Card>
      </motion.div>
    );
  };

  // Component for positioned tasks
  const PositionedTaskCard = ({ task, maxLanes = 1 }: { task: PositionedTask; maxLanes?: number }) => {
    const width = maxLanes > 1 ? `${100 / maxLanes}%` : '100%';
    const left = maxLanes > 1 ? `${(task.lane / maxLanes) * 100}%` : '0%';
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, delay: Math.random() * 0.2 }}
        whileHover={{ scale: 1.02, zIndex: 10 }}
        className="absolute cursor-pointer transition-all duration-300"
        style={{
          top: `${task.top}px`,
          height: `${task.height}px`,
          left,
          width,
          zIndex: 5
        }}
      >
        <Card className={`
          h-full p-2 border transition-all duration-300
          ${domainColors[task.domain as keyof typeof domainColors] || domainColors.personal}
          ${task.isCompleted ? 'opacity-60 line-through' : 'hover:shadow-lg glow-subtle'}
        `}>
          <div className="text-xs font-medium text-white truncate mb-1">
            {task.title}
          </div>
          <div className="flex items-center justify-between text-xs text-white/80">
            <Badge variant="outline" className="text-xs border-white/30 text-white/90">
              {task.domain}
            </Badge>
            <div className="flex items-center gap-1">
              <Clock className="h-2 w-2" />
              {task.estimatedHours}h
            </div>
          </div>
        </Card>
      </motion.div>
    );
  };

  const AllDayTaskCard = ({ task, isCompact = false }: { task: Task; isCompact?: boolean }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.random() * 0.2 }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
    >
      <Card className={`
        p-2 mb-2 cursor-pointer border transition-all duration-300
        ${domainColors[task.domain as keyof typeof domainColors] || domainColors.personal}
        ${task.isCompleted ? 'opacity-60 line-through' : 'hover:shadow-lg glow-subtle'}
        ${isCompact ? 'text-xs' : 'text-sm'}
      `}>
        <div className="space-y-1">
          <div className="font-medium text-white truncate">
            {task.title}
          </div>
          {!isCompact && (
            <div className="flex items-center justify-between text-white/80">
              <Badge variant="outline" className="text-xs border-white/30 text-white/90">
                {task.domain}
              </Badge>
              <div className="flex items-center gap-1 text-xs">
                <Clock className="h-3 w-3" />
                {task.estimatedHours}h
              </div>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );

  return (
    <div ref={weekRef} className="space-y-4">
      {/* Week Header */}
      <div className="week-header flex items-center justify-between">
        <div className="text-lg font-semibold text-foreground">
          Week of {weekDays[0].toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
        <div className="text-sm text-muted-foreground">
          {tasks.length} tasks • {events.length} events
        </div>
      </div>

      {/* All-Day Tasks Section */}
      <div className="all-day-section">
        <div className="grid grid-cols-8 gap-px bg-border/20 rounded-lg overflow-hidden">
          {/* All-day header */}
          <div className="bg-muted/50 p-2 text-xs font-medium text-muted-foreground border-r border-border/30">
            All Day
          </div>
          
          {/* All-day task columns */}
          {weekDays.map((date, dayIndex) => {
            const dateKey = date.toDateString();
            const allDayTasks = positionedData[dateKey]?.allDayTasks || [];
            const isToday = new Date().toDateString() === dateKey;
            const isSelected = selectedDate?.toDateString() === dateKey;
            
            return (
              <div 
                key={dayIndex}
                className={`
                  bg-card/50 p-2 min-h-[80px] cursor-pointer transition-all duration-300
                  ${isToday ? 'bg-primary/10 border-primary/20' : 'hover:bg-card/70'}
                  ${isSelected ? 'ring-1 ring-accent/50' : ''}
                `}
                onClick={() => onDateSelect(date)}
              >
                <div className="space-y-1">
                  {allDayTasks.slice(0, 2).map((task) => (
                    <AllDayTaskCard key={task.id} task={task} isCompact={allDayTasks.length > 1} />
                  ))}
                  {allDayTasks.length > 2 && (
                    <div className="text-xs text-muted-foreground text-center py-1">
                      +{allDayTasks.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Timeline Grid */}
      <div ref={timelineRef} className="timeline-container">
        <div className="time-grid grid grid-cols-8 gap-px bg-border/20 rounded-lg overflow-hidden">
          {/* Time Labels Column */}
          <div className="time-labels-column bg-muted/30">
            {/* Empty cell for day headers row */}
            <div className="h-12 border-b border-border/30"></div>
            
            {/* Time labels */}
            {hours.map((hour) => (
              <div
                key={hour}
                className="time-label h-[60px] px-2 py-1 text-xs font-mono text-muted-foreground border-b border-border/20 flex items-center justify-end"
              >
                <div className="text-right">
                  <div className="font-medium">
                    {hour === 12 ? '12' : hour > 12 ? hour - 12 : hour}
                  </div>
                  <div className="text-xs opacity-60">
                    {hour >= 12 ? 'PM' : 'AM'}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Day Columns */}
          {weekDays.map((date, dayIndex) => {
            const dateKey = date.toDateString();
            const dayData = positionedData[dateKey];
            const isToday = new Date().toDateString() === dateKey;
            const isSelected = selectedDate?.toDateString() === dateKey;
            
            return (
              <div key={dayIndex} className="day-column relative">
                {/* Day Header */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className={`
                    day-header h-12 p-2 text-center cursor-pointer transition-all duration-300 border-b border-border/30
                    ${isToday 
                      ? 'bg-primary/20 text-primary border-primary/50' 
                      : 'bg-card/50 hover:bg-card/70'
                    }
                    ${isSelected 
                      ? 'ring-1 ring-accent/50 bg-accent/10' 
                      : ''
                    }
                  `}
                  onClick={() => onDateSelect(date)}
                >
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className={`text-sm font-bold ${isToday ? 'text-primary' : 'text-foreground'}`}>
                    {date.getDate()}
                  </div>
                </motion.div>
                
                {/* Time Grid Column */}
                <div className="relative" style={{ height: `${TOTAL_HOURS * HOUR_HEIGHT}px` }}>
                  {/* Hour grid lines */}
                  {hours.map((hour, hourIndex) => (
                    <div
                      key={hour}
                      className="absolute w-full border-b border-border/20"
                      style={{ top: `${hourIndex * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
                    />
                  ))}
                  
                  {/* Current time indicator */}
                  {isToday && currentTimePosition !== null && (
                    <motion.div
                      initial={{ opacity: 0, scaleX: 0 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      className="absolute w-full h-0.5 bg-red-500 shadow-lg z-20"
                      style={{ top: `${currentTimePosition}px` }}
                    >
                      <div className="absolute -left-2 -top-1 w-2 h-2 bg-red-500 rounded-full shadow-lg"></div>
                      <div className="absolute -right-2 -top-1 w-2 h-2 bg-red-500 rounded-full shadow-lg animate-pulse"></div>
                    </motion.div>
                  )}
                  
                  {/* Positioned Events */}
                  {dayData?.events.map((event) => {
                    return (
                      <PositionedEventCard
                        key={event.id}
                        event={event}
                        maxLanes={event.maxLanes || 1}
                      />
                    );
                  })}
                  
                  {/* Positioned Tasks */}
                  {dayData?.tasks.map((task) => {
                    return (
                      <PositionedTaskCard
                        key={task.id}
                        task={task}
                        maxLanes={task.maxLanes || 1}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}