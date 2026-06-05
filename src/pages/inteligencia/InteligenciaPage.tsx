import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  FlaskConical, Shield, Users, Clock, BookOpen, Database,
  BarChart2, Sliders, TrendingUp, Share2, GitBranch, Play,
  Target, TestTube2, Globe, Cpu, CheckCircle,
  ChevronRight, Upload, Trash2, RotateCcw, Zap,
  AlertCircle, ArrowRight, RefreshCw, Download, Megaphone, Brain, Sparkles, Loader2,
} from 'lucide-react'
import { inteligenciaQualidadeApi, inteligenciaSimuladorApi, inteligenciaApi, claudeApi, api, qualidadeCalcularApi, campanhasApi } from '@/services/api'

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
  const [abVote, setAbVote] = useState<Record<string, string>>({})
  const [cicloRodou, setCicloRodou] = useState(false)

  const { data: testesData } = useQuery({
    queryKey: ['inteligencia-testes'],
    queryFn: () => api.get('/inteligencia/testes').then(r => r.data as any),
  })
  const testRows: any[] = testesData?.rows ?? []
  const testStats = testesData?.stats ?? { taxaSucesso: 0 }

  const rows = testRows
  return (
    <div className="space-y-4">
      <div
        className="rounded-xl p-5 text-white flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg,#1a1f35,#2d1b69)' }}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🧪</span>
            <h2 className="text-lg font-semibold">Centro de Testes — QA Automático</h2>
          </div>
          <p className="text-sm text-white/60">Validação contínua de scripts e qualidade dos agentes</p>
        </div>
        <button
          onClick={() => setCicloRodou(true)}
          className="bg-white/20 hover:bg-white/30 text-white text-sm px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 border border-white/30"
        >
          <RefreshCw size={14} className={cicloRodou ? 'animate-spin' : ''} />
          {cicloRodou ? 'Rodando ciclo...' : 'Rodar novo ciclo'}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 border-t-4 border-t-emerald-500">
          <p className="text-xs text-gray-500 mb-1">Taxa de sucesso</p>
          <p className="text-2xl font-mono font-bold text-emerald-600">{testStats.taxaSucesso ?? testStats.precisao ?? '—'}%</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 border-t-4 border-t-blue-500">
          <p className="text-xs text-gray-500 mb-1">Score de qualidade</p>
          <p className="text-2xl font-mono font-bold text-blue-600">{testStats.scoreQualidade ?? '—'}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 border-t-4 border-t-purple-500">
          <p className="text-xs text-gray-500 mb-1">Conformidade LGPD</p>
          <p className="text-2xl font-mono font-bold text-purple-600">{testStats.conformidadeLgpd ?? '—'}%</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Ligações simuladas esta semana</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-400 border-b border-gray-100">
              <th className="text-left pb-2">Cenário</th>
              <th className="text-left pb-2">Agente</th>
              <th className="text-left pb-2">Precisão</th>
              <th className="text-left pb-2">Qualidade</th>
              <th className="text-left pb-2">Status</th>
              <th className="text-left pb-2">KPI</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={6} className="py-6 text-center text-xs text-gray-400">Nenhum teste disponível.</td></tr>
            )}
            {rows.map((r: any, i: number) => (
              <tr key={i} className="border-b border-gray-50 last:border-0">
                <td className="py-2 text-gray-700">{r.cenario ?? r.scenario ?? '—'}</td>
                <td className="py-2 text-gray-500">{r.agente ?? r.agent ?? '—'}</td>
                <td className="py-2 font-mono text-gray-900">{r.precisao ?? r.accuracy ?? 0}%</td>
                <td className="py-2 text-amber-400 tracking-tighter">{'★'.repeat(Math.min(r.estrelas ?? r.stars ?? 0, 5))}{'☆'.repeat(Math.max(5 - (r.estrelas ?? r.stars ?? 0), 0))}</td>
                <td className="py-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${(r.status ?? '') === 'Aprovado' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{r.status ?? '—'}</span>
                </td>
                <td className={`py-2 font-mono text-xs font-semibold ${String(r.kpi ?? '').startsWith('+') ? 'text-emerald-600' : 'text-red-500'}`}>{r.kpi ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Próximo ciclo de testes</h3>
          <p className="text-3xl font-mono font-bold text-amber-600 mb-1">14:32:07</p>
          <p className="text-xs text-gray-500">A cada 6h o sistema testa 24 cenários automaticamente</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Aprendizado cross-setor</h3>
          <p className="text-xs text-gray-400 italic">
            Padrões cross-setor aparecerão aqui após ligações suficientes serem processadas.
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Testes A/B ativos</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { name: 'Abertura com pergunta vs afirmação', a: 67, b: 73 },
            { name: 'Follow-up 2h vs 24h', a: 54, b: 61 },
          ].map((ab, i) => {
            const key = `ab${i}`
            return (
              <div key={i} className="border border-gray-100 rounded-lg p-3">
                <p className="text-xs font-medium text-gray-700 mb-2">{ab.name}</p>
                <div className="space-y-1.5 mb-3">
                  <div>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-gray-500">Versão A</span>
                      <span className="font-mono text-gray-700">{ab.a}%</span>
                    </div>
                    <Bar pct={ab.a} color="bg-blue-400" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-gray-500">Versão B</span>
                      <span className="font-mono text-emerald-600 font-semibold">{ab.b}%</span>
                    </div>
                    <Bar pct={ab.b} color="bg-emerald-500" />
                  </div>
                </div>
                <button
                  onClick={() => setAbVote(p => ({ ...p, [key]: 'B' }))}
                  className="w-full text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg py-1.5 hover:bg-emerald-100 transition-colors font-medium"
                >
                  {abVote[key] ? '✓ Vencedor aplicado' : 'Aplicar vencedor (B)'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

interface QualidadeItem {
  agente_id: string
  clareza: number
  empatia: number
  objecoes: number
  fechamento: number
  observacoes?: string
}

function TabQualidade({ agentesQualidade }: { agentesQualidade?: { name: string; score: number; nota: string; ligacoes: number; ultima: string }[] }) {
  const [qualidade, setQualidade] = useState<QualidadeItem[]>([])
  const [loadingQ, setLoadingQ] = useState(true)

  useEffect(() => {
    inteligenciaApi.getQualidade()
      .then(res => setQualidade((res.data as QualidadeItem[]) || []))
      .catch(() => {})
      .finally(() => setLoadingQ(false))
  }, [])

  const agentsMock = [
    { name: 'Ana', score: 94, nota: 'A+', ligacoes: 312, ultima: 'Hoje 09:14' },
    { name: 'Julia', score: 88, nota: 'A', ligacoes: 287, ultima: 'Hoje 09:14' },
    { name: 'Carlos', score: 78, nota: 'B', ligacoes: 198, ultima: 'Hoje 08:47' },
  ]
  const agents = (agentesQualidade && agentesQualidade.length > 0) ? agentesQualidade : agentsMock
  const dims = [
    { label: 'Precisão do script', pct: 94 },
    { label: 'Aderência ao script', pct: 88 },
    { label: 'Qualidade de voz', pct: 92 },
    { label: 'Conformidade legal', pct: 100 },
  ]
  const sotaques = [
    { region: 'SP Interior', pct: 11.2, bar: 78 },
    { region: 'MG', pct: 8.4, bar: 60 },
    { region: 'Grande SP', pct: 5.9, bar: 42 },
  ]
  return (
    <div className="space-y-4">
      {/* Análise por agente via API real */}
      {loadingQ ? (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="h-4 bg-gray-100 rounded animate-pulse w-1/3" />
          {[1,2,3].map(i => (
            <div key={i} className="space-y-2">
              <div className="h-3 bg-gray-100 rounded animate-pulse" />
              <div className="h-2 bg-gray-100 rounded animate-pulse w-4/5" />
            </div>
          ))}
        </div>
      ) : qualidade.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Qualidade por agente — dados reais</h3>
          <div className="space-y-4">
            {qualidade.map((q, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-3">
                <p className="text-xs font-bold text-gray-800 mb-2">{q.agente_id}</p>
                <div className="space-y-2">
                  {([
                    { label: 'Clareza', val: q.clareza },
                    { label: 'Empatia', val: q.empatia },
                    { label: 'Objeções', val: q.objecoes },
                    { label: 'Fechamento', val: q.fechamento },
                  ] as { label: string; val: number }[]).map((m, j) => (
                    <div key={j}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-gray-600">{m.label}</span>
                        <span className="font-mono font-semibold text-gray-900">{m.val}</span>
                      </div>
                      <Bar pct={m.val} color={m.val >= 80 ? 'bg-emerald-500' : m.val >= 60 ? 'bg-blue-500' : 'bg-amber-400'} />
                    </div>
                  ))}
                </div>
                {q.observacoes && <p className="text-xs text-gray-500 mt-2 italic">{q.observacoes}</p>}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-xs text-gray-400">
          Nenhuma avaliação ainda — as análises aparecem automaticamente após ligações gravadas.
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Dimensões de qualidade</h3>
        <div className="space-y-3">
          {dims.map((d, i) => (
            <div key={i}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">{d.label}</span>
                <span className="font-mono font-semibold text-gray-900">{d.pct}%</span>
              </div>
              <Bar pct={d.pct} color={d.pct === 100 ? 'bg-emerald-500' : 'bg-blue-500'} />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Análise por agente</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-400 border-b border-gray-100">
              <th className="text-left pb-2">Agente</th>
              <th className="text-left pb-2">Score</th>
              <th className="text-left pb-2">Nota</th>
              <th className="text-left pb-2">Ligações analisadas</th>
              <th className="text-left pb-2">Última análise</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((a, i) => (
              <tr key={i} className="border-b border-gray-50 last:border-0">
                <td className="py-2 font-medium text-gray-900">{a.name}</td>
                <td className="py-2 font-mono text-gray-900">{a.score}%</td>
                <td className="py-2">
                  <span className="bg-emerald-50 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-semibold">{a.nota}</span>
                </td>
                <td className="py-2 text-gray-600">{a.ligacoes}</td>
                <td className="py-2 text-gray-400 text-xs">{a.ultima}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Performance por sotaque regional</h3>
        <div className="space-y-3">
          {sotaques.map((s, i) => (
            <div key={i}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">{s.region}</span>
                <span className="font-mono font-semibold text-amber-600">+{s.pct}%</span>
              </div>
              <Bar pct={s.bar} color="bg-amber-400" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TabColetiva() {
  const steps = ['Ligações', 'Análise', 'Padrões', 'Aprovação', 'Produção', 'Impacto']
  const segments = [
    { name: 'Indústria', pct: 42 },
    { name: 'Varejo', pct: 38 },
    { name: 'Tecnologia', pct: 61 },
    { name: 'Serviços', pct: 29 },
    { name: 'Saúde', pct: 34 },
    { name: 'Construção', pct: 22 },
  ]
  return (
    <div className="space-y-4">
      <div
        className="rounded-xl p-5 text-white"
        style={{ background: 'linear-gradient(135deg,#2d1b69,#4a1d96)' }}
      >
        <h2 className="text-lg font-semibold mb-3">Inteligência Coletiva</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total insights', value: '847' },
            { label: 'Segmentos ativos', value: '6' },
            { label: 'Impacto acumulado', value: '+14.2%' },
          ].map((k, i) => (
            <div key={i} className="bg-white/10 rounded-lg p-3">
              <p className="text-xs text-white/60 mb-0.5">{k.label}</p>
              <p className="text-xl font-mono font-bold">{k.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: '🌐', label: 'Banco Universal', desc: 'Insights compartilhados entre todos os clientes anonimamente' },
          { icon: '🏢', label: 'Por Segmento', desc: 'Padrões específicos por setor de atuação do lead' },
          { icon: '📊', label: 'Pesquisa Mercado', desc: 'Dados externos de benchmarking e tendências' },
        ].map((c, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-2xl mb-2">{c.icon}</div>
            <p className="text-sm font-semibold text-gray-900 mb-1">{c.label}</p>
            <p className="text-xs text-gray-500">{c.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Ciclo cascade</h3>
        <div className="flex items-center gap-1 flex-wrap">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className="bg-purple-50 border border-purple-200 text-purple-700 text-xs px-3 py-1.5 rounded-lg font-medium">{s}</div>
              {i < steps.length - 1 && <ArrowRight size={12} className="text-gray-400" />}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Mapa de segmentos</h3>
        <div className="grid grid-cols-2 gap-3">
          {segments.map((s, i) => (
            <div key={i}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">{s.name}</span>
                <span className="font-mono text-gray-900 font-semibold">{s.pct}%</span>
              </div>
              <Bar pct={s.pct} color="bg-purple-500" />
            </div>
          ))}
        </div>
      </div>

      <button className="w-full bg-purple-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-purple-700 transition-colors">
        Diagnóstico do ciclo
      </button>
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
  const { data: analise, isLoading, refetch } = useQuery({
    queryKey: ['horarios-analise'],
    queryFn: () => inteligenciaApi.getHorariosAnalise().then(r => r.data as {
      total: number; melhorFaixa: string; atualizado: string;
      faixas: { label: string; total: number; sucesso: number; pct: number }[];
      porAgente: { nome: string; melhorFaixa: string; pctMelhor: number }[];
      porCampanha: CampanhaHorario[];
    }),
    staleTime: 60000,
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
      <div
        className="rounded-xl p-5 text-white flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg,#1a56e8,#2563eb)' }}
      >
        <div>
          <h2 className="text-lg font-semibold">⏰ Horários Inteligentes</h2>
          <p className="text-sm text-white/70">
            A IA analisa <strong>todas as ligações realizadas</strong> e identifica os horários com maior taxa de conversão.
          </p>
        </div>
        <button
          className="bg-white/20 text-white text-xs px-4 py-2 rounded-lg hover:bg-white/30 flex items-center gap-1.5 transition-colors font-semibold border border-white/30"
          onClick={() => refetch()}
        >
          <RefreshCw size={12} /> Reanalisar ligações
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
                    <span className="text-2xs text-gray-400">{f.total} lig.</span>
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
  const [format, setFormat] = useState<string>('livro')
  const [titulo, setTitulo] = useState('')
  const [categoria, setCategoria] = useState('')
  const [urlArtigo, setUrlArtigo] = useState('')
  const [urlVideo, setUrlVideo] = useState('')
  const [textoLivre, setTextoLivre] = useState('')
  const cats = ['livro', 'artigo', 'video', 'audio', 'texto']
  const catLabel: Record<string, string> = { livro: 'Livro/PDF', artigo: 'Artigo/Link', video: 'Vídeo', audio: 'Áudio', texto: 'Texto livre' }

  const { data: conhecimentoData } = useQuery({
    queryKey: ['inteligencia-conhecimento'],
    queryFn: () => api.get('/inteligencia/conhecimento').then(r => r.data as any),
  })
  const library: any[] = conhecimentoData?.items ?? conhecimentoData ?? []
  return (
    <div className="space-y-4">
      <div
        className="rounded-xl p-5 text-white"
        style={{ background: 'linear-gradient(135deg,#1a1f35,#164e63)' }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold mb-2">Base de Conhecimento</h2>
            <div className="flex gap-2 flex-wrap">
              {['PDFs', 'Vídeos', 'Links', 'Áudios', 'Textos'].map(f => (
                <span key={f} className="bg-white/15 text-white text-xs px-2 py-0.5 rounded-full">{f}</span>
              ))}
            </div>
          </div>
          <div className="flex gap-4 text-right">
            {[{ flag: '🇧🇷', lang: 'PT-BR', count: 18 }, { flag: '🇺🇸', lang: 'EN', count: 4 }, { flag: '🌐', lang: 'Outros', count: 2 }].map((l, i) => (
              <div key={i} className="bg-white/10 rounded-lg px-3 py-1.5 text-center">
                <p className="text-base">{l.flag}</p>
                <p className="text-xs text-white/70">{l.lang}</p>
                <p className="text-xs font-bold">{l.count}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Adicionar conhecimento</h3>
          <div className="flex gap-1 mb-4">
            {cats.map(f => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`flex-1 text-xs py-1.5 rounded-lg transition-colors font-medium ${format === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {catLabel[f].split('/')[0]}
              </button>
            ))}
          </div>

          <div className="space-y-2 mb-3">
            <input
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Título do material"
            />
            <select
              value={categoria}
              onChange={e => setCategoria(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="">Categoria</option>
              <option>Vendas e Persuasão</option><option>Setor Industrial</option>
              <option>Tecnologia</option><option>Negociação</option>
              <option>Comportamento do comprador</option><option>Concorrência</option>
              <option>Cases e Referências</option><option>Compliance e LGPD</option>
              <option>Outra</option>
            </select>

            {format === 'livro' && (
              <div className="border-2 border-dashed border-blue-200 rounded-xl p-5 text-center cursor-pointer hover:border-blue-400 transition-colors bg-blue-50">
                <Upload size={20} className="mx-auto text-blue-400 mb-1" />
                <p className="text-xs text-blue-600 font-semibold">Upload de PDF</p>
                <p className="text-xs text-blue-400">Arraste o arquivo ou clique para selecionar</p>
              </div>
            )}
            {format === 'artigo' && (
              <div>
                <input
                  value={urlArtigo}
                  onChange={e => setUrlArtigo(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="URL do artigo (ex: https://...)"
                />
                <p className="text-xs text-gray-400 mt-1">O sistema extrai e indexa o conteúdo automaticamente.</p>
              </div>
            )}
            {format === 'video' && (
              <input
                value={urlVideo}
                onChange={e => setUrlVideo(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="URL YouTube ou Vimeo"
              />
            )}
            {format === 'audio' && (
              <div className="border-2 border-dashed border-purple-200 rounded-xl p-5 text-center cursor-pointer hover:border-purple-400 transition-colors bg-purple-50">
                <Upload size={20} className="mx-auto text-purple-400 mb-1" />
                <p className="text-xs text-purple-600 font-semibold">Upload de áudio</p>
                <p className="text-xs text-purple-400">MP3, WAV ou M4A — transcrição automática</p>
              </div>
            )}
            {format === 'texto' && (
              <textarea
                rows={4}
                value={textoLivre}
                onChange={e => setTextoLivre(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200 resize-none"
                placeholder="Cole ou digite o texto aqui..."
              />
            )}
          </div>

          <div className="mb-3">
            <p className="text-xs font-medium text-gray-700 mb-1.5">O agente deve usar este material para:</p>
            <div className="space-y-1">
              {[
                'Aprender argumentos de persuasão',
                'Melhorar qualificação',
                'Aprender a contornar objeções',
                'Adaptar tom por segmento',
                'Incorporar vocabulário setorial',
              ].map(c => (
                <label key={c} className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded" /> {c}
                </label>
              ))}
            </div>
          </div>
          <button
            className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-blue-700 transition-colors"
            onClick={async () => {
              if (!titulo || !categoria) { alert('Preencha título e categoria'); return }
              try {
                await api.post('/inteligencia/conhecimento', { titulo, categoria, formato: format, url: urlArtigo || urlVideo || undefined, texto: textoLivre || undefined })
                setTitulo(''); setUrlArtigo(''); setUrlVideo(''); setTextoLivre('')
                alert('Material adicionado à base!')
              } catch(e: unknown) { alert('Erro: ' + (e as Error).message) }
            }}
          >
            Adicionar à base
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Materiais', value: '24' },
              { label: 'Insights extraídos', value: '312' },
              { label: 'Impacto conversão', value: '+8.2%' },
              { label: 'Último update', value: 'Hoje' },
            ].map((k, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-3 text-center">
                <p className="text-base font-mono font-bold text-gray-900">{k.value}</p>
                <p className="text-xs text-gray-500">{k.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Biblioteca</h3>
            <div className="space-y-2">
              {library.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">Nenhum material cadastrado ainda.</p>
              )}
              {library.map((b: any, i: number) => (
                <div key={i} className="flex items-center gap-3 border border-gray-100 rounded-lg p-2">
                  <div className="w-8 h-10 rounded flex items-center justify-center text-lg shrink-0" style={{ background: (b.color ?? '#2563eb') + '22' }}>
                    {b.icon ?? '📄'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{b.title ?? b.titulo ?? '—'}</p>
                    <p className="text-xs text-gray-400">{b.author ?? b.autor ?? '—'} · {b.pages ?? b.paginas ?? '—'}p · {b.insights ?? 0} insights</p>
                  </div>
                  <button className="text-gray-300 hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Últimos insights aplicados</h3>
            <div className="space-y-1.5">
              {[
                '"Tom consultivo reduz objeção de preço em 24%"',
                '"Mencionar case de concorrente aumenta atenção"',
                '"Perguntar sobre meta antes de apresentar"',
              ].map((ins, i) => (
                <div key={i} className="flex gap-2 text-xs">
                  <Zap size={11} className="text-amber-400 mt-0.5 shrink-0" />
                  <span className="text-gray-600 italic">{ins}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TabBanco() {
  const { data: bancoData } = useQuery({
    queryKey: ['inteligencia-banco'],
    queryFn: () => api.get('/inteligencia/banco').then(r => r.data as any),
  })
  const argumentosApi: any[] = bancoData?.argumentos ?? bancoData ?? []
  const [localItems, setLocalItems] = useState<any[]>([])
  const argumentos = [...argumentosApi, ...localItems]
  const [novoArg, setNovoArg] = useState({ categoria: '', descricao: '', validade: '', fonte: '' })
  return (
    <div className="space-y-4">
      <div
        className="rounded-xl p-5 text-white"
        style={{ background: 'linear-gradient(135deg,#1a1f35,#1a3a1f)' }}
      >
        <h2 className="text-lg font-semibold">Banco de Argumentos</h2>
        <p className="text-sm text-white/60 mt-0.5">Inteligência de mercado validada em campo — usada em tempo real pelos agentes</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
        <p className="text-xs text-blue-700">💡 Argumentos deste banco são injetados automaticamente pelo motor IA durante as ligações quando o contexto for compatível. Adicione dados atuais de mercado para aumentar a relevância.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Adicionar inteligência de mercado</h3>
          <div className="space-y-2">
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
              <option>Concorrente/Caso</option>
            </select>
            <textarea
              rows={3}
              value={novoArg.descricao}
              onChange={e => setNovoArg(p => ({ ...p, descricao: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200 resize-none"
              placeholder="Descreva o argumento ou insight de mercado..."
            />
            <div className="flex gap-2">
              <input
                value={novoArg.validade}
                onChange={e => setNovoArg(p => ({ ...p, validade: e.target.value }))}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Validade (dias)"
                type="number"
              />
              <input
                value={novoArg.fonte}
                onChange={e => setNovoArg(p => ({ ...p, fonte: e.target.value }))}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Fonte (ex: IBGE, G1, Interno)"
              />
            </div>
          </div>
          <button
            className="w-full mt-3 bg-blue-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-blue-700 transition-colors"
            onClick={async () => {
              if (!novoArg.categoria || !novoArg.descricao) { alert('Preencha os campos obrigatórios'); return }
              const newItem = { label: novoArg.descricao, pct: 0, cat: novoArg.categoria, validade: novoArg.validade ? `${novoArg.validade}d` : '—', fonte: novoArg.fonte || 'Manual' }
              try {
                await api.post('/inteligencia/banco', novoArg)
              } catch { /* fallback to local */ }
              setLocalItems(prev => [newItem, ...prev])
              setNovoArg({ categoria: '', descricao: '', validade: '', fonte: '' })
            }}
          >
            Adicionar ao banco
          </button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <KpiCard label="Argumentos ativos" value="28" accent="blue" />
            <KpiCard label="Taxa de uso" value="67%" accent="green" />
            <KpiCard label="Impacto médio" value="+14%" accent="amber" />
            <KpiCard label="Expirando em 7d" value="3" accent="purple" />
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-3">
            <h3 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Ranking de uso</h3>
            {[
              { label: 'Urgência sazonal', pct: 91 },
              { label: 'Concorrente X', pct: 74 },
              { label: 'Economia — juros', pct: 68 },
            ].map((r, i) => (
              <div key={i} className="mb-2">
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="text-gray-600">{i + 1}. {r.label}</span>
                  <span className="font-mono font-semibold text-gray-800">{r.pct}%</span>
                </div>
                <Bar pct={r.pct} color="bg-blue-400" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Inteligências cadastradas</h3>
        <div className="space-y-2">
          {argumentos.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-4">Nenhum argumento cadastrado ainda.</p>
          )}
          {argumentos.map((item: any, i: number) => (
            <div key={i} className="border border-gray-100 rounded-lg p-3">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-xs font-medium text-gray-800 flex-1">{item.label ?? item.descricao ?? '—'}</p>
                <button onClick={() => setLocalItems(p => p.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-400 transition-colors shrink-0">
                  <Trash2 size={12} />
                </button>
              </div>
              <div className="flex items-center gap-2 mb-1.5">
                <Bar pct={item.pct ?? 0} color="bg-emerald-500" />
                <span className="text-xs font-mono text-emerald-600 w-8">{item.pct ?? 0}%</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                <span className="bg-blue-50 text-blue-700 text-xs px-1.5 py-0.5 rounded">{item.cat ?? item.categoria ?? '—'}</span>
                <span className="bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded">Validade: {item.validade ?? '—'}</span>
                <span className="bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded">Fonte: {item.fonte ?? '—'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TabMetricas() {
  const triggers = [
    { label: 'Pede humano', pct: 91, status: 'Ótimo', statusColor: 'bg-emerald-50 text-emerald-700' },
    { label: 'Urgência', pct: 82, status: '↑ Aumentar', statusColor: 'bg-blue-50 text-blue-700' },
    { label: 'Pergunta preço', pct: 74, status: 'OK', statusColor: 'bg-gray-100 text-gray-600' },
    { label: 'Pede proposta', pct: 68, status: '↑ Aumentar', statusColor: 'bg-blue-50 text-blue-700' },
    { label: 'Menciona concorrente', pct: 43, status: '⚠ Revisar', statusColor: 'bg-amber-50 text-amber-700' },
  ]
  const months = ['Abr 1', 'Abr 2', 'Mai 1', 'Mai 2', 'Mai 3', 'Mai 4', 'Mai 5', 'Mai 6']
  const vals = [6.1, 6.8, 7.2, 7.8, 7.4, 8.1, 8.0, 8.4]
  const topArgs = [
    { label: 'ROI em 6 meses', pct: 91 },
    { label: 'Caso real similar', pct: 88 },
    { label: 'Urgência temporal', pct: 82 },
    { label: 'Dois horários', pct: 79 },
    { label: 'Gatekeeper flow', pct: 74 },
  ]
  const impacts = [
    { material: 'SPIN Selling', antes: '6.2%', depois: '8.4%', impacto: '+35%', usos: 312 },
    { material: 'Objeção ROI', antes: '4.8%', depois: '7.1%', impacto: '+48%', usos: 198 },
    { material: 'Tom consultivo', antes: '5.9%', depois: '7.8%', impacto: '+32%', usos: 287 },
  ]
  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Eficácia dos gatilhos</h3>
          <div className="flex gap-4 text-xs text-gray-500">
            <span className="font-mono font-bold text-blue-600">68% <span className="font-normal text-gray-400">conversão pós-transf.</span></span>
            <span className="font-mono font-bold text-purple-600">47 <span className="font-normal text-gray-400">transferências</span></span>
            <span className="font-mono font-bold text-emerald-600">Urgência <span className="font-normal text-gray-400">top gatilho</span></span>
          </div>
        </div>
        <div className="space-y-2 mb-3">
          {triggers.map((t, i) => (
            <div key={i}>
              <div className="flex justify-between text-xs mb-0.5">
                <span className="text-gray-600">{t.label}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${t.statusColor}`}>{t.status}</span>
                  <span className="font-mono font-semibold text-gray-900">{t.pct}%</span>
                </div>
              </div>
              <Bar pct={t.pct} color={t.pct >= 80 ? 'bg-emerald-500' : t.pct >= 60 ? 'bg-blue-500' : 'bg-amber-400'} />
            </div>
          ))}
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-blue-800">Recomendação IA</p>
            <p className="text-xs text-blue-600">Aumentar peso do gatilho "Pede proposta" em campanhas industriais</p>
          </div>
          <button className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors font-semibold">Aplicar</button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Taxa conversão" value="8.4%" accent="green" />
        <KpiCard label="Argumentos" value="28" accent="blue" />
        <KpiCard label="Materiais" value="24" accent="purple" />
        <KpiCard label="Score médio" value="94" accent="amber" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Evolução de conversão</h3>
          {/* event markers indexed by bar position */}
          {(() => {
            const events: Record<number, string> = { 2: 'v2.0', 4: 'Cross ativo', 7: 'v2.4' }
            return (
              <div className="relative">
                <div className="flex items-end gap-1 h-24">
                  {vals.map((v, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 relative">
                      {events[i] && (
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                          <span className="bg-purple-100 text-purple-700 text-xs px-1 py-0.5 rounded font-semibold" style={{ fontSize: '9px' }}>{events[i]}</span>
                        </div>
                      )}
                      <div
                        className={`w-full rounded-t ${events[i] ? 'bg-purple-500' : 'bg-blue-500'}`}
                        style={{ height: `${(v / 10) * 96}px` }}
                      />
                      <span className="text-gray-400" style={{ fontSize: '9px' }}>{months[i]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Top 5 argumentos</h3>
          <div className="space-y-2">
            {topArgs.map((a, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-mono w-4">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-gray-700">{a.label}</span>
                    <span className="font-mono text-emerald-600">{a.pct}%</span>
                  </div>
                  <Bar pct={a.pct} color="bg-emerald-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Impacto por material</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-400 border-b border-gray-100">
              <th className="text-left pb-2">Material</th>
              <th className="text-left pb-2">Antes</th>
              <th className="text-left pb-2">Depois</th>
              <th className="text-left pb-2">Impacto</th>
              <th className="text-left pb-2">Usos</th>
            </tr>
          </thead>
          <tbody>
            {impacts.map((r, i) => (
              <tr key={i} className="border-b border-gray-50 last:border-0">
                <td className="py-2 text-gray-700">{r.material}</td>
                <td className="py-2 font-mono text-gray-500">{r.antes}</td>
                <td className="py-2 font-mono text-gray-900 font-semibold">{r.depois}</td>
                <td className="py-2">
                  <span className="text-emerald-600 font-mono font-bold">{r.impacto}</span>
                </td>
                <td className="py-2 text-gray-500">{r.usos}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Argumentos aprendidos automaticamente</h3>
          <span className="bg-purple-50 text-purple-600 text-xs px-2 py-0.5 rounded-full font-semibold">AUTO-APRENDIZADO</span>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-3">
          <p className="text-xs text-purple-700">O sistema analisa cada ligação e extrai padrões que aumentam conversão. Estes argumentos foram gerados autonomamente e validados em campo.</p>
        </div>
        <div className="space-y-3">
          {[
            { tag: 'Objeção de preço', quote: '"Entendo a preocupação. Nossos clientes no setor recuperam o investimento em média em 4 meses."', pct: 91 },
            { tag: 'Decisor ausente', quote: '"Posso agendar diretamente com a [nome]? Tenho 15 minutos que valem a pena."', pct: 78 },
            { tag: 'Urgência', quote: '"Temos 3 vagas abertas para iniciar em junho. Prefere garantir a sua?"', pct: 82 },
            { tag: 'Proposta', quote: '"Posso enviar um comparativo direto antes da nossa conversa, facilita muito."', pct: 74 },
          ].map((a, i) => (
            <div key={i} className="border border-gray-100 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="bg-amber-50 text-amber-700 text-xs px-2 py-0.5 rounded-full font-semibold">{a.tag}</span>
              </div>
              <p className="text-xs text-gray-600 italic mb-2">{a.quote}</p>
              <div className="flex items-center gap-2">
                <Bar pct={a.pct} color="bg-emerald-500" />
                <span className="text-xs font-mono text-emerald-600 w-8">{a.pct}%</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 border-t border-gray-100 pt-3">
          <p className="text-xs text-gray-400 mb-2">Em validação</p>
          <div className="space-y-2">
            {[
              { tag: 'Concorrente', quote: '"[Concorrente X] cobra por licença. Nós cobramos por resultado."', pct: 61 },
              { tag: 'Follow-up', quote: '"Vi que o [segmento] cresceu 12% esse trimestre. Tem a ver com o projeto que discutimos?"', pct: 55 },
            ].map((a, i) => (
              <div key={i} className="border border-dashed border-gray-200 rounded-lg p-3 opacity-70">
                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full font-semibold">{a.tag}</span>
                <p className="text-xs text-gray-500 italic mt-1">{a.quote}</p>
              </div>
            ))}
          </div>
        </div>
        <button className="w-full mt-3 text-xs text-blue-600 hover:text-blue-700 font-semibold py-1">Ver todos os argumentos →</button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Timeline de evolução</h3>
        <div className="relative">
          <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200" />
          {[
            { date: 'Mar 2026', label: 'Setup inicial', desc: 'Configuração base + primeiro agente', color: 'bg-gray-400' },
            { date: 'Mar 2026', label: 'Primeiro agendamento', desc: 'Ana consegue reunião em 2h', color: 'bg-emerald-500' },
            { date: 'Abr 2026', label: 'Primeiro padrão', desc: 'Urgência detectada como gatilho top', color: 'bg-blue-500' },
            { date: 'Abr 2026', label: 'v2.0 deploy', desc: 'Motor de IA reescrito com pesos dinâmicos', color: 'bg-purple-500' },
            { date: 'Mai 2026', label: 'Cross-cliente ativo', desc: 'Primeiro argumento propagado entre campanhas', color: 'bg-amber-500' },
            { date: 'Mai 2026', label: 'Hoje — v2.4', desc: '+8.4% conversão vs baseline', color: 'bg-emerald-600' },
          ].map((m, i) => (
            <div key={i} className="flex gap-4 mb-3 relative pl-8">
              <div className={`absolute left-1.5 top-1.5 w-3 h-3 rounded-full ${m.color} border-2 border-white`} />
              <div>
                <p className="text-xs text-gray-400">{m.date}</p>
                <p className="text-sm font-semibold text-gray-900">{m.label}</p>
                <p className="text-xs text-gray-500">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TabAjusteFino() {
  const [selected, setSelected] = useState<number[]>([0, 1])
  const [gatilhoSel, setGatilhoSel] = useState('Urgência')
  const [keywordsExtra, setKeywordsExtra] = useState('')
  const toggle = (i: number) => setSelected(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i])
  const calls = [
    { id: 0, label: 'Supermercados Norte — 12 min', sub: 'Conversão: Agendou' },
    { id: 1, label: 'Grupo ABC — 8 min', sub: 'Conversão: Agendou' },
    { id: 2, label: 'Delta Ind. — 6 min', sub: 'Conversão: Retornar' },
  ]
  const history = [
    { num: 4, delta: '+1.8%', desc: 'Reforço no gatilho de urgência', date: '22/05' },
    { num: 3, delta: '+0.9%', desc: 'Ajuste de tom para setor industrial', date: '15/05' },
    { num: 2, delta: '+1.2%', desc: 'Otimização de abertura da ligação', date: '08/05' },
  ]
  return (
    <div className="space-y-4">
      <div
        className="rounded-xl p-5 text-white"
        style={{ background: 'linear-gradient(135deg,#1a1f35,#312e81)' }}
      >
        <h2 className="text-lg font-semibold">Ajuste Fino por Conversas Reais</h2>
        <p className="text-sm text-white/60 mt-0.5">Selecione ligações de alto desempenho para refinar o comportamento dos agentes</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Ajuste fino por conversas reais</h3>
          <div className="space-y-2 mb-4">
            {calls.map(c => (
              <label key={c.id} className="flex items-center gap-2 p-2 border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={selected.includes(c.id)}
                  onChange={() => toggle(c.id)}
                  className="rounded"
                />
                <div>
                  <p className="text-xs font-semibold text-gray-800">{c.label}</p>
                  <p className="text-xs text-gray-500">{c.sub}</p>
                </div>
              </label>
            ))}
          </div>
          <select
            value={gatilhoSel}
            onChange={e => setGatilhoSel(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2 outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option>Urgência</option>
            <option>Proposta</option>
            <option>Concorrente</option>
            <option>Gatekeeper</option>
          </select>
          <input
            value={keywordsExtra}
            onChange={e => setKeywordsExtra(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="Keywords adicionais (separadas por vírgula)"
          />
          <button
            className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-blue-700 transition-colors"
            onClick={async () => {
              if (selected.length === 0) { alert('Selecione pelo menos uma ligação'); return }
              try {
                await api.post('/inteligencia/ajuste-fino', { ligacoes_ids: selected, gatilho: gatilhoSel, keywords: keywordsExtra })
                setSelected([])
                alert('Ajuste fino iniciado! Resultados em ~24h.')
              } catch { alert('Erro ao iniciar ajuste fino') }
            }}
          >
            Iniciar ajuste fino
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Histórico de ajustes finos</h3>
          <div className="space-y-3 mb-4">
            {history.map((h, i) => (
              <div key={i} className="border border-gray-100 rounded-lg p-3">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-semibold text-gray-800">Ajuste #{h.num}</span>
                  <span className="text-emerald-600 font-mono font-bold text-sm">{h.delta}</span>
                </div>
                <p className="text-xs text-gray-500">{h.desc}</p>
                <p className="text-xs text-gray-400 mt-0.5">{h.date}</p>
              </div>
            ))}
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
            <p className="text-xs text-emerald-700 font-semibold">Impacto acumulado: +3.9%</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-sm font-semibold text-gray-900">Ajuste fino por sotaque regional</h3>
          <span className="bg-purple-50 text-purple-600 text-xs px-2 py-0.5 rounded-full font-semibold">AUTO-APRENDIZADO</span>
        </div>
        <p className="text-xs text-gray-500">
          O sistema detecta padrões de conversão por sotaque e ajusta automaticamente o modelo de fala dos agentes.
          Regiões com maior desvio de performance recebem sessões específicas de ajuste fino para maximizar rapport.
        </p>
      </div>
    </div>
  )
}

function TabEvolucao() {
  return (
    <div className="space-y-4">
      <div
        className="rounded-xl p-5 text-white"
        style={{ background: 'linear-gradient(135deg,#1a1f35,#134e4a)' }}
      >
        <h2 className="text-lg font-semibold">Evolução do Sistema</h2>
        <p className="text-sm text-white/60 mt-0.5">Histórico de versões e ciclo de evolução automático</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Linha do tempo</h3>
          <div className="relative">
            <div className="absolute left-3 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-gray-200" />
            {[
              { version: 'v2.4', active: true, date: 'Hoje', desc: '+2 gatilhos / +1 sotaque / Score +4 pts' },
              { version: 'v2.3', active: false, date: '15 Mai', desc: 'Motor cross-cliente ativado' },
              { version: 'v2.1', active: false, date: '02 Abr', desc: 'ICP dinâmico por campanha' },
              { version: 'v1.0', active: false, date: 'Mar 2026', desc: 'Setup inicial — 3 agentes' },
            ].map((v, i) => (
              <div key={i} className="flex gap-3 mb-4 relative pl-8">
                <div className={`absolute left-0.5 top-1 w-5 h-5 rounded-full flex items-center justify-center ${v.active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  <span className="text-xs font-bold">{i + 1}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${v.active ? 'text-blue-600' : 'text-gray-700'}`}>{v.version}</span>
                    {v.active && <span className="bg-blue-50 text-blue-600 text-xs px-1.5 py-0.5 rounded font-semibold">ATIVA</span>}
                    <span className="text-xs text-gray-400">{v.date}</span>
                  </div>
                  <p className="text-xs text-gray-500">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Ciclo de evolução automático</h3>
            <div className="space-y-2">
              {[
                '1. Ligações executadas e gravadas',
                '2. Análise de gatilhos e padrões (IA)',
                '3. Validação cruzada com histórico',
                '4. Aprovação pelo gerente (cross-cliente)',
                '5. Deploy automático na próxima janela',
              ].map((s, i) => (
                <div key={i} className="flex gap-2 text-xs text-gray-600">
                  <ChevronRight size={12} className="text-blue-500 mt-0.5 shrink-0" />
                  {s}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-xs text-blue-600 font-semibold mb-1">Próximo deploy</p>
            <p className="text-3xl font-mono font-bold text-blue-700 mb-2">3d 04h 12m</p>
            <p className="text-xs text-blue-600 font-semibold mb-1">v2.5 — Melhorias previstas:</p>
            <ul className="space-y-1">
              {['+3 novos gatilhos de setor saúde', 'Sotaque Nordeste ativado', 'A/B automático para abertura de ligação'].map((b, i) => (
                <li key={i} className="text-xs text-blue-600 flex gap-1.5">
                  <CheckCircle size={12} className="mt-0.5 shrink-0" /> {b}
                </li>
              ))}
            </ul>
          </div>
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
  icpMedio: number
  status: 'ativa' | 'pausada'
}

function TabCampanhas() {
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')

  const { data: campanhasInt = [] } = useQuery({
    queryKey: ['campanhas'],
    queryFn: () => campanhasApi.list().then(r => r.data as any[]),
  })

  const CAMPANHAS_INT: CampanhaRow[] = (campanhasInt as any[]).map((c: any) => ({
    nome: c.nome ?? c.name ?? '—',
    tipo: (['outbound', 'inbound', 'nurturing'].includes(c.tipo ?? c.type ?? '') ? (c.tipo ?? c.type) : 'outbound') as CampanhaRow['tipo'],
    ligacoes: c.ligacoes ?? c.total_ligacoes ?? 0,
    taxaAgend: c.taxaAgend ?? c.taxa_agend ?? c.taxa_agendamento ?? 0,
    taxaConv: c.taxaConv ?? c.taxa_conv ?? c.taxa_conversao ?? 0,
    icpMedio: c.icpMedio ?? c.icp_medio ?? 0,
    status: (['ativa', 'pausada'].includes(c.status ?? '') ? c.status : 'ativa') as CampanhaRow['status'],
  }))

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
                {['Campanha','Tipo','Ligações','Tx. Agend.','Tx. Conversão','ICP Médio','Status'].map(h => (
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
                    <span className={`text-xs font-bold font-mono ${c.icpMedio >= 80 ? 'text-emerald-600' : c.icpMedio >= 65 ? 'text-amber-600' : 'text-red-500'}`}>{c.icpMedio}</span>
                  </td>
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
  const [calculando, setCalculando] = useState(false)
  const queryClient = useQueryClient()

  const recalcularScores = async () => {
    setCalculando(true)
    try {
      await qualidadeCalcularApi.calcular()
      queryClient.invalidateQueries({ queryKey: ['inteligencia-qualidade'] })
    } finally {
      setCalculando(false)
    }
  }

  useEffect(() => {
    claudeApi.scoreInteligencia()
      .then(res => setScoreIA((res.data as { score: number }).score))
      .catch(() => {})
  }, [])

  const { data: qualidadeData = [] } = useQuery({
    queryKey: ['inteligencia-qualidade'],
    queryFn: () => inteligenciaQualidadeApi.list().then(r => r.data),
  })

  const { data: simuladorData = [] } = useQuery({
    queryKey: ['inteligencia-simulador'],
    queryFn: () => inteligenciaSimuladorApi.list().then(r => r.data),
  })

  const agentesQualidade = (qualidadeData as any[]).length > 0
    ? (qualidadeData as any[]).map((q: any) => ({
        name: q.agentes?.nome ?? 'Agente',
        score: q.score_total ?? 0,
        nota: q.nota ?? '—',
        ligacoes: q.ligacoes_analisadas ?? 0,
        ultima: q.ultima_analise ?? '—',
      }))
    : undefined

  const tabContent: Record<TabId, React.ReactNode> = {
    testes: <TabTestes />,
    qualidade: (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">Qualidade dos Agentes</span>
          <button
            onClick={recalcularScores}
            disabled={calculando}
            className="text-xs px-3 py-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 flex items-center gap-1.5"
            style={{ background: calculando ? undefined : '#4F46E5' }}
          >
            {calculando ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            Recalcular scores
          </button>
        </div>
        <TabQualidade agentesQualidade={agentesQualidade} />
      </div>
    ),
    coletiva: <TabColetiva />,
    horarios: <TabHorarios />,
    campanhas: <TabCampanhas />,
    conhecimento: <TabConhecimento />,
    banco: <TabBanco />,
    metricas: <TabMetricas />,
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
