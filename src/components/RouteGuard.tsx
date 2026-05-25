import ModuloBloqueado from './ModuloBloqueado'
import { useAuthStore } from '@/store/authStore'

interface RouteGuardProps {
  children: React.ReactNode
  nomeModulo?: string
  requireAtivo?: boolean
}

export default function RouteGuard({
  children,
  nomeModulo,
  requireAtivo = true,
}: RouteGuardProps) {
  const isAtivo = useAuthStore((state) => state.isAtivo())

  if (requireAtivo && !isAtivo) {
    return <ModuloBloqueado nomeModulo={nomeModulo} />
  }

  return <>{children}</>
}
