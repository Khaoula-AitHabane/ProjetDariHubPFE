import { LoaderCircle } from 'lucide-react'
import { classNames } from '../utils/formatters'

export default function LoadingSpinner({
  label = 'Chargement en cours...',
  className = '',
  size = 'default',
}) {
  return (
    <div
      className={classNames(
        'flex min-h-48 flex-col items-center justify-center gap-4 rounded-[2rem] border border-slate-200/70 bg-white/80 p-8 text-slate-500 shadow-sm backdrop-blur',
        className,
      )}
    >
      <LoaderCircle
        className={classNames(
          'animate-spin text-blue-700',
          size === 'small' ? 'h-5 w-5' : 'h-8 w-8',
        )}
      />
      <p className="text-sm font-medium">{label}</p>
    </div>
  )
}
