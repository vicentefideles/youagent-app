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
  plano: 'Starter' | 'Growth' | 'Enterprise'
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

// ─── Data ─────────────────────────────────────────────────────────────────────

const KPIS: KpiCard[] = [
  { label: 'Clientes Ativos', value: '34', delta: '▲ 3 este mês', up: true, icon: <Users className="w-5 h-5" /> },
  { label: 'MRR Total', value: 'R$ 67.850', delta: '▲ 8,2%', up: true, icon: <TrendingUp className="w-5 h-5" /> },
  { label: 'Ligações/Dia', value: '2.847', delta: '▲ 12%', up: true, icon: <Phone className="w-5 h-5" /> },
  { label: 'Reuniões Geradas', value: '1.204', delta: '▲ 18%', up: true, icon: <Calendar className="w-5 h-5" /> },
  { label: 'Churn Rate', value: '2,1%', delta: '▼ 0,3%', up: false, icon: <TrendingDown className="w-5 h-5" /> },
  { label: 'NPS', value: '72', delta: '▲ 4 pts', up: true, icon: <Star className="w-5 h-5" /> },
]

const MRR_MONTHS: MrrMonth[] = [
  { month: 'Dez', value: 51200 },
  { month: 'Jan', value: 54800 },
  { month: 'Fev', value: 58300 },
  { month: 'Mar', value: 61200 },
  { month: 'Abr', value: 64900 },
  { month: 'Mai', value: 67850 },
]

const CLIENTES_RECENTES: Cliente[] = [
  { empresa: 'DataSoft', plano: 'Growth', data: '12/05/2026', status: 'Saudável' },
  { empresa: 'TechVision', plano: 'Enterprise', data: '08/05/2026', status: 'Em risco' },
  { empresa: 'InnovaB2B', plano: 'Starter', data: '03/05/2026', status: 'Em risco' },
  { empresa: 'BetaSolutions', plano: 'Growth', data: '29/04/2026', status: 'Saudável' },
  { empresa: 'NexoComercial', plano: 'Growth', data: '22/04/2026', status: 'Saudável' },
]

const ALERTAS: Alerta[] = [
  { severity: 'red', message: 'DataSoft — 94% do limite de ligações atingido' },
  { severity: 'amber', message: 'TechVision — Reunião marcada há 15 dias sem retorno' },
  { severity: 'amber', message: 'InnovaB2B — 3 pagamentos pendentes' },
  { severity: 'green', message: 'BetaSolutions — Meta mensal atingida (103%)' },
  { severity: 'green', message: 'Sistema — Uptime 99,97% nos últimos 30 dias' },
]

const PLANOS_DISTRIB: PlanoDistrib[] = [
  { name: 'Starter', clientes: 12, mrr: 11964 },
  { name: 'Growth', clientes: 18, mrr: 35946 },
  { name: 'Enterprise', clientes: 4, mrr: 19988 },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MAX_MRR = Math.max(...MRR_MONTHS.map(m => m.value))

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
              {CLIENTES_RECENTES.map(c => (
                <tr key={c.empresa} className="hover:bg-gray-50/50">
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
            {ALERTAS.map((a, i) => (
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
