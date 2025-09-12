import { StrictMode, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import AppLayout from './App.tsx';
import './index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './lib/auth-context';
import { withAuth } from './components/with-auth';
import { SuspenseWrapper } from './components/route-loader';

// Lazy load route components for code splitting
const Auth = lazy(() => import('./routes/auth'));
const TeamsNew = lazy(() => import('./routes/teams.new'));
const Teams = lazy(() => import('./routes/teams'));
const Team = lazy(() => import('./routes/team'));
const Alliances = lazy(() => import('./routes/alliances'));
const AlliancesEdit = lazy(() => import('./routes/alliances.edit'));
const Alliance = lazy(() => import('./routes/alliance'));
const Matches = lazy(() => import('./routes/matches'));
const MatchesPreview = lazy(() => import('./routes/matches.preview'));
const MatchDetails = lazy(() => import('./routes/match-details'));
const Match = lazy(() => import('./routes/match'));
const Schedule = lazy(() => import('./routes/schedule'));
const Rankings = lazy(() => import('./routes/rankings'));
const Live = lazy(() => import('./routes/live'));

// Create wrapped components for protected routes
const ProtectedTeamsNew = withAuth(TeamsNew);
const ProtectedTeam = withAuth(Team);
const ProtectedAlliancesEdit = withAuth(AlliancesEdit);
const ProtectedAlliance = withAuth(Alliance);
const ProtectedMatch = withAuth(Match);

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <AppLayout />,
      children: [
        {
          index: true,
          element: (
            <SuspenseWrapper>
              <Live />
            </SuspenseWrapper>
          ),
        },
        {
          path: 'auth',
          element: (
            <SuspenseWrapper>
              <Auth />
            </SuspenseWrapper>
          ),
        },
        {
          path: 'update-password',
          element: (
            <SuspenseWrapper>
              <Auth />
            </SuspenseWrapper>
          ),
        },
        {
          path: 'teams/new',
          element: (
            <SuspenseWrapper>
              <ProtectedTeamsNew />
            </SuspenseWrapper>
          ),
        },
        {
          path: 'teams',
          element: (
            <SuspenseWrapper>
              <Teams />
            </SuspenseWrapper>
          ),
        },
        {
          path: 'teams/:teamId',
          element: (
            <SuspenseWrapper>
              <ProtectedTeam />
            </SuspenseWrapper>
          ),
        },
        {
          path: 'alliances',
          element: (
            <SuspenseWrapper>
              <Alliances />
            </SuspenseWrapper>
          ),
        },
        {
          path: 'alliances/edit',
          element: (
            <SuspenseWrapper>
              <ProtectedAlliancesEdit />
            </SuspenseWrapper>
          ),
        },
        {
          path: 'alliances/:allianceId',
          element: (
            <SuspenseWrapper>
              <ProtectedAlliance />
            </SuspenseWrapper>
          ),
        },
        {
          path: 'matches',
          element: (
            <SuspenseWrapper>
              <Matches />
            </SuspenseWrapper>
          ),
        },
        {
          path: 'matches/preview',
          element: (
            <SuspenseWrapper>
              <MatchesPreview />
            </SuspenseWrapper>
          ),
        },
        {
          path: 'matches/details/:matchId',
          element: (
            <SuspenseWrapper>
              <MatchDetails />
            </SuspenseWrapper>
          ),
        },
        {
          path: 'matches/:matchId',
          element: (
            <SuspenseWrapper>
              <ProtectedMatch />
            </SuspenseWrapper>
          ),
        },
        {
          path: 'schedule',
          element: (
            <SuspenseWrapper>
              <Schedule />
            </SuspenseWrapper>
          ),
        },
        {
          path: 'rankings',
          element: (
            <SuspenseWrapper>
              <Rankings />
            </SuspenseWrapper>
          ),
        },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL }
);

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
);
