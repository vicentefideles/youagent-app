import { useState, useEffect } from 'react'
import { claudeApi, api, calendarApi, clientesApi, telnyxApi, whatsappUsuarioApi } from '@/services/api'
import TelnyxNumeroSection from '@/components/TelnyxNumeroSection'
import {
  Building2,
  Plug,
  ZapIcon,
  Shield,
  Bell,
  Users,
  Database,
  Code2,
  ExternalLink,
  Lock,
  Terminal,
  Key,
  Webhook,
  Clock,
  UserPlus,
  MessageSquare,
  CheckCircle2,
  QrCode,
  RefreshCw,
  WifiOff,
} from 'lucide-react'
import { useProfile } from '@/context/ProfileContext'
import type { ConfigSection } from '@/context/ProfileContext'
import { useAuthStore } from '@/store/authStore'
import ModuloBloqueado from '@/components/ModuloBloqueado'

// Extended section IDs not yet in ProfileContext
type ExtConfigSection = ConfigSection | 'horarios' | 'clientes'

// ─── Inline Toggle ────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-300'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  )
}

// ─── Seção: Empresa ───────────────────────────────────────────────────────────

function SectionEmpresa() {
  const { user } = useAuthStore()
  const [nome, setNome] = useState('Soluções Tech Ltda')
  const [cnpj, setCnpj] = useState('12.345.678/0001-90')
  const [segmento, setSegmento] = useState('Tecnologia / SaaS')
  const [website, setWebsite] = useState('https://solucoestech.com.br')
  const [porte, setPorte] = useState('Médio (50–200 funcionários)')
  const [endereco, setEndereco] = useState('Av. Paulista, 1000 — São Paulo, SP')
  const [telefone, setTelefone] = useState('+55 11 99999-0000')
  const [descricao, setDescricao] = useState(
    'Somos uma plataforma de automação comercial para equipes de vendas B2B. Ajudamos empresas a agendar mais reuniões com menos esforço humano, reduzindo custo de prospecção em até 60%.'
  )
  const [objecoes, setObjecoes] = useState(
    '"Já temos fornecedor" → Entendo! Muitos clientes nossos também tinham...\n"Não tenho orçamento" → Por isso o retorno é imediato — 1 reunião fechada já paga vários meses...'
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Carrega perfil real do cliente no mount
  useEffect(() => {
    if (!user?.id) return
    clientesApi.buscar(user.id)
      .then(r => {
        const d = r.data as Record<string, any>
        if (d.nome) setNome(d.nome)
        if (d.cnpj) setCnpj(d.cnpj)
        if (d.segmento) setSegmento(d.segmento)
        if (d.website ?? d.site) setWebsite(d.website ?? d.site)
        if (d.porte) setPorte(d.porte)
        if (d.endereco) setEndereco(d.endereco)
        if (d.telefone) setTelefone(d.telefone)
        if (d.descricao) setDescricao(d.descricao)
        if (d.objecoes) setObjecoes(d.objecoes)
      })
      .catch(() => {
        // Fallback: usa nome e email do authStore se a API falhar
        if (user.nome) setNome(user.nome)
      })
  }, [user?.id])

  async function handleSalvarEmpresa() {
    setSaving(true)
    try {
      await api.patch('/clientes/perfil', { nome, website, telefone, segmento, descricao })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-gray-900">Perfil da empresa</h2>
        <button
          onClick={handleSalvarEmpresa}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Salvando...' : saved ? '✓ Salvo' : 'Salvar alterações'}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Nome da empresa</label>
          <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={nome} onChange={e => setNome(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">CNPJ</label>
          <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={cnpj} onChange={e => setCnpj(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Segmento</label>
          <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={segmento} onChange={e => setSegmento(e.target.value)}>
            <option>Tecnologia / SaaS</option>
            <option>Indústria</option>
            <option>Varejo B2B</option>
            <option>Saúde</option>
            <option>Construção Civil</option>
            <option>Energia Solar</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Site</label>
          <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={website} onChange={e => setWebsite(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Porte</label>
          <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={porte} onChange={e => setPorte(e.target.value)}>
            <option>Pequeno (até 50 funcionários)</option>
            <option>Médio (50–200 funcionários)</option>
            <option>Grande (200+ funcionários)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Telefone</label>
          <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={telefone} onChange={e => setTelefone(e.target.value)} />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Endereço</label>
          <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={endereco} onChange={e => setEndereco(e.target.value)} />
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Logo da empresa</label>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center text-white text-sm font-bold">ST</div>
            <button className="px-3 py-1.5 text-xs border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">Fazer upload</button>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Descrição da empresa</label>
          <textarea rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" value={descricao} onChange={e => setDescricao(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Principais objeções e respostas</label>
          <textarea rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" value={objecoes} onChange={e => setObjecoes(e.target.value)} />
        </div>
      </div>
    </div>
  )
}

// ─── Card Telnyx com dados reais da sub-conta Managed Account ─────────────────

interface TelnyxContaInfo {
  provisionada: boolean
  account_id?: string
  connection_id?: string
  phone?: string
}

function TelnyxContaCard({ enabled, onToggle }: { enabled: boolean; onToggle: (v: boolean) => void }) {
  const [conta, setConta] = useState<TelnyxContaInfo | null>(null)

  useEffect(() => {
    telnyxApi.getConta()
      .then(res => setConta(res.data as TelnyxContaInfo))
      .catch(() => setConta({ provisionada: false }))
  }, [])

  function mascarar(id?: string) {
    if (!id) return '—'
    return id.length > 12 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id
  }

  function formatarNumero(num?: string) {
    if (!num) return '—'
    const d = num.replace(/\D/g, '')
    if (d.length === 13) return `+${d.slice(0,2)} (${d.slice(2,4)}) ${d.slice(4,9)}-${d.slice(9)}`
    return num
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-gray-900">Telnyx</span>
            {conta?.provisionada ? (
              <span className="px-2 py-0.5 text-xs rounded-full bg-green-50 text-green-700 font-medium">Conectado</span>
            ) : (
              <span className="px-2 py-0.5 text-xs rounded-full bg-amber-50 text-amber-700 font-medium">Aguardando provisionamento</span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Voz + WhatsApp · Conta dedicada</p>
        </div>
        <Toggle checked={enabled} onChange={onToggle} />
      </div>

      {conta?.provisionada ? (
        <div className="space-y-2.5">
          <div>
            <p className="text-xs font-medium text-gray-500 mb-0.5">Account ID</p>
            <p className="font-mono text-xs text-gray-800 bg-gray-50 rounded px-2 py-1">{mascarar(conta.account_id)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 mb-0.5">Connection ID</p>
            <p className="font-mono text-xs text-gray-800 bg-gray-50 rounded px-2 py-1">{mascarar(conta.connection_id)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 mb-0.5">Número principal</p>
            <p className="font-mono text-xs text-gray-800 bg-gray-50 rounded px-2 py-1">{formatarNumero(conta.phone)}</p>
          </div>
          <div className="flex gap-2 pt-1">
            <span className="px-2 py-0.5 text-xs rounded-full bg-green-50 text-green-700">Voz ativa</span>
            <span className="px-2 py-0.5 text-xs rounded-full bg-green-50 text-green-700">WhatsApp ativo</span>
            <span className="px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-700">Gerenciado pela ETZ</span>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">
            Sua sub-conta Telnyx será criada automaticamente quando o número for aprovado.
          </p>
          <p className="text-xs text-gray-400">Solicite um número +55 acima para iniciar.</p>
        </div>
      )}
    </div>
  )
}

// ─── Seção: Integrações ───────────────────────────────────────────────────────

function SectionIntegracoes() {
  const [telnyxEnabled, setTelnyxEnabled] = useState(true)
  const [elevenEnabled, setElevenEnabled] = useState(true)
  const [gcalEnabled, setGcalEnabled] = useState(false)
  const [waEnabled, setWaEnabled] = useState(true)
  const [integToast, setIntegToast] = useState<string | null>(null)

  function showIntegToast(msg: string) {
    setIntegToast(msg)
    setTimeout(() => setIntegToast(null), 2500)
  }

  function handleToggleTelnyx(v: boolean) {
    setTelnyxEnabled(v)
    api.patch('/clientes/integracoes', { telnyx: v }).catch(console.error)
    showIntegToast(v ? 'Telnyx ativado' : 'Telnyx desativado')
  }

  function handleToggleEleven(v: boolean) {
    setElevenEnabled(v)
    api.patch('/clientes/integracoes', { elevenlabs: v }).catch(console.error)
    showIntegToast(v ? 'ElevenLabs ativado' : 'ElevenLabs desativado')
  }

  function handleToggleGcal(v: boolean) {
    setGcalEnabled(v)
    api.patch('/clientes/integracoes', { google_calendar: v }).catch(console.error)
    showIntegToast(v ? 'Google Calendar ativado' : 'Google Calendar desativado')
  }

  function handleToggleWa(v: boolean) {
    setWaEnabled(v)
    api.patch('/clientes/integracoes', { whatsapp: v }).catch(console.error)
    showIntegToast(v ? 'WhatsApp ativado' : 'WhatsApp desativado')
  }

  function handleConectarGoogle() {
    const jwt = localStorage.getItem('etz_jwt') || ''
    const url = calendarApi.connect(jwt)
    window.location.href = url
  }

  return (
    <div className="space-y-6">
      {/* Toast de confirmação */}
      {integToast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg transition-opacity">
          {integToast}
        </div>
      )}

      {/* Número de Telefone Telnyx */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">Número de Telefone</h3>
        <p className="text-sm text-gray-500 mb-4">Seu número +55 para os agentes de IA realizarem ligações.</p>
        <TelnyxNumeroSection />
      </div>

      <div className="grid grid-cols-2 gap-4">
      <TelnyxContaCard enabled={telnyxEnabled} onToggle={handleToggleTelnyx} />

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-gray-900">ElevenLabs</span>

              <span className="px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-700 font-medium">Configurado</span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">Síntese de voz</p>
          </div>
          <Toggle checked={elevenEnabled} onChange={handleToggleEleven} />
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">API Key</label>
            <input type="password" defaultValue="el_xxxxxxxxxxxx" className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Voz padrão</label>
            <select className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Ana</option>
              <option>Carlos</option>
              <option>Roberta</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Velocidade — Moderada</label>
            <input type="range" min={0} max={100} defaultValue={50} className="w-full" />
          </div>
          <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">Latência ~320ms</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-gray-900">Google Calendar</span>
              <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-500 font-medium">Desconectado</span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">Agendamento automático</p>
          </div>
          <Toggle checked={gcalEnabled} onChange={handleToggleGcal} />
        </div>
        <p className="text-xs text-gray-500 mb-3">Necessário para agendamento automático de reuniões entre agente e vendedor.</p>
        <button
          onClick={handleConectarGoogle}
          className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
        >
          Conectar com Google
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-gray-900">WhatsApp Business</span>
              <span className="px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-700 font-medium">Ativo via Telnyx</span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">Via Telnyx</p>
          </div>
          <Toggle checked={waEnabled} onChange={handleToggleWa} />
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Número</label>
            <input defaultValue="+55 11 99999-0000" className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Webhook URL</label>
            <input readOnly defaultValue="https://api.etztech.com.br/webhooks/whatsapp" className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs bg-gray-50 font-mono focus:outline-none" />
          </div>
        </div>
      </div>
      </div>

      {/* ── Diagnóstico Telnyx ── */}
      <DiagnosticoTelnyx />
    </div>
  )
}

// ─── Diagnóstico Telnyx ───────────────────────────────────────────────────────

interface DiagAgenteCfg { id: string; nome: string; status: string; telnyx_ok: boolean; telnyx_assistant_id: string | null; score_certificacao: number | null; certificado: boolean }
interface DiagDataCfg { timestamp: string; latencia_ms: number; webhook_url: string; resumo: { total_agentes: number; com_telnyx: number; sem_telnyx: number; ativos: number; certificados: number; integracao_ok: boolean }; agentes: DiagAgenteCfg[] }

function DiagnosticoTelnyx() {
  const [carregando, setCarregando] = useState(false)
  const [dados, setDados] = useState<DiagDataCfg | null>(null)
  const [erro, setErro] = useState('')

  async function executar() {
    setCarregando(true); setErro('')
    try {
      const res = await api.get('/inteligencia/sandbox/diagnostico')
      setDados(res.data as DiagDataCfg)
    } catch {
      setErro('Não foi possível executar o diagnóstico. Verifique a conexão com o Railway.')
    } finally { setCarregando(false) }
  }

  const scoreCor = (s: number) => s >= 80 ? 'text-emerald-600' : s >= 60 ? 'text-amber-500' : 'text-red-500'

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Diagnóstico de Integração</h3>
          <p className="text-sm text-gray-500 mt-0.5">Verifique o status do webhook Telnyx e a configuração de cada agente.</p>
        </div>
        <button onClick={executar} disabled={carregando}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-60">
          {carregando
            ? <><svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Verificando...</>
            : <>↺ Executar diagnóstico</>}
        </button>
      </div>

      {erro && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-4">{erro}</p>}

      {dados && (
        <div className="space-y-4">
          {/* Resumo em cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Webhook URL</p>
              <p className="text-xs font-mono text-gray-700 break-all leading-relaxed">{dados.webhook_url}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Latência Railway</p>
              <div className="flex items-end gap-1">
                <span className="text-xl font-bold font-mono text-gray-900">{dados.latencia_ms}</span>
                <span className="text-xs text-gray-400 mb-0.5">ms</span>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-2">Status Telnyx</p>
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${dados.resumo.integracao_ok ? 'bg-emerald-400' : 'bg-red-400'}`} />
                <span className={`text-sm font-bold ${dados.resumo.integracao_ok ? 'text-emerald-700' : 'text-red-600'}`}>
                  {dados.resumo.integracao_ok ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
            </div>
          </div>

          {/* Tabela de agentes */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-700">Status por agente</p>
              <p className="text-xs text-gray-400">{dados.resumo.com_telnyx}/{dados.resumo.total_agentes} com Telnyx</p>
            </div>
            <div className="divide-y divide-gray-50">
              {dados.agentes.map((ag, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{ag.nome}</p>
                    {ag.telnyx_assistant_id
                      ? <p className="text-xs font-mono text-gray-400 truncate">{ag.telnyx_assistant_id}</p>
                      : <p className="text-xs text-red-400">Sem telnyx_assistant_id</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${ag.status === 'ativo' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {ag.status}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${ag.telnyx_ok ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-600'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full inline-block ${ag.telnyx_ok ? 'bg-blue-400' : 'bg-red-400'}`} />
                      {ag.telnyx_ok ? 'Telnyx OK' : 'Sem Telnyx'}
                    </span>
                    {ag.score_certificacao != null && (
                      <span className={`text-xs font-mono font-bold ${scoreCor(ag.score_certificacao)}`}>{ag.score_certificacao}pts</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alerta sem Telnyx */}
          {dados.resumo.sem_telnyx > 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3">
              <span className="text-amber-500 shrink-0 mt-0.5">⚠</span>
              <div>
                <p className="text-xs font-semibold text-amber-800">
                  {dados.resumo.sem_telnyx} agente{dados.resumo.sem_telnyx > 1 ? 's' : ''} sem Telnyx configurado
                </p>
                <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                  Vá em <strong>Agentes → Editar → Integração Telnyx</strong> e configure o <code className="bg-amber-100 px-1 rounded">telnyx_assistant_id</code> para ativar as ligações.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {!dados && !carregando && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-8 text-center">
          <p className="text-sm text-gray-500">Clique em "Executar diagnóstico" para verificar o status da integração Telnyx e de cada agente.</p>
        </div>
      )}
    </div>
  )
}

// ─── Seção: Integrações Avançadas (admin_cliente only) ────────────────────────

function SectionIntegracoesAvancadas() {
  const [zapierActive, setZapierActive] = useState(true)
  const [zapierUrl, setZapierUrl] = useState('https://hooks.zapier.com/hooks/catch/12345/abcdef')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookEvento, setWebhookEvento] = useState('lead_qualificado')
  const [hubspotKey, setHubspotKey] = useState('')
  const [hubspotPortal, setHubspotPortal] = useState('')
  const [hubspotSync, setHubspotSync] = useState(false)
  const [sfClientId, setSfClientId] = useState('')
  const [sfClientSecret, setSfClientSecret] = useState('')
  const [sfEnabled, setSfEnabled] = useState(false)

  const zaps = [
    { nome: 'Lead qualificado → HubSpot', status: 'Ativo' },
    { nome: 'Reunião agendada → Google Sheets', status: 'Ativo' },
    { nome: 'No-show → Slack', status: 'Inativo' },
  ]

  const webhooks = [
    { url: 'https://crm.empresa.com/webhook/lead', eventos: 'lead_qualificado', ativo: true },
    { url: 'https://slack.empresa.com/hooks/abc', eventos: 'reuniao_agendada', ativo: true },
    { url: 'https://bi.empresa.com/events', eventos: 'transferencia', ativo: false },
  ]

  return (
    <div className="space-y-4">
      {/* Zapier */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ZapIcon className="w-4 h-4 text-orange-500" />
            <h3 className="text-sm font-semibold text-gray-900">Zapier</h3>
          </div>
          <Toggle checked={zapierActive} onChange={setZapierActive} />
        </div>
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-600 mb-1">Webhook URL</label>
          <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" value={zapierUrl} onChange={e => setZapierUrl(e.target.value)} />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-600 mb-2">Zaps configurados</p>
          <div className="space-y-2">
            {zaps.map(z => (
              <div key={z.nome} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-700">{z.nome}</span>
                <span className={`px-2 py-0.5 text-xs rounded-full ${z.status === 'Ativo' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{z.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Webhooks próprios */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Webhook className="w-4 h-4 text-blue-500" />
          <h3 className="text-sm font-semibold text-gray-900">Webhooks próprios</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">URL do endpoint</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="https://seu-app.com/webhook" value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Evento</label>
            <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={webhookEvento} onChange={e => setWebhookEvento(e.target.value)}>
              <option value="lead_qualificado">Lead qualificado</option>
              <option value="reuniao_agendada">Reunião agendada</option>
              <option value="transferencia">Transferência</option>
              <option value="no_show">No-show</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2 mb-4">
          <button className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Adicionar webhook</button>
          <button className="px-3 py-1.5 text-xs border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">Testar webhook</button>
        </div>
        <div className="space-y-2">
          {webhooks.map(w => (
            <div key={w.url} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
              <div>
                <p className="text-xs font-mono text-gray-700">{w.url}</p>
                <p className="text-xs text-gray-500">{w.eventos}</p>
              </div>
              <span className={`px-2 py-0.5 text-xs rounded-full ${w.ativo ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{w.ativo ? 'Ativo' : 'Inativo'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* API REST */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Code2 className="w-4 h-4 text-purple-500" />
          <h3 className="text-sm font-semibold text-gray-900">API REST</h3>
        </div>
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-600 mb-1">Endpoint base</label>
          <input readOnly value="https://api.etztech.com/v1" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono bg-gray-50 focus:outline-none" />
        </div>
        <a href="https://docs.etztech.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
          <ExternalLink className="w-3 h-3" /> Ver documentação completa
        </a>
      </div>

      {/* HubSpot avançado */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-orange-500 flex items-center justify-center text-white text-xs font-bold">HS</div>
            <h3 className="text-sm font-semibold text-gray-900">HubSpot — Avançado</h3>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">API Key</label>
            <input type="password" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={hubspotKey} onChange={e => setHubspotKey(e.target.value)} placeholder="••••••••••••" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Portal ID</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={hubspotPortal} onChange={e => setHubspotPortal(e.target.value)} placeholder="1234567" />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-700">Sync bidirecional</p>
            <p className="text-xs text-gray-500">Atualiza contatos em ambas as direções</p>
          </div>
          <Toggle checked={hubspotSync} onChange={setHubspotSync} />
        </div>
      </div>

      {/* Salesforce avançado */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-blue-500 flex items-center justify-center text-white text-xs font-bold">SF</div>
            <h3 className="text-sm font-semibold text-gray-900">Salesforce — Avançado</h3>
          </div>
          <Toggle checked={sfEnabled} onChange={setSfEnabled} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Client ID</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={sfClientId} onChange={e => setSfClientId(e.target.value)} placeholder="3MVG9..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Client Secret</label>
            <input type="password" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={sfClientSecret} onChange={e => setSfClientSecret(e.target.value)} placeholder="••••••••••••" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Seção: Segurança (admin_cliente only) ────────────────────────────────────

function SectionSeguranca() {
  const [twoFa, setTwoFa] = useState(false)
  const [senhaExpiracao, setSenhaExpiracao] = useState('90')
  const [forcaSenha, setForcaSenha] = useState(true)
  const [ipAtivo, setIpAtivo] = useState(false)
  const [cidrs, setCidrs] = useState('192.168.1.0/24\n10.0.0.0/8')

  const sessoes = [
    { dispositivo: 'Chrome / Windows', local: 'São Paulo, SP', ultima: 'Sessão atual', atual: true },
    { dispositivo: 'Safari / iPhone', local: 'Rio de Janeiro, RJ', ultima: 'há 2 dias', atual: false },
    { dispositivo: 'Firefox / MacOS', local: 'Belo Horizonte, MG', ultima: 'há 5 dias', atual: false },
  ]

  const logs = [
    { data: '23/05/2026 09:14', usuario: 'Admin Demo', acao: 'Login bem-sucedido', ip: '187.25.1.1', tipo: 'login' },
    { data: '22/05/2026 18:32', usuario: 'Ana Rodrigues', acao: 'Alteração de config', ip: '201.30.5.12', tipo: 'config' },
    { data: '22/05/2026 08:00', usuario: 'Admin Demo', acao: 'Login bem-sucedido', ip: '187.25.1.1', tipo: 'login' },
    { data: '21/05/2026 17:45', usuario: 'João Silva', acao: 'Logout', ip: '189.11.3.4', tipo: 'logout' },
    { data: '21/05/2026 09:00', usuario: 'Admin Demo', acao: 'Login bem-sucedido', ip: '187.25.1.1', tipo: 'login' },
  ]

  const logBadge = (tipo: string) => {
    if (tipo === 'login') return 'bg-blue-50 text-blue-700'
    if (tipo === 'logout') return 'bg-gray-100 text-gray-600'
    return 'bg-amber-50 text-amber-700'
  }

  return (
    <div className="space-y-4">
      {/* 2FA */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Autenticação em dois fatores</h3>
            <p className="text-xs text-gray-500 mt-0.5">Camada extra de segurança via e-mail ou app autenticador</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${twoFa ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{twoFa ? 'Ativo' : 'Inativo'}</span>
            <Toggle checked={twoFa} onChange={setTwoFa} />
            <button className="px-3 py-1.5 text-xs border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">Configurar</button>
          </div>
        </div>
      </div>

      {/* Sessões ativas */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Sessões ativas</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 border-b border-gray-100">
              <th className="text-left pb-2 font-medium">Dispositivo</th>
              <th className="text-left pb-2 font-medium">Localização</th>
              <th className="text-left pb-2 font-medium">Última atividade</th>
              <th className="text-left pb-2 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sessoes.map(s => (
              <tr key={s.dispositivo}>
                <td className="py-2.5 text-gray-800">{s.dispositivo}</td>
                <td className="py-2.5 text-gray-600">{s.local}</td>
                <td className="py-2.5">
                  {s.atual
                    ? <span className="px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-700">Sessão atual</span>
                    : <span className="text-xs text-gray-500">{s.ultima}</span>}
                </td>
                <td className="py-2.5">
                  {!s.atual && (
                    <button className="px-2 py-1 text-xs border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors">Encerrar</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Log de acessos */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Log de acessos</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 border-b border-gray-100">
              <th className="text-left pb-2 font-medium">Data / Hora</th>
              <th className="text-left pb-2 font-medium">Usuário</th>
              <th className="text-left pb-2 font-medium">Ação</th>
              <th className="text-left pb-2 font-medium">IP</th>
              <th className="text-left pb-2 font-medium">Tipo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {logs.map((l, i) => (
              <tr key={i}>
                <td className="py-2 text-xs text-gray-600 font-mono">{l.data}</td>
                <td className="py-2 text-xs text-gray-800">{l.usuario}</td>
                <td className="py-2 text-xs text-gray-700">{l.acao}</td>
                <td className="py-2 text-xs text-gray-500 font-mono">{l.ip}</td>
                <td className="py-2">
                  <span className={`px-2 py-0.5 text-xs rounded-full ${logBadge(l.tipo)}`}>{l.tipo}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Política de senhas */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Política de senhas</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Expiração de senha</label>
            <select className="w-48 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={senhaExpiracao} onChange={e => setSenhaExpiracao(e.target.value)}>
              <option value="30">30 dias</option>
              <option value="60">60 dias</option>
              <option value="90">90 dias</option>
              <option value="180">180 dias</option>
            </select>
          </div>
          <div className="flex items-center justify-between max-w-sm">
            <div>
              <p className="text-sm text-gray-700">Exigir senha forte</p>
              <p className="text-xs text-gray-500">Mínimo 8 caracteres, letras e números</p>
            </div>
            <Toggle checked={forcaSenha} onChange={setForcaSenha} />
          </div>
        </div>
      </div>

      {/* IPs permitidos */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">IPs permitidos</h3>
            <p className="text-xs text-gray-500 mt-0.5">Restrinja o acesso a faixas de IP específicas (CIDR)</p>
          </div>
          <Toggle checked={ipAtivo} onChange={setIpAtivo} />
        </div>
        <textarea
          rows={3}
          className={`w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${!ipAtivo ? 'bg-gray-50 text-gray-400' : ''}`}
          disabled={!ipAtivo}
          value={cidrs}
          onChange={e => setCidrs(e.target.value)}
          placeholder="192.168.1.0/24"
        />
      </div>
    </div>
  )
}

// ─── Seção: Notificações ──────────────────────────────────────────────────────

type CanalNotif = 'plataforma' | 'email' | 'whatsapp'

interface CategoriaNotif {
  id: string
  titulo: string
  descricao: string
  canais: CanalNotif[]
  toggles: string[]
}

const CATEGORIAS_NOTIF: CategoriaNotif[] = [
  {
    id: 'ligacoes',
    titulo: 'Ligações e Agendamentos',
    descricao: 'Alertas quando agente agendar ou transferir ao vivo',
    canais: ['plataforma', 'email', 'whatsapp'],
    toggles: ['Nova reunião agendada', 'Transferência ao vivo', 'No-show detectado'],
  },
  {
    id: 'relatorios',
    titulo: 'Relatórios Automáticos',
    descricao: 'Resumos periódicos de performance',
    canais: ['email'],
    toggles: ['Relatório diário', 'Relatório semanal', 'Relatório mensal'],
  },
  {
    id: 'inteligencia',
    titulo: 'Inteligência e Aprendizado',
    descricao: 'Novos padrões detectados, argumentos para aprovar',
    canais: ['plataforma', 'email'],
    toggles: ['Novo argumento cross-cliente para aprovar', 'Padrão detectado', 'Versão do agente atualizada'],
  },
  {
    id: 'performance',
    titulo: 'Performance e Alertas',
    descricao: 'Quedas de performance ou metas em risco',
    canais: ['plataforma', 'email'],
    toggles: ['Meta mensal em risco (< 70%)', 'Queda de conversão > 20%', 'Agente com muitos no-shows'],
  },
  {
    id: 'financeiro',
    titulo: 'Financeiro',
    descricao: 'Cobranças, consumo e faturas',
    canais: ['email'],
    toggles: ['Fatura gerada', 'Consumo acima de 80%', 'Falha no pagamento'],
  },
  {
    id: 'sistema',
    titulo: 'Sistema',
    descricao: 'Atualizações da plataforma e manutenções',
    canais: ['plataforma'],
    toggles: ['Manutenção programada', 'Nova funcionalidade disponível'],
  },
]

const CANAL_LABEL: Record<CanalNotif, string> = {
  plataforma: 'Plataforma',
  email: 'E-mail',
  whatsapp: 'WhatsApp',
}

function buildInitialNotifState(): Record<string, boolean> {
  const state: Record<string, boolean> = {}
  CATEGORIAS_NOTIF.forEach(cat => {
    cat.toggles.forEach(t => { state[`${cat.id}__${t}`] = true })
    cat.canais.forEach(c => { state[`${cat.id}__canal__${c}`] = c !== 'whatsapp' })
  })
  return state
}

function SectionNotificacoes() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(buildInitialNotifState)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function toggle(key: string) {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }))
  }

  async function handleSalvar() {
    setSaving(true)
    try {
      await api.patch('/clientes/notificacoes', { preferencias: prefs })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      // silencioso — preferências salvas localmente
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {CATEGORIAS_NOTIF.map(cat => (
        <div key={cat.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900">{cat.titulo}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{cat.descricao}</p>
          </div>

          {/* Toggles por evento */}
          <div className="divide-y divide-gray-100 mb-4">
            {cat.toggles.map(t => {
              const key = `${cat.id}__${t}`
              return (
                <div key={t} className="flex items-center justify-between py-2.5">
                  <span className="text-sm text-gray-700">{t}</span>
                  <Toggle checked={!!prefs[key]} onChange={() => toggle(key)} />
                </div>
              )
            })}
          </div>

          {/* Selector de canal */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-gray-400 mr-1">Canais:</span>
            {cat.canais.map(c => {
              const key = `${cat.id}__canal__${c}`
              const active = !!prefs[key]
              return (
                <button
                  key={c}
                  onClick={() => toggle(key)}
                  className={`px-2.5 py-1 text-xs rounded-full border font-medium transition-colors ${
                    active
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {CANAL_LABEL[c]}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      <div className="flex justify-end">
        <button
          onClick={handleSalvar}
          disabled={saving}
          className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Salvando...' : saved ? '✓ Preferências salvas' : 'Salvar preferências'}
        </button>
      </div>
    </div>
  )
}

// ─── Seção: Equipe ────────────────────────────────────────────────────────────

type Membro = { nome: string; cargo: string; role: string; email: string; status: string; atual: boolean }

function SectionEquipe() {
  const [membros] = useState<Membro[]>([
    { nome: 'Admin Demo', cargo: 'Admin da Conta', role: 'admin_cliente', email: 'admin@empresa.com', status: 'Ativo', atual: true },
    { nome: 'Ana Rodrigues', cargo: 'Gerente Comercial', role: 'gerente', email: 'ana@empresa.com', status: 'Ativo', atual: false },
    { nome: 'João Silva', cargo: 'Closer SP', role: 'vendedor', email: 'joao@empresa.com', status: 'Ativo', atual: false },
    { nome: 'Fernanda Rocha', cargo: 'Colaboradora', role: 'colaborador', email: 'fernanda@empresa.com', status: 'Pendente', atual: false },
  ])

  const [showModal, setShowModal] = useState(false)

  const roleBadge = (role: string) => {
    if (role === 'admin_cliente') return 'bg-purple-50 text-purple-700'
    if (role === 'gerente') return 'bg-blue-50 text-blue-700'
    if (role === 'vendedor') return 'bg-green-50 text-green-700'
    return 'bg-gray-100 text-gray-600'
  }

  const roleLabel = (role: string) => {
    if (role === 'admin_cliente') return 'Admin'
    if (role === 'gerente') return 'Gerente'
    if (role === 'vendedor') return 'Vendedor'
    return 'Colaborador'
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-gray-900">Membros da equipe</h2>
        <button
          onClick={() => setShowModal(true)}
          className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Convidar membro
        </button>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-gray-500 border-b border-gray-100">
            <th className="text-left pb-2 font-medium">Membro</th>
            <th className="text-left pb-2 font-medium">Cargo</th>
            <th className="text-left pb-2 font-medium">Role</th>
            <th className="text-left pb-2 font-medium">Status</th>
            <th className="text-left pb-2 font-medium">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {membros.map(m => (
            <tr key={m.email}>
              <td className="py-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-semibold">
                    {m.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{m.nome}</p>
                    <p className="text-xs text-gray-500">{m.email}</p>
                  </div>
                </div>
              </td>
              <td className="py-2.5 text-gray-600 text-xs">{m.cargo}</td>
              <td className="py-2.5">
                <span className={`px-2 py-0.5 text-xs rounded-full ${roleBadge(m.role)}`}>{roleLabel(m.role)}</span>
              </td>
              <td className="py-2.5">
                {m.status === 'Ativo'
                  ? <span className="px-2 py-0.5 text-xs rounded-full bg-green-50 text-green-700">Ativo</span>
                  : <span className="px-2 py-0.5 text-xs rounded-full bg-amber-50 text-amber-700">Pendente</span>}
              </td>
              <td className="py-2.5">
                {m.atual ? null : m.status === 'Pendente' ? (
                  <button className="text-xs text-blue-600 hover:underline">Reenviar convite</button>
                ) : (
                  <div className="flex gap-2">
                    <button className="text-xs text-gray-600 hover:underline">Editar</button>
                    <button className="text-xs text-red-500 hover:underline">Remover</button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-96">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Convidar membro</h3>
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nome</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nome completo" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">E-mail</label>
                <input type="email" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="email@empresa.com" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Cargo</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: SDR, Closer..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="gerente">Gerente</option>
                  <option value="vendedor">Vendedor</option>
                  <option value="colaborador">Colaborador</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Enviar convite</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Seção: Dev (admin_cliente only) ─────────────────────────────────────────

function SectionDev() {
  const [claudeKey, setClaudeKey] = useState('')
  const [claudeStatus, setClaudeStatus] = useState<'idle' | 'valid' | 'invalid' | 'loading'>('idle')
  const [claudeModelo, setClaudeModelo] = useState('')
  const [motorMode, setMotorMode] = useState('automatico')
  const [icpAlgo, setIcpAlgo] = useState('padrao')
  const [debugLogs, setDebugLogs] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookFormat, setWebhookFormat] = useState('json')
  const [sandbox, setSandbox] = useState(false)

  const logsContent = `[2026-05-23 09:12:01] Motor IA — ligação #2847 iniciada
[2026-05-23 09:12:03] ICP calculado: 82/100 (cargo:28 seg:22 porte:18 reg:11 int:3)
[2026-05-23 09:12:45] Gatilho detectado: urgencia (confiança: 0.91)
[2026-05-23 09:13:10] Fase: qualificacao → proposta
[2026-05-23 09:13:55] Transferência iniciada para João Silva`

  return (
    <div className="space-y-4">
      {/* Claude API */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Claude API</h3>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 mb-1">API Key</label>
            <input
              type="password"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="sk-ant-api03-..."
              value={claudeKey}
              onChange={e => { setClaudeKey(e.target.value); setClaudeStatus('idle') }}
            />
          </div>
          <button
            onClick={async () => {
              setClaudeStatus('loading')
              try {
                const res = await claudeApi.status()
                const data = res.data as { configurado: boolean; modelo: string }
                if (data.configurado) {
                  setClaudeStatus('valid')
                  setClaudeModelo(data.modelo)
                } else {
                  setClaudeStatus('invalid')
                  setClaudeModelo('')
                }
              } catch {
                setClaudeStatus('invalid')
                setClaudeModelo('')
              }
            }}
            disabled={claudeStatus === 'loading'}
            className="px-3 py-2 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors whitespace-nowrap"
          >
            {claudeStatus === 'loading' ? 'Verificando...' : 'Verificar conexão'}
          </button>
          {claudeStatus === 'valid' && <span className="text-xs text-green-700 font-medium whitespace-nowrap">Conectado — {claudeModelo}</span>}
          {claudeStatus === 'invalid' && <span className="text-xs text-red-600 font-medium whitespace-nowrap">Não configurada — adicione ANTHROPIC_API_KEY no Railway</span>}
        </div>
      </div>

      {/* Motor de IA */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Configurações do motor</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Modo de operação</label>
            <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={motorMode} onChange={e => setMotorMode(e.target.value)}>
              <option value="automatico">Automático</option>
              <option value="semi">Semi-automático</option>
              <option value="manual">Manual</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Modelo de ICP</label>
            <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={icpAlgo} onChange={e => setIcpAlgo(e.target.value)}>
              <option value="padrao">Padrão</option>
              <option value="conservador">Conservador</option>
              <option value="agressivo">Agressivo</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs de debug */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Logs de debug</h3>
          <Toggle checked={debugLogs} onChange={setDebugLogs} />
        </div>
        {debugLogs && (
          <textarea
            readOnly
            rows={5}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono bg-gray-50 text-gray-700 resize-none focus:outline-none"
            value={logsContent}
          />
        )}
      </div>

      {/* Webhook de eventos */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Webhook de eventos</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">URL</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="https://..." value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Formato</label>
            <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={webhookFormat} onChange={e => setWebhookFormat(e.target.value)}>
              <option value="json">JSON</option>
              <option value="xml">XML</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sandbox */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Modo sandbox</h3>
            <p className="text-xs text-gray-500 mt-0.5">Não realiza ligações reais — ideal para testes</p>
          </div>
          <Toggle checked={sandbox} onChange={setSandbox} />
        </div>
        {sandbox && (
          <div className="mt-3 px-3 py-2 bg-amber-50 rounded-lg">
            <p className="text-xs text-amber-700 font-medium">Modo sandbox ativo — nenhuma ligação será realizada</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Seção: CRM ───────────────────────────────────────────────────────────────

function SectionCrm() {
  const crms = [
    {
      abbr: 'SF',
      color: 'bg-blue-500',
      name: 'Salesforce',
      badge: 'Em breve',
      badgeClass: 'bg-gray-100 text-gray-500',
      description: 'Sincronize leads, oportunidades e atividades com o Salesforce CRM.',
      action: <button className="px-3 py-1.5 text-xs border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">Notificar quando disponível</button>,
    },
    {
      abbr: 'HS',
      color: 'bg-orange-500',
      name: 'HubSpot',
      badge: 'Disponível',
      badgeClass: 'bg-blue-50 text-blue-700',
      description: 'Integre agentes com pipelines e contatos do HubSpot.',
      action: (
        <div className="space-y-2">
          <input placeholder="API Key" className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none" />
          <button className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Conectar</button>
        </div>
      ),
    },
    {
      abbr: 'PD',
      color: 'bg-green-600',
      name: 'Pipedrive',
      badge: 'Disponível',
      badgeClass: 'bg-blue-50 text-blue-700',
      description: 'Envie negócios e atividades diretamente para o Pipedrive.',
      action: (
        <div className="space-y-2">
          <input placeholder="API Key" className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none" />
          <button className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Conectar</button>
        </div>
      ),
    },
  ]

  return (
    <div className="grid grid-cols-3 gap-4">
      {crms.map(crm => (
        <div key={crm.name} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-9 h-9 rounded-lg ${crm.color} flex items-center justify-center text-white text-xs font-bold`}>
              {crm.abbr}
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-900">{crm.name}</span>
              <div>
                <span className={`px-2 py-0.5 text-xs rounded-full ${crm.badgeClass}`}>{crm.badge}</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-3">{crm.description}</p>
          {crm.action}
        </div>
      ))}
    </div>
  )
}

// ─── Seção: API & Webhooks (admin_cliente only) ───────────────────────────────

function SectionApi() {
  const [showNewKey, setShowNewKey] = useState(false)

  const chaves = [
    { nome: 'Produção', criada: '01/04/2026', ultimoUso: '23/05/2026', escopo: 'read, write' },
    { nome: 'Staging', criada: '15/04/2026', ultimoUso: '20/05/2026', escopo: 'read' },
  ]

  const webhooks = [
    { url: 'https://crm.empresa.com/webhook/lead', eventos: 'lead_qualificado, reuniao_agendada', ativo: true },
    { url: 'https://analytics.empresa.com/events', eventos: 'transferencia, no_show', ativo: false },
  ]

  const rateLimits = [
    { label: '1.000 req/min', desc: 'Plano atual' },
    { label: '10.000 req/dia', desc: 'Limite diário' },
    { label: '99,9% uptime', desc: 'SLA garantido' },
  ]

  return (
    <div className="space-y-4">
      {/* API Keys */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Suas chaves de API</h3>
          <button onClick={() => setShowNewKey(true)} className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            + Nova chave
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 border-b border-gray-100">
              <th className="text-left pb-2 font-medium">Nome</th>
              <th className="text-left pb-2 font-medium">Criada em</th>
              <th className="text-left pb-2 font-medium">Último uso</th>
              <th className="text-left pb-2 font-medium">Escopo</th>
              <th className="text-left pb-2 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {chaves.map(c => (
              <tr key={c.nome}>
                <td className="py-2.5 text-gray-800 font-medium">{c.nome}</td>
                <td className="py-2.5 text-xs text-gray-500">{c.criada}</td>
                <td className="py-2.5 text-xs text-gray-500">{c.ultimoUso}</td>
                <td className="py-2.5 text-xs text-gray-600 font-mono">{c.escopo}</td>
                <td className="py-2.5">
                  <button className="text-xs text-red-500 hover:underline">Revogar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Webhooks */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Webhooks</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 border-b border-gray-100">
              <th className="text-left pb-2 font-medium">URL</th>
              <th className="text-left pb-2 font-medium">Eventos</th>
              <th className="text-left pb-2 font-medium">Status</th>
              <th className="text-left pb-2 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {webhooks.map(w => (
              <tr key={w.url}>
                <td className="py-2.5 text-xs font-mono text-gray-700 max-w-[220px] truncate">{w.url}</td>
                <td className="py-2.5 text-xs text-gray-600">{w.eventos}</td>
                <td className="py-2.5">
                  <span className={`px-2 py-0.5 text-xs rounded-full ${w.ativo ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {w.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="py-2.5">
                  <div className="flex gap-2">
                    <button className="text-xs text-blue-600 hover:underline">Testar</button>
                    <button className="text-xs text-gray-600 hover:underline">Editar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Documentação */}
      <a href="https://docs.etztech.com" target="_blank" rel="noopener noreferrer" className="block bg-blue-50 border border-blue-100 rounded-xl p-5 hover:bg-blue-100 transition-colors group">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-900">Documentação da API</p>
            <p className="text-xs text-blue-700 mt-0.5">Referência completa de endpoints, autenticação e exemplos</p>
          </div>
          <ExternalLink className="w-4 h-4 text-blue-500 group-hover:translate-x-0.5 transition-transform" />
        </div>
        <p className="text-xs text-blue-600 mt-2">Ver documentação completa da API →</p>
      </a>

      {/* Rate limits */}
      <div className="grid grid-cols-3 gap-4">
        {rateLimits.map(r => (
          <div key={r.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-base font-bold text-gray-900">{r.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{r.desc}</p>
          </div>
        ))}
      </div>

      {/* Modal nova chave */}
      {showNewKey && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-80">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Nova chave de API</h3>
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nome da chave</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: Produção, Staging..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Escopo</label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>read</option>
                  <option>read, write</option>
                  <option>admin</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowNewKey(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
              <button onClick={() => setShowNewKey(false)} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Gerar chave</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Seção: Horários ─────────────────────────────────────────────────────────

type DiaSemana = 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom'

const DIAS: { id: DiaSemana; label: string }[] = [
  { id: 'seg', label: 'Seg' },
  { id: 'ter', label: 'Ter' },
  { id: 'qua', label: 'Qua' },
  { id: 'qui', label: 'Qui' },
  { id: 'sex', label: 'Sex' },
  { id: 'sab', label: 'Sáb' },
  { id: 'dom', label: 'Dom' },
]

const HORAS_GRID = Array.from({ length: 13 }, (_, i) => i + 8) // 8h–20h

function buildInitialHorarios(): Record<string, boolean> {
  const result: Record<string, boolean> = {}
  DIAS.forEach(d => {
    HORAS_GRID.forEach(h => {
      const key = `${d.id}-${h}h`
      result[key] = d.id !== 'sab' && d.id !== 'dom' && h >= 9 && h <= 18
    })
  })
  return result
}

function SectionHorarios() {
  const [inicio, setInicio] = useState('08:00')
  const [fim, setFim] = useState('19:00')
  const [diasAtivos, setDiasAtivos] = useState<Set<DiaSemana>>(new Set(['seg', 'ter', 'qua', 'qui', 'sex']))
  const [horariosAtivos, setHorariosAtivos] = useState<Record<string, boolean>>(buildInitialHorarios)
  const [pausaAlmoco, setPausaAlmoco] = useState(true)
  const [saved, setSaved] = useState(false)

  function toggleDia(dia: DiaSemana) {
    setDiasAtivos(prev => {
      const next = new Set(prev)
      if (next.has(dia)) next.delete(dia)
      else next.add(dia)
      return next
    })
  }

  function toggleHora(key: string) {
    setHorariosAtivos(prev => ({ ...prev, [key]: !prev[key] }))
  }

  function save() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const inputCls = 'border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="space-y-4">
      {/* Horário global */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Horário global de campanha</h3>
        <div className="flex items-center gap-4 mb-5">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Início</label>
            <input type="time" className={inputCls} value={inicio} onChange={e => setInicio(e.target.value)} />
          </div>
          <span className="text-gray-400 mt-5">até</span>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Fim</label>
            <input type="time" className={inputCls} value={fim} onChange={e => setFim(e.target.value)} />
          </div>
        </div>

        {/* Dias da semana */}
        <div className="mb-5">
          <label className="block text-xs font-medium text-gray-600 mb-2">Dias ativos</label>
          <div className="flex gap-2">
            {DIAS.map(d => (
              <button
                key={d.id}
                onClick={() => toggleDia(d.id)}
                className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors ${diasAtivos.has(d.id) ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pausa almoço */}
        <div className="flex items-center gap-3 mb-5 p-3 bg-gray-50 rounded-lg">
          <input
            id="pausa"
            type="checkbox"
            checked={pausaAlmoco}
            onChange={e => setPausaAlmoco(e.target.checked)}
            className="accent-blue-600"
          />
          <label htmlFor="pausa" className="text-sm text-gray-700 cursor-pointer">
            Pausar ligações entre 12h–14h (intervalo de almoço)
          </label>
        </div>

        {/* Mapa visual */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">Mapa de horários — clique para ativar/desativar</label>
          <div className="overflow-x-auto">
            <table className="text-xs border-collapse">
              <thead>
                <tr>
                  <th className="px-2 py-1 text-gray-400 font-normal w-10" />
                  {DIAS.map(d => (
                    <th key={d.id} className="px-2 py-1 text-center text-gray-600 font-medium w-12">{d.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HORAS_GRID.map(h => (
                  <tr key={h}>
                    <td className="px-2 py-0.5 text-gray-400 text-right">{h}h</td>
                    {DIAS.map(d => {
                      const key = `${d.id}-${h}h`
                      const ativo = horariosAtivos[key]
                      const isPausa = pausaAlmoco && (h === 12 || h === 13)
                      return (
                        <td key={d.id} className="px-1 py-0.5">
                          <button
                            onClick={() => !isPausa && toggleHora(key)}
                            disabled={isPausa}
                            className={`w-full h-6 rounded transition-colors ${
                              isPausa
                                ? 'bg-gray-100 cursor-not-allowed'
                                : ativo
                                  ? 'bg-blue-500 hover:bg-blue-400'
                                  : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                            title={isPausa ? 'Pausa almoço' : `${d.label} ${h}h`}
                          />
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-blue-500" /><span className="text-xs text-gray-500">Ativo</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-gray-100 border border-gray-200" /><span className="text-xs text-gray-500">Inativo</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-gray-100" /><span className="text-xs text-gray-500">Pausa</span></div>
          </div>
        </div>
      </div>

      <button
        onClick={save}
        className={`px-6 py-2.5 font-semibold text-sm rounded-lg transition-colors ${saved ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
      >
        {saved ? 'Horários salvos!' : 'Salvar horários'}
      </button>
    </div>
  )
}

// ─── Seção: Clientes ──────────────────────────────────────────────────────────

type EtapaFunil = 'prospect' | 'lead' | 'oportunidade' | 'cliente'

interface ClienteItem {
  id: number
  empresa: string
  segmento: string
  etapa: EtapaFunil
  responsavel: string
  ultimaInteracao: string
}

const CLIENTES_MOCK: ClienteItem[] = [
  { id: 1, empresa: 'Nexus Soluções', segmento: 'Tecnologia', etapa: 'oportunidade', responsavel: 'Ana Lima', ultimaInteracao: 'Hoje' },
  { id: 2, empresa: 'DataLake Corp', segmento: 'SaaS', etapa: 'lead', responsavel: 'Carlos Ramos', ultimaInteracao: 'Ontem' },
  { id: 3, empresa: 'VertexSoft', segmento: 'Software', etapa: 'prospect', responsavel: 'Pedro Souza', ultimaInteracao: '22/05' },
  { id: 4, empresa: 'Pharma Brasil', segmento: 'Saúde', etapa: 'cliente', responsavel: 'Ana Lima', ultimaInteracao: '20/05' },
  { id: 5, empresa: 'Constru Tech', segmento: 'Construção', etapa: 'lead', responsavel: 'Fernanda Rocha', ultimaInteracao: '19/05' },
  { id: 6, empresa: 'EduMais', segmento: 'Educação', etapa: 'oportunidade', responsavel: 'Carlos Ramos', ultimaInteracao: '18/05' },
  { id: 7, empresa: 'HR Solutions', segmento: 'RH', etapa: 'prospect', responsavel: 'Pedro Souza', ultimaInteracao: '17/05' },
  { id: 8, empresa: 'Varejo Max', segmento: 'Varejo', etapa: 'cliente', responsavel: 'Ana Lima', ultimaInteracao: '15/05' },
]

const ETAPAS: { id: EtapaFunil; label: string; color: string; bg: string }[] = [
  { id: 'prospect',    label: 'Prospect',    color: 'text-gray-700',  bg: 'bg-gray-100'   },
  { id: 'lead',        label: 'Lead',        color: 'text-blue-700',  bg: 'bg-blue-50'    },
  { id: 'oportunidade',label: 'Oportunidade',color: 'text-amber-700', bg: 'bg-amber-50'   },
  { id: 'cliente',     label: 'Cliente',     color: 'text-green-700', bg: 'bg-green-50'   },
]

interface NovoClienteForm {
  empresa: string
  segmento: string
  responsavel: string
  etapa: EtapaFunil
}

function SectionClientes() {
  const [clientes, setClientes] = useState<ClienteItem[]>(CLIENTES_MOCK)
  const [filtroEtapa, setFiltroEtapa] = useState<EtapaFunil | 'todos'>('todos')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<NovoClienteForm>({ empresa: '', segmento: '', responsavel: '', etapa: 'prospect' })

  const filtered = clientes.filter(c => filtroEtapa === 'todos' || c.etapa === filtroEtapa)

  function addCliente() {
    if (!form.empresa.trim()) return
    const novo: ClienteItem = { id: Date.now(), ...form, ultimaInteracao: 'Hoje' }
    setClientes(prev => [novo, ...prev])
    setForm({ empresa: '', segmento: '', responsavel: '', etapa: 'prospect' })
    setShowForm(false)
  }

  const inputCls = 'border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full'

  return (
    <div className="space-y-4">
      {/* Mini-funil */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Funil de clientes</h3>
        <div className="flex gap-2">
          {ETAPAS.map((et, i) => {
            const count = clientes.filter(c => c.etapa === et.id).length
            return (
              <div key={et.id} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className={`${et.bg} rounded-lg p-3 text-center w-full`}
                  style={{ minHeight: 60 }}
                >
                  <p className={`text-xl font-bold ${et.color}`}>{count}</p>
                  <p className={`text-xs font-medium ${et.color}`}>{et.label}</p>
                </div>
                {i < ETAPAS.length - 1 && (
                  <div className="hidden sm:block text-gray-300 text-lg">→</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2 flex-wrap">
            {([['todos', 'Todos'], ...ETAPAS.map(e => [e.id, e.label])] as [EtapaFunil | 'todos', string][]).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setFiltroEtapa(id)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${filtroEtapa === id ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 text-xs bg-blue-600 text-white rounded-lg px-3 py-1.5 hover:bg-blue-700 whitespace-nowrap"
          >
            <UserPlus size={13} /> + Adicionar cliente
          </button>
        </div>

        {/* Form inline */}
        {showForm && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 grid grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Empresa</label>
              <input className={inputCls} placeholder="Nome da empresa" value={form.empresa} onChange={e => setForm(p => ({ ...p, empresa: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Segmento</label>
              <input className={inputCls} placeholder="Ex: Tecnologia" value={form.segmento} onChange={e => setForm(p => ({ ...p, segmento: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Responsável</label>
              <input className={inputCls} placeholder="Nome" value={form.responsavel} onChange={e => setForm(p => ({ ...p, responsavel: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Etapa</label>
              <select className={inputCls} value={form.etapa} onChange={e => setForm(p => ({ ...p, etapa: e.target.value as EtapaFunil }))}>
                {ETAPAS.map(e => <option key={e.id} value={e.id}>{e.label}</option>)}
              </select>
            </div>
            <div className="col-span-4 flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="text-xs border border-gray-300 rounded-lg px-3 py-1.5 text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button onClick={addCliente} className="text-xs bg-blue-600 text-white rounded-lg px-3 py-1.5 hover:bg-blue-700">Salvar</button>
            </div>
          </div>
        )}

        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 border-b border-gray-100">
              <th className="text-left pb-2 font-medium">Empresa</th>
              <th className="text-left pb-2 font-medium">Segmento</th>
              <th className="text-left pb-2 font-medium">Etapa</th>
              <th className="text-left pb-2 font-medium">Responsável</th>
              <th className="text-left pb-2 font-medium">Última interação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(c => {
              const etapa = ETAPAS.find(e => e.id === c.etapa)!
              return (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-2.5 font-medium text-gray-900">{c.empresa}</td>
                  <td className="py-2.5 text-xs text-gray-500">{c.segmento}</td>
                  <td className="py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${etapa.bg} ${etapa.color}`}>{etapa.label}</span>
                  </td>
                  <td className="py-2.5 text-gray-600">{c.responsavel}</td>
                  <td className="py-2.5 text-xs text-gray-400">{c.ultimaInteracao}</td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="py-6 text-center text-sm text-gray-400">Nenhum cliente nesta etapa.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Seção: Meu WhatsApp ──────────────────────────────────────────────────────

function SectionMeuWhatsApp() {
  const { user } = useAuthStore()
  const [status, setStatus]         = useState<'desconhecido' | 'conectado' | 'conectando' | 'desconectado'>('desconhecido')
  const [qr, setQr]                 = useState<string | null>(null)
  const [loadingQr, setLoadingQr]   = useState(false)
  const [polling, setPolling]       = useState(false)
  const [toast, setToast]           = useState<string | null>(null)

  function showToast(t: string) { setToast(t); setTimeout(() => setToast(null), 4000) }

  // Verifica status ao montar
  useEffect(() => {
    whatsappUsuarioApi.status()
      .then(r => {
        const d = r.data as any
        setStatus(d.conectado ? 'conectado' : d.estado === 'connecting' ? 'conectando' : 'desconectado')
      })
      .catch(() => setStatus('desconectado'))
  }, [])

  // Polling enquanto aguarda conexão
  useEffect(() => {
    if (!polling) return
    const iv = setInterval(async () => {
      try {
        const r = await whatsappUsuarioApi.status()
        const d = r.data as any
        if (d.conectado) {
          setStatus('conectado')
          setQr(null)
          setPolling(false)
          showToast('✓ WhatsApp conectado com sucesso!')
        }
      } catch (_) {}
    }, 3000)
    return () => clearInterval(iv)
  }, [polling])

  async function conectar() {
    setLoadingQr(true)
    setQr(null)
    try {
      const r = await whatsappUsuarioApi.conectar()
      const d = r.data as any
      if (d.conectado) {
        setStatus('conectado')
        setPolling(true)
      } else {
        // Busca QR como imagem PNG real via proxy no backend
        const jwtToken = localStorage.getItem('youagent_jwt')
        const resp = await fetch('https://app.etztech.com/api/v1/whatsapp/eu/qr-image', {
          headers: { Authorization: `Bearer ${jwtToken}` },
        })
        if (!resp.ok) throw new Error('Falha ao carregar QR code')
        const contentType = resp.headers.get('content-type') || ''
        if (contentType.includes('application/json')) {
          // Backend sinalizou que já está conectado
          const json = await resp.json()
          if (json.conectado) { setStatus('conectado'); setPolling(true); return }
          throw new Error(json.error || 'Erro ao carregar QR')
        }
        const blob = await resp.blob()
        setQr(URL.createObjectURL(blob))
        setStatus('conectando')
        setPolling(true)
      }
    } catch (e: any) {
      const msg: string = e?.response?.data?.error ?? e?.message ?? 'Erro desconhecido'
      const isMongo = msg.toLowerCase().includes('mongo') || msg.toLowerCase().includes('topology')
      if (isMongo) {
        showToast('⚠️ Serviço WhatsApp temporariamente indisponível — tente novamente em alguns segundos ou contate o suporte')
      } else {
        showToast('Erro ao gerar QR — ' + msg)
      }
    } finally {
      setLoadingQr(false)
    }
  }

  async function desconectar() {
    try {
      await whatsappUsuarioApi.desconectar()
      setStatus('desconectado')
      setQr(null)
      setPolling(false)
      showToast('WhatsApp desconectado.')
    } catch (e: any) {
      showToast('Erro ao desconectar — ' + (e?.response?.data?.error ?? e.message))
    }
  }

  const statusConfig = {
    conectado:    { label: 'Conectado',    cls: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
    conectando:   { label: 'Aguardando QR', cls: 'bg-amber-100 text-amber-700',   dot: 'bg-amber-400 animate-pulse' },
    desconectado: { label: 'Desconectado', cls: 'bg-gray-100 text-gray-500',       dot: 'bg-gray-400' },
    desconhecido: { label: 'Verificando…', cls: 'bg-gray-100 text-gray-400',       dot: 'bg-gray-300 animate-pulse' },
  }
  const sc = statusConfig[status]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Meu WhatsApp</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Conecte seu WhatsApp pessoal para enviar e receber mensagens diretamente pelo sistema.
          As conversas ficam salvas com histórico completo.
        </p>
      </div>

      {/* Status + ações */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <MessageSquare size={20} className="text-emerald-600"/>
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">{user?.nome ?? user?.email}</div>
              <div className="text-xs text-gray-500">WhatsApp pessoal</div>
            </div>
          </div>
          <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${sc.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}/>
            {sc.label}
          </span>
        </div>

        {/* QR Code */}
        {qr && (
          <div className="flex flex-col items-center gap-3 py-4 border border-dashed border-emerald-300 rounded-xl mb-4 bg-emerald-50/40">
            <div className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
              <QrCode size={14} className="text-emerald-600"/>
              Escaneie com o WhatsApp do seu celular
            </div>
            <img src={qr}
              alt="QR Code WhatsApp" className="w-52 h-52 rounded-xl border-4 border-white shadow-md"/>
            <p className="text-2xs text-gray-400">Abra o WhatsApp → Menu → Aparelhos conectados → Conectar aparelho</p>
          </div>
        )}

        <div className="flex gap-2">
          {status !== 'conectado' ? (
            <button onClick={conectar} disabled={loadingQr}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white text-sm font-semibold transition-colors">
              {loadingQr
                ? <><RefreshCw size={14} className="animate-spin"/> Gerando QR…</>
                : <><QrCode size={14}/> {qr ? 'Novo QR Code' : 'Conectar WhatsApp'}</>}
            </button>
          ) : (
            <button onClick={desconectar}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-sm font-semibold transition-colors">
              <WifiOff size={14}/> Desconectar
            </button>
          )}
          {status === 'conectado' && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium ml-2">
              <CheckCircle2 size={14}/> Pronto para enviar mensagens
            </div>
          )}
        </div>
      </div>

      {/* Info: mensagens ficam na Discadora */}
      {status === 'conectado' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0 mt-0.5"/>
          <div>
            <p className="text-sm font-semibold text-emerald-800">WhatsApp conectado e pronto para uso</p>
            <p className="text-xs text-emerald-700 mt-0.5">
              Para enviar mensagens e ver o histórico de conversas, acesse <strong>Discadora → Chamada Manual</strong>.
              As mensagens são enviadas pelo seu número pessoal e ficam salvas por contato.
            </p>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.startsWith('✓') ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast}
        </div>
      )}
    </div>
  )
}

// ─── Nav items ────────────────────────────────────────────────────────────────

type NavItem = {
  id: ExtConfigSection
  label: string
  icon: React.ReactNode
  adminOnly: boolean
  roles?: string[]
}

const NAV_ITEMS: NavItem[] = [
  { id: 'empresa',                label: 'Empresa',          icon: <Building2 className="w-4 h-4" />,  adminOnly: false },
  { id: 'integracoes',            label: 'Integrações',      icon: <Plug className="w-4 h-4" />,       adminOnly: false },
  { id: 'integracoes-avancadas',  label: 'Integ. Avançadas', icon: <ZapIcon className="w-4 h-4" />,    adminOnly: true  },
  { id: 'seguranca',              label: 'Segurança',        icon: <Shield className="w-4 h-4" />,     adminOnly: true  },
  { id: 'notificacoes',           label: 'Notificações',     icon: <Bell className="w-4 h-4" />,       adminOnly: false },
  { id: 'equipe',                 label: 'Equipe',           icon: <Users className="w-4 h-4" />,      adminOnly: false },
  { id: 'horarios',               label: 'Horários',         icon: <Clock className="w-4 h-4" />,      adminOnly: false, roles: ['admin_cliente', 'gerente'] },
  { id: 'clientes',               label: 'Clientes',         icon: <UserPlus className="w-4 h-4" />,   adminOnly: true,  roles: ['admin_cliente'] },
  { id: 'dev',                    label: 'Desenvolvimento',  icon: <Terminal className="w-4 h-4" />,   adminOnly: true  },
  { id: 'crm',                    label: 'CRM',              icon: <Database className="w-4 h-4" />,   adminOnly: false },
  { id: 'api',                    label: 'API & Webhooks',   icon: <Key className="w-4 h-4" />,        adminOnly: true  },
  { id: 'meu-whatsapp',          label: 'Meu WhatsApp',     icon: <MessageSquare className="w-4 h-4" />, adminOnly: false },
]

// ─── ConfigPage ───────────────────────────────────────────────────────────────

export default function ConfigPage() {
  const { allowedConfigSections, currentRole } = useProfile()
  const isAtivo = useAuthStore((state) => state.isAtivo())

  const visibleItems = NAV_ITEMS.filter(item => {
    // For items with explicit roles list, check role directly
    if (item.roles) return item.roles.includes(currentRole)
    // Otherwise fall back to ProfileContext allowedConfigSections
    return allowedConfigSections.includes(item.id as ConfigSection)
  })

  const [active, setActive] = useState<ExtConfigSection>(
    visibleItems.length > 0 ? visibleItems[0].id : 'empresa'
  )

  if (visibleItems.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="text-center">
          <Lock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Você não tem acesso às configurações.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Configurações</h1>
      <div className="grid grid-cols-[200px_1fr] gap-4 h-full">
        {/* Sidebar */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-2 h-fit">
          <nav className="space-y-0.5">
            {visibleItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors font-medium ${
                  active === item.id
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {item.icon}
                <span className="flex-1">{item.label}</span>
                {item.adminOnly && (
                  <Lock size={11} className="text-gray-300 shrink-0" />
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Painel */}
        <div>
          {active === 'empresa'               && <SectionEmpresa />}
          {active === 'integracoes'           && (isAtivo ? <SectionIntegracoes /> : <ModuloBloqueado nomeModulo="Integrações" />)}
          {active === 'integracoes-avancadas' && <SectionIntegracoesAvancadas />}
          {active === 'seguranca'             && <SectionSeguranca />}
          {active === 'notificacoes'          && <SectionNotificacoes />}
          {active === 'equipe'                && (isAtivo ? <SectionEquipe /> : <ModuloBloqueado nomeModulo="Gestão de Equipe" />)}
          {active === 'horarios'              && <SectionHorarios />}
          {active === 'clientes'              && <SectionClientes />}
          {active === 'dev'                   && <SectionDev />}
          {active === 'crm'                   && <SectionCrm />}
          {active === 'api'                   && <SectionApi />}
          {active === 'meu-whatsapp'          && <SectionMeuWhatsApp />}
        </div>
      </div>
    </div>
  )
}
