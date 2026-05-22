import { ExternalLink, MapPin } from 'lucide-react'
import {
  getGoogleMapsEmbedUrl,
  getGoogleMapsUrl,
  getListingCoordinates,
} from '../lib/listingDetails'

export default function ListingReadonlyMap({ listing }) {
  const coords = getListingCoordinates(listing)
  const embedUrl = getGoogleMapsEmbedUrl(coords)
  const mapsUrl = getGoogleMapsUrl(coords)

  return (
    <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <iframe
        title={`Carte de ${listing?.title ?? 'l annonce'}`}
        src={embedUrl}
        className="h-[320px] w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />

      <div className="flex flex-col gap-4 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
            <MapPin className="h-4 w-4 text-rose-500" />
            {listing?.location_address || listing?.location_city || 'Localisation disponible'}
          </p>
          <p className="text-xs text-slate-500">
            Latitude {coords.lat.toFixed(5)} , Longitude {coords.lng.toFixed(5)}
          </p>
        </div>

        <a
          href={mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white hover:text-slate-950"
        >
          <ExternalLink className="h-4 w-4" />
          Ouvrir dans Google Maps
        </a>
      </div>
    </div>
  )
}
