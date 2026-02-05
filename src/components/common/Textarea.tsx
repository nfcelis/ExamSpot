import { type TextareaHTMLAttributes, forwardRef } from 'react'
import { cn } from '../../lib/utils'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="mb-1 block text-sm font-medium text-secondary-700"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          className={cn(
            'block w-full rounded-lg border border-secondary-300 px-3 py-2 text-secondary-900 placeholder-secondary-400 shadow-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500',
            error && 'border-danger-500 focus:border-danger-500 focus:ring-danger-500',
            className
          )}
          rows={4}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-danger-600">{error}</p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
