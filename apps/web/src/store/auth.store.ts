import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@habitflow/shared'
import { api } from '@/lib/api'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean

  login:  (email: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string, timezone?: string) => Promise<void>
  logout: () => Promise<void>
  setTokens: (access: string, refresh: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:            null,
      accessToken:     null,
      refreshToken:    null,
      isAuthenticated: false,

      setTokens(access, refresh) {
        localStorage.setItem('accessToken',  access)
        localStorage.setItem('refreshToken', refresh)
        set({ accessToken: access, refreshToken: refresh, isAuthenticated: true })
      },

      async login(email, password) {
        const { data } = await api.post('/auth/login', { email, password })
        get().setTokens(data.accessToken, data.refreshToken)
        const me = await api.get('/users/me')
        set({ user: me.data })
      },

      async register(email, username, password, timezone = Intl.DateTimeFormat().resolvedOptions().timeZone) {
        const { data } = await api.post('/auth/register', { email, username, password, timezone })
        get().setTokens(data.accessToken, data.refreshToken)
        set({ user: data.user })
      },

      async logout() {
        await api.post('/auth/logout').catch(() => {})
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
      },
    }),
    {
      name: 'habitflow-auth',
      partialize: (s) => ({ user: s.user, accessToken: s.accessToken, refreshToken: s.refreshToken, isAuthenticated: s.isAuthenticated }),
    },
  ),
)
