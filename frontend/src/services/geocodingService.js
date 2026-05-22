import axios from 'axios'
import {
  bumpSuggestionPopularity,
  getCachedSuggestions,
  rememberSuggestions,
} from './locationCache'

const GEOAPIFY_API_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY ?? ''
const GEOAPIFY_BASE_URL = 'https://api.geoapify.com/v1/geocode/autocomplete'
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search'

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function buildSearchText(query, city = '') {
  const normalizedQuery = normalizeText(query)
  const normalizedCity = normalizeText(city)

  if (!normalizedCity || normalizedQuery.toLowerCase().includes(normalizedCity.toLowerCase())) {
    return normalizedQuery
  }

  return `${normalizedQuery}, ${normalizedCity}, Maroc`
}

function mapGeoapifyFeature(feature) {
  return {
    id: feature.place_id ?? feature.result_type ?? feature.formatted,
    label: feature.formatted,
    lat: Number(feature.lat),
    lng: Number(feature.lon),
    city: feature.city || feature.county || feature.state || '',
    country: feature.country || 'Morocco',
    source: 'geoapify',
    raw: feature,
  }
}

function mapNominatimFeature(feature) {
  const address = feature.address ?? {}

  return {
    id: feature.place_id ?? feature.osm_id ?? feature.display_name,
    label: feature.display_name,
    lat: Number(feature.lat),
    lng: Number(feature.lon),
    city: address.city || address.town || address.village || address.county || '',
    country: address.country || 'Morocco',
    source: 'nominatim',
    raw: feature,
  }
}

function scoreSuggestion(item, query, city = '') {
  const label = normalizeText(item.label).toLowerCase()
  const normalizedQuery = normalizeText(query).toLowerCase()
  const normalizedCity = normalizeText(city).toLowerCase()
  let score = Number(item.raw?.rank?.confidence ?? item.raw?.importance ?? 0)

  if (normalizedQuery && label.includes(normalizedQuery)) {
    score += 5
  }

  if (normalizedCity && label.includes(normalizedCity)) {
    score += 3
  }

  score += Number(item.searchCount ?? 0)

  return score
}

function dedupeSuggestions(items) {
  const unique = new Map()

  items.forEach((item) => {
    const key = `${normalizeText(item.label)}|${Number(item.lat).toFixed(5)}|${Number(item.lng).toFixed(5)}`
    if (!unique.has(key)) {
      unique.set(key, item)
    }
  })

  return [...unique.values()]
}

async function fetchGeoapifySuggestions(query, city = '', limit = 6) {
  if (!GEOAPIFY_API_KEY.trim()) {
    return []
  }

  const response = await axios.get(GEOAPIFY_BASE_URL, {
    params: {
      text: buildSearchText(query, city),
      format: 'json',
      filter: 'countrycode:ma',
      bias: 'countrycode:ma',
      lang: 'fr',
      limit,
      apiKey: GEOAPIFY_API_KEY,
    },
    timeout: 4000,
  })

  return Array.isArray(response.data?.results)
    ? response.data.results.map(mapGeoapifyFeature)
    : []
}

async function fetchNominatimSuggestions(query, city = '', limit = 6) {
  const response = await axios.get(NOMINATIM_BASE_URL, {
    params: {
      format: 'jsonv2',
      addressdetails: 1,
      countrycodes: 'ma',
      limit,
      q: buildSearchText(query, city),
    },
    timeout: 5000,
    headers: {
      Accept: 'application/json',
    },
  })

  return Array.isArray(response.data)
    ? response.data.map(mapNominatimFeature)
    : []
}

/**
 * We pick Geoapify as the primary API because it has a simple REST autocomplete
 * endpoint, good free-tier ergonomics for prototypes, and geographic bias/filter
 * options that help a lot for Morocco-focused queries.
 *
 * Nominatim stays as the fallback because it is free and resilient when the
 * primary provider is unavailable or returns no suggestions.
 */
export async function searchLocationSuggestions(query, options = {}) {
  const { city = '', limit = 6 } = options

  const localResults = getCachedSuggestions(query, city, limit)
  let primaryResults = []
  let fallbackResults = []

  try {
    primaryResults = await fetchGeoapifySuggestions(query, city, limit)
  } catch {
    primaryResults = []
  }

  if (primaryResults.length === 0) {
    try {
      fallbackResults = await fetchNominatimSuggestions(query, city, limit)
    } catch {
      fallbackResults = []
    }
  }

  const merged = dedupeSuggestions([
    ...localResults,
    ...primaryResults,
    ...fallbackResults,
  ])
    .sort((left, right) => scoreSuggestion(right, query, city) - scoreSuggestion(left, query, city))
    .slice(0, limit)

  if (merged.length > 0) {
    rememberSuggestions(query, city, merged)
  }

  return {
    suggestions: merged,
    source:
      primaryResults.length > 0
        ? 'geoapify'
        : fallbackResults.length > 0
          ? 'nominatim'
          : localResults.length > 0
            ? 'cache'
            : 'none',
  }
}

export function rememberSelectedLocation(location) {
  bumpSuggestionPopularity(location)
}
