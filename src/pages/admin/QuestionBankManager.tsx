import { useState, useEffect, useRef } from 'react'
import { PageLayout } from '../../components/layout/PageLayout'
import { Card } from '../../components/common/Card'
import { Button } from '../../components/common/Button'
import { Modal } from '../../components/common/Modal'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { SafeHtml } from '../../components/common/SafeHtml'
import { QuestionEditor } from '../../components/admin/QuestionEditor'
import { QuestionFilters } from '../../components/admin/QuestionFilters'
import {
  getAllQuestions,
  createQuestionManual,
  updateQuestion,
  deleteQuestion,
  deleteAllMyQuestions,
  generateFeedbackForQuestion,
  updateQuestionFeedback,
  type CreateQuestionData,
} from '../../services/adminService'
import { importQuestionsFromJSON, parseQuestionsJSON, getSectionsFromJSON, type ImportResult } from '../../services/importService'
import type { QuestionBankItem } from '../../types/question'
import { QUESTION_TYPE_LABELS } from '../../lib/questionTypeConstants'
import toast from 'react-hot-toast'

const typeLabels = QUESTION_TYPE_LABELS

const difficultyLabels: Record<string, string> = {
  easy: 'Fácil',
  medium: 'Medio',
  hard: 'Difícil',
}

const statusColors: Record<string, string> = {
  approved: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  rejected: 'bg-red-100 text-red-700',
}

export function QuestionBankManager() {
  const [questions, setQuestions] = useState<QuestionBankItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [showEditor, setShowEditor] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<QuestionBankItem | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteAll, setShowDeleteAll] = useState(false)
  const [deletingAll, setDeletingAll] = useState(false)
  const [expandedFeedback, setExpandedFeedback] = useState<Set<string>>(new Set())
  const [editingFeedback, setEditingFeedback] = useState<Record<string, string>>({})
  const [generatingFeedback, setGeneratingFeedback] = useState<Record<string, boolean>>({})
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const toggleFeedback = (id: string) => {
    setExpandedFeedback(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleGenerateFeedback = async (q: QuestionBankItem) => {
    setGeneratingFeedback(prev => ({ ...prev, [q.id]: true }))
    try {
      const feedback = await generateFeedbackForQuestion(q.id)
      setEditingFeedback(prev => ({ ...prev, [q.id]: feedback }))
      if (!expandedFeedback.has(q.id)) {
        setExpandedFeedback(prev => new Set(prev).add(q.id))
      }
      toast.success('Feedback generado')
    } catch (err) {
      toast.error('Error al generar feedback')
      console.error(err)
    } finally {
      setGeneratingFeedback(prev => ({ ...prev, [q.id]: false }))
    }
  }

  const handleSaveFeedback = async (questionId: string) => {
    const feedback = editingFeedback[questionId]
    if (feedback === undefined) return
    try {
      const updated = await updateQuestionFeedback(questionId, feedback)
      setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, explanation: updated.explanation } : q))
      setEditingFeedback(prev => {
        const next = { ...prev }
        delete next[questionId]
        return next
      })
      toast.success('Feedback guardado')
    } catch (err) {
      toast.error('Error al guardar')
      console.error(err)
    }
  }

  const loadQuestions = async () => {
    setLoading(true)
    try {
      const data = await getAllQuestions(filters)
      setQuestions(data)
    } catch (err) {
      toast.error('Error al cargar preguntas')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQuestions()
  }, [filters])

  const handleCreate = async (data: CreateQuestionData) => {
    try {
      await createQuestionManual(data)
      toast.success('Pregunta creada exitosamente')
      setShowEditor(false)
      loadQuestions()
    } catch (err) {
      toast.error('Error al crear pregunta')
      console.error(err)
    }
  }

  const handleUpdate = async (data: Partial<QuestionBankItem>) => {
    if (!editingQuestion) return
    try {
      await updateQuestion(editingQuestion.id, data)
      toast.success('Pregunta actualizada')
      setEditingQuestion(null)
      loadQuestions()
    } catch (err) {
      toast.error('Error al actualizar')
      console.error(err)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await deleteQuestion(deleteId)
      toast.success('Pregunta eliminada')
      setDeleteId(null)
      loadQuestions()
    } catch (err) {
      toast.error('Error al eliminar')
      console.error(err)
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteAll = async () => {
    setDeletingAll(true)
    try {
      const count = await deleteAllMyQuestions()
      toast.success(`${count} preguntas eliminadas`)
      setShowDeleteAll(false)
      loadQuestions()
    } catch (err) {
      toast.error('Error al eliminar todas las preguntas')
      console.error(err)
    } finally {
      setDeletingAll(false)
    }
  }

  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = '' // reset input

    setImporting(true)
    try {
      const text = await file.text()
      const parsed = parseQuestionsJSON(text)
      const sections = getSectionsFromJSON(parsed)
      toast.success(`Archivo cargado: ${parsed.length} preguntas en ${sections.length} secciones. Importando...`)

      const result: ImportResult = await importQuestionsFromJSON(parsed)
      toast.success(
        `Importación completa: ${result.imported} importadas, ${result.duplicates} duplicadas, ${result.skipped} omitidas`
      )
      if (result.errors.length > 0) {
        console.warn('Import errors:', result.errors)
        toast.error(`${result.errors.length} errores durante la importación`)
      }
      loadQuestions()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      toast.error(`Error al importar: ${msg}`)
      console.error(err)
    } finally {
      setImporting(false)
    }
  }

  return (
    <PageLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Banco de Preguntas</h1>
          <p className="mt-1 text-secondary-500">
            {questions.length} pregunta{questions.length !== 1 ? 's' : ''} en total
          </p>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportJSON}
            className="hidden"
          />
          {questions.length > 0 && (
            <Button
              variant="danger"
              onClick={() => setShowDeleteAll(true)}
            >
              Borrar Todo
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            loading={importing}
          >
            {importing ? 'Importando...' : 'Importar JSON'}
          </Button>
          <Button onClick={() => setShowEditor(true)}>
            Crear Pregunta
          </Button>
        </div>
      </div>

      <QuestionFilters
        filters={filters}
        onChange={setFilters}
        showStatus
      />

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : questions.length === 0 ? (
        <Card className="py-12 text-center">
          <p className="text-secondary-500">No hay preguntas que coincidan con los filtros.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <Card key={q.id} className="transition-all hover:shadow-md">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[q.status]}`}>
                      {q.status === 'approved' ? 'Aprobada' : q.status === 'pending' ? 'Pendiente' : 'Rechazada'}
                    </span>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                      {typeLabels[q.type] || q.type}
                    </span>
                    <span className="rounded-full bg-secondary-100 px-2 py-0.5 text-xs font-medium text-secondary-600">
                      {difficultyLabels[q.difficulty] || q.difficulty}
                    </span>
                    <span className="text-xs text-secondary-400">
                      {q.category}{q.subcategory ? ` / ${q.subcategory}` : ''}
                    </span>
                    {q.source === 'ai_generated' && (
                      <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                        IA
                      </span>
                    )}
                    <span className="text-xs text-secondary-400">{q.points} pts</span>
                  </div>

                  {/* Question text */}
                  <div className="text-sm text-secondary-800">
                    <SafeHtml html={q.question_text} />
                  </div>

                  {/* Options with correct answer highlighted (MC, T/F, Multi-Select) */}
                  {(q.type === 'multiple_choice' || q.type === 'true_false' || q.type === 'multi_select') && q.options && (
                    <div className="mt-3 space-y-1.5">
                      {q.options.map((opt, i) => {
                        const isCorrect = typeof q.correct_answer === 'number'
                          ? q.correct_answer === i
                          : Array.isArray(q.correct_answer) && (q.correct_answer as number[]).includes(i)
                        return (
                          <div
                            key={i}
                            className={`rounded-lg border px-3 py-2 text-sm ${
                              isCorrect
                                ? 'border-green-300 bg-green-50 text-green-800'
                                : 'border-secondary-200 text-secondary-600'
                            }`}
                          >
                            <span className="mr-2 font-medium">{isCorrect ? '✓' : ' '}</span>
                            <SafeHtml html={opt} inline />
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Fill blank correct answers */}
                  {q.type === 'fill_blank' && Array.isArray(q.correct_answer) && (
                    <div className="mt-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                      <span className="font-medium">Respuestas: </span>
                      {(q.correct_answer as string[]).map((a, i) => (
                        <span key={i}>{i > 0 && <span className="mx-1">·</span>}<SafeHtml html={a} inline /></span>
                      ))}
                    </div>
                  )}

                  {/* Matching terms */}
                  {q.type === 'matching' && q.terms && (
                    <div className="mt-3 space-y-1.5">
                      {q.terms.map((pair, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <span className="rounded bg-secondary-100 px-2 py-1 text-secondary-700">
                            <SafeHtml html={pair.term} inline />
                          </span>
                          <span className="text-secondary-400">→</span>
                          <span className="text-green-700">
                            <SafeHtml html={pair.definition} inline />
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Open ended / written response model answer */}
                  {(q.type === 'open_ended' || q.type === 'written_response') && Boolean(q.correct_answer) && (
                    <div className="mt-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                      <span className="font-medium">Respuesta modelo: </span>
                      <SafeHtml html={q.correct_answer as string} inline />
                    </div>
                  )}

                  {/* Ordering correct sequence */}
                  {q.type === 'ordering' && Array.isArray(q.correct_answer) && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs font-medium text-secondary-500">Orden correcto:</p>
                      {(q.correct_answer as string[]).map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-secondary-700">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">{i + 1}</span>
                          <SafeHtml html={item} inline />
                        </div>
                      ))}
                    </div>
                  )}

                  {q.status === 'rejected' && q.rejection_reason && (
                    <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                      <p className="text-xs font-medium text-red-700">Razón de rechazo:</p>
                      <p className="mt-0.5 text-sm text-red-600">{q.rejection_reason}</p>
                    </div>
                  )}
                  {q.tags && q.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {q.tags.map((tag) => (
                        <span key={tag} className="rounded bg-secondary-50 px-1.5 py-0.5 text-xs text-secondary-500">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleFeedback(q.id)}
                  >
                    {expandedFeedback.has(q.id) ? 'Ocultar Feedback' : 'Feedback'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingQuestion(q)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setDeleteId(q.id)}
                  >
                    Eliminar
                  </Button>
                </div>
              </div>

              {/* Expandable Feedback Section */}
              {expandedFeedback.has(q.id) && (
                <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50/50 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold text-blue-700">Feedback / Explicación</p>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleGenerateFeedback(q)}
                        disabled={generatingFeedback[q.id]}
                        className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 hover:bg-blue-200 disabled:opacity-50"
                      >
                        {generatingFeedback[q.id] ? 'Generando...' : q.explanation ? 'Regenerar con IA' : 'Generar con IA'}
                      </button>
                      {editingFeedback[q.id] !== undefined && editingFeedback[q.id] !== q.explanation && (
                        <button
                          onClick={() => handleSaveFeedback(q.id)}
                          className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 hover:bg-green-200"
                        >
                          Guardar
                        </button>
                      )}
                    </div>
                  </div>
                  {generatingFeedback[q.id] ? (
                    <div className="flex items-center gap-2 py-2">
                      <LoadingSpinner size="sm" className="text-blue-600" />
                      <span className="text-sm text-blue-600">Generando feedback con IA...</span>
                    </div>
                  ) : (
                    <textarea
                      value={editingFeedback[q.id] !== undefined ? editingFeedback[q.id] : (q.explanation || '')}
                      onChange={(e) => setEditingFeedback(prev => ({ ...prev, [q.id]: e.target.value }))}
                      rows={4}
                      className="w-full rounded border border-blue-200 bg-white px-3 py-2 text-sm text-blue-900 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                      placeholder="Sin feedback. Genera uno con IA o escríbelo manualmente..."
                    />
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showEditor}
        onClose={() => setShowEditor(false)}
        title="Crear Pregunta"
        className="max-w-3xl"
      >
        <QuestionEditor
          onSave={handleCreate}
          onCancel={() => setShowEditor(false)}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingQuestion}
        onClose={() => setEditingQuestion(null)}
        title="Editar Pregunta"
        className="max-w-3xl"
      >
        {editingQuestion && (
          <QuestionEditor
            initialData={editingQuestion}
            onSave={handleUpdate}
            onCancel={() => setEditingQuestion(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar pregunta"
        message="¿Estás seguro de que deseas eliminar esta pregunta? Esta acción no se puede deshacer."
        loading={deleting}
      />

      <ConfirmDialog
        isOpen={showDeleteAll}
        onClose={() => setShowDeleteAll(false)}
        onConfirm={handleDeleteAll}
        title="Borrar TODAS las preguntas"
        message={`¿Estás seguro de que deseas eliminar las ${questions.length} preguntas del banco? Esta acción no se puede deshacer.`}
        loading={deletingAll}
      />
    </PageLayout>
  )
}
