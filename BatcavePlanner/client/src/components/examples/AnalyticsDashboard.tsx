import { AnalyticsDashboard } from '../analytics-dashboard';
import { ThemeProvider } from '@/lib/theme-context';

export default function AnalyticsDashboardExample() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background">
        <AnalyticsDashboard />
      </div>
    </ThemeProvider>
  );
}