import { supabase } from '../lib/supabase'
import type { Exam, ExamStatus } from '../types/exam'

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
