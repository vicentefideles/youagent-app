import { Fragment, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart3, Target, Megaphone, Brain, DollarSign,
  Download, FileText, TrendingUp, TrendingDown, ArrowRight,
  Sparkles, Phone, RefreshCw, Lightbulb,
  CheckCircle2, FlaskConical, Link2, Calendar, Share2,
} from 'lucide-react'
import clsx from 'clsx'
import { relatoriosApi } from '@/services/api'

// ─── TIPOS ───────────────────────────────────────────────────────────────────

type Tab = 'performance' | 'funil' | 'campanhas' | 'icp' | 'roi' | 'cross'

// ─── MOCK DATA ───────────────────────────────────────────────────────────────

const AGENTES_TABELA = [
  { nome:'Ana',    ligacoes:487, atendidas:312, atendPerc:64, agendadas:39, conv:'8.1%', convCor:'text-emerald-600', rechFeitas:148, rechTotal:487, rechMedia:1.8, descartados:23,  descartCor:'text-emerald-600', spark:[6,9,8,12,11,15,18], sparkCor:'bg-emerald-500' },
  { nome:'Carlos', ligacoes:452, atendidas:278, atendPerc:61, agendadas:27, conv:'5.9%', convCor:'text-brand-600',   rechFeitas:187, rechTotal:452, rechMedia:2.4, descartados:41,  descartCor:'text-amber-600',   spark:[7,6,9,8,11,12,13],  sparkCor:'bg-brand-400' },
  { nome:'Julia',  ligacoes:345, atendidas:210, atendPerc:61, agendadas:21, conv:'6.1%', convCor:'text-amber-600',   rechFeitas:132, rechTotal:345, rechMedia:2.1, descartados:31,  descartCor:'text-amber-600',   spark:[9,7,11,9,8,12,14],  sparkCor:'bg-amber-500' },
]

const PERFIL_AGENTES = [
  { nome:'Ana',    avatar:'👩', avatarBg:'bg-brand-500',   desc:'Voz feminina · Tom descontraído e consultivo', taxa:8.4, taxaCor:'text-emerald-600', barra:84, barraCor:'bg-emerald-500', custo:'R$89',  custoCor:'text-emerald-600', extra:'↑ melhor custo', stats:'487 ligações · 39 agendadas', destaque:true,  ativo:true,  melhor:true },
  { nome:'Carlos', avatar:'👨', avatarBg:'bg-gray-500',    desc:'Voz masculina · Tom corporativo e formal',     taxa:6.2, taxaCor:'text-brand-600',   barra:62, barraCor:'bg-brand-500',   custo:'R$121', custoCor:'text-amber-600',   extra:'',                  stats:'452 ligações · 27 agendadas' },
  { nome:'Julia',  avatar:'👩', avatarBg:'bg-purple-500',  desc:'Voz feminina · Tom corporativo e preciso',     taxa:5.9, taxaCor:'text-amber-600',   barra:59, barraCor:'bg-amber-500',   custo:'R$127', custoCor:'text-amber-600',   extra:'',                  stats:'345 ligações · 21 agendadas' },
]

const HEATMAP_ROWS = [
  { hora:'08h', vals:[2, 4, 3, 2, 2] },
  { hora:'09h', vals:[6, 8, 9, 7, 6] },
  { hora:'10h', vals:[10, 11, 10, 9, 7] },
  { hora:'14h', vals:[9, 10, 9, 8, 6] },
  { hora:'15h', vals:[7, 7, 6, 5, 4] },
]

const PROXIMAS_REUNIOES = [
  { empresa:'Grupo ABC',     contato:'Marcos Silva',   agente:'Ana',    dataHora:'14/05 14h00', link:'meet.google.com/abc-123', status:'Confirmado',  statusCls:'badge-success' },
  { empresa:'Delta Ind.',    contato:'Roberto Alves',  agente:'Julia',  dataHora:'13/05 10h00', link:'meet.google.com/def-456', status:'Confirmado',  statusCls:'badge-success' },
  { empresa:'Tech Nova',     contato:'Carla Mendes',   agente:'Carlos', dataHora:'15/05 09h30', link:'meet.google.com/ghi-789', status:'Aguardando', statusCls:'badge-amber'   },
  { empresa:'Omega Const.',  contato:'Lucas Pereira',  agente:'Ana',    dataHora:'16/05 15h00', link:'meet.google.com/jkl-012', status:'Confirmado',  statusCls:'badge-success' },
]

const TIMING_RAMOS = [
  { ramo:'Indústria',  janela:'09h-11h previsto', acerto:91, cor:'bg-emerald-500', txtCor:'text-emerald-600' },
  { ramo:'Tecnologia', janela:'14h-16h previsto', acerto:87, cor:'bg-emerald-500', txtCor:'text-emerald-600' },
  { ramo:'Varejo',     janela:'08h-10h previsto', acerto:74, cor:'bg-brand-500',   txtCor:'text-brand-600' },
  { ramo:'Saúde',      janela:'11h-13h previsto', acerto:69, cor:'bg-brand-500',   txtCor:'text-brand-600' },
]

const CROSS_CLIENTE = [
  { titulo:'Insight de custo SDR (Tecnologia)',         meta:'Incorporado em 28/04 · 198 usos',         delta:'+0.9% conv.', deltaCls:'text-emerald-600 bg-emerald-50' },
  { titulo:'Timing industrial 10h-11h (Indústria)',     meta:'Incorporado em 14/04 · 312 aplicações',   delta:'+0.7% aten.', deltaCls:'text-emerald-600 bg-emerald-50' },
  { titulo:'Oferecer 2 horários específicos (Todos)',   meta:'Incorporado em 05/05 · 87 aplicações',    delta:'+0.4% conv.', deltaCls:'text-brand-600 bg-brand-50' },
]

const SIMULADOR = [
  { ver:'v2.5', data:'10/05', score:'—',   scoreCor:'text-gray-400',   objecoes:'Em preparação', status:'Pendente', statusCls:'badge-amber' },
  { ver:'v2.4', data:'05/05', score:'86%', scoreCor:'text-emerald-600', objecoes:'12/14',          status:'✓ Ativo',  statusCls:'badge-success' },
  { ver:'v2.3', data:'28/04', score:'79%', scoreCor:'text-brand-600',   objecoes:'11/14',          status:'Anterior', statusCls:'badge-neutral' },
  { ver:'v2.2', data:'14/04', score:'71%', scoreCor:'text-brand-600',   objecoes:'10/14',          status:'Anterior', statusCls:'badge-neutral' },
  { ver:'v1.0', data:'01/04', score:'47%', scoreCor:'text-amber-600',   objecoes:'7/14',           status:'Inicial',  statusCls:'badge-neutral' },
]

