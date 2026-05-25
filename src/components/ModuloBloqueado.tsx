import { Lock, Clock, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface ModuloBloqueadoProps {
  nomeModulo?: string
}

export default function ModuloBloqueado({ nomeModulo = 'este módulo' }: ModuloBloqueadoProps) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-6">
        <Lock className="w-8 h-8 text-amber-500" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        {nomeModulo} ainda não está disponível
      </h2>
      <p className="text-gray-500 text-sm max-w-sm mb-6">
        Sua conta está em análise pela equipe ETZ. Assim que for aprovada, você terá acesso completo a todos os módulos.
      </p>
      <div className="flex items-center gap-2 text-sm text-amber-600 font-medium bg-amber-50 px-4 py-2 rounded-full mb-6">
        <Clock className="w-4 h-4" />
        Prazo estimado: 1 dia útil
      </div>
      <button
        onClick={() => navigate('/aguardando')}
        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
      >
        Ver status da conta
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )
}
