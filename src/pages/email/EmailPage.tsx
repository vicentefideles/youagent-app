import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Mail, Send, Sparkles, Save,
  MessageCircle, Megaphone, Zap,
  Pencil, Brain, ArrowLeft,
  Link, Minus
} from 'lucide-react'
import { emailsApi, claudeApi, whatsappApi, equipeApi } from '@/services/api'

type TabId = 'acoes' | 'fila' | 'modelos' | 'campanhas' | 'equipe' | 'whatsapp' | 'inbox' | 'enviados'

interface QueueEmail {
  id: number
  empresa: string
  contato: string
  campanha: string
  origem: string
  template: string
  horario: string
  status: 'pendente' | 'agendado' | 'enviado'
  email: string
  assunto: string
  corpo: string
}

function TabBadge({ count, color = 'bg-red-500' }: { count: number; color?: string }) {
  if (!count) return null
  return (
    <span className={`ml-1.5 ${color} text-white text-xs px-1.5 py-0.5 rounded-full font-bold`}>
      {count}
    </span>
  )
}

function KpiCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string | number
  sub?: string
  accent: string
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-1">
      <span className="text-xs text-gray-500 font-medium">{label}</span>
      <span className={`text-2xl font-bold ${accent}`}>{value}</span>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </div>
  )
}

