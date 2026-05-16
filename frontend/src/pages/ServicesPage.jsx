import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, MapPin, Star, Search, SlidersHorizontal, X, Phone, Shield, Sparkles, ThumbsUp, Lock } from 'lucide-react'
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
function ServiceListingCard({ service, isFavorite, onToggleFavorite, currentUser, getWhatsAppLink }) {
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
            onClick={() => {}}
          >
            Détails
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

          {/* Floating Search Bar */}
          <div className="svc-search-bar">
            <div className="svc-search-field">
              <Search size={18} className="svc-search-icon" />
              <input
                type="search"
                placeholder="Que cherchez-vous ?"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="svc-search-input"
              />
            </div>
            <div className="svc-search-divider" />
            <div className="svc-search-field svc-search-field--select">
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="svc-search-select"
              >
                <option value="all">Ville</option>
                {meta.cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="svc-search-divider" />
            <div className="svc-search-field svc-search-field--select">
              <select
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                className="svc-search-select"
              >
                <option value="">Prix min</option>
                {[50,100,150,200,300,500,1000].map(v => (
                  <option key={v} value={v}>{v} DH</option>
                ))}
              </select>
            </div>
            <div className="svc-search-divider" />
            <div className="svc-search-field svc-search-field--select">
              <select
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                className="svc-search-select"
              >
                <option value="">Prix max</option>
                {[200,300,500,750,1000,2000,5000].map(v => (
                  <option key={v} value={v}>{v} DH</option>
                ))}
              </select>
            </div>
            <button type="button" className="svc-search-btn">
              <Search size={18} /> Rechercher
            </button>
          </div>
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

    </div>
  )
}
