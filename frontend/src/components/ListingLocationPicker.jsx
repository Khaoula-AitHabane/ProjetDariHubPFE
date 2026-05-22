import { useEffect, useMemo, useState } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import {
  Bot,
  LocateFixed,
  MapPin,
  Navigation,
  Search,
  Sparkles,
} from 'lucide-react'
import {
  getCityCoordinates,
  getGoogleMapsUrl,
  getListingCoordinates,
} from '../lib/listingDetails'
import useSmartLocationSearch from '../hooks/useSmartLocationSearch'

const DEFAULT_ZOOM = 13

function isValidLatLng(value) {
  return (
    value &&
    Number.isFinite(Number(value.lat)) &&
    Number.isFinite(Number(value.lng))
  )
}

function sanitizeLatLng(value, fallback = null) {
  if (isValidLatLng(value)) {
    return {
      lat: Number(value.lat),
      lng: Number(value.lng),
    }
  }

  return fallback
}

const redMarkerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

function RecenterMap({ center }) {
  const map = useMap()

  useEffect(() => {
    if (!isValidLatLng(center)) {
      return
    }

    map.flyTo(center, DEFAULT_ZOOM, {
      duration: 0.8,
    })
  }, [center, map])

  return null
}

function MapClickHandler({ onPick }) {
  useMapEvents({
    click(event) {
      onPick({
        lat: event.latlng.lat,
        lng: event.latlng.lng,
      })
    },
  })

  return null
}

