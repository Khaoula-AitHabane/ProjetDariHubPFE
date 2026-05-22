import { createContext, useContext, useEffect, useEffectEvent, useState } from 'react'
import { useMarketplace } from '../../context/MarketplaceContext'
import { fetchAdminDashboard } from '../services/adminApi'
import { getApiErrorMessage } from '../services/axiosClient'

const AdminContext = createContext(null)

const defaultSummary = {
  total_users: 0,
  total_annonces: 0,
  pending_annonces: 0,
  accepted_annonces: 0,
  refused_annonces: 0,
  reports_count: 0,
}

export function AdminProvider({ children }) {
  const { token } = useMarketplace()
  const [dashboard, setDashboard] = useState({
    summary: defaultSummary,
    recent_pending: [],
    recent_reports: [],
  })
  const [loadingSummary, setLoadingSummary] = useState(true)
  const [summaryError, setSummaryError] = useState('')

  const refreshDashboard = useEffectEvent(async () => {
    if (!token) {
      return
    }

    setLoadingSummary(true)
    setSummaryError('')

    try {
      const data = await fetchAdminDashboard(token)
      setDashboard({
        summary: data.summary ?? defaultSummary,
        recent_pending: data.recent_pending ?? [],
        recent_reports: data.recent_reports ?? [],
      })
    } catch (error) {
      setSummaryError(
        getApiErrorMessage(error, 'Impossible de charger les donnees du dashboard.'),
      )
    } finally {
      setLoadingSummary(false)
    }
  })

  useEffect(() => {
    refreshDashboard()
  }, [token])

  const value = {
    dashboard,
    summary: dashboard.summary,
    recentPending: dashboard.recent_pending,
    recentReports: dashboard.recent_reports,
    loadingSummary,
    summaryError,
    refreshDashboard,
  }

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

export function useAdmin() {
  const context = useContext(AdminContext)

  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider')
  }

  return context
}
