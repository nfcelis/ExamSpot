import { useState, useRef } from 'react'
import { PageLayout } from '../components/layout/PageLayout'
import { Card } from '../components/common/Card'
import { Button } from '../components/common/Button'
import { Input } from '../components/common/Input'
import { Select } from '../components/common/Select'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import { QuestionPreview } from '../components/question/QuestionPreview'
import {
  useQuestionBank,
  useCategories,
  useDeleteQuestionBankItem,
  useImportQuestions,
} from '../hooks/useQuestionBank'
import { parseQuestionsJSON, getSectionsFromJSON } from '../services/importService'
import type { QuestionType } from '../types/question'
import toast from 'react-hot-toast'

const TYPE_OPTIONS = [
  { value: '', label: 'Todos los tipos' },
  { value: 'multiple_choice', label: 'Opción múltiple' },
  { value: 'open_ended', label: 'Respuesta abierta' },
  { value: 'fill_blank', label: 'Rellenar espacios' },
  { value: 'matching', label: 'Emparejar' },
]

export function QuestionBankPage() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<QuestionType | ''>('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [importData, setImportData] = useState<any[] | null>(null)
  const [importSections, setImportSections] = useState<string[]>([])
  const [selectedImportSection, setSelectedImportSection] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: categories = [] } = useCategories()
  const { data: questions = [], isLoading } = useQuestionBank({
    search: search || undefined,
    type: typeFilter || undefined,
    category: categoryFilter || undefined,
    onlyMine: true,
  })

  const deleteItem = useDeleteQuestionBankItem()
  const importQuestions = useImportQuestions()

  const categoryOptions = [
    { value: '', label: 'Todas las secciones' },
    ...categories.map((c) => ({ value: c, label: c })),
  ]

  const handleDelete = () => {
    if (deleteId) {
      deleteItem.mutate(deleteId, {
        onSuccess: () => setDeleteId(null),
      })
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const parsed = parseQuestionsJSON(event.target?.result as string)
        setImportData(parsed)
        setImportSections(getSectionsFromJSON(parsed))
        setSelectedImportSection('')
        setShowImport(true)
      } catch {
        toast.error('Error al leer el archivo JSON. Verifica el formato.')
      }
    }
    reader.readAsText(file)
    // Reset input so same file can be re-selected
    e.target.value = ''
  }

  const handleImport = () => {
    if (!importData) return
    importQuestions.mutate(
      { questions: importData, section: selectedImportSection || undefined },
      {
        onSuccess: (result) => {
          if (result.skipped === 0) {
            setShowImport(false)
            setImportData(null)
          }
          // If there were errors, keep modal open so user can see
          if (result.errors.length > 0) {
            console.log('Errores de importación:', result.errors)
          }
        },
      }
    )
  }

  const importPreviewCount = selectedImportSection
    ? importData?.filter((q) => q.section === selectedImportSection).length ?? 0
    : importData?.length ?? 0

  return (
    <PageLayout>
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">Banco de Preguntas</h1>
            <p className="mt-1 text-sm text-secondary-500">
              {questions.length} pregunta{questions.length !== 1 ? 's' : ''} guardada{questions.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button onClick={() => fileInputRef.current?.click()}>
              Importar JSON
            </Button>
          </div>
        </div>

        {/* Import Modal */}
        {showImport && importData && (
          <Card className="mb-6 border-2 border-primary-200 bg-primary-50/50">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-secondary-900">
                  Importar preguntas
                </h3>
                <button
                  onClick={() => { setShowImport(false); setImportData(null) }}
                  className="text-secondary-400 hover:text-secondary-600"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className="text-sm text-secondary-600">
                Se encontraron <strong>{importData.length}</strong> preguntas en{' '}
                <strong>{importSections.length}</strong> secciones.
              </p>

              <div className="flex flex-wrap gap-2">
                {importSections.map((section) => {
                  const count = importData.filter((q) => q.section === section).length
                  return (
                    <span
                      key={section}
                      className="rounded-full bg-white px-3 py-1 text-xs text-secondary-700 shadow-sm"
                    >
                      {section} ({count})
                    </span>
                  )
                })}
              </div>

              <Select
                label="Filtrar por sección (opcional)"
                value={selectedImportSection}
                onChange={(e) => setSelectedImportSection(e.target.value)}
                options={[
                  { value: '', label: `Todas las secciones (${importData.length})` },
                  ...importSections.map((s) => ({
                    value: s,
                    label: `${s} (${importData.filter((q) => q.section === s).length})`,
                  })),
                ]}
              />

              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary-600">
                  Se importarán <strong>{importPreviewCount}</strong> preguntas
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => { setShowImport(false); setImportData(null) }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleImport}
                    loading={importQuestions.isPending}
                  >
                    Importar {importPreviewCount} preguntas
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              placeholder="Buscar preguntas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as QuestionType | '')}
              options={TYPE_OPTIONS}
            />
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              options={categoryOptions}
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
              No hay preguntas guardadas
            </h3>
            <p className="mt-1 text-sm text-secondary-500">
              Importa un archivo JSON o guarda preguntas desde tus exámenes.
            </p>
            <Button
              className="mt-4"
              onClick={() => fileInputRef.current?.click()}
            >
              Importar JSON
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {questions.map((question, index) => {
              const isFromExam = (question as any)._source === 'exam'
              return (
                <div key={`${question.id}-${index}`}>
                  <QuestionPreview
                    question={{
                      ...question,
                      id: question.id,
                      exam_id: '',
                      material_reference: null,
                      order_index: index,
                      allow_partial_credit: false,
                    }}
                    index={index}
                    showAnswer
                  />
                  <div className="-mt-1 flex items-center justify-between rounded-b-lg border border-t-0 border-secondary-200 bg-secondary-50 px-4 py-2">
                    <div className="flex items-center gap-2">
                      {isFromExam ? (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                          De: {question.category}
                        </span>
                      ) : question.category ? (
                        <span className="rounded-full bg-secondary-100 px-2.5 py-0.5 text-xs text-secondary-600">
                          {question.category}
                        </span>
                      ) : null}
                      {question.tags && question.tags.length > 0 && (
                        <span className="text-xs text-secondary-400">
                          {question.tags[0]}
                        </span>
                      )}
                    </div>
                    {!isFromExam && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(question.id)}
                        className="text-danger-600 hover:text-danger-700"
                      >
                        Eliminar
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar pregunta"
        message="¿Estás seguro de que deseas eliminar esta pregunta del banco? Esta acción no afecta a los exámenes que ya la utilizan."
        loading={deleteItem.isPending}
      />
    </PageLayout>
  )
}
