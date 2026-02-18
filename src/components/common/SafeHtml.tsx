import DOMPurify from 'dompurify'

interface SafeHtmlProps {
  html: string
  className?: string
  inline?: boolean
}

// Configure DOMPurify to allow images
const purifyConfig = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'sub', 'sup',
    'img', 'span', 'div', 'ul', 'ol', 'li', 'table', 'thead',
    'tbody', 'tr', 'th', 'td', 'a', 'code', 'pre', 'blockquote',
  ],
  ALLOWED_ATTR: [
    'src', 'alt', 'width', 'height', 'class', 'style',
    'href', 'target', 'rel',
  ],
}

export function SafeHtml({ html, className, inline = false }: SafeHtmlProps) {
  // If no HTML tags detected, render as plain text
  if (!html || !html.includes('<')) {
    if (inline) {
      return <span className={className}>{html}</span>
    }
    return <span className={className}>{html}</span>
  }

  const clean = DOMPurify.sanitize(html, purifyConfig)

  if (inline) {
    return (
      <span
        className={`question-html ${className || ''}`}
        dangerouslySetInnerHTML={{ __html: clean }}
      />
    )
  }

  return (
    <div
      className={`question-html ${className || ''}`}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  )
}
