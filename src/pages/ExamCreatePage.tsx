import { useNavigate } from 'react-router-dom'
import { PageLayout } from '../components/layout/PageLayout'
import { Card } from '../components/common/Card'
import { ExamForm } from '../components/exam/ExamForm'
import { useCreateExam } from '../hooks/useExams'
import type { ExamFormValues } from '../lib/validators'

export function ExamCreatePage() {
  const navigate = useNavigate()
  const createExam = useCreateExam()

  const handleSubmit = (data: ExamFormValues) => {
    createExam.mutate(
      {
        title: data.title,
        description: data.description || undefined,
        is_public: data.is_public,
        time_limit: data.time_limit,
        randomize_order: data.randomize_order,
      },
      {
        onSuccess: (exam) => {
          navigate(`/exams/${exam.id}/edit`)
        },
      }
    )
  }

  return (
    <PageLayout>
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold text-secondary-900">
          Crear nuevo examen
        </h1>
        <Card>
          <ExamForm onSubmit={handleSubmit} loading={createExam.isPending} />
        </Card>
      </div>
    </PageLayout>
  )
}
