import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import AppLayout from './App.tsx'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <div>Home Page</div> },
      { path: 'about', element: <div>About Page</div> },
      {
        path: 'auth',
        lazy: () => import('./routes/auth').then(m => ({ Component: m.default })),
      },
      {
        path: 'teams/new',
        lazy: () => import('./routes/teams.new').then(m => ({ Component: m.default })),
      },
      {
        path: 'teams',
        lazy: () => import('./routes/teams').then(m => ({ Component: m.default })),
      },
      {
        path: 'alliances',
        lazy: () => import('./routes/alliances').then(m => ({ Component: m.default })),
      },
      {
        path: 'alliances/:allianceId',
        lazy: () => import('./routes/alliance').then(m => ({ Component: m.default })),
      },
      {
        path: 'matches',
        lazy: () => import('./routes/matches').then(m => ({ Component: m.default })),
      },
      {
        path: 'matches/preview',
        lazy: () => import('./routes/matches.preview').then(m => ({ Component: m.default })),
      },
      {
        path: 'matches/:matchId',
        lazy: () => import('./routes/match').then(m => ({ Component: m.default })),
      },
      {
        path: 'schedule',
        lazy: () => import('./routes/schedule').then(m => ({ Component: m.default })),
      },
      {
        path: 'rankings',
        lazy: () => import('./routes/rankings').then(m => ({ Component: m.default })),
      },
    ],
  },
])

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
