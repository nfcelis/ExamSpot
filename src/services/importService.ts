import { supabase } from '../lib/supabase'
import type { QuestionType, MatchingTerm } from '../types/question'
import type { CreateQuestionBankData } from './questionBankService'

interface ImportedQuestion {
  id: number
  section: string
  type: string
  question: string
  options?: string[]
  correct_answers?: string[]
  matching_pairs?: { premise: string; response: string }[]
  ordered_items?: string[]
}

function mapQuestionType(jsonType: string): QuestionType {
  switch (jsonType) {
    case 'Multiple Choice':
    case 'Multi-Select':
    case 'True/False':
      return 'multiple_choice'
    case 'Fill in the Blanks':
      return 'fill_blank'
    case 'Matching':
      return 'matching'
    case 'Short Answer':
      return 'open_ended'
    case 'Ordering':
      return 'open_ended'
    default:
      return 'open_ended'
  }
}

function transformQuestion(q: ImportedQuestion): CreateQuestionBankData {
  const dbType = mapQuestionType(q.type)
  const tags = [q.type] // Keep original type as tag

  switch (q.type) {
    case 'Multiple Choice': {
      const options = q.options || []
      const correctIndex = options.findIndex(
        (opt) => q.correct_answers?.includes(opt)
      )
      return {
        category: q.section,
        tags,
        type: dbType,
        question_text: q.question,
        options,
        correct_answer: correctIndex >= 0 ? correctIndex : 0,
        points: 10,
        is_public: false,
      }
    }

    case 'Multi-Select': {
      const options = q.options || []
      const correctIndices = (q.correct_answers || [])
        .map((ans) => options.indexOf(ans))
        .filter((i) => i >= 0)
      return {
        category: q.section,
        tags,
        type: dbType,
        question_text: q.question,
        options,
        correct_answer: correctIndices,
        points: 10,
        is_public: false,
      }
    }

    case 'True/False': {
      const options = ['Verdadero', 'Falso']
      const correctAnswer = q.correct_answers?.[0]
      const correctIndex = correctAnswer === 'True' ? 0 : 1
      return {
        category: q.section,
        tags,
        type: dbType,
        question_text: q.question,
        options,
        correct_answer: correctIndex,
        points: 10,
        is_public: false,
      }
    }

    case 'Fill in the Blanks': {
      return {
        category: q.section,
        tags,
        type: dbType,
        question_text: q.question,
        options: null,
        correct_answer: q.correct_answers || [],
        points: 10,
        is_public: false,
      }
    }

    case 'Matching': {
      const terms: MatchingTerm[] = (q.matching_pairs || []).map((p) => ({
        term: p.premise,
        definition: p.response,
      }))
      return {
        category: q.section,
        tags,
        type: dbType,
        question_text: q.question,
        options: null,
        correct_answer: null,
        terms,
        points: 10,
        is_public: false,
      }
    }

    case 'Short Answer': {
      return {
        category: q.section,
        tags,
        type: dbType,
        question_text: q.question,
        options: null,
        correct_answer: q.correct_answers?.[0] || '',
        points: 10,
        is_public: false,
      }
    }

    case 'Ordering': {
      // Store as open_ended with the correct order as the answer
      return {
        category: q.section,
        tags,
        type: dbType,
        question_text: q.question,
        options: null,
        correct_answer: q.ordered_items || [],
        points: 10,
        is_public: false,
      }
    }

    default:
      return {
        category: q.section,
        tags,
        type: 'open_ended',
        question_text: q.question,
        options: null,
        correct_answer: q.correct_answers?.[0] || '',
        points: 10,
        is_public: false,
      }
  }
}

export interface ImportResult {
  total: number
  imported: number
  skipped: number
  duplicates: number
  errors: string[]
}

export async function importQuestionsFromJSON(
  jsonData: ImportedQuestion[],
  sectionFilter?: string
): Promise<ImportResult> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const filtered = sectionFilter
    ? jsonData.filter((q) => q.section === sectionFilter)
    : jsonData

  const result: ImportResult = {
    total: filtered.length,
    imported: 0,
    skipped: 0,
    duplicates: 0,
    errors: [],
  }

  // Fetch existing questions to skip duplicates
  const { data: existing } = await supabase
    .from('question_bank')
    .select('question_text')
    .eq('created_by', user.id)

  const existingTexts = new Set(
    (existing || []).map((q) => q.question_text.toLowerCase().trim())
  )

  // Filter out duplicates
  const toImport: { row: Record<string, unknown>; originalId: number }[] = []
  for (const q of filtered) {
    const key = q.question.toLowerCase().trim()
    if (existingTexts.has(key)) {
      result.duplicates++
      continue
    }
    existingTexts.add(key) // prevent duplicates within the file too
    toImport.push({
      row: { ...transformQuestion(q), created_by: user.id },
      originalId: q.id,
    })
  }

  // Process in batches of 20
  const BATCH_SIZE = 20
  for (let i = 0; i < toImport.length; i += BATCH_SIZE) {
    const batch = toImport.slice(i, i + BATCH_SIZE)
    const rows = batch.map((b) => b.row)

    const { error } = await supabase.from('question_bank').insert(rows)

    if (error) {
      // Batch failed: retry one by one to save what we can
      for (const item of batch) {
        const { error: singleError } = await supabase
          .from('question_bank')
          .insert(item.row)

        if (singleError) {
          result.skipped++
          result.errors.push(`Pregunta #${item.originalId}: ${singleError.message}`)
        } else {
          result.imported++
        }
      }
    } else {
      result.imported += batch.length
    }
  }

  return result
}

export function parseQuestionsJSON(text: string): ImportedQuestion[] {
  const data = JSON.parse(text)
  if (!Array.isArray(data)) throw new Error('El archivo debe contener un array de preguntas')
  return data as ImportedQuestion[]
}

export function getSectionsFromJSON(questions: ImportedQuestion[]): string[] {
  const sections = new Set<string>()
  questions.forEach((q) => {
    if (q.section) sections.add(q.section)
  })
  return Array.from(sections).sort()
}
