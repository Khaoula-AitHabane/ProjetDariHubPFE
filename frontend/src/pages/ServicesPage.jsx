import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, MapPin, Star, Search, SlidersHorizontal, X, Phone, Shield, Sparkles, ThumbsUp, Lock } from 'lucide-react'
import PublicAnnonceDetailsModal from '../components/PublicAnnonceDetailsModal'
import { useMarketplace } from '../context/MarketplaceContext'
import { formatPrice } from '../lib/marketplace'

/* ─────────── Service subcategories ─────────── */
const SERVICE_CATS = [
  { id: 'all', label: 'Tous les services' },
  { id: 'electricite', label: 'Électricité' },
  { id: 'plomberie', label: 'Plomberie' },
  { id: 'nettoyage', label: 'Nettoyage' },
  { id: 'jardinage', label: 'Jardinage' },
  { id: 'peinture', label: 'Peinture' },
  { id: 'climatisation', label: 'Climatisation' },
  { id: 'demenagement', label: 'Déménagement' },
  { id: 'autre', label: 'Autre' },
]

/* ─────────── Trust Badges ─────────── */
const TRUST_ITEMS = [
  { icon: <Shield size={28} />, title: 'Annonces vérifiées', desc: 'Des annonces fiables et vérifiées par notre système IA' },
  { icon: <Sparkles size={28} />, title: 'Recherche intelligente', desc: 'Trouvez exactement ce que vous cherchez grâce à l\'IA' },
  { icon: <ThumbsUp size={28} />, title: 'Recommandations', desc: 'Des suggestions personnalisées rien que pour vous' },
  { icon: <Lock size={28} />, title: 'Paiement sécurisé', desc: 'Vos transactions sont protérisées et sécurisées' },
]

/* ─────────── Star Rating Component ─────────── */
function StarRating({ rating = 0, count = 0 }) {
  const stars = Array.from({ length: 5 }, (_, i) => i + 1)
  return (
    <div className="svc-stars">
      {stars.map((s) => (
        <Star
          key={s}
          size={13}
          fill={s <= Math.round(rating) ? '#f59e0b' : 'none'}
          color={s <= Math.round(rating) ? '#f59e0b' : '#d1d5db'}
          strokeWidth={1.5}
        />
      ))}
      <span className="svc-stars-count">({count})</span>
    </div>
  )
}

/* ─────────── Service Card ─────────── */
function ServiceListingCard({ service, isFavorite, onToggleFavorite, currentUser, getWhatsAppLink, onOpenDetails }) {
  const navigate = useNavigate()
  const rating = Number(service.rating ?? 4.0).toFixed(1)
  const reviewsCount = service.reviews_count ?? Math.floor(Math.random() * 60 + 10)
  const wa = getWhatsAppLink(service)

  function handleWA(e) {
    if (!currentUser) {
      e.preventDefault()
      navigate('/login')
    }
  }

  const imageFallback = `https://picsum.photos/seed/${service.id ?? service.title}/400/300`
  const imgSrc = service.image_url || imageFallback

  return (
    <article className="svc-card">
      {/* Image */}
      <div className="svc-card-img-wrap">
        <img
          src={imgSrc}
          alt={service.title}
          className="svc-card-img"
          loading="lazy"
          onError={(e) => { e.target.src = imageFallback }}
        />
        <span className="svc-card-badge">Services</span>
        <button
          type="button"
          className={`svc-fav-btn${isFavorite ? ' active' : ''}`}
          onClick={() => currentUser ? onToggleFavorite(service.id) : navigate('/login')}
          aria-label="Favoris"
        >
          <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} strokeWidth={2} />
        </button>
      </div>

      {/* Body */}
      <div className="svc-card-body">
        <h3 className="svc-card-title">{service.title}</h3>

        <div className="svc-card-meta">
          <span className="svc-card-city">
            <MapPin size={13} /> {service.location_city ?? 'Maroc'}
          </span>
          <StarRating rating={rating} count={reviewsCount} />
        </div>

        <div className="svc-card-footer">
          <div className="svc-card-price">
            À partir de <strong>{formatPrice(service.price ?? 0)}</strong>
          </div>
          <button
            type="button"
            className="svc-details-btn"
            onClick={() => {
              if (service.source_url) {
                window.open(service.source_url, '_blank', 'noopener,noreferrer')
              } else {
                onOpenDetails(service)
              }
            }}
          >
            {service.source_url ? 'Voir sur le site' : 'Détails'}
          </button>
        </div>

        <a
          className="svc-wa-btn"
          href={currentUser ? wa : '#'}
          target={currentUser ? '_blank' : '_self'}
          rel="noreferrer"
          onClick={handleWA}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Contacter (WA) {service.provider?.phone ?? '+212 6 00 00 00 00'}
        </a>
      </div>
    </article>
  )
}

