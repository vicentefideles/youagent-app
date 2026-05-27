import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2,
  TrendingUp,
  Users,
  FileText,
  Megaphone,
  Mail,
  MessageSquare,
  Download,
  Eye,
  HeadphonesIcon,
  Loader2,
  X,
} from 'lucide-react'
import { api } from '@/services/api'

// ─── Interfaces ───────────────────────────────────────────────────────────────


interface ClienteAtivo {
  id: number
  empresa: string
  responsavel: string
  email: string
  plano: 'Starter' | 'Growth' | 'Enterprise'
  agentes: number
  reunioes: number
  mrr: number
  status: 'Saudável' | 'Em risco' | 'Churning'
  desde: string
  proximaRenovacao: string
}

interface Contrato {
  id: number
  empresa: string
  plano: string
  valor: number
  inicio: string
  termino: string
  status: 'Ativo' | 'Pendente' | 'Expirado'
}

interface Campanha {
  id: number
  empresa: string
  nome: string
  canal: 'Email' | 'WhatsApp'
  tipo: 'Prospecção' | 'Follow-up' | 'Reativação'
  status: 'Ativa' | 'Pausada' | 'Concluída'
  enviados: number
  abertos: number
  taxa: number
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const mockAtivos: ClienteAtivo[] = [
  { id: 1, empresa: 'Apex Corretora', responsavel: 'Thiago Moura', email: 'thiago@apexcorr.com.br', plano: 'Enterprise', agentes: 8, reunioes: 142, mrr: 5990, status: 'Saudável', desde: '2025-11-01', proximaRenovacao: '2026-11-01' },
  { id: 2, empresa: 'Genova Consultoria', responsavel: 'Ana Beatriz', email: 'ana@genova.com.br', plano: 'Growth', agentes: 3, reunioes: 67, mrr: 2490, status: 'Saudável', desde: '2026-01-15', proximaRenovacao: '2027-01-15' },
  { id: 3, empresa: 'Prime Imóveis SP', responsavel: 'Lucas Ferreira', email: 'lucas@primeimoveis.com.br', plano: 'Starter', agentes: 1, reunioes: 18, mrr: 890, status: 'Em risco', desde: '2026-03-01', proximaRenovacao: '2027-03-01' },
  { id: 4, empresa: 'TechSales Brasil', responsavel: 'Juliana Costa', email: 'juliana@techsales.com.br', plano: 'Growth', agentes: 4, reunioes: 53, mrr: 2490, status: 'Churning', desde: '2025-09-10', proximaRenovacao: '2026-09-10' },
  { id: 5, empresa: 'Conecta RH', responsavel: 'Paulo Mendes', email: 'paulo@conectarh.com.br', plano: 'Starter', agentes: 2, reunioes: 34, mrr: 890, status: 'Saudável', desde: '2026-02-20', proximaRenovacao: '2027-02-20' },
]

const mockContratos: Contrato[] = [
  { id: 1, empresa: 'Apex Corretora', plano: 'Enterprise', valor: 5990, inicio: '2025-11-01', termino: '2026-11-01', status: 'Ativo' },
  { id: 2, empresa: 'Genova Consultoria', plano: 'Growth', valor: 2490, inicio: '2026-01-15', termino: '2027-01-15', status: 'Ativo' },
  { id: 3, empresa: 'Prime Imóveis SP', plano: 'Starter', valor: 890, inicio: '2026-03-01', termino: '2027-03-01', status: 'Ativo' },
  { id: 4, empresa: 'TechSales Brasil', plano: 'Growth', valor: 2490, inicio: '2025-09-10', termino: '2026-09-10', status: 'Pendente' },
  { id: 5, empresa: 'Conecta RH', plano: 'Starter', valor: 890, inicio: '2026-02-20', termino: '2027-02-20', status: 'Ativo' },
]

const mockCampanhas: Campanha[] = [
  { id: 1, empresa: 'Apex Corretora', nome: 'Reativação Q2 2026', canal: 'Email', tipo: 'Reativação', status: 'Ativa', enviados: 1240, abertos: 496, taxa: 40 },
  { id: 2, empresa: 'Genova Consultoria', nome: 'Prospecção Indústria', canal: 'WhatsApp', tipo: 'Prospecção', status: 'Ativa', enviados: 580, abertos: 319, taxa: 55 },
  { id: 3, empresa: 'Prime Imóveis SP', nome: 'Follow-up Leads Frios', canal: 'Email', tipo: 'Follow-up', status: 'Pausada', enviados: 320, abertos: 83, taxa: 26 },
  { id: 4, empresa: 'TechSales Brasil', nome: 'Captação SaaS', canal: 'WhatsApp', tipo: 'Prospecção', status: 'Concluída', enviados: 2100, abertos: 945, taxa: 45 },
  { id: 5, empresa: 'Conecta RH', nome: 'Nurturing Setembro', canal: 'Email', tipo: 'Follow-up', status: 'Ativa', enviados: 760, abertos: 342, taxa: 45 },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBRL(n: number): string {
  return `R$ ${n.toLocaleString('pt-BR')}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR')
}

// ─── Badge components ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ClienteAtivo['status'] }) {
  const map: Record<ClienteAtivo['status'], string> = {
    'Saudável': 'bg-green-100 text-green-700',
    'Em risco': 'bg-amber-100 text-amber-700',
    'Churning': 'bg-red-100 text-red-700',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[status]}`}>
      {status}
    </span>
  )
}

