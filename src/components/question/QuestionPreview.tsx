import { Card } from '../common/Card'
import type { Question } from '../../types/question'

interface QuestionPreviewProps {
  question: Partial<Question> & { type: string; question_text: string }
  index?: number
  showAnswer?: boolean
  compact?: boolean
}

const typeLabels: Record<string, string> = {
  multiple_choice: 'Opción múltiple',
  open_ended: 'Respuesta abierta',
  fill_blank: 'Rellenar espacios',
  matching: 'Emparejar',
}

export function QuestionPreview({ question, index, showAnswer = false, compact = false }: QuestionPreviewProps) {
  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="rounded bg-secondary-100 px-2 py-0.5 text-xs font-medium text-secondary-600">
            {typeLabels[question.type]}
          </span>
          <span className="text-xs text-secondary-400">{question.points || 10} pts</span>
        </div>
        <p className="text-sm text-secondary-800">{question.question_text}</p>
        {question.type === 'multiple_choice' && question.options && (
          <div className="flex flex-wrap gap-1">
            {question.options.map((opt, i) => (
              <span key={i} className="rounded bg-secondary-50 px-2 py-0.5 text-xs text-secondary-600">
                {opt}
              </span>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {index !== undefined && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-xs font-medium text-primary-700">
              {index + 1}
            </span>
          )}
          <span className="text-xs text-secondary-400">{typeLabels[question.type]}</span>
        </div>
        <span className="text-xs font-medium text-secondary-500">{question.points || 10} pts</span>
      </div>

      <p className="font-medium text-secondary-900">{question.question_text}</p>

      {/* Multiple Choice Options */}
      {question.type === 'multiple_choice' && question.options && (
        <div className="space-y-1.5">
          {question.options.map((option, i) => {
            const isCorrect = showAnswer && (
              typeof question.correct_answer === 'number'
                ? question.correct_answer === i
                : Array.isArray(question.correct_answer) && (question.correct_answer as number[]).includes(i)
            )
            return (
              <div
                key={i}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  isCorrect
                    ? 'border-green-300 bg-green-50 text-green-800'
                    : 'border-secondary-200 text-secondary-700'
                }`}
              >
                {option}
              </div>
            )
          })}
        </div>
      )}

      {/* Open Ended Model Answer */}
      {question.type === 'open_ended' && showAnswer && (
        <div className="rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-800">
          <span className="font-medium">Respuesta modelo: </span>
          {typeof question.correct_answer === 'string'
            ? question.correct_answer
            : JSON.stringify(question.correct_answer)}
        </div>
      )}

      {/* Fill Blank Answers */}
      {question.type === 'fill_blank' && showAnswer && Array.isArray(question.correct_answer) && (
        <div className="rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-800">
          <span className="font-medium">Respuestas: </span>
          {(question.correct_answer as string[]).join(', ')}
        </div>
      )}

      {/* Matching Terms */}
      {question.type === 'matching' && question.terms && (
        <div className="space-y-1.5">
          {question.terms.map((pair, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="rounded bg-secondary-100 px-2 py-1 text-secondary-700">
                {pair.term}
              </span>
              <span className="text-secondary-400">→</span>
              <span className={showAnswer ? 'text-green-700' : 'text-secondary-500'}>
                {showAnswer ? pair.definition : '???'}
              </span>
            </div>
          ))}
        </div>
      )}

      {question.explanation && showAnswer && (
        <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
          <span className="font-medium">Explicación: </span>
          {question.explanation}
        </div>
      )}
    </Card>
  )
}
