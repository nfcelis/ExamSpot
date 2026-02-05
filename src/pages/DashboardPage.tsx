import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageLayout } from '../components/layout/PageLayout'
import { useAuth } from '../hooks/useAuth'
import { Card } from '../components/common/Card'
import { Button } from '../components/common/Button'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import { ExamList } from '../components/exam/ExamList'
import { useExams, useUpdateExam, useDeleteExam } from '../hooks/useExams'
import { useMyAttempts } from '../hooks/useAttempts'
import { formatDate } from '../lib/utils'

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
  const { data: exams = [], isLoading } = useExams()
  const updateExam = useUpdateExam()
  const deleteExam = useDeleteExam()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handlePublish = (id: string) => {
    updateExam.mutate({ id, data: { status: 'published' } })
  }

  const handleArchive = (id: string) => {
    updateExam.mutate({ id, data: { status: 'archived' } })
  }

  const handleDelete = () => {
    if (deleteId) {
      deleteExam.mutate(deleteId, {
        onSuccess: () => setDeleteId(null),
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-secondary-900">
          Mis Exámenes
        </h2>
        <Link to="/exams/new">
          <Button>Crear Examen</Button>
        </Link>
      </div>

      <ExamList
        exams={exams}
        loading={isLoading}
        isTeacher
        onPublish={handlePublish}
        onArchive={handleArchive}
        onDelete={(id) => setDeleteId(id)}
        emptyMessage="No has creado ningún examen aún."
      />

      {exams.length === 0 && !isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link to="/exams/new">
            <Card className="flex cursor-pointer flex-col items-center justify-center border-2 border-dashed border-secondary-300 py-12 text-center transition-colors hover:border-primary-300 hover:bg-primary-50">
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
          </Link>
        </div>
      )}

      <Card>
        <h3 className="mb-4 text-lg font-semibold text-secondary-900">
          Estadísticas Rápidas
        </h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-primary-600">{exams.length}</p>
            <p className="text-sm text-secondary-500">Exámenes</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-accent-600">
              {exams.filter((e) => e.status === 'published').length}
            </p>
            <p className="text-sm text-secondary-500">Publicados</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-secondary-600">
              {exams.filter((e) => e.status === 'draft').length}
            </p>
            <p className="text-sm text-secondary-500">Borradores</p>
          </div>
        </div>
      </Card>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar examen"
        message="¿Estás seguro de que deseas eliminar este examen? Esta acción no se puede deshacer."
        loading={deleteExam.isPending}
      />
    </div>
  )
}

function StudentDashboard() {
  const { data: publishedExams = [], isLoading: examsLoading } = useExams({
    status: 'published',
    is_public: true,
  })
  const { data: myAttempts = [], isLoading: attemptsLoading } = useMyAttempts()

  const completedAttempts = myAttempts.filter((a) => a.is_completed)
  const averageScore =
    completedAttempts.length > 0
      ? Math.round(
          completedAttempts.reduce((sum, a) => sum + a.percentage, 0) / completedAttempts.length
        )
      : 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-4 text-lg font-semibold text-secondary-900">
          Exámenes Disponibles
        </h2>
        <ExamList
          exams={publishedExams}
          loading={examsLoading}
          emptyMessage="No hay exámenes disponibles en este momento."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-secondary-900">
            Mi Progreso
          </h3>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary-600">
                {completedAttempts.length}
              </p>
              <p className="text-sm text-secondary-500">Exámenes realizados</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-accent-600">{averageScore}%</p>
              <p className="text-sm text-secondary-500">Promedio</p>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 text-lg font-semibold text-secondary-900">
            Historial Reciente
          </h3>
          {attemptsLoading ? (
            <p className="text-sm text-secondary-500">Cargando...</p>
          ) : completedAttempts.length === 0 ? (
            <p className="text-sm text-secondary-500">
              Aún no has realizado ningún examen.
            </p>
          ) : (
            <div className="space-y-2">
              {completedAttempts.slice(0, 5).map((attempt) => (
                <Link
                  key={attempt.id}
                  to={`/exams/${attempt.exam_id}/results/${attempt.id}`}
                  className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-secondary-50"
                >
                  <div>
                    <p className="text-sm font-medium text-secondary-700">
                      {(attempt as ExamAttemptWithExam).exams?.title || 'Examen'}
                    </p>
                    <p className="text-xs text-secondary-400">
                      {attempt.completed_at ? formatDate(attempt.completed_at) : ''}
                    </p>
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      attempt.percentage >= 70 ? 'text-green-600' : 'text-danger-600'
                    }`}
                  >
                    {attempt.percentage}%
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

// Extended type for attempts joined with exam data
interface ExamAttemptWithExam {
  exams?: { title: string; description: string }
}
