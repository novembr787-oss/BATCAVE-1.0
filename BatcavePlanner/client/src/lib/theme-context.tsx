import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark-knight' | 'neon-grid' | 'stealth-ops' | 'aurora' | 'minimal-white';
type Font = 'orbitron' | 'space-grotesk' | 'jetbrains-mono' | 'inter';
type GamificationType = 'sapling' | 'mountain';

// EU (Effort Multiplier) system for cross-domain performance consistency
interface EUMultipliers {
  academic: number;    // e.g., 1.0 - base multiplier
  fitness: number;     // e.g., 2.5 - higher multiplier for shorter, intense sessions
  creative: number;    // e.g., 0.8 - sustained creative work
  social: number;      // e.g., 1.2 - social/networking activities
  maintenance: number; // e.g., 0.6 - routine/maintenance tasks
}

interface ThemeContextType {
  theme: Theme;
  font: Font;
  gamificationType: GamificationType;
  euMultipliers: EUMultipliers;
  setTheme: (theme: Theme) => void;
  setFont: (font: Font) => void;
  setGamificationType: (type: GamificationType) => void;
  setEUMultiplier: (domain: keyof EUMultipliers, value: number) => void;
  calculateEU: (timeSpent: number, domain: keyof EUMultipliers) => number;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark-knight');
  const [font, setFont] = useState<Font>('orbitron');
  const [gamificationType, setGamificationType] = useState<GamificationType>('sapling');
  
  // Default EU multipliers for cross-domain consistency
  const [euMultipliers, setEuMultipliers] = useState<EUMultipliers>({
    academic: 1.0,      // Base multiplier for academic sessions
    fitness: 2.5,       // Higher multiplier for intense, shorter workouts
    creative: 0.8,      // Sustained creative work multiplier
    social: 1.2,        // Social/networking activities
    maintenance: 0.6    // Routine tasks multiplier
  });

  useEffect(() => {
    // Apply theme to document
    document.documentElement.className = 'dark'; // Default to dark mode for BATCAVE
    
    // Apply font class
    const fontClasses = {
      orbitron: 'font-orbitron',
      'space-grotesk': 'font-space-grotesk', 
      'jetbrains-mono': 'font-mono',
      inter: 'font-sans'
    };
    
    document.body.className = `${fontClasses[font]} antialiased bg-background text-foreground`;
  }, [theme, font]);

  // Function to update individual EU multipliers
  const setEUMultiplier = (domain: keyof EUMultipliers, value: number) => {
    setEuMultipliers(prev => ({
      ...prev,
      [domain]: Math.max(0.1, Math.min(5.0, value)) // Clamp between 0.1 and 5.0
    }));
  };

  // Calculate EU value for consistent cross-domain performance
  const calculateEU = (timeSpent: number, domain: keyof EUMultipliers): number => {
    return Math.round((timeSpent * euMultipliers[domain]) * 100) / 100;
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      font,
      gamificationType,
      euMultipliers,
      setTheme,
      setFont,
      setGamificationType,
      setEUMultiplier,
      calculateEU
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}