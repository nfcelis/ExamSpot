import { supabase } from '../lib/supabase'
import type { Exam, ExamStatus } from '../types/exam'
import type { QuestionBankItem } from '../types/question'

export interface ExamFilters {
  status?: ExamStatus
  is_public?: boolean
  search?: string
}

export interface CreateExamData {
  title: string
  description?: string
  status?: ExamStatus
  is_public?: boolean
  time_limit?: number | null
  randomize_order?: boolean
}

export interface UpdateExamData extends Partial<CreateExamData> {}

// ===== CRUD de Exámenes =====

export async function getExams(filters?: ExamFilters): Promise<Exam[]> {
  let query = supabase.from('exams').select('*')

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (filters?.is_public !== undefined) {
    query = query.eq('is_public', filters.is_public)
  }
  if (filters?.search) {
    query = query.ilike('title', `%${filters.search}%`)
  }

  query = query.order('created_at', { ascending: false })

  const { data, error } = await query
  if (error) throw error
  return data as Exam[]
}

export async function getExamById(id: string): Promise<Exam> {
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Exam
}

export async function createExam(examData: CreateExamData): Promise<Exam> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data, error } = await supabase
    .from('exams')
    .insert({
      ...examData,
      created_by: user.id,
      status: examData.status || 'draft',
    })
    .select()
    .single()

  if (error) throw error
  return data as Exam
}

export async function updateExam(id: string, examData: UpdateExamData): Promise<Exam> {
  const { data, error } = await supabase
    .from('exams')
    .update({ ...examData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Exam
}

export async function deleteExam(id: string): Promise<void> {
  const { error } = await supabase
    .from('exams')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function getExamsByTeacher(teacherId: string): Promise<Exam[]> {
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .eq('created_by', teacherId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Exam[]
}

export async function getPublishedExams(): Promise<Exam[]> {
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .eq('status', 'published')
    .eq('is_public', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Exam[]
}

// ===== Gestión de Preguntas en Examen (exam_questions) =====

export async function addQuestionToExam(examId: string, questionBankId: string, orderIndex: number) {
  const { data, error } = await supabase
    .from('exam_questions')
    .insert({
      exam_id: examId,
      question_bank_id: questionBankId,
      order_index: orderIndex
    })
    .select()
    .single()

  if (error) throw error

  // Update question count and usage
  await updateQuestionCount(examId)
  await incrementQuestionUsage(questionBankId)

  return data
}

export async function removeQuestionFromExam(examId: string, questionBankId: string) {
  const { error } = await supabase
    .from('exam_questions')
    .delete()
    .eq('exam_id', examId)
    .eq('question_bank_id', questionBankId)

  if (error) throw error
  await updateQuestionCount(examId)
}

export async function addMultipleQuestionsToExam(examId: string, questionBankIds: string[]) {
  const questionsToInsert = questionBankIds.map((qbId, index) => ({
    exam_id: examId,
    question_bank_id: qbId,
    order_index: index
  }))

  const { data, error } = await supabase
    .from('exam_questions')
    .insert(questionsToInsert)
    .select()

  if (error) throw error
  await updateQuestionCount(examId)
  return data
}

export async function reorderQuestionsInExam(examId: string, questionOrders: Array<{ question_bank_id: string; order_index: number }>) {
  for (const { question_bank_id, order_index } of questionOrders) {
    await supabase
      .from('exam_questions')
      .update({ order_index })
      .eq('exam_id', examId)
      .eq('question_bank_id', question_bank_id)
  }
}

async function updateQuestionCount(examId: string) {
  const { count } = await supabase
    .from('exam_questions')
    .select('*', { count: 'exact', head: true })
    .eq('exam_id', examId)

  await supabase
    .from('exams')
    .update({ question_count: count || 0 })
    .eq('id', examId)
}

async function incrementQuestionUsage(questionBankId: string) {
  const { data } = await supabase
    .from('question_bank')
    .select('usage_count')
    .eq('id', questionBankId)
    .single()

  if (data) {
    await supabase
      .from('question_bank')
      .update({ usage_count: (data.usage_count || 0) + 1 })
      .eq('id', questionBankId)
  }
}

// ===== Obtener Preguntas de un Examen =====

export async function getExamQuestions(examId: string): Promise<QuestionBankItem[]> {
  const { data, error } = await supabase
    .from('exam_questions')
    .select(`
      *,
      question:question_bank(*)
    `)
    .eq('exam_id', examId)
    .order('order_index')

  if (error) throw error
  return (data || []).map((eq: { question: QuestionBankItem }) => eq.question)
}

export async function getExamQuestionIds(examId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('exam_questions')
    .select('question_bank_id')
    .eq('exam_id', examId)
    .order('order_index')

  if (error) throw error
  return (data || []).map((eq: { question_bank_id: string }) => eq.question_bank_id)
}
