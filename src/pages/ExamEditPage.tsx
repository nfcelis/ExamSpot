import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PageLayout } from '../components/layout/PageLayout'
import { Card } from '../components/common/Card'
import { Button } from '../components/common/Button'
import { Badge } from '../components/common/Badge'
import { Modal } from '../components/common/Modal'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import { SafeHtml } from '../components/common/SafeHtml'
import { ExamForm } from '../components/exam/ExamForm'
import { MaterialUpload } from '../components/teacher/MaterialUpload'
import { QuestionBankBrowser } from '../components/teacher/QuestionBankBrowser'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { useExam, useUpdateExam, useDeleteExam } from '../hooks/useExams'
import type { ExamFormValues } from '../lib/validators'
import {
  getExamQuestions,
  getExamQuestionIds,
  addMultipleQuestionsToExam,
  removeQuestionFromExam,
} from '../services/examService'
import type { QuestionBankItem } from '../types/question'
import toast from 'react-hot-toast'

const typeLabels: Record<string, string> = {
  multiple_choice: 'Opción Múltiple',
  open_ended: 'Respuesta Abierta',
  fill_blank: 'Rellenar Espacios',
  matching: 'Emparejar',
}

export function ExamEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showBankModal, setShowBankModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [examQuestions, setExamQuestions] = useState<QuestionBankItem[]>([])
  const [examQuestionIds, setExamQuestionIds] = useState<string[]>([])
  const [questionsLoading, setQuestionsLoading] = useState(true)
  const [addingQuestions, setAddingQuestions] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [localShowCorrectAnswers, setLocalShowCorrectAnswers] = useState(true)
  const [localShowFeedback, setLocalShowFeedback] = useState(true)

  const { data: exam, isLoading: examLoading } = useExam(id)
  const updateExam = useUpdateExam()
  const deleteExam = useDeleteExam()

  const loadQuestions = useCallback(async () => {
    if (!id) return
    setQuestionsLoading(true)
    try {
      const [questions, ids] = await Promise.all([
        getExamQuestions(id),
        getExamQuestionIds(id),
      ])
      setExamQuestions(questions)
      setExamQuestionIds(ids)
    } catch (err) {
      console.error('Error loading exam questions:', err)
    } finally {
      setQuestionsLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadQuestions()
  }, [loadQuestions])

  useEffect(() => {
    if (exam) {
      setLocalShowCorrectAnswers(exam.show_correct_answers ?? true)
      setLocalShowFeedback(exam.show_feedback ?? true)
    }
  }, [exam])

  if (examLoading) {
    return (
      <PageLayout>
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" className="text-primary-600" />
        </div>
      </PageLayout>
    )
  }

  if (!exam) {
    return (
      <PageLayout>
        <p className="py-12 text-center text-secondary-500">Examen no encontrado.</p>
      </PageLayout>
    )
  }

  const handlePublish = () => {
    updateExam.mutate({ id: exam.id, data: { status: 'published' } })
  }

  const handleArchive = () => {
    updateExam.mutate({ id: exam.id, data: { status: 'archived' } })
  }

  const handleUnarchive = () => {
    updateExam.mutate({ id: exam.id, data: { status: 'draft' } })
  }

  const handleDelete = () => {
    deleteExam.mutate(exam.id, {
      onSuccess: () => navigate('/dashboard'),
    })
  }

  const handleToggleCorrectAnswers = (checked: boolean) => {
    setLocalShowCorrectAnswers(checked)
    updateExam.mutate({ id: exam!.id, data: { show_correct_answers: checked } })
  }

  const handleToggleFeedback = (checked: boolean) => {
    setLocalShowFeedback(checked)
    updateExam.mutate({ id: exam!.id, data: { show_feedback: checked } })
  }

  const handleSettingsSubmit = (data: ExamFormValues) => {
    updateExam.mutate(
      {
        id: exam.id,
        data: {
          title: data.title,
          description: data.description || undefined,
          is_public: data.is_public,
          time_limit: data.time_limit,
          randomize_order: data.randomize_order,
          show_correct_answers: data.show_correct_answers,
          show_feedback: data.show_feedback,
        },
      },
      { onSuccess: () => setShowSettingsModal(false) }
    )
  }

  const handleAddFromBank = async (bankQuestions: QuestionBankItem[]) => {
    setAddingQuestions(true)
    try {
      const newIds = bankQuestions.map(q => q.id)
      await addMultipleQuestionsToExam(exam.id, newIds)
      toast.success(`${bankQuestions.length} pregunta${bankQuestions.length !== 1 ? 's' : ''} agregada${bankQuestions.length !== 1 ? 's' : ''}`)
      setShowBankModal(false)
      loadQuestions()
    } catch (err) {
      toast.error('Error al agregar preguntas')
      console.error(err)
    } finally {
      setAddingQuestions(false)
    }
  }

  const handleRemoveQuestion = async (questionBankId: string) => {
    setRemovingId(questionBankId)
    try {
      await removeQuestionFromExam(exam.id, questionBankId)
      toast.success('Pregunta removida del examen')
      loadQuestions()
    } catch (err) {
      toast.error('Error al remover pregunta')
      console.error(err)
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <PageLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Exam Header */}
        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-secondary-900">{exam.title}</h1>
                <Badge status={exam.status} />
              </div>
              {exam.description && (
                <p className="mt-1 text-sm text-secondary-500">{exam.description}</p>
              )}
              <p className="mt-2 text-xs text-secondary-400">
                {examQuestions.length} preguntas
                {exam.time_limit ? ` · ${exam.time_limit} min` : ''}
                {exam.is_public ? ' · Público' : ' · Privado'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {exam.status === 'draft' && (
                <Button onClick={handlePublish} loading={updateExam.isPending}>
                  Publicar
                </Button>
              )}
              {exam.status === 'published' && (
                <Button variant="secondary" onClick={handleArchive} loading={updateExam.isPending}>
                  Archivar
                </Button>
              )}
              {exam.status === 'archived' && (
                <>
                  <Button variant="secondary" onClick={handleUnarchive} loading={updateExam.isPending}>
                    Restaurar
                  </Button>
                  <Button onClick={handlePublish} loading={updateExam.isPending}>
                    Publicar
                  </Button>
                </>
              )}
              <Button variant="secondary" onClick={() => setShowSettingsModal(true)}>
                Configuración
              </Button>
              <Button variant="danger" onClick={() => setShowDeleteDialog(true)}>
                Eliminar
              </Button>
            </div>
          </div>
        </Card>

        {/* Results Settings */}
        <Card>
          <h3 className="mb-1 font-semibold text-secondary-900">Resultados para estudiantes</h3>
          <p className="mb-4 text-sm text-secondary-500">
            Controla qué información ven los estudiantes al finalizar el examen.
          </p>
          <div className="space-y-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={localShowCorrectAnswers}
                onChange={(e) => handleToggleCorrectAnswers(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
              />
              <div>
                <p className="text-sm font-medium text-secondary-700">Mostrar respuestas correctas</p>
                <p className="text-xs text-secondary-400">
                  El estudiante verá cuál era la respuesta correcta en cada pregunta
                </p>
              </div>
            </label>
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={localShowFeedback}
                onChange={(e) => handleToggleFeedback(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
              />
              <div>
                <p className="text-sm font-medium text-secondary-700">Mostrar feedback de IA</p>
                <p className="text-xs text-secondary-400">
                  El estudiante verá la retroalimentación y análisis generado por IA
                </p>
              </div>
            </label>
          </div>
        </Card>

        {/* Material Section */}
        <MaterialUpload examId={exam.id} />

        {/* Questions Section */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-secondary-900">
              Preguntas del Examen
            </h2>
            <Button onClick={() => setShowBankModal(true)}>
              <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Agregar del Banco
            </Button>
          </div>

          {questionsLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" className="text-primary-600" />
            </div>
          ) : examQuestions.length === 0 ? (
            <Card className="py-12 text-center">
              <svg className="mx-auto h-12 w-12 text-secondary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-secondary-900">Sin preguntas</h3>
              <p className="mt-1 text-sm text-secondary-500">
                Agrega preguntas del banco aprobado para este examen.
              </p>
              <Button onClick={() => setShowBankModal(true)} className="mt-4">
                Agregar del Banco
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {examQuestions.map((q, index) => (
                <Card key={q.id} className="transition-all hover:shadow-md">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-secondary-400">
                          #{index + 1}
                        </span>
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                          {typeLabels[q.type] || q.type}
                        </span>
                        <span className="text-xs text-secondary-400">
                          {q.points} pts
                        </span>
                        {q.category && (
                          <span className="text-xs text-secondary-400">
                            {q.category}
                          </span>
                        )}
                        {q.difficulty && (
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            q.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                            q.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {q.difficulty === 'easy' ? 'Fácil' : q.difficulty === 'medium' ? 'Medio' : 'Difícil'}
                          </span>
                        )}
                      </div>
                      <SafeHtml html={q.question_text} className="text-sm font-medium text-secondary-800" />

                      {/* Multiple choice — opción correcta en verde */}
                      {q.type === 'multiple_choice' && q.options && (
                        <div className="mt-2 space-y-1">
                          {q.options.map((opt, idx) => {
                            const isCorrect = Array.isArray(q.correct_answer)
                              ? (q.correct_answer as number[]).includes(idx)
                              : idx === (q.correct_answer as number)
                            return (
                              <div key={idx} className={`rounded px-2 py-0.5 text-xs ${
                                isCorrect
                                  ? 'bg-green-50 font-medium text-green-700'
                                  : 'text-secondary-500'
                              }`}>
                                {String.fromCharCode(65 + idx)}. <SafeHtml html={opt} inline />
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Respuesta abierta — muestra respuesta modelo */}
                      {q.type === 'open_ended' && Boolean(q.correct_answer) && (
                        <div className="mt-2 rounded bg-green-50 px-2 py-1.5 text-xs text-green-700">
                          <span className="font-medium">Respuesta modelo: </span>
                          {Array.isArray(q.correct_answer)
                            ? (q.correct_answer as string[]).map((a, i) => (
                                <span key={i}>{i > 0 && <span className="mx-1">·</span>}<SafeHtml html={a} inline /></span>
                              ))
                            : <SafeHtml html={q.correct_answer as string} inline />}
                        </div>
                      )}

                      {/* Rellenar espacios — muestra las respuestas correctas */}
                      {q.type === 'fill_blank' && Array.isArray(q.correct_answer) && (
                        <div className="mt-2 rounded bg-green-50 px-2 py-1.5 text-xs text-green-700">
                          <span className="font-medium">Respuestas: </span>
                          {(q.correct_answer as string[]).map((a, i) => (
                            <span key={i}>{i > 0 && <span className="mx-1">·</span>}<SafeHtml html={a} inline /></span>
                          ))}
                        </div>
                      )}

                      {/* Emparejar — muestra los pares término → definición */}
                      {q.type === 'matching' && q.terms && (
                        <div className="mt-2 space-y-1">
                          {q.terms.map((pair, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-xs">
                              <SafeHtml html={pair.term} className="rounded bg-secondary-100 px-1.5 py-0.5 text-secondary-700" inline />
                              <span className="text-secondary-400">→</span>
                              <SafeHtml html={pair.definition} className="text-green-700" inline />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveQuestion(q.id)}
                      loading={removingId === q.id}
                    >
                      Quitar
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      <Modal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title="Configuración del examen"
      >
        <ExamForm
          exam={exam}
          defaultValues={{
            title: exam.title,
            description: exam.description ?? '',
            is_public: exam.is_public,
            time_limit: exam.time_limit,
            randomize_order: exam.randomize_order,
            show_correct_answers: exam.show_correct_answers ?? true,
            show_feedback: exam.show_feedback ?? true,
          }}
          onSubmit={handleSettingsSubmit}
          loading={updateExam.isPending}
          showPublishOption={false}
        />
      </Modal>

      {/* Question Bank Browser Modal */}
      <Modal
        isOpen={showBankModal}
        onClose={() => setShowBankModal(false)}
        title="Agregar preguntas del banco"
        className="max-w-3xl"
      >
        <QuestionBankBrowser
          onAddQuestions={handleAddFromBank}
          loading={addingQuestions}
          excludeIds={examQuestionIds}
        />
      </Modal>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Eliminar examen"
        message="¿Estás seguro de que deseas eliminar este examen? Esta acción no se puede deshacer."
        loading={deleteExam.isPending}
      />
    </PageLayout>
  )
}
