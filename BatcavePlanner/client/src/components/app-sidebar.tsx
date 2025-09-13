import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { gsap } from 'gsap';
import {
  BarChart3,
  Calendar,
  Command,
  Home,
  Settings,
  Target,
  Palette
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

const navigationItems = [
  { title: 'Dashboard', url: '/', icon: Home },
  { title: 'Tasks', url: '/tasks', icon: Command },
  { title: 'Analytics', url: '/analytics', icon: BarChart3 },
  { title: 'Plan', url: '/plan', icon: Target },
  { title: 'Calendar', url: '/calendar', icon: Calendar },
  { title: 'Settings', url: '/settings', icon: Settings },
  { title: 'Customize', url: '/customize', icon: Palette },
];

export function AppSidebar() {
  const [location] = useLocation();
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // GSAP entrance animation for sidebar items
    if (sidebarRef.current) {
      const items = sidebarRef.current.querySelectorAll('[data-sidebar-item]');
      gsap.fromTo(items, 
        { x: -20, opacity: 0 },
        { 
          x: 0, 
          opacity: 1, 
          duration: 0.3, 
          stagger: 0.05,
          ease: 'power2.out'
        }
      );
    }
  }, []);

  return (
    <Sidebar className="border-r border-border/50 bg-sidebar/95 backdrop-blur-sm">
      <SidebarContent ref={sidebarRef}>
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary font-orbitron text-sm font-semibold tracking-wider uppercase">
            BATCAVE
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title} data-sidebar-item>
                    <SidebarMenuButton 
                      asChild 
                      className={`
                        hover-elevate transition-all duration-200
                        ${isActive 
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-primary' 
                          : 'text-sidebar-foreground/70 hover:text-sidebar-foreground'
                        }
                      `}
                      data-testid={`link-${item.title.toLowerCase()}`}
                    >
                      <Link href={item.url}>
                        <item.icon className={`h-4 w-4 ${isActive ? 'text-primary' : ''}`} />
                        <span className={`${isActive ? 'font-semibold' : ''}`}>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}