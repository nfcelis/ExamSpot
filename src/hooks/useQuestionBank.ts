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
