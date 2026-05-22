import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, MapPin, Star, Search, SlidersHorizontal, X, Phone, Shield, Sparkles, ThumbsUp, Lock, Building, Home, Ruler } from 'lucide-react'
import { useMarketplace } from '../context/MarketplaceContext'
import { formatPrice } from '../lib/marketplace'

/* ─────────── Real Estate subcategories ─────────── */
const IMMO_CATS = [
  { id: 'all', label: 'Tous les biens' },
  { id: 'appartement', label: 'Appartements' },
  { id: 'villa', label: 'Villas' },
  { id: 'maison', label: 'Maisons' },
  { id: 'terrain', label: 'Terrains' },
  { id: 'bureau', label: 'Bureaux' },
  { id: 'magasin', label: 'Magasins' },
  { id: 'autre', label: 'Autre' },
]

/* ─────────── Trust Badges ─────────── */
const TRUST_ITEMS = [
  { icon: <Shield size={28} />, title: 'Annonces vérifiées', desc: 'Chaque annonce immobilière est scannée par notre IA pour garantir sa fiabilité' },
  { icon: <Sparkles size={28} />, title: 'Meilleurs prix', desc: 'Accédez aux meilleures opportunités du marché immobilier marocain' },
  { icon: <ThumbsUp size={28} />, title: 'Accompagnement', desc: 'Des conseils personnalisés pour votre projet d\'achat ou de location' },
  { icon: <Lock size={28} />, title: 'Visites sécurisées', desc: 'Prenez rendez-vous en toute confiance avec des annonceurs certifiés' },
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

/* ─────────── Immobilier Card ─────────── */
function ImmoListingCard({ listing, isFavorite, onToggleFavorite, currentUser, getWhatsAppLink }) {
  const navigate = useNavigate()
  const rating = Number(listing.rating ?? 4.0).toFixed(1)
  const reviewsCount = listing.reviews_count ?? Math.floor(Math.random() * 30 + 5)
  const wa = getWhatsAppLink(listing)

  function handleWA(e) {
    if (!currentUser) {
      e.preventDefault()
      navigate('/login')
    }
  }

  const imageFallback = `https://picsum.photos/seed/${listing.id ?? listing.title}/400/300`
  const imgSrc = listing.image_url || imageFallback

  function openListing() {
    if (listing.source_url) {
      window.open(listing.source_url, '_blank', 'noopener,noreferrer')
      return
    }

    navigate(`/listing/${listing.id}`)
  }

  return (
    <article className="svc-card cursor-pointer" onClick={openListing}>
      {/* Image */}
      <div className="svc-card-img-wrap">
        <img
          src={imgSrc}
          alt={listing.title}
          className="svc-card-img"
          loading="lazy"
          onError={(e) => { e.target.src = imageFallback }}
        />
        <span className="svc-card-badge" style={{ backgroundColor: '#2563eb' }}>Immobilier</span>
        <button
          type="button"
          className={`svc-fav-btn${isFavorite ? ' active' : ''}`}
          onClick={(event) => {
            event.stopPropagation()
            if (currentUser) {
              onToggleFavorite(listing.id)
            } else {
              navigate('/login')
            }
          }}
          aria-label="Favoris"
        >
          <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} strokeWidth={2} />
        </button>
      </div>

      {/* Body */}
      <div className="svc-card-body">
        <h3 className="svc-card-title">{listing.title}</h3>

        <div className="svc-card-meta">
          <span className="svc-card-city">
            <MapPin size={13} /> {listing.location_city ?? 'Maroc'}
          </span>
          {listing.surface && (
            <span className="svc-card-city">
              <Ruler size={13} /> {listing.surface} m²
            </span>
          )}
        </div>

        <div className="svc-card-footer">
          <div className="svc-card-price">
            <strong>{formatPrice(listing.price ?? 0)}</strong>
            <span style={{ fontSize: '11px', opacity: 0.7 }}>
              {listing.category?.toLowerCase().includes('louer') ? '/ mois' : ''}
            </span>
          </div>
          <button
            type="button"
            className="svc-details-btn"
            onClick={(event) => {
              event.stopPropagation()
              openListing()
            }}
          >
            {listing.source_url ? 'Voir sur le site' : 'Détails'}
          </button>
        </div>

        <a
          className="svc-wa-btn"
          href={currentUser ? wa : '#'}
          target={currentUser ? '_blank' : '_self'}
          rel="noreferrer"
          onClick={(event) => {
            event.stopPropagation()
            handleWA(event)
          }}
          style={{ background: '#0b162c' }}
        >
          <Phone size={16} /> Contacter l'annonceur
        </a>
      </div>
    </article>
  )
}

