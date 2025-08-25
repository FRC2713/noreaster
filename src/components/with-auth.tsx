import React from 'react'
import { ProtectedRoute } from './protected-route'

/**
 * Higher-order component that wraps a component with authentication protection
 * @param Component - The component to protect
 * @param redirectTo - Optional custom redirect path
 * @returns A new component wrapped with authentication protection
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  redirectTo?: string
) {
  const ProtectedComponent = (props: P) => (
    <ProtectedRoute redirectTo={redirectTo}>
      <Component {...props} />
    </ProtectedRoute>
  )

  ProtectedComponent.displayName = `withAuth(${Component.displayName || Component.name})`

  return ProtectedComponent
}
