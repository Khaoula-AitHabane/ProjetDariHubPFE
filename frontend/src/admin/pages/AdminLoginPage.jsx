import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { LockKeyhole, Shield, Sparkles } from 'lucide-react'
import { useMarketplace } from '../../context/MarketplaceContext'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser, login, logout, authSubmitting, authFeedback } = useMarketplace()
  const [form, setForm] = useState({
    email: '',
    password: '',
  })
  const [localError, setLocalError] = useState('')

  if (currentUser?.role === 'admin') {
    return <Navigate to="/admin" replace />
  }

  if (currentUser && currentUser.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setLocalError('')

    const response = await login(form)

    if (!response?.data) {
      return
    }

    if (response.data.role !== 'admin') {
      await logout()
      setLocalError('Ce compte ne dispose pas des droits administrateur.')
      return
    }

    const nextPath = location.state?.from?.pathname || '/admin'
    navigate(nextPath, { replace: true })
  }

  return (
    <section className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(29,78,216,0.24),_transparent_28%),linear-gradient(135deg,_#0f172a_0%,_#111c33_44%,_#1e3a8a_100%)] px-4 py-10 text-white">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/8 shadow-2xl shadow-slate-950/35 backdrop-blur-xl lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col justify-between p-8 sm:p-10 lg:p-12">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-200/80">
              DariHub Admin
            </p>
            <h1 className="mt-5 max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
              Un dashboard immobilier moderne pour piloter la moderation.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-200/80">
              Connectez-vous avec votre compte administrateur pour suivre les annonces,
              les utilisateurs, les signalements et les statistiques de la plateforme.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <FeatureCard
              icon={Shield}
              title="Routes protegees"
              description="Acces reserve uniquement aux comptes admin."
            />
            <FeatureCard
              icon={Sparkles}
              title="UX premium"
              description="Tableaux propres, badges clairs et actions rapides."
            />
            <FeatureCard
              icon={LockKeyhole}
              title="Session securisee"
              description="Authentification token Laravel et controle des roles."
            />
          </div>
        </div>

        <div className="flex items-center justify-center border-t border-white/10 bg-slate-950/30 p-8 sm:p-10 lg:border-l lg:border-t-0">
          <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-xl sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-200/80">
              Admin Login
            </p>
            <h2 className="mt-3 text-3xl font-semibold">Bienvenue</h2>
            <p className="mt-3 text-sm leading-7 text-slate-200/80">
              Utilisez vos identifiants administrateur DariHub pour ouvrir le tableau
              de bord.
            </p>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-200">Email</span>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  className="h-12 w-full rounded-2xl border border-white/10 bg-white/10 px-4 text-white outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-400/15"
                  placeholder="admin@darihub.com"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-200">Mot de passe</span>
                <input
                  required
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  className="h-12 w-full rounded-2xl border border-white/10 bg-white/10 px-4 text-white outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-400/15"
                  placeholder="Votre mot de passe"
                />
              </label>

              {(localError || authFeedback?.type === 'error') ? (
                <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                  {localError || authFeedback?.message}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={authSubmitting}
                className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-white px-4 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {authSubmitting ? 'Connexion en cours...' : 'Ouvrir le dashboard'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}

function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-white/8 p-5 backdrop-blur">
      <div className="inline-flex rounded-2xl bg-white/10 p-3 text-blue-200">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-200/75">{description}</p>
    </div>
  )
}
