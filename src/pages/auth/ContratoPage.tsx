import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, AlertCircle } from 'lucide-react'
import { api } from '@/services/api'

interface ContratoData {
  texto: string
  status: string
}

export default function ContratoPage() {
  const navigate = useNavigate()

  const [contrato, setContrato] = useState<ContratoData | null>(null)
  const [loadingContrato, setLoadingContrato] = useState(true)
  const [gerandoContrato, setGerandoContrato] = useState(false)
  const [assinatura, setAssinatura] = useState('')
  const [aceite, setAceite] = useState(false)
  const [erro, setErro] = useState('')
  const [assinando, setAssinando] = useState(false)

  const clienteId = localStorage.getItem('youagent_cliente_id')

  const agora = new Date().toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })

  useEffect(() => {
    if (!clienteId) {
      setLoadingContrato(false)
      setErro('Sessão expirada. Por favor, refaça o cadastro.')
      return
    }
    buscarContrato()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function buscarContrato() {
    setLoadingContrato(true)
    setErro('')
    try {
      const res = await api.get(`/clientes/${clienteId}/contrato`)
      const data = res.data as ContratoData
      setContrato(data)
    } catch {
      setErro('Não foi possível carregar o contrato.')
    } finally {
      setLoadingContrato(false)
    }
  }

  async function handleGerarContrato() {
    if (!clienteId) return
    setGerandoContrato(true)
    setErro('')
    try {
      await api.post(`/clientes/${clienteId}/gerar-contrato`, {})
      await buscarContrato()
    } catch {
      setErro('Erro ao gerar contrato. Tente novamente.')
    } finally {
      setGerandoContrato(false)
    }
  }

  async function handleAssinar() {
    if (!assinatura.trim()) {
      setErro('Por favor, digite seu nome completo')
      return
    }
    if (!aceite) {
      setErro('Você precisa marcar o checkbox de aceite')
      return
    }
    if (!clienteId) {
      setErro('Sessão expirada.')
      return
    }
    setAssinando(true)
    setErro('')
    try {
      await api.post(`/clientes/${clienteId}/assinar-contrato`, {
        nome_assinatura: assinatura,
      })
      navigate('/aguardando')
    } catch {
      setErro('Erro ao registrar assinatura. Tente novamente.')
    } finally {
      setAssinando(false)
    }
  }

  const podeAssinar = assinatura.trim().length > 0 && aceite

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl animate-fade-in">

        <div className="card p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Contrato de Prestação de Serviços</h2>
            <p className="text-sm text-gray-500 mt-1">
              Leia o contrato e assine eletronicamente para ativar sua conta
            </p>
          </div>

          {erro && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm mb-4">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {erro}
            </div>
          )}

          {/* Corpo do contrato */}
          {loadingContrato ? (
            <div className="flex items-center justify-center gap-3 py-12 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Carregando seu contrato...</span>
            </div>
          ) : contrato && contrato.status === 'contrato_gerado' ? (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 max-h-96 overflow-y-scroll text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mb-6 font-mono">
              {contrato.texto}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-8 mb-6">
              <p className="text-sm text-gray-500 text-center">
                O contrato ainda não foi gerado. Clique no botão abaixo para que nossa IA prepare o documento personalizado.
              </p>
              <button
                onClick={handleGerarContrato}
                disabled={gerandoContrato}
                className="btn-primary px-6 py-2.5 flex items-center gap-2 disabled:opacity-50"
              >
                {gerandoContrato ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Gerando contrato...
                  </>
                ) : (
                  '✨ Gerar contrato'
                )}
              </button>
            </div>
          )}

          {/* Bloco de assinatura — só exibe quando contrato está disponível */}
          {!loadingContrato && contrato && contrato.status === 'contrato_gerado' && (
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-1">Assinatura Eletrônica</p>
                <p className="text-xs text-gray-500">
                  Validade jurídica conforme MP 2.200-2/2001 e Marco Civil da Internet
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">
                  Digite seu nome completo para assinar
                </label>
                <input
                  id="ct-assinatura-nome"
                  type="text"
                  className="input"
                  placeholder="Seu nome completo"
                  value={assinatura}
                  onChange={e => { setAssinatura(e.target.value); setErro('') }}
                />
              </div>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  id="ct-aceite-check"
                  type="checkbox"
                  checked={aceite}
                  onChange={e => { setAceite(e.target.checked); setErro('') }}
                  className="mt-0.5 w-4 h-4 accent-blue-600"
                />
                <span className="text-xs text-gray-600">
                  Li, compreendi e concordo com todos os termos do contrato acima, e declaro ter poderes para
                  assiná-lo em nome da empresa indicada.
                </span>
              </label>

              <p className="text-xs text-gray-400">
                💻 🕓 {agora}
              </p>

              <button
                onClick={handleAssinar}
                disabled={!podeAssinar || assinando}
                className="btn-primary w-full py-3 text-base font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {assinando ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Registrando assinatura...
                  </>
                ) : (
                  '📝 Assinar contrato eletronicamente'
                )}
              </button>

              <p className="text-xs text-gray-400 text-center">
                Ao assinar, suas informações de IP e horário são registradas. Você receberá uma cópia por e-mail.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
