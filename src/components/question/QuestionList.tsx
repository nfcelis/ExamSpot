import { QuestionPreview } from './QuestionPreview'
import { Button } from '../common/Button'
import { LoadingSpinner } from '../common/LoadingSpinner'
import type { Question } from '../../types/question'

interface QuestionListProps {
  questions: Question[]
  loading?: boolean
  onEdit?: (question: Question) => void
  onDelete?: (id: string) => void
  onMoveUp?: (index: number) => void
  onMoveDown?: (index: number) => void
  onSaveToBank?: (question: Question) => void
}

export function QuestionList({
  questions,
  loading,
  onDelete,
  onMoveUp,
  onMoveDown,
  onSaveToBank,
}: QuestionListProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" className="text-primary-600" />
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-secondary-500">
        No hay preguntas aún. Agrega la primera pregunta.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {questions.map((question, index) => (
        <div key={question.id} className="group relative">
          <QuestionPreview question={question} index={index} showAnswer />

          <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            {onMoveUp && index > 0 && (
              <button
                onClick={() => onMoveUp(index)}
                className="rounded p-1 text-secondary-400 hover:bg-secondary-100 hover:text-secondary-600"
                title="Mover arriba"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
            )}
            {onMoveDown && index < questions.length - 1 && (
              <button
                onClick={() => onMoveDown(index)}
                className="rounded p-1 text-secondary-400 hover:bg-secondary-100 hover:text-secondary-600"
                title="Mover abajo"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
            {onSaveToBank && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSaveToBank(question)}
                className="text-primary-600 hover:text-primary-700"
              >
                Guardar
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(question.id)}
                className="text-danger-500 hover:text-danger-700"
              >
                Eliminar
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
