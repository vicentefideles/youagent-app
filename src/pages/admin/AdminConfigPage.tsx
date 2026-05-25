import { useState } from 'react'
import {
  Settings,
  CreditCard,
  Sliders,
  Plug,
  CheckCircle,
  ChevronRight,
  RefreshCw,
  Building2,
  Shield,
  Bell,
  Users,
  Trash2,
  Plus,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Section = 'plataforma' | 'planos' | 'limites' | 'integracoes' | 'empresa' | 'seguranca' | 'notificacoes' | 'equipe'

interface NavItem {
  id: Section
  label: string
  icon: React.ReactNode
}

interface PlanRow {
  name: string
  price: number
  features: string[]
}

interface Integration {
  name: string
  status: 'Conectado' | 'Desconectado'
  detail: string
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const NAV: NavItem[] = [
  { id: 'plataforma', label: 'Plataforma', icon: <Settings className="w-4 h-4" /> },
  { id: 'planos', label: 'Planos', icon: <CreditCard className="w-4 h-4" /> },
  { id: 'limites', label: 'Limites', icon: <Sliders className="w-4 h-4" /> },
  { id: 'integracoes', label: 'Integrações', icon: <Plug className="w-4 h-4" /> },
  { id: 'empresa', label: 'Empresa', icon: <Building2 className="w-4 h-4" /> },
  { id: 'seguranca', label: 'Segurança', icon: <Shield className="w-4 h-4" /> },
  { id: 'notificacoes', label: 'Notificações', icon: <Bell className="w-4 h-4" /> },
  { id: 'equipe', label: 'Equipe', icon: <Users className="w-4 h-4" /> },
]

const PLAN_ROWS: PlanRow[] = [
  { name: 'Starter', price: 997, features: ['1 agente', '500 ligações/mês', 'Suporte e-mail'] },
  { name: 'Growth', price: 1997, features: ['3 agentes', '2.000 ligações/mês', 'Suporte WhatsApp', 'Inteligência Coletiva'] },
  { name: 'Enterprise', price: 4997, features: ['Ilimitado', 'Ligações ilimitadas', 'Fine-tuning', 'Manager dedicado'] },
]

const INTEGRATIONS: Integration[] = [
  { name: 'Telnyx', status: 'Conectado', detail: 'Voice + SMS + WhatsApp' },
  { name: 'ElevenLabs', status: 'Conectado', detail: 'TTS — latência ~180ms' },
  { name: 'Claude API', status: 'Conectado', detail: 'claude-sonnet-4-6' },
  { name: 'Supabase', status: 'Conectado', detail: 'DB + Auth + Storage' },
]

// ─── Sub-panels ───────────────────────────────────────────────────────────────

function PlataformaPanel() {
  return (
    <div className="space-y-5">
      <h2 className="text-base font-semibold text-gray-900">Configurações da plataforma</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Nome da plataforma</label>
          <input defaultValue="ETZ" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">URL base</label>
          <input defaultValue="app.etztech.com.br" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Logotipo</label>
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
          <p className="text-sm text-gray-400">Clique para enviar um arquivo de imagem</p>
          <p className="text-xs text-gray-300 mt-1">PNG, SVG ou JPG — máx. 2MB</p>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Ambiente</label>
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option>Produção</option>
          <option>Homologação</option>
          <option>Dev</option>
        </select>
      </div>
      <div>
        <button className="bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors">
          Salvar
        </button>
      </div>
    </div>
  )
}

function PlanosPanel() {
  return (
    <div className="space-y-5">
      <h2 className="text-base font-semibold text-gray-900">Gestão de planos</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3">Plano</th>
            <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3">Preço/mês</th>
            <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3">Features principais</th>
            <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {PLAN_ROWS.map(p => (
            <tr key={p.name} className="hover:bg-gray-50/50">
              <td className="py-4 font-medium text-gray-900">{p.name}</td>
              <td className="py-4 text-gray-700">
                R$ {p.price.toLocaleString('pt-BR')}
              </td>
              <td className="py-4">
                <div className="flex flex-wrap gap-1">
                  {p.features.map(f => (
                    <span key={f} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{f}</span>
                  ))}
                </div>
              </td>
              <td className="py-4">
                <button className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700">
                  Editar plano <ChevronRight className="w-3 h-3" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function LimitesPanel() {
  return (
    <div className="space-y-5">
      <h2 className="text-base font-semibold text-gray-900">Limites por plano</h2>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Máx. agentes por plano</p>
        <div className="grid grid-cols-3 gap-4">
          {['Starter', 'Growth', 'Enterprise'].map((p, i) => (
            <div key={p}>
              <label className="block text-xs font-medium text-gray-500 mb-1">{p}</label>
              <input
                type="number"
                defaultValue={[1, 3, 999][i]}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Máx. ligações/mês (Starter)</label>
          <input type="number" defaultValue={500} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Timeout de transferência (seg)</label>
          <input type="number" defaultValue={30} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Máx. gravações armazenadas (dias)</label>
          <input type="number" defaultValue={90} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>
      <button className="bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors">
        Salvar limites
      </button>
    </div>
  )
}

function IntegracoesPanel() {
  return (
    <div className="space-y-5">
      <h2 className="text-base font-semibold text-gray-900">Integrações da plataforma</h2>
      <div className="space-y-3">
        {INTEGRATIONS.map(intg => (
          <div key={intg.name} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{intg.name}</p>
                <p className="text-xs text-gray-500">{intg.detail}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {intg.status}
              </span>
              <button className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-blue-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:border-blue-300 transition-colors">
                <RefreshCw className="w-3 h-3" />
                Reconfigurar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Panel: Empresa ───────────────────────────────────────────────────────────

function EmpresaPanel() {
  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
  return (
    <div className="space-y-5">
      <h2 className="text-base font-semibold text-gray-900">Dados da EtzTech</h2>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="block text-xs font-medium text-gray-500 mb-1">Nome da empresa</label><input defaultValue="ETZ" className={inputCls} /></div>
        <div><label className="block text-xs font-medium text-gray-500 mb-1">CNPJ</label><input defaultValue="12.345.678/0001-99" className={inputCls} /></div>
        <div><label className="block text-xs font-medium text-gray-500 mb-1">E-mail de suporte</label><input defaultValue="suporte@etztech.com" className={inputCls} /></div>
        <div><label className="block text-xs font-medium text-gray-500 mb-1">Telefone</label><input defaultValue="(11) 3456-7890" className={inputCls} /></div>
        <div><label className="block text-xs font-medium text-gray-500 mb-1">Site</label><input defaultValue="https://etztech.com.br" className={inputCls} /></div>
        <div><label className="block text-xs font-medium text-gray-500 mb-1">Endereço</label><input defaultValue="Av. Paulista, 1000 — SP" className={inputCls} /></div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Logo</label>
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">Y</div>
          <div>
            <p className="text-sm text-gray-600 font-medium">Clique para enviar novo logo</p>
            <p className="text-xs text-gray-400 mt-0.5">PNG, SVG ou JPG — máx. 2MB</p>
            <input type="file" className="mt-2 text-xs text-gray-500" accept="image/*" />
          </div>
        </div>
      </div>
      <button className="bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors">Salvar</button>
    </div>
  )
}

// ─── Panel: Segurança ─────────────────────────────────────────────────────────

interface LogAcesso { usuario: string; ip: string; data: string; acao: 'login' | 'logout' | 'falha' }

const LOGS_ACESSO: LogAcesso[] = [
  { usuario: 'admin@etztech.com', ip: '189.40.12.8', data: '24/05 09:14', acao: 'login' },
  { usuario: 'carlos@etztech.com', ip: '177.92.44.3', data: '24/05 08:50', acao: 'login' },
  { usuario: 'unknown', ip: '45.33.12.1', data: '24/05 07:22', acao: 'falha' },
  { usuario: 'admin@etztech.com', ip: '189.40.12.8', data: '23/05 18:30', acao: 'logout' },
  { usuario: 'ana@etztech.com', ip: '200.150.33.9', data: '23/05 17:00', acao: 'login' },
]

function SegurancaPanel() {
  const [twoFa, setTwoFa] = useState(true)
  const [sessao, setSessao] = useState('8h')
  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  const acoesMap: Record<LogAcesso['acao'], string> = {
    login: 'bg-green-100 text-green-700',
    logout: 'bg-gray-100 text-gray-600',
    falha: 'bg-red-100 text-red-700',
  }

  return (
    <div className="space-y-6">
      <h2 className="text-base font-semibold text-gray-900">Segurança</h2>

      <div className="flex items-center justify-between py-3 border-b border-gray-100">
        <div>
          <p className="text-sm font-medium text-gray-800">2FA obrigatório para admin</p>
          <p className="text-xs text-gray-400">Autenticação de dois fatores para todos os admins</p>
        </div>
        <button onClick={() => setTwoFa(v => !v)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${twoFa ? 'bg-blue-600' : 'bg-gray-200'}`}>
          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${twoFa ? 'translate-x-4' : 'translate-x-1'}`} />
        </button>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Whitelist de IPs (um por linha)</label>
        <textarea defaultValue={'189.40.12.8\n177.92.44.3\n200.150.33.9'} rows={4} className={inputCls + ' resize-none'} />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Sessão máxima</label>
        <select value={sessao} onChange={e => setSessao(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          {['1h', '4h', '8h', '24h'].map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-gray-800">Log de acessos</p>
          <button className="text-xs font-medium text-blue-600 hover:text-blue-700">Exportar log</button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {['Usuário', 'IP', 'Data', 'Ação'].map(h => <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-2">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {LOGS_ACESSO.map((l, i) => (
              <tr key={i} className="hover:bg-gray-50/50">
                <td className="py-2.5 text-xs text-gray-700">{l.usuario}</td>
                <td className="py-2.5 text-xs font-mono text-gray-500">{l.ip}</td>
                <td className="py-2.5 text-xs text-gray-500">{l.data}</td>
                <td className="py-2.5"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${acoesMap[l.acao]}`}>{l.acao}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button className="bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors">Salvar</button>
    </div>
  )
}

// ─── Panel: Notificações ──────────────────────────────────────────────────────

interface NotifToggle { email: boolean; sistema: boolean; whatsapp: boolean }

interface NotifItem {
  label: string
  key: keyof typeof NOTIF_INIT
  canais: ('email' | 'sistema' | 'whatsapp')[]
}

const NOTIF_INIT: Record<string, NotifToggle> = {
  novo_cliente: { email: true, sistema: true, whatsapp: false },
  pagamento_recebido: { email: true, sistema: true, whatsapp: false },
  pagamento_atrasado: { email: true, sistema: true, whatsapp: true },
  ticket_urgente: { email: true, sistema: true, whatsapp: false },
  uso_alto: { email: false, sistema: true, whatsapp: false },
}

const NOTIF_ITEMS: NotifItem[] = [
  { label: 'Novo cliente cadastrado', key: 'novo_cliente', canais: ['email', 'sistema'] },
  { label: 'Pagamento recebido', key: 'pagamento_recebido', canais: ['email', 'sistema'] },
  { label: 'Pagamento atrasado', key: 'pagamento_atrasado', canais: ['email', 'sistema', 'whatsapp'] },
  { label: 'Ticket urgente aberto', key: 'ticket_urgente', canais: ['email', 'sistema'] },
  { label: 'Uso de agente acima de 90%', key: 'uso_alto', canais: ['sistema'] },
]

function NotifPanel() {
  const [notifs, setNotifs] = useState(NOTIF_INIT)

  function toggle(key: string, canal: keyof NotifToggle) {
    setNotifs(prev => ({ ...prev, [key]: { ...prev[key], [canal]: !prev[key][canal] } }))
  }

  const canalLabel: Record<keyof NotifToggle, string> = { email: 'E-mail', sistema: 'Sistema', whatsapp: 'WhatsApp' }

  return (
    <div className="space-y-5">
      <h2 className="text-base font-semibold text-gray-900">Notificações</h2>
      <div className="divide-y divide-gray-100">
        {NOTIF_ITEMS.map(item => (
          <div key={item.key} className="py-4 flex items-center justify-between">
            <p className="text-sm font-medium text-gray-800">{item.label}</p>
            <div className="flex items-center gap-4">
              {item.canais.map(canal => (
                <div key={canal} className="flex items-center gap-1.5">
                  <button
                    onClick={() => toggle(item.key, canal)}
                    className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${notifs[item.key][canal] ? 'bg-blue-600' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform ${notifs[item.key][canal] ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                  <span className="text-xs text-gray-500">{canalLabel[canal]}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button className="bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors">Salvar</button>
    </div>
  )
}

// ─── Panel: Equipe ────────────────────────────────────────────────────────────

interface MembroEquipe {
  id: string
  nome: string
  cargo: string
  email: string
  role: 'admin' | 'suporte' | 'comercial' | 'dev'
  status: 'ativo' | 'inativo'
}

const MEMBROS_INIT: MembroEquipe[] = [
  { id: 'm1', nome: 'Vicente Luiz', cargo: 'CEO', email: 'vicente@etztech.com', role: 'admin', status: 'ativo' },
  { id: 'm2', nome: 'Ana Oliveira', cargo: 'Suporte', email: 'ana@etztech.com', role: 'suporte', status: 'ativo' },
  { id: 'm3', nome: 'Carlos Pereira', cargo: 'Comercial', email: 'carlos@etztech.com', role: 'comercial', status: 'ativo' },
  { id: 'm4', nome: 'Diana Rocha', cargo: 'Engenheira', email: 'diana@etztech.com', role: 'dev', status: 'ativo' },
  { id: 'm5', nome: 'Eduardo Silva', cargo: 'Gerente CS', email: 'eduardo@etztech.com', role: 'suporte', status: 'inativo' },
]

function EquipePanel() {
  const [membros, setMembros] = useState<MembroEquipe[]>(MEMBROS_INIT)
  const [showForm, setShowForm] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [novoMembro, setNovoMembro] = useState<Omit<MembroEquipe, 'id'>>({ nome: '', cargo: '', email: '', role: 'suporte', status: 'ativo' })

  function adicionarMembro() {
    if (!novoMembro.nome.trim()) return
    setMembros(prev => [...prev, { ...novoMembro, id: `m${Date.now()}` }])
    setShowForm(false)
    setNovoMembro({ nome: '', cargo: '', email: '', role: 'suporte', status: 'ativo' })
  }

  function removerMembro(id: string) {
    setMembros(prev => prev.filter(m => m.id !== id))
    setConfirmId(null)
  }

  const roleBadge: Record<MembroEquipe['role'], string> = {
    admin: 'bg-purple-100 text-purple-700',
    suporte: 'bg-blue-100 text-blue-700',
    comercial: 'bg-green-100 text-green-700',
    dev: 'bg-gray-100 text-gray-700',
  }

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Equipe ETZ</h2>
        <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-1.5 text-sm font-medium text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Adicionar membro
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-2 gap-3">
          <div><label className="block text-xs font-medium text-gray-500 mb-1">Nome</label><input value={novoMembro.nome} onChange={e => setNovoMembro(m => ({ ...m, nome: e.target.value }))} className={inputCls} /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1">Cargo</label><input value={novoMembro.cargo} onChange={e => setNovoMembro(m => ({ ...m, cargo: e.target.value }))} className={inputCls} /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1">E-mail</label><input value={novoMembro.email} onChange={e => setNovoMembro(m => ({ ...m, email: e.target.value }))} className={inputCls} /></div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Role</label>
            <select value={novoMembro.role} onChange={e => setNovoMembro(m => ({ ...m, role: e.target.value as MembroEquipe['role'] }))} className={inputCls}>
              <option value="admin">Admin</option>
              <option value="suporte">Suporte</option>
              <option value="comercial">Comercial</option>
              <option value="dev">Dev</option>
            </select>
          </div>
          <div className="col-span-2 flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100">Cancelar</button>
            <button onClick={adicionarMembro} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700">Adicionar</button>
          </div>
        </div>
      )}

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {['Nome', 'Cargo', 'E-mail', 'Role', 'Status', ''].map(h => (
              <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {membros.map(m => (
            <tr key={m.id} className="hover:bg-gray-50/50">
              <td className="py-3 font-medium text-gray-900">{m.nome}</td>
              <td className="py-3 text-gray-600">{m.cargo}</td>
              <td className="py-3 text-gray-500 text-xs">{m.email}</td>
              <td className="py-3"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleBadge[m.role]}`}>{m.role}</span></td>
              <td className="py-3">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${m.status === 'ativo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{m.status}</span>
              </td>
              <td className="py-3">
                {confirmId === m.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-600">Confirmar?</span>
                    <button onClick={() => removerMembro(m.id)} className="text-xs font-medium text-white bg-red-600 px-2 py-0.5 rounded">Sim</button>
                    <button onClick={() => setConfirmId(null)} className="text-xs text-gray-500">Não</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmId(m.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminConfigPage() {
  const [active, setActive] = useState<Section>('plataforma')

  const panels: Record<Section, React.ReactNode> = {
    plataforma: <PlataformaPanel />,
    planos: <PlanosPanel />,
    limites: <LimitesPanel />,
    integracoes: <IntegracoesPanel />,
    empresa: <EmpresaPanel />,
    seguranca: <SegurancaPanel />,
    notificacoes: <NotifPanel />,
    equipe: <EquipePanel />,
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Configuração da Plataforma</h1>
        <p className="text-sm text-gray-500 mt-0.5">Ajustes globais da plataforma ETZ</p>
      </div>

      <div className="flex gap-6">
        {/* Left nav */}
        <nav className="w-52 shrink-0 space-y-1">
          {NAV.map(item => (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active === item.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right panel */}
        <div className="flex-1 bg-white border border-gray-200 rounded-2xl p-6 min-h-96">
          {panels[active]}
        </div>
      </div>
    </div>
  )
}
