export type StatusLigacao = 'em_ligacao' | 'na_fila' | 'retornar' | 'agendado' | 'encerrada'
export type ResultadoReuniao = 'fechou' | 'no_show' | 'perdeu' | 'reagendou' | 'em_andamento'

export interface EntradaFila {
  id: string
  empresa: string
  contato: string
  cargo: string
  telefone: string
  agente: string
  campanha: string
  segmento: string
  status: StatusLigacao
  icp: number
  potencial: number
  tentativa: number
  maxTentativas: number
  duracao?: string
  snippet?: string
  gatilhoDetectado?: string
  transferindo?: boolean
}

export interface Agendamento {
  id: string
  empresa: string
  contato: string
  cargo: string
  telefone: string
  email: string
  modalidade: 'online' | 'presencial' | 'hibrido'
  cidade?: string
  cnpj?: string
  segmento?: string
  resumoLigacao: string
  agente: string
  duracaoLigacao: string
  dataHora: string
  meetLink?: string
  vendedor: string
  vendedorIniciais: string
  status: 'confirmado' | 'pendente' | 'cancelado' | 'realizado'
  resultado?: ResultadoReuniao
  noShowRisk: number
  campanha: string
}

export interface GravacaoItem {
  id: string
  empresa: string
  contato: string
  agente: string
  campanha: string
  duracao: string
  data: string
  resultado: 'agendou' | 'nao_atendeu' | 'recusou' | 'transferido'
  icp: number
  gatilhos: string[]
}

export interface ChamadaHistorico {
  id: string
  empresa: string
  contato: string
  telefone: string
  agente: string
  campanha: string
  duracao: string
  data: string
  resultado: string
  tentativa: number
}
