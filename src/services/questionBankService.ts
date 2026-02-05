import { supabase } from '../lib/supabase'
import type { QuestionBankItem, QuestionType, MatchingTerm } from '../types/question'

export interface QuestionBankFilters {
  category?: string
  type?: QuestionType
  search?: string
  onlyMine?: boolean
  includeExamQuestions?: boolean
}

export interface CreateQuestionBankData {
  category?: string | null
  tags?: string[] | null
  type: QuestionType
  question_text: string
  options?: string[] | null
  correct_answer: unknown
  terms?: MatchingTerm[] | null
  points?: number
  explanation?: string | null
  is_public?: boolean
}

export interface UpdateQuestionBankData extends Partial<CreateQuestionBankData> {}

export async function getQuestionBank(filters?: QuestionBankFilters): Promise<QuestionBankItem[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const results: QuestionBankItem[] = []

  // 1. Get questions from question_bank table
  let bankQuery = supabase.from('question_bank').select('*')

  if (filters?.category) {
    bankQuery = bankQuery.eq('category', filters.category)
  }
  if (filters?.type) {
    bankQuery = bankQuery.eq('type', filters.type)
  }
  if (filters?.search) {
    bankQuery = bankQuery.ilike('question_text', `%${filters.search}%`)
  }
  if (filters?.onlyMine) {
    bankQuery = bankQuery.eq('created_by', user.id)
  }

  bankQuery = bankQuery.order('created_at', { ascending: false })

  const { data: bankData, error: bankError } = await bankQuery
  if (bankError) throw bankError

  if (bankData) {
    results.push(...(bankData as QuestionBankItem[]))
  }

  // 2. Get questions from exams owned by the user (if includeExamQuestions is true or default)
  if (filters?.includeExamQuestions !== false) {
    // First get the user's exam IDs
    const { data: exams, error: examsError } = await supabase
      .from('exams')
      .select('id')
      .eq('created_by', user.id)

    if (examsError) throw examsError

    if (exams && exams.length > 0) {
      const examIds = exams.map((e) => e.id)

      let questionsQuery = supabase
        .from('questions')
        .select('*, exams!inner(title)')
        .in('exam_id', examIds)

      if (filters?.type) {
        questionsQuery = questionsQuery.eq('type', filters.type)
      }
      if (filters?.search) {
        questionsQuery = questionsQuery.ilike('question_text', `%${filters.search}%`)
      }

      questionsQuery = questionsQuery.order('created_at', { ascending: false })

      const { data: questionsData, error: questionsError } = await questionsQuery
      if (questionsError) throw questionsError

      if (questionsData) {
        // Convert exam questions to QuestionBankItem format
        const examQuestions: QuestionBankItem[] = questionsData.map((q: any) => ({
          id: q.id,
          created_by: user.id,
          category: q.exams?.title || null, // Use exam title as category
          tags: null,
          type: q.type,
          question_text: q.question_text,
          options: q.options,
          correct_answer: q.correct_answer,
          terms: q.terms,
          points: q.points,
          explanation: q.explanation,
          is_public: false,
          created_at: q.created_at,
          _source: 'exam', // Mark as from exam (for UI distinction)
        }))

        // Filter by category if specified (matches exam title)
        if (filters?.category) {
          results.push(...examQuestions.filter((q) => q.category === filters.category))
        } else {
          results.push(...examQuestions)
        }
      }
    }
  }

  // Remove duplicates by question_text (prefer bank items over exam items)
  const seen = new Set<string>()
  const uniqueResults: QuestionBankItem[] = []

  for (const item of results) {
    const key = item.question_text.toLowerCase().trim()
    if (!seen.has(key)) {
      seen.add(key)
      uniqueResults.push(item)
    }
  }

  // Sort by created_at descending
  uniqueResults.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return uniqueResults
}

export async function getQuestionBankItem(id: string): Promise<QuestionBankItem> {
  const { data, error } = await supabase
    .from('question_bank')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as QuestionBankItem
}

export async function createQuestionBankItem(itemData: CreateQuestionBankData): Promise<QuestionBankItem> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data, error } = await supabase
    .from('question_bank')
    .insert({
      ...itemData,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) throw error
  return data as QuestionBankItem
}

export async function updateQuestionBankItem(
  id: string,
  itemData: UpdateQuestionBankData
): Promise<QuestionBankItem> {
  const { data, error } = await supabase
    .from('question_bank')
    .update(itemData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as QuestionBankItem
}

export async function deleteQuestionBankItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('question_bank')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function getCategories(): Promise<string[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const categories = new Set<string>()

  // Get categories from question_bank
  const { data: bankData, error: bankError } = await supabase
    .from('question_bank')
    .select('category')
    .eq('created_by', user.id)
    .not('category', 'is', null)

  if (bankError) throw bankError

  if (bankData) {
    bankData.forEach((d) => {
      if (d.category) categories.add(d.category)
    })
  }

  // Get exam titles as categories
  const { data: examsData, error: examsError } = await supabase
    .from('exams')
    .select('title')
    .eq('created_by', user.id)

  if (examsError) throw examsError

  if (examsData) {
    examsData.forEach((e) => {
      if (e.title) categories.add(e.title)
    })
  }

  return Array.from(categories).sort()
}
