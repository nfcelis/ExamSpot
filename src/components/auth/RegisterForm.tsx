import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../common/Button'
import { Input } from '../common/Input'
import { useState } from 'react'
import type { UserRole } from '../../types/user'

const registerSchema = z.object({
  fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string(),
  role: z.enum(['student', 'teacher'] as const),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

type RegisterFormData = z.infer<typeof registerSchema>

export function RegisterForm() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'student',
    },
  })

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    try {
      await signUp(data.email, data.password, data.role as UserRole, data.fullName)
      navigate('/login')
    } catch {
      // Error handled by useAuth toast
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        id="fullName"
        label="Nombre completo"
        type="text"
        placeholder="Juan Pérez"
        error={errors.fullName?.message}
        {...register('fullName')}
      />

      <Input
        id="email"
        label="Email"
        type="email"
        placeholder="tu@email.com"
        error={errors.email?.message}
        {...register('email')}
      />

      <Input
        id="password"
        label="Contraseña"
        type="password"
        placeholder="••••••••"
        error={errors.password?.message}
        {...register('password')}
      />

      <Input
        id="confirmPassword"
        label="Confirmar contraseña"
        type="password"
        placeholder="••••••••"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />

      <div>
        <label className="mb-1 block text-sm font-medium text-secondary-700">
          Rol
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="student"
              className="text-primary-600 focus:ring-primary-500"
              {...register('role')}
            />
            <span className="text-sm text-secondary-700">Estudiante</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="teacher"
              className="text-primary-600 focus:ring-primary-500"
              {...register('role')}
            />
            <span className="text-sm text-secondary-700">Profesor</span>
          </label>
        </div>
        {errors.role && (
          <p className="mt-1 text-sm text-danger-600">{errors.role.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" loading={isLoading}>
        Crear Cuenta
      </Button>
    </form>
  )
}
