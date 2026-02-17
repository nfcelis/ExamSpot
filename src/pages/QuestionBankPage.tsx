import { useState } from 'react'
import { PageLayout } from '../components/layout/PageLayout'
import { Card } from '../components/common/Card'
import { Input } from '../components/common/Input'
import { Select } from '../components/common/Select'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { QuestionPreview } from '../components/question/QuestionPreview'
import { useQuestionBank, useCategories } from '../hooks/useQuestionBank'
import type { QuestionType, QuestionBankItem } from '../types/question'

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

export function QuestionBankPage() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<QuestionType | ''>('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState('')

  const { data: categories = [] } = useCategories()
  const { data: questions = [], isLoading } = useQuestionBank({
    search: search || undefined,
    type: typeFilter || undefined,
    category: categoryFilter || undefined,
    difficulty: difficultyFilter as any || undefined,
  })

  const categoryOptions = [
    { value: '', label: 'Todas las categorías' },
    ...categories.map((c: string) => ({ value: c, label: c })),
  ]

  const difficultyColors: Record<string, string> = {
    easy: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    hard: 'bg-red-100 text-red-700',
  }

  return (
    <PageLayout>
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-secondary-900">Banco de Preguntas</h1>
          <p className="mt-1 text-sm text-secondary-500">
            Navega las preguntas aprobadas para usarlas en tus exámenes.
            {questions.length > 0 && ` ${questions.length} pregunta${questions.length !== 1 ? 's' : ''} disponible${questions.length !== 1 ? 's' : ''}.`}
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              No hay preguntas disponibles
            </h3>
            <p className="mt-1 text-sm text-secondary-500">
              El administrador debe aprobar preguntas para que aparezcan aquí.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {questions.map((question: QuestionBankItem, index: number) => (
              <div key={question.id}>
                <QuestionPreview
                  question={{
                    ...question,
                    exam_id: '',
                    material_reference: question.reference_material || null,
                    order_index: index,
                    allow_partial_credit: question.allow_partial_credit ?? false,
                  }}
                  index={index}
                  showAnswer
                />
                <div className="-mt-1 flex items-center gap-2 rounded-b-lg border border-t-0 border-secondary-200 bg-secondary-50 px-4 py-2">
                  {question.category && (
                    <span className="rounded-full bg-secondary-100 px-2.5 py-0.5 text-xs text-secondary-600">
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
                  {question.tags && question.tags.length > 0 && (
                    <div className="flex gap-1">
                      {question.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="rounded bg-secondary-50 px-1.5 py-0.5 text-xs text-secondary-400">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <span className="text-xs text-secondary-400">
                    {question.points} pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  )
}
