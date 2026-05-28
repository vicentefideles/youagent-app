import axios from 'axios'
import { JWT_KEY } from '@/constants/auth'

const BASE_URL = 'https://app.etztech.com/api/v1'

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// Injeta JWT em todas as requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(JWT_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Redireciona para login se 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem(JWT_KEY)
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// Auth
export const authApi = {
  login: (email: string, token: string) =>
    api.post('/auth/login', { email, token }),
  register: (data: { nome: string; email: string; empresa?: string; telefone?: string; token: string }) =>
    api.post('/auth/register', data),
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  resetPassword: (reset_token: string, nova_senha: string) =>
    api.post('/auth/reset-password', { reset_token, nova_senha }),
}

// Agentes
export const agentesApi = {
  list:   ()       => api.get('/agentes'),
  create: (data: unknown) => api.post('/agentes', data),
  update: (id: string, data: unknown) => api.put(`/agentes/${id}`, data),
  delete: (id: string) => api.delete(`/agentes/${id}`),
}

// Campanhas
export const campanhasApi = {
  list:    ()                          => api.get('/campanhas'),
  create:  (data: unknown)             => api.post('/campanhas', data),
  update:  (id: string, data: unknown) => api.put(`/campanhas/${id}`, data),
  iniciar: (id: string)               => api.post(`/campanhas/${id}/iniciar`, {}),
  pausar:   (id: string)               => api.patch(`/campanhas/${id}`, { status: 'pausada' }),
  reativar: (id: string)               => api.patch(`/campanhas/${id}`, { status: 'ativa' }),
  patch:    (id: string, data: unknown) => api.patch(`/campanhas/${id}`, data),
  analisarLista: (id: string, data: { amostra?: Array<{ nome?: string; empresa?: string; cargo?: string }>; total_contatos?: number; segmento?: string }) =>
    api.post(`/campanhas/${id}/analisar-lista`, data),
}

// Contatos
export const contatosApi = {
  list:       (campanhaId: string)  => api.get(`/contatos?campanha_id=${campanhaId}`),
  bulkInsert: (data: unknown)       => api.post('/contatos/bulk', data),
}

/** @deprecated Use campanhasApi */
export const campanhasApiV2 = campanhasApi

// Ligações
export const ligacoesApi = {
  list:     (params?: { agente_id?: string; status?: string }) => {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''
    return api.get(`/ligacoes${qs}`)
  },
  create:   (data: unknown) => api.post('/ligacoes', data),
  encerrar: (callControlId: string) => api.delete(`/ligacoes/${callControlId}/encerrar`),
  transferir: (callControlId: string, data: { numero_destino: string; vendedor_nome?: string }) =>
    api.post(`/ligacoes/${callControlId}/transferir`, data),
  falar: (callControlId: string, data: { texto: string; voz?: string }) =>
    api.post(`/ligacoes/${callControlId}/falar`, data),
}

// Reuniões
export const reunioesApi = {
  list:   (params?: { agente_id?: string; cliente_id?: string }) => {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''
    return api.get(`/reunioes${qs}`)
  },
  create: (data: unknown) => api.post('/reunioes', data),
  update: (id: string, data: unknown) => api.patch(`/reunioes/${id}`, data),
}

// Inteligência
export const inteligenciaApi = {
  get: () => api.get('/inteligencia'),
  getQualidade: () => api.get('/inteligencia/qualidade'),
  getCross: () => api.get('/inteligencia/cross'),
  detectarPadroes: () => api.post('/inteligencia/detectar-padroes', {}),
}

// WhatsApp
export const whatsappApi = {
  list:   ()             => api.get('/whatsapp'),
  send:   (data: unknown) => api.post('/whatsapp', data),
}

// Planos
export const planosApi = {
  list:     () => api.get('/planos'),
  assinar:  (plano: string) => api.post('/planos/assinar', { plano }),
  cancelar: (imediato?: boolean) => api.delete('/planos/cancelar', { data: { imediato: imediato ?? false } }),
}

// Dashboard
export const dashboardApi = {
  get: () => api.get('/dashboard'),
}

