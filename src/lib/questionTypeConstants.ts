// Single source of truth for question type labels and options.
// Import from here instead of defining locally in each file.

export const QUESTION_TYPE_LABELS: Record<string, string> = {
  multiple_choice: 'Opción Múltiple',
  true_false: 'Verdadero/Falso',
  multi_select: 'Selección Múltiple',
  open_ended: 'Respuesta Abierta',
  written_response: 'Respuesta Escrita',
  fill_blank: 'Rellenar Espacios',
  matching: 'Emparejar',
  ordering: 'Ordenar',
}

// For filter dropdowns (includes empty "all" option)
export const QUESTION_TYPE_OPTIONS = [
  { value: '', label: 'Todos los tipos' },
  { value: 'multiple_choice', label: 'Opción Múltiple' },
  { value: 'true_false', label: 'Verdadero/Falso' },
  { value: 'multi_select', label: 'Selección Múltiple' },
  { value: 'open_ended', label: 'Respuesta Abierta' },
  { value: 'written_response', label: 'Respuesta Escrita' },
  { value: 'fill_blank', label: 'Rellenar Espacios' },
  { value: 'matching', label: 'Emparejar' },
  { value: 'ordering', label: 'Ordenar' },
]

// For AI generation type selection (no empty option)
export const AI_QUESTION_TYPE_OPTIONS = [
  { value: 'multiple_choice', label: 'Opción Múltiple' },
  { value: 'true_false', label: 'Verdadero/Falso' },
  { value: 'multi_select', label: 'Selección Múltiple' },
  { value: 'open_ended', label: 'Respuesta Abierta' },
  { value: 'written_response', label: 'Respuesta Escrita' },
  { value: 'fill_blank', label: 'Rellenar Espacios' },
  { value: 'matching', label: 'Emparejar' },
  { value: 'ordering', label: 'Ordenar' },
]
