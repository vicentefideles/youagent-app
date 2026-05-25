import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { JWT_KEY } from '@/constants/auth'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  // localStorage é síncrono — não há race condition.
  // Se o JWT existe no storage, o usuário está autenticado mesmo antes
  // do Zustand terminar de hidratar o estado.
  const hasToken = !!localStorage.getItem(JWT_KEY)

  if (!isAuthenticated && !hasToken) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
