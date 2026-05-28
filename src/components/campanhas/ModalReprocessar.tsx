import { useState, useEffect } from 'react'
import { X, RefreshCw, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
import clsx from 'clsx'
import type { Campanha } from '@/types/campanha'
import { campanhasApi } from '@/services/api'

interface Preview {
  nao_atendeu: number
  ligacao_caiu: number
  retornar: number
  caixa_postal: number
}

interface Props {
  campanha: Campanha
  onConcluido: () => void
  onFechar: () => void
}

const TIPOS = [
  {
    key: 'nao_atendeu',
    label: 'Não atendeu',
    desc: 'Telefone tocou mas ninguém atendeu',
    cor: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  {
    key: 'ligacao_caiu',
    label: 'Número não encontrado',
    desc: 'Número inexistente ou fora de serviço',
    cor: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
  },
  {
    key: 'retornar',
    label: 'Retornar contato',
    desc: 'Responsável ausente ou pediu retorno',
    cor: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  {
    key: 'caixa_postal',
    label: 'Caixa postal / Secretária eletrônica',
    desc: 'Ligação caiu na secretária sem contato humano',
    cor: 'text-gray-500',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
  },
] as const

const INTERVALOS = [
  { value: 1,  label: 'Aguardar 1 hora' },
  { value: 4,  label: 'Aguardar 4 horas' },
  { value: 24, label: 'Aguardar 24 horas' },
  { value: 48, label: 'Aguardar 48 horas' },
  { value: 72, label: 'Aguardar 72 horas' },
]

const MAX_TENTATIVAS = [
  { value: 1, label: '1 tentativa' },
  { value: 2, label: '2 tentativas' },
  { value: 3, label: '3 tentativas' },
]

const HORARIOS_PREFERENCIAL = [
  { value: 'qualquer', label: 'Qualquer horário' },
  { value: 'manha',    label: 'Manhã (08h–12h)' },
  { value: 'tarde',    label: 'Tarde (13h–18h)' },
  { value: 'noite',    label: 'Noite (18h–21h)' },
]

const AGENTES_OPCOES = [
  { value: 'mesmo',     label: 'Mesmo agente anterior' },
  { value: 'qualquer',  label: 'Qualquer agente disponível' },
]

export default function ModalReprocessar({ campanha, onConcluido, onFechar }: Props) {
  const [preview, setPreview] = useState<Preview | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set(['nao_atendeu', 'ligacao_caiu', 'retornar']))
  const [intervalo, setIntervalo] = useState(24)
  const [maxTentativas, setMaxTentativas] = useState(2)
  const [horarioPreferencial, setHorarioPreferencial] = useState('qualquer')
  const [agente, setAgente] = useState('mesmo')
  const [reprocessando, setReprocessando] = useState(false)
  const [concluido, setConcluido] = useState(false)
  const [erro, setErro] = useState('')
  const [resultado, setResultado] = useState(0)

  useEffect(() => {
    campanhasApi.reprocessarPreview(campanha.id)
      .then(r => setPreview(r.data as Preview))
      .catch(() => setPreview({ nao_atendeu: 0, ligacao_caiu: 0, retornar: 0, caixa_postal: 0 }))
      .finally(() => setCarregando(false))
  }, [campanha.id])

  function toggleTipo(key: string) {
    setSelecionados(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const totalSelecionado = preview
    ? [...selecionados].reduce((acc, k) => acc + (preview[k as keyof Preview] || 0), 0)
    : 0

  async function reprocessar() {
    if (totalSelecionado === 0) return
    setReprocessando(true)
    setErro('')
    try {
      const r = await campanhasApi.reprocessar(campanha.id, {
        tipos: [...selecionados],
        intervalo_horas: intervalo,
        max_tentativas: maxTentativas,
        horario_preferencial: horarioPreferencial,
        agente_preferencia: agente,
      })
      setResultado((r.data as { reprocessados: number }).reprocessados)
      setConcluido(true)
      setTimeout(() => { onConcluido(); onFechar() }, 2000)
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string }
      setErro(err?.response?.data?.error || err?.message || 'Erro ao reprocessar')
      setReprocessando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-popup w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <RefreshCw size={16} className="text-brand-500" />
              Reprocessar contatos não alcançados
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Campanha: <span className="font-medium text-gray-700">{campanha.nome}</span></p>
          </div>
          <button onClick={onFechar} className="btn-ghost p-2"><X size={18} /></button>
        </div>

        <div className="p-6 flex flex-col gap-5">

          {concluido ? (
            <div className="py-6 text-center">
              <CheckCircle2 size={40} className="text-emerald-500 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-900">{resultado} contatos reprocessados!</p>
              <p className="text-xs text-gray-400 mt-1">Voltaram para a fila com nova tentativa agendada.</p>
            </div>
          ) : (
            <>
              {/* Preview */}
              {carregando ? (
                <div className="flex justify-center py-6">
                  <Loader2 size={24} className="animate-spin text-gray-300" />
                </div>
              ) : (
                <>
                  {/* Resumo total */}
                  <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      Contatos elegíveis para reprocessamento
                    </p>
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      {[
                        { label: 'Não atendeu',   value: preview?.nao_atendeu  ?? 0 },
                        { label: 'Ligação caiu',  value: preview?.ligacao_caiu ?? 0 },
                        { label: 'Retornar',      value: preview?.retornar     ?? 0 },
                      ].map(m => (
                        <div key={m.label} className="text-center">
                          <p className="text-xl font-bold font-mono text-gray-900">{m.value}</p>
                          <p className="text-2xs text-gray-400">{m.label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-brand-100 pt-2 text-center">
                      <span className="text-xs font-semibold text-brand-700">
                        Total: {totalSelecionado} contatos serão reprocessados
                      </span>
                    </div>
                  </div>

                  {/* Seleção de tipos */}
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-2">Selecionar quais classificações reprocessar</p>
                    <div className="flex flex-col gap-2">
                      {TIPOS.map(t => {
                        const count = preview?.[t.key] ?? 0
                        const checked = selecionados.has(t.key)
                        return (
                          <button
                            key={t.key}
                            onClick={() => toggleTipo(t.key)}
                            disabled={count === 0}
                            className={clsx(
                              'flex items-center gap-3 p-3 rounded-xl border text-left transition-all',
                              checked && count > 0 ? `${t.bg} ${t.border}` : 'border-gray-100 bg-gray-50',
                              count === 0 && 'opacity-40 cursor-not-allowed'
                            )}
                          >
                            <div className={clsx(
                              'w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0',
                              checked && count > 0 ? 'bg-brand-600 border-brand-600' : 'border-gray-300 bg-white'
                            )}>
                              {checked && count > 0 && (
                                <svg viewBox="0 0 10 8" className="w-2.5 h-2 fill-white">
                                  <path d="M1 4l3 3 5-6"/>
                                </svg>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={clsx('text-sm font-medium', checked && count > 0 ? t.cor : 'text-gray-600')}>
                                {t.label}
                              </p>
                              <p className="text-xs text-gray-400">{t.desc}</p>
                            </div>
                            <span className={clsx('text-sm font-bold font-mono', checked && count > 0 ? t.cor : 'text-gray-400')}>
                              {count}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Configurações */}
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs font-semibold text-gray-700 mb-3">Configurações da nova tentativa</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-2xs text-gray-500 font-semibold uppercase tracking-wide block mb-1">
                          Intervalo mínimo
                        </label>
                        <select
                          value={intervalo}
                          onChange={e => setIntervalo(Number(e.target.value))}
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-brand"
                        >
                          {INTERVALOS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-2xs text-gray-500 font-semibold uppercase tracking-wide block mb-1">
                          Máx. tentativas adicionais
                        </label>
                        <select
                          value={maxTentativas}
                          onChange={e => setMaxTentativas(Number(e.target.value))}
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-brand"
                        >
                          {MAX_TENTATIVAS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-2xs text-gray-500 font-semibold uppercase tracking-wide block mb-1">
                          Horário preferencial
                        </label>
                        <select
                          value={horarioPreferencial}
                          onChange={e => setHorarioPreferencial(e.target.value)}
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-brand"
                        >
                          {HORARIOS_PREFERENCIAL.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-2xs text-gray-500 font-semibold uppercase tracking-wide block mb-1">
                          Agente para reprocessar
                        </label>
                        <select
                          value={agente}
                          onChange={e => setAgente(e.target.value)}
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-brand"
                        >
                          {AGENTES_OPCOES.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Aviso PROCON */}
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <AlertTriangle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-700">
                      Contatos classificados como <strong>Sem interesse</strong> nunca são reprocessados
                      para proteger a experiência do cliente e a conformidade com o PROCON.
                    </p>
                  </div>

                  {/* Erro */}
                  {erro && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                      <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                      {erro}
                    </div>
                  )}
                </>
              )}

              {/* Botões */}
              <div className="flex gap-3">
                <button onClick={onFechar} className="btn-secondary flex-1">Cancelar</button>
                <button
                  onClick={reprocessar}
                  disabled={reprocessando || totalSelecionado === 0 || carregando}
                  className="flex-1 flex items-center justify-center gap-2 btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {reprocessando
                    ? <><Loader2 size={14} className="animate-spin" /> Reprocessando...</>
                    : <><RefreshCw size={14} /> Reprocessar {totalSelecionado > 0 ? `${totalSelecionado} contatos` : ''}</>
                  }
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
