import { useState, useEffect, useMemo } from 'react'
import { useAuthStore } from '../../store/authStore'
import { getAllUsers, updateUserRole } from '../../services/adminService'
import type { Profile, UserRole } from '../../types/user'
import { PageLayout } from '../../components/layout/PageLayout'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

const ROLE_LABELS: Record<UserRole, string> = {
  student: 'Estudiante',
  teacher: 'Profesor',
  admin: 'Administrador',
}

const ROLE_COLORS: Record<UserRole, string> = {
  student: 'bg-blue-100 text-blue-700',
  teacher: 'bg-emerald-100 text-emerald-700',
  admin: 'bg-purple-100 text-purple-700',
}

function UserInitials({ name, email }: { name: string | null; email: string }) {
  const text = name || email
  const initials = text
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
      {initials}
    </div>
  )
}

export function UserManagementPage() {
  const { profile: currentProfile } = useAuthStore()
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all')
  const [confirmChange, setConfirmChange] = useState<{
    user: Profile
    newRole: UserRole
  } | null>(null)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const data = await getAllUsers()
      setUsers(data)
    } catch {
      toast.error('Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        !search ||
        u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      const matchRole = roleFilter === 'all' || u.role === roleFilter
      return matchSearch && matchRole
    })
  }, [users, search, roleFilter])

  const counts = useMemo(
    () => ({
      all: users.length,
      student: users.filter((u) => u.role === 'student').length,
      teacher: users.filter((u) => u.role === 'teacher').length,
      admin: users.filter((u) => u.role === 'admin').length,
    }),
    [users]
  )

  const handleRoleSelect = (user: Profile, newRole: UserRole) => {
    if (user.id === currentProfile?.id) {
      toast.error('No puedes cambiar tu propio rol')
      return
    }
    if (user.is_super_admin) {
      toast.error('El rol del super administrador no puede modificarse')
      return
    }
    if (newRole === user.role) return
    setConfirmChange({ user, newRole })
  }

  const confirmRoleChange = async () => {
    if (!confirmChange) return
    const { user, newRole } = confirmChange
    setConfirmChange(null)
    setUpdatingId(user.id)
    try {
      await updateUserRole(user.id, newRole)
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
      )
      toast.success(`Rol de ${user.full_name || user.email} actualizado a ${ROLE_LABELS[newRole]}`)
    } catch {
      toast.error('Error al actualizar el rol')
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading) {
    return (
      <PageLayout>
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Gestión de Usuarios</h1>
          <p className="mt-1 text-sm text-secondary-500">
            Acceso exclusivo del administrador principal. Aquí puedes ver y cambiar el rol de cualquier usuario.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(
            [
              { label: 'Total', value: counts.all, color: 'bg-secondary-50 text-secondary-700' },
              { label: 'Estudiantes', value: counts.student, color: 'bg-blue-50 text-blue-700' },
              { label: 'Profesores', value: counts.teacher, color: 'bg-emerald-50 text-emerald-700' },
              { label: 'Admins', value: counts.admin, color: 'bg-purple-50 text-purple-700' },
            ] as const
          ).map((s) => (
            <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-sm font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          <div className="flex gap-2">
            {(['all', 'student', 'teacher', 'admin'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  roleFilter === r
                    ? 'bg-primary-600 text-white'
                    : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
                }`}
              >
                {r === 'all' ? 'Todos' : ROLE_LABELS[r]}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-secondary-200 bg-white">
          {filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-secondary-500">
              No se encontraron usuarios con esos filtros.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-secondary-50 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">
                <tr>
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Rol actual</th>
                  <th className="px-4 py-3">Miembro desde</th>
                  <th className="px-4 py-3">Cambiar rol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {filtered.map((user) => {
                  const isSelf = user.id === currentProfile?.id
                  const isSuperAdmin = user.is_super_admin
                  const isUpdating = updatingId === user.id
                  const locked = isSelf || isSuperAdmin

                  return (
                    <tr key={user.id} className="hover:bg-secondary-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <UserInitials name={user.full_name} email={user.email} />
                          <div>
                            <p className="font-medium text-secondary-900">
                              {user.full_name || '—'}
                              {isSelf && (
                                <span className="ml-2 rounded bg-secondary-200 px-1.5 py-0.5 text-xs text-secondary-600">
                                  Tú
                                </span>
                              )}
                              {isSuperAdmin && (
                                <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">
                                  Super Admin
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-secondary-600">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ROLE_COLORS[user.role]}`}>
                          {ROLE_LABELS[user.role]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-secondary-500">
                        {new Date(user.created_at).toLocaleDateString('es', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3">
                        {isUpdating ? (
                          <LoadingSpinner size="sm" />
                        ) : locked ? (
                          <span className="text-xs text-secondary-400">
                            {isSuperAdmin ? 'Protegido' : 'Tu cuenta'}
                          </span>
                        ) : (
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleSelect(user, e.target.value as UserRole)}
                            className="rounded-lg border border-secondary-300 px-2 py-1 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                          >
                            <option value="student">Estudiante</option>
                            <option value="teacher">Profesor</option>
                            <option value="admin">Administrador</option>
                          </select>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        <p className="text-center text-xs text-secondary-400">
          {filtered.length} de {users.length} usuarios mostrados
        </p>
      </div>

      {/* Confirmation modal */}
      {confirmChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-secondary-900">Confirmar cambio de rol</h2>
            <p className="mt-2 text-sm text-secondary-600">
              ¿Cambiar el rol de{' '}
              <strong>{confirmChange.user.full_name || confirmChange.user.email}</strong> a{' '}
              <strong>{ROLE_LABELS[confirmChange.newRole]}</strong>?
            </p>
            {confirmChange.newRole === 'admin' && (
              <p className="mt-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
                Este usuario tendrá acceso completo al banco de preguntas y herramientas de administración.
              </p>
            )}
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setConfirmChange(null)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-secondary-700 hover:bg-secondary-100"
              >
                Cancelar
              </button>
              <button
                onClick={confirmRoleChange}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
