import { useEffect, useEffectEvent, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { BarChart3, PieChart as PieChartIcon, RefreshCw, Users } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import { fetchAdminStatistics } from '../services/adminApi'
import { getApiErrorMessage } from '../services/axiosClient'
import { useMarketplace } from '../../context/MarketplaceContext'
import { chartPalette } from '../utils/formatters'

export default function StatisticsPage() {
  const { token } = useMarketplace()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadStatistics = useEffectEvent(async () => {
    if (!token) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const data = await fetchAdminStatistics(token)
      setStats(data)
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Impossible de charger les statistiques.'))
    } finally {
      setLoading(false)
    }
  })

  useEffect(() => {
    loadStatistics()
  }, [token])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Statistics"
        description="Suivez les tendances des annonces, des villes et des utilisateurs avec des graphiques clairs et responsives."
        action={
          <button
            type="button"
            onClick={loadStatistics}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-950"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        }
      />

      {loading ? (
        <LoadingSpinner label="Chargement des graphiques..." />
      ) : error ? (
        <div className="rounded-[2rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {error}
        </div>
      ) : !stats ? (
        <EmptyState
          title="Pas de statistiques"
          description="Aucune donnee exploitable pour le moment."
        />
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <ChartCard
            title="Annonces per city"
            icon={BarChart3}
            description="Les villes les plus actives du catalogue."
          >
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={stats.annonces_by_city}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 12 }} />
                <YAxis tick={{ fill: '#475569', fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[12, 12, 0, 0]} fill="#1d4ed8" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Users per month"
            icon={Users}
            description="Evolution recente des inscriptions."
          >
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={stats.users_by_month}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 12 }} />
                <YAxis tick={{ fill: '#475569', fontSize: 12 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#0f172a"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#0f172a' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Annonces categories"
            icon={PieChartIcon}
            description="Repartition des categories disponibles."
          >
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={stats.annonces_by_category}
                  innerRadius={70}
                  outerRadius={110}
                  dataKey="value"
                  nameKey="name"
                  paddingAngle={4}
                >
                  {stats.annonces_by_category.map((entry, index) => (
                    <Cell key={entry.name} fill={chartPalette[index % chartPalette.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Accepted vs refused annonces"
            icon={BarChart3}
            description="Vue rapide sur les decisions de moderation."
          >
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={stats.moderation_breakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 12 }} />
                <YAxis tick={{ fill: '#475569', fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                  {stats.moderation_breakdown.map((entry, index) => (
                    <Cell key={entry.name} fill={chartPalette[index % chartPalette.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}
    </div>
  )
}

function ChartCard({ title, description, icon: Icon, children }) {
  return (
    <section className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur">
      <div className="mb-6 flex items-center gap-4">
        <div className="rounded-2xl bg-slate-950 p-3 text-white">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
      </div>
      {children}
    </section>
  )
}
