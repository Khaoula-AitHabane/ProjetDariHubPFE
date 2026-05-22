import { getStatusConfig } from '../utils/formatters'

export default function StatusBadge({ kind, status }) {
  const config = getStatusConfig(kind, status)

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${config.classes}`}>
      {config.label}
    </span>
  )
}
