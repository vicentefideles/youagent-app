import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { equipeApi } from '@/services/api'
import {
  Users, BarChart2, Target, Pencil, X, UserPlus, CheckCircle2,
  MessageCircle, Wifi, WifiOff, RefreshCw, Link2, Radio, Copy, Check,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────

interface ApiVendedor {
  id: string
  cliente_id: string
  nome: string
  email: string
  cargo: string
  meta_mensal: number
  ativo: boolean
  criado_em: string
  whatsapp_status?: string
  ramal?: string
}

interface Vendedor {
  id: string
  nome: string
  email: string
  cargo: 'Closer' | 'SDR' | 'Gerente'
  status: 'Ativo' | 'Inativo'
  telefone: string
  agentesAtivos: number
  ligacoes: number
  reunioes: number
  showRate: number
  conversao: number
  meta: number
  realizado: number
  avatar: string
  whatsappStatus: string
  ramal?: string
}

interface NovoVendedor {
  nome: string
  email: string
  cargo: 'Closer' | 'SDR' | 'Gerente'
  telefone: string
  whatsapp?: string
}

interface ModalWhatsAppProps {
  vendedor: { id: string; nome: string }
  onClose: () => void
}

type Tab = 'vendedores' | 'desempenho' | 'metas'

// ── Helpers ────────────────────────────────────────────────────────────────

function getInitials(nome: string): string {
  const parts = nome.trim().split(' ')
  const first = parts[0]?.[0] ?? ''
  const last = parts[parts.length - 1]?.[0] ?? ''
  return (first + last).toUpperCase()
}


// ── Sub-components ─────────────────────────────────────────────────────────

function AvatarBubble({ initials, size = 'md' }: { initials: string; size?: 'sm' | 'md' | 'lg' }) {
  const cls =
    size === 'sm'
      ? 'w-8 h-8 text-xs'
      : size === 'lg'
      ? 'w-12 h-12 text-base'
      : 'w-9 h-9 text-sm'
  return (
    <div
      className={`${cls} rounded-full bg-blue-100 text-blue-700 font-semibold flex items-center justify-center shrink-0`}
    >
      {initials}
    </div>
  )
}

function CargoBadge({ cargo }: { cargo: Vendedor['cargo'] }) {
  const map: Record<Vendedor['cargo'], string> = {
    Closer: 'bg-blue-50 text-blue-700',
    SDR: 'bg-purple-50 text-purple-700',
    Gerente: 'bg-gray-100 text-gray-600',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[cargo]}`}>
      {cargo}
    </span>
  )
}

function StatusDot({ status }: { status: Vendedor['status'] }) {
  return (
    <span className="inline-flex items-center text-sm text-gray-700">
      <span
        className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
          status === 'Ativo' ? 'bg-emerald-500' : 'bg-gray-300'
        }`}
      />
      {status}
    </span>
  )
}

function InlineBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  const color =
    pct >= 80
      ? 'bg-emerald-500'
      : pct >= 60
      ? 'bg-blue-500'
      : pct >= 40
      ? 'bg-amber-400'
      : 'bg-red-400'
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 tabular-nums">{value}%</span>
    </div>
  )
}

// ── Progress ring ──────────────────────────────────────────────────────────

function ProgressRing({ pct }: { pct: number }) {
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference
  const color =
    pct >= 80
      ? '#10b981'
      : pct >= 60
      ? '#3b82f6'
      : pct >= 40
      ? '#f59e0b'
      : '#ef4444'

  return (
    <svg width="88" height="88" className="-rotate-90">
      <circle cx="44" cy="44" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="8" />
      <circle
        cx="44"
        cy="44"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={`${circumference}`}
        strokeDashoffset={`${offset}`}
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
    </svg>
  )
}

// ── Modal Adicionar / Editar ────────────────────────────────────────────────

interface ModalAdicionarProps {
  inicial?: Partial<NovoVendedor>
  onClose: () => void
  onSave: (v: NovoVendedor) => void
}

