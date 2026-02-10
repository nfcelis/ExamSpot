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
}

const TYPE_OPTIONS = [
  { value: '', label: 'Todos los tipos' },
  { value: 'multiple_choice', label: 'Opción múltiple' },
  { value: 'open_ended', label: 'Respuesta abierta' },
  { value: 'fill_blank', label: 'Rellenar espacios' },
  { value: 'matching', label: 'Emparejar' },
]

export function QuestionBankBrowser({ onAddQuestions, loading }: QuestionBankBrowserProps) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<QuestionType | ''>('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const { data: categories = [] } = useCategories()
  const { data: questions = [], isLoading } = useQuestionBank({
    search: search || undefined,
    type: typeFilter || undefined,
    category: categoryFilter || undefined,
    onlyMine: true,
  })

  const categoryOptions = [
    { value: '', label: 'Todas las secciones' },
    ...categories.map((c) => ({ value: c, label: c })),
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
    const selectedQuestions = questions.filter((q) => selectedIds.has(q.id))
    if (selectedQuestions.length === 0) {
      toast.error('Selecciona al menos una pregunta')
      return
    }
    onAddQuestions(selectedQuestions)
    setSelectedIds(new Set())
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Input
          placeholder="Buscar preguntas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as QuestionType | '')}
          options={TYPE_OPTIONS}
        />
        <Select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          options={categoryOptions}
        />
      </div>

      {/* Questions List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" className="text-primary-600" />
        </div>
      ) : questions.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-secondary-500">
            No hay preguntas en tu banco.
          </p>
          <p className="mt-1 text-xs text-secondary-400">
            Guarda preguntas desde tus exámenes para reutilizarlas.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-sm">
            <span className="text-secondary-500">
              {questions.length} pregunta{questions.length !== 1 ? 's' : ''} disponible{questions.length !== 1 ? 's' : ''}
            </span>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds(new Set(questions.map((q) => q.id)))}
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

          <div className="max-h-80 space-y-3 overflow-y-auto">
            {questions.map((question) => (
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
                        material_reference: null,
                        order_index: 0,
                        allow_partial_credit: false,
                      }}
                      compact
                    />
                    {question.category && (
                      <span className="mt-2 inline-block rounded-full bg-secondary-100 px-2 py-0.5 text-xs text-secondary-600">
                        {question.category}
                      </span>
                    )}
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