// ─── Email Composer ───────────────────────────────────────────────────────────
function EmailComposer({
  email,
  onBack,
  onSend,
}: {
  email: QueueEmail
  onBack: () => void
  onSend: (id: number) => void
}) {
  const [para, setPara] = useState(email.email)
  const [assunto, setAssunto] = useState(email.assunto)
  const [corpo, setCorpo] = useState(email.corpo)
  const [rascunhoSalvo, setRascunhoSalvo] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  async function handleEnviarEmail() {
    try {
      await emailsApi.enviar({ para, assunto, corpo })
      onSend(email.id)
    } catch (e) {
      console.error('Erro ao enviar email:', e)
      alert('Erro ao enviar email. Tente novamente.')
    }
  }

  const suggestions = [
    'Mencione o ROI de 60% em prospecção',
    `Use o nome: ${email.contato}`,
    'Referência à call anterior',
    'Urgência: proposta válida por 7 dias',
    'Pergunte sobre decisor',
  ]

  function appendSuggestion(text: string) {
    setCorpo(prev => prev + (prev.endsWith('\n') || prev === '' ? '' : '\n') + text)
  }

  function insertTag(open: string, close: string) {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = corpo.slice(start, end)
    const newCorpo = corpo.slice(0, start) + open + selected + close + corpo.slice(end)
    setCorpo(newCorpo)
    setTimeout(() => {
      ta.focus()
      ta.setSelectionRange(start + open.length, start + open.length + selected.length)
    }, 0)
  }

  function insertAtCursor(text: string) {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const newCorpo = corpo.slice(0, start) + text + corpo.slice(start)
    setCorpo(newCorpo)
    setTimeout(() => {
      ta.focus()
      ta.setSelectionRange(start + text.length, start + text.length)
    }, 0)
  }

  const previewLines = corpo.split('\n')

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50"
        >
          <ArrowLeft size={14} /> Voltar à fila
        </button>
        <span className="text-sm text-gray-500">Editando: <strong className="text-gray-900">{email.empresa}</strong></span>
      </div>

      <div className="flex gap-4">
        {/* Editor — 60% */}
        <div className="flex-1 space-y-3">
          {/* AI Suggestions */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <p className="text-xs font-semibold text-blue-700 mb-2">💡 Sugestões IA</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => appendSuggestion(s)}
                  className="text-xs bg-white border border-blue-300 text-blue-700 px-2.5 py-1 rounded-full hover:bg-blue-100 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5">
            <button
              onClick={() => insertTag('<b>', '</b>')}
              className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-700 font-bold text-xs"
              title="Negrito"
            >
              B
            </button>
            <button
              onClick={() => insertTag('<i>', '</i>')}
              className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-700 italic text-xs"
              title="Itálico"
            >
              I
            </button>
            <button
              onClick={() => insertAtCursor('[texto](url)')}
              className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-700 text-xs"
              title="Link"
            >
              <Link size={12} />
            </button>
            <div className="w-px h-4 bg-gray-300 mx-1" />
            <button
              onClick={() => insertAtCursor('\n---\n')}
              className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-700 text-xs"
              title="Separador"
            >
              <Minus size={12} />
            </button>
          </div>

          {/* Fields */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">Para</label>
              <input
                value={para}
                onChange={e => setPara(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">Assunto</label>
              <input
                value={assunto}
                onChange={e => setAssunto(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">Corpo</label>
              <textarea
                ref={textareaRef}
                value={corpo}
                onChange={e => setCorpo(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                style={{ minHeight: 200 }}
                rows={9}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleEnviarEmail}
              className="flex items-center gap-1.5 text-sm bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700"
            >
              <Send size={14} /> Enviar agora
            </button>
            <button
              onClick={() => {
                localStorage.setItem('email_rascunho', JSON.stringify({ assunto, corpo, destinatario: para }))
                setRascunhoSalvo(true)
                setTimeout(() => setRascunhoSalvo(false), 2000)
              }}
              className="flex items-center gap-1.5 text-sm border border-gray-300 rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              <Save size={14} /> {rascunhoSalvo ? '✓ Salvo' : 'Salvar rascunho'}
            </button>
            <button
              onClick={onBack}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </div>

        {/* Preview — 40% */}
        <div className="w-[40%] shrink-0">
          <p className="text-xs text-gray-500 font-medium mb-2">Pré-visualização</p>
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
            {/* Email header */}
            <div className="px-5 py-4 border-b-4 border-blue-600 bg-gradient-to-r from-blue-600 to-purple-600">
              <span className="text-white font-bold text-base">ETZ</span>
            </div>
            {/* Body */}
            <div className="px-5 py-4 space-y-2 min-h-[200px]">
              {previewLines.map((line, i) => (
                line === '---'
                  ? <hr key={i} className="border-gray-200" />
                  : <p key={i} className="text-sm text-gray-700 leading-relaxed">{line || ' '}</p>
              ))}
            </div>
            {/* CTA */}
            <div className="px-5 pb-4">
              <button className="bg-blue-600 text-white text-sm rounded-lg px-4 py-2 w-full hover:bg-blue-700 cursor-default">
                Agendar uma reunião →
              </button>
            </div>
            {/* Footer */}
            <div className="bg-gray-50 border-t border-gray-100 px-5 py-3">
              <p className="text-xs text-gray-400 text-center">ETZ | Prospecção Inteligente | Cancelar inscrição</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Aba Fila ────────────────────────────────────────────────────────────────
function TabFila() {
  const { data: filaRows = [], isLoading: loadingFila } = useQuery({
    queryKey: ['emails-fila'],
    queryFn: () => emailsApi.inbox().then(r => (r.data as any[]).filter((e: any) => !e.lido).map((e: any) => ({
      id: typeof e.id === 'number' ? e.id : Number(e.id) || Date.now(),
      para: e.para ?? '',
      assunto: e.assunto ?? '',
      status: 'pendente' as const,
      agente: '',
      campanha: e.campanha ?? '',
      empresa: e.empresa ?? '',
      contato: e.de ?? '',
      origem: e.origem ?? '',
      template: e.template ?? '',
      horario: e.criado_em ? new Date(e.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '',
      email: e.para ?? '',
      corpo: e.corpo ?? '',
    } as QueueEmail))),
  })

  const [localOverrides, setLocalOverrides] = useState<Record<number, QueueEmail['status']>>({})
  const rows: QueueEmail[] = filaRows.map(r => localOverrides[r.id] ? { ...r, status: localOverrides[r.id] } : r)

  const [composerEmail, setComposerEmail] = useState<QueueEmail | null>(null)
  const [trainedIds, setTrainedIds] = useState<Set<number>>(new Set())
  const [trainToast, setTrainToast] = useState<number | null>(null)

  function handleSend(id: number) {
    setLocalOverrides(prev => ({ ...prev, [id]: 'enviado' as const }))
    setComposerEmail(null)
  }

  function handleTrain(id: number) {
    setTrainedIds(prev => new Set([...prev, id]))
    setTrainToast(id)
    setTimeout(() => setTrainToast(null), 3000)
  }

  if (composerEmail) {
    return (
      <EmailComposer
        email={composerEmail}
        onBack={() => setComposerEmail(null)}
        onSend={handleSend}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <KpiCard label="Pendentes" value={loadingFila ? '…' : rows.filter(r => r.status === 'pendente').length} sub="aguardando envio" accent="text-amber-600" />
        <KpiCard label="Total na fila" value={loadingFila ? '…' : rows.length} sub="gerados pelo sistema" accent="text-green-600" />
        <KpiCard label="Enviados" value={loadingFila ? '…' : rows.filter(r => r.status === 'enviado').length} sub="nesta sessão" accent="text-blue-600" />
        <KpiCard label="Agendados" value={loadingFila ? '…' : rows.filter(r => r.status === 'agendado').length} sub="para envio" accent="text-purple-600" />
      </div>

      {trainToast !== null && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 font-medium">
          Email adicionado ao banco de treinamento ✓
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-start justify-between mb-1">
          <div>
            <h3 className="font-semibold text-gray-900">E-mails aguardando aprovação</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Gerados automaticamente pelo sistema quando o contato não atendeu ou solicitou apresentação durante a ligação
            </p>
          </div>
          <div className="flex gap-2 shrink-0 ml-4">
            <button
              onClick={() => setComposerEmail({ id: Date.now(), contato: '', empresa: '', campanha: '', origem: '', template: '', horario: '', assunto: '', status: 'pendente', email: '', corpo: '' })}
              className="flex items-center gap-1.5 text-sm border border-gray-300 rounded-lg px-3 py-1.5 text-gray-700 hover:bg-gray-50"
            >
              <Mail size={14} /> Novo E-mail
            </button>
            <button
              onClick={async () => {
                for (const r of rows.filter(r => r.status === 'pendente')) {
                  try {
                    await emailsApi.enviar({ para: r.email || r.contato, assunto: r.assunto, corpo: r.corpo || '' })
                    setLocalOverrides(prev => ({ ...prev, [r.id]: 'enviado' as const }))
                  } catch (e) { console.error(e) }
                }
              }}
              className="flex items-center gap-1.5 text-sm bg-blue-600 text-white rounded-lg px-3 py-1.5 hover:bg-blue-700"
            >
              <Send size={14} /> Enviar todos pendentes
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 uppercase border-b border-gray-100">
                <th className="text-left py-2 font-medium">Empresa</th>
                <th className="text-left py-2 font-medium">Contato</th>
                <th className="text-left py-2 font-medium">Campanha</th>
                <th className="text-left py-2 font-medium">Origem</th>
                <th className="text-left py-2 font-medium">Template</th>
                <th className="text-left py-2 font-medium">Horário</th>
                <th className="text-left py-2 font-medium">Status</th>
                <th className="text-left py-2 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="py-2.5 font-medium text-gray-900">{r.empresa}</td>
                  <td className="py-2.5 text-gray-600">{r.contato}</td>
                  <td className="py-2.5 text-gray-600">{r.campanha}</td>
                  <td className="py-2.5 text-gray-500 text-xs">{r.origem}</td>
                  <td className="py-2.5 text-gray-600">{r.template}</td>
                  <td className="py-2.5 text-gray-500">{r.horario}</td>
                  <td className="py-2.5">
                    {r.status === 'pendente' ? (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Pendente</span>
                    ) : r.status === 'enviado' ? (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Enviado</span>
                    ) : (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Agendado</span>
                    )}
                  </td>
                  <td className="py-2.5">
                    <div className="flex gap-1.5 flex-wrap">
                      {r.status === 'pendente' && (
                        <>
                          <button
                            onClick={() => setComposerEmail(r)}
                            className="text-xs border border-gray-300 rounded px-2 py-1 hover:bg-gray-50 flex items-center gap-1"
                          >
                            <Pencil size={11} /> Editar
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                await emailsApi.enviar({ para: r.email || r.contato, assunto: r.assunto, corpo: r.corpo || '' })
                                setLocalOverrides(prev => ({ ...prev, [r.id]: 'enviado' as const }))
                              } catch (e) { console.error(e) }
                            }}
                            className="text-xs bg-blue-600 text-white rounded px-2 py-1 hover:bg-blue-700 flex items-center gap-1"
                          >
                            <Send size={11} /> Enviar
                          </button>
                        </>
                      )}
                      {trainedIds.has(r.id) ? (
                        <span className="text-xs text-green-600 font-medium px-1">Enviada ✓</span>
                      ) : (
                        <button
                          onClick={() => handleTrain(r.id)}
                          className="text-xs border border-gray-200 rounded px-2 py-1 hover:bg-gray-50 flex items-center gap-1 text-gray-600"
                        >
                          <Brain size={11} /> Treinar IA
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

// ─── Aba Ações ───────────────────────────────────────────────────────────────
function TabAcoes() {
  const { data: enviadosData = [] } = useQuery({
    queryKey: ['emails-acoes'],
    queryFn: () => emailsApi.enviados().then(r => r.data as any[]).catch(() => []),
  })

  // Map enviados to ações shape; empty is valid
  const acoes = (enviadosData as any[]).map((e: any) => ({
    gatilho: e.gatilho ?? e.campanha ?? '—',
    empresa: e.empresa ?? '—',
    contato: e.de ?? e.contato ?? '—',
    acao: e.acao ?? e.assunto ?? '—',
  }))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <KpiCard label="Pendentes" value={acoes.length} sub="ações a executar" accent="text-red-600" />
        <KpiCard label="Total enviados" value={enviadosData.length} sub="pelo sistema" accent="text-blue-600" />
        <KpiCard label="Convertidos" value={(enviadosData as any[]).filter((e: any) => e.status === 'clicado').length} sub="reunião marcada" accent="text-green-600" />
        <KpiCard label="Fallbacks acionados" value={(enviadosData as any[]).filter((e: any) => e.status === 'bounced').length} sub="encaminhados" accent="text-amber-600" />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">Ações pendentes por gatilho</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Quando o argumento não converteu em reunião, o sistema aciona o fallback adequado.
            </p>
          </div>
          <button className="flex items-center gap-1.5 text-sm bg-blue-600 text-white rounded-lg px-3 py-1.5 hover:bg-blue-700">
            <Zap size={14} /> Executar todas pendentes
          </button>
        </div>

        <div className="space-y-3">
          {acoes.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-6">Nenhuma ação pendente.</p>
          )}
          {acoes.map((a, i) => (
            <div key={i} className="flex items-center justify-between border border-gray-100 rounded-xl p-3 hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">{a.gatilho}</span>
                <div>
                  <span className="text-sm font-medium text-gray-900">{a.empresa} · {a.contato}</span>
                  <p className="text-xs text-gray-500 mt-0.5">{a.acao}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="text-xs bg-blue-600 text-white rounded px-2.5 py-1 hover:bg-blue-700">Executar</button>
                <button className="text-xs border border-gray-300 rounded px-2.5 py-1 text-gray-600 hover:bg-gray-50">Ignorar</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Aba Modelos ─────────────────────────────────────────────────────────────
function TabModelos() {
  const [showComposer, setShowComposer] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const [composerContexto, setComposerContexto] = useState('')
  const [composerCorpo, setComposerCorpo] = useState('')
  const [composerAssunto, setComposerAssunto] = useState('')
  const [gerandoIA, setGerandoIA] = useState(false)

  const { data: modelos = [], refetch: refetchModelos } = useQuery({
    queryKey: ['email-modelos'],
    queryFn: () => emailsApi.modelos().then(r => r.data as any[]).catch(() => []),
  })

  async function gerarComIA() {
    if (gerandoIA) return
    setGerandoIA(true)
    try {
      const res = await claudeApi.gerarModelo({
        tipo: 'email',
        contexto: composerContexto || 'prospecção fria',
      })
      const data = res.data as { modelo: string }
      setComposerCorpo(data.modelo)
    } catch {
      setComposerCorpo('Erro ao gerar modelo. Verifique a conexão Claude API.')
    } finally {
      setGerandoIA(false)
    }
  }

  async function salvarModelo() {
    await emailsApi.saveModelo({ titulo: composerAssunto, categoria: 'geral', corpo: composerCorpo, assunto: composerAssunto })
    refetchModelos()
    setShowComposer(false)
    setComposerContexto('')
    setComposerCorpo('')
    setComposerAssunto('')
  }

  const categories = ['Todos', '🎯 Prospecção', '🔄 Follow-up', '✅ Confirmação', '📄 Proposta', '🎥 Demo', '⚙️ Técnico', '🌱 Nutrição', '⚔️ Concorrente']

  const catLabel = selectedCategory.replace(/^[^\s]+\s/, '')
  const modelosFiltrados = selectedCategory === 'Todos'
    ? modelos
    : modelos.filter((m: any) => (m.cat ?? m.categoria ?? '') === catLabel)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">📚 Biblioteca de Modelos</h3>
        <button
          onClick={() => setShowComposer(!showComposer)}
          className="flex items-center gap-1.5 text-sm bg-blue-600 text-white rounded-lg px-3 py-1.5 hover:bg-blue-700"
        >
          <Sparkles size={14} /> Criar modelo com IA
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setSelectedCategory(c)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              selectedCategory === c
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {modelosFiltrados.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-8">Nenhum modelo salvo.</p>
      )}
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))' }}>
        {modelosFiltrados.map((m: any, i: number) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <span className="font-medium text-gray-900 text-sm">{m.titulo ?? m.title ?? '—'}</span>
              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full shrink-0">{m.cat ?? m.categoria ?? '—'}</span>
            </div>
            <p className="text-xs text-gray-500 font-medium">Assunto: {m.assunto ?? m.subject ?? '—'}</p>
            <p className="text-xs text-gray-400 line-clamp-2">{m.preview ?? (m.corpo ?? '').slice(0, 80)}</p>
            <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-400">Usos: {m.usos ?? 0}</span>
              <div className="flex gap-2">
                <button className="text-xs bg-blue-600 text-white rounded px-2.5 py-1 hover:bg-blue-700">Usar</button>
                <button className="text-xs border border-gray-300 rounded px-2.5 py-1 text-gray-600 hover:bg-gray-50">Editar</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showComposer && (
        <div className="bg-white border border-blue-200 rounded-xl p-4 space-y-3">
          <h4 className="font-semibold text-gray-900 text-sm">Criar novo modelo</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">Nome do modelo</label>
              <input value={composerAssunto} onChange={e => setComposerAssunto(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: Follow-up reunião não realizada" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">Categoria</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Follow-up</option>
                <option>Prospecção</option>
                <option>Confirmação</option>
                <option>Proposta</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Contexto para IA</label>
            <textarea
              value={composerContexto}
              onChange={e => setComposerContexto(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2}
              placeholder="Descreva o contexto: 'Contato não atendeu 2x, trabalha com TI, empresas médias...'"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Corpo</label>
            <textarea
              value={composerCorpo}
              onChange={e => setComposerCorpo(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={5}
              placeholder="Clique em '✨ Criar com IA' para gerar automaticamente..."
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setShowComposer(false); setComposerContexto(''); setComposerCorpo('') }} className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 text-gray-600 hover:bg-gray-50">
              Cancelar
            </button>
            <button onClick={gerarComIA} disabled={gerandoIA} className="flex items-center gap-1.5 text-sm bg-purple-600 text-white rounded-lg px-3 py-1.5 hover:bg-purple-700 disabled:opacity-60">
              <Sparkles size={14} /> {gerandoIA ? 'Gerando...' : '✨ Criar com IA'}
            </button>
            <button onClick={salvarModelo} className="flex items-center gap-1.5 text-sm bg-blue-600 text-white rounded-lg px-3 py-1.5 hover:bg-blue-700">
              <Save size={14} /> Salvar modelo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Aba Campanhas ───────────────────────────────────────────────────────────
function TabCampanhas() {
  const [selectedModelo, setSelectedModelo] = useState(0)
  const modelos = ['Apresentação', 'Follow-up', 'Confirmação', 'Proposta']
  const assuntos = [
    'Apresentação rápida — 5 min?',
    '[Nome], vi que você pediu nossa apresentação',
    'Solução que 3 empresas do seu segmento já usam',
    'Isso pode mudar como você agenda reuniões',
  ]

  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: '200px 1fr 270px' }}>
      {/* Coluna 1 */}
      <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-1">
        <p className="text-xs text-gray-400 font-medium uppercase mb-2">Modelos</p>
        {modelos.map((m, i) => (
          <button
            key={i}
            onClick={() => setSelectedModelo(i)}
            className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
              selectedModelo === i ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Coluna 2 — Preview */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white">
          <p className="font-bold text-sm">Your Agent</p>
          <p className="text-xs text-blue-200">Agentes de IA para agendamento comercial ativo</p>
        </div>
        <div className="p-4 flex-1 space-y-3">
          <p className="text-sm text-gray-700">Olá, <strong>[Nome do contato]</strong></p>
          <p className="text-sm text-gray-600">
            Somos especializados em agentes de voz com IA que discam, qualificam e agendam reuniões automaticamente — sem depender de SDRs humanos para cada ligação.
          </p>
          <p className="text-sm text-gray-600">
            Preparei uma apresentação rápida mostrando como empresas do seu segmento estão usando nossa tecnologia.
          </p>
          <button className="bg-blue-600 text-white text-sm rounded-lg px-4 py-2 hover:bg-blue-700">
            Ver apresentação completa
          </button>
        </div>
        <div className="bg-gray-50 border-t border-gray-200 p-3">
          <p className="text-xs text-gray-400 text-center">Your Agent · Cancelar inscrição</p>
        </div>

        <div className="p-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 font-medium mb-2">💡 Sugestões de assunto (IA)</p>
          <div className="flex flex-wrap gap-2">
            {assuntos.map((s, i) => (
              <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-lg cursor-pointer hover:bg-blue-50 hover:text-blue-700">{s}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Coluna 3 — Configurar disparo */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <h4 className="font-semibold text-gray-900 text-sm">Configurar disparo</h4>
        <div>
          <label className="text-xs text-gray-500 font-medium block mb-1">Assunto</label>
          <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" defaultValue="Apresentação que você pediu" />
        </div>
        <div>
          <label className="text-xs text-gray-500 font-medium block mb-1">Remetente</label>
          <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" defaultValue="contato@yourcompany.com.br" />
        </div>
        <div>
          <label className="text-xs text-gray-500 font-medium block mb-1">Destinatários</label>
          <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>Contatos que pediram apresentação (34)</option>
            <option>Agendamentos desta semana</option>
            <option>Subir lista de e-mails (Excel)</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 font-medium block mb-1">Quando enviar</label>
          <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>Enviar agora</option>
            <option>Agendar data e hora</option>
            <option>Automático após reunião</option>
          </select>
        </div>

        <div className="border-t border-gray-200 pt-3">
          <p className="text-xs text-gray-500 font-medium mb-2">Última campanha</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Enviados', value: '312', color: 'text-blue-600' },
              { label: 'Abertos', value: '68%', color: 'text-green-600' },
              { label: 'Clicados', value: '24%', color: 'text-amber-600' },
              { label: 'Respostas', value: '18', color: 'text-purple-600' },
            ].map((k, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-2 text-center">
                <p className={`text-sm font-bold ${k.color}`}>{k.value}</p>
                <p className="text-xs text-gray-400">{k.label}</p>
              </div>
            ))}
          </div>
        </div>

        <button className="w-full bg-blue-600 text-white text-sm rounded-lg py-2 hover:bg-blue-700 font-medium">
          Enviar campanha
        </button>
      </div>
    </div>
  )
}

// ─── Aba Equipe ──────────────────────────────────────────────────────────────
interface MembroEquipe {
  nome: string
  cargo: string
  email: string
  status: 'online' | 'offline' | 'ocupado'
  reunioesHoje: number
  emailsEnviados: number
}

function TabEquipe() {
  const { data: membrosRaw = [] } = useQuery({
    queryKey: ['equipe'],
    queryFn: () => equipeApi.list().then(r => r.data as any[]),
  })

  const membros: MembroEquipe[] = (membrosRaw as any[]).map((m: any) => ({
    nome: m.nome ?? m.name ?? '—',
    cargo: m.cargo ?? m.role ?? '—',
    email: m.email ?? '—',
    status: (['online', 'offline', 'ocupado'].includes(m.status) ? m.status : 'offline') as MembroEquipe['status'],
    reunioesHoje: m.reunioesHoje ?? m.reunioes_hoje ?? 0,
    emailsEnviados: m.emailsEnviados ?? m.emails_enviados ?? 0,
  }))

  const statusStyle: Record<MembroEquipe['status'], string> = {
    online:  'bg-green-500',
    offline: 'bg-gray-400',
    ocupado: 'bg-amber-500',
  }

  const statusLabel: Record<MembroEquipe['status'], string> = {
    online:  'Online',
    offline: 'Offline',
    ocupado: 'Em ligação',
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <KpiCard label="Membros ativos" value={membros.filter(m => m.status !== 'offline').length} sub="online agora" accent="text-green-600" />
        <KpiCard label="Reuniões hoje" value={membros.reduce((a, m) => a + m.reunioesHoje, 0)} sub="total da equipe" accent="text-blue-600" />
        <KpiCard label="E-mails enviados" value={membros.reduce((a, m) => a + m.emailsEnviados, 0)} sub="hoje pela equipe" accent="text-gray-700" />
        <KpiCard label="Membros" value={membros.length} sub="na equipe" accent="text-purple-600" />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Membros da equipe</h3>
          <button className="flex items-center gap-1.5 text-sm bg-blue-600 text-white rounded-lg px-3 py-1.5 hover:bg-blue-700">
            <Mail size={14} /> Nova mensagem
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 uppercase border-b border-gray-100">
                <th className="text-left py-2 font-medium">Membro</th>
                <th className="text-left py-2 font-medium">Status</th>
                <th className="text-left py-2 font-medium">Reuniões hoje</th>
                <th className="text-left py-2 font-medium">E-mails enviados</th>
                <th className="text-left py-2 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {membros.map((m, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs">
                        {m.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{m.nome}</p>
                        <p className="text-xs text-gray-500">{m.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${statusStyle[m.status]}`} />
                      <span className="text-xs text-gray-600">{statusLabel[m.status]}</span>
                    </div>
                  </td>
                  <td className="py-3 text-gray-700">{m.reunioesHoje}</td>
                  <td className="py-3 text-gray-700">{m.emailsEnviados}</td>
                  <td className="py-3">
                    <button className="text-xs border border-gray-300 rounded px-2.5 py-1 text-gray-600 hover:bg-gray-50">
                      Ver atividade
                    </button>
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

// ─── Aba WhatsApp ─────────────────────────────────────────────────────────────
function TabWhatsApp() {
  const [showComposer, setShowComposer] = useState(false)
  const [waTemplate, setWaTemplate] = useState('Tentativa não atendida')
  const [waAudiencia, setWaAudiencia] = useState('Não atenderam (últimos 7 dias)')
  const [waMensagem, setWaMensagem] = useState('')

  const { data: wzHistoricoRaw = [] } = useQuery({
    queryKey: ['whatsapp-historico'],
    queryFn: () => whatsappApi.list().then(r => r.data as any[]),
  })

  const historico = (wzHistoricoRaw as any[]).map((h: any) => ({
    empresa: h.empresa ?? '—',
    contato: h.contato ?? h.de ?? '—',
    msg: h.mensagem ?? h.msg ?? h.corpo ?? '—',
    status: h.status ?? 'Entregue',
    data: h.criado_em ? new Date(h.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—',
  }))

  const statusColor: Record<string, string> = {
    Entregue: 'text-blue-600 bg-blue-50',
    Lido: 'text-amber-600 bg-amber-50',
    Respondido: 'text-green-600 bg-green-50',
  }

  return (
    <div className="space-y-4">
      {(() => {
        const total = historico.length
        const respondidos = historico.filter(h => h.status === 'Respondido').length
        const taxaResp = total > 0 ? Math.round((respondidos / total) * 100) : 0
        const convertidos = historico.filter(h => h.status === 'Respondido').length
        return (
          <div className="grid grid-cols-4 gap-3">
            <KpiCard label="Mensagens enviadas" value={total} sub="no histórico" accent="text-blue-600" />
            <KpiCard label="Respondidos" value={respondidos} sub={`${taxaResp}% de resposta`} accent="text-green-600" />
            <KpiCard label="Taxa de resposta" value={`${taxaResp}%`} sub="do histórico total" accent="text-amber-600" />
            <KpiCard label="Convertidos → CI" value={convertidos} sub="reuniões agendadas" accent="text-purple-600" />
          </div>
        )
      })()}

      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => setShowComposer(!showComposer)}
          className="flex items-center gap-1.5 text-sm bg-green-600 text-white rounded-lg px-3 py-1.5 hover:bg-green-700"
        >
          <MessageCircle size={14} /> Nova mensagem
        </button>
        <button className="flex items-center gap-1.5 text-sm border border-gray-300 rounded-lg px-3 py-1.5 text-gray-700 hover:bg-gray-50">
          <Megaphone size={14} /> Nova campanha
        </button>
        <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-3 py-1.5">
          ⚙️ Configure em Configurações → Integrações → WhatsApp
        </span>
      </div>

      {showComposer && (
        <div className="bg-white border border-green-200 rounded-xl p-4 space-y-3">
          <h4 className="font-semibold text-gray-900 text-sm">Nova campanha WhatsApp</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">Template</label>
              <select
                value={waTemplate}
                onChange={e => setWaTemplate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option>Tentativa não atendida</option>
                <option>Follow-up pós-reunião</option>
                <option>Convite para demo</option>
                <option>Reativação de lead</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">Audiência</label>
              <select
                value={waAudiencia}
                onChange={e => setWaAudiencia(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option>Não atenderam (últimos 7 dias)</option>
                <option>Agendados sem resposta</option>
                <option>Fila multicanal ativa</option>
                <option>Todos os leads</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Mensagem</label>
            <textarea
              value={waMensagem}
              onChange={e => setWaMensagem(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              rows={3}
              placeholder="Olá [Nome], tentei entrar em contato pelo telefone..."
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">Estimativa: <strong className="text-gray-900">{historico.length} contatos</strong></p>
            <div className="flex gap-2">
              <button onClick={() => setShowComposer(false)} className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 text-gray-600 hover:bg-gray-50">
                Cancelar
              </button>
              <button
                onClick={async () => {
                  try {
                    await whatsappApi.send({ template: waTemplate, audiencia: waAudiencia, mensagem: waMensagem })
                    alert('Campanha disparada!')
                    setShowComposer(false)
                  } catch (e: any) { alert('Erro: ' + (e?.message || 'desconhecido')) }
                }}
                className="flex items-center gap-1.5 text-sm bg-green-600 text-white rounded-lg px-3 py-1.5 hover:bg-green-700"
              >
                <Megaphone size={14} /> Disparar campanha
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h4 className="font-semibold text-gray-900 text-sm mb-3">Histórico de mensagens</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 uppercase border-b border-gray-100">
                <th className="text-left py-2 font-medium">Empresa</th>
                <th className="text-left py-2 font-medium">Contato</th>
                <th className="text-left py-2 font-medium">Mensagem</th>
                <th className="text-left py-2 font-medium">Status</th>
                <th className="text-left py-2 font-medium">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {historico.map((h, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="py-2.5 font-medium text-gray-900">{h.empresa}</td>
                  <td className="py-2.5 text-gray-600">{h.contato}</td>
                  <td className="py-2.5 text-gray-500 text-xs max-w-xs truncate">{h.msg}</td>
                  <td className="py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[h.status] ?? 'text-gray-600 bg-gray-100'}`}>
                      {h.status}
                    </span>
                  </td>
                  <td className="py-2.5 text-gray-400 text-xs">{h.data}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Aba Inbox ────────────────────────────────────────────────────────────────
interface InboxEmail {
  id: number
  de: string
  empresa: string
  assunto: string
  preview: string
  data: string
  lido: boolean
  respostaPendente: boolean
  corpo: string
}

const INBOX_MOCK: InboxEmail[] = [
  { id: 1, de: 'Carlos Ramos', empresa: 'Tech Sul', assunto: 'Reunião de amanhã confirmada', preview: 'Oi, só para confirmar que amanhã às 10h estarei disponível para a demo...', data: 'Hoje 13:42', lido: false, respostaPendente: true, corpo: 'Oi,\n\nSó para confirmar que amanhã às 10h estarei disponível para a demo.\n\nAguardo o link de acesso.\n\nAtenciosamente,\nCarlos Ramos' },
  { id: 2, de: 'Ana Lima', empresa: 'Nexus Corp', assunto: 'Dúvida sobre o contrato', preview: 'Recebi a proposta mas tenho uma dúvida sobre a cláusula de cancelamento...', data: 'Hoje 11:20', lido: false, respostaPendente: true, corpo: 'Olá,\n\nRecebi a proposta mas tenho uma dúvida sobre a cláusula de cancelamento.\n\nPoderiam me explicar o prazo de aviso prévio?\n\nObrigada,\nAna Lima' },
  { id: 3, de: 'Pedro Souza', empresa: 'Delta Ind.', assunto: 'Re: Apresentação comercial', preview: 'Gostei muito da apresentação, podemos marcar uma conversa esta semana?', data: 'Hoje 09:15', lido: true, respostaPendente: false, corpo: 'Olá,\n\nGostei muito da apresentação, podemos marcar uma conversa esta semana?\n\nDe preferência quinta ou sexta após as 14h.\n\nAbraços,\nPedro Souza' },
  { id: 4, de: 'Fernanda Costa', empresa: 'EduMais', assunto: 'Solicitação de proposta', preview: 'Somos uma edtech com 200 vendedores e gostaríamos de receber uma proposta...', data: 'Ontem 16:30', lido: true, respostaPendente: true, corpo: 'Bom dia,\n\nSomos uma edtech com 200 vendedores e gostaríamos de receber uma proposta personalizada.\n\nPode me enviar os planos disponíveis?\n\nFernanda Costa\nEduMais Plataforma' },
  { id: 5, de: 'Ricardo Mendes', empresa: 'Constru Tech', assunto: 'Feedback da demo', preview: 'Excelente demonstração! Nossa equipe ficou muito impressionada com a plataforma...', data: 'Ontem 14:00', lido: true, respostaPendente: false, corpo: 'Olá!\n\nExcelente demonstração! Nossa equipe ficou muito impressionada com a plataforma.\n\nVamos levar a proposta para o board na próxima semana.\n\nRicardo Mendes' },
  { id: 6, de: 'Juliana Corrêa', empresa: 'HR Solutions', assunto: 'Interesse no plano Enterprise', preview: 'Conforme conversamos, gostaria de entender melhor as funcionalidades do plano...', data: '22/05 10:45', lido: true, respostaPendente: false, corpo: 'Olá,\n\nConforme conversamos, gostaria de entender melhor as funcionalidades do plano Enterprise.\n\nEm especial a parte de integração com CRM.\n\nJuliana Corrêa' },
  { id: 7, de: 'Marcos Vinicius', empresa: 'Info Sys', assunto: 'Agendamento de onboarding', preview: 'Assinamos o contrato e gostaríamos de iniciar o onboarding o quanto antes...', data: '21/05 09:00', lido: true, respostaPendente: true, corpo: 'Bom dia,\n\nAssinamos o contrato e gostaríamos de iniciar o onboarding o quanto antes.\n\nQual a disponibilidade da equipe?\n\nMarcos Vinicius' },
  { id: 8, de: 'Bianca Torres', empresa: 'Varejo Max', assunto: 'Re: Follow-up ligação', preview: 'Recebi o e-mail do agente! Achei incrível, mas preciso de mais detalhes sobre...', data: '20/05 15:30', lido: true, respostaPendente: false, corpo: 'Recebi o e-mail do agente! Achei incrível, mas preciso de mais detalhes sobre preço.\n\nBianca Torres' },
]

type InboxFilter = 'todos' | 'nao_lidos' | 'pendente'

function TabInbox() {
  const [filtro, setFiltro] = useState<InboxFilter>('todos')
  const [emailSelecionado, setEmailSelecionado] = useState<InboxEmail | null>(null)
  const [composerEmail, setComposerEmail] = useState<QueueEmail | null>(null)

  const { data: inboxReais = [] } = useQuery({
    queryKey: ['emails-inbox'],
    queryFn: () => emailsApi.inbox().then(r => r.data as Array<{
      id: string; de: string; para: string; assunto: string;
      corpo: string; lido: boolean; status: string; criado_em: string;
    }>),
  })

  // Map API data to local InboxEmail shape; fall back to mock if empty
  const inboxSource: InboxEmail[] = (inboxReais as any[]).length > 0
    ? (inboxReais as any[]).map((e: any, idx: number) => ({
        id: typeof e.id === 'number' ? e.id : idx + 1,
        de: e.de ?? '—',
        empresa: e.empresa ?? '—',
        assunto: e.assunto ?? '(sem assunto)',
        preview: (e.corpo ?? '').slice(0, 80),
        data: e.criado_em ? new Date(e.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—',
        lido: e.lido ?? true,
        respostaPendente: e.status === 'pendente',
        corpo: e.corpo ?? '',
      }))
    : INBOX_MOCK

  const filtered = inboxSource.filter(e => {
    if (filtro === 'nao_lidos') return !e.lido
    if (filtro === 'pendente') return e.respostaPendente
    return true
  })

  const naoLidosCount = inboxSource.filter(e => !e.lido).length
  const pendentesCount = inboxSource.filter(e => e.respostaPendente).length

  if (composerEmail) {
    return (
      <EmailComposer
        email={composerEmail}
        onBack={() => setComposerEmail(null)}
        onSend={() => setComposerEmail(null)}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <KpiCard label="Total na caixa" value={inboxSource.length} sub="e-mails recebidos" accent="text-gray-700" />
        <KpiCard label="Não lidos" value={naoLidosCount} sub="aguardando leitura" accent="text-blue-600" />
        <KpiCard label="Resposta pendente" value={pendentesCount} sub="aguardando resposta" accent="text-amber-600" />
      </div>

      <div className="flex gap-2">
        {([['todos', 'Todos'], ['nao_lidos', 'Não lidos'], ['pendente', 'Resposta pendente']] as [InboxFilter, string][]).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setFiltro(id)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${filtro === id ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex gap-4">
        {/* Lista */}
        <div className="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden">
          {filtered.length === 0 && (
            <div className="p-8 text-center text-sm text-gray-400">Nenhum e-mail neste filtro.</div>
          )}
          {filtered.map(e => (
            <button
              key={e.id}
              onClick={() => {
                setEmailSelecionado(e)
                if (!e.lido) emailsApi.marcarLido(String(e.id)).catch(console.error)
              }}
              className={`w-full text-left flex items-start gap-3 p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${emailSelecionado?.id === e.id ? 'bg-blue-50' : e.lido ? '' : 'bg-blue-50/40'}`}
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0">
                {e.de.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className={`text-sm ${!e.lido ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>{e.de} · <span className="font-normal text-gray-500 text-xs">{e.empresa}</span></span>
                  <span className="text-xs text-gray-400 shrink-0">{e.data}</span>
                </div>
                <p className={`text-sm truncate ${!e.lido ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>{e.assunto}</p>
                <p className="text-xs text-gray-400 truncate">{e.preview}</p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                {!e.lido && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                {e.respostaPendente && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">Pendente</span>}
              </div>
            </button>
          ))}
        </div>

        {/* Painel lateral */}
        {emailSelecionado && (
          <div className="w-[42%] shrink-0 bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">{emailSelecionado.assunto}</h3>
                <p className="text-xs text-gray-500 mt-0.5">De: {emailSelecionado.de} ({emailSelecionado.empresa}) · {emailSelecionado.data}</p>
              </div>
              <button onClick={() => setEmailSelecionado(null)} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 flex-1">
              {emailSelecionado.corpo.split('\n').map((line, i) => (
                <p key={i} className="text-sm text-gray-700 leading-relaxed">{line || ' '}</p>
              ))}
            </div>
            <button
              onClick={() => setComposerEmail({
                id: Date.now(),
                contato: emailSelecionado.de || '',
                empresa: emailSelecionado.empresa || '',
                assunto: 'Re: ' + (emailSelecionado.assunto || ''),
                status: 'pendente',
                email: emailSelecionado.de || '',
                corpo: '',
                campanha: '',
                origem: '',
                template: '',
                horario: '',
              })}
              className="flex items-center gap-1.5 text-sm bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 self-start"
            >
              <Send size={14} /> Responder
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Aba Enviados ─────────────────────────────────────────────────────────────
type StatusEnviado = 'entregue' | 'aberto' | 'clicado' | 'bounced'

interface EmailEnviado {
  id: number
  para: string
  empresa: string
  assunto: string
  campanha: string
  dataEnvio: string
  status: StatusEnviado
}

const ENVIADOS_MOCK: EmailEnviado[] = [
  { id: 1, para: 'joao@acme.com', empresa: 'Acme Corp', assunto: 'Tentei te ligar — 2 minutos?', campanha: 'Campanha SP Maio', dataEnvio: 'Hoje 14:30', status: 'aberto' },
  { id: 2, para: 'maria@delta.com', empresa: 'Delta Ind.', assunto: 'Apresentação que você pediu', campanha: 'Campanha MG', dataEnvio: 'Hoje 13:00', status: 'clicado' },
  { id: 3, para: 'carlos@techsul.com', empresa: 'Tech Sul', assunto: 'Oi Carlos, 5 minutos?', campanha: 'Campanha GO', dataEnvio: 'Hoje 10:15', status: 'entregue' },
  { id: 4, para: 'fernanda@edumais.com', empresa: 'EduMais', assunto: 'Solução para seu time de vendas', campanha: 'Campanha SP Maio', dataEnvio: 'Ontem 16:40', status: 'aberto' },
  { id: 5, para: 'ricardo@construtech.com', empresa: 'Constru Tech', assunto: 'Demo rápida de 20 min?', campanha: 'Campanha GO', dataEnvio: 'Ontem 14:00', status: 'clicado' },
  { id: 6, para: 'juliana@hr.com', empresa: 'HR Solutions', assunto: 'Confirmação: reunião amanhã', campanha: 'Campanha MG', dataEnvio: 'Ontem 10:00', status: 'entregue' },
  { id: 7, para: 'marcos@infosys.com', empresa: 'Info Sys', assunto: 'Proposta personalizada para Info Sys', campanha: 'Campanha SP Maio', dataEnvio: '22/05 09:30', status: 'bounced' },
  { id: 8, para: 'bianca@varejomx.com', empresa: 'Varejo Max', assunto: 'Uma comparação honesta', campanha: 'Campanha MG', dataEnvio: '21/05 15:00', status: 'aberto' },
]

const STATUS_ENVIADO_STYLE: Record<StatusEnviado, string> = {
  entregue: 'bg-gray-100 text-gray-600',
  aberto:   'bg-blue-50 text-blue-700',
  clicado:  'bg-green-50 text-green-700',
  bounced:  'bg-red-50 text-red-600',
}

const STATUS_ENVIADO_LABEL: Record<StatusEnviado, string> = {
  entregue: 'Entregue',
  aberto:   'Aberto',
  clicado:  'Clicado',
  bounced:  'Bounced',
}

function TabEnviados() {
  const { data: enviadosReais = [] } = useQuery({
    queryKey: ['emails-enviados'],
    queryFn: () => emailsApi.enviados().then(r => r.data as Array<{
      id: string; de: string; para: string; assunto: string;
      status: string; criado_em: string;
    }>),
  })

  // Map API data to local EmailEnviado shape; fall back to mock if empty
  const enviadosSource: EmailEnviado[] = (enviadosReais as any[]).length > 0
    ? (enviadosReais as any[]).map((e: any, idx: number) => ({
        id: typeof e.id === 'number' ? e.id : idx + 1,
        para: e.para ?? '—',
        empresa: e.empresa ?? '—',
        assunto: e.assunto ?? '(sem assunto)',
        campanha: e.campanha ?? '—',
        dataEnvio: e.criado_em ? new Date(e.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—',
        status: (['entregue', 'aberto', 'clicado', 'bounced'].includes(e.status) ? e.status : 'entregue') as StatusEnviado,
      }))
    : ENVIADOS_MOCK

  const total = enviadosSource.length
  const abertos = enviadosSource.filter(e => e.status === 'aberto' || e.status === 'clicado').length
  const clicados = enviadosSource.filter(e => e.status === 'clicado').length

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <KpiCard label="Total enviados" value={total} sub="todos os tempos" accent="text-gray-700" />
        <KpiCard label="Taxa de abertura" value={`${Math.round((abertos / total) * 100)}%`} sub={`${abertos} de ${total} abertos`} accent="text-blue-600" />
        <KpiCard label="Taxa de clique" value={`${Math.round((clicados / total) * 100)}%`} sub={`${clicados} de ${total} clicados`} accent="text-green-600" />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">E-mails enviados pelo sistema</h3>
          <button
            onClick={() => {
              const csv = ['Para,Assunto,Data,Status', ...enviadosSource.map(e => `${e.para},${e.assunto},${e.dataEnvio},${e.status}`)].join('\n')
              const blob = new Blob([csv], { type: 'text/csv' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a'); a.href = url; a.download = 'emails-enviados.csv'; a.click()
            }}
            className="flex items-center gap-1.5 text-sm border border-gray-300 rounded-lg px-3 py-1.5 text-gray-700 hover:bg-gray-50"
          >
            <Send size={14} /> Exportar CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 uppercase border-b border-gray-100">
                <th className="text-left py-2 font-medium">Destinatário</th>
                <th className="text-left py-2 font-medium">Assunto</th>
                <th className="text-left py-2 font-medium">Campanha</th>
                <th className="text-left py-2 font-medium">Data envio</th>
                <th className="text-left py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {enviadosSource.map(e => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="py-2.5">
                    <p className="font-medium text-gray-900">{e.empresa}</p>
                    <p className="text-xs text-gray-500">{e.para}</p>
                  </td>
                  <td className="py-2.5 text-gray-700 max-w-[200px] truncate">{e.assunto}</td>
                  <td className="py-2.5 text-gray-500 text-xs">{e.campanha}</td>
                  <td className="py-2.5 text-gray-400 text-xs">{e.dataEnvio}</td>
                  <td className="py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_ENVIADO_STYLE[e.status]}`}>
                      {STATUS_ENVIADO_LABEL[e.status]}
                    </span>
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

// ─── Componente principal ─────────────────────────────────────────────────────
export default function EmailPage() {
  const [tab, setTab] = useState<TabId>('fila')

  const tabs: { id: TabId; label: string; badge?: number; badgeColor?: string; chip?: string }[] = [
    { id: 'fila', label: 'Fila de Follow-up', badge: 12, badgeColor: 'bg-amber-500' },
    { id: 'campanhas', label: '📣 Campanhas' },
    { id: 'acoes', label: 'Ações por Gatilho', badge: 7, badgeColor: 'bg-red-500' },
    { id: 'equipe', label: '👥 Equipe', badge: 2, badgeColor: 'bg-blue-500' },
    { id: 'modelos', label: '📚 Modelos' },
    { id: 'whatsapp', label: '💬 WhatsApp', chip: 'Em breve' },
    { id: 'inbox', label: '📥 Inbox', badge: 2, badgeColor: 'bg-blue-500' },
    { id: 'enviados', label: '📤 Enviados' },
  ]

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">✉️ E-mail Marketing</h1>
          <p className="text-sm text-gray-500 mt-0.5">Follow-ups automáticos · Templates · Acompanhamento por vendedor</p>
        </div>
        <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option>Todos os vendedores</option>
          <option>Ana Lima</option>
          <option>Carlos Ramos</option>
          <option>Pedro Souza</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center whitespace-nowrap text-sm px-4 py-2.5 -mb-px transition-colors relative ${
                tab === t.id
                  ? 'border-b-2 border-blue-600 text-blue-600 font-semibold'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
              {t.badge ? <TabBadge count={t.badge} color={t.badgeColor} /> : null}
              {t.chip && (
                <span className="ml-1.5 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
                  {t.chip}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {tab === 'fila' && <TabFila />}
      {tab === 'acoes' && <TabAcoes />}
      {tab === 'modelos' && <TabModelos />}
      {tab === 'campanhas' && <TabCampanhas />}
      {tab === 'equipe' && <TabEquipe />}
      {tab === 'whatsapp' && <TabWhatsApp />}
      {tab === 'inbox' && <TabInbox />}
      {tab === 'enviados' && <TabEnviados />}
    </div>
  )
}
