import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { examFormSchema, type ExamFormValues } from '../../lib/validators'
import { Input } from '../common/Input'
import { Textarea } from '../common/Textarea'
import { Button } from '../common/Button'
import type { Exam } from '../../types/exam'

interface ExamFormProps {
  defaultValues?: Partial<ExamFormValues>
  onSubmit: (data: ExamFormValues) => void
  loading?: boolean
  exam?: Exam
}

export function ExamForm({ defaultValues, onSubmit, loading, exam }: ExamFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(examFormSchema),
    defaultValues: {
      title: '',
      description: '',
      is_public: true,
      time_limit: null as number | null,
      randomize_order: false,
      ...defaultValues,
    },
  })

  const hasTimeLimit = watch('time_limit') !== null && watch('time_limit') !== undefined

  return (
    <form onSubmit={handleSubmit((data) => onSubmit(data as ExamFormValues))} className="space-y-6">
      <Input
        id="title"
        label="Título del examen"
        placeholder="Ej: Parcial de Historia - Tema 3"
        error={errors.title?.message}
        {...register('title')}
      />

      <Textarea
        id="description"
        label="Descripción (opcional)"
        placeholder="Describe el contenido y objetivos del examen..."
        error={errors.description?.message}
        {...register('description')}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="is_public"
            className="h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
            {...register('is_public')}
          />
          <label htmlFor="is_public" className="text-sm font-medium text-secondary-700">
            Examen público
          </label>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="randomize_order"
            className="h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
            {...register('randomize_order')}
          />
          <label htmlFor="randomize_order" className="text-sm font-medium text-secondary-700">
            Aleatorizar orden de preguntas
          </label>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center gap-3">
          <input
            type="checkbox"
            id="hasTimeLimit"
            className="h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
            checked={hasTimeLimit}
            onChange={(e) => {
              if (!e.target.checked) {
                // Clear time limit by setting field value directly
                const event = { target: { name: 'time_limit', value: null } }
                register('time_limit').onChange(event as never)
              }
            }}
            readOnly={hasTimeLimit}
          />
          <label htmlFor="hasTimeLimit" className="text-sm font-medium text-secondary-700">
            Límite de tiempo
          </label>
        </div>
        {hasTimeLimit && (
          <Input
            id="time_limit"
            type="number"
            placeholder="Minutos"
            error={errors.time_limit?.message}
            {...register('time_limit', { valueAsNumber: true })}
          />
        )}
      </div>

      <div className="flex justify-end gap-3">
        <Button type="submit" loading={loading}>
          {exam ? 'Guardar cambios' : 'Crear examen'}
        </Button>
      </div>
    </form>
  )
}
