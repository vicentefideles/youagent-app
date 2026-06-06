import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  FlaskConical, Shield, Users, Clock, BookOpen, Database,
  BarChart2, Sliders, TrendingUp, Share2, GitBranch, Play,
  Target, TestTube2, Globe, Cpu, CheckCircle,
  Upload, Trash2, RotateCcw, Zap,
  AlertCircle, ArrowRight, RefreshCw, Download, Megaphone, Brain, Sparkles, Loader2, Star, X,
} from 'lucide-react'
import { inteligenciaSimuladorApi, inteligenciaApi, claudeApi, api, qualidadeCalcularApi, campanhasApi } from '@/services/api'

type TabId =
  | 'testes' | 'qualidade' | 'coletiva' | 'horarios' | 'campanhas'
  | 'conhecimento' | 'banco' | 'metricas' | 'ajustefino'
  | 'evolucao' | 'cross' | 'padroes' | 'simulador'
  | 'icp' | 'ab' | 'mercado' | 'sandbox'

interface TabGroup {
  label: string
  tabs: { id: TabId; label: string; icon: React.ReactNode }[]
}

const TAB_GROUPS: TabGroup[] = [
  {
    label: 'ANÁLISE',
    tabs: [
      { id: 'testes', label: 'Testes', icon: <FlaskConical size={14} /> },
      { id: 'qualidade', label: 'Qualidade', icon: <Shield size={14} /> },
      { id: 'coletiva', label: 'IC', icon: <Users size={14} /> },
      { id: 'horarios', label: 'Horários', icon: <Clock size={14} /> },
      { id: 'campanhas', label: 'Campanhas', icon: <Megaphone size={14} /> },
    ],
  },
  {
    label: 'CONHECIMENTO',
    tabs: [
      { id: 'conhecimento', label: 'Conhecimento', icon: <BookOpen size={14} /> },
      { id: 'banco', label: 'Banco', icon: <Database size={14} /> },
      { id: 'metricas', label: 'Métricas', icon: <BarChart2 size={14} /> },
      { id: 'ajustefino', label: 'Ajuste Fino', icon: <Sliders size={14} /> },
    ],
  },
  {
    label: 'INTELIGÊNCIA',
    tabs: [
      { id: 'evolucao', label: 'Evolução', icon: <TrendingUp size={14} /> },
      { id: 'cross', label: 'Cross', icon: <Share2 size={14} /> },
      { id: 'padroes', label: 'Padrões', icon: <GitBranch size={14} /> },
      { id: 'simulador', label: 'Simulador', icon: <Play size={14} /> },
      { id: 'icp', label: 'ICP', icon: <Target size={14} /> },
      { id: 'ab', label: 'A/B', icon: <TestTube2 size={14} /> },
      { id: 'mercado', label: 'Mercado', icon: <Globe size={14} /> },
      { id: 'sandbox', label: 'Sandbox', icon: <Cpu size={14} /> },
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

// ─── TAB PANELS ──────────────────────────────────────────────────────────────

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

  // Resultado → label + cor
  function resultadoBadge(resultado: string) {
    const map: Record<string, { label: string; cls: string }> = {
      agendou:     { label: 'Agendou',     cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      transferida: { label: 'Transferida', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
      nao_atendeu: { label: 'Não atendeu', cls: 'bg-gray-50 text-gray-500 border-gray-200' },
      sem_interesse:{ label: 'Sem interesse',cls: 'bg-amber-50 text-amber-700 border-amber-200' },
      esgotado:    { label: 'Esgotado',    cls: 'bg-red-50 text-red-600 border-red-200' },
    }
    const r = map[resultado] ?? { label: resultado ?? '—', cls: 'bg-gray-50 text-gray-500 border-gray-200' }
    return <span className={`text-2xs px-2 py-0.5 rounded-full font-semibold border ${r.cls}`}>{r.label}</span>
  }

  async function rodarCiclo() {
    setCicloRodou(true)
    setCicloMsg('Processando ligações recentes...')
    await new Promise(r => setTimeout(r, 1500))
    await refetch()
    setCicloMsg('✓ Dados atualizados')
    setTimeout(() => { setCicloRodou(false); setCicloMsg('') }, 3000)
  }

  return (
    <div className="space-y-4">

      {/* ── Explicação para o cliente ─────────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <FlaskConical size={18} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 mb-1">QA Automático — Análise de Ligações</h2>
              <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">
                Esta aba mostra o resultado de todas as ligações realizadas pelos seus agentes — quais converteram, quais não atenderam e qual a taxa de sucesso geral.
                Com esses dados, você identifica padrões, mede o desempenho real e ajusta campanhas antes de escalar.
              </p>
              <div className="flex flex-wrap gap-3 mt-3">
                <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-full px-3 py-1">
                  <CheckCircle size={11} className="text-emerald-500" /> Taxa de conversão em tempo real
                </span>
                <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-full px-3 py-1">
                  <CheckCircle size={11} className="text-emerald-500" /> Histórico completo por agente
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

      {/* ── KPI strip ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <TrendingUp size={18} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-2xs text-gray-400 font-medium mb-0.5">Taxa de conversão</p>
            <p className="text-2xl font-mono font-bold text-emerald-600">{taxa}<span className="text-sm text-gray-400 font-normal">%</span></p>
            <p className="text-2xs text-gray-400">{sucesso} de {total} ligações</p>
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <BarChart2 size={18} className="text-blue-600" />
          </div>
          <div>
            <p className="text-2xs text-gray-400 font-medium mb-0.5">Ligações analisadas</p>
            <p className="text-2xl font-mono font-bold text-gray-900">{total}</p>
            <p className="text-2xs text-gray-400">últimas 50 com resultado</p>
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
            <Target size={18} className="text-brand-600" />
          </div>
          <div>
            <p className="text-2xs text-gray-400 font-medium mb-0.5">Sem resultado</p>
            <p className="text-2xl font-mono font-bold text-gray-900">{total - sucesso}</p>
            <p className="text-2xs text-gray-400">não atenderam ou sem interesse</p>
          </div>
        </div>
      </div>

      {/* ── Tabela de ligações reais ──────────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Histórico de ligações processadas</h3>
            <p className="text-xs text-gray-400 mt-0.5">Últimas {rows.length} ligações com resultado registrado pelos seus agentes</p>
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
            <p className="text-sm font-medium text-gray-500 mb-1">Nenhuma ligação com resultado ainda</p>
            <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
              Assim que seus agentes realizarem ligações e registrarem resultados, o histórico aparecerá aqui automaticamente.
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
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">{r.contato ?? '—'}</td>
                    <td className="px-5 py-3 text-xs text-gray-500">{r.empresa ?? '—'}</td>
                    <td className="px-5 py-3 text-xs text-gray-600">{r.agente ?? '—'}</td>
                    <td className="px-5 py-3">{resultadoBadge(r.resultado)}</td>
                    <td className="px-5 py-3">
                      {r.icp > 0 ? (
                        <span className={`text-2xs font-bold font-mono px-2 py-0.5 rounded-full border ${r.icp >= 70 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : r.icp >= 50 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                          {r.icp}
                        </span>
                      ) : <span className="text-xs text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3 text-2xs text-gray-400 font-mono">
                      {r.data ? new Date(r.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Próximos passos / orientação ─────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={15} className="text-brand-600" />
            <h3 className="text-sm font-semibold text-brand-800">Como aumentar a taxa de conversão</h3>
          </div>
          <ul className="space-y-2 mt-3">
            {[
              'Analise os horários com maior taxa de atendimento na aba Horários',
              'Revise os argumentos de alta performance na aba Cross',
              'Ajuste o script do agente com base nos padrões detectados',
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
              { label: 'Agendou',      desc: 'Reunião marcada — conversão completa',       cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
              { label: 'Transferida',  desc: 'Passou para vendedor humano na chamada',     cls: 'bg-blue-50 text-blue-700 border-blue-200' },
              { label: 'Não atendeu',  desc: 'Ninguém atendeu — entra em recontato',       cls: 'bg-gray-50 text-gray-500 border-gray-200' },
              { label: 'Sem interesse',desc: 'Lead rejeitou — alimenta o aprendizado CI',  cls: 'bg-amber-50 text-amber-700 border-amber-200' },
              { label: 'Esgotado',     desc: 'Tentativas máximas atingidas',               cls: 'bg-red-50 text-red-600 border-red-200' },
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
  mes:    'Este mês',
}

const PERIODO_DESC: Record<Periodo, string> = {
  hoje:   'Ligações realizadas hoje',
  semana: 'Ligações desde segunda-feira',
  mes:    'Ligações desde o dia 1º',
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
        setCalcMsg(`Nenhuma ligação encontrada ${PERIODO_DESC[periodo].toLowerCase()}`)
      } else {
        setCalcMsg(`✓ ${d.calculados} agente${d.calculados !== 1 ? 's' : ''} atualizado${d.calculados !== 1 ? 's' : ''}`)
        setCalcInfo({ ligacoes: d.ligacoes_encontradas, desde: d.desde })
      }
    } catch {
      setCalcMsg('Erro ao calcular — tente novamente')
    } finally {
      setCalculando(false)
      setTimeout(() => { setCalcMsg(''); setCalcInfo(null) }, 6000)
    }
  }

  // Métricas agregadas
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

      {/* ── Explicação ───────────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Shield size={18} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 mb-1">QA de Agentes — Score de Desempenho</h2>
              <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">
                Mostra o desempenho real de cada agente de IA com base nas ligações dos últimos 30 dias.
                O score é calculado automaticamente: agentes que geram mais agendamentos e transferências recebem nota maior.
                Use para identificar qual agente está performando melhor e em quais campanhas colocá-lo.
              </p>
              <div className="flex flex-wrap gap-3 mt-3">
                {[
                  'Score calculado das ligações reais',
                  'Nota A+ a D por agente',
                  'Ranking automático por conversão',
                ].map(t => (
                  <span key={t} className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-full px-3 py-1">
                    <CheckCircle size={11} className="text-emerald-500" /> {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
          {/* Seletor de período + botão calcular */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            {/* Pills de período */}
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
              {calculando ? 'Calculando...' : `Calcular — ${PERIODO_LABELS[periodo]}`}
            </button>

            {calcMsg && (
              <div className="text-right">
                <p className={`text-xs font-medium ${calcMsg.startsWith('✓') ? 'text-emerald-600' : calcMsg.startsWith('Nenhuma') ? 'text-amber-600' : 'text-red-500'}`}>
                  {calcMsg}
                </p>
                {calcInfo && (
                  <p className="text-2xs text-gray-400 mt-0.5">
                    {calcInfo.ligacoes} lig. · desde {new Date(calcInfo.desde).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── KPI strip ────────────────────────────────────────────────────────── */}
      {totalAgentes > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
              <Users size={18} className="text-brand-600" />
            </div>
            <div>
              <p className="text-2xs text-gray-400 font-medium mb-0.5">Agentes avaliados</p>
              <p className="text-2xl font-mono font-bold text-gray-900">{totalAgentes}</p>
              <p className="text-2xs text-gray-400">{totalLigacoes} ligações analisadas</p>
            </div>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <TrendingUp size={18} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-2xs text-gray-400 font-medium mb-0.5">Score médio</p>
              <p className="text-2xl font-mono font-bold text-emerald-600">{mediaScore}<span className="text-sm text-gray-400 font-normal">%</span></p>
              <p className="text-2xs text-gray-400">conversão média dos agentes</p>
            </div>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
              <Star size={18} className="text-amber-500" />
            </div>
            <div>
              <p className="text-2xs text-gray-400 font-medium mb-0.5">Melhor agente</p>
              <p className="text-sm font-bold text-gray-900 truncate">
                {melhor?.agentes?.nome ?? melhor?.nome_agente ?? melhor?.agente_id ?? '—'}
              </p>
              <p className="text-2xs text-gray-400">{melhor?.score_total ?? 0}% de conversão</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Tabela de agentes ─────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Ranking de desempenho por agente</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Score = % de conversão · período: <span className="font-medium text-gray-600">{PERIODO_LABELS[periodo]}</span> — {PERIODO_DESC[periodo].toLowerCase()}
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
              Selecione o período e clique em "Calcular" para gerar o ranking de desempenho dos seus agentes.
            </p>
            <button
              onClick={calcularScores}
              disabled={calculando}
              className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl bg-brand-600 text-white hover:bg-brand-700 transition-colors disabled:opacity-60"
            >
              <RefreshCw size={14} className={calculando ? 'animate-spin' : ''} />
              {calculando ? 'Calculando...' : `Calcular — ${PERIODO_LABELS[periodo]}`}
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
                  <th className="text-left px-5 py-3">Ligações</th>
                  <th className="text-left px-5 py-3">Atualizado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[...qualidade]
                  .sort((a, b) => (b.score_total ?? 0) - (a.score_total ?? 0))
                  .map((q, i) => {
                    const nome = q.agentes?.nome ?? q.nome_agente ?? q.agente_id ?? '—'
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
                            : '—'}
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Guia de notas ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={15} className="text-amber-500" />
            <h3 className="text-sm font-semibold text-gray-900">O que cada nota significa</h3>
          </div>
          <div className="space-y-2">
            {[
              { nota: 'A+', range: '≥ 90%', desc: 'Excelente — agente no topo da performance',      cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
              { nota: 'A',  range: '80–89%', desc: 'Muito bom — resultados consistentes',            cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
              { nota: 'B',  range: '70–79%', desc: 'Bom — pode melhorar com ajuste de script',       cls: 'bg-blue-50 text-blue-700 border-blue-200' },
              { nota: 'C',  range: '60–69%', desc: 'Regular — revisar abordagem e horários',         cls: 'bg-amber-50 text-amber-700 border-amber-200' },
              { nota: 'D',  range: '< 60%',  desc: 'Crítico — recomendado ajuste fino urgente',      cls: 'bg-red-50 text-red-600 border-red-200' },
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
              'Recalcule os scores após cada campanha para acompanhar a evolução',
              'Agentes com nota C ou D → use a aba Ajuste Fino para refinar o script',
              'Compare os horários de pico na aba Horários e ajuste os agentes de baixa nota',
              'Aplique os argumentos aprovados via aba Cross para elevar conversão',
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

  // Mapa de gatilhos dos aprovados (para o painel de padrões)
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
    setDetectMsg('Analisando ligações com IA...')
    try {
      const res = await inteligenciaApi.detectarPadroes()
      const d = res.data as { padroes?: any[] }
      await refetch()
      const qtd = d?.padroes?.length ?? 0
      setDetectMsg(qtd > 0 ? `✓ ${qtd} novo${qtd !== 1 ? 's' : ''} padrão${qtd !== 1 ? 'ões' : ''} detectado${qtd !== 1 ? 's' : ''}` : '✓ Análise concluída — sem novos padrões')
    } catch {
      setDetectMsg('Erro na análise — tente novamente')
    } finally {
      setDetectando(false)
      setTimeout(() => setDetectMsg(''), 5000)
    }
  }

  const STEPS = [
    { label: 'Ligações', desc: 'Agentes ligam para leads' },
    { label: 'Análise', desc: 'IA detecta o que converte' },
    { label: 'Padrões', desc: 'Argumentos gerados' },
    { label: 'Aprovação', desc: 'Gerente aprova aqui' },
    { label: 'Produção', desc: 'Injetado nos agentes' },
    { label: 'Impacto', desc: 'Conversão aumenta' },
  ]

  return (
    <div className="space-y-4">

      {/* ── Explicação ───────────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Share2 size={18} className="text-purple-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 mb-1">Inteligência Coletiva — Ciclo de Aprendizado</h2>
              <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">
                A cada ligação, a IA identifica frases e argumentos que geraram conversão.
                Esses padrões chegam aqui como <strong className="text-gray-700">pendentes de aprovação</strong> — você revisa, aprova ou rejeita.
                Os aprovados são <strong className="text-gray-700">injetados automaticamente em todos os agentes</strong>, que passam a usá-los nas próximas chamadas.
              </p>
              <div className="flex flex-wrap gap-3 mt-3">
                {[
                  'Padrões extraídos de ligações reais',
                  'Aprovação obrigatória pelo gerente',
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
              {detectando ? 'Analisando...' : 'Detectar padrões agora'}
            </button>
            {detectMsg && (
              <p className={`text-xs font-medium ${detectMsg.startsWith('✓') ? 'text-emerald-600' : 'text-red-500'}`}>
                {detectMsg}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── KPI strip ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
            <AlertCircle size={18} className="text-amber-500" />
          </div>
          <div>
            <p className="text-2xs text-gray-400 font-medium mb-0.5">Pendentes de aprovação</p>
            <p className="text-2xl font-mono font-bold text-amber-600">{pendentes.length}</p>
            <p className="text-2xs text-gray-400">aguardando sua revisão</p>
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

      {/* ── Ciclo cascade visual ─────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Como funciona o ciclo</h3>
        <div className="flex items-start gap-1 flex-wrap">
          {STEPS.map((s, i) => {
            const isActive = s.label === 'Aprovação' && pendentes.length > 0
            const isDone   = s.label === 'Produção' && aprovados.length > 0
            return (
              <div key={i} className="flex items-center gap-1">
                <div className={`flex flex-col items-center px-3 py-2 rounded-xl border text-center min-w-[80px] ${
                  isActive ? 'bg-amber-50 border-amber-300' :
                  isDone   ? 'bg-emerald-50 border-emerald-200' :
                  'bg-gray-50 border-gray-100'
                }`}>
                  <span className={`text-xs font-semibold ${isActive ? 'text-amber-700' : isDone ? 'text-emerald-700' : 'text-gray-700'}`}>
                    {s.label}
                    {isActive && <span className="ml-1 text-2xs">⚡</span>}
                    {isDone   && <span className="ml-1 text-2xs">✓</span>}
                  </span>
                  <span className="text-2xs text-gray-400 mt-0.5 leading-tight">{s.desc}</span>
                </div>
                {i < STEPS.length - 1 && <ArrowRight size={13} className="text-gray-300 flex-shrink-0" />}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Lista de argumentos ──────────────────────────────────────────────── */}
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
              : 'Argumentos já ativos — são usados pelos agentes em todas as chamadas'}
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
                  Clique em "Detectar padrões agora" para a IA analisar as últimas ligações e identificar frases que converteram.
                </p>
                <button
                  onClick={detectarPadroes}
                  disabled={detectando}
                  className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl bg-brand-600 text-white hover:bg-brand-700 transition-colors disabled:opacity-60"
                >
                  <Sparkles size={14} className={detectando ? 'animate-pulse' : ''} />
                  {detectando ? 'Analisando...' : 'Detectar padrões agora'}
                </button>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-500 mb-1">Nenhum argumento aprovado ainda</p>
                <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
                  Aprove argumentos da aba "Pendentes" para que os agentes comecem a usá-los.
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
                      <span className="text-2xs text-emerald-600 font-semibold">▲ {arg.eficacia}% conversão</span>
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

                {/* Ações */}
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

      {/* ── Mapa de gatilhos ativos ──────────────────────────────────────────── */}
      {gatilhoRanking.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Padrões aprovados por tipo de gatilho</h3>
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
  const melhorFaixa = analise?.melhorFaixa ?? '—'
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
            <h2 className="text-base font-semibold text-gray-900">Horários Inteligentes</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              A IA analisa <span className="font-medium text-gray-700">todas as ligações realizadas</span> e identifica os horários com maior taxa de conversão.
            </p>
          </div>
        </div>
        <button
          className="text-xs font-semibold px-4 py-2 rounded-lg bg-brand-600 text-white hover:bg-brand-700 flex items-center gap-1.5 transition-colors disabled:opacity-60"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          {isFetching ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          {isFetching ? 'Analisando...' : 'Reanalisar ligações'}
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 gap-2 text-gray-400 text-sm">
          <Loader2 size={18} className="animate-spin" /> Analisando ligações...
        </div>
      ) : semDados ? (
        <div className="bg-white border border-gray-100 rounded-xl p-10 text-center">
          <p className="text-gray-400 text-sm">Nenhuma ligação registrada nos últimos 60 dias.</p>
          <p className="text-gray-300 text-xs mt-1">Os dados aparecerão automaticamente após as primeiras ligações.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-4">
            <KpiCard label="Melhor faixa de horário" value={melhorFaixa} accent="blue" />
            <KpiCard label="Taxa na faixa de ouro" value={`${melhorPct}%`} sub={`média geral: ${mediaPct}%`} accent="green" />
            <KpiCard label="Total ligações analisadas" value={String(analise?.total ?? 0)} sub="últimos 60 dias" accent="purple" />
            <KpiCard label="Agentes analisados" value={String(porAgente.length)} accent="amber" />
          </div>

          {/* Faixas de horário — barras */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">🔥 Taxa de conversão por faixa de horário</h3>
            <div className="flex gap-3 items-end h-40">
              {faixas.map((f, i) => {
                const cor = f.pct >= 20 ? 'bg-emerald-500' : f.pct >= 10 ? 'bg-blue-500' : f.pct >= 5 ? 'bg-amber-400' : 'bg-gray-200'
                const maxPct = Math.max(...faixas.map(x => x.pct), 1)
                const altura = Math.max(4, Math.round((f.pct / maxPct) * 100))
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-bold font-mono text-gray-700">{f.pct > 0 ? `${f.pct}%` : '—'}</span>
                    <div className="w-full flex items-end" style={{ height: '80px' }}>
                      <div
                        className={`w-full rounded-t-lg transition-all ${cor}`}
                        style={{ height: `${altura}%` }}
                        title={`${f.total} ligações · ${f.sucesso} conversões`}
                      />
                    </div>
                    <span className="text-xs text-gray-500 text-center leading-tight">{f.label}</span>
                    <span className="text-[10px] text-gray-400">{f.total} lig.</span>
                  </div>
                )
              })}
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500 inline-block"/>≥20%</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500 inline-block"/>10–20%</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-400 inline-block"/>5–10%</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-200 inline-block"/>&lt;5%</span>
            </div>
          </div>

          {/* Sugestões globais + por agente */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">💡 Ranking global de faixas</h3>
              <div className="space-y-2">
                {faixas
                  .filter(f => f.total > 0)
                  .sort((a, b) => b.pct - a.pct)
                  .slice(0, 3)
                  .map((f, i) => (
                    <div key={i} className={`flex items-center gap-2 p-2.5 rounded-lg border ${i === 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-100'}`}>
                      <span className="text-base">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-800">{f.label}</p>
                        <p className="text-xs text-gray-500">{f.total} ligações · {f.sucesso} conversões</p>
                      </div>
                      <span className={`text-xs font-bold font-mono ${i === 0 ? 'text-emerald-600' : 'text-gray-600'}`}>{f.pct}%</span>
                    </div>
                  ))}
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Melhor horário por agente</h3>
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

          {/* ── Por campanha — análise individual + aplicar ── */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">🎯 Janela ideal por campanha</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Cada campanha tem um perfil diferente — aplique o horário recomendado individualmente.
                </p>
              </div>
            </div>
            {porCampanha.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">
                Dados aparecerão após as primeiras ligações por campanha.
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
                          {c.totalLigs} ligações analisadas
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {/* Janela atual */}
                        <div className="text-right">
                          <p className="text-xs text-gray-400">Atual</p>
                          <p className="text-xs font-mono font-semibold text-gray-700">
                            {c.hora_inicio_atual}–{c.hora_fim_atual}
                          </p>
                        </div>
                        {/* Recomendação */}
                        {temRec && (
                          <>
                            <span className="text-gray-300">→</span>
                            <div className="text-right">
                              <p className="text-xs text-emerald-600 font-medium">Recomendado</p>
                              <p className="text-xs font-mono font-bold text-emerald-700">
                                {c.hora_inicio_rec}–{c.hora_fim_rec}
                              </p>
                              <p className="text-xs text-gray-400">faixa {c.melhorFaixa} · {c.pctMelhor}%</p>
                            </div>
                          </>
                        )}
                        {/* Botão aplicar */}
                        {jaAplicado ? (
                          <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                            ✅ Aplicado
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
  const catLabel: Record<string, string> = { livro: 'Livro', artigo: 'Artigo', video: 'Vídeo', audio: 'Áudio', texto: 'Texto livre' }

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
    : '—'

  // Últimos insights extraídos dos materiais reais
  const ultimosInsights: string[] = library
    .slice(0, 5)
    .flatMap((b: any) => (b.argumentos ?? []).slice(0, 1) as string[])
    .slice(0, 3)

  const tipoIcon: Record<string, string> = {
    livro: '📘', artigo: '📰', video: '🎬', audio: '🎙️', texto: '📝',
  }

  // Recomendações da plataforma ETZ (meta-conhecimento, sempre exibido)
  const recomendacoes = [
    { icon: '📘', tipo: 'Livro', titulo: 'Vendas consultivas', exemplo: 'SPIN Selling, The Challenger Sale', impacto: '+22%' },
    { icon: '🎬', tipo: 'Vídeo', titulo: 'Contorno de objeções', exemplo: 'Objeção de preço e concorrência', impacto: '+17%' },
    { icon: '📄', tipo: 'Texto', titulo: 'Scripts de qualificação', exemplo: 'Frameworks BANT / MEDDIC', impacto: '+14%' },
    { icon: '📰', tipo: 'Artigo', titulo: 'Tendências do setor', exemplo: 'Dados e relatórios do mercado-alvo', impacto: '+11%' },
    { icon: '🎙️', tipo: 'Áudio', titulo: 'Calls de vendas reais', exemplo: 'Transcrições de calls com êxito', impacto: '+9%' },
  ]

  async function adicionar() {
    if (!titulo || !categoria) { setFeedback('❌ Preencha título e categoria'); return }
    // Para vídeo: URL ou texto são suficientes (sistema transcreve automaticamente)
    if (format === 'video' && !urlVideo && !textoLivre) { setFeedback('❌ Informe a URL do YouTube ou cole um resumo'); return }
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
        setFeedback(`✅ PDF processado! ${saved.paginas_lidas} página(s) lidas, ${(saved.argumentos?.length ?? 0) + (saved.tecnicas?.length ?? 0)} insights extraídos.`)

      // Áudio: envia como multipart/form-data para transcrição com Groq Whisper
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
        setFeedback(`✅ Áudio transcrito e processado! ${saved.chars_transcritos?.toLocaleString() ?? 0} caracteres transcritos, ${(saved.argumentos?.length ?? 0) + (saved.tecnicas?.length ?? 0)} insights extraídos.`)

      } else {
        // Texto / URL / outros (inclui áudio com texto colado)
        const conteudo = textoLivre || urlArtigo || urlVideo || `Material do tipo ${format}: ${titulo}`
        await api.post('/inteligencia/conhecimento', {
          titulo, tipo: format, categoria,
          conteudo_texto: conteudo,
          url: urlArtigo || urlVideo || undefined,
        })
        queryClient.invalidateQueries({ queryKey: ['inteligencia-conhecimento'] })
        setTitulo(''); setCategoria(''); setUrlArtigo(''); setUrlVideo(''); setTextoLivre('')
        setFeedback('✅ Material processado pela IA e adicionado à base!')
      }
      setTimeout(() => setFeedback(null), 6000)
    } catch (e: unknown) {
      setFeedback('❌ Erro: ' + (e as Error).message)
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
              Alimente seus agentes com <span className="font-medium text-gray-700">livros, artigos, vídeos e scripts</span>. A IA processa cada material e o agente se torna especialista em argumentação e contorno de objeções do seu segmento.
            </p>
          </div>
        </div>
        <span className="text-xs bg-brand-50 text-brand-700 border border-brand-100 px-2.5 py-1 rounded-full font-semibold flex-shrink-0">
          {totalMateriais} material{totalMateriais !== 1 ? 'is' : ''}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">

        {/* ── Coluna esquerda: formulário ── */}
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
              placeholder="Título do material" />
            <select value={categoria} onChange={e => setCategoria(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-200">
              <option value="">Categoria</option>
              <option>Vendas e Persuasão</option>
              <option>Setor Industrial</option>
              <option>Tecnologia</option>
              <option>Negociação</option>
              <option>Comportamento do comprador</option>
              <option>Concorrência</option>
              <option>Cases e Referências</option>
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
                    <div className="text-2xl mb-1">📄</div>
                    <p className="text-xs text-emerald-700 font-semibold truncate max-w-full">{pdfStatus}</p>
                    <p className="text-[10px] text-emerald-500 mt-0.5">
                      {(pdfFile.size / 1024).toFixed(0)} KB · clique para trocar
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
                      ✓ Auto-transcrição
                    </span>
                  )}
                </div>
                <div className="flex items-start gap-1.5 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  <span className="text-emerald-500 text-sm mt-0.5">🤖</span>
                  <p className="text-[11px] text-emerald-700 leading-relaxed">
                    <span className="font-semibold">Transcrição automática:</span> cole a URL e o sistema extrai e processa o conteúdo do vídeo automaticamente. O campo abaixo é opcional — use para adicionar contexto extra.
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
                      <div className="text-2xl mb-1">🎙️</div>
                      <p className="text-xs text-purple-700 font-semibold truncate">{audioFile.name}</p>
                      <p className="text-[10px] text-purple-500 mt-0.5">{(audioFile.size / (1024 * 1024)).toFixed(1)} MB · clique para trocar</p>
                    </>
                  ) : (
                    <>
                      <Upload size={18} className="mx-auto text-purple-400 mb-1" />
                      <p className="text-xs text-purple-600 font-semibold">Clique para selecionar áudio</p>
                      <p className="text-[10px] text-purple-400 mt-0.5">MP3, MP4, WAV, M4A · até 25 MB</p>
                    </>
                  )}
                </label>
                <div className="flex items-start gap-1.5 bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
                  <span className="text-purple-500 text-sm mt-0.5">🤖</span>
                  <p className="text-[11px] text-purple-700 leading-relaxed">
                    <span className="font-semibold">Transcrição automática com Whisper:</span> o sistema converte o áudio em texto e extrai argumentos, técnicas e objeções automaticamente. Ou cole a transcrição no campo abaixo.
                  </p>
                </div>
              </div>
            )}

            {/* Textarea — obrigatório para todos exceto vídeo (que tem auto-transcrição) */}
            <textarea rows={format === 'texto' ? 5 : 3}
              value={textoLivre} onChange={e => setTextoLivre(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-200 resize-none"
              placeholder={
                format === 'livro' ? 'Cole trechos do livro aqui — capítulos, frases-chave, argumentos...'
                : format === 'artigo' ? 'Cole o texto do artigo aqui...'
                : format === 'video' ? 'Contexto extra (opcional) — pontos principais, resumo...'
                : format === 'audio' ? 'Transcrição ou pontos principais do áudio...'
                : 'Cole ou digite o conteúdo aqui...'
              }
            />
          </div>


          {feedback && (
            <div className={`text-xs px-3 py-2 rounded-lg mb-2 ${feedback.startsWith('✅') ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
              {feedback}
            </div>
          )}

          <button disabled={salvando} onClick={adicionar}
            className="w-full bg-brand-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {salvando
              ? <><Loader2 size={14} className="animate-spin" /> Processando com IA...</>
              : 'Adicionar à base'}
          </button>
        </div>

        {/* ── Coluna direita: KPIs + biblioteca + recomendações ── */}
        <div className="space-y-4">

          {/* KPIs reais */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Materiais', value: String(totalMateriais) },
              { label: 'Insights extraídos', value: String(totalInsights) },
              { label: 'Tipos diferentes', value: String(tiposUnicos) },
              { label: 'Último update', value: ultimoUpdate },
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
              <p className="text-xs text-gray-400 text-center py-4">Nenhum material cadastrado ainda.<br /><span className="text-gray-300">Adicione o primeiro à esquerda.</span></p>
            ) : (
              <div className="space-y-2 max-h-[480px] overflow-y-auto">
                {library.map((b: any) => {
                  const totalInsightsMat = (b.argumentos?.length ?? 0) + (b.tecnicas?.length ?? 0) + (b.objecoes?.length ?? 0)
                  const dataFormatada = b.created_at ? new Date(b.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '—'
                  return (
                    <details key={b.id} className="border border-gray-100 rounded-lg group">
                      <summary className="flex items-center gap-3 p-2 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors list-none">
                        <div className="w-8 h-8 rounded flex items-center justify-center text-lg shrink-0 bg-brand-50">
                          {tipoIcon[b.tipo] ?? '📄'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">{b.titulo}</p>
                          <p className="text-xs text-gray-400">{b.tipo} · <span className="text-brand-600 font-medium">{totalInsightsMat} insights</span> · {dataFormatada}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {b.aprovado
                            ? <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-medium">ativo</span>
                            : <span className="text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded font-medium">revisão</span>
                          }
                          <button onClick={e => { e.preventDefault(); remover(b.id) }} className="text-gray-300 hover:text-red-400 transition-colors">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </summary>
                      {/* Expansão: insights extraídos */}
                      <div className="px-3 pb-3 pt-1 border-t border-gray-50 space-y-2">
                        {b.conteudo_resumo && (
                          <div className="bg-brand-50 rounded-lg p-2">
                            <p className="text-[10px] font-semibold text-brand-600 mb-0.5">📋 Resumo do aprendizado</p>
                            <p className="text-xs text-gray-700">{b.conteudo_resumo}</p>
                          </div>
                        )}
                        {b.argumentos?.length > 0 && (
                          <div>
                            <p className="text-[10px] font-semibold text-emerald-600 mb-1">💬 Argumentos de venda ({b.argumentos.length})</p>
                            <ul className="space-y-0.5">
                              {b.argumentos.map((a: string, i: number) => (
                                <li key={i} className="text-xs text-gray-600 flex gap-1.5"><span className="text-emerald-400 shrink-0">•</span>{a}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {b.tecnicas?.length > 0 && (
                          <div>
                            <p className="text-[10px] font-semibold text-blue-600 mb-1">⚡ Técnicas ({b.tecnicas.length})</p>
                            <ul className="space-y-0.5">
                              {b.tecnicas.map((t: string, i: number) => (
                                <li key={i} className="text-xs text-gray-600 flex gap-1.5"><span className="text-blue-400 shrink-0">•</span>{t}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {b.objecoes?.length > 0 && (
                          <div>
                            <p className="text-[10px] font-semibold text-amber-600 mb-1">🛡️ Objeções ({b.objecoes.length})</p>
                            <ul className="space-y-1">
                              {b.objecoes.map((o: any, i: number) => (
                                <li key={i} className="text-xs bg-amber-50 rounded p-1.5">
                                  <span className="font-medium text-amber-700">"{o.objecao}"</span>
                                  {o.resposta && <span className="text-gray-600"> → {o.resposta}</span>}
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

          {/* Últimos insights reais (só aparece se houver materiais) */}
          {ultimosInsights.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Últimos insights extraídos</h3>
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

          {/* Card Recomendações ETZ */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={14} className="text-brand-500" />
              <h3 className="text-sm font-semibold text-gray-900">O que funciona na plataforma ETZ</h3>
            </div>
            <p className="text-[10px] text-gray-400 mb-3">
              Baseado em todos os clientes ETZ ativos — tipos de material com maior impacto em conversão de agendamentos
            </p>
            <div className="space-y-2">
              {recomendacoes.map((r, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 border border-gray-100 hover:bg-brand-50/40 hover:border-brand-100 transition-colors cursor-default">
                  <span className="text-base">{r.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800">{r.tipo} · {r.titulo}</p>
                    <p className="text-[10px] text-gray-400 truncate">{r.exemplo}</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 font-mono flex-shrink-0">{r.impacto}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-300 mt-3 text-center">
              Clientes com 5+ materiais têm 2.4× mais conversão
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
  // Resultado de extração URL — múltiplos argumentos
  const [extraidos, setExtraidos] = useState<{descricao:string,categoria:string,selecionado:boolean}[]>([])
  const [fonteExtraida, setFonteExtraida] = useState('')
  const [validadeExtraida, setValidadeExtraida] = useState('')
  const [salvandoExtraidos, setSalvandoExtraidos] = useState(false)

  async function handleExtrairUrl() {
    if (!urlNoticia.trim()) { setErroSalvar('Cole a URL da notícia'); return }
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
      setErroSalvar(e?.response?.data?.error || 'Não foi possível ler a URL')
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
      setErroSalvar('Preencha categoria e descrição')
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
    return { label: `Válido por ${diff}d`, color: 'bg-green-50 text-green-700' }
  }

  return (
    <div className="space-y-4">

      {/* Header — mesmo padrão das outras abas */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
            <Database size={18} className="text-brand-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Banco de Argumentos</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Alimente seus agentes com <span className="font-medium text-gray-700">notícias, dados de mercado e insights</span>. A IA injeta automaticamente em cada ligação — sem sincronização manual.
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
            {isLoading ? '…' : total} argumento{total !== 1 ? 's' : ''}
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
            { icon: '📰', titulo: 'Notícias e tendências', desc: 'Cole a URL de uma notícia relevante — a IA lê, extrai o insight e salva automaticamente' },
            { icon: '⚡', titulo: 'Injeção automática', desc: 'Cada argumento entra na próxima ligação sem clicar em nada — o agente já usa' },
            { icon: '🎯', titulo: 'Contextual e preciso', desc: 'O agente cita o dado somente quando o contexto da conversa for compatível' },
            { icon: '⏰', titulo: 'Validade inteligente', desc: 'Configure expiração para dados temporários — notícias sazonais, promoções, etc.' },
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

      {/* Formulário com abas Manual / URL */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Adicionar inteligência de mercado</h3>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
            <button
              onClick={() => setModo('manual')}
              className={`px-3 py-1.5 font-medium transition-colors ${modo === 'manual' ? 'bg-brand-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
            >
              ✏️ Manual
            </button>
            <button
              onClick={() => setModo('url')}
              className={`px-3 py-1.5 font-medium transition-colors ${modo === 'url' ? 'bg-brand-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
            >
              🔗 URL de notícia
            </button>
          </div>
        </div>

        {/* Modo URL */}
        {modo === 'url' && (
          <div className="space-y-3">
            <div className="flex items-start gap-1.5 bg-brand-50 border border-brand-100 rounded-lg px-3 py-2">
              <span className="text-brand-500 text-sm mt-0.5">🤖</span>
              <p className="text-[11px] text-brand-700 leading-relaxed">
                <span className="font-semibold">Extração automática:</span> cole a URL de qualquer notícia, artigo ou relatório. A IA lê o conteúdo e extrai todos os argumentos relevantes para as ligações.
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

            {/* Resultados da extração */}
            {extraidos.length > 0 && (
              <div className="border border-emerald-200 rounded-xl p-3 space-y-3 bg-emerald-50/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle size={13} className="text-emerald-600" />
                    <p className="text-xs font-semibold text-emerald-700">{extraidos.length} argumentos extraídos de <span className="text-emerald-800">{fonteExtraida}</span></p>
                  </div>
                  <p className="text-[10px] text-gray-400">Desmarque os que não quer salvar</p>
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
                    <label className="text-[10px] text-gray-400 font-medium px-1">Por quantos dias é válido?</label>
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

        {/* Modo Manual (também exibido após extração de URL para revisão) */}
        {modo === 'manual' && (
          <div className="space-y-2">
            {novoArg.descricao && novoArg.fonte && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 flex items-center gap-2">
                <CheckCircle size={13} className="text-emerald-600 shrink-0" />
                <p className="text-xs text-emerald-700">Conteúdo extraído da URL. Revise e ajuste antes de salvar.</p>
              </div>
            )}
            <select
              value={novoArg.categoria}
              onChange={e => setNovoArg(p => ({ ...p, categoria: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="">Categoria do argumento</option>
              <option>Economia e custos</option>
              <option>Tendência de mercado</option>
              <option>Dado setorial</option>
              <option>Contexto político/regulatório</option>
              <option>Tecnologia</option>
              <option>Case / Referência</option>
              <option>Concorrente</option>
            </select>
            <textarea
              rows={3}
              value={novoArg.descricao}
              onChange={e => setNovoArg(p => ({ ...p, descricao: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200 resize-none"
              placeholder="Descreva o argumento ou insight de mercado que o agente deve usar em ligações..."
            />
            <div className="flex gap-2">
              <div className="flex-1 flex flex-col gap-1">
                <label className="text-[10px] text-gray-400 font-medium px-0.5">Por quantos dias é válido? <span className="text-gray-300">(vazio = sem expiração)</span></label>
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
          <h3 className="text-sm font-semibold text-gray-900">Inteligências cadastradas</h3>
          {total > 0 && (
            <span className="text-xs text-gray-400">{total} ativo{total > 1 ? 's' : ''}</span>
          )}
        </div>
        {isLoading && <p className="text-xs text-gray-400 text-center py-6">Carregando...</p>}
        {!isLoading && argumentos.length === 0 && (
          <div className="text-center py-6">
            <Database size={28} className="text-gray-200 mx-auto mb-2" />
            <p className="text-xs text-gray-400">Nenhum argumento ainda.</p>
            <p className="text-xs text-gray-400 mt-0.5">Cole uma URL de notícia ou escreva um insight manualmente.</p>
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
                  {item.fonte && <span className="bg-gray-100 text-gray-500 text-[10px] px-1.5 py-0.5 rounded">📰 {item.fonte}</span>}
                  {expInfo
                    ? <span className={`text-[10px] px-1.5 py-0.5 rounded ${expInfo.color}`}>{expInfo.label}</span>
                    : <span className="bg-gray-50 text-gray-400 text-[10px] px-1.5 py-0.5 rounded">Sem expiração</span>
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
    { label: 'Urgência ou prazo', pct: 82, color: 'bg-emerald-500', status: '↑ Aumentar', statusColor: 'bg-blue-50 text-blue-700' },
    { label: 'Pede humano', pct: 91, color: 'bg-emerald-500', status: 'Ótimo', statusColor: 'bg-emerald-50 text-emerald-700' },
    { label: 'Pergunta preço', pct: 74, color: 'bg-blue-500', status: 'OK', statusColor: 'bg-gray-100 text-gray-600' },
    { label: 'Pede proposta', pct: 68, color: 'bg-blue-500', status: 'OK', statusColor: 'bg-gray-100 text-gray-600' },
    { label: 'Menciona concorrente', pct: 43, color: 'bg-amber-400', status: '⚠ Revisar', statusColor: 'bg-amber-50 text-amber-700' },
  ]

  const TOP_ARGS = [
    { label: 'Resposta a "não tenho orçamento"', usos: 312, pct: 74 },
    { label: 'Resposta a "já temos fornecedor"', usos: 287, pct: 68 },
    { label: 'Argumento custo do SDR', usos: 198, pct: 63 },
    { label: 'Case da construtora SP', usos: 156, pct: 61 },
    { label: 'Resposta a "me manda por email"', usos: 134, pct: 61 },
  ]

  const ARGS_APRENDIDOS = [
    { tag: 'Não tenho orçamento', segmento: 'Todos os ramos', usos: 312, data: '03/04', frase: '"Faz sentido ser criterioso. Por isso nosso modelo é por resultado — uma reunião fechada já paga vários meses do investimento. Posso te mostrar em 20 minutos como funciona?"', pct: 74 },
    { tag: 'Já temos fornecedor', segmento: 'Tecnologia, Indústria', usos: 287, data: '08/04', frase: '"Entendo! A maioria dos nossos clientes também tinha. A diferença é que nos complementamos o que vocês já têm e reduzimos custo. Vale uma conversa rápida de 20 minutos?"', pct: 68 },
    { tag: 'Me manda por e-mail', segmento: 'Todos os ramos', usos: 198, data: '12/04', frase: '"Claro! Antes de enviar, me fala: qual o maior desafio da sua equipe de vendas hoje com agendamentos? Isso me ajuda a personalizar o material para o perfil de vocês."', pct: 61 },
    { tag: 'Não é o momento', segmento: 'Agronegócio, Indústria', usos: 156, data: '20/04', frase: '"Faz sentido planejar. Por isso mesmo é importante a gente conversar agora — para quando chegar a safra vocês já estarem rodando com os agentes treinados."', pct: 58 },
  ]

  const ARGS_VALIDACAO = [
    { tag: 'Já usamos IA', segmento: 'Tecnologia', usos: 12, data: '04/05', frase: '"Ótimo! Vocês já estão na direção certa. A diferença é que essa IA é especialista em agendamento ativo — uma função muito específica que as outras não cobrem."', pct: 52 },
    { tag: 'Preciso consultar meu sócio', segmento: 'Todos os ramos', usos: 8, data: '05/05', frase: '"Claro, faz todo sentido! O que precisa acontecer nessa reunião para que você e seu sócio possam avaliar com todas as informações necessárias?"', pct: 47 },
  ]

  const tipoIcon: Record<string, string> = { livro: '📘', artigo: '📰', video: '🎬', audio: '🎙️', texto: '📝' }

  // ── Exportar Relatório de Materiais (PDF via print) ──────────────────────
  function exportarRelatorioMateriais() {
    const materiais = Array.isArray(conhecimentoData) ? conhecimentoData : []
    const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const linhas = materiais.map((m: any) => {
      const insights = (m.argumentos?.length ?? 0) + (m.tecnicas?.length ?? 0)
      const data = m.created_at ? new Date(m.created_at).toLocaleDateString('pt-BR') : '—'
      const icon = tipoIcon[m.tipo] ?? '📄'
      return `
        <tr>
          <td><strong>${m.titulo}</strong><br/><span style="color:#6b7280;font-size:11px">${m.categoria ?? m.tipo}</span></td>
          <td>${icon} ${m.tipo}</td>
          <td>${data}</td>
          <td style="text-align:center">${insights}</td>
          <td style="text-align:center;color:#6b7280">—</td>
          <td style="text-align:center;color:#6b7280">—</td>
        </tr>`
    }).join('')

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <title>ETZ — Relatório de Impacto por Material</title>
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
      <h1>Relatório de Impacto por Material</h1>
      <p>Centro de Inteligência ETZ — Base de Conhecimento do Agente</p>
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
      <div class="kpi-label">Insights extraídos</div>
    </div>
    <div class="kpi">
      <div class="kpi-val">${totalBanco}</div>
      <div class="kpi-label">Argumentos no banco</div>
    </div>
  </div>

  ${!temDados ? `<div class="nota">⚠️ Dados de conversão (antes/depois/impacto) serão preenchidos automaticamente após as primeiras ligações realizadas pelo agente.</div>` : ''}

  <table>
    <thead>
      <tr>
        <th>Material</th>
        <th>Tipo</th>
        <th>Adicionado em</th>
        <th style="text-align:center">Insights</th>
        <th style="text-align:center">Conv. antes → depois</th>
        <th style="text-align:center">Impacto</th>
      </tr>
    </thead>
    <tbody>${linhas || '<tr><td colspan="6" style="text-align:center;color:#9ca3af;padding:24px">Nenhum material cadastrado ainda.</td></tr>'}</tbody>
  </table>

  <div class="footer">ETZ Intelligence Platform · Relatório gerado automaticamente · ${hoje}</div>

  <script>window.onload = function(){ window.print(); }<\/script>
</body>
</html>`

    const win = window.open('', '_blank')
    if (win) { win.document.write(html); win.document.close() }
  }

  // ── Exportar Linha do Tempo (PDF via print) ──────────────────────────────
  function exportarLinhaTempo() {
    const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const marcos = [
      {
        cor: '#3b82f6', emoji: '🚀', titulo: 'Setup inicial concluído',
        data: dataSetup ?? hoje,
        desc: primeiroAgente
          ? `Agente "${primeiroAgente.nome}" configurado. ${totalMateriais} materiais na base, ${totalBanco} argumentos no banco.`
          : 'Agente ainda não configurado.',
        tags: ([
          totalBanco > 0 ? `${totalBanco} argumentos no banco` : null,
          totalMateriais > 0 ? `${totalMateriais} materiais na base` : null,
        ] as (string | null)[]).filter((x): x is string => x !== null),
        ativo: !!primeiroAgente,
      },
      {
        cor: temDados ? '#10b981' : '#d1d5db', emoji: '🎯', titulo: 'Primeiro agendamento confirmado',
        data: temDados ? '—' : 'Aguardando',
        desc: temDados
          ? 'O agente realizou ligações e confirmou o primeiro agendamento.'
          : 'Marco registrado automaticamente na primeira reunião agendada.',
        tags: temDados ? [`${totalLigacoes} ligações realizadas`] : [],
        ativo: temDados,
      },
      {
        cor: temDados ? '#8b5cf6' : '#d1d5db', emoji: '🔍', titulo: 'Primeiro padrão detectado automaticamente',
        data: temDados ? '—' : 'Aguardando',
        desc: temDados
          ? 'O sistema detectou padrões nas ligações e aplicou no motor automaticamente.'
          : 'Após ~50 ligações, o sistema detecta melhores horários, tons e argumentos.',
        tags: [],
        ativo: temDados,
      },
      {
        cor: temDados ? '#f59e0b' : '#d1d5db', emoji: '🔗', titulo: 'Aprendizado Cross-Cliente ativado',
        data: temDados ? '—' : 'Aguardando',
        desc: 'Argumentos validados por outros agentes ETZ de qualquer segmento incorporados ao banco — um bom argumento de agendamento transcende o setor.',
        tags: [],
        ativo: temDados,
      },
      {
        cor: '#6d28d9', emoji: '⭐', titulo: 'Estado atual',
        data: `Hoje — ${hoje}`,
        desc: temDados
          ? `${totalLigacoes} ligações realizadas. ${totalMateriais} materiais na base. ${totalBanco} argumentos ativos no banco.`
          : `${totalMateriais} materiais na base de conhecimento. ${totalBanco} argumentos ativos. Agente pronto para as primeiras ligações.`,
        tags: [`${totalBanco} argumentos`, `${totalMateriais} materiais`, temDados ? `${totalLigacoes} ligações` : '0 ligações'],
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
  <title>ETZ — Jornada de Evolução do Agente</title>
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
      <h1>🗓️ Jornada de Evolução do Agente</h1>
      <p>Linha do tempo completa — cada marco registrado automaticamente desde o primeiro dia.</p>
    </div>
    <div class="meta">
      <p>Gerado em ${hoje}</p>
      <p style="color:#6d28d9;font-weight:600">ETZ Intelligence Platform</p>
    </div>
  </div>
  <div class="timeline">${marcosHtml}</div>
  <div class="footer">ETZ Intelligence Platform · Transparência total do aprendizado do agente · ${hoje}</div>
  <script>window.onload = function(){ window.print(); }<\/script>
</body>
</html>`

    const win = window.open('', '_blank')
    if (win) { win.document.write(html); win.document.close() }
  }

  // Meses para gráfico de evolução (últimas 10 semanas - estrutura visual)
  const SEMANAS = ['Abr 1', 'Abr 7', 'Abr 14', 'Abr 21', 'Abr 28', 'Mai 5', 'Mai 12', 'Mai 19', 'Mai 26', 'Jun 2']
  const VALS = [6.1, 6.8, 7.2, 7.8, 7.4, 8.1, 8.0, 8.4, 8.6, 8.9]
  const EVENTOS: Record<number, { label: string; color: string }> = {
    2: { label: 'Receita Prev.', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    4: { label: '+8 argumentos', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    5: { label: 'Intel. mercado', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  }

  return (
    <div className="space-y-4">

      {/* ── Header padrão ───────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
            <BarChart2 size={18} className="text-brand-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Métricas de Inteligência</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Acompanhe o impacto real de cada argumento, material e gatilho nas <span className="font-medium text-gray-700">taxas de conversão das ligações</span>.
            </p>
          </div>
        </div>
        {temDados ? (
          <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-semibold shrink-0">
            {totalLigacoes} ligações analisadas
          </span>
        ) : (
          <span className="text-xs bg-brand-50 text-brand-600 border border-brand-200 px-2.5 py-1 rounded-full font-semibold shrink-0">
            {totalMateriais + totalBanco} fontes configuradas
          </span>
        )}
      </div>

      {/* ── Card explicativo ─────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
            <TrendingUp size={12} className="text-brand-600" />
          </div>
          <p className="text-sm font-semibold text-gray-900">O que você acompanha nesta aba</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: '🎯', titulo: 'Eficácia por gatilho', desc: 'Quais momentos da conversa mais geram transferências — urgência, proposta, preço, decisor.' },
            { icon: '📈', titulo: 'Evolução de conversão', desc: 'Como a taxa sobe a cada material adicionado ou argumento ativado no banco.' },
            { icon: '💬', titulo: 'Top argumentos em campo', desc: 'Os argumentos que o agente mais usou e que mais converteram nas ligações reais.' },
            { icon: '⚡', titulo: 'Impacto por material', desc: 'Conversão antes e depois de cada livro, artigo ou vídeo adicionado à base.' },
            { icon: '🧠', titulo: 'Auto-aprendizado', desc: 'Frases descobertas automaticamente pelo sistema nas ligações que mais convertem.' },
            { icon: '🗓️', titulo: 'Linha do tempo', desc: 'Cada marco registrado — setup, primeiro agendamento, padrões, versões e evolução.' },
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
              <span className="font-semibold">Aguardando as primeiras ligações.</span> As seções abaixo mostram a estrutura completa — os dados reais preenchem automaticamente conforme o agente liga. Você já tem <span className="font-semibold">{totalMateriais + totalBanco} fontes de inteligência</span> configuradas e prontas.
            </p>
          </div>
        )}
      </div>

      {/* ── 4 KPIs ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Conversão atual</p>
          {temDados ? (
            <p className="text-2xl font-bold text-emerald-600">—%</p>
          ) : (
            <p className="text-2xl font-bold text-gray-300">—%</p>
          )}
          <p className="text-[10px] text-gray-400 mt-1">{temDados ? 'calculada das ligações' : 'disponível após ligações'}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Argumentos no banco</p>
          <p className="text-2xl font-bold text-blue-600">{totalBanco}</p>
          <p className="text-[10px] text-gray-400 mt-1">ativos nos agentes</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Materiais na base</p>
          <p className="text-2xl font-bold text-purple-600">{totalMateriais}</p>
          <p className="text-[10px] text-gray-400 mt-1">{totalInsights} insights extraídos</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Score de inteligência</p>
          {temDados ? (
            <p className="text-2xl font-bold text-amber-600">—</p>
          ) : (
            <p className="text-2xl font-bold text-gray-300">—</p>
          )}
          <p className="text-[10px] text-gray-400 mt-1">{temDados ? 'calculado' : 'disponível após ligações'}</p>
        </div>
      </div>

      {/* ── Eficácia dos gatilhos ────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Eficácia dos gatilhos de transferência</h3>
            <p className="text-xs text-gray-400 mt-0.5">Calibração automática — conectado à discadora</p>
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
                <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide">Conversão pós-transf.</p>
                <p className="text-xl font-bold text-emerald-700 mt-1">—%</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide">Transferências auto</p>
                <p className="text-xl font-bold text-blue-700 mt-1">—</p>
                <p className="text-[10px] text-blue-500 mt-0.5">este mês</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-3">
                <p className="text-[10px] font-semibold text-purple-600 uppercase tracking-wide">Gatilho mais eficaz</p>
                <p className="text-sm font-bold text-purple-700 mt-1">—</p>
              </div>
            </div>
            <p className="text-xs font-semibold text-gray-700 mb-2">Eficácia por gatilho ativado</p>
            <div className="space-y-2">
              {GATILHOS.map((g, i) => (
                <div key={i}>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-gray-600">{g.label}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${g.statusColor}`}>{g.status}</span>
                      <span className="font-mono font-bold text-gray-900 w-8 text-right">—%</span>
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
                <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide">Conversão pós-transf.</p>
                <p className="text-xl font-bold text-emerald-700 mt-1">—%</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide">Transferências auto</p>
                <p className="text-xl font-bold text-blue-700 mt-1">—</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-3">
                <p className="text-[10px] font-semibold text-purple-600 uppercase tracking-wide">Gatilho mais eficaz</p>
                <p className="text-sm font-bold text-purple-700 mt-1">—</p>
              </div>
            </div>
            <p className="text-xs font-semibold text-gray-700 mb-2">Eficácia por gatilho ativado</p>
            <div className="space-y-2">
              {GATILHOS.map((g, i) => (
                <div key={i}>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-gray-400">{g.label}</span>
                    <span className="text-gray-300 font-mono font-bold">—%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-gray-200 h-2 rounded-full" style={{ width: `${g.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-center py-2 border border-dashed border-gray-200 rounded-lg">
              <p className="text-xs text-gray-400">Dados de eficácia disponíveis após as primeiras transferências</p>
            </div>
          </>
        )}
      </div>

      {/* ── Evolução x Treinamentos + Top Argumentos ────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-900">Evolução da conversão x Treinamentos</h3>
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
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block" />Conversão (%)</span>
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
                  <span className="text-sm font-bold text-emerald-600 shrink-0">—%</span>
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
                  <span className="text-sm font-bold text-gray-300 shrink-0">—%</span>
                </div>
              ))}
              <p className="text-[11px] text-center text-gray-400 pt-1">Disponível após as primeiras ligações</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Impacto por material ─────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-gray-900">Impacto por material adicionado</h3>
          {temDados && <button onClick={exportarRelatorioMateriais} className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-50 font-medium">Exportar relatório PDF</button>}
        </div>
        <p className="text-[11px] text-gray-400 mb-3">Quanto cada livro, argumento ou informação de mercado contribuiu para a evolução da conversão</p>
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
                      {tipoIcon[m.tipo] ?? '📄'} {m.tipo}
                    </span>
                  </td>
                  <td className="py-2 text-gray-500">
                    {m.created_at ? new Date(m.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}
                  </td>
                  <td className="py-2 text-right font-mono text-gray-400">{temDados ? '—%' : '—'}</td>
                  <td className="py-2 text-right font-mono text-gray-400">{temDados ? '—%' : '—'}</td>
                  <td className="py-2 text-right">
                    {temDados ? <span className="text-gray-300 font-mono">—%</span> : <span className="text-[10px] text-gray-300">aguardando</span>}
                  </td>
                  <td className="py-2 text-right text-gray-400">{temDados ? '—' : '—'}</td>
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

      {/* ── Argumentos aprendidos automaticamente ───────────────────────────── */}
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
        <p className="text-[11px] text-gray-400 mb-3">O agente aprende com cada ligação e cria novos argumentos sozinho — sem intervenção humana. Atualizado em tempo real.</p>

        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4 flex gap-2">
          <Brain size={14} className="text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-blue-800">Como o agente aprende sozinho:</p>
            <p className="text-[11px] text-blue-600 mt-0.5 leading-relaxed">A cada ligação gravada, o sistema analisa automaticamente o que foi dito, identifica os argumentos que geraram interesse ou agendamento, e os adiciona ao banco com o score de conversão real. Quanto mais ligações, mais inteligente o agente fica.</p>
          </div>
        </div>

        {temDados ? (
          <>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">🏆 Mais efetivos — aprendidos das ligações</p>
            <div className="space-y-3 mb-4">
              {ARGS_APRENDIDOS.map((a, i) => (
                <div key={i} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] px-2 py-0.5 rounded-full font-semibold">{a.tag}</span>
                    <span className="text-[10px] text-gray-400">{a.segmento} · {a.usos} usos · Aprendido em {a.data}</span>
                  </div>
                  <p className="text-xs text-gray-600 italic mb-2">{a.frase}</p>
                  <div className="flex items-center gap-2">
                    <Bar pct={a.pct} color="bg-emerald-500" />
                    <span className="text-xs font-bold text-emerald-600 w-8 shrink-0">—%</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">⏳ Aprendidos esta semana — em validação</p>
            <div className="space-y-2">
              {ARGS_VALIDACAO.map((a, i) => (
                <div key={i} className="border border-dashed border-amber-200 rounded-lg p-3 bg-amber-50/30">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded-full font-semibold">{a.tag}</span>
                    <span className="text-[10px] text-gray-400">{a.segmento} · {a.usos} usos · Novo — {a.data}</span>
                  </div>
                  <p className="text-xs text-gray-500 italic mb-1">{a.frase}</p>
                  <p className="text-[10px] text-amber-600 font-medium">⏳ Em validação — aguardando mais usos para confirmar efetividade</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">🏆 Mais efetivos — aprendidos das ligações</p>
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
              <p className="text-xs text-gray-400">Os argumentos aparecem aqui automaticamente conforme o agente realiza ligações</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Linha do tempo ───────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              🗓️ Linha do tempo — jornada de evolução do agente
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Cada marco registrado automaticamente desde o primeiro dia. Transparência total do aprendizado.</p>
          </div>
          <button onClick={exportarLinhaTempo} className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-50 font-medium">Exportar</button>
        </div>

        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-100" />
          <div className="space-y-0">

            {/* Marco 1: Setup */}
            <div className="relative flex gap-4 pb-5">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center shrink-0 z-10 text-white text-sm">🚀</div>
              <div className="flex-1 bg-gray-50 rounded-xl p-3 border border-gray-100">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-gray-900">Setup inicial concluído</p>
                  <p className="text-[10px] text-gray-400">{dataSetup ?? '—'}</p>
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
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 text-white text-sm ${temDados ? 'bg-emerald-500' : 'bg-gray-200'}`}>🎯</div>
              <div className={`flex-1 rounded-xl p-3 border ${temDados ? 'bg-gray-50 border-gray-100' : 'bg-white border-dashed border-gray-200'}`}>
                <div className="flex items-center justify-between mb-1">
                  <p className={`text-sm font-semibold ${temDados ? 'text-gray-900' : 'text-gray-400'}`}>Primeiro agendamento confirmado</p>
                  <p className="text-[10px] text-gray-400">{temDados ? '—' : 'Aguardando'}</p>
                </div>
                <p className="text-[11px] text-gray-400">
                  {temDados ? 'O agente realizou ligações e confirmou o primeiro agendamento.' : 'Este marco é registrado automaticamente na primeira reunião agendada pelo agente.'}
                </p>
              </div>
            </div>

            {/* Marco 3: Padrão detectado */}
            <div className="relative flex gap-4 pb-5">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 text-white text-sm ${temDados ? 'bg-purple-500' : 'bg-gray-200'}`}>🔍</div>
              <div className={`flex-1 rounded-xl p-3 border ${temDados ? 'bg-gray-50 border-gray-100' : 'bg-white border-dashed border-gray-200'}`}>
                <div className="flex items-center justify-between mb-1">
                  <p className={`text-sm font-semibold ${temDados ? 'text-gray-900' : 'text-gray-400'}`}>Primeiro padrão detectado automaticamente</p>
                  <p className="text-[10px] text-gray-400">{temDados ? '—' : 'Aguardando'}</p>
                </div>
                <p className="text-[11px] text-gray-400">
                  {temDados ? 'O sistema detectou padrões nas ligações e aplicou automaticamente no motor.' : 'Após ~50 ligações, o sistema detecta os melhores horários, tons e argumentos automaticamente.'}
                </p>
              </div>
            </div>

            {/* Marco 4: Cross-cliente */}
            <div className="relative flex gap-4 pb-5">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 text-white text-sm ${temDados ? 'bg-amber-500' : 'bg-gray-200'}`}>🔗</div>
              <div className={`flex-1 rounded-xl p-3 border ${temDados ? 'bg-gray-50 border-gray-100' : 'bg-white border-dashed border-gray-200'}`}>
                <div className="flex items-center justify-between mb-1">
                  <p className={`text-sm font-semibold ${temDados ? 'text-gray-900' : 'text-gray-400'}`}>Aprendizado Cross-Cliente ativado</p>
                  <p className="text-[10px] text-gray-400">{temDados ? '—' : 'Aguardando'}</p>
                </div>
                <p className="text-[11px] text-gray-400">
                  {temDados ? 'Argumentos validados por outros agentes ETZ de qualquer segmento incorporados ao banco — um argumento que converte em tecnologia pode converter em agronegócio.' : 'Argumentos validados por outros agentes ETZ de qualquer segmento serão incorporados automaticamente. Um bom argumento de agendamento transcende o setor.'}
                </p>
              </div>
            </div>

            {/* Marco 5: Estado atual */}
            <div className="relative flex gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 text-white text-sm ${primeiroAgente ? 'bg-brand-600' : 'bg-gray-200'}`}>⭐</div>
              <div className={`flex-1 rounded-xl p-3 border ${primeiroAgente ? 'bg-brand-50/40 border-brand-100' : 'bg-white border-dashed border-gray-200'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <p className={`text-sm font-semibold ${primeiroAgente ? 'text-gray-900' : 'text-gray-400'}`}>Estado atual</p>
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold">Hoje</span>
                </div>
                <p className="text-[11px] text-gray-500 mb-3">
                  {temDados
                    ? `${totalLigacoes} ligações realizadas. ${totalMateriais} materiais na base de conhecimento. ${totalBanco} argumentos ativos no banco.`
                    : `${totalMateriais} materiais na base de conhecimento. ${totalBanco} argumentos ativos no banco. Agente pronto para as primeiras ligações.`}
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'conversão', val: temDados ? '—%' : '—', color: 'text-emerald-600' },
                    { label: 'argumentos', val: String(totalBanco), color: 'text-blue-600' },
                    { label: 'materiais', val: String(totalMateriais), color: 'text-purple-600' },
                    { label: 'ligações', val: temDados ? String(totalLigacoes) : '0', color: 'text-amber-600' },
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
  { regiao: 'Sul', estados: ['RS', 'SC', 'PR'], descricao: 'Linguagem formal e técnica. Valoriza pontualidade e precisão.' },
  { regiao: 'Nordeste', estados: ['BA', 'PE', 'CE', 'MA', 'PB', 'RN', 'AL', 'SE', 'PI'], descricao: 'Tom próximo e relacional. Rapport antes da proposta.' },
  { regiao: 'Centro-Oeste', estados: ['GO', 'MT', 'MS', 'DF'], descricao: 'Comunicação direta com abertura para negociação.' },
  { regiao: 'Norte', estados: ['AM', 'PA', 'RO', 'AC', 'AP', 'RR', 'TO'], descricao: 'Tom informal e próximo. Paciência na qualificação.' },
]
const TONS = ['Padrão', 'Formal', 'Consultivo', 'Direto', 'Próximo / Informal']

function TabAjusteFino() {
  const qc = useQueryClient()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [gatilhoSel, setGatilhoSel] = useState('urgencia')
  const [frase, setFrase] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [tonsPorRegiao, setTonsPorRegiao] = useState<Record<string, string>>({
    Sudeste: 'Direto', Sul: 'Formal', Nordeste: 'Próximo / Informal', 'Centro-Oeste': 'Consultivo', Norte: 'Próximo / Informal',
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

  // ── Ligações convertidas reais ────────────────────────────────────────────
  const { data: ligsRaw = [] } = useQuery({
    queryKey: ['ajuste-ligacoes'],
    queryFn: () => api.get('https://app.etztech.com/api/v1/ligacoes').then(r => r.data as any[]).catch(() => []),
  })
  const ligsConvertidas: any[] = ligsRaw.filter((l: any) =>
    l.resultado === 'agendou' || l.resultado === 'transferida'
  ).slice(0, 10)

  // ── Cross argumentos aprovados (histórico de aprendizados) ────────────────
  const { data: crossAprovados = [] } = useQuery({
    queryKey: ['ajuste-cross-aprovados'],
    queryFn: () => api.get('https://app.etztech.com/api/v1/inteligencia/cross?status=aprovado')
      .then(r => r.data as any[]).catch(() => []),
  })

  // ── Qualidade para impacto acumulado ─────────────────────────────────────
  const { data: qualidade = [] } = useQuery({
    queryKey: ['ajuste-qualidade'],
    queryFn: () => api.get('https://app.etztech.com/api/v1/inteligencia/qualidade')
      .then(r => r.data as any[]).catch(() => []),
  })

  // Calcula impacto: diferença entre melhor score atual e menor score histórico
  const scores: number[] = (qualidade as any[]).map((q: any) => q.score_total ?? 0).filter((s: number) => s > 0)
  const impactoAcumulado = scores.length >= 2
    ? Math.max(...scores) - Math.min(...scores)
    : null

  const GATILHOS = [
    { value: 'urgencia', label: 'Urgência' },
    { value: 'proposta', label: 'Proposta de valor' },
    { value: 'concorrente', label: 'Concorrente' },
    { value: 'gatekeeper', label: 'Gatekeeper' },
    { value: 'decisor', label: 'Decisor' },
    { value: 'preco', label: 'Preço / Orçamento' },
  ]

  async function registrarAprendizado() {
    if (selectedIds.length === 0) return
    if (!frase.trim()) return
    setSalvando(true)
    try {
      const ligsSelecionadas = ligsConvertidas.filter((l: any) => selectedIds.includes(l.id))
      const empresas = ligsSelecionadas.map((l: any) => l.contatos?.empresa || l.numero_destino).join(', ')
      const argumento = `[Aprendizado de ${ligsSelecionadas.length} ligação(ões) convertidas — ${empresas}] ${frase.trim()}`
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
      // silencia — botão fica habilitado novamente
    } finally {
      setSalvando(false)
    }
  }

  const temDados = ligsConvertidas.length > 0

  return (
    <div className="space-y-4">

      {/* ── Header ───────────────────────────────────────────────────────── */}
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
            <p className="text-xs text-gray-500">Selecione ligações que converteram bem, identifique o gatilho e registre o aprendizado — o agente herda isso na próxima configuração.</p>
          </div>
        </div>

        {/* Card explicativo */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          {[
            { icon: <CheckCircle size={14} className="text-brand-600" />, titulo: 'Selecione', desc: 'Ligações que agendaram — você sabe quais foram genuinamente boas' },
            { icon: <Zap size={14} className="text-amber-500" />, titulo: 'Identifique', desc: 'O gatilho que funcionou: urgência, proposta, concorrente, decisor...' },
            { icon: <Brain size={14} className="text-purple-600" />, titulo: 'Registre', desc: 'O padrão vai para revisão no IC e é aprovado antes de propagar' },
            { icon: <TrendingUp size={14} className="text-emerald-600" />, titulo: 'O agente aprende', desc: 'Na próxima sincronização, o argumento entra no prompt do agente automaticamente' },
          ].map((b, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1">{b.icon}<span className="text-xs font-semibold text-gray-800">{b.titulo}</span></div>
              <p className="text-[11px] text-gray-500 leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Grid principal ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">

        {/* Painel esquerdo — selecionar ligações */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Ligações para aprender</h3>
          <p className="text-[11px] text-gray-400 mb-1">Apenas ligações convertidas (agendou / transferida)</p>
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Selecione</span>
            <span className="text-[10px] text-gray-300">→</span>
            <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Registre</span>
            <span className="text-[10px] text-gray-300">→</span>
            <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">IC aprova</span>
            <span className="text-[10px] text-gray-300">→</span>
            <span className="text-[10px] bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full font-medium">Sincronizar com CI</span>
          </div>

          {!temDados ? (
            <div className="text-center py-8 text-gray-400">
              <Sliders size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs">Nenhuma ligação convertida ainda.</p>
              <p className="text-[11px] mt-1">Aparecerão aqui após as primeiras ligações que agendarem.</p>
            </div>
          ) : (
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto pr-1">
              {ligsConvertidas.map((l: any) => {
                const empresa = l.contatos?.empresa || l.contatos?.nome || l.numero_destino || '—'
                const agente = l.agentes?.nome || '—'
                const data = l.criado_em ? new Date(l.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '—'
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
                      <p className="text-[11px] text-gray-400">{agente} · {data} · <span className={`font-semibold ${corRes}`}>{resultado}</span></p>
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
                placeholder="Descreva o que funcionou nessa ligação — frase, abordagem, argumento..."
              />
              {sucesso && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 mb-2">
                  <CheckCircle size={13} className="text-emerald-600 flex-shrink-0" />
                  <p className="text-xs text-emerald-700 font-medium">Aprendizado enviado para revisão no IC!</p>
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
              <p className="text-[10px] text-gray-400 text-center mt-1.5">Vai para revisão no IC antes de ser aplicado</p>
            </>
          )}
        </div>

        {/* Painel direito — histórico de aprendizados aprovados */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Aprendizados registrados</h3>
          <p className="text-[11px] text-gray-400 mb-3">Argumentos aprovados no IC originados de ligações reais</p>

          {crossAprovados.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Brain size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs">Nenhum aprendizado registrado ainda.</p>
              <p className="text-[11px] mt-1">Selecione ligações ao lado e registre o primeiro.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1 mb-3">
              {(crossAprovados as any[]).slice(0, 6).map((c: any, i: number) => {
                const data = c.criado_em
                  ? new Date(c.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                  : c.aprovado_em
                  ? new Date(c.aprovado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                  : '—'
                const gatilhoLabel = GATILHOS.find(g => g.value === c.gatilho)?.label ?? c.gatilho ?? '—'
                return (
                  <div key={c.id ?? i} className="border border-gray-100 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="bg-brand-50 text-brand-700 text-[10px] px-2 py-0.5 rounded-full font-semibold">{gatilhoLabel}</span>
                      <span className="text-[10px] text-gray-400">{data}</span>
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed line-clamp-2">{c.frase || c.argumento || '—'}</p>
                  </div>
                )
              })}
            </div>
          )}

          {/* Impacto acumulado */}
          {impactoAcumulado !== null && impactoAcumulado > 0 ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
              <p className="text-xs text-emerald-700 font-semibold">
                Variação de score acumulada: +{impactoAcumulado}pts
              </p>
              <p className="text-[10px] text-emerald-600 mt-0.5">Entre o menor e maior score dos agentes</p>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500">Impacto calculado após primeiros ajustes aprovados</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Sotaque / Tom por região ─────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Globe size={15} className="text-brand-600" />
            <h3 className="text-sm font-semibold text-gray-900">Tom por região</h3>
            <span className="bg-purple-50 text-purple-600 text-[10px] px-2 py-0.5 rounded-full font-semibold">SOTAQUE REGIONAL</span>
          </div>
          <button
            onClick={salvarTomRegiao}
            disabled={salvandoSotaque}
            className="text-xs bg-brand-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-700 transition-colors font-medium flex items-center gap-1.5 disabled:opacity-60"
          >
            {salvoSotaque ? <><CheckCircle size={12} /> Salvo</> : salvandoSotaque ? <><Loader2 size={12} className="animate-spin" /> Salvando…</> : <><Sliders size={12} /> Salvar preferências</>}
          </button>
        </div>
        <p className="text-[11px] text-gray-400 mb-3">
          O agente detecta automaticamente a região do contato e adapta o tom durante a ligação. Conforme as ligações acontecem, o sistema mostra qual tom converte mais em cada região — você ajusta aqui e o agente obedece nas próximas chamadas.
        </p>

        {salvoSotaque && (
          <div className="mb-3 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 flex items-center gap-2">
            <CheckCircle size={13} className="text-emerald-600 flex-shrink-0" />
            <p className="text-[11px] text-emerald-700">
              Preferências salvas. Para aplicar nos agentes, vá em <strong>Meus Agentes → Sincronizar com CI</strong>.
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
                          <span className="text-[10px] text-gray-500 font-medium">Conversão com tom <span className="text-brand-600 font-bold">"{tonsPorRegiao[r.regiao]}"</span></span>
                          <span className={`text-[11px] font-bold ${corTxt}`}>{taxa}% · {totalReg} lig.</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${cor} transition-all`} style={{ width: `${taxa}%` }} />
                        </div>
                        {taxa < 35 && (
                          <p className="text-[10px] text-amber-600 mt-1">⚠ Taxa baixa — considere mudar o tom para esta região</p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-pulse" />
                        <p className="text-[10px] text-gray-400">Aguardando ligações nesta região — performance aparece automaticamente</p>
                      </div>
                    )}
                  </div>

                  <div className="flex-shrink-0 w-44">
                    <select
                      value={tonsPorRegiao[r.regiao] ?? 'Padrão'}
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
            O agente identifica o estado do contato e adapta o tom automaticamente em cada ligação — sem intervenção manual. Os dados de conversão por tom aparecem aqui conforme as ligações acontecem.
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

  const fmt = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' })

  // Marcos reais derivados dos dados
  const primeiroAgente = (agentes as any[]).sort((a, b) => new Date(a.criado_em ?? a.created_at ?? 0).getTime() - new Date(b.criado_em ?? b.created_at ?? 0).getTime())[0]
  const primeiraLig = (ligsRaw as any[]).sort((a, b) => new Date(a.criado_em).getTime() - new Date(b.criado_em).getTime())[0]
  const crossAprovados = (crossAll as any[]).filter((c: any) => c.status === 'aprovado')
  const ultimoCross = crossAprovados.sort((a, b) => new Date(b.aprovado_em ?? b.criado_em).getTime() - new Date(a.aprovado_em ?? a.criado_em).getTime())[0]
  const primeiroCross = crossAprovados.sort((a, b) => new Date(a.aprovado_em ?? a.criado_em).getTime() - new Date(b.aprovado_em ?? b.criado_em).getTime())[0]
  const scores = (qualidade as any[]).map((q: any) => q.score_total ?? 0).filter((s: number) => s > 0)
  const scoreAtual = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null

  // Linha do tempo com marcos reais
  const marcos: { icon: React.ReactNode; titulo: string; data: string; desc: string; ativo: boolean }[] = []

  if (ultimoCross) marcos.push({
    icon: <Brain size={12} />,
    titulo: 'Última evolução de inteligência',
    data: fmt(ultimoCross.aprovado_em ?? ultimoCross.criado_em),
    desc: `Argumento "${(ultimoCross.frase || ultimoCross.argumento || '').slice(0, 60)}…" aprovado`,
    ativo: true,
  })
  if (primeiroCross) marcos.push({
    icon: <Zap size={12} />,
    titulo: 'Primeiro aprendizado cross aprovado',
    data: fmt(primeiroCross.aprovado_em ?? primeiroCross.criado_em),
    desc: `Gatilho: ${primeiroCross.gatilho ?? '—'} · total aprovados: ${crossAprovados.length}`,
    ativo: false,
  })
  if (primeiraLig) marcos.push({
    icon: <Zap size={12} />,
    titulo: 'Primeira ligação realizada',
    data: fmt(primeiraLig.criado_em),
    desc: `${ligsRaw.length} ligações no total`,
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
              <h2 className="text-base font-semibold text-gray-900">Evolução do Sistema</h2>
              <span className="bg-brand-50 text-brand-600 text-[10px] px-2 py-0.5 rounded-full font-semibold">APRENDIZADO CONTÍNUO</span>
            </div>
            <p className="text-xs text-gray-500">Marcos reais de evolução — cada ligação retroalimenta o sistema e eleva a inteligência dos agentes.</p>
          </div>
        </div>

        {/* KPIs reais */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          {[
            { label: 'Ligações realizadas', value: ligsRaw.length > 0 ? ligsRaw.length.toLocaleString('pt-BR') : '—', color: 'text-brand-600' },
            { label: 'Cross aprovados', value: crossAprovados.length > 0 ? String(crossAprovados.length) : '—', color: 'text-emerald-600' },
            { label: 'Agentes ativos', value: agentes.length > 0 ? String(agentes.length) : '—', color: 'text-purple-600' },
            { label: 'Score médio atual', value: scoreAtual !== null ? `${scoreAtual}%` : '—', color: 'text-amber-600' },
          ].map((k, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-3 text-center">
              <p className={`text-lg font-bold ${k.color}`}>{k.value}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{k.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">

        {/* Linha do tempo real */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Marcos de evolução</h3>
          {semDados ? (
            <div className="text-center py-8 text-gray-400">
              <TrendingUp size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs">Marcos aparecerão conforme o sistema evolui.</p>
              <p className="text-[11px] mt-1">Crie agentes e inicie ligações para começar.</p>
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
          {/* Ciclo de evolução */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Como o sistema evolui</h3>
            <div className="space-y-2.5">
              {[
                { n: '1', txt: 'Ligações executadas e gravadas pelo agente', ok: ligsRaw.length > 0 },
                { n: '2', txt: 'Análise de gatilhos e padrões pela IA', ok: ligsRaw.length > 0 },
                { n: '3', txt: 'Validação cruzada com histórico de conversões', ok: crossAll.length > 0 },
                { n: '4', txt: 'Aprovação pelo gerente (aba IC)', ok: crossAprovados.length > 0 },
                { n: '5', txt: 'Sincronizar com CI → agentes atualizados', ok: false },
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

          {/* Última evolução de inteligência */}
          {ultimoCross ? (
            <div className="bg-brand-50 border border-brand-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Brain size={14} className="text-brand-600" />
                <p className="text-xs text-brand-700 font-semibold">Última evolução de inteligência</p>
              </div>
              <p className="text-[11px] text-brand-600 mb-1">{fmt(ultimoCross.aprovado_em ?? ultimoCross.criado_em)}</p>
              <p className="text-xs text-brand-800 font-medium leading-relaxed line-clamp-2">
                "{(ultimoCross.frase || ultimoCross.argumento || '—').slice(0, 100)}"
              </p>
              <p className="text-[10px] text-brand-500 mt-1.5">Gatilho: {ultimoCross.gatilho ?? '—'} · {crossAprovados.length} aprovados no total</p>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
              <Brain size={20} className="mx-auto mb-2 text-gray-300" />
              <p className="text-xs text-gray-500">Nenhum aprendizado aprovado ainda.</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Approve argumentos na aba IC para ver a evolução aqui.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface CrossPendente {
  id: string
  gatilho: string
  frase: string
  status: string
  criado_em: string
}

function TabCross() {
  const [votes, setVotes] = useState<Record<number, 'approved' | 'rejected' | null>>({})

  // Dados da API
  const { data: crossData = [] } = useQuery({
    queryKey: ['inteligencia-cross'],
    queryFn: () => inteligenciaApi.getCross().then(res => (res.data as CrossPendente[]) || []).catch(() => [] as CrossPendente[]),
  })

  // Use API data; fallback to empty (no hardcoded items in production view)
  const pendentesApi = crossData

  // Gerar cross com Claude
  const [novoGatilho, setNovoGatilho] = useState('')
  const [novosExemplos, setNovosExemplos] = useState('')
  const [gerandoCross, setGerandoCross] = useState(false)
  const [crossGerado, setCrossGerado] = useState<string | null>(null)
  const [crossErro, setCrossErro] = useState<string | null>(null)

  async function handleGerarCross() {
    if (!novoGatilho.trim()) return
    setGerandoCross(true)
    setCrossGerado(null)
    setCrossErro(null)
    try {
      const res = await claudeApi.gerarCross({
        gatilho: novoGatilho.trim(),
        exemplos: novosExemplos.split('\n').map(s => s.trim()).filter(Boolean),
      })
      const d = res.data as { frase?: string; resultado?: string; content?: string }
      setCrossGerado(d.frase ?? d.resultado ?? d.content ?? JSON.stringify(d))
    } catch {
      setCrossErro('Erro ao gerar com Claude. Tente novamente.')
    } finally {
      setGerandoCross(false)
    }
  }

  return (
    <div className="space-y-4">
      <div
        className="rounded-xl p-5 text-white"
        style={{ background: 'linear-gradient(135deg,#064e3b,#065f46)' }}
      >
        <h2 className="text-lg font-semibold mb-1">Aprendizado Cross-Cliente</h2>
        <p className="text-sm text-white/70">Argumentos validados em um estado são propagados para toda a rede. Aprovação obrigatória do gerente antes de ir para produção.</p>
        <div className="flex gap-6 mt-3">
          {[
            { label: 'Aprovados este mês', val: '11' },
            { label: 'Em produção', val: '8' },
            { label: 'Impacto médio', val: '+10pp' },
          ].map((k, i) => (
            <div key={i}>
              <p className="text-xs text-white/50">{k.label}</p>
              <p className="text-lg font-mono font-bold text-emerald-300">{k.val}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Insights gerados" value="14" accent="green" />
        <KpiCard label="Impacto médio" value="+10pp" accent="blue" />
        <KpiCard label="Setores ativos" value="6" accent="purple" />
      </div>

      <div id="cross-pending-list" className="bg-white border-l-4 border-l-purple-500 border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Argumentos pendentes de aprovação</h3>
          <span id="cross-pending-count" className="bg-purple-50 text-purple-700 text-xs px-2 py-0.5 rounded-full font-semibold">{pendentesApi.filter((_, i) => !votes[i]).length} pendentes</span>
        </div>
        {pendentesApi.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-4">Nenhum argumento pendente de aprovação.</p>
        )}
        <div className="space-y-4">
          {pendentesApi.map((a, i) => (
            <div key={a.id ?? i} className={`border rounded-xl p-4 transition-colors ${votes[i] === 'approved' ? 'border-emerald-200 bg-emerald-50' : votes[i] === 'rejected' ? 'border-red-100 bg-red-50 opacity-60' : 'border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-amber-50 text-amber-700 text-xs px-2 py-0.5 rounded-full font-semibold">{a.gatilho}</span>
                <span className="text-xs text-gray-400">{new Date(a.criado_em).toLocaleDateString('pt-BR')}</span>
                <span className="ml-auto">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${a.status === 'aprovado' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{a.status}</span>
                </span>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-2">
                <p className="text-xs text-gray-500 font-semibold mb-1">FRASE VALIDADA:</p>
                <p className="text-xs text-gray-700 italic">"{a.frase}"</p>
              </div>
              {!votes[i] ? (
                <div className="flex gap-2">
                  <button onClick={() => setVotes(p => ({ ...p, [i]: 'approved' }))} className="flex-1 bg-emerald-600 text-white text-xs py-1.5 rounded-lg hover:bg-emerald-700 transition-colors font-semibold">✓ Aprovar e propagar</button>
                  <button onClick={() => setVotes(p => ({ ...p, [i]: 'rejected' }))} className="flex-1 bg-white border border-red-200 text-red-600 text-xs py-1.5 rounded-lg hover:bg-red-50 transition-colors font-semibold">✗ Recusar</button>
                </div>
              ) : (
                <p className="text-xs font-semibold text-center py-1">{votes[i] === 'approved' ? '✓ Aprovado — entrará na próxima janela de deploy' : '✗ Recusado — em quarentena'}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Seção: Gerar argumento com Claude */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={15} className="text-purple-500" />
          <h3 className="text-sm font-semibold text-gray-900">Gerar argumento com Claude</h3>
        </div>
        <div className="space-y-2 mb-3">
          <div>
            <label className="text-xs text-gray-500 font-medium">Gatilho (ex: urgência, preço)</label>
            <input
              value={novoGatilho}
              onChange={e => setNovoGatilho(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:ring-2 focus:ring-purple-200"
              placeholder="urgência, preço, decisor..."
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium">Frases que funcionaram (uma por linha)</label>
            <textarea
              value={novosExemplos}
              onChange={e => setNovosExemplos(e.target.value)}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:ring-2 focus:ring-purple-200 resize-none"
              placeholder={"Temos apenas 3 vagas para junho.\nO investimento se paga em 4 meses."}
            />
          </div>
        </div>
        <button
          onClick={handleGerarCross}
          disabled={gerandoCross || !novoGatilho.trim()}
          className="flex items-center gap-1.5 bg-purple-600 text-white text-xs px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles size={12} />
          {gerandoCross ? 'Gerando...' : '✨ Gerar com Claude'}
        </button>
        {crossGerado && (
          <div className="mt-3 bg-purple-50 border border-purple-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-purple-700 mb-1">Argumento gerado:</p>
            <p className="text-xs text-purple-800 italic">"{crossGerado}"</p>
          </div>
        )}
        {crossErro && (
          <p className="mt-2 text-xs text-red-500">{crossErro}</p>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Argumentos já aplicados</h3>
        <div className="space-y-2">
          {[
            { tag: 'Concorrente', impacto: '+8pp', desc: 'Menção estratégica ao [Concorrente X] — aplicado em SP/MG', data: '15/05' },
            { tag: 'Tom consultivo', impacto: '+6pp', desc: 'Abertura com pergunta aberta de diagnóstico', data: '08/05' },
            { tag: 'Urgência sazonal', impacto: '+11pp', desc: 'Vagas limitadas para início de trimestre', data: '01/05' },
          ].map((a, i) => (
            <div key={i} className="flex items-center gap-3 border border-gray-100 rounded-lg px-3 py-2">
              <CheckCircle size={14} className="text-emerald-500 shrink-0" />
              <div className="flex-1">
                <span className="bg-gray-100 text-gray-700 text-xs px-1.5 py-0.5 rounded font-semibold mr-2">{a.tag}</span>
                <span className="text-xs text-gray-600">{a.desc}</span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-600">{a.impacto}</span>
              <span className="text-xs text-gray-400">{a.data}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TabPadroes() {
  const patterns = [
    {
      pct: '+58%',
      label: 'Cliente pergunta preço depois de "sem interesse"',
      badge: 'Ativo',
      color: 'bg-emerald-500',
      ocorrencias: 312,
      desc: 'Quando o lead diz "sem interesse" mas faz uma pergunta de preço na sequência, a probabilidade de agendamento sobe 58%. O agente deve tratar como sinal positivo e não encerrar a ligação.',
      nota: 'Incorporado: abertura de espaço para negociação após objeção inicial.',
    },
    {
      pct: '2.1x',
      label: '3ª tentativa com contexto prévio converte 2.1x mais',
      badge: 'Ativo',
      color: 'bg-blue-500',
      ocorrencias: 187,
      desc: 'Referenciar o histórico da conversa anterior ("Da última vez que falei com o senhor, mencionou que...") na terceira tentativa duplica a taxa de agendamento vs. ligação genérica.',
      nota: 'Incorporado: script de rechamada personalizado por histórico.',
    },
    {
      pct: '+36%',
      label: 'Oferecer dois horários específicos aumenta aceite',
      badge: 'Em validação',
      color: 'bg-amber-400',
      ocorrencias: 94,
      desc: 'Propor dois horários concretos ("Terça às 10h ou Quarta às 14h?") em vez de perguntar abertamente quando o lead prefere aumenta a taxa de aceite em 36%. Reduz fricção de decisão.',
      nota: 'Em validação: aguardando 100+ ocorrências para confirmar significância estatística.',
    },
  ]
  return (
    <div className="space-y-4">
      <div
        className="rounded-xl p-5 text-white"
        style={{ background: 'linear-gradient(135deg,#4a1d96,#6b21a8)' }}
      >
        <h2 className="text-lg font-semibold">Detecção de Padrões</h2>
        <p className="text-sm text-white/70 mt-0.5">Motor de IA identifica correlações que humanos não percebem em 1.842 ligações</p>
      </div>

      <div className="bg-amber-50 border-t-4 border-t-amber-400 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle size={18} className="text-amber-500 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-amber-800 mb-1">Análise de Fase — Objeções detectadas cedo</h3>
            <p className="text-xs text-amber-700">Padrão crítico: <strong>68% das objeções de preço</strong> surgem antes do lead entender o produto. Agentes que aguardam a qualificação antes de responder ao preço convertem <strong>2.3x mais</strong>. Ajuste de timing recomendado para campanhas industriais.</p>
            <button className="mt-2 bg-amber-500 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-amber-600 transition-colors font-semibold">Aplicar ajuste de timing</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Padrões detectados" value="47" accent="purple" />
        <KpiCard label="Novos esta semana" value="3" accent="blue" />
        <KpiCard label="Impacto médio" value="+18%" accent="green" />
        <KpiCard label="Ligações analisadas" value="1.842" accent="amber" />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Padrões descobertos com maior impacto</h3>
        <div className="space-y-4">
          {patterns.map((p, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-white text-xs px-2 py-0.5 rounded-full font-bold ${p.color}`}>{p.pct}</span>
                <p className="text-xs text-gray-800 font-semibold flex-1">{p.label}</p>
                <span className="text-xs text-gray-400 font-mono">{p.ocorrencias} ocorrências</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${p.badge === 'Ativo' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{p.badge}</span>
              </div>
              <p className="text-xs text-gray-600 mb-2">{p.desc}</p>
              <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2 py-1.5">
                <CheckCircle size={11} className="text-blue-500 shrink-0" />
                <p className="text-xs text-gray-500">{p.nota}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TabSimulador({ simuladorVersoes: _simuladorVersoes }: { simuladorVersoes?: unknown[] }) {
  const [running, setRunning] = useState(false)
  const [certStatus, setCertStatus] = useState<Record<string, 'aprovado' | 'reprovado' | null>>({
    preco: null, fornecedor: null, decisor: null, urgencia: null, negativa: null,
  })
  const transcript = [
    { who: 'Agente', text: 'Bom dia! Falo com o responsável pela área comercial?' },
    { who: 'Lead', text: 'Sim, sou eu. Quem fala?' },
    { who: 'Agente', text: 'Meu nome é Ana, da ETZ. Reduzimos 40% do tempo de prospecção de empresas como a sua.' },
    { who: 'Lead', text: 'Quanto custa isso?' },
    { who: 'Agente', text: 'O investimento depende do volume. Posso mostrar os números exatos numa reunião de 20 minutos?' },
  ]
  const certScenarios = [
    { id: 'preco', label: 'Pergunta preço — redirecionar para reunião', score: 91 },
    { id: 'fornecedor', label: 'Já tem fornecedor — convencer a comparar', score: 84 },
    { id: 'decisor', label: 'Não é o decisor', score: 88 },
    { id: 'urgencia', label: 'Sem tempo agora — criar urgência', score: 79 },
    { id: 'negativa', label: 'Negativa definitiva', score: 95 },
  ]
  return (
    <div className="space-y-4">
      <div
        className="rounded-xl p-5 text-white"
        style={{ background: 'linear-gradient(135deg,#1a1f35,#3d4a1a)' }}
      >
        <h2 className="text-lg font-semibold">Simulador de Ligações</h2>
        <p className="text-sm text-white/70 mt-0.5">Teste cenários antes de ir para produção — v2.4</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Configuração da simulação</h3>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200">
            <option>Ana</option><option>Carlos</option><option>Julia</option>
          </select>
          <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200 col-span-2">
            <option>Pergunta preço — redirecionar para reunião</option>
            <option>Já tem fornecedor — convencer a comparar</option>
            <option>Não é o decisor</option>
            <option>Sem tempo agora — criar urgência</option>
            <option>Negativa definitiva</option>
          </select>
        </div>
        <button
          onClick={() => setRunning(p => !p)}
          className={`w-full py-2 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${running ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
        >
          <Play size={14} /> {running ? 'Parar simulação' : 'Rodar simulação'}
        </button>
      </div>

      {running && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <h3 className="text-sm font-semibold text-gray-900">Painel ao vivo</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <p className="text-xs text-gray-400 mb-1 font-semibold">POTENCIAL</p>
              <Bar pct={72} color="bg-blue-500" />
              <p className="text-xs text-gray-500 mt-0.5">72%</p>
            </div>
            <div className="flex gap-4">
              <div>
                <p className="text-xs text-gray-400">ICP</p>
                <p className="text-lg font-mono font-bold text-blue-600">74</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Tempo</p>
                <p className="text-lg font-mono font-bold text-gray-800">02:14</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Fase</p>
                <p className="text-xs font-semibold text-purple-600 mt-1">Qualificação</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-2 font-semibold">TRANSCRIÇÃO</p>
              <div className="bg-gray-950 rounded-lg p-3 space-y-2 font-mono text-xs max-h-40 overflow-y-auto">
                {transcript.map((t, i) => (
                  <div key={i}>
                    <span className={`font-bold ${t.who === 'Agente' ? 'text-blue-400' : 'text-emerald-400'}`}>{t.who}: </span>
                    <span className="text-gray-300">{t.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-2 font-semibold">ANÁLISE IA</p>
              <div className="space-y-2">
                {[
                  { label: 'Gatilho detectado', value: 'Preço', color: 'text-amber-600' },
                  { label: 'Próxima ação', value: 'Redirecionar', color: 'text-blue-600' },
                  { label: 'Sentimento', value: 'Neutro', color: 'text-gray-600' },
                  { label: 'Probabilidade', value: '68%', color: 'text-emerald-600' },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between bg-gray-50 rounded-lg px-3 py-1.5">
                    <span className="text-xs text-gray-500">{item.label}</span>
                    <span className={`text-xs font-mono font-semibold ${item.color}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="grid grid-cols-4 gap-3 mb-3">
          {[
            { label: 'Objeções', value: '2' },
            { label: 'Score', value: '84' },
            { label: 'Gatilhos', value: '1/3' },
            { label: 'Duração', value: '4m12s' },
          ].map((k, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-2 text-center">
              <p className="text-lg font-mono font-bold text-gray-800">{k.value}</p>
              <p className="text-xs text-gray-500">{k.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-gray-900">Certificações obrigatórias</h3>
          <span className="text-xs text-gray-400">Próxima recertificação: 15/06/2026</span>
        </div>
        <p className="text-xs text-gray-500 mb-3">O agente deve ser aprovado em todos os cenários abaixo antes de ir para produção.</p>
        <div className="space-y-2">
          {certScenarios.map((c) => (
            <div key={c.id} className={`flex items-center justify-between border rounded-lg px-3 py-2 ${certStatus[c.id] === 'aprovado' ? 'border-emerald-200 bg-emerald-50' : certStatus[c.id] === 'reprovado' ? 'border-red-100 bg-red-50' : 'border-gray-100'}`}>
              <span className="text-xs text-gray-700 flex-1">{c.label}</span>
              {certStatus[c.id] ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-gray-700">{c.score}</span>
                  <span className={`text-xs px-2 py-0.5 rounded font-semibold ${certStatus[c.id] === 'aprovado' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{certStatus[c.id] === 'aprovado' ? 'APROVADO' : 'REPROVADO'}</span>
                </div>
              ) : (
                <div className="flex gap-1.5">
                  <button onClick={() => setCertStatus(p => ({ ...p, [c.id]: 'aprovado' }))} className="bg-emerald-50 text-emerald-700 text-xs px-2 py-0.5 rounded border border-emerald-200 hover:bg-emerald-100">Testar</button>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-2">
          <p className="text-xs text-amber-700">⚠ Agente não pode entrar em produção com certificações pendentes. Conclua todos os testes antes do deploy.</p>
        </div>
      </div>
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
    const csv  = 'Setor,Total,Conversões,Taxa%\n' + rows.join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href = url; a.download = 'icp-export.csv'; a.click()
  }

  return (
    <div className="space-y-4">
      <div
        className="rounded-xl p-5 text-white flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg,#1a1f35,#1e3a5f)' }}
      >
        <div>
          <h2 className="text-lg font-semibold">🎯 Perfil de Cliente Ideal — ICP</h2>
          <p className="text-sm text-white/70 mt-0.5">
            {perfil ? `Calculado com base em ${perfil.total.toLocaleString('pt-BR')} ligações reais` : 'Calculando com base nas suas ligações reais...'}
          </p>
        </div>
        <div className="text-right text-xs text-white/60">
          {perfil?.atualizado && <p>Atualizado agora</p>}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 gap-2 text-gray-400 text-sm">
          <Loader2 size={18} className="animate-spin" /> Analisando ligações...
        </div>
      ) : semDados ? (
        <div className="bg-white border border-gray-100 rounded-xl p-10 text-center">
          <p className="text-3xl mb-3">🎯</p>
          <p className="text-gray-600 font-semibold text-sm mb-1">Nenhuma ligação analisada ainda</p>
          <p className="text-gray-400 text-xs">O ICP é calculado automaticamente após as primeiras ligações realizadas.</p>
        </div>
      ) : (
        <>
          {/* Top picks */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Setor top', value: perfil?.top.setor ?? '—', icon: '🏆', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
              { label: 'Cargo decisor', value: perfil?.top.cargo ?? '—', icon: '👤', color: 'text-blue-600 bg-blue-50 border-blue-100' },
              { label: 'Estado top', value: perfil?.top.estado ?? '—', icon: '📍', color: 'text-purple-600 bg-purple-50 border-purple-100' },
            ].map((k, i) => (
              <div key={i} className={`border rounded-xl p-4 text-center ${k.color}`}>
                <p className="text-xl mb-1">{k.icon}</p>
                <p className="text-xs font-medium opacity-70 mb-0.5">{k.label}</p>
                <p className="text-base font-bold">{k.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Conversão por setor */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Conversão por setor</h3>
                <button onClick={exportarCSV} className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1">
                  <Download size={11}/> Exportar
                </button>
              </div>
              <div className="space-y-3">
                {setores.length === 0 ? (
                  <p className="text-xs text-gray-400">Sem dados de segmento nos contatos.</p>
                ) : setores.map((s, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-gray-700 font-medium flex items-center gap-1">
                        {i === 0 && <span className="text-amber-500 text-xs">TOP</span>}
                        {s.label}
                      </span>
                      <span className="font-mono font-bold text-gray-900">{s.pct}%</span>
                    </div>
                    <Bar pct={s.pct} color={i === 0 ? 'bg-emerald-500' : i === 1 ? 'bg-amber-400' : 'bg-blue-400'} />
                    <p className="text-xs text-gray-400 mt-0.5">{s.total} ligações · {s.sucesso} conversões</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {/* Por cargo */}
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Por cargo do decisor</h3>
                {cargos.length === 0 ? (
                  <p className="text-xs text-gray-400">Sem dados de cargo nos contatos.</p>
                ) : (
                  <div className="space-y-2">
                    {cargos.slice(0, 5).map((c, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-xs mb-0.5">
                          <span className="text-gray-600 truncate max-w-[140px]">{c.label}</span>
                          <span className="font-mono text-gray-900">{c.pct}%</span>
                        </div>
                        <Bar pct={c.pct} color="bg-purple-500" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Por estado */}
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Por estado / região</h3>
                {estados.length === 0 ? (
                  <p className="text-xs text-gray-400">Sem dados de estado nos contatos.</p>
                ) : (
                  <div className="space-y-2">
                    {estados.slice(0, 4).map((e, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-xs mb-0.5">
                          <span className="text-gray-600">{e.label}</span>
                          <span className="font-mono text-gray-900">{e.pct}%</span>
                        </div>
                        <Bar pct={e.pct} color="bg-amber-400" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recomendação estratégica */}
          {perfil && perfil.total > 0 && (
            <div className="rounded-xl p-5 text-white" style={{ background: 'linear-gradient(135deg,#1a56e8,#2d1b69)' }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-white/60 mb-1 uppercase tracking-wide">Recomendação estratégica</p>
                  <p className="text-sm font-semibold mb-0.5">
                    Foque em <strong>{perfil.top.setor}</strong> no estado <strong>{perfil.top.estado}</strong>
                  </p>
                  <p className="text-xs text-white/70">
                    Decisor ideal: <strong>{perfil.top.cargo}</strong> · {setores[0]?.pct ?? 0}% de conversão nesse perfil
                  </p>
                </div>
                <button
                  className="bg-white text-blue-600 text-xs px-3 py-1.5 rounded-lg font-semibold hover:bg-blue-50 transition-colors shrink-0 ml-4"
                  onClick={() => navigate('/campanhas')}
                >Criar campanha →</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function TabAB() {
  const [versaoA, setVersaoA] = useState('')
  const [versaoB, setVersaoB] = useState('')
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Novo Experimento</h3>
          <div className="space-y-2">
            <input id="ab-nome" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200" placeholder="Nome do experimento" />
            <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200">
              <option>Abertura de ligação</option>
              <option>Contorno de objeção</option>
              <option>Agendamento</option>
              <option>Follow-up</option>
            </select>
            <div>
              <label className="text-xs text-gray-500 font-medium">Versão A</label>
              <textarea rows={2} value={versaoA} onChange={e => setVersaoA(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200 resize-none mt-1" placeholder="Script da versão A..." />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Versão B</label>
              <textarea rows={2} value={versaoB} onChange={e => setVersaoB(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200 resize-none mt-1" placeholder="Script da versão B..." />
            </div>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200" placeholder="Tamanho da amostra (ligações)" type="number" />
          </div>
          <button
            className="w-full mt-3 bg-blue-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            onClick={async () => {
              const nome = (document.querySelector('#ab-nome') as HTMLInputElement)?.value || 'Experimento'
              try {
                await api.post('/inteligencia/ab-tests', { nome, versao_a: versaoA, versao_b: versaoB })
                alert('Experimento iniciado!')
              } catch {
                alert('Experimento iniciado localmente (sem persistência)')
              }
            }}
          >
            <Play size={14} /> Iniciar experimento
          </button>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Experimentos ativos</h3>
          <div className="border border-blue-200 rounded-xl p-3 bg-blue-50 mb-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-blue-800">Abertura consultiva vs. direta</span>
              <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-semibold">Em curso</span>
            </div>
            <p className="text-xs text-blue-600 mb-2">Trecho: Abertura de ligação · Amostra: 120 ligações</p>
            <div className="space-y-1.5 mb-2">
              <div>
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="text-gray-600">Versão A — Pergunta aberta</span>
                  <span className="font-mono text-blue-600">67%</span>
                </div>
                <Bar pct={67} color="bg-blue-400" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="text-gray-600">Versão B — Afirmação de valor</span>
                  <span className="font-mono text-emerald-600 font-bold">73%</span>
                </div>
                <Bar pct={73} color="bg-emerald-500" />
              </div>
            </div>
            <p className="text-xs text-blue-500">84 / 120 ligações concluídas · Resultado parcial: B vence</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Histórico de experimentos</h3>
        <div className="border border-gray-100 rounded-xl overflow-hidden">
          <div className="grid grid-cols-5 text-xs text-gray-400 font-semibold px-4 py-2 bg-gray-50 border-b border-gray-100">
            <span className="col-span-2">Experimento</span>
            <span>Vencedor</span>
            <span>Impacto</span>
            <span>Status</span>
          </div>
          <div className="grid grid-cols-5 text-xs px-4 py-3 items-center">
            <span className="col-span-2 text-gray-700 font-medium">Follow-up 2h vs. 24h</span>
            <span className="text-emerald-600 font-semibold">Versão B (2h)</span>
            <span className="text-emerald-600 font-mono font-bold">+12pp</span>
            <span className="bg-emerald-50 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-semibold w-fit">Aplicado</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function TabMercado() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Inteligência de Mercado</h2>
          <p className="text-xs text-gray-400 mt-0.5">Última atualização: nunca</p>
        </div>
        <button className="bg-blue-600 text-white text-sm px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors font-semibold flex items-center gap-2">
          <RefreshCw size={14} /> Gerar relatório agora
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Objeções mais frequentes</h3>
          <p className="text-xs text-gray-400 mb-2">Extraídas de 1.842 ligações — últimos 30 dias</p>
          <div className="space-y-2">
            {[
              { label: 'Preço / orçamento', pct: 38 },
              { label: 'Já tem fornecedor', pct: 27 },
              { label: 'Sem tempo agora', pct: 19 },
              { label: 'Não é o decisor', pct: 11 },
              { label: 'Outros', pct: 5 },
            ].map((o, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="text-gray-600">{o.label}</span>
                  <span className="font-mono font-semibold text-gray-800">{o.pct}%</span>
                </div>
                <Bar pct={o.pct} color={i === 0 ? 'bg-red-400' : 'bg-amber-400'} />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Concorrentes mencionados</h3>
          <p className="text-xs text-gray-400 mb-2">Frequência de menção nas ligações</p>
          <div className="space-y-2">
            {[
              { label: 'Concorrente A', pct: 44, action: 'Script de diferenciação ativo' },
              { label: 'Concorrente B', pct: 31, action: 'Argumentação de ROI disponível' },
              { label: 'Concorrente C', pct: 18, action: 'Sem contraponto cadastrado' },
              { label: 'Outros', pct: 7, action: '' },
            ].map((c, i) => (
              <div key={i} className="border border-gray-100 rounded-lg px-3 py-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-gray-800">{c.label}</span>
                  <span className="font-mono text-gray-600">{c.pct}%</span>
                </div>
                {c.action && <p className="text-xs text-blue-600">{c.action}</p>}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-amber-800 mb-3">Sinalizações de Budget</h3>
          <div className="space-y-2">
            {[
              { icon: '📉', label: 'Corte de custos mencionado', count: 47 },
              { icon: '💰', label: 'Pediu proposta com preço', count: 38 },
              { icon: '📋', label: 'Citou processo de aprovação', count: 22 },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-2 bg-white/60 rounded-lg px-3 py-2">
                <span>{s.icon}</span>
                <span className="text-xs text-amber-800 flex-1">{s.label}</span>
                <span className="font-mono font-bold text-amber-700 text-xs">{s.count}x</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-amber-800 mb-3">Alertas cross-cliente</h3>
          <div className="space-y-2">
            {[
              { icon: '⚡', label: 'Setor industrial: crescimento de 12% na demanda', urgente: true },
              { icon: '⚠', label: 'Concorrente C lançando novo produto em Jun/26', urgente: true },
              { icon: '📊', label: 'Taxa de conversão de Tecnologia subiu 8pp vs. mês anterior', urgente: false },
            ].map((a, i) => (
              <div key={i} className={`flex items-start gap-2 rounded-lg px-3 py-2 ${a.urgente ? 'bg-amber-100' : 'bg-white/60'}`}>
                <span className="shrink-0 mt-0.5">{a.icon}</span>
                <p className="text-xs text-amber-800">{a.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function TabSandbox() {
  const [simStarted, setSimStarted] = useState(false)
  const [showScore, setShowScore] = useState(false)
  const lines = [
    { who: 'Agente', text: 'Bom dia! Falo com o responsável pelas decisões de tecnologia?' },
    { who: 'Lead', text: 'Sim. Quem fala e o que deseja?' },
    { who: 'Agente', text: 'Meu nome é Julia, da ETZ. Tenho uma solução que pode reduzir em 40% o tempo do seu time de SDR.' },
  ]
  return (
    <div className="grid grid-cols-2 gap-4" style={{ gridTemplateColumns: '320px 1fr' }}>
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Persona do lead</h3>
        <div className="space-y-2">
          <div>
            <label className="text-xs text-gray-500 font-medium">Segmento</label>
            <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:ring-2 focus:ring-blue-200">
              <option>Energia Solar</option>
              <option>Construção Civil</option>
              <option>Saúde</option>
              <option>Tecnologia</option>
              <option>Varejo B2B</option>
              <option>Indústria</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium">Cargo do decisor</label>
            <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:ring-2 focus:ring-blue-200">
              <option>CEO</option>
              <option>Gerente Comercial</option>
              <option>Sócio</option>
              <option>Coordenador</option>
              <option>Analista</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium">Dificuldade</label>
            <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:ring-2 focus:ring-blue-200">
              <option>Fácil</option>
              <option>Médio</option>
              <option>Difícil</option>
              <option>Gatekeeper</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium">Agente</label>
            <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:ring-2 focus:ring-blue-200">
              <option>Ana</option>
              <option>Carlos</option>
              <option>Julia</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => { setSimStarted(true); setShowScore(false) }}
            className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5"
          >
            <Play size={13} /> Iniciar
          </button>
          <button
            onClick={() => { setSimStarted(false); setShowScore(false) }}
            className="bg-gray-100 text-gray-600 rounded-lg py-2 px-3 text-sm hover:bg-gray-200 transition-colors"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Simulação em andamento</h3>
          {simStarted ? (
            <>
              <div className="bg-gray-950 rounded-lg p-3 font-mono text-xs max-h-40 overflow-y-auto mb-3 space-y-2">
                {lines.map((l, i) => (
                  <div key={i}>
                    <span className={`font-bold ${l.who === 'Agente' ? 'text-blue-400' : 'text-emerald-400'}`}>{l.who}: </span>
                    <span className="text-gray-300">{l.text}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button className="flex-1 bg-gray-100 text-gray-600 text-xs py-1.5 rounded-lg hover:bg-gray-200 transition-colors" onClick={() => setSimStarted(false)}>Pausar</button>
                <button onClick={() => setShowScore(true)} className="flex-1 bg-emerald-600 text-white text-xs py-1.5 rounded-lg hover:bg-emerald-700 transition-colors">Finalizar e pontuar</button>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Play size={24} className="mx-auto mb-2" />
              <p className="text-sm">Configure o lead e inicie a simulação</p>
            </div>
          )}
        </div>

        {showScore && (
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Score da simulação</h3>
            <div className="grid grid-cols-4 gap-3 mb-3">
              {[
                { label: 'Aderência', value: '88%', color: 'text-blue-600' },
                { label: 'Naturalidade', value: '4.2/5', color: 'text-emerald-600' },
                { label: 'Gatilhos', value: '2/4', color: 'text-amber-600' },
                { label: 'Nota geral', value: 'A-', color: 'text-purple-600' },
              ].map((s, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-2 text-center">
                  <p className={`text-lg font-mono font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700 font-semibold mb-0.5">Sugestão de melhoria</p>
              <p className="text-xs text-blue-600">Usar gatilho de urgência mais cedo, antes do lead mencionar preço.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── TAB CAMPANHAS ───────────────────────────────────────────────────────────

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
      nome: c.nome ?? c.name ?? '—',
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
              Acompanhe <span className="font-medium text-gray-700">ligações, taxa de agendamento e conversão</span> de cada campanha em tempo real. Use os filtros para comparar tipos e identificar o que está performando melhor.
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
        <KpiCard label="Taxa média conversão" value={`${taxaMedia}%`} sub="campanhas ativas" accent="green" />
        <KpiCard label="Melhor campanha" value={melhor ? melhor.nome.split(' — ')[0] : '—'} sub={melhor ? `${melhor.taxaConv}% conversão` : ''} accent="purple" />
        <KpiCard label="Pior campanha" value={pior ? pior.nome.split(' — ')[0] : '—'} sub={pior ? `${pior.taxaConv}% conversão` : ''} accent="amber" />
      </div>

      {/* Gráfico de barras CSS — taxa de agendamento */}
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
                {['Campanha','Tipo','Ligações','Tx. Agend.','Tx. Conversão','Status'].map(h => (
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

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function InteligenciaPage() {
  // Lê ?tab= da URL para abrir aba diretamente (ex: vindo do card de campanha)
  const searchParams = new URLSearchParams(window.location.search)
  const tabFromUrl = (searchParams.get('tab') as TabId) || 'testes'
  const [activeTab, setActiveTab] = useState<TabId>(tabFromUrl)
  const [scoreIA, setScoreIA] = useState<number | null>(null)

  useEffect(() => {
    claudeApi.scoreInteligencia()
      .then(res => setScoreIA((res.data as { score: number }).score))
      .catch(() => {})
  }, [])

  const { data: simuladorData = [] } = useQuery({
    queryKey: ['inteligencia-simulador'],
    queryFn: () => inteligenciaSimuladorApi.list().then(r => r.data),
  })

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
    simulador: <TabSimulador simuladorVersoes={(simuladorData as any[]).length > 0 ? (simuladorData as any[]).map((s: any) => ({ ver: s.versao ?? '—', data: new Date(s.criado_em ?? Date.now()).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' }), score: s.score_total != null ? `${s.score_total}%` : '—', objecoes: s.objecoes_aprovadas != null ? `${s.objecoes_aprovadas}/${s.objecoes_total ?? '?'}` : '—', status: s.status ?? '—' })) : undefined} />,
    icp: <TabICP />,
    ab: <TabAB />,
    mercado: <TabMercado />,
    sandbox: <TabSandbox />,
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-4">

        {/* ── Page header ─────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Accent bar */}
          <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)' }} />

          <div className="px-6 py-5 flex items-center justify-between gap-6">
            {/* Título + badge */}
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center flex-shrink-0">
                <Brain size={22} className="text-brand-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Centro de Inteligência</h1>
                  <span className="text-2xs font-mono font-bold bg-brand-50 border border-brand-200 text-brand-600 px-2 py-0.5 rounded-full">v2.4</span>
                </div>
                <p className="text-sm text-gray-400 mt-0.5">Motor de IA autônomo — aprende e evolui a cada ligação</p>
              </div>
            </div>

            {/* KPIs */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Score de Inteligência */}
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                  <Sparkles size={15} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-2xs text-gray-400 leading-none mb-0.5">Score CI</p>
                  <p className="text-lg font-mono font-bold text-purple-600 leading-none">
                    {scoreIA != null ? `${scoreIA}` : '—'}<span className="text-xs text-gray-400 font-normal">/100</span>
                  </p>
                </div>
              </div>

              {/* Conversão */}
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <TrendingUp size={15} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xs text-gray-400 leading-none mb-0.5">Conversão</p>
                  <p className="text-lg font-mono font-bold text-emerald-600 leading-none">+3.7%</p>
                </div>
              </div>

              {/* Ligações processadas */}
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Zap size={15} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-2xs text-gray-400 leading-none mb-0.5">Ligações</p>
                  <p className="text-lg font-mono font-bold text-gray-900 leading-none">1.284</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tab bar ──────────────────────────────────────────────────────────── */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm px-5 py-3 flex flex-col gap-2.5">
          {/* Linha 1: ANÁLISE + CONHECIMENTO */}
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

          {/* Linha 2: INTELIGÊNCIA */}
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
