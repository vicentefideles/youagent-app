import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Phone,
  TrendingUp,
  Calendar,
  Brain,
  Bot,
  Activity,
  Target,
  Zap,
  BookOpen,
  ChevronUp,
  ChevronDown,
  Users,
  Layers,
  Globe,
} from 'lucide-react'
import { agentesApi, campanhasApi, dashboardApi, clientesApi as clientesApiRaw } from '@/services/api'
import { useAuthStore } from '@/store/authStore'

// ─── Types ────────────────────────────────────────────────────────────────────

interface KpiItem {
  label: string
  value: string | number
  icon: React.ReactNode
  bg: string
  text: string
  delta: string
  deltaPositive: boolean
}

interface BarDay {
  label: string
  ligacoes: number
  reunioes: number
}

interface DonutSegment {
  label: string
  pct: number
  color: string
}

interface IcpDimension {
  label: string
  desc: string
  weight: number
  max: number
  color: string
}

interface PatternItem {
  text: string
  delta: string
  border: string
  badge: string
}

interface ContactItem {
  initials: string
  nome: string
  empresa: string
  last: string
  next: string
}

interface FeedItem {
  dot: string
  text: string
  time: string
}

// ─── Mock data ─────────────────────────────────────────────────────────────────

// TODO: conectar à API quando endpoint retornar bar_data (ligacoes/reunioes por dia)
const BAR_DATA: BarDay[] = [
  { label: 'S', ligacoes: 145, reunioes: 8 },
  { label: 'T', ligacoes: 132, reunioes: 7 },
  { label: 'Q', ligacoes: 178, reunioes: 12 },
  { label: 'Q', ligacoes: 201, reunioes: 14 },
  { label: 'S', ligacoes: 189, reunioes: 11 },
  { label: 'S', ligacoes: 167, reunioes: 9 },
  { label: 'D', ligacoes: 143, reunioes: 7 },
  { label: 'S', ligacoes: 156, reunioes: 10 },
  { label: 'T', ligacoes: 198, reunioes: 13 },
  { label: 'Q', ligacoes: 212, reunioes: 15 },
  { label: 'Q', ligacoes: 187, reunioes: 12 },
  { label: 'S', ligacoes: 165, reunioes: 9 },
  { label: 'S', ligacoes: 143, reunioes: 8 },
  { label: 'D', ligacoes: 178, reunioes: 11 },
]

// TODO: conectar à API quando endpoint retornar donut_segments (resultado das ligacoes)
const DONUT_SEGMENTS: DonutSegment[] = [
  { label: 'Não atendeu', pct: 42, color: '#f59e0b' },
  { label: 'Agendado',    pct: 18, color: '#10b981' },
  { label: 'Retornar',   pct: 22, color: '#3b82f6' },
  { label: 'Sem interesse', pct: 12, color: '#9ca3af' },
  { label: 'Outro',      pct: 6,  color: '#a855f7' },
]

const ICP_DIMS: IcpDimension[] = [
  { label: 'Setor',              desc: 'Tech & SaaS',              weight: 30, max: 30, color: 'bg-emerald-500' },
  { label: 'Porte',              desc: '50–500 funcionários',       weight: 25, max: 25, color: 'bg-emerald-500' },
  { label: 'Cargo do Decisor',   desc: 'Diretor/VP Comercial',      weight: 20, max: 20, color: 'bg-emerald-500' },
  { label: 'Região',             desc: 'SP + Sul',                  weight: 12, max: 15, color: 'bg-blue-500' },
  { label: 'Tentativas p/ agen.', desc: '3,2x média',               weight: 8,  max: 10, color: 'bg-amber-500' },
]

const PATTERNS: PatternItem[] = [
  { text: "Menção a 'urgência orçamento' → +34% de agendamento", delta: '▲ 34%', border: 'border-l-emerald-500', badge: 'bg-emerald-50 text-emerald-700' },
  { text: "Ligações entre 10h–11h têm 2x mais conversão",         delta: '▲ 18%', border: 'border-l-blue-500',    badge: 'bg-blue-50 text-blue-700' },
  { text: "Decisores de RH respondem melhor na 2ª tentativa",     delta: '▲ 22%', border: 'border-l-amber-500',   badge: 'bg-amber-50 text-amber-700' },
]

