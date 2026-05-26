import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { JWT_KEY, AUTH_KEY } from '@/constants/auth'

interface Cliente {
  id: string
  nome: string
  email: string
  plano?: string
  status?: string
  role?: string   // 'cliente' | 'platform_admin'
}

interface AuthState {
  jwt: string | null
  user: Cliente | null
  isAuthenticated: boolean
  status: string | null  // 'cadastrado' | 'documentos_enviados' | 'contrato_gerado' | 'aguardando_ativacao' | 'ativo' | 'documentos_rejeitados'
  login: (jwt: string, user: Cliente) => void
  logout: () => void
  setStatus: (status: string) => void
  isAtivo: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      jwt: null,
      user: null,
      isAuthenticated: false,
      status: null,

      login: (token, user) => {
        localStorage.setItem(JWT_KEY, token)
        set({
          jwt: token,
          user,
          isAuthenticated: true,
          status: user?.status || null,
        })
      },

      logout: () => {
        localStorage.removeItem(JWT_KEY)
        set({ jwt: null, user: null, isAuthenticated: false, status: null })
      },

      setStatus: (status: string) => {
        set((state) => ({
          status,
          user: state.user ? { ...state.user, status } : state.user,
        }))
      },

      isAtivo: () => {
        const state = get()
        return state.status === 'ativo' || state.user?.status === 'ativo'
      },
    }),
    {
      name: AUTH_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        jwt: state.jwt,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        status: state.status,
      }),
    }
  )
)
