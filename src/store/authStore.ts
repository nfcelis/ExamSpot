import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '../types/user'
import { supabase } from '../lib/supabase'

interface AuthStore {
  user: User | null
  profile: Profile | null
  loading: boolean
  initialized: boolean
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (loading: boolean) => void
  initialize: () => Promise<void>
  fetchProfile: (userId: string) => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  initialized: false,

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),

  fetchProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return
    }

    set({ profile: data })
  },

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession()

    if (session?.user) {
      set({ user: session.user })
      await get().fetchProfile(session.user.id)
    }

    set({ loading: false, initialized: true })

    supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = get().user

      if (session?.user) {
        // If user changed, show loading while fetching profile
        if (currentUser?.id !== session.user.id) {
          set({ user: session.user, loading: true })
          await get().fetchProfile(session.user.id)
          set({ loading: false })
        } else {
          set({ user: session.user })
        }
      } else {
        set({ user: null, profile: null })
      }

      if (event === 'SIGNED_OUT') {
        set({ user: null, profile: null })
      }
    })
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null })
  },
}))
