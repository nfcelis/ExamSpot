import { useState, useEffect } from 'react'
import { Button } from '../common/Button'
import { Input } from '../common/Input'
import { Textarea } from '../common/Textarea'
import { Select } from '../common/Select'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { QuestionPreview } from '../question/QuestionPreview'
import { getMaterialsByExam, getMaterialDownloadUrl } from '../../services/materialService'
import {
  generateQuestionsFromMaterial,
  type GeneratedQuestion,
  type GenerateQuestionsParams,
} from '../../services/aiService'
import type { Material } from '../../types/exam'
import { AI_QUESTION_TYPE_OPTIONS as QUESTION_TYPES } from '../../lib/questionTypeConstants'
import toast from 'react-hot-toast'

interface QuestionGeneratorProps {
  examId: string
  onAddQuestions: (questions: GeneratedQuestion[]) => void
  loading?: boolean
}

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'Fácil' },
  { value: 'medium', label: 'Medio' },
  { value: 'hard', label: 'Difícil' },
]

export function QuestionGenerator({ examId, onAddQuestions, loading: externalLoading }: QuestionGeneratorProps) {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loadingMaterials, setLoadingMaterials] = useState(true)
  const [selectedMaterials, setSelectedMaterials] = useState<Set<string>>(new Set())
  const [additionalContent, setAdditionalContent] = useState('')
  const [questionCount, setQuestionCount] = useState(5)
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(
    new Set(['multiple_choice', 'open_ended'])
  )
  const [generating, setGenerating] = useState(false)
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([])
  const [selectedQuestions, setSelectedQuestions] = useState<Set<number>>(new Set())

  // Fetch materials on mount
  useEffect(() => {
    async function fetchMaterials() {
      try {
        const mats = await getMaterialsByExam(examId)
        setMaterials(mats)
        // Select all by default
        setSelectedMaterials(new Set(mats.map((m) => m.id)))
      } catch (error) {
        console.error('Error fetching materials:', error)
      } finally {
        setLoadingMaterials(false)
      }
    }
    fetchMaterials()
  }, [examId])

  const toggleMaterial = (id: string) => {
    setSelectedMaterials((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleType = (type: string) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev)
      if (next.has(type)) {
        if (next.size > 1) next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }

  const fetchTextContent = async (material: Material): Promise<string> => {
    // For text files, try to fetch and read content
    if (material.file_type === 'txt') {
      try {
        const url = await getMaterialDownloadUrl(material.file_path)
        const response = await fetch(url)
        if (response.ok) {
          return await response.text()
        }
      } catch (error) {
        console.error('Error fetching text file:', error)
      }
    }
    // For other types, return metadata
    return `[Documento: ${material.title}]`
  }

  const handleGenerate = async () => {
    const selectedMats = materials.filter((m) => selectedMaterials.has(m.id))

    if (selectedMats.length === 0 && !additionalContent.trim()) {
      toast.error('Selecciona al menos un material o ingresa contenido adicional')
      return
    }

    setGenerating(true)
    setGeneratedQuestions([])
    setSelectedQuestions(new Set())

    try {
      // Build content from selected materials
      const materialContents: string[] = []

      for (const mat of selectedMats) {
        const content = await fetchTextContent(mat)
        materialContents.push(content)
      }

      // Combine material content with additional content
      let fullContent = materialContents.join('\n\n')
      if (additionalContent.trim()) {
        fullContent += '\n\n--- Contenido adicional ---\n' + additionalContent.trim()
      }

      if (fullContent.trim().length < 50) {
        toast.error('El contenido debe tener al menos 50 caracteres. Para archivos PDF/DOC, pega el texto relevante en el campo de contenido adicional.')
        setGenerating(false)
        return
      }

      const questions = await generateQuestionsFromMaterial({
        materialContent: fullContent,
        questionCount,
        questionTypes: Array.from(selectedTypes) as GenerateQuestionsParams['questionTypes'],
        difficulty,
      })

      setGeneratedQuestions(questions)
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
    setAdditionalContent('')
  }

  if (loadingMaterials) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" className="text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Materials Selection */}
      {materials.length > 0 ? (
        <div>
          <label className="mb-2 block text-sm font-medium text-secondary-700">
            Material de referencia
          </label>
          <div className="space-y-2 rounded-lg border border-secondary-200 p-3">
            {materials.map((material) => (
              <label
                key={material.id}
                className={`flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors ${
                  selectedMaterials.has(material.id)
                    ? 'bg-primary-50'
                    : 'hover:bg-secondary-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedMaterials.has(material.id)}
                  onChange={() => toggleMaterial(material.id)}
                  disabled={generating}
                  className="h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="flex h-8 w-8 items-center justify-center rounded bg-primary-100 text-xs font-bold text-primary-700">
                  {material.file_type.toUpperCase().slice(0, 3)}
                </span>
                <span className="text-sm text-secondary-800">{material.title}</span>
              </label>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-secondary-500">
            Para archivos PDF/DOC, copia y pega el texto relevante en el campo de abajo.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          <p className="font-medium">No hay materiales subidos</p>
          <p className="mt-1 text-yellow-700">
            Sube materiales en la sección "Material de referencia" o ingresa el contenido directamente abajo.
          </p>
        </div>
      )}

      {/* Additional Content */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-secondary-700">
          {materials.length > 0 ? 'Contenido adicional (texto de PDFs, notas, etc.)' : 'Contenido del material'}
        </label>
        <Textarea
          value={additionalContent}
          onChange={(e) => setAdditionalContent(e.target.value)}
          placeholder="Pega aquí el texto de tus documentos PDF, apuntes o cualquier contenido adicional..."
          rows={6}
          disabled={generating}
        />
      </div>

      {/* Generation Options */}
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
        disabled={generating}
        className="w-full"
      >
        {generating ? 'Generando preguntas...' : 'Generar preguntas con IA'}
      </Button>

      {/* Generating State */}
      {generating && (
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <p className="text-sm text-secondary-600">
            Analizando el material y generando preguntas...
          </p>
          <p className="mt-1 text-xs text-secondary-400">
            Esto puede tomar 10-30 segundos
          </p>
        </div>
      )}

      {/* Generated Questions */}
      {generatedQuestions.length > 0 && (
        <div className="space-y-4 border-t border-secondary-200 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-secondary-900">
              Preguntas generadas ({selectedQuestions.size}/{generatedQuestions.length})
            </h3>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedQuestions(new Set(generatedQuestions.map((_, i) => i)))}
              >
                Todas
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedQuestions(new Set())}
              >
                Ninguna
              </Button>
            </div>
          </div>

          <div className="max-h-72 space-y-3 overflow-y-auto">
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
