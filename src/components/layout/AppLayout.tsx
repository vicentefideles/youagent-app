import { useState } from 'react'
import { NavLink, useNavigate, useLocation, Outlet } from 'react-router-dom'
import {
  LayoutDashboard, Phone, BarChart2, Brain, Mail,
  Settings, Users, LogOut, ChevronLeft, Bot,
  Zap, Menu, Megaphone, UserCheck, Shield,
  TrendingUp, PhoneIncoming, CreditCard, LayoutGrid,
  Upload, DollarSign, Code2, Lock, PhoneCall,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import clsx from 'clsx'
import { ProfileProvider, useProfile } from '@/context/ProfileContext'
import type { UserRole } from '@/context/ProfileContext'
import NotificationCenter from '@/components/notifications/NotificationCenter'
import ProfileSwitcher from '@/components/profile/ProfileSwitcher'
import BannerPendente from '@/components/BannerPendente'

interface NavItem {
  label: string
  icon: React.ReactNode
  to: string
  badge?: string
}

interface SidebarGroup {
  label: string
  items: NavItem[]
}

const SIDEBAR_CONFIG: Record<UserRole, SidebarGroup[]> = {
  admin_cliente: [
    {
      label: 'Principal',
      items: [
        { label: 'Dashboard',      icon: <LayoutDashboard size={17} />, to: '/dashboard' },
        { label: 'Campanhas',      icon: <Megaphone size={17} />,       to: '/campanhas' },
        { label: 'Discadora',      icon: <Phone size={17} />,           to: '/discadora' },
        { label: 'Relatórios',     icon: <BarChart2 size={17} />,       to: '/relatorios' },
        { label: 'Inteligência CI',icon: <Brain size={17} />,           to: '/inteligencia', badge: 'CI' },
        { label: 'E-mail',         icon: <Mail size={17} />,            to: '/email' },
      ],
    },
    {
      label: 'Ferramentas',
      items: [
        { label: 'Setup do Agente', icon: <Bot size={17} />,          to: '/onboarding' },
        { label: 'Área do Vendedor',icon: <UserCheck size={17} />,    to: '/vendedor' },
        { label: 'Pipeline',        icon: <TrendingUp size={17} />,   to: '/pipeline' },
        { label: 'Receptivo',       icon: <PhoneIncoming size={17} />,to: '/receptivo' },
      ],
    },
    {
      label: 'Conta',
      items: [
        { label: 'Equipe',             icon: <Users size={17} />,      to: '/equipe' },
        { label: 'Configurações',      icon: <Settings size={17} />,   to: '/config' },
        { label: 'Planos e Cobrança',  icon: <CreditCard size={17} />, to: '/planos' },
      ],
    },
  ],
  gerente: [
    {
      label: 'Principal',
      items: [
        { label: 'Dashboard',      icon: <LayoutDashboard size={17} />, to: '/dashboard' },
        { label: 'Campanhas',      icon: <Megaphone size={17} />,       to: '/campanhas' },
        { label: 'Discadora',      icon: <Phone size={17} />,           to: '/discadora' },
        { label: 'Relatórios',     icon: <BarChart2 size={17} />,       to: '/relatorios' },
        { label: 'Inteligência CI',icon: <Brain size={17} />,           to: '/inteligencia', badge: 'CI' },
        { label: 'E-mail',         icon: <Mail size={17} />,            to: '/email' },
      ],
    },
    {
      label: 'Ferramentas',
      items: [
        { label: 'Setup do Agente', icon: <Bot size={17} />,          to: '/onboarding' },
        { label: 'Área do Vendedor',icon: <UserCheck size={17} />,    to: '/vendedor' },
        { label: 'Pipeline',        icon: <TrendingUp size={17} />,   to: '/pipeline' },
        { label: 'Receptivo',       icon: <PhoneIncoming size={17} />,to: '/receptivo' },
      ],
    },
    {
      label: 'Conta',
      items: [
        { label: 'Equipe',        icon: <Users size={17} />,    to: '/equipe' },
        { label: 'Configurações', icon: <Settings size={17} />, to: '/config' },
      ],
    },
  ],
  vendedor: [
    {
      label: 'Meu Espaço',
      items: [
        { label: 'Área do Vendedor', icon: <UserCheck size={17} />, to: '/vendedor-restrito' },
      ],
    },
  ],
  colaborador: [
    {
      label: 'Principal',
      items: [
        { label: 'Dashboard', icon: <LayoutDashboard size={17} />, to: '/dashboard' },
        { label: 'E-mail',    icon: <Mail size={17} />,            to: '/email' },
      ],
    },
    {
      label: 'Meu Espaço',
      items: [
        { label: 'Área do Vendedor', icon: <UserCheck size={17} />, to: '/vendedor-restrito' },
      ],
    },
  ],
  platform_admin: [
    {
      label: 'ETZ Admin',
      items: [
        { label: 'Admin Dashboard', icon: <LayoutGrid size={17} />, to: '/admin/dashboard' },
        { label: 'Admin Clientes',  icon: <Shield size={17} />,     to: '/admin/clientes' },
        { label: 'Admin Suporte',   icon: <Shield size={17} />,     to: '/admin/suporte' },
        { label: 'Admin Config',    icon: <Shield size={17} />,       to: '/admin/config' },
        { label: 'Admin Plataforma',icon: <Shield size={17} />,       to: '/admin/plataforma' },
        { label: 'Admin Custos',    icon: <DollarSign size={17} />,   to: '/admin/custos' },
        { label: 'Admin Dev',       icon: <Code2 size={17} />,        to: '/admin/dev' },
        { label: 'Admin Telnyx',    icon: <PhoneCall size={17} />,    to: '/admin/telnyx' },
      ],
    },
  ],
}

const BREADCRUMB_MAP: Record<string, string> = {
  '/dashboard':        'Dashboard',
  '/campanhas':        'Campanhas',
  '/discadora':        'Discadora',
  '/relatorios':       'Relatórios',
  '/inteligencia':     'Inteligência',
  '/email':            'E-mail',
  '/equipe':           'Equipe',
  '/config':           'Configurações',
  '/vendedor':         'Vendedor',
  '/onboarding':       'Setup do Agente',
  '/pipeline':         'Pipeline',
  '/receptivo':        'Receptivo',
  '/planos':           'Planos e Cobrança',
  '/admin/dashboard':  'Admin — Dashboard',
  '/admin/clientes':   'Admin — Clientes',
  '/admin/suporte':    'Admin — Suporte',
  '/admin/config':     'Admin — Config',
  '/admin/plataforma': 'Admin — Plataforma',
  '/admin/custos':     'Admin — Custos',
  '/admin/dev':        'Admin — Dev',
  '/admin/telnyx':     'Admin — Telnyx',
  '/vendedor-restrito':'Área do Vendedor',
}

type ContextualAction = { label: string; icon: React.ReactNode } | null

const CONTEXTUAL_ACTIONS: Record<string, ContextualAction> = {
  '/dashboard':  { label: 'Nova Campanha',       icon: <Megaphone size={15} /> },
  '/discadora':  { label: 'Importar Lista',       icon: <Upload size={15} /> },
  '/campanhas':  { label: 'Nova Campanha',        icon: <Megaphone size={15} /> },
  '/email':      { label: 'Nova Campanha Email',  icon: <Mail size={15} /> },
}

// Rotas que exigem conta ativa — usadas para mostrar cadeado no sidebar
const ROTAS_REQUER_ATIVO = new Set([
  '/campanhas', '/discadora', '/relatorios', '/inteligencia',
  '/email', '/pipeline', '/equipe', '/receptivo',
])

function NavSection({
  items,
  collapsed,
  onClose,
  showLock,
}: {
  items: NavItem[]
  collapsed: boolean
  onClose: () => void
  showLock: boolean
}) {
  return (
    <>
      {items.map((item) => {
        const bloqueado = showLock && ROTAS_REQUER_ATIVO.has(item.to)
        return (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors relative group',
                isActive
                  ? 'bg-brand-50 text-brand-600'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100',
                collapsed && 'justify-center px-2'
              )
            }
          >
            {item.icon}
            {!collapsed && <span>{item.label}</span>}
            {!collapsed && item.badge && !bloqueado && (
              <span className="ml-auto text-2xs px-1.5 py-0.5 rounded
                               bg-purple-100 text-purple-700 font-semibold">
                {item.badge}
              </span>
            )}
            {!collapsed && bloqueado && (
              <Lock className="w-3 h-3 text-gray-400 ml-auto flex-shrink-0" />
            )}
            {collapsed && (
              <span className="absolute left-full ml-2 px-2 py-1 rounded-md bg-gray-900
                               text-xs text-white whitespace-nowrap opacity-0
                               group-hover:opacity-100 pointer-events-none z-50 shadow-popup">
                {item.label}
              </span>
            )}
          </NavLink>
        )
      })}
    </>
  )
}

