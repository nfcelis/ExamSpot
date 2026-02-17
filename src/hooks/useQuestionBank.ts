import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getQuestionBank,
  getQuestionBankItem,
  getCategories,
  type QuestionBankFilters,
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
