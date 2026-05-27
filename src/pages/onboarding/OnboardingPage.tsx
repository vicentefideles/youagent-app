import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { claudeApi, agentesApi } from '@/services/api'
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Bot,
  Play,
  Building2,
  Package,
  Target,
  Zap,
  Clock,
  X,
  UserCheck,
  Users,
  PhoneOutgoing,
  Settings,
  Loader2,
  Copy,
  Pencil,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface FormData {
  // Step 1
  'empresa-nome': string
  'empresa-segmento': string
  'empresa-site': string
  'empresa-porte': string
  'empresa-descricao': string
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
  voz: string
  tom: string
}

const INITIAL_FORM: FormData = {
  'empresa-nome': '',
  'empresa-segmento': '',
  'empresa-site': '',
  'empresa-porte': '',
  'empresa-descricao': '',
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
  voz: '',
  tom: '',
}

const SEGMENTOS = ['Tech/SaaS', 'Indústria', 'Serviços B2B', 'Saúde', 'Educação', 'Financeiro', 'Outro']
const PORTES = ['1–10', '11–50', '51–200', '201–1000', '1000+']
const CARGOS = ['Diretor', 'VP', 'CEO', 'Gerente', 'Coordenador', 'Outro']

const VOZES_CARDS = [
  { id: 'feminina_clara', label: 'Ana', descricao: 'Voz feminina clara e profissional', emoji: '👩‍💼', tags: ['Corporativo', 'B2B'] },
  { id: 'masculina_confiante', label: 'Carlos', descricao: 'Voz masculina confiante e direta', emoji: '👨‍💼', tags: ['Vendas', 'Outbound'] },
  { id: 'feminina_dinamica', label: 'Julia', descricao: 'Voz feminina dinâmica e empática', emoji: '👩‍💻', tags: ['SaaS', 'Tech'] },
  { id: 'masculina_consultivo', label: 'Rafael', descricao: 'Voz masculina consultiva e pausada', emoji: '🧑‍🏫', tags: ['Consultoria', 'Enterprise'] },
]

const TONS_CARDS = [
  { id: 'profissional', label: 'Profissional', descricao: 'Formal, direto ao ponto' },
  { id: 'consultivo', label: 'Consultivo', descricao: 'Pergunta mais, propõe soluções' },
  { id: 'direto', label: 'Direto', descricao: 'Objetivo, sem rodeios' },
  { id: 'amigavel', label: 'Amigável', descricao: 'Próximo, cria rapport rapidamente' },
]

interface Proposito {
  id: string
  titulo: string
  descricao: string
  icon: React.ReactNode
  preConfig: { tom: string; voz: string }
}

const PROPOSITOS: Proposito[] = [
  {
    id: 'agendar_vendedor',
    titulo: 'Agendar para meu vendedor',
    descricao: 'O agente qualifica leads e transfere ao vivo para o vendedor fechar',
    icon: <UserCheck size={28} className="text-blue-500" />,
    preConfig: { tom: 'profissional', voz: 'feminina_clara' },
  },
  {
    id: 'substituir_sdr',
    titulo: 'Substituir equipe de SDRs',
    descricao: 'O agente faz toda a prospecção e agenda reuniões automaticamente',
    icon: <Users size={28} className="text-purple-500" />,
    preConfig: { tom: 'consultivo', voz: 'masculina_confiante' },
  },
  {
    id: 'prospeccao_outbound',
    titulo: 'Prospecção outbound do zero',
    descricao: 'O agente busca e qualifica leads novos de forma autônoma',
    icon: <PhoneOutgoing size={28} className="text-green-500" />,
    preConfig: { tom: 'direto', voz: 'feminina_dinamica' },
  },
]

