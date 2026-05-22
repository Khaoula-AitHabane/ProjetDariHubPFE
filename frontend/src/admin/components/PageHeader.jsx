import { classNames } from '../utils/formatters'

export default function PageHeader({
  title,
  description,
  action,
  className = '',
}) {
  return (
    <div
      className={classNames(
        'flex flex-col gap-5 rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-sm backdrop-blur lg:flex-row lg:items-center lg:justify-between',
        className,
      )}
    >
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-700/70">
          DariHub Admin
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          {title}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}
