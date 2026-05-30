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
  // Reunião
  tipo_local?: string
  endereco_fixo?: string
  pergunta_formato?: string
  // Vendedores
  vendedoresSelecionados?: string[]
  distribuicao?: string
  // Orquestração multi-canal
  orq_nao_atendeu_on?: boolean
  orq_nao_atendeu_tent?: string
  orq_nao_atendeu_canal?: string
  orq_nao_atendeu_delay?: string
  orq_recusou_on?: boolean
  orq_recusou_acao?: string
  orq_recusou_lgpd?: string
  orq_agendou_on?: boolean
  orq_agendou_email?: string
  orq_agendou_wz?: string
  orq_agendou_lembrete?: string
  orq_gatekeeper_on?: boolean
  orq_gk_callback?: string
  orq_gk_abertura?: string
  tent_redir?: string
  // Proteção de dados
  blacklist?: string
  // Campos específicos por tipo de campanha
  inbound_fonte?: string
  inbound_sla?: string
  ren_produto?: string
  ren_churn?: string
  ren_tom?: string
  b2c_produto?: string
  b2c_perfil?: string
  b2c_volume?: string
  b2c_cta?: string
  nurt_duracao?: string
}