const STEPS = [
  { label: 'Empresa', icon: Building2 },
  { label: 'Produto', icon: Package },
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

  async function pesquisarComIA() {
    if (pesquisando) return
    setPesquisando(true)
    setPesquisaErro(null)
    try {
      const res = await claudeApi.pesquisarMercado({
        empresa: form['empresa-nome'],
        segmento: form['empresa-segmento'],
        produto: form['prod-nome'],
      })
      const data = res.data as {
        diferenciais?: string
        concorrentes?: string
        icp_cargo?: string
        icp_porte?: string
        icp_segmento?: string
        gatilhos?: string
        script_abertura?: string
      }
      if (data.diferenciais) onChange('empresa-descricao', data.diferenciais)
      if (data.concorrentes) onChange('prod-concorrentes', data.concorrentes)
      if (data.icp_cargo) onChange('icp-cargo-tipo', data.icp_cargo)
      if (data.icp_porte) onChange('icp-porte-alvo', data.icp_porte)
      if (data.icp_segmento) onChange('icp-segmento-alvo', data.icp_segmento)
      if (data.gatilhos) onChange('gatilhos-customizados', data.gatilhos)
    } catch {
      setPesquisaErro('Erro ao pesquisar. Verifique a conexão Claude API.')
    } finally {
      setPesquisando(false)
    }
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2">
        <Field label="Nome da empresa" required error={errors['empresa-nome']}>
          <input
            id="empresa-nome"
            className={inputCls}
            value={form['empresa-nome']}
            onChange={e => onChange('empresa-nome', e.target.value)}
            placeholder="Ex: Acme Tecnologia"
          />
        </Field>
      </div>
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
      <div className="col-span-2">
        <Field label="Site da empresa">
          <input
            id="empresa-site"
            className={inputCls}
            value={form['empresa-site']}
            onChange={e => onChange('empresa-site', e.target.value)}
            placeholder="https://suaempresa.com.br"
          />
        </Field>
      </div>
      <div className="col-span-2">
        <Field label="Descrição da empresa">
          <textarea
            id="empresa-descricao"
            className={textareaCls}
            rows={3}
            value={form['empresa-descricao']}
            onChange={e => onChange('empresa-descricao', e.target.value)}
            placeholder="O que sua empresa faz, há quanto tempo, diferenciais..."
          />
        </Field>
      </div>
      <div className="col-span-2 flex items-center gap-3">
        <button
          type="button"
          onClick={pesquisarComIA}
          disabled={pesquisando}
          className="flex items-center gap-1.5 text-sm px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white rounded-lg transition-colors"
        >
          {pesquisando ? '🔍 Pesquisando...' : '🔍 Pesquisar com IA'}
        </button>
        <span className="text-xs text-gray-400">Preenche automaticamente ICP, concorrentes e gatilhos</span>
        {pesquisaErro && <span className="text-xs text-red-500">{pesquisaErro}</span>}
      </div>
    </div>
  )
}

function Step2({
  form,
  onChange,
  errors,
}: {
  form: FormData
  onChange: (k: keyof FormData, v: string) => void
  errors: Partial<Record<keyof FormData, string>>
}) {
  return (
    <div className="flex flex-col gap-4">
      <Field label="Nome do produto/serviço" required error={errors['prod-nome']}>
        <input
          id="prod-nome"
          className={inputCls}
          value={form['prod-nome']}
          onChange={e => onChange('prod-nome', e.target.value)}
          placeholder="Ex: Plataforma de Gestão Comercial"
        />
      </Field>
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
      <Field label="Resultados para clientes">
        <textarea
          id="prod-resultados"
          className={textareaCls}
          rows={2}
          value={form['prod-resultados']}
          onChange={e => onChange('prod-resultados', e.target.value)}
          placeholder="Qual resultado o cliente obtém? Ex: reduz ciclo de vendas em 40%"
        />
      </Field>
      <Field label="Concorrentes">
        <textarea
          id="prod-concorrentes"
          className={textareaCls}
          rows={2}
          value={form['prod-concorrentes']}
          onChange={e => onChange('prod-concorrentes', e.target.value)}
          placeholder="Quem são seus principais concorrentes?"
        />
      </Field>
      <Field label="Informações adicionais">
        <textarea
          id="prod-info-extra"
          className={textareaCls}
          rows={2}
          value={form['prod-info-extra']}
          onChange={e => onChange('prod-info-extra', e.target.value)}
          placeholder="Diferenciais, preços, garantias, casos de sucesso..."
        />
      </Field>
    </div>
  )
}

