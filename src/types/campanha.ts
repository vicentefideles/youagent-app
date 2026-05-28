export type ModalidadeReuniao = 'online' | 'presencial' | 'hibrido'
export type TipoCampanha = 'outbound' | 'inbound' | 'renovacao' | 'b2c' | 'nurturing'
export type StatusCampanha = 'ativa' | 'pausada' | 'arquivada' | 'concluida'
export type Agressividade = 'alta' | 'media' | 'baixa'

export interface CampanhaDashboard {
  total_lista: number
  ligacoes_feitas: number
  atendidas: number
  agendadas: number
  nao_atendeu: number
  recusou: number
  gatekeeper: number
  na_fila: number
  em_contato: number
  esgotados: number
  custo_total: number
  taxa_conversao: number
  duplicados: number
}

export interface Campanha {
  id: string
  nome: string
  tipo: TipoCampanha
  status: StatusCampanha
  modalidade: ModalidadeReuniao
  estado: string
  cidade?: string
  segmento?: string
  agente_id?: string
  agente_nome?: string
  agressividade: Agressividade
  meta_agendamentos?: number
  hora_inicio: string
  hora_fim: string
  limite_diario: number
  pausa_almoco: boolean
  dias_operacao: string[]
  icp_ativo: boolean
  icp_threshold: number
  duracao_reuniao: string
  criado_em: string
  discagem_simultanea?: number
  lista_duplicados?: number
  // Dashboard (contadores)
  dashboard?: CampanhaDashboard
  // Total de contatos
  total_contatos?: number
}

export interface NovaCampanhaForm {
  nome: string
  tipo: TipoCampanha
  estado: string
  cidade: string
  segmento: string
  modalidade: ModalidadeReuniao
  agente_id: string
  agressividade: Agressividade
  meta_agendamentos: string
  hora_inicio: string
  hora_fim: string
  limite_diario: string
  pausa_almoco: boolean
  dias_operacao: string[]
  icp_ativo: boolean
  duracao_reuniao: string
}
