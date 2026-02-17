import { useState, useEffect } from 'react'
import { getCategoryList } from '../../services/questionBankService'

interface QuestionFiltersProps {
  filters: Record<string, string>
  onChange: (filters: Record<string, string>) => void
  showStatus?: boolean
}

export function QuestionFilters({ filters, onChange, showStatus }: QuestionFiltersProps) {
  const [categories, setCategories] = useState<string[]>([])

  useEffect(() => {
    getCategoryList().then(setCategories).catch(() => {})
  }, [])

  const updateFilter = (key: string, value: string) => {
    const next = { ...filters }
    if (value) {
      next[key] = value
    } else {
      delete next[key]
    }
    onChange(next)
  }

  return (
    <div className="mb-6 flex flex-wrap gap-3">
      {showStatus && (
        <select
          value={filters.status || ''}
          onChange={(e) => updateFilter('status', e.target.value)}
          className="rounded-lg border border-secondary-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        >
          <option value="">Todos los estados</option>
          <option value="approved">Aprobadas</option>
          <option value="pending">Pendientes</option>
          <option value="rejected">Rechazadas</option>
        </select>
      )}

      <select
        value={filters.category || ''}
        onChange={(e) => updateFilter('category', e.target.value)}
        className="rounded-lg border border-secondary-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      >
        <option value="">Todas las categorías</option>
        {categories.map((cat) => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>

      <select
        value={filters.type || ''}
        onChange={(e) => updateFilter('type', e.target.value)}
        className="rounded-lg border border-secondary-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      >
        <option value="">Todos los tipos</option>
        <option value="multiple_choice">Opción Múltiple</option>
        <option value="open_ended">Respuesta Abierta</option>
        <option value="fill_blank">Rellenar Espacios</option>
        <option value="matching">Emparejar</option>
      </select>

      <select
        value={filters.difficulty || ''}
        onChange={(e) => updateFilter('difficulty', e.target.value)}
        className="rounded-lg border border-secondary-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      >
        <option value="">Todas las dificultades</option>
        <option value="easy">Fácil</option>
        <option value="medium">Medio</option>
        <option value="hard">Difícil</option>
      </select>

      <input
        type="text"
        placeholder="Buscar..."
        value={filters.search || ''}
        onChange={(e) => updateFilter('search', e.target.value)}
        className="rounded-lg border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      />

      {Object.keys(filters).length > 0 && (
        <button
          onClick={() => onChange({})}
          className="rounded-lg px-3 py-2 text-sm text-secondary-500 hover:bg-secondary-100 hover:text-secondary-700"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  )
}
