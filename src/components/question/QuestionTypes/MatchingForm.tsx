import { useFieldArray, useFormContext } from 'react-hook-form'
import { Input } from '../../common/Input'
import { Button } from '../../common/Button'

export function MatchingForm() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext()

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'terms',
  })

  return (
    <div className="space-y-4">
      <Input
        id="question_text"
        label="Pregunta"
        placeholder="Empareja cada término con su definición..."
        error={(errors.question_text as { message?: string })?.message}
        {...register('question_text')}
      />

      <div>
        <label className="mb-2 block text-sm font-medium text-secondary-700">
          Pares de términos
        </label>
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-start gap-2">
              <div className="flex-1">
                <Input
                  placeholder={`Término ${index + 1}`}
                  error={(errors.terms as Array<{ term?: { message?: string } }> | undefined)?.[index]?.term?.message}
                  {...register(`terms.${index}.term`)}
                />
              </div>
              <span className="mt-2 text-secondary-400">→</span>
              <div className="flex-1">
                <Input
                  placeholder={`Definición ${index + 1}`}
                  error={(errors.terms as Array<{ definition?: { message?: string } }> | undefined)?.[index]?.definition?.message}
                  {...register(`terms.${index}.definition`)}
                />
              </div>
              {fields.length > 2 && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="mt-2 rounded p-1 text-secondary-400 hover:bg-secondary-100 hover:text-danger-600"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
        {(errors.terms as { message?: string })?.message && (
          <p className="mt-1 text-sm text-danger-600">
            {(errors.terms as { message?: string }).message}
          </p>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-2"
          onClick={() => append({ term: '', definition: '' })}
        >
          + Agregar par
        </Button>
      </div>
    </div>
  )
}
