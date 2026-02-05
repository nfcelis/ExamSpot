import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../common/Button'
import { Card } from '../common/Card'
import { Modal } from '../common/Modal'
import { QuestionDisplay } from './QuestionDisplay'
import { ExamTimer } from './ExamTimer'
import { useSaveAnswer, useSubmitExam } from '../../hooks/useAttempts'
import type { Exam, ExamAttempt } from '../../types/exam'
import type { Question } from '../../types/question'

interface ExamTakerProps {
  exam: Exam
  attempt: ExamAttempt
  questions: Question[]
}

export function ExamTaker({ exam, attempt, questions }: ExamTakerProps) {
  const navigate = useNavigate()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set())
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const dirtyAnswers = useRef<Set<string>>(new Set())

  const saveAnswer = useSaveAnswer()
  const submitExam = useSubmitExam()

  const currentQuestion = questions[currentIndex]
  const answeredCount = Object.keys(answers).length
  const totalQuestions = questions.length

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      dirtyAnswers.current.forEach((questionId) => {
        saveAnswer.mutate({
          attemptId: attempt.id,
          questionId,
          answer: answers[questionId],
        })
      })
      dirtyAnswers.current.clear()
    }, 30000)

    return () => clearInterval(interval)
  }, [answers, attempt.id, saveAnswer])

  const handleAnswerChange = useCallback(
    (answer: unknown) => {
      const questionId = currentQuestion.id
      setAnswers((prev) => ({ ...prev, [questionId]: answer }))
      dirtyAnswers.current.add(questionId)
    },
    [currentQuestion?.id]
  )

  const handlePrev = () => setCurrentIndex((i) => Math.max(0, i - 1))
  const handleNext = () => setCurrentIndex((i) => Math.min(totalQuestions - 1, i + 1))

  const toggleReview = () => {
    setMarkedForReview((prev) => {
      const next = new Set(prev)
      if (next.has(currentQuestion.id)) {
        next.delete(currentQuestion.id)
      } else {
        next.add(currentQuestion.id)
      }
      return next
    })
  }

  const handleSubmit = async () => {
    // Save all pending answers first
    const savePromises = Object.entries(answers).map(([questionId, answer]) =>
      saveAnswer.mutateAsync({
        attemptId: attempt.id,
        questionId,
        answer,
      })
    )

    await Promise.all(savePromises)

    submitExam.mutate(
      { attemptId: attempt.id, questions },
      {
        onSuccess: () => {
          navigate(`/exams/${exam.id}/results/${attempt.id}`)
        },
      }
    )
  }

  const handleTimeUp = () => {
    handleSubmit()
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {/* Header */}
      <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold text-secondary-900">{exam.title}</h2>
          <p className="text-sm text-secondary-500">
            Pregunta {currentIndex + 1} de {totalQuestions} · {answeredCount} respondidas
          </p>
        </div>
        <div className="flex items-center gap-3">
          {exam.time_limit && (
            <ExamTimer
              startTime={attempt.started_at}
              timeLimitMinutes={exam.time_limit}
              onTimeUp={handleTimeUp}
            />
          )}
        </div>
      </Card>

      {/* Progress dots */}
      <div className="flex flex-wrap gap-1.5">
        {questions.map((q, i) => (
          <button
            key={q.id}
            onClick={() => setCurrentIndex(i)}
            className={`h-8 w-8 rounded-full text-xs font-medium transition-colors ${
              i === currentIndex
                ? 'bg-primary-600 text-white'
                : answers[q.id] !== undefined
                  ? 'bg-green-100 text-green-700'
                  : markedForReview.has(q.id)
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-secondary-100 text-secondary-500'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Question */}
      {currentQuestion && (
        <Card>
          <div className="mb-4 flex items-start justify-between">
            <p className="font-medium text-secondary-900">{currentQuestion.question_text}</p>
            <span className="ml-2 shrink-0 text-xs text-secondary-400">
              {currentQuestion.points} pts
            </span>
          </div>

          <QuestionDisplay
            question={currentQuestion}
            answer={answers[currentQuestion.id]}
            onChange={handleAnswerChange}
          />
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={handlePrev} disabled={currentIndex === 0}>
          Anterior
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={toggleReview}
          className={markedForReview.has(currentQuestion?.id) ? 'text-yellow-600' : ''}
        >
          {markedForReview.has(currentQuestion?.id) ? 'Marcada para revisar' : 'Marcar para revisar'}
        </Button>

        {currentIndex < totalQuestions - 1 ? (
          <Button onClick={handleNext}>Siguiente</Button>
        ) : (
          <Button onClick={() => setShowSubmitModal(true)}>Enviar examen</Button>
        )}
      </div>

      {/* Submit Confirmation */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Enviar examen"
      >
        <div className="space-y-4">
          <p className="text-sm text-secondary-600">
            Has respondido {answeredCount} de {totalQuestions} preguntas.
          </p>
          {answeredCount < totalQuestions && (
            <p className="text-sm font-medium text-yellow-600">
              Tienes {totalQuestions - answeredCount} preguntas sin responder.
            </p>
          )}
          {markedForReview.size > 0 && (
            <p className="text-sm text-yellow-600">
              Tienes {markedForReview.size} preguntas marcadas para revisar.
            </p>
          )}
          <p className="text-sm text-secondary-600">
            Una vez enviado, no podrás cambiar tus respuestas.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowSubmitModal(false)}>
              Volver al examen
            </Button>
            <Button onClick={handleSubmit} loading={submitExam.isPending}>
              Confirmar envío
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
