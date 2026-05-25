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

const TIPOS: { key: TipoCampanha; icon: string; label: string; sub: string; aviso: string }[] = [
  { key: 'outbound',  icon: '📞', label: 'SDR Outbound',   sub: 'Liga para lista fria B2B',        aviso: '📞 Agente disca para lista de prospects frios, qualifica pelo ICP e agenda reunião com o closer. Modo padrão — cobertura máxima de gatilhos e objeções.' },
  { key: 'inbound',   icon: '📥', label: 'SDR Inbound',    sub: 'Recebe e qualifica leads',        aviso: '📥 Agente recebe leads vindos de formulários, ads ou chat e qualifica em tempo real — SLA configurável.' },
  { key: 'renovacao', icon: '🔄', label: 'Renovação',      sub: 'Upsell em base ativa',            aviso: '🔄 Agente contata clientes ativos para renovação, upsell ou prevenção de churn — tom consultivo por padrão.' },
  { key: 'b2c',       icon: '👤', label: 'B2C',            sub: 'Pessoa física / consumidor',      aviso: '⚠️ Modo B2C ativa regras específicas: sem gatekeeper, personas de consumidor, horários ANATEL pessoa física (9h–21h seg-sex).' },
  { key: 'nurturing', icon: '🌱', label: 'Nurturing',      sub: 'Multi-toque 30–90 dias',          aviso: '🌱 Sequência de múltiplos toques programada: ligações, e-mails e WhatsApp espaçados ao longo de semanas.' },
]

const SEGMENTOS = ['Indústria','Comércio / Varejo','Tecnologia / SaaS','Agronegócio','Serviços','Saúde','Construção Civil','Educação','Logística','Financeiro']
const ESTADOS   = ['SP','MG','GO','RJ','PR','RS','SC','BA','CE','PE','DF','ES','MS','MT','PA','AM','RN','PB','AL','SE','PI','MA','TO','RO','AC','RR','AP','NACIONAL']
const DIAS = [{ key:'seg',l:'Seg'},{key:'ter',l:'Ter'},{key:'qua',l:'Qua'},{key:'qui',l:'Qui'},{key:'sex',l:'Sex'},{key:'sab',l:'Sáb'},{key:'dom',l:'Dom'}]

interface FormState extends NovaCampanhaForm {
  // Rechamada
  max_tentativas: string
  intervalo_tentativas: string
  ao_esgotar: string
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
  nome: '', tipo: 'outbound', estado: 'SP', cidade: '', segmento: '', modalidade: 'online',
  agente_id: '', agressividade: 'media', meta_agendamentos: '',
  hora_inicio: '09:00', hora_fim: '18:00', limite_diario: '200',
  pausa_almoco: true, pausa_almoco_val: '12-13',
  dias_operacao: ['seg','ter','qua','qui','sex'], icp_ativo: true, duracao_reuniao: '30',
  max_tentativas: '3', intervalo_tentativas: '24h', ao_esgotar: 'descartar', tent_redir: '3',
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
      className={clsx('w-10 h-5 rounded-full transition-colors relative flex-shrink-0', checked ? 'bg-brand' : 'bg-gray-200')}>
      <span className={clsx('absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform', checked ? 'translate-x-5' : 'translate-x-0.5')} />
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
            <div className="grid grid-cols-5 gap-2">
              {TIPOS.map(t => (
                <button key={t.key} type="button" onClick={() => s('tipo', t.key)}
                  className={clsx('flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-center',
                    form.tipo === t.key ? 'border-brand bg-brand-50' : 'border-gray-100 hover:border-gray-200')}>
                  <span className="text-2xl">{t.icon}</span>
                  <span className={clsx('text-xs font-bold leading-tight', form.tipo === t.key ? 'text-brand-700' : 'text-gray-700')}>{t.label}</span>
                  <span className="text-2xs text-gray-400 leading-tight">{t.sub}</span>
                </button>
              ))}
            </div>
            <div className={clsx('mt-3 p-3 rounded-lg text-xs text-gray-600 leading-relaxed',
              form.tipo === 'b2c' ? 'bg-amber-50 border border-amber-200' : 'bg-brand-50 border border-brand-100')}>
              {tipoAtual.aviso}
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

