import { Link } from 'react-router-dom'
import { RegisterForm } from '../components/auth/RegisterForm'
import { Card } from '../components/common/Card'

export function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-lg font-bold text-white">
            ES
          </div>
          <h1 className="text-2xl font-bold text-secondary-900">
            Crear Cuenta
          </h1>
          <p className="mt-1 text-secondary-500">
            Regístrate para comenzar a usar ExamSpot
          </p>
        </div>

        <Card>
          <RegisterForm />
        </Card>

        <p className="mt-4 text-center text-sm text-secondary-500">
          ¿Ya tienes cuenta?{' '}
          <Link
            to="/login"
            className="font-medium text-primary-600 hover:text-primary-500"
          >
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
