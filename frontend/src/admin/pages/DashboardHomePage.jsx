import {
  BadgeCheck,
  Ban,
  Flag,
  LayoutDashboard,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import LoadingSpinner from '../components/LoadingSpinner'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import StatusBadge from '../components/StatusBadge'
import { useAdmin } from '../context/AdminContext'
import {
  formatAdminCurrency,
  formatAdminDateTime,
  truncateText,
} from '../utils/formatters'

export default function DashboardHomePage() {
  const { summary, recentPending, recentReports, loadingSummary, summaryError } = useAdmin()

  const statCards = [
    {
      label: 'Total users',
      value: summary.total_users,
      hint: 'Comptes actifs et admin',
      icon: Users,
      tone: 'blue',
    },
    {
      label: 'Total annonces',
      value: summary.total_annonces,
      hint: 'Catalogue global DariHub',
      icon: LayoutDashboard,
      tone: 'navy',
    },
    {
      label: 'Pending annonces',
      value: summary.pending_annonces,
      hint: 'A traiter en priorite',
      icon: Flag,
      tone: 'amber',
    },
    {
      label: 'Accepted annonces',
      value: summary.accepted_annonces,
      hint: 'Annonces visibles sur la plateforme',
      icon: BadgeCheck,
      tone: 'emerald',
    },
    {
      label: 'Refused annonces',
      value: summary.refused_annonces,
      hint: 'Elements exclus du catalogue',
      icon: Ban,
      tone: 'rose',
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard home"
        description="Une vue claire sur la moderation des annonces, les utilisateurs et les signalements a traiter."
        action={
          <Link
            to="/admin/pending-annonces"
            className="inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold !text-white shadow-lg shadow-slate-950/20 transition hover:bg-slate-800"
          >
            Ouvrir la file d attente
          </Link>
        }
      />

      {loadingSummary ? (
        <LoadingSpinner label="Chargement des indicateurs admin..." />
      ) : (
        <>
          {summaryError ? (
            <div className="rounded-[2rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
              {summaryError}
            </div>
          ) : null}

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
            {statCards.map((card) => (
              <StatCard key={card.label} {...card} />
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
            <section className="admin-card-sheen stagger-entrance">
              <div className="flex items-center justify-between border-b border-slate-200/70 px-6 py-5">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">Dernieres annonces en attente</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Priorisez les nouvelles annonces a valider aujourd hui.
                  </p>
                </div>
                <Link to="/admin/pending-annonces" className="text-sm font-semibold text-blue-700">
                  Voir tout
                </Link>
              </div>

              {recentPending.length ? (
                <div className="divide-y divide-slate-200/70">
                  {recentPending.map((annonce) => (
                    <article
                      key={annonce.id}
                      className="flex flex-col gap-4 px-6 py-5 transition hover:bg-slate-50/80 lg:flex-row lg:items-center lg:justify-between"
                    >
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
                          <h3 className="text-base font-semibold text-slate-900">{annonce.title}</h3>
                          <p className="mt-1 text-sm text-slate-500">
                            {annonce.city} / {annonce.category} / {annonce.provider?.name}
                          </p>
                          <p className="mt-1 text-sm font-medium text-slate-900">
                            {formatAdminCurrency(annonce.price)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge kind="annonce" status={annonce.status} />
                        <span className="text-sm text-slate-500">
                          {formatAdminDateTime(annonce.created_at)}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Aucune annonce en attente"
                  description="La file de moderation est vide pour le moment."
                  className="m-6"
                />
              )}
            </section>

            <section className="admin-card-sheen stagger-entrance">
              <div className="flex items-center justify-between border-b border-slate-200/70 px-6 py-5">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">Signalements recents</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Les reports ouverts a verifier rapidement.
                  </p>
                </div>
                <Link to="/admin/reports" className="text-sm font-semibold text-blue-700">
                  Gerer
                </Link>
              </div>

              {recentReports.length ? (
                <div className="divide-y divide-slate-200/70">
                  {recentReports.map((report) => (
                    <article key={report.id} className="px-6 py-5">
                      <div className="flex flex-wrap items-center gap-3">
                        <StatusBadge kind="report" status={report.status} />
                        <p className="text-sm font-semibold text-slate-900">{report.reason}</p>
                      </div>
                      <p className="mt-3 text-sm text-slate-600">
                        {truncateText(report.message || report.annonce?.title || 'Signalement sans detail', 90)}
                      </p>
                      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                        <span>{report.reporter?.name ?? 'Utilisateur anonyme'}</span>
                        <span>/</span>
                        <span>{report.annonce?.provider?.name ?? 'Annonceur inconnu'}</span>
                        <span>/</span>
                        <span>{formatAdminDateTime(report.created_at)}</span>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Aucun signalement ouvert"
                  description="Les utilisateurs n ont remonte aucun contenu critique."
                  className="m-6"
                />
              )}
            </section>
          </div>
        </>
      )}
    </div>
  )
}
