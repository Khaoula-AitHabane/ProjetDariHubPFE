import { useEffect, useMemo, useState } from 'react'
import {
  SMART_LOCATION_DICTIONARY,
  SMART_LOCATION_SUGGESTIONS,
} from '../data/smartLocationDictionary'
import {
  getPopularSuggestions,
} from '../services/locationCache'
import {
  rememberSelectedLocation,
  searchLocationSuggestions,
} from '../services/geocodingService'

const DEFAULT_DEBOUNCE_MS = 250

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/3/g, 'a')
    .replace(/7/g, 'h')
    .replace(/9/g, 'q')
    .replace(/5/g, 'kh')
    .replace(/2/g, 'a')
    .replace(/[^a-z0-9\u0600-\u06ff\s']/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function levenshtein(left, right) {
  const a = normalizeText(left)
  const b = normalizeText(right)

  if (!a.length) return b.length
  if (!b.length) return a.length

  const matrix = Array.from({ length: b.length + 1 }, () => [])
  for (let i = 0; i <= b.length; i += 1) matrix[i][0] = i
  for (let j = 0; j <= a.length; j += 1) matrix[0][j] = j

  for (let i = 1; i <= b.length; i += 1) {
    for (let j = 1; j <= a.length; j += 1) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      )
    }
  }

  return matrix[b.length][a.length]
}

function isFuzzyMatch(input, candidate) {
  const left = normalizeText(input)
  const right = normalizeText(candidate)

  if (!left || !right) {
    return false
  }

  if (right.includes(left) || left.includes(right)) {
    return true
  }

  const distance = levenshtein(left, right)
  const tolerance = right.length <= 5 ? 1 : right.length <= 10 ? 2 : 3
  return distance <= tolerance
}

function replaceDictionaryTerms(query) {
  let result = ` ${normalizeText(query)} `

  SMART_LOCATION_DICTIONARY.tokenReplacements.forEach(({ aliases, replacement }) => {
    aliases.forEach((alias) => {
      const escaped = normalizeText(alias).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      result = result.replace(new RegExp(`\\b${escaped}\\b`, 'g'), ` ${normalizeText(replacement)} `)
    })
  })

  return result.replace(/\s+/g, ' ').trim()
}

