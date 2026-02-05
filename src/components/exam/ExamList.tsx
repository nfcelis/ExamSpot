import { ExamCard } from './ExamCard'
import { LoadingSpinner } from '../common/LoadingSpinner'
import type { Exam } from '../../types/exam'

interface ExamListProps {
  exams: Exam[]
  loading?: boolean
  isTeacher?: boolean
  onDelete?: (id: string) => void
  onPublish?: (id: string) => void
  onArchive?: (id: string) => void
  emptyMessage?: string
}

export function ExamList({
  exams,
  loading,
  isTeacher,
  onDelete,
  onPublish,
  onArchive,
  emptyMessage = 'No hay exámenes disponibles.',
}: ExamListProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" className="text-primary-600" />
      </div>
    )
  }

  if (exams.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-secondary-500">
        {emptyMessage}
      </p>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {exams.map((exam) => (
        <ExamCard
          key={exam.id}
          exam={exam}
          isTeacher={isTeacher}
          onDelete={onDelete}
          onPublish={onPublish}
          onArchive={onArchive}
        />
      ))}
    </div>
  )
}
