import { Link } from 'react-router-dom'
import { Card } from '../common/Card'
import { Badge } from '../common/Badge'
import { Button } from '../common/Button'
import { formatDate } from '../../lib/utils'
import type { Exam } from '../../types/exam'

interface ExamCardProps {
  exam: Exam
  isTeacher?: boolean
  onDelete?: (id: string) => void
  onPublish?: (id: string) => void
  onArchive?: (id: string) => void
}

export function ExamCard({ exam, isTeacher, onDelete, onPublish, onArchive }: ExamCardProps) {
  return (
    <Card className="flex flex-col justify-between">
      <div>
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="font-semibold text-secondary-900 line-clamp-2">
            {exam.title}
          </h3>
          <Badge status={exam.status} />
        </div>

        {exam.description && (
          <p className="mb-3 text-sm text-secondary-500 line-clamp-2">
            {exam.description}
          </p>
        )}

        <div className="flex items-center gap-4 text-xs text-secondary-400">
          <span>{exam.question_count} preguntas</span>
          {exam.time_limit && <span>{exam.time_limit} min</span>}
          <span>{formatDate(exam.created_at)}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-secondary-100 pt-4">
        {isTeacher ? (
          <>
            <Link to={`/exams/${exam.id}/edit`}>
              <Button variant="secondary" size="sm">
                Editar
              </Button>
            </Link>
            {exam.status === 'draft' && onPublish && (
              <Button variant="primary" size="sm" onClick={() => onPublish(exam.id)}>
                Publicar
              </Button>
            )}
            {exam.status === 'published' && onArchive && (
              <Button variant="secondary" size="sm" onClick={() => onArchive(exam.id)}>
                Archivar
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="sm" onClick={() => onDelete(exam.id)}>
                Eliminar
              </Button>
            )}
          </>
        ) : (
          <Link to={`/exams/${exam.id}`}>
            <Button size="sm">Ver examen</Button>
          </Link>
        )}
      </div>
    </Card>
  )
}
