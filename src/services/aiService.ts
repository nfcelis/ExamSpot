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
  console.log('Calling Edge Function claude-ai...')

  // Get current session for auth
  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData?.session?.access_token

  const { data, error } = await supabase.functions.invoke('claude-ai', {
    body: { prompt, system, maxTokens },
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  })

  console.log('Edge Function response - data:', data)
  console.log('Edge Function response - error:', error)

  if (error) {
    // Try to get more details from the error
    const errorDetails = JSON.stringify(error, null, 2)
    console.error('Full error object:', errorDetails)
    throw new Error(`Error al llamar a AI: ${error.message || errorDetails}`)
  }

  if (!data) throw new Error('No data returned from Edge Function')

  if (data.error) {
    console.error('Edge Function returned error:', data.error, data.details)
    throw new Error(`Edge Function error: ${data.error} - ${JSON.stringify(data.details || {})}`)
  }

  const response = data as ClaudeResponse
  if (!response.content) throw new Error('No content in response')

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
    console.log('AI Response:', responseText)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No se encontró JSON en la respuesta')
    return JSON.parse(jsonMatch[0]) as GradeResult
  } catch (error) {
    console.error('AI Grading Error:', error)
    return {
      score: 0,
      feedback: `La evaluación automática con IA no está disponible en este momento. Error: ${error instanceof Error ? error.message : String(error)}`,
      strengths: [],
      improvements: ['La evaluación automática no pudo completarse'],
    }
  }
}

export interface GeneratedQuestion {
  type: 'multiple_choice' | 'open_ended' | 'fill_blank' | 'matching'
  question_text: string
  options?: string[]
  correct_answer: unknown
  terms?: Array<{ term: string; definition: string }>
  points: number
  explanation?: string
  difficulty?: string
  reference_material?: string
  reference_page?: string
}

export interface GenerateQuestionsParams {
  materialContent: string
  questionCount: number
  questionTypes: Array<'multiple_choice' | 'open_ended' | 'fill_blank' | 'matching'>
  difficulty: 'easy' | 'medium' | 'hard'
}

export async function generateQuestionsFromMaterial(
  params: GenerateQuestionsParams
): Promise<GeneratedQuestion[]> {
  const { materialContent, questionCount, questionTypes, difficulty } = params

  const difficultyLabels = {
    easy: 'fácil (conceptos básicos, definiciones simples)',
    medium: 'medio (aplicación de conceptos, relaciones)',
    hard: 'difícil (análisis, síntesis, casos complejos)',
  }

  const typeDescriptions = questionTypes.map((t) => {
    switch (t) {
      case 'multiple_choice':
        return 'Opción múltiple: 4 opciones con una correcta (correct_answer es el índice 0-3)'
      case 'open_ended':
        return 'Respuesta abierta: pregunta que requiere explicación (correct_answer es la respuesta modelo)'
      case 'fill_blank':
        return 'Rellenar espacios: texto con ___ para completar (correct_answer es array de respuestas)'
      case 'matching':
        return 'Emparejar: términos con definiciones (usar campo terms con {term, definition})'
    }
  }).join('\n')

  const prompt = `Genera ${questionCount} preguntas de examen basadas en el siguiente material educativo.

MATERIAL:
${materialContent}

REQUISITOS:
- Dificultad: ${difficultyLabels[difficulty]}
- Tipos de preguntas a generar (distribuir equitativamente):
${typeDescriptions}

FORMATO DE RESPUESTA:
Responde SOLO con un array JSON válido. Cada pregunta debe tener:
{
  "type": "multiple_choice" | "open_ended" | "fill_blank" | "matching",
  "question_text": "texto de la pregunta",
  "options": ["op1", "op2", "op3", "op4"], // solo para multiple_choice
  "correct_answer": valor, // índice para MC, string para open_ended, array para fill_blank
  "terms": [{"term": "...", "definition": "..."}], // solo para matching
  "points": 10,
  "explanation": "explicación de la respuesta correcta"
}

IMPORTANTE:
- Las preguntas deben basarse ÚNICAMENTE en el material proporcionado
- Cada pregunta debe ser clara y sin ambigüedades
- Para fill_blank, usa ___ en question_text donde va cada respuesta
- Para matching, incluye 3-5 pares de términos

Responde SOLO con el array JSON, sin texto adicional:`

  const system = 'Eres un experto en educación que crea preguntas de examen. Genera preguntas claras, relevantes y pedagógicamente sólidas. Responde siempre en español y solo con JSON válido.'

  try {
    const responseText = await callClaudeAI(prompt, system, 4000)
    console.log('Generated questions response:', responseText)

    // Extract JSON array from response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('No se encontró JSON en la respuesta')

    const questions = JSON.parse(jsonMatch[0]) as GeneratedQuestion[]

    // Validate and clean up questions
    return questions.map((q) => ({
      ...q,
      points: q.points || 10,
      explanation: q.explanation || '',
    }))
  } catch (error) {
    console.error('Error generating questions:', error)
    throw new Error(`Error al generar preguntas: ${error instanceof Error ? error.message : String(error)}`)
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
