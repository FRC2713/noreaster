import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useAuth } from './use-auth'

export function useAuthRedirect() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && user) {
      // If user is authenticated and there's a redirect location, navigate there
      const from = location.state?.from?.pathname
      if (from && from !== '/auth') {
        navigate(from, { replace: true })
      } else {
        // Default redirect to home if no specific redirect location
        navigate('/', { replace: true })
      }
    }
  }, [user, loading, location.state?.from, navigate])

  return { user, loading }
}
