const CACHE_STORAGE_KEY = 'darihub-location-cache-v1'
const MAX_QUERY_CACHE = 120
const MAX_LOCATION_CACHE = 300

const inMemoryState = {
  queries: new Map(),
  locations: new Map(),
}

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function safeReadStorage() {
  try {
    const raw = window.localStorage.getItem(CACHE_STORAGE_KEY)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

function safeWriteStorage() {
  try {
    const payload = {
      queries: Array.from(inMemoryState.queries.entries()),
      locations: Array.from(inMemoryState.locations.entries()),
    }

    window.localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Cache persistence should never block the UX.
  }
}

function ensureLoaded() {
  if (inMemoryState.queries.size > 0 || inMemoryState.locations.size > 0) {
    return
  }

  const saved = safeReadStorage()
  if (!saved) {
    return
  }

  inMemoryState.queries = new Map(saved.queries ?? [])
  inMemoryState.locations = new Map(saved.locations ?? [])
}

function trimMap(map, maxEntries) {
  while (map.size > maxEntries) {
    const firstKey = map.keys().next().value
    map.delete(firstKey)
  }
}

function makeLocationKey(location) {
  const label = normalizeText(location.label)
  const lat = Number(location.lat ?? 0).toFixed(6)
  const lng = Number(location.lng ?? 0).toFixed(6)
  return `${label}|${lat}|${lng}`
}

function sortByPopularity(items) {
  return [...items].sort((left, right) => {
    if ((right.searchCount ?? 0) !== (left.searchCount ?? 0)) {
      return (right.searchCount ?? 0) - (left.searchCount ?? 0)
    }

    return (right.lastSeenAt ?? 0) - (left.lastSeenAt ?? 0)
  })
}

export function getCachedSuggestions(query, city = '', limit = 6) {
  ensureLoaded()

  const normalizedQuery = normalizeText(query)
  const normalizedCity = normalizeText(city)
  if (!normalizedQuery) {
    return []
  }

  const exactQueryEntry = inMemoryState.queries.get(`${normalizedQuery}|${normalizedCity}`)
  if (exactQueryEntry?.results?.length) {
    return exactQueryEntry.results.slice(0, limit)
  }

  const popularMatches = sortByPopularity(inMemoryState.locations.values()).filter((item) => {
    const label = normalizeText(item.label)
    const cityLabel = normalizeText(item.city)
    return (
      label.includes(normalizedQuery) &&
      (!normalizedCity || cityLabel.includes(normalizedCity) || label.includes(normalizedCity))
    )
  })

  return popularMatches.slice(0, limit)
}

export function rememberSuggestions(query, city = '', suggestions = []) {
  ensureLoaded()

  const normalizedQuery = normalizeText(query)
  const normalizedCity = normalizeText(city)
  if (!normalizedQuery || suggestions.length === 0) {
    return
  }

  const now = Date.now()
  const normalizedSuggestions = suggestions.map((item) => ({
    ...item,
    lastSeenAt: now,
    searchCount: item.searchCount ?? 0,
  }))

  inMemoryState.queries.set(`${normalizedQuery}|${normalizedCity}`, {
    results: normalizedSuggestions,
    lastSeenAt: now,
  })
  trimMap(inMemoryState.queries, MAX_QUERY_CACHE)

  normalizedSuggestions.forEach((item) => {
    const key = makeLocationKey(item)
    const current = inMemoryState.locations.get(key)
    inMemoryState.locations.set(key, {
      ...current,
      ...item,
      searchCount: current?.searchCount ?? item.searchCount ?? 0,
      lastSeenAt: now,
    })
  })
  trimMap(inMemoryState.locations, MAX_LOCATION_CACHE)

  safeWriteStorage()
}

export function bumpSuggestionPopularity(location) {
  ensureLoaded()

  const key = makeLocationKey(location)
  const current = inMemoryState.locations.get(key)
  const now = Date.now()

  inMemoryState.locations.set(key, {
    ...current,
    ...location,
    searchCount: (current?.searchCount ?? 0) + 1,
    lastSeenAt: now,
  })

  safeWriteStorage()
}

export function getPopularSuggestions(limit = 6) {
  ensureLoaded()
  return sortByPopularity(inMemoryState.locations.values()).slice(0, limit)
}
