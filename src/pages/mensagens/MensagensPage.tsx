import { useState, useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { whatsappUsuarioApi } from '@/services/api'
import {
  MessageSquare, Search, Send, RefreshCw, Phone, User,
  CheckCheck, Clock, Wifi, WifiOff, Trash2, X, AlertCircle,
  Settings, Paperclip, FileText, Mic, Square
} from 'lucide-react'
import clsx from 'clsx'
import { useNavigate } from 'react-router-dom'

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
  id:              string
  telefone:        string
  mensagem:        string
  media_url?:      string
  direcao:         'enviada' | 'recebida'
  criado_em:       string
  lida?:           boolean
  usuario_email?:  string
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function MensagensPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const bottomRef = useRef<HTMLDivElement>(null)
  const prevNaoLidasRef = useRef<number>(-1)

  // Som de notificação usando Audio element (mais confiável que Web Audio API)
  // WAV mínimo 440Hz gerado inline
  function playNotificationSound() {
    try {
      const sampleRate = 8000
      const duration   = 0.25
      const freq       = 880
      const numSamples = Math.floor(sampleRate * duration)
      const buf        = new ArrayBuffer(44 + numSamples)
      const view       = new DataView(buf)
      const write      = (off: number, str: string) => { for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i)) }
      write(0, 'RIFF'); view.setUint32(4, 36 + numSamples, true)
      write(8, 'WAVE'); write(12, 'fmt ')
      view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true)
      view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate, true)
      view.setUint16(32, 1, true); view.setUint16(34, 8, true)
      write(36, 'data'); view.setUint32(40, numSamples, true)
      for (let i = 0; i < numSamples; i++) {
        const envelope = i < numSamples * 0.1 ? i / (numSamples * 0.1)
          : i > numSamples * 0.7 ? 1 - (i - numSamples * 0.7) / (numSamples * 0.3) : 1
        view.setUint8(44 + i, Math.round(128 + 80 * envelope * Math.sin(2 * Math.PI * freq * i / sampleRate)))
      }
      const blob = new Blob([buf], { type: 'audio/wav' })
      const url  = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audio.volume = 0.5
      audio.play().catch(() => {})
      audio.onended = () => URL.revokeObjectURL(url)
    } catch (_) {}
  }

  const [conversa, setConversa]           = useState<Conversa | null>(null)
  const [busca, setBusca]                 = useState('')
  const [texto, setTexto]                 = useState('')
  const [enviando, setEnviando]           = useState(false)
  const [toastMsg, setToastMsg]           = useState<string | null>(null)
  const [waStatus, setWaStatus]           = useState<'conectado' | 'desconectado' | 'verificando'>('verificando')
  const [confirmApagar, setConfirmApagar] = useState<Conversa | null>(null)
  const [apagando, setApagando]           = useState(false)
  const [hoverTel, setHoverTel]           = useState<string | null>(null)
  const fileInputRef                       = useRef<HTMLInputElement>(null)
  const mediaRecorderRef                   = useRef<MediaRecorder | null>(null)
  const audioChunksRef                     = useRef<Blob[]>([])
  const [gravando, setGravando]            = useState(false)

  function toast(m: string) { setToastMsg(m); setTimeout(() => setToastMsg(null), 4000) }

  async function enviarMidia(file: File) {
    if (!conversa) return
    setEnviando(true)
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload  = () => resolve(reader.result as string)
        reader.onerror = () => reject(new Error('Erro ao ler arquivo'))
        reader.readAsDataURL(file)
      })
      await whatsappUsuarioApi.enviarMidia({
        telefone: conversa.telefone,
        base64,
        mimeType: file.type,
        fileName: file.name,
      })
      qc.invalidateQueries({ queryKey: ['wa-historico', conversa.telefone] })
      qc.invalidateQueries({ queryKey: ['wa-conversas'] })
    } catch (e: any) {
      toast('Erro ao enviar arquivo: ' + (e?.response?.data?.error ?? e?.message ?? 'desconhecido'))
    } finally {
      setEnviando(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  useEffect(() => {
    whatsappUsuarioApi.status()
      .then(r => setWaStatus((r.data as any).conectado ? 'conectado' : 'desconectado'))
      .catch(() => setWaStatus('desconectado'))
  }, [])

  const { data: conversas = [], isLoading: loadingConversas } = useQuery({
    queryKey: ['wa-conversas'],
    queryFn:  () => whatsappUsuarioApi.conversas().then(r => r.data as Conversa[]),
    refetchInterval: 5000,
  })

  const { data: mensagens = [] } = useQuery({
    queryKey: ['wa-historico', conversa?.telefone],
    queryFn:  () => conversa
      ? whatsappUsuarioApi.historico(conversa.telefone).then(r => r.data as Mensagem[])
      : Promise.resolve([]),
    enabled:         !!conversa,
    refetchInterval: 3000,
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens.length])

  // Toca som quando chega nova mensagem não lida
  useEffect(() => {
    const total = conversas.reduce((acc: number, c: Conversa) => acc + (c.nao_lidas || 0), 0)
    if (prevNaoLidasRef.current >= 0 && total > prevNaoLidasRef.current) {
      playNotificationSound()
    }
    prevNaoLidasRef.current = total
  }, [conversas])

  useEffect(() => {
    if (!conversa) return
    whatsappUsuarioApi.marcarLida(conversa.telefone)
      .then(() => qc.invalidateQueries({ queryKey: ['wa-conversas'] }))
      .catch(() => {})
  }, [conversa?.telefone]) // eslint-disable-line

  async function iniciarGravacao() {
    if (!conversa) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      audioChunksRef.current = []
      mr.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const mimeType = mr.mimeType || 'audio/webm'
        const blob = new Blob(audioChunksRef.current, { type: mimeType })
        const file = new File([blob], 'audio.webm', { type: mimeType })
        await enviarMidia(file)
      }
      mr.start()
      mediaRecorderRef.current = mr
      setGravando(true)
    } catch {
      toast('Permissão de microfone negada')
    }
  }

  function pararGravacao() {
    mediaRecorderRef.current?.stop()
    mediaRecorderRef.current = null
    setGravando(false)
  }

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
      toast(err.includes('não conectado') ? 'WhatsApp desconectado — reconecte em Configurações' : 'Erro: ' + err)
      if (err.includes('não conectado')) setWaStatus('desconectado')
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
    return c.telefone.includes(q) || c.nome?.toLowerCase().includes(q) || c.empresa?.toLowerCase().includes(q)
  })

  const totalNaoLidas = conversas.reduce((a, c) => a + c.nao_lidas, 0)

  function nomeExibido(c: Conversa) { return c.nome ?? c.empresa ?? c.telefone }

  function iniciais(c: Conversa) {
    const n = c.nome ?? c.empresa ?? ''
    return n.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() || '?'
  }

  function formatData(iso: string) {
    const d = new Date(iso), hoje = new Date()
    if (d.toDateString() === hoje.toDateString())
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col bg-gray-50">

      {/* ── Banner WA desconectado (topo, integrado) ── */}
      {waStatus === 'desconectado' && (
        <div className="flex items-center gap-3 px-5 py-2.5 bg-amber-50 border-b border-amber-200 flex-shrink-0">
          <AlertCircle size={15} className="text-amber-500 flex-shrink-0"/>
          <p className="text-xs text-amber-800 flex-1">
            Seu WhatsApp está desconectado.{' '}
            <span className="font-semibold">As mensagens enviadas pelo agente ficam salvas, mas você não pode responder.</span>
          </p>
          <button
            onClick={() => navigate('/config')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-colors flex-shrink-0"
          >
            <Settings size={12}/> Reconectar
          </button>
        </div>
      )}

      {/* ── Layout principal ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ────────────────────── Sidebar ────────────────────── */}
        <div className="w-72 flex-shrink-0 border-r border-gray-200 flex flex-col bg-white">

          {/* Cabeçalho sidebar */}
          <div className="px-4 pt-5 pb-3 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MessageSquare size={16} className="text-brand-500"/>
                <h1 className="text-sm font-semibold text-gray-900">WhatsApp</h1>
                {totalNaoLidas > 0 && (
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-500 text-white text-2xs font-bold">
                    {totalNaoLidas > 9 ? '9+' : totalNaoLidas}
                  </span>
                )}
              </div>
              <div className={clsx(
                'flex items-center gap-1 text-2xs font-medium px-2 py-0.5 rounded-full',
                waStatus === 'conectado'   ? 'bg-emerald-50 text-emerald-700' :
                waStatus === 'verificando' ? 'bg-gray-100 text-gray-400' :
                                             'bg-red-50 text-red-500'
              )}>
                {waStatus === 'conectado'
                  ? <><Wifi size={10}/> Conectado</>
                  : waStatus === 'verificando'
                    ? <><RefreshCw size={10} className="animate-spin"/> Verificando</>
                    : <><WifiOff size={10}/> Desconectado</>
                }
              </div>
            </div>
            {/* Busca */}
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input
                className="w-full pl-8 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-brand-400 focus:bg-white transition-colors"
                placeholder="Buscar conversa..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
              />
            </div>
          </div>

          {/* Lista */}
          <div className="flex-1 overflow-y-auto">
            {loadingConversas && conversas.length === 0 && (
              <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
                <RefreshCw size={14} className="animate-spin"/> <span className="text-xs">Carregando…</span>
              </div>
            )}

            {!loadingConversas && conversas.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 px-5 text-center">
                <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center mb-3">
                  <MessageSquare size={20} className="text-brand-400"/>
                </div>
                <p className="text-xs font-semibold text-gray-600">Nenhuma conversa ainda</p>
                <p className="text-2xs text-gray-400 mt-1 leading-relaxed">
                  Confirmações de reunião agendadas pelo agente aparecerão aqui
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
                    'w-full flex items-center gap-3 px-4 py-3 border-b border-gray-50 text-left transition-all',
                    conversa?.telefone === c.telefone
                      ? 'bg-brand-50 border-l-2 border-l-brand-500'
                      : 'hover:bg-gray-50'
                  )}
                >
                  {/* Avatar */}
                  <div className={clsx(
                    'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold',
                    c.nao_lidas > 0
                      ? 'bg-brand-100 text-brand-700'
                      : conversa?.telefone === c.telefone
                        ? 'bg-brand-200 text-brand-700'
                        : 'bg-gray-100 text-gray-500'
                  )}>
                    {iniciais(c)}
                  </div>

                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-baseline justify-between gap-1 mb-0.5">
                      <span className={clsx(
                        'text-xs truncate',
                        c.nao_lidas > 0 ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
                      )}>
                        {nomeExibido(c)}
                      </span>
                      <span className="text-2xs text-gray-400 flex-shrink-0">{formatData(c.ultima_data)}</span>
                    </div>
                    {c.empresa && c.nome && (
                      <p className="text-2xs text-gray-400 truncate mb-0.5">{c.empresa}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <p className={clsx('text-2xs truncate', c.nao_lidas > 0 ? 'text-gray-600 font-medium' : 'text-gray-400')}>
                        {c.direcao === 'enviada' && <CheckCheck size={10} className="inline mr-0.5 text-brand-400"/>}
                        {c.ultima_mensagem || <span className="italic text-gray-300">Sem prévia</span>}
                      </p>
                      {c.nao_lidas > 0 && (
                        <span className="ml-1 w-4 h-4 rounded-full bg-brand-500 text-white text-2xs font-bold flex items-center justify-center flex-shrink-0">
                          {c.nao_lidas > 9 ? '9+' : c.nao_lidas}
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                {/* Botão apagar (hover) */}
                {hoverTel === c.telefone && (
                  <button
                    onClick={e => { e.stopPropagation(); setConfirmApagar(c) }}
                    title="Apagar conversa"
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors z-10"
                  >
                    <Trash2 size={12}/>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ────────────────────── Chat ────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">
          {!conversa ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center h-full text-center px-8 bg-gray-50">
              <div className="w-20 h-20 rounded-3xl bg-white border border-gray-200 shadow-card flex items-center justify-center mb-5">
                <MessageSquare size={32} className="text-brand-300"/>
              </div>
              <h3 className="text-base font-semibold text-gray-700 mb-1">Selecione uma conversa</h3>
              <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
                Clique em uma conversa à esquerda para abrir o histórico. As confirmações enviadas pelo agente já aparecem aqui automaticamente.
              </p>
            </div>
          ) : (
            <div className="flex flex-col h-full bg-white">
              {/* Header conversa */}
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 flex-shrink-0 bg-white">
                <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {iniciais(conversa)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{nomeExibido(conversa)}</p>
                  <p className="text-2xs text-gray-400 flex items-center gap-1">
                    <Phone size={9}/> {conversa.telefone}
                    {conversa.empresa && conversa.nome && <> · <span>{conversa.empresa}</span></>}
                  </p>
                </div>

                {/* Templates rápidos */}
                <div className="hidden lg:flex items-center gap-1.5 mr-2">
                  <span className="text-2xs text-gray-400">Modelo:</span>
                  {TEMPLATES.map(t => (
                    <button key={t.id} onClick={() => setTexto(t.texto)}
                      className="text-2xs px-2 py-1 rounded-lg border border-gray-200 bg-white hover:border-brand-300 hover:bg-brand-50 text-gray-500 hover:text-brand-700 transition-colors">
                      {t.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setConfirmApagar(conversa)}
                  title="Apagar conversa"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                >
                  <Trash2 size={14}/>
                </button>
              </div>

              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-2 bg-gray-50">
                {mensagens.length === 0 && (
                  <div className="flex items-center justify-center py-10 text-gray-400 gap-1.5">
                    <Clock size={13}/> <span className="text-xs">Nenhuma mensagem ainda</span>
                  </div>
                )}
                {mensagens.map((m, i) => {
                  const enviada = m.direcao === 'enviada'
                  const showDate = i === 0 ||
                    new Date(m.criado_em).toDateString() !== new Date(mensagens[i - 1].criado_em).toDateString()
                  return (
                    <div key={m.id ?? i}>
                      {showDate && (
                        <div className="flex items-center gap-3 my-3">
                          <div className="flex-1 h-px bg-gray-200"/>
                          <span className="text-2xs text-gray-400 font-medium px-1">
                            {new Date(m.criado_em).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
                          </span>
                          <div className="flex-1 h-px bg-gray-200"/>
                        </div>
                      )}
                      <div className={clsx('flex', enviada ? 'justify-end' : 'justify-start')}>
                        {!enviada && (
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center mr-2 flex-shrink-0 self-end mb-0.5">
                            <User size={11} className="text-gray-500"/>
                          </div>
                        )}
                        <div className={clsx(
                          'max-w-[62%] rounded-2xl px-3.5 py-2.5 shadow-sm',
                          enviada
                            ? 'bg-brand-600 text-white rounded-br-sm'
                            : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'
                        )}>
                          {/* Renderização de mídia */}
                          {m.media_url && (() => {
                            const url = m.media_url
                            const isImg  = /^data:image|\.jpe?g$|\.png$|\.gif$|\.webp$/i.test(url) && !/audio|video/.test(url)
                            const isAud  = /^data:audio|\.mp3$|\.ogg$|\.wav$|\.m4a$|\.webm$|\/audio\//i.test(url)
                            const isVid  = /^data:video|\.mp4$/i.test(url)
                            if (isImg) return (
                              <a href={url} target="_blank" rel="noopener noreferrer" className="block mb-1.5">
                                <img src={url} alt="mídia" className="max-w-full rounded-lg max-h-64 object-cover"/>
                              </a>
                            )
                            if (isAud) return (
                              <div className="mb-1.5 w-56">
                                <audio controls src={url} className="w-full h-8" style={{ minWidth: 200 }}/>
                              </div>
                            )
                            if (isVid) return (
                              <video controls src={url} className="max-w-full rounded-lg max-h-48 mb-1.5"/>
                            )
                            // Documento genérico
                            const nome = url.split('/').pop()?.split('?')[0] || 'arquivo'
                            return (
                              <a href={url} download={nome} target="_blank" rel="noopener noreferrer"
                                className={clsx(
                                  'flex items-center gap-2 mb-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors',
                                  enviada ? 'bg-brand-500 hover:bg-brand-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                )}>
                                <FileText size={14} className="flex-shrink-0"/>
                                <span className="truncate max-w-[160px]">{nome}</span>
                              </a>
                            )
                          })()}
                          {/* Texto da mensagem — oculta labels automáticas quando há mídia */}
                          {(!m.media_url || !['[Imagem enviada]','[Áudio enviado]','[Vídeo enviado]','[Imagem recebida]','[Áudio recebido]','[Vídeo recebido]','[Mídia recebida]'].includes(m.mensagem)) && (
                            <p className="text-xs leading-relaxed whitespace-pre-wrap">{m.mensagem}</p>
                          )}
                          <div className={clsx(
                            'flex items-center justify-end gap-1 mt-1',
                            enviada ? 'text-brand-200' : 'text-gray-400'
                          )}>
                            <span className="text-2xs">
                              {new Date(m.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
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
                {/* Templates móvel */}
                <div className="lg:hidden flex gap-1.5 mb-2 overflow-x-auto pb-1">
                  {TEMPLATES.map(t => (
                    <button key={t.id} onClick={() => setTexto(t.texto)}
                      className="text-2xs px-2 py-1 rounded-lg border border-gray-200 whitespace-nowrap hover:border-brand-300 hover:bg-brand-50 text-gray-500 hover:text-brand-700 transition-colors">
                      {t.label}
                    </button>
                  ))}
                </div>
                {/* Input file oculto */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) enviarMidia(f) }}
                />
                <div className="flex items-end gap-2.5">
                  {/* Botão anexar */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={enviando || waStatus !== 'conectado'}
                    title="Enviar arquivo"
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Paperclip size={15}/>
                  </button>
                  <textarea
                    className="flex-1 px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl resize-none min-h-[42px] max-h-28 focus:outline-none focus:border-brand-400 focus:bg-white transition-colors"
                    placeholder={waStatus === 'conectado' ? 'Digite uma mensagem…' : 'WhatsApp desconectado'}
                    value={texto}
                    onChange={e => setTexto(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() }
                    }}
                  />
                  {/* Botão gravar áudio */}
                  <button
                    onClick={gravando ? pararGravacao : iniciarGravacao}
                    disabled={enviando || waStatus !== 'conectado'}
                    title={gravando ? 'Parar gravação' : 'Gravar áudio'}
                    className={clsx(
                      'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
                      gravando
                        ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                        : 'border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                    )}
                  >
                    {gravando ? <Square size={13} fill="currentColor"/> : <Mic size={15}/>}
                  </button>
                  <button
                    onClick={enviar}
                    disabled={enviando || !texto.trim() || waStatus !== 'conectado'}
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-brand-500 hover:bg-brand-600 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {enviando ? <RefreshCw size={15} className="animate-spin"/> : <Send size={15}/>}
                  </button>
                </div>
                <p className="text-2xs text-gray-400 mt-1.5">Enter para enviar · Shift+Enter para nova linha · 📎 para anexar</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal confirmar apagar ── */}
      {confirmApagar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-popup p-6 max-w-sm w-full mx-4 animate-slide-up">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <Trash2 size={18} className="text-red-500"/>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900">Apagar conversa?</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Todas as mensagens com{' '}
                  <span className="font-semibold text-gray-700">
                    {confirmApagar.nome ?? confirmApagar.empresa ?? confirmApagar.telefone}
                  </span>{' '}
                  serão removidas permanentemente.
                </p>
              </div>
              <button onClick={() => setConfirmApagar(null)}
                className="text-gray-300 hover:text-gray-500 transition-colors mt-0.5">
                <X size={16}/>
              </button>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmApagar(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
                Cancelar
              </button>
              <button onClick={() => apagarConversa(confirmApagar)} disabled={apagando}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 transition-colors flex items-center gap-1.5">
                {apagando ? <RefreshCw size={12} className="animate-spin"/> : <Trash2 size={12}/>}
                Apagar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-popup text-xs font-medium bg-gray-900 text-white max-w-xs animate-slide-up">
          {toastMsg}
        </div>
      )}
    </div>
  )
}
