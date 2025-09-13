import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Activity, Target, Calendar, TrendingUp, Zap, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/lib/theme-context';

export function Dashboard() {
  const { gamificationType, euMultipliers, calculateEU } = useTheme();
  const dashboardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (dashboardRef.current) {
      // GSAP stagger animation for dashboard cards
      const cards = dashboardRef.current.querySelectorAll('[data-dashboard-card]');
      gsap.fromTo(cards,
        { y: 40, opacity: 0, scale: 0.95 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power2.out'
        }
      );

      // Enhanced radar sweep animation with multiple layers
      const radarSweeps = dashboardRef.current.querySelectorAll('[data-radar-sweep]');
      radarSweeps.forEach((sweep, index) => {
        gsap.set(sweep, { transformOrigin: 'center center' });
        gsap.to(sweep, {
          rotation: 360,
          duration: 6 + index * 2, // Staggered timing for multiple sweeps
          ease: 'none',
          repeat: -1,
          delay: index * 0.5
        });
      });

      // Pulse animation for radar glow
      const radarGlow = dashboardRef.current.querySelector('[data-radar-glow]');
      if (radarGlow) {
        gsap.to(radarGlow, {
          opacity: 0.8,
          scale: 1.05,
          duration: 2,
          ease: 'power2.inOut',
          yoyo: true,
          repeat: -1
        });
      }
    }
  }, []);

  return (
    <div className="p-6 space-y-6" ref={dashboardRef}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-orbitron font-bold text-foreground mb-2 bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
          BATCAVE Command Center
        </h1>
        <div className="h-1 w-32 bg-gradient-to-r from-primary to-transparent mb-4"></div>
        <p className="text-muted-foreground text-lg">Welcome back to your productivity command center</p>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Today's Tasks */}
        <Card data-dashboard-card className="hover-elevate bg-card/95 backdrop-blur-sm border-border/50 relative overflow-hidden">
          {/* Radar Base Glow */}
          <div 
            className="absolute inset-0 opacity-20 bg-gradient-to-br from-primary/30 to-transparent rounded-lg"
            data-radar-glow
          ></div>
          
          {/* Primary Radar Sweep */}
          <div 
            className="absolute inset-0 opacity-40"
            data-radar-sweep
            style={{
              background: 'conic-gradient(from 0deg, transparent 300deg, hsl(var(--primary) / 0.6) 330deg, transparent 360deg)',
              borderRadius: 'inherit'
            }}
          ></div>
          
          {/* Secondary Radar Sweep */}
          <div 
            className="absolute inset-0 opacity-20"
            data-radar-sweep
            style={{
              background: 'conic-gradient(from 180deg, transparent 240deg, hsl(var(--chart-2) / 0.4) 270deg, transparent 300deg)',
              borderRadius: 'inherit'
            }}
          ></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Tasks</CardTitle>
            <CheckCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-orbitron font-bold relative z-10">8</div>
            <p className="text-xs text-muted-foreground relative z-10">5 completed, 3 remaining</p>
            <div className="mt-4 space-y-2 relative z-10">
              <div className="h-2 bg-muted/50 rounded backdrop-blur-sm">
                <div className="h-2 bg-gradient-to-r from-primary to-primary/80 rounded w-3/5 shadow-sm shadow-primary/20"></div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>XP: +180</span>
                <span>EU: +2.4</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* XP & EU Combined Progress */}
        <Card data-dashboard-card className="hover-elevate bg-card/95 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">XP & EU Progress</CardTitle>
            <Zap className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-xl font-orbitron font-bold">7,245</div>
                <p className="text-xs text-muted-foreground">+325 XP today</p>
              </div>
              <div>
                <div className="text-xl font-orbitron font-bold">{calculateEU(3.2, 'academic').toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">+{calculateEU(2.1, 'fitness').toFixed(1)} EU today</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <div className="text-2xl">{gamificationType === 'sapling' ? '🌱' : '🏔️'}</div>
              <div className="flex-1 space-y-1">
                <div className="h-1.5 bg-muted rounded">
                  <div className="h-1.5 bg-gradient-to-r from-primary to-primary/80 rounded w-3/4"></div>
                </div>
                <div className="h-1.5 bg-muted rounded">
                  <div className="h-1.5 bg-gradient-to-r from-chart-2 to-chart-2/80 rounded w-4/5"></div>
                </div>
              </div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Level 12 - {gamificationType === 'sapling' ? 'Growing Strong' : 'Peak Climber'}</span>
              <span>EU Efficiency: 82%</span>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card data-dashboard-card className="hover-elevate bg-card/95 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-orbitron font-bold">3</div>
            <p className="text-xs text-muted-foreground">This week</p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-xs">Study Session - 2:00 PM</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-chart-2 rounded-full"></div>
                <span className="text-xs">Project Review - Thu</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Goals & EU Targets */}
        <Card data-dashboard-card className="hover-elevate bg-card/95 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Targets</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-muted-foreground">Goals</span>
                  <span className="text-sm font-orbitron font-bold">4/6</span>
                </div>
                <div className="h-1.5 bg-muted rounded">
                  <div className="h-1.5 bg-primary rounded" style={{ width: '67%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-muted-foreground">EU Target</span>
                  <span className="text-sm font-orbitron font-bold">{calculateEU(18.5, 'academic').toFixed(0)}/{calculateEU(25, 'academic').toFixed(0)}</span>
                </div>
                <div className="h-1.5 bg-muted rounded">
                  <div className="h-1.5 bg-chart-2 rounded" style={{ width: '74%' }}></div>
                </div>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Badge variant="secondary" className="text-xs">Goals On Track</Badge>
              <Badge variant="outline" className="text-xs">EU Ahead</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card data-dashboard-card className="hover-elevate bg-card/95 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              className="h-16 flex-col gap-2" 
              variant="outline"
              onClick={() => console.log('Add task clicked')}
              data-testid="button-add-task"
            >
              <Target className="h-5 w-5" />
              <span className="text-xs">Add Task</span>
            </Button>
            <Button 
              className="h-16 flex-col gap-2" 
              variant="outline"
              onClick={() => console.log('Start focus clicked')}
              data-testid="button-start-focus"
            >
              <Zap className="h-5 w-5" />
              <span className="text-xs">Focus Mode</span>
            </Button>
            <Button 
              className="h-16 flex-col gap-2" 
              variant="outline"
              onClick={() => console.log('View analytics clicked')}
              data-testid="button-view-analytics"
            >
              <TrendingUp className="h-5 w-5" />
              <span className="text-xs">Analytics</span>
            </Button>
            <Button 
              className="h-16 flex-col gap-2" 
              variant="outline"
              onClick={() => console.log('Quick plan clicked')}
              data-testid="button-quick-plan"
            >
              <Calendar className="h-5 w-5" />
              <span className="text-xs">Quick Plan</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}