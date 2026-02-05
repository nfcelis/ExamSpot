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
  references?: MaterialReference[]
}

interface MaterialReference {
  material: string
  section: string
  reason: string
}

interface SynonymResult {
  isAccepted: boolean
  reason: string
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
  userAnswer: string,
  materialContext?: string
): Promise<GradeResult> {
  const modelAnswer = typeof question.correct_answer === 'string'
    ? question.correct_answer
    : JSON.stringify(question.correct_answer)

  const materialSection = materialContext
    ? `\nMaterial de referencia disponible:\n${materialContext}\n`
    : ''

  const referencesInstruction = materialContext
    ? `4. Cita secciones específicas del material que el estudiante debería revisar`
    : ''

  const referencesFormat = materialContext
    ? `,\n  "references": [{"material": "string", "section": "string", "reason": "string"}]`
    : ''

  const prompt = `Evalúa esta respuesta de estudiante:

Pregunta: ${question.question_text}
Respuesta del estudiante: ${userAnswer}
Respuesta modelo: ${modelAnswer}
Puntos máximos: ${question.points}
${materialSection}
Proporciona:
1. Puntuación (0-${question.points})
2. Feedback constructivo (2-3 párrafos)
3. Aspectos correctos y a mejorar
${referencesInstruction}

Responde SOLAMENTE con un JSON válido en este formato exacto:
{
  "score": number,
  "feedback": "string",
  "strengths": ["string"],
  "improvements": ["string"]${referencesFormat}
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

export async function checkSynonyms(
  correctAnswer: string,
  userAnswer: string
): Promise<SynonymResult> {
  const prompt = `Determina si la respuesta del estudiante es sinónimo o equivalente semántico de la respuesta correcta.

Respuesta correcta: "${correctAnswer}"
Respuesta del estudiante: "${userAnswer}"

Responde SOLAMENTE con un JSON válido:
{
  "isAccepted": boolean,
  "reason": "string"
}`

  const system = 'Eres un evaluador lingüístico. Evalúa equivalencia semántica. Responde solo con JSON válido.'

  try {
    const responseText = await callClaudeAI(prompt, system, 500)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No se encontró JSON en la respuesta')
    return JSON.parse(jsonMatch[0]) as SynonymResult
  } catch {
    return { isAccepted: false, reason: 'No se pudo verificar sinónimos' }
  }
}
