import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'https://app.etztech.com/api/v1'

interface Slot { label: string; iso: string }
interface ReuniaoPublica {
  id: string
  titulo: string
  inicio: string
  status: string
  modalidade: string
  link_meet: string | null
  endereco: string | null
  cancelada: boolean
  contato: { nome: string }
  vendedor: { nome: string }
  slots_disponiveis: Slot[]
}

type Tela = 'carregando' | 'erro' | 'principal' | 'remarcar' | 'sucesso_confirmado' | 'sucesso_remarcado' | 'sucesso_cancelado'

export default function RemarcarPage() {
  const { token } = useParams<{ token: string }>()
  const [reuniao, setReuniao] = useState<ReuniaoPublica | null>(null)
  const [tela, setTela] = useState<Tela>('carregando')
  const [erro, setErro] = useState('')
  const [slotSelecionado, setSlotSelecionado] = useState<Slot | null>(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    axios.get(`${API}/r/${token}`)
      .then(r => { setReuniao(r.data); setTela('principal') })
      .catch(() => { setErro('Reunião não encontrada ou link inválido.'); setTela('erro') })
  }, [token])

  const dataFormatada = reuniao ? new Date(reuniao.inicio).toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  }) : ''
  const horaFormatada = reuniao ? new Date(reuniao.inicio).toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit'
  }) : ''

  async function confirmar() {
    setEnviando(true)
    try {
      await axios.post(`${API}/r/${token}/confirmar`)
      setTela('sucesso_confirmado')
    } catch { setErro('Erro ao confirmar. Tente novamente.') }
    finally { setEnviando(false) }
  }

  async function remarcar() {
    if (!slotSelecionado) return
    setEnviando(true)
    try {
      await axios.post(`${API}/r/${token}/remarcar`, { novo_inicio: slotSelecionado.iso })
      setTela('sucesso_remarcado')
    } catch { setErro('Erro ao remarcar. Tente novamente.') }
    finally { setEnviando(false) }
  }

  async function cancelar() {
    if (!confirm('Tem certeza que deseja cancelar esta reunião?')) return
    setEnviando(true)
    try {
      await axios.post(`${API}/r/${token}/cancelar`)
      setTela('sucesso_cancelado')
    } catch { setErro('Erro ao cancelar. Tente novamente.') }
    finally { setEnviando(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            <span className="font-semibold text-gray-700">ETZ</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

          {/* Carregando */}
          {tela === 'carregando' && (
            <div className="p-8 text-center text-gray-500">
              <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Carregando sua reunião...
            </div>
          )}

          {/* Erro */}
          {tela === 'erro' && (
            <div className="p-8 text-center">
              <div className="text-4xl mb-3">😕</div>
              <p className="text-gray-700 font-medium">{erro}</p>
              <p className="text-sm text-gray-400 mt-2">O link pode ter expirado ou a reunião já foi cancelada.</p>
            </div>
          )}

          {/* Principal */}
          {tela === 'principal' && reuniao && (
            <>
              <div className="bg-brand p-6 text-white">
                <p className="text-sm opacity-80 mb-1">Olá, {reuniao.contato.nome}!</p>
                <h1 className="text-xl font-bold">Sua reunião está agendada</h1>
                <p className="text-sm opacity-80 mt-1">com {reuniao.vendedor.nome}</p>
              </div>
              <div className="p-6">
                {reuniao.cancelada ? (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center text-red-700">
                    ❌ Esta reunião foi cancelada.
                  </div>
                ) : (
                  <>
                    <div className="bg-gray-50 rounded-xl p-4 mb-5">
                      <div className="flex items-start gap-3 mb-3">
                        <span className="text-xl">📅</span>
                        <div>
                          <p className="font-semibold text-gray-900 capitalize">{dataFormatada}</p>
                          <p className="text-gray-500 text-sm">às {horaFormatada}</p>
                        </div>
                      </div>
                      {reuniao.link_meet && (
                        <a href={reuniao.link_meet} target="_blank" rel="noreferrer"
                          className="flex items-center gap-2 text-sm text-brand hover:underline">
                          <span>💻</span> Entrar no Google Meet
                        </a>
                      )}
                      {reuniao.endereco && (
                        <p className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <span>📍</span> {reuniao.endereco}
                        </p>
                      )}
                    </div>

                    {erro && <p className="text-red-500 text-sm mb-3 text-center">{erro}</p>}

                    <div className="flex flex-col gap-2">
                      <button onClick={confirmar} disabled={enviando}
                        className="w-full py-3 rounded-xl bg-brand text-white font-medium text-sm hover:bg-brand/90 disabled:opacity-50 transition-colors">
                        ✅ Confirmar presença
                      </button>
                      <button onClick={() => setTela('remarcar')} disabled={enviando}
                        className="w-full py-3 rounded-xl border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 disabled:opacity-50 transition-colors">
                        📅 Remarcar para outro horário
                      </button>
                      <button onClick={cancelar} disabled={enviando}
                        className="w-full py-2 text-red-500 text-sm hover:underline disabled:opacity-50 transition-colors">
                        Cancelar reunião
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          {/* Escolher novo horário */}
          {tela === 'remarcar' && reuniao && (
            <>
              <div className="bg-brand p-6 text-white">
                <button onClick={() => setTela('principal')} className="text-sm opacity-70 hover:opacity-100 mb-2">← Voltar</button>
                <h1 className="text-xl font-bold">Escolha um novo horário</h1>
              </div>
              <div className="p-6">
                {reuniao.slots_disponiveis.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">
                    Nenhum horário disponível no momento. Entre em contato com {reuniao.vendedor.nome}.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 mb-5">
                    {reuniao.slots_disponiveis.map((slot, i) => (
                      <button key={i}
                        onClick={() => setSlotSelecionado(slot)}
                        className={`p-3 rounded-xl border text-sm font-medium transition-colors ${
                          slotSelecionado?.iso === slot.iso
                            ? 'border-brand bg-brand-50 text-brand-700'
                            : 'border-gray-200 text-gray-700 hover:border-brand/40'
                        }`}>
                        {slot.label || new Date(slot.iso).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
                        <br />
                        <span className="text-xs opacity-70">
                          {new Date(slot.iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {erro && <p className="text-red-500 text-sm mb-3 text-center">{erro}</p>}
                <button onClick={remarcar} disabled={!slotSelecionado || enviando}
                  className="w-full py-3 rounded-xl bg-brand text-white font-medium text-sm hover:bg-brand/90 disabled:opacity-50 transition-colors">
                  {enviando ? 'Remarcando...' : 'Confirmar novo horário'}
                </button>
              </div>
            </>
          )}

          {/* Sucesso confirmado */}
          {tela === 'sucesso_confirmado' && (
            <div className="p-8 text-center">
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Presença confirmada!</h2>
              <p className="text-gray-500 text-sm">Até lá, {reuniao?.contato.nome}!</p>
            </div>
          )}

          {/* Sucesso remarcado */}
          {tela === 'sucesso_remarcado' && (
            <div className="p-8 text-center">
              <div className="text-5xl mb-4">📅</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Reunião remarcada!</h2>
              <p className="text-gray-500 text-sm">
                Você receberá a confirmação via WhatsApp e e-mail.
              </p>
            </div>
          )}

          {/* Sucesso cancelado */}
          {tela === 'sucesso_cancelado' && (
            <div className="p-8 text-center">
              <div className="text-5xl mb-4">👋</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Reunião cancelada</h2>
              <p className="text-gray-500 text-sm">Tudo bem! Quando quiser conversar, é só entrar em contato.</p>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">Agendado via ETZ · Agentes de IA para vendas B2B</p>
      </div>
    </div>
  )
}