          {/* ── BANNER ICP ── */}
          <div className="rounded-xl overflow-hidden" style={{background:'linear-gradient(135deg,#1e1e2e,#1a2240)'}}>
            <div className="p-4">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-2xl flex-shrink-0">🎯</span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white mb-1">Perfil de Cliente Ideal detectado pelo sistema</p>
                  <p className="text-xs text-white/60 leading-relaxed">
                    Baseado no histórico, você fecha <strong className="text-white">3.2x mais</strong> com{' '}
                    <strong className="text-white">indústrias de 50–200 func.</strong> no{' '}
                    <strong className="text-white">interior de SP</strong>, lideradas por{' '}
                    <strong className="text-white">Diretores de Operações</strong>.
                  </p>
                </div>
              </div>
              <div className="border-t border-white/10 pt-3 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-xs font-bold text-white mb-1">Usar inteligência do ICP nesta campanha?</p>
                  <p className="text-2xs text-white/50 leading-relaxed">
                    Quando ativado, analisa sua lista, calcula o score de cada contato e ordena automaticamente os melhores perfis para o topo da fila.
                  </p>
                </div>
                <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                  <Toggle checked={form.icp_ativo} onChange={v => s('icp_ativo', v)} />
                  <span className={clsx('text-2xs font-bold', form.icp_ativo ? 'text-emerald-400' : 'text-gray-400')}>
                    {form.icp_ativo ? 'ATIVADO' : 'DESATIVADO'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── DADOS GERAIS ── */}
          <Section title="Informações gerais">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">Nome da campanha *</label>
                <input className="input" placeholder="Ex: SP — Indústria Junho 2026" value={form.nome} onChange={e => s('nome', e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">Estado alvo</label>
                <select className="input" value={form.estado} onChange={e => s('estado', e.target.value)}>
                  <option value="">Selecione...</option>
                  {ESTADOS.map(uf => <option key={uf} value={uf}>{uf === 'NACIONAL' ? '🇧🇷 Nacional' : uf}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">Cidade / Região alvo</label>
                <input className="input" placeholder="Ex: Interior SP, Grande BH..." value={form.cidade} onChange={e => s('cidade', e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">Segmento</label>
                <select className="input" value={form.segmento} onChange={e => s('segmento', e.target.value)}>
                  <option value="">Selecione...</option>
                  {SEGMENTOS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">Agente de IA responsável</label>
                <select className="input" value={form.agente_id} onChange={e => s('agente_id', e.target.value)}>
                  <option value="">— selecione um agente —</option>
                  {agentes.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">Agressividade inicial</label>
                <select className="input" value={form.agressividade} onChange={e => s('agressividade', e.target.value as never)}>
                  <option value="baixa">Baixa (1 chamada/min)</option>
                  <option value="media">Média (3 chamadas/min)</option>
                  <option value="alta">Alta (6 chamadas/min)</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">Meta de agendamentos</label>
                <input type="number" className="input" placeholder="Ex: 30 reuniões" value={form.meta_agendamentos} onChange={e => s('meta_agendamentos', e.target.value)} />
              </div>
            </div>
          </Section>

          {/* ── MODALIDADE ── */}
          <Section title="Modalidade da reunião">
            <div className="grid grid-cols-3 gap-3 mb-3">
              {([
                {v:'online',    icon:'💻', t:'Somente Online',        sub:'Agente agenda via Google Meet'},
                {v:'presencial',icon:'🤝', t:'Somente Presencial',    sub:'Agente confirma endereço, sem link'},
                {v:'hibrido',   icon:'🔀', t:'Online e Presencial',   sub:'Agente pergunta a preferência'},
              ] as const).map(m => (
                <label key={m.v} onClick={() => s('modalidade', m.v)}
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
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-600">Tipo de local</label>
                  <select className="input" value={form.tipo_local} onChange={e => s('tipo_local', e.target.value)}>
                    <option value="online">🔗 Link automático (Google Meet)</option>
                    <option value="endereco_fixo">📍 Endereço fixo</option>
                    <option value="endereco_variavel">🗺️ Endereço variável (por produto)</option>
                    <option value="cliente">🏢 Na empresa do cliente</option>
                  </select>
                </div>
              </div>

              {form.tipo_local === 'endereco_fixo' && (
                <div className="mt-3 flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-600">Endereço para reuniões presenciais</label>
                  <input className="input" placeholder="Ex: Av. Paulista, 1000 — São Paulo/SP · Sala 304" value={form.endereco_fixo} onChange={e => s('endereco_fixo', e.target.value)} />
                </div>
              )}
              {form.modalidade === 'hibrido' && (
                <div className="mt-3 flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-600">Frase para perguntar formato preferido</label>
                  <input className="input" value={form.pergunta_formato} onChange={e => s('pergunta_formato', e.target.value)} />
                </div>
              )}
            </div>
          </Section>

          {/* ── VENDEDORES ── */}
          {vendedores.length > 0 && (
            <Section title="Vendedores para esta campanha">
              <p className="text-xs text-gray-500 mb-3">As reuniões agendadas pela IA serão distribuídas entre os vendedores selecionados.</p>
              <div className="flex flex-col gap-2 mb-3">
                {vendedores.map(v => (
                  <label key={v.id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl cursor-pointer hover:border-brand/30 transition-colors">
                    <input type="checkbox" defaultChecked className="accent-brand" />
                    <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center flex-shrink-0">{v.iniciais}</div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{v.nome}</p>
                      <p className="text-xs text-gray-400">{v.funcao}</p>
                    </div>
                    <span className="badge badge-brand text-2xs">{v.modalidade}</span>
                  </label>
                ))}
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-600">Distribuição de reuniões</span>
                <select className="input w-auto text-xs py-1.5" value={form.distribuicao} onChange={e => s('distribuicao', e.target.value)}>
                  <option value="round_robin">Distribuição igualitária (round-robin)</option>
                  <option value="menor_carga">Por menor carga (menos reuniões no dia)</option>
                  <option value="disponiveis">Apenas para vendedores disponíveis</option>
                </select>
              </div>
            </Section>
          )}

          {/* ── REGRAS DE RECHAMADA ── */}
          <Section title="⚙️ Regras de rechamada" defaultOpen={false}>
            <p className="text-xs text-gray-500 mb-4">Quantas vezes o agente vai tentar ligar antes de descartar para reprocessamento manual.</p>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">Máx. tentativas por contato</label>
                <select className="input" value={form.max_tentativas} onChange={e => s('max_tentativas', e.target.value)}>
                  <option value="2">2 tentativas</option>
                  <option value="3">3 tentativas (rec.)</option>
                  <option value="4">4 tentativas</option>
                  <option value="5">5 tentativas</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">Intervalo entre tentativas</label>
                <select className="input" value={form.intervalo_tentativas} onChange={e => s('intervalo_tentativas', e.target.value)}>
                  <option value="1h">1 hora</option>
                  <option value="4h">4 horas</option>
                  <option value="24h">24 horas (rec.)</option>
                  <option value="48h">48 horas</option>
                  <option value="7d">1 semana</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">Ao esgotar tentativas</label>
                <select className="input" value={form.ao_esgotar} onChange={e => s('ao_esgotar', e.target.value)}>
                  <option value="descartar">Descartar → reprocessamento manual</option>
                  <option value="arquivar">Arquivar silenciosamente</option>
                </select>
              </div>
            </div>

            {/* Redirecionamento */}
            <div className="p-3 bg-brand-50 rounded-lg border border-brand-100">
              <p className="text-xs font-bold text-brand-700 mb-2">Regra para redirecionamento (pessoa errada)</p>
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-xs font-medium text-gray-600">Máx. tentativas ao decisor real</label>
                  <select className="input" value={form.tent_redir} onChange={e => s('tent_redir', e.target.value)}>
                    <option value="2">2 tentativas ao decisor real</option>
                    <option value="3">3 tentativas ao decisor real (rec.)</option>
                    <option value="4">4 tentativas ao decisor real</option>
                  </select>
                </div>
                <p className="text-xs text-gray-500 flex-1">Retorno com decisor real <strong>não conta</strong> como tentativa de conversão — conta separado.</p>
              </div>
            </div>
          </Section>

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
