import { useDeferredValue, useEffect, useEffectEvent, useState } from 'react'
import { Ban, RefreshCw, Trash2, UserRoundCheck, Users } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import toast from 'react-hot-toast'
import EmptyState from '../components/EmptyState'
import LoadingSpinner from '../components/LoadingSpinner'
import PageHeader from '../components/PageHeader'
import Pagination from '../components/Pagination'
import StatCard from '../components/StatCard'
import StatusBadge from '../components/StatusBadge'
import { useAdmin } from '../context/AdminContext'
import {
  blockUser,
  deleteUser,
  fetchUsers,
  unblockUser,
} from '../services/adminApi'
import { getApiErrorMessage } from '../services/axiosClient'
import { useMarketplace } from '../../context/MarketplaceContext'
import {
  formatAdminDate,
  formatRoleLabel,
  getInitials,
} from '../utils/formatters'

const pageSize = 8

export default function UsersPage() {
  const { token } = useMarketplace()
  const { refreshDashboard } = useAdmin()
  const { globalSearch } = useOutletContext()
  const deferredSearch = useDeferredValue(globalSearch)

  const [users, setUsers] = useState([])
  const [totals, setTotals] = useState({
    all: 0,
    active: 0,
    blocked: 0,
    admins: 0,
  })
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [actionId, setActionId] = useState('')

  const loadUsers = useEffectEvent(async ({ showLoader = true } = {}) => {
    if (!token) {
      return
    }

    if (showLoader) {
      setLoading(true)
    }

    setError('')

    try {
      const response = await fetchUsers(token, {
        search: deferredSearch,
        status: selectedStatus,
      })

      setUsers(response.data ?? [])
      setTotals(response.meta?.totals ?? totals)
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Impossible de charger les utilisateurs.'))
    } finally {
      setLoading(false)
    }
  })

  useEffect(() => {
    loadUsers({ showLoader: users.length === 0 })
  }, [token, deferredSearch, selectedStatus])

  async function handleToggleBlock(user) {
    setActionId(`toggle-${user.id}`)

    try {
      if (user.status === 'bloque') {
        await unblockUser(token, user.id)
        toast.success('Utilisateur debloque.')
      } else {
        await blockUser(token, user.id)
        toast.success('Utilisateur bloque.')
      }

      await Promise.all([loadUsers(), refreshDashboard()])
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError, 'Action impossible.'))
    } finally {
      setActionId('')
    }
  }

  async function handleDelete(user) {
    if (!window.confirm(`Supprimer le compte de ${user.name} ?`)) {
      return
    }

    setActionId(`delete-${user.id}`)

    try {
      await deleteUser(token, user.id)
      toast.success('Utilisateur supprime.')
      await Promise.all([loadUsers(), refreshDashboard()])
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError, 'Suppression impossible.'))
    } finally {
      setActionId('')
    }
  }

  const totalPages = Math.max(1, Math.ceil(users.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paginatedUsers = users.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users management"
        description="Recherchez, bloquez ou supprimez les comptes tout en surveillant l activite annonceur."
        action={
          <button
            type="button"
            onClick={loadUsers}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-950"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        }
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total users" value={totals.all} hint="Tous les comptes" icon={Users} tone="navy" />
        <StatCard label="Actifs" value={totals.active} hint="Acces disponible" icon={UserRoundCheck} tone="blue" />
        <StatCard label="Bloques" value={totals.blocked} hint="Connexion desactivee" icon={Ban} tone="rose" />
        <StatCard label="Admins" value={totals.admins} hint="Supervision plateforme" icon={UserRoundCheck} tone="emerald" />
      </div>

      <section className="rounded-[2rem] border border-white/70 bg-white/80 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-4 border-b border-slate-200/70 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Filtre utilisateurs</p>
            <p className="mt-1 text-sm text-slate-500">
              Recherche globale depuis la navbar et statut ci-dessous.
            </p>
          </div>

          <select
            value={selectedStatus}
            onChange={(event) => setSelectedStatus(event.target.value)}
            className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          >
            <option value="all">Tous les statuts</option>
            <option value="actif">Actifs</option>
            <option value="bloque">Bloques</option>
          </select>
        </div>

        {loading ? (
          <LoadingSpinner label="Chargement des utilisateurs..." className="m-6" />
        ) : error ? (
          <div className="m-6 rounded-[2rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {error}
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            title="Aucun utilisateur"
            description="Aucun compte ne correspond a la recherche actuelle."
            className="m-6"
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full">
                <thead className="bg-slate-50/80 text-left">
                  <tr className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    <th className="px-6 py-4 font-semibold">Utilisateur</th>
                    <th className="px-6 py-4 font-semibold">Email</th>
                    <th className="px-6 py-4 font-semibold">Ville</th>
                    <th className="px-6 py-4 font-semibold">Role</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Annonces</th>
                    <th className="px-6 py-4 font-semibold">Inscription</th>
                    <th className="px-6 py-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70">
                  {paginatedUsers.map((user) => (
                    <tr key={user.id} className="transition hover:bg-slate-50/70">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white">
                            {getInitials(user.name)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{user.name}</p>
                            <p className="mt-1 text-sm text-slate-500">{user.phone || 'Telephone non renseigne'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-600">{user.email}</td>
                      <td className="px-6 py-5 text-sm text-slate-600">{user.city || 'Ville non renseignee'}</td>
                      <td className="px-6 py-5 text-sm text-slate-600">{formatRoleLabel(user.role)}</td>
                      <td className="px-6 py-5">
                        <StatusBadge kind="user" status={user.status} />
                      </td>
                      <td className="px-6 py-5 text-sm font-semibold text-slate-900">{user.annonces_count}</td>
                      <td className="px-6 py-5 text-sm text-slate-600">{formatAdminDate(user.created_at)}</td>
                      <td className="px-6 py-5">
                        <div className="flex justify-end gap-2">
                          <ActionButton
                            title={user.status === 'bloque' ? 'Debloquer' : 'Bloquer'}
                            tone={user.status === 'bloque' ? 'blue' : 'rose'}
                            icon={user.status === 'bloque' ? UserRoundCheck : Ban}
                            disabled={user.role === 'admin'}
                            loading={actionId === `toggle-${user.id}`}
                            onClick={() => handleToggleBlock(user)}
                          />
                          <ActionButton
                            title="Supprimer"
                            tone="dark"
                            icon={Trash2}
                            disabled={user.role === 'admin'}
                            loading={actionId === `delete-${user.id}`}
                            onClick={() => handleDelete(user)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 p-4 lg:hidden">
              {paginatedUsers.map((user) => (
                <article
                  key={user.id}
                  className="rounded-[1.8rem] border border-slate-200/70 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white">
                      {getInitials(user.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-slate-900">{user.name}</h3>
                        <StatusBadge kind="user" status={user.status} />
                      </div>
                      <p className="mt-1 text-sm text-slate-500">{user.email}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-500">
                    <p>{user.city || 'Ville non renseignee'}</p>
                    <p>{formatRoleLabel(user.role)}</p>
                    <p>{user.annonces_count} annonce(s)</p>
                    <p>{formatAdminDate(user.created_at)}</p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <ActionButton
                      title={user.status === 'bloque' ? 'Debloquer' : 'Bloquer'}
                      tone={user.status === 'bloque' ? 'blue' : 'rose'}
                      icon={user.status === 'bloque' ? UserRoundCheck : Ban}
                      disabled={user.role === 'admin'}
                      loading={actionId === `toggle-${user.id}`}
                      onClick={() => handleToggleBlock(user)}
                    />
                    <ActionButton
                      title="Supprimer"
                      tone="dark"
                      icon={Trash2}
                      disabled={user.role === 'admin'}
                      loading={actionId === `delete-${user.id}`}
                      onClick={() => handleDelete(user)}
                    />
                  </div>
                </article>
              ))}
            </div>

            <Pagination
              currentPage={currentPage}
              totalItems={users.length}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          </>
        )}
      </section>
    </div>
  )
}

function ActionButton({ title, tone, icon: Icon, loading = false, disabled = false, onClick }) {
  const tones = {
    blue: 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100',
    rose: 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100',
    dark: 'border-slate-950 bg-slate-950 text-white hover:bg-slate-800',
  }

  return (
    <button
      type="button"
      disabled={loading || disabled}
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-45 ${tones[tone]}`}
    >
      <Icon className="h-4 w-4" />
      {loading ? '...' : title}
    </button>
  )
}
