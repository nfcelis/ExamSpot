import { useFormContext } from 'react-hook-form'
import { Input } from '../../common/Input'
import { Textarea } from '../../common/Textarea'

export function OpenEndedForm() {
  const {
    register,
    formState: { errors },
  } = useFormContext()

  return (
    <div className="space-y-4">
      <Input
        id="question_text"
        label="Pregunta"
        placeholder="Escribe la pregunta..."
        error={(errors.question_text as { message?: string })?.message}
        {...register('question_text')}
      />

      <Textarea
        id="correct_answer"
        label="Respuesta modelo"
        placeholder="Escribe la respuesta modelo que servirá de referencia para la calificación con IA..."
        rows={6}
        error={(errors.correct_answer as { message?: string })?.message}
        {...register('correct_answer')}
      />

      <p className="text-xs text-secondary-400">
        La IA usará esta respuesta como referencia para evaluar las respuestas de los estudiantes.
      </p>
    </div>
  )
}
