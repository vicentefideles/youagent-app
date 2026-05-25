import { useState, useEffect } from 'react'
import { Phone, Search, CheckCircle, Clock, AlertCircle, ChevronRight } from 'lucide-react'
import { telnyxApi } from '@/services/api'

// DDDs principais do Brasil
const DDDS = [
  { value: '11', label: '11 — São Paulo' },
  { value: '21', label: '21 — Rio de Janeiro' },
  { value: '31', label: '31 — Belo Horizonte' },
  { value: '41', label: '41 — Curitiba' },
  { value: '51', label: '51 — Porto Alegre' },
  { value: '47', label: '47 — Blumenau/Joinville' },
  { value: '61', label: '61 — Brasília' },
  { value: '71', label: '71 — Salvador' },
  { value: '81', label: '81 — Recife' },
  { value: '85', label: '85 — Fortaleza' },
  { value: '91', label: '91 — Belém' },
  { value: '62', label: '62 — Goiânia' },
  { value: '19', label: '19 — Campinas' },
  { value: '13', label: '13 — Santos/Litoral SP' },
]

interface NumeroDisponivel {
  numero: string
  tipo: string
  preco_mes: number
}

interface Solicitacao {
  status: string
  numero_solicitado?: string
  ddd?: string
  motivo_rejeicao?: string
  numero_aprovado?: string
}

type Etapa = 'escolher' | 'confirmar'

function formatarNumero(num: string): string {
  // +55 11 9000-0001
  const digits = num.replace(/\D/g, '')
  if (digits.length === 13) {
    return `+${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 8)}-${digits.slice(8)}`
  }
  return num
}

// Timeline status mapping
const TIMELINE_STEPS = [
  { label: 'Solicitação enviada',             status: ['documentos_enviados', 'em_analise_telnyx', 'aprovado', 'numero_ativo'] },
  { label: 'Documentos recebidos',            status: ['documentos_enviados', 'em_analise_telnyx', 'aprovado', 'numero_ativo'] },
  { label: 'Em análise pela Telnyx (até 3 dias úteis)', status: ['em_analise_telnyx', 'aprovado', 'numero_ativo'] },
  { label: 'Número aprovado e ativo',         status: ['numero_ativo'] },
]

function getTimelineStep(status: string): number {
  if (status === 'documentos_enviados') return 1
  if (status === 'em_analise_telnyx') return 2
  if (status === 'aprovado') return 3
  if (status === 'numero_ativo') return 4
  return 0
}

