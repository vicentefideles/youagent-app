import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { campanhasApi, reunioesApi, claudeApi } from '@/services/api'
import {
  PhoneCall, Calendar, Mic, Phone, Radio, History, Antenna,
  Activity, Brain, Search, Download, Filter,
  User, Building2, MapPin, MessageSquare, X,
  Play, Pause, CheckCircle2, XCircle, RotateCcw, Megaphone,
  AlertTriangle, Volume2, Video,
  RefreshCw, Archive, ArrowUpDown, Upload, ChevronDown,
  Copy, PhoneForwarded, FileText, Shield, Zap
} from 'lucide-react'
import clsx from 'clsx'

// ─── TIPOS ──────────────────────────────────────────────────────────────────

type Tab = 'fila' | 'campanhas' | 'agendados' | 'gravacoes' | 'manual' | 'agenda' | 'aovivo' | 'historico' | 'ramal' | 'reativacao'

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

interface TranscriptLine {
  quem: 'Agente' | 'Cliente'
  texto: string
  cor: string
}

interface Vendedor {
  nome: string
  status: 'disponivel' | 'em_chamada' | 'ausente'
  reunioes_hoje: number
}

interface LeadUploadPreview {
  nome: string
  empresa: string
  segmento: string
  porte: string
  uf: string
}

// ─── MOCK DATA ───────────────────────────────────────────────────────────────

const FILA: EntradaFila[] = [
  { id:'1', empresa:'Grupo Comercial ABC', contato:'Marcos Silva', cargo:'Dir. Comercial', telefone:'(11) 98765-4321', agente:'Ana', campanha:'SP — Campanha Maio', segmento:'Indústria e Tech', status:'em_ligacao', icp:94, potencial:87, tentativa:1, maxTentativas:3, duracao:'1m38s', snippet:'"...preciso de uma solução pra mês que vem..."', gatilhoDetectado:'Urgência + pedido de preço', transferindo:true },
  { id:'2', empresa:'Distribuidora XYZ', contato:'Patricia Ramos', cargo:'Gerente', telefone:'(11) 97654-3210', agente:'Carlos', campanha:'SP — Campanha Maio', segmento:'Distribuição', status:'em_ligacao', icp:71, potencial:61, tentativa:1, maxTentativas:3, duracao:'0m52s', snippet:'"...disponível hoje à tarde..."', gatilhoDetectado:'Disponibilidade hoje detectada' },
  { id:'3', empresa:'Construtora Primavera', contato:'Renata Costa', cargo:'Sócia-Diretora', telefone:'(21) 99876-5432', agente:'Julia', campanha:'RJ — Campanha Maio', segmento:'Construção', status:'em_ligacao', icp:78, potencial:65, tentativa:1, maxTentativas:3, duracao:'2m17s', snippet:'"...precisamos de uma solução..."', gatilhoDetectado:'Decisora identificada' },
  { id:'4', empresa:'TechSolutions LTDA', contato:'Bruno Almeida', cargo:'CTO', telefone:'(51) 98765-4321', agente:'Rafael', campanha:'RS — Campanha Maio', segmento:'SaaS / Tech', status:'em_ligacao', icp:85, potencial:79, tentativa:1, maxTentativas:3, duracao:'1m14s', snippet:'"...quero ver uma demo do sistema..."', gatilhoDetectado:'Demo + técnico', transferindo:true },
  { id:'5', empresa:'FarmaCenter', contato:'Luciana Pinto', cargo:'Diretora', telefone:'(41) 97777-1234', agente:'Marcos', campanha:'PR — Campanha Maio', segmento:'Saúde / Farma', status:'na_fila', icp:62, potencial:0, tentativa:1, maxTentativas:3 },
  { id:'6', empresa:'Supermercados Norte', contato:'Ana Costa', cargo:'CEO', telefone:'(92) 98800-1122', agente:'Ana', campanha:'AM — Campanha Maio', segmento:'Varejo', status:'agendado', icp:91, potencial:0, tentativa:1, maxTentativas:3 },
]

const AGENDAMENTOS: Agendamento[] = [
  { id:'a1', empresa:'Grupo Comercial ABC', contato:'Marcos Silva', cargo:'Diretor Comercial', telefone:'(11) 98765-4321', email:'marcos@grupoabc.com.br', modalidade:'online', cidade:'São Paulo', cnpj:'12.345.678/0001-90', segmento:'Comércio / Varejo', resumoLigacao:'Cliente demonstrou interesse em reduzir custo de SDRs. Mencionou que tem equipe de 5 vendedores. Aceitou a reunião para conhecer o modelo de IA.', agente:'Ana', duracaoLigacao:'2m34s', dataHora:'14/05 · 14h00', meetLink:'meet.google.com/abc-123', vendedor:'João Silva', vendedorIniciais:'JS', status:'confirmado', noShowRisk:18, campanha:'SP — Campanha Maio' },
  { id:'a2', empresa:'Indústria Delta', contato:'Roberto Alves', cargo:'Gerente Geral', telefone:'(31) 97654-3210', email:'roberto@deltaindustria.com.br', modalidade:'presencial', cidade:'Belo Horizonte', segmento:'Manufatura', resumoLigacao:'Empresa com 120 funcionários procurando escalar o time comercial sem aumentar headcount. Muito receptivo à proposta.', agente:'Carlos', duracaoLigacao:'3m12s', dataHora:'16/05 · 10h00', vendedor:'Carlos Vidal', vendedorIniciais:'CV', status:'confirmado', noShowRisk:32, campanha:'GO — Campanha Maio' },
  { id:'a3', empresa:'Tech Nova Sistemas', contato:'Carla Mendes', cargo:'Gestora Comercial', telefone:'(11) 96543-2109', email:'carla@technova.com.br', modalidade:'online', cidade:'São Paulo', segmento:'SaaS / Tech', resumoLigacao:'Interesse imediato em substituir o processo manual de prospecção. Solicitou demo completa da plataforma.', agente:'Ana', duracaoLigacao:'1m45s', dataHora:'15/05 · 09h30', meetLink:'meet.google.com/xyz-456', vendedor:'Maria Rodrigues', vendedorIniciais:'MR', status:'pendente', noShowRisk:24, campanha:'SP — Campanha Maio' },
]

const GRAVACOES = [
  { id:'g1', empresa:'Supermercados Norte', contato:'Ana Costa', agente:'Ana', campanha:'SP — Campanha Maio', duracao:'1m52s', data:'05/05 · 09:41', resultado:'agendou' as const, icp:91 },
  { id:'g2', empresa:'Grupo ABC', contato:'Marcos Silva', agente:'Ana', campanha:'SP — Campanha Maio', duracao:'2m44s', data:'05/05 · 09:28', resultado:'agendou' as const, icp:94 },
  { id:'g3', empresa:'Indústria Delta', contato:'Roberto Alves', agente:'Carlos', campanha:'GO — Campanha Maio', duracao:'0m48s', data:'05/05 · 08:55', resultado:'retornar' as const, icp:78 },
  { id:'g4', empresa:'Construtora Omega', contato:'Lucas Pereira', agente:'Julia', campanha:'RJ — Campanha Maio', duracao:'0m22s', data:'05/05 · 08:40', resultado:'nao_atendeu' as const, icp:55 },
]

const CAMPANHAS_DISC = [
  { id:'sp', nome:'SP — Campanha Maio', cor:'brand', total:1250, feitas:487, faltam:451, conv:'8.2%', agendados:40, fila:312, consumo:64, alerta:null, status:'ativa', agr:'Média' },
  { id:'mg', nome:'MG — Campanha Maio', cor:'purple', total:1000, feitas:298, faltam:160, conv:'5.4%', agendados:16, fila:188, consumo:84, alerta:'Lista quase esgotada — prepare uma nova! Estimativa: 2 dias', status:'ativa', agr:'Alta' },
  { id:'go', nome:'GO — Campanha Maio', cor:'emerald', total:920, feitas:156, faltam:544, conv:'9.1%', agendados:14, fila:220, consumo:41, alerta:null, status:'pausada', agr:'Baixa' },
]

