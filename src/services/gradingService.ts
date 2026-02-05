import type { Question } from '../types/question'
import type { ExamAnswer } from '../types/exam'
import { gradeOpenEndedAnswer } from './aiService'
import { updateAnswer } from './attemptService'

interface GradeResult {
  isCorrect: boolean
  score: number
  feedback?: string
}

export function gradeMultipleChoice(question: Question, answer: unknown): GradeResult {
  const correctAnswer = question.correct_answer
  const userAnswer = answer

  // Single correct answer (index)
  if (typeof correctAnswer === 'number') {
    const isCorrect = userAnswer === correctAnswer
    return {
      isCorrect,
      score: isCorrect ? question.points : 0,
    }
  }

  // Multiple correct answers (array of indices)
  if (Array.isArray(correctAnswer) && Array.isArray(userAnswer)) {
    const correct = new Set(correctAnswer as number[])
    const user = new Set(userAnswer as number[])
    const isCorrect = correct.size === user.size && [...correct].every((v) => user.has(v))

    if (question.allow_partial_credit) {
      const correctCount = [...user].filter((v) => correct.has(v)).length
      const wrongCount = [...user].filter((v) => !correct.has(v)).length
      const partialScore = Math.max(0, (correctCount - wrongCount) / correct.size) * question.points
      return {
        isCorrect,
        score: isCorrect ? question.points : Math.round(partialScore),
      }
    }

    return {
      isCorrect,
      score: isCorrect ? question.points : 0,
    }
  }

  return { isCorrect: false, score: 0 }
}

export function gradeFillBlank(question: Question, answer: unknown): GradeResult {
  const correctAnswers = question.correct_answer as string[]
  const userAnswers = answer as string[]

  if (!Array.isArray(correctAnswers) || !Array.isArray(userAnswers)) {
    return { isCorrect: false, score: 0 }
  }

  let correctCount = 0
  for (let i = 0; i < correctAnswers.length; i++) {
    const correct = (correctAnswers[i] || '').trim().toLowerCase()
    const user = (userAnswers[i] || '').trim().toLowerCase()
    if (correct === user) correctCount++
  }

  const isCorrect = correctCount === correctAnswers.length
  const score = correctAnswers.length > 0
    ? Math.round((correctCount / correctAnswers.length) * question.points)
    : 0

  return { isCorrect, score }
}

export function gradeMatching(question: Question, answer: unknown): GradeResult {
  const terms = question.terms
  const userMatches = answer as Record<string, string>

  if (!terms || !userMatches) {
    return { isCorrect: false, score: 0 }
  }

  let correctCount = 0
  for (const term of terms) {
    if (userMatches[term.term] === term.definition) {
      correctCount++
    }
  }

  const isCorrect = correctCount === terms.length
  const score = terms.length > 0
    ? Math.round((correctCount / terms.length) * question.points)
    : 0

  return { isCorrect, score }
}

export async function gradeExam(
  questions: Question[],
  answers: ExamAnswer[]
): Promise<{ totalScore: number; maxScore: number }> {
  const maxScore = questions.reduce((sum, q) => sum + q.points, 0)
  let totalScore = 0

  for (const examAnswer of answers) {
    const question = questions.find((q) => q.id === examAnswer.question_id)
    if (!question) continue

    let result: GradeResult

    switch (question.type) {
      case 'multiple_choice':
        result = gradeMultipleChoice(question, examAnswer.user_answer)
        break
      case 'fill_blank':
        result = gradeFillBlank(question, examAnswer.user_answer)
        break
      case 'matching':
        result = gradeMatching(question, examAnswer.user_answer)
        break
      case 'open_ended': {
        const aiResult = await gradeOpenEndedAnswer(
          question,
          typeof examAnswer.user_answer === 'string'
            ? examAnswer.user_answer
            : JSON.stringify(examAnswer.user_answer)
        )
        result = {
          isCorrect: aiResult.score >= question.points * 0.7,
          score: aiResult.score,
          feedback: aiResult.feedback,
        }
        await updateAnswer(examAnswer.id, {
          is_correct: result.isCorrect,
          score: result.score,
          feedback: result.feedback,
          ai_analysis: aiResult,
        })
        totalScore += result.score
        continue
      }
      default:
        result = { isCorrect: false, score: 0 }
    }

    await updateAnswer(examAnswer.id, {
      is_correct: result.isCorrect,
      score: result.score,
      feedback: result.feedback || null,
    })

    totalScore += result.score
  }

  return { totalScore, maxScore }
}
