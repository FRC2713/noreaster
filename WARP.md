# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Noreaster is a React-based web application for managing FIRST Robotics Competition (FRC) offseason events. It handles teams, alliances, matches, scheduling, and rankings with a modern TypeScript + React 19 architecture.

## Development Commands

### Environment Setup
```bash
# Install dependencies
npm i

# Start development server
npm run dev

# Open app at printed local URL (typically http://localhost:5173)
```

### Build & Deploy
```bash
# Type check and build for production
npm run build

# Preview production build locally
npm run preview

# Deploy to GitHub Pages
npm run deploy
```

### Code Quality
```bash
# Run ESLint
npm run lint
```

## Architecture Overview

### Technology Stack
- **Frontend Framework**: React 19 with TypeScript
- **Routing**: React Router v7 with file-based routing in `src/routes/`
- **Styling**: Tailwind CSS v4 with shadcn/ui components
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Data Management**: TanStack Query for server state, Zustand for client state
- **Build Tool**: Vite with TypeScript path aliases
- **Drag & Drop**: dnd-kit for alliance team management

### Project Structure
```
src/
├── routes/          # Page components (teams, alliances, matches, etc.)
├── components/      # Reusable UI components
│   └── ui/         # shadcn/ui components
├── lib/            # Custom hooks and utilities
├── supabase/       # Supabase client configuration
└── types/          # TypeScript type definitions
```

### Key Architectural Patterns

**Authentication Flow**
- `AuthProvider` wraps the app with Supabase auth context
- `withAuth()` HOC protects routes requiring authentication
- `useAuth()` hook provides auth state throughout the app

**Data Layer**
- Supabase client in `src/supabase/client.ts`
- TanStack Query for server state management with custom hooks in `lib/`
- Type-safe database interfaces defined in `src/types/index.ts`

**Route Protection**
- Most routes wrapped with `withAuth()` except home and auth pages
- Automatic redirect to sign-in for unauthenticated users

**Component Architecture**
- shadcn/ui provides base components (Button, Dialog, etc.)
- Business components in `src/components/` compose UI elements
- TypeScript path aliases (`@/`, `@components/`, `@lib/`, etc.) for clean imports

### Data Models
- **Teams**: Number, name, optional robot image (stored in Supabase Storage)
- **Alliances**: 4-team groupings with drag-and-drop interface
- **Matches**: Red vs Blue alliances with scores and Ranking Points (RP)
- **Schedule**: Round-robin generator with configurable timing

### Environment Variables
Required in `.env`:
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### GitHub Pages Deployment
- Configured for GitHub Pages with `base: '/noreaster/'` in `vite.config.ts`
- `npm run deploy` publishes to `gh-pages` branch
- Includes 404.html copy for client-side routing

## Supabase Schema Requirements

### Core Tables
- `teams`: Team data with robot images in `robots` storage bucket
- `alliances`: Alliance groupings  
- `alliance_teams`: Many-to-many relationship with slot ordering
- `matches`: Match results with RP columns

### RP Columns Setup
```sql
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS red_coral_rp  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS red_algae_rp  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS red_barge_rp  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS blue_coral_rp boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS blue_algae_rp boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS blue_barge_rp boolean NOT NULL DEFAULT false;
```

## Key Development Practices

### Component Development
- Prefer shadcn/ui components - ask to install if not available
- Use TypeScript path aliases for imports
- Follow React 19 patterns (no React.FC, modern JSX transform)

### State Management
- Server state: TanStack Query with custom hooks in `lib/`
- Authentication: Supabase Auth with React Context
- UI state: Local useState or Zustand for complex client state

### Styling
- Tailwind v4 CSS-first configuration
- shadcn/ui "new-york" style with CSS variables
- Responsive design with container-based layouts
