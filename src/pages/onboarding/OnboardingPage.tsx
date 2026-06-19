import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { claudeApi, agentesApi } from '@/services/api'
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Bot,
  Building2,
  Target,
  Zap,
  Clock,
  X,
  Loader2,
  Copy,
  Pencil,
  RefreshCw,
  Brain,
  Search,
  AlertTriangle,
  Play,
  MapPin,
  Shield,
  PhoneForwarded,
  CalendarCheck,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface FormData {
  // Step 1
  'nome-agente': string
  'empresa-nome': string
  'empresa-cnpj': string
  'empresa-segmento': string
  'empresa-site': string
  'empresa-porte': string
  'empresa-descricao': string
  'empresa-diferenciais': string
  'empresa-objecoes-comuns': string
  'empresa-contexto-mercado': string
  // Step 2
  'prod-nome': string
  'prod-descricao': string
  'prod-resultados': string
  'prod-concorrentes': string
  'prod-info-extra': string
  // Step 3
  'icp-cargo-tipo': string
  'icp-porte-alvo': string
  'icp-segmento-alvo': string
  'gatilhos-customizados': string
  'wiz-qualif-q1': string
  'wiz-qualif-q2': string
  'wiz-qualif-q3': string
  'script-abertura': string
  'metodologia': string
  'compliance-anatel': string
  'compliance-optout': string
  'capacidade-transferencia': string
  'capacidade-agendamento': string
  voz: string
  tom: string
}

interface Objecao {
  objecao: string
  rebuttal: string
}

const INITIAL_FORM: FormData = {
  'nome-agente': '',
  'empresa-nome': '',
  'empresa-cnpj': '',
  'empresa-segmento': '',
  'empresa-site': '',
  'empresa-porte': '',
  'empresa-descricao': '',
  'empresa-diferenciais': '',
  'empresa-objecoes-comuns': '',
  'empresa-contexto-mercado': '',
  'prod-nome': '',
  'prod-descricao': '',
  'prod-resultados': '',
  'prod-concorrentes': '',
  'prod-info-extra': '',
  'icp-cargo-tipo': '',
  'icp-porte-alvo': '',
  'icp-segmento-alvo': '',
  'gatilhos-customizados': '',
  'wiz-qualif-q1': 'Vocês já usam alguma ferramenta de prospecção ativa?',
  'wiz-qualif-q2': 'Qual o volume mensal de reuniões da equipe hoje?',
  'wiz-qualif-q3': 'Você é o responsável pela decisão de novas ferramentas?',
  'script-abertura': '',
  'metodologia': '',
  'compliance-anatel': 'true',
  'compliance-optout': 'true',
  'capacidade-transferencia': 'false',
  'capacidade-agendamento': 'true',
  voz: 'Telnyx.NaturalHD.isadora',
  tom: '',
}

const INITIAL_OBJECOES: Objecao[] = [
  { objecao: '', rebuttal: '' },
  { objecao: '', rebuttal: '' },
  { objecao: '', rebuttal: '' },
]

const SEGMENTOS = ['Tech/SaaS', 'Indústria', 'Serviços B2B', 'Saúde', 'Educação', 'Financeiro', 'Outro']
const PORTES = ['1–10', '11–50', '51–200', '201–1000', '1000+']
const CARGOS = ['Diretor', 'VP', 'CEO', 'Gerente', 'Coordenador', 'Outro']

const VOZES_TELNYX = [
  // ── pt-BR NaturalHD
  { id: 'Telnyx.NaturalHD.isadora',  nome: 'Isadora',   genero: 'Feminino',  modelo: 'Natural HD', idioma: 'pt-BR' },
  { id: 'Telnyx.NaturalHD.lucia',    nome: 'Lucia',     genero: 'Feminino',  modelo: 'Natural HD', idioma: 'pt-BR' },
  { id: 'Telnyx.NaturalHD.sol',      nome: 'Sol',       genero: 'Feminino',  modelo: 'Natural HD', idioma: 'pt-BR' },
  { id: 'Telnyx.NaturalHD.alzira',   nome: 'Alzira',    genero: 'Feminino',  modelo: 'Natural HD', idioma: 'pt-BR' },
  { id: 'Telnyx.NaturalHD.baltasar', nome: 'Baltasar',  genero: 'Masculino', modelo: 'Natural HD', idioma: 'pt-BR' },
  { id: 'Telnyx.NaturalHD.celso',    nome: 'Celso',     genero: 'Masculino', modelo: 'Natural HD', idioma: 'pt-BR' },
  // ── pt-BR KokoroTTS
  { id: 'Telnyx.KokoroTTS.pf_dora',  nome: 'Dora',      genero: 'Feminino',  modelo: 'KokoroTTS',  idioma: 'pt-BR' },
  { id: 'Telnyx.KokoroTTS.pm_alex',  nome: 'Alex',      genero: 'Masculino', modelo: 'KokoroTTS',  idioma: 'pt-BR' },
  { id: 'Telnyx.KokoroTTS.pm_santa', nome: 'Santa',     genero: 'Masculino', modelo: 'KokoroTTS',  idioma: 'pt-BR' },
  // ── pt-PT Ultra
  { id: 'Telnyx.Ultra.1cf751f6-8749-43ab-98bd-230dd633abdb', nome: 'Ana Paula', genero: 'Feminino',  modelo: 'Ultra', idioma: 'pt-PT' },
  { id: 'Telnyx.Ultra.2f4d204f-a5dc-4196-81bc-155986b76ab6', nome: 'Mirella',   genero: 'Feminino',  modelo: 'Ultra', idioma: 'pt-PT' },
  { id: 'Telnyx.Ultra.5063f45b-d9e0-4095-b056-8f3ee055d411', nome: 'Camilo',    genero: 'Masculino', modelo: 'Ultra', idioma: 'pt-PT' },
  { id: 'Telnyx.Ultra.6a16c1f4-462b-44de-998d-ccdaa4125a0a', nome: 'Hidalgo',   genero: 'Masculino', modelo: 'Ultra', idioma: 'pt-PT' },
  { id: 'Telnyx.Ultra.6a360542-a117-4ed5-9e09-e8bf9b05eabb', nome: 'Tiago',     genero: 'Masculino', modelo: 'Ultra', idioma: 'pt-PT' },
  { id: 'Telnyx.Ultra.700d1ee3-a641-4018-ba6e-899dcadc9e2b', nome: 'Luana',     genero: 'Feminino',  modelo: 'Ultra', idioma: 'pt-PT' },
  { id: 'Telnyx.Ultra.a37639f0-2f0a-4de4-9942-875a187af878', nome: 'Felipe',    genero: 'Masculino', modelo: 'Ultra', idioma: 'pt-PT' },
  { id: 'Telnyx.Ultra.b0f46533-d4bb-493f-a26f-a99e1f2e86e3', nome: 'Heitor',    genero: 'Masculino', modelo: 'Ultra', idioma: 'pt-PT' },
  { id: 'Telnyx.Ultra.d4b44b9a-82bc-4b65-b456-763fce4c52f9', nome: 'Beatriz',   genero: 'Feminino',  modelo: 'Ultra', idioma: 'pt-PT' },
  { id: 'Telnyx.Ultra.f39bf583-3b3d-402f-9ffb-6179d9ec3e35', nome: 'Isabel',    genero: 'Feminino',  modelo: 'Ultra', idioma: 'pt-PT' },
  { id: 'Telnyx.Ultra.fbee0e7d-a83a-4082-bad1-13c70f86da4e', nome: 'Diogo',     genero: 'Masculino', modelo: 'Ultra', idioma: 'pt-PT' },
]

const TONS_CARDS = [
  { id: 'profissional', label: 'Profissional', descricao: 'Formal, direto ao ponto' },
  { id: 'consultivo', label: 'Consultivo', descricao: 'Pergunta mais, propõe soluções' },
  { id: 'direto', label: 'Direto', descricao: 'Objetivo, sem rodeios' },
  { id: 'amigavel', label: 'Amigável', descricao: 'Próximo, cria rapport rapidamente' },
]

const METODOLOGIAS = [
  { id: 'consultivo', label: 'Consultivo', descricao: 'Faz perguntas, descobre necessidades' },
  { id: 'spin', label: 'SPIN Selling', descricao: 'Situação → Problema → Implicação → Necessidade' },
  { id: 'bant', label: 'BANT', descricao: 'Budget, Authority, Need, Timeline' },
  { id: 'direto', label: 'Direto', descricao: 'Apresenta proposta rapidamente' },
]

const REGIOES_BR: Record<string, string[]> = {
  'Sudeste': ['SP', 'RJ', 'MG', 'ES'],
  'Sul': ['PR', 'SC', 'RS'],
  'Centro-Oeste': ['GO', 'MT', 'MS', 'DF'],
  'Nordeste': ['BA', 'PE', 'CE', 'MA', 'PB', 'RN', 'AL', 'SE', 'PI'],
  'Norte': ['AM', 'PA', 'RO', 'AC', 'RR', 'AP', 'TO'],
}


