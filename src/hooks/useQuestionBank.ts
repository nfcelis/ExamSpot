import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getQuestionBank,
  getQuestionBankItem,
  createQuestionBankItem,
  updateQuestionBankItem,
  deleteQuestionBankItem,
  getCategories,
  type QuestionBankFilters,
  type CreateQuestionBankData,
  type UpdateQuestionBankData,
} from '../services/questionBankService'
import { importQuestionsFromJSON, type ImportResult } from '../services/importService'
import toast from 'react-hot-toast'

export function useQuestionBank(filters?: QuestionBankFilters) {
  return useQuery({
    queryKey: ['questionBank', filters],
    queryFn: () => getQuestionBank(filters),
  })
}

export function useQuestionBankItem(id: string | undefined) {
  return useQuery({
    queryKey: ['questionBankItem', id],
    queryFn: () => getQuestionBankItem(id!),
    enabled: !!id,
  })
}

export function useCategories() {
  return useQuery({
    queryKey: ['questionBankCategories'],
    queryFn: getCategories,
  })
}

export function useCreateQuestionBankItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateQuestionBankData) => createQuestionBankItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questionBank'] })
      queryClient.invalidateQueries({ queryKey: ['questionBankCategories'] })
      toast.success('Pregunta guardada en el banco')
    },
    onError: (error: Error) => {
      toast.error(`Error al guardar: ${error.message}`)
    },
  })
}

export function useUpdateQuestionBankItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateQuestionBankData }) =>
      updateQuestionBankItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questionBank'] })
      queryClient.invalidateQueries({ queryKey: ['questionBankItem'] })
      toast.success('Pregunta actualizada')
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar: ${error.message}`)
    },
  })
}

export function useDeleteQuestionBankItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteQuestionBankItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questionBank'] })
      toast.success('Pregunta eliminada del banco')
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar: ${error.message}`)
    },
  })
}

export function useImportQuestions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ questions, section }: { questions: unknown[]; section?: string }) =>
      importQuestionsFromJSON(questions as any[], section),
    onSuccess: (result: ImportResult) => {
      queryClient.invalidateQueries({ queryKey: ['questionBank'] })
      queryClient.invalidateQueries({ queryKey: ['questionBankCategories'] })
      if (result.imported > 0) {
        toast.success(`${result.imported} preguntas importadas`)
      }
      if (result.duplicates > 0) {
        toast(`${result.duplicates} duplicadas (ya existían)`, { icon: '⚠️' })
      }
      if (result.skipped > 0) {
        toast.error(`${result.skipped} fallaron: ${result.errors[0] || 'error desconocido'}`)
        console.error('Import errors:', result.errors)
      }
    },
    onError: (error: Error) => {
      toast.error(`Error al importar: ${error.message}`)
    },
  })
}
