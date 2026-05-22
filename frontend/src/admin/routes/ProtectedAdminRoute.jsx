import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useMarketplace } from '../../context/MarketplaceContext'

export default function ProtectedAdminRoute() {
  const location = useLocation()
  const { currentUser } = useMarketplace()

  if (!currentUser) {
    return <Navigate to="/" replace />
  }

  if (currentUser.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
