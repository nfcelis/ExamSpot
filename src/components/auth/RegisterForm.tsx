import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../common/Button'
import { Input } from '../common/Input'
import { useState } from 'react'

const registerSchema = z.object({
  fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string(),
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
  })

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    try {
      await signUp(data.email, data.password, data.fullName)
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

      <p className="text-xs text-secondary-500">
        Las nuevas cuentas se registran como <strong>Estudiante</strong>. Un administrador puede cambiar tu rol si es necesario.
      </p>

      <Button type="submit" className="w-full" loading={isLoading}>
        Crear Cuenta
      </Button>
    </form>
  )
}
