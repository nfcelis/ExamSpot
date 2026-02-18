import React from 'react'
import { Card } from '../common/Card'
import { SafeHtml } from '../common/SafeHtml'
import type { ExamAttempt, ExamAnswer } from '../../types/exam'
import type { Question } from '../../types/question'

interface ResultsViewProps {
  attempt: ExamAttempt
  answers: ExamAnswer[]
  questions: Question[]
}

function getMotivationalMessage(percentage: number): string {
  if (percentage >= 90) return '!Excelente trabajo! Dominas el tema.'
  if (percentage >= 70) return '!Muy bien! Tienes un buen dominio del tema.'
  if (percentage >= 50) return 'Buen esfuerzo. Sigue practicando para mejorar.'
  return 'No te desanimes. Revisa el material y vuelve a intentarlo.'
}

const typeLabels: Record<string, string> = {
  multiple_choice: 'Opción múltiple',
  open_ended: 'Respuesta abierta',
  fill_blank: 'Rellenar espacios',
  matching: 'Emparejar',
}

export function ResultsView({ attempt, answers, questions }: ResultsViewProps) {
  return (
    <div className="space-y-6">
      {/* Score Summary */}
      <Card className="text-center">
        <div className="mb-2 text-4xl font-bold text-primary-600">
          {attempt.percentage}%
        </div>
        <p className="text-lg text-secondary-700">
          {attempt.score} / {attempt.max_score} puntos
        </p>
        <p className="mt-2 text-sm text-secondary-500">
          {getMotivationalMessage(attempt.percentage)}
        </p>
        {attempt.time_spent && (
          <p className="mt-1 text-xs text-secondary-400">
            Tiempo: {Math.floor(attempt.time_spent / 60)} min {attempt.time_spent % 60} seg
          </p>
        )}
      </Card>

      {/* Per-question breakdown */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-secondary-900">Desglose por pregunta</h3>

        {questions.map((question, index) => {
          const examAnswer = answers.find((a) => a.question_id === question.id)

          return (
            <Card key={question.id} className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary-100 text-xs font-medium text-secondary-700">
                    {index + 1}
                  </span>
                  <span className="text-xs text-secondary-400">{typeLabels[question.type]}</span>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    examAnswer?.is_correct
                      ? 'bg-green-100 text-green-700'
                      : 'bg-danger-100 text-danger-700'
                  }`}
                >
                  {examAnswer?.score ?? 0} / {question.points} pts
                </span>
              </div>

              <SafeHtml html={question.question_text} className="font-medium text-secondary-900" />

              {/* User answer */}
              <div className="rounded-lg border border-secondary-200 bg-secondary-50 p-3 text-sm text-secondary-700">
                <span className="font-medium text-secondary-600">Tu respuesta: </span>
                {renderAnswer(question, examAnswer?.user_answer)}
              </div>

              {/* Correct answer */}
              {examAnswer && !examAnswer.is_correct && question.type !== 'open_ended' && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-600">
                  <span className="font-medium text-green-700">Respuesta correcta: </span>
                  {renderCorrectAnswer(question)}
                </div>
              )}

              {/* AI Feedback */}
              {examAnswer?.feedback && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                  <span className="font-medium">Retroalimentación: </span>
                  {examAnswer.feedback}
                </div>
              )}

              {/* AI Analysis strengths/improvements */}
              {examAnswer?.ai_analysis != null && typeof examAnswer.ai_analysis === 'object' ? (
                <AIAnalysisBlock analysis={examAnswer.ai_analysis as AIAnalysis} />
              ) : null}

              {/* Explanation */}
              {question.explanation && (
                <div className="rounded-lg bg-secondary-50 p-3 text-sm text-secondary-600">
                  <span className="font-medium">Explicación: </span>
                  {question.explanation}
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}

interface AIAnalysis {
  strengths?: string[]
  improvements?: string[]
  references?: Array<{ material: string; section: string; reason: string }>
}

function AIAnalysisBlock({ analysis }: { analysis: AIAnalysis }) {
  return (
    <div className="space-y-2 text-sm">
      {analysis.strengths && analysis.strengths.length > 0 && (
        <div className="rounded-lg bg-green-50 p-3">
          <span className="font-medium text-green-700">Aspectos correctos:</span>
          <ul className="mt-1 list-inside list-disc text-green-600">
            {analysis.strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
      {analysis.improvements && analysis.improvements.length > 0 && (
        <div className="rounded-lg bg-yellow-50 p-3">
          <span className="font-medium text-yellow-700">Aspectos a mejorar:</span>
          <ul className="mt-1 list-inside list-disc text-yellow-600">
            {analysis.improvements.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
      {analysis.references && analysis.references.length > 0 && (
        <div className="rounded-lg bg-indigo-50 p-3">
          <div className="mb-2 flex items-center gap-1.5 font-medium text-indigo-700">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Material de referencia:
          </div>
          <ul className="space-y-2">
            {analysis.references.map((ref, i) => (
              <li key={i} className="rounded border border-indigo-200 bg-white p-2">
                <p className="font-medium text-indigo-800">{ref.material}</p>
                {ref.section && (
                  <p className="text-xs text-indigo-600">Sección: {ref.section}</p>
                )}
                <p className="mt-1 text-indigo-700">{ref.reason}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function renderAnswer(question: Question, answer: unknown): React.ReactNode {
  if (answer === undefined || answer === null) return 'Sin respuesta'

  switch (question.type) {
    case 'multiple_choice':
      if (typeof answer === 'number' && question.options) {
        return <SafeHtml html={question.options[answer] ?? 'Sin respuesta'} inline />
      }
      if (Array.isArray(answer) && question.options) {
        return (answer as number[]).map((i, idx) => (
          <span key={idx}>{idx > 0 && ', '}<SafeHtml html={question.options![i] ?? ''} inline /></span>
        ))
      }
      return String(answer)
    case 'open_ended':
      return <SafeHtml html={String(answer)} inline />
    case 'fill_blank':
      if (Array.isArray(answer)) {
        return (answer as string[]).map((a, i) => (
          <span key={i}>{i > 0 && ', '}<SafeHtml html={a} inline /></span>
        ))
      }
      return <SafeHtml html={String(answer)} inline />
    case 'matching':
      if (typeof answer === 'object' && answer !== null) {
        return Object.entries(answer as Record<string, string>).map(([term, def], i) => (
          <span key={i}>{i > 0 && '; '}<SafeHtml html={term} inline /> → <SafeHtml html={def} inline /></span>
        ))
      }
      return String(answer)
    default:
      return String(answer)
  }
}

function renderCorrectAnswer(question: Question): React.ReactNode {
  switch (question.type) {
    case 'multiple_choice':
      if (typeof question.correct_answer === 'number' && question.options) {
        return <SafeHtml html={question.options[question.correct_answer] ?? ''} inline />
      }
      if (Array.isArray(question.correct_answer) && question.options) {
        return (question.correct_answer as number[]).map((i, idx) => (
          <span key={idx}>{idx > 0 && ', '}<SafeHtml html={question.options![i] ?? ''} inline /></span>
        ))
      }
      return null
    case 'fill_blank':
      if (Array.isArray(question.correct_answer)) {
        return (question.correct_answer as string[]).map((a, i) => (
          <span key={i}>{i > 0 && ', '}<SafeHtml html={a} inline /></span>
        ))
      }
      return null
    case 'matching':
      if (question.terms) {
        return question.terms.map((t, i) => (
          <span key={i}>{i > 0 && '; '}<SafeHtml html={t.term} inline /> → <SafeHtml html={t.definition} inline /></span>
        ))
      }
      return null
    default:
      return null
  }
}
