import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Check,
  X,
  Download,
  CreditCard,
  ChevronRight,
  Zap,
  TrendingUp,
  Building2,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Plan {
  id: 'starter' | 'growth' | 'enterprise'
  name: string
  icon: React.ReactNode
  monthlyPrice: number
  annualPrice: number
  agents: string
  calls: string
  features: { label: string; included: boolean }[]
  cta: string
  ctaStyle: 'gray' | 'blue' | 'green'
  badge?: string
  current?: boolean
}

interface Invoice {
  month: string
  plan: string
  value: number
  status: 'Pago'
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    icon: <Zap className="w-5 h-5" />,
    monthlyPrice: 997,
    annualPrice: 797,
    agents: '1 agente de IA',
    calls: '500 ligações/mês',
    features: [
      { label: '1 agente de IA', included: true },
      { label: '500 ligações/mês', included: true },
      { label: 'E-mail follow-up automático', included: true },
      { label: 'Relatórios básicos', included: true },
      { label: 'Suporte por e-mail', included: true },
      { label: 'Inteligência Coletiva', included: false },
      { label: 'Cross-cliente', included: false },
      { label: 'Treinamento personalizado', included: false },
    ],
    cta: 'Fazer upgrade',
    ctaStyle: 'gray',
  },
  {
    id: 'growth',
    name: 'Growth',
    icon: <TrendingUp className="w-5 h-5" />,
    monthlyPrice: 1997,
    annualPrice: 1597,
    agents: '3 agentes de IA',
    calls: '2.000 ligações/mês',
    features: [
      { label: '3 agentes de IA', included: true },
      { label: '2.000 ligações/mês', included: true },
      { label: 'Tudo do Starter', included: true },
      { label: 'Inteligência Coletiva', included: true },
      { label: 'Cross-cliente automático', included: true },
      { label: 'Treinamento com gravações', included: true },
      { label: 'Relatórios avançados', included: true },
      { label: 'Suporte prioritário (WhatsApp)', included: true },
    ],
    cta: 'Plano atual',
    ctaStyle: 'blue',
    badge: 'Mais popular',
    current: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    icon: <Building2 className="w-5 h-5" />,
    monthlyPrice: 4997,
    annualPrice: 3997,
    agents: 'Agentes ilimitados',
    calls: 'Ligações ilimitadas',
    features: [
      { label: 'Agentes ilimitados', included: true },
      { label: 'Ligações ilimitadas', included: true },
      { label: 'Tudo do Growth', included: true },
      { label: 'IA personalizada (fine-tuning)', included: true },
      { label: 'Integração CRM nativa', included: true },
      { label: 'Manager dedicado', included: true },
      { label: 'SLA garantido', included: true },
    ],
    cta: 'Falar com vendas',
    ctaStyle: 'green',
  },
]

const INVOICES: Invoice[] = [
  { month: 'Abril 2026', plan: 'Growth', value: 1997, status: 'Pago' },
  { month: 'Março 2026', plan: 'Growth', value: 1997, status: 'Pago' },
  { month: 'Fevereiro 2026', plan: 'Growth', value: 1997, status: 'Pago' },
  { month: 'Janeiro 2026', plan: 'Growth', value: 1997, status: 'Pago' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface ProgressBarProps {
  label: string
  current: number
  max?: number
  color: 'blue' | 'green'
  suffix?: string
}

function ProgressBar({ label, current, max, color, suffix }: ProgressBarProps) {
  const pct = max ? Math.min((current / max) * 100, 100) : null
  const barColor = color === 'blue' ? 'bg-blue-500' : 'bg-emerald-500'

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-gray-700">{label}</span>
        <span className="text-sm font-medium text-gray-900">
          {current.toLocaleString('pt-BR')}{max ? ` / ${max.toLocaleString('pt-BR')}` : ''}{suffix ?? ''}
          {pct !== null && <span className="text-gray-400 ml-1">({pct.toFixed(0)}%)</span>}
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: pct !== null ? `${pct}%` : '20%' }}
        />
      </div>
    </div>
  )
}

