import { supabase } from '../lib/supabase'
import type { Question } from '../types/question'

interface ClaudeResponse {
  content: string
}

interface GradeResult {
  score: number
  feedback: string
  strengths: string[]
  improvements: string[]
}

export async function callClaudeAI(
  prompt: string,
  system?: string,
  maxTokens = 2000
): Promise<string> {
  const { data, error } = await supabase.functions.invoke('claude-ai', {
    body: { prompt, system, maxTokens },
  })

  if (error) throw new Error(`Error al llamar a Claude AI: ${error.message}`)

  const response = data as ClaudeResponse
  return response.content
}

export async function gradeOpenEndedAnswer(
  question: Question,
  userAnswer: string
): Promise<GradeResult> {
  const prompt = `Evalúa esta respuesta de estudiante:

Pregunta: ${question.question_text}
Respuesta del estudiante: ${userAnswer}
Respuesta modelo: ${typeof question.correct_answer === 'string' ? question.correct_answer : JSON.stringify(question.correct_answer)}
Puntos máximos: ${question.points}

Proporciona:
1. Puntuación (0-${question.points})
2. Feedback constructivo (2-3 párrafos)
3. Aspectos correctos y a mejorar

Responde SOLAMENTE con un JSON válido en este formato exacto:
{
  "score": number,
  "feedback": "string",
  "strengths": ["string"],
  "improvements": ["string"]
}`

  const system = 'Eres un profesor experto que evalúa respuestas de estudiantes. Responde siempre en español y solo con JSON válido.'

  try {
    const responseText = await callClaudeAI(prompt, system)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No se encontró JSON en la respuesta')
    return JSON.parse(jsonMatch[0]) as GradeResult
  } catch {
    return {
      score: 0,
      feedback: 'La evaluación automática con IA no está disponible en este momento. La respuesta será revisada manualmente por el profesor.',
      strengths: [],
      improvements: ['La evaluación automática no pudo completarse'],
    }
  }
}
