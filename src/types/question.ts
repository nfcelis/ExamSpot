export type QuestionType = 'multiple_choice' | 'open_ended' | 'fill_blank' | 'matching'

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
  category: string | null
  tags: string[] | null
  type: QuestionType
  question_text: string
  options: string[] | null
  correct_answer: unknown
  terms: MatchingTerm[] | null
  points: number
  explanation: string | null
  is_public: boolean
  created_at: string
}