// Equipe
export const equipeApi = {
  list:     ()                          => api.get('/equipe'),
  metricas: ()                          => api.get('/equipe/metricas'),
  create:   (data: unknown)             => api.post('/equipe', data),
  update:   (id: string, data: unknown) => api.patch(`/equipe/${id}`, data),
  delete:   (id: string)                => api.delete(`/equipe/${id}`),
}

// Pipeline / Deals
export const dealsApi = {
  list:   ()                          => api.get('/deals'),
  create: (data: unknown)             => api.post('/deals', data),
  update: (id: string, data: unknown) => api.patch(`/deals/${id}`, data),
  delete: (id: string)                => api.delete(`/deals/${id}`),
}

// Receptivo
export const receptivoApi = {
  list:       ()                          => api.get('/receptivo'),
  create:     (data: unknown)             => api.post('/receptivo', data),
  update:     (id: string, data: unknown) => api.patch(`/receptivo/${id}`, data),
  getConfig:  ()                          => api.get('/receptivo/config'),
  saveConfig: (data: unknown)             => api.patch('/receptivo/config', data),
}

// Relatórios
export const relatoriosApi = {
  get: () => api.get('/relatorios'),
}

// Inteligência — qualidade e simulador
export const inteligenciaQualidadeApi = {
  list:   ()             => api.get('/inteligencia/qualidade'),
  save:   (data: unknown) => api.post('/inteligencia/qualidade', data),
}
export const inteligenciaSimuladorApi = {
  list:    ()             => api.get('/inteligencia/simulador'),
  create:  (data: unknown) => api.post('/inteligencia/simulador', data),
  ativar:  (id: string)   => api.patch(`/inteligencia/simulador/${id}/ativar`, {}),
}

// Emails
export const emailsApi = {
  inbox:    () => api.get('/emails?tipo=inbox'),
  enviados: () => api.get('/emails?tipo=enviado'),
  marcarLido: (id: string) => api.patch(`/emails/${id}`, { lido: true }),
  enviar: (data: { para: string; assunto: string; corpo: string }) =>
    api.post('/emails/enviar', data),
  modelos: () => api.get('/emails/modelos'),
  saveModelo: (data: unknown) => api.post('/emails/modelos', data),
  updateModelo: (id: string, data: unknown) => api.patch(`/emails/modelos/${id}`, data),
}

// Claude AI
export const claudeApi = {
  status: () => api.get('/claude/status'),
  pesquisarMercado: (data: { empresa?: string; segmento?: string; produto?: string }) =>
    api.post('/claude/pesquisar-mercado', data),
  gerarModelo: (data: { tipo: string; contexto?: string; campanha?: string }) =>
    api.post('/claude/gerar-modelo', data),
  chat: (messages: Array<{ role: string; content: string }>) =>
    api.post('/claude/chat', { messages }),
  briefingHandoff: (data: { transcricao?: string; contato_nome?: string; empresa?: string; gatilhos_detectados?: string[] }) =>
    api.post('/claude/briefing-handoff', data),
  sugerirHorario: (data: { segmento?: string; historico_ligacoes?: Array<{ hora: number; resultado: string }> }) =>
    api.post('/claude/sugerir-horario', data),
  analisarLista: (data: { campanha_id?: string; segmento?: string; total_contatos?: number; amostra?: Array<{ nome?: string; empresa?: string; cargo?: string }> }) =>
    api.post('/claude/analisar-lista', data),
  gerarCross: (data: { gatilho: string; exemplos: string[] }) =>
    api.post('/claude/gerar-cross', data),
  scoreInteligencia: () => api.get('/claude/score-inteligencia'),
}

// Clientes — onboarding e admin
export const clientesApi = {
  criar: (data: unknown) => api.post('/clientes', data),
  me: () => api.get('/clientes/me'),
  buscar: (id: string) => api.get(`/clientes/${id}`),
  enviarDocumentos: (id: string, data: unknown) => api.post(`/clientes/${id}/documentos`, data),
  gerarContrato: (id: string) => api.post(`/clientes/${id}/gerar-contrato`, {}),
  buscarContrato: (id: string) => api.get(`/clientes/${id}/contrato`),
  assinarContrato: (id: string, nomeAssinatura: string) =>
    api.post(`/clientes/${id}/assinar-contrato`, { nome_assinatura: nomeAssinatura }),
}

