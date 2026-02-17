import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageLayout } from '../../components/layout/PageLayout'
import { Card } from '../../components/common/Card'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { getQuestionBankStats, type QuestionBankStats } from '../../services/adminService'
import toast from 'react-hot-toast'

export function AdminDashboard() {
  const [stats, setStats] = useState<QuestionBankStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await getQuestionBankStats()
        setStats(data)
      } catch (err) {
        toast.error('Error al cargar estadísticas')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  return (
    <PageLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-secondary-900">
          Panel de Administración
        </h1>
        <p className="mt-1 text-secondary-500">
          Gestiona el banco de preguntas, genera con IA y configura prácticas.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/admin/questions">
          <Card className="cursor-pointer transition-all hover:border-primary-300 hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-secondary-900">Banco de Preguntas</p>
                <p className="text-xs text-secondary-500">Gestionar CRUD</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/admin/generate">
          <Card className="cursor-pointer transition-all hover:border-accent-300 hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-100 text-accent-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-secondary-900">Generar con IA</p>
                <p className="text-xs text-secondary-500">Desde material</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/admin/pending">
          <Card className="cursor-pointer transition-all hover:border-yellow-300 hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 text-yellow-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-secondary-900">Pendientes</p>
                <p className="text-xs text-secondary-500">Aprobar/Rechazar</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/admin/practice-config">
          <Card className="cursor-pointer transition-all hover:border-purple-300 hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-secondary-900">Configuración</p>
                <p className="text-xs text-secondary-500">Modo práctica</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <p className="text-sm text-secondary-500">Total Preguntas</p>
            <p className="mt-1 text-3xl font-bold text-secondary-900">{stats.total_questions}</p>
          </Card>
          <Card>
            <p className="text-sm text-secondary-500">Aprobadas</p>
            <p className="mt-1 text-3xl font-bold text-green-600">{stats.approved_count}</p>
          </Card>
          <Card>
            <p className="text-sm text-secondary-500">Pendientes</p>
            <p className="mt-1 text-3xl font-bold text-yellow-600">{stats.pending_count}</p>
          </Card>
          <Card>
            <p className="text-sm text-secondary-500">Categorías</p>
            <p className="mt-1 text-3xl font-bold text-primary-600">{stats.categories_count}</p>
          </Card>
          <Card>
            <p className="text-sm text-secondary-500">Generadas por IA</p>
            <p className="mt-1 text-3xl font-bold text-accent-600">{stats.ai_generated_count}</p>
          </Card>
          <Card>
            <p className="text-sm text-secondary-500">Creadas Manual</p>
            <p className="mt-1 text-3xl font-bold text-secondary-700">{stats.manual_count}</p>
          </Card>
          <Card>
            <p className="text-sm text-secondary-500">Importadas</p>
            <p className="mt-1 text-3xl font-bold text-purple-600">{stats.imported_count}</p>
          </Card>
          <Card>
            <p className="text-sm text-secondary-500">Rechazadas</p>
            <p className="mt-1 text-3xl font-bold text-danger-600">{stats.rejected_count}</p>
          </Card>
        </div>
      ) : (
        <Card className="py-8 text-center text-secondary-500">
          No se pudieron cargar las estadísticas.
        </Card>
      )}
    </PageLayout>
  )
}
