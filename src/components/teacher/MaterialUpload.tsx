import { useState } from 'react'
import { FileInput } from '../common/FileInput'
import { Button } from '../common/Button'
import { Card } from '../common/Card'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { uploadMaterial, deleteMaterial, getMaterialsByExam } from '../../services/materialService'
import { useAuth } from '../../hooks/useAuth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Material } from '../../types/exam'
import toast from 'react-hot-toast'

interface MaterialUploadProps {
  examId: string
}

const FILE_TYPE_ICONS: Record<string, string> = {
  pdf: 'PDF',
  docx: 'DOC',
  doc: 'DOC',
  pptx: 'PPT',
  ppt: 'PPT',
  txt: 'TXT',
}

export function MaterialUpload({ examId }: MaterialUploadProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [uploading, setUploading] = useState(false)

  const { data: materials = [], isLoading } = useQuery({
    queryKey: ['materials', examId],
    queryFn: () => getMaterialsByExam(examId),
  })

  const deleteMut = useMutation({
    mutationFn: (material: Material) => deleteMaterial(material.id, material.file_path),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials', examId] })
      toast.success('Material eliminado')
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar: ${error.message}`)
    },
  })

  const handleFiles = async (files: File[]) => {
    if (!user) return
    setUploading(true)

    try {
      for (const file of files) {
        await uploadMaterial(examId, file, user.id)
      }
      queryClient.invalidateQueries({ queryKey: ['materials', examId] })
      toast.success(files.length === 1 ? 'Material subido' : `${files.length} archivos subidos`)
    } catch (error) {
      toast.error(`Error al subir: ${(error as Error).message}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card>
      <h3 className="mb-4 text-lg font-semibold text-secondary-900">
        Material de referencia
      </h3>
      <p className="mb-4 text-sm text-secondary-500">
        Sube PDFs o documentos que serán usados como contexto para la calificación con IA.
      </p>

      <FileInput
        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
        multiple
        onFiles={handleFiles}
        disabled={uploading}
      />

      {uploading && (
        <div className="mt-3 flex items-center gap-2 text-sm text-primary-600">
          <LoadingSpinner size="sm" />
          <span>Subiendo archivo...</span>
        </div>
      )}

      {isLoading ? (
        <div className="mt-4 flex justify-center">
          <LoadingSpinner size="sm" className="text-secondary-400" />
        </div>
      ) : materials.length > 0 ? (
        <div className="mt-4 space-y-2">
          {materials.map((material) => (
            <div
              key={material.id}
              className="flex items-center justify-between rounded-lg border border-secondary-200 p-3"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded bg-primary-100 text-xs font-bold text-primary-700">
                  {FILE_TYPE_ICONS[material.file_type] || 'FILE'}
                </span>
                <div>
                  <p className="text-sm font-medium text-secondary-900">{material.title}</p>
                  <p className="text-xs text-secondary-400">{material.file_type.toUpperCase()}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteMut.mutate(material)}
                loading={deleteMut.isPending}
              >
                Eliminar
              </Button>
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  )
}
