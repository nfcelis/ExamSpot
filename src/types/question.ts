export type QuestionType = 'multiple_choice' | 'open_ended' | 'fill_blank' | 'matching'
export type QuestionStatus = 'pending' | 'approved' | 'rejected'
export type QuestionSource = 'manual' | 'ai_generated' | 'imported'
export type QuestionDifficulty = 'easy' | 'medium' | 'hard'

export interface MatchingTerm {
  term: string
  definition: string
}

export interface Question {
  id: string
  exam_id: string
  type: QuestionType
  question_text: string
  options: string[] | null
  correct_answer: unknown
  terms: MatchingTerm[] | null
  points: number
  explanation: string | null
  material_reference: string | null
  order_index: number
  allow_partial_credit: boolean
  created_at: string
}

export interface QuestionBankItem {
  id: string
  created_by: string
  created_at: string
  updated_at: string

  // Approval status
  status: QuestionStatus
  reviewed_by: string | null
  reviewed_at: string | null
  rejection_reason: string | null

  // Source
  source: QuestionSource
  ai_generation_metadata: Record<string, unknown> | null

  // Categorization
  category: string
  subcategory: string | null
  tags: string[] | null
  difficulty: QuestionDifficulty

  // Content
  type: QuestionType
  question_text: string
  options: string[] | null
  correct_answer: unknown
  terms: MatchingTerm[] | null

  // Additional
  explanation: string | null
  points: number
  allow_partial_credit: boolean

  // Reference
  reference_material: string | null
  reference_page: string | null

  // Usage metadata
  is_public: boolean
  usage_count: number
  avg_score: number | null
}

export interface ExamQuestion {
  id: string
  exam_id: string
  question_bank_id: string
  order_index: number
  created_at: string
  question?: QuestionBankItem
}
