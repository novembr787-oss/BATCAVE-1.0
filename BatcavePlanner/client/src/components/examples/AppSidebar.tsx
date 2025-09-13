import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '../app-sidebar';
import { ThemeProvider } from '@/lib/theme-context';

export default function AppSidebarExample() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <ThemeProvider>
      <SidebarProvider style={style as React.CSSProperties}>
        <div className="flex h-screen w-full">
          <AppSidebar />
          <div className="flex-1 p-6 bg-background">
            <h2 className="text-xl font-orbitron font-bold mb-4">BATCAVE Sidebar Demo</h2>
            <p className="text-muted-foreground">This sidebar features GSAP animations, active state highlighting, and electric blue accents for the Dark Knight theme.</p>
          </div>
        </div>
      </SidebarProvider>
    </ThemeProvider>
  );
}