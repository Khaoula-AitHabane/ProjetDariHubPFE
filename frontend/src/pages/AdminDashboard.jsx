import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { 
  Settings, RefreshCw, Clock, ClipboardList, Users, Check, X, 
  Trash2, MapPin, AlertTriangle, LayoutDashboard, Database, 
  UserCheck, ShieldCheck, Search, Filter, MoreVertical, ExternalLink, Menu 
} from 'lucide-react'
import { useMarketplace } from '../context/MarketplaceContext'
import { apiRequest, formatPrice } from '../lib/marketplace'

const TABS = ['pending', 'all', 'users']
const TAB_LABELS = {
  pending: 'En attente',
  all: 'Toutes les annonces',
  users: 'Utilisateurs',
}

const STATUS_CONFIG = {
  pending: { label: 'En attente', color: '#f59e0b', bg: '#fef3c7' },
  active: { label: 'Publiée', color: '#10b981', bg: '#d1fae5' },
  rejected: { label: 'Refusée', color: '#ef4444', bg: '#fee2e2' },
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
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Redirect non-admin users
  if (!currentUser) return <Navigate to="/login" replace />
  if (currentUser.role !== 'admin') return <Navigate to="/" replace />

  async function loadData() {
    setLoadingData(true)
    setError(null)
    try {
      const [listingsRes, usersRes] = await Promise.all([
        apiRequest('/api/admin/listings?status=all', { token }),
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
        prev.map((l) => l.id === id ? { ...l, status: 'active' } : l)
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

  const pendingListings = listings.filter((l) => l.status === 'pending')
  const displayListings = (activeTab === 'pending' ? pendingListings : listings).filter(l => 
    l.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    l.location_city.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const stats = {
    total: listings.length,
    pending: pendingListings.length,
    active: listings.filter((l) => l.status === 'active').length,
    users: users.length,
  }

  return (
    <div className="admin-layout flex flex-col md:flex-row min-h-screen bg-slate-50">
      {/* Mobile Header for Sidebar Toggle */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200">
        <div className="brand-title font-bold text-xl">
          <span className="text-orange-500">Dari</span><span className="text-blue-600">Hub</span> Admin
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-800">
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)}></div>
      )}

      {/* Sidebar Section */}
      <aside className={`admin-sidebar fixed inset-y-0 left-0 z-50 w-[280px] bg-white border-r border-slate-200 p-6 flex flex-col gap-8 transition-transform transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
        <div className="brand-title hidden md:block" style={{ padding: '0 12px' }}>
          <span className="brand-dari">Dari</span><span className="brand-hub">Hub</span> Admin
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button 
            onClick={() => setActiveTab('pending')}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px',
              border: 'none', background: activeTab === 'pending' ? '#eff6ff' : 'transparent',
              color: activeTab === 'pending' ? '#2563eb' : '#64748b', cursor: 'pointer', fontWeight: '600', textAlign: 'left'
            }}
          >
            <Clock size={20} /> En attente {stats.pending > 0 && <span style={{ marginLeft: 'auto', background: '#f59e0b', color: 'white', padding: '2px 8px', borderRadius: '20px', fontSize: '11px' }}>{stats.pending}</span>}
          </button>
          <button 
            onClick={() => setActiveTab('all')}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px',
              border: 'none', background: activeTab === 'all' ? '#eff6ff' : 'transparent',
              color: activeTab === 'all' ? '#2563eb' : '#64748b', cursor: 'pointer', fontWeight: '600', textAlign: 'left'
            }}
          >
            <Database size={20} /> Annonces
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px',
              border: 'none', background: activeTab === 'users' ? '#eff6ff' : 'transparent',
              color: activeTab === 'users' ? '#2563eb' : '#64748b', cursor: 'pointer', fontWeight: '600', textAlign: 'left'
            }}
          >
            <Users size={20} /> Utilisateurs
          </button>
        </nav>

        <div style={{ marginTop: 'auto', padding: '20px', background: '#f8fafc', borderRadius: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ width: '40px', height: '40px', background: '#2563eb', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyCenter: 'center', fontWeight: 'bold' }}>AD</div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '14px', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser.name}</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Administrateur</div>
            </div>
          </div>
          <button onClick={() => navigate('/')} style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white', cursor: 'pointer', fontSize: '12px' }}>Voir le site</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0 }}>{TAB_LABELS[activeTab]}</h1>
            <p style={{ color: '#64748b', margin: '4px 0 0' }}>Gestion et supervision de la plateforme</p>
          </div>
          <button onClick={loadData} className="btn-connect self-start sm:self-auto" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}>
            <RefreshCw size={18} /> Actualiser
          </button>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
          <StatCard label="Total Annonces" value={stats.total} icon={<ClipboardList />} color="#2563eb" bg="#eff6ff" />
          <StatCard label="En attente" value={stats.pending} icon={<Clock />} color="#f59e0b" bg="#fef3c7" />
          <StatCard label="Publiées" value={stats.active} icon={<Check />} color="#10b981" bg="#d1fae5" />
          <StatCard label="Utilisateurs" value={stats.users} icon={<Users />} color="#8b5cf6" bg="#f5f3ff" />
        </div>

        {/* Filters/Search */}
        <div style={{ background: 'white', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Rechercher une annonce, un lieu..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '12px 12px 12px 48px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }}
            />
          </div>
        </div>

        {/* Content Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-sm">
          {loadingData ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
              <p style={{ color: '#64748b' }}>Chargement des données...</p>
            </div>
          ) : activeTab === 'users' ? (
            <UserTable users={users} />
          ) : (
            <ListingTable 
              listings={displayListings} 
              onApprove={handleApprove} 
              onReject={handleReject} 
              onDelete={handleDelete}
              actionStates={actionStates}
            />
          )}
        </div>
      </main>
    </div>
  )
}

function StatCard({ label, value, icon, color, bg }) {
  return (
    <div style={{ background: 'white', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ color: '#64748b', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>{label}</div>
          <div style={{ fontSize: '28px', fontWeight: '800' }}>{value}</div>
        </div>
        <div style={{ background: bg, color: color, padding: '12px', borderRadius: '12px' }}>
          {icon}
        </div>
      </div>
    </div>
  )
}

function ListingTable({ listings, onApprove, onReject, onDelete, actionStates }) {
  if (listings.length === 0) {
    return <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>Aucune annonce trouvée.</div>
  }

  return (
    <div className="min-w-[800px]">
    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
      <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
        <tr>
          <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '700', color: '#64748b' }}>ANNONCE</th>
          <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '700', color: '#64748b' }}>VILLE</th>
          <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '700', color: '#64748b' }}>PRIX</th>
          <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '700', color: '#64748b' }}>STATUT</th>
          <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '700', color: '#64748b', textAlign: 'right' }}>ACTIONS</th>
        </tr>
      </thead>
      <tbody>
        {listings.map((item) => {
          const config = STATUS_CONFIG[item.status] || STATUS_CONFIG['pending']
          const isBusy = !!actionStates[item.id]
          
          return (
            <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '16px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {item.image_url ? (
                    <img src={item.image_url} alt="" style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '48px', height: '48px', background: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ClipboardList size={20} color="#94a3b8" />
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '15px' }}>{item.title}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>ID: #{item.id}</div>
                  </div>
                </div>
              </td>
              <td style={{ padding: '16px 24px', color: '#64748b', fontSize: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={14} /> {item.location_city}
                </div>
              </td>
              <td style={{ padding: '16px 24px', fontWeight: '700', fontSize: '14px' }}>{formatPrice(item.price)}</td>
              <td style={{ padding: '16px 24px' }}>
                <span style={{ 
                  padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700',
                  color: config.color, background: config.bg
                }}>
                  {config.label}
                </span>
              </td>
              <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  {item.status === 'pending' && (
                    <>
                      <button 
                        onClick={() => onApprove(item.id)} 
                        disabled={isBusy}
                        style={{ padding: '8px', borderRadius: '8px', border: '1px solid #d1fae5', background: '#ecfdf5', color: '#10b981', cursor: 'pointer' }}
                        title="Approuver"
                      >
                        <Check size={18} />
                      </button>
                      <button 
                        onClick={() => onReject(item.id)} 
                        disabled={isBusy}
                        style={{ padding: '8px', borderRadius: '8px', border: '1px solid #fee2e2', background: '#fef2f2', color: '#ef4444', cursor: 'pointer' }}
                        title="Refuser"
                      >
                        <X size={18} />
                      </button>
                    </>
                  )}
                  <button 
                    onClick={() => onDelete(item.id)} 
                    disabled={isBusy}
                    style={{ padding: '8px', borderRadius: '8px', border: '1px solid #f1f5f9', background: 'white', color: '#64748b', cursor: 'pointer' }}
                    title="Supprimer"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
    </div>
  )
}

function UserTable({ users }) {
  return (
    <div className="min-w-[600px]">
    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
      <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
        <tr>
          <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '700', color: '#64748b' }}>UTILISATEUR</th>
          <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '700', color: '#64748b' }}>CONTACT</th>
          <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '700', color: '#64748b' }}>VILLE</th>
          <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '700', color: '#64748b' }}>RÔLE</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
            <td style={{ padding: '16px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', background: '#e0e7ff', color: '#4338ca', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' }}>
                  {(user.name || '?')[0].toUpperCase()}
                </div>
                <div style={{ fontWeight: '600' }}>{user.name}</div>
              </div>
            </td>
            <td style={{ padding: '16px 24px' }}>
              <div style={{ fontSize: '14px' }}>{user.email}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>{user.phone || 'Pas de tél.'}</div>
            </td>
            <td style={{ padding: '16px 24px', color: '#64748b', fontSize: '14px' }}>{user.city}</td>
            <td style={{ padding: '16px 24px' }}>
              <span style={{ 
                padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
                background: user.role === 'admin' ? '#fee2e2' : '#f1f5f9',
                color: user.role === 'admin' ? '#ef4444' : '#64748b',
                textTransform: 'uppercase'
              }}>
                {user.role}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  )
}
