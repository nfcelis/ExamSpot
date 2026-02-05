import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getQuestionsByExamId,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
  type CreateQuestionData,
  type UpdateQuestionData,
} from '../services/questionService'
import toast from 'react-hot-toast'

export function useQuestions(examId: string | undefined) {
  return useQuery({
    queryKey: ['questions', examId],
    queryFn: () => getQuestionsByExamId(examId!),
    enabled: !!examId,
  })
}

export function useCreateQuestion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateQuestionData) => createQuestion(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['questions', variables.exam_id] })
      toast.success('Pregunta creada')
    },
    onError: (error: Error) => {
      toast.error(`Error al crear pregunta: ${error.message}`)
    },
  })
}

export function useUpdateQuestion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; examId: string; data: UpdateQuestionData }) =>
      updateQuestion(id, data),
    onSuccess: (_, { examId }) => {
      queryClient.invalidateQueries({ queryKey: ['questions', examId] })
      toast.success('Pregunta actualizada')
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar pregunta: ${error.message}`)
    },
  })
}

export function useDeleteQuestion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id }: { id: string; examId: string }) => deleteQuestion(id),
    onSuccess: (_, { examId }) => {
      queryClient.invalidateQueries({ queryKey: ['questions', examId] })
      toast.success('Pregunta eliminada')
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar pregunta: ${error.message}`)
    },
  })
}

export function useReorderQuestions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ examId, orderedIds }: { examId: string; orderedIds: string[] }) =>
      reorderQuestions(examId, orderedIds),
    onSuccess: (_, { examId }) => {
      queryClient.invalidateQueries({ queryKey: ['questions', examId] })
    },
  })
}
