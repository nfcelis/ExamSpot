import { supabase } from '../lib/supabase'
import type { QuestionBankItem } from '../types/question'
import type { PracticeConfig } from '../types/exam'
import type { Profile, UserRole } from '../types/user'

// ===== Gestión de Preguntas Pendientes =====

export interface PendingQuestionsFilters {
  category?: string
  type?: string
}

export async function getPendingQuestions(filters: PendingQuestionsFilters = {}): Promise<QuestionBankItem[]> {
  let query = supabase
    .from('question_bank')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (filters.category) {
    query = query.eq('category', filters.category)
  }
  if (filters.type) {
    query = query.eq('type', filters.type)
  }

  const { data, error } = await query
  if (error) throw error
  return data as QuestionBankItem[]
}

export async function approveQuestion(questionId: string): Promise<QuestionBankItem> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data, error } = await supabase
    .from('question_bank')
    .update({
      status: 'approved',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', questionId)
    .select()
    .single()

  if (error) throw error
  return data as QuestionBankItem
}

export async function rejectQuestion(questionId: string, reason: string): Promise<QuestionBankItem> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data, error } = await supabase
    .from('question_bank')
    .update({
      status: 'rejected',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      rejection_reason: reason
    })
    .eq('id', questionId)
    .select()
    .single()

  if (error) throw error
  return data as QuestionBankItem
}

export async function modifyAndApproveQuestion(
  questionId: string,
  modifications: Partial<QuestionBankItem>
): Promise<QuestionBankItem> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data, error } = await supabase
    .from('question_bank')
    .update({
      ...modifications,
      status: 'approved',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', questionId)
    .select()
    .single()

  if (error) throw error
  return data as QuestionBankItem
}

// ===== Crear Pregunta Manual (Admin) =====

export interface CreateQuestionData {
  category: string
  subcategory?: string
  tags?: string[]
  difficulty: 'easy' | 'medium' | 'hard'
  type: 'multiple_choice' | 'open_ended' | 'fill_blank' | 'matching'
  question_text: string
  options?: string[] | null
  correct_answer: unknown
  terms?: Array<{ term: string; definition: string }> | null
  explanation?: string
  points?: number
  allow_partial_credit?: boolean
  reference_material?: string
  reference_page?: string
}

export async function createQuestionManual(questionData: CreateQuestionData): Promise<QuestionBankItem> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data, error } = await supabase
    .from('question_bank')
    .insert({
      ...questionData,
      created_by: user.id,
      status: 'approved',
      source: 'manual',
      is_public: true
    })
    .select()
    .single()

  if (error) throw error
  return data as QuestionBankItem
}

// ===== Generación de Preguntas con IA =====

export interface GenerateQuestionsConfig {
  pdfContent: string
  numQuestions: number
  questionTypes: string[]
  difficulty: string
  category: string
  subcategory?: string
  tags?: string[]
}

export async function generateQuestionsWithAI(config: GenerateQuestionsConfig): Promise<QuestionBankItem[]> {
  const { generateQuestionsFromMaterial } = await import('./aiService')

  const questions = await generateQuestionsFromMaterial({
    materialContent: config.pdfContent,
    questionCount: config.numQuestions,
    questionTypes: config.questionTypes as Array<'multiple_choice' | 'open_ended' | 'fill_blank' | 'matching'>,
    difficulty: config.difficulty as 'easy' | 'medium' | 'hard'
  })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const questionsToInsert = questions.map(q => ({
    created_by: user.id,
    status: 'pending' as const,
    source: 'ai_generated' as const,
    ai_generation_metadata: {
      model: 'llama-3.3-70b',
      prompt_length: config.pdfContent.length,
      generated_at: new Date().toISOString()
    },
    category: config.category,
    subcategory: config.subcategory || null,
    tags: config.tags || [],
    difficulty: q.difficulty || config.difficulty,
    type: q.type,
    question_text: q.question_text,
    options: q.options || null,
    correct_answer: q.correct_answer,
    terms: q.terms || null,
    explanation: q.explanation || null,
    points: q.points || 10,
    reference_material: config.category,
    is_public: true
  }))

  const { data, error } = await supabase
    .from('question_bank')
    .insert(questionsToInsert)
    .select()

  if (error) throw error
  return data as QuestionBankItem[]
}

// ===== Configuración de Práctica =====

export async function getPracticeConfig(): Promise<PracticeConfig> {
  const { data, error } = await supabase
    .from('practice_config')
    .select('*')
    .single()

  if (error) throw error
  return data as PracticeConfig
}

