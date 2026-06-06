import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  FlaskConical, Shield, Users, Clock, BookOpen, Database,
  BarChart2, Sliders, TrendingUp, Share2, GitBranch, Play,
  Target, TestTube2, Globe, CheckCircle,
  Upload, Trash2, Zap,
  AlertCircle, ArrowRight, RefreshCw, Download, Megaphone, Brain, Sparkles, Loader2, Star, X,
  MessageSquare, Send, MapPin,
} from 'lucide-react'
import { inteligenciaSimuladorApi, inteligenciaApi, claudeApi, api, qualidadeCalcularApi, campanhasApi, agentesApi } from '@/services/api'

type TabId =
  | 'testes' | 'qualidade' | 'coletiva' | 'horarios' | 'campanhas'
  | 'conhecimento' | 'banco' | 'metricas' | 'ajustefino'
  | 'evolucao' | 'cross' | 'padroes' | 'simulador'
  | 'icp' | 'ab' | 'mercado'

interface TabGroup {
  label: string
  tabs: { id: TabId; label: string; icon: React.ReactNode }[]
}

const TAB_GROUPS: TabGroup[] = [
  {
    label: 'ANÃLISE',
    tabs: [
      { id: 'testes', label: 'Testes', icon: <FlaskConical size={14} /> },
      { id: 'qualidade', label: 'Qualidade', icon: <Shield size={14} /> },
      { id: 'coletiva', label: 'IC', icon: <Users size={14} /> },
      { id: 'horarios', label: 'HorÃ¡rios', icon: <Clock size={14} /> },
      { id: 'campanhas', label: 'Campanhas', icon: <Megaphone size={14} /> },
    ],
  },
  {
    label: 'CONHECIMENTO',
    tabs: [
      { id: 'conhecimento', label: 'Conhecimento', icon: <BookOpen size={14} /> },
      { id: 'banco', label: 'Banco', icon: <Database size={14} /> },
      { id: 'metricas', label: 'MÃ©tricas', icon: <BarChart2 size={14} /> },
      { id: 'ajustefino', label: 'Ajuste Fino', icon: <Sliders size={14} /> },
    ],
  },
  {
    label: 'INTELIGÃŠNCIA',
    tabs: [
      { id: 'evolucao', label: 'EvoluÃ§Ã£o', icon: <TrendingUp size={14} /> },
      { id: 'cross', label: 'Cross', icon: <Share2 size={14} /> },
      { id: 'padroes', label: 'PadrÃµes', icon: <GitBranch size={14} /> },
      { id: 'simulador', label: 'Simulador', icon: <Play size={14} /> },
      { id: 'icp', label: 'ICP', icon: <Target size={14} /> },
      { id: 'ab', label: 'A/B', icon: <TestTube2 size={14} /> },
      { id: 'mercado', label: 'Mercado', icon: <Globe size={14} /> },
    ],
  },
]