/* ─────────── Main Page ─────────── */
export default function ServicesPage() {
  const navigate = useNavigate()
  const {
    loading,
    apiError,
    meta,
    favorites,
    getWhatsAppLink,
    toggleFavorite,
    currentUser,
    allServices,
  } = useMarketplace()

  const [search, setSearch] = useState('')
  const [city, setCity] = useState('all')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [activeCat, setActiveCat] = useState('all')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [selectedService, setSelectedService] = useState(null)

  // Filter only home_service listings
  const homeServices = useMemo(() => {
    return allServices.filter(s => s.service_type === 'home_service')
  }, [allServices])

  const filtered = useMemo(() => {
    return homeServices.filter((s) => {
      if (city !== 'all' && s.location_city !== city) return false
      const price = Number(s.price ?? 0)
      if (priceMin && price < Number(priceMin)) return false
      if (priceMax && price > Number(priceMax)) return false
      if (activeCat !== 'all') {
        const hay = `${s.category ?? ''} ${s.title ?? ''} ${s.description ?? ''}`.toLowerCase()
        if (!hay.includes(activeCat)) return false
      }
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        const hay = `${s.title ?? ''} ${s.category ?? ''} ${s.description ?? ''} ${s.location_city ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [homeServices, city, priceMin, priceMax, activeCat, search])

  function reset() {
    setSearch(''); setCity('all'); setPriceMin(''); setPriceMax(''); setActiveCat('all')
  }

  return (
    <div className="svc-page">

      {/* ── Hero Banner ── */}
      <section className="svc-hero">
        <div className="svc-hero-overlay" />
        <div className="svc-hero-content">
          <p className="svc-hero-eyebrow">Trouvez ce que vous cherchez</p>
          <h1 className="svc-hero-title">Services Maison</h1>
          <p className="svc-hero-sub">Des milliers d'annonces, intelligentes et vérifiées</p>

        </div>
      </section>

      {/* ── Category Pills ── */}
      <div className="svc-cats-bar">
        <div className="svc-cats-inner">
          {SERVICE_CATS.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`svc-cat-pill${activeCat === cat.id ? ' active' : ''}`}
              onClick={() => setActiveCat(cat.id)}
            >
              {cat.label}
            </button>
          ))}
          <button
            type="button"
            className="svc-filter-toggle"
            onClick={() => setFiltersOpen((o) => !o)}
          >
            <SlidersHorizontal size={16} /> Filtres avancés
          </button>
        </div>
      </div>

      {/* ── Search Bar for "Autre" ── */}
      {/* ── Search Bar for "Autre" ── */}
      {activeCat === 'autre' && (
        <div style={{ width: '100%', backgroundColor: '#f3f4f6', paddingTop: '24px', paddingBottom: '24px', paddingLeft: '16px', paddingRight: '16px', marginBottom: '20px' }}>
          <div style={{ maxWidth: '1280px', marginLeft: 'auto', marginRight: 'auto' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              
              {/* Search Icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: '#9ca3af' }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>

              {/* Input */}
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un service spécifique..."
                style={{
                  width: '100%',
                  height: '64px',
                  paddingLeft: '56px',
                  paddingRight: '50px',
                  borderRadius: '16px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  color: '#374151',
                  fontSize: '15px',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#fb923c';
                  e.target.style.boxShadow = '0 0 0 4px #ffedd5';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
                }}
              />
              
              {/* Clear Button */}
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Advanced Filters Panel ── */}
      {filtersOpen && (
        <div className="svc-adv-filters">
          <div className="svc-adv-filters-inner">
            <div className="svc-filter-group">
              <label>Ville</label>
              <select value={city} onChange={(e) => setCity(e.target.value)} className="filter-select">
                <option value="all">Toutes les villes</option>
                {meta.cities.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="svc-filter-group">
              <label>Prix min (DH)</label>
              <input type="number" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} placeholder="0" className="filter-input" min="0" />
            </div>
            <div className="svc-filter-group">
              <label>Prix max (DH)</label>
              <input type="number" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} placeholder="∞" className="filter-input" min="0" />
            </div>
            <button type="button" className="svc-reset-btn" onClick={reset}>
              <X size={14} /> Réinitialiser
            </button>
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <div className="svc-main">

        {/* Results Header */}
        <div className="svc-results-header">
          <h2 className="svc-results-title">Services Maison</h2>
          <span className="svc-results-count">
            {loading ? 'Chargement…' : `${filtered.length} annonce(s) trouvée(s)`}
          </span>
        </div>

        {apiError && (
          <div className="svc-api-error">
            ⚠ API indisponible. Affichage des données locales.
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="svc-skeleton-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="svc-skeleton-card">
                <div className="svc-skeleton-img" />
                <div className="svc-skeleton-body">
                  <div className="svc-skeleton-line w-80" />
                  <div className="svc-skeleton-line w-60" />
                  <div className="svc-skeleton-line w-40" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="svc-grid">
            {filtered.map((service) => (
              <ServiceListingCard
                key={service.id}
                service={service}
                isFavorite={favorites.includes(service.id)}
                onToggleFavorite={toggleFavorite}
                currentUser={currentUser}
                getWhatsAppLink={getWhatsAppLink}
                onOpenDetails={setSelectedService}
              />
            ))}
          </div>
        ) : (
          <div className="svc-empty">
            <div className="svc-empty-icon">🔍</div>
            <h3>Aucun service trouvé</h3>
            <p>Essayez de modifier vos filtres ou d'élargir votre recherche.</p>
            <button type="button" className="svc-reset-btn-lg" onClick={reset}>
              Réinitialiser les filtres
            </button>
          </div>
        )}
      </div>

      {/* ── Trust Badges ── */}
      <section className="svc-trust">
        <div className="svc-trust-inner">
          {TRUST_ITEMS.map((item, i) => (
            <div key={i} className="svc-trust-item">
              <div className="svc-trust-icon">{item.icon}</div>
              <div>
                <strong>{item.title}</strong>
                <p>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Link to Sites Utiles ── */}
      <section style={{ textAlign: 'center', padding: '60px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
        <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#0b162c', marginBottom: '12px' }}>Besoin d'un coup de main ?</h3>
        <p style={{ color: '#64748b', marginBottom: '24px' }}>Consultez nos ressources et sites partenaires pour tous vos travaux maison.</p>
        <button 
          onClick={() => navigate('/sites-utiles')}
          className="svc-reset-btn-lg" 
          style={{ background: '#0b162c' }}
        >
          Voir les sites utiles
        </button>
      </section>

      <PublicAnnonceDetailsModal
        service={selectedService}
        onClose={() => setSelectedService(null)}
      />

    </div>
  )
}
