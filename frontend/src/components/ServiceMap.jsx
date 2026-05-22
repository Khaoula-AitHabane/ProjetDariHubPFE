import { useMemo } from 'react'
import { MapPin } from 'lucide-react'

const MOROCCO_CENTER = { lat: 33.5731, lng: -7.5898 }

// Simple city → coordinates lookup for Moroccan cities (no geocoding API needed)
const CITY_COORDS = {
  'Casablanca': { lat: 33.5731, lng: -7.5898 },
  'Rabat': { lat: 34.0209, lng: -6.8416 },
  'Marrakech': { lat: 31.6295, lng: -7.9811 },
  'Fès': { lat: 34.0333, lng: -5.0000 },
  'Fes': { lat: 34.0333, lng: -5.0000 },
  'Tanger': { lat: 35.7595, lng: -5.8340 },
  'Agadir': { lat: 30.4278, lng: -9.5981 },
  'Meknès': { lat: 33.8731, lng: -5.5407 },
  'Meknes': { lat: 33.8731, lng: -5.5407 },
  'Oujda': { lat: 34.6867, lng: -1.9114 },
  'Kenitra': { lat: 34.2610, lng: -6.5802 },
  'Tetouan': { lat: 35.5785, lng: -5.3684 },
  'Safi': { lat: 32.2994, lng: -9.2372 },
  'El Jadida': { lat: 33.2316, lng: -8.5007 },
  'Béni Mellal': { lat: 32.3373, lng: -6.3498 },
  'Beni Mellal': { lat: 32.3373, lng: -6.3498 },
  'Nador': { lat: 35.1681, lng: -2.9287 },
  'Settat': { lat: 33.0019, lng: -7.6189 },
  'Khouribga': { lat: 32.8811, lng: -6.9063 },
  'Mohammedia': { lat: 33.6861, lng: -7.3836 },
  'Laayoune': { lat: 27.1536, lng: -13.2033 },
  'Laâyoune': { lat: 27.1536, lng: -13.2033 },
}

function getCoordsForService(service) {
  if (!service) return null

  // Support local coordinates if available from DB
  if (service.latitude && service.longitude) {
    return { lat: Number(service.latitude), lng: Number(service.longitude) }
  }

  const city = service.location_city ?? ''
  const match = Object.keys(CITY_COORDS).find(
    (k) => city.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(city.toLowerCase())
  )
  return match ? CITY_COORDS[match] : MOROCCO_CENTER
}

export default function ServiceMap({ service }) {
  const center = useMemo(() => getCoordsForService(service) ?? MOROCCO_CENTER, [service])

  // Calculate bounding box for the OpenStreetMap iframe embed
  const delta = 0.01 // Approximate zoom level
  const bbox = useMemo(() => {
    return `${center.lng - delta}%2C${center.lat - delta}%2C${center.lng + delta}%2C${center.lat + delta}`
  }, [center])

  // OpenStreetMap embed URL with marker at coordinates
  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${center.lat}%2C${center.lng}`

  return (
    <div className="service-map-wrapper w-full mt-4">
      <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
        <iframe
          title="OpenStreetMap Location"
          width="100%"
          height="220"
          style={{ border: 0, display: 'block' }}
          src={embedUrl}
          allowFullScreen
        ></iframe>
      </div>
      {service?.location_address && (
        <p className="map-address mt-2 text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
          <MapPin size={14} className="text-slate-400 dark:text-slate-500" />
          {service.location_address}
        </p>
      )}
    </div>
  )
}
