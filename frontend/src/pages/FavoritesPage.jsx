import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Heart, ArrowLeft, Bookmark } from 'lucide-react'
import ServiceCard from '../components/ServiceCard'
import { useMarketplace } from '../context/MarketplaceContext'

export default function FavoritesPage() {
  const navigate = useNavigate()
  const {
    currentUser,
    favorites,
    toggleFavorite,
    getWhatsAppLink,
    selectService,
    favoriteServices, // Utilise la liste déjà filtrée du context
  } = useMarketplace()

  // Visiteur -> redirection vers login
  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  function handleSelect(service) {
    selectService(service)
    navigate(`/categories/${service.service_type}`)
  }

  return (
    <div className="page-shell container-boxed page-padding">
      <div className="favorites-header" style={{ marginBottom: '40px' }}>
        <button onClick={() => navigate(-1)} className="back-btn" style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', cursor: 'pointer', marginBottom: '16px', fontWeight: '600' }}>
          <ArrowLeft size={18} /> Retour
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: '#fef2f2', color: '#ef4444', padding: '12px', borderRadius: '12px' }}>
            <Heart size={32} fill="currentColor" />
          </div>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '800', margin: 0 }}>Mes Favoris</h1>
            <p style={{ color: '#64748b', margin: '4px 0 0' }}>
              Tu as {favoriteServices.length} annonce(s) sauvegardée(s)
            </p>
          </div>
        </div>
      </div>

      {favoriteServices.length === 0 ? (
        <div className="empty-state-card" style={{ 
          background: 'var(--surface)', 
          border: '1px solid var(--border)', 
          borderRadius: '24px', 
          padding: '60px 24px', 
          textAlign: 'center',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ color: '#cbd5e1', marginBottom: '24px' }}>
            <Bookmark size={64} strokeWidth={1} />
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Ta liste est vide</h3>
          <p style={{ color: '#64748b', maxWidth: '400px', margin: '0 auto 32px' }}>
            Parcourez nos catégories Immobilier, Meubles et Services Maison pour trouver des coups de cœur.
          </p>
          <Link to="/" className="btn-connect" style={{ padding: '12px 32px' }}>
            Explorer les annonces
          </Link>
        </div>
      ) : (
        <div className="listings-grid">
          {favoriteServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              isFavorite={true}
              isActive={false}
              onSelect={handleSelect}
              onToggleFavorite={toggleFavorite}
              whatsappLink={getWhatsAppLink(service)}
              canFavorite={true}
            />
          ))}
        </div>
      )}
    </div>
  )
}
