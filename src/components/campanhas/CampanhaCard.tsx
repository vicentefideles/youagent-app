import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Play, Pause, Users, Phone, Calendar, BarChart2,
  Brain, MoreHorizontal, Zap, Target,
  TrendingUp, Clock, CheckCircle2, AlertTriangle, Sparkles, Settings, Loader2, X, List, RefreshCw
} from 'lucide-react'
import clsx from 'clsx'
import type { Campanha } from '@/types/campanha'
import { claudeApi, campanhasApi, contatosApi } from '@/services/api'

interface Props {
  campanha: Campanha
  onPausar: (id: string) => void | Promise<void>
  onIniciar: (id: string) => void | Promise<void>
  onImportar: (campanha: Campanha) => void
  onVerFila: (campanha: Campanha) => void
  onEditar?: (campanha: Campanha) => void
  onAgressividade?: (campanha: Campanha) => void
  onReprocessar?: (campanha: Campanha) => void
}

const TIPO_LABELS: Record<string, string> = {
  outbound:  'Outbound',
  inbound:   'Inbound',
  renovacao: 'Renovação',
  b2c:       'B2C',
  nurturing: 'Nutrição',
}

const MODAL_CONFIG = {
  online:     { icon: '💻', label: 'Online',     color: 'text-brand-600',   bg: 'bg-brand-50' },
  presencial: { icon: '🏢', label: 'Presencial', color: 'text-amber-700',   bg: 'bg-amber-50' },
  hibrido:    { icon: '🔀', label: 'Híbrido',    color: 'text-emerald-700', bg: 'bg-emerald-50' },
}

const AGRESS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  baixa:  { label: 'Baixa',  color: 'text-brand-700',   bg: 'bg-brand-50'  },
  media:  { label: 'Média',  color: 'text-amber-700',   bg: 'bg-amber-50'  },
  alta:   { label: 'Alta',   color: 'text-orange-700',  bg: 'bg-orange-50' },
  maxima: { label: 'Máxima', color: 'text-red-700',     bg: 'bg-red-50'    },
}

interface AnaliseLista {
  score_qualidade?: number
  icp_aderencia?: string
  perfil_dominante?: string
  recomendacoes?: string[]
  alertas?: string[]
}

interface HorarioSugestao {
  horarios?: string[]
  justificativa?: string
  melhores_horarios?: string[]
}

