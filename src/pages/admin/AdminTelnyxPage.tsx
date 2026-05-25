import { useState, useEffect } from 'react'
import { Phone, ChevronDown, ChevronRight, Loader2 } from 'lucide-react'
import { telnyxApi } from '@/services/api'

interface Solicitacao {
  id: string
  empresa: string
  ddd: string
  numero_solicitado: string
  status: string
  created_at: string
  cnpj?: string
  razao_social?: string
  nome_representante?: string
  cpf_representante?: string
  endereco?: string
  cep?: string
  cidade?: string
  estado?: string
  notas_admin?: string
  numero_aprovado?: string
  motivo_rejeicao?: string
  telnyx_account_id?: string
  telnyx_order_id?: string
  telnyx_connection_id?: string
}

type StatusFilter = 'todos' | 'documentos_enviados' | 'em_analise_telnyx' | 'numero_ativo' | 'rejeitado'

const STATUS_LABEL: Record<string, string> = {
  documentos_enviados: 'Aguardando provisioning',
  em_analise_telnyx: 'Em análise Telnyx',
  numero_ativo: 'Ativo',
  rejeitado: 'Rejeitado',
  aprovado: 'Aprovado',
}

const STATUS_BADGE: Record<string, string> = {
  documentos_enviados: 'bg-amber-50 text-amber-700 border border-amber-200',
  em_analise_telnyx: 'bg-blue-50 text-blue-700 border border-blue-200',
  numero_ativo: 'bg-green-50 text-green-700 border border-green-200',
  rejeitado: 'bg-red-50 text-red-700 border border-red-200',
  aprovado: 'bg-teal-50 text-teal-700 border border-teal-200',
}

function formatarData(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return iso
  }
}

function formatarNumero(num: string): string {
  const digits = num.replace(/\D/g, '')
  if (digits.length === 13) {
    return `+${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 8)}-${digits.slice(8)}`
  }
  return num
}

interface RowActionsProps {
  sol: Solicitacao
  onUpdate: (id: string, data: Partial<Solicitacao> | null) => void
}

