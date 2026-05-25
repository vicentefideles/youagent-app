import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bot, AlertCircle, Loader2, Sparkles } from 'lucide-react'
import { api } from '@/services/api'

const STEPS = ['Criar conta', 'Plano', 'Documentos', 'Contrato']

const UFS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
]

const TIPOS_EMPRESA = ['MEI', 'Ltda.', 'S.A.', 'EIRELI', 'Outros']

interface DocForm {
  cnpj: string
  razaoSocial: string
  nomeRepresentante: string
  cpfRepresentante: string
  endereco: string
  cep: string
  cidade: string
  estado: string
  tipoEmpresa: string
}

function mascaraCNPJ(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 14)
  if (d.length <= 2) return d
  if (d.length <= 5) return d.slice(0,2) + '.' + d.slice(2)
  if (d.length <= 8) return d.slice(0,2) + '.' + d.slice(2,5) + '.' + d.slice(5)
  if (d.length <= 12) return d.slice(0,2) + '.' + d.slice(2,5) + '.' + d.slice(5,8) + '/' + d.slice(8)
  return d.slice(0,2) + '.' + d.slice(2,5) + '.' + d.slice(5,8) + '/' + d.slice(8,12) + '-' + d.slice(12)
}

function mascaraCPF(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return d.slice(0,3) + '.' + d.slice(3)
  if (d.length <= 9) return d.slice(0,3) + '.' + d.slice(3,6) + '.' + d.slice(6)
  return d.slice(0,3) + '.' + d.slice(3,6) + '.' + d.slice(6,9) + '-' + d.slice(9)
}

function mascaraCEP(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 8)
  if (d.length <= 5) return d
  return d.slice(0,5) + '-' + d.slice(5)
}