export default function CampanhaCard({ campanha, onPausar, onIniciar, onImportar: _onImportar, onVerFila: _onVerFila, onEditar, onAgressividade, onReprocessar }: Props) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [iaAberta, setIaAberta] = useState(false)
  const [analisando, setAnalisando] = useState(false)
  const [analise, setAnalise] = useState<AnaliseLista | null>(null)
  const [buscandoHorario, setBuscandoHorario] = useState(false)
  const [horarioSugerido, setHorarioSugerido] = useState<HorarioSugestao | null>(null)
  const [pausandoOuIniciando, setPausandoOuIniciando] = useState(false)
  const [leadsAberto, setLeadsAberto] = useState(false)
  const [leads, setLeads] = useState<Record<string, string>[]>([])
  const [leadsTotal, setLeadsTotal] = useState(0)
  const [leadsPagina, setLeadsPagina] = useState(1)
  const [carregandoLeads, setCarregandoLeads] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const LEADS_LIMIT = 100

  async function carregarLeads(pagina = 1) {
    setCarregandoLeads(true)
    try {
      const res = await contatosApi.list(campanha.id, pagina, LEADS_LIMIT)
      const body = res.data as { data: Record<string, string>[]; total: number; page: number }
      setLeads(body.data ?? [])
      setLeadsTotal(body.total ?? 0)
      setLeadsPagina(pagina)
    } catch { setLeads([]); setLeadsTotal(0) }
    finally { setCarregandoLeads(false) }
  }

  async function abrirLeads() {
    setLeadsAberto(true)
    if (leads.length > 0) return
    carregarLeads(1)
  }

  // Fechar menu ao clicar fora
  useEffect(() => {
    if (!menuOpen) return
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  async function handleAnalisarLista() {
    setAnalisando(true)
    setAnalise(null)
    try {
      const d = campanha.dashboard
      const res = await claudeApi.analisarLista({
        campanha_id: campanha.id,
        segmento: campanha.segmento ?? undefined,
        total_contatos: d?.total_lista ?? undefined,
      })
      setAnalise(res.data as AnaliseLista)
    } catch {
      setAnalise({ alertas: ['Erro ao analisar lista. Tente novamente.'] })
    } finally {
      setAnalisando(false)
    }
  }

  async function handleSugerirHorario() {
    setBuscandoHorario(true)
    setHorarioSugerido(null)
    try {
      const res = await claudeApi.sugerirHorario({ segmento: campanha.segmento ?? undefined })
      setHorarioSugerido(res.data as HorarioSugestao)
    } catch {
      setHorarioSugerido({ justificativa: 'Erro ao buscar sugestão. Tente novamente.' })
    } finally {
      setBuscandoHorario(false)
    }
  }

  const d = campanha.dashboard
  const total      = d?.total_lista    ?? 0
  const feitas     = d?.ligacoes_feitas ?? 0
  const faltam     = Math.max(0, total - feitas)
  const agendadas  = d?.agendadas      ?? 0
  const naFila     = d?.na_fila        ?? 0
  const duplicados = campanha.lista_duplicados ?? d?.duplicados ?? 0
  const conversao  = total > 0 ? ((agendadas / Math.max(feitas, 1)) * 100).toFixed(1) : '0.0'
  const consumoPct = total > 0 ? Math.min(100, Math.round((feitas / total) * 100)) : 0

  const modal   = MODAL_CONFIG[campanha.modalidade] ?? MODAL_CONFIG.online
  const agress  = AGRESS_CONFIG[campanha.agressividade] ?? AGRESS_CONFIG.media
  const ativa   = campanha.status === 'ativa'

  // Cor da barra de consumo
  const barColor = consumoPct >= 90 ? 'bg-red-500'
                 : consumoPct >= 70 ? 'bg-amber-400'
                 : 'bg-brand'

  // Alerta dinâmico
  const alerta = (() => {
    if (!ativa)       return { icon: '⏸️', text: 'Campanha pausada', color: 'bg-gray-50 border-gray-200 text-gray-500' }
    if (faltam === 0) return { icon: '✅', text: 'Lista esgotada — importe novos leads', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' }
    if (consumoPct >= 80) return { icon: '⚠️', text: `${faltam} leads restantes — considere importar mais`, color: 'bg-amber-50 border-amber-200 text-amber-700' }
    return { icon: '🟢', text: `${naFila} leads na fila · rodando normalmente`, color: 'bg-emerald-50 border-emerald-200 text-emerald-700' }
  })()

  return (
    <div className={clsx(
      'card flex flex-col gap-0 overflow-hidden transition-shadow hover:shadow-md',
      !ativa && 'opacity-80'
    )}>

      {/* Header */}
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={clsx('badge', ativa ? 'badge-success' : 'badge-neutral')}>
                {ativa ? '● Ativa' : '⏸ Pausada'}
              </span>
              <span className="badge badge-neutral text-xs">
                {TIPO_LABELS[campanha.tipo] ?? campanha.tipo}
              </span>
              <span className={clsx('badge text-xs', agress.color, agress.bg)}>
                {agress.label}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2">
              {campanha.nome}
            </h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={clsx('text-xs font-medium', modal.color)}>
                {modal.icon} {modal.label}
              </span>
              {campanha.estado && (
                <span className="text-xs text-gray-400">{campanha.estado}</span>
              )}
              {campanha.icp_ativo && (
                <button
                  onClick={() => navigate('/inteligencia?tab=icp')}
                  className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-100 transition-colors"
                  title="Ver análise ICP no Centro de Inteligência"
                >
                  <Target size={10} /> ICP ativo · {campanha.icp_threshold}+
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Config IA */}
            <button
              onClick={() => onEditar && onEditar(campanha)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium
                         text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              title="Configurar IA"
            >
              <Settings size={12} /> Config IA
            </button>

            {/* Agressividade */}
            <button
              onClick={() => onAgressividade && onAgressividade(campanha)}
              className={clsx(
                'flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors',
                agress.color, agress.bg,
                'hover:opacity-80'
              )}
              title="Alterar agressividade"
            >
              ⚡ {agress.label}
            </button>

            {/* Play/Pause */}
            <button
              disabled={pausandoOuIniciando}
              onClick={async () => {
                setPausandoOuIniciando(true)
                try {
                  if (ativa) await onPausar(campanha.id)
                  else await onIniciar(campanha.id)
                } catch (e) { console.error(e) }
                finally { setPausandoOuIniciando(false) }
              }}
              className={clsx(
                'w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50',
                ativa
                  ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                  : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
              )}
              title={ativa ? 'Pausar campanha' : 'Iniciar campanha'}
            >
              {pausandoOuIniciando
                ? <Loader2 size={13} className="animate-spin" />
                : ativa ? <Pause size={14} /> : <Play size={14} />
              }
            </button>

            {/* Menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(v => !v)}
                className="w-8 h-8 rounded-lg flex items-center justify-center
                           text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              >
                <MoreHorizontal size={15} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-9 z-20 bg-white border border-gray-100
                                rounded-xl shadow-popup py-1 w-44 animate-fade-in">
                  {['Editar', 'Duplicar', 'Arquivar', 'Excluir'].map((op) => (
                    <button key={op}
                            onClick={() => {
                              setMenuOpen(false)
                              if (op === 'Editar') {
                                if (onEditar) onEditar(campanha)
                                else navigate('/campanhas?edit=' + campanha.id)
                              } else if (op === 'Duplicar') {
                                campanhasApi.create({ ...campanha, nome: campanha.nome + ' (cópia)', status: 'pausada' })
                                  .then(() => window.location.reload())
                                  .catch(console.error)
                              } else if (op === 'Arquivar') {
                                campanhasApi.update(campanha.id, { status: 'arquivada' })
                                  .then(() => window.location.reload())
                                  .catch(console.error)
                              } else if (op === 'Excluir') {
                                if (confirm('Excluir campanha ' + campanha.nome + '?')) {
                                  campanhasApi.update(campanha.id, { status: 'excluida' })
                                    .then(() => window.location.reload())
                                    .catch(console.error)
                                }
                              }
                            }}
                            className={clsx(
                              'w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors',
                              op === 'Excluir' ? 'text-red-600' : 'text-gray-700'
                            )}>
                      {op}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Barra de consumo */}
        <div className="mb-1">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-400">Consumo da lista</span>
            <span className="text-xs font-semibold text-gray-700">{consumoPct}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={clsx('h-full rounded-full transition-all', barColor)}
              style={{ width: `${consumoPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Métricas 3x2 */}
      <div className="grid grid-cols-3 divide-x divide-y divide-gray-100 border-t border-gray-100">
        {[
          { icon: <Users size={13} />,       label: 'Total',      value: total.toLocaleString('pt-BR'),    color: 'text-gray-900' },
          { icon: <Phone size={13} />,       label: 'Ligadas',    value: feitas.toLocaleString('pt-BR'),   color: 'text-brand-600' },
          { icon: <Clock size={13} />,       label: 'Faltam',     value: faltam.toLocaleString('pt-BR'),   color: 'text-amber-600' },
          { icon: <TrendingUp size={13} />,  label: 'Conversão',  value: `${conversao}%`,                  color: 'text-emerald-600' },
          { icon: <Calendar size={13} />,    label: 'Agendados',  value: agendadas.toLocaleString('pt-BR'),color: 'text-purple-600' },
          { icon: <Zap size={13} />,         label: 'Na fila',    value: naFila.toLocaleString('pt-BR'),   color: 'text-gray-700' },
        ].map((m) => (
          <div key={m.label} className="flex flex-col items-center py-3 gap-0.5">
            <span className={clsx('font-bold font-mono text-base', m.color)}>{m.value}</span>
            <span className="flex items-center gap-1 text-2xs text-gray-400">
              {m.icon}{m.label}
            </span>
          </div>
        ))}
      </div>

      {/* Linha de duplicados — só aparece se houver duplicatas */}
      {duplicados > 0 && (
        <div className="mx-4 mb-0 mt-0 px-3 py-2 rounded-lg border border-orange-100 bg-orange-50 flex items-center justify-between">
          <span className="text-xs text-orange-700 flex items-center gap-1.5">
            <AlertTriangle size={12} className="text-orange-500" />
            Telefones duplicados na lista
          </span>
          <span className="text-xs font-bold font-mono text-orange-700">{duplicados.toLocaleString('pt-BR')}</span>
        </div>
      )}

      {/* Alerta */}
      <div className={clsx(
        'mx-4 my-3 px-3 py-2 rounded-lg border text-xs font-medium',
        alerta.color
      )}>
        {alerta.icon} {alerta.text}
      </div>

      {/* Ações */}
      <div className="px-4 pb-4 grid grid-cols-2 gap-2">
        {/* Fila → discadora, aba fila desta campanha */}
        <button
          onClick={() => navigate('/discadora?campanha=' + campanha.id + '&tab=fila')}
          className="btn-secondary text-xs py-2 gap-1.5 justify-center"
          title="Ver fila de chamadas desta campanha na Discadora"
        >
          <BarChart2 size={13} /> Fila
        </button>

        {/* IA → análise pré-disparo */}
        <button
          onClick={() => setIaAberta(v => !v)}
          className={clsx('btn-secondary text-xs py-2 gap-1.5 justify-center', iaAberta && 'bg-brand-50 border-brand-200 text-brand-700')}
          title="Analisar lista com IA e sugerir melhor horário de disparo"
        >
          <Brain size={13} /> IA
        </button>

        {/* Leads → lista de contatos importados */}
        <button
          className={clsx('btn-secondary text-xs py-2 gap-1.5 justify-center', leadsAberto && 'bg-brand-50 border-brand-200 text-brand-700')}
          onClick={abrirLeads}
          title="Ver contatos importados nesta campanha"
        >
          <List size={13} /> Leads
        </button>

        {/* Reprocessar → reprocessar contatos não alcançados */}
        <button
          className="btn-secondary text-xs py-2 gap-1.5 justify-center"
          onClick={() => onReprocessar && onReprocessar(campanha)}
          title="Reprocessar contatos não alcançados"
        >
          <RefreshCw size={13} /> Reprocessar
        </button>
      </div>

      {/* Painel Análise Pré-Disparo */}
      {iaAberta && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-3">
          <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
            <Sparkles size={12} className="text-brand-500" />
            Análise Pré-Disparo — Inteligência da campanha
          </p>

          {/* Analisar Lista */}
          <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-3 space-y-2">
            <div>
              <p className="text-xs font-semibold text-gray-800 mb-0.5">🧠 Analisar Lista com IA</p>
              <p className="text-2xs text-gray-500 leading-relaxed">
                A IA avalia a qualidade dos seus contatos: verifica aderência ao ICP, identifica o perfil dominante da lista e aponta recomendações antes de você disparar a campanha.
              </p>
            </div>
            <button
              onClick={handleAnalisarLista}
              disabled={analisando}
              className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors disabled:opacity-50"
            >
              {analisando ? <><Loader2 size={12} className="animate-spin"/> Analisando...</> : <><Brain size={12}/> Executar análise</>}
            </button>
          </div>

          {analise && (
            <div className="space-y-2">
              {analise.score_qualidade != null && (
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">Qualidade da lista</span>
                    <span className="font-mono font-bold text-gray-900">{analise.score_qualidade}/100</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={clsx('h-full rounded-full', analise.score_qualidade >= 70 ? 'bg-emerald-500' : analise.score_qualidade >= 50 ? 'bg-amber-400' : 'bg-red-400')}
                      style={{ width: `${analise.score_qualidade}%` }}
                    />
                  </div>
                </div>
              )}
              {analise.icp_aderencia && (
                <div className="flex items-center gap-1.5">
                  <Target size={11} className="text-purple-500" />
                  <span className="text-xs text-gray-600">ICP Aderência:</span>
                  <span className={clsx('text-xs font-bold', analise.icp_aderencia === 'alta' ? 'text-emerald-600' : analise.icp_aderencia === 'media' ? 'text-amber-600' : 'text-red-500')}>
                    {analise.icp_aderencia}
                  </span>
                </div>
              )}
              {analise.perfil_dominante && (
                <p className="text-xs text-gray-600">📊 Perfil: <span className="font-semibold">{analise.perfil_dominante}</span></p>
              )}
              {(analise.recomendacoes ?? []).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-1">Recomendações:</p>
                  <ul className="space-y-1">
                    {(analise.recomendacoes ?? []).map((r, i) => (
                      <li key={i} className="text-xs text-gray-600 flex gap-1.5">
                        <CheckCircle2 size={10} className="text-emerald-500 mt-0.5 shrink-0" />{r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {(analise.alertas ?? []).length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 space-y-1">
                  {(analise.alertas ?? []).map((a, i) => (
                    <p key={i} className="text-xs text-amber-700 flex gap-1.5">
                      <AlertTriangle size={10} className="mt-0.5 shrink-0" />{a}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sugerir Horário */}
          <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-3 space-y-2">
            <div>
              <p className="text-xs font-semibold text-gray-800 mb-0.5">🕐 Sugerir Melhor Horário</p>
              <p className="text-2xs text-gray-500 leading-relaxed">
                Baseado no segmento da campanha ({campanha.segmento ?? 'geral'}), a IA sugere os horários de maior taxa de atendimento — para você não desperdiçar ligações em momentos de baixa receptividade.
              </p>
            </div>
            <button
              onClick={handleSugerirHorario}
              disabled={buscandoHorario}
              className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-50"
            >
              {buscandoHorario ? <><Loader2 size={12} className="animate-spin"/> Buscando...</> : <><Clock size={12}/> Ver melhores horários</>}
            </button>
          </div>

          {horarioSugerido && (
            <div className="space-y-2">
              {((horarioSugerido.horarios ?? horarioSugerido.melhores_horarios) ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {((horarioSugerido.horarios ?? horarioSugerido.melhores_horarios) ?? []).map((h: string, i: number) => (
                    <span key={i} className="bg-blue-50 border border-blue-200 text-blue-700 text-xs px-2 py-0.5 rounded-full font-semibold">{h}</span>
                  ))}
                </div>
              )}
              {horarioSugerido.justificativa && (
                <p className="text-xs text-gray-600 italic">{horarioSugerido.justificativa}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Painel Leads */}
      {leadsAberto && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              <Users size={12} className="text-brand-500" />
              Contatos importados
              {leadsTotal > 0 && (
                <span className="badge badge-brand ml-1">{leadsTotal.toLocaleString('pt-BR')}</span>
              )}
            </p>
            <button onClick={() => setLeadsAberto(false)} className="p-1 rounded hover:bg-gray-100 text-gray-400">
              <X size={13}/>
            </button>
          </div>

          {carregandoLeads ? (
            <div className="flex items-center justify-center py-4 gap-2 text-xs text-gray-400">
              <Loader2 size={13} className="animate-spin"/> Carregando contatos...
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-4 text-xs text-gray-400">
              Nenhum contato importado ainda.<br/>
              <span className="text-brand-500 cursor-pointer hover:underline" onClick={() => navigate('/campanhas')}>
                Use o Upload de lista para importar.
              </span>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-100 max-h-48 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-gray-50">
                  <tr>
                    {['Nome','Empresa','Telefone','Status'].map(h => (
                      <th key={h} className="px-3 py-2 text-left text-gray-500 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {leads.slice(0, 50).map((l, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-800 font-medium">{l.nome ?? '—'}</td>
                      <td className="px-3 py-2 text-gray-500">{l.empresa ?? '—'}</td>
                      <td className="px-3 py-2 text-gray-500 font-mono">{l.telefone ?? '—'}</td>
                      <td className="px-3 py-2">
                        <span className={clsx('badge text-2xs', l.status === 'agendado' ? 'badge-success' : l.status === 'nao_atendeu' ? 'text-amber-700 bg-amber-50' : 'badge-neutral')}>
                          {l.status ?? 'na fila'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {leadsTotal > LEADS_LIMIT && (
                <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100">
                  <span className="text-2xs text-gray-400">
                    Página {leadsPagina} de {Math.ceil(leadsTotal / LEADS_LIMIT)} · {leadsTotal.toLocaleString('pt-BR')} contatos
                  </span>
                  <div className="flex gap-1">
                    <button
                      disabled={leadsPagina <= 1 || carregandoLeads}
                      onClick={() => carregarLeads(leadsPagina - 1)}
                      className="px-2 py-0.5 text-2xs rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                    >← Ant</button>
                    <button
                      disabled={leadsPagina >= Math.ceil(leadsTotal / LEADS_LIMIT) || carregandoLeads}
                      onClick={() => carregarLeads(leadsPagina + 1)}
                      className="px-2 py-0.5 text-2xs rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                    >Próx →</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  )
}
