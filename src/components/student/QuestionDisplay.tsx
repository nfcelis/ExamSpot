import { Textarea } from '../common/Textarea'
import { Input } from '../common/Input'
import { SafeHtml } from '../common/SafeHtml'
import type { Question } from '../../types/question'

interface QuestionDisplayProps {
  question: Question
  answer: unknown
  onChange: (answer: unknown) => void
}

export function QuestionDisplay({ question, answer, onChange }: QuestionDisplayProps) {
  switch (question.type) {
    case 'multiple_choice':
    case 'true_false':
      return (
        <MultipleChoiceDisplay
          question={question}
          answer={answer as number | undefined}
          onChange={onChange}
        />
      )

    case 'multi_select':
      return (
        <MultiSelectDisplay
          question={question}
          answer={(answer as number[]) || []}
          onChange={onChange}
        />
      )

    case 'open_ended':
    case 'written_response':
      return (
        <OpenEndedDisplay
          answer={(answer as string) || ''}
          onChange={onChange}
        />
      )

    case 'fill_blank':
      return (
        <FillBlankDisplay
          question={question}
          answer={(answer as string[]) || []}
          onChange={onChange}
        />
      )

    case 'matching':
      return (
        <MatchingDisplay
          question={question}
          answer={(answer as Record<string, string>) || {}}
          onChange={onChange}
        />
      )

    case 'ordering':
      return (
        <OrderingDisplay
          question={question}
          answer={(answer as string[]) || []}
          onChange={onChange}
        />
      )

    default:
      return <p className="text-secondary-500">Tipo de pregunta no soportado.</p>
  }
}

function MultipleChoiceDisplay({
  question,
  answer,
  onChange,
}: {
  question: Question
  answer: number | undefined
  onChange: (v: unknown) => void
}) {
  return (
    <div className="space-y-2">
      {question.options?.map((option, i) => (
        <label
          key={i}
          className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${
            answer === i
              ? 'border-primary-500 bg-primary-50'
              : 'border-secondary-200 hover:border-secondary-300'
          }`}
        >
          <input
            type="radio"
            name={`question-${question.id}`}
            checked={answer === i}
            onChange={() => onChange(i)}
            className="h-4 w-4 shrink-0 border-secondary-300 text-primary-600 focus:ring-primary-500"
          />
          <SafeHtml html={option} className="text-sm text-secondary-700" inline />
        </label>
      ))}
    </div>
  )
}

function MultiSelectDisplay({
  question,
  answer,
  onChange,
}: {
  question: Question
  answer: number[]
  onChange: (v: unknown) => void
}) {
  const toggleOption = (index: number) => {
    if (answer.includes(index)) {
      onChange(answer.filter((i) => i !== index))
    } else {
      onChange([...answer, index])
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs italic text-secondary-400">Selecciona todas las que apliquen</p>
      {question.options?.map((option, i) => (
        <label
          key={i}
          className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${
            answer.includes(i)
              ? 'border-primary-500 bg-primary-50'
              : 'border-secondary-200 hover:border-secondary-300'
          }`}
        >
          <input
            type="checkbox"
            checked={answer.includes(i)}
            onChange={() => toggleOption(i)}
            className="h-4 w-4 shrink-0 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
          />
          <SafeHtml html={option} className="text-sm text-secondary-700" inline />
        </label>
      ))}
    </div>
  )
}

function OpenEndedDisplay({
  answer,
  onChange,
}: {
  answer: string
  onChange: (v: unknown) => void
}) {
  return (
    <Textarea
      placeholder="Escribe tu respuesta aquí..."
      value={answer}
      onChange={(e) => onChange(e.target.value)}
      rows={6}
    />
  )
}

function FillBlankDisplay({
  question,
  answer,
  onChange,
}: {
  question: Question
  answer: string[]
  onChange: (v: unknown) => void
}) {
  const parts = question.question_text.split('___')
  const blankCount = parts.length - 1

  const handleBlankChange = (index: number, value: string) => {
    const newAnswers = [...answer]
    newAnswers[index] = value
    onChange(newAnswers)
  }

  return (
    <div className="space-y-4">
      <div className="leading-relaxed text-secondary-700">
        {parts.map((part, i) => (
          <span key={i}>
            <SafeHtml html={part} inline />
            {i < blankCount && (
              <Input
                className="mx-1 inline-block w-40"
                placeholder={`Espacio ${i + 1}`}
                value={answer[i] || ''}
                onChange={(e) => handleBlankChange(i, e.target.value)}
              />
            )}
          </span>
        ))}
      </div>
    </div>
  )
}

function MatchingDisplay({
  question,
  answer,
  onChange,
}: {
  question: Question
  answer: Record<string, string>
  onChange: (v: unknown) => void
}) {
  const definitions = question.terms?.map((t) => t.definition) || []

  const handleMatch = (term: string, definition: string) => {
    onChange({ ...answer, [term]: definition })
  }

  return (
    <div className="space-y-3">
      {question.terms?.map((pair) => (
        <div key={pair.term} className="flex items-center gap-3">
          <div className="w-1/3 rounded-lg bg-secondary-100 px-3 py-2 text-sm font-medium text-secondary-700">
            <SafeHtml html={pair.term} inline />
          </div>
          <span className="text-secondary-400">→</span>
          <select
            className="flex-1 rounded-lg border border-secondary-300 px-3 py-2 text-sm text-secondary-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            value={answer[pair.term] || ''}
            onChange={(e) => handleMatch(pair.term, e.target.value)}
          >
            <option value="">Seleccionar...</option>
            {definitions.map((def) => (
              <option key={def} value={def}>
                {def.replace(/<[^>]+>/g, '')}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  )
}

function OrderingDisplay({
  question,
  answer,
  onChange,
}: {
  question: Question
  answer: string[]
  onChange: (v: unknown) => void
}) {
  // Initialize with shuffled options if no answer yet
  const items = answer.length > 0 ? answer : (question.options || [])

  const moveItem = (index: number, direction: -1 | 1) => {
    const newItems = [...items]
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= newItems.length) return
    ;[newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]]
    onChange(newItems)
  }

  return (
    <div className="space-y-2">
      <p className="text-xs italic text-secondary-400">Ordena los elementos en el orden correcto</p>
      {items.map((item, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg border border-secondary-200 bg-white px-4 py-3"
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
            {i + 1}
          </span>
          <div className="flex-1 text-sm text-secondary-700">
            <SafeHtml html={item} inline />
          </div>
          <div className="flex flex-col gap-0.5">
            <button
              type="button"
              onClick={() => moveItem(i, -1)}
              disabled={i === 0}
              className="rounded p-1 text-secondary-400 hover:bg-secondary-100 hover:text-secondary-700 disabled:opacity-30"
            >
              ▲
            </button>
            <button
              type="button"
              onClick={() => moveItem(i, 1)}
              disabled={i === items.length - 1}
              className="rounded p-1 text-secondary-400 hover:bg-secondary-100 hover:text-secondary-700 disabled:opacity-30"
            >
              ▼
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
