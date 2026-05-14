import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import ServiceCard from '../components/ServiceCard'
import { useMarketplace } from '../context/MarketplaceContext'

export default function FavoritesPage() {
  const navigate = useNavigate()
  const {
    currentUser,
    services,
    favorites,
    toggleFavorite,
    getWhatsAppLink,
    selectService,
  } = useMarketplace()

  // Visiteur -> redirection vers login
  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  const favoriteServices = services.filter((s) => favorites.includes(s.id))

  function handleSelect(service) {
    selectService(service)
    navigate(`/categories/${service.service_type}`)
  }

  return (
    <div className="home-page">
      <section
        className="category-banner"
        style={{ background: '#fff0eb', color: '#c2410c' }}
      >
        <div className="category-banner-inner">
          <Heart size={48} className="category-banner-icon" />
          <div>
            <h1>Mes favoris</h1>
            <p>
              Bonjour {currentUser.name}, voici les annonces que tu as
              ajoutees a tes favoris.
            </p>
          </div>
        </div>
      </section>

      <section className="listings-section">
        <div className="section-head">
          <h2>Annonces sauvegardees</h2>
          <span className="result-count">
            {favoriteServices.length} annonce(s)
          </span>
        </div>

        {favoriteServices.length === 0 ? (
          <div className="empty-state">
            <h3>Aucune annonce dans tes favoris</h3>
            <p>
              Parcours les annonces et clique sur le coeur pour les
              sauvegarder ici.
            </p>
            <div className="empty-cta">
              <Link to="/" className="publish-button">
                Voir les annonces
              </Link>
            </div>
          </div>
        ) : (
          <div className="listings-grid">
            {favoriteServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                isFavorite
                isActive={false}
                onSelect={handleSelect}
                onToggleFavorite={toggleFavorite}
                whatsappLink={getWhatsAppLink(service)}
                canFavorite
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
