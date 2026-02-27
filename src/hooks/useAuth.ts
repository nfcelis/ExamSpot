import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export function useAuth() {
  const { user, profile, loading, initialized } = useAuthStore()

  const signUp = async (
    email: string,
    password: string,
    fullName: string
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          // role is intentionally omitted — the DB trigger always creates accounts as 'student'
        },
      },
    })

    if (error) {
      toast.error(error.message)
      throw error
    }

    toast.success('Cuenta creada exitosamente. Revisa tu email para confirmar.')
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      toast.error(error.message)
      throw error
    }

    toast.success('Inicio de sesión exitoso')
  }

  const signOut = async () => {
    await useAuthStore.getState().signOut()
    toast.success('Sesión cerrada')
  }

  return {
    user,
    profile,
    loading,
    initialized,
    signUp,
    signIn,
    signOut,
  }
}
