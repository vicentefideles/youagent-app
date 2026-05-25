import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Loader2 } from 'lucide-react'

type CheckoutStep = 'plano' | 'pagamento' | 'confirmacao'
type Plano = 'starter' | 'growth' | 'enterprise'
type Frequencia = 'mensal' | 'anual'
type FormaPagamento = 'cartao_mensal' | 'boleto_mensal' | 'anual'
type MetodoPagamento = 'cartao' | 'pix' | 'boleto'

interface DadosCartao {
  numero: string
  validade: string
  cvv: string
  nome: string
  cpfCnpj: string
}

const PRECOS: Record<Plano, Record<Frequencia, number>> = {
  starter: { mensal: 497, anual: 417 },
  growth: { mensal: 447, anual: 375 },
  enterprise: { mensal: 397, anual: 334 },
}

const PLANO_LABELS: Record<Plano, string> = {
  starter: 'Starter',
  growth: 'Growth',
  enterprise: 'Enterprise',
}

const PLANO_DESC: Record<Plano, string> = {
  starter: '1 a 3 agentes de IA',
  growth: '4 a 10 agentes de IA',
  enterprise: '11+ agentes de IA',
}

const PLANO_LIMITES: Record<Plano, [number, number]> = {
  starter: [1, 3],
  growth: [4, 10],
  enterprise: [11, 50],
}

const FORMA_LABELS: Record<FormaPagamento, string> = {
  cartao_mensal: 'Cartão mensal',
  boleto_mensal: 'Boleto mensal',
  anual: 'Plano anual',
}

const FORMA_ICONS: Record<FormaPagamento, string> = {
  cartao_mensal: '💳',
  boleto_mensal: '📄',
  anual: '🏆',
}

const FORMA_DESC: Record<FormaPagamento, string> = {
  cartao_mensal: 'Cobrança variável conforme uso',
  boleto_mensal: 'Boleto fixo gerado dia 1',
  anual: '2 meses grátis · preço travado',
}

const FORMA_EXPLICACAO: Record<FormaPagamento, string> = {
  cartao_mensal: 'Cobrança variável no cartão. No fechamento do mês, o sistema totaliza agentes + minutos e debita no cartão.',
  boleto_mensal: 'Boleto fixo gerado todo dia 1 e enviado por e-mail.',
  anual: 'Desconto de 16% no valor total. Cobrança única ou parcelada. Preço travado por 12 meses.',
}

const WIZARD_STEPS = ['Criar conta', 'Plano', 'Pagamento', 'Confirmação']

