import { useRef, useState, type DragEvent } from 'react'
import { cn } from '../../lib/utils'

interface FileInputProps {
  label?: string
  error?: string
  accept?: string
  multiple?: boolean
  onFiles: (files: File[]) => void
  disabled?: boolean
  className?: string
}

export function FileInput({
  label,
  error,
  accept,
  multiple = false,
  onFiles,
  disabled = false,
  className,
}: FileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    if (!disabled) setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (disabled) return

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      onFiles(multiple ? files : [files[0]])
    }
  }

  const handleChange = () => {
    const files = Array.from(inputRef.current?.files || [])
    if (files.length > 0) {
      onFiles(files)
    }
    // Reset input so the same file can be selected again
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="mb-1 block text-sm font-medium text-secondary-700">
          {label}
        </label>
      )}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors',
          isDragging
            ? 'border-primary-400 bg-primary-50'
            : 'border-secondary-300 hover:border-primary-300 hover:bg-secondary-50',
          disabled && 'cursor-not-allowed opacity-50',
          error && 'border-danger-400'
        )}
      >
        <svg
          className="mb-2 h-8 w-8 text-secondary-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <p className="text-sm text-secondary-600">
          Arrastra archivos aquí o <span className="font-medium text-primary-600">haz clic para seleccionar</span>
        </p>
        {accept && (
          <p className="mt-1 text-xs text-secondary-400">
            Formatos: {accept}
          </p>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
      />
      {error && <p className="mt-1 text-sm text-danger-600">{error}</p>}
    </div>
  )
}