const TRANSCRICOES: Record<string, TranscriptLine[]> = {
  '1': [
    { quem: 'Agente', cor: 'text-blue-400', texto: 'Bom dia! Aqui é a Ana da ETZ. Posso falar com Marcos Silva?' },
    { quem: 'Cliente', cor: 'text-emerald-400', texto: 'Sim, sou eu. O que é?' },
    { quem: 'Agente', cor: 'text-blue-400', texto: 'Marcos, somos especialistas em agentes de IA para prospecção comercial. Vocês têm interesse em reduzir o custo de SDRs?' },
    { quem: 'Cliente', cor: 'text-emerald-400', texto: 'Interessante... preciso de uma solução pra mês que vem. Quanto custa?' },
    { quem: 'Agente', cor: 'text-blue-400', texto: 'Ótimo! Posso agendar uma demonstração para esta semana?' },
  ],
  '2': [
    { quem: 'Agente', cor: 'text-blue-400', texto: 'Boa tarde, posso falar com Patricia Ramos?' },
    { quem: 'Cliente', cor: 'text-emerald-400', texto: 'Falando. Mas estou com pouco tempo.' },
    { quem: 'Agente', cor: 'text-blue-400', texto: 'Será rápido! Você tem disponibilidade hoje à tarde para uma demo de 20 minutos?' },
    { quem: 'Cliente', cor: 'text-emerald-400', texto: 'Disponível hoje à tarde, sim. Me envia o convite.' },
  ],
  '3': [
    { quem: 'Agente', cor: 'text-blue-400', texto: 'Bom dia, Renata! Aqui é a Julia.' },
    { quem: 'Cliente', cor: 'text-emerald-400', texto: 'Oi Julia.' },
    { quem: 'Agente', cor: 'text-blue-400', texto: 'Você é a decisora para compras de tecnologia na Construtora Primavera?' },
    { quem: 'Cliente', cor: 'text-emerald-400', texto: 'Sou sócia-diretora, então sim. Mas precisamos de uma solução urgente.' },
  ],
  '4': [
    { quem: 'Agente', cor: 'text-blue-400', texto: 'Bruno, tudo bem? Aqui é o Rafael da ETZ.' },
    { quem: 'Cliente', cor: 'text-emerald-400', texto: 'Oi Rafael. Pode falar.' },
    { quem: 'Agente', cor: 'text-blue-400', texto: 'Nossa IA faz prospecção automática B2B. Você gostaria de ver uma demo do sistema funcionando?' },
    { quem: 'Cliente', cor: 'text-emerald-400', texto: 'Quero ver uma demo do sistema, sim. Quando pode?' },
  ],
}

const TRANSFER_CANDIDATES: Vendedor[] = [
  { nome: 'Ana Rodrigues', status: 'disponivel', reunioes_hoje: 3 },
  { nome: 'João Silva', status: 'disponivel', reunioes_hoje: 2 },
  { nome: 'Carlos Vidal', status: 'em_chamada', reunioes_hoje: 4 },
  { nome: 'Maria Rodrigues', status: 'ausente', reunioes_hoje: 1 },
]

