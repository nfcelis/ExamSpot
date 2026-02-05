import { Card } from '../common/Card'
import type { ExamAttempt, ExamAnswer } from '../../types/exam'
import type { Question } from '../../types/question'

interface ResultsViewProps {
  attempt: ExamAttempt
  answers: ExamAnswer[]
  questions: Question[]
}

function getMotivationalMessage(percentage: number): string {
  if (percentage >= 90) return '!Excelente trabajo! Dominas el tema.'
  if (percentage >= 70) return '!Muy bien! Tienes un buen dominio del tema.'
  if (percentage >= 50) return 'Buen esfuerzo. Sigue practicando para mejorar.'
  return 'No te desanimes. Revisa el material y vuelve a intentarlo.'
}

const typeLabels: Record<string, string> = {
  multiple_choice: 'Opción múltiple',
  open_ended: 'Respuesta abierta',
  fill_blank: 'Rellenar espacios',
  matching: 'Emparejar',
}

export function ResultsView({ attempt, answers, questions }: ResultsViewProps) {
  return (
    <div className="space-y-6">
      {/* Score Summary */}
      <Card className="text-center">
        <div className="mb-2 text-4xl font-bold text-primary-600">
          {attempt.percentage}%
        </div>
        <p className="text-lg text-secondary-700">
          {attempt.score} / {attempt.max_score} puntos
        </p>
        <p className="mt-2 text-sm text-secondary-500">
          {getMotivationalMessage(attempt.percentage)}
        </p>
        {attempt.time_spent && (
          <p className="mt-1 text-xs text-secondary-400">
            Tiempo: {Math.floor(attempt.time_spent / 60)} min {attempt.time_spent % 60} seg
          </p>
        )}
      </Card>

      {/* Per-question breakdown */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-secondary-900">Desglose por pregunta</h3>

        {questions.map((question, index) => {
          const examAnswer = answers.find((a) => a.question_id === question.id)

          return (
            <Card key={question.id} className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary-100 text-xs font-medium text-secondary-700">
                    {index + 1}
                  </span>
                  <span className="text-xs text-secondary-400">{typeLabels[question.type]}</span>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    examAnswer?.is_correct
                      ? 'bg-green-100 text-green-700'
                      : 'bg-danger-100 text-danger-700'
                  }`}
                >
                  {examAnswer?.score ?? 0} / {question.points} pts
                </span>
              </div>

              <p className="font-medium text-secondary-900">{question.question_text}</p>

              {/* User answer */}
              <div className="rounded-lg border border-secondary-200 bg-secondary-50 p-3 text-sm">
                <span className="font-medium text-secondary-600">Tu respuesta: </span>
                <span className="text-secondary-700">
                  {renderAnswer(question, examAnswer?.user_answer)}
                </span>
              </div>

              {/* Correct answer */}
              {examAnswer && !examAnswer.is_correct && question.type !== 'open_ended' && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm">
                  <span className="font-medium text-green-700">Respuesta correcta: </span>
                  <span className="text-green-600">
                    {renderCorrectAnswer(question)}
                  </span>
                </div>
              )}

              {/* AI Feedback */}
              {examAnswer?.feedback && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                  <span className="font-medium">Retroalimentación: </span>
                  {examAnswer.feedback}
                </div>
              )}

              {/* AI Analysis strengths/improvements */}
              {examAnswer?.ai_analysis != null && typeof examAnswer.ai_analysis === 'object' ? (
                <AIAnalysisBlock analysis={examAnswer.ai_analysis as { strengths?: string[]; improvements?: string[] }} />
              ) : null}

              {/* Explanation */}
              {question.explanation && (
                <div className="rounded-lg bg-secondary-50 p-3 text-sm text-secondary-600">
                  <span className="font-medium">Explicación: </span>
                  {question.explanation}
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function AIAnalysisBlock({ analysis }: { analysis: { strengths?: string[]; improvements?: string[] } }) {
  return (
    <div className="space-y-2 text-sm">
      {analysis.strengths && analysis.strengths.length > 0 && (
        <div className="rounded-lg bg-green-50 p-3">
          <span className="font-medium text-green-700">Aspectos correctos:</span>
          <ul className="mt-1 list-inside list-disc text-green-600">
            {analysis.strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
      {analysis.improvements && analysis.improvements.length > 0 && (
        <div className="rounded-lg bg-yellow-50 p-3">
          <span className="font-medium text-yellow-700">Aspectos a mejorar:</span>
          <ul className="mt-1 list-inside list-disc text-yellow-600">
            {analysis.improvements.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function renderAnswer(question: Question, answer: unknown): string {
  if (answer === undefined || answer === null) return 'Sin respuesta'

  switch (question.type) {
    case 'multiple_choice':
      if (typeof answer === 'number' && question.options) {
        return question.options[answer] || 'Sin respuesta'
      }
      return String(answer)
    case 'open_ended':
      return String(answer)
    case 'fill_blank':
      if (Array.isArray(answer)) return answer.join(', ')
      return String(answer)
    case 'matching':
      if (typeof answer === 'object') {
        return Object.entries(answer as Record<string, string>)
          .map(([term, def]) => `${term} → ${def}`)
          .join('; ')
      }
      return String(answer)
    default:
      return String(answer)
  }
}

function renderCorrectAnswer(question: Question): string {
  switch (question.type) {
    case 'multiple_choice':
      if (typeof question.correct_answer === 'number' && question.options) {
        return question.options[question.correct_answer] || ''
      }
      if (Array.isArray(question.correct_answer) && question.options) {
        return (question.correct_answer as number[])
          .map((i) => question.options![i])
          .join(', ')
      }
      return ''
    case 'fill_blank':
      if (Array.isArray(question.correct_answer)) {
        return (question.correct_answer as string[]).join(', ')
      }
      return ''
    case 'matching':
      if (question.terms) {
        return question.terms.map((t) => `${t.term} → ${t.definition}`).join('; ')
      }
      return ''
    default:
      return ''
  }
}
