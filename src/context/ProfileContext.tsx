import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

export type UserRole =
  | 'admin_cliente'   // admin_demo — dono da conta do cliente
  | 'gerente'         // gerente_demo — gerente comercial
  | 'vendedor'        // joao, carlos_v — closers/SDRs
  | 'colaborador'     // fernanda — acesso limitado
  | 'platform_admin'  // admin_voxagent — admin interno YouAgent

export type NavRoute = string

export const NAV_RULES: Record<UserRole, NavRoute[]> = {
  admin_cliente: [
    '/dashboard', '/campanhas', '/discadora', '/relatorios',
    '/inteligencia', '/email', '/vendedor', '/pipeline', '/receptivo',
    '/onboarding', '/equipe', '/config', '/planos', '/mensagens',
  ],
  gerente: [
    '/dashboard', '/campanhas', '/discadora', '/relatorios',
    '/inteligencia', '/email', '/vendedor', '/pipeline', '/receptivo',
    '/onboarding', '/equipe', '/config', '/mensagens',
  ],
  vendedor: [
    '/vendedor',
  ],
  colaborador: [
    '/dashboard', '/email', '/vendedor',
  ],
  platform_admin: [
    '/admin/dashboard', '/admin/clientes', '/admin/suporte',
    '/admin/config', '/admin/plataforma', '/admin/custos', '/admin/dev',
  ],
}

export type ConfigSection =
  | 'empresa' | 'integracoes' | 'integracoes-avancadas'
  | 'seguranca' | 'notificacoes' | 'equipe' | 'dev' | 'crm' | 'api'
  | 'meu-whatsapp'

export const CONFIG_RULES: Record<UserRole, ConfigSection[]> = {
  admin_cliente: [
    'empresa', 'integracoes', 'integracoes-avancadas', 'seguranca',
    'notificacoes', 'equipe', 'dev', 'crm', 'api', 'meu-whatsapp',
  ],
  gerente: [
    'empresa', 'integracoes', 'notificacoes', 'equipe', 'crm', 'meu-whatsapp',
  ],
  vendedor: [],
  colaborador: [],
  platform_admin: [
    'empresa', 'integracoes', 'seguranca', 'equipe', 'dev', 'api', 'meu-whatsapp',
  ],
}

export interface Profile {
  id: string
  nome: string
  cargo: string
  role: UserRole
  email: string
  avatar: string
  avatarColor: string
}

export const PROFILES: Profile[] = [
  {
    id: 'admin_demo',
    nome: 'Admin Demo',
    cargo: 'Admin da Conta',
    role: 'admin_cliente',
    email: 'admin@empresa.com',
    avatar: 'AD',
    avatarColor: 'bg-purple-600',
  },
  {
    id: 'gerente_demo',
    nome: 'Ana Rodrigues',
    cargo: 'Gerente Comercial',
    role: 'gerente',
    email: 'ana@empresa.com',
    avatar: 'AR',
    avatarColor: 'bg-blue-500',
  },
  {
    id: 'joao',
    nome: 'João Silva',
    cargo: 'Closer SP',
    role: 'vendedor',
    email: 'joao@empresa.com',
    avatar: 'JS',
    avatarColor: 'bg-green-500',
  },
  {
    id: 'carlos_v',
    nome: 'Carlos Ferreira',
    cargo: 'Closer MG/GO',
    role: 'vendedor',
    email: 'carlos@empresa.com',
    avatar: 'CF',
    avatarColor: 'bg-teal-500',
  },
  {
    id: 'fernanda',
    nome: 'Fernanda Rocha',
    cargo: 'Colaboradora',
    role: 'colaborador',
    email: 'fernanda@empresa.com',
    avatar: 'FR',
    avatarColor: 'bg-amber-500',
  },
  {
    id: 'admin_voxagent',
    nome: 'Admin ETZ',
    cargo: 'Plataforma Admin',
    role: 'platform_admin',
    email: 'admin@etztech.com',
    avatar: 'AY',
    avatarColor: 'bg-red-500',
  },
]

interface ProfileContextValue {
  currentProfile: Profile
  setCurrentProfile: (p: Profile) => void
  currentRole: UserRole
  allowedRoutes: NavRoute[]
  allowedConfigSections: ConfigSection[]
  canAccess: (route: string) => boolean
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [currentProfile, setCurrentProfile] = useState<Profile>(PROFILES[0])

  const allowedRoutes = NAV_RULES[currentProfile.role]
  const allowedConfigSections = CONFIG_RULES[currentProfile.role]

  function canAccess(route: string): boolean {
    return allowedRoutes.includes(route)
  }

  return (
    <ProfileContext.Provider
      value={{
        currentProfile,
        setCurrentProfile,
        currentRole: currentProfile.role,
        allowedRoutes,
        allowedConfigSections,
        canAccess,
      }}
    >
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used inside ProfileProvider')
  return ctx
}