// Admin — cross-global
export const adminCrossApi = {
  list: () => api.get('/admin/clientes/cross-global'),
  aprovar: (id: string, aprovado: boolean) =>
    api.patch(`/admin/clientes/cross-global/${id}`, { aprovado }),
}

// Admin KPIs globais
export const adminKpisApi = {
  globais:  () => api.get('/admin/clientes/kpis-globais'),
  alertas:  () => api.get('/admin/clientes/alertas'),
  mrrHistorico: () => api.get('/admin/clientes/mrr-historico').catch(() => ({ data: [] })),
}

// Admin — clientes
export const adminClientesApi = {
  list: (status?: string) => {
    const qs = status ? `?status=${status}` : ''
    return api.get(`/admin/clientes${qs}`)
  },
  ativar: (id: string | number) => api.patch(`/admin/clientes/${id}`, { action: 'ativar' }),
  rejeitar: (id: string | number, motivo: string) =>
    api.patch(`/admin/clientes/${id}`, { action: 'rejeitar', motivo_rejeicao: motivo }),
  crossGlobal: () => api.get('/admin/cross-global'),
  aprovarCross: (id: string, aprovado: boolean) => api.patch(`/admin/cross-global/${id}`, { aprovado }),
}

// Transcrição ao vivo
export const transcricaoApi = {
  get: (callControlId: string) => api.get(`/ligacoes/${callControlId}/transcript`),
}

// Google Calendar
export const calendarApi = {
  status:     ()             => api.get('/auth/google/status'),
  /** @returns URL para redirecionar o usuário para OAuth Google */
  connect:    (jwt: string)  => `${BASE_URL}/auth/google?jwt=${jwt}`,
  /** @returns Promise que resolve com a URL de redirecionamento OAuth Google */
  connectAsync: (jwt: string) => Promise.resolve(`${BASE_URL}/auth/google?jwt=${jwt}`),
  disconnect: ()             => api.delete('/auth/google'),
}

// Admin Suporte
export const adminSuporteApi = {
  ligacoes:       () => api.get('/admin/suporte/ligacoes'),
  emails:         () => api.get('/admin/suporte/emails'),
  tickets:        () => api.get('/admin/suporte/tickets'),
  resolverTicket: (id: string) => api.patch(`/admin/suporte/tickets/${id}`, { status: 'resolvido' }),
  responderTicket:(id: string, resposta: string) => api.post(`/admin/suporte/tickets/${id}/responder`, { resposta }),
  clientesVisao:  () => api.get('/admin/suporte/clientes-visao'),
  equipe:         () => api.get('/admin/suporte/equipe'),
}

// Qualidade calculada
export const qualidadeCalcularApi = {
  calcular: () => api.post('/inteligencia/qualidade/calcular', {}),
}

// Telnyx — provisionamento de números
export const telnyxApi = {
  buscarNumeros: (ddd: string, tipo?: string) =>
    api.get(`/telnyx/numeros/buscar?ddd=${ddd}&tipo=${tipo || 'local'}`),
  getSolicitacao: () =>
    api.get('/telnyx/numeros/solicitacao'),
  solicitar: (data: {
    ddd: string; tipo_numero: string; numero_solicitado: string;
    cnpj?: string; razao_social?: string; nome_representante?: string;
    cpf_representante?: string; endereco?: string; cep?: string;
    cidade?: string; estado?: string;
  }) => api.post('/telnyx/numeros/solicitar', data),
  adminTodasSolicitacoes: (status?: string) =>
    api.get(`/telnyx/numeros/admin/todas${status ? `?status=${status}` : ''}`),
  adminAtualizar: (id: string, data: { status?: string; notas_admin?: string; numero_aprovado?: string; motivo_rejeicao?: string }) =>
    api.patch(`/telnyx/numeros/admin/${id}`, data),
  adminProvisionar: (id: string) =>
    api.post(`/telnyx/numeros/provisionar/${id}`, {}),
  getConta: () =>
    api.get('/telnyx/numeros/conta'),
}

