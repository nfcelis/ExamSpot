import { supabase } from '../lib/supabase'
import type { ExamAttempt, ExamAnswer } from '../types/exam'

export async function createAttempt(examId: string, userId: string): Promise<ExamAttempt> {
  const { data, error } = await supabase
    .from('exam_attempts')
    .insert({
      exam_id: examId,
      user_id: userId,
    })
    .select()
    .single()

  if (error) throw error
  return data as ExamAttempt
}

export async function getAttemptById(id: string): Promise<ExamAttempt> {
  const { data, error } = await supabase
    .from('exam_attempts')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as ExamAttempt
}

export async function getAttemptsByExam(examId: string): Promise<ExamAttempt[]> {
  const { data, error } = await supabase
    .from('exam_attempts')
    .select('*')
    .eq('exam_id', examId)
    .order('started_at', { ascending: false })

  if (error) throw error
  return data as ExamAttempt[]
}

export async function getMyAttempts(userId: string): Promise<ExamAttempt[]> {
  const { data, error } = await supabase
    .from('exam_attempts')
    .select('*, exams(title, description)')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })

  if (error) throw error
  return data as ExamAttempt[]
}

export async function saveAnswer(
  attemptId: string,
  questionId: string,
  userAnswer: unknown
): Promise<ExamAnswer> {
  const { data, error } = await supabase
    .from('exam_answers')
    .upsert(
      {
        attempt_id: attemptId,
        question_id: questionId,
        user_answer: userAnswer,
      },
      { onConflict: 'attempt_id,question_id' }
    )
    .select()
    .single()

  if (error) throw error
  return data as ExamAnswer
}

export async function getAnswersByAttempt(attemptId: string): Promise<ExamAnswer[]> {
  const { data, error } = await supabase
    .from('exam_answers')
    .select('*')
    .eq('attempt_id', attemptId)

  if (error) throw error
  return data as ExamAnswer[]
}

export async function completeAttempt(
  attemptId: string,
  score: number,
  maxScore: number
): Promise<ExamAttempt> {
  const attempt = await getAttemptById(attemptId)
  const startedAt = new Date(attempt.started_at).getTime()
  const timeSpent = Math.floor((Date.now() - startedAt) / 1000)

  const { data, error } = await supabase
    .from('exam_attempts')
    .update({
      score,
      max_score: maxScore,
      percentage: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0,
      completed_at: new Date().toISOString(),
      time_spent: timeSpent,
      is_completed: true,
    })
    .eq('id', attemptId)
    .select()
    .single()

  if (error) throw error
  return data as ExamAttempt
}

export async function updateAnswer(
  answerId: string,
  updates: Partial<Pick<ExamAnswer, 'is_correct' | 'score' | 'feedback' | 'ai_analysis'>>
): Promise<ExamAnswer> {
  const { data, error } = await supabase
    .from('exam_answers')
    .update(updates)
    .eq('id', answerId)
    .select()
    .single()

  if (error) throw error
  return data as ExamAnswer
}
