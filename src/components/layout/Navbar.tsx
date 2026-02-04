import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../common/Button'

export function Navbar() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <nav className="border-b border-secondary-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-sm font-bold text-white">
            ES
          </div>
          <span className="text-xl font-bold text-secondary-900">
            ExamSpot
          </span>
        </Link>

        {user && (
          <div className="flex items-center gap-6">
            <div className="hidden items-center gap-4 sm:flex">
              <Link
                to="/dashboard"
                className="text-sm font-medium text-secondary-600 hover:text-secondary-900"
              >
                Dashboard
              </Link>
              {profile?.role === 'teacher' && (
                <Link
                  to="/dashboard"
                  className="text-sm font-medium text-secondary-600 hover:text-secondary-900"
                >
                  Mis Exámenes
                </Link>
              )}
              {profile?.role === 'student' && (
                <Link
                  to="/dashboard"
                  className="text-sm font-medium text-secondary-600 hover:text-secondary-900"
                >
                  Mi Historial
                </Link>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-secondary-900">
                  {profile?.full_name || profile?.email}
                </p>
                <p className="text-xs capitalize text-secondary-500">
                  {profile?.role}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                Cerrar sesión
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
