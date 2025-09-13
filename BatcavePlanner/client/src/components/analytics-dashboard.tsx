import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { TrendingUp, Target, Clock, Zap, Download, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, PieChart, Pie, Cell } from 'recharts';
import { useTheme } from '@/lib/theme-context';
import { useQuery } from '@tanstack/react-query';
import { format, startOfWeek, endOfWeek, isWithinInterval, parseISO, differenceInDays } from 'date-fns';
import type { Task } from '@shared/schema';

// Helper to generate weekly data from real task data
const generateWeeklyData = (tasks: Task[]) => {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday start
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  return daysOfWeek.map((dayName, index) => {
    const dayDate = new Date(weekStart);
    dayDate.setDate(weekStart.getDate() + index);
    
    // Filter tasks completed on this day
    const dayTasks = tasks.filter(task => {
      if (!task.completedAt) return false;
      const completedDate = new Date(task.completedAt);
      return format(completedDate, 'EEE') === dayName && 
             isWithinInterval(completedDate, { start: weekStart, end: weekEnd });
    });
    
    // Calculate metrics for this day
    const totalHours = dayTasks.reduce((acc, task) => {
      const hours = typeof task.actualHours === 'string' ? parseFloat(task.actualHours) : (task.actualHours || 0);
      return acc + hours;
    }, 0);
    
    const highPriorityTasks = dayTasks.filter(t => t.priority === 'high' || t.priority === 'urgent').length;
    const focusScore = Math.min(10, Math.round((totalHours + highPriorityTasks) * 1.2));
    
    return {
      name: dayName,
      tasks: dayTasks.length,
      goals: highPriorityTasks,
      focus: focusScore
    };
  });
};

// Helper to calculate domain hours from real task data
const calculateDomainHours = (tasks: Task[]) => {
  const domainHours = {
    academic: 0,
    fitness: 0,
    creative: 0,
    social: 0,
    maintenance: 0,
  };
  
  tasks.forEach(task => {
    if (task.isCompleted && task.actualHours) {
      const hours = typeof task.actualHours === 'string' ? parseFloat(task.actualHours) : task.actualHours;
      const domain = task.domain as keyof typeof domainHours;
      if (domain in domainHours) {
        domainHours[domain] += hours;
      }
    }
  });
  
  return domainHours;
};

// Helper to calculate streak from real task data
const calculateStreak = (tasks: Task[]) => {
  const completedTasks = tasks
    .filter(t => t.isCompleted && t.completedAt)
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());
  
  if (completedTasks.length === 0) return 0;
  
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Check if there are tasks completed today or yesterday
  const latestTask = new Date(completedTasks[0].completedAt!);
  latestTask.setHours(0, 0, 0, 0);
  
  const daysDiff = differenceInDays(today, latestTask);
  if (daysDiff > 1) return 0; // Streak broken if no tasks completed today or yesterday
  
  let currentDate = new Date(today);
  if (daysDiff === 1) {
    currentDate.setDate(currentDate.getDate() - 1); // Start from yesterday if no tasks today
  }
  
  // Count consecutive days with completed tasks
  for (let i = 0; i < completedTasks.length; i++) {
    const taskDate = new Date(completedTasks[i].completedAt!);
    taskDate.setHours(0, 0, 0, 0);
    
    if (taskDate.getTime() === currentDate.getTime()) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (taskDate.getTime() < currentDate.getTime()) {
      // Gap in completion dates - streak broken
      break;
    }
  }
  
  return streak;
};

// Helper to generate pie data from real task data
const generatePieData = (tasks: Task[]) => {
  const completed = tasks.filter(t => t.isCompleted).length;
  const inProgress = tasks.filter(t => !t.isCompleted && t.actualHours && parseFloat(t.actualHours.toString()) > 0).length;
  const pending = tasks.filter(t => !t.isCompleted && (!t.actualHours || parseFloat(t.actualHours.toString()) === 0)).length;
  
  return [
    { name: 'Completed', value: completed, color: 'hsl(var(--primary))' },
    { name: 'In Progress', value: inProgress, color: 'hsl(var(--chart-2))' },
    { name: 'Pending', value: pending, color: 'hsl(var(--muted))' },
  ];
};

