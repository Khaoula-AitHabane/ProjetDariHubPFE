export const MOROCCO_CENTER = { lat: 33.5731, lng: -7.5898 }

export const CITY_COORDS = {
  Casablanca: { lat: 33.5731, lng: -7.5898 },
  Rabat: { lat: 34.0209, lng: -6.8416 },
  Marrakech: { lat: 31.6295, lng: -7.9811 },
  Fes: { lat: 34.0333, lng: -5.0 },
  'Fès': { lat: 34.0333, lng: -5.0 },
  Tanger: { lat: 35.7595, lng: -5.834 },
  Agadir: { lat: 30.4278, lng: -9.5981 },
  Meknes: { lat: 33.8731, lng: -5.5407 },
  'Meknès': { lat: 33.8731, lng: -5.5407 },
  Oujda: { lat: 34.6867, lng: -1.9114 },
  Kenitra: { lat: 34.261, lng: -6.5802 },
  'Kénitra': { lat: 34.261, lng: -6.5802 },
  Tetouan: { lat: 35.5785, lng: -5.3684 },
  'Tétouan': { lat: 35.5785, lng: -5.3684 },
  Safi: { lat: 32.2994, lng: -9.2372 },
  'El Jadida': { lat: 33.2316, lng: -8.5007 },
  'Beni Mellal': { lat: 32.3373, lng: -6.3498 },
  'Béni Mellal': { lat: 32.3373, lng: -6.3498 },
  Settat: { lat: 33.0019, lng: -7.6189 },
  Nador: { lat: 35.1681, lng: -2.9287 },
  Mohammedia: { lat: 33.6861, lng: -7.3836 },
  Laayoune: { lat: 27.1536, lng: -13.2033 },
  'Laâyoune': { lat: 27.1536, lng: -13.2033 },
}

export function getListingImages(imageValue, fallbackSeed = 'listing') {
  const fallback = `https://picsum.photos/seed/${fallbackSeed}/1200/800`

  if (!imageValue) {
    return [fallback]
  }

  if (Array.isArray(imageValue)) {
    const images = imageValue.filter(Boolean)
    return images.length > 0 ? images : [fallback]
  }

  if (typeof imageValue !== 'string') {
    return [fallback]
  }

  try {
    const parsed = JSON.parse(imageValue)
    if (Array.isArray(parsed)) {
      const images = parsed.filter(Boolean)
      return images.length > 0 ? images : [fallback]
    }
  } catch {
    // Treat as plain image URL.
  }

  return [imageValue].filter(Boolean)
}

export function getCityCoordinates(city) {
  if (!city) {
    return null
  }

  const query = String(city).trim().toLowerCase()
  const match = Object.entries(CITY_COORDS).find(([name]) => {
    const normalized = name.toLowerCase()
    return normalized.includes(query) || query.includes(normalized)
  })

  return match?.[1] ?? null
}

export function getListingCoordinates(listing) {
  if (!listing) {
    return MOROCCO_CENTER
  }

  const latitude = Number(listing.latitude)
  const longitude = Number(listing.longitude)

  if (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude !== 0 &&
    longitude !== 0
  ) {
    return { lat: latitude, lng: longitude }
  }

  return getCityCoordinates(listing.location_city) ?? MOROCCO_CENTER
}

export function getGoogleMapsEmbedUrl(coords) {
  return `https://www.google.com/maps?q=${coords.lat},${coords.lng}&z=15&output=embed`
}

export function getGoogleMapsUrl(coords) {
  return `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`
}

export function formatListingDate(value) {
  if (!value) {
    return 'Date indisponible'
  }

  return new Intl.DateTimeFormat('fr-MA', {
    dateStyle: 'long',
  }).format(new Date(value))
}
