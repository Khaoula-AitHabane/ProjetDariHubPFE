import axios from 'axios'
import { normalizeMoroccanQuery, normalizeText } from '../utils/normalize.js'

const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY ?? ''
const GEOAPIFY_URL = 'https://api.geoapify.com/v1/geocode/autocomplete'
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'

function buildSearchText(query) {
  const normalized = normalizeMoroccanQuery(query)
  const finalQuery = normalized.normalized || normalizeText(query)
  return `${finalQuery}, Maroc`
}

function toGeoapifyResult(item) {
  return {
    id: `geoapify-${item.place_id ?? item.formatted}`,
    name: item.formatted,
    city: item.city || item.county || item.state || 'Morocco',
    lat: Number(item.lat),
    lng: Number(item.lon),
    type: item.result_type || 'place',
    score: Number(item.rank?.confidence ?? 0),
    source: 'geoapify',
  }
}

function toNominatimResult(item) {
  return {
    id: `nominatim-${item.place_id ?? item.osm_id ?? item.display_name}`,
    name: item.display_name,
    city: item.address?.city || item.address?.town || item.address?.village || item.address?.county || 'Morocco',
    lat: Number(item.lat),
    lng: Number(item.lon),
    type: item.type || 'place',
    score: Number(item.importance ?? 0),
    source: 'nominatim',
  }
}

export async function fetchGeoapifyResults(query, limit = 5) {
  // Geoapify is the primary provider because its autocomplete endpoint is
  // tuned for typeahead UX and returns structured ranking data quickly.
  if (!GEOAPIFY_API_KEY.trim()) {
    return []
  }

  const response = await axios.get(GEOAPIFY_URL, {
    params: {
      text: buildSearchText(query),
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
    ? response.data.results.map(toGeoapifyResult)
    : []
}

export async function fetchNominatimResults(query, limit = 5) {
  // Nominatim stays as the free resilience layer so the API still works
  // even when the primary provider is missing or temporarily unavailable.
  const response = await axios.get(NOMINATIM_URL, {
    params: {
      q: buildSearchText(query),
      format: 'jsonv2',
      addressdetails: 1,
      countrycodes: 'ma',
      limit,
    },
    timeout: 5000,
    headers: {
      Accept: 'application/json',
      'User-Agent': 'DariHub-Location-Intelligence/1.0',
    },
  })

  return Array.isArray(response.data)
    ? response.data.map(toNominatimResult)
    : []
}
