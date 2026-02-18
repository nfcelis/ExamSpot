import { useState, useRef, useEffect } from 'react'
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
        onClick={onClose}
        aria-label="Cerrar"
      >
        ✕
      </button>

      {/* Zoom controls */}
      <div
        className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/60 px-4 py-2 backdrop-blur-sm"
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

      {/* Image */}
      <div className="overflow-auto" onClick={(e) => e.stopPropagation()}>
        <img
          src={src}
          alt=""
          className="rounded-lg object-contain shadow-2xl transition-transform duration-150"
          style={{
            maxHeight: scale === 1 ? '85vh' : 'none',
            maxWidth: scale === 1 ? '85vw' : 'none',
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
          }}
        />
      </div>
    </div>
  )
}

export function SafeHtml({ html, className, inline = false }: SafeHtmlProps) {
  const [zoomedSrc, setZoomedSrc] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // If no HTML tags detected, render as plain text
  if (!html || !html.includes('<')) {
    return <span className={className}>{html}</span>
  }

  const clean = DOMPurify.sanitize(html, purifyConfig)

  return (
    <>
      <ImageLightboxAttacher
        html={clean}
        className={className}
        inline={inline}
        containerRef={containerRef}
        onImageClick={setZoomedSrc}
      />
      {zoomedSrc && (
        <ImageLightbox src={zoomedSrc} onClose={() => setZoomedSrc(null)} />
      )}
    </>
  )
}

// Separate component so we can use useEffect with stable deps
function ImageLightboxAttacher({
  html,
  className,
  inline,
  containerRef,
  onImageClick,
}: {
  html: string
  className?: string
  inline: boolean
  containerRef: React.RefObject<HTMLDivElement | null>
  onImageClick: (src: string) => void
}) {
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const cleanups: Array<() => void> = []

    // Block <a> tags that wrap images from navigating (D2L HTML wraps images in links)
    container.querySelectorAll<HTMLAnchorElement>('a').forEach((a) => {
      if (a.querySelector('img')) {
        const blockNav = (e: MouseEvent) => {
          e.preventDefault()
          e.stopPropagation()
        }
        a.addEventListener('click', blockNav)
        cleanups.push(() => a.removeEventListener('click', blockNav))
      }
    })

    // Add zoom handler to every image
    container.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
      img.style.cursor = 'zoom-in'
      const handler = (e: MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        onImageClick(img.src)
      }
      img.addEventListener('click', handler)
      cleanups.push(() => img.removeEventListener('click', handler))
    })

    return () => cleanups.forEach((fn) => fn())
  }, [html, containerRef, onImageClick])

  if (inline) {
    return (
      <span
        ref={containerRef as React.RefObject<HTMLSpanElement>}
        className={`question-html ${className || ''}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    )
  }

  return (
    <div
      ref={containerRef}
      className={`question-html ${className || ''}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
