import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageLayout } from '../components/layout/PageLayout'
import { Card } from '../components/common/Card'
import { Button } from '../components/common/Button'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { getCategoryList } from '../services/questionBankService'
import { supabase } from '../lib/supabase'
import type { PracticeConfig } from '../types/exam'
import toast from 'react-hot-toast'

export function PracticePage() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [config, setConfig] = useState<PracticeConfig | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const [cats, configResult] = await Promise.all([
          getCategoryList(),
          supabase.from('practice_config').select('*').single(),
        ])
        setCategories(cats)
        if (configResult.data) {
          setConfig(configResult.data as PracticeConfig)
        }
      } catch (err) {
        console.error('Error loading practice data:', err)
        toast.error('Error al cargar configuración de práctica')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  const numQuestions = config?.questions_per_practice ?? 10
  const timeLimit = config?.time_limit_minutes ?? null

  const handleStartPractice = async () => {
    setGenerating(true)

    try {
      const categoriesParam = selectedCategories.size > 0
        ? Array.from(selectedCategories)
        : null

      const { data, error } = await supabase.rpc('start_practice_session', {
        p_num_questions: numQuestions,
        p_categories: categoriesParam,
        p_time_limit: timeLimit,
      })

      if (error) throw error

      const result = data as { exam_id: string; question_count: number }
      toast.success(`Práctica iniciada con ${result.question_count} preguntas`)
      navigate(`/exams/${result.exam_id}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      toast.error(`Error al iniciar práctica: ${message}`)
      console.error(err)
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <PageLayout>
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" className="text-primary-600" />
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-secondary-900">Modo Práctica</h1>
          <p className="mt-1 text-secondary-500">
            Practica con preguntas aleatorias del banco aprobado.
          </p>
        </div>

        {/* Practice info */}
        <Card className="mb-6">
          <h3 className="mb-3 font-semibold text-secondary-900">Detalles de la práctica</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-secondary-50 px-4 py-3">
              <p className="text-sm text-secondary-500">Preguntas</p>
              <p className="text-xl font-bold text-secondary-900">{numQuestions}</p>
            </div>
            <div className="rounded-lg bg-secondary-50 px-4 py-3">
              <p className="text-sm text-secondary-500">Tiempo límite</p>
              <p className="text-xl font-bold text-secondary-900">
                {timeLimit ? `${timeLimit} minutos` : 'Sin límite'}
              </p>
            </div>
          </div>
        </Card>

        {/* Category Selection */}
        <Card className="mb-6">
          <h3 className="mb-3 font-semibold text-secondary-900">
            Seleccionar categorías (opcional)
          </h3>
          <p className="mb-4 text-sm text-secondary-500">
            Si no seleccionas ninguna, se incluirán preguntas de todas las categorías.
          </p>

          {categories.length === 0 ? (
            <p className="text-sm text-secondary-400">No hay categorías disponibles.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    selectedCategories.has(cat)
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-secondary-300 bg-white text-secondary-600 hover:bg-secondary-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {selectedCategories.size > 0 && (
            <button
              onClick={() => setSelectedCategories(new Set())}
              className="mt-3 text-sm text-secondary-500 hover:text-secondary-700"
            >
              Deseleccionar todas
            </button>
          )}
        </Card>

        {/* Start Button */}
        <Button
          onClick={handleStartPractice}
          loading={generating}
          size="lg"
          className="w-full"
        >
          {generating
            ? 'Preparando práctica...'
            : `Comenzar Práctica (${numQuestions} preguntas)`
          }
        </Button>
      </div>
    </PageLayout>
  )
}
