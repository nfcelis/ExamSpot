export type ExamStatus = 'draft' | 'published' | 'archived' | 'practice'
export type FeedbackStatus = 'auto' | 'pending_review' | 'reviewed'

export interface Exam {
  id: string
  title: string
  description: string | null
  created_by: string
  status: ExamStatus
  is_public: boolean
  access_link: string | null
  link_expiration: string | null
  randomize_order: boolean
  time_limit: number | null
  question_count: number
  created_at: string
  updated_at: string
}

export interface Material {
  id: string
  exam_id: string | null
  title: string
  file_path: string
  file_type: string
  uploaded_by: string | null
  created_at: string
}

export interface ExamAttempt {
  id: string
  exam_id: string
  user_id: string
  score: number
  max_score: number
  percentage: number
  started_at: string
  completed_at: string | null
  time_spent: number | null
  is_completed: boolean
  is_practice: boolean
}

export interface ExamAnswer {
  id: string
  attempt_id: string
  question_id: string
  user_answer: unknown
  is_correct: boolean
  score: number
  feedback: string | null
  ai_analysis: unknown
  feedback_status: FeedbackStatus
  created_at: string
}

export interface PracticeConfig {
  id: string
  questions_per_practice: number
  time_limit_minutes: number | null
  difficulty_distribution: {
    easy: number
    medium: number
    hard: number
  }
  categories_enabled: string[] | null
  show_correct_answers: boolean
  allow_retry: boolean
  updated_by: string | null
  updated_at: string
}

export interface AIFeedbackReview {
  id: string
  exam_answer_id: string
  original_feedback: string
  original_score: number
  original_ai_analysis: unknown
  reviewed_by: string
  reviewed_at: string
  admin_decision: 'approved' | 'rejected' | 'modified'
  modified_feedback: string | null
  modified_score: number | null
  admin_notes: string | null
}
