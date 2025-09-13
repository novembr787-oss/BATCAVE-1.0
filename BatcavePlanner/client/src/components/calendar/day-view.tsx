import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Clock, Plus, Calendar, Move, Trash2 } from 'lucide-react';
import { type Task, type Event } from '@shared/schema';

interface DayViewProps {
  currentDate: Date;
  tasks: Task[];
  events: Event[];
  onDateSelect: (date: Date) => void;
  selectedDate: Date | null;
  onEventUpdate?: (event: Event) => void;
  onTaskUpdate?: (task: Task) => void;
}

const domainColors = {
  academic: 'bg-primary/80 border-primary',
  fitness: 'bg-green-400/80 border-green-400',
  creative: 'bg-purple-400/80 border-purple-400',
  social: 'bg-pink-400/80 border-pink-400',
  maintenance: 'bg-gray-400/80 border-gray-400',
  personal: 'bg-cyan-400/80 border-cyan-400',
};

const categoryColors = {
  academic: 'bg-primary/80 border-primary',
  fitness: 'bg-green-400/80 border-green-400',
  creative: 'bg-purple-400/80 border-purple-400',
  social: 'bg-pink-400/80 border-pink-400',
  maintenance: 'bg-gray-400/80 border-gray-400',
  personal: 'bg-cyan-400/80 border-cyan-400',
  meeting: 'bg-orange-400/80 border-orange-400',
};

const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };

// Time utilities for positioning - More detailed than week view
const HOUR_HEIGHT = 80; // 80px per hour for better detail
const START_HOUR = 6; // 6 AM
const END_HOUR = 23; // 11 PM
const TOTAL_HOURS = END_HOUR - START_HOUR + 1;
const MIN_EVENT_HEIGHT = 25;
const SNAP_INTERVAL = 15; // 15-minute intervals

type TimePosition = {
  top: number;
  height: number;
  lane: number;
  maxLanes?: number;
};

type PositionedEvent = Omit<Event, 'startTime' | 'endTime'> & TimePosition & {
  startTime: string;
  endTime: string | null;
  isClampedStart?: boolean;
  isClampedEnd?: boolean;
  isDragging?: boolean;
};

type PositionedTask = Task & TimePosition & {
  startTime: string;
  isClampedStart?: boolean;
  isClampedEnd?: boolean;
  isDragging?: boolean;
};

// Unified type for lane allocation
type TimedItem = {
  id: string;
  type: 'event' | 'task';
  startTime: string;
  endTime?: string;
  data: Event | Task;
};