const CONTACTS: ContactItem[] = [
  { initials: 'MA', nome: 'Marcos Antunes', empresa: 'TechVision',  last: 'Pediu proposta na última call',    next: 'Enviar proposta até sexta' },
  { initials: 'CL', nome: 'Carla Lima',     empresa: 'DataSoft',    last: 'Mencionou orçamento em março',    next: 'Reativar em 15 dias' },
  { initials: 'RP', nome: 'Rafael Porto',   empresa: 'InnovaB2B',   last: 'Demonstrou interesse em IA',      next: 'Demo agendada: ter 15h' },
]


// ─── Meritocracia types + data ────────────────────────────────────────────────

interface VendedorFila {
  id: number
  nome: string
  avatar: string
  cargo: string
  peso: number
  reunioesHoje: number
  taxaShow: number
}

interface ReuniaoFila {
  id: number
  empresa: string
  avatarEmpresa: string
  contato: string
  icpScore: number
  agente: string
  vendedor: string
  horario: string
}

const AVATAR_COLORS = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500']


// ─── Card Meritocracia ─────────────────────────────────────────────────────────

function CardMeritocracia() {
  const [vendedores, setVendedores] = useState<VendedorFila[]>([])

  function ajustarPeso(id: number, delta: number) {
    setVendedores(prev => {
      const idx = prev.findIndex(v => v.id === id)
      if (idx === -1) return prev
      const novoPeso = Math.max(0, Math.min(100, prev[idx].peso + delta))
      const diff = novoPeso - prev[idx].peso
      if (diff === 0) return prev
      const outros = prev.filter((_, i) => i !== idx)
      const totalOutros = outros.reduce((s, v) => s + v.peso, 0)
      const updated = prev.map((v, i) => {
        if (i === idx) return { ...v, peso: novoPeso }
        if (totalOutros === 0) return v
        const novoP = Math.max(0, Math.round(v.peso - (diff * v.peso) / totalOutros))
        return { ...v, peso: novoP }
      })
      return updated
    })
  }

  function redistribuir() {
    setVendedores(prev => {
      const total = prev.reduce((s, v) => s + v.taxaShow, 0)
      return prev.map(v => ({ ...v, peso: Math.round((v.taxaShow / total) * 100) }))
    })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-brand-600" />
          <h2 className="text-sm font-semibold text-gray-900">Fila de Agendamentos — Meritocracia</h2>
        </div>
        <button
          onClick={redistribuir}
          className="text-xs font-medium text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors"
        >
          Redistribuir automaticamente
        </button>
      </div>

      <div className="flex flex-col divide-y divide-gray-100">
        {vendedores.map((v, i) => (
          <div key={v.id} className="flex items-center gap-4 py-3">
            {/* Avatar */}
            <div className={`w-9 h-9 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0 ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
              {v.avatar}
            </div>

            {/* Nome + cargo */}
            <div className="w-36 flex-shrink-0">
              <p className="text-sm font-medium text-gray-900 leading-tight">{v.nome}</p>
              <p className="text-xs text-gray-400">{v.cargo}</p>
            </div>

            {/* Barra de peso */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">Peso de distribuição</span>
                <span className="text-xs font-bold text-gray-900 font-mono">{v.peso}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}
                  style={{ width: `${v.peso}%` }}
                />
              </div>
            </div>

            {/* Reuniões hoje */}
            <div className="w-24 text-center flex-shrink-0">
              <p className="text-lg font-bold font-mono text-gray-900">{v.reunioesHoje}</p>
              <p className="text-xs text-gray-400">reuniões hoje</p>
            </div>

            {/* Show rate */}
            <div className="w-20 text-center flex-shrink-0">
              <p className={`text-sm font-bold font-mono ${v.taxaShow >= 75 ? 'text-emerald-600' : v.taxaShow >= 68 ? 'text-amber-600' : 'text-red-500'}`}>
                {v.taxaShow}%
              </p>
              <p className="text-xs text-gray-400">show rate</p>
            </div>

            {/* Botões ▲ ▼ */}
            <div className="flex flex-col gap-0.5 flex-shrink-0">
              <button
                onClick={() => ajustarPeso(v.id, 5)}
                className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                title="Aumentar peso"
              >
                <ChevronUp size={14} />
              </button>
              <button
                onClick={() => ajustarPeso(v.id, -5)}
                className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                title="Diminuir peso"
              >
                <ChevronDown size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Card Próximas da Fila ─────────────────────────────────────────────────────

interface CardProximasFilaProps {
  reunioes: ReuniaoFila[]
}

function CardProximasFila({ reunioes }: CardProximasFilaProps) {
  const [distribuidos, setDistribuidos] = useState<Set<number>>(new Set())

  function distribuir(id: number) {
    setDistribuidos(prev => new Set([...prev, id]))
  }
  function distribuirTodas() {
    setDistribuidos(new Set(reunioes.map(r => r.id)))
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-purple-600" />
          <h2 className="text-sm font-semibold text-gray-900">Próximas da Fila</h2>
        </div>
        <button
          onClick={distribuirTodas}
          className="text-xs font-medium text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors"
        >
          Distribuir todas
        </button>
      </div>

      <div className="flex flex-col divide-y divide-gray-100">
        {reunioes.map((r, i) => (
          <div key={r.id} className={`flex items-center gap-4 py-3 ${distribuidos.has(r.id) ? 'opacity-50' : ''}`}>
            {/* Avatar empresa */}
            <div className={`w-9 h-9 rounded-lg text-white text-xs font-bold flex items-center justify-center flex-shrink-0 ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
              {r.avatarEmpresa}
            </div>

            {/* Empresa + contato */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{r.empresa}</p>
              <p className="text-xs text-gray-400 truncate">{r.contato}</p>
            </div>

            {/* ICP score */}
            <div className="flex-shrink-0">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.icpScore >= 70 ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                ICP {r.icpScore}
              </span>
            </div>

            {/* Agente */}
            <div className="w-20 flex-shrink-0">
              <p className="text-xs text-gray-500">Agente</p>
              <p className="text-xs font-medium text-gray-800">{r.agente}</p>
            </div>

            {/* Vendedor */}
            <div className="w-28 flex-shrink-0">
              <p className="text-xs text-gray-500">Para</p>
              <p className="text-xs font-medium text-brand-600">{r.vendedor}</p>
            </div>

            {/* Horário */}
            <div className="w-28 flex-shrink-0">
              <p className="text-xs font-mono text-gray-600">{r.horario}</p>
            </div>

            {/* Ação */}
            <div className="flex-shrink-0">
              {distribuidos.has(r.id) ? (
                <span className="text-xs font-semibold text-emerald-600">✓ Distribuído</span>
              ) : (
                <button
                  onClick={() => distribuir(r.id)}
                  className="text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Distribuir agora
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Dados IC ────────────────────────────────────────────────────────────────

interface IcInsight {
  text: string
  delta: string
  border: string
  badge: string
}

interface IcSegmentoData {
  [key: string]: IcInsight[]
}

const IC_UNIVERSAL: IcInsight[] = [
  { text: 'Ligações às 10h têm 34% mais conversão que qualquer outro horário', delta: '▲ 34%', border: 'border-l-emerald-500', badge: 'bg-emerald-50 text-emerald-700' },
  { text: "Gatilho 'urgência' aumenta ICP médio em 12 pontos após ativação", delta: '▲ 12pts', border: 'border-l-blue-500', badge: 'bg-blue-50 text-blue-700' },
  { text: '3ª tentativa com contexto prévio converte 2.1x mais que ligação genérica', delta: '▲ 110%', border: 'border-l-purple-500', badge: 'bg-purple-50 text-purple-700' },
  { text: 'Propor 2 horários concretos aumenta aceite de reunião em 36%', delta: '▲ 36%', border: 'border-l-amber-500', badge: 'bg-amber-50 text-amber-700' },
]

const IC_SEGMENTOS: IcSegmentoData = {
  Tecnologia: [
    { text: 'Decisores de TI respondem melhor das 14h–16h nas quartas', delta: '▲ 28%', border: 'border-l-blue-500', badge: 'bg-blue-50 text-blue-700' },
    { text: "Argumento de ROI em 6 meses converte 41% mais neste setor", delta: '▲ 41%', border: 'border-l-emerald-500', badge: 'bg-emerald-50 text-emerald-700' },
    { text: 'Mencionar integração com ferramentas existentes reduz objeção em 22%', delta: '▼ 22% obj.', border: 'border-l-purple-500', badge: 'bg-purple-50 text-purple-700' },
  ],
  Financeiro: [
    { text: 'CFOs preferem abordagem com dados numéricos na abertura', delta: '▲ 19%', border: 'border-l-emerald-500', badge: 'bg-emerald-50 text-emerald-700' },
    { text: 'Ligações às sextas-feiras têm 31% menos conversão neste setor', delta: '▼ 31%', border: 'border-l-red-400', badge: 'bg-red-50 text-red-700' },
    { text: 'Compliance e LGPD como diferencial aumenta confiança em 27%', delta: '▲ 27%', border: 'border-l-blue-500', badge: 'bg-blue-50 text-blue-700' },
  ],
  Varejo: [
    { text: 'Período pré-datas comemorativas tem 45% mais receptividade', delta: '▲ 45%', border: 'border-l-amber-500', badge: 'bg-amber-50 text-amber-700' },
    { text: 'Gerentes de loja respondem melhor antes das 9h30', delta: '▲ 23%', border: 'border-l-emerald-500', badge: 'bg-emerald-50 text-emerald-700' },
    { text: 'Argumento de sazonalidade funciona 2x mais em contas multi-filial', delta: '▲ 100%', border: 'border-l-purple-500', badge: 'bg-purple-50 text-purple-700' },
  ],
  Saúde: [
    { text: 'Diretores clínicos têm janela ideal das 11h–12h nas terças', delta: '▲ 31%', border: 'border-l-blue-500', badge: 'bg-blue-50 text-blue-700' },
    { text: 'Referência a conformidade ANVISA aumenta credibilidade em 38%', delta: '▲ 38%', border: 'border-l-emerald-500', badge: 'bg-emerald-50 text-emerald-700' },
    { text: 'Cases de redução de custo operacional convertem 29% mais', delta: '▲ 29%', border: 'border-l-amber-500', badge: 'bg-amber-50 text-amber-700' },
  ],
}

const IC_SEGMENTOS_LIST = ['Tecnologia', 'Financeiro', 'Varejo', 'Saúde'] as const

// ─── Painel IC ────────────────────────────────────────────────────────────────

function PainelIC() {
  const [segmentoIC, setSegmentoIC] = useState<string | null>(null)

  const insightsExibidos = segmentoIC ? IC_SEGMENTOS[segmentoIC] : IC_UNIVERSAL
  const titulo = segmentoIC ? `Padrões — ${segmentoIC}` : 'Padrões Globais Detectados'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

      {/* IC Universal */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Globe size={16} className="text-blue-500" />
          <h2 className="text-sm font-semibold text-gray-900">IC Universal — {titulo}</h2>
          <span className="ml-auto text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
            {segmentoIC ? segmentoIC : 'Todos segmentos'}
          </span>
        </div>

        {/* Pills de segmento */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          <button
            onClick={() => setSegmentoIC(null)}
            className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${segmentoIC === null ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Global
          </button>
          {IC_SEGMENTOS_LIST.map(seg => (
            <button
              key={seg}
              onClick={() => setSegmentoIC(seg === segmentoIC ? null : seg)}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${segmentoIC === seg ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {seg}
            </button>
          ))}
        </div>

        {/* Insights */}
        <div className="space-y-2.5">
          {insightsExibidos.map((p, i) => (
            <div key={i} className={`border-l-4 ${p.border} pl-3 py-1 flex items-start justify-between gap-2`}>
              <p className="text-xs text-gray-700 leading-relaxed flex-1">{p.text}</p>
              <span className={`text-xs px-1.5 py-0.5 rounded font-semibold flex-shrink-0 ${p.badge}`}>{p.delta}</span>
            </div>
          ))}
        </div>
      </div>

      {/* IC por Segmentos — destaque do segmento selecionado ou resumo */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Brain size={16} className="text-purple-500" />
          <h2 className="text-sm font-semibold text-gray-900">IC por Segmentos</h2>
          <span className="ml-auto text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-medium">4 segmentos</span>
        </div>

        <div className="space-y-3">
          {IC_SEGMENTOS_LIST.map(seg => {
            const insights = IC_SEGMENTOS[seg]
            const topInsight = insights[0]
            const isSelected = segmentoIC === seg
            return (
              <button
                key={seg}
                onClick={() => setSegmentoIC(seg === segmentoIC ? null : seg)}
                className={`w-full text-left border rounded-xl p-3 transition-all ${isSelected ? 'border-purple-300 bg-purple-50' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-semibold ${isSelected ? 'text-purple-700' : 'text-gray-800'}`}>{seg}</span>
                  <span className={`text-xs font-bold ${topInsight.badge} px-1.5 py-0.5 rounded`}>{topInsight.delta}</span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-1">{topInsight.text}</p>
                <p className="text-xs text-blue-500 mt-1">{insights.length} insights disponíveis →</p>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Timestamp helper ─────────────────────────────────────────────────────────

function formatTs(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `há ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `há ${hrs}h`
  return `há ${Math.floor(hrs / 24)}d`
}

// ─── Donut SVG helper ──────────────────────────────────────────────────────────

const R = 60
const CX = 80
const CY = 80
const CIRCUMFERENCE = 2 * Math.PI * R

function buildDashArray(pct: number): string {
  const len = (pct / 100) * CIRCUMFERENCE
  return `${len} ${CIRCUMFERENCE}`
}

function buildDashOffset(prevPct: number): number {
  // SVG starts at 3 o'clock; rotate to 12 o'clock = -CIRCUMFERENCE/4
  return CIRCUMFERENCE / 4 - (prevPct / 100) * CIRCUMFERENCE
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const isAtivo = useAuthStore((s) => s.isAtivo())
  const setStatus = useAuthStore((s) => s.setStatus)

  // Polling: detecta quando a conta é ativada pelo admin (30s)
  useEffect(() => {
    if (isAtivo || !user?.id) return

    const interval = setInterval(async () => {
      try {
        const res = await clientesApiRaw.buscar(user.id)
        const clienteStatus = (res.data as { status?: string })?.status
        if (clienteStatus === 'ativo') {
          setStatus('ativo')
          clearInterval(interval)
        }
      } catch {
        // silencia erros de rede no polling
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [isAtivo, user?.id, setStatus])

  const { data: agentes } = useQuery({
    queryKey: ['agentes'],
    queryFn: () => agentesApi.list().then((r) => r.data),
  })

  const { data: campanhas } = useQuery({
    queryKey: ['campanhas'],
    queryFn: () => campanhasApi.list().then((r) => r.data),
  })

  const { data: dash } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.get().then((r) => r.data),
    refetchInterval: 30000,
  })

  const feedItems: FeedItem[] = (dash?.feed ?? []).length > 0
    ? (dash!.feed as Array<{ tipo: string; texto: string; ts: string }>).slice(0, 6).map((f) => ({
        dot: f.tipo === 'reuniao' ? 'bg-emerald-500' : f.tipo === 'campanha' ? 'bg-purple-500' : 'bg-blue-500',
        text: f.texto,
        time: formatTs(f.ts),
      }))
    : []

  const kpis: KpiItem[] = [
    { label: 'Agentes ativos',  value: dash?.kpis?.agentes_ativos ?? agentes?.length ?? '—',  icon: <Bot size={18} className="text-brand" />,         bg: 'bg-brand-50',   text: 'text-brand-600',   delta: '—', deltaPositive: true },
    { label: 'Campanhas',       value: dash?.kpis?.campanhas_ativas ?? campanhas?.length ?? '—', icon: <Activity size={18} className="text-purple-600" />, bg: 'bg-purple-50',  text: 'text-purple-600',  delta: '—', deltaPositive: true },
    { label: 'Ligações hoje',   value: dash?.kpis?.ligacoes_hoje ?? '—',                    icon: <Phone size={18} className="text-emerald-600" />,   bg: 'bg-emerald-50', text: 'text-emerald-600', delta: '—', deltaPositive: true },
    { label: 'Taxa de acerto',  value: dash?.kpis?.taxa_acerto != null ? `${dash.kpis.taxa_acerto}%` : '—', icon: <TrendingUp size={18} className="text-amber-600" />, bg: 'bg-amber-50',   text: 'text-amber-600',   delta: '—', deltaPositive: false },
    { label: 'Reuniões agend.', value: dash?.kpis?.reunioes_agendadas ?? '—',               icon: <Calendar size={18} className="text-brand" />,      bg: 'bg-brand-50',   text: 'text-brand-600',   delta: '—', deltaPositive: true },
    { label: 'Score CI',        value: dash?.kpis?.score_ci ?? '—',                          icon: <Brain size={18} className="text-purple-600" />,    bg: 'bg-purple-50',  text: 'text-purple-600',  delta: '—', deltaPositive: true },
  ]

  const reunioesFila: ReuniaoFila[] = dash?.proximas_reunioes?.map((r: { id: number; vendedor: string; inicio: string }) => ({
    id: r.id,
    empresa: '—',
    avatarEmpresa: r.vendedor.slice(0, 2).toUpperCase(),
    contato: '—',
    icpScore: 0,
    agente: '—',
    vendedor: r.vendedor,
    horario: new Date(r.inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  })) ?? []

  // Bar chart — use real data when available, otherwise fall back to mock
  const barData: BarDay[] = (dash?.por_dia && dash.por_dia.length > 0)
    ? dash.por_dia
    : BAR_DATA

  // Bar chart scale
  const maxLig = Math.max(...barData.map((d) => d.ligacoes))
  const maxReu = Math.max(...barData.map((d) => d.reunioes))

  // Donut cumulative offsets
  let cumPct = 0
  const segmentsWithOffset = DONUT_SEGMENTS.map((seg) => {
    const offset = buildDashOffset(cumPct)
    cumPct += seg.pct
    return { ...seg, dashArray: buildDashArray(seg.pct), dashOffset: offset }
  })

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
          Bom dia, {user?.nome?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Aqui está o resumo da operação em tempo real.
        </p>
      </div>

      {/* ── KPI Strip ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-2">
            <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center`}>
              {kpi.icon}
            </div>
            <span className="text-2xl font-bold font-mono text-gray-900">{kpi.value}</span>
            <span className="text-xs text-gray-500">{kpi.label}</span>
            <span className={`text-xs font-medium ${kpi.deltaPositive ? 'text-emerald-600' : 'text-red-500'}`}>
              {kpi.delta}
            </span>
          </div>
        ))}
      </div>

      {/* ── Bar chart + Donut ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Bar chart */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Atividade — 14 dias</h2>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                Ligações
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                Reuniões
              </div>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                2 em andamento
              </span>
            </div>
          </div>

          {/* Chart area */}
          <div className="flex gap-1 items-end h-32">
            {/* Y-axis labels */}
            <div className="flex flex-col justify-between h-full text-right pr-1 flex-shrink-0">
              <span className="text-xs text-gray-400">{maxLig}</span>
              <span className="text-xs text-gray-400">{Math.round(maxLig / 2)}</span>
              <span className="text-xs text-gray-400">0</span>
            </div>
            {/* Bars */}
            {barData.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                <div className="flex items-end gap-0.5 w-full h-28">
                  <div
                    className="flex-1 bg-blue-500 rounded-t opacity-80 hover:opacity-100 transition-opacity"
                    style={{ height: `${(day.ligacoes / maxLig) * 100}%` }}
                    title={`Ligações: ${day.ligacoes}`}
                  />
                  <div
                    className="flex-1 bg-emerald-500 rounded-t opacity-80 hover:opacity-100 transition-opacity"
                    style={{ height: `${(day.reunioes / maxReu) * 100}%` }}
                    title={`Reuniões: ${day.reunioes}`}
                  />
                </div>
                <span className="text-xs text-gray-400">{day.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Donut chart */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Resultado das ligações</h2>
          <div className="flex items-center gap-6">
            <div className="flex-shrink-0">
              <svg width="160" height="160" viewBox="0 0 160 160">
                {/* Background circle */}
                <circle cx={CX} cy={CY} r={R} fill="none" stroke="#f3f4f6" strokeWidth="22" />
                {segmentsWithOffset.map((seg, i) => (
                  <circle
                    key={i}
                    cx={CX}
                    cy={CY}
                    r={R}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth="22"
                    strokeDasharray={seg.dashArray}
                    strokeDashoffset={seg.dashOffset}
                  />
                ))}
                {/* Center text */}
                <text x={CX} y={CY - 8} textAnchor="middle" fontSize="22" fontWeight="700" fill="#111827">87</text>
                <text x={CX} y={CY + 10} textAnchor="middle" fontSize="10" fill="#6b7280">reuniões</text>
                <text x={CX} y={CY + 22} textAnchor="middle" fontSize="10" fill="#6b7280">agendadas</text>
              </svg>
            </div>
            <div className="flex flex-col gap-2.5 flex-1">
              {DONUT_SEGMENTS.map((seg) => (
                <div key={seg.label} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
                    <span className="text-gray-600 text-xs">{seg.label}</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-800">{seg.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── ICP Card (full width) ──────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Target size={16} className="text-brand" />
            <h2 className="text-sm font-semibold text-gray-900">Perfil Ideal de Cliente (ICP)</h2>
          </div>
          <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
            Atualizado agora
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            {ICP_DIMS.map((dim) => (
              <div key={dim.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-gray-700">{dim.label}</span>
                  <span className="text-gray-500">{dim.desc} <span className="text-gray-400">({dim.weight}/{dim.max})</span></span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${dim.color}`}
                    style={{ width: `${(dim.weight / dim.max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-4">
            <div className="text-center py-4">
              <div className="text-4xl font-bold text-gray-900">87<span className="text-xl text-gray-400">/100</span></div>
              <div className="text-xs text-gray-500 mt-1">Score ICP</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                💡 <strong>Recomendação:</strong> Criar campanha focada em empresas de Tech 50–200 funcionários com decisor VP Comercial em SP
              </p>
            </div>
            <button
              onClick={() => navigate('/campanhas')}
              className="w-full text-xs text-blue-600 border border-blue-200 rounded-lg py-2 hover:bg-blue-50 transition-colors font-medium"
            >
              Criar campanha com esse perfil →
            </button>
          </div>
        </div>
      </div>

      {/* ── Padrões + Memória ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Padrões Detectados */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-amber-500" />
              <h2 className="text-sm font-semibold text-gray-900">Padrões Detectados</h2>
            </div>
            <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">3 novos</span>
          </div>
          <div className="space-y-3">
            {PATTERNS.map((p, i) => (
              <div key={i} className={`border-l-4 ${p.border} pl-3 py-1 flex items-start justify-between gap-2`}>
                <p className="text-xs text-gray-700 font-medium leading-relaxed">{p.text}</p>
                <span className={`text-xs px-1.5 py-0.5 rounded font-semibold flex-shrink-0 ${p.badge}`}>{p.delta}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100">
            <a href="/inteligencia" className="text-xs text-blue-600 hover:underline">
              Ver todos no Centro de Inteligência →
            </a>
          </div>
        </div>

        {/* Memória Ativa */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-purple-500" />
              <h2 className="text-sm font-semibold text-gray-900">Memória Ativa</h2>
            </div>
            <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-medium">127 contatos</span>
          </div>
          <div className="space-y-3">
            {CONTACTS.map((c, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {c.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900">{c.nome} <span className="text-gray-400 font-normal">· {c.empresa}</span></p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{c.last}</p>
                  <p className="text-xs text-blue-600 mt-0.5 truncate">→ {c.next}</p>
                </div>
                <button
                  onClick={() => navigate('/inteligencia')}
                  className="text-xs text-gray-400 hover:text-gray-700 flex-shrink-0 font-medium"
                >
                  Ver →
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── KPIs de Inteligência + Inteligência Coletiva + Feed ───────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* KPIs de Inteligência 2×2 */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">KPIs de Inteligência</h2>
          <div className="grid grid-cols-2 gap-3">
            {/* Score médio propensão */}
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Score Médio Propensão</p>
              <p className="text-xl font-bold text-gray-900 font-mono">78,4</p>
              <div className="h-1 bg-gray-200 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '78%' }} />
              </div>
              <p className="text-xs text-emerald-600 mt-1 font-medium">▲ 4 pts esta semana</p>
            </div>
            {/* Taxa acerto timing */}
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Acerto de Timing</p>
              <p className="text-xl font-bold text-gray-900 font-mono">64%</p>
              <div className="h-1 bg-gray-200 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '64%' }} />
              </div>
              <p className="text-xs text-red-500 mt-1 font-medium">▼ 3% vs ontem</p>
            </div>
            {/* Insights Cross-Cliente */}
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Insights Cross-Cliente</p>
              <p className="text-xl font-bold text-gray-900 font-mono">12</p>
              <span className="text-xs bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-medium">aprovados</span>
              <p className="text-xs text-emerald-600 mt-1 font-medium">▲ 3 esta semana</p>
            </div>
            {/* Versões simulador */}
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Versões Simulador</p>
              <p className="text-xl font-bold text-gray-900 font-mono">8</p>
              <span className="text-xs bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-medium">versões</span>
              <p className="text-xs text-blue-600 mt-1 font-medium">▲ 2 novas</p>
            </div>
          </div>
        </div>

        {/* Inteligência Coletiva */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Brain size={16} className="text-purple-600" />
            <h2 className="text-sm font-semibold text-gray-900">Inteligência Coletiva</h2>
          </div>
          <div className="space-y-3 flex-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Argumentos validados esta semana</span>
              <span className="font-bold text-gray-900">5</span>
            </div>
            <div className="h-px bg-gray-100" />
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Propagados para novos agentes</span>
              <span className="font-bold text-gray-900">3</span>
            </div>
            <div className="h-px bg-gray-100" />
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Campanhas beneficiadas</span>
              <span className="font-bold text-gray-900">2</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100">
            <a href="/inteligencia" className="text-xs text-blue-600 hover:underline">
              Ver Centro de Inteligência →
            </a>
          </div>
        </div>

        {/* Feed de Atividade */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={16} className="text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-900">Atividade Recente</h2>
          </div>
          <div className="space-y-3">
            {feedItems.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Nenhuma atividade ainda.</p>
            ) : (
              feedItems.map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${item.dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 leading-relaxed">{item.text}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Painéis IC (Inteligência Coletiva) ────────────────────────────── */}
      <PainelIC />

      {/* ── Meritocracia + Próximas da Fila ───────────────────────────────── */}
      <CardMeritocracia />
      <CardProximasFila reunioes={reunioesFila} />

      {/* ── Agentes + Campanhas ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Agentes */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-gray-900">Agentes</h2>
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
              {agentes?.length ?? 0} registrados
            </span>
          </div>

          {!agentes || agentes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                <Bot size={24} className="text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">Nenhum agente configurado ainda.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {agentes.map((ag: { id: string; nome: string; voz?: string }) => (
                <div
                  key={ag.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100"
                >
                  <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0">
                    <Bot size={18} className="text-brand-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{ag.nome}</p>
                    <p className="text-xs text-gray-400">{ag.voz || 'Voz padrão Telnyx'}</p>
                  </div>
                  <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Ativo</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Campanhas */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-gray-900">Campanhas</h2>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
              {campanhas?.length ?? 0}
            </span>
          </div>

          {!campanhas || campanhas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                <Activity size={24} className="text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">Nenhuma campanha.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {campanhas.map((c: { id: string; nome: string; status?: string }) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100"
                >
                  <p className="text-sm font-medium text-gray-800 truncate">{c.nome}</p>
                  <span className="text-xs bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-medium flex-shrink-0 ml-2">
                    {c.status || 'pendente'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
