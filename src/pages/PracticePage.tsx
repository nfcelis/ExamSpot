import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageLayout } from '../components/layout/PageLayout'
import { Card } from '../components/common/Card'
import { Button } from '../components/common/Button'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { getPracticeConfig } from '../services/adminService'
import { getCategoryList } from '../services/questionBankService'
import { supabase } from '../lib/supabase'
import type { PracticeConfig } from '../types/exam'
import toast from 'react-hot-toast'

export function PracticePage() {
  const navigate = useNavigate()
  const [config, setConfig] = useState<PracticeConfig | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [configData, cats] = await Promise.all([
          getPracticeConfig(),
          getCategoryList(),
        ])
        setConfig(configData)
        setCategories(cats)
      } catch (err) {
        console.error('Error loading practice config:', err)
        toast.error('Error al cargar configuración de práctica')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => {
      const next = new Set(prev)
      if (next.has(cat)) {
        next.delete(cat)
      } else {
        next.add(cat)
      }
      return next
    })
  }

  const handleStartPractice = async () => {
    if (!config) return
    setGenerating(true)

    try {
      const categoriesParam = selectedCategories.size > 0
        ? Array.from(selectedCategories)
        : null

      // Get random questions using the RPC function
      const { data: questions, error } = await supabase
        .rpc('get_random_questions_for_practice', {
          num_questions: config.questions_per_practice,
          categories: categoriesParam,
        })

      if (error) throw error
      if (!questions || questions.length === 0) {
        toast.error('No hay suficientes preguntas disponibles')
        return
      }

      // Create a practice exam
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      const { data: exam, error: examError } = await supabase
        .from('exams')
        .insert({
          title: `Práctica - ${new Date().toLocaleDateString('es')}`,
          description: `Práctica: ${questions.length} preguntas aleatorias`,
          created_by: user.id,
          status: 'published',
          is_public: false,
          randomize_order: true,
          time_limit: config.time_limit_minutes,
          question_count: questions.length,
        })
        .select()
        .single()

      if (examError) throw examError

      // Add questions to exam via exam_questions
      const examQuestions = questions.map((q: { id: string }, index: number) => ({
        exam_id: exam.id,
        question_bank_id: q.id,
        order_index: index,
      }))

      const { error: eqError } = await supabase
        .from('exam_questions')
        .insert(examQuestions)

      if (eqError) throw eqError

      // Create attempt
      const { error: attemptError } = await supabase
        .from('exam_attempts')
        .insert({
          exam_id: exam.id,
          user_id: user.id,
          is_practice: true,
          max_score: questions.reduce((sum: number, q: { points: number }) => sum + q.points, 0),
        })
        .select()
        .single()

      if (attemptError) throw attemptError

      navigate(`/exams/${exam.id}`)
    } catch (err) {
      toast.error('Error al iniciar práctica')
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

        {/* Practice Config Info */}
        {config && (
          <Card className="mb-6 border-2 border-primary-200 bg-primary-50/30">
            <div className="grid gap-4 sm:grid-cols-3 text-center">
              <div>
                <p className="text-2xl font-bold text-primary-600">{config.questions_per_practice}</p>
                <p className="text-sm text-secondary-500">preguntas</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary-600">
                  {config.time_limit_minutes ? `${config.time_limit_minutes} min` : 'Sin límite'}
                </p>
                <p className="text-sm text-secondary-500">tiempo</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Distribución</p>
                <div className="mt-1 flex justify-center gap-2">
                  <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    {config.difficulty_distribution.easy}% Fácil
                  </span>
                  <span className="rounded bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                    {config.difficulty_distribution.medium}% Medio
                  </span>
                  <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                    {config.difficulty_distribution.hard}% Difícil
                  </span>
                </div>
              </div>
            </div>
          </Card>
        )}

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
            : `Comenzar Práctica (${config?.questions_per_practice || 10} preguntas)`
          }
        </Button>
      </div>
    </PageLayout>
  )
}
