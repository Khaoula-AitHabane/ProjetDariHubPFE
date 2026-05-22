import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminProvider } from '../context/AdminContext'
import AdminLayout from '../layouts/AdminLayout'
import AnnoncesPage from '../pages/AnnoncesPage'
import DashboardHomePage from '../pages/DashboardHomePage'
import ReportsPage from '../pages/ReportsPage'
import SettingsPage from '../pages/SettingsPage'
import StatisticsPage from '../pages/StatisticsPage'
import UsersPage from '../pages/UsersPage'
import ProtectedAdminRoute from './ProtectedAdminRoute'

export default function AdminRoutes() {
  return (
    <Routes>
      <Route element={<ProtectedAdminRoute />}>
        <Route
          element={
            <AdminProvider>
              <AdminLayout />
            </AdminProvider>
          }
        >
          <Route index element={<DashboardHomePage />} />
          <Route
            path="pending-annonces"
            element={
              <AnnoncesPage
                title="Pending annonces"
                description="Validez, refusez ou supprimez les annonces en attente de moderation."
                statusFilter="en_attente"
              />
            }
          />
          <Route
            path="accepted-annonces"
            element={
              <AnnoncesPage
                title="Accepted annonces"
                description="Suivez les annonces deja validees et ajustez la moderation si besoin."
                statusFilter="validee"
              />
            }
          />
          <Route
            path="refused-annonces"
            element={
              <AnnoncesPage
                title="Refused annonces"
                description="Gardez un oeil sur les annonces refusees et revalidez si necessaire."
                statusFilter="refusee"
              />
            }
          />
          <Route path="users" element={<UsersPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="statistics" element={<StatisticsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}
