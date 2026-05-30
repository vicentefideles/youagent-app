import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { reunioesApi, ligacoesApi, claudeApi, equipeApi, transcricaoApi, contatosApi, agentesApi } from '@/services/api'
import {
  PhoneCall, Calendar, Mic, Phone, Radio, History, Antenna,
  Activity, Brain, Search, Download, Filter,
  User, Building2, MapPin, MessageSquare, X,
  Play, Pause, CheckCircle2, XCircle, RotateCcw, Megaphone,
  Volume2, Video,
  RefreshCw, Archive, ArrowUpDown, ChevronDown,
  Copy, PhoneForwarded, FileText, Zap
} from 'lucide-react'
import clsx from 'clsx'

// ─── TIPOS ──────────────────────────────────────────────────────────────────

type Tab = 'fila' | 'agendados' | 'gravacoes' | 'manual' | 'agenda' | 'aovivo' | 'historico' | 'ramal' | 'reativacao'

type StatusLigacao = 'em_ligacao' | 'na_fila' | 'retornar' | 'agendado'

interface EntradaFila {
  id: string; empresa: string; contato: string; cargo: string
  telefone: string; agente: string; campanha: string; segmento: string
  status: StatusLigacao; icp: number; potencial: number
  tentativa: number; maxTentativas: number; duracao?: string
  snippet?: string; gatilhoDetectado?: string; transferindo?: boolean
}

interface Agendamento {
  id: string; empresa: string; contato: string; cargo: string
  telefone: string; email: string; modalidade: 'online' | 'presencial' | 'hibrido'
  cidade?: string; cnpj?: string; segmento?: string; resumoLigacao: string
  agente: string; duracaoLigacao: string; dataHora: string; meetLink?: string
  vendedor: string; vendedorIniciais: string; status: string
  noShowRisk: number; campanha: string; resultado?: string
}

// ─── TIPOS ADICIONAIS ────────────────────────────────────────────────────────

type MotorMode = 'simulado' | 'hibrido' | 'real'

interface LatencyState {
  telnyx: number
  eleven: number
  llm: number
  total: number
}


interface Vendedor {
  nome: string
  status: 'disponivel' | 'em_chamada' | 'ausente'
  reunioes_hoje: number
}


// ─── MOCK DATA ───────────────────────────────────────────────────────────────

// Legacy mock removed — TabFila and TabAoVivo use real API data

const AGENDAMENTOS_FALLBACK: Agendamento[] = [
  { id:'a1', empresa:'Grupo Comercial ABC', contato:'Marcos Silva', cargo:'Diretor Comercial', telefone:'(11) 98765-4321', email:'marcos@grupoabc.com.br', modalidade:'online', cidade:'São Paulo', cnpj:'12.345.678/0001-90', segmento:'Comércio / Varejo', resumoLigacao:'Cliente demonstrou interesse em reduzir custo de SDRs. Mencionou que tem equipe de 5 vendedores. Aceitou a reunião para conhecer o modelo de IA.', agente:'Ana', duracaoLigacao:'2m34s', dataHora:'14/05 · 14h00', meetLink:'meet.google.com/abc-123', vendedor:'João Silva', vendedorIniciais:'JS', status:'confirmado', noShowRisk:18, campanha:'SP — Campanha Maio' },
  { id:'a2', empresa:'Indústria Delta', contato:'Roberto Alves', cargo:'Gerente Geral', telefone:'(31) 97654-3210', email:'roberto@deltaindustria.com.br', modalidade:'presencial', cidade:'Belo Horizonte', segmento:'Manufatura', resumoLigacao:'Empresa com 120 funcionários procurando escalar o time comercial sem aumentar headcount. Muito receptivo à proposta.', agente:'Carlos', duracaoLigacao:'3m12s', dataHora:'16/05 · 10h00', vendedor:'Carlos Vidal', vendedorIniciais:'CV', status:'confirmado', noShowRisk:32, campanha:'GO — Campanha Maio' },
  { id:'a3', empresa:'Tech Nova Sistemas', contato:'Carla Mendes', cargo:'Gestora Comercial', telefone:'(11) 96543-2109', email:'carla@technova.com.br', modalidade:'online', cidade:'São Paulo', segmento:'SaaS / Tech', resumoLigacao:'Interesse imediato em substituir o processo manual de prospecção. Solicitou demo completa da plataforma.', agente:'Ana', duracaoLigacao:'1m45s', dataHora:'15/05 · 09h30', meetLink:'meet.google.com/xyz-456', vendedor:'Maria Rodrigues', vendedorIniciais:'MR', status:'pendente', noShowRisk:24, campanha:'SP — Campanha Maio' },
]

// Legacy gravacoes mock removed — TabGravacoes uses real API data

// ─── TRANSCRIÇÃO AO VIVO (polling) ─────────────────────────────────────────

function TranscriptAoVivo({ callControlId, enabled }: { callControlId: string; enabled: boolean }) {
  const { data } = useQuery({
    queryKey: ['transcript', callControlId],
    queryFn: () => transcricaoApi.get(callControlId).then(r => r.data),
    refetchInterval: 2000,
    enabled,
  })
  const linhas: Array<{ ts?: number; texto: string; final?: boolean }> = (data as any)?.transcricao ?? []
  if (linhas.length === 0) return null
  return (
    <div className="mt-2 bg-gray-50 rounded p-2 text-xs space-y-1 border border-gray-100">
      <div className="text-gray-400 text-[10px] font-medium flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
        TRANSCRIÇÃO AO VIVO
      </div>
      {linhas.slice(-3).map((linha, i) => (
        <p key={i} className="text-gray-700 leading-relaxed">{linha.texto}</p>
      ))}
    </div>
  )
}

const TRANSFER_CANDIDATES: Vendedor[] = [
  { nome: 'Ana Rodrigues', status: 'disponivel', reunioes_hoje: 3 },
  { nome: 'João Silva', status: 'disponivel', reunioes_hoje: 2 },
  { nome: 'Carlos Vidal', status: 'em_chamada', reunioes_hoje: 4 },
  { nome: 'Maria Rodrigues', status: 'ausente', reunioes_hoje: 1 },
]


// ─── HELPERS ─────────────────────────────────────────────────────────────────

function IcpBadge({ value }: { value: number }) {
  const cls = value >= 85 ? 'bg-emerald-500 text-white' : value >= 70 ? 'bg-amber-500 text-white' : 'bg-gray-300 text-gray-700'
  return <span className={clsx('text-2xs font-bold px-1.5 py-0.5 rounded-full', cls)}>ICP {value}</span>
}

function StatusBadge({ status }: { status: StatusLigacao }) {
  const map: Record<StatusLigacao, string> = { em_ligacao:'badge badge-success', na_fila:'badge badge-brand', retornar:'badge badge-amber', agendado:'badge badge-purple' }
  const labels: Record<StatusLigacao, string> = { em_ligacao:'Em ligação', na_fila:'Na fila', retornar:'Retornar', agendado:'Agendado' }
  return <span className={map[status]}>{labels[status]}</span>
}

// ─── COMPONENTES AUXILIARES DA FILA ──────────────────────────────────────────

