# Noreaster

Noreaster is a web app for running a FIRST Robotics offseason event. It manages teams, alliances, matches, a schedule generator, and rankings.

Built with React 19, TypeScript, Vite, React Router v7, Tailwind CSS v4, shadcn/ui, Supabase, TanStack Query, and dnd-kit.

## Features

- Teams: create teams with number, name, and optional robot image (stored in Supabase Storage)
- Alliances: drag-and-drop teams into 4-team alliances, edit names, view alliance details
- Matches: list of matches with score display; edit individual matches (scores and RP toggles)
- Schedule: single-day round-robin generator with time controls, lunch break, and statistics
- Rankings: average RP standings with head-to-head and average score tiebreakers; full-screen display
- Auth: email + password sign-in (admin-managed accounts)

## Getting Started

Prereqs:
- Node 20+
- Supabase project with URL and anon key

1) Install deps

```bash
npm i
```

2) Configure environment

Create `.env` with:

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3) Run dev server

```bash
npm run dev
```

Open the app at the printed local URL.

## Supabase Setup

- Create buckets: `robots` (for team images). Optionally set private and rely on signed URLs (already handled).
- Tables (minimum): `teams`, `alliances`, `alliance_teams`, `matches`.
- RLS policies: allow authenticated read/write as needed. Example: public read of `teams`, authenticated insert/update; storage policies for `robots` bucket.
- Disable public signups if you want admin-only accounts (Dashboard → Auth → Providers → Email → Disable signups).

### Matches RP columns

To add Ranking Point booleans:

```sql
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS red_coral_rp  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS red_algae_rp  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS red_barge_rp  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS blue_coral_rp boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS blue_algae_rp boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS blue_barge_rp boolean NOT NULL DEFAULT false;
```

## App Overview

- `/teams`: list teams; use “New Team” to add a team.
- `/alliances`: drag teams into alliances; click a card to view alliance details.
- `/matches`: list matches; click Edit to update scores and RP.
- `/matches/preview`: shows the next unplayed match lineups side-by-side.
- `/schedule`: generate a round-robin schedule; save to create matches.
- `/rankings`: full-screen standings board with large text and fullscreen toggle.
- `/auth`: email/password sign-in.

## Tech Notes

- Styling: Tailwind v4 with CSS-first config and shadcn/ui components
- Data: Supabase client (`src/supabase/client.ts`), TanStack Query for data fetching/mutations
- Images: `RobotImage` component generates signed URLs when needed
- DnD: dnd-kit, a single DndContext across panels in alliances

