import { useFormContext, useFieldArray } from 'react-hook-form'
import { useEffect } from 'react'
import { Input } from '../../common/Input'
import { Textarea } from '../../common/Textarea'

export function FillBlankForm() {
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = useFormContext()

  const questionText = watch('question_text') || ''

  const { fields, replace } = useFieldArray({
    control,
    name: 'correct_answer',
  })

  // Auto-detect blanks and adjust answer fields
  useEffect(() => {
    const blankCount = (questionText.match(/___/g) || []).length
    const currentCount = fields.length

    if (blankCount !== currentCount) {
      const newFields = Array.from({ length: blankCount }, (_, i) => ({
        value: (fields[i] as { value?: string })?.value || '',
      }))
      replace(newFields)
    }
  }, [questionText]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-4">
      <Textarea
        id="question_text"
        label="Pregunta (usa ___ para los espacios en blanco)"
        placeholder="La capital de Francia es ___ y su río principal es el ___."
        error={(errors.question_text as { message?: string })?.message}
        {...register('question_text')}
      />

      {fields.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-medium text-secondary-700">
            Respuestas correctas
          </label>
          <div className="space-y-2">
            {fields.map((field, index) => (
              <Input
                key={field.id}
                placeholder={`Respuesta para espacio ${index + 1}`}
                error={(errors.correct_answer as Array<{ value?: { message?: string } }> | undefined)?.[index]?.value?.message}
                {...register(`correct_answer.${index}.value`)}
              />
            ))}
          </div>
        </div>
      )}

      {fields.length === 0 && questionText && (
        <p className="text-xs text-secondary-400">
          Agrega ___ en la pregunta para crear espacios en blanco.
        </p>
      )}
    </div>
  )
}
