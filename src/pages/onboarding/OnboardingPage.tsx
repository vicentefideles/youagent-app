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
  BarChart2,
  Mic,
  Clock,
  X,
  Loader2,
  Copy,
  Pencil,
  RefreshCw,
  Brain,
  Search,
  AlertTriangle,
  AlertCircle,
  Play,
  CalendarCheck,

  Plus,
  FileText,
  Upload,
  MessageCircle,
  MessageSquare,
  TrendingUp,
  DollarSign,
  ClipboardList,
  Briefcase,
  Heart,
  Square,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface FormData {
  // Step 0 — Objetivo
  'objetivo': string
  'whatsapp-numero': string
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
  'script-ligacao': string
  'metodologia': string
  'compliance-anatel': string
  'compliance-optout': string
  'materiais-conteudo': string

  voz: string
  tom: string
  'agendamento-estrategia': string
  'agendamento-antecedencia': string
  'agendamento-opcoes': string
  'agendamento-tom': string
  'agendamento-duracao': string
  'agendamento-apresentar-vendedor': string
  'agendamento-recusa': string
  'agendamento-urgencia': string
  'prompt_gerado': string
  'cenario-dores': string
  'gatilhos-fechamento': string
  'voz-pronuncia': string
  'voz-termos-tecnicos': string
  'voz-ritmo-tom': string
  'voz-palavras-proibidas': string
}

interface Objecao {
  objecao: string
  rebuttal: string
  sequencia?: string  // se após responder, prospect der outra objeção
  rebuttal_sequencia?: string  // como responder à segunda objeção
}

interface Abordagem {
  id: string
  tipo: string
  texto: string
  selecionada: boolean
}

interface ObjecaoCanal {
  id: string
  objecao: string
  rebuttal: string
  fixo?: boolean
}

const INITIAL_FORM: FormData = {
  'objetivo': 'agendar-reunioes',
  'whatsapp-numero': '',
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
  'wiz-qualif-q1': '',
  'wiz-qualif-q2': '',
  'wiz-qualif-q3': '',
  'script-abertura': '',
  'script-ligacao': '',
  'metodologia': '',
  'compliance-anatel': 'true',
  'compliance-optout': 'true',
  'materiais-conteudo': '',

  voz: 'Telnyx.NaturalHD.isadora',
  tom: '',
  'agendamento-estrategia': 'proximas',
  'agendamento-antecedencia': '24h',
  'agendamento-opcoes': '2',
  'agendamento-tom': 'direto',
  'agendamento-duracao': '30',
  'agendamento-apresentar-vendedor': 'sim',
  'agendamento-recusa': 'reoferta',
  'agendamento-urgencia': 'nao',
  'prompt_gerado': '',
  'cenario-dores': '',
  'gatilhos-fechamento': '',
  'voz-pronuncia': '',
  'voz-termos-tecnicos': '',
  'voz-ritmo-tom': '',
  'voz-palavras-proibidas': '',
}

const INITIAL_OBJECOES: Objecao[] = [
  { objecao: '', rebuttal: '', sequencia: '', rebuttal_sequencia: '' },
  { objecao: '', rebuttal: '', sequencia: '', rebuttal_sequencia: '' },
  { objecao: '', rebuttal: '', sequencia: '', rebuttal_sequencia: '' },
]

const DRAFT_KEY = 'etz_onboarding_draft'
function loadDraft(): Record<string, any> | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

const SEGMENTOS = [
  'Agronegócio / Pecuária',
  'Automotivo / Concessionárias',
  'Clínicas / Saúde',
  'Construção Civil / Imóveis',
  'Consultoria / Serviços B2B',
  'Cosméticos / Estética / Beleza',
  'Educação / Cursos',
  'Energia Solar',
  'Financeiro / Crédito / Consórcio',
  'Indústria / Manufatura',
  'Internet / Telecom',
  'Jurídico / Advocacia',
  'Logística / Transporte',
  'Marketing / Publicidade',
  'Odontologia',
  'Planos de Saúde / Seguros',
  'RH / Recrutamento',
  'Segurança / Tecnologia de Acesso',
  'Serviços Funerários',
  'Tech / SaaS',
  'Terceiro Setor / ONGs',
  'Varejo / E-commerce',
  'Outros',
]
const PORTES = ['1–10', '11–50', '51–200', '201–1000', '1000+']

const CARGOS_ICP = [
  'Donos de empresa', 'CEOs', 'COOs',
  'CFOs', 'Gerentes de vendas', 'Gerentes de marketing',
  'Gerentes de RH', 'Diretores de operações', 'Diretores financeiros',
  'Diretores de TI', 'Diretores de inovação', 'Empreendedores',
  'Startups founders', 'Consultores de negócios', 'Consultores de marketing',
  'Outro',
]

const VOZES_TELNYX = [
  // ── pt-BR · Ultra (maior qualidade, sub-100ms, funciona em ligações)
  { id: 'Telnyx.Ultra.c9611be8-aae9-4a93-bb1c-98dd6b7d52a4', nome: 'Isabella', genero: 'Feminino',  modelo: 'Ultra', idioma: 'pt-BR' },
  { id: 'Telnyx.Ultra.8d826d43-20ad-4c56-8d37-1048eccca1bf', nome: 'Larissa',  genero: 'Feminino',  modelo: 'Ultra', idioma: 'pt-BR' },
  { id: 'Telnyx.Ultra.07b6f895-78b9-4921-8e10-8a21c99c2e8a', nome: 'Rafael',   genero: 'Masculino', modelo: 'Ultra', idioma: 'pt-BR' },
  { id: 'Telnyx.Ultra.28a942b5-74f3-47bb-9b56-4c3f2562d3ba', nome: 'Gustavo',  genero: 'Masculino', modelo: 'Ultra', idioma: 'pt-BR' },
  { id: 'Telnyx.Ultra.b603811e-54c2-4a0a-8854-09eab9ffa63f', nome: 'Bruno',    genero: 'Masculino', modelo: 'Ultra', idioma: 'pt-BR' },
]

const TONS_CARDS = [
  { id: 'profissional', label: 'Profissional', descricao: 'Formal, direto ao ponto' },
  { id: 'consultivo', label: 'Consultivo', descricao: 'Pergunta mais, propõe soluções' },
  { id: 'direto', label: 'Direto', descricao: 'Objetivo, sem rodeios' },
  { id: 'amigavel', label: 'Amigável', descricao: 'Próximo, cria rapport rapidamente' },
]

const METODOLOGIAS = [
  {
    id: 'consultivo',
    label: 'Consultivo',
    tagline: 'Descobre antes de propor',
    descricao: 'O agente faz perguntas estratégicas para entender o contexto e as dores do prospect antes de apresentar qualquer solução. Cria rapport genuíno e aumenta a taxa de aceitação da reunião.',
    melhorPara: 'Produtos de alto valor, ciclo longo, múltiplos decisores',
    exemplo: '"Quero entender melhor como vocês fazem hoje antes de sugerir qualquer coisa."',
    recomendado: true,
  },
  {
    id: 'spin',
    label: 'SPIN Selling',
    tagline: 'Cria urgência sem pressão',
    descricao: 'O agente conduz uma sequência lógica: Situação → Problema → Implicação → Necessidade. Faz o prospect perceber a dor por conta própria e enxergar a reunião como solução natural.',
    melhorPara: 'Prospects que ainda não percebem o problema claramente',
    exemplo: '"E quando isso acontece, qual o impacto no resultado do time?"',
    recomendado: true,
  },
  {
    id: 'bant',
    label: 'BANT',
    tagline: 'Qualifica rápido, não perde tempo',
    descricao: 'O agente verifica Budget, Authority, Need e Timeline logo no início. Descarta rapidamente quem não tem perfil e foca o tempo nos prospects com potencial real de fechar.',
    melhorPara: 'Alto volume de ligações, ticket médio definido, mercado amplo',
    exemplo: '"Você é o responsável por essa decisão ou tem mais alguém envolvido?"',
    recomendado: false,
  },
  {
    id: 'direto',
    label: 'Direto',
    tagline: 'Proposta rápida, decisão rápida',
    descricao: 'O agente vai direto ao ponto: apresenta o valor em 1-2 frases e pede a reunião. Sem longas qualificações. Funciona quando o prospect já conhece a categoria do produto.',
    melhorPara: 'Produtos simples, mercado maduro, alta cadência de ligações',
    exemplo: '"Temos uma solução que reduz X — vale 20 minutos para te mostrar?"',
    recomendado: false,
  },
]


const STEPS = [
  { label: 'Objetivo', icon: Target },
  { label: 'Empresa e Produto', icon: Building2 },
  { label: 'Qualificação & Objeções', icon: Brain },
  { label: 'ICP & Sinais', icon: Target },
  { label: 'Abordagens de Abertura', icon: Zap },
  { label: 'Objeções de Canal', icon: MessageSquare },
  { label: 'Cenário & Dores', icon: Brain },
  { label: 'Gatilhos de Fechamento', icon: Zap },
  { label: 'Público-alvo', icon: Target },
  { label: 'Metodologia', icon: BarChart2 },
  { label: 'Roteiro & Materiais', icon: FileText },
  { label: 'Ligações de Referência', icon: Mic },
  { label: 'Voz e Tom', icon: Mic },
  { label: 'Agendamento', icon: CalendarCheck },
  { label: 'Calibração de Voz', icon: Mic },
  { label: 'Revisão & Ativação', icon: Zap },
]

// ─── Polling helper para jobs assíncronos de extração ────────────────────────
// Faz polling a cada 3s até status=done|error (max 10 min)
async function pollJobResult(jobId: string, onProgress?: (elapsed: number) => void): Promise<{
  texto: string; resumo: string | null; texto_filtrado: string | null; caracteres: number; nome: string
}> {
  const MAX_ATTEMPTS = 200 // 10 min @ 3s
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    await new Promise(r => setTimeout(r, 3000))
    onProgress?.(i * 3)
    const { data } = await agentesApi.extrairScriptStatus(jobId)
    if (data.status === 'done') return data as { texto: string; resumo: string | null; texto_filtrado: string | null; caracteres: number; nome: string }
    if (data.status === 'error') throw new Error(data.error || 'Erro na extração do arquivo.')
  }
  throw new Error('Tempo limite de extração excedido.')
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex flex-col items-center gap-3 mb-6">
      {/* Label do step atual */}
      <div className="text-center">
        <span className="text-xs font-semibold text-brand uppercase tracking-widest">
          Etapa {current + 1} de {STEPS.length} — {STEPS[current]?.label}
        </span>
      </div>
      {/* Círculos compactos para 12 etapas */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => {
          const done = i < current
          const active = i === current
          return (
            <React.Fragment key={s.label}>
              <div
                title={s.label}
                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold transition-all duration-200 ${
                  done
                    ? 'bg-brand-500 text-white'
                    : active
                    ? 'bg-brand text-white shadow-md ring-2 ring-brand-100'
                    : 'bg-gray-100 text-gray-400'
                } ${active ? 'text-[11px]' : 'text-[10px]'}`}
              >
                {done ? <Check size={10} strokeWidth={3} /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-4 h-0.5 transition-colors duration-300 ${i < current ? 'bg-brand-400' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}

function ProgressBar({ step }: { step: number }) {
  const pct = ((step + 1) / STEPS.length) * 100
  return (
    <div className="w-full bg-gray-100 rounded-full h-1 mb-7">
      <div
        className="bg-brand h-1 rounded-full transition-all duration-500"
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

interface Material {
  file: File | null
  tipo: string
  texto: string       // resumo Haiku (editável — alimenta etapas 3-12)
  textoRaw?: string   // texto bruto completo (alimenta gerar-prompt)
  analise: string | null
  extraindo: boolean
  erro: string | null
}

function MateriaisUpload({ materiais, onMateriaisChange, onConteudoChange }: {
  materiais: Material[]
  onMateriaisChange: (m: Material[]) => void
  onConteudoChange: (conteudo: string) => void
}) {
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([])

  const TIPOS = ['Apresentação', 'eBook', 'Case de Sucesso', 'Comparativo', 'Manual', 'One-Pager', 'Outro']
  const MAX_MB = 25
  const TIPOS_ACEITOS = '.pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.txt'

  function syncConteudo(lista: Material[]) {
    const partes = lista
      .filter(m => m.texto.trim())
      .map((m, i) => {
        const label = m.tipo ? `${m.tipo}${lista.length > 1 ? ` (material ${i + 1})` : ''}` : `Material ${i + 1}`
        return `=== ${label.toUpperCase()} ===\n${m.texto.trim()}`
      })
    onConteudoChange(partes.join('\n\n'))
  }

  function updateItem(i: number, patch: Partial<Material>) {
    const next = materiais.map((m, idx) => idx === i ? { ...m, ...patch } : m)
    onMateriaisChange(next)
    syncConteudo(next)
  }

  function adicionarLinha() {
    onMateriaisChange([...materiais, { file: null, tipo: '', texto: '', analise: null, extraindo: false, erro: null }])
  }

  function removerLinha(i: number) {
    if (materiais.length === 1) {
      const reset = [{ file: null, tipo: '', texto: '', analise: null, extraindo: false, erro: null }]
      onMateriaisChange(reset)
      onConteudoChange('')
    } else {
      const next = materiais.filter((_, idx) => idx !== i)
      onMateriaisChange(next)
      syncConteudo(next)
    }
  }

  async function onFileChange(i: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > MAX_MB * 1024 * 1024) { alert(`Arquivo muito grande. Máximo ${MAX_MB}MB.`); return }

    const tipoAtual = materiais[i].tipo
    updateItem(i, { file, extraindo: true, erro: null, analise: null, texto: '' })

    try {
      const { data: initData } = await agentesApi.extrairScript(file, tipoAtual || 'material')

      // Job assíncrono (PDF digitalizado OCR) — faz polling até concluir
      if (initData.jobId) {
        const data = await pollJobResult(initData.jobId, (elapsed) => {
          updateItem(i, { extraindo: true, analise: `Lendo PDF com IA... ${elapsed}s` })
        })
        // resumo → textarea editável (etapas 3-12)
        // texto completo → textoRaw oculto (gerar-prompt)
        const next = materiais.map((m, idx) =>
          idx === i ? { ...m, file, extraindo: false, texto: data.resumo || data.texto, textoRaw: data.texto, analise: data.resumo || null, erro: null } : m
        )
        onMateriaisChange(next)
        syncConteudo(next)
        return
      }

      // Resposta direta (PDF com texto nativo ou Word/TXT)
      // resumo Haiku → textarea editável (etapas 3-12)
      // texto bruto → textoRaw oculto (gerar-prompt recebe tudo)
      if (initData.texto) {
        const next = materiais.map((m, idx) =>
          idx === i ? { ...m, file, extraindo: false, texto: initData.resumo || initData.texto, textoRaw: initData.texto, analise: initData.resumo || null, erro: null } : m
        )
        onMateriaisChange(next)
        syncConteudo(next)
      } else {
        updateItem(i, { extraindo: false, erro: 'Não foi possível extrair texto. Use PDF, Word ou TXT.', file: null })
      }
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error
        || (err as { message?: string })?.message
        || 'Erro ao processar o arquivo. Tente outro formato.'
      updateItem(i, { extraindo: false, erro: msg, file: null })
    }
  }

  function onTipoChange(i: number, tipo: string) {
    updateItem(i, { tipo })
  }

  const totalCaracteresMateriais = materiais.reduce((acc, m) => acc + m.texto.length, 0)

  return (
    <div className="col-span-2 flex flex-col gap-5">
      <div>
        <p className="text-sm font-semibold text-brand uppercase tracking-wide mb-1">
          Materiais da empresa <span className="text-gray-400 font-normal normal-case">(quanto mais, melhor)</span>
        </p>
        <p className="text-xs text-gray-500 mb-3">
          Apresentações, ebooks, cases de sucesso, comparativos — o sistema lê cada arquivo, identifica proposta de valor, diferenciais e provas sociais, e injeta tudo no prompt final do agente.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {materiais.map((m, i) => (
          <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Material {i + 1}</span>
              <div className="flex items-center gap-3">
                <select
                  value={m.tipo}
                  onChange={e => onTipoChange(i, e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600 bg-white"
                >
                  <option value="">Tipo do material</option>
                  {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                {materiais.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removerLinha(i)}
                    className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1"
                  >
                    <X size={12} /> Remover
                  </button>
                )}
              </div>
            </div>

            <div className="p-4 flex flex-col gap-3">
              <input
                ref={el => { inputRefs.current[i] = el }}
                type="file"
                accept={TIPOS_ACEITOS}
                className="hidden"
                onChange={e => onFileChange(i, e)}
              />

              {/* Zona de upload — sem arquivo */}
              {!m.file && !m.extraindo && (
                <div
                  onClick={() => inputRefs.current[i]?.click()}
                  className="flex items-center gap-3 border border-dashed border-gray-300 rounded-lg px-4 py-3 cursor-pointer hover:border-brand-300 hover:bg-brand-50 transition-colors"
                >
                  <Upload size={16} className="text-gray-400 shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Enviar arquivo (opcional)</p>
                    <p className="text-xs text-gray-400">PDF, Word, PPT ou TXT — máx. 25MB</p>
                  </div>
                </div>
              )}

              {/* Extraindo */}
              {m.extraindo && (
                <div className="flex items-center gap-3 bg-brand-50 border border-brand-200 rounded-lg px-4 py-3">
                  <div className="w-4 h-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-brand-700">Lendo e analisando o arquivo...</p>
                    <p className="text-xs text-brand-500">Nossa IA está extraindo a inteligência comercial do documento</p>
                  </div>
                </div>
              )}

              {/* Card de sucesso após extração */}
              {m.file && !m.extraindo && !m.erro && m.texto && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-emerald-100">
                    <div className="flex items-center gap-2 min-w-0">
                      <Check size={13} className="text-emerald-600 shrink-0" />
                      <span className="text-xs font-semibold text-emerald-800 truncate">{m.file.name}</span>
                      <span className="text-xs text-emerald-500 shrink-0">{m.texto.length.toLocaleString('pt-BR')} caracteres</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateItem(i, { file: null, analise: null, erro: null, texto: '' })}
                      className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1 shrink-0 ml-2"
                    >
                      <X size={11} /> Remover arquivo
                    </button>
                  </div>
                  {m.analise && (
                    <div className="px-3 py-2.5 flex items-start gap-2">
                      <Brain size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-emerald-700 mb-1">Resumo inteligente gerado pela IA:</p>
                        <p className="text-xs text-emerald-700 whitespace-pre-line leading-relaxed">{m.analise}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Erro */}
              {m.erro && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                  <AlertTriangle size={13} className="text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-red-700 font-medium">{m.erro}</p>
                    <button type="button" onClick={() => updateItem(i, { erro: null, file: null })} className="text-xs text-red-500 underline mt-0.5">Tentar outro arquivo</button>
                  </div>
                </div>
              )}

              {/* Textarea — sempre visível */}
              <textarea
                rows={m.file && m.texto ? 12 : 6}
                value={m.texto}
                onChange={e => updateItem(i, { texto: e.target.value })}
                placeholder={`Cole o conteúdo do material diretamente aqui ou envie um arquivo acima...

Ex: descrição do produto, diferenciais, cases de sucesso, argumentos de vendas`}
                className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 resize-none text-gray-700 placeholder:text-gray-300 w-full"
              />
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={adicionarLinha}
        className="flex items-center justify-center gap-2 border-2 border-dashed border-brand-200 rounded-xl py-3 text-sm font-medium text-brand-600 hover:bg-brand-50 hover:border-brand-300 transition-colors"
      >
        <Plus size={16} /> Adicionar outro material
      </button>

      {totalCaracteresMateriais > 0 && (
        <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
          <Check size={12} />
          <span>
            <span className="font-semibold">{totalCaracteresMateriais.toLocaleString('pt-BR')} caracteres</span> de material identificados — tudo vai para o prompt final do agente
          </span>
        </div>
      )}
    </div>
  )
}

const OBJETIVOS = [
  {
    id: 'agendar-reunioes',
    icon: CalendarCheck,
    label: 'Agendar Reuniões',
    descricao: 'O agente qualifica prospects e agenda reuniões diretamente na agenda do time comercial, com confirmação em tempo real durante a própria ligação.',
    badges: ['Agenda integrada', 'Transferência ao vivo', 'Qualificação de leads'],
    cor: 'brand',
    disponivel: true,
  },
  {
    id: 'whatsapp',
    icon: MessageCircle,
    label: 'WhatsApp Inteligente',
    descricao: 'O agente responde mensagens de WhatsApp automaticamente, qualifica leads e, se o contato parar de responder, liga para retomar a conversa com contexto completo do histórico.',
    badges: ['Bidirecional voz + chat', 'Retomada automática', 'Contexto compartilhado'],
    cor: 'emerald',
    disponivel: false,
  },
  {
    id: 'upselling',
    icon: TrendingUp,
    label: 'Upselling para Clientes',
    descricao: 'O agente liga para sua base de clientes existentes com ofertas de upgrade, renovação ou produtos complementares — usando o histórico de compra para personalizar a abordagem.',
    badges: ['Base de clientes', 'Tom consultivo', 'Sem cold call'],
    cor: 'violet',
    disponivel: false,
  },
  {
    id: 'cobranca',
    icon: DollarSign,
    label: 'Cobrança de Clientes',
    descricao: 'O agente entra em contato com inadimplentes, negocia condições de pagamento dentro de regras pré-definidas e envia boletos ou contratos automaticamente.',
    badges: ['Régua de desconto', 'Boleto automático', 'Contrato de negociação'],
    cor: 'amber',
    disponivel: false,
  },
  {
    id: 'pesquisa',
    icon: ClipboardList,
    label: 'Pesquisa de Mercado',
    descricao: 'O agente aplica roteiros de pesquisa estruturados, coleta respostas e organiza os dados automaticamente — ideal para NPS, validação de produto ou inteligência competitiva.',
    badges: ['Roteiro personalizado', 'Coleta estruturada', 'Relatório automático'],
    cor: 'slate',
    disponivel: false,
  },
]

const COR_MAP: Record<string, { ring: string; bg: string; text: string; badge: string }> = {
  brand:   { ring: 'ring-brand-400',   bg: 'bg-brand-50',   text: 'text-brand-700',   badge: 'bg-brand-100 text-brand-700' },
  emerald: { ring: 'ring-emerald-400', bg: 'bg-emerald-50', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' },
  violet:  { ring: 'ring-violet-400',  bg: 'bg-violet-50',  text: 'text-violet-700',  badge: 'bg-violet-100 text-violet-700' },
  amber:   { ring: 'ring-amber-400',   bg: 'bg-amber-50',   text: 'text-amber-700',   badge: 'bg-amber-100 text-amber-700' },
  slate:   { ring: 'ring-slate-400',   bg: 'bg-slate-50',   text: 'text-slate-600',   badge: 'bg-slate-100 text-slate-600' },
}

function StepObjetivo({ form, onChange }: { form: FormData; onChange: (k: keyof FormData, v: string) => void }) {
  const objetivo = form['objetivo'] || 'agendar-reunioes'
  const isWhatsApp = objetivo === 'whatsapp'

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div>
        <h2 className="text-base font-semibold text-gray-900">Qual é o objetivo principal deste agente?</h2>
        <p className="text-sm text-gray-500 mt-1">
          O objetivo define como o agente conduz as ligações — o flow de conversa, o tom e o que acontece ao final de cada chamada.
          Você pode criar agentes com objetivos diferentes para campanhas distintas.
        </p>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-3">
        {OBJETIVOS.map(obj => {
          const ativo = objetivo === obj.id
          const cor = COR_MAP[obj.cor]
          const Icon = obj.icon
          return (
            <button
              key={obj.id}
              type="button"
              disabled={!obj.disponivel}
              onClick={() => obj.disponivel && onChange('objetivo', obj.id)}
              className={[
                'w-full text-left rounded-xl border-2 px-4 py-3.5 transition-all duration-150 relative',
                obj.disponivel ? 'cursor-pointer' : 'cursor-default opacity-60',
                ativo
                  ? `border-transparent ring-2 ${cor.ring} ${cor.bg}`
                  : 'border-gray-200 bg-white hover:border-gray-300',
              ].join(' ')}
            >
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${ativo ? cor.bg : 'bg-gray-100'}`}>
                  <Icon size={18} className={ativo ? cor.text : 'text-gray-500'} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm font-semibold ${ativo ? cor.text : 'text-gray-800'}`}>{obj.label}</span>
                    {!obj.disponivel && (
                      <span className="text-[10px] font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full uppercase tracking-wide">Em breve</span>
                    )}
                    {ativo && obj.disponivel && (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cor.badge}`}>Selecionado</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{obj.descricao}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {obj.badges.map(b => (
                      <span key={b} className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${ativo ? cor.badge : 'bg-gray-100 text-gray-500'}`}>{b}</span>
                    ))}
                  </div>
                </div>
                {ativo && obj.disponivel && (
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-1 ${cor.text.replace('text-', 'bg-').replace('-700', '-500')}`}>
                    <Check size={11} className="text-white" />
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Campo WhatsApp — aparece só quando selecionado */}
      {isWhatsApp && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <MessageCircle size={15} className="text-emerald-600" />
            <p className="text-sm font-semibold text-emerald-800">Número do WhatsApp da equipe</p>
          </div>
          <input
            value={form['whatsapp-numero']}
            onChange={e => onChange('whatsapp-numero', e.target.value)}
            placeholder="+55 11 99999-9999"
            className="w-full border border-emerald-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
          />
          <p className="text-xs text-emerald-700">
            Ao final de cada ligação qualificada, o agente informa ao contato que a equipe vai continuar o atendimento pelo WhatsApp e registra o contato para follow-up.
          </p>
        </div>
      )}

      {/* Nota sobre campanhas */}
      <div className="bg-brand-50 border border-brand-100 rounded-xl px-4 py-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-white border border-brand-100 flex items-center justify-center shrink-0 mt-0.5">
          <Zap size={15} className="text-brand" />
        </div>
        <div>
          <p className="text-sm font-semibold text-brand-800 mb-1">Como isso afeta suas campanhas</p>
          <p className="text-xs text-brand-700 leading-relaxed">
            {objetivo === 'agendar-reunioes' && 'As campanhas vão exibir campo de agenda e slots de horário. O agente reserva a reunião diretamente com o vendedor durante a ligação.'}
            {objetivo === 'whatsapp' && 'As campanhas não precisam de agenda. O agente qualifica o contato e o encaminha para o WhatsApp da equipe ao final da ligação.'}
            {objetivo === 'upselling' && 'As campanhas permitem importar base de clientes com produto atual, valor de contrato e data de renovação — o agente usa esses dados na ligação.'}
            {objetivo === 'cobranca' && 'As campanhas incluem campos de valor em dívida e data de vencimento por contato. O agente negocia dentro das regras de desconto definidas aqui.'}
            {objetivo === 'pesquisa' && 'As campanhas usam o roteiro de perguntas definido no setup. As respostas são coletadas automaticamente e exportáveis em planilha.'}
          </p>
        </div>
      </div>
    </div>
  )
}

