import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageLayout } from '../components/layout/PageLayout'
import { Card } from '../components/common/Card'
import { Button } from '../components/common/Button'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { usePracticeCategories, useCreatePracticeExam } from '../hooks/usePractice'

export function PracticePage() {
  const navigate = useNavigate()
  const { data: categories = [], isLoading } = usePracticeCategories()
  const createExam = useCreatePracticeExam()

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [numQuestions, setNumQuestions] = useState(10)

  const selected = categories.find((c) => c.category === selectedCategory)
  const maxQuestions = selected?.question_count ?? 10

  const handleGenerate = () => {
    if (!selectedCategory) return
    createExam.mutate(
      { category: selectedCategory, numQuestions },
      {
        onSuccess: (examId) => {
          navigate(`/exams/${examId}`)
        },
      }
    )
  }

  return (
    <PageLayout>
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-secondary-900">Modo Práctica</h1>
          <p className="mt-1 text-secondary-500">
            Selecciona una sección y genera un examen aleatorio para practicar.
          </p>
        </div>

        {/* Selected category config panel */}
        {selectedCategory && selected && (
          <Card className="mb-6 border-2 border-primary-200 bg-primary-50/30">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-secondary-900">{selectedCategory}</h3>
                  <p className="text-sm text-secondary-500">
                    {selected.question_count} preguntas disponibles
                  </p>
                </div>
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="text-secondary-400 hover:text-secondary-600"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-secondary-700">
                  Número de preguntas
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={1}
                    max={maxQuestions}
                    value={Math.min(numQuestions, maxQuestions)}
                    onChange={(e) => setNumQuestions(Number(e.target.value))}
                    className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-secondary-200 accent-primary-600"
                  />
                  <input
                    type="number"
                    min={1}
                    max={maxQuestions}
                    value={Math.min(numQuestions, maxQuestions)}
                    onChange={(e) => {
                      const val = Number(e.target.value)
                      if (val >= 1 && val <= maxQuestions) setNumQuestions(val)
                    }}
                    className="w-20 rounded-lg border border-secondary-300 px-3 py-2 text-center text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                loading={createExam.isPending}
                className="w-full"
              >
                Comenzar Práctica ({Math.min(numQuestions, maxQuestions)} preguntas)
              </Button>
            </div>
          </Card>
        )}

        {/* Category grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" className="text-primary-600" />
          </div>
        ) : categories.length === 0 ? (
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
                d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-secondary-900">
              No hay secciones disponibles
            </h3>
            <p className="mt-1 text-sm text-secondary-500">
              Contacta a tu profesor para que agregue preguntas al banco.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => (
              <Card
                key={cat.category}
                className={`cursor-pointer transition-all hover:border-primary-300 hover:shadow-md ${
                  selectedCategory === cat.category
                    ? 'border-primary-500 ring-2 ring-primary-500'
                    : ''
                }`}
              >
                <button
                  className="w-full text-left"
                  onClick={() => {
                    setSelectedCategory(cat.category)
                    setNumQuestions(Math.min(10, cat.question_count))
                  }}
                >
                  <h3 className="font-semibold text-secondary-900">{cat.category}</h3>
                  <p className="mt-2 text-sm text-secondary-500">
                    {cat.question_count} pregunta{cat.question_count !== 1 ? 's' : ''}
                  </p>
                  <div className="mt-3 flex items-center text-xs font-medium text-primary-600">
                    Practicar
                    <svg className="ml-1 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  )
}
