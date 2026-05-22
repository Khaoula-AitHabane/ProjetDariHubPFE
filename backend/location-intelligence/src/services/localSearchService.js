import { MOROCCO_CITY_KEYWORDS } from '../config/moroccoSynonyms.js'
import { MOROCCO_LOCATIONS } from '../data/moroccoLocations.js'
import { isFuzzyMatch, normalizeMoroccanQuery, normalizeText, tokenize } from '../utils/normalize.js'

function scorePopularity(searchCount = 0) {
  if (searchCount >= 5) return 5
  if (searchCount >= 4) return 4
  if (searchCount >= 3) return 3
  if (searchCount >= 2) return 2
  return searchCount > 0 ? 1 : 0
}

function computeResultScore(entry, normalizedQuery) {
  let score = 0
  const queryText = normalizedQuery.normalized
  const tokens = normalizedQuery.tokens.filter((token) => token !== 'pres' && token !== 'de')
  const name = normalizeText(entry.name)
  const city = normalizeText(entry.city)
  const keywords = entry.keywords.map((keyword) => normalizeText(keyword))
  const combined = [name, city, ...keywords].join(' ')
  const specificText = [name, ...keywords].join(' ')

  if (name === queryText) {
    score += 10
  }

  if (entry.type === 'city' && city === queryText) {
    score += 10
  } else if (city === queryText) {
    score += 3
  }

  if (name.includes(queryText)) {
    score += 5
  }

  if (entry.type === 'city' && city.includes(queryText)) {
    score += 5
  } else if (city.includes(queryText)) {
    score += 2
  }

  if (queryText && keywords.some((keyword) => keyword.includes(queryText))) {
    score += 4
  }

  const tokenHits = tokens.reduce((total, token) => {
    if (combined.includes(token)) {
      return total + 1
    }

    if (keywords.some((keyword) => isFuzzyMatch(token, keyword)) || isFuzzyMatch(token, name)) {
      return total + 1
    }

    return total
  }, 0)

  score += tokenHits * 2

  const specificTokenHits = tokens.reduce((total, token) => {
    if (specificText.includes(token)) {
      return total + 1
    }

    if (keywords.some((keyword) => isFuzzyMatch(token, keyword)) || isFuzzyMatch(token, name)) {
      return total + 1
    }

    return total
  }, 0)

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

  if (tokens.some((token) => keywords.some((keyword) => isFuzzyMatch(token, keyword)))) {
    score += 4
  }

  const cityBoost = Object.entries(MOROCCO_CITY_KEYWORDS).find(([cityName, variants]) => {
    const normalizedCityName = normalizeText(cityName)
    return (
      normalizedCityName === city &&
      variants.some((variant) => queryText.includes(normalizeText(variant)))
    )
  })

  if (cityBoost) {
    score += 3
  }

  if (tokens.length > 1 && entry.type === 'city' && specificTokenHits === 0) {
    score -= 6
  }

  if (tokens.length > 1 && entry.type !== 'city' && specificTokenHits > 0) {
    score += 4
  }

  score += scorePopularity(entry.search_count)

  return score
}

function toResult(entry, score, source = 'local') {
  return {
    id: entry.id,
    name: entry.name,
    city: entry.city,
    lat: entry.latitude,
    lng: entry.longitude,
    type: entry.type,
    score,
    source,
    search_count: entry.search_count,
  }
}

export function searchLocalDataset(query, limit = 10) {
  const normalizedQuery = normalizeMoroccanQuery(query)

  const scored = MOROCCO_LOCATIONS.map((entry) => ({
    entry,
    score: computeResultScore(entry, normalizedQuery),
  }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)

  return scored.map(({ entry, score }) => toResult(entry, score, 'local'))
}

export function incrementLocalPopularity(result) {
  const id = Number(result?.id)
  if (!id) {
    return
  }

  const location = MOROCCO_LOCATIONS.find((item) => item.id === id)
  if (location) {
    location.search_count += 1
  }
}
