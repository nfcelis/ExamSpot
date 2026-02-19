import { useState, useEffect } from 'react'
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

function ImageLightbox({ src, onClose }: { src: string; onClose: () => void }) {
  const [scale, setScale] = useState(1)
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === '+' || e.key === '=') setScale(s => Math.min(s + 0.25, 4))
      if (e.key === '-') setScale(s => Math.max(s - 0.25, 0.5))
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const zoomIn = (e: React.MouseEvent) => { e.stopPropagation(); setScale(s => Math.min(s + 0.25, 4)) }
  const zoomOut = (e: React.MouseEvent) => { e.stopPropagation(); setScale(s => Math.max(s - 0.25, 0.5)) }
  const reset = (e: React.MouseEvent) => { e.stopPropagation(); setScale(1) }

  // Use explicit pixel dimensions (not transform: scale) so overflow-auto can scroll properly.
  // Compute a "fit" scale that constrains the image at scale=1 to 85% of the viewport,
  // then multiply by the user's zoom level.
  let imgStyle: React.CSSProperties
  if (!naturalSize) {
    imgStyle = { maxWidth: '85vw', maxHeight: '85vh' }
  } else {
    const maxW = window.innerWidth * 0.85
    const maxH = window.innerHeight * 0.85
    const fitScale = Math.min(maxW / naturalSize.w, maxH / naturalSize.h, 1)
    imgStyle = {
      width: Math.round(naturalSize.w * fitScale * scale),
      height: Math.round(naturalSize.h * fitScale * scale),
      transition: 'width 150ms, height 150ms',
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
        onClick={onClose}
        aria-label="Cerrar"
      >
        ✕
      </button>

      {/* Zoom controls */}
      <div
        className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/60 px-4 py-2 backdrop-blur-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={zoomOut}
          disabled={scale <= 0.5}
          className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-bold text-white hover:bg-white/20 disabled:opacity-40"
          aria-label="Alejar"
        >
          −
        </button>
        <button
          onClick={reset}
          className="min-w-[3rem] text-center text-sm font-medium text-white hover:text-white/70"
          aria-label="Restablecer zoom"
        >
          {Math.round(scale * 100)}%
        </button>
        <button
          onClick={zoomIn}
          disabled={scale >= 4}
          className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-bold text-white hover:bg-white/20 disabled:opacity-40"
          aria-label="Acercar"
        >
          +
        </button>
      </div>

      {/* Scrollable image container */}
      <div
        className="overflow-auto rounded-lg"
        style={{ maxHeight: '90vh', maxWidth: '92vw' }}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt=""
          className="block rounded-lg shadow-2xl"
          style={imgStyle}
          onLoad={(e) => {
            const img = e.currentTarget
            setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight })
          }}
        />
      </div>
    </div>
  )
}

export function SafeHtml({ html, className, inline = false }: SafeHtmlProps) {
  const [zoomedSrc, setZoomedSrc] = useState<string | null>(null)

  // Use event delegation on the container instead of imperative addEventListener.
  // This is resilient to re-renders because React manages the onClick handler directly.
  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.tagName === 'IMG') {
      e.preventDefault()
      e.stopPropagation()
      setZoomedSrc((target as HTMLImageElement).src)
    }
  }

  if (!html || !html.includes('<')) {
    return <span className={className}>{html}</span>
  }

  const clean = DOMPurify.sanitize(html, purifyConfig)

  return (
    <>
      {inline ? (
        <span
          className={`question-html ${className || ''}`}
          dangerouslySetInnerHTML={{ __html: clean }}
          onClick={handleClick}
        />
      ) : (
        <div
          className={`question-html ${className || ''}`}
          dangerouslySetInnerHTML={{ __html: clean }}
          onClick={handleClick}
        />
      )}
      {zoomedSrc && <ImageLightbox src={zoomedSrc} onClose={() => setZoomedSrc(null)} />}
    </>
  )
}
