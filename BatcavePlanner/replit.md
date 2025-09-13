# BATCAVE - Productivity Command Center

## Overview

BATCAVE is a gamified student productivity planner designed as a cinematic, immersive command center experience. The application combines task management, analytics, and planning with a Dark Knight-inspired aesthetic featuring cinema-grade animations and a futuristic interface. Built as a modern web application with React/TypeScript, it emphasizes visual appeal through glassmorphism design, neon accents, and sophisticated animations using GSAP and Framer Motion.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern component patterns
- **Build Tool**: Vite for fast development and optimized production builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React Context API for theme management and TanStack Query for server state
- **Styling**: TailwindCSS with custom CSS variables for dynamic theming
- **Component Library**: Radix UI primitives with custom Shadcn/ui components for accessibility
- **Animations**: GSAP for complex timeline animations and Framer Motion for component transitions

### Design System
- **Theme Architecture**: CSS variable-based theming supporting multiple presets (Dark Knight, Neon Grid, Stealth Ops, Aurora, Minimal White)
- **Typography**: Font switching system between Orbitron (futuristic), Space Grotesk (modern), JetBrains Mono (technical), and Inter (body text)
- **Layout System**: Consistent Tailwind spacing units (2, 4, 8, 16, 24) with glassmorphism cards and neon border effects
- **Color Management**: HSL-based color system with alpha transparency support for dynamic theming

### Backend Architecture
- **Server**: Express.js with TypeScript for API endpoints
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Connection**: Neon Database serverless PostgreSQL for cloud deployment
- **Session Management**: Connect-pg-simple for PostgreSQL-backed sessions
- **Storage Interface**: Abstracted storage layer with memory and database implementations

### Gamification System
- **EU (Effort Unit) System**: Cross-domain performance normalization with configurable multipliers for different activity types (academic: 1.0, fitness: 2.5, creative: 0.8, social: 1.2, maintenance: 0.6)
- **Gamification Types**: "Sapling" and "Mountain" progression systems for different user preferences
- **XP and Streak Tracking**: Progress rings and animated counters for engagement metrics

### Analytics & Visualization
- **Chart Library**: Recharts for base chart rendering with GSAP/Framer Motion overlays for cinematic effects
- **Dashboard Components**: 3D bar charts, radar/spider charts, circular time distributions with staggered animations
- **Performance Metrics**: Weekly, monthly, and yearly insights with domain-specific breakdowns

### Authentication & Security
- **User Schema**: Basic username/password authentication with UUID primary keys
- **Session Security**: HTTP-only cookies with secure session management
- **Input Validation**: Zod schemas for type-safe form validation and API contracts

## External Dependencies

### Core Infrastructure
- **Database**: Neon Database (PostgreSQL) - Serverless database with connection pooling
- **Drizzle ORM**: Type-safe database operations with automatic migrations
- **TanStack Query**: Server state management with caching and background updates

### UI & Animation Libraries
- **Radix UI**: Unstyled, accessible component primitives for complex UI patterns
- **GSAP**: Professional-grade animation library for timeline-based effects
- **Framer Motion**: React animation library for component transitions
- **Recharts**: React charting library built on D3 for data visualization
- **Lucide React**: Consistent icon system with 1000+ SVG icons

### Development Tools
- **TypeScript**: Static type checking across frontend and backend
- **Vite**: Fast build tool with HMR and optimized bundling
- **TailwindCSS**: Utility-first CSS framework with custom configuration
- **PostCSS**: CSS processing with Autoprefixer for browser compatibility

### Planned Integrations
- **Google Gemini AI**: AI-powered planning assistant (ALFRED) for intelligent task management
- **Export Capabilities**: PDF and data export functionality for analytics
- **Calendar Integration**: Temporal navigation with drag-and-drop event management