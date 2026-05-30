/**
 * VendedorPageRestrita — versão para o perfil `role: 'vendedor'`
 *
 * Diferenças em relação ao VendedorPage gerencial:
 * - Sem dropdown de seleção de vendedor
 * - Exibe apenas reuniões / e-mails / resultados do vendedor logado
 * - currentProfile.nome é usado como filtro automático
 */

import { useState, useEffect, useMemo, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { reunioesApi, emailsApi, calendarApi, equipeApi } from '@/services/api'
import {
  Calendar,
  CalendarDays,
  Check,
  CheckCircle,
  ClipboardCheck,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  FileText,
  Lightbulb,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquare,
  Pencil,
  Phone,
  RefreshCw,
  Send,
  User,
  Video,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react'
import { useProfile } from '@/context/ProfileContext'

const API = import.meta.env.VITE_API_URL || 'https://app.etztech.com/api/v1'
function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem('youagent_jwt')}` }
}

// ─── Types ────────────────────────────────────────────────────────────────────

type VTab = 'agenda' | 'ficha' | 'resultados' | 'email' | 'gcal' | 'mensagens' | 'whatsapp'
type MsgSubTab = 'recebidas' | 'enviadas'
type TipoResultado = 'realizada' | 'nao_compareceu' | 'remarcou' | 'perdeu'

interface Reuniao {
  id: number
  empresa: string
  contato: string
  cargo: string
  campanha: string
  campanha_id: string
  data: string
  hora: string
  modalidade: string
  vendedor: string
  icp: number
  status: 'Confirmada' | 'Pendente' | 'Realizada' | 'Não compareceu'
  link: string
  agente: string
  sinais: string[]
  sugestao: string
  // Dados cadastrais do contato
  nome?: string
  telefone?: string
  email?: string
  cnpj?: string
  segmento?: string
  cidade?: string
  estado?: string
  endereco?: string
  // Dados da ligação de agendamento
  resumo_ligacao?: string
  duracao_ligacao?: string
  // Jornada (preenchida pelo vendedor)
  etapa?: string
  valor_oportunidade?: string
  nota?: string
  resultado?: string
}

interface EmailVendedor {
  id: number
  empresa: string
  contato: string
  email: string
  campanha: string
  origem: 'ligacao' | 'nao_atendeu' | 'followup' | 'manual'
  template: string
  hora: string
  status: 'Pendente' | 'Enviado' | 'Clicado' | 'Falhou'
  vendedor: string
}

interface MensagemChat {
  id: number
  de: string
  para: string
  texto: string
  hora: string
  lida: boolean
  tipo: 'recebida' | 'enviada'
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const HOJE = new Date().toLocaleDateString('pt-BR')


const mockEmails: EmailVendedor[] = [
  {
    id: 1,
    empresa: 'Acme Corp',
    contato: 'Pedro Alves',
    email: 'pedro@acme.com',
    campanha: 'Campanha SP',
    origem: 'ligacao',
    template: 'Follow-up Pós-Reunião',
    hora: '24/05 08:30',
    status: 'Pendente',
    vendedor: 'João Silva',
  },
  {
    id: 2,
    empresa: 'TechVision',
    contato: 'Carla Lima',
    email: 'carla@techvision.com',
    campanha: 'Campanha SP',
    origem: 'followup',
    template: 'Proposta Comercial',
    hora: '23/05 16:00',
    status: 'Enviado',
    vendedor: 'João Silva',
  },
  {
    id: 3,
    empresa: 'DataSoft',
    contato: 'Rafael Porto',
    email: 'rafael@datasoft.com',
    campanha: 'Campanha SP',
    origem: 'ligacao',
    template: 'Proposta + Caso de Sucesso',
    hora: '23/05 17:00',
    status: 'Clicado',
    vendedor: 'João Silva',
  },
  {
    id: 4,
    empresa: 'InnovaB2B',
    contato: 'Mariana Costa',
    email: 'mariana@innovab2b.com',
    campanha: 'Campanha SP',
    origem: 'nao_atendeu',
    template: 'Follow-up Não Atendeu',
    hora: '22/05 11:00',
    status: 'Pendente',
    vendedor: 'João Silva',
  },
  {
    id: 5,
    empresa: 'VarseGroup',
    contato: 'Beatriz Souza',
    email: 'beatriz@varse.com',
    campanha: 'Campanha SP',
    origem: 'nao_atendeu',
    template: 'No-show — Reagendamento',
    hora: '22/05 15:30',
    status: 'Enviado',
    vendedor: 'João Silva',
  },
  {
    id: 6,
    empresa: 'FinanceGroup',
    contato: 'Alexandre Nunes',
    email: 'alex@financegroup.com',
    campanha: 'Campanha SP',
    origem: 'manual',
    template: 'Material Comercial',
    hora: '21/05 14:00',
    status: 'Pendente',
    vendedor: 'João Silva',
  },
]


// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length === 0) return '--'
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const sinaisBadgeColor: Record<string, string> = {
  urgência: 'bg-red-100 text-red-700',
  proposta: 'bg-blue-100 text-blue-700',
  decisor: 'bg-gray-100 text-gray-700',
  preço: 'bg-amber-100 text-amber-700',
  humano: 'bg-blue-100 text-blue-700',
  demo: 'bg-purple-100 text-purple-700',
  técnico: 'bg-gray-100 text-gray-600',
  concorrente: 'bg-orange-100 text-orange-700',
}

function icpBadgeColor(icp: number): string {
  if (icp > 70) return 'bg-green-100 text-green-700'
  if (icp >= 50) return 'bg-amber-100 text-amber-700'
  return 'bg-red-100 text-red-700'
}

// ─── KpiCard ──────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  color,
  id,
}: {
  label: string
  value: string | number
  sub: string
  color: string
  id?: string
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4" id={id}>
      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">{label}</div>
      <div className={`text-2xl font-bold font-mono ${color}`}>{value}</div>
      <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
    </div>
  )
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Reuniao['status'] }) {
  const map: Record<Reuniao['status'], string> = {
    Confirmada: 'bg-green-100 text-green-700',
    Pendente: 'bg-amber-100 text-amber-700',
    Realizada: 'bg-blue-100 text-blue-700',
    'Não compareceu': 'bg-red-100 text-red-700',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[status]}`}>{status}</span>
  )
}

// ─── TabAgenda ────────────────────────────────────────────────────────────────