function Step3({
  form,
  onChange,
}: {
  form: FormData
  onChange: (k: keyof FormData, v: string) => void
}) {
  return (
    <div className="flex flex-col gap-6">
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

      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">Voz do agente</p>
        <div className="grid grid-cols-2 gap-3">
          {VOZES_CARDS.map(v => (
            <button
              key={v.id}
              type="button"
              onClick={() => onChange('voz', v.id)}
              className={`text-left p-4 rounded-xl border-2 transition-all flex flex-col gap-2 ${
                form.voz === v.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{v.emoji}</span>
                <Play size={13} className="opacity-40" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{v.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{v.descricao}</p>
              </div>
              <div className="flex flex-wrap gap-1">
                {v.tags.map(tag => (
                  <span key={tag} className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">{tag}</span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

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
  onActivate,
  onReset,
}: {
  form: FormData
  activated: boolean
  activating?: boolean
  onActivate: () => void
  onReset: () => void
}) {
  const navigate = useNavigate()
  const icpScore = calcularIcpScore(form)

  if (activated) {
    return (
      <div className="flex flex-col items-center py-10 gap-6 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center animate-[scale-in_0.3s_ease-out]">
          <Check size={40} className="text-green-600" strokeWidth={3} />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Agente {form['empresa-nome'] || 'ETZ'} ativado com sucesso!
          </h2>
          <p className="text-sm text-gray-500 mt-2 max-w-md">
            O agente está aprendendo com os dados da sua empresa e estará pronto para ligar em instantes.
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
            Criar outro agente
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
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Empresa</p>
            <p className="font-medium text-gray-900">{form['empresa-nome'] || '—'}</p>
            {form['empresa-segmento'] && (
              <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                {form['empresa-segmento']}
              </span>
            )}
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Produto</p>
            <p className="font-medium text-gray-900">{form['prod-nome'] || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">ICP</p>
            <p className="font-medium text-gray-900">
              {[form['icp-cargo-tipo'], form['icp-porte-alvo'], form['icp-segmento-alvo']]
                .filter(Boolean)
                .join(' · ') || '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Voz · Tom</p>
            <p className="font-medium text-gray-900">
              {[form.voz, form.tom].filter(Boolean).join(' · ') || '—'}
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
          <span className="text-xs text-gray-500">Score ICP estimado</span>
          <div className="flex items-center gap-2">
            <div className="w-24 bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${icpScore}%` }} />
            </div>
            <span className="text-sm font-semibold text-blue-600">{icpScore}/100</span>
          </div>
        </div>
      </div>

      <button
        onClick={onActivate}
        disabled={activating}
        className="flex items-center justify-center gap-2 w-full py-3.5 bg-green-600 text-white font-semibold text-base rounded-xl hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {activating ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Ativando...
          </>
        ) : (
          <>
            <Bot size={20} />
            Ativar Agente
          </>
        )}
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
}

const COR_LIST = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-amber-500', 'bg-rose-500', 'bg-indigo-500']

function normalizeAgente(raw: Record<string, unknown>, idx: number): AgenteMock {
  const nome = (raw.nome as string) || 'Agente'
  return {
    id: (raw.id as string) || String(idx),
    nome,
    voz: (raw.voz as string) || '',
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
  }
}

const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex']
const HORAS = ['8h', '9h', '10h', '11h', '12h', '13h', '14h', '15h', '16h', '17h', '18h']

interface HorariosState {
  [key: string]: boolean
}

function ModalHorarios({ agente, onClose }: { agente: AgenteMock; onClose: () => void }) {
  const initial: HorariosState = {}
  DIAS.forEach(d => HORAS.forEach(h => { initial[`${d}-${h}`] = true }))
  const [horarios, setHorarios] = useState<HorariosState>(initial)

  function toggle(key: string) {
    setHorarios(prev => ({ ...prev, [key]: !prev[key] }))
  }

  async function handleSalvarHorarios() {
    try {
      if (agente?.id) {
        await agentesApi.update(agente.id, { horarios })
      }
    } catch(e) { /* silencioso */ }
    onClose()
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

        <div className="overflow-x-auto">
          <table className="text-xs w-full">
            <thead>
              <tr>
                <th className="text-gray-400 font-medium pb-2 pr-3 text-left">Horário</th>
                {DIAS.map(d => (
                  <th key={d} className="text-gray-700 font-semibold pb-2 px-2 text-center">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {HORAS.map(h => (
                <tr key={h}>
                  <td className="py-1.5 pr-3 text-gray-500 font-mono">{h}</td>
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

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button onClick={handleSalvarHorarios} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
            Salvar horários
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
  duplicating,
}: {
  agente: AgenteMock
  onHorarios: () => void
  onEditar: () => void
  onDuplicar: () => void
  duplicating?: boolean
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full ${agente.cor} flex items-center justify-center text-white font-bold text-base`}>
          {agente.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{agente.nome}</p>
          <p className="text-xs text-gray-400">
            {agente.voz ? `Voz: ${agente.voz}` : agente.empresa || ''}
          </p>
        </div>
        {agente.status === 'ativo' && (
          <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Ativo</span>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-green-500" />
        <span className="text-xs text-gray-500">{agente.campanhasAtivas} campanha{agente.campanhasAtivas !== 1 ? 's' : ''} ativa{agente.campanhasAtivas !== 1 ? 's' : ''}</span>
      </div>
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={onEditar}
          className="flex items-center gap-1 text-xs font-medium py-2 px-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
        >
          <Pencil size={12} />
          Editar
        </button>
        <button
          onClick={onDuplicar}
          disabled={duplicating}
          className="flex items-center gap-1 text-xs font-medium py-2 px-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 disabled:opacity-50"
        >
          {duplicating ? <Loader2 size={12} className="animate-spin" /> : <Copy size={12} />}
          Duplicar
        </button>
        <button
          onClick={onHorarios}
          className="flex items-center gap-1 text-xs font-medium py-2 px-3 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
        >
          <Clock size={12} />
          Horários
        </button>
      </div>
    </div>
  )
}

// PERFIS removed — replaced by PROPOSITOS above

// ─── Page ────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const [tela, setTela] = useState<'grid' | 'wiz0' | 'wizard'>('grid')
  const [propositoSelecionado, setPropositoSelecionado] = useState<string | null>(null)
  const [agenteHorarios, setAgenteHorarios] = useState<AgenteMock | null>(null)
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [activated, setActivated] = useState(false)
  const [activating, setActivating] = useState(false)
  const [activateError, setActivateError] = useState('')
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)

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
    if (step === 0 && !form['empresa-nome'].trim()) {
      newErrors['empresa-nome'] = 'Nome da empresa é obrigatório'
    }
    if (step === 1 && !form['prod-nome'].trim()) {
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
    setActivateError('')
    try {
      await agentesApi.create({
        nome: form['empresa-nome'] + ' — Agente IA',
        empresa: form['empresa-nome'],
        segmento: form['empresa-segmento'],
        produto: form['prod-nome'],
        descricao_produto: form['prod-descricao'],
        icp_cargo: form['icp-cargo-tipo'],
        icp_segmento: form['icp-segmento-alvo'],
        icp_porte: form['icp-porte-alvo'],
        voz: form['voz'],
        tom: form['tom'],
        status: 'ativo',
      })
      setActivated(true)
      refetchAgentes()
    } catch {
      setActivateError('Erro ao ativar agente. Tente novamente.')
    } finally {
      setActivating(false)
    }
  }

  function handleEditar(agente: AgenteMock) {
    setForm({
      ...INITIAL_FORM,
      'empresa-nome': agente.empresa || agente.nome,
      'empresa-segmento': agente.segmento || '',
      'prod-nome': agente.produto || '',
      'icp-cargo-tipo': agente.icp_cargo || '',
      'icp-segmento-alvo': agente.icp_segmento || '',
      'icp-porte-alvo': agente.icp_porte || '',
      voz: agente.voz || '',
      tom: agente.tom || '',
    })
    setStep(0)
    setActivated(false)
    setTela('wizard')
  }

  async function handleDuplicar(agente: AgenteMock) {
    setDuplicatingId(agente.id)
    try {
      const { id: _id, avatar: _avatar, cor: _cor, campanhasAtivas: _camp, ...rest } = agente
      await agentesApi.create({ ...rest, nome: agente.nome + ' (Cópia)' })
      refetchAgentes()
    } finally {
      setDuplicatingId(null)
    }
  }

  function reset() {
    setForm(INITIAL_FORM)
    setStep(0)
    setActivated(false)
    setActivating(false)
    setActivateError('')
    setErrors({})
    setTela('grid')
    setPropositoSelecionado(null)
  }

  const stepTitles = [
    'Dados da empresa',
    'Produto ou serviço',
    'ICP & Script do agente',
    'Revisar e ativar',
  ]

  // ── Tela: grid de agentes ──────────────────────────────────────────────────
  if (tela === 'grid') {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="w-full max-w-3xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-2 mb-1">
                <Bot size={22} className="text-blue-600" />
                <span className="text-lg font-bold text-gray-900">Meus Agentes</span>
              </div>
              <p className="text-sm text-gray-500">Gerencie seus agentes de IA</p>
            </div>
            <button
              onClick={() => setTela('wiz0')}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
            >
              <Bot size={16} />
              Criar novo agente
            </button>
          </div>

          {agentes.length > 0 && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              {agentes.map(agente => (
                <AgenteCard
                  key={agente.id}
                  agente={agente}
                  onHorarios={() => setAgenteHorarios(agente)}
                  onEditar={() => handleEditar(agente)}
                  onDuplicar={() => handleDuplicar(agente)}
                  duplicating={duplicatingId === agente.id}
                />
              ))}
            </div>
          )}

          {agentes.length === 0 && (
            <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-12 text-center">
              <Bot size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm mb-4">Nenhum agente criado ainda.</p>
              <button
                onClick={() => setTela('wiz0')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Bot size={16} />
                Criar primeiro agente
              </button>
            </div>
          )}
        </div>

        {agenteHorarios && (
          <ModalHorarios agente={agenteHorarios} onClose={() => setAgenteHorarios(null)} />
        )}
      </div>
    )
  }

  // ── Tela: seleção de propósito ────────────────────────────────────────────
  if (tela === 'wiz0') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-start justify-center py-12 px-4">
        <div className="w-full max-w-2xl">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 mb-3">
              <Settings size={22} className="text-blue-600" />
              <span className="text-lg font-bold text-gray-900">Qual é o objetivo do agente?</span>
            </div>
            <p className="text-sm text-gray-500">Escolha o propósito principal — configuramos voz e tom automaticamente</p>
          </div>

          <div className="flex flex-col gap-4 mb-6">
            {PROPOSITOS.map(p => (
              <button
                key={p.id}
                onClick={() => setPropositoSelecionado(p.id)}
                className={`text-left p-5 rounded-2xl border-2 transition-all flex items-center gap-5 ${
                  propositoSelecionado === p.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="shrink-0">{p.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{p.titulo}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{p.descricao}</p>
                </div>
                <div className={`shrink-0 w-5 h-5 rounded-full border-2 transition-colors flex items-center justify-center ${
                  propositoSelecionado === p.id ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                }`}>
                  {propositoSelecionado === p.id && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </button>
            ))}
          </div>

          <div className="flex gap-3 justify-between">
            <button
              onClick={() => setTela('grid')}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft size={16} /> Voltar
            </button>
            <button
              disabled={!propositoSelecionado}
              onClick={() => {
                const p = PROPOSITOS.find(x => x.id === propositoSelecionado)
                if (p) {
                  setForm(prev => ({ ...prev, voz: p.preConfig.voz, tom: p.preConfig.tom }))
                }
                setTela('wizard')
              }}
              className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Continuar <ChevronRight size={16} />
            </button>
          </div>
        </div>
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
            <span className="text-lg font-bold text-gray-900">Novo Agente de IA</span>
          </div>
          <p className="text-sm text-gray-500">Configure seu agente de vendas autônomo em 4 passos</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <StepIndicator current={step} />
          <ProgressBar step={step} />

          <h2 className="text-lg font-semibold text-gray-900 mb-6">{stepTitles[step]}</h2>

          {step === 0 && <Step1 form={form} onChange={onChange} errors={errors} />}
          {step === 1 && <Step2 form={form} onChange={onChange} errors={errors} />}
          {step === 2 && <Step3 form={form} onChange={onChange} />}
          {step === 3 && (
            <Step4
              form={form}
              activated={activated}
              activating={activating}
              onActivate={handleActivate}
              onReset={reset}
            />
          )}
          {activateError && (
            <div className="mt-3 flex items-center gap-2 p-3 rounded-xl text-sm"
                 style={{ background: 'rgba(254,242,242,0.9)', border: '1px solid rgba(252,165,165,0.5)', color: '#dc2626' }}>
              {activateError}
            </div>
          )}

          {!(step === 3 && activated) && (
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
              <button
                onClick={step === 0 ? () => setTela('wiz0') : prev}
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
