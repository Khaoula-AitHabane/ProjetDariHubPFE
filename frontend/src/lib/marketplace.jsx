import { Home, Armchair, Wrench } from 'lucide-react'

function resolveApiBaseUrl() {
  const configuredBaseUrl = String(import.meta.env.VITE_API_URL ?? '').trim().replace(/\/$/, '')

  if (configuredBaseUrl) {
    return configuredBaseUrl
  }

  if (typeof window !== 'undefined') {
    const { hostname, protocol } = window.location

    if (hostname === '127.0.0.1' || hostname === 'localhost') {
      return `${protocol}//127.0.0.1:8000`
    }
  }

  return ''
}

export const API_BASE_URL = resolveApiBaseUrl()
export const AUTH_STORAGE_KEY = 'khadamat-dar-auth'
export const FAVORITES_STORAGE_KEY = 'khadamat-dar-favorites'
export const COMMENTS_STORAGE_KEY = 'darsouk-comments'
export const USER_LISTINGS_STORAGE_KEY = 'darsouk-user-listings'
export const SUPPORT_WHATSAPP = '212600000001'

export const serviceTypeConfig = {
  house_rental: {
    label: 'Immobilier',
    title: 'Immobilier',
    description: 'Appartements, villas, maisons et terrains au Maroc.',
    icon: <Home size={40} strokeWidth={1.5} />,
    color: '#e8f1ff',
    accent: '#2c6cf6',
  },
  furniture_rental: {
    label: 'Meubles',
    title: 'Meubles',
    description: 'Salons, chambres, electromenagers et decoration.',
    icon: <Armchair size={40} strokeWidth={1.5} />,
    color: '#fdecec',
    accent: '#e94848',
  },
  home_service: {
    label: 'Services maison',
    title: 'Services maison',
    description: 'Menage, plomberie, electricite, jardinage et bricolage.',
    icon: <Wrench size={40} strokeWidth={1.5} />,
    color: '#e8f8ef',
    accent: '#16a864',
  },
}

export const serviceTypeMenu = Object.entries(serviceTypeConfig).map(([key, value]) => ({
  key,
  ...value,
}))

export const roleLabels = {
  client: 'Client',
  provider: 'Prestataire',
  admin: 'Administrateur',
}

export const billingUnitLabels = {
  per_night: 'par nuit',
  per_day: 'par jour',
  per_service: 'par prestation',
}

export const defaultBillingUnitByType = {
  house_rental: 'per_night',
  furniture_rental: 'per_day',
  home_service: 'per_service',
}

export function getApiUrl(path) {
  return API_BASE_URL ? `${API_BASE_URL}${path}` : path
}

export function formatPrice(price) {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    maximumFractionDigits: 0,
  }).format(Number(price ?? 0))
}

export function formatDate(dateString) {
  if (!dateString) {
    return 'Flexible'
  }

  return new Intl.DateTimeFormat('fr-MA', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(`${dateString}T00:00:00`))
}

export function buildMetaFromServices(services) {
  return {
    cities: [...new Set(services.map((service) => service.location_city))].sort(),
    types: [...new Set(services.map((service) => service.service_type))].sort(),
  }
}

export function sortServicesForDisplay(services) {
  return [...services].sort((left, right) => {
    if (Boolean(left.is_featured) !== Boolean(right.is_featured)) {
      return Number(Boolean(right.is_featured)) - Number(Boolean(left.is_featured))
    }

    if (Number(left.rating ?? 0) !== Number(right.rating ?? 0)) {
      return Number(right.rating ?? 0) - Number(left.rating ?? 0)
    }

    return Number(left.price ?? 0) - Number(right.price ?? 0)
  })
}

export function filterServices(services, { type = 'all', city = 'all', search = '' } = {}) {
  return services.filter((service) => {
    const matchesType = type === 'all' || service.service_type === type
    const matchesCity = city === 'all' || service.location_city === city
    const haystack = [
      service.title,
      service.category,
      service.location_city,
      service.description,
      service.provider?.name,
    ]
      .join(' ')
      .toLowerCase()

    return matchesType && matchesCity && (!search || haystack.includes(search))
  })
}

export function syncOverviewSnapshot(overview, services) {
  return {
    ...overview,
    stats: {
      ...(overview.stats ?? {}),
      services: services.length,
    },
    featuredServices: services.filter((service) => service.is_featured).slice(0, 3),
  }
}

