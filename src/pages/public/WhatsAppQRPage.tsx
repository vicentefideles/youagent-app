import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { MessageCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'https://app.etztech.com/api/v1'

type Tela = 'carregando' | 'qr' | 'conectado' | 'erro'

export default function WhatsAppQRPage() {
  const { token } = useParams<{ token: string }>()
  const [tela, setTela] = useState<Tela>('carregando')
  const [qr, setQr] = useState<string | null>(null)
  const [nome, setNome] = useState('')
  const [erro, setErro] = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  async function iniciar() {
    setTela('carregando')
    setErro('')
    try {
      const r = await fetch(`${API}/wqr/${token}/conectar`, { method: 'POST' })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Link inválido ou expirado')
      setQr(data.qr)
      setNome(data.nome || '')
      setTela('qr')
      pollRef.current = setInterval(async () => {
        const sr = await fetch(`${API}/wqr/${token}/status`)
        const sd = await sr.json()
        if (sd.conectado) {
          clearInterval(pollRef.current!)
          setNome(sd.nome || nome)
          setTela('conectado')
        }
      }, 3000)
    } catch (e: unknown) {
      setErro((e as Error).message)
      setTela('erro')
    }
  }

  useEffect(() => {
    iniciar()
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [token])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8">
        <div className="flex items-center justify-center gap-2 mb-6">
          <MessageCircle size={22} className="text-green-600" />
          <span className="font-bold text-gray-900 text-lg">Conectar WhatsApp</span>
        </div>

        {tela === 'carregando' && (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Gerando QR Code...</p>
          </div>
        )}

        {tela === 'qr' && qr && (
          <>
            <p className="text-sm text-gray-600 text-center mb-5">
              {nome ? <><strong>{nome}</strong> — abra o </> : 'Abra o '}
              WhatsApp no seu celular → <em>Dispositivos conectados</em> → <em>Conectar dispositivo</em> e escaneie:
            </p>
            <div className="flex justify-center mb-5">
              <img src={qr} alt="QR Code WhatsApp" className="w-56 h-56 rounded-xl border border-gray-200" />
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400 justify-center">
              <RefreshCw size={12} className="animate-spin" />
              Aguardando leitura do QR Code...
            </div>
          </>
        )}

        {tela === 'conectado' && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Wifi size={28} className="text-green-600" />
            </div>
            <p className="font-semibold text-gray-900 text-lg">WhatsApp conectado!</p>
            <p className="text-sm text-gray-500 text-center">
              {nome ? <><strong>{nome}</strong> agora</> : 'Você agora'} receberá notificações de agendamento e os clientes receberão mensagens do seu número pessoal.
            </p>
            <p className="text-xs text-gray-400 mt-2">Pode fechar esta página.</p>
          </div>
        )}

        {tela === 'erro' && (
          <div className="flex flex-col items-center gap-4 py-6">
            <WifiOff size={28} className="text-red-500" />
            <p className="text-sm text-red-600 text-center">{erro}</p>
            <button
              onClick={iniciar}
              className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
            >
              Tentar novamente
            </button>
          </div>
        )}

        <p className="text-center text-xs text-gray-300 mt-6">ETZ — Agendamento Inteligente</p>
      </div>
    </div>
  )
}
