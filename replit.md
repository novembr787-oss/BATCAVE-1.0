# BATCAVE - Productivity Command Center

## Overview

BATCAVE is a gamified student productivity planner designed as a cinematic, immersive command center experience inspired by Dark Knight trilogy interfaces. The application combines task management, analytics, and planning with futuristic theming, GSAP/Framer Motion animations, and AI-powered task suggestions. Built with React/TypeScript frontend, Express.js backend, and PostgreSQL database with Drizzle ORM.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development builds
- **Routing**: Wouter for lightweight client-side navigation
- **State Management**: React Context API for theme management and TanStack Query for server state caching
- **Styling**: TailwindCSS with CSS variables for dynamic theming and glassmorphism effects
- **Component System**: Radix UI primitives with custom Shadcn/ui components for accessibility
- **Animations**: GSAP for complex timeline animations and Framer Motion for component transitions

### Design System
- **Theming**: CSS variable-based system supporting 5 preset themes (Dark Knight, Neon Grid, Stealth Ops, Aurora, Minimal White)
- **Typography**: Dynamic font switching between Orbitron (futuristic), Space Grotesk (modern), JetBrains Mono (technical), and Inter (body text)
- **Visual Effects**: Glassmorphism cards, neon border glows, holographic buttons, and radar sweep animations
- **Layout**: Consistent Tailwind spacing units with collapsible sidebar navigation

### Backend Architecture
- **Server**: Express.js with TypeScript for REST API endpoints
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations and migrations
- **Session Management**: Express sessions with HTTP-only cookies for authentication
- **Storage Abstraction**: Interface-based storage layer with memory and database implementations for flexible deployment

### Gamification System
- **EU (Effort Unit) System**: Cross-domain performance normalization with configurable multipliers per activity type (academic: 1.0, fitness: 2.5, creative: 0.8, social: 1.2, maintenance: 0.6)
- **Progress Types**: "Sapling" and "Mountain" progression systems to match different user motivation preferences
- **XP and Streak Tracking**: Animated progress rings and counters for visual engagement feedback

### Analytics & Visualization
- **Chart Library**: Recharts for base chart rendering with GSAP/Framer Motion overlays for cinematic effects
- **Dashboard Components**: 3D bar charts with staggered animations, radar charts for multi-domain tracking, circular time distribution visualizations
- **Data Aggregation**: Weekly, monthly, and yearly performance insights with domain-specific breakdowns

### Task Management
- **CRUD Operations**: Full task lifecycle management with priority, domain, and time tracking
- **Form Validation**: Zod schemas for client-server type safety and input validation
- **Real-time Updates**: Optimistic updates with TanStack Query for responsive UX

### AI Integration
- **Task Suggestions**: Google Gemini AI integration for intelligent task recommendations based on existing tasks and domain balance
- **Strategy Explanations**: AI-powered insights for task prioritization and productivity optimization
- **Error Handling**: Graceful fallback when AI services are unavailable

## External Dependencies

### Core Technologies
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Google Gemini AI**: AI-powered task suggestions and productivity insights via @google/genai
- **Replit Infrastructure**: Development environment with runtime error overlay and cartographer plugins

### UI/UX Libraries
- **Radix UI**: Comprehensive primitive components for accessibility (accordion, dialog, dropdown, etc.)
- **TailwindCSS**: Utility-first styling with PostCSS and Autoprefixer
- **Lucide React**: Icon system for consistent visual elements
- **GSAP**: Professional-grade animation library for cinematic effects
- **Framer Motion**: React animation library for component transitions

### Development Tools
- **Drizzle Kit**: Database migration and schema management tools
- **Recharts**: Composable charting library built on D3
- **React Hook Form**: Form state management with Zod validation
- **Date-fns**: Date manipulation and formatting utilities
- **Wouter**: Minimalist client-side routing solution

### Build & Deployment
- **Vite**: Fast build tool with HMR and optimized production builds
- **ESBuild**: Server-side bundling for production deployment
- **TypeScript**: Static typing across client, server, and shared schemas