import axios from 'axios'
import { API_BASE_URL } from '../../lib/marketplace'

const axiosClient = axios.create({
  baseURL: API_BASE_URL || undefined,
  timeout: 60000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

// Automatic retry interceptor for timeout and network errors
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config

    // Only retry on timeout or network errors, up to 3 attempts
    if (
      (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') &&
      (!config._retryCount || config._retryCount < 3)
    ) {
      config._retryCount = (config._retryCount || 0) + 1

      // Wait before retrying (1s, 2s, 3s)
      await new Promise((resolve) => setTimeout(resolve, config._retryCount * 1000))

      return axiosClient(config)
    }

    return Promise.reject(error)
  },
)

export function withAuth(token, options = {}) {
  return {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  }
}

export function getApiErrorMessage(error, fallback = 'Une erreur est survenue.') {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED') {
      return fallback
    }

    if (error.code === 'ERR_NETWORK') {
      return fallback
    }

    return error.response?.data?.message ?? error.message ?? fallback
  }

  return error instanceof Error ? error.message : fallback
}

export default axiosClient