export async function updatePracticeConfig(config: Partial<PracticeConfig> & { id: string }): Promise<PracticeConfig> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data, error } = await supabase
    .from('practice_config')
    .update({
      ...config,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', config.id)
    .select()
    .single()

  if (error) throw error
  return data as PracticeConfig
}

// ===== Analytics =====

export interface QuestionBankStats {
  total_questions: number
  approved_count: number
  pending_count: number
  rejected_count: number
  ai_generated_count: number
  manual_count: number
  imported_count: number
  categories_count: number
}

export async function getQuestionBankStats(): Promise<QuestionBankStats> {
  const { data, error } = await supabase.rpc('get_question_bank_stats')
  if (error) throw error
  return (data as QuestionBankStats[])[0]
}

export async function getUsageAnalytics() {
  const { data, error } = await supabase
    .from('question_bank')
    .select('id, question_text, category, usage_count, avg_score')
    .eq('status', 'approved')
    .order('usage_count', { ascending: false })
    .limit(20)

  if (error) throw error
  return data
}

// ===== Generación/Mejora de Feedback con IA =====

export async function generateFeedbackForQuestion(questionId: string, instructions?: string): Promise<string> {
  const { callClaudeAI } = await import('./aiService')

  const { data: question, error } = await supabase
    .from('question_bank')
    .select('*')
    .eq('id', questionId)
    .single()

  if (error) throw error

  const correctAnswerStr = typeof question.correct_answer === 'string'
    ? question.correct_answer
    : JSON.stringify(question.correct_answer)

  const optionsStr = question.options
    ? `\nOpciones: ${(question.options as string[]).join(', ')}`
    : ''

  const termsStr = question.terms
    ? `\nPares: ${(question.terms as Array<{ term: string; definition: string }>).map((t) => `${t.term} = ${t.definition}`).join(', ')}`
    : ''

  const instructionsStr = instructions
    ? `\n\nINSTRUCCIONES ADICIONALES DEL ADMIN:\n${instructions}`
    : ''

  const existingFeedback = question.explanation
    ? `\n\nFeedback actual (mejorar o reescribir):\n${question.explanation}`
    : ''

  const prompt = `Genera un feedback/explicación educativa para la siguiente pregunta de examen.

Pregunta: ${question.question_text}
Tipo: ${question.type}${optionsStr}${termsStr}
Respuesta correcta: ${correctAnswerStr}
Categoría: ${question.category}
Dificultad: ${question.difficulty}${existingFeedback}${instructionsStr}

El feedback debe:
1. Explicar POR QUÉ la respuesta correcta es correcta
2. Si es opción múltiple, explicar por qué las otras opciones son incorrectas
3. Dar contexto educativo que ayude al estudiante a entender el tema
4. Ser conciso pero completo (2-4 párrafos)
5. Estar en español

Responde SOLAMENTE con el texto del feedback, sin formato JSON ni etiquetas.`

  const system = 'Eres un experto en educación que crea feedback pedagógico de alta calidad. Siempre respondes en español.'

  const feedback = await callClaudeAI(prompt, system, 1500)
  return feedback.trim()
}

export async function updateQuestionFeedback(questionId: string, explanation: string): Promise<QuestionBankItem> {
  const { data, error } = await supabase
    .from('question_bank')
    .update({ explanation, updated_at: new Date().toISOString() })
    .eq('id', questionId)
    .select()
    .single()

  if (error) throw error
  return data as QuestionBankItem
}

// ===== Revisión de Feedback de IA =====

export async function getPendingFeedbackReviews() {
  const { data, error } = await supabase
    .from('exam_answers')
    .select(`
      *,
      question:question_bank(*),
      attempt:exam_attempts(*)
    `)
    .eq('feedback_status', 'pending_review')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function reviewFeedback(
  examAnswerId: string,
  decision: 'approved' | 'rejected' | 'modified',
  modifications: { feedback?: string; score?: number; notes?: string } = {}
) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  // Get original answer
  const { data: answer, error: answerError } = await supabase
    .from('exam_answers')
    .select('*')
    .eq('id', examAnswerId)
    .single()

  if (answerError) throw answerError

  // Create review record
  const { error: reviewError } = await supabase
    .from('ai_feedback_reviews')
    .insert({
      exam_answer_id: examAnswerId,
      original_feedback: answer.feedback || '',
      original_score: answer.score,
      original_ai_analysis: answer.ai_analysis || {},
      reviewed_by: user.id,
      admin_decision: decision,
      modified_feedback: modifications.feedback || null,
      modified_score: modifications.score ?? null,
      admin_notes: modifications.notes || null
    })

  if (reviewError) throw reviewError

  // Update answer with final feedback
  const finalFeedback = decision === 'modified'
    ? modifications.feedback
    : (decision === 'approved' ? answer.feedback : null)

  const finalScore = decision === 'modified'
    ? modifications.score
    : (decision === 'approved' ? answer.score : 0)

  const { error: updateError } = await supabase
    .from('exam_answers')
    .update({
      feedback: finalFeedback,
      score: finalScore,
      feedback_status: 'reviewed'
    })
    .eq('id', examAnswerId)

  if (updateError) throw updateError

  return { success: true }
}

// ===== CRUD completo del banco =====

export async function getAllQuestions(filters: {
  status?: string
  category?: string
  subcategory?: string
  type?: string
  difficulty?: string
  source?: string
  search?: string
} = {}): Promise<QuestionBankItem[]> {
  let query = supabase
    .from('question_bank')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters.status) query = query.eq('status', filters.status)
  if (filters.category) query = query.eq('category', filters.category)
  if (filters.subcategory) query = query.eq('subcategory', filters.subcategory)
  if (filters.type) query = query.eq('type', filters.type)
  if (filters.difficulty) query = query.eq('difficulty', filters.difficulty)
  if (filters.source) query = query.eq('source', filters.source)
  if (filters.search) query = query.ilike('question_text', `%${filters.search}%`)

  const { data, error } = await query
  if (error) throw error
  return data as QuestionBankItem[]
}

export async function updateQuestion(id: string, updates: Partial<QuestionBankItem>): Promise<QuestionBankItem> {
  const { data, error } = await supabase
    .from('question_bank')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as QuestionBankItem
}

export async function deleteQuestion(id: string): Promise<void> {
  const { error } = await supabase
    .from('question_bank')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function deleteAllMyQuestions(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data, error } = await supabase
    .from('question_bank')
    .delete()
    .eq('created_by', user.id)
    .select('id')

  if (error) throw error
  return data?.length ?? 0
}

// ===== Gestión de Usuarios (solo Super Admin) =====

export async function getAllUsers(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Profile[]
}

export async function updateUserRole(userId: string, newRole: UserRole): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data as Profile
}
