import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import AdminSidebar from '../components/AdminSidebar'
import AdminTopbar from '../components/AdminTopbar'
import { useAdmin } from '../context/AdminContext'
import { useMarketplace } from '../../context/MarketplaceContext'
import { classNames } from '../utils/formatters'

export default function AdminLayout() {
  const { currentUser, darkMode, toggleDarkMode, logout } = useMarketplace()
  const { summary, refreshDashboard } = useAdmin()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [globalSearch, setGlobalSearch] = useState('')

  useEffect(() => {
    if (!sidebarOpen) {
      return undefined
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setSidebarOpen(false)
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [sidebarOpen])

  const notificationsCount =
    Number(summary?.pending_annonces ?? 0) + Number(summary?.reports_count ?? 0)

  async function handleAdminLogout() {
    await logout()
    window.location.replace(`${window.location.origin}${window.location.pathname}`)
  }

  return (
    <div
      className={classNames(
        'admin-app-shell min-h-screen',
        darkMode ? 'dark bg-slate-950 text-slate-100' : 'text-slate-900',
      )}
    >
      <div className="flex min-h-screen">
        {sidebarOpen ? (
          <button
            type="button"
            aria-label="Fermer la sidebar"
            className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm xl:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        ) : null}

        <div
          className={classNames(
            'fixed inset-y-0 left-0 z-50 transition-transform duration-300 xl:static xl:translate-x-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <AdminSidebar
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed((value) => !value)}
            onCloseMobile={() => setSidebarOpen(false)}
            summary={summary}
            onLogout={handleAdminLogout}
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <AdminTopbar
            currentUser={currentUser}
            globalSearch={globalSearch}
            setGlobalSearch={setGlobalSearch}
            notificationsCount={notificationsCount}
            darkMode={darkMode}
            toggleDarkMode={toggleDarkMode}
            onOpenSidebar={() => setSidebarOpen(true)}
            onRefresh={refreshDashboard}
            onLogout={handleAdminLogout}
          />

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-[1400px]">
              <Outlet
                context={{
                  globalSearch,
                  setGlobalSearch,
                  refreshDashboard,
                  darkMode,
                }}
              />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
