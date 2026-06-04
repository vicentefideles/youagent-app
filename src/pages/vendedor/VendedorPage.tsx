import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ExternalLink, Calendar, CheckCircle, ChevronDown, Users } from 'lucide-react'
import { reunioesApi, equipeApi } from '@/services/api'
import { PainelReativacao } from '@/pages/discadora/DiscadoraPage'

type TabId = 'agenda' | 'ficha' | 'resultados' | 'email' | 'gcal' | 'mensagens' | 'reativacao'
type ResultadoKey = 'fechou' | 'reagendou' | 'perdeu' | 'noshow'
type MsgSubTab = 'recebidas' | 'enviadas'

interface Reuniao {
  id: string
  empresa: string
  contato: string
  cargo: string
  campanha: string
  data: string
  modalidade: string
  vendedor: string
  icp: number
  status: 'Confirmada' | 'Pendente' | 'Realizada'
  link: string
  agente: string
  sinais: string[]
  sugestao: string
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function initials(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length === 0) return '--'
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const sinaisBadgeColor: Record<string, string> = {
  urgência: 'bg-red-100 text-red-700',
  proposta: 'bg-green-100 text-green-700',
  decisor: 'bg-purple-100 text-purple-700',
  preço: 'bg-amber-100 text-amber-700',
  humano: 'bg-blue-100 text-blue-700',
  demo: 'bg-indigo-100 text-indigo-700',
  técnico: 'bg-gray-100 text-gray-700',
}

const resultadoLabel: Record<ResultadoKey, string> = {
  fechou: '✅ Fechou',
  reagendou: '📅 Reagendou',
  perdeu: '❌ Perdeu',
  noshow: '🚫 No-show',
}

const resultadoColor: Record<ResultadoKey, string> = {
  fechou: 'border-green-400 text-green-700 bg-green-50',
  reagendou: 'border-blue-400 text-blue-700 bg-blue-50',
  perdeu: 'border-red-400 text-red-700 bg-red-50',
  noshow: 'border-gray-300 text-gray-600 bg-gray-50',
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
  if (status === 'Confirmada')
    return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">Confirmada</span>
  if (status === 'Realizada')
    return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">Realizada</span>
  return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Pendente</span>
}

// ─── TabAgenda ────────────────────────────────────────────────────────────────

function TabAgenda({
  reunioes,
  vendedorFiltro,
  onVerFicha,
  onVerResultado,
}: {
  reunioes: Reuniao[]
  vendedorFiltro: string
  onVerFicha: (r: Reuniao) => void
  onVerResultado: (r: Reuniao) => void
}) {
  const [filtroStatus, setFiltroStatus] = useState('')
  const navigate = useNavigate()

  const reunioesFiltradas = reunioes.filter((r) => {
    const matchVendedor = vendedorFiltro === 'todos' || r.vendedor.toLowerCase().includes(vendedorFiltro)
    const matchStatus =
      filtroStatus === '' ||
      (filtroStatus === 'Confirmada' && r.status === 'Confirmada') ||
      (filtroStatus === 'Realizada' && r.status === 'Realizada') ||
      (filtroStatus === 'nao_compareceu' && r.status === 'Pendente')
    return matchVendedor && matchStatus
  })

  const hoje = reunioesFiltradas.length
  const confirmadas = reunioesFiltradas.filter((r) => r.status === 'Confirmada').length
  const realizadas = reunioesFiltradas.filter((r) => r.status === 'Realizada').length
  const showRate = realizadas > 0 ? Math.round((realizadas / hoje) * 100) + '%' : '—'

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <KpiCard label="Reuniões hoje" value={hoje} sub="agendadas pela IA" color="text-gray-900" id="v-kpi-hoje" />
        <KpiCard label="Confirmadas" value={confirmadas} sub="aguardando reunião" color="text-green-600" id="v-kpi-confirmadas" />
        <KpiCard label="Realizadas" value={realizadas} sub="com resultado registrado" color="text-blue-600" id="v-kpi-realizadas" />
        <KpiCard label="Show-rate" value={showRate} sub="% que compareceram" color="text-purple-600" id="v-kpi-showrate" />
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">Reuniões agendadas pela IA</h2>
          <select
            id="v-filtro-status"
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="text-xs border border-gray-200 rounded-md px-2 py-1.5 text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Todos os status</option>
            <option value="Confirmada">Confirmada</option>
            <option value="Realizada">Realizada</option>
            <option value="nao_compareceu">Não compareceu</option>
          </select>
        </div>

        <div id="v-reunioes-lista" className="divide-y divide-gray-100">
          {reunioesFiltradas.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <div className="text-4xl mb-3">📅</div>
              <div className="text-sm font-medium">Nenhuma reunião encontrada</div>
              <div className="text-xs mt-1">Tente ajustar os filtros</div>
            </div>
          ) : (
            reunioesFiltradas.map((r) => (
              <div key={r.id} className="px-5 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm">{r.empresa}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {r.contato} · {r.cargo} · <span className="font-mono text-gray-400">{r.campanha}</span>
                  </div>
                </div>

                <div className="text-sm text-gray-600 text-center shrink-0">
                  <div className="font-medium">{r.data}</div>
                  <div className="text-xs text-gray-400">{r.modalidade}</div>
                  <div className="text-xs text-gray-400">{r.vendedor}</div>
                  <span className="mt-1 inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700">
                    ICP {r.icp}
                  </span>
                </div>

                <div className="shrink-0">
                  <StatusBadge status={r.status} />
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => onVerFicha(r)}
                    className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Ver ficha
                  </button>
                  <button
                    onClick={() => onVerResultado(r)}
                    className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Resultado
                  </button>
                  <button
                    onClick={() => navigate('/email', { state: { contato: r.contato } })}
                    className="px-2 py-1.5 text-xs font-medium border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    E-mail
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// ─── TabFicha ─────────────────────────────────────────────────────────────────

function TabFicha({ fichaData }: { fichaData: Reuniao | null }) {
  if (!fichaData) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-5xl mb-4">📋</div>
        <h3 className="text-base font-semibold text-gray-700 mb-1">Selecione uma reunião</h3>
        <p className="text-sm text-gray-400 max-w-sm">
          Clique em "Ver ficha" em qualquer reunião da aba Agenda para ver os dados completos do contato
        </p>
      </div>
    )
  }

  const ini = initials(fichaData.contato)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Dados do contato */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">👤 Dados do contato</h3>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
              {ini}
            </div>
            <div>
              <div className="font-semibold text-gray-900 text-sm">{fichaData.contato}</div>
              <div className="text-xs text-gray-500">{fichaData.cargo}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="text-gray-400 uppercase text-[10px] font-bold tracking-wide mb-0.5">Empresa</div>
              <div className="font-medium text-gray-800">{fichaData.empresa}</div>
            </div>
            <div>
              <div className="text-gray-400 uppercase text-[10px] font-bold tracking-wide mb-0.5">Campanha</div>
              <div className="font-medium text-gray-800 font-mono">{fichaData.campanha}</div>
            </div>
            <div>
              <div className="text-gray-400 uppercase text-[10px] font-bold tracking-wide mb-0.5">Agente de IA</div>
              <div className="font-medium text-gray-800">{fichaData.agente}</div>
            </div>
            <div>
              <div className="text-gray-400 uppercase text-[10px] font-bold tracking-wide mb-0.5">ICP Score</div>
              <div className="font-bold text-indigo-700">{fichaData.icp} / 95</div>
            </div>
          </div>
        </div>

        {/* Detalhes da reunião */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">📅 Detalhes da reunião</h3>
          <div className="space-y-2 text-xs mb-4">
            {[
              { label: 'Data', value: fichaData.data.split(' - ')[0] },
              { label: 'Hora', value: fichaData.data.split(' - ')[1] || '—' },
              { label: 'Modalidade', value: fichaData.modalidade },
              { label: 'Vendedor', value: fichaData.vendedor },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="text-gray-400 uppercase text-[10px] font-bold tracking-wide">{label}</span>
                <span className="font-medium text-gray-800">{value}</span>
              </div>
            ))}
          </div>
          {fichaData.link !== '—' && (
            <div className="rounded-md bg-blue-50 border border-blue-100 p-3">
              <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wide mb-1">🔗 Link da reunião</div>
              <div className="font-mono text-xs text-blue-700 break-all">{fichaData.link}</div>
            </div>
          )}
        </div>
      </div>

      {/* Sinais da IA */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">🤖 O que a IA detectou nessa ligação</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="text-xs text-gray-400 mb-2">Sinais detectados</div>
            <div className="flex flex-wrap gap-2">
              {fichaData.sinais.map((s) => (
                <span
                  key={s}
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${sinaisBadgeColor[s] ?? 'bg-gray-100 text-gray-600'}`}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-2">Sugestão para a reunião</div>
            <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 rounded-md p-3">{fichaData.sugestao}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── TabResultados ────────────────────────────────────────────────────────────

function TabResultados({
  reunioes,
  highlightId,
}: {
  reunioes: Reuniao[]
  highlightId: string | null
}) {
  const [resultados, setResultados] = useState<Record<string, ResultadoKey>>({})

  async function handleRegistrarResultado(reuniaoId: string, resultado: ResultadoKey) {
    setResultados((prev) => ({ ...prev, [reuniaoId]: resultado }))
    try {
      await reunioesApi.update(reuniaoId, { resultado })
    } catch (e) {
      console.error('Erro ao salvar resultado:', e)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <CheckCircle size={15} className="text-green-500" />
          Registrar resultado das reuniões
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Registre o resultado de cada reunião realizada. Esses dados alimentam o Centro de Inteligência e melhoram as próximas ligações.
        </p>
      </div>

      <div className="divide-y divide-gray-100">
        {reunioes.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <div className="text-4xl mb-3">✅</div>
            <div className="text-sm font-medium">Nenhuma reunião para registrar</div>
          </div>
        ) : (
          reunioes.map((r) => (
            <div
              key={r.id}
              className={`px-5 py-4 flex items-center gap-4 transition-colors ${highlightId === r.id ? 'bg-blue-50 ring-1 ring-blue-200 ring-inset' : ''}`}
            >
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 text-sm">
                  {r.empresa}
                  {highlightId === r.id && (
                    <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 rounded">
                      Selecionada
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {r.contato} · {r.data}
                </div>
              </div>

              {resultados[r.id] ? (
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${resultadoColor[resultados[r.id]]}`}>
                  {resultadoLabel[resultados[r.id]]}
                </span>
              ) : (
                <div className="flex gap-2 flex-wrap justify-end">
                  {(['fechou', 'reagendou', 'perdeu', 'noshow'] as ResultadoKey[]).map((k) => (
                    <button
                      key={k}
                      onClick={() => handleRegistrarResultado(r.id, k)}
                      className={`px-3 py-1.5 text-xs font-medium border rounded-md transition-all hover:opacity-80 ${resultadoColor[k]}`}
                    >
                      {resultadoLabel[k]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ─── TabEmail ─────────────────────────────────────────────────────────────────

const emailRows = [
  {
    empresa: 'Acme Corp',
    contato: 'João Alves',
    campanha: 'campanha_a',
    origem: 'Ligação',
    template: 'Follow-up Pós-Reunião',
    horario: '23/05 09:00',
    status: 'Pendente' as const,
  },
  {
    empresa: 'Delta Ind.',
    contato: 'Maria Santos',
    campanha: 'campanha_b',
    origem: 'Não atendeu',
    template: 'Follow-up Automático',
    horario: '23/05 11:00',
    status: 'Pendente' as const,
  },
  {
    empresa: 'Tech Sul',
    contato: 'Roberto Lima',
    campanha: 'campanha_a',
    origem: 'Ligação',
    template: 'Proposta Comercial',
    horario: '22/05 15:30',
    status: 'Enviado' as const,
  },
]

function TabEmail() {
  const [rows, setRows] = useState(emailRows)

  const pendentes = rows.filter((r) => r.status === 'Pendente').length

  function enviar(i: number) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, status: 'Enviado' as const } : r)))
  }

  function enviarTodos() {
    setRows((prev) => prev.map((r) => ({ ...r, status: 'Enviado' as const })))
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <KpiCard label="Pendentes meus" value={pendentes} sub="aguardando envio" color="text-amber-600" id="vemail-kpi-pendentes" />
        <KpiCard
          label="Enviados hoje"
          value={rows.filter((r) => r.status === 'Enviado').length}
          sub="nesta sessão"
          color="text-green-600"
          id="vemail-kpi-enviados"
        />
        <KpiCard label="Via ligação" value={1} sub="solicitados durante call" color="text-blue-600" id="vemail-kpi-ligacao" />
        <KpiCard label="Não atendeu" value={3} sub="follow-up automático" color="text-gray-600" id="vemail-kpi-naoaten" />
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Meus e-mails de follow-up</h2>
            <p className="text-xs text-gray-400 mt-0.5">E-mails gerados pela IA — revise e envie</p>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors">
              ✉️ Novo E-mail
            </button>
            <button
              onClick={enviarTodos}
              disabled={pendentes === 0}
              className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Enviar todos pendentes
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs" id="vemail-tbody">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Empresa', 'Contato', 'Campanha', 'Origem', 'Template', 'Horário', 'Status', 'Ações'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{row.empresa}</td>
                  <td className="px-4 py-3 text-gray-600">{row.contato}</td>
                  <td className="px-4 py-3 font-mono text-gray-500">{row.campanha}</td>
                  <td className="px-4 py-3 text-gray-600">{row.origem}</td>
                  <td className="px-4 py-3 text-gray-600">{row.template}</td>
                  <td className="px-4 py-3 text-gray-500">{row.horario}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        row.status === 'Enviado' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {row.status === 'Pendente' ? (
                        <>
                          <button className="px-2 py-1 border border-gray-200 rounded text-[10px] font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                            Editar
                          </button>
                          <button
                            onClick={() => enviar(i)}
                            className="px-2 py-1 border border-blue-200 rounded text-[10px] font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            Enviar
                          </button>
                        </>
                      ) : (
                        <button className="px-2 py-1 border border-gray-200 rounded text-[10px] font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                          Ver
                        </button>
                      )}
                    </div>
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

// ─── TabGcal ──────────────────────────────────────────────────────────────────

function TabGcal() {
  const [calConnected, setCalConnected] = useState(false)
  const [email, setEmail] = useState('')

  if (calConnected) {
    return (
      <div className="max-w-lg space-y-4">
        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-5 py-4">
          <div className="flex items-center gap-3">
            <CheckCircle size={18} className="text-green-600" />
            <div>
              <div className="text-sm font-semibold text-green-800" id="vcal-email-conectado">
                {email || 'joao.silva@gmail.com'} conectado
              </div>
              <div className="text-xs text-green-600">Google Calendar autorizado · Reuniões criadas automaticamente</div>
            </div>
          </div>
          <button
            onClick={() => setCalConnected(false)}
            className="text-xs text-red-600 border border-red-200 rounded-md px-3 py-1.5 hover:bg-red-50 transition-colors"
          >
            Desconectar
          </button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Próximos slots disponíveis</h3>
          <div id="vcal-slots-lista" className="space-y-2">
            {[
              { dia: 'Seg, 26/05', hora: '09:00 – 09:30' },
              { dia: 'Seg, 26/05', hora: '14:00 – 14:30' },
              { dia: 'Ter, 27/05', hora: '10:00 – 10:30' },
            ].map((s, i) => (
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
      </div>
    )
  }

  return (
    <div className="max-w-lg space-y-4" id="vcal-desconectado">
      <div>
        <h2 className="text-base font-semibold text-gray-800">Meu Google Calendar</h2>
        <p className="text-sm text-gray-500 mt-1">
          Conecte sua agenda pessoal para que a IA agende reuniões diretamente nos seus slots livres
        </p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
        <span className="text-2xl">📅</span>
        <div>
          <div className="text-sm font-semibold text-gray-800 mb-1">Por que conectar?</div>
          <p className="text-xs text-green-800 leading-relaxed">
            A IA verifica seus horários livres em tempo real e só agenda reuniões nos slots que você configurar — sem
            conflitos, sem surpresas.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-4" id="vcal-desconectado-form">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">E-mail Google</label>
          <input
            id="vcal-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@gmail.com ou @suaempresa.com"
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Duração padrão das reuniões</label>
            <select id="vcal-duracao" className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option>30 minutos</option>
              <option defaultChecked>60 minutos</option>
              <option>90 minutos</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Modalidade preferida</label>
            <select id="vcal-modalidade" className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option>Google Meet</option>
              <option>Presencial</option>
              <option>Ambos</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">Horários disponíveis para reuniões</label>
          <div className="flex flex-wrap gap-3 mb-3">
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map((d, i) => (
              <label key={d} className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-600">
                <input type="checkbox" defaultChecked={i < 5} className="rounded accent-blue-600" />
                {d}
              </label>
            ))}
          </div>
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
          onClick={() => setCalConnected(true)}
          className="w-full bg-green-600 text-white text-sm font-semibold rounded-md py-2.5 hover:bg-green-700 transition-colors"
        >
          Autorizar com Google
        </button>
      </div>
    </div>
  )
}

// ─── TabMensagens ─────────────────────────────────────────────────────────────

function TabMensagens() {
  const [subTab, setSubTab] = useState<MsgSubTab>('recebidas')

  const recebidas = [
    { de: 'Gerência', msg: 'Parabéns pelo fechamento de ontem com Acme Corp! 🎉', hora: '22/05 16:30', unread: true },
    { de: 'Sistema', msg: 'Reunião com Delta Ind. confirmada para amanhã 10h30', hora: '22/05 14:00', unread: true },
    { de: 'Gerência', msg: 'Lembrete: preencher resultado das reuniões desta semana', hora: '21/05 09:00', unread: false },
  ]

  const enviadas = [
    { para: 'Gerência', assunto: 'Dúvida sobre campanha_b — gatilhos', hora: '21/05 11:00' },
  ]

  const naoLidas = recebidas.filter((m) => m.unread).length

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <KpiCard label="Não lidas" value={naoLidas} sub="aguardando leitura" color="text-blue-600" id="vmsg-kpi-naoLidas" />
        <KpiCard label="Recebidas" value={recebidas.length} sub="total recebidas" color="text-gray-600" id="vmsg-kpi-recebidas" />
        <KpiCard label="Enviadas" value={enviadas.length} sub="mensagens enviadas" color="text-green-600" id="vmsg-kpi-enviadas" />
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">💬 Mensagens da equipe</h2>
            <p className="text-xs text-gray-400 mt-0.5">Comunicação direta com gerência e administração</p>
          </div>
          <button className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            ✉️ Nova mensagem
          </button>
        </div>

        <div className="flex border-b border-gray-100 px-5">
          {(['recebidas', 'enviadas'] as MsgSubTab[]).map((t) => (
            <button
              key={t}
              id={`vmsg-tab-${t}`}
              onClick={() => setSubTab(t)}
              className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
                subTab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'recebidas' ? '📥 Recebidas' : '📤 Enviadas'}
            </button>
          ))}
        </div>

        {subTab === 'recebidas' && (
          <div id="vmsg-inbox-panel" className="divide-y divide-gray-100">
            {recebidas.map((m, i) => (
              <div key={i} className="flex items-start gap-3 px-5 py-4 hover:bg-gray-50 cursor-pointer transition-colors">
                <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${m.unread ? 'bg-blue-500' : 'bg-transparent'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold ${m.unread ? 'text-gray-900' : 'text-gray-600'}`}>{m.de}</span>
                    <span className="text-[10px] text-gray-400">{m.hora}</span>
                  </div>
                  <p className={`text-xs mt-0.5 truncate ${m.unread ? 'text-gray-700' : 'text-gray-400'}`}>{m.msg}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {subTab === 'enviadas' && (
          <div id="vmsg-enviados-panel" className="divide-y divide-gray-100">
            {enviadas.map((m, i) => (
              <div key={i} className="flex items-start gap-3 px-5 py-4 hover:bg-gray-50 cursor-pointer transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700">Para: {m.para}</span>
                    <span className="text-[10px] text-gray-400">{m.hora}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{m.assunto}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── TabReativacaoVendedor — painel reativação com filtro por vendedor ────────

function TabReativacaoVendedor() {
  const [vendedorSel, setVendedorSel] = useState<string>('')

  const { data: equipeRaw = [] } = useQuery({
    queryKey: ['equipe-reativ'],
    queryFn: () => equipeApi.list().then(r => r.data as any[]),
  })

  const vendedores = (equipeRaw as any[]).filter((m: any) =>
    m.funcao === 'vendedor' || m.cargo?.toLowerCase().includes('vend') || m.ativo !== false
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Filtro por vendedor */}
      {vendedores.length > 1 && (
        <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3">
          <Users size={14} className="text-gray-400 flex-shrink-0"/>
          <span className="text-xs font-medium text-gray-600 whitespace-nowrap">Enviar como:</span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setVendedorSel('')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                vendedorSel === ''
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              Minha conta
            </button>
            {vendedores.map((v: any) => (
              <button
                key={v.id}
                onClick={() => setVendedorSel(v.id)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 ${
                  vendedorSel === v.id
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span className={`w-5 h-5 rounded-full text-white text-2xs font-bold flex items-center justify-center flex-shrink-0 ${
                  vendedorSel === v.id ? 'bg-white/20' : 'bg-brand-400'
                }`}>
                  {(v.nome || 'V').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                </span>
                {v.nome?.split(' ')[0]}
                {!v.whatsapp_status || v.whatsapp_status !== 'conectado'
                  ? <span className="text-2xs opacity-60">(sem WA)</span>
                  : <span className="text-2xs opacity-80">✓ WA</span>
                }
              </button>
            ))}
          </div>
          {vendedorSel && (
            <p className="text-2xs text-gray-400 ml-auto whitespace-nowrap">
              WA enviado pelo WhatsApp de <strong>{vendedores.find((v: any) => v.id === vendedorSel)?.nome?.split(' ')[0]}</strong>
            </p>
          )}
        </div>
      )}

      <PainelReativacao vendedorIdExterno={vendedorSel || undefined} />
    </div>
  )
}

// ─── Tabs config ──────────────────────────────────────────────────────────────

const tabs: { id: TabId; label: string; badge?: string; badgeColor?: string }[] = [
  { id: 'agenda', label: '📅 Agenda de Reuniões' },
  { id: 'ficha', label: '📋 Ficha do Contato' },
  { id: 'resultados', label: '✅ Registrar Resultados' },
  { id: 'email', label: '✉️ E-mails', badge: '2', badgeColor: 'bg-amber-500' },
  { id: 'gcal', label: '📆 Meu Google Calendar' },
  { id: 'mensagens',   label: '💬 Mensagens',  badge: '2', badgeColor: 'bg-blue-600' },
  { id: 'reativacao', label: '🔄 Reativação' },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VendedorPage() {
  const [activeTab, setActiveTab] = useState<TabId>('agenda')
  const [vendedor, setVendedor] = useState('todos')
  const [fichaData, setFichaData] = useState<Reuniao | null>(null)
  const [highlightResultadoId, setHighlightResultadoId] = useState<string | null>(null)

  const { data: rawReunioes = [] } = useQuery({
    queryKey: ['reunioes'],
    queryFn: () => reunioesApi.list().then(r => r.data as any[]),
  })

  const reunioesData: Reuniao[] = rawReunioes.map(r => ({
    id: String(r.id ?? ''),
    empresa: r.empresa_nome ?? r.empresa ?? '',
    contato: r.contato_nome ?? r.contato ?? '',
    cargo: r.cargo ?? '',
    campanha: r.campanha_nome ?? r.campanha ?? '',
    data: r.inicio ? new Date(r.inicio).toLocaleDateString('pt-BR') : '',
    modalidade: r.modalidade ?? 'online',
    vendedor: r.vendedor_nome ?? r.vendedor ?? '',
    icp: r.icp ?? 0,
    status: r.status ?? 'Pendente',
    link: r.meet_link ?? r.link ?? '',
    agente: r.agente_nome ?? r.agente ?? '',
    sinais: r.sinais ?? [],
    sugestao: r.sugestao ?? '',
  }))

  function handleVerFicha(r: Reuniao) {
    setFichaData(r)
    setActiveTab('ficha')
  }

  function handleVerResultado(r: Reuniao) {
    setHighlightResultadoId(r.id)
    setActiveTab('resultados')
  }

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">💼 Área do Vendedor</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Reuniões agendadas pela IA · Fichas de contato · Registro de resultados
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative">
            <select
              value={vendedor}
              onChange={(e) => setVendedor(e.target.value)}
              id="vendedor-sel"
              className="appearance-none border border-gray-200 rounded-md px-3 py-2 pr-7 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="todos">Todos os vendedores</option>
              <option value="joão silva">João Silva</option>
              <option value="carlos mendes">Carlos Mendes</option>
              <option value="mariana costa">Mariana Costa</option>
            </select>
            <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            Ver discadora
            <ExternalLink size={13} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-0 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {tab.badge && (
                <span
                  id={tab.id === 'email' ? 'vtab-email-badge' : tab.id === 'mensagens' ? 'vtab-mensagens-badge' : undefined}
                  className={`ml-1.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full text-white ${tab.badgeColor}`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'agenda' && (
          <TabAgenda
            reunioes={reunioesData}
            vendedorFiltro={vendedor}
            onVerFicha={handleVerFicha}
            onVerResultado={handleVerResultado}
          />
        )}
        {activeTab === 'ficha' && <TabFicha fichaData={fichaData} />}
        {activeTab === 'resultados' && (
          <TabResultados reunioes={reunioesData} highlightId={highlightResultadoId} />
        )}
        {activeTab === 'email' && <TabEmail />}
        {activeTab === 'gcal' && <TabGcal />}
        {activeTab === 'mensagens'   && <TabMensagens />}
        {activeTab === 'reativacao'  && <TabReativacaoVendedor />}
      </div>
    </div>
  )
}
