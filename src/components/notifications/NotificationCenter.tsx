import { useState, useEffect, useRef } from 'react'
import {
  Bell, Calendar, ArrowRight, Brain, AlertTriangle,
  XCircle, Video, Zap, Settings,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import type { UserRole } from '@/context/ProfileContext'

export type NotifType =
  | 'agendamento'
  | 'transferencia'
  | 'ci'
  | 'alerta'
  | 'noshow'
  | 'reuniao'
  | 'sistema'

interface Notification {
  id: number
  tipo: NotifType
  titulo: string
  descricao: string
  tempo: string
  lida: boolean
  role: UserRole[]
  link?: string
}

const TIPO_ICON: Record<NotifType, React.ReactNode> = {
  agendamento: <Calendar size={15} />,
  transferencia: <ArrowRight size={15} />,
  ci: <Brain size={15} />,
  alerta: <AlertTriangle size={15} />,
  noshow: <XCircle size={15} />,
  reuniao: <Video size={15} />,
  sistema: <Zap size={15} />,
}

const TIPO_COLOR: Record<NotifType, string> = {
  agendamento: 'text-blue-600 bg-blue-50',
  transferencia: 'text-green-600 bg-green-50',
  ci: 'text-purple-600 bg-purple-50',
  alerta: 'text-amber-600 bg-amber-50',
  noshow: 'text-red-600 bg-red-50',
  reuniao: 'text-indigo-600 bg-indigo-50',
  sistema: 'text-gray-600 bg-gray-100',
}

const ROLE_LABEL: Record<UserRole, string> = {
  admin_cliente: 'Admin da Conta',
  gerente: 'Gerente',
  vendedor: 'Vendedor',
  colaborador: 'Colaborador',
  platform_admin: 'Admin Plataforma',
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    tipo: 'agendamento',
    titulo: 'Reunião agendada',
    descricao: 'João Silva | Acme Corp | 15h00',
    tempo: 'há 2 min',
    lida: false,
    role: ['gerente', 'admin_cliente'],
    link: '/discadora',
  },
  {
    id: 2,
    tipo: 'transferencia',
    titulo: 'Transferência aceita',
    descricao: 'Carlos Ferreira | Proposta aprovada',
    tempo: 'há 5 min',
    lida: false,
    role: ['gerente', 'admin_cliente'],
  },
  {
    id: 3,
    tipo: 'ci',
    titulo: 'CI detectou padrão',
    descricao: 'Urgência aumentou 18% em SP esta semana',
    tempo: 'há 12 min',
    lida: false,
    role: ['gerente', 'admin_cliente'],
    link: '/inteligencia',
  },
  {
    id: 4,
    tipo: 'noshow',
    titulo: 'No-show registrado',
    descricao: 'Reunião com BetaTech às 14h não ocorreu',
    tempo: 'há 1h',
    lida: false,
    role: ['gerente', 'admin_cliente'],
  },
  {
    id: 5,
    tipo: 'alerta',
    titulo: 'Meta atingida',
    descricao: 'Equipe SP bateu 85% da meta mensal',
    tempo: 'há 2h',
    lida: true,
    role: ['gerente', 'admin_cliente'],
    link: '/relatorios',
  },
  {
    id: 6,
    tipo: 'ci',
    titulo: '3 argumentos aguardam aprovação',
    descricao: 'Centro de Inteligência — revisão pendente',
    tempo: 'há 3h',
    lida: true,
    role: ['gerente', 'admin_cliente'],
    link: '/inteligencia',
  },
  {
    id: 7,
    tipo: 'reuniao',
    titulo: 'Nova reunião para você',
    descricao: 'BetaTech às 15h30 — sala virtual pronta',
    tempo: 'há 3 min',
    lida: false,
    role: ['vendedor'],
    link: '/vendedor',
  },
  {
    id: 8,
    tipo: 'agendamento',
    titulo: 'Gerente aprovou sua proposta',
    descricao: 'Proposta para Acme Corp liberada para envio',
    tempo: 'há 20 min',
    lida: false,
    role: ['vendedor'],
  },
  {
    id: 9,
    tipo: 'alerta',
    titulo: 'Lembrete: reunião em 30 min',
    descricao: 'Acme Corp — você tem reunião às 15h00',
    tempo: 'há 30 min',
    lida: true,
    role: ['vendedor'],
    link: '/vendedor',
  },
  {
    id: 10,
    tipo: 'agendamento',
    titulo: 'Novo cliente ativado',
    descricao: 'TechVision Ltda ativado no plano Starter',
    tempo: 'há 1h',
    lida: false,
    role: ['platform_admin'],
    link: '/admin/clientes',
  },
  {
    id: 11,
    tipo: 'transferencia',
    titulo: 'Plano atualizado',
    descricao: 'DataSoft migrou para o plano Growth',
    tempo: 'há 2h',
    lida: false,
    role: ['platform_admin'],
    link: '/admin/clientes',
  },
  {
    id: 12,
    tipo: 'alerta',
    titulo: 'Alerta de consumo',
    descricao: '82% do limite de ligações utilizado este mês',
    tempo: 'há 3h',
    lida: true,
    role: ['admin_cliente', 'platform_admin'],
    link: '/config',
  },
  {
    id: 13,
    tipo: 'sistema',
    titulo: 'Sistema atualizado com sucesso',
    descricao: 'Versão 2.4.1 — melhorias de performance e estabilidade',
    tempo: 'há 4h',
    lida: true,
    role: ['gerente', 'vendedor', 'admin_cliente', 'colaborador', 'platform_admin'],
  },
]