function ContratoStatusBadge({ status }: { status: Contrato['status'] }) {
  const map: Record<Contrato['status'], string> = {
    Ativo: 'bg-green-100 text-green-700',
    Pendente: 'bg-amber-100 text-amber-700',
    Expirado: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[status]}`}>
      {status}
    </span>
  )
}

function CampanhaStatusBadge({ status }: { status: Campanha['status'] }) {
  const map: Record<Campanha['status'], string> = {
    Ativa: 'bg-green-100 text-green-700',
    Pausada: 'bg-amber-100 text-amber-700',
    Concluída: 'bg-gray-100 text-gray-600',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[status]}`}>
      {status}
    </span>
  )
}

function PlanoBadge({ plano }: { plano: string }) {
  const map: Record<string, string> = {
    Starter: 'bg-gray-100 text-gray-700',
    Growth: 'bg-brand-50 text-brand-700',
    Enterprise: 'bg-purple-100 text-purple-700',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[plano] ?? 'bg-gray-100 text-gray-700'}`}>
      {plano}
    </span>
  )
}

function ProgressBar({ value, color = 'bg-brand' }: { value: number; color?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 w-8 text-right">{value}%</span>
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  iconBg: string
}

function KpiCard({ label, value, icon, iconBg }: KpiCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-3">
      <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold font-mono text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

// ─── Table wrapper ────────────────────────────────────────────────────────────

function TableCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">{children}</table>
      </div>
    </div>
  )
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide bg-gray-50 border-b border-gray-200 ${className}`}>
      {children}
    </th>
  )
}

function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={`px-4 py-3 text-gray-700 align-middle ${className}`}>
      {children}
    </td>
  )
}

// ─── Tab: Pipeline (onboarding com dados reais) ───────────────────────────────

type FiltroOnboarding = 'aguardando_ativacao' | 'ativo' | 'documentos_rejeitados' | 'todos'

interface ClienteOnboarding {
  id: string | number
  empresa?: string
  razao_social?: string
  email?: string
  plano?: string
  data_assinatura_contrato?: string
  status?: string
  contrato_texto?: string
}