function RowActions({ sol, onUpdate }: RowActionsProps) {
  const [provisionando, setProvisionando] = useState(false)
  const [showAtivarForm, setShowAtivarForm] = useState(false)
  const [numeroAprovado, setNumeroAprovado] = useState('')
  const [showRejeitar, setShowRejeitar] = useState(false)
  const [motivoRejeicao, setMotivoRejeicao] = useState('')
  const [showNota, setShowNota] = useState(false)
  const [nota, setNota] = useState(sol.notas_admin || '')
  const [saving, setSaving] = useState(false)

  async function provisionar() {
    const ok = window.confirm(
      `Provisionar número para ${sol.razao_social || sol.empresa || 'este cliente'}?\n\n` +
      `Número: ${sol.numero_solicitado}\n\n` +
      `Isso criará uma sub-conta na Telnyx. Confirmar?`
    )
    if (!ok) return
    setProvisionando(true)
    try {
      const res = await telnyxApi.adminProvisionar(sol.id)
      const data = res.data as Partial<Solicitacao>
      onUpdate(sol.id, data)
    } catch {
      // silently fail — user can retry
    } finally {
      setProvisionando(false)
    }
  }

  async function marcarAtivo() {
    if (!numeroAprovado.trim()) return
    setSaving(true)
    try {
      const res = await telnyxApi.adminAtualizar(sol.id, { status: 'numero_ativo', numero_aprovado: numeroAprovado })
      const data = res.data as Partial<Solicitacao>
      onUpdate(sol.id, data)
      setShowAtivarForm(false)
    } catch {
      // silently fail
    } finally {
      setSaving(false)
    }
  }

  async function rejeitar() {
    if (!motivoRejeicao.trim()) return
    setSaving(true)
    try {
      const res = await telnyxApi.adminAtualizar(sol.id, { status: 'rejeitado', motivo_rejeicao: motivoRejeicao })
      const data = res.data as Partial<Solicitacao>
      onUpdate(sol.id, data)
      setShowRejeitar(false)
    } catch {
      // silently fail
    } finally {
      setSaving(false)
    }
  }

  async function salvarNota() {
    setSaving(true)
    try {
      await telnyxApi.adminAtualizar(sol.id, { notas_admin: nota })
      onUpdate(sol.id, { notas_admin: nota })
      setShowNota(false)
    } catch {
      // silently fail
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {sol.status === 'documentos_enviados' && (
        <button
          onClick={provisionar}
          disabled={provisionando}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {provisionando ? <Loader2 className="w-3 h-3 animate-spin" /> : '🚀'}
          Provisionar
        </button>
      )}

      {sol.status === 'em_analise_telnyx' && !showAtivarForm && (
        <button
          onClick={() => setShowAtivarForm(true)}
          className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
        >
          ✅ Marcar ativo
        </button>
      )}

      {showAtivarForm && (
        <div className="flex items-center gap-1">
          <input
            className="border border-gray-300 rounded px-2 py-1 text-xs w-36 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="+55 11 9000-0001"
            value={numeroAprovado}
            onChange={e => setNumeroAprovado(e.target.value)}
          />
          <button
            onClick={marcarAtivo}
            disabled={saving || !numeroAprovado.trim()}
            className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-60"
          >
            {saving ? '...' : 'Salvar'}
          </button>
          <button onClick={() => setShowAtivarForm(false)} className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700">✕</button>
        </div>
      )}

      {['documentos_enviados', 'em_analise_telnyx'].includes(sol.status) && !showRejeitar && (
        <button
          onClick={() => setShowRejeitar(true)}
          className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
        >
          ❌ Rejeitar
        </button>
      )}

      {showRejeitar && (
        <div className="flex items-center gap-1">
          <input
            className="border border-gray-300 rounded px-2 py-1 text-xs w-36 focus:outline-none focus:ring-1 focus:ring-red-400"
            placeholder="Motivo da rejeição"
            value={motivoRejeicao}
            onChange={e => setMotivoRejeicao(e.target.value)}
          />
          <button
            onClick={rejeitar}
            disabled={saving || !motivoRejeicao.trim()}
            className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-60"
          >
            {saving ? '...' : 'Confirmar'}
          </button>
          <button onClick={() => setShowRejeitar(false)} className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700">✕</button>
        </div>
      )}

      {!showNota && (
        <button
          onClick={() => setShowNota(true)}
          className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
        >
          📝 Nota
        </button>
      )}

      {showNota && (
        <div className="flex items-center gap-1">
          <input
            className="border border-gray-300 rounded px-2 py-1 text-xs w-40 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Adicionar nota interna..."
            value={nota}
            onChange={e => setNota(e.target.value)}
          />
          <button
            onClick={salvarNota}
            disabled={saving}
            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? '...' : 'Salvar'}
          </button>
          <button onClick={() => setShowNota(false)} className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700">✕</button>
        </div>
      )}
    </div>
  )
}

interface ExpandedRowProps {
  sol: Solicitacao
}

function ExpandedRow({ sol }: ExpandedRowProps) {
  return (
    <div className="px-4 py-4 bg-gray-50 border-t border-gray-100 grid grid-cols-3 gap-4 text-xs text-gray-600">
      <div>
        <p className="font-medium text-gray-700 mb-1">Dados regulatórios</p>
        <p>CNPJ: {sol.cnpj || '—'}</p>
        <p>Razão Social: {sol.razao_social || '—'}</p>
        <p>Representante: {sol.nome_representante || '—'}</p>
        <p>CPF: {sol.cpf_representante || '—'}</p>
      </div>
      <div>
        <p className="font-medium text-gray-700 mb-1">Endereço</p>
        <p>{sol.endereco || '—'}</p>
        <p>CEP: {sol.cep || '—'}</p>
        <p>{sol.cidade || '—'}{sol.estado ? `, ${sol.estado}` : ''}</p>
      </div>
      <div>
        <p className="font-medium text-gray-700 mb-1">IDs Telnyx</p>
        <p>Account: {sol.telnyx_account_id || '—'}</p>
        <p>Order: {sol.telnyx_order_id || '—'}</p>
        <p>Connection: {sol.telnyx_connection_id || '—'}</p>
        {sol.notas_admin && (
          <>
            <p className="font-medium text-gray-700 mt-2 mb-1">Notas internas</p>
            <p className="text-gray-600">{sol.notas_admin}</p>
          </>
        )}
        {sol.motivo_rejeicao && (
          <>
            <p className="font-medium text-red-600 mt-2 mb-1">Motivo da rejeição</p>
            <p className="text-red-600">{sol.motivo_rejeicao}</p>
          </>
        )}
      </div>
    </div>
  )
}

