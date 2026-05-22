import { startTransition } from 'react'
import {
  Bell,
  LogOut,
  Menu,
  MoonStar,
  RefreshCw,
  Search,
  SunMedium,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { getInitials } from '../utils/formatters'

export default function AdminTopbar({
  currentUser,
  globalSearch,
  setGlobalSearch,
  notificationsCount,
  darkMode,
  toggleDarkMode,
  onOpenSidebar,
  onRefresh,
  onLogout,
}) {
  return (
    <header className="admin-glass-topbar sticky top-0 z-30 px-4 py-4 sm:px-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-950 xl:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="relative w-full xl:w-[30rem]">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={globalSearch}
              onChange={(event) => {
                const value = event.target.value
                startTransition(() => {
                  setGlobalSearch(value)
                })
              }}
              placeholder="Rechercher une annonce, un utilisateur, une ville..."
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-950"
          >
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </button>

          <button
            type="button"
            onClick={toggleDarkMode}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-950"
          >
            {darkMode ? <SunMedium className="h-5 w-5" /> : <MoonStar className="h-5 w-5" />}
          </button>

          <button
            type="button"
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-950"
          >
            <Bell className="h-5 w-5" />
            {notificationsCount > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-semibold text-white">
                {notificationsCount}
              </span>
            ) : null}
          </button>

          <div className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm sm:flex">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white">
              {getInitials(currentUser?.name)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{currentUser?.name}</p>
              <p className="truncate text-xs text-slate-500">{currentUser?.email}</p>
            </div>
          </div>

          <Link
            to="/"
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-950"
          >
            Voir le site
          </Link>

          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-slate-950/20 transition hover:bg-slate-800"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}
