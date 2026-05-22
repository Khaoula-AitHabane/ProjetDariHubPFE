import { MoonStar, Palette, ShieldCheck, SunMedium } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { useAdmin } from '../context/AdminContext'
import { useMarketplace } from '../../context/MarketplaceContext'
import { API_BASE_URL } from '../../lib/marketplace'

export default function SettingsPage() {
  const { currentUser, darkMode, toggleDarkMode } = useMarketplace()
  const { summary, refreshDashboard } = useAdmin()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Quelques reglages simples pour l espace admin DariHub et un rappel des indicateurs critiques."
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-slate-950 p-3 text-white">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Appearance</h2>
              <p className="mt-1 text-sm text-slate-500">
                Alternez entre un rendu clair et sombre selon votre confort.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-4 rounded-[1.8rem] border border-slate-200/70 bg-slate-50/70 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Dark mode</p>
              <p className="mt-1 text-sm text-slate-500">
                Le tableau garde aussi la preference locale du navigateur.
              </p>
            </div>

            <button
              type="button"
              onClick={toggleDarkMode}
              className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              {darkMode ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
              {darkMode ? 'Revenir au mode clair' : 'Activer le mode sombre'}
            </button>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-blue-600 p-3 text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Compte admin</h2>
              <p className="mt-1 text-sm text-slate-500">
                Informations de session et raccourcis utiles.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <InfoTile label="Nom" value={currentUser?.name ?? 'Admin'} />
            <InfoTile label="Email" value={currentUser?.email ?? '—'} />
            <InfoTile label="API base URL" value={API_BASE_URL || 'Meme origine'} />
            <InfoTile label="Pending annonces" value={String(summary.pending_annonces ?? 0)} />
            <InfoTile label="Reports ouverts" value={String(summary.reports_count ?? 0)} />
            <InfoTile label="Utilisateurs" value={String(summary.total_users ?? 0)} />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={refreshDashboard}
              className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
            >
              Actualiser les indicateurs
            </button>
            <Link
              to="/"
              className="inline-flex items-center rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Retour au site
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}

function InfoTile({ label, value }) {
  return (
    <div className="rounded-[1.6rem] border border-slate-200/70 bg-slate-50/70 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-900">{value}</p>
    </div>
  )
}