interface CardModalProps {
  onClose: () => void
}

function CardModal({ onClose }: CardModalProps) {
  const [numero, setNumero] = useState('')
  const [validade, setValidade] = useState('')
  const [cvv, setCvv] = useState('')
  const [nome, setNome] = useState('')
  const [saved, setSaved] = useState(false)

  function formatNumero(v: string) {
    return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
  }

  function formatValidade(v: string) {
    const raw = v.replace(/\D/g, '').slice(0, 4)
    if (raw.length >= 3) return raw.slice(0, 2) + '/' + raw.slice(2)
    return raw
  }

  function handleSalvar() {
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      onClose()
    }, 1500)
  }

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Alterar cartão</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Número do cartão</label>
            <input
              className={inputCls}
              placeholder="•••• •••• •••• ••••"
              value={numero}
              onChange={(e) => setNumero(formatNumero(e.target.value))}
              maxLength={19}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Validade</label>
              <input
                className={inputCls}
                placeholder="MM/AA"
                value={validade}
                onChange={(e) => setValidade(formatValidade(e.target.value))}
                maxLength={5}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">CVV</label>
              <input
                className={inputCls}
                placeholder="•••"
                type="password"
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                maxLength={4}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Nome no cartão</label>
            <input
              className={inputCls}
              placeholder="Como aparece no cartão"
              value={nome}
              onChange={(e) => setNome(e.target.value.toUpperCase())}
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50">Cancelar</button>
          <button
            onClick={handleSalvar}
            className={`flex-1 text-sm font-medium py-2 rounded-lg transition-colors ${saved ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
          >
            {saved ? '✓ Salvo' : 'Salvar cartão'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── ROI Calculator ───────────────────────────────────────────────────────────

const PLANO_CUSTOS: Record<string, number> = { starter: 997, growth: 1997, enterprise: 4997 }

function RoiCalculator({ planAtual }: { planAtual: string }) {
  const [modo, setModo] = useState<'vendedor' | 'sdr'>('vendedor')

  // Modo vendedor
  const [nVendedores, setNVendedores] = useState(5)
  const [ligacoesDia, setLigacoesDia] = useState(20)
  const [ticketMedio, setTicketMedio] = useState(3000)
  const [taxaFechamento, setTaxaFechamento] = useState(15)

  // Modo SDR+Closer
  const [nSdrs, setNSdrs] = useState(3)
  const [nClosers, setNClosers] = useState(2)
  const [ligacoesDiaSdr, setLigacoesDiaSdr] = useState(30)
  const [taxaAgendamento, setTaxaAgendamento] = useState(10)
  const [taxaFechamentoSdr, setTaxaFechamentoSdr] = useState(25)
  const [ticketMedioSdr, setTicketMedioSdr] = useState(5000)

  const custoPlano = PLANO_CUSTOS[planAtual.toLowerCase()] ?? 1997
  const diasMes = 22

  let agendamentosMes = 0
  let dealsMes = 0
  let receitaMes = 0

  if (modo === 'vendedor') {
    agendamentosMes = Math.round(nVendedores * ligacoesDia * diasMes * (taxaFechamento / 100))
    dealsMes = agendamentosMes
    receitaMes = dealsMes * ticketMedio
  } else {
    agendamentosMes = Math.round(nSdrs * ligacoesDiaSdr * diasMes * (taxaAgendamento / 100))
    dealsMes = Math.round(agendamentosMes * (taxaFechamentoSdr / 100))
    receitaMes = dealsMes * ticketMedioSdr
  }

  const roi = receitaMes > 0 ? Math.round(((receitaMes - custoPlano) / custoPlano) * 100) : 0
  const payback = receitaMes > 0 ? Math.round((custoPlano / receitaMes) * 30) : 0

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Calcule seu ROI</h2>
          <p className="text-sm text-gray-500 mt-0.5">Veja o retorno estimado com o ETZ</p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {(['vendedor', 'sdr'] as const).map(m => (
            <button
              key={m}
              onClick={() => setModo(m)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${modo === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {m === 'vendedor' ? 'Modo Vendedor' : 'Modo SDR+Closer'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Inputs */}
        <div className="space-y-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Parâmetros</p>
          {modo === 'vendedor' ? (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nº de vendedores</label>
                <input type="number" min={1} value={nVendedores} onChange={e => setNVendedores(Number(e.target.value))} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Ligações/dia por vendedor</label>
                <input type="number" min={1} value={ligacoesDia} onChange={e => setLigacoesDia(Number(e.target.value))} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Ticket médio (R$)</label>
                <input type="number" min={0} value={ticketMedio} onChange={e => setTicketMedio(Number(e.target.value))} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Taxa de fechamento (%)</label>
                <input type="number" min={0} max={100} value={taxaFechamento} onChange={e => setTaxaFechamento(Number(e.target.value))} className={inputCls} />
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nº de SDRs</label>
                  <input type="number" min={1} value={nSdrs} onChange={e => setNSdrs(Number(e.target.value))} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nº de Closers</label>
                  <input type="number" min={1} value={nClosers} onChange={e => setNClosers(Number(e.target.value))} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Ligações/dia por SDR</label>
                <input type="number" min={1} value={ligacoesDiaSdr} onChange={e => setLigacoesDiaSdr(Number(e.target.value))} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Taxa agendamento (%)</label>
                <input type="number" min={0} max={100} value={taxaAgendamento} onChange={e => setTaxaAgendamento(Number(e.target.value))} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Taxa fechamento (%)</label>
                <input type="number" min={0} max={100} value={taxaFechamentoSdr} onChange={e => setTaxaFechamentoSdr(Number(e.target.value))} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Ticket médio (R$)</label>
                <input type="number" min={0} value={ticketMedioSdr} onChange={e => setTicketMedioSdr(Number(e.target.value))} className={inputCls} />
              </div>
            </>
          )}
        </div>

        {/* Results */}
        <div className="space-y-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Resultado estimado / mês</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Agendamentos/mês</p>
              <p className="text-2xl font-bold font-mono text-gray-900">{agendamentosMes.toLocaleString('pt-BR')}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Deals fechados/mês</p>
              <p className="text-2xl font-bold font-mono text-gray-900">{dealsMes.toLocaleString('pt-BR')}</p>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
              <p className="text-xs text-green-600 mb-1">Receita gerada</p>
              <p className="text-xl font-bold font-mono text-green-700">{formatBRL(receitaMes)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Custo ETZ</p>
              <p className="text-xl font-bold font-mono text-gray-700">{formatBRL(custoPlano)}</p>
            </div>
            <div className={`rounded-xl p-4 border ${roi >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
              <p className={`text-xs mb-1 ${roi >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>ROI</p>
              <p className={`text-2xl font-bold font-mono ${roi >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{roi}%</p>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-xs text-blue-600 mb-1">Payback</p>
              <p className="text-2xl font-bold font-mono text-blue-700">{payback} dias</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlanosPage() {
  const navigate = useNavigate()
  const [annual, setAnnual] = useState(false)
  const [showCardModal, setShowCardModal] = useState(false)

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Planos e Cobrança</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gerencie seu plano e histórico de pagamentos</p>
        </div>
        <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-blue-100">
          Plano Atual: Growth
        </span>
      </div>

      {/* Toggle */}
      <div className="flex items-center justify-center gap-3">
        <span className={`text-sm font-medium ${!annual ? 'text-gray-900' : 'text-gray-400'}`}>Mensal</span>
        <button
          onClick={() => setAnnual(v => !v)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${annual ? 'bg-blue-600' : 'bg-gray-200'}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${annual ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
        <span className={`text-sm font-medium ${annual ? 'text-gray-900' : 'text-gray-400'}`}>
          Anual
          <span className="ml-2 bg-emerald-100 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full">-20%</span>
        </span>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-3 gap-4">
        {PLANS.map(plan => {
          const price = annual ? plan.annualPrice : plan.monthlyPrice
          const crossed = annual ? plan.monthlyPrice : null

          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl border p-6 flex flex-col ${
                plan.current
                  ? 'border-blue-500 shadow-lg shadow-blue-100 bg-white'
                  : 'border-gray-200 bg-white'
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                  {plan.badge}
                </span>
              )}

              <div className="flex items-center gap-2 mb-4">
                <div className={`p-1.5 rounded-lg ${plan.current ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                  {plan.icon}
                </div>
                <span className="font-semibold text-gray-900">{plan.name}</span>
              </div>

              <div className="mb-6">
                {crossed && (
                  <span className="block text-sm text-gray-400 line-through mb-0.5">
                    {formatBRL(crossed)}/mês
                  </span>
                )}
                <span className="text-3xl font-bold text-gray-900">{formatBRL(price)}</span>
                <span className="text-sm text-gray-500">/mês</span>
              </div>

              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.features.map(f => (
                  <li key={f.label} className="flex items-start gap-2">
                    {f.included
                      ? <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      : <X className="w-4 h-4 text-gray-300 mt-0.5 shrink-0" />
                    }
                    <span className={`text-sm ${f.included ? 'text-gray-700' : 'text-gray-400'}`}>{f.label}</span>
                  </li>
                ))}
              </ul>

              <button
                disabled={plan.current}
                onClick={
                  plan.current
                    ? undefined
                    : plan.id === 'enterprise'
                    ? () => window.open('mailto:vendas@etztech.com?subject=Interesse no plano Enterprise', '_blank')
                    : () => navigate('/checkout')
                }
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  plan.ctaStyle === 'blue'
                    ? 'bg-blue-600 text-white opacity-60 cursor-default'
                    : plan.ctaStyle === 'green'
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          )
        })}
      </div>

      {/* Usage */}
      {/* TODO: conectar planosApi.list() ou dashboardApi.get() para dados reais de uso */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900">Uso este mês</h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Dados de demonstração</span>
        </div>
        <div className="space-y-5">
          <ProgressBar label="Ligações" current={1284} max={2000} color="blue" />
          <ProgressBar label="Reuniões agendadas" current={87} color="green" suffix=" reuniões" />
          <ProgressBar label="Agentes ativos" current={2} max={3} color="blue" />
        </div>
      </div>

      {/* Billing history */}
      {/* TODO: conectar planosApi.getFaturas() — dados abaixo são de demonstração */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900">Histórico de cobrança</h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Dados de demonstração</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3">Mês</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3">Plano</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3">Valor</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3">Status</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {INVOICES.map(inv => (
              <tr key={inv.month} className="hover:bg-gray-50/50">
                <td className="py-3 text-gray-900 font-medium">{inv.month}</td>
                <td className="py-3 text-gray-600">{inv.plan}</td>
                <td className="py-3 text-gray-900">{formatBRL(inv.value)}</td>
                <td className="py-3">
                  <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {inv.status}
                  </span>
                </td>
                <td className="py-3">
                  <button
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title={`Baixar fatura ${inv.month}`}
                    onClick={() => {
                      const csv = `Fatura,Mês,Plano,Valor,Status\n${inv.month},${inv.month},${inv.plan},${inv.value},${inv.status}`
                      const blob = new Blob([csv], { type: 'text/csv' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `fatura-${inv.month.replace(' ', '-').toLowerCase()}.csv`
                      a.click()
                      URL.revokeObjectURL(url)
                    }}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Payment method */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">Método de pagamento</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Visa •••• 4521</p>
              <p className="text-xs text-gray-500">Vencimento: 03/28</p>
            </div>
          </div>
          <button
            onClick={() => setShowCardModal(true)}
            className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Alterar cartão
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ROI Calculator */}
      <RoiCalculator planAtual="Growth" />

      {showCardModal && <CardModal onClose={() => setShowCardModal(false)} />}
    </div>
  )
}