const LEADS_UPLOAD_PREVIEW: LeadUploadPreview[] = [
  { nome: 'Marcos Ferreira', empresa: 'Grupo Delta', segmento: 'Indústria', porte: 'Médio', uf: 'SP' },
  { nome: 'Carla Neves', empresa: 'Tech Innovations', segmento: 'SaaS', porte: 'Pequeno', uf: 'RJ' },
  { nome: 'Roberto Souza', empresa: 'Construtora Sul', segmento: 'Construção', porte: 'Grande', uf: 'RS' },
  { nome: 'Patricia Lima', empresa: 'FarmaNet', segmento: 'Saúde', porte: 'Médio', uf: 'MG' },
  { nome: 'André Costa', empresa: 'LogisBrasil', segmento: 'Logística', porte: 'Grande', uf: 'SP' },
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
    const ativas = FILA.filter(l => l.status === 'em_ligacao')
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

  const ativas = FILA.filter(l => l.status === 'em_ligacao').length

  function toggleSel(id: string) {
    setSelecionados(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }
  function toggleAll(checked: boolean) {
    setSelecionados(checked ? FILA.map(f => f.id) : [])
  }
  function injetarScript(id: string) {
    setScriptFeedback(prev => ({ ...prev, [id]: '✓ Frase enviada ao agente' }))
    setTimeout(() => setScriptFeedback(prev => ({ ...prev, [id]: '' })), 2500)
    setScriptInput(prev => ({ ...prev, [id]: '' }))
  }
  function confirmarSlot(id: string, slot: string) {
    setSlotConfirmado(prev => ({ ...prev, [id]: slot }))
  }
  function toggleTranscricao(id: string) {
    setTranscricaoAberta(prev => ({ ...prev, [id]: !prev[id] }))
  }
  function iniciarTransferencia(agentId: string, vendedor: string) {
    setTransferidoPara(prev => ({ ...prev, [agentId]: vendedor }))
  }

  const SLOTS = ['14:00', '15:00', '15:30', '16:00']

  return (
    <div className="flex flex-col gap-4">
      {/* KPIs */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label:'Em ligação agora', value: ativas, color:'text-emerald-600' },
          { label:'Na fila', value:384, color:'text-gray-900' },
          { label:'Retornar contato', value:67, color:'text-amber-600' },
          { label:'Ligações hoje', value:24, color:'text-brand-600' },
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
            <select className="input py-1.5 text-xs"><option>Todas as campanhas</option></select>
            <select className="input py-1.5 text-xs"><option>Todos os agentes</option></select>
            <select className="input py-1.5 text-xs">
              <option>Todos os status</option><option>Em ligação</option><option>Na fila</option><option>Retornar</option><option>Agendado</option>
            </select>
            <button className="btn-primary text-xs py-1.5 gap-1.5"><Megaphone size={12}/> + Nova campanha</button>
          </div>
        </div>

        {/* Barra de ações em lote */}
        {selecionados.length > 0 && (
          <div className="flex items-center gap-3 px-4 py-2.5 bg-brand-50 border-b border-brand-200">
            <span className="text-xs font-bold text-brand-600">{selecionados.length} selecionado(s)</span>
            <div className="w-px h-4 bg-brand-300" />
            {[
              { label:'⏸ Pausar todos', cls:'border-brand-300 text-brand-700' },
              { label:'▶ Retomar todos', cls:'border-emerald-300 text-emerald-700' },
              { label:'⬆ Priorizar', cls:'border-amber-300 text-amber-700' },
            ].map(b => (
              <button key={b.label} className={clsx('text-xs font-semibold px-3 py-1.5 rounded-lg border bg-white transition-colors hover:opacity-80', b.cls)}>{b.label}</button>
            ))}
            <button className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 bg-white">📋 Mover campanha</button>
            <button onClick={() => setSelecionados([])} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 text-red-600 bg-white hover:bg-red-50 transition-colors">Cancelar</button>
            <button onClick={() => setSelecionados([])} className="ml-auto text-xs text-gray-400 hover:text-gray-600"><X size={14}/></button>
          </div>
        )}

        {/* Colunas */}
        <div className="grid grid-cols-[28px_2fr_1fr_1fr_1.4fr_90px] px-4 py-2 bg-gray-50 border-b border-gray-100">
          <input type="checkbox" className="w-3.5 h-3.5 accent-indigo-500" onChange={e => toggleAll(e.target.checked)} checked={selecionados.length === FILA.length} />
          {['Empresa / Contato','Agente · Campanha','Status','Inteligência em tempo real','Ações'].map(h => (
            <span key={h} className="text-2xs font-semibold text-gray-400 uppercase tracking-wide">{h}</span>
          ))}
        </div>

        {/* Linhas */}
        {FILA.map(item => (
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
                      <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto">
                        {(TRANSCRICOES[item.id] ?? []).map((l, i) => (
                          <div key={i} className="flex gap-2">
                            <span className={clsx('text-2xs font-bold flex-shrink-0 w-14', l.cor)}>{l.quem}:</span>
                            <span className="text-2xs text-gray-300 leading-relaxed">{l.texto}</span>
                          </div>
                        ))}
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
                      {TRANSFER_CANDIDATES.map(v => (
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
                              onClick={() => iniciarTransferencia(item.id, v.nome)}
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

// ─── MODAL CONFIG IA ─────────────────────────────────────────────────────────

interface ConfigIAModal {
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

function ModalConfigIA({ modal, onClose }: { modal: ConfigIAModal; onClose: () => void }) {
  const [cfg, setCfg] = useState<ConfigIAState>({
    icpMin: 65,
    sensibilidade: 70,
    maxTentativas: 3,
    gatilhos: {
      urgencia: true,
      preco: true,
      proposta: true,
      decisor: true,
      interesse: true,
      demo: false,
      concorrente: false,
    },
    aguardarConfirmacao: true,
    gravarLigacoes: true,
    notificarGerente: true,
    tom: 'Consultivo',
    horarioInicio: '09:00',
    horarioFim: '18:00',
    pausarFds: true,
  })

  const gatilhoLabels: Record<string, string> = {
    urgencia: '🔴 Urgência — "urgente", "prazo", "preciso logo"',
    preco: '💰 Preço — "quanto custa", "valor", "investimento"',
    proposta: '📄 Proposta — "pode mandar", "me envia", "proposta"',
    decisor: '👤 Decisor — "meu sócio", "diretoria", "preciso consultar"',
    interesse: '⭐ Interesse — "quero saber mais", "me conta", "interessante"',
    demo: '🎥 Demo — "ver funcionando", "demonstração", "ver na prática"',
    concorrente: '⚔️ Concorrente — "já tenho", "já uso", "vocês vs"',
  }

  function toggle(field: keyof Omit<ConfigIAState, 'icpMin' | 'sensibilidade' | 'maxTentativas' | 'gatilhos' | 'tom' | 'horarioInicio' | 'horarioFim'>) {
    setCfg(prev => ({ ...prev, [field]: !prev[field] }))
  }

  function toggleGatilho(key: string) {
    setCfg(prev => ({ ...prev, gatilhos: { ...prev.gatilhos, [key]: !prev.gatilhos[key] } }))
  }

  if (!modal.open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-[520px] max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Configuração de IA</h2>
            <p className="text-xs text-gray-400 mt-0.5">{modal.campanhaName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          {/* Section 1: Thresholds */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Thresholds</h3>
            <div className="flex flex-col gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm text-gray-700">ICP mínimo para transferir</label>
                  <span className="text-sm font-bold text-brand-600 font-mono w-8 text-right">{cfg.icpMin}</span>
                </div>
                <input
                  type="range" min={0} max={100}
                  value={cfg.icpMin}
                  onChange={e => setCfg(prev => ({ ...prev, icpMin: Number(e.target.value) }))}
                  className="w-full accent-indigo-600"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm text-gray-700">Sensibilidade de gatilhos</label>
                  <span className="text-sm font-bold text-brand-600 font-mono w-8 text-right">{cfg.sensibilidade}</span>
                </div>
                <input
                  type="range" min={0} max={100}
                  value={cfg.sensibilidade}
                  onChange={e => setCfg(prev => ({ ...prev, sensibilidade: Number(e.target.value) }))}
                  className="w-full accent-indigo-600"
                />
              </div>
              <div>
                <label className="text-sm text-gray-700 block mb-1.5">Máximo de tentativas por lead</label>
                <select
                  value={cfg.maxTentativas}
                  onChange={e => setCfg(prev => ({ ...prev, maxTentativas: Number(e.target.value) }))}
                  className="input"
                >
                  {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Gatilhos */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Gatilhos Ativos</h3>
            <div className="flex flex-col gap-2">
              {Object.entries(gatilhoLabels).map(([key, label]) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={cfg.gatilhos[key] ?? false}
                    onChange={() => toggleGatilho(key)}
                    className="w-4 h-4 accent-indigo-600 rounded"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Section 3: Comportamento */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Comportamento</h3>
            <div className="flex flex-col gap-3">
              {([
                ['aguardarConfirmacao', 'Aguardar confirmação antes de transferir'],
                ['gravarLigacoes', 'Gravar todas as ligações'],
                ['notificarGerente', 'Notificar gerente em cada transferência'],
              ] as const).map(([field, label]) => (
                <div key={field} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{label}</span>
                  <button
                    onClick={() => toggle(field)}
                    className={clsx(
                      'w-10 h-5 rounded-full transition-colors relative',
                      cfg[field] ? 'bg-brand-600' : 'bg-gray-300'
                    )}
                  >
                    <span className={clsx(
                      'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
                      cfg[field] ? 'translate-x-5' : 'translate-x-0.5'
                    )} />
                  </button>
                </div>
              ))}
              <div>
                <label className="text-sm text-gray-700 block mb-1.5">Tom do agente</label>
                <select
                  value={cfg.tom}
                  onChange={e => setCfg(prev => ({ ...prev, tom: e.target.value }))}
                  className="input"
                >
                  <option>Formal</option>
                  <option>Consultivo</option>
                  <option>Descontraído</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Horários */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Horários</h3>
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-700 block mb-1.5">Início</label>
                  <input
                    type="time"
                    value={cfg.horarioInicio}
                    onChange={e => setCfg(prev => ({ ...prev, horarioInicio: e.target.value }))}
                    className="input"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-700 block mb-1.5">Fim</label>
                  <input
                    type="time"
                    value={cfg.horarioFim}
                    onChange={e => setCfg(prev => ({ ...prev, horarioFim: e.target.value }))}
                    className="input"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Pausar aos finais de semana</span>
                <button
                  onClick={() => toggle('pausarFds')}
                  className={clsx(
                    'w-10 h-5 rounded-full transition-colors relative',
                    cfg.pausarFds ? 'bg-brand-600' : 'bg-gray-300'
                  )}
                >
                  <span className={clsx(
                    'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
                    cfg.pausarFds ? 'translate-x-5' : 'translate-x-0.5'
                  )} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancelar</button>
          <button onClick={onClose} className="btn-primary flex-1 justify-center">Salvar configurações</button>
        </div>
      </div>
    </div>
  )
}

// ─── MODAL NOVA CAMPANHA ──────────────────────────────────────────────────────

type TipoCampanha = 'outbound' | 'inbound' | 'renovacao' | 'b2c' | 'nurturing'

interface NovaCampanhaState {
  nome: string
  tipo: TipoCampanha
  agente: string
  meta: string
  // outbound
  regiao: string
  agressividade: string
  // inbound
  fonteInbound: string
  // renovacao
  diasSemContato: string
  // b2c
  faixaEtaria: string
  // nurturing
  intervaloEnvio: string
  sequenciaEtapas: string
}

function ModalNovaCampanha({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [state, setState] = useState<NovaCampanhaState>({
    nome: '', tipo: 'outbound', agente: '', meta: '',
    regiao: '', agressividade: 'media',
    fonteInbound: '', diasSemContato: '30',
    faixaEtaria: '', intervaloEnvio: '24', sequenciaEtapas: '3',
  })

  if (!open) return null

  const tipoOpts: { value: TipoCampanha; label: string; desc: string }[] = [
    { value: 'outbound',  label: 'Outbound',   desc: 'Discagem ativa para lista de leads' },
    { value: 'inbound',   label: 'Inbound',    desc: 'Leads que entraram por formulário/anúncio' },
    { value: 'renovacao', label: 'Renovação',  desc: 'Reabordagem de clientes inativos' },
    { value: 'b2c',       label: 'B2C',        desc: 'Abordagem direta pessoa física' },
    { value: 'nurturing', label: 'Nurturing',  desc: 'Sequência educativa multi-toque' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[540px] max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Nova campanha</h2>
            <p className="text-xs text-gray-400 mt-0.5">Configure o tipo e os parâmetros da campanha</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18}/></button>
        </div>

        <div className="p-6 flex flex-col gap-5">
          {/* Nome */}
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1.5">Nome da campanha</label>
            <input className="input" placeholder="Ex: SP — Campanha Junho" value={state.nome} onChange={e => setState(s => ({ ...s, nome: e.target.value }))} />
          </div>

          {/* Tipo */}
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-2">Tipo de campanha</label>
            <div className="grid grid-cols-1 gap-2">
              {tipoOpts.map(opt => (
                <label key={opt.value} className={clsx('flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors', state.tipo === opt.value ? 'border-brand-400 bg-brand-50' : 'border-gray-200 hover:border-gray-300')}>
                  <input type="radio" name="tipo" value={opt.value} checked={state.tipo === opt.value} onChange={() => setState(s => ({ ...s, tipo: opt.value }))} className="mt-0.5 accent-indigo-600" />
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{opt.label}</div>
                    <div className="text-2xs text-gray-500">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Campos comuns */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1.5">Agente responsável</label>
              <select className="input" value={state.agente} onChange={e => setState(s => ({ ...s, agente: e.target.value }))}>
                <option value="">Selecionar agente</option>
                <option>Ana</option><option>Carlos</option><option>Julia</option><option>Rafael</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1.5">Meta de agendamentos</label>
              <input className="input" placeholder="Ex: 50" type="number" value={state.meta} onChange={e => setState(s => ({ ...s, meta: e.target.value }))} />
            </div>
          </div>

          {/* Campos por tipo */}
          {state.tipo === 'outbound' && (
            <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200">
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1.5">Região alvo</label>
                <select className="input" value={state.regiao} onChange={e => setState(s => ({ ...s, regiao: e.target.value }))}>
                  <option value="">Selecionar estado</option>
                  <option>SP</option><option>RJ</option><option>MG</option><option>GO</option><option>RS</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1.5">Agressividade</label>
                <select className="input" value={state.agressividade} onChange={e => setState(s => ({ ...s, agressividade: e.target.value }))}>
                  <option value="baixa">Baixa</option><option value="media">Média</option><option value="alta">Alta</option>
                </select>
              </div>
            </div>
          )}

          {state.tipo === 'inbound' && (
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <label className="text-xs font-medium text-gray-700 block mb-1.5">Fonte dos leads inbound</label>
              <select className="input" value={state.fonteInbound} onChange={e => setState(s => ({ ...s, fonteInbound: e.target.value }))}>
                <option value="">Selecionar fonte</option>
                <option>Formulário do site</option><option>Meta Ads</option><option>Google Ads</option><option>LinkedIn</option><option>WhatsApp</option>
              </select>
            </div>
          )}

          {state.tipo === 'renovacao' && (
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <label className="text-xs font-medium text-gray-700 block mb-1.5">Reabordar clientes sem contato há (dias)</label>
              <input className="input" type="number" value={state.diasSemContato} onChange={e => setState(s => ({ ...s, diasSemContato: e.target.value }))} />
            </div>
          )}

          {state.tipo === 'b2c' && (
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <label className="text-xs font-medium text-gray-700 block mb-1.5">Faixa etária alvo</label>
              <select className="input" value={state.faixaEtaria} onChange={e => setState(s => ({ ...s, faixaEtaria: e.target.value }))}>
                <option value="">Qualquer faixa</option>
                <option>18–25</option><option>26–35</option><option>36–50</option><option>50+</option>
              </select>
            </div>
          )}

          {state.tipo === 'nurturing' && (
            <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200">
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1.5">Intervalo entre toques (h)</label>
                <input className="input" type="number" value={state.intervaloEnvio} onChange={e => setState(s => ({ ...s, intervaloEnvio: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1.5">Nº de etapas na sequência</label>
                <input className="input" type="number" value={state.sequenciaEtapas} onChange={e => setState(s => ({ ...s, sequenciaEtapas: e.target.value }))} />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancelar</button>
          <button onClick={onClose} className="btn-primary flex-1 justify-center">Criar campanha</button>
        </div>
      </div>
    </div>
  )
}

// ─── ABA CAMPANHAS ───────────────────────────────────────────────────────────

function TabCampanhas() {
  const { data: campanhasReais = [] } = useQuery({
    queryKey: ['campanhas'],
    queryFn: () => campanhasApi.list().then((r: any) => r.data),
  })

  const [campStatus, setCampStatus] = useState<Record<string, string>>({ sp:'ativa', mg:'ativa', go:'pausada' })
  const [configModal, setConfigModal] = useState<ConfigIAModal>({ open: false, campanhaId: null, campanhaName: '' })
  const [novaCampanhaOpen, setNovaCampanhaOpen] = useState(false)

  // LGPD toggles
  const [lgpdOptOutAuto, setLgpdOptOutAuto] = useState(true)
  const [lgpdExcluirDados, setLgpdExcluirDados] = useState(false)
  const [lgpdBloquearOptOut, setLgpdBloquearOptOut] = useState(true)

  // Upload de lista
  const [listaCarregada, setListaCarregada] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // Orquestração — campanha selecionada para visualizar
  const [orqCampanha, setOrqCampanha] = useState('sp')

  const corMap: Record<string, string> = { brand:'border-t-brand-500', purple:'border-t-purple-500', emerald:'border-t-emerald-500' }
  const consumoColor = (p: number) => p >= 80 ? 'bg-amber-500' : p >= 60 ? 'bg-brand-500' : 'bg-emerald-500'

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    setListaCarregada(true)
  }

  const orqNodes = [
    { label: 'Não Atendeu', count: 87, acao: 'Rechamar em 4h', cor: 'border-amber-400 bg-amber-50', label_cor: 'text-amber-700' },
    { label: 'Recusou', count: 23, acao: 'Enviar e-mail em 2h', cor: 'border-red-300 bg-red-50', label_cor: 'text-red-700' },
    { label: 'Agendou', count: 40, acao: 'Invite + reminder 24h', cor: 'border-emerald-400 bg-emerald-50', label_cor: 'text-emerald-700' },
    { label: 'Gatekeeper', count: 12, acao: 'Script alternativo', cor: 'border-purple-400 bg-purple-50', label_cor: 'text-purple-700' },
  ]

  return (
    <>
      <ModalConfigIA modal={configModal} onClose={() => setConfigModal({ open: false, campanhaId: null, campanhaName: '' })} />
      <ModalNovaCampanha open={novaCampanhaOpen} onClose={() => setNovaCampanhaOpen(false)} />

      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Campanhas ativas</h3>
            <p className="text-xs text-gray-500 mt-0.5">Gerencie listas, agressividade e inteligência por campanha.</p>
          </div>
          <button onClick={() => setNovaCampanhaOpen(true)} className="btn-primary gap-2 text-sm"><Megaphone size={14}/> + Criar campanha</button>
        </div>

        {/* Cards de campanha */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(campanhasReais.length > 0 ? campanhasReais : CAMPANHAS_DISC).map((c: any) => (
            <div key={c.id} className={clsx('card border-t-2', corMap[c.cor])}>
              <div className="p-4">
                {/* Header do card */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-sm font-bold text-gray-900">{c.nome}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={clsx('badge text-2xs', campStatus[c.id] === 'ativa' ? 'badge-success' : 'badge-amber')}>
                        {campStatus[c.id] === 'ativa' ? 'Ativa' : 'Pausada'}
                      </span>
                      <span className="badge badge-neutral text-2xs">⚡ {c.agr}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setConfigModal({ open: true, campanhaId: c.id, campanhaName: c.nome })}
                      className="text-gray-400 hover:text-brand-600 p-1 rounded-md hover:bg-brand-50 text-xs transition-colors"
                      title="Configuração de IA"
                    >
                      ⚙️ Config IA
                    </button>
                    <button className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 text-xs" title="Editar">✏️</button>
                    <button className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 text-xs" title="Duplicar">⧉</button>
                    <button className="text-gray-400 hover:text-red-500 p-1 rounded-md hover:bg-gray-100 text-xs" title="Arquivar">📦</button>
                  </div>
                </div>

                {/* Consumo */}
                <div className="mb-3">
                  <div className="flex justify-between text-2xs text-gray-500 mb-1">
                    <span>{c.feitas} ligações feitas</span>
                    <span className="font-semibold">{c.consumo}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={clsx('h-full rounded-full transition-all', consumoColor(c.consumo))} style={{ width:`${c.consumo}%` }} />
                  </div>
                </div>

                {/* Alerta */}
                {c.alerta && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-2xs text-amber-700 mb-3 flex items-start gap-1.5">
                    <AlertTriangle size={11} className="flex-shrink-0 mt-0.5" />
                    {c.alerta}
                  </div>
                )}

                {/* Métricas */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { label:'Total lista', value: c.total.toLocaleString('pt-BR') },
                    { label:'Feitas', value: c.feitas },
                    { label:'Faltam', value: c.faltam },
                    { label:'Conversão', value: c.conv },
                    { label:'Agendados', value: c.agendados },
                    { label:'Na fila', value: c.fila },
                  ].map(m => (
                    <div key={m.label} className="bg-gray-50 rounded-lg p-2 text-center">
                      <div className="text-sm font-bold font-mono text-gray-900">{m.value}</div>
                      <div className="text-2xs text-gray-400">{m.label}</div>
                    </div>
                  ))}
                </div>

                {/* Ações principais */}
                <div className="flex gap-2 mb-2">
                  {campStatus[c.id] === 'ativa' ? (
                    <button onClick={() => setCampStatus(prev => ({ ...prev, [c.id]: 'pausada' }))} className="flex-1 btn-secondary text-xs py-1.5 gap-1.5 justify-center"><Pause size={11}/>Pausar</button>
                  ) : (
                    <button onClick={() => setCampStatus(prev => ({ ...prev, [c.id]: 'ativa' }))} className="flex-1 btn-primary text-xs py-1.5 gap-1.5 justify-center"><Play size={11}/>Iniciar</button>
                  )}
                  <button className="flex-1 btn-secondary text-xs py-1.5 gap-1.5 justify-center"><PhoneCall size={11}/>Fila</button>
                </div>

                {/* Ações secundárias */}
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label:'+ Lista', icon:'📋' },
                    { label:'Leads', icon:'👥' },
                    { label:'IA', icon:'🧠' },
                    { label:'Export', icon:'📊' },
                  ].map(a => (
                    <button key={a.label} className="text-2xs font-semibold py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors text-center">
                      {a.icon} {a.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Upload de lista */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Upload size={16} className="text-brand-500" />
            <h3 className="text-sm font-semibold text-gray-900">Upload de lista com enriquecimento</h3>
          </div>

          {!listaCarregada ? (
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={clsx(
                'border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer',
                isDragging ? 'border-brand-400 bg-brand-50' : 'border-gray-300 hover:border-brand-300 hover:bg-gray-50'
              )}
              onClick={() => setListaCarregada(true)}
            >
              <Upload size={28} className={clsx('mx-auto mb-3', isDragging ? 'text-brand-500' : 'text-gray-400')} />
              <div className="text-sm font-semibold text-gray-700 mb-1">Arraste seu CSV aqui ou clique para selecionar</div>
              <div className="text-xs text-gray-400">Colunas esperadas: nome, empresa, segmento, porte, uf, telefone, email</div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Pills de distribuição */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-gray-200 p-3">
                  <div className="text-2xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Top UFs</div>
                  {[{ uf:'SP', pct:48 }, { uf:'RJ', pct:22 }, { uf:'RS', pct:15 }].map(u => (
                    <div key={u.uf} className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold w-6 text-gray-800">{u.uf}</span>
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-500 rounded-full" style={{ width:`${u.pct}%` }} />
                      </div>
                      <span className="text-2xs text-gray-500 w-7 text-right">{u.pct}%</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-gray-200 p-3">
                  <div className="text-2xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Por Segmento</div>
                  {[{ label:'Indústria', pct:35 }, { label:'SaaS', pct:28 }, { label:'Saúde', pct:20 }].map(s => (
                    <div key={s.label} className="flex items-center gap-2 mb-1">
                      <span className="text-2xs text-gray-700 flex-1 truncate">{s.label}</span>
                      <span className="text-2xs font-bold text-gray-600">{s.pct}%</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-gray-200 p-3">
                  <div className="text-2xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Por Porte</div>
                  {[{ label:'Médio', pct:42 }, { label:'Grande', pct:33 }, { label:'Pequeno', pct:25 }].map(p => (
                    <div key={p.label} className="flex items-center gap-2 mb-1">
                      <span className="text-2xs text-gray-700 flex-1">{p.label}</span>
                      <span className="text-2xs font-bold text-gray-600">{p.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview tabela */}
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="grid grid-cols-5 px-3 py-2 bg-gray-50 border-b border-gray-200">
                  {['Nome','Empresa','Segmento','Porte','UF'].map(h => (
                    <span key={h} className="text-2xs font-semibold text-gray-400 uppercase tracking-wide">{h}</span>
                  ))}
                </div>
                {LEADS_UPLOAD_PREVIEW.map((l, i) => (
                  <div key={i} className={clsx('grid grid-cols-5 px-3 py-2 border-b border-gray-100 text-xs', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                    <span className="text-gray-800 font-medium">{l.nome}</span>
                    <span className="text-gray-600">{l.empresa}</span>
                    <span className="text-gray-600">{l.segmento}</span>
                    <span className="text-gray-600">{l.porte}</span>
                    <span className="font-mono text-gray-700">{l.uf}</span>
                  </div>
                ))}
                <div className="px-3 py-2 bg-gray-50 text-2xs text-gray-400">5 de 1.250 leads — arquivo: lista_leads_maio.csv</div>
              </div>

              <div className="flex gap-3 items-center">
                <button className="btn-primary gap-2 text-sm"><Upload size={13}/> Importar e Enriquecer</button>
                <button onClick={() => setListaCarregada(false)} className="btn-secondary text-sm">Trocar arquivo</button>
                <span className="text-xs text-gray-400 ml-auto">1.250 leads · Enriquecimento estimado: ~2min</span>
              </div>
            </div>
          )}
        </div>

        {/* Toggles LGPD */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={16} className="text-brand-500" />
            <h3 className="text-sm font-semibold text-gray-900">Conformidade LGPD</h3>
          </div>
          <div className="flex flex-col gap-4">
            {([
              { label: 'Registrar opt-out automaticamente', desc: 'Qualquer solicitação de descadastro durante a ligação é registrada imediatamente', value: lgpdOptOutAuto, set: setLgpdOptOutAuto },
              { label: 'Excluir dados após opt-out', desc: 'Remove dados pessoais do contato 30 dias após o opt-out ser registrado', value: lgpdExcluirDados, set: setLgpdExcluirDados },
              { label: 'Não ligar para opt-outs', desc: 'Bloqueia automaticamente contatos que solicitaram opt-out de qualquer campanha', value: lgpdBloquearOptOut, set: setLgpdBloquearOptOut },
            ] as const).map(t => (
              <div key={t.label} className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-800">{t.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{t.desc}</div>
                </div>
                <button onClick={() => t.set(!t.value)} className={clsx('w-10 h-5 rounded-full transition-colors relative flex-shrink-0 mt-0.5', t.value ? 'bg-brand-600' : 'bg-gray-300')}>
                  <span className={clsx('absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform', t.value ? 'translate-x-5' : 'translate-x-0.5')} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Fluxo de orquestração */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Fluxo de orquestração</h3>
              <p className="text-xs text-gray-500 mt-0.5">Ações automáticas por resultado de ligação</p>
            </div>
            <select className="input py-1.5 text-xs w-48" value={orqCampanha} onChange={e => setOrqCampanha(e.target.value)}>
              {(campanhasReais.length > 0 ? campanhasReais : CAMPANHAS_DISC).map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {orqNodes.map((node) => (
              <div key={node.label} className={clsx('rounded-xl border-2 p-4 flex flex-col gap-2', node.cor)}>
                <div className={clsx('text-xs font-bold', node.label_cor)}>{node.label}</div>
                <div className="text-xl font-bold font-mono text-gray-900">{node.count}</div>
                <div className="text-2xs text-gray-500">leads neste estado</div>
                <div className="text-2xs font-medium text-gray-700 bg-white/70 rounded-lg px-2 py-1.5 border border-white">
                  ↳ {node.acao}
                </div>
                <button className="text-2xs font-semibold text-brand-600 hover:text-brand-700 text-left mt-1">Configurar →</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
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

  return (
    <div className="flex flex-col gap-4">
      {/* Filtros */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-gray-500">Reuniões agendadas pela IA. Cada card traz os dados completos do cliente para o vendedor chegar preparado.</p>
        <div className="flex items-center gap-2">
          <select className="input py-1.5 text-xs"><option>Todas as campanhas</option></select>
          <select className="input py-1.5 text-xs"><option>Todos os vendedores</option></select>
          <button className="btn-secondary gap-2 text-xs py-1.5"><Download size={12}/> Exportar CSV</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { id:'kpi-total-fechados', label:'Fechamentos', value:'0', color:'text-emerald-600', top:'border-t-emerald-500', sub:'0% taxa' },
          { id:'kpi-noshows', label:'No-show', value:'0', color:'text-amber-600', top:'border-t-amber-500', sub:'reminders ativos' },
          { id:'kpi-perdidos', label:'Perdidos', value:'0', color:'text-red-600', top:'border-t-red-500', sub:'em nurturing' },
          { id:'kpi-em-andamento', label:'Em andamento', value:'2', color:'text-brand-600', top:'border-t-brand-500', sub:'aguardando resultado' },
          { id:'kpi-conv-receita', label:'Taxa reunião→venda', value:'—%', color:'text-purple-600', top:'border-t-purple-500', sub:'meta: 25%' },
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
        {(agendamentosReais.length > 0 ? agendamentosReais.map((r: any) => ({ empresa: 'Reunião', contato: r.vendedor_nome ?? '—', horario: new Date(r.inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), agente: r.agente_id ?? '—', status: 'confirmado' as const })) : AGENDAMENTOS).map((ag: any) => (
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
                      <button className="text-xs font-semibold py-1.5 px-2 rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-50 bg-white transition-colors">✓ Aprovar</button>
                      <button className="text-xs font-semibold py-1.5 px-2 rounded-lg border border-brand-300 text-brand-700 hover:bg-brand-50 bg-white transition-colors">↔ Transferir vendedor</button>
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
      {modalJornada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-popup w-full max-w-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Jornada — {modalJornada.empresa}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{modalJornada.contato} · {modalJornada.cargo}</p>
              </div>
              <button onClick={() => setModalJornada(null)} className="btn-ghost p-2"><X size={18}/></button>
            </div>
            <div className="p-6">
              {/* Pipeline */}
              <div className="flex items-center gap-0 mb-6">
                {['Agendado','Realizado','Negociação','Proposta','Fechado'].map((etapa, i) => (
                  <div key={etapa} className="flex items-center flex-1">
                    <div className={clsx('flex-1 flex flex-col items-center gap-1', i === 0 && 'text-brand-600')}>
                      <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2', i === 0 ? 'bg-brand-500 border-brand-500 text-white' : 'bg-white border-gray-300 text-gray-400')}>{i + 1}</div>
                      <span className={clsx('text-2xs font-medium', i === 0 ? 'text-brand-600' : 'text-gray-400')}>{etapa}</span>
                    </div>
                    {i < 4 && <div className={clsx('h-0.5 flex-1', i < 0 ? 'bg-brand-500' : 'bg-gray-200')} />}
                  </div>
                ))}
              </div>
              {/* Dados */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1.5">Atualizar etapa</label>
                  <select className="input">
                    <option>Agendado</option><option>Realizado</option><option>Negociação</option><option>Proposta</option><option>Fechado</option><option>Perdido</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1.5">Valor da oportunidade</label>
                  <input className="input" placeholder="R$ 0,00" />
                </div>
              </div>
              <div className="mb-4">
                <label className="text-xs font-medium text-gray-500 block mb-1.5">Nota</label>
                <textarea className="input min-h-[80px] resize-none" placeholder="Adicione uma nota sobre esta oportunidade..." />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setModalJornada(null)} className="btn-secondary flex-1">Cancelar</button>
                <button className="btn-primary flex-1">Salvar etapa</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── ABA GRAVAÇÕES ───────────────────────────────────────────────────────────

function TabGravacoes() {
  const [playing, setPlaying] = useState<string | null>(null)
  const [treinadas, setTreinadas] = useState<Set<string>>(new Set())
  const [treinadaFeedback, setTreinadaFeedback] = useState<string | null>(null)
  const resultadoLabel = { agendou:'Agendou', retornar:'Retornar', nao_atendeu:'Não atendeu' } as const
  const resultadoCls = { agendou:'badge-success', retornar:'badge-amber', nao_atendeu:'badge-neutral' } as const

  function handleTreinar(id: string) {
    setTreinadas(prev => new Set([...prev, id]))
    setTreinadaFeedback(id)
    setTimeout(() => setTreinadaFeedback(null), 3000)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Gravações de chamadas</h3>
          <p className="text-xs text-gray-500 mt-0.5">Ouça, avalie e use para treinar a IA.</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="input py-1.5 text-xs" id="grav-filtro-agente"><option>Todos os agentes</option><option>Ana</option><option>Carlos</option><option>Julia</option></select>
          <select className="input py-1.5 text-xs"><option>Todos os resultados</option><option>Agendou</option><option>Retornar</option><option>Não atendeu</option></select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_180px] px-4 py-2 bg-gray-50 border-b border-gray-100">
          {['Empresa / Contato','Agente','Data / Hora','Duração','Resultado','Ações'].map(h => (
            <span key={h} className="text-2xs font-semibold text-gray-400 uppercase tracking-wide">{h}</span>
          ))}
        </div>
        {GRAVACOES.map((g, i) => (
          <div key={g.id} className={clsx('grid grid-cols-[2fr_1fr_1fr_1fr_1fr_180px] px-4 py-3 border-b border-gray-100 items-center', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40')}>
            <div>
              <div className="text-sm font-medium text-gray-900">{g.empresa}</div>
              <div className="text-xs text-gray-500">{g.contato}</div>
            </div>
            <div className="text-xs text-gray-700">{g.agente}</div>
            <div className="text-xs text-gray-500">{g.data}</div>
            <div className="text-xs font-mono text-gray-600">{g.duracao}</div>
            <div><span className={clsx('badge text-2xs', resultadoCls[g.resultado])}>{resultadoLabel[g.resultado]}</span></div>
            <div className="flex items-center gap-2">
              <button onClick={() => setPlaying(playing === g.id ? null : g.id)} className={clsx('p-1.5 rounded-lg border transition-colors', playing === g.id ? 'bg-brand-500 border-brand-500 text-white' : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-brand-50 hover:border-brand-300')}>
                {playing === g.id ? <Pause size={12}/> : <Play size={12}/>}
              </button>
              <button className="p-1.5 rounded-lg border bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200 transition-colors"><Download size={12}/></button>
              {treinadas.has(g.id) ? (
                <span className={clsx('text-2xs font-semibold', treinadaFeedback === g.id ? 'text-emerald-600' : 'text-gray-400')}>
                  {treinadaFeedback === g.id ? 'Enviada ✓' : 'Treinada ✓'}
                </span>
              ) : (
                <button
                  onClick={() => handleTreinar(g.id)}
                  className="flex items-center gap-1 text-2xs font-semibold px-2 py-1 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <Brain size={10}/> Treinar IA
                </button>
              )}
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
              <div className="text-xs font-semibold text-white">{GRAVACOES.find(g => g.id === playing)?.empresa}</div>
              <div className="text-2xs text-gray-400">{GRAVACOES.find(g => g.id === playing)?.agente}</div>
            </div>
          </div>
          <div className="flex-1 flex items-center gap-3">
            <span className="text-2xs text-gray-400 font-mono w-10">0:00</span>
            <div className="flex-1 h-1.5 bg-gray-700 rounded-full cursor-pointer">
              <div className="h-full w-[35%] bg-brand-500 rounded-full" />
            </div>
            <span className="text-2xs text-gray-400 font-mono w-10">{GRAVACOES.find(g => g.id === playing)?.duracao}</span>
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
  const [contato, setContato] = useState<{ nome: string; empresa: string; tel: string; email: string; motivo: string } | null>(null)
  const [numero, setNumero] = useState('')
  const [chamandoAtiva, setChamandoAtiva] = useState(false)
  const [resultado, setResultado] = useState<string | null>(null)
  const [timer, setTimer] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const sugestoes = busca.length > 1 ? [
    { nome:'Marcos Silva', empresa:'Grupo Comercial ABC', tel:'(11) 98765-4321', email:'marcos@grupoabc.com.br', motivo:'Não entrou na reunião de 14/05 14h', motivoCor:'text-amber-600' },
    { nome:'Roberto Alves', empresa:'Indústria Delta', tel:'(31) 97654-3210', email:'roberto@deltaindustria.com.br', motivo:'Follow-up pós-reunião', motivoCor:'text-brand-600' },
  ].filter(s => s.nome.toLowerCase().includes(busca.toLowerCase()) || s.empresa.toLowerCase().includes(busca.toLowerCase())) : []

  function ligar() {
    setChamandoAtiva(true)
    setResultado(null)
    setTimer(0)
    intervalRef.current = setInterval(() => setTimer(t => t + 1), 1000)
  }
  function registrarResultado(res: string) {
    setResultado(res)
    setChamandoAtiva(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
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
                      <div className={clsx('text-xs mt-0.5', s.motivoCor)}>{s.motivo}</div>
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
                  <div className="col-span-2"><span className="text-2xs text-gray-400 uppercase font-semibold block mb-0.5">Motivo</span><span className="text-amber-600 font-medium">{contato.motivo}</span></div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3"><div className="flex-1 h-px bg-gray-200"/><span className="text-xs text-gray-400">ou digitar número</span><div className="flex-1 h-px bg-gray-200"/></div>

            <input className="input font-mono text-sm tracking-widest" placeholder="(11) 99999-9999" type="tel" value={numero} onChange={e => setNumero(e.target.value)}/>

            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1.5">Agente que realizará a ligação</label>
              <select className="input"><option>Ana — Agente SP</option><option>Carlos — Agente GO/MG</option></select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1.5">Motivo da ligação</label>
              <select className="input">
                <option>Reagendamento — cliente não entrou na reunião</option>
                <option>Follow-up pós-reunião</option><option>Confirmação de reunião</option>
                <option>Retorno de chamada solicitado</option><option>Proposta comercial</option><option>Outro</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1.5">Anotação pré-ligação</label>
              <textarea className="input min-h-[64px] resize-none" placeholder="Ex: Cliente não atendeu o Google Meet de 14/05 às 14h. Tentar reagendar..." />
            </div>

            <button onClick={ligar} disabled={chamandoAtiva} className="btn-primary w-full justify-center gap-2 py-3 text-sm disabled:opacity-60">
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
          <div className="flex flex-col gap-2">
            {[
              { empresa:'Grupo ABC', contato:'Marcos Silva', resultado:'Reagendou', data:'Hoje 10h14', motivo:'No-show', cls:'badge-success' },
              { empresa:'Tech Nova', contato:'Carla Mendes', resultado:'Não atendeu', data:'Hoje 09h30', motivo:'Follow-up', cls:'badge-amber' },
              { empresa:'Indústria Delta', contato:'Roberto Alves', resultado:'Confirmou', data:'Ontem 16h20', motivo:'Confirmação', cls:'badge-brand' },
            ].map((h, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <User size={14} className="text-gray-500"/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-900">{h.empresa} · {h.contato}</div>
                  <div className="text-2xs text-gray-400">{h.motivo} · {h.data}</div>
                </div>
                <span className={clsx('badge text-2xs', h.cls)}>{h.resultado}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── ABA AGENDA ──────────────────────────────────────────────────────────────

function TabAgenda() {
  const [detalhe, setDetalhe] = useState<{ empresa: string; contato: string; hora: string; fim: string } | null>(null)
  const horas = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00']
  const dias = ['Seg 05','Ter 06','Qua 07','Qui 08','Sex 09']
  type Evento = { hora: string; fim: string; empresa: string; contato: string; cor: 'brand' | 'emerald' | 'amber' }
  const eventos: Record<string, Evento[]> = {
    'Seg 05': [
      { hora:'10:00', fim:'11:00', empresa:'Grupo ABC', contato:'Marcos Silva', cor:'brand' },
      { hora:'14:00', fim:'14:30', empresa:'Tech Nova', contato:'Carla Mendes', cor:'amber' },
    ],
    'Ter 06': [{ hora:'09:00', fim:'09:30', empresa:'Indústria Delta', contato:'Roberto Alves', cor:'emerald' }],
    'Qua 07': [{ hora:'11:00', fim:'11:30', empresa:'Omega Const.', contato:'Lucas Pereira', cor:'brand' }],
  }

  const corMap = { brand:'bg-brand-100 border-l-brand-500 text-brand-700', emerald:'bg-emerald-50 border-l-emerald-500 text-emerald-700', amber:'bg-amber-50 border-l-amber-500 text-amber-700' }

  return (
    <div className="flex flex-col gap-4">
      {/* Seletor de vendedor (visão gerente) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-500 text-white font-bold flex items-center justify-center text-sm">JS</div>
          <div>
            <div className="text-sm font-bold text-gray-900">João Silva</div>
            <div className="text-xs text-gray-500">Vendedor · SP</div>
          </div>
          <select className="input text-xs py-1.5">
            <option>João Silva</option><option>Maria Rodrigues</option><option>Carlos Vidal</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4">
            {[{label:'Hoje',value:'1',color:'text-brand-600'},{label:'Esta semana',value:'4',color:'text-gray-900'},{label:'Este mês',value:'12',color:'text-gray-900'}].map(k => (
              <div key={k.label} className="text-center">
                <div className={clsx('text-xl font-bold font-mono', k.color)}>{k.value}</div>
                <div className="text-2xs text-gray-400">{k.label}</div>
              </div>
            ))}
          </div>
          <button className="btn-secondary text-xs py-1.5 gap-1.5"><Calendar size={12}/> Sync Google Agenda</button>
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
              <div key={d} className={clsx('p-3 text-center border-l border-gray-100', d === 'Seg 05' && 'bg-brand-50')}>
                <div className={clsx('text-xs font-semibold', d === 'Seg 05' ? 'text-brand-600' : 'text-gray-600')}>{d}</div>
              </div>
            ))}
          </div>

          {/* Grid de horas */}
          <div className="overflow-y-auto max-h-[400px]">
            {horas.map(hora => (
              <div key={hora} className="grid grid-cols-[60px_repeat(5,1fr)] border-b border-gray-100 min-h-[52px]">
                <div className="px-2 py-1 text-2xs text-gray-400 font-mono border-r border-gray-100 pt-1.5">{hora}</div>
                {dias.map(dia => {
                  const ev = eventos[dia]?.find(e => e.hora === hora)
                  return (
                    <div key={dia} className="border-l border-gray-100 p-1 relative">
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
              {[
                { hora:'10:00', empresa:'Grupo ABC', contato:'Marcos Silva', cor:'brand' },
                { hora:'14:00', empresa:'Tech Nova', contato:'Carla Mendes', cor:'amber' },
              ].map((r, i) => (
                <div key={i} className={clsx('border-l-2 pl-2 cursor-pointer hover:bg-gray-50 rounded-r-lg py-1', r.cor === 'brand' ? 'border-l-brand-500' : 'border-l-amber-500')} onClick={() => setDetalhe({ ...r, fim: '14:30' })}>
                  <div className="text-2xs font-mono text-gray-500">{r.hora}</div>
                  <div className="text-xs font-semibold text-gray-900">{r.empresa}</div>
                  <div className="text-2xs text-gray-500">{r.contato}</div>
                </div>
              ))}
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

function TabAoVivo() {
  const ativas = FILA.filter(l => l.status === 'em_ligacao')

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

      {ativas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4"><Radio size={28} className="text-gray-400"/></div>
          <h3 className="text-base font-semibold text-gray-900">Nenhuma ligação ativa</h3>
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
                <button className="flex-1 text-xs font-semibold py-2 rounded-lg bg-purple-900/50 border border-purple-700 text-purple-300 hover:bg-purple-800/50 transition-colors">⚡ Transferir agora</button>
                <button className="flex-1 text-xs font-semibold py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 transition-colors">🎧 Escutar</button>
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
  const HISTORICO = [
    { id:'h1', empresa:'Grupo Comercial ABC', contato:'Marcos Silva', telefone:'(11) 98765-4321', agente:'Ana', campanha:'SP — Campanha Maio', duracao:'2m34s', data:'14/05 13h22', resultado:'Agendou', icp:94, sinais:['urgencia','decisor'], tentativa:1 },
    { id:'h2', empresa:'TechLabs MG', contato:'Fernanda Costa', telefone:'(31) 98800-1122', agente:'Carlos', campanha:'MG — Campanha Abr', duracao:'0m48s', data:'13/05 09h15', resultado:'Não atendeu', icp:72, sinais:[], tentativa:2 },
    { id:'h3', empresa:'Logística Norte', contato:'Antônio Ramos', telefone:'(11) 94321-7890', agente:'Ana', campanha:'SP — Campanha Maio', duracao:'1m55s', data:'13/05 14h40', resultado:'Recusou', icp:55, sinais:[], tentativa:1 },
    { id:'h4', empresa:'Indústria Delta', contato:'Roberto Alves', telefone:'(31) 97654-3210', agente:'Carlos', campanha:'GO — Campanha Maio', duracao:'3m12s', data:'12/05 11h30', resultado:'Agendou', icp:78, sinais:['proposta','preco'], tentativa:1 },
  ]
  const agendamentos = HISTORICO.filter(h => h.resultado === 'Agendou').length
  const taxa = ((agendamentos / HISTORICO.length) * 100).toFixed(1)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          {/* Filtro de período */}
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
          <select className="input py-1.5 text-xs" id="hist-filtro-campanha"><option>Todas as campanhas</option></select>
          <select className="input py-1.5 text-xs" id="hist-filtro-agente"><option>Todos os agentes</option></select>
        </div>
        <button className="btn-secondary gap-2 text-xs py-1.5"><Download size={12}/> Exportar CSV</button>
      </div>

      {/* KPIs do período */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { id:'hist-kpi-total', label:'Total ligações', value: HISTORICO.length, color:'text-gray-900' },
          { id:'hist-kpi-agend', label:'Agendamentos', value: agendamentos, color:'text-emerald-600' },
          { id:'hist-kpi-transf', label:'Transferências', value: 1, color:'text-purple-600' },
          { id:'hist-kpi-cadencia', label:'Rechamadas', value: 12, color:'text-amber-600' },
          { id:'hist-kpi-taxa', label:'Taxa conversão', value:`${taxa}%`, color:'text-brand-600' },
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
        <div className="grid grid-cols-[2fr_1fr_1fr_.8fr_1.2fr_80px] px-4 py-2 bg-gray-50 border-b border-gray-100">
          {['Empresa / Contato','Agente · Data','Sinais','ICP','Resultado','Ações'].map(h => (
            <span key={h} className="text-2xs font-semibold text-gray-400 uppercase tracking-wide">{h}</span>
          ))}
        </div>
        <div id="hist-tabela-corpo">
          {HISTORICO.map((h, i) => (
            <div key={h.id} className={clsx('grid grid-cols-[2fr_1fr_1fr_.8fr_1.2fr_80px] px-4 py-3 border-b border-gray-100 items-center', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40')}>
              <div>
                <div className="text-sm font-medium text-gray-900">{h.empresa}</div>
                <div className="text-xs text-gray-500">{h.contato} · <span className="font-mono">{h.telefone}</span></div>
                <div className="text-2xs text-gray-400">{h.campanha} · Tent. {h.tentativa}</div>
              </div>
              <div>
                <div className="text-xs text-gray-700">{h.agente}</div>
                <div className="text-2xs text-gray-400">{h.data}</div>
                <div className="text-2xs font-mono text-gray-500">{h.duracao}</div>
              </div>
              <div className="flex flex-wrap gap-1">
                {h.sinais.length > 0 ? h.sinais.map(s => (
                  <span key={s} className="text-2xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded font-medium">{s}</span>
                )) : <span className="text-2xs text-gray-300">—</span>}
              </div>
              <IcpBadge value={h.icp}/>
              <span className={clsx('badge text-2xs',
                h.resultado === 'Agendou' ? 'badge-success' :
                h.resultado.includes('Não') ? 'badge-amber' : 'badge-danger'
              )}>{h.resultado}</span>
              <div className="flex gap-1.5">
                <button className="text-2xs text-brand-600 hover:text-brand-700 font-medium">Transcrição</button>
              </div>
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

const LEADS_REATIVACAO: LeadReativacao[] = [
  { id:'r1', nome:'Marcos Silva',    empresa:'Grupo Comercial ABC',  ultimoContato:'08/05/2026', tentativas:3, motivo:'nao_atendeu',    campanha:'SP — Campanha Maio' },
  { id:'r2', nome:'Patricia Ramos',  empresa:'Distribuidora XYZ',    ultimoContato:'06/05/2026', tentativas:2, motivo:'retornar',       campanha:'SP — Campanha Maio' },
  { id:'r3', nome:'Renata Costa',    empresa:'Construtora Primavera', ultimoContato:'04/05/2026', tentativas:1, motivo:'nao_atendeu',    campanha:'RJ — Campanha Maio' },
  { id:'r4', nome:'Bruno Almeida',   empresa:'TechSolutions LTDA',   ultimoContato:'01/05/2026', tentativas:3, motivo:'tempo_expirado', campanha:'RS — Campanha Maio' },
  { id:'r5', nome:'Luciana Pinto',   empresa:'FarmaCenter',          ultimoContato:'29/04/2026', tentativas:2, motivo:'sem_interesse',  campanha:'PR — Campanha Maio' },
  { id:'r6', nome:'Eduardo Campos',  empresa:'Logística Norte',      ultimoContato:'27/04/2026', tentativas:1, motivo:'nao_atendeu',    campanha:'SP — Campanha Maio' },
  { id:'r7', nome:'Carla Mendes',    empresa:'Tech Nova Sistemas',   ultimoContato:'25/04/2026', tentativas:2, motivo:'retornar',       campanha:'MG — Campanha Maio' },
  { id:'r8', nome:'Roberto Alves',   empresa:'Indústria Delta',      ultimoContato:'22/04/2026', tentativas:3, motivo:'tempo_expirado', campanha:'GO — Campanha Maio' },
]

function TabReativacao() {
  const [selecionados, setSelecionados] = useState<string[]>([])
  const [filtroMotivo, setFiltroMotivo] = useState('todos')
  const [filtroCampanha, setFiltroCampanha] = useState('todas')
  const [filtroData, setFiltroData] = useState('')
  const [reativados, setReativados] = useState<Set<string>>(new Set())
  const [arquivados, setArquivados] = useState<Set<string>>(new Set())

  const leadsVisiveis = LEADS_REATIVACAO.filter(l => {
    if (arquivados.has(l.id)) return false
    if (filtroMotivo !== 'todos' && l.motivo !== filtroMotivo) return false
    if (filtroCampanha !== 'todas' && !l.campanha.includes(filtroCampanha)) return false
    return true
  })

  function toggleSel(id: string) {
    setSelecionados(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }
  function toggleAll(checked: boolean) {
    setSelecionados(checked ? leadsVisiveis.map(l => l.id) : [])
  }
  function reativarLead(id: string) {
    setReativados(prev => new Set([...prev, id]))
  }
  function arquivarLead(id: string) {
    setArquivados(prev => new Set([...prev, id]))
    setSelecionados(prev => prev.filter(x => x !== id))
  }
  function reativarSelecionados() {
    setReativados(prev => new Set([...prev, ...selecionados]))
    setSelecionados([])
  }
  function arquivarSelecionados() {
    setArquivados(prev => new Set([...prev, ...selecionados]))
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
          { label: 'Leads disponíveis',     value: '342',  color: 'text-gray-900'     },
          { label: 'Reativados este mês',   value: '87',   color: 'text-brand-600'    },
          { label: 'Taxa de sucesso',        value: '31%',  color: 'text-emerald-600'  },
          { label: 'Ligações geradas',       value: '156',  color: 'text-purple-600'   },
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

        <select
          className="input py-1.5 text-xs"
          value={filtroCampanha}
          onChange={e => setFiltroCampanha(e.target.value)}
        >
          <option value="todas">Todas as campanhas</option>
          <option value="SP">Campanha SP</option>
          <option value="MG">Campanha MG</option>
          <option value="GO">Campanha GO</option>
        </select>

        <div className="flex items-center gap-1.5">
          <label className="text-xs text-gray-500 whitespace-nowrap">Inatividade desde</label>
          <input
            type="date"
            className="input py-1.5 text-xs"
            value={filtroData}
            onChange={e => setFiltroData(e.target.value)}
          />
        </div>

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
  { id:'campanhas', label:'Campanhas',         icon:<Megaphone size={13}/> },
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
      {activeTab === 'campanhas' && <TabCampanhas />}
      {activeTab === 'agendados' && <TabAgendados />}
      {activeTab === 'gravacoes' && <TabGravacoes />}
      {activeTab === 'manual'    && <TabManual />}
      {activeTab === 'agenda'    && <TabAgenda />}
      {activeTab === 'aovivo'    && <TabAoVivo />}
      {activeTab === 'historico' && <TabHistorico />}
      {activeTab === 'ramal'      && <TabRamal />}
      {activeTab === 'reativacao' && <TabReativacao />}
    </div>
  )
}