export function DayView({ currentDate, tasks, events, onDateSelect, selectedDate, onEventUpdate, onTaskUpdate }: DayViewProps) {
  const dayRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [draggedItem, setDraggedItem] = useState<{ id: string; type: 'event' | 'task'; offset: { x: number; y: number } } | null>(null);
  const [ghostPosition, setGhostPosition] = useState<{ x: number; y: number } | null>(null);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [newEventData, setNewEventData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    category: 'personal'
  });

  // Generate hours for timeline
  const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => i + START_HOUR);

  // Time calculation utilities
  const getMinutesFromMidnight = (date: Date): number => {
    return date.getHours() * 60 + date.getMinutes();
  };

  // Snap time to 15-minute intervals
  const snapToInterval = (minutes: number): number => {
    return Math.round(minutes / SNAP_INTERVAL) * SNAP_INTERVAL;
  };

  // Convert Y position to time with snapping
  const yPositionToTime = (y: number): Date => {
    const hourOffset = (y / HOUR_HEIGHT);
    const totalMinutes = snapToInterval(hourOffset * 60);
    const hour = Math.floor(totalMinutes / 60) + START_HOUR;
    const minutes = totalMinutes % 60;
    
    const newTime = new Date(currentDate);
    newTime.setHours(Math.max(START_HOUR, Math.min(END_HOUR, hour)), minutes, 0, 0);
    return newTime;
  };

  const calculateTimePosition = (startTime: Date, endTime?: Date): { top: number; height: number; isClampedStart?: boolean; isClampedEnd?: boolean } => {
    const startHour = startTime.getHours();
    const endHour = endTime ? endTime.getHours() : startHour;
    
    // Handle edge cases for events outside visible hours
    let clampedStart = new Date(startTime);
    let clampedEnd = endTime ? new Date(endTime) : new Date(startTime.getTime() + 60 * 60 * 1000); // Default 1 hour
    let isClampedStart = false;
    let isClampedEnd = false;

    // Clamp start time if before START_HOUR
    if (startHour < START_HOUR) {
      clampedStart.setHours(START_HOUR, 0, 0, 0);
      isClampedStart = true;
    }

    // Clamp end time if after END_HOUR
    if (endHour > END_HOUR) {
      clampedEnd.setHours(END_HOUR, 59, 59, 999);
      isClampedEnd = true;
    }

    const startMinutes = getMinutesFromMidnight(clampedStart);
    const endMinutes = getMinutesFromMidnight(clampedEnd);
    
    const startHourOffset = Math.max(0, (clampedStart.getHours() - START_HOUR) * 60 + clampedStart.getMinutes());
    const top = (startHourOffset / 60) * HOUR_HEIGHT;
    
    const durationMinutes = endMinutes - startMinutes;
    const height = Math.max(MIN_EVENT_HEIGHT, (durationMinutes / 60) * HOUR_HEIGHT);
    
    return { top, height, isClampedStart, isClampedEnd };
  };

  // Overlap detection and lane allocation
  const allocateLanes = <T extends { startTime: string; endTime?: string }>(items: T[]): (T & { lane: number; maxLanes: number })[] => {
    const sortedItems = [...items].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    const positioned: (T & { lane: number; maxLanes: number })[] = [];
    
    sortedItems.forEach((item) => {
      const itemStart = new Date(item.startTime).getTime();
      const itemEnd = item.endTime ? new Date(item.endTime).getTime() : itemStart + (60 * 60 * 1000);
      
      const conflicts = positioned.filter(existing => {
        const existingStart = new Date(existing.startTime).getTime();
        const existingEnd = existing.endTime ? new Date(existing.endTime).getTime() : existingStart + (60 * 60 * 1000);
        return (itemStart < existingEnd && itemEnd > existingStart);
      });
      
      const usedLanes = conflicts.map(c => c.lane);
      let lane = 0;
      while (usedLanes.includes(lane)) {
        lane++;
      }
      
      const maxLanes = Math.max(lane + 1, ...conflicts.map(c => c.maxLanes));
      positioned.push({ ...item, lane, maxLanes });
      
      // Update maxLanes for all conflicting items
      conflicts.forEach(conflict => {
        conflict.maxLanes = maxLanes;
      });
    });
    
    return positioned;
  };

  // Filter and position items for the selected day
  const { positionedEvents, positionedTasks, allDayTasks, allDayEvents } = useMemo(() => {
    const dayStart = new Date(currentDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(currentDate);
    dayEnd.setHours(23, 59, 59, 999);

    // Filter events for this day - INCLUDING CROSS-DAY EVENTS
    const dayEvents = events.filter(event => {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      
      // Include if event starts, ends, or spans across this day
      return (eventStart <= dayEnd && eventEnd >= dayStart) || event.allDay;
    });

    // Separate all-day events from timed events
    const timedEvents = dayEvents.filter(event => !event.allDay);
    const allDayEventsList = dayEvents.filter(event => event.allDay);

    // Filter tasks - INCLUDING TASKS WITHOUT DUEDATE
    const allTasks = tasks.filter(task => {
      // Include tasks without dueDate (they go to all-day section)
      if (!task.dueDate) return true;
      
      // Include tasks with dueDate on this day
      const taskDate = new Date(task.dueDate);
      return taskDate >= dayStart && taskDate <= dayEnd;
    });

    // Separate timed tasks from all-day tasks
    const timedTasks = allTasks.filter(task => {
      if (!task.dueDate) return false; // Tasks without dueDate go to all-day
      const taskTime = new Date(task.dueDate);
      // Include tasks within or partially within visible hours
      return taskTime.getHours() >= START_HOUR || taskTime.getHours() <= END_HOUR;
    });

    const allDayTasksList = allTasks.filter(task => {
      // Include tasks without dueDate
      if (!task.dueDate) return true;
      // Include tasks outside visible hours
      const taskTime = new Date(task.dueDate);
      return taskTime.getHours() < START_HOUR || taskTime.getHours() > END_HOUR;
    });

    // Create unified timed items for lane allocation
    const timedItems: TimedItem[] = [
      ...timedEvents.map(event => ({
        id: event.id,
        type: 'event' as const,
        startTime: event.startTime.toISOString(),
        endTime: event.endTime?.toISOString(),
        data: event
      })),
      ...timedTasks.map(task => ({
        id: task.id,
        type: 'task' as const,
        startTime: task.dueDate!.toISOString(),
        endTime: undefined,
        data: task
      }))
    ];

    // Allocate lanes for all timed items together
    const positionedItems = allocateLanes(timedItems);

    // Separate back into events and tasks with positioning
    const eventsWithPositions: PositionedEvent[] = positionedItems
      .filter(item => item.type === 'event')
      .map(item => {
        const event = item.data as Event;
        const { top, height, isClampedStart, isClampedEnd } = calculateTimePosition(event.startTime, event.endTime || undefined);
        return {
          ...event,
          startTime: item.startTime,
          endTime: item.endTime || null,
          top,
          height,
          lane: item.lane,
          maxLanes: item.maxLanes,
          isClampedStart,
          isClampedEnd,
          isDragging: draggedItem?.id === event.id && draggedItem?.type === 'event'
        };
      });

    const tasksWithPositions: PositionedTask[] = positionedItems
      .filter(item => item.type === 'task')
      .map(item => {
        const task = item.data as Task;
        const { top, height, isClampedStart, isClampedEnd } = calculateTimePosition(task.dueDate!);
        return {
          ...task,
          startTime: item.startTime,
          top,
          height,
          lane: item.lane,
          maxLanes: item.maxLanes,
          isClampedStart,
          isClampedEnd,
          isDragging: draggedItem?.id === task.id && draggedItem?.type === 'task'
        };
      });

    return {
      positionedEvents: eventsWithPositions,
      positionedTasks: tasksWithPositions,
      allDayTasks: allDayTasksList,
      allDayEvents: allDayEventsList
    };
  }, [currentDate, events, tasks, draggedItem]);

  // Drag and Drop Handlers
  const handleMouseDown = useCallback((e: React.MouseEvent, id: string, type: 'event' | 'task') => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const offset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    setDraggedItem({ id, type, offset });
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggedItem || !timelineRef.current) return;
    
    const timelineRect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - timelineRect.left - draggedItem.offset.x;
    const y = e.clientY - timelineRect.top - draggedItem.offset.y;
    
    setGhostPosition({ x: Math.max(0, x), y: Math.max(0, y) });
  }, [draggedItem]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!draggedItem || !timelineRef.current) {
      setDraggedItem(null);
      setGhostPosition(null);
      return;
    }

    const timelineRect = timelineRef.current.getBoundingClientRect();
    const y = e.clientY - timelineRect.top - draggedItem.offset.y;
    const newTime = yPositionToTime(y);

    // Update the item's time
    if (draggedItem.type === 'event') {
      const event = positionedEvents.find(e => e.id === draggedItem.id);
      if (event && onEventUpdate) {
        const duration = event.endTime ? 
          new Date(event.endTime).getTime() - new Date(event.startTime).getTime() : 
          60 * 60 * 1000; // Default 1 hour
        
        const updatedEvent = {
          ...event,
          startTime: newTime,
          endTime: new Date(newTime.getTime() + duration)
        };
        onEventUpdate(updatedEvent);
      }
    } else {
      const task = positionedTasks.find(t => t.id === draggedItem.id);
      if (task && onTaskUpdate) {
        const updatedTask = {
          ...task,
          dueDate: newTime
        };
        onTaskUpdate(updatedTask);
      }
    }

    setDraggedItem(null);
    setGhostPosition(null);
  }, [draggedItem, positionedEvents, positionedTasks, onEventUpdate, onTaskUpdate]);

  // Event handlers for drag and drop
  useEffect(() => {
    if (draggedItem) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggedItem, handleMouseMove, handleMouseUp]);

  // Current time indicator position
  const currentTimePosition = useMemo(() => {
    const now = new Date();
    if (now.toDateString() !== currentDate.toDateString()) return null;
    
    const currentHour = now.getHours();
    if (currentHour < START_HOUR || currentHour > END_HOUR) return null;
    
    const minutesFromStart = (currentHour - START_HOUR) * 60 + now.getMinutes();
    return (minutesFromStart / 60) * HOUR_HEIGHT;
  }, [currentTime, currentDate]);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // GSAP Animations
  useEffect(() => {
    const elements = dayRef.current?.querySelectorAll('.day-grid-item');
    if (elements && elements.length > 0) {
      gsap.fromTo(elements, 
        { opacity: 0, y: 20 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.6, 
          stagger: 0.05,
          ease: "power2.out"
        }
      );
    }

    const timeSlots = dayRef.current?.querySelectorAll('.time-slot');
    if (timeSlots && timeSlots.length > 0) {
      gsap.fromTo(timeSlots,
        { opacity: 0, x: -20 },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          stagger: 0.02,
          ease: "power2.out"
        }
      );
    }
  }, [currentDate, positionedEvents, positionedTasks]);

  // Add Event Handler
  const handleAddEvent = async () => {
    if (!newEventData.title || !newEventData.startTime || !newEventData.endTime) return;
    
    const startTime = new Date(newEventData.startTime);
    const endTime = new Date(newEventData.endTime);
    
    // Create new event (this would typically call an API)
    const newEvent = {
      id: `temp-${Date.now()}`, // Temporary ID
      title: newEventData.title,
      description: newEventData.description,
      startTime,
      endTime,
      category: newEventData.category,
      userId: 'current-user', // Would come from auth
      allDay: false,
      recurrence: null,
      recurrenceEnd: null,
      taskId: null,
      location: null,
      priority: 'medium',
      isCompleted: false,
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    if (onEventUpdate) {
      onEventUpdate(newEvent as Event);
    }
    
    // Reset form and close dialog
    setNewEventData({
      title: '',
      description: '',
      startTime: '',
      endTime: '',
      category: 'personal'
    });
    setIsAddEventOpen(false);
  };

  const formatHour = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour} ${period}`;
  };

  const formatDateHeader = () => {
    return currentDate.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div ref={dayRef} className="h-full">
      {/* Day Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-1">
              {formatDateHeader()}
            </h2>
            <p className="text-muted-foreground">
              {positionedEvents.length + positionedTasks.length + allDayTasks.length + allDayEvents.length} items scheduled
            </p>
          </div>
          <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 bg-primary/10 border-primary/20 hover:bg-primary/20"
              >
                <Plus className="h-4 w-4" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Event</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newEventData.title}
                    onChange={(e) => setNewEventData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Event title"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newEventData.description}
                    onChange={(e) => setNewEventData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Event description (optional)"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="datetime-local"
                      value={newEventData.startTime}
                      onChange={(e) => setNewEventData(prev => ({ ...prev, startTime: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="datetime-local"
                      value={newEventData.endTime}
                      onChange={(e) => setNewEventData(prev => ({ ...prev, endTime: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newEventData.category}
                    onValueChange={(value) => setNewEventData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal">Personal</SelectItem>
                      <SelectItem value="academic">Academic</SelectItem>
                      <SelectItem value="fitness">Fitness</SelectItem>
                      <SelectItem value="creative">Creative</SelectItem>
                      <SelectItem value="social">Social</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddEvent} className="w-full">
                  Create Event
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* All Day Section */}
      {(allDayTasks.length > 0 || allDayEvents.length > 0) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-6"
        >
          <Card className="bg-card/50 border-border/30">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">All Day</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {/* All Day Events */}
                {allDayEvents.map(event => (
                  <motion.div
                    key={`allday-event-${event.id}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="day-grid-item"
                  >
                    <Badge
                      variant="outline"
                      className={`${categoryColors[event.category as keyof typeof categoryColors] || 'bg-gray-400/80 border-gray-400'} 
                        text-white border-0 hover:scale-105 transition-transform cursor-pointer`}
                    >
                      {event.title}
                    </Badge>
                  </motion.div>
                ))}
                {/* All Day Tasks */}
                {allDayTasks.map(task => (
                  <motion.div
                    key={`allday-task-${task.id}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="day-grid-item"
                  >
                    <Badge
                      variant="outline"
                      className={`${domainColors[task.domain as keyof typeof domainColors] || 'bg-gray-400/80 border-gray-400'} 
                        text-white border-0 hover:scale-105 transition-transform cursor-pointer`}
                    >
                      {task.title}
                      {!task.dueDate && <span className="ml-1 text-xs opacity-75">(No due date)</span>}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Main Timeline */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="relative"
      >
        <Card className="bg-card/95 backdrop-blur-sm border-border/50 overflow-hidden">
          <div className="p-4">
            <div className="flex">
              {/* Time Labels */}
              <div className="w-20 pr-4">
                {hours.map((hour, index) => (
                  <div
                    key={hour}
                    className="time-slot flex items-center justify-end text-sm text-muted-foreground relative"
                    style={{ height: `${HOUR_HEIGHT}px` }}
                  >
                    <span className="text-xs font-medium">
                      {formatHour(hour)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Day Column */}
              <div ref={timelineRef} className="flex-1 relative">
                {/* Hour Lines */}
                {hours.map((hour, index) => (
                  <div
                    key={hour}
                    className="absolute left-0 right-0 border-t border-border/20"
                    style={{ top: `${index * HOUR_HEIGHT}px` }}
                  />
                ))}

                {/* 15-minute guide lines */}
                {hours.map((hour, hourIndex) => (
                  <React.Fragment key={`guides-${hour}`}>
                    {[1, 2, 3].map(quarter => (
                      <div
                        key={`${hour}-${quarter}`}
                        className="absolute left-0 right-0 border-t border-border/10"
                        style={{ 
                          top: `${hourIndex * HOUR_HEIGHT + (quarter * HOUR_HEIGHT / 4)}px`,
                          borderStyle: 'dashed'
                        }}
                      />
                    ))}
                  </React.Fragment>
                ))}

                {/* Current Time Indicator */}
                {currentTimePosition !== null && (
                  <motion.div
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ duration: 0.8 }}
                    className="absolute left-0 right-0 h-0.5 bg-red-500 z-20 shadow-lg"
                    style={{ top: `${currentTimePosition}px` }}
                  >
                    <div className="absolute left-0 w-3 h-3 bg-red-500 rounded-full -translate-y-1.5 shadow-lg" />
                  </motion.div>
                )}

                {/* Events */}
                {positionedEvents.map((event) => {
                  const width = event.maxLanes ? `${100 / event.maxLanes}%` : '100%';
                  const left = event.maxLanes ? `${(event.lane / event.maxLanes) * 100}%` : '0%';

                  return (
                    <motion.div
                      key={`event-${event.id}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.1 }}
                      className={`absolute z-10 day-grid-item ${event.isDragging ? 'opacity-50' : ''}`}
                      style={{
                        top: `${event.top}px`,
                        height: `${event.height}px`,
                        left,
                        width: `calc(${width} - 2px)`,
                      }}
                      onMouseDown={(e) => handleMouseDown(e, event.id, 'event')}
                    >
                      <Card className={`h-full bg-primary/90 border-primary hover:bg-primary/80 transition-colors cursor-move overflow-hidden
                        ${event.isClampedStart ? 'border-t-4 border-t-yellow-400' : ''}
                        ${event.isClampedEnd ? 'border-b-4 border-b-yellow-400' : ''}
                      `}>
                        <div className="p-2 h-full relative">
                          <div className="flex items-start justify-between">
                            <div className="text-white text-sm font-medium truncate pr-2">
                              {event.title}
                            </div>
                            <Move className="h-3 w-3 text-white/60 flex-shrink-0" />
                          </div>
                          <div className="text-white/80 text-xs mt-1 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {event.isClampedStart && <span>→</span>}
                            {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {event.endTime && (
                              <>
                                {' - '}
                                {new Date(event.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </>
                            )}
                            {event.isClampedEnd && <span>→</span>}
                          </div>
                          {(event.isClampedStart || event.isClampedEnd) && (
                            <div className="text-yellow-200 text-xs mt-1">
                              {event.isClampedStart && event.isClampedEnd ? 'Extends beyond view' : 
                               event.isClampedStart ? 'Started earlier' : 'Extends later'}
                            </div>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}

                {/* Tasks */}
                {positionedTasks.map((task) => {
                  const width = task.maxLanes ? `${100 / task.maxLanes}%` : '100%';
                  const left = task.maxLanes ? `${(task.lane / task.maxLanes) * 100}%` : '0%';

                  return (
                    <motion.div
                      key={`task-${task.id}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                      className={`absolute z-10 day-grid-item ${task.isDragging ? 'opacity-50' : ''}`}
                      style={{
                        top: `${task.top}px`,
                        height: `${task.height}px`,
                        left,
                        width: `calc(${width} - 2px)`,
                      }}
                      onMouseDown={(e) => handleMouseDown(e, task.id, 'task')}
                    >
                      <Card className={`h-full ${domainColors[task.domain as keyof typeof domainColors] || 'bg-gray-400/80 border-gray-400'} 
                        border-0 hover:scale-105 transition-transform cursor-move overflow-hidden
                        ${task.isClampedStart ? 'border-t-4 border-t-yellow-400' : ''}
                        ${task.isClampedEnd ? 'border-b-4 border-b-yellow-400' : ''}
                      `}>
                        <div className="p-2 h-full relative">
                          <div className="flex items-start justify-between">
                            <div className="text-white text-sm font-medium truncate pr-2">
                              {task.title}
                            </div>
                            <Move className="h-3 w-3 text-white/60 flex-shrink-0" />
                          </div>
                          <div className="text-white/80 text-xs mt-1 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Due: {new Date(task.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          {task.estimatedHours && (
                            <div className="text-white/60 text-xs">
                              Est: {task.estimatedHours}h
                            </div>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}

                {/* Drag Ghost */}
                {draggedItem && ghostPosition && (
                  <div
                    className="absolute z-30 pointer-events-none"
                    style={{
                      left: `${ghostPosition.x}px`,
                      top: `${Math.max(0, Math.min(ghostPosition.y, TOTAL_HOURS * HOUR_HEIGHT - MIN_EVENT_HEIGHT))}px`,
                    }}
                  >
                    <Card className="bg-primary/50 border-primary/70 border-2 border-dashed w-48 h-8">
                      <div className="p-1 text-white text-xs text-center">
                        Moving to {yPositionToTime(ghostPosition.y).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </Card>
                  </div>
                )}

                {/* Empty State */}
                {positionedEvents.length === 0 && positionedTasks.length === 0 && allDayTasks.length === 0 && allDayEvents.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="text-center text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-lg font-medium">No events scheduled</p>
                      <p className="text-sm">Click "Add Event" to start planning your day</p>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}