import { useState } from 'react'
import { Button } from '../common/Button'
import type { QuestionBankItem, QuestionType, QuestionDifficulty } from '../../types/question'

interface QuestionEditorProps {
  initialData?: Partial<QuestionBankItem>
  onSave: (data: any) => void
  onCancel: () => void
}

export function QuestionEditor({ initialData, onSave, onCancel }: QuestionEditorProps) {
  const [type, setType] = useState<QuestionType>(initialData?.type || 'multiple_choice')
  const [questionText, setQuestionText] = useState(initialData?.question_text || '')
  const [category, setCategory] = useState(initialData?.category || '')
  const [subcategory, setSubcategory] = useState(initialData?.subcategory || '')
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>(initialData?.difficulty || 'medium')
  const [tags, setTags] = useState(initialData?.tags?.join(', ') || '')
  const [explanation, setExplanation] = useState(initialData?.explanation || '')
  const [points, setPoints] = useState(initialData?.points || 10)
  const [referenceMaterial, setReferenceMaterial] = useState(initialData?.reference_material || '')
  const [referencePage, setReferencePage] = useState(initialData?.reference_page || '')

  // Multiple choice
  const [options, setOptions] = useState<string[]>(
    initialData?.options || ['', '', '', '']
  )
  const [correctIndex, setCorrectIndex] = useState<number>(
    typeof initialData?.correct_answer === 'number' ? initialData.correct_answer : 0
  )

  // Open ended
  const [modelAnswer, setModelAnswer] = useState(
    typeof initialData?.correct_answer === 'string' ? initialData.correct_answer : ''
  )

  // Fill blank
  const [blankAnswers, setBlankAnswers] = useState<string[]>(
    Array.isArray(initialData?.correct_answer) ? initialData.correct_answer as string[] : ['']
  )

  // Matching
  const [terms, setTerms] = useState<Array<{ term: string; definition: string }>>(
    initialData?.terms || [{ term: '', definition: '' }]
  )

  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!questionText.trim() || !category.trim()) {
      return
    }

    setSaving(true)

    let correctAnswer: unknown
    let termsData = null

    switch (type) {
      case 'multiple_choice':
        correctAnswer = correctIndex
        break
      case 'open_ended':
        correctAnswer = modelAnswer
        break
      case 'fill_blank':
        correctAnswer = blankAnswers.filter(a => a.trim())
        break
      case 'matching':
        correctAnswer = Object.fromEntries(terms.map(t => [t.term, t.definition]))
        termsData = terms.filter(t => t.term.trim() && t.definition.trim())
        break
    }

    const data = {
      type,
      question_text: questionText,
      category,
      subcategory: subcategory || null,
      difficulty,
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      explanation: explanation || null,
      points,
      options: type === 'multiple_choice' ? options.filter(o => o.trim()) : null,
      correct_answer: correctAnswer,
      terms: termsData,
      reference_material: referenceMaterial || null,
      reference_page: referencePage || null,
    }

    try {
      await onSave(data)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Type & Category */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-secondary-700">Tipo</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as QuestionType)}
            className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="multiple_choice">Opción Múltiple</option>
            <option value="open_ended">Respuesta Abierta</option>
            <option value="fill_blank">Rellenar Espacios</option>
            <option value="matching">Emparejar</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-secondary-700">Dificultad</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as QuestionDifficulty)}
            className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="easy">Fácil</option>
            <option value="medium">Medio</option>
            <option value="hard">Difícil</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-secondary-700">Categoría *</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="ej: Arquitectura Empresarial"
            className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-secondary-700">Subcategoría</label>
          <input
            type="text"
            value={subcategory}
            onChange={(e) => setSubcategory(e.target.value)}
            placeholder="ej: TOGAF"
            className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Question Text */}
      <div>
        <label className="mb-1 block text-sm font-medium text-secondary-700">Texto de la Pregunta *</label>
        <textarea
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          placeholder="Escribe la pregunta aquí..."
        />
      </div>

      {/* Type-specific fields */}
      {type === 'multiple_choice' && (
        <div>
          <label className="mb-2 block text-sm font-medium text-secondary-700">Opciones</label>
          {options.map((opt, idx) => (
            <div key={idx} className="mb-2 flex items-center gap-2">
              <input
                type="radio"
                name="correct"
                checked={correctIndex === idx}
                onChange={() => setCorrectIndex(idx)}
                className="h-4 w-4 text-primary-600"
              />
              <input
                type="text"
                value={opt}
                onChange={(e) => {
                  const next = [...options]
                  next[idx] = e.target.value
                  setOptions(next)
                }}
                placeholder={`Opción ${idx + 1}`}
                className="flex-1 rounded-lg border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              {options.length > 2 && (
                <button
                  onClick={() => {
                    const next = options.filter((_, i) => i !== idx)
                    setOptions(next)
                    if (correctIndex >= next.length) setCorrectIndex(0)
                  }}
                  className="text-secondary-400 hover:text-danger-600"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
          {options.length < 6 && (
            <button
              onClick={() => setOptions([...options, ''])}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              + Agregar opción
            </button>
          )}
        </div>
      )}

      {type === 'open_ended' && (
        <div>
          <label className="mb-1 block text-sm font-medium text-secondary-700">Respuesta Modelo</label>
          <textarea
            value={modelAnswer}
            onChange={(e) => setModelAnswer(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            placeholder="Respuesta modelo completa..."
          />
        </div>
      )}

      {type === 'fill_blank' && (
        <div>
          <label className="mb-1 block text-sm font-medium text-secondary-700">
            Respuestas (usa ___ en el texto de la pregunta)
          </label>
          {blankAnswers.map((ans, idx) => (
            <div key={idx} className="mb-2 flex items-center gap-2">
              <span className="text-sm text-secondary-500">Espacio {idx + 1}:</span>
              <input
                type="text"
                value={ans}
                onChange={(e) => {
                  const next = [...blankAnswers]
                  next[idx] = e.target.value
                  setBlankAnswers(next)
                }}
                className="flex-1 rounded-lg border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              {blankAnswers.length > 1 && (
                <button
                  onClick={() => setBlankAnswers(blankAnswers.filter((_, i) => i !== idx))}
                  className="text-secondary-400 hover:text-danger-600"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => setBlankAnswers([...blankAnswers, ''])}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            + Agregar espacio
          </button>
        </div>
      )}

      {type === 'matching' && (
        <div>
          <label className="mb-2 block text-sm font-medium text-secondary-700">Pares de Términos</label>
          {terms.map((t, idx) => (
            <div key={idx} className="mb-2 flex items-center gap-2">
              <input
                type="text"
                value={t.term}
                onChange={(e) => {
                  const next = [...terms]
                  next[idx] = { ...next[idx], term: e.target.value }
                  setTerms(next)
                }}
                placeholder="Término"
                className="flex-1 rounded-lg border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <span className="text-secondary-400">=</span>
              <input
                type="text"
                value={t.definition}
                onChange={(e) => {
                  const next = [...terms]
                  next[idx] = { ...next[idx], definition: e.target.value }
                  setTerms(next)
                }}
                placeholder="Definición"
                className="flex-1 rounded-lg border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              {terms.length > 1 && (
                <button
                  onClick={() => setTerms(terms.filter((_, i) => i !== idx))}
                  className="text-secondary-400 hover:text-danger-600"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => setTerms([...terms, { term: '', definition: '' }])}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            + Agregar par
          </button>
        </div>
      )}

      {/* Additional fields */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-secondary-700">Puntos</label>
          <input
            type="number"
            value={points}
            onChange={(e) => setPoints(Number(e.target.value))}
            min={1}
            max={100}
            className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-secondary-700">Material de Ref.</label>
          <input
            type="text"
            value={referenceMaterial}
            onChange={(e) => setReferenceMaterial(e.target.value)}
            placeholder="ej: Lectura 3"
            className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-secondary-700">Página/Sección</label>
          <input
            type="text"
            value={referencePage}
            onChange={(e) => setReferencePage(e.target.value)}
            placeholder="ej: Cap. 5, p. 45"
            className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-secondary-700">Tags (separados por coma)</label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="ej: adm, fase-a, stakeholders"
          className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-secondary-700">Explicación</label>
        <textarea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          placeholder="Explicación de la respuesta correcta..."
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 border-t border-secondary-200 pt-4">
        <Button variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} loading={saving}>
          {initialData ? 'Guardar Cambios' : 'Crear Pregunta'}
        </Button>
      </div>
    </div>
  )
}
