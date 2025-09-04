import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import AppLayout from './App.tsx'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './lib/auth-context'
import { withAuth } from './components/with-auth'

// Import route components directly
import Home from './routes/home'
import Auth from './routes/auth'
import TeamsNew from './routes/teams.new'
import Teams from './routes/teams'
import Team from './routes/team'
import Alliances from './routes/alliances'
import AlliancesEdit from './routes/alliances.edit'
import Alliance from './routes/alliance'
import Matches from './routes/matches'
import MatchesPreview from './routes/matches.preview'
import MatchDetails from './routes/match-details'
import Match from './routes/match'
import Schedule from './routes/schedule'
import Rankings from './routes/rankings'
import Live from './routes/live'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, Component: Home },
      { path: 'auth', Component: Auth },
      { path: 'update-password', Component: Auth },
      { path: 'teams/new', Component: withAuth(TeamsNew) },
      { path: 'teams', Component: Teams },
      { path: 'teams/:teamId', Component: withAuth(Team) },
      { path: 'alliances', Component: Alliances },
      { path: 'alliances/edit', Component: withAuth(AlliancesEdit) },
      { path: 'alliances/:allianceId', Component: withAuth(Alliance) },
      { path: 'matches', Component: Matches },
      { path: 'matches/preview', Component: MatchesPreview },
      { path: 'matches/details/:matchId', Component: MatchDetails },
      { path: 'matches/:matchId', Component: withAuth(Match) },
      { path: 'schedule', Component: withAuth(Schedule) },
      { path: 'rankings', Component: Rankings },
      { path: 'live', Component: Live },
    ],
  },
], { basename: import.meta.env.BASE_URL })

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
