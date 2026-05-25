import { useState, useEffect, useRef } from 'react';
import {
  Headphones,
  Phone,
  PhoneCall,
  Mail,
  MessageCircle,
  FileText,
  Megaphone,
  PhoneOff,
  Play,
  Eye,
  Send,
  Search,
  X,
  CheckCircle,
  XCircle,
  Clock,
  RotateCcw,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = 'discagem' | 'ligacoes' | 'email' | 'msgs' | 'modelos' | 'marketing' | 'suporte' | '360' | 'inbox' | 'enviados' | 'historico';

interface Client {
  id: string;
  company: string;
  contact: string;
  phone: string;
  plan: string;
}

interface CallRecord {
  id: string;
  company: string;
  contact: string;
  duration: string;
  status: 'Atendida' | 'Não Atendida' | 'Transferida';
  agent: string;
  datetime: string;
}

interface EmailRecord {
  id: string;
  company: string;
  subject: string;
  status: 'Aberto' | 'Enviado' | 'Sem Resposta';
  date: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  unread: number;
}

interface ChatMessage {
  id: string;
  memberId: string;
  text: string;
  fromMe: boolean;
  time: string;
}

interface Template {
  id: string;
  title: string;
  description: string;
  category: 'Prospecção' | 'Follow-up' | 'Nutrição';
  body: string;
}

interface Campaign {
  id: string;
  name: string;
  channel: 'Email' | 'WhatsApp';
  audience: string;
  sent: number;
  opened: number;
  rate: string;
  status: 'Ativa' | 'Pausada';
}

type CallResult = 'Reunião Agendada' | 'Não Atendeu' | 'Perdido' | 'Retornar';

interface Ticket {
  id: string;
  empresa: string;
  titulo: string;
  prioridade: 'Alta' | 'Média' | 'Baixa';
  status: 'Aberto' | 'Em andamento' | 'Resolvido';
  data: string;
  responsavel: string;
  descricao: string;
}

interface ClienteVisao {
  id: string;
  empresa: string;
  plano: string;
  inicio: string;
  agentes: number;
  ligacoesTotais: number;
  mrr: number;
  nps: number;
  taxaConversao: number;
  churnRisk: 'Baixo' | 'Médio' | 'Alto';
  timeline: { data: string; evento: string }[];
}

interface InboxEmail {
  id: string;
  empresa: string;
  assunto: string;
  preview: string;
  data: string;
  lido: boolean;
  thread: { de: string; texto: string; data: string }[];
}

interface EmailEnviado {
  id: string;
  destinatario: string;
  empresa: string;
  assunto: string;
  data: string;
  status: 'Entregue' | 'Lido' | 'Sem resposta';
}

interface Interacao {
  id: string;
  empresa: string;
  tipo: 'Ligação' | 'E-mail' | 'Ticket' | 'Chat';
  data: string;
  preview: string;
  resultado: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_CLIENTS: Client[] = [
  { id: '1', company: 'TechCorp Ltda', contact: 'Rafael Mendes', phone: '(11) 98765-4321', plan: 'Pro' },
  { id: '2', company: 'Vendas Express', contact: 'Carla Souza', phone: '(21) 97654-3210', plan: 'Starter' },
  { id: '3', company: 'Grupo Alfa', contact: 'Marcelo Lima', phone: '(31) 96543-2109', plan: 'Enterprise' },
  { id: '4', company: 'DataFlow S/A', contact: 'Fernanda Costa', phone: '(41) 95432-1098', plan: 'Pro' },
  { id: '5', company: 'Rede Comercial', contact: 'Bruno Alves', phone: '(51) 94321-0987', plan: 'Starter' },
];

const MOCK_CALLS: CallRecord[] = [
  { id: '1', company: 'TechCorp Ltda', contact: 'Rafael Mendes', duration: '4:32', status: 'Atendida', agent: 'Ana', datetime: '23/05 09:14' },
  { id: '2', company: 'Vendas Express', contact: 'Carla Souza', duration: '0:18', status: 'Não Atendida', agent: 'Carlos', datetime: '23/05 09:28' },
  { id: '3', company: 'Grupo Alfa', contact: 'Marcelo Lima', duration: '7:05', status: 'Transferida', agent: 'Ana', datetime: '23/05 10:03' },
  { id: '4', company: 'DataFlow S/A', contact: 'Fernanda Costa', duration: '2:47', status: 'Atendida', agent: 'Carlos', datetime: '23/05 10:41' },
  { id: '5', company: 'Rede Comercial', contact: 'Bruno Alves', duration: '0:09', status: 'Não Atendida', agent: 'Ana', datetime: '23/05 11:15' },
  { id: '6', company: 'TechCorp Ltda', contact: 'Rafael Mendes', duration: '5:51', status: 'Atendida', agent: 'Carlos', datetime: '23/05 13:20' },
  { id: '7', company: 'Grupo Alfa', contact: 'Marcelo Lima', duration: '1:22', status: 'Atendida', agent: 'Ana', datetime: '23/05 14:08' },
];

const MOCK_EMAILS: EmailRecord[] = [
  { id: '1', company: 'TechCorp Ltda', subject: 'Proposta ETZ Pro', status: 'Aberto', date: '23/05 08:00' },
  { id: '2', company: 'Vendas Express', subject: 'Follow-up reunião', status: 'Enviado', date: '23/05 08:45' },
  { id: '3', company: 'Grupo Alfa', subject: 'Onboarding — primeiros passos', status: 'Aberto', date: '23/05 09:30' },
  { id: '4', company: 'DataFlow S/A', subject: 'Reativação de conta', status: 'Sem Resposta', date: '22/05 16:10' },
  { id: '5', company: 'Rede Comercial', subject: 'Upgrade para Enterprise', status: 'Enviado', date: '22/05 14:00' },
  { id: '6', company: 'TechCorp Ltda', subject: 'Resultado do piloto', status: 'Aberto', date: '21/05 11:20' },
  { id: '7', company: 'DataFlow S/A', subject: 'Proposta renovação anual', status: 'Sem Resposta', date: '20/05 09:00' },
];

const MOCK_MEMBERS: TeamMember[] = [
  { id: 'm1', name: 'Ana Oliveira', role: 'SDR', unread: 2 },
  { id: 'm2', name: 'Carlos Pereira', role: 'Closer', unread: 0 },
  { id: 'm3', name: 'Diana Rocha', role: 'CS', unread: 1 },
  { id: 'm4', name: 'Eduardo Silva', role: 'Gerente', unread: 0 },
];

const MOCK_MESSAGES: ChatMessage[] = [
  { id: 'msg1', memberId: 'm1', text: 'Rafael pediu desconto de 20%, posso oferecer?', fromMe: false, time: '09:10' },
  { id: 'msg2', memberId: 'm1', text: 'Pode oferecer até 15%, ok?', fromMe: true, time: '09:12' },
  { id: 'msg3', memberId: 'm1', text: 'Entendido. Ele fechou! 🎉', fromMe: false, time: '09:18' },
  { id: 'msg4', memberId: 'm1', text: 'Ótimo! Registra no CRM por favor.', fromMe: true, time: '09:19' },
  { id: 'msg5', memberId: 'm1', text: 'Feito. Próximo lead já está na fila.', fromMe: false, time: '09:20' },
  { id: 'msg6', memberId: 'm2', text: 'Grupo Alfa quer uma call técnica antes de fechar.', fromMe: false, time: '10:05' },
  { id: 'msg7', memberId: 'm2', text: 'Agenda para amanhã 14h. Vou preparar o deck.', fromMe: true, time: '10:08' },
  { id: 'msg8', memberId: 'm3', text: 'DataFlow está com dificuldade no onboarding.', fromMe: false, time: '11:00' },
  { id: 'msg9', memberId: 'm3', text: 'Vou agendar uma sessão de CS com eles hoje.', fromMe: true, time: '11:02' },
  { id: 'msg10', memberId: 'm4', text: 'Meta do mês está em 78%. Precisamos acelerar.', fromMe: false, time: '08:30' },
  { id: 'msg11', memberId: 'm4', text: 'Vou revisar o pipeline agora e te passo um relatório.', fromMe: true, time: '08:35' },
];

const MOCK_TEMPLATES: Template[] = [
  { id: 't1', title: 'Não Atendeu', description: 'Mensagem para contatos que não atenderam a ligação.', category: 'Prospecção', body: 'Olá {{nome}}, tentei falar com você hoje mas não consegui. Posso te ligar em outro momento?' },
  { id: 't2', title: 'Follow-up pós reunião', description: 'E-mail enviado após reunião de apresentação.', category: 'Follow-up', body: 'Olá {{nome}}, foi um prazer conversar hoje! Segue em anexo nossa proposta conforme combinado.' },
  { id: 't3', title: 'Proposta Comercial', description: 'Template de proposta com valores e planos.', category: 'Prospecção', body: 'Olá {{nome}}, conforme nossa conversa, preparei uma proposta exclusiva para a {{empresa}}. Veja os detalhes abaixo.' },
  { id: 't4', title: 'Reativação', description: 'Para leads inativos há mais de 30 dias.', category: 'Nutrição', body: 'Olá {{nome}}, faz um tempo que não nos falamos. Temos novidades que podem ser muito relevantes para a {{empresa}}.' },
  { id: 't5', title: 'Onboarding', description: 'Boas-vindas e primeiros passos na plataforma.', category: 'Follow-up', body: 'Bem-vindo(a) ao ETZ, {{nome}}! Seu agente já está configurado. Veja o guia de início rápido aqui.' },
  { id: 't6', title: 'Upgrade de Plano', description: 'Oferta de upgrade para clientes no plano básico.', category: 'Nutrição', body: 'Olá {{nome}}, você está aproveitando bem o ETZ! Já pensou em desbloquear recursos avançados com o plano Pro?' },
];

const MOCK_TICKETS: Ticket[] = [
  { id: 't1', empresa: 'TechCorp Ltda', titulo: 'Agente não está discando', prioridade: 'Alta', status: 'Aberto', data: '24/05 09:30', responsavel: 'Ana Oliveira', descricao: 'O agente parou de discar após atualização. Impacto em 3 campanhas.' },
  { id: 't2', empresa: 'Vendas Express', titulo: 'Relatório com dados incorretos', prioridade: 'Média', status: 'Em andamento', data: '24/05 08:15', responsavel: 'Carlos Pereira', descricao: 'KPIs de conversão aparecem zerados no dashboard.' },
  { id: 't3', empresa: 'Grupo Alfa', titulo: 'Integração Telnyx falhando', prioridade: 'Alta', status: 'Em andamento', data: '23/05 17:40', responsavel: 'Ana Oliveira', descricao: 'Webhooks de status de chamada não chegando.' },
  { id: 't4', empresa: 'DataFlow S/A', titulo: 'Dúvida sobre faturamento', prioridade: 'Baixa', status: 'Resolvido', data: '23/05 14:00', responsavel: 'Diana Rocha', descricao: 'Cliente perguntou sobre cobrança proporcional.' },
  { id: 't5', empresa: 'Rede Comercial', titulo: 'Upload de leads não funciona', prioridade: 'Média', status: 'Aberto', data: '23/05 11:20', responsavel: 'Carlos Pereira', descricao: 'CSV de leads retorna erro ao fazer upload.' },
  { id: 't6', empresa: 'TechCorp Ltda', titulo: 'Solicitar mais agentes', prioridade: 'Baixa', status: 'Resolvido', data: '22/05 16:00', responsavel: 'Diana Rocha', descricao: 'Cliente quer adicionar 2 novos agentes ao plano Growth.' },
];

const MOCK_CLIENTES_VISAO: ClienteVisao[] = [
  {
    id: 'v1', empresa: 'TechCorp Ltda', plano: 'Enterprise', inicio: '2025-11-01', agentes: 6, ligacoesTotais: 4280, mrr: 5990, nps: 72, taxaConversao: 18, churnRisk: 'Baixo',
    timeline: [
      { data: '01/11/2025', evento: 'Contratação Enterprise' },
      { data: '05/11/2025', evento: 'Onboarding completo' },
      { data: '12/11/2025', evento: 'Primeira campanha ativa' },
      { data: '01/02/2026', evento: 'Upgrade: +2 agentes' },
      { data: '10/05/2026', evento: 'Ticket #t1 aberto' },
    ]
  },
  {
    id: 'v2', empresa: 'Grupo Alfa', plano: 'Growth', inicio: '2026-01-15', agentes: 3, ligacoesTotais: 1840, mrr: 2490, nps: 58, taxaConversao: 14, churnRisk: 'Médio',
    timeline: [
      { data: '15/01/2026', evento: 'Contratação Growth' },
      { data: '18/01/2026', evento: 'Onboarding completo' },
      { data: '25/01/2026', evento: 'Primeira campanha ativa' },
      { data: '23/05/2026', evento: 'Ticket #t3 aberto — integração' },
    ]
  },
];

const MOCK_INBOX: InboxEmail[] = [
  { id: 'i1', empresa: 'TechCorp Ltda', assunto: 'Problema urgente no agente', preview: 'Nosso agente parou de funcionar hoje cedo...', data: '24/05 09:15', lido: false, thread: [{ de: 'rafael@techcorp.com', texto: 'Nosso agente parou de funcionar hoje cedo. Precisamos de suporte urgente.', data: '24/05 09:15' }] },
  { id: 'i2', empresa: 'Vendas Express', assunto: 'Re: Relatório incorreto', preview: 'Obrigada pela resposta rápida...', data: '24/05 08:40', lido: true, thread: [{ de: 'carla@vendasexpress.com', texto: 'Obrigada pela resposta rápida! Pode verificar também os dados de ontem?', data: '24/05 08:40' }] },
  { id: 'i3', empresa: 'DataFlow S/A', assunto: 'Interesse em upgrade', preview: 'Estamos satisfeitos com o plano atual mas...', data: '23/05 16:30', lido: false, thread: [{ de: 'fernanda@dataflow.com', texto: 'Estamos satisfeitos com o plano atual, mas gostaríamos de entender o Enterprise.', data: '23/05 16:30' }] },
  { id: 'i4', empresa: 'Rede Comercial', assunto: 'Dúvida sobre CSV', preview: 'Estou tentando importar os leads...', data: '23/05 11:10', lido: false, thread: [{ de: 'bruno@redecomercial.com', texto: 'Estou tentando importar os leads mas o sistema retorna erro 400.', data: '23/05 11:10' }] },
  { id: 'i5', empresa: 'Grupo Alfa', assunto: 'Reunião de alinhamento', preview: 'Podemos agendar para semana que vem?', data: '22/05 14:00', lido: true, thread: [{ de: 'marcelo@grupoalfa.com', texto: 'Podemos agendar uma reunião de alinhamento para semana que vem?', data: '22/05 14:00' }] },
  { id: 'i6', empresa: 'TechCorp Ltda', assunto: 'Feedback do piloto', preview: 'Resultados muito positivos até agora...', data: '21/05 10:20', lido: true, thread: [{ de: 'rafael@techcorp.com', texto: 'Resultados muito positivos até agora! Taxa de conversão subiu 12%.', data: '21/05 10:20' }] },
];

const MOCK_ENVIADOS: EmailEnviado[] = [
  { id: 'e1', destinatario: 'rafael@techcorp.com', empresa: 'TechCorp Ltda', assunto: 'Re: Problema urgente — estamos verificando', data: '24/05 09:45', status: 'Entregue' },
  { id: 'e2', destinatario: 'carla@vendasexpress.com', empresa: 'Vendas Express', assunto: 'Correção no relatório aplicada', data: '24/05 08:50', status: 'Lido' },
  { id: 'e3', destinatario: 'thiago@apexcorr.com', empresa: 'Apex Corretora', assunto: 'Proposta de renovação anual', data: '23/05 15:00', status: 'Sem resposta' },
  { id: 'e4', destinatario: 'lucas@primeimoveis.com', empresa: 'Prime Imóveis SP', assunto: 'Dicas para melhorar sua taxa de conversão', data: '23/05 10:30', status: 'Lido' },
  { id: 'e5', destinatario: 'paulo@conectarh.com', empresa: 'Conecta RH', assunto: 'Novidades da plataforma — maio 2026', data: '22/05 09:00', status: 'Sem resposta' },
];

const MOCK_HISTORICO: Interacao[] = [
  { id: 'h1', empresa: 'TechCorp Ltda', tipo: 'Ticket', data: '24/05 09:30', preview: 'Agente não está discando', resultado: 'Em andamento' },
  { id: 'h2', empresa: 'Vendas Express', tipo: 'E-mail', data: '24/05 08:15', preview: 'Relatório com dados incorretos', resultado: 'Respondido' },
  { id: 'h3', empresa: 'Grupo Alfa', tipo: 'Ligação', data: '23/05 17:00', preview: 'Suporte técnico integração Telnyx', resultado: 'Transferido para dev' },
  { id: 'h4', empresa: 'DataFlow S/A', tipo: 'Chat', data: '23/05 14:30', preview: 'Dúvida sobre faturamento proporcional', resultado: 'Resolvido' },
  { id: 'h5', empresa: 'Rede Comercial', tipo: 'E-mail', data: '23/05 11:20', preview: 'Upload de leads com erro 400', resultado: 'Aguardando cliente' },
  { id: 'h6', empresa: 'TechCorp Ltda', tipo: 'Ligação', data: '22/05 16:00', preview: 'Solicitar mais agentes — plano Growth', resultado: 'Resolvido' },
  { id: 'h7', empresa: 'Apex Corretora', tipo: 'E-mail', data: '22/05 10:00', preview: 'Proposta de renovação anual enviada', resultado: 'Sem resposta' },
  { id: 'h8', empresa: 'Genova Consultoria', tipo: 'Chat', data: '21/05 15:20', preview: 'Onboarding — dúvidas ICP', resultado: 'Resolvido' },
  { id: 'h9', empresa: 'Prime Imóveis SP', tipo: 'Ticket', data: '21/05 09:00', preview: 'Conversão abaixo do esperado', resultado: 'Resolvido' },
  { id: 'h10', empresa: 'Conecta RH', tipo: 'Ligação', data: '20/05 14:00', preview: 'Check-in mensal de CS', resultado: 'Concluído' },
];

const MOCK_CAMPAIGNS: Campaign[] = [
  { id: 'c1', name: 'Prospecção Q2', channel: 'Email', audience: 'Leads Frios', sent: 1200, opened: 480, rate: '40%', status: 'Ativa' },
  { id: 'c2', name: 'Follow-up Reuniões', channel: 'Email', audience: 'MQLs', sent: 340, opened: 210, rate: '62%', status: 'Ativa' },
  { id: 'c3', name: 'Reativação Maio', channel: 'WhatsApp', audience: 'Inativos 60d', sent: 890, opened: 420, rate: '47%', status: 'Ativa' },
  { id: 'c4', name: 'Upgrade Enterprise', channel: 'Email', audience: 'Clientes Pro', sent: 91, opened: 55, rate: '60%', status: 'Pausada' },
  { id: 'c5', name: 'Onboarding Novos', channel: 'WhatsApp', audience: 'Novos Clientes', sent: 200, opened: 185, rate: '93%', status: 'Pausada' },
];

// ─── Utility components ───────────────────────────────────────────────────────

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-1">
      <span className="text-xs text-gray-500 font-medium">{label}</span>
      <span className="text-2xl font-bold text-gray-900">{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Atendida: 'bg-green-50 text-green-700 border-green-200',
    'Não Atendida': 'bg-amber-50 text-amber-700 border-amber-200',
    Transferida: 'bg-blue-50 text-blue-700 border-blue-200',
    Aberto: 'bg-green-50 text-green-700 border-green-200',
    Enviado: 'bg-blue-50 text-blue-700 border-blue-200',
    'Sem Resposta': 'bg-gray-100 text-gray-600 border-gray-200',
    Ativa: 'bg-green-50 text-green-700 border-green-200',
    Pausada: 'bg-amber-50 text-amber-700 border-amber-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${map[status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
      {status}
    </span>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const map: Record<string, string> = {
    Starter: 'bg-gray-100 text-gray-600',
    Pro: 'bg-blue-100 text-blue-700',
    Enterprise: 'bg-purple-100 text-purple-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${map[plan] ?? 'bg-gray-100 text-gray-600'}`}>
      {plan}
    </span>
  );
}

function ChannelBadge({ channel }: { channel: 'Email' | 'WhatsApp' }) {
  return channel === 'Email'
    ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">Email</span>
    : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">WhatsApp</span>;
}

// ─── Tab: Discagem Manual ─────────────────────────────────────────────────────

function TabDiscagem() {
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [emLigacao, setEmLigacao] = useState(false);
  const [timer, setTimer] = useState(0);
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState<CallResult | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (emLigacao) {
      intervalRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [emLigacao]);

  const filteredClients = MOCK_CLIENTS.filter(
    (c) =>
      c.company.toLowerCase().includes(search.toLowerCase()) ||
      c.contact.toLowerCase().includes(search.toLowerCase()),
  );

  const formatTimer = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setEmLigacao(false);
    setTimer(0);
    setNotes('');
    setResult(null);
  };

  const handleStartCall = () => {
    setEmLigacao(true);
    setTimer(0);
    setResult(null);
  };

  const handleEndCall = () => {
    setEmLigacao(false);
  };

  const handleResult = (r: CallResult) => setResult(r);

  const resultButtons: { label: CallResult; icon: React.ReactNode; cls: string }[] = [
    { label: 'Reunião Agendada', icon: <CheckCircle size={14} />, cls: 'bg-green-600 hover:bg-green-700 text-white' },
    { label: 'Não Atendeu', icon: <PhoneOff size={14} />, cls: 'bg-amber-500 hover:bg-amber-600 text-white' },
    { label: 'Perdido', icon: <XCircle size={14} />, cls: 'bg-red-600 hover:bg-red-700 text-white' },
    { label: 'Retornar', icon: <RotateCcw size={14} />, cls: 'bg-blue-600 hover:bg-blue-700 text-white' },
  ];

  return (
    <div className="flex gap-4 h-full">
      {/* Left panel */}
      <div className="w-1/3 bg-white border border-gray-200 rounded-xl flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {filteredClients.map((client) => (
            <button
              key={client.id}
              onClick={() => handleSelectClient(client)}
              className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${selectedClient?.id === client.id ? 'bg-blue-50 border-l-2 border-blue-500' : ''}`}
            >
              <div className="font-medium text-sm text-gray-900">{client.company}</div>
              <div className="text-xs text-gray-500">{client.contact} · {client.phone}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 bg-white border border-gray-200 rounded-xl flex flex-col">
        {!selectedClient ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400">
            <Phone size={40} strokeWidth={1.5} />
            <span className="text-sm">Selecione um cliente para iniciar</span>
          </div>
        ) : (
          <div className="flex flex-col gap-4 p-6">
            {/* Client info */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-gray-900">{selectedClient.company}</span>
                  <PlanBadge plan={selectedClient.plan} />
                </div>
                <div className="text-sm text-gray-500 mt-0.5">{selectedClient.contact} · {selectedClient.phone}</div>
              </div>
              {emLigacao && (
                <div className="flex items-center gap-1.5 text-green-600 font-mono font-semibold text-lg">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  {formatTimer(timer)}
                </div>
              )}
            </div>

            {/* Call button */}
            {!emLigacao && !result && (
              <button
                onClick={handleStartCall}
                className="flex items-center gap-2 justify-center w-fit px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Phone size={16} />
                Iniciar Ligação
              </button>
            )}
            {emLigacao && (
              <button
                onClick={handleEndCall}
                className="flex items-center gap-2 justify-center w-fit px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <PhoneOff size={16} />
                Encerrar Ligação
              </button>
            )}

            {/* Notes */}
            {(emLigacao || result !== null) && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">Notas da ligação</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notas da ligação..."
                  rows={4}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Register result */}
            {!emLigacao && timer > 0 && !result && (
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Registrar Resultado</span>
                <div className="flex flex-wrap gap-2">
                  {resultButtons.map((rb) => (
                    <button
                      key={rb.label}
                      onClick={() => handleResult(rb.label)}
                      className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${rb.cls}`}
                    >
                      {rb.icon}
                      {rb.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {result && (
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                <CheckCircle size={16} className="text-green-600" />
                <span className="text-sm text-gray-700">Resultado registrado: <strong>{result}</strong></span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Ligações ────────────────────────────────────────────────────────────

function TabLigacoes() {
  const [empresa, setEmpresa] = useState('');
  const [status, setStatus] = useState('Todos');
  const [date, setDate] = useState('');

  const filtered = MOCK_CALLS.filter((c) => {
    const matchEmpresa = c.company.toLowerCase().includes(empresa.toLowerCase());
    const matchStatus = status === 'Todos' || c.status === status;
    return matchEmpresa && matchStatus;
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-4 gap-3">
        <KpiCard label="Total Ligações" value="1.247" />
        <KpiCard label="Atendidas" value="891" />
        <KpiCard label="Não Atendidas" value="356" />
        <KpiCard label="Tx Atendimento" value="71%" />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex gap-3 p-4 border-b border-gray-100">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Empresa..."
              value={empresa}
              onChange={(e) => setEmpresa(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {['Todos', 'Atendida', 'Não Atendida', 'Transferida'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-xs text-gray-500 font-medium uppercase tracking-wide">
              {['Empresa', 'Contato', 'Duração', 'Status', 'Agente', 'Data/Hora', 'Ações'].map((h) => (
                <th key={h} className="text-left px-4 py-2.5">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">{row.company}</td>
                <td className="px-4 py-3 text-gray-600">{row.contact}</td>
                <td className="px-4 py-3 text-gray-600 font-mono">{row.duration}</td>
                <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                <td className="px-4 py-3 text-gray-600">{row.agent}</td>
                <td className="px-4 py-3 text-gray-500">{row.datetime}</td>
                <td className="px-4 py-3">
                  <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700">
                    <Play size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tab: E-mail ──────────────────────────────────────────────────────────────

function TabEmail() {
  const [empresa, setEmpresa] = useState('');
  const [status, setStatus] = useState('Todos');

  const filtered = MOCK_EMAILS.filter((e) => {
    const matchEmpresa = e.company.toLowerCase().includes(empresa.toLowerCase());
    const matchStatus = status === 'Todos' || e.status === status;
    return matchEmpresa && matchStatus;
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-4 gap-3">
        <KpiCard label="Enviados" value="2.341" />
        <KpiCard label="Abertos" value="1.205" />
        <KpiCard label="Cliques" value="389" />
        <KpiCard label="Taxa Abertura" value="51%" />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex gap-3 p-4 border-b border-gray-100">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Empresa..."
              value={empresa}
              onChange={(e) => setEmpresa(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {['Todos', 'Aberto', 'Enviado', 'Sem Resposta'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-xs text-gray-500 font-medium uppercase tracking-wide">
              {['Empresa', 'Assunto', 'Status', 'Data', 'Ações'].map((h) => (
                <th key={h} className="text-left px-4 py-2.5">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">{row.company}</td>
                <td className="px-4 py-3 text-gray-700">{row.subject}</td>
                <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                <td className="px-4 py-3 text-gray-500">{row.date}</td>
                <td className="px-4 py-3">
                  <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700">
                    <Eye size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tab: Msgs Internas ───────────────────────────────────────────────────────

function TabMsgs() {
  const [selectedMember, setSelectedMember] = useState<string>('m1');
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_MESSAGES);
  const bottomRef = useRef<HTMLDivElement>(null);

  const conversation = messages.filter((m) => m.memberId === selectedMember);
  const member = MOCK_MEMBERS.find((m) => m.id === selectedMember);

  const handleSend = () => {
    if (!messageInput.trim()) return;
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    setMessages((prev) => [
      ...prev,
      { id: `msg-${Date.now()}`, memberId: selectedMember, text: messageInput.trim(), fromMe: true, time },
    ]);
    setMessageInput('');
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="flex gap-4 h-full" style={{ minHeight: '480px' }}>
      {/* Sidebar */}
      <div className="w-56 bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-gray-100">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Equipe</span>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {MOCK_MEMBERS.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedMember(m.id)}
              className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center justify-between ${selectedMember === m.id ? 'bg-blue-50 border-l-2 border-blue-500' : ''}`}
            >
              <div>
                <div className="text-sm font-medium text-gray-900">{m.name}</div>
                <div className="text-xs text-gray-500">{m.role}</div>
              </div>
              {m.unread > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold">
                  {m.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 bg-white border border-gray-200 rounded-xl flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-900">{member?.name}</span>
          <span className="text-xs text-gray-500 ml-2">{member?.role}</span>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
          {conversation.map((msg) => (
            <div key={msg.id} className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-sm px-3 py-2 rounded-xl text-sm ${msg.fromMe ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                <p>{msg.text}</p>
                <span className={`text-xs mt-1 block ${msg.fromMe ? 'text-blue-200' : 'text-gray-400'}`}>{msg.time}</span>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="p-3 border-t border-gray-100 flex gap-2">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite uma mensagem..."
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSend}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Modelos ─────────────────────────────────────────────────────────────

type TemplateCategory = 'Todos' | 'Prospecção' | 'Follow-up' | 'Nutrição';

function TabModelos() {
  const [filter, setFilter] = useState<TemplateCategory>('Todos');
  const [expanded, setExpanded] = useState<string | null>(null);

  const categories: TemplateCategory[] = ['Todos', 'Prospecção', 'Follow-up', 'Nutrição'];

  const filtered = MOCK_TEMPLATES.filter(
    (t) => filter === 'Todos' || t.category === filter,
  );

  const categoryColor: Record<Template['category'], string> = {
    'Prospecção': 'bg-blue-50 text-blue-700 border-blue-200',
    'Follow-up': 'bg-purple-50 text-purple-700 border-purple-200',
    'Nutrição': 'bg-amber-50 text-amber-700 border-amber-200',
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors border ${filter === c ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {filtered.map((t) => (
          <div key={t.id} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <button
                onClick={() => setExpanded(expanded === t.id ? null : t.id)}
                className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors text-left"
              >
                {t.title}
              </button>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${categoryColor[t.category]}`}>
                {t.category}
              </span>
            </div>
            <p className="text-xs text-gray-500">{t.description}</p>

            {expanded === t.id && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 font-mono leading-relaxed">
                {t.body}
              </div>
            )}

            <button className="w-fit px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              Usar Modelo
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Marketing ───────────────────────────────────────────────────────────

interface NewCampaignForm {
  nome: string;
  canal: 'Email' | 'WhatsApp';
  tipo: string;
  audiencia: string;
}

function TabMarketing() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(MOCK_CAMPAIGNS);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<NewCampaignForm>({ nome: '', canal: 'Email', tipo: '', audiencia: '' });

  const handleToggle = (id: string) => {
    setCampaigns((prev) =>
      prev.map((c) => c.id === id ? { ...c, status: c.status === 'Ativa' ? 'Pausada' : 'Ativa' } : c),
    );
  };

  const handleSave = () => {
    if (!form.nome.trim()) return;
    const newCampaign: Campaign = {
      id: `c${Date.now()}`,
      name: form.nome,
      channel: form.canal,
      audience: form.audiencia || 'Todos',
      sent: 0,
      opened: 0,
      rate: '0%',
      status: 'Ativa',
    };
    setCampaigns((prev) => [...prev, newCampaign]);
    setShowModal(false);
    setForm({ nome: '', canal: 'Email', tipo: '', audiencia: '' });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-4 gap-3">
        <KpiCard label="Campanhas Ativas" value="3" />
        <KpiCard label="Leads Alcançados" value="4.521" />
        <KpiCard label="Taxa Engajamento" value="18%" />
        <KpiCard label="MRR Gerado" value="R$ 12.400" />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-700">Campanhas</span>
          <button
            onClick={() => setShowModal(true)}
            className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            + Nova Campanha
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-xs text-gray-500 font-medium uppercase tracking-wide">
              {['Campanha', 'Canal', 'Audiência', 'Enviados', 'Abertos', 'Taxa', 'Status', 'Ações'].map((h) => (
                <th key={h} className="text-left px-4 py-2.5">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {campaigns.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">{row.name}</td>
                <td className="px-4 py-3"><ChannelBadge channel={row.channel} /></td>
                <td className="px-4 py-3 text-gray-600">{row.audience}</td>
                <td className="px-4 py-3 text-gray-700">{row.sent.toLocaleString('pt-BR')}</td>
                <td className="px-4 py-3 text-gray-700">{row.opened.toLocaleString('pt-BR')}</td>
                <td className="px-4 py-3 font-medium text-gray-700">{row.rate}</td>
                <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggle(row.id)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${row.status === 'Ativa' ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200' : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'}`}
                  >
                    {row.status === 'Ativa' ? 'Pausar' : 'Ativar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-gray-900">Nova Campanha</span>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">Nome</label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  placeholder="Nome da campanha"
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">Canal</label>
                <select
                  value={form.canal}
                  onChange={(e) => setForm((f) => ({ ...f, canal: e.target.value as 'Email' | 'WhatsApp' }))}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Email">Email</option>
                  <option value="WhatsApp">WhatsApp</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">Tipo</label>
                <input
                  type="text"
                  value={form.tipo}
                  onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
                  placeholder="Ex: Prospecção, Follow-up..."
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">Audiência</label>
                <select
                  value={form.audiencia}
                  onChange={(e) => setForm((f) => ({ ...f, audiencia: e.target.value }))}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecionar audiência...</option>
                  <option value="Leads Frios">Leads Frios</option>
                  <option value="MQLs">MQLs</option>
                  <option value="Clientes Pro">Clientes Pro</option>
                  <option value="Inativos 60d">Inativos 60d</option>
                  <option value="Novos Clientes">Novos Clientes</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Suporte ─────────────────────────────────────────────────────────────

function PrioridadeBadge({ p }: { p: Ticket['prioridade'] }) {
  const map: Record<Ticket['prioridade'], string> = {
    Alta: 'bg-red-100 text-red-700',
    Média: 'bg-amber-100 text-amber-700',
    Baixa: 'bg-gray-100 text-gray-600',
  }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[p]}`}>{p}</span>
}

function TicketStatusBadge({ s }: { s: Ticket['status'] }) {
  const map: Record<Ticket['status'], string> = {
    Aberto: 'bg-blue-100 text-blue-700',
    'Em andamento': 'bg-amber-100 text-amber-700',
    Resolvido: 'bg-green-100 text-green-700',
  }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[s]}`}>{s}</span>
}

function TabSuporte() {
  const [filtroPrio, setFiltroPrio] = useState('Todos');
  const [filtroStatus, setFiltroStatus] = useState('Todos');
  const [ticketAberto, setTicketAberto] = useState<Ticket | null>(null);
  const [resposta, setResposta] = useState('');

  const filtrados = MOCK_TICKETS.filter(t => {
    const okP = filtroPrio === 'Todos' || t.prioridade === filtroPrio;
    const okS = filtroStatus === 'Todos' || t.status === filtroStatus;
    return okP && okS;
  });

  return (
    <div className="flex gap-4">
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex gap-3">
          <select value={filtroPrio} onChange={e => setFiltroPrio(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            {['Todos', 'Alta', 'Média', 'Baixa'].map(o => <option key={o}>{o}</option>)}
          </select>
          <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            {['Todos', 'Aberto', 'Em andamento', 'Resolvido'].map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 font-medium uppercase tracking-wide">
                {['Empresa', 'Título', 'Prioridade', 'Status', 'Data', 'Responsável'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtrados.map(t => (
                <tr key={t.id} onClick={() => setTicketAberto(t)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{t.empresa}</td>
                  <td className="px-4 py-3 text-gray-700">{t.titulo}</td>
                  <td className="px-4 py-3"><PrioridadeBadge p={t.prioridade} /></td>
                  <td className="px-4 py-3"><TicketStatusBadge s={t.status} /></td>
                  <td className="px-4 py-3 text-gray-500">{t.data}</td>
                  <td className="px-4 py-3 text-gray-600">{t.responsavel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {ticketAberto && (
        <div className="w-80 bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-4 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900">Detalhes</span>
            <button onClick={() => setTicketAberto(null)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
              <X size={14} />
            </button>
          </div>
          <div className="space-y-2 text-sm">
            <p className="font-medium text-gray-900">{ticketAberto.titulo}</p>
            <p className="text-xs text-gray-500">{ticketAberto.empresa} · {ticketAberto.data}</p>
            <div className="flex gap-2"><PrioridadeBadge p={ticketAberto.prioridade} /><TicketStatusBadge s={ticketAberto.status} /></div>
            <p className="text-gray-600 text-xs leading-relaxed">{ticketAberto.descricao}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Resposta</label>
            <textarea value={resposta} onChange={e => setResposta(e.target.value)} rows={4} placeholder="Digite sua resposta..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setTicketAberto(null); setResposta(''); }} className="flex-1 py-2 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">Resolver</button>
            <button className="flex-1 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Responder</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Visão 360° ──────────────────────────────────────────────────────────

function ChurnBadge({ r }: { r: ClienteVisao['churnRisk'] }) {
  const map: Record<ClienteVisao['churnRisk'], string> = {
    Baixo: 'bg-green-100 text-green-700',
    Médio: 'bg-amber-100 text-amber-700',
    Alto: 'bg-red-100 text-red-700',
  }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[r]}`}>Risco {r}</span>
}

function Tab360() {
  const [busca, setBusca] = useState('');
  const [selecionado, setSelecionado] = useState<ClienteVisao | null>(null);

  const filtrados = MOCK_CLIENTES_VISAO.filter(c => c.empresa.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar empresa..." className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        {filtrados.map(c => (
          <button key={c.id} onClick={() => setSelecionado(selecionado?.id === c.id ? null : c)} className={`text-left p-4 rounded-xl border-2 transition-all ${selecionado?.id === c.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
            <p className="font-semibold text-gray-900 text-sm">{c.empresa}</p>
            <p className="text-xs text-gray-500 mt-0.5">{c.plano} · {c.agentes} agentes</p>
          </button>
        ))}
      </div>

      {selecionado && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900">{selecionado.empresa}</h3>
              <p className="text-xs text-gray-500 mt-0.5">Cliente desde {selecionado.inicio}</p>
            </div>
            <ChurnBadge r={selecionado.churnRisk} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Plano', value: selecionado.plano },
              { label: 'Agentes', value: selecionado.agentes },
              { label: 'Ligações totais', value: selecionado.ligacoesTotais.toLocaleString('pt-BR') },
              { label: 'MRR', value: `R$ ${selecionado.mrr.toLocaleString('pt-BR')}` },
              { label: 'NPS', value: selecionado.nps },
              { label: 'Tx conversão', value: `${selecionado.taxaConversao}%` },
            ].map(m => (
              <div key={m.label} className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">{m.label}</p>
                <p className="text-lg font-bold font-mono text-gray-900">{m.value}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Timeline</p>
            <div className="space-y-2">
              {selecionado.timeline.map((ev, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">{ev.data}</p>
                    <p className="text-sm text-gray-700">{ev.evento}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Inbox ───────────────────────────────────────────────────────────────

function TabInbox() {
  const [selecionado, setSelecionado] = useState<InboxEmail | null>(null);

  return (
    <div className="flex gap-4" style={{ minHeight: '480px' }}>
      <div className="w-72 bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col shrink-0">
        <div className="px-4 py-3 border-b border-gray-100">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Caixa de entrada</span>
        </div>
        <div className="flex-1 divide-y divide-gray-100 overflow-y-auto">
          {MOCK_INBOX.map(email => (
            <button key={email.id} onClick={() => setSelecionado(email)} className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${selecionado?.id === email.id ? 'bg-blue-50 border-l-2 border-blue-500' : ''}`}>
              <div className="flex items-center justify-between mb-0.5">
                <span className={`text-sm font-medium ${email.lido ? 'text-gray-600' : 'text-gray-900'}`}>{email.empresa}</span>
                {!email.lido && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
              </div>
              <p className="text-xs font-medium text-gray-700 truncate">{email.assunto}</p>
              <p className="text-xs text-gray-400 truncate">{email.preview}</p>
              <p className="text-xs text-gray-300 mt-0.5">{email.data}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-white border border-gray-200 rounded-xl flex flex-col">
        {!selecionado ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Selecione um e-mail</div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="font-semibold text-gray-900">{selecionado.assunto}</p>
              <p className="text-xs text-gray-500 mt-0.5">{selecionado.empresa} · {selecionado.data}</p>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {selecionado.thread.map((m, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">{m.de} · {m.data}</p>
                  <p className="text-sm text-gray-700">{m.texto}</p>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-100 flex gap-2">
              <input type="text" placeholder="Responder..." className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">Enviar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Enviados ────────────────────────────────────────────────────────────

function EnviadoStatusBadge({ s }: { s: EmailEnviado['status'] }) {
  const map: Record<EmailEnviado['status'], string> = {
    Entregue: 'bg-blue-100 text-blue-700',
    Lido: 'bg-green-100 text-green-700',
    'Sem resposta': 'bg-gray-100 text-gray-600',
  }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[s]}`}>{s}</span>
}

function TabEnviados() {
  const enviados = MOCK_ENVIADOS.length;
  const lidos = MOCK_ENVIADOS.filter(e => e.status === 'Lido').length;
  const taxaResposta = Math.round((lidos / enviados) * 100);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <KpiCard label="Enviados hoje" value="12" />
        <KpiCard label="Taxa de resposta" value={`${taxaResposta}%`} />
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-xs text-gray-500 font-medium uppercase tracking-wide">
              {['Destinatário', 'Empresa', 'Assunto', 'Data', 'Status'].map(h => (
                <th key={h} className="text-left px-4 py-2.5">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {MOCK_ENVIADOS.map(e => (
              <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-700">{e.destinatario}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{e.empresa}</td>
                <td className="px-4 py-3 text-gray-600">{e.assunto}</td>
                <td className="px-4 py-3 text-gray-500">{e.data}</td>
                <td className="px-4 py-3"><EnviadoStatusBadge s={e.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tab: Histórico ───────────────────────────────────────────────────────────

function TipoBadge({ tipo }: { tipo: Interacao['tipo'] }) {
  const map: Record<Interacao['tipo'], string> = {
    Ligação: 'bg-blue-100 text-blue-700',
    'E-mail': 'bg-purple-100 text-purple-700',
    Ticket: 'bg-red-100 text-red-700',
    Chat: 'bg-green-100 text-green-700',
  }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[tipo]}`}>{tipo}</span>
}

function TabHistorico() {
  const [filtroEmpresa, setFiltroEmpresa] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('Todos');

  const empresas = [...new Set(MOCK_HISTORICO.map(h => h.empresa))];
  const filtrados = MOCK_HISTORICO.filter(h => {
    const okE = !filtroEmpresa || h.empresa === filtroEmpresa;
    const okT = filtroTipo === 'Todos' || h.tipo === filtroTipo;
    return okE && okT;
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3">
        <select value={filtroEmpresa} onChange={e => setFiltroEmpresa(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Todas as empresas</option>
          {empresas.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          {['Todos', 'Ligação', 'E-mail', 'Ticket', 'Chat'].map(t => <option key={t}>{t}</option>)}
        </select>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-xs text-gray-500 font-medium uppercase tracking-wide">
              {['Empresa', 'Tipo', 'Data', 'Descrição', 'Resultado'].map(h => (
                <th key={h} className="text-left px-4 py-2.5">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtrados.map(h => (
              <tr key={h.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">{h.empresa}</td>
                <td className="px-4 py-3"><TipoBadge tipo={h.tipo} /></td>
                <td className="px-4 py-3 text-gray-500">{h.data}</td>
                <td className="px-4 py-3 text-gray-600">{h.preview}</td>
                <td className="px-4 py-3 text-gray-500">{h.resultado}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tab config ───────────────────────────────────────────────────────────────

interface TabConfig {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabConfig[] = [
  { id: 'discagem', label: 'Discagem Manual', icon: <Phone size={15} /> },
  { id: 'ligacoes', label: 'Ligações', icon: <PhoneCall size={15} /> },
  { id: 'email', label: 'E-mail', icon: <Mail size={15} /> },
  { id: 'msgs', label: 'Msgs Internas', icon: <MessageCircle size={15} /> },
  { id: 'modelos', label: 'Modelos', icon: <FileText size={15} /> },
  { id: 'marketing', label: 'Marketing', icon: <Megaphone size={15} /> },
  { id: 'suporte', label: 'Tickets', icon: <FileText size={15} /> },
  { id: '360', label: 'Visão 360°', icon: <Eye size={15} /> },
  { id: 'inbox', label: 'Inbox', icon: <Mail size={15} /> },
  { id: 'enviados', label: 'Enviados', icon: <Send size={15} /> },
  { id: 'historico', label: 'Histórico', icon: <Clock size={15} /> },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminSuportePage() {
  const [activeTab, setActiveTab] = useState<TabId>('discagem');

  return (
    <div className="animate-fade-in flex flex-col gap-6 p-6 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 text-white">
          <Headphones size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Suporte Ativo</h1>
          <p className="text-sm text-gray-500">Central de atendimento e campanhas</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1">
        {activeTab === 'discagem' && <TabDiscagem />}
        {activeTab === 'ligacoes' && <TabLigacoes />}
        {activeTab === 'email' && <TabEmail />}
        {activeTab === 'msgs' && <TabMsgs />}
        {activeTab === 'modelos' && <TabModelos />}
        {activeTab === 'marketing' && <TabMarketing />}
        {activeTab === 'suporte' && <TabSuporte />}
        {activeTab === '360' && <Tab360 />}
        {activeTab === 'inbox' && <TabInbox />}
        {activeTab === 'enviados' && <TabEnviados />}
        {activeTab === 'historico' && <TabHistorico />}
      </div>
    </div>
  );
}
