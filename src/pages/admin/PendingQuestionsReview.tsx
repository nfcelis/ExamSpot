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
  generateFeedbackForQuestion,
  updateQuestionFeedback,
} from '../../services/adminService'
import type { QuestionBankItem } from '../../types/question'
import { QUESTION_TYPE_LABELS } from '../../lib/questionTypeConstants'
import toast from 'react-hot-toast'

const typeLabels = QUESTION_TYPE_LABELS

export function PendingQuestionsReview() {
  const [questions, setQuestions] = useState<QuestionBankItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionBankItem | null>(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [processing, setProcessing] = useState(false)

  // Feedback editing state
  const [editingFeedback, setEditingFeedback] = useState<Record<string, string>>({})
  const [generatingFeedback, setGeneratingFeedback] = useState<Record<string, boolean>>({})
  const [feedbackInstructions, setFeedbackInstructions] = useState('')

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
    // If there's edited feedback, save it first
    const editedFeedback = editingFeedback[question.id]
    if (editedFeedback !== undefined && editedFeedback !== question.explanation) {
      try {
        await updateQuestionFeedback(question.id, editedFeedback)
      } catch (err) {
        toast.error('Error al guardar feedback')
        console.error(err)
        return
      }
    }

    setProcessing(true)
    try {
      await approveQuestion(question.id)
      toast.success('Pregunta aprobada')
      setQuestions(prev => prev.filter(q => q.id !== question.id))
      setEditingFeedback(prev => {
        const next = { ...prev }
        delete next[question.id]
        return next
      })
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

  const handleGenerateFeedback = async (questionId: string, instructions?: string) => {
    setGeneratingFeedback(prev => ({ ...prev, [questionId]: true }))
    try {
      const feedback = await generateFeedbackForQuestion(questionId, instructions)
      setEditingFeedback(prev => ({ ...prev, [questionId]: feedback }))
      toast.success('Feedback generado por IA')
    } catch (err) {
      toast.error('Error al generar feedback con IA')
      console.error(err)
    } finally {
      setGeneratingFeedback(prev => ({ ...prev, [questionId]: false }))
    }
  }

  const handleSaveFeedback = async (questionId: string) => {
    const feedback = editingFeedback[questionId]
    if (feedback === undefined) return
    setProcessing(true)
    try {
      const updated = await updateQuestionFeedback(questionId, feedback)
      setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, explanation: updated.explanation } : q))
      toast.success('Feedback guardado')
    } catch (err) {
      toast.error('Error al guardar feedback')
      console.error(err)
    } finally {
      setProcessing(false)
    }
  }

  const handleGenerateWithInstructions = async () => {
    if (!selectedQuestion) return
    await handleGenerateFeedback(selectedQuestion.id, feedbackInstructions || undefined)
    setShowFeedbackModal(false)
    setFeedbackInstructions('')
    setSelectedQuestion(null)
  }

  const getCurrentFeedback = (q: QuestionBankItem) => {
    return editingFeedback[q.id] !== undefined ? editingFeedback[q.id] : (q.explanation || '')
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
              {idx === (q.correct_answer as number) && '\u2713 '}
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
    </div>
  )

  const renderFeedbackSection = (q: QuestionBankItem) => {
    const feedback = getCurrentFeedback(q)
    const isGenerating = generatingFeedback[q.id]
    const isEdited = editingFeedback[q.id] !== undefined && editingFeedback[q.id] !== q.explanation

    return (
      <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50/50 p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold text-blue-700">
            Feedback / Explicación
            {isEdited && <span className="ml-2 text-yellow-600">(modificado, sin guardar)</span>}
          </p>
          <div className="flex gap-1.5">
            <button
              onClick={() => handleGenerateFeedback(q.id)}
              disabled={isGenerating}
              className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 hover:bg-blue-200 disabled:opacity-50"
            >
              {isGenerating ? 'Generando...' : feedback ? 'Regenerar con IA' : 'Generar con IA'}
            </button>
            <button
              onClick={() => {
                setSelectedQuestion(q)
                setShowFeedbackModal(true)
              }}
              disabled={isGenerating}
              className="rounded bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 hover:bg-purple-200 disabled:opacity-50"
            >
              IA con instrucciones
            </button>
            {isEdited && (
              <button
                onClick={() => handleSaveFeedback(q.id)}
                className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 hover:bg-green-200"
              >
                Guardar
              </button>
            )}
          </div>
        </div>
        {isGenerating ? (
          <div className="flex items-center gap-2 py-2">
            <LoadingSpinner size="sm" className="text-blue-600" />
            <span className="text-sm text-blue-600">Generando feedback con IA...</span>
          </div>
        ) : (
          <textarea
            value={feedback}
            onChange={(e) => setEditingFeedback(prev => ({ ...prev, [q.id]: e.target.value }))}
            rows={feedback ? Math.min(6, Math.max(3, feedback.split('\n').length + 1)) : 3}
            className="w-full rounded border border-blue-200 bg-white px-3 py-2 text-sm text-blue-900 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            placeholder="Sin feedback. Genera uno con IA o escríbelo manualmente..."
          />
        )}
      </div>
    )
  }

  return (
    <PageLayout>
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-secondary-900">Preguntas Pendientes</h1>
          <p className="mt-1 text-secondary-500">
            Revisa preguntas, gestiona el feedback y aprueba/rechaza.
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
                {renderFeedbackSection(q)}

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

        {/* Generate Feedback with Instructions Modal */}
        <Modal
          isOpen={showFeedbackModal}
          onClose={() => {
            setShowFeedbackModal(false)
            setSelectedQuestion(null)
            setFeedbackInstructions('')
          }}
          title="Generar Feedback con Instrucciones"
        >
          <div className="space-y-4">
            <p className="text-sm text-secondary-600">
              Indica instrucciones para la IA sobre cómo debe generar o mejorar el feedback.
            </p>
            {selectedQuestion && (
              <div className="rounded-lg bg-secondary-50 p-3">
                <p className="text-xs font-medium text-secondary-500">Pregunta:</p>
                <p className="mt-1 text-sm text-secondary-800">{selectedQuestion.question_text}</p>
              </div>
            )}
            <textarea
              value={feedbackInstructions}
              onChange={(e) => setFeedbackInstructions(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="ej: Incluye un ejemplo práctico, explica la diferencia entre las opciones A y C, hazlo más breve..."
            />
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => {
                setShowFeedbackModal(false)
                setFeedbackInstructions('')
              }}>
                Cancelar
              </Button>
              <Button
                onClick={handleGenerateWithInstructions}
                loading={selectedQuestion ? generatingFeedback[selectedQuestion.id] : false}
              >
                Generar Feedback
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </PageLayout>
  )
}
