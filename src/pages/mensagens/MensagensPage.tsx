import { useState, useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { whatsappUsuarioApi } from '@/services/api'
import { MessageSquare, Search, Send, RefreshCw, Phone, User, CheckCheck, Clock, Wifi, WifiOff, Trash2, X } from 'lucide-react'
import clsx from 'clsx'

// ─── Templates rápidos ────────────────────────────────────────────────────────

const TEMPLATES = [
  { id: 'nao_atendeu',   label: 'Não atendeu',      texto: 'Olá! Ligamos agora mas não conseguimos falar com você. Quando seria um bom horário para conversarmos? 📅' },
  { id: 'follow_up',     label: 'Follow-up',         texto: 'Olá! Passando para dar continuidade ao nosso contato. Tem um momento para conversarmos? 🚀' },
  { id: 'confirmacao',   label: 'Confirmar reunião', texto: 'Olá! Confirmando nossa reunião agendada. Qualquer dúvida é só responder aqui. Até lá! ✅' },
  { id: 'reagendamento', label: 'Reagendar',         texto: 'Olá! Preciso reagendar nossa conversa. Qual seria o melhor horário para você? 🔄' },
  { id: 'proposta',      label: 'Proposta',          texto: 'Olá! Gostaria de apresentar uma proposta para vocês. Podemos conversar? 💼' },
]

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Conversa {
  telefone:        string
  ultima_mensagem: string
  ultima_data:     string
  direcao:         'enviada' | 'recebida'
  nao_lidas:       number
  nome?:           string
  empresa?:        string
  instance_name?:  string
}

interface Mensagem {
  id:           string
  telefone:     string
  mensagem:     string
  direcao:      'enviada' | 'recebida'
  criado_em:    string
  lida?:        boolean
  usuario_email?: string
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function MensagensPage() {
  const qc = useQueryClient()
  const bottomRef = useRef<HTMLDivElement>(null)

  const [conversa, setConversa]         = useState<Conversa | null>(null)
  const [busca, setBusca]               = useState('')
  const [texto, setTexto]               = useState('')
  const [enviando, setEnviando]         = useState(false)
  const [toastMsg, setToastMsg]         = useState<string | null>(null)
  const [waStatus, setWaStatus]         = useState<'conectado' | 'desconectado' | 'verificando'>('verificando')
  const [confirmApagar, setConfirmApagar] = useState<Conversa | null>(null)
  const [apagando, setApagando]         = useState(false)
  const [hoverTel, setHoverTel]         = useState<string | null>(null)

  function toast(m: string) { setToastMsg(m); setTimeout(() => setToastMsg(null), 4000) }

  // Status WA + configurar webhook ao montar
  useEffect(() => {
    whatsappUsuarioApi.status()
      .then(r => setWaStatus((r.data as any).conectado ? 'conectado' : 'desconectado'))
      .catch(() => setWaStatus('desconectado'))

    // Garante que o webhook está configurado na instância existente
    whatsappUsuarioApi.configurarWebhook().catch(() => {})
  }, [])

  // Lista de conversas — polling a cada 5s
  const { data: conversas = [], isLoading: loadingConversas } = useQuery({
    queryKey: ['wa-conversas'],
    queryFn:  () => whatsappUsuarioApi.conversas().then(r => r.data as Conversa[]),
    refetchInterval: 5000,
  })

  // Histórico da conversa ativa — polling a cada 3s
  const { data: mensagens = [] } = useQuery({
    queryKey: ['wa-historico', conversa?.telefone],
    queryFn:  () => conversa
      ? whatsappUsuarioApi.historico(conversa.telefone).then(r => r.data as Mensagem[])
      : Promise.resolve([]),
    enabled:        !!conversa,
    refetchInterval: 3000,
  })

  // Rola para o final quando chegam novas mensagens
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens.length])

  // Marca como lida ao abrir conversa
  useEffect(() => {
    if (!conversa) return
    whatsappUsuarioApi.marcarLida(conversa.telefone)
      .then(() => qc.invalidateQueries({ queryKey: ['wa-conversas'] }))
      .catch(() => {})
  }, [conversa?.telefone]) // eslint-disable-line

  async function enviar() {
    if (!conversa || !texto.trim()) return
    setEnviando(true)
    try {
      await whatsappUsuarioApi.enviar({ telefone: conversa.telefone, mensagem: texto.trim() })
      setTexto('')
      qc.invalidateQueries({ queryKey: ['wa-historico', conversa.telefone] })
      qc.invalidateQueries({ queryKey: ['wa-conversas'] })
    } catch (e: any) {
      const err = e?.response?.data?.error ?? 'Erro ao enviar'
      if (err.includes('não conectado')) {
        toast('WhatsApp desconectado — reconecte em Configurações → Meu WhatsApp')
        setWaStatus('desconectado')
      } else {
        toast('Erro: ' + err)
      }
    } finally {
      setEnviando(false)
    }
  }

  async function apagarConversa(c: Conversa) {
    setApagando(true)
    try {
      await whatsappUsuarioApi.apagarConversa(c.telefone)
      if (conversa?.telefone === c.telefone) setConversa(null)
      qc.invalidateQueries({ queryKey: ['wa-conversas'] })
      qc.removeQueries({ queryKey: ['wa-historico', c.telefone] })
      toast('Conversa apagada')
    } catch {
      toast('Erro ao apagar conversa')
    } finally {
      setApagando(false)
      setConfirmApagar(null)
    }
  }

  const conversasFiltradas = conversas.filter(c => {
    if (!busca.trim()) return true
    const q = busca.toLowerCase()
    return (
      c.telefone.includes(q) ||
      c.nome?.toLowerCase().includes(q) ||
      c.empresa?.toLowerCase().includes(q)
    )
  })

  const totalNaoLidas = conversas.reduce((a, c) => a + c.nao_lidas, 0)

  function nomeExibido(c: Conversa) {
    return c.nome ?? c.empresa ?? c.telefone
  }

  function iniciais(c: Conversa) {
    const n = c.nome ?? c.empresa ?? ''
    return n.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() || '?'
  }

  function formatData(iso: string) {
    const d = new Date(iso)
    const hoje = new Date()
    if (d.toDateString() === hoje.toDateString())
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <MessageSquare size={20} className="text-emerald-600"/>
          <div>
            <h1 className="text-base font-semibold text-gray-900">Mensagens WhatsApp</h1>
            <p className="text-xs text-gray-400">
              {totalNaoLidas > 0
                ? `${totalNaoLidas} mensagem${totalNaoLidas > 1 ? 'ns' : ''} não lida${totalNaoLidas > 1 ? 's' : ''}`
                : 'Todas as conversas em dia'}
            </p>
          </div>
        </div>
        <div className={clsx(
          'flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full',
          waStatus === 'conectado'    ? 'bg-emerald-50 text-emerald-700' :
          waStatus === 'verificando'  ? 'bg-gray-50 text-gray-400' :
                                        'bg-red-50 text-red-600'
        )}>
          {waStatus === 'conectado'
            ? <><Wifi size={12}/> Conectado</>
            : waStatus === 'verificando'
              ? <><RefreshCw size={12} className="animate-spin"/> Verificando…</>
              : <><WifiOff size={12}/> Desconectado</>
          }
        </div>
      </div>

      {/* Aviso WA desconectado */}
      {waStatus === 'desconectado' && (
        <div className="mx-6 mt-3 flex-shrink-0 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 flex items-center gap-2">
          <WifiOff size={14} className="text-amber-600 flex-shrink-0"/>
          <span>
            Seu WhatsApp está desconectado.{' '}
            <a href="/config" className="font-semibold underline">
              Reconecte em Configurações → Meu WhatsApp
            </a>{' '}
            para enviar e receber mensagens.
          </span>
        </div>
      )}

      {/* Corpo principal */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Lista de conversas ── */}
        <div className="w-80 flex-shrink-0 border-r border-gray-100 flex flex-col bg-white">
          {/* Busca */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input className="input pl-9 text-xs py-1.5" placeholder="Buscar contato ou número..."
                value={busca} onChange={e => setBusca(e.target.value)}/>
            </div>
          </div>

          {/* Lista */}
          <div className="flex-1 overflow-y-auto">
            {loadingConversas && conversas.length === 0 && (
              <div className="flex items-center justify-center py-12 text-gray-400">
                <RefreshCw size={16} className="animate-spin mr-2"/> Carregando…
              </div>
            )}
            {!loadingConversas && conversas.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <MessageSquare size={28} className="text-gray-300 mb-2"/>
                <p className="text-sm font-medium text-gray-500">Nenhuma conversa ainda</p>
                <p className="text-xs text-gray-400 mt-1">
                  As confirmações de reunião enviadas pelo agente aparecerão aqui
                </p>
              </div>
            )}
            {conversasFiltradas.map(c => (
              <div
                key={c.telefone}
                className="relative"
                onMouseEnter={() => setHoverTel(c.telefone)}
                onMouseLeave={() => setHoverTel(null)}
              >
                <button
                  onClick={() => setConversa(c)}
                  className={clsx(
                    'w-full flex items-start gap-3 px-4 py-3 border-b border-gray-50 text-left transition-colors',
                    conversa?.telefone === c.telefone
                      ? 'bg-emerald-50 border-l-2 border-l-emerald-500'
                      : 'hover:bg-gray-50'
                  )}
                >
                  {/* Avatar */}
                  <div className={clsx(
                    'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold',
                    c.nao_lidas > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                  )}>
                    {iniciais(c)}
                  </div>
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-baseline justify-between gap-1">
                      <span className={clsx('text-sm truncate', c.nao_lidas > 0 ? 'font-semibold text-gray-900' : 'font-medium text-gray-700')}>
                        {nomeExibido(c)}
                      </span>
                      <span className="text-2xs text-gray-400 flex-shrink-0">{formatData(c.ultima_data)}</span>
                    </div>
                    {c.empresa && c.nome && (
                      <p className="text-2xs text-gray-400 truncate">{c.empresa}</p>
                    )}
                    <div className="flex items-center justify-between mt-0.5">
                      <p className={clsx('text-xs truncate', c.nao_lidas > 0 ? 'text-gray-700 font-medium' : 'text-gray-400')}>
                        {c.direcao === 'enviada' && <CheckCheck size={11} className="inline mr-0.5 text-emerald-500"/>}
                        {c.ultima_mensagem || <span className="italic text-gray-300">Sem prévia</span>}
                      </p>
                      {c.nao_lidas > 0 && (
                        <span className="ml-1 flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500 text-white text-2xs font-bold flex items-center justify-center">
                          {c.nao_lidas > 9 ? '9+' : c.nao_lidas}
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                {/* Botão apagar — aparece no hover */}
                {hoverTel === c.telefone && (
                  <button
                    onClick={e => { e.stopPropagation(); setConfirmApagar(c) }}
                    title="Apagar conversa"
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors z-10"
                  >
                    <Trash2 size={14}/>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Chat ── */}
        <div className="flex-1 flex flex-col bg-gray-50 min-w-0">
          {!conversa ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
                <MessageSquare size={28} className="text-emerald-400"/>
              </div>
              <h3 className="text-base font-semibold text-gray-700">Selecione uma conversa</h3>
              <p className="text-sm text-gray-400 mt-1 max-w-xs">
                Clique em uma conversa à esquerda para abrir o histórico e continuar a troca de mensagens.
              </p>
            </div>
          ) : (
            <>
              {/* Header da conversa */}
              <div className="flex items-center gap-3 px-5 py-3 bg-white border-b border-gray-100 flex-shrink-0">
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold flex items-center justify-center">
                  {iniciais(conversa)}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-900">{nomeExibido(conversa)}</div>
                  <div className="text-xs text-gray-400 flex items-center gap-1">
                    <Phone size={10}/> {conversa.telefone}
                    {conversa.empresa && conversa.nome && <span> · {conversa.empresa}</span>}
                  </div>
                </div>
                {/* Templates rápidos */}
                <div className="flex items-center gap-1.5">
                  <span className="text-2xs text-gray-400 mr-1">Modelos:</span>
                  {TEMPLATES.map(t => (
                    <button key={t.id} onClick={() => setTexto(t.texto)}
                      className="text-2xs px-2 py-1 rounded-lg border border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50 text-gray-600 hover:text-emerald-700 transition-colors">
                      {t.label}
                    </button>
                  ))}
                </div>
                {/* Apagar conversa no header */}
                <button
                  onClick={() => setConfirmApagar(conversa)}
                  title="Apagar conversa"
                  className="ml-2 w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                >
                  <Trash2 size={15}/>
                </button>
              </div>

              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-2">
                {mensagens.length === 0 && (
                  <div className="flex items-center justify-center py-8 text-gray-400 text-xs">
                    <Clock size={13} className="mr-1.5"/> Nenhuma mensagem nesta conversa
                  </div>
                )}
                {mensagens.map((m, i) => {
                  const enviada = m.direcao === 'enviada'
                  const showDate = i === 0 || new Date(m.criado_em).toDateString() !== new Date(mensagens[i-1].criado_em).toDateString()
                  return (
                    <div key={m.id ?? i}>
                      {showDate && (
                        <div className="flex items-center gap-3 my-3">
                          <div className="flex-1 h-px bg-gray-200"/>
                          <span className="text-2xs text-gray-400 font-medium">
                            {new Date(m.criado_em).toLocaleDateString('pt-BR', { weekday:'short', day:'2-digit', month:'short' })}
                          </span>
                          <div className="flex-1 h-px bg-gray-200"/>
                        </div>
                      )}
                      <div className={clsx('flex', enviada ? 'justify-end' : 'justify-start')}>
                        {!enviada && (
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center mr-2 flex-shrink-0 self-end">
                            <User size={11} className="text-gray-500"/>
                          </div>
                        )}
                        <div className={clsx(
                          'max-w-[65%] rounded-2xl px-3.5 py-2.5 shadow-sm',
                          enviada
                            ? 'bg-emerald-600 text-white rounded-br-sm'
                            : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'
                        )}>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.mensagem}</p>
                          <div className={clsx('flex items-center justify-end gap-1 mt-1', enviada ? 'text-emerald-200' : 'text-gray-400')}>
                            <span className="text-2xs">
                              {new Date(m.criado_em).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })}
                            </span>
                            {enviada && <CheckCheck size={11}/>}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef}/>
              </div>

              {/* Campo de envio */}
              <div className="flex-shrink-0 bg-white border-t border-gray-100 px-5 py-3">
                <div className="flex items-end gap-3">
                  <textarea
                    className="flex-1 input min-h-[44px] max-h-32 resize-none text-sm py-2.5"
                    placeholder="Digite uma mensagem..."
                    value={texto}
                    onChange={e => setTexto(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() }
                    }}
                  />
                  <button onClick={enviar}
                    disabled={enviando || !texto.trim() || waStatus !== 'conectado'}
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-40"
                    style={{ backgroundColor: '#25d366', color: 'white' }}>
                    {enviando
                      ? <RefreshCw size={16} className="animate-spin"/>
                      : <Send size={16}/>}
                  </button>
                </div>
                <p className="text-2xs text-gray-400 mt-1.5">Enter para enviar · Shift+Enter para nova linha</p>
              </div>
            </>
          )}
        </div>

      </div>

      {/* Modal confirmar apagar */}
      {confirmApagar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 size={18} className="text-red-600"/>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Apagar conversa?</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Todas as mensagens com{' '}
                  <span className="font-medium text-gray-700">
                    {confirmApagar.nome ?? confirmApagar.empresa ?? confirmApagar.telefone}
                  </span>{' '}
                  serão apagadas permanentemente do sistema.
                </p>
              </div>
              <button onClick={() => setConfirmApagar(null)} className="ml-auto text-gray-400 hover:text-gray-600">
                <X size={16}/>
              </button>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmApagar(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
                Cancelar
              </button>
              <button onClick={() => apagarConversa(confirmApagar)}
                disabled={apagando}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2">
                {apagando ? <RefreshCw size={13} className="animate-spin"/> : <Trash2 size={13}/>}
                Apagar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium bg-gray-900 text-white max-w-sm">
          {toastMsg}
        </div>
      )}
    </div>
  )
}
