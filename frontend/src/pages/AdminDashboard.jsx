import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Settings, RefreshCw, Clock, ClipboardList, Users, Check, X, Trash2, MapPin, AlertTriangle } from 'lucide-react'
import { useMarketplace } from '../context/MarketplaceContext'
import { apiRequest, formatPrice } from '../lib/marketplace'

const TABS = ['pending', 'all', 'users']
const TAB_LABELS = {
  pending: <span style={{display:'flex', alignItems:'center', gap:'6px'}}><Clock size={16}/> En attente d'approbation</span>,
  all: <span style={{display:'flex', alignItems:'center', gap:'6px'}}><ClipboardList size={16}/> Toutes les annonces</span>,
  users: <span style={{display:'flex', alignItems:'center', gap:'6px'}}><Users size={16}/> Utilisateurs</span>,
}

const STATUS_LABELS = {
  pending: { label: 'En attente', cls: 'badge-pending' },
  approved: { label: 'Approuvé', cls: 'badge-approved' },
  rejected: { label: 'Refusé', cls: 'badge-rejected' },
}

export default function AdminDashboard() {
  const { currentUser, token } = useMarketplace()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('pending')
  const [listings, setListings] = useState([])
  const [users, setUsers] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState(null)
  const [actionStates, setActionStates] = useState({})

  // Redirect non-admin users
  if (!currentUser) return <Navigate to="/login" replace />
  if (currentUser.role !== 'admin') return <Navigate to="/" replace />

  async function loadData() {
    setLoadingData(true)
    setError(null)
    try {
      const [listingsRes, usersRes] = await Promise.all([
        apiRequest('/api/admin/listings', { token }),
        apiRequest('/api/admin/users', { token }),
      ])
      setListings(listingsRes.data ?? [])
      setUsers(usersRes.data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement')
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [token])

  async function handleApprove(id) {
    setActionStates((s) => ({ ...s, [id]: 'approving' }))
    try {
      await apiRequest(`/api/admin/listings/${id}/approve`, { method: 'POST', token })
      setListings((prev) =>
        prev.map((l) => l.id === id ? { ...l, status: 'approved' } : l)
      )
    } catch (e) {
      alert('Erreur : ' + (e.message ?? 'Action impossible'))
    } finally {
      setActionStates((s) => ({ ...s, [id]: null }))
    }
  }

  async function handleReject(id) {
    setActionStates((s) => ({ ...s, [id]: 'rejecting' }))
    try {
      await apiRequest(`/api/admin/listings/${id}/reject`, { method: 'POST', token })
      setListings((prev) =>
        prev.map((l) => l.id === id ? { ...l, status: 'rejected' } : l)
      )
    } catch (e) {
      alert('Erreur : ' + (e.message ?? 'Action impossible'))
    } finally {
      setActionStates((s) => ({ ...s, [id]: null }))
    }
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer cette annonce définitivement ?')) return
    setActionStates((s) => ({ ...s, [id]: 'deleting' }))
    try {
      await apiRequest(`/api/admin/listings/${id}`, { method: 'DELETE', token })
      setListings((prev) => prev.filter((l) => l.id !== id))
    } catch (e) {
      alert('Erreur : ' + (e.message ?? 'Suppression impossible'))
    } finally {
      setActionStates((s) => ({ ...s, [id]: null }))
    }
  }

  const pendingListings = listings.filter((l) => !l.status || l.status === 'pending')
  const displayListings = activeTab === 'pending' ? pendingListings : listings

  const stats = {
    total: listings.length,
    pending: pendingListings.length,
    approved: listings.filter((l) => l.status === 'approved').length,
    rejected: listings.filter((l) => l.status === 'rejected').length,
    users: users.length,
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="admin-header">
        <div>
          <h1 className="admin-title" style={{display:'flex', alignItems:'center', gap:'8px'}}><Settings size={28}/> Dashboard Administrateur</h1>
          <p className="admin-subtitle">Gérez les annonces et les utilisateurs</p>
        </div>
        <button className="ghost-button" onClick={loadData} style={{display:'flex', alignItems:'center', gap:'6px'}}><RefreshCw size={14}/> Actualiser</button>
      </div>

      {/* Stats cards */}
      <div className="admin-stats">
        <div className="admin-stat-card stat-total">
          <strong>{stats.total}</strong>
          <span>Total annonces</span>
        </div>
        <div className="admin-stat-card stat-pending">
          <strong>{stats.pending}</strong>
          <span>En attente</span>
        </div>
        <div className="admin-stat-card stat-approved">
          <strong>{stats.approved}</strong>
          <span>Approuvées</span>
        </div>
        <div className="admin-stat-card stat-rejected">
          <strong>{stats.rejected}</strong>
          <span>Refusées</span>
        </div>
        <div className="admin-stat-card stat-users">
          <strong>{stats.users}</strong>
          <span>Utilisateurs</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={activeTab === tab ? 'admin-tab active' : 'admin-tab'}
            onClick={() => setActiveTab(tab)}
          >
            {TAB_LABELS[tab]}
            {tab === 'pending' && stats.pending > 0 && (
              <span className="tab-badge">{stats.pending}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {error && (
        <div className="alert-banner" style={{display:'flex', alignItems:'center'}}>
          <AlertTriangle size={16} style={{marginRight:'6px'}}/> Erreur API : {error}
          <button onClick={loadData} className="ghost-button" style={{ marginLeft: 12 }}>Réessayer</button>
        </div>
      )}

      {loadingData ? (
        <div className="admin-loading">
          <div className="spinner" />
          <p>Chargement des données...</p>
        </div>
      ) : (
        <>
          {/* ── Annonces tab ── */}
          {activeTab !== 'users' && (
            <div className="admin-table-wrap">
              {displayListings.length === 0 ? (
                <div className="empty-state">
                  <h3>{activeTab === 'pending' ? <><Check size={20} style={{marginRight:'8px', verticalAlign:'middle'}}/> Aucune annonce en attente</> : 'Aucune annonce'}</h3>
                  <p>Tout est à jour !</p>
                </div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Annonce</th>
                      <th>Ville</th>
                      <th>Prix</th>
                      <th>Type</th>
                      <th>Statut</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayListings.map((listing) => {
                      const st = STATUS_LABELS[listing.status] ?? STATUS_LABELS['pending']
                      const busy = actionStates[listing.id]
                      return (
                        <tr key={listing.id}>
                          <td>
                            <div className="admin-listing-title">
                              {listing.image_url && (
                                <img
                                  src={listing.image_url}
                                  alt=""
                                  className="admin-listing-thumb"
                                />
                              )}
                              <div>
                                <strong>{listing.title}</strong>
                                <p className="text-muted">{(listing.description ?? '').slice(0, 60)}…</p>
                              </div>
                            </div>
                          </td>
                          <td><MapPin size={14} style={{verticalAlign:'middle', marginRight:'4px'}}/> {listing.location_city}</td>
                          <td className="price-cell">{formatPrice(listing.price)}</td>
                          <td>{listing.service_type}</td>
                          <td>
                            <span className={`status-badge ${st.cls}`}>{st.label}</span>
                          </td>
                          <td>
                            <div className="admin-actions">
                              {(!listing.status || listing.status === 'pending') && (
                                <>
                                  <button
                                    type="button"
                                    className="btn-approve"
                                    onClick={() => handleApprove(listing.id)}
                                    disabled={!!busy}
                                  >
                                    {busy === 'approving' ? '...' : <><Check size={14} style={{verticalAlign:'middle', marginRight:'4px'}}/> Approuver</>}
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-reject"
                                    onClick={() => handleReject(listing.id)}
                                    disabled={!!busy}
                                  >
                                    {busy === 'rejecting' ? '...' : <><X size={14} style={{verticalAlign:'middle', marginRight:'4px'}}/> Refuser</>}
                                  </button>
                                </>
                              )}
                              {listing.status === 'approved' && (
                                <button
                                  type="button"
                                  className="btn-reject"
                                  onClick={() => handleReject(listing.id)}
                                  disabled={!!busy}
                                >
                                  Désapprouver
                                </button>
                              )}
                              {listing.status === 'rejected' && (
                                <button
                                  type="button"
                                  className="btn-approve"
                                  onClick={() => handleApprove(listing.id)}
                                  disabled={!!busy}
                                >
                                  Réapprouver
                                </button>
                              )}
                              <button
                                type="button"
                                className="btn-delete"
                                onClick={() => handleDelete(listing.id)}
                                disabled={!!busy}
                              >
                                {busy === 'deleting' ? '...' : <Trash2 size={16}/>}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ── Utilisateurs tab ── */}
          {activeTab === 'users' && (
            <div className="admin-table-wrap">
              {users.length === 0 ? (
                <div className="empty-state"><h3>Aucun utilisateur</h3></div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Email</th>
                      <th>Téléphone</th>
                      <th>Ville</th>
                      <th>Rôle</th>
                      <th>Inscrit le</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <div className="user-name-cell">
                            <span className="user-avatar-small">
                              {(user.name ?? '?').charAt(0).toUpperCase()}
                            </span>
                            {user.name}
                          </div>
                        </td>
                        <td>{user.email}</td>
                        <td>{user.phone ?? '—'}</td>
                        <td>{user.city ?? '—'}</td>
                        <td>
                          <span className={`role-badge role-${user.role}`}>
                            {user.role}
                          </span>
                        </td>
                        <td>
                          {user.created_at
                            ? new Date(user.created_at).toLocaleDateString('fr-FR')
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
