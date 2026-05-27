import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Users,
  TrendingUp,
  Phone,
  Calendar,
  TrendingDown,
  Star,
  AlertTriangle,
  CheckCircle,
  Info,
} from 'lucide-react'
import { adminClientesApi, adminKpisApi } from '@/services/api'

// ─── Types ────────────────────────────────────────────────────────────────────

interface KpiCard {
  label: string
  value: string
  delta: string
  up: boolean
  icon: React.ReactNode
}

interface Cliente {
  empresa: string
  plano: string
  data: string
  status: 'Saudável' | 'Em risco'
}

interface Alerta {
  severity: 'red' | 'amber' | 'green'
  message: string
}

interface PlanoDistrib {
  name: string
  clientes: number
  mrr: number
}

interface MrrMonth {
  month: string
  value: number
}

interface ClienteAPI {
  id: string | number
  nome?: string
  empresa?: string
  plano?: string
  status?: string
  criado_em?: string
}

// ─── Pricing map ──────────────────────────────────────────────────────────────

const PLANO_MRR: Record<string, number> = {
  Starter: 890,
  Growth: 2490,
  Enterprise: 5990,
}

// ─── Static data (no backend endpoint yet) ────────────────────────────────────

const MRR_MONTHS: MrrMonth[] = [
  { month: 'Dez', value: 51200 },
  { month: 'Jan', value: 54800 },
  { month: 'Fev', value: 58300 },
  { month: 'Mar', value: 61200 },
  { month: 'Abr', value: 64900 },
  { month: 'Mai', value: 67850 },
]

const ALERTAS_FALLBACK: Alerta[] = [
  { severity: 'green', message: 'Sistema — Uptime 99,97% nos últimos 30 dias' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBRL(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })
}

function planoBadgeClass(plano: string): string {
  if (plano === 'Enterprise') return 'bg-purple-100 text-purple-700'
  if (plano === 'Growth') return 'bg-blue-100 text-blue-700'
  return 'bg-gray-100 text-gray-600'
}

