import {
  AlertTriangle,
  BrainCircuit,
  CalendarDays,
  CircleDollarSign,
  ExternalLink,
  MapPin,
  Phone,
  Tag,
  User2,
  X,
} from 'lucide-react'
import { useEffect } from 'react'
import StatusBadge from './StatusBadge'
import {
  formatAdminCurrency,
  formatAdminDateTime,
  truncateText,
} from '../utils/formatters'

export default function AnnonceDetailsDrawer({ annonce, onClose }) {
  useEffect(() => {
    if (!annonce) {
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
  }, [annonce, onClose])

  if (!annonce) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/65 p-3 backdrop-blur-sm sm:p-6">
      <button
        type="button"
        aria-label="Fermer"
        className="absolute inset-0"
        onClick={onClose}
      />

      <div className="admin-scrollbar relative z-10 mx-auto h-full max-w-6xl overflow-y-auto rounded-[2rem] border border-white/10 bg-slate-950 text-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-white/10 bg-slate-950/90 px-5 py-5 backdrop-blur sm:px-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-200/80">
              Detail annonce
            </p>
            <h2 className="mt-2 text-xl font-semibold sm:text-2xl">{annonce.title}</h2>
            <p className="mt-2 text-sm text-slate-300">
              {annonce.city} / {annonce.category} / {annonce.provider?.name ?? 'Annonceur inconnu'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full border border-white/15 bg-white/10 p-2 text-white transition hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5">
              {annonce.image_url ? (
                <img
                  src={annonce.image_url}
                  alt={annonce.title}
                  className="h-72 w-full object-cover sm:h-96"
                />
              ) : (
                <div className="flex h-72 items-center justify-center bg-slate-900 text-slate-400 sm:h-96">
                  Aucune image
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge kind="annonce" status={annonce.status} />
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-200">
                {annonce.category}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-200">
                {annonce.service_type}
              </span>
            </div>

            <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
              <h3 className="text-lg font-semibold">Description</h3>
              <p className="mt-3 text-sm leading-7 text-slate-200">
                {annonce.description || truncateText(annonce.title, 200)}
              </p>
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
              <h3 className="text-lg font-semibold">Caracteristiques</h3>
              {annonce.features?.length ? (
                <div className="mt-4 flex flex-wrap gap-3">
                  {annonce.features.map((feature) => (
                    <span
                      key={feature}
                      className="rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-sm text-blue-100"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-400">Aucune caracteristique specifique.</p>
              )}
            </section>
          </div>

          <div className="space-y-6">
            {annonce.ai_checked && (
              <section className={`rounded-[2rem] border p-5 ${
                annonce.ai_risk_level === 'high' ? 'border-rose-500/30 bg-rose-500/10' :
                annonce.ai_risk_level === 'medium' ? 'border-amber-500/30 bg-amber-500/10' :
                'border-emerald-500/30 bg-emerald-500/10'
              }`}>
                <div className="flex items-center gap-2">
                  <BrainCircuit className={`h-5 w-5 ${
                    annonce.ai_risk_level === 'high' ? 'text-rose-400' :
                    annonce.ai_risk_level === 'medium' ? 'text-amber-400' :
                    'text-emerald-400'
                  }`} />
                  <h3 className="text-lg font-semibold text-white">Assistant de Modération IA</h3>
                </div>
                
                <div className="mt-4 grid gap-4">
                  <div className="flex items-center justify-between rounded-2xl bg-slate-950/40 p-4">
                    <span className="text-sm font-medium text-slate-300">Score de Risque</span>
                    <span className={`text-xl font-bold ${
                      annonce.ai_risk_level === 'high' ? 'text-rose-400' :
                      annonce.ai_risk_level === 'medium' ? 'text-amber-400' :
                      'text-emerald-400'
                    }`}>
                      {annonce.ai_risk_score}%
                    </span>
                  </div>

                  <div className="rounded-2xl bg-slate-950/40 p-4">
                    <span className="text-sm font-medium text-slate-300">Raisons détectées</span>
                    {annonce.ai_reasons && annonce.ai_reasons.length > 0 ? (
                      <ul className="mt-2 flex flex-col gap-2">
                        {annonce.ai_reasons.map((reason, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-slate-200">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm text-emerald-400">Aucune raison de risque détectée.</p>
                    )}
                  </div>
                  
                  <div className="rounded-2xl bg-slate-950/40 p-4">
                     <span className="text-sm font-medium text-slate-300">Recommandation IA</span>
                     <p className="mt-1 font-semibold text-white uppercase tracking-wider text-sm">
                       {annonce.ai_recommendation === 'approve' ? 'Accepter' : 
                        annonce.ai_recommendation === 'reject' ? 'Refuser' : 
                        'A vérifier'}
                     </p>
                  </div>
                </div>
              </section>
            )}

            <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
              <h3 className="text-lg font-semibold">Informations generales</h3>
              <div className="mt-4 grid gap-4">
                <DetailItem
                  icon={CircleDollarSign}
                  label="Prix"
                  value={formatAdminCurrency(annonce.price)}
                />
                <DetailItem icon={MapPin} label="Ville" value={annonce.city} />
                <DetailItem
                  icon={Tag}
                  label="Adresse"
                  value={annonce.address || 'Non renseignee'}
                />
                <DetailItem
                  icon={CalendarDays}
                  label="Publiee le"
                  value={formatAdminDateTime(annonce.created_at)}
                />
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
              <h3 className="text-lg font-semibold">Annonceur</h3>
              <div className="mt-4 grid gap-4">
                <DetailItem
                  icon={User2}
                  label="Nom"
                  value={annonce.provider?.name ?? 'Inconnu'}
                />
                <DetailItem
                  icon={Phone}
                  label="Telephone"
                  value={annonce.provider?.phone ?? 'Non renseigne'}
                />
                <DetailItem
                  icon={Tag}
                  label="Email"
                  value={annonce.provider?.email ?? 'Non renseigne'}
                />
              </div>
            </section>

            {annonce.source_url ? (
              <a
                href={annonce.source_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/15 px-4 py-3 text-sm font-semibold text-blue-100 transition hover:bg-blue-500/25"
              >
                <ExternalLink className="h-4 w-4" />
                Voir la source originale
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

function DetailItem({ icon: Icon, label, value }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-white/10 p-2 text-blue-200">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
          <p className="mt-1 text-sm font-medium text-white">{value}</p>
        </div>
      </div>
    </div>
  )
}
