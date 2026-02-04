import { PageLayout } from '../components/layout/PageLayout'
import { useAuth } from '../hooks/useAuth'
import { Card } from '../components/common/Card'
import { Button } from '../components/common/Button'

export function DashboardPage() {
  const { profile } = useAuth()

  return (
    <PageLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-secondary-900">
          Hola, {profile?.full_name || 'Usuario'}
        </h1>
        <p className="mt-1 text-secondary-500">
          {profile?.role === 'teacher'
            ? 'Gestiona tus exámenes y revisa el progreso de tus estudiantes.'
            : 'Explora exámenes disponibles y revisa tu progreso.'}
        </p>
      </div>

      {profile?.role === 'teacher' ? (
        <TeacherDashboard />
      ) : (
        <StudentDashboard />
      )}
    </PageLayout>
  )
}

function TeacherDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-secondary-900">
          Mis Exámenes
        </h2>
        <Button>Crear Examen</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-2 border-dashed border-secondary-300 flex flex-col items-center justify-center text-center py-12">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <p className="font-medium text-secondary-700">Crear nuevo examen</p>
          <p className="mt-1 text-sm text-secondary-500">
            Comienza a crear preguntas para tus estudiantes
          </p>
        </Card>
      </div>

      <Card>
        <h3 className="mb-4 text-lg font-semibold text-secondary-900">
          Estadísticas Rápidas
        </h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-primary-600">0</p>
            <p className="text-sm text-secondary-500">Exámenes</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-accent-600">0</p>
            <p className="text-sm text-secondary-500">Estudiantes</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-secondary-600">0%</p>
            <p className="text-sm text-secondary-500">Promedio</p>
          </div>
        </div>
      </Card>
    </div>
  )
}

function StudentDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-secondary-900">
            Exámenes Disponibles
          </h3>
          <p className="text-sm text-secondary-500">
            No hay exámenes disponibles en este momento.
          </p>
        </Card>

        <Card>
          <h3 className="mb-4 text-lg font-semibold text-secondary-900">
            Mi Progreso
          </h3>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary-600">0</p>
              <p className="text-sm text-secondary-500">Exámenes realizados</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-accent-600">0%</p>
              <p className="text-sm text-secondary-500">Promedio</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="mb-4 text-lg font-semibold text-secondary-900">
          Historial Reciente
        </h3>
        <p className="text-sm text-secondary-500">
          Aún no has realizado ningún examen. Explora los exámenes disponibles para comenzar.
        </p>
      </Card>
    </div>
  )
}