interface NotificationCenterProps {
  currentRole: UserRole
}

export default function NotificationCenter({ currentRole }: NotificationCenterProps) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const visible = notifications.filter((n) => n.role.includes(currentRole))
  const unreadCount = visible.filter((n) => !n.lida).length

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function markAllRead() {
    setNotifications((prev) =>
      prev.map((n) =>
        n.role.includes(currentRole) ? { ...n, lida: true } : n
      )
    )
  }

  function clearAll() {
    setNotifications((prev) => prev.filter((n) => !n.role.includes(currentRole)))
  }

  function markRead(id: number) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, lida: true } : n))
    )
  }

  function handleNotifClick(n: Notification) {
    markRead(n.id)
    if (n.link) {
      navigate(n.link)
      setOpen(false)
    }
  }

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative btn-ghost p-2 rounded-lg"
        aria-label="Notificações"
      >
        <Bell size={18} className="text-gray-500" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] rounded-full
                           bg-red-500 text-white text-[10px] font-bold flex items-center
                           justify-center leading-none px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-[380px] bg-white border border-gray-200
                     rounded-xl shadow-lg z-50 transition-all duration-200 overflow-hidden"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-gray-900">Notificações</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {unreadCount} não lida{unreadCount !== 1 ? 's' : ''} — {ROLE_LABEL[currentRole]}
              </p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={markAllRead}
                className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
              >
                ✓ Marcar todas
              </button>
              <button
                onClick={clearAll}
                className="text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded hover:bg-red-50 transition-colors"
              >
                🗑 Limpar
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-50">
            {visible.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">
                Nenhuma notificação
              </div>
            ) : (
              visible.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotifClick(n)}
                  className={clsx(
                    'w-full text-left flex items-start gap-3 px-4 py-3',
                    'hover:bg-gray-50 transition-colors',
                    !n.lida && 'bg-blue-50 hover:bg-blue-100/60'
                  )}
                >
                  {/* Icon */}
                  <div
                    className={clsx(
                      'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
                      TIPO_COLOR[n.tipo]
                    )}
                  >
                    {TIPO_ICON[n.tipo]}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{n.titulo}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{n.descricao}</p>
                    <p className="text-[11px] text-gray-400 mt-1">{n.tempo}</p>
                  </div>

                  {/* Unread dot */}
                  {!n.lida && (
                    <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 px-4 py-2.5">
            <button
              onClick={() => { navigate('/config'); setOpen(false) }}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors"
            >
              <Settings size={12} />
              Configurar notificações →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
