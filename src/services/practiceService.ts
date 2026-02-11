import { supabase } from '../lib/supabase'

export interface PracticeCategory {
  category: string
  question_count: number
}

export async function getPracticeCategories(): Promise<PracticeCategory[]> {
  const { data, error } = await supabase.rpc('get_practice_categories')
  if (error) throw error
  return (data as PracticeCategory[]) || []
}

export async function createPracticeExam(
  category: string,
  numQuestions: number
): Promise<string> {
  const { data, error } = await supabase.rpc('create_practice_exam', {
    p_category: category,
    p_num_questions: numQuestions,
  })
  if (error) throw error
  return data as string
}
