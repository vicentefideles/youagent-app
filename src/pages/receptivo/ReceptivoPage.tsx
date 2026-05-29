import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { receptivoApi, whatsappApi } from '@/services/api'
import {
  Clock,
  ThumbsUp,
  CheckCircle2,
  MessageSquare,
  Mail,
  Globe,
  Phone,
  Send,
  User,
  Settings,
  Inbox,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type Canal = 'WhatsApp' | 'Email' | 'Site' | 'Telefone'
type Status = 'Aguardando' | 'Em atendimento' | 'Resolvido'
type Prioridade = 'Alta' | 'Normal' | 'Baixa'

interface InboundLead {
  id: number
  nome: string
  empresa: string
  canal: Canal
  mensagem: string
  tempo: string
  status: Status
  prioridade: Prioridade
}

interface WaConversation {
  id: number
  nome: string
  empresa: string
  lastMsg: string
  tempo: string
  unread: number
  messages: { from: 'lead' | 'ai'; text: string; time: string }[]
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const WA_CONVERSATIONS: WaConversation[] = [
  {
    id: 1, nome: 'Rafael Teixeira', empresa: 'Nexus Soluções', lastMsg: 'Olá, vi vocês em um anúncio...', tempo: '2 min', unread: 1,
    messages: [
      { from: 'lead', text: 'Olá, vi vocês em um anúncio e gostaria de saber mais sobre a plataforma de agentes.', time: '14:28' },
      { from: 'ai',   text: 'Olá Rafael! Que ótimo você entrar em contato. Somos a ETZ — plataforma de agentes de IA para vendas B2B. Posso agendar uma demo para você conhecer como funciona?', time: '14:28' },
    ],
  },
  {
    id: 2, nome: 'Marcos Vinicius', empresa: 'Constru Tech', lastMsg: 'Vocês têm trial gratuito?', tempo: '35 min', unread: 1,
    messages: [
      { from: 'lead', text: 'Oi, quero entender como funciona o agente de voz. Vocês têm trial gratuito?', time: '13:55' },
      { from: 'ai',   text: 'Olá Marcos! Sim, oferecemos período de teste. Você pode me contar um pouco mais sobre seu processo de vendas hoje?', time: '13:55' },
    ],
  },
  { id: 3, nome: 'Paula Ramos',    empresa: 'InfoSec Ltda',  lastMsg: 'Perfeito, aguardo o contato.', tempo: '1h 10min', unread: 0, messages: [{ from: 'lead', text: 'Perfeito, aguardo o contato.', time: '13:20' }] },
  { id: 4, nome: 'Fernando Klein', empresa: 'Retail Max',    lastMsg: 'Qual o preço por agente?',     tempo: '2h',        unread: 2, messages: [{ from: 'lead', text: 'Qual o preço por agente?', time: '12:30' }] },
  { id: 5, nome: 'Bianca Torres',  empresa: 'HR Solutions',  lastMsg: 'Obrigada! Te ligo depois.',    tempo: '3h',        unread: 0, messages: [{ from: 'lead', text: 'Obrigada! Te ligo depois.', time: '11:30' }] },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CANAL_ICON: Record<Canal, React.ReactNode> = {
  WhatsApp: <MessageSquare size={14} className="text-green-600" />,
  Email:    <Mail size={14} className="text-blue-600" />,
  Site:     <Globe size={14} className="text-purple-600" />,
  Telefone: <Phone size={14} className="text-orange-600" />,
}

const CANAL_BG: Record<Canal, string> = {
  WhatsApp: 'bg-green-50 text-green-700 border-green-200',
  Email:    'bg-blue-50 text-blue-700 border-blue-200',
  Site:     'bg-purple-50 text-purple-700 border-purple-200',
  Telefone: 'bg-orange-50 text-orange-700 border-orange-200',
}

const STATUS_STYLE: Record<Status, string> = {
  'Aguardando':     'bg-yellow-50 text-yellow-700 border border-yellow-200',
  'Em atendimento': 'bg-blue-50 text-blue-700 border border-blue-200',
  'Resolvido':      'bg-green-50 text-green-700 border border-green-200',
}

const PRIO_STYLE: Record<Prioridade, string> = {
  Alta:   'text-red-600',
  Normal: 'text-gray-600',
  Baixa:  'text-gray-400',
}

const QUICK_REPLIES = [
  'Vou verificar e retorno',
  'Pode me ligar?',
  'Vou te passar para um especialista',
]

// ─── Toggle ───────────────────────────────────────────────────────────────────

function ToggleSwitch({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={`relative inline-flex w-11 h-6 rounded-full transition-colors ${on ? 'bg-blue-600' : 'bg-gray-200'}`}
    >
      <span
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-5' : ''}`}
      />
    </button>
  )
}

// ─── Tab: Fila de Entrada ─────────────────────────────────────────────────────

function ChatPanel({
  lead,
  onClose,
  onTransferir,
  onEnviarMensagem,
}: {
  lead: InboundLead
  onClose: () => void
  onTransferir: (id: number) => void
  onEnviarMensagem: (id: number) => void
}) {
  const [msg, setMsg] = useState('')

  function handleEnviar() {
    if (!msg.trim()) return
    onEnviarMensagem(lead.id)
    setMsg('')
  }

  return (
    <div className="flex flex-col bg-white border-l border-gray-200 w-80 shrink-0">
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div>
          <p className="font-semibold text-sm text-gray-900">{lead.nome}</p>
          <p className="text-xs text-gray-500">{lead.empresa}</p>
        </div>
        <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
      </div>
      <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
        <div className="bg-gray-100 rounded-lg px-3 py-2 text-sm text-gray-700 max-w-[90%]">
          {lead.mensagem}
        </div>
        <div className="bg-blue-600 rounded-lg px-3 py-2 text-sm text-white self-end max-w-[90%]">
          Olá {lead.nome.split(' ')[0]}! Recebemos sua mensagem. Como posso ajudar?
        </div>
      </div>
      <div className="p-3 border-t border-gray-100 flex flex-col gap-2">
        <div className="flex flex-wrap gap-1">
          {QUICK_REPLIES.map(r => (
            <button
              key={r}
              onClick={() => setMsg(r)}
              className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              {r}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Digite uma mensagem..."
            value={msg}
            onChange={e => setMsg(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleEnviar()}
          />
          <button
            onClick={handleEnviar}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Send size={14} />
          </button>
        </div>
        <button
          onClick={() => onTransferir(lead.id)}
          className="w-full text-xs text-gray-500 border border-gray-200 rounded-lg py-1.5 hover:bg-gray-50 flex items-center justify-center gap-1"
        >
          <User size={12} /> Transferir para vendedor
        </button>
      </div>
    </div>
  )
}

const CANAL_MAP: Record<string, Canal> = {
  whatsapp: 'WhatsApp',
  email: 'Email',
  site: 'Site',
  telefone: 'Telefone',
}

const STATUS_MAP: Record<string, Status> = {
  aguardando: 'Aguardando',
  em_atendimento: 'Em atendimento',
  resolvido: 'Resolvido',
}

let _leadIdCounter = 1000

function mapToInboundLead(r: { id: string; nome?: string; telefone?: string; origem?: string; status?: string; criado_em: string }): InboundLead {
  return {
    id: ++_leadIdCounter,
    nome: r.nome ?? 'Desconhecido',
    empresa: '—',
    canal: (CANAL_MAP[r.origem?.toLowerCase() ?? ''] ?? 'Telefone') as Canal,
    mensagem: '',
    tempo: new Date(r.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    status: (STATUS_MAP[r.status?.toLowerCase() ?? ''] ?? 'Aguardando') as Status,
    prioridade: 'Normal' as Prioridade,
  }
}

function FilaTab() {
  const { data: rawLeads = [] } = useQuery({
    queryKey: ['receptivo'],
    queryFn: () => receptivoApi.list().then(r => r.data),
  })

  const [leads, setLeads] = useState<InboundLead[]>([])
  const [activeChat, setActiveChat] = useState<InboundLead | null>(null)

  useEffect(() => {
    if (rawLeads.length > 0) {
      setLeads(rawLeads.map(mapToInboundLead))
    }
  }, [rawLeads])

  function atender(id: number) {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status: 'Em atendimento' as Status } : l))
    const lead = leads.find(l => l.id === id)
    if (lead) setActiveChat({ ...lead, status: 'Em atendimento' })
  }

  function handleTransferir(id: number) {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status: 'Resolvido' as Status } : l))
    receptivoApi.update(String(id), { status: 'transferido' }).catch(console.error)
    setActiveChat(null)
  }

  function handleEnviarMensagem(id: number) {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status: 'Em atendimento' as Status } : l))
    receptivoApi.update(String(id), { status: 'em_atendimento' }).catch(console.error)
  }

  const hoje = new Date().toDateString()
  const atendidosHoje = (rawLeads as any[]).filter((l: any) => {
    const status = l.status?.toLowerCase() ?? ''
    return (status === 'atendido' || status === 'resolvido' || status === 'transferido') &&
      new Date(l.criado_em).toDateString() === hoje
  }).length

  const kpis = [
    { label: 'Aguardando',              value: leads.filter(l => l.status === 'Aguardando').length.toString(),     icon: Clock,        color: 'text-yellow-600 bg-yellow-50' },
    { label: 'Atendidos hoje',          value: atendidosHoje > 0 ? String(atendidosHoje) : '0',                    icon: CheckCircle2, color: 'text-green-600 bg-green-50'   },
    { label: 'Tempo médio de resposta', value: atendidosHoje > 0 ? '—' : '—',                                       icon: Clock,        color: 'text-blue-600 bg-blue-50'     },
    { label: 'Satisfação',              value: atendidosHoje > 0 ? '—' : '—',                                       icon: ThumbsUp,     color: 'text-purple-600 bg-purple-50' },
  ]

  return (
    <div className="flex flex-1 min-h-0">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4 p-5 pb-0">
          {kpis.map(k => (
            <div key={k.label} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3 shadow-sm">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${k.color}`}>
                <k.icon size={16} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{k.label}</p>
                <p className="text-lg font-bold text-gray-900">{k.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto p-5">
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Lead', 'Canal', 'Mensagem', 'Tempo', 'Status', 'Prioridade', 'Ações'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">
                      Nenhum lead inbound ainda.
                    </td>
                  </tr>
                )}
                {leads.map(lead => (
                  <tr key={lead.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{lead.nome}</p>
                      <p className="text-xs text-gray-500">{lead.empresa}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${CANAL_BG[lead.canal]}`}>
                        {CANAL_ICON[lead.canal]} {lead.canal}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <p className="text-gray-700 truncate" title={lead.mensagem}>{lead.mensagem.slice(0, 60)}{lead.mensagem.length > 60 ? '…' : ''}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{lead.tempo}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLE[lead.status]}`}>{lead.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold ${PRIO_STYLE[lead.prioridade]}`}>{lead.prioridade}</span>
                    </td>
                    <td className="px-4 py-3">
                      {lead.status !== 'Resolvido' && (
                        <button
                          onClick={() => atender(lead.id)}
                          className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          Atender
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

      {activeChat && (
        <ChatPanel
          lead={activeChat}
          onClose={() => setActiveChat(null)}
          onTransferir={handleTransferir}
          onEnviarMensagem={handleEnviarMensagem}
        />
      )}
    </div>
  )
}

// ─── Tab: WhatsApp Receptivo ──────────────────────────────────────────────────

function WhatsAppTab() {
  const [autoReply, setAutoReply] = useState(true)
  const [selected, setSelected] = useState<WaConversation>(WA_CONVERSATIONS[0])
  const [msgInput, setMsgInput] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [conversations, setConversations] = useState<WaConversation[]>(WA_CONVERSATIONS)

  async function handleEnviarMensagem() {
    if (!msgInput.trim() || enviando) return
    const texto = msgInput.trim()
    setEnviando(true)
    try {
      await whatsappApi.send({ para: selected.nome, mensagem: texto })
      const newMsg = { from: 'ai' as const, text: texto, time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }
      setConversations(prev => prev.map(c =>
        c.id === selected.id
          ? { ...c, messages: [...c.messages, newMsg], lastMsg: texto }
          : c
      ))
      setSelected(prev => ({ ...prev, messages: [...prev.messages, newMsg], lastMsg: texto }))
      setMsgInput('')
    } catch (err) {
      console.error('Erro ao enviar:', err)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="flex flex-1 min-h-0 p-5 gap-4">
      {/* Conversation list */}
      <div className="w-72 shrink-0 bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900">WhatsApp</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Auto-resposta IA</span>
            <ToggleSwitch on={autoReply} onChange={setAutoReply} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map(c => (
            <button
              key={c.id}
              onClick={() => setSelected(c)}
              className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${selected.id === c.id ? 'bg-blue-50' : ''}`}
            >
              <div className="flex items-start justify-between mb-0.5">
                <p className="text-sm font-medium text-gray-900 truncate">{c.nome}</p>
                <span className="text-xs text-gray-400 shrink-0 ml-2">{c.tempo}</span>
              </div>
              <p className="text-xs text-gray-500 truncate">{c.lastMsg}</p>
              {c.unread > 0 && (
                <span className="mt-1 inline-block text-xs px-1.5 py-0.5 bg-green-500 text-white rounded-full">{c.unread}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat view */}
      <div className="flex-1 bg-white border border-gray-100 rounded-xl shadow-sm flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="font-semibold text-gray-900">{selected.nome}</p>
          <p className="text-xs text-gray-500">{selected.empresa}</p>
        </div>
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
          {selected.messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.from === 'ai' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${m.from === 'ai' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                {m.text}
                <span className={`block text-xs mt-1 ${m.from === 'ai' ? 'text-blue-200' : 'text-gray-400'}`}>{m.time}</span>
              </div>
            </div>
          ))}
          {autoReply && (
            <div className="text-center">
              <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-full">
                Auto-resposta IA ativa
              </span>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-gray-100 flex gap-2">
          <input
            className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Digite uma mensagem..."
            value={msgInput}
            onChange={e => setMsgInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleEnviarMensagem()}
          />
          <button
            onClick={handleEnviarMensagem}
            disabled={enviando || !msgInput.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Tab: Configuração ────────────────────────────────────────────────────────

function ConfigTab() {
  const [canalEmail, setCanalEmail] = useState(true)
  const [canalWa, setCanalWa] = useState(true)
  const [canalSite, setCanalSite] = useState(false)
  const [autoFora, setAutoFora] = useState(true)
  const [saved, setSaved] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [horarioInicio, setHorarioInicio] = useState('09')
  const [horarioFim, setHorarioFim] = useState('18')
  const [boas, setBoas] = useState('Olá! Recebemos seu contato e nossa equipe retornará em breve. 😊')
  const [msgFora, setMsgFora] = useState('Estamos fora do horário. Retornaremos no próximo dia útil às 09h.')
  const [sla, setSla] = useState('1h')
  const [emailAddr, setEmailAddr] = useState('contato@etztech.com')

  async function save() {
    setSalvando(true)
    try {
      await receptivoApi.saveConfig({
        horario_inicio: horarioInicio,
        horario_fim: horarioFim,
        mensagem_boas_vindas: boas,
        mensagem_fora_horario: msgFora,
        sla,
        email: emailAddr,
        canal_email: canalEmail,
        canal_whatsapp: canalWa,
        canal_site: canalSite,
        auto_resposta_fora: autoFora,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error('Erro ao salvar config:', err)
    } finally {
      setSalvando(false)
    }
  }

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex flex-col gap-6">
        {/* Horário */}
        <Section title="Horário de atendimento">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">Abertura</label>
              <select className={inputCls} value={horarioInicio} onChange={e => setHorarioInicio(e.target.value)}>
                {Array.from({ length: 24 }, (_, i) => String(i).padStart(2,'0')).map(h => (
                  <option key={h} value={h}>{h}h</option>
                ))}
              </select>
            </div>
            <span className="text-gray-400 mt-5">até</span>
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">Fechamento</label>
              <select className={inputCls} value={horarioFim} onChange={e => setHorarioFim(e.target.value)}>
                {Array.from({ length: 24 }, (_, i) => String(i).padStart(2,'0')).map(h => (
                  <option key={h} value={h}>{h}h</option>
                ))}
              </select>
            </div>
          </div>
        </Section>

        {/* Boas-vindas */}
        <Section title="Mensagem de boas-vindas">
          <textarea
            className={`${inputCls} resize-none`}
            rows={2}
            value={boas}
            onChange={e => setBoas(e.target.value)}
          />
        </Section>

        {/* Auto-resposta fora */}
        <Section title="Auto-resposta fora do horário">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-700">Ativada</span>
            <ToggleSwitch on={autoFora} onChange={setAutoFora} />
          </div>
          {autoFora && (
            <textarea
              className={`${inputCls} resize-none`}
              rows={2}
              value={msgFora}
              onChange={e => setMsgFora(e.target.value)}
            />
          )}
        </Section>

        {/* Canais */}
        <Section title="Canais ativos">
          <div className="flex flex-col gap-3">
            <ChannelRow
              label="Email"
              icon={<Mail size={16} className="text-blue-500" />}
              on={canalEmail}
              onToggle={setCanalEmail}
            >
              {canalEmail && (
                <input className={inputCls} value={emailAddr} onChange={e => setEmailAddr(e.target.value)} placeholder="email@empresa.com" />
              )}
            </ChannelRow>

            <ChannelRow
              label="WhatsApp"
              icon={<MessageSquare size={16} className="text-green-500" />}
              on={canalWa}
              onToggle={setCanalWa}
            >
              {canalWa && (
                <p className="text-sm text-gray-600 px-3 py-2 bg-gray-50 rounded-lg">+55 (11) 9 9999-9999</p>
              )}
            </ChannelRow>

            <ChannelRow
              label="Widget do Site"
              icon={<Globe size={16} className="text-purple-500" />}
              on={canalSite}
              onToggle={setCanalSite}
            >
              {canalSite && (
                <div className="bg-gray-900 text-green-400 text-xs rounded-lg p-3 font-mono overflow-x-auto">
                  {'<script src="https://cdn.etztech.io/widget.js" data-id="seu-id"></script>'}
                </div>
              )}
            </ChannelRow>
          </div>
        </Section>

        {/* SLA */}
        <Section title="SLA de resposta">
          <select className={inputCls} value={sla} onChange={e => setSla(e.target.value)}>
            {['30min', '1h', '2h', '4h'].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </Section>

        <button
          onClick={save}
          disabled={salvando}
          className={`self-start px-6 py-2.5 font-semibold text-sm rounded-lg transition-colors disabled:opacity-60 ${
            saved ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {salvando ? 'Salvando...' : saved ? 'Salvo ✓' : 'Salvar configurações'}
        </button>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  )
}

function ChannelRow({
  label,
  icon,
  on,
  onToggle,
  children,
}: {
  label: string
  icon: React.ReactNode
  on: boolean
  onToggle: (v: boolean) => void
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm text-gray-700 font-medium">{label}</span>
        </div>
        <ToggleSwitch on={on} onChange={onToggle} />
      </div>
      {children}
    </div>
  )
}

// ─── Tab: Histórico ───────────────────────────────────────────────────────────

type ResultadoChamada = 'atendido' | 'abandonado' | 'transferido' | 'agendou'
type PeriodoFiltro = 'hoje' | '7d' | '30d'

interface ChamadaHistorico {
  id: number
  dataHora: string
  numero: string
  empresa: string
  duracao: string
  resultado: ResultadoChamada
  operador: string
}

const RESULTADO_STATUS_MAP: Record<string, ResultadoChamada> = {
  atendido:      'atendido',
  resolvido:     'atendido',
  em_atendimento:'atendido',
  abandonado:    'abandonado',
  transferido:   'transferido',
  agendou:       'agendou',
  agendado:      'agendou',
}

function mapToHistorico(
  r: { id: string | number; nome?: string; telefone?: string; origem?: string; status?: string; criado_em: string },
  idx: number
): ChamadaHistorico {
  const dt = new Date(r.criado_em)
  const dataHora = `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')} ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`
  const resultado: ResultadoChamada = RESULTADO_STATUS_MAP[r.status?.toLowerCase() ?? ''] ?? 'atendido'
  return {
    id: typeof r.id === 'number' ? r.id : idx + 1,
    dataHora,
    numero: r.telefone ?? '—',
    empresa: r.nome ?? '—',
    duracao: '—',
    resultado,
    operador: '—',
  }
}

const RESULTADO_STYLE: Record<ResultadoChamada, string> = {
  atendido:    'bg-blue-50 text-blue-700',
  abandonado:  'bg-red-50 text-red-600',
  transferido: 'bg-amber-50 text-amber-700',
  agendou:     'bg-green-50 text-green-700',
}

const RESULTADO_LABEL: Record<ResultadoChamada, string> = {
  atendido:    'Atendido',
  abandonado:  'Abandonado',
  transferido: 'Transferido',
  agendou:     'Agendou',
}

function HistTab() {
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('hoje')
  const [resultadoFiltro, setResultadoFiltro] = useState<ResultadoChamada | 'todos'>('todos')

  const { data: rawLeads = [] } = useQuery({
    queryKey: ['receptivo'],
    queryFn: () => receptivoApi.list().then(r => r.data),
  })

  const historico: ChamadaHistorico[] = rawLeads.map(mapToHistorico)

  const hoje = new Date()
  const hojePrefix = `${String(hoje.getDate()).padStart(2,'0')}/${String(hoje.getMonth()+1).padStart(2,'0')}`

  const filtered = historico.filter(c => {
    if (resultadoFiltro !== 'todos' && c.resultado !== resultadoFiltro) return false
    if (periodo === 'hoje') return c.dataHora.startsWith(hojePrefix)
    if (periodo === '7d') {
      const [dayMonth] = c.dataHora.split(' ')
      const [dd, mm] = dayMonth.split('/')
      const date = new Date(hoje.getFullYear(), parseInt(mm)-1, parseInt(dd))
      const diff = (hoje.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
      return diff <= 7
    }
    return true
  })

  return (
    <div className="flex-1 overflow-auto p-5 space-y-4">
      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {([['hoje', 'Hoje'], ['7d', 'Últimos 7 dias'], ['30d', 'Últimos 30 dias']] as [PeriodoFiltro, string][]).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setPeriodo(id)}
              className={`text-xs px-3 py-1.5 rounded-md transition-colors ${periodo === id ? 'bg-white text-gray-900 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <select
          value={resultadoFiltro}
          onChange={e => setResultadoFiltro(e.target.value as ResultadoChamada | 'todos')}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="todos">Todos os resultados</option>
          <option value="atendido">Atendido</option>
          <option value="abandonado">Abandonado</option>
          <option value="transferido">Transferido</option>
          <option value="agendou">Agendou</option>
        </select>
        <button className="ml-auto flex items-center gap-1.5 text-sm border border-gray-300 rounded-lg px-3 py-1.5 text-gray-700 hover:bg-gray-50">
          <Send size={14} /> Exportar CSV
        </button>
      </div>

      {/* Tabela */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {['Data / Hora', 'Número', 'Empresa identificada', 'Duração', 'Resultado', 'Operador'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-xs font-mono text-gray-600">{c.dataHora}</td>
                <td className="px-4 py-3 text-xs font-mono text-gray-700">{c.numero}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{c.empresa}</td>
                <td className="px-4 py-3 text-gray-600">{c.duracao}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${RESULTADO_STYLE[c.resultado]}`}>
                    {RESULTADO_LABEL[c.resultado]}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{c.operador}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">Nenhuma chamada encontrada.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Tab: KPIs ────────────────────────────────────────────────────────────────

interface HoraData {
  hora: number
  chamadas: number
}

const HORAS_DATA: HoraData[] = [
  { hora: 8,  chamadas: 3  },
  { hora: 9,  chamadas: 7  },
  { hora: 10, chamadas: 12 },
  { hora: 11, chamadas: 15 },
  { hora: 12, chamadas: 6  },
  { hora: 13, chamadas: 4  },
  { hora: 14, chamadas: 18 },
  { hora: 15, chamadas: 22 },
  { hora: 16, chamadas: 14 },
  { hora: 17, chamadas: 9  },
  { hora: 18, chamadas: 5  },
  { hora: 19, chamadas: 2  },
]

interface ResultadoDist {
  label: string
  count: number
  color: string
  barColor: string
}

function KpisTab() {
  const maxChamadas = Math.max(...HORAS_DATA.map(h => h.chamadas))
  const horaPico = HORAS_DATA.reduce((prev, cur) => cur.chamadas > prev.chamadas ? cur : prev)

  const distribuicao: ResultadoDist[] = [
    { label: 'Atendido',    count: 28, color: 'text-blue-700',  barColor: 'bg-blue-500'  },
    { label: 'Agendou',     count: 19, color: 'text-green-700', barColor: 'bg-green-500' },
    { label: 'Transferido', count: 12, color: 'text-amber-700', barColor: 'bg-amber-500' },
    { label: 'Abandonado',  count: 8,  color: 'text-red-700',   barColor: 'bg-red-400'   },
  ]

  const totalDist = distribuicao.reduce((a, d) => a + d.count, 0)

  return (
    <div className="flex-1 overflow-auto p-5 space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Chamadas hoje', value: '67', icon: Phone, color: 'text-blue-600 bg-blue-50' },
          { label: 'Taxa atendimento', value: '81%', icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
          { label: 'Tempo médio espera', value: '34s', icon: Clock, color: 'text-amber-600 bg-amber-50' },
          { label: 'Taxa conversão', value: '28%', icon: ThumbsUp, color: 'text-purple-600 bg-purple-50' },
        ].map(k => (
          <div key={k.label} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3 shadow-sm">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${k.color}`}>
              <k.icon size={16} />
            </div>
            <div>
              <p className="text-xs text-gray-500">{k.label}</p>
              <p className="text-lg font-bold text-gray-900">{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Gráfico de barras: chamadas por hora */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Chamadas por hora</h3>
              <p className="text-xs text-gray-500 mt-0.5">Volume de chamadas ao longo do dia</p>
            </div>
          </div>
          <div className="flex items-end gap-1 h-36">
            {HORAS_DATA.map(h => {
              const pct = (h.chamadas / maxChamadas) * 100
              const isPico = h.hora === horaPico.hora
              return (
                <div key={h.hora} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-500" style={{ fontSize: '9px' }}>{h.chamadas}</span>
                  <div
                    className={`w-full rounded-t-sm transition-all ${isPico ? 'bg-blue-600' : 'bg-blue-200'}`}
                    style={{ height: `${pct}%` }}
                    title={`${h.hora}h: ${h.chamadas} chamadas`}
                  />
                  <span className="text-gray-400" style={{ fontSize: '9px' }}>{h.hora}h</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Distribuição de resultados + horário pico */}
        <div className="flex flex-col gap-4">
          {/* Card pico */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Clock size={18} className="text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-amber-700 font-medium">Horário de pico identificado</p>
              <p className="text-xl font-bold text-amber-900">{horaPico.hora}h–{horaPico.hora + 1}h</p>
              <p className="text-xs text-amber-600">{horaPico.chamadas} chamadas neste intervalo</p>
            </div>
          </div>

          {/* Distribuição de resultados */}
          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex-1">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Distribuição de resultados</h3>
            <div className="space-y-3">
              {distribuicao.map(d => {
                const pct = Math.round((d.count / totalDist) * 100)
                return (
                  <div key={d.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-medium ${d.color}`}>{d.label}</span>
                      <span className="text-xs text-gray-500">{d.count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className={`${d.barColor} h-2 rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

type TabId = 'fila' | 'whatsapp' | 'config' | 'hist' | 'kpis'

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'fila',     label: 'Fila de Entrada',     icon: Inbox         },
  { id: 'whatsapp', label: 'WhatsApp Receptivo',   icon: MessageSquare },
  { id: 'hist',     label: 'Histórico',            icon: Clock         },
  { id: 'kpis',     label: 'KPIs',                 icon: ThumbsUp      },
  { id: 'config',   label: 'Configuração',          icon: Settings      },
]

export default function ReceptivoPage() {
  const [tab, setTab] = useState<TabId>('fila')

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Page header */}
      <div className="px-6 pt-5 pb-0 bg-white border-b border-gray-100">
        <h1 className="text-xl font-semibold text-gray-900 mb-1">Receptivo / Inbound</h1>
        <p className="text-sm text-gray-500 mb-4">Gerencie leads que chegam por todos os canais</p>
        <div className="flex gap-1">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <t.icon size={15} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {tab === 'fila'     && <FilaTab />}
        {tab === 'whatsapp' && <WhatsAppTab />}
        {tab === 'hist'     && <HistTab />}
        {tab === 'kpis'     && <KpisTab />}
        {tab === 'config'   && <div className="overflow-y-auto flex-1"><ConfigTab /></div>}
      </div>
    </div>
  )
}