const ROI_REDUCOES = [
  { icon:'🎯', bg:'bg-emerald-50', iconBg:'bg-emerald-500', delta:'↓ R$38', deltaCor:'text-emerald-600',
    titulo:'Adoção do ICP — foco no perfil certo',
    desc:'Mais ligações para indústria 50-200 func. → taxa de conversão subiu de 5.2% para 9.4%' },
  { icon:'⏰', bg:'bg-brand-50',   iconBg:'bg-brand-500',   delta:'↓ R$21', deltaCor:'text-brand-600',
    titulo:'Timing inteligente ativo',
    desc:'Ligações no horário certo → atendimento subiu 22% → menos tentativas por reunião' },
  { icon:'🧪', bg:'bg-purple-50',  iconBg:'bg-purple-500',  delta:'↓ R$14', deltaCor:'text-purple-600',
    titulo:'Nova versão do agente (Simulador v2.5)',
    desc:'Argumentos atualizados → conversão subiu 8% → mais reuniões com mesmas ligações' },
  { icon:'🔗', bg:'bg-amber-50',   iconBg:'bg-amber-500',   delta:'↓ R$9',  deltaCor:'text-amber-600',
    titulo:'Aprendizado Cross-Cliente — 3 novos argumentos',
    desc:'Argumentos de outros segmentos adaptados → +34% conversão em perfis similares' },
]

const ROI_TIMELINE = [
  { mes:'Jan', valor:'R$197', altura:82, cor:'bg-gray-400',     txtCor:'text-gray-500' },
  { mes:'Fev', valor:'R$164', altura:68, cor:'bg-amber-400',    txtCor:'text-amber-600' },
  { mes:'Mar', valor:'R$131', altura:54, cor:'bg-amber-500',    txtCor:'text-amber-600' },
  { mes:'Abr', valor:'R$107', altura:44, cor:'bg-brand-500',    txtCor:'text-brand-600' },
  { mes:'Mai', valor:'R$89',  altura:37, cor:'bg-emerald-500',  txtCor:'text-emerald-700' },
]

const CAMPANHAS_COMP = [
  { nome:'SP — Maio', resp:'João Silva · Ambos',         lig:487, icp:87, icpCor:'text-emerald-600', gat:41, agend:39, conv:'8.1%', convCor:'text-emerald-600', tend:'↑ +2.3%',    tendCor:'text-emerald-600' },
  { nome:'MG — Maio', resp:'Carlos Ferreira · Presencial', lig:452, icp:71, icpCor:'text-amber-600',   gat:27, agend:27, conv:'5.9%', convCor:'text-brand-600',   tend:'→ estável', tendCor:'text-amber-600' },
  { nome:'GO — Maio', resp:'Maria Rodrigues · Online',    lig:345, icp:68, icpCor:'text-amber-600',   gat:21, agend:21, conv:'6.1%', convCor:'text-brand-600',   tend:'↑ +1.1%',    tendCor:'text-emerald-600' },
]

const ICP_SEMANAS = [
  { sem:'Sem 1', val:58, alt:58, cor:'bg-brand-100',   borda:'border-t-brand-500'   },
  { sem:'Sem 2', val:62, alt:62, cor:'bg-brand-100',   borda:'border-t-brand-500'   },
  { sem:'Sem 3', val:67, alt:67, cor:'bg-brand-100',   borda:'border-t-brand-500'   },
  { sem:'Sem 4', val:71, alt:71, cor:'bg-amber-100',   borda:'border-t-amber-500'   },
  { sem:'Sem 5', val:75, alt:75, cor:'bg-amber-100',   borda:'border-t-amber-500'   },
  { sem:'Sem 6', val:79, alt:79, cor:'bg-emerald-100', borda:'border-t-emerald-500' },
  { sem:'Atual', val:84, alt:84, cor:'bg-emerald-100', borda:'border-t-emerald-500 border-t-[3px]', destaque:true },
]


const PIPELINE_POS = [
  { label:'Agendadas',  valor:87, altura:120, cor:'bg-brand-500' },
  { label:'Realizadas', valor:62, altura:85,  cor:'bg-emerald-500' },
  { label:'Proposta',   valor:31, altura:42,  cor:'bg-purple-500' },
  { label:'Negociação', valor:18, altura:25,  cor:'bg-amber-500' },
  { label:'Fechado',    valor:9,  altura:13,  cor:'bg-emerald-600' },
  { label:'Perdido',    valor:14, altura:19,  cor:'bg-red-400' },
]

// ─── CSV HELPER ──────────────────────────────────────────────────────────────

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ─── HELPERS DE UI ───────────────────────────────────────────────────────────

function Sparkline({ bars, cor }: { bars: number[]; cor: string }) {
  return (
    <div className="flex items-end gap-0.5 h-5">
      {bars.map((h, i) => (
        <div key={i} className={clsx('w-1 rounded-sm', cor)} style={{ height: `${h}px` }} />
      ))}
    </div>
  )
}

function HeatCell({ pct }: { pct: number }) {
  // Intensidade baseada no valor (max ~11)
  const opacity = Math.min(0.95, 0.15 + pct * 0.075)
  const textWhite = pct >= 6
  return (
    <div
      className={clsx(
        'rounded-md flex items-center justify-center text-[8px] font-mono font-semibold aspect-square',
        textWhite ? 'text-white' : 'text-gray-500'
      )}
      style={{ background: `rgba(99,102,241,${opacity})` }}
    >
      {pct}%
    </div>
  )
}

// ─── ABA PERFORMANCE ─────────────────────────────────────────────────────────