const STEPS = [
  { label: 'Empresa e Produto', icon: Building2 },
  { label: 'ICP', icon: Target },
  { label: 'Ativação', icon: Zap },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((step, i) => {
        const done = i < current
        const active = i === current
        return (
          <React.Fragment key={step.label}>
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  done
                    ? 'bg-green-500 text-white'
                    : active
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {done ? <Check size={16} strokeWidth={3} /> : i + 1}
              </div>
              <span
                className={`mt-1.5 text-xs font-medium whitespace-nowrap ${
                  active ? 'text-blue-600' : done ? 'text-green-600' : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`w-16 h-0.5 mx-1 mb-5 transition-colors ${
                  i < current ? 'bg-green-400' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

function ProgressBar({ step }: { step: number }) {
  const pct = ((step + 1) / STEPS.length) * 100
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 mb-8">
      <div
        className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

const inputCls =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
const selectCls =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white'
const textareaCls =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none'

// ─── Steps ───────────────────────────────────────────────────────────────────

function Step1({
  form,
  onChange,
  errors,
}: {
  form: FormData
  onChange: (k: keyof FormData, v: string) => void
  errors: Partial<Record<keyof FormData, string>>
}) {
  const [pesquisando, setPesquisando] = useState(false)
  const [pesquisaErro, setPesquisaErro] = useState<string | null>(null)
  const [buscandoCnpj, setBuscandoCnpj] = useState(false)
  const [cnpjErro, setCnpjErro] = useState<string | null>(null)

  function formatarCnpj(v: string) {
    const n = v.replace(/\D/g, '').slice(0, 14)
    return n
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  }

  async function buscarCNPJ() {
    const cnpj = form['empresa-cnpj'].replace(/\D/g, '')
    if (cnpj.length !== 14) { setCnpjErro('CNPJ deve ter 14 dígitos'); return }
    setBuscandoCnpj(true)
    setCnpjErro(null)
    try {
      const resp = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`)
      if (!resp.ok) throw new Error('CNPJ não encontrado')
      const d = await resp.json()
      if (d.razao_social) onChange('empresa-nome', d.razao_social)
      if (d.descricao_situacao_cadastral === 'ATIVA') {
        // mapear porte
        const porte = d.porte === 'MICRO EMPRESA' ? '1–10'
          : d.porte === 'EMPRESA DE PEQUENO PORTE' ? '11–50'
          : d.porte === 'MEDIO PORTE' ? '51–200'
          : d.porte === 'GRANDE PORTE' ? '201–1000' : ''
        if (porte) onChange('empresa-porte', porte)
      }
      if (d.cnae_fiscal_descricao) {
        // tentar mapear CNAE para segmento
        const desc = d.cnae_fiscal_descricao.toLowerCase()
        const seg = desc.includes('software') || desc.includes('tecnologia') ? 'Tech/SaaS'
          : desc.includes('consult') ? 'Serviços B2B'
          : desc.includes('saúde') || desc.includes('médic') ? 'Saúde'
          : desc.includes('educação') || desc.includes('ensino') ? 'Educação'
          : desc.includes('financ') || desc.includes('crédito') || desc.includes('seguro') ? 'Financeiro'
          : ''
        if (seg) onChange('empresa-segmento', seg)
      }
      if (d.municipio && d.uf) {
        // preencher site se vier
        if (d.email) onChange('empresa-site', d.email.startsWith('http') ? d.email : '')
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        ?? (err instanceof Error ? err.message : 'Erro ao buscar CNPJ')
      setCnpjErro(msg)
    } finally {
      setBuscandoCnpj(false)
    }
  }

  async function pesquisarComIA() {
    if (pesquisando) return
    if (!form['empresa-site'].trim()) {
      setPesquisaErro('Informe o site da empresa antes de pesquisar')
      document.getElementById('empresa-site')?.focus()
      return
    }
    setPesquisando(true)
    setPesquisaErro(null)
    try {
      const res = await claudeApi.pesquisarMercado({
        empresa: form['empresa-nome'],
        cnpj: form['empresa-cnpj'],
        segmento: form['empresa-segmento'],
        site: form['empresa-site'],
        produto: form['prod-nome'],
      })
      const data = res.data as {
        descricao?: string
        diferenciais?: string
        concorrentes?: string
        icp_porte?: string
        icp_segmento?: string
        gatilhos?: string
        objecoes_comuns?: string
        contexto_mercado?: string
        script_abertura?: string
        descricao_produto?: string
        resultados_clientes?: string
        nome_produto?: string
        cases_sucesso?: string
      }
      if (data.nome_produto) onChange('prod-nome', data.nome_produto)
      if (data.descricao) onChange('empresa-descricao', data.descricao)
      if (data.diferenciais) onChange('empresa-diferenciais', data.diferenciais)
      if (data.concorrentes) onChange('prod-concorrentes', data.concorrentes)
      if (data.icp_porte) onChange('icp-porte-alvo', data.icp_porte)
      if (data.icp_segmento) onChange('icp-segmento-alvo', data.icp_segmento)
      if (data.gatilhos) onChange('gatilhos-customizados', data.gatilhos)
      const mercadoTexto = [
        data.concorrentes ? `Concorrentes: ${data.concorrentes}` : '',
        data.objecoes_comuns ? `\nObjeções:\n${data.objecoes_comuns}` : '',
      ].filter(Boolean).join('')
      if (mercadoTexto) onChange('empresa-objecoes-comuns', mercadoTexto)
      if (data.contexto_mercado) onChange('empresa-contexto-mercado', data.contexto_mercado)
      if (data.script_abertura) onChange('script-abertura', data.script_abertura)
      if ((data as { descricao_produto?: string }).descricao_produto) onChange('prod-descricao', (data as { descricao_produto?: string }).descricao_produto!)
      if ((data as { resultados_clientes?: string }).resultados_clientes) onChange('prod-resultados', (data as { resultados_clientes?: string }).resultados_clientes!)
      if (data.cases_sucesso) onChange('prod-info-extra', data.cases_sucesso)
    } catch (err: unknown) {
      const axiosData = (err as { response?: { data?: { error?: string } } })?.response?.data
      const msg = axiosData?.error ?? (err instanceof Error ? err.message : 'Erro ao pesquisar')
      setPesquisaErro(`Erro: ${msg}`)
    } finally {
      setPesquisando(false)
    }
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Banner Pesquisar com IA — topo */}
      <div className="col-span-2 flex items-center justify-between gap-4 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-gray-800">🔍 Deixa a IA preencher por você</span>
          <span className="text-xs text-gray-500">Informe o site da empresa e clique em Pesquisar — nossa IA extrai dados reais, pesquisa concorrentes, objeções e preenche todos os campos automaticamente.</span>
        </div>
        <button
          type="button"
          onClick={pesquisarComIA}
          disabled={pesquisando}
          className="shrink-0 flex items-center gap-1.5 text-sm px-4 py-2 bg-brand hover:bg-brand-600 disabled:opacity-60 text-white font-medium rounded-lg transition-colors"
        >
          {pesquisando
            ? <><Loader2 size={14} className="animate-spin" /> Pesquisando...</>
            : <><Brain size={14} /> Pesquisar com IA</>
          }
        </button>
      </div>

      {/* Nome do agente */}
      <div className="col-span-2">
        <Field label="Nome do agente" required error={errors['nome-agente']}>
          <input
            id="nome-agente"
            className={inputCls}
            value={form['nome-agente']}
            onChange={e => onChange('nome-agente', e.target.value)}
            placeholder="Ex: Maria — Prospecção SP"
          />
        </Field>
      </div>

      {/* Nome da empresa + CNPJ */}
      <Field label="Nome da empresa" required error={errors['empresa-nome']}>
        <input
          id="empresa-nome"
          className={inputCls}
          value={form['empresa-nome']}
          onChange={e => onChange('empresa-nome', e.target.value)}
          placeholder="Ex: Acme Tecnologia"
        />
      </Field>
      <Field label="CNPJ da empresa">
        <div className="flex gap-2">
          <input
            id="empresa-cnpj"
            className={inputCls}
            value={form['empresa-cnpj']}
            onChange={e => onChange('empresa-cnpj', formatarCnpj(e.target.value))}
            placeholder="00.000.000/0001-00"
            maxLength={18}
          />
          <button
            type="button"
            onClick={buscarCNPJ}
            disabled={buscandoCnpj}
            title="Buscar dados pelo CNPJ"
            className="shrink-0 flex items-center gap-1.5 text-xs px-3 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 font-medium rounded-lg transition-colors whitespace-nowrap"
          >
            {buscandoCnpj ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
            {buscandoCnpj ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
        {cnpjErro && <p className="text-xs text-red-500 mt-1">{cnpjErro}</p>}
      </Field>

      {/* Segmento + Porte */}
      <Field label="Segmento de atuação">
        <select
          id="empresa-segmento"
          className={selectCls}
          value={form['empresa-segmento']}
          onChange={e => onChange('empresa-segmento', e.target.value)}
        >
          <option value="">Selecione...</option>
          {SEGMENTOS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </Field>
      <Field label="Porte da empresa">
        <select
          id="empresa-porte"
          className={selectCls}
          value={form['empresa-porte']}
          onChange={e => onChange('empresa-porte', e.target.value)}
        >
          <option value="">Selecione...</option>
          {PORTES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </Field>

      {/* Site */}
      <div className="col-span-2">
        <Field label="Site da empresa" required error={errors['empresa-site']}>
          <input
            id="empresa-site"
            className={inputCls}
            value={form['empresa-site']}
            onChange={e => onChange('empresa-site', e.target.value)}
            placeholder="https://suaempresa.com.br"
          />
        </Field>
      </div>

      {/* Descrição — o que faz e para quem */}
      <div className="col-span-2">
        <Field label="O que sua empresa faz e para quem">
          <textarea
            id="empresa-descricao"
            className={textareaCls}
            rows={3}
            value={form['empresa-descricao']}
            onChange={e => onChange('empresa-descricao', e.target.value)}
            placeholder="Ex: Somos uma plataforma B2B de automação de vendas que ajuda empresas de tecnologia com 5 a 100 funcionários a aumentarem o número de reuniões comerciais sem contratar mais SDRs..."
          />
        </Field>
        <p className="text-xs text-gray-400 mt-1">Seja específico — o agente vai usar isso na abertura da ligação</p>
      </div>

      {/* Diferenciais competitivos */}
      <div className="col-span-2">
        <Field label="Principais diferenciais competitivos">
          <textarea
            id="empresa-diferenciais"
            className={textareaCls}
            rows={2}
            value={form['empresa-diferenciais']}
            onChange={e => onChange('empresa-diferenciais', e.target.value)}
            placeholder="Ex: Único sistema com IA de voz em PT-BR nativo, integração direta com Google Meet, custo 70% menor que um SDR humano..."
          />
        </Field>
        <p className="text-xs text-gray-400 mt-1">O que você tem que os concorrentes não têm</p>
      </div>

      {/* Concorrentes e objeções do mercado */}
      <div className="col-span-2">
        <Field label="Concorrentes e objeções do mercado">
          <textarea
            id="empresa-objecoes-comuns"
            className={textareaCls}
            rows={3}
            value={form['empresa-objecoes-comuns']}
            onChange={e => onChange('empresa-objecoes-comuns', e.target.value)}
            placeholder="Ex: Concorrentes: Salesforce, RD Station, Moskit&#10;&#10;Objeções: 'Já temos CRM' → Respondemos que o ETZ complementa o CRM existente sem substituí-lo..."
          />
        </Field>
        <p className="text-xs text-gray-400 mt-1">Nossa IA preenche automaticamente ao pesquisar — você pode editar antes de ativar o agente</p>
      </div>

      {pesquisaErro && <p className="col-span-2 text-xs text-red-500">{pesquisaErro}</p>}

      {/* Divisor Produto */}
      <div className="col-span-2 border-t border-gray-100 pt-4 mt-2">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Produto ou serviço</h3>
      </div>

      {/* Nome do produto */}
      <div className="col-span-2">
        <Field label="Nome do produto/serviço" required error={errors['prod-nome']}>
          <input
            id="prod-nome"
            className={inputCls}
            value={form['prod-nome']}
            onChange={e => onChange('prod-nome', e.target.value)}
            placeholder="Ex: Plataforma de Gestão Comercial"
          />
        </Field>
      </div>

      {/* Descrição do produto */}
      <div className="col-span-2">
        <Field label="Descrição do produto">
          <textarea
            id="prod-descricao"
            className={textareaCls}
            rows={3}
            value={form['prod-descricao']}
            onChange={e => onChange('prod-descricao', e.target.value)}
            placeholder="O que é, como funciona, principais funcionalidades..."
          />
        </Field>
        <p className="text-xs text-gray-400 mt-1">Nossa IA preenche automaticamente ao pesquisar</p>
      </div>

      {/* Resultados para clientes */}
      <div className="col-span-2">
        <Field label="Resultados para clientes">
          <textarea
            id="prod-resultados"
            className={textareaCls}
            rows={2}
            value={form['prod-resultados']}
            onChange={e => onChange('prod-resultados', e.target.value)}
            placeholder="Qual resultado o cliente obtém? Ex: reduz inadimplência em 30%, decisões de crédito mais seguras..."
          />
        </Field>
        <p className="text-xs text-gray-400 mt-1">Nossa IA preenche automaticamente ao pesquisar</p>
      </div>

      {/* Cases de sucesso */}
      <div className="col-span-2">
        <Field label="Cases de sucesso e provas sociais">
          <textarea
            id="prod-info-extra"
            className={textareaCls}
            rows={2}
            value={form['prod-info-extra']}
            onChange={e => onChange('prod-info-extra', e.target.value)}
            placeholder="Ex: +5.000 clientes, parceria oficial Serasa, case com redução de 40% na inadimplência..."
          />
        </Field>
      </div>
    </div>
  )
}



type FiltroGenero = 'Todos' | 'Feminino' | 'Masculino'

function VozSelector({ form, onChange }: { form: FormData; onChange: (k: keyof FormData, v: string) => void }) {
  const [filtro, setFiltro] = useState<FiltroGenero>('Todos')
  const [previewingId, setPreviewingId] = useState<string | null>(null)

  async function playPreview(e: React.MouseEvent, voiceId: string) {
    e.stopPropagation()
    if (previewingId) return
    setPreviewingId(voiceId)
    try {
      const token = localStorage.getItem('youagent_jwt')
      const resp = await fetch(
        `https://app.etztech.com/api/v1/agentes/preview-voz?voice_id=${encodeURIComponent(voiceId)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!resp.ok) throw new Error('preview failed')
      const blob = await resp.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audio.onended = () => { setPreviewingId(null); URL.revokeObjectURL(url) }
      audio.onerror = () => { setPreviewingId(null); URL.revokeObjectURL(url) }
      audio.play()
    } catch {
      setPreviewingId(null)
    }
  }

  const grupos = (['pt-BR', 'pt-PT'] as const).map(idioma => ({
    idioma,
    label: idioma === 'pt-BR' ? 'Português — Brasil' : 'Português — Portugal',
    vozes: VOZES_TELNYX.filter(
      v => v.idioma === idioma && (filtro === 'Todos' || v.genero === filtro)
    ),
  })).filter(g => g.vozes.length > 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-700">Voz do agente</p>
        <div className="flex gap-1">
          {(['Todos', 'Feminino', 'Masculino'] as FiltroGenero[]).map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setFiltro(f)}
              className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                filtro === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {grupos.map(g => (
          <div key={g.idioma}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{g.label}</p>
            <div className="grid grid-cols-3 gap-2">
              {g.vozes.map(v => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => onChange('voz', v.id)}
                  className={`text-left p-3 rounded-xl border-2 transition-all flex flex-col gap-1.5 ${
                    form.voz === v.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg">{v.genero === 'Feminino' ? '👩‍💼' : '👨‍💼'}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => playPreview(e, v.id)}
                        className="w-6 h-6 rounded-full flex items-center justify-center bg-gray-100 hover:bg-blue-100 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Ouvir prévia"
                      >
                        {previewingId === v.id
                          ? <Loader2 size={10} className="animate-spin" />
                          : <Play size={10} />}
                      </button>
                      {form.voz === v.id && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                    </div>
                  </div>
                  <p className="font-semibold text-gray-900 text-sm leading-tight">{v.nome}</p>
                  <div className="flex flex-wrap gap-1">
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">{v.modelo}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      v.genero === 'Feminino' ? 'bg-pink-50 text-pink-600' : 'bg-sky-50 text-sky-600'
                    }`}>{v.genero}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Step3({
  form,
  onChange,
  objecoes,
  onObjecoesChange,
  regioes,
  onRegioesChange,
}: {
  form: FormData
  onChange: (k: keyof FormData, v: string) => void
  objecoes: Objecao[]
  onObjecoesChange: (o: Objecao[]) => void
  regioes: string[]
  onRegioesChange: (r: string[]) => void
}) {
  function toggleRegiao(estado: string) {
    onRegioesChange(
      regioes.includes(estado)
        ? regioes.filter(r => r !== estado)
        : [...regioes, estado]
    )
  }

  function toggleRegiaoGrupo(estados: string[]) {
    const allSelected = estados.every(e => regioes.includes(e))
    if (allSelected) {
      onRegioesChange(regioes.filter(r => !estados.includes(r)))
    } else {
      const novos = estados.filter(e => !regioes.includes(e))
      onRegioesChange([...regioes, ...novos])
    }
  }
  function updateObjecao(i: number, field: keyof Objecao, value: string) {
    const next = objecoes.map((o, idx) => idx === i ? { ...o, [field]: value } : o)
    onObjecoesChange(next)
  }

  function addObjecao() {
    if (objecoes.length < 5) onObjecoesChange([...objecoes, { objecao: '', rebuttal: '' }])
  }

  function removeObjecao(i: number) {
    if (objecoes.length > 1) onObjecoesChange(objecoes.filter((_, idx) => idx !== i))
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ICP */}
      <div className="grid grid-cols-3 gap-4">
        <Field label="Cargo do decisor">
          <select
            id="icp-cargo-tipo"
            className={selectCls}
            value={form['icp-cargo-tipo']}
            onChange={e => onChange('icp-cargo-tipo', e.target.value)}
          >
            <option value="">Selecione...</option>
            {CARGOS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Porte alvo">
          <select
            id="icp-porte-alvo"
            className={selectCls}
            value={form['icp-porte-alvo']}
            onChange={e => onChange('icp-porte-alvo', e.target.value)}
          >
            <option value="">Selecione...</option>
            {PORTES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="Segmento prioritário">
          <select
            id="icp-segmento-alvo"
            className={selectCls}
            value={form['icp-segmento-alvo']}
            onChange={e => onChange('icp-segmento-alvo', e.target.value)}
          >
            <option value="">Selecione...</option>
            {SEGMENTOS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
      </div>

      {/* Metodologia */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">Metodologia de vendas</p>
        <div className="grid grid-cols-2 gap-2">
          {METODOLOGIAS.map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => onChange('metodologia', m.id)}
              className={`text-left px-4 py-3 rounded-xl border-2 transition-all ${
                form.metodologia === m.id
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <p className="font-semibold text-gray-900 text-sm">{m.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{m.descricao}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Script de abertura */}
      <Field label="Script de abertura">
        <textarea
          id="script-abertura"
          className={textareaCls}
          rows={4}
          value={form['script-abertura']}
          onChange={e => onChange('script-abertura', e.target.value)}
          placeholder="Como o agente se apresenta e inicia a conversa? Use [nome], [empresa], [produto] como variáveis."
        />
        <p className="text-xs text-gray-400 mt-1">Variáveis: [nome], [empresa], [produto], [cargo]</p>
      </Field>

      {/* Sinais de compra */}
      <Field label="Sinais de compra customizados">
        <textarea
          id="gatilhos-customizados"
          className={textareaCls}
          rows={2}
          value={form['gatilhos-customizados']}
          onChange={e => onChange('gatilhos-customizados', e.target.value)}
          placeholder="Ex: menciona expansão, novo produto, insatisfação com fornecedor atual..."
        />
      </Field>

      {/* Perguntas de qualificação */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">Perguntas de qualificação</p>
        <div className="flex flex-col gap-2">
          {(['wiz-qualif-q1', 'wiz-qualif-q2', 'wiz-qualif-q3'] as const).map((k, i) => (
            <div key={k} className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-4 shrink-0">{i + 1}.</span>
              <input
                id={k}
                className={inputCls}
                value={form[k]}
                onChange={e => onChange(k, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Objeções + Rebuttals */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-gray-700">Objeções e respostas</p>
          {objecoes.length < 5 && (
            <button
              type="button"
              onClick={addObjecao}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              + Adicionar objeção
            </button>
          )}
        </div>
        <div className="flex flex-col gap-3">
          {objecoes.map((obj, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-3 flex flex-col gap-2 bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500">Objeção {i + 1}</span>
                {objecoes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeObjecao(i)}
                    className="text-xs text-red-400 hover:text-red-600 transition-colors"
                  >✕</button>
                )}
              </div>
              <input
                className={inputCls}
                placeholder='Ex: "Não tenho orçamento agora"'
                value={obj.objecao}
                onChange={e => updateObjecao(i, 'objecao', e.target.value)}
              />
              <textarea
                className={textareaCls}
                rows={2}
                placeholder="Como o agente responde a essa objeção..."
                value={obj.rebuttal}
                onChange={e => updateObjecao(i, 'rebuttal', e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Região / cobertura geográfica */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <MapPin size={15} className="text-gray-500" />
          <p className="text-sm font-medium text-gray-700">Região de cobertura</p>
          <span className="text-xs text-gray-400">(opcional — deixe vazio para todo o Brasil)</span>
        </div>
        <div className="flex flex-col gap-3">
          {Object.entries(REGIOES_BR).map(([regiao, estados]) => {
            const allSelected = estados.every(e => regioes.includes(e))
            return (
              <div key={regiao} className="border border-gray-200 rounded-xl p-3 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <button
                    type="button"
                    onClick={() => toggleRegiaoGrupo(estados)}
                    className="flex items-center gap-2"
                  >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                      allSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300 bg-white'
                    }`}>
                      {allSelected && <Check size={10} className="text-white" />}
                    </div>
                    <span className="text-xs font-semibold text-gray-600">{regiao}</span>
                  </button>
                  <span className="text-xs text-gray-400">
                    {estados.filter(e => regioes.includes(e)).length}/{estados.length}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {estados.map(estado => (
                    <button
                      key={estado}
                      type="button"
                      onClick={() => toggleRegiao(estado)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                        regioes.includes(estado)
                          ? 'border-blue-500 bg-blue-500 text-white'
                          : 'border-gray-300 bg-white text-gray-600 hover:border-blue-300'
                      }`}
                    >
                      {estado}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Capacidades do agente */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Zap size={15} className="text-brand" />
          <p className="text-sm font-medium text-gray-700">Capacidades do agente</p>
        </div>
        <p className="text-xs text-gray-400 mb-3">
          Defina o que o agente pode fazer ao qualificar um lead. As capacidades ativas são usadas em todas as campanhas deste agente.
        </p>
        <div className="flex flex-col gap-2">
          {/* Transferência ao vivo */}
          <div className={`flex items-start justify-between p-3 border rounded-xl transition-colors ${
            form['capacidade-transferencia'] === 'true' ? 'border-brand-200 bg-brand-50' : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                form['capacidade-transferencia'] === 'true' ? 'bg-brand-100' : 'bg-gray-200'
              }`}>
                <PhoneForwarded size={14} className={form['capacidade-transferencia'] === 'true' ? 'text-brand' : 'text-gray-400'} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Transferência ao vivo</p>
                <p className="text-xs text-gray-500 mt-0.5">Quando identificar interesse real, transfere a ligação para um vendedor disponível fechar na hora.</p>
                {form['capacidade-transferencia'] === 'true' && (
                  <p className="text-xs text-brand-600 mt-1 font-medium">Vendedores e regiões configurados na campanha.</p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onChange('capacidade-transferencia', form['capacidade-transferencia'] === 'true' ? 'false' : 'true')}
              className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ml-3 mt-0.5 ${
                form['capacidade-transferencia'] === 'true' ? 'bg-brand' : 'bg-gray-300'
              }`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                form['capacidade-transferencia'] === 'true' ? 'translate-x-5' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {/* Agendamento de reuniões */}
          <div className={`flex items-start justify-between p-3 border rounded-xl transition-colors ${
            form['capacidade-agendamento'] === 'true' ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                form['capacidade-agendamento'] === 'true' ? 'bg-emerald-100' : 'bg-gray-200'
              }`}>
                <CalendarCheck size={14} className={form['capacidade-agendamento'] === 'true' ? 'text-emerald-600' : 'text-gray-400'} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Agendamento de reuniões</p>
                <p className="text-xs text-gray-500 mt-0.5">Quando o lead não estiver pronto para comprar agora, agenda uma reunião diretamente no calendário.</p>
                {form['capacidade-agendamento'] === 'true' && (
                  <p className="text-xs text-emerald-600 mt-1 font-medium">Modalidade (online/presencial) e calendário configurados na campanha.</p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onChange('capacidade-agendamento', form['capacidade-agendamento'] === 'true' ? 'false' : 'true')}
              className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ml-3 mt-0.5 ${
                form['capacidade-agendamento'] === 'true' ? 'bg-emerald-500' : 'bg-gray-300'
              }`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                form['capacidade-agendamento'] === 'true' ? 'translate-x-5' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* Compliance LGPD */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Shield size={15} className="text-gray-500" />
          <p className="text-sm font-medium text-gray-700">Compliance e LGPD</p>
        </div>
        <div className="flex flex-col gap-2">
          {[
            { key: 'compliance-anatel' as keyof FormData, label: 'Seguir horários Anatel', descricao: 'Ligar apenas entre 8h e 21h, sem domingos' },
            { key: 'compliance-optout' as keyof FormData, label: 'Registrar opt-out automático', descricao: 'Quando contato pedir para não ser ligado, bloquear automaticamente' },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between p-3 border border-gray-200 rounded-xl bg-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-800">{item.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.descricao}</p>
              </div>
              <button
                type="button"
                onClick={() => onChange(item.key, form[item.key] === 'true' ? 'false' : 'true')}
                className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${
                  form[item.key] === 'true' ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  form[item.key] === 'true' ? 'translate-x-5' : 'translate-x-1'
                }`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <VozSelector form={form} onChange={onChange} />

      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">Tom de comunicação</p>
        <div className="grid grid-cols-2 gap-2">
          {TONS_CARDS.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange('tom', t.id)}
              className={`text-left px-4 py-3 rounded-xl border-2 transition-all ${
                form.tom === t.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <p className="font-semibold text-gray-900 text-sm">{t.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t.descricao}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function calcularIcpScore(form: FormData): number {
  let score = 0
  // Cargo: 30 pontos
  const cargosAltos = ['ceo', 'diretor', 'sócio', 'owner', 'presidente', 'vp', 'c-level']
  const cargoLower = (form['icp-cargo-tipo'] ?? '').toLowerCase()
  if (cargosAltos.some(c => cargoLower.includes(c))) score += 30
  else if (cargoLower.includes('gerente') || cargoLower.includes('coordenador')) score += 20
  else if (cargoLower.length > 0) score += 10

  // Segmento: 25 pontos
  if (form['empresa-segmento']) score += 20

  // Porte: 20 pontos
  const porte = form['empresa-porte'] ?? ''
  if (porte.includes('grande') || porte.includes('enterprise')) score += 20
  else if (porte.includes('médio') || porte.includes('medio')) score += 15
  else if (porte.includes('pequeno') || porte.includes('startup')) score += 10
  else if (porte.length > 0) score += 8

  // Produto preenchido: 12 pontos
  if (form['prod-nome']) score += 12

  // Qualificação: 8 pontos
  if (form['wiz-qualif-q1'] || form['wiz-qualif-q2']) score += 8

  return Math.min(score, 95)
}

function Step4({
  form,
  activated,
  activating,
  activatingStep,
  objecoes,
  regioes,
  onActivate,
  onReset,
  modoEdicao,
}: {
  form: FormData
  activated: boolean
  activating?: boolean
  activatingStep?: number
  objecoes: Objecao[]
  regioes: string[]
  onActivate: () => void
  onReset: () => void
  modoEdicao: boolean
}) {
  const navigate = useNavigate()
  const icpScore = calcularIcpScore(form)
  const vozNome = VOZES_TELNYX.find(v => v.id === form.voz)?.nome ?? form.voz
  const metLabel = METODOLOGIAS.find(m => m.id === form.metodologia)?.label
  const objecoesValidas = objecoes.filter(o => o.objecao.trim())
  const perguntasValidas = [form['wiz-qualif-q1'], form['wiz-qualif-q2'], form['wiz-qualif-q3']].filter(Boolean)

  const LOADING_STEPS = [
    modoEdicao ? 'Atualizando agente no Telnyx...' : 'Criando agente no Telnyx...',
    'Injetando inteligência herdada do CI...',
    'Configurando script e objeções...',
    modoEdicao ? 'Agente atualizado! ✓' : 'Agente em treinamento! ✓',
  ]

  if (activating) {
    return (
      <div className="flex flex-col items-center py-10 gap-6 text-center">
        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
          <Loader2 size={32} className="text-blue-600 animate-spin" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {modoEdicao ? 'Atualizando agente...' : 'Ativando agente...'}
          </h2>
          <div className="flex flex-col gap-2 text-left w-64 mx-auto">
            {LOADING_STEPS.map((s, i) => (
              <div key={i} className={`flex items-center gap-2 text-sm transition-all ${
                i < (activatingStep ?? 0) ? 'text-green-600' : i === (activatingStep ?? 0) ? 'text-blue-600 font-medium' : 'text-gray-300'
              }`}>
                {i < (activatingStep ?? 0)
                  ? <Check size={14} strokeWidth={3} className="shrink-0" />
                  : i === (activatingStep ?? 0)
                  ? <Loader2 size={14} className="animate-spin shrink-0" />
                  : <div className="w-3.5 h-3.5 rounded-full border border-gray-200 shrink-0" />
                }
                {s}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (activated) {
    return (
      <div className="flex flex-col items-center py-10 gap-6 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
          <Check size={40} className="text-green-600" strokeWidth={3} />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {modoEdicao ? `Agente ${form['nome-agente'] || form['empresa-nome']} atualizado!` : `Agente ${form['nome-agente'] || form['empresa-nome']} criado com sucesso!`}
          </h2>
          <p className="text-sm text-gray-500 mt-2 max-w-md">
            {modoEdicao
              ? 'As configurações foram salvas e o sistema do Telnyx foi atualizado.'
              : 'O agente está em treinamento. Certifique-o no Simulador antes de ativar para produção.'
            }
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ver Dashboard <ChevronRight size={16} />
          </button>
          <button
            onClick={onReset}
            className="px-5 py-2.5 border border-gray-300 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {modoEdicao ? 'Voltar aos agentes' : 'Criar outro agente'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="bg-gray-50 rounded-xl p-5 flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Resumo da configuração</h3>

        <div className="grid grid-cols-2 gap-4 text-sm">
          {/* Agente */}
          <div className="col-span-2 pb-3 border-b border-gray-200">
            <p className="text-xs text-gray-400 mb-0.5">Nome do agente</p>
            <p className="font-semibold text-gray-900 text-base">{form['nome-agente'] || '—'}</p>
          </div>
          {/* Empresa */}
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Empresa</p>
            <p className="font-medium text-gray-900">{form['empresa-nome'] || '—'}</p>
            {form['empresa-segmento'] && (
              <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{form['empresa-segmento']}</span>
            )}
          </div>
          {/* Produto */}
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Produto</p>
            <p className="font-medium text-gray-900">{form['prod-nome'] || '—'}</p>
          </div>
          {/* ICP */}
          <div>
            <p className="text-xs text-gray-400 mb-0.5">ICP</p>
            <p className="font-medium text-gray-900">
              {[form['icp-cargo-tipo'], form['icp-porte-alvo'], form['icp-segmento-alvo']].filter(Boolean).join(' · ') || '—'}
            </p>
          </div>
          {/* Voz + Tom */}
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Voz · Tom</p>
            <p className="font-medium text-gray-900">{[vozNome, form.tom].filter(Boolean).join(' · ') || '—'}</p>
          </div>
          {/* Metodologia */}
          {metLabel && (
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Metodologia</p>
              <p className="font-medium text-gray-900">{metLabel}</p>
            </div>
          )}
          {/* Script */}
          {form['script-abertura'] && (
            <div className="col-span-2">
              <p className="text-xs text-gray-400 mb-0.5">Script de abertura</p>
              <p className="font-medium text-gray-900 text-xs leading-relaxed line-clamp-2">{form['script-abertura']}</p>
            </div>
          )}
        </div>

        {/* Cobertura + Compliance */}
        {(regioes.length > 0 || form['compliance-anatel'] === 'true' || form['compliance-optout'] === 'true') && (
          <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t border-gray-200">
            {regioes.length > 0 && (
              <div className="col-span-2">
                <p className="text-xs text-gray-400 mb-1">Cobertura geográfica</p>
                <p className="text-xs font-medium text-gray-700 leading-relaxed">{regioes.join(', ')}</p>
              </div>
            )}
            {(form['compliance-anatel'] === 'true' || form['compliance-optout'] === 'true') && (
              <div className="col-span-2 flex flex-wrap gap-2">
                {form['compliance-anatel'] === 'true' && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-700 font-medium">✓ Anatel 8h–21h</span>
                )}
                {form['compliance-optout'] === 'true' && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-700 font-medium">✓ Opt-out automático</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Capacidades */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
          {form['capacidade-transferencia'] === 'true' && (
            <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-brand-100 text-brand-700 font-medium">
              <PhoneForwarded size={10} /> Transferência ao vivo
            </span>
          )}
          {form['capacidade-agendamento'] === 'true' && (
            <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium">
              <CalendarCheck size={10} /> Agendamento de reuniões
            </span>
          )}
          {form['capacidade-transferencia'] !== 'true' && form['capacidade-agendamento'] !== 'true' && (
            <span className="text-xs text-gray-400 italic">Nenhuma capacidade ativa — o agente só qualificará leads.</span>
          )}
        </div>

        {/* Perguntas + Objeções */}
        <div className="flex flex-wrap gap-3 text-xs text-gray-500 pt-1 border-t border-gray-200">
          <span>✓ {perguntasValidas.length} perguntas de qualificação</span>
          {objecoesValidas.length > 0 && <span>✓ {objecoesValidas.length} objeção(ões) mapeada(s)</span>}
          {form['gatilhos-customizados'] && <span>✓ Sinais de compra configurados</span>}
          {regioes.length === 0 && <span className="text-gray-400">🌎 Todo Brasil</span>}
        </div>

        {/* Badge herança CI */}
        <div className="flex items-center gap-2 bg-purple-50 border border-purple-100 rounded-lg px-3 py-2">
          <Brain size={14} className="text-purple-600 shrink-0" />
          <p className="text-xs text-purple-700">Este agente herdará os argumentos aprovados e padrões de ICP do Centro de Inteligência.</p>
        </div>

        <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
          <span className="text-xs text-gray-500">Score ICP estimado</span>
          <div className="flex items-center gap-2">
            <div className="w-24 bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${icpScore >= 60 ? 'bg-green-500' : icpScore >= 30 ? 'bg-amber-500' : 'bg-blue-500'}`}
                style={{ width: `${icpScore}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-blue-600">{icpScore}/100</span>
          </div>
        </div>
      </div>

      <button
        onClick={onActivate}
        className="flex items-center justify-center gap-2 w-full py-3.5 bg-green-600 text-white font-semibold text-base rounded-xl hover:bg-green-700 transition-colors"
      >
        <Bot size={20} />
        {modoEdicao ? 'Salvar alterações' : 'Ativar Agente'}
      </button>
    </div>
  )
}

// ─── Agente type ─────────────────────────────────────────────────────────────

interface AgenteMock {
  id: string
  nome: string
  voz: string
  campanhasAtivas: number
  avatar: string
  cor: string
  // real API fields (optional)
  empresa?: string
  segmento?: string
  produto?: string
  icp_cargo?: string
  icp_segmento?: string
  icp_porte?: string
  tom?: string
  status?: string
  horarios?: Record<string, boolean>
}

const COR_LIST = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-amber-500', 'bg-rose-500', 'bg-indigo-500']

function normalizeAgente(raw: Record<string, unknown>, idx: number): AgenteMock {
  const nome = (raw.nome as string) || 'Agente'
  return {
    id: (raw.id as string) || String(idx),
    nome,
    voz: (raw.voz_id as string) || (raw.voz as string) || '',
    campanhasAtivas: (raw.campanhas_ativas as number) ?? 0,
    avatar: nome.charAt(0).toUpperCase(),
    cor: COR_LIST[idx % COR_LIST.length],
    empresa: raw.empresa as string,
    segmento: raw.segmento as string,
    produto: raw.produto as string,
    icp_cargo: raw.icp_cargo as string,
    icp_segmento: raw.icp_segmento as string,
    icp_porte: raw.icp_porte as string,
    tom: raw.tom as string,
    status: raw.status as string,
    horarios: raw.horarios as Record<string, boolean> | undefined,
    metodologia: raw.metodologia as string,
  } as AgenteMock & { metodologia?: string }
}

const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const HORAS = ['8h', '9h', '10h', '11h', '12h', '13h', '14h', '15h', '16h', '17h', '18h']

interface HorariosState {
  [key: string]: boolean
}

function ModalHorarios({ agente, onClose }: { agente: AgenteMock; onClose: () => void }) {
  function buildInitial(): HorariosState {
    // Se o agente já tem horários salvos, usa eles
    if (agente.horarios && Object.keys(agente.horarios).length > 0) {
      // Garante que todas as células existam (preenche faltantes com false)
      const base: HorariosState = {}
      DIAS.forEach(d => HORAS.forEach(h => { base[`${d}-${h}`] = false }))
      return { ...base, ...agente.horarios }
    }
    // Padrão: Seg–Sex ON, Sáb/Dom OFF
    const def: HorariosState = {}
    DIAS.forEach(d => HORAS.forEach(h => {
      def[`${d}-${h}`] = d !== 'Sáb' && d !== 'Dom'
    }))
    return def
  }
  const [horarios, setHorarios] = useState<HorariosState>(buildInitial)

  function toggle(key: string) {
    setHorarios(prev => ({ ...prev, [key]: !prev[key] }))
  }

  function toggleDia(d: string) {
    const allOn = HORAS.every(h => horarios[`${d}-${h}`])
    const next: HorariosState = { ...horarios }
    HORAS.forEach(h => { next[`${d}-${h}`] = !allOn })
    setHorarios(next)
  }

  function toggleHora(h: string) {
    const allOn = DIAS.every(d => horarios[`${d}-${h}`])
    const next: HorariosState = { ...horarios }
    DIAS.forEach(d => { next[`${d}-${h}`] = !allOn })
    setHorarios(next)
  }

  const [salvando, setSalvando] = useState(false)
  const [salvoOk, setSalvoOk] = useState(false)

  async function handleSalvarHorarios() {
    if (!agente?.id) { onClose(); return }
    setSalvando(true)
    try {
      await agentesApi.update(agente.id, { horarios })
      setSalvoOk(true)
      setTimeout(() => { setSalvoOk(false); onClose() }, 1200)
    } catch(e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } }; message?: string })
        ?.response?.data?.error || 'Erro ao salvar horários'
      alert(msg)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-blue-600" />
            <h3 className="text-base font-semibold text-gray-900">Horários do Agente — {agente.nome}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">
            <X size={16} />
          </button>
        </div>

        <p className="text-xs text-gray-400">Clique no dia ou horário para marcar/desmarcar toda a coluna/linha.</p>

        <div className="overflow-x-auto">
          <table className="text-xs w-full">
            <thead>
              <tr>
                <th className="text-gray-400 font-medium pb-2 pr-3 text-left">Horário</th>
                {DIAS.map(d => (
                  <th key={d} className="pb-2 px-2 text-center">
                    <button
                      type="button"
                      onClick={() => toggleDia(d)}
                      className={`text-xs font-semibold px-1.5 py-0.5 rounded transition-colors ${
                        d === 'Sáb' || d === 'Dom' ? 'text-orange-500 hover:bg-orange-50' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >{d}</button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {HORAS.map(h => (
                <tr key={h}>
                  <td className="py-1.5 pr-3">
                    <button
                      type="button"
                      onClick={() => toggleHora(h)}
                      className="text-gray-500 font-mono hover:text-blue-600 hover:underline transition-colors"
                    >{h}</button>
                  </td>
                  {DIAS.map(d => {
                    const key = `${d}-${h}`
                    return (
                      <td key={d} className="py-1.5 px-2 text-center">
                        <input
                          type="checkbox"
                          checked={!!horarios[key]}
                          onChange={() => toggle(key)}
                          className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                        />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                const s: HorariosState = {}
                DIAS.forEach(d => HORAS.forEach(h => {
                  const hr = parseInt(h)
                  s[`${d}-${h}`] = !['Sáb', 'Dom'].includes(d) && hr >= 9 && hr <= 18
                }))
                setHorarios(s)
              }}
              className="text-xs px-3 py-1.5 border border-blue-200 rounded-lg hover:bg-blue-50 text-blue-600 font-medium transition-colors"
            >Comercial (Seg–Sex 9h–18h)</button>
            <button
              type="button"
              onClick={() => { const s: HorariosState = {}; DIAS.forEach(d => HORAS.forEach(h => { s[`${d}-${h}`] = true })); setHorarios(s) }}
              className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
            >Marcar todos</button>
            <button
              type="button"
              onClick={() => { const s: HorariosState = {}; DIAS.forEach(d => HORAS.forEach(h => { s[`${d}-${h}`] = false })); setHorarios(s) }}
              className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
            >Limpar todos</button>
          </div>
          <div className="flex gap-3 items-center">
            {salvoOk && (
              <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
                <Check size={15} strokeWidth={3} /> Salvo!
              </span>
            )}
            <button onClick={onClose} disabled={salvando} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
              Cancelar
            </button>
            <button onClick={handleSalvarHorarios} disabled={salvando || salvoOk} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-brand rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-60">
              {salvando ? <Loader2 size={14} className="animate-spin" /> : salvoOk ? <Check size={14} strokeWidth={3} /> : null}
              {salvando ? 'Salvando...' : salvoOk ? 'Salvo!' : 'Salvar horários'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ModalAtivacao({ agente, onClose, onAtivado }: { agente: AgenteMock; onClose: () => void; onAtivado: () => void }) {
  const [ativando, setAtivando] = useState(false)
  const [erro, setErro] = useState('')
  const raw = agente as AgenteMock & { simulacoes_realizadas?: number; score_certificacao?: number; certificado_em?: string; relatorio_prontidao?: Record<string, unknown> }
  const certificado = !!raw.certificado_em
  const pontos = (raw.relatorio_prontidao as { pontos_fortes?: string[]; pontos_melhoria?: string[] } | undefined)

  async function ativar() {
    setAtivando(true)
    setErro('')
    try {
      await agentesApi.update(agente.id, { status: 'ativo' })
      onAtivado()
      onClose()
    } catch {
      setErro('Erro ao ativar. Tente novamente.')
    } finally {
      setAtivando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">Ativar agente para produção</h2>
            <p className="text-xs text-gray-400 mt-0.5">{agente.nome}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">✕</button>
        </div>

        {/* Resumo de certificação */}
        <div className={`rounded-xl p-4 mb-4 ${certificado ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
          <p className={`text-xs font-semibold mb-2 ${certificado ? 'text-emerald-700' : 'text-amber-700'}`}>
            {certificado ? '✓ Agente certificado pelo Simulador' : '⚠ Agente não certificado ainda'}
          </p>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <p className="text-lg font-bold font-mono text-gray-800">{raw.simulacoes_realizadas ?? 0}</p>
              <p className="text-xs text-gray-500">Simulações</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold font-mono text-gray-800">{raw.score_certificacao ?? '—'}</p>
              <p className="text-xs text-gray-500">Score final</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-gray-800">
                {raw.certificado_em ? new Date(raw.certificado_em).toLocaleDateString('pt-BR') : '—'}
              </p>
              <p className="text-xs text-gray-500">Certificado em</p>
            </div>
          </div>
          {pontos?.pontos_fortes && pontos.pontos_fortes.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-emerald-700 mb-1">Pontos fortes</p>
              {pontos.pontos_fortes.slice(0, 3).map((p, i) => (
                <p key={i} className="text-xs text-gray-600 flex gap-1"><span className="text-emerald-500">✓</span>{p}</p>
              ))}
            </div>
          )}
          {pontos?.pontos_melhoria && pontos.pontos_melhoria.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-semibold text-amber-700 mb-1">Atenção antes de ativar</p>
              {pontos.pontos_melhoria.slice(0, 2).map((p, i) => (
                <p key={i} className="text-xs text-gray-600 flex gap-1"><span className="text-amber-500">→</span>{p}</p>
              ))}
            </div>
          )}
        </div>

        {!certificado && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mb-4">
            <p className="text-xs text-blue-700">Recomendamos certificar o agente no Simulador antes de ativar. Você ainda pode ativar sem certificação, mas o agente não passou pelos 5 cenários obrigatórios.</p>
          </div>
        )}

        {erro && <p className="text-xs text-red-600 mb-3">{erro}</p>}

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
            Cancelar
          </button>
          <button onClick={ativar} disabled={ativando}
            className="flex-1 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60 flex items-center justify-center gap-1">
            {ativando ? <Loader2 size={14} className="animate-spin" /> : null}
            {ativando ? 'Ativando...' : certificado ? 'Ativar agente' : 'Ativar mesmo assim'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AgenteCard({
  agente,
  onHorarios,
  onEditar,
  onDuplicar,
  onAtivar,
  onDeletar,
  duplicating,
  deleting,
}: {
  agente: AgenteMock
  onHorarios: () => void
  onEditar: () => void
  onDuplicar: () => void
  onAtivar: () => void
  onDeletar: () => void
  duplicating?: boolean
  deleting?: boolean
}) {
  const emTreinamento = agente.status === 'em_treinamento' || agente.status === 'inativo'
  const vozNome = VOZES_TELNYX.find(v => v.id === agente.voz)?.nome
  const infoTags = [
    vozNome || agente.voz,
    agente.tom,
    (agente as AgenteMock & { metodologia?: string }).metodologia,
  ].filter(Boolean)

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      {/* Linha de status */}
      <div className={`h-0.5 w-full ${emTreinamento ? 'bg-amber-400' : 'bg-emerald-500'}`} />

      <div className="p-4 flex flex-col gap-3">
        {/* Cabeçalho */}
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg ${agente.cor} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
            {agente.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-sm text-gray-900 truncate leading-tight">{agente.nome}</p>
              <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                emTreinamento
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                {emTreinamento ? 'Configurando' : 'Ativo'}
              </span>
            </div>
            {agente.empresa && agente.empresa !== agente.nome && (
              <p className="text-xs text-gray-400 truncate mt-0.5">{agente.empresa}</p>
            )}
            {infoTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {infoTags.map(tag => (
                  <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Info de estado */}
        {!emTreinamento ? (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-xs text-gray-500">{agente.campanhasAtivas} campanha{agente.campanhasAtivas !== 1 ? 's' : ''} ativa{agente.campanhasAtivas !== 1 ? 's' : ''}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <Brain size={12} className="text-amber-500 shrink-0" />
            <span className="text-xs text-gray-500">Certifique no <span className="font-medium text-gray-700">Simulador</span> antes de ativar</span>
          </div>
        )}

        {/* Ações */}
        <div className="flex items-center gap-1 pt-2 border-t border-gray-100">
          <button onClick={onEditar} title="Editar"
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900">
            <Pencil size={12} /> Editar
          </button>
          <button onClick={onHorarios} title="Horários"
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900">
            <Clock size={12} /> Horários
          </button>
          <button onClick={onDuplicar} disabled={duplicating} title="Duplicar"
            className="flex items-center gap-1 text-xs font-medium p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 disabled:opacity-40">
            {duplicating ? <Loader2 size={13} className="animate-spin" /> : <Copy size={13} />}
          </button>
          <button onClick={onDeletar} disabled={deleting} title="Deletar"
            className="flex items-center gap-1 text-xs font-medium p-1.5 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-500 disabled:opacity-40">
            {deleting ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
          </button>
          {emTreinamento && (
            <button onClick={onAtivar}
              className="ml-auto flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-brand text-white rounded-lg hover:bg-brand-600 transition-colors shadow-sm">
              <Zap size={11} />
              Ativar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}


// ─── Page ────────────────────────────────────────────────────────────────────

// Chave localStorage para última sincronização CI
const CI_SYNC_KEY = 'etz_ultima_sync_ci'

export default function OnboardingPage() {
  const [tela, setTela] = useState<'grid' | 'wizard'>('grid')
  const [agenteHorarios, setAgenteHorarios] = useState<AgenteMock | null>(null)
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [activated, setActivated] = useState(false)
  const [activating, setActivating] = useState(false)
  const [activateError, setActivateError] = useState('')
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [agenteAtivacao, setAgenteAtivacao] = useState<AgenteMock | null>(null)
  const [sincronizando, setSincronizando] = useState(false)
  const [syncFeedback, setSyncFeedback] = useState<{ ok: boolean; msg: string } | null>(null)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [objecoes, setObjecoes] = useState<Objecao[]>(INITIAL_OBJECOES)
  const [regioes, setRegioes] = useState<string[]>([])
  const [activatingStep, setActivatingStep] = useState(0)
  const [showBemVindo, setShowBemVindo] = useState(false)

  // Última sincronização CI (localStorage)
  const [ultimaSync, setUltimaSync] = useState<string>(() =>
    localStorage.getItem(CI_SYNC_KEY) || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  )

  // Verifica pendências CI — polling a cada 5 min
  const { data: ciStatus } = useQuery({
    queryKey: ['ci-pendencias', ultimaSync],
    queryFn: () => agentesApi.ciPendencias(ultimaSync).then(r => r.data as {
      pendente: boolean; motivos: string[]; total: number
    }),
    refetchInterval: 5 * 60 * 1000, // 5 min
    staleTime: 60 * 1000,
  })

  async function sincronizarComCI() {
    setSincronizando(true)
    setSyncFeedback(null)
    try {
      const res = await agentesApi.sincronizarTodos()
      const data = res.data as { sincronizados: number; mensagem: string }
      const agora = new Date().toISOString()
      localStorage.setItem(CI_SYNC_KEY, agora)
      setUltimaSync(agora)
      setSyncFeedback({ ok: true, msg: data.mensagem || `✅ ${data.sincronizados} agente(s) sincronizado(s)` })
      setTimeout(() => setSyncFeedback(null), 6000)
    } catch {
      setSyncFeedback({ ok: false, msg: '❌ Erro ao sincronizar. Tente novamente.' })
    } finally {
      setSincronizando(false)
    }
  }

  // Limpa feedback ao trocar de tela
  useEffect(() => { setSyncFeedback(null) }, [tela])

  const { data: agentesRaw = [], refetch: refetchAgentes } = useQuery({
    queryKey: ['agentes'],
    queryFn: () => agentesApi.list().then(r => r.data as Record<string, unknown>[]),
  })

  const agentes: AgenteMock[] = agentesRaw.map((a, i) => normalizeAgente(a, i))

  function onChange(k: keyof FormData, v: string) {
    setForm(prev => ({ ...prev, [k]: v }))
    setErrors(prev => ({ ...prev, [k]: undefined }))
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof FormData, string>> = {}
    if (step === 0 && !form['nome-agente'].trim()) {
      newErrors['nome-agente'] = 'Nome do agente é obrigatório'
    }
    if (step === 0 && !form['empresa-nome'].trim()) {
      newErrors['empresa-nome'] = 'Nome da empresa é obrigatório'
    }
    if (step === 0 && !form['empresa-site'].trim()) {
      newErrors['empresa-site'] = 'Site da empresa é obrigatório — necessário para a IA pesquisar'
    }
    if (step === 0 && !form['prod-nome'].trim()) {
      newErrors['prod-nome'] = 'Nome do produto é obrigatório'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function next() {
    if (!validate()) return
    setStep(s => Math.min(s + 1, STEPS.length - 1))
  }

  function prev() {
    setStep(s => Math.max(s - 1, 0))
  }

  async function handleActivate() {
    setActivating(true)
    setActivatingStep(0)
    setActivateError('')
    const payload = {
      nome: form['nome-agente'] || form['empresa-nome'] + ' — Agente IA',
      empresa: form['empresa-nome'],
      cnpj: form['empresa-cnpj'],
      segmento: form['empresa-segmento'],
      site: form['empresa-site'],
      descricao_empresa: form['empresa-descricao'],
      diferenciais_empresa: form['empresa-diferenciais'],
      objecoes_comuns: form['empresa-objecoes-comuns'],
      contexto_mercado: form['empresa-contexto-mercado'],
      produto: form['prod-nome'],
      descricao_produto: form['prod-descricao'],
      resultados_clientes: form['prod-resultados'],
      concorrentes: form['prod-concorrentes'],
      info_adicional: form['prod-info-extra'],
      icp_cargo: form['icp-cargo-tipo'],
      icp_segmento: form['icp-segmento-alvo'],
      icp_porte: form['icp-porte-alvo'],
      gatilhos_customizados: form['gatilhos-customizados'],
      perguntas_qualificacao: [form['wiz-qualif-q1'], form['wiz-qualif-q2'], form['wiz-qualif-q3']].filter(Boolean),
      script_abertura: form['script-abertura'],
      metodologia: form['metodologia'],
      objecoes: objecoes.filter(o => o.objecao.trim()),
      regioes_cobertura: regioes.length > 0 ? regioes : null,
      compliance_anatel: form['compliance-anatel'] === 'true',
      compliance_optout: form['compliance-optout'] === 'true',
      capacidade_transferencia: form['capacidade-transferencia'] === 'true',
      capacidade_agendamento: form['capacidade-agendamento'] === 'true',
      voz_id: form['voz'],
      tom: form['tom'],
      status: 'inativo',
    }
    try {
      setActivatingStep(1)
      if (editandoId) {
        await agentesApi.update(editandoId, payload)
      } else {
        await agentesApi.create(payload)
      }
      setActivatingStep(2)
      await new Promise(r => setTimeout(r, 600))
      setActivatingStep(3)
      await new Promise(r => setTimeout(r, 400))
      setActivated(true)
      refetchAgentes()
    } catch {
      setActivateError('Erro ao salvar agente. Tente novamente.')
    } finally {
      setActivating(false)
    }
  }

  function handleEditar(agente: AgenteMock) {
    const raw = agente as AgenteMock & {
      cnpj?: string; site?: string; descricao_empresa?: string; diferenciais_empresa?: string
      descricao_produto?: string; resultados_clientes?: string; concorrentes?: string
      info_adicional?: string; gatilhos_customizados?: string; perguntas_qualificacao?: string[]
      script_abertura?: string; metodologia?: string; proposito?: string
      objecoes?: Objecao[]
    }
    const pergs = raw.perguntas_qualificacao ?? []
    setForm({
      ...INITIAL_FORM,
      'nome-agente': agente.nome,
      'empresa-nome': agente.empresa || agente.nome,
      'empresa-segmento': agente.segmento || '',
      'empresa-cnpj': raw.cnpj || '',
      'empresa-site': raw.site || '',
      'empresa-porte': agente.icp_porte || '',
      'empresa-descricao': raw.descricao_empresa || '',
      'empresa-diferenciais': raw.diferenciais_empresa || '',
      'prod-nome': agente.produto || '',
      'prod-descricao': raw.descricao_produto || '',
      'prod-resultados': raw.resultados_clientes || '',
      'prod-concorrentes': raw.concorrentes || '',
      'prod-info-extra': raw.info_adicional || '',
      'icp-cargo-tipo': agente.icp_cargo || '',
      'icp-segmento-alvo': agente.icp_segmento || '',
      'icp-porte-alvo': agente.icp_porte || '',
      'gatilhos-customizados': raw.gatilhos_customizados || '',
      'wiz-qualif-q1': pergs[0] ?? INITIAL_FORM['wiz-qualif-q1'],
      'wiz-qualif-q2': pergs[1] ?? INITIAL_FORM['wiz-qualif-q2'],
      'wiz-qualif-q3': pergs[2] ?? INITIAL_FORM['wiz-qualif-q3'],
      'script-abertura': raw.script_abertura || '',
      'metodologia': raw.metodologia || '',
      'compliance-anatel': (raw as any).compliance_anatel === false ? 'false' : 'true',
      'compliance-optout': (raw as any).compliance_optout === false ? 'false' : 'true',
      'capacidade-transferencia': (raw as any).capacidade_transferencia === true ? 'true' : 'false',
      'capacidade-agendamento': (raw as any).capacidade_agendamento === false ? 'false' : 'true',
      voz: agente.voz || INITIAL_FORM.voz,
      tom: agente.tom || '',
    })
    setObjecoes(raw.objecoes && raw.objecoes.length > 0 ? raw.objecoes : INITIAL_OBJECOES)
    setRegioes((raw as any).regioes_cobertura ?? [])
    setEditandoId(agente.id)
    setStep(0)
    setActivated(false)
    setTela('wizard')
  }

  async function handleDuplicar(agente: AgenteMock) {
    setDuplicatingId(agente.id)
    try {
      // Remove campos exclusivos do frontend e campos gerados pelo backend
      const payload = {
        nome: agente.nome + ' (Cópia)',
        empresa: agente.empresa,
        segmento: agente.segmento,
        produto: agente.produto,
        icp_cargo: agente.icp_cargo,
        icp_segmento: agente.icp_segmento,
        icp_porte: agente.icp_porte,
        voz_id: agente.voz,
        tom: agente.tom,
        status: 'inativo',
        horarios: agente.horarios,
      }
      await agentesApi.create(payload)
      refetchAgentes()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } }; message?: string })
        ?.response?.data?.error || 'Erro ao duplicar agente'
      setSyncFeedback({ ok: false, msg })
      setTimeout(() => setSyncFeedback(null), 4000)
    } finally {
      setDuplicatingId(null)
    }
  }

  async function handleDeletar(agente: AgenteMock) {
    if (!window.confirm(`Deletar o agente "${agente.nome}"? Esta ação não pode ser desfeita.`)) return
    setDeletingId(agente.id)
    try {
      await agentesApi.delete(agente.id)
      refetchAgentes()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } }; message?: string })
        ?.response?.data?.error || 'Erro ao deletar agente'
      setSyncFeedback({ ok: false, msg })
      setTimeout(() => setSyncFeedback(null), 4000)
    } finally {
      setDeletingId(null)
    }
  }

  function reset() {
    setForm(INITIAL_FORM)
    setObjecoes(INITIAL_OBJECOES)
    setEditandoId(null)
    setStep(0)
    setActivated(false)
    setActivating(false)
    setActivatingStep(0)
    setActivateError('')
    setErrors({})
    setTela('grid')
  }

  const stepTitles = [
    'Empresa e produto',
    'ICP & Script do agente',
    'Revisar e ativar',
  ]

  // ── Tela: grid de agentes ──────────────────────────────────────────────────
  if (tela === 'grid') {
    const ativos = agentes.filter(a => a.status === 'ativo').length
    const emTreinamento = agentes.filter(a => a.status !== 'ativo').length

    return (
      <div className="min-h-screen bg-gray-50">

        {/* Modal de boas-vindas — exibido ao clicar em "Criar novo agente" */}
        {showBemVindo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col">

              {/* Header */}
              <div className="px-7 pt-7 pb-5 flex items-start justify-between gap-4 border-b border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                    <Zap size={18} className="text-brand" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900 leading-snug">Como seu agente aprende e performa</h2>
                    <p className="mt-1 text-sm text-gray-500 leading-relaxed max-w-lg">
                      O agente não vai para a ligação no escuro. Tudo que você preencher aqui é carregado para ele antes de cada ligação — quanto mais rico o treinamento, mais preparado ele chega.
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowBemVindo(false)} className="text-gray-300 hover:text-gray-500 transition-colors shrink-0 mt-0.5">
                  <X size={18} />
                </button>
              </div>

              {/* Fases */}
              <div className="px-7 py-5 grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-2 p-4 rounded-xl bg-blue-50 border border-blue-100">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-brand flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold">1</span>
                    </div>
                    <span className="text-xs font-semibold text-brand">Treinamento inicial</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">Você alimenta o agente com tudo sobre sua empresa, produto e clientes. Quanto mais detalhe, melhor o ponto de partida.</p>
                </div>
                <div className="flex flex-col gap-2 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold">2</span>
                    </div>
                    <span className="text-xs font-semibold text-emerald-700">Aprendizado automático</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">Depois de ativo, o agente aprende com cada ligação — detecta o que funciona e melhora continuamente sem intervenção.</p>
                </div>
                <div className="flex flex-col gap-2 p-4 rounded-xl bg-purple-50 border border-purple-100">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold">3</span>
                    </div>
                    <span className="text-xs font-semibold text-purple-700">Enriquecimento contínuo</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">Você continua alimentando o Centro de Inteligência com novos materiais. Cada adição torna o agente mais afiado.</p>
                </div>
              </div>

              {/* Tipos de material */}
              <div className="px-7 pb-5 flex flex-wrap gap-1.5">
                {[
                  { icon: '📄', label: 'Apresentações e ebooks' },
                  { icon: '🎙️', label: 'Ligações de vendedores humanos' },
                  { icon: '💬', label: 'Objeções já mapeadas' },
                  { icon: '🏆', label: 'Cases e diferenciais' },
                ].map(({ icon, label }) => (
                  <span key={label} className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-full">
                    <span>{icon}</span> {label}
                  </span>
                ))}
              </div>

              {/* Aviso CI */}
              <div className="mx-7 mb-5 flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-xl p-4">
                <Brain size={15} className="text-brand shrink-0 mt-0.5" />
                <p className="text-xs text-gray-600 leading-relaxed">
                  <span className="font-semibold text-gray-800">Após ativar:</span> acesse o <span className="text-brand font-medium">Centro de Inteligência</span> para adicionar PDFs, vídeos, áudios e inteligência de mercado — cada material adicionado torna o agente mais persuasivo.
                </p>
              </div>

              {/* Rodapé */}
              <div className="px-7 py-5 border-t border-gray-100 flex items-center justify-between gap-4">
                <p className="text-xs text-gray-400 leading-relaxed max-w-xs">
                  Ao clicar em <span className="font-medium text-gray-500">Entendi</span>, você confirma que compreendeu como funciona o treinamento do agente. Esse aceite é registrado com data e hora.
                </p>
                <button
                  onClick={() => {
                    localStorage.setItem('etz_aceite_treinamento', JSON.stringify({
                      aceito_em: new Date().toISOString(),
                      user: localStorage.getItem('youagent_jwt') ? 'autenticado' : 'anonimo',
                    }))
                    setShowBemVindo(false)
                    setForm(INITIAL_FORM)
                    setStep(0)
                    setEditandoId(null)
                    setActivated(false)
                    setTela('wizard')
                  }}
                  className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-brand text-white text-sm font-semibold rounded-xl hover:bg-brand-600 transition-colors shadow-sm"
                >
                  Entendi, vamos começar
                  <ChevronRight size={15} />
                </button>
              </div>

            </div>
          </div>
        )}

        <div className="w-full max-w-4xl mx-auto px-6 py-8 flex flex-col gap-6">

          {/* ── Header ──────────────────────────────────────────────────── */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Setup do Agente</h1>
              <p className="text-sm text-gray-500 mt-1">Configure, treine e gerencie seus agentes de IA de vendas.</p>
              {agentes.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {ativos} ativo{ativos !== 1 ? 's' : ''}
                  </span>
                  {emTreinamento > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      {emTreinamento} configurando
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={sincronizarComCI}
                disabled={sincronizando}
                className={`btn disabled:opacity-60 ${
                  ciStatus?.pendente
                    ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm px-4 py-2.5 text-sm'
                    : 'btn-secondary'
                }`}
              >
                {sincronizando ? <Loader2 size={14} className="animate-spin" /> : <Brain size={14} />}
                {sincronizando ? 'Sincronizando...' : 'Sincronizar com CI'}
                {ciStatus?.pendente && !sincronizando && (
                  <span className="bg-white text-amber-600 text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
                    {ciStatus.total}
                  </span>
                )}
              </button>
              <button onClick={() => setShowBemVindo(true)} className="btn-primary gap-2">
                <Bot size={15} />
                Criar novo agente
              </button>
            </div>
          </div>

          {/* ── Banner explicativo ─────────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                <Zap size={17} className="text-brand" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Como o agente aprende e performa</h2>
                <p className="text-xs text-gray-500 leading-relaxed mt-0.5">
                  Cada agente é treinado com o DNA da sua empresa. Quanto mais completas as informações — produto, ICP, objeções, script — mais preciso ele será na qualificação e no agendamento.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: <Target size={14} className="text-blue-600" />, bg: 'bg-blue-50', titulo: 'ICP bem definido', desc: 'Garante que só leads quentes avancem' },
                { icon: <Brain size={14} className="text-purple-600" />, bg: 'bg-purple-50', titulo: 'Script e objeções', desc: 'Definem como o agente fala e argumenta' },
                { icon: <Zap size={14} className="text-amber-600" />, bg: 'bg-amber-50', titulo: 'Herança do CI', desc: 'Nasce com os aprendizados de todas as ligações' },
              ].map(item => (
                <div key={item.titulo} className="flex items-start gap-2.5 bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className={`w-7 h-7 rounded-md ${item.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-800 leading-tight">{item.titulo}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Alerta CI pendente ─────────────────────────────────────── */}
          {ciStatus?.pendente && !syncFeedback && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
              <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-800">Centro de Inteligência tem novos aprendizados</p>
                <ul className="mt-1 space-y-0.5">
                  {ciStatus.motivos.map((m, i) => (
                    <li key={i} className="text-xs text-amber-700 flex items-center gap-1.5">
                      <span className="w-1 h-1 bg-amber-400 rounded-full shrink-0" />
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={sincronizarComCI}
                disabled={sincronizando}
                className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors shrink-0 disabled:opacity-50"
              >
                <RefreshCw size={12} className={sincronizando ? 'animate-spin' : ''} />
                Sincronizar agora
              </button>
            </div>
          )}

          {/* ── Feedback de sincronização ──────────────────────────────── */}
          {syncFeedback && (
            <div className={`px-4 py-3 rounded-xl border flex items-center gap-2 text-sm font-medium
              ${syncFeedback.ok
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
              }`}>
              {syncFeedback.ok ? <Brain size={15} className="text-emerald-600 shrink-0" /> : <AlertTriangle size={15} className="text-red-500 shrink-0" />}
              {syncFeedback.msg}
            </div>
          )}

          {/* ── Grid de agentes ───────────────────────────────────────── */}
          {agentes.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Seus agentes</h2>
                <span className="text-xs text-gray-400">{agentes.length} agente{agentes.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {agentes.map(agente => (
                  <AgenteCard
                    key={agente.id}
                    agente={agente}
                    onHorarios={() => setAgenteHorarios(agente)}
                    onEditar={() => handleEditar(agente)}
                    onDuplicar={() => handleDuplicar(agente)}
                    onAtivar={() => setAgenteAtivacao(agente)}
                    onDeletar={() => handleDeletar(agente)}
                    duplicating={duplicatingId === agente.id}
                    deleting={deletingId === agente.id}
                  />
                ))}
              </div>
            </>
          )}

          {/* ── Empty state ───────────────────────────────────────────── */}
          {agentes.length === 0 && (
            <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                <Bot size={32} className="text-blue-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-800 mb-1">Nenhum agente criado ainda</h3>
              <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                Configure seu primeiro agente em menos de 5 minutos. Quanto mais detalhes você fornecer, melhor será a performance.
              </p>
              <button
                onClick={() => setShowBemVindo(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand text-white text-sm font-semibold rounded-xl hover:bg-brand-600 transition-colors shadow-sm"
              >
                <Bot size={16} />
                Criar primeiro agente
              </button>
            </div>
          )}

          {/* ── Dica sobre qualidade das informações ──────────────────── */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                <Brain size={16} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-1">A qualidade das informações define a performance</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Agentes com produto, ICP, script e objeções bem preenchidos convertem até <strong className="text-gray-700">3× mais</strong> do que agentes configurados com dados genéricos.
                  Use a aba <strong className="text-gray-700">Centro de Inteligência</strong> para carregar documentos, cases de sucesso e banco de argumentos — o agente aprende continuamente com cada ligação.
                </p>
              </div>
            </div>
          </div>

        </div>

        {agenteHorarios && (
          <ModalHorarios agente={agenteHorarios} onClose={() => { setAgenteHorarios(null); refetchAgentes() }} />
        )}
        {agenteAtivacao && (
          <ModalAtivacao
            agente={agenteAtivacao}
            onClose={() => setAgenteAtivacao(null)}
            onAtivado={() => { refetchAgentes(); setAgenteAtivacao(null) }}
          />
        )}
      </div>
    )
  }

  // ── Tela: wizard ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-3">
            <Bot size={24} className="text-blue-600" />
            <span className="text-lg font-bold text-gray-900">{editandoId ? 'Editar Agente' : 'Novo Agente de IA'}</span>
          </div>
          <p className="text-sm text-gray-500">{editandoId ? `Editando: ${form['nome-agente'] || form['empresa-nome']}` : 'Configure seu agente de vendas autônomo em 3 passos'}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <StepIndicator current={step} />
          <ProgressBar step={step} />

          <h2 className="text-lg font-semibold text-gray-900 mb-6">{stepTitles[step]}</h2>

          {step === 0 && <Step1 form={form} onChange={onChange} errors={errors} />}
          {step === 1 && (
            <Step3
              form={form}
              onChange={onChange}
              objecoes={objecoes}
              onObjecoesChange={setObjecoes}
              regioes={regioes}
              onRegioesChange={setRegioes}
            />
          )}
          {step === 2 && (
            <Step4
              form={form}
              activated={activated}
              activating={activating}
              activatingStep={activatingStep}
              objecoes={objecoes}
              regioes={regioes}
              onActivate={handleActivate}
              onReset={reset}
              modoEdicao={!!editandoId}
            />
          )}
          {activateError && (
            <div className="mt-3 flex items-center gap-2 p-3 rounded-xl text-sm"
                 style={{ background: 'rgba(254,242,242,0.9)', border: '1px solid rgba(252,165,165,0.5)', color: '#dc2626' }}>
              {activateError}
            </div>
          )}

          {!(step === 2 && activated) && (
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
              <button
                onClick={step === 0 ? () => setTela('grid') : prev}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft size={16} /> Anterior
              </button>
              {step < STEPS.length - 1 ? (
                <button
                  onClick={next}
                  className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Próximo <ChevronRight size={16} />
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
