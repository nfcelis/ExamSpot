import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createAttempt,
  getAttemptById,
  getAttemptsByExam,
  getMyAttempts,
  saveAnswer,
  getAnswersByAttempt,
  completeAttempt,
} from '../services/attemptService'
import { gradeExam } from '../services/gradingService'
import type { Question } from '../types/question'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export function useAttempt(attemptId: string | undefined) {
  return useQuery({
    queryKey: ['attempt', attemptId],
    queryFn: () => getAttemptById(attemptId!),
    enabled: !!attemptId,
  })
}

export function useAttemptAnswers(attemptId: string | undefined) {
  return useQuery({
    queryKey: ['attemptAnswers', attemptId],
    queryFn: () => getAnswersByAttempt(attemptId!),
    enabled: !!attemptId,
  })
}

export function useMyAttempts() {
  const user = useAuthStore((s) => s.user)

  return useQuery({
    queryKey: ['myAttempts', user?.id],
    queryFn: () => getMyAttempts(user!.id),
    enabled: !!user?.id,
  })
}

export function useExamAttempts(examId: string | undefined) {
  return useQuery({
    queryKey: ['examAttempts', examId],
    queryFn: () => getAttemptsByExam(examId!),
    enabled: !!examId,
  })
}

export function useCreateAttempt() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ examId, userId, isPractice = false }: { examId: string; userId: string; isPractice?: boolean }) =>
      createAttempt(examId, userId, isPractice),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAttempts'] })
    },
    onError: (error: Error) => {
      toast.error(`Error al iniciar examen: ${error.message}`)
    },
  })
}

export function useSaveAnswer() {
  return useMutation({
    mutationFn: ({
      attemptId,
      questionId,
      answer,
    }: {
      attemptId: string
      questionId: string
      answer: unknown
    }) => saveAnswer(attemptId, questionId, answer),
  })
}

export function useSubmitExam() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      attemptId,
      questions,
      examId,
    }: {
      attemptId: string
      questions: Question[]
      examId?: string
    }) => {
      const answers = await getAnswersByAttempt(attemptId)
      const { totalScore, maxScore } = await gradeExam(questions, answers, examId)
      const attempt = await completeAttempt(attemptId, totalScore, maxScore)
      return attempt
    },
    onSuccess: (_, { attemptId }) => {
      queryClient.invalidateQueries({ queryKey: ['attempt', attemptId] })
      queryClient.invalidateQueries({ queryKey: ['attemptAnswers', attemptId] })
      queryClient.invalidateQueries({ queryKey: ['myAttempts'] })
      toast.success('Examen enviado correctamente')
    },
    onError: (error: Error) => {
      toast.error(`Error al enviar examen: ${error.message}`)
    },
  })
}
