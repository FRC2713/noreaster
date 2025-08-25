// Routes that require authentication
export const PROTECTED_ROUTES = [
  '/teams',
  '/teams/new',
  '/alliances',
  '/matches',
  '/schedule',
  '/rankings',
]

// Routes that are always public
export const PUBLIC_ROUTES = [
  '/',
  '/auth',
  '/update-password',
]

/**
 * Check if a given path requires authentication
 */
export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )
}

/**
 * Check if a given path is always public
 */
export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )
}

/**
 * Get the redirect path for unauthenticated users
 */
export function getAuthRedirectPath(): string {
  return '/auth'
}