function TabAgenda({
  reunioes,
  setReunioes,
  onVerFicha,
  onVerResultado,
  onVerJornada,
}: {
  reunioes: Reuniao[]
  setReunioes: React.Dispatch<React.SetStateAction<Reuniao[]>>
  onVerFicha: (r: Reuniao) => void
  onVerResultado: (r: Reuniao) => void
  onVerJornada: (r: Reuniao) => void
}) {
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [reagendandoId, setReagendandoId] = useState<number | null>(null)
  const [novaData, setNovaData] = useState('')
  const [novaHora, setNovaHora] = useState('')

  const reunioesFiltradas = reunioes.filter((r) => {
    if (filtroStatus === 'todos') return true
    return r.status === filtroStatus
  })

  const hoje = reunioes.filter((r) => r.data === HOJE)
  const confirmadas = reunioes.filter((r) => r.status === 'Confirmada')
  const realizadas = reunioes.filter((r) => r.status === 'Realizada')
  const showRate =
    realizadas.length + confirmadas.length > 0
      ? Math.round((realizadas.length / (realizadas.length + confirmadas.length)) * 100) + '%'
      : '—'

  function confirmar(id: number) {
    setReunioes((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'Confirmada' as const } : r))
    )
    reunioesApi.update(String(id), { status: 'confirmada' }).catch(console.error)
  }

  function salvarReagendamento(id: number) {
    const r = reunioes.find((r) => r.id === id)
    const dataFinal = novaData || (r?.data ?? '')
    const horaFinal = novaHora || (r?.hora ?? '')
    setReunioes((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, data: dataFinal, hora: horaFinal } : r
      )
    )
    reunioesApi.update(String(id), { data: dataFinal, hora: horaFinal, status: 'remarcada' }).catch(console.error)
    setReagendandoId(null)
    setNovaData('')
    setNovaHora('')
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <KpiCard
          label="Reuniões hoje"
          value={hoje.length}
          sub="agendadas pela IA"
          color="text-gray-900"
          id="v-kpi-hoje"
        />
        <KpiCard
          label="Confirmadas"
          value={confirmadas.length}
          sub="aguardando reunião"
          color="text-green-600"
          id="v-kpi-confirmadas"
        />
        <KpiCard
          label="Realizadas"
          value={realizadas.length}
          sub="com resultado registrado"
          color="text-blue-600"
          id="v-kpi-realizadas"
        />
        <KpiCard
          label="Show-rate"
          value={showRate}
          sub="% que compareceram"
          color="text-purple-600"
          id="v-kpi-showrate"
        />
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">Minhas reuniões</h2>
          <select
            id="v-filtro-status"
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="text-xs border border-gray-200 rounded-md px-2 py-1.5 text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="todos">Todos os status</option>
            <option value="Confirmada">Confirmada</option>
            <option value="Realizada">Realizada</option>
            <option value="Não compareceu">Não compareceu</option>
          </select>
        </div>

        <div id="v-reunioes-lista" className="divide-y divide-gray-100">
          {reunioesFiltradas.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <Calendar size={32} className="mx-auto mb-3 opacity-40" />
              <div className="text-sm font-medium">Nenhuma reunião encontrada</div>
              <div className="text-xs mt-1">Tente ajustar os filtros</div>
            </div>
          ) : (
            reunioesFiltradas.map((r) => (
              <div key={r.id} className="px-5 py-4 space-y-3">
                {/* Row 1: empresa + status */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{r.empresa}</div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                      <User size={11} />
                      <span>
                        {r.contato} · {r.cargo}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={r.status} />
                </div>

                {/* Row 2: data/hora + modalidade + ICP */}
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar size={11} />
                    <span>{r.data}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock size={11} />
                    <span>{r.hora}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    {r.modalidade === 'Google Meet' ? (
                      <Video size={11} />
                    ) : (
                      <MapPin size={11} />
                    )}
                    <span>{r.modalidade}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${icpBadgeColor(r.icp)}`}>
                    ICP {r.icp}
                  </span>
                  {r.status === 'Confirmada' && (
                    <span className="text-[10px] text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full">
                      {r.data === HOJE ? `em breve · ${r.hora}` : `agendada · ${r.data}`}
                    </span>
                  )}
                </div>

                {/* Row 3: sinais */}
                {r.sinais.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {r.sinais.map((s) => (
                      <span
                        key={s}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${sinaisBadgeColor[s] ?? 'bg-gray-100 text-gray-600'}`}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                {/* Row 4: link + ações */}
                <div className="flex items-center gap-2 flex-wrap">
                  {r.link && (
                    <a
                      href={`https://${r.link}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <ExternalLink size={11} />
                      Entrar na reunião
                    </a>
                  )}
                  <button
                    onClick={() => onVerFicha(r)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <FileText size={11} />
                    Ver ficha
                  </button>
                  <button
                    onClick={() => onVerJornada(r)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-brand-300 rounded-md text-brand-700 bg-brand-50 hover:bg-brand-100 transition-colors"
                  >
                    📋 Jornada
                  </button>
                  {r.status === 'Pendente' && (
                    <button
                      onClick={() => confirmar(r.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-green-300 text-green-700 rounded-md hover:bg-green-50 transition-colors"
                    >
                      <Check size={11} />
                      Confirmar
                    </button>
                  )}
                  <button
                    onClick={() =>
                      setReagendandoId(reagendandoId === r.id ? null : r.id)
                    }
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Calendar size={11} />
                    Reagendar
                  </button>
                  <button
                    onClick={() => onVerResultado(r)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <ClipboardCheck size={11} />
                    Resultado
                  </button>
                </div>

                {/* Inline reagendamento */}
                {reagendandoId === r.id && (
                  <div className="bg-gray-50 rounded-md p-3 flex items-center gap-3 flex-wrap border border-gray-200">
                    <label className="text-xs font-medium text-gray-600">Nova data:</label>
                    <input
                      type="date"
                      value={novaData}
                      onChange={(e) => setNovaData(e.target.value)}
                      className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <label className="text-xs font-medium text-gray-600">Horário:</label>
                    <input
                      type="time"
                      value={novaHora}
                      onChange={(e) => setNovaHora(e.target.value)}
                      className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => salvarReagendamento(r.id)}
                      className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Salvar
                    </button>
                    <button
                      onClick={() => setReagendandoId(null)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X size={13} />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// ─── TabFicha ─────────────────────────────────────────────────────────────────

function TabFicha({
  fichaData,
  emails,
}: {
  fichaData: Reuniao | null
  emails: EmailVendedor[]
}) {
  const [copied, setCopied] = useState(false)
  const navigate = useNavigate()

  if (!fichaData) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <FileText size={40} className="text-gray-300 mb-4" />
        <h3 className="text-base font-semibold text-gray-700 mb-1">Selecione uma reunião para ver a ficha</h3>
        <p className="text-sm text-gray-400 max-w-sm">
          Clique em "Ver ficha" em qualquer reunião da aba Agenda para ver os dados completos do contato
        </p>
      </div>
    )
  }

  const ini = initials(fichaData.contato)
  const emailPendente = emails.find(
    (e) => e.empresa === fichaData.empresa && e.status === 'Pendente'
  )

  function copyLink() {
    navigator.clipboard.writeText(fichaData!.link).catch(() => null)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Coluna esquerda — Dados do Contato */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Dados do Contato</h3>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-base shrink-0">
              {ini}
            </div>
            <div>
              <div className="font-semibold text-gray-900">{fichaData.contato}</div>
              <div className="text-xs text-gray-500">{fichaData.cargo}</div>
              <div className="text-xs text-gray-500">{fichaData.empresa}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="text-gray-400 uppercase text-[10px] font-bold tracking-wide mb-0.5">Campanha</div>
              <div className="font-medium text-gray-800">{fichaData.campanha}</div>
            </div>
            <div>
              <div className="text-gray-400 uppercase text-[10px] font-bold tracking-wide mb-0.5">Agente IA</div>
              <div className="font-medium text-gray-800">{fichaData.agente}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wide">ICP Score</span>
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${icpBadgeColor(fichaData.icp)}`}>
              {fichaData.icp}
            </span>
            <span className="text-xs text-gray-400">/ 95</span>
          </div>

          <hr className="border-gray-100" />

          <div className="flex gap-3">
            <button
              onClick={() => window.open('tel:' + (fichaData?.telefone || ''), '_blank')}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors"
            >
              <Phone size={13} />
              Ligar
            </button>
            <button
              onClick={() => navigate('/email', { state: { contato: fichaData?.email || fichaData?.nome } })}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors"
            >
              <Mail size={13} />
              E-mail
            </button>
            <button
              onClick={() => { const nome = fichaData?.nome || fichaData?.contato || ''; window.open('https://www.linkedin.com/search/results/people/?keywords=' + encodeURIComponent(nome), '_blank') }}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors"
            >
              <ExternalLink size={13} />
              LinkedIn
            </button>
          </div>
        </div>

        {/* Coluna direita — Detalhes da Reunião */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Detalhes da Reunião</h3>

          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar size={13} className="text-gray-400 shrink-0" />
              <span>{fichaData.data}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock size={13} className="text-gray-400 shrink-0" />
              <span>{fichaData.hora}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              {fichaData.modalidade === 'Google Meet' ? (
                <Video size={13} className="text-gray-400 shrink-0" />
              ) : (
                <MapPin size={13} className="text-gray-400 shrink-0" />
              )}
              <span>{fichaData.modalidade}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <User size={13} className="text-gray-400 shrink-0" />
              <span>{fichaData.vendedor}</span>
            </div>
          </div>

          {fichaData.link && (
            <div className="rounded-md bg-blue-50 border border-blue-100 p-3">
              <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wide mb-1">Link da reunião</div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-blue-700 break-all flex-1">{fichaData.link}</span>
                <button
                  onClick={copyLink}
                  className="shrink-0 p-1 text-blue-500 hover:text-blue-700 transition-colors"
                  title="Copiar link"
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                </button>
              </div>
            </div>
          )}

          <hr className="border-gray-100" />

          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-2">
              O que a IA detectou:
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {fichaData.sinais.map((s) => (
                <span
                  key={s}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${sinaisBadgeColor[s] ?? 'bg-gray-100 text-gray-600'}`}
                >
                  {s}
                </span>
              ))}
            </div>
            {fichaData.sugestao && (
              <div className="rounded-md bg-blue-50 border border-blue-100 p-3 flex gap-2">
                <Lightbulb size={14} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800 italic leading-relaxed">{fichaData.sugestao}</p>
              </div>
            )}
          </div>

          {emailPendente && (
            <div className="rounded-md bg-amber-50 border border-amber-200 p-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-amber-800">
                <Mail size={13} />
                <span>E-mail pendente: {emailPendente.template}</span>
              </div>
              <button
                onClick={async () => {
                  try {
                    await emailsApi.enviar({ para: fichaData?.email || '', assunto: 'Follow-up: ' + (fichaData?.empresa || ''), corpo: 'Olá, tudo bem?' })
                    alert('E-mail enviado!')
                  } catch(e: unknown) { alert('Erro ao enviar: ' + (e as Error).message) }
                }}
                className="flex items-center gap-1 px-3 py-1 text-xs font-medium bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors"
              >
                <Send size={11} />
                Enviar agora
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── TabResultados ────────────────────────────────────────────────────────────

interface ResultadoRegistrado {
  reuniaoId: number
  empresa: string
  contato: string
  data: string
  tipo: TipoResultado
}

function TabResultados({
  reunioes,
  resultadoReuniao,
  setResultadoReuniao,
}: {
  reunioes: Reuniao[]
  resultadoReuniao: Reuniao | null
  setResultadoReuniao: (r: Reuniao | null) => void
}) {
  const [tipoResultado, setTipoResultado] = useState<TipoResultado | null>(null)
  const [registrados, setRegistrados] = useState<ResultadoRegistrado[]>([])
  const [toast, setToast] = useState(false)

  // form fields
  const [proximoPasso, setProximoPasso] = useState('')
  const [obs, setObs] = useState('')
  const [qualificacao, setQualificacao] = useState('')
  const [acaoNoShow, setAcaoNoShow] = useState('')
  const [novaDataRemar, setNovaDataRemar] = useState('')
  const [novaHoraRemar, setNovaHoraRemar] = useState('')
  const [motivoAdiamento, setMotivoAdiamento] = useState('')
  const [motivoPerda, setMotivoPerda] = useState('')
  const [feedbackPerda, setFeedbackPerda] = useState('')

  const tiposResultado: { key: TipoResultado; label: string; color: string; activeColor: string }[] = [
    { key: 'realizada', label: '✅ Reunião realizada', color: 'border-green-200 text-green-700 hover:bg-green-50', activeColor: 'bg-green-100 border-green-400 text-green-800' },
    { key: 'nao_compareceu', label: '❌ Não compareceu', color: 'border-red-200 text-red-700 hover:bg-red-50', activeColor: 'bg-red-100 border-red-400 text-red-800' },
    { key: 'remarcou', label: '📅 Remarcou', color: 'border-blue-200 text-blue-700 hover:bg-blue-50', activeColor: 'bg-blue-100 border-blue-400 text-blue-800' },
    { key: 'perdeu', label: '📉 Perdeu', color: 'border-gray-200 text-gray-700 hover:bg-gray-50', activeColor: 'bg-gray-100 border-gray-400 text-gray-800' },
  ]

  const registradosIds = new Set(registrados.map((r) => r.reuniaoId))

  function registrar() {
    if (!resultadoReuniao || !tipoResultado) return
    setRegistrados((prev) => [
      ...prev,
      {
        reuniaoId: resultadoReuniao.id,
        empresa: resultadoReuniao.empresa,
        contato: resultadoReuniao.contato,
        data: resultadoReuniao.data,
        tipo: tipoResultado,
      },
    ])
    reunioesApi.update(String(resultadoReuniao.id), {
      resultado: tipoResultado,
      proximo_passo: proximoPasso,
      observacoes: obs,
      motivo_perda: motivoPerda || undefined,
    }).catch(console.error)
    setResultadoReuniao(null)
    setTipoResultado(null)
    setObs('')
    setProximoPasso('')
    setQualificacao('')
    setAcaoNoShow('')
    setNovaDataRemar('')
    setNovaHoraRemar('')
    setMotivoAdiamento('')
    setMotivoPerda('')
    setFeedbackPerda('')
    setToast(true)
    setTimeout(() => setToast(false), 3000)
  }

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2">
          <CheckCircle size={15} />
          Resultado registrado com sucesso
        </div>
      )}

      {/* Seleção de reunião */}
      {!resultadoReuniao ? (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-800">Selecione uma reunião para registrar resultado</h2>
            <p className="text-xs text-gray-400 mt-1">
              Ou clique em "Resultado" direto na aba Agenda
            </p>
          </div>
          <div className="divide-y divide-gray-100">
            {reunioes.filter((r) => !registradosIds.has(r.id)).map((r) => (
              <div key={r.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 text-sm">{r.empresa}</div>
                  <div className="text-xs text-gray-500">{r.contato} · {r.data} {r.hora}</div>
                </div>
                <StatusBadge status={r.status} />
                <button
                  onClick={() => setResultadoReuniao(r)}
                  className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Registrar
                </button>
              </div>
            ))}
            {reunioes.filter((r) => !registradosIds.has(r.id)).length === 0 && (
              <div className="py-8 text-center text-sm text-gray-400">
                Todas as reuniões já têm resultado registrado.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200">
          {/* Header da reunião selecionada */}
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <div className="font-semibold text-gray-900">{resultadoReuniao.empresa}</div>
              <div className="text-xs text-gray-500">
                {resultadoReuniao.contato} · {resultadoReuniao.data} {resultadoReuniao.hora}
              </div>
            </div>
            <button
              onClick={() => { setResultadoReuniao(null); setTipoResultado(null) }}
              className="p-1.5 text-gray-400 hover:text-gray-600"
            >
              <X size={15} />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Tipo de resultado */}
            <div>
              <div className="text-xs font-semibold text-gray-600 mb-2">O que aconteceu?</div>
              <div className="grid grid-cols-2 gap-2">
                {tiposResultado.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTipoResultado(t.key)}
                    className={`px-4 py-3 text-sm font-medium border rounded-lg transition-all ${tipoResultado === t.key ? t.activeColor : t.color}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Formulário por tipo */}
            {tipoResultado === 'realizada' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Próximo passo</label>
                  <select
                    value={proximoPasso}
                    onChange={(e) => setProximoPasso(e.target.value)}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Selecione...</option>
                    <option>Enviar proposta</option>
                    <option>Agendar demo</option>
                    <option>Retornar em 7 dias</option>
                    <option>Fechar contrato</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Observações</label>
                  <textarea
                    value={obs}
                    onChange={(e) => setObs(e.target.value)}
                    placeholder="O que aconteceu na reunião?"
                    rows={3}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Qualificação final</label>
                  <select
                    value={qualificacao}
                    onChange={(e) => setQualificacao(e.target.value)}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Selecione...</option>
                    <option>Muito qualificado</option>
                    <option>Qualificado</option>
                    <option>Pouco qualificado</option>
                    <option>Desqualificado</option>
                  </select>
                </div>
              </div>
            )}

            {tipoResultado === 'nao_compareceu' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Ação</label>
                  <select
                    value={acaoNoShow}
                    onChange={(e) => setAcaoNoShow(e.target.value)}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Selecione...</option>
                    <option>Reagendar</option>
                    <option>Tentar ligar</option>
                    <option>Desistir do lead</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Observações</label>
                  <textarea
                    value={obs}
                    onChange={(e) => setObs(e.target.value)}
                    placeholder="Detalhes do não comparecimento..."
                    rows={3}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>
            )}

            {tipoResultado === 'remarcou' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Nova data</label>
                    <input
                      type="date"
                      value={novaDataRemar}
                      onChange={(e) => setNovaDataRemar(e.target.value)}
                      className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Novo horário</label>
                    <input
                      type="time"
                      value={novaHoraRemar}
                      onChange={(e) => setNovaHoraRemar(e.target.value)}
                      className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Motivo do adiamento</label>
                  <textarea
                    value={motivoAdiamento}
                    onChange={(e) => setMotivoAdiamento(e.target.value)}
                    placeholder="Por que foi remarcado?"
                    rows={3}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>
            )}

            {tipoResultado === 'perdeu' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Motivo</label>
                  <select
                    value={motivoPerda}
                    onChange={(e) => setMotivoPerda(e.target.value)}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Selecione...</option>
                    <option>Preço</option>
                    <option>Concorrência</option>
                    <option>Sem orçamento</option>
                    <option>Não era decisor</option>
                    <option>Mudou de ideia</option>
                    <option>Outro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Feedback detalhado</label>
                  <textarea
                    value={feedbackPerda}
                    onChange={(e) => setFeedbackPerda(e.target.value)}
                    placeholder="O que levou à perda do lead?"
                    rows={3}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>
            )}

            {tipoResultado && (
              <button
                onClick={registrar}
                className="w-full bg-blue-600 text-white text-sm font-semibold rounded-md py-2.5 hover:bg-blue-700 transition-colors"
              >
                Registrar resultado
              </button>
            )}
          </div>
        </div>
      )}

      {/* Lista de resultados registrados */}
      {registrados.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Resultados registrados nesta sessão</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {registrados.map((r) => {
              const tipoInfo = tiposResultado.find((t) => t.key === r.tipo)
              return (
                <div key={r.reuniaoId} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 text-sm">{r.empresa}</div>
                    <div className="text-xs text-gray-500">{r.contato} · {r.data}</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${tipoInfo?.activeColor ?? 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                    {tipoInfo?.label ?? r.tipo}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── TabEmail ─────────────────────────────────────────────────────────────────

function TabEmail({ emails, setEmails }: { emails: EmailVendedor[]; setEmails: React.Dispatch<React.SetStateAction<EmailVendedor[]>> }) {
  const [previewId, setPreviewId] = useState<number | null>(null)
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [editCorpo, setEditCorpo] = useState('')
  const [novoAssunto, setNovoAssunto] = useState('')

  const pendentes = emails.filter((e) => e.status === 'Pendente').length
  const enviados = emails.filter((e) => e.status === 'Enviado').length
  const viaLigacao = emails.filter((e) => e.origem === 'ligacao').length
  const naoAtendeu = emails.filter((e) => e.origem === 'nao_atendeu').length

  function enviar(id: number) {
    setEmails((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: 'Enviado' as const } : e))
    )
    const email = emails.find(e => e.id === id)
    if (email) emailsApi.enviar({ para: email.email || email.contato, assunto: email.template, corpo: '' }).catch(console.error)
  }

  function enviarTodos() {
    emails.filter(e => e.status === 'Pendente').forEach(email => {
      emailsApi.enviar({ para: email.email || email.contato, assunto: email.template, corpo: '' }).catch(console.error)
    })
    setEmails((prev) =>
      prev.map((e) => (e.status === 'Pendente' ? { ...e, status: 'Enviado' as const } : e))
    )
  }

  const origemBadge: Record<EmailVendedor['origem'], string> = {
    ligacao: 'bg-blue-100 text-blue-700',
    nao_atendeu: 'bg-amber-100 text-amber-700',
    followup: 'bg-purple-100 text-purple-700',
    manual: 'bg-gray-100 text-gray-700',
  }
  const origemLabel: Record<EmailVendedor['origem'], string> = {
    ligacao: 'Via ligação',
    nao_atendeu: 'Não atendeu',
    followup: 'Follow-up',
    manual: 'Manual',
  }
  const statusBadge: Record<EmailVendedor['status'], string> = {
    Pendente: 'bg-amber-100 text-amber-700',
    Enviado: 'bg-green-100 text-green-700',
    Clicado: 'bg-blue-100 text-blue-700',
    Falhou: 'bg-red-100 text-red-700',
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <KpiCard label="Pendentes" value={pendentes} sub="aguardando envio" color="text-amber-600" id="vemail-kpi-pendentes" />
        <KpiCard label="Enviados" value={enviados} sub="nesta sessão" color="text-green-600" id="vemail-kpi-enviados" />
        <KpiCard label="Via ligação" value={viaLigacao} sub="solicitados durante call" color="text-blue-600" id="vemail-kpi-ligacao" />
        <KpiCard label="Não atendeu" value={naoAtendeu} sub="follow-up automático" color="text-gray-600" id="vemail-kpi-naoaten" />
      </div>

      {/* Modal preview */}
      {previewId !== null && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Preview do e-mail</h3>
              <button onClick={() => setPreviewId(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>
            {(() => {
              const em = emails.find((e) => e.id === previewId)
              if (!em) return null
              return (
                <div className="text-sm text-gray-700 space-y-3">
                  <div><span className="font-semibold">Para:</span> {em.contato} &lt;{em.email}&gt;</div>
                  <div><span className="font-semibold">Assunto:</span> {em.template} — {em.empresa}</div>
                  <hr />
                  <p>Olá {em.contato.split(' ')[0]},</p>
                  <p>Conforme {em.origem === 'ligacao' ? 'nossa conversa de hoje' : 'tentativa de contato recente'}, gostaria de compartilhar como a ETZ pode ajudar {em.empresa} a acelerar prospecção com IA.</p>
                  <p>Fico à disposição para uma conversa rápida. Quando seria um bom momento para você?</p>
                  <p className="text-gray-500 text-xs mt-4">— {em.vendedor}</p>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Meus e-mails de follow-up</h2>
            <p className="text-xs text-gray-400 mt-0.5">E-mails gerados pela IA — revise e envie</p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors">
              <Mail size={12} />
              Nova mensagem
            </button>
            <button
              onClick={enviarTodos}
              disabled={pendentes === 0}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send size={12} />
              Enviar todos pendentes
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Empresa', 'Contato', 'Campanha', 'Origem', 'Template', 'Hora', 'Status', 'Ações'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {emails.map((row) => (
                <>
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{row.empresa}</td>
                    <td className="px-4 py-3 text-gray-600">{row.contato}</td>
                    <td className="px-4 py-3 text-gray-500">{row.campanha}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${origemBadge[row.origem]}`}>
                        {origemLabel[row.origem]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{row.template}</td>
                    <td className="px-4 py-3 text-gray-500">{row.hora}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBadge[row.status]}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {row.status === 'Pendente' && (
                          <button
                            onClick={() => enviar(row.id)}
                            className="flex items-center gap-1 px-2 py-1 border border-blue-200 rounded text-[10px] font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Send size={10} />
                            Enviar
                          </button>
                        )}
                        <button
                          onClick={() => setPreviewId(previewId === row.id ? null : row.id)}
                          className="flex items-center gap-1 px-2 py-1 border border-gray-200 rounded text-[10px] font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          <Eye size={10} />
                          Preview
                        </button>
                        <button
                          onClick={() => {
                            setEditandoId(editandoId === row.id ? null : row.id)
                            setEditCorpo('')
                            setNovoAssunto(row.template)
                          }}
                          className="flex items-center gap-1 px-2 py-1 border border-gray-200 rounded text-[10px] font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          <Pencil size={10} />
                          Editar
                        </button>
                      </div>
                    </td>
                  </tr>
                  {editandoId === row.id && (
                    <tr key={`edit-${row.id}`}>
                      <td colSpan={8} className="px-4 py-3 bg-gray-50">
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={novoAssunto || row.template}
                            onChange={(e) => setNovoAssunto(e.target.value)}
                            placeholder="Assunto"
                            className="w-full border border-gray-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <textarea
                            value={editCorpo}
                            onChange={(e) => setEditCorpo(e.target.value)}
                            placeholder="Corpo do e-mail..."
                            rows={4}
                            className="w-full border border-gray-200 rounded px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEmails(prev => prev.map(e => e.id === editandoId ? {...e, template: novoAssunto || e.template} : e))
                                setEditandoId(null)
                                setNovoAssunto('')
                                setEditCorpo('')
                              }}
                              className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              Salvar
                            </button>
                            <button
                              onClick={() => { setEditandoId(null); setNovoAssunto(''); setEditCorpo('') }}
                              className="px-3 py-1.5 text-xs border border-gray-300 text-gray-600 rounded hover:bg-gray-50"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {emails.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400 text-xs">
                    Nenhum e-mail atribuído a você.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── TabGcal ──────────────────────────────────────────────────────────────────

function TabGcal({ reunioes }: { reunioes: Reuniao[] }) {
  const [gcalConectado, setGcalConectado] = useState(false)
  const [emailGcal, setEmailGcal] = useState('')
  const [diasSelecionados, setDiasSelecionados] = useState([true, true, true, true, true, false])
  const [duracaoPadrao, setDuracaoPadrao] = useState('30 min')
  const [modalidadePreferida, setModalidadePreferida] = useState('Google Meet')

  const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  const slots = [
    { dia: 'Seg, 25/05', hora: '09:00 – 09:30' },
    { dia: 'Seg, 25/05', hora: '14:00 – 14:30' },
    { dia: 'Ter, 26/05', hora: '10:00 – 10:30' },
    { dia: 'Qua, 27/05', hora: '11:00 – 11:30' },
    { dia: 'Qui, 28/05', hora: '15:00 – 15:30' },
  ]

  if (gcalConectado) {
    return (
      <div className="max-w-xl space-y-4">
        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-5 py-4">
          <div className="flex items-center gap-3">
            <CheckCircle size={18} className="text-green-600" />
            <div>
              <div className="text-sm font-semibold text-green-800">
                {emailGcal || 'joao@empresa.com'} conectado
              </div>
              <div className="text-xs text-green-600">Google Calendar autorizado · Reuniões sincronizadas</div>
            </div>
          </div>
          <button
            onClick={async () => {
              try {
                await calendarApi.disconnect()
              } catch(e) { console.error(e) }
              finally { setGcalConectado(false) }
            }}
            className="text-xs text-red-600 border border-red-200 rounded-md px-3 py-1.5 hover:bg-red-50 transition-colors"
          >
            Desconectar
          </button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Próximos slots disponíveis</h3>
          <div className="space-y-2">
            {slots.map((s, i) => (
              <div key={i} className="flex items-center gap-3 text-xs text-gray-600 py-1.5 border-b border-gray-50 last:border-0">
                <Calendar size={12} className="text-gray-400 shrink-0" />
                <span className="font-medium">{s.dia}</span>
                <span className="text-gray-400">{s.hora}</span>
                <span className="ml-auto px-1.5 py-0.5 rounded text-[10px] bg-green-100 text-green-700 font-semibold">
                  Disponível
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Reuniões sincronizadas</h3>
          <div className="space-y-2">
            {reunioes.filter((r) => r.status === 'Confirmada').map((r) => (
              <div key={r.id} className="flex items-center gap-2 text-xs text-gray-600 py-1.5 border-b border-gray-50 last:border-0">
                <Calendar size={12} className="text-gray-400 shrink-0" />
                <span className="font-medium">{r.empresa}</span>
                <span className="text-gray-400">·</span>
                <span>{r.data} {r.hora}</span>
                <span className="ml-auto px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-700 font-semibold">
                  Confirmada
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-xl space-y-4">
      <div>
        <h2 className="text-base font-semibold text-gray-800">Meu Google Calendar</h2>
        <p className="text-sm text-gray-500 mt-1">
          Conecte sua agenda para que a IA agende reuniões nos seus slots livres
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
        <div className="text-sm font-semibold text-gray-800 mb-2">Por que conectar?</div>
        <ul className="space-y-1.5 text-xs text-blue-800">
          <li className="flex items-start gap-1.5">
            <Check size={12} className="mt-0.5 shrink-0 text-blue-600" />
            Slots disponíveis enviados automaticamente ao agendar
          </li>
          <li className="flex items-start gap-1.5">
            <Check size={12} className="mt-0.5 shrink-0 text-blue-600" />
            Reuniões sincronizadas em tempo real
          </li>
          <li className="flex items-start gap-1.5">
            <Check size={12} className="mt-0.5 shrink-0 text-blue-600" />
            Sem conflitos de agenda
          </li>
        </ul>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">E-mail Google</label>
          <input
            type="email"
            value={emailGcal}
            onChange={(e) => setEmailGcal(e.target.value)}
            placeholder="seu@gmail.com ou @suaempresa.com"
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Duração padrão</label>
            <select
              value={duracaoPadrao}
              onChange={(e) => setDuracaoPadrao(e.target.value)}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option>30 min</option>
              <option>45 min</option>
              <option>60 min</option>
              <option>90 min</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Modalidade preferida</label>
            <select
              value={modalidadePreferida}
              onChange={(e) => setModalidadePreferida(e.target.value)}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option>Google Meet</option>
              <option>Presencial</option>
              <option>Ambos</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">Dias disponíveis</label>
          <div className="flex flex-wrap gap-3">
            {dias.map((d, i) => (
              <label key={d} className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={diasSelecionados[i]}
                  onChange={(e) =>
                    setDiasSelecionados((prev) =>
                      prev.map((v, idx) => (idx === i ? e.target.checked : v))
                    )
                  }
                  className="rounded accent-blue-600"
                />
                {d}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">Horários</label>
          <div className="flex items-center gap-3">
            <input
              type="time"
              defaultValue="09:00"
              className="border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-xs text-gray-400">até</span>
            <input
              type="time"
              defaultValue="18:00"
              className="border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          onClick={async () => {
            try {
              const jwt = localStorage.getItem('etz_jwt') || ''
              const url = calendarApi.connect(jwt)
              window.location.href = url
            } catch(e) {
              // fallback: simula conexão
              setGcalConectado(true)
            }
          }}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white text-sm font-semibold rounded-md py-2.5 hover:bg-blue-700 transition-colors"
        >
          <ExternalLink size={14} />
          Autorizar com Google
        </button>
      </div>
    </div>
  )
}

// ─── TabMensagens ─────────────────────────────────────────────────────────────

function TabMensagens({
  mensagens,
  setMensagens,
}: {
  mensagens: MensagemChat[]
  setMensagens: React.Dispatch<React.SetStateAction<MensagemChat[]>>
}) {
  const [subTab, setSubTab] = useState<MsgSubTab>('recebidas')
  const [mensagemAbertaId, setMensagemAbertaId] = useState<number | null>(null)
  const [resposta, setResposta] = useState('')
  const [modalNova, setModalNova] = useState(false)
  const [novaDestinatario, setNovaDestinatario] = useState('')
  const [novaTexto, setNovaTexto] = useState('')

  // Fix 3 — Dropdown destinatário via equipeApi
  const { data: equipe = [] } = useQuery({
    queryKey: ['equipe'],
    queryFn: () => equipeApi.list().then(r => r.data as any[]),
  })

  const recebidas = mensagens.filter((m) => m.tipo === 'recebida')
  const enviadas = mensagens.filter((m) => m.tipo === 'enviada')
  const naoLidas = recebidas.filter((m) => !m.lida).length

  function abrirMensagem(id: number) {
    setMensagemAbertaId(id)
    setMensagens((prev) =>
      prev.map((m) => (m.id === id ? { ...m, lida: true } : m))
    )
  }

  function enviarResposta() {
    const aberta = mensagens.find((m) => m.id === mensagemAbertaId)
    if (!aberta || !resposta.trim()) return
    const nova: MensagemChat = {
      id: Date.now(),
      de: 'João Silva',
      para: aberta.de,
      texto: resposta,
      hora: 'Agora',
      lida: true,
      tipo: 'enviada',
    }
    setMensagens((prev) => [...prev, nova])
    emailsApi.enviar({ para: aberta.de, assunto: 'Resposta interna', corpo: resposta }).catch(console.error)
    setResposta('')
  }

  function enviarNova() {
    if (!novaDestinatario || !novaTexto.trim()) return
    const nova: MensagemChat = {
      id: Date.now(),
      de: 'João Silva',
      para: novaDestinatario,
      texto: novaTexto,
      hora: 'Agora',
      lida: true,
      tipo: 'enviada',
    }
    setMensagens((prev) => [...prev, nova])
    setModalNova(false)
    setNovaDestinatario('')
    setNovaTexto('')
  }

  const mensagemAberta = mensagens.find((m) => m.id === mensagemAbertaId)

  return (
    <div className="space-y-4">
      {/* Modal nova mensagem */}
      {modalNova && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Nova mensagem</h3>
              <button onClick={() => setModalNova(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Destinatário</label>
              <select
                value={novaDestinatario}
                onChange={(e) => setNovaDestinatario(e.target.value)}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Selecione...</option>
                {equipe.length > 0
                  ? equipe.map((m: any) => <option key={m.id} value={m.nome ?? m.name}>{m.nome ?? m.name}</option>)
                  : (<>
                      <option>Ana Rodrigues</option>
                      <option>Admin Demo</option>
                    </>)
                }
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Mensagem</label>
              <textarea
                value={novaTexto}
                onChange={(e) => setNovaTexto(e.target.value)}
                rows={4}
                placeholder="Digite sua mensagem..."
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={enviarNova}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Send size={13} />
                Enviar
              </button>
              <button
                onClick={() => setModalNova(false)}
                className="px-4 py-2 text-sm font-medium border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <KpiCard label="Não lidas" value={naoLidas} sub="aguardando leitura" color="text-blue-600" id="vmsg-kpi-naoLidas" />
        <KpiCard label="Recebidas" value={recebidas.length} sub="total recebidas" color="text-gray-600" id="vmsg-kpi-recebidas" />
        <KpiCard label="Enviadas" value={mensagens.filter((m) => m.tipo === 'enviada').length} sub="mensagens enviadas" color="text-green-600" id="vmsg-kpi-enviadas" />
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Mensagens da equipe</h2>
            <p className="text-xs text-gray-400 mt-0.5">Comunicação direta com gerência e administração</p>
          </div>
          <button
            onClick={() => setModalNova(true)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Mail size={12} />
            Nova mensagem
          </button>
        </div>

        <div className="flex border-b border-gray-100 px-5">
          {(['recebidas', 'enviadas'] as MsgSubTab[]).map((t) => (
            <button
              key={t}
              id={`vmsg-tab-${t}`}
              onClick={() => { setSubTab(t); setMensagemAbertaId(null) }}
              className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
                subTab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'recebidas' ? `📥 Recebidas${naoLidas > 0 ? ` (${naoLidas})` : ''}` : '📤 Enviadas'}
            </button>
          ))}
        </div>

        <div className={`grid ${mensagemAbertaId ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {/* Lista */}
          <div className="divide-y divide-gray-100">
            {(subTab === 'recebidas' ? recebidas : enviadas).map((m) => (
              <div
                key={m.id}
                onClick={() => abrirMensagem(m.id)}
                className={`flex items-start gap-3 px-5 py-4 hover:bg-gray-50 cursor-pointer transition-colors ${mensagemAbertaId === m.id ? 'bg-blue-50' : ''}`}
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
                  {initials(m.tipo === 'recebida' ? m.de : m.para)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold ${!m.lida ? 'text-gray-900' : 'text-gray-600'}`}>
                      {m.tipo === 'recebida' ? m.de : `Para: ${m.para}`}
                    </span>
                    <span className="text-[10px] text-gray-400">{m.hora}</span>
                  </div>
                  <p className={`text-xs mt-0.5 truncate ${!m.lida ? 'text-gray-700' : 'text-gray-400'}`}>
                    {m.texto}
                  </p>
                  {!m.lida && (
                    <span className="mt-1 inline-block px-1.5 py-0.5 text-[9px] font-bold bg-blue-600 text-white rounded-full">
                      Nova
                    </span>
                  )}
                </div>
              </div>
            ))}
            {(subTab === 'recebidas' ? recebidas : enviadas).length === 0 && (
              <div className="py-12 text-center text-sm text-gray-400">
                <MessageSquare size={24} className="mx-auto mb-2 opacity-30" />
                Nenhuma mensagem
              </div>
            )}
          </div>

          {/* Painel de leitura */}
          {mensagemAberta && (
            <div className="border-l border-gray-100 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{mensagemAberta.de}</div>
                  <div className="text-xs text-gray-400">{mensagemAberta.hora}</div>
                </div>
                <button
                  onClick={() => setMensagemAbertaId(null)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{mensagemAberta.texto}</p>
              {mensagemAberta.tipo === 'recebida' && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={resposta}
                    onChange={(e) => setResposta(e.target.value)}
                    placeholder="Responder..."
                    className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    onKeyDown={(e) => { if (e.key === 'Enter') enviarResposta() }}
                  />
                  <button
                    onClick={enviarResposta}
                    className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Send size={13} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── TabWhatsApp ──────────────────────────────────────────────────────────────

function TabWhatsApp() {
  const [tela, setTela] = useState<'carregando' | 'conectado' | 'desconectado' | 'conectando' | 'erro'>('carregando')
  const [qr, setQr] = useState<string | null>(null)
  const [erro, setErro] = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  async function verificarStatus() {
    try {
      const r = await fetch(`${API}/equipe/meu-perfil/whatsapp/status`, { headers: authHeader() })
      if (r.status === 404) { setTela('desconectado'); return }
      const data = await r.json()
      if (data.conectado || data.whatsapp_status === 'conectado') setTela('conectado')
      else setTela('desconectado')
    } catch { setTela('desconectado') }
  }

  async function conectar() {
    setTela('conectando'); setErro(''); setQr(null)
    try {
      const r = await fetch(`${API}/equipe/meu-perfil/whatsapp/conectar`, { method: 'POST', headers: authHeader() })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Erro ao gerar QR Code')
      setQr(data.qr)
      pollRef.current = setInterval(async () => {
        const sr = await fetch(`${API}/equipe/meu-perfil/whatsapp/status`, { headers: authHeader() })
        const sd = await sr.json()
        if (sd.conectado || sd.whatsapp_status === 'conectado') { clearInterval(pollRef.current!); setTela('conectado') }
      }, 3000)
    } catch (e: unknown) { setErro((e as Error).message); setTela('erro') }
  }

  useEffect(() => { verificarStatus(); return () => { if (pollRef.current) clearInterval(pollRef.current) } }, [])

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <div className="flex items-center gap-2 mb-6">
          <MessageCircle size={20} className="text-green-600" />
          <h2 className="font-semibold text-gray-900 text-base">Meu WhatsApp</h2>
        </div>
        {tela === 'carregando' && (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Verificando status...</p>
          </div>
        )}
        {tela === 'conectado' && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Wifi size={28} className="text-green-600" />
            </div>
            <p className="font-semibold text-gray-900">WhatsApp conectado!</p>
            <p className="text-sm text-gray-500 text-center">Você receberá notificações de agendamentos e os clientes receberão mensagens do seu número pessoal.</p>
            <button onClick={conectar} className="mt-2 text-xs text-gray-400 hover:text-gray-600 underline">Reconectar com outro número</button>
          </div>
        )}
        {tela === 'desconectado' && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <WifiOff size={28} className="text-gray-400" />
            </div>
            <p className="font-semibold text-gray-700">WhatsApp não conectado</p>
            <p className="text-sm text-gray-500 text-center">Conecte seu WhatsApp pessoal para receber notificações de reuniões e enviar confirmações para clientes.</p>
            <button onClick={conectar} className="mt-2 px-6 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2">
              <MessageCircle size={16} />Conectar meu WhatsApp
            </button>
          </div>
        )}
        {tela === 'conectando' && (
          !qr ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Gerando QR Code...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <p className="text-sm text-gray-600 text-center">Abra o WhatsApp → <em>Dispositivos conectados</em> → <em>Conectar dispositivo</em> e escaneie:</p>
              <img src={qr} alt="QR Code" className="w-56 h-56 rounded-xl border border-gray-200" />
              <div className="flex items-center gap-2 text-xs text-gray-400"><RefreshCw size={12} className="animate-spin" />Aguardando leitura...</div>
            </div>
          )
        )}
        {tela === 'erro' && (
          <div className="flex flex-col items-center gap-4 py-4">
            <WifiOff size={28} className="text-red-500" />
            <p className="text-sm text-red-600 text-center">{erro}</p>
            <button onClick={conectar} className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">Tentar novamente</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VendedorPageRestrita() {
  const { currentProfile } = useProfile()
  const nomeVendedor = currentProfile.nome

  const { data: rawReunioes = [] } = useQuery({
    queryKey: ['reunioes'],
    queryFn: () => reunioesApi.list().then(r => r.data as any[]),
  })

  const reunioesReais: Reuniao[] = rawReunioes.map(r => ({
    id: r.id ?? 0,
    empresa: r.empresa_nome ?? r.empresa ?? '',
    contato: r.contato_nome ?? r.contato ?? '',
    cargo: r.cargo ?? '',
    campanha: r.campanha_nome ?? r.campanha ?? '',
    campanha_id: r.campanha_id ?? '',
    data: r.inicio ? new Date(r.inicio).toLocaleDateString('pt-BR') : '',
    hora: r.inicio ? new Date(r.inicio).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}) : '',
    modalidade: r.modalidade ?? 'online',
    vendedor: r.vendedor_nome ?? r.vendedor ?? '',
    icp: r.icp ?? 0,
    status: r.status ?? 'Pendente',
    link: r.meet_link ?? r.link ?? '',
    agente: r.agente_nome ?? r.agente ?? '',
    sinais: r.sinais ?? [],
    sugestao: r.sugestao ?? '',
    // Dados cadastrais
    telefone: r.telefone ?? r.contatos?.telefone ?? '',
    email: r.email ?? r.contatos?.email ?? '',
    cnpj: r.cnpj ?? r.contatos?.cnpj ?? '',
    segmento: r.segmento ?? r.contatos?.ramo_atividade ?? '',
    cidade: r.cidade ?? r.contatos?.cidade ?? '',
    estado: r.estado ?? r.contatos?.estado ?? '',
    endereco: r.endereco ?? r.contatos?.endereco ?? '',
    // Dados da ligação de agendamento
    resumo_ligacao: r.resumo_ligacao ?? r.resumo ?? '',
    duracao_ligacao: r.duracao_ligacao ?? (r.duracao_segundos ? `${Math.floor(r.duracao_segundos/60)}m${String(r.duracao_segundos%60).padStart(2,'0')}s` : ''),
    // Jornada
    etapa: r.etapa ?? '',
    valor_oportunidade: r.valor_oportunidade ?? '',
    nota: r.nota ?? '',
    resultado: r.resultado ?? '',
  }))

  const [tab, setTab] = useState<VTab>('agenda')
  const [fichaData, setFichaData] = useState<Reuniao | null>(null)
  const [resultadoReuniao, setResultadoReuniao] = useState<Reuniao | null>(null)
  const [reunioes, setReunioes] = useState<Reuniao[]>([])

  // Modal Jornada — editável pelo vendedor
  const [modalJornada, setModalJornada] = useState<Reuniao | null>(null)
  const [jornadaEtapa, setJornadaEtapa] = useState('')
  const [jornadaValor, setJornadaValor] = useState('')
  const [jornadaNota, setJornadaNota] = useState('')
  const [jornadaSalvando, setJornadaSalvando] = useState(false)
  const [jornadaToast, setJornadaToast] = useState(false)

  function abrirJornada(r: Reuniao) {
    setModalJornada(r)
    setJornadaEtapa((r as any).etapa ?? 'agendado')
    setJornadaValor((r as any).valor_oportunidade ?? '')
    setJornadaNota((r as any).nota ?? '')
  }

  async function salvarJornada() {
    if (!modalJornada) return
    setJornadaSalvando(true)
    try {
      await reunioesApi.update(String(modalJornada.id), {
        etapa: jornadaEtapa,
        valor_oportunidade: jornadaValor,
        nota: jornadaNota,
        resultado: modalJornada.resultado || undefined,
      })
      setJornadaToast(true)
      setTimeout(() => setJornadaToast(false), 3000)
      setModalJornada(null)
    } catch { /* silent */ }
    finally { setJornadaSalvando(false) }
  }

  useEffect(() => {
    setReunioes(reunioesReais)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawReunioes])
  // Emails reais via API
  const { data: emailsApiData = [] } = useQuery({
    queryKey: ['emails-vendedor'],
    queryFn: () => emailsApi.enviados().then(r => (r.data as any[]).map((e): EmailVendedor => ({
      id: e.id,
      empresa: e.empresa ?? '',
      contato: e.contato ?? '',
      email: e.para ?? '',
      campanha: e.campanha ?? '',
      origem: (e.origem ?? 'manual') as EmailVendedor['origem'],
      template: e.assunto ?? '(sem assunto)',
      hora: e.criado_em ?? '',
      status: (e.lido ? 'Enviado' : e.status ?? 'Pendente') as EmailVendedor['status'],
      vendedor: e.vendedor ?? nomeVendedor,
    }))),
  })
  const mockEmailsFallback = useMemo(
    () => mockEmails.filter(e => e.vendedor === nomeVendedor),
    [nomeVendedor]
  )
  const [emails, setEmails] = useState<EmailVendedor[]>([])
  useEffect(() => {
    if (emailsApiData.length > 0) {
      setEmails(emailsApiData)
    } else if (emails.length === 0) {
      setEmails(mockEmailsFallback)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailsApiData])

  // Fix 2 — mensagens: estado vazio (sem mock como estado inicial)
  const [mensagens, setMensagens] = useState<MensagemChat[]>([])

  // Computed badges
  const reunioesHoje = reunioes.filter((r) => r.data === HOJE).length
  const emailsPendentes = emails.filter((e) => e.status === 'Pendente').length
  const msgNaoLidas = mensagens.filter((m) => m.tipo === 'recebida' && !m.lida).length

  function handleVerFicha(r: Reuniao) {
    setFichaData(r)
    setTab('ficha')
  }

  function handleVerResultado(r: Reuniao) {
    setResultadoReuniao(r)
    setTab('resultados')
  }

  type TabConfig = {
    id: VTab
    label: string
    icon: React.ReactNode
    badge?: number
    badgeId?: string
  }

  const tabsConfig: TabConfig[] = [
    { id: 'agenda', label: 'Agenda', icon: <Calendar size={14} />, badge: reunioesHoje > 0 ? reunioesHoje : undefined },
    { id: 'ficha', label: 'Ficha', icon: <FileText size={14} /> },
    { id: 'resultados', label: 'Resultados', icon: <ClipboardCheck size={14} /> },
    { id: 'email', label: 'E-mail', icon: <Mail size={14} />, badge: emailsPendentes > 0 ? emailsPendentes : undefined, badgeId: 'vtab-email-badge' },
    { id: 'gcal', label: 'Google Cal', icon: <CalendarDays size={14} /> },
    { id: 'mensagens', label: 'Mensagens', icon: <MessageSquare size={14} />, badge: msgNaoLidas > 0 ? msgNaoLidas : undefined, badgeId: 'vtab-mensagens-badge' },
    { id: 'whatsapp', label: 'Meu WhatsApp', icon: <MessageCircle size={14} /> },
  ]

  const ETAPAS_JORNADA = [
    { id: 'qualificado',  label: 'Qualificado',     icon: '✅' },
    { id: 'agendado',     label: 'Agendado',         icon: '📅' },
    { id: 'realizado',    label: 'Realizado',        icon: '🤝' },
    { id: 'negociacao',   label: 'Negociação',       icon: '💬' },
    { id: 'proposta',     label: 'Proposta enviada', icon: '📋' },
    { id: 'fechado',      label: 'Fechado',          icon: '🏆' },
    { id: 'perdido',      label: 'Perdido',          icon: '❌' },
  ]

  return (
    <div className="p-6 space-y-5 animate-fade-in">

      {/* Toast jornada salva */}
      {jornadaToast && (
        <div className="fixed top-4 right-4 z-50 bg-brand-600 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2">
          ✓ Jornada atualizada com sucesso
        </div>
      )}

      {/* Modal Jornada — editável pelo vendedor */}
      {modalJornada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setModalJornada(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Jornada do Cliente — {modalJornada.empresa}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{modalJornada.contato} · {modalJornada.data} às {modalJornada.hora}</p>
              </div>
              <button onClick={() => setModalJornada(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">

              {/* ── DADOS COMPLETOS DO CLIENTE ── */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Dados do cliente</h3>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="text-2xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Contato</div>
                    <div className="text-sm font-bold text-gray-900">{modalJornada.contato || '—'}</div>
                    {modalJornada.cargo && <div className="text-xs text-brand-600 mt-0.5">{modalJornada.cargo}</div>}
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="text-2xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Empresa</div>
                    <div className="text-sm font-bold text-gray-900">{modalJornada.empresa || '—'}</div>
                    {modalJornada.segmento && <div className="text-xs text-gray-500 mt-0.5">{modalJornada.segmento}</div>}
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="text-2xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Telefone</div>
                    <div className="text-xs font-mono text-gray-800">{modalJornada.telefone || '—'}</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="text-2xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">E-mail</div>
                    <div className="text-xs text-brand-600 truncate">{modalJornada.email || '—'}</div>
                  </div>
                  {modalJornada.cnpj && (
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="text-2xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">CNPJ</div>
                      <div className="text-xs font-mono text-gray-700">{modalJornada.cnpj}</div>
                    </div>
                  )}
                  {(modalJornada.cidade || modalJornada.estado) && (
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="text-2xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Localização</div>
                      <div className="text-xs text-gray-700">{[modalJornada.cidade, modalJornada.estado].filter(Boolean).join(' · ')}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── REUNIÃO ── */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Reunião agendada</h3>
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="text-2xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Data e hora</div>
                    <div className="text-sm font-bold text-gray-900 font-mono">{modalJornada.data} · {modalJornada.hora}</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="text-2xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Modalidade</div>
                    <div className="text-xs font-semibold text-gray-800">
                      {modalJornada.modalidade === 'online' ? '💻 Online' : modalJornada.modalidade === 'presencial' ? '📍 Presencial' : '🔀 Híbrido'}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="text-2xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">ICP Score</div>
                    <div className={`text-sm font-bold font-mono ${modalJornada.icp >= 70 ? 'text-emerald-600' : modalJornada.icp >= 50 ? 'text-amber-600' : 'text-red-500'}`}>{modalJornada.icp}/100</div>
                  </div>
                </div>
                {modalJornada.link && (
                  <div className="mt-2 bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center justify-between">
                    <span className="text-xs text-blue-700 font-medium truncate">{modalJornada.link}</span>
                    <a href={modalJornada.link.startsWith('http') ? modalJornada.link : `https://${modalJornada.link}`} target="_blank" rel="noreferrer"
                      className="ml-2 flex-shrink-0 text-xs font-semibold text-blue-600 hover:text-blue-700 underline">Entrar →</a>
                  </div>
                )}
                {modalJornada.endereco && (
                  <div className="mt-2 bg-orange-50 border border-orange-100 rounded-xl p-3">
                    <div className="text-2xs font-semibold text-orange-600 mb-0.5">📍 Endereço</div>
                    <div className="text-xs text-gray-700">{modalJornada.endereco}{modalJornada.cidade ? `, ${modalJornada.cidade}` : ''}{modalJornada.estado ? ` — ${modalJornada.estado}` : ''}</div>
                  </div>
                )}
              </div>

              {/* ── RESUMO DA LIGAÇÃO DE AGENDAMENTO ── */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">O que foi dito na ligação</h3>
                <div className="bg-gray-50 rounded-xl p-4 border-l-2 border-brand-400">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {modalJornada.resumo_ligacao || <span className="italic text-gray-400">Sem resumo registrado pela IA.</span>}
                  </p>
                  <div className="flex items-center gap-4 mt-3 pt-2 border-t border-gray-200 flex-wrap">
                    {modalJornada.agente && <div className="text-2xs text-gray-400">Agente: <strong className="text-gray-600">{modalJornada.agente}</strong></div>}
                    {modalJornada.duracao_ligacao && <div className="text-2xs text-gray-400">Duração: <strong className="text-gray-600">{modalJornada.duracao_ligacao}</strong></div>}
                    {modalJornada.campanha && <div className="text-2xs text-gray-400">Campanha: <strong className="text-gray-600">{modalJornada.campanha}</strong></div>}
                  </div>
                </div>
                {modalJornada.sinais.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {modalJornada.sinais.map((s, i) => (
                      <span key={i} className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">{s}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* ── JORNADA (editável) ── */}
              <div className="border-t border-gray-100 pt-5">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Atualizar jornada</h3>

                {/* Etapa */}
                <div className="mb-4">
                  <label className="text-xs font-semibold text-gray-600 block mb-2">Etapa atual</label>
                  <div className="grid grid-cols-4 gap-2">
                    {ETAPAS_JORNADA.map(e => (
                      <button key={e.id} onClick={() => setJornadaEtapa(e.id)}
                        className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 text-xs font-semibold transition-all ${
                          jornadaEtapa === e.id
                            ? 'border-brand-500 bg-brand-50 text-brand-700'
                            : 'border-gray-100 text-gray-500 hover:border-brand-200 hover:bg-brand-50/50'
                        }`}
                      >
                        <span className="text-base">{e.icon}</span>
                        <span className="text-center leading-tight">{e.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1.5">Valor da oportunidade</label>
                    <input className="input w-full" placeholder="R$ 0,00" value={jornadaValor} onChange={e => setJornadaValor(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1.5">Resultado</label>
                    <select className="input w-full" value={modalJornada.resultado ?? ''} onChange={e => setModalJornada(prev => prev ? { ...prev, resultado: e.target.value } : prev)}>
                      <option value="">Aguardando...</option>
                      <option value="fechou">💰 Fechou negócio</option>
                      <option value="noshow">👻 No-show</option>
                      <option value="perdemos">❌ Perdemos</option>
                      <option value="reagendou">🔄 Reagendou</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5">Nota / próximo passo</label>
                  <textarea className="input w-full min-h-[80px] resize-none" placeholder="Objeções levantadas, próximo passo, pontos importantes para o follow-up..."
                    value={jornadaNota} onChange={e => setJornadaNota(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white">
              <button onClick={() => setModalJornada(null)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={salvarJornada} disabled={jornadaSalvando} className="btn-primary flex-1 disabled:opacity-60">
                {jornadaSalvando ? 'Salvando...' : '💾 Salvar jornada'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Minha Área</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Bem-vindo(a), <span className="font-semibold text-gray-700">{currentProfile.nome}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Identity — sem dropdown para vendedor */}
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
            <div
              className={`w-7 h-7 rounded-full ${currentProfile.avatarColor} flex items-center justify-center text-white text-xs font-bold shrink-0`}
            >
              {currentProfile.avatar}
            </div>
            <div className="text-sm">
              <div className="font-medium text-gray-900 leading-tight">{currentProfile.nome}</div>
              <div className="text-[10px] text-gray-400">{currentProfile.cargo}</div>
            </div>
          </div>
          <span className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 rounded-full">
            Plano Growth · Ativo
          </span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="border-b border-gray-200">
        <div className="flex gap-0 overflow-x-auto">
          {tabsConfig.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === t.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.icon}
              {t.label}
              {t.badge !== undefined && (
                <span
                  id={t.badgeId}
                  className={`ml-0.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full text-white ${
                    t.id === 'mensagens' ? 'bg-blue-600' : 'bg-amber-500'
                  }`}
                >
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div>
        {tab === 'agenda' && (
          <TabAgenda
            reunioes={reunioes}
            setReunioes={setReunioes}
            onVerFicha={handleVerFicha}
            onVerResultado={handleVerResultado}
            onVerJornada={abrirJornada}
          />
        )}
        {tab === 'ficha' && (
          <TabFicha fichaData={fichaData} emails={emails} />
        )}
        {tab === 'resultados' && (
          <TabResultados
            reunioes={reunioes}
            resultadoReuniao={resultadoReuniao}
            setResultadoReuniao={setResultadoReuniao}
          />
        )}
        {tab === 'email' && (
          <TabEmail emails={emails} setEmails={setEmails} />
        )}
        {tab === 'gcal' && (
          <TabGcal reunioes={reunioes} />
        )}
        {tab === 'mensagens' && (
          <TabMensagens mensagens={mensagens} setMensagens={setMensagens} />
        )}
        {tab === 'whatsapp' && <TabWhatsApp />}
      </div>
    </div>
  )
}
