import React, { useState, useRef, useEffect } from 'react'
import { claudeApi, api } from '@/services/api'
import {
  Code2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Copy,
  RotateCcw,
  Pause,
  Play,
  Trash2,
  Download,
  Bot,
  Cpu,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface HealthItem {
  nome: string
  status: 'ok' | 'warning' | 'error'
  latencia: number | null
  detalhes: string
}

interface LogLine {
  timestamp: string
  nivel: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG'
  servico: string
  mensagem: string
}

interface FeatureFlag {
  id: string
  nome: string
  descricao: string
  ativo: boolean
  ambiente: 'producao' | 'homologacao' | 'dev'
  atualizadoEm: string
}

interface EnvVar {
  nome: string
  masked: string
  real: string
}

interface SysConfig {
  timeoutLigacao: number
  maxRetries: number
  cacheTTL: number
  modoManutencao: boolean
}

type TabDev = 'health' | 'logs' | 'flags' | 'config' | 'claude' | 'sistema'
type NivelFiltro = 'Todos' | 'ERROR' | 'WARN' | 'INFO' | 'DEBUG'
type ServicioFiltro = 'Todos' | 'API' | 'Telnyx' | 'ElevenLabs' | 'Claude' | 'DB'

// ─── Static Data ──────────────────────────────────────────────────────────────

const HEALTH_ITEMS: HealthItem[] = [
  { nome: 'API REST', status: 'ok', latencia: 45, detalhes: 'Todos endpoints respondendo' },
  { nome: 'DB Supabase', status: 'ok', latencia: 12, detalhes: 'Conexão estável' },
  { nome: 'Telnyx Voice', status: 'ok', latencia: 87, detalhes: 'SIP registrado, calls ativas: 3' },
  { nome: 'ElevenLabs TTS', status: 'ok', latencia: 180, detalhes: 'Síntese de voz operacional' },
  { nome: 'Anthropic Claude', status: 'ok', latencia: 320, detalhes: 'API respondendo normalmente' },
  { nome: 'Redis Cache', status: 'warning', latencia: 450, detalhes: 'Latência elevada — threshold: 200ms' },
  { nome: 'Storage S3', status: 'ok', latencia: 23, detalhes: 'Armazenamento operacional' },
  { nome: 'Webhook Handler', status: 'ok', latencia: null, detalhes: 'Queue processando normalmente' },
]

const MOCK_LOGS: LogLine[] = [
  { timestamp: '2026-05-24 09:14:23', nivel: 'INFO', servico: 'API', mensagem: 'POST /v1/call/start — 200 OK — 87ms' },
  { timestamp: '2026-05-24 09:14:21', nivel: 'INFO', servico: 'Telnyx', mensagem: 'Call SIP initiated — lid=42 — agent=Ana' },
  { timestamp: '2026-05-24 09:14:18', nivel: 'WARN', servico: 'Redis', mensagem: 'Latência 450ms — threshold: 200ms' },
  { timestamp: '2026-05-24 09:14:15', nivel: 'INFO', servico: 'Claude', mensagem: 'Token usage: 1.847 — cost: $0.028' },
  { timestamp: '2026-05-24 09:14:10', nivel: 'INFO', servico: 'DB', mensagem: 'Query executada — 12ms — reunioes' },
  { timestamp: '2026-05-24 09:14:05', nivel: 'ERROR', servico: 'ElevenLabs', mensagem: 'Timeout 5000ms — retry 1/3' },
  { timestamp: '2026-05-24 09:14:01', nivel: 'INFO', servico: 'API', mensagem: 'GET /v1/dashboard/kpis — 200 OK — 34ms' },
  { timestamp: '2026-05-24 09:13:55', nivel: 'INFO', servico: 'Webhook', mensagem: 'Event fired: reuniao.agendada — 201' },
  { timestamp: '2026-05-24 09:13:50', nivel: 'INFO', servico: 'API', mensagem: 'POST /v1/transfer — 200 OK — 112ms' },
  { timestamp: '2026-05-24 09:13:44', nivel: 'DEBUG', servico: 'Claude', mensagem: 'Prompt tokens: 892, completion: 241' },
  { timestamp: '2026-05-24 09:13:40', nivel: 'INFO', servico: 'Telnyx', mensagem: 'Call ended — lid=41 — duration: 3m12s' },
  { timestamp: '2026-05-24 09:13:35', nivel: 'INFO', servico: 'DB', mensagem: 'Reuniao salva — id=87 — empresa=Acme Corp' },
  { timestamp: '2026-05-24 09:13:28', nivel: 'WARN', servico: 'API', mensagem: 'Rate limit approaching — 890/1000 req/min' },
  { timestamp: '2026-05-24 09:13:20', nivel: 'INFO', servico: 'ElevenLabs', mensagem: 'Audio gerado — 2.340 chars — 1.2s' },
  { timestamp: '2026-05-24 09:13:15', nivel: 'INFO', servico: 'API', mensagem: 'GET /v1/agents/status — 200 OK — 28ms' },
]

const FLAGS_INICIAIS: FeatureFlag[] = [
  { id: 'cross_cliente_auto', nome: 'Cross-cliente automático', descricao: 'Propagação de argumentos entre clientes', ativo: true, ambiente: 'producao', atualizadoEm: '24/05/2026' },
  { id: 'email_composer_v2', nome: 'Editor de e-mail v2', descricao: 'Compositor com preview ao vivo', ativo: true, ambiente: 'producao', atualizadoEm: '23/05/2026' },
  { id: 'pipeline_kanban', nome: 'Pipeline Kanban', descricao: 'Visualização em colunas', ativo: true, ambiente: 'producao', atualizadoEm: '22/05/2026' },
  { id: 'ab_testing', nome: 'A/B Testing CI', descricao: 'Testes de variantes no Centro de Inteligência', ativo: true, ambiente: 'producao', atualizadoEm: '21/05/2026' },
  { id: 'receptivo_whatsapp', nome: 'Receptivo WhatsApp', descricao: 'Atendimento inbound via WhatsApp', ativo: false, ambiente: 'homologacao', atualizadoEm: '20/05/2026' },
  { id: 'meritocracia_v2', nome: 'Meritocracia V2', descricao: 'Distribuição inteligente por performance', ativo: false, ambiente: 'dev', atualizadoEm: '19/05/2026' },
  { id: 'ia_fine_tuning', nome: 'Fine-tuning automático', descricao: 'Ajuste fino com gravações aprovadas', ativo: false, ambiente: 'dev', atualizadoEm: '18/05/2026' },
  { id: 'admin_custos_v2', nome: 'Custos V2', descricao: 'Controle por conta/cliente', ativo: false, ambiente: 'dev', atualizadoEm: '17/05/2026' },
  { id: 'multi_idioma', nome: 'Suporte multilíngue', descricao: 'Agentes em EN/ES além de PT-BR', ativo: false, ambiente: 'dev', atualizadoEm: '16/05/2026' },
  { id: 'api_v2', nome: 'API REST v2', descricao: 'Nova versão da API pública', ativo: false, ambiente: 'dev', atualizadoEm: '15/05/2026' },
]

const ENV_VARS: EnvVar[] = [
  { nome: 'TELNYX_API_KEY', masked: 'sk_live_••••••••2Nx9', real: 'sk_live_MOCK2Nx9' },
  { nome: 'ELEVENLABS_API_KEY', masked: 'el_••••••••k8Lm', real: 'el_MOCKk8Lm' },
  { nome: 'ANTHROPIC_API_KEY', masked: 'sk-ant-••••••••5Rp2', real: 'sk-ant-MOCK5Rp2' },
  { nome: 'SUPABASE_URL', masked: 'https://••••••.supabase.co', real: 'https://mock.supabase.co' },
  { nome: 'API_BASE_URL', masked: 'https://app.etztech.com/api/v1', real: 'https://app.etztech.com/api/v1' },
]

// ─── Health Check Tab ─────────────────────────────────────────────────────────

function TabHealthCheck() {
  const [checking, setChecking] = useState(false)
  const [items, setItems] = useState<HealthItem[]>(HEALTH_ITEMS)

  function runCheck() {
    setChecking(true)
    setTimeout(() => {
      setItems([...HEALTH_ITEMS])
      setChecking(false)
    }, 2000)
    // chamada real como fallback
    api.get('/health').then(r => {
      console.log('Health check real:', r.data)
    }).catch(e => console.log('Health check real falhou:', e.message))
  }

  const okCount = items.filter((i) => i.status === 'ok').length
  const warnCount = items.filter((i) => i.status === 'warning').length
  const errorCount = items.filter((i) => i.status === 'error').length

  function StatusIcon({ status }: { status: 'ok' | 'warning' | 'error' }) {
    if (status === 'ok') return <CheckCircle className="w-5 h-5 text-green-500" />
    if (status === 'warning') return <AlertTriangle className="w-5 h-5 text-amber-500" />
    return <XCircle className="w-5 h-5 text-red-500" />
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-600">
          {errorCount === 0 && warnCount === 0
            ? <span className="text-green-600 font-medium">✅ Sistema saudável</span>
            : <span>✅ {okCount} OK{warnCount > 0 ? ` · ⚠ ${warnCount} Alerta` : ''}{errorCount > 0 ? ` · ❌ ${errorCount} Erro` : ''}</span>
          }
        </div>
        <button
          onClick={runCheck}
          disabled={checking}
          className="flex items-center gap-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg transition-colors"
        >
          {checking ? (
            <><RotateCcw className="w-4 h-4 animate-spin" /> Verificando...</>
          ) : (
            <>▶ Executar health check</>
          )}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {items.map((item) => (
          <div
            key={item.nome}
            className={`bg-white rounded-xl border p-4 ${item.status === 'warning' ? 'border-amber-200' : item.status === 'error' ? 'border-red-200' : 'border-gray-200'}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <StatusIcon status={item.status} />
              <span className="font-semibold text-gray-900 text-sm">{item.nome}</span>
            </div>
            {item.latencia !== null && (
              <p className="text-xs font-mono text-gray-500 mb-1">{item.latencia}ms</p>
            )}
            <p className="text-xs text-gray-500">{item.detalhes}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Logs Tab ─────────────────────────────────────────────────────────────────

function TabLogs() {
  const [nivel, setNivel] = useState<NivelFiltro>('Todos')
  const [search, setSearch] = useState('')
  const [servico, setServico] = useState<ServicioFiltro>('Todos')
  const [paused, setPaused] = useState(false)
  const [logs, setLogs] = useState<LogLine[]>(MOCK_LOGS)
  const [toast, setToast] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!paused && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, paused])

  const nivelColor: Record<string, string> = {
    ERROR: 'text-red-400',
    WARN: 'text-yellow-400',
    INFO: 'text-green-400',
    DEBUG: 'text-gray-400',
  }

  const filtered = logs.filter((l) => {
    const nivelOk = nivel === 'Todos' || l.nivel === nivel
    const servicoOk = servico === 'Todos' || l.servico.toLowerCase().includes(servico.toLowerCase())
    const searchOk = search === '' || l.mensagem.toLowerCase().includes(search.toLowerCase()) || l.servico.toLowerCase().includes(search.toLowerCase())
    return nivelOk && servicoOk && searchOk
  })

  function exportar() {
    setToast(true)
    setTimeout(() => setToast(false), 2000)
  }

  return (
    <div className="space-y-3">
      {toast && (
        <div className="fixed top-4 right-4 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg z-50 shadow-lg">
          Logs exportados
        </div>
      )}
      <div className="flex gap-3 items-center">
        <select
          value={nivel}
          onChange={(e) => setNivel(e.target.value as NivelFiltro)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {(['Todos', 'ERROR', 'WARN', 'INFO', 'DEBUG'] as NivelFiltro[]).map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar nos logs..."
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={servico}
          onChange={(e) => setServico(e.target.value as ServicioFiltro)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {(['Todos', 'API', 'Telnyx', 'ElevenLabs', 'Claude', 'DB'] as ServicioFiltro[]).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button
          onClick={() => setPaused((p) => !p)}
          className="flex items-center gap-1.5 text-sm border border-gray-200 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors"
        >
          {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          {paused ? 'Retomar' : 'Pausar'}
        </button>
        <button
          onClick={() => setLogs([])}
          className="flex items-center gap-1.5 text-sm border border-gray-200 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" /> Limpar
        </button>
        <button
          onClick={exportar}
          className="flex items-center gap-1.5 text-sm border border-gray-200 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" /> Exportar
        </button>
      </div>

      <div className="bg-gray-900 rounded-xl p-4 h-96 overflow-y-auto font-mono text-sm">
        {filtered.length === 0 && (
          <p className="text-gray-500 text-center mt-8">Nenhum log encontrado</p>
        )}
        {filtered.map((l, i) => (
          <div key={i} className="mb-0.5">
            <span className="text-gray-500">[{l.timestamp}] </span>
            <span className={`${nivelColor[l.nivel]} font-medium`}>[{l.nivel.padEnd(5)}] </span>
            <span className="text-blue-400">[{l.servico}] </span>
            <span className="text-gray-200">{l.mensagem}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}

// ─── Feature Flags Tab ────────────────────────────────────────────────────────

function TabFeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlag[]>(FLAGS_INICIAIS)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  function handleToggle(id: string) {
    const flag = flags.find((f) => f.id === id)
    if (!flag) return
    if (!flag.ativo && flag.ambiente === 'producao') {
      setConfirmId(id)
      return
    }
    toggle(id)
  }

  function toggle(id: string) {
    setFlags((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, ativo: !f.ativo, atualizadoEm: '24/05/2026' } : f
      )
    )
    setConfirmId(null)
  }

  function reset(id: string) {
    const original = FLAGS_INICIAIS.find((f) => f.id === id)
    if (!original) return
    setFlags((prev) => prev.map((f) => f.id === id ? { ...original } : f))
  }

  function AmbienteBadge({ ambiente }: { ambiente: 'producao' | 'homologacao' | 'dev' }) {
    const cls: Record<string, string> = {
      producao: 'bg-green-100 text-green-700',
      homologacao: 'bg-blue-100 text-blue-700',
      dev: 'bg-gray-100 text-gray-600',
    }
    return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls[ambiente]}`}>{ambiente}</span>
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            <th className="px-4 py-3 w-12" />
            <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Nome</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Descrição</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Ambiente</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Atualizado</th>
            <th className="px-4 py-3 w-10" />
          </tr>
        </thead>
        <tbody>
          {flags.map((f) => (
            <React.Fragment key={f.id}>
              <tr className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggle(f.id)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${f.ativo ? 'bg-blue-600' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${f.ativo ? 'translate-x-4' : 'translate-x-1'}`} />
                  </button>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{f.id}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{f.nome}</td>
                <td className="px-4 py-3 text-gray-500">{f.descricao}</td>
                <td className="px-4 py-3"><AmbienteBadge ambiente={f.ambiente} /></td>
                <td className="px-4 py-3 text-gray-500">{f.atualizadoEm}</td>
                <td className="px-4 py-3">
                  <button onClick={() => reset(f.id)} className="text-gray-400 hover:text-gray-600 transition-colors" title="Resetar">
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </td>
              </tr>
              {confirmId === f.id && (
                <tr className="bg-amber-50 border-b border-amber-100">
                  <td colSpan={7} className="px-4 py-3">
                    <div className="flex items-center gap-3 text-sm">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                      <span className="text-amber-800">⚠ Isso afeta todos os clientes em produção. Confirmar?</span>
                      <button
                        onClick={() => toggle(f.id)}
                        className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded-md text-xs font-medium transition-colors"
                      >
                        Sim
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-1 rounded-md text-xs font-medium transition-colors"
                      >
                        Não
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Config Tab ───────────────────────────────────────────────────────────────

function TabConfig() {
  const [cfg, setCfg] = useState<SysConfig>({
    timeoutLigacao: 300,
    maxRetries: 3,
    cacheTTL: 30,
    modoManutencao: false,
  })
  const [copied, setCopied] = useState<string | null>(null)

  function copyVar(nome: string, real: string) {
    navigator.clipboard.writeText(real).catch(() => undefined)
    setCopied(nome)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div className="space-y-6">
      {/* Maintenance banner */}
      {cfg.modoManutencao && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          ⚠ Sistema em manutenção — usuários veem página de aviso
        </div>
      )}

      {/* Env vars */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Variáveis de ambiente</h3>
        <div className="space-y-2">
          {ENV_VARS.map((v) => (
            <div key={v.nome} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
              <span className="font-mono text-xs text-gray-500 w-44 shrink-0">{v.nome}</span>
              <span className="font-mono text-sm text-gray-800 flex-1">{v.masked}</span>
              <button
                onClick={() => copyVar(v.nome, v.real)}
                className="text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 text-xs"
                title="Copiar"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied === v.nome ? 'Copiado!' : ''}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* System config */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Configurações do sistema</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">Timeout ligação (s)</p>
            </div>
            <input
              type="number"
              value={cfg.timeoutLigacao}
              onChange={(e) => setCfg((c) => ({ ...c, timeoutLigacao: Number(e.target.value) }))}
              className="w-24 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-800">Max retries API</p>
            <input
              type="number"
              value={cfg.maxRetries}
              onChange={(e) => setCfg((c) => ({ ...c, maxRetries: Number(e.target.value) }))}
              className="w-24 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-800">Cache TTL (s)</p>
            <input
              type="number"
              value={cfg.cacheTTL}
              onChange={(e) => setCfg((c) => ({ ...c, cacheTTL: Number(e.target.value) }))}
              className="w-24 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-800">Modo manutenção</p>
            <button
              onClick={() => setCfg((c) => ({ ...c, modoManutencao: !c.modoManutencao }))}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${cfg.modoManutencao ? 'bg-red-500' : 'bg-gray-200'}`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${cfg.modoManutencao ? 'translate-x-4' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      </div>

      <button
        className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
        onClick={() => {
          localStorage.setItem('admin_dev_config', JSON.stringify(cfg))
          alert('Configurações salvas localmente')
        }}
      >
        Salvar configurações
      </button>
    </div>
  )
}

// ─── Tab: Claude API ──────────────────────────────────────────────────────────

function TabClaude() {
  const [status, setStatus] = useState<{ configurado: boolean; modelo: string } | null>(null)
  const [statusLoading, setStatusLoading] = useState(true)
  const [chatHistory, setChatHistory] = useState<Array<{ role: string; content: string }>>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    claudeApi.status()
      .then((res) => setStatus(res.data as { configurado: boolean; modelo: string }))
      .catch(() => setStatus({ configurado: false, modelo: '' }))
      .finally(() => setStatusLoading(false))
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory])

  async function enviarMensagem() {
    if (!chatInput.trim() || chatLoading) return
    const userMsg = { role: 'user' as const, content: chatInput.trim() }
    const newHistory = [...chatHistory, userMsg]
    setChatHistory(newHistory)
    setChatInput('')
    setChatLoading(true)
    try {
      const res = await claudeApi.chat(newHistory)
      const data = res.data as { resposta: string }
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.resposta }])
    } catch (err: unknown) {
      const msg = (err as { response?: { status?: number } })?.response?.status === 503
        ? 'Claude API não configurada no Railway'
        : 'Erro ao chamar Claude. Tente novamente.'
      setChatHistory(prev => [...prev, { role: 'assistant', content: msg }])
    } finally {
      setChatLoading(false)
    }
  }

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Status */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Bot className="w-4 h-4 text-blue-600" /> Claude API — Status</h3>
        {statusLoading ? (
          <p className="text-sm text-gray-400">Verificando conexão...</p>
        ) : status?.configurado ? (
          <div className="flex items-center gap-2 text-sm text-green-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            Conectado — {status.modelo}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-red-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
            Não configurada — adicione ANTHROPIC_API_KEY no Railway
          </div>
        )}
      </div>

      {/* Chat */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Bot className="w-4 h-4 text-purple-600" /> Chat de teste</h3>
        <div className="h-56 overflow-y-auto flex flex-col gap-2 border border-gray-100 rounded-lg p-3 bg-gray-50">
          {chatHistory.length === 0 && (
            <p className="text-xs text-gray-400 text-center mt-auto">Nenhuma mensagem ainda. Faça uma pergunta sobre o ETZ.</p>
          )}
          {chatHistory.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] text-xs rounded-lg px-3 py-2 whitespace-pre-wrap ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-800'}`}>
                {m.content}
              </div>
            </div>
          ))}
          {chatLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-400">Digitando...</div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        <div className="flex gap-2">
          <input
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && enviarMensagem()}
            placeholder="Pergunte algo ao assistente ETZ..."
            className={inputCls}
          />
          <button
            onClick={enviarMensagem}
            disabled={chatLoading || !chatInput.trim()}
            className="px-4 py-2 text-sm font-medium bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white rounded-lg transition-colors whitespace-nowrap"
          >
            Enviar
          </button>
        </div>
      </div>

      {/* Placeholder for model/config — kept minimal, config lives in Railway env */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-2"><Bot className="w-4 h-4 text-blue-600" /> Configuração Claude API</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Modelo ativo</label>
            <select value="claude-haiku-4-5" disabled className={inputCls + ' opacity-60 cursor-not-allowed'}>
              <option value="claude-opus-4-7">claude-opus-4-7</option>
              <option value="claude-sonnet-4-6">claude-sonnet-4-6</option>
              <option value="claude-haiku-4-5">claude-haiku-4-5</option>
            </select>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">A API Key é configurada como variável de ambiente no Railway — nunca exposta no frontend.</p>
      </div>
    </div>
  )
}

// ─── Tab: Sistema ─────────────────────────────────────────────────────────────

const CONSOLE_LOGS = [
  '[09:14:23] INFO  [API] POST /v1/call/start — 200 OK — 87ms',
  '[09:14:21] INFO  [Telnyx] Call SIP initiated — lid=42 — agent=Ana',
  '[09:14:18] WARN  [Redis] Latência 450ms — threshold: 200ms',
  '[09:14:15] INFO  [Claude] Token usage: 1.847 — cost: $0.028',
  '[09:14:10] INFO  [DB] Query executada — 12ms — reunioes',
  '[09:14:05] ERROR [ElevenLabs] Timeout 5000ms — retry 1/3',
  '[09:14:01] INFO  [API] GET /v1/dashboard/kpis — 200 OK — 34ms',
  '[09:13:55] INFO  [Webhook] Event fired: reuniao.agendada — 201',
]

function TabSistema() {
  const [logs, setLogs] = useState<string[]>(CONSOLE_LOGS)
  const [autoScroll, setAutoScroll] = useState(true)
  const [showConfirm, setShowConfirm] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, autoScroll])

  const motorBadge = {
    simulado: 'bg-gray-100 text-gray-700',
    hibrido: 'bg-amber-100 text-amber-700',
    real: 'bg-green-100 text-green-700',
  }

  return (
    <div className="space-y-6">
      {/* Status cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Motor atual', value: 'Simulado', badge: motorBadge.simulado },
          { label: 'Versão', value: 'v2.0.1', badge: null },
          { label: 'Uptime', value: '47h 23min', badge: null },
        ].map(c => (
          <div key={c.label} className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">{c.label}</p>
            {c.badge ? (
              <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${c.badge}`}>{c.value}</span>
            ) : (
              <p className="text-xl font-bold font-mono text-gray-900">{c.value}</p>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-2">Memória usada</p>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-1">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: '62%' }} />
          </div>
          <p className="text-xs text-gray-400">62%</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Calls Claude API hoje</p>
          <p className="text-2xl font-bold font-mono text-gray-900">1.247</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Storage localStorage</p>
          <p className="text-lg font-bold font-mono text-gray-900">234 KB</p>
          <p className="text-xs text-gray-400">/ 5 MB</p>
        </div>
      </div>

      {/* Console */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Cpu className="w-4 h-4" /> Console de debug</h3>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <button onClick={() => setAutoScroll(v => !v)} className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${autoScroll ? 'bg-blue-600' : 'bg-gray-200'}`}>
                <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform ${autoScroll ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
              <span className="text-xs text-gray-500">Auto-scroll</span>
            </div>
            <button onClick={() => setLogs([])} className="flex items-center gap-1 text-xs text-gray-500 border border-gray-200 px-2.5 py-1 rounded-lg hover:bg-gray-50 transition-colors">
              <Trash2 className="w-3 h-3" /> Limpar
            </button>
          </div>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 h-52 overflow-y-auto font-mono text-xs">
          {logs.map((line, i) => {
            const isErr = line.includes('ERROR')
            const isWarn = line.includes('WARN')
            return (
              <div key={i} className={`mb-0.5 ${isErr ? 'text-red-400' : isWarn ? 'text-yellow-400' : 'text-green-400'}`}>{line}</div>
            )
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          onClick={() => {
            const diag = {
              timestamp: new Date().toISOString(),
              logs: logs.slice(-50),
            }
            const blob = new Blob([JSON.stringify(diag, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a'); a.href = url; a.download = 'diagnostico-etz-' + Date.now() + '.json'; a.click()
          }}
        >
          <Download className="w-4 h-4" /> Exportar diagnóstico
        </button>
        <button onClick={() => setShowConfirm(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
          <Trash2 className="w-4 h-4" /> Limpar estado
        </button>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span className="font-semibold text-gray-900">Limpar estado do sistema?</span>
            </div>
            <p className="text-sm text-gray-500 mb-5">Esta ação remove todos os dados locais e não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancelar</button>
              <button
                onClick={() => {
                  const jwt = localStorage.getItem('etz_jwt')
                  localStorage.clear()
                  if (jwt) localStorage.setItem('etz_jwt', jwt)
                  setShowConfirm(false)
                  window.location.reload()
                }}
                className="flex-1 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg"
              >Limpar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDevPage() {
  const [tab, setTab] = useState<TabDev>('health')

  const tabs: { id: TabDev; label: string }[] = [
    { id: 'health', label: 'Health Check' },
    { id: 'logs', label: 'Logs' },
    { id: 'flags', label: 'Feature Flags' },
    { id: 'config', label: 'Config' },
    { id: 'claude', label: 'Claude API' },
    { id: 'sistema', label: 'Sistema' },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center">
          <Code2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Admin Dev</h1>
          <p className="text-sm text-gray-500">Console de desenvolvimento e monitoramento interno</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'health' && <TabHealthCheck />}
      {tab === 'logs' && <TabLogs />}
      {tab === 'flags' && <TabFeatureFlags />}
      {tab === 'config' && <TabConfig />}
      {tab === 'claude' && <TabClaude />}
      {tab === 'sistema' && <TabSistema />}
    </div>
  )
}
