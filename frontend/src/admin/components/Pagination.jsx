import { ChevronLeft, ChevronRight } from 'lucide-react'
import { classNames } from '../utils/formatters'

export default function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  if (totalItems <= pageSize) {
    return null
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1)

  return (
    <div className="flex flex-col gap-4 border-t border-slate-200/80 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500">
        Page <span className="font-semibold text-slate-800">{currentPage}</span> sur{' '}
        <span className="font-semibold text-slate-800">{totalPages}</span>
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
          Prec.
        </button>

        <div className="hidden items-center gap-2 sm:flex">
          {pages.map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={classNames(
                'h-10 w-10 rounded-full text-sm font-semibold transition',
                currentPage === page
                  ? 'bg-slate-950 text-white shadow-lg shadow-slate-950/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900',
              )}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Suiv.
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
