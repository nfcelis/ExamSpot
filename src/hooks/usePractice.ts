import { useQuery, useMutation } from '@tanstack/react-query'
import { getPracticeCategories, createPracticeExam } from '../services/practiceService'
import toast from 'react-hot-toast'

export function usePracticeCategories() {
  return useQuery({
    queryKey: ['practiceCategories'],
    queryFn: getPracticeCategories,
  })
}

export function useCreatePracticeExam() {
  return useMutation({
    mutationFn: ({ category, numQuestions }: { category: string; numQuestions: number }) =>
      createPracticeExam(category, numQuestions),
    onError: (error: Error) => {
      toast.error(`Error al crear práctica: ${error.message}`)
    },
  })
}
