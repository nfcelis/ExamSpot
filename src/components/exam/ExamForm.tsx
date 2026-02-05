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
  showPublishOption?: boolean
}

export function ExamForm({ defaultValues, onSubmit, loading, exam, showPublishOption = true }: ExamFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(examFormSchema),
    defaultValues: {
      title: '',
      description: '',
      is_public: true,
      time_limit: null as number | null,
      randomize_order: false,
      publish_immediately: false,
      ...defaultValues,
    },
  })

  const timeLimit = watch('time_limit')
  const hasTimeLimit = timeLimit !== null && timeLimit !== undefined && timeLimit !== ''

  const handleTimeLimitToggle = (checked: boolean) => {
    if (checked) {
      setValue('time_limit', 30) // Default to 30 minutes
    } else {
      setValue('time_limit', null)
    }
  }

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

      {/* Time Limit */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="hasTimeLimit"
            className="h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
            checked={hasTimeLimit}
            onChange={(e) => handleTimeLimitToggle(e.target.checked)}
          />
          <label htmlFor="hasTimeLimit" className="text-sm font-medium text-secondary-700">
            Límite de tiempo
          </label>
        </div>
        {hasTimeLimit && (
          <div className="ml-7">
            <Input
              id="time_limit"
              type="number"
              placeholder="Minutos"
              min={1}
              max={480}
              error={errors.time_limit?.message}
              {...register('time_limit', { valueAsNumber: true })}
            />
            <p className="mt-1 text-xs text-secondary-500">
              Entre 1 y 480 minutos (8 horas)
            </p>
          </div>
        )}
      </div>

      {/* Publish Option - Only show when creating a new exam */}
      {showPublishOption && !exam && (
        <div className="rounded-lg border border-primary-200 bg-primary-50 p-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="publish_immediately"
              className="h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
              {...register('publish_immediately')}
            />
            <div>
              <label htmlFor="publish_immediately" className="text-sm font-medium text-primary-800">
                Publicar inmediatamente
              </label>
              <p className="text-xs text-primary-600">
                Si no se marca, el examen se guardará como borrador
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Button type="submit" loading={loading}>
          {exam ? 'Guardar cambios' : 'Crear examen'}
        </Button>
      </div>
    </form>
  )
}
