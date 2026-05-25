import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import LoginPage      from '@/pages/auth/LoginPage'
import CadastroPage   from '@/pages/auth/CadastroPage'
import ContratoPage   from '@/pages/auth/ContratoPage'
import AguardandoPage from '@/pages/auth/AguardandoPage'
import BoasVindasPage from '@/pages/auth/BoasVindasPage'
import CheckoutPage   from '@/pages/checkout/CheckoutPage'
import AppLayout      from '@/components/layout/AppLayout'
import ProtectedRoute from '@/components/layout/ProtectedRoute'
import RouteGuard     from '@/components/RouteGuard'
import DashboardPage  from '@/pages/dashboard/DashboardPage'
import CampanhasPage  from '@/pages/campanhas/CampanhasPage'
import DiscadoraPage  from '@/pages/discadora/DiscadoraPage'
import RelatoriosPage  from '@/pages/relatorios/RelatoriosPage'
import InteligenciaPage from '@/pages/inteligencia/InteligenciaPage'
import EmailPage from '@/pages/email/EmailPage'
import VendedorPage from '@/pages/vendedor/VendedorPage'
import ConfigPage from '@/pages/config/ConfigPage'
import EquipePage from '@/pages/equipe/EquipePage'
import AdminClientesPage from '@/pages/admin/AdminClientesPage'
import AdminSuportePage from '@/pages/admin/AdminSuportePage'
import PlanosPage from '@/pages/planos/PlanosPage'
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage'
import AdminConfigPage from '@/pages/admin/AdminConfigPage'
import AdminPlataformaPage from '@/pages/admin/AdminPlataformaPage'
import OnboardingPage from '@/pages/onboarding/OnboardingPage'
import PipelinePage from '@/pages/pipeline/PipelinePage'
import ReceptivoPage from '@/pages/receptivo/ReceptivoPage'
import VendedorPageRestrita from '@/pages/vendedor/VendedorPageRestrita'
import AdminCustosPage from '@/pages/admin/AdminCustosPage'
import AdminDevPage from '@/pages/admin/AdminDevPage'
import AdminTelnyxPage from '@/pages/admin/AdminTelnyxPage'
import DocumentosPage from '@/pages/documentos/DocumentosPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
})


export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Rotas públicas — sem autenticação */}
          <Route path="/login"       element={<LoginPage />} />
          <Route path="/cadastro"   element={<CadastroPage />} />
          <Route path="/checkout"   element={<CheckoutPage />} />
          <Route path="/documentos" element={<DocumentosPage />} />
          <Route path="/contrato"   element={<ContratoPage />} />
          <Route path="/aguardando" element={<AguardandoPage />} />
          <Route path="/boas-vindas" element={<BoasVindasPage />} />

          {/* App — requer autenticação (qualquer status) */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />

            {/* ── Acessíveis sem ativação ─────────────────────────────────── */}
            <Route path="dashboard"    element={<DashboardPage />} />
            <Route path="vendedor"     element={<VendedorPage />} />
            <Route path="planos"       element={<PlanosPage />} />
            <Route path="config"       element={<ConfigPage />} />

            {/* ── Bloqueados enquanto status ≠ 'ativo' ─────────────────────── */}
            <Route path="campanhas"    element={
              <RouteGuard nomeModulo="Campanhas">
                <CampanhasPage />
              </RouteGuard>
            } />
            <Route path="discadora"    element={
              <RouteGuard nomeModulo="Discadora">
                <DiscadoraPage />
              </RouteGuard>
            } />
            <Route path="relatorios"   element={
              <RouteGuard nomeModulo="Relatórios">
                <RelatoriosPage />
              </RouteGuard>
            } />
            <Route path="inteligencia" element={
              <RouteGuard nomeModulo="Centro de Inteligência">
                <InteligenciaPage />
              </RouteGuard>
            } />
            <Route path="email"        element={
              <RouteGuard nomeModulo="E-mail & WhatsApp">
                <EmailPage />
              </RouteGuard>
            } />
            <Route path="equipe"       element={
              <RouteGuard nomeModulo="Equipe">
                <EquipePage />
              </RouteGuard>
            } />
            <Route path="pipeline"     element={
              <RouteGuard nomeModulo="Pipeline">
                <PipelinePage />
              </RouteGuard>
            } />
            <Route path="receptivo"    element={
              <RouteGuard nomeModulo="Receptivo">
                <ReceptivoPage />
              </RouteGuard>
            } />
            <Route path="onboarding"   element={
              <RouteGuard nomeModulo="Setup do Agente">
                <OnboardingPage />
              </RouteGuard>
            } />

            {/* ── Admin — plataforma (não envolve RouteGuard de status) ────── */}
            <Route path="admin/clientes"   element={<AdminClientesPage />} />
            <Route path="admin/suporte"    element={<AdminSuportePage />} />
            <Route path="admin/dashboard"  element={<AdminDashboardPage />} />
            <Route path="admin/config"     element={<AdminConfigPage />} />
            <Route path="admin/plataforma" element={<AdminPlataformaPage />} />
            <Route path="admin/custos"     element={<AdminCustosPage />} />
            <Route path="admin/dev"        element={<AdminDevPage />} />
            <Route path="admin/telnyx"     element={<AdminTelnyxPage />} />

            <Route path="vendedor-restrito" element={<VendedorPageRestrita />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
