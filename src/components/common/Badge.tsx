import { cn } from '../../lib/utils'
import type { ExamStatus } from '../../types/exam'

interface BadgeProps {
  status: ExamStatus
  className?: string
}

const statusConfig: Record<ExamStatus, { label: string; classes: string }> = {
  draft: {
    label: 'Borrador',
    classes: 'bg-secondary-100 text-secondary-700',
  },
  published: {
    label: 'Publicado',
    classes: 'bg-green-100 text-green-700',
  },
  archived: {
    label: 'Archivado',
    classes: 'bg-yellow-100 text-yellow-700',
  },
}

export function Badge({ status, className }: BadgeProps) {
  const config = statusConfig[status]

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.classes,
        className
      )}
    >
      {config.label}
    </span>
  )
}
