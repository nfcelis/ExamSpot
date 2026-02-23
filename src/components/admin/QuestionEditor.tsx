import { useEffect, useRef, useState } from 'react'
import { Button } from '../common/Button'
import { supabase } from '../../lib/supabase'
import type { QuestionBankItem, QuestionType, QuestionDifficulty } from '../../types/question'
import { QUESTION_TYPE_LABELS } from '../../lib/questionTypeConstants'

interface QuestionEditorProps {
  initialData?: Partial<QuestionBankItem>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSave: (data: any) => void | Promise<void>
  onCancel: () => void
}

const QUESTION_TYPE_ENTRIES = Object.entries(QUESTION_TYPE_LABELS) as [QuestionType, string][]

async function uploadQuestionImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg'
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage
    .from('question-images')
    .upload(fileName, file, { cacheControl: '3600', upsert: false })
  if (error) throw error
  const { data } = supabase.storage.from('question-images').getPublicUrl(fileName)
  return data.publicUrl
}

const RemoveIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const PhotoIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
)

const inputCls = 'w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500'

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

  // Categories loaded from DB
  const [categoriesMap, setCategoriesMap] = useState<Record<string, string[]>>({})
  const categoryList = Object.keys(categoriesMap).sort()
  const subcategoryList = (category && categoriesMap[category]) ? [...categoriesMap[category]].sort() : []

  // Options (shared by multiple_choice, multi_select)
  const [options, setOptions] = useState<string[]>(initialData?.options || ['', '', '', ''])

  // Multiple choice: single correct index
  const [correctIndex, setCorrectIndex] = useState<number>(
    typeof initialData?.correct_answer === 'number' ? initialData.correct_answer : 0
  )

  // Multi select: multiple correct indices
  const [correctIndices, setCorrectIndices] = useState<number[]>(() => {
    const ca = initialData?.correct_answer
    if (Array.isArray(ca) && ca.length > 0 && typeof ca[0] === 'number') return ca as number[]
    return []
  })

  // True/False: 0 = Verdadero, 1 = Falso
  const [correctTF, setCorrectTF] = useState<0 | 1>(
    typeof initialData?.correct_answer === 'number' ? (initialData.correct_answer as 0 | 1) : 0
  )

  // Open ended / written response: model answer
  const [modelAnswer, setModelAnswer] = useState(
    typeof initialData?.correct_answer === 'string' ? initialData.correct_answer : ''
  )

  // Fill blank: array of accepted answers per blank
  const [blankAnswers, setBlankAnswers] = useState<string[]>(() => {
    const ca = initialData?.correct_answer
    if (Array.isArray(ca) && ca.length > 0 && typeof ca[0] === 'string') return ca as string[]
    return ['']
  })

  // Matching: term/definition pairs
  const [terms, setTerms] = useState<Array<{ term: string; definition: string }>>(
    initialData?.terms || [{ term: '', definition: '' }]
  )

  // Ordering: items in correct order
  const [orderingItems, setOrderingItems] = useState<string[]>(() => {
    if (initialData?.type === 'ordering' && initialData.options) return initialData.options
    return ['', '', '']
  })

  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Single file input for all image uploads
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageTargetRef = useRef<'question' | number>('question')

  // Load categories from DB on mount (all statuses, for admin suggestions)
  useEffect(() => {
    supabase
      .from('question_bank')
      .select('category, subcategory')
      .then(({ data }) => {
        if (!data) return
        const map: Record<string, Set<string>> = {}
        data.forEach((item: { category: string; subcategory: string | null }) => {
          if (!item.category) return
          if (!map[item.category]) map[item.category] = new Set()
          if (item.subcategory) map[item.category].add(item.subcategory)
        })
        const result: Record<string, string[]> = {}
        Object.keys(map).forEach(cat => { result[cat] = Array.from(map[cat]) })
        setCategoriesMap(result)
      })
  }, [])

  const triggerImageUpload = (target: 'question' | number) => {
    imageTargetRef.current = target
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setUploadError(null)
    setUploadingImage(true)
    try {
      const url = await uploadQuestionImage(file)
      const tag = `<img src="${url}" alt="imagen" style="max-width:100%;border-radius:0.375rem;" />`
      const target = imageTargetRef.current
      if (target === 'question') {
        setQuestionText(prev => prev + (prev ? '\n' : '') + tag)
      } else {
        const idx = target as number
        setOptions(prev => {
          const next = [...prev]
          next[idx] = (next[idx] ? next[idx] + ' ' : '') + tag
          return next
        })
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Error al subir la imagen')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async () => {
    if (!questionText.trim() || !category.trim()) return

    setSaving(true)
    let correctAnswer: unknown
    let termsData = null
    let optionsData: string[] | null = null

    switch (type) {
      case 'multiple_choice':
        correctAnswer = correctIndex
        optionsData = options.filter(o => o.trim())
        break
      case 'true_false':
        correctAnswer = correctTF
        optionsData = ['Verdadero', 'Falso']
        break
      case 'multi_select':
        correctAnswer = correctIndices
        optionsData = options.filter(o => o.trim())
        break
      case 'open_ended':
      case 'written_response':
        correctAnswer = modelAnswer
        break
      case 'fill_blank':
        correctAnswer = blankAnswers.filter(a => a.trim())
        break
      case 'matching':
        correctAnswer = Object.fromEntries(terms.map(t => [t.term, t.definition]))
        termsData = terms.filter(t => t.term.trim() && t.definition.trim())
        break
      case 'ordering':
        optionsData = orderingItems.filter(o => o.trim())
        correctAnswer = optionsData
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
      options: optionsData,
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

  const removeOption = (idx: number) => {
    const next = options.filter((_, i) => i !== idx)
    setOptions(next)
    if (correctIndex >= next.length) setCorrectIndex(0)
    setCorrectIndices(prev => prev.filter(i => i !== idx).map(i => (i > idx ? i - 1 : i)))
  }

  return (
    <div className="space-y-4">
      {/* Hidden file input for image uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Type & Difficulty */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-secondary-700">Tipo</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as QuestionType)}
            className={inputCls}
          >
            {QUESTION_TYPE_ENTRIES.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-secondary-700">Dificultad</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as QuestionDifficulty)}
            className={inputCls}
          >
            <option value="easy">Fácil</option>
            <option value="medium">Medio</option>
            <option value="hard">Difícil</option>
          </select>
        </div>
      </div>

      {/* Category & Subcategory (combo with datalist) */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-secondary-700">Categoría *</label>
          <input
            list="qe-categories"
            type="text"
            value={category}
            onChange={(e) => { setCategory(e.target.value); setSubcategory('') }}
            placeholder="ej: Arquitectura Empresarial"
            className={inputCls}
          />
          <datalist id="qe-categories">
            {categoryList.map(cat => <option key={cat} value={cat} />)}
          </datalist>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-secondary-700">Subcategoría</label>
          <input
            list="qe-subcategories"
            type="text"
            value={subcategory}
            onChange={(e) => setSubcategory(e.target.value)}
            placeholder="ej: TOGAF"
            className={inputCls}
          />
          <datalist id="qe-subcategories">
            {subcategoryList.map(sub => <option key={sub} value={sub} />)}
          </datalist>
        </div>
      </div>

      {/* Question Text */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-sm font-medium text-secondary-700">Texto de la Pregunta *</label>
          <button
            type="button"
            onClick={() => triggerImageUpload('question')}
            disabled={uploadingImage}
            title="Insertar imagen en la pregunta"
            className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-secondary-500 hover:bg-secondary-100 hover:text-secondary-700 disabled:opacity-50"
          >
            <PhotoIcon />
            {uploadingImage ? 'Subiendo...' : 'Imagen'}
          </button>
        </div>
        <textarea
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          rows={3}
          className={inputCls}
          placeholder="Escribe la pregunta aquí..."
        />
        <p className="mt-0.5 text-xs text-secondary-400">
          La imagen se inserta como HTML. Se verá renderizada al estudiante.
        </p>
        {uploadError && (
          <p className="mt-1 text-xs text-danger-600">Error al subir imagen: {uploadError}</p>
        )}
      </div>

      {/* ── Multiple Choice ── */}
      {type === 'multiple_choice' && (
        <div>
          <label className="mb-2 block text-sm font-medium text-secondary-700">
            Opciones <span className="font-normal text-secondary-400">(selecciona el radio de la correcta)</span>
          </label>
          {options.map((opt, idx) => (
            <div key={idx} className="mb-2 flex items-center gap-2">
              <input
                type="radio"
                name="qe-correct"
                checked={correctIndex === idx}
                onChange={() => setCorrectIndex(idx)}
                className="h-4 w-4 shrink-0 text-primary-600"
                title="Marcar como correcta"
              />
              <input
                type="text"
                value={opt}
                onChange={(e) => { const next = [...options]; next[idx] = e.target.value; setOptions(next) }}
                placeholder={`Opción ${idx + 1}`}
                className="flex-1 rounded-lg border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <button
                type="button"
                onClick={() => triggerImageUpload(idx)}
                disabled={uploadingImage}
                title="Insertar imagen en esta opción"
                className="shrink-0 rounded p-1 text-secondary-400 hover:bg-secondary-100 hover:text-secondary-600 disabled:opacity-50"
              >
                <PhotoIcon />
              </button>
              {options.length > 2 && (
                <button type="button" onClick={() => removeOption(idx)} className="shrink-0 text-secondary-400 hover:text-danger-600">
                  <RemoveIcon />
                </button>
              )}
            </div>
          ))}
          {options.length < 6 && (
            <button type="button" onClick={() => setOptions([...options, ''])} className="text-sm text-primary-600 hover:text-primary-700">
              + Agregar opción
            </button>
          )}
        </div>
      )}

      {/* ── True / False ── */}
      {type === 'true_false' && (
        <div>
          <label className="mb-2 block text-sm font-medium text-secondary-700">Respuesta Correcta</label>
          <div className="flex gap-3">
            {([0, 1] as const).map((val) => (
              <label
                key={val}
                className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-3 transition-colors ${
                  correctTF === val
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-secondary-200 hover:border-secondary-300 text-secondary-700'
                }`}
              >
                <input
                  type="radio"
                  checked={correctTF === val}
                  onChange={() => setCorrectTF(val)}
                  className="h-4 w-4 text-primary-600"
                />
                <span className="text-sm font-medium">{val === 0 ? 'Verdadero' : 'Falso'}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* ── Multi Select ── */}
      {type === 'multi_select' && (
        <div>
          <label className="mb-2 block text-sm font-medium text-secondary-700">
            Opciones <span className="font-normal text-secondary-400">(marca todas las correctas)</span>
          </label>
          {options.map((opt, idx) => (
            <div key={idx} className="mb-2 flex items-center gap-2">
              <input
                type="checkbox"
                checked={correctIndices.includes(idx)}
                onChange={() =>
                  setCorrectIndices(prev =>
                    prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
                  )
                }
                className="h-4 w-4 shrink-0 rounded text-primary-600"
                title="Marcar como correcta"
              />
              <input
                type="text"
                value={opt}
                onChange={(e) => { const next = [...options]; next[idx] = e.target.value; setOptions(next) }}
                placeholder={`Opción ${idx + 1}`}
                className="flex-1 rounded-lg border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <button
                type="button"
                onClick={() => triggerImageUpload(idx)}
                disabled={uploadingImage}
                title="Insertar imagen en esta opción"
                className="shrink-0 rounded p-1 text-secondary-400 hover:bg-secondary-100 hover:text-secondary-600 disabled:opacity-50"
              >
                <PhotoIcon />
              </button>
              {options.length > 2 && (
                <button type="button" onClick={() => removeOption(idx)} className="shrink-0 text-secondary-400 hover:text-danger-600">
                  <RemoveIcon />
                </button>
              )}
            </div>
          ))}
          {options.length < 6 && (
            <button type="button" onClick={() => setOptions([...options, ''])} className="text-sm text-primary-600 hover:text-primary-700">
              + Agregar opción
            </button>
          )}
        </div>
      )}

      {/* ── Open Ended / Written Response ── */}
      {(type === 'open_ended' || type === 'written_response') && (
        <div>
          <label className="mb-1 block text-sm font-medium text-secondary-700">Respuesta Modelo</label>
          <textarea
            value={modelAnswer}
            onChange={(e) => setModelAnswer(e.target.value)}
            rows={4}
            className={inputCls}
            placeholder="Respuesta modelo completa que usará la IA para calificar..."
          />
        </div>
      )}

      {/* ── Fill Blank ── */}
      {type === 'fill_blank' && (
        <div>
          <label className="mb-1 block text-sm font-medium text-secondary-700">
            Respuestas correctas{' '}
            <span className="font-normal text-secondary-400">(usa ___ en el texto de la pregunta para cada espacio)</span>
          </label>
          {blankAnswers.map((ans, idx) => (
            <div key={idx} className="mb-2 flex items-center gap-2">
              <span className="min-w-[5.5rem] shrink-0 text-sm text-secondary-500">Espacio {idx + 1}:</span>
              <input
                type="text"
                value={ans}
                onChange={(e) => { const next = [...blankAnswers]; next[idx] = e.target.value; setBlankAnswers(next) }}
                className="flex-1 rounded-lg border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              {blankAnswers.length > 1 && (
                <button type="button" onClick={() => setBlankAnswers(blankAnswers.filter((_, i) => i !== idx))} className="shrink-0 text-secondary-400 hover:text-danger-600">
                  <RemoveIcon />
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={() => setBlankAnswers([...blankAnswers, ''])} className="text-sm text-primary-600 hover:text-primary-700">
            + Agregar espacio
          </button>
        </div>
      )}

      {/* ── Matching ── */}
      {type === 'matching' && (
        <div>
          <label className="mb-2 block text-sm font-medium text-secondary-700">Pares de Términos</label>
          {terms.map((t, idx) => (
            <div key={idx} className="mb-2 flex items-center gap-2">
              <input
                type="text"
                value={t.term}
                onChange={(e) => { const next = [...terms]; next[idx] = { ...next[idx], term: e.target.value }; setTerms(next) }}
                placeholder="Término"
                className="flex-1 rounded-lg border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <span className="shrink-0 text-secondary-400">=</span>
              <input
                type="text"
                value={t.definition}
                onChange={(e) => { const next = [...terms]; next[idx] = { ...next[idx], definition: e.target.value }; setTerms(next) }}
                placeholder="Definición"
                className="flex-1 rounded-lg border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              {terms.length > 1 && (
                <button type="button" onClick={() => setTerms(terms.filter((_, i) => i !== idx))} className="shrink-0 text-secondary-400 hover:text-danger-600">
                  <RemoveIcon />
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={() => setTerms([...terms, { term: '', definition: '' }])} className="text-sm text-primary-600 hover:text-primary-700">
            + Agregar par
          </button>
        </div>
      )}

      {/* ── Ordering ── */}
      {type === 'ordering' && (
        <div>
          <label className="mb-1 block text-sm font-medium text-secondary-700">
            Elementos{' '}
            <span className="font-normal text-secondary-400">(escríbelos en el orden correcto)</span>
          </label>
          {orderingItems.map((item, idx) => (
            <div key={idx} className="mb-2 flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                {idx + 1}
              </span>
              <input
                type="text"
                value={item}
                onChange={(e) => { const next = [...orderingItems]; next[idx] = e.target.value; setOrderingItems(next) }}
                placeholder={`Elemento ${idx + 1}`}
                className="flex-1 rounded-lg border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              {orderingItems.length > 2 && (
                <button type="button" onClick={() => setOrderingItems(orderingItems.filter((_, i) => i !== idx))} className="shrink-0 text-secondary-400 hover:text-danger-600">
                  <RemoveIcon />
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={() => setOrderingItems([...orderingItems, ''])} className="text-sm text-primary-600 hover:text-primary-700">
            + Agregar elemento
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
            className={inputCls}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-secondary-700">Material de Ref.</label>
          <input
            type="text"
            value={referenceMaterial}
            onChange={(e) => setReferenceMaterial(e.target.value)}
            placeholder="ej: Lectura 3"
            className={inputCls}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-secondary-700">Página/Sección</label>
          <input
            type="text"
            value={referencePage}
            onChange={(e) => setReferencePage(e.target.value)}
            placeholder="ej: Cap. 5, p. 45"
            className={inputCls}
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
          className={inputCls}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-secondary-700">Explicación</label>
        <textarea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          rows={2}
          className={inputCls}
          placeholder="Explicación de la respuesta correcta (visible tras enviar el examen)..."
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
