import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
  type ExamFilters,
  type CreateExamData,
  type UpdateExamData,
} from '../services/examService'
import toast from 'react-hot-toast'

export function useExams(filters?: ExamFilters) {
  return useQuery({
    queryKey: ['exams', filters],
    queryFn: () => getExams(filters),
  })
}

export function useExam(id: string | undefined) {
  return useQuery({
    queryKey: ['exam', id],
    queryFn: () => getExamById(id!),
    enabled: !!id,
  })
}

export function useCreateExam() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateExamData) => createExam(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] })
      toast.success('Examen creado exitosamente')
    },
    onError: (error: Error) => {
      toast.error(`Error al crear examen: ${error.message}`)
    },
  })
}

export function useUpdateExam() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExamData }) => updateExam(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['exams'] })
      queryClient.invalidateQueries({ queryKey: ['exam', id] })
      toast.success('Examen actualizado')
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar: ${error.message}`)
    },
  })
}

export function useDeleteExam() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteExam(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] })
      toast.success('Examen eliminado')
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar: ${error.message}`)
    },
  })
}