function TabPipeline() {
  const [clientes, setClientes] = useState<ClienteOnboarding[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState<FiltroOnboarding>('aguardando_ativacao')
  const [modalRejeitar, setModalRejeitar] = useState<ClienteOnboarding | null>(null)
  const [motivoRejeicao, setMotivoRejeicao] = useState('')
  const [modalContrato, setModalContrato] = useState<ClienteOnboarding | null>(null)
  const [acaoLoading, setAcaoLoading] = useState<string | number | null>(null)

  async function carregarClientes() {
    setLoading(true)
    try {
      const params = filtroStatus !== 'todos' ? `?status=${filtroStatus}` : ''
      const res = await api.get(`/admin/clientes${params}`)
      const data = res.data as ClienteOnboarding[]
      setClientes(data || [])
    } catch {
      setClientes([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarClientes()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroStatus])

  async function ativarCliente(id: string | number) {
    setAcaoLoading(id)
    try {
      await api.patch(`/admin/clientes/${id}`, { action: 'ativar' })
      await carregarClientes()
    } catch {
      // silencioso — tabela recarrega
    } finally {
      setAcaoLoading(null)
    }
  }

  async function rejeitarCliente() {
    if (!modalRejeitar) return
    setAcaoLoading(modalRejeitar.id)
    try {
      await api.patch(`/admin/clientes/${modalRejeitar.id}`, {
        action: 'rejeitar',
        motivo_rejeicao: motivoRejeicao,
      })
      setModalRejeitar(null)
      setMotivoRejeicao('')
      await carregarClientes()
    } catch {
      // silencioso
    } finally {
      setAcaoLoading(null)
    }
  }

  const FILTROS: { key: FiltroOnboarding; label: string }[] = [
    { key: 'aguardando_ativacao', label: 'Aguardando ativação' },
    { key: 'ativo', label: 'Ativos' },
    { key: 'documentos_rejeitados', label: 'Rejeitados' },
    { key: 'todos', label: 'Todos' },
  ]

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {FILTROS.map(f => (
          <button
            key={f.key}
            onClick={() => setFiltroStatus(f.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              filtroStatus === f.key
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-gray-500">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">Carregando...</span>
        </div>
      ) : (
        <TableCard>
          <thead>
            <tr>
              <Th>Empresa</Th>
              <Th>Email</Th>
              <Th>Plano</Th>
              <Th>Assinatura do contrato</Th>
              <Th>Ações</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {clientes.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-400">
                  Nenhum cliente encontrado.
                </td>
              </tr>
            )}
            {clientes.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                <Td>
                  <div>
                    <p className="font-medium text-gray-900">{c.empresa || '—'}</p>
                    {c.razao_social && <p className="text-xs text-gray-400">{c.razao_social}</p>}
                  </div>
                </Td>
                <Td>
                  <span className="text-xs text-gray-600">{c.email || '—'}</span>
                </Td>
                <Td>
                  {c.plano ? <PlanoBadge plano={c.plano} /> : <span className="text-xs text-gray-400">—</span>}
                </Td>
                <Td className="text-gray-500 text-xs">
                  {c.data_assinatura_contrato ? formatDate(c.data_assinatura_contrato) : '—'}
                </Td>
                <Td>
                  <div className="flex items-center gap-2 flex-wrap">
                    {c.contrato_texto && (
                      <button
                        onClick={() => setModalContrato(c)}
                        className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-800 font-medium transition-colors"
                      >
                        <Eye size={13} />
                        Ver contrato
                      </button>
                    )}
                    <button
                      onClick={() => ativarCliente(c.id)}
                      disabled={acaoLoading === c.id}
                      className="inline-flex items-center gap-1 text-xs text-green-700 hover:text-green-900 font-medium transition-colors disabled:opacity-50"
                    >
                      {acaoLoading === c.id ? <Loader2 size={12} className="animate-spin" /> : '✅'}
                      Ativar
                    </button>
                    <button
                      onClick={() => { setModalRejeitar(c); setMotivoRejeicao('') }}
                      disabled={acaoLoading === c.id}
                      className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-800 font-medium transition-colors disabled:opacity-50"
                    >
                      ❌ Rejeitar
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableCard>
      )}

      {/* Modal: Ver contrato */}
      {modalContrato && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <span className="text-sm font-semibold text-gray-900">
                Contrato — {modalContrato.empresa}
              </span>
              <button onClick={() => setModalContrato(null)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X size={16} className="text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                {modalContrato.contrato_texto}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Rejeitar */}
      {modalRejeitar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">
                Rejeitar — {modalRejeitar.empresa}
              </span>
              <button onClick={() => setModalRejeitar(null)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X size={16} className="text-gray-500" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Motivo da rejeição (enviado ao cliente)
              </label>
              <textarea
                rows={3}
                value={motivoRejeicao}
                onChange={e => setMotivoRejeicao(e.target.value)}
                placeholder="Ex: CNPJ não corresponde ao nome da empresa..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setModalRejeitar(null)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={rejeitarCliente}
                disabled={!motivoRejeicao.trim() || acaoLoading === modalRejeitar.id}
                className="px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {acaoLoading === modalRejeitar.id && <Loader2 size={13} className="animate-spin" />}
                Confirmar rejeição
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tab: Ativos ──────────────────────────────────────────────────────────────

function TabAtivos() {
  const navigate = useNavigate()
  const total = mockAtivos.length
  const mrrTotal = mockAtivos.reduce((acc, c) => acc + c.mrr, 0)
  const saudaveis = mockAtivos.filter((c) => c.status === 'Saudável').length
  const emRisco = mockAtivos.filter((c) => c.status === 'Em risco' || c.status === 'Churning').length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Clientes" value={total} iconBg="bg-brand-50" icon={<Users size={16} className="text-brand-600" />} />
        <KpiCard label="MRR Total" value={formatBRL(mrrTotal)} iconBg="bg-green-50" icon={<TrendingUp size={16} className="text-green-600" />} />
        <KpiCard label="Saudáveis" value={saudaveis} iconBg="bg-emerald-50" icon={<Users size={16} className="text-emerald-600" />} />
        <KpiCard label="Em Risco" value={emRisco} iconBg="bg-red-50" icon={<Users size={16} className="text-red-500" />} />
      </div>

      <TableCard>
        <thead>
          <tr>
            <Th>Empresa</Th>
            <Th>Plano</Th>
            <Th>Agentes</Th>
            <Th>Reuniões/mês</Th>
            <Th>MRR</Th>
            <Th>Status</Th>
            <Th>Renovação</Th>
            <Th>Ações</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {mockAtivos.map((c) => (
            <tr key={c.id} className="hover:bg-gray-50 transition-colors">
              <Td>
                <div>
                  <p className="font-medium text-gray-900">{c.empresa}</p>
                  <p className="text-xs text-gray-400">{c.responsavel}</p>
                </div>
              </Td>
              <Td><PlanoBadge plano={c.plano} /></Td>
              <Td><span className="font-mono font-medium">{c.agentes}</span></Td>
              <Td><span className="font-mono">{c.reunioes}</span></Td>
              <Td><span className="font-mono font-medium">{formatBRL(c.mrr)}</span></Td>
              <Td><StatusBadge status={c.status} /></Td>
              <Td className="text-gray-500 text-xs">{formatDate(c.proximaRenovacao)}</Td>
              <Td>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate('/admin/clientes?id=' + c.id)}
                    className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-800 font-medium transition-colors"
                  >
                    <Eye size={13} />
                    Detalhes
                  </button>
                  <button
                    onClick={() => navigate('/admin/suporte')}
                    className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 font-medium transition-colors"
                  >
                    <HeadphonesIcon size={13} />
                    Suporte
                  </button>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </TableCard>
    </div>
  )
}

// ─── Tab: Contratos ───────────────────────────────────────────────────────────

function TabContratos() {
  const ativos = mockContratos.filter((c) => c.status === 'Ativo')
  const valorTotal = ativos.reduce((acc, c) => acc + c.valor, 0)

  const hoje = new Date()
  const em30dias = new Date(hoje)
  em30dias.setDate(hoje.getDate() + 30)
  const vencendo = mockContratos.filter((c) => {
    const termino = new Date(c.termino)
    return termino >= hoje && termino <= em30dias
  }).length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="Contratos ativos" value={ativos.length} iconBg="bg-green-50" icon={<FileText size={16} className="text-green-600" />} />
        <KpiCard label="Valor total/mês" value={formatBRL(valorTotal)} iconBg="bg-brand-50" icon={<TrendingUp size={16} className="text-brand-600" />} />
        <KpiCard label="Vencendo em 30 dias" value={vencendo} iconBg="bg-amber-50" icon={<FileText size={16} className="text-amber-600" />} />
      </div>

      <TableCard>
        <thead>
          <tr>
            <Th>Empresa</Th>
            <Th>Plano</Th>
            <Th>Valor/mês</Th>
            <Th>Início</Th>
            <Th>Término</Th>
            <Th>Status</Th>
            <Th>Ações</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {mockContratos.map((c) => (
            <tr key={c.id} className="hover:bg-gray-50 transition-colors">
              <Td><p className="font-medium text-gray-900">{c.empresa}</p></Td>
              <Td><PlanoBadge plano={c.plano} /></Td>
              <Td><span className="font-mono font-medium">{formatBRL(c.valor)}</span></Td>
              <Td className="text-gray-500 text-xs">{formatDate(c.inicio)}</Td>
              <Td className="text-gray-500 text-xs">{formatDate(c.termino)}</Td>
              <Td><ContratoStatusBadge status={c.status} /></Td>
              <Td>
                <button
                  onClick={() => {
                    const texto = `Contrato ${c.id}\nEmpresa: ${c.empresa}\nPlano: ${c.plano}\nValor: R$ ${c.valor}`
                    const blob = new Blob([texto], { type: 'text/plain' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a'); a.href = url; a.download = `contrato-${c.id}.txt`; a.click()
                  }}
                  className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 font-medium transition-colors"
                >
                  <Download size={13} />
                  Download
                </button>
              </Td>
            </tr>
          ))}
        </tbody>
      </TableCard>
    </div>
  )
}

// ─── Tab: Campanhas ───────────────────────────────────────────────────────────

type FiltroCanal = 'Todos' | 'Email' | 'WhatsApp'
type FiltroTipo = 'Todos' | 'Prospecção' | 'Follow-up' | 'Reativação'

function TabCampanhas() {
  const [filtroCanal, setFiltroCanal] = useState<FiltroCanal>('Todos')
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>('Todos')

  const filtradas = mockCampanhas.filter((c) => {
    const okCanal = filtroCanal === 'Todos' || c.canal === filtroCanal
    const okTipo = filtroTipo === 'Todos' || c.tipo === filtroTipo
    return okCanal && okTipo
  })

  const canais: FiltroCanal[] = ['Todos', 'Email', 'WhatsApp']
  const tipos: FiltroTipo[] = ['Todos', 'Prospecção', 'Follow-up', 'Reativação']

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {canais.map((c) => (
            <button
              key={c}
              onClick={() => setFiltroCanal(c)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                filtroCanal === c
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {tipos.map((t) => (
            <button
              key={t}
              onClick={() => setFiltroTipo(t)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                filtroTipo === t
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-400">{filtradas.length} campanhas</span>
      </div>

      <TableCard>
        <thead>
          <tr>
            <Th>Empresa</Th>
            <Th>Campanha</Th>
            <Th>Canal</Th>
            <Th>Tipo</Th>
            <Th>Status</Th>
            <Th>Enviados</Th>
            <Th>Abertos</Th>
            <Th>Taxa de abertura</Th>
            <Th>Ações</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {filtradas.map((c) => (
            <tr key={c.id} className="hover:bg-gray-50 transition-colors">
              <Td><p className="font-medium text-gray-900">{c.empresa}</p></Td>
              <Td><p className="text-gray-700">{c.nome}</p></Td>
              <Td>
                <div className="flex items-center gap-1.5 text-gray-600">
                  {c.canal === 'Email' ? (
                    <Mail size={13} className="text-blue-500" />
                  ) : (
                    <MessageSquare size={13} className="text-green-500" />
                  )}
                  <span className="text-xs">{c.canal}</span>
                </div>
              </Td>
              <Td><span className="text-xs text-gray-600">{c.tipo}</span></Td>
              <Td><CampanhaStatusBadge status={c.status} /></Td>
              <Td><span className="font-mono text-gray-700">{c.enviados.toLocaleString('pt-BR')}</span></Td>
              <Td><span className="font-mono text-gray-700">{c.abertos.toLocaleString('pt-BR')}</span></Td>
              <Td className="min-w-[140px]">
                <ProgressBar
                  value={c.taxa}
                  color={c.taxa >= 40 ? 'bg-green-500' : c.taxa >= 25 ? 'bg-amber-500' : 'bg-red-400'}
                />
              </Td>
              <Td>
                <button
                  onClick={() => window.alert('Campanha: ' + c.nome + '\nStatus: ' + c.status + '\nEnviados: ' + c.enviados + '\nAbertos: ' + c.abertos + '\nTaxa: ' + c.taxa + '%')}
                  className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-800 font-medium transition-colors"
                >
                  <Eye size={13} />
                  Ver
                </button>
              </Td>
            </tr>
          ))}
          {filtradas.length === 0 && (
            <tr>
              <td colSpan={9} className="px-4 py-10 text-center text-sm text-gray-400">
                Nenhuma campanha encontrada para os filtros selecionados.
              </td>
            </tr>
          )}
        </tbody>
      </TableCard>
    </div>
  )
}

// ─── Tab: Marketing ──────────────────────────────────────────────────────────

interface MktCampanha {
  id: number
  nome: string
  tipo: 'Email' | 'WhatsApp' | 'SMS'
  segmento: string
  enviados: number
  abertos: number
  convertidos: number
  status: 'Ativa' | 'Pausada' | 'Rascunho'
}

interface MktCampanhaForm {
  nome: string
  tipo: 'Email' | 'WhatsApp' | 'SMS'
  segmento: string
  template: string
  agendamento: string
}

const mockMktCampanhas: MktCampanha[] = [
  { id: 1, nome: 'Newsletter Maio 2026', tipo: 'Email', segmento: 'Todos os clientes', enviados: 3200, abertos: 1440, convertidos: 87, status: 'Ativa' },
  { id: 2, nome: 'Reativação Inativos', tipo: 'WhatsApp', segmento: 'Clientes inativos 60d', enviados: 450, abertos: 315, convertidos: 42, status: 'Ativa' },
  { id: 3, nome: 'Upgrade Enterprise', tipo: 'Email', segmento: 'Clientes Growth', enviados: 180, abertos: 108, convertidos: 12, status: 'Pausada' },
  { id: 4, nome: 'Promoção Anual', tipo: 'SMS', segmento: 'Leads quentes', enviados: 890, abertos: 712, convertidos: 55, status: 'Ativa' },
  { id: 5, nome: 'Onboarding Novos', tipo: 'Email', segmento: 'Novos clientes', enviados: 95, abertos: 80, convertidos: 30, status: 'Rascunho' },
]

function MktStatusBadge({ status }: { status: MktCampanha['status'] }) {
  const map: Record<MktCampanha['status'], string> = {
    Ativa: 'bg-green-100 text-green-700',
    Pausada: 'bg-amber-100 text-amber-700',
    Rascunho: 'bg-gray-100 text-gray-600',
  }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[status]}`}>{status}</span>
}

function MktTipoBadge({ tipo }: { tipo: MktCampanha['tipo'] }) {
  const map: Record<MktCampanha['tipo'], string> = {
    Email: 'bg-blue-50 text-blue-700',
    WhatsApp: 'bg-green-50 text-green-700',
    SMS: 'bg-purple-50 text-purple-700',
  }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[tipo]}`}>{tipo}</span>
}

function TabMarketing() {
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<MktCampanhaForm>({ nome: '', tipo: 'Email', segmento: '', template: '', agendamento: '' })
  const [mktCampanhas, setMktCampanhas] = useState<MktCampanha[]>(mockMktCampanhas)

  const campanhasAtivas = mktCampanhas.filter(c => c.status === 'Ativa').length
  const totalEnviados = mktCampanhas.reduce((a, c) => a + c.enviados, 0)
  const totalAbertos = mktCampanhas.reduce((a, c) => a + c.abertos, 0)
  const taxaAbertura = totalEnviados > 0 ? Math.round((totalAbertos / totalEnviados) * 100) : 0
  const totalConvertidos = mktCampanhas.reduce((a, c) => a + c.convertidos, 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Campanhas ativas" value={campanhasAtivas} iconBg="bg-green-50" icon={<Megaphone size={16} className="text-green-600" />} />
        <KpiCard label="E-mails enviados/mês" value={totalEnviados.toLocaleString('pt-BR')} iconBg="bg-blue-50" icon={<Mail size={16} className="text-blue-600" />} />
        <KpiCard label="Taxa de abertura" value={`${taxaAbertura}%`} iconBg="bg-amber-50" icon={<TrendingUp size={16} className="text-amber-600" />} />
        <KpiCard label="Conversões" value={totalConvertidos} iconBg="bg-brand-50" icon={<Users size={16} className="text-brand-600" />} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <p className="text-sm font-semibold text-gray-900">Campanhas de marketing</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Nova campanha de marketing
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <Th>Nome</Th>
                <Th>Tipo</Th>
                <Th>Segmento alvo</Th>
                <Th>Enviados</Th>
                <Th>Abertos</Th>
                <Th>Convertidos</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mktCampanhas.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <Td><p className="font-medium text-gray-900">{c.nome}</p></Td>
                  <Td><MktTipoBadge tipo={c.tipo} /></Td>
                  <Td><span className="text-xs text-gray-600">{c.segmento}</span></Td>
                  <Td><span className="font-mono">{c.enviados.toLocaleString('pt-BR')}</span></Td>
                  <Td><span className="font-mono">{c.abertos.toLocaleString('pt-BR')}</span></Td>
                  <Td><span className="font-mono text-green-700 font-medium">{c.convertidos}</span></Td>
                  <Td><MktStatusBadge status={c.status} /></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-gray-900">Nova campanha de marketing</span>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
                <Building2 size={16} />
              </button>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Nome da campanha', key: 'nome' as const, type: 'text', placeholder: 'Ex: Newsletter Junho' },
                { label: 'Segmento', key: 'segmento' as const, type: 'text', placeholder: 'Ex: Clientes Growth' },
                { label: 'Template', key: 'template' as const, type: 'text', placeholder: 'Ex: template-promo-01' },
                { label: 'Agendamento', key: 'agendamento' as const, type: 'date', placeholder: '' },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{field.label}</label>
                  <input
                    type={field.type}
                    value={form[field.key]}
                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
                <select
                  value={form.tipo}
                  onChange={e => setForm(f => ({ ...f, tipo: e.target.value as MktCampanha['tipo'] }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>Email</option>
                  <option>WhatsApp</option>
                  <option>SMS</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
              <button
                onClick={() => {
                  const nova: MktCampanha = { id: Date.now(), nome: form.nome || 'Nova campanha', tipo: form.tipo, segmento: form.segmento || '—', enviados: 0, abertos: 0, convertidos: 0, status: 'Rascunho' }
                  setMktCampanhas(prev => [nova, ...prev])
                  setShowModal(false)
                  setForm({ nome: '', tipo: 'Email', segmento: '', template: '', agendamento: '' })
                }}
                className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >Criar campanha</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type TabId = 'pipeline' | 'ativos' | 'contratos' | 'campanhas' | 'marketing'

interface TabDef {
  id: TabId
  label: string
  icon: React.ReactNode
}

const tabs: TabDef[] = [
  { id: 'pipeline', label: 'Pipeline', icon: <TrendingUp size={15} /> },
  { id: 'ativos', label: 'Ativos', icon: <Users size={15} /> },
  { id: 'contratos', label: 'Contratos', icon: <FileText size={15} /> },
  { id: 'campanhas', label: 'Campanhas', icon: <Megaphone size={15} /> },
  { id: 'marketing', label: 'Marketing', icon: <Mail size={15} /> },
]

export default function AdminClientesPage() {
  const [activeTab, setActiveTab] = useState<TabId>('pipeline')

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-1">
          <Building2 size={22} className="text-gray-700" />
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Clientes</h1>
        </div>
        <p className="text-sm text-gray-500">Gestão da base de clientes</p>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-gray-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.id
                ? 'border-brand text-brand-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'pipeline' && <TabPipeline />}
      {activeTab === 'ativos' && <TabAtivos />}
      {activeTab === 'contratos' && <TabContratos />}
      {activeTab === 'campanhas' && <TabCampanhas />}
      {activeTab === 'marketing' && <TabMarketing />}
    </div>
  )
}
