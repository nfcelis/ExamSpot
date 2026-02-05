import { useParams, Link } from 'react-router-dom'
import { PageLayout } from '../components/layout/PageLayout'
import { Button } from '../components/common/Button'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { ResultsView } from '../components/student/ResultsView'
import { useExam } from '../hooks/useExams'
import { useQuestions } from '../hooks/useQuestions'
import { useAttempt, useAttemptAnswers } from '../hooks/useAttempts'

export function ExamResultsPage() {
  const { id, attemptId } = useParams<{ id: string; attemptId: string }>()
  const { data: exam, isLoading: examLoading } = useExam(id)
  const { data: questions = [], isLoading: questionsLoading } = useQuestions(id)
  const { data: attempt, isLoading: attemptLoading } = useAttempt(attemptId)
  const { data: answers = [], isLoading: answersLoading } = useAttemptAnswers(attemptId)

  const loading = examLoading || questionsLoading || attemptLoading || answersLoading

  if (loading) {
    return (
      <PageLayout>
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" className="text-primary-600" />
        </div>
      </PageLayout>
    )
  }

  if (!exam || !attempt) {
    return (
      <PageLayout>
        <p className="py-12 text-center text-secondary-500">Resultado no encontrado.</p>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-secondary-900">
            Resultados: {exam.title}
          </h1>
          <div className="flex items-center gap-2">
            <Link to={`/exams/${exam.id}`}>
              <Button variant="secondary" size="sm">
                Reintentar
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                Volver al Dashboard
              </Button>
            </Link>
          </div>
        </div>

        <ResultsView attempt={attempt} answers={answers} questions={questions} />
      </div>
    </PageLayout>
  )
}
