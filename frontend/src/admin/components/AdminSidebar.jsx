import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Clock3,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Users,
  XCircle,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { classNames } from '../utils/formatters'

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/pending-annonces', label: 'Pending annonces', icon: Clock3, badgeKey: 'pending_annonces' },
  { to: '/admin/accepted-annonces', label: 'Accepted annonces', icon: ShieldCheck, badgeKey: 'accepted_annonces' },
  { to: '/admin/refused-annonces', label: 'Refused annonces', icon: XCircle, badgeKey: 'refused_annonces' },
  { to: '/admin/users', label: 'Users', icon: Users, badgeKey: 'total_users' },
  { to: '/admin/reports', label: 'Reports', icon: ShieldAlert, badgeKey: 'reports_count' },
  { to: '/admin/statistics', label: 'Statistics', icon: BarChart3 },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function AdminSidebar({
  collapsed,
  onToggleCollapse,
  onCloseMobile,
  summary,
  onLogout,
}) {
  return (
    <aside
      className={classNames(
        'admin-sidebar-panel admin-scrollbar flex h-full flex-col overflow-y-auto px-4 py-5 text-white transition-all duration-300',
        collapsed ? 'w-24' : 'w-[18.5rem]',
      )}
    >
      <div className="flex items-center justify-between gap-3 px-2">
        <div className={classNames('overflow-hidden transition-all', collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100')}>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-blue-200/70">DariHub</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Admin Hub</h2>
        </div>

        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white transition hover:bg-white/15 xl:inline-flex"
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>

      <div className="mt-8 space-y-2">
        {navItems.map(({ to, label, icon: Icon, badgeKey }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/admin'}
            onClick={onCloseMobile}
            title={label}
            className={({ isActive }) =>
              classNames(
                'group flex items-center gap-3 rounded-[1.4rem] px-4 py-3 text-sm font-medium transition',
                isActive
                  ? 'bg-white text-slate-950 shadow-lg shadow-slate-950/15'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white',
              )
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className={classNames('truncate transition-all', collapsed ? 'hidden' : 'block')}>
              {label}
            </span>
            {!collapsed && badgeKey && Number(summary?.[badgeKey] ?? 0) > 0 ? (
              <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-900">
                {summary[badgeKey]}
              </span>
            ) : null}
          </NavLink>
        ))}
      </div>

      <div className="mt-auto space-y-4">
        <div className={classNames('rounded-[1.8rem] border border-white/10 bg-white/8 p-4', collapsed && 'px-2')}>
          <p className={classNames('text-xs uppercase tracking-[0.28em] text-slate-400', collapsed && 'hidden')}>
            Moderation live
          </p>
          <div className="mt-3 grid gap-3">
            <div className="rounded-2xl bg-white/10 px-3 py-2">
              <p className="text-xs text-slate-300">Annonces en attente</p>
              <p className="mt-1 text-lg font-semibold">{summary?.pending_annonces ?? 0}</p>
            </div>
            {!collapsed ? (
              <div className="rounded-2xl bg-white/5 px-3 py-2">
                <p className="text-xs text-slate-300">Signalements ouverts</p>
                <p className="mt-1 text-lg font-semibold">{summary?.reports_count ?? 0}</p>
              </div>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-3 rounded-[1.4rem] border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/15"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span className={classNames(collapsed && 'hidden')}>Logout</span>
        </button>
      </div>
    </aside>
  )
}
