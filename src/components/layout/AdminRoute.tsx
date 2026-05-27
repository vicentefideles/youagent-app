import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  if (user?.role !== 'platform_admin') {
    return <Navigate to="/dashboard" replace />
  }
  return <>{children}</>
}
