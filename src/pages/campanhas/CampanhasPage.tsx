import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Search, Filter, Activity,
  Upload, Shield, X, AlertTriangle, Zap, Loader2,
} from 'lucide-react'
import clsx from 'clsx'
import { campanhasApi, agentesApi } from '@/services/api'
import CampanhaCard from '@/components/campanhas/CampanhaCard'
import ModalNovaCampanha from '@/components/campanhas/ModalNovaCampanha'
import ModalImportarLista from '@/components/campanhas/ModalImportarLista'
import type { Campanha, NovaCampanhaForm } from '@/types/campanha'

// ─── TIPOS ───────────────────────────────────────────────────────────────────

type FiltroStatus = 'todas' | 'ativa' | 'pausada' | 'arquivada'

// ─── CONSTANTES ──────────────────────────────────────────────────────────────

const NIVEIS_AGRESSIVIDADE = [
  { id: 'baixa',  label: 'Baixa',  calls_min: '1-2', cor: 'bg-green-100 border-green-400 text-green-800',  descricao: 'Ideal para Enterprise — mais pausa entre tentativas' },
  { id: 'media',  label: 'Média',  calls_min: '3-4', cor: 'bg-blue-100 border-blue-400 text-blue-800',    descricao: 'Equilíbrio entre volume e qualidade' },
  { id: 'alta',   label: 'Alta',   calls_min: '5-7', cor: 'bg-amber-100 border-amber-400 text-amber-800', descricao: 'Recomendado para SMB — maior volume' },
  { id: 'maxima', label: 'Máxima', calls_min: '8+',  cor: 'bg-red-100 border-red-400 text-red-800',       descricao: 'Verificar conformidade ANATEL antes de ativar' },
]



// ─── MODAL CONFIG IA ─────────────────────────────────────────────────────────

interface ConfigIAModalState {
  open: boolean
  campanhaId: string | null
  campanhaName: string
}

interface ConfigIAState {
  icpMin: number
  sensibilidade: number
  maxTentativas: number
  gatilhos: Record<string, boolean>
  aguardarConfirmacao: boolean
  gravarLigacoes: boolean
  notificarGerente: boolean
  tom: string
  horarioInicio: string
  horarioFim: string
  pausarFds: boolean
}

