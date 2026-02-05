import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { FullPageSpinner } from '../common/LoadingSpinner'
import type { ReactNode } from 'react'
import type { UserRole } from '../../types/user'

interface ProtectedRouteProps {
  children: ReactNode
  requireRole?: UserRole
}

export function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const { user, profile, loading, initialized } = useAuthStore()

  if (!initialized || loading) {
    return <FullPageSpinner />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requireRole && profile?.role !== requireRole) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
