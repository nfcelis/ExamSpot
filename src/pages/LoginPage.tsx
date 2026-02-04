import { Link } from 'react-router-dom'
import { LoginForm } from '../components/auth/LoginForm'
import { Card } from '../components/common/Card'

export function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-lg font-bold text-white">
            ES
          </div>
          <h1 className="text-2xl font-bold text-secondary-900">
            Bienvenido a ExamSpot
          </h1>
          <p className="mt-1 text-secondary-500">
            Inicia sesión en tu cuenta
          </p>
        </div>

        <Card>
          <LoginForm />
        </Card>

        <p className="mt-4 text-center text-sm text-secondary-500">
          ¿No tienes cuenta?{' '}
          <Link
            to="/register"
            className="font-medium text-primary-600 hover:text-primary-500"
          >
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  )
}
