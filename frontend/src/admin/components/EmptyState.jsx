import { Inbox } from 'lucide-react'
import { classNames } from '../utils/formatters'

export default function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className = '',
}) {
  return (
    <div
      className={classNames(
        'flex min-h-64 flex-col items-center justify-center rounded-[2rem] border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center shadow-sm',
        className,
      )}
    >
      <div className="mb-5 rounded-2xl bg-slate-100 p-4 text-slate-600">
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}
