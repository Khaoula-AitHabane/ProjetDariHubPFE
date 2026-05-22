import axiosClient, { withAuth } from './axiosClient'

export async function fetchAdminDashboard(token) {
  const response = await axiosClient.get('/api/admin/dashboard', withAuth(token))
  return response.data.data
}

export async function fetchAdminStatistics(token) {
  const response = await axiosClient.get('/api/admin/statistics', withAuth(token))
  return response.data.data
}

export async function fetchAnnonces(token, params = {}) {
  const response = await axiosClient.get(
    '/api/admin/annonces',
    withAuth(token, { params }),
  )
  return response.data
}

export async function fetchPendingAnnonces(token, params = {}) {
  const response = await axiosClient.get(
    '/api/admin/annonces/pending',
    withAuth(token, { params }),
  )
  return response.data
}

export async function acceptAnnonce(token, annonceId) {
  const response = await axiosClient.put(
    `/api/admin/annonces/${annonceId}/accept`,
    {},
    withAuth(token),
  )
  return response.data
}

export async function refuseAnnonce(token, annonceId) {
  const response = await axiosClient.put(
    `/api/admin/annonces/${annonceId}/refuse`,
    {},
    withAuth(token),
  )
  return response.data
}

export async function deleteAnnonce(token, annonceId) {
  const response = await axiosClient.delete(
    `/api/admin/annonces/${annonceId}`,
    withAuth(token),
  )
  return response.data
}

export async function fetchUsers(token, params = {}) {
  const response = await axiosClient.get(
    '/api/admin/users',
    withAuth(token, { params }),
  )
  return response.data
}

export async function blockUser(token, userId) {
  const response = await axiosClient.put(
    `/api/admin/users/${userId}/block`,
    {},
    withAuth(token),
  )
  return response.data
}

export async function unblockUser(token, userId) {
  const response = await axiosClient.put(
    `/api/admin/users/${userId}/unblock`,
    {},
    withAuth(token),
  )
  return response.data
}

export async function deleteUser(token, userId) {
  const response = await axiosClient.delete(
    `/api/admin/users/${userId}`,
    withAuth(token),
  )
  return response.data
}

export async function fetchReports(token, params = {}) {
  const response = await axiosClient.get(
    '/api/admin/reports',
    withAuth(token, { params }),
  )
  return response.data
}

export async function ignoreReport(token, reportId) {
  const response = await axiosClient.put(
    `/api/admin/reports/${reportId}/ignore`,
    {},
    withAuth(token),
  )
  return response.data
}