function ModalAdicionar({ inicial, onClose, onSave }: ModalAdicionarProps) {
  const [form, setForm] = useState<NovoVendedor>({
    nome: inicial?.nome ?? '',
    email: inicial?.email ?? '',
    cargo: inicial?.cargo ?? 'Closer',
    telefone: inicial?.telefone ?? '',
  })

  const isEdicao = Boolean(inicial?.nome)

  function handleSave() {
    if (!form.nome.trim() || !form.email.trim()) return
    onSave(form)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900">
            {isEdicao ? 'Editar Vendedor' : 'Adicionar Vendedor'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Aviso de auto-provisionamento — só no modo criação */}
        {!isEdicao && (
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-5">
            <Radio size={15} className="text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-blue-700">Ramal SIP gerado automaticamente</p>
              <p className="text-xs text-blue-600 mt-0.5">
                Ao salvar, o sistema cria automaticamente um ramal e credenciais SIP na Telnyx para este vendedor. As credenciais serão exibidas para configuração do softphone.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nome completo</label>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              placeholder="Ex: João Alves"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">E-mail</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="email@empresa.com"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Cargo</label>
            <select
              value={form.cargo}
              onChange={(e) => setForm({ ...form, cargo: e.target.value as Vendedor['cargo'] })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Closer">Closer</option>
              <option value="SDR">SDR</option>
              <option value="Gerente">Gerente</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Telefone</label>
            <input
              type="tel"
              value={form.telefone}
              onChange={(e) => setForm({ ...form, telefone: e.target.value })}
              placeholder="(11) 99000-0000"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">WhatsApp pessoal</label>
            <input
              type="tel"
              value={form.whatsapp || ''}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              placeholder="(11) 99000-0000"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-2xs text-gray-400 mt-1">Número que receberá notificações de agendamento</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!form.nome.trim() || !form.email.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Salvar e gerar ramal
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal: credenciais SIP pós-criação ────────────────────────────────────────
interface ModalCredenciaisSIPProps {
  vendedor: { nome: string; ramal?: string; sip_username?: string; sip_password?: string }
  onClose: () => void
}

function ModalCredenciaisSIP({ vendedor, onClose }: ModalCredenciaisSIPProps) {
  const [copiado, setCopiado] = useState<string | null>(null)

  function copiar(valor: string, chave: string) {
    navigator.clipboard.writeText(valor).catch(() => {})
    setCopiado(chave)
    setTimeout(() => setCopiado(null), 2000)
  }

  const campos = [
    { label: 'Servidor SIP',  valor: 'sip.telnyx.com',          chave: 'server', oculto: false },
    { label: 'Usuário SIP',   valor: vendedor.sip_username || '—', chave: 'user',   oculto: false },
    { label: 'Senha SIP',     valor: vendedor.sip_password || '—', chave: 'pass',   oculto: true  },
    { label: 'Ramal interno', valor: vendedor.ramal || '—',        chave: 'ramal',  oculto: false },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={20} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Perfil criado com sucesso!</p>
            <p className="text-xs text-gray-500">{vendedor.nome} · Ramal {vendedor.ramal}</p>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {vendedor.sip_username ? (
            <>
              <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                <Radio size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-700">
                  <strong>Credenciais SIP geradas automaticamente via Telnyx.</strong> Compartilhe com {vendedor.nome} para configurar o softphone (Zoiper, Linphone ou Bria).
                </p>
              </div>

              <div className="space-y-3">
                {campos.map(f => (
                  <div key={f.chave}>
                    <label className="block text-2xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{f.label}</label>
                    <div className="flex gap-2">
                      <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono text-gray-800 select-all">
                        {f.oculto ? '••••••••••••' : f.valor}
                      </div>
                      <button
                        onClick={() => copiar(f.valor, f.chave)}
                        className={`flex items-center gap-1 px-3 rounded-lg border text-xs font-medium transition-colors ${
                          copiado === f.chave
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {copiado === f.chave ? <Check size={12} /> : <Copy size={12} />}
                        {copiado === f.chave ? 'Copiado' : 'Copiar'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-2xs text-gray-400 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                💡 Para chamadas internas, disque o número do ramal do colega (ex: <span className="font-mono font-bold">2202</span>). O e-mail de boas-vindas com acesso à plataforma foi enviado para {vendedor.nome}.
              </p>
            </>
          ) : (
            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
              <Radio size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-700">
                Perfil criado e ramal <strong>{vendedor.ramal}</strong> atribuído. Credenciais SIP não foram geradas agora (verifique a configuração Telnyx). Use <strong>"Provisionar Ramais SIP"</strong> para retentar.
              </p>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalWhatsApp({ vendedor, onClose }: ModalWhatsAppProps) {
  const [qr, setQr] = useState<string | null>(null)
  const [status, setStatus] = useState<'aguardando' | 'conectando' | 'conectado' | 'erro'>('aguardando')
  const [erro, setErro] = useState('')
  const qc = useQueryClient()
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  async function iniciarConexao() {
    setStatus('conectando')
    setErro('')
    try {
      const r = await fetch(`https://app.etztech.com/api/v1/equipe/${vendedor.id}/whatsapp/conectar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('youagent_jwt')}` },
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Erro ao gerar QR Code')
      setQr(data.qr)
      // Polling de status a cada 3s
      pollRef.current = setInterval(async () => {
        const sr = await fetch(`https://app.etztech.com/api/v1/equipe/${vendedor.id}/whatsapp/status`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('youagent_jwt')}` },
        })
        const sd = await sr.json()
        if (sd.conectado || sd.whatsapp_status === 'conectado') {
          clearInterval(pollRef.current!)
          setStatus('conectado')
          qc.invalidateQueries({ queryKey: ['equipe'] })
        }
      }, 3000)
    } catch (e: unknown) {
      setStatus('erro')
      setErro((e as Error).message)
    }
  }

  useEffect(() => { iniciarConexao(); return () => { if (pollRef.current) clearInterval(pollRef.current) } }, [])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageCircle size={18} className="text-green-600" />
            <h2 className="font-semibold text-gray-900">Conectar WhatsApp</h2>
          </div>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>

        {status === 'conectando' && qr && (
          <>
            <p className="text-sm text-gray-600 mb-4 text-center">
              Abra o WhatsApp de <strong>{vendedor.nome}</strong> → <em>Dispositivos conectados</em> → <em>Conectar dispositivo</em> e escaneie:
            </p>
            <div className="flex justify-center mb-4">
              <img src={qr} alt="QR Code WhatsApp" className="w-48 h-48 rounded-xl border border-gray-200" />
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400 justify-center">
              <RefreshCw size={12} className="animate-spin" /> Aguardando leitura do QR Code...
            </div>
          </>
        )}

        {status === 'conectando' && !qr && (
          <div className="flex flex-col items-center py-6 gap-3">
            <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Gerando QR Code...</p>
          </div>
        )}

        {status === 'conectado' && (
          <div className="flex flex-col items-center py-6 gap-3">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
              <Wifi size={24} className="text-green-600" />
            </div>
            <p className="font-semibold text-gray-900">WhatsApp conectado!</p>
            <p className="text-sm text-gray-500 text-center">
              {vendedor.nome} agora receberá notificações e os clientes receberão mensagens do número pessoal dele.
            </p>
            <button onClick={onClose} className="mt-2 px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
              Fechar
            </button>
          </div>
        )}

        {status === 'erro' && (
          <div className="flex flex-col items-center py-4 gap-3">
            <WifiOff size={28} className="text-red-500" />
            <p className="text-sm text-red-600 text-center">{erro || 'Erro ao conectar WhatsApp.'}</p>
            <button onClick={iniciarConexao} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium">
              Tentar novamente
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

interface ModalMetasProps {
  vendedores: Vendedor[]
  onClose: () => void
  onSalvar: (metas: Record<string, number>) => void
}

function ModalMetas({ vendedores, onClose, onSalvar }: ModalMetasProps) {
  const [metas, setMetas] = useState<Record<string, number>>(
    Object.fromEntries(vendedores.filter((v) => v.status === 'Ativo').map((v) => [v.id, v.meta]))
  )

  function handleSalvarMeta() {
    onSalvar(metas)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900">Definir Metas Mensais</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          {vendedores
            .filter((v) => v.status === 'Ativo')
            .map((v) => (
              <div key={v.id} className="flex items-center gap-3">
                <AvatarBubble initials={v.avatar} size="sm" />
                <span className="flex-1 text-sm text-gray-800">{v.nome}</span>
                <input
                  type="number"
                  value={metas[v.id] ?? v.meta}
                  min={0}
                  onChange={(e) => setMetas((prev) => ({ ...prev, [v.id]: Number(e.target.value) }))}
                  className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-right text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSalvarMeta}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Salvar Metas
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Tab: Vendedores ────────────────────────────────────────────────────────

interface TabVendedoresProps {
  vendedores: Vendedor[]
  onToggleStatus: (id: string, ativo: boolean) => void
  onAddVendedor: (v: NovoVendedor) => void
  onEditVendedor: (id: string, v: NovoVendedor) => void
  novoVendedorCriado?: { nome: string; ramal?: string; sip_username?: string; sip_password?: string } | null
  onFecharCredenciais?: () => void
}

function TabVendedores({ vendedores, onToggleStatus, onAddVendedor, onEditVendedor, novoVendedorCriado, onFecharCredenciais }: TabVendedoresProps) {
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState<Vendedor | null>(null)
  const [whatsappModal, setWhatsappModal] = useState<{ id: string; nome: string } | null>(null)
  const [linkCopiado, setLinkCopiado] = useState<string | null>(null)
  const [sipProvisionando, setSipProvisionando] = useState(false)
  const [sipResultado, setSipResultado] = useState<string | null>(null)

  async function provisionarSipBackfill() {
    setSipProvisionando(true)
    setSipResultado(null)
    try {
      const token = localStorage.getItem('etz_token') || localStorage.getItem('youagent_jwt') || ''
      const r = await fetch('https://app.etztech.com/api/v1/equipe/provisionar-sip', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error)
      setSipResultado(
        data.provisionados > 0
          ? `✅ ${data.provisionados} ramal(is) SIP provisionado(s) com sucesso!`
          : data.msg || 'Todos os membros já têm credenciais SIP.'
      )
    } catch (e: unknown) {
      setSipResultado(`❌ Erro: ${(e as Error).message}`)
    } finally {
      setSipProvisionando(false)
    }
  }

  async function gerarLinkWhatsApp(vendedorId: string) {
    try {
      const r = await fetch(`https://app.etztech.com/api/v1/equipe/${vendedorId}/whatsapp/gerar-link`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('youagent_jwt')}` },
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error)
      await navigator.clipboard.writeText(data.link)
      setLinkCopiado(vendedorId)
      setTimeout(() => setLinkCopiado(null), 3000)
    } catch {
      alert('Erro ao gerar link. Tente novamente.')
    }
  }

  const totalAtivos = vendedores.filter((v) => v.status === 'Ativo').length
  const totalAgentes = vendedores.reduce((acc, v) => acc + v.agentesAtivos, 0)
  const totalReunioes = vendedores.reduce((acc, v) => acc + v.reunioes, 0)

  const kpis = [
    { label: 'Total Vendedores', value: vendedores.length },
    { label: 'Ativos', value: totalAtivos },
    { label: 'Agentes Ativos', value: totalAgentes },
    { label: 'Reuniões/mês', value: totalReunioes },
  ]

  return (
    <div className="space-y-5">
      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs text-gray-500 mb-1">{k.label}</p>
            <p className="text-2xl font-bold text-gray-900">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-wrap gap-2">
          <h2 className="text-sm font-semibold text-gray-900">Vendedores</h2>
          <div className="flex items-center gap-2 flex-wrap">
            {sipResultado && (
              <span className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">{sipResultado}</span>
            )}
            <button
              onClick={provisionarSipBackfill}
              disabled={sipProvisionando}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-600 border border-brand-200 rounded-lg hover:bg-brand-50 disabled:opacity-50 transition-colors"
              title="Provisionar credenciais SIP para membros que ainda não têm ramal Telnyx ativo"
            >
              <Radio size={13} className={sipProvisionando ? 'animate-pulse' : ''}/>
              {sipProvisionando ? 'Provisionando...' : 'Provisionar Ramais SIP'}
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <UserPlus size={14} />
              Adicionar Vendedor
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 whitespace-nowrap">Vendedor</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Cargo</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Ramal</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Agentes</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Ligações</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Reuniões</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Show Rate</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {vendedores.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-10 text-center text-sm text-gray-400">
                    Nenhum vendedor cadastrado ainda.
                  </td>
                </tr>
              )}
              {vendedores.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <AvatarBubble initials={v.avatar} size="sm" />
                      <div>
                        <p className="font-medium text-gray-900 leading-tight">{v.nome}</p>
                        <p className="text-xs text-gray-400">{v.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <CargoBadge cargo={v.cargo} />
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusDot status={v.status} />
                  </td>
                  <td className="px-4 py-3.5">
                    {v.ramal ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-100 text-xs font-mono font-semibold text-blue-700">
                        📞 {v.ramal}
                      </span>
                    ) : (
                      <span className="text-xs text-amber-500 bg-amber-50 border border-amber-100 rounded px-2 py-0.5">
                        sem ramal
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right text-gray-700 tabular-nums">{v.agentesAtivos}</td>
                  <td className="px-4 py-3.5 text-right text-gray-700 tabular-nums">{v.ligacoes.toLocaleString('pt-BR')}</td>
                  <td className="px-4 py-3.5 text-right text-gray-700 tabular-nums">{v.reunioes}</td>
                  <td className="px-4 py-3.5">
                    <InlineBar value={v.showRate} />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setEditando(v)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <Pencil size={12} />
                        Editar
                      </button>
                      {v.whatsappStatus === 'conectado' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-green-700 bg-green-100 rounded-lg">
                          <Wifi size={12} />
                          Conectado
                        </span>
                      ) : (
                        <button
                          onClick={() => setWhatsappModal({ id: v.id, nome: v.nome })}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                          title="Conectar WhatsApp pessoal"
                        >
                          <MessageCircle size={12} />
                          WhatsApp
                        </button>
                      )}
                      <button
                        onClick={() => gerarLinkWhatsApp(v.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                          linkCopiado === v.id
                            ? 'text-emerald-700 bg-emerald-50'
                            : 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                        }`}
                        title="Copiar link para o vendedor conectar o próprio WhatsApp"
                      >
                        <Link2 size={12} />
                        {linkCopiado === v.id ? 'Copiado!' : 'Link WA'}
                      </button>
                      <button
                        onClick={() => onToggleStatus(v.id, v.status === 'Ativo')}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                          v.status === 'Ativo'
                            ? 'text-red-600 bg-red-50 hover:bg-red-100'
                            : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                        }`}
                      >
                        {v.status === 'Ativo' ? 'Desativar' : 'Ativar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <ModalAdicionar onClose={() => setShowModal(false)} onSave={onAddVendedor} />
      )}

      {editando && (
        <ModalAdicionar
          inicial={{ nome: editando.nome, email: editando.email, cargo: editando.cargo, telefone: editando.telefone }}
          onClose={() => setEditando(null)}
          onSave={(form) => {
            onEditVendedor(editando.id, form)
            setEditando(null)
          }}
        />
      )}

      {whatsappModal && (
        <ModalWhatsApp
          vendedor={whatsappModal}
          onClose={() => setWhatsappModal(null)}
        />
      )}

      {novoVendedorCriado && onFecharCredenciais && (
        <ModalCredenciaisSIP
          vendedor={novoVendedorCriado}
          onClose={onFecharCredenciais}
        />
      )}
    </div>
  )
}

// ── Tab: Desempenho ────────────────────────────────────────────────────────

interface TabDesempenhoProps {
  vendedores: Vendedor[]
}

function TabDesempenho({ vendedores }: TabDesempenhoProps) {
  if (vendedores.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-gray-400">
        Nenhum vendedor cadastrado ainda.
      </div>
    )
  }

  const ranked = [...vendedores].sort((a, b) => b.realizado - a.realizado)

  function progressColor(pct: number): string {
    if (pct >= 100) return 'bg-emerald-500'
    if (pct >= 70) return 'bg-blue-500'
    if (pct >= 50) return 'bg-amber-400'
    return 'bg-red-400'
  }

  const melhorPerf = ranked[0]
  const maiorShowRate = [...vendedores].sort((a, b) => b.showRate - a.showRate)[0]
  const atencao = vendedores.find((v) => v.status === 'Inativo') ?? vendedores[vendedores.length - 1]

  const insights = [
    {
      title: 'Melhor performance',
      value: melhorPerf.nome,
      sub: `${melhorPerf.realizado} reuniões este mês`,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      title: 'Maior show rate',
      value: `${maiorShowRate.showRate}%`,
      sub: maiorShowRate.nome,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Precisa de atenção',
      value: atencao.nome,
      sub: atencao.status === 'Inativo' ? 'Vendedor inativo' : 'Performance abaixo da meta',
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
  ]

  return (
    <div className="space-y-5">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">Ranking de Performance</h2>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700">
          <span>Maio 2026</span>
        </div>
      </div>

      {/* Ranking table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">#</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Vendedor</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Reuniões</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Meta</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 min-w-[140px]">Progresso</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Show Rate</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Conversão</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {ranked.map((v, idx) => {
                const pct = v.meta > 0 ? Math.min(100, Math.round((v.realizado / v.meta) * 100)) : 0
                return (
                  <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          idx === 0
                            ? 'bg-amber-100 text-amber-700'
                            : idx === 1
                            ? 'bg-gray-100 text-gray-600'
                            : 'bg-gray-50 text-gray-500'
                        }`}
                      >
                        {idx + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <AvatarBubble initials={v.avatar} size="sm" />
                        <span className="font-medium text-gray-900">{v.nome}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums text-gray-700">{v.realizado}</td>
                    <td className="px-4 py-3.5 text-right tabular-nums text-gray-400">{v.meta}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden min-w-[80px]">
                          <div
                            className={`h-full rounded-full ${progressColor(pct)}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 tabular-nums w-9 text-right">{pct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums text-gray-700">{v.showRate}%</td>
                    <td className="px-4 py-3.5 text-right tabular-nums text-gray-700">{v.conversao}%</td>
                    <td className="px-4 py-3.5">
                      <StatusDot status={v.status} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insight cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {insights.map((ins) => (
          <div key={ins.title} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs text-gray-500 mb-2">{ins.title}</p>
            <p className={`text-lg font-bold ${ins.color} leading-tight`}>{ins.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{ins.sub}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Tab: Metas ─────────────────────────────────────────────────────────────

interface TabMetasProps {
  vendedores: Vendedor[]
  onSalvarMetas: (metas: Record<string, number>) => void
}

function TabMetas({ vendedores, onSalvarMetas }: TabMetasProps) {
  const [showModal, setShowModal] = useState(false)
  const ativos = vendedores.filter((v) => v.status === 'Ativo')

  function ringColor(pct: number): string {
    if (pct >= 80) return '#10b981'
    if (pct >= 60) return '#3b82f6'
    if (pct >= 40) return '#f59e0b'
    return '#ef4444'
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">Metas do Mês — Maio 2026</h2>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
        >
          <Target size={13} />
          Definir Metas
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {ativos.map((v) => {
          const pct = v.meta > 0 ? Math.min(100, Math.round((v.realizado / v.meta) * 100)) : 0
          const color = ringColor(pct)
          return (
            <div key={v.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col items-center text-center gap-3">
              <AvatarBubble initials={v.avatar} size="lg" />
              <div>
                <p className="font-semibold text-gray-900 text-sm leading-tight">{v.nome}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  <CargoBadge cargo={v.cargo} />
                </p>
              </div>

              <div className="relative flex items-center justify-center">
                <ProgressRing pct={pct} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold" style={{ color }}>{pct}%</span>
                </div>
              </div>

              <div className="w-full border-t border-gray-100 pt-3 grid grid-cols-2 gap-2 text-center">
                <div>
                  <p className="text-xs text-gray-400">Meta</p>
                  <p className="text-base font-bold text-gray-800">{v.meta}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Realizado</p>
                  <p className="text-base font-bold" style={{ color }}>{v.realizado}</p>
                </div>
              </div>

              {pct >= 100 && (
                <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                  <CheckCircle2 size={13} />
                  Meta atingida!
                </div>
              )}
            </div>
          )
        })}
      </div>

      {showModal && (
        <ModalMetas
          vendedores={vendedores}
          onClose={() => setShowModal(false)}
          onSalvar={(metas) => {
            onSalvarMetas(metas)
            setShowModal(false)
          }}
        />
      )}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function EquipePage() {
  const [activeTab, setActiveTab] = useState<Tab>('vendedores')
  const [novoVendedorCriado, setNovoVendedorCriado] = useState<{ nome: string; ramal?: string; sip_username?: string; sip_password?: string } | null>(null)
  const qc = useQueryClient()

  const { data: rawEquipe = [], isLoading } = useQuery({
    queryKey: ['equipe'],
    queryFn: () => equipeApi.list().then((r) => r.data as ApiVendedor[]),
  })

  const { data: metricas = [] } = useQuery({
    queryKey: ['equipe-metricas'],
    queryFn: () => equipeApi.metricas().then(r => r.data as Array<{id: string; ligacoes: number; reunioes: number; showRate: number; conversao: number}>),
  })

  const metricasMap = Object.fromEntries(metricas.map(m => [m.id, m]))

  const vendedores: Vendedor[] = isLoading
    ? []
    : rawEquipe.map((v) => {
        const m = metricasMap[v.id] || {}
        return {
          id: v.id,
          nome: v.nome,
          email: v.email ?? '',
          cargo: (v.cargo as Vendedor['cargo']) ?? 'Closer',
          status: v.ativo ? 'Ativo' : 'Inativo',
          telefone: '',
          agentesAtivos: 0,
          ligacoes: (m as {ligacoes?: number}).ligacoes || 0,
          reunioes: (m as {reunioes?: number}).reunioes || 0,
          showRate: (m as {showRate?: number}).showRate || 0,
          conversao: (m as {conversao?: number}).conversao || 0,
          meta: v.meta_mensal ?? 0,
          realizado: 0,
          avatar: getInitials(v.nome),
          whatsappStatus: v.whatsapp_status || 'desconectado',
          ramal: v.ramal,
        }
      })

  const criarMutation = useMutation({
    mutationFn: (data: NovoVendedor) =>
      equipeApi.create({ nome: data.nome, email: data.email, cargo: data.cargo }),
    onSuccess: (resp) => {
      qc.invalidateQueries({ queryKey: ['equipe'] })
      const vendedor = (resp as any)?.data
      if (vendedor) {
        setNovoVendedorCriado({
          nome:         vendedor.nome,
          ramal:        vendedor.ramal,
          sip_username: vendedor.sip_username,
          sip_password: vendedor.sip_password,
        })
      }
    },
  })

  const editarMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: NovoVendedor }) =>
      equipeApi.update(id, { nome: data.nome, email: data.email, cargo: data.cargo }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['equipe'] }),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) =>
      equipeApi.update(id, { ativo: !ativo }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['equipe'] }),
  })

  const metaMutation = useMutation({
    mutationFn: ({ id, meta }: { id: string; meta: number }) =>
      equipeApi.update(id, { meta_mensal: meta }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['equipe'] }),
  })

  function handleToggleStatus(id: string, ativo: boolean) {
    toggleMutation.mutate({ id, ativo })
  }

  function handleAddVendedor(novo: NovoVendedor) {
    criarMutation.mutate(novo)
  }

  function handleEditVendedor(id: string, dados: NovoVendedor) {
    editarMutation.mutate({ id, data: dados })
  }

  function handleSalvarMetas(metas: Record<string, number>) {
    Object.entries(metas).forEach(([id, meta]) => {
      metaMutation.mutate({ id, meta })
    })
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'vendedores', label: 'Vendedores', icon: <Users size={15} /> },
    { key: 'desempenho', label: 'Desempenho', icon: <BarChart2 size={15} /> },
    { key: 'metas', label: 'Metas', icon: <Target size={15} /> },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
          <Users size={18} className="text-blue-600" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900 leading-tight">Equipe</h1>
          <p className="text-xs text-gray-400">Gerencie sua equipe de vendas</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg transition-all ${
              activeTab === t.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'vendedores' && (
        <TabVendedores
          vendedores={vendedores}
          onToggleStatus={handleToggleStatus}
          onAddVendedor={handleAddVendedor}
          onEditVendedor={handleEditVendedor}
          novoVendedorCriado={novoVendedorCriado}
          onFecharCredenciais={() => setNovoVendedorCriado(null)}
        />
      )}
      {activeTab === 'desempenho' && <TabDesempenho vendedores={vendedores} />}
      {activeTab === 'metas' && (
        <TabMetas vendedores={vendedores} onSalvarMetas={handleSalvarMetas} />
      )}
    </div>
  )
}
