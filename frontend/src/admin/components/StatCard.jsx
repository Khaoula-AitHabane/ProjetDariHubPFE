import { ArrowUpRight } from 'lucide-react'
import { classNames, formatCompactNumber } from '../utils/formatters'

const toneClasses = {
  blue: 'from-blue-600 to-sky-500 shadow-blue-600/20',
  navy: 'from-slate-950 to-slate-700 shadow-slate-950/25',
  amber: 'from-amber-500 to-orange-500 shadow-orange-500/20',
  emerald: 'from-emerald-500 to-teal-500 shadow-emerald-500/20',
  rose: 'from-rose-500 to-pink-500 shadow-rose-500/20',
}

export default function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'blue',
}) {
  return (
    <div className="admin-card-sheen stagger-entrance group p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {formatCompactNumber(value)}
          </p>
        </div>

        <div
          className={classNames(
            'flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg transition duration-300 group-hover:scale-105',
            toneClasses[tone] ?? toneClasses.blue,
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between text-sm">
        <p className="text-slate-500">{hint}</p>
        <ArrowUpRight className="h-4 w-4 text-slate-400 transition group-hover:text-slate-700" />
      </div>
    </div>
  )
}
