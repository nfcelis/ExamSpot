import { useState } from 'react'
import { PageLayout } from '../components/layout/PageLayout'
import { Card } from '../components/common/Card'
import { Button } from '../components/common/Button'
import { Input } from '../components/common/Input'
import { Select } from '../components/common/Select'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import { QuestionPreview } from '../components/question/QuestionPreview'
import {
  useQuestionBank,
  useCategories,
  useDeleteQuestionBankItem,
} from '../hooks/useQuestionBank'
import type { QuestionType } from '../types/question'

const TYPE_OPTIONS = [
  { value: '', label: 'Todos los tipos' },
  { value: 'multiple_choice', label: 'Opción múltiple' },
  { value: 'open_ended', label: 'Respuesta abierta' },
  { value: 'fill_blank', label: 'Rellenar espacios' },
  { value: 'matching', label: 'Emparejar' },
]

export function QuestionBankPage() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<QuestionType | ''>('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: categories = [] } = useCategories()
  const { data: questions = [], isLoading } = useQuestionBank({
    search: search || undefined,
    type: typeFilter || undefined,
    category: categoryFilter || undefined,
    onlyMine: true,
  })

  const deleteItem = useDeleteQuestionBankItem()

  const categoryOptions = [
    { value: '', label: 'Todas las categorías' },
    ...categories.map((c) => ({ value: c, label: c })),
  ]

  const handleDelete = () => {
    if (deleteId) {
      deleteItem.mutate(deleteId, {
        onSuccess: () => setDeleteId(null),
      })
    }
  }

  return (
    <PageLayout>
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">Banco de Preguntas</h1>
            <p className="mt-1 text-sm text-secondary-500">
              {questions.length} pregunta{questions.length !== 1 ? 's' : ''} guardada{questions.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <div className="grid gap-4 sm:grid-cols-3">
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
        </Card>

        {/* Questions List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" className="text-primary-600" />
          </div>
        ) : questions.length === 0 ? (
          <Card className="py-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-secondary-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-secondary-900">
              No hay preguntas guardadas
            </h3>
            <p className="mt-1 text-sm text-secondary-500">
              Guarda preguntas desde tus exámenes para reutilizarlas después.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {questions.map((question, index) => {
              const isFromExam = (question as any)._source === 'exam'
              return (
                <div key={`${question.id}-${index}`} className="relative">
                  <QuestionPreview
                    question={{
                      ...question,
                      id: question.id,
                      exam_id: '',
                      material_reference: null,
                      order_index: index,
                      allow_partial_credit: false,
                    }}
                    index={index}
                    showAnswer
                  />
                  <div className="absolute right-4 top-4 flex items-center gap-2">
                    {isFromExam ? (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                        De: {question.category}
                      </span>
                    ) : question.category ? (
                      <span className="rounded-full bg-secondary-100 px-2 py-0.5 text-xs text-secondary-600">
                        {question.category}
                      </span>
                    ) : null}
                    {!isFromExam && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(question.id)}
                        className="text-danger-600 hover:text-danger-700"
                      >
                        Eliminar
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar pregunta"
        message="¿Estás seguro de que deseas eliminar esta pregunta del banco? Esta acción no afecta a los exámenes que ya la utilizan."
        loading={deleteItem.isPending}
      />
    </PageLayout>
  )
}
