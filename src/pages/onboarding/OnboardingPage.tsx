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
  Play,
  CalendarCheck,

  Plus,
  FileText,
  Upload,
  MessageCircle,
  TrendingUp,
  DollarSign,
  ClipboardList,
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
  'prompt_gerado': string
  'cenario-dores': string
  'gatilhos-fechamento': string
}

interface Objecao {
  objecao: string
  rebuttal: string
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
  'prompt_gerado': '',
  'cenario-dores': '',
  'gatilhos-fechamento': '',
}

const INITIAL_OBJECOES: Objecao[] = [
  { objecao: '', rebuttal: '' },
  { objecao: '', rebuttal: '' },
  { objecao: '', rebuttal: '' },
]

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
  { label: 'Cenário & Dores', icon: Brain },
  { label: 'Gatilhos de Fechamento', icon: Zap },
  { label: 'Público-alvo', icon: Target },
  { label: 'Metodologia', icon: BarChart2 },
  { label: 'Roteiro & Materiais', icon: FileText },
  { label: 'Ligações de Referência', icon: Mic },
  { label: 'Voz e Tom', icon: Mic },
  { label: 'Revisão & Ativação', icon: Zap },
]

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
  texto: string
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
      const { data } = await agentesApi.extrairScript(file, tipoAtual || 'material')
      if (data.texto) {
        // Para materiais: usa texto_filtrado (sem ruído) se disponível; fallback para texto bruto
        const textoParaUsar = (data as { texto_filtrado?: string }).texto_filtrado || data.texto
        const next = materiais.map((m, idx) =>
          idx === i ? { ...m, file, extraindo: false, texto: textoParaUsar, analise: data.resumo || null, erro: null } : m
        )
        onMateriaisChange(next)
        syncConteudo(next)
      } else {
        updateItem(i, { extraindo: false, erro: 'Não foi possível extrair texto. Use PDF, Word ou TXT.', file: null })
      }
    } catch {
      updateItem(i, { extraindo: false, erro: 'Erro ao processar o arquivo. Tente outro formato.', file: null })
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
                rows={m.file && m.texto ? 5 : 6}
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
      setIaPesquisouSite(true)
    } catch (err: unknown) {
      const axiosData = (err as { response?: { data?: { error?: string } } })?.response?.data
      const msg = axiosData?.error ?? (err instanceof Error ? err.message : 'Erro ao pesquisar')
      setPesquisaErro(`Erro: ${msg}`)
    } finally {
      setPesquisando(false)
    }
  }

  const aiPreencheu = iaPesquisouSite

  return (
    <div className="flex flex-col gap-5">

      {/* ── Banner IA ──────────────────────────────────────────────────────── */}
      <div className={`rounded-2xl border p-4 transition-all ${
        aiPreencheu
          ? 'bg-emerald-50 border-emerald-200'
          : 'bg-gradient-to-r from-brand-50 to-violet-50 border-brand-100'
      }`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              aiPreencheu ? 'bg-emerald-100' : 'bg-white border border-brand-100'
            }`}>
              {aiPreencheu
                ? <Check size={16} className="text-emerald-600" strokeWidth={3} />
                : <Brain size={16} className="text-brand" />
              }
            </div>
            <div>
              <p className={`text-sm font-semibold ${aiPreencheu ? 'text-emerald-800' : 'text-gray-900'}`}>
                {aiPreencheu ? 'IA preencheu os campos — revise e ajuste' : 'Deixa a IA preencher por você'}
              </p>
              <p className={`text-xs mt-0.5 leading-relaxed ${aiPreencheu ? 'text-emerald-700' : 'text-gray-500'}`}>
                {aiPreencheu
                  ? 'Os campos foram preenchidos automaticamente. Revise, complemente e corrija o que precisar antes de avançar.'
                  : 'Informe o site e clique em Pesquisar — a IA extrai dados reais, pesquisa concorrentes, objeções e preenche tudo automaticamente.'
                }
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={pesquisarComIA}
            disabled={pesquisando}
            className={`shrink-0 flex items-center gap-2 text-sm px-4 py-2.5 font-semibold rounded-xl transition-all shadow-sm disabled:opacity-60 whitespace-nowrap ${
              aiPreencheu
                ? 'bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                : 'bg-brand text-white hover:bg-brand-600'
            }`}
          >
            {pesquisando
              ? <><Loader2 size={14} className="animate-spin" /> Pesquisando...</>
              : aiPreencheu
              ? <><RefreshCw size={14} /> Repesquisar</>
              : <><Brain size={14} /> Pesquisar com IA</>
            }
          </button>
        </div>
        {pesquisaErro && (
          <p className="text-xs text-red-600 mt-2 flex items-center gap-1.5">
            <AlertTriangle size={11} className="shrink-0" /> {pesquisaErro}
          </p>
        )}
      </div>

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
        </div>
        <MateriaisUpload materiais={materiais} onMateriaisChange={onMateriaisChange} onConteudoChange={v => onChange('materiais-conteudo', v)} />
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

// ─── Step 2 — Qualificação & Objeções (IA sugere baseado no Step 1) ──────────
function StepQualificacao({
  form,
  onChange,
  objecoes,
  onObjecoesChange,
}: {
  form: FormData
  onChange: (k: keyof FormData, v: string) => void
  objecoes: Objecao[]
  onObjecoesChange: (o: Objecao[]) => void
}) {
  const [gerando, setGerando] = useState(false)
  const [erroGeracao, setErroGeracao] = useState('')
  const jaGerou = form['wiz-qualif-q1'] || objecoes.some(o => o.objecao)

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
        onChange('wiz-qualif-q1', data.perguntas[0] || '')
        onChange('wiz-qualif-q2', data.perguntas[1] || '')
        onChange('wiz-qualif-q3', data.perguntas[2] || '')
      }
      if (data.objecoes?.length) {
        onObjecoesChange(data.objecoes.slice(0, 5))
      }
    } catch {
      setErroGeracao('Não foi possível gerar sugestões. Preencha manualmente.')
    } finally {
      setGerando(false)
    }
  }

  function updateObjecao(i: number, field: keyof Objecao, value: string) {
    onObjecoesChange(objecoes.map((o, idx) => idx === i ? { ...o, [field]: value } : o))
  }
  function addObjecao() {
    if (objecoes.length < 5) onObjecoesChange([...objecoes, { objecao: '', rebuttal: '' }])
  }
  function removeObjecao(i: number) {
    if (objecoes.length > 1) onObjecoesChange(objecoes.filter((_, idx) => idx !== i))
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
        <p className="text-xs text-gray-400 mb-3">O agente fará uma pergunta por vez, aguardando a resposta antes de avançar.</p>
        <div className="flex flex-col gap-2">
          {(['wiz-qualif-q1', 'wiz-qualif-q2', 'wiz-qualif-q3'] as const).map((k, i) => (
            <div key={k} className="flex items-center gap-2">
              <span className="text-xs font-semibold text-brand w-5 shrink-0">{i + 1}.</span>
              <input
                id={k}
                className={inputCls}
                value={form[k]}
                onChange={e => onChange(k, e.target.value)}
                placeholder={gerando ? 'Aguardando geração...' : `Pergunta ${i + 1}`}
                disabled={gerando}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Objeções */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-medium text-gray-700">Objeções e respostas</p>
            <p className="text-xs text-gray-400 mt-0.5">Como o agente responde quando o contato hesitar.</p>
          </div>
          {objecoes.length < 5 && (
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
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Step 5 — Gatilhos de Fechamento ─────────────────────────────────────────
function StepGatilhosFechamento({ form, onChange }: {
  form: FormData
  onChange: (k: keyof FormData, v: string) => void
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
        resultados_clientes: form['prod-resultados'],
        descricao_produto: form['prod-descricao'],
        cenario_dores: form['cenario-dores'],
        perguntas: [form['wiz-qualif-q1'], form['wiz-qualif-q2'], form['wiz-qualif-q3']].filter(Boolean).join(' | '),
        materiais_conteudo: form['materiais-conteudo'],
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
  texto: string
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
  function syncForm(updatedSlots: ScriptSlot[]) {
    const textos = updatedSlots.map((s, i) =>
      updatedSlots.length > 1 && s.texto.trim()
        ? `=== SCRIPT ${i + 1}${s.fileName ? ` (${s.fileName})` : ''} ===\n${s.texto.trim()}`
        : s.texto.trim()
    ).filter(Boolean)
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
      const { data } = await agentesApi.extrairScript(file)
      if (data.texto) {
        updateSlot(id, { texto: data.texto, analise: data.resumo || null, extraindo: false })
      } else {
        updateSlot(id, { extraindo: false, erro: 'Não foi possível extrair texto. Verifique se é PDF, Word ou TXT válido.', fileName: null })
      }
    } catch {
      updateSlot(id, { extraindo: false, erro: 'Erro ao processar o arquivo. Cole o texto manualmente.', fileName: null })
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
        resultados_clientes: form['prod-resultados'],
        concorrentes: form['prod-concorrentes'],
        descricao_produto: form['prod-descricao'],
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

interface LigacaoRef { file: File | null; observacao: string; resultado: 'sucesso' | 'insucesso' }

function LigacoesSection({
  tipo, items, onChange,
}: {
  tipo: 'sucesso' | 'insucesso'
  items: LigacaoRef[]
  onChange: (items: LigacaoRef[]) => void
}) {
  const refs = React.useRef<(HTMLInputElement | null)[]>([])
  const isSucesso = tipo === 'sucesso'

  const colors = isSucesso
    ? { dot: 'bg-emerald-500', label: 'text-emerald-700', dashedBorder: 'border-emerald-300', dashedHover: 'hover:border-emerald-400 hover:bg-emerald-50', uploadIcon: 'text-emerald-400', uploadText: 'text-emerald-700', uploadSub: 'text-emerald-500', cardBg: 'bg-emerald-50 border-emerald-200', cardText: 'text-emerald-800', cardSub: 'text-emerald-500', addBtn: 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300' }
    : { dot: 'bg-amber-500', label: 'text-amber-700', dashedBorder: 'border-amber-300', dashedHover: 'hover:border-amber-400 hover:bg-amber-50', uploadIcon: 'text-amber-400', uploadText: 'text-amber-700', uploadSub: 'text-amber-500', cardBg: 'bg-amber-50 border-amber-200', cardText: 'text-amber-800', cardSub: 'text-amber-500', addBtn: 'border-amber-200 text-amber-700 hover:bg-amber-50 hover:border-amber-300' }

  function addLinha() {
    onChange([...items, { file: null, observacao: '', resultado: tipo }])
  }
  function removeLinha(i: number) {
    if (items.length === 1) { onChange([{ file: null, observacao: '', resultado: tipo }]); return }
    onChange(items.filter((_, idx) => idx !== i))
  }
  function setFile(i: number, f: File | null) {
    onChange(items.map((m, idx) => idx === i ? { ...m, file: f } : m))
  }
  function setObs(i: number, v: string) {
    onChange(items.map((m, idx) => idx === i ? { ...m, observacao: v } : m))
  }

  const tituloSecao = isSucesso
    ? 'Ligações que converteram — o agente aprende o que funciona'
    : 'Ligações que não converteram — o agente aprende o que evitar'
  const descSecao = isSucesso
    ? 'Grave ligações onde o cliente aceitou a reunião. O agente estuda o tom, o ritmo e os argumentos que levaram ao "sim".'
    : 'Grave ligações onde o cliente recusou. O agente identifica padrões a evitar e objeções a contornar.'
  const labelGravacao = isSucesso ? 'GRAVAÇÃO DE SUCESSO' : 'GRAVAÇÃO DE REFERÊNCIA'
  const uploadLabel = isSucesso ? 'Enviar gravação — ligação que converteu' : 'Enviar gravação — ligação que não converteu'
  const obsPlaceholder = isSucesso
    ? 'Ex: CEO de fintech, usou pergunta sobre dor operacional'
    : 'Ex: Prospect resistiu em pricing, não conseguimos contornar'
  const addLabel = isSucesso ? 'Adicionar outra ligação de sucesso' : 'Adicionar outra ligação de referência'

  return (
    <div className="flex flex-col gap-4">
      {/* Título da seção */}
      <div>
        <p className={`text-sm font-semibold uppercase tracking-wide flex items-center gap-2 ${colors.label}`}>
          <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${colors.dot}`} />
          {tituloSecao}
        </p>
        <p className="text-xs text-gray-500 mt-1">{descSecao}</p>
      </div>

      {/* Cards de gravação */}
      <div className="flex flex-col gap-3">
        {items.map((m, i) => (
          <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
            {/* Header do card */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                {labelGravacao} {items.length > 1 ? i + 1 : ''}
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
                onChange={e => { setFile(i, e.target.files?.[0] ?? null); if (e.target) e.target.value = '' }} />

              {/* Zona de upload ou card de sucesso */}
              {!m.file ? (
                <div
                  onClick={() => refs.current[i]?.click()}
                  className={`flex items-center gap-3 border border-dashed ${colors.dashedBorder} rounded-lg px-4 py-3 cursor-pointer transition-colors ${colors.dashedHover}`}
                >
                  <Mic size={16} className={`shrink-0 ${colors.uploadIcon}`} />
                  <div>
                    <p className={`text-sm font-medium ${colors.uploadText}`}>{uploadLabel}</p>
                    <p className={`text-xs ${colors.uploadSub}`}>MP3, WAV, M4A ou MP4 — máx. 50MB</p>
                  </div>
                </div>
              ) : (
                <div className={`border ${colors.cardBg} rounded-lg overflow-hidden`}>
                  <div className="flex items-center justify-between px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Check size={13} className={`shrink-0 ${isSucesso ? 'text-emerald-600' : 'text-amber-600'}`} />
                      <span className={`text-xs font-semibold truncate ${colors.cardText}`}>{m.file.name}</span>
                      <span className={`text-xs shrink-0 ${colors.cardSub}`}>{(m.file.size / (1024 * 1024)).toFixed(1)}MB</span>
                    </div>
                    <button type="button" onClick={() => setFile(i, null)}
                      className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1 shrink-0 ml-2">
                      <X size={11} /> Remover
                    </button>
                  </div>
                </div>
              )}

              {/* Observação */}
              <input
                value={m.observacao}
                onChange={e => setObs(i, e.target.value)}
                placeholder={obsPlaceholder}
                className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 text-gray-700 placeholder:text-gray-300 w-full"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Botão adicionar */}
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
}: {
  ligacoesSucesso: LigacaoRef[]; onSucessoChange: (l: LigacaoRef[]) => void
  ligacoesInsucesso: LigacaoRef[]; onInsucessoChange: (l: LigacaoRef[]) => void
}) {
  return (
    <div className="flex flex-col gap-7">
      {/* Banner contextual */}
      <div className="bg-brand-50 border border-brand-100 rounded-xl px-4 py-4 flex items-start gap-3">
        <Brain size={18} className="text-brand-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-brand-800 mb-1">Por que ligações reais fazem diferença?</p>
          <p className="text-xs text-brand-700 leading-relaxed">
            Gravações humanas são o melhor material de treinamento. O sistema transcreve cada ligação com IA, extrai os argumentos, o timing e o vocabulário que funciona para o seu público — e injeta tudo no comportamento do agente.
          </p>
        </div>
      </div>

      {/* Sucesso */}
      <LigacoesSection tipo="sucesso" items={ligacoesSucesso} onChange={onSucessoChange} />

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* Insucesso */}
      <LigacoesSection tipo="insucesso" items={ligacoesInsucesso} onChange={onInsucessoChange} />

      {/* Como o sistema usa */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5">
        <p className="text-xs font-semibold text-gray-700 mb-2.5">Como o agente usa essas gravações</p>
        <ul className="space-y-1.5">
          {[
            { icon: <Check size={11} className="text-emerald-500 shrink-0 mt-0.5" />, text: 'Gravações de sucesso: replica o flow, o tom e os argumentos que converteram' },
            { icon: <X size={11} className="text-amber-500 shrink-0 mt-0.5" />, text: 'Gravações de referência: evita os padrões que não converteram e aprende a contornar objeções' },
            { icon: <Check size={11} className="text-brand-500 shrink-0 mt-0.5" />, text: 'Todas as transcrições ficam no Centro de Inteligência para ajuste fino contínuo' },
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

function StepVozTom({ form, onChange }: { form: FormData; onChange: (k: keyof FormData, v: string) => void }) {
  return (
    <div className="flex flex-col gap-6">
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
}) {
  const navigate = useNavigate()
  const [gerando, setGerando] = useState(false)
  const [erroGeracao, setErroGeracao] = useState('')
  const vozNome = VOZES_TELNYX.find(v => v.id === form.voz)?.nome ?? form.voz

  // Gera automaticamente ao montar, se ainda não gerou
  useEffect(() => {
    if (!form['prompt_gerado'] && !gerando) {
      gerarPrompt()
    }
  }, [])

  async function gerarPrompt() {
    setGerando(true)
    setErroGeracao('')
    try {
      const res = await claudeApi.gerarPrompt({
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
        perguntas: [form['wiz-qualif-q1'], form['wiz-qualif-q2'], form['wiz-qualif-q3']].filter(Boolean),
        objecoes_mapeadas: objecoes.filter(o => o.objecao.trim()),
        metodologia: form['metodologia'],
        materiais_empresa: form['materiais-conteudo'],
        script_ligacao: form['script-ligacao'],
        script_abertura: form['script-abertura'],
        voz: vozNome,
        tom: form['tom'],
      })
      onChange('prompt_gerado', (res.data as { prompt: string }).prompt || '')
    } catch {
      setErroGeracao('Não foi possível gerar o prompt. Verifique sua conexão e tente novamente.')
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
              ? 'As configurações foram salvas. O prompt atualizado já está ativo no Telnyx.'
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

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Brain size={18} className="text-brand" />
          <h3 className="text-base font-semibold text-gray-900">Prompt gerado pela IA</h3>
        </div>
        <p className="text-sm text-gray-500">
          O sistema leu todas as informações que você preencheu e montou o prompt completo do agente.
          Revise, edite se necessário, e ative.
        </p>
      </div>

      {/* Área do prompt */}
      {gerando ? (
        <div className="border border-brand/30 bg-brand/5 rounded-xl p-8 flex flex-col items-center gap-4 text-center">
          <Loader2 size={32} className="text-brand animate-spin" />
          <div>
            <p className="font-medium text-gray-800">Gerando prompt expert...</p>
            <p className="text-sm text-gray-500 mt-1">
              A IA está lendo todas as etapas e montando as instruções perfeitas para o seu agente.
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
      ) : (
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
            placeholder="O prompt será gerado automaticamente..."
          />
          <p className="text-xs text-gray-400">
            Edite livremente — este é exatamente o texto que o agente vai receber na Telnyx.
          </p>
        </div>
      )}

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
  const [materiais, setMateriais] = useState<Material[]>([{ file: null, tipo: '', texto: '', analise: null, extraindo: false, erro: null }])
  const [scriptFiles, setScriptFiles] = useState<File[]>([])
  const [ligSucesso, setLigSucesso] = useState<LigacaoRef[]>([{ file: null, observacao: '', resultado: 'sucesso' }])
  const [ligInsucesso, setLigInsucesso] = useState<LigacaoRef[]>([{ file: null, observacao: '', resultado: 'insucesso' }])
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
    // Step 0 = Objetivo — sem validação obrigatória
    // Step 1 = Empresa e Produto
    if (step === 1 && !form['nome-agente'].trim()) {
      newErrors['nome-agente'] = 'Nome do agente é obrigatório'
    }
    if (step === 1 && !form['empresa-nome'].trim()) {
      newErrors['empresa-nome'] = 'Nome da empresa é obrigatório'
    }
    if (step === 1 && !form['empresa-site'].trim()) {
      newErrors['empresa-site'] = 'Site da empresa é obrigatório — necessário para a IA pesquisar'
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
            fdLig.append('observacoes', l.observacao || '')
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
    setMateriais([{ file: null, tipo: '', texto: '', analise: null, extraindo: false, erro: null }])
    setScriptFiles([])
    setLigSucesso([{ file: null, observacao: '', resultado: 'sucesso' }])
    setLigInsucesso([{ file: null, observacao: '', resultado: 'insucesso' }])
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
            />
          )}
          {step === 3 && <Step3 form={form} onChange={onChange} />}
          {step === 4 && <StepCenarioDores form={form} onChange={onChange} />}
          {step === 5 && <StepGatilhosFechamento form={form} onChange={onChange} />}
          {step === 6 && <StepPublicoAlvo form={form} onChange={onChange} />}
          {step === 7 && <StepMetodologia form={form} onChange={onChange} />}
          {step === 8 && <StepScriptLigacao form={form} onChange={onChange} onScriptFilesChange={setScriptFiles} />}
          {step === 9 && (
            <StepLigacoesReferencia
              ligacoesSucesso={ligSucesso} onSucessoChange={setLigSucesso}
              ligacoesInsucesso={ligInsucesso} onInsucessoChange={setLigInsucesso}
            />
          )}
          {step === 10 && <StepVozTom form={form} onChange={onChange} />}
          {step === 11 && (
            <Step4
              form={form}
              onChange={onChange}
              activated={activated}
              activating={activating}
              activatingStep={activatingStep}
              objecoes={objecoes}
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

          {!(step === 11 && activated) && (
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
