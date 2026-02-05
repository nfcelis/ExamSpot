import { useFieldArray, useFormContext } from 'react-hook-form'
import { Input } from '../../common/Input'
import { Button } from '../../common/Button'

export function MultipleChoiceForm() {
  const {
    register,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext()

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'options',
  })

  const correctAnswer = watch('correct_answer')

  const handleCorrectToggle = (index: number) => {
    if (typeof correctAnswer === 'number') {
      setValue('correct_answer', index)
    } else {
      setValue('correct_answer', index)
    }
  }

  return (
    <div className="space-y-4">
      <Input
        id="question_text"
        label="Pregunta"
        placeholder="Escribe la pregunta..."
        error={(errors.question_text as { message?: string })?.message}
        {...register('question_text')}
      />

      <div>
        <label className="mb-2 block text-sm font-medium text-secondary-700">
          Opciones
        </label>
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-2">
              <input
                type="radio"
                name="correctAnswer"
                checked={correctAnswer === index}
                onChange={() => handleCorrectToggle(index)}
                className="h-4 w-4 border-secondary-300 text-primary-600 focus:ring-primary-500"
                title="Marcar como correcta"
              />
              <Input
                placeholder={`Opción ${index + 1}`}
                className="flex-1"
                {...register(`options.${index}`)}
              />
              {fields.length > 2 && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="rounded p-1 text-secondary-400 hover:bg-secondary-100 hover:text-danger-600"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
        {(errors.options as { message?: string })?.message && (
          <p className="mt-1 text-sm text-danger-600">
            {(errors.options as { message?: string }).message}
          </p>
        )}
        {fields.length < 6 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() => append('')}
          >
            + Agregar opción
          </Button>
        )}
      </div>
    </div>
  )
}
