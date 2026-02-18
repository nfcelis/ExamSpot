import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { PageLayout } from '../components/layout/PageLayout'
import { Card } from '../components/common/Card'
import { Button } from '../components/common/Button'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { ExamTaker } from '../components/student/ExamTaker'
import { useExam } from '../hooks/useExams'
import { useQuestions } from '../hooks/useQuestions'
import { useCreateAttempt, useMyAttempts } from '../hooks/useAttempts'
import { useAuthStore } from '../store/authStore'
import { getExamQuestions } from '../services/examService'
import type { Question } from '../types/question'

export function ExamTakePage() {
  const { id } = useParams<{ id: string }>()
  const user = useAuthStore((s) => s.user)
  const { data: exam, isLoading: examLoading } = useExam(id)
  const { data: legacyQuestions = [], isLoading: questionsLoading } = useQuestions(id)
  const { data: myAttempts = [] } = useMyAttempts()
  const createAttempt = useCreateAttempt()

  // Try exam_questions (new system) if legacy questions table is empty
  const [bankQuestions, setBankQuestions] = useState<Question[]>([])
  const [bankLoading, setBankLoading] = useState(false)

  useEffect(() => {
    if (!id || questionsLoading || legacyQuestions.length > 0) return
    setBankLoading(true)
    getExamQuestions(id)
      .then((items) => {
        // Map QuestionBankItem to Question shape
        const mapped: Question[] = items.map((q, i) => ({
          id: q.id,
          exam_id: id,
          type: q.type,
          question_text: q.question_text,
          options: q.options,
          correct_answer: q.correct_answer,
          terms: q.terms,
          points: q.points,
          explanation: q.explanation,
          material_reference: q.reference_material || null,
          order_index: i,
          allow_partial_credit: q.allow_partial_credit,
          created_at: q.created_at,
        }))
        setBankQuestions(mapped)
      })
      .catch((err) => console.error('Error loading exam_questions:', err))
      .finally(() => setBankLoading(false))
  }, [id, questionsLoading, legacyQuestions.length])

  const questions = legacyQuestions.length > 0 ? legacyQuestions : bankQuestions
  const loading = examLoading || questionsLoading || bankLoading

  // Find active (incomplete) attempt for this exam
  const activeAttempt = myAttempts.find(
    (a) => a.exam_id === id && !a.is_completed
  )

  // Find most recent completed attempt
  const completedAttempt = myAttempts.find(
    (a) => a.exam_id === id && a.is_completed
  )

  if (loading) {
    return (
      <PageLayout>
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" className="text-primary-600" />
        </div>
      </PageLayout>
    )
  }

  if (!exam) {
    return (
      <PageLayout>
        <p className="py-12 text-center text-secondary-500">Examen no encontrado.</p>
      </PageLayout>
    )
  }

  // If there's an active attempt, show the exam taker
  if (activeAttempt) {
    return (
      <PageLayout>
        <ExamTaker exam={exam} attempt={activeAttempt} questions={questions} />
      </PageLayout>
    )
  }

  // If the most recent attempt is completed and user hasn't started a new one, redirect to results
  if (completedAttempt && !activeAttempt) {
    // Show exam info with option to retake or view results
  }

  const handleStart = () => {
    if (!user) return
    createAttempt.mutate({ examId: exam.id, userId: user.id, isPractice: exam.status === 'practice' })
  }

  return (
    <PageLayout>
      <div className="mx-auto max-w-2xl">
        <Card className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">{exam.title}</h1>
            {exam.description && (
              <p className="mt-2 text-secondary-500">{exam.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 rounded-lg bg-secondary-50 p-4 text-sm">
            <div>
              <span className="font-medium text-secondary-700">Preguntas:</span>{' '}
              <span className="text-secondary-600">{questions.length}</span>
            </div>
            {exam.time_limit && (
              <div>
                <span className="font-medium text-secondary-700">Tiempo límite:</span>{' '}
                <span className="text-secondary-600">{exam.time_limit} minutos</span>
              </div>
            )}
            <div>
              <span className="font-medium text-secondary-700">Puntos totales:</span>{' '}
              <span className="text-secondary-600">
                {questions.reduce((sum, q) => sum + q.points, 0)}
              </span>
            </div>
            {completedAttempt && (
              <div>
                <span className="font-medium text-secondary-700">Último intento:</span>{' '}
                <span className="text-secondary-600">{completedAttempt.percentage}%</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleStart} loading={createAttempt.isPending}>
              {completedAttempt ? 'Reintentar examen' : 'Comenzar examen'}
            </Button>
            {completedAttempt && (
              <Button
                variant="secondary"
                onClick={() => {
                  window.location.href = `/exams/${exam.id}/results/${completedAttempt.id}`
                }}
              >
                Ver último resultado
              </Button>
            )}
          </div>
        </Card>
      </div>
    </PageLayout>
  )
}