export default function TelnyxNumeroSection() {
  const [solicitacao, setSolicitacao] = useState<Solicitacao | null>(null)
  const [loadingInit, setLoadingInit] = useState(true)
  const [etapa, setEtapa] = useState<Etapa>('escolher')
  const [corrigindo, setCorrigindo] = useState(false)

  // Etapa 1
  const [ddd, setDdd] = useState('11')
  const [tipo, setTipo] = useState('local')
  const [buscando, setBuscando] = useState(false)
  const [numerosDisponiveis, setNumerosDisponiveis] = useState<NumeroDisponivel[]>([])
  const [numeroSelecionado, setNumeroSelecionado] = useState<string>('')
  const [erroBusca, setErroBusca] = useState('')

  // Etapa 2
  const [cnpj, setCnpj] = useState('')
  const [razaoSocial, setRazaoSocial] = useState('')
  const [nomeRepresentante, setNomeRepresentante] = useState('')
  const [cpfRepresentante, setCpfRepresentante] = useState('')
  const [endereco, setEndereco] = useState('')
  const [cep, setCep] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')
  const [confirmaDados, setConfirmaDados] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erroEnvio, setErroEnvio] = useState('')

  useEffect(() => {
    function carregarSolicitacao() {
      telnyxApi.getSolicitacao()
        .then(res => {
          const data = res.data as Solicitacao | null
          setSolicitacao(data || null)
        })
        .catch(() => {
          // sem solicitação ativa — estado inicial
        })
        .finally(() => setLoadingInit(false))
    }

    carregarSolicitacao()

    // Polling a cada 30s para detectar aprovação/atualização de status pelo admin
    const interval = setInterval(() => {
      telnyxApi.getSolicitacao()
        .then(res => {
          const data = res.data as Solicitacao | null
          setSolicitacao(data || null)
        })
        .catch(() => {})
    }, 30_000)

    return () => clearInterval(interval)
  }, [])

  async function buscarNumeros() {
    setBuscando(true)
    setErroBusca('')
    setNumerosDisponiveis([])
    setNumeroSelecionado('')
    try {
      const res = await telnyxApi.buscarNumeros(ddd, tipo)
      const data = res.data as { numeros: NumeroDisponivel[] }
      setNumerosDisponiveis(data.numeros || [])
      if (!data.numeros || data.numeros.length === 0) {
        setErroBusca('Nenhum número disponível para esse DDD/tipo. Tente outro DDD.')
      }
    } catch {
      setErroBusca('Erro ao buscar números. Tente novamente.')
    } finally {
      setBuscando(false)
    }
  }

  async function enviarSolicitacao() {
    if (!confirmaDados || !numeroSelecionado) return
    setEnviando(true)
    setErroEnvio('')
    try {
      const res = await telnyxApi.solicitar({
        ddd,
        tipo_numero: tipo,
        numero_solicitado: numeroSelecionado,
        cnpj,
        razao_social: razaoSocial,
        nome_representante: nomeRepresentante,
        cpf_representante: cpfRepresentante,
        endereco,
        cep,
        cidade,
        estado,
      })
      const data = res.data as { solicitacao: Solicitacao }
      setSolicitacao(data.solicitacao)
      setCorrigindo(false)
    } catch {
      setErroEnvio('Erro ao enviar solicitação. Verifique os dados e tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  if (loadingInit) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex items-center gap-3">
        <Clock className="w-4 h-4 text-gray-400 animate-spin" />
        <span className="text-sm text-gray-500">Verificando número ativo...</span>
      </div>
    )
  }

  // Estado C: número ativo
  if (solicitacao && solicitacao.status === 'numero_ativo' && !corrigindo) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-sm font-semibold text-green-800">Número ativo</span>
        </div>
        <p className="text-xl font-bold text-green-900 mb-2">
          {formatarNumero(solicitacao.numero_aprovado || solicitacao.numero_solicitado || '')}
        </p>
        <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 mb-3">
          Agentes prontos para usar este número
        </span>
        <div>
          <button
            disabled
            className="text-xs text-gray-400 underline cursor-not-allowed"
          >
            Ver configurações avançadas
          </button>
        </div>
      </div>
    )
  }

  // Estado B: solicitação em andamento
  if (solicitacao && !corrigindo) {
    const step = getTimelineStep(solicitacao.status)

    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Phone className="w-4 h-4 text-blue-600" />
          <h4 className="text-sm font-semibold text-gray-900">Provisionamento em andamento</h4>
        </div>
        {solicitacao.numero_solicitado && (
          <p className="text-xs text-gray-500 mb-4">
            Número solicitado: <span className="font-mono font-medium text-gray-800">{formatarNumero(solicitacao.numero_solicitado)}</span>
            {solicitacao.ddd && <> &nbsp;·&nbsp; DDD {solicitacao.ddd}</>}
          </p>
        )}

        {/* Timeline */}
        <div className="space-y-3 mb-4">
          {TIMELINE_STEPS.map((s, i) => {
            const done = step > i
            const active = step === i
            return (
              <div key={i} className="flex items-center gap-3">
                {done ? (
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                ) : active ? (
                  <Clock className="w-4 h-4 text-blue-500 flex-shrink-0 animate-pulse" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-gray-200 flex-shrink-0" />
                )}
                <span className={`text-sm ${done ? 'text-green-700' : active ? 'text-blue-700 font-medium' : 'text-gray-400'}`}>
                  {s.label}
                </span>
              </div>
            )
          })}
        </div>

        {/* Rejeição */}
        {solicitacao.motivo_rejeicao && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-2">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium text-red-700">Solicitação rejeitada</span>
            </div>
            <p className="text-xs text-red-600 mb-3">{solicitacao.motivo_rejeicao}</p>
            <button
              onClick={() => { setCorrigindo(true); setEtapa('escolher') }}
              className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors"
            >
              Corrigir e reenviar
            </button>
          </div>
        )}
      </div>
    )
  }

  // Estado A: formulário de solicitação
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <Phone className="w-4 h-4 text-blue-600" />
        <h4 className="text-sm font-semibold text-gray-900">Solicitar número +55</h4>
        <span className="px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-700">
          {etapa === 'escolher' ? 'Etapa 1 de 2' : 'Etapa 2 de 2'}
        </span>
      </div>

      {/* Etapa 1 */}
      {etapa === 'escolher' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">DDD</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={ddd}
                onChange={e => setDdd(e.target.value)}
              >
                {DDDS.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de número</label>
              <div className="flex gap-3 mt-1">
                {[
                  { value: 'local', label: 'Local' },
                  { value: 'mobile', label: 'Mobile' },
                  { value: 'toll_free', label: 'Toll-Free (0800)' },
                ].map(t => (
                  <label key={t.value} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="tipo_numero"
                      value={t.value}
                      checked={tipo === t.value}
                      onChange={() => setTipo(t.value)}
                      className="accent-blue-600"
                    />
                    <span className="text-sm text-gray-700">{t.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={buscarNumeros}
            disabled={buscando}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            <Search className="w-4 h-4" />
            {buscando ? 'Buscando...' : 'Buscar números disponíveis'}
          </button>

          {erroBusca && (
            <p className="text-xs text-red-600">{erroBusca}</p>
          )}

          {numerosDisponiveis.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Selecione um número:</p>
              <div className="grid grid-cols-2 gap-2">
                {numerosDisponiveis.map(n => (
                  <button
                    key={n.numero}
                    onClick={() => setNumeroSelecionado(n.numero)}
                    className={`text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                      numeroSelecionado === n.numero
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-mono text-sm font-semibold text-gray-900">{formatarNumero(n.numero)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{n.tipo} · R$ {n.preco_mes}/mês</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {numeroSelecionado && (
            <button
              onClick={() => setEtapa('confirmar')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              Continuar <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Etapa 2 */}
      {etapa === 'confirmar' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <p className="text-xs text-amber-800 font-medium">
              A Telnyx exige documentação para números brasileiros conforme regulamentação ANATEL
            </p>
          </div>

          <p className="text-xs text-gray-500">
            Número escolhido: <span className="font-mono font-semibold text-gray-800">{formatarNumero(numeroSelecionado)}</span>
            <button onClick={() => setEtapa('escolher')} className="ml-3 text-blue-600 hover:underline">Trocar</button>
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">CNPJ</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="00.000.000/0001-00"
                value={cnpj}
                onChange={e => setCnpj(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Razão Social</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Empresa Ltda"
                value={razaoSocial}
                onChange={e => setRazaoSocial(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nome do Representante Legal</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nome completo"
                value={nomeRepresentante}
                onChange={e => setNomeRepresentante(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">CPF do Representante</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="000.000.000-00"
                value={cpfRepresentante}
                onChange={e => setCpfRepresentante(e.target.value)}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Endereço completo</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Av. Paulista, 1000 — apto 42"
                value={endereco}
                onChange={e => setEndereco(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">CEP</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="00000-000"
                value={cep}
                onChange={e => setCep(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Cidade</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="São Paulo"
                value={cidade}
                onChange={e => setCidade(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Estado (UF)</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="SP"
                maxLength={2}
                value={estado}
                onChange={e => setEstado(e.target.value.toUpperCase())}
              />
            </div>
          </div>

          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmaDados}
              onChange={e => setConfirmaDados(e.target.checked)}
              className="accent-blue-600 mt-0.5 flex-shrink-0"
            />
            <span className="text-xs text-gray-600">
              Confirmo que os dados acima são corretos e autorizo a ETZ a submetê-los à Telnyx para aprovação regulatória
            </span>
          </label>

          {erroEnvio && (
            <p className="text-xs text-red-600">{erroEnvio}</p>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => setEtapa('escolher')}
              className="px-4 py-2 text-sm border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Voltar
            </button>
            <button
              onClick={enviarSolicitacao}
              disabled={!confirmaDados || enviando}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {enviando ? 'Enviando...' : 'Solicitar número'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