function Bar({ pct, color = 'bg-blue-500' }: { pct: number; color?: string }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-2">
      <div className={`${color} h-2 rounded-full`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function KpiCard({
  label, value, sub, accent = 'blue',
}: {
  label: string; value: string; sub?: string; accent?: 'blue' | 'green' | 'purple' | 'amber'
}) {
  const colors: Record<string, string> = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-emerald-600 bg-emerald-50',
    purple: 'text-purple-600 bg-purple-50',
    amber: 'text-amber-600 bg-amber-50',
  }
  return (
    <div className={`rounded-xl p-4 ${colors[accent]}`}>
      <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
      <p className="text-2xl font-mono font-bold">{value}</p>
      {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
    </div>
  )
}

// â”€â”€â”€ TAB PANELS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function TabTestes() {
  const [cicloRodou, setCicloRodou] = useState(false)
  const [cicloMsg, setCicloMsg]     = useState('')

  const { data: testesData, isLoading, refetch } = useQuery({
    queryKey: ['inteligencia-testes'],
    queryFn: () => api.get('/inteligencia/testes').then(r => r.data as any),
  })
  const rows: any[]  = testesData?.rows  ?? []
  const stats: any   = testesData?.stats ?? {}

  const total   = stats.total   ?? rows.length
  const sucesso = stats.sucesso ?? 0
  const taxa    = stats.taxaSucesso ?? (total > 0 ? Math.round(sucesso / total * 100) : 0)

  // Resultado â†’ label + cor
  function resultadoBadge(resultado: string) {
    const map: Record<string, { label: string; cls: string }> = {
      agendou:     { label: 'Agendou',     cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      transferida: { label: 'Transferida', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
      nao_atendeu: { label: 'NÃ£o atendeu', cls: 'bg-gray-50 text-gray-500 border-gray-200' },
      sem_interesse:{ label: 'Sem interesse',cls: 'bg-amber-50 text-amber-700 border-amber-200' },
      esgotado:    { label: 'Esgotado',    cls: 'bg-red-50 text-red-600 border-red-200' },
    }
    const r = map[resultado] ?? { label: resultado ?? 'â€”', cls: 'bg-gray-50 text-gray-500 border-gray-200' }
    return <span className={`text-2xs px-2 py-0.5 rounded-full font-semibold border ${r.cls}`}>{r.label}</span>
  }

  async function rodarCiclo() {
    setCicloRodou(true)
    setCicloMsg('Processando ligaÃ§Ãµes recentes...')
    await new Promise(r => setTimeout(r, 1500))
    await refetch()
    setCicloMsg('âœ“ Dados atualizados')
    setTimeout(() => { setCicloRodou(false); setCicloMsg('') }, 3000)
  }

  return (
    <div className="space-y-4">

      {/* â”€â”€ ExplicaÃ§Ã£o para o cliente â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <FlaskConical size={18} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 mb-1">QA AutomÃ¡tico â€” AnÃ¡lise de LigaÃ§Ãµes</h2>
              <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">
                Esta aba mostra o resultado de todas as ligaÃ§Ãµes realizadas pelos seus agentes â€” quais converteram, quais nÃ£o atenderam e qual a taxa de sucesso geral.
                Com esses dados, vocÃª identifica padrÃµes, mede o desempenho real e ajusta campanhas antes de escalar.
              </p>
              <div className="flex flex-wrap gap-3 mt-3">
                <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-full px-3 py-1">
                  <CheckCircle size={11} className="text-emerald-500" /> Taxa de conversÃ£o em tempo real
                </span>
                <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-full px-3 py-1">
                  <CheckCircle size={11} className="text-emerald-500" /> HistÃ³rico completo por agente
                </span>
                <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-full px-3 py-1">
                  <CheckCircle size={11} className="text-emerald-500" /> Score ICP de cada contato
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={rodarCiclo}
            disabled={cicloRodou}
            className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl bg-brand-50 border border-brand-200 text-brand-700 hover:bg-brand-100 transition-colors disabled:opacity-60 flex-shrink-0"
          >
            <RefreshCw size={14} className={cicloRodou ? 'animate-spin' : ''} />
            {cicloMsg || 'Atualizar dados'}
          </button>
        </div>
      </div>

      {/* â”€â”€ KPI strip â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <TrendingUp size={18} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-2xs text-gray-400 font-medium mb-0.5">Taxa de conversÃ£o</p>
            <p className="text-2xl font-mono font-bold text-emerald-600">{taxa}<span className="text-sm text-gray-400 font-normal">%</span></p>
            <p className="text-2xs text-gray-400">{sucesso} de {total} ligaÃ§Ãµes</p>
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <BarChart2 size={18} className="text-blue-600" />
          </div>
          <div>
            <p className="text-2xs text-gray-400 font-medium mb-0.5">LigaÃ§Ãµes analisadas</p>
            <p className="text-2xl font-mono font-bold text-gray-900">{total}</p>
            <p className="text-2xs text-gray-400">Ãºltimas 50 com resultado</p>
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
            <Target size={18} className="text-brand-600" />
          </div>
          <div>
            <p className="text-2xs text-gray-400 font-medium mb-0.5">Sem resultado</p>
            <p className="text-2xl font-mono font-bold text-gray-900">{total - sucesso}</p>
            <p className="text-2xs text-gray-400">nÃ£o atenderam ou sem interesse</p>
          </div>
        </div>
      </div>

      {/* â”€â”€ Tabela de ligaÃ§Ãµes reais â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">HistÃ³rico de ligaÃ§Ãµes processadas</h3>
            <p className="text-xs text-gray-400 mt-0.5">Ãšltimas {rows.length} ligaÃ§Ãµes com resultado registrado pelos seus agentes</p>
          </div>
          {rows.length > 0 && (
            <span className="text-2xs bg-brand-50 border border-brand-200 text-brand-700 rounded-full px-2.5 py-1 font-semibold">
              {rows.length} registros
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-8 bg-gray-50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="py-14 text-center">
            <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-3">
              <FlaskConical size={22} className="text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500 mb-1">Nenhuma ligaÃ§Ã£o com resultado ainda</p>
            <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
              Assim que seus agentes realizarem ligaÃ§Ãµes e registrarem resultados, o histÃ³rico aparecerÃ¡ aqui automaticamente.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-2xs text-gray-400 font-semibold uppercase tracking-wide bg-gray-50">
                  <th className="text-left px-5 py-3">Contato</th>
                  <th className="text-left px-5 py-3">Empresa</th>
                  <th className="text-left px-5 py-3">Agente</th>
                  <th className="text-left px-5 py-3">Resultado</th>
                  <th className="text-left px-5 py-3">ICP</th>
                  <th className="text-left px-5 py-3">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((r: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">{r.contato ?? 'â€”'}</td>
                    <td className="px-5 py-3 text-xs text-gray-500">{r.empresa ?? 'â€”'}</td>
                    <td className="px-5 py-3 text-xs text-gray-600">{r.agente ?? 'â€”'}</td>
                    <td className="px-5 py-3">{resultadoBadge(r.resultado)}</td>
                    <td className="px-5 py-3">
                      {r.icp > 0 ? (
                        <span className={`text-2xs font-bold font-mono px-2 py-0.5 rounded-full border ${r.icp >= 70 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : r.icp >= 50 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                          {r.icp}
                        </span>
                      ) : <span className="text-xs text-gray-300">â€”</span>}
                    </td>
                    <td className="px-5 py-3 text-2xs text-gray-400 font-mono">
                      {r.data ? new Date(r.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'â€”'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* â”€â”€ PrÃ³ximos passos / orientaÃ§Ã£o â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={15} className="text-brand-600" />
            <h3 className="text-sm font-semibold text-brand-800">Como aumentar a taxa de conversÃ£o</h3>
          </div>
          <ul className="space-y-2 mt-3">
            {[
              'Analise os horÃ¡rios com maior taxa de atendimento na aba HorÃ¡rios',
              'Revise os argumentos de alta performance na aba Cross',
              'Ajuste o script do agente com base nos padrÃµes detectados',
              'Use a aba Simulador para testar novas abordagens antes de publicar',
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-brand-700">
                <span className="w-4 h-4 rounded-full bg-brand-200 text-brand-700 text-2xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={15} className="text-amber-500" />
            <h3 className="text-sm font-semibold text-gray-900">O que cada resultado significa</h3>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Agendou',      desc: 'ReuniÃ£o marcada â€” conversÃ£o completa',       cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
              { label: 'Transferida',  desc: 'Passou para vendedor humano na chamada',     cls: 'bg-blue-50 text-blue-700 border-blue-200' },
              { label: 'NÃ£o atendeu',  desc: 'NinguÃ©m atendeu â€” entra em recontato',       cls: 'bg-gray-50 text-gray-500 border-gray-200' },
              { label: 'Sem interesse',desc: 'Lead rejeitou â€” alimenta o aprendizado CI',  cls: 'bg-amber-50 text-amber-700 border-amber-200' },
              { label: 'Esgotado',     desc: 'Tentativas mÃ¡ximas atingidas',               cls: 'bg-red-50 text-red-600 border-red-200' },
            ].map((r, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <span className={`text-2xs px-2 py-0.5 rounded-full font-semibold border flex-shrink-0 ${r.cls}`}>{r.label}</span>
                <span className="text-xs text-gray-500">{r.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

interface QualidadeItem {
  agente_id: string
  nome_agente?: string
  score_total: number
  taxa_sucesso: number
  total_ligacoes: number
  atualizado_em?: string
  agentes?: { nome: string }
}

function notaFromScore(score: number): { nota: string; cls: string } {
  if (score >= 90) return { nota: 'A+', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
  if (score >= 80) return { nota: 'A',  cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
  if (score >= 70) return { nota: 'B',  cls: 'bg-blue-50 text-blue-700 border-blue-200' }
  if (score >= 60) return { nota: 'C',  cls: 'bg-amber-50 text-amber-700 border-amber-200' }
  return { nota: 'D', cls: 'bg-red-50 text-red-600 border-red-200' }
}

type Periodo = 'hoje' | 'semana' | 'mes'

const PERIODO_LABELS: Record<Periodo, string> = {
  hoje:   'Hoje',
  semana: 'Esta semana',
  mes:    'Este mÃªs',
}

const PERIODO_DESC: Record<Periodo, string> = {
  hoje:   'LigaÃ§Ãµes realizadas hoje',
  semana: 'LigaÃ§Ãµes desde segunda-feira',
  mes:    'LigaÃ§Ãµes desde o dia 1Âº',
}

function TabQualidade() {
  const [periodo, setPeriodo]       = useState<Periodo>('hoje')
  const [calculando, setCalculando] = useState(false)
  const [calcMsg, setCalcMsg]       = useState('')
  const [calcInfo, setCalcInfo]     = useState<{ ligacoes: number; desde: string } | null>(null)

  const { data: qualidade = [], isLoading, refetch } = useQuery<QualidadeItem[]>({
    queryKey: ['inteligencia-qualidade'],
    queryFn: () => inteligenciaApi.getQualidade().then(r => (r.data as QualidadeItem[]) || []),
  })

  async function calcularScores() {
    setCalculando(true)
    setCalcMsg('Calculando...')
    setCalcInfo(null)
    try {
      const res = await qualidadeCalcularApi.calcular(periodo)
      const d = res.data as { calculados: number; ligacoes_encontradas: number; desde: string }
      await refetch()
      if (d.calculados === 0) {
        setCalcMsg(`Nenhuma ligaÃ§Ã£o encontrada ${PERIODO_DESC[periodo].toLowerCase()}`)
      } else {
        setCalcMsg(`âœ“ ${d.calculados} agente${d.calculados !== 1 ? 's' : ''} atualizado${d.calculados !== 1 ? 's' : ''}`)
        setCalcInfo({ ligacoes: d.ligacoes_encontradas, desde: d.desde })
      }
    } catch {
      setCalcMsg('Erro ao calcular â€” tente novamente')
    } finally {
      setCalculando(false)
      setTimeout(() => { setCalcMsg(''); setCalcInfo(null) }, 6000)
    }
  }

  // MÃ©tricas agregadas
  const totalAgentes  = qualidade.length
  const mediaScore    = totalAgentes > 0
    ? Math.round(qualidade.reduce((s, q) => s + (q.score_total ?? 0), 0) / totalAgentes)
    : 0
  const totalLigacoes = qualidade.reduce((s, q) => s + (q.total_ligacoes ?? 0), 0)
  const melhor        = totalAgentes > 0
    ? qualidade.reduce((a, b) => (a.score_total ?? 0) >= (b.score_total ?? 0) ? a : b)
    : null

  return (
    <div className="space-y-4">

      {/* â”€â”€ ExplicaÃ§Ã£o â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Shield size={18} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 mb-1">QA de Agentes â€” Score de Desempenho</h2>
              <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">
                Mostra o desempenho real de cada agente de IA com base nas ligaÃ§Ãµes dos Ãºltimos 30 dias.
                O score Ã© calculado automaticamente: agentes que geram mais agendamentos e transferÃªncias recebem nota maior.
                Use para identificar qual agente estÃ¡ performando melhor e em quais campanhas colocÃ¡-lo.
              </p>
              <div className="flex flex-wrap gap-3 mt-3">
                {[
                  'Score calculado das ligaÃ§Ãµes reais',
                  'Nota A+ a D por agente',
                  'Ranking automÃ¡tico por conversÃ£o',
                ].map(t => (
                  <span key={t} className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-full px-3 py-1">
                    <CheckCircle size={11} className="text-emerald-500" /> {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
          {/* Seletor de perÃ­odo + botÃ£o calcular */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            {/* Pills de perÃ­odo */}
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl p-1">
              {(Object.keys(PERIODO_LABELS) as Periodo[]).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriodo(p)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                    periodo === p
                      ? 'bg-white border border-gray-200 text-gray-900 shadow-sm font-semibold'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {PERIODO_LABELS[p]}
                </button>
              ))}
            </div>

            <button
              onClick={calcularScores}
              disabled={calculando}
              className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl bg-brand-600 text-white hover:bg-brand-700 transition-colors disabled:opacity-60 w-full justify-center"
            >
              <RefreshCw size={14} className={calculando ? 'animate-spin' : ''} />
              {calculando ? 'Calculando...' : `Calcular â€” ${PERIODO_LABELS[periodo]}`}
            </button>

            {calcMsg && (
              <div className="text-right">
                <p className={`text-xs font-medium ${calcMsg.startsWith('âœ“') ? 'text-emerald-600' : calcMsg.startsWith('Nenhuma') ? 'text-amber-600' : 'text-red-500'}`}>
                  {calcMsg}
                </p>
                {calcInfo && (
                  <p className="text-2xs text-gray-400 mt-0.5">
                    {calcInfo.ligacoes} lig. Â· desde {new Date(calcInfo.desde).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* â”€â”€ KPI strip â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {totalAgentes > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
              <Users size={18} className="text-brand-600" />
            </div>
            <div>
              <p className="text-2xs text-gray-400 font-medium mb-0.5">Agentes avaliados</p>
              <p className="text-2xl font-mono font-bold text-gray-900">{totalAgentes}</p>
              <p className="text-2xs text-gray-400">{totalLigacoes} ligaÃ§Ãµes analisadas</p>
            </div>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <TrendingUp size={18} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-2xs text-gray-400 font-medium mb-0.5">Score mÃ©dio</p>
              <p className="text-2xl font-mono font-bold text-emerald-600">{mediaScore}<span className="text-sm text-gray-400 font-normal">%</span></p>
              <p className="text-2xs text-gray-400">conversÃ£o mÃ©dia dos agentes</p>
            </div>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
              <Star size={18} className="text-amber-500" />
            </div>
            <div>
              <p className="text-2xs text-gray-400 font-medium mb-0.5">Melhor agente</p>
              <p className="text-sm font-bold text-gray-900 truncate">
                {melhor?.agentes?.nome ?? melhor?.nome_agente ?? melhor?.agente_id ?? 'â€”'}
              </p>
              <p className="text-2xs text-gray-400">{melhor?.score_total ?? 0}% de conversÃ£o</p>
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ Tabela de agentes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Ranking de desempenho por agente</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Score = % de conversÃ£o Â· perÃ­odo: <span className="font-medium text-gray-600">{PERIODO_LABELS[periodo]}</span> â€” {PERIODO_DESC[periodo].toLowerCase()}
            </p>
          </div>
          {totalAgentes > 0 && (
            <span className="text-2xs bg-brand-50 border border-brand-200 text-brand-700 rounded-full px-2.5 py-1 font-semibold">
              {totalAgentes} agente{totalAgentes !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-10 bg-gray-50 rounded-lg animate-pulse" />)}
          </div>
        ) : qualidade.length === 0 ? (
          <div className="py-14 text-center">
            <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-3">
              <Shield size={22} className="text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500 mb-1">Nenhum score calculado ainda</p>
            <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed mb-4">
              Selecione o perÃ­odo e clique em "Calcular" para gerar o ranking de desempenho dos seus agentes.
            </p>
            <button
              onClick={calcularScores}
              disabled={calculando}
              className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl bg-brand-600 text-white hover:bg-brand-700 transition-colors disabled:opacity-60"
            >
              <RefreshCw size={14} className={calculando ? 'animate-spin' : ''} />
              {calculando ? 'Calculando...' : `Calcular â€” ${PERIODO_LABELS[periodo]}`}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-2xs text-gray-400 font-semibold uppercase tracking-wide bg-gray-50">
                  <th className="text-left px-5 py-3">#</th>
                  <th className="text-left px-5 py-3">Agente</th>
                  <th className="text-left px-5 py-3">Score</th>
                  <th className="text-left px-5 py-3">Nota</th>
                  <th className="text-left px-5 py-3">LigaÃ§Ãµes</th>
                  <th className="text-left px-5 py-3">Atualizado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[...qualidade]
                  .sort((a, b) => (b.score_total ?? 0) - (a.score_total ?? 0))
                  .map((q, i) => {
                    const nome = q.agentes?.nome ?? q.nome_agente ?? q.agente_id ?? 'â€”'
                    const score = q.score_total ?? 0
                    const { nota, cls } = notaFromScore(score)
                    const barColor = score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-blue-500' : 'bg-amber-400'
                    return (
                      <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-2xs font-bold ${i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                            {i + 1}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{nome}</td>
                        <td className="px-5 py-3.5 w-48">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${barColor}`} style={{ width: `${score}%` }} />
                            </div>
                            <span className="text-xs font-mono font-bold text-gray-900 w-10 text-right">{score}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${cls}`}>{nota}</span>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-gray-500">{q.total_ligacoes ?? 0}</td>
                        <td className="px-5 py-3.5 text-2xs text-gray-400 font-mono">
                          {q.atualizado_em
                            ? new Date(q.atualizado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                            : 'â€”'}
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* â”€â”€ Guia de notas â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={15} className="text-amber-500" />
            <h3 className="text-sm font-semibold text-gray-900">O que cada nota significa</h3>
          </div>
          <div className="space-y-2">
            {[
              { nota: 'A+', range: 'â‰¥ 90%', desc: 'Excelente â€” agente no topo da performance',      cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
              { nota: 'A',  range: '80â€“89%', desc: 'Muito bom â€” resultados consistentes',            cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
              { nota: 'B',  range: '70â€“79%', desc: 'Bom â€” pode melhorar com ajuste de script',       cls: 'bg-blue-50 text-blue-700 border-blue-200' },
              { nota: 'C',  range: '60â€“69%', desc: 'Regular â€” revisar abordagem e horÃ¡rios',         cls: 'bg-amber-50 text-amber-700 border-amber-200' },
              { nota: 'D',  range: '< 60%',  desc: 'CrÃ­tico â€” recomendado ajuste fino urgente',      cls: 'bg-red-50 text-red-600 border-red-200' },
            ].map((r, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border w-9 text-center flex-shrink-0 ${r.cls}`}>{r.nota}</span>
                <span className="text-2xs text-gray-400 w-14 flex-shrink-0 font-mono">{r.range}</span>
                <span className="text-xs text-gray-600">{r.desc}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={15} className="text-brand-600" />
            <h3 className="text-sm font-semibold text-brand-800">Como melhorar o score dos agentes</h3>
          </div>
          <ul className="space-y-2">
            {[
              'Recalcule os scores apÃ³s cada campanha para acompanhar a evoluÃ§Ã£o',
              'Agentes com nota C ou D â†’ use a aba Ajuste Fino para refinar o script',
              'Compare os horÃ¡rios de pico na aba HorÃ¡rios e ajuste os agentes de baixa nota',
              'Aplique os argumentos aprovados via aba Cross para elevar conversÃ£o',
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-brand-700">
                <span className="w-4 h-4 rounded-full bg-brand-200 text-brand-700 text-2xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

interface CrossArgumento {
  id: string
  gatilho: string
  frase: string
  eficacia?: number
  aprovado: boolean
  criado_em?: string
}

const GATILHO_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  urgencia:    { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200' },
  preco:       { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200' },
  proposta:    { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200' },
  decisor:     { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  concorrente: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  demo:        { bg: 'bg-teal-50',   text: 'text-teal-700',   border: 'border-teal-200' },
  humano:      { bg: 'bg-pink-50',   text: 'text-pink-700',   border: 'border-pink-200' },
}

function gatilhoBadge(gatilho: string) {
  const c = GATILHO_COLORS[gatilho] ?? { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' }
  return <span className={`text-2xs font-semibold px-2 py-0.5 rounded-full border ${c.bg} ${c.text} ${c.border}`}>{gatilho}</span>
}

function TabColetiva() {
  const [detectando, setDetectando]       = useState(false)
  const [detectMsg, setDetectMsg]         = useState('')
  const [acaoId, setAcaoId]               = useState<string | null>(null)
  const [filtro, setFiltro]               = useState<'pendentes' | 'aprovados'>('pendentes')

  const { data: crossRaw = [], isLoading, refetch } = useQuery<CrossArgumento[]>({
    queryKey: ['inteligencia-cross'],
    queryFn: () => inteligenciaApi.getCross().then(r => (r.data as CrossArgumento[]) || []),
    refetchInterval: 30000,
  })

  const pendentes = crossRaw.filter(a => !a.aprovado)
  const aprovados = crossRaw.filter(a =>  a.aprovado)
  const lista     = filtro === 'pendentes' ? pendentes : aprovados

  // Mapa de gatilhos dos aprovados (para o painel de padrÃµes)
  const gatilhoCount: Record<string, number> = {}
  aprovados.forEach(a => {
    gatilhoCount[a.gatilho] = (gatilhoCount[a.gatilho] || 0) + 1
  })
  const gatilhoRanking = Object.entries(gatilhoCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)

  async function aprovar(id: string) {
    setAcaoId(id)
    try {
      await inteligenciaApi.aprovarCross(id)
      await refetch()
    } catch { /* silencioso */ }
    finally { setAcaoId(null) }
  }

  async function rejeitar(id: string) {
    setAcaoId(id)
    try {
      await inteligenciaApi.rejeitarCross(id)
      await refetch()
    } catch { /* silencioso */ }
    finally { setAcaoId(null) }
  }

  async function detectarPadroes() {
    setDetectando(true)
    setDetectMsg('Analisando ligaÃ§Ãµes com IA...')
    try {
      const res = await inteligenciaApi.detectarPadroes()
      const d = res.data as { padroes?: any[] }
      await refetch()
      const qtd = d?.padroes?.length ?? 0
      setDetectMsg(qtd > 0 ? `âœ“ ${qtd} novo${qtd !== 1 ? 's' : ''} padrÃ£o${qtd !== 1 ? 'Ãµes' : ''} detectado${qtd !== 1 ? 's' : ''}` : 'âœ“ AnÃ¡lise concluÃ­da â€” sem novos padrÃµes')
    } catch {
      setDetectMsg('Erro na anÃ¡lise â€” tente novamente')
    } finally {
      setDetectando(false)
      setTimeout(() => setDetectMsg(''), 5000)
    }
  }

  const STEPS = [
    { label: 'LigaÃ§Ãµes', desc: 'Agentes ligam para leads' },
    { label: 'AnÃ¡lise', desc: 'IA detecta o que converte' },
    { label: 'PadrÃµes', desc: 'Argumentos gerados' },
    { label: 'AprovaÃ§Ã£o', desc: 'Gerente aprova aqui' },
    { label: 'ProduÃ§Ã£o', desc: 'Injetado nos agentes' },
    { label: 'Impacto', desc: 'ConversÃ£o aumenta' },
  ]

  return (
    <div className="space-y-4">

      {/* â”€â”€ ExplicaÃ§Ã£o â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Share2 size={18} className="text-purple-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 mb-1">InteligÃªncia Coletiva â€” Ciclo de Aprendizado</h2>
              <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">
                A cada ligaÃ§Ã£o, a IA identifica frases e argumentos que geraram conversÃ£o.
                Esses padrÃµes chegam aqui como <strong className="text-gray-700">pendentes de aprovaÃ§Ã£o</strong> â€” vocÃª revisa, aprova ou rejeita.
                Os aprovados sÃ£o <strong className="text-gray-700">injetados automaticamente em todos os agentes</strong>, que passam a usÃ¡-los nas prÃ³ximas chamadas.
              </p>
              <div className="flex flex-wrap gap-3 mt-3">
                {[
                  'PadrÃµes extraÃ­dos de ligaÃ§Ãµes reais',
                  'AprovaÃ§Ã£o obrigatÃ³ria pelo gerente',
                  'Aplicado em todos os agentes automaticamente',
                ].map(t => (
                  <span key={t} className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-full px-3 py-1">
                    <CheckCircle size={11} className="text-emerald-500" /> {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <button
              onClick={detectarPadroes}
              disabled={detectando}
              className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl bg-brand-600 text-white hover:bg-brand-700 transition-colors disabled:opacity-60"
            >
              <Sparkles size={14} className={detectando ? 'animate-pulse' : ''} />
              {detectando ? 'Analisando...' : 'Detectar padrÃµes agora'}
            </button>
            {detectMsg && (
              <p className={`text-xs font-medium ${detectMsg.startsWith('âœ“') ? 'text-emerald-600' : 'text-red-500'}`}>
                {detectMsg}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* â”€â”€ KPI strip â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
            <AlertCircle size={18} className="text-amber-500" />
          </div>
          <div>
            <p className="text-2xs text-gray-400 font-medium mb-0.5">Pendentes de aprovaÃ§Ã£o</p>
            <p className="text-2xl font-mono font-bold text-amber-600">{pendentes.length}</p>
            <p className="text-2xs text-gray-400">aguardando sua revisÃ£o</p>
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <CheckCircle size={18} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-2xs text-gray-400 font-medium mb-0.5">Aprovados e ativos</p>
            <p className="text-2xl font-mono font-bold text-emerald-600">{aprovados.length}</p>
            <p className="text-2xs text-gray-400">injetados nos agentes</p>
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
            <GitBranch size={18} className="text-brand-600" />
          </div>
          <div>
            <p className="text-2xs text-gray-400 font-medium mb-0.5">Tipos de gatilho</p>
            <p className="text-2xl font-mono font-bold text-gray-900">{Object.keys(gatilhoCount).length}</p>
            <p className="text-2xs text-gray-400">categorias distintas</p>
          </div>
        </div>
      </div>

      {/* â”€â”€ Ciclo cascade visual â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Como funciona o ciclo</h3>
        <div className="flex items-start gap-1 flex-wrap">
          {STEPS.map((s, i) => {
            const isActive = s.label === 'AprovaÃ§Ã£o' && pendentes.length > 0
            const isDone   = s.label === 'ProduÃ§Ã£o' && aprovados.length > 0
            return (
              <div key={i} className="flex items-center gap-1">
                <div className={`flex flex-col items-center px-3 py-2 rounded-xl border text-center min-w-[80px] ${
                  isActive ? 'bg-amber-50 border-amber-300' :
                  isDone   ? 'bg-emerald-50 border-emerald-200' :
                  'bg-gray-50 border-gray-100'
                }`}>
                  <span className={`text-xs font-semibold ${isActive ? 'text-amber-700' : isDone ? 'text-emerald-700' : 'text-gray-700'}`}>
                    {s.label}
                    {isActive && <span className="ml-1 text-2xs">âš¡</span>}
                    {isDone   && <span className="ml-1 text-2xs">âœ“</span>}
                  </span>
                  <span className="text-2xs text-gray-400 mt-0.5 leading-tight">{s.desc}</span>
                </div>
                {i < STEPS.length - 1 && <ArrowRight size={13} className="text-gray-300 flex-shrink-0" />}
              </div>
            )
          })}
        </div>
      </div>

      {/* â”€â”€ Lista de argumentos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {/* Tabs pendentes / aprovados */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl p-1">
            <button
              onClick={() => setFiltro('pendentes')}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                filtro === 'pendentes'
                  ? 'bg-white border border-gray-200 text-gray-900 shadow-sm font-semibold'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Pendentes
              {pendentes.length > 0 && (
                <span className="bg-amber-100 text-amber-700 text-2xs font-bold px-1.5 py-0.5 rounded-full">
                  {pendentes.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setFiltro('aprovados')}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                filtro === 'aprovados'
                  ? 'bg-white border border-gray-200 text-gray-900 shadow-sm font-semibold'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Aprovados e ativos
              {aprovados.length > 0 && (
                <span className="bg-emerald-100 text-emerald-700 text-2xs font-bold px-1.5 py-0.5 rounded-full">
                  {aprovados.length}
                </span>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-400">
            {filtro === 'pendentes'
              ? 'Revise cada argumento e aprove os que devem ser usados pelos agentes'
              : 'Argumentos jÃ¡ ativos â€” sÃ£o usados pelos agentes em todas as chamadas'}
          </p>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse" />)}
          </div>
        ) : lista.length === 0 ? (
          <div className="py-14 text-center">
            <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-3">
              <Share2 size={22} className="text-gray-300" />
            </div>
            {filtro === 'pendentes' ? (
              <>
                <p className="text-sm font-medium text-gray-500 mb-1">Nenhum argumento pendente</p>
                <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed mb-4">
                  Clique em "Detectar padrÃµes agora" para a IA analisar as Ãºltimas ligaÃ§Ãµes e identificar frases que converteram.
                </p>
                <button
                  onClick={detectarPadroes}
                  disabled={detectando}
                  className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl bg-brand-600 text-white hover:bg-brand-700 transition-colors disabled:opacity-60"
                >
                  <Sparkles size={14} className={detectando ? 'animate-pulse' : ''} />
                  {detectando ? 'Analisando...' : 'Detectar padrÃµes agora'}
                </button>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-500 mb-1">Nenhum argumento aprovado ainda</p>
                <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
                  Aprove argumentos da aba "Pendentes" para que os agentes comecem a usÃ¡-los.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {lista.map(arg => (
              <div key={arg.id} className="px-5 py-4 flex items-start gap-4 hover:bg-gray-50/50 transition-colors">
                {/* Gatilho badge */}
                <div className="flex-shrink-0 pt-0.5">{gatilhoBadge(arg.gatilho)}</div>

                {/* Frase */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 leading-relaxed">"{arg.frase}"</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    {arg.eficacia && arg.eficacia > 0 && (
                      <span className="text-2xs text-emerald-600 font-semibold">â–² {arg.eficacia}% conversÃ£o</span>
                    )}
                    {arg.criado_em && (
                      <span className="text-2xs text-gray-400 font-mono">
                        {new Date(arg.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      </span>
                    )}
                    {arg.aprovado && (
                      <span className="flex items-center gap-1 text-2xs text-emerald-600 font-medium">
                        <CheckCircle size={10} /> Ativo nos agentes
                      </span>
                    )}
                  </div>
                </div>

                {/* AÃ§Ãµes */}
                {!arg.aprovado && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => aprovar(arg.id)}
                      disabled={acaoId === arg.id}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-60"
                    >
                      <CheckCircle size={12} />
                      {acaoId === arg.id ? '...' : 'Aprovar'}
                    </button>
                    <button
                      onClick={() => rejeitar(arg.id)}
                      disabled={acaoId === arg.id}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors disabled:opacity-60"
                    >
                      <X size={12} />
                      Rejeitar
                    </button>
                  </div>
                )}
                {arg.aprovado && (
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                    <CheckCircle size={14} className="text-emerald-600" />
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* â”€â”€ Mapa de gatilhos ativos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {gatilhoRanking.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">PadrÃµes aprovados por tipo de gatilho</h3>
          <div className="grid grid-cols-2 gap-3">
            {gatilhoRanking.map(([gatilho, count]) => {
              const max = gatilhoRanking[0][1]
              const pct = Math.round((count / max) * 100)
              const c = GATILHO_COLORS[gatilho] ?? { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' }
              return (
                <div key={gatilho}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className={`font-medium ${c.text}`}>{gatilho}</span>
                    <span className="font-mono font-bold text-gray-900">{count} argumento{count !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${c.bg.replace('50', '400')}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}

interface CampanhaHorario {
  id: string; nome: string
  hora_inicio_atual: string; hora_fim_atual: string
  melhorFaixa: string; pctMelhor: number; totalLigs: number
  hora_inicio_rec: string | null; hora_fim_rec: string | null
}

function TabHorarios() {
  const queryClient = useQueryClient()
  const { data: analise, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['horarios-analise'],
    queryFn: () => inteligenciaApi.getHorariosAnalise().then(r => r.data as {
      total: number; melhorFaixa: string; atualizado: string;
      faixas: { label: string; total: number; sucesso: number; pct: number }[];
      porAgente: { nome: string; melhorFaixa: string; pctMelhor: number }[];
      porCampanha: CampanhaHorario[];
    }),
  })
  const [aplicando, setAplicando] = useState<string | null>(null)

  async function aplicarHorario(c: CampanhaHorario) {
    if (!c.hora_inicio_rec) return
    setAplicando(c.id)
    try {
      await campanhasApi.patch(c.id, { hora_inicio: c.hora_inicio_rec, hora_fim: c.hora_fim_rec })
      queryClient.invalidateQueries({ queryKey: ['campanhas'] })
      refetch()
    } catch { /* silencioso */ }
    finally { setAplicando(null) }
  }

  const faixas = analise?.faixas ?? []
  const porAgente = analise?.porAgente ?? []
  const porCampanha = analise?.porCampanha ?? []
  const melhorFaixa = analise?.melhorFaixa ?? 'â€”'
  const melhorPct = faixas.find(f => f.label === melhorFaixa)?.pct ?? 0
  const mediaPct = faixas.length > 0 ? (faixas.reduce((a, f) => a + f.pct, 0) / faixas.length).toFixed(1) : '0'
  const semDados = analise?.total === 0

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-100 rounded-xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center">
            <Clock size={18} className="text-brand-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">HorÃ¡rios Inteligentes</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              A IA analisa <span className="font-medium text-gray-700">todas as ligaÃ§Ãµes realizadas</span> e identifica os horÃ¡rios com maior taxa de conversÃ£o.
            </p>
          </div>
        </div>
        <button
          className="text-xs font-semibold px-4 py-2 rounded-lg bg-brand-600 text-white hover:bg-brand-700 flex items-center gap-1.5 transition-colors disabled:opacity-60"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          {isFetching ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          {isFetching ? 'Analisando...' : 'Reanalisar ligaÃ§Ãµes'}
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 gap-2 text-gray-400 text-sm">
          <Loader2 size={18} className="animate-spin" /> Analisando ligaÃ§Ãµes...
        </div>
      ) : semDados ? (
        <div className="bg-white border border-gray-100 rounded-xl p-10 text-center">
          <p className="text-gray-400 text-sm">Nenhuma ligaÃ§Ã£o registrada nos Ãºltimos 60 dias.</p>
          <p className="text-gray-300 text-xs mt-1">Os dados aparecerÃ£o automaticamente apÃ³s as primeiras ligaÃ§Ãµes.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-4">
            <KpiCard label="Melhor faixa de horÃ¡rio" value={melhorFaixa} accent="blue" />
            <KpiCard label="Taxa na faixa de ouro" value={`${melhorPct}%`} sub={`mÃ©dia geral: ${mediaPct}%`} accent="green" />
            <KpiCard label="Total ligaÃ§Ãµes analisadas" value={String(analise?.total ?? 0)} sub="Ãºltimos 60 dias" accent="purple" />
            <KpiCard label="Agentes analisados" value={String(porAgente.length)} accent="amber" />
          </div>

          {/* Faixas de horÃ¡rio â€” barras */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">ðŸ”¥ Taxa de conversÃ£o por faixa de horÃ¡rio</h3>
            <div className="flex gap-3 items-end h-40">
              {faixas.map((f, i) => {
                const cor = f.pct >= 20 ? 'bg-emerald-500' : f.pct >= 10 ? 'bg-blue-500' : f.pct >= 5 ? 'bg-amber-400' : 'bg-gray-200'
                const maxPct = Math.max(...faixas.map(x => x.pct), 1)
                const altura = Math.max(4, Math.round((f.pct / maxPct) * 100))
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-bold font-mono text-gray-700">{f.pct > 0 ? `${f.pct}%` : 'â€”'}</span>
                    <div className="w-full flex items-end" style={{ height: '80px' }}>
                      <div
                        className={`w-full rounded-t-lg transition-all ${cor}`}
                        style={{ height: `${altura}%` }}
                        title={`${f.total} ligaÃ§Ãµes Â· ${f.sucesso} conversÃµes`}
                      />
                    </div>
                    <span className="text-xs text-gray-500 text-center leading-tight">{f.label}</span>
                    <span className="text-[10px] text-gray-400">{f.total} lig.</span>
                  </div>
                )
              })}
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500 inline-block"/>â‰¥20%</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500 inline-block"/>10â€“20%</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-400 inline-block"/>5â€“10%</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-200 inline-block"/>&lt;5%</span>
            </div>
          </div>

          {/* SugestÃµes globais + por agente */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">ðŸ’¡ Ranking global de faixas</h3>
              <div className="space-y-2">
                {faixas
                  .filter(f => f.total > 0)
                  .sort((a, b) => b.pct - a.pct)
                  .slice(0, 3)
                  .map((f, i) => (
                    <div key={i} className={`flex items-center gap-2 p-2.5 rounded-lg border ${i === 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-100'}`}>
                      <span className="text-base">{i === 0 ? 'ðŸ¥‡' : i === 1 ? 'ðŸ¥ˆ' : 'ðŸ¥‰'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-800">{f.label}</p>
                        <p className="text-xs text-gray-500">{f.total} ligaÃ§Ãµes Â· {f.sucesso} conversÃµes</p>
                      </div>
                      <span className={`text-xs font-bold font-mono ${i === 0 ? 'text-emerald-600' : 'text-gray-600'}`}>{f.pct}%</span>
                    </div>
                  ))}
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Melhor horÃ¡rio por agente</h3>
              {porAgente.length === 0 ? (
                <p className="text-xs text-gray-400">Sem dados por agente ainda.</p>
              ) : (
                <div className="space-y-2">
                  {porAgente.map((a, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-2 border-b border-gray-50 last:border-0">
                      <span className="font-semibold text-gray-800">{a.nome}</span>
                      <div className="text-right">
                        <span className="font-mono text-gray-700">{a.melhorFaixa}</span>
                        {a.pctMelhor > 0 && <span className="ml-2 text-emerald-600 font-bold">{a.pctMelhor}%</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* â”€â”€ Por campanha â€” anÃ¡lise individual + aplicar â”€â”€ */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">ðŸŽ¯ Janela ideal por campanha</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Cada campanha tem um perfil diferente â€” aplique o horÃ¡rio recomendado individualmente.
                </p>
              </div>
            </div>
            {porCampanha.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">
                Dados aparecerÃ£o apÃ³s as primeiras ligaÃ§Ãµes por campanha.
              </p>
            ) : (
              <div className="space-y-2">
                {porCampanha.map((c) => {
                  const temRec = !!c.hora_inicio_rec
                  const jaAplicado = temRec && c.hora_inicio_atual === c.hora_inicio_rec
                  return (
                    <div key={c.id} className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100/60 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{c.nome}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {c.totalLigs} ligaÃ§Ãµes analisadas
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {/* Janela atual */}
                        <div className="text-right">
                          <p className="text-xs text-gray-400">Atual</p>
                          <p className="text-xs font-mono font-semibold text-gray-700">
                            {c.hora_inicio_atual}â€“{c.hora_fim_atual}
                          </p>
                        </div>
                        {/* RecomendaÃ§Ã£o */}
                        {temRec && (
                          <>
                            <span className="text-gray-300">â†’</span>
                            <div className="text-right">
                              <p className="text-xs text-emerald-600 font-medium">Recomendado</p>
                              <p className="text-xs font-mono font-bold text-emerald-700">
                                {c.hora_inicio_rec}â€“{c.hora_fim_rec}
                              </p>
                              <p className="text-xs text-gray-400">faixa {c.melhorFaixa} Â· {c.pctMelhor}%</p>
                            </div>
                          </>
                        )}
                        {/* BotÃ£o aplicar */}
                        {jaAplicado ? (
                          <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                            âœ… Aplicado
                          </span>
                        ) : temRec ? (
                          <button
                            onClick={() => aplicarHorario(c)}
                            disabled={aplicando === c.id}
                            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                          >
                            {aplicando === c.id ? <Loader2 size={11} className="animate-spin" /> : null}
                            Aplicar
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">Sem dados</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function TabConhecimento() {
  const queryClient = useQueryClient()
  const [format, setFormat] = useState<string>('livro')
  const [titulo, setTitulo] = useState('')
  const [categoria, setCategoria] = useState('')
  const [urlArtigo, setUrlArtigo] = useState('')
  const [urlVideo, setUrlVideo] = useState('')
  const [textoLivre, setTextoLivre] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfStatus, setPdfStatus] = useState<string | null>(null)
  const [audioFile, setAudioFile] = useState<File | null>(null)

  const cats = ['livro', 'artigo', 'video', 'audio', 'texto']
  const catLabel: Record<string, string> = { livro: 'Livro', artigo: 'Artigo', video: 'VÃ­deo', audio: 'Ãudio', texto: 'Texto livre' }

  const { data: conhecimentoRaw = [] } = useQuery({
    queryKey: ['inteligencia-conhecimento'],
    queryFn: () => api.get('/inteligencia/conhecimento').then(r => r.data as any[]),
  })
  const library: any[] = Array.isArray(conhecimentoRaw)
    ? conhecimentoRaw
    : (conhecimentoRaw as any)?.items ?? []

  // KPIs derivados dos dados reais
  const totalMateriais = library.length
  const totalInsights = library.reduce((s: number, b: any) => s + (b.argumentos?.length ?? 0) + (b.tecnicas?.length ?? 0), 0)
  const tiposUnicos = new Set(library.map((b: any) => b.tipo)).size
  const ultimoUpdate = library.length > 0
    ? new Date(library[0].criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    : 'â€”'

  // Ãšltimos insights extraÃ­dos dos materiais reais
  const ultimosInsights: string[] = library
    .slice(0, 5)
    .flatMap((b: any) => (b.argumentos ?? []).slice(0, 1) as string[])
    .slice(0, 3)

  const tipoIcon: Record<string, string> = {
    livro: 'ðŸ“˜', artigo: 'ðŸ“°', video: 'ðŸŽ¬', audio: 'ðŸŽ™ï¸', texto: 'ðŸ“',
  }

  // RecomendaÃ§Ãµes da plataforma ETZ (meta-conhecimento, sempre exibido)
  const recomendacoes = [
    { icon: 'ðŸ“˜', tipo: 'Livro', titulo: 'Vendas consultivas', exemplo: 'SPIN Selling, The Challenger Sale', impacto: '+22%' },
    { icon: 'ðŸŽ¬', tipo: 'VÃ­deo', titulo: 'Contorno de objeÃ§Ãµes', exemplo: 'ObjeÃ§Ã£o de preÃ§o e concorrÃªncia', impacto: '+17%' },
    { icon: 'ðŸ“„', tipo: 'Texto', titulo: 'Scripts de qualificaÃ§Ã£o', exemplo: 'Frameworks BANT / MEDDIC', impacto: '+14%' },
    { icon: 'ðŸ“°', tipo: 'Artigo', titulo: 'TendÃªncias do setor', exemplo: 'Dados e relatÃ³rios do mercado-alvo', impacto: '+11%' },
    { icon: 'ðŸŽ™ï¸', tipo: 'Ãudio', titulo: 'Calls de vendas reais', exemplo: 'TranscriÃ§Ãµes de calls com Ãªxito', impacto: '+9%' },
  ]

  async function adicionar() {
    if (!titulo || !categoria) { setFeedback('âŒ Preencha tÃ­tulo e categoria'); return }
    // Para vÃ­deo: URL ou texto sÃ£o suficientes (sistema transcreve automaticamente)
    if (format === 'video' && !urlVideo && !textoLivre) { setFeedback('âŒ Informe a URL do YouTube ou cole um resumo'); return }
    setSalvando(true); setFeedback(null)
    try {
      const token = localStorage.getItem('youagent_jwt')

      // PDF: envia como multipart/form-data
      if (format === 'livro' && pdfFile) {
        const formData = new FormData()
        formData.append('arquivo', pdfFile)
        formData.append('titulo', titulo)
        formData.append('categoria', categoria)
        const resp = await fetch('https://app.etztech.com/api/v1/inteligencia/conhecimento/upload-pdf', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        })
        if (!resp.ok) { const err = await resp.json(); throw new Error(err.error || 'Erro no upload') }
        const saved = await resp.json()
        queryClient.invalidateQueries({ queryKey: ['inteligencia-conhecimento'] })
        setTitulo(''); setCategoria(''); setPdfFile(null); setPdfStatus(null); setTextoLivre('')
        setFeedback(`âœ… PDF processado! ${saved.paginas_lidas} pÃ¡gina(s) lidas, ${(saved.argumentos?.length ?? 0) + (saved.tecnicas?.length ?? 0)} insights extraÃ­dos.`)

      // Ãudio: envia como multipart/form-data para transcriÃ§Ã£o com Groq Whisper
      } else if (format === 'audio' && audioFile) {
        const formData = new FormData()
        formData.append('arquivo', audioFile)
        formData.append('titulo', titulo)
        formData.append('categoria', categoria)
        const resp = await fetch('https://app.etztech.com/api/v1/inteligencia/conhecimento/upload-audio', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        })
        if (!resp.ok) { const err = await resp.json(); throw new Error(err.error || 'Erro no upload') }
        const saved = await resp.json()
        queryClient.invalidateQueries({ queryKey: ['inteligencia-conhecimento'] })
        setTitulo(''); setCategoria(''); setAudioFile(null); setTextoLivre('')
        setFeedback(`âœ… Ãudio transcrito e processado! ${saved.chars_transcritos?.toLocaleString() ?? 0} caracteres transcritos, ${(saved.argumentos?.length ?? 0) + (saved.tecnicas?.length ?? 0)} insights extraÃ­dos.`)

      } else {
        // Texto / URL / outros (inclui Ã¡udio com texto colado)
        const conteudo = textoLivre || urlArtigo || urlVideo || `Material do tipo ${format}: ${titulo}`
        await api.post('/inteligencia/conhecimento', {
          titulo, tipo: format, categoria,
          conteudo_texto: conteudo,
          url: urlArtigo || urlVideo || undefined,
        })
        queryClient.invalidateQueries({ queryKey: ['inteligencia-conhecimento'] })
        setTitulo(''); setCategoria(''); setUrlArtigo(''); setUrlVideo(''); setTextoLivre('')
        setFeedback('âœ… Material processado pela IA e adicionado Ã  base!')
      }
      setTimeout(() => setFeedback(null), 6000)
    } catch (e: unknown) {
      setFeedback('âŒ Erro: ' + (e as Error).message)
    } finally {
      setSalvando(false)
    }
  }

  async function remover(id: string) {
    try {
      await api.delete(`/inteligencia/conhecimento/${id}`)
      queryClient.invalidateQueries({ queryKey: ['inteligencia-conhecimento'] })
    } catch { /* silencioso */ }
  }

  return (
    <div className="space-y-4">

      {/* Header explicativo */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center">
            <BookOpen size={18} className="text-brand-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Base de Conhecimento</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Alimente seus agentes com <span className="font-medium text-gray-700">livros, artigos, vÃ­deos e scripts</span>. A IA processa cada material e o agente se torna especialista em argumentaÃ§Ã£o e contorno de objeÃ§Ãµes do seu segmento.
            </p>
          </div>
        </div>
        <span className="text-xs bg-brand-50 text-brand-700 border border-brand-100 px-2.5 py-1 rounded-full font-semibold flex-shrink-0">
          {totalMateriais} material{totalMateriais !== 1 ? 'is' : ''}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">

        {/* â”€â”€ Coluna esquerda: formulÃ¡rio â”€â”€ */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Adicionar conhecimento</h3>

          {/* Tipo de material */}
          <div className="flex gap-1 mb-4">
            {cats.map(f => (
              <button key={f} onClick={() => setFormat(f)}
                className={`flex-1 text-xs py-1.5 rounded-lg transition-colors font-medium ${format === f ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {catLabel[f]}
              </button>
            ))}
          </div>

          <div className="space-y-2 mb-3">
            <input value={titulo} onChange={e => setTitulo(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400"
              placeholder="TÃ­tulo do material" />
            <select value={categoria} onChange={e => setCategoria(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-200">
              <option value="">Categoria</option>
              <option>Vendas e PersuasÃ£o</option>
              <option>Setor Industrial</option>
              <option>Tecnologia</option>
              <option>NegociaÃ§Ã£o</option>
              <option>Comportamento do comprador</option>
              <option>ConcorrÃªncia</option>
              <option>Cases e ReferÃªncias</option>
              <option>Compliance e LGPD</option>
              <option>Outra</option>
            </select>

            {format === 'livro' && (
              <label className={`cursor-pointer block border-2 border-dashed rounded-xl p-4 text-center transition-colors
                ${pdfFile ? 'border-emerald-300 bg-emerald-50' : 'border-brand-200 bg-brand-50 hover:border-brand-400 hover:bg-brand-100/60'}`}>
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0] ?? null
                    setPdfFile(f)
                    setPdfStatus(f ? f.name : null)
                    // limpa textarea se escolheu PDF
                    if (f) setTextoLivre('')
                  }}
                />
                {pdfFile ? (
                  <>
                    <div className="text-2xl mb-1">ðŸ“„</div>
                    <p className="text-xs text-emerald-700 font-semibold truncate max-w-full">{pdfStatus}</p>
                    <p className="text-[10px] text-emerald-500 mt-0.5">
                      {(pdfFile.size / 1024).toFixed(0)} KB Â· clique para trocar
                    </p>
                  </>
                ) : (
                  <>
                    <Upload size={18} className="mx-auto text-brand-400 mb-1" />
                    <p className="text-xs text-brand-600 font-semibold">Clique para selecionar um PDF</p>
                    <p className="text-[10px] text-brand-400 mt-0.5">ou cole trechos no campo abaixo</p>
                  </>
                )}
              </label>
            )}
            {format === 'artigo' && (
              <div className="space-y-2">
                <input value={urlArtigo} onChange={e => setUrlArtigo(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-200"
                  placeholder="URL do artigo (ex: https://...)" />
                <p className="text-[10px] text-gray-400">Cole o texto do artigo abaixo para melhores resultados:</p>
              </div>
            )}
            {format === 'video' && (
              <div className="space-y-2">
                <div className="relative">
                  <input value={urlVideo} onChange={e => setUrlVideo(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-200 pr-28"
                    placeholder="URL do YouTube (ex: youtube.com/watch?v=...)" />
                  {urlVideo && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">
                      âœ“ Auto-transcriÃ§Ã£o
                    </span>
                  )}
                </div>
                <div className="flex items-start gap-1.5 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  <span className="text-emerald-500 text-sm mt-0.5">ðŸ¤–</span>
                  <p className="text-[11px] text-emerald-700 leading-relaxed">
                    <span className="font-semibold">TranscriÃ§Ã£o automÃ¡tica:</span> cole a URL e o sistema extrai e processa o conteÃºdo do vÃ­deo automaticamente. O campo abaixo Ã© opcional â€” use para adicionar contexto extra.
                  </p>
                </div>
              </div>
            )}
            {format === 'audio' && (
              <div className="space-y-2">
                <label className={`cursor-pointer block border-2 border-dashed rounded-xl p-4 text-center transition-colors
                  ${audioFile ? 'border-purple-300 bg-purple-50' : 'border-purple-200 bg-purple-50 hover:border-purple-400'}`}>
                  <input type="file" accept=".mp3,.mp4,.wav,.m4a,.ogg,.webm" className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0] ?? null
                      setAudioFile(f)
                      if (f) setTextoLivre('')
                    }} />
                  {audioFile ? (
                    <>
                      <div className="text-2xl mb-1">ðŸŽ™ï¸</div>
                      <p className="text-xs text-purple-700 font-semibold truncate">{audioFile.name}</p>
                      <p className="text-[10px] text-purple-500 mt-0.5">{(audioFile.size / (1024 * 1024)).toFixed(1)} MB Â· clique para trocar</p>
                    </>
                  ) : (
                    <>
                      <Upload size={18} className="mx-auto text-purple-400 mb-1" />
                      <p className="text-xs text-purple-600 font-semibold">Clique para selecionar Ã¡udio</p>
                      <p className="text-[10px] text-purple-400 mt-0.5">MP3, MP4, WAV, M4A Â· atÃ© 25 MB</p>
                    </>
                  )}
                </label>
                <div className="flex items-start gap-1.5 bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
                  <span className="text-purple-500 text-sm mt-0.5">ðŸ¤–</span>
                  <p className="text-[11px] text-purple-700 leading-relaxed">
                    <span className="font-semibold">TranscriÃ§Ã£o automÃ¡tica com Whisper:</span> o sistema converte o Ã¡udio em texto e extrai argumentos, tÃ©cnicas e objeÃ§Ãµes automaticamente. Ou cole a transcriÃ§Ã£o no campo abaixo.
                  </p>
                </div>
              </div>
            )}

            {/* Textarea â€” obrigatÃ³rio para todos exceto vÃ­deo (que tem auto-transcriÃ§Ã£o) */}
            <textarea rows={format === 'texto' ? 5 : 3}
              value={textoLivre} onChange={e => setTextoLivre(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-200 resize-none"
              placeholder={
                format === 'livro' ? 'Cole trechos do livro aqui â€” capÃ­tulos, frases-chave, argumentos...'
                : format === 'artigo' ? 'Cole o texto do artigo aqui...'
                : format === 'video' ? 'Contexto extra (opcional) â€” pontos principais, resumo...'
                : format === 'audio' ? 'TranscriÃ§Ã£o ou pontos principais do Ã¡udio...'
                : 'Cole ou digite o conteÃºdo aqui...'
              }
            />
          </div>


          {feedback && (
            <div className={`text-xs px-3 py-2 rounded-lg mb-2 ${feedback.startsWith('âœ…') ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
              {feedback}
            </div>
          )}

          <button disabled={salvando} onClick={adicionar}
            className="w-full bg-brand-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {salvando
              ? <><Loader2 size={14} className="animate-spin" /> Processando com IA...</>
              : 'Adicionar Ã  base'}
          </button>
        </div>

        {/* â”€â”€ Coluna direita: KPIs + biblioteca + recomendaÃ§Ãµes â”€â”€ */}
        <div className="space-y-4">

          {/* KPIs reais */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Materiais', value: String(totalMateriais) },
              { label: 'Insights extraÃ­dos', value: String(totalInsights) },
              { label: 'Tipos diferentes', value: String(tiposUnicos) },
              { label: 'Ãšltimo update', value: ultimoUpdate },
            ].map((k, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-3 text-center">
                <p className="text-base font-mono font-bold text-gray-900">{k.value}</p>
                <p className="text-xs text-gray-500">{k.label}</p>
              </div>
            ))}
          </div>

          {/* Biblioteca */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Biblioteca</h3>
            {library.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">Nenhum material cadastrado ainda.<br /><span className="text-gray-300">Adicione o primeiro Ã  esquerda.</span></p>
            ) : (
              <div className="space-y-2 max-h-[480px] overflow-y-auto">
                {library.map((b: any) => {
                  const totalInsightsMat = (b.argumentos?.length ?? 0) + (b.tecnicas?.length ?? 0) + (b.objecoes?.length ?? 0)
                  const dataFormatada = b.created_at ? new Date(b.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : 'â€”'
                  return (
                    <details key={b.id} className="border border-gray-100 rounded-lg group">
                      <summary className="flex items-center gap-3 p-2 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors list-none">
                        <div className="w-8 h-8 rounded flex items-center justify-center text-lg shrink-0 bg-brand-50">
                          {tipoIcon[b.tipo] ?? 'ðŸ“„'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">{b.titulo}</p>
                          <p className="text-xs text-gray-400">{b.tipo} Â· <span className="text-brand-600 font-medium">{totalInsightsMat} insights</span> Â· {dataFormatada}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {b.aprovado
                            ? <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-medium">ativo</span>
                            : <span className="text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded font-medium">revisÃ£o</span>
                          }
                          <button onClick={e => { e.preventDefault(); remover(b.id) }} className="text-gray-300 hover:text-red-400 transition-colors">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </summary>
                      {/* ExpansÃ£o: insights extraÃ­dos */}
                      <div className="px-3 pb-3 pt-1 border-t border-gray-50 space-y-2">
                        {b.conteudo_resumo && (
                          <div className="bg-brand-50 rounded-lg p-2">
                            <p className="text-[10px] font-semibold text-brand-600 mb-0.5">ðŸ“‹ Resumo do aprendizado</p>
                            <p className="text-xs text-gray-700">{b.conteudo_resumo}</p>
                          </div>
                        )}
                        {b.argumentos?.length > 0 && (
                          <div>
                            <p className="text-[10px] font-semibold text-emerald-600 mb-1">ðŸ’¬ Argumentos de venda ({b.argumentos.length})</p>
                            <ul className="space-y-0.5">
                              {b.argumentos.map((a: string, i: number) => (
                                <li key={i} className="text-xs text-gray-600 flex gap-1.5"><span className="text-emerald-400 shrink-0">â€¢</span>{a}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {b.tecnicas?.length > 0 && (
                          <div>
                            <p className="text-[10px] font-semibold text-blue-600 mb-1">âš¡ TÃ©cnicas ({b.tecnicas.length})</p>
                            <ul className="space-y-0.5">
                              {b.tecnicas.map((t: string, i: number) => (
                                <li key={i} className="text-xs text-gray-600 flex gap-1.5"><span className="text-blue-400 shrink-0">â€¢</span>{t}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {b.objecoes?.length > 0 && (
                          <div>
                            <p className="text-[10px] font-semibold text-amber-600 mb-1">ðŸ›¡ï¸ ObjeÃ§Ãµes ({b.objecoes.length})</p>
                            <ul className="space-y-1">
                              {b.objecoes.map((o: any, i: number) => (
                                <li key={i} className="text-xs bg-amber-50 rounded p-1.5">
                                  <span className="font-medium text-amber-700">"{o.objecao}"</span>
                                  {o.resposta && <span className="text-gray-600"> â†’ {o.resposta}</span>}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </details>
                  )
                })}
              </div>
            )}
          </div>

          {/* Ãšltimos insights reais (sÃ³ aparece se houver materiais) */}
          {ultimosInsights.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Ãšltimos insights extraÃ­dos</h3>
              <div className="space-y-1.5">
                {ultimosInsights.map((ins, i) => (
                  <div key={i} className="flex gap-2 text-xs">
                    <Zap size={11} className="text-amber-400 mt-0.5 shrink-0" />
                    <span className="text-gray-600 italic">"{ins}"</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Card RecomendaÃ§Ãµes ETZ */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={14} className="text-brand-500" />
              <h3 className="text-sm font-semibold text-gray-900">O que funciona na plataforma ETZ</h3>
            </div>
            <p className="text-[10px] text-gray-400 mb-3">
              Baseado em todos os clientes ETZ ativos â€” tipos de material com maior impacto em conversÃ£o de agendamentos
            </p>
            <div className="space-y-2">
              {recomendacoes.map((r, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 border border-gray-100 hover:bg-brand-50/40 hover:border-brand-100 transition-colors cursor-default">
                  <span className="text-base">{r.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800">{r.tipo} Â· {r.titulo}</p>
                    <p className="text-[10px] text-gray-400 truncate">{r.exemplo}</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 font-mono flex-shrink-0">{r.impacto}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-300 mt-3 text-center">
              Clientes com 5+ materiais tÃªm 2.4Ã— mais conversÃ£o
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}

function TabBanco() {
  const queryClient = useQueryClient()
  const { data: bancoData, isLoading } = useQuery({
    queryKey: ['inteligencia-banco'],
    queryFn: () => api.get('https://app.etztech.com/api/v1/inteligencia/banco').then(r => r.data as any),
  })
  const argumentos: any[] = bancoData?.argumentos ?? []
  const total: number = bancoData?.total ?? 0
  const expirando7d: number = bancoData?.expirando7d ?? 0

  // Modos de entrada: manual ou URL
  const [modo, setModo] = useState<'manual' | 'url'>('manual')
  const [novoArg, setNovoArg] = useState({ categoria: '', descricao: '', validade: '', fonte: '' })
  const [urlNoticia, setUrlNoticia] = useState('')
  const [extraindo, setExtraindo] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erroSalvar, setErroSalvar] = useState('')
  const [deletando, setDeletando] = useState<string | null>(null)
  // Resultado de extraÃ§Ã£o URL â€” mÃºltiplos argumentos
  const [extraidos, setExtraidos] = useState<{descricao:string,categoria:string,selecionado:boolean}[]>([])
  const [fonteExtraida, setFonteExtraida] = useState('')
  const [validadeExtraida, setValidadeExtraida] = useState('')
  const [salvandoExtraidos, setSalvandoExtraidos] = useState(false)

  async function handleExtrairUrl() {
    if (!urlNoticia.trim()) { setErroSalvar('Cole a URL da notÃ­cia'); return }
    setExtraindo(true)
    setErroSalvar('')
    setExtraidos([])
    try {
      const r = await api.post('https://app.etztech.com/api/v1/inteligencia/banco/extrair-url', { url: urlNoticia })
      const ext = r.data
      // Novo formato: array de argumentos
      if (ext.argumentos && ext.argumentos.length > 0) {
        setExtraidos(ext.argumentos.map((a: any) => ({ ...a, selecionado: true })))
        setFonteExtraida(ext.fonte || new URL(urlNoticia).hostname.replace('www.', ''))
      } else if (ext.descricao) {
        // fallback formato antigo
        setExtraidos([{ descricao: ext.descricao, categoria: ext.categoria || '', selecionado: true }])
        setFonteExtraida(ext.fonte || '')
      }
    } catch (e: any) {
      setErroSalvar(e?.response?.data?.error || 'NÃ£o foi possÃ­vel ler a URL')
    } finally {
      setExtraindo(false)
    }
  }

  async function handleSalvarExtraidos() {
    const selecionados = extraidos.filter(a => a.selecionado)
    if (selecionados.length === 0) { setErroSalvar('Selecione pelo menos um argumento'); return }
    setSalvandoExtraidos(true)
    setErroSalvar('')
    try {
      await Promise.all(selecionados.map(a =>
        api.post('https://app.etztech.com/api/v1/inteligencia/banco', {
          categoria: a.categoria,
          descricao: a.descricao,
          fonte: fonteExtraida,
          validade: validadeExtraida || '',
        })
      ))
      setExtraidos([])
      setUrlNoticia('')
      setFonteExtraida('')
      setValidadeExtraida('')
      queryClient.invalidateQueries({ queryKey: ['inteligencia-banco'] })
    } catch (e: any) {
      setErroSalvar(e?.response?.data?.error || 'Erro ao salvar')
    } finally {
      setSalvandoExtraidos(false)
    }
  }

  async function handleAdicionar() {
    if (!novoArg.categoria || !novoArg.descricao.trim()) {
      setErroSalvar('Preencha categoria e descriÃ§Ã£o')
      return
    }
    setSalvando(true)
    setErroSalvar('')
    try {
      await api.post('https://app.etztech.com/api/v1/inteligencia/banco', novoArg)
      setNovoArg({ categoria: '', descricao: '', validade: '', fonte: '' })
      setUrlNoticia('')
      queryClient.invalidateQueries({ queryKey: ['inteligencia-banco'] })
    } catch (e: any) {
      setErroSalvar(e?.response?.data?.error || 'Erro ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  async function handleDeletar(id: string) {
    setDeletando(id)
    try {
      await api.delete(`https://app.etztech.com/api/v1/inteligencia/banco/${id}`)
      queryClient.invalidateQueries({ queryKey: ['inteligencia-banco'] })
    } catch { /* silencioso */ }
    finally { setDeletando(null) }
  }

  function formatExpira(expira_em: string | null) {
    if (!expira_em) return null
    const diff = Math.ceil((new Date(expira_em).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (diff <= 0) return { label: 'Expirado', color: 'bg-red-50 text-red-600' }
    if (diff <= 7) return { label: `Expira em ${diff}d`, color: 'bg-amber-50 text-amber-700' }
    return { label: `VÃ¡lido por ${diff}d`, color: 'bg-green-50 text-green-700' }
  }

  return (
    <div className="space-y-4">

      {/* Header â€” mesmo padrÃ£o das outras abas */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
            <Database size={18} className="text-brand-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Banco de Argumentos</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Alimente seus agentes com <span className="font-medium text-gray-700">notÃ­cias, dados de mercado e insights</span>. A IA injeta automaticamente em cada ligaÃ§Ã£o â€” sem sincronizaÃ§Ã£o manual.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {expirando7d > 0 && (
            <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full font-semibold">
              {expirando7d} expirando
            </span>
          )}
          <span className="text-xs bg-brand-50 text-brand-700 border border-brand-100 px-2.5 py-1 rounded-full font-semibold">
            {isLoading ? 'â€¦' : total} argumento{total !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Card explicativo */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
            <Zap size={12} className="text-brand-600" />
          </div>
          <p className="text-sm font-semibold text-gray-900">Como o Banco de Argumentos funciona</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: 'ðŸ“°', titulo: 'NotÃ­cias e tendÃªncias', desc: 'Cole a URL de uma notÃ­cia relevante â€” a IA lÃª, extrai o insight e salva automaticamente' },
            { icon: 'âš¡', titulo: 'InjeÃ§Ã£o automÃ¡tica', desc: 'Cada argumento entra na prÃ³xima ligaÃ§Ã£o sem clicar em nada â€” o agente jÃ¡ usa' },
            { icon: 'ðŸŽ¯', titulo: 'Contextual e preciso', desc: 'O agente cita o dado somente quando o contexto da conversa for compatÃ­vel' },
            { icon: 'â°', titulo: 'Validade inteligente', desc: 'Configure expiraÃ§Ã£o para dados temporÃ¡rios â€” notÃ­cias sazonais, promoÃ§Ãµes, etc.' },
          ].map((c, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-base mt-0.5">{c.icon}</span>
              <div>
                <p className="text-xs font-semibold text-gray-800">{c.titulo}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{c.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FormulÃ¡rio com abas Manual / URL */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Adicionar inteligÃªncia de mercado</h3>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
            <button
              onClick={() => setModo('manual')}
              className={`px-3 py-1.5 font-medium transition-colors ${modo === 'manual' ? 'bg-brand-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
            >
              âœï¸ Manual
            </button>
            <button
              onClick={() => setModo('url')}
              className={`px-3 py-1.5 font-medium transition-colors ${modo === 'url' ? 'bg-brand-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
            >
              ðŸ”— URL de notÃ­cia
            </button>
          </div>
        </div>

        {/* Modo URL */}
        {modo === 'url' && (
          <div className="space-y-3">
            <div className="flex items-start gap-1.5 bg-brand-50 border border-brand-100 rounded-lg px-3 py-2">
              <span className="text-brand-500 text-sm mt-0.5">ðŸ¤–</span>
              <p className="text-[11px] text-brand-700 leading-relaxed">
                <span className="font-semibold">ExtraÃ§Ã£o automÃ¡tica:</span> cole a URL de qualquer notÃ­cia, artigo ou relatÃ³rio. A IA lÃª o conteÃºdo e extrai todos os argumentos relevantes para as ligaÃ§Ãµes.
              </p>
            </div>
            <div className="flex gap-2">
              <input
                value={urlNoticia}
                onChange={e => { setUrlNoticia(e.target.value); setExtraidos([]) }}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400"
                placeholder="https://g1.globo.com/economia/noticia/..."
                type="url"
              />
              <button
                onClick={handleExtrairUrl}
                disabled={extraindo}
                className="bg-brand-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50 flex items-center gap-2 shrink-0"
              >
                {extraindo ? <><Loader2 size={13} className="animate-spin" />Lendo...</> : <><Brain size={13} />Extrair</>}
              </button>
            </div>

            {/* Resultados da extraÃ§Ã£o */}
            {extraidos.length > 0 && (
              <div className="border border-emerald-200 rounded-xl p-3 space-y-3 bg-emerald-50/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle size={13} className="text-emerald-600" />
                    <p className="text-xs font-semibold text-emerald-700">{extraidos.length} argumentos extraÃ­dos de <span className="text-emerald-800">{fonteExtraida}</span></p>
                  </div>
                  <p className="text-[10px] text-gray-400">Desmarque os que nÃ£o quer salvar</p>
                </div>
                <div className="space-y-2">
                  {extraidos.map((a, i) => (
                    <div
                      key={i}
                      onClick={() => setExtraidos(prev => prev.map((x, j) => j === i ? { ...x, selecionado: !x.selecionado } : x))}
                      className={`flex gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${a.selecionado ? 'bg-white border-emerald-200' : 'bg-gray-50 border-gray-100 opacity-50'}`}
                    >
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${a.selecionado ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}`}>
                        {a.selecionado && <CheckCircle size={10} className="text-white" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-800 leading-relaxed">{a.descricao}</p>
                        <span className="mt-1 inline-block bg-brand-50 text-brand-700 text-[10px] px-1.5 py-0.5 rounded font-medium">{a.categoria}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[10px] text-gray-400 font-medium px-1">Por quantos dias Ã© vÃ¡lido?</label>
                    <input
                      value={validadeExtraida}
                      onChange={e => setValidadeExtraida(e.target.value)}
                      className="w-36 border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-brand-200"
                      placeholder="Ex: 30 dias"
                      type="number" min="1"
                    />
                  </div>
                  <button
                    onClick={handleSalvarExtraidos}
                    disabled={salvandoExtraidos || extraidos.filter(a => a.selecionado).length === 0}
                    className="flex-1 bg-brand-600 text-white rounded-lg py-1.5 text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {salvandoExtraidos
                      ? <><Loader2 size={13} className="animate-spin" />Salvando...</>
                      : <><Zap size={13} />Salvar {extraidos.filter(a => a.selecionado).length} argumento{extraidos.filter(a => a.selecionado).length !== 1 ? 's' : ''}</>
                    }
                  </button>
                </div>
              </div>
            )}
            {erroSalvar && <p className="text-xs text-red-500">{erroSalvar}</p>}
          </div>
        )}

        {/* Modo Manual (tambÃ©m exibido apÃ³s extraÃ§Ã£o de URL para revisÃ£o) */}
        {modo === 'manual' && (
          <div className="space-y-2">
            {novoArg.descricao && novoArg.fonte && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 flex items-center gap-2">
                <CheckCircle size={13} className="text-emerald-600 shrink-0" />
                <p className="text-xs text-emerald-700">ConteÃºdo extraÃ­do da URL. Revise e ajuste antes de salvar.</p>
              </div>
            )}
            <select
              value={novoArg.categoria}
              onChange={e => setNovoArg(p => ({ ...p, categoria: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="">Categoria do argumento</option>
              <option>Economia e custos</option>
              <option>TendÃªncia de mercado</option>
              <option>Dado setorial</option>
              <option>Contexto polÃ­tico/regulatÃ³rio</option>
              <option>Tecnologia</option>
              <option>Case / ReferÃªncia</option>
              <option>Concorrente</option>
            </select>
            <textarea
              rows={3}
              value={novoArg.descricao}
              onChange={e => setNovoArg(p => ({ ...p, descricao: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200 resize-none"
              placeholder="Descreva o argumento ou insight de mercado que o agente deve usar em ligaÃ§Ãµes..."
            />
            <div className="flex gap-2">
              <div className="flex-1 flex flex-col gap-1">
                <label className="text-[10px] text-gray-400 font-medium px-0.5">Por quantos dias Ã© vÃ¡lido? <span className="text-gray-300">(vazio = sem expiraÃ§Ã£o)</span></label>
                <input
                  value={novoArg.validade}
                  onChange={e => setNovoArg(p => ({ ...p, validade: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-200"
                  placeholder="Ex: 30"
                  type="number"
                  min="1"
                />
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <label className="text-[10px] text-gray-400 font-medium px-0.5">Fonte</label>
                <input
                  value={novoArg.fonte}
                  onChange={e => setNovoArg(p => ({ ...p, fonte: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-200"
                  placeholder="Ex: IBGE, G1, Interno"
                />
              </div>
            </div>
            {erroSalvar && <p className="text-xs text-red-500">{erroSalvar}</p>}
            <button
              className="w-full bg-brand-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              onClick={handleAdicionar}
              disabled={salvando}
            >
              {salvando ? <><Loader2 size={14} className="animate-spin" />Salvando...</> : <><Zap size={14} />Adicionar ao banco</>}
            </button>
          </div>
        )}
      </div>

      {/* Lista */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">InteligÃªncias cadastradas</h3>
          {total > 0 && (
            <span className="text-xs text-gray-400">{total} ativo{total > 1 ? 's' : ''}</span>
          )}
        </div>
        {isLoading && <p className="text-xs text-gray-400 text-center py-6">Carregando...</p>}
        {!isLoading && argumentos.length === 0 && (
          <div className="text-center py-6">
            <Database size={28} className="text-gray-200 mx-auto mb-2" />
            <p className="text-xs text-gray-400">Nenhum argumento ainda.</p>
            <p className="text-xs text-gray-400 mt-0.5">Cole uma URL de notÃ­cia ou escreva um insight manualmente.</p>
          </div>
        )}
        <div className="space-y-2">
          {argumentos.map((item: any) => {
            const expInfo = formatExpira(item.expira_em)
            return (
              <div key={item.id} className="border border-gray-100 rounded-lg p-3 hover:border-gray-200 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-xs font-medium text-gray-800 flex-1 leading-relaxed">{item.descricao}</p>
                  <button
                    onClick={() => handleDeletar(item.id)}
                    disabled={deletando === item.id}
                    className="text-gray-300 hover:text-red-400 transition-colors shrink-0 mt-0.5"
                  >
                    {deletando === item.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  </button>
                </div>
                <div className="flex gap-1.5 flex-wrap items-center">
                  <span className="bg-brand-50 text-brand-700 text-[10px] px-1.5 py-0.5 rounded font-medium">{item.categoria}</span>
                  {item.fonte && <span className="bg-gray-100 text-gray-500 text-[10px] px-1.5 py-0.5 rounded">ðŸ“° {item.fonte}</span>}
                  {expInfo
                    ? <span className={`text-[10px] px-1.5 py-0.5 rounded ${expInfo.color}`}>{expInfo.label}</span>
                    : <span className="bg-gray-50 text-gray-400 text-[10px] px-1.5 py-0.5 rounded">Sem expiraÃ§Ã£o</span>
                  }
                  <span className="ml-auto flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                    <CheckCircle size={10} className="text-emerald-500" />
                    Ativo nos agentes
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function TabMetricas({ onNavigate }: { onNavigate?: (tab: TabId) => void }) {
  const { data: ligacoesRaw = [] } = useQuery({
    queryKey: ['metricas-ligacoes-count'],
    queryFn: () => api.get('https://app.etztech.com/api/v1/ligacoes').then(r => r.data as any[]).catch(() => []),
  })
  const { data: conhecimentoData = [] } = useQuery({
    queryKey: ['metricas-conhecimento'],
    queryFn: () => api.get('https://app.etztech.com/api/v1/inteligencia/conhecimento').then(r => r.data as any[]).catch(() => []),
  })
  const { data: bancoData } = useQuery({
    queryKey: ['metricas-banco'],
    queryFn: () => api.get('https://app.etztech.com/api/v1/inteligencia/banco').then(r => r.data as any).catch(() => ({ total: 0, argumentos: [] })),
  })
  const { data: agentesData = [] } = useQuery({
    queryKey: ['metricas-agentes'],
    queryFn: () => api.get('https://app.etztech.com/api/v1/agentes').then(r => r.data as any[]).catch(() => []),
  })

  const totalLigacoes: number = ligacoesRaw.length
  const totalMateriais: number = Array.isArray(conhecimentoData) ? conhecimentoData.length : 0
  const totalInsights: number = Array.isArray(conhecimentoData)
    ? conhecimentoData.reduce((s: number, m: any) => s + (m.argumentos?.length ?? 0) + (m.tecnicas?.length ?? 0), 0)
    : 0
  const totalBanco: number = bancoData?.total ?? 0
  const temDados = totalLigacoes > 0

  // Data de setup = created_at do primeiro agente
  const primeiroAgente = Array.isArray(agentesData) && agentesData.length > 0
    ? agentesData.slice().sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0]
    : null
  const dataSetup = primeiroAgente?.created_at
    ? new Date(primeiroAgente.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : null

  const GATILHOS = [
    { label: 'UrgÃªncia ou prazo', pct: 82, color: 'bg-emerald-500', status: 'â†‘ Aumentar', statusColor: 'bg-blue-50 text-blue-700' },
    { label: 'Pede humano', pct: 91, color: 'bg-emerald-500', status: 'Ã“timo', statusColor: 'bg-emerald-50 text-emerald-700' },
    { label: 'Pergunta preÃ§o', pct: 74, color: 'bg-blue-500', status: 'OK', statusColor: 'bg-gray-100 text-gray-600' },
    { label: 'Pede proposta', pct: 68, color: 'bg-blue-500', status: 'OK', statusColor: 'bg-gray-100 text-gray-600' },
    { label: 'Menciona concorrente', pct: 43, color: 'bg-amber-400', status: 'âš  Revisar', statusColor: 'bg-amber-50 text-amber-700' },
  ]

  const TOP_ARGS = [
    { label: 'Resposta a "nÃ£o tenho orÃ§amento"', usos: 312, pct: 74 },
    { label: 'Resposta a "jÃ¡ temos fornecedor"', usos: 287, pct: 68 },
    { label: 'Argumento custo do SDR', usos: 198, pct: 63 },
    { label: 'Case da construtora SP', usos: 156, pct: 61 },
    { label: 'Resposta a "me manda por email"', usos: 134, pct: 61 },
  ]

  const ARGS_APRENDIDOS = [
    { tag: 'NÃ£o tenho orÃ§amento', segmento: 'Todos os ramos', usos: 312, data: '03/04', frase: '"Faz sentido ser criterioso. Por isso nosso modelo Ã© por resultado â€” uma reuniÃ£o fechada jÃ¡ paga vÃ¡rios meses do investimento. Posso te mostrar em 20 minutos como funciona?"', pct: 74 },
    { tag: 'JÃ¡ temos fornecedor', segmento: 'Tecnologia, IndÃºstria', usos: 287, data: '08/04', frase: '"Entendo! A maioria dos nossos clientes tambÃ©m tinha. A diferenÃ§a Ã© que nos complementamos o que vocÃªs jÃ¡ tÃªm e reduzimos custo. Vale uma conversa rÃ¡pida de 20 minutos?"', pct: 68 },
    { tag: 'Me manda por e-mail', segmento: 'Todos os ramos', usos: 198, data: '12/04', frase: '"Claro! Antes de enviar, me fala: qual o maior desafio da sua equipe de vendas hoje com agendamentos? Isso me ajuda a personalizar o material para o perfil de vocÃªs."', pct: 61 },
    { tag: 'NÃ£o Ã© o momento', segmento: 'AgronegÃ³cio, IndÃºstria', usos: 156, data: '20/04', frase: '"Faz sentido planejar. Por isso mesmo Ã© importante a gente conversar agora â€” para quando chegar a safra vocÃªs jÃ¡ estarem rodando com os agentes treinados."', pct: 58 },
  ]

  const ARGS_VALIDACAO = [
    { tag: 'JÃ¡ usamos IA', segmento: 'Tecnologia', usos: 12, data: '04/05', frase: '"Ã“timo! VocÃªs jÃ¡ estÃ£o na direÃ§Ã£o certa. A diferenÃ§a Ã© que essa IA Ã© especialista em agendamento ativo â€” uma funÃ§Ã£o muito especÃ­fica que as outras nÃ£o cobrem."', pct: 52 },
    { tag: 'Preciso consultar meu sÃ³cio', segmento: 'Todos os ramos', usos: 8, data: '05/05', frase: '"Claro, faz todo sentido! O que precisa acontecer nessa reuniÃ£o para que vocÃª e seu sÃ³cio possam avaliar com todas as informaÃ§Ãµes necessÃ¡rias?"', pct: 47 },
  ]

  const tipoIcon: Record<string, string> = { livro: 'ðŸ“˜', artigo: 'ðŸ“°', video: 'ðŸŽ¬', audio: 'ðŸŽ™ï¸', texto: 'ðŸ“' }

  // â”€â”€ Exportar RelatÃ³rio de Materiais (PDF via print) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function exportarRelatorioMateriais() {
    const materiais = Array.isArray(conhecimentoData) ? conhecimentoData : []
    const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const linhas = materiais.map((m: any) => {
      const insights = (m.argumentos?.length ?? 0) + (m.tecnicas?.length ?? 0)
      const data = m.created_at ? new Date(m.created_at).toLocaleDateString('pt-BR') : 'â€”'
      const icon = tipoIcon[m.tipo] ?? 'ðŸ“„'
      return `
        <tr>
          <td><strong>${m.titulo}</strong><br/><span style="color:#6b7280;font-size:11px">${m.categoria ?? m.tipo}</span></td>
          <td>${icon} ${m.tipo}</td>
          <td>${data}</td>
          <td style="text-align:center">${insights}</td>
          <td style="text-align:center;color:#6b7280">â€”</td>
          <td style="text-align:center;color:#6b7280">â€”</td>
        </tr>`
    }).join('')

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <title>ETZ â€” RelatÃ³rio de Impacto por Material</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: system-ui, sans-serif; color: #111; padding: 40px; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:32px; padding-bottom:16px; border-bottom:2px solid #6d28d9; }
    .header h1 { font-size:20px; font-weight:700; color:#111; }
    .header p { font-size:12px; color:#6b7280; margin-top:4px; }
    .meta { text-align:right; font-size:11px; color:#6b7280; }
    .kpis { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-bottom:28px; }
    .kpi { background:#f9fafb; border:1px solid #e5e7eb; border-radius:10px; padding:14px; }
    .kpi-val { font-size:22px; font-weight:700; color:#6d28d9; }
    .kpi-label { font-size:11px; color:#6b7280; margin-top:2px; }
    table { width:100%; border-collapse:collapse; font-size:12px; }
    thead tr { background:#f3f4f6; }
    th { text-align:left; padding:10px 12px; font-size:10px; text-transform:uppercase; color:#6b7280; letter-spacing:.05em; border-bottom:2px solid #e5e7eb; }
    td { padding:10px 12px; border-bottom:1px solid #f3f4f6; vertical-align:top; }
    tr:last-child td { border-bottom:none; }
    .footer { margin-top:32px; padding-top:16px; border-top:1px solid #e5e7eb; font-size:10px; color:#9ca3af; text-align:center; }
    .nota { background:#fefce8; border:1px solid #fde68a; border-radius:8px; padding:12px 16px; margin-bottom:24px; font-size:11px; color:#92400e; }
    @media print { body { padding:20px; } .no-print { display:none; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>RelatÃ³rio de Impacto por Material</h1>
      <p>Centro de InteligÃªncia ETZ â€” Base de Conhecimento do Agente</p>
    </div>
    <div class="meta">
      <p>Gerado em ${hoje}</p>
      <p style="color:#6d28d9;font-weight:600">ETZ Intelligence Platform</p>
    </div>
  </div>

  <div class="kpis">
    <div class="kpi">
      <div class="kpi-val">${materiais.length}</div>
      <div class="kpi-label">Materiais na base</div>
    </div>
    <div class="kpi">
      <div class="kpi-val">${materiais.reduce((s: number, m: any) => s + (m.argumentos?.length ?? 0) + (m.tecnicas?.length ?? 0), 0)}</div>
      <div class="kpi-label">Insights extraÃ­dos</div>
    </div>
    <div class="kpi">
      <div class="kpi-val">${totalBanco}</div>
      <div class="kpi-label">Argumentos no banco</div>
    </div>
  </div>

  ${!temDados ? `<div class="nota">âš ï¸ Dados de conversÃ£o (antes/depois/impacto) serÃ£o preenchidos automaticamente apÃ³s as primeiras ligaÃ§Ãµes realizadas pelo agente.</div>` : ''}

  <table>
    <thead>
      <tr>
        <th>Material</th>
        <th>Tipo</th>
        <th>Adicionado em</th>
        <th style="text-align:center">Insights</th>
        <th style="text-align:center">Conv. antes â†’ depois</th>
        <th style="text-align:center">Impacto</th>
      </tr>
    </thead>
    <tbody>${linhas || '<tr><td colspan="6" style="text-align:center;color:#9ca3af;padding:24px">Nenhum material cadastrado ainda.</td></tr>'}</tbody>
  </table>

  <div class="footer">ETZ Intelligence Platform Â· RelatÃ³rio gerado automaticamente Â· ${hoje}</div>

  <script>window.onload = function(){ window.print(); }<\/script>
</body>
</html>`

    const win = window.open('', '_blank')
    if (win) { win.document.write(html); win.document.close() }
  }

  // â”€â”€ Exportar Linha do Tempo (PDF via print) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function exportarLinhaTempo() {
    const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const marcos = [
      {
        cor: '#3b82f6', emoji: 'ðŸš€', titulo: 'Setup inicial concluÃ­do',
        data: dataSetup ?? hoje,
        desc: primeiroAgente
          ? `Agente "${primeiroAgente.nome}" configurado. ${totalMateriais} materiais na base, ${totalBanco} argumentos no banco.`
          : 'Agente ainda nÃ£o configurado.',
        tags: ([
          totalBanco > 0 ? `${totalBanco} argumentos no banco` : null,
          totalMateriais > 0 ? `${totalMateriais} materiais na base` : null,
        ] as (string | null)[]).filter((x): x is string => x !== null),
        ativo: !!primeiroAgente,
      },
      {
        cor: temDados ? '#10b981' : '#d1d5db', emoji: 'ðŸŽ¯', titulo: 'Primeiro agendamento confirmado',
        data: temDados ? 'â€”' : 'Aguardando',
        desc: temDados
          ? 'O agente realizou ligaÃ§Ãµes e confirmou o primeiro agendamento.'
          : 'Marco registrado automaticamente na primeira reuniÃ£o agendada.',
        tags: temDados ? [`${totalLigacoes} ligaÃ§Ãµes realizadas`] : [],
        ativo: temDados,
      },
      {
        cor: temDados ? '#8b5cf6' : '#d1d5db', emoji: 'ðŸ”', titulo: 'Primeiro padrÃ£o detectado automaticamente',
        data: temDados ? 'â€”' : 'Aguardando',
        desc: temDados
          ? 'O sistema detectou padrÃµes nas ligaÃ§Ãµes e aplicou no motor automaticamente.'
          : 'ApÃ³s ~50 ligaÃ§Ãµes, o sistema detecta melhores horÃ¡rios, tons e argumentos.',
        tags: [],
        ativo: temDados,
      },
      {
        cor: temDados ? '#f59e0b' : '#d1d5db', emoji: 'ðŸ”—', titulo: 'Aprendizado Cross-Cliente ativado',
        data: temDados ? 'â€”' : 'Aguardando',
        desc: 'Argumentos validados por outros agentes ETZ de qualquer segmento incorporados ao banco â€” um bom argumento de agendamento transcende o setor.',
        tags: [],
        ativo: temDados,
      },
      {
        cor: '#6d28d9', emoji: 'â­', titulo: 'Estado atual',
        data: `Hoje â€” ${hoje}`,
        desc: temDados
          ? `${totalLigacoes} ligaÃ§Ãµes realizadas. ${totalMateriais} materiais na base. ${totalBanco} argumentos ativos no banco.`
          : `${totalMateriais} materiais na base de conhecimento. ${totalBanco} argumentos ativos. Agente pronto para as primeiras ligaÃ§Ãµes.`,
        tags: [`${totalBanco} argumentos`, `${totalMateriais} materiais`, temDados ? `${totalLigacoes} ligaÃ§Ãµes` : '0 ligaÃ§Ãµes'],
        ativo: true,
      },
    ]

    const marcosHtml = marcos.map(m => `
      <div class="marco ${m.ativo ? '' : 'inativo'}">
        <div class="circulo" style="background:${m.cor}">${m.emoji}</div>
        <div class="conteudo">
          <div class="mc-header">
            <span class="mc-titulo">${m.titulo}</span>
            <span class="mc-data">${m.data}</span>
          </div>
          <p class="mc-desc">${m.desc}</p>
          ${m.tags.length > 0 ? `<div class="tags">${m.tags.map((t: string) => `<span class="tag">${t}</span>`).join('')}</div>` : ''}
        </div>
      </div>`).join('')

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <title>ETZ â€” Jornada de EvoluÃ§Ã£o do Agente</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: system-ui, sans-serif; color:#111; padding:40px; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:32px; padding-bottom:16px; border-bottom:2px solid #6d28d9; }
    .header h1 { font-size:20px; font-weight:700; }
    .header p { font-size:12px; color:#6b7280; margin-top:4px; }
    .meta { text-align:right; font-size:11px; color:#6b7280; }
    .timeline { position:relative; padding-left:32px; }
    .timeline::before { content:''; position:absolute; left:18px; top:0; bottom:0; width:2px; background:#e5e7eb; }
    .marco { display:flex; gap:16px; margin-bottom:24px; position:relative; }
    .marco.inativo { opacity:0.45; }
    .circulo { width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:16px; flex-shrink:0; z-index:1; margin-left:-18px; border:3px solid #fff; box-shadow:0 0 0 2px #e5e7eb; }
    .conteudo { flex:1; background:#f9fafb; border:1px solid #e5e7eb; border-radius:12px; padding:14px 16px; }
    .mc-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; }
    .mc-titulo { font-size:14px; font-weight:600; color:#111; }
    .mc-data { font-size:10px; color:#9ca3af; }
    .mc-desc { font-size:11px; color:#4b5563; line-height:1.6; }
    .tags { display:flex; gap:6px; flex-wrap:wrap; margin-top:8px; }
    .tag { font-size:10px; background:#ede9fe; color:#5b21b6; padding:2px 8px; border-radius:99px; font-weight:600; }
    .footer { margin-top:32px; padding-top:16px; border-top:1px solid #e5e7eb; font-size:10px; color:#9ca3af; text-align:center; }
    @media print { body { padding:20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>ðŸ—“ï¸ Jornada de EvoluÃ§Ã£o do Agente</h1>
      <p>Linha do tempo completa â€” cada marco registrado automaticamente desde o primeiro dia.</p>
    </div>
    <div class="meta">
      <p>Gerado em ${hoje}</p>
      <p style="color:#6d28d9;font-weight:600">ETZ Intelligence Platform</p>
    </div>
  </div>
  <div class="timeline">${marcosHtml}</div>
  <div class="footer">ETZ Intelligence Platform Â· TransparÃªncia total do aprendizado do agente Â· ${hoje}</div>
  <script>window.onload = function(){ window.print(); }<\/script>
</body>
</html>`

    const win = window.open('', '_blank')
    if (win) { win.document.write(html); win.document.close() }
  }

  // Meses para grÃ¡fico de evoluÃ§Ã£o (Ãºltimas 10 semanas - estrutura visual)
  const SEMANAS = ['Abr 1', 'Abr 7', 'Abr 14', 'Abr 21', 'Abr 28', 'Mai 5', 'Mai 12', 'Mai 19', 'Mai 26', 'Jun 2']
  const VALS = [6.1, 6.8, 7.2, 7.8, 7.4, 8.1, 8.0, 8.4, 8.6, 8.9]
  const EVENTOS: Record<number, { label: string; color: string }> = {
    2: { label: 'Receita Prev.', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    4: { label: '+8 argumentos', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    5: { label: 'Intel. mercado', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  }

  return (
    <div className="space-y-4">

      {/* â”€â”€ Header padrÃ£o â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
            <BarChart2 size={18} className="text-brand-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">MÃ©tricas de InteligÃªncia</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Acompanhe o impacto real de cada argumento, material e gatilho nas <span className="font-medium text-gray-700">taxas de conversÃ£o das ligaÃ§Ãµes</span>.
            </p>
          </div>
        </div>
        {temDados ? (
          <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-semibold shrink-0">
            {totalLigacoes} ligaÃ§Ãµes analisadas
          </span>
        ) : (
          <span className="text-xs bg-brand-50 text-brand-600 border border-brand-200 px-2.5 py-1 rounded-full font-semibold shrink-0">
            {totalMateriais + totalBanco} fontes configuradas
          </span>
        )}
      </div>

      {/* â”€â”€ Card explicativo â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
            <TrendingUp size={12} className="text-brand-600" />
          </div>
          <p className="text-sm font-semibold text-gray-900">O que vocÃª acompanha nesta aba</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: 'ðŸŽ¯', titulo: 'EficÃ¡cia por gatilho', desc: 'Quais momentos da conversa mais geram transferÃªncias â€” urgÃªncia, proposta, preÃ§o, decisor.' },
            { icon: 'ðŸ“ˆ', titulo: 'EvoluÃ§Ã£o de conversÃ£o', desc: 'Como a taxa sobe a cada material adicionado ou argumento ativado no banco.' },
            { icon: 'ðŸ’¬', titulo: 'Top argumentos em campo', desc: 'Os argumentos que o agente mais usou e que mais converteram nas ligaÃ§Ãµes reais.' },
            { icon: 'âš¡', titulo: 'Impacto por material', desc: 'ConversÃ£o antes e depois de cada livro, artigo ou vÃ­deo adicionado Ã  base.' },
            { icon: 'ðŸ§ ', titulo: 'Auto-aprendizado', desc: 'Frases descobertas automaticamente pelo sistema nas ligaÃ§Ãµes que mais convertem.' },
            { icon: 'ðŸ—“ï¸', titulo: 'Linha do tempo', desc: 'Cada marco registrado â€” setup, primeiro agendamento, padrÃµes, versÃµes e evoluÃ§Ã£o.' },
          ].map((m, i) => (
            <div key={i} className="flex gap-2 p-3 bg-gray-50 rounded-lg">
              <span className="text-base shrink-0">{m.icon}</span>
              <div>
                <p className="text-xs font-semibold text-gray-800">{m.titulo}</p>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
        {!temDados && (
          <div className="mt-3 flex items-start gap-2 bg-brand-50/60 border border-brand-100 rounded-lg p-3">
            <AlertCircle size={14} className="text-brand-500 shrink-0 mt-0.5" />
            <p className="text-xs text-brand-700 leading-relaxed">
              <span className="font-semibold">Aguardando as primeiras ligaÃ§Ãµes.</span> As seÃ§Ãµes abaixo mostram a estrutura completa â€” os dados reais preenchem automaticamente conforme o agente liga. VocÃª jÃ¡ tem <span className="font-semibold">{totalMateriais + totalBanco} fontes de inteligÃªncia</span> configuradas e prontas.
            </p>
          </div>
        )}
      </div>

      {/* â”€â”€ 4 KPIs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">ConversÃ£o atual</p>
          {temDados ? (
            <p className="text-2xl font-bold text-emerald-600">â€”%</p>
          ) : (
            <p className="text-2xl font-bold text-gray-300">â€”%</p>
          )}
          <p className="text-[10px] text-gray-400 mt-1">{temDados ? 'calculada das ligaÃ§Ãµes' : 'disponÃ­vel apÃ³s ligaÃ§Ãµes'}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Argumentos no banco</p>
          <p className="text-2xl font-bold text-blue-600">{totalBanco}</p>
          <p className="text-[10px] text-gray-400 mt-1">ativos nos agentes</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Materiais na base</p>
          <p className="text-2xl font-bold text-purple-600">{totalMateriais}</p>
          <p className="text-[10px] text-gray-400 mt-1">{totalInsights} insights extraÃ­dos</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Score de inteligÃªncia</p>
          {temDados ? (
            <p className="text-2xl font-bold text-amber-600">â€”</p>
          ) : (
            <p className="text-2xl font-bold text-gray-300">â€”</p>
          )}
          <p className="text-[10px] text-gray-400 mt-1">{temDados ? 'calculado' : 'disponÃ­vel apÃ³s ligaÃ§Ãµes'}</p>
        </div>
      </div>

      {/* â”€â”€ EficÃ¡cia dos gatilhos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">EficÃ¡cia dos gatilhos de transferÃªncia</h3>
            <p className="text-xs text-gray-400 mt-0.5">CalibraÃ§Ã£o automÃ¡tica â€” conectado Ã  discadora</p>
          </div>
          <button
            onClick={() => onNavigate?.('padroes')}
            className="text-xs bg-brand-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-brand-700 transition-colors"
          >
            Configurar gatilhos
          </button>
        </div>
        {temDados ? (
          <>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-emerald-50 rounded-lg p-3">
                <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide">ConversÃ£o pÃ³s-transf.</p>
                <p className="text-xl font-bold text-emerald-700 mt-1">â€”%</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide">TransferÃªncias auto</p>
                <p className="text-xl font-bold text-blue-700 mt-1">â€”</p>
                <p className="text-[10px] text-blue-500 mt-0.5">este mÃªs</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-3">
                <p className="text-[10px] font-semibold text-purple-600 uppercase tracking-wide">Gatilho mais eficaz</p>
                <p className="text-sm font-bold text-purple-700 mt-1">â€”</p>
              </div>
            </div>
            <p className="text-xs font-semibold text-gray-700 mb-2">EficÃ¡cia por gatilho ativado</p>
            <div className="space-y-2">
              {GATILHOS.map((g, i) => (
                <div key={i}>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-gray-600">{g.label}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${g.statusColor}`}>{g.status}</span>
                      <span className="font-mono font-bold text-gray-900 w-8 text-right">â€”%</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-gray-200 h-2 rounded-full w-0" />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 mb-4 opacity-40 pointer-events-none select-none">
              <div className="bg-emerald-50 rounded-lg p-3">
                <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide">ConversÃ£o pÃ³s-transf.</p>
                <p className="text-xl font-bold text-emerald-700 mt-1">â€”%</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide">TransferÃªncias auto</p>
                <p className="text-xl font-bold text-blue-700 mt-1">â€”</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-3">
                <p className="text-[10px] font-semibold text-purple-600 uppercase tracking-wide">Gatilho mais eficaz</p>
                <p className="text-sm font-bold text-purple-700 mt-1">â€”</p>
              </div>
            </div>
            <p className="text-xs font-semibold text-gray-700 mb-2">EficÃ¡cia por gatilho ativado</p>
            <div className="space-y-2">
              {GATILHOS.map((g, i) => (
                <div key={i}>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-gray-400">{g.label}</span>
                    <span className="text-gray-300 font-mono font-bold">â€”%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-gray-200 h-2 rounded-full" style={{ width: `${g.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-center py-2 border border-dashed border-gray-200 rounded-lg">
              <p className="text-xs text-gray-400">Dados de eficÃ¡cia disponÃ­veis apÃ³s as primeiras transferÃªncias</p>
            </div>
          </>
        )}
      </div>

      {/* â”€â”€ EvoluÃ§Ã£o x Treinamentos + Top Argumentos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-900">EvoluÃ§Ã£o da conversÃ£o x Treinamentos</h3>
          <p className="text-[11px] text-gray-400 mt-0.5 mb-4">Cada marco mostra um evento de treinamento que impactou a taxa</p>
          {temDados ? (
            <div className="flex items-end gap-1 h-28 mt-2">
              {SEMANAS.map((s, i) => {
                const ev = EVENTOS[i]
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 relative">
                    {ev && (
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap z-10">
                        <span className={`text-[9px] px-1 py-0.5 rounded border font-semibold ${ev.color}`}>{ev.label}</span>
                      </div>
                    )}
                    <div className={`w-full rounded-t ${ev ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ height: `${(VALS[i] / 10) * 112}px` }} />
                    <span className="text-gray-400 text-[9px]">{s}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex items-end gap-1 h-28 mt-2 opacity-30 pointer-events-none select-none">
              {SEMANAS.map((s, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t bg-gray-300" style={{ height: `${(VALS[i] / 10) * 112}px` }} />
                  <span className="text-gray-300 text-[9px]">{s}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-3 mt-3 text-[10px] text-gray-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block" />ConversÃ£o (%)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-200 inline-block" />Material adicionado</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-purple-200 inline-block" />Argumentos adicionados</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Argumentos mais efetivos</h3>
          {temDados ? (
            <div className="space-y-3">
              {TOP_ARGS.map((a, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-brand-50 text-brand-600 text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 truncate">{a.label}</p>
                    <p className="text-[10px] text-gray-400">{a.usos} usos</p>
                  </div>
                  <span className="text-sm font-bold text-emerald-600 shrink-0">â€”%</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {TOP_ARGS.map((_a, i) => (
                <div key={i} className="flex items-center gap-2 opacity-35">
                  <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-400 text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="h-2 bg-gray-200 rounded w-3/4 mb-1" />
                    <div className="h-1.5 bg-gray-100 rounded w-1/3" />
                  </div>
                  <span className="text-sm font-bold text-gray-300 shrink-0">â€”%</span>
                </div>
              ))}
              <p className="text-[11px] text-center text-gray-400 pt-1">DisponÃ­vel apÃ³s as primeiras ligaÃ§Ãµes</p>
            </div>
          )}
        </div>
      </div>

      {/* â”€â”€ Impacto por material â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-gray-900">Impacto por material adicionado</h3>
          {temDados && <button onClick={exportarRelatorioMateriais} className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-50 font-medium">Exportar relatÃ³rio PDF</button>}
        </div>
        <p className="text-[11px] text-gray-400 mb-3">Quanto cada livro, argumento ou informaÃ§Ã£o de mercado contribuiu para a evoluÃ§Ã£o da conversÃ£o</p>
        {totalMateriais > 0 ? (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] text-gray-400 uppercase tracking-wide">
                <th className="text-left pb-2 font-semibold">Material</th>
                <th className="text-left pb-2 font-semibold">Tipo</th>
                <th className="text-left pb-2 font-semibold">Adicionado em</th>
                <th className="text-right pb-2 font-semibold">Conv. antes</th>
                <th className="text-right pb-2 font-semibold">Conv. depois</th>
                <th className="text-right pb-2 font-semibold">Impacto</th>
                <th className="text-right pb-2 font-semibold">Usos</th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(conhecimentoData) ? conhecimentoData : []).slice(0, 6).map((m: any, i: number) => (
                <tr key={i} className="border-b border-gray-50 last:border-0">
                  <td className="py-2">
                    <p className="font-semibold text-gray-800">{m.titulo}</p>
                    <p className="text-[10px] text-gray-400">{m.categoria ?? m.tipo}</p>
                  </td>
                  <td className="py-2">
                    <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium capitalize">
                      {tipoIcon[m.tipo] ?? 'ðŸ“„'} {m.tipo}
                    </span>
                  </td>
                  <td className="py-2 text-gray-500">
                    {m.created_at ? new Date(m.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'â€”'}
                  </td>
                  <td className="py-2 text-right font-mono text-gray-400">{temDados ? 'â€”%' : 'â€”'}</td>
                  <td className="py-2 text-right font-mono text-gray-400">{temDados ? 'â€”%' : 'â€”'}</td>
                  <td className="py-2 text-right">
                    {temDados ? <span className="text-gray-300 font-mono">â€”%</span> : <span className="text-[10px] text-gray-300">aguardando</span>}
                  </td>
                  <td className="py-2 text-right text-gray-400">{temDados ? 'â€”' : 'â€”'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-6 border border-dashed border-gray-200 rounded-lg">
            <BookOpen size={24} className="text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-400">Adicione materiais na aba <span className="font-semibold text-brand-600">Conhecimento</span> para ver o impacto aqui</p>
          </div>
        )}
      </div>

      {/* â”€â”€ Argumentos aprendidos automaticamente â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-gray-900">Argumentos aprendidos automaticamente pelo agente</h3>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />Aprendendo agora
            </span>
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-semibold border border-blue-100">{totalBanco} argumentos</span>
          </div>
        </div>
        <p className="text-[11px] text-gray-400 mb-3">O agente aprende com cada ligaÃ§Ã£o e cria novos argumentos sozinho â€” sem intervenÃ§Ã£o humana. Atualizado em tempo real.</p>

        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4 flex gap-2">
          <Brain size={14} className="text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-blue-800">Como o agente aprende sozinho:</p>
            <p className="text-[11px] text-blue-600 mt-0.5 leading-relaxed">A cada ligaÃ§Ã£o gravada, o sistema analisa automaticamente o que foi dito, identifica os argumentos que geraram interesse ou agendamento, e os adiciona ao banco com o score de conversÃ£o real. Quanto mais ligaÃ§Ãµes, mais inteligente o agente fica.</p>
          </div>
        </div>

        {temDados ? (
          <>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">ðŸ† Mais efetivos â€” aprendidos das ligaÃ§Ãµes</p>
            <div className="space-y-3 mb-4">
              {ARGS_APRENDIDOS.map((a, i) => (
                <div key={i} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] px-2 py-0.5 rounded-full font-semibold">{a.tag}</span>
                    <span className="text-[10px] text-gray-400">{a.segmento} Â· {a.usos} usos Â· Aprendido em {a.data}</span>
                  </div>
                  <p className="text-xs text-gray-600 italic mb-2">{a.frase}</p>
                  <div className="flex items-center gap-2">
                    <Bar pct={a.pct} color="bg-emerald-500" />
                    <span className="text-xs font-bold text-emerald-600 w-8 shrink-0">â€”%</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">â³ Aprendidos esta semana â€” em validaÃ§Ã£o</p>
            <div className="space-y-2">
              {ARGS_VALIDACAO.map((a, i) => (
                <div key={i} className="border border-dashed border-amber-200 rounded-lg p-3 bg-amber-50/30">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded-full font-semibold">{a.tag}</span>
                    <span className="text-[10px] text-gray-400">{a.segmento} Â· {a.usos} usos Â· Novo â€” {a.data}</span>
                  </div>
                  <p className="text-xs text-gray-500 italic mb-1">{a.frase}</p>
                  <p className="text-[10px] text-amber-600 font-medium">â³ Em validaÃ§Ã£o â€” aguardando mais usos para confirmar efetividade</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">ðŸ† Mais efetivos â€” aprendidos das ligaÃ§Ãµes</p>
            {ARGS_APRENDIDOS.map((a, i) => (
              <div key={i} className="border border-gray-100 rounded-lg p-3 opacity-40">
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-gray-100 text-gray-500 text-[10px] px-2 py-0.5 rounded-full font-semibold">{a.tag}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded w-4/5 mb-2" />
                <Bar pct={a.pct} color="bg-gray-300" />
              </div>
            ))}
            <div className="text-center py-3 border border-dashed border-gray-200 rounded-lg mt-2">
              <p className="text-xs text-gray-400">Os argumentos aparecem aqui automaticamente conforme o agente realiza ligaÃ§Ãµes</p>
            </div>
          </div>
        )}
      </div>

      {/* â”€â”€ Linha do tempo â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              ðŸ—“ï¸ Linha do tempo â€” jornada de evoluÃ§Ã£o do agente
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Cada marco registrado automaticamente desde o primeiro dia. TransparÃªncia total do aprendizado.</p>
          </div>
          <button onClick={exportarLinhaTempo} className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-50 font-medium">Exportar</button>
        </div>

        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-100" />
          <div className="space-y-0">

            {/* Marco 1: Setup */}
            <div className="relative flex gap-4 pb-5">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center shrink-0 z-10 text-white text-sm">ðŸš€</div>
              <div className="flex-1 bg-gray-50 rounded-xl p-3 border border-gray-100">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-gray-900">Setup inicial concluÃ­do</p>
                  <p className="text-[10px] text-gray-400">{dataSetup ?? 'â€”'}</p>
                </div>
                <p className="text-[11px] text-gray-500 mb-2">
                  {primeiroAgente ? `Agente "${primeiroAgente.nome}" configurado com script, tom de voz e base de conhecimento. ${totalMateriais} materiais na base, ${totalBanco} argumentos no banco.` : 'Configure seu primeiro agente para iniciar a jornada.'}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {totalBanco > 0 && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">{totalBanco} argumentos no banco</span>}
                  {totalMateriais > 0 && <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">{totalMateriais} materiais na base</span>}
                  {!primeiroAgente && <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-semibold">Aguardando setup</span>}
                </div>
              </div>
            </div>

            {/* Marco 2: Primeiro agendamento */}
            <div className="relative flex gap-4 pb-5">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 text-white text-sm ${temDados ? 'bg-emerald-500' : 'bg-gray-200'}`}>ðŸŽ¯</div>
              <div className={`flex-1 rounded-xl p-3 border ${temDados ? 'bg-gray-50 border-gray-100' : 'bg-white border-dashed border-gray-200'}`}>
                <div className="flex items-center justify-between mb-1">
                  <p className={`text-sm font-semibold ${temDados ? 'text-gray-900' : 'text-gray-400'}`}>Primeiro agendamento confirmado</p>
                  <p className="text-[10px] text-gray-400">{temDados ? 'â€”' : 'Aguardando'}</p>
                </div>
                <p className="text-[11px] text-gray-400">
                  {temDados ? 'O agente realizou ligaÃ§Ãµes e confirmou o primeiro agendamento.' : 'Este marco Ã© registrado automaticamente na primeira reuniÃ£o agendada pelo agente.'}
                </p>
              </div>
            </div>

            {/* Marco 3: PadrÃ£o detectado */}
            <div className="relative flex gap-4 pb-5">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 text-white text-sm ${temDados ? 'bg-purple-500' : 'bg-gray-200'}`}>ðŸ”</div>
              <div className={`flex-1 rounded-xl p-3 border ${temDados ? 'bg-gray-50 border-gray-100' : 'bg-white border-dashed border-gray-200'}`}>
                <div className="flex items-center justify-between mb-1">
                  <p className={`text-sm font-semibold ${temDados ? 'text-gray-900' : 'text-gray-400'}`}>Primeiro padrÃ£o detectado automaticamente</p>
                  <p className="text-[10px] text-gray-400">{temDados ? 'â€”' : 'Aguardando'}</p>
                </div>
                <p className="text-[11px] text-gray-400">
                  {temDados ? 'O sistema detectou padrÃµes nas ligaÃ§Ãµes e aplicou automaticamente no motor.' : 'ApÃ³s ~50 ligaÃ§Ãµes, o sistema detecta os melhores horÃ¡rios, tons e argumentos automaticamente.'}
                </p>
              </div>
            </div>

            {/* Marco 4: Cross-cliente */}
            <div className="relative flex gap-4 pb-5">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 text-white text-sm ${temDados ? 'bg-amber-500' : 'bg-gray-200'}`}>ðŸ”—</div>
              <div className={`flex-1 rounded-xl p-3 border ${temDados ? 'bg-gray-50 border-gray-100' : 'bg-white border-dashed border-gray-200'}`}>
                <div className="flex items-center justify-between mb-1">
                  <p className={`text-sm font-semibold ${temDados ? 'text-gray-900' : 'text-gray-400'}`}>Aprendizado Cross-Cliente ativado</p>
                  <p className="text-[10px] text-gray-400">{temDados ? 'â€”' : 'Aguardando'}</p>
                </div>
                <p className="text-[11px] text-gray-400">
                  {temDados ? 'Argumentos validados por outros agentes ETZ de qualquer segmento incorporados ao banco â€” um argumento que converte em tecnologia pode converter em agronegÃ³cio.' : 'Argumentos validados por outros agentes ETZ de qualquer segmento serÃ£o incorporados automaticamente. Um bom argumento de agendamento transcende o setor.'}
                </p>
              </div>
            </div>

            {/* Marco 5: Estado atual */}
            <div className="relative flex gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 text-white text-sm ${primeiroAgente ? 'bg-brand-600' : 'bg-gray-200'}`}>â­</div>
              <div className={`flex-1 rounded-xl p-3 border ${primeiroAgente ? 'bg-brand-50/40 border-brand-100' : 'bg-white border-dashed border-gray-200'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <p className={`text-sm font-semibold ${primeiroAgente ? 'text-gray-900' : 'text-gray-400'}`}>Estado atual</p>
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold">Hoje</span>
                </div>
                <p className="text-[11px] text-gray-500 mb-3">
                  {temDados
                    ? `${totalLigacoes} ligaÃ§Ãµes realizadas. ${totalMateriais} materiais na base de conhecimento. ${totalBanco} argumentos ativos no banco.`
                    : `${totalMateriais} materiais na base de conhecimento. ${totalBanco} argumentos ativos no banco. Agente pronto para as primeiras ligaÃ§Ãµes.`}
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'conversÃ£o', val: temDados ? 'â€”%' : 'â€”', color: 'text-emerald-600' },
                    { label: 'argumentos', val: String(totalBanco), color: 'text-blue-600' },
                    { label: 'materiais', val: String(totalMateriais), color: 'text-purple-600' },
                    { label: 'ligaÃ§Ãµes', val: temDados ? String(totalLigacoes) : '0', color: 'text-amber-600' },
                  ].map((k, i) => (
                    <div key={i} className="bg-white rounded-lg p-2 text-center border border-gray-100">
                      <p className={`text-base font-bold ${k.color}`}>{k.val}</p>
                      <p className="text-[10px] text-gray-400">{k.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  )
}

const REGIOES_BR = [
  { regiao: 'Sudeste', estados: ['SP', 'RJ', 'MG', 'ES'], descricao: 'Tom direto e objetivo. Foco em resultado e ROI.' },
  { regiao: 'Sul', estados: ['RS', 'SC', 'PR'], descricao: 'Linguagem formal e tÃ©cnica. Valoriza pontualidade e precisÃ£o.' },
  { regiao: 'Nordeste', estados: ['BA', 'PE', 'CE', 'MA', 'PB', 'RN', 'AL', 'SE', 'PI'], descricao: 'Tom prÃ³ximo e relacional. Rapport antes da proposta.' },
  { regiao: 'Centro-Oeste', estados: ['GO', 'MT', 'MS', 'DF'], descricao: 'ComunicaÃ§Ã£o direta com abertura para negociaÃ§Ã£o.' },
  { regiao: 'Norte', estados: ['AM', 'PA', 'RO', 'AC', 'AP', 'RR', 'TO'], descricao: 'Tom informal e prÃ³ximo. PaciÃªncia na qualificaÃ§Ã£o.' },
]
const TONS = ['PadrÃ£o', 'Formal', 'Consultivo', 'Direto', 'PrÃ³ximo / Informal']

function TabAjusteFino() {
  const qc = useQueryClient()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [gatilhoSel, setGatilhoSel] = useState('urgencia')
  const [frase, setFrase] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [tonsPorRegiao, setTonsPorRegiao] = useState<Record<string, string>>({
    Sudeste: 'Direto', Sul: 'Formal', Nordeste: 'PrÃ³ximo / Informal', 'Centro-Oeste': 'Consultivo', Norte: 'PrÃ³ximo / Informal',
  })
  const [salvoSotaque, setSalvoSotaque] = useState(false)
  const [salvandoSotaque, setSalvandoSotaque] = useState(false)

  useQuery({
    queryKey: ['tom-regiao'],
    queryFn: () => api.get('https://app.etztech.com/api/v1/inteligencia/tom-regiao')
      .then(r => { if (r.data && Object.keys(r.data).length > 0) setTonsPorRegiao(r.data); return r.data }).catch(() => null),
  })

  const salvarTomRegiao = async () => {
    setSalvandoSotaque(true)
    try {
      await api.post('https://app.etztech.com/api/v1/inteligencia/tom-regiao', { tons: tonsPorRegiao })
      setSalvoSotaque(true)
      setTimeout(() => setSalvoSotaque(false), 4000)
    } catch { /* silencioso */ } finally {
      setSalvandoSotaque(false)
    }
  }

  const toggleId = (id: string) =>
    setSelectedIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  // â”€â”€ LigaÃ§Ãµes convertidas reais â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const { data: ligsRaw = [] } = useQuery({
    queryKey: ['ajuste-ligacoes'],
    queryFn: () => api.get('https://app.etztech.com/api/v1/ligacoes').then(r => r.data as any[]).catch(() => []),
  })
  const ligsConvertidas: any[] = ligsRaw.filter((l: any) =>
    l.resultado === 'agendou' || l.resultado === 'transferida'
  ).slice(0, 10)

  // â”€â”€ Cross argumentos aprovados (histÃ³rico de aprendizados) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const { data: crossAprovados = [] } = useQuery({
    queryKey: ['ajuste-cross-aprovados'],
    queryFn: () => api.get('https://app.etztech.com/api/v1/inteligencia/cross?status=aprovado')
      .then(r => r.data as any[]).catch(() => []),
  })

  // â”€â”€ Qualidade para impacto acumulado â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const { data: qualidade = [] } = useQuery({
    queryKey: ['ajuste-qualidade'],
    queryFn: () => api.get('https://app.etztech.com/api/v1/inteligencia/qualidade')
      .then(r => r.data as any[]).catch(() => []),
  })

  // Calcula impacto: diferenÃ§a entre melhor score atual e menor score histÃ³rico
  const scores: number[] = (qualidade as any[]).map((q: any) => q.score_total ?? 0).filter((s: number) => s > 0)
  const impactoAcumulado = scores.length >= 2
    ? Math.max(...scores) - Math.min(...scores)
    : null

  const GATILHOS = [
    { value: 'urgencia', label: 'UrgÃªncia' },
    { value: 'proposta', label: 'Proposta de valor' },
    { value: 'concorrente', label: 'Concorrente' },
    { value: 'gatekeeper', label: 'Gatekeeper' },
    { value: 'decisor', label: 'Decisor' },
    { value: 'preco', label: 'PreÃ§o / OrÃ§amento' },
  ]

  async function registrarAprendizado() {
    if (selectedIds.length === 0) return
    if (!frase.trim()) return
    setSalvando(true)
    try {
      const ligsSelecionadas = ligsConvertidas.filter((l: any) => selectedIds.includes(l.id))
      const empresas = ligsSelecionadas.map((l: any) => l.contatos?.empresa || l.numero_destino).join(', ')
      const argumento = `[Aprendizado de ${ligsSelecionadas.length} ligaÃ§Ã£o(Ãµes) convertidas â€” ${empresas}] ${frase.trim()}`
      await api.post('https://app.etztech.com/api/v1/inteligencia/cross', {
        argumento,
        gatilho: gatilhoSel,
        campanhas: [],
      })
      await qc.invalidateQueries({ queryKey: ['ajuste-cross-aprovados'] })
      setSelectedIds([])
      setFrase('')
      setSucesso(true)
      setTimeout(() => setSucesso(false), 4000)
    } catch (_e) {
      // silencia â€” botÃ£o fica habilitado novamente
    } finally {
      setSalvando(false)
    }
  }

  const temDados = ligsConvertidas.length > 0

  return (
    <div className="space-y-4">

      {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
            <Sliders size={20} className="text-brand-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-base font-semibold text-gray-900">Ajuste Fino por Conversas Reais</h2>
              <span className="bg-brand-50 text-brand-600 text-[10px] px-2 py-0.5 rounded-full font-semibold">APRENDIZADO SUPERVISIONADO</span>
            </div>
            <p className="text-xs text-gray-500">Selecione ligaÃ§Ãµes que converteram bem, identifique o gatilho e registre o aprendizado â€” o agente herda isso na prÃ³xima configuraÃ§Ã£o.</p>
          </div>
        </div>

        {/* Card explicativo */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          {[
            { icon: <CheckCircle size={14} className="text-brand-600" />, titulo: 'Selecione', desc: 'LigaÃ§Ãµes que agendaram â€” vocÃª sabe quais foram genuinamente boas' },
            { icon: <Zap size={14} className="text-amber-500" />, titulo: 'Identifique', desc: 'O gatilho que funcionou: urgÃªncia, proposta, concorrente, decisor...' },
            { icon: <Brain size={14} className="text-purple-600" />, titulo: 'Registre', desc: 'O padrÃ£o vai para revisÃ£o no IC e Ã© aprovado antes de propagar' },
            { icon: <TrendingUp size={14} className="text-emerald-600" />, titulo: 'O agente aprende', desc: 'Na prÃ³xima sincronizaÃ§Ã£o, o argumento entra no prompt do agente automaticamente' },
          ].map((b, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1">{b.icon}<span className="text-xs font-semibold text-gray-800">{b.titulo}</span></div>
              <p className="text-[11px] text-gray-500 leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* â”€â”€ Grid principal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="grid grid-cols-2 gap-4">

        {/* Painel esquerdo â€” selecionar ligaÃ§Ãµes */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">LigaÃ§Ãµes para aprender</h3>
          <p className="text-[11px] text-gray-400 mb-1">Apenas ligaÃ§Ãµes convertidas (agendou / transferida)</p>
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Selecione</span>
            <span className="text-[10px] text-gray-300">â†’</span>
            <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Registre</span>
            <span className="text-[10px] text-gray-300">â†’</span>
            <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">IC aprova</span>
            <span className="text-[10px] text-gray-300">â†’</span>
            <span className="text-[10px] bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full font-medium">Sincronizar com CI</span>
          </div>

          {!temDados ? (
            <div className="text-center py-8 text-gray-400">
              <Sliders size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs">Nenhuma ligaÃ§Ã£o convertida ainda.</p>
              <p className="text-[11px] mt-1">AparecerÃ£o aqui apÃ³s as primeiras ligaÃ§Ãµes que agendarem.</p>
            </div>
          ) : (
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto pr-1">
              {ligsConvertidas.map((l: any) => {
                const empresa = l.contatos?.empresa || l.contatos?.nome || l.numero_destino || 'â€”'
                const agente = l.agentes?.nome || 'â€”'
                const data = l.criado_em ? new Date(l.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : 'â€”'
                const resultado = l.resultado === 'agendou' ? 'Agendou' : 'Transferida'
                const corRes = l.resultado === 'agendou' ? 'text-emerald-600' : 'text-blue-600'
                return (
                  <label key={l.id} className="flex items-start gap-2 p-2.5 border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(l.id)}
                      onChange={() => toggleId(l.id)}
                      className="mt-0.5 rounded accent-brand-600"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{empresa}</p>
                      <p className="text-[11px] text-gray-400">{agente} Â· {data} Â· <span className={`font-semibold ${corRes}`}>{resultado}</span></p>
                    </div>
                  </label>
                )
              })}
            </div>
          )}

          {temDados && (
            <>
              <select
                value={gatilhoSel}
                onChange={e => setGatilhoSel(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2 outline-none focus:ring-2 focus:ring-brand-200 bg-white"
              >
                {GATILHOS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
              <textarea
                value={frase}
                onChange={e => setFrase(e.target.value)}
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 outline-none focus:ring-2 focus:ring-brand-200 resize-none"
                placeholder="Descreva o que funcionou nessa ligaÃ§Ã£o â€” frase, abordagem, argumento..."
              />
              {sucesso && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 mb-2">
                  <CheckCircle size={13} className="text-emerald-600 flex-shrink-0" />
                  <p className="text-xs text-emerald-700 font-medium">Aprendizado enviado para revisÃ£o no IC!</p>
                </div>
              )}
              <button
                disabled={selectedIds.length === 0 || !frase.trim() || salvando}
                className="w-full bg-brand-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                onClick={registrarAprendizado}
              >
                {salvando ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                {salvando ? 'Registrando...' : `Registrar aprendizado${selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}`}
              </button>
              <p className="text-[10px] text-gray-400 text-center mt-1.5">Vai para revisÃ£o no IC antes de ser aplicado</p>
            </>
          )}
        </div>

        {/* Painel direito â€” histÃ³rico de aprendizados aprovados */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Aprendizados registrados</h3>
          <p className="text-[11px] text-gray-400 mb-3">Argumentos aprovados no IC originados de ligaÃ§Ãµes reais</p>

          {crossAprovados.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Brain size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs">Nenhum aprendizado registrado ainda.</p>
              <p className="text-[11px] mt-1">Selecione ligaÃ§Ãµes ao lado e registre o primeiro.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1 mb-3">
              {(crossAprovados as any[]).slice(0, 6).map((c: any, i: number) => {
                const data = c.criado_em
                  ? new Date(c.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                  : c.aprovado_em
                  ? new Date(c.aprovado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                  : 'â€”'
                const gatilhoLabel = GATILHOS.find(g => g.value === c.gatilho)?.label ?? c.gatilho ?? 'â€”'
                return (
                  <div key={c.id ?? i} className="border border-gray-100 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="bg-brand-50 text-brand-700 text-[10px] px-2 py-0.5 rounded-full font-semibold">{gatilhoLabel}</span>
                      <span className="text-[10px] text-gray-400">{data}</span>
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed line-clamp-2">{c.frase || c.argumento || 'â€”'}</p>
                  </div>
                )
              })}
            </div>
          )}

          {/* Impacto acumulado */}
          {impactoAcumulado !== null && impactoAcumulado > 0 ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
              <p className="text-xs text-emerald-700 font-semibold">
                VariaÃ§Ã£o de score acumulada: +{impactoAcumulado}pts
              </p>
              <p className="text-[10px] text-emerald-600 mt-0.5">Entre o menor e maior score dos agentes</p>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500">Impacto calculado apÃ³s primeiros ajustes aprovados</p>
            </div>
          )}
        </div>
      </div>

      {/* â”€â”€ Sotaque / Tom por regiÃ£o â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Globe size={15} className="text-brand-600" />
            <h3 className="text-sm font-semibold text-gray-900">Tom por regiÃ£o</h3>
            <span className="bg-purple-50 text-purple-600 text-[10px] px-2 py-0.5 rounded-full font-semibold">SOTAQUE REGIONAL</span>
          </div>
          <button
            onClick={salvarTomRegiao}
            disabled={salvandoSotaque}
            className="text-xs bg-brand-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-700 transition-colors font-medium flex items-center gap-1.5 disabled:opacity-60"
          >
            {salvoSotaque ? <><CheckCircle size={12} /> Salvo</> : salvandoSotaque ? <><Loader2 size={12} className="animate-spin" /> Salvandoâ€¦</> : <><Sliders size={12} /> Salvar preferÃªncias</>}
          </button>
        </div>
        <p className="text-[11px] text-gray-400 mb-3">
          O agente detecta automaticamente a regiÃ£o do contato e adapta o tom durante a ligaÃ§Ã£o. Conforme as ligaÃ§Ãµes acontecem, o sistema mostra qual tom converte mais em cada regiÃ£o â€” vocÃª ajusta aqui e o agente obedece nas prÃ³ximas chamadas.
        </p>

        {salvoSotaque && (
          <div className="mb-3 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 flex items-center gap-2">
            <CheckCircle size={13} className="text-emerald-600 flex-shrink-0" />
            <p className="text-[11px] text-emerald-700">
              PreferÃªncias salvas. Para aplicar nos agentes, vÃ¡ em <strong>Meus Agentes â†’ Sincronizar com CI</strong>.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {REGIOES_BR.map(r => {
            const ligsRegiao = ligsRaw.filter((l: any) => r.estados.includes(l.contatos?.estado ?? ''))
            const totalReg = ligsRegiao.length
            const sucessoReg = ligsRegiao.filter((l: any) => l.resultado === 'agendou' || l.resultado === 'transferida').length
            const taxa = totalReg > 0 ? Math.round((sucessoReg / totalReg) * 100) : null
            const cor = taxa !== null ? (taxa >= 60 ? 'bg-emerald-500' : taxa >= 35 ? 'bg-amber-500' : 'bg-red-400') : 'bg-gray-200'
            const corTxt = taxa !== null ? (taxa >= 60 ? 'text-emerald-600' : taxa >= 35 ? 'text-amber-600' : 'text-red-600') : 'text-gray-400'
            const corBorder = taxa !== null ? (taxa >= 60 ? 'border-emerald-100' : taxa >= 35 ? 'border-amber-100' : 'border-red-100') : 'border-gray-100'

            return (
              <div key={r.regiao} className={`border rounded-xl p-3 ${corBorder}`}>
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold text-gray-900">{r.regiao}</span>
                      <div className="flex gap-1 flex-wrap">
                        {r.estados.map(e => (
                          <span key={e} className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono">{e}</span>
                        ))}
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-500 mb-2">{r.descricao}</p>

                    {/* Performance real ou estado de aprendizado */}
                    {taxa !== null ? (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-gray-500 font-medium">ConversÃ£o com tom <span className="text-brand-600 font-bold">"{tonsPorRegiao[r.regiao]}"</span></span>
                          <span className={`text-[11px] font-bold ${corTxt}`}>{taxa}% Â· {totalReg} lig.</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${cor} transition-all`} style={{ width: `${taxa}%` }} />
                        </div>
                        {taxa < 35 && (
                          <p className="text-[10px] text-amber-600 mt-1">âš  Taxa baixa â€” considere mudar o tom para esta regiÃ£o</p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-pulse" />
                        <p className="text-[10px] text-gray-400">Aguardando ligaÃ§Ãµes nesta regiÃ£o â€” performance aparece automaticamente</p>
                      </div>
                    )}
                  </div>

                  <div className="flex-shrink-0 w-44">
                    <select
                      value={tonsPorRegiao[r.regiao] ?? 'PadrÃ£o'}
                      onChange={e => setTonsPorRegiao(prev => ({ ...prev, [r.regiao]: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-brand-200 bg-white text-gray-800"
                    >
                      {TONS.map(t => <option key={t}>{t}</option>)}
                    </select>
                    <p className="text-[10px] text-gray-400 mt-1 text-center">tom configurado</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-3 bg-brand-50 border border-brand-100 rounded-lg px-3 py-2 flex items-start gap-2">
          <Zap size={13} className="text-brand-600 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-brand-700">
            O agente identifica o estado do contato e adapta o tom automaticamente em cada ligaÃ§Ã£o â€” sem intervenÃ§Ã£o manual. Os dados de conversÃ£o por tom aparecem aqui conforme as ligaÃ§Ãµes acontecem.
          </p>
        </div>
      </div>
    </div>
  )
}

function TabEvolucao() {
  const { data: agentes = [] } = useQuery({
    queryKey: ['evolucao-agentes'],
    queryFn: () => api.get('https://app.etztech.com/api/v1/agentes').then(r => r.data as any[]).catch(() => []),
  })
  const { data: ligsRaw = [] } = useQuery({
    queryKey: ['evolucao-ligacoes'],
    queryFn: () => api.get('https://app.etztech.com/api/v1/ligacoes').then(r => r.data as any[]).catch(() => []),
  })
  const { data: crossAll = [] } = useQuery({
    queryKey: ['evolucao-cross'],
    queryFn: () => api.get('https://app.etztech.com/api/v1/inteligencia/cross').then(r => r.data as any[]).catch(() => []),
  })
  const { data: qualidade = [] } = useQuery({
    queryKey: ['evolucao-qualidade'],
    queryFn: () => api.get('https://app.etztech.com/api/v1/inteligencia/qualidade').then(r => r.data as any[]).catch(() => []),
  })
  const { data: historico = [] } = useQuery({
    queryKey: ['evolucao-historico'],
    queryFn: () => api.get('https://app.etztech.com/api/v1/inteligencia/qualidade/historico').then(r => r.data as any[]).catch(() => []),
  })

  const fmt = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' })

  // Marcos reais derivados dos dados
  const primeiroAgente = (agentes as any[]).sort((a, b) => new Date(a.criado_em ?? a.created_at ?? 0).getTime() - new Date(b.criado_em ?? b.created_at ?? 0).getTime())[0]
  const primeiraLig = (ligsRaw as any[]).sort((a, b) => new Date(a.criado_em).getTime() - new Date(b.criado_em).getTime())[0]
  const crossAprovados = (crossAll as any[]).filter((c: any) => c.status === 'aprovado')
  const ultimoCross = [...crossAprovados].sort((a, b) => new Date(b.aprovado_em ?? b.criado_em).getTime() - new Date(a.aprovado_em ?? a.criado_em).getTime())[0]
  const primeiroCross = [...crossAprovados].sort((a, b) => new Date(a.aprovado_em ?? a.criado_em).getTime() - new Date(b.aprovado_em ?? b.criado_em).getTime())[0]
  const scores = (qualidade as any[]).map((q: any) => q.score_total ?? 0).filter((s: number) => s > 0)
  const scoreAtual = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null

  // â”€â”€ Taxa de aprendizado (cross aprovados: este mÃªs vs mÃªs anterior) â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const agora = new Date()
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1).getTime()
  const inicioMesAnterior = new Date(agora.getFullYear(), agora.getMonth() - 1, 1).getTime()
  const crossEsteMes = crossAprovados.filter((c: any) => new Date(c.aprovado_em ?? c.criado_em).getTime() >= inicioMes).length
  const crossMesAnterior = crossAprovados.filter((c: any) => {
    const t = new Date(c.aprovado_em ?? c.criado_em).getTime()
    return t >= inicioMesAnterior && t < inicioMes
  }).length
  const tendencia = crossMesAnterior === 0
    ? (crossEsteMes > 0 ? 'acelerando' : 'neutro')
    : crossEsteMes > crossMesAnterior ? 'acelerando' : crossEsteMes < crossMesAnterior ? 'desacelerando' : 'estÃ¡vel'

  // â”€â”€ Alerta de ciclo parado â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const diasSemAprovacao = ultimoCross
    ? Math.floor((Date.now() - new Date(ultimoCross.aprovado_em ?? ultimoCross.criado_em).getTime()) / 86400000)
    : null
  const alertaCicloParado = diasSemAprovacao !== null && diasSemAprovacao >= 7

  // â”€â”€ GrÃ¡fico SVG de score â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const W = 420; const H = 80; const PAD = 8
  const historicoArr = historico as any[]
  const pontos = historicoArr.map((h: any) => h.score_medio as number)
  const minS = pontos.length > 0 ? Math.min(...pontos) : 0
  const maxS = pontos.length > 0 ? Math.max(...pontos, minS + 1) : 100
  const toX = (i: number) => PAD + (i / Math.max(pontos.length - 1, 1)) * (W - PAD * 2)
  const toY = (v: number) => H - PAD - ((v - minS) / (maxS - minS)) * (H - PAD * 2)
  const path = pontos.map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ')
  const areaPath = pontos.length > 1
    ? `${path} L${toX(pontos.length - 1).toFixed(1)},${H} L${toX(0).toFixed(1)},${H} Z`
    : ''

  // Linha do tempo com marcos reais
  const marcos: { icon: React.ReactNode; titulo: string; data: string; desc: string; ativo: boolean }[] = []

  if (ultimoCross) marcos.push({
    icon: <Brain size={12} />,
    titulo: 'Ãšltima evoluÃ§Ã£o de inteligÃªncia',
    data: fmt(ultimoCross.aprovado_em ?? ultimoCross.criado_em),
    desc: `Argumento "${(ultimoCross.frase || ultimoCross.argumento || '').slice(0, 60)}â€¦" aprovado`,
    ativo: true,
  })
  if (primeiroCross) marcos.push({
    icon: <Zap size={12} />,
    titulo: 'Primeiro aprendizado cross aprovado',
    data: fmt(primeiroCross.aprovado_em ?? primeiroCross.criado_em),
    desc: `Gatilho: ${primeiroCross.gatilho ?? 'â€”'} Â· total aprovados: ${crossAprovados.length}`,
    ativo: false,
  })
  if (primeiraLig) marcos.push({
    icon: <Zap size={12} />,
    titulo: 'Primeira ligaÃ§Ã£o realizada',
    data: fmt(primeiraLig.criado_em),
    desc: `${ligsRaw.length} ligaÃ§Ãµes no total`,
    ativo: false,
  })
  if (primeiroAgente) marcos.push({
    icon: <CheckCircle size={12} />,
    titulo: 'Setup inicial',
    data: fmt(primeiroAgente.criado_em ?? primeiroAgente.created_at ?? new Date().toISOString()),
    desc: `${agentes.length} agente${agentes.length !== 1 ? 's' : ''} configurado${agentes.length !== 1 ? 's' : ''}`,
    ativo: false,
  })

  const semDados = marcos.length === 0

  return (
    <div className="space-y-4">

      {/* Header branco premium */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
            <TrendingUp size={20} className="text-brand-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-base font-semibold text-gray-900">EvoluÃ§Ã£o do Sistema</h2>
              <span className="bg-brand-50 text-brand-600 text-[10px] px-2 py-0.5 rounded-full font-semibold">APRENDIZADO CONTÃNUO</span>
            </div>
            <p className="text-xs text-gray-500">Marcos reais de evoluÃ§Ã£o â€” cada ligaÃ§Ã£o retroalimenta o sistema e eleva a inteligÃªncia dos agentes.</p>
          </div>
        </div>

        {/* KPIs reais */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          {[
            { label: 'LigaÃ§Ãµes realizadas', value: ligsRaw.length > 0 ? ligsRaw.length.toLocaleString('pt-BR') : 'â€”', color: 'text-brand-600' },
            { label: 'Cross aprovados', value: crossAprovados.length > 0 ? String(crossAprovados.length) : 'â€”', color: 'text-emerald-600' },
            { label: 'Agentes ativos', value: agentes.length > 0 ? String(agentes.length) : 'â€”', color: 'text-purple-600' },
            { label: 'Score mÃ©dio atual', value: scoreAtual !== null ? `${scoreAtual}%` : 'â€”', color: 'text-amber-600' },
          ].map((k, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-3 text-center">
              <p className={`text-lg font-bold ${k.color}`}>{k.value}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{k.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* â”€â”€ Alerta ciclo parado â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {alertaCicloParado && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <AlertCircle size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-amber-800">
              Ciclo de aprendizado parado hÃ¡ {diasSemAprovacao} dia{diasSemAprovacao !== 1 ? 's' : ''}
            </p>
            <p className="text-[11px] text-amber-700 mt-0.5">
              Nenhum argumento novo aprovado desde {fmt(ultimoCross!.aprovado_em ?? ultimoCross!.criado_em)}. Revise os pendentes na aba <strong>IC</strong> para manter o sistema evoluindo.
            </p>
          </div>
        </div>
      )}

      {/* â”€â”€ GrÃ¡fico de score + taxa de aprendizado â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="grid grid-cols-2 gap-4">
        {/* GrÃ¡fico evoluÃ§Ã£o do score */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">EvoluÃ§Ã£o do score mÃ©dio</h3>
            {scoreAtual !== null && (
              <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">{scoreAtual}% atual</span>
            )}
          </div>
          {pontos.length < 2 ? (
            <div className="flex flex-col items-center justify-center h-20 text-gray-400">
              <p className="text-xs">Dados insuficientes para o grÃ¡fico.</p>
              <p className="text-[11px] mt-0.5">Clique em "Calcular â€” Hoje" na aba Qualidade para gerar snapshots.</p>
            </div>
          ) : (
            <div>
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 80 }}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {areaPath && <path d={areaPath} fill="url(#scoreGrad)" />}
                <path d={path} fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                {pontos.map((v, i) => (
                  <circle key={i} cx={toX(i)} cy={toY(v)} r="3" fill="#7c3aed" />
                ))}
              </svg>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-gray-400">{fmt(historicoArr[0]?.calculado_em)}</span>
                <span className="text-[10px] text-gray-400">{fmt(historicoArr[historicoArr.length - 1]?.calculado_em)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Taxa de aprendizado */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Taxa de aprendizado</h3>
          <div className="flex items-end gap-6 mb-3">
            <div>
              <p className="text-2xl font-bold text-brand-600">{crossEsteMes}</p>
              <p className="text-[11px] text-gray-500">aprovados este mÃªs</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-400">{crossMesAnterior}</p>
              <p className="text-[11px] text-gray-500">mÃªs anterior</p>
            </div>
            <div className="ml-auto">
              {tendencia === 'acelerando' && <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full"><TrendingUp size={11} /> Acelerando</span>}
              {tendencia === 'desacelerando' && <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-full"><TrendingUp size={11} className="rotate-180" /> Desacelerando</span>}
              {tendencia === 'estÃ¡vel' && <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">EstÃ¡vel</span>}
              {tendencia === 'neutro' && <span className="text-xs font-semibold text-gray-400 bg-gray-50 px-2 py-1 rounded-full">Sem dados</span>}
            </div>
          </div>
          <div className="flex gap-2 h-10 items-end">
            {[crossMesAnterior, crossEsteMes].map((v, i) => {
              const max = Math.max(crossMesAnterior, crossEsteMes, 1)
              const pct = Math.max((v / max) * 100, v > 0 ? 10 : 0)
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className={`w-full rounded-t-md ${i === 1 ? 'bg-brand-500' : 'bg-gray-200'}`} style={{ height: `${pct}%` }} />
                </div>
              )
            })}
          </div>
          <div className="flex gap-2 mt-1">
            <p className="flex-1 text-center text-[10px] text-gray-400">MÃªs ant.</p>
            <p className="flex-1 text-center text-[10px] text-gray-400">Este mÃªs</p>
          </div>
          <p className="text-[11px] text-gray-400 mt-2 text-center">Total: {crossAprovados.length} argumento{crossAprovados.length !== 1 ? 's' : ''} aprovado{crossAprovados.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">

        {/* Linha do tempo real */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Marcos de evoluÃ§Ã£o</h3>
          {semDados ? (
            <div className="text-center py-8 text-gray-400">
              <TrendingUp size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs">Marcos aparecerÃ£o conforme o sistema evolui.</p>
              <p className="text-[11px] mt-1">Crie agentes e inicie ligaÃ§Ãµes para comeÃ§ar.</p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-3 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-gray-200" />
              {marcos.map((m, i) => (
                <div key={i} className="flex gap-3 mb-5 relative pl-8">
                  <div className={`absolute left-0.5 top-1 w-5 h-5 rounded-full flex items-center justify-center ${m.ativo ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {m.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-bold ${m.ativo ? 'text-brand-600' : 'text-gray-700'}`}>{m.titulo}</span>
                      {m.ativo && <span className="bg-brand-50 text-brand-600 text-[10px] px-1.5 py-0.5 rounded font-semibold">ATUAL</span>}
                      <span className="text-[11px] text-gray-400">{m.data}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Ciclo de evoluÃ§Ã£o */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Como o sistema evolui</h3>
            <div className="space-y-2.5">
              {[
                { n: '1', txt: 'LigaÃ§Ãµes executadas e gravadas pelo agente', ok: ligsRaw.length > 0 },
                { n: '2', txt: 'AnÃ¡lise de gatilhos e padrÃµes pela IA', ok: ligsRaw.length > 0 },
                { n: '3', txt: 'ValidaÃ§Ã£o cruzada com histÃ³rico de conversÃµes', ok: crossAll.length > 0 },
                { n: '4', txt: 'AprovaÃ§Ã£o pelo gerente (aba IC)', ok: crossAprovados.length > 0 },
                { n: '5', txt: 'Sincronizar com CI â†’ agentes atualizados', ok: false },
              ].map((s, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${s.ok ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                    {s.ok
                      ? <CheckCircle size={10} className="text-emerald-600" />
                      : <span className="text-[9px] text-gray-500 font-bold">{s.n}</span>}
                  </div>
                  <p className={`text-xs ${s.ok ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>{s.txt}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Ãšltima evoluÃ§Ã£o de inteligÃªncia */}
          {ultimoCross ? (
            <div className="bg-brand-50 border border-brand-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Brain size={14} className="text-brand-600" />
                <p className="text-xs text-brand-700 font-semibold">Ãšltima evoluÃ§Ã£o de inteligÃªncia</p>
              </div>
              <p className="text-[11px] text-brand-600 mb-1">{fmt(ultimoCross.aprovado_em ?? ultimoCross.criado_em)}</p>
              <p className="text-xs text-brand-800 font-medium leading-relaxed line-clamp-2">
                "{(ultimoCross.frase || ultimoCross.argumento || 'â€”').slice(0, 100)}"
              </p>
              <p className="text-[10px] text-brand-500 mt-1.5">Gatilho: {ultimoCross.gatilho ?? 'â€”'} Â· {crossAprovados.length} aprovados no total</p>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
              <Brain size={20} className="mx-auto mb-2 text-gray-300" />
              <p className="text-xs text-gray-500">Nenhum aprendizado aprovado ainda.</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Approve argumentos na aba IC para ver a evoluÃ§Ã£o aqui.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface CrossArg {
  id: string
  gatilho: string
  frase: string
  argumento: string
  status: string
  criado_em: string
  aprovado_em: string | null
  segmento: string | null
  cliente_id: string
  origem?: string
  tipo?: string
}

interface RedeArg {
  id: string
  gatilho: string
  frase: string
  aprovado_em: string | null
  total_ligacoes_impactadas: number
  ja_importado: boolean
}

function TabCross() {
  const qc = useQueryClient()
  const [aprovando, setAprovando] = useState<string | null>(null)
  const [rejeitando, setRejeitando] = useState<string | null>(null)
  const [importando, setImportando] = useState<string | null>(null)
  const [detectando, setDetectando] = useState(false)
  const [detectadoOk, setDetectadoOk] = useState(false)
  const [bannerSync, setBannerSync] = useState(false)

  const { data: crossAll = [], refetch: refetchCross } = useQuery({
    queryKey: ['cross-all'],
    queryFn: () => api.get('https://app.etztech.com/api/v1/inteligencia/cross').then(r => r.data as CrossArg[]).catch(() => [] as CrossArg[]),
  })
  const { data: redeData = [], refetch: refetchRede } = useQuery({
    queryKey: ['cross-rede'],
    queryFn: () => api.get('https://app.etztech.com/api/v1/inteligencia/cross/rede').then(r => r.data as RedeArg[]).catch(() => [] as RedeArg[]),
  })
  const { data: ligsRaw = [] } = useQuery({
    queryKey: ['cross-ligacoes'],
    queryFn: () => api.get('https://app.etztech.com/api/v1/ligacoes').then(r => r.data as any[]).catch(() => []),
  })

  // Cross = argumentos validados (frases prontas para usar) â€” nÃ£o padrÃµes comportamentais
  const pendentes = crossAll.filter(c => c.status === 'pendente' && c.tipo !== 'padrao_comportamental')
  const aprovados = crossAll.filter(c => c.status === 'aprovado' && c.tipo !== 'padrao_comportamental')
  const totalLigs = (ligsRaw as any[]).length
  const ligsConvertidas = (ligsRaw as any[]).filter((l: any) => l.resultado === 'agendou' || l.resultado === 'transferida')

  // KPIs
  const agora = new Date()
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1)
  const aprovadosEsteMes = aprovados.filter(c => new Date(c.aprovado_em ?? c.criado_em) >= inicioMes).length

  // Agrupamento por gatilho dos aprovados
  const porGatilho: Record<string, CrossArg[]> = {}
  aprovados.forEach(c => {
    const g = c.gatilho ?? 'outros'
    if (!porGatilho[g]) porGatilho[g] = []
    porGatilho[g].push(c)
  })

  // ROI estimado por argumento: ligaÃ§Ãµes convertidas apÃ³s aprovaÃ§Ã£o
  function ligsAposAprovacao(c: CrossArg) {
    if (!c.aprovado_em) return 0
    const dt = new Date(c.aprovado_em)
    return ligsConvertidas.filter((l: any) => new Date(l.criado_em) >= dt).length
  }

  async function aprovar(id: string) {
    setAprovando(id)
    try {
      await api.post(`https://app.etztech.com/api/v1/inteligencia/cross/${id}/aprovar`)
      await refetchCross()
      setBannerSync(true)
      qc.invalidateQueries({ queryKey: ['inteligencia-cross'] })
      qc.invalidateQueries({ queryKey: ['evolucao-cross'] })
    } catch { /* silencioso */ } finally { setAprovando(null) }
  }

  async function rejeitar(id: string) {
    setRejeitando(id)
    try {
      await api.delete(`https://app.etztech.com/api/v1/inteligencia/cross/${id}`)
      await refetchCross()
      qc.invalidateQueries({ queryKey: ['inteligencia-cross'] })
    } catch { /* silencioso */ } finally { setRejeitando(null) }
  }

  async function importarDaRede(id: string) {
    setImportando(id)
    try {
      await api.post(`https://app.etztech.com/api/v1/inteligencia/cross/rede/${id}/importar`)
      await refetchCross()
      refetchRede()
      setBannerSync(true)
      qc.invalidateQueries({ queryKey: ['inteligencia-cross'] })
    } catch { /* silencioso */ } finally { setImportando(null) }
  }

  async function detectarPadroes() {
    setDetectando(true); setDetectadoOk(false)
    try {
      await api.post('https://app.etztech.com/api/v1/inteligencia/detectar-padroes')
      await refetchCross()
      setDetectadoOk(true)
      setTimeout(() => setDetectadoOk(false), 4000)
    } catch { /* silencioso */ } finally { setDetectando(false) }
  }

  const fmtDt = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
  const fmtHora = (d: string) => new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="space-y-4">

      {/* â”€â”€ Header branco premium â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <Brain size={20} className="text-emerald-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-base font-semibold text-gray-900">Aprendizado Cross-Cliente</h2>
              <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-semibold">REDE COLABORATIVA</span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Cada ligaÃ§Ã£o gera dados. O sistema analisa o que converteu â€” por setor, porte, cargo, objeÃ§Ã£o â€” e identifica padrÃµes que funcionam alÃ©m do seu segmento. Quando um argumento de indÃºstria converte bem com varejo, seu agente aprende isso. VocÃª aprova. O agente aplica na prÃ³xima ligaÃ§Ã£o.
            </p>
          </div>
        </div>

        {/* Diferenciais em linha */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
          {[
            { icon: 'âš¡', title: 'Zero cold start', desc: 'Novo agente nasce com o aprendizado acumulado de todas as ligaÃ§Ãµes anteriores da plataforma.' },
            { icon: 'ðŸ”’', title: 'Privacidade total', desc: 'Nenhum dado de clientes Ã© compartilhado â€” apenas padrÃµes estatÃ­sticos anÃ´nimos de comportamento.' },
            { icon: 'âœ“', title: 'Controle do gerente', desc: 'Nenhum argumento entra em produÃ§Ã£o sem sua aprovaÃ§Ã£o. VocÃª decide o que o agente aprende.' },
          ].map((d, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-base leading-none mt-0.5">{d.icon}</span>
              <div>
                <p className="text-xs font-semibold text-gray-800">{d.title}</p>
                <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">{d.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* KPIs reais */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          {[
            { label: 'Pendentes de aprovaÃ§Ã£o', value: String(pendentes.length), color: pendentes.length > 0 ? 'text-amber-600' : 'text-gray-400', bg: pendentes.length > 0 ? 'bg-amber-50' : 'bg-gray-50' },
            { label: 'Aprovados no total', value: String(aprovados.length), color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Aprovados este mÃªs', value: String(aprovadosEsteMes), color: 'text-brand-600', bg: 'bg-brand-50' },
            { label: 'LigaÃ§Ãµes analisadas', value: totalLigs > 0 ? totalLigs.toLocaleString('pt-BR') : 'â€”', color: 'text-purple-600', bg: 'bg-purple-50' },
          ].map((k, i) => (
            <div key={i} className={`${k.bg} rounded-lg p-3 text-center`}>
              <p className={`text-lg font-bold ${k.color}`}>{k.value}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{k.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* â”€â”€ Alerta pendentes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {pendentes.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <AlertCircle size={15} className="text-amber-600 flex-shrink-0" />
          <p className="text-xs text-amber-800 font-medium">
            {pendentes.length} argumento{pendentes.length !== 1 ? 's' : ''} aguardando sua aprovaÃ§Ã£o â€” revise e aprove para o agente evoluir.
          </p>
        </div>
      )}

      {/* â”€â”€ Detectar padrÃµes â€” acima dos pendentes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-gray-800">Detectar novos padrÃµes</p>
          <p className="text-[11px] text-gray-500 mt-0.5">O sistema roda automaticamente todo dia Ã s 00:00 e gera sugestÃµes com os argumentos que mais converteram. Use este botÃ£o para forÃ§ar uma anÃ¡lise agora.</p>
        </div>
        <button
          onClick={detectarPadroes}
          disabled={detectando}
          className="flex items-center gap-1.5 bg-emerald-600 text-white text-xs px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-semibold disabled:opacity-50 flex-shrink-0"
        >
          {detectando
            ? <><Loader2 size={12} className="animate-spin" /> Analisandoâ€¦</>
            : detectadoOk
            ? <><CheckCircle size={12} /> PadrÃµes detectados!</>
            : <><Zap size={12} /> Detectar padrÃµes</>
          }
        </button>
      </div>

      {/* â”€â”€ Grid: pendentes + como funciona â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="grid grid-cols-2 gap-4">

        {/* Pendentes de aprovaÃ§Ã£o */}
        <div id="cross-pending-list" className="bg-white border-l-4 border-l-amber-400 border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Pendentes de aprovaÃ§Ã£o</h3>
            <span id="cross-pending-count" className="bg-amber-50 text-amber-700 text-xs px-2 py-0.5 rounded-full font-semibold">{pendentes.length} pendentes</span>
          </div>

          {pendentes.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              <CheckCircle size={24} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs">Nenhum argumento pendente.</p>
              <p className="text-[11px] mt-0.5">Clique em "Detectar padrÃµes" na aba IC para gerar novos.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendentes.map(a => {
                const texto = a.frase || a.argumento || 'â€”'
                return (
                  <div key={a.id} className="border border-gray-200 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-amber-50 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-semibold">{a.gatilho ?? 'â€”'}</span>
                      <span className="text-[10px] text-gray-400">{fmtDt(a.criado_em)} {fmtHora(a.criado_em)}</span>
                    </div>
                    <div className="bg-gray-50 border border-gray-100 rounded-lg p-2.5 mb-2.5">
                      <p className="text-[10px] text-gray-400 font-semibold mb-1">ARGUMENTO DETECTADO:</p>
                      <p className="text-xs text-gray-700 leading-relaxed">{texto.slice(0, 200)}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => aprovar(a.id)}
                        disabled={aprovando === a.id}
                        className="flex-1 bg-emerald-600 text-white text-xs py-1.5 rounded-lg hover:bg-emerald-700 transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        {aprovando === a.id ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle size={11} />}
                        Aprovar e propagar
                      </button>
                      <button
                        onClick={() => rejeitar(a.id)}
                        disabled={rejeitando === a.id}
                        className="flex-1 bg-white border border-red-200 text-red-600 text-xs py-1.5 rounded-lg hover:bg-red-50 transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        {rejeitando === a.id ? <Loader2 size={11} className="animate-spin" /> : null}
                        Recusar
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Como funciona na prÃ¡tica */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Como funciona na prÃ¡tica</h3>
          <div className="space-y-3">
            {[
              { n: '1', cor: 'bg-brand-100 text-brand-700', txt: 'Todos os agentes geram dados de cada ligaÃ§Ã£o â€” setor do contato, objeÃ§Ã£o levantada, argumento usado e se agendou ou nÃ£o' },
              { n: '2', cor: 'bg-emerald-100 text-emerald-700', txt: 'O sistema organiza por perfil de contato â€” indÃºstria, varejo, tecnologia, saÃºde e mais â€” e identifica os argumentos que mais convertem em cada um' },
              { n: '3', cor: 'bg-purple-100 text-purple-700', txt: 'O agente aprende que referÃªncias de outros segmentos podem converter mais do que referÃªncias do prÃ³prio setor â€” e usa isso estrategicamente' },
              { n: '4', cor: 'bg-amber-100 text-amber-700', txt: 'Se sua campanha tem diferentes segmentos na mesma lista, o agente muda de abordagem e referÃªncia automaticamente para cada empresa' },
              { n: 'âœ“', cor: 'bg-gray-100 text-gray-600', txt: 'Nenhuma informaÃ§Ã£o confidencial Ã© compartilhada â€” apenas padrÃµes estatÃ­sticos anÃ´nimos de comportamento e conversÃ£o' },
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold ${s.cor}`}>{s.n}</div>
                <p className="text-xs text-gray-600 leading-relaxed">{s.txt}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* â”€â”€ Argumentos aprovados com pipeline visual â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {aprovados.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Argumentos aplicados â€” impacto no CI</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">{aprovados.length} argumento{aprovados.length !== 1 ? 's' : ''} ativo{aprovados.length !== 1 ? 's' : ''} Â· conectados automaticamente ao motor de IA</p>
            </div>
          </div>

          {/* Agrupado por gatilho */}
          {Object.entries(porGatilho).map(([gatilho, args]) => (
            <div key={gatilho} className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-brand-50 text-brand-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">{gatilho}</span>
                <span className="text-[10px] text-gray-400">{args.length} argumento{args.length !== 1 ? 's' : ''}</span>
              </div>

              <div className="space-y-3">
                {args.map(c => {
                  const texto = c.frase || c.argumento || 'â€”'
                  const ligsImpact = ligsAposAprovacao(c)
                  return (
                    <div key={c.id} className="border border-gray-100 rounded-xl p-3 bg-gray-50/50">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-xs text-gray-800 font-medium leading-relaxed flex-1">"{texto.slice(0, 120)}{texto.length > 120 ? 'â€¦' : ''}"</p>
                        {ligsImpact > 0 && (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex-shrink-0">+{ligsImpact} conv.</span>
                        )}
                      </div>

                      {/* Pipeline visual */}
                      <div className="grid grid-cols-4 gap-1 mt-3">
                        {[
                          { label: 'DETECTADO', sub: 'Auto-detectado', data: fmtDt(c.criado_em), done: true },
                          { label: 'APROVADO', sub: `${fmtDt(c.aprovado_em ?? c.criado_em)} ${fmtHora(c.aprovado_em ?? c.criado_em)}`, data: 'pelo gerente', done: true },
                          { label: 'PROPAGADO', sub: 'Sincronizar com CI', data: '', done: false },
                          { label: 'RESULTADO', sub: ligsImpact > 0 ? `${ligsImpact} conv. apÃ³s` : 'Aguardando', data: '', done: ligsImpact > 0 },
                        ].map((etapa, ei) => (
                          <div key={ei} className="text-center">
                            <div className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center mb-1 ${etapa.done ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                              {etapa.done
                                ? <CheckCircle size={12} className="text-emerald-600" />
                                : <span className="text-[9px] text-gray-400 font-bold">{ei + 1}</span>}
                            </div>
                            <p className={`text-[9px] font-bold ${etapa.done ? 'text-emerald-700' : 'text-gray-400'}`}>{etapa.label}</p>
                            <p className="text-[9px] text-gray-400 leading-tight">{etapa.sub}</p>
                            {etapa.data && <p className="text-[9px] text-gray-400">{etapa.data}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* â”€â”€ Insights ativos por perfil de contato â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {aprovados.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Insights ativos por gatilho</h3>
          <p className="text-[11px] text-gray-400 mb-3">Aprendizados aprovados aplicados automaticamente pelo motor de IA a cada ligaÃ§Ã£o</p>
          <div className="space-y-2">
            {aprovados.slice(0, 6).map(c => {
              const ligsImpact = ligsAposAprovacao(c)
              const texto = c.frase || c.argumento || 'â€”'
              return (
                <div key={c.id} className="flex items-start gap-3 border border-gray-100 rounded-lg px-3 py-2.5">
                  <CheckCircle size={13} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded font-semibold">{c.gatilho ?? 'â€”'}</span>
                      <span className="text-[10px] text-gray-400">Toda a plataforma Â· {fmtDt(c.aprovado_em ?? c.criado_em)}</span>
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed truncate">{texto}</p>
                  </div>
                  {ligsImpact > 0 && (
                    <span className="text-xs font-bold text-emerald-600 flex-shrink-0">+{ligsImpact} conv.</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* â”€â”€ Banner: sincronizar com CI apÃ³s aprovar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {bannerSync && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <CheckCircle size={15} className="text-emerald-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-emerald-800 font-semibold">Argumento aprovado com sucesso!</p>
            <p className="text-xs text-emerald-700 mt-0.5">Para aplicar nos seus agentes, vÃ¡ em <strong>Meus Agentes â†’ Sincronizar com CI</strong>.</p>
          </div>
          <button onClick={() => setBannerSync(false)} className="text-emerald-500 hover:text-emerald-700">
            <X size={13} />
          </button>
        </div>
      )}

      {/* â”€â”€ SugestÃµes da rede ETZ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Share2 size={15} className="text-brand-600" />
            <h3 className="text-sm font-semibold text-gray-900">SugestÃµes da rede ETZ</h3>
            {redeData.filter(r => !r.ja_importado).length > 0 && (
              <span className="bg-brand-50 text-brand-700 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                {redeData.filter(r => !r.ja_importado).length} novas
              </span>
            )}
          </div>
          <span className="text-[10px] text-gray-400">Argumentos aprovados por outros clientes ETZ â€” 100% anÃ´nimos</span>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Estes argumentos foram validados por outros clientes da plataforma e geraram conversÃµes reais. Ao importar, eles entram direto como aprovados no seu CI â€” prontos para Sincronizar com CI.
        </p>

        {redeData.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Share2 size={24} className="mx-auto mb-2 opacity-25" />
            <p className="text-xs">Ainda nÃ£o hÃ¡ sugestÃµes disponÃ­veis na rede.</p>
            <p className="text-[11px] mt-0.5">Ã€ medida que outros clientes aprovam argumentos, eles aparecem aqui.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {redeData.map(r => (
              <div key={r.id} className={`border rounded-xl p-3 transition-colors ${r.ja_importado ? 'border-emerald-100 bg-emerald-50/40 opacity-70' : 'border-gray-200 bg-gray-50/30'}`}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-brand-50 text-brand-700 text-[10px] px-2 py-0.5 rounded-full font-semibold">{r.gatilho}</span>
                    <span className="text-[10px] text-gray-400">
                      Aprovado em {r.aprovado_em ? new Date(r.aprovado_em).toLocaleDateString('pt-BR') : 'â€”'}
                    </span>
                    {r.total_ligacoes_impactadas > 0 && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                        +{r.total_ligacoes_impactadas} conv. validadas
                      </span>
                    )}
                  </div>
                  {r.ja_importado
                    ? <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold flex-shrink-0"><CheckCircle size={11} /> Importado</span>
                    : (
                      <button
                        onClick={() => importarDaRede(r.id)}
                        disabled={importando === r.id}
                        className="flex items-center gap-1 bg-brand-600 text-white text-[10px] px-3 py-1.5 rounded-lg hover:bg-brand-700 transition-colors font-semibold disabled:opacity-50 flex-shrink-0"
                      >
                        {importando === r.id ? <Loader2 size={10} className="animate-spin" /> : <ArrowRight size={10} />}
                        Importar para meu CI
                      </button>
                    )
                  }
                </div>
                <div className="bg-white border border-gray-100 rounded-lg p-2.5">
                  <p className="text-xs text-gray-700 leading-relaxed">"{r.frase}"</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

interface PadraoArg {
  id: string
  gatilho: string
  frase: string
  argumento: string
  eficacia: number
  status: string
  criado_em: string
  aprovado_em: string | null
  origem: string
  tipo: string
}

function TabPadroes() {
  const [autoAprovacao, setAutoAprovacao] = useState(false)
  const [threshold, setThreshold] = useState(2)
  const [salvandoAuto, setSalvandoAuto] = useState(false)
  const [salvoAuto, setSalvoAuto] = useState(false)

  // Carrega config do backend ao montar
  useEffect(() => {
    api.get('https://app.etztech.com/api/v1/inteligencia/auto-aprovacao')
      .then(r => {
        const cfg = r.data as { ativo: boolean; threshold: number }
        setAutoAprovacao(cfg.ativo ?? false)
        setThreshold(cfg.threshold ?? 2)
      })
      .catch(() => {})
  }, [])

  async function toggleAutoAprovacao(val: boolean) {
    setAutoAprovacao(val)
    try {
      await api.post('https://app.etztech.com/api/v1/inteligencia/auto-aprovacao', { ativo: val, threshold })
    } catch { /* silencioso */ }
  }

  async function salvarThreshold() {
    setSalvandoAuto(true)
    try {
      await api.post('https://app.etztech.com/api/v1/inteligencia/auto-aprovacao', { ativo: autoAprovacao, threshold })
      setSalvoAuto(true)
      setTimeout(() => setSalvoAuto(false), 2500)
    } catch { /* silencioso */ }
    finally { setSalvandoAuto(false) }
  }

  const { data: todosArgs = [], isFetching, refetch } = useQuery({
    queryKey: ['padroes-cross'],
    queryFn: () => api.get('https://app.etztech.com/api/v1/inteligencia/cross')
      .then(r => (r.data as PadraoArg[]).sort((a, b) => (b.eficacia || 0) - (a.eficacia || 0)))
      .catch(() => [] as PadraoArg[]),
  })
  // PadrÃµes = comportamentais (sequÃªncias, timing, conduta detectada nas ligaÃ§Ãµes)
  const padroes = todosArgs.filter(p => p.tipo === 'padrao_comportamental')
  const { data: ligsRaw = [] } = useQuery({
    queryKey: ['padroes-ligs'],
    queryFn: () => api.get('https://app.etztech.com/api/v1/ligacoes').then(r => r.data as any[]).catch(() => []),
  })

  const agora = new Date()
  const inicioSemana = new Date(agora); inicioSemana.setDate(agora.getDate() - 7); inicioSemana.setHours(0,0,0,0)

  const aprovados  = padroes.filter(p => p.status === 'aprovado')
  const pendentes  = padroes.filter(p => p.status === 'pendente')
  const novosSemana = padroes.filter(p => new Date(p.criado_em) >= inicioSemana).length
  const totalLigs  = (ligsRaw as any[]).length

  const eficaciaMedia = aprovados.length > 0
    ? Math.round(aprovados.reduce((s, p) => s + (p.eficacia || 0), 0) / aprovados.length)
    : 0

  // PadrÃ£o crÃ­tico: maior eficacia entre os aprovados
  const topPadrao = aprovados[0]
  const temAlertaCritico = topPadrao && (topPadrao.eficacia || 0) >= 2

  const fmtDt = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })

  const badgeStatus = (p: PadraoArg) => {
    if (p.status === 'aprovado') return { label: 'Ativo', cls: 'bg-emerald-50 text-emerald-700' }
    return { label: 'Aguardando aprovaÃ§Ã£o', cls: 'bg-amber-50 text-amber-700' }
  }

  const impactoCor = (ef: number) => {
    if (ef >= 2) return 'bg-emerald-500'
    if (ef >= 1) return 'bg-blue-500'
    if (ef > 0)  return 'bg-amber-400'
    return 'bg-gray-300'
  }

  const impactoLabel = (ef: number) => {
    if (ef >= 2)  return `${ef.toFixed(1)}x`
    if (ef > 0)   return `+${Math.round(ef * 100)}%`
    return 'â€”'
  }

  return (
    <div className="space-y-4">

      {/* â”€â”€ Header branco premium â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
            <GitBranch size={20} className="text-purple-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-base font-semibold text-gray-900">DetecÃ§Ã£o de PadrÃµes</h2>
              <span className="bg-purple-50 text-purple-700 text-[10px] px-2 py-0.5 rounded-full font-semibold">MOTOR DE IA</span>
            </div>
            <p className="text-xs text-gray-500">
              O sistema analisa cada ligaÃ§Ã£o e descobre sequÃªncias de objeÃ§Ãµes, timing e comportamentos do lead que precedem o agendamento â€” insights que nenhum humano perceberia com esse volume de dados. SÃ£o padrÃµes de <strong>como conduzir</strong> a conversa, nÃ£o frases prontas. As frases prontas ficam na aba Cross.
            </p>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40 flex-shrink-0"
          >
            <RefreshCw size={11} className={isFetching ? 'animate-spin' : ''} />
            Atualizar
          </button>
        </div>

        {/* KPIs reais */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          {[
            { label: 'PadrÃµes detectados', value: padroes.length > 0 ? String(padroes.length) : 'â€”', color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Novos esta semana',  value: novosSemana > 0 ? String(novosSemana) : 'â€”',     color: 'text-brand-600',  bg: 'bg-brand-50' },
            { label: 'EficÃ¡cia mÃ©dia',     value: eficaciaMedia > 0 ? `+${eficaciaMedia}%` : 'â€”',  color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'LigaÃ§Ãµes analisadas', value: totalLigs > 0 ? totalLigs.toLocaleString('pt-BR') : 'â€”', color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map((k, i) => (
            <div key={i} className={`${k.bg} rounded-lg p-3 text-center`}>
              <p className={`text-lg font-bold ${k.color}`}>{k.value}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{k.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* â”€â”€ Auto-aprovaÃ§Ã£o â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${autoAprovacao ? 'bg-emerald-50' : 'bg-gray-100'}`}>
              <Zap size={16} className={autoAprovacao ? 'text-emerald-600' : 'text-gray-400'} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-gray-900">Auto-aprovaÃ§Ã£o de padrÃµes</p>
                {autoAprovacao
                  ? <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">ATIVO</span>
                  : <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-semibold">DESATIVADO</span>
                }
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {autoAprovacao
                  ? `PadrÃµes com eficÃ¡cia â‰¥ ${threshold}x sÃ£o aprovados automaticamente e ficam prontos para Sincronizar com CI.`
                  : 'Quando ativo, padrÃµes com alta eficÃ¡cia sÃ£o aprovados automaticamente â€” sem precisar revisar um por um.'}
              </p>
            </div>
          </div>

          {/* Toggle switch */}
          <button
            onClick={() => toggleAutoAprovacao(!autoAprovacao)}
            className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${autoAprovacao ? 'bg-emerald-500' : 'bg-gray-200'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${autoAprovacao ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* ConfiguraÃ§Ã£o do threshold â€” sÃ³ aparece quando ativo */}
        {autoAprovacao && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-700 mb-3">EficÃ¡cia mÃ­nima para auto-aprovaÃ§Ã£o</p>
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                {[1.5, 2, 2.5, 3].map(v => (
                  <button
                    key={v}
                    onClick={() => setThreshold(v)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-semibold border transition-colors ${threshold === v ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300'}`}
                  >
                    {v}x
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-gray-400 flex-1">
                {threshold === 1.5 && 'PadrÃµes com 50%+ de melhoria â€” mais sugestÃµes, menor certeza.'}
                {threshold === 2   && 'PadrÃµes que dobram a conversÃ£o â€” equilÃ­brio recomendado.'}
                {threshold === 2.5 && 'PadrÃµes muito sÃ³lidos â€” menos aprovaÃ§Ãµes, maior confianÃ§a.'}
                {threshold === 3   && 'Apenas padrÃµes excepcionais â€” aprovaÃ§Ã£o muito conservadora.'}
              </p>
              <button
                onClick={salvarThreshold}
                disabled={salvandoAuto}
                className="flex items-center gap-1.5 text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-colors font-semibold disabled:opacity-50"
              >
                {salvandoAuto ? <Loader2 size={11} className="animate-spin" /> : salvoAuto ? <CheckCircle size={11} /> : null}
                {salvoAuto ? 'Salvo!' : 'Salvar'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* â”€â”€ Alerta crÃ­tico dinÃ¢mico (sÃ³ aparece se hÃ¡ padrÃ£o com eficacia >= 2) â”€â”€ */}
      {temAlertaCritico && topPadrao && (
        <div className="bg-amber-50 border-l-4 border-l-amber-400 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-amber-800 mb-0.5">PadrÃ£o de alto impacto detectado â€” {impactoLabel(topPadrao.eficacia)} de melhoria</p>
              <p className="text-xs text-amber-700 leading-relaxed">
                Gatilho <strong>{topPadrao.gatilho}</strong>: "{(topPadrao.frase || topPadrao.argumento || '').slice(0, 120)}"
                {topPadrao.status === 'pendente'
                  ? ' â€” ainda nÃ£o aprovado. VÃ¡ na aba Cross para aprovar e propagar para os agentes.'
                  : ' â€” jÃ¡ incorporado ao CI dos seus agentes.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ Lista de padrÃµes reais â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">PadrÃµes descobertos â€” por impacto</h3>
          <div className="flex gap-2">
            <span className="text-[10px] text-gray-400">{aprovados.length} ativos Â· {pendentes.length} aguardando aprovaÃ§Ã£o</span>
          </div>
        </div>

        {padroes.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <GitBranch size={28} className="mx-auto mb-2 opacity-25" />
            <p className="text-xs font-medium">Nenhum padrÃ£o comportamental detectado ainda.</p>
            <p className="text-[11px] mt-1 text-gray-400">O sistema detecta padrÃµes automaticamente todo dia Ã s 00:00.<br/>Use o botÃ£o "Detectar padrÃµes" na aba Cross para forÃ§ar uma anÃ¡lise agora.<br/>PadrÃµes aparecem aqui quando hÃ¡ ligaÃ§Ãµes suficientes para identificar correlaÃ§Ãµes.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {padroes.map((p) => {
              const { label: badgeLabel, cls: badgeCls } = badgeStatus(p)
              const texto = p.frase || p.argumento || 'â€”'
              const ef = p.eficacia || 0
              return (
                <div key={p.id} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {ef > 0 && (
                      <span className={`text-white text-[10px] px-2 py-0.5 rounded-full font-bold ${impactoCor(ef)}`}>
                        {impactoLabel(ef)}
                      </span>
                    )}
                    <p className="text-xs text-gray-800 font-semibold flex-1 min-w-0">
                      Gatilho: <span className="text-purple-700">{p.gatilho ?? 'â€”'}</span>
                    </p>
                    <span className="text-[10px] text-gray-400 font-mono">detectado {fmtDt(p.criado_em)}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${badgeCls}`}>{badgeLabel}</span>
                  </div>

                  <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 mb-2">
                    <p className="text-xs text-gray-700 leading-relaxed">"{texto.slice(0, 200)}{texto.length > 200 ? 'â€¦' : ''}"</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {p.status === 'aprovado'
                        ? <><CheckCircle size={11} className="text-emerald-500" /><p className="text-[10px] text-emerald-700 font-medium">Incorporado ao CI Â· aprovado em {fmtDt(p.aprovado_em ?? p.criado_em)}</p></>
                        : <><AlertCircle size={11} className="text-amber-500" /><p className="text-[10px] text-amber-700 font-medium">Pendente de aprovaÃ§Ã£o â€” vÃ¡ na aba Cross</p></>
                      }
                    </div>
                    {p.origem === 'rede_global' && (
                      <span className="text-[10px] text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                        <Share2 size={9} /> Da rede ETZ
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* â”€â”€ Como os padrÃµes viram inteligÃªncia â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Como os padrÃµes viram inteligÃªncia</h3>
        <div className="grid grid-cols-4 gap-3">
          {[
            { n: '1', cor: 'bg-purple-100 text-purple-700', title: 'DetecÃ§Ã£o', desc: 'Sistema analisa transcriÃ§Ãµes e identifica o que converteu â€” argumento, fase, gatilho, tom.' },
            { n: '2', cor: 'bg-amber-100 text-amber-700',   title: 'ValidaÃ§Ã£o', desc: 'PadrÃ£o fica em "aguardando" atÃ© acumular evidÃªncias suficientes. VocÃª aprova na aba Cross.' },
            { n: '3', cor: 'bg-brand-100 text-brand-700',   title: 'PropagaÃ§Ã£o', desc: 'Argumento aprovado entra no CI. Sincronize com CI para aplicar em todos os agentes.' },
            { n: '4', cor: 'bg-emerald-100 text-emerald-700', title: 'Melhoria contÃ­nua', desc: 'Agentes passam a usar o argumento. O resultado retroalimenta o sistema com novos dados.' },
          ].map((s) => (
            <div key={s.n} className="text-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold ${s.cor}`}>{s.n}</div>
              <p className="text-xs font-semibold text-gray-800 mb-1">{s.title}</p>
              <p className="text-[11px] text-gray-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

interface SimResultado {
  id?: string
  agente_nome?: string
  cenario: string
  transcript: { who: string; text: string }[]
  score: number
  objecoes_total: number
  objecoes_aprovadas: number
  gatilhos_detectados: number
  gatilhos_total: number
  duracao_segundos: number
  resultado: 'aprovado' | 'reprovado' | 'inconclusivo'
  score_minimo?: number
  turno_critico?: number | null
  sugestao_melhoria?: string
  feedback_detalhado?: Record<string, string>
  analise: {
    gatilho_principal?: string
    proxima_acao?: string
    sentimento?: string
    probabilidade_agendamento?: number
    pontos_fortes?: string[]
    pontos_melhoria?: string[]
  }
}

interface RelatorioData {
  agente: string
  total: number
  score_geral: number | null
  score_minimo: number
  pronto: boolean
  todos_testados: boolean
  certificado_em: string | null
  cenarios: { id: string; score: number | null; resultado: string; testado: boolean }[]
  pontos_fortes: string[]
  pontos_melhoria: string[]
  sugestoes: { cenario: string; sugestao: string }[]
}

interface CertTodosResultado {
  resultados: { cenario: string; score: number; resultado: string; sugestao?: string; analise?: SimResultado['analise'] }[]
  score_geral: number
  todos_aprovados: boolean
  score_minimo: number
}

const CERT_SCENARIOS = [
  { id: 'preco',      label: 'Pergunta de preÃ§o â€” converter em agendamento' },
  { id: 'fornecedor', label: 'JÃ¡ tem fornecedor â€” apresentar e agendar demonstraÃ§Ã£o' },
  { id: 'decisor',    label: 'NÃ£o Ã© o decisor â€” pegar contato e agendar com decisor' },
  { id: 'urgencia',   label: 'Sem tempo agora â€” criar urgÃªncia ou reagendar' },
  { id: 'negativa',   label: 'Negativa definitiva â€” contornar objeÃ§Ã£o e agendar' },
]

function fmtDuracao(seg: number) {
  const m = Math.floor(seg / 60)
  const s = seg % 60
  return `${m}m${String(s).padStart(2, '0')}s`
}

function TabSimulador() {
  const queryClient = useQueryClient()
  const [modo, setModo] = useState<'automatico' | 'interativo' | 'relatorio'>('automatico')

  // Dados base
  const { data: agentes = [] } = useQuery({
    queryKey: ['agentes-lista'],
    queryFn: () => agentesApi.list().then(r => r.data as { id: string; nome: string; status?: string }[]),
  })
  const { data: historico = [] } = useQuery({
    queryKey: ['inteligencia-simulador'],
    queryFn: () => inteligenciaSimuladorApi.list().then(r => r.data as (SimResultado & { criado_em: string })[]),
  })
  const { data: simConfig, refetch: refetchConfig } = useQuery({
    queryKey: ['simulador-config'],
    queryFn: () => inteligenciaSimuladorApi.getConfig().then(r => r.data as { score_minimo: number }),
  })

  // â”€â”€ Estado geral â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [agenteId, setAgenteId]   = useState('')
  const [cenario, setCenario]     = useState('preco')
  const [scoreMin, setScoreMin]   = useState(75)
  const [loading, setLoading]     = useState(false)
  const [certLoading, setCertLoading] = useState<Record<string, boolean>>({})
  const [certTodosLoading, setCertTodosLoading] = useState(false)
  const [resultado, setResultado] = useState<SimResultado | null>(null)
  const [visibleLines, setVisibleLines] = useState(0)
  const [certResultados, setCertResultados] = useState<Record<string, { score: number; resultado: string; sugestao?: string }>>({})
  const [certTodosResultado, setCertTodosResultado] = useState<CertTodosResultado | null>(null)

  // â”€â”€ Estado modo interativo â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [chatHistorico, setChatHistorico] = useState<{ who: string; text: string }[]>([])
  const [chatInput, setChatInput]         = useState('')
  const [chatLoading, setChatLoading]     = useState(false)
  const [chatAnalise, setChatAnalise]     = useState<{ gatilho?: string; sentimento?: string; fase?: string; probabilidade?: number } | null>(null)

  // â”€â”€ RelatÃ³rio â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [relatorioAgenteId, setRelatorioAgenteId] = useState('')
  const { data: relatorio, isFetching: loadingRel, refetch: refetchRelatorio } = useQuery({
    queryKey: ['simulador-relatorio', relatorioAgenteId],
    queryFn: () => relatorioAgenteId
      ? inteligenciaSimuladorApi.relatorio(relatorioAgenteId).then(r => r.data as RelatorioData)
      : Promise.resolve(null),
    enabled: !!relatorioAgenteId,
  })

  // Sincroniza score_minimo com config carregada
  useEffect(() => {
    if (simConfig?.score_minimo) setScoreMin(simConfig.score_minimo)
  }, [simConfig])

  // Anima transcript
  useEffect(() => {
    if (!resultado) return
    setVisibleLines(0)
    const total = resultado.transcript.length
    let i = 0
    const timer = setInterval(() => { i++; setVisibleLines(i); if (i >= total) clearInterval(timer) }, 350)
    return () => clearInterval(timer)
  }, [resultado])

  // â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const sentimentoCor = (s?: string) =>
    s === 'positivo' ? 'text-emerald-600' : s === 'negativo' ? 'text-red-600' : 'text-gray-600'

  const resultadoBadge = (r: string) =>
    r === 'aprovado' ? 'bg-emerald-100 text-emerald-700'
    : r === 'reprovado' ? 'bg-red-100 text-red-700'
    : r === 'pendente' ? 'bg-gray-100 text-gray-500'
    : 'bg-amber-100 text-amber-700'

  async function salvarScoreMin(val: number) {
    setScoreMin(val)
    await inteligenciaSimuladorApi.setConfig({ score_minimo: val }).catch(() => {})
    refetchConfig()
  }

  // â”€â”€ Rodar simulaÃ§Ã£o individual â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async function rodarSimulacao(cenarioId: string, destino: 'principal' | string = 'principal') {
    if (destino === 'principal') setLoading(true)
    else setCertLoading(p => ({ ...p, [cenarioId]: true }))
    try {
      const res = await inteligenciaSimuladorApi.create({ agente_id: agenteId || null, cenario: cenarioId })
      const data = res.data as SimResultado
      if (destino === 'principal') setResultado(data)
      else setCertResultados(p => ({ ...p, [cenarioId]: { score: data.score, resultado: data.resultado, sugestao: data.sugestao_melhoria } }))
      queryClient.invalidateQueries({ queryKey: ['inteligencia-simulador'] })
    } catch (e) { console.error(e) }
    finally {
      if (destino === 'principal') setLoading(false)
      else setCertLoading(p => ({ ...p, [cenarioId]: false }))
    }
  }

  // â”€â”€ Certificar todos de uma vez â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async function certificarTodos() {
    setCertTodosLoading(true)
    setCertResultados({})
    setCertTodosResultado(null)
    try {
      const res = await inteligenciaSimuladorApi.certificarTodos({ agente_id: agenteId || null })
      const data = res.data as CertTodosResultado
      setCertTodosResultado(data)
      const mapa: Record<string, { score: number; resultado: string; sugestao?: string }> = {}
      data.resultados.forEach(r => { mapa[r.cenario] = { score: r.score, resultado: r.resultado, sugestao: r.sugestao } })
      setCertResultados(mapa)
      queryClient.invalidateQueries({ queryKey: ['inteligencia-simulador'] })
      // Se aprovado, invalida cache de agentes â€” discadora e campanhas refletem imediatamente
      if (data.todos_aprovados) {
        queryClient.invalidateQueries({ queryKey: ['agentes'] })
      }
    } catch (e) { console.error(e) }
    finally { setCertTodosLoading(false) }
  }

  // â”€â”€ Modo interativo â€” enviar mensagem â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async function enviarMensagem() {
    if (!chatInput.trim() || chatLoading) return
    const msg = chatInput.trim()
    setChatInput('')
    const novoHist = [...chatHistorico, { who: 'Lead', text: msg }]
    setChatHistorico(novoHist)
    setChatLoading(true)
    try {
      const res = await inteligenciaSimuladorApi.interativo({
        agente_id: agenteId || null,
        historico: chatHistorico,
        mensagem_lead: msg,
      })
      const data = res.data as { resposta: string; analise: { gatilho?: string; sentimento?: string; fase?: string; probabilidade?: number } }
      setChatHistorico(h => [...h, { who: 'Agente', text: data.resposta }])
      setChatAnalise(data.analise)
    } catch (e) { console.error(e) }
    finally { setChatLoading(false) }
  }

  return (
    <div className="space-y-5">
      {/* â”€â”€ Header â”€â”€ */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                <Play size={14} className="text-blue-600" />
              </div>
              <h2 className="text-base font-bold text-gray-900">Simulador de LigaÃ§Ãµes</h2>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xl">
              Ambiente seguro para treinar e certificar seu agente de IA <span className="text-gray-800 font-medium">antes das primeiras ligaÃ§Ãµes reais</span>. O agente sÃ³ vai para produÃ§Ã£o depois de ser aprovado nos 5 cenÃ¡rios obrigatÃ³rios.
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold font-mono text-gray-900">{historico.length}</p>
            <p className="text-xs text-gray-400">simulaÃ§Ãµes realizadas</p>
          </div>
        </div>
        {/* Como funciona */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { step: '1', title: 'Treine com IA', desc: 'Rode os 5 cenÃ¡rios de objeÃ§Ã£o reais e veja onde o agente acerta ou falha', color: 'bg-blue-50 text-blue-600' },
            { step: '2', title: 'Receba feedback', desc: 'A IA aponta o turno exato onde errou e sugere como corrigir o script', color: 'bg-amber-50 text-amber-600' },
            { step: '3', title: 'Certifique e ative', desc: 'Com score acima do mÃ­nimo em todos os cenÃ¡rios, o agente vai para produÃ§Ã£o', color: 'bg-emerald-50 text-emerald-600' },
          ].map(s => (
            <div key={s.step} className="border border-gray-100 rounded-xl px-3 py-3 flex gap-2.5">
              <span className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${s.color}`}>{s.step}</span>
              <div>
                <p className="text-xs font-semibold text-gray-700">{s.title}</p>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* â”€â”€ ConfiguraÃ§Ã£o: agente + score mÃ­nimo â”€â”€ */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="grid grid-cols-2 gap-6">
          {/* Seletor de agente */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Agente a treinar</label>
            <div className="space-y-1.5">
              {/* OpÃ§Ã£o "Todos" */}
              <button onClick={() => setAgenteId('')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 text-left transition-all ${
                  agenteId === '' ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                }`}>
                <div className="w-7 h-7 rounded-lg bg-gray-200 flex items-center justify-center shrink-0">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-500"><circle cx="8" cy="5" r="2.5"/><path d="M3 13c0-2.76 2.24-5 5-5s5 2.24 5 5"/></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${agenteId === '' ? 'text-blue-700' : 'text-gray-700'}`}>Todos os agentes</p>
                  <p className="text-xs text-gray-400">Simula sem vÃ­nculo</p>
                </div>
                {agenteId === '' && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
              </button>
              {/* Agentes cadastrados */}
              {agentes.map(a => (
                <button key={a.id} onClick={() => setAgenteId(a.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 text-left transition-all ${
                    agenteId === a.id ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                  }`}>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                    a.status === 'em_treinamento' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'
                  }`}>
                    {a.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${agenteId === a.id ? 'text-blue-700' : 'text-gray-700'}`}>{a.nome}</p>
                    <p className="text-xs text-gray-400">{a.status === 'em_treinamento' ? 'Em treinamento' : 'Ativo'}</p>
                  </div>
                  {agenteId === a.id && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
                </button>
              ))}
            </div>
          </div>
          {/* Score mÃ­nimo */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Score mÃ­nimo para aprovaÃ§Ã£o</label>
            <div className="border border-gray-100 bg-gray-50 rounded-xl p-4">
              <div className="flex items-end justify-between mb-3">
                <div>
                  <p className="text-3xl font-bold font-mono text-gray-900">{scoreMin}</p>
                  <p className="text-xs text-gray-400 mt-0.5">de 100 pontos</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${
                  scoreMin >= 85 ? 'bg-red-50 text-red-600' : scoreMin >= 70 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  {scoreMin >= 85 ? 'Exigente' : scoreMin >= 70 ? 'Recomendado' : 'BÃ¡sico'}
                </span>
              </div>
              <input type="range" min={50} max={95} step={5} value={scoreMin}
                onChange={e => setScoreMin(Number(e.target.value))}
                onMouseUp={e => salvarScoreMin(Number((e.target as HTMLInputElement).value))}
                onTouchEnd={e => salvarScoreMin(Number((e.target as HTMLInputElement).value))}
                className="w-full h-1.5 accent-blue-600 cursor-pointer" />
              <div className="flex justify-between text-xs text-gray-300 mt-2">
                <span>50</span><span>75</span><span>95</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">O agente precisa atingir este score em todos os 5 cenÃ¡rios para ser liberado para ligaÃ§Ãµes reais.</p>
          </div>
        </div>
      </div>

      {/* â”€â”€ Tabs de modo â”€â”€ */}
      <div className="grid grid-cols-3 gap-2">
        {([
          { id: 'automatico', label: 'SimulaÃ§Ã£o automÃ¡tica', sub: 'IA roda o cenÃ¡rio completo', icon: <Play size={16}/>, color: 'blue' },
          { id: 'interativo', label: 'Modo interativo', sub: 'VocÃª digita como o lead', icon: <MessageSquare size={16}/>, color: 'purple' },
          { id: 'relatorio',  label: 'RelatÃ³rio de prontidÃ£o', sub: 'Score geral e diagnÃ³stico', icon: <BarChart2 size={16}/>, color: 'emerald' },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setModo(t.id)}
            className={`flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all ${
              modo === t.id
                ? t.color === 'blue'    ? 'border-blue-500 bg-blue-50'
                : t.color === 'purple'  ? 'border-purple-500 bg-purple-50'
                : 'border-emerald-500 bg-emerald-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              modo === t.id
                ? t.color === 'blue'   ? 'bg-blue-600 text-white'
                : t.color === 'purple' ? 'bg-purple-600 text-white'
                : 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-500'
            }`}>
              {t.icon}
            </div>
            <div>
              <p className={`text-sm font-semibold ${modo === t.id ? 'text-gray-900' : 'text-gray-700'}`}>{t.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{t.sub}</p>
            </div>
          </button>
        ))}
      </div>

      {/* â”€â”€ MODO AUTOMÃTICO â”€â”€ */}
      {modo === 'automatico' && (
        <>
          {/* Seletor de cenÃ¡rio + aÃ§Ãµes */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Escolha o cenÃ¡rio</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {CERT_SCENARIOS.map(c => (
                <button key={c.id} onClick={() => setCenario(c.id)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-semibold text-left border-2 transition-all ${
                    cenario === c.id
                      ? 'border-blue-500 bg-blue-50 text-blue-800'
                      : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200'
                  }`}>
                  {c.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => rodarSimulacao(cenario)} disabled={loading}
                className="py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-sm">
                {loading ? <Loader2 size={15} className="animate-spin"/> : <Play size={15}/>}
                {loading ? 'Simulando com IA...' : 'Rodar este cenÃ¡rio'}
              </button>
              <button onClick={certificarTodos} disabled={certTodosLoading}
                className="py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors shadow-sm">
                {certTodosLoading ? <Loader2 size={15} className="animate-spin"/> : <CheckCircle size={15}/>}
                {certTodosLoading ? 'Certificando todos...' : 'Certificar agente â€” 5 cenÃ¡rios'}
              </button>
            </div>
            {certTodosLoading && (
              <div className="mt-3 flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                <Loader2 size={13} className="animate-spin text-emerald-600 shrink-0"/>
                <p className="text-xs text-emerald-700">Rodando os 5 cenÃ¡rios em paralelo com IA â€” aguarde ~20 segundos...</p>
              </div>
            )}
          </div>

          {/* Resultado individual */}
          {resultado && (
            <>
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                {/* Header do resultado */}
                <div className={`px-5 py-3 flex items-center justify-between ${resultado.resultado === 'aprovado' ? 'bg-emerald-50 border-b border-emerald-100' : resultado.resultado === 'reprovado' ? 'bg-red-50 border-b border-red-100' : 'bg-gray-50 border-b border-gray-100'}`}>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Resultado da simulaÃ§Ã£o</p>
                    <h3 className="text-sm font-semibold text-gray-900">{CERT_SCENARIOS.find(c => c.id === resultado.cenario)?.label}</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    {resultado.score_minimo && <span className="text-xs text-gray-400">mÃ­n. {resultado.score_minimo}</span>}
                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${resultadoBadge(resultado.resultado)}`}>
                      {resultado.resultado.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    {[
                      { label: 'Score',    value: String(resultado.score ?? 'â€”'), highlight: true },
                      { label: 'ObjeÃ§Ãµes', value: `${resultado.objecoes_aprovadas}/${resultado.objecoes_total}`, highlight: false },
                      { label: 'Gatilhos', value: `${resultado.gatilhos_detectados}/${resultado.gatilhos_total}`, highlight: false },
                      { label: 'DuraÃ§Ã£o',  value: fmtDuracao(resultado.duracao_segundos), highlight: false },
                    ].map((k, i) => (
                      <div key={i} className={`rounded-xl p-3 text-center ${k.highlight ? 'bg-gray-900' : 'bg-gray-50'}`}>
                        <p className={`text-xl font-mono font-bold ${k.highlight ? 'text-white' : 'text-gray-800'}`}>{k.value}</p>
                        <p className={`text-xs mt-0.5 ${k.highlight ? 'text-gray-400' : 'text-gray-500'}`}>{k.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                    <span className="font-medium">Desempenho geral</span>
                    <span className="font-mono font-bold text-gray-700">{resultado.score ?? 0}/100</span>
                  </div>
                  <Bar pct={resultado.score ?? 0} color={resultado.score >= 80 ? 'bg-emerald-500' : resultado.score >= 60 ? 'bg-amber-400' : 'bg-red-400'} />

                  {resultado.sugestao_melhoria && (
                    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                      <p className="text-xs font-semibold text-blue-700 mb-1">SugestÃ£o de melhoria do script</p>
                      <p className="text-xs text-blue-800 leading-relaxed">{resultado.sugestao_melhoria}</p>
                    </div>
                  )}
                  {resultado.turno_critico && (
                    <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2">
                      <span className="text-amber-500 shrink-0">âš </span>
                      <p className="text-xs text-amber-700">Ponto crÃ­tico no turno {resultado.turno_critico} â€” o agente perdeu a conduÃ§Ã£o da conversa aqui.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Transcript + anÃ¡lise */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">TranscriÃ§Ã£o simulada</p>
                    <div className="bg-gray-950 rounded-xl p-3 space-y-2 font-mono text-xs max-h-56 overflow-y-auto">
                      {resultado.transcript.slice(0, visibleLines).map((t, i) => (
                        <div key={i} className={resultado.turno_critico && Math.ceil((i+1)/2) === resultado.turno_critico ? 'border-l-2 border-amber-400 pl-2' : ''}>
                          <span className={`font-bold ${t.who === 'Agente' ? 'text-blue-400' : 'text-emerald-400'}`}>{t.who}: </span>
                          <span className="text-gray-300">{t.text}</span>
                        </div>
                      ))}
                      {visibleLines < resultado.transcript.length && <span className="text-gray-600 animate-pulse">â–Š</span>}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">AnÃ¡lise IA</p>
                    <div className="space-y-1.5 mb-3">
                      {[
                        { label: 'Gatilho principal', value: resultado.analise?.gatilho_principal || 'â€”', color: 'text-amber-600' },
                        { label: 'PrÃ³xima aÃ§Ã£o',      value: resultado.analise?.proxima_acao      || 'â€”', color: 'text-blue-600' },
                        { label: 'Sentimento',        value: resultado.analise?.sentimento        || 'â€”', color: sentimentoCor(resultado.analise?.sentimento) },
                        { label: 'Prob. agendamento', value: `${resultado.analise?.probabilidade_agendamento ?? 'â€”'}%`, color: 'text-emerald-600' },
                      ].map((item, i) => (
                        <div key={i} className="flex justify-between bg-gray-50 rounded-xl px-3 py-2">
                          <span className="text-xs text-gray-500">{item.label}</span>
                          <span className={`text-xs font-mono font-semibold ${item.color}`}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                    {resultado.analise?.pontos_fortes && resultado.analise.pontos_fortes.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs font-semibold text-emerald-700 mb-1.5">Pontos fortes</p>
                        {resultado.analise.pontos_fortes.map((p, i) => (
                          <p key={i} className="text-xs text-gray-600 flex gap-1.5 mb-1"><span className="text-emerald-500 shrink-0">âœ“</span>{p}</p>
                        ))}
                      </div>
                    )}
                    {resultado.analise?.pontos_melhoria && resultado.analise.pontos_melhoria.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-amber-700 mb-1.5">Pontos de melhoria</p>
                        {resultado.analise.pontos_melhoria.map((p, i) => (
                          <p key={i} className="text-xs text-gray-600 flex gap-1.5 mb-1"><span className="text-amber-500 shrink-0">â†’</span>{p}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* CertificaÃ§Ãµes */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-start justify-between mb-1">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">CertificaÃ§Ãµes obrigatÃ³rias</h3>
                <p className="text-xs text-gray-400 mt-0.5">O agente Ã© liberado para produÃ§Ã£o somente apÃ³s aprovar os 5 cenÃ¡rios abaixo.</p>
              </div>
              <span className="text-xs text-gray-500 bg-gray-100 rounded-lg px-2 py-1 font-mono shrink-0">mÃ­n. {scoreMin}/100</span>
            </div>

            {certTodosResultado && (
              <div className={`mt-3 mb-4 rounded-xl px-4 py-4 border ${certTodosResultado.todos_aprovados ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-bold ${certTodosResultado.todos_aprovados ? 'text-emerald-700' : 'text-red-700'}`}>
                    {certTodosResultado.todos_aprovados ? 'âœ“ Agente certificado e ativado!' : 'âœ— CertificaÃ§Ã£o nÃ£o concluÃ­da'}
                  </span>
                  <span className="text-sm font-mono font-bold text-gray-700">{certTodosResultado.score_geral}/100</span>
                </div>
                <p className={`text-xs ${certTodosResultado.todos_aprovados ? 'text-emerald-600' : 'text-red-600'}`}>
                  {certTodosResultado.todos_aprovados
                    ? 'Status atualizado para ativo â€” o agente jÃ¡ aparece na Discadora e pode ser adicionado a campanhas.'
                    : 'Revise os cenÃ¡rios reprovados e rode novamente atÃ© atingir o score mÃ­nimo em todos.'}
                </p>
              </div>
            )}

            <div className="space-y-2 mt-3">
              {CERT_SCENARIOS.map((c) => {
                const cert = certResultados[c.id]
                const isLoading = certLoading[c.id]
                const aprovado = cert && cert.resultado === 'aprovado'
                const reprovado = cert && cert.resultado === 'reprovado'
                return (
                  <div key={c.id} className={`border-2 rounded-xl px-4 py-3 transition-colors ${aprovado ? 'border-emerald-200 bg-emerald-50' : reprovado ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-gray-50'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${aprovado ? 'bg-emerald-500 text-white' : reprovado ? 'bg-red-400 text-white' : 'bg-gray-200 text-gray-500'}`}>
                          {aprovado ? 'âœ“' : reprovado ? 'âœ—' : '?'}
                        </div>
                        <span className="text-xs font-medium text-gray-700">{c.label}</span>
                      </div>
                      {cert ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-gray-700">{cert.score}/100</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${resultadoBadge(cert.resultado)}`}>
                            {cert.resultado.toUpperCase()}
                          </span>
                          <button onClick={() => rodarSimulacao(c.id, c.id)} disabled={isLoading}
                            className="text-xs text-gray-400 hover:text-gray-600 px-1" title="Repetir">â†º</button>
                        </div>
                      ) : (
                        <button onClick={() => rodarSimulacao(c.id, c.id)} disabled={isLoading}
                          className="bg-white text-gray-700 text-xs px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-60 flex items-center gap-1.5 font-medium shadow-sm">
                          {isLoading ? <Loader2 size={10} className="animate-spin"/> : null}
                          {isLoading ? 'Testando...' : 'Testar cenÃ¡rio'}
                        </button>
                      )}
                    </div>
                    {cert?.sugestao && reprovado && (
                      <p className="text-xs text-red-700 mt-2 italic pl-9">â†’ {cert.sugestao}</p>
                    )}
                  </div>
                )
              })}
            </div>

            {Object.keys(certResultados).length < CERT_SCENARIOS.length && (
              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-2">
                <span className="text-amber-500 shrink-0">âš </span>
                <p className="text-xs text-amber-700">O agente nÃ£o pode ir para produÃ§Ã£o com certificaÃ§Ãµes pendentes. Teste todos os 5 cenÃ¡rios.</p>
              </div>
            )}
          </div>

          {/* HistÃ³rico */}
          {historico.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">HistÃ³rico de simulaÃ§Ãµes</p>
              <div className="space-y-1.5">
                {historico.slice(0, 8).map((h, i) => (
                  <div key={i} className="flex items-center justify-between text-xs bg-gray-50 rounded-xl px-3 py-2">
                    <div>
                      <span className="font-medium text-gray-700">{CERT_SCENARIOS.find(c => c.id === h.cenario)?.label || h.cenario || 'â€”'}</span>
                      <span className="text-gray-400 ml-2">{h.agente_nome || 'â€”'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-gray-600">{h.score ?? 'â€”'}</span>
                      <span className={`px-2 py-0.5 rounded-full font-semibold ${resultadoBadge(h.resultado || 'inconclusivo')}`}>
                        {(h.resultado || 'inconclusivo').toUpperCase()}
                      </span>
                      <span className="text-gray-400">{new Date(h.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* â”€â”€ MODO INTERATIVO â”€â”€ */}
      {modo === 'interativo' && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Modo interativo â€” vocÃª Ã© o lead</h3>
              <p className="text-xs text-gray-400 mt-0.5">Digite como se fosse o cliente. O agente responde com a IA real configurada para ele.</p>
            </div>
            <button onClick={() => { setChatHistorico([]); setChatAnalise(null) }}
              className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl px-3 py-1.5 hover:bg-gray-50 transition-colors">
              Reiniciar
            </button>
          </div>

          <div className="p-5">
            {/* Chat */}
            <div className="bg-gray-950 rounded-2xl p-4 min-h-48 max-h-80 overflow-y-auto space-y-3 mb-4 font-mono text-xs">
              {chatHistorico.length === 0 && (
                <p className="text-gray-600 text-center py-10">Digite sua primeira mensagem como lead para iniciar a simulaÃ§Ã£o...</p>
              )}
              {chatHistorico.map((m, i) => (
                <div key={i} className={`flex ${m.who === 'Lead' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-xl px-3 py-2 ${m.who === 'Lead' ? 'bg-blue-900 text-blue-100' : 'bg-gray-800 text-gray-200'}`}>
                    <span className={`text-xs font-bold block mb-0.5 ${m.who === 'Lead' ? 'text-blue-300' : 'text-emerald-400'}`}>{m.who}</span>
                    {m.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-800 rounded-xl px-3 py-2">
                    <span className="text-emerald-400 text-xs font-bold block mb-0.5">Agente</span>
                    <span className="text-gray-500 animate-pulse">digitando...</span>
                  </div>
                </div>
              )}
            </div>

            {/* AnÃ¡lise em tempo real */}
            {chatAnalise && (
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[
                  { label: 'Gatilho', value: chatAnalise.gatilho || 'â€”', color: 'text-amber-600' },
                  { label: 'Sentimento', value: chatAnalise.sentimento || 'â€”', color: sentimentoCor(chatAnalise.sentimento) },
                  { label: 'Fase', value: chatAnalise.fase || 'â€”', color: 'text-purple-600' },
                  { label: 'Prob.', value: `${chatAnalise.probabilidade ?? 'â€”'}%`, color: 'text-emerald-600' },
                ].map((item, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl px-2 py-2 text-center">
                    <p className={`text-xs font-mono font-bold ${item.color}`}>{item.value}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && enviarMensagem()}
                placeholder="Digite como o lead... (Enter para enviar)"
                disabled={chatLoading}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 disabled:opacity-60 bg-gray-50"
              />
              <button onClick={enviarMensagem} disabled={chatLoading || !chatInput.trim()}
                className="bg-blue-600 text-white rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 flex items-center gap-1 shadow-sm">
                {chatLoading ? <Loader2 size={15} className="animate-spin"/> : <Send size={15}/>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ RELATÃ“RIO DE PRONTIDÃƒO â”€â”€ */}
      {modo === 'relatorio' && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Selecione o agente</p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <select value={relatorioAgenteId} onChange={e => setRelatorioAgenteId(e.target.value)}
                  className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 bg-gray-50 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 cursor-pointer pr-8">
                  <option value="">Selecione um agente...</option>
                  {agentes.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M6 8L1 3h10L6 8z"/></svg>
                </div>
              </div>
              <button onClick={() => refetchRelatorio()} disabled={!relatorioAgenteId || loadingRel}
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors">
                {loadingRel ? <Loader2 size={14} className="animate-spin"/> : 'â†º'}
              </button>
            </div>
          </div>

          {loadingRel && (
            <div className="flex items-center justify-center py-12 gap-2 text-gray-400 text-sm">
              <Loader2 size={18} className="animate-spin"/> Gerando relatÃ³rio...
            </div>
          )}

          {relatorio && !loadingRel && (
            <>
              {/* Status geral */}
              <div className={`rounded-2xl p-6 text-white ${relatorio.pronto ? 'bg-emerald-600' : 'bg-gray-800'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-widest opacity-60 mb-2">Status do agente</p>
                    <p className="text-xl font-bold">{relatorio.pronto ? 'âœ“ Pronto para produÃ§Ã£o' : 'â³ Em treinamento'}</p>
                    <p className="text-sm opacity-60 mt-1.5 leading-relaxed">
                      {relatorio.pronto
                        ? `Certificado em ${new Date(relatorio.certificado_em!).toLocaleDateString('pt-BR')}`
                        : relatorio.todos_testados
                        ? 'Todos os cenÃ¡rios testados, mas score abaixo do mÃ­nimo em algum'
                        : `${relatorio.cenarios.filter(c => c.testado).length}/5 cenÃ¡rios testados`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-bold font-mono">{relatorio.score_geral ?? 'â€”'}</p>
                    <p className="text-xs opacity-50 mt-1">score geral / mÃ­n. {relatorio.score_minimo}</p>
                  </div>
                </div>
              </div>

              {/* CenÃ¡rios */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">CenÃ¡rios obrigatÃ³rios</p>
                <div className="space-y-2">
                  {relatorio.cenarios.map(c => {
                    const label = CERT_SCENARIOS.find(s => s.id === c.id)?.label || c.id
                    const ok = c.testado && c.resultado === 'aprovado'
                    return (
                      <div key={c.id} className={`flex items-center gap-3 border-2 rounded-xl px-4 py-2.5 ${!c.testado ? 'border-gray-100 bg-gray-50' : ok ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${!c.testado ? 'bg-gray-200 text-gray-400' : ok ? 'bg-emerald-500 text-white' : 'bg-red-400 text-white'}`}>
                          {!c.testado ? '?' : ok ? 'âœ“' : 'âœ—'}
                        </div>
                        <span className="text-xs font-medium text-gray-700 flex-1">{label}</span>
                        {c.testado ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-gray-700">{c.score ?? 'â€”'}/100</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${resultadoBadge(c.resultado)}`}>
                              {c.resultado.toUpperCase()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">NÃ£o testado</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Pontos fortes e de melhoria */}
              <div className="grid grid-cols-2 gap-4">
                {relatorio.pontos_fortes.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-2xl p-5">
                    <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-3">Pontos fortes</p>
                    <ul className="space-y-2">
                      {relatorio.pontos_fortes.map((p, i) => (
                        <li key={i} className="text-xs text-gray-600 flex gap-2"><span className="text-emerald-500 shrink-0 mt-0.5">âœ“</span>{p}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {relatorio.pontos_melhoria.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-2xl p-5">
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-3">Pontos de melhoria</p>
                    <ul className="space-y-2">
                      {relatorio.pontos_melhoria.map((p, i) => (
                        <li key={i} className="text-xs text-gray-600 flex gap-2"><span className="text-amber-500 shrink-0 mt-0.5">â†’</span>{p}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* SugestÃµes acionÃ¡veis */}
              {relatorio.sugestoes.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">SugestÃµes para o script</p>
                  <div className="space-y-2">
                    {relatorio.sugestoes.map((s, i) => (
                      <div key={i} className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                        <p className="text-xs font-semibold text-blue-700 mb-1">{CERT_SCENARIOS.find(c => c.id === s.cenario)?.label || s.cenario}</p>
                        <p className="text-xs text-blue-800 leading-relaxed">{s.sugestao}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {relatorio.total === 0 && (
                <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
                  <p className="text-gray-400 text-sm">Nenhuma simulaÃ§Ã£o realizada para este agente ainda.</p>
                  <p className="text-gray-400 text-xs mt-1">Use a aba "SimulaÃ§Ã£o automÃ¡tica" para rodar os cenÃ¡rios.</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function TabICP() {
  const navigate = useNavigate()
  const { data: perfil, isLoading } = useQuery({
    queryKey: ['icp-perfil'],
    queryFn: () => inteligenciaApi.getIcpPerfil().then(r => r.data as {
      total: number; atualizado: string;
      top: { setor: string; cargo: string; estado: string };
      setores: { label: string; total: number; sucesso: number; pct: number }[];
      cargos:  { label: string; total: number; sucesso: number; pct: number }[];
      estados: { label: string; total: number; sucesso: number; pct: number }[];
    }),
    staleTime: 60000,
  })

  const setores  = perfil?.setores  ?? []
  const cargos   = perfil?.cargos   ?? []
  const estados  = perfil?.estados  ?? []
  const semDados = perfil?.total === 0

  function exportarCSV() {
    const rows = setores.map(s => `${s.label},${s.total},${s.sucesso},${s.pct}`)
    const csv  = 'Setor,Total,ConversÃµes,Taxa%\n' + rows.join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href = url; a.download = 'icp-export.csv'; a.click()
  }

  return (
    <div className="space-y-4">

      {/* â”€â”€ Header â”€â”€ */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
                <Target size={14} className="text-purple-600" />
              </div>
              <h2 className="text-base font-bold text-gray-900">Perfil de Cliente Ideal â€” ICP</h2>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xl">
              A IA analisa todas as ligaÃ§Ãµes realizadas e identifica <span className="text-gray-800 font-medium">quais perfis de empresa e cargo convertem mais</span>. Esse perfil alimenta automaticamente a Discadora e as Campanhas.
            </p>
          </div>
          <div className="text-right shrink-0">
            {perfil && perfil.total > 0 ? (
              <>
                <p className="text-2xl font-bold font-mono text-gray-900">{perfil.total.toLocaleString('pt-BR')}</p>
                <p className="text-xs text-gray-400">ligaÃ§Ãµes analisadas</p>
              </>
            ) : (
              <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">Sem dados ainda</span>
            )}
          </div>
        </div>
        {/* ConexÃµes */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { title: 'Discadora', desc: 'Score ICP exibido em cada ligaÃ§Ã£o ao vivo e no histÃ³rico', color: 'bg-blue-50 text-blue-600', dot: 'bg-blue-500' },
            { title: 'Campanhas', desc: 'ICP mÃ­nimo configurÃ¡vel por campanha â€” filtro automÃ¡tico de leads', color: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-500' },
            { title: 'RelatÃ³rios', desc: 'Taxa de conversÃ£o por perfil para refinar a lista de prospecÃ§Ã£o', color: 'bg-amber-50 text-amber-600', dot: 'bg-amber-500' },
          ].map(c => (
            <div key={c.title} className="border border-gray-100 rounded-xl px-3 py-3 flex gap-2.5">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${c.color}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-700">{c.title}</p>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{c.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 gap-2 text-gray-400 text-sm">
          <Loader2 size={18} className="animate-spin" /> Analisando ligaÃ§Ãµes...
        </div>
      ) : semDados ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
          <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Target size={22} className="text-purple-400" />
          </div>
          <p className="text-gray-700 font-semibold text-sm mb-1">Nenhuma ligaÃ§Ã£o analisada ainda</p>
          <p className="text-gray-400 text-xs max-w-sm mx-auto leading-relaxed">
            O ICP Ã© calculado automaticamente apÃ³s as primeiras ligaÃ§Ãµes. Inicie uma campanha na Discadora e os dados aparecerÃ£o aqui em tempo real.
          </p>
          <button onClick={() => navigate('/campanhas')}
            className="mt-4 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-xl transition-colors">
            Criar primeira campanha â†’
          </button>
        </div>
      ) : (
        <>
          {/* Top picks */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Setor com mais conversÃµes', value: perfil?.top.setor ?? 'â€”', icon: <Target size={16}/>, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
              { label: 'Cargo do decisor ideal',    value: perfil?.top.cargo  ?? 'â€”', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="5" r="2.5"/><path d="M3 13c0-2.76 2.24-5 5-5s5 2.24 5 5"/></svg>, color: 'text-blue-600 bg-blue-50 border-blue-100' },
              { label: 'Estado com mais negÃ³cios',  value: perfil?.top.estado ?? 'â€”', icon: <MapPin size={16}/>, color: 'text-purple-600 bg-purple-50 border-purple-100' },
            ].map((k, i) => (
              <div key={i} className={`border-2 rounded-2xl p-4 ${k.color}`}>
                <div className="flex items-center gap-2 mb-2">
                  {k.icon}
                  <p className="text-xs font-medium opacity-70">{k.label}</p>
                </div>
                <p className="text-lg font-bold truncate">{k.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* ConversÃ£o por setor */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">ConversÃ£o por setor</p>
                  <p className="text-xs text-gray-400 mt-0.5">Taxa de agendamentos por segmento de mercado</p>
                </div>
                <button onClick={exportarCSV} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 border border-blue-100 bg-blue-50 rounded-lg px-2 py-1">
                  <Download size={11}/> CSV
                </button>
              </div>
              <div className="space-y-3">
                {setores.map((s, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-700 font-medium flex items-center gap-1.5">
                        {i === 0 && <span className="bg-amber-100 text-amber-700 text-2xs font-bold px-1.5 py-0.5 rounded-full">TOP</span>}
                        {s.label}
                      </span>
                      <span className="font-mono font-bold text-gray-900">{s.pct}%</span>
                    </div>
                    <Bar pct={s.pct} color={i === 0 ? 'bg-emerald-500' : i === 1 ? 'bg-blue-400' : 'bg-gray-300'} />
                    <p className="text-xs text-gray-400 mt-0.5">{s.total} ligaÃ§Ãµes Â· {s.sucesso} agendamentos</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {/* Por cargo */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Por cargo do decisor</p>
                <p className="text-xs text-gray-400 mb-3">Quais cargos agendaram mais</p>
                <div className="space-y-2.5">
                  {cargos.slice(0, 5).map((c, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-700 font-medium truncate max-w-[150px] flex items-center gap-1.5">
                          {i === 0 && <span className="bg-purple-100 text-purple-700 text-2xs font-bold px-1.5 py-0.5 rounded-full">TOP</span>}
                          {c.label}
                        </span>
                        <span className="font-mono font-bold text-gray-900">{c.pct}%</span>
                      </div>
                      <Bar pct={c.pct} color={i === 0 ? 'bg-purple-500' : 'bg-purple-200'} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Por estado */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Por estado / regiÃ£o</p>
                <p className="text-xs text-gray-400 mb-3">ConcentraÃ§Ã£o geogrÃ¡fica dos agendamentos</p>
                <div className="space-y-2.5">
                  {estados.slice(0, 4).map((e, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-700 font-medium flex items-center gap-1.5">
                          {i === 0 && <span className="bg-amber-100 text-amber-700 text-2xs font-bold px-1.5 py-0.5 rounded-full">TOP</span>}
                          {e.label}
                        </span>
                        <span className="font-mono font-bold text-gray-900">{e.pct}%</span>
                      </div>
                      <Bar pct={e.pct} color={i === 0 ? 'bg-amber-400' : 'bg-amber-200'} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RecomendaÃ§Ã£o estratÃ©gica */}
          {perfil && perfil.total > 0 && (
            <div className="bg-white border-2 border-blue-100 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="#2563eb" strokeWidth="2"><path d="M8 1v14M1 8h14"/></svg>
                    </div>
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">RecomendaÃ§Ã£o estratÃ©gica</p>
                  </div>
                  <p className="text-sm font-bold text-gray-900 mb-1">
                    Foque em <span className="text-blue-600">{perfil.top.setor}</span> no estado <span className="text-blue-600">{perfil.top.estado}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    Decisor ideal: <span className="font-semibold text-gray-700">{perfil.top.cargo}</span> Â· {setores[0]?.pct ?? 0}% de conversÃ£o nesse perfil
                  </p>
                </div>
                <button
                  className="bg-blue-600 text-white text-xs px-4 py-2 rounded-xl font-semibold hover:bg-blue-700 transition-colors shrink-0 shadow-sm"
                  onClick={() => navigate('/campanhas')}
                >Criar campanha â†’</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

const TRECHOS = [
  { id: 'abertura',           label: 'Abertura da ligaÃ§Ã£o',       desc: 'Primeiros 15 segundos â€” antes de qualquer objeÃ§Ã£o' },
  { id: 'objecao_preco',      label: 'ObjeÃ§Ã£o de preÃ§o',          desc: 'Lead pergunta o valor ou diz que estÃ¡ caro' },
  { id: 'objecao_fornecedor', label: 'ObjeÃ§Ã£o de fornecedor',     desc: 'Lead jÃ¡ tem outro fornecedor e estÃ¡ satisfeito' },
  { id: 'urgencia',           label: 'CriaÃ§Ã£o de urgÃªncia',       desc: 'Lead diz que nÃ£o tem tempo ou quer deixar para depois' },
  { id: 'fechamento',         label: 'Fechamento para reuniÃ£o',   desc: 'Momento de pedir o agendamento' },
]

interface AbTeste {
  id: string; nome: string; trecho: string; status: string; vencedor: string | null
  versao_a_nome: string; versao_a_script: string
  versao_b_nome: string; versao_b_script: string
  amostra_alvo: number; ligacoes_a: number; ligacoes_b: number
  agendamentos_a: number; agendamentos_b: number
  criado_em: string; concluido_em: string | null
  agentes?: { nome: string }
}

function taxaConv(agendamentos: number, ligacoes: number) {
  if (!ligacoes) return 0
  return Math.round((agendamentos / ligacoes) * 100)
}

function impacto(a: AbTeste) {
  const tA = taxaConv(a.agendamentos_a, a.ligacoes_a)
  const tB = taxaConv(a.agendamentos_b, a.ligacoes_b)
  const diff = tB - tA
  if (!diff) return null
  return { diff, venceB: diff > 0 }
}

function TabAB() {
  const queryClient = useQueryClient()
  const { data: agentes = [] } = useQuery({ queryKey: ['agentes'], queryFn: () => agentesApi.list().then(r => r.data as { id: string; nome: string }[]) })

  // â”€â”€ Form state
  const [nome, setNome]       = useState('')
  const [trecho, setTrecho]   = useState('abertura')
  const [agenteId, setAgenteId] = useState('')
  const [amostra, setAmostra] = useState(100)
  const [vA, setVA]           = useState('')
  const [vANome, setVANome]   = useState('')
  const [vB, setVB]           = useState('')
  const [vBNome, setVBNome]   = useState('')
  const [gerando, setGerando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [racional, setRacional] = useState('')
  const [erro, setErro]       = useState('')
  const [sucesso, setSucesso] = useState('')
  const [expandido, setExpandido] = useState<string | null>(null)
  const [cicloFechado, setCicloFechado] = useState<{ nome: string; vencedor: string } | null>(null)

  // â”€â”€ Dados do banco
  const { data: testes = [], refetch } = useQuery<AbTeste[]>({
    queryKey: ['ab-testes'],
    queryFn: () => inteligenciaApi.abList().then(r => r.data),
    staleTime: 30000,
  })

  const ativos    = testes.filter(t => t.status === 'em_curso')
  const historico = testes.filter(t => t.status !== 'em_curso')

  async function gerarComIA() {
    if (!trecho) return
    setGerando(true); setErro(''); setRacional('')
    try {
      const res = await inteligenciaApi.abGerar({ agente_id: agenteId || null, trecho })
      const d = res.data as { versao_a_nome: string; versao_a_script: string; versao_b_nome: string; versao_b_script: string; racional: string }
      setVANome(d.versao_a_nome); setVA(d.versao_a_script)
      setVBNome(d.versao_b_nome); setVB(d.versao_b_script)
      setRacional(d.racional)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error
        || (e as { message?: string })?.message
        || 'Erro ao gerar sugestÃµes.'
      setErro(msg)
    } finally { setGerando(false) }
  }

  async function iniciar() {
    if (!nome || !vA || !vB) { setErro('Preencha nome e os dois scripts antes de iniciar.'); return }
    setSalvando(true); setErro('')
    try {
      await inteligenciaApi.abCreate({ nome, trecho, agente_id: agenteId || null, versao_a_nome: vANome || 'VersÃ£o A', versao_a_script: vA, versao_b_nome: vBNome || 'VersÃ£o B', versao_b_script: vB, amostra_alvo: amostra })
      setSucesso('Experimento iniciado!'); setNome(''); setVA(''); setVB(''); setVANome(''); setVBNome(''); setRacional('')
      queryClient.invalidateQueries({ queryKey: ['ab-testes'] })
      setTimeout(() => setSucesso(''), 3000)
    } catch { setErro('Erro ao criar experimento.') }
    finally { setSalvando(false) }
  }

  async function encerrar(id: string, vencedor: string, nomeExperimento: string) {
    const res = await inteligenciaApi.abPatch(id, { status: 'concluido', vencedor })
    const d = res.data as { cross_argumento_criado?: boolean }
    if (d?.cross_argumento_criado) {
      setCicloFechado({ nome: nomeExperimento, vencedor })
      queryClient.invalidateQueries({ queryKey: ['cross-argumentos'] })
    }
    refetch()
  }

  async function pausar(id: string, status: string) {
    await inteligenciaApi.abPatch(id, { status: status === 'em_curso' ? 'pausado' : 'em_curso' })
    refetch()
  }

  return (
    <div className="space-y-4">

      {/* â”€â”€ Header â”€â”€ */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
                <GitBranch size={14} className="text-purple-600" />
              </div>
              <h2 className="text-base font-bold text-gray-900">Testes A/B de Script</h2>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xl">
              Teste duas abordagens diferentes em ligaÃ§Ãµes reais e descubra qual converte mais. A IA gera as duas versÃµes automaticamente â€” vocÃª revisa e inicia.
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold font-mono text-gray-900">{ativos.length}</p>
            <p className="text-xs text-gray-400">experimento{ativos.length !== 1 ? 's' : ''} ativo{ativos.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { step: '1', title: 'Escolha o trecho', desc: 'Abertura, objeÃ§Ã£o, urgÃªncia ou fechamento', color: 'bg-blue-50 text-blue-600' },
            { step: '2', title: 'IA gera A e B', desc: 'Claude cria duas abordagens distintas com base no CI e ICP', color: 'bg-purple-50 text-purple-600' },
            { step: '3', title: 'Resultado em dias', desc: 'Com 400+ ligaÃ§Ãµes/dia, vocÃª valida em 2-3 dias', color: 'bg-emerald-50 text-emerald-600' },
          ].map(s => (
            <div key={s.step} className="border border-gray-100 rounded-xl px-3 py-3 flex gap-2.5">
              <span className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${s.color}`}>{s.step}</span>
              <div>
                <p className="text-xs font-semibold text-gray-700">{s.title}</p>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* â”€â”€ Criar novo experimento â”€â”€ */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">

        {/* CabeÃ§alho da seÃ§Ã£o */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-purple-50 rounded-lg flex items-center justify-center">
              <Play size={11} className="text-purple-600" />
            </div>
            <span className="text-sm font-semibold text-gray-800">Novo experimento</span>
          </div>
          <span className="text-xs text-gray-400">Preencha os campos e inicie o teste</span>
        </div>

        <div className="p-6 space-y-5">

          {/* Nome */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Nome do experimento</label>
            <input value={nome} onChange={e => setNome(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-300 placeholder-gray-300 transition-all"
              placeholder="Ex: Abertura consultiva vs. direta" />
          </div>

          {/* Trecho */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Trecho a testar</label>
            <div className="grid grid-cols-5 gap-2">
              {TRECHOS.map(t => (
                <button key={t.id} onClick={() => setTrecho(t.id)}
                  className={`text-left rounded-xl px-3 py-3 border-2 transition-all ${
                    trecho === t.id
                      ? 'border-purple-400 bg-purple-50 shadow-sm'
                      : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                  }`}>
                  <p className={`text-xs font-semibold leading-snug ${trecho === t.id ? 'text-purple-700' : 'text-gray-700'}`}>{t.label}</p>
                  <p className="text-xs text-gray-400 mt-1 leading-tight">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Agente */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">
              Agente <span className="text-gray-300 font-normal normal-case">(opcional â€” deixe em branco para todos)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setAgenteId('')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  agenteId === ''
                    ? 'bg-gray-800 text-white border-gray-800'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}>
                Todos os agentes
              </button>
              {agentes.map(a => (
                <button key={a.id} onClick={() => setAgenteId(a.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    agenteId === a.id
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-purple-200 hover:text-purple-600'
                  }`}>
                  {a.nome}
                </button>
              ))}
            </div>
          </div>

          {/* BotÃ£o gerar com IA */}
          <button onClick={gerarComIA} disabled={gerando}
            className={`w-full rounded-xl py-3.5 text-sm font-semibold flex items-center justify-center gap-2 transition-all border-2 border-dashed ${
              gerando
                ? 'border-purple-200 bg-purple-50 text-purple-400 cursor-not-allowed'
                : 'border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100 hover:border-purple-400'
            }`}>
            {gerando
              ? <><Loader2 size={15} className="animate-spin" /> Gerando sugestÃµes com IA...</>
              : <><Sparkles size={15} /> Gerar versÃµes A e B com IA</>}
          </button>

          {/* Racional */}
          {racional && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex gap-3">
              <Brain size={15} className="text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-blue-700 mb-0.5">Por que essas duas versÃµes?</p>
                <p className="text-xs text-blue-700 leading-relaxed opacity-80">{racional}</p>
              </div>
            </div>
          )}

          {/* Cards A e B */}
          <div className="grid grid-cols-2 gap-3">
            {([
              { label: 'VersÃ£o A', nomeVal: vANome, setNomeVal: setVANome, scriptVal: vA, setScriptVal: setVA,
                ring: 'ring-blue-400', bg: 'bg-blue-50', border: 'border-blue-200', pill: 'bg-blue-100 text-blue-700', dot: 'bg-blue-400' },
              { label: 'VersÃ£o B', nomeVal: vBNome, setNomeVal: setVBNome, scriptVal: vB, setScriptVal: setVB,
                ring: 'ring-emerald-400', bg: 'bg-emerald-50', border: 'border-emerald-200', pill: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-400' },
            ] as const).map((v, i) => (
              <div key={i} className={`rounded-xl border-2 ${v.border} ${v.bg} overflow-hidden`}>
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/60">
                  <span className={`w-2 h-2 rounded-full ${v.dot}`} />
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${v.pill}`}>{v.label}</span>
                  <input value={v.nomeVal} onChange={e => v.setNomeVal(e.target.value)}
                    className="flex-1 text-xs font-medium text-gray-600 bg-transparent outline-none placeholder-gray-400"
                    placeholder="Nome desta versÃ£o..." />
                </div>
                <textarea rows={5} value={v.scriptVal} onChange={e => v.setScriptVal(e.target.value)}
                  className="w-full text-sm text-gray-700 bg-transparent outline-none resize-none leading-relaxed px-4 py-3 placeholder-gray-400"
                  placeholder={`Script da ${v.label.toLowerCase()}...`} />
              </div>
            ))}
          </div>

          {/* Amostra + botÃ£o iniciar */}
          <div className="flex items-end gap-5 pt-1">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tamanho da amostra</label>
                <span className="text-sm font-bold font-mono text-gray-800">{amostra} ligaÃ§Ãµes</span>
              </div>
              <input type="range" min={50} max={500} step={50} value={amostra} onChange={e => setAmostra(Number(e.target.value))}
                className="w-full h-1.5 accent-purple-600 cursor-pointer" />
              <p className="text-xs text-gray-400 mt-1.5">
                â‰ˆ {Math.ceil(amostra / 400)} dia{Math.ceil(amostra / 400) > 1 ? 's' : ''} com volume normal
              </p>
            </div>
            <button onClick={iniciar} disabled={salvando}
              className="bg-purple-600 hover:bg-purple-700 text-white px-7 py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 flex items-center gap-2 shadow-sm whitespace-nowrap">
              {salvando ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
              Iniciar experimento
            </button>
          </div>

          {erro   && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <AlertCircle size={14} className="text-red-500 shrink-0" />
              <p className="text-xs text-red-600">{erro}</p>
            </div>
          )}
          {sucesso && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
              <CheckCircle size={14} className="text-emerald-600 shrink-0" />
              <p className="text-xs text-emerald-700 font-medium">{sucesso}</p>
            </div>
          )}

        </div>
      </div>

      {/* â”€â”€ Banner ciclo fechado â”€â”€ */}
      {cicloFechado && (
        <div className="bg-white border-2 border-emerald-200 rounded-2xl p-5 flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
              <CheckCircle size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 mb-0.5">Ciclo de inteligÃªncia fechado âœ“</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                Script vencedor ({cicloFechado.vencedor.toUpperCase()}) do experimento <strong>"{cicloFechado.nome}"</strong> foi enviado para aprovaÃ§Ã£o na aba <strong>Cross</strong>.
                ApÃ³s aprovado, serÃ¡ herdado por todos os agentes na prÃ³xima atualizaÃ§Ã£o.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-xs text-emerald-600 font-medium">Script em revisÃ£o na aba Cross</span>
                <div className="w-1.5 h-1.5 rounded-full bg-gray-300 ml-1" />
                <span className="text-xs text-gray-400">Telnyx serÃ¡ atualizado apÃ³s aprovaÃ§Ã£o</span>
              </div>
            </div>
          </div>
          <button onClick={() => setCicloFechado(null)} className="text-gray-300 hover:text-gray-500 shrink-0 mt-0.5">
            <X size={16} />
          </button>
        </div>
      )}

      {/* â”€â”€ Experimentos ativos â”€â”€ */}
      {ativos.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">Em curso</p>
          {ativos.map(t => {
            const totalLig = t.ligacoes_a + t.ligacoes_b
            const progresso = Math.min(100, Math.round((totalLig / t.amostra_alvo) * 100))
            const tA = taxaConv(t.agendamentos_a, t.ligacoes_a)
            const tB = taxaConv(t.agendamentos_b, t.ligacoes_b)
            const bVence = tB > tA
            const trLabel = TRECHOS.find(tr => tr.id === t.trecho)?.label || t.trecho
            return (
              <div key={t.id} className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-bold text-gray-900">{t.nome}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${t.status === 'em_curso' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                        {t.status === 'em_curso' ? 'Em curso' : 'Pausado'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">{trLabel} Â· {t.agentes?.nome || 'Todos os agentes'} Â· amostra: {t.amostra_alvo} ligaÃ§Ãµes</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => pausar(t.id, t.status)}
                      className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl px-3 py-1.5 hover:bg-gray-50">
                      {t.status === 'em_curso' ? 'Pausar' : 'Retomar'}
                    </button>
                    {totalLig > 0 && (
                      <>
                        <button onClick={() => encerrar(t.id, 'a', t.nome)} className="text-xs text-blue-600 border border-blue-200 rounded-xl px-3 py-1.5 hover:bg-blue-50">Declarar A vence</button>
                        <button onClick={() => encerrar(t.id, 'b', t.nome)} className="text-xs text-emerald-600 border border-emerald-200 rounded-xl px-3 py-1.5 hover:bg-emerald-50">Declarar B vence</button>
                      </>
                    )}
                  </div>
                </div>

                {/* Progresso */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{totalLig} / {t.amostra_alvo} ligaÃ§Ãµes</span>
                    <span className="font-mono font-bold">{progresso}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${progresso}%` }} />
                  </div>
                </div>

                {/* ComparaÃ§Ã£o A vs B */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: t.versao_a_nome, taxa: tA, lig: t.ligacoes_a, ag: t.agendamentos_a, vence: !bVence && totalLig > 0, color: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
                    { label: t.versao_b_nome, taxa: tB, lig: t.ligacoes_b, ag: t.agendamentos_b, vence: bVence && totalLig > 0, color: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                  ].map((v, i) => (
                    <div key={i} className={`border rounded-xl p-3 ${v.vence ? (i === 0 ? 'border-blue-200 bg-blue-50' : 'border-emerald-200 bg-emerald-50') : 'border-gray-100'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-700">{i === 0 ? 'A' : 'B'} â€” {v.label}</span>
                        {v.vence && <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${v.badge}`}>Vencendo</span>}
                      </div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-gray-500">{v.lig} lig. Â· {v.ag} agend.</span>
                        <span className={`font-mono font-bold ${v.vence ? (i === 0 ? 'text-blue-600' : 'text-emerald-600') : 'text-gray-600'}`}>{v.taxa}%</span>
                      </div>
                      <Bar pct={v.taxa} color={v.color} />
                    </div>
                  ))}
                </div>

                {/* Script expandÃ­vel */}
                <button onClick={() => setExpandido(expandido === t.id ? null : t.id)}
                  className="mt-3 text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                  {expandido === t.id ? 'â–²' : 'â–¼'} Ver scripts
                </button>
                {expandido === t.id && (
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    {[{ label: `A â€” ${t.versao_a_nome}`, script: t.versao_a_script }, { label: `B â€” ${t.versao_b_nome}`, script: t.versao_b_script }].map((v, i) => (
                      <div key={i} className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs font-semibold text-gray-500 mb-1">{v.label}</p>
                        <p className="text-xs text-gray-700 leading-relaxed">{v.script}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* â”€â”€ HistÃ³rico â”€â”€ */}
      {historico.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">HistÃ³rico de experimentos</p>
          </div>
          <div className="divide-y divide-gray-50">
            {historico.map(t => {
              const imp = impacto(t)
              const trLabel = TRECHOS.find(tr => tr.id === t.trecho)?.label || t.trecho
              return (
                <div key={t.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{t.nome}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{trLabel} Â· {new Date(t.criado_em).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    {t.vencedor && (
                      <span className="text-xs font-semibold text-gray-700">
                        VersÃ£o {t.vencedor.toUpperCase()} â€” {t.vencedor === 'a' ? t.versao_a_nome : t.versao_b_nome}
                      </span>
                    )}
                    {imp && (
                      <span className={`text-xs font-mono font-bold ${imp.venceB ? 'text-emerald-600' : 'text-blue-600'}`}>
                        {imp.venceB ? '+' : ''}{imp.diff}pp
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${t.status === 'concluido' ? 'bg-gray-100 text-gray-600' : 'bg-amber-50 text-amber-700'}`}>
                      {t.status === 'concluido' ? 'ConcluÃ­do' : 'Pausado'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {ativos.length === 0 && historico.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
          <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <GitBranch size={22} className="text-purple-400" />
          </div>
          <p className="text-gray-700 font-semibold text-sm mb-1">Nenhum experimento ainda</p>
          <p className="text-gray-400 text-xs max-w-sm mx-auto leading-relaxed">Crie seu primeiro experimento acima. A IA gera os dois scripts em segundos.</p>
        </div>
      )}
    </div>
  )
}

interface MercadoData {
  total_ligacoes: number
  periodo_dias: number
  atualizado: string
  objecoes: { tipo: string; label: string; count: number; pct: number }[]
  concorrentes: { termo: string; count: number; pct: number }[]
  budget: { label: string; count: number }[]
  alertas: { frase: string; gatilho: string; eficacia: number | null; criado_em: string }[]
  banco: { categoria: string; descricao: string; fonte: string | null; criado_em: string }[]
}

interface MercadoIA {
  resumo?: string; oportunidade_principal?: string; risco_principal?: string
  alertas?: { titulo: string; descricao: string; urgencia: string }[]
  recomendacoes?: { acao: string; impacto_esperado: string }[]
  concorrentes_detectados?: string[]
  momento_mercado?: string; confianca?: number; gerado_em?: string; total_ligacoes?: number
}

const OBJECAO_COLOR = ['bg-red-400','bg-orange-400','bg-amber-400','bg-yellow-400','bg-gray-300','bg-gray-200']
const MOMENTO_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  favoravel:    { label: 'FavorÃ¡vel',    color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  neutro:       { label: 'Neutro',       color: 'text-gray-600',    bg: 'bg-gray-50 border-gray-200' },
  desfavoravel: { label: 'DesfavorÃ¡vel', color: 'text-red-700',     bg: 'bg-red-50 border-red-200' },
}

function TabMercado() {
  const [gerando, setGerando] = useState(false)
  const [erroGerar, setErroGerar] = useState('')
  const [ia, setIa] = useState<MercadoIA | null>(null)
  const [mostrarGuia, setMostrarGuia] = useState(true)

  const { data, isLoading } = useQuery<MercadoData>({
    queryKey: ['mercado'],
    queryFn: () => inteligenciaApi.mercado().then(r => r.data),
    staleTime: 60000,
  })

  async function gerarRelatorio() {
    setGerando(true); setErroGerar('')
    try {
      const res = await inteligenciaApi.mercadoGerar()
      setIa(res.data as MercadoIA)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Erro ao gerar relatÃ³rio.'
      setErroGerar(msg)
    } finally { setGerando(false) }
  }

  const momentoCfg = MOMENTO_CONFIG[ia?.momento_mercado || 'neutro']
  const ultimaAtualizacao = ia?.gerado_em
    ? new Date(ia.gerado_em).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })
    : 'nunca'

  if (isLoading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 size={24} className="animate-spin text-gray-300" />
    </div>
  )

  return (
    <div className="space-y-4">

      {/* â”€â”€ Header â”€â”€ */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
              <Globe size={17} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">InteligÃªncia de Mercado</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {data?.total_ligacoes
                  ? `${data.total_ligacoes.toLocaleString('pt-BR')} ligaÃ§Ãµes analisadas â€” Ãºltimos ${data.periodo_dias} dias`
                  : 'Nenhuma ligaÃ§Ã£o no perÃ­odo'}
                {' Â· '}Ãšltimo relatÃ³rio: {ultimaAtualizacao}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {ia?.momento_mercado && (
              <div className={`border rounded-xl px-3 py-1.5 flex items-center gap-1.5 ${momentoCfg.bg}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${ia.momento_mercado === 'favoravel' ? 'bg-emerald-500' : ia.momento_mercado === 'desfavoravel' ? 'bg-red-500' : 'bg-gray-400'}`} />
                <span className={`text-xs font-semibold ${momentoCfg.color}`}>Mercado {momentoCfg.label}</span>
              </div>
            )}
            <button onClick={() => setMostrarGuia(v => !v)}
              className="border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5">
              <AlertCircle size={13} />
              Como usar
            </button>
            <button onClick={gerarRelatorio} disabled={gerando}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-xl transition-colors font-semibold flex items-center gap-2 disabled:opacity-60">
              {gerando ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              {gerando ? 'Analisando...' : 'Gerar relatÃ³rio agora'}
            </button>
          </div>
        </div>
        {erroGerar && <p className="mt-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{erroGerar}</p>}
      </div>

      {/* â”€â”€ Guia de uso â”€â”€ */}
      {mostrarGuia && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                <Globe size={13} className="text-blue-600" />
              </div>
              <p className="text-sm font-bold text-blue-900">Como usar a InteligÃªncia de Mercado</p>
            </div>
            <button onClick={() => setMostrarGuia(false)} className="text-blue-400 hover:text-blue-600 transition-colors">
              <X size={15} />
            </button>
          </div>

          {/* Fluxo de uso */}
          <div className="flex items-stretch gap-0 mb-5 overflow-x-auto">
            {[
              { step: '1', icon: <Zap size={13} />, color: 'bg-blue-100 text-blue-600', title: 'Agentes fazem ligaÃ§Ãµes', desc: 'Cada chamada Ã© transcrita e os gatilhos detectados automaticamente (preÃ§o, concorrente, urgÃªncia...)' },
              { step: '2', icon: <BarChart2 size={13} />, color: 'bg-blue-100 text-blue-600', title: 'Mercado agrega padrÃµes', desc: 'Esta aba consolida o que aconteceu em todas as ligaÃ§Ãµes dos Ãºltimos 30 dias em tempo real' },
              { step: '3', icon: <Brain size={13} />, color: 'bg-purple-100 text-purple-600', title: 'Gere o relatÃ³rio IA', desc: 'Clique "Gerar relatÃ³rio agora" â€” a IA analisa e identifica oportunidades, riscos e recomendaÃ§Ãµes' },
              { step: '4', icon: <Database size={13} />, color: 'bg-amber-100 text-amber-600', title: 'Adicione ao Banco', desc: 'Use as recomendaÃ§Ãµes da IA para criar novos argumentos na aba Banco (ex: resposta a objeÃ§Ã£o de preÃ§o)' },
              { step: '5', icon: <Share2 size={13} />, color: 'bg-emerald-100 text-emerald-600', title: 'Aprove no Cross', desc: 'O argumento entra como pendente no Cross â€” vocÃª aprova e ele Ã© propagado para todos os agentes' },
            ].map((s, i, arr) => (
              <div key={i} className="flex items-stretch">
                <div className="bg-white border border-blue-100 rounded-xl px-3 py-3 flex gap-2.5 min-w-[160px] max-w-[180px]">
                  <div className="shrink-0 mt-0.5">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${s.color}`}>{s.icon}</div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800 leading-tight mb-0.5">{s.title}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
                {i < arr.length - 1 && (
                  <div className="flex items-center px-1 shrink-0">
                    <ArrowRight size={14} className="text-blue-300" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Dicas por bloco */}
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">O que cada bloco mostra</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { titulo: 'ObjeÃ§Ãµes mais frequentes', desc: 'Tipos de resistÃªncia detectados nas transcriÃ§Ãµes: preÃ§o, concorrente, sem verba, sem urgÃªncia. Quanto maior a barra, mais comum a objeÃ§Ã£o. Use para priorizar o que treinar no agente.' },
              { titulo: 'Concorrentes mencionados', desc: 'Nomes que apareceram nas chamadas quando o cliente mencionou um concorrente. Identifique quem estÃ¡ disputando seus negÃ³cios e prepare contra-argumentos especÃ­ficos.' },
              { titulo: 'SinalizaÃ§Ãµes de Budget', desc: 'Quantas vezes os clientes trouxeram o tema de preÃ§o, proposta ou orÃ§amento. Alto nÃºmero = momento de negociaÃ§Ã£o ativo â€” considere ajustar o script de abertura de preÃ§o.' },
              { titulo: 'Banco de argumentos', desc: 'PrÃ©via dos argumentos que seus agentes jÃ¡ tÃªm disponÃ­veis para este cenÃ¡rio de mercado. Se estiver vazio, vÃ¡ Ã  aba Banco e adicione respostas Ã s objeÃ§Ãµes mais frequentes.' },
            ].map((b, i) => (
              <div key={i} className="bg-white border border-blue-100 rounded-xl px-3 py-2.5">
                <p className="text-xs font-semibold text-blue-800 mb-0.5">{b.titulo}</p>
                <p className="text-xs text-gray-600 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 bg-blue-100 rounded-xl px-3 py-2.5 flex gap-2">
            <Sparkles size={13} className="text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800 leading-relaxed">
              <strong>Dica:</strong> Gere o relatÃ³rio uma vez por semana. A IA lÃª as transcriÃ§Ãµes reais e dÃ¡ recomendaÃ§Ãµes de aÃ§Ã£o â€” como "criar argumento contra objeÃ§Ã£o de preÃ§o". Cada recomendaÃ§Ã£o aplicada no Banco vira aprendizado permanente para todos os agentes.
            </p>
          </div>
        </div>
      )}

      {/* â”€â”€ Resumo IA â”€â”€ */}
      {ia?.resumo && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-7 h-7 bg-purple-50 rounded-lg flex items-center justify-center shrink-0">
              <Brain size={14} className="text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">AnÃ¡lise IA â€” {ia.total_ligacoes} ligaÃ§Ãµes</p>
              <p className="text-sm text-gray-800 leading-relaxed">{ia.resumo}</p>
            </div>
            {ia.confianca != null && (
              <div className="text-right shrink-0">
                <p className="text-xl font-bold font-mono text-gray-800">{ia.confianca}%</p>
                <p className="text-xs text-gray-400">confianÃ§a</p>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {ia.oportunidade_principal && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 flex gap-2.5">
                <TrendingUp size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-emerald-700 mb-0.5">Oportunidade</p>
                  <p className="text-xs text-emerald-800 leading-relaxed">{ia.oportunidade_principal}</p>
                </div>
              </div>
            )}
            {ia.risco_principal && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex gap-2.5">
                <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-red-700 mb-0.5">Risco</p>
                  <p className="text-xs text-red-800 leading-relaxed">{ia.risco_principal}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">

        {/* â”€â”€ ObjeÃ§Ãµes â”€â”€ */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-gray-900">ObjeÃ§Ãµes mais frequentes</h3>
            <span className="text-xs text-gray-400">{data?.total_ligacoes?.toLocaleString('pt-BR') || 0} lig.</span>
          </div>
          <p className="text-xs text-gray-400 mb-4 leading-relaxed">
            Detectadas automaticamente nas transcriÃ§Ãµes. As mais altas sÃ£o as que mais travam suas vendas â€” crie contra-argumentos na aba <strong className="text-gray-600">Banco</strong>.
          </p>
          {data?.objecoes && data.objecoes.length > 0 ? (
            <div className="space-y-3">
              {data.objecoes.map((o, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-700 font-medium">{o.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">{o.count}x</span>
                      <span className="font-mono font-bold text-gray-800 w-8 text-right">{o.pct}%</span>
                    </div>
                  </div>
                  <Bar pct={o.pct} color={OBJECAO_COLOR[i] || 'bg-gray-200'} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart2 size={24} className="text-gray-200 mx-auto mb-2" />
              <p className="text-xs text-gray-400">Sem dados de gatilhos ainda.</p>
              <p className="text-xs text-gray-400">Gere um relatÃ³rio para analisar.</p>
            </div>
          )}
        </div>

        {/* â”€â”€ Concorrentes â”€â”€ */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-gray-900">Concorrentes mencionados</h3>
            <span className="text-xs text-gray-400">detecÃ§Ã£o automÃ¡tica</span>
          </div>
          <p className="text-xs text-gray-400 mb-4 leading-relaxed">
            Nomes identificados nas chamadas quando o cliente trouxe um concorrente. Adicione um argumento de diferenciaÃ§Ã£o no <strong className="text-gray-600">Banco</strong> para cada um.
          </p>
          {data?.concorrentes && data.concorrentes.length > 0 ? (
            <div className="space-y-2">
              {data.concorrentes.map((c, i) => (
                <div key={i} className="border border-gray-100 rounded-xl px-3 py-2.5 flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-800 capitalize">{c.termo}</p>
                    <Bar pct={c.pct} color="bg-blue-300" />
                  </div>
                  <span className="text-xs font-mono font-bold text-gray-600 shrink-0">{c.pct}%</span>
                </div>
              ))}
              {ia?.concorrentes_detectados && ia.concorrentes_detectados.length > 0 && (
                <p className="text-xs text-blue-600 mt-2 pt-2 border-t border-gray-100">
                  IA tambÃ©m detectou: {ia.concorrentes_detectados.join(', ')}
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users size={24} className="text-gray-200 mx-auto mb-2" />
              <p className="text-xs text-gray-400">Nenhum concorrente identificado</p>
              <p className="text-xs text-gray-400 mt-0.5">nas transcriÃ§Ãµes dos Ãºltimos 30 dias.</p>
            </div>
          )}
        </div>

        {/* â”€â”€ SinalizaÃ§Ãµes de Budget â”€â”€ */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">SinalizaÃ§Ãµes de Budget</h3>
          <p className="text-xs text-gray-400 mb-4 leading-relaxed">
            Vezes que o tema de preÃ§o ou orÃ§amento apareceu nas ligaÃ§Ãµes. Alto volume indica que o script de abertura de valor precisa ser reforÃ§ado antes de chegar no preÃ§o.
          </p>
          {data?.budget && data.budget.length > 0 ? (
            <div className="space-y-2">
              {data.budget.map((b, i) => (
                <div key={i} className="flex items-center gap-3 border border-gray-100 rounded-xl px-3 py-2.5">
                  <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center shrink-0">
                    <Zap size={13} className="text-amber-500" />
                  </div>
                  <span className="text-xs text-gray-700 flex-1">{b.label}</span>
                  <span className="font-mono font-bold text-amber-600 text-sm">{b.count}x</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Zap size={24} className="text-gray-200 mx-auto mb-2" />
              <p className="text-xs text-gray-400">Sem sinalizaÃ§Ãµes detectadas</p>
              <p className="text-xs text-gray-400 mt-0.5">Gere um relatÃ³rio para analisar.</p>
            </div>
          )}
        </div>

        {/* â”€â”€ PadrÃµes detectados / Banco de argumentos â”€â”€ */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Banco de argumentos de mercado</h3>
          <p className="text-xs text-gray-400 mb-4 leading-relaxed">
            Argumentos que seus agentes jÃ¡ tÃªm disponÃ­veis. Cada argumento aprovado no <strong className="text-gray-600">Cross</strong> Ã© herdado automaticamente por todos os agentes na prÃ³xima sincronizaÃ§Ã£o.
          </p>
          {data?.banco && data.banco.length > 0 ? (
            <div className="space-y-2">
              {data.banco.slice(0, 5).map((b, i) => (
                <div key={i} className="border border-gray-100 rounded-xl px-3 py-2.5">
                  <div className="flex items-start justify-between gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{b.categoria}</span>
                    {b.fonte && <span className="text-xs text-gray-300 shrink-0">{b.fonte}</span>}
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed">{b.descricao}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Database size={24} className="text-gray-200 mx-auto mb-2" />
              <p className="text-xs text-gray-400">Nenhum argumento cadastrado.</p>
              <p className="text-xs text-gray-400 mt-0.5">Adicione na aba <strong>Banco</strong>.</p>
            </div>
          )}
        </div>
      </div>

      {/* â”€â”€ Alertas IA â”€â”€ */}
      {ia?.alertas && ia.alertas.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="flex items-start justify-between mb-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Alertas gerados pela IA</p>
          </div>
          <p className="text-xs text-gray-400 mb-3 leading-relaxed">
            SituaÃ§Ãµes que a IA identificou como urgentes com base nos padrÃµes das ligaÃ§Ãµes. Alertas <span className="text-red-500 font-medium">vermelhos</span> exigem aÃ§Ã£o imediata â€” normalmente criar um argumento novo ou revisar o script.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {ia.alertas.map((a, i) => {
              const urgCfg = a.urgencia === 'alta'
                ? { border: 'border-red-200 bg-red-50', title: 'text-red-700', desc: 'text-red-600' }
                : a.urgencia === 'media'
                ? { border: 'border-amber-200 bg-amber-50', title: 'text-amber-700', desc: 'text-amber-600' }
                : { border: 'border-gray-100 bg-gray-50', title: 'text-gray-700', desc: 'text-gray-500' }
              return (
                <div key={i} className={`border rounded-xl px-4 py-3 ${urgCfg.border}`}>
                  <p className={`text-xs font-semibold mb-1 ${urgCfg.title}`}>{a.titulo}</p>
                  <p className={`text-xs leading-relaxed ${urgCfg.desc}`}>{a.descricao}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* â”€â”€ RecomendaÃ§Ãµes IA â”€â”€ */}
      {ia?.recomendacoes && ia.recomendacoes.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">RecomendaÃ§Ãµes de aÃ§Ã£o</p>
          <p className="text-xs text-gray-400 mb-3 leading-relaxed">
            AÃ§Ãµes concretas sugeridas pela IA com impacto esperado. O fluxo recomendado: leia â†’ vÃ¡ Ã  aba <strong className="text-gray-600">Banco</strong> â†’ adicione o argumento â†’ aprove no <strong className="text-gray-600">Cross</strong> â†’ todos os agentes herdam automaticamente.
          </p>
          <div className="space-y-2">
            {ia.recomendacoes.map((r, i) => (
              <div key={i} className="flex items-start gap-3 border border-gray-100 rounded-xl px-4 py-3">
                <div className="w-5 h-5 bg-blue-50 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">{i + 1}</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-800">{r.acao}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{r.impacto_esperado}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state â€” sem dados e sem relatÃ³rio IA */}
      {!ia && (!data?.objecoes || data.objecoes.length === 0) && (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Globe size={22} className="text-blue-400" />
          </div>
          <p className="text-gray-700 font-semibold text-sm mb-1">Nenhum dado de mercado ainda</p>
          <p className="text-gray-400 text-xs max-w-sm mx-auto leading-relaxed mb-4">
            Clique em "Gerar relatÃ³rio agora" para analisar suas ligaÃ§Ãµes e descobrir padrÃµes de objeÃ§Ãµes, concorrentes mencionados e sinalizaÃ§Ãµes de budget.
          </p>
          <button onClick={gerarRelatorio} disabled={gerando}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-5 py-2.5 rounded-xl font-semibold transition-colors flex items-center gap-2 mx-auto disabled:opacity-60">
            {gerando ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            {gerando ? 'Analisando...' : 'Gerar relatÃ³rio agora'}
          </button>
        </div>
      )}

    </div>
  )
}

// â”€â”€â”€ TAB CAMPANHAS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface CampanhaRow {
  nome: string
  tipo: 'outbound' | 'inbound' | 'nurturing'
  ligacoes: number
  taxaAgend: number
  taxaConv: number
  status: 'ativa' | 'pausada'
}

function TabCampanhas() {
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')

  const { data: campanhasInt = [] } = useQuery({
    queryKey: ['campanhas'],
    queryFn: () => campanhasApi.list().then(r => r.data as any[]),
  })

  const CAMPANHAS_INT: CampanhaRow[] = (campanhasInt as any[]).map((c: any) => {
    const dash = c.dashboard ?? {}
    const ligacoes_feitas = dash.ligacoes_feitas ?? 0
    const agendadas = dash.agendadas ?? 0
    const taxaAgendCalc = ligacoes_feitas > 0
      ? parseFloat(((agendadas / ligacoes_feitas) * 100).toFixed(1))
      : 0
    return {
      nome: c.nome ?? c.name ?? 'â€”',
      tipo: (['outbound', 'inbound', 'nurturing'].includes(c.tipo ?? c.type ?? '') ? (c.tipo ?? c.type) : 'outbound') as CampanhaRow['tipo'],
      ligacoes: ligacoes_feitas,
      taxaAgend: taxaAgendCalc,
      taxaConv: dash.taxa_conversao ?? 0,
      status: (['ativa', 'pausada'].includes(c.status ?? '') ? c.status : 'ativa') as CampanhaRow['status'],
    }
  })

  const filtrado = CAMPANHAS_INT.filter(c => {
    const tipoOk = filtroTipo === 'todos' || c.tipo === filtroTipo
    const statusOk = filtroStatus === 'todos' || c.status === filtroStatus
    return tipoOk && statusOk
  })

  const ativas = CAMPANHAS_INT.filter(c => c.status === 'ativa')
  const taxaMedia = ativas.length > 0 ? (ativas.reduce((s, c) => s + c.taxaConv, 0) / ativas.length).toFixed(1) : '0.0'
  const melhor = ativas.length > 0 ? [...ativas].sort((a, b) => b.taxaConv - a.taxaConv)[0] : null
  const pior = ativas.length > 0 ? [...ativas].sort((a, b) => a.taxaConv - b.taxaConv)[0] : null

  const maxAgend = filtrado.length > 0 ? Math.max(...filtrado.map(c => c.taxaAgend)) : 1

  return (
    <div className="space-y-4">

      {/* Header explicativo */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center">
            <Megaphone size={18} className="text-brand-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Desempenho por Campanha</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Acompanhe <span className="font-medium text-gray-700">ligaÃ§Ãµes, taxa de agendamento e conversÃ£o</span> de cada campanha em tempo real. Use os filtros para comparar tipos e identificar o que estÃ¡ performando melhor.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-full font-semibold">
            {CAMPANHAS_INT.length} campanha{CAMPANHAS_INT.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Campanhas ativas" value={String(ativas.length)} sub={`de ${CAMPANHAS_INT.length} total`} accent="blue" />
        <KpiCard label="Taxa mÃ©dia conversÃ£o" value={`${taxaMedia}%`} sub="campanhas ativas" accent="green" />
        <KpiCard label="Melhor campanha" value={melhor ? melhor.nome.split(' â€” ')[0] : 'â€”'} sub={melhor ? `${melhor.taxaConv}% conversÃ£o` : ''} accent="purple" />
        <KpiCard label="Pior campanha" value={pior ? pior.nome.split(' â€” ')[0] : 'â€”'} sub={pior ? `${pior.taxaConv}% conversÃ£o` : ''} accent="amber" />
      </div>

      {/* GrÃ¡fico de barras CSS â€” taxa de agendamento */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Taxa de agendamento por campanha</h3>
        <div className="space-y-3">
          {CAMPANHAS_INT.map((c, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs text-gray-600 w-44 flex-shrink-0 truncate">{c.nome}</span>
              <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden flex items-center">
                <div
                  className={`h-full rounded-full transition-all flex items-center justify-end pr-2 ${c.status === 'pausada' ? 'bg-gray-400' : c.taxaAgend >= 10 ? 'bg-emerald-500' : c.taxaAgend >= 7 ? 'bg-blue-500' : 'bg-amber-400'}`}
                  style={{ width: `${(c.taxaAgend / maxAgend) * 100}%`, minWidth: '2rem' }}
                >
                  <span className="text-white text-xs font-mono font-bold" style={{ fontSize: '9px' }}>{c.taxaAgend}%</span>
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${c.status === 'ativa' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                {c.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Filtros + Tabela */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-wrap gap-2">
          <h3 className="text-sm font-semibold text-gray-900">Tabela de campanhas</h3>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-gray-500">Tipo:</label>
              <select
                value={filtroTipo}
                onChange={e => setFiltroTipo(e.target.value)}
                className="border border-gray-200 rounded-lg px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="todos">Todos</option>
                <option value="outbound">Outbound</option>
                <option value="inbound">Inbound</option>
                <option value="nurturing">Nurturing</option>
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-gray-500">Status:</label>
              <select
                value={filtroStatus}
                onChange={e => setFiltroStatus(e.target.value)}
                className="border border-gray-200 rounded-lg px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="todos">Todos</option>
                <option value="ativa">Ativa</option>
                <option value="pausada">Pausada</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-100 bg-gray-50">
                {['Campanha','Tipo','LigaÃ§Ãµes','Tx. Agend.','Tx. ConversÃ£o','Status'].map(h => (
                  <th key={h} className="text-left px-4 py-2 font-semibold uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrado.map((c, i) => (
                <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-2.5 text-xs font-semibold text-gray-900">{c.nome}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${c.tipo === 'outbound' ? 'bg-blue-50 text-blue-700' : c.tipo === 'inbound' ? 'bg-emerald-50 text-emerald-700' : 'bg-purple-50 text-purple-700'}`}>
                      {c.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs font-mono text-gray-700">{c.ligacoes}</td>
                  <td className={`px-4 py-2.5 text-xs font-mono font-bold ${c.taxaAgend >= 10 ? 'text-emerald-600' : c.taxaAgend >= 7 ? 'text-blue-600' : 'text-amber-600'}`}>{c.taxaAgend}%</td>
                  <td className={`px-4 py-2.5 text-xs font-mono font-bold ${c.taxaConv >= 6 ? 'text-emerald-600' : c.taxaConv >= 4 ? 'text-blue-600' : 'text-amber-600'}`}>{c.taxaConv}%</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${c.status === 'ativa' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtrado.length === 0 && (
            <div className="px-4 py-8 text-center text-xs text-gray-400">Nenhuma campanha para os filtros selecionados.</div>
          )}
        </div>
      </div>
    </div>
  )
}

// â”€â”€â”€ MAIN PAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function InteligenciaPage() {
  // LÃª ?tab= da URL para abrir aba diretamente (ex: vindo do card de campanha)
  const searchParams = new URLSearchParams(window.location.search)
  const tabFromUrl = (searchParams.get('tab') as TabId) || 'testes'
  const [activeTab, setActiveTab] = useState<TabId>(tabFromUrl)
  const [scoreIA, setScoreIA] = useState<number | null>(null)

  useEffect(() => {
    claudeApi.scoreInteligencia()
      .then(res => setScoreIA((res.data as { score: number }).score))
      .catch(() => {})
  }, [])

  const tabContent: Record<TabId, React.ReactNode> = {
    testes: <TabTestes />,
    qualidade: <TabQualidade />,
    coletiva: <TabColetiva />,
    horarios: <TabHorarios />,
    campanhas: <TabCampanhas />,
    conhecimento: <TabConhecimento />,
    banco: <TabBanco />,
    metricas: <TabMetricas onNavigate={setActiveTab} />,
    ajustefino: <TabAjusteFino />,
    evolucao: <TabEvolucao />,
    cross: <TabCross />,
    padroes: <TabPadroes />,
    simulador: <TabSimulador />,
    icp: <TabICP />,
    ab: <TabAB />,
    mercado: <TabMercado />,
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-4">

        {/* â”€â”€ Page header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Accent bar */}
          <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)' }} />

          <div className="px-6 py-5 flex items-center justify-between gap-6">
            {/* TÃ­tulo + badge */}
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center flex-shrink-0">
                <Brain size={22} className="text-brand-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Centro de InteligÃªncia</h1>
                  <span className="text-2xs font-mono font-bold bg-brand-50 border border-brand-200 text-brand-600 px-2 py-0.5 rounded-full">v2.4</span>
                </div>
                <p className="text-sm text-gray-400 mt-0.5">Motor de IA autÃ´nomo â€” aprende e evolui a cada ligaÃ§Ã£o</p>
              </div>
            </div>

            {/* KPIs */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Score de InteligÃªncia */}
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                  <Sparkles size={15} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-2xs text-gray-400 leading-none mb-0.5">Score CI</p>
                  <p className="text-lg font-mono font-bold text-purple-600 leading-none">
                    {scoreIA != null ? `${scoreIA}` : 'â€”'}<span className="text-xs text-gray-400 font-normal">/100</span>
                  </p>
                </div>
              </div>

              {/* ConversÃ£o */}
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <TrendingUp size={15} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xs text-gray-400 leading-none mb-0.5">ConversÃ£o</p>
                  <p className="text-lg font-mono font-bold text-emerald-600 leading-none">+3.7%</p>
                </div>
              </div>

              {/* LigaÃ§Ãµes processadas */}
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Zap size={15} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-2xs text-gray-400 leading-none mb-0.5">LigaÃ§Ãµes</p>
                  <p className="text-lg font-mono font-bold text-gray-900 leading-none">1.284</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* â”€â”€ Tab bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm px-5 py-3 flex flex-col gap-2.5">
          {/* Linha 1: ANÃLISE + CONHECIMENTO */}
          <div className="flex items-center gap-1">
            {TAB_GROUPS.slice(0, 2).map((group, gi) => (
              <div key={gi} className="flex items-center gap-1">
                {gi > 0 && <span className="w-px h-4 bg-gray-200 mx-2 flex-shrink-0" />}
                <span className="text-2xs text-gray-300 font-semibold uppercase tracking-widest mr-2 select-none">{group.label}</span>
                {group.tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all whitespace-nowrap font-medium ${
                      activeTab === tab.id
                        ? 'bg-brand-600 text-white font-semibold shadow-sm'
                        : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* Separador */}
          <div className="h-px bg-gray-100" />

          {/* Linha 2: INTELIGÃŠNCIA */}
          <div className="flex items-center gap-1">
            <span className="text-2xs text-gray-300 font-semibold uppercase tracking-widest mr-2 select-none">{TAB_GROUPS[2].label}</span>
            {TAB_GROUPS[2].tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all whitespace-nowrap font-medium ${
                  activeTab === tab.id
                    ? 'bg-brand-600 text-white font-semibold shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div>{tabContent[activeTab]}</div>
      </div>
    </div>
  )
}
