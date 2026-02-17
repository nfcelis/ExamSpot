import { supabase } from '../lib/supabase'
import type { QuestionBankItem, QuestionType, QuestionDifficulty } from '../types/question'

// ===== Filters =====

export interface QuestionBankFilters {
  category?: string
  subcategory?: string
  type?: QuestionType
  difficulty?: QuestionDifficulty
  tags?: string[]
  search?: string
  status?: string
}

// ===== Para Profesores: Solo lectura de preguntas aprobadas =====

export async function getApprovedQuestions(filters: QuestionBankFilters = {}): Promise<QuestionBankItem[]> {
  let query = supabase
    .from('question_bank')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })

  if (filters.category) query = query.eq('category', filters.category)
  if (filters.subcategory) query = query.eq('subcategory', filters.subcategory)
  if (filters.type) query = query.eq('type', filters.type)
  if (filters.difficulty) query = query.eq('difficulty', filters.difficulty)
  if (filters.search) query = query.ilike('question_text', `%${filters.search}%`)
  if (filters.tags && filters.tags.length > 0) {
    query = query.contains('tags', filters.tags)
  }

  const { data, error } = await query
  if (error) throw error
  return data as QuestionBankItem[]
}

export async function searchQuestions(searchQuery: string): Promise<QuestionBankItem[]> {
  const { data, error } = await supabase
    .from('question_bank')
    .select('*')
    .eq('status', 'approved')
    .ilike('question_text', `%${searchQuery}%`)

  if (error) throw error
  return data as QuestionBankItem[]
}

export async function getQuestionsByCategory(category: string): Promise<QuestionBankItem[]> {
  const { data, error } = await supabase
    .from('question_bank')
    .select('*')
    .eq('status', 'approved')
    .eq('category', category)
    .order('subcategory')

  if (error) throw error
  return data as QuestionBankItem[]
}

export async function getQuestionById(id: string): Promise<QuestionBankItem> {
  const { data, error } = await supabase
    .from('question_bank')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as QuestionBankItem
}

// ===== Para Estudiantes (Práctica) =====

export async function getRandomQuestionsForPractice(config: {
  numQuestions?: number
  categories?: string[] | null
} = {}) {
  const { data, error } = await supabase
    .rpc('get_random_questions_for_practice', {
      num_questions: config.numQuestions || 10,
      categories: config.categories || null
    })

  if (error) throw error
  return data
}

// ===== Categorías =====

export async function getAllCategories(): Promise<Record<string, string[]>> {
  const { data, error } = await supabase
    .from('question_bank')
    .select('category, subcategory')
    .eq('status', 'approved')

  if (error) throw error

  const categories: Record<string, Set<string>> = {}
  data.forEach((item: { category: string; subcategory: string | null }) => {
    if (!categories[item.category]) {
      categories[item.category] = new Set()
    }
    if (item.subcategory) {
      categories[item.category].add(item.subcategory)
    }
  })

  const result: Record<string, string[]> = {}
  Object.keys(categories).forEach(cat => {
    result[cat] = Array.from(categories[cat])
  })

  return result
}

export async function getCategoryList(): Promise<string[]> {
  const { data, error } = await supabase
    .from('question_bank')
    .select('category')
    .eq('status', 'approved')

  if (error) throw error

  const categories = new Set<string>()
  data.forEach((d: { category: string }) => {
    if (d.category) categories.add(d.category)
  })

  return Array.from(categories).sort()
}

// ===== Legacy compatibility =====

export async function getQuestionBank(filters?: QuestionBankFilters): Promise<QuestionBankItem[]> {
  return getApprovedQuestions(filters || {})
}

export async function getQuestionBankItem(id: string): Promise<QuestionBankItem> {
  return getQuestionById(id)
}

export async function getCategories(): Promise<string[]> {
  return getCategoryList()
}
