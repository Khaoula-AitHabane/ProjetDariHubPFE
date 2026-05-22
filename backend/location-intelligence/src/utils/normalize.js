import { MOROCCO_SYNONYMS } from '../config/moroccoSynonyms.js'

export function normalizeText(value) {
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

export function tokenize(value) {
  return normalizeText(value).split(' ').filter(Boolean)
}

export function normalizeMoroccanQuery(query) {
  const raw = normalizeText(query)
  const tokens = tokenize(raw).map((token) => MOROCCO_SYNONYMS[token] ?? token)
  const normalized = tokens.join(' ').replace(/\s+/g, ' ').trim()

  return {
    raw,
    normalized,
    tokens,
  }
}

export function levenshtein(left, right) {
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

export function isFuzzyMatch(input, candidate) {
  const left = normalizeText(input)
  const right = normalizeText(candidate)

  if (!left || !right) {
    return false
  }

  if (left.includes(right) || right.includes(left)) {
    return true
  }

  const distance = levenshtein(left, right)
  const tolerance = right.length <= 5 ? 1 : right.length <= 10 ? 2 : 3
  return distance <= tolerance
}