export function AnalyticsDashboard() {
  const { gamificationType, euMultipliers, calculateEU } = useTheme();
  
  // Fetch real task data
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
  });
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [viewMode, setViewMode] = useState<'charts' | 'table'>('charts');
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
  
  // Generate live data from real tasks
  const weeklyData = generateWeeklyData(tasks);
  const pieData = generatePieData(tasks);
  const weeklySessionData = calculateDomainHours(tasks);
  const streakCount = calculateStreak(tasks);
  
  // Compute EU breakdown dynamically from current multipliers and real data
  const euDomainData = Object.entries(weeklySessionData).map(([domain, hours]) => {
    const eu = calculateEU(hours, domain as keyof typeof euMultipliers);
    const efficiency = Math.round((euMultipliers[domain as keyof typeof euMultipliers] * 100));
    return {
      domain: domain.charAt(0).toUpperCase() + domain.slice(1),
      hours,
      eu,
      efficiency: `${efficiency}%`
    };
  });
  
  // Calculate total XP and EU from completed tasks
  const totalXP = tasks.filter(t => t.isCompleted).reduce((acc, task) => {
    const xp = typeof task.xpReward === 'string' ? parseInt(task.xpReward) : (task.xpReward || 0);
    return acc + xp;
  }, 0);
  
  const totalEU = Object.entries(weeklySessionData).reduce((acc, [domain, hours]) => {
    return acc + calculateEU(hours, domain as keyof typeof euMultipliers);
  }, 0);
  
  // Calculate dynamic progress values
  const xpTarget = Math.max(1000, Math.ceil(totalXP / 100) * 100); // Dynamic target based on current XP
  const xpProgress = Math.min(100, (totalXP / xpTarget) * 100);
  const euTarget = Math.max(50, Math.ceil(totalEU / 10) * 10); // Dynamic target based on current EU
  const euProgress = Math.min(100, (totalEU / euTarget) * 100);
  
  // Calculate task completion stats
  const completedTasks = tasks.filter(t => t.isCompleted).length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  // Dynamic radar data from real metrics
  const radarData = [
    { subject: 'Tasks', value: completionRate, fullMark: 100 },
    { subject: 'Goals', value: Math.min(100, Math.round((completedTasks / Math.max(10, totalTasks)) * 100)), fullMark: 100 },
    { subject: 'Focus', value: Math.min(100, Math.round((totalEU / Math.max(1, Object.keys(weeklySessionData).length)) * 10)), fullMark: 100 },
    { subject: 'Consistency', value: Math.min(100, Math.round((Object.values(weeklySessionData).filter(h => h > 0).length / 5) * 100)), fullMark: 100 },
    { subject: 'XP', value: Math.min(100, Math.round((totalXP / Math.max(100, totalXP)) * 100)), fullMark: 100 },
    { subject: 'EU Total', value: Math.min(100, Math.round((totalEU / Math.max(12, totalEU)) * 100)), fullMark: 100 },
  ];

  useEffect(() => {
    if (dashboardRef.current && isVisible) {
      // Mission control entrance animation
      const cards = dashboardRef.current.querySelectorAll('[data-analytics-card]');
      gsap.fromTo(cards,
        { y: 50, opacity: 0, rotationX: 15 },
        {
          y: 0,
          opacity: 1,
          rotationX: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: 'power3.out'
        }
      );

      // Animate XP rings with stroke animation based on real progress
      const rings = dashboardRef.current.querySelectorAll('[data-xp-ring]');
      rings.forEach((ring, index) => {
        const circle = ring.querySelector('circle:last-child') as SVGCircleElement; // Target the progress circle
        if (circle) {
          const circumference = 2 * Math.PI * 32; // radius = 32
          const progress = index === 0 ? xpProgress : euProgress; // First ring is XP, second is EU
          const targetOffset = circumference * (1 - progress / 100);
          
          // Start from full offset (empty) and animate to target
          circle.style.strokeDasharray = `${circumference}`;
          circle.style.strokeDashoffset = `${circumference}`;
          
          gsap.to(circle, {
            strokeDashoffset: targetOffset,
            duration: 2,
            ease: 'power2.out',
            delay: 1 + (index * 0.3) // Stagger animation
          });
        }
      });
    }
  }, [isVisible]);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleExport = () => {
    console.log('Export triggered');
    // TODO: Implement CSV/PDF export
    gsap.to('[data-export-btn]', {
      scale: 0.95,
      duration: 0.1,
      yoyo: true,
      repeat: 1
    });
  };

  return (
    <div className="p-6 space-y-6" ref={dashboardRef}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-orbitron font-bold text-foreground mb-2 bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
            Mission Analytics
          </h1>
          <div className="h-0.5 w-20 bg-gradient-to-r from-primary to-transparent mb-4"></div>
          <p className="text-muted-foreground">Comprehensive performance readout from your productivity command center</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Timeframe Selector */}
          <div className="flex rounded-lg border border-border/50 p-1 bg-card/50">
            {['weekly', 'monthly', 'yearly'].map((tf) => (
              <button
                key={tf}
                onClick={() => {
                  console.log('Timeframe changed to:', tf);
                  setTimeframe(tf as any);
                }}
                className={`
                  px-3 py-1 rounded text-sm font-medium transition-all duration-200 capitalize hover-elevate
                  ${timeframe === tf ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}
                `}
                data-testid={`timeframe-${tf}`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="flex rounded-lg border border-border/50 p-1 bg-card/50">
            <button
              onClick={() => setViewMode('charts')}
              className={`
                px-3 py-1 rounded text-sm font-medium transition-all duration-200 hover-elevate
                ${viewMode === 'charts' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}
              `}
              data-testid="view-charts"
            >
              <BarChart3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`
                px-3 py-1 rounded text-sm font-medium transition-all duration-200 hover-elevate
                ${viewMode === 'table' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}
              `}
              data-testid="view-table"
            >
              Table
            </button>
          </div>

          <Button 
            onClick={handleExport}
            variant="outline" 
            className="font-semibold"
            data-export-btn
            data-testid="button-export"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {viewMode === 'charts' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Performance 3D Bar Chart */}
          <Card data-analytics-card className="lg:col-span-2 hover-elevate bg-card/95 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Weekly Performance Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Bar dataKey="tasks" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="goals" fill="hsl(var(--chart-2))" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="focus" fill="hsl(var(--chart-3))" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Radar Chart - Monthly Overview */}
          <Card data-analytics-card className="hover-elevate bg-card/95 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Performance Radar (XP + EU)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" strokeDasharray="2 2" />
                    <PolarAngleAxis 
                      dataKey="subject" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontWeight: 500 }} 
                      className="font-orbitron"
                    />
                    <PolarRadiusAxis 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} 
                      tickCount={4}
                    />
                    <Radar 
                      name="Performance" 
                      dataKey="value" 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary))" 
                      fillOpacity={0.15}
                      strokeWidth={2.5}
                      dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary/20 border border-primary"></div>
                  <span className="text-muted-foreground">Combined XP+EU Score</span>
                </div>
                <div className="text-right">
                  <span className="font-orbitron font-semibold text-primary">{completionRate}%</span>
                  <span className="text-muted-foreground ml-1">Task Completion</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Task Distribution Pie Chart */}
          <Card data-analytics-card className="hover-elevate bg-card/95 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Task Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {pieData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }}></div>
                    <span className="text-xs text-muted-foreground">{item.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* XP & EU Comprehensive Tracker */}
          <Card data-analytics-card className="lg:col-span-2 hover-elevate bg-card/95 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                XP & EU Analytics ({gamificationType})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* XP Progress Ring */}
                <div className="flex flex-col items-center" data-xp-ring>
                  <div className="relative">
                    <svg className="w-20 h-20 transform -rotate-90">
                      <circle
                        cx="40"
                        cy="40"
                        r="32"
                        stroke="hsl(var(--muted))"
                        strokeWidth="3"
                        fill="transparent"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="32"
                        stroke="hsl(var(--primary))"
                        strokeWidth="3"
                        fill="transparent"
                        strokeLinecap="round"
                        style={{
                          strokeDasharray: 2 * Math.PI * 32,
                          strokeDashoffset: 2 * Math.PI * 32 * (1 - xpProgress / 100)
                        }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-orbitron font-bold">{Math.round(xpProgress)}%</span>
                    </div>
                  </div>
                  <div className="text-center mt-2">
                    <p className="text-sm font-semibold">XP Progress</p>
                    <p className="text-xs text-muted-foreground">{totalXP.toLocaleString()} / {xpTarget.toLocaleString()}</p>
                  </div>
                </div>

                {/* EU Progress Ring */}
                <div className="flex flex-col items-center" data-xp-ring>
                  <div className="relative">
                    <svg className="w-20 h-20 transform -rotate-90">
                      <circle
                        cx="40"
                        cy="40"
                        r="32"
                        stroke="hsl(var(--muted))"
                        strokeWidth="3"
                        fill="transparent"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="32"
                        stroke="hsl(var(--chart-2))"
                        strokeWidth="3"
                        fill="transparent"
                        strokeLinecap="round"
                        style={{
                          strokeDasharray: 2 * Math.PI * 32,
                          strokeDashoffset: 2 * Math.PI * 32 * (1 - euProgress / 100)
                        }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-orbitron font-bold">{Math.round(euProgress)}%</span>
                    </div>
                  </div>
                  <div className="text-center mt-2">
                    <p className="text-sm font-semibold">EU Efficiency</p>
                    <p className="text-xs text-muted-foreground">{totalEU.toFixed(1)} / {euTarget} EU</p>
                  </div>
                </div>

                {/* Streak Counter */}
                <div className="flex flex-col items-center">
                  <div className="text-3xl font-orbitron font-bold text-primary mb-2">{streakCount}</div>
                  <Badge variant="secondary" className="mb-2 text-xs">Current Streak</Badge>
                  <p className="text-xs text-muted-foreground text-center">Days of consistent progress</p>
                </div>

                {/* Gamification Visual */}
                <div className="flex flex-col items-center">
                  <div className="text-4xl mb-2">{gamificationType === 'sapling' ? '🌱' : '🏔️'}</div>
                  <p className="text-sm font-semibold text-center">
                    {gamificationType === 'sapling' ? 'Growing Strong' : 'Peak Climber'}
                  </p>
                  <p className="text-xs text-muted-foreground text-center">
                    {gamificationType === 'sapling' ? `Level ${Math.floor(totalXP / 100) + 1} Sapling` : `Summit Level ${Math.floor(totalEU / 10) + 1}`}
                  </p>
                </div>
              </div>
              
              {/* EU Domain Breakdown */}
              <div className="mt-8">
                <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-chart-2 rounded-full"></div>
                  EU Domain Performance
                </h4>
                <div className="space-y-3">
                  {euDomainData.map((domain, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-border/30">
                      <div className="flex items-center gap-3">
                        <div className="text-xs font-semibold text-muted-foreground w-16">{domain.domain}</div>
                        <div className="text-xs">{domain.hours}h → {domain.eu} EU</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs font-orbitron font-semibold">{domain.efficiency}</div>
                        <div className="w-12 h-1.5 bg-muted rounded">
                          <div 
                            className="h-1.5 bg-gradient-to-r from-chart-2 to-chart-3 rounded" 
                            style={{ width: `${parseInt(domain.efficiency)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Table View */
        <Card data-analytics-card className="hover-elevate bg-card/95 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle>Performance Data Table</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-4 font-semibold">Day</th>
                    <th className="text-left py-2 px-4 font-semibold">Tasks</th>
                    <th className="text-left py-2 px-4 font-semibold">Goals</th>
                    <th className="text-left py-2 px-4 font-semibold">Focus Score</th>
                  </tr>
                </thead>
                <tbody>
                  {weeklyData.map((day, index) => (
                    <tr key={index} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                      <td className="py-2 px-4">{day.name}</td>
                      <td className="py-2 px-4">{day.tasks}</td>
                      <td className="py-2 px-4">{day.goals}</td>
                      <td className="py-2 px-4">{day.focus}/10</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}