import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageLayout } from '../../components/layout/PageLayout'
import { Card } from '../../components/common/Card'
import { Button } from '../../components/common/Button'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { generateQuestionsWithAI } from '../../services/adminService'
import toast from 'react-hot-toast'

export function QuestionGenerator() {
  const navigate = useNavigate()
  const [pdfContent, setPdfContent] = useState('')
  const [numQuestions, setNumQuestions] = useState(10)
  const [difficulty, setDifficulty] = useState('medium')
  const [category, setCategory] = useState('')
  const [subcategory, setSubcategory] = useState('')
  const [tags, setTags] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['multiple_choice', 'open_ended'])
  const [generating, setGenerating] = useState(false)
  const [generatedCount, setGeneratedCount] = useState<number | null>(null)

  const questionTypes = [
    { value: 'multiple_choice', label: 'Opción Múltiple' },
    { value: 'open_ended', label: 'Respuesta Abierta' },
    { value: 'fill_blank', label: 'Rellenar Espacios' },
    { value: 'matching', label: 'Emparejar' },
  ]

  const toggleType = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      const text = await file.text()
      setPdfContent(text)
      toast.success(`Archivo cargado: ${file.name}`)
    } else {
      toast.error('Por ahora solo se soportan archivos .txt. Copia el contenido del PDF.')
    }
  }

  const handleGenerate = async () => {
    if (!pdfContent.trim()) {
      toast.error('Pega o carga el contenido del material')
      return
    }
    if (!category.trim()) {
      toast.error('La categoría es obligatoria')
      return
    }
    if (selectedTypes.length === 0) {
      toast.error('Selecciona al menos un tipo de pregunta')
      return
    }

    setGenerating(true)
    setGeneratedCount(null)

    try {
      const questions = await generateQuestionsWithAI({
        pdfContent,
        numQuestions,
        questionTypes: selectedTypes,
        difficulty,
        category,
        subcategory: subcategory || undefined,
        tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
      })

      setGeneratedCount(questions.length)
      toast.success(`${questions.length} preguntas generadas y guardadas como pendientes`)
    } catch (err) {
      toast.error('Error al generar preguntas con IA')
      console.error(err)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <PageLayout>
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-secondary-900">Generar Preguntas con IA</h1>
          <p className="mt-1 text-secondary-500">
            Sube material educativo y la IA generará preguntas automáticamente.
            Las preguntas quedarán en estado "pendiente" para tu revisión.
          </p>
        </div>

        <div className="space-y-6">
          {/* Material */}
          <Card>
            <h3 className="mb-3 font-semibold text-secondary-900">Material Educativo</h3>
            <div className="mb-3">
              <label className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-secondary-300 py-6 transition-colors hover:border-primary-400 hover:bg-primary-50">
                <input
                  type="file"
                  accept=".txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="text-center">
                  <svg className="mx-auto h-8 w-8 text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="mt-2 text-sm text-secondary-500">Subir archivo .txt</p>
                </div>
              </label>
            </div>
            <textarea
              value={pdfContent}
              onChange={(e) => setPdfContent(e.target.value)}
              rows={8}
              className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="O pega aquí el contenido del material educativo..."
            />
            {pdfContent && (
              <p className="mt-1 text-xs text-secondary-400">
                {pdfContent.length} caracteres cargados
              </p>
            )}
          </Card>

          {/* Configuration */}
          <Card>
            <h3 className="mb-3 font-semibold text-secondary-900">Configuración</h3>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-secondary-700">Categoría *</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="ej: Arquitectura Empresarial"
                    className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-secondary-700">Subcategoría</label>
                  <input
                    type="text"
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                    placeholder="ej: TOGAF"
                    className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-secondary-700"># de Preguntas</label>
                  <input
                    type="number"
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(Number(e.target.value))}
                    min={1}
                    max={30}
                    className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-secondary-700">Dificultad</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="easy">Fácil</option>
                    <option value="medium">Medio</option>
                    <option value="hard">Difícil</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-secondary-700">Tipos de Preguntas</label>
                <div className="flex flex-wrap gap-2">
                  {questionTypes.map((qt) => (
                    <button
                      key={qt.value}
                      onClick={() => toggleType(qt.value)}
                      className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                        selectedTypes.includes(qt.value)
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-secondary-300 bg-white text-secondary-600 hover:bg-secondary-50'
                      }`}
                    >
                      {qt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-secondary-700">Tags (separados por coma)</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="ej: adm, fase-a, stakeholders"
                  className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>
          </Card>

          {/* Generate button */}
          <div className="flex items-center gap-4">
            <Button
              onClick={handleGenerate}
              loading={generating}
              size="lg"
              className="flex-1"
              disabled={!pdfContent.trim() || !category.trim()}
            >
              {generating ? 'Generando preguntas...' : `Generar ${numQuestions} Preguntas con IA`}
            </Button>
          </div>

          {generating && (
            <Card className="border-primary-200 bg-primary-50">
              <div className="flex items-center gap-3">
                <LoadingSpinner size="md" className="text-primary-600" />
                <div>
                  <p className="font-medium text-primary-800">Generando preguntas...</p>
                  <p className="text-sm text-primary-600">
                    La IA está procesando el material. Esto puede tomar 20-30 segundos.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {generatedCount !== null && (
            <Card className="border-green-200 bg-green-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-green-800">
                    {generatedCount} preguntas generadas exitosamente
                  </p>
                  <p className="text-sm text-green-600">
                    Las preguntas están pendientes de revisión.
                  </p>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => navigate('/admin/pending')}
                >
                  Revisar Pendientes
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </PageLayout>
  )
}
