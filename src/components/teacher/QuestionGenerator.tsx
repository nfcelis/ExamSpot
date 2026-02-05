import { useState } from 'react'
import { Button } from '../common/Button'
import { Input } from '../common/Input'
import { Textarea } from '../common/Textarea'
import { Select } from '../common/Select'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { QuestionPreview } from '../question/QuestionPreview'
import {
  generateQuestionsFromMaterial,
  type GeneratedQuestion,
  type GenerateQuestionsParams,
} from '../../services/aiService'
import toast from 'react-hot-toast'

interface QuestionGeneratorProps {
  onAddQuestions: (questions: GeneratedQuestion[]) => void
  loading?: boolean
}

const QUESTION_TYPES = [
  { value: 'multiple_choice', label: 'Opción múltiple' },
  { value: 'open_ended', label: 'Respuesta abierta' },
  { value: 'fill_blank', label: 'Rellenar espacios' },
  { value: 'matching', label: 'Emparejar' },
] as const

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'Fácil' },
  { value: 'medium', label: 'Medio' },
  { value: 'hard', label: 'Difícil' },
]

export function QuestionGenerator({ onAddQuestions, loading: externalLoading }: QuestionGeneratorProps) {
  const [materialContent, setMaterialContent] = useState('')
  const [questionCount, setQuestionCount] = useState(5)
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [selectedTypes, setSelectedTypes] = useState<Set<GenerateQuestionsParams['questionTypes'][number]>>(
    new Set(['multiple_choice', 'open_ended'])
  )
  const [generating, setGenerating] = useState(false)
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([])
  const [selectedQuestions, setSelectedQuestions] = useState<Set<number>>(new Set())

  const toggleType = (type: GenerateQuestionsParams['questionTypes'][number]) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev)
      if (next.has(type)) {
        if (next.size > 1) next.delete(type) // Keep at least one selected
      } else {
        next.add(type)
      }
      return next
    })
  }

  const handleGenerate = async () => {
    if (!materialContent.trim()) {
      toast.error('Ingresa el contenido del material')
      return
    }

    if (materialContent.trim().length < 100) {
      toast.error('El material debe tener al menos 100 caracteres')
      return
    }

    setGenerating(true)
    setGeneratedQuestions([])
    setSelectedQuestions(new Set())

    try {
      const questions = await generateQuestionsFromMaterial({
        materialContent: materialContent.trim(),
        questionCount,
        questionTypes: Array.from(selectedTypes),
        difficulty,
      })
      setGeneratedQuestions(questions)
      // Select all by default
      setSelectedQuestions(new Set(questions.map((_, i) => i)))
      toast.success(`${questions.length} preguntas generadas`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al generar preguntas')
    } finally {
      setGenerating(false)
    }
  }

  const toggleQuestionSelection = (index: number) => {
    setSelectedQuestions((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const handleAddSelected = () => {
    const questionsToAdd = generatedQuestions.filter((_, i) => selectedQuestions.has(i))
    if (questionsToAdd.length === 0) {
      toast.error('Selecciona al menos una pregunta')
      return
    }
    onAddQuestions(questionsToAdd)
    setGeneratedQuestions([])
    setSelectedQuestions(new Set())
    setMaterialContent('')
  }

  return (
    <div className="space-y-6">
      {/* Configuration Section */}
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-secondary-700">
            Contenido del material
          </label>
          <Textarea
            value={materialContent}
            onChange={(e) => setMaterialContent(e.target.value)}
            placeholder="Pega aquí el contenido del material educativo (texto de PDF, apuntes, etc.)..."
            rows={8}
            disabled={generating}
          />
          <p className="mt-1 text-xs text-secondary-500">
            Mínimo 100 caracteres. Puedes copiar y pegar el texto de tu PDF o documento.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            type="number"
            label="Número de preguntas"
            value={questionCount}
            onChange={(e) => setQuestionCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
            min={1}
            max={20}
            disabled={generating}
          />

          <Select
            label="Dificultad"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
            options={DIFFICULTY_OPTIONS}
            disabled={generating}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-secondary-700">
            Tipos de preguntas
          </label>
          <div className="flex flex-wrap gap-2">
            {QUESTION_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => toggleType(type.value)}
                disabled={generating}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  selectedTypes.has(type.value)
                    ? 'bg-primary-600 text-white'
                    : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
                } disabled:opacity-50`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          loading={generating}
          disabled={!materialContent.trim() || generating}
          className="w-full"
        >
          {generating ? 'Generando preguntas...' : 'Generar preguntas con IA'}
        </Button>
      </div>

      {/* Generating State */}
      {generating && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <LoadingSpinner size="lg" className="text-primary-600" />
          <p className="mt-4 text-sm text-secondary-600">
            Analizando el material y generando preguntas...
          </p>
          <p className="mt-1 text-xs text-secondary-400">
            Esto puede tomar 10-30 segundos
          </p>
        </div>
      )}

      {/* Generated Questions */}
      {generatedQuestions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-secondary-900">
              Preguntas generadas ({selectedQuestions.size}/{generatedQuestions.length} seleccionadas)
            </h3>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedQuestions(new Set(generatedQuestions.map((_, i) => i)))}
              >
                Seleccionar todas
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedQuestions(new Set())}
              >
                Deseleccionar todas
              </Button>
            </div>
          </div>

          <div className="max-h-96 space-y-3 overflow-y-auto">
            {generatedQuestions.map((question, index) => (
              <div
                key={index}
                onClick={() => toggleQuestionSelection(index)}
                className={`cursor-pointer rounded-lg border bg-white p-4 transition-colors ${
                  selectedQuestions.has(index)
                    ? 'border-primary-500 ring-2 ring-primary-500'
                    : 'border-secondary-200 opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedQuestions.has(index)}
                    onChange={() => toggleQuestionSelection(index)}
                    className="mt-1 h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="min-w-0 flex-1">
                    <QuestionPreview question={question as any} compact />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={handleAddSelected}
            loading={externalLoading}
            disabled={selectedQuestions.size === 0}
            className="w-full"
          >
            Agregar {selectedQuestions.size} pregunta{selectedQuestions.size !== 1 ? 's' : ''} al examen
          </Button>
        </div>
      )}
    </div>
  )
}
