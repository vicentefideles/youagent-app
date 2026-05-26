import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, KeyRound, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { authApi } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import EtzLogo from '@/components/EtzLogo'

export default function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)

  const [email, setEmail]   = useState('')
  const [token, setToken]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  const [showForgot, setShowForgot]   = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent]   = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !token) return
    setLoading(true)
    setError('')
    try {
      const { data } = await authApi.login(email, token)
      login(data.token, data.cliente)
      const status = data.cliente?.status
      const role   = data.cliente?.role
      if (role === 'platform_admin') {
        navigate('/admin/dashboard', { replace: true })
      } else if (status && status !== 'ativo') {
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
      console.log('TODO: chamar API de recuperação para', forgotEmail)
      setForgotLoading(false)
      setForgotSent(true)
    }, 1200)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
         style={{ background: 'linear-gradient(160deg, #ede9fe 0%, #f5f3ff 35%, #eef2ff 65%, #f8faff 100%)' }}>

      {/* Glow de fundo — aurora roxa suave */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Glow principal centralizado */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '720px',
          height: '520px',
          background: 'radial-gradient(ellipse, rgba(139,92,246,0.22) 0%, rgba(99,102,241,0.10) 50%, transparent 75%)',
          borderRadius: '50%',
          filter: 'blur(8px)',
        }} />
        {/* Glow secundário baixo-esquerda */}
        <div style={{
          position: 'absolute',
          bottom: '5%',
          left: '15%',
          width: '320px',
          height: '280px',
          background: 'radial-gradient(ellipse, rgba(167,139,250,0.12) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
        {/* Glow terciário baixo-direita */}
        <div style={{
          position: 'absolute',
          bottom: '0%',
          right: '10%',
          width: '280px',
          height: '240px',
          background: 'radial-gradient(ellipse, rgba(99,102,241,0.10) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
      </div>

      <div className="relative w-full max-w-[400px] animate-fade-in">

        {/* ── Símbolo + Identidade ─────────────────────────────────── */}
        <div className="flex flex-col items-center mb-9">

          {/* Container do logo com glow pulsante */}
          <div
            className="etz-logo-container mb-5 rounded-3xl flex items-center justify-center"
            style={{
              width: 96,
              height: 96,
              background: 'linear-gradient(145deg, #f5f3ff 0%, #ede9fe 50%, #ddd6fe 100%)',
              border: '1px solid rgba(167,139,250,0.35)',
            }}
          >
            <EtzLogo size={68} loading={loading} />
          </div>

          <h1 style={{
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: '-0.03em',
            color: '#1e1b4b',
            lineHeight: 1,
          }}>
            ETZ
          </h1>
          <p style={{
            fontSize: 13,
            color: '#6b7280',
            marginTop: 6,
            letterSpacing: '0.01em',
          }}>
            Agentes de IA para agendamento comercial
          </p>
        </div>

        {/* ── Card principal ───────────────────────────────────────── */}
        <div style={{
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 20,
          border: '1px solid rgba(255,255,255,0.9)',
          boxShadow: '0 8px 40px rgba(109,40,217,0.10), 0 2px 8px rgba(0,0,0,0.06)',
          padding: '32px 32px 28px',
        }}>

          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: '#1e1b4b', letterSpacing: '-0.02em' }}>
              Entrar na plataforma
            </h2>
            <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>
              Use seu e-mail e token de acesso
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* E-mail */}
            <div className="flex flex-col gap-1.5">
              <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', letterSpacing: '0.01em' }}>
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
                      style={{ color: '#a78bfa' }} />
                <input
                  type="email"
                  className="input pl-10"
                  style={{ background: 'rgba(245,243,255,0.8)', borderColor: 'rgba(196,181,253,0.5)' }}
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={loading}
                  autoFocus
                />
              </div>
            </div>

            {/* Token */}
            <div className="flex flex-col gap-1.5">
              <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', letterSpacing: '0.01em' }}>
                Token de acesso
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
                           style={{ color: '#a78bfa' }} />
                <input
                  type="password"
                  className="input pl-10"
                  style={{ background: 'rgba(245,243,255,0.8)', borderColor: 'rgba(196,181,253,0.5)' }}
                  placeholder="••••••••••••"
                  value={token}
                  onChange={e => setToken(e.target.value)}
                  disabled={loading}
                />
              </div>
              <button
                type="button"
                onClick={() => { setShowForgot(!showForgot); setForgotSent(false) }}
                style={{ fontSize: 12, color: '#7c3aed', textAlign: 'left', marginTop: 2 }}
                className="hover:opacity-70 transition-opacity"
              >
                Esqueci minha senha
              </button>
            </div>

            {/* Recuperar senha inline */}
            {showForgot && (
              <div className="animate-fade-in rounded-xl p-4"
                   style={{ background: 'rgba(237,233,254,0.7)', border: '1px solid rgba(196,181,253,0.4)' }}>
                {forgotSent ? (
                  <div className="flex items-center gap-2 text-sm" style={{ color: '#059669' }}>
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    Link enviado para {forgotEmail} ✓
                  </div>
                ) : (
                  <form onSubmit={handleForgotSubmit} className="flex flex-col gap-2">
                    <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280' }}>
                      E-mail para recuperação
                    </label>
                    <input
                      type="email"
                      className="input"
                      style={{ background: 'rgba(255,255,255,0.8)', borderColor: 'rgba(196,181,253,0.5)' }}
                      placeholder="seu@email.com"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                    />
                    <button
                      type="submit"
                      disabled={forgotLoading || !forgotEmail}
                      className="btn-primary py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {forgotLoading
                        ? <><Loader2 className="w-3 h-3 animate-spin" /> Enviando...</>
                        : 'Enviar link'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Erro */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl animate-fade-in"
                   style={{ background: 'rgba(254,242,242,0.9)', border: '1px solid rgba(252,165,165,0.5)', color: '#dc2626', fontSize: 13 }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Botão Entrar — Apple style */}
            <button
              type="submit"
              disabled={loading || !email || !token}
              className="w-full mt-1 flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              style={{
                background: loading || !email || !token
                  ? 'linear-gradient(135deg, #a78bfa, #818cf8)'
                  : 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
                color: '#fff',
                borderRadius: 14,
                padding: '13px 20px',
                fontSize: 15,
                fontWeight: 600,
                letterSpacing: '-0.01em',
                border: 'none',
                boxShadow: '0 4px 16px rgba(124,58,237,0.35)',
                cursor: loading ? 'wait' : 'pointer',
              }}
            >
              {loading ? (
                <>
                  <EtzLogo size={18} loading={true} />
                  <span>Autenticando...</span>
                </>
              ) : 'Entrar'}
            </button>

            {/* Link cadastro */}
            <button
              type="button"
              onClick={() => navigate('/cadastro')}
              className="text-sm text-center transition-opacity hover:opacity-70"
              style={{ color: '#7c3aed', fontSize: 13, marginTop: 2 }}
            >
              Novo cliente? Criar conta grátis →
            </button>

          </form>
        </div>

        {/* Rodapé */}
        <p className="text-center mt-6" style={{ fontSize: 12, color: '#9ca3af' }}>
          Não tem acesso?{' '}
          <a
            href="mailto:contato@etztech.com"
            className="hover:opacity-70 transition-opacity"
            style={{ color: '#7c3aed' }}
          >
            Entre em contato
          </a>
        </p>

      </div>
    </div>
  )
}