function ModalConfigIA({ modal, onClose }: { modal: ConfigIAModalState; onClose: () => void }) {
  const [cfg, setCfg] = useState<ConfigIAState>({
    icpMin: 65, sensibilidade: 70, maxTentativas: 3,
    gatilhos: { urgencia: true, preco: true, proposta: true, decisor: true, interesse: true, demo: false, concorrente: false },
    aguardarConfirmacao: true, gravarLigacoes: true, notificarGerente: true,
    tom: 'Consultivo', horarioInicio: '09:00', horarioFim: '18:00', pausarFds: true,
  })

  const gatilhoLabels: Record<string, string> = {
    urgencia:   '🔴 Urgência — "urgente", "prazo", "preciso logo"',
    preco:      '💰 Preço — "quanto custa", "valor", "investimento"',
    proposta:   '📄 Proposta — "pode mandar", "me envia", "proposta"',
    decisor:    '👤 Decisor — "meu sócio", "diretoria", "preciso consultar"',
    interesse:  '⭐ Interesse — "quero saber mais", "me conta", "interessante"',
    demo:       '🎥 Demo — "ver funcionando", "demonstração", "ver na prática"',
    concorrente:'⚔️ Concorrente — "já tenho", "já uso", "vocês vs"',
  }

  function toggle(field: 'aguardarConfirmacao' | 'gravarLigacoes' | 'notificarGerente' | 'pausarFds') {
    setCfg(prev => ({ ...prev, [field]: !prev[field] }))
  }

  if (!modal.open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[520px] max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Configuração de IA</h2>
            <p className="text-xs text-gray-400 mt-0.5">{modal.campanhaName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"><X size={18}/></button>
        </div>
        <div className="p-6 flex flex-col gap-6">
          {/* Thresholds */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Thresholds</h3>
            <div className="flex flex-col gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm text-gray-700">ICP mínimo para transferir</label>
                  <span className="text-sm font-bold text-brand-600 font-mono w-8 text-right">{cfg.icpMin}</span>
                </div>
                <input type="range" min={0} max={100} value={cfg.icpMin} onChange={e => setCfg(p => ({ ...p, icpMin: Number(e.target.value) }))} className="w-full accent-indigo-600" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm text-gray-700">Sensibilidade de gatilhos</label>
                  <span className="text-sm font-bold text-brand-600 font-mono w-8 text-right">{cfg.sensibilidade}</span>
                </div>
                <input type="range" min={0} max={100} value={cfg.sensibilidade} onChange={e => setCfg(p => ({ ...p, sensibilidade: Number(e.target.value) }))} className="w-full accent-indigo-600" />
              </div>
              <div>
                <label className="text-sm text-gray-700 block mb-1.5">Máximo de tentativas por lead</label>
                <select value={cfg.maxTentativas} onChange={e => setCfg(p => ({ ...p, maxTentativas: Number(e.target.value) }))} className="input">
                  {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>
          </div>
          {/* Gatilhos */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Gatilhos Ativos</h3>
            <div className="flex flex-col gap-2">
              {Object.entries(gatilhoLabels).map(([key, label]) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" checked={cfg.gatilhos[key] ?? false} onChange={() => setCfg(p => ({ ...p, gatilhos: { ...p.gatilhos, [key]: !p.gatilhos[key] } }))} className="w-4 h-4 accent-indigo-600 rounded" />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">{label}</span>
                </label>
              ))}
            </div>
          </div>
          {/* Comportamento */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Comportamento</h3>
            <div className="flex flex-col gap-3">
              {([
                ['aguardarConfirmacao', 'Aguardar confirmação antes de transferir'],
                ['gravarLigacoes',      'Gravar todas as ligações'],
                ['notificarGerente',    'Notificar gerente em cada transferência'],
              ] as const).map(([field, label]) => (
                <div key={field} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{label}</span>
                  <button onClick={() => toggle(field)} className={clsx('w-10 h-5 rounded-full transition-colors relative', cfg[field] ? 'bg-brand-600' : 'bg-gray-300')}>
                    <span className={clsx('absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform', cfg[field] ? 'translate-x-5' : 'translate-x-0.5')} />
                  </button>
                </div>
              ))}
              <div>
                <label className="text-sm text-gray-700 block mb-1.5">Tom do agente</label>
                <select value={cfg.tom} onChange={e => setCfg(p => ({ ...p, tom: e.target.value }))} className="input">
                  <option>Formal</option><option>Consultivo</option><option>Descontraído</option>
                </select>
              </div>
            </div>
          </div>
          {/* Horários */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Horários</h3>
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-700 block mb-1.5">Início</label>
                  <input type="time" value={cfg.horarioInicio} onChange={e => setCfg(p => ({ ...p, horarioInicio: e.target.value }))} className="input" />
                </div>
                <div>
                  <label className="text-sm text-gray-700 block mb-1.5">Fim</label>
                  <input type="time" value={cfg.horarioFim} onChange={e => setCfg(p => ({ ...p, horarioFim: e.target.value }))} className="input" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Pausar aos finais de semana</span>
                <button onClick={() => toggle('pausarFds')} className={clsx('w-10 h-5 rounded-full transition-colors relative', cfg.pausarFds ? 'bg-brand-600' : 'bg-gray-300')}>
                  <span className={clsx('absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform', cfg.pausarFds ? 'translate-x-5' : 'translate-x-0.5')} />
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancelar</button>
          <button
            onClick={async () => {
              try { if (modal.campanhaId) await campanhasApi.update(modal.campanhaId, { configuracoes_ia: cfg }) }
              catch (e) { console.error(e) }
              onClose()
            }}
            className="btn-primary flex-1 justify-center"
          >Salvar configurações</button>
        </div>
      </div>
    </div>
  )
}

// ─── MODAL AGRESSIVIDADE ─────────────────────────────────────────────────────

interface ModalAgressividadeProps {
  campanhaId: string | null
  campanhaName: string
  valorAtual: string
  onClose: () => void
}

function ModalAgressividade({ campanhaId, campanhaName, valorAtual, onClose }: ModalAgressividadeProps) {
  const [selecionado, setSelecionado] = useState(valorAtual.toLowerCase())
  const [salvando, setSalvando] = useState(false)
  const showAnatel = selecionado === 'alta' || selecionado === 'maxima'

  async function salvar() {
    setSalvando(true)
    try { if (campanhaId) await campanhasApi.update(campanhaId, { agressividade: selecionado }) }
    catch (e) { console.error(e) }
    setSalvando(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[460px]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Agressividade da campanha</h2>
            <p className="text-xs text-gray-400 mt-0.5">{campanhaName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18}/></button>
        </div>
        <div className="p-6 flex flex-col gap-3">
          {NIVEIS_AGRESSIVIDADE.map(n => (
            <button
              key={n.id}
              onClick={() => setSelecionado(n.id)}
              className={clsx('flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all', selecionado === n.id ? n.cor + ' ring-2 ring-offset-1 ring-current' : 'border-gray-200 hover:border-gray-300 bg-white')}
            >
              <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border-2 flex-shrink-0', selecionado === n.id ? 'bg-white/70 ' + n.cor : 'bg-gray-100 text-gray-500 border-gray-200')}>{n.calls_min}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-gray-900">{n.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{n.descricao}</div>
              </div>
              <div className={clsx('w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center', selecionado === n.id ? 'border-current bg-current/20' : 'border-gray-300')}>
                {selecionado === n.id && <div className="w-2.5 h-2.5 rounded-full bg-current"/>}
              </div>
            </button>
          ))}
          {showAnatel && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700">
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5"/>
              <span>⚠️ Respeite o limite de tentativas ANATEL: máx. 3x/dia por número</span>
            </div>
          )}
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancelar</button>
          <button onClick={salvar} disabled={salvando} className="btn-primary flex-1 justify-center disabled:opacity-60">
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── PÁGINA PRINCIPAL ─────────────────────────────────────────────────────────

export default function CampanhasPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()

  // ── Filtros e busca ──
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<FiltroStatus>('todas')

  // ── Modais ──
  const [modalNova, setModalNova] = useState(false)
  const [campanhaImportar, setCampanhaImportar] = useState<Campanha | null>(null)
  const [configModal, setConfigModal] = useState<ConfigIAModalState>({ open: false, campanhaId: null, campanhaName: '' })
  const [modalAgressividade, setModalAgressividade] = useState<{ id: string; nome: string; agr: string } | null>(null)

  // ── Upload de lista ──
  const [isDragging, setIsDragging] = useState(false)
  const [campanhaUpload, setCampanhaUpload] = useState<Campanha | null>(null)

  // ── LGPD — estado + salvando ──
  const [lgpdOptOutAuto, setLgpdOptOutAuto] = useState(true)
  const [lgpdExcluirDados, setLgpdExcluirDados] = useState(false)
  const [lgpdBloquearOptOut, setLgpdBloquearOptOut] = useState(true)
  const [lgpdSalvando, setLgpdSalvando] = useState(false)
  const [lgpdSalvo, setLgpdSalvo] = useState(false)

  // ── Orquestração ──
  const [orqCampanha, setOrqCampanha] = useState('')

  // ── Queries ──
  const { data: campanhasRaw = [], isLoading } = useQuery({
    queryKey: ['campanhas'],
    queryFn: () => campanhasApi.list().then((r) => r.data as Campanha[]),
  })

  const { data: agentes = [] } = useQuery({
    queryKey: ['agentes'],
    queryFn: () => agentesApi.list().then((r) => r.data),
  })

  // ── Mutations ──
  const criarMutation = useMutation({
    mutationFn: (form: NovaCampanhaForm) => campanhasApi.create({
      nome:              form.nome.trim(),
      tipo:              form.tipo,
      estado:            form.estado,
      cidade:            form.cidade,
      segmento:          form.segmento,
      modalidade:        form.modalidade,
      agente_id:         form.agente_id || null,
      agressividade:     form.agressividade,
      meta_agendamentos: form.meta_agendamentos ? Number(form.meta_agendamentos) : null,
      hora_inicio:       form.hora_inicio,
      hora_fim:          form.hora_fim,
      limite_diario:     Number(form.limite_diario),
      pausa_almoco:      form.pausa_almoco,
      dias_operacao:     form.dias_operacao,
      icp_ativo:         form.icp_ativo,
      icp_threshold:     70,
      duracao_reuniao:   `${form.duracao_reuniao}min`,
      status:            'ativa',
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campanhas'] }),
  })

  const pausarMutation = useMutation({
    mutationFn: (id: string) => campanhasApi.update(id, { status: 'pausada' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campanhas'] }),
  })

  const iniciarMutation = useMutation({
    mutationFn: (id: string) => campanhasApi.update(id, { status: 'ativa' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campanhas'] }),
  })

  // ── Filtro + busca ──
  const campanhas = campanhasRaw.filter((c) => {
    const matchBusca = !busca || c.nome.toLowerCase().includes(busca.toLowerCase())
    const matchFiltro = filtro === 'todas' || c.status === filtro
    return matchBusca && matchFiltro
  })

  // ── Contadores para badges ──
  const contadores = {
    todas:     campanhasRaw.length,
    ativa:     campanhasRaw.filter((c) => c.status === 'ativa').length,
    pausada:   campanhasRaw.filter((c) => c.status === 'pausada').length,
    arquivada: campanhasRaw.filter((c) => c.status === 'arquivada').length,
  }

  // ── LGPD save ──
  async function salvarLgpd() {
    setLgpdSalvando(true)
    try {
      const ativas = campanhasRaw.filter(c => c.status === 'ativa')
      await Promise.all(
        ativas.map(c =>
          campanhasApi.update(c.id, {
            lgpd_opt_out: lgpdOptOutAuto,
            lgpd_excluir: lgpdExcluirDados,
            lgpd_nao_ligar: lgpdBloquearOptOut,
          })
        )
      )
      setLgpdSalvo(true)
      setTimeout(() => setLgpdSalvo(false), 2500)
    } catch (e) { console.error(e) }
    setLgpdSalvando(false)
  }

  // ── Orquestração — dados calculados das campanhas reais ──
  const orqDados = (() => {
    const fonte = campanhasRaw.length > 0
      ? orqCampanha
        ? campanhasRaw.filter(c => c.id === orqCampanha)
        : campanhasRaw
      : []
    const naoAtendeu = fonte.reduce((acc, c) => acc + (c.dashboard?.nao_atendeu ?? 0), 0)
    const recusou    = fonte.reduce((acc, c) => acc + (c.dashboard?.recusou     ?? 0), 0)
    const agendou    = fonte.reduce((acc, c) => acc + (c.dashboard?.agendadas   ?? 0), 0)
    const gatekeeper = fonte.reduce((acc, c) => acc + (c.dashboard?.gatekeeper  ?? 0), 0)
    // Se todos zerados (campos ainda não existem no backend), usa fallback visual
    const usarFallback = naoAtendeu + recusou + agendou + gatekeeper === 0
    return [
      { label: 'Não Atendeu', count: usarFallback ? '—' : naoAtendeu, acao: 'Rechamar em 4h',        cor: 'border-amber-400 bg-amber-50',    label_cor: 'text-amber-700'   },
      { label: 'Recusou',     count: usarFallback ? '—' : recusou,    acao: 'Enviar e-mail em 2h',   cor: 'border-red-300 bg-red-50',        label_cor: 'text-red-700'     },
      { label: 'Agendou',     count: usarFallback ? '—' : agendou,    acao: 'Invite + reminder 24h', cor: 'border-emerald-400 bg-emerald-50', label_cor: 'text-emerald-700' },
      { label: 'Gatekeeper',  count: usarFallback ? '—' : gatekeeper, acao: 'Script alternativo',    cor: 'border-purple-400 bg-purple-50',  label_cor: 'text-purple-700'  },
    ]
  })()

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    // Abre o modal real de importação — usa a primeira campanha ativa, ou solicita seleção
    const primeira = campanhasRaw.find(c => c.status === 'ativa') ?? campanhasRaw[0] ?? null
    setCampanhaUpload(primeira)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">

      {/* Modais */}
      <ModalConfigIA modal={configModal} onClose={() => setConfigModal({ open: false, campanhaId: null, campanhaName: '' })} />
      {modalAgressividade && (
        <ModalAgressividade
          campanhaId={modalAgressividade.id}
          campanhaName={modalAgressividade.nome}
          valorAtual={modalAgressividade.agr}
          onClose={() => setModalAgressividade(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Campanhas</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gerencie suas campanhas por região, segmento ou objetivo.
          </p>
        </div>
        <button onClick={() => setModalNova(true)} className="btn-primary gap-2">
          <Plus size={16} /> Criar campanha
        </button>
      </div>

      {/* KPIs rápidos */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total',         value: contadores.todas,    color: 'text-gray-900'    },
          { label: 'Ativas',        value: contadores.ativa,    color: 'text-emerald-600' },
          { label: 'Pausadas',      value: contadores.pausada,  color: 'text-amber-600'   },
          { label: 'Leads na fila', value: campanhasRaw.reduce((acc, c) => acc + (c.dashboard?.na_fila ?? 0), 0), color: 'text-brand-600' },
        ].map((k) => (
          <div key={k.label} className="kpi-card">
            <span className={clsx('text-2xl font-bold font-mono', k.color)}>{k.value}</span>
            <span className="text-xs text-gray-500">{k.label}</span>
          </div>
        ))}
      </div>

      {/* Filtros e busca */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
          {(['todas','ativa','pausada','arquivada'] as FiltroStatus[]).map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={clsx(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-all capitalize',
                filtro === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {f === 'todas' ? 'Todas' : f.charAt(0).toUpperCase() + f.slice(1)}
              <span className={clsx('ml-1.5 text-xs px-1.5 py-0.5 rounded-full', filtro === f ? 'bg-brand-100 text-brand-600' : 'bg-gray-200 text-gray-500')}>
                {contadores[f]}
              </span>
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Buscar campanha..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <button className="btn-secondary gap-2"><Filter size={15} /> Filtros</button>
      </div>

      {/* Grid de campanhas */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
          {[1,2,3].map((i) => <div key={i} className="card h-80 animate-pulse bg-gray-50" />)}
        </div>
      ) : campanhas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <Activity size={28} className="text-gray-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">
            {busca ? 'Nenhuma campanha encontrada' : 'Nenhuma campanha ainda'}
          </h3>
          <p className="text-sm text-gray-500 mt-2 max-w-xs">
            {busca
              ? `Nenhuma campanha corresponde a "${busca}"`
              : 'Crie sua primeira campanha para começar a discar.'}
          </p>
          {!busca && (
            <button onClick={() => setModalNova(true)} className="btn-primary mt-5 gap-2">
              <Plus size={16} /> Criar primeira campanha
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
          {campanhas.map((c) => (
            <CampanhaCard
              key={c.id}
              campanha={c}
              onPausar={(id) => pausarMutation.mutate(id)}
              onIniciar={(id) => iniciarMutation.mutate(id)}
              onImportar={setCampanhaImportar}
              onVerFila={(camp) => navigate('/discadora?campanha=' + camp.id)}
              onEditar={(camp) => setConfigModal({ open: true, campanhaId: camp.id, campanhaName: camp.nome })}
            />
          ))}
        </div>
      )}

      {/* ── Upload de lista com enriquecimento ─────────────────────────────── */}
      <div className="card p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Upload size={16} className="text-brand-500" />
            <h3 className="text-sm font-semibold text-gray-900">Upload de lista</h3>
          </div>
          {campanhasRaw.length > 0 && (
            <select
              className="input py-1.5 text-xs w-52"
              value={campanhaUpload?.id ?? ''}
              onChange={e => {
                const c = campanhasRaw.find(x => x.id === e.target.value) ?? null
                setCampanhaUpload(c)
              }}
            >
              <option value="">— selecionar campanha —</option>
              {campanhasRaw.filter(c => c.status !== 'arquivada').map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          )}
        </div>

        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={clsx(
            'border-2 border-dashed rounded-xl p-8 text-center transition-colors',
            campanhaUpload ? 'cursor-pointer' : 'cursor-not-allowed opacity-60',
            isDragging && campanhaUpload ? 'border-brand-400 bg-brand-50' : 'border-gray-300 hover:border-brand-300 hover:bg-gray-50'
          )}
          onClick={() => campanhaUpload && setCampanhaUpload(prev => prev)} // abre via estado
        >
          <Upload size={28} className={clsx('mx-auto mb-3', isDragging ? 'text-brand-500' : 'text-gray-400')} />
          {campanhaUpload ? (
            <>
              <div className="text-sm font-semibold text-gray-700 mb-1">
                Arraste o CSV ou clique em "+ Lista" no card da campanha
              </div>
              <div className="text-xs text-gray-400">
                Campanha selecionada: <span className="font-semibold text-gray-600">{campanhaUpload.nome}</span>
              </div>
              <button
                onClick={e => { e.stopPropagation(); setCampanhaImportar(campanhaUpload) }}
                className="btn-primary mt-4 gap-2 text-sm mx-auto"
              >
                <Upload size={13}/> Selecionar arquivo CSV
              </button>
            </>
          ) : (
            <>
              <div className="text-sm font-semibold text-gray-700 mb-1">Selecione uma campanha acima</div>
              <div className="text-xs text-gray-400">para habilitar o upload de lista de contatos</div>
            </>
          )}
        </div>

        <p className="text-xs text-gray-400 mt-3">
          Colunas esperadas: <code className="bg-gray-100 px-1 rounded">nome</code>{' '}
          <code className="bg-gray-100 px-1 rounded">telefone</code>{' '}
          <code className="bg-gray-100 px-1 rounded">email</code>{' '}
          <code className="bg-gray-100 px-1 rounded">empresa</code>{' '}
          <code className="bg-gray-100 px-1 rounded">cargo</code>
          {' '}— máx. 500 contatos por vez (processamento automático em chunks)
        </p>
      </div>

      {/* ── Conformidade LGPD ──────────────────────────────────────────────── */}
      <div className="card p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-brand-500" />
            <h3 className="text-sm font-semibold text-gray-900">Conformidade LGPD</h3>
            <span className="text-xs text-gray-400">— aplicado a todas as campanhas ativas</span>
          </div>
          <button
            onClick={salvarLgpd}
            disabled={lgpdSalvando}
            className={clsx(
              'flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors',
              lgpdSalvo
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50'
            )}
          >
            {lgpdSalvando
              ? <><Loader2 size={12} className="animate-spin"/> Salvando...</>
              : lgpdSalvo
                ? '✓ Salvo'
                : 'Salvar alterações'}
          </button>
        </div>
        <div className="flex flex-col gap-4">
          {([
            { label: 'Registrar opt-out automaticamente', desc: 'Qualquer solicitação de descadastro durante a ligação é registrada imediatamente', value: lgpdOptOutAuto, set: setLgpdOptOutAuto },
            { label: 'Excluir dados após opt-out',        desc: 'Remove dados pessoais do contato 30 dias após o opt-out ser registrado',           value: lgpdExcluirDados,    set: setLgpdExcluirDados },
            { label: 'Não ligar para opt-outs',           desc: 'Bloqueia automaticamente contatos que solicitaram opt-out de qualquer campanha',    value: lgpdBloquearOptOut,  set: setLgpdBloquearOptOut },
          ] as const).map(t => (
            <div key={t.label} className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-medium text-gray-800">{t.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{t.desc}</div>
              </div>
              <button
                onClick={() => { t.set(!t.value); setLgpdSalvo(false) }}
                className={clsx('w-10 h-5 rounded-full transition-colors relative flex-shrink-0 mt-0.5', t.value ? 'bg-brand-600' : 'bg-gray-300')}
              >
                <span className={clsx('absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform', t.value ? 'translate-x-5' : 'translate-x-0.5')} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Fluxo de orquestração ──────────────────────────────────────────── */}
      <div className="card p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-brand-500" />
              <h3 className="text-sm font-semibold text-gray-900">Fluxo de orquestração</h3>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">Ações automáticas por resultado de ligação</p>
          </div>
          {campanhasRaw.length > 0 && (
            <select
              className="input py-1.5 text-xs w-52"
              value={orqCampanha}
              onChange={e => setOrqCampanha(e.target.value)}
            >
              <option value="">Todas as campanhas</option>
              {campanhasRaw.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {orqDados.map((node) => (
            <div key={node.label} className={clsx('rounded-xl border-2 p-4 flex flex-col gap-2', node.cor)}>
              <div className={clsx('text-xs font-bold', node.label_cor)}>{node.label}</div>
              <div className="text-xl font-bold font-mono text-gray-900">{node.count}</div>
              <div className="text-2xs text-gray-500">leads neste estado</div>
              <div className="text-2xs font-medium text-gray-700 bg-white/70 rounded-lg px-2 py-1.5 border border-white">↳ {node.acao}</div>
              <button className="text-2xs font-semibold text-brand-600 hover:text-brand-700 text-left mt-1">Configurar →</button>
            </div>
          ))}
        </div>
      </div>

      {/* Modais de criação e importação */}
      {modalNova && (
        <ModalNovaCampanha
          agentes={agentes}
          onSalvar={(form) => criarMutation.mutateAsync(form).then(() => undefined)}
          onFechar={() => setModalNova(false)}
        />
      )}
      {campanhaImportar && (
        <ModalImportarLista
          campanha={campanhaImportar}
          onConcluido={(total) => {
            qc.invalidateQueries({ queryKey: ['campanhas'] })
            void total
          }}
          onFechar={() => setCampanhaImportar(null)}
        />
      )}

    </div>
  )
}
