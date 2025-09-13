import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/lib/theme-context";
import { AppSidebar } from "@/components/app-sidebar";
import DashboardPage from "@/pages/dashboard";
import AnalyticsPage from "@/pages/analytics";
import CustomizePage from "@/pages/customize";
import { Tasks } from "@/pages/tasks";
import { Calendar } from "@/pages/calendar";
import PlaceholderPage from "@/pages/placeholder";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={DashboardPage} />
      <Route path="/tasks" component={Tasks} />
      <Route path="/analytics" component={AnalyticsPage} />
      <Route path="/customize" component={CustomizePage} />
      <Route 
        path="/plan" 
        component={() => (
          <PlaceholderPage 
            title="Planning System" 
            description="Advanced planning interface with week/month/quarter/year views, domain-aware forms, and drag-and-drop task management." 
          />
        )} 
      />
      <Route path="/calendar" component={Calendar} />
      <Route 
        path="/settings" 
        component={() => (
          <PlaceholderPage 
            title="System Configuration" 
            description="Profile management, accessibility settings, and system preferences for your BATCAVE experience." 
          />
        )} 
      />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // BATCAVE sidebar styling - wider for better navigation
  const sidebarStyle = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <SidebarProvider style={sidebarStyle as React.CSSProperties}>
            <div className="flex h-screen w-full">
              <AppSidebar />
              <div className="flex flex-col flex-1">
                <header className="flex items-center justify-between p-4 border-b border-border/50 bg-card/95 backdrop-blur-sm">
                  <SidebarTrigger data-testid="button-sidebar-toggle" className="hover-elevate" />
                  <div className="font-orbitron text-sm font-semibold text-primary tracking-wider">
                    BATCAVE v1.0
                  </div>
                </header>
                <main className="flex-1 overflow-auto bg-background">
                  <Router />
                </main>
              </div>
            </div>
          </SidebarProvider>
          <Toaster />
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
