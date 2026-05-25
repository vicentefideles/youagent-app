import { useState } from 'react'
import {
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Server,
  Database,
  Phone,
  Mic,
  Cpu,
  Globe,
  TrendingUp,
  Users,
  Bot,
  Target,
  FileText,
  CreditCard,
  Bell,
  ChevronRight,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'financeiro' | 'cobrancas' | 'infra' | 'metricas' | 'comercial' | 'contratos'

type ContratosSubTab = 'assinados' | 'template'

type StatusServico = 'online' | 'degradado' | 'offline'

interface KpiCard {
  label: string
  value: string
  delta?: string
  up?: boolean
}

interface ClienteReceita {
  empresa: string
  plano: 'Starter' | 'Growth' | 'Scale'
  valorMensal: number
  ultimoPagamento: string
  status: 'ativo' | 'inadimplente' | 'cancelado'
}

interface Cobranca {
  id: number
  empresa: string
  valor: number
  vencimento: string
  status: 'pago' | 'pendente' | 'atrasado'
}

interface ServicoInfra {
  nome: string
  icon: React.ReactNode
  status: StatusServico
  uptime: string
  latencia: string
  usoMensal: string
  descricao: string
}

interface PlanoDistribuicao {
  nome: string
  qtd: number
  pct: number
  cor: string
}

interface ClienteAgente {
  empresa: string
  agentes: number
  ligacoesDia: number
  conversao: number
}

interface CicloVida {
  fase: string
  qtd: number
  cor: string
  bgCor: string
}

interface PipelineColuna {
  fase: string
  cor: string
  bgCor: string
  valor: string
  cards: { empresa: string; contato: string; valor: string; dias: number }[]
}

interface ContratoAssinado {
  empresa: string
  plano: 'Starter' | 'Growth' | 'Scale'
  dataAssinatura: string
  agentes: number
  valor: number
  status: 'ativo' | 'trial' | 'cancelado'
}

interface Incidente {
  data: string
  servico: string
  descricao: string
  duracao: string
  resolvido: boolean
}

// ─── Static Data ──────────────────────────────────────────────────────────────

const KPIS_FINANCEIRO: KpiCard[] = [
  { label: 'MRR Total', value: 'R$ 67.850', delta: '▲ 8,2%', up: true },
  { label: 'MRR Starter', value: 'R$ 8.946', delta: '▲ 3%', up: true },
  { label: 'MRR Growth', value: 'R$ 32.184', delta: '▲ 11%', up: true },
  { label: 'Churn Rate', value: '2,1%', delta: '▼ 0,4%', up: false },
  { label: 'Inadimplência', value: '4,8%', delta: '▲ 1,2%', up: true },
]

const MRR_MESES = [
  { mes: 'Dez', mrr: 48200 },
  { mes: 'Jan', mrr: 53400 },
  { mes: 'Fev', mrr: 56800 },
  { mes: 'Mar', mrr: 59100 },
  { mes: 'Abr', mrr: 63200 },
  { mes: 'Mai', mrr: 67850 },
]

const CLIENTES_RECEITA: ClienteReceita[] = [
  { empresa: 'TechVision', plano: 'Scale', valorMensal: 11940, ultimoPagamento: '01/05/2026', status: 'ativo' },
  { empresa: 'MegaCorp', plano: 'Scale', valorMensal: 11940, ultimoPagamento: '03/05/2026', status: 'ativo' },
  { empresa: 'InnovaB2B', plano: 'Growth', valorMensal: 3576, ultimoPagamento: '05/05/2026', status: 'ativo' },
  { empresa: 'BetaSolutions', plano: 'Growth', valorMensal: 3576, ultimoPagamento: '02/05/2026', status: 'ativo' },
  { empresa: 'ConsultPro', plano: 'Growth', valorMensal: 3576, ultimoPagamento: '07/05/2026', status: 'ativo' },
  { empresa: 'DataSoft', plano: 'Starter', valorMensal: 994, ultimoPagamento: '15/04/2026', status: 'inadimplente' },
  { empresa: 'StartupXYZ', plano: 'Starter', valorMensal: 994, ultimoPagamento: '01/05/2026', status: 'ativo' },
  { empresa: 'Aceleratek', plano: 'Growth', valorMensal: 3576, ultimoPagamento: '—', status: 'cancelado' },
]

const COBRANCAS: Cobranca[] = [
  { id: 1, empresa: 'TechVision', valor: 11940, vencimento: '01/06/2026', status: 'pendente' },
  { id: 2, empresa: 'MegaCorp', valor: 11940, vencimento: '03/06/2026', status: 'pendente' },
  { id: 3, empresa: 'InnovaB2B', valor: 3576, vencimento: '05/05/2026', status: 'pago' },
  { id: 4, empresa: 'BetaSolutions', valor: 3576, vencimento: '02/05/2026', status: 'pago' },
  { id: 5, empresa: 'DataSoft', valor: 994, vencimento: '15/04/2026', status: 'atrasado' },
  { id: 6, empresa: 'ConsultPro', valor: 3576, vencimento: '07/05/2026', status: 'pago' },
  { id: 7, empresa: 'StartupXYZ', valor: 994, vencimento: '01/06/2026', status: 'pendente' },
  { id: 8, empresa: 'NexoComercial', valor: 3576, vencimento: '10/04/2026', status: 'atrasado' },
]

const SERVICOS_INFRA: ServicoInfra[] = [
  {
    nome: 'Supabase',
    icon: <Database className="w-5 h-5" />,
    status: 'online',
    uptime: '99,97%',
    latencia: '12ms',
    usoMensal: 'R$ 332/mês',
    descricao: 'Banco de dados, Auth e Storage',
  },
  {
    nome: 'Telnyx Voice',
    icon: <Phone className="w-5 h-5" />,
    status: 'online',
    uptime: '99,95%',
    latencia: '45ms',
    usoMensal: 'R$ 3.568/mês',
    descricao: 'Agent AI — STT + TTS + Carrier',
  },
  {
    nome: 'ElevenLabs TTS',
    icon: <Mic className="w-5 h-5" />,
    status: 'online',
    uptime: '99,88%',
    latencia: '180ms',
    usoMensal: 'R$ 12.840/mês',
    descricao: 'Síntese de voz em tempo real',
  },
  {
    nome: 'Whisper / Deepgram',
    icon: <Cpu className="w-5 h-5" />,
    status: 'online',
    uptime: '99,91%',
    latencia: '210ms',
    usoMensal: 'R$ 890/mês',
    descricao: 'STT — transcrição em tempo real',
  },
  {
    nome: 'Claude API',
    icon: <Bot className="w-5 h-5" />,
    status: 'online',
    uptime: '99,99%',
    latencia: '320ms',
    usoMensal: 'R$ 1.680/mês',
    descricao: 'Motor de análise de transcrição',
  },
  {
    nome: 'Vercel / Hosting',
    icon: <Globe className="w-5 h-5" />,
    status: 'online',
    uptime: '99,99%',
    latencia: '8ms',
    usoMensal: 'R$ 120/mês',
    descricao: 'Deploy e CDN global',
  },
]

const INCIDENTES: Incidente[] = [
  {
    data: '08/05/2026',
    servico: 'ElevenLabs TTS',
    descricao: 'Latência elevada — síntese acima de 500ms por 22 minutos',
    duracao: '22 min',
    resolvido: true,
  },
  {
    data: '21/04/2026',
    servico: 'Telnyx Voice',
    descricao: 'Falha parcial em ligações saintes na região BR-SP (3,2% das chamadas)',
    duracao: '8 min',
    resolvido: true,
  },
  {
    data: '03/04/2026',
    servico: 'Supabase',
    descricao: 'Manutenção programada — indisponibilidade de 4 minutos (avisado previamente)',
    duracao: '4 min',
    resolvido: true,
  },
]

const KPIS_METRICAS: KpiCard[] = [
  { label: 'Total de clientes', value: '14', delta: '▲ 2 este mês', up: true },
  { label: 'Agentes ativos', value: '38', delta: '▲ 6 este mês', up: true },
  { label: 'Ligações/dia', value: '2.840', delta: '▲ 12%', up: true },
  { label: 'Taxa média conversão', value: '18,4%', delta: '▲ 1,3%', up: true },
]

const PLANOS_DISTRIBUICAO: PlanoDistribuicao[] = [
  { nome: 'Starter', qtd: 4, pct: 28, cor: 'bg-gray-400' },
  { nome: 'Growth', qtd: 7, pct: 50, cor: 'bg-blue-500' },
  { nome: 'Scale', qtd: 3, pct: 22, cor: 'bg-purple-500' },
]

const CLIENTES_AGENTES: ClienteAgente[] = [
  { empresa: 'TechVision', agentes: 6, ligacoesDia: 480, conversao: 21.2 },
  { empresa: 'MegaCorp', agentes: 5, ligacoesDia: 420, conversao: 19.8 },
  { empresa: 'InnovaB2B', agentes: 4, ligacoesDia: 310, conversao: 17.4 },
  { empresa: 'BetaSolutions', agentes: 4, ligacoesDia: 290, conversao: 18.1 },
  { empresa: 'ConsultPro', agentes: 3, ligacoesDia: 240, conversao: 22.5 },
]

const CICLO_VIDA: CicloVida[] = [
  { fase: 'Novo', qtd: 2, cor: 'text-blue-700', bgCor: 'bg-blue-100' },
  { fase: 'Ativo', qtd: 9, cor: 'text-emerald-700', bgCor: 'bg-emerald-100' },
  { fase: 'Em risco', qtd: 2, cor: 'text-amber-700', bgCor: 'bg-amber-100' },
  { fase: 'Churned', qtd: 1, cor: 'text-red-700', bgCor: 'bg-red-100' },
]

const PIPELINE: PipelineColuna[] = [
  {
    fase: 'Prospect',
    cor: 'text-gray-700',
    bgCor: 'bg-gray-100',
    valor: 'R$ 22.400',
    cards: [
      { empresa: 'GrowthLabs', contato: 'Lucas M.', valor: 'R$ 3.576', dias: 3 },
      { empresa: 'SalesHub', contato: 'Ana B.', valor: 'R$ 11.940', dias: 7 },
      { empresa: 'VendaMais', contato: 'Pedro S.', valor: 'R$ 3.576', dias: 1 },
      { empresa: 'ProspectAI', contato: 'Carla F.', valor: 'R$ 3.308', dias: 5 },
    ],
  },
  {
    fase: 'Negociação',
    cor: 'text-blue-700',
    bgCor: 'bg-blue-100',
    valor: 'R$ 34.120',
    cards: [
      { empresa: 'DigitalBR', contato: 'Marcos T.', valor: 'R$ 11.940', dias: 12 },
      { empresa: 'StartupX', contato: 'Julia R.', valor: 'R$ 994', dias: 9 },
      { empresa: 'BizConnect', contato: 'Rafael A.', valor: 'R$ 11.940', dias: 14 },
      { empresa: 'SalesPro', contato: 'Camila V.', valor: 'R$ 3.576', dias: 6 },
    ],
  },
  {
    fase: 'Trial',
    cor: 'text-amber-700',
    bgCor: 'bg-amber-100',
    valor: 'R$ 15.510',
    cards: [
      { empresa: 'BoostSales', contato: 'Thiago N.', valor: 'R$ 3.576', dias: 4 },
      { empresa: 'NexGen', contato: 'Bruna C.', valor: 'R$ 11.940', dias: 8 },
    ],
  },
  {
    fase: 'Fechado',
    cor: 'text-emerald-700',
    bgCor: 'bg-emerald-100',
    valor: 'R$ 67.850 MRR',
    cards: [
      { empresa: 'TechVision', contato: 'CEO', valor: 'R$ 11.940', dias: 0 },
      { empresa: 'MegaCorp', contato: 'Dir.', valor: 'R$ 11.940', dias: 0 },
      { empresa: 'InnovaB2B', contato: 'Gestor', valor: 'R$ 3.576', dias: 0 },
    ],
  },
]

const CONTRATOS_ASSINADOS: ContratoAssinado[] = [
  { empresa: 'TechVision', plano: 'Scale', dataAssinatura: '03/01/2026', agentes: 6, valor: 11940, status: 'ativo' },
  { empresa: 'MegaCorp', plano: 'Scale', dataAssinatura: '15/01/2026', agentes: 5, valor: 11940, status: 'ativo' },
  { empresa: 'InnovaB2B', plano: 'Growth', dataAssinatura: '02/02/2026', agentes: 4, valor: 3576, status: 'ativo' },
  { empresa: 'BetaSolutions', plano: 'Growth', dataAssinatura: '10/02/2026', agentes: 4, valor: 3576, status: 'ativo' },
  { empresa: 'ConsultPro', plano: 'Growth', dataAssinatura: '20/02/2026', agentes: 3, valor: 3576, status: 'ativo' },
  { empresa: 'StartupXYZ', plano: 'Starter', dataAssinatura: '05/03/2026', agentes: 1, valor: 994, status: 'ativo' },
  { empresa: 'DataSoft', plano: 'Starter', dataAssinatura: '12/03/2026', agentes: 1, valor: 994, status: 'trial' },
  { empresa: 'Aceleratek', plano: 'Growth', dataAssinatura: '18/02/2026', agentes: 3, valor: 3576, status: 'cancelado' },
]

const TEMPLATE_INICIAL = `CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE TECNOLOGIA

CONTRATANTE: {{empresa}}, inscrita no CNPJ sob o n.° {{cnpj}}, neste ato representada por {{diretor}}, {{cargo}}.

CONTRATADA: Your Agent Tecnologia LTDA, inscrita no CNPJ sob o n.° 00.000.000/0001-00, com sede em São Paulo/SP.

OBJETO: A CONTRATADA prestará serviços de plataforma SaaS de agentes de voz por inteligência artificial para prospecção ativa e agendamento comercial, conforme plano {{plano}} pelo valor de R$ {{valor}}/mês.

VIGÊNCIA: 12 meses, com início em {{data_inicio}}.

1. OBRIGAÇÕES DA CONTRATADA
1.1 Disponibilizar a plataforma Your Agent com SLA de 99,5% de uptime mensal.
1.2 Manter confidencialidade dos dados conforme LGPD (Lei 13.709/2018).
1.3 Fornecer suporte técnico via chat em horário comercial (8h–18h, dias úteis).

2. OBRIGAÇÕES DA CONTRATANTE
2.1 Efetuar pagamentos nas datas acordadas.
2.2 Não utilizar a plataforma para fins ilegais ou abusivos.
2.3 Manter atualizados os dados cadastrais e de faturamento.

3. FORO
Fica eleito o foro da Comarca de São Paulo/SP.`

const VARIAVEIS_TEMPLATE = ['{{empresa}}', '{{cnpj}}', '{{diretor}}', '{{cargo}}', '{{plano}}', '{{valor}}', '{{data_inicio}}', '{{link}}']


// ─── Helpers ──────────────────────────────────────────────────────────────────

const MAX_MRR = Math.max(...MRR_MESES.map(m => m.mrr))

function fmtBrl(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function PlanoBadge({ plano }: { plano: 'Starter' | 'Growth' | 'Scale' }) {
  const cls: Record<string, string> = {
    Starter: 'bg-gray-100 text-gray-700',
    Growth: 'bg-blue-100 text-blue-700',
    Scale: 'bg-purple-100 text-purple-700',
  }
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cls[plano]}`}>{plano}</span>
}

function StatusBadgeFin({ status }: { status: 'ativo' | 'inadimplente' | 'cancelado' }) {
  const cls = { ativo: 'bg-emerald-100 text-emerald-700', inadimplente: 'bg-red-100 text-red-700', cancelado: 'bg-gray-100 text-gray-500' }
  const label = { ativo: 'Ativo', inadimplente: 'Inadimplente', cancelado: 'Cancelado' }
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cls[status]}`}>{label[status]}</span>
}