export default function DocumentosPage() {
  const navigate = useNavigate()

  const [form, setForm] = useState<DocForm>({
    cnpj: '',
    razaoSocial: '',
    nomeRepresentante: '',
    cpfRepresentante: '',
    endereco: '',
    cep: '',
    cidade: '',
    estado: '',
    tipoEmpresa: 'Ltda.',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof DocForm, string>>>({})
  const [loading, setLoading] = useState(false)
  const [gerandoContrato, setGerandoContrato] = useState(false)
  const [erro, setErro] = useState('')

  function setField<K extends keyof DocForm>(key: K, value: DocForm[K]) {
    setForm(f => ({ ...f, [key]: value }))
    setErrors(e => ({ ...e, [key]: '' }))
    setErro('')
  }

  function validate(): boolean {
    const e: Partial<Record<keyof DocForm, string>> = {}
    const cnpjDigits = form.cnpj.replace(/\D/g, '')
    if (cnpjDigits.length !== 14) e.cnpj = 'CNPJ deve ter 14 dígitos'
    if (!form.razaoSocial.trim()) e.razaoSocial = 'Razão Social é obrigatória'
    if (!form.nomeRepresentante.trim()) e.nomeRepresentante = 'Nome do representante é obrigatório'
    const cpfDigits = form.cpfRepresentante.replace(/\D/g, '')
    if (cpfDigits.length !== 11) e.cpfRepresentante = 'CPF deve ter 11 dígitos'
    if (!form.endereco.trim()) e.endereco = 'Endereço é obrigatório'
    const cepDigits = form.cep.replace(/\D/g, '')
    if (cepDigits.length !== 8) e.cep = 'CEP deve ter 8 dígitos'
    if (!form.cidade.trim()) e.cidade = 'Cidade é obrigatória'
    if (!form.estado) e.estado = 'Estado é obrigatório'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!validate()) return

    const clienteId = localStorage.getItem('youagent_cliente_id')
    if (!clienteId) {
      setErro('Sessão expirada. Por favor, refaça o cadastro.')
      return
    }

    setLoading(true)
    setErro('')

    try {
      await api.post(`/clientes/${clienteId}/documentos`, {
        cnpj: form.cnpj,
        razao_social: form.razaoSocial,
        nome_representante: form.nomeRepresentante,
        cpf_representante: form.cpfRepresentante,
        endereco: form.endereco,
        cep: form.cep,
        cidade: form.cidade,
        estado: form.estado,
        tipo_empresa: form.tipoEmpresa,
      })

      setGerandoContrato(true)
      await api.post(`/clientes/${clienteId}/gerar-contrato`, {})

      navigate('/contrato')
    } catch {
      setErro('Erro ao enviar dados. Tente novamente.')
    } finally {
      setLoading(false)
      setGerandoContrato(false)
    }
  }

  const isLoading = loading || gerandoContrato

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl animate-fade-in">

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
                  ${i < 2 ? 'bg-green-500 text-white' :
                    i === 2 ? 'bg-blue-600 text-white' :
                    'bg-gray-200 text-gray-500'}`}>
                  {i < 2 ? '✓' : i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${
                  i === 2 ? 'text-blue-600' : i < 2 ? 'text-green-600' : 'text-gray-400'
                }`}>
                  {step}
                </span>
              </div>
              {i < STEPS.length - 1 && <div className="w-6 h-px bg-gray-300" />}
            </div>
          ))}
        </div>

        <div className="card p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Dados da Empresa</h2>
            <p className="text-sm text-gray-500 mt-1">
              Preencha os dados jurídicos para gerarmos seu contrato personalizado
            </p>
          </div>

          {/* Aviso privacidade */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs mb-6">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            Seus dados são usados apenas para gerar o contrato de prestação de serviços. Não compartilhamos com terceiros.
          </div>

          {erro && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm mb-4">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* CNPJ + Razão Social */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">CNPJ *</label>
                <input
                  type="text"
                  className={`input ${errors.cnpj ? 'border-red-400' : ''}`}
                  placeholder="00.000.000/0000-00"
                  value={form.cnpj}
                  onChange={e => setField('cnpj', mascaraCNPJ(e.target.value))}
                />
                {errors.cnpj && <span className="text-xs text-red-600">{errors.cnpj}</span>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">Razão Social *</label>
                <input
                  type="text"
                  className={`input ${errors.razaoSocial ? 'border-red-400' : ''}`}
                  placeholder="Empresa LTDA"
                  value={form.razaoSocial}
                  onChange={e => setField('razaoSocial', e.target.value)}
                />
                {errors.razaoSocial && <span className="text-xs text-red-600">{errors.razaoSocial}</span>}
              </div>
            </div>

            {/* Nome Representante + CPF */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">Nome do Representante Legal *</label>
                <input
                  type="text"
                  className={`input ${errors.nomeRepresentante ? 'border-red-400' : ''}`}
                  placeholder="Nome completo"
                  value={form.nomeRepresentante}
                  onChange={e => setField('nomeRepresentante', e.target.value)}
                />
                {errors.nomeRepresentante && <span className="text-xs text-red-600">{errors.nomeRepresentante}</span>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">CPF do Representante *</label>
                <input
                  type="text"
                  className={`input ${errors.cpfRepresentante ? 'border-red-400' : ''}`}
                  placeholder="000.000.000-00"
                  value={form.cpfRepresentante}
                  onChange={e => setField('cpfRepresentante', mascaraCPF(e.target.value))}
                />
                {errors.cpfRepresentante && <span className="text-xs text-red-600">{errors.cpfRepresentante}</span>}
              </div>
            </div>

            {/* Endereço */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">Endereço completo *</label>
              <input
                type="text"
                className={`input ${errors.endereco ? 'border-red-400' : ''}`}
                placeholder="Rua, número, complemento, bairro"
                value={form.endereco}
                onChange={e => setField('endereco', e.target.value)}
              />
              {errors.endereco && <span className="text-xs text-red-600">{errors.endereco}</span>}
            </div>

            {/* CEP + Cidade + Estado */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">CEP *</label>
                <input
                  type="text"
                  className={`input ${errors.cep ? 'border-red-400' : ''}`}
                  placeholder="00000-000"
                  value={form.cep}
                  onChange={e => setField('cep', mascaraCEP(e.target.value))}
                />
                {errors.cep && <span className="text-xs text-red-600">{errors.cep}</span>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">Cidade *</label>
                <input
                  type="text"
                  className={`input ${errors.cidade ? 'border-red-400' : ''}`}
                  placeholder="São Paulo"
                  value={form.cidade}
                  onChange={e => setField('cidade', e.target.value)}
                />
                {errors.cidade && <span className="text-xs text-red-600">{errors.cidade}</span>}
              </div>
              <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
                <label className="text-xs font-medium text-gray-600">Estado *</label>
                <select
                  className={`input ${errors.estado ? 'border-red-400' : ''}`}
                  value={form.estado}
                  onChange={e => setField('estado', e.target.value)}
                >
                  <option value="">Selecione</option>
                  {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                </select>
                {errors.estado && <span className="text-xs text-red-600">{errors.estado}</span>}
              </div>
            </div>

            {/* Tipo de empresa */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">Tipo de empresa</label>
              <select
                className="input"
                value={form.tipoEmpresa}
                onChange={e => setField('tipoEmpresa', e.target.value)}
              >
                {TIPOS_EMPRESA.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3 text-base font-semibold mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {gerandoContrato ? 'Gerando contrato...' : 'Enviando dados...'}
                </>
              ) : (
                'Continuar →'
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Overlay geração de contrato */}
      {gerandoContrato && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center gap-4 max-w-sm w-full mx-4">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-blue-500 animate-pulse" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-gray-900">Gerando seu contrato personalizado...</p>
              <p className="text-sm text-gray-500 mt-1">Nossa IA está preparando o documento com seus dados</p>
            </div>
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        </div>
      )}
    </div>
  )
}
