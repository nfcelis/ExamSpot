import { Link } from 'react-router-dom'
import { Button } from '../components/common/Button'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary-50 px-4 text-center">
      <h1 className="text-6xl font-bold text-primary-600">404</h1>
      <p className="mt-4 text-xl font-semibold text-secondary-900">
        Página no encontrada
      </p>
      <p className="mt-2 text-secondary-500">
        La página que buscas no existe o fue movida.
      </p>
      <Link to="/dashboard" className="mt-6">
        <Button>Volver al inicio</Button>
      </Link>
    </div>
  )
}