function MotorModePill({ agentId: _agentId }: { agentId: string }) {
  const [mode, setMode] = useState<MotorMode>('simulado')
  const [open, setOpen] = useState(false)
  const modes: { value: MotorMode; label: string; cls: string }[] = [
    { value: 'simulado', label: 'Simulado', cls: 'bg-gray-100 text-gray-600 border-gray-300' },
    { value: 'hibrido',  label: 'Híbrido',  cls: 'bg-amber-50 text-amber-700 border-amber-300' },
    { value: 'real',     label: 'Real',     cls: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
  ]
  const current = modes.find(m => m.value === mode)!
  return (
    <div className="relative" onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpen(o => !o)}
        className={clsx('flex items-center gap-1 text-2xs font-semibold px-2 py-0.5 rounded-full border transition-colors', current.cls)}
      >
        {current.label}
        <ChevronDown size={9} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden w-28">
          {modes.map(m => (
            <button
              key={m.value}
              onClick={() => { setMode(m.value); setOpen(false) }}
              className={clsx('w-full text-left text-2xs font-semibold px-3 py-2 transition-colors hover:bg-gray-50', m.value === mode ? 'bg-gray-50 font-bold' : '')}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function BriefingHandoffCard({ item, onTransfer }: { item: EntradaFila; onTransfer: () => void }) {
  const [copiado, setCopiado] = useState(false)
  const briefingText = `Briefing — ${item.empresa}\nContato: ${item.contato} (${item.cargo})\nICP: ${item.icp}/100\nSinais: ${item.gatilhoDetectado ?? '—'}\nSlot sugerido: 15h00 hoje`

  function copiar() {
    navigator.clipboard.writeText(briefingText).catch(() => undefined)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div className="mx-4 mb-3 rounded-xl border-2 border-brand-400 bg-brand-50 p-3">
      <div className="flex items-center gap-2 mb-2">
        <FileText size={13} className="text-brand-600" />
        <span className="text-xs font-bold text-brand-700">Briefing para o Vendedor</span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-2xs mb-3">
        <div><span className="text-gray-500">Empresa:</span> <span className="font-semibold text-gray-800">{item.empresa}</span></div>
        <div><span className="text-gray-500">Contato:</span> <span className="font-semibold text-gray-800">{item.contato}</span></div>
        <div><span className="text-gray-500">ICP Score:</span> <span className="font-bold text-emerald-700">{item.icp}/100</span></div>
        <div><span className="text-gray-500">Slot sugerido:</span> <span className="font-semibold text-brand-700">15h00 hoje</span></div>
        <div className="col-span-2"><span className="text-gray-500">Sinais:</span> <span className="font-semibold text-purple-700">{item.gatilhoDetectado ?? '—'}</span></div>
      </div>
      <div className="flex gap-2">
        <button onClick={copiar} className={clsx('flex items-center gap-1.5 text-2xs font-semibold px-3 py-1.5 rounded-lg border transition-colors', copiado ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50')}>
          <Copy size={10} /> {copiado ? 'Copiado!' : 'Copiar Briefing'}
        </button>
        <button onClick={onTransfer} className="flex items-center gap-1.5 text-2xs font-semibold px-3 py-1.5 rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors">
          <PhoneForwarded size={10} /> Iniciar Transferência
        </button>
      </div>
    </div>
  )
}

// ─── ABA FILA ────────────────────────────────────────────────────────────────

interface MonitorIA {
  gatilhos: string[]
  icp_score: number
  potencial: number
  sugestao: 'continuar' | 'transferir' | 'agendar'
}

function TabFila() {
  const { data: filaData = [] } = useQuery({
    queryKey: ['ligacoes-ativas'],
    queryFn: () => ligacoesApi.list({ status: 'em_andamento' }).then(r => (r.data as any[]).map(l => ({
      id: String(l.call_control_id ?? l.id ?? Math.random()),
      _callControlId: String(l.call_control_id ?? l.id ?? ''),
      empresa: l.contatos?.empresa ?? l.empresa_nome ?? l.empresa ?? '—',
      contato: l.contatos?.nome ?? l.contato_nome ?? l.contato ?? '—',
      cargo: l.contatos?.cargo ?? l.cargo ?? '',
      telefone: l.numero_destino ?? l.telefone ?? '',
      agente: l.agentes?.nome ?? l.agente_nome ?? l.agente ?? '—',
      campanha: l.campanha_nome ?? l.campanha ?? '',
      segmento: l.contatos?.segmento ?? l.segmento ?? '',
      status: (l.status === 'em_andamento' ? 'em_ligacao' : l.status ?? 'na_fila') as StatusLigacao,
      icp: l.icp ?? 0,
      potencial: l.potencial ?? 0,
      tentativa: l.tentativa ?? 1,
      maxTentativas: l.max_tentativas ?? 3,
      duracao: l.duracao,
      snippet: l.snippet,
      gatilhoDetectado: l.gatilho_detectado,
      transferindo: l.transferindo ?? false,
    } as EntradaFila & { _callControlId: string }))),
    refetchInterval: 5000,
  })
  const [fila, setFila] = useState<EntradaFila[]>([])

  // Sync API data into local state (allows local mutations like pause/resume)
  useEffect(() => {
    if (filaData.length > 0) setFila(filaData)
  }, [filaData])
  const [filtroCampanha, setFiltroCampanha] = useState('')
  const [filtroAgente, setFiltroAgente] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [selecionados, setSelecionados] = useState<string[]>([])
  const [expandido, setExpandido] = useState<string | null>('1')
  const [scriptInput, setScriptInput] = useState<Record<string, string>>({})
  const [scriptFeedback, setScriptFeedback] = useState<Record<string, string>>({})
  const [slotConfirmado, setSlotConfirmado] = useState<Record<string, string>>({})
  const [transcricaoAberta, setTranscricaoAberta] = useState<Record<string, boolean>>({ '1': true })
  const [transferidoPara, setTransferidoPara] = useState<Record<string, string>>({})

  // Monitor IA por ligação
  const [monitorIA, setMonitorIA] = useState<Record<string, MonitorIA>>({})
  const [briefingIA, setBriefingIA] = useState<Record<string, string | null>>({})
  const [gerandoBriefing, setGerandoBriefing] = useState<Record<string, boolean>>({})

  async function gerarBriefingIA(item: EntradaFila) {
    setGerandoBriefing(prev => ({ ...prev, [item.id]: true }))
    try {
      const res = await claudeApi.briefingHandoff({
        contato_nome: item.contato,
        empresa: item.empresa,
        gatilhos_detectados: item.gatilhoDetectado ? [item.gatilhoDetectado] : [],
      })
      const d = res.data as { briefing?: string; content?: string; resultado?: string }
      setBriefingIA(prev => ({ ...prev, [item.id]: d.briefing ?? d.content ?? d.resultado ?? JSON.stringify(d) }))
    } catch {
      setBriefingIA(prev => ({ ...prev, [item.id]: 'Erro ao gerar briefing. Tente novamente.' }))
    } finally {
      setGerandoBriefing(prev => ({ ...prev, [item.id]: false }))
    }
  }

  // Simula progresso de monitorIA para ligações ativas
  useEffect(() => {
    const ativas = fila.filter(l => l.status === 'em_ligacao')
    setMonitorIA(prev => {
      const next = { ...prev }
      ativas.forEach(l => {
        if (!next[l.id]) {
          next[l.id] = {
            gatilhos: l.gatilhoDetectado ? [l.gatilhoDetectado] : [],
            icp_score: l.icp,
            potencial: l.potencial,
            sugestao: l.transferindo ? 'transferir' : l.potencial >= 70 ? 'agendar' : 'continuar',
          }
        }
      })
      return next
    })
  }, [])

  // Vendedores para transferência via API
  const { data: equipeRaw = [] } = useQuery({
    queryKey: ['equipe'],
    queryFn: () => equipeApi.list().then(r => r.data as any[]),
  })
  const transferCandidates: (Vendedor & { telefone?: string })[] = equipeRaw.length > 0
    ? equipeRaw.map(v => ({
        nome: v.nome ?? v.name ?? '—',
        status: (v.status === 'em_chamada' ? 'em_chamada' : v.status === 'ausente' ? 'ausente' : 'disponivel') as Vendedor['status'],
        reunioes_hoje: v.reunioes_hoje ?? v.reunioes_count ?? 0,
        telefone: v.telefone ?? v.phone,
      }))
    : TRANSFER_CANDIDATES

  // Latência em tempo real
  const [latency, setLatency] = useState<LatencyState>({ telnyx: 112, eleven: 87, llm: 203, total: 402 })
  useEffect(() => {
    const id = setInterval(() => {
      setLatency(prev => {
        const vary = (v: number) => Math.max(30, Math.min(500, v + (Math.random() * 40 - 20)))
        const t = vary(prev.telnyx)
        const e = vary(prev.eleven)
        const l = vary(prev.llm)
        return { telnyx: Math.round(t), eleven: Math.round(e), llm: Math.round(l), total: Math.round(t + e + l) }
      })
    }, 3000)
    return () => clearInterval(id)
  }, [])

  function latDot(ms: number) {
    return ms < 150 ? 'bg-emerald-500' : ms < 300 ? 'bg-amber-400' : 'bg-red-500'
  }
  function latColor(ms: number) {
    return ms < 150 ? 'text-emerald-400' : ms < 300 ? 'text-amber-400' : 'text-red-400'
  }

  const filaFiltrada = fila.filter(f => {
    if (filtroCampanha && !f.campanha.includes(filtroCampanha)) return false
    if (filtroAgente && f.agente !== filtroAgente) return false
    if (filtroStatus && f.status !== filtroStatus) return false
    return true
  })
  const ativas = fila.filter(l => l.status === 'em_ligacao').length

  function toggleSel(id: string) {
    setSelecionados(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }
  function toggleAll(checked: boolean) {
    setSelecionados(checked ? filaFiltrada.map(f => f.id) : [])
  }
  async function injetarScript(id: string) {
    const texto = scriptInput[id]
    if (!texto) return
    try {
      await ligacoesApi.falar(id, { texto })
      setScriptFeedback(prev => ({ ...prev, [id]: '✓ Injetado' }))
    } catch {
      setScriptFeedback(prev => ({ ...prev, [id]: 'Erro ao injetar' }))
    }
    setTimeout(() => setScriptFeedback(prev => ({ ...prev, [id]: '' })), 2500)
    setScriptInput(prev => ({ ...prev, [id]: '' }))
  }
  function confirmarSlot(id: string, slot: string) {
    setSlotConfirmado(prev => ({ ...prev, [id]: slot }))
  }
  function toggleTranscricao(id: string) {
    setTranscricaoAberta(prev => ({ ...prev, [id]: !prev[id] }))
  }
  async function iniciarTransferencia(agentId: string, vendedor: string, telefone?: string) {
    const item = fila.find(f => f.id === agentId) as (EntradaFila & { _callControlId?: string }) | undefined
    const callControlId = item?._callControlId ?? agentId
    if (callControlId && telefone) {
      try {
        await ligacoesApi.transferir(callControlId, {
          numero_destino: telefone,
          vendedor_nome: vendedor,
        })
      } catch (err) {
        console.error('Erro ao transferir:', err)
      }
    }
    setTransferidoPara(prev => ({ ...prev, [agentId]: vendedor }))
  }

  const SLOTS = ['14:00', '15:00', '15:30', '16:00']

  return (
    <div className="flex flex-col gap-4">
      {/* KPIs */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label:'Em ligação agora', value: ativas, color:'text-emerald-600' },
          { label:'Na fila', value: filaData.length, color:'text-gray-900' },
          { label:'Retornar contato', value: filaData.filter(f => f.status === 'retornar').length, color:'text-amber-600' },
          { label:'Agendadas hoje', value: filaData.filter(f => f.status === 'agendado').length, color:'text-brand-600' },
          { label:'Latência total', value:`${latency.total}ms`, color: latColor(latency.total), sub: latency.total < 500 ? 'Dentro do limite ✓' : 'Acima do limite ⚠' },
        ].map(k => (
          <div key={k.label} className="kpi-card">
            <span className={clsx('text-2xl font-bold font-mono', k.color)}>{k.value}</span>
            <span className="text-xs text-gray-500">{k.label}</span>
            {k.sub && <span className={clsx('text-2xs font-medium', latency.total < 500 ? 'text-emerald-600' : 'text-red-500')}>{k.sub}</span>}
          </div>
        ))}
      </div>

      {/* Barra de latência */}
      <div className="card p-3">
        <div className="flex items-center gap-6 flex-wrap">
          <span className="text-xs font-semibold text-gray-500">Latência em tempo real</span>
          {([
            { label: 'Telnyx', ms: latency.telnyx },
            { label: 'ElevenLabs', ms: latency.eleven },
            { label: 'LLM', ms: latency.llm },
            { label: 'Total', ms: latency.total },
          ] as const).map(s => (
            <div key={s.label} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200">
              <span className={clsx('w-1.5 h-1.5 rounded-full animate-pulse', latDot(s.ms))} />
              <span className="text-2xs text-gray-500 font-medium">{s.label}</span>
              <span className={clsx('text-2xs font-bold font-mono', latColor(s.ms))}>{s.ms}ms</span>
            </div>
          ))}
          <span className="text-xs text-gray-400 ml-auto">Meta: &lt;500ms · <span className={clsx('font-semibold', latency.total < 500 ? 'text-emerald-600' : 'text-red-500')}>{latency.total < 500 ? '✓ OK' : '⚠ Lento'}</span></span>
        </div>
      </div>

      {/* Card da tabela */}
      <div className="card overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-gray-900">Fila de chamadas</h3>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold font-mono text-emerald-600">{ativas}</span>
              <span className="text-xs text-emerald-600 font-medium">ligações ativas</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select className="input py-1.5 text-xs" value={filtroCampanha} onChange={e => setFiltroCampanha(e.target.value)}>
              <option value="">Todas as campanhas</option>
              <option value="SP">SP</option><option value="MG">MG</option><option value="GO">GO</option><option value="RJ">RJ</option><option value="RS">RS</option><option value="PR">PR</option>
            </select>
            <select className="input py-1.5 text-xs" value={filtroAgente} onChange={e => setFiltroAgente(e.target.value)}>
              <option value="">Todos os agentes</option>
              <option>Ana</option><option>Carlos</option><option>Julia</option><option>Rafael</option><option>Marcos</option>
            </select>
            <select className="input py-1.5 text-xs" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
              <option value="">Todos os status</option><option value="em_ligacao">Em ligação</option><option value="na_fila">Na fila</option><option value="retornar">Retornar</option><option value="agendado">Agendado</option>
            </select>
            <button className="btn-primary text-xs py-1.5 gap-1.5"><Megaphone size={12}/> + Nova campanha</button>
          </div>
        </div>

        {/* Barra de ações em lote */}
        {selecionados.length > 0 && (
          <div className="flex items-center gap-3 px-4 py-2.5 bg-brand-50 border-b border-brand-200">
            <span className="text-xs font-bold text-brand-600">{selecionados.length} selecionado(s)</span>
            <div className="w-px h-4 bg-brand-300" />
            <button
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border bg-white transition-colors hover:opacity-80 border-brand-300 text-brand-700"
              onClick={() => {
                setFila(prev => prev.map(f => selecionados.includes(f.id) ? { ...f, status: 'na_fila' as StatusLigacao } : f))
                setSelecionados([])
              }}
            >⏸ Pausar todos</button>
            <button
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border bg-white transition-colors hover:opacity-80 border-emerald-300 text-emerald-700"
              onClick={() => {
                setFila(prev => prev.map(f => selecionados.includes(f.id) ? { ...f, status: 'em_ligacao' as StatusLigacao } : f))
                setSelecionados([])
              }}
            >▶ Retomar todos</button>
            <button
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border bg-white transition-colors hover:opacity-80 border-amber-300 text-amber-700"
              onClick={() => {
                setFila(prev => {
                  const sel = prev.filter(f => selecionados.includes(f.id))
                  const rest = prev.filter(f => !selecionados.includes(f.id))
                  return [...sel, ...rest]
                })
                setSelecionados([])
              }}
            >⬆ Priorizar</button>
            <button className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 bg-white">📋 Mover campanha</button>
            <button onClick={() => setSelecionados([])} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 text-red-600 bg-white hover:bg-red-50 transition-colors">Cancelar</button>
            <button onClick={() => setSelecionados([])} className="ml-auto text-xs text-gray-400 hover:text-gray-600"><X size={14}/></button>
          </div>
        )}

        {/* Colunas */}
        <div className="grid grid-cols-[28px_2fr_1fr_1fr_1.4fr_90px] px-4 py-2 bg-gray-50 border-b border-gray-100">
          <input type="checkbox" className="w-3.5 h-3.5 accent-indigo-500" onChange={e => toggleAll(e.target.checked)} checked={selecionados.length === filaFiltrada.length && filaFiltrada.length > 0} />
          {['Empresa / Contato','Agente · Campanha','Status','Inteligência em tempo real','Ações'].map(h => (
            <span key={h} className="text-2xs font-semibold text-gray-400 uppercase tracking-wide">{h}</span>
          ))}
        </div>

        {/* Linhas */}
        {filaFiltrada.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <PhoneCall size={32} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">Nenhuma ligação na fila</p>
            <p className="text-xs mt-1">As chamadas aparecerão aqui quando os agentes estiverem ativos.</p>
          </div>
        )}
        {filaFiltrada.map(item => (
          <div key={item.id}>
            <div
              className={clsx(
                'grid grid-cols-[28px_2fr_1fr_1fr_1.4fr_90px] px-4 py-3 border-b border-gray-100 cursor-pointer items-start transition-colors',
                item.status === 'em_ligacao' && 'bg-gradient-to-r from-indigo-50/50 to-purple-50/30',
                item.status === 'retornar' && 'bg-amber-50/40',
                item.status === 'agendado' && 'bg-emerald-50/30',
              )}
              onClick={() => setExpandido(expandido === item.id ? null : item.id)}
            >
              <div onClick={e => e.stopPropagation()}>
                <input type="checkbox" className="w-3.5 h-3.5 mt-1 accent-indigo-500" checked={selecionados.includes(item.id)} onChange={() => toggleSel(item.id)} />
              </div>

              {/* Empresa */}
              <div className="pr-3">
                <div className="text-sm font-semibold text-gray-900">{item.empresa}</div>
                <div className="text-xs text-gray-500">{item.contato} · {item.cargo}</div>
                <div className="text-xs text-gray-400 font-mono">{item.telefone}</div>
                <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                  <IcpBadge value={item.icp} />
                  {item.potencial > 0 && <span className="text-2xs font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700">📞 {item.potencial}%</span>}
                </div>
                {item.snippet && <div className="mt-1.5 text-2xs text-gray-400 italic bg-white border border-gray-200 rounded px-2 py-1 max-w-[200px]">{item.snippet}</div>}
                <TranscriptAoVivo callControlId={(item as any)._callControlId ?? item.id} enabled={item.status === 'em_ligacao'} />
              </div>

              {/* Agente */}
              <div className="pr-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-brand-50 text-brand-600 text-2xs font-bold flex items-center justify-center flex-shrink-0">{item.agente[0]}</div>
                  <div>
                    <div className="text-xs font-medium text-gray-900">{item.agente}</div>
                    {item.status === 'em_ligacao' && (
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-2xs text-emerald-600">Falando · {item.duracao}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-xs font-medium text-gray-700 mb-1">{item.campanha}</div>
                <div className="text-2xs text-gray-400 mb-1.5">{item.segmento}</div>
                {/* Motor mode pill */}
                <div onClick={e => e.stopPropagation()}>
                  <MotorModePill agentId={item.id} />
                </div>
              </div>

              {/* Status */}
              <div>
                <StatusBadge status={item.status} />
                <div className="text-2xs text-gray-400 mt-1">Tent. {item.tentativa}/{item.maxTentativas}</div>
              </div>

              {/* IA */}
              <div className="pr-3">
                {item.status === 'agendado' ? (
                  <div className="text-2xs bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-emerald-700">
                    ✓ Reunião confirmada · 14/05 · 15h00 · João Silva · Invite enviado ✓
                  </div>
                ) : item.transferindo ? (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-2 mb-1.5">
                    <div className="text-2xs font-bold text-purple-600 flex items-center gap-1 mb-1"><span className="animate-pulse">🟣</span> Transferência iniciada</div>
                    <div className="text-2xs text-gray-600">→ {transferidoPara[item.id] ?? 'João Silva'} sendo chamado</div>
                    <div className="mt-1 h-1 bg-purple-100 rounded-full overflow-hidden"><div className="h-full w-[65%] bg-purple-500 rounded-full animate-pulse" /></div>
                  </div>
                ) : item.gatilhoDetectado ? (
                  <div className="bg-white border border-gray-200 rounded-lg p-2">
                    <div className="text-2xs font-semibold text-purple-600 mb-0.5">💡 Gatilho detectado</div>
                    <div className="text-2xs text-gray-600">{item.gatilhoDetectado}</div>
                  </div>
                ) : (
                  <span className="text-2xs text-gray-400">🎯 Monitorando...</span>
                )}
              </div>

              {/* Ações */}
              <div className="flex flex-col gap-1" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => setExpandido(expandido === item.id ? null : item.id)}
                  className={clsx('flex items-center gap-1 text-2xs font-medium px-2 py-1.5 rounded-md border transition-all',
                    expandido === item.id ? 'bg-brand-50 border-brand-200 text-brand-600' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-brand-300 hover:text-brand-600'
                  )}
                >
                  <Activity size={9} />
                  {expandido === item.id ? '▲ Monitor' : '▼ Monitor'}
                </button>
              </div>
            </div>

            {/* Briefing Handoff — aparece quando transferindo */}
            {item.transferindo && expandido !== item.id && (
              <BriefingHandoffCard item={item} onTransfer={() => iniciarTransferencia(item.id, 'Ana Rodrigues')} />
            )}

            {/* PAINEL MONITOR */}
            {expandido === item.id && (
              <div className="bg-gray-900 border-b border-gray-800">
                {/* Header do monitor */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm font-bold text-white">{item.empresa}</span>
                    <span className="text-2xs text-gray-400">{item.agente} · {item.campanha}</span>
                    <IcpBadge value={item.icp} />
                  </div>
                  <div className="flex items-center gap-2">
                    {item.transferindo && <span className="text-2xs bg-purple-900/50 text-purple-300 border border-purple-700 rounded-full px-2 py-0.5 font-semibold animate-pulse">🟣 IA: Sinal — transferindo</span>}
                    <span className="text-2xs text-gray-400 font-mono">{item.duracao}</span>
                  </div>
                </div>

                {/* Briefing handoff no monitor (quando transferindo) */}
                {item.transferindo && (
                  <div className="mx-4 mt-4 rounded-xl border border-brand-500/50 bg-brand-900/20 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText size={13} className="text-brand-400" />
                      <span className="text-xs font-bold text-brand-300">Briefing para o Vendedor</span>
                    </div>
                    <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-2xs mb-3">
                      <div><span className="text-gray-500">Empresa:</span> <span className="font-semibold text-white">{item.empresa}</span></div>
                      <div><span className="text-gray-500">Contato:</span> <span className="font-semibold text-white">{item.contato}</span></div>
                      <div><span className="text-gray-500">ICP:</span> <span className="font-bold text-emerald-400">{item.icp}/100</span></div>
                      <div className="col-span-2"><span className="text-gray-500">Sinais:</span> <span className="font-semibold text-purple-300">{item.gatilhoDetectado}</span></div>
                      <div><span className="text-gray-500">Slot:</span> <span className="font-semibold text-brand-300">15h00 hoje</span></div>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex items-center gap-1.5 text-2xs font-semibold px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors">
                        <Copy size={10}/> Copiar Briefing
                      </button>
                      <button onClick={() => iniciarTransferencia(item.id, 'Ana Rodrigues')} className="flex items-center gap-1.5 text-2xs font-semibold px-3 py-1.5 rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors">
                        <PhoneForwarded size={10}/> Iniciar Transferência
                      </button>
                    </div>
                  </div>
                )}

                <div className="p-4 grid grid-cols-3 gap-4">
                  {/* Col 1: Transcrição */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xs font-semibold text-emerald-400 uppercase tracking-wide">🎤 Transcrição ao vivo</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => toggleTranscricao(item.id)}
                          className="text-2xs bg-gray-800 border border-gray-700 text-gray-400 rounded-full px-2 py-0.5 font-semibold hover:bg-gray-700 transition-colors"
                        >
                          {transcricaoAberta[item.id] ? '▲ Ocultar' : '▼ Ver Transcrição'}
                        </button>
                        <button className="text-2xs bg-emerald-900/30 border border-emerald-700 text-emerald-400 rounded-full px-2 py-0.5 font-semibold hover:bg-emerald-800/30 transition-colors">🎧 Ouvir</button>
                      </div>
                    </div>
                    {/* Monitor IA */}
                    {monitorIA[item.id] && (
                      <div className="mb-3 space-y-2">
                        {/* Potencial de fechamento */}
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-2xs text-gray-400 uppercase tracking-wide">Potencial de fechamento</span>
                            <span className="text-xs text-purple-400 font-bold font-mono">{monitorIA[item.id].potencial}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${monitorIA[item.id].potencial}%`,
                                background: `linear-gradient(90deg, #6d28d9, #10b981)`,
                              }}
                            />
                          </div>
                        </div>
                        {/* ICP Badge */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-2xs bg-purple-900/40 border border-purple-700 text-purple-300 rounded-full px-2 py-0.5 font-bold">
                            🎯 ICP: {monitorIA[item.id].icp_score}
                          </span>
                          {/* Gatilhos */}
                          {monitorIA[item.id].gatilhos.map((g, gi) => {
                            const isUrgencia = /urgên|urgenc/i.test(g)
                            const isPreco = /preço|preco|valor|cust/i.test(g)
                            const isDecisor = /decisor|sócio|diretori/i.test(g)
                            const cls = isUrgencia ? 'bg-red-900/40 border-red-700 text-red-300' :
                              isPreco ? 'bg-amber-900/40 border-amber-700 text-amber-300' :
                              isDecisor ? 'bg-blue-900/40 border-blue-700 text-blue-300' :
                              'bg-gray-800 border-gray-600 text-gray-300'
                            return (
                              <span key={gi} className={`text-2xs border rounded-full px-2 py-0.5 font-semibold ${cls}`}>
                                {isUrgencia ? '🚨' : isPreco ? '💰' : isDecisor ? '👔' : '💡'} {g}
                              </span>
                            )
                          })}
                        </div>
                        {/* Sugestão */}
                        {monitorIA[item.id].sugestao === 'transferir' && (
                          <button className="flex items-center gap-1.5 text-2xs font-bold px-3 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors">
                            <Zap size={10} /> ⚡ Transferir Agora
                          </button>
                        )}
                      </div>
                    )}
                    {item.potencial > 0 && !monitorIA[item.id] && (
                      <div className="mb-3">
                        <div className="flex justify-between mb-1">
                          <span className="text-2xs text-gray-400 uppercase tracking-wide">Potencial de fechamento</span>
                          <span className="text-xs text-purple-400 font-bold font-mono">{item.potencial}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-purple-700 to-purple-400 rounded-full" style={{ width:`${item.potencial}%` }} />
                        </div>
                      </div>
                    )}
                    {/* Botão Gerar Briefing com Claude */}
                    <div className="mb-2">
                      <button
                        onClick={() => gerarBriefingIA(item)}
                        disabled={gerandoBriefing[item.id]}
                        className="flex items-center gap-1.5 text-2xs font-semibold px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors disabled:opacity-50"
                      >
                        <FileText size={10} />
                        {gerandoBriefing[item.id] ? 'Gerando...' : '📋 Gerar Briefing IA'}
                      </button>
                      {briefingIA[item.id] && (
                        <div className="mt-2 bg-brand-900/20 border border-brand-700/50 rounded-lg p-2">
                          <p className="text-2xs text-brand-300 font-semibold mb-1">Briefing gerado por IA:</p>
                          <p className="text-2xs text-gray-300 leading-relaxed">{briefingIA[item.id]}</p>
                        </div>
                      )}
                    </div>
                    {transcricaoAberta[item.id] && (
                      <div className="max-h-36 overflow-y-auto">
                        <TranscriptAoVivo callControlId={(item as any)._callControlId ?? item.id} enabled={transcricaoAberta[item.id]} />
                      </div>
                    )}
                    {!transcricaoAberta[item.id] && (
                      <div className="text-2xs text-gray-500 italic">Clique em "Ver Transcrição" para expandir...</div>
                    )}
                  </div>

                  {/* Col 2: Script + Slots */}
                  <div className="flex flex-col gap-3">
                    {/* Injetar frase */}
                    <div>
                      <div className="text-2xs font-semibold text-gray-400 uppercase tracking-wide mb-2">💬 Injetar frase no agente</div>
                      <div className="flex gap-1.5">
                        <input
                          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-2xs text-white placeholder-gray-500 outline-none focus:border-brand-500"
                          placeholder="Digite a frase para o agente falar..."
                          value={scriptInput[item.id] ?? ''}
                          onChange={e => setScriptInput(prev => ({ ...prev, [item.id]: e.target.value }))}
                          onKeyDown={e => e.key === 'Enter' && injetarScript(item.id)}
                        />
                        <button onClick={() => injetarScript(item.id)} className="text-2xs bg-brand-600 hover:bg-brand-700 text-white rounded-lg px-2 py-1.5 font-semibold transition-colors">Enviar</button>
                      </div>
                      {scriptFeedback[item.id] && <div className="text-2xs text-emerald-400 mt-1">{scriptFeedback[item.id]}</div>}
                    </div>

                    {/* Slots inline */}
                    <div>
                      <div className="text-2xs font-semibold text-gray-400 uppercase tracking-wide mb-2">📅 Reservar slot agora</div>
                      {slotConfirmado[item.id] ? (
                        <div className="bg-emerald-900/30 border border-emerald-700 rounded-lg p-2 text-2xs text-emerald-400 font-semibold">✓ Slot {slotConfirmado[item.id]} reservado!</div>
                      ) : (
                        <div className="grid grid-cols-2 gap-1.5">
                          {SLOTS.map(slot => (
                            <button
                              key={slot}
                              onClick={() => confirmarSlot(item.id, slot)}
                              className="text-2xs font-semibold py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:border-brand-500 hover:text-brand-400 transition-colors font-mono"
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Col 3: Transferência — candidatos */}
                  <div>
                    <div className="text-2xs font-semibold text-gray-400 uppercase tracking-wide mb-2">⚡ Vendedores disponíveis</div>
                    <div className="flex flex-col gap-2">
                      {transferCandidates.map(v => (
                        <div
                          key={v.nome}
                          className={clsx(
                            'flex items-center justify-between p-2 rounded-lg border',
                            v.status === 'disponivel' ? 'bg-gray-800 border-gray-700' :
                            v.status === 'em_chamada' ? 'bg-gray-900/50 border-gray-800 opacity-60' :
                            'bg-gray-900/50 border-gray-800 opacity-40'
                          )}
                        >
                          <div>
                            <div className="text-2xs font-semibold text-white">{v.nome}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={clsx('w-1.5 h-1.5 rounded-full', v.status === 'disponivel' ? 'bg-emerald-500' : v.status === 'em_chamada' ? 'bg-amber-400 animate-pulse' : 'bg-gray-500')} />
                              <span className="text-2xs text-gray-400">
                                {v.status === 'disponivel' ? 'Disponível' : v.status === 'em_chamada' ? 'Em chamada' : 'Ausente'}
                                {' · '}{v.reunioes_hoje} reunião(ões) hoje
                              </span>
                            </div>
                          </div>
                          {v.status === 'disponivel' ? (
                            <button
                              onClick={() => iniciarTransferencia(item.id, v.nome, v.telefone)}
                              className="text-2xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-2 py-1 transition-colors"
                            >
                              Transferir
                            </button>
                          ) : (
                            <span className="text-2xs text-gray-500">{v.status === 'em_chamada' ? 'Em chamada' : 'Ausente'}</span>
                          )}
                        </div>
                      ))}
                      {transferidoPara[item.id] && (
                        <div className="bg-emerald-900/20 border border-emerald-700 rounded-lg p-2 text-2xs text-emerald-400 font-semibold">
                          ✓ Transferindo para {transferidoPara[item.id]}...
                        </div>
                      )}
                      <button className="w-full text-xs font-semibold py-2 rounded-lg bg-amber-900/30 border border-amber-700 text-amber-300 hover:bg-amber-800/30 transition-colors">⏸ Pausar agente</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── ABA AGENDADOS ───────────────────────────────────────────────────────────

function TabAgendados() {
  const { data: agendamentosReais = [] } = useQuery({
    queryKey: ['reunioes'],
    queryFn: () => reunioesApi.list().then((r: any) => r.data),
  })

  const [resultados, setResultados] = useState<Record<string, string>>({})
  const [modalJornada, setModalJornada] = useState<Agendamento | null>(null)
  const [etapaSelecionada, setEtapaSelecionada] = useState('Agendado')
  const [valorOpor, setValorOpor] = useState('')
  const [nota, setNota] = useState('')

  const agendamentos: Agendamento[] = agendamentosReais.length > 0
    ? agendamentosReais.map((r: any): Agendamento => ({
        id: String(r.id ?? r._id ?? Math.random()),
        empresa: r.empresa ?? r.empresa_nome ?? 'Reunião',
        contato: r.contato ?? r.contato_nome ?? r.vendedor_nome ?? '—',
        cargo: r.cargo ?? '',
        telefone: r.telefone ?? '',
        email: r.email ?? '',
        modalidade: (r.modalidade ?? 'online') as Agendamento['modalidade'],
        cidade: r.cidade,
        cnpj: r.cnpj,
        segmento: r.segmento,
        resumoLigacao: r.resumo_ligacao ?? r.resumo ?? '',
        agente: r.agente_nome ?? r.agente_id ?? r.agente ?? '—',
        duracaoLigacao: r.duracao_ligacao ?? r.duracao ?? '',
        dataHora: r.data_hora ?? (r.inicio ? new Date(r.inicio).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }) : ''),
        meetLink: r.meet_link ?? r.meetLink,
        vendedor: r.vendedor_nome ?? r.vendedor ?? '—',
        vendedorIniciais: ((r.vendedor_nome ?? r.vendedor ?? 'VD') as string).split(' ').map((n: string) => n[0]).join('').slice(0,2),
        status: r.status ?? 'pendente',
        noShowRisk: r.no_show_risk ?? r.noShowRisk ?? 0,
        campanha: r.campanha_nome ?? r.campanha ?? '',
        resultado: r.resultado,
      }))
    : AGENDAMENTOS_FALLBACK

  const fechamentos = agendamentos.filter((r: Agendamento) => r.status === 'realizada' && r.resultado === 'fechou').length
  const noShows = agendamentos.filter((r: Agendamento) => r.status === 'realizada' && r.resultado === 'noshow').length
  const perdidos = agendamentos.filter((r: Agendamento) => r.status === 'realizada' && r.resultado === 'perdemos').length
  const emAndamento = agendamentos.filter((r: Agendamento) => r.status === 'agendada').length
  const taxaConversao = agendamentos.length > 0 ? Math.round((fechamentos / agendamentos.length) * 100) : 0

  return (
    <div className="flex flex-col gap-4">
      {/* Filtros */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-gray-500">Reuniões agendadas pela IA. Cada card traz os dados completos do cliente para o vendedor chegar preparado.</p>
        <div className="flex items-center gap-2">
          <select className="input py-1.5 text-xs"><option>Todas as campanhas</option></select>
          <select className="input py-1.5 text-xs"><option>Todos os vendedores</option></select>
          <button
            className="btn-secondary gap-2 text-xs py-1.5"
            onClick={() => {
              const header = 'Empresa,Contato,Cargo,Data/Hora,Vendedor,Status,Campanha'
              const rows = agendamentos.map((a: any) => `${a.empresa},${a.contato},${a.cargo ?? ''},${a.dataHora},${a.vendedor},${a.status},${a.campanha}`)
              const csv = [header, ...rows].join('\n')
              const blob = new Blob([csv], { type: 'text/csv' })
              const url = URL.createObjectURL(blob)
              const el = document.createElement('a'); el.href = url; el.download = 'agendamentos.csv'; el.click()
              URL.revokeObjectURL(url)
            }}
          ><Download size={12}/> Exportar CSV</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { id:'kpi-total-fechados', label:'Fechamentos',       value: String(fechamentos),                 color:'text-emerald-600', top:'border-t-emerald-500', sub: `${taxaConversao}% taxa` },
          { id:'kpi-noshows',        label:'No-show',           value: String(noShows),                     color:'text-amber-600',   top:'border-t-amber-500',   sub:'reminders ativos' },
          { id:'kpi-perdidos',       label:'Perdidos',          value: String(perdidos),                    color:'text-red-600',     top:'border-t-red-500',     sub:'em nurturing' },
          { id:'kpi-em-andamento',   label:'Em andamento',      value: String(emAndamento || agendamentos.filter((r: Agendamento) => r.status === 'confirmado' || r.status === 'pendente').length), color:'text-brand-600', top:'border-t-brand-500', sub:'aguardando resultado' },
          { id:'kpi-conv-receita',   label:'Taxa reunião→venda', value: `${taxaConversao}%`,                color:'text-purple-600',  top:'border-t-purple-500',  sub:'meta: 25%' },
        ].map(k => (
          <div key={k.id} className={clsx('card p-3 border-t-2', k.top)}>
            <div className={clsx('text-2xl font-bold font-mono', k.color)}>{k.value}</div>
            <div className="text-2xs font-semibold text-gray-400 uppercase tracking-wide mt-0.5">{k.label}</div>
            <div className="text-xs text-gray-400">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-3">
        {agendamentos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Calendar size={32} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">Nenhum agendamento encontrado</p>
            <p className="text-xs mt-1">As reuniões agendadas pelos agentes aparecerão aqui.</p>
          </div>
        )}
        {agendamentos.map((ag: any) => (
          <div key={ag.id} className={clsx('card border-l-4', ag.status === 'confirmado' ? 'border-l-brand-500' : ag.status === 'pendente' ? 'border-l-amber-500' : 'border-l-emerald-500')}>
            <div className="p-4">
              <div className="grid grid-cols-[2fr_1.2fr_1.2fr_1fr] gap-4 items-start">
                {/* Empresa */}
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                      <Building2 size={18} className="text-brand-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-gray-900">{ag.empresa}</span>
                        <span className="badge badge-brand text-2xs">{ag.modalidade === 'online' ? '💻 Online' : ag.modalidade === 'presencial' ? '📍 Presencial' : '🔀 Híbrido'}</span>
                        {ag.cidade && <span className="badge badge-neutral text-2xs"><MapPin size={9} className="inline mr-0.5"/>{ag.cidade}</span>}
                      </div>
                      {ag.cnpj && <div className="text-2xs text-gray-400 mt-0.5">CNPJ: {ag.cnpj} · {ag.segmento}</div>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-50 rounded-lg p-2">
                      <div className="text-2xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Reunião com</div>
                      <div className="text-xs font-semibold text-gray-900">{ag.contato}</div>
                      <div className="text-xs text-brand-600">{ag.cargo}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <div className="text-2xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Contato</div>
                      <div className="text-xs text-gray-700 font-mono">{ag.telefone}</div>
                      <div className="text-xs text-brand-600">{ag.email}</div>
                    </div>
                  </div>
                </div>

                {/* Resumo */}
                <div>
                  <div className="text-2xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Resumo da ligação</div>
                  <div className="text-xs text-gray-600 leading-relaxed bg-gray-50 rounded-lg p-2.5 border-l-2 border-brand-400">{ag.resumoLigacao}</div>
                  <div className="mt-2 text-2xs text-gray-400">Agente: <strong className="text-gray-700">{ag.agente}</strong> · {ag.duracaoLigacao}</div>
                </div>

                {/* Data/vendedor */}
                <div>
                  <div className="text-2xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Reunião agendada</div>
                  <div className="bg-gray-50 rounded-lg p-2.5 mb-2">
                    <div className="text-sm font-bold text-gray-900 font-mono">{ag.dataHora}</div>
                    {ag.meetLink && <a href="#" className="text-xs text-brand-500 hover:underline mt-0.5 block">{ag.meetLink}</a>}
                  </div>
                  <div className="text-2xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Vendedor responsável</div>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-brand-50 text-brand-600 text-2xs font-bold flex items-center justify-center">{ag.vendedorIniciais}</div>
                    <span className="text-xs font-medium text-gray-900">{ag.vendedor}</span>
                  </div>
                </div>

                {/* Status / resultado */}
                <div className="flex flex-col gap-2">
                  <span className={clsx('badge text-center', ag.status === 'confirmado' ? 'badge-success' : 'badge-amber')}>
                    {ag.status === 'confirmado' ? 'Invite enviado' : 'Aguardando aprovação'}
                  </span>

                  {/* Botões extras para pendente */}
                  {ag.status === 'pendente' && (
                    <div className="flex flex-col gap-1">
                      <button
                        className="text-xs font-semibold py-1.5 px-2 rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-50 bg-white transition-colors"
                        onClick={() => {
                          setResultados(r => ({ ...r, [ag.id]: 'aprovado' }))
                          reunioesApi.update(ag.id, { status: 'confirmada' }).catch(console.error)
                        }}
                      >✓ Aprovar</button>
                      <button
                        className="text-xs font-semibold py-1.5 px-2 rounded-lg border border-brand-300 text-brand-700 hover:bg-brand-50 bg-white transition-colors"
                        onClick={() => {
                          const v = prompt('Nome do vendedor:')
                          if (v) {
                            setResultados(r => ({ ...r, [ag.id]: 'transferido_' + v }))
                            reunioesApi.update(ag.id, { vendedor: v }).catch(console.error)
                          }
                        }}
                      >↔ Transferir vendedor</button>
                    </div>
                  )}

                  <div className="text-2xs font-semibold text-gray-400 uppercase tracking-wide">Resultado da reunião</div>
                  {resultados[ag.id] ? (
                    <div className={clsx('rounded-lg p-2 text-xs font-semibold text-center border',
                      resultados[ag.id] === 'fechou' && 'bg-emerald-50 text-emerald-700 border-emerald-200',
                      resultados[ag.id] === 'no_show' && 'bg-amber-50 text-amber-700 border-amber-200',
                      resultados[ag.id] === 'perdeu' && 'bg-red-50 text-red-700 border-red-200',
                      resultados[ag.id] === 'reagendou' && 'bg-brand-50 text-brand-700 border-brand-200',
                    )}>
                      {{ fechou:'💰 Negócio fechado!', no_show:'👻 No-show registrado', perdeu:'❌ Perdemos', reagendou:'🔄 Reagendamento feito' }[resultados[ag.id]]}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {[
                        { id:'fechou', label:'💰 Fechou negócio', cls:'border-emerald-300 text-emerald-700 hover:bg-emerald-50' },
                        { id:'no_show', label:'👻 No-show', cls:'border-amber-300 text-amber-700 hover:bg-amber-50' },
                        { id:'perdeu', label:'❌ Perdemos', cls:'border-gray-300 text-gray-600 hover:bg-gray-50' },
                        { id:'reagendou', label:'🔄 Reagendou', cls:'border-brand-300 text-brand-700 hover:bg-brand-50' },
                      ].map(btn => (
                        <button key={btn.id} onClick={() => setResultados(r => ({ ...r, [ag.id]: btn.id }))}
                          className={clsx('w-full text-xs font-semibold py-1.5 px-2 rounded-lg border bg-white transition-colors', btn.cls)}>
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className={clsx('text-2xs rounded px-2 py-1 text-center border', ag.noShowRisk < 25 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200')}>
                    📊 No-show: <strong>{ag.noShowRisk}%</strong> — {ag.noShowRisk < 25 ? 'baixo' : 'médio'} risco
                  </div>

                  <button onClick={() => setModalJornada(ag)} className="text-2xs font-semibold text-brand-600 hover:text-brand-700 text-center">📋 Ver jornada →</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Jornada */}
      {modalJornada && (() => {
        const ETAPAS_JORNADA = [
          { id: 'contato',    label: 'Contato inicial', icon: '📞' },
          { id: 'qualificado', label: 'Qualificado',    icon: '✅' },
          { id: 'agendado',   label: 'Agendado',        icon: '📅' },
          { id: 'realizado',  label: 'Realizado',       icon: '🤝' },
          { id: 'negociacao', label: 'Negociação',      icon: '💬' },
          { id: 'proposta',   label: 'Proposta',        icon: '📋' },
          { id: 'fechado',    label: 'Fechado',         icon: '🏆' },
        ]

        // Determine current stage from status + resultado
        const etapaAtual = modalJornada.resultado === 'fechou' ? 'fechado'
          : modalJornada.resultado === 'perdemos' ? 'realizado'
          : modalJornada.status === 'realizada' || modalJornada.status === 'realizado' ? 'realizado'
          : modalJornada.status === 'confirmado' || modalJornada.status === 'pendente' || modalJornada.status === 'agendada' ? 'agendado'
          : 'qualificado'

        const etapaIdx = ETAPAS_JORNADA.findIndex(e => e.id === etapaAtual)

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in" onClick={() => setModalJornada(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Jornada do Cliente — {modalJornada.empresa}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{modalJornada.contato} · {modalJornada.cargo}</p>
                </div>
                <button onClick={() => setModalJornada(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18}/></button>
              </div>

              <div className="p-6 flex flex-col gap-6">
                {/* Timeline */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Etapas da jornada</h3>
                  <div className="flex items-start gap-0">
                    {ETAPAS_JORNADA.map((etapa, i) => {
                      const passada = i < etapaIdx
                      const atual   = i === etapaIdx
                      void (i > etapaIdx) // futura — reserved for future styling
                      return (
                        <div key={etapa.id} className="flex items-center flex-1 min-w-0">
                          <div className="flex flex-col items-center flex-1 min-w-0">
                            <div className={clsx(
                              'w-9 h-9 rounded-full flex items-center justify-center text-base border-2 transition-all',
                              passada ? 'bg-brand-500 border-brand-500 text-white' :
                              atual   ? 'bg-brand-600 border-brand-600 text-white ring-4 ring-brand-100' :
                              'bg-white border-gray-200 text-gray-300'
                            )}>
                              {passada ? '✓' : etapa.icon}
                            </div>
                            <span className={clsx('text-2xs font-medium mt-1.5 text-center leading-tight', atual ? 'text-brand-600 font-bold' : passada ? 'text-gray-600' : 'text-gray-300')}>{etapa.label}</span>
                          </div>
                          {i < ETAPAS_JORNADA.length - 1 && (
                            <div className={clsx('h-0.5 w-6 flex-shrink-0 mt-[-18px]', passada ? 'bg-brand-400' : 'bg-gray-200')}/>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Dados da empresa */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Dados da empresa</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-2xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Contato</div>
                      <div className="text-sm font-bold text-gray-900">{modalJornada.contato}</div>
                      <div className="text-xs text-brand-600">{modalJornada.cargo}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-2xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Empresa</div>
                      <div className="text-sm font-bold text-gray-900">{modalJornada.empresa}</div>
                      {modalJornada.segmento && <div className="text-xs text-gray-500">{modalJornada.segmento}</div>}
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-2xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Telefone</div>
                      <div className="text-xs font-mono text-gray-700">{modalJornada.telefone || '—'}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-2xs font-semibold text-gray-400 uppercase tracking-wide mb-1">E-mail</div>
                      <div className="text-xs text-brand-600 truncate">{modalJornada.email || '—'}</div>
                    </div>
                  </div>
                </div>

                {/* Resumo da ligação */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Resumo da ligação</h3>
                  <div className="bg-gray-50 rounded-xl p-4 border-l-2 border-brand-400">
                    <p className="text-sm text-gray-700 leading-relaxed">{modalJornada.resumoLigacao || 'Sem resumo disponível.'}</p>
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-200">
                      <div>
                        <div className="text-2xs font-semibold text-gray-400 uppercase tracking-wide">Vendedor</div>
                        <div className="text-xs font-medium text-gray-800">{modalJornada.vendedor}</div>
                      </div>
                      <div>
                        <div className="text-2xs font-semibold text-gray-400 uppercase tracking-wide">Data / Hora</div>
                        <div className="text-xs font-mono text-gray-800">{modalJornada.dataHora}</div>
                      </div>
                      {modalJornada.meetLink && (
                        <div>
                          <div className="text-2xs font-semibold text-gray-400 uppercase tracking-wide">Link Meet</div>
                          <a href="#" className="text-xs text-brand-500 hover:underline">{modalJornada.meetLink}</a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Atualizar etapa */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1.5">Atualizar etapa</label>
                    <select className="input" value={etapaSelecionada} onChange={e => setEtapaSelecionada(e.target.value)}>
                      {ETAPAS_JORNADA.map(e => <option key={e.id} value={e.id}>{e.icon} {e.label}</option>)}
                      <option value="perdido">❌ Perdido</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1.5">Valor da oportunidade</label>
                    <input className="input" placeholder="R$ 0,00" value={valorOpor} onChange={e => setValorOpor(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1.5">Nota</label>
                  <textarea className="input min-h-[80px] resize-none" placeholder="Adicione uma nota sobre esta oportunidade..." value={nota} onChange={e => setNota(e.target.value)} />
                </div>
              </div>

              <div className="flex gap-3 px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white">
                <button onClick={() => setModalJornada(null)} className="btn-secondary flex-1">Cancelar</button>
                <button
                  className="btn-primary flex-1"
                  onClick={() => {
                    if (modalJornada) {
                      reunioesApi.update(modalJornada.id, { etapa: etapaSelecionada, valor_oportunidade: valorOpor, nota }).catch(console.error)
                    }
                    setModalJornada(null)
                    setEtapaSelecionada('Agendado')
                    setValorOpor('')
                    setNota('')
                  }}
                >Salvar etapa</button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

// ─── ABA GRAVAÇÕES ───────────────────────────────────────────────────────────

function TabGravacoes() {
  const [filtroAgente, setFiltroAgente] = useState('')
  const [filtroResultado, setFiltroResultado] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')

  const { data: equipeRaw = [] } = useQuery({
    queryKey: ['equipe'],
    queryFn: () => equipeApi.list().then(r => r.data as any[]),
  })

  const { data: gravacoesBruto = [] } = useQuery({
    queryKey: ['gravacoes'],
    queryFn: () => ligacoesApi.list({ status: 'encerrada' }).then(r =>
      (r.data as any[])
        .filter(l => l.url_gravacao)
        .map(l => ({
          id: String(l.call_control_id ?? l.id ?? Math.random()),
          empresa: l.contatos?.empresa ?? l.empresa_nome ?? l.numero_destino ?? '—',
          contato: l.contatos?.nome ?? l.contato_nome ?? '—',
          agente: l.agentes?.nome ?? l.agente_nome ?? '—',
          campanha: l.campanha_nome ?? l.campanha ?? '',
          duracao: l.duracao_segundos ? `${Math.floor(l.duracao_segundos / 60)}m${String(l.duracao_segundos % 60).padStart(2,'0')}s` : l.duracao ?? '—',
          data: l.encerrada_em ? new Date(l.encerrada_em).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' }) + ' · ' + new Date(l.encerrada_em).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' }) : '—',
          resultado: (l.resultado ?? 'retornar') as 'agendou' | 'retornar' | 'nao_atendeu',
          tipo: (l.tipo_ligacao ?? (l.transferido_para ? 'transferencia' : 'ia')) as 'ia' | 'manual' | 'transferencia',
          icp: l.icp ?? 0,
          url_gravacao: l.url_gravacao,
        }))
    ),
  })

  const gravacoes = gravacoesBruto.filter(g => {
    if (filtroAgente && g.agente !== filtroAgente) return false
    if (filtroResultado && g.resultado !== filtroResultado) return false
    if (filtroTipo && g.tipo !== filtroTipo) return false
    return true
  })

  const [playing, setPlaying] = useState<string | null>(null)
  const [progresso, setProgresso] = useState(0)

  useEffect(() => {
    if (!playing) { setProgresso(0); return }
    const timer = setInterval(() => {
      setProgresso(p => p >= 100 ? 100 : p + 1)
    }, 300)
    return () => clearInterval(timer)
  }, [playing])

  const resultadoLabel = { agendou:'Agendou', retornar:'Retornar', nao_atendeu:'Não atendeu' } as const
  const resultadoCls   = { agendou:'badge-success', retornar:'badge-amber', nao_atendeu:'badge-neutral' } as const
  const tipoLabel = { ia:'Agente IA', manual:'Manual', transferencia:'Transferência' } as const
  const tipoCls   = { ia:'badge-brand', manual:'badge-neutral', transferencia:'badge-purple' } as const

  return (
    <div className="flex flex-col gap-4">
      {/* Painel CI — aprendizado automático */}
      <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 flex gap-3">
        <span className="text-xl flex-shrink-0">🧠</span>
        <div>
          <p className="text-xs font-semibold text-purple-800 mb-1">Todas as ligações alimentam o Centro de Inteligência automaticamente</p>
          <p className="text-xs text-purple-700 leading-relaxed">
            Cada chamada — seja do agente de IA, manual ou transferência — é analisada em tempo real. Sinais de compra, objeções e argumentos validados são extraídos e enviados ao CI, que melhora o ICP e compartilha aprendizados entre campanhas via cross-cliente. Nenhuma ação é necessária da sua parte.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Gravações de chamadas</h3>
          <p className="text-xs text-gray-500 mt-0.5">Ligações do agente de IA, manuais e transferências a quente para vendedores.</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="input py-1.5 text-xs" value={filtroAgente} onChange={e => setFiltroAgente(e.target.value)}>
            <option value="">Todos os agentes</option>
            {equipeRaw.map((v: any) => <option key={v.id} value={v.nome}>{v.nome}</option>)}
          </select>
          <select className="input py-1.5 text-xs" value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
            <option value="">Todos os tipos</option>
            <option value="ia">Agente IA</option>
            <option value="manual">Manual</option>
            <option value="transferencia">Transferência</option>
          </select>
          <select className="input py-1.5 text-xs" value={filtroResultado} onChange={e => setFiltroResultado(e.target.value)}>
            <option value="">Todos os resultados</option>
            <option value="agendou">Agendou</option>
            <option value="retornar">Retornar</option>
            <option value="nao_atendeu">Não atendeu</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_120px] px-4 py-2 bg-gray-50 border-b border-gray-100">
          {['Empresa / Contato','Agente','Tipo','Data / Hora','Duração','Resultado','Ações'].map(h => (
            <span key={h} className="text-2xs font-semibold text-gray-400 uppercase tracking-wide">{h}</span>
          ))}
        </div>
        {gravacoes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Mic size={32} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">Nenhuma gravação disponível</p>
            <p className="text-xs mt-1">As gravações de chamadas encerradas aparecerão aqui.</p>
          </div>
        )}
        {gravacoes.map((g, i) => (
          <div key={g.id} className={clsx('grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_120px] px-4 py-3 border-b border-gray-100 items-center', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40')}>
            <div>
              <div className="text-sm font-medium text-gray-900">{g.empresa}</div>
              <div className="text-xs text-gray-500">{g.contato}</div>
            </div>
            <div className="text-xs text-gray-700">{g.agente}</div>
            <div><span className={clsx('badge text-2xs', tipoCls[g.tipo])}>{tipoLabel[g.tipo]}</span></div>
            <div className="text-xs text-gray-500">{g.data}</div>
            <div className="text-xs font-mono text-gray-600">{g.duracao}</div>
            <div><span className={clsx('badge text-2xs', resultadoCls[g.resultado])}>{resultadoLabel[g.resultado]}</span></div>
            <div className="flex items-center gap-2">
              <button onClick={() => setPlaying(playing === g.id ? null : g.id)} className={clsx('p-1.5 rounded-lg border transition-colors', playing === g.id ? 'bg-brand-500 border-brand-500 text-white' : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-brand-50 hover:border-brand-300')}>
                {playing === g.id ? <Pause size={12}/> : <Play size={12}/>}
              </button>
              <button className="p-1.5 rounded-lg border bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200 transition-colors"><Download size={12}/></button>
              <span className="text-2xs text-purple-600 font-medium flex items-center gap-1"><Brain size={10}/> CI ✓</span>
            </div>
          </div>
        ))}
      </div>

      {/* Player bar */}
      {playing && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-gray-900 border-t border-gray-800 px-6 py-3 flex items-center gap-4">
          <div className="flex items-center gap-3 min-w-[200px]">
            <button onClick={() => setPlaying(null)} className="p-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white transition-colors">
              <Pause size={14}/>
            </button>
            <div>
              <div className="text-xs font-semibold text-white">{gravacoes.find(g => g.id === playing)?.empresa}</div>
              <div className="text-2xs text-gray-400">{gravacoes.find(g => g.id === playing)?.agente}</div>
            </div>
          </div>
          <div className="flex-1 flex items-center gap-3">
            <span className="text-2xs text-gray-400 font-mono w-10">0:00</span>
            <div className="flex-1 h-1.5 bg-gray-700 rounded-full cursor-pointer">
              <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${progresso}%` }} />
            </div>
            <span className="text-2xs text-gray-400 font-mono w-10">{gravacoes.find(g => g.id === playing)?.duracao}</span>
          </div>
          <div className="flex items-center gap-2">
            <Volume2 size={14} className="text-gray-400"/>
            <button onClick={() => setPlaying(null)} className="text-gray-400 hover:text-white"><X size={16}/></button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── ABA MANUAL ──────────────────────────────────────────────────────────────

function TabManual() {
  const [busca, setBusca] = useState('')
  const [agenteId, setAgenteId] = useState('')
  const [motivo, setMotivo] = useState('Reagendamento — cliente não entrou na reunião')
  const [anotacao, setAnotacao] = useState('')
  const [contato, setContato] = useState<{ id?: string; nome: string; empresa: string; tel: string; email: string } | null>(null)
  const [numero, setNumero] = useState('')
  const [chamandoAtiva, setChamandoAtiva] = useState(false)
  const [callId, setCallId] = useState<string | null>(null)
  const [resultado, setResultado] = useState<string | null>(null)
  const [timer, setTimer] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Agentes reais
  const { data: agentesRaw = [] } = useQuery({
    queryKey: ['agentes'],
    queryFn: () => agentesApi.list().then(r => r.data as any[]),
  })

  // Busca de contatos via API (debounce simples)
  const { data: sugestoesRaw = [] } = useQuery({
    queryKey: ['contatos-busca', busca],
    queryFn: () => contatosApi.search(busca).then(r => (r.data as any).data ?? r.data ?? []),
    enabled: busca.length > 1,
  })
  const sugestoes = (sugestoesRaw as any[]).map((c: any) => ({
    id: c.id,
    nome: c.nome ?? '—',
    empresa: c.razao_social ?? c.empresa ?? '—',
    tel: c.telefone ?? '',
    email: c.email ?? '',
  }))

  // Histórico de chamadas manuais
  const { data: historicoRaw = [] } = useQuery({
    queryKey: ['ligacoes-manual'],
    queryFn: () => ligacoesApi.list({ status: 'encerrada' }).then(r =>
      (r.data as any[]).filter(l => l.tipo_ligacao === 'manual' || l.origem === 'manual').slice(0, 10)
    ),
    refetchInterval: 15000,
  })

  async function ligar() {
    const tel = contato?.tel || numero
    if (!tel) return
    setChamandoAtiva(true)
    setResultado(null)
    setTimer(0)
    intervalRef.current = setInterval(() => setTimer(t => t + 1), 1000)
    try {
      const res = await ligacoesApi.create({
        numero_destino: tel,
        agente_id: agenteId || undefined,
        contato_id: contato?.id || undefined,
        iniciar_agora: true,
        tipo_ligacao: 'manual',
        motivo,
        anotacao_pre: anotacao,
      })
      setCallId((res.data as any)?.call_control_id ?? null)
    } catch (err) {
      console.error('Erro ao iniciar chamada manual:', err)
    }
  }

  async function registrarResultado(res: string) {
    setResultado(res)
    setChamandoAtiva(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (callId) {
      try { await ligacoesApi.encerrar(callId) } catch (_) {}
    }
  }

  const formatTimer = (s: number) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

  return (
    <div className="grid grid-cols-[400px_1fr] gap-4">
      {/* Painel esquerdo */}
      <div className="flex flex-col gap-3">
        <div className="card">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Realizar chamada manual</h3>
            <p className="text-xs text-gray-500 mt-0.5">Ligue diretamente para um cliente pelo sistema</p>
          </div>
          <div className="p-4 flex flex-col gap-4">
            <div className="bg-brand-50 rounded-lg p-3 text-xs text-brand-700 flex gap-2">
              <span className="flex-shrink-0">✦</span>
              <span>Use para reagendamentos, follow-up pós-reunião ou quando o cliente não entrou na reunião. A ligação sai pelo sistema com o mesmo número configurado.</span>
            </div>

            {/* Busca */}
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1.5">Buscar contato</label>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                <input className="input pl-9" placeholder="Nome, empresa ou telefone..." value={busca} onChange={e => setBusca(e.target.value)}/>
              </div>
              {sugestoes.length > 0 && (
                <div className="border border-brand-300 rounded-lg overflow-hidden mt-1">
                  {sugestoes.map(s => (
                    <div key={s.nome} className="p-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0" onClick={() => { setContato(s); setBusca('') }}>
                      <div className="text-sm font-medium text-gray-900">{s.nome}</div>
                      <div className="text-xs text-gray-500">{s.empresa} · {s.tel}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Contato selecionado */}
            {contato && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-brand-50 text-brand-600 text-sm font-bold flex items-center justify-center">
                    {contato.nome.split(' ').map(n => n[0]).join('').slice(0,2)}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-900">{contato.nome}</div>
                    <div className="text-xs text-gray-500">{contato.empresa}</div>
                  </div>
                  <button onClick={() => setContato(null)}><XCircle size={16} className="text-gray-400 hover:text-gray-600"/></button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-2xs text-gray-400 uppercase font-semibold block mb-0.5">Telefone</span><span className="font-mono">{contato.tel}</span></div>
                  <div><span className="text-2xs text-gray-400 uppercase font-semibold block mb-0.5">E-mail</span><span className="text-brand-600">{contato.email}</span></div>
                  <div className="col-span-2"><span className="text-2xs text-gray-400 uppercase font-semibold block mb-0.5">Motivo</span><span className="text-amber-600 font-medium">{motivo}</span></div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3"><div className="flex-1 h-px bg-gray-200"/><span className="text-xs text-gray-400">ou digitar número</span><div className="flex-1 h-px bg-gray-200"/></div>

            <input className="input font-mono text-sm tracking-widest" placeholder="(11) 99999-9999" type="tel" value={numero} onChange={e => setNumero(e.target.value)}/>

            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1.5">Agente que realizará a ligação</label>
              <select className="input" value={agenteId} onChange={e => setAgenteId(e.target.value)}>
                <option value="">Selecionar agente...</option>
                {(agentesRaw as any[]).map((a: any) => <option key={a.id} value={a.id}>{a.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1.5">Motivo da ligação</label>
              <select className="input" value={motivo} onChange={e => setMotivo(e.target.value)}>
                <option>Reagendamento — cliente não entrou na reunião</option>
                <option>Follow-up pós-reunião</option>
                <option>Confirmação de reunião</option>
                <option>Retorno de chamada solicitado</option>
                <option>Proposta comercial</option>
                <option>Outro</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1.5">Anotação pré-ligação</label>
              <textarea className="input min-h-[64px] resize-none" value={anotacao} onChange={e => setAnotacao(e.target.value)} placeholder="Ex: Cliente não atendeu o Google Meet de 14/05 às 14h. Tentar reagendar..." />
            </div>

            <button onClick={ligar} disabled={chamandoAtiva || (!contato && !numero)} className="btn-primary w-full justify-center gap-2 py-3 text-sm disabled:opacity-60">
              <Phone size={15}/> {chamandoAtiva ? 'Em ligação...' : '📞 Ligar agora'}
            </button>
            <button className="btn-secondary w-full justify-center gap-2 text-sm" style={{ color:'#128c7e', borderColor:'#25d366' }}>
              <MessageSquare size={14}/> Enviar WhatsApp
            </button>
          </div>
        </div>
      </div>

      {/* Painel direito */}
      <div className="flex flex-col gap-4">
        {/* Painel de chamada ativa */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Chamada em andamento</h3>
          </div>

          {!chamandoAtiva && !resultado && (
            <div className="flex flex-col items-center justify-center py-16 text-center px-8">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <Phone size={28} className="text-gray-400"/>
              </div>
              <h3 className="text-sm font-semibold text-gray-700">Nenhuma chamada ativa</h3>
              <p className="text-xs text-gray-400 mt-2">Preencha os dados à esquerda e clique em "Ligar agora" para iniciar</p>
            </div>
          )}

          {chamandoAtiva && (
            <div className="p-6">
              {/* Ring animado */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative w-20 h-20 mb-4">
                  <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-60"/>
                  <div className="relative w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Phone size={28} className="text-white"/>
                  </div>
                </div>
                <div className="text-lg font-bold text-gray-900">{contato?.nome ?? numero}</div>
                <div className="text-sm text-gray-500">{contato?.empresa ?? 'Contato manual'}</div>
                <div className="text-2xl font-mono font-bold text-gray-900 mt-2">{formatTimer(timer)}</div>
                <span className="badge badge-success mt-2 animate-pulse">● Em ligação</span>
              </div>

              {/* Nota ao vivo */}
              <div className="mb-4">
                <label className="text-xs font-medium text-gray-700 block mb-1.5">Anotações durante a chamada</label>
                <textarea className="input min-h-[80px] resize-none" placeholder="Anote pontos importantes durante a chamada..."/>
              </div>

              {/* Botões de resultado */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id:'reagendou', label:'📅 Reagendou', cls:'border-brand-300 text-brand-700 hover:bg-brand-50' },
                  { id:'confirmou', label:'✓ Confirmou presença', cls:'border-emerald-300 text-emerald-700 hover:bg-emerald-50' },
                  { id:'nao_atendeu', label:'📵 Não atendeu', cls:'border-amber-300 text-amber-700 hover:bg-amber-50' },
                  { id:'encerrar', label:'⏹ Encerrar', cls:'border-gray-300 text-gray-600 hover:bg-gray-50' },
                ].map(btn => (
                  <button key={btn.id} onClick={() => registrarResultado(btn.id)}
                    className={clsx('text-sm font-semibold py-2.5 px-3 rounded-xl border bg-white transition-colors', btn.cls)}>
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {resultado && (
            <div className="flex flex-col items-center justify-center py-12 text-center px-8">
              <CheckCircle2 size={40} className="text-emerald-500 mb-3"/>
              <div className="text-base font-bold text-gray-900">Resultado registrado</div>
              <div className="text-sm text-gray-500 mt-1">
                {{ reagendou:'Reagendamento confirmado', confirmou:'Presença confirmada', nao_atendeu:'Não atendeu — cadência iniciada', encerrar:'Chamada encerrada' }[resultado]}
              </div>
              <button onClick={() => setResultado(null)} className="btn-secondary mt-4 text-sm gap-2"><RotateCcw size={13}/> Nova chamada</button>
            </div>
          )}
        </div>

        {/* Histórico de chamadas manuais */}
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Últimas chamadas manuais</h3>
          {historicoRaw.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">Nenhuma chamada manual registrada.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {(historicoRaw as any[]).map((h: any, i: number) => {
                const res = (h.resultado ?? 'encerrada') as string
                const labelMap: Record<string, string> = { agendada:'Agendou', nao_atendida:'Não atendeu', encerrada:'Encerrada', atendida:'Atendida' }
                const cls = res === 'agendada' ? 'badge-success' : res === 'nao_atendida' ? 'badge-amber' : 'badge-neutral'
                const label = labelMap[res] ?? res
                const data = h.encerrada_em ? new Date(h.encerrada_em).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }) : '—'
                return (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <User size={14} className="text-gray-500"/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-900">{h.contatos?.empresa ?? h.numero_destino ?? '—'} · {h.contatos?.nome ?? '—'}</div>
                      <div className="text-2xs text-gray-400">{data}</div>
                    </div>
                    <span className={clsx('badge text-2xs', cls)}>{label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── ABA AGENDA ──────────────────────────────────────────────────────────────

function TabAgenda() {
  const navigate = useNavigate()
  const [vendedorSel, setVendedorSel] = useState('')
  const [detalhe, setDetalhe] = useState<{ empresa: string; contato: string; hora: string; fim: string } | null>(null)
  const horas = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00']

  // Vendedores reais
  const { data: equipeRaw = [] } = useQuery({
    queryKey: ['equipe'],
    queryFn: () => equipeApi.list().then(r => r.data as any[]),
  })
  const vendedorAtual = (equipeRaw as any[]).find((v: any) => v.id === vendedorSel) ?? equipeRaw[0]

  // Reuniões reais
  const { data: reunioesRaw = [] } = useQuery({
    queryKey: ['reunioes-agenda'],
    queryFn: () => reunioesApi.list().then(r => r.data as any[]),
  })

  // Monta semana atual (seg–sex)
  const hoje = new Date()
  const diaSemana = hoje.getDay() // 0=dom
  const seg = new Date(hoje); seg.setDate(hoje.getDate() - (diaSemana === 0 ? 6 : diaSemana - 1))
  const dias = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(seg); d.setDate(seg.getDate() + i)
    return { label: d.toLocaleDateString('pt-BR', { weekday:'short', day:'2-digit' }), iso: d.toISOString().split('T')[0] }
  })

  // Filtra reuniões por vendedor e monta eventos
  type Evento = { hora: string; fim: string; empresa: string; contato: string; cor: 'brand' | 'emerald' | 'amber' }
  const cores: Array<'brand' | 'emerald' | 'amber'> = ['brand', 'emerald', 'amber']
  const eventosPorDia: Record<string, Evento[]> = {}
  ;(reunioesRaw as any[])
    .filter((r: any) => !vendedorSel || r.vendedor_id === vendedorSel || r.vendedor_nome?.includes(vendedorAtual?.nome ?? ''))
    .forEach((r: any, idx: number) => {
      const inicio = r.inicio ?? r.data_hora
      if (!inicio) return
      const d = new Date(inicio)
      const diaKey = d.toISOString().split('T')[0]
      const hora = d.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })
      const fimD = new Date(d.getTime() + 30 * 60000)
      const fim  = fimD.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })
      if (!eventosPorDia[diaKey]) eventosPorDia[diaKey] = []
      eventosPorDia[diaKey].push({ hora, fim, empresa: r.empresa ?? '—', contato: r.contato ?? r.contato_nome ?? '—', cor: cores[idx % 3] })
    })

  const corMap = { brand:'bg-brand-100 border-l-brand-500 text-brand-700', emerald:'bg-emerald-50 border-l-emerald-500 text-emerald-700', amber:'bg-amber-50 border-l-amber-500 text-amber-700' }

  // KPIs reais
  const totalHoje = (reunioesRaw as any[]).filter((r: any) => {
    const d = r.inicio ?? r.data_hora; return d && new Date(d).toDateString() === new Date().toDateString()
  }).length
  const totalSemana = (reunioesRaw as any[]).filter((r: any) => {
    const d = r.inicio ?? r.data_hora; if (!d) return false
    const dt = new Date(d); return dt >= seg && dt <= new Date(seg.getTime() + 4 * 86400000)
  }).length
  const totalMes = (reunioesRaw as any[]).filter((r: any) => {
    const d = r.inicio ?? r.data_hora; if (!d) return false
    const dt = new Date(d); return dt.getMonth() === hoje.getMonth() && dt.getFullYear() === hoje.getFullYear()
  }).length

  return (
    <div className="flex flex-col gap-4">
      {/* Seletor de vendedor (visão gerente) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {vendedorAtual && (
            <div className="w-10 h-10 rounded-full bg-brand-500 text-white font-bold flex items-center justify-center text-sm">
              {((vendedorAtual?.nome ?? 'V') as string).split(' ').map((n: string) => n[0]).join('').slice(0,2)}
            </div>
          )}
          <div>
            <div className="text-sm font-bold text-gray-900">{vendedorAtual?.nome ?? '—'}</div>
            <div className="text-xs text-gray-500">{vendedorAtual?.cargo ?? vendedorAtual?.funcao ?? 'Vendedor'}</div>
          </div>
          <select className="input text-xs py-1.5" value={vendedorSel} onChange={e => setVendedorSel(e.target.value)}>
            <option value="">Todos os vendedores</option>
            {(equipeRaw as any[]).map((v: any) => <option key={v.id} value={v.id}>{v.nome}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4">
            {[{label:'Hoje',value:String(totalHoje),color:'text-brand-600'},{label:'Esta semana',value:String(totalSemana),color:'text-gray-900'},{label:'Este mês',value:String(totalMes),color:'text-gray-900'}].map(k => (
              <div key={k.label} className="text-center">
                <div className={clsx('text-xl font-bold font-mono', k.color)}>{k.value}</div>
                <div className="text-2xs text-gray-400">{k.label}</div>
              </div>
            ))}
          </div>
          <button
            className="btn-secondary text-xs py-1.5 gap-1.5"
            onClick={() => navigate('/config', { state: { tab: 'integracoes' } })}
          ><Calendar size={12}/> Sync Google Agenda</button>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Calendário */}
        <div className="flex-1 card overflow-hidden">
          {/* Navegação + dias */}
          <div className="grid grid-cols-[60px_repeat(5,1fr)] border-b border-gray-100">
            <div className="p-2 flex items-center justify-between col-span-1">
              <div className="flex gap-1">
                <button className="text-2xs text-gray-500 hover:text-gray-700 px-1.5 py-1 rounded hover:bg-gray-100">‹</button>
                <button className="text-2xs text-gray-500 hover:text-gray-700 px-1.5 py-1 rounded hover:bg-gray-100">Hoje</button>
                <button className="text-2xs text-gray-500 hover:text-gray-700 px-1.5 py-1 rounded hover:bg-gray-100">›</button>
              </div>
            </div>
            {dias.map(d => (
              <div key={d.iso} className={clsx('p-3 text-center border-l border-gray-100', d.iso === new Date().toISOString().split('T')[0] && 'bg-brand-50')}>
                <div className={clsx('text-xs font-semibold capitalize', d.iso === new Date().toISOString().split('T')[0] ? 'text-brand-600' : 'text-gray-600')}>{d.label}</div>
              </div>
            ))}
          </div>

          {/* Grid de horas */}
          <div className="overflow-y-auto max-h-[400px]">
            {horas.map(hora => (
              <div key={hora} className="grid grid-cols-[60px_repeat(5,1fr)] border-b border-gray-100 min-h-[52px]">
                <div className="px-2 py-1 text-2xs text-gray-400 font-mono border-r border-gray-100 pt-1.5">{hora}</div>
                {dias.map(dia => {
                  const ev = eventosPorDia[dia.iso]?.find(e => e.hora === hora)
                  return (
                    <div key={dia.iso} className="border-l border-gray-100 p-1 relative">
                      {ev && (
                        <div
                          className={clsx('rounded-md px-1.5 py-1 text-2xs border-l-2 cursor-pointer hover:opacity-80 transition-opacity', corMap[ev.cor])}
                          onClick={() => setDetalhe(ev)}
                        >
                          <div className="font-bold">{ev.hora}–{ev.fim}</div>
                          <div className="font-medium leading-tight">{ev.empresa}</div>
                          <div className="opacity-70">{ev.contato}</div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Legenda */}
          <div className="flex items-center gap-4 px-4 py-2 border-t border-gray-100">
            {[{cor:'bg-brand-500', label:'Confirmada'},{cor:'bg-amber-400', label:'Pendente'},{cor:'bg-emerald-500', label:'Concluída'}].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className={clsx('w-2.5 h-2.5 rounded-sm', l.cor)}/>
                <span className="text-2xs text-gray-500">{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Painel lateral */}
        <div className="w-64 flex flex-col gap-3">
          <div className="card p-4">
            <h4 className="text-xs font-semibold text-gray-700 mb-3">Próximas reuniões</h4>
            <div className="flex flex-col gap-2">
              {(reunioesRaw as any[])
                .filter((r: any) => {
                  const d = r.inicio ?? r.data_hora; if (!d) return false
                  return new Date(d) >= new Date()
                })
                .slice(0, 5)
                .map((r: any, i: number) => {
                  const d = new Date(r.inicio ?? r.data_hora)
                  const hora = d.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })
                  const corIdx = i % 3
                  const corCls = corIdx === 0 ? 'border-l-brand-500' : corIdx === 1 ? 'border-l-amber-500' : 'border-l-emerald-500'
                  return (
                    <div key={r.id ?? i} className={clsx('border-l-2 pl-2 cursor-pointer hover:bg-gray-50 rounded-r-lg py-1', corCls)}
                      onClick={() => setDetalhe({ empresa: r.empresa ?? '—', contato: r.contato ?? '—', hora, fim: hora })}>
                      <div className="text-2xs font-mono text-gray-500">{hora}</div>
                      <div className="text-xs font-semibold text-gray-900">{r.empresa ?? '—'}</div>
                      <div className="text-2xs text-gray-500">{r.contato ?? r.contato_nome ?? '—'}</div>
                    </div>
                  )
                })
              }
              {(reunioesRaw as any[]).filter((r: any) => new Date(r.inicio ?? r.data_hora) >= new Date()).length === 0 && (
                <p className="text-2xs text-gray-400 text-center py-2">Nenhuma reunião futura</p>
              )}
            </div>
          </div>

          {detalhe && (
            <div className="card p-4">
              <div className="flex items-start justify-between mb-3">
                <h4 className="text-xs font-semibold text-gray-700">Detalhe da reunião</h4>
                <button onClick={() => setDetalhe(null)}><X size={13} className="text-gray-400"/></button>
              </div>
              <div className="text-sm font-bold text-gray-900">{detalhe.empresa}</div>
              <div className="text-xs text-gray-500 mb-1">{detalhe.contato}</div>
              <div className="text-xs font-mono text-brand-600 mb-3">{detalhe.hora} – {detalhe.fim}</div>
              <div className="flex flex-col gap-1.5">
                <button className="btn-primary text-xs py-1.5 gap-1.5 justify-center"><Video size={11}/> Entrar no Meet</button>
                <button className="btn-secondary text-xs py-1.5 gap-1.5 justify-center"><Phone size={11}/> Ligar</button>
                <button className="btn-secondary text-xs py-1.5 gap-1.5 justify-center"><RotateCcw size={11}/> Reagendar</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── ABA AO VIVO ─────────────────────────────────────────────────────────────

function TabAoVivo({ onGoFila }: { onGoFila?: (id: string) => void }) {
  const [transferidos, setTransferidos] = useState<Record<string, string>>({})

  const { data: ligacoesAtivas = [], isLoading } = useQuery({
    queryKey: ['ligacoes-ao-vivo'],
    queryFn: () => ligacoesApi.list({ status: 'em_andamento' }).then(r =>
      (r.data as any[]).map(l => ({
        id: String(l.call_control_id ?? l.id ?? Math.random()),
        empresa: l.contatos?.empresa ?? l.empresa_nome ?? l.numero_destino ?? '—',
        contato: l.contatos?.nome ?? l.contato_nome ?? '—',
        cargo: l.contatos?.cargo ?? l.cargo ?? '',
        telefone: l.numero_destino ?? l.telefone ?? '',
        agente: l.agentes?.nome ?? l.agente_nome ?? '—',
        campanha: l.campanha_nome ?? l.campanha ?? '',
        segmento: l.contatos?.segmento ?? l.segmento ?? '',
        status: 'em_ligacao' as StatusLigacao,
        icp: l.icp ?? 0,
        potencial: l.potencial ?? 0,
        tentativa: l.tentativa ?? 1,
        maxTentativas: l.max_tentativas ?? 3,
        duracao: l.duracao,
        snippet: l.snippet,
        gatilhoDetectado: l.gatilho_detectado,
        transferindo: l.transferindo ?? false,
      } as EntradaFila))
    ),
    refetchInterval: 5000,
  })

  const ativas = ligacoesAtivas

  return (
    <div className="flex flex-col gap-4">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { id:'aovivo-n-ativas', label:'Ativas agora', value: ativas.length, color:'text-emerald-600', bg:'bg-emerald-50', border:'border-emerald-200' },
          { id:'aovivo-n-transferencias', label:'Transferências hoje', value: 3, color:'text-purple-600', bg:'bg-purple-50', border:'border-purple-200' },
          { id:'aovivo-taxa', label:'Taxa de conversão', value: '8.2%', color:'text-brand-600', bg:'bg-brand-50', border:'border-brand-200' },
        ].map(k => (
          <div key={k.id} className={clsx('rounded-xl p-4 border flex items-center gap-4', k.bg, k.border)}>
            <div className={clsx('text-3xl font-bold font-mono', k.color)}>{k.value}</div>
            <div className="text-sm text-gray-600">{k.label}</div>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4 animate-pulse"><Radio size={28} className="text-gray-300"/></div>
          <p className="text-sm text-gray-400">Carregando ligações ativas...</p>
        </div>
      ) : ativas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4"><Radio size={28} className="text-gray-400"/></div>
          <h3 className="text-base font-semibold text-gray-900">Nenhuma ligação ativa no momento</h3>
          <p className="text-sm text-gray-500 mt-2">As ligações aparecem aqui em tempo real assim que o agente inicia uma chamada</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {ativas.map(item => (
            <div key={item.id} className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800">
              <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"/>
                  <div>
                    <div className="text-sm font-bold text-white">{item.empresa}</div>
                    <div className="text-xs text-gray-400">{item.agente} · {item.campanha}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <IcpBadge value={item.icp}/>
                  <span className="text-xs text-gray-400 font-mono">{item.duracao}</span>
                </div>
              </div>
              {item.potencial > 0 && (
                <div className="px-4 py-3">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-2xs text-gray-400 uppercase tracking-wide">Potencial de fechamento</span>
                    <span className="text-sm text-purple-400 font-bold font-mono">{item.potencial}%</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-700 to-purple-400 rounded-full" style={{ width:`${item.potencial}%` }}/>
                  </div>
                </div>
              )}
              {item.snippet && (
                <div className="px-4 pb-3">
                  <div className="text-2xs text-emerald-400 font-semibold uppercase tracking-wide mb-2">🎤 Transcrição</div>
                  <div className="text-2xs text-gray-400 italic bg-gray-800/50 rounded-lg p-2.5">{item.snippet}</div>
                </div>
              )}
              <div className="px-4 pb-4 flex gap-2">
                <button
                  className="flex-1 text-xs font-semibold py-2 rounded-lg bg-purple-900/50 border border-purple-700 text-purple-300 hover:bg-purple-800/50 transition-colors"
                  onClick={() => {
                    const v = (item as EntradaFila & { vendedor?: string }).vendedor ?? TRANSFER_CANDIDATES.find(tc => tc.status === 'disponivel')?.nome ?? 'Vendedor'
                    setTransferidos(prev => ({ ...prev, [item.id]: v }))
                  }}
                >{transferidos[item.id] ? `✓ Transferindo → ${transferidos[item.id]}` : '⚡ Transferir agora'}</button>
                <button
                  className="flex-1 text-xs font-semibold py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 transition-colors"
                  onClick={() => onGoFila?.(item.id)}
                >🎧 Escutar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── ABA HISTÓRICO ───────────────────────────────────────────────────────────

function TabHistorico() {
  const [periodo, setPeriodo] = useState(7)
  const [transcricaoAbertaHist, setTranscricaoAbertaHist] = useState<Record<string, boolean>>({})

  const { data: ligacoesRaw = [], isLoading } = useQuery({
    queryKey: ['ligacoes-historico', periodo],
    queryFn: () => ligacoesApi.list({ status: 'encerrada' }).then(r => r.data as any[]),
    refetchInterval: 30000,
  })

  // Filtra por período
  const HISTORICO = ligacoesRaw.filter(l => {
    if (!periodo) return true
    const encerrada = l.encerrada_em || l.iniciada_em
    if (!encerrada) return true
    const diffDias = (Date.now() - new Date(encerrada).getTime()) / (1000 * 60 * 60 * 24)
    return diffDias <= periodo
  })

  const agendamentos = HISTORICO.filter(h => h.resultado === 'agendada' || h.resultado === 'atendida').length
  const taxa = HISTORICO.length > 0 ? ((agendamentos / HISTORICO.length) * 100).toFixed(1) : '0.0'
  const transferencias = HISTORICO.filter(h => h.status === 'transferida').length
  const comTranscricao = HISTORICO.filter(h => h.transcricao).length

  function formatDuracao(secs: number | null) {
    if (!secs) return '—'
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}m${String(s).padStart(2,'0')}s`
  }
  function formatData(iso: string | null) {
    if (!iso) return '—'
    const d = new Date(iso)
    return d.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' }) + ' ' +
           d.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })
  }
  function labelResultado(r: string) {
    const map: Record<string, string> = {
      atendida: 'Atendida', agendada: 'Agendou', transferida: 'Transferida',
      nao_atendida: 'Não atendeu', ocupado: 'Ocupado', cancelada: 'Cancelada',
      numero_invalido: 'Nº inválido', encerrada: 'Encerrada', pendente: 'Pendente'
    }
    return map[r] || r || '—'
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1 gap-0.5">
            {[7,15,30,0].map(d => (
              <button key={d} onClick={() => setPeriodo(d)}
                className={clsx('px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                  periodo === d ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                )}>
                {d === 0 ? 'Tudo' : `${d} dias`}
              </button>
            ))}
          </div>
        </div>
        <button
          className="btn-secondary gap-2 text-xs py-1.5"
          onClick={() => {
            const header = 'Contato,Telefone,Agente,Data,Duração,Resultado,Transcrição'
            const rows = HISTORICO.map(h =>
              `${h.contatos?.nome || ''},${h.numero_destino || ''},${h.agentes?.nome || ''},${formatData(h.encerrada_em)},${formatDuracao(h.duracao_segundos)},${labelResultado(h.resultado)},"${(h.transcricao || '').replace(/"/g,'""')}"`)
            const csv = [header, ...rows].join('\n')
            const blob = new Blob([csv], { type: 'text/csv' })
            const url = URL.createObjectURL(blob)
            const el = document.createElement('a'); el.href = url; el.download = 'historico.csv'; el.click()
            URL.revokeObjectURL(url)
          }}
        ><Download size={12}/> Exportar CSV</button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { id:'hist-kpi-total',    label:'Total ligações',    value: HISTORICO.length,  color:'text-gray-900' },
          { id:'hist-kpi-agend',    label:'Agendamentos',      value: agendamentos,       color:'text-emerald-600' },
          { id:'hist-kpi-transf',   label:'Transferências',    value: transferencias,     color:'text-purple-600' },
          { id:'hist-kpi-transc',   label:'Com transcrição',   value: comTranscricao,     color:'text-brand-600' },
          { id:'hist-kpi-taxa',     label:'Taxa conversão',    value:`${taxa}%`,          color:'text-brand-600' },
        ].map(k => (
          <div key={k.id} className="kpi-card">
            <span className={clsx('text-2xl font-bold font-mono', k.color)}>{k.value}</span>
            <span className="text-xs text-gray-500">{k.label}</span>
            <span className="text-2xs text-gray-400">Últimos {periodo || 'todos'} dias</span>
          </div>
        ))}
      </div>

      {/* Tabela */}
      <div className="card overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_.8fr_1.2fr_100px] px-4 py-2 bg-gray-50 border-b border-gray-100">
          {['Contato / Número','Agente · Data','Duração','Resultado','Ações'].map(h => (
            <span key={h} className="text-2xs font-semibold text-gray-400 uppercase tracking-wide">{h}</span>
          ))}
        </div>
        <div id="hist-tabela-corpo">
          {isLoading && (
            <div className="px-4 py-8 text-center text-xs text-gray-400">Carregando...</div>
          )}
          {!isLoading && HISTORICO.length === 0 && (
            <div className="px-4 py-8 text-center text-xs text-gray-400">Nenhuma ligação encerrada nos últimos {periodo || 'todos'} dias.</div>
          )}
          {HISTORICO.map((h, i) => (
            <div key={h.id} className={clsx('border-b border-gray-100', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40')}>
              <div className="grid grid-cols-[2fr_1fr_.8fr_1.2fr_100px] px-4 py-3 items-center">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {h.contatos?.nome || h.numero_destino || '—'}
                  </div>
                  <div className="text-xs text-gray-500 font-mono">{h.numero_destino}</div>
                  <div className="text-2xs text-gray-400">{h.agentes?.nome ? `Agente: ${h.agentes.nome}` : ''}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-700">{h.agentes?.nome || '—'}</div>
                  <div className="text-2xs text-gray-400">{formatData(h.encerrada_em || h.iniciada_em)}</div>
                </div>
                <div className="text-xs font-mono text-gray-600">{formatDuracao(h.duracao_segundos)}</div>
                <span className={clsx('badge text-2xs w-fit',
                  h.resultado === 'agendada' || h.resultado === 'atendida' ? 'badge-success' :
                  h.resultado === 'transferida' ? 'badge-purple' :
                  h.resultado === 'nao_atendida' ? 'badge-amber' : 'badge-danger'
                )}>{labelResultado(h.resultado)}</span>
                <div className="flex gap-1.5">
                  {h.transcricao && (
                    <button
                      className="text-2xs text-brand-600 hover:text-brand-700 font-medium"
                      onClick={() => setTranscricaoAbertaHist(prev => ({ ...prev, [h.id]: !prev[h.id] }))}
                    >{transcricaoAbertaHist[h.id] ? '▲ Fechar' : '▼ Ver'}</button>
                  )}
                  {h.url_gravacao && (
                    <a href={h.url_gravacao} target="_blank" rel="noopener noreferrer"
                      className="text-2xs text-emerald-600 hover:text-emerald-700 font-medium">🎧</a>
                  )}
                  {!h.transcricao && !h.url_gravacao && (
                    <span className="text-2xs text-gray-300">—</span>
                  )}
                </div>
              </div>
              {/* Transcrição expandida */}
              {transcricaoAbertaHist[h.id] && h.transcricao && (
                <div className="px-4 pb-3">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                    <div className="text-2xs font-semibold text-gray-500 uppercase mb-2">Transcrição da conversa</div>
                    {h.transcricao.split('\n').map((linha: string, idx: number) => {
                      const isAgente = linha.startsWith('[AGENTE]')
                      return (
                        <div key={idx} className={clsx('text-xs py-0.5', isAgente ? 'text-brand-700 font-medium' : 'text-gray-700')}>
                          {linha}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        <div id="hist-tabela-rodape" className="px-4 py-2 bg-gray-50 border-t border-gray-100">
          <span className="text-2xs text-gray-400">{HISTORICO.length} chamadas nos últimos {periodo || 'todos'} dias</span>
        </div>
      </div>
    </div>
  )
}

// ─── ABA RAMAL ───────────────────────────────────────────────────────────────

interface MembroEquipe {
  nome: string
  cargo: string
  ramal: string
  status: 'disponivel' | 'em_chamada' | 'offline'
}

interface ChamadaRecente {
  direcao: 'entrada' | 'saida'
  nomeOuNumero: string
  duracao: string
  dataHora: string
}

const EQUIPE_RAMAL: MembroEquipe[] = [
  { nome: 'João Silva',      cargo: 'Closer SP',    ramal: '2202', status: 'disponivel' },
  { nome: 'Carlos Ferreira', cargo: 'Closer MG',    ramal: '2203', status: 'em_chamada' },
  { nome: 'Ana Rodrigues',   cargo: 'Gerente',      ramal: '2204', status: 'disponivel' },
  { nome: 'Fernanda Rocha',  cargo: 'Colaboradora', ramal: '2205', status: 'offline'    },
  { nome: 'Marcos Lima',     cargo: 'Closer GO',    ramal: '2206', status: 'disponivel' },
]

const CHAMADAS_RAMAL: ChamadaRecente[] = [
  { direcao: 'saida',   nomeOuNumero: 'João Silva',      duracao: '4m32s', dataHora: 'Hoje · 10h14' },
  { direcao: 'entrada', nomeOuNumero: '(11) 98765-4321', duracao: '1m18s', dataHora: 'Hoje · 09h52' },
  { direcao: 'saida',   nomeOuNumero: 'Ana Rodrigues',   duracao: '2m05s', dataHora: 'Hoje · 09h30' },
  { direcao: 'entrada', nomeOuNumero: 'Carlos Ferreira', duracao: '0m47s', dataHora: 'Ontem · 17h40' },
  { direcao: 'saida',   nomeOuNumero: '(31) 97654-3210', duracao: '3m22s', dataHora: 'Ontem · 16h15' },
]

function TabRamal() {
  const [copiado, setCopiado] = useState(false)
  const [atenderRamal, setAtenderRamal] = useState(true)
  const [gravarRamal, setGravarRamal] = useState(true)
  const [toast, setToast] = useState<string | null>(null)
  const sipAddress = 'sip:2201@youagent.telnyx.com'

  function copiarSip() {
    navigator.clipboard.writeText(sipAddress).catch(() => undefined)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  function ligarParaMembro(nome: string) {
    setToast(`Iniciando chamada para ${nome}...`)
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-gray-900 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg animate-fade-in">
          📡 {toast}
        </div>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Ramal ativo', value: 'SIP/2201',  color: 'text-brand-600',   bg: 'bg-brand-50',   border: 'border-brand-200' },
          { label: 'Status',      value: '🟢 Online',  color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
          { label: 'Latência',    value: '42ms',        color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
        ].map(k => (
          <div key={k.label} className={clsx('rounded-xl border p-4 flex items-center gap-4', k.bg, k.border)}>
            <div>
              <div className={clsx('text-xl font-bold font-mono', k.color)}>{k.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[380px_1fr] gap-6">
        {/* Card principal SIP */}
        <div className="flex flex-col gap-4">
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Meu ramal SIP</h3>
            <div className="flex flex-col gap-4">
              {/* SIP address */}
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">Número SIP</label>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                    <Radio size={13} className="text-gray-400 flex-shrink-0"/>
                    <span className="text-xs font-mono text-gray-700 flex-1">{sipAddress}</span>
                  </div>
                  <button
                    onClick={copiarSip}
                    className={clsx('text-xs font-semibold px-3 py-2 rounded-lg border transition-colors', copiado ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50')}
                  >
                    {copiado ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>
                <span className="text-emerald-700 font-semibold">Registrado — Telnyx</span>
              </div>

              {/* Toggles */}
              <div className="flex flex-col gap-3 pt-2 border-t border-gray-100">
                {[
                  { label: 'Atender chamadas via ramal', value: atenderRamal, set: setAtenderRamal },
                  { label: 'Gravar chamadas do ramal',   value: gravarRamal,  set: setGravarRamal  },
                ].map(t => (
                  <div key={t.label} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{t.label}</span>
                    <button
                      onClick={() => t.set(!t.value)}
                      className={clsx('w-10 h-5 rounded-full transition-colors relative flex-shrink-0', t.value ? 'bg-brand-600' : 'bg-gray-300')}
                    >
                      <span className={clsx('absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform', t.value ? 'translate-x-5' : 'translate-x-0.5')}/>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chamadas recentes */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Chamadas recentes via ramal</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {CHAMADAS_RAMAL.map((c, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <div className={clsx('w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0', c.direcao === 'entrada' ? 'bg-emerald-50' : 'bg-brand-50')}>
                    <ArrowUpDown size={12} className={c.direcao === 'entrada' ? 'text-emerald-600' : 'text-brand-600'}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-900 truncate">{c.nomeOuNumero}</div>
                    <div className="text-2xs text-gray-400">{c.dataHora}</div>
                  </div>
                  <div className="text-xs font-mono text-gray-500 flex-shrink-0">{c.duracao}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Diretório da equipe */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Diretório da equipe</h3>
            <p className="text-xs text-gray-500 mt-0.5">Clique em "Ligar" para iniciar uma chamada interna</p>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Nome', 'Cargo', 'Ramal', 'Status', ''].map(h => (
                  <th key={h} className="text-left text-2xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-2.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {EQUIPE_RAMAL.map(m => (
                <tr key={m.ramal} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {m.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{m.nome}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{m.cargo}</td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-600">{m.ramal}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className={clsx('w-2 h-2 rounded-full flex-shrink-0',
                        m.status === 'disponivel' ? 'bg-emerald-500' :
                        m.status === 'em_chamada' ? 'bg-amber-500 animate-pulse' :
                        'bg-gray-400'
                      )}/>
                      <span className="text-2xs text-gray-600">
                        {m.status === 'disponivel' ? '🟢 Disponível' : m.status === 'em_chamada' ? '🟡 Em chamada' : '⚫ Offline'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {m.status !== 'offline' && (
                      <button
                        onClick={() => ligarParaMembro(m.nome)}
                        className="flex items-center gap-1.5 text-2xs font-semibold px-2.5 py-1.5 rounded-lg bg-brand-50 border border-brand-200 text-brand-600 hover:bg-brand-100 transition-colors"
                      >
                        <PhoneCall size={11}/> Ligar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── ABA REATIVAÇÃO ──────────────────────────────────────────────────────────

interface LeadReativacao {
  id: string
  nome: string
  empresa: string
  ultimoContato: string
  tentativas: number
  motivo: 'nao_atendeu' | 'sem_interesse' | 'retornar' | 'tempo_expirado'
  campanha: string
}

const MOTIVO_LABEL: Record<LeadReativacao['motivo'], string> = {
  nao_atendeu:     'Não atendeu',
  sem_interesse:   'Sem interesse',
  retornar:        'Retornar',
  tempo_expirado:  'Tempo expirado',
}

const MOTIVO_CLS: Record<LeadReativacao['motivo'], string> = {
  nao_atendeu:    'badge-amber',
  sem_interesse:  'badge-danger',
  retornar:       'badge-brand',
  tempo_expirado: 'badge-neutral',
}


function TabReativacao() {
  const [selecionados, setSelecionados] = useState<string[]>([])
  const [filtroMotivo, setFiltroMotivo] = useState('todos')
  const [reativados, setReativados] = useState<Set<string>>(new Set())
  const [arquivados, setArquivados] = useState<Set<string>>(new Set())
  const [_reativandoIds, setReativandoIds] = useState<Set<string>>(new Set())

  // Busca contatos esgotados e sem resposta da API
  const { data: esgotadosRaw = [], refetch } = useQuery({
    queryKey: ['contatos-reativacao'],
    queryFn: async () => {
      const [r1, r2] = await Promise.all([
        contatosApi.byStatus('esgotado', 200),
        contatosApi.byStatus('nao_atendeu', 200),
      ])
      const d1 = (r1.data as any)?.data ?? r1.data ?? []
      const d2 = (r2.data as any)?.data ?? r2.data ?? []
      return [...d1, ...d2]
    },
  })

  const motivoMap: Record<string, LeadReativacao['motivo']> = {
    esgotado: 'nao_atendeu',
    nao_atendeu: 'nao_atendeu',
  }

  const leadsApi: LeadReativacao[] = (esgotadosRaw as any[]).map((c: any) => ({
    id: String(c.id),
    nome: c.nome ?? '—',
    empresa: c.razao_social ?? c.empresa ?? '—',
    ultimoContato: c.atualizado_em ? new Date(c.atualizado_em).toLocaleDateString('pt-BR') : c.criado_em ? new Date(c.criado_em).toLocaleDateString('pt-BR') : '—',
    tentativas: c.tentativas ?? 0,
    motivo: (motivoMap[c.status] ?? 'nao_atendeu') as LeadReativacao['motivo'],
    campanha: c.campanha_id ?? '',
  }))

  const leadsVisiveis = leadsApi.filter(l => {
    if (arquivados.has(l.id)) return false
    if (reativados.has(l.id)) return false
    if (filtroMotivo !== 'todos' && l.motivo !== filtroMotivo) return false
    return true
  })

  function toggleSel(id: string) {
    setSelecionados(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }
  function toggleAll(checked: boolean) {
    setSelecionados(checked ? leadsVisiveis.map(l => l.id) : [])
  }
  async function reativarLead(id: string) {
    setReativandoIds(prev => new Set([...prev, id]))
    try {
      // Volta status para 'novo' para entrar na fila novamente
      await fetch(`/api/v1/contatos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ status: 'novo', tentativas: 0 }),
      })
      setReativados(prev => new Set([...prev, id]))
      refetch()
    } catch (_) {
      setReativados(prev => new Set([...prev, id]))
    } finally {
      setReativandoIds(prev => { const n = new Set(prev); n.delete(id); return n })
    }
  }
  async function arquivarLead(id: string) {
    try {
      await fetch(`/api/v1/contatos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ status: 'arquivado' }),
      })
    } catch (_) {}
    setArquivados(prev => new Set([...prev, id]))
    setSelecionados(prev => prev.filter(x => x !== id))
  }
  function reativarSelecionados() {
    selecionados.forEach(id => reativarLead(id))
    setSelecionados([])
  }
  function arquivarSelecionados() {
    selecionados.forEach(id => arquivarLead(id))
    setSelecionados([])
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Descrição */}
      <p className="text-sm text-gray-500">
        Reprocesse leads que não atenderam ou que precisam de nova abordagem.
      </p>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Leads disponíveis',   value: String(leadsVisiveis.length),                color: 'text-gray-900'    },
          { label: 'Reativados agora',    value: String(reativados.size),                    color: 'text-brand-600'   },
          { label: 'Arquivados',          value: String(arquivados.size),                    color: 'text-gray-400'    },
          { label: 'Total no banco',      value: String(esgotadosRaw.length),               color: 'text-purple-600'  },
        ].map(k => (
          <div key={k.label} className="kpi-card">
            <span className={clsx('text-2xl font-bold font-mono', k.color)}>{k.value}</span>
            <span className="text-xs text-gray-500">{k.label}</span>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          className="input py-1.5 text-xs"
          value={filtroMotivo}
          onChange={e => setFiltroMotivo(e.target.value)}
        >
          <option value="todos">Todos os motivos</option>
          <option value="nao_atendeu">Não atendeu</option>
          <option value="sem_interesse">Sem interesse</option>
          <option value="retornar">Retornar</option>
          <option value="tempo_expirado">Tempo expirado</option>
        </select>



        <button className="btn-primary text-xs py-1.5 gap-1.5">
          <Filter size={12}/> Filtrar
        </button>
      </div>

      {/* Barra de ação em lote */}
      {selecionados.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-brand-50 border border-brand-200 rounded-xl">
          <span className="text-xs font-bold text-brand-600">{selecionados.length} leads selecionados</span>
          <div className="w-px h-4 bg-brand-300"/>
          <button
            onClick={reativarSelecionados}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors"
          >
            <RefreshCw size={12}/> Reativar selecionados
          </button>
          <button
            onClick={arquivarSelecionados}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-300 text-red-600 bg-white hover:bg-red-50 transition-colors"
          >
            <Archive size={12}/> Arquivar selecionados
          </button>
          <button onClick={() => setSelecionados([])} className="ml-auto text-gray-400 hover:text-gray-600">
            <X size={14}/>
          </button>
        </div>
      )}

      {/* Tabela */}
      <div className="card overflow-hidden">
        <div className="grid grid-cols-[28px_2fr_1fr_80px_1fr_1fr_120px] px-4 py-2.5 bg-gray-50 border-b border-gray-100 items-center">
          <input
            type="checkbox"
            className="w-3.5 h-3.5 accent-indigo-500"
            checked={selecionados.length === leadsVisiveis.length && leadsVisiveis.length > 0}
            onChange={e => toggleAll(e.target.checked)}
          />
          {['Lead', 'Último contato', 'Tentativas', 'Motivo', 'Campanha original', 'Ações'].map(h => (
            <span key={h} className="text-2xs font-semibold text-gray-400 uppercase tracking-wide">{h}</span>
          ))}
        </div>

        {leadsVisiveis.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <RefreshCw size={24} className="text-gray-300 mb-3"/>
            <p className="text-sm text-gray-500">Nenhum lead corresponde aos filtros aplicados.</p>
          </div>
        )}

        {leadsVisiveis.map((lead, i) => (
          <div
            key={lead.id}
            className={clsx(
              'grid grid-cols-[28px_2fr_1fr_80px_1fr_1fr_120px] px-4 py-3 border-b border-gray-100 items-center',
              i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40',
              reativados.has(lead.id) && 'opacity-50'
            )}
          >
            <div>
              <input
                type="checkbox"
                className="w-3.5 h-3.5 accent-indigo-500"
                checked={selecionados.includes(lead.id)}
                onChange={() => toggleSel(lead.id)}
                disabled={reativados.has(lead.id)}
              />
            </div>

            <div>
              <div className="text-sm font-medium text-gray-900">{lead.nome}</div>
              <div className="text-xs text-gray-500">{lead.empresa}</div>
            </div>

            <div className="text-xs text-gray-600 font-mono">{lead.ultimoContato}</div>

            <div className="text-xs font-semibold text-gray-700 font-mono">{lead.tentativas}x</div>

            <div>
              <span className={clsx('badge text-2xs', MOTIVO_CLS[lead.motivo])}>
                {MOTIVO_LABEL[lead.motivo]}
              </span>
            </div>

            <div className="text-xs text-gray-600">{lead.campanha}</div>

            <div className="flex items-center gap-1.5">
              {reativados.has(lead.id) ? (
                <span className="text-2xs font-semibold text-emerald-600">✓ Reativado</span>
              ) : (
                <>
                  <button
                    onClick={() => reativarLead(lead.id)}
                    className="flex items-center gap-1 text-2xs font-semibold px-2 py-1.5 rounded-lg bg-brand-50 border border-brand-200 text-brand-600 hover:bg-brand-100 transition-colors"
                  >
                    <RefreshCw size={10}/> Reativar
                  </button>
                  <button
                    onClick={() => arquivarLead(lead.id)}
                    className="flex items-center gap-1 text-2xs font-semibold px-2 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <Archive size={10}/>
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── TABS CONFIG ──────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
  { id:'fila',      label:'Fila de Chamadas', icon:<PhoneCall size={13}/> },
  { id:'agendados', label:'Agendados',         icon:<Calendar size={13}/> },
  { id:'gravacoes', label:'Gravações',         icon:<Mic size={13}/> },
  { id:'manual',    label:'Chamada Manual',    icon:<Phone size={13}/> },
  { id:'agenda',    label:'Minha Agenda',      icon:<Calendar size={13}/> },
  { id:'aovivo',    label:'Ao Vivo',           icon:<Radio size={13}/> },
  { id:'historico', label:'Histórico',         icon:<History size={13}/>, badge:3 },
  { id:'ramal',      label:'Ramal',      icon:<Antenna size={13}/> },
  { id:'reativacao', label:'Reativação', icon:<RefreshCw size={13}/> },
]

// ─── PÁGINA PRINCIPAL ─────────────────────────────────────────────────────────

export default function DiscadoraPage() {
  const [activeTab, setActiveTab] = useState<Tab>('fila')

  return (
    <div className="p-6 max-w-[1400px] mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Discadora</h1>
          <p className="text-sm text-gray-500 mt-1">Monitore ligações, gerencie a fila e acompanhe agendamentos em tempo real.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/>
            <span className="text-xs font-medium text-emerald-700">Motor ativo · 4 agentes</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0 border-b border-gray-200 mb-6 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-all -mb-px',
              activeTab === tab.id ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.badge !== undefined && (
              <span className={clsx('text-2xs px-1.5 py-0.5 rounded-full font-bold', activeTab === tab.id ? 'bg-brand-100 text-brand-600' : 'bg-gray-200 text-gray-500')}>{tab.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      {activeTab === 'fila'      && <TabFila />}
      {activeTab === 'agendados' && <TabAgendados />}
      {activeTab === 'gravacoes' && <TabGravacoes />}
      {activeTab === 'manual'    && <TabManual />}
      {activeTab === 'agenda'    && <TabAgenda />}
      {activeTab === 'aovivo'    && <TabAoVivo onGoFila={() => setActiveTab('fila')} />}
      {activeTab === 'historico' && <TabHistorico />}
      {activeTab === 'ramal'      && <TabRamal />}
      {activeTab === 'reativacao' && <TabReativacao />}
    </div>
  )
}
