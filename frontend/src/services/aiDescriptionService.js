import axios from 'axios'
import { API_BASE_URL } from '../lib/marketplace'

export const AI_STYLE_OPTIONS = [
  {
    value: 'professional',
    label: 'Professionnel',
    description: 'Ton standard, clair et rassurant pour une annonce bien structuree.',
  },
  {
    value: 'premium',
    label: 'Premium',
    description: 'Style plus haut de gamme, oriente marketing et valorisation.',
  },
  {
    value: 'short',
    label: 'Court',
    description: 'Version concise et impactante de 50 a 70 mots environ.',
  },
]

const aiDescriptionClient = axios.create({
  baseURL: API_BASE_URL || undefined,
  timeout: 30000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

function withAuth(token) {
  return token
    ? {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    : {}
}

async function postAiDescription(path, token, payload) {
  const response = await aiDescriptionClient.post(
    path,
    payload,
    withAuth(token),
  )

  return response.data
}

export async function generateListingDescription(token, payload) {
  return postAiDescription('/api/ai/generate-description', token, payload)
}

export async function regenerateListingDescription(token, payload) {
  return postAiDescription('/api/ai/regenerate-description', token, payload)
}

export function getAiDescriptionErrorMessage(error) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 429) {
      return error.response?.data?.message ?? 'Trop de generations IA en peu de temps. Merci de patienter une minute.'
    }

    if (error.code === 'ECONNABORTED') {
      return 'La generation IA prend trop de temps. Reessaie dans quelques instants.'
    }

    if (error.code === 'ERR_NETWORK') {
      return 'Impossible de joindre l API Laravel. Verifie que le backend tourne bien.'
    }

    return error.response?.data?.message ?? error.message ?? 'Generation IA indisponible.'
  }

  return error instanceof Error ? error.message : 'Generation IA indisponible.'
}
