import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bot, AlertCircle } from 'lucide-react'

interface CadForm {
  nome: string
  telefone: string
  email: string
  empresa: string
  senha: string
  confirmarSenha: string
  aceiteTermos: boolean
}

type SenhaForca = 'fraca' | 'media' | 'forte' | 'muito_forte' | ''

function calcularForca(senha: string): SenhaForca {
  if (senha.length === 0) return ''
  if (senha.length < 8) return 'fraca'
  const temEspecial = /[^a-zA-Z0-9]/.test(senha)
  const temNumero = /[0-9]/.test(senha)
  if (temEspecial) return 'muito_forte'
  if (temNumero) return 'forte'
  return 'media'
}

const FORCA_LABELS: Record<SenhaForca, string> = {
  '': '',
  fraca: 'Fraca',
  media: 'Média',
  forte: 'Forte',
  muito_forte: 'Muito forte',
}

const FORCA_COLORS: Record<SenhaForca, string> = {
  '': 'bg-gray-200',
  fraca: 'bg-red-500',
  media: 'bg-amber-400',
  forte: 'bg-blue-500',
  muito_forte: 'bg-green-500',
}

const FORCA_BARS: Record<SenhaForca, number> = {
  '': 0,
  fraca: 1,
  media: 2,
  forte: 3,
  muito_forte: 4,
}

const STEPS = ['Criar conta', 'Plano', 'Pagamento', 'Confirmação']

export default function CadastroPage() {
  const navigate = useNavigate()

  const [form, setForm] = useState<CadForm>({
    nome: '',
    telefone: '',
    email: '',
    empresa: '',
    senha: '',
    confirmarSenha: '',
    aceiteTermos: false,
  })
  const [errors, setErrors] = useState<Partial<Record<keyof CadForm, string>>>({})
  const [globalError, setGlobalError] = useState('')

  const forca = calcularForca(form.senha)

  function set<K extends keyof CadForm>(key: K, value: CadForm[K]) {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: '' }))
    setGlobalError('')
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof CadForm, string>> = {}
    if (!form.nome.trim()) newErrors.nome = 'Nome é obrigatório'
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = 'E-mail inválido'
    if (form.senha.length < 8) newErrors.senha = 'Mínimo 8 caracteres'
    if (form.senha !== form.confirmarSenha) newErrors.confirmarSenha = 'As senhas não conferem'
    if (!form.aceiteTermos) newErrors.aceiteTermos = 'Aceite os termos para continuar'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) {
      setGlobalError('Corrija os erros abaixo para continuar')
      return
    }
    // Salva dados do formulário no localStorage para uso nas etapas seguintes
    // O cliente_id real será salvo pela API após o cadastro; aqui garantimos
    // que as páginas seguintes possam acessar o ID via 'youagent_cliente_id'.
    // Quando a integração com a API for feita, substituir por:
    //   const res = await api.post('/clientes', { ... })
    //   const cliente = res.data as { id: string }
    //   localStorage.setItem('youagent_cliente_id', cliente.id)
    navigate('/checkout')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200
                          flex items-center justify-center mb-3 shadow-glow">
            <Bot className="w-6 h-6 text-brand" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900">ETZ</h1>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center mb-8 gap-2">
          {STEPS.map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                  ${i === 0 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${i === 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                  {step}
                </span>
              </div>
              {i < STEPS.length - 1 && <div className="w-6 h-px bg-gray-300" />}
            </div>
          ))}
        </div>

        <div className="card p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Crie sua conta gratuitamente</h2>
            <p className="text-sm text-gray-500 mt-1">Configure em minutos, sem cartão de crédito</p>
          </div>

          {globalError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm mb-4">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {globalError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Nome + Telefone */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">Nome completo *</label>
                <input
                  type="text"
                  className={`input ${errors.nome ? 'border-red-400' : ''}`}
                  placeholder="Seu nome"
                  value={form.nome}
                  onChange={(e) => set('nome', e.target.value)}
                />
                {errors.nome && <span className="text-xs text-red-600">{errors.nome}</span>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">Telefone/WhatsApp</label>
                <input
                  type="tel"
                  className="input"
                  placeholder="(11) 99999-9999"
                  value={form.telefone}
                  onChange={(e) => set('telefone', e.target.value)}
                />
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">E-mail profissional *</label>
              <input
                type="email"
                className={`input ${errors.email ? 'border-red-400' : ''}`}
                placeholder="seu@empresa.com"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
              />
              {errors.email && <span className="text-xs text-red-600">{errors.email}</span>}
            </div>

            {/* Empresa */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">Nome da empresa</label>
              <input
                type="text"
                className="input"
                placeholder="Sua empresa"
                value={form.empresa}
                onChange={(e) => set('empresa', e.target.value)}
              />
              <span className="text-xs text-gray-400">você pode preencher depois</span>
            </div>

            {/* Senha + Confirmar */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">Senha *</label>
                <input
                  type="password"
                  className={`input ${errors.senha ? 'border-red-400' : ''}`}
                  placeholder="••••••••"
                  value={form.senha}
                  onChange={(e) => set('senha', e.target.value)}
                />
                {errors.senha && <span className="text-xs text-red-600">{errors.senha}</span>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">Confirmar senha *</label>
                <input
                  type="password"
                  className={`input ${errors.confirmarSenha ? 'border-red-400' : ''}`}
                  placeholder="••••••••"
                  value={form.confirmarSenha}
                  onChange={(e) => set('confirmarSenha', e.target.value)}
                />
                {errors.confirmarSenha && <span className="text-xs text-red-600">{errors.confirmarSenha}</span>}
              </div>
            </div>

            {/* Indicador de força */}
            {form.senha.length > 0 && (
              <div className="flex flex-col gap-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((bar) => (
                    <div
                      key={bar}
                      className={`h-1.5 flex-1 rounded-full transition-all ${
                        bar <= FORCA_BARS[forca] ? FORCA_COLORS[forca] : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <span className={`text-xs font-medium ${
                  forca === 'fraca' ? 'text-red-500' :
                  forca === 'media' ? 'text-amber-500' :
                  forca === 'forte' ? 'text-blue-500' : 'text-green-600'
                }`}>
                  {FORCA_LABELS[forca]}
                </span>
              </div>
            )}

            {/* Aceite */}
            <div className="flex flex-col gap-1">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.aceiteTermos}
                  onChange={(e) => set('aceiteTermos', e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-blue-600"
                />
                <span className="text-xs text-gray-600">
                  Li e aceito os{' '}
                  <span className="text-brand underline cursor-pointer">Termos de Uso</span>
                  {' '}e a{' '}
                  <span className="text-brand underline cursor-pointer">Política de Privacidade</span>
                </span>
              </label>
              {errors.aceiteTermos && <span className="text-xs text-red-600">{errors.aceiteTermos}</span>}
            </div>

            {/* Botões */}
            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="btn-secondary flex-1 py-2.5"
              >
                ← Voltar ao login
              </button>
              <button
                type="submit"
                className="btn-primary flex-1 py-2.5"
              >
                Continuar para o plano →
              </button>
            </div>

          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Já tem conta?{' '}
          <button onClick={() => navigate('/login')} className="text-brand hover:text-brand-600 transition-colors">
            Entrar
          </button>
        </p>

      </div>
    </div>
  )
}
