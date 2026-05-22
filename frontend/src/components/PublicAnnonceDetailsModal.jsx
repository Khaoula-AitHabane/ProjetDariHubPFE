import { useEffect } from 'react'
import { X } from 'lucide-react'
import ServiceDetailPanel from './ServiceDetailPanel'

export default function PublicAnnonceDetailsModal({ service, onClose }) {
  useEffect(() => {
    if (!service) {
      return undefined
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleEscape(event) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleEscape)
    }
  }, [service, onClose])

  if (!service) {
    return null
  }

  return (
    <div className="public-details-modal fixed inset-0 z-[80] bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6">
      <button
        type="button"
        aria-label="Fermer"
        className="absolute inset-0"
        onClick={onClose}
      />

      <div className="public-details-dialog relative z-10 mx-auto max-h-full max-w-5xl overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="public-details-close absolute right-4 top-4 z-10 rounded-full border border-slate-200 bg-white p-2 text-slate-700 shadow-lg transition hover:bg-slate-50"
        >
          <X className="h-5 w-5" />
        </button>

        <ServiceDetailPanel service={service} />
      </div>
    </div>
  )
}