function Step1({
  form,
  onChange,
  errors,
  materiais,
  onMateriaisChange,
}: {
  form: FormData
  onChange: (k: keyof FormData, v: string) => void
  errors: Partial<Record<keyof FormData, string>>
  materiais: Material[]
  onMateriaisChange: (m: Material[]) => void
}) {
  const [pesquisando, setPesquisando] = useState(false)
  const [pesquisaErro, setPesquisaErro] = useState<string | null>(null)
  const [buscandoCnpj, setBuscandoCnpj] = useState(false)
  const [cnpjErro, setCnpjErro] = useState<string | null>(null)
  const [iaPesquisouSite, setIaPesquisouSite] = useState(false)
  const [sites, setSites] = useState<string[]>([form['empresa-site'] || ''])
  const [pesquisandoSites, setPesquisandoSites] = useState<boolean[]>([false])

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
        const desc = d.cnae_fiscal_descricao.toLowerCase()
        const seg = desc.includes('software') || desc.includes('tecnologia') || desc.includes('inform') ? 'Tech / SaaS'
          : desc.includes('consult') || desc.includes('assessoria') ? 'Consultoria / Serviços B2B'
          : desc.includes('saúde') || desc.includes('médic') || desc.includes('hospital') || desc.includes('clínic') ? 'Clínicas / Saúde'
          : desc.includes('odonto') ? 'Odontologia'
          : desc.includes('educação') || desc.includes('ensino') || desc.includes('curso') ? 'Educação / Cursos'
          : desc.includes('financ') || desc.includes('crédito') || desc.includes('consórc') ? 'Financeiro / Crédito / Consórcio'
          : desc.includes('seguro') || desc.includes('plano') ? 'Planos de Saúde / Seguros'
          : desc.includes('construção') || desc.includes('imóvel') || desc.includes('incorpora') ? 'Construção Civil / Imóveis'
          : desc.includes('indústria') || desc.includes('fabricação') || desc.includes('manufat') ? 'Indústria / Manufatura'
          : desc.includes('varejo') || desc.includes('comércio varej') ? 'Varejo / E-commerce'
          : desc.includes('transport') || desc.includes('logística') ? 'Logística / Transporte'
          : desc.includes('telecom') || desc.includes('telefon') ? 'Internet / Telecom'
          : desc.includes('agro') || desc.includes('pecuária') || desc.includes('agrícola') ? 'Agronegócio / Pecuária'
          : desc.includes('publicidade') || desc.includes('marketing') ? 'Marketing / Publicidade'
          : desc.includes('jurídic') || desc.includes('advocacia') ? 'Jurídico / Advocacia'
          : desc.includes('estética') || desc.includes('cosmétic') || desc.includes('beleza') ? 'Cosméticos / Estética / Beleza'
          : ''
        if (seg) onChange('empresa-segmento', seg)
      }
      if (d.municipio && d.uf) {
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
    const sitesValidos = sites.map(s => s.trim()).filter(Boolean)
    const materiaisExtrados = materiais.filter(m => m.texto.trim().length > 0)
    if (sitesValidos.length === 0 && materiaisExtrados.length === 0) {
      setPesquisaErro('Informe pelo menos um site ou aguarde a extração dos materiais')
      return
    }
    setPesquisando(true)
    setPesquisaErro(null)
    setPesquisandoSites(sites.map(s => s.trim() !== ''))

    type SiteData = {
      descricao?: string; diferenciais?: string; concorrentes?: string
      icp_porte?: string; icp_segmento?: string; gatilhos?: string
      objecoes_comuns?: string; contexto_mercado?: string; script_abertura?: string
      descricao_produto?: string; resultados_clientes?: string; nome_produto?: string; cases_sucesso?: string
    }

    try {
      // Limita materiais a 20K chars para não estourar o contexto da chamada de pesquisa
      const conteudoMateriais = materiais.filter(m => m.texto.trim()).map(m => m.texto.trim()).join('\n\n---\n\n').slice(0, 20000)

      // Chamadas por site (cada uma recebe os materiais como contexto adicional)
      const chamadasSites = sitesValidos.map(site =>
        claudeApi.pesquisarMercado({
          empresa: form['empresa-nome'],
          cnpj: form['empresa-cnpj'],
          segmento: form['empresa-segmento'],
          site,
          produto: form['prod-nome'],
          materiais_conteudo: conteudoMateriais || undefined,
        }).then(r => ({ site, data: r.data as SiteData }))
      )

      // Se não há sites mas há materiais, faz uma chamada só com materiais
      const chamadasSemSite = sitesValidos.length === 0 && conteudoMateriais
        ? [claudeApi.pesquisarMercado({
            empresa: form['empresa-nome'],
            cnpj: form['empresa-cnpj'],
            segmento: form['empresa-segmento'],
            site: '',
            produto: form['prod-nome'],
            materiais_conteudo: conteudoMateriais,
          }).then(r => ({ site: 'materiais', data: r.data as SiteData }))]
        : []

      const resultados = await Promise.allSettled([...chamadasSites, ...chamadasSemSite])

      const sucessos = resultados
        .filter((r): r is PromiseFulfilledResult<{ site: string; data: SiteData }> => r.status === 'fulfilled')
        .map(r => r.value)

      if (sucessos.length === 0) {
        const primeiroErro = resultados.find(r => r.status === 'rejected') as PromiseRejectedResult | undefined
        const msgErro = primeiroErro?.reason?.response?.data?.error || primeiroErro?.reason?.message || 'Erro desconhecido'
        setPesquisaErro(`Não foi possível pesquisar. ${msgErro}`)
        return
      }

      function acumular(campo: keyof FormData, blocos: string[]) {
        if (blocos.length === 0) return
        const atual = (form[campo] as string || '').trim()
        const novo = blocos.join('\n\n')
        onChange(campo, atual ? `${atual}\n\n${novo}` : novo)
      }

      const label = (site: string) => {
        try { return new URL(site).hostname.replace('www.', '') } catch { return site }
      }

      const unico = sucessos.length === 1

      acumular('empresa-descricao',   sucessos.filter(s => s.data.descricao).map(s => unico ? s.data.descricao! : `[${label(s.site)}]\n${s.data.descricao}`))
      acumular('empresa-diferenciais', sucessos.filter(s => s.data.diferenciais).map(s => unico ? s.data.diferenciais! : `[${label(s.site)}]\n${s.data.diferenciais}`))
      acumular('prod-descricao',       sucessos.filter(s => s.data.descricao_produto).map(s => unico ? s.data.descricao_produto! : `[${label(s.site)}]\n${s.data.descricao_produto}`))
      acumular('prod-resultados',      sucessos.filter(s => s.data.resultados_clientes).map(s => unico ? s.data.resultados_clientes! : `[${label(s.site)}]\n${s.data.resultados_clientes}`))
      acumular('prod-info-extra',      sucessos.filter(s => s.data.cases_sucesso).map(s => unico ? s.data.cases_sucesso! : `[${label(s.site)}]\n${s.data.cases_sucesso}`))
      acumular('prod-concorrentes',    sucessos.filter(s => s.data.concorrentes).map(s => unico ? s.data.concorrentes! : `[${label(s.site)}]\n${s.data.concorrentes}`))
      acumular('empresa-contexto-mercado', sucessos.filter(s => s.data.contexto_mercado).map(s => unico ? s.data.contexto_mercado! : `[${label(s.site)}]\n${s.data.contexto_mercado}`))

      const mercadoBlocos = sucessos.map(s => {
        const partes = [
          s.data.concorrentes ? `Concorrentes: ${s.data.concorrentes}` : '',
          s.data.objecoes_comuns ? `Objeções:\n${s.data.objecoes_comuns}` : '',
        ].filter(Boolean).join('\n')
        if (!partes) return null
        return unico ? partes : `[${label(s.site)}]\n${partes}`
      }).filter(Boolean) as string[]
      acumular('empresa-objecoes-comuns', mercadoBlocos)

      // script_abertura: só preenche se ainda vazio
      const primeiroScript = sucessos.find(s => s.data.script_abertura)
      if (primeiroScript?.data.script_abertura && !form['script-abertura'].trim()) {
        onChange('script-abertura', primeiroScript.data.script_abertura)
      }
      // nome_produto: só preenche se ainda vazio
      const primeiroNome = sucessos.find(s => s.data.nome_produto)
      if (primeiroNome?.data.nome_produto && !form['prod-nome'].trim()) {
        onChange('prod-nome', primeiroNome.data.nome_produto)
      }
      // icp: preenche do primeiro que tiver
      const primeiroIcp = sucessos.find(s => s.data.icp_porte)
      if (primeiroIcp?.data.icp_porte && !form['icp-porte-alvo'].trim()) onChange('icp-porte-alvo', primeiroIcp.data.icp_porte)
      const primeiroSeg = sucessos.find(s => s.data.icp_segmento)
      if (primeiroSeg?.data.icp_segmento && !form['icp-segmento-alvo'].trim()) onChange('icp-segmento-alvo', primeiroSeg.data.icp_segmento)
      // gatilhos: acumula
      // gatilhos-customizados NÃO é preenchido aqui — só pelo botão "Gerar com IA" da etapa 4

      // Salva o primeiro site válido em empresa-site para compatibilidade
      onChange('empresa-site', sitesValidos[0])

      const falhas = resultados.filter(r => r.status === 'rejected').length
      if (falhas > 0) setPesquisaErro(`${sucessos.length} site(s) pesquisado(s) com sucesso. ${falhas} não respondeu.`)
      setIaPesquisouSite(true)
    } catch (err: unknown) {
      const axiosData = (err as { response?: { data?: { error?: string } } })?.response?.data
      const msg = axiosData?.error ?? (err instanceof Error ? err.message : 'Erro ao pesquisar')
      setPesquisaErro(`Erro: ${msg}`)
    } finally {
      setPesquisando(false)
      setPesquisandoSites(sites.map(() => false))
    }
  }

  const aiPreencheu = iaPesquisouSite
  const materiaisExtrados = materiais.filter(m => m.texto.trim().length > 0)
  const materiaisOk = materiaisExtrados.length >= 2
  const podePesquisar = materiaisOk

  return (
    <div className="flex flex-col gap-5">

      {/* ── Banner IA — só status após pesquisar ───────────────────────────── */}
      {aiPreencheu && (
        <div className="rounded-2xl border bg-emerald-50 border-emerald-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-emerald-100">
              <Check size={16} className="text-emerald-600" strokeWidth={3} />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-800">IA preencheu os campos — revise e ajuste</p>
              <p className="text-xs mt-0.5 text-emerald-700">Os campos foram preenchidos com base nos sites e materiais. Revise, complemente e corrija antes de avançar.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Seção: Identificação ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-brand rounded-full" />
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Identificação</span>
        </div>

        <Field label="Nome do agente" required error={errors['nome-agente']}>
          <input
            id="nome-agente"
            className={inputCls}
            value={form['nome-agente']}
            onChange={e => onChange('nome-agente', e.target.value)}
            placeholder="Ex: Maria — Prospecção SP"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
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
              <button type="button" onClick={buscarCNPJ} disabled={buscandoCnpj}
                className="shrink-0 flex items-center gap-1 text-xs px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 disabled:opacity-50 text-gray-600 font-medium rounded-xl transition-colors whitespace-nowrap"
              >
                {buscandoCnpj ? <Loader2 size={11} className="animate-spin" /> : <Search size={11} />}
                {buscandoCnpj ? '...' : 'Buscar'}
              </button>
            </div>
            {cnpjErro && <p className="text-xs text-red-500 mt-1">{cnpjErro}</p>}
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Segmento de atuação">
            <select id="empresa-segmento" className={selectCls}
              value={SEGMENTOS.includes(form['empresa-segmento']) ? form['empresa-segmento'] : form['empresa-segmento'] ? 'Outros' : ''}
              onChange={e => onChange('empresa-segmento', e.target.value)}>
              <option value="">Selecione...</option>
              {SEGMENTOS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {(form['empresa-segmento'] === 'Outros' || (!SEGMENTOS.includes(form['empresa-segmento']) && form['empresa-segmento'])) && (
              <input
                className={`${inputCls} mt-2`}
                placeholder="Digite o segmento..."
                value={form['empresa-segmento'] === 'Outros' ? '' : form['empresa-segmento']}
                onChange={e => onChange('empresa-segmento', e.target.value || 'Outros')}
                autoFocus
              />
            )}
          </Field>
          <Field label="Porte da empresa">
            <select id="empresa-porte" className={selectCls} value={form['empresa-porte']}
              onChange={e => onChange('empresa-porte', e.target.value)}>
              <option value="">Selecione...</option>
              {PORTES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">
            Sites para pesquisa com IA
            {errors['empresa-site'] && <span className="ml-2 text-xs text-red-500">{errors['empresa-site']}</span>}
          </label>
          {sites.map((site, i) => (
            <div key={i} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <input
                  className={`${inputCls} flex-1`}
                  value={site}
                  onChange={e => {
                    const next = sites.map((s, idx) => idx === i ? e.target.value : s)
                    setSites(next)
                    if (i === 0) onChange('empresa-site', e.target.value)
                  }}
                  placeholder={i === 0 ? 'https://suaempresa.com.br' : 'https://parceiro.com.br (opcional)'}
                />
                {sites.length > 1 && !pesquisandoSites[i] && (
                  <button type="button" onClick={() => setSites(sites.filter((_, idx) => idx !== i))}
                    className="shrink-0 text-gray-400 hover:text-red-500 transition-colors">
                    <X size={16} />
                  </button>
                )}
              </div>
              {pesquisandoSites[i] && (
                <div className="flex items-center gap-1.5 px-1">
                  <div className="w-3 h-3 border-2 border-brand-400 border-t-transparent rounded-full animate-spin shrink-0" />
                  <span className="text-xs text-brand-600 font-medium">Pesquisando site...</span>
                </div>
              )}
            </div>
          ))}
          {sites.length < 5 && (
            <button type="button"
              onClick={() => setSites([...sites, ''])}
              className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-medium w-fit mt-0.5">
              <Plus size={13} /> Adicionar outro site
            </button>
          )}
          <p className="text-xs text-gray-400">Cada site pesquisado adiciona informações às caixas abaixo — nada é apagado.</p>
        </div>
      </div>

      {/* ── Seção: Sobre a empresa ──────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-brand rounded-full" />
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Sobre a empresa</span>
          {aiPreencheu && <span className="text-[10px] bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">preenchido pela IA</span>}
        </div>

        <Field label="O que sua empresa faz e para quem">
          <textarea id="empresa-descricao" className={textareaCls} rows={3}
            value={form['empresa-descricao']}
            onChange={e => onChange('empresa-descricao', e.target.value)}
            placeholder="Ex: Plataforma B2B de automação de vendas para empresas de tecnologia com 5–100 funcionários que querem aumentar reuniões comerciais sem contratar mais SDRs..."
          />
        </Field>

        <Field label="Principais diferenciais competitivos">
          <textarea id="empresa-diferenciais" className={textareaCls} rows={2}
            value={form['empresa-diferenciais']}
            onChange={e => onChange('empresa-diferenciais', e.target.value)}
            placeholder="Ex: IA de voz nativa em PT-BR, integração com Google Meet, custo 70% menor que SDR humano..."
          />
        </Field>

        <Field label="Concorrentes e como responder quando citados">
          <textarea id="empresa-objecoes-comuns" className={textareaCls} rows={3}
            value={form['empresa-objecoes-comuns']}
            onChange={e => onChange('empresa-objecoes-comuns', e.target.value)}
            placeholder={`Concorrentes: Salesforce, RD Station, Moskit\n\nObjeções: "Já temos CRM" → O ETZ complementa o CRM sem substituir, focando em prospecção ativa...`}
          />
        </Field>
      </div>

      {/* ── Seção: Produto ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-brand rounded-full" />
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Produto ou serviço</span>
        </div>

        <Field label="Nome do produto/serviço" required error={errors['prod-nome']}>
          <input id="prod-nome" className={inputCls}
            value={form['prod-nome']}
            onChange={e => onChange('prod-nome', e.target.value)}
            placeholder="Ex: Plataforma de Gestão Comercial"
          />
        </Field>

        <Field label="Descrição do produto">
          <textarea id="prod-descricao" className={textareaCls} rows={3}
            value={form['prod-descricao']}
            onChange={e => onChange('prod-descricao', e.target.value)}
            placeholder="O que é, como funciona, principais funcionalidades..."
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Resultados para clientes">
            <textarea id="prod-resultados" className={textareaCls} rows={3}
              value={form['prod-resultados']}
              onChange={e => onChange('prod-resultados', e.target.value)}
              placeholder="Qual resultado o cliente obtém? Ex: reduz 30% inadimplência..."
            />
          </Field>
          <Field label="Cases de sucesso e provas sociais">
            <textarea id="prod-info-extra" className={textareaCls} rows={3}
              value={form['prod-info-extra']}
              onChange={e => onChange('prod-info-extra', e.target.value)}
              placeholder="+5.000 clientes, parceria Serasa, case -40% inadimplência..."
            />
          </Field>
        </div>
      </div>

      {/* ── Materiais ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-brand rounded-full" />
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Materiais de apoio</span>
          <span className="text-[10px] text-red-500 font-semibold uppercase tracking-wide">mínimo 2 obrigatórios</span>
        </div>
        <MateriaisUpload materiais={materiais} onMateriaisChange={onMateriaisChange} onConteudoChange={v => onChange('materiais-conteudo', v)} />
      </div>

      {/* ── Botão Pesquisar com IA ──────────────────────────────────────────── */}
      <div className={`rounded-2xl border-2 p-5 transition-all ${podePesquisar ? 'border-brand/30 bg-brand/5' : 'border-gray-200 bg-gray-50'}`}>
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${podePesquisar ? 'bg-brand/10' : 'bg-gray-200'}`}>
              <Brain size={16} className={podePesquisar ? 'text-brand' : 'text-gray-400'} />
            </div>
            <div>
              <p className={`text-sm font-semibold ${podePesquisar ? 'text-gray-900' : 'text-gray-400'}`}>
                {podePesquisar ? 'Tudo pronto — deixa a IA preencher por você' : `Anexe pelo menos 2 materiais para liberar a pesquisa com IA`}
              </p>
              <p className={`text-xs mt-0.5 leading-relaxed ${podePesquisar ? 'text-gray-500' : 'text-gray-400'}`}>
                {podePesquisar
                  ? `${materiaisExtrados.length} ${materiaisExtrados.length === 1 ? 'material extraído' : 'materiais extraídos'} + sites informados. A IA vai preencher todos os campos acima automaticamente.`
                  : `${materiaisExtrados.length} de 2 materiais extraídos. Quanto mais materiais, mais preciso o preenchimento e mais assertivas serão as etapas seguintes.`
                }
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={pesquisarComIA}
            disabled={pesquisando || !podePesquisar}
            className={`w-full flex items-center justify-center gap-2 text-sm px-4 py-3 font-semibold rounded-xl transition-all shadow-sm ${
              podePesquisar
                ? aiPreencheu
                  ? 'bg-white border border-brand/30 text-brand hover:bg-brand/5'
                  : 'bg-brand text-white hover:bg-brand/90'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {pesquisando
              ? <><Loader2 size={15} className="animate-spin" /> Pesquisando sites e materiais...</>
              : aiPreencheu
              ? <><RefreshCw size={15} /> Repesquisar com IA</>
              : <><Brain size={15} /> Pesquisar com IA</>
            }
          </button>
          {pesquisaErro && (
            <p className="text-xs text-red-600 flex items-center gap-1.5">
              <AlertTriangle size={11} className="shrink-0" /> {pesquisaErro}
            </p>
          )}
        </div>
      </div>

    </div>
  )
}



type FiltroGenero = 'Todos' | 'Feminino' | 'Masculino'

function VozSelector({ form, onChange }: { form: FormData; onChange: (k: keyof FormData, v: string) => void }) {
  const [filtro, setFiltro] = useState<FiltroGenero>('Todos')
  const [previewingId, setPreviewingId] = useState<string | null>(null)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [previewErro, setPreviewErro] = useState<string | null>(null)
  const audioRef = React.useRef<HTMLAudioElement | null>(null)

  async function playPreview(e: React.MouseEvent, voiceId: string) {
    e.stopPropagation()
    // Se já está tocando esta voz, para
    if (playingId === voiceId) {
      audioRef.current?.pause()
      setPlayingId(null)
      return
    }
    // Para qualquer áudio anterior
    audioRef.current?.pause()
    setPlayingId(null)
    if (previewingId) return
    setPreviewingId(voiceId)
    setPreviewErro(null)
    try {
      const token = localStorage.getItem('youagent_jwt')
      const resp = await fetch(
        `https://app.etztech.com/api/v1/agentes/preview-voz?voice_id=${encodeURIComponent(voiceId)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!resp.ok) {
        let msg = `Erro ${resp.status}`
        try { const j = await resp.json(); msg = j.error || msg } catch {}
        throw new Error(msg)
      }
      const contentType = resp.headers.get('content-type') || ''
      if (!contentType.includes('audio')) {
        const txt = await resp.text()
        throw new Error(`Resposta inesperada (${contentType}): ${txt.slice(0, 120)}`)
      }
      const blob = await resp.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => { setPlayingId(null); setPreviewingId(null); URL.revokeObjectURL(url) }
      audio.onerror = () => { setPlayingId(null); setPreviewingId(null); URL.revokeObjectURL(url) }
      audio.play()
      setPreviewingId(null)
      setPlayingId(voiceId)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar prévia'
      setPreviewErro(msg)
      setPreviewingId(null)
    }
  }

  const grupos = (['pt-BR'] as const).map(idioma => ({
    idioma,
    label: 'Português — Brasil',
    vozes: VOZES_TELNYX.filter(
      v => v.idioma === idioma && (filtro === 'Todos' || v.genero === filtro)
    ),
  })).filter(g => g.vozes.length > 0)

  const modeloBadge = (modelo: string) => {
    if (modelo === 'Natural HD') return 'bg-violet-50 text-violet-600'
    if (modelo === 'Ultra')      return 'bg-amber-50 text-amber-600'
    return 'bg-gray-100 text-gray-500'
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">Voz do agente</p>
        <div className="flex gap-1 p-0.5 bg-gray-100 rounded-lg">
          {(['Todos', 'Feminino', 'Masculino'] as FiltroGenero[]).map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setFiltro(f)}
              className={`text-xs px-3 py-1 rounded-md transition-all font-medium ${
                filtro === f
                  ? 'bg-white text-brand-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {previewErro && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-xs text-red-700">
          <AlertTriangle size={13} className="shrink-0 mt-0.5 text-red-500" />
          <span><strong>Prévia de voz:</strong> {previewErro}</span>
        </div>
      )}

      <div className="flex flex-col gap-5">
        {grupos.map(g => (
          <div key={g.idioma}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-3.5 bg-brand rounded-full" />
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{g.label}</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {g.vozes.map(v => {
                const selecionada = form.voz === v.id
                const carregando  = previewingId === v.id
                const tocando     = playingId === v.id
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => onChange('voz', v.id)}
                    className={`text-left p-3 rounded-xl border-2 transition-all flex flex-col gap-2 group ${
                      selecionada
                        ? 'border-brand bg-brand-50'
                        : 'border-gray-200 bg-white hover:border-brand-200 hover:bg-gray-50'
                    }`}
                  >
                    {/* Header: avatar + play */}
                    <div className="flex items-center justify-between">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base ${
                        selecionada ? 'bg-brand-100' : 'bg-gray-100'
                      }`}>
                        {v.genero === 'Feminino' ? '👩‍💼' : '👨‍💼'}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => playPreview(e, v.id)}
                        title={tocando ? 'Parar' : 'Ouvir prévia'}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                          tocando
                            ? 'bg-brand text-white shadow-sm'
                            : carregando
                            ? 'bg-brand-100 text-brand-400'
                            : 'bg-gray-100 text-gray-400 hover:bg-brand-100 hover:text-brand group-hover:bg-brand-50'
                        }`}
                      >
                        {carregando
                          ? <Loader2 size={11} className="animate-spin" />
                          : tocando
                          ? <Square size={9} className="fill-current" />
                          : <Play size={11} />}
                      </button>
                    </div>

                    {/* Nome + selecionado */}
                    <div className="flex items-center justify-between gap-1">
                      <p className={`font-semibold text-sm leading-tight ${selecionada ? 'text-brand-800' : 'text-gray-900'}`}>
                        {v.nome}
                      </p>
                      {selecionada && (
                        <div className="w-4 h-4 rounded-full bg-brand flex items-center justify-center shrink-0">
                          <Check size={9} className="text-white" />
                        </div>
                      )}
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${modeloBadge(v.modelo)}`}>
                        {v.modelo}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        v.genero === 'Feminino' ? 'bg-pink-50 text-pink-500' : 'bg-sky-50 text-sky-500'
                      }`}>
                        {v.genero}
                      </span>
                    </div>

                    {/* Barra de onda animada quando tocando */}
                    {tocando && (
                      <div className="flex items-end gap-0.5 h-3">
                        {[1,2,3,4,5].map(i => (
                          <div key={i} className="w-1 bg-brand rounded-full animate-bounce"
                            style={{ height: `${[40,70,100,60,80][i-1]}%`, animationDelay: `${i * 80}ms` }} />
                        ))}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Step 2 — Qualificação & Objeções (IA sugere baseado no Step 1) ──────────
function StepQualificacao({
  form,
  onChange,
  objecoes,
  onObjecoesChange,
  perguntas,
  onPerguntasChange,
}: {
  form: FormData
  onChange: (k: keyof FormData, v: string) => void
  objecoes: Objecao[]
  onObjecoesChange: (o: Objecao[]) => void
  perguntas: string[]
  onPerguntasChange: (p: string[]) => void
}) {
  const [gerando, setGerando] = useState(false)
  const [erroGeracao, setErroGeracao] = useState('')
  const jaGerou = perguntas.some(p => p) || objecoes.some(o => o.objecao)

  async function sugerir() {
    setGerando(true)
    setErroGeracao('')
    try {
      const res = await claudeApi.sugerirQualificacao({
        empresa: form['empresa-nome'],
        produto: form['prod-nome'],
        segmento: form['empresa-segmento'],
        descricao_empresa: form['empresa-descricao'],
        diferenciais: form['empresa-diferenciais'],
        objecoes_comuns: form['empresa-objecoes-comuns'],
        resultados_clientes: form['prod-resultados'],
        concorrentes: form['prod-concorrentes'],
        descricao_produto: form['prod-descricao'],
        info_adicional: form['prod-info-extra'],
        materiais_conteudo: form['materiais-conteudo'],
      })
      const data = res.data as { perguntas?: string[]; objecoes?: Objecao[]; sinais?: string }
      if (data.perguntas?.length) {
        onPerguntasChange(data.perguntas)
        onChange('wiz-qualif-q1', data.perguntas[0] || '')
        onChange('wiz-qualif-q2', data.perguntas[1] || '')
        onChange('wiz-qualif-q3', data.perguntas[2] || '')
      }
      if (data.objecoes?.length) {
        onObjecoesChange(data.objecoes)
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error || (err as { message?: string })?.message || 'erro desconhecido'
      console.error('[sugerir-qualificacao] erro:', msg, err)
      setErroGeracao(`Não foi possível gerar sugestões. Erro: ${msg}`)
    } finally {
      setGerando(false)
    }
  }

  function updateObjecao(i: number, field: keyof Objecao, value: string) {
    onObjecoesChange(objecoes.map((o, idx) => idx === i ? { ...o, [field]: value } : o))
  }
  function addObjecao() {
    if (objecoes.length < 10) onObjecoesChange([...objecoes, { objecao: '', rebuttal: '', sequencia: '', rebuttal_sequencia: '' }])
  }
  function removeObjecao(i: number) {
    if (objecoes.length > 1) onObjecoesChange(objecoes.filter((_, idx) => idx !== i))
  }
  function updatePergunta(i: number, v: string) {
    onPerguntasChange(perguntas.map((p, idx) => idx === i ? v : p))
  }
  function addPergunta() {
    if (perguntas.length < 10) onPerguntasChange([...perguntas, ''])
  }
  function removePergunta(i: number) {
    if (perguntas.length > 1) onPerguntasChange(perguntas.filter((_, idx) => idx !== i))
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Banner IA */}
      <div className={`flex items-start justify-between gap-4 p-4 rounded-xl border ${jaGerou ? 'border-brand/20 bg-brand/5' : 'border-brand/30 bg-brand/5'}`}>
        <div className="flex items-start gap-3">
          <Brain size={18} className="text-brand mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {gerando ? 'Gerando sugestões...' : jaGerou ? 'Sugestões geradas pela IA' : 'Gerar sugestões com IA'}
            </p>
            <p className={`text-xs mt-0.5 ${!gerando && !jaGerou ? 'text-amber-700 font-medium' : 'text-gray-500'}`}>
              {gerando
                ? 'Analisando as informações da sua empresa e produto...'
                : jaGerou
                ? 'Com base nas informações da etapa anterior, a IA sugeriu perguntas e objeções. Edite livremente.'
                : '⚠️ Antes de gerar, confirme que a etapa anterior está completamente preenchida — cada etapa alimenta a próxima. Quanto mais completo, mais preciso o resultado.'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={sugerir}
          disabled={gerando}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 shrink-0 ${jaGerou ? 'text-brand border border-brand/30 hover:bg-brand/10' : 'text-white bg-brand hover:bg-brand/90 border border-brand'}`}
        >
          {gerando ? <Loader2 size={12} className="animate-spin" /> : jaGerou ? <RefreshCw size={12} /> : <Brain size={12} />}
          {gerando ? 'Gerando...' : jaGerou ? 'Regerar' : 'Gerar com IA'}
        </button>
      </div>

      {erroGeracao && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{erroGeracao}</p>
      )}

      {/* Perguntas de qualificação */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-1">Perguntas de qualificação</p>
        <p className="text-xs text-gray-400 mb-3">O agente seleciona as melhores perguntas para cada ligação com base no perfil do prospect.</p>
        <div className="flex flex-col gap-2">
          {perguntas.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs font-semibold text-brand w-5 shrink-0">{i + 1}.</span>
              <input
                className={inputCls}
                value={p}
                onChange={e => updatePergunta(i, e.target.value)}
                placeholder={gerando ? 'Aguardando geração...' : `Pergunta ${i + 1}`}
                disabled={gerando}
              />
              {perguntas.length > 3 && (
                <button type="button" onClick={() => removePergunta(i)}
                  className="text-xs text-red-400 hover:text-red-600 shrink-0">✕</button>
              )}
            </div>
          ))}
        </div>
        {perguntas.length < 10 && (
          <button type="button" onClick={addPergunta}
            className="mt-2 text-xs text-brand hover:text-brand-600 font-medium flex items-center gap-1">
            + Adicionar pergunta
          </button>
        )}
      </div>

      {/* Objeções */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-medium text-gray-700">Objeções e respostas</p>
            <p className="text-xs text-gray-400 mt-0.5">Como o agente responde quando o contato hesitar.</p>
          </div>
          {objecoes.length < 10 && (
            <button type="button" onClick={addObjecao}
              className="text-xs text-brand hover:text-brand-600 font-medium flex items-center gap-1">
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
                  <button type="button" onClick={() => removeObjecao(i)}
                    className="text-xs text-red-400 hover:text-red-600">✕</button>
                )}
              </div>
              <input className={inputCls} placeholder='Ex: "Não tenho orçamento agora"'
                value={obj.objecao} onChange={e => updateObjecao(i, 'objecao', e.target.value)} disabled={gerando} />
              <textarea className={textareaCls} rows={2} placeholder="Como o agente responde a essa objeção..."
                value={obj.rebuttal} onChange={e => updateObjecao(i, 'rebuttal', e.target.value)} disabled={gerando} />
              {/* Sequência de objeção — expansível */}
              <div className="mt-2 pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-1.5">Se após sua resposta o prospect insistir com outra objeção:</p>
                <input
                  className={`${inputCls} text-xs mb-1.5`}
                  value={obj.sequencia || ''}
                  onChange={e => updateObjecao(i, 'sequencia', e.target.value)}
                  placeholder="Ex: Mas já tentamos algo assim e não funcionou..."
                  disabled={gerando}
                />
                {obj.sequencia && (
                  <>
                    <p className="text-xs text-gray-400 mb-1">Como responder:</p>
                    <textarea
                      className={`${textareaCls} text-xs`}
                      rows={2}
                      value={obj.rebuttal_sequencia || ''}
                      onChange={e => updateObjecao(i, 'rebuttal_sequencia', e.target.value)}
                      placeholder="Ex: Faz sentido — muitos clientes tiveram experiências frustrantes antes. O que costuma falhar é..."
                      disabled={gerando}
                    />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Step 5 — Gatilhos de Fechamento ─────────────────────────────────────────
function StepGatilhosFechamento({ form, onChange, objecoes, abordagens }: {
  form: FormData
  onChange: (k: keyof FormData, v: string) => void
  objecoes: Objecao[]
  abordagens: Abordagem[]
}) {
  const [gerando, setGerando] = useState(false)
  const [erroGeracao, setErroGeracao] = useState('')
  const jaGerou = !!form['gatilhos-fechamento']

  async function sugerir() {
    setGerando(true)
    setErroGeracao('')
    try {
      const res = await claudeApi.sugerirGatilhosFechamento({
        empresa: form['empresa-nome'],
        produto: form['prod-nome'],
        segmento: form['empresa-segmento'],
        descricao_empresa: form['empresa-descricao'],
        diferenciais: form['empresa-diferenciais'],
        objecoes_comuns: form['empresa-objecoes-comuns'],
        contexto_mercado: form['empresa-contexto-mercado'],
        resultados_clientes: form['prod-resultados'],
        concorrentes: form['prod-concorrentes'],
        descricao_produto: form['prod-descricao'],
        info_adicional: form['prod-info-extra'],
        // Etapa 3 — qualificação + objeções
        perguntas: [form['wiz-qualif-q1'], form['wiz-qualif-q2'], form['wiz-qualif-q3']].filter(Boolean).join(' | '),
        // Etapa 4 — sinais de compra
        sinais_compra: form['gatilhos-customizados'],
        // Etapa 5 — ICP
        icp_cargo: form['icp-cargo-tipo'],
        icp_porte: form['icp-porte-alvo'],
        icp_segmento: form['icp-segmento-alvo'],
        // Etapa 5b — cenário & dores
        cenario_dores: form['cenario-dores'],
        materiais_conteudo: form['materiais-conteudo'],
        // Cascade — objeções de valor + abordagens de abertura
        objecoes_valor: objecoes.map(o => `"${o.objecao}" → "${o.rebuttal}"`).filter(Boolean).join('\n'),
        abordagens_contexto: abordagens.filter(a => a.selecionada && a.texto.trim()).map(a => a.texto).join(' | '),
      })
      const data = res.data as { gatilhos: string }
      if (data.gatilhos) onChange('gatilhos-fechamento', data.gatilhos)
    } catch {
      setErroGeracao('Não foi possível gerar sugestões. Descreva manualmente.')
    } finally {
      setGerando(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Card informativo — contexto do produto */}
      <div className="p-4 rounded-xl border border-amber-200 bg-amber-50">
        <div className="flex items-start gap-3">
          <Zap size={17} className="text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-gray-900">Como funciona a transferência ao vivo</p>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              A função principal do agente ETZ é <strong>agendar reuniões</strong> para os vendedores da sua empresa. Porém, quando o prospect demonstra intenção de fechar ou comprar <strong>agora mesmo</strong> durante a ligação, o agente identifica esse momento e transfere a chamada diretamente para um vendedor disponível — sem precisar agendar uma reunião futura.
            </p>
            <p className="text-xs text-amber-700 font-medium mt-2">
              Defina abaixo os sinais exatos que indicam esse momento de fechamento imediato para o seu negócio.
            </p>
          </div>
        </div>
      </div>

      {/* Banner IA */}
      <div className={`flex items-start justify-between gap-4 p-4 rounded-xl border ${jaGerou ? 'border-brand/20 bg-brand/5' : 'border-brand/30 bg-brand/5'}`}>
        <div className="flex items-start gap-3">
          <Brain size={18} className="text-brand mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {gerando ? 'Gerando gatilhos...' : jaGerou ? 'Gatilhos gerados pela IA' : 'Gerar gatilhos com IA'}
            </p>
            <p className={`text-xs mt-0.5 ${!gerando && !jaGerou ? 'text-amber-700 font-medium' : 'text-gray-500'}`}>
              {gerando
                ? 'Analisando seu segmento para mapear os sinais de fechamento imediato...'
                : jaGerou
                ? 'Sugestões baseadas no seu produto e público. Edite para refletir o que seus prospects realmente dizem quando estão prontos para fechar.'
                : '⚠️ Antes de gerar, confirme que as etapas anteriores estão completamente preenchidas — cada etapa alimenta a próxima. Quanto mais completo, mais preciso o resultado.'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={sugerir}
          disabled={gerando}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 shrink-0 ${jaGerou ? 'text-brand border border-brand/30 hover:bg-brand/10' : 'text-white bg-brand hover:bg-brand/90 border border-brand'}`}
        >
          {gerando ? <Loader2 size={12} className="animate-spin" /> : jaGerou ? <RefreshCw size={12} /> : <Brain size={12} />}
          {gerando ? 'Gerando...' : jaGerou ? 'Regerar' : 'Gerar com IA'}
        </button>
      </div>

      {erroGeracao && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{erroGeracao}</p>
      )}

      <div>
        <p className="text-sm font-medium text-gray-700 mb-1">Sinais de fechamento imediato</p>
        <p className="text-xs text-gray-400 mb-3">
          Frases, perguntas ou contextos que o prospect usa quando quer fechar ou comprar agora — e não em uma reunião futura.
        </p>
        <textarea
          className={textareaCls}
          rows={5}
          value={form['gatilhos-fechamento']}
          onChange={e => onChange('gatilhos-fechamento', e.target.value)}
          placeholder={gerando ? 'Aguardando geração...' : 'Ex: "quanto fica para começar essa semana?", "pode me mandar o contrato agora?"...'}
          disabled={gerando}
        />
        <p className="text-xs text-gray-400 mt-1">
          Separe os gatilhos por vírgula ou coloque um por linha. Quanto mais específico para o seu segmento, mais preciso o agente será.
        </p>
      </div>
    </div>
  )
}

// ─── Step 4 — Público-alvo (checkboxes de cargo) ─────────────────────────────
function StepPublicoAlvo({ form, onChange }: {
  form: FormData
  onChange: (k: keyof FormData, v: string) => void
}) {
  function toggleCargo(cargo: string) {
    const atual = form['icp-cargo-tipo'] ? form['icp-cargo-tipo'].split(', ').filter(Boolean) : []
    const next = atual.includes(cargo) ? atual.filter(c => c !== cargo) : [...atual, cargo]
    onChange('icp-cargo-tipo', next.join(', '))
  }
  const cargosSelecionados = form['icp-cargo-tipo'] ? form['icp-cargo-tipo'].split(', ').filter(Boolean) : []

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-sm font-medium text-gray-700 mb-1">Selecione o público-alvo</p>
        <p className="text-xs text-gray-400 mb-4">Quem são os decisores que o agente vai abordar? Selecione todos que se aplicam.</p>
        <div className="grid grid-cols-3 gap-x-6 gap-y-3">
          {CARGOS_ICP.map(cargo => {
            const selecionado = cargosSelecionados.includes(cargo)
            return (
              <button key={cargo} type="button" onClick={() => toggleCargo(cargo)}
                className="flex items-center gap-2.5 text-left group">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  selecionado ? 'border-brand bg-brand' : 'border-gray-300 bg-white group-hover:border-brand/50'
                }`}>
                  {selecionado && <Check size={11} className="text-white" />}
                </div>
                <span className={`text-sm transition-colors ${selecionado ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                  {cargo}
                </span>
              </button>
            )
          })}
        </div>
        {cargosSelecionados.length > 0 && (
          <p className="text-xs text-brand font-medium mt-4">
            {cargosSelecionados.length} perfil(is) selecionado(s)
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Step 3 — ICP & Sinais ────────────────────────────────────────────────────
function Step3({ form, onChange }: {
  form: FormData
  onChange: (k: keyof FormData, v: string) => void
}) {
  const [gerandoSinais, setGerandoSinais] = useState(false)
  const jaGerouSinais = !!form['gatilhos-customizados']

  async function regerarSinais() {
    setGerandoSinais(true)
    try {
      const res = await claudeApi.sugerirQualificacao({
        empresa: form['empresa-nome'],
        produto: form['prod-nome'],
        segmento: form['empresa-segmento'],
        descricao_empresa: form['empresa-descricao'],
        diferenciais: form['empresa-diferenciais'],
        objecoes_comuns: form['empresa-objecoes-comuns'],
        resultados_clientes: form['prod-resultados'],
        concorrentes: form['prod-concorrentes'],
        descricao_produto: form['prod-descricao'],
        info_adicional: form['prod-info-extra'],
        materiais_conteudo: form['materiais-conteudo'],
        // Etapa 3 — perguntas e objeções já geradas alimentam os sinais
        perguntas: [form['wiz-qualif-q1'], form['wiz-qualif-q2'], form['wiz-qualif-q3']].filter(Boolean).join(' | '),
      })
      const data = res.data as { sinais?: string }
      if (data.sinais) onChange('gatilhos-customizados', data.sinais)
    } catch {
      // silently fail — field stays editable
    } finally {
      setGerandoSinais(false)
    }
  }


  return (
    <div className="flex flex-col gap-6">
      {/* Sinais de compra */}
      <div>
        {/* Banner IA */}
        <div className={`flex items-start justify-between gap-4 p-4 rounded-xl border mb-4 ${jaGerouSinais ? 'border-brand/20 bg-brand/5' : 'border-brand/30 bg-brand/5'}`}>
          <div className="flex items-start gap-3">
            <Brain size={18} className="text-brand mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {gerandoSinais ? 'Gerando sinais...' : jaGerouSinais ? 'Sinais gerados pela IA' : 'Gerar sinais de compra com IA'}
              </p>
              <p className={`text-xs mt-0.5 ${!gerandoSinais && !jaGerouSinais ? 'text-amber-700 font-medium' : 'text-gray-500'}`}>
                {gerandoSinais
                  ? 'Analisando seu produto e segmento para mapear os sinais de compra...'
                  : jaGerouSinais
                  ? 'O agente monitora esses sinais em tempo real durante a ligação para detectar o momento certo de qualificar.'
                  : '⚠️ Antes de gerar, confirme que as etapas anteriores estão completamente preenchidas — cada etapa alimenta a próxima. Quanto mais completo, mais preciso o resultado.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={regerarSinais}
            disabled={gerandoSinais}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 shrink-0 ${jaGerouSinais ? 'text-brand border border-brand/30 hover:bg-brand/10' : 'text-white bg-brand hover:bg-brand/90 border border-brand'}`}
          >
            {gerandoSinais ? <Loader2 size={12} className="animate-spin" /> : jaGerouSinais ? <RefreshCw size={12} /> : <Brain size={12} />}
            {gerandoSinais ? 'Gerando...' : jaGerouSinais ? 'Regerar' : 'Gerar com IA'}
          </button>
        </div>

        <p className="text-sm font-medium text-gray-700 mb-1">Sinais de compra customizados</p>
        <textarea
          id="gatilhos-customizados"
          className={textareaCls}
          rows={3}
          value={form['gatilhos-customizados']}
          onChange={e => onChange('gatilhos-customizados', e.target.value)}
          placeholder={gerandoSinais ? 'Aguardando geração...' : 'Ex: menciona expansão, novo produto, insatisfação com fornecedor atual...'}
          disabled={gerandoSinais}
        />
        <p className="text-xs text-gray-400 mt-1">Quando o agente detectar essas palavras ou contextos, ele vai priorizar a qualificação e transferência.</p>
      </div>

    </div>
  )
}

type ScriptSlot = {
  id: string
  fileName: string | null
  texto: string       // resumo editável (aparece no textarea)
  textoRaw?: string   // texto bruto completo (vai para o prompt final)
  analise: string | null
  extraindo: boolean
  erro: string | null
}

function ScriptSlotCard({
  slot,
  index,
  total,
  onTextoChange,
  onFileSelect,
  onRemoverArquivo,
  onRemoverSlot,
}: {
  slot: ScriptSlot
  index: number
  total: number
  onTextoChange: (id: string, texto: string) => void
  onFileSelect: (id: string, file: File) => void
  onRemoverArquivo: (id: string) => void
  onRemoverSlot: (id: string) => void
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Header do slot */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          Script {index + 1}
        </span>
        {total > 1 && (
          <button
            type="button"
            onClick={() => onRemoverSlot(slot.id)}
            className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1"
          >
            <X size={12} /> Remover este script
          </button>
        )}
      </div>

      <div className="p-4 flex flex-col gap-3">
        {/* Zona de upload — só aparece se não tem arquivo */}
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) { onFileSelect(slot.id, f); e.target.value = '' } }}
        />

        {!slot.fileName && !slot.extraindo && (
          <div
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-3 border border-dashed border-gray-300 rounded-lg px-4 py-3 cursor-pointer hover:border-brand-300 hover:bg-brand-50 transition-colors"
          >
            <Upload size={16} className="text-gray-400 shrink-0" />
            <div>
              <p className="text-sm text-gray-600 font-medium">Enviar arquivo (opcional)</p>
              <p className="text-xs text-gray-400">PDF, Word ou TXT — máx. 25MB</p>
            </div>
          </div>
        )}

        {slot.extraindo && (
          <div className="flex items-center gap-3 bg-brand-50 border border-brand-200 rounded-lg px-4 py-3">
            <div className="w-4 h-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin shrink-0" />
            <div>
              <p className="text-sm font-medium text-brand-700">Lendo e analisando o arquivo...</p>
              <p className="text-xs text-brand-500">Identificando abertura, perguntas, objeções e técnicas</p>
            </div>
          </div>
        )}

        {/* Card de análise precisa — após extração */}
        {slot.fileName && !slot.extraindo && !slot.erro && slot.texto && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-emerald-100">
              <div className="flex items-center gap-2 min-w-0">
                <Check size={13} className="text-emerald-600 shrink-0" />
                <span className="text-xs font-semibold text-emerald-800 truncate">{slot.fileName}</span>
                <span className="text-xs text-emerald-500 shrink-0">{slot.texto.length.toLocaleString('pt-BR')} caracteres</span>
              </div>
              <button
                type="button"
                onClick={() => onRemoverArquivo(slot.id)}
                className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1 shrink-0 ml-2"
              >
                <X size={11} /> Remover arquivo
              </button>
            </div>
            {slot.analise && (
              <div className="px-3 py-2.5 flex items-start gap-2">
                <Brain size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-emerald-700 mb-1">Análise do sistema:</p>
                  <p className="text-xs text-emerald-700 whitespace-pre-line leading-relaxed">{slot.analise}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {slot.erro && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
            <AlertTriangle size={13} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-red-700 font-medium">{slot.erro}</p>
              <button type="button" onClick={() => onRemoverArquivo(slot.id)} className="text-xs text-red-500 underline mt-0.5">Tentar outro arquivo</button>
            </div>
          </div>
        )}

        {/* Textarea — sempre visível, pré-preenchido se arquivo extraído */}
        <textarea
          rows={slot.fileName && slot.texto ? 5 : 9}
          value={slot.texto}
          onChange={e => onTextoChange(slot.id, e.target.value)}
          placeholder={`Cole o texto do script aqui ou envie um arquivo acima...

Ex: "Olá [Nome], aqui é [Agente] da [Empresa]. Ligando porque vocês [contexto]. Tem 2 minutos?"`}
          className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 resize-none text-gray-700 placeholder:text-gray-300 w-full"
        />
      </div>
    </div>
  )
}

function StepScriptLigacao({ form, onChange, onScriptFilesChange }: {
  form: FormData
  onChange: (k: keyof FormData, v: string) => void
  onScriptFilesChange: (files: File[]) => void
}) {
  const [slots, setSlots] = React.useState<ScriptSlot[]>(() => {
    const raw = form['script-ligacao'] || ''
    if (!raw) return [{ id: '1', fileName: null, texto: '', analise: null, extraindo: false, erro: null }]
    // Restaura slots: extrai fileName do cabeçalho === SCRIPT N (filename) === se disponível
    function parseSlot(part: string, idx: number): ScriptSlot {
      const match = part.match(/^=== SCRIPT \d+(?:\s+\(([^)]+)\))?\s*===\n?/)
      const fileName = match?.[1] || null
      const texto = part.replace(/^=== SCRIPT \d+[^\n]*\n?/, '').trim()
      return { id: (idx + 1).toString(), fileName, texto, analise: null, extraindo: false, erro: null }
    }
    const parts = raw.split(/(?=^=== SCRIPT \d+)/m).filter(Boolean)
    if (parts.length <= 1) {
      const match = raw.match(/^=== SCRIPT 1(?:\s+\(([^)]+)\))?\s*===\n?/)
      const fileName = match?.[1] || null
      const texto = raw.replace(/^=== SCRIPT 1[^\n]*\n?/, '').trim()
      return [{ id: '1', fileName, texto, analise: null, extraindo: false, erro: null }]
    }
    return parts.map((part, i) => parseSlot(part, i))
  })

  // Sincroniza todos os textos dos slots para form['script-ligacao']
  // Usa textoRaw (conteúdo bruto completo) quando disponível — caso contrário usa texto editável
  function syncForm(updatedSlots: ScriptSlot[]) {
    const textos = updatedSlots.map((s, i) => {
      const conteudo = (s.textoRaw || s.texto).trim()
      return updatedSlots.length > 1 && conteudo
        ? `=== SCRIPT ${i + 1}${s.fileName ? ` (${s.fileName})` : ''} ===\n${conteudo}`
        : conteudo
    }).filter(Boolean)
    onChange('script-ligacao', textos.join('\n\n'))

    // Arquivos para upload pós-ativação
    onScriptFilesChange(updatedSlots.map(s => s.fileName).filter(Boolean) as unknown as File[])
  }

  function updateSlot(id: string, patch: Partial<ScriptSlot>) {
    setSlots(prev => {
      const next = prev.map(s => s.id === id ? { ...s, ...patch } : s)
      syncForm(next)
      return next
    })
  }

  async function handleFileSelect(id: string, file: File) {
    updateSlot(id, { fileName: file.name, extraindo: true, erro: null, analise: null })
    try {
      const { data: initData } = await agentesApi.extrairScript(file)

      // Job assíncrono (PDF digitalizado) — polling até concluir
      if (initData.jobId) {
        const data = await pollJobResult(initData.jobId, (elapsed) => {
          updateSlot(id, { analise: `Lendo PDF com IA... ${elapsed}s` })
        })
        updateSlot(id, { texto: data.resumo || data.texto, textoRaw: data.texto, analise: data.resumo || null, extraindo: false })
        return
      }

      // Resposta direta
      if (initData.texto) {
        updateSlot(id, { texto: initData.resumo || initData.texto, textoRaw: initData.texto, analise: initData.resumo || null, extraindo: false })
      } else {
        updateSlot(id, { extraindo: false, erro: 'Não foi possível extrair texto. Verifique se é PDF, Word ou TXT válido.', fileName: null })
      }
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error
        || (err as { message?: string })?.message
        || 'Erro ao processar o arquivo. Cole o texto manualmente.'
      updateSlot(id, { extraindo: false, erro: msg, fileName: null })
    }
  }

  function handleTextoChange(id: string, texto: string) {
    updateSlot(id, { texto })
  }

  function handleRemoverArquivo(id: string) {
    updateSlot(id, { fileName: null, analise: null, erro: null, texto: '' })
  }

  function handleRemoverSlot(id: string) {
    setSlots(prev => {
      const next = prev.filter(s => s.id !== id)
      syncForm(next)
      return next
    })
  }

  function adicionarScript() {
    setSlots(prev => [...prev, {
      id: Date.now().toString(),
      fileName: null, texto: '', analise: null, extraindo: false, erro: null
    }])
  }

  const totalCaracteres = slots.reduce((acc, s) => acc + s.texto.length, 0)

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center shrink-0 mt-0.5">
          <FileText size={18} className="text-brand-600" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900">Roteiros de ligação</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Adicione um ou mais scripts. Quanto mais material, mais preciso o agente — o sistema lê cada arquivo, identifica abertura, perguntas, objeções e técnicas, e injeta tudo no prompt final.
          </p>
        </div>
      </div>

      {/* Slots */}
      {slots.map((slot, index) => (
        <ScriptSlotCard
          key={slot.id}
          slot={slot}
          index={index}
          total={slots.length}
          onTextoChange={handleTextoChange}
          onFileSelect={handleFileSelect}
          onRemoverArquivo={handleRemoverArquivo}
          onRemoverSlot={handleRemoverSlot}
        />
      ))}

      {/* Adicionar mais */}
      <button
        type="button"
        onClick={adicionarScript}
        className="flex items-center justify-center gap-2 border-2 border-dashed border-brand-200 rounded-xl py-3 text-sm font-medium text-brand-600 hover:bg-brand-50 hover:border-brand-300 transition-colors"
      >
        <Plus size={16} /> Adicionar outro script
      </button>

      {/* Rodapé — total */}
      {totalCaracteres > 0 && (
        <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
          <Check size={12} />
          <span>
            <span className="font-semibold">{totalCaracteres.toLocaleString('pt-BR')} caracteres</span> de roteiro identificados — tudo vai para o prompt final do agente
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Step 5 — Cenário & Dores ─────────────────────────────────────────────────
function StepCenarioDores({ form, onChange }: {
  form: FormData
  onChange: (k: keyof FormData, v: string) => void
}) {
  const [gerando, setGerando] = useState(false)
  const [erroGeracao, setErroGeracao] = useState('')
  const jaGerou = !!form['cenario-dores']

  async function sugerir() {
    setGerando(true)
    setErroGeracao('')
    try {
      const res = await claudeApi.sugerirCenarioDores({
        empresa: form['empresa-nome'],
        produto: form['prod-nome'],
        segmento: form['empresa-segmento'],
        descricao_empresa: form['empresa-descricao'],
        diferenciais: form['empresa-diferenciais'],
        objecoes_comuns: form['empresa-objecoes-comuns'],
        contexto_mercado: form['empresa-contexto-mercado'],
        resultados_clientes: form['prod-resultados'],
        concorrentes: form['prod-concorrentes'],
        descricao_produto: form['prod-descricao'],
        info_adicional: form['prod-info-extra'],
        cargos_alvo: form['icp-cargo-tipo'],
        sinais: form['gatilhos-customizados'],
        perguntas: [form['wiz-qualif-q1'], form['wiz-qualif-q2'], form['wiz-qualif-q3']].filter(Boolean).join(' | '),
        materiais_conteudo: form['materiais-conteudo'],
      })
      const data = res.data as { cenario: string }
      if (data.cenario) onChange('cenario-dores', data.cenario)
    } catch {
      setErroGeracao('Não foi possível gerar o cenário. Descreva manualmente.')
    } finally {
      setGerando(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Banner IA */}
      <div className={`flex items-start justify-between gap-4 p-4 rounded-xl border ${jaGerou ? 'border-brand/20 bg-brand/5' : 'border-brand/30 bg-brand/5'}`}>
        <div className="flex items-start gap-3">
          <Brain size={18} className="text-brand mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {gerando ? 'Analisando o cenário...' : jaGerou ? 'Contexto gerado pela IA' : 'Gerar cenário de dores com IA'}
            </p>
            <p className={`text-xs mt-0.5 ${!gerando && !jaGerou ? 'text-amber-700 font-medium' : 'text-gray-500'}`}>
              {gerando
                ? 'Mapeando as dores do seu público com base nas etapas anteriores...'
                : jaGerou
                ? 'Descreve as dores reais do seu mercado. O agente usa esse contexto para criar empatia e rapport na ligação.'
                : '⚠️ Antes de gerar, confirme que as etapas anteriores estão completamente preenchidas — cada etapa alimenta a próxima. Quanto mais completo, mais preciso o resultado.'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={sugerir}
          disabled={gerando}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 shrink-0 ${jaGerou ? 'text-brand border border-brand/30 hover:bg-brand/10' : 'text-white bg-brand hover:bg-brand/90 border border-brand'}`}
        >
          {gerando ? <Loader2 size={12} className="animate-spin" /> : jaGerou ? <RefreshCw size={12} /> : <Brain size={12} />}
          {gerando ? 'Gerando...' : jaGerou ? 'Regerar' : 'Gerar com IA'}
        </button>
      </div>

      {erroGeracao && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{erroGeracao}</p>
      )}

      <div>
        <p className="text-sm font-medium text-gray-700 mb-1">Contexto e dores do mercado</p>
        <p className="text-xs text-gray-400 mb-3">
          O agente usa esse texto para criar conexão com o prospect — mostrando que entende a realidade do negócio dele antes de apresentar a solução.
        </p>
        <textarea
          className={textareaCls}
          rows={10}
          value={form['cenario-dores']}
          onChange={e => onChange('cenario-dores', e.target.value)}
          placeholder={gerando ? 'Aguardando geração...' : 'Descreva o cenário e as dores do público-alvo...'}
          disabled={gerando}
        />
      </div>
    </div>
  )
}

function StepMetodologia({ form, onChange }: { form: FormData; onChange: (k: keyof FormData, v: string) => void }) {
  const selecionada = METODOLOGIAS.find(m => m.id === form.metodologia)
  return (
    <div className="flex flex-col gap-5">
      {/* Contexto */}
      <div className="p-4 rounded-xl border border-brand/20 bg-brand/5 flex items-start gap-3">
        <Brain size={17} className="text-brand mt-0.5 shrink-0" />
        <p className="text-xs text-gray-600 leading-relaxed">
          A metodologia define <strong>como o agente conduz a conversa</strong> — a ordem das perguntas, o ritmo e o momento de propor a reunião. Ela é incorporada ao prompt final e influencia cada ligação.
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 gap-3">
        {METODOLOGIAS.map(m => {
          const ativo = form.metodologia === m.id
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onChange('metodologia', m.id)}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                ativo
                  ? 'border-brand bg-brand/5 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-bold text-sm ${ativo ? 'text-brand' : 'text-gray-900'}`}>{m.label}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ativo ? 'bg-brand text-white' : 'bg-gray-100 text-gray-500'}`}>{m.tagline}</span>
                    {m.recomendado && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Recomendado</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed mb-2">{m.descricao}</p>
                  <div className="flex flex-col gap-1">
                    <p className="text-[11px] text-gray-400"><span className="font-medium text-gray-500">Melhor para:</span> {m.melhorPara}</p>
                    <p className="text-[11px] text-gray-400 italic"><span className="font-medium not-italic text-gray-500">Exemplo de fala:</span> {m.exemplo}</p>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                  ativo ? 'border-brand bg-brand' : 'border-gray-300'
                }`}>
                  {ativo && <Check size={11} strokeWidth={3} className="text-white" />}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Resumo da seleção */}
      {selecionada && (
        <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
          <p className="text-xs text-gray-500">
            <span className="font-semibold text-gray-700">Metodologia selecionada: {selecionada.label}</span>
            {' '}— o agente vai {selecionada.id === 'consultivo' ? 'descobrir necessidades com perguntas antes de propor a reunião' :
              selecionada.id === 'spin' ? 'guiar o prospect pela sequência Situação → Problema → Implicação → Necessidade' :
              selecionada.id === 'bant' ? 'qualificar Budget, Authority, Need e Timeline logo nos primeiros minutos' :
              'apresentar a proposta de valor diretamente e pedir a reunião sem longas qualificações'}.
          </p>
        </div>
      )}
    </div>
  )
}

interface LigacaoRef {
  file: File | null
  resultado: 'sucesso' | 'insucesso'
  transcricao: string
  resumo: string | null
  transcrevendo: boolean
  erro: string | null
}

function LigacoesSection({
  tipo, items, onChange, form,
}: {
  tipo: 'sucesso' | 'insucesso'
  items: LigacaoRef[]
  onChange: (items: LigacaoRef[]) => void
  form: FormData
}) {
  const refs = React.useRef<(HTMLInputElement | null)[]>([])
  const itemsRef = React.useRef(items)
  React.useEffect(() => { itemsRef.current = items }, [items])
  const isSucesso = tipo === 'sucesso'

  const colors = isSucesso
    ? { dot: 'bg-emerald-500', label: 'text-emerald-700', dashedBorder: 'border-emerald-300', dashedHover: 'hover:border-emerald-400 hover:bg-emerald-50', uploadIcon: 'text-emerald-400', uploadText: 'text-emerald-700', uploadSub: 'text-emerald-500', cardBg: 'bg-emerald-50 border-emerald-200', cardText: 'text-emerald-800', cardSub: 'text-emerald-500', addBtn: 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300', spinnerBorder: 'border-emerald-400' }
    : { dot: 'bg-amber-500', label: 'text-amber-700', dashedBorder: 'border-amber-300', dashedHover: 'hover:border-amber-400 hover:bg-amber-50', uploadIcon: 'text-amber-400', uploadText: 'text-amber-700', uploadSub: 'text-amber-500', cardBg: 'bg-amber-50 border-amber-200', cardText: 'text-amber-800', cardSub: 'text-amber-500', addBtn: 'border-amber-200 text-amber-700 hover:bg-amber-50 hover:border-amber-300', spinnerBorder: 'border-amber-400' }

  const emptyItem = (): LigacaoRef => ({ file: null, resultado: tipo, transcricao: '', resumo: null, transcrevendo: false, erro: null })

  function update(i: number, patch: Partial<LigacaoRef>) {
    onChange(itemsRef.current.map((m, idx) => idx === i ? { ...m, ...patch } : m))
  }
  function addLinha() { onChange([...items, emptyItem()]) }
  function removeLinha(i: number) {
    if (items.length === 1) { onChange([emptyItem()]); return }
    onChange(items.filter((_, idx) => idx !== i))
  }

  async function handleFileSelect(i: number, file: File) {
    update(i, { file, transcrevendo: true, erro: null, transcricao: '', resumo: null })
    try {
      const ctx = {
        empresa:   form['empresa-nome']     || '',
        segmento:  form['empresa-segmento'] || '',
        produto:   form['prod-nome']        || '',
        icp_cargo: form['icp-cargo-tipo']   || '',
      }
      const { data } = await agentesApi.transcreverLigacao(file, tipo, undefined, ctx)
      update(i, { transcrevendo: false, transcricao: data.transcricao || '', resumo: data.resumo || null })
    } catch {
      update(i, { transcrevendo: false, erro: 'Não foi possível transcrever o áudio. Verifique o formato e tente novamente.', file: null })
    }
  }

  const tituloSecao = isSucesso
    ? 'Ligações que converteram — o agente aprende o que funciona'
    : 'Ligações que não converteram — o agente aprende o que evitar'
  const descSecao = isSucesso
    ? 'Suba gravações onde o cliente aceitou a reunião. O agente estuda o tom, o ritmo e os argumentos que levaram ao "sim".'
    : 'Suba gravações onde o cliente recusou. O agente identifica padrões a evitar e objeções a contornar.'
  const labelGravacao = isSucesso ? 'GRAVAÇÃO DE SUCESSO' : 'GRAVAÇÃO DE REFERÊNCIA'
  const uploadLabel = isSucesso ? 'Enviar gravação — ligação que converteu' : 'Enviar gravação — ligação que não converteu'
  const addLabel = isSucesso ? 'Adicionar outra ligação de sucesso' : 'Adicionar outra ligação de referência'

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className={`text-sm font-semibold uppercase tracking-wide flex items-center gap-2 ${colors.label}`}>
          <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${colors.dot}`} />
          {tituloSecao}
        </p>
        <p className="text-xs text-gray-500 mt-1">{descSecao}</p>
      </div>

      <div className="flex flex-col gap-3">
        {items.map((m, i) => (
          <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                {labelGravacao}{items.length > 1 ? ` ${i + 1}` : ''}
              </span>
              {items.length > 1 && (
                <button type="button" onClick={() => removeLinha(i)}
                  className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1">
                  <X size={12} /> Remover
                </button>
              )}
            </div>

            <div className="p-4 flex flex-col gap-3">
              <input ref={el => { refs.current[i] = el }} type="file"
                accept=".mp3,.wav,.m4a,.mp4,.ogg,.webm" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(i, f); e.target.value = '' }} />

              {/* Zona de upload */}
              {!m.file && !m.transcrevendo && (
                <div onClick={() => refs.current[i]?.click()}
                  className={`flex items-center gap-3 border border-dashed ${colors.dashedBorder} rounded-lg px-4 py-3 cursor-pointer transition-colors ${colors.dashedHover}`}>
                  <Mic size={16} className={`shrink-0 ${colors.uploadIcon}`} />
                  <div>
                    <p className={`text-sm font-medium ${colors.uploadText}`}>{uploadLabel}</p>
                    <p className={`text-xs ${colors.uploadSub}`}>MP3, WAV, M4A ou MP4 — máx. 50MB</p>
                  </div>
                </div>
              )}

              {/* Transcrevendo */}
              {m.transcrevendo && (
                <div className="flex items-center gap-3 bg-brand-50 border border-brand-200 rounded-lg px-4 py-3">
                  <div className={`w-4 h-4 border-2 ${colors.spinnerBorder} border-t-transparent rounded-full animate-spin shrink-0`} />
                  <div>
                    <p className="text-sm font-medium text-brand-700">Analisando ligação real...</p>
                    <p className="text-xs text-brand-500">Whisper transcreve o áudio · IA extrai os padrões específicos para o seu mercado</p>
                  </div>
                </div>
              )}

              {/* Card de sucesso após transcrição */}
              {m.file && !m.transcrevendo && !m.erro && (
                <div className={`border ${colors.cardBg} rounded-lg overflow-hidden`}>
                  <div className="flex items-center justify-between px-3 py-2 border-b border-opacity-50 ${isSucesso ? 'border-emerald-100' : 'border-amber-100'}">
                    <div className="flex items-center gap-2 min-w-0">
                      <Check size={13} className={`shrink-0 ${isSucesso ? 'text-emerald-600' : 'text-amber-600'}`} />
                      <span className={`text-xs font-semibold truncate ${colors.cardText}`}>{m.file.name}</span>
                      <span className={`text-xs shrink-0 ${colors.cardSub}`}>{m.transcricao.length.toLocaleString('pt-BR')} chars transcritos</span>
                    </div>
                    <button type="button" onClick={() => update(i, { file: null, transcricao: '', resumo: null, erro: null })}
                      className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1 shrink-0 ml-2">
                      <X size={11} /> Remover
                    </button>
                  </div>
                  {m.resumo && (
                    <div className="px-3 py-2.5 flex items-start gap-2">
                      <Brain size={13} className={`shrink-0 mt-0.5 ${isSucesso ? 'text-emerald-600' : 'text-amber-600'}`} />
                      <div className="flex-1">
                        <p className={`text-xs font-semibold mb-1 ${colors.cardText}`}>
                          Padrões extraídos — injetados no prompt final do agente:
                        </p>
                        <p className={`text-xs leading-relaxed ${colors.cardText}`}>{m.resumo}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Textarea editável — aparece após transcrição, igual ao padrão das outras etapas */}
              {m.file && !m.transcrevendo && !m.erro && m.resumo && (
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">Aprendizados — editável pelo agente:</p>
                  <textarea
                    rows={4}
                    value={m.resumo}
                    onChange={e => update(i, { resumo: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 bg-white"
                    placeholder="Edite os aprendizados extraídos se necessário..."
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Este texto vai direto para o prompt final — edite para corrigir ou complementar.</p>
                </div>
              )}

              {/* Erro */}
              {m.erro && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                  <AlertTriangle size={13} className="text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-red-700 font-medium">{m.erro}</p>
                    <button type="button" onClick={() => update(i, { erro: null })}
                      className="text-xs text-red-500 underline mt-0.5">Tentar outro arquivo</button>
                  </div>
                </div>
              )}

            </div>
          </div>
        ))}
      </div>

      <button type="button" onClick={addLinha}
        className={`flex items-center justify-center gap-2 border-2 border-dashed rounded-xl py-3 text-sm font-medium transition-colors ${colors.addBtn}`}>
        <Plus size={16} /> {addLabel}
      </button>
    </div>
  )
}

function StepLigacoesReferencia({
  ligacoesSucesso, onSucessoChange,
  ligacoesInsucesso, onInsucessoChange,
  form,
}: {
  ligacoesSucesso: LigacaoRef[]; onSucessoChange: (l: LigacaoRef[]) => void
  ligacoesInsucesso: LigacaoRef[]; onInsucessoChange: (l: LigacaoRef[]) => void
  form: FormData
}) {
  const totalCarregadas = [
    ...ligacoesSucesso.filter(l => l.resumo),
    ...ligacoesInsucesso.filter(l => l.resumo),
  ].length

  return (
    <div className="flex flex-col gap-7">
      {/* Banner principal */}
      <div className="bg-gradient-to-br from-violet-50 to-brand-50 border border-violet-200 rounded-xl px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0 mt-0.5">
            <Brain size={16} className="text-violet-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-violet-900 mb-1">Ligações reais — o dado que nenhuma IA consegue fabricar</p>
            <p className="text-xs text-violet-700 leading-relaxed">
              Cada gravação é transcrita pelo Whisper e analisada por IA com o contexto da sua empresa, produto e ICP. Os padrões reais — o vocabulário que converte, o ritmo, as objeções deste mercado — são injetados diretamente no prompt final. Seu agente nasce sabendo o que funciona aqui, não o que funciona em geral.
            </p>
          </div>
        </div>
        {totalCarregadas > 0 && (
          <div className="mt-3 pt-3 border-t border-violet-200 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-xs font-semibold text-violet-800">
              {totalCarregadas} ligação{totalCarregadas > 1 ? 'ões' : ''} analisada{totalCarregadas > 1 ? 's' : ''} — padrões reais já incorporados ao agente
            </p>
          </div>
        )}
      </div>

      {/* Sucesso */}
      <LigacoesSection tipo="sucesso" items={ligacoesSucesso} onChange={onSucessoChange} form={form} />

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* Insucesso */}
      <LigacoesSection tipo="insucesso" items={ligacoesInsucesso} onChange={onInsucessoChange} form={form} />

      {/* Como o sistema usa */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5">
        <p className="text-xs font-semibold text-gray-700 mb-2.5">Como o agente usa essas gravações</p>
        <ul className="space-y-1.5">
          {[
            { icon: <Check size={11} className="text-emerald-500 shrink-0 mt-0.5" />, text: 'Ligações de sucesso: o agente replica o flow, o tom, o vocabulário e os argumentos que levaram ao sim' },
            { icon: <Check size={11} className="text-amber-500 shrink-0 mt-0.5" />, text: 'Ligações de referência: o agente aprende quais padrões geram resistência e como contornar objeções reais' },
            { icon: <Check size={11} className="text-violet-500 shrink-0 mt-0.5" />, text: 'A IA analisa com o contexto da sua empresa — os aprendizados são específicos para o seu mercado, não genéricos' },
            { icon: <Check size={11} className="text-brand-500 shrink-0 mt-0.5" />, text: 'Todas as transcrições ficam no Centro de Inteligência para ajuste fino contínuo após o agente entrar em produção' },
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
              {item.icon} {item.text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

const TOM_ICONS: Record<string, React.ReactNode> = {
  profissional: <Briefcase size={15} />,
  consultivo:   <Brain size={15} />,
  direto:       <Zap size={15} />,
  amigavel:     <Heart size={15} />,
}

function StepVozTom({ form, onChange }: { form: FormData; onChange: (k: keyof FormData, v: string) => void }) {
  return (
    <div className="flex flex-col gap-8">
      <VozSelector form={form} onChange={onChange} />

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-brand rounded-full" />
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tom de comunicação</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {TONS_CARDS.map(t => {
            const selecionado = form.tom === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onChange('tom', t.id)}
                className={`text-left px-4 py-3.5 rounded-xl border-2 transition-all flex items-start gap-3 ${
                  selecionado
                    ? 'border-brand bg-brand-50'
                    : 'border-gray-200 bg-white hover:border-brand-200 hover:bg-gray-50'
                }`}
              >
                <div className={`mt-0.5 shrink-0 ${selecionado ? 'text-brand-600' : 'text-gray-400'}`}>
                  {TOM_ICONS[t.id]}
                </div>
                <div>
                  <p className={`font-semibold text-sm ${selecionado ? 'text-brand-800' : 'text-gray-900'}`}>
                    {t.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{t.descricao}</p>
                </div>
                {selecionado && (
                  <div className="ml-auto shrink-0 w-4 h-4 rounded-full bg-brand flex items-center justify-center">
                    <Check size={9} className="text-white" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}


function StepCalibracaoVoz({
  form, onChange, objecoes, perguntas, ligSucesso, ligInsucesso, abordagens, objecoesCanal,
}: {
  form: FormData
  onChange: (k: keyof FormData, v: string) => void
  objecoes: Objecao[]
  perguntas: string[]
  ligSucesso: LigacaoRef[]
  ligInsucesso: LigacaoRef[]
  abordagens: Abordagem[]
  objecoesCanal: ObjecaoCanal[]
}) {
  const [gerando, setGerando] = useState(false)
  const [erroGeracao, setErroGeracao] = useState<string | null>(null)
  const jaGerou = form['voz-pronuncia'] || form['voz-termos-tecnicos'] || form['voz-ritmo-tom'] || form['voz-palavras-proibidas']

  async function sugerir() {
    setGerando(true)
    setErroGeracao(null)
    try {
      const objecoesTexto = objecoes
        .filter(o => o.objecao)
        .map(o => `• ${o.objecao}${o.rebuttal ? ` → ${o.rebuttal}` : ''}`)
        .join('\n')

      const res = await claudeApi.sugerirCalibracaoVoz({
        // Etapa 1
        objetivo: form['objetivo'],
        nome_agente: form['nome-agente'],
        // Etapa 2 — Empresa & Produto
        empresa: form['empresa-nome'],
        segmento: form['empresa-segmento'],
        porte: form['empresa-porte'],
        descricao_empresa: form['empresa-descricao'],
        diferenciais: form['empresa-diferenciais'],
        objecoes_comuns: form['empresa-objecoes-comuns'],
        contexto_mercado: form['empresa-contexto-mercado'],
        produto: form['prod-nome'],
        descricao_produto: form['prod-descricao'],
        resultados_clientes: form['prod-resultados'],
        concorrentes: form['prod-concorrentes'],
        info_adicional: form['prod-info-extra'],
        materiais_conteudo: form['materiais-conteudo'],
        // Etapa 3 — Qualificação & Objeções
        perguntas_qualificacao: perguntas.filter(Boolean).join('\n'),
        objecoes_texto: objecoesTexto,
        // Etapa 4 — Sinais de compra
        sinais_compra: form['gatilhos-customizados'],
        // Etapa 5 — ICP + Cenário & Dores
        icp_cargo: form['icp-cargo-tipo'],
        icp_porte: form['icp-porte-alvo'],
        icp_segmento: form['icp-segmento-alvo'],
        cenario_dores: form['cenario-dores'],
        // Etapa 6 — Gatilhos de fechamento
        gatilhos_fechamento: form['gatilhos-fechamento'],
        // Etapa 10 — Voz e Tom
        voz: form['voz'],
        tom: form['tom'],
        // Etapa 8 — Script de abertura
        script_abertura: form['script-abertura'],
        // Etapa 9 — Scripts (ligações reais)
        script_ligacao: form['script-ligacao'],
        // Etapa 7 — Metodologia
        metodologia: form['metodologia'],
        // Etapas 11/12 — Agendamento
        agendamento_estrategia: form['agendamento-estrategia'],
        agendamento_tom: form['agendamento-tom'],
        agendamento_duracao: form['agendamento-duracao'],
        agendamento_recusa: form['agendamento-recusa'],
        // Step 11 — Ligações de referência (resumos extraídos pela IA)
        ligacoes_sucesso_resumos: ligSucesso.filter(l => l.resumo).map(l => l.resumo).join('\n---\n'),
        ligacoes_insucesso_resumos: ligInsucesso.filter(l => l.resumo).map(l => l.resumo).join('\n---\n'),
        // Step 4/5 — Abordagens aprovadas + objeções de canal com rebuttals
        abordagens_contexto: abordagens.filter(a => a.selecionada && a.texto.trim()).map(a => a.texto).join(' | '),
        objecoes_canal_contexto: objecoesCanal.filter(o => o.objecao && o.rebuttal).map(o => `"${o.objecao}" → "${o.rebuttal}"`).join('\n'),
      })
      const data = res.data as { pronuncia?: string; termos_tecnicos?: string; ritmo_tom?: string; palavras_proibidas?: string }
      if (data.pronuncia) onChange('voz-pronuncia', data.pronuncia)
      if (data.termos_tecnicos) onChange('voz-termos-tecnicos', data.termos_tecnicos)
      if (data.ritmo_tom) onChange('voz-ritmo-tom', data.ritmo_tom)
      if (data.palavras_proibidas) onChange('voz-palavras-proibidas', data.palavras_proibidas)
    } catch {
      setErroGeracao('Não foi possível gerar as sugestões. Tente novamente.')
    } finally {
      setGerando(false)
    }
  }

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 bg-white'
  const textareaCls = inputCls + ' resize-none'
  return (
    <div className="space-y-5">
      {/* Banner Gerar com IA */}
      <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
            <Brain size={16} className="text-violet-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-violet-900 mb-0.5">Calibração inteligente com IA</p>
            <p className="text-xs text-violet-700 leading-relaxed">A IA vai analisar tudo que foi preenchido nas etapas anteriores — empresa, produto, ICP, scripts, roteiros e metodologia — para gerar a calibração ideal para o seu agente.</p>
          </div>
          <button
            type="button"
            onClick={sugerir}
            disabled={gerando}
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-xs font-semibold rounded-lg hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            {gerando ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Brain size={13} />
                {jaGerou ? 'Regerar com IA' : 'Gerar com IA'}
              </>
            )}
          </button>
        </div>
        {erroGeracao && (
          <div className="mt-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <AlertCircle size={13} className="shrink-0" />
            {erroGeracao}
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
            <Mic size={18} className="text-violet-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Calibração de Voz</h3>
            <p className="text-xs text-gray-500">Como o agente deve soar ao falar com seus prospects</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Pronúncia do nome da empresa / produto <span className="text-gray-400 font-normal">(opcional)</span></label>
            <input className={inputCls} value={form['voz-pronuncia']} onChange={e => onChange('voz-pronuncia', e.target.value)} placeholder='Ex: "ETZ se pronuncia É-TÊ-ZÊ" ou "Cimed = CI-MED, não SIMED"' />
            <p className="text-[10px] text-gray-400 mt-1">Se o agente vai pronunciar o nome errado, corrija aqui.</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Termos técnicos do seu segmento <span className="text-gray-400 font-normal">(opcional)</span></label>
            <textarea className={textareaCls} rows={3} value={form['voz-termos-tecnicos']} onChange={e => onChange('voz-termos-tecnicos', e.target.value)} placeholder={'Ex: CRM, NPS, churn, SLA — liste os termos que o agente vai usar'} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Ritmo e tom ideal para seu público <span className="text-gray-400 font-normal">(opcional)</span></label>
            <textarea className={textareaCls} rows={2} value={form['voz-ritmo-tom']} onChange={e => onChange('voz-ritmo-tom', e.target.value)} placeholder={'Ex: "Público conservador — falar devagar e formal" ou "Público jovem — tom descontraído"'} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Palavras que o agente NUNCA deve usar <span className="text-gray-400 font-normal">(opcional)</span></label>
            <textarea className={textareaCls} rows={2} value={form['voz-palavras-proibidas']} onChange={e => onChange('voz-palavras-proibidas', e.target.value)} placeholder={'Ex: "parceiro", "solução", "inovador" — expressões artificiais para o seu mercado'} />
          </div>
        </div>
      </div>
      <div className="bg-violet-50 border border-violet-100 rounded-xl p-4">
        <p className="text-xs text-violet-700"><strong>Esses dados enriquecem a seção VOZ E DICÇÃO do prompt final.</strong> Quanto mais específico, mais natural o agente vai soar.</p>
      </div>
    </div>
  )
}

// ─── Step Agendamento ─────────────────────────────────────────────────────────
function StepAgendamento({ form, onChange }: {
  form: FormData
  onChange: (k: keyof FormData, v: string) => void
}) {
  function OptionCard({ field, value, label, desc }: { field: keyof FormData; value: string; label: string; desc: string }) {
    const selected = form[field] === value
    return (
      <button
        type="button"
        onClick={() => onChange(field, value)}
        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${selected ? 'border-brand bg-brand/5' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
      >
        <p className={`text-sm font-semibold ${selected ? 'text-brand' : 'text-gray-800'}`}>{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-7">
      <div>
        <p className="text-sm font-semibold text-gray-800 mb-1">Estratégia de datas</p>
        <p className="text-xs text-gray-500 mb-3">Como o agente vai propor os horários ao prospect?</p>
        <div className="grid grid-cols-2 gap-3">
          <OptionCard field="agendamento-estrategia" value="proximas" label="🚀 Datas próximas" desc="Oferece os slots mais cedo disponíveis — cria senso de oportunidade imediata" />
          <OptionCard field="agendamento-estrategia" value="flexiveis" label="📅 Datas flexíveis" desc="Oferece opções para a próxima semana — perfil mais consultivo e sem pressão" />
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-800 mb-1">Antecedência mínima para agendamento</p>
        <p className="text-xs text-gray-500 mb-3">O agente nunca vai oferecer um horário mais cedo que isso</p>
        <div className="grid grid-cols-4 gap-2">
          {[['24h', '24 horas'], ['48h', '48 horas'], ['72h', '72 horas'], ['1semana', '1 semana']].map(([v, l]) => (
            <button key={v} type="button" onClick={() => onChange('agendamento-antecedencia', v)}
              className={`py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${form['agendamento-antecedencia'] === v ? 'border-brand bg-brand/5 text-brand' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-800 mb-1">Quantas opções de horário oferecer</p>
        <p className="text-xs text-gray-500 mb-3">Mais opções dão flexibilidade; menos opções facilitam a decisão</p>
        <div className="grid grid-cols-2 gap-3">
          <OptionCard field="agendamento-opcoes" value="2" label="2 opções" desc="Ex: 'Tenho terça às 14h ou quinta às 10h, qual prefere?'" />
          <OptionCard field="agendamento-opcoes" value="3" label="3 opções" desc="Ex: 'Tenho segunda, quarta ou sexta — qual encaixa melhor?'" />
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-800 mb-1">Tom ao oferecer o agendamento</p>
        <div className="grid grid-cols-2 gap-3">
          <OptionCard field="agendamento-tom" value="direto" label="⚡ Direto" desc="'Tenho X ou Y — qual prefere?' — fecha rápido, menos debate" />
          <OptionCard field="agendamento-tom" value="consultivo" label="🤝 Consultivo" desc="'Quando costuma ter mais disponibilidade?' — mais personalizado" />
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-800 mb-1">Duração da reunião</p>
        <p className="text-xs text-gray-500 mb-3">O agente informa o prospect quanto tempo vai durar</p>
        <div className="grid grid-cols-4 gap-2">
          {[['15', '15 min'], ['30', '30 min'], ['45', '45 min'], ['60', '1 hora']].map(([v, l]) => (
            <button key={v} type="button" onClick={() => onChange('agendamento-duracao', v)}
              className={`py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${form['agendamento-duracao'] === v ? 'border-brand bg-brand/5 text-brand' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-800 mb-1">Apresentar o vendedor ao agendar</p>
        <p className="text-xs text-gray-500 mb-3">O agente menciona o nome e especialidade do vendedor antes da reunião?</p>
        <div className="grid grid-cols-2 gap-3">
          <OptionCard field="agendamento-apresentar-vendedor" value="sim" label="✅ Sim, apresentar" desc="'Você vai falar com {{vendedor_nome}}, nosso especialista em [segmento]'" />
          <OptionCard field="agendamento-apresentar-vendedor" value="nao" label="Não mencionar" desc="Agenda direto sem apresentar — mais neutro e objetivo" />
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-800 mb-1">Se o prospect recusar a agenda</p>
        <p className="text-xs text-gray-500 mb-3">O que o agente faz quando o prospect diz que não tem tempo agora?</p>
        <div className="flex flex-col gap-2">
          <OptionCard field="agendamento-recusa" value="reoferta" label="🔄 Reoferta em outro momento" desc="Propõe uma data diferente — 'E semana que vem, como fica?'" />
          <OptionCard field="agendamento-recusa" value="perguntar" label="❓ Pergunta quando seria melhor" desc="'Quando seria uma boa semana para você? Posso reservar o horário'" />
          <OptionCard field="agendamento-recusa" value="followup" label="📋 Encerra e agenda follow-up" desc="Agradece, encerra a ligação e cria tarefa de retorno" />
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-800 mb-1">Criar senso de urgência para confirmar</p>
        <p className="text-xs text-gray-500 mb-3">O agente adiciona contexto de escassez natural para aumentar comprometimento?</p>
        <div className="grid grid-cols-2 gap-3">
          <OptionCard field="agendamento-urgencia" value="sim" label="✅ Sim, criar urgência" desc="'Esses horários costumam preencher rápido essa semana'" />
          <OptionCard field="agendamento-urgencia" value="nao" label="Não, manter neutro" desc="Oferece as opções sem pressão adicional" />
        </div>
      </div>
    </div>
  )
}

// ─── StepAbordagensAbertura ───────────────────────────────────────────────────
function StepAbordagensAbertura({
  form,
  abordagens,
  onAbordagensChange,
  objecoes,
  perguntas,
}: {
  form: FormData
  abordagens: Abordagem[]
  onAbordagensChange: (a: Abordagem[]) => void
  objecoes: Objecao[]
  perguntas: string[]
}) {
  const [gerando, setGerando] = useState(false)
  const [erroGeracao, setErroGeracao] = useState('')

  const jaGerou = abordagens.some(a => a.texto.trim())
  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 bg-white'

  async function gerar() {
    setGerando(true)
    setErroGeracao('')
    try {
      const res = await claudeApi.sugerirAbordagens({
        empresa: form['empresa-nome'],
        segmento: form['empresa-segmento'],
        porte: form['empresa-porte'],
        descricao_empresa: form['empresa-descricao'],
        diferenciais: form['empresa-diferenciais'],
        objecoes_comuns: form['empresa-objecoes-comuns'],
        contexto_mercado: form['empresa-contexto-mercado'],
        produto: form['prod-nome'],
        descricao_produto: form['prod-descricao'],
        resultados_clientes: form['prod-resultados'],
        concorrentes: form['prod-concorrentes'],
        info_adicional: form['prod-info-extra'],
        objetivo: form['objetivo'],
        // Step 3 — ICP + sinais de compra
        icp_cargo: form['icp-cargo-tipo'],
        icp_porte: form['icp-porte-alvo'],
        icp_segmento: form['icp-segmento-alvo'],
        sinais_compra: form['gatilhos-customizados'],
        perguntas_qualificacao: perguntas.filter(Boolean).join(' | '),
        objecoes_valor: objecoes.map(o => `"${o.objecao}" → "${o.rebuttal}"`).filter(Boolean).join('\n'),
        script_abertura: form['script-abertura'],
        materiais_conteudo: form['materiais-conteudo'],
      })
      const novas: Abordagem[] = (res.data.abordagens || []).map((a: { id: string; tipo: string; texto: string }) => ({
        ...a,
        selecionada: true,
      }))
      onAbordagensChange(novas)
    } catch (e) {
      const err = e as { response?: { data?: { error?: string } }; message?: string }
      setErroGeracao(err?.response?.data?.error || err?.message || 'Erro ao gerar abordagens.')
    } finally {
      setGerando(false)
    }
  }

  function adicionar() {
    const novoId = String(Date.now())
    onAbordagensChange([...abordagens, { id: novoId, tipo: 'personalizado', texto: '', selecionada: true }])
  }

  function remover(id: string) {
    if (abordagens.length > 1) onAbordagensChange(abordagens.filter(a => a.id !== id))
  }

  const TIPO_LABEL: Record<string, string> = {
    risco_invisivel: 'Risco Invisível',
    custo_reducao: 'Custo / Redução',
    caso_real: 'Caso Real',
    contexto_mercado: 'Contexto do Mercado',
    diagnostico: 'Diagnóstico',
    personalizado: '',
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Banner — padrão idêntico ao StepQualificacao */}
      <div className={`flex items-start justify-between gap-4 p-4 rounded-xl border ${jaGerou ? 'border-brand/20 bg-brand/5' : 'border-brand/30 bg-brand/5'}`}>
        <div className="flex items-start gap-3">
          <Brain size={18} className="text-brand mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {gerando ? 'Gerando abordagens...' : jaGerou ? 'Abordagens geradas pela IA' : 'Gerar abordagens de abertura com IA'}
            </p>
            <p className={`text-xs mt-0.5 ${!gerando && !jaGerou ? 'text-amber-700 font-medium' : 'text-gray-500'}`}>
              {gerando
                ? 'Analisando empresa, produto e qualificação das etapas anteriores...'
                : jaGerou
                ? 'A IA gerou abordagens com base nas etapas anteriores. Edite livremente.'
                : '⚠️ A IA vai usar tudo que foi preenchido nas etapas anteriores — empresa, produto e qualificação. Você também pode escrever manualmente.'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={gerar}
          disabled={gerando}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 shrink-0 ${jaGerou ? 'text-brand border border-brand/30 hover:bg-brand/10' : 'text-white bg-brand hover:bg-brand/90 border border-brand'}`}
        >
          {gerando ? <Loader2 size={12} className="animate-spin" /> : jaGerou ? <RefreshCw size={12} /> : <Brain size={12} />}
          {gerando ? 'Gerando...' : jaGerou ? 'Regerar' : 'Gerar com IA'}
        </button>
      </div>

      {erroGeracao && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{erroGeracao}</p>
      )}

      {/* Campos de texto — padrão numerado igual às perguntas da etapa 3 */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-1">Abordagens de abertura</p>
        <p className="text-xs text-gray-400 mb-3">O agente alterna entre as abordagens ao longo das ligações, nunca repetindo a mesma em sequência.</p>
        <div className="flex flex-col gap-2">
          {abordagens.map((a, idx) => (
            <div key={a.id} className="flex items-start gap-2">
              <span className="text-xs font-semibold text-brand w-5 shrink-0 mt-2.5">{idx + 1}.</span>
              <div className="flex-1 flex flex-col gap-0.5">
                {a.tipo && a.tipo !== 'personalizado' && (
                  <span className="text-[10px] font-semibold text-brand/70">{TIPO_LABEL[a.tipo]}</span>
                )}
                <input
                  className={inputCls}
                  value={a.texto}
                  onChange={e => {
                    const updated = abordagens.map((x, i) => i === idx ? { ...x, texto: e.target.value } : x)
                    onAbordagensChange(updated)
                  }}
                  placeholder={gerando ? 'Aguardando geração...' : `Abordagem ${idx + 1}`}
                  disabled={gerando}
                />
              </div>
              {abordagens.length > 1 && (
                <button type="button" onClick={() => remover(a.id)}
                  className="text-xs text-red-400 hover:text-red-600 shrink-0 mt-2.5">✕</button>
              )}
            </div>
          ))}
        </div>
        {abordagens.length < 10 && (
          <button type="button" onClick={adicionar}
            className="mt-2 text-xs text-brand hover:text-brand-600 font-medium flex items-center gap-1">
            + Adicionar abordagem
          </button>
        )}
      </div>
    </div>
  )
}

// ─── StepObjecoesCanal ────────────────────────────────────────────────────────
function StepObjecoesCanal({
  form,
  objecoesCanal,
  onObjecoesCanalChange,
  abordagens,
  objecoes,
  perguntas,
}: {
  form: FormData
  objecoesCanal: ObjecaoCanal[]
  onObjecoesCanalChange: (o: ObjecaoCanal[]) => void
  abordagens: Abordagem[]
  objecoes: Objecao[]
  perguntas: string[]
}) {
  const [gerandoFixas, setGerandoFixas] = useState(false)
  const [gerandoNovas, setGerandoNovas] = useState(false)
  const [erroFixas, setErroFixas] = useState('')
  const [erroNovas, setErroNovas] = useState('')

  const fixas = objecoesCanal.filter(o => o.fixo)
  const novas = objecoesCanal.filter(o => !o.fixo)
  const novasComObjecao = novas.filter(o => o.objecao.trim())
  const jaGerouFixas = fixas.some(o => o.rebuttal.trim().length > 0)
  const jaGerouNovas = novas.length > 0 && novas.every(o => o.rebuttal.trim().length > 0)

  const cascadePayload = {
    // Step 1 — objetivo do agente
    objetivo: form['objetivo'],
    // Step 2 — empresa e produto (completo)
    empresa: form['empresa-nome'],
    segmento: form['empresa-segmento'],
    porte: form['empresa-porte'],
    descricao_empresa: form['empresa-descricao'],
    diferenciais: form['empresa-diferenciais'],
    objecoes_comuns: form['empresa-objecoes-comuns'],
    contexto_mercado: form['empresa-contexto-mercado'],
    produto: form['prod-nome'],
    descricao_produto: form['prod-descricao'],
    resultados_clientes: form['prod-resultados'],
    concorrentes: form['prod-concorrentes'],
    info_adicional: form['prod-info-extra'],
    // Step 2 — qualificação e objeções de valor
    perguntas_qualificacao: perguntas.filter(Boolean).join(' | '),
    objecoes_valor: objecoes.map(o => `"${o.objecao}" → "${o.rebuttal}"`).join('\n'),
    // Step ICP — cargo/porte/segmento alvo + sinais de compra (pre-preenchidos pelo pesquisar-mercado ou seleção manual)
    icp_cargo: form['icp-cargo-tipo'],
    icp_porte: form['icp-porte-alvo'],
    icp_segmento: form['icp-segmento-alvo'],
    sinais_compra: form['gatilhos-customizados'],
    // Step Abordagens — abordagens de abertura geradas
    abordagens_contexto: abordagens.filter(a => a.selecionada && a.texto.trim()).map(a => a.texto).join(' | '),
    // Materiais anexados — resumos processados pela IA (alimenta etapas 3-12)
    materiais_conteudo: form['materiais-conteudo'],
  }

  function atualizarRebuttal(id: string, valor: string) {
    onObjecoesCanalChange(objecoesCanal.map(o => o.id === id ? { ...o, rebuttal: valor } : o))
  }

  function atualizarObjecao(id: string, valor: string) {
    onObjecoesCanalChange(objecoesCanal.map(o => o.id === id ? { ...o, objecao: valor } : o))
  }

  function adicionar() {
    const novoId = String(Date.now())
    onObjecoesCanalChange([...objecoesCanal, { id: novoId, fixo: false, objecao: '', rebuttal: '' }])
  }

  function remover(id: string) {
    onObjecoesCanalChange(objecoesCanal.filter(o => o.id !== id))
  }

  async function gerarRebuttalsFixas() {
    setGerandoFixas(true)
    setErroFixas('')
    try {
      const res = await claudeApi.sugerirRebuttalsCanal({
        objecoes_fixas: fixas.map(o => ({ id: o.id, objecao: o.objecao })),
        ...cascadePayload,
      })
      const rebuttals: Array<{ id: string; rebuttal: string }> = res.data.rebuttals || []
      onObjecoesCanalChange(objecoesCanal.map(o => {
        const found = rebuttals.find(r => r.id === o.id)
        return found ? { ...o, rebuttal: found.rebuttal } : o
      }))
    } catch (e) {
      const err = e as { response?: { data?: { error?: string } }; message?: string }
      setErroFixas(err?.response?.data?.error || err?.message || 'Erro ao gerar rebuttals.')
    } finally {
      setGerandoFixas(false)
    }
  }

  async function gerarRebuttalsNovas() {
    if (!novasComObjecao.length) return
    setGerandoNovas(true)
    setErroNovas('')
    try {
      const res = await claudeApi.sugerirRebuttalsCanal({
        objecoes_novas: novasComObjecao.map(o => ({ id: o.id, objecao: o.objecao })),
        ...cascadePayload,
      })
      const rebuttals: Array<{ id: string; rebuttal: string }> = res.data.rebuttals || []
      onObjecoesCanalChange(objecoesCanal.map(o => {
        const found = rebuttals.find(r => r.id === o.id)
        return found ? { ...o, rebuttal: found.rebuttal } : o
      }))
    } catch (e) {
      const err = e as { response?: { data?: { error?: string } }; message?: string }
      setErroNovas(err?.response?.data?.error || err?.message || 'Erro ao gerar rebuttals.')
    } finally {
      setGerandoNovas(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Objeções de Canal</h2>
        <p className="text-sm text-gray-500 mt-1">São as objeções de <strong>processo</strong> — quando o prospect quer adiar o contato, mas não rejeitou o produto. Nossa IA gera respostas personalizadas para o seu segmento.</p>
      </div>

      {/* Banner Gerar com IA — fixas */}
      <div className={`flex items-start justify-between gap-4 p-4 rounded-xl border ${jaGerouFixas ? 'border-brand/20 bg-brand/5' : 'border-brand/30 bg-brand/5'}`}>
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <Brain size={18} className="text-brand shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-gray-800">Respostas geradas pela IA</p>
            <p className="text-xs text-gray-500 mt-0.5">Gera rebuttals adaptados ao seu segmento, produto e tom com base nas etapas anteriores. Você pode editar qualquer resposta depois.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={gerarRebuttalsFixas}
          disabled={gerandoFixas}
          className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg disabled:opacity-60 disabled:cursor-not-allowed transition-colors ${
            jaGerouFixas
              ? 'text-brand border border-brand/30 hover:bg-brand/10'
              : 'text-white bg-brand hover:bg-brand/90 border border-brand'
          }`}
        >
          {gerandoFixas ? (
            <><Loader2 size={11} className="animate-spin" />Gerando...</>
          ) : jaGerouFixas ? (
            <><RefreshCw size={11} />Regerar</>
          ) : (
            <><Brain size={11} />Gerar com IA</>
          )}
        </button>
      </div>

      {erroFixas && (
        <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle size={13} className="shrink-0" />{erroFixas}
        </div>
      )}

      {/* Objeções fixas */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">5 objeções padrão</p>
        {fixas.map((o) => (
          <div key={o.id} className="border border-gray-200 rounded-xl p-4 flex flex-col gap-3 bg-white">
            <div>
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Objeção do prospect</label>
              <p className="mt-1 text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">{o.objecao}</p>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Resposta do agente</label>
              <textarea
                className="w-full mt-1 text-sm text-gray-700 border border-gray-200 rounded-lg p-2.5 resize-none focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/10 placeholder:text-gray-400"
                rows={3}
                value={o.rebuttal}
                placeholder="Clique em 'Gerar com IA' para criar a resposta personalizada para o seu segmento."
                onChange={e => atualizarRebuttal(o.id, e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Objeções novas adicionadas pelo cliente */}
      {novas.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Objeções adicionadas</p>
            {novasComObjecao.length > 0 && (
              <button
                type="button"
                onClick={gerarRebuttalsNovas}
                disabled={gerandoNovas}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg disabled:opacity-60 disabled:cursor-not-allowed transition-colors ${
                  jaGerouNovas
                    ? 'text-brand border border-brand/30 hover:bg-brand/10'
                    : 'text-white bg-brand hover:bg-brand/90 border border-brand'
                }`}
              >
                {gerandoNovas ? (
                  <><Loader2 size={11} className="animate-spin" />Gerando...</>
                ) : jaGerouNovas ? (
                  <><RefreshCw size={11} />Regerar</>
                ) : (
                  <><Brain size={11} />Gerar com IA</>
                )}
              </button>
            )}
          </div>
          {novas.map((o) => (
            <div key={o.id} className="border border-gray-200 rounded-xl p-4 flex flex-col gap-3 bg-white">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Objeção do prospect</label>
                  <textarea
                    className="w-full mt-1 text-sm text-gray-700 border border-gray-200 rounded-lg p-2.5 resize-none focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/10 bg-white placeholder:text-gray-400"
                    rows={2}
                    placeholder='Ex: "Já trabalhamos com outra empresa."'
                    value={o.objecao}
                    onChange={e => atualizarObjecao(o.id, e.target.value)}
                  />
                </div>
                <button type="button" onClick={() => remover(o.id)} className="text-gray-300 hover:text-red-400 transition-colors mt-5 shrink-0">
                  <X size={15} />
                </button>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Resposta do agente</label>
                <textarea
                  className="w-full mt-1 text-sm text-gray-700 border border-gray-200 rounded-lg p-2.5 resize-none focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/10 bg-white placeholder:text-gray-400"
                  rows={3}
                  placeholder="Escreva a resposta ou clique em 'Gerar com IA'."
                  value={o.rebuttal}
                  onChange={e => atualizarRebuttal(o.id, e.target.value)}
                />
              </div>
            </div>
          ))}
          {erroNovas && (
            <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertCircle size={13} className="shrink-0" />{erroNovas}
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={adicionar}
        className="flex items-center gap-2 text-sm text-brand font-medium hover:opacity-75 transition-opacity"
      >
        <Plus size={15} /> Adicionar objeção de canal
      </button>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-xs text-amber-700"><span className="font-semibold">Dica:</span> Nossa IA gera respostas personalizadas para as 5 objeções com base no seu segmento e tom. Você pode editar qualquer resposta e adicionar objeções específicas do seu mercado.</p>
      </div>
    </div>
  )
}

// ─── PainelValidacao ──────────────────────────────────────────────────────────
function PainelValidacao({ prompt, empresa, produto, onPromptCorrigido }: {
  prompt: string
  empresa: string
  produto: string
  onPromptCorrigido: (novo: string) => void
}) {
  const [validando, setValidando] = useState(false)
  const [resultado, setResultado] = useState<{
    score: number
    pontos: Array<{ id: string; titulo: string; severidade: string; descricao: string; sugestao_instrucao: string | null }>
  } | null>(null)
  const [corrigindo, setCorrigindo] = useState<string | null>(null)
  const [erro, setErro] = useState('')

  async function validar() {
    setValidando(true)
    setErro('')
    try {
      const res = await claudeApi.validarPrompt({ prompt, empresa, produto })
      setResultado(res.data)
    } catch (e) {
      const err = e as { response?: { data?: { error?: string } }; message?: string }
      setErro(err?.response?.data?.error || err?.message || 'Erro ao validar.')
    } finally {
      setValidando(false)
    }
  }

  async function corrigir(ponto: { id: string; sugestao_instrucao: string | null }) {
    if (!ponto.sugestao_instrucao) return
    setCorrigindo(ponto.id)
    try {
      const res = await claudeApi.ajustarPrompt({ prompt_atual: prompt, instrucao: ponto.sugestao_instrucao })
      onPromptCorrigido(res.data.prompt || res.data.prompt_ajustado || prompt)
      setResultado(null)
    } catch (e) {
      const err = e as { message?: string }
      setErro(err?.message || 'Erro ao corrigir.')
    } finally {
      setCorrigindo(null)
    }
  }

  const SEV_COLOR: Record<string, string> = {
    ok: 'text-green-600 bg-green-50 border-green-200',
    aviso: 'text-amber-600 bg-amber-50 border-amber-200',
    erro: 'text-red-600 bg-red-50 border-red-200',
  }
  const SEV_LABEL: Record<string, string> = { ok: '✓', aviso: '⚠', erro: '✗' }

  return (
    <div className="mt-4 border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Brain size={14} className="text-violet-600" />
          <span className="text-xs font-semibold text-gray-700">Validação do Prompt</span>
          {resultado && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${resultado.score >= 80 ? 'bg-green-100 text-green-700' : resultado.score >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
              {resultado.score}/100
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={validar}
          disabled={validando}
          className="flex items-center gap-1.5 text-xs font-medium text-brand hover:opacity-75 transition-opacity disabled:opacity-60"
        >
          {validando ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
          {validando ? 'Analisando...' : resultado ? 'Reanalisar' : 'Analisar prompt'}
        </button>
      </div>

      {erro && <p className="text-xs text-red-500 px-4 py-2">{erro}</p>}

      {resultado && (
        <div className="divide-y divide-gray-100">
          {resultado.pontos.map(p => (
            <div key={p.id} className="flex items-start gap-3 px-4 py-3">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 mt-0.5 ${SEV_COLOR[p.severidade] || SEV_COLOR.aviso}`}>
                {SEV_LABEL[p.severidade] || '?'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-700">{p.titulo}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{p.descricao}</p>
              </div>
              {p.severidade !== 'ok' && p.sugestao_instrucao && (
                <button
                  type="button"
                  onClick={() => corrigir(p)}
                  disabled={corrigindo === p.id}
                  className="shrink-0 text-[11px] font-medium text-brand border border-brand/30 px-2.5 py-1 rounded-lg hover:bg-violet-50 transition-colors disabled:opacity-60"
                >
                  {corrigindo === p.id ? <Loader2 size={10} className="animate-spin" /> : 'Corrigir'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Step4({
  form,
  onChange,
  activated,
  activating,
  activatingStep,
  objecoes,
  onActivate,
  onReset,
  modoEdicao,
  ligacoesSucesso,
  ligacoesInsucesso,
  materiais,
  novoAgenteId,
  abordagens,
  objecoesCanal,
  perguntas,
}: {
  form: FormData
  onChange: (k: keyof FormData, v: string) => void
  activated: boolean
  activating?: boolean
  activatingStep?: number
  objecoes: Objecao[]
  onActivate: () => void
  onReset: () => void
  modoEdicao: boolean
  ligacoesSucesso: LigacaoRef[]
  ligacoesInsucesso: LigacaoRef[]
  materiais?: Material[]
  novoAgenteId?: string
  abordagens?: Abordagem[]
  objecoesCanal?: ObjecaoCanal[]
  perguntas: string[]
}) {
  const navigate = useNavigate()
  const [gerando, setGerando] = useState(false)
  const [erroGeracao, setErroGeracao] = useState('')
  const [stepProgress, setStepProgress] = useState<number[]>([0, 0, 0, 0])
  const vozNome = VOZES_TELNYX.find(v => v.id === form.voz)?.nome ?? form.voz

  async function gerarPrompt() {
    setGerando(true)
    setErroGeracao('')
    setStepProgress([0, 0, 0, 0])

    // Etapa 0: "Lendo 14 etapas" — 3s até 100%
    const step0 = setInterval(() => {
      setStepProgress(p => p[0] >= 100 ? p : [Math.min(p[0] + 5, 100), p[1], p[2], p[3]])
    }, 150)
    await new Promise(r => setTimeout(r, 3000))
    clearInterval(step0)
    setStepProgress([100, 0, 0, 0])

    // Etapa 1: "Passagem 1 — Opus 4.8" — sobe lentamente até 88%, aguarda job
    const step1 = setInterval(() => {
      setStepProgress(p => p[1] >= 88 ? p : [p[0], Math.min(p[1] + 0.6, 88), p[2], p[3]])
    }, 800)

    try {
      const payload = {
        objetivo: form['objetivo'],
        nome_agente: form['nome-agente'],
        empresa: form['empresa-nome'],
        segmento: form['empresa-segmento'],
        porte: form['empresa-porte'],
        site: form['empresa-site'],
        descricao_empresa: form['empresa-descricao'],
        diferenciais: form['empresa-diferenciais'],
        objecoes_comuns: form['empresa-objecoes-comuns'],
        contexto_mercado: form['empresa-contexto-mercado'],
        produto: form['prod-nome'],
        descricao_produto: form['prod-descricao'],
        resultados_clientes: form['prod-resultados'],
        concorrentes: form['prod-concorrentes'],
        info_adicional: form['prod-info-extra'],
        icp_cargos: form['icp-cargo-tipo'],
        icp_porte: form['icp-porte-alvo'],
        icp_segmento: form['icp-segmento-alvo'],
        gatilhos: form['gatilhos-customizados'],
        gatilhos_fechamento: form['gatilhos-fechamento'],
        cenario_dores: form['cenario-dores'],
        perguntas: perguntas.filter(Boolean),
        objecoes_mapeadas: objecoes.filter(o => o.objecao.trim()),
        metodologia: form['metodologia'],
        materiais_empresa: (() => {
          const partes = (materiais || []).filter(m => m.texto?.trim()).map((m, idx) => {
            const label = m.tipo || `Material ${idx + 1}`
            return `=== ${label.toUpperCase()} ===\n${m.texto!.trim()}`
          })
          return partes.length > 0 ? partes.join('\n\n') : form['materiais-conteudo']
        })(),
        script_ligacao: form['script-ligacao'],
        script_abertura: form['script-abertura'],
        voz: vozNome,
        tom: form['tom'],
        ligacoes_sucesso: ligacoesSucesso.filter(l => l.resumo || l.transcricao).map(l => l.resumo || l.transcricao),
        ligacoes_insucesso: ligacoesInsucesso.filter(l => l.resumo || l.transcricao).map(l => l.resumo || l.transcricao),
        agendamento_estrategia: form['agendamento-estrategia'],
        agendamento_antecedencia: form['agendamento-antecedencia'],
        agendamento_opcoes: form['agendamento-opcoes'],
        agendamento_tom: form['agendamento-tom'],
        agendamento_duracao: form['agendamento-duracao'],
        agendamento_apresentar_vendedor: form['agendamento-apresentar-vendedor'],
        agendamento_recusa: form['agendamento-recusa'],
        agendamento_urgencia: form['agendamento-urgencia'],
        voz_pronuncia: form['voz-pronuncia'],
        voz_termos_tecnicos: form['voz-termos-tecnicos'],
        voz_ritmo_tom: form['voz-ritmo-tom'],
        voz_palavras_proibidas: form['voz-palavras-proibidas'],
        abordagens_selecionadas: abordagens
          ? abordagens.filter(a => a.selecionada && a.texto.trim()).map(a => `[${a.tipo.toUpperCase()}] ${a.texto}`).join('\n')
          : '',
        objecoes_canal: objecoesCanal
          ? objecoesCanal.filter(o => o.objecao && o.rebuttal).map(o => `- "${o.objecao}"\n  → "${o.rebuttal}"`).join('\n')
          : '',
      }
      const initRes = await claudeApi.gerarPrompt(payload)
      const jobId = (initRes.data as { jobId?: string }).jobId
      if (jobId) {
        // Polling até concluir (max 5 min)
        for (let i = 0; i < 100; i++) {
          await new Promise(r => setTimeout(r, 3000))
          const { data } = await claudeApi.gerarPromptStatus(jobId)
          if ((data as { status: string }).status === 'done') {
            clearInterval(step1)
            // Etapa 1 → 100%, depois etapa 2 rápida, depois etapa 3 (entrega)
            setStepProgress([100, 100, 0, 0])
            // Passagem 2 animada em 2s
            const step2 = setInterval(() => {
              setStepProgress(p => p[2] >= 100 ? p : [p[0], p[1], Math.min(p[2] + 5, 100), p[3]])
            }, 100)
            await new Promise(r => setTimeout(r, 2000))
            clearInterval(step2)
            setStepProgress([100, 100, 100, 0])
            // Entrega
            await new Promise(r => setTimeout(r, 800))
            setStepProgress([100, 100, 100, 100])
            await new Promise(r => setTimeout(r, 400))
            onChange('prompt_gerado', (data as { prompt: string }).prompt || '')
            return
          }
          if ((data as { status: string }).status === 'error') {
            clearInterval(step1)
            throw new Error((data as { error?: string }).error || 'Erro ao gerar o prompt.')
          }
        }
        clearInterval(step1)
        throw new Error('Tempo limite excedido ao gerar o prompt.')
      } else {
        clearInterval(step1)
        // Resposta direta (fallback — backend síncrono)
        const promptDireto = (initRes.data as { prompt?: string }).prompt || ''
        if (!promptDireto) throw new Error('O servidor retornou um prompt vazio. Tente novamente.')
        setStepProgress([100, 100, 100, 100])
        onChange('prompt_gerado', promptDireto)
      }
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        || (err as { message?: string })?.message
        || 'Não foi possível gerar o prompt. Verifique sua conexão e tente novamente.'
      setErroGeracao(msg)
    } finally {
      setGerando(false)
    }
  }

  const LOADING_STEPS = [
    modoEdicao ? 'Atualizando agente no Telnyx...' : 'Criando agente no Telnyx...',
    'Injetando inteligência herdada do CI...',
    'Configurando prompt e capacidades...',
    modoEdicao ? 'Agente atualizado! ✓' : 'Agente em treinamento! ✓',
  ]

  if (activating) {
    return (
      <div className="flex flex-col items-center py-8 gap-6 text-center">
        {/* Cérebro 3D animado */}
        <div className="relative w-32 h-32 flex items-center justify-center">
          <svg viewBox="0 0 120 120" className="w-32 h-32 drop-shadow-lg" style={{ filter: 'drop-shadow(0 0 18px rgba(139,92,246,0.5))' }}>
            {/* Pulso externo */}
            <circle cx="60" cy="60" r="55" fill="none" stroke="rgba(139,92,246,0.15)" strokeWidth="1">
              <animate attributeName="r" values="52;58;52" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.3;0.05;0.3" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(139,92,246,0.25)" strokeWidth="1">
              <animate attributeName="r" values="46;52;46" dur="2s" begin="0.3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" begin="0.3s" repeatCount="indefinite" />
            </circle>
            {/* Fundo do cérebro */}
            <ellipse cx="60" cy="63" rx="38" ry="32" fill="url(#brainGrad)" opacity="0.95" />
            {/* Hemisfério esquerdo */}
            <path d="M60 35 C44 35 28 44 26 58 C24 70 30 80 38 85 C44 88 52 89 60 88" fill="url(#leftGrad)" stroke="rgba(139,92,246,0.6)" strokeWidth="0.8" />
            {/* Hemisfério direito */}
            <path d="M60 35 C76 35 92 44 94 58 C96 70 90 80 82 85 C76 88 68 89 60 88" fill="url(#rightGrad)" stroke="rgba(139,92,246,0.6)" strokeWidth="0.8" />
            {/* Sulcos - hemisfério esquerdo */}
            <path d="M34 52 C36 48 40 46 44 47" fill="none" stroke="rgba(139,92,246,0.5)" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M29 62 C31 57 36 54 41 55" fill="none" stroke="rgba(139,92,246,0.5)" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M32 72 C35 67 40 65 45 67" fill="none" stroke="rgba(139,92,246,0.4)" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M40 81 C43 77 47 76 51 78" fill="none" stroke="rgba(139,92,246,0.4)" strokeWidth="1" strokeLinecap="round" />
            <path d="M36 57 C38 53 42 51 46 52" fill="none" stroke="rgba(139,92,246,0.3)" strokeWidth="0.8" strokeLinecap="round" />
            {/* Sulcos - hemisfério direito */}
            <path d="M86 52 C84 48 80 46 76 47" fill="none" stroke="rgba(139,92,246,0.5)" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M91 62 C89 57 84 54 79 55" fill="none" stroke="rgba(139,92,246,0.5)" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M88 72 C85 67 80 65 75 67" fill="none" stroke="rgba(139,92,246,0.4)" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M80 81 C77 77 73 76 69 78" fill="none" stroke="rgba(139,92,246,0.4)" strokeWidth="1" strokeLinecap="round" />
            <path d="M84 57 C82 53 78 51 74 52" fill="none" stroke="rgba(139,92,246,0.3)" strokeWidth="0.8" strokeLinecap="round" />
            {/* Divisão central */}
            <line x1="60" y1="36" x2="60" y2="88" stroke="rgba(139,92,246,0.4)" strokeWidth="1" strokeDasharray="2,3" />
            {/* Neurônios pulsando */}
            <circle cx="42" cy="52" r="2" fill="#a78bfa">
              <animate attributeName="opacity" values="1;0.2;1" dur="1.4s" begin="0s" repeatCount="indefinite" />
            </circle>
            <circle cx="52" cy="67" r="1.5" fill="#c4b5fd">
              <animate attributeName="opacity" values="1;0.2;1" dur="1.8s" begin="0.4s" repeatCount="indefinite" />
            </circle>
            <circle cx="78" cy="55" r="2" fill="#a78bfa">
              <animate attributeName="opacity" values="1;0.2;1" dur="1.6s" begin="0.8s" repeatCount="indefinite" />
            </circle>
            <circle cx="68" cy="72" r="1.5" fill="#c4b5fd">
              <animate attributeName="opacity" values="1;0.2;1" dur="1.3s" begin="0.2s" repeatCount="indefinite" />
            </circle>
            <circle cx="46" cy="76" r="1.5" fill="#a78bfa">
              <animate attributeName="opacity" values="1;0.2;1" dur="2s" begin="0.6s" repeatCount="indefinite" />
            </circle>
            <circle cx="74" cy="76" r="1.5" fill="#c4b5fd">
              <animate attributeName="opacity" values="1;0.2;1" dur="1.5s" begin="1s" repeatCount="indefinite" />
            </circle>
            {/* Sinapses */}
            <line x1="42" y1="52" x2="52" y2="67" stroke="#a78bfa" strokeWidth="0.6" opacity="0.5">
              <animate attributeName="opacity" values="0.5;0.1;0.5" dur="1.4s" begin="0s" repeatCount="indefinite" />
            </line>
            <line x1="78" y1="55" x2="68" y2="72" stroke="#a78bfa" strokeWidth="0.6" opacity="0.5">
              <animate attributeName="opacity" values="0.5;0.1;0.5" dur="1.6s" begin="0.8s" repeatCount="indefinite" />
            </line>
            <line x1="52" y1="67" x2="46" y2="76" stroke="#c4b5fd" strokeWidth="0.6" opacity="0.4">
              <animate attributeName="opacity" values="0.4;0.05;0.4" dur="1.8s" begin="0.4s" repeatCount="indefinite" />
            </line>
            <line x1="68" y1="72" x2="74" y2="76" stroke="#c4b5fd" strokeWidth="0.6" opacity="0.4">
              <animate attributeName="opacity" values="0.4;0.05;0.4" dur="1.3s" begin="0.2s" repeatCount="indefinite" />
            </line>
            <defs>
              <radialGradient id="brainGrad" cx="50%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#4c1d95" stopOpacity="0.05" />
              </radialGradient>
              <linearGradient id="leftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#6d28d9" stopOpacity="0.2" />
              </linearGradient>
              <linearGradient id="rightGrad" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#5b21b6" stopOpacity="0.2" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            {modoEdicao ? 'Atualizando agente...' : 'Criando o melhor agente'}
          </h2>
          <p className="text-sm text-gray-400 mb-5">Inteligência sendo calibrada para o seu mercado</p>

          <div className="flex flex-col gap-2.5 text-left w-72 mx-auto">
            {LOADING_STEPS.map((s, i) => (
              <div key={i} className={`flex items-center gap-2.5 text-sm transition-all duration-300 ${
                i < (activatingStep ?? 0) ? 'text-emerald-600' : i === (activatingStep ?? 0) ? 'text-brand font-medium' : 'text-gray-300'
              }`}>
                {i < (activatingStep ?? 0)
                  ? <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0"><Check size={11} strokeWidth={3} className="text-emerald-600" /></div>
                  : i === (activatingStep ?? 0)
                  ? <div className="w-5 h-5 rounded-full bg-brand/10 flex items-center justify-center shrink-0"><Loader2 size={11} className="animate-spin text-brand" /></div>
                  : <div className="w-5 h-5 rounded-full border border-gray-200 shrink-0" />
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
      <div className="flex flex-col items-center py-8 gap-6 text-center">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
            <Check size={38} className="text-emerald-600" strokeWidth={3} />
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-brand flex items-center justify-center shadow-md">
            <Brain size={14} className="text-white" />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {modoEdicao
              ? `Agente ${form['nome-agente'] || form['empresa-nome']} atualizado!`
              : `${form['nome-agente'] || form['empresa-nome']} está pronto!`}
          </h2>
          <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">
            {modoEdicao
              ? 'As configurações foram salvas. O prompt atualizado já está ativo no Telnyx.'
              : 'Antes de ir para as ligações reais, treine o agente no Simulador. Cada cenário aprovado torna o agente mais preciso.'}
          </p>
        </div>

        {!modoEdicao && (
          <div className="bg-brand/5 border border-brand/20 rounded-xl px-5 py-3.5 max-w-sm text-left">
            <p className="text-xs font-semibold text-brand mb-1.5 flex items-center gap-1.5">
              <Brain size={12} /> Próximo passo recomendado
            </p>
            <p className="text-xs text-gray-600 leading-relaxed">
              Acesse o <span className="font-semibold text-gray-800">Simulador</span> no Centro de Inteligência e execute os 5 cenários de certificação. O agente só vai para produção após a aprovação.
            </p>
          </div>
        )}

        <div className="flex gap-3">
          {!modoEdicao && (
            <button
              onClick={() => navigate(`/inteligencia?aba=simulador${novoAgenteId ? `&agente_id=${novoAgenteId}` : ''}`)}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand text-white text-sm font-semibold rounded-xl hover:bg-brand/90 transition-colors shadow-sm"
            >
              <Brain size={15} /> Treinar no Simulador
            </button>
          )}
          <button
            onClick={() => navigate('/dashboard')}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl transition-colors ${modoEdicao ? 'bg-brand text-white hover:bg-brand/90 shadow-sm' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            {modoEdicao ? <>Ver Dashboard <ChevronRight size={15} /></> : 'Ver Dashboard'}
          </button>
          <button
            onClick={onReset}
            className="px-5 py-2.5 border border-gray-200 text-sm font-medium text-gray-500 rounded-xl hover:bg-gray-50 transition-colors"
          >
            {modoEdicao ? 'Voltar' : 'Criar outro'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Brain size={18} className="text-brand" />
          <h3 className="text-base font-semibold text-gray-900">
            {form['prompt_gerado'] ? 'Prompt gerado pela IA' : 'Revisão Final & Geração do Prompt'}
          </h3>
        </div>
        <p className="text-sm text-gray-500">
          {form['prompt_gerado']
            ? 'Revise, edite se necessário e ative o agente.'
            : 'Confirme as etapas preenchidas e clique em "Gerar Prompt Final" quando tudo estiver pronto.'}
        </p>
      </div>

      {/* Card de revisão das etapas + botão Gerar Prompt Final */}
      {!gerando && !form['prompt_gerado'] && (() => {
        const etapas = [
          { num: 1,  label: 'Objetivo',               valido: !!form['objetivo'],                                                                                                                                                                                                                                                                                                                                                                                                                                                                          critico: true,  hint: 'Selecione o objetivo do agente' },
          { num: 2,  label: 'Empresa & Produto',       valido: !!(form['nome-agente']?.trim() && form['empresa-nome']?.trim() && form['empresa-segmento']?.trim() && form['empresa-porte']?.trim() && form['empresa-descricao']?.trim() && form['empresa-diferenciais']?.trim() && form['empresa-objecoes-comuns']?.trim() && form['empresa-contexto-mercado']?.trim() && form['prod-nome']?.trim() && form['prod-descricao']?.trim() && form['prod-resultados']?.trim() && form['prod-info-extra']?.trim() && form['prod-concorrentes']?.trim() && materiais?.some(m => m.texto?.trim())), critico: true,  hint: 'Use "Pesquisar com IA" para preencher descrição, diferenciais, concorrentes e contexto — e adicione ao menos 1 material da empresa' },
          { num: 3,  label: 'Qualificação & Objeções', valido: !!(perguntas.filter(Boolean).length >= 1 && objecoes.filter(o => o.objecao && o.rebuttal).length >= 2),                                                                                                                                                                                                                                                                                                                                                                                                                      critico: true,  hint: 'Adicione ao menos 1 pergunta de qualificação e 2 objeções com resposta — use "Gerar com IA" para preencher automaticamente' },
          { num: 4,  label: 'ICP & Sinais',            valido: !!(form['icp-cargo-tipo']?.trim() && form['icp-porte-alvo']?.trim() && form['icp-segmento-alvo']?.trim() && form['gatilhos-customizados']?.trim()),                                                                                                                                                                                                                                                                                                                                                                        critico: true,  hint: 'Preencha cargos-alvo, porte-alvo, segmento-alvo e sinais de compra' },
          { num: 5,  label: 'Abordagens de Abertura',  valido: !!(abordagens?.some(a => a.selecionada && a.texto.trim())),                                                                                                                                                                                                                                                                                                                                                                                                                                                               critico: true,  hint: 'Gere ou escreva ao menos 1 abordagem de abertura' },
          { num: 6,  label: 'Objeções de Canal',       valido: (objecoesCanal?.filter(o => o.objecao && o.rebuttal).length ?? 0) >= 3,                                                                                                                                                                                                                                                                                                                                                                                                                                                   critico: true,  hint: 'Gere rebuttals para as 3 objeções de canal (WhatsApp, E-mail, Ligação)' },
          { num: 7,  label: 'Cenário & Dores',         valido: !!form['cenario-dores']?.trim(),                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          critico: true,  hint: 'Descreva o cenário e as dores do público-alvo' },
          { num: 8,  label: 'Gatilhos de Fechamento',  valido: !!form['gatilhos-fechamento']?.trim(),                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    critico: true,  hint: 'Adicione os gatilhos de fechamento imediato' },
          { num: 9,  label: 'Público-alvo',            valido: !!form['icp-cargo-tipo']?.trim(),                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         critico: true,  hint: 'Selecione os perfis de público-alvo na etapa 9' },
          { num: 10, label: 'Metodologia',             valido: !!form['metodologia']?.trim(),                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            critico: true,  hint: 'Selecione a metodologia de vendas' },
          { num: 11, label: 'Roteiro & Materiais',     valido: !!(form['script-abertura']?.trim() && (form['script-ligacao']?.trim() || materiais?.some(m => m.texto?.trim()))),                                                                                                                                                                                                                                                                                                                                                                                                          critico: true,  hint: 'Preencha o script de abertura e adicione roteiro ou material da empresa' },
          { num: 12, label: 'Ligações de Referência',  valido: !!(ligacoesSucesso?.some(l => l.resumo || l.transcricao) && ligacoesInsucesso?.some(l => l.resumo || l.transcricao)),                                                                                                                                                                                                                                                                                                                                                                                                     critico: true,  hint: 'Adicione ao menos 1 ligação de sucesso e 1 de insucesso — ambas formam o padrão do agente' },
          { num: 13, label: 'Voz e Tom',               valido: !!(form['voz']?.trim() && form['tom']?.trim()),                                                                                                                                                                                                                                                                                                                                                                                                                                                                           critico: true,  hint: 'Selecione voz e tom do agente' },
          { num: 14, label: 'Agendamento',             valido: !!(form['agendamento-estrategia']?.trim() && form['agendamento-antecedencia']?.trim() && form['agendamento-opcoes']?.trim() && form['agendamento-tom']?.trim() && form['agendamento-duracao']?.trim() && form['agendamento-apresentar-vendedor']?.trim() && form['agendamento-recusa']?.trim() && form['agendamento-urgencia']?.trim()),                                                                                                                                                                                   critico: true,  hint: 'Selecione todas as opções de agendamento (estratégia, antecedência, opções, tom, duração, apresentação, recusa e urgência)' },
          { num: 15, label: 'Calibração de Voz',       valido: !!(form['voz-pronuncia']?.trim() && form['voz-termos-tecnicos']?.trim() && form['voz-ritmo-tom']?.trim() && form['voz-palavras-proibidas']?.trim()),                                                                                                                                                                                                                                                                                                                                                                       critico: true,  hint: 'Use "Sugerir com IA" para preencher os 4 campos de calibração de voz' },
        ]
        const criticosFaltando = etapas.filter(e => e.critico && !e.valido)
        const canGenerate = criticosFaltando.length === 0
        const totalOk = etapas.filter(e => e.valido).length
        return (
          <div className="flex flex-col gap-4">
            {/* Grid de etapas */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-700">Etapas preenchidas</p>
                <span className={`text-xs font-bold ${totalOk === 15 ? 'text-green-600' : 'text-brand'}`}>{totalOk}/15</span>
              </div>
              <div className="grid grid-cols-3 gap-px bg-gray-100">
                {etapas.map(e => (
                  <div key={e.num} className="bg-white px-3 py-2.5 flex items-start gap-2">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      e.valido ? 'bg-green-100' : e.critico ? 'bg-red-100' : 'bg-amber-100'
                    }`}>
                      {e.valido
                        ? <Check size={9} className="text-green-600" />
                        : <span className={`text-[9px] font-bold leading-none ${e.critico ? 'text-red-600' : 'text-amber-500'}`}>!</span>
                      }
                    </div>
                    <div className="min-w-0">
                      <p className={`text-[11px] font-medium leading-tight ${e.valido ? 'text-gray-700' : e.critico ? 'text-red-700' : 'text-amber-700'}`}>{e.num}. {e.label}</p>
                      {!e.valido && <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{e.hint}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Aviso de campos críticos */}
            {criticosFaltando.length > 0 && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-red-800 mb-1">Complete para liberar a geração:</p>
                  <ul className="space-y-0.5">
                    {criticosFaltando.map(e => (
                      <li key={e.num} className="text-xs text-red-700">• Etapa {e.num} — {e.label}: {e.hint}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            {/* Botão Gerar Prompt Final */}
            <button
              type="button"
              onClick={gerarPrompt}
              disabled={!canGenerate}
              className="flex items-center justify-center gap-2.5 w-full py-4 bg-violet-600 text-white font-semibold text-sm rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              <Brain size={18} />
              Gerar Prompt Final
            </button>
            {!canGenerate && (
              <p className="text-xs text-center text-gray-400 -mt-2">Preencha as etapas obrigatórias acima para liberar a geração</p>
            )}
          </div>
        )
      })()}

      {/* Área do prompt */}
      {gerando ? (
        <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 rounded-xl p-6">
          {/* Cabeçalho */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
              <Loader2 size={20} className="text-violet-600 animate-spin" />
            </div>
            <div>
              <p className="text-sm font-semibold text-violet-900">Construindo o prompt expert do seu agente</p>
              <p className="text-xs text-violet-600 mt-0.5">Nossa IA usa 2 passagens para garantir máxima qualidade</p>
            </div>
          </div>

          {/* Etapas do processo com barras de progresso */}
          <div className="space-y-2.5 mb-5">
            {[
              { label: 'Lendo todas as 15 etapas preenchidas', detail: 'empresa, produto, ICP, abordagens, objeções, ligações reais, calibração de voz...' },
              { label: 'Passagem 1 — Gerando o rascunho do prompt', detail: 'Opus 4.8 com raciocínio adaptativo monta as instruções base' },
              { label: 'Passagem 2 — Revisão e refinamento crítico', detail: 'Verifica especificidade, dados reais, objeções e sinais de compra' },
              { label: 'Entregando o prompt finalizado', detail: 'Pronto para revisar, editar e ativar' },
            ].map((item, i) => {
              const pct = stepProgress[i] ?? 0
              const done = pct >= 100
              const active = !done && (i === 0 || (stepProgress[i - 1] ?? 0) >= 100)
              return (
                <div key={i} className={`bg-white/60 rounded-lg px-3 py-2.5 transition-all ${active ? 'ring-1 ring-violet-300' : ''}`}>
                  <div className="flex items-center gap-3 mb-1.5">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${done ? 'bg-green-100' : active ? 'bg-violet-100' : 'bg-gray-100'}`}>
                      {done
                        ? <svg viewBox="0 0 12 12" className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="2,6 5,9 10,3"/></svg>
                        : active
                          ? <Loader2 size={11} className="text-violet-500 animate-spin" />
                          : <div className="w-2 h-2 rounded-full bg-gray-300" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium ${done ? 'text-green-700' : active ? 'text-violet-900' : 'text-gray-400'}`}>{item.label}</p>
                      <p className={`text-[10px] mt-0.5 ${done ? 'text-green-500' : active ? 'text-violet-500' : 'text-gray-300'}`}>{item.detail}</p>
                    </div>
                    <span className={`text-[10px] font-mono font-semibold shrink-0 ${done ? 'text-green-500' : active ? 'text-violet-600' : 'text-gray-300'}`}>{Math.round(pct)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${done ? 'bg-green-400' : 'bg-violet-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Tempo estimado */}
          <div className="flex items-center gap-2 bg-violet-100/60 rounded-lg px-3 py-2">
            <Clock size={13} className="text-violet-500 shrink-0" />
            <p className="text-xs text-violet-700">
              <span className="font-semibold">Pode levar até 5 minutos</span> — quanto mais informações você preencheu, mais preciso e personalizado será o agente.
            </p>
          </div>
        </div>
      ) : erroGeracao ? (
        <div className="border border-red-200 bg-red-50 rounded-xl p-5 flex flex-col gap-3">
          <p className="text-sm text-red-600">{erroGeracao}</p>
          <button
            type="button"
            onClick={gerarPrompt}
            className="self-start flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 border border-red-300 rounded-lg hover:bg-red-100 transition-colors"
          >
            <RefreshCw size={14} /> Tentar novamente
          </button>
        </div>
      ) : form['prompt_gerado'] ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Prompt do agente — editável</p>
            <button
              type="button"
              onClick={gerarPrompt}
              className="flex items-center gap-1.5 text-xs text-brand hover:text-brand-600 font-medium transition-colors"
            >
              <RefreshCw size={12} /> Regerar
            </button>
          </div>
          <textarea
            className="w-full border border-gray-200 rounded-xl p-4 text-xs font-mono text-gray-700 leading-relaxed resize-none focus:outline-none focus:border-brand/50 focus:ring-2 focus:ring-brand/10 transition-all bg-gray-50"
            rows={20}
            value={form['prompt_gerado']}
            onChange={e => onChange('prompt_gerado', e.target.value)}
          />
          <p className="text-xs text-gray-400">
            Edite livremente — este é exatamente o texto que o agente vai receber na Telnyx.
          </p>
          <PainelValidacao
            prompt={form['prompt_gerado']}
            empresa={form['empresa-nome'] || ''}
            produto={form['prod-nome'] || ''}
            onPromptCorrigido={(novo) => onChange('prompt_gerado', novo)}
          />
        </div>
      ) : null}

      {/* Badge CI */}
      <div className="flex items-center gap-2 bg-purple-50 border border-purple-100 rounded-lg px-3 py-2">
        <Brain size={14} className="text-purple-600 shrink-0" />
        <p className="text-xs text-purple-700">Este agente herdará os argumentos aprovados e padrões de ICP do Centro de Inteligência ao ser ativado.</p>
      </div>

      {/* Botão ativar */}
      <button
        onClick={onActivate}
        disabled={gerando || !form['prompt_gerado']}
        className="flex items-center justify-center gap-2 w-full py-3.5 bg-green-600 text-white font-semibold text-base rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
  system_prompt_override?: string
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
    system_prompt_override: raw.system_prompt_override as string | undefined,
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

function ModalAjustarPrompt({ agente, onClose, onSalvo }: { agente: AgenteMock; onClose: () => void; onSalvo: () => void }) {
  const [prompt, setPrompt] = React.useState(agente.system_prompt_override || '')
  const [instrucao, setInstrucao] = React.useState('')
  const [aplicando, setAplicando] = React.useState(false)
  const [salvando, setSalvando] = React.useState(false)
  const [erro, setErro] = React.useState('')

  async function handleAplicarIA() {
    if (!instrucao.trim()) return
    setAplicando(true); setErro('')
    try {
      const { data } = await claudeApi.ajustarPrompt({ prompt_atual: prompt, instrucao })
      setPrompt((data as { prompt: string }).prompt)
      setInstrucao('')
    } catch { setErro('Erro ao aplicar ajuste. Tente novamente.') }
    finally { setAplicando(false) }
  }

  async function handleSalvar() {
    setSalvando(true); setErro('')
    try {
      await agentesApi.update(agente.id, { system_prompt_override: prompt, status: 'inativo' })
      onSalvo()
      onClose()
    } catch { setErro('Erro ao salvar. Tente novamente.') }
    finally { setSalvando(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Ajustar prompt</h2>
            <p className="text-xs text-gray-400 mt-0.5">{agente.nome} · ajustes salvos requerem re-certificação</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><X size={18} /></button>
        </div>
        <div className="flex flex-col gap-4 p-6 overflow-y-auto flex-1">
          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Prompt atual</label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              rows={14}
              className="w-full text-xs font-mono border border-gray-200 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/40 text-gray-800 leading-relaxed"
            />
          </div>
          <div className="bg-violet-50 border border-violet-100 rounded-xl p-4">
            <label className="text-xs font-semibold text-violet-800 mb-2 block flex items-center gap-1.5"><Brain size={12} /> Descreva o ajuste e a IA aplica</label>
            <div className="flex gap-2">
              <input
                value={instrucao}
                onChange={e => setInstrucao(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAplicarIA()}
                placeholder='Ex: "adicionar concorrente HubSpot na seção de objeções"'
                className="flex-1 text-xs border border-violet-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white"
              />
              <button onClick={handleAplicarIA} disabled={aplicando || !instrucao.trim()}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50">
                {aplicando ? <Loader2 size={12} className="animate-spin" /> : <Brain size={12} />}
                {aplicando ? 'Aplicando...' : 'Aplicar'}
              </button>
            </div>
          </div>
          {erro && <p className="text-xs text-red-600 font-medium">{erro}</p>}
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">Cancelar</button>
          <button onClick={handleSalvar} disabled={salvando || !prompt.trim()}
            className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold bg-brand text-white rounded-xl hover:bg-brand/90 transition-colors disabled:opacity-50">
            {salvando ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {salvando ? 'Salvando...' : 'Salvar ajuste'}
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
  onRegenerarPrompt,
  onAjustarPrompt,
  duplicating,
  deleting,
  precisaAtualizar,
}: {
  agente: AgenteMock
  onHorarios: () => void
  onEditar: () => void
  onDuplicar: () => void
  onAtivar: () => void
  onDeletar: () => void
  onRegenerarPrompt: () => void
  onAjustarPrompt: () => void
  duplicating?: boolean
  deleting?: boolean
  precisaAtualizar?: boolean
}) {
  const pendenteCertificacao = agente.status === 'pendente_certificacao'
  const emTreinamento = pendenteCertificacao || agente.status === 'em_treinamento' || agente.status === 'inativo'
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
                pendenteCertificacao
                  ? 'bg-orange-50 text-orange-700 border border-orange-200'
                  : emTreinamento
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                {pendenteCertificacao ? 'Aguardando certificação' : emTreinamento ? 'Configurando' : 'Ativo'}
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
        ) : pendenteCertificacao ? (
          <div className="flex items-center gap-1.5">
            <Brain size={12} className="text-orange-500 shrink-0" />
            <span className="text-xs text-gray-500">Passe pelos <span className="font-medium text-gray-700">5 cenários</span> no Simulador para ativar</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <Brain size={12} className="text-amber-500 shrink-0" />
            <span className="text-xs text-gray-500">Certifique no <span className="font-medium text-gray-700">Simulador</span> antes de ativar</span>
          </div>
        )}

        {/* Ações */}
        <div className="flex items-center gap-1 pt-2 border-t border-gray-100">
          <button onClick={onEditar} title="Editar configurações"
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900">
            <Pencil size={12} /> Editar
          </button>
          {agente.system_prompt_override && (
            <button onClick={onAjustarPrompt} title="Ajustar prompt gerado pela IA"
              className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg hover:bg-violet-50 transition-colors text-violet-600 hover:text-violet-800">
              <Brain size={12} /> Prompt
            </button>
          )}
          <button onClick={onHorarios} title="Horários"
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900">
            <Clock size={12} /> Horários
          </button>
          <button onClick={onDuplicar} disabled={duplicating} title="Duplicar"
            className="flex items-center gap-1 text-xs font-medium p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 disabled:opacity-40">
            {duplicating ? <Loader2 size={13} className="animate-spin" /> : <Copy size={13} />}
          </button>
          <div className="relative">
            <button onClick={onRegenerarPrompt} title={precisaAtualizar ? "20+ ligações novas — atualizar prompt com CI" : "Atualizar prompt com aprendizados do CI"}
              className={`p-1.5 rounded-lg transition-colors ${precisaAtualizar ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'hover:bg-brand/10 text-brand/60 hover:text-brand'}`}>
              <RefreshCw size={13} />
            </button>
            {precisaAtualizar && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </div>
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
  const [tela, setTela] = useState<'grid' | 'wizard'>(() => {
    const d = loadDraft(); return d?.tela === 'wizard' ? 'wizard' : 'grid'
  })
  const [agenteHorarios, setAgenteHorarios] = useState<AgenteMock | null>(null)
  const [step, setStep] = useState<number>(() => {
    const d = loadDraft(); return typeof d?.step === 'number' ? d.step : 0
  })
  const [form, setForm] = useState<FormData>(() => {
    const d = loadDraft(); return d?.form ? { ...INITIAL_FORM, ...d.form } : INITIAL_FORM
  })
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [activated, setActivated] = useState(false)
  const [activating, setActivating] = useState(false)
  const [activateError, setActivateError] = useState('')
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [agenteAtivacao, setAgenteAtivacao] = useState<AgenteMock | null>(null)
  const [novoAgenteId, setNovoAgenteId] = useState<string>('')
  const [agenteAjuste, setAgenteAjuste] = useState<AgenteMock | null>(null)
  const [sincronizando, setSincronizando] = useState(false)
  const [syncFeedback, setSyncFeedback] = useState<{ ok: boolean; msg: string } | null>(null)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [promptStatuses, setPromptStatuses] = useState<Record<string, boolean>>({})
  const [objecoes, setObjecoes] = useState<Objecao[]>(INITIAL_OBJECOES)
  const ABORDAGENS_VAZIAS: Abordagem[] = [
    { id: 'a1', tipo: 'personalizado', texto: '', selecionada: true },
    { id: 'a2', tipo: 'personalizado', texto: '', selecionada: true },
    { id: 'a3', tipo: 'personalizado', texto: '', selecionada: true },
  ]
  const [abordagens, setAbordagens] = useState<Abordagem[]>(ABORDAGENS_VAZIAS)
  const OBJECOES_CANAL_DEFAULTS: ObjecaoCanal[] = [
    { id: '1', fixo: true, objecao: 'Me manda um e-mail com informações primeiro.', rebuttal: '' },
    { id: '2', fixo: true, objecao: 'Me manda no WhatsApp.', rebuttal: '' },
    { id: '3', fixo: true, objecao: 'Me liga em outro momento / Tô ocupado agora.', rebuttal: '' },
    { id: '4', fixo: true, objecao: 'Fala com minha assistente / secretária.', rebuttal: '' },
    { id: '5', fixo: true, objecao: 'Não sou eu quem decide isso.', rebuttal: '' },
  ]
  const [objecoesCanal, setObjecoesCanal] = useState<ObjecaoCanal[]>(OBJECOES_CANAL_DEFAULTS)
  const [perguntas, setPerguntas] = useState<string[]>(['', '', ''])
  const [materiais, setMateriais] = useState<Material[]>([{ file: null, tipo: '', texto: '', analise: null, extraindo: false, erro: null }])
  const [scriptFiles, setScriptFiles] = useState<File[]>([])
  const [ligSucesso, setLigSucesso] = useState<LigacaoRef[]>([{ file: null, resultado: 'sucesso', transcricao: '', resumo: null, transcrevendo: false, erro: null }])
  const [ligInsucesso, setLigInsucesso] = useState<LigacaoRef[]>([{ file: null, resultado: 'insucesso', transcricao: '', resumo: null, transcrevendo: false, erro: null }])
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

  function handlePerguntasChange(p: string[]) {
    setPerguntas(p)
    // Sincroniza os 3 primeiros para compatibilidade com gerar-prompt
    onChange('wiz-qualif-q1', p[0] || '')
    onChange('wiz-qualif-q2', p[1] || '')
    onChange('wiz-qualif-q3', p[2] || '')
  }

  // Limpa feedback ao trocar de tela
  useEffect(() => { setSyncFeedback(null) }, [tela])

  // Restaura arrays do draft na primeira montagem
  useEffect(() => {
    const d = loadDraft()
    if (!d) return
    if (d.objecoes?.length) setObjecoes(d.objecoes)
    if (d.perguntas?.length) setPerguntas(d.perguntas)
    if (d.abordagens?.length) setAbordagens(d.abordagens)
    if (d.objecoesCanal?.length) setObjecoesCanal(d.objecoesCanal)
    if (d.materiais?.length) setMateriais(d.materiais.map((m: any) => ({ ...m, file: null, extraindo: false, erro: null })))
    if (d.ligSucesso?.length) setLigSucesso(d.ligSucesso.map((l: any) => ({ ...l, file: null, transcrevendo: false, erro: null })))
    if (d.ligInsucesso?.length) setLigInsucesso(d.ligInsucesso.map((l: any) => ({ ...l, file: null, transcrevendo: false, erro: null })))
  }, [])

  // Persiste wizard no localStorage a cada mudança relevante
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        step, tela, form, perguntas, objecoes, abordagens, objecoesCanal,
        materiais: materiais.map(m => ({ tipo: m.tipo, texto: m.texto, textoRaw: m.textoRaw, analise: m.analise })),
        ligSucesso: ligSucesso.map(l => ({ resultado: l.resultado, transcricao: l.transcricao, resumo: l.resumo })),
        ligInsucesso: ligInsucesso.map(l => ({ resultado: l.resultado, transcricao: l.transcricao, resumo: l.resumo })),
      }))
    } catch {}
  }, [step, tela, form, perguntas, objecoes, abordagens, objecoesCanal, materiais, ligSucesso, ligInsucesso])

  const { data: agentesRaw = [], refetch: refetchAgentes } = useQuery({
    queryKey: ['agentes'],
    queryFn: () => agentesApi.list().then(r => {
      const lista = r.data as Record<string, unknown>[]
      carregarPromptStatuses(lista)
      return lista
    }),
  })

  async function carregarPromptStatuses(lista: any[]) {
    const statuses: Record<string, boolean> = {}
    await Promise.allSettled(
      lista.filter(a => a.prompt_gerado).map(async (a: any) => {
        try {
          const { data } = await agentesApi.promptStatus(a.id)
          statuses[a.id] = (data as any).precisa_atualizar ?? false
        } catch { statuses[a.id] = false }
      })
    )
    setPromptStatuses(statuses)
  }

  const agentes: AgenteMock[] = agentesRaw.map((a, i) => normalizeAgente(a, i))


  function onChange(k: keyof FormData, v: string) {
    setForm(prev => ({ ...prev, [k]: v }))
    setErrors(prev => ({ ...prev, [k]: undefined }))
  }

  function saveStep(s: number) {
    setStep(s)
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof FormData, string>> = {}
    // Step 0 = Objetivo — sem validação obrigatória
    // Step 1 = Empresa e Produto
    if (step === 1 && !form['nome-agente'].trim()) {
      newErrors['nome-agente'] = 'Nome do agente é obrigatório'
    }
    if (step === 1 && !form['empresa-nome'].trim()) {
      newErrors['empresa-nome'] = 'Nome da empresa é obrigatório'
    }
    if (step === 1 && !form['empresa-site'].trim()) {
      newErrors['empresa-site'] = 'Informe pelo menos um site — necessário para a IA pesquisar'
    }
    if (step === 1 && !form['prod-nome'].trim()) {
      newErrors['prod-nome'] = 'Nome do produto é obrigatório'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function next() {
    if (!validate()) return
    // Step 3 — Abordagens de Abertura: exige ao menos 1 selecionada
    const s = Math.min(step + 1, STEPS.length - 1)
    saveStep(s)
  }

  function prev() {
    const s = Math.max(step - 1, 0)
    saveStep(s)
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
      objetivo: form['objetivo'],
      whatsapp_numero: form['whatsapp-numero'] || undefined,
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
      gatilhos_fechamento: form['gatilhos-fechamento'],
      cenario_dores: form['cenario-dores'],
      perguntas_qualificacao: [form['wiz-qualif-q1'], form['wiz-qualif-q2'], form['wiz-qualif-q3']].filter(Boolean),
      script_abertura: form['script-abertura'],
      script_ligacao: form['script-ligacao'],
      metodologia: form['metodologia'],
      objecoes: objecoes.filter(o => o.objecao.trim()),
      regioes_cobertura: null,
      compliance_anatel: form['compliance-anatel'] === 'true',
      compliance_optout: form['compliance-optout'] === 'true',
      voz_id: form['voz'],
      tom: form['tom'],
      agendamento_estrategia: form['agendamento-estrategia'],
      agendamento_antecedencia: form['agendamento-antecedencia'],
      agendamento_opcoes: form['agendamento-opcoes'],
      agendamento_tom: form['agendamento-tom'],
      agendamento_duracao: form['agendamento-duracao'],
      agendamento_apresentar_vendedor: form['agendamento-apresentar-vendedor'],
      agendamento_recusa: form['agendamento-recusa'],
      agendamento_urgencia: form['agendamento-urgencia'],
      system_prompt_override: form['prompt_gerado'] || undefined,
      status: 'inativo',
    }
    try {
      setActivatingStep(1)
      let agenteId: string = editandoId || ''
      if (editandoId) {
        await agentesApi.update(editandoId, payload)
      } else {
        const res = await agentesApi.create(payload)
        agenteId = (res.data as { id?: string })?.id || ''
      }
      setActivatingStep(2)

      // Upload de materiais + scripts (silencioso — não bloqueia ativação se falhar)
      const comArquivo = materiais.filter(m => m.file !== null)
      const scriptsMaterial = scriptFiles.map((f, i) => ({ file: f, tipo: scriptFiles.length > 1 ? `Script de Ligação ${i + 1}` : 'Script de Ligação' }))
      const todosArquivos = [...comArquivo, ...scriptsMaterial]
      if (todosArquivos.length > 0 && agenteId) {
        try {
          const fd = new FormData()
          todosArquivos.forEach(m => {
            fd.append('files', m.file!)
            fd.append('tipos', m.tipo || 'Outro')
          })
          const token = localStorage.getItem('youagent_jwt')
          await fetch(
            `${import.meta.env.VITE_API_URL || 'https://app.etztech.com'}/api/v1/agentes/${agenteId}/materiais`,
            {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
              body: fd,
            }
          )
        } catch {
          // silently ignore — materiais são opcionais
        }
      }

      // Upload de ligações de referência (sucesso + insucesso) — silencioso
      const todasLig = [
        ...ligSucesso.filter(l => l.file).map(l => ({ ...l, resultado: 'sucesso' as const })),
        ...ligInsucesso.filter(l => l.file).map(l => ({ ...l, resultado: 'insucesso' as const })),
      ]
      if (todasLig.length > 0 && agenteId) {
        try {
          const fdLig = new FormData()
          todasLig.forEach(l => {
            fdLig.append('files', l.file!)
            fdLig.append('resultados', l.resultado)
            fdLig.append('observacoes', '')
          })
          const token = localStorage.getItem('youagent_jwt')
          await fetch(
            `${import.meta.env.VITE_API_URL || 'https://app.etztech.com'}/api/v1/agentes/${agenteId}/ligacoes-referencia`,
            { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fdLig }
          )
        } catch { /* silencioso */ }
      }

      await new Promise(r => setTimeout(r, 600))
      setActivatingStep(3)
      await new Promise(r => setTimeout(r, 400))
      setNovoAgenteId(agenteId)
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
      gatilhos_fechamento?: string
      cenario_dores?: string
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
      'gatilhos-fechamento': raw.gatilhos_fechamento || '',
      'cenario-dores': raw.cenario_dores || '',
      'wiz-qualif-q1': pergs[0] ?? INITIAL_FORM['wiz-qualif-q1'],
      'wiz-qualif-q2': pergs[1] ?? INITIAL_FORM['wiz-qualif-q2'],
      'wiz-qualif-q3': pergs[2] ?? INITIAL_FORM['wiz-qualif-q3'],
      'script-abertura': raw.script_abertura || '',
      'metodologia': raw.metodologia || '',
      'compliance-anatel': (raw as any).compliance_anatel === false ? 'false' : 'true',
      'compliance-optout': (raw as any).compliance_optout === false ? 'false' : 'true',

      voz: agente.voz || INITIAL_FORM.voz,
      tom: agente.tom || '',
    })
    setObjecoes(raw.objecoes && raw.objecoes.length > 0 ? raw.objecoes : INITIAL_OBJECOES)
    setMateriais([{ file: null, tipo: '', texto: '', analise: null, extraindo: false, erro: null }])
    setAbordagens(ABORDAGENS_VAZIAS)
    setObjecoesCanal(OBJECOES_CANAL_DEFAULTS)
    setLigSucesso([{ file: null, resultado: 'sucesso', transcricao: '', resumo: null, transcrevendo: false, erro: null }])
    setLigInsucesso([{ file: null, resultado: 'insucesso', transcricao: '', resumo: null, transcrevendo: false, erro: null }])
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

  async function handleRegenerarPrompt(agenteId: string) {
    if (!window.confirm('Atualizar o prompt deste agente com os aprendizados do CI? O agente continuará funcionando normalmente durante o processo.')) return
    try {
      const { data } = await agentesApi.regenerarPrompt(agenteId)
      if (data.jobId) {
        let attempts = 0
        const interval = setInterval(async () => {
          attempts++
          if (attempts > 60) { clearInterval(interval); return }
          try {
            const { data: status } = await agentesApi.regenerarPromptStatus(data.jobId)
            if (status.status === 'done') {
              clearInterval(interval)
              window.alert('Prompt atualizado com sucesso! O agente já está mais inteligente.')
              refetchAgentes()
            } else if (status.status === 'error') {
              clearInterval(interval)
              window.alert('Erro ao atualizar: ' + (status.error || 'erro desconhecido'))
            }
          } catch { clearInterval(interval) }
        }, 3000)
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      window.alert('Erro: ' + (e?.response?.data?.error || 'tente novamente'))
    }
  }

  function reset() {
    setForm(INITIAL_FORM)
    setObjecoes(INITIAL_OBJECOES)
    setPerguntas(['', '', ''])
    setMateriais([{ file: null, tipo: '', texto: '', analise: null, extraindo: false, erro: null }])
    setAbordagens(ABORDAGENS_VAZIAS)
    setObjecoesCanal(OBJECOES_CANAL_DEFAULTS)
    setScriptFiles([])
    setLigSucesso([{ file: null, resultado: 'sucesso', transcricao: '', resumo: null, transcrevendo: false, erro: null }])
    setLigInsucesso([{ file: null, resultado: 'insucesso', transcricao: '', resumo: null, transcrevendo: false, erro: null }])
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
    'Objetivo do agente',
    'Empresa e produto',
    'Qualificação & Objeções',
    'ICP & Sinais de compra',
    'Cenário & Dores',
    'Gatilhos de Fechamento',
    'Público-alvo',
    'Metodologia de vendas',
    'Roteiro & Materiais',
    'Ligações de Referência',
    'Voz e tom do agente',
    'Estratégia de Agendamento',
    'Calibração de Voz',
    'Revisão & Ativação',
  ]

  // ── Tela: grid de agentes ──────────────────────────────────────────────────
  if (tela === 'grid') {
    const ativos = agentes.filter(a => a.status === 'ativo').length
    const emTreinamento = agentes.filter(a => a.status !== 'ativo').length

    return (
      <div className="min-h-screen bg-gray-50">

        {/* Modal de boas-vindas — exibido ao clicar em "Criar novo agente" */}
        {showBemVindo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">

              {/* Header com gradiente */}
              <div className="bg-gradient-to-br from-brand to-violet-700 px-7 pt-7 pb-6 relative">
                <button onClick={() => setShowBemVindo(false)} className="absolute top-4 right-4 text-white/50 hover:text-white/90 transition-colors">
                  <X size={18} />
                </button>
                <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center mb-4">
                  <Brain size={22} className="text-white" />
                </div>
                <h2 className="text-lg font-bold text-white leading-snug mb-1">Seu agente aprende antes de discar</h2>
                <p className="text-sm text-white/75 leading-relaxed">
                  Tudo que você preencher aqui vai direto para a memória do agente — quanto mais completo, mais preciso ele será desde a primeira ligação.
                </p>
              </div>

              {/* Fases */}
              <div className="px-6 pt-5 pb-4 space-y-3">
                {[
                  {
                    num: '1', color: 'bg-brand/10 text-brand', title: 'Treinamento inicial',
                    desc: 'Você preenche empresa, produto, ICP, scripts e objeções — 14 etapas que formam a base do agente.',
                  },
                  {
                    num: '2', color: 'bg-emerald-50 text-emerald-600', title: 'Aprendizado após cada ligação',
                    desc: 'O agente detecta o que funciona e melhora automaticamente. Cada transferência vira inteligência.',
                  },
                  {
                    num: '3', color: 'bg-violet-50 text-violet-600', title: 'Enriquecimento contínuo',
                    desc: 'Adicione PDFs, ebooks e ligações no Centro de Inteligência — cada material torna o agente mais persuasivo.',
                  },
                ].map(({ num, color, title, desc }) => (
                  <div key={num} className="flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-lg ${color} flex items-center justify-center shrink-0 font-bold text-xs mt-0.5`}>{num}</div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Rodapé */}
              <div className="px-6 pb-6 pt-2 border-t border-gray-100 mt-1">
                <button
                  onClick={() => {
                    localStorage.setItem('etz_aceite_treinamento', JSON.stringify({
                      aceito_em: new Date().toISOString(),
                      user: localStorage.getItem('youagent_jwt') ? 'autenticado' : 'anonimo',
                    }))
                    localStorage.removeItem(DRAFT_KEY)
                    setShowBemVindo(false)
                    setForm(INITIAL_FORM)
                    setObjecoes(INITIAL_OBJECOES)
                    setPerguntas(['', '', ''])
                    setMateriais([{ file: null, tipo: '', texto: '', analise: null, extraindo: false, erro: null }])
                    setAbordagens(ABORDAGENS_VAZIAS)
                    setObjecoesCanal(OBJECOES_CANAL_DEFAULTS)
                    setLigSucesso([{ file: null, resultado: 'sucesso', transcricao: '', resumo: null, transcrevendo: false, erro: null }])
                    setLigInsucesso([{ file: null, resultado: 'insucesso', transcricao: '', resumo: null, transcrevendo: false, erro: null }])
                    setStep(0)
                    setEditandoId(null)
                    setActivated(false)
                    setTela('wizard')
                  }}
                  className="w-full mt-4 inline-flex items-center justify-center gap-2 px-5 py-3 bg-brand text-white text-sm font-semibold rounded-xl hover:bg-brand/90 transition-colors shadow-sm"
                >
                  Entendi, vamos começar
                  <ChevronRight size={15} />
                </button>
                <p className="text-[10px] text-gray-400 text-center mt-3 leading-relaxed">
                  Ao continuar você confirma que compreendeu como funciona o treinamento. Aceite registrado com data e hora.
                </p>
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
                    onRegenerarPrompt={() => handleRegenerarPrompt(agente.id)}
                    onAjustarPrompt={() => setAgenteAjuste(agente)}
                    duplicating={duplicatingId === agente.id}
                    deleting={deletingId === agente.id}
                    precisaAtualizar={promptStatuses[agente.id] ?? false}
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
        {agenteAjuste && (
          <ModalAjustarPrompt
            agente={agenteAjuste}
            onClose={() => setAgenteAjuste(null)}
            onSalvo={() => { refetchAgentes(); setAgenteAjuste(null) }}
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
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center">
              <Bot size={20} className="text-brand" />
            </div>
            <span className="text-xl font-bold text-gray-900">{editandoId ? 'Editar Agente' : 'Novo Agente de IA'}</span>
          </div>
          <p className="text-sm text-gray-500">{editandoId ? `Editando: ${form['nome-agente'] || form['empresa-nome']}` : `Configure seu agente de vendas autônomo em ${STEPS.length} etapas`}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <StepIndicator current={step} />
          <ProgressBar step={step} />

          <h2 className="text-xl font-bold text-gray-900 mb-6">{stepTitles[step]}</h2>

          {step === 0 && <StepObjetivo form={form} onChange={onChange} />}
          {step === 1 && <Step1 form={form} onChange={onChange} errors={errors} materiais={materiais} onMateriaisChange={setMateriais} />}
          {step === 2 && (
            <StepQualificacao
              form={form}
              onChange={onChange}
              objecoes={objecoes}
              onObjecoesChange={setObjecoes}
              perguntas={perguntas}
              onPerguntasChange={handlePerguntasChange}
            />
          )}
          {step === 3 && <Step3 form={form} onChange={onChange} />}
          {step === 4 && (
            <StepAbordagensAbertura
              form={form}
              abordagens={abordagens}
              onAbordagensChange={setAbordagens}
              objecoes={objecoes}
              perguntas={perguntas}
            />
          )}
          {step === 5 && (
            <StepObjecoesCanal
              form={form}
              objecoesCanal={objecoesCanal}
              onObjecoesCanalChange={setObjecoesCanal}
              abordagens={abordagens}
              objecoes={objecoes}
              perguntas={perguntas}
            />
          )}
          {step === 6 && <StepCenarioDores form={form} onChange={onChange} />}
          {step === 7 && <StepGatilhosFechamento form={form} onChange={onChange} objecoes={objecoes} abordagens={abordagens} />}
          {step === 8 && <StepPublicoAlvo form={form} onChange={onChange} />}
          {step === 9 && <StepMetodologia form={form} onChange={onChange} />}
          {step === 10 && <StepScriptLigacao form={form} onChange={onChange} onScriptFilesChange={setScriptFiles} />}
          {step === 11 && (
            <StepLigacoesReferencia
              ligacoesSucesso={ligSucesso} onSucessoChange={setLigSucesso}
              ligacoesInsucesso={ligInsucesso} onInsucessoChange={setLigInsucesso}
              form={form}
            />
          )}
          {step === 12 && <StepVozTom form={form} onChange={onChange} />}
          {step === 13 && <StepAgendamento form={form} onChange={onChange} />}
          {step === 14 && <StepCalibracaoVoz form={form} onChange={onChange} objecoes={objecoes} perguntas={perguntas} ligSucesso={ligSucesso} ligInsucesso={ligInsucesso} abordagens={abordagens} objecoesCanal={objecoesCanal} />}
          {step === 15 && (
            <Step4
              materiais={materiais}
              form={form}
              onChange={onChange}
              activated={activated}
              activating={activating}
              activatingStep={activatingStep}
              objecoes={objecoes}
              onActivate={handleActivate}
              onReset={reset}
              modoEdicao={!!editandoId}
              ligacoesSucesso={ligSucesso}
              ligacoesInsucesso={ligInsucesso}
              novoAgenteId={novoAgenteId}
              abordagens={abordagens}
              objecoesCanal={objecoesCanal}
              perguntas={perguntas}
            />
          )}
          {activateError && (
            <div className="mt-3 flex items-center gap-2 p-3 rounded-xl text-sm"
                 style={{ background: 'rgba(254,242,242,0.9)', border: '1px solid rgba(252,165,165,0.5)', color: '#dc2626' }}>
              {activateError}
            </div>
          )}

          {!(step === 15 && activated) && (
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
              <button
                onClick={step === 0 ? () => setTela('grid') : prev}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                <ChevronLeft size={15} /> {step === 0 ? 'Cancelar' : 'Anterior'}
              </button>
              {step < STEPS.length - 1 && (
                <button
                  onClick={next}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-brand rounded-xl hover:bg-brand-600 transition-colors shadow-sm"
                >
                  Próximo <ChevronRight size={15} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
