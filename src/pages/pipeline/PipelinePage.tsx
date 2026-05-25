import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { dealsApi } from '@/services/api'
import {
  TrendingUp,
  Users,
  BarChart2,
  Search,
  X,
  ChevronRight,
  MessageSquare,
  Plus,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type Etapa = 'Lead' | 'Qualificado' | 'Proposta' | 'Negociação' | 'Fechado'

interface Deal {
  id: string
  empresa: string
  contato: string
  valor: number
  etapa: Etapa
  probabilidade: number
  responsavel: string
  data: string
  tags: string[]
  agente: string
}

interface ApiDeal {
  id: string
  cliente_id: string
  contato_id: string | null
  nome: string
  etapa: string
  valor: number
  responsavel: string
  data_prevista: string
  criado_em: string
  atualizado_em: string
}

// ─── Mapping helpers ──────────────────────────────────────────────────────────

function mapEtapa(api: string): Etapa {
  const map: Record<string, Etapa> = {
    prospeccao: 'Lead',
    qualificado: 'Qualificado',
    proposta:    'Proposta',
    negociacao:  'Negociação',
    fechado:     'Fechado',
  }
  return map[api] ?? 'Lead'
}

function etapaToApi(etapa: Etapa): string {
  const map: Record<Etapa, string> = {
    Lead:        'prospeccao',
    Qualificado: 'qualificado',
    Proposta:    'proposta',
    Negociação:  'negociacao',
    Fechado:     'fechado',
  }
  return map[etapa]
}

function calcProb(etapa: string): number {
  return (
    ({ prospeccao: 15, qualificado: 40, proposta: 55, negociacao: 75, fechado: 100 } as Record<string, number>)[etapa] ?? 15
  )
}

// ─── Mock data (fallback / demo) ──────────────────────────────────────────────

const INITIAL_DEALS: Deal[] = [
  { id: '1',  empresa: 'Nexus Soluções',     contato: 'Rafael Lima',     valor: 1200,  etapa: 'Lead',        probabilidade: 15,  responsavel: 'Ana',   data: '2026-05-20', tags: ['Inbound'],               agente: 'Clara'   },
  { id: '2',  empresa: 'DataBridge Ltda',    contato: 'Mariana Costa',   valor: 2400,  etapa: 'Lead',        probabilidade: 20,  responsavel: 'Pedro', data: '2026-05-21', tags: ['SaaS'],                  agente: 'Roberto' },
  { id: '3',  empresa: 'Alpha Comércio',     contato: 'Bruno Alves',     valor: 1800,  etapa: 'Lead',        probabilidade: 18,  responsavel: 'Ana',   data: '2026-05-22', tags: ['Outbound'],              agente: 'Clara'   },
  { id: '4',  empresa: 'Prime Tech',         contato: 'Camila Rocha',    valor: 3000,  etapa: 'Lead',        probabilidade: 25,  responsavel: 'Lucas', data: '2026-05-23', tags: ['Demo agendada'],         agente: 'Helena'  },
  { id: '5',  empresa: 'Órbita Digital',     contato: 'Thiago Mendes',   valor: 4500,  etapa: 'Qualificado', probabilidade: 40,  responsavel: 'Ana',   data: '2026-05-18', tags: ['ICP alto'],              agente: 'Clara'   },
  { id: '6',  empresa: 'Sigma Industria',    contato: 'Fernanda Souza',  valor: 5200,  etapa: 'Qualificado', probabilidade: 45,  responsavel: 'Pedro', data: '2026-05-17', tags: ['Urgente'],               agente: 'Marcos'  },
  { id: '7',  empresa: 'Bluewave RH',        contato: 'Rodrigo Neves',   valor: 3800,  etapa: 'Qualificado', probabilidade: 38,  responsavel: 'Lucas', data: '2026-05-16', tags: ['SaaS'],                  agente: 'Helena'  },
  { id: '8',  empresa: 'Consulta Fácil',     contato: 'Patrícia Gomes',  valor: 4200,  etapa: 'Qualificado', probabilidade: 42,  responsavel: 'Ana',   data: '2026-05-15', tags: ['Saúde'],                 agente: 'Clara'   },
  { id: '9',  empresa: 'VentureLabs',        contato: 'César Martins',   valor: 6800,  etapa: 'Proposta',    probabilidade: 55,  responsavel: 'Pedro', data: '2026-05-14', tags: ['Enterprise'],            agente: 'Roberto' },
  { id: '10', empresa: 'Construtech',        contato: 'Juliana Barros',  valor: 7500,  etapa: 'Proposta',    probabilidade: 60,  responsavel: 'Lucas', data: '2026-05-13', tags: ['Proposta enviada'],      agente: 'Marcos'  },
  { id: '11', empresa: 'Fintek Soluções',    contato: 'André Pereira',   valor: 5900,  etapa: 'Proposta',    probabilidade: 52,  responsavel: 'Ana',   data: '2026-05-12', tags: ['Financeiro'],            agente: 'Clara'   },
  { id: '12', empresa: 'GlobalPay Brasil',   contato: 'Isabela Torres',  valor: 12000, etapa: 'Negociação',  probabilidade: 75,  responsavel: 'Pedro', data: '2026-05-10', tags: ['High value', 'ICP alto'], agente: 'Helena' },
  { id: '13', empresa: 'Metatrader Corp',    contato: 'Fábio Cunha',     valor: 15000, etapa: 'Negociação',  probabilidade: 80,  responsavel: 'Lucas', data: '2026-05-09', tags: ['Enterprise', 'Urgente'], agente: 'Marcos' },
  { id: '14', empresa: 'InovaLog',           contato: 'Denise Vieira',   valor: 4200,  etapa: 'Fechado',     probabilidade: 100, responsavel: 'Ana',   data: '2026-05-05', tags: ['Won'],                   agente: 'Clara'   },
  { id: '15', empresa: 'SaúdeNet',           contato: 'Gustavo Lima',    valor: 8800,  etapa: 'Fechado',     probabilidade: 100, responsavel: 'Pedro', data: '2026-05-03', tags: ['Won', 'Saúde'],          agente: 'Roberto' },
]

const ETAPAS: Etapa[] = ['Lead', 'Qualificado', 'Proposta', 'Negociação', 'Fechado']

const ETAPA_COLORS: Record<Etapa, string> = {
  Lead:        'bg-gray-100 text-gray-700',
  Qualificado: 'bg-blue-100 text-blue-700',
  Proposta:    'bg-yellow-100 text-yellow-700',
  Negociação:  'bg-orange-100 text-orange-700',
  Fechado:     'bg-green-100 text-green-700',
}

const PROB_COLOR = (p: number) =>
  p >= 70 ? 'bg-green-500' : p >= 45 ? 'bg-blue-500' : p >= 25 ? 'bg-yellow-400' : 'bg-gray-300'

const RESPONSAVEIS = ['Todos', 'Ana', 'Pedro', 'Lucas']

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

const AVATAR_COLORS = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500']
function avatarColor(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}

// ─── Deal Card ────────────────────────────────────────────────────────────────

function DealCard({ deal, onClick }: { deal: Deal; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
            {deal.empresa}
          </p>
          <p className="text-xs text-gray-500">{deal.contato}</p>
        </div>
        <ChevronRight size={14} className="text-gray-300 group-hover:text-blue-400 mt-0.5 shrink-0" />
      </div>

      <p className="text-base font-bold text-gray-900 mb-2">{fmt(deal.valor)}<span className="text-xs font-normal text-gray-400">/mês</span></p>

      <div className="flex items-center justify-between mb-2">
        <div className="flex-1 mr-2">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-xs text-gray-400">Prob.</span>
            <span className="text-xs font-medium text-gray-700">{deal.probabilidade}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1">
            <div
              className={`${PROB_COLOR(deal.probabilidade)} h-1 rounded-full transition-all`}
              style={{ width: `${deal.probabilidade}%` }}
            />
          </div>
        </div>
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${avatarColor(deal.responsavel)}`}
          title={deal.responsavel}
        >
          {initials(deal.responsavel)}
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {deal.tags.map(t => (
          <span key={t} className="text-xs px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-600">{t}</span>
        ))}
      </div>
    </button>
  )
}

// ─── Column ───────────────────────────────────────────────────────────────────

function KanbanColumn({
  etapa,
  deals,
  onCardClick,
  isLoading,
}: {
  etapa: Etapa
  deals: Deal[]
  onCardClick: (d: Deal) => void
  isLoading?: boolean
}) {
  const total = deals.reduce((s, d) => s + d.valor, 0)

  return (
    <div className="flex flex-col min-w-[240px] w-60 bg-gray-50 rounded-xl border border-gray-200">
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-1">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ETAPA_COLORS[etapa]}`}>{etapa}</span>
          <span className="text-xs font-semibold text-gray-500 bg-gray-200 rounded-full px-2 py-0.5">{deals.length}</span>
        </div>
        <p className="text-xs text-gray-400">{fmt(total)}/mês</p>
      </div>
      <div className="flex flex-col gap-2 p-2 overflow-y-auto max-h-[600px]">
        {isLoading ? (
          <>
            {[1, 2].map(i => (
              <div key={i} className="w-full bg-white border border-gray-200 rounded-xl p-3.5 animate-pulse">
                <div className="h-3 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-1/3" />
              </div>
            ))}
          </>
        ) : (
          <>
            {deals.map(d => (
              <DealCard key={d.id} deal={d} onClick={() => onCardClick(d)} />
            ))}
            {deals.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-6">Nenhum deal</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

const MOCK_ACTIVITY = [
  { date: '23/05 14:30', text: 'Ligação realizada — agente Clara' },
  { date: '22/05 10:00', text: 'E-mail de follow-up enviado' },
  { date: '21/05 16:45', text: 'Lead qualificado via análise ICP (72 pts)' },
]

function DetailPanel({
  deal,
  onClose,
  onMoveStage,
}: {
  deal: Deal
  onClose: () => void
  onMoveStage: (etapa: Etapa) => void
}) {
  const [notes, setNotes] = useState('')

  return (
    <div className="fixed inset-y-0 right-0 w-[400px] bg-white border-l border-gray-200 shadow-2xl flex flex-col z-50 animate-slide-in-right">
      {/* Header */}
      <div className="flex items-start justify-between p-5 border-b border-gray-100">
        <div>
          <h2 className="font-semibold text-gray-900">{deal.empresa}</h2>
          <p className="text-sm text-gray-500">{deal.contato}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
        {/* Value + prob */}
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Valor</p>
            <p className="text-xl font-bold text-gray-900">{fmt(deal.valor)}</p>
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-400 mb-1">Probabilidade</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-100 rounded-full h-2">
                <div
                  className={`${PROB_COLOR(deal.probabilidade)} h-2 rounded-full`}
                  style={{ width: `${deal.probabilidade}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-gray-700">{deal.probabilidade}%</span>
            </div>
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Responsável</p>
            <div className="flex items-center gap-1.5">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white ${avatarColor(deal.responsavel)}`}>
                {initials(deal.responsavel)}
              </div>
              <span className="text-gray-900">{deal.responsavel}</span>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Agente IA</p>
            <span className="text-gray-900">{deal.agente}</span>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Data</p>
            <span className="text-gray-900">{deal.data}</span>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Tags</p>
            <div className="flex flex-wrap gap-1">
              {deal.tags.map(t => (
                <span key={t} className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{t}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Stage mover */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Mover para etapa</p>
          <div className="flex flex-wrap gap-1.5">
            {ETAPAS.map(e => (
              <button
                key={e}
                onClick={() => onMoveStage(e)}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium border transition-colors ${
                  deal.etapa === e
                    ? `${ETAPA_COLORS[e]} border-transparent`
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Anotações</p>
          <textarea
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
            placeholder="Adicione uma nota..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        {/* Activity */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Histórico de atividades</p>
          <div className="flex flex-col gap-2">
            {MOCK_ACTIVITY.map((a, i) => (
              <div key={i} className="flex gap-2 text-sm">
                <span className="text-xs text-gray-400 whitespace-nowrap mt-0.5">{a.date}</span>
                <span className="text-gray-700">{a.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100">
        <button className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-300 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
          <MessageSquare size={15} /> Registrar atividade
        </button>
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PipelinePage() {
  const qc = useQueryClient()
  const { data: rawDeals = [], isLoading } = useQuery({
    queryKey: ['deals'],
    queryFn: () => dealsApi.list().then(r => r.data as ApiDeal[]),
  })

  const deals: Deal[] = rawDeals.length > 0
    ? rawDeals.map(d => ({
        id: d.id,
        empresa: d.nome,
        contato: d.responsavel ?? '—',
        valor: d.valor ?? 0,
        etapa: mapEtapa(d.etapa),
        probabilidade: calcProb(d.etapa),
        responsavel: d.responsavel ?? '—',
        data: d.data_prevista ?? d.criado_em?.slice(0, 10) ?? '',
        tags: [],
        agente: '—',
      }))
    : isLoading ? [] : INITIAL_DEALS

  const moverMutation = useMutation({
    mutationFn: ({ id, etapa }: { id: string; etapa: string }) =>
      dealsApi.update(id, { etapa }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deals'] }),
  })

  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [search, setSearch] = useState('')
  const [filterResp, setFilterResp] = useState('Todos')
  const [filterEtapa, setFilterEtapa] = useState<Etapa | 'Todas'>('Todas')

  const filtered = deals.filter(d => {
    const matchSearch =
      d.empresa.toLowerCase().includes(search.toLowerCase()) ||
      d.contato.toLowerCase().includes(search.toLowerCase())
    const matchResp = filterResp === 'Todos' || d.responsavel === filterResp
    const matchEtapa = filterEtapa === 'Todas' || d.etapa === filterEtapa
    return matchSearch && matchResp && matchEtapa
  })

  function moveStage(id: string, etapa: Etapa) {
    // Optimistically update the selected deal panel
    setSelectedDeal(prev => (prev?.id === id ? { ...prev, etapa } : prev))
    moverMutation.mutate({ id, etapa: etapaToApi(etapa) })
  }

  const totalPipeline = deals.reduce((s, d) => s + d.valor, 0)
  const emNegociacao = deals.filter(d => d.etapa === 'Negociação').length
  const fechados = deals.filter(d => d.etapa === 'Fechado').length
  const taxa = deals.length > 0 ? Math.round((fechados / deals.length) * 100) : 0

  const kpis = [
    { label: 'MRR Total Pipeline', value: fmt(totalPipeline), icon: TrendingUp, color: 'text-blue-600 bg-blue-50' },
    { label: 'Deals em negociação', value: String(emNegociacao), icon: Users, color: 'text-orange-600 bg-orange-50' },
    { label: 'Taxa de conversão', value: `${taxa}%`, icon: BarChart2, color: 'text-green-600 bg-green-50' },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Pipeline de Vendas</h1>
            <p className="text-sm text-gray-500">Gerencie oportunidades em cada etapa do funil</p>
          </div>
          <button className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
            <Plus size={16} /> Novo deal
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          {kpis.map(k => (
            <div key={k.label} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3 shadow-sm">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${k.color}`}>
                <k.icon size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{k.label}</p>
                <p className="text-lg font-bold text-gray-900">{k.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Buscar empresa ou contato..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={filterResp}
            onChange={e => setFilterResp(e.target.value)}
          >
            {RESPONSAVEIS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={filterEtapa}
            onChange={e => setFilterEtapa(e.target.value as Etapa | 'Todas')}
          >
            <option value="Todas">Todas etapas</option>
            {ETAPAS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
      </div>

      {/* Kanban */}
      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-4 h-full">
          {ETAPAS.map(etapa => (
            <KanbanColumn
              key={etapa}
              etapa={etapa}
              deals={filtered.filter(d => d.etapa === etapa)}
              onCardClick={setSelectedDeal}
              isLoading={isLoading}
            />
          ))}
        </div>
      </div>

      {/* Detail panel */}
      {selectedDeal && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setSelectedDeal(null)}
          />
          <DetailPanel
            deal={selectedDeal}
            onClose={() => setSelectedDeal(null)}
            onMoveStage={etapa => moveStage(selectedDeal.id, etapa)}
          />
        </>
      )}
    </div>
  )
}
