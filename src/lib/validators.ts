import { z } from 'zod'

// Exam form schema
export const examFormSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio').max(200, 'Máximo 200 caracteres'),
  description: z.string().max(1000, 'Máximo 1000 caracteres').optional().or(z.literal('')),
  is_public: z.boolean().default(true),
  time_limit: z
    .union([
      z.number().min(1, 'Mínimo 1 minuto').max(480, 'Máximo 480 minutos'),
      z.nan(),
      z.literal(''),
    ])
    .transform((val) => (typeof val === 'number' && !isNaN(val) ? val : null))
    .nullable()
    .optional(),
  randomize_order: z.boolean().default(false),
  show_correct_answers: z.boolean().default(true),
  show_feedback: z.boolean().default(true),
  publish_immediately: z.boolean().default(false),
})

export type ExamFormValues = z.output<typeof examFormSchema>

// Question base fields
const questionBase = z.object({
  points: z.number().min(1, 'Mínimo 1 punto').max(100, 'Máximo 100 puntos').default(10),
  explanation: z.string().max(500, 'Máximo 500 caracteres').optional().or(z.literal('')),
})

// Multiple choice schema
export const multipleChoiceSchema = questionBase.extend({
  question_text: z.string().min(1, 'La pregunta es obligatoria'),
  options: z
    .array(z.string().min(1, 'La opción no puede estar vacía'))
    .min(2, 'Mínimo 2 opciones')
    .max(6, 'Máximo 6 opciones'),
  correct_answer: z.union([
    z.number().min(0),
    z.array(z.number().min(0)).min(1, 'Selecciona al menos una respuesta correcta'),
  ]),
})

export type MultipleChoiceValues = z.infer<typeof multipleChoiceSchema>

// Open ended schema
export const openEndedSchema = questionBase.extend({
  question_text: z.string().min(1, 'La pregunta es obligatoria'),
  correct_answer: z.string().min(1, 'La respuesta modelo es obligatoria'),
})

export type OpenEndedValues = z.infer<typeof openEndedSchema>

// Fill blank schema — uses {value: string} objects to match react-hook-form useFieldArray
export const fillBlankSchema = questionBase.extend({
  question_text: z
    .string()
    .min(1, 'La pregunta es obligatoria')
    .refine((text) => text.includes('___'), {
      message: 'La pregunta debe contener al menos un espacio en blanco (___)',
    }),
  correct_answer: z
    .array(z.object({ value: z.string().min(1, 'La respuesta no puede estar vacía') }))
    .min(1, 'Debe haber al menos una respuesta'),
})

export type FillBlankValues = z.infer<typeof fillBlankSchema>

// Matching schema
export const matchingSchema = questionBase.extend({
  question_text: z.string().min(1, 'La pregunta es obligatoria'),
  terms: z
    .array(
      z.object({
        term: z.string().min(1, 'El término no puede estar vacío'),
        definition: z.string().min(1, 'La definición no puede estar vacía'),
      })
    )
    .min(2, 'Mínimo 2 pares de términos'),
})

export type MatchingValues = z.infer<typeof matchingSchema>
