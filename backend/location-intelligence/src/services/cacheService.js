const QUERY_CACHE_TTL_MS = 1000 * 60 * 30
const MAX_QUERY_ENTRIES = 300

const queryCache = new Map()

function now() {
  return Date.now()
}

function cleanupExpiredEntries() {
  const currentTime = now()

  for (const [key, value] of queryCache.entries()) {
    if (value.expiresAt <= currentTime) {
      queryCache.delete(key)
    }
  }

  while (queryCache.size > MAX_QUERY_ENTRIES) {
    const firstKey = queryCache.keys().next().value
    queryCache.delete(firstKey)
  }
}

export function buildCacheKey(query) {
  return String(query ?? '').trim().toLowerCase()
}

export function getCachedQueryResults(query) {
  cleanupExpiredEntries()
  const cacheKey = buildCacheKey(query)
  const entry = queryCache.get(cacheKey)

  if (!entry) {
    return null
  }

  if (entry.expiresAt <= now()) {
    queryCache.delete(cacheKey)
    return null
  }

  return entry.results
}

export function setCachedQueryResults(query, results) {
  cleanupExpiredEntries()
  const cacheKey = buildCacheKey(query)
  queryCache.set(cacheKey, {
    results,
    expiresAt: now() + QUERY_CACHE_TTL_MS,
  })
}
