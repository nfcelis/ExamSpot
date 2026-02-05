import { Link } from 'react-router-dom'
import { PageLayout } from '../components/layout/PageLayout'
import { Card } from '../components/common/Card'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { useMyAttempts } from '../hooks/useAttempts'
import { formatDate } from '../lib/utils'

interface ExamAttemptWithExam {
  id: string
  exam_id: string
  score: number
  max_score: number
  percentage: number
  started_at: string
  completed_at: string | null
  time_spent: number | null
  is_completed: boolean
  exams?: { title: string; description: string }
}

export function HistoryPage() {
  const { data: attempts = [], isLoading } = useMyAttempts()
  const completedAttempts = (attempts as ExamAttemptWithExam[]).filter((a) => a.is_completed)

  const averageScore =
    completedAttempts.length > 0
      ? Math.round(completedAttempts.reduce((sum, a) => sum + a.percentage, 0) / completedAttempts.length)
      : 0

  const bestScore =
    completedAttempts.length > 0
      ? Math.max(...completedAttempts.map((a) => a.percentage))
      : 0

  const totalTime = completedAttempts.reduce((sum, a) => sum + (a.time_spent || 0), 0)

  // Group attempts by exam
  const groupedByExam = completedAttempts.reduce<Record<string, ExamAttemptWithExam[]>>((acc, attempt) => {
    const key = attempt.exam_id
    if (!acc[key]) acc[key] = []
    acc[key].push(attempt)
    return acc
  }, {})

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" className="text-primary-600" />
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Mi Historial</h1>
          <p className="mt-1 text-secondary-500">
            Revisa tus intentos anteriores y tu progreso.
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-4">
          <Card className="text-center">
            <p className="text-2xl font-bold text-primary-600">{completedAttempts.length}</p>
            <p className="text-sm text-secondary-500">Total de intentos</p>
          </Card>
          <Card className="text-center">
            <p className="text-2xl font-bold text-accent-600">{averageScore}%</p>
            <p className="text-sm text-secondary-500">Promedio</p>
          </Card>
          <Card className="text-center">
            <p className="text-2xl font-bold text-green-600">{bestScore}%</p>
            <p className="text-sm text-secondary-500">Mejor nota</p>
          </Card>
          <Card className="text-center">
            <p className="text-2xl font-bold text-secondary-600">
              {Math.floor(totalTime / 60)} min
            </p>
            <p className="text-sm text-secondary-500">Tiempo total</p>
          </Card>
        </div>

        {/* Attempts grouped by exam */}
        {completedAttempts.length === 0 ? (
          <Card className="py-12 text-center">
            <p className="text-secondary-500">Aún no has completado ningún examen.</p>
            <Link
              to="/dashboard"
              className="mt-4 inline-block text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              Explorar exámenes disponibles
            </Link>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedByExam).map(([examId, examAttempts]) => {
              const examTitle = examAttempts[0]?.exams?.title || 'Examen'
              return (
                <Card key={examId}>
                  <h3 className="mb-3 text-lg font-semibold text-secondary-900">
                    {examTitle}
                  </h3>
                  <div className="space-y-2">
                    {examAttempts.map((attempt, index) => (
                      <Link
                        key={attempt.id}
                        to={`/exams/${attempt.exam_id}/results/${attempt.id}`}
                        className="flex items-center justify-between rounded-lg border border-secondary-200 p-3 transition-colors hover:bg-secondary-50"
                      >
                        <div className="flex items-center gap-4">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary-100 text-xs font-medium text-secondary-600">
                            #{examAttempts.length - index}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-secondary-700">
                              {attempt.completed_at ? formatDate(attempt.completed_at) : 'En progreso'}
                            </p>
                            {attempt.time_spent != null && (
                              <p className="text-xs text-secondary-400">
                                {Math.floor(attempt.time_spent / 60)} min {attempt.time_spent % 60} seg
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-lg font-bold ${
                              attempt.percentage >= 70 ? 'text-green-600' : attempt.percentage >= 50 ? 'text-yellow-600' : 'text-danger-600'
                            }`}
                          >
                            {attempt.percentage}%
                          </p>
                          <p className="text-xs text-secondary-400">
                            {attempt.score}/{attempt.max_score} pts
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </PageLayout>
  )
}