export default function ListingLocationPicker({
  city,
  address,
  latitude,
  longitude,
  onChange,
}) {
  const initialCenter = useMemo(
    () =>
      getListingCoordinates({
        location_city: city,
        latitude,
        longitude,
      }),
    [city, latitude, longitude],
  )

  const [markerPosition, setMarkerPosition] = useState(() => sanitizeLatLng(initialCenter, getCityCoordinates(city)))
  const [searchError, setSearchError] = useState('')
  const [geoLoading, setGeoLoading] = useState(false)
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)

  const {
    query: searchQuery,
    setQuery: setSearchQuery,
    suggestions,
    loading: searching,
    error: smartSearchError,
    lastResolvedQuery,
    search: runSmartSearch,
    selectSuggestion,
    clearError,
  } = useSmartLocationSearch({
    city,
    initialQuery: address ?? '',
    onResolved: ({ lat, lng, displayName }) => {
      const resolvedPosition = sanitizeLatLng({ lat, lng })

      if (resolvedPosition) {
        updatePosition(resolvedPosition)
      }

      if (displayName) {
        setSearchQuery(displayName)
      }
    },
  })

  useEffect(() => {
    const cityCenter = getCityCoordinates(city)

    if (!cityCenter) {
      return
    }

    const hasManualCoordinates =
      Number.isFinite(Number(latitude)) &&
      Number.isFinite(Number(longitude)) &&
      String(latitude).trim() !== '' &&
      String(longitude).trim() !== ''

    if (!hasManualCoordinates) {
      setMarkerPosition(cityCenter)
      onChange({
        latitude: cityCenter.lat.toFixed(6),
        longitude: cityCenter.lng.toFixed(6),
      })
    }
  }, [city, latitude, longitude, onChange])

  useEffect(() => {
    const safeCenter = sanitizeLatLng(initialCenter, getCityCoordinates(city) ?? getListingCoordinates({ location_city: city }))

    if (safeCenter) {
      setMarkerPosition(safeCenter)
    }
  }, [city, initialCenter])

  function updatePosition(nextPosition) {
    const normalized = sanitizeLatLng(nextPosition)

    if (!normalized) {
      setSearchError('Impossible d utiliser cette localisation car les coordonnees sont invalides.')
      return false
    }

    setMarkerPosition(normalized)
    onChange({
      latitude: normalized.lat.toFixed(6),
      longitude: normalized.lng.toFixed(6),
    })
    setSearchError('')
    clearError()
    return true
  }

  async function handleSearch(event) {
    event?.preventDefault?.()

    const query = searchQuery.trim()
    if (!query) {
      setSearchError('Saisissez une adresse ou un quartier.')
      return
    }
    setSearchError('')
    setSuggestionsOpen(false)

    const result = await runSmartSearch(query)
    if (!result) {
      return
    }
  }

  function handleUseCurrentPosition() {
    if (!navigator.geolocation) {
      setSearchError('La geolocalisation n est pas disponible sur cet appareil.')
      return
    }

    setGeoLoading(true)
    setSearchError('')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        updatePosition({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
        setGeoLoading(false)
      },
      () => {
        setGeoLoading(false)
        setSearchError('Impossible de recuperer votre position actuelle.')
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    )
  }

  const safeMarkerPosition =
    sanitizeLatLng(markerPosition) ??
    sanitizeLatLng(initialCenter) ??
    getCityCoordinates(city) ??
    getListingCoordinates({ location_city: city })
  const previewUrl = getGoogleMapsUrl(safeMarkerPosition)
  const smartSuggestions = suggestions
  const resolvedError = searchError || smartSearchError

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Localisation du bien</p>
          <p className="mt-1 text-sm text-slate-500">
            Cherchez une adresse, cliquez sur la carte ou deplacez le marker rouge.
          </p>
        </div>

        <a
          href={previewUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
        >
          <Navigation className="h-4 w-4" />
          Ouvrir dans Google Maps
        </a>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative flex-1">
              <Bot className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value)
                  setSuggestionsOpen(true)
                  setSearchError('')
                  clearError()
                }}
                onFocus={() => setSuggestionsOpen(true)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    handleSearch(event)
                  }
                }}
                placeholder="Recherche intelligente de localisation (Beta)"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              />

              {suggestionsOpen && smartSuggestions.length > 0 ? (
                <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-[500] overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white shadow-xl">
                  <div className="border-b border-slate-100 px-4 py-3">
                    <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-orange-500">
                      <Sparkles className="h-3.5 w-3.5" />
                      Recherche intelligente
                    </p>
                  </div>
                  <div className="max-h-64 overflow-y-auto py-2">
                    {smartSuggestions.map((suggestion) => (
                      <button
                        key={suggestion.id ?? suggestion.label}
                        type="button"
                        onClick={async () => {
                          setSuggestionsOpen(false)
                          const result =
                            sanitizeLatLng(suggestion)
                              ? selectSuggestion(suggestion)
                              : await runSmartSearch(suggestion.label)

                          if (result?.displayName) {
                            setSearchQuery(result.displayName)
                          }
                        }}
                        className="flex w-full items-start gap-3 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                      >
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                        <span>{suggestion.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </label>

            <button
              type="submit"
              disabled={searching}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Search className="h-4 w-4" />
              {searching ? 'Recherche...' : 'Rechercher'}
            </button>
          </div>

          <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
            <MapContainer
              center={safeMarkerPosition}
              zoom={DEFAULT_ZOOM}
              scrollWheelZoom
              className="h-[360px] w-full"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <RecenterMap center={safeMarkerPosition} />
              <MapClickHandler onPick={updatePosition} />
              <Marker
                position={safeMarkerPosition}
                draggable
                icon={redMarkerIcon}
                eventHandlers={{
                  dragend(event) {
                    const next = event.target.getLatLng()
                    updatePosition(next)
                  },
                }}
              />
            </MapContainer>
          </div>
        </div>

        <div className="space-y-4 rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="rounded-[1.35rem] border border-orange-100 bg-orange-50 px-4 py-3">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-orange-600">
              <Sparkles className="h-3.5 w-3.5" />
              Recherche intelligente Beta
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Comprend la darija, le francais melange, les fautes simples et les lieux approximatifs.
            </p>
          </div>

          <button
            type="button"
            onClick={handleUseCurrentPosition}
            disabled={geoLoading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LocateFixed className="h-4 w-4" />
            {geoLoading ? 'Localisation...' : 'Utiliser ma position actuelle'}
          </button>

          <div className="rounded-[1.35rem] bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Ville selectionnee
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {city || 'Choisissez d abord une ville'}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              {address || 'Ajoutez ensuite le quartier ou l adresse precise.'}
            </p>
          </div>

          <div className="grid gap-3">
            <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Latitude
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {latitude || safeMarkerPosition.lat.toFixed(6)}
              </p>
            </div>

            <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Longitude
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {longitude || safeMarkerPosition.lng.toFixed(6)}
              </p>
            </div>
          </div>

          {lastResolvedQuery ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Requete interpretee: <strong>{lastResolvedQuery}</strong>
            </div>
          ) : null}

          <input type="hidden" name="latitude" value={latitude || safeMarkerPosition.lat.toFixed(6)} readOnly />
          <input type="hidden" name="longitude" value={longitude || safeMarkerPosition.lng.toFixed(6)} readOnly />

          {resolvedError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {resolvedError}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              Le marker rouge represente la position exacte qui sera sauvegardee avec l annonce.
            </div>
          )}
        </div>
      </div>

      <p className="inline-flex items-center gap-2 text-xs text-slate-500">
        <MapPin className="h-3.5 w-3.5 text-orange-500" />
        La carte se recentre automatiquement sur la ville choisie.
      </p>
    </div>
  )
}
