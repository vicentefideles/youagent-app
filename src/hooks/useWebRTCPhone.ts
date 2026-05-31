/**
 * useWebRTCPhone — hook para chamadas via Telnyx WebRTC no browser
 *
 * Fluxo:
 *  1. init() → busca credenciais SIP no backend → conecta ao Telnyx
 *  2. dial(numero) → inicia chamada para o cliente (browser = telefone do vendedor)
 *  3. hangup() → encerra chamada
 *  4. Estados da chamada via eventos do SDK
 *
 * Pré-requisito Telnyx: TELNYX_SIP_CONNECTION_ID deve ser uma
 * Credential-Based SIP Connection no painel Telnyx.
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { webrtcApi, ligacoesApi } from '@/services/api'

export type WebRTCStatus =
  | 'idle'           // não inicializado
  | 'initializing'   // buscando credenciais
  | 'connecting'     // conectando ao Telnyx
  | 'ready'          // pronto para ligar
  | 'ringing'        // discando (tocando no cliente)
  | 'active'         // em chamada (cliente atendeu)
  | 'hangup'         // chamada encerrada
  | 'error'          // erro de conexão

export interface WebRTCPhoneState {
  status: WebRTCStatus
  error: string | null
  setupRequired: boolean   // true = falta TELNYX_SIP_CONNECTION_ID
  muted: boolean
  held: boolean
  timer: number
}

export interface WebRTCPhoneActions {
  init: () => Promise<boolean>
  dial: (numero: string, opts?: { motivo?: string; anotacao?: string; contato_id?: string }) => Promise<string | null>
  hangup: () => void
  toggleMute: () => void
  toggleHold: () => void
  sendDtmf: (digit: string) => void
  reset: () => void
}

export function useWebRTCPhone(): [WebRTCPhoneState, WebRTCPhoneActions] {
  const [status, setStatus]               = useState<WebRTCStatus>('idle')
  const [error, setError]                 = useState<string | null>(null)
  const [setupRequired, setSetupRequired] = useState(false)
  const [muted, setMuted]                 = useState(false)
  const [held, setHeld]                   = useState(false)
  const [timer, setTimer]                 = useState(0)

  const clientRef       = useRef<any>(null)
  const callRef         = useRef<any>(null)
  const credIdRef       = useRef<string | null>(null)
  const callerNumberRef = useRef<string>('')
  const timerRef        = useRef<ReturnType<typeof setInterval> | null>(null)
  const ligacaoIdRef    = useRef<string | null>(null)
  // Ringback (tom de chamando) gerado via Web Audio API
  const ringbackRef     = useRef<{ stop: () => void } | null>(null)

  // Limpa timer ao desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // Tom de chamando (ringback): 425Hz, padrão brasileiro 1s ligado / 4s desligado
  function startRingback() {
    stopRingback()
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()
      oscillator.connect(gain)
      gain.connect(ctx.destination)
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(425, ctx.currentTime)
      // Padrão: 1s on, 4s off, repetindo
      let t = ctx.currentTime
      for (let i = 0; i < 60; i++) {
        gain.gain.setValueAtTime(0.15, t)
        gain.gain.setValueAtTime(0, t + 1)
        t += 5
      }
      oscillator.start()
      ringbackRef.current = { stop: () => { try { oscillator.stop(); ctx.close() } catch (_) {} } }
    } catch (_) {}
  }

  function stopRingback() {
    if (ringbackRef.current) { ringbackRef.current.stop(); ringbackRef.current = null }
  }

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setTimer(0)
    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000)
  }, [])

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }, [])

  // ── Inicializa cliente WebRTC ──────────────────────────────────────────────
  const init = useCallback(async (): Promise<boolean> => {
    if (status === 'ready' || status === 'connecting') return true
    setStatus('initializing')
    setError(null)

    try {
      const res = await webrtcApi.getToken()
      const { login, password, login_token, caller_number, credential_id, setup_required } = res.data as any

      if (setup_required) {
        setSetupRequired(true)
        setError('Conexão SIP não configurada — veja instruções abaixo')
        setStatus('error')
        return false
      }

      credIdRef.current    = credential_id
      callerNumberRef.current = caller_number || ''

      // Import dinâmico do SDK para evitar problemas de SSR/bundling
      const { TelnyxRTC } = await import('@telnyx/webrtc')

      const authConfig = login_token
        ? { login_token }
        : { login, password }

      const rtcClient = new TelnyxRTC({
        ...authConfig,
        // Habilita audio automático no browser
        ringtoneFile: '',
        ringbackFile: '',
      } as any)

      setStatus('connecting')

      // Eventos do cliente
      rtcClient.on('telnyx.ready', () => {
        console.log('[WebRTC] Conectado e pronto')
        setStatus('ready')
        setError(null)
      })

      rtcClient.on('telnyx.error', (err: any) => {
        console.error('[WebRTC] Erro:', err)
        setError(String(err?.message || err))
        setStatus('error')
      })

      rtcClient.on('telnyx.socket.close', () => {
        if (status !== 'hangup') {
          setStatus('idle')
        }
      })

      rtcClient.on('telnyx.notification', (notification: any) => {
        if (notification.type !== 'callUpdate') return
        const call = notification.call
        const callStatus = call?.state

        console.log('[WebRTC] callUpdate state:', callStatus)

        if (callStatus === 'ringing' || callStatus === 'requesting' || callStatus === 'trying') {
          callRef.current = call
          setStatus('ringing')
          startRingback()
        } else if (callStatus === 'active') {
          callRef.current = call
          stopRingback()
          setStatus('active')
          startTimer()
          // Atualiza DB: chamada atendida
          if (ligacaoIdRef.current) {
            ligacoesApi.update(ligacaoIdRef.current, { status: 'em_andamento' }).catch(() => {})
          }
        } else if (callStatus === 'hangup' || callStatus === 'destroy' || callStatus === 'purge') {
          stopRingback()
          stopTimer()
          setStatus('hangup')
          setMuted(false)
          setHeld(false)
          // Atualiza DB: chamada encerrada
          if (ligacaoIdRef.current) {
            ligacoesApi.update(ligacaoIdRef.current, { status: 'encerrada' }).catch(() => {})
          }
          callRef.current = null
        }
      })

      await rtcClient.connect()
      clientRef.current = rtcClient
      return true

    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || 'Erro desconhecido'
      const isSetup = e?.response?.data?.setup_required
      setError(msg)
      setSetupRequired(!!isSetup)
      setStatus('error')
      return false
    }
  }, [status, startTimer, stopTimer])

  // ── Inicia uma chamada ─────────────────────────────────────────────────────
  const dial = useCallback(async (
    numero: string,
    opts?: { motivo?: string; anotacao?: string; contato_id?: string }
  ): Promise<string | null> => {
    const client = clientRef.current
    // Aceita 'ready' ou 'hangup' (após encerramento de chamada anterior)
    if (!client || (status !== 'ready' && status !== 'hangup')) return null

    // Formata E.164
    const digits = numero.replace(/\D/g, '')
    let e164 = digits
    if (!numero.startsWith('+')) {
      if (digits.startsWith('55') && digits.length >= 12) e164 = `+${digits}`
      else if (digits.length === 11 || digits.length === 10) e164 = `+55${digits}`
      else e164 = `+${digits}`
    }

    // Cria registro de ligação no DB para histórico
    let ligacaoId: string | null = null
    try {
      const res = await ligacoesApi.create({
        numero_destino: e164,
        contato_id:    opts?.contato_id || undefined,
        iniciar_agora: false,   // WebRTC controla a chamada, não o backend
        tipo_ligacao:  'manual',
        motivo:        opts?.motivo || undefined,
        anotacao_pre:  opts?.anotacao || undefined,
      })
      ligacaoId = (res.data as any)?.id ?? null
      ligacaoIdRef.current = ligacaoId
    } catch (_) {}

    // Inicia chamada via WebRTC
    try {
      const call = client.newCall({
        destinationNumber: e164,
        callerNumber:      callerNumberRef.current || undefined,
      })
      callRef.current = call
      setStatus('ringing')
      return ligacaoId
    } catch (e: any) {
      setError(e?.message || 'Erro ao iniciar chamada')
      setStatus('error')
      return null
    }
  }, [status])

  // ── Controles de chamada ──────────────────────────────────────────────────
  const hangup = useCallback(() => {
    if (callRef.current) {
      try { callRef.current.hangup() } catch (_) {}
    }
    stopRingback()
    stopTimer()
    setStatus('hangup')
    setMuted(false)
    setHeld(false)
  }, [stopTimer])

  const toggleMute = useCallback(() => {
    if (!callRef.current) return
    try {
      callRef.current.toggleAudioMute()
      setMuted(m => !m)
    } catch (_) {}
  }, [])

  const toggleHold = useCallback(() => {
    if (!callRef.current) return
    try {
      if (held) {
        callRef.current.unhold?.() || callRef.current.resume?.()
      } else {
        callRef.current.hold?.()
      }
      setHeld(h => !h)
    } catch (_) {}
  }, [held])

  const sendDtmf = useCallback((digit: string) => {
    if (!callRef.current) return
    try { callRef.current.dtmf?.(digit) || callRef.current.sendDigits?.(digit) } catch (_) {}
  }, [])

  const reset = useCallback(() => {
    stopTimer()
    callRef.current = null
    ligacaoIdRef.current = null
    setStatus(clientRef.current ? 'ready' : 'idle')
    setError(null)
    setMuted(false)
    setHeld(false)
    setTimer(0)
  }, [stopTimer])

  const state: WebRTCPhoneState = { status, error, setupRequired, muted, held, timer }
  const actions: WebRTCPhoneActions = { init, dial, hangup, toggleMute, toggleHold, sendDtmf, reset }

  return [state, actions]
}