function ProgressBar({ step }: { step: CheckoutStep }) {
  const active = step === 'plano' ? 1 : step === 'pagamento' ? 2 : 3
  return (
    <div className="flex items-center justify-center mb-8 gap-2">
      {WIZARD_STEPS.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
              ${i === 0 ? 'bg-green-500 text-white' :
                i === active ? 'bg-blue-600 text-white' :
                i < active ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
              {i === 0 || i < active ? '✓' : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${
              i === active ? 'text-blue-600' : i < active ? 'text-green-600' : 'text-gray-400'
            }`}>
              {label}
            </span>
          </div>
          {i < WIZARD_STEPS.length - 1 && <div className="w-6 h-px bg-gray-300" />}
        </div>
      ))}
    </div>
  )
}

function Resumo({
  plano,
  numAgentes,
  frequencia,
  forma,
  showProtection,
}: {
  plano: Plano
  numAgentes: number
  frequencia: Frequencia
  forma: FormaPagamento
  showProtection?: boolean
}) {
  const preco = PRECOS[plano][frequencia]
  const total = preco * numAgentes
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-6">
      <h3 className="font-semibold text-gray-900 mb-4">Resumo do pedido</h3>
      <div className="flex flex-col gap-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Plano</span>
          <span className="font-medium">{PLANO_LABELS[plano]}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Preço/agente</span>
          <span className="font-medium">R$ {preco}/ag/mês</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Agentes</span>
          <span className="font-medium">{numAgentes}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Cobrança</span>
          <span className="font-medium capitalize">{frequencia}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Forma</span>
          <span className="font-medium">{FORMA_LABELS[forma]}</span>
        </div>
        <div className="h-px bg-gray-100 my-2" />
        <div className="flex justify-between">
          <span className="font-semibold text-gray-900">Total hoje</span>
          <span className="font-bold text-green-600 text-base">R$ 0,00</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">Cobrança no último dia do mês</p>
        <div className="mt-2 text-xs text-gray-500">
          Total estimado/mês:{' '}
          <span className="font-semibold text-gray-900">R$ {total.toLocaleString('pt-BR')}</span>
        </div>
      </div>
      {showProtection && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-500 flex items-center gap-2">
          💳 Stripe · PCI DSS nível 1 · Dados criptografados
        </div>
      )}
    </div>
  )
}

export default function CheckoutPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<CheckoutStep>('plano')
  const [plano, setPlano] = useState<Plano>('growth')
  const [frequencia, setFrequencia] = useState<Frequencia>('mensal')
  const [numAgentes, setNumAgentes] = useState(4)
  const [forma, setForma] = useState<FormaPagamento>('cartao_mensal')
  const [metodo, setMetodo] = useState<MetodoPagamento>('cartao')
  const [cartao, setCartao] = useState<DadosCartao>({ numero: '', validade: '', cvv: '', nome: '', cpfCnpj: '' })
  const [boletoEmail, setBoletoEmail] = useState('')
  const [processando, setProcessando] = useState(false)
  const [confirmado, setConfirmado] = useState(false)
  const [statusMsg, setStatusMsg] = useState('Validando dados...')

  function selectPlano(p: Plano) {
    setPlano(p)
    const [min] = PLANO_LIMITES[p]
    setNumAgentes(min)
  }

  function changeAgentes(delta: number) {
    const [min, max] = PLANO_LIMITES[plano]
    setNumAgentes((n) => Math.min(max, Math.max(min, n + delta)))
  }

  function formatNumero(v: string) {
    return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
  }

  function formatValidade(v: string) {
    const raw = v.replace(/\D/g, '').slice(0, 4)
    if (raw.length >= 3) return raw.slice(0, 2) + '/' + raw.slice(2)
    return raw
  }

  function handleConfirmar() {
    setProcessando(true)
    setStatusMsg('Validando dados...')
    setTimeout(() => setStatusMsg('Aprovando...'), 1000)
    setTimeout(() => setStatusMsg('Ativando conta...'), 2000)
    setTimeout(() => {
      setProcessando(false)
      setConfirmado(true)
    }, 3000)
  }

  const preco = PRECOS[plano][frequencia]
  const [planoMin, planoMax] = PLANO_LIMITES[plano]

  // ── PASSO 1: Plano ──
  if (step === 'plano') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto">
          <ProgressBar step="plano" />
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            <div className="flex flex-col gap-6">

              {/* Frequência */}
              <div className="card p-6">
                <div className="flex items-center gap-4 mb-2">
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    {(['mensal', 'anual'] as Frequencia[]).map((f) => (
                      <button
                        key={f}
                        onClick={() => setFrequencia(f)}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                          frequencia === f ? 'bg-white shadow text-gray-900' : 'text-gray-500'
                        }`}
                      >
                        {f === 'mensal' ? 'Mensal' : 'Anual'}
                      </button>
                    ))}
                  </div>
                  {frequencia === 'anual' && (
                    <span className="text-xs bg-green-100 text-green-700 font-medium px-2 py-1 rounded-full">
                      🎁 2 meses grátis — 16% off
                    </span>
                  )}
                </div>
              </div>

              {/* Cards de plano */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {(['starter', 'growth', 'enterprise'] as Plano[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => selectPlano(p)}
                    className={`card p-5 text-left transition-all relative ${
                      plano === p
                        ? 'border-blue-500 ring-2 ring-blue-200'
                        : 'hover:border-gray-300'
                    }`}
                  >
                    {p === 'growth' && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs bg-blue-600 text-white px-3 py-0.5 rounded-full font-medium">
                        Mais popular
                      </span>
                    )}
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{PLANO_LABELS[p]}</h3>
                      {plano === p && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                    </div>
                    <p className="text-xs text-gray-500 mb-3">{PLANO_DESC[p]}</p>
                    <div>
                      <span className="text-xl font-bold text-gray-900">R$ {PRECOS[p][frequencia]}</span>
                      <span className="text-xs text-gray-500">/ag/mês</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Seletor de agentes */}
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
                <p className="text-sm font-medium text-blue-900 mb-1">
                  Quantos agentes de IA você quer ativar?
                </p>
                <p className="text-xs text-blue-600 mb-4">
                  Faixa {PLANO_LABELS[plano]}: {planoMin} a {planoMax} agentes
                </p>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => changeAgentes(-1)}
                    disabled={numAgentes <= planoMin}
                    className="w-9 h-9 rounded-full bg-white border border-blue-200 text-blue-700 font-bold
                               flex items-center justify-center disabled:opacity-40 hover:bg-blue-100 transition-colors"
                  >
                    −
                  </button>
                  <span className="text-2xl font-bold text-blue-900 w-8 text-center">{numAgentes}</span>
                  <button
                    onClick={() => changeAgentes(1)}
                    disabled={numAgentes >= planoMax}
                    className="w-9 h-9 rounded-full bg-white border border-blue-200 text-blue-700 font-bold
                               flex items-center justify-center disabled:opacity-40 hover:bg-blue-100 transition-colors"
                  >
                    +
                  </button>
                  <div className="ml-4">
                    <p className="text-xs text-blue-600">Total estimado/mês:</p>
                    <p className="text-lg font-bold text-green-600">
                      R$ {(preco * numAgentes).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tudo incluído */}
              <div className="rounded-xl bg-gray-100 border border-gray-200 p-4">
                <p className="text-xs font-semibold text-gray-700 mb-2">
                  Tudo incluído em todos os planos — sem funcionalidades bloqueadas
                </p>
                <p className="text-xs text-gray-500">
                  Discadora · Live scheduling · Centro de Inteligência · Cross-cliente · Relatórios · E-mail marketing · Suporte prioritário
                </p>
              </div>

              {/* Forma de pagamento */}
              <div className="card p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Forma de pagamento</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  {(['cartao_mensal', 'boleto_mensal', 'anual'] as FormaPagamento[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => setForma(f)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        forma === f ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-xl mb-1">{FORMA_ICONS[f]}</div>
                      <p className="text-sm font-medium text-gray-900">{FORMA_LABELS[f]}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{FORMA_DESC[f]}</p>
                    </button>
                  ))}
                </div>
                <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-sm text-gray-600">
                  {FORMA_EXPLICACAO[forma]}
                </div>
              </div>

              <button
                onClick={() => setStep('pagamento')}
                className="btn-primary w-full py-3 text-base font-semibold"
              >
                Continuar →
              </button>
            </div>

            <Resumo plano={plano} numAgentes={numAgentes} frequencia={frequencia} forma={forma} />
          </div>
        </div>
      </div>
    )
  }

  // ── PASSO 2: Pagamento ──
  if (step === 'pagamento') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto">
          <ProgressBar step="pagamento" />
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            <div className="flex flex-col gap-6">

              <div className="card p-6">
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-xs bg-green-100 text-green-700 font-medium px-2 py-1 rounded-full">
                    🔒 Pagamento seguro — Stripe
                  </span>
                </div>

                {/* Tabs método */}
                <div className="flex gap-2 mb-6">
                  {(['cartao', 'pix', 'boleto'] as MetodoPagamento[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMetodo(m)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                        metodo === m
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      {m === 'cartao' ? '💳 Cartão' : m === 'pix' ? '⚡ PIX' : '📄 Boleto'}
                    </button>
                  ))}
                </div>

                {metodo === 'cartao' && (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-gray-600">Número do cartão</label>
                      <input
                        className="input"
                        placeholder="0000 0000 0000 0000"
                        value={cartao.numero}
                        onChange={(e) => setCartao((c) => ({ ...c, numero: formatNumero(e.target.value) }))}
                        maxLength={19}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-gray-600">Validade</label>
                        <input
                          className="input"
                          placeholder="MM/AA"
                          value={cartao.validade}
                          onChange={(e) => setCartao((c) => ({ ...c, validade: formatValidade(e.target.value) }))}
                          maxLength={5}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-gray-600">CVV</label>
                        <input
                          className="input"
                          placeholder="•••"
                          type="password"
                          value={cartao.cvv}
                          onChange={(e) => setCartao((c) => ({ ...c, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                          maxLength={4}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-gray-600">Nome no cartão</label>
                      <input
                        className="input"
                        placeholder="NOME COMPLETO"
                        value={cartao.nome}
                        onChange={(e) => setCartao((c) => ({ ...c, nome: e.target.value.toUpperCase() }))}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-gray-600">CPF / CNPJ</label>
                      <input
                        className="input"
                        placeholder="000.000.000-00"
                        value={cartao.cpfCnpj}
                        onChange={(e) => setCartao((c) => ({ ...c, cpfCnpj: e.target.value }))}
                      />
                    </div>
                  </div>
                )}

                {metodo === 'pix' && (
                  <div className="flex flex-col items-center gap-4 py-6">
                    <div className="w-32 h-32 bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-400 text-xs text-center">
                      QR Code<br />gerado após<br />confirmar
                    </div>
                    <p className="text-sm text-gray-600 text-center max-w-xs">
                      O QR Code será gerado após confirmar o pedido.
                    </p>
                  </div>
                )}

                {metodo === 'boleto' && (
                  <div className="flex flex-col gap-4">
                    <p className="text-sm text-gray-600">
                      O boleto será gerado e enviado para seu e-mail. Vencimento em 3 dias úteis.
                    </p>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-gray-600">E-mail para receber o boleto</label>
                      <input
                        type="email"
                        className="input"
                        placeholder="seu@empresa.com"
                        value={boletoEmail}
                        onChange={(e) => setBoletoEmail(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('plano')}
                  className="btn-secondary flex-1 py-2.5"
                >
                  ← Voltar
                </button>
                <button
                  onClick={() => { setStep('confirmacao'); handleConfirmar() }}
                  className="btn-primary flex-1 py-2.5"
                >
                  Confirmar pagamento →
                </button>
              </div>
            </div>

            <Resumo plano={plano} numAgentes={numAgentes} frequencia={frequencia} forma={forma} showProtection />
          </div>
        </div>
      </div>
    )
  }

  // ── PASSO 3: Confirmação ──
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <ProgressBar step="confirmacao" />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <div className="card p-8 flex flex-col items-center text-center">
            {processando ? (
              <div className="flex flex-col items-center gap-6 py-8">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                <div>
                  <p className="text-lg font-semibold text-gray-900">Processando pagamento...</p>
                  <p className="text-sm text-gray-500 mt-1">Conectando com Stripe</p>
                </div>
                <p className="text-sm text-blue-600 font-medium animate-pulse">{statusMsg}</p>
              </div>
            ) : confirmado ? (
              <div className="flex flex-col items-center gap-5 py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Pedido confirmado!</h2>
                  <p className="text-sm text-gray-500 mt-1">Recibo enviado para seu e-mail</p>
                </div>
                <div className="w-full bg-gray-50 rounded-xl p-5 text-sm text-left flex flex-col gap-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Plano</span>
                    <span className="font-medium">{PLANO_LABELS[plano]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Agentes</span>
                    <span className="font-medium">{numAgentes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Forma de pagamento</span>
                    <span className="font-medium">{FORMA_LABELS[forma]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Preço/agente</span>
                    <span className="font-medium">R$ {preco}/ag/mês</span>
                  </div>
                  <div className="h-px bg-gray-200 my-1" />
                  <div className="flex justify-between">
                    <span className="font-semibold">Total estimado/mês</span>
                    <span className="font-bold text-green-600">R$ {(preco * numAgentes).toLocaleString('pt-BR')}</span>
                  </div>
                </div>
                <div className="w-full bg-green-50 border border-green-200 rounded-xl p-4 text-xs text-green-700 text-center">
                  💳 Pagamento protegido por Stripe · PCI DSS nível 1 · Dados criptografados
                </div>
                <button
                  onClick={() => navigate('/documentos')}
                  className="btn-primary w-full py-3 text-base font-semibold"
                >
                  Preencher dados da empresa →
                </button>
              </div>
            ) : null}
          </div>

          <Resumo plano={plano} numAgentes={numAgentes} frequencia={frequencia} forma={forma} showProtection />
        </div>
      </div>
    </div>
  )
}