export function readStoredAuth() {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY)

    if (!raw) {
      return { token: '', user: null }
    }

    const parsed = JSON.parse(raw)

    return {
      token: parsed.token ?? '',
      user: parsed.user ?? null,
    }
  } catch {
    return { token: '', user: null }
  }
}

export function saveStoredAuth(token, user) {
  window.localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({ token, user }),
  )
}

export function clearStoredAuth() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY)
}

export function readStoredFavorites() {
  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY)

    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveStoredFavorites(favorites) {
  window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites))
}

export function readStoredComments() {
  try {
    const raw = window.localStorage.getItem(COMMENTS_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function saveStoredComments(commentsByService) {
  window.localStorage.setItem(
    COMMENTS_STORAGE_KEY,
    JSON.stringify(commentsByService),
  )
}

export function readStoredUserListings() {
  try {
    const raw = window.localStorage.getItem(USER_LISTINGS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function slimListingImagesForStorage(listing) {
  if (!listing || typeof listing !== 'object') {
    return listing
  }

  const imageValue = listing.image_url

  if (!imageValue || typeof imageValue !== 'string') {
    return listing
  }

  if (imageValue.startsWith('data:')) {
    return { ...listing, image_url: null }
  }

  try {
    const parsed = JSON.parse(imageValue)

    if (Array.isArray(parsed)) {
      const lightweightImages = parsed.filter(
        (value) => typeof value === 'string' && !value.startsWith('data:'),
      )

      return {
        ...listing,
        image_url:
          lightweightImages.length > 0 ? JSON.stringify(lightweightImages.slice(0, 3)) : null,
      }
    }
  } catch {
    // Keep non-JSON URLs as-is.
  }

  return listing
}

export function saveStoredUserListings(listings) {
  try {
    window.localStorage.setItem(
      USER_LISTINGS_STORAGE_KEY,
      JSON.stringify(listings),
    )
    return true
  } catch (error) {
    if (error?.name !== 'QuotaExceededError') {
      return false
    }

    try {
      const lightweightListings = Array.isArray(listings)
        ? listings.map(slimListingImagesForStorage)
        : []

      window.localStorage.setItem(
        USER_LISTINGS_STORAGE_KEY,
        JSON.stringify(lightweightListings),
      )
      return true
    } catch {
      try {
        window.localStorage.removeItem(USER_LISTINGS_STORAGE_KEY)
      } catch {}

      return false
    }
  }
}

export function normalizeWhatsAppPhone(phone) {
  const digits = String(phone ?? '').replace(/\D/g, '')

  if (!digits) {
    return SUPPORT_WHATSAPP
  }

  if (digits.startsWith('212')) {
    return digits
  }

  if (digits.startsWith('0')) {
    return `212${digits.slice(1)}`
  }

  return digits
}

export function getWhatsAppLink(service) {
  const phone = normalizeWhatsAppPhone(service?.phone || service?.provider?.phone)
  const text = encodeURIComponent(
    `Salam, bghit ma3lomat 3la service: ${service?.title ?? 'Khadamat Dar'}`,
  )

  return `https://wa.me/${phone}?text=${text}`
}

export function getSupportWhatsAppLink() {
  return `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(
    'Salam, bghit n3ref aktar 3la Khadamat Dar',
  )}`
}

export function createEmptyAuthForm() {
  return {
    name: '',
    email: '',
    phone: '',
    city: '',
    role: 'client',
    password: '',
    passwordConfirmation: '',
  }
}

export function createBookingForm(user = null, service = null) {
  return {
    startDate: '',
    endDate: '',
    quantity: 1,
    paymentMethod: 'cash',
    serviceAddress: service?.location_address ?? user?.address ?? '',
    notes: '',
  }
}

export function createEmptyPublishForm(user = null) {
  return {
    title: '',
    serviceType: 'home_service',
    category: '',
    city: user?.city ?? '',
    address: user?.address ?? '',
    price: '',
    billingUnit: 'per_service',
    capacity: '',
    durationLabel: '',
    description: '',
    features: '',
    imageUrl: '',
  }
}

export async function apiRequest(path, { method = 'GET', token = '', body } = {}) {
  const response = await fetch(getApiUrl(path), {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message ?? `Request failed with status ${response.status}`)
  }

  return data
}
