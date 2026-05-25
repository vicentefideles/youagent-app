import { useState } from 'react'
import { DollarSign, Save, Calculator, TrendingUp, CheckCircle } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'custos' | 'calc' | 'projecao'

interface CustoFornecedor {
  id: string
  fornecedor: string
  servico: string
  custo: number
  unidade: string
  moeda: 'USD' | 'BRL'
  cor: string
}

interface CalcInputs {
  descontoTelnyx: number
  margemMinutos: number
  taxaAgente: number
  cambio: number
  simAgentes: number
  simMinutos: number
}

interface ProjecaoInputs {
  starterClientes: number
  starterAgentes: number
  starterMinutos: number
  growthClientes: number
  growthAgentes: number
  growthMinutos: number
  scaleClientes: number
  scaleAgentes: number
  scaleMinutos: number
}

// ─── Static base data ─────────────────────────────────────────────────────────

const CUSTOS_BASE: CustoFornecedor[] = [
  { id: 'telnyx-agent', fornecedor: 'Telnyx', servico: 'Agent AI (STT+TTS+LLM+Carrier)', custo: 0.050, unidade: '/min', moeda: 'USD', cor: 'text-blue-600' },
  { id: 'telnyx-gravacao', fornecedor: 'Telnyx', servico: 'Gravação de chamadas', custo: 0.002, unidade: '/min', moeda: 'USD', cor: 'text-blue-600' },
  { id: 'wz-marketing', fornecedor: 'Telnyx', servico: 'WhatsApp — Marketing/Utility', custo: 0.0108, unidade: '/msg', moeda: 'USD', cor: 'text-green-600' },
  { id: 'wz-auth', fornecedor: 'Telnyx', servico: 'WhatsApp — Autenticação', custo: 0.0665, unidade: '/msg', moeda: 'USD', cor: 'text-green-600' },
  { id: 'telnyx-numero', fornecedor: 'Telnyx', servico: 'Número de telefone BR', custo: 1.00, unidade: '/mês', moeda: 'USD', cor: 'text-blue-600' },
  { id: 'oportunidados', fornecedor: 'Oportunidados', servico: 'Enriquecimento CNPJ', custo: 0.05, unidade: '/consulta', moeda: 'BRL', cor: 'text-purple-600' },
  { id: 'supabase', fornecedor: 'Supabase', servico: 'Banco de dados / Auth', custo: 25, unidade: '/mês', moeda: 'USD', cor: 'text-gray-600' },
  { id: 'servidor', fornecedor: 'Servidor', servico: 'Cloud / Hosting (Vercel)', custo: 20, unidade: '/mês', moeda: 'USD', cor: 'text-gray-600' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtBrl(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtPct(v: number) {
  return v.toFixed(1) + '%'
}

// ─── Aba Custos ───────────────────────────────────────────────────────────────

function CustosTab() {
  const [custos, setCustos] = useState<CustoFornecedor[]>(CUSTOS_BASE)
  const [cambio, setCambio] = useState(5.75)
  const [desconto, setDesconto] = useState(0)
  const [salvo, setSalvo] = useState(false)

  function updateCusto(id: string, value: number) {
    setCustos(prev => prev.map(c => c.id === id ? { ...c, custo: value } : c))
  }

  function custoEmBrl(c: CustoFornecedor) {
    return c.moeda === 'USD' ? c.custo * cambio : c.custo
  }

  const telnyxAgent = custos.find(c => c.id === 'telnyx-agent')
  const telnyxGravacao = custos.find(c => c.id === 'telnyx-gravacao')
  const supabase = custos.find(c => c.id === 'supabase')
  const servidor = custos.find(c => c.id === 'servidor')

  const custoMinutoBase = telnyxAgent ? custoEmBrl(telnyxAgent) + (telnyxGravacao ? custoEmBrl(telnyxGravacao) : 0) : 0
  const custoMinutoComDesconto = custoMinutoBase * (1 - desconto / 100)
  const custosFixos = (supabase ? custoEmBrl(supabase) : 0) + (servidor ? custoEmBrl(servidor) : 0)
  const custoEstimadoMes = custoMinutoBase * 50000 + custosFixos // 50k minutos/mês estimado

  function salvarCustos() {
    setSalvo(true)
    setTimeout(() => setSalvo(false), 2000)
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Tabela de fornecedores */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Fornecedores de Infraestrutura</h3>
          <p className="text-xs text-gray-400 mt-0.5">Custos variáveis por uso — edite e salve</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {['Fornecedor', 'Serviço', 'Custo', 'Un.'].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-gray-400 pb-2">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {custos.map(c => (
              <tr key={c.id}>
                <td className={`py-2 text-xs font-semibold ${c.cor}`}>{c.fornecedor}</td>
                <td className="py-2 text-xs text-gray-600 max-w-[160px]">{c.servico}</td>
                <td className="py-2">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step={c.custo < 1 ? '0.0001' : '0.01'}
                      value={c.custo}
                      onChange={e => updateCusto(c.id, parseFloat(e.target.value) || 0)}
                      className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-xs text-gray-400">{c.moeda}</span>
                  </div>
                </td>
                <td className="py-2 text-xs text-gray-400">{c.unidade}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3">
          <label className="text-xs font-semibold text-gray-600">Câmbio USD/BRL:</label>
          <input
            type="number"
            step="0.01"
            value={cambio}
            onChange={e => setCambio(parseFloat(e.target.value) || 5.75)}
            className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-xs text-gray-400">Atualizado manualmente</span>
          <button
            onClick={salvarCustos}
            className={`ml-auto flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-colors ${salvo ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
          >
            {salvo ? <CheckCircle className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            {salvo ? 'Salvo!' : 'Salvar custos'}
          </button>
        </div>
      </div>

      {/* Resumo calculado */}
      <div className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Custo total por minuto</h3>
          <div className="space-y-3">
            {[
              { label: 'Agent AI (Telnyx)', valor: telnyxAgent ? custoEmBrl(telnyxAgent) : 0 },
              { label: 'Gravação', valor: telnyxGravacao ? custoEmBrl(telnyxGravacao) : 0 },
            ].map(item => (
              <div key={item.label} className="flex justify-between text-sm">
                <span className="text-gray-500">{item.label}</span>
                <span className="font-medium text-gray-900">R$ {item.valor.toFixed(4)}/min</span>
              </div>
            ))}
            <div className="pt-2 border-t border-gray-100 flex justify-between text-sm font-semibold">
              <span className="text-gray-700">Total/min</span>
              <span className="text-gray-900">R$ {custoMinutoBase.toFixed(4)}</span>
            </div>
          </div>

          {/* Desconto slider */}
          <div className="mt-5 pt-4 border-t border-gray-100">
            <h4 className="text-xs font-semibold text-gray-700 mb-3">Desconto negociado Telnyx</h4>
            <div className="flex items-center gap-3 mb-3">
              <input
                type="range"
                min="0"
                max="50"
                value={desconto}
                onChange={e => setDesconto(parseInt(e.target.value))}
                className="flex-1 accent-blue-600"
              />
              <span className="text-sm font-bold text-blue-600 w-10 text-right">{desconto}%</span>
            </div>
            {desconto > 0 && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
                Com desconto de {desconto}%: <strong>R$ {custoMinutoComDesconto.toFixed(4)}/min</strong> — economia de R$ {(custoMinutoBase - custoMinutoComDesconto).toFixed(4)}/min
              </div>
            )}
          </div>
        </div>

        {/* Resumo do mês */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Custo estimado total/mês</h3>
          <div className="space-y-2">
            {[
              { label: 'Custo variável (50k min)', valor: custoMinutoBase * 50000 },
              { label: 'Supabase', valor: supabase ? custoEmBrl(supabase) : 0 },
              { label: 'Servidor/Hosting', valor: servidor ? custoEmBrl(servidor) : 0 },
            ].map(item => (
              <div key={item.label} className="flex justify-between text-sm">
                <span className="text-gray-500">{item.label}</span>
                <span className="font-medium text-gray-900">{fmtBrl(item.valor)}</span>
              </div>
            ))}
            <div className="pt-2 border-t border-gray-100 flex justify-between">
              <span className="text-sm font-semibold text-gray-700">Total estimado</span>
              <span className="text-lg font-bold text-gray-900">{fmtBrl(custoEstimadoMes)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Aba Calculadora ──────────────────────────────────────────────────────────

function CalcTab() {
  const [inputs, setInputs] = useState<CalcInputs>({
    descontoTelnyx: 0,
    margemMinutos: 40,
    taxaAgente: 299,
    cambio: 5.75,
    simAgentes: 2,
    simMinutos: 8000,
  })

  function update(key: keyof CalcInputs, value: number) {
    setInputs(prev => ({ ...prev, [key]: value }))
  }

  // Cálculos
  const custoMinBase = (0.050 + 0.002) * inputs.cambio
  const custoMinComDesconto = custoMinBase * (1 - inputs.descontoTelnyx / 100)
  const precoMinVenda = custoMinComDesconto / (1 - inputs.margemMinutos / 100)

  const PLANOS = [
    { nome: 'Starter', agentes: 1, minutos: 3000, base: inputs.taxaAgente },
    { nome: 'Growth', agentes: 3, minutos: 10000, base: inputs.taxaAgente * 2.8 },
    { nome: 'Scale', agentes: 6, minutos: 25000, base: inputs.taxaAgente * 6.5 },
  ]

  const planoGerado = PLANOS.map(p => {
    const custoInfra = custoMinComDesconto * p.minutos
    const receitaMin = precoMinVenda * p.minutos
    const receitaTotal = p.base * p.agentes + receitaMin
    const margem = ((receitaTotal - custoInfra) / receitaTotal) * 100
    return { ...p, custoInfra, receitaTotal, margem }
  })

  // Simulação do cliente
  const simCustoInfra = custoMinComDesconto * inputs.simMinutos
  const simReceita = inputs.taxaAgente * inputs.simAgentes + precoMinVenda * inputs.simMinutos
  const simMargem = ((simReceita - simCustoInfra) / simReceita) * 100
  const simLucro = simReceita - simCustoInfra

  return (
    <div className="grid grid-cols-[340px_1fr] gap-4">
      {/* Parâmetros */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Parâmetros da simulação</h3>
        <p className="text-xs text-gray-400 mb-5">Ajuste e veja o resultado ao vivo</p>

        <div className="space-y-5">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-2">
              Desconto Telnyx: <span className="text-blue-600">{inputs.descontoTelnyx}%</span>
            </label>
            <input
              type="range" min="0" max="50" value={inputs.descontoTelnyx}
              onChange={e => update('descontoTelnyx', parseInt(e.target.value))}
              className="w-full accent-blue-600"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-2">
              Margem nos minutos: <span className="text-emerald-600">{inputs.margemMinutos}%</span>
            </label>
            <input
              type="range" min="10" max="70" value={inputs.margemMinutos}
              onChange={e => update('margemMinutos', parseInt(e.target.value))}
              className="w-full accent-emerald-600"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Taxa por agente (R$)</label>
            <input
              type="number" value={inputs.taxaAgente}
              onChange={e => update('taxaAgente', parseFloat(e.target.value) || 0)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Câmbio USD/BRL</label>
            <input
              type="number" step="0.01" value={inputs.cambio}
              onChange={e => update('cambio', parseFloat(e.target.value) || 5.75)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-700 mb-3">Simular cliente específico</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Nº de agentes</label>
                <input
                  type="number" min="1" value={inputs.simAgentes}
                  onChange={e => update('simAgentes', parseInt(e.target.value) || 1)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Minutos/mês</label>
                <input
                  type="number" min="100" value={inputs.simMinutos}
                  onChange={e => update('simMinutos', parseInt(e.target.value) || 1000)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resultados */}
      <div className="space-y-4">
        {/* Custo por minuto */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Custo por minuto — resultado</h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Custo base', valor: `R$ ${custoMinBase.toFixed(4)}`, sub: 'sem desconto' },
              { label: 'Custo c/ desconto', valor: `R$ ${custoMinComDesconto.toFixed(4)}`, sub: `${inputs.descontoTelnyx}% off` },
              { label: 'Preço de venda', valor: `R$ ${precoMinVenda.toFixed(4)}`, sub: `margem ${inputs.margemMinutos}%` },
            ].map(item => (
              <div key={item.label} className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                <p className="text-lg font-bold text-gray-900">{item.valor}</p>
                <p className="text-xs text-gray-400">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Planos gerados */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Planos gerados automaticamente</h3>
          <div className="grid grid-cols-3 gap-4">
            {planoGerado.map(p => (
              <div key={p.nome} className="border border-gray-200 rounded-xl p-4">
                <p className="text-sm font-bold text-gray-900 mb-3">{p.nome}</p>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Agentes</span>
                    <span className="font-medium">{p.agentes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Minutos</span>
                    <span className="font-medium">{p.minutos.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Custo infra</span>
                    <span className="font-medium text-red-500">{fmtBrl(p.custoInfra)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Receita</span>
                    <span className="font-medium text-blue-600">{fmtBrl(p.receitaTotal)}</span>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t border-gray-100">
                    <span className="text-gray-700 font-semibold">Margem</span>
                    <span className={`font-bold ${p.margem >= 50 ? 'text-emerald-600' : p.margem >= 30 ? 'text-amber-600' : 'text-red-500'}`}>
                      {fmtPct(p.margem)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Simulação do cliente */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Simulação do cliente</h3>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Custo de infra', valor: fmtBrl(simCustoInfra), destaque: false },
              { label: 'Receita total', valor: fmtBrl(simReceita), destaque: false },
              { label: 'Lucro bruto', valor: fmtBrl(simLucro), destaque: true, cor: simLucro >= 0 ? 'text-emerald-600' : 'text-red-500' },
              { label: 'Margem bruta', valor: fmtPct(simMargem), destaque: true, cor: simMargem >= 50 ? 'text-emerald-600' : simMargem >= 30 ? 'text-amber-600' : 'text-red-500' },
            ].map(item => (
              <div key={item.label} className={`rounded-xl p-4 ${item.destaque ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50'}`}>
                <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                <p className={`text-xl font-bold ${item.cor || 'text-gray-900'}`}>{item.valor}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Aba Projeção ─────────────────────────────────────────────────────────────

function ProjecaoTab() {
  const CAMBIO = 5.75
  const CUSTO_MIN = 0.052 * CAMBIO // agent AI + gravação

  const PRECOS = { starter: 994, growth: 3576, scale: 11940 }
  const CUSTO_INFRA_FIXO = { starter: 0, growth: 0, scale: 0 }

  const [inp, setInp] = useState<ProjecaoInputs>({
    starterClientes: 3,
    starterAgentes: 1,
    starterMinutos: 3000,
    growthClientes: 2,
    growthAgentes: 3,
    growthMinutos: 10000,
    scaleClientes: 1,
    scaleAgentes: 6,
    scaleMinutos: 25000,
  })

  function update(key: keyof ProjecaoInputs, value: number) {
    setInp(prev => ({ ...prev, [key]: value }))
  }

  // Cálculos por plano
  const starter = {
    mrr: inp.starterClientes * PRECOS.starter,
    custo: inp.starterClientes * CUSTO_MIN * inp.starterMinutos + CUSTO_INFRA_FIXO.starter,
  }
  const growth = {
    mrr: inp.growthClientes * PRECOS.growth,
    custo: inp.growthClientes * CUSTO_MIN * inp.growthMinutos + CUSTO_INFRA_FIXO.growth,
  }
  const scale = {
    mrr: inp.scaleClientes * PRECOS.scale,
    custo: inp.scaleClientes * CUSTO_MIN * inp.scaleMinutos + CUSTO_INFRA_FIXO.scale,
  }

  const totalClientes = inp.starterClientes + inp.growthClientes + inp.scaleClientes
  const totalMrr = starter.mrr + growth.mrr + scale.mrr
  const totalCusto = starter.custo + growth.custo + scale.custo + 25 * CAMBIO + 20 * CAMBIO // Supabase + Servidor
  const lucroMes = totalMrr - totalCusto
  const margem = totalMrr > 0 ? (lucroMes / totalMrr) * 100 : 0

  // Break-even
  const custosFixosMes = 25 * CAMBIO + 20 * CAMBIO
  const breakEvenClientes = Math.ceil(custosFixosMes / PRECOS.starter)

  // Gráfico por faixas de clientes
  const FAIXAS = [10, 25, 50, 100, 250, 500]
  const faixasData = FAIXAS.map(n => {
    const propStarterQt = Math.round(n * 0.3)
    const propGrowthQt = Math.round(n * 0.5)
    const propScaleQt = n - propStarterQt - propGrowthQt
    const rec = propStarterQt * PRECOS.starter + propGrowthQt * PRECOS.growth + propScaleQt * PRECOS.scale
    const cst = (propStarterQt * CUSTO_MIN * 3000 + propGrowthQt * CUSTO_MIN * 10000 + propScaleQt * CUSTO_MIN * 25000) + custosFixosMes
    const mg = rec > 0 ? ((rec - cst) / rec * 100) : 0
    return { n, rec, cst, mg }
  })
  const maxFaixaRec = Math.max(...faixasData.map(f => f.rec))

  return (
    <div className="grid grid-cols-[300px_1fr] gap-4">
      {/* Inputs composição carteira */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Composição da carteira</h3>
        <p className="text-xs text-gray-400 mb-5">Quantos clientes por plano</p>

        <div className="space-y-4">
          {/* Starter */}
          <div className="pb-4 border-b border-gray-100">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Starter</p>
            <div className="space-y-2">
              {[
                { label: 'Clientes', key: 'starterClientes' as keyof ProjecaoInputs },
                { label: 'Agentes médios', key: 'starterAgentes' as keyof ProjecaoInputs },
                { label: 'Min/mês médios', key: 'starterMinutos' as keyof ProjecaoInputs },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs text-gray-500 block mb-0.5">{f.label}</label>
                  <input
                    type="number" min="0" value={inp[f.key]}
                    onChange={e => update(f.key, parseInt(e.target.value) || 0)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Growth */}
          <div className="pb-4 border-b border-gray-100">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Growth</p>
            <div className="space-y-2">
              {[
                { label: 'Clientes', key: 'growthClientes' as keyof ProjecaoInputs },
                { label: 'Agentes médios', key: 'growthAgentes' as keyof ProjecaoInputs },
                { label: 'Min/mês médios', key: 'growthMinutos' as keyof ProjecaoInputs },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs text-gray-500 block mb-0.5">{f.label}</label>
                  <input
                    type="number" min="0" value={inp[f.key]}
                    onChange={e => update(f.key, parseInt(e.target.value) || 0)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Scale */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Scale</p>
            <div className="space-y-2">
              {[
                { label: 'Clientes', key: 'scaleClientes' as keyof ProjecaoInputs },
                { label: 'Agentes médios', key: 'scaleAgentes' as keyof ProjecaoInputs },
                { label: 'Min/mês médios', key: 'scaleMinutos' as keyof ProjecaoInputs },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs text-gray-500 block mb-0.5">{f.label}</label>
                  <input
                    type="number" min="0" value={inp[f.key]}
                    onChange={e => update(f.key, parseInt(e.target.value) || 0)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Resultados */}
      <div className="space-y-4">
        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total clientes', valor: totalClientes.toString() },
            { label: 'MRR total', valor: fmtBrl(totalMrr) },
            { label: 'Custo total', valor: fmtBrl(totalCusto) },
            { label: 'Lucro/mês', valor: fmtBrl(lucroMes) },
          ].map(k => (
            <div key={k.label} className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">{k.label}</p>
              <p className="text-xl font-bold text-gray-900">{k.valor}</p>
            </div>
          ))}
        </div>

        {/* Breakdown por plano */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Breakdown por plano</h3>
          <div className="space-y-3">
            {[
              { nome: 'Starter', mrr: starter.mrr, custo: starter.custo, cor: 'bg-gray-400' },
              { nome: 'Growth', mrr: growth.mrr, custo: growth.custo, cor: 'bg-blue-500' },
              { nome: 'Scale', mrr: scale.mrr, custo: scale.custo, cor: 'bg-purple-500' },
            ].map(p => {
              const mg = p.mrr > 0 ? ((p.mrr - p.custo) / p.mrr * 100) : 0
              return (
                <div key={p.nome} className="flex items-center gap-4">
                  <span className="text-xs font-semibold text-gray-700 w-14">{p.nome}</span>
                  <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${p.cor} rounded-full`} style={{ width: `${totalMrr > 0 ? (p.mrr / totalMrr) * 100 : 0}%` }} />
                  </div>
                  <span className="text-xs text-gray-500 w-24 text-right">{fmtBrl(p.mrr)}</span>
                  <span className={`text-xs font-bold w-12 text-right ${mg >= 50 ? 'text-emerald-600' : mg >= 30 ? 'text-amber-600' : 'text-red-500'}`}>
                    {fmtPct(mg)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Gráfico receita vs custo por faixa */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-5">Receita vs Custo por faixa de clientes</h3>
          <div className="flex items-end gap-3 h-36 mb-3">
            {faixasData.map(f => (
              <div key={f.n} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full relative flex gap-0.5 items-end" style={{ height: '100px' }}>
                  <div className="flex-1 bg-blue-500 rounded-t" style={{ height: `${(f.rec / maxFaixaRec) * 100}%` }} />
                  <div className="flex-1 bg-red-300 rounded-t" style={{ height: `${(f.cst / maxFaixaRec) * 100}%` }} />
                </div>
                <span className="text-xs text-gray-400">{f.n}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-blue-500 rounded-sm inline-block" />Receita</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-red-300 rounded-sm inline-block" />Custo</div>
          </div>

          {/* Tabela de margens */}
          <table className="w-full text-xs mt-4">
            <thead>
              <tr className="border-b border-gray-100">
                {['Clientes', 'Receita', 'Custo', 'Margem'].map(h => (
                  <th key={h} className="text-left text-gray-400 font-semibold pb-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {faixasData.map(f => (
                <tr key={f.n}>
                  <td className="py-1.5 font-medium text-gray-700">{f.n}</td>
                  <td className="py-1.5 text-gray-700">{fmtBrl(f.rec)}</td>
                  <td className="py-1.5 text-gray-700">{fmtBrl(f.cst)}</td>
                  <td className={`py-1.5 font-bold ${f.mg >= 50 ? 'text-emerald-600' : f.mg >= 30 ? 'text-amber-600' : 'text-red-500'}`}>{fmtPct(f.mg)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Break-even */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-blue-800 mb-3">Break-even e runway</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-blue-600 mb-1">Clientes mínimos (break-even)</p>
              <p className="text-2xl font-bold text-blue-900">{breakEvenClientes} clientes</p>
              <p className="text-xs text-blue-600 mt-0.5">no plano Starter</p>
            </div>
            <div>
              <p className="text-xs text-blue-600 mb-1">Margem atual</p>
              <p className={`text-2xl font-bold ${margem >= 50 ? 'text-emerald-600' : margem >= 30 ? 'text-amber-600' : 'text-red-600'}`}>
                {fmtPct(margem)}
              </p>
              <p className="text-xs text-blue-600 mt-0.5">{lucroMes >= 0 ? 'Lucrativo' : 'Prejuízo'}</p>
            </div>
            <div>
              <p className="text-xs text-blue-600 mb-1">Lucro/mês com carteira atual</p>
              <p className={`text-2xl font-bold ${lucroMes >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmtBrl(lucroMes)}</p>
              <p className="text-xs text-blue-600 mt-0.5">{totalClientes} clientes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'custos', label: 'Custos por Ferramenta', icon: <DollarSign className="w-4 h-4" /> },
  { id: 'calc', label: 'Calculadora de Pricing', icon: <Calculator className="w-4 h-4" /> },
  { id: 'projecao', label: 'Projeção de Carteira', icon: <TrendingUp className="w-4 h-4" /> },
]

export default function AdminCustosPage() {
  const [tab, setTab] = useState<Tab>('custos')

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
          <DollarSign className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Custos & Pricing</h1>
          <p className="text-sm text-gray-500">Controle de custos por fornecedor, calculadora de margens e projeção de carteira</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'custos' && <CustosTab />}
      {tab === 'calc' && <CalcTab />}
      {tab === 'projecao' && <ProjecaoTab />}
    </div>
  )
}