function TabPerformance({ agentesTabela, heatmapRows }: { agentesTabela: typeof AGENTES_TABELA; heatmapRows: typeof HEATMAP_ROWS }) {
  return (
    <div className="flex flex-col gap-4">

      {/* KPIs principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="kpi-card">
          <span className="text-2xs font-semibold uppercase tracking-wider text-gray-400">Total de ligações</span>
          <span className="text-3xl font-bold font-mono text-gray-900">1.284</span>
          <span className="text-xs text-emerald-600 font-medium flex items-center gap-1"><TrendingUp size={11}/> 18% vs mês anterior</span>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1">
            <div className="h-full bg-brand-500 rounded-full" style={{ width: '72%' }} />
          </div>
        </div>

        <div className="kpi-card">
          <span className="text-2xs font-semibold uppercase tracking-wider text-gray-400">Reuniões agendadas</span>
          <span className="text-3xl font-bold font-mono text-emerald-600">87</span>
          <span className="text-xs text-emerald-600 font-medium flex items-center gap-1"><TrendingUp size={11}/> 32% vs mês anterior</span>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '58%' }} />
          </div>
        </div>

        <div className="kpi-card border-t-2 border-t-emerald-500">
          <span className="text-2xs font-semibold uppercase tracking-wider text-gray-400">Custo por reunião</span>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold font-mono text-emerald-600">R$89</span>
            <span className="text-xs text-emerald-600 font-semibold pb-1.5">↓ 30% este mês</span>
          </div>
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden mt-1">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '30%' }} />
          </div>
          <div className="flex justify-between text-2xs text-gray-400 mt-1">
            <span>Jan: R$197</span><span>Hoje: R$89</span>
          </div>
          <span className="text-2xs bg-emerald-100 text-emerald-700 rounded px-2 py-0.5 font-semibold w-fit mt-1">SDR humano: ~R$420/reunião</span>
        </div>
      </div>

      {/* Desempenho por agente + Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4">
        {/* Tabela agentes */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Desempenho por agente</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Agente','Ligações','Atendidas','Agendadas','Conversão','Rechamadas','Descartados','Tendência'].map(h => (
                    <th key={h} className="text-2xs font-semibold text-gray-400 uppercase tracking-wide text-left px-3 py-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {agentesTabela.map(ag => (
                  <tr key={ag.nome} className="border-b border-gray-100 last:border-0">
                    <td className="px-3 py-2.5 text-xs font-semibold text-gray-900">{ag.nome}</td>
                    <td className="px-3 py-2.5 text-xs text-gray-700 font-mono">{ag.ligacoes}</td>
                    <td className="px-3 py-2.5 text-xs text-gray-700 font-mono">{ag.atendidas} <span className="text-2xs text-gray-400">({ag.atendPerc}%)</span></td>
                    <td className="px-3 py-2.5 text-xs text-gray-700 font-mono">{ag.agendadas}</td>
                    <td className={clsx('px-3 py-2.5 text-xs font-bold', ag.convCor)}>{ag.conv}</td>
                    <td className="px-3 py-2.5 text-xs text-gray-700 font-mono">
                      {ag.rechFeitas}/{ag.rechTotal}
                      <div className="text-2xs text-gray-400">{ag.rechMedia} média</div>
                    </td>
                    <td className={clsx('px-3 py-2.5 text-xs font-mono font-semibold', ag.descartCor)}>{ag.descartados}</td>
                    <td className="px-3 py-2.5"><Sparkline bars={ag.spark} cor={ag.sparkCor} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Heatmap */}
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Mapa de calor</h3>
            <p className="text-xs text-gray-500 mt-0.5">Melhor horário para ligar</p>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-[36px_repeat(7,1fr)] gap-1">
              <div />
              {['Seg','Ter','Qua','Qui','Sex'].map(d => (
                <div key={d} className="text-[9px] text-gray-500 text-center pb-1">{d}</div>
              ))}
              <div className="text-[9px] text-gray-300 text-center pb-1">Sáb</div>
              <div className="text-[9px] text-gray-300 text-center pb-1">Dom</div>

              {heatmapRows.map(row => (
                <Fragment key={row.hora}>
                  <div className="text-[9px] text-gray-500 text-right pr-1.5 flex items-center justify-end">{row.hora}</div>
                  {row.vals.map((v, i) => (
                    <HeatCell key={`${row.hora}-${i}`} pct={v} />
                  ))}
                  <div className="bg-gray-50 rounded-md opacity-30 aspect-square" />
                  <div className="bg-gray-50 rounded-md opacity-30 aspect-square" />
                </Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Perfil agente + Custo + Insight */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
        {/* Performance por perfil */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">🎭 Performance por perfil de agente</h3>
              <p className="text-xs text-gray-500 mt-0.5">Qual voz e tom converte mais para seu segmento — baseado nas suas ligações reais</p>
            </div>
            <button className="btn-primary text-xs py-1.5 px-3 whitespace-nowrap gap-1">Trocar agente <ArrowRight size={12}/></button>
          </div>
          <div className="px-4">
            {PERFIL_AGENTES.map((p, i) => (
              <div
                key={p.nome}
                className={clsx(
                  'py-3',
                  i < PERFIL_AGENTES.length - 1 && 'border-b border-gray-100',
                  p.destaque && 'bg-emerald-50 -mx-4 px-4'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={clsx('w-9 h-9 rounded-full text-white text-base flex items-center justify-center flex-shrink-0', p.avatarBg)}>
                    {p.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900">{p.nome}</span>
                      {p.ativo && <span className="text-[9px] bg-emerald-500 text-white rounded-full px-2 py-0.5 font-bold">✓ ATIVO</span>}
                      {p.melhor && <span className="text-[9px] bg-brand-500 text-white rounded-full px-2 py-0.5 font-bold">🏆 MELHOR</span>}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{p.desc}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={clsx('text-lg font-bold font-mono', p.taxaCor)}>{p.taxa}%</div>
                    <div className="text-2xs text-gray-500">conversão</div>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-3 text-xs flex-wrap">
                  <span className="text-gray-600">{p.stats}</span>
                  <span className={clsx('font-semibold', p.custoCor)}>{p.custo}/reunião</span>
                  {p.extra && <span className="text-emerald-600 font-medium">{p.extra}</span>}
                </div>
                <div className={clsx('mt-2 h-1 rounded-full overflow-hidden', p.destaque ? 'bg-emerald-200/40' : 'bg-gray-100')}>
                  <div className={clsx('h-full rounded-full', p.barraCor)} style={{ width: `${p.barra}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Custo por agente + Insight */}
        <div className="flex flex-col gap-3">
          <div className="card border-l-4 border-l-emerald-500">
            <div className="p-4">
              <div className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">Custo por reunião por agente</div>
              <div className="flex flex-col gap-2">
                {[
                  { dot:'bg-emerald-500', nome:'Ana (ativo)', val:'R$89',  cor:'text-emerald-600' },
                  { dot:'bg-brand-500',   nome:'Carlos',      val:'R$121', cor:'text-brand-600' },
                  { dot:'bg-amber-500',   nome:'Julia',       val:'R$127', cor:'text-amber-600' },
                ].map(r => (
                  <div key={r.nome} className="flex items-center gap-2">
                    <div className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0', r.dot)} />
                    <span className="text-xs flex-1 text-gray-700">{r.nome}</span>
                    <span className={clsx('text-sm font-bold font-mono', r.cor)}>{r.val}</span>
                  </div>
                ))}
                <div className="border-t border-gray-100 pt-2 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                  <span className="text-xs flex-1 text-gray-500">SDR humano</span>
                  <span className="text-sm font-bold font-mono text-gray-500">~R$420</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card border-l-4 border-l-purple-500">
            <div className="p-4">
              <div className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Lightbulb size={12}/> Insight do sistema
              </div>
              <div className="text-xs text-gray-700 leading-relaxed mb-3">
                Voz feminina descontraída (Ana) converte <strong>42% mais</strong> do que voz masculina corporativa (Carlos) no seu segmento de indústria. O custo por reunião cai de R$121 para R$89.
              </div>
              <button className="btn-primary text-xs w-full justify-center py-2">Manter agente atual (Ana)</button>
            </div>
          </div>
        </div>
      </div>

      {/* Status de rechamada */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><Phone size={14}/>Status de rechamada — tentativas por contato</h3>
            <p className="text-xs text-gray-500 mt-0.5">Distribuição de quantas tentativas foram feitas para os contatos da campanha ativa</p>
          </div>
          <button
            className="btn-secondary text-xs py-1.5"
            onClick={() => downloadCsv('rechamadas.csv', [
              ['Tentativa','Contatos','Observação'],
              ['1ª tentativa','312','aguardando resposta'],
              ['2ª tentativa','187','sem resposta na 1ª'],
              ['3ª tentativa (última)','94','última chance antes do descarte'],
              ['Descartados','95','aguardando reprocessamento'],
            ])}
          ><Download size={11}/> Exportar</button>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              { val:312, label:'1ª tentativa',          sub:'aguardando resposta',           bg:'bg-emerald-50', borda:'border-t-emerald-500', cor:'text-emerald-600' },
              { val:187, label:'2ª tentativa',          sub:'sem resposta na 1ª',            bg:'bg-brand-50',   borda:'border-t-brand-500',   cor:'text-brand-600' },
              { val:94,  label:'3ª tentativa (última)', sub:'última chance antes do descarte', bg:'bg-amber-50',   borda:'border-t-amber-500',   cor:'text-amber-600' },
              { val:95,  label:'Descartados',           sub:'aguardando reprocessamento',    bg:'bg-gray-50',    borda:'border-t-gray-400',    cor:'text-gray-600' },
            ].map(c => (
              <div key={c.label} className={clsx('rounded-lg p-3 text-center border-t-2', c.bg, c.borda)}>
                <div className={clsx('text-2xl font-bold font-mono', c.cor)}>{c.val}</div>
                <div className={clsx('text-xs font-semibold mt-1', c.cor)}>{c.label}</div>
                <div className="text-2xs text-gray-500 mt-0.5">{c.sub}</div>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="text-sm font-semibold text-gray-900">95 contatos aguardando reprocessamento manual</div>
              <div className="text-xs text-gray-500 mt-0.5">Atingiram o limite de 3 tentativas sem atender. O gestor pode reprocessar quando quiser — sem perder o histórico de tentativas.</div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button className="btn-secondary text-xs py-1.5">Ver lista</button>
              <button className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors flex items-center gap-1.5">
                <RefreshCw size={11}/> Reprocessar agora
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Próximas reuniões */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><Calendar size={14}/> Próximas reuniões agendadas</h3>
          <span className="badge badge-success">4 confirmadas</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Empresa','Contato','Agendado por','Data / Hora','Link Meet','Status'].map(h => (
                  <th key={h} className="text-2xs font-semibold text-gray-400 uppercase tracking-wide text-left px-4 py-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PROXIMAS_REUNIOES.map(r => (
                <tr key={r.empresa} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-2.5 text-xs font-semibold text-gray-900">{r.empresa}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-700">{r.contato}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-700">{r.agente}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-700 font-mono">{r.dataHora}</td>
                  <td className="px-4 py-2.5 text-xs text-brand-600 cursor-pointer hover:underline">{r.link}</td>
                  <td className="px-4 py-2.5"><span className={clsx('badge', r.statusCls)}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Score vs Conversão + Timing previsto */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">🎯 Score de Propensão vs Conversão Real</h3>
              <p className="text-xs text-gray-500 mt-0.5">O sistema acertou? Previsão x resultado das últimas 4 semanas</p>
            </div>
            <button
              className="btn-secondary text-xs py-1.5"
              onClick={() => downloadCsv('score-vs-conversao.csv', [
                ['Semana','Score Previsto (%)','Conversão Real (%)'],
                ['Sem. 1','65','58'],
                ['Sem. 2','78','71'],
                ['Sem. 3','87','83'],
                ['Sem. 4','93','89'],
              ])}
            ><Download size={11}/></button>
          </div>
          <div className="p-4">
            <div className="flex items-end gap-3 h-28 mb-3 px-1">
              {[
                { sem:'Sem. 1', prev:65, real:58 },
                { sem:'Sem. 2', prev:78, real:71 },
                { sem:'Sem. 3', prev:87, real:83 },
                { sem:'Sem. 4', prev:93, real:89 },
              ].map(b => (
                <div key={b.sem} className="flex-1 flex flex-col items-center gap-1">
                  <div className="flex items-end gap-1 h-24 w-full justify-center">
                    <div className="w-[45%] bg-purple-500/50 rounded-t" style={{ height: `${b.prev}%` }} />
                    <div className="w-[45%] bg-emerald-500 rounded-t" style={{ height: `${b.real}%` }} />
                  </div>
                  <div className="text-[9px] text-gray-500 font-medium">{b.sem}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-4 text-xs text-gray-500 mb-3 px-1">
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-purple-500/50 rounded-sm"/>Score previsto</div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-emerald-500 rounded-sm"/>Conversão real</div>
            </div>
            <div className="bg-emerald-50 rounded-lg px-3 py-2 text-xs text-emerald-700 flex items-start gap-1.5">
              <CheckCircle2 size={12} className="flex-shrink-0 mt-0.5"/>
              <span>Precisão do modelo: <strong>84%</strong> — score alto previu corretamente a conversão em 84% dos contatos</span>
            </div>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">⏰ Timing Previsto vs Horário Real</h3>
              <p className="text-xs text-gray-500 mt-0.5">Validação da inteligência de horários por ramo</p>
            </div>
            <button
              className="btn-secondary text-xs py-1.5"
              onClick={() => downloadCsv('timing-ramos.csv', [
                ['Ramo','Janela prevista','Acerto (%)'],
                ...TIMING_RAMOS.map(r => [r.ramo, r.janela, String(r.acerto)]),
              ])}
            ><Download size={11}/></button>
          </div>
          <div className="px-4">
            {TIMING_RAMOS.map((r, i) => (
              <div key={r.ramo} className={clsx('py-3', i < TIMING_RAMOS.length - 1 && 'border-b border-gray-100')}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-medium text-gray-900">{r.ramo} · {r.janela}</span>
                  <span className={clsx('text-xs font-bold', r.txtCor)}>{r.acerto}% de acerto</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={clsx('h-full rounded-full', r.cor)} style={{ width: `${r.acerto}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cross-Cliente + Simulador */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5"><Link2 size={13}/> Impacto do Aprendizado Cross-Cliente</h3>
              <p className="text-xs text-gray-500 mt-0.5">O que veio de outros clientes e gerou resultado aqui</p>
            </div>
            <button
              className="btn-secondary text-xs py-1.5"
              onClick={() => downloadCsv('cross-cliente.csv', [
                ['Insight','Meta','Delta'],
                ...CROSS_CLIENTE.map(c => [c.titulo, c.meta, c.delta]),
              ])}
            ><Download size={11}/></button>
          </div>
          <div className="px-4">
            {CROSS_CLIENTE.map((c, i) => (
              <div key={c.titulo} className={clsx('py-3 flex justify-between items-center gap-3', i < CROSS_CLIENTE.length - 1 && 'border-b border-gray-100')}>
                <div className="min-w-0">
                  <div className="text-xs font-medium text-gray-900">{c.titulo}</div>
                  <div className="text-2xs text-gray-500 mt-0.5">{c.meta}</div>
                </div>
                <span className={clsx('text-xs font-bold rounded px-2 py-0.5 flex-shrink-0', c.deltaCls)}>{c.delta}</span>
              </div>
            ))}
            <div className="border-t border-gray-100 py-3 flex justify-between text-xs font-semibold text-gray-900">
              <span>Impacto total acumulado</span>
              <span className="text-emerald-600">+2.1% na conversão</span>
            </div>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5"><FlaskConical size={13}/> Relatório do Simulador</h3>
              <p className="text-xs text-gray-500 mt-0.5">Versões testadas antes de chegar ao cliente real</p>
            </div>
            <button
              className="btn-secondary text-xs py-1.5"
              onClick={() => downloadCsv('simulador.csv', [
                ['Versão','Data','Score','Objeções','Status'],
                ...SIMULADOR.map(s => [s.ver, s.data, s.score, s.objecoes, s.status]),
              ])}
            ><Download size={11}/></button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Versão','Data','Score','Objeções','Status'].map(h => (
                    <th key={h} className="text-2xs font-semibold text-gray-400 uppercase tracking-wide text-left px-4 py-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SIMULADOR.map(s => (
                  <tr key={s.ver} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-2 text-xs font-semibold font-mono">{s.ver}</td>
                    <td className="px-4 py-2 text-xs font-mono text-gray-700">{s.data}</td>
                    <td className={clsx('px-4 py-2 text-xs font-mono font-bold', s.scoreCor)}>{s.score}</td>
                    <td className="px-4 py-2 text-xs text-gray-700">{s.objecoes}</td>
                    <td className="px-4 py-2"><span className={clsx('badge text-2xs', s.statusCls)}>{s.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ROI - Seu ROI com o ETZ */}
      <div className="card border-t-4 border-t-brand-500 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">💰 Seu ROI com o ETZ — o que a plataforma te economizou este mês</h3>
            <p className="text-xs text-gray-500 mt-0.5">Cada melhoria no Centro de Inteligência reflete diretamente no custo por reunião e na sua economia total</p>
          </div>
          <button
            className="btn-secondary text-xs py-1.5"
            onClick={() => downloadCsv('roi-detalhado.csv', [
              ['Mês','Custo por reunião','Valor'],
              ...ROI_TIMELINE.map(t => [t.mes, String(t.valor), String(t.altura)]),
            ])}
          ><Download size={11}/> Exportar relatório ROI</button>
        </div>

        <div className="p-4">
          {/* 3 KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div className="bg-emerald-50 border-2 border-emerald-500 rounded-lg p-4 text-center">
              <div className="text-2xs font-bold text-emerald-600 uppercase tracking-wider mb-1.5">Custo por reunião hoje</div>
              <div className="text-3xl font-bold font-mono text-emerald-600">R$89</div>
              <div className="text-xs text-emerald-600 font-medium mt-1">↓ 55% vs janeiro (R$197)</div>
            </div>
            <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 text-center">
              <div className="text-2xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">SDR humano equivalente</div>
              <div className="text-3xl font-bold font-mono text-gray-500">~R$420</div>
              <div className="text-xs text-gray-500 mt-1">custo médio de mercado</div>
            </div>
            <div className="bg-brand-50 border-2 border-brand-500 rounded-lg p-4 text-center">
              <div className="text-2xs font-bold text-brand-600 uppercase tracking-wider mb-1.5">Economia este mês</div>
              <div className="text-3xl font-bold font-mono text-brand-600">R$28.6k</div>
              <div className="text-xs text-brand-600 font-medium mt-1">87 reuniões × R$331 economizados</div>
            </div>
          </div>

          {/* Reduções */}
          <div className="mb-4">
            <div className="text-xs font-bold text-gray-900 mb-2.5">O que reduziu seu custo por reunião este mês</div>
            <div className="flex flex-col gap-1.5">
              {ROI_REDUCOES.map(r => (
                <div key={r.titulo} className={clsx('flex items-center gap-3 px-3 py-2.5 rounded-lg', r.bg)}>
                  <div className={clsx('w-8 h-8 rounded-full text-white text-sm flex items-center justify-center flex-shrink-0', r.iconBg)}>
                    {r.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-gray-900">{r.titulo}</div>
                    <div className="text-2xs text-gray-600 mt-0.5">{r.desc}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={clsx('text-sm font-bold', r.deltaCor)}>{r.delta}</div>
                    <div className="text-2xs text-gray-500">por reunião</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-gray-50 rounded-lg p-4 mb-3">
            <div className="text-xs font-semibold text-gray-900 mb-2.5">Evolução do custo por reunião — o que ativou cada queda</div>
            <div className="flex items-end gap-2 h-28 pb-7 relative border-b-2 border-gray-200">
              {ROI_TIMELINE.map(t => (
                <div key={t.mes} className="flex-1 flex flex-col items-center justify-end h-full">
                  <div className={clsx('text-[9px] font-semibold mb-1', t.txtCor)}>{t.valor}</div>
                  <div className={clsx('w-[70%] rounded-t', t.cor)} style={{ height: `${t.altura}%` }} />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-1 mb-2">
              {ROI_TIMELINE.map(t => (
                <div key={t.mes} className="flex-1 text-center text-[9px] text-gray-500 font-mono">{t.mes}</div>
              ))}
            </div>
            <div className="flex gap-3 flex-wrap mt-2">
              <div className="text-2xs text-gray-500 flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-amber-500"/>Timing inteligente ativado (Fev)</div>
              <div className="text-2xs text-gray-500 flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-brand-500"/>ICP + Agente Ana ativo (Mar)</div>
              <div className="text-2xs text-gray-500 flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-emerald-500"/>Simulador v2.5 + Cross-Cliente (Abr)</div>
            </div>
          </div>

          {/* CTA */}
          <div className="rounded-lg p-3 flex items-center gap-3 bg-gradient-to-r from-brand-50 to-purple-50">
            <span className="text-2xl flex-shrink-0">🚀</span>
            <div className="flex-1 text-xs text-gray-700 leading-relaxed">
              <strong>Próximo passo sugerido:</strong> ativar o Perfil de Cliente Ideal nas próximas campanhas pode reduzir o custo para abaixo de <strong>R$70</strong> — economia adicional de ~R$16.6k/mês com o mesmo volume de ligações.
            </div>
            <button className="btn-primary text-xs py-1.5 flex-shrink-0 whitespace-nowrap">Ver ICP e agir <ArrowRight size={11}/></button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── ABA FUNIL ───────────────────────────────────────────────────────────────

function TabFunil({ funilEtapas }: { funilEtapas: { label: string; valor: number; altura: number; cor: string; txtCor: string }[] }) {
  return (
    <div className="flex flex-col gap-4">

      {/* Funil principal */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">🎯 Funil de Conversão — do contato ao agendamento</h3>
          <p className="text-xs text-gray-500 mt-0.5">Dados em tempo real · conectado ao motor de IA da discadora</p>
        </div>

        <div className="p-4">
          {/* Barras */}
          <div className="flex items-end gap-4 h-48 px-2 mb-4">
            {funilEtapas.map(e => (
              <div key={e.label} className="flex-1 flex flex-col items-center">
                <div className={clsx('text-xs font-bold mb-1', e.txtCor)}>{e.valor.toLocaleString('pt-BR')}</div>
                <div className={clsx('w-full rounded-t', e.cor)} style={{ height: `${e.altura}px` }} />
                <div className="text-2xs text-gray-500 mt-1 text-center">{e.label}</div>
              </div>
            ))}
          </div>

          {/* Taxas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            <div className="bg-gray-50 rounded-lg px-3 py-2 border-l-2 border-brand-500">
              <div className="text-2xs text-gray-500">Atendimento</div>
              <div className="text-lg font-bold text-brand-600">63.9%</div>
              <div className="text-2xs text-gray-500">das discadas</div>
            </div>
            <div className="bg-gray-50 rounded-lg px-3 py-2 border-l-2 border-amber-500">
              <div className="text-2xs text-gray-500">Qualificação</div>
              <div className="text-lg font-bold text-amber-600">38.0%</div>
              <div className="text-2xs text-gray-500">das atendidas</div>
            </div>
            <div className="bg-gray-50 rounded-lg px-3 py-2 border-l-2 border-purple-500">
              <div className="text-2xs text-gray-500">Gatilho IA</div>
              <div className="text-lg font-bold text-purple-600">28.5%</div>
              <div className="text-2xs text-gray-500">das qualificadas</div>
            </div>
            <div className="bg-emerald-50 rounded-lg px-3 py-2 border-l-2 border-emerald-500">
              <div className="text-2xs text-gray-500">Agendamento</div>
              <div className="text-lg font-bold text-emerald-600">52.8%</div>
              <div className="text-2xs text-gray-500">dos gatilhos</div>
            </div>
          </div>

          {/* Insight IA */}
          <div className="bg-brand-50 rounded-lg px-3 py-2.5 flex items-center gap-2">
            <span className="text-base">🤖</span>
            <div className="text-xs text-gray-700 leading-relaxed flex-1">
              <strong className="text-brand-600">IA detectou:</strong> A etapa de qualificação → gatilho tem o maior gap (28.5%). Calibrar a sensibilidade dos gatilhos da campanha SP pode aumentar essa taxa em até 15pp.
            </div>
            <button className="btn-primary text-xs py-1 px-3 whitespace-nowrap flex-shrink-0">Ajustar gatilhos</button>
          </div>
        </div>
      </div>

      {/* Pipeline pós-reunião */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">🤝 Pipeline pós-reunião — do agendamento ao fechamento</h3>
          <p className="text-xs text-gray-500 mt-0.5">Alimentado pelos resultados registrados pelo vendedor</p>
        </div>

        <div className="p-4">
          <div className="flex items-end gap-4 h-40 px-2 mb-4">
            {PIPELINE_POS.map(p => (
              <div key={p.label} className="flex-1 flex flex-col items-center">
                <div className="text-xs font-bold text-gray-900 mb-1">{p.valor}</div>
                <div className={clsx('w-full rounded-t', p.cor, p.label === 'Perdido' && 'opacity-60')} style={{ height: `${p.altura}px` }} />
                <div className="text-2xs text-gray-500 mt-1 text-center">{p.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="bg-emerald-50 rounded-lg px-3 py-2 border-l-2 border-emerald-500">
              <div className="text-2xs text-gray-500">Show-rate</div>
              <div className="text-lg font-bold text-emerald-600">71%</div>
              <div className="text-2xs text-gray-500">compareceram</div>
            </div>
            <div className="bg-gray-50 rounded-lg px-3 py-2 border-l-2 border-brand-500">
              <div className="text-2xs text-gray-500">Taxa de fechamento</div>
              <div className="text-lg font-bold text-brand-600">14.5%</div>
              <div className="text-2xs text-gray-500">das realizadas</div>
            </div>
            <div className="bg-gray-50 rounded-lg px-3 py-2 border-l-2 border-purple-500">
              <div className="text-2xs text-gray-500">Ticket médio</div>
              <div className="text-lg font-bold text-purple-600">R$12.4k</div>
              <div className="text-2xs text-gray-500">negócios fechados</div>
            </div>
            <div className="bg-gray-50 rounded-lg px-3 py-2 border-l-2 border-amber-500">
              <div className="text-2xs text-gray-500">Em pipeline</div>
              <div className="text-lg font-bold text-amber-600">49</div>
              <div className="text-2xs text-gray-500">propostas + negoc.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── ABA CAMPANHAS ───────────────────────────────────────────────────────────

function TabCampanhas({ campanhasComp }: { campanhasComp: typeof CAMPANHAS_COMP }) {
  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">📣 Comparativo por campanha</h3>
        <p className="text-xs text-gray-500 mt-0.5">SP · MG · GO — performance, ICP médio e taxa de gatilho</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {['Campanha','Ligações','ICP Médio','Gatilhos IA','Agendamentos','Conversão','Tendência'].map(h => (
                <th key={h} className="text-2xs font-semibold text-gray-400 uppercase tracking-wide text-left px-4 py-2">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {campanhasComp.map(c => (
              <tr key={c.nome} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="text-xs font-semibold text-gray-900">{c.nome}</div>
                  <div className="text-2xs text-gray-500 mt-0.5">{c.resp}</div>
                </td>
                <td className="px-4 py-3 text-xs text-gray-700 font-mono">{c.lig}</td>
                <td className="px-4 py-3"><span className={clsx('text-xs font-bold', c.icpCor)}>{c.icp}</span></td>
                <td className="px-4 py-3 text-xs text-gray-700 font-mono">{c.gat}</td>
                <td className="px-4 py-3 text-xs text-gray-700 font-mono">{c.agend}</td>
                <td className="px-4 py-3"><span className={clsx('text-xs font-bold', c.convCor)}>{c.conv}</span></td>
                <td className="px-4 py-3"><span className={clsx('text-xs font-medium', c.tendCor)}>{c.tend}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-4 pb-4 pt-3">
        <div className="bg-gray-50 rounded-lg px-3 py-2.5">
          <div className="text-xs font-semibold text-gray-900 mb-1.5 flex items-center gap-1.5">
            <Sparkles size={12} className="text-purple-500"/> Recomendação automática do CI
          </div>
          <div className="text-xs text-gray-700 leading-relaxed">
            Campanha SP tem ICP médio 87 e conversão 8.1% — <strong className="text-emerald-600">referência para as demais</strong>. Argumento de urgência converteu 82% das transferências em SP. O CI sugere aplicar esse padrão nas campanhas MG e GO.
            <button className="btn-secondary text-xs ml-2 py-0.5 px-2 align-middle">Ver cross-cliente</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── ABA ICP ─────────────────────────────────────────────────────────────────

function TabIcp() {
  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">🧠 Evolução do ICP Score médio — aprendizado do agente</h3>
        <p className="text-xs text-gray-500 mt-0.5">Score médio dos contatos trabalhados semana a semana</p>
      </div>

      <div className="p-4">
        {/* Gráfico de barras */}
        <div className="flex items-end gap-1.5 h-32 px-1 mb-4">
          {ICP_SEMANAS.map(s => (
            <div key={s.sem} className="flex-1 flex flex-col items-center">
              <div className={clsx('text-2xs mb-1', s.destaque ? 'font-bold text-emerald-600' : 'text-gray-500')}>{s.val}</div>
              <div className={clsx('w-full rounded-t border-t-2', s.cor, s.borda)} style={{ height: `${s.alt}px` }} />
              <div className={clsx('text-[9px] mt-1', s.destaque ? 'font-semibold text-gray-700' : 'text-gray-500')}>{s.sem}</div>
            </div>
          ))}
        </div>

        {/* KPIs evolução */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
          <div className="bg-emerald-50 rounded-lg px-3 py-2.5">
            <div className="text-2xs text-gray-500">Evolução 7 semanas</div>
            <div className="text-xl font-bold text-emerald-600">+26 pts</div>
            <div className="text-2xs text-emerald-700">58 → 84 com o aprendizado do CI</div>
          </div>
          <div className="bg-brand-50 rounded-lg px-3 py-2.5">
            <div className="text-2xs text-gray-500">Ritmo de melhora</div>
            <div className="text-xl font-bold text-brand-600">+3.7/sem</div>
            <div className="text-2xs text-brand-600">média de pontos por semana</div>
          </div>
          <div className="bg-purple-50 rounded-lg px-3 py-2.5">
            <div className="text-2xs text-gray-500">Previsão semana 10</div>
            <div className="text-xl font-bold text-purple-600">~95</div>
            <div className="text-2xs text-purple-600">nível elite se ritmo mantido</div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg px-3 py-2.5 text-xs text-gray-700 leading-relaxed">
          <strong>Como o ICP evolui:</strong> a cada ciclo do Centro de Inteligência, o agente refina o que é um "bom perfil" com base nas conversões reais. Contatos que agendaram têm seus dados analisados e os critérios de score são calibrados automaticamente — sem intervenção do gerente.
        </div>
      </div>
    </div>
  )
}

// ─── ABA CROSS-CLIENTE ────────────────────────────────────────────────────────

interface CrossArg {
  argumento: string
  gatilho: string
  campanhas: string
  taxaSucesso: number
}

const CROSS_ARGS_TABELA: CrossArg[] = [
  { argumento: 'Temos apenas 3 vagas abertas para iniciar em junho — urgência criada', gatilho: 'urgencia',  campanhas: 'SP-Maio, MG-Maio, GO-Ind.',    taxaSucesso: 82 },
  { argumento: 'Posso enviar comparativo com resultados de clientes do mesmo setor',  gatilho: 'proposta',  campanhas: 'SP-Maio, MG-Todas',              taxaSucesso: 74 },
  { argumento: 'Posso agendar diretamente com [decisor]? 15 minutos que valem.',       gatilho: 'decisor',   campanhas: 'GO-Saúde Digital',               taxaSucesso: 68 },
  { argumento: 'Seu concorrente X perdeu 3 clientes por suporte ruim — abordagem',    gatilho: 'concorrente',campanhas: 'SP-Maio',                        taxaSucesso: 61 },
  { argumento: 'ROI recuperado em média em 4 meses — case setor industrial',          gatilho: 'preco',     campanhas: 'MG-Maio, GO-Ind., SP-Maio',      taxaSucesso: 91 },
  { argumento: 'Integração zero-config com CRM atual — sem impacto na operação',      gatilho: 'tecnico',   campanhas: 'SP-Tech',                         taxaSucesso: 57 },
]

const GATILHO_LABELS: Record<string, string> = {
  urgencia:   'Urgência',
  proposta:   'Proposta',
  decisor:    'Decisor ausente',
  concorrente:'Concorrente',
  preco:      'Preço',
  tecnico:    'Técnico',
}

function TabCrossCliente() {
  const [filtroGatilho, setFiltroGatilho] = useState<string>('todos')

  const filtrado = filtroGatilho === 'todos'
    ? CROSS_ARGS_TABELA
    : CROSS_ARGS_TABELA.filter(r => r.gatilho === filtroGatilho)

  const melhorArg = [...CROSS_ARGS_TABELA].sort((a, b) => b.taxaSucesso - a.taxaSucesso)[0]

  return (
    <div className="flex flex-col gap-4">

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="kpi-card border-t-2 border-t-emerald-500">
          <span className="text-2xs font-semibold uppercase tracking-wider text-gray-400">Argumentos aprovados</span>
          <span className="text-3xl font-bold font-mono text-emerald-600">18</span>
          <span className="text-xs text-emerald-600 font-medium flex items-center gap-1"><TrendingUp size={11}/> 3 novos esta semana</span>
        </div>
        <div className="kpi-card border-t-2 border-t-blue-500">
          <span className="text-2xs font-semibold uppercase tracking-wider text-gray-400">Taxa de adoção cross</span>
          <span className="text-3xl font-bold font-mono text-blue-600">71%</span>
          <span className="text-xs text-blue-600 font-medium flex items-center gap-1"><TrendingUp size={11}/> 8pp vs mês anterior</span>
        </div>
        <div className="kpi-card border-t-2 border-t-purple-500">
          <span className="text-2xs font-semibold uppercase tracking-wider text-gray-400">Campanhas impactadas</span>
          <span className="text-3xl font-bold font-mono text-purple-600">5</span>
          <span className="text-xs text-gray-500 font-medium">SP, MG, GO ativas</span>
        </div>
      </div>

      {/* Card argumento mais eficaz */}
      <div className="card border-l-4 border-l-emerald-500 bg-emerald-50/30">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">🏆</span>
            <h3 className="text-sm font-semibold text-gray-900">Argumento mais eficaz do mês</h3>
            <span className="ml-auto text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">{melhorArg.taxaSucesso}% de sucesso</span>
          </div>
          <p className="text-sm text-gray-800 font-medium italic mb-2">"{melhorArg.argumento}"</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-semibold">{GATILHO_LABELS[melhorArg.gatilho]}</span>
            <span className="text-xs text-gray-500">Aplicado em: {melhorArg.campanhas}</span>
          </div>
        </div>
      </div>

      {/* Filtro + Tabela */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-wrap gap-2">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
            <Sparkles size={13} className="text-purple-500"/> Argumentos cross-cliente aplicados
          </h3>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">Filtrar por gatilho:</label>
            <select
              value={filtroGatilho}
              onChange={e => setFiltroGatilho(e.target.value)}
              className="input py-1 text-xs w-auto"
            >
              <option value="todos">Todos</option>
              {Object.entries(GATILHO_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Argumento','Gatilho','Campanhas','Taxa de Sucesso'].map(h => (
                  <th key={h} className="text-2xs font-semibold text-gray-400 uppercase tracking-wide text-left px-4 py-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrado.map((r, i) => (
                <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 text-xs text-gray-800 max-w-xs">{r.argumento}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold whitespace-nowrap">{GATILHO_LABELS[r.gatilho]}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{r.campanhas}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 min-w-[100px]">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={clsx('h-full rounded-full', r.taxaSucesso >= 80 ? 'bg-emerald-500' : r.taxaSucesso >= 65 ? 'bg-blue-500' : 'bg-amber-400')}
                          style={{ width: `${r.taxaSucesso}%` }}
                        />
                      </div>
                      <span className={clsx('text-xs font-bold font-mono flex-shrink-0', r.taxaSucesso >= 80 ? 'text-emerald-600' : r.taxaSucesso >= 65 ? 'text-blue-600' : 'text-amber-600')}>
                        {r.taxaSucesso}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtrado.length === 0 && (
          <div className="px-4 py-8 text-center text-xs text-gray-400">
            Nenhum argumento encontrado para este gatilho.
          </div>
        )}
      </div>
    </div>
  )
}

// ─── ABA ROI ─────────────────────────────────────────────────────────────────

function TabRoi() {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">💰 ROI detalhado — economia e custo por reunião</h3>
          <p className="text-xs text-gray-500 mt-0.5">Calculado automaticamente com base nas ligações e agendamentos reais</p>
        </div>
        <div className="bg-emerald-50 rounded-lg px-3 py-1.5 text-xs font-bold text-emerald-600">
          Economia: R$ 47.280/mês
        </div>
      </div>

      <div className="p-4">
        {/* 3 KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-2xs text-gray-500 mb-1">Custo por reunião</div>
            <div className="text-2xl font-bold font-mono text-emerald-600">R$89</div>
            <div className="text-2xs text-emerald-700">vs R$380 com SDR humano</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-2xs text-gray-500 mb-1">Reuniões este mês</div>
            <div className="text-2xl font-bold font-mono text-brand-600">87</div>
            <div className="text-2xs text-brand-600">+14 vs mês anterior</div>
          </div>
          <div className="bg-emerald-50 border-2 border-emerald-500 rounded-lg p-3 text-center">
            <div className="text-2xs text-gray-500 mb-1">Economia acumulada</div>
            <div className="text-2xl font-bold font-mono text-emerald-600">R$25.4k</div>
            <div className="text-2xs text-emerald-700">em relação ao SDR humano</div>
          </div>
        </div>

        <div className="text-xs font-semibold text-gray-900 mb-2">Linha do tempo — custo por reunião (melhora com o aprendizado do CI)</div>

        {/* Rótulos topo */}
        <div className="flex gap-1.5 mb-1">
          {[
            { v:'R$180', cor:'text-gray-500' },
            { v:'R$154', cor:'text-gray-500' },
            { v:'R$132', cor:'text-gray-500' },
            { v:'R$118', cor:'text-gray-500' },
            { v:'R$89',  cor:'text-emerald-600 font-bold' },
          ].map((r, i) => (
            <div key={i} className={clsx('flex-1 text-center text-[10px]', r.cor)}>{r.v}</div>
          ))}
        </div>

        {/* Barras */}
        <div className="flex items-end gap-1.5 h-20 mb-1">
          <div className="flex-1 h-full bg-brand-50 rounded-t border-t-2 border-brand-500" style={{ height: '100%' }}/>
          <div className="flex-1 bg-brand-50 rounded-t border-t-2 border-brand-500" style={{ height: '85%' }}/>
          <div className="flex-1 bg-brand-50 rounded-t border-t-2 border-brand-500" style={{ height: '73%' }}/>
          <div className="flex-1 bg-amber-50 rounded-t border-t-2 border-amber-500" style={{ height: '65%' }}/>
          <div className="flex-1 bg-emerald-50 rounded-t border-t-2 border-emerald-500" style={{ height: '50%' }}/>
        </div>

        {/* Labels */}
        <div className="flex gap-1.5 mb-3">
          {['Jan','Fev','Mar','Abr','Mai ✓'].map((m, i) => (
            <div key={m} className={clsx('flex-1 text-center text-[10px]', i === 4 ? 'font-semibold text-emerald-600' : 'text-gray-500')}>{m}</div>
          ))}
        </div>

        <div className="bg-brand-50 rounded-lg px-3 py-2.5 text-xs text-gray-700 flex items-center gap-2">
          <TrendingDown size={14} className="text-brand-600 flex-shrink-0"/>
          <span>O custo por reunião caiu <strong className="text-brand-600">50.6%</strong> desde Janeiro — direto resultado do aprendizado do Centro de Inteligência. Cada ciclo do CI melhora a qualificação dos contatos e aumenta a taxa de conversão, reduzindo o custo automaticamente.</span>
        </div>
      </div>
    </div>
  )
}

// ─── PÁGINA PRINCIPAL ────────────────────────────────────────────────────────

export default function RelatoriosPage() {
  const [tab, setTab] = useState<Tab>('performance')

  const { data: relData } = useQuery({
    queryKey: ['relatorios'],
    queryFn: () => relatoriosApi.get().then(r => r.data),
  })

  const agentesTabela = relData?.agentes_tabela ?? []

  // heatmap from API is [7][24]; convert to the HEATMAP_ROWS shape used by the renderer
  const HORAS_LABEL = ['08h','09h','10h','11h','12h','13h','14h','15h','16h','17h','18h']
  const HORAS_IDX   = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]
  const heatmapRows: typeof HEATMAP_ROWS = (relData?.heatmap && Array.isArray(relData.heatmap) && relData.heatmap.length === 7)
    ? HORAS_IDX.map((h, i) => ({
        hora: HORAS_LABEL[i],
        // API days: 0=Sun,1=Mon,...,6=Sat — pick Mon-Fri (1-5)
        vals: [1,2,3,4,5].map(d => (relData.heatmap as number[][])[d][h] ?? 0)
      }))
    : HEATMAP_ROWS

  const funilEtapas = relData?.funil
    ? relData.funil.map((f: { etapa: string; valor: number; perc: number }) => ({ label: f.etapa, valor: f.valor, altura: f.valor, cor: 'bg-brand-500', txtCor: 'text-gray-900' }))
    : []

  const campanhasComp = relData?.campanhas_comp ?? []

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id:'performance', label:'Performance',         icon:<BarChart3 size={14}/> },
    { id:'funil',       label:'Funil de Conversão',  icon:<Target size={14}/> },
    { id:'campanhas',   label:'Campanhas',           icon:<Megaphone size={14}/> },
    { id:'icp',         label:'Evolução ICP',        icon:<Brain size={14}/> },
    { id:'roi',         label:'ROI Detalhado',       icon:<DollarSign size={14}/> },
    { id:'cross',       label:'Cross-Cliente',       icon:<Share2 size={14}/> },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Relatórios</h1>
          <p className="text-sm text-gray-500 mt-1">
            Performance, funil, ROI e evolução do aprendizado do agente.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select className="input py-1.5 text-xs w-auto">
            <option>Maio 2026</option>
            <option>Abril 2026</option>
            <option>Março 2026</option>
          </select>
          <select className="input py-1.5 text-xs w-auto">
            <option>Todos os agentes</option>
            <option>Ana</option>
            <option>Carlos</option>
            <option>Julia</option>
          </select>
          <button
            className="btn-secondary text-xs py-1.5"
            onClick={() => downloadCsv('relatorio-agentes.csv', [
              ['Agente','Ligações','Atendidas','Atend%','Agendadas','Conversão','Rechamadas','Descartados'],
              ...agentesTabela.map((ag: Record<string, unknown>) => [String(ag.nome), String(ag.ligacoes), String(ag.atendidas), String(ag.atendPerc), String(ag.agendadas), String(ag.conv), `${ag.rechFeitas}/${ag.rechTotal}`, String(ag.descartados)]),
            ])}
          ><Download size={12}/> Exportar CSV</button>
          <button className="btn-primary text-xs py-1.5"><FileText size={12}/> Exportar PDF</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-200 mb-5 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={clsx(
              'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap -mb-px',
              tab === t.id
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            )}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      {tab === 'performance' && <TabPerformance agentesTabela={agentesTabela} heatmapRows={heatmapRows} />}
      {tab === 'funil'       && <TabFunil funilEtapas={funilEtapas} />}
      {tab === 'campanhas'   && <TabCampanhas campanhasComp={campanhasComp} />}
      {tab === 'icp'         && <TabIcp />}
      {tab === 'roi'         && <TabRoi />}
      {tab === 'cross'       && <TabCrossCliente />}
    </div>
  )
}
