import { Card } from '../common/Card'
import { SafeHtml } from '../common/SafeHtml'
import type { Question } from '../../types/question'
import { QUESTION_TYPE_LABELS } from '../../lib/questionTypeConstants'

interface QuestionPreviewProps {
  question: Partial<Question> & { type: string; question_text: string }
  index?: number
  showAnswer?: boolean
  compact?: boolean
}

const typeLabels = QUESTION_TYPE_LABELS

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
        <SafeHtml html={question.question_text} className="text-sm text-secondary-800" />
        {(question.type === 'multiple_choice' || question.type === 'true_false' || question.type === 'multi_select') && question.options && (
          <div className="flex flex-wrap gap-1">
            {question.options.map((opt, i) => (
              <span key={i} className="rounded bg-secondary-50 px-2 py-0.5 text-xs text-secondary-600">
                <SafeHtml html={opt} inline />
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

      <SafeHtml html={question.question_text} className="font-medium text-secondary-900" />

      {/* Multiple Choice / True-False / Multi-Select Options */}
      {(question.type === 'multiple_choice' || question.type === 'true_false' || question.type === 'multi_select') && question.options && (
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
                {question.type === 'multi_select' && showAnswer && (
                  <span className="mr-2 font-bold">{isCorrect ? '☑' : '☐'}</span>
                )}
                <SafeHtml html={option} inline />
              </div>
            )
          })}
        </div>
      )}

      {/* Open Ended / Written Response Model Answer */}
      {(question.type === 'open_ended' || question.type === 'written_response') && showAnswer && (
        <div className="rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-800">
          <span className="font-medium">Respuesta modelo: </span>
          <SafeHtml html={question.correct_answer as string} inline />
        </div>
      )}

      {/* Fill Blank Answers */}
      {question.type === 'fill_blank' && showAnswer && Array.isArray(question.correct_answer) && (
        <div className="rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-800">
          <span className="font-medium">Respuestas: </span>
          {(question.correct_answer as string[]).map((a, i) => (
            <span key={i}>{i > 0 && <span className="mx-1">·</span>}<SafeHtml html={a} inline /></span>
          ))}
        </div>
      )}

      {/* Matching Terms */}
      {question.type === 'matching' && question.terms && (
        <div className="space-y-1.5">
          {question.terms.map((pair, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="rounded bg-secondary-100 px-2 py-1 text-secondary-700">
                <SafeHtml html={pair.term} inline />
              </span>
              <span className="text-secondary-400">→</span>
              <span className={showAnswer ? 'text-green-700' : 'text-secondary-500'}>
                {showAnswer ? <SafeHtml html={pair.definition} inline /> : '???'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Ordering */}
      {question.type === 'ordering' && question.options && (
        <div className="space-y-1.5">
          {(showAnswer ? question.correct_answer as string[] : question.options).map((item, i) => (
            <div key={i} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${showAnswer ? 'border-green-300 bg-green-50 text-green-800' : 'border-secondary-200 text-secondary-700'}`}>
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">{i + 1}</span>
              <SafeHtml html={item} inline />
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
