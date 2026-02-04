export type ExamStatus = 'draft' | 'published' | 'archived'

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
  created_at: string
}
