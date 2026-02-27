export type UserRole = 'student' | 'teacher' | 'admin'

export interface Profile {
  id: string
  email: string
  role: UserRole
  full_name: string | null
  created_at: string
  is_super_admin?: boolean
}

export interface AuthState {
  user: import('@supabase/supabase-js').User | null
  profile: Profile | null
  loading: boolean
  initialized: boolean
}
