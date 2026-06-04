import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { reunioesApi, ligacoesApi, claudeApi, equipeApi, transcricaoApi, contatosApi, agentesApi, campanhasApi, inteligenciaApi, whatsappUsuarioApi } from '@/services/api'
import { useWebRTCPhone } from '@/hooks/useWebRTCPhone'
import { useAuthStore } from '@/store/authStore'
import {
  PhoneCall, Calendar, Mic, MicOff, Phone, PhoneOff, Radio, History, Antenna,
  Activity, Brain, Search, Download,
  User, Building2, MapPin, MessageSquare, X,
  Play, Pause, PauseCircle, CheckCircle2, XCircle, RotateCcw,
  Volume2, Video, Hash, Sparkles, Send, Save,
  RefreshCw, Archive,
  Copy, PhoneForwarded, FileText, Zap, Star
} from 'lucide-react'
import clsx from 'clsx'

// ─── CALL CARD MODAL (componente externo para evitar re-render do pai) ───────

interface CallCardModalProps {
  callCard: any
  onClose: () => void
  onSave: (resultado: string, anotacao: string) => void
}

function CallCardModal({ callCard: h, onClose, onSave }: CallCardModalProps) {
  const [resultado, setResultado]   = useState('')
  const [anotacao, setAnotacao]     = useState(h?.nota_pos_chamada ?? '')
  const [salvando, setSalvando]     = useState(false)
  const [waMsgTexto, setWaMsgTexto] = useState('')
  const [waMsg, setWaMsg]           = useState<string | null>(null)
  const [waLoading, setWaLoading]   = useState(false)

  if (!h) return null

  const res = (h.resultado ?? 'encerrada') as string
  const labelMap: Record<string, string> = {
    reagendou: 'Reagendou', confirmou: 'Confirmou presença',
    nao_atendeu: 'Não atendeu', encerrada: 'Encerrada', agendada: 'Agendou',
  }
  const cls = res === 'confirmou' || res === 'agendada' ? 'badge-success' : res === 'nao_atendeu' ? 'badge-amber' : 'badge-neutral'
  const dur = h.duracao_segundos ? `${Math.floor(h.duracao_segundos / 60)}m${String(h.duracao_segundos % 60).padStart(2, '0')}s` : '—'

  async function enviarWa() {
    const tel = h.numero_destino
    const texto = waMsgTexto.trim()
    if (!tel || !texto) return
    setWaLoading(true)
    try {
      await whatsappUsuarioApi.enviar({ telefone: tel, mensagem: texto })
      setWaMsgTexto('')
      setWaMsg('✓ Mensagem enviada!')
      setTimeout(() => setWaMsg(null), 4000)
    } catch (e: any) {
      setWaMsg('Erro: ' + (e?.response?.data?.error ?? e.message))
    } finally { setWaLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-popup w-full max-w-md mx-4 animate-slide-up" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 text-sm font-bold flex items-center justify-center">
            {(h.contatos?.nome ?? h.numero_destino ?? '?').slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">{h.contatos?.nome ?? h.numero_destino}</p>
            <p className="text-xs text-gray-400">{h.contatos?.empresa ?? h.motivo ?? ''}</p>
          </div>
          <span className={clsx('badge text-2xs', cls)}>{labelMap[res] ?? res}</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-1"><X size={16} /></button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-4">
          {/* Métricas */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-gray-50 rounded-xl py-2">
              <p className="text-xs font-bold text-gray-900">{dur}</p>
              <p className="text-2xs text-gray-500">Duração</p>
            </div>
            <div className="bg-gray-50 rounded-xl py-2">
              <p className="text-xs font-bold text-gray-900">{h.motivo ? h.motivo.split(' ').slice(0, 2).join(' ') : '—'}</p>
              <p className="text-2xs text-gray-500">Motivo</p>
            </div>
            <div className="bg-gray-50 rounded-xl py-2">
              <p className="text-xs font-bold text-gray-900">{h.numero_destino ?? '—'}</p>
              <p className="text-2xs text-gray-500">Número</p>
            </div>
          </div>

          {/* Anotações existentes */}
          {(h.anotacao_pre || h.nota_pos_chamada) && (
            <div className="space-y-2">
              {h.anotacao_pre && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                  <p className="text-2xs font-semibold text-amber-700 mb-1">Anotação pré-ligação</p>
                  <p className="text-xs text-amber-800">{h.anotacao_pre}</p>
                </div>
              )}
              {h.nota_pos_chamada && (
                <div className="bg-brand-50 border border-brand-100 rounded-xl p-3">
                  <p className="text-2xs font-semibold text-brand-700 mb-1">Anotação durante a chamada</p>
                  <p className="text-xs text-brand-800">{h.nota_pos_chamada}</p>
                </div>
              )}
            </div>
          )}

          {/* Gravação */}
          <div>
            <p className="text-2xs font-semibold text-gray-600 mb-1.5">Gravação</p>
            {h.url_gravacao
              ? <audio controls src={h.url_gravacao} className="w-full h-9 rounded-lg" />
              : <p className="text-2xs text-gray-400 italic">Disponível em alguns minutos após o encerramento</p>
            }
          </div>

          {/* CI badge */}
          <div className="rounded-xl p-3 border bg-brand-50 border-brand-200 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center flex-shrink-0">
              <Sparkles size={14} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-brand-800">Analisada automaticamente pelo CI</p>
              <p className="text-2xs text-brand-600">Anotações e gravação treinam o agente desta conta — transferências a quente também</p>
            </div>
          </div>

          {/* Classificação */}
          <div className="space-y-2">
            <div>
              <label className="text-2xs font-semibold text-gray-600 block mb-1.5">Como foi a ligação?</label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { v: 'confirmou',    label: '✅ Confirmou presença',      cls: 'border-emerald-300 bg-emerald-50 text-emerald-800' },
                  { v: 'reagendou',    label: '📅 Reagendou',               cls: 'border-brand-300  bg-brand-50  text-brand-800' },
                  { v: 'nao_atendeu',  label: '📵 Não atendeu',             cls: 'border-amber-300  bg-amber-50  text-amber-800' },
                  { v: 'caixa_postal', label: '📬 Caixa postal',            cls: 'border-gray-300   bg-gray-50   text-gray-700' },
                  { v: 'interessado',  label: '🔥 Interessado — follow-up', cls: 'border-orange-300 bg-orange-50 text-orange-800' },
                  { v: 'numero_errado',label: '❌ Número errado',           cls: 'border-red-200    bg-red-50    text-red-700' },
                ].map(opt => (
                  <button key={opt.v}
                    onClick={() => setResultado(opt.v)}
                    className={clsx(
                      'text-2xs font-semibold py-2 px-2 rounded-xl border transition-all text-left',
                      resultado === opt.v
                        ? opt.cls + ' ring-2 ring-offset-1 ring-brand-400 shadow-sm'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    )}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-2xs font-semibold text-gray-600 block mb-1">Anotação pós-chamada</label>
              <textarea
                className="input min-h-[56px] resize-none text-xs"
                placeholder="Objeções, interesse, próximos passos..."
                value={anotacao}
                onChange={e => setAnotacao(e.target.value)} />
            </div>
            <button
              onClick={async () => {
                setSalvando(true)
                try {
                  if (h.id) {
                    await ligacoesApi.update(h.id, {
                      resultado: resultado || undefined,
                      nota_pos_chamada: anotacao || undefined,
                    })
                  }
                  onSave(resultado, anotacao)
                } catch (e) { console.error(e) }
                setSalvando(false)
              }}
              disabled={salvando}
              className="btn-primary w-full justify-center gap-2 py-2 text-xs disabled:opacity-50">
              <Save size={12} /> {salvando ? 'Salvando…' : 'Salvar anotação'}
            </button>
          </div>

          {/* WhatsApp follow-up */}
          <div>
            <p className="text-2xs font-semibold text-gray-600 mb-1.5">Enviar WhatsApp de follow-up</p>
            <div className="flex gap-2 mb-2">
              {['Não atendeu', 'Reagendamento', 'Follow-up'].map(label => {
                const textoMap: Record<string, string> = {
                  'Não atendeu': `Olá! Tentamos ligar agora mas não conseguimos falar. Quando seria um bom horário? 📅`,
                  'Reagendamento': `Olá! Preciso reagendar nossa conversa. Qual seria o melhor horário para você? 🔄`,
                  'Follow-up': `Olá! Passando para dar continuidade ao nosso contato. Tem um momento? 🚀`,
                }
                return (
                  <button key={label} onClick={() => setWaMsgTexto(textoMap[label])}
                    className="text-2xs px-2 py-1 rounded-lg border border-gray-200 hover:border-brand-300 hover:bg-brand-50 text-gray-600 hover:text-brand-700 transition-colors">
                    {label}
                  </button>
                )
              })}
            </div>
            <div className="flex gap-2">
              <textarea
                className="flex-1 text-xs border border-gray-200 rounded-xl px-3 py-2 resize-none min-h-[56px] focus:outline-none focus:border-brand-400"
                placeholder="Mensagem de follow-up..."
                value={waMsgTexto}
                onChange={e => setWaMsgTexto(e.target.value)} />
              <button onClick={enviarWa} disabled={waLoading || !waMsgTexto.trim()}
                className="w-10 flex items-center justify-center rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-40 transition-colors flex-shrink-0">
                {waLoading ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </div>
            {waMsg && <p className="text-2xs text-emerald-600 mt-1">{waMsg}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── TIPOS ──────────────────────────────────────────────────────────────────

type Tab = 'fila' | 'agendados' | 'gravacoes' | 'manual' | 'agenda' | 'aovivo' | 'historico' | 'ramal'

type StatusLigacao = 'em_ligacao' | 'na_fila' | 'retornar' | 'agendado'

interface EntradaFila {
  id: string; empresa: string; contato: string; cargo: string
  telefone: string; agente: string; campanha: string; segmento: string
  modalidade_campanha?: string
  status: StatusLigacao; icp: number; potencial: number
  tentativa: number; maxTentativas: number; duracao?: string
  snippet?: string; gatilhoDetectado?: string; transferindo?: boolean
}

interface Agendamento {
  id: string; empresa: string; contato: string; cargo: string
  telefone: string; email: string; modalidade: 'online' | 'presencial' | 'hibrido'
  cidade?: string; cnpj?: string; segmento?: string; resumoLigacao: string
  agente: string; duracaoLigacao: string; dataHora: string; meetLink?: string
  endereco?: string; cep?: string; estado?: string; complemento?: string
  vendedor: string; vendedorIniciais: string; status: string
  noShowRisk: number; campanha: string; resultado?: string
  notaVendedor?: string
}

// ─── TIPOS ADICIONAIS ────────────────────────────────────────────────────────


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

const GRAVACOES_FALLBACK = [
  { id:'g1', empresa:'Grupo Comercial ABC', contato:'Marcos Silva', agente:'Ana (ETZ)', campanha:'SP — Campanha Maio', duracao:'2m34s', data:'14/05 · 14h12', resultado:'agendou'   as const, tipo:'ia'           as const, icp:87, url_gravacao:'' },
  { id:'g2', empresa:'Indústria Delta',     contato:'Roberto Alves', agente:'Carlos (ETZ)', campanha:'GO — Campanha Maio', duracao:'1m08s', data:'14/05 · 15h30', resultado:'retornar'  as const, tipo:'ia'           as const, icp:62, url_gravacao:'' },
  { id:'g3', empresa:'Tech Nova Sistemas',  contato:'Carla Mendes',  agente:'Ana (ETZ)', campanha:'SP — Campanha Maio', duracao:'4m17s', data:'15/05 · 09h45', resultado:'agendou'   as const, tipo:'transferencia' as const, icp:91, url_gravacao:'' },
  // icp:0 → simula ligação ainda não analisada pelo CI (mostra "pendente")
  { id:'g4', empresa:'Logística Express',   contato:'Paulo Rocha',   agente:'—', campanha:'SP — Campanha Maio', duracao:'3m02s', data:'15/05 · 11h20', resultado:'nao_atendeu' as const, tipo:'manual'        as const, icp:0,  url_gravacao:'' },
]

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
      modalidade_campanha: l.campanhas?.modalidade ?? 'online',
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
      _contatoId: l.contato_id ?? l.contatos?.id,
    } as EntradaFila & { _callControlId: string; _contatoId?: string }))),
    refetchInterval: 5000,
  })
  const FILA_DEMO: EntradaFila[] = [
    {
      id: 'demo-1', empresa: 'Grupo Comercial ABC', contato: 'Marcos Silva', cargo: 'Diretor Comercial',
      telefone: '(11) 98765-4321', agente: 'Ana', campanha: 'SP — Outbound Maio', segmento: 'Comércio / Varejo',
      status: 'em_ligacao', icp: 87, potencial: 82, tentativa: 1, maxTentativas: 3,
      duracao: '2m14s', snippet: 'Sim, sou responsável pelas decisões comerciais aqui...', gatilhoDetectado: '🎯 Decisor confirmado', transferindo: false,
    },
    {
      id: 'demo-2', empresa: 'Tech Nova Sistemas', contato: 'Carla Mendes', cargo: 'Gestora Comercial',
      telefone: '(11) 96543-2109', agente: 'Carlos', campanha: 'SP — Outbound Maio', segmento: 'SaaS / Tech',
      status: 'na_fila', icp: 74, potencial: 68, tentativa: 1, maxTentativas: 3,
      duracao: undefined, snippet: undefined, gatilhoDetectado: undefined, transferindo: false,
    },
  ]

  const [fila, setFila] = useState<EntradaFila[]>(FILA_DEMO)

  // Sync API data into local state; mantém demo se API retornar vazio
  useEffect(() => {
    if (filaData.length > 0) setFila(filaData)
  }, [filaData])
  const [filtroCampanha, setFiltroCampanha] = useState('')
  const [filtroAgente, setFiltroAgente] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [modalMoverCampanha, setModalMoverCampanha] = useState(false)
  const [campanhaMoverSel, setCampanhaMoverSel] = useState('')

  // Dados para filtros dinâmicos
  const { data: campanhasLista = [] } = useQuery({
    queryKey: ['campanhas-fila'],
    queryFn: () => campanhasApi.list().then(r => (r.data as any[]) ?? []),
  })
  const { data: agentesLista = [] } = useQuery({
    queryKey: ['agentes-fila'],
    queryFn: () => agentesApi.list().then(r => (r.data as any[]) ?? []),
  })

  // KPI agendadas hoje — vem de reunioes, não de ligacoes
  const { data: reunioesHoje = [] } = useQuery({
    queryKey: ['reunioes-hoje'],
    queryFn: () => reunioesApi.list().then(r => {
      const hoje = new Date().toISOString().slice(0, 10)
      return ((r.data as any[]) ?? []).filter((re: any) => {
        const d = re.data_hora ?? re.inicio ?? ''
        return d.startsWith(hoje)
      })
    }),
    refetchInterval: 30000,
  })
  const [selecionados, setSelecionados] = useState<string[]>([])
  const [expandido, setExpandido] = useState<string | null>('1')
  const [scriptInput, setScriptInput] = useState<Record<string, string>>({})
  const [scriptFeedback, setScriptFeedback] = useState<Record<string, string>>({})
  const [_slotConfirmado, _setSlotConfirmado] = useState<Record<string, string>>({})
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

  // Inicializa monitorIA para cada ligação ativa conforme fila atualiza (polling 5s)
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
        } else {
          // Atualiza gatilho e sugestão se chegou novo dado da API
          if (l.gatilhoDetectado && !next[l.id].gatilhos.includes(l.gatilhoDetectado)) {
            next[l.id] = { ...next[l.id], gatilhos: [...next[l.id].gatilhos, l.gatilhoDetectado] }
          }
          if (l.transferindo) next[l.id] = { ...next[l.id], sugestao: 'transferir' }
        }
      })
      return next
    })
  }, [fila])

  // Vendedores para transferência via API
  const { data: equipeRaw = [] } = useQuery({
    queryKey: ['equipe'],
    queryFn: () => equipeApi.list().then(r => r.data as any[]),
  })
  const allTransferCandidates: (Vendedor & { telefone?: string; modalidade?: string })[] = equipeRaw.length > 0
    ? equipeRaw.map(v => ({
        nome: v.nome ?? v.name ?? '—',
        status: (v.status === 'em_chamada' ? 'em_chamada' : v.status === 'ausente' ? 'ausente' : 'disponivel') as Vendedor['status'],
        reunioes_hoje: v.reunioes_hoje ?? v.reunioes_count ?? 0,
        telefone: v.telefone ?? v.phone,
        modalidade: v.modalidade ?? 'hibrido',
      }))
    : TRANSFER_CANDIDATES.map(v => ({ ...v, modalidade: 'hibrido' }))

  function getTransferCandidates(item: EntradaFila) {
    const mod = item.modalidade_campanha ?? 'online'
    return allTransferCandidates.filter(v => {
      const vm = v.modalidade ?? 'hibrido'
      if (mod === 'online')     return vm === 'online' || vm === 'hibrido'
      if (mod === 'presencial') return vm === 'presencial' || vm === 'hibrido'
      return true // hibrido da campanha aceita todos
    })
  }

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
    if (filtroCampanha && f.campanha.trim().toLowerCase() !== filtroCampanha.trim().toLowerCase()) return false
    if (filtroAgente && f.agente.trim().toLowerCase() !== filtroAgente.trim().toLowerCase()) return false
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
  async function injetarScript(itemId: string) {
    const texto = scriptInput[itemId]
    if (!texto) return
    const item = fila.find(f => f.id === itemId) as (EntradaFila & { _callControlId?: string }) | undefined
    const ccid = item?._callControlId
    if (!ccid) {
      setScriptFeedback(prev => ({ ...prev, [itemId]: '⚠ Ligação demo — indisponível' }))
      setTimeout(() => setScriptFeedback(prev => ({ ...prev, [itemId]: '' })), 3000)
      return
    }
    try {
      await ligacoesApi.falar(ccid, { texto })
      setScriptFeedback(prev => ({ ...prev, [itemId]: '✓ Frase injetada com sucesso' }))
    } catch {
      setScriptFeedback(prev => ({ ...prev, [itemId]: '✗ Erro ao injetar — verifique a ligação' }))
    }
    setTimeout(() => setScriptFeedback(prev => ({ ...prev, [itemId]: '' })), 3000)
    setScriptInput(prev => ({ ...prev, [itemId]: '' }))
  }

  async function ouvirLigacao(item: EntradaFila & { _callControlId?: string }) {
    const ccid = item._callControlId
    if (!ccid) {
      alert('Ligação demo — escuta não disponível.')
      return
    }
    try {
      await fetch(`https://app.etztech.com/api/v1/ligacoes/${ccid}/monitorar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('youagent_jwt')}` },
      })
      alert('Escuta iniciada no seu ramal SIP. Verifique a aba Ramal.')
    } catch {
      alert('Erro ao iniciar escuta. Verifique se o ramal SIP está configurado.')
    }
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


  return (
    <div className="flex flex-col gap-4">
      {/* Modal mover campanha */}
      {modalMoverCampanha && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-80">
            <h3 className="text-sm font-bold text-gray-900 mb-1">Mover para campanha</h3>
            <p className="text-xs text-gray-500 mb-4">{selecionados.length} contato(s) selecionado(s)</p>
            <select
              className="input w-full mb-4"
              value={campanhaMoverSel}
              onChange={e => setCampanhaMoverSel(e.target.value)}
            >
              <option value="">Selecione a campanha...</option>
              {campanhasLista.map((c: any) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setModalMoverCampanha(false)} className="btn-secondary text-xs">Cancelar</button>
              <button
                disabled={!campanhaMoverSel}
                onClick={async () => {
                  try {
                    await Promise.all(selecionados.map(id => {
                      const it = fila.find(f => f.id === id) as any
                      const contatoId = it?._contatoId
                      if (!contatoId) return Promise.resolve()
                      return contatosApi.patch(contatoId, { campanha_id: campanhaMoverSel })
                    }))
                  } catch { /* silent — contatos sem _contatoId no demo */ }
                  setModalMoverCampanha(false)
                  setSelecionados([])
                }}
                className="btn-primary text-xs disabled:opacity-50"
              >Mover</button>
            </div>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label:'Em ligação agora', value: ativas, color:'text-emerald-600' },
          { label:'Na fila', value: fila.filter(f => f.status === 'na_fila').length, color:'text-gray-900' },
          { label:'Retornar contato', value: fila.filter(f => f.status === 'retornar').length, color:'text-amber-600' },
          { label:'Agendadas hoje', value: reunioesHoje.length, color:'text-brand-600' },
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
              {campanhasLista.map((c: any) => (
                <option key={c.id} value={c.nome}>{c.nome}</option>
              ))}
            </select>
            <select className="input py-1.5 text-xs" value={filtroAgente} onChange={e => setFiltroAgente(e.target.value)}>
              <option value="">Todos os agentes</option>
              {agentesLista.map((a: any) => (
                <option key={a.id} value={a.nome}>{a.nome}</option>
              ))}
            </select>
            <select className="input py-1.5 text-xs" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
              <option value="">Todos os status</option><option value="em_ligacao">Em ligação</option><option value="na_fila">Na fila</option><option value="retornar">Retornar</option><option value="agendado">Agendado</option>
            </select>
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
            <button
              onClick={() => { setCampanhaMoverSel(''); setModalMoverCampanha(true) }}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 bg-white hover:bg-gray-50 transition-colors"
            >📋 Mover campanha</button>
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
              <div className="border-b border-brand-200 bg-gradient-to-b from-brand-950 to-gray-950" style={{ background: 'linear-gradient(180deg, #1e1b4b 0%, #0f0f1f 100%)' }}>
                {/* Header do monitor */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-sm font-bold text-white">{item.empresa}</span>
                    <span className="text-2xs text-indigo-300 font-medium">{item.agente}</span>
                    {/* Campanha destacada */}
                    {item.campanha && (
                      <span className="text-2xs font-semibold bg-indigo-900/60 border border-indigo-500/40 text-indigo-300 rounded-full px-2 py-0.5">
                        📋 {item.campanha}
                      </span>
                    )}
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
                      <button
                        onClick={() => {
                          const texto = `Briefing — ${item.empresa}\nContato: ${item.contato}${item.cargo ? ` (${item.cargo})` : ''}\nICP: ${item.icp}/100\nSinais: ${item.gatilhoDetectado ?? '—'}\nDuração: ${item.duracao ?? '—'}`
                          navigator.clipboard.writeText(texto)
                        }}
                        className="flex items-center gap-1.5 text-2xs font-semibold px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors"
                      >
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
                        <button
                          onClick={() => ouvirLigacao(item as EntradaFila & { _callControlId?: string })}
                          title="Escuta silenciosa em tempo real via ramal SIP. Você ouvirá a ligação sem interferir."
                          className="text-2xs bg-emerald-900/30 border border-emerald-700 text-emerald-400 rounded-full px-2 py-0.5 font-semibold hover:bg-emerald-800/30 transition-colors"
                        >🎧 Ouvir ao vivo</button>
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
                          <button
                            onClick={() => {
                              const disponiveis = getTransferCandidates(item).filter(v => v.status === 'disponivel')
                              const primeiro = disponiveis[0]
                              if (primeiro) iniciarTransferencia(item.id, primeiro.nome, primeiro.telefone)
                            }}
                            className="flex items-center gap-1.5 text-2xs font-bold px-3 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                          >
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
                      {scriptFeedback[item.id] && (
                        <div className={clsx('text-2xs mt-1', scriptFeedback[item.id].startsWith('✓') ? 'text-emerald-400' : 'text-red-400')}>
                          {scriptFeedback[item.id]}
                        </div>
                      )}
                    </div>

                    {/* Anotação do supervisor */}
                    <div>
                      <div className="text-2xs font-semibold text-gray-400 uppercase tracking-wide mb-1">📝 Anotação do supervisor</div>
                      <div className="text-2xs text-gray-500 mb-2 leading-relaxed">Anote insights enquanto acompanha — o agente de IA agenda automaticamente durante a ligação.</div>
                      <textarea
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-2xs text-white placeholder-gray-500 outline-none focus:border-brand-500 resize-none"
                        rows={4}
                        placeholder="Ex: Cliente citou o concorrente X... mencionou budget para Q3... pedir follow-up sobre decisão..."
                        value={scriptInput[`nota_${item.id}`] ?? ''}
                        onChange={e => setScriptInput(prev => ({ ...prev, [`nota_${item.id}`]: e.target.value }))}
                      />
                      <button
                        onClick={async () => {
                          const nota = scriptInput[`nota_${item.id}`]
                          if (!nota) return
                          const ccid = (item as any)._callControlId
                          if (ccid) {
                            try {
                              await fetch(`https://app.etztech.com/api/v1/ligacoes/${ccid}/anotacao`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('youagent_jwt')}` },
                                body: JSON.stringify({ anotacao: nota }),
                              })
                            } catch (_) {}
                          }
                          setScriptFeedback(prev => ({ ...prev, [`nota_${item.id}`]: '✓ Anotação salva' }))
                          setTimeout(() => setScriptFeedback(prev => ({ ...prev, [`nota_${item.id}`]: '' })), 2500)
                        }}
                        className="mt-1.5 text-2xs font-semibold px-3 py-1 rounded-lg bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600 transition-colors"
                      >
                        Salvar anotação
                      </button>
                      {scriptFeedback[`nota_${item.id}`] && (
                        <div className="text-2xs text-emerald-400 mt-1">{scriptFeedback[`nota_${item.id}`]}</div>
                      )}
                    </div>
                  </div>

                  {/* Col 3: Transferência — candidatos */}
                  <div>
                    <div className="text-2xs font-semibold text-gray-400 uppercase tracking-wide mb-1">⚡ Transferência a quente</div>
                  <div className="text-2xs text-gray-500 mb-2 leading-relaxed">
                    Transfere a ligação para o vendedor agora — ele entra na chamada com o lead direto, sem perder o contato.
                    {item.modalidade_campanha && item.modalidade_campanha !== 'online' && (
                      <span className="ml-1 text-purple-400">· Modalidade: {item.modalidade_campanha}</span>
                    )}
                  </div>
                    <div className="flex flex-col gap-2">
                      {getTransferCandidates(item).map(v => (
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
                      <button
                        onClick={async () => {
                          const ccid = (item as any)._callControlId
                          if (!ccid) { alert('Ligação demo — indisponível.'); return }
                          if (!confirm(`Encerrar ligação com ${item.empresa}?`)) return
                          try {
                            await ligacoesApi.encerrar(ccid)
                            setFila(prev => prev.filter(f => f.id !== item.id))
                          } catch { alert('Erro ao encerrar a ligação.') }
                        }}
                        className="w-full text-xs font-semibold py-2 rounded-lg bg-amber-900/30 border border-amber-700 text-amber-300 hover:bg-amber-800/30 transition-colors"
                      >⏸ Pausar agente</button>
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
  const { data: agendamentosReais = [], refetch: refetchAgendamentos } = useQuery({
    queryKey: ['reunioes'],
    queryFn: () => reunioesApi.list().then((r: any) => r.data),
  })

  // Vendedores reais para transferência
  const { data: equipeRaw = [] } = useQuery({
    queryKey: ['equipe'],
    queryFn: () => equipeApi.list().then(r => (r.data as any[]) ?? []),
  })

  const [modalJornada, setModalJornada] = useState<Agendamento | null>(null)

  // Filtros
  const [filtroCampanha, setFiltroCampanha] = useState('')
  const [filtroVendedor, setFiltroVendedor] = useState('')

  // Dropdown reatribuir vendedor — controla qual card está com o picker aberto
  const [reatribuirAberto, setReatribuirAberto] = useState<string | null>(null)

  // Campanhas únicas dos agendamentos (para o select)
  const campanhasUnicas = Array.from(new Set(
    (agendamentosReais as any[]).map((r: any) => r.campanha_nome ?? r.campanha ?? '').filter(Boolean)
  ))

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
        endereco: r.endereco ?? r.local_endereco ?? '',
        cep: r.cep ?? '',
        estado: r.estado ?? r.uf ?? '',
        complemento: r.complemento ?? '',
        vendedor: r.vendedor_nome ?? r.vendedor ?? '—',
        vendedorIniciais: ((r.vendedor_nome ?? r.vendedor ?? 'VD') as string).split(' ').map((n: string) => n[0]).join('').slice(0,2),
        status: r.status ?? 'pendente',
        noShowRisk: r.no_show_risk ?? r.noShowRisk ?? 0,
        campanha: r.campanha_nome ?? r.campanha ?? '',
        resultado: r.resultado,
        notaVendedor: r.nota_vendedor ?? r.nota ?? '',
      }))
    : AGENDAMENTOS_FALLBACK

  // Filtragem aplicada sobre os agendamentos mapeados
  const agendamentosFiltrados = agendamentos.filter((ag: Agendamento) => {
    if (filtroCampanha && ag.campanha.trim().toLowerCase() !== filtroCampanha.trim().toLowerCase()) return false
    if (filtroVendedor && ag.vendedor.trim().toLowerCase() !== filtroVendedor.trim().toLowerCase()) return false
    return true
  })

  const fechamentos   = agendamentosFiltrados.filter((r: Agendamento) => r.resultado === 'fechou').length
  const noShows       = agendamentosFiltrados.filter((r: Agendamento) => r.resultado === 'noshow').length
  const perdidos      = agendamentosFiltrados.filter((r: Agendamento) => r.resultado === 'perdemos').length
  const emAndamento   = agendamentosFiltrados.filter((r: Agendamento) => !['fechou','noshow','perdemos'].includes(r.resultado ?? '')).length
  const taxaConversao = agendamentosFiltrados.length > 0 ? Math.round((fechamentos / agendamentosFiltrados.length) * 100) : 0

  return (
    <div className="flex flex-col gap-4">
      {/* Filtros */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-gray-500">Reuniões agendadas pela IA. Cada card traz os dados completos do cliente para o vendedor chegar preparado.</p>
        <div className="flex items-center gap-2">
          <select
            className="input py-1.5 text-xs"
            value={filtroCampanha}
            onChange={e => setFiltroCampanha(e.target.value)}
          >
            <option value="">Todas as campanhas</option>
            {campanhasUnicas.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            className="input py-1.5 text-xs"
            value={filtroVendedor}
            onChange={e => setFiltroVendedor(e.target.value)}
          >
            <option value="">Todos os vendedores</option>
            {equipeRaw.map((v: any) => (
              <option key={v.id} value={v.nome}>{v.nome}</option>
            ))}
          </select>
          <button
            className="btn-secondary gap-2 text-xs py-1.5"
            onClick={() => {
              const header = 'Empresa,Contato,Cargo,Data/Hora,Vendedor,Status,Campanha'
              const rows = agendamentosFiltrados.map((a: any) => `${a.empresa},${a.contato},${a.cargo ?? ''},${a.dataHora},${a.vendedor},${a.status},${a.campanha}`)
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
          { id:'kpi-noshows',        label:'No-show',           value: String(noShows),                     color:'text-amber-600',   top:'border-t-amber-500',   sub: noShows > 0 ? 'lembrete automático ativo' : 'nenhum registrado' },
          { id:'kpi-perdidos',       label:'Perdidos',          value: String(perdidos),                    color:'text-red-600',     top:'border-t-red-500',     sub: perdidos > 0 ? 'follow-up via IA' : 'nenhum registrado' },
          { id:'kpi-em-andamento',   label:'Em andamento',      value: String(emAndamento), color:'text-brand-600', top:'border-t-brand-500', sub:'aguardando resultado' },
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
        {agendamentosFiltrados.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Calendar size={32} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">{agendamentos.length === 0 ? 'Nenhum agendamento encontrado' : 'Nenhum resultado para os filtros selecionados'}</p>
            <p className="text-xs mt-1">{agendamentos.length === 0 ? 'As reuniões agendadas pelos agentes aparecerão aqui.' : 'Tente remover os filtros.'}</p>
          </div>
        )}
        {agendamentosFiltrados.map((ag: any) => {
          const resultado = ag.resultado as string | undefined
          const resultadoMap: Record<string, { label: string; cls: string }> = {
            fechou:    { label: '💰 Negócio fechado',    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
            noshow:    { label: '👻 No-show',            cls: 'bg-amber-50 text-amber-700 border-amber-200' },
            perdemos:  { label: '❌ Perdemos',            cls: 'bg-red-50 text-red-700 border-red-200' },
            reagendou: { label: '🔄 Reagendamento feito', cls: 'bg-brand-50 text-brand-700 border-brand-200' },
          }
          const resultadoInfo = resultado ? resultadoMap[resultado] : null
          const statusCor = ag.status === 'confirmada' || ag.status === 'confirmado' ? 'border-l-brand-500'
            : ag.status === 'realizada' || ag.status === 'realizado' ? 'border-l-emerald-500'
            : 'border-l-amber-500'

          return (
          <div key={ag.id} className={clsx('card border-l-4', statusCor)}>
            <div className="p-4">

              {/* Linha 1 — Header do card */}
              <div className="flex items-start justify-between mb-3 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                    <Building2 size={18} className="text-brand-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-gray-900">{ag.empresa}</span>
                      {ag.campanha && <span className="text-2xs font-medium bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-full px-2 py-0.5">📋 {ag.campanha}</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {ag.cnpj && <span className="text-2xs text-gray-400 font-mono">CNPJ: {ag.cnpj}</span>}
                      {ag.segmento && <span className="text-2xs text-gray-400">· {ag.segmento}</span>}
                    </div>
                  </div>
                </div>

                {/* Status + resultado — leitura, não input */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={clsx('badge text-2xs',
                    ag.status === 'confirmada' || ag.status === 'confirmado' ? 'badge-success' :
                    ag.status === 'realizada'  || ag.status === 'realizado'  ? 'badge-brand' :
                    'badge-amber'
                  )}>
                    {ag.status === 'confirmada' || ag.status === 'confirmado' ? '✓ Confirmada'
                      : ag.status === 'realizada' || ag.status === 'realizado' ? '✓ Realizada'
                      : 'Aguardando confirmação'}
                  </span>
                  {resultadoInfo
                    ? <span className={clsx('text-2xs font-semibold px-2 py-0.5 rounded-full border', resultadoInfo.cls)}>{resultadoInfo.label}</span>
                    : <span className="text-2xs text-gray-400 italic">Aguardando resultado do vendedor</span>
                  }
                </div>
              </div>

              {/* Linha 2 — Grid de informações */}
              <div className="grid grid-cols-4 gap-3">

                {/* Col 1 — Contato */}
                <div className="flex flex-col gap-2">
                  <div className="text-2xs font-semibold text-gray-400 uppercase tracking-wide">Reunião com</div>
                  <div className="bg-gray-50 rounded-lg p-2.5">
                    <div className="text-xs font-bold text-gray-900">{ag.contato}</div>
                    {ag.cargo && <div className="text-2xs text-brand-600 mt-0.5">{ag.cargo}</div>}
                    {ag.telefone && <div className="text-2xs text-gray-500 font-mono mt-1">{ag.telefone}</div>}
                    {ag.email && <div className="text-2xs text-brand-500 mt-0.5 truncate">{ag.email}</div>}
                    {ag.cidade && <div className="text-2xs text-gray-400 mt-0.5"><MapPin size={9} className="inline mr-0.5"/>{ag.cidade}{ag.estado ? ` · ${ag.estado}` : ''}</div>}
                  </div>
                </div>

                {/* Col 2 — Resumo da ligação */}
                <div className="flex flex-col gap-2">
                  <div className="text-2xs font-semibold text-gray-400 uppercase tracking-wide">Resumo da ligação</div>
                  <div className="text-xs text-gray-600 leading-relaxed bg-gray-50 rounded-lg p-2.5 border-l-2 border-brand-400 flex-1">
                    {ag.resumoLigacao || <span className="text-gray-400 italic">Sem resumo registrado</span>}
                  </div>
                  <div className="text-2xs text-gray-400">
                    Agente: <strong className="text-gray-700">{ag.agente}</strong>
                    {ag.duracaoLigacao && <> · {ag.duracaoLigacao}</>}
                  </div>
                </div>

                {/* Col 3 — Reunião (data + modalidade) */}
                <div className="flex flex-col gap-2">
                  <div className="text-2xs font-semibold text-gray-400 uppercase tracking-wide">Reunião agendada</div>
                  <div className="bg-gray-50 rounded-lg p-2.5">
                    <div className="text-sm font-bold text-gray-900 font-mono mb-1">{ag.dataHora || '—'}</div>
                    <span className={clsx('text-2xs font-semibold px-2 py-0.5 rounded-full border inline-block',
                      ag.modalidade === 'online'     ? 'bg-blue-50 text-blue-600 border-blue-200' :
                      ag.modalidade === 'presencial' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                                                       'bg-purple-50 text-purple-600 border-purple-200'
                    )}>
                      {ag.modalidade === 'online' ? '💻 Online' : ag.modalidade === 'presencial' ? '📍 Presencial' : '🔀 Híbrido'}
                    </span>
                  </div>

                  {/* Info específica por modalidade */}
                  {(ag.modalidade === 'online' || ag.modalidade === 'hibrido') && (
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-2">
                      <div className="text-2xs font-semibold text-blue-600 mb-1">Link da reunião</div>
                      {ag.meetLink
                        ? <a href={ag.meetLink} target="_blank" rel="noreferrer" className="text-2xs text-brand-600 hover:underline break-all">{ag.meetLink}</a>
                        : <span className="text-2xs text-gray-400 italic">Não gerado ainda</span>
                      }
                    </div>
                  )}
                  {(ag.modalidade === 'presencial' || ag.modalidade === 'hibrido') && (
                    <div className="bg-orange-50 border border-orange-100 rounded-lg p-2">
                      <div className="text-2xs font-semibold text-orange-600 mb-1">Local / Endereço</div>
                      {ag.endereco
                        ? <div className="text-2xs text-gray-700 leading-relaxed">
                            {ag.endereco}
                            {ag.complemento && <>, {ag.complemento}</>}
                            {ag.cidade && <>, {ag.cidade}</>}
                            {ag.estado && <> — {ag.estado}</>}
                            {ag.cep && <> · CEP {ag.cep}</>}
                          </div>
                        : <span className="text-2xs text-gray-400 italic">Endereço não informado</span>
                      }
                    </div>
                  )}
                </div>

                {/* Col 4 — Vendedor + nota + ações gestor */}
                <div className="flex flex-col gap-2">
                  <div className="text-2xs font-semibold text-gray-400 uppercase tracking-wide">Vendedor responsável</div>
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2.5">
                    <div className="w-7 h-7 rounded-full bg-brand-50 text-brand-600 text-2xs font-bold flex items-center justify-center flex-shrink-0">{ag.vendedorIniciais}</div>
                    <div>
                      <div className="text-xs font-semibold text-gray-900">{ag.vendedor}</div>
                      <div className={clsx('text-2xs mt-0.5', ag.noShowRisk < 25 ? 'text-emerald-600' : 'text-amber-600')}>
                        No-show: {ag.noShowRisk}% — {ag.noShowRisk < 25 ? 'baixo risco' : 'médio risco'}
                      </div>
                    </div>
                  </div>

                  {/* Nota do vendedor (read-only para o gestor) */}
                  {ag.notaVendedor && (
                    <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-2">
                      <div className="text-2xs font-semibold text-yellow-700 mb-1">📝 Nota do vendedor</div>
                      <div className="text-2xs text-gray-600 leading-relaxed">{ag.notaVendedor}</div>
                    </div>
                  )}

                  {/* Confirmar reunião — só para pendente/agendada */}
                  {(ag.status === 'pendente' || ag.status === 'agendada') && (
                    <button
                      className="text-xs font-semibold py-1.5 px-2 rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-50 bg-white transition-colors"
                      onClick={() => reunioesApi.update(ag.id, { status: 'confirmada' }).then(() => refetchAgendamentos()).catch(console.error)}
                    >✓ Confirmar reunião</button>
                  )}

                  {/* Reatribuir vendedor — sempre visível */}
                  <div className="relative">
                    <button
                      onClick={() => setReatribuirAberto(reatribuirAberto === ag.id ? null : ag.id)}
                      className="w-full flex items-center justify-between gap-2 text-xs font-semibold py-1.5 px-3 rounded-lg border border-brand-200 text-brand-700 bg-brand-50 hover:bg-brand-100 transition-colors"
                    >
                      <span>↔ Reatribuir vendedor</span>
                      <span className="text-brand-400">{reatribuirAberto === ag.id ? '▲' : '▼'}</span>
                    </button>
                    {reatribuirAberto === ag.id && (
                      <div className="absolute bottom-full left-0 right-0 mb-1 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden z-20">
                        <div className="px-3 py-2 border-b border-gray-100">
                          <p className="text-2xs font-semibold text-gray-400 uppercase tracking-wide">Selecionar vendedor</p>
                        </div>
                        {equipeRaw.map((v: any) => {
                          const iniciais = (v.nome as string).split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                          const isAtual = ag.vendedor === v.nome
                          return (
                            <button
                              key={v.id}
                              onClick={() => {
                                reunioesApi.update(ag.id, { vendedor_nome: v.nome }).then(() => { refetchAgendamentos(); setReatribuirAberto(null) }).catch(console.error)
                              }}
                              className={clsx('w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-brand-50', isAtual ? 'bg-brand-50/60' : 'bg-white')}
                            >
                              <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 text-2xs font-bold flex items-center justify-center flex-shrink-0">{iniciais}</div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold text-gray-900 truncate">{v.nome}</div>
                                {v.modalidade && <div className="text-2xs text-gray-400">{v.modalidade === 'online' ? '💻 Online' : v.modalidade === 'presencial' ? '📍 Presencial' : '🔀 Híbrido'}</div>}
                              </div>
                              {isAtual && <span className="text-2xs text-brand-500 font-semibold flex-shrink-0">atual</span>}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  <button onClick={() => setModalJornada(ag)} className="text-2xs font-semibold text-brand-600 hover:text-brand-700 mt-auto text-center">📋 Ver jornada completa →</button>
                </div>
              </div>
            </div>
          </div>
          )
        })}
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
                          <a href={modalJornada.meetLink.startsWith('http') ? modalJornada.meetLink : `https://${modalJornada.meetLink}`} target="_blank" rel="noreferrer" className="text-xs text-brand-500 hover:underline break-all">{modalJornada.meetLink}</a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Painel de acompanhamento — somente leitura para admin/gestor */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="text-2xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Vendedor</div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-2xs font-bold flex items-center justify-center">
                        {(modalJornada.vendedor || 'VD').split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase()}
                      </div>
                      <span className="text-xs font-semibold text-gray-900">{modalJornada.vendedor || '—'}</span>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="text-2xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Risco No-show</div>
                    <div className={clsx('text-sm font-bold', modalJornada.noShowRisk < 25 ? 'text-emerald-600' : 'text-amber-600')}>
                      {modalJornada.noShowRisk}%
                    </div>
                    <div className={clsx('text-2xs', modalJornada.noShowRisk < 25 ? 'text-emerald-500' : 'text-amber-500')}>
                      {modalJornada.noShowRisk < 25 ? 'Baixo risco' : 'Médio risco'}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="text-2xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Resultado</div>
                    {modalJornada.resultado
                      ? <div className={clsx('text-xs font-bold',
                          modalJornada.resultado === 'fechou'   ? 'text-emerald-600' :
                          modalJornada.resultado === 'noshow'   ? 'text-amber-600' :
                          modalJornada.resultado === 'perdemos' ? 'text-red-600' : 'text-brand-600'
                        )}>
                          {{ fechou:'💰 Negócio fechado', noshow:'👻 No-show', perdemos:'❌ Perdemos', reagendou:'🔄 Reagendado' }[modalJornada.resultado] ?? modalJornada.resultado}
                        </div>
                      : <div className="text-xs text-gray-400 italic">Aguardando vendedor</div>
                    }
                  </div>
                </div>

                {/* Nota do vendedor */}
                {modalJornada.notaVendedor && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Nota do vendedor</h3>
                    <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3">
                      <p className="text-sm text-gray-700 leading-relaxed">{modalJornada.notaVendedor}</p>
                    </div>
                  </div>
                )}

                {/* Aviso read-only */}
                <div className="flex items-center gap-2 bg-brand-50 border border-brand-100 rounded-xl px-4 py-3">
                  <span className="text-brand-400">🔒</span>
                  <p className="text-xs text-brand-600">A jornada é atualizada pelo vendedor na área dele. Aqui você acompanha o progresso em tempo real.</p>
                </div>
              </div>

              <div className="flex gap-3 px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white">
                <button onClick={() => setModalJornada(null)} className="btn-primary flex-1">Fechar</button>
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

  // Agentes de IA (não vendedores)
  const { data: agentesRaw = [] } = useQuery({
    queryKey: ['agentes'],
    queryFn: () => agentesApi.list().then(r => r.data as any[]),
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

  // Usa fallback quando a API não retorna dados (demo / sem gravações reais)
  const gravacoesList = gravacoesBruto.length > 0 ? gravacoesBruto : GRAVACOES_FALLBACK

  // Opções de agente: da API de agentes; complementa com nomes únicos das gravações
  const agentesOpcoes = agentesRaw.length > 0
    ? agentesRaw.map((a: any) => a.nome as string)
    : [...new Set(gravacoesList.map(g => g.agente).filter(n => n && n !== '—'))]

  const gravacoes = gravacoesList.filter(g => {
    if (filtroAgente && g.agente !== filtroAgente) return false
    if (filtroResultado && g.resultado !== filtroResultado) return false
    if (filtroTipo && g.tipo !== filtroTipo) return false
    return true
  })

  const [playing, setPlaying] = useState<string | null>(null)
  const [progresso, setProgresso] = useState(0)
  const [analisando, setAnalisando] = useState(false)
  const [analiseMsg, setAnaliseMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!playing) { setProgresso(0); return }
    const timer = setInterval(() => {
      setProgresso(p => p >= 100 ? 100 : p + 1)
    }, 300)
    return () => clearInterval(timer)
  }, [playing])

  async function acionarCI() {
    setAnalisando(true)
    setAnaliseMsg(null)
    try {
      const res = await inteligenciaApi.detectarPadroes()
      const padroes = (res.data as any)?.padroes ?? []
      setAnaliseMsg(padroes.length > 0
        ? `✓ ${padroes.length} padrão${padroes.length > 1 ? 'ões' : ''} detectado${padroes.length > 1 ? 's' : ''} e enviado${padroes.length > 1 ? 's' : ''} ao CI`
        : '✓ Análise concluída — nenhum novo padrão encontrado')
    } catch {
      setAnaliseMsg('Erro ao acionar CI — tente novamente')
    } finally {
      setAnalisando(false)
      setTimeout(() => setAnaliseMsg(null), 5000)
    }
  }

  const resultadoLabel = { agendou:'Agendou', retornar:'Retornar', nao_atendeu:'Não atendeu' } as const
  const resultadoCls   = { agendou:'badge-success', retornar:'badge-amber', nao_atendeu:'badge-neutral' } as const
  const tipoLabel = { ia:'Agente IA', manual:'Manual', transferencia:'Transferência' } as const
  const tipoCls   = { ia:'badge-brand', manual:'badge-neutral', transferencia:'badge-purple' } as const

  return (
    <div className="flex flex-col gap-4">
      {/* Painel CI — aprendizado automático */}
      <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 flex gap-3 items-start">
        <span className="text-xl flex-shrink-0">🧠</span>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-purple-800 mb-1">Todas as ligações alimentam o Centro de Inteligência automaticamente</p>
              <p className="text-xs text-purple-700 leading-relaxed">
                Cada chamada — seja do agente de IA, manual ou transferência — é analisada com Claude após o encerramento. Scores de qualidade, sinais de compra e padrões de sucesso são extraídos e compartilhados via cross-cliente.
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              <button
                onClick={acionarCI}
                disabled={analisando}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white text-xs font-semibold transition-colors whitespace-nowrap"
              >
                <Brain size={12} className={analisando ? 'animate-pulse' : ''}/>
                {analisando ? 'Analisando…' : 'Analisar padrões'}
              </button>
              {analiseMsg && (
                <span className={clsx('text-2xs font-medium', analiseMsg.startsWith('✓') ? 'text-purple-700' : 'text-red-600')}>
                  {analiseMsg}
                </span>
              )}
            </div>
          </div>
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
            {agentesOpcoes.map((nome: string) => <option key={nome} value={nome}>{nome}</option>)}
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
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_80px_100px] px-4 py-2 bg-gray-50 border-b border-gray-100 items-center">
          {['Empresa / Contato','Agente','Tipo','Data / Hora','Duração','Resultado','CI','Ações'].map(h => (
            <span key={h} className="text-2xs font-semibold text-gray-400 uppercase tracking-wide">{h}</span>
          ))}
        </div>
        {(filtroAgente || filtroTipo || filtroResultado) && (
          <div className="px-4 py-2 bg-brand-50 border-b border-brand-100 flex items-center justify-between">
            <span className="text-xs text-brand-700 font-medium">
              {gravacoes.length} de {gravacoesList.length} gravação{gravacoesList.length !== 1 ? 'ões' : ''} encontrada{gravacoes.length !== 1 ? 's' : ''}
            </span>
            <button onClick={() => { setFiltroAgente(''); setFiltroTipo(''); setFiltroResultado('') }}
              className="text-xs text-brand-600 hover:text-brand-800 font-medium flex items-center gap-1">
              <X size={11}/> Limpar filtros
            </button>
          </div>
        )}
        {gravacoes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Mic size={32} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">Nenhuma gravação disponível</p>
            <p className="text-xs mt-1">As gravações de chamadas encerradas aparecerão aqui.</p>
          </div>
        )}
        {gravacoes.map((g, i) => (
          <div key={g.id} className={clsx('grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_80px_100px] px-4 py-3 border-b border-gray-100 items-center', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40')}>
            <div>
              <div className="text-sm font-medium text-gray-900">{g.empresa}</div>
              <div className="text-xs text-gray-500">{g.contato}</div>
            </div>
            <div className="text-xs text-gray-700">{g.agente}</div>
            <div><span className={clsx('badge text-2xs', tipoCls[g.tipo])}>{tipoLabel[g.tipo]}</span></div>
            <div className="text-xs text-gray-500">{g.data}</div>
            <div className="text-xs font-mono text-gray-600">{g.duracao}</div>
            <div><span className={clsx('badge text-2xs', resultadoCls[g.resultado])}>{resultadoLabel[g.resultado]}</span></div>

            {/* Coluna CI — score + status */}
            <div className="flex flex-col gap-0.5">
              {g.icp > 0 ? (
                <>
                  <span className="text-2xs text-purple-700 font-semibold flex items-center gap-1">
                    <Brain size={10}/> CI ✓
                  </span>
                  <span className="text-2xs text-purple-500 font-mono">ICP {g.icp}</span>
                </>
              ) : (
                <span className="text-2xs text-gray-400 flex items-center gap-1" title="Análise CI ainda não concluída">
                  <Brain size={10}/> pendente
                </span>
              )}
            </div>

            {/* Ações */}
            <div className="flex items-center gap-2">
              <button onClick={() => setPlaying(playing === g.id ? null : g.id)} className={clsx('p-1.5 rounded-lg border transition-colors', playing === g.id ? 'bg-brand-500 border-brand-500 text-white' : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-brand-50 hover:border-brand-300')}>
                {playing === g.id ? <Pause size={12}/> : <Play size={12}/>}
              </button>
              {g.url_gravacao ? (
                <a href={g.url_gravacao} target="_blank" rel="noopener noreferrer"
                  className="p-1.5 rounded-lg border bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200 transition-colors inline-flex items-center">
                  <Download size={12}/>
                </a>
              ) : (
                <button disabled className="p-1.5 rounded-lg border bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed" title="Gravação não disponível">
                  <Download size={12}/>
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
  useAuthStore()

  // ── WebRTC (microfone do browser → cliente) ──────────────────────────────
  const [webrtc, webrtcActions] = useWebRTCPhone()

  // ── Formulário ────────────────────────────────────────────────────────────
  const [busca, setBusca]     = useState('')
  const [motivo]              = useState('Chamada manual')
  const [anotacao, setAnotacao] = useState('')
  const [notaEmChamada, setNotaEmChamada] = useState('')
  const [contato, setContato] = useState<{ id?: string; nome: string; empresa: string; tel: string; email: string } | null>(null)
  const [numero, setNumero]   = useState('')

  // ── Estado da sessão ──────────────────────────────────────────────────────
  const [ligacaoId, setLigacaoId] = useState<string | null>(null)
  const [resultado, setResultado] = useState<string | null>(null)

  // ── WhatsApp ──────────────────────────────────────────────────────────────
  const [waLoading, setWaLoading]   = useState(false)
  const [waMsg, setWaMsg]           = useState<string | null>(null)
  const [waMsgTexto, setWaMsgTexto] = useState('')
  const [waHistorico, setWaHistorico] = useState<Array<{ direcao: string; mensagem: string; criado_em: string }>>([])

  // ── DTMF teclado ──────────────────────────────────────────────────────────
  const [mostrarDtmf, setMostrarDtmf] = useState(false)
  const [toastCtrl, setToastCtrl]     = useState<string | null>(null)

  // ── CallCard ──────────────────────────────────────────────────────────────
  const [callCard, setCallCard] = useState<any | null>(null)

  // Mapeamentos do status WebRTC para lógica de UI
  const chamandoAtiva = webrtc.status === 'ringing' || webrtc.status === 'active'
  const faseAtendida  = webrtc.status === 'active'
  const faseDiscando  = webrtc.status === 'ringing'
  const timer         = webrtc.timer
  const mudo          = webrtc.muted
  const emEspera      = webrtc.held

  function toastControl(m: string) { setToastCtrl(m); setTimeout(() => setToastCtrl(null), 3000) }

  // Quando WebRTC detecta fim de chamada (cliente desligou), abre card de classificação
  const prevStatusRef = useRef<string>('')
  useEffect(() => {
    if (webrtc.status === 'hangup' && prevStatusRef.current === 'active') {
      // Chamada foi encerrada pelo cliente (não pelo botão Desligar)
      // O botão Desligar já chama abrirCardClassificacao() diretamente
      if (!callCard) abrirCardClassificacao()
      refetchHistorico()
    }
    prevStatusRef.current = webrtc.status
  }, [webrtc.status]) // eslint-disable-line react-hooks/exhaustive-deps

  // Busca de contatos via API
  const { data: sugestoesRaw = [] } = useQuery({
    queryKey: ['contatos-busca', busca],
    queryFn: () => contatosApi.search(busca).then(r => (r.data as any).data ?? r.data ?? []),
    enabled: busca.length > 1,
  })
  const sugestoes = (sugestoesRaw as any[]).map((c: any) => ({
    id:      c.id,
    nome:    c.nome    ?? '—',
    empresa: c.razao_social ?? c.empresa ?? '—',
    tel:     c.telefone ?? '',
    email:   c.email   ?? '',
  }))

  // Histórico de chamadas manuais
  const { data: historicoRaw = [], refetch: refetchHistorico } = useQuery({
    queryKey: ['ligacoes-manual'],
    queryFn:  () => ligacoesApi.list({ status: 'encerrada' }).then(r =>
      (r.data as any[]).filter(l => l.tipo_ligacao === 'manual').slice(0, 10)
    ),
    refetchInterval: 15000,
  })

  // Ativa o microfone e conecta ao Telnyx
  async function ativarMicrofone() {
    await webrtcActions.init()
  }

  async function ligar() {
    const tel = contato?.tel || numero
    if (!tel) return
    setResultado(null)
    setNotaEmChamada('')
    setMostrarDtmf(false)

    // Se não conectado ainda, inicializa primeiro e aguarda pronto
    if (webrtc.status === 'idle' || webrtc.status === 'error') {
      const ok = await webrtcActions.init()
      if (!ok) return
      // Aguarda status virar 'ready' (máx 8s)
      await new Promise<void>(resolve => {
        const t = setTimeout(resolve, 8000)
        const check = setInterval(() => {
          // status atualizado via hook — interval re-read via closure não funciona
          // mas dial() internamente verifica clientRef
          clearInterval(check)
          clearTimeout(t)
          resolve()
        }, 3000)
      })
    }

    // Se veio de uma chamada encerrada, reseta estado do hook
    if (webrtc.status === 'hangup') {
      webrtcActions.reset()
    }

    const id = await webrtcActions.dial(tel, {
      motivo,
      anotacao:   anotacao || undefined,
      contato_id: contato?.id,
    })
    if (id) setLigacaoId(id)
  }

  // Monta o card com os dados da chamada atual para classificação
  function abrirCardClassificacao() {
    const tel = contato?.tel || numero
    const cardData: any = {
      id: ligacaoId,
      numero_destino: tel,
      motivo,
      anotacao_pre: anotacao || undefined,
      nota_pos_chamada: notaEmChamada || undefined,
      contatos: contato ? { nome: contato.nome, empresa: contato.empresa } : null,
      url_gravacao: null,
      resultado: null,
      _isCurrentCall: true,  // flag: ao salvar, reseta o form
    }
    setCallCard(cardData)
  }

  function desligar() {
    webrtcActions.hangup()
    if (ligacaoId) {
      ligacoesApi.update(ligacaoId, { status: 'encerrada' }).catch(() => {})
    }
    abrirCardClassificacao()
    refetchHistorico()
  }

  async function enviarWhatsApp() {
    const tel = contato?.tel || numero
    const texto = waMsgTexto.trim() || motivo
    if (!tel || !texto) return
    setWaLoading(true)
    setWaMsg(null)
    try {
      await whatsappUsuarioApi.enviar({ telefone: tel, mensagem: texto })
      const nova = { direcao: 'enviada', mensagem: texto, criado_em: new Date().toISOString() }
      setWaHistorico(h => [...h, nova])
      setWaMsgTexto('')
      setWaMsg('✓ Mensagem enviada pelo seu WhatsApp')
    } catch (e: any) {
      const err = e?.response?.data?.error ?? 'Erro ao enviar'
      setWaMsg(err.includes('não conectado')
        ? 'WhatsApp não conectado — conecte em Configurações → Meu WhatsApp'
        : 'Erro ao enviar — ' + err)
    } finally {
      setWaLoading(false)
      setTimeout(() => setWaMsg(null), 6000)
    }
  }

  const formatTimer = (s: number) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

  const resultadoMap: Record<string, string> = {
    reagendou:    'Reagendamento confirmado',
    confirmou:    'Presença confirmada',
    nao_atendeu:  'Não atendeu — cadência iniciada',
    encerrar:     'Chamada encerrada',
  }

  // Templates WhatsApp pré-definidos
  const WA_TEMPLATES = [
    { id:'nao_atendeu',   label:'Não atendeu',        texto: `Olá${contato?.nome ? `, ${contato.nome}` : ''}! 👋 Ligamos agora mas não conseguimos falar com você. Gostaria de conversar? Posso te ligar novamente ou prefere marcar um horário? 📅` },
    { id:'follow_up',     label:'Follow-up',           texto: `Olá${contato?.nome ? `, ${contato.nome}` : ''}! 😊 Passando para dar continuidade ao nosso contato. Tem algum momento para conversarmos? 🚀` },
    { id:'confirmacao',   label:'Confirmar reunião',   texto: `Olá${contato?.nome ? `, ${contato.nome}` : ''}! ✅ Confirmando nossa reunião agendada. Qualquer dúvida é só responder aqui. Até lá!` },
    { id:'reagendamento', label:'Reagendamento',       texto: `Olá${contato?.nome ? `, ${contato.nome}` : ''}! 🔄 Preciso reagendar nossa conversa. Qual seria o melhor horário para você?` },
    { id:'proposta',      label:'Proposta comercial',  texto: `Olá${contato?.nome ? `, ${contato.nome}` : ''}! 💼 Gostaria de apresentar uma proposta personalizada para ${contato?.empresa ?? 'sua empresa'}. Podemos conversar?` },
    { id:'personalizada', label:'✏️ Personalizada',    texto: '' },
  ]

  return (
    <>
    {/* Elemento de áudio oculto para reprodução do áudio remoto (WebRTC) */}
    <audio id="etz-webrtc-remote-audio" autoPlay style={{ display: 'none' }}/>
    {callCard && (
      <CallCardModal
        callCard={callCard}
        onClose={() => setCallCard(null)}
        onSave={(res, _nota) => {
          setCallCard(null)
          if (callCard._isCurrentCall) {
            setResultado(res || 'encerrar')
            webrtcActions.reset()
          }
          refetchHistorico()
        }}
      />
    )}
    <div className="grid grid-cols-[340px_1fr_360px] gap-4">

      {/* ── Col 1: Contato + Ligação ── */}
      <div className="flex flex-col gap-3">
        <div className="card">
          <div className="p-4 border-b border-gray-100 flex items-center gap-2">
            <Phone size={15} className="text-brand-600"/>
            <h3 className="text-sm font-semibold text-gray-900">Chamada manual</h3>
          </div>
          <div className="p-4 flex flex-col gap-3">

            {/* Busca de contato */}
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1.5">Buscar contato</label>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                <input className="input pl-9" placeholder="Nome, empresa ou telefone..." value={busca} onChange={e => setBusca(e.target.value)}/>
              </div>
              {sugestoes.length > 0 && (
                <div className="border border-brand-300 rounded-lg overflow-hidden mt-1 shadow-sm">
                  {sugestoes.map(s => (
                    <div key={s.id} className="p-2.5 hover:bg-brand-50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors"
                      onClick={() => {
                        setContato(s); setBusca('')
                        if (s.tel) whatsappUsuarioApi.historico(s.tel).then(r => setWaHistorico(r.data as any[])).catch(() => {})
                      }}>
                      <div className="text-sm font-medium text-gray-900">{s.nome}</div>
                      <div className="text-xs text-gray-500">{s.empresa} · {s.tel}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Contato selecionado */}
            {contato ? (
              <div className="bg-brand-50 rounded-xl p-3 border border-brand-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-brand-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {contato.nome.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">{contato.nome}</div>
                    <div className="text-xs text-gray-500 truncate">{contato.empresa}</div>
                  </div>
                  <button onClick={() => { setContato(null); setWaHistorico([]) }} className="p-1 rounded-lg hover:bg-brand-100">
                    <XCircle size={14} className="text-brand-400"/>
                  </button>
                </div>
                <div className="text-xs font-mono text-brand-700 font-semibold">{contato.tel}</div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2"><div className="flex-1 h-px bg-gray-200"/><span className="text-2xs text-gray-400">ou número avulso</span><div className="flex-1 h-px bg-gray-200"/></div>
                <input className="input font-mono text-sm tracking-widest" placeholder="(11) 99999-9999"
                  type="tel" value={numero} onChange={e => setNumero(e.target.value)}/>
              </>
            )}

            {/* Status WebRTC */}
            {webrtc.status === 'idle' && (
              <button onClick={ativarMicrofone}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold hover:bg-brand-100 transition-colors">
                <Mic size={13}/> Ativar microfone do computador
              </button>
            )}
            {(webrtc.status === 'initializing' || webrtc.status === 'connecting') && (
              <div className="flex items-center gap-2 py-2 px-3 bg-blue-50 border border-blue-200 rounded-xl">
                <RefreshCw size={12} className="text-blue-600 animate-spin"/>
                <span className="text-xs text-blue-700 font-medium">Conectando ao Telnyx…</span>
              </div>
            )}
            {webrtc.status === 'ready' && (
              <div className="flex items-center gap-2 py-2 px-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>
                <span className="text-xs text-emerald-700 font-medium">Microfone ativo — pronto para ligar</span>
              </div>
            )}
            {webrtc.status === 'error' && (
              <div className="flex flex-col gap-1 py-2 px-3 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-red-700 font-medium">
                    {webrtc.setupRequired ? '⚙️ Configuração necessária' : '❌ Erro WebRTC'}
                  </span>
                  <button onClick={ativarMicrofone} className="text-2xs text-red-600 underline">Tentar novamente</button>
                </div>
                {webrtc.setupRequired && (
                  <p className="text-2xs text-red-600">
                    Crie uma <b>Credential-Based SIP Connection</b> no painel Telnyx e adicione o ID como <code>TELNYX_SIP_CONNECTION_ID</code> no Railway.
                  </p>
                )}
                {!webrtc.setupRequired && webrtc.error && (
                  <p className="text-2xs text-red-500 truncate">{webrtc.error}</p>
                )}
              </div>
            )}

            {/* Observação rápida (opcional) */}
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1.5">
                Observação <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <input className="input text-xs" placeholder="Ex: não atendeu o Meet, tentar reagendar..."
                value={anotacao} onChange={e => setAnotacao(e.target.value)}/>
            </div>

            <button
              onClick={ligar}
              disabled={chamandoAtiva || (!contato && !numero) || webrtc.status === 'initializing' || webrtc.status === 'connecting'}
              className="btn-primary w-full justify-center gap-2 py-2.5 text-sm disabled:opacity-60">
              <Phone size={14}/>
              {chamandoAtiva                                              ? '📞 Em ligação...'
                : webrtc.status === 'ready'                              ? '📞 Ligar agora'
                : webrtc.status === 'initializing' || webrtc.status === 'connecting' ? 'Conectando…'
                : webrtc.status === 'hangup'                             ? '📞 Ligar novamente'
                : '🎤 Ativar e ligar'}
            </button>
          </div>
        </div>

        {/* Histórico de chamadas */}
        <div className="card p-4">
          <h3 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Últimas chamadas</h3>
          {historicoRaw.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-3">Nenhuma chamada manual ainda.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {(historicoRaw as any[]).slice(0,8).map((h: any, i: number) => {
                const res = (h.resultado ?? 'encerrada') as string
                const labelMap: Record<string,string> = { reagendou:'Reagendou', confirmou:'Confirmou', nao_atendeu:'Não atendeu', encerrada:'Encerrada', agendada:'Agendou' }
                const cls = res === 'confirmou' || res === 'agendada' ? 'badge-success' : res === 'nao_atendeu' ? 'badge-amber' : 'badge-neutral'
                const dur = h.duracao_segundos ? `${Math.floor(h.duracao_segundos/60)}m${String(h.duracao_segundos%60).padStart(2,'0')}s` : null
                return (
                  <button key={h.id ?? i} onClick={() => setCallCard(h)}
                    className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 hover:bg-brand-50 hover:border-brand-200 border border-transparent transition-colors text-left w-full">
                    <User size={12} className="text-gray-400 flex-shrink-0"/>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-800 truncate">{h.contatos?.nome ?? h.numero_destino ?? '—'}</div>
                      <div className="text-2xs text-gray-400 truncate">{h.motivo ?? h.contatos?.empresa}</div>
                    </div>
                    <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                      <span className={clsx('badge text-2xs', cls)}>{labelMap[res] ?? res}</span>
                      {dur && <span className="text-2xs text-gray-400">{dur}</span>}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Col 2: Chamada ativa ── */}
      <div className="flex flex-col gap-4">
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
            <div className="p-5">
              {/* Info do contato + timer */}
              <div className="flex flex-col items-center mb-4">
                <div className="relative w-16 h-16 mb-3">
                  <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-50"/>
                  <div className="relative w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Phone size={24} className="text-white"/>
                  </div>
                </div>
                <div className="text-base font-bold text-gray-900">{contato?.nome ?? (contato?.tel || numero)}</div>
                <div className="text-xs text-gray-500">{contato?.empresa ?? 'Contato manual'}</div>
                <div className="text-2xl font-mono font-bold text-gray-900 mt-1">{formatTimer(timer)}</div>
                {faseDiscando && (
                  <span className="flex items-center gap-1.5 mt-1 text-2xs font-semibold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                    <RefreshCw size={10} className="animate-spin"/> Discando…
                  </span>
                )}
                {faseAtendida && (
                  <span className="badge badge-success mt-1 animate-pulse text-2xs">● Em chamada</span>
                )}
                {motivo && <span className="text-2xs text-gray-500 font-medium mt-0.5 text-center">{motivo}</span>}
              </div>

              {/* Aviso quando discando */}
              {faseDiscando && (
                <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-center">
                  <p className="text-xs text-amber-700 font-medium">🔊 Aguardando o cliente atender…</p>
                  <p className="text-2xs text-amber-500 mt-0.5">Os controles ficam disponíveis quando ele atender</p>
                </div>
              )}

              {/* ── Botão Desligar (sempre visível durante chamada) ── */}
              <div className="flex justify-center mb-4">
                <button onClick={desligar}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors shadow-sm">
                  <PhoneOff size={15}/> Desligar
                </button>
              </div>

              {/* ── Controles de chamada (só quando atendida) ── */}
              <div className={clsx('flex items-center justify-center gap-3 mb-4 pb-4 border-b border-gray-100', !faseAtendida && 'opacity-30 pointer-events-none')}>
                {/* Mudo */}
                <button
                  onClick={() => {
                    webrtcActions.toggleMute()
                    toastControl(mudo ? 'Microfone ativado' : 'Microfone mudo')
                  }}
                  title={mudo ? 'Ativar microfone' : 'Mutar microfone'}
                  className={clsx(
                    'flex flex-col items-center gap-1 w-14 py-2 rounded-xl border text-2xs font-medium transition-colors',
                    mudo ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  )}>
                  {mudo ? <MicOff size={16}/> : <Mic size={16}/>}
                  {mudo ? 'Mudo' : 'Mudo'}
                </button>

                {/* Espera */}
                <button
                  onClick={() => {
                    webrtcActions.toggleHold()
                    toastControl(emEspera ? 'Chamada retomada' : 'Chamada em espera')
                  }}
                  title={emEspera ? 'Retomar chamada' : 'Colocar em espera'}
                  className={clsx(
                    'flex flex-col items-center gap-1 w-14 py-2 rounded-xl border text-2xs font-medium transition-colors',
                    emEspera ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  )}>
                  <PauseCircle size={16}/>
                  {emEspera ? 'Espera' : 'Espera'}
                </button>

                {/* Teclado DTMF */}
                <button
                  onClick={() => setMostrarDtmf(d => !d)}
                  title="Teclado numérico (URA)"
                  className={clsx(
                    'flex flex-col items-center gap-1 w-14 py-2 rounded-xl border text-2xs font-medium transition-colors',
                    mostrarDtmf ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  )}>
                  <Hash size={16}/>
                  Teclado
                </button>
              </div>

              {/* Teclado DTMF expandido */}
              {mostrarDtmf && (
                <div className="mb-4 bg-gray-50 rounded-xl p-3 border border-gray-200">
                  <p className="text-2xs text-gray-500 text-center mb-2 font-medium">Teclado para URA / menus automáticos</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {['1','2','3','4','5','6','7','8','9','*','0','#'].map(d => (
                      <button key={d}
                        onClick={async () => {
                          webrtcActions.sendDtmf(d); toastControl(`Dígito ${d} enviado`)
                        }}
                        className="h-9 rounded-lg bg-white border border-gray-200 text-sm font-bold text-gray-700 hover:bg-brand-50 hover:border-brand-300 hover:text-brand-700 transition-colors">
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Anotações */}
              <div className="mb-3">
                <label className="text-xs font-medium text-gray-700 block mb-1">
                  Anotações durante a chamada
                  <span className="text-gray-400 font-normal ml-1">(salvas ao encerrar)</span>
                </label>
                <textarea
                  className="input min-h-[70px] resize-none text-xs"
                  disabled={faseDiscando}
                  value={notaEmChamada}
                  onChange={e => setNotaEmChamada(e.target.value)}
                  placeholder={faseDiscando ? 'Disponível quando o cliente atender…' : 'Objeções, interesse, próximos passos...'}/>
              </div>

              {/* Classificação acontece ao encerrar — card abre automaticamente */}
              <p className="text-2xs text-gray-400 text-center">
                Ao encerrar, um card abre para você classificar a chamada.
              </p>

              {/* Toast controles */}
              {toastCtrl && (
                <div className="mt-3 text-center text-2xs text-gray-500 bg-gray-100 rounded-lg py-1.5 px-3 animate-fade-in">
                  {toastCtrl}
                </div>
              )}
            </div>
          )}

          {resultado && (
            <div className="flex flex-col items-center justify-center py-10 text-center px-6">
              <CheckCircle2 size={36} className="text-emerald-500 mb-3"/>
              <div className="text-base font-bold text-gray-900">Resultado registrado</div>
              <div className="text-sm text-gray-500 mt-1">{resultadoMap[resultado] ?? resultado}</div>
              {notaEmChamada && (
                <div className="mt-3 text-xs text-gray-500 bg-gray-50 rounded-lg p-3 max-w-xs text-left w-full">
                  <span className="font-semibold text-gray-700 block mb-1">Anotação salva:</span>
                  {notaEmChamada}
                </div>
              )}
              {/* Badge CI */}
              <div className="mt-4 flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-xl px-4 py-2.5 max-w-xs w-full">
                <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center flex-shrink-0">
                  <Sparkles size={14} className="text-white"/>
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-brand-800">Enviada ao Centro de Inteligência</p>
                  <p className="text-2xs text-brand-600">As anotações treinam o agente desta conta</p>
                </div>
              </div>
              <button onClick={() => { setResultado(null); setNotaEmChamada(''); setAnotacao(''); setContato(null); setNumero(''); webrtcActions.reset() }}
                className="btn-secondary mt-4 text-sm gap-2">
                <RotateCcw size={13}/> Nova chamada
              </button>
            </div>
          )}
        </div>

      </div>{/* fim col 2 */}

      {/* ── Col 3: WhatsApp ── */}
      <div className="flex flex-col gap-3">
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare size={15} className="text-emerald-600"/>
              <h3 className="text-sm font-semibold text-gray-900">WhatsApp</h3>
            </div>
            <span className="text-2xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
              pelo seu número
            </span>
          </div>

          <div className="p-4 flex flex-col gap-3">
            {/* Contato alvo */}
            <div className="text-xs text-gray-500">
              {contato
                ? <span className="font-semibold text-gray-800">{contato.nome} · <span className="font-mono">{contato.tel}</span></span>
                : numero
                  ? <span className="font-mono text-gray-700">{numero}</span>
                  : <span className="text-gray-400 italic">Selecione um contato à esquerda</span>
              }
            </div>

            {/* Histórico de conversa */}
            <div className="min-h-[140px] max-h-56 overflow-y-auto flex flex-col gap-1.5 bg-gray-50 rounded-xl p-3 border border-gray-100">
              {waHistorico.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-6 text-center">
                  <MessageSquare size={22} className="text-gray-300 mb-2"/>
                  <p className="text-2xs text-gray-400">Histórico aparece aqui</p>
                </div>
              ) : waHistorico.map((m, i) => (
                <div key={i} className={`flex ${m.direcao === 'enviada' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-xl px-2.5 py-1.5 text-xs ${
                    m.direcao === 'enviada' ? 'bg-emerald-600 text-white' : 'bg-white border border-gray-200 text-gray-800'
                  }`}>
                    <p className="leading-relaxed">{m.mensagem}</p>
                    <p className={`text-2xs mt-0.5 ${m.direcao === 'enviada' ? 'text-emerald-200' : 'text-gray-400'}`}>
                      {new Date(m.criado_em).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Seletor de modelo */}
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1.5">Modelo de mensagem</label>
              <div className="grid grid-cols-2 gap-1.5">
                {WA_TEMPLATES.map(t => (
                  <button key={t.id}
                    onClick={() => setWaMsgTexto(t.texto)}
                    className={clsx(
                      'text-2xs font-medium py-1.5 px-2 rounded-lg border text-left transition-colors',
                      waMsgTexto === t.texto && t.texto !== ''
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-emerald-300 hover:bg-emerald-50'
                    )}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Campo de mensagem */}
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1.5">Mensagem</label>
              <textarea
                className="input min-h-[80px] resize-none text-xs"
                placeholder="Selecione um modelo acima ou escreva aqui..."
                value={waMsgTexto}
                onChange={e => setWaMsgTexto(e.target.value)}
              />
            </div>

            <button onClick={enviarWhatsApp}
              disabled={waLoading || (!contato && !numero) || !waMsgTexto.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
              style={{ backgroundColor: '#25d366', color: 'white' }}>
              <MessageSquare size={14}/>
              {waLoading ? 'Enviando…' : 'Enviar mensagem'}
            </button>

            {waMsg && (
              <p className={clsx('text-xs font-medium text-center', waMsg.startsWith('✓') ? 'text-emerald-600' : 'text-red-500')}>
                {waMsg}
              </p>
            )}
          </div>
        </div>
      </div>{/* fim col 3 */}

    </div>
    </>
  )
}

// ─── ABA AGENDA ──────────────────────────────────────────────────────────────

function TabAgenda() {
  const navigate = useNavigate()
  const [vendedorSel, setVendedorSel] = useState('')
  const [viewMode, setViewMode] = useState<'hoje' | 'semana' | 'mes'>('semana')
  const [semanaOffset, setSemanaOffset] = useState(0)
  const [mesOffset, setMesOffset] = useState(0)
  const [diaSel, setDiaSel] = useState('')          // para view Mês: dia clicado
  const [detalhe, setDetalhe] = useState<{ empresa: string; contato: string; hora: string; fim: string; meetLink?: string; linkMaps?: string; vendedor?: string; modalidade?: string; endereco?: string } | null>(null)
  const horas = ['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00']

  // Cores de avatar por índice de vendedor
  const vendedorCores = ['bg-brand-500','bg-emerald-500','bg-amber-500','bg-rose-500','bg-cyan-500','bg-violet-500']

  // Vendedores reais
  const { data: equipeRaw = [] } = useQuery({
    queryKey: ['equipe'],
    queryFn: () => equipeApi.list().then(r => r.data as any[]),
  })
  const vendedorAtual = (equipeRaw as any[]).find((v: any) => v.id === vendedorSel) ?? null

  // Reuniões reais
  const { data: reunioesRaw = [] } = useQuery({
    queryKey: ['reunioes-agenda'],
    queryFn: () => reunioesApi.list().then(r => r.data as any[]),
    refetchInterval: 30000,
  })

  const hoje = new Date()
  const hojeIso = hoje.toISOString().split('T')[0]

  // ── Semana ──────────────────────────────────────────────────────────────────
  const diaSemana = hoje.getDay()
  const segBase = new Date(hoje); segBase.setDate(hoje.getDate() - (diaSemana === 0 ? 6 : diaSemana - 1))
  const seg = new Date(segBase); seg.setDate(segBase.getDate() + semanaOffset * 7)
  const dias = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(seg); d.setDate(seg.getDate() + i)
    return { label: d.toLocaleDateString('pt-BR', { weekday:'short', day:'2-digit' }), iso: d.toISOString().split('T')[0] }
  })
  const labelSemana = `${dias[0].label.replace(/\./,'')} – ${dias[4].label.replace(/\./,'')}`

  // ── Mês ─────────────────────────────────────────────────────────────────────
  const mesRef = new Date(hoje.getFullYear(), hoje.getMonth() + mesOffset, 1)
  const labelMes = mesRef.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const primeiroDia = mesRef.getDay() // 0=dom
  const diasNoMes = new Date(mesRef.getFullYear(), mesRef.getMonth() + 1, 0).getDate()
  // Grade: começa no domingo anterior ao 1º do mês
  const totalCelulas = Math.ceil((primeiroDia + diasNoMes) / 7) * 7
  const celulas = Array.from({ length: totalCelulas }, (_, i) => {
    const offset = i - primeiroDia
    if (offset < 0 || offset >= diasNoMes) return null
    const d = new Date(mesRef.getFullYear(), mesRef.getMonth(), offset + 1)
    return d.toISOString().split('T')[0]
  })

  // Filtra reuniões por vendedor
  const reunioesFiltradas = (reunioesRaw as any[]).filter((r: any) => {
    if (!vendedorSel) return true
    return r.vendedor_id === vendedorSel || r.vendedor_nome === vendedorAtual?.nome
  })

  function corPorStatus(status: string): 'brand' | 'emerald' | 'amber' {
    if (status === 'realizada' || status === 'concluida') return 'emerald'
    if (status === 'pendente' || status === 'nao_confirmada') return 'amber'
    return 'brand'
  }

  type Evento = { hora: string; fim: string; empresa: string; contato: string; cor: 'brand' | 'emerald' | 'amber'; meetLink?: string; linkMaps?: string; vendedor?: string; modalidade?: string; endereco?: string; minuto: number; status?: string }
  const eventosPorDia: Record<string, Evento[]> = {}
  reunioesFiltradas.forEach((r: any) => {
    const inicio = r.inicio ?? r.data_hora; if (!inicio) return
    const d = new Date(inicio)
    const diaKey = d.toISOString().split('T')[0]
    const hora = d.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })
    const fimD = new Date(d.getTime() + (r.duracao_minutos ?? 30) * 60000)
    const fim  = fimD.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })
    if (!eventosPorDia[diaKey]) eventosPorDia[diaKey] = []
    eventosPorDia[diaKey].push({ hora, fim, empresa: r.empresa ?? r.empresa_nome ?? '—', contato: r.contato ?? r.contato_nome ?? '—', cor: corPorStatus(r.status ?? ''), meetLink: r.meet_link ?? r.meetLink, linkMaps: r.link_maps, vendedor: r.vendedor_nome, modalidade: r.modalidade, endereco: r.endereco, minuto: d.getHours() * 60 + d.getMinutes(), status: r.status })
  })

  function getEventoNaLinha(diaIso: string, horaLabel: string): Evento | undefined {
    const [hh] = horaLabel.split(':').map(Number)
    return eventosPorDia[diaIso]?.find(e => e.minuto >= hh * 60 && e.minuto < hh * 60 + 60)
  }

  const corMap = { brand:'bg-brand-100 border-l-brand-500 text-brand-700', emerald:'bg-emerald-50 border-l-emerald-500 text-emerald-700', amber:'bg-amber-50 border-l-amber-500 text-amber-700' }

  // KPIs sempre sobre reuniões filtradas
  const totalHoje = reunioesFiltradas.filter((r: any) => { const d = r.inicio ?? r.data_hora; return d && new Date(d).toDateString() === hoje.toDateString() }).length
  const totalSemana = reunioesFiltradas.filter((r: any) => { const d = r.inicio ?? r.data_hora; if (!d) return false; const dt = new Date(d); return dt >= seg && dt <= new Date(seg.getTime() + 4 * 86400000) }).length
  const totalMes = reunioesFiltradas.filter((r: any) => { const d = r.inicio ?? r.data_hora; if (!d) return false; const dt = new Date(d); return dt.getMonth() === hoje.getMonth() && dt.getFullYear() === hoje.getFullYear() }).length

  // Reuniões do dia selecionado (view mês) ou hoje (view hoje)
  const diaFoco = viewMode === 'mes' ? diaSel : hojeIso
  const reunioesDiaFoco = (eventosPorDia[diaFoco] ?? []).sort((a, b) => a.minuto - b.minuto)

  // Próximas reuniões para painel lateral
  const proximasReunioes = reunioesFiltradas
    .filter((r: any) => { const d = r.inicio ?? r.data_hora; return d && new Date(d) >= new Date() })
    .sort((a: any, b: any) => new Date(a.inicio ?? a.data_hora).getTime() - new Date(b.inicio ?? b.data_hora).getTime())
    .slice(0, 6)

  // Label do período navegado
  const labelPeriodo = viewMode === 'hoje'
    ? hoje.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
    : viewMode === 'semana' ? labelSemana
    : labelMes

  function navAnterior() {
    if (viewMode === 'semana') setSemanaOffset(o => o - 1)
    else if (viewMode === 'mes') setMesOffset(o => o - 1)
  }
  function navProximo() {
    if (viewMode === 'semana') setSemanaOffset(o => o + 1)
    else if (viewMode === 'mes') setMesOffset(o => o + 1)
  }
  function navHoje() {
    setSemanaOffset(0); setMesOffset(0)
  }

  return (
    <div className="flex flex-col gap-5">

      {/* ── BARRA DE FILTROS REDESENHADA ──────────────────────────────────────── */}
      <div className="card p-4 flex flex-col gap-4">
        {/* Linha 1: KPIs + botão sync */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {[
              { label: 'Hoje', value: totalHoje, color: 'text-brand-600', bg: 'bg-brand-50', click: () => setViewMode('hoje') },
              { label: 'Esta semana', value: totalSemana, color: 'text-gray-900', bg: 'bg-gray-50', click: () => setViewMode('semana') },
              { label: 'Este mês', value: totalMes, color: 'text-gray-900', bg: 'bg-gray-50', click: () => setViewMode('mes') },
            ].map(k => (
              <button key={k.label} onClick={k.click}
                className={clsx('flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all hover:shadow-sm', k.bg,
                  (viewMode === 'hoje' && k.label === 'Hoje') || (viewMode === 'semana' && k.label === 'Esta semana') || (viewMode === 'mes' && k.label === 'Este mês')
                    ? 'border-brand-300 shadow-sm' : 'border-transparent hover:border-gray-200'
                )}>
                <span className={clsx('text-2xl font-bold font-mono leading-none', k.color)}>{k.value}</span>
                <span className="text-xs text-gray-500 leading-tight text-left">{k.label}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {/* Toggle Hoje / Semana / Mês */}
            <div className="flex bg-gray-100 rounded-lg p-1 gap-0.5">
              {(['hoje','semana','mes'] as const).map(v => (
                <button key={v} onClick={() => setViewMode(v)}
                  className={clsx('px-3 py-1.5 rounded-md text-xs font-semibold transition-all capitalize',
                    viewMode === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  )}>
                  {v === 'hoje' ? 'Hoje' : v === 'semana' ? 'Semana' : 'Mês'}
                </button>
              ))}
            </div>
            <button className="btn-secondary text-xs py-1.5 gap-1.5" onClick={() => navigate('/config', { state: { tab: 'integracoes' } })}>
              <Calendar size={12}/> Sync Google Agenda
            </button>
          </div>
        </div>

        {/* Linha 2: chips de vendedores */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-2xs font-semibold text-gray-400 uppercase tracking-wide mr-1">Vendedor</span>
          {/* Chip "Todos" */}
          <button
            onClick={() => setVendedorSel('')}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
              !vendedorSel
                ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            )}
          >
            <div className={clsx('w-5 h-5 rounded-full flex items-center justify-center text-2xs font-bold flex-shrink-0', !vendedorSel ? 'bg-white/20' : 'bg-gray-100')}>
              <span className={!vendedorSel ? 'text-white' : 'text-gray-500'}>✦</span>
            </div>
            Todos
            {!vendedorSel && <span className="bg-white/20 text-white text-2xs font-bold px-1.5 py-0.5 rounded-full">{reunioesRaw.length}</span>}
          </button>
          {/* Chip por vendedor */}
          {(equipeRaw as any[]).map((v: any, idx: number) => {
            const isAtivo = vendedorSel === v.id
            const corBg = vendedorCores[idx % vendedorCores.length]
            const iniciais = ((v.nome ?? 'V') as string).split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase()
            const total = (reunioesRaw as any[]).filter((r: any) => r.vendedor_id === v.id || r.vendedor_nome === v.nome).length
            return (
              <button
                key={v.id}
                onClick={() => setVendedorSel(isAtivo ? '' : v.id)}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
                  isAtivo
                    ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                )}
              >
                <div className={clsx('w-5 h-5 rounded-full flex items-center justify-center text-2xs font-bold text-white flex-shrink-0', corBg)}>
                  {iniciais}
                </div>
                {(v.nome as string).split(' ')[0]}
                <span className={clsx('text-2xs font-bold px-1.5 py-0.5 rounded-full', isAtivo ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500')}>{total}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── CONTEÚDO + PAINEL LATERAL ───────────────────────────────────────── */}
      <div className="flex gap-4 items-start">

        {/* CALENDÁRIO */}
        <div className="flex-1 card overflow-hidden">

          {/* Header do calendário: navegação + legenda */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <button onClick={navAnterior} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">‹</button>
              <button onClick={navHoje} className="text-xs font-semibold text-gray-500 hover:text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors">Hoje</button>
              <button onClick={navProximo} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">›</button>
              <span className="text-sm font-semibold text-gray-800 ml-1 capitalize">{labelPeriodo}</span>
            </div>
            <div className="flex items-center gap-3">
              {[{cor:'bg-brand-500',label:'Confirmada'},{cor:'bg-amber-400',label:'Pendente'},{cor:'bg-emerald-500',label:'Concluída'}].map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className={clsx('w-2 h-2 rounded-full', l.cor)}/>
                  <span className="text-2xs text-gray-400">{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── VIEW HOJE ──────────────────────────────────────────────────── */}
          {viewMode === 'hoje' && (
            <div className="overflow-y-auto max-h-[480px]">
              {horas.map(hora => {
                const ev = getEventoNaLinha(hojeIso, hora)
                return (
                  <div key={hora} className="flex border-b border-gray-100 min-h-[56px]">
                    <div className="w-16 flex-shrink-0 px-3 py-2 text-2xs text-gray-400 font-mono border-r border-gray-100 pt-3">{hora}</div>
                    <div className="flex-1 p-1.5 relative">
                      {ev && (
                        <div className={clsx('rounded-lg px-3 py-2 text-xs border-l-3 cursor-pointer hover:opacity-90 transition-opacity flex items-start gap-3', corMap[ev.cor])} onClick={() => setDetalhe(ev)}>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-xs">{ev.hora} – {ev.fim}</div>
                            <div className="font-semibold truncate">{ev.empresa}</div>
                            <div className="opacity-70 truncate text-2xs">{ev.contato}</div>
                            {ev.modalidade && ev.modalidade !== 'online' && (
                              <div className="flex items-center gap-1 mt-1">
                                <MapPin size={9} className="opacity-60 flex-shrink-0"/>
                                <span className="text-[10px] opacity-70 truncate">{ev.modalidade === 'presencial' ? 'Presencial' : 'Híbrida'}{ev.endereco ? ` · ${ev.endereco}` : ''}</span>
                              </div>
                            )}
                          </div>
                          {ev.vendedor && (
                            <div className="text-2xs opacity-60 text-right flex-shrink-0">{ev.vendedor}</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
              {reunioesDiaFoco.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <Calendar size={28} className="mb-2 opacity-30"/>
                  <p className="text-sm">Nenhuma reunião hoje</p>
                </div>
              )}
            </div>
          )}

          {/* ── VIEW SEMANA ────────────────────────────────────────────────── */}
          {viewMode === 'semana' && (
            <>
              <div className="grid grid-cols-[64px_repeat(5,1fr)] border-b border-gray-100 bg-gray-50">
                <div/>
                {dias.map(d => (
                  <div key={d.iso} className={clsx('p-3 text-center border-l border-gray-100', d.iso === hojeIso && 'bg-brand-50')}>
                    <div className={clsx('text-xs font-semibold capitalize', d.iso === hojeIso ? 'text-brand-600' : 'text-gray-600')}>{d.label}</div>
                    {eventosPorDia[d.iso] && (
                      <div className="flex justify-center gap-0.5 mt-1">
                        {eventosPorDia[d.iso].slice(0,4).map((e,i) => (
                          <div key={i} className={clsx('w-1.5 h-1.5 rounded-full', e.cor === 'brand' ? 'bg-brand-400' : e.cor === 'emerald' ? 'bg-emerald-400' : 'bg-amber-400')}/>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="overflow-y-auto max-h-[420px]">
                {horas.map(hora => (
                  <div key={hora} className="grid grid-cols-[64px_repeat(5,1fr)] border-b border-gray-100 min-h-[52px]">
                    <div className="px-2 py-1 text-2xs text-gray-400 font-mono border-r border-gray-100 pt-2">{hora}</div>
                    {dias.map(dia => {
                      const ev = getEventoNaLinha(dia.iso, hora)
                      return (
                        <div key={dia.iso} className={clsx('border-l border-gray-100 p-1 relative', dia.iso === hojeIso && 'bg-brand-50/30')}>
                          {ev && (
                            <div className={clsx('rounded-md px-1.5 py-1 text-2xs border-l-2 cursor-pointer hover:opacity-80 transition-opacity', corMap[ev.cor])} onClick={() => setDetalhe(ev)}>
                              <div className="font-bold leading-tight">{ev.hora}</div>
                              <div className="font-medium leading-tight truncate">{ev.empresa}</div>
                              <div className="opacity-70 truncate">{ev.contato}</div>
                              {ev.vendedor && <div className="opacity-50 truncate text-[10px]">{ev.vendedor}</div>}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── VIEW MÊS ───────────────────────────────────────────────────── */}
          {viewMode === 'mes' && (
            <div className="p-4">
              {/* Cabeçalho dias da semana */}
              <div className="grid grid-cols-7 mb-1">
                {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d => (
                  <div key={d} className="text-center text-2xs font-semibold text-gray-400 py-1">{d}</div>
                ))}
              </div>
              {/* Grade de células */}
              <div className="grid grid-cols-7 gap-1">
                {celulas.map((iso, i) => {
                  if (!iso) return <div key={i} className="h-16"/>
                  const eventos = eventosPorDia[iso] ?? []
                  const isHoje = iso === hojeIso
                  const isSel = iso === diaSel
                  return (
                    <button
                      key={iso}
                      onClick={() => { setDiaSel(iso === diaSel ? '' : iso) }}
                      className={clsx(
                        'h-16 rounded-xl p-1.5 text-left transition-all border flex flex-col',
                        isSel ? 'border-brand-400 bg-brand-50 shadow-sm' :
                        isHoje ? 'border-brand-200 bg-brand-50/60' :
                        'border-transparent hover:border-gray-200 hover:bg-gray-50'
                      )}
                    >
                      <div className={clsx('text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full leading-none mb-1',
                        isHoje ? 'bg-brand-600 text-white' : 'text-gray-700'
                      )}>
                        {new Date(iso + 'T12:00:00').getDate()}
                      </div>
                      <div className="flex flex-wrap gap-0.5">
                        {eventos.slice(0,3).map((e, ei) => (
                          <div key={ei} className={clsx('h-1.5 rounded-full flex-1 min-w-[6px] max-w-[16px]',
                            e.cor === 'brand' ? 'bg-brand-400' : e.cor === 'emerald' ? 'bg-emerald-400' : 'bg-amber-400'
                          )}/>
                        ))}
                        {eventos.length > 3 && (
                          <span className="text-[9px] font-bold text-gray-400">+{eventos.length - 3}</span>
                        )}
                      </div>
                      {eventos.length > 0 && (
                        <div className="text-[10px] text-gray-500 mt-auto leading-none">
                          {eventos.length} {eventos.length === 1 ? 'reunião' : 'reuniões'}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Detalhe do dia selecionado no mês */}
              {diaSel && reunioesDiaFoco.length > 0 && (
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-semibold text-gray-700">
                      {new Date(diaSel + 'T12:00:00').toLocaleDateString('pt-BR', { weekday:'long', day:'2-digit', month:'long' })}
                    </h4>
                    <button onClick={() => setDiaSel('')} className="text-gray-400 hover:text-gray-600"><X size={13}/></button>
                  </div>
                  <div className="flex flex-col gap-2">
                    {reunioesDiaFoco.map((ev, i) => (
                      <div key={i} className={clsx('flex items-start gap-3 p-2.5 rounded-xl border-l-2 cursor-pointer hover:opacity-80 transition-opacity', corMap[ev.cor])} onClick={() => setDetalhe(ev)}>
                        <div className="flex-shrink-0">
                          <div className="text-xs font-bold">{ev.hora}</div>
                          <div className="text-2xs opacity-60">–{ev.fim}</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold truncate">{ev.empresa}</div>
                          <div className="text-2xs opacity-70 truncate">{ev.contato}</div>
                          {ev.vendedor && <div className="text-2xs opacity-50">{ev.vendedor}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* PAINEL LATERAL */}
        <div className="w-60 flex-shrink-0 flex flex-col gap-3">
          {/* Próximas */}
          <div className="card p-4">
            <h4 className="text-xs font-semibold text-gray-700 mb-3">Próximas reuniões</h4>
            <div className="flex flex-col gap-2">
              {proximasReunioes.length === 0 && (
                <p className="text-2xs text-gray-400 text-center py-2">Nenhuma reunião futura</p>
              )}
              {proximasReunioes.map((r: any, i: number) => {
                const d = new Date(r.inicio ?? r.data_hora)
                const hora = d.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })
                const fimD = new Date(d.getTime() + (r.duracao_minutos ?? 30) * 60000)
                const fim = fimD.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })
                const cor = corPorStatus(r.status ?? '')
                const corCls = cor === 'emerald' ? 'border-l-emerald-500' : cor === 'amber' ? 'border-l-amber-500' : 'border-l-brand-500'
                const isToday = d.toDateString() === hoje.toDateString()
                return (
                  <div key={r.id ?? i} className={clsx('border-l-2 pl-2 cursor-pointer hover:bg-gray-50 rounded-r-lg py-1 transition-colors', corCls)}
                    onClick={() => setDetalhe({ empresa: r.empresa ?? '—', contato: r.contato ?? r.contato_nome ?? '—', hora, fim, meetLink: r.meet_link ?? r.meetLink, linkMaps: r.link_maps, vendedor: r.vendedor_nome, modalidade: r.modalidade, endereco: r.endereco })}>
                    <div className="flex items-center gap-1.5">
                      <span className="text-2xs font-mono text-gray-500">{hora}</span>
                      {isToday && <span className="text-2xs font-bold text-brand-600 bg-brand-50 px-1 rounded">hoje</span>}
                    </div>
                    <div className="text-xs font-semibold text-gray-900 truncate">{r.empresa ?? '—'}</div>
                    <div className="text-2xs text-gray-500 truncate">{r.contato ?? r.contato_nome ?? '—'}</div>
                    {r.vendedor_nome && <div className="text-2xs text-gray-400 truncate">{r.vendedor_nome}</div>}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Detalhe ao clicar num evento */}
          {detalhe && (
            <div className="card p-4">
              <div className="flex items-start justify-between mb-3">
                <h4 className="text-xs font-semibold text-gray-700">Reunião</h4>
                <button onClick={() => setDetalhe(null)}><X size={13} className="text-gray-400 hover:text-gray-600"/></button>
              </div>

              <div className="text-sm font-bold text-gray-900 mb-0.5">{detalhe.empresa}</div>
              <div className="text-xs text-gray-500 mb-2">{detalhe.contato}</div>

              {/* Vendedor */}
              {detalhe.vendedor && (
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-4 h-4 rounded-full bg-brand-500 flex items-center justify-center text-[9px] font-bold text-white">
                    {detalhe.vendedor.split(' ').map((n: string) => n[0]).join('').slice(0,2)}
                  </div>
                  <span className="text-2xs text-gray-600 font-medium">{detalhe.vendedor}</span>
                </div>
              )}

              {/* Horário */}
              <div className="text-xs font-mono text-brand-600 bg-brand-50 rounded-lg px-2 py-1.5 mb-2 inline-block">
                {detalhe.hora} – {detalhe.fim}
              </div>

              {/* Badge modalidade */}
              {detalhe.modalidade && (
                <div className="mb-3">
                  <span className={clsx('text-2xs font-semibold px-2 py-1 rounded-full',
                    detalhe.modalidade === 'online'     ? 'bg-brand-50 text-brand-700 border border-brand-200' :
                    detalhe.modalidade === 'presencial' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    'bg-purple-50 text-purple-700 border border-purple-200'
                  )}>
                    {detalhe.modalidade === 'online' ? '🎥 Online' : detalhe.modalidade === 'presencial' ? '📍 Presencial' : '🔀 Híbrida'}
                  </span>
                </div>
              )}

              {/* Endereço — apenas para presencial ou híbrida */}
              {detalhe.endereco && (detalhe.modalidade === 'presencial' || detalhe.modalidade === 'hibrido') && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-2.5 mb-3">
                  <p className="text-2xs font-semibold text-gray-500 mb-1">📍 Endereço</p>
                  <p className="text-xs text-gray-800 leading-snug">{detalhe.endereco}</p>
                  {detalhe.linkMaps && (
                    <button
                      onClick={() => window.open(detalhe.linkMaps, '_blank')}
                      className="mt-1.5 text-2xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                    >
                      <MapPin size={10}/> Ver no Google Maps
                    </button>
                  )}
                </div>
              )}

              {/* Ações adaptadas à modalidade */}
              <div className="flex flex-col gap-1.5">
                {/* Meet — apenas para online ou híbrida */}
                {(detalhe.modalidade === 'online' || detalhe.modalidade === 'hibrido' || !detalhe.modalidade) && (
                  <button
                    className="btn-primary text-xs py-1.5 gap-1.5 justify-center"
                    onClick={() => detalhe.meetLink ? window.open(`https://${detalhe.meetLink}`, '_blank') : undefined}
                    disabled={!detalhe.meetLink}
                  ><Video size={11}/> {detalhe.meetLink ? 'Entrar no Meet' : 'Sem link Meet'}</button>
                )}
                {/* Maps — apenas para presencial ou híbrida */}
                {(detalhe.modalidade === 'presencial' || detalhe.modalidade === 'hibrido') && detalhe.linkMaps && (
                  <button
                    className="btn-primary text-xs py-1.5 gap-1.5 justify-center"
                    onClick={() => window.open(detalhe.linkMaps, '_blank')}
                  ><MapPin size={11}/> Ver no Maps</button>
                )}
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

// ─── ABA AO VIVO — WAR ROOM ──────────────────────────────────────────────────

// Frases sugeridas pelo CI por tipo de gatilho (simuladas quando API não retorna)
const CI_SUGESTOES: Record<string, string> = {
  preco:         '"Entendo a preocupação com o valor. Nossos clientes recuperam o investimento em média em 45 dias — posso mostrar o cálculo exato para o seu caso?"',
  urgencia:      '"Perfeito timing — temos uma janela de implementação disponível ainda esta semana que normalmente demora 3 semanas. Quer garantir essa vaga?"',
  decisor:       '"Ótimo que você é o responsável pela decisão. Para agilizar, posso preparar um resumo executivo em PDF para você apresentar internamente?"',
  concorrente:   '"Faz sentido comparar. O que normalmente nos diferencia é o aprendizado cross-cliente — seu agente nasce com o que funcionou em centenas de outras empresas do seu setor."',
  proposta:      '"Vou preparar uma proposta personalizada para o seu volume. Para calibrar os números, quantos contatos você trabalha por mês hoje?"',
  humano:        '"Claro, vou conectar você agora com nosso especialista. Ele já está a par da sua situação e pode continuar de onde paramos."',
  disponibilidade: '"Que bom! Temos horários disponíveis hoje às 15h ou amanhã às 10h. Qual fica melhor para você?"',
  default:       '"Baseado no que você disse, acredito que o próximo passo natural seria marcar uma demonstração rápida de 20 minutos. Faz sentido?"',
}

function getCISugestao(gatilho?: string): string {
  if (!gatilho) return CI_SUGESTOES.default
  const lower = gatilho.toLowerCase()
  for (const key of Object.keys(CI_SUGESTOES)) {
    if (lower.includes(key)) return CI_SUGESTOES[key]
  }
  return CI_SUGESTOES.default
}

// Fase da conversa estimada pelo tempo
function estimarFase(duracao?: string): number {
  if (!duracao) return 0
  const [m] = duracao.replace(/m.*/, '').split(':').map(Number)
  const mins = isNaN(m) ? 0 : m
  if (mins < 1) return 0      // Abertura
  if (mins < 2) return 1      // Qualificação
  if (mins < 4) return 2      // Argumento
  if (mins < 6) return 3      // Objeção
  if (mins < 8) return 4      // Agendamento
  return 5                    // Encerramento
}

interface AlertaICP {
  id: string
  empresa: string
  contato: string
  icp: number
  potencial: number
  gatilho?: string
  ts: number      // Date.now() ao disparar
  visto: boolean
}

function TabAoVivo({
  onGoFila,
  limiarICP = 85,
  onLimiarChange,
  onNovoAlerta,
}: {
  onGoFila?: (id: string) => void
  limiarICP?: number
  onLimiarChange?: (v: number) => void
  onNovoAlerta?: (qtd: number) => void
}) {
  const [fraseInjetada, setFraseInjetada] = useState<Record<string, string>>({})
  const [fraseInput, setFraseInput]       = useState<Record<string, string>>({})
  const [feedbackInj, setFeedbackInj]     = useState<Record<string, string>>({})
  const [transferidos, setTransferidos]   = useState<Record<string, string>>({})
  const [marcados, setMarcados]           = useState<Record<string, boolean>>({})

  // ── Sistema de alertas ICP ─────────────────────────────────────────────────
  const [alertas, setAlertas]             = useState<AlertaICP[]>([])
  const alertadosRef                      = useRef<Set<string>>(new Set())  // IDs já alertados nesta sessão
  const [painelAlertaAberto, setPainelAlertaAberto] = useState(true)

  // Dados reais da API com polling 4s
  const { data: ligacoesAtivas = [], isLoading } = useQuery({
    queryKey: ['ligacoes-ao-vivo'],
    queryFn: () => ligacoesApi.list({ status: 'em_andamento' }).then(r =>
      (r.data as any[]).map(l => ({
        id:              String(l.call_control_id ?? l.id ?? Math.random()),
        _callControlId:  String(l.call_control_id ?? l.id ?? ''),
        empresa:         l.contatos?.empresa ?? l.empresa_nome ?? l.numero_destino ?? '—',
        contato:         l.contatos?.nome ?? l.contato_nome ?? '—',
        cargo:           l.contatos?.cargo ?? l.cargo ?? '',
        telefone:        l.numero_destino ?? l.telefone ?? '',
        agente:          l.agentes?.nome ?? l.agente_nome ?? '—',
        campanha:        l.campanha_nome ?? l.campanha ?? '',
        segmento:        l.contatos?.segmento ?? l.segmento ?? '',
        status:          'em_ligacao' as StatusLigacao,
        icp:             l.icp ?? 0,
        potencial:       l.potencial ?? 0,
        tentativa:       l.tentativa ?? 1,
        maxTentativas:   l.max_tentativas ?? 3,
        duracao:         l.duracao,
        snippet:         l.snippet,
        gatilhoDetectado: l.gatilho_detectado,
        transferindo:    l.transferindo ?? false,
      } as EntradaFila & { _callControlId: string }))
    ),
    refetchInterval: 4000,
  })

  // Demo quando API retorna vazio
  const DEMO: (EntradaFila & { _callControlId: string })[] = [
    { id:'av1', _callControlId:'', empresa:'Grupo Comercial ABC', contato:'Marcos Silva', cargo:'Diretor Comercial', telefone:'(11) 98765-4321', agente:'Ana', campanha:'SP — Outbound Maio', segmento:'Comércio / Varejo', status:'em_ligacao', icp:87, potencial:82, tentativa:1, maxTentativas:3, duracao:'2m14s', snippet:'Sim, sou responsável pelas decisões comerciais aqui na empresa. Precisamos de uma proposta com os valores detalhados.', gatilhoDetectado:'preco', transferindo:false },
    { id:'av2', _callControlId:'', empresa:'Tech Nova Sistemas', contato:'Carla Mendes', cargo:'Gestora Comercial', telefone:'(11) 96543-2109', agente:'Carlos', campanha:'SP — Outbound Maio', segmento:'SaaS / Tech', status:'em_ligacao', icp:74, potencial:68, tentativa:1, maxTentativas:3, duracao:'4m30s', snippet:'Quinta, 04/06 funciona. Manhã às 09:30 ou tarde às 14:30?', gatilhoDetectado:'disponibilidade', transferindo:false },
    { id:'av3', _callControlId:'', empresa:'Construtora Primavera', contato:'Júlia Rocha', cargo:'CEO', telefone:'(62) 99987-6543', agente:'Rafael', campanha:'GO — Outbound Junho', segmento:'Construção Civil', status:'em_ligacao', icp:91, potencial:88, tentativa:1, maxTentativas:3, duracao:'6m02s', snippet:'Temos 8 vendedores e o processo atual é muito manual. Quero entender como funciona.', gatilhoDetectado:'decisor', transferindo:false },
    { id:'av4', _callControlId:'', empresa:'Distribuidora XYZ', contato:'Roberto Lima', cargo:'Gerente Comercial', telefone:'(31) 97654-3210', agente:'Ana', campanha:'MG — Outbound Maio', segmento:'Distribuição', status:'em_ligacao', icp:65, potencial:55, tentativa:2, maxTentativas:3, duracao:'1m45s', snippet:'Já usamos uma solução parecida, mas tivemos problemas com a integração.', gatilhoDetectado:'concorrente', transferindo:false },
  ]
  const ativas = ligacoesAtivas.length > 0 ? ligacoesAtivas : DEMO

  // ── Detecção de alertas ICP ────────────────────────────────────────────────
  useEffect(() => {
    const novas: AlertaICP[] = []
    ativas.forEach(item => {
      if (item.icp >= limiarICP && !alertadosRef.current.has(item.id)) {
        alertadosRef.current.add(item.id)
        novas.push({
          id: item.id,
          empresa: item.empresa,
          contato: item.contato,
          icp: item.icp,
          potencial: item.potencial,
          gatilho: item.gatilhoDetectado,
          ts: Date.now(),
          visto: false,
        })
      }
    })
    if (novas.length > 0) {
      setAlertas(prev => [...novas, ...prev].slice(0, 20)) // mantém últimos 20
      setPainelAlertaAberto(true)
      onNovoAlerta?.(novas.length)
    }
  }, [ativas, limiarICP])

  // Métricas do cabeçalho
  const alertasNaoVistos   = alertas.filter(a => !a.visto).length
  const precisamAtencao    = ativas.filter(a => a.icp >= limiarICP || a.gatilhoDetectado).length
  const transferenciasHoje = ativas.filter(a => a.transferindo).length

  function marcarAlertaVisto(id: string) {
    setAlertas(prev => prev.map(a => a.id === id ? { ...a, visto: true } : a))
  }
  function descartarTodosAlertas() {
    setAlertas(prev => prev.map(a => ({ ...a, visto: true })))
  }

  async function injetarFrase(item: EntradaFila & { _callControlId: string }) {
    const frase = fraseInput[item.id]?.trim()
    if (!frase) return
    if (!item._callControlId) {
      setFeedbackInj(p => ({ ...p, [item.id]: '⚠ Demo — indisponível' }))
      setTimeout(() => setFeedbackInj(p => ({ ...p, [item.id]: '' })), 2500)
      return
    }
    try {
      await ligacoesApi.falar(item._callControlId, { texto: frase })
      setFraseInjetada(p => ({ ...p, [item.id]: frase }))
      setFeedbackInj(p => ({ ...p, [item.id]: '✓ Frase enviada ao agente' }))
    } catch {
      setFeedbackInj(p => ({ ...p, [item.id]: '✗ Erro ao injetar' }))
    }
    setTimeout(() => setFeedbackInj(p => ({ ...p, [item.id]: '' })), 3000)
    setFraseInput(p => ({ ...p, [item.id]: '' }))
  }

  async function forcarAgendamento(item: EntradaFila & { _callControlId: string }) {
    const frase = 'Que tal marcarmos uma reunião rápida de 20 minutos? Tenho um slot disponível hoje às 15h ou amanhã às 10h — qual fica melhor para você?'
    setFraseInput(p => ({ ...p, [item.id]: frase }))
  }

  async function transferirAgora(item: EntradaFila & { _callControlId: string }) {
    const candidato = TRANSFER_CANDIDATES.find(v => v.status === 'disponivel')
    const nome = candidato?.nome ?? 'Especialista'
    if (item._callControlId) {
      try { await ligacoesApi.transferir(item._callControlId, { numero_destino: (candidato as any)?.telefone ?? '', vendedor_nome: nome }) } catch (_) {}
    }
    setTransferidos(p => ({ ...p, [item.id]: nome }))
  }

  const fases = ['Abertura','Qualificação','Argumento','Objeção','Agendamento','Encerramento']

  return (
    <div className="flex flex-col gap-4">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="card p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-100 border border-brand-200 flex items-center justify-center">
            <Zap size={18} className="text-brand-600" />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900">Centro de Comando — Ao Vivo</div>
            <div className="text-2xs text-gray-500">CI monitora cada ligação · alerta automático quando ICP ≥ limiar</div>
          </div>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          {/* Seletor de limiar */}
          <div className="flex items-center gap-2">
            <span className="text-2xs text-gray-500 font-medium">Alertar a partir de ICP</span>
            <div className="flex gap-1">
              {[80, 85, 90, 95].map(v => (
                <button
                  key={v}
                  onClick={() => { onLimiarChange?.(v); alertadosRef.current.clear() }}
                  className={clsx(
                    'text-2xs font-bold px-2.5 py-1 rounded-lg border transition-all',
                    limiarICP === v
                      ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-brand-400 hover:text-brand-600'
                  )}
                >{v}+</button>
              ))}
            </div>
          </div>
          {/* Métricas */}
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
            <span className="text-xs font-bold text-emerald-700">{ativas.length} ativas agora</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-xl font-bold font-mono text-amber-600">{precisamAtencao}</div>
              <div className="text-2xs text-gray-400">≥ ICP {limiarICP}</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold font-mono text-brand-600">{transferenciasHoje}</div>
              <div className="text-2xs text-gray-400">transferindo</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── PAINEL DE ALERTAS ──────────────────────────────────────────────── */}
      {alertas.length > 0 && (
        <div className={clsx(
          'card overflow-hidden transition-all',
          alertasNaoVistos > 0 ? 'ring-2 ring-red-400 ring-offset-1' : ''
        )}>
          {/* Header */}
          <div
            className={clsx('flex items-center justify-between px-4 py-3 cursor-pointer border-b',
              alertasNaoVistos > 0 ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'
            )}
            onClick={() => setPainelAlertaAberto(o => !o)}
          >
            <div className="flex items-center gap-2.5">
              {alertasNaoVistos > 0 && (
                <span className="relative flex-shrink-0">
                  <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-50" />
                  <span className="relative w-2.5 h-2.5 rounded-full bg-red-500 block" />
                </span>
              )}
              <span className={clsx('text-sm font-bold', alertasNaoVistos > 0 ? 'text-red-700' : 'text-gray-700')}>
                {alertasNaoVistos > 0
                  ? `⚡ ${alertasNaoVistos} alerta${alertasNaoVistos > 1 ? 's' : ''} — ligaç${alertasNaoVistos > 1 ? 'ões' : 'ão'} de alto valor detectada${alertasNaoVistos > 1 ? 's' : ''}!`
                  : `✓ Alertas — ${alertas.length} registrado${alertas.length > 1 ? 's' : ''} nesta sessão`
                }
              </span>
              <span className={clsx('text-2xs font-bold px-2 py-0.5 rounded-full',
                alertasNaoVistos > 0 ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600'
              )}>{alertas.length}</span>
            </div>
            <div className="flex items-center gap-2">
              {alertasNaoVistos > 0 && (
                <button
                  onClick={e => { e.stopPropagation(); descartarTodosAlertas() }}
                  className="text-2xs font-semibold text-red-600 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-100 transition-colors"
                >Marcar todos como vistos</button>
              )}
              <span className="text-2xs text-gray-400">{painelAlertaAberto ? '▲' : '▼'}</span>
            </div>
          </div>

          {/* Lista */}
          {painelAlertaAberto && (
            <div className="divide-y divide-gray-100 bg-white">
              {alertas.map(al => (
                <div key={al.id + al.ts} className={clsx('flex items-center gap-3 px-4 py-3', al.visto && 'opacity-40')}>
                  {/* ICP badge */}
                  <div className={clsx('w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 font-bold border',
                    al.icp >= 90 ? 'bg-red-50 border-red-200' :
                    al.icp >= 85 ? 'bg-amber-50 border-amber-200' :
                    'bg-brand-50 border-brand-200'
                  )}>
                    <span className={clsx('text-lg font-mono leading-none',
                      al.icp >= 90 ? 'text-red-600' : al.icp >= 85 ? 'text-amber-600' : 'text-brand-600'
                    )}>{al.icp}</span>
                    <span className="text-[9px] text-gray-400 font-medium">ICP</span>
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-gray-900">{al.empresa}</span>
                      {!al.visto && <span className="text-2xs bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold animate-pulse">NOVO</span>}
                    </div>
                    <div className="text-xs text-gray-500">{al.contato}</div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {al.potencial > 0 && <span className="text-2xs font-semibold text-brand-600">📞 {al.potencial}% potencial</span>}
                      {al.gatilho && <span className="text-2xs font-semibold text-amber-600">💡 {al.gatilho}</span>}
                      <span className="text-2xs text-gray-400">{new Date(al.ts).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit', second:'2-digit' })}</span>
                    </div>
                  </div>
                  {/* Ações */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!al.visto && (
                      <button onClick={() => marcarAlertaVisto(al.id)} className="btn-secondary text-2xs py-1.5 px-3">
                        Acompanhando ✓
                      </button>
                    )}
                    <button className="btn-secondary text-2xs py-1.5 px-3">Ver card ↓</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ESTADO VAZIO ───────────────────────────────────────────────────── */}
      {isLoading && ligacoesAtivas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4 animate-pulse">
            <Radio size={28} className="text-gray-300"/>
          </div>
          <p className="text-sm text-gray-400">Conectando ao motor em tempo real...</p>
        </div>
      ) : (

      // ── GRID DE CARDS ──────────────────────────────────────────────────────
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {ativas.map(item => {
          const faseAtual = estimarFase(item.duracao)
          const sugestaoCI = getCISugestao(item.gatilhoDetectado)
          const jaTransferido = !!transferidos[item.id]
          const marcado = !!marcados[item.id]
          const temAlerta = item.icp >= limiarICP

          // Cor da borda por urgência — design claro
          const bordaCor = jaTransferido || transferidos[item.id]
            ? 'border-brand-400 ring-1 ring-brand-200'
            : temAlerta
            ? 'border-red-400 ring-1 ring-red-100'
            : item.icp >= 80 && item.potencial >= 70
            ? 'border-amber-300'
            : item.gatilhoDetectado
            ? 'border-brand-200'
            : 'border-gray-200'

          return (
            <div key={item.id} className={clsx('card overflow-hidden transition-all border-2', bordaCor)}>

              {/* Faixa de alerta ICP */}
              {temAlerta && (
                <div className="flex items-center gap-2 px-4 py-1.5 bg-red-50 border-b border-red-100">
                  <span className="relative flex-shrink-0">
                    <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-40" />
                    <span className="relative w-2 h-2 rounded-full bg-red-500 block" />
                  </span>
                  <span className="text-2xs font-bold text-red-700">⚡ ALERTA CI — ICP {item.icp} ≥ {limiarICP} · Ligação de alto valor</span>
                </div>
              )}

              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-gray-900 truncate">{item.empresa}</div>
                    <div className="text-2xs text-gray-500 truncate">{item.contato} · {item.cargo}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {marcado && <span className="badge badge-amber text-2xs">⭐ Revisão</span>}
                  {jaTransferido && <span className="badge badge-brand text-2xs animate-pulse">🔀 Transferindo</span>}
                  <IcpBadge value={item.icp} />
                  <span className="text-2xs text-gray-400 font-mono bg-gray-100 px-2 py-0.5 rounded-full">{item.duracao ?? '—'}</span>
                </div>
              </div>

              {/* Barra de fase */}
              <div className="px-4 pt-3 pb-1">
                <div className="flex gap-0.5 mb-1">
                  {fases.map((f, i) => (
                    <div key={f} className="flex-1 flex flex-col items-center gap-1">
                      <div className={clsx('h-1 w-full rounded-full transition-all',
                        i < faseAtual ? 'bg-brand-500' : i === faseAtual ? 'bg-amber-400' : 'bg-gray-200'
                      )} />
                      <span className={clsx('text-[9px] font-medium hidden sm:block',
                        i === faseAtual ? 'text-amber-600' : i < faseAtual ? 'text-brand-500' : 'text-gray-400'
                      )}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Potencial */}
              {item.potencial > 0 && (
                <div className="px-4 pb-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-2xs text-gray-500 uppercase tracking-wide">Potencial de fechamento</span>
                    <span className={clsx('text-xs font-bold font-mono',
                      item.potencial >= 75 ? 'text-emerald-600' : item.potencial >= 50 ? 'text-amber-600' : 'text-gray-400'
                    )}>{item.potencial}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{
                      width:`${item.potencial}%`,
                      background: item.potencial >= 75 ? 'linear-gradient(90deg,#059669,#34d399)' : item.potencial >= 50 ? 'linear-gradient(90deg,#d97706,#fbbf24)' : 'linear-gradient(90deg,#9ca3af,#d1d5db)'
                    }} />
                  </div>
                </div>
              )}

              {/* Colunas: Transcrição | CI */}
              <div className="grid grid-cols-2 divide-x divide-gray-100">

                {/* Col esq: Transcrição + Sinal */}
                <div className="px-4 py-3 flex flex-col gap-2.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0">{item.agente[0]}</div>
                    <span className="text-2xs text-gray-500 truncate">{item.agente} · {item.campanha}</span>
                  </div>

                  {item.snippet ? (
                    <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                      <div className="flex items-center gap-1 mb-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                        <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wide">Transcrição ao vivo</span>
                      </div>
                      <p className="text-2xs text-gray-700 leading-relaxed italic">"{item.snippet}"</p>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                      <p className="text-2xs text-gray-400 italic">Aguardando transcrição...</p>
                    </div>
                  )}

                  {item.gatilhoDetectado && (
                    <div className="flex items-center gap-2">
                      <span className="text-2xs font-semibold text-gray-400 uppercase tracking-wide flex-shrink-0">Sinal</span>
                      <span className={clsx('text-2xs font-bold px-2 py-0.5 rounded-full border',
                        item.gatilhoDetectado.toLowerCase().includes('preco') || item.gatilhoDetectado.toLowerCase().includes('valor')
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : item.gatilhoDetectado.toLowerCase().includes('decisor') || item.gatilhoDetectado.toLowerCase().includes('humano')
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : item.gatilhoDetectado.toLowerCase().includes('disponib') || item.gatilhoDetectado.toLowerCase().includes('agendar')
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-brand-50 text-brand-700 border-brand-200'
                      )}>
                        {item.gatilhoDetectado}
                      </span>
                    </div>
                  )}
                </div>

                {/* Col dir: Sugestão CI + Intervenção */}
                <div className="px-4 py-3 flex flex-col gap-2.5">
                  <div className="bg-brand-50 border border-brand-200 rounded-lg p-2.5">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Sparkles size={10} className="text-brand-600 flex-shrink-0" />
                      <span className="text-[10px] font-semibold text-brand-700 uppercase tracking-wide">Próximo argumento · CI</span>
                    </div>
                    <p className="text-2xs text-gray-700 leading-relaxed">{sugestaoCI}</p>
                    <button
                      onClick={() => setFraseInput(p => ({ ...p, [item.id]: sugestaoCI.replace(/^"|"$/g, '') }))}
                      className="mt-2 text-[10px] font-semibold text-brand-600 hover:text-brand-700 transition-colors"
                    >Usar esta frase ↓</button>
                  </div>

                  <div>
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Intervenção do gestor</div>
                    <div className="flex gap-1">
                      <input
                        className="input flex-1 py-1.5 text-2xs min-w-0"
                        placeholder="Frase para o agente falar..."
                        value={fraseInput[item.id] ?? ''}
                        onChange={e => setFraseInput(p => ({ ...p, [item.id]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && injetarFrase(item as EntradaFila & { _callControlId: string })}
                      />
                      <button
                        onClick={() => injetarFrase(item as EntradaFila & { _callControlId: string })}
                        disabled={!fraseInput[item.id]?.trim()}
                        className="btn-primary text-2xs py-1.5 px-2.5 disabled:opacity-40 flex-shrink-0"
                      >Injetar</button>
                    </div>
                    {feedbackInj[item.id] && (
                      <p className={clsx('text-[10px] mt-1', feedbackInj[item.id].startsWith('✓') ? 'text-emerald-600' : 'text-red-500')}>
                        {feedbackInj[item.id]}
                      </p>
                    )}
                    {fraseInjetada[item.id] && !feedbackInj[item.id] && (
                      <p className="text-[10px] text-gray-400 mt-1 truncate">Última: "{fraseInjetada[item.id]}"</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Rodapé: ações */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-t border-gray-100 bg-gray-50">
                <button
                  onClick={() => forcarAgendamento(item as EntradaFila & { _callControlId: string })}
                  className="flex items-center gap-1.5 text-2xs font-bold px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors"
                >
                  <Calendar size={10}/> Forçar agendamento
                </button>
                <button
                  onClick={() => transferirAgora(item as EntradaFila & { _callControlId: string })}
                  disabled={jaTransferido}
                  className={clsx('flex items-center gap-1.5 text-2xs font-bold px-3 py-1.5 rounded-lg border transition-colors',
                    jaTransferido
                      ? 'bg-brand-50 border-brand-200 text-brand-500 opacity-60 cursor-default'
                      : 'bg-brand-50 border-brand-200 text-brand-700 hover:bg-brand-100'
                  )}
                >
                  <PhoneForwarded size={10}/> {jaTransferido ? `Transferindo → ${transferidos[item.id]}` : 'Transferir agora'}
                </button>
                <button
                  onClick={() => setMarcados(p => ({ ...p, [item.id]: !p[item.id] }))}
                  className={clsx('flex items-center gap-1.5 text-2xs font-bold px-3 py-1.5 rounded-lg border transition-colors ml-auto',
                    marcado
                      ? 'bg-amber-50 border-amber-200 text-amber-700'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-amber-300 hover:text-amber-600'
                  )}
                >
                  <Star size={10}/> {marcado ? 'Marcado' : 'Marcar revisão'}
                </button>
                <button
                  onClick={() => onGoFila?.(item.id)}
                  className="btn-secondary text-2xs py-1.5 px-3 gap-1.5"
                >
                  <Activity size={10}/> Monitor
                </button>
              </div>
            </div>
          )
        })}
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
            <span className="text-2xs text-gray-400">{periodo ? `Últimos ${periodo} dias` : 'Todos os períodos'}</span>
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
                </div>
                <div>
                  <div className="text-xs text-gray-700">{h.agentes?.nome || '—'}</div>
                  <div className="text-2xs text-gray-400">{formatData(h.encerrada_em || h.iniciada_em)}</div>
                </div>
                <div className="text-xs font-mono text-gray-600">{formatDuracao(h.duracao_segundos)}</div>
                <span className={clsx('badge text-2xs w-fit',
                  h.resultado === 'agendada' || h.resultado === 'atendida' ? 'badge-success' :
                  h.resultado === 'transferida' ? 'badge-purple' :
                  h.resultado === 'nao_atendida' ? 'badge-amber' :
                  h.resultado === 'pendente' || !h.resultado ? 'badge-neutral' : 'badge-danger'
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
          <span className="text-2xs text-gray-400">{HISTORICO.length} chamadas {periodo ? `nos últimos ${periodo} dias` : 'no total'}</span>
        </div>
      </div>
    </div>
  )
}

// ─── ABA RAMAL ───────────────────────────────────────────────────────────────

function TabRamal() {
  const [chamandoMembro, setChamandoMembro] = useState<any | null>(null)

  // ── WebRTC — chamadas internas direto no browser ─────────────────────────
  const [phoneState, phoneActions] = useWebRTCPhone()

  const { data: equipeRaw = [], isLoading } = useQuery({
    queryKey: ['equipe-ramal'],
    queryFn: () => equipeApi.list().then(r => r.data as any[]),
    refetchInterval: 30000,
  })

  const todos   = (equipeRaw as any[])
  const total   = todos.length
  const online  = todos.filter(m => m.ativo !== false).length
  const offline = total - online

  const COR_AVATAR = ['bg-brand-500','bg-emerald-500','bg-amber-500','bg-purple-500','bg-rose-500','bg-cyan-500']

  // Inicia WebRTC automaticamente ao abrir a aba
  useEffect(() => {
    if (phoneState.status === 'idle') {
      phoneActions.init()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Limpa estado 2.5s após encerramento de chamada
  useEffect(() => {
    if (phoneState.status === 'hangup') {
      const t = setTimeout(() => {
        setChamandoMembro(null)
        phoneActions.reset()
      }, 2500)
      return () => clearTimeout(t)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phoneState.status])

  async function ligarParaMembro(membro: any) {
    if (!membro.sip_username) return   // sem credencial SIP — não deve acontecer

    // Re-inicia se necessário
    if (phoneState.status === 'idle' || phoneState.status === 'error') {
      const ok = await phoneActions.init()
      if (!ok) return
    }

    if (phoneState.status !== 'ready' && phoneState.status !== 'hangup') return

    setChamandoMembro(membro)
    // Destino: SIP URI do membro na rede Telnyx
    const destino = `sip:${membro.sip_username}@sip.telnyx.com`
    await phoneActions.dial(destino, { motivo: `Chamada interna — ramal ${membro.ramal}` })
  }

  function encerrarChamada() {
    phoneActions.hangup()
    // chamandoMembro é limpo pelo useEffect após 2.5s
  }

  function iniciais(nome: string) {
    return (nome || '').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
  }

  const isCalling   = phoneState.status === 'ringing' || phoneState.status === 'active'
  const timerStr    = `${String(Math.floor(phoneState.timer / 60)).padStart(2, '0')}:${String(phoneState.timer % 60).padStart(2, '0')}`
  const phoneBusy   = isCalling || phoneState.status === 'initializing' || phoneState.status === 'connecting'

  return (
    <div className="flex flex-col gap-4">

      {/* ── Status da conexão WebRTC ────────────────────────────────────────── */}
      {(phoneState.status === 'initializing' || phoneState.status === 'connecting') && (
        <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5">
          <div className="w-3 h-3 border-2 border-brand-400 border-t-transparent rounded-full animate-spin flex-shrink-0"/>
          Conectando ao sistema de chamadas...
        </div>
      )}
      {phoneState.status === 'ready' && (
        <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0"/>
          Sistema ativo — clique em um avatar para ligar
        </div>
      )}
      {phoneState.status === 'error' && (
        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
          <span className="flex-shrink-0">⚠️</span>
          <span className="flex-1 truncate">{phoneState.error || 'Erro na conexão de voz'}</span>
          <button onClick={() => phoneActions.init()} className="ml-auto font-medium text-blue-600 hover:underline whitespace-nowrap">
            Reconectar
          </button>
        </div>
      )}

      {/* ── Barra de chamada ativa ─────────────────────────────────────────── */}
      {(isCalling || phoneState.status === 'hangup') && chamandoMembro && (
        <div className={clsx(
          'flex items-center gap-3 px-4 py-3 rounded-xl border transition-all',
          phoneState.status === 'active'  ? 'bg-emerald-50 border-emerald-200' :
          phoneState.status === 'hangup'  ? 'bg-gray-50 border-gray-100'       :
                                            'bg-amber-50 border-amber-200'
        )}>
          {/* Avatar */}
          <div className={clsx('w-9 h-9 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0',
            COR_AVATAR[todos.findIndex((m: any) => m.id === chamandoMembro.id) % COR_AVATAR.length]
          )}>
            {iniciais(chamandoMembro.nome)}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
              {phoneState.status === 'ringing' && <span className="text-amber-600 text-xs">📡 Chamando...</span>}
              {phoneState.status === 'active'  && <span className="text-emerald-600 text-xs">🔊 Em chamada</span>}
              {phoneState.status === 'hangup'  && <span className="text-gray-400 text-xs">Encerrada</span>}
              <span>{chamandoMembro.nome}</span>
            </p>
            <p className="text-xs text-gray-400">Ramal {chamandoMembro.ramal}</p>
          </div>

          {/* Timer */}
          {phoneState.status === 'active' && (
            <span className="text-sm font-mono font-bold text-emerald-700 flex-shrink-0">{timerStr}</span>
          )}

          {/* Mute */}
          {phoneState.status === 'active' && (
            <button
              onClick={phoneActions.toggleMute}
              title={phoneState.muted ? 'Ativar microfone' : 'Silenciar'}
              className={clsx('p-2 rounded-lg border transition-colors flex-shrink-0',
                phoneState.muted
                  ? 'bg-red-50 border-red-200 text-red-600'
                  : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
              )}
            >
              {phoneState.muted ? <MicOff size={14}/> : <Mic size={14}/>}
            </button>
          )}

          {/* Encerrar */}
          {(phoneState.status === 'ringing' || phoneState.status === 'active') && (
            <button
              onClick={encerrarChamada}
              title="Encerrar chamada"
              className="p-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors flex-shrink-0"
            >
              <PhoneOff size={14}/>
            </button>
          )}
        </div>
      )}

      {/* ── KPIs ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="kpi-card">
          <span className="text-2xl font-bold font-mono text-gray-900">{total}</span>
          <span className="text-xs text-gray-500">Total de membros</span>
        </div>
        <div className="kpi-card">
          <span className="text-2xl font-bold font-mono text-emerald-600">{online}</span>
          <span className="text-xs text-gray-500">Disponíveis agora</span>
        </div>
        <div className="kpi-card">
          <span className={clsx('text-2xl font-bold font-mono', offline > 0 ? 'text-gray-400' : 'text-gray-300')}>{offline}</span>
          <span className="text-xs text-gray-500">Offline</span>
        </div>
      </div>

      {/* ── Diretório em cards ─────────────────────────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Diretório da equipe</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Clique no avatar para ligar · clique no badge do ramal para ver as credenciais SIP
          </p>
        </div>

        {isLoading && (
          <div className="px-4 py-10 text-center text-xs text-gray-400">Carregando equipe...</div>
        )}

        {!isLoading && todos.length === 0 && (
          <div className="px-4 py-10 text-center">
            <p className="text-sm text-gray-500 font-medium">Nenhum membro na equipe</p>
            <p className="text-xs text-gray-400 mt-1">Adicione membros em <strong>Configurações → Equipe</strong></p>
          </div>
        )}

        {todos.length > 0 && (
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {todos.map((m: any, idx: number) => {
              const cor        = COR_AVATAR[idx % COR_AVATAR.length]
              const isOnline   = m.ativo !== false
              const hasSip     = !!m.sip_username
              const isChamando = chamandoMembro?.id === m.id && isCalling
              // Desabilita card se: offline OU em outra chamada ativa OU sem credencial SIP
              const disabled   = !isOnline || (phoneBusy && !isChamando) || !hasSip

              return (
                <div
                  key={m.id}
                  className={clsx(
                    'flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all',
                    isChamando          ? 'bg-emerald-50 border-emerald-300 shadow-sm' :
                    !isOnline           ? 'bg-gray-50 border-gray-100 opacity-60'      :
                    !hasSip             ? 'bg-gray-50 border-gray-100 opacity-50'      :
                                          'bg-white border-gray-200 hover:border-brand-300 hover:shadow-sm'
                  )}
                >
                  {/* Avatar — clica para ligar */}
                  <button
                    disabled={disabled}
                    onClick={() => !disabled && ligarParaMembro(m)}
                    className={clsx('focus:outline-none relative', disabled ? 'cursor-default' : 'cursor-pointer')}
                    title={!hasSip ? 'Sem credencial SIP' : !isOnline ? 'Offline' : `Ligar para ${m.nome}`}
                  >
                    <div className={clsx(
                      'w-12 h-12 rounded-full text-white text-sm font-bold flex items-center justify-center transition-opacity',
                      cor,
                      !disabled && 'hover:opacity-80'
                    )}>
                      {iniciais(m.nome)}
                    </div>
                    {/* Pulse quando chamando este membro */}
                    {isChamando && (
                      <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white animate-pulse"/>
                    )}
                  </button>

                  {/* Nome + cargo */}
                  <div className="w-full">
                    <p className="text-xs font-semibold text-gray-900 truncate leading-tight">{m.nome}</p>
                    <p className="text-2xs text-gray-400 truncate mt-0.5">{m.cargo || m.funcao || '—'}</p>
                  </div>

                  {/* Badge ramal — display estático */}
                  <div className={clsx(
                    'flex items-center gap-1 rounded-lg px-2.5 py-1 w-full justify-center',
                    hasSip ? 'bg-brand-50 border border-brand-100' : 'bg-gray-50 border border-gray-200'
                  )}>
                    <PhoneCall size={10} className={hasSip ? 'text-brand-500 flex-shrink-0' : 'text-gray-400 flex-shrink-0'}/>
                    <span className={clsx('text-xs font-mono font-bold', hasSip ? 'text-brand-600' : 'text-gray-400')}>
                      {m.ramal || '—'}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-1">
                    <span className={clsx('w-1.5 h-1.5 rounded-full',
                      isChamando ? 'bg-emerald-500 animate-pulse' : isOnline ? 'bg-emerald-500' : 'bg-gray-300'
                    )}/>
                    <span className="text-2xs text-gray-400">
                      {isChamando ? 'Em chamada' : isOnline ? 'Disponível' : 'Offline'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── ABA REATIVAÇÃO ──────────────────────────────────────────────────────────

const TEMPLATES_REATIVACAO: Record<string, string> = {
  pipeline:
    'Olá [NOME], aqui é [AGENTE] da [EMPRESA].\n\nNotei que faz um tempo desde nosso último contato e gostaria de entender se ainda faz sentido conversarmos.\n\nTemos novidades que podem ser relevantes para o seu negócio. Quando teria 15 minutos esta semana?',
  noshow:
    'Olá [NOME], tudo bem?\n\nPercebemos que não conseguimos nos conectar na reunião que tínhamos agendado. Entendo que imprevistos acontecem!\n\nGostaria de propor um novo horário que seja melhor para você. Qual seria a sua disponibilidade?',
  sem_compra:
    'Olá [NOME], aqui é [AGENTE] da [EMPRESA].\n\nFicamos felizes em ter trabalhado com você anteriormente e gostaríamos de entender como podemos continuar agregando valor ao seu negócio.\n\nPodemos conversar brevemente?',
  todos:
    'Olá [NOME], aqui é [AGENTE] da [EMPRESA].\n\nGostaria de retomar nosso contato e entender como posso ajudar seu negócio hoje.\n\nQuando seria um bom momento para conversarmos?',
}

const TIPO_LABEL: Record<string, string> = {
  pipeline:  'Leads perdidos no pipeline',
  noshow:    'Leads no-show (não compareceram)',
  sem_compra:'Clientes sem compra recente',
  todos:     'Todos os inativos',
}

export function PainelReativacao({ vendedorIdExterno }: { vendedorIdExterno?: string } = {}) {
  // ── Config ─────────────────────────────────────────────────────────────────
  const [tipo, setTipo]         = useState('pipeline')
  const [dias, setDias]         = useState(30)
  const [canal, setCanal]       = useState<'email'|'whatsapp'|'ambos'>('email')
  const [mensagem, setMensagem] = useState(TEMPLATES_REATIVACAO['pipeline'])

  // ── Lista ──────────────────────────────────────────────────────────────────
  const [leads, setLeads]           = useState<any[]>([])
  const [carregando, setCarregando] = useState(false)
  const [listaGerada, setListaGerada] = useState(false)
  const [selecionados, setSelecionados] = useState<string[]>([])
  const [arquivados, setArquivados] = useState<Set<string>>(new Set())

  // ── Envio ──────────────────────────────────────────────────────────────────
  const [enviando, setEnviando]     = useState(false)
  const [resultado, setResultado]   = useState<any | null>(null)

  function onTipoChange(novoTipo: string) {
    setTipo(novoTipo)
    setMensagem(TEMPLATES_REATIVACAO[novoTipo] || TEMPLATES_REATIVACAO['todos'])
    setLeads([])
    setListaGerada(false)
    setSelecionados([])
    setResultado(null)
  }

  async function gerarLista() {
    setCarregando(true)
    setLeads([])
    setListaGerada(false)
    setSelecionados([])
    setResultado(null)
    try {
      const r = await contatosApi.reativacao(tipo, dias)
      const data = (r.data as any[]) ?? []
      setLeads(data)
      setListaGerada(true)
    } catch {
      setLeads([])
      setListaGerada(true)
    } finally {
      setCarregando(false)
    }
  }

  async function iniciarReativacao() {
    const ids = selecionados.length > 0 ? selecionados : leads.filter(l => !arquivados.has(l.id)).map(l => String(l.id))
    if (ids.length === 0) return
    setEnviando(true)
    setResultado(null)
    try {
      const r = await contatosApi.reativarLote({ ids, canal, mensagem, vendedor_id: vendedorIdExterno })
      setResultado(r.data)
      // Remove enviados da lista
      setLeads(prev => prev.filter(l => !ids.includes(String(l.id))))
      setSelecionados([])
    } catch (e: any) {
      setResultado({ erro: e?.response?.data?.error || 'Erro ao iniciar reativação' })
    } finally {
      setEnviando(false)
    }
  }

  function arquivarLead(id: string) {
    setArquivados(prev => new Set([...prev, id]))
    setSelecionados(prev => prev.filter(x => x !== id))
    contatosApi.patch(id, { status: 'arquivado' }).catch(() => {})
  }

  function toggleSel(id: string) {
    setSelecionados(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const leadsVisiveis = leads.filter(l => !arquivados.has(String(l.id)))
  const todosSelec    = leadsVisiveis.length > 0 && selecionados.length === leadsVisiveis.length

  return (
    <div className="flex gap-5 items-start">

      {/* ── Sidebar config ─────────────────────────────────────────────────── */}
      <div className="w-72 flex-shrink-0 bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <RefreshCw size={14} className="text-brand-600"/>
          <h3 className="text-sm font-semibold text-gray-900">Configurar Reativação</h3>
        </div>
        <p className="text-xs text-gray-400 -mt-2">Leads/clientes inativos</p>

        {/* Dias */}
        <div>
          <label className="text-xs font-medium text-gray-700 block mb-1">Inativo há mais de (dias)</label>
          <input
            type="number"
            min={1} max={365}
            value={dias}
            onChange={e => setDias(Number(e.target.value))}
            className="input text-sm py-1.5 w-full"
          />
        </div>

        {/* Tipo de lista */}
        <div>
          <label className="text-xs font-medium text-gray-700 block mb-1">Tipo de lista</label>
          <select
            className="input text-sm py-1.5 w-full"
            value={tipo}
            onChange={e => onTipoChange(e.target.value)}
          >
            {Object.entries(TIPO_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        {/* Canal de envio */}
        <div>
          <label className="text-xs font-medium text-gray-700 block mb-2">Canal de envio</label>
          <div className="flex gap-2">
            {(['email', 'whatsapp', 'ambos'] as const).map(c => (
              <button
                key={c}
                onClick={() => setCanal(c)}
                className={clsx(
                  'flex-1 text-xs font-semibold py-1.5 rounded-lg border transition-colors',
                  canal === c
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                )}
              >
                {c === 'email' ? '📧' : c === 'whatsapp' ? '💬' : '📧+💬'}
              </button>
            ))}
          </div>
          <p className="text-2xs text-gray-400 mt-1.5">
            {canal === 'email' ? 'Envia e-mail para contatos com e-mail cadastrado' :
             canal === 'whatsapp' ? 'Envia WA pelo seu WhatsApp conectado' :
             'Envia e-mail + WhatsApp para todos'}
          </p>
        </div>

        {/* Template de mensagem */}
        <div>
          <label className="text-xs font-medium text-gray-700 block mb-1">Mensagem de reativação</label>
          <textarea
            rows={7}
            className="input text-xs py-2 w-full resize-none leading-relaxed"
            value={mensagem}
            onChange={e => setMensagem(e.target.value)}
          />
          <p className="text-2xs text-gray-400 mt-1">
            Use <span className="font-mono text-brand-600">[NOME]</span>, <span className="font-mono text-brand-600">[AGENTE]</span>, <span className="font-mono text-brand-600">[EMPRESA]</span>
          </p>
        </div>

        {/* Botões */}
        <button
          onClick={gerarLista}
          disabled={carregando}
          className="btn-secondary text-xs py-2 gap-1.5 w-full"
        >
          {carregando
            ? <><div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"/>{' '}Carregando...</>
            : <><Search size={12}/>{' '}Gerar lista</>
          }
        </button>

        <button
          onClick={iniciarReativacao}
          disabled={enviando || leadsVisiveis.length === 0 || !listaGerada}
          className="btn-primary text-xs py-2 gap-1.5 w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {enviando
            ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"/>{' '}Enviando...</>
            : <><Zap size={12}/>{' '}Iniciar reativação
              {(selecionados.length > 0 || leadsVisiveis.length > 0) && (
                <span className="ml-1 bg-white/20 rounded px-1">
                  {selecionados.length > 0 ? selecionados.length : leadsVisiveis.length}
                </span>
              )}
            </>
          }
        </button>
      </div>

      {/* ── Painel lista ───────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <FileText size={14} className="text-gray-500"/>
            <h3 className="text-sm font-semibold text-gray-900">Lista de leads para reativar</h3>
          </div>
          {listaGerada && leadsVisiveis.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">{leadsVisiveis.length} lead{leadsVisiveis.length !== 1 ? 's' : ''}</span>
              {selecionados.length > 0 && (
                <span className="text-xs font-semibold text-brand-600 bg-brand-50 border border-brand-100 rounded-full px-2 py-0.5">
                  {selecionados.length} selecionado{selecionados.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Resultado do envio */}
        {resultado && (
          <div className={clsx(
            'mx-4 mt-4 px-4 py-3 rounded-xl text-sm font-medium',
            resultado.erro ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
          )}>
            {resultado.erro ? (
              <span>❌ {resultado.erro}</span>
            ) : (
              <span>
                ✅ Reativação concluída — {resultado.total} contato{resultado.total !== 1 ? 's' : ''} reativado{resultado.total !== 1 ? 's' : ''}.
                {resultado.email_enviados > 0 && ` ${resultado.email_enviados} e-mail${resultado.email_enviados !== 1 ? 's' : ''} enviado${resultado.email_enviados !== 1 ? 's' : ''}.`}
                {resultado.wa_enviados > 0 && ` ${resultado.wa_enviados} mensagem${resultado.wa_enviados !== 1 ? 's' : ''} WA enviada${resultado.wa_enviados !== 1 ? 's' : ''}.`}
                {resultado.erros?.length > 0 && ` ${resultado.erros.length} erro${resultado.erros.length !== 1 ? 's' : ''}.`}
              </span>
            )}
          </div>
        )}

        {/* Empty states */}
        {!listaGerada && !carregando && (
          <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400">
            <Search size={32} className="mb-3 text-gray-200"/>
            <p className="text-sm">Clique em <strong className="text-gray-600">"Gerar lista"</strong> para ver os leads inativos</p>
          </div>
        )}

        {listaGerada && leadsVisiveis.length === 0 && !resultado && (
          <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400">
            <CheckCircle2 size={32} className="mb-3 text-emerald-300"/>
            <p className="text-sm text-gray-500">Nenhum lead inativo encontrado com esses filtros.</p>
            <p className="text-xs text-gray-400 mt-1">Tente aumentar o período ou mudar o tipo de lista.</p>
          </div>
        )}

        {/* Tabela */}
        {leadsVisiveis.length > 0 && (
          <>
            {/* Header */}
            <div className="grid grid-cols-[28px_2fr_1fr_1fr_80px_80px] px-4 py-2 bg-gray-50 border-b border-gray-100 items-center">
              <input
                type="checkbox"
                className="w-3.5 h-3.5 accent-indigo-500"
                checked={todosSelec}
                onChange={e => setSelecionados(e.target.checked ? leadsVisiveis.map(l => String(l.id)) : [])}
              />
              {['Lead', 'Telefone', 'E-mail', 'Tentativas', 'Ações'].map(h => (
                <span key={h} className="text-2xs font-semibold text-gray-400 uppercase tracking-wide">{h}</span>
              ))}
            </div>

            {/* Linhas */}
            {leadsVisiveis.map((lead, i) => {
              const id = String(lead.id)
              const temEmail = !!lead.email
              const temTel   = !!lead.telefone
              const dataUlt  = lead.atualizado_em
                ? new Date(lead.atualizado_em).toLocaleDateString('pt-BR')
                : lead.criado_em ? new Date(lead.criado_em).toLocaleDateString('pt-BR') : '—'

              return (
                <div
                  key={id}
                  className={clsx(
                    'grid grid-cols-[28px_2fr_1fr_1fr_80px_80px] px-4 py-3 border-b border-gray-100 items-center text-xs',
                    i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30',
                    selecionados.includes(id) && 'bg-brand-50/40'
                  )}
                >
                  <input
                    type="checkbox"
                    className="w-3.5 h-3.5 accent-indigo-500"
                    checked={selecionados.includes(id)}
                    onChange={() => toggleSel(id)}
                  />
                  <div>
                    <p className="font-medium text-gray-900 truncate">{lead.nome || '—'}</p>
                    <p className="text-gray-400 truncate text-2xs">{lead.razao_social || '—'} · {dataUlt}</p>
                  </div>
                  <div className={clsx('truncate', temTel ? 'text-gray-700 font-mono' : 'text-gray-300')}>
                    {temTel ? lead.telefone : '—'}
                  </div>
                  <div className={clsx('truncate', temEmail ? 'text-gray-700' : 'text-gray-300')}>
                    {temEmail ? lead.email : '—'}
                  </div>
                  <div className="font-mono text-gray-600">{lead.tentativas ?? 0}x</div>
                  <button
                    onClick={() => arquivarLead(id)}
                    title="Arquivar"
                    className="flex items-center justify-center w-7 h-7 rounded-lg bg-gray-50 border border-gray-200 text-gray-400 hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-colors"
                  >
                    <Archive size={12}/>
                  </button>
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}

// TabReativacao removida da Discadora — use PainelReativacao no módulo Vendedor

// ─── TABS CONFIG ──────────────────────────────────────────────────────────────

const TABS_BASE: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
  { id:'fila',      label:'Fila de Chamadas', icon:<PhoneCall size={13}/> },
  { id:'agendados', label:'Agendados',         icon:<Calendar size={13}/> },
  { id:'gravacoes', label:'Gravações',         icon:<Mic size={13}/> },
  { id:'manual',    label:'Chamada Manual',    icon:<Phone size={13}/> },
  { id:'agenda',    label:'Minha Agenda',      icon:<Calendar size={13}/> },
  { id:'aovivo',    label:'Ao Vivo',           icon:<Radio size={13}/> },
  { id:'historico', label:'Histórico',         icon:<History size={13}/> },
  { id:'ramal', label:'Ramal', icon:<Antenna size={13}/> },
]

// ─── PÁGINA PRINCIPAL ─────────────────────────────────────────────────────────

export default function DiscadoraPage() {
  const [activeTab, setActiveTab]         = useState<Tab>('fila')
  // Alertas ICP — estado global da página para badge no tab
  const [alertasNaoLidos, setAlertasNaoLidos] = useState(0)
  const [limiarICP, setLimiarICP]             = useState(85)

  function handleNovoAlerta(qtd: number) {
    // Só incrementa badge se o usuário não estiver na aba
    if (activeTab !== 'aovivo') setAlertasNaoLidos(prev => prev + qtd)
  }
  function handleAbrirAoVivo() {
    setActiveTab('aovivo')
    setAlertasNaoLidos(0)
  }

  const TABS = TABS_BASE.map(t =>
    t.id === 'aovivo' && alertasNaoLidos > 0
      ? { ...t, badge: alertasNaoLidos, _alerta: true }
      : t
  )

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
        {TABS.map((tab: any) => (
          <button
            key={tab.id}
            onClick={() => tab.id === 'aovivo' ? handleAbrirAoVivo() : setActiveTab(tab.id)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-all -mb-px relative',
              activeTab === tab.id ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            {/* Pulse no ícone quando há alertas não lidos */}
            {tab._alerta ? (
              <span className="relative flex-shrink-0">
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 animate-ping opacity-75" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500" />
                {tab.icon}
              </span>
            ) : tab.icon}
            {tab.label}
            {tab.badge !== undefined && (
              <span className={clsx(
                'text-2xs px-1.5 py-0.5 rounded-full font-bold',
                tab._alerta
                  ? 'bg-red-500 text-white animate-pulse'
                  : activeTab === tab.id ? 'bg-brand-100 text-brand-600' : 'bg-gray-200 text-gray-500'
              )}>{tab.badge}</span>
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
      {activeTab === 'aovivo'    && (
        <TabAoVivo
          onGoFila={() => setActiveTab('fila')}
          limiarICP={limiarICP}
          onLimiarChange={setLimiarICP}
          onNovoAlerta={handleNovoAlerta}
        />
      )}
      {activeTab === 'historico' && <TabHistorico />}
      {activeTab === 'ramal'      && <TabRamal />}
    </div>
  )
}