function StatusBadgeCob({ status }: { status: 'pago' | 'pendente' | 'atrasado' }) {
  const cls = { pago: 'bg-emerald-100 text-emerald-700', pendente: 'bg-blue-100 text-blue-700', atrasado: 'bg-red-100 text-red-700' }
  const label = { pago: 'Pago', pendente: 'Pendente', atrasado: 'Atrasado' }
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cls[status]}`}>{label[status]}</span>
}

function StatusServicoIcon({ status }: { status: StatusServico }) {
  if (status === 'online') return <CheckCircle className="w-4 h-4 text-emerald-500" />
  if (status === 'degradado') return <AlertTriangle className="w-4 h-4 text-amber-500" />
  return <XCircle className="w-4 h-4 text-red-500" />
}

function StatusContratoBadge({ status }: { status: 'ativo' | 'trial' | 'cancelado' }) {
  const cls = { ativo: 'bg-emerald-100 text-emerald-700', trial: 'bg-amber-100 text-amber-700', cancelado: 'bg-gray-100 text-gray-500' }
  const label = { ativo: 'Ativo', trial: 'Trial', cancelado: 'Cancelado' }
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cls[status]}`}>{label[status]}</span>
}

// ─── Sub-tabs ─────────────────────────────────────────────────────────────────

