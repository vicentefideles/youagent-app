import { useState } from 'react'
import { X, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import clsx from 'clsx'
import type { NovaCampanhaForm, TipoCampanha } from '@/types/campanha'

interface Props {
  agentes: { id: string; nome: string }[]
  vendedores?: { id: string; nome: string; iniciais: string; modalidade: string; funcao: string }[]
  onSalvar: (form: NovaCampanhaForm) => Promise<void>
  onFechar: () => void
}

interface TipoConfig {
  key: TipoCampanha
  icon: string
  label: string
  tag: string
  tagColor: string
  quando: string
  bullets: string[]
  aviso: string
  avisoColor: string
  ci: string
}

const TIPOS: TipoConfig[] = [
  {
    key: 'outbound',
    icon: '📞',
    label: 'SDR Outbound',
    tag: 'Mais usado',
    tagColor: 'bg-brand-100 text-brand-700',
    quando: 'Prospecção ativa — lista fria B2B',
    bullets: [
      'Agente disca para prospects que nunca ouviram falar de você',
      'Qualifica pelo ICP, detecta sinais de compra e agenda com o closer',
      'Modo padrão: cobertura máxima de gatilhos e objeções',
    ],
    aviso: 'Ideal para empresas que querem gerar pipeline do zero, sem depender de inbound.',
    avisoColor: 'bg-brand-50 border-brand-100 text-brand-800',
    ci: 'ICP Score + Gatilhos de urgência/preço + Cross-cliente ativo',
  },
  {
    key: 'inbound',
    icon: '📥',
    label: 'SDR Inbound',
    tag: 'Alta conversão',
    tagColor: 'bg-emerald-100 text-emerald-700',
    quando: 'Qualificar leads que já demonstraram interesse',
    bullets: [
      'Agente liga automaticamente para quem preencheu um formulário, clicou num anúncio ou entrou no chat',
      'SLA configurável: de 5 minutos a 2 horas após o lead chegar',
      'Lead já quente — taxa de atendimento 2-3× maior que outbound',
    ],
    aviso: 'Use quando você já tem tráfego pago ou orgânico gerando leads. O agente substitui o SDR humano na primeira resposta.',
    avisoColor: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    ci: 'ICP Score + Detecção de urgência + Tempo de resposta como gatilho',
  },
  {
    key: 'renovacao',
    icon: '🔄',
    label: 'Renovação',
    tag: 'Retenção',
    tagColor: 'bg-blue-100 text-blue-700',
    quando: 'Reativar ou expandir clientes da base ativa',
    bullets: [
      'Agente contata clientes em risco de churn ou com oportunidade de upsell',
      'Tom consultivo por padrão — foco em relacionamento, não em venda fria',
      'Usa dados de uso do produto para personalizar o argumento',
    ],
    aviso: 'Use para contratos próximos do vencimento, clientes com queda de uso ou base que ainda não expandiu o plano.',
    avisoColor: 'bg-blue-50 border-blue-200 text-blue-800',
    ci: 'ICP de churn + Gatilhos de valor/relacionamento + Histórico de interações',
  },
  {
    key: 'b2c',
    icon: '👤',
    label: 'B2C',
    tag: 'Pessoa física',
    tagColor: 'bg-amber-100 text-amber-700',
    quando: 'Venda direta para consumidores finais',
    bullets: [
      'Sem gatekeeper — agente fala diretamente com o decisor',
      'Personas ajustadas para consumidor (não empresa)',
      'Regras ANATEL para pessoa física: 9h–21h seg-sex automaticamente',
    ],
    aviso: '⚠️ Atenção: modo B2C ativa regras legais específicas de discagem para pessoa física. Verifique compliance da sua lista antes de ativar.',
    avisoColor: 'bg-amber-50 border-amber-200 text-amber-800',
    ci: 'Perfil de consumidor + Gatilhos B2C + Compliance ANATEL automático',
  },
  {
    key: 'nurturing',
    icon: '🌱',
    label: 'Nurturing',
    tag: 'Multi-toque',
    tagColor: 'bg-violet-100 text-violet-700',
    quando: 'Leads que precisam de mais tempo para decidir',
    bullets: [
      'Sequência programada de 30 a 90 dias: ligações + e-mails + WhatsApp',
      'Cada toque usa argumentos diferentes para não repetir abordagem',
      'Ideal para enterprise ou tickets altos com ciclo longo de vendas',
    ],
    aviso: 'Use quando o lead reconhece o problema mas ainda não está pronto para decidir. O agente mantém presença sem ser invasivo.',
    avisoColor: 'bg-violet-50 border-violet-200 text-violet-800',
    ci: 'Sequência de gatilhos por fase + Aprendizado entre toques + Cross-cliente de objeções',
  },
]


const DIAS = [{ key:'seg',l:'Seg'},{key:'ter',l:'Ter'},{key:'qua',l:'Qua'},{key:'qui',l:'Qui'},{key:'sex',l:'Sex'},{key:'sab',l:'Sáb'},{key:'dom',l:'Dom'}]

interface FormState extends NovaCampanhaForm {
  // Vendedores selecionados
  vendedoresSelecionados: string[]
  // Rechamada — decisor real (gatekeeper)
  tent_redir: string
  // Orquestração
  orq_nao_atendeu_on: boolean
  orq_nao_atendeu_tent: string
  orq_nao_atendeu_canal: string
  orq_nao_atendeu_delay: string
  orq_recusou_on: boolean
  orq_recusou_acao: string
  orq_recusou_lgpd: string
  orq_agendou_on: boolean
  orq_agendou_email: string
  orq_agendou_wz: string
  orq_agendou_lembrete: string
  orq_gatekeeper_on: boolean
  orq_gk_callback: string
  orq_gk_abertura: string
  // Reunião
  tipo_local: string
  endereco_fixo: string
  pergunta_formato: string
  // Blacklist / LGPD
  blacklist: string
  lgpd_opt_out: boolean
  lgpd_excluir: boolean
  lgpd_nao_ligar: boolean
  lgpd_log: boolean
  // Distribuição
  distribuicao: string
  // Pausa almoco (select)
  pausa_almoco_val: string
  // Inbound extras
  inbound_fonte: string
  inbound_sla: string
  // Renovação extras
  ren_produto: string
  ren_churn: string
  ren_tom: string
  // B2C extras
  b2c_produto: string
  b2c_perfil: string
  b2c_volume: string
  b2c_cta: string
  // Nurturing
  nurt_duracao: string
}

const defaultForm: FormState = {
  vendedoresSelecionados: [],
  nome: '', tipo: 'outbound', estado: 'SP', cidade: '', segmento: '', modalidade: 'online',
  agente_id: '', agressividade: 'media', meta_agendamentos: '',
  hora_inicio: '09:00', hora_fim: '18:00', limite_diario: '200',
  pausa_almoco: true, pausa_almoco_val: '12-13',
  dias_operacao: ['seg','ter','qua','qui','sex'], icp_ativo: true, duracao_reuniao: '30',
  tent_redir: '3',
  orq_nao_atendeu_on: true, orq_nao_atendeu_tent: '2', orq_nao_atendeu_canal: 'whatsapp', orq_nao_atendeu_delay: '24h',
  orq_recusou_on: true, orq_recusou_acao: 'email_nutricao', orq_recusou_lgpd: 'registrar',
  orq_agendou_on: true, orq_agendou_email: 'imediato', orq_agendou_wz: 'imediato', orq_agendou_lembrete: '1h',
  orq_gatekeeper_on: true, orq_gk_callback: 'horario_sugerido', orq_gk_abertura: 'personalizada',
  tipo_local: 'online', endereco_fixo: '', pergunta_formato: 'Você prefere que a reunião seja online via Google Meet ou prefere que a gente se encontre pessoalmente?',
  blacklist: '', lgpd_opt_out: true, lgpd_excluir: false, lgpd_nao_ligar: true, lgpd_log: true,
  distribuicao: 'round_robin',
  inbound_fonte: 'formulario', inbound_sla: '5min',
  ren_produto: 'Upgrade de plano', ren_churn: 'Contrato vencendo em 30 dias', ren_tom: 'relacionamento',
  b2c_produto: '', b2c_perfil: 'Proprietário de imóvel', b2c_volume: '100–300 ligações/dia', b2c_cta: 'reuniao',
  nurt_duracao: '60',
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={clsx('relative inline-flex w-11 h-6 rounded-full flex-shrink-0 cursor-pointer transition-colors duration-200 ease-in-out focus:outline-none', checked ? 'bg-brand' : 'bg-gray-200')}>
      <span className={clsx('pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out mt-0.5', checked ? 'translate-x-[22px]' : 'translate-x-0.5')} />
    </button>
  )
}

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-t border-gray-100 pt-5">
      <button type="button" onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full mb-4 group">
        <span className="section-label group-hover:text-gray-600 transition-colors">{title}</span>
        {open ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
      </button>
      {open && children}
    </div>
  )
}

