import { useState } from 'react'
import {
  Play, Pause, Users, Phone, Calendar, BarChart2,
  Upload, Brain, MoreHorizontal, Zap, Target,
  TrendingUp, Clock, CheckCircle2, AlertTriangle, Sparkles
} from 'lucide-react'
import clsx from 'clsx'
import type { Campanha } from '@/types/campanha'
import { claudeApi } from '@/services/api'

interface Props {
  campanha: Campanha
  onPausar: (id: string) => void
  onIniciar: (id: string) => void
  onImportar: (campanha: Campanha) => void
  onVerFila: (campanha: Campanha) => void
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

const AGRESS_CONFIG = {
  alta:  { label: 'Alta',  color: 'text-red-600',   bg: 'bg-red-50'   },
  media: { label: 'Média', color: 'text-amber-700',  bg: 'bg-amber-50' },
  baixa: { label: 'Baixa', color: 'text-emerald-700',bg: 'bg-emerald-50'},
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

export default function CampanhaCard({ campanha, onPausar, onIniciar, onImportar, onVerFila }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [iaAberta, setIaAberta] = useState(false)
  const [analisando, setAnalisando] = useState(false)
  const [analise, setAnalise] = useState<AnaliseLista | null>(null)
  const [buscandoHorario, setBuscandoHorario] = useState(false)
  const [horarioSugerido, setHorarioSugerido] = useState<HorarioSugestao | null>(null)

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
  const total    = d?.total_lista    ?? 0
  const feitas   = d?.ligacoes_feitas ?? 0
  const faltam   = Math.max(0, total - feitas)
  const agendadas= d?.agendadas      ?? 0
  const naFila   = d?.na_fila        ?? 0
  const conversao= total > 0 ? ((agendadas / Math.max(feitas, 1)) * 100).toFixed(1) : '0.0'
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
            <div className="flex items-center gap-3 mt-1">
              <span className={clsx('text-xs font-medium', modal.color)}>
                {modal.icon} {modal.label}
              </span>
              {campanha.estado && (
                <span className="text-xs text-gray-400">{campanha.estado}</span>
              )}
              {campanha.icp_ativo && (
                <span className="flex items-center gap-1 text-xs text-purple-600">
                  <Target size={11} /> ICP {campanha.icp_threshold}+
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Play/Pause */}
            <button
              onClick={() => ativa ? onPausar(campanha.id) : onIniciar(campanha.id)}
              className={clsx(
                'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                ativa
                  ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                  : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
              )}
              title={ativa ? 'Pausar' : 'Iniciar'}
            >
              {ativa ? <Pause size={14} /> : <Play size={14} />}
            </button>

            {/* Menu */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
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
                            onClick={() => setMenuOpen(false)}
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

      {/* Alerta */}
      <div className={clsx(
        'mx-4 my-3 px-3 py-2 rounded-lg border text-xs font-medium',
        alerta.color
      )}>
        {alerta.icon} {alerta.text}
      </div>

      {/* Ações */}
      <div className="px-4 pb-4 flex flex-wrap gap-2">
        <button
          onClick={() => onVerFila(campanha)}
          className="btn-secondary flex-1 text-xs py-2 gap-1.5"
        >
          <BarChart2 size={13} /> Fila
        </button>
        <button
          onClick={() => onImportar(campanha)}
          className="btn-secondary flex-1 text-xs py-2 gap-1.5"
        >
          <Upload size={13} /> + Lista
        </button>
        <button
          onClick={() => setIaAberta(v => !v)}
          className={clsx('btn-secondary flex-1 text-xs py-2 gap-1.5', iaAberta && 'bg-purple-50 border-purple-200 text-purple-700')}
        >
          <Brain size={13} /> IA
        </button>
        <button className="btn-secondary flex-1 text-xs py-2 gap-1.5">
          <CheckCircle2 size={13} /> Leads
        </button>
      </div>

      {/* Painel Análise Pré-Disparo */}
      {iaAberta && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-3">
          <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
            <Sparkles size={12} className="text-purple-500" />
            Análise Pré-Disparo
          </p>

          {/* Analisar Lista */}
          <button
            onClick={handleAnalisarLista}
            disabled={analisando}
            className="w-full flex items-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100 transition-colors disabled:opacity-50"
          >
            <Brain size={12} /> {analisando ? 'Analisando...' : '🧠 Analisar Lista com IA'}
          </button>

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
          <button
            onClick={handleSugerirHorario}
            disabled={buscandoHorario}
            className="w-full flex items-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-50"
          >
            <Clock size={12} /> {buscandoHorario ? 'Buscando...' : '🕐 Sugerir Melhor Horário'}
          </button>

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

    </div>
  )
}
