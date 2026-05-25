import { Clock, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface BannerPendenteProps {
  status: string
}

const mensagens: Record<string, { texto: string; cor: string }> = {
  cadastrado: {
    texto: 'Complete seu cadastro para ativar sua conta.',
    cor: 'bg-blue-50 border-blue-200 text-blue-800',
  },
  documentos_enviados: {
    texto: 'Documentos recebidos. Gerando seu contrato...',
    cor: 'bg-blue-50 border-blue-200 text-blue-800',
  },
  contrato_gerado: {
    texto: 'Seu contrato está pronto para assinatura.',
    cor: 'bg-blue-50 border-blue-200 text-blue-800',
  },
  aguardando_ativacao: {
    texto: 'Contrato assinado! Sua conta está em análise — ativação em até 1 dia útil.',
    cor: 'bg-amber-50 border-amber-200 text-amber-800',
  },
  documentos_rejeitados: {
    texto: 'Seus documentos precisam de correção.',
    cor: 'bg-red-50 border-red-200 text-red-800',
  },
}

export default function BannerPendente({ status }: BannerPendenteProps) {
  const navigate = useNavigate()
  const msg = mensagens[status]
  if (!msg) return null

  return (
    <div className={`flex items-center justify-between px-4 py-2 border-b text-sm font-medium ${msg.cor}`}>
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 flex-shrink-0" />
        <span>{msg.texto}</span>
      </div>
      <button
        onClick={() => navigate('/aguardando')}
        className="flex items-center gap-1 text-xs underline underline-offset-2 opacity-80 hover:opacity-100 ml-4 whitespace-nowrap"
      >
        Ver status <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  )
}
