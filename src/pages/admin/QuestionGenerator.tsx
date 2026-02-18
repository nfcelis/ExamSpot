import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageLayout } from '../../components/layout/PageLayout'
import { Card } from '../../components/common/Card'
import { Button } from '../../components/common/Button'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { generateQuestionsWithAI } from '../../services/adminService'
import { extractTextFromFile, getSupportedExtensions, getFileTypeLabel } from '../../services/fileExtractService'
import { supabase } from '../../lib/supabase'
import { AI_QUESTION_TYPE_OPTIONS } from '../../lib/questionTypeConstants'
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

  const questionTypes = AI_QUESTION_TYPE_OPTIONS

  const toggleType = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  // File upload state
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null)
  const [fileType, setFileType] = useState<string | null>(null)
  const [extractionFailed, setExtractionFailed] = useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    setUploading(true)
    setExtracting(true)
    setFileType(ext)

    try {
      // 1. Upload file to Supabase Storage for preview
      const filePath = `ai-generation/${crypto.randomUUID()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('exam-materials')
        .upload(filePath, file)

      if (uploadError) {
        throw new Error(`Error al subir archivo: ${uploadError.message}`)
      }

      // Get public URL for preview
      const { data: urlData } = supabase.storage
        .from('exam-materials')
        .getPublicUrl(filePath)

      setFilePreviewUrl(urlData.publicUrl)
      setUploadedFileName(file.name)
      setUploading(false)
      toast.success(`${getFileTypeLabel(file.name)} cargado correctamente`)

      // 2. Extract text silently in background for AI (user doesn't need to see this)
      try {
        const text = await extractTextFromFile(file)
        if (text.trim()) {
          setPdfContent(text)
          setExtractionFailed(false)
        } else {
          setExtractionFailed(true)
        }
      } catch (extractErr) {
        console.error('Text extraction failed:', extractErr)
        setExtractionFailed(true)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      toast.error(`Error al subir archivo: ${msg}`)
      console.error(err)
    } finally {
      setUploading(false)
      setExtracting(false)
    }
  }

  const handleRemoveFile = () => {
    setUploadedFileName(null)
    setFilePreviewUrl(null)
    setFileType(null)
    setPdfContent('')
  }

  const handleGenerate = async () => {
    if (!pdfContent.trim()) {
      toast.error('Sube un archivo o pega el contenido del material')
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
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      toast.error(`Error al generar preguntas: ${msg}`)
      console.error('Error generating questions:', err)
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

            {/* File preview area */}
            {filePreviewUrl && uploadedFileName ? (
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium text-secondary-700">{uploadedFileName}</span>
                    {extracting && (
                      <span className="flex items-center gap-1 text-xs text-primary-600">
                        <LoadingSpinner size="sm" className="text-primary-600" />
                        Procesando...
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleRemoveFile}
                    className="text-sm text-red-500 hover:text-red-700"
                  >
                    Quitar archivo
                  </button>
                </div>

                {/* Embedded preview */}
                {fileType === 'pdf' ? (
                  <iframe
                    src={filePreviewUrl}
                    className="w-full rounded-lg border border-secondary-200"
                    style={{ height: '500px' }}
                    title="Vista previa del PDF"
                  />
                ) : (
                  <div className="flex items-center justify-center rounded-lg border border-secondary-200 bg-secondary-50 py-12">
                    <div className="text-center">
                      <svg className="mx-auto h-12 w-12 text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="mt-2 text-sm font-medium text-secondary-700">{uploadedFileName}</p>
                      <p className="text-xs text-secondary-500">{getFileTypeLabel(uploadedFileName)} cargado correctamente</p>
                      <a
                        href={filePreviewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-xs text-primary-600 hover:text-primary-700"
                      >
                        Abrir en nueva pestaña
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Upload zone */
              <div className="mb-3">
                <label className={`flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed py-8 transition-colors ${
                  uploading
                    ? 'border-primary-400 bg-primary-50'
                    : 'border-secondary-300 hover:border-primary-400 hover:bg-primary-50'
                }`}>
                  <input
                    type="file"
                    accept={getSupportedExtensions()}
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  <div className="text-center">
                    {uploading ? (
                      <>
                        <LoadingSpinner size="md" className="mx-auto text-primary-600" />
                        <p className="mt-2 text-sm text-primary-600">Subiendo archivo...</p>
                      </>
                    ) : (
                      <>
                        <svg className="mx-auto h-10 w-10 text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="mt-2 text-sm font-medium text-secondary-600">Subir material de referencia</p>
                        <p className="text-xs text-secondary-400">PDF, Word, PowerPoint o TXT</p>
                      </>
                    )}
                  </div>
                </label>
              </div>
            )}

            {/* Manual text input - shown when no file uploaded OR extraction failed */}
            {!filePreviewUrl ? (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm text-secondary-500 hover:text-secondary-700">
                  O pegar texto manualmente...
                </summary>
                <textarea
                  value={pdfContent}
                  onChange={(e) => setPdfContent(e.target.value)}
                  rows={6}
                  className="mt-2 w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="Pega aquí el contenido del material educativo..."
                />
                {pdfContent && (
                  <p className="mt-1 text-xs text-secondary-400">
                    {pdfContent.length} caracteres
                  </p>
                )}
              </details>
            ) : extractionFailed ? (
              <div className="mt-3">
                <p className="mb-2 text-sm text-amber-600">
                  No se pudo procesar este tipo de archivo. Pega el contenido del material para generar preguntas:
                </p>
                <textarea
                  value={pdfContent}
                  onChange={(e) => setPdfContent(e.target.value)}
                  rows={6}
                  className="w-full rounded-lg border border-amber-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="Pega aquí el contenido del material..."
                />
                {pdfContent && (
                  <p className="mt-1 text-xs text-secondary-400">
                    {pdfContent.length} caracteres
                  </p>
                )}
              </div>
            ) : null}
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
              disabled={!pdfContent.trim() || !category.trim() || extracting}
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
