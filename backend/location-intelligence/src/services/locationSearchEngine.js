import { getCachedQueryResults, setCachedQueryResults } from './cacheService.js'
import { fetchGeoapifyResults, fetchNominatimResults } from './externalGeocodingService.js'
import { incrementLocalPopularity, searchLocalDataset } from './localSearchService.js'
import { isFuzzyMatch, normalizeMoroccanQuery, normalizeText } from '../utils/normalize.js'

function dedupeResults(results) {
  const unique = new Map()

  for (const item of results) {
    const key = `${normalizeText(item.name)}|${Number(item.lat).toFixed(5)}|${Number(item.lng).toFixed(5)}`
    const current = unique.get(key)

    if (!current || (item.score ?? 0) > (current.score ?? 0)) {
      unique.set(key, item)
    }
  }

  return [...unique.values()]
}

function computeMergedScore(result, query) {
  const normalized = normalizeMoroccanQuery(query)
  const queryText = normalized.normalized
  const name = normalizeText(result.name)
  const city = normalizeText(result.city)
  const tokens = normalized.tokens.filter((token) => token !== 'pres' && token !== 'de')
  const combined = `${name} ${city}`
  const specificText = name
  let score = Number(result.score ?? 0)

  if (name === queryText) {
    score += 10
  }

  if (result.type === 'city' && city === queryText) {
    score += 10
  } else if (city === queryText) {
    score += 3
  }

  if (name.includes(queryText)) {
    score += 5
  }

  const tokenHits = tokens.reduce((total, token) => total + (combined.includes(token) ? 1 : 0), 0)
  score += tokenHits * 2

  const specificTokenHits = tokens.reduce((total, token) => total + (specificText.includes(token) ? 1 : 0), 0)
  score += specificTokenHits * 3

  if (tokens.length > 1 && tokenHits === tokens.length) {
    score += 8
  }

  if (tokens.length > 1 && specificTokenHits === tokens.length) {
    score += 10
  }

  if (isFuzzyMatch(queryText, name) || isFuzzyMatch(queryText, city)) {
    score += 4
  }

  if (result.source === 'local') {
    score += 3
  }

  if (result.source === 'cache') {
    score += 2
  }

  if (tokens.length > 1 && result.type === 'city' && specificTokenHits === 0) {
    score -= 6
  }

  if (tokens.length > 1 && result.type !== 'city' && specificTokenHits > 0) {
    score += 4
  }

  return score
}

function sortResults(results, query) {
  return [...results]
    .map((item) => ({
      ...item,
      score: computeMergedScore(item, query),
    }))
    .sort((left, right) => right.score - left.score)
}

function normalizeCacheResults(results) {
  return results.map((item) => ({
    ...item,
    source: item.source === 'local' ? 'cache' : item.source,
  }))
}

export async function searchMoroccoLocations(query, limit = 8) {
  const trimmedQuery = String(query ?? '').trim()
  if (!trimmedQuery) {
    return {
      query: trimmedQuery,
      results: [],
    }
  }

  const cached = getCachedQueryResults(trimmedQuery)
  if (cached?.length) {
    return {
      query: trimmedQuery,
      results: normalizeCacheResults(cached).slice(0, limit),
    }
  }

  const localResults = searchLocalDataset(trimmedQuery, limit)
  let geoapifyResults = []
  let nominatimResults = []

  if (localResults.length < limit) {
    try {
      geoapifyResults = await fetchGeoapifyResults(trimmedQuery, limit)
    } catch {
      geoapifyResults = []
    }
  }

  if (localResults.length + geoapifyResults.length < limit) {
    try {
      nominatimResults = await fetchNominatimResults(trimmedQuery, limit)
    } catch {
      nominatimResults = []
    }
  }

  const merged = sortResults(
    dedupeResults([
      ...localResults,
      ...geoapifyResults,
      ...nominatimResults,
    ]),
    trimmedQuery,
  ).slice(0, limit)

  if (merged.length > 0) {
    setCachedQueryResults(trimmedQuery, merged)
    incrementLocalPopularity(merged[0])
  }

  return {
    query: trimmedQuery,
    results: merged,
  }
}