/* ─────────── Main Page ─────────── */
export default function ImmobilierPage() {
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
  const [transType, setTransType] = useState('all') // À Louer / À Vendre
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Filter only house_rental listings
  const immoItems = useMemo(() => {
    return allServices.filter(s => s.service_type === 'house_rental')
  }, [allServices])

  const filtered = useMemo(() => {
    return immoItems.filter((s) => {
      if (city !== 'all' && s.location_city !== city) return false
      const price = Number(s.price ?? 0)
      if (priceMin && price < Number(priceMin)) return false
      if (priceMax && price > Number(priceMax)) return false
      
      if (activeCat !== 'all') {
        const hay = `${s.category ?? ''} ${s.title ?? ''} ${s.description ?? ''}`.toLowerCase()
        if (!hay.includes(activeCat.toLowerCase())) return false
      }

      if (transType !== 'all') {
        const hay = `${s.category ?? ''} ${s.title ?? ''} ${s.description ?? ''}`.toLowerCase()
        if (!hay.includes(transType.toLowerCase())) return false
      }

      if (search.trim()) {
        const q = search.trim().toLowerCase()
        const hay = `${s.title ?? ''} ${s.category ?? ''} ${s.description ?? ''} ${s.location_city ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [immoItems, city, priceMin, priceMax, activeCat, transType, search])

  function reset() {
    setSearch(''); setCity('all'); setPriceMin(''); setPriceMax(''); setActiveCat('all'); setTransType('all')
  }

  return (
    <div className="svc-page">

      {/* ── Hero Banner ── */}
      <section className="svc-hero" style={{ background: 'linear-gradient(135deg, #0b162c 0%, #1e40af 100%)' }}>
        <div className="svc-hero-overlay" />
        <div className="svc-hero-content">
          <p className="svc-hero-eyebrow">Trouvez le bien de vos rêves</p>
          <h1 className="svc-hero-title">Immobilier</h1>
          <p className="svc-hero-sub">Des milliers d'appartements, villas et maisons partout au Maroc</p>
        </div>
      </section>

      {/* ── Category Pills ── */}
      <div className="svc-cats-bar">
        <div className="svc-cats-inner">
          {IMMO_CATS.map((cat) => (
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
            <SlidersHorizontal size={16} /> Filtres
          </button>
        </div>
      </div>

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
              <label>Transaction</label>
              <select value={transType} onChange={(e) => setTransType(e.target.value)} className="filter-select">
                <option value="all">Tout</option>
                <option value="louer">À Louer</option>
                <option value="vendre">À Vendre</option>
              </select>
            </div>
            <div className="svc-filter-group">
              <label>Ville</label>
              <select value={city} onChange={(e) => setCity(e.target.value)} className="filter-select">
                <option value="all">Toutes les villes</option>
                {meta.cities.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="svc-filter-group">
              <label>Prix max (DH)</label>
              <input type="number" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} placeholder="∞" className="filter-input" min="0" />
            </div>
            <button type="button" className="svc-reset-btn" onClick={reset}>
              <X size={14} /> Effacer
            </button>
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <div className="svc-main">

        {/* Results Header */}
        <div className="svc-results-header">
          <h2 className="svc-results-title">Annonces Immobilières</h2>
          <span className="svc-results-count">
            {loading ? 'Chargement…' : `${filtered.length} bien(s) trouvé(s)`}
          </span>
        </div>

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
            {filtered.map((item) => (
              <ImmoListingCard
                key={item.id}
                listing={item}
                isFavorite={favorites.includes(item.id)}
                onToggleFavorite={toggleFavorite}
                currentUser={currentUser}
                getWhatsAppLink={getWhatsAppLink}
              />
            ))}
          </div>
        ) : (
          <div className="svc-empty">
            <div className="svc-empty-icon">🏠</div>
            <h3>Aucun bien trouvé</h3>
            <p>Désolé, nous n'avons trouvé aucun bien correspondant à vos critères.</p>
            <button type="button" className="svc-reset-btn-lg" onClick={reset} style={{ background: '#2563eb' }}>
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
              <div className="svc-trust-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>{item.icon}</div>
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
        <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#0b162c', marginBottom: '12px' }}>Besoin d'aller plus loin ?</h3>
        <p style={{ color: '#64748b', marginBottom: '24px' }}>Consultez notre annuaire de sites partenaires et ressources utiles pour l'immobilier.</p>
        <button 
          onClick={() => navigate('/sites-utiles')}
          className="svc-reset-btn-lg" 
          style={{ background: '#2563eb' }}
        >
          Voir les sites utiles
        </button>
      </section>
    </div>
  )
}
