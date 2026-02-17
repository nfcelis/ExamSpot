import { useState, useEffect } from 'react'
import { PageLayout } from '../../components/layout/PageLayout'
import { Card } from '../../components/common/Card'
import { Button } from '../../components/common/Button'
import { Modal } from '../../components/common/Modal'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { QuestionEditor } from '../../components/admin/QuestionEditor'
import {
  getPendingQuestions,
  approveQuestion,
  rejectQuestion,
  modifyAndApproveQuestion,
} from '../../services/adminService'
import type { QuestionBankItem } from '../../types/question'
import toast from 'react-hot-toast'

const typeLabels: Record<string, string> = {
  multiple_choice: 'Opción Múltiple',
  open_ended: 'Respuesta Abierta',
  fill_blank: 'Rellenar Espacios',
  matching: 'Emparejar',
}

export function PendingQuestionsReview() {
  const [questions, setQuestions] = useState<QuestionBankItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionBankItem | null>(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [processing, setProcessing] = useState(false)

  const loadPending = async () => {
    setLoading(true)
    try {
      const data = await getPendingQuestions()
      setQuestions(data)
    } catch (err) {
      toast.error('Error al cargar preguntas pendientes')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPending()
  }, [])

  const handleApprove = async (question: QuestionBankItem) => {
    setProcessing(true)
    try {
      await approveQuestion(question.id)
      toast.success('Pregunta aprobada')
      setQuestions(prev => prev.filter(q => q.id !== question.id))
    } catch (err) {
      toast.error('Error al aprobar')
      console.error(err)
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!selectedQuestion || !rejectReason.trim()) return
    setProcessing(true)
    try {
      await rejectQuestion(selectedQuestion.id, rejectReason)
      toast.success('Pregunta rechazada')
      setQuestions(prev => prev.filter(q => q.id !== selectedQuestion.id))
      setShowRejectModal(false)
      setSelectedQuestion(null)
      setRejectReason('')
    } catch (err) {
      toast.error('Error al rechazar')
      console.error(err)
    } finally {
      setProcessing(false)
    }
  }

  const handleModifyAndApprove = async (modifications: Partial<QuestionBankItem>) => {
    if (!selectedQuestion) return
    setProcessing(true)
    try {
      await modifyAndApproveQuestion(selectedQuestion.id, modifications)
      toast.success('Pregunta modificada y aprobada')
      setQuestions(prev => prev.filter(q => q.id !== selectedQuestion.id))
      setShowEditModal(false)
      setSelectedQuestion(null)
    } catch (err) {
      toast.error('Error al modificar')
      console.error(err)
    } finally {
      setProcessing(false)
    }
  }

  const renderQuestionPreview = (q: QuestionBankItem) => (
    <div className="space-y-3">
      <p className="text-sm font-medium text-secondary-800">{q.question_text}</p>

      {q.type === 'multiple_choice' && q.options && (
        <div className="space-y-1">
          {q.options.map((opt, idx) => (
            <div
              key={idx}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                idx === (q.correct_answer as number)
                  ? 'bg-green-50 font-medium text-green-700'
                  : 'bg-secondary-50 text-secondary-600'
              }`}
            >
              {idx === (q.correct_answer as number) && '✓ '}
              {opt}
            </div>
          ))}
        </div>
      )}

      {q.type === 'open_ended' && (
        <div className="rounded-lg bg-green-50 p-3">
          <p className="text-xs font-medium text-green-700">Respuesta modelo:</p>
          <p className="mt-1 text-sm text-green-800">{String(q.correct_answer)}</p>
        </div>
      )}

      {q.type === 'fill_blank' && Array.isArray(q.correct_answer) && (
        <div className="rounded-lg bg-green-50 p-3">
          <p className="text-xs font-medium text-green-700">Respuestas:</p>
          <p className="mt-1 text-sm text-green-800">{(q.correct_answer as string[]).join(', ')}</p>
        </div>
      )}

      {q.type === 'matching' && q.terms && (
        <div className="rounded-lg bg-green-50 p-3">
          <p className="text-xs font-medium text-green-700">Pares:</p>
          {q.terms.map((t, idx) => (
            <p key={idx} className="text-sm text-green-800">{t.term} = {t.definition}</p>
          ))}
        </div>
      )}

      {q.explanation && (
        <div className="rounded-lg bg-blue-50 p-3">
          <p className="text-xs font-medium text-blue-700">Explicación:</p>
          <p className="mt-1 text-sm text-blue-800">{q.explanation}</p>
        </div>
      )}
    </div>
  )

  return (
    <PageLayout>
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-secondary-900">Preguntas Pendientes</h1>
          <p className="mt-1 text-secondary-500">
            Revisa y aprueba/rechaza las preguntas generadas por IA.
            {questions.length > 0 && ` ${questions.length} pendiente${questions.length !== 1 ? 's' : ''}.`}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : questions.length === 0 ? (
          <Card className="py-12 text-center">
            <svg className="mx-auto h-12 w-12 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-secondary-900">Todo revisado</h3>
            <p className="mt-1 text-sm text-secondary-500">No hay preguntas pendientes de revisión.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {questions.map((q) => (
              <Card key={q.id} className="transition-all hover:shadow-md">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-700">
                    Pendiente
                  </span>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                    {typeLabels[q.type]}
                  </span>
                  <span className="text-xs text-secondary-400">
                    {q.category}{q.subcategory ? ` / ${q.subcategory}` : ''}
                  </span>
                  <span className="text-xs text-secondary-400">
                    Dificultad: {q.difficulty === 'easy' ? 'Fácil' : q.difficulty === 'medium' ? 'Medio' : 'Difícil'}
                  </span>
                  {q.source === 'ai_generated' && (
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                      IA
                    </span>
                  )}
                </div>

                {renderQuestionPreview(q)}

                {/* Actions */}
                <div className="mt-4 flex gap-2 border-t border-secondary-100 pt-4">
                  <Button
                    size="sm"
                    onClick={() => handleApprove(q)}
                    loading={processing}
                  >
                    Aprobar
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSelectedQuestion(q)
                      setShowEditModal(true)
                    }}
                  >
                    Editar y Aprobar
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      setSelectedQuestion(q)
                      setShowRejectModal(true)
                    }}
                  >
                    Rechazar
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Reject Modal */}
        <Modal
          isOpen={showRejectModal}
          onClose={() => {
            setShowRejectModal(false)
            setSelectedQuestion(null)
            setRejectReason('')
          }}
          title="Rechazar Pregunta"
        >
          <div className="space-y-4">
            <p className="text-sm text-secondary-600">
              Proporciona una razón para rechazar esta pregunta.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Razón del rechazo..."
            />
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowRejectModal(false)}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={handleReject}
                loading={processing}
                disabled={!rejectReason.trim()}
              >
                Rechazar
              </Button>
            </div>
          </div>
        </Modal>

        {/* Edit & Approve Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setSelectedQuestion(null)
          }}
          title="Editar y Aprobar"
          className="max-w-3xl"
        >
          {selectedQuestion && (
            <QuestionEditor
              initialData={selectedQuestion}
              onSave={handleModifyAndApprove}
              onCancel={() => {
                setShowEditModal(false)
                setSelectedQuestion(null)
              }}
            />
          )}
        </Modal>
      </div>
    </PageLayout>
  )
}
