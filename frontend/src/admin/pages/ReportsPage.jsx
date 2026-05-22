import { useDeferredValue, useEffect, useEffectEvent, useState } from 'react'
import { Ban, Eye, RefreshCw, ShieldAlert, Trash2 } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import toast from 'react-hot-toast'
import AnnonceDetailsDrawer from '../components/AnnonceDetailsDrawer'
import EmptyState from '../components/EmptyState'
import LoadingSpinner from '../components/LoadingSpinner'
import PageHeader from '../components/PageHeader'
import Pagination from '../components/Pagination'
import StatCard from '../components/StatCard'
import StatusBadge from '../components/StatusBadge'
import { useAdmin } from '../context/AdminContext'
import {
  blockUser,
  deleteAnnonce,
  fetchReports,
  ignoreReport,
} from '../services/adminApi'
import { getApiErrorMessage } from '../services/axiosClient'
import { useMarketplace } from '../../context/MarketplaceContext'
import {
  formatAdminDateTime,
  truncateText,
} from '../utils/formatters'

const pageSize = 6

export default function ReportsPage() {
  const { token } = useMarketplace()
  const { refreshDashboard } = useAdmin()
  const { globalSearch } = useOutletContext()
  const deferredSearch = useDeferredValue(globalSearch)

  const [reports, setReports] = useState([])
  const [totals, setTotals] = useState({
    all: 0,
    open: 0,
    ignored: 0,
    resolved: 0,
  })
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [actionId, setActionId] = useState('')
  const [selectedAnnonce, setSelectedAnnonce] = useState(null)

  const loadReports = useEffectEvent(async ({ showLoader = true } = {}) => {
    if (!token) {
      return
    }

    if (showLoader) {
      setLoading(true)
    }

    setError('')

    try {
      const response = await fetchReports(token, {
        search: deferredSearch,
        status: selectedStatus,
      })

      setReports(response.data ?? [])
      setTotals(response.meta?.totals ?? totals)
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Impossible de charger les signalements.'))
    } finally {
      setLoading(false)
    }
  })

  useEffect(() => {
    loadReports({ showLoader: reports.length === 0 })
  }, [token, deferredSearch, selectedStatus])

  async function handleIgnore(reportId) {
    setActionId(`ignore-${reportId}`)

    try {
      await ignoreReport(token, reportId)
      toast.success('Signalement ignore.')
      await Promise.all([loadReports(), refreshDashboard()])
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError, 'Action impossible.'))
    } finally {
      setActionId('')
    }
  }

  async function handleDeleteAnnonce(annonceId) {
    if (!annonceId) {
      return
    }

    if (!window.confirm('Supprimer cette annonce signalee ?')) {
      return
    }

    setActionId(`delete-annonce-${annonceId}`)

    try {
      await deleteAnnonce(token, annonceId)
      toast.success('Annonce supprimee.')
      await Promise.all([loadReports(), refreshDashboard()])
      setSelectedAnnonce(null)
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError, 'Suppression impossible.'))
    } finally {
      setActionId('')
    }
  }

  async function handleBlockUser(userId) {
    if (!userId) {
      return
    }

    setActionId(`block-user-${userId}`)

    try {
      await blockUser(token, userId)
      toast.success('Utilisateur bloque.')
      await Promise.all([loadReports(), refreshDashboard()])
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError, 'Blocage impossible.'))
    } finally {
      setActionId('')
    }
  }

  const totalPages = Math.max(1, Math.ceil(reports.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paginatedReports = reports.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Analysez les signalements, ouvrez l annonce concernee, ignorez le report ou bloquez l utilisateur fautif."
        action={
          <button
            type="button"
            onClick={loadReports}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-950"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        }
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Tous les reports" value={totals.all} hint="Historique complet" icon={ShieldAlert} tone="navy" />
        <StatCard label="Ouverts" value={totals.open} hint="A traiter vite" icon={ShieldAlert} tone="rose" />
        <StatCard label="Ignores" value={totals.ignored} hint="Reports clos sans action" icon={Eye} tone="blue" />
        <StatCard label="Resolus" value={totals.resolved} hint="Incidents traites" icon={Ban} tone="emerald" />
      </div>

      <section className="rounded-[2rem] border border-white/70 bg-white/80 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-4 border-b border-slate-200/70 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Filtre reports</p>
            <p className="mt-1 text-sm text-slate-500">
              Recherchez par raison, annonce, ville ou utilisateur depuis la barre du haut.
            </p>
          </div>

          <select
            value={selectedStatus}
            onChange={(event) => setSelectedStatus(event.target.value)}
            className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          >
            <option value="all">Tous les statuts</option>
            <option value="open">Ouverts</option>
            <option value="ignored">Ignores</option>
            <option value="resolved">Resolus</option>
          </select>
        </div>

        {loading ? (
          <LoadingSpinner label="Chargement des reports..." className="m-6" />
        ) : error ? (
          <div className="m-6 rounded-[2rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {error}
          </div>
        ) : reports.length === 0 ? (
          <EmptyState
            title="Aucun signalement"
            description="La moderation est calme pour le moment."
            className="m-6"
          />
        ) : (
          <>
            <div className="grid gap-4 p-4 sm:p-6">
              {paginatedReports.map((report) => (
                <article
                  key={report.id}
                  className="rounded-[1.8rem] border border-slate-200/70 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <StatusBadge kind="report" status={report.status} />
                        <h3 className="text-lg font-semibold text-slate-950">{report.reason}</h3>
                      </div>

                      <p className="text-sm leading-7 text-slate-600">
                        {truncateText(
                          report.message ||
                            report.annonce?.description ||
                            report.annonce?.title ||
                            'Aucun detail fourni.',
                          220,
                        )}
                      </p>

                      <div className="grid gap-2 text-sm text-slate-500 sm:grid-cols-2">
                        <p>Reporteur: {report.reporter?.name ?? 'Utilisateur anonyme'}</p>
                        <p>Annonceur: {report.reported_user?.name ?? 'Inconnu'}</p>
                        <p>Annonce: {report.annonce?.title ?? 'Annonce supprimee'}</p>
                        <p>Date: {formatAdminDateTime(report.created_at)}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:max-w-xs lg:justify-end">
                      <ActionButton
                        title="Voir details"
                        tone="slate"
                        icon={Eye}
                        disabled={!report.annonce}
                        onClick={() => setSelectedAnnonce(report.annonce)}
                      />
                      <ActionButton
                        title="Ignorer"
                        tone="blue"
                        icon={ShieldAlert}
                        loading={actionId === `ignore-${report.id}`}
                        disabled={report.status !== 'open'}
                        onClick={() => handleIgnore(report.id)}
                      />
                      <ActionButton
                        title="Delete annonce"
                        tone="dark"
                        icon={Trash2}
                        disabled={!report.annonce}
                        loading={actionId === `delete-annonce-${report.annonce?.id}`}
                        onClick={() => handleDeleteAnnonce(report.annonce?.id)}
                      />
                      <ActionButton
                        title="Block user"
                        tone="rose"
                        icon={Ban}
                        disabled={!report.reported_user || report.reported_user.status === 'bloque'}
                        loading={actionId === `block-user-${report.reported_user?.id}`}
                        onClick={() => handleBlockUser(report.reported_user?.id)}
                      />
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <Pagination
              currentPage={currentPage}
              totalItems={reports.length}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          </>
        )}
      </section>

      <AnnonceDetailsDrawer annonce={selectedAnnonce} onClose={() => setSelectedAnnonce(null)} />
    </div>
  )
}

function ActionButton({ title, tone, icon: Icon, loading = false, disabled = false, onClick }) {
  const tones = {
    blue: 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100',
    rose: 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100',
    slate: 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100',
    dark: 'border-slate-950 bg-slate-950 text-white hover:bg-slate-800',
  }

  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-45 ${tones[tone]}`}
    >
      <Icon className="h-4 w-4" />
      {loading ? '...' : title}
    </button>
  )
}
