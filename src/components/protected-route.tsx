import { Navigate, useLocation } from 'react-router'
import { useAuth } from '../lib/use-auth'
import { getAuthRedirectPath } from '../lib/auth-utils'

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
}

export function ProtectedRoute({ 
  children, 
  fallback, 
  redirectTo = getAuthRedirectPath() 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return fallback || (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    // Redirect to auth page with the intended destination
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  return <>{children}</>
}
