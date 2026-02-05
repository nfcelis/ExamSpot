import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PageLayout } from '../components/layout/PageLayout'
import { Card } from '../components/common/Card'
import { Button } from '../components/common/Button'
import { Badge } from '../components/common/Badge'
import { Modal } from '../components/common/Modal'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import { QuestionForm } from '../components/question/QuestionForm'
import { QuestionList } from '../components/question/QuestionList'
import { MaterialUpload } from '../components/teacher/MaterialUpload'
import { QuestionGenerator } from '../components/teacher/QuestionGenerator'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { useExam, useUpdateExam, useDeleteExam } from '../hooks/useExams'
import {
  useQuestions,
  useCreateQuestion,
  useCreateQuestionsBatch,
  useDeleteQuestion,
  useReorderQuestions,
} from '../hooks/useQuestions'
import type { CreateQuestionData } from '../services/questionService'
import type { GeneratedQuestion } from '../services/aiService'

export function ExamEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showQuestionModal, setShowQuestionModal] = useState(false)
  const [showGeneratorModal, setShowGeneratorModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const { data: exam, isLoading: examLoading } = useExam(id)
  const { data: questions = [], isLoading: questionsLoading } = useQuestions(id)

  const updateExam = useUpdateExam()
  const deleteExam = useDeleteExam()
  const createQuestion = useCreateQuestion()
  const createQuestionsBatch = useCreateQuestionsBatch()
  const deleteQuestion = useDeleteQuestion()
  const reorderQuestions = useReorderQuestions()

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

  const handleDelete = () => {
    deleteExam.mutate(exam.id, {
      onSuccess: () => navigate('/dashboard'),
    })
  }

  const handleAddQuestion = (data: CreateQuestionData) => {
    createQuestion.mutate(data, {
      onSuccess: () => setShowQuestionModal(false),
    })
  }

  const handleDeleteQuestion = (questionId: string) => {
    deleteQuestion.mutate({ id: questionId, examId: exam.id })
  }

  const handleAddGeneratedQuestions = (generatedQuestions: GeneratedQuestion[]) => {
    const questionsData: CreateQuestionData[] = generatedQuestions.map((q, i) => ({
      exam_id: exam.id,
      type: q.type,
      question_text: q.question_text,
      options: q.options || null,
      correct_answer: q.correct_answer,
      terms: q.terms || null,
      points: q.points || 10,
      explanation: q.explanation || null,
      order_index: questions.length + i,
    }))

    createQuestionsBatch.mutate(questionsData, {
      onSuccess: () => setShowGeneratorModal(false),
    })
  }

  const handleMoveUp = (index: number) => {
    if (index <= 0) return
    const ids = questions.map((q) => q.id)
    ;[ids[index - 1], ids[index]] = [ids[index], ids[index - 1]]
    reorderQuestions.mutate({ examId: exam.id, orderedIds: ids })
  }

  const handleMoveDown = (index: number) => {
    if (index >= questions.length - 1) return
    const ids = questions.map((q) => q.id)
    ;[ids[index], ids[index + 1]] = [ids[index + 1], ids[index]]
    reorderQuestions.mutate({ examId: exam.id, orderedIds: ids })
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
                {questions.length} preguntas
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
              <Button variant="danger" onClick={() => setShowDeleteDialog(true)}>
                Eliminar
              </Button>
            </div>
          </div>
        </Card>

        {/* Material Section */}
        <MaterialUpload examId={exam.id} />

        {/* Questions Section */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-secondary-900">Preguntas</h2>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setShowGeneratorModal(true)}>
                <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generar con IA
              </Button>
              <Button onClick={() => setShowQuestionModal(true)}>
                Agregar pregunta
              </Button>
            </div>
          </div>

          <QuestionList
            questions={questions}
            loading={questionsLoading}
            onDelete={handleDeleteQuestion}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
          />
        </div>
      </div>

      {/* Add Question Modal */}
      <Modal
        isOpen={showQuestionModal}
        onClose={() => setShowQuestionModal(false)}
        title="Agregar pregunta"
        className="max-w-2xl"
      >
        <QuestionForm
          examId={exam.id}
          onSubmit={handleAddQuestion}
          loading={createQuestion.isPending}
          orderIndex={questions.length}
        />
      </Modal>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Eliminar examen"
        message="¿Estás seguro de que deseas eliminar este examen? Se eliminarán también todas las preguntas y los intentos asociados. Esta acción no se puede deshacer."
        loading={deleteExam.isPending}
      />

      {/* AI Question Generator Modal */}
      <Modal
        isOpen={showGeneratorModal}
        onClose={() => setShowGeneratorModal(false)}
        title="Generar preguntas con IA"
        className="max-w-3xl"
      >
        <QuestionGenerator
          onAddQuestions={handleAddGeneratedQuestions}
          loading={createQuestionsBatch.isPending}
        />
      </Modal>
    </PageLayout>
  )
}
