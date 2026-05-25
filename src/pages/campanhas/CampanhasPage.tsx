import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Filter, Activity } from 'lucide-react'
import clsx from 'clsx'
import { campanhasApi, agentesApi } from '@/services/api'
import CampanhaCard from '@/components/campanhas/CampanhaCard'
import ModalNovaCampanha from '@/components/campanhas/ModalNovaCampanha'
import ModalImportarLista from '@/components/campanhas/ModalImportarLista'
import type { Campanha, NovaCampanhaForm } from '@/types/campanha'

type FiltroStatus = 'todas' | 'ativa' | 'pausada' | 'arquivada'

export default function CampanhasPage() {
  const qc = useQueryClient()
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<FiltroStatus>('todas')
  const [modalNova, setModalNova] = useState(false)
  const [campanhaImportar, setCampanhaImportar] = useState<Campanha | null>(null)

  const { data: campanhasRaw = [], isLoading } = useQuery({
    queryKey: ['campanhas'],
    queryFn: () => campanhasApi.list().then((r) => r.data as Campanha[]),
  })

  const { data: agentes = [] } = useQuery({
    queryKey: ['agentes'],
    queryFn: () => agentesApi.list().then((r) => r.data),
  })

  const criarMutation = useMutation({
    mutationFn: (form: NovaCampanhaForm) => campanhasApi.create({
      nome:              form.nome.trim(),
      tipo:              form.tipo,
      estado:            form.estado,
      cidade:            form.cidade,
      segmento:          form.segmento,
      modalidade:        form.modalidade,
      agente_id:         form.agente_id || null,
      agressividade:     form.agressividade,
      meta_agendamentos: form.meta_agendamentos ? Number(form.meta_agendamentos) : null,
      hora_inicio:       form.hora_inicio,
      hora_fim:          form.hora_fim,
      limite_diario:     Number(form.limite_diario),
      pausa_almoco:      form.pausa_almoco,
      dias_operacao:     form.dias_operacao,
      icp_ativo:         form.icp_ativo,
      icp_threshold:     70,
      duracao_reuniao:   `${form.duracao_reuniao}min`,
      status:            'ativa',
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campanhas'] }),
  })

  const pausarMutation = useMutation({
    mutationFn: (id: string) => campanhasApi.update(id, { status: 'pausada' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campanhas'] }),
  })

  const iniciarMutation = useMutation({
    mutationFn: (id: string) => campanhasApi.update(id, { status: 'ativa' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campanhas'] }),
  })

  // Filtro + busca
  const campanhas = campanhasRaw.filter((c) => {
    const matchBusca = !busca || c.nome.toLowerCase().includes(busca.toLowerCase())
    const matchFiltro = filtro === 'todas' || c.status === filtro
    return matchBusca && matchFiltro
  })

  // Contadores para badges
  const contadores = {
    todas:    campanhasRaw.length,
    ativa:    campanhasRaw.filter((c) => c.status === 'ativa').length,
    pausada:  campanhasRaw.filter((c) => c.status === 'pausada').length,
    arquivada:campanhasRaw.filter((c) => c.status === 'arquivada').length,
  }

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Campanhas</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gerencie suas campanhas por região, segmento ou objetivo.
          </p>
        </div>
        <button onClick={() => setModalNova(true)} className="btn-primary gap-2">
          <Plus size={16} /> Criar campanha
        </button>
      </div>

      {/* KPIs rápidos */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total',    value: contadores.todas,    color: 'text-gray-900'    },
          { label: 'Ativas',   value: contadores.ativa,    color: 'text-emerald-600' },
          { label: 'Pausadas', value: contadores.pausada,  color: 'text-amber-600'   },
          { label: 'Leads na fila', value: campanhasRaw.reduce((acc, c) => acc + (c.dashboard?.na_fila ?? 0), 0), color: 'text-brand-600' },
        ].map((k) => (
          <div key={k.label} className="kpi-card">
            <span className={clsx('text-2xl font-bold font-mono', k.color)}>{k.value}</span>
            <span className="text-xs text-gray-500">{k.label}</span>
          </div>
        ))}
      </div>

      {/* Filtros e busca */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {/* Tabs de status */}
        <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
          {(['todas','ativa','pausada','arquivada'] as FiltroStatus[]).map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={clsx(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-all capitalize',
                filtro === f
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {f === 'todas' ? 'Todas' : f.charAt(0).toUpperCase() + f.slice(1)}
              <span className={clsx(
                'ml-1.5 text-xs px-1.5 py-0.5 rounded-full',
                filtro === f ? 'bg-brand-100 text-brand-600' : 'bg-gray-200 text-gray-500'
              )}>
                {contadores[f]}
              </span>
            </button>
          ))}
        </div>

        {/* Busca */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Buscar campanha..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        <button className="btn-secondary gap-2">
          <Filter size={15} /> Filtros
        </button>
      </div>

      {/* Grid de campanhas */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1,2,3].map((i) => (
            <div key={i} className="card h-80 animate-pulse bg-gray-50" />
          ))}
        </div>
      ) : campanhas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <Activity size={28} className="text-gray-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">
            {busca ? 'Nenhuma campanha encontrada' : 'Nenhuma campanha ainda'}
          </h3>
          <p className="text-sm text-gray-500 mt-2 max-w-xs">
            {busca
              ? `Nenhuma campanha corresponde a "${busca}"`
              : 'Crie sua primeira campanha para começar a discar.'}
          </p>
          {!busca && (
            <button onClick={() => setModalNova(true)} className="btn-primary mt-5 gap-2">
              <Plus size={16} /> Criar primeira campanha
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {campanhas.map((c) => (
            <CampanhaCard
              key={c.id}
              campanha={c}
              onPausar={(id) => pausarMutation.mutate(id)}
              onIniciar={(id) => iniciarMutation.mutate(id)}
              onImportar={setCampanhaImportar}
              onVerFila={(_camp) => {}}
            />
          ))}
        </div>
      )}

      {/* Modais */}
      {modalNova && (
        <ModalNovaCampanha
          agentes={agentes}
          onSalvar={(form) => criarMutation.mutateAsync(form).then(() => undefined)}
          onFechar={() => setModalNova(false)}
        />
      )}

      {campanhaImportar && (
        <ModalImportarLista
          campanha={campanhaImportar}
          onConcluido={(total) => {
            qc.invalidateQueries({ queryKey: ['campanhas'] })
            void total
          }}
          onFechar={() => setCampanhaImportar(null)}
        />
      )}

    </div>
  )
}
