import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import {
  multipleChoiceSchema,
  openEndedSchema,
  fillBlankSchema,
  matchingSchema,
} from '../../lib/validators'
import { Select } from '../common/Select'
import { Input } from '../common/Input'
import { Textarea } from '../common/Textarea'
import { Button } from '../common/Button'
import { MultipleChoiceForm } from './QuestionTypes/MultipleChoiceForm'
import { OpenEndedForm } from './QuestionTypes/OpenEndedForm'
import { FillBlankForm } from './QuestionTypes/FillBlankForm'
import { MatchingForm } from './QuestionTypes/MatchingForm'
import type { QuestionType } from '../../types/question'
import type { CreateQuestionData } from '../../services/questionService'

const typeOptions = [
  { value: 'multiple_choice', label: 'Opción múltiple' },
  { value: 'open_ended', label: 'Respuesta abierta' },
  { value: 'fill_blank', label: 'Rellenar espacios' },
  { value: 'matching', label: 'Emparejar' },
]

const schemas = {
  multiple_choice: multipleChoiceSchema,
  open_ended: openEndedSchema,
  fill_blank: fillBlankSchema,
  matching: matchingSchema,
}

const defaultsByType: Record<QuestionType, Record<string, unknown>> = {
  multiple_choice: {
    question_text: '',
    options: ['', ''],
    correct_answer: 0,
    points: 10,
    explanation: '',
  },
  open_ended: {
    question_text: '',
    correct_answer: '',
    points: 10,
    explanation: '',
  },
  fill_blank: {
    question_text: '',
    correct_answer: [],
    points: 10,
    explanation: '',
  },
  matching: {
    question_text: '',
    terms: [
      { term: '', definition: '' },
      { term: '', definition: '' },
    ],
    points: 10,
    explanation: '',
  },
}

interface QuestionFormProps {
  examId: string
  onSubmit: (data: CreateQuestionData) => void
  loading?: boolean
  orderIndex?: number
}

export function QuestionForm({ examId, onSubmit, loading, orderIndex = 0 }: QuestionFormProps) {
  const [questionType, setQuestionType] = useState<QuestionType>('multiple_choice')

  const methods = useForm({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schemas[questionType]) as any,
    defaultValues: defaultsByType[questionType],
  })

  const handleTypeChange = (newType: QuestionType) => {
    setQuestionType(newType)
    methods.reset(defaultsByType[newType] as Record<string, unknown>)
  }

  const handleFormSubmit = (data: Record<string, unknown>) => {
    let questionData: CreateQuestionData

    if (questionType === 'fill_blank') {
      // Extract values from field array format
      const answers = (data.correct_answer as Array<{ value: string }>).map((a) => a.value)
      questionData = {
        exam_id: examId,
        type: questionType,
        question_text: data.question_text as string,
        correct_answer: answers,
        points: data.points as number,
        explanation: (data.explanation as string) || null,
        order_index: orderIndex,
      }
    } else if (questionType === 'matching') {
      questionData = {
        exam_id: examId,
        type: questionType,
        question_text: data.question_text as string,
        terms: data.terms as { term: string; definition: string }[],
        correct_answer: null,
        points: data.points as number,
        explanation: (data.explanation as string) || null,
        order_index: orderIndex,
      }
    } else {
      questionData = {
        exam_id: examId,
        type: questionType,
        question_text: data.question_text as string,
        options: questionType === 'multiple_choice' ? (data.options as string[]) : null,
        correct_answer: data.correct_answer,
        points: data.points as number,
        explanation: (data.explanation as string) || null,
        order_index: orderIndex,
      }
    }

    onSubmit(questionData)
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(handleFormSubmit)} className="space-y-6">
        <Select
          id="questionType"
          label="Tipo de pregunta"
          options={typeOptions}
          value={questionType}
          onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
        />

        {questionType === 'multiple_choice' && <MultipleChoiceForm />}
        {questionType === 'open_ended' && <OpenEndedForm />}
        {questionType === 'fill_blank' && <FillBlankForm />}
        {questionType === 'matching' && <MatchingForm />}

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="points"
            label="Puntos"
            type="number"
            error={methods.formState.errors.points?.message as string | undefined}
            {...methods.register('points', { valueAsNumber: true })}
          />
          <Textarea
            id="explanation"
            label="Explicación (opcional)"
            placeholder="Explica la respuesta correcta..."
            rows={2}
            {...methods.register('explanation')}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" loading={loading}>
            Agregar pregunta
          </Button>
        </div>
      </form>
    </FormProvider>
  )
}