function humanizeText(value) {
  return value
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function resolveCity(query, fallbackCity = '') {
  const normalized = normalizeText(query)
  const explicitCity = Object.entries(SMART_LOCATION_DICTIONARY.cityAliases).find(([, aliases]) =>
    aliases.some((alias) => normalized.includes(normalizeText(alias))),
  )

  return explicitCity?.[0] ?? fallbackCity ?? ''
}

function resolveLandmark(query, city) {
  const normalizedQuery = normalizeText(query)
  const normalizedCity = normalizeText(city)

  const match = SMART_LOCATION_DICTIONARY.landmarks.find((entry) => {
    const cityOkay = !normalizedCity || normalizeText(entry.city).includes(normalizedCity)
    return cityOkay && entry.aliases.some((alias) => isFuzzyMatch(normalizedQuery, alias))
  })

  return match?.canonical ?? null
}

export function buildSmartLocationQuery(rawQuery, fallbackCity = '') {
  const cleanedQuery = replaceDictionaryTerms(rawQuery)
  const resolvedCity = resolveCity(cleanedQuery, fallbackCity)
  const resolvedLandmark = resolveLandmark(cleanedQuery, resolvedCity)
  const finalQuery = resolvedLandmark
    ? resolvedLandmark
    : [humanizeText(cleanedQuery), resolvedCity].filter(Boolean).join(', ')

  return {
    rawQuery,
    cleanedQuery,
    resolvedCity,
    resolvedLandmark,
    finalQuery: finalQuery.trim(),
  }
}

function buildStaticSuggestions(query, city) {
  const normalizedQuery = normalizeText(query)
  const normalizedCity = normalizeText(city)

  if (!normalizedQuery) {
    return [
      ...SMART_LOCATION_SUGGESTIONS,
      ...getPopularSuggestions(6).map((item) => item.label),
    ].slice(0, 6)
  }

  const candidates = [
    ...SMART_LOCATION_SUGGESTIONS,
    ...SMART_LOCATION_DICTIONARY.landmarks.map((entry) => entry.canonical),
    ...getPopularSuggestions(10).map((item) => item.label),
  ]

  return [...new Set(candidates)]
    .filter((candidate) => {
      const normalizedCandidate = normalizeText(candidate)
      const cityOkay = !normalizedCity || normalizedCandidate.includes(normalizedCity)
      return cityOkay && (
        normalizedCandidate.includes(normalizedQuery) ||
        isFuzzyMatch(normalizedQuery, normalizedCandidate)
      )
    })
    .slice(0, 8)
}

export default function useSmartLocationSearch({
  city = '',
  initialQuery = '',
  debounceMs = DEFAULT_DEBOUNCE_MS,
  onResolved,
} = {}) {
  const [query, setQuery] = useState(initialQuery)
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastResolvedQuery, setLastResolvedQuery] = useState('')

  const smartQuery = useMemo(
    () => buildSmartLocationQuery(query, city),
    [query, city],
  )

  useEffect(() => {
    setQuery(initialQuery)
  }, [initialQuery])

  useEffect(() => {
    const trimmed = query.trim()

    if (!trimmed) {
      setSuggestions(
        buildStaticSuggestions('', city).map((label) => ({
          id: label,
          label,
          source: 'local',
        })),
      )
      setLoading(false)
      setError('')
      return undefined
    }

    let cancelled = false
    const timeoutId = window.setTimeout(async () => {
      setLoading(true)
      setError('')

      try {
        const response = await searchLocationSuggestions(smartQuery.finalQuery || trimmed, {
          city: smartQuery.resolvedCity || city,
          limit: 8,
        })

        if (cancelled) {
          return
        }

        if (response.suggestions.length > 0) {
          setSuggestions(response.suggestions)
        } else {
          setSuggestions(
            buildStaticSuggestions(trimmed, city).map((label) => ({
              id: label,
              label,
              source: 'local',
            })),
          )
          setError('Aucune suggestion precise trouvee pour le moment.')
        }
      } catch {
        if (!cancelled) {
          setSuggestions(
            buildStaticSuggestions(trimmed, city).map((label) => ({
              id: label,
              label,
              source: 'local',
            })),
          )
          setError('Recherche distante indisponible. Suggestions locales affichees.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }, debounceMs)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [city, debounceMs, query, smartQuery.finalQuery, smartQuery.resolvedCity])

  async function search(manualQuery = query) {
    const trimmed = manualQuery.trim()
    if (!trimmed) {
      setError('Saisissez une localisation.')
      return null
    }

    setLoading(true)
    setError('')

    try {
      const nextSmartQuery = buildSmartLocationQuery(trimmed, city)
      const response = await searchLocationSuggestions(nextSmartQuery.finalQuery || trimmed, {
        city: nextSmartQuery.resolvedCity || city,
        limit: 8,
      })

      if (response.suggestions.length === 0) {
        setError('Aucun resultat trouve pour cette localisation.')
        return null
      }

      const bestMatch = response.suggestions[0]
      setSuggestions(response.suggestions)
      setLastResolvedQuery(nextSmartQuery.finalQuery || trimmed)
      rememberSelectedLocation(bestMatch)

      const payload = {
        ...bestMatch,
        displayName: bestMatch.label,
        smartQuery: nextSmartQuery,
      }

      onResolved?.(payload)
      return payload
    } catch {
      setError('Recherche intelligente indisponible pour le moment.')
      return null
    } finally {
      setLoading(false)
    }
  }

  function selectSuggestion(suggestion) {
    if (!suggestion) {
      return null
    }

    setQuery(suggestion.label)
    setLastResolvedQuery(suggestion.label)
    rememberSelectedLocation(suggestion)

    const payload = {
      ...suggestion,
      displayName: suggestion.label,
      smartQuery: buildSmartLocationQuery(suggestion.label, city),
    }

    onResolved?.(payload)
    return payload
  }

  return {
    query,
    setQuery,
    suggestions,
    loading,
    error,
    lastResolvedQuery,
    smartQuery,
    search,
    selectSuggestion,
    clearError: () => setError(''),
  }
}
