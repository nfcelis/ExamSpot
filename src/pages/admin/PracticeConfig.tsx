import { useState, useEffect } from 'react'
import { PageLayout } from '../../components/layout/PageLayout'
import { Card } from '../../components/common/Card'
import { Button } from '../../components/common/Button'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { getPracticeConfig, updatePracticeConfig } from '../../services/adminService'
import type { PracticeConfig as PracticeConfigType } from '../../types/exam'
import toast from 'react-hot-toast'

export function PracticeConfigPage() {
  const [config, setConfig] = useState<PracticeConfigType | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form state
  const [questionsPerPractice, setQuestionsPerPractice] = useState(10)
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number | null>(15)
  const [hasTimeLimit, setHasTimeLimit] = useState(true)
  const [easyPct, setEasyPct] = useState(30)
  const [mediumPct, setMediumPct] = useState(50)
  const [hardPct, setHardPct] = useState(20)
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(true)
  const [showFeedback, setShowFeedback] = useState(true)
  const [allowRetry, setAllowRetry] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await getPracticeConfig()
        setConfig(data)
        setQuestionsPerPractice(data.questions_per_practice)
        setTimeLimitMinutes(data.time_limit_minutes)
        setHasTimeLimit(data.time_limit_minutes !== null)
        setEasyPct(data.difficulty_distribution.easy)
        setMediumPct(data.difficulty_distribution.medium)
        setHardPct(data.difficulty_distribution.hard)
        setShowCorrectAnswers(data.show_correct_answers)
        setShowFeedback(data.show_feedback ?? true)
        setAllowRetry(data.allow_retry)
      } catch (err) {
        toast.error('Error al cargar configuración')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const totalPct = easyPct + mediumPct + hardPct

  const handleSave = async () => {
    if (!config) return
    if (totalPct !== 100) {
      toast.error('Los porcentajes de dificultad deben sumar 100%')
      return
    }

    setSaving(true)
    try {
      const updated = await updatePracticeConfig({
        id: config.id,
        questions_per_practice: questionsPerPractice,
        time_limit_minutes: hasTimeLimit ? timeLimitMinutes : null,
        difficulty_distribution: {
          easy: easyPct,
          medium: mediumPct,
          hard: hardPct,
        },
        show_correct_answers: showCorrectAnswers,
        show_feedback: showFeedback,
        allow_retry: allowRetry,
      })
      setConfig(updated)
      toast.success('Configuración guardada')
    } catch (err) {
      toast.error('Error al guardar')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <PageLayout>
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-secondary-900">Configuración de Práctica</h1>
          <p className="mt-1 text-secondary-500">
            Configura los parámetros globales del modo práctica para estudiantes.
          </p>
        </div>

        <div className="space-y-6">
          {/* Questions per practice */}
          <Card>
            <h3 className="mb-3 font-semibold text-secondary-900">Preguntas por Práctica</h3>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={5}
                max={50}
                value={questionsPerPractice}
                onChange={(e) => setQuestionsPerPractice(Number(e.target.value))}
                className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-secondary-200 accent-primary-600"
              />
              <input
                type="number"
                min={1}
                max={100}
                value={questionsPerPractice}
                onChange={(e) => setQuestionsPerPractice(Number(e.target.value))}
                className="w-20 rounded-lg border border-secondary-300 px-3 py-2 text-center text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </Card>

          {/* Time limit */}
          <Card>
            <h3 className="mb-3 font-semibold text-secondary-900">Tiempo Límite</h3>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={hasTimeLimit}
                onChange={(e) => setHasTimeLimit(e.target.checked)}
                className="h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-secondary-700">Habilitar tiempo límite</span>
            </label>
            {hasTimeLimit && (
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={timeLimitMinutes || 15}
                  onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                  className="w-24 rounded-lg border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                <span className="text-sm text-secondary-500">minutos</span>
              </div>
            )}
          </Card>

          {/* Difficulty distribution */}
          <Card>
            <h3 className="mb-3 font-semibold text-secondary-900">Distribución de Dificultad</h3>
            <p className="mb-4 text-sm text-secondary-500">
              Los porcentajes deben sumar 100%.{' '}
              <span className={totalPct === 100 ? 'text-green-600' : 'font-medium text-danger-600'}>
                Total: {totalPct}%
              </span>
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-16 text-sm font-medium text-green-700">Fácil</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={easyPct}
                  onChange={(e) => setEasyPct(Number(e.target.value))}
                  className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-green-200 accent-green-600"
                />
                <span className="w-12 text-right text-sm text-secondary-600">{easyPct}%</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-16 text-sm font-medium text-yellow-700">Medio</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={mediumPct}
                  onChange={(e) => setMediumPct(Number(e.target.value))}
                  className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-yellow-200 accent-yellow-600"
                />
                <span className="w-12 text-right text-sm text-secondary-600">{mediumPct}%</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-16 text-sm font-medium text-red-700">Difícil</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={hardPct}
                  onChange={(e) => setHardPct(Number(e.target.value))}
                  className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-red-200 accent-red-600"
                />
                <span className="w-12 text-right text-sm text-secondary-600">{hardPct}%</span>
              </div>
            </div>
          </Card>

          {/* Options */}
          <Card>
            <h3 className="mb-3 font-semibold text-secondary-900">Opciones</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showCorrectAnswers}
                  onChange={(e) => setShowCorrectAnswers(e.target.checked)}
                  className="h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-secondary-700">Mostrar respuestas correctas al finalizar</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showFeedback}
                  onChange={(e) => setShowFeedback(e.target.checked)}
                  className="h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-secondary-700">Mostrar feedback de IA al finalizar</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={allowRetry}
                  onChange={(e) => setAllowRetry(e.target.checked)}
                  className="h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-secondary-700">Permitir repetir prácticas</span>
              </label>
            </div>
          </Card>

          {/* Save */}
          <Button
            onClick={handleSave}
            loading={saving}
            size="lg"
            className="w-full"
            disabled={totalPct !== 100}
          >
            Guardar Configuración
          </Button>
        </div>
      </div>
    </PageLayout>
  )
}