export default function AdminTelnyxPage() {
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<StatusFilter>('todos')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    carregarSolicitacoes()
  }, [])

  async function carregarSolicitacoes() {
    setLoading(true)
    try {
      const res = await telnyxApi.adminTodasSolicitacoes()
      const data = res.data as Solicitacao[]
      setSolicitacoes(Array.isArray(data) ? data : [])
    } catch {
      // keep empty
    } finally {
      setLoading(false)
    }
  }

  function handleUpdate(id: string, updated: Partial<Solicitacao> | null) {
    if (!updated) return
    setSolicitacoes(prev => prev.map(s => s.id === id ? { ...s, ...updated } : s))
  }

  const filtered = filtro === 'todos'
    ? solicitacoes
    : solicitacoes.filter(s => s.status === filtro)

  const contagens = {
    pendentes: solicitacoes.filter(s => s.status === 'documentos_enviados').length,
    analise: solicitacoes.filter(s => s.status === 'em_analise_telnyx').length,
    ativos: solicitacoes.filter(s => s.status === 'numero_ativo').length,
    rejeitados: solicitacoes.filter(s => s.status === 'rejeitado').length,
  }

  const TABS: { id: StatusFilter; label: string }[] = [
    { id: 'todos', label: 'Todos' },
    { id: 'documentos_enviados', label: 'Aguardando' },
    { id: 'em_analise_telnyx', label: 'Em análise' },
    { id: 'numero_ativo', label: 'Ativos' },
    { id: 'rejeitado', label: 'Rejeitados' },
  ]

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Phone className="w-5 h-5 text-blue-600" />
        <h1 className="text-xl font-semibold text-gray-900">Números Telnyx — Gestão de Provisionamento</h1>
      </div>

      {/* Badges de contagem */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-amber-200 p-4">
          <p className="text-2xl font-bold text-amber-700">{contagens.pendentes}</p>
          <p className="text-xs text-gray-500 mt-0.5">Pendentes</p>
        </div>
        <div className="bg-white rounded-xl border border-blue-200 p-4">
          <p className="text-2xl font-bold text-blue-700">{contagens.analise}</p>
          <p className="text-xs text-gray-500 mt-0.5">Em Análise</p>
        </div>
        <div className="bg-white rounded-xl border border-green-200 p-4">
          <p className="text-2xl font-bold text-green-700">{contagens.ativos}</p>
          <p className="text-xs text-gray-500 mt-0.5">Ativos</p>
        </div>
        <div className="bg-white rounded-xl border border-red-200 p-4">
          <p className="text-2xl font-bold text-red-700">{contagens.rejeitados}</p>
          <p className="text-xs text-gray-500 mt-0.5">Rejeitados</p>
        </div>
      </div>

      {/* Tabs de filtro */}
      <div className="flex gap-2 mb-4">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setFiltro(tab.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filtro === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
        <button
          onClick={carregarSolicitacoes}
          className="ml-auto px-3 py-1.5 text-xs border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Atualizar
        </button>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Carregando solicitações...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">
            Nenhuma solicitação encontrada.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium w-8" />
                <th className="text-left px-4 py-3 font-medium">Empresa</th>
                <th className="text-left px-4 py-3 font-medium">DDD + Número</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Data</th>
                <th className="text-left px-4 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(sol => (
                <>
                  <tr
                    key={sol.id}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setExpandedId(expandedId === sol.id ? null : sol.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {expandedId === sol.id
                          ? <ChevronDown className="w-4 h-4" />
                          : <ChevronRight className="w-4 h-4" />
                        }
                      </button>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{sol.empresa || sol.razao_social || '—'}</td>
                    <td className="px-4 py-3 font-mono text-gray-700">
                      <span className="text-gray-400 mr-1">{sol.ddd}</span>
                      {formatarNumero(sol.numero_solicitado)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${STATUS_BADGE[sol.status] || 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABEL[sol.status] || sol.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatarData(sol.created_at)}</td>
                    <td className="px-4 py-3">
                      <RowActions sol={sol} onUpdate={handleUpdate} />
                    </td>
                  </tr>
                  {expandedId === sol.id && (
                    <tr key={`${sol.id}-expanded`}>
                      <td colSpan={6} className="p-0">
                        <ExpandedRow sol={sol} />
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
