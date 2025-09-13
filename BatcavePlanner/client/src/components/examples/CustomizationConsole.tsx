import { CustomizationConsole } from '../customization-console';
import { ThemeProvider } from '@/lib/theme-context';

export default function CustomizationConsoleExample() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background">
        <CustomizationConsole />
      </div>
    </ThemeProvider>
  );
}