function FinanceiroTab() {
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-5 gap-4">
        {KPIS_FINANCEIRO.map(k => (
          <div key={k.label} className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">{k.label}</p>
            <p className="text-xl font-bold text-gray-900">{k.value}</p>
            {k.delta && (
              <p className={`text-xs font-medium mt-1 ${k.up ? 'text-emerald-600' : 'text-red-500'}`}>{k.delta}</p>
            )}
          </div>
        ))}
      </div>

      {/* MRR chart + MRR por plano */}
      <div className="grid grid-cols-2 gap-4">
        {/* Bar chart MRR 6 meses */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-5">MRR — Últimos 6 meses</h3>
          <div className="flex items-end gap-3 h-40">
            {MRR_MESES.map(m => (
              <div key={m.mes} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-gray-500">{fmtBrl(m.mrr).replace('R$ ', 'R$ ').replace(',00', '')}</span>
                <div
                  className="w-full bg-blue-500 rounded-t"
                  style={{ height: `${(m.mrr / MAX_MRR) * 100}%` }}
                />
                <span className="text-xs text-gray-400">{m.mes}</span>
              </div>
            ))}
          </div>
        </div>

        {/* MRR por plano */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-5">MRR por Plano</h3>
          <div className="space-y-4">
            {[
              { plano: 'Scale', valor: 23880, pct: 35, cor: 'bg-purple-500' },
              { plano: 'Growth', valor: 35100, pct: 52, cor: 'bg-blue-500' },
              { plano: 'Starter', valor: 8870, pct: 13, cor: 'bg-gray-400' },
            ].map(p => (
              <div key={p.plano}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{p.plano}</span>
                  <span className="font-medium text-gray-900">{fmtBrl(p.valor)}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className={`${p.cor} h-2 rounded-full`} style={{ width: `${p.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-sm">
            <span className="text-gray-500">Inadimplência</span>
            <span className="font-semibold text-red-500">4,8% — 3 clientes</span>
          </div>
        </div>
      </div>

      {/* Tabela de clientes */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Receita por Cliente</h3>
          <span className="text-xs text-gray-400">Integração Asaas — produção</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {['Cliente', 'Plano', 'Valor Mensal', 'Último Pagamento', 'Status'].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {CLIENTES_RECEITA.map(c => (
              <tr key={c.empresa} className="hover:bg-gray-50/50">
                <td className="py-3 font-medium text-gray-900">{c.empresa}</td>
                <td className="py-3"><PlanoBadge plano={c.plano} /></td>
                <td className="py-3 font-medium text-gray-900">{fmtBrl(c.valorMensal)}</td>
                <td className="py-3 text-gray-500">{c.ultimoPagamento}</td>
                <td className="py-3"><StatusBadgeFin status={c.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

type FiltroStatus = 'todas' | 'pagas' | 'pendentes' | 'atrasadas'
type FiltroPeriodo = '7d' | '30d' | '90d'

function CobrancasTab() {
  const [periodo, setPeriodo] = useState<FiltroPeriodo>('30d')
  const [statusFiltro, setStatusFiltro] = useState<FiltroStatus>('todas')

  const filtered = COBRANCAS.filter(c => {
    if (statusFiltro === 'pagas') return c.status === 'pago'
    if (statusFiltro === 'pendentes') return c.status === 'pendente'
    if (statusFiltro === 'atrasadas') return c.status === 'atrasado'
    return true
  })

  const totalCobrado = COBRANCAS.filter(c => c.status === 'pago').reduce((a, b) => a + b.valor, 0)
  const totalPendente = COBRANCAS.filter(c => c.status === 'pendente').reduce((a, b) => a + b.valor, 0)
  const totalAtrasado = COBRANCAS.filter(c => c.status === 'atrasado').reduce((a, b) => a + b.valor, 0)

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {(['7d', '30d', '90d'] as FiltroPeriodo[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${periodo === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {p}
            </button>
          ))}
        </div>
        <select
          value={statusFiltro}
          onChange={e => setStatusFiltro(e.target.value as FiltroStatus)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="todas">Todas</option>
          <option value="pagas">Pagas</option>
          <option value="pendentes">Pendentes</option>
          <option value="atrasadas">Atrasadas</option>
        </select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Total cobrado</p>
          <p className="text-xl font-bold text-emerald-600">{fmtBrl(totalCobrado)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Total pendente</p>
          <p className="text-xl font-bold text-blue-600">{fmtBrl(totalPendente)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Total atrasado</p>
          <p className="text-xl font-bold text-red-500">{fmtBrl(totalAtrasado)}</p>
        </div>
      </div>

      {/* Lista */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100">
            <tr>
              {['Empresa', 'Valor', 'Vencimento', 'Status', ''].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(c => (
              <tr key={c.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3 font-medium text-gray-900">{c.empresa}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{fmtBrl(c.valor)}</td>
                <td className="px-4 py-3 text-gray-500">{c.vencimento}</td>
                <td className="px-4 py-3"><StatusBadgeCob status={c.status} /></td>
                <td className="px-4 py-3">
                  {c.status !== 'pago' && (
                    <button className="text-xs font-medium text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-400 px-2.5 py-1 rounded-lg transition-colors">
                      Cobrar agora
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function InfraTab() {
  return (
    <div className="space-y-6">
      {/* Status geral */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Infraestrutura e Integrações</h3>
          <p className="text-xs text-gray-500 mt-0.5">Status em tempo real de todos os serviços da plataforma</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
          <CheckCircle className="w-3.5 h-3.5" />
          Todos os sistemas operacionais
        </div>
      </div>

      {/* Cards de serviço */}
      <div className="grid grid-cols-3 gap-4">
        {SERVICOS_INFRA.map(s => (
          <div key={s.nome} className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
                  {s.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{s.nome}</p>
                  <p className="text-xs text-gray-400">{s.descricao}</p>
                </div>
              </div>
              <StatusServicoIcon status={s.status} />
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <p className="text-gray-400 mb-0.5">Uptime</p>
                <p className="font-semibold text-gray-900">{s.uptime}</p>
              </div>
              <div>
                <p className="text-gray-400 mb-0.5">Latência</p>
                <p className="font-semibold text-gray-900">{s.latencia}</p>
              </div>
              <div>
                <p className="text-gray-400 mb-0.5">Custo/mês</p>
                <p className="font-semibold text-gray-900">{s.usoMensal}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Incidentes */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Log de Incidentes (30 dias)</h3>
        <div className="space-y-3">
          {INCIDENTES.map((inc, i) => (
            <div key={i} className="flex items-start gap-4 p-3 bg-gray-50 rounded-xl">
              <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-semibold text-gray-700">{inc.servico}</span>
                  <span className="text-xs text-gray-400">{inc.data}</span>
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">Resolvido</span>
                </div>
                <p className="text-xs text-gray-600">{inc.descricao}</p>
                <p className="text-xs text-gray-400 mt-0.5">Duração: {inc.duracao}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MetricasTab() {
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {KPIS_METRICAS.map(k => (
          <div key={k.label} className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">{k.label}</p>
            <p className="text-2xl font-bold text-gray-900">{k.value}</p>
            {k.delta && <p className={`text-xs font-medium mt-1 ${k.up ? 'text-emerald-600' : 'text-red-500'}`}>{k.delta}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Distribuição de planos */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-5">Distribuição por Plano</h3>
          <div className="space-y-4">
            {PLANOS_DISTRIBUICAO.map(p => (
              <div key={p.nome}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{p.nome}</span>
                  <span className="text-gray-500">{p.qtd} clientes ({p.pct}%)</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div className={`${p.cor} h-3 rounded-full`} style={{ width: `${p.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Uso de agentes por cliente */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Uso de Agentes por Cliente</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Cliente', 'Agentes', 'Lig./dia', 'Conversão'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-400 pb-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {CLIENTES_AGENTES.map(c => (
                <tr key={c.empresa}>
                  <td className="py-2 font-medium text-gray-900 text-xs">{c.empresa}</td>
                  <td className="py-2 text-gray-700 text-xs">{c.agentes}</td>
                  <td className="py-2 text-gray-700 text-xs">{c.ligacoesDia}</td>
                  <td className="py-2 text-xs">
                    <span className={`font-semibold ${c.conversao >= 20 ? 'text-emerald-600' : 'text-amber-600'}`}>{c.conversao}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ciclo de vida */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-6">Ciclo de Vida — Cohort de Clientes</h3>
        <div className="flex items-center gap-2 justify-center flex-wrap">
          {CICLO_VIDA.map((fase, i) => (
            <div key={fase.fase} className="flex items-center gap-2">
              <div className={`${fase.bgCor} rounded-xl px-6 py-4 text-center min-w-[120px]`}>
                <p className="text-3xl font-bold text-gray-900 mb-1">{fase.qtd}</p>
                <p className={`text-xs font-semibold ${fase.cor}`}>{fase.fase}</p>
              </div>
              {i < CICLO_VIDA.length - 1 && <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ComercialTab() {
  return (
    <div className="space-y-6">
      {/* Pipeline kanban simplificado */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Pipeline de Vendas</h3>
        <div className="grid grid-cols-4 gap-4">
          {PIPELINE.map(col => (
            <div key={col.fase} className="bg-gray-50 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.bgCor} ${col.cor}`}>{col.fase}</span>
                <span className="text-xs text-gray-500">{col.cards.length} deals</span>
              </div>
              <p className="text-sm font-semibold text-gray-900 mb-3">{col.valor}</p>
              <div className="space-y-2">
                {col.cards.map((card, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-xl p-3">
                    <p className="text-xs font-semibold text-gray-900">{card.empresa}</p>
                    <p className="text-xs text-gray-500">{card.contato}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-medium text-blue-700">{card.valor}</span>
                      {card.dias > 0 && <span className="text-xs text-gray-400">{card.dias}d</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Métricas do mês */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Novos prospects', value: '12', icon: <TrendingUp className="w-4 h-4 text-blue-500" /> },
          { label: 'Em negociação', value: '4', icon: <Users className="w-4 h-4 text-amber-500" /> },
          { label: 'Fechamentos/mês', value: '2', icon: <Target className="w-4 h-4 text-emerald-500" /> },
          { label: 'Ticket médio', value: 'R$ 5.780', icon: <CreditCard className="w-4 h-4 text-purple-500" /> },
        ].map(m => (
          <div key={m.label} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center">{m.icon}</div>
            <div>
              <p className="text-xs text-gray-500">{m.label}</p>
              <p className="text-lg font-bold text-gray-900">{m.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ContratosTab() {
  const [subTab, setSubTab] = useState<ContratosSubTab>('assinados')
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativo' | 'trial' | 'cancelado'>('todos')
  const [template, setTemplate] = useState(TEMPLATE_INICIAL)
  const [templateSalvo, setTemplateSalvo] = useState(false)

  const filtered = CONTRATOS_ASSINADOS.filter(c =>
    filtroStatus === 'todos' || c.status === filtroStatus
  )

  function handleSalvar() {
    setTemplateSalvo(true)
    setTimeout(() => setTemplateSalvo(false), 2000)
  }

  function inserirVariavel(v: string) {
    setTemplate(prev => prev + v)
  }

  return (
    <div className="space-y-4">
      {/* Sub-tab bar */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {([
          { id: 'assinados' as ContratosSubTab, label: 'Contratos Assinados' },
          { id: 'template' as ContratosSubTab, label: 'Template do Contrato' },
        ]).map(t => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${subTab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {subTab === 'assinados' && (
        <div className="space-y-4">
          {/* Filtros */}
          <div className="flex items-center gap-3">
            <select
              value={filtroStatus}
              onChange={e => setFiltroStatus(e.target.value as typeof filtroStatus)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos os status</option>
              <option value="ativo">Ativo</option>
              <option value="trial">Trial</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Total assinados', value: CONTRATOS_ASSINADOS.length.toString() },
              { label: 'Ativos', value: CONTRATOS_ASSINADOS.filter(c => c.status === 'ativo').length.toString() },
              { label: 'Trial', value: CONTRATOS_ASSINADOS.filter(c => c.status === 'trial').length.toString() },
              { label: 'Cancelados', value: CONTRATOS_ASSINADOS.filter(c => c.status === 'cancelado').length.toString() },
            ].map(k => (
              <div key={k.label} className="bg-white border border-gray-200 rounded-xl p-4">
                <p className="text-xs text-gray-500">{k.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{k.value}</p>
              </div>
            ))}
          </div>

          {/* Tabela */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100">
                <tr>
                  {['Empresa', 'Plano', 'Data Assinatura', 'Agentes', 'Valor/mês', 'Status', ''].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(c => (
                  <tr key={c.empresa} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-900">{c.empresa}</td>
                    <td className="px-4 py-3"><PlanoBadge plano={c.plano} /></td>
                    <td className="px-4 py-3 text-gray-500">{c.dataAssinatura}</td>
                    <td className="px-4 py-3 text-gray-700">{c.agentes}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{fmtBrl(c.valor)}</td>
                    <td className="px-4 py-3"><StatusContratoBadge status={c.status} /></td>
                    <td className="px-4 py-3">
                      <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors">
                        <FileText className="w-3.5 h-3.5" /> Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === 'template' && (
        <div className="grid grid-cols-[1fr_320px] gap-4 items-start">
          {/* Editor */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Template do Contrato</h3>
                <p className="text-xs text-gray-400 mt-0.5">Enviado automaticamente ao gerar o contrato de cada cliente</p>
              </div>
              <button
                onClick={handleSalvar}
                className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${templateSalvo ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
              >
                {templateSalvo ? 'Salvo!' : 'Salvar template'}
              </button>
            </div>
            <textarea
              value={template}
              onChange={e => setTemplate(e.target.value)}
              rows={24}
              className="w-full border border-gray-200 rounded-xl p-4 text-xs font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y leading-relaxed"
            />
          </div>

          {/* Painel lateral */}
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Variáveis disponíveis</h4>
              <p className="text-xs text-gray-400 mb-3">Clique para inserir no template:</p>
              <div className="flex flex-wrap gap-2">
                {VARIAVEIS_TEMPLATE.map(v => (
                  <button
                    key={v}
                    onClick={() => inserirVariavel(v)}
                    className="text-xs font-mono bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 px-2 py-1 rounded-lg transition-colors"
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <p className="text-xs font-semibold text-amber-800 mb-1">Atenção</p>
              <p className="text-xs text-amber-700 leading-relaxed">Alterações afetam apenas novos contratos. Contratos já assinados não são alterados.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'financeiro', label: 'Financeiro', icon: <CreditCard className="w-4 h-4" /> },
  { id: 'cobrancas', label: 'Cobranças', icon: <Bell className="w-4 h-4" /> },
  { id: 'infra', label: 'Infraestrutura', icon: <Server className="w-4 h-4" /> },
  { id: 'metricas', label: 'Métricas', icon: <TrendingUp className="w-4 h-4" /> },
  { id: 'comercial', label: 'Comercial', icon: <Target className="w-4 h-4" /> },
  { id: 'contratos', label: 'Contratos', icon: <FileText className="w-4 h-4" /> },
]

export default function AdminPlataformaPage() {
  const [tab, setTab] = useState<Tab>('financeiro')

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Plataforma</h1>
          <p className="text-sm text-gray-500 mt-0.5">Financeiro, cobranças, infraestrutura e contratos</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
          <Activity className="w-3.5 h-3.5" />
          Todos os sistemas operacionais
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'financeiro' && <FinanceiroTab />}
      {tab === 'cobrancas' && <CobrancasTab />}
      {tab === 'infra' && <InfraTab />}
      {tab === 'metricas' && <MetricasTab />}
      {tab === 'comercial' && <ComercialTab />}
      {tab === 'contratos' && <ContratosTab />}
    </div>
  )
}
