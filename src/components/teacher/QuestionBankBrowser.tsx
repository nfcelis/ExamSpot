import { useState } from 'react'
import { Button } from '../common/Button'
import { Input } from '../common/Input'
import { Select } from '../common/Select'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { QuestionPreview } from '../question/QuestionPreview'
import { useQuestionBank, useCategories } from '../../hooks/useQuestionBank'
import type { QuestionBankItem, QuestionType } from '../../types/question'
import toast from 'react-hot-toast'

interface QuestionBankBrowserProps {
  onAddQuestions: (questions: QuestionBankItem[]) => void
  loading?: boolean
  excludeIds?: string[]
}

const TYPE_OPTIONS = [
  { value: '', label: 'Todos los tipos' },
  { value: 'multiple_choice', label: 'Opción múltiple' },
  { value: 'open_ended', label: 'Respuesta abierta' },
  { value: 'fill_blank', label: 'Rellenar espacios' },
  { value: 'matching', label: 'Emparejar' },
]

const DIFFICULTY_OPTIONS = [
  { value: '', label: 'Todas las dificultades' },
  { value: 'easy', label: 'Fácil' },
  { value: 'medium', label: 'Medio' },
  { value: 'hard', label: 'Difícil' },
]

export function QuestionBankBrowser({ onAddQuestions, loading, excludeIds = [] }: QuestionBankBrowserProps) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<QuestionType | ''>('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const { data: categories = [] } = useCategories()
  const { data: questions = [], isLoading } = useQuestionBank({
    search: search || undefined,
    type: typeFilter || undefined,
    category: categoryFilter || undefined,
    difficulty: difficultyFilter as any || undefined,
  })

  // Filter out already-added questions
  const excludeSet = new Set(excludeIds)
  const availableQuestions = questions.filter((q: QuestionBankItem) => !excludeSet.has(q.id))

  const categoryOptions = [
    { value: '', label: 'Todas las categorías' },
    ...categories.map((c: string) => ({ value: c, label: c })),
  ]

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleAdd = () => {
    const selectedQuestions = availableQuestions.filter((q: QuestionBankItem) => selectedIds.has(q.id))
    if (selectedQuestions.length === 0) {
      toast.error('Selecciona al menos una pregunta')
      return
    }
    onAddQuestions(selectedQuestions)
    setSelectedIds(new Set())
  }

  const difficultyColors: Record<string, string> = {
    easy: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    hard: 'bg-red-100 text-red-700',
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          placeholder="Buscar preguntas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          options={categoryOptions}
        />
        <Select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as QuestionType | '')}
          options={TYPE_OPTIONS}
        />
        <Select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          options={DIFFICULTY_OPTIONS}
        />
      </div>

      {/* Questions List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" className="text-primary-600" />
        </div>
      ) : availableQuestions.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-secondary-500">
            No hay preguntas disponibles con estos filtros.
          </p>
          <p className="mt-1 text-xs text-secondary-400">
            El administrador debe aprobar preguntas para que aparezcan aquí.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-sm">
            <span className="text-secondary-500">
              {availableQuestions.length} pregunta{availableQuestions.length !== 1 ? 's' : ''} disponible{availableQuestions.length !== 1 ? 's' : ''}
            </span>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds(new Set(availableQuestions.map((q: QuestionBankItem) => q.id)))}
              >
                Seleccionar todas
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
              >
                Ninguna
              </Button>
            </div>
          </div>

          <div className="max-h-96 space-y-3 overflow-y-auto">
            {availableQuestions.map((question: QuestionBankItem) => (
              <div
                key={question.id}
                onClick={() => toggleSelection(question.id)}
                className={`cursor-pointer rounded-lg border bg-white p-4 transition-colors ${
                  selectedIds.has(question.id)
                    ? 'border-primary-500 ring-2 ring-primary-500'
                    : 'border-secondary-200 hover:border-secondary-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(question.id)}
                    onChange={() => toggleSelection(question.id)}
                    className="mt-1 h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="min-w-0 flex-1">
                    <QuestionPreview
                      question={{
                        ...question,
                        exam_id: '',
                        material_reference: question.reference_material || null,
                        order_index: 0,
                        allow_partial_credit: question.allow_partial_credit ?? false,
                      }}
                      compact
                    />
                    <div className="mt-2 flex flex-wrap gap-1">
                      {question.category && (
                        <span className="rounded-full bg-secondary-100 px-2 py-0.5 text-xs text-secondary-600">
                          {question.category}
                        </span>
                      )}
                      {question.subcategory && (
                        <span className="rounded-full bg-secondary-100 px-2 py-0.5 text-xs text-secondary-500">
                          {question.subcategory}
                        </span>
                      )}
                      {question.difficulty && (
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${difficultyColors[question.difficulty] || ''}`}>
                          {question.difficulty === 'easy' ? 'Fácil' : question.difficulty === 'medium' ? 'Medio' : 'Difícil'}
                        </span>
                      )}
                      {question.tags?.map((tag) => (
                        <span key={tag} className="rounded bg-secondary-50 px-1.5 py-0.5 text-xs text-secondary-400">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={handleAdd}
            loading={loading}
            disabled={selectedIds.size === 0}
            className="w-full"
          >
            Agregar {selectedIds.size} pregunta{selectedIds.size !== 1 ? 's' : ''} al examen
          </Button>
        </>
      )}
    </div>
  )
}
