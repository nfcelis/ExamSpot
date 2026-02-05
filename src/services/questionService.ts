import { supabase } from '../lib/supabase'
import type { Question, QuestionType, MatchingTerm } from '../types/question'

export interface CreateQuestionData {
  exam_id: string
  type: QuestionType
  question_text: string
  options?: string[] | null
  correct_answer: unknown
  terms?: MatchingTerm[] | null
  points?: number
  explanation?: string | null
  order_index?: number
  allow_partial_credit?: boolean
}

export interface UpdateQuestionData extends Partial<Omit<CreateQuestionData, 'exam_id'>> {}

export async function getQuestionsByExamId(examId: string): Promise<Question[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('exam_id', examId)
    .order('order_index', { ascending: true })

  if (error) throw error
  return data as Question[]
}

export async function createQuestion(questionData: CreateQuestionData): Promise<Question> {
  const { data, error } = await supabase
    .from('questions')
    .insert(questionData)
    .select()
    .single()

  if (error) throw error
  return data as Question
}

export async function updateQuestion(id: string, questionData: UpdateQuestionData): Promise<Question> {
  const { data, error } = await supabase
    .from('questions')
    .update(questionData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Question
}

export async function deleteQuestion(id: string): Promise<void> {
  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function reorderQuestions(examId: string, orderedIds: string[]): Promise<void> {
  const updates = orderedIds.map((id, index) =>
    supabase
      .from('questions')
      .update({ order_index: index })
      .eq('id', id)
      .eq('exam_id', examId)
  )

  const results = await Promise.all(updates)
  const firstError = results.find((r) => r.error)
  if (firstError?.error) throw firstError.error
}
