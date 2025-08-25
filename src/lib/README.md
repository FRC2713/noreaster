# Authentication System

This project implements a comprehensive authentication system using Supabase and React Router v7, following best practices for protected routes and authentication state management.

## Components

### AuthProvider
The main authentication context provider that manages user state and authentication methods.

```tsx
import { AuthProvider } from './lib/auth-context'

function App() {
  return (
    <AuthProvider>
      {/* Your app components */}
    </AuthProvider>
  )
}
```

### ProtectedRoute
A component that wraps protected content and redirects unauthenticated users.

```tsx
import { ProtectedRoute } from './components/protected-route'

function MyProtectedComponent() {
  return (
    <ProtectedRoute>
      <div>This content requires authentication</div>
    </ProtectedRoute>
  )
}
```

### ProtectedLazyRoute
A component that combines lazy loading with authentication protection.

```tsx
import { ProtectedLazyRoute } from './components/protected-lazy-route'

// In your router configuration
{
  path: '/protected',
  element: <ProtectedLazyRoute lazyComponent={() => import('./routes/protected')} />
}
```

### withAuth HOC
A higher-order component for protecting route components.

```tsx
import { withAuth } from './components/with-auth'

const ProtectedComponent = withAuth(MyComponent)
```

## Hooks

### useAuth
Access authentication state and methods throughout your components.

```tsx
import { useAuth } from './lib/auth-context'

function MyComponent() {
  const { user, loading, signOut } = useAuth()
  
  if (loading) return <div>Loading...</div>
  if (!user) return <div>Please sign in</div>
  
  return (
    <div>
      <p>Welcome, {user.email}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}
```

### useAuthRedirect
Handle redirects after successful authentication.

```tsx
import { useAuthRedirect } from './lib/auth-redirect'

function AuthCallback() {
  const { user, loading } = useAuthRedirect()
  
  if (loading) return <div>Authenticating...</div>
  
  return <div>Redirecting...</div>
}
```

## Utilities

### Route Protection
Check if routes require authentication:

```tsx
import { isProtectedRoute, isPublicRoute } from './lib/auth-utils'

const needsAuth = isProtectedRoute('/teams') // true
const isPublic = isPublicRoute('/') // true
```

## Router Configuration

The router is configured to protect specific routes:

- `/teams/*` - Team management
- `/alliances/*` - Alliance management  
- `/matches/*` - Match management
- `/schedule` - Schedule viewing
- `/rankings` - Rankings viewing

Public routes include:
- `/` - Home page
- `/auth` - Authentication pages
- `/update-password` - Password reset

## Best Practices

1. **Always use the AuthProvider** at the top level of your app
2. **Use ProtectedRoute for simple protection** of JSX content
3. **Use ProtectedLazyRoute for route-level protection** with lazy loading
4. **Use withAuth HOC** when you need to protect entire components
5. **Handle loading states** in your components using the `loading` state from `useAuth`
6. **Use the redirect state** to send users back to their intended destination after login

## Error Handling

The authentication system includes comprehensive error handling:
- Network errors during authentication
- Invalid session states
- Graceful fallbacks for loading states
- Proper cleanup of subscriptions and event listeners