function AppLayoutInner() {
  const { user, logout, status, isAtivo } = useAuthStore()
  const { currentRole } = useProfile()
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const contaAtiva = isAtivo()
  const showLock = !contaAtiva

  const breadcrumb = BREADCRUMB_MAP[location.pathname] ?? ''
  const groups = SIDEBAR_CONFIG[currentRole] ?? []

  const showContextualButton =
    currentRole === 'admin_cliente' || currentRole === 'gerente'
  const contextualAction = CONTEXTUAL_ACTIONS[location.pathname] ?? null

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">

      {/* Logo */}
      <div className={clsx(
        'flex items-center gap-3 px-4 py-5 border-b border-gray-100',
        collapsed && 'justify-center px-3'
      )}>
        <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-200
                        flex items-center justify-center flex-shrink-0">
          <Bot size={16} className="text-brand-600" />
        </div>
        {!collapsed && (
          <span className="text-base font-semibold text-gray-900 tracking-tight">ETZ</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 flex flex-col gap-0.5 overflow-y-auto">
        {groups.map((group, idx) => (
          <div key={group.label}>
            {idx > 0 && <div className="divider my-3" />}
            {!collapsed && (
              <p className="section-label px-3 mb-2">{group.label}</p>
            )}
            <NavSection
              items={group.items}
              collapsed={collapsed}
              onClose={() => setMobileOpen(false)}
              showLock={showLock}
            />
          </div>
        ))}
      </nav>

      {/* User */}
      <div className={clsx(
        'border-t border-gray-100 p-3',
        collapsed && 'flex justify-center'
      )}>
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-brand-600">
                {user?.nome?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.nome}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
            <button onClick={handleLogout} className="btn-ghost p-2" title="Sair">
              <LogOut size={15} className="text-gray-400" />
            </button>
          </div>
        ) : (
          <button onClick={handleLogout} className="btn-ghost p-2" title="Sair">
            <LogOut size={15} className="text-gray-400" />
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* Sidebar desktop */}
      <aside className={clsx(
        'hidden lg:flex flex-col bg-white border-r border-gray-100 flex-shrink-0',
        'transition-all duration-200 relative',
        collapsed ? 'w-[60px]' : 'w-[220px]'
      )}>
        {sidebarContent}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-200
                     rounded-full flex items-center justify-center shadow-sm
                     text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-colors z-10"
        >
          <ChevronLeft size={12} className={clsx('transition-transform', collapsed && 'rotate-180')} />
        </button>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/30"
             onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar mobile */}
      <aside className={clsx(
        'lg:hidden fixed left-0 top-0 bottom-0 z-50 w-[220px]',
        'bg-white border-r border-gray-100 transition-transform duration-200',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {sidebarContent}
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <header className="flex items-center gap-3 px-5 h-14 border-b border-gray-100
                           bg-white flex-shrink-0">
          <button className="lg:hidden btn-ghost p-2" onClick={() => setMobileOpen(true)}>
            <Menu size={18} />
          </button>

          {/* Breadcrumb */}
          {breadcrumb && (
            <span className="text-sm font-medium text-gray-700 hidden sm:block">{breadcrumb}</span>
          )}

          <div className="flex-1" />

          {/* Contextual action button */}
          {showContextualButton && contextualAction && (
            <button className="btn-primary flex items-center gap-1.5 text-xs px-3 py-1.5">
              {contextualAction.icon}
              <span className="hidden sm:inline">{contextualAction.label}</span>
            </button>
          )}

          {/* Status */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
                          bg-emerald-50 border border-emerald-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-emerald-700">Sistema ativo</span>
          </div>

          {/* Telnyx */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
                          bg-gray-50 border border-gray-200">
            <Zap size={12} className="text-gray-400" />
            <span className="text-xs text-gray-500">Telnyx</span>
          </div>

          {/* Notifications */}
          <NotificationCenter currentRole={currentRole} />

          {/* Profile Switcher */}
          <ProfileSwitcher />
        </header>

        <main className="flex-1 overflow-y-auto">
          {status && status !== 'ativo' && <BannerPendente status={status} />}
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default function AppLayout() {
  return (
    <ProfileProvider>
      <AppLayoutInner />
    </ProfileProvider>
  )
}
