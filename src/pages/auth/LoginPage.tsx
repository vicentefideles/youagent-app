import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bot, Mail, KeyRound, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { authApi } from '@/services/api'
import { useAuthStore } from '@/store/authStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)

  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Esqueci minha senha
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !token) return
    setLoading(true)
    setError('')
    try {
      const { data } = await authApi.login(email, token)
      login(data.token, data.cliente)
      // Redirecionar para aguardando se conta não estiver ativa
      const clienteStatus = data.cliente?.status
      if (clienteStatus && clienteStatus !== 'ativo') {
        navigate('/aguardando', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { erro?: string } } })?.response?.data?.erro
      setError(msg || 'E-mail ou token inválido.')
    } finally {
      setLoading(false)
    }
  }

  function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!forgotEmail) return
    setForgotLoading(true)
    setTimeout(() => {
      setForgotLoading(false)
      setForgotSent(true)
    }, 1200)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">

      {/* Glow sutil */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px]
                        bg-brand-100/60 rounded-full blur-[100px] -translate-y-1/2" />
      </div>

      <div className="relative w-full max-w-[420px] animate-fade-in">

        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-200
                          flex items-center justify-center mb-4 shadow-glow">
            <Bot className="w-7 h-7 text-brand" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">ETZ</h1>
          <p className="text-sm text-gray-500 mt-1">Agentes de IA para agendamento comercial</p>
        </div>

        {/* Card */}
        <div className="card p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Entrar na plataforma</h2>
            <p className="text-sm text-gray-500 mt-1">Use seu e-mail e token de acesso</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  className="input pl-10"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  autoFocus
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">Token de acesso</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  className="input pl-10"
                  placeholder="••••••••••••"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  disabled={loading}
                />
              </div>
              <button
                type="button"
                onClick={() => { setShowForgot(!showForgot); setForgotSent(false) }}
                className="text-xs text-brand hover:text-brand-600 transition-colors text-left mt-0.5"
              >
                Esqueci minha senha
              </button>
            </div>

            {/* Inline forgot password */}
            {showForgot && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 animate-fade-in">
                {forgotSent ? (
                  <div className="flex items-center gap-2 text-green-700 text-sm">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    Link enviado ✓ — verifique seu e-mail
                  </div>
                ) : (
                  <form onSubmit={handleForgotSubmit} className="flex flex-col gap-2">
                    <label className="text-xs font-medium text-gray-600">E-mail para recuperação</label>
                    <input
                      type="email"
                      className="input"
                      placeholder="seu@email.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                    />
                    <button
                      type="submit"
                      disabled={forgotLoading || !forgotEmail}
                      className="btn-primary py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {forgotLoading ? <><Loader2 className="w-3 h-3 animate-spin" /> Enviando...</> : 'Enviar link'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50
                              border border-red-200 text-red-700 text-sm animate-fade-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !token}
              className="btn-primary w-full mt-2 py-3 text-base font-semibold
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Autenticando...</>
              ) : 'Entrar'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/cadastro')}
              className="text-sm text-center text-brand hover:text-brand-600 transition-colors"
            >
              Novo cliente? Criar conta grátis →
            </button>

          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Não tem acesso?{' '}
          <a href="mailto:contato@etztech.com"
             className="text-brand hover:text-brand-600 transition-colors">
            Entre em contato
          </a>
        </p>

      </div>
    </div>
  )
}
