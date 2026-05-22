import { useDeferredValue, useEffect, useEffectEvent, useState } from 'react'
import { BrainCircuit, Eye, Filter, MapPin, RefreshCw, ShieldCheck, Trash2, XCircle } from 'lucide-react'
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
  acceptAnnonce,
  deleteAnnonce,
  fetchAnnonces,
  fetchPendingAnnonces,
  refuseAnnonce,
} from '../services/adminApi'
import { getApiErrorMessage } from '../services/axiosClient'
import { useMarketplace } from '../../context/MarketplaceContext'
import {
  formatAdminCurrency,
  formatAdminDate,
} from '../utils/formatters'

const pageSize = 6

export default function AnnoncesPage({ title, description, statusFilter }) {
  const { token } = useMarketplace()
  const { refreshDashboard } = useAdmin()
  const { globalSearch } = useOutletContext()
  const deferredSearch = useDeferredValue(globalSearch)

  const [annonces, setAnnonces] = useState([])
  const [counts, setCounts] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    refused: 0,
  })
  const [cities, setCities] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCity, setSelectedCity] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionId, setActionId] = useState('')
  const [page, setPage] = useState(1)
  const [selectedAnnonce, setSelectedAnnonce] = useState(null)

  const loadAnnonces = useEffectEvent(async ({ showLoader = true } = {}) => {
    if (!token) {
      return
    }

    if (showLoader) {
      setLoading(true)
    }

    setError('')

    try {
      const response =
        statusFilter === 'en_attente'
          ? await fetchPendingAnnonces(token, {
              search: deferredSearch,
              city: selectedCity === 'all' ? '' : selectedCity,
              category: selectedCategory === 'all' ? '' : selectedCategory,
            })
          : await fetchAnnonces(token, {
              status: statusFilter,
              search: deferredSearch,
              city: selectedCity === 'all' ? '' : selectedCity,
              category: selectedCategory === 'all' ? '' : selectedCategory,
            })

      setAnnonces(response.data ?? [])
      setCounts(response.meta?.counts ?? counts)
      setCities(response.meta?.filters?.cities ?? [])
      setCategories(response.meta?.filters?.categories ?? [])
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, 'Impossible de charger les annonces admin.'),
      )
    } finally {
      setLoading(false)
    }
  })

  useEffect(() => {
    loadAnnonces({ showLoader: annonces.length === 0 })
  }, [token, deferredSearch, selectedCity, selectedCategory, statusFilter])

  async function handleAction(type, annonceId) {
    if (actionId) {
      return
    }

    setActionId(`${type}-${annonceId}`)

    try {
      if (type === 'accept') {
        await acceptAnnonce(token, annonceId)
        toast.success('Annonce acceptee.')
      }

      if (type === 'refuse') {
        await refuseAnnonce(token, annonceId)
        toast.success('Annonce refusee.')
      }

      if (type === 'delete') {
        if (!window.confirm('Supprimer definitivement cette annonce ?')) {
          return
        }

        await deleteAnnonce(token, annonceId)
        toast.success('Annonce supprimee.')
      }

      await Promise.all([loadAnnonces(), refreshDashboard()])
      setSelectedAnnonce((current) => (current?.id === annonceId ? null : current))
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError, 'Action impossible pour le moment.'))
    } finally {
      setActionId('')
    }
  }

  const totalPages = Math.max(1, Math.ceil(annonces.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paginatedAnnonces = annonces.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        action={
          <button
            type="button"
            onClick={loadAnnonces}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-950"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        }
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Toutes les annonces" value={counts.total} hint="Volume global" icon={Filter} tone="navy" />
        <StatCard label="En attente" value={counts.pending} hint="A moderer" icon={RefreshCw} tone="amber" />
        <StatCard label="Validees" value={counts.accepted} hint="Catalogue public" icon={ShieldCheck} tone="emerald" />
        <StatCard label="Refusees" value={counts.refused} hint="Moderation terminee" icon={XCircle} tone="rose" />
      </div>

      <section className="rounded-[2rem] border border-white/70 bg-white/80 shadow-sm backdrop-blur">
        <div className="grid gap-4 border-b border-slate-200/70 px-6 py-5 lg:grid-cols-[1fr_1fr_auto]">
          <div>
            <p className="text-sm font-semibold text-slate-900">Filtres</p>
            <p className="mt-1 text-sm text-slate-500">
              Affinez par ville, categorie et recherche globale dans la navbar.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <select
              value={selectedCity}
              onChange={(event) => setSelectedCity(event.target.value)}
              className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            >
              <option value="all">Toutes les villes</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>

            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            >
              <option value="all">Toutes les categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center text-sm text-slate-500">
            {annonces.length} resultat(s)
          </div>
        </div>

        {loading ? (
          <LoadingSpinner label="Chargement des annonces..." className="m-6" />
        ) : error ? (
          <div className="m-6 rounded-[2rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {error}
          </div>
        ) : annonces.length === 0 ? (
          <EmptyState
            title="Aucune annonce a afficher"
            description="Essayez une autre recherche ou supprimez quelques filtres."
            className="m-6"
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full">
                <thead className="bg-slate-50/80 text-left">
                  <tr className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    <th className="px-6 py-4 font-semibold">Annonce</th>
                    <th className="px-6 py-4 font-semibold">Prix</th>
                    <th className="px-6 py-4 font-semibold">Ville</th>
                    <th className="px-6 py-4 font-semibold">Categorie</th>
                    <th className="px-6 py-4 font-semibold">Utilisateur</th>
                    <th className="px-6 py-4 font-semibold">Date</th>
                    <th className="px-6 py-4 font-semibold">Score IA</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70">
                  {paginatedAnnonces.map((annonce) => (
                    <tr key={annonce.id} className="transition hover:bg-slate-50/70">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="h-16 w-16 overflow-hidden rounded-2xl bg-slate-100">
                            {annonce.image_url ? (
                              <img
                                src={annonce.image_url}
                                alt={annonce.title}
                                className="h-full w-full object-cover"
                              />
                            ) : null}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{annonce.title}</p>
                            <p className="mt-1 text-sm text-slate-500">#{annonce.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm font-semibold text-slate-900">
                        {formatAdminCurrency(annonce.price)}
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-600">
                        <span className="inline-flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-slate-400" />
                          {annonce.city}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-600">{annonce.category}</td>
                      <td className="px-6 py-5 text-sm text-slate-600">
                        {annonce.provider?.name ?? 'Utilisateur inconnu'}
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-600">
                        {formatAdminDate(annonce.created_at)}
                      </td>
                      <td className="px-6 py-5">
                        <AiRiskBadge score={annonce.ai_risk_score} level={annonce.ai_risk_level} />
                      </td>
                      <td className="px-6 py-5">
                        <StatusBadge kind="annonce" status={annonce.status} />
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex justify-end gap-2">
                          <ActionButton
                            title="Accepter"
                            tone="emerald"
                            icon={ShieldCheck}
                            loading={actionId === `accept-${annonce.id}`}
                            onClick={() => handleAction('accept', annonce.id)}
                          />
                          <ActionButton
                            title="Refuser"
                            tone="rose"
                            icon={XCircle}
                            loading={actionId === `refuse-${annonce.id}`}
                            onClick={() => handleAction('refuse', annonce.id)}
                          />
                          <ActionButton
                            title="Voir details"
                            tone="slate"
                            icon={Eye}
                            onClick={() => setSelectedAnnonce(annonce)}
                          />
                          <ActionButton
                            title="Supprimer"
                            tone="dark"
                            icon={Trash2}
                            loading={actionId === `delete-${annonce.id}`}
                            onClick={() => handleAction('delete', annonce.id)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 p-4 lg:hidden">
              {paginatedAnnonces.map((annonce) => (
                <article
                  key={annonce.id}
                  className="rounded-[1.8rem] border border-slate-200/70 bg-white p-4 shadow-sm"
                >
                  <div className="flex gap-4">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                      {annonce.image_url ? (
                        <img
                          src={annonce.image_url}
                          alt={annonce.title}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge kind="annonce" status={annonce.status} />
                        <AiRiskBadge score={annonce.ai_risk_score} level={annonce.ai_risk_level} />
                        <span className="text-xs text-slate-500">#{annonce.id}</span>
                      </div>
                      <h3 className="mt-3 text-base font-semibold text-slate-900">{annonce.title}</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {annonce.city} / {annonce.category}
                      </p>
                      <p className="mt-3 text-sm font-semibold text-slate-900">
                        {formatAdminCurrency(annonce.price)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-500">
                    <p>{annonce.provider?.name ?? 'Utilisateur inconnu'}</p>
                    <p>{formatAdminDate(annonce.created_at)}</p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <ActionButton
                      title="Accepter"
                      tone="emerald"
                      icon={ShieldCheck}
                      loading={actionId === `accept-${annonce.id}`}
                      onClick={() => handleAction('accept', annonce.id)}
                    />
                    <ActionButton
                      title="Refuser"
                      tone="rose"
                      icon={XCircle}
                      loading={actionId === `refuse-${annonce.id}`}
                      onClick={() => handleAction('refuse', annonce.id)}
                    />
                    <ActionButton
                      title="Details"
                      tone="slate"
                      icon={Eye}
                      onClick={() => setSelectedAnnonce(annonce)}
                    />
                    <ActionButton
                      title="Supprimer"
                      tone="dark"
                      icon={Trash2}
                      loading={actionId === `delete-${annonce.id}`}
                      onClick={() => handleAction('delete', annonce.id)}
                    />
                  </div>
                </article>
              ))}
            </div>

            <Pagination
              currentPage={currentPage}
              totalItems={annonces.length}
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

function ActionButton({ title, tone, icon: Icon, loading = false, onClick }) {
  const tones = {
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
    rose: 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100',
    slate: 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100',
    dark: 'border-slate-950 bg-slate-950 text-white hover:bg-slate-800',
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${tones[tone]}`}
    >
      <Icon className="h-4 w-4" />
      {loading ? '...' : title}
    </button>
  )
}

function AiRiskBadge({ score, level }) {
  if (score === undefined || score === null) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-500">
        <BrainCircuit className="h-3.5 w-3.5" />
        Non evalue
      </div>
    )
  }

  const configs = {
    low: {
      border: 'border-emerald-200',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      label: 'Risque Faible',
    },
    medium: {
      border: 'border-amber-200',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      label: 'Risque Moyen',
    },
    high: {
      border: 'border-rose-200',
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      label: 'Risque Eleve',
    },
  }

  const config = configs[level] || configs.medium

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${config.border} ${config.bg} ${config.text}`}
      title={`Score IA: ${score}%`}
    >
      <BrainCircuit className="h-3.5 w-3.5" />
      {config.label} ({score}%)
    </div>
  )
}
