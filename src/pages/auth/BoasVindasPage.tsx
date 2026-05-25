import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'

export default function BoasVindasPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg animate-fade-in">
        <div className="card p-8 flex flex-col items-center text-center gap-5">

          {/* Checkmark */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <Check className="w-10 h-10 text-green-600" strokeWidth={3} />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900">Conta ativada!</h2>
            <p className="text-base text-gray-500 mt-1">Bem-vindo ao ETZ! 🎉</p>
            <p className="text-xs text-gray-400 mt-2">
              Empresa Demo · Plano Growth ativo · Trial gratuito até 23/06/2026
            </p>
          </div>

          {/* Próximos passos */}
          <div className="w-full bg-gray-50 rounded-xl p-5 text-left flex flex-col gap-4">
            <p className="text-sm font-semibold text-gray-900">Próximos passos</p>

            {[
              {
                num: 1,
                label: 'Configure o perfil da sua empresa em Configurações',
                btnLabel: 'Ir para Config →',
                route: '/config',
              },
              {
                num: 2,
                label: 'Crie seu primeiro agente em Setup do Agente',
                btnLabel: 'Setup do Agente →',
                route: '/onboarding',
              },
              {
                num: 3,
                label: 'Importe sua lista de leads e inicie sua primeira campanha',
                btnLabel: 'Ir para Discadora →',
                route: '/discadora',
              },
            ].map((step) => (
              <div key={step.num} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {step.num}
                </div>
                <p className="text-sm text-gray-700 flex-1">{step.label}</p>
                <button
                  onClick={() => navigate(step.route)}
                  className="btn-secondary text-xs py-1.5 px-3 flex-shrink-0"
                >
                  {step.btnLabel}
                </button>
              </div>
            ))}
          </div>

          {/* Rodapé */}
          <p className="text-xs text-gray-400">
            Credenciais de acesso admin enviadas para admin@empresa.com
          </p>

          <button
            onClick={() => navigate('/dashboard')}
            className="btn-primary w-full py-3 text-base font-semibold"
          >
            🚀 Ir para o Dashboard →
          </button>

        </div>
      </div>
    </div>
  )
}
