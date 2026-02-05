import { supabase } from '../lib/supabase'
import type { Material } from '../types/exam'

export async function uploadMaterial(
  examId: string,
  file: File,
  uploadedBy: string
): Promise<Material> {
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'bin'
  const filePath = `${examId}/${crypto.randomUUID()}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('exam-materials')
    .upload(filePath, file)

  if (uploadError) throw new Error(`Error al subir archivo: ${uploadError.message}`)

  const { data, error } = await supabase
    .from('materials')
    .insert({
      exam_id: examId,
      title: file.name,
      file_path: filePath,
      file_type: fileExt,
      uploaded_by: uploadedBy,
    })
    .select()
    .single()

  if (error) {
    // Clean up uploaded file on DB error
    await supabase.storage.from('exam-materials').remove([filePath])
    throw error
  }

  return data as Material
}

export async function getMaterialsByExam(examId: string): Promise<Material[]> {
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .eq('exam_id', examId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Material[]
}

export async function deleteMaterial(id: string, filePath: string): Promise<void> {
  await supabase.storage.from('exam-materials').remove([filePath])

  const { error } = await supabase
    .from('materials')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function getMaterialDownloadUrl(filePath: string): Promise<string> {
  const { data } = supabase.storage
    .from('exam-materials')
    .getPublicUrl(filePath)

  return data.publicUrl
}

export async function getMaterialTextContent(examId: string): Promise<string> {
  const materials = await getMaterialsByExam(examId)
  if (materials.length === 0) return ''

  // Return material metadata as context (actual text extraction would need server-side processing)
  return materials
    .map((m) => `[Material: ${m.title} (${m.file_type})]`)
    .join('\n')
}
