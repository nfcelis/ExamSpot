/**
 * Extract text content from various file types (PDF, DOCX, PPTX, TXT)
 */

export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase()

  if (name.endsWith('.txt')) {
    return file.text()
  }

  if (name.endsWith('.pdf')) {
    return extractFromPDF(file)
  }

  if (name.endsWith('.docx')) {
    return extractFromDOCX(file)
  }

  if (name.endsWith('.pptx')) {
    return extractFromPPTX(file)
  }

  throw new Error(`Tipo de archivo no soportado: ${name.split('.').pop()}`)
}

async function extractFromPDF(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist')

  // Try multiple approaches for worker setup
  try {
    const workerUrl = await import(/* @vite-ignore */ 'pdfjs-dist/build/pdf.worker.min.mjs?url')
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl.default
  } catch {
    // Fallback: use worker from node_modules via URL
    try {
      const workerBlob = new Blob(
        [`importScripts("${new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href}")`],
        { type: 'application/javascript' }
      )
      pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(workerBlob)
    } catch {
      // Last resort: disable worker (slower but works)
      pdfjsLib.GlobalWorkerOptions.workerSrc = ''
    }
  }

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  const textParts: string[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
    if (pageText.trim()) {
      textParts.push(pageText)
    }
  }

  return textParts.join('\n\n')
}

async function extractFromDOCX(file: File): Promise<string> {
  const mammoth = await import('mammoth')
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  return result.value
}

async function extractFromPPTX(file: File): Promise<string> {
  // PPTX is a ZIP containing XML files. We extract text from slide XMLs.
  const JSZip = (await import('jszip')).default
  const arrayBuffer = await file.arrayBuffer()
  const zip = await JSZip.loadAsync(arrayBuffer)

  const textParts: string[] = []

  // Slides are in ppt/slides/slide1.xml, slide2.xml, etc.
  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)/)?.[1] || '0')
      const numB = parseInt(b.match(/slide(\d+)/)?.[1] || '0')
      return numA - numB
    })

  for (const slidePath of slideFiles) {
    const xml = await zip.files[slidePath].async('text')
    // Extract text between <a:t> tags
    const texts = xml.match(/<a:t>([^<]*)<\/a:t>/g)
    if (texts) {
      const slideText = texts
        .map((t) => t.replace(/<\/?a:t>/g, ''))
        .join(' ')
      if (slideText.trim()) {
        textParts.push(slideText)
      }
    }
  }

  return textParts.join('\n\n')
}

export function getSupportedExtensions(): string {
  return '.pdf,.docx,.pptx,.txt'
}

export function getFileTypeLabel(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'pdf': return 'PDF'
    case 'docx': return 'Word'
    case 'pptx': return 'PowerPoint'
    case 'txt': return 'Texto'
    default: return ext?.toUpperCase() || 'Archivo'
  }
}
