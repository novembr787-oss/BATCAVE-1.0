import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { Palette, Type, Gamepad2, Eye, Save, Calculator, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { useTheme } from '@/lib/theme-context';

const themes = [
  { id: 'dark-knight', name: 'Dark Knight', description: 'Deep black + electric blue glow', color: 'bg-gradient-to-r from-black to-blue-600' },
  { id: 'neon-grid', name: 'Neon Grid', description: 'Magenta/cyan retro-future', color: 'bg-gradient-to-r from-pink-500 to-cyan-500' },
  { id: 'stealth-ops', name: 'Stealth Ops', description: 'Matte black + red tactical accents', color: 'bg-gradient-to-r from-gray-900 to-red-600' },
  { id: 'aurora', name: 'Aurora', description: 'Flowing aurora gradients', color: 'bg-gradient-to-r from-green-400 via-blue-500 to-purple-600' },
  { id: 'minimal-white', name: 'Minimal White', description: 'Soft white/gray clean mode', color: 'bg-gradient-to-r from-gray-100 to-white' },
];

const fonts = [
  { id: 'orbitron', name: 'Orbitron', description: 'Futuristic cyberpunk style' },
  { id: 'space-grotesk', name: 'Space Grotesk', description: 'Modern sci-fi aesthetic' },
  { id: 'jetbrains-mono', name: 'JetBrains Mono', description: 'Technical monospace' },
  { id: 'inter', name: 'Inter', description: 'Clean body text' },
];

export function CustomizationConsole() {
  const { theme, font, gamificationType, euMultipliers, setTheme, setFont, setGamificationType, setEUMultiplier, calculateEU } = useTheme();
  const consoleRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (consoleRef.current && isVisible) {
      // Holographic dashboard opening animation
      gsap.fromTo(consoleRef.current,
        { scale: 0.8, opacity: 0, rotationX: 45 },
        { 
          scale: 1, 
          opacity: 1, 
          rotationX: 0,
          duration: 0.8,
          ease: 'power3.out'
        }
      );

      // Stagger in the cards
      const cards = consoleRef.current.querySelectorAll('[data-console-card]');
      gsap.fromTo(cards,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.1,
          delay: 0.3,
          ease: 'power2.out'
        }
      );
    }
  }, [isVisible]);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleThemeChange = (newTheme: string) => {
    console.log('Theme changed to:', newTheme);
    setTheme(newTheme as any);
    
    // Live morphing animation
    gsap.to('[data-theme-preview]', {
      scale: 1.05,
      duration: 0.2,
      yoyo: true,
      repeat: 1,
      ease: 'power2.inOut'
    });
  };

  const handleSaveSettings = () => {
    console.log('Settings saved!');
    // TODO: Save to Supabase
    gsap.to('[data-save-btn]', {
      scale: 0.95,
      duration: 0.1,
      yoyo: true,
      repeat: 1
    });
  };

  return (
    <div className="p-6 space-y-6" ref={consoleRef}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-orbitron font-bold text-foreground mb-2">Customization Console</h1>
          <p className="text-muted-foreground">Configure your BATCAVE experience</p>
        </div>
        <Button 
          onClick={handleSaveSettings}
          className="font-semibold" 
          data-save-btn
          data-testid="button-save-settings"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      </div>

      {/* Theme Selection */}
      <Card data-console-card className="hover-elevate">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Theme Selection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {themes.map((t) => (
              <div
                key={t.id}
                className={`
                  p-4 rounded-md border cursor-pointer transition-all duration-200 hover-elevate
                  ${theme === t.id ? 'border-primary bg-accent/50' : 'border-border'}
                `}
                onClick={() => handleThemeChange(t.id)}
                data-theme-preview
                data-testid={`theme-${t.id}`}
              >
                <div className={`h-8 w-full rounded ${t.color} mb-3`} />
                <h3 className="font-semibold text-sm">{t.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
                {theme === t.id && (
                  <Badge className="mt-2" variant="default">Active</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Font Selection */}
      <Card data-console-card className="hover-elevate">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5 text-primary" />
            Font Selection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fonts.map((f) => (
              <div
                key={f.id}
                className={`
                  p-4 rounded-md border cursor-pointer transition-all duration-200 hover-elevate
                  ${font === f.id ? 'border-primary bg-accent/50' : 'border-border'}
                `}
                onClick={() => {
                  console.log('Font changed to:', f.id);
                  setFont(f.id as any);
                }}
                data-testid={`font-${f.id}`}
              >
                <h3 className={`font-semibold text-sm ${f.id === 'orbitron' ? 'font-orbitron' : f.id === 'space-grotesk' ? 'font-space-grotesk' : f.id === 'jetbrains-mono' ? 'font-mono' : 'font-sans'}`}>
                  {f.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">{f.description}</p>
                <p className={`text-sm mt-2 ${f.id === 'orbitron' ? 'font-orbitron' : f.id === 'space-grotesk' ? 'font-space-grotesk' : f.id === 'jetbrains-mono' ? 'font-mono' : 'font-sans'}`}>
                  The quick brown fox jumps
                </p>
                {font === f.id && (
                  <Badge className="mt-2" variant="default">Active</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gamification Style */}
      <Card data-console-card className="hover-elevate">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gamepad2 className="h-5 w-5 text-primary" />
            Gamification Style
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className={`
                p-6 rounded-md border cursor-pointer transition-all duration-200 hover-elevate
                ${gamificationType === 'sapling' ? 'border-primary bg-accent/50' : 'border-border'}
              `}
              onClick={() => {
                console.log('Gamification changed to: sapling');
                setGamificationType('sapling');
              }}
              data-testid="gamification-sapling"
            >
              <div className="text-2xl mb-2">🌱</div>
              <h3 className="font-semibold">Sapling Growth</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Watch your progress grow like a flourishing plant
              </p>
              {gamificationType === 'sapling' && (
                <Badge className="mt-2" variant="default">Active</Badge>
              )}
            </div>
            
            <div
              className={`
                p-6 rounded-md border cursor-pointer transition-all duration-200 hover-elevate
                ${gamificationType === 'mountain' ? 'border-primary bg-accent/50' : 'border-border'}
              `}
              onClick={() => {
                console.log('Gamification changed to: mountain');
                setGamificationType('mountain');
              }}
              data-testid="gamification-mountain"
            >
              <div className="text-2xl mb-2">🏔️</div>
              <h3 className="font-semibold">Mountain Climb</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Conquer peaks as you achieve your goals
              </p>
              {gamificationType === 'mountain' && (
                <Badge className="mt-2" variant="default">Active</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* EU Configuration Panel */}
      <Card data-console-card className="hover-elevate">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            EU (Effort Multiplier) Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                About EU System
              </h4>
              <p className="text-xs text-muted-foreground">
                EU (Effort Units) normalize performance across different domains. A 3-hour academic session vs 30-minute HIIT workout can have equivalent EU values using custom multipliers.
              </p>
            </div>
            
            <div className="space-y-4">
              {Object.entries(euMultipliers).map(([domain, value]) => (
                <div key={domain} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium capitalize">{domain}</label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{value.toFixed(1)}x</span>
                      <Badge variant="outline" className="text-xs">
                        {calculateEU(1, domain as keyof typeof euMultipliers)} EU/hr
                      </Badge>
                    </div>
                  </div>
                  <Slider
                    value={[value]}
                    onValueChange={([newValue]) => {
                      console.log(`EU multiplier for ${domain} changed to:`, newValue);
                      setEUMultiplier(domain as keyof typeof euMultipliers, newValue);
                    }}
                    min={0.1}
                    max={5.0}
                    step={0.1}
                    className="w-full"
                    data-testid={`eu-slider-${domain}`}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0.1x</span>
                    <span className="font-medium">
                      {domain === 'academic' && 'Base multiplier for study sessions'}
                      {domain === 'fitness' && 'Higher value for intense workouts'}
                      {domain === 'creative' && 'Sustained creative work'}
                      {domain === 'social' && 'Networking & collaboration'}
                      {domain === 'maintenance' && 'Routine & admin tasks'}
                    </span>
                    <span>5.0x</span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* EU Calculation Examples */}
            <div className="bg-card/50 rounded-lg p-4 border border-border/30">
              <h4 className="font-semibold text-sm mb-3">Example Calculations</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span>3h Academic Session:</span>
                  <span className="font-orbitron">{calculateEU(3, 'academic')} EU</span>
                </div>
                <div className="flex justify-between">
                  <span>30min HIIT Workout:</span>
                  <span className="font-orbitron">{calculateEU(0.5, 'fitness')} EU</span>
                </div>
                <div className="flex justify-between">
                  <span>2h Creative Work:</span>
                  <span className="font-orbitron">{calculateEU(2, 'creative')} EU</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Preview Panel */}
      <Card data-console-card className="hover-elevate">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            Live Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-card/50 rounded-lg p-6 border border-border/50">
            <h3 className={`text-lg font-semibold mb-4 ${font === 'orbitron' ? 'font-orbitron' : font === 'space-grotesk' ? 'font-space-grotesk' : font === 'jetbrains-mono' ? 'font-mono' : 'font-sans'}`}>
              BATCAVE Dashboard Preview
            </h3>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                <span className="text-sm">Current Theme: {themes.find(t => t.id === theme)?.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-chart-2 rounded-full"></div>
                <span className="text-sm">Current Font: {fonts.find(f => f.id === font)?.name}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <h4 className="font-semibold text-sm mb-2">Today's Tasks</h4>
                <div className="space-y-2">
                  <div className="h-2 bg-primary/30 rounded"></div>
                  <div className="h-2 bg-primary/50 rounded"></div>
                  <div className="h-2 bg-primary rounded"></div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>XP: +180</span>
                  <span>EU: +{calculateEU(3.5, 'academic')}</span>
                </div>
              </Card>
              <Card className="p-4">
                <h4 className="font-semibold text-sm mb-2">XP & EU Progress ({gamificationType})</h4>
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-lg">{gamificationType === 'sapling' ? '🌱' : '🏔️'}</div>
                  <div className="flex-1 h-2 bg-muted rounded">
                    <div className="h-2 bg-gradient-to-r from-primary to-chart-2 rounded w-3/4"></div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">Daily EU: {(calculateEU(1, 'academic') + calculateEU(0.5, 'fitness')).toFixed(1)}</div>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}