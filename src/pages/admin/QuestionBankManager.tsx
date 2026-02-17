import { useState, useEffect } from 'react'
import { PageLayout } from '../../components/layout/PageLayout'
import { Card } from '../../components/common/Card'
import { Button } from '../../components/common/Button'
import { Modal } from '../../components/common/Modal'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { QuestionEditor } from '../../components/admin/QuestionEditor'
import { QuestionFilters } from '../../components/admin/QuestionFilters'
import {
  getAllQuestions,
  createQuestionManual,
  updateQuestion,
  deleteQuestion,
  type CreateQuestionData,
} from '../../services/adminService'
import type { QuestionBankItem } from '../../types/question'
import toast from 'react-hot-toast'

const typeLabels: Record<string, string> = {
  multiple_choice: 'Opción Múltiple',
  open_ended: 'Respuesta Abierta',
  fill_blank: 'Rellenar Espacios',
  matching: 'Emparejar',
}

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

  return (
    <PageLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Banco de Preguntas</h1>
          <p className="mt-1 text-secondary-500">
            {questions.length} pregunta{questions.length !== 1 ? 's' : ''} en total
          </p>
        </div>
        <Button onClick={() => setShowEditor(true)}>
          Crear Pregunta
        </Button>
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
                  </div>
                  <p className="text-sm text-secondary-800 line-clamp-2">{q.question_text}</p>
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
    </PageLayout>
  )
}
