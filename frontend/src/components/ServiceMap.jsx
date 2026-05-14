import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api'
import { useMemo } from 'react'
import { MapPin } from 'lucide-react'

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY ?? ''

const MAP_CONTAINER_STYLE = {
  width: '100%',
  height: '220px',
  borderRadius: '8px',
}

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
}

function getCoordsForService(service) {
  if (!service) return null
  const city = service.location_city ?? ''
  const match = Object.keys(CITY_COORDS).find(
    (k) => city.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(city.toLowerCase())
  )
  return match ? CITY_COORDS[match] : MOROCCO_CENTER
}

export default function ServiceMap({ service }) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_KEY,
  })

  const center = useMemo(() => getCoordsForService(service) ?? MOROCCO_CENTER, [service])

  if (!GOOGLE_MAPS_KEY) {
    return (
      <div className="map-placeholder">
        <MapPin size={24} style={{marginBottom:'8px'}} />
        <p>{service?.location_address || service?.location_city || 'Localisation non disponible'}</p>
        <small>Clé Google Maps non configurée — ajoutez VITE_GOOGLE_MAPS_KEY dans .env</small>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="map-placeholder">
        <MapPin size={24} style={{marginBottom:'8px'}} />
        <p>{service?.location_city}</p>
        <small>Impossible de charger la carte</small>
      </div>
    )
  }

  if (!isLoaded) {
    return <div className="map-loading">Chargement de la carte…</div>
  }

  return (
    <div className="service-map-wrapper">
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={center}
        zoom={13}
        options={{
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          styles: [
            { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
          ],
        }}
      >
        <Marker
          position={center}
          title={service?.title ?? 'Annonce'}
        />
      </GoogleMap>
      {service?.location_address && (
        <p className="map-address" style={{display:'flex', alignItems:'center', gap:'4px'}}>
          <MapPin size={14} /> {service.location_address}
        </p>
      )}
    </div>
  )
}
