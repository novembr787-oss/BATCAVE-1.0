# BATCAVE Design Guidelines

## Design Approach
**Reference-Based Approach**: Drawing inspiration from cinematic interfaces like Dark Knight trilogy, Minority Report, and Iron Man's JARVIS system. The application prioritizes immersive experience and visual impact to gamify productivity.

## Core Design Elements

### Color Palette

**Dark Knight Theme (Primary)**
- Background: 0 0% 5% (deep black)
- Surface: 0 0% 8% (card backgrounds) 
- Electric Blue Primary: 200 100% 60%
- Blue Glow: 200 80% 40%
- Text Light: 0 0% 95%
- Text Muted: 0 0% 65%

**Additional Theme Presets**
- Neon Grid: 300 100% 60% (magenta) + 180 100% 50% (cyan)
- Stealth Ops: 0 0% 10% + 0 100% 45% (tactical red)
- Aurora: 250 60% 60% flowing to 180 70% 55%
- Minimal White: 0 0% 98% + 220 15% 25%

### Typography
- **Primary**: Orbitron (futuristic headings)
- **Interface**: Space Grotesk (modern sans-serif)
- **Code/Data**: JetBrains Mono (monospace elements)
- **Fallback**: Inter (body text)

### Layout System
**Tailwind Spacing**: Consistent use of 2, 4, 8, 16, 24 units
- Micro spacing: p-2, m-2
- Standard spacing: p-4, gap-4
- Section spacing: p-8, my-8
- Large spacing: p-16, gap-24

## Component Library

### Core UI Elements
- **Glassmorphism Cards**: Semi-transparent backgrounds with blur effects
- **Neon Borders**: Subtle glows on interactive elements
- **Holographic Buttons**: Electric blue glow with pulse animations
- **Data Visualization**: 3D-enhanced charts with cinematic styling

### Navigation
- **Collapsible Sidebar**: Icons-only collapsed, full labels expanded
- **Active States**: Soft pulsing glow for current page
- **Hover Effects**: Subtle brightness increase with blue edge glow

### Animations
**GSAP + Framer Motion Integration**:
- **Console Opening**: Holographic dashboard emergence
- **Live Preview**: Real-time morphing of theme elements  
- **Sidebar**: Smooth width transitions with staggered icon reveals
- **Dashboard Cards**: Entrance stagger with radar sweep backgrounds
- **Minimal Usage**: Focus on meaningful transitions, avoid distracting motion

### Gamification Elements
- **XP Progress**: Animated bars with particle effects
- **Achievement Cards**: Glow-up animations on completion
- **Theme Integration**: Sapling growth or mountain climb visualizations
- **Status Indicators**: Pulsing activity dots and progress rings

### Customization Console
- **Theme Switcher**: Live preview panel with instant morphing
- **Font Selector**: Typography samples with real-time updates
- **Gamification Toggle**: Animated switch between growth metaphors
- **Settings Persistence**: Seamless Supabase integration

### Data Display
- **Analytics Dashboard**: Mission-control layout with 3D charts
- **Progress Tracking**: Circular progress rings with neon accents
- **Performance Metrics**: Holographic-style data cards
- **Interactive Elements**: Hover states reveal additional data layers

## Key Design Principles
1. **Cinematic Immersion**: Every interaction should feel like operating advanced technology
2. **Purposeful Animation**: Motion enhances usability rather than decorating
3. **Consistent Theming**: All elements adapt cohesively to selected themes  
4. **Accessibility**: Maintain contrast ratios and keyboard navigation across all themes
5. **Performance**: Optimize GSAP animations for smooth 60fps experiences