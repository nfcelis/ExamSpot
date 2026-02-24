import { useState } from 'react'
import { Button } from '../common/Button'
import { Input } from '../common/Input'
import { Select } from '../common/Select'
import { useCategories } from '../../hooks/useQuestionBank'
import { getRandomApprovedQuestions } from '../../services/questionBankService'
import type { QuestionBankItem, QuestionDifficulty } from '../../types/question'
import toast from 'react-hot-toast'

interface RandomQuestionModalProps {
  onAddQuestions: (questions: QuestionBankItem[]) => void
  loading?: boolean
  excludeIds?: string[]
}

const DIFFICULTY_OPTIONS = [
  { value: '', label: 'Cualquier dificultad' },
  { value: 'easy', label: 'Fácil' },
  { value: 'medium', label: 'Medio' },
  { value: 'hard', label: 'Difícil' },
]

export function RandomQuestionModal({ onAddQuestions, loading, excludeIds = [] }: RandomQuestionModalProps) {
  const [count, setCount] = useState(5)
  const [category, setCategory] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [generating, setGenerating] = useState(false)

  const { data: categories = [] } = useCategories()

  const categoryOptions = [
    { value: '', label: 'Todas las categorías' },
    ...categories.map((c: string) => ({ value: c, label: c })),
  ]

  const handleGenerate = async () => {
    if (count < 1 || count > 100) {
      toast.error('El número de preguntas debe estar entre 1 y 100')
      return
    }

    setGenerating(true)
    try {
      const questions = await getRandomApprovedQuestions({
        count,
        category: category || undefined,
        difficulty: (difficulty as QuestionDifficulty) || undefined,
        excludeIds,
      })

      if (questions.length === 0) {
        toast.error('No hay preguntas disponibles con esos criterios')
        return
      }

      if (questions.length < count) {
        toast(`Se encontraron ${questions.length} pregunta${questions.length !== 1 ? 's' : ''} (menos de las ${count} solicitadas)`, {
          icon: '⚠️',
        })
      }

      onAddQuestions(questions)
    } catch (err) {
      toast.error('Error al obtener preguntas aleatorias')
      console.error(err)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-secondary-500">
        El sistema seleccionará preguntas al azar del banco aprobado según los criterios que elijas.
      </p>

      <div className="space-y-4">
        {/* Número de preguntas */}
        <div>
          <label className="mb-1 block text-sm font-medium text-secondary-700">
            Número de preguntas
          </label>
          <Input
            type="number"
            min={1}
            max={100}
            value={count}
            onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
            placeholder="Ej: 10"
          />
        </div>

        {/* Categoría (opcional) */}
        <div>
          <label className="mb-1 block text-sm font-medium text-secondary-700">
            Tema / Categoría <span className="font-normal text-secondary-400">(opcional)</span>
          </label>
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={categoryOptions}
          />
        </div>

        {/* Dificultad (opcional) */}
        <div>
          <label className="mb-1 block text-sm font-medium text-secondary-700">
            Dificultad <span className="font-normal text-secondary-400">(opcional)</span>
          </label>
          <Select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            options={DIFFICULTY_OPTIONS}
          />
        </div>
      </div>

      {/* Resumen */}
      <div className="rounded-lg bg-primary-50 px-4 py-3 text-sm text-primary-700">
        Se agregarán <strong>{count}</strong> preguntas aleatorias
        {category ? ` de la categoría "${category}"` : ' de todas las categorías'}
        {difficulty
          ? ` con dificultad "${DIFFICULTY_OPTIONS.find(d => d.value === difficulty)?.label}"`
          : ''}
        {' '}(excluyendo las ya agregadas al examen).
      </div>

      <Button
        onClick={handleGenerate}
        loading={loading || generating}
        className="w-full"
      >
        <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Generar preguntas aleatorias
      </Button>
    </div>
  )
}
