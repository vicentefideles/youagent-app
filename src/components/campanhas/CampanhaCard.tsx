import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Play, Pause, Users, Phone, Calendar, BarChart2,
  Brain, MoreHorizontal, Zap, Target,
  TrendingUp, Clock, CheckCircle2, AlertTriangle,
  Sparkles, Settings, Loader2, X, List, RefreshCw
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
  online:     { icon: '💻', label: 'Online',     color: 'text-brand-600' },
  presencial: { icon: '🏢', label: 'Presencial', color: 'text-amber-700' },
  hibrido:    { icon: '🔀', label: 'Híbrido',    color: 'text-emerald-700' },
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

export default function CampanhaCard({
  campanha, onPausar, onIniciar,
  onImportar: _onImportar, onVerFila: _onVerFila,
  onEditar, onAgressividade, onReprocessar
}: Props) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen]     = useState(false)
  const [iaAberta, setIaAberta]     = useState(false)
  const [analisando, setAnalisando] = useState(false)
  const [analise, setAnalise]       = useState<AnaliseLista | null>(null)
  const [buscandoHorario, setBuscandoHorario] = useState(false)
  const [horarioSugerido, setHorarioSugerido] = useState<HorarioSugestao | null>(null)
  const [pausandoOuIniciando, setPausandoOuIniciando] = useState(false)
  const [leadsAberto, setLeadsAberto]   = useState(false)
  const [leads, setLeads]               = useState<Record<string, string>[]>([])
  const [leadsTotal, setLeadsTotal]     = useState(0)
  const [leadsPagina, setLeadsPagina]   = useState(1)
  const [carregandoLeads, setCarregandoLeads] = useState(false)
  const [icpConfirm, setIcpConfirm]     = useState(false)
  const [ativandoIcp, setAtivandoIcp]   = useState(false)
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

  async function ativarIcp() {
    setAtivandoIcp(true)
    try {
      await campanhasApi.patch(campanha.id, { icp_ativo: true, icp_threshold: 70 })
      window.location.reload()
    } catch { /* silencioso */ }
    finally { setAtivandoIcp(false) }
  }

  useEffect(() => {
    if (!menuOpen) return
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  async function handleAnalisarLista() {
    setAnalisando(true); setAnalise(null)
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
    } finally { setAnalisando(false) }
  }

  async function handleSugerirHorario() {
    setBuscandoHorario(true); setHorarioSugerido(null)
    try {
      const res = await claudeApi.sugerirHorario({ segmento: campanha.segmento ?? undefined })
      setHorarioSugerido(res.data as HorarioSugestao)
    } catch {
      setHorarioSugerido({ justificativa: 'Erro ao buscar sugestão. Tente novamente.' })
    } finally { setBuscandoHorario(false) }
  }

  const d          = campanha.dashboard
  const total      = d?.total_lista    ?? 0
  const feitas     = d?.ligacoes_feitas ?? 0
  const agendadas  = d?.agendadas      ?? 0
  const duplicados = campanha.lista_duplicados ?? d?.duplicados ?? 0
  const conversao  = feitas > 0 ? ((agendadas / feitas) * 100).toFixed(1) : '0.0'
  const consumoPct = total > 0 ? Math.min(100, Math.round((feitas / total) * 100)) : 0

  const modal  = MODAL_CONFIG[campanha.modalidade as keyof typeof MODAL_CONFIG] ?? MODAL_CONFIG.online
  const agress = AGRESS_CONFIG[campanha.agressividade] ?? AGRESS_CONFIG.media
  const ativa  = campanha.status === 'ativa'

  const barColor = consumoPct >= 90 ? 'bg-red-500'
                 : consumoPct >= 70 ? 'bg-amber-400'
                 : 'bg-brand'

  return (
    <div className={clsx(
      'card flex flex-col gap-0 overflow-hidden transition-shadow hover:shadow-md',
      !ativa && 'opacity-90'
    )}>

      {/* ── HEADER ── */}
      <div className="p-4 pb-3">

        {/* Linha 1: controles */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Status */}
            <span className={clsx(
              'inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full',
              ativa ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
            )}>
              {ativa ? '● Ativa' : '⏸ Pausada'}
            </span>
            {/* Tipo */}
            <span className="text-xs text-gray-400 font-medium">
              {TIPO_LABELS[campanha.tipo] ?? campanha.tipo}
            </span>
            {/* Separador */}
            <span className="text-gray-200">·</span>
            {/* Modalidade + Estado */}
            <span className={clsx('text-xs font-medium', modal.color)}>
              {modal.icon} {modal.label}
            </span>
            {campanha.estado && (
              <span className="text-xs text-gray-400">{campanha.estado}</span>
            )}
          </div>

          {/* Ações rápidas */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => onAgressividade && onAgressividade(campanha)}
              className={clsx('flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-colors', agress.color, agress.bg, 'hover:opacity-80')}
              title="Alterar agressividade"
            >
              <Zap size={10} /> {agress.label}
            </button>
            <button
              disabled={pausandoOuIniciando}
              onClick={async () => {
                setPausandoOuIniciando(true)
                try { if (ativa) await onPausar(campanha.id); else await onIniciar(campanha.id) }
                catch (e) { console.error(e) }
                finally { setPausandoOuIniciando(false) }
              }}
              className={clsx(
                'w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50',
                ativa ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
              )}
              title={ativa ? 'Pausar' : 'Iniciar'}
            >
              {pausandoOuIniciando
                ? <Loader2 size={12} className="animate-spin" />
                : ativa ? <Pause size={13} /> : <Play size={13} />}
            </button>
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(v => !v)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <MoreHorizontal size={14} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-8 z-20 bg-white border border-gray-100 rounded-xl shadow-popup py-1 w-44 animate-fade-in">
                  {[
                    { label: 'Editar campanha', action: () => onEditar && onEditar(campanha) },
                    { label: 'Config IA', action: () => onEditar && onEditar(campanha) },
                    { label: 'Duplicar', action: () => campanhasApi.create({ ...campanha, nome: campanha.nome + ' (cópia)', status: 'pausada' }).then(() => window.location.reload()) },
                    { label: 'Arquivar', action: () => campanhasApi.update(campanha.id, { status: 'arquivada' }).then(() => window.location.reload()) },
                    { label: 'Excluir', action: () => confirm('Excluir ' + campanha.nome + '?') && campanhasApi.update(campanha.id, { status: 'excluida' }).then(() => window.location.reload()) },
                  ].map(item => (
                    <button key={item.label}
                      onClick={() => { setMenuOpen(false); item.action() }}
                      className={clsx('w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors',
                        item.label === 'Excluir' ? 'text-red-600' : 'text-gray-700')}>
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Linha 2: nome */}
        <h3 className="text-sm font-bold text-gray-900 leading-snug mb-2">
          {campanha.nome}
        </h3>

        {/* Linha 3: ICP badge */}
        <div className="flex items-center gap-2">
          {campanha.icp_ativo ? (
            <button
              onClick={() => navigate('/inteligencia?tab=icp')}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100 transition-colors"
            >
              <Target size={10} /> ICP ativo · {campanha.icp_threshold ?? 70}+
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setIcpConfirm(v => !v)}
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 border border-gray-200 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
              >
                <Target size={10} /> ICP desativado
              </button>
              {/* Popup de confirmação inline */}
              {icpConfirm && (
                <div className="absolute left-0 top-8 z-10 bg-white border border-purple-200 rounded-xl shadow-lg p-3 w-56 animate-fade-in">
                  <p className="text-xs font-semibold text-gray-800 mb-1">🎯 Ativar ICP nesta campanha?</p>
                  <p className="text-xs text-gray-500 mb-2.5 leading-relaxed">
                    O agente vai priorizar os leads com maior score de conversão.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={ativarIcp}
                      disabled={ativandoIcp}
                      className="flex-1 text-xs font-bold py-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                      {ativandoIcp ? <Loader2 size={10} className="animate-spin" /> : null}
                      Ativar
                    </button>
                    <button
                      onClick={() => setIcpConfirm(false)}
                      className="flex-1 text-xs font-semibold py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Barra de consumo */}
        <div className="mt-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-400">Consumo da lista</span>
            <span className="text-xs font-semibold text-gray-600">{consumoPct}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className={clsx('h-full rounded-full transition-all', barColor)} style={{ width: `${consumoPct}%` }} />
          </div>
        </div>
      </div>

      {/* ── MÉTRICAS (4 em 2x2) ── */}
      <div className="grid grid-cols-4 divide-x divide-gray-100 border-t border-gray-100">
        {[
          { icon: <Users size={12} />,      label: 'Total',     value: total.toLocaleString('pt-BR'),     color: 'text-gray-800' },
          { icon: <Phone size={12} />,      label: 'Ligadas',   value: feitas.toLocaleString('pt-BR'),    color: 'text-brand-600' },
          { icon: <Calendar size={12} />,   label: 'Agendados', value: agendadas.toLocaleString('pt-BR'), color: 'text-purple-600' },
          { icon: <TrendingUp size={12} />, label: 'Conversão', value: `${conversao}%`,                   color: 'text-emerald-600' },
        ].map(m => (
          <div key={m.label} className="flex flex-col items-center py-3 gap-0.5">
            <span className={clsx('text-sm font-bold font-mono', m.color)}>{m.value}</span>
            <span className="flex items-center gap-0.5 text-xs text-gray-400">{m.icon}{m.label}</span>
          </div>
        ))}
      </div>

      {/* ── ALERTAS ── */}
      <div className="px-4 py-2 flex flex-col gap-1.5">
        {duplicados > 0 && (
          <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-100">
            <span className="text-xs text-orange-700 flex items-center gap-1.5">
              <AlertTriangle size={11} className="text-orange-500" />
              Telefones duplicados na lista
            </span>
            <span className="text-xs font-bold text-orange-700">{duplicados.toLocaleString('pt-BR')}</span>
          </div>
        )}
        <div className={clsx('px-3 py-1.5 rounded-lg border text-xs font-medium',
          !ativa         ? 'bg-gray-50 border-gray-200 text-gray-500'
          : consumoPct >= 80 ? 'bg-amber-50 border-amber-100 text-amber-700'
          : 'bg-emerald-50 border-emerald-100 text-emerald-700'
        )}>
          {!ativa         ? '⏸ Campanha pausada'
          : consumoPct >= 80 ? `⚠️ Apenas ${(total - feitas).toLocaleString('pt-BR')} leads restantes — considere importar mais`
          : `🟢 ${(d?.na_fila ?? 0).toLocaleString('pt-BR')} leads na fila · rodando normalmente`}
        </div>
      </div>

      {/* ── AÇÕES ── */}
      <div className="px-4 pb-4 grid grid-cols-4 gap-1.5">
        <button
          onClick={() => navigate('/discadora?campanha=' + campanha.id + '&tab=fila')}
          className="btn-secondary text-xs py-2 gap-1 justify-center flex-col"
          title="Fila de chamadas"
        >
          <BarChart2 size={13} />
          <span>Fila</span>
        </button>
        <button
          onClick={() => setIaAberta(v => !v)}
          className={clsx('btn-secondary text-xs py-2 gap-1 justify-center flex-col', iaAberta && 'bg-brand-50 border-brand-200 text-brand-700')}
          title="Análise com IA"
        >
          <Brain size={13} />
          <span>IA</span>
        </button>
        <button
          className={clsx('btn-secondary text-xs py-2 gap-1 justify-center flex-col', leadsAberto && 'bg-brand-50 border-brand-200 text-brand-700')}
          onClick={abrirLeads}
          title="Ver leads importados"
        >
          <List size={13} />
          <span>Leads</span>
        </button>
        <button
          className="btn-secondary text-xs py-2 gap-1 justify-center flex-col"
          onClick={() => onReprocessar && onReprocessar(campanha)}
          title="Reprocessar contatos não alcançados"
        >
          <RefreshCw size={13} />
          <span>Reprocessar</span>
        </button>
      </div>

      {/* ── PAINEL IA ── */}
      {iaAberta && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-3">
          <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
            <Sparkles size={12} className="text-brand-500" />
            Análise Pré-Disparo
          </p>
          <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-3 space-y-2">
            <p className="text-xs font-semibold text-gray-800">🧠 Analisar Lista com IA</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              A IA avalia qualidade dos contatos, aderência ao ICP e aponta recomendações antes do disparo.
            </p>
            <button onClick={handleAnalisarLista} disabled={analisando}
              className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors disabled:opacity-50">
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
                    <div className={clsx('h-full rounded-full', analise.score_qualidade >= 70 ? 'bg-emerald-500' : analise.score_qualidade >= 50 ? 'bg-amber-400' : 'bg-red-400')}
                      style={{ width: `${analise.score_qualidade}%` }} />
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
          <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-3 space-y-2">
            <p className="text-xs font-semibold text-gray-800">🕐 Sugerir Melhor Horário</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Baseado no segmento ({campanha.segmento ?? 'geral'}), a IA sugere horários de maior taxa de atendimento.
            </p>
            <button onClick={handleSugerirHorario} disabled={buscandoHorario}
              className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-50">
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

      {/* ── PAINEL LEADS ── */}
      {leadsAberto && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              <Users size={12} className="text-brand-500" />
              Contatos importados
              {leadsTotal > 0 && <span className="badge badge-brand ml-1">{leadsTotal.toLocaleString('pt-BR')}</span>}
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
              Nenhum contato importado ainda.
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
                        <span className={clsx('badge text-xs', l.status === 'agendado' ? 'badge-success' : l.status === 'nao_atendeu' ? 'text-amber-700 bg-amber-50' : 'badge-neutral')}>
                          {l.status ?? 'na fila'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {leadsTotal > LEADS_LIMIT && (
                <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100">
                  <span className="text-xs text-gray-400">
                    Pág {leadsPagina}/{Math.ceil(leadsTotal / LEADS_LIMIT)} · {leadsTotal.toLocaleString('pt-BR')} contatos
                  </span>
                  <div className="flex gap-1">
                    <button disabled={leadsPagina <= 1 || carregandoLeads} onClick={() => carregarLeads(leadsPagina - 1)}
                      className="px-2 py-0.5 text-xs rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40">← Ant</button>
                    <button disabled={leadsPagina >= Math.ceil(leadsTotal / LEADS_LIMIT) || carregandoLeads} onClick={() => carregarLeads(leadsPagina + 1)}
                      className="px-2 py-0.5 text-xs rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40">Próx →</button>
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
