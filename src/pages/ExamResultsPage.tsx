import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageLayout } from '../components/layout/PageLayout'
import { Button } from '../components/common/Button'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { ResultsView } from '../components/student/ResultsView'
import { useAttempt, useAttemptAnswers } from '../hooks/useAttempts'
import { getExamById, getExamQuestions } from '../services/examService'
import { getQuestionsByExamId } from '../services/questionService'
import { getPracticeConfig } from '../services/adminService'
import type { Question } from '../types/question'

export function ExamResultsPage() {
  const { id, attemptId } = useParams<{ id: string; attemptId: string }>()
  // staleTime: 0 ensures we always read fresh settings (show_correct_answers / show_feedback)
  // instead of serving a 5-minute cached copy from when the student loaded the exam.
  const { data: exam, isLoading: examLoading } = useQuery({
    queryKey: ['exam', id],
    queryFn: () => getExamById(id!),
    enabled: !!id,
    staleTime: 0,
  })
  // Primary: legacy questions table (used by start_practice_session RPC and older exams)
  const { data: legacyQuestions = [], isLoading: legacyQuestionsLoading } = useQuery({
    queryKey: ['questions', id],
    queryFn: () => getQuestionsByExamId(id!),
    enabled: !!id,
    staleTime: 0,
  })
  // Fallback: exam_questions → question_bank (bank-based teacher exams)
  const { data: bankItems = [], isLoading: bankQuestionsLoading } = useQuery({
    queryKey: ['exam-questions', id],
    queryFn: () => getExamQuestions(id!),
    enabled: !!id,
    staleTime: 0,
  })
  // Use legacy questions when available (practice), otherwise map from bank
  const questions: Question[] = legacyQuestions.length > 0
    ? legacyQuestions
    : bankItems.map((q, i) => ({
        id: q.id,
        exam_id: id ?? '',
        type: q.type,
        question_text: q.question_text,
        options: q.options,
        correct_answer: q.correct_answer,
        terms: q.terms,
        points: q.points,
        explanation: q.explanation,
        material_reference: q.reference_material ?? null,
        order_index: i,
        allow_partial_credit: q.allow_partial_credit,
        created_at: q.created_at,
      }))
  const questionsLoading = legacyQuestionsLoading || bankQuestionsLoading
  const { data: attempt, isLoading: attemptLoading } = useAttempt(attemptId)
  const { data: answers = [], isLoading: answersLoading } = useAttemptAnswers(attemptId)
  // Practice exam is identified by exam.status === 'practice' (set by the RPC)
  // or by attempt.is_practice as a fallback.
  const isPractice = exam?.status === 'practice' || !!attempt?.is_practice

  const { data: practiceConfig, isLoading: practiceConfigLoading } = useQuery({
    queryKey: ['practiceConfig'],
    queryFn: getPracticeConfig,
    enabled: isPractice,
    staleTime: 0,
  })

  const loading = examLoading || questionsLoading || attemptLoading || answersLoading ||
    (isPractice ? practiceConfigLoading : false)


  const showCorrectAnswers = isPractice
    ? (practiceConfig?.show_correct_answers ?? true)
    : (exam?.show_correct_answers ?? true)

  const showFeedback = isPractice
    ? (practiceConfig?.show_feedback ?? true)
    : (exam?.show_feedback ?? true)

  if (loading) {
    return (
      <PageLayout>
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" className="text-primary-600" />
        </div>
      </PageLayout>
    )
  }

  // For regular exams: need both exam and attempt.
  // For practice: exam might not be readable via RLS (status='practice'), so allow null exam
  // as long as attempt.is_practice is set.
  if (!attempt || (!exam && !isPractice)) {
    return (
      <PageLayout>
        <p className="py-12 text-center text-secondary-500">Resultado no encontrado.</p>
      </PageLayout>
    )
  }

  const title = exam?.title ?? 'Práctica'
  const retryTo = isPractice ? '/practice' : `/exams/${exam!.id}`

  return (
    <PageLayout>
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-secondary-900">
            Resultados: {title}
          </h1>
          <div className="flex items-center gap-2">
            {(!isPractice || (practiceConfig?.allow_retry ?? true)) && (
              <Link to={retryTo}>
                <Button variant="secondary" size="sm">
                  {isPractice ? 'Nueva práctica' : 'Reintentar'}
                </Button>
              </Link>
            )}
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                Volver al Dashboard
              </Button>
            </Link>
          </div>
        </div>

        <ResultsView
          attempt={attempt}
          answers={answers}
          questions={questions}
          showCorrectAnswers={showCorrectAnswers}
          showFeedback={showFeedback}
        />
      </div>
    </PageLayout>
  )
}