function alertIcon(severity: Alerta['severity']) {
  if (severity === 'red') return <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
  if (severity === 'amber') return <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
  return <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const [clientes, setClientes] = useState<ClienteAPI[]>([])

  useEffect(() => {
    adminClientesApi.list()
      .then(res => setClientes((res.data as ClienteAPI[]) || []))
      .catch(() => setClientes([]))
  }, [])

  const { data: kpisGlobais } = useQuery({
    queryKey: ['admin-kpis-globais'],
    queryFn: () => adminKpisApi.globais().then(r => r.data as any),
  })

  const { data: alertas = ALERTAS_FALLBACK } = useQuery({
    queryKey: ['admin-alertas'],
    queryFn: () => adminKpisApi.alertas().then(r => r.data as any[]).catch(() => ALERTAS_FALLBACK),
  })

  // Derived KPIs from real data
  const ativos = clientes.filter(c => c.status === 'ativo')
  const aguardando = clientes.filter(c => c.status === 'aguardando_ativacao' || c.status === 'cadastrado')
  const mrrTotal = ativos.reduce((sum, c) => sum + (PLANO_MRR[c.plano ?? ''] ?? 0), 0)

  const KPIS: KpiCard[] = [
    { label: 'Clientes Ativos', value: String(ativos.length), delta: `${aguardando.length} aguardando`, up: true, icon: <Users className="w-5 h-5" /> },
    { label: 'MRR Total', value: formatBRL(mrrTotal), delta: '— calculado por plano', up: true, icon: <TrendingUp className="w-5 h-5" /> },
    { label: 'Ligações/Dia', value: kpisGlobais?.ligacoes_hoje ?? '—', delta: 'hoje', up: true, icon: <Phone className="w-5 h-5" /> },
    { label: 'Reuniões Geradas', value: kpisGlobais?.reunioes_30d ?? '—', delta: 'últimos 30 dias', up: true, icon: <Calendar className="w-5 h-5" /> },
    { label: 'Churn Rate', value: '—', delta: '—', up: false, icon: <TrendingDown className="w-5 h-5" /> },
    { label: 'NPS', value: '—', delta: '—', up: true, icon: <Star className="w-5 h-5" /> },
  ]

  // Clientes recentes: last 5 ordered by criado_em (API already returns desc)
  const clientesRecentes: Cliente[] = clientes.slice(0, 5).map(c => ({
    empresa: c.empresa || c.nome || '—',
    plano: c.plano || 'Starter',
    data: c.criado_em ? new Date(c.criado_em).toLocaleDateString('pt-BR') : '—',
    status: c.status === 'ativo' ? 'Saudável' : 'Em risco',
  }))

  // Distribuição por plano
  const planosMap: Record<string, number> = {}
  ativos.forEach(c => {
    const p = c.plano || 'Starter'
    planosMap[p] = (planosMap[p] ?? 0) + 1
  })
  const PLANOS_DISTRIB: PlanoDistrib[] = ['Starter', 'Growth', 'Enterprise'].map(name => ({
    name,
    clientes: planosMap[name] ?? 0,
    mrr: (planosMap[name] ?? 0) * (PLANO_MRR[name] ?? 0),
  }))

  const MAX_MRR = Math.max(...MRR_MONTHS.map(m => m.value))

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Painel Executivo</h1>
        <p className="text-sm text-gray-500 mt-0.5">Visão geral da plataforma ETZ</p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-6 gap-4">
        {KPIS.map(kpi => (
          <div key={kpi.label} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-500">{kpi.label}</span>
              <div className="text-gray-400">{kpi.icon}</div>
            </div>
            <p className="text-xl font-bold text-gray-900">{kpi.value}</p>
            <p className={`text-xs mt-1 font-medium ${kpi.up ? 'text-emerald-600' : 'text-red-500'}`}>
              {kpi.delta}
            </p>
          </div>
        ))}
      </div>

      {/* MRR Bar Chart */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-6">MRR dos últimos 6 meses</h2>
        <div className="flex items-end gap-6 h-40">
          {MRR_MONTHS.map(m => {
            const pct = (m.value / MAX_MRR) * 100
            return (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-medium text-gray-500">{formatBRL(m.value)}</span>
                <div className="w-full flex items-end" style={{ height: '100px' }}>
                  <div
                    className="w-full bg-blue-500 rounded-t-lg transition-all"
                    style={{ height: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500">{m.month}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* 2 columns */}
      <div className="grid grid-cols-2 gap-6">
        {/* Clientes recentes */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Clientes recentes</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3">Empresa</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3">Plano</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3">Data</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {clientesRecentes.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-sm text-gray-400">Nenhum cliente encontrado.</td>
                </tr>
              )}
              {clientesRecentes.map((c, i) => (
                <tr key={i} className="hover:bg-gray-50/50">
                  <td className="py-3 font-medium text-gray-900">{c.empresa}</td>
                  <td className="py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${planoBadgeClass(c.plano)}`}>
                      {c.plano}
                    </span>
                  </td>
                  <td className="py-3 text-gray-500">{c.data}</td>
                  <td className="py-3">
                    <span className={`flex items-center gap-1.5 text-xs font-medium ${c.status === 'Saudável' ? 'text-emerald-600' : 'text-red-500'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${c.status === 'Saudável' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Alertas */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Alertas da plataforma</h2>
          <ul className="space-y-3">
            {alertas.map((a, i) => (
              <li key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                {alertIcon(a.severity)}
                <span className="text-sm text-gray-700">{a.message}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Distribuição por plano */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-4">Distribuição por plano</h2>
        <div className="grid grid-cols-3 gap-4">
          {PLANOS_DISTRIB.map(p => (
            <div key={p.name} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${planoBadgeClass(p.name)}`}>{p.name}</span>
                <span className="text-sm font-medium text-gray-500">{p.clientes} clientes</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatBRL(p.mrr)}<span className="text-sm font-normal text-gray-400">/mês</span></p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