export default function ModalNovaCampanha({ agentes, vendedores = [], onSalvar, onFechar }: Props) {
  const [form, setForm] = useState<FormState>(defaultForm)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  function s<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm(f => ({ ...f, [key]: val }))
  }
  function toggleDia(dia: string) {
    s('dias_operacao', form.dias_operacao.includes(dia)
      ? form.dias_operacao.filter(d => d !== dia)
      : [...form.dias_operacao, dia])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome.trim()) { setErro('Informe o nome da campanha.'); return }
    setErro(''); setLoading(true)
    try {
      await onSalvar(form)
      onFechar()
    } catch (err: unknown) {
      setErro((err as { message?: string })?.message || 'Erro ao criar campanha.')
    } finally { setLoading(false) }
  }

  const tipoAtual = TIPOS.find(t => t.key === form.tipo) ?? TIPOS[0]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-popup w-full max-w-2xl max-h-[92vh] flex flex-col">

        {/* Header fixo */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Nova campanha</h2>
            <p className="text-xs text-gray-400 mt-0.5">Configure e ative em seguida</p>
          </div>
          <button onClick={onFechar} className="btn-ghost p-2"><X size={18} /></button>
        </div>

        {/* Conteúdo com scroll */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-5">

          {/* ── TIPO DE CAMPANHA ── */}
          <div>
            <p className="section-label mb-3">Tipo de campanha</p>

            {/* Cards — grid 2+3 */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              {TIPOS.slice(0, 2).map(t => (
                <button key={t.key} type="button" onClick={() => s('tipo', t.key)}
                  className={clsx('flex flex-col gap-2 p-3.5 rounded-xl border-2 transition-all text-left',
                    form.tipo === t.key ? 'border-brand bg-brand-50' : 'border-gray-100 hover:border-gray-200 bg-white')}>
                  <div className="flex items-center justify-between">
                    <span className="text-xl">{t.icon}</span>
                    <span className={clsx('text-2xs font-bold px-1.5 py-0.5 rounded-full', t.tagColor)}>{t.tag}</span>
                  </div>
                  <div>
                    <p className={clsx('text-xs font-bold', form.tipo === t.key ? 'text-brand-700' : 'text-gray-800')}>{t.label}</p>
                    <p className="text-2xs text-gray-400 mt-0.5 leading-tight">{t.quando}</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {TIPOS.slice(2).map(t => (
                <button key={t.key} type="button" onClick={() => s('tipo', t.key)}
                  className={clsx('flex flex-col gap-2 p-3.5 rounded-xl border-2 transition-all text-left',
                    form.tipo === t.key ? 'border-brand bg-brand-50' : 'border-gray-100 hover:border-gray-200 bg-white')}>
                  <div className="flex items-center justify-between">
                    <span className="text-xl">{t.icon}</span>
                    <span className={clsx('text-2xs font-bold px-1.5 py-0.5 rounded-full', t.tagColor)}>{t.tag}</span>
                  </div>
                  <div>
                    <p className={clsx('text-xs font-bold', form.tipo === t.key ? 'text-brand-700' : 'text-gray-800')}>{t.label}</p>
                    <p className="text-2xs text-gray-400 mt-0.5 leading-tight">{t.quando}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Painel de detalhes do tipo selecionado */}
            <div className={clsx('mt-3 rounded-xl border p-4 transition-all', tipoAtual.avisoColor)}>
              <div className="flex flex-col gap-2.5">
                <ul className="flex flex-col gap-1.5">
                  {tipoAtual.bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs leading-relaxed">
                      <span className="mt-0.5 flex-shrink-0 opacity-60">•</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs leading-relaxed opacity-80 border-t border-current/10 pt-2.5">{tipoAtual.aviso}</p>
                <div className="flex items-center gap-1.5 pt-0.5">
                  <span className="text-2xs font-bold opacity-50 uppercase tracking-wide">CI ativo:</span>
                  <span className="text-2xs font-medium opacity-70">{tipoAtual.ci}</span>
                </div>
              </div>
            </div>

            {/* Painel Inbound */}
            {form.tipo === 'inbound' && (
              <div className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-200 grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-600">Fonte do lead inbound</label>
                  <select className="input" value={form.inbound_fonte} onChange={e => s('inbound_fonte', e.target.value)}>
                    <option value="formulario">Formulário do site</option>
                    <option value="ads">Google Ads / Meta Ads</option>
                    <option value="indicacao">Indicação</option>
                    <option value="evento">Evento / Webinar</option>
                    <option value="chat">Chat / WhatsApp</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-600">SLA — tempo máximo para ligar</label>
                  <select className="input" value={form.inbound_sla} onChange={e => s('inbound_sla', e.target.value)}>
                    <option value="5min">5 minutos (recomendado)</option>
                    <option value="15min">15 minutos</option>
                    <option value="1h">1 hora</option>
                    <option value="2h">2 horas</option>
                  </select>
                </div>
              </div>
            )}

            {/* Painel Renovação */}
            {form.tipo === 'renovacao' && (
              <div className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-200 grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-600">Produto a oferecer no upsell</label>
                  <select className="input" value={form.ren_produto} onChange={e => s('ren_produto', e.target.value)}>
                    <option>Upgrade de plano</option><option>Expansão de agentes</option>
                    <option>Módulo adicional</option><option>Renovação anual</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-600">Gatilho de churn</label>
                  <select className="input" value={form.ren_churn} onChange={e => s('ren_churn', e.target.value)}>
                    <option>Queda de uso acima de 30%</option><option>Sem login há 7+ dias</option>
                    <option>Contrato vencendo em 30 dias</option><option>NPS abaixo de 7</option>
                  </select>
                </div>
                <div className="col-span-2 flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-600">Tom do agente</label>
                  <select className="input" value={form.ren_tom} onChange={e => s('ren_tom', e.target.value)}>
                    <option value="relacionamento">Relacionamento — consultivo, parceiro</option>
                    <option value="valor">Valor — foco em resultados obtidos</option>
                    <option value="urgencia">Urgência — desconto por tempo limitado</option>
                  </select>
                </div>
              </div>
            )}

            {/* Painel B2C */}
            {form.tipo === 'b2c' && (
              <div className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-200 grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-600">Produto / serviço B2C</label>
                  <input className="input" placeholder="Ex: Energia solar residencial" value={form.b2c_produto} onChange={e => s('b2c_produto', e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-600">Perfil do consumidor</label>
                  <select className="input" value={form.b2c_perfil} onChange={e => s('b2c_perfil', e.target.value)}>
                    <option>Proprietário de imóvel</option><option>Pessoa com renda acima de R$5k</option>
                    <option>Aposentados e pensionistas</option><option>Microempreendedores (MEI)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-600">Volume diário</label>
                  <select className="input" value={form.b2c_volume} onChange={e => s('b2c_volume', e.target.value)}>
                    <option>100–300 ligações/dia</option><option>300–500 ligações/dia</option>
                    <option>500–1000 ligações/dia</option><option>1000+ ligações/dia</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-600">CTA principal</label>
                  <select className="input" value={form.b2c_cta} onChange={e => s('b2c_cta', e.target.value)}>
                    <option value="reuniao">Agendar visita</option><option value="trial">Ativar trial gratuito</option>
                    <option value="quote">Solicitar orçamento</option><option value="whatsapp">Continuar no WhatsApp</option>
                  </select>
                </div>
              </div>
            )}

            {/* Painel Nurturing */}
            {form.tipo === 'nurturing' && (
              <div className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex flex-col gap-1.5 mb-4">
                  <label className="text-xs font-medium text-gray-600">Duração total do ciclo</label>
                  <select className="input" value={form.nurt_duracao} onChange={e => s('nurt_duracao', e.target.value)}>
                    <option value="30">30 dias — ciclo curto</option>
                    <option value="60">60 dias — ciclo médio (recomendado)</option>
                    <option value="90">90 dias — ciclo longo / enterprise</option>
                  </select>
                </div>
                <p className="text-xs font-semibold text-gray-600 mb-2">Sequência de toques</p>
                <div className="flex flex-col gap-2">
                  {[
                    {icon:'📞',t:'Toque 1 — Ligação de qualificação',s:'Dia 1 · Apresentação + qualificação inicial'},
                    {icon:'📧',t:'Toque 2 — E-mail de valor',s:'Dia 3 · Conteúdo relevante ao segmento'},
                    {icon:'📞',t:'Toque 3 — Ligação de follow-up',s:'Dia 7 · Referência ao e-mail + novo argumento'},
                    {icon:'💬',t:'Toque 4 — WhatsApp personalizado',s:'Dia 14 · Mensagem curta com case de sucesso'},
                    {icon:'📞',t:'Toque 5 — Ligação de decisão',s:'Dia 21 · Proposta final + CTA de agendamento'},
                  ].map((tk, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2 bg-white rounded-lg border border-gray-100">
                      <span className="text-base">{tk.icon}</span>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-gray-800">{tk.t}</p>
                        <p className="text-2xs text-gray-400">{tk.s}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── ICP ── */}
          <div className={clsx(
            'rounded-xl border-2 transition-all',
            form.icp_ativo ? 'border-purple-400 bg-purple-50' : 'border-gray-200 bg-gray-50'
          )}>
            {/* Header com toggle */}
            <div className="p-4 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5">🎯</span>
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    Usar inteligência do ICP nesta campanha?
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    {form.icp_ativo
                      ? 'O sistema analisa sua lista, calcula o score de cada contato e coloca os melhores perfis no topo da fila — o agente liga primeiro para quem tem mais chance de agendar.'
                      : 'Desativado — os leads são discados na ordem de importação, sem priorização inteligente.'}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-0.5">
                <Toggle checked={form.icp_ativo} onChange={v => s('icp_ativo', v)} />
                <span className={clsx('text-xs font-bold', form.icp_ativo ? 'text-purple-600' : 'text-gray-400')}>
                  {form.icp_ativo ? 'ATIVO' : 'INATIVO'}
                </span>
              </div>
            </div>

            {/* Benefícios quando ativo */}
            {form.icp_ativo && (
              <div className="px-4 pb-4 flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { icon: '📊', t: 'Score por lead', d: 'Cada contato recebe uma pontuação antes de ligar.' },
                    { icon: '🏆', t: 'Fila inteligente', d: 'Quem converte mais fica no topo automaticamente.' },
                    { icon: '📈', t: 'Aprende com o tempo', d: 'O modelo fica mais preciso a cada ligação.' },
                    { icon: '⚙️', t: 'Threshold: 70+', d: 'Leads abaixo do score ficam em espera.' },
                  ].map((b, i) => (
                    <div key={i} className="flex gap-2 p-2.5 rounded-lg bg-white border border-purple-100">
                      <span className="text-sm flex-shrink-0">{b.icon}</span>
                      <div>
                        <p className="text-xs font-semibold text-purple-800">{b.t}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{b.d}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                  <span className="text-sm">✅</span>
                  <p className="text-xs text-emerald-700 font-semibold">
                    Clientes com ICP ativo fecham em média <strong>3.2× mais reuniões</strong> com a mesma lista.
                  </p>
                </div>
              </div>
            )}

            {/* Sugestão quando inativo */}
            {!form.icp_ativo && (
              <div className="px-4 pb-4">
                <button
                  type="button"
                  onClick={() => s('icp_ativo', true)}
                  className="text-xs font-bold text-purple-600 hover:text-purple-700 transition-colors"
                >
                  🎯 Ativar ICP nesta campanha →
                </button>
              </div>
            )}
          </div>

          {/* ── DADOS GERAIS ── */}
          <Section title="Informações gerais">
            <div className="flex flex-col gap-4">

              {/* Nome */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">Nome da campanha *</label>
                <input className="input" placeholder="Ex: Outbound Indústria — Junho 2026" value={form.nome} onChange={e => s('nome', e.target.value)} />
              </div>

              {/* Agente de IA */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-600">Agente de IA responsável</label>
                  <span className="text-2xs text-purple-600 font-semibold flex items-center gap-1">
                    🧠 CI otimiza automaticamente
                  </span>
                </div>
                {agentes.length === 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                    Nenhum agente cadastrado. Crie um agente primeiro em Configurações.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {/* Opção "Sem agente fixo — CI decide" */}
                    <button type="button" onClick={() => s('agente_id', '')}
                      className={clsx('flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all text-left',
                        form.agente_id === '' ? 'border-purple-400 bg-purple-50' : 'border-gray-100 hover:border-gray-200 bg-white')}>
                      <span className="text-lg flex-shrink-0">🧠</span>
                      <div className="min-w-0">
                        <p className={clsx('text-xs font-bold truncate', form.agente_id === '' ? 'text-purple-700' : 'text-gray-800')}>Automático</p>
                        <p className="text-2xs text-gray-400 leading-tight">CI escolhe o melhor agente</p>
                      </div>
                    </button>
                    {agentes.map(a => (
                      <button key={a.id} type="button" onClick={() => s('agente_id', a.id)}
                        className={clsx('flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all text-left',
                          form.agente_id === a.id ? 'border-brand bg-brand-50' : 'border-gray-100 hover:border-gray-200 bg-white')}>
                        <span className={clsx('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                          form.agente_id === a.id ? 'bg-brand text-white' : 'bg-gray-100 text-gray-600')}>
                          {a.nome.slice(0, 2).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className={clsx('text-xs font-bold truncate', form.agente_id === a.id ? 'text-brand-700' : 'text-gray-800')}>{a.nome}</p>
                          <p className="text-2xs text-gray-400 leading-tight">Agente ativo</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-2xs text-gray-400 leading-relaxed">
                  O Centro de Inteligência monitora qual agente converte mais por segmento, horário e região — e recomenda ajustes automaticamente.
                </p>
              </div>

              {/* Meta de agendamentos */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-600">Meta de agendamentos</label>
                  <span className="text-2xs text-gray-400">rastreada pelo CI</span>
                </div>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[10, 30, 50, 100].map(v => (
                    <button key={v} type="button" onClick={() => s('meta_agendamentos', String(v))}
                      className={clsx('py-2 rounded-lg border-2 text-xs font-bold transition-all',
                        form.meta_agendamentos === String(v)
                          ? 'border-brand bg-brand-50 text-brand-700'
                          : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200')}>
                      {v}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <input
                    type="number"
                    className="input pr-20"
                    placeholder="Outro número..."
                    value={form.meta_agendamentos}
                    onChange={e => s('meta_agendamentos', e.target.value)}
                    min="1"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">reuniões</span>
                </div>
                {form.meta_agendamentos && Number(form.meta_agendamentos) > 0 && (
                  <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-100 rounded-lg">
                    <span className="text-sm flex-shrink-0">🎯</span>
                    <p className="text-xs text-emerald-700 leading-relaxed">
                      Com ICP ativo, estime <strong>~1 reunião a cada 35–50 ligações</strong>.
                      Para {form.meta_agendamentos} reuniões: aproximadamente <strong>{Math.round(Number(form.meta_agendamentos) * 42).toLocaleString('pt-BR')} contatos</strong> na lista.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Section>

          {/* ── MODALIDADE ── */}
          <Section title="Modalidade da reunião">
            <div className="grid grid-cols-3 gap-3 mb-3">
              {([
                {v:'online',    icon:'💻', t:'Somente Online',        sub:'Agente agenda via Google Meet'},
                {v:'presencial',icon:'🤝', t:'Somente Presencial',    sub:'Agente confirma endereço com o cliente'},
                {v:'hibrido',   icon:'🔀', t:'Online e Presencial',   sub:'Agente se adapta à preferência'},
              ] as const).map(m => (
                <label key={m.v} onClick={() => {
                  s('modalidade', m.v)
                  // reset tipo_local para default da modalidade
                  if (m.v === 'online') s('tipo_local', 'online')
                  else if (m.v === 'presencial') s('tipo_local', 'cliente')
                  else s('tipo_local', 'cliente')
                }}
                  className={clsx('flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all',
                    form.modalidade === m.v ? 'border-brand bg-brand-50' : 'border-gray-100 hover:border-gray-200')}>
                  <span className="text-lg flex-shrink-0">{m.icon}</span>
                  <div>
                    <p className={clsx('text-xs font-semibold', form.modalidade === m.v ? 'text-brand-700' : 'text-gray-800')}>{m.t}</p>
                    <p className="text-2xs text-gray-400">{m.sub}</p>
                  </div>
                </label>
              ))}
            </div>

            {/* Invite automático — todas as modalidades */}
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg mb-3">
              <span className="text-xs text-emerald-700 font-medium">✅ Em todas as modalidades:</span>
              <span className="text-xs text-emerald-600">invite enviado via <strong>E-mail</strong> · <strong>WhatsApp</strong> · <strong>Google Calendar</strong></span>
            </div>

            {/* Detalhes da reunião */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">📋 Detalhes da reunião</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-600">Duração padrão</label>
                  <select className="input" value={form.duracao_reuniao} onChange={e => s('duracao_reuniao', e.target.value)}>
                    <option value="20">20 min — qualificação rápida</option>
                    <option value="30">30 min — reunião padrão (rec.)</option>
                    <option value="45">45 min — reunião aprofundada</option>
                    <option value="60">60 min — demo completa</option>
                    <option value="90">90 min — visita presencial</option>
                    <option value="120">120 min — imersão / workshop</option>
                  </select>
                </div>

                {/* Tipo de local — filtrado por modalidade */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-600">Tipo de local</label>
                  {form.modalidade === 'online' ? (
                    <div className="input bg-gray-100 text-gray-500 cursor-not-allowed flex items-center gap-2">
                      <span>🔗</span> Link automático (Google Meet)
                    </div>
                  ) : (
                    <select className="input" value={form.tipo_local} onChange={e => s('tipo_local', e.target.value)}>
                      <option value="endereco_variavel">🗺️ Endereço variável (por produto)</option>
                      <option value="cliente">🏢 Na empresa do cliente</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Online: nota Google Meet */}
              {form.modalidade === 'online' && (
                <div className="mt-3 flex items-start gap-2 p-2.5 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
                  <span className="flex-shrink-0">💻</span>
                  <span>O agente gera automaticamente um link Google Meet e envia ao cliente via e-mail e WhatsApp após o agendamento.</span>
                </div>
              )}

              {/* Presencial: nota endereço */}
              {form.modalidade === 'presencial' && (
                <div className="mt-3 flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700">
                  <span className="flex-shrink-0">🤝</span>
                  {form.tipo_local === 'endereco_variavel'
                    ? <span>O agente identifica o endereço correto com base no produto da campanha e envia ao cliente via e-mail e WhatsApp.</span>
                    : <span>O agente confirma o endereço na empresa do cliente e envia o convite via e-mail e WhatsApp.</span>
                  }
                </div>
              )}

              {/* Hibrido: frase gerada pelo CI */}
              {form.modalidade === 'hibrido' && (
                <div className="mt-3 flex flex-col gap-2">
                  <div className="flex items-start gap-2 p-2.5 bg-purple-50 border border-purple-100 rounded-lg text-xs text-purple-700">
                    <span className="flex-shrink-0">🔀</span>
                    <span>O agente pergunta a preferência do cliente. A frase usada é <strong>gerada automaticamente pelo Centro de Inteligência</strong> com base nos padrões desta campanha — você pode sobrescrever abaixo.</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-600">Frase de pergunta (override manual)</label>
                    <input className="input text-xs" value={form.pergunta_formato} onChange={e => s('pergunta_formato', e.target.value)} />
                  </div>
                </div>
              )}
            </div>
          </Section>

          {/* ── VENDEDORES ── */}
          {vendedores.length > 0 && (
            <Section title="Vendedores para esta campanha">
              <p className="text-xs text-gray-500 mb-3">As reuniões agendadas pela IA serão distribuídas entre os vendedores selecionados abaixo.</p>
              <div className="flex flex-col gap-2 mb-3">
                {vendedores.map(v => {
                  const campMod = form.modalidade // 'online' | 'presencial' | 'hibrido'
                  const vMod = v.modalidade        // 'online' | 'presencial' | 'hibrido' | 'ambos'
                  // compatível se vendedor aceita a modalidade da campanha
                  const compativel = vMod === 'hibrido' || vMod === 'ambos' || vMod === campMod || campMod === 'hibrido'
                  const isSelected = form.vendedoresSelecionados?.includes(v.id)
                  return (
                    <label
                      key={v.id}
                      className={clsx(
                        'flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors',
                        isSelected
                          ? compativel ? 'border-brand/40 bg-brand-50/40' : 'border-amber-300 bg-amber-50/40'
                          : compativel ? 'border-gray-100 hover:border-brand/30' : 'border-gray-100 opacity-60 hover:border-gray-200'
                      )}
                    >
                      <input
                        type="checkbox"
                        className="accent-brand"
                        checked={isSelected}
                        onChange={e => {
                          const sel = form.vendedoresSelecionados || []
                          s('vendedoresSelecionados', e.target.checked ? [...sel, v.id] : sel.filter(x => x !== v.id))
                        }}
                      />
                      <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center flex-shrink-0">{v.iniciais}</div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{v.nome}</p>
                        <p className="text-xs text-gray-400">{v.funcao}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {!compativel && (
                          <span className="text-2xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">⚠ modalidade incompatível</span>
                        )}
                        <span className={clsx(
                          'text-2xs font-medium rounded px-1.5 py-0.5 border',
                          (vMod === 'hibrido' || vMod === 'ambos') ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          vMod === 'online'     ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                 'bg-orange-50 text-orange-700 border-orange-200'
                        )}>
                          {vMod === 'online' ? '💻 Online' : vMod === 'presencial' ? '🤝 Presencial' : '🔀 Ambos'}
                        </span>
                      </div>
                    </label>
                  )
                })}
              </div>

              {/* Painel matching automático */}
              {(() => {
                const campMod = form.modalidade
                const compativeis = vendedores.filter(v => {
                  const vm = v.modalidade
                  return vm === 'hibrido' || vm === 'ambos' || vm === campMod || campMod === 'hibrido'
                })
                const incompativeis = vendedores.filter(v => {
                  const vm = v.modalidade
                  return !(vm === 'hibrido' || vm === 'ambos' || vm === campMod || campMod === 'hibrido')
                })
                if (incompativeis.length === 0) return null
                return (
                  <div className="mb-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-2xs font-semibold text-gray-500 uppercase tracking-wide mb-2">🔗 Matching automático — modalidade</p>
                    <p className="text-xs text-gray-500 mb-2.5">
                      O agente agenda reuniões somente para vendedores compatíveis com a <strong>modalidade</strong> desta campanha.
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {compativeis.map(v => (
                        <span key={v.id} className="inline-flex items-center gap-1 text-2xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          ● {v.nome} · {v.modalidade === 'online' ? 'Online' : v.modalidade === 'presencial' ? 'Presencial' : 'Ambos'} ✓
                        </span>
                      ))}
                      {incompativeis.map(v => (
                        <span key={v.id} className="inline-flex items-center gap-1 text-2xs px-2 py-1 rounded-full bg-gray-100 text-gray-400 border border-gray-200 line-through decoration-gray-300">
                          {v.nome} · {v.modalidade === 'online' ? 'Online' : 'Presencial'} · ✗ incompatível
                        </span>
                      ))}
                    </div>
                    {incompativeis.some(v => form.vendedoresSelecionados?.includes(v.id)) && (
                      <div className="mt-2 flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
                        <span className="flex-shrink-0">⚠️</span>
                        <span>
                          {incompativeis.filter(v => form.vendedoresSelecionados?.includes(v.id)).map(v => v.nome).join(', ')} {incompativeis.filter(v => form.vendedoresSelecionados?.includes(v.id)).length === 1 ? 'não receberá' : 'não receberão'} agendamentos desta campanha por incompatibilidade de modalidade.
                        </span>
                      </div>
                    )}
                  </div>
                )
              })()}

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-600">Distribuição de reuniões entre vendedores selecionados</span>
                <select className="input w-auto text-xs py-1.5" value={form.distribuicao} onChange={e => s('distribuicao', e.target.value)}>
                  <option value="round_robin">Distribuição igualitária (round-robin)</option>
                  <option value="menor_carga">Por menor carga (menos reuniões no dia)</option>
                  <option value="disponiveis">Apenas para vendedores disponíveis</option>
                </select>
              </div>
            </Section>
          )}

          {/* ── JANELA DE OPERAÇÃO ── */}
          <Section title="🕐 Janela de operação" defaultOpen={false}>
            <p className="text-xs text-gray-500 mb-4">Horários em que o agente vai disparar ligações. O sistema respeita automaticamente os limites da ANATEL por UF.</p>
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">Início das ligações</label>
                <select className="input" value={form.hora_inicio} onChange={e => s('hora_inicio', e.target.value)}>
                  {['08:00','09:00','10:00','11:00'].map(h => <option key={h} value={h}>{h}{h==='09:00'?' (rec.)':''}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">Fim das ligações</label>
                <select className="input" value={form.hora_fim} onChange={e => s('hora_fim', e.target.value)}>
                  {['17:00','18:00','19:00','20:00'].map(h => <option key={h} value={h}>{h}{h==='18:00'?' (rec.)':''}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">Limite diário</label>
                <select className="input" value={form.limite_diario} onChange={e => s('limite_diario', e.target.value)}>
                  {[['50','50/dia'],['100','100/dia'],['200','200/dia (rec.)'],['500','500/dia'],['0','Sem limite']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">Pausa almoço</label>
                <select className="input" value={form.pausa_almoco_val} onChange={e => { s('pausa_almoco_val', e.target.value); s('pausa_almoco', e.target.value !== 'none') }}>
                  <option value="none">Sem pausa</option>
                  <option value="12-13">12h–13h (rec.)</option>
                  <option value="12-14">12h–14h</option>
                  <option value="13-14">13h–14h</option>
                </select>
              </div>
            </div>

            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-600 mb-2">Dias de operação</p>
              <div className="flex gap-2 flex-wrap">
                {DIAS.map(d => (
                  <button key={d.key} type="button" onClick={() => toggleDia(d.key)}
                    className={clsx('px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
                      form.dias_operacao.includes(d.key)
                        ? 'bg-brand-50 border-brand text-brand-700'
                        : 'bg-white border-gray-200 text-gray-500')}>
                    {d.l}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 bg-emerald-50 rounded-lg text-xs text-emerald-700 font-semibold border border-emerald-100">
              ✅ ANATEL compliance ativo — ligações bloqueadas automaticamente fora dos horários permitidos por UF
            </div>
          </Section>

          {/* ── ORQUESTRAÇÃO MULTI-CANAL ── */}
          <Section title="🔀 Orquestração multi-canal" defaultOpen={false}>
            <p className="text-xs text-gray-500 mb-4">O que acontece após cada resultado de ligação. Executado automaticamente sem intervenção manual.</p>
            <div className="flex flex-col gap-3">

              {/* Não atendeu */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <span className="text-sm font-semibold text-gray-800">📵 Se não atender</span>
                  <Toggle checked={form.orq_nao_atendeu_on} onChange={v => s('orq_nao_atendeu_on', v)} />
                </div>
                {form.orq_nao_atendeu_on && (
                  <div className="p-4 grid grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-gray-600">Após N tentativas</label>
                      <select className="input" value={form.orq_nao_atendeu_tent} onChange={e => s('orq_nao_atendeu_tent', e.target.value)}>
                        <option value="1">1 tentativa</option><option value="2">2 tentativas</option><option value="3">3 tentativas</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-gray-600">Próximo canal</label>
                      <select className="input" value={form.orq_nao_atendeu_canal} onChange={e => s('orq_nao_atendeu_canal', e.target.value)}>
                        <option value="email">📧 E-mail de follow-up</option>
                        <option value="whatsapp">💬 WhatsApp personalizado</option>
                        <option value="email_wz">📧+💬 E-mail + WhatsApp</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-gray-600">Depois de</label>
                      <select className="input" value={form.orq_nao_atendeu_delay} onChange={e => s('orq_nao_atendeu_delay', e.target.value)}>
                        <option value="1h">1 hora</option><option value="24h">24 horas</option><option value="48h">48 horas</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Recusou */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <span className="text-sm font-semibold text-gray-800">🚫 Se recusar (sem interesse)</span>
                  <Toggle checked={form.orq_recusou_on} onChange={v => s('orq_recusou_on', v)} />
                </div>
                {form.orq_recusou_on && (
                  <div className="p-4 grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-gray-600">Ação</label>
                      <select className="input" value={form.orq_recusou_acao} onChange={e => s('orq_recusou_acao', e.target.value)}>
                        <option value="email_nutricao">📧 E-mail de nutrição (30 dias)</option>
                        <option value="arquivar">📦 Arquivar silenciosamente</option>
                        <option value="reprocessar_60d">🔄 Reprocessar em 60 dias</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-gray-600">LGPD — Opt-out</label>
                      <select className="input" value={form.orq_recusou_lgpd} onChange={e => s('orq_recusou_lgpd', e.target.value)}>
                        <option value="registrar">Registrar opt-out automaticamente</option>
                        <option value="perguntar">Perguntar ao lead se deseja opt-out</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Agendou */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <span className="text-sm font-semibold text-gray-800">✅ Se agendar reunião</span>
                  <Toggle checked={form.orq_agendou_on} onChange={v => s('orq_agendou_on', v)} />
                </div>
                {form.orq_agendou_on && (
                  <div className="p-4 grid grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-gray-600">E-mail de confirmação</label>
                      <select className="input" value={form.orq_agendou_email} onChange={e => s('orq_agendou_email', e.target.value)}>
                        <option value="imediato">📧 Imediatamente</option>
                        <option value="5min">Após 5 minutos</option>
                        <option value="nao">Não enviar</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-gray-600">WhatsApp de confirmação</label>
                      <select className="input" value={form.orq_agendou_wz} onChange={e => s('orq_agendou_wz', e.target.value)}>
                        <option value="imediato">💬 Imediatamente</option>
                        <option value="nao">Não enviar</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-gray-600">Lembrete antes da reunião</label>
                      <select className="input" value={form.orq_agendou_lembrete} onChange={e => s('orq_agendou_lembrete', e.target.value)}>
                        <option value="1h">1 hora antes</option>
                        <option value="24h">24 horas antes</option>
                        <option value="ambos">24h + 1h</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Gatekeeper */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <span className="text-sm font-semibold text-gray-800">👤 Se decisor não está (gatekeeper)</span>
                  <Toggle checked={form.orq_gatekeeper_on} onChange={v => s('orq_gatekeeper_on', v)} />
                </div>
                {form.orq_gatekeeper_on && (
                  <div className="p-4 grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-gray-600">Callback automático</label>
                      <select className="input" value={form.orq_gk_callback} onChange={e => s('orq_gk_callback', e.target.value)}>
                        <option value="horario_sugerido">No horário sugerido pelo gatekeeper</option>
                        <option value="2h">2 horas depois</option>
                        <option value="amanha">Próximo dia útil</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-gray-600">Abertura na próxima ligação</label>
                      <select className="input" value={form.orq_gk_abertura} onChange={e => s('orq_gk_abertura', e.target.value)}>
                        <option value="personalizada">Personalizada — "Falei com [nome] que me indicou ligar agora"</option>
                        <option value="padrao">Script padrão</option>
                      </select>
                    </div>
                    <div className="col-span-2 flex items-center gap-3 pt-1 border-t border-gray-100">
                      <div className="flex flex-col gap-1.5 flex-1">
                        <label className="text-xs font-medium text-gray-600">Máx. tentativas ao decisor real</label>
                        <select className="input" value={form.tent_redir} onChange={e => s('tent_redir', e.target.value)}>
                          <option value="2">2 tentativas</option>
                          <option value="3">3 tentativas (rec.)</option>
                          <option value="4">4 tentativas</option>
                        </select>
                      </div>
                      <p className="text-xs text-gray-400 flex-1 leading-relaxed">
                        Contagem separada das tentativas normais — retorno ao decisor real <strong>não</strong> consome o limite da agressividade.
                      </p>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </Section>

          {/* ── PROTEÇÃO DE DADOS ── */}
          <Section title="🛡️ Proteção de dados e compliance" defaultOpen={false}>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2">Blacklist da campanha</p>
                <textarea className="input resize-none" rows={4} value={form.blacklist}
                  onChange={e => s('blacklist', e.target.value)}
                  placeholder={'CNPJs ou domínios para nunca ligar\nEx: 12.345.678/0001-90\nEx: empresa-concorrente.com.br'} />
                <p className="text-2xs text-gray-400 mt-1">Um por linha. Leads com esses dados são removidos automaticamente da fila.</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2">Configurações LGPD</p>
                <div className="flex flex-col gap-3">
                  {[
                    { key:'lgpd_opt_out'  as const, label:'Registrar opt-out automaticamente ao detectar recusa' },
                    { key:'lgpd_excluir'  as const, label:'Excluir dados do lead após opt-out (72h)' },
                    { key:'lgpd_nao_ligar'as const, label:'Nunca ligar para opt-outs em campanhas futuras' },
                    { key:'lgpd_log'      as const, label:'Gravar log de consentimento em cada contato' },
                  ].map(item => (
                    <label key={item.key} className="flex items-start gap-2 cursor-pointer">
                      <input type="checkbox" checked={form[item.key] as boolean}
                        onChange={e => s(item.key, e.target.checked)}
                        className="mt-0.5 accent-brand" />
                      <span className="text-xs text-gray-700 leading-relaxed">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </Section>

          {/* Erro */}
          {erro && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{erro}</div>
          )}

          {/* Footer fixo */}
          <div className="flex gap-3 pt-2 pb-1">
            <button type="button" onClick={onFechar} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 gap-2 disabled:opacity-40">
              {loading ? <><Loader2 size={14} className="animate-spin" /> Criando...</> : (
                <><span>Criar e ativar campanha</span>{form.icp_ativo && <span className="bg-white/20 rounded-full px-2 py-0.5 text-2xs font-bold">✓ ICP ativo</span>}</>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
