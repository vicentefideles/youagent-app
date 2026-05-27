import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, AlertCircle } from 'lucide-react'
import { api } from '@/services/api'

type StatusCliente =
  | 'cadastrado'
  | 'documentos_enviados'
  | 'contrato_gerado'
  | 'aguardando_ativacao'
  | 'ativo'
  | 'documentos_rejeitados'

interface ClienteData {
  id: string
  status: StatusCliente
  motivo_rejeicao?: string
  nome?: string
  email?: string
  plano?: string
}

interface TimelineItem {
  label: string
  statuses: StatusCliente[]
  doneStatuses: StatusCliente[]
}

const TIMELINE: TimelineItem[] = [
  {
    label: 'Cadastro realizado',
    statuses: ['cadastrado', 'documentos_enviados', 'contrato_gerado', 'aguardando_ativacao', 'ativo'],
    doneStatuses: ['documentos_enviados', 'contrato_gerado', 'aguardando_ativacao', 'ativo'],
  },
  {
    label: 'Documentos enviados',
    statuses: ['documentos_enviados', 'contrato_gerado', 'aguardando_ativacao', 'ativo'],
    doneStatuses: ['contrato_gerado', 'aguardando_ativacao', 'ativo'],
  },
  {
    label: 'Contrato assinado',
    statuses: ['contrato_gerado', 'aguardando_ativacao', 'ativo'],
    doneStatuses: ['aguardando_ativacao', 'ativo'],
  },
  {
    label: 'Aguardando ativação pela equipe ETZ (estimativa: 1 dia útil)',
    statuses: ['aguardando_ativacao', 'ativo'],
    doneStatuses: ['ativo'],
  },
]

export default function AguardandoPage() {
  const navigate = useNavigate()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [cliente, setCliente] = useState<ClienteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')

  const clienteId = localStorage.getItem('youagent_cliente_id')

  async function buscarStatus() {
    if (!clienteId) {
      setErro('Sessão expirada. Por favor, refaça o cadastro.')
      setLoading(false)
      return
    }
    try {
      const res = await api.get(`/clientes/${clienteId}`)
      const data = res.data as ClienteData
      setCliente(data)

      if (data.status === 'ativo') {
        if (intervalRef.current) clearInterval(intervalRef.current)
        setTimeout(() => navigate('/login'), 2000)
      }
    } catch {
      setErro('Erro ao buscar status da conta.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    buscarStatus()
    intervalRef.current = setInterval(buscarStatus, 30000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function isStepVisible(item: TimelineItem): boolean {
    if (!cliente) return false
    return item.statuses.includes(cliente.status)
  }

  function isStepDone(item: TimelineItem): boolean {
    if (!cliente) return false
    return item.doneStatuses.includes(cliente.status)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    )
  }

  // Conta ativa — redireciona automaticamente
  if (cliente?.status === 'ativo') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center animate-fade-in">
          <div className="card p-8 flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl">✅</div>
            <h2 className="text-xl font-semibold text-gray-900">Conta ativada!</h2>
            <p className="text-sm text-gray-500">Redirecionando para o login...</p>
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg animate-fade-in">
        <div className="card p-8">

          {/* Header */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {cliente?.nome ? `Olá, ${cliente.nome}! 👋` : 'Conta em análise 👋'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Sua conta está sendo ativada. Acompanhe o andamento abaixo.
            </p>
            {cliente?.email && (
              <p className="text-xs text-gray-400 mt-1">
                {cliente.plano ? `Plano ${cliente.plano} · ` : ''}
                Notificações enviadas para {cliente.email}
              </p>
            )}
          </div>

          {erro && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm mb-4">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {erro}
            </div>
          )}

          {/* Banner rejeição */}
          {cliente?.status === 'documentos_rejeitados' && (
            <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-300">
              <p className="text-sm font-semibold text-amber-800 mb-1">⚠ Documentos rejeitados</p>
              {cliente.motivo_rejeicao && (
                <p className="text-xs text-amber-700 mb-3">{cliente.motivo_rejeicao}</p>
              )}
              <button
                onClick={() => navigate('/documentos')}
                className="text-xs font-semibold text-amber-800 border border-amber-400 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors"
              >
                Reenviar documentos →
              </button>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-gray-50 rounded-xl p-5 flex flex-col gap-4 mb-6">
            {TIMELINE.map((item) => {
              const visible = isStepVisible(item)
              const done = isStepDone(item)
              if (!visible && !done) return null
              return (
                <div key={item.label} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold mt-0.5 ${
                    done ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-500'
                  }`}>
                    {done ? '✓' : '⏳'}
                  </div>
                  <p className={`text-sm pt-1.5 ${done ? 'text-gray-700 font-medium' : 'text-gray-600'}`}>
                    {item.label}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Info atualização automática */}
          <p className="text-xs text-gray-400 text-center mb-4">
            Status atualizado automaticamente a cada 30 segundos
          </p>

          {/* Suporte */}
          <div className="border border-gray-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-gray-900 mb-1">💬 Dúvidas? Fale com a equipe ETZ</p>
            <p className="text-xs text-gray-500 mb-3">
              suporte@etztech.com · Atendimento em até 1 hora útil
            </p>
            <button
              onClick={() => window.open('mailto:suporte@etztech.com?subject=Suporte - Conta aguardando aprovação', '_blank')}
              className="btn-secondary py-2 text-sm"
            >
              Abrir chat de suporte
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
