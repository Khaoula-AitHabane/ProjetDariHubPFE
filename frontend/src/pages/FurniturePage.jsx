import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, MapPin, Star, Search, SlidersHorizontal, X, Phone, Shield, Sparkles, ThumbsUp, Lock, Armchair } from 'lucide-react'
import PublicAnnonceDetailsModal from '../components/PublicAnnonceDetailsModal'
import { useMarketplace } from '../context/MarketplaceContext'
import { formatPrice } from '../lib/marketplace'

/* ─────────── Furniture subcategories ─────────── */
const FURNITURE_CATS = [
  { id: 'all', label: 'Tous les meubles' },
  { id: 'salon', label: 'Salons' },
  { id: 'chambre', label: 'Chambres' },
  { id: 'electromenager', label: 'Électroménager' },
  { id: 'decoration', label: 'Décoration' },
  { id: 'tables', label: 'Tables & Chaises' },
  { id: 'cuisine', label: 'Cuisine' },
  { id: 'autre', label: 'Autre' },
]

/* ─────────── Trust Badges ─────────── */
const TRUST_ITEMS = [
  { icon: <Shield size={28} />, title: 'Qualité vérifiée', desc: 'Des meubles inspectés et validés par notre communauté' },
  { icon: <Sparkles size={28} />, title: 'Prix imbattables', desc: 'Trouvez les meilleures opportunités neuf ou occasion' },
  { icon: <ThumbsUp size={28} />, title: 'Recommandations', desc: 'Des suggestions personnalisées pour votre intérieur' },
  { icon: <Lock size={28} />, title: 'Transaction sécurisée', desc: 'Vos échanges sont protégés et sécurisés' },
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

/* ─────────── Furniture Card ─────────── */
function FurnitureListingCard({ furniture, isFavorite, onToggleFavorite, currentUser, getWhatsAppLink, onOpenDetails }) {
  const navigate = useNavigate()
  const rating = Number(furniture.rating ?? 4.0).toFixed(1)
  const reviewsCount = furniture.reviews_count ?? Math.floor(Math.random() * 40 + 5)
  const wa = getWhatsAppLink(furniture)

  function handleWA(e) {
    if (!currentUser) {
      e.preventDefault()
      navigate('/login')
    }
  }

  const imageFallback = `https://picsum.photos/seed/${furniture.id ?? furniture.title}/400/300`
  const imgSrc = furniture.image_url || imageFallback

  return (
    <article className="svc-card">
      {/* Image */}
      <div className="svc-card-img-wrap">
        <img
          src={imgSrc}
          alt={furniture.title}
          className="svc-card-img"
          loading="lazy"
          onError={(e) => { e.target.src = imageFallback }}
        />
        <span className="svc-card-badge" style={{ backgroundColor: '#f97316' }}>Meubles</span>
        <button
          type="button"
          className={`svc-fav-btn${isFavorite ? ' active' : ''}`}
          onClick={() => currentUser ? onToggleFavorite(furniture.id) : navigate('/login')}
          aria-label="Favoris"
        >
          <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} strokeWidth={2} />
        </button>
      </div>

      {/* Body */}
      <div className="svc-card-body">
        <h3 className="svc-card-title">{furniture.title}</h3>

        <div className="svc-card-meta">
          <span className="svc-card-city">
            <MapPin size={13} /> {furniture.location_city ?? 'Maroc'}
          </span>
          <StarRating rating={rating} count={reviewsCount} />
        </div>

        <div className="svc-card-footer">
          <div className="svc-card-price">
            <strong>{formatPrice(furniture.price ?? 0)}</strong>
          </div>
          <button
            type="button"
            className="svc-details-btn"
            onClick={() => {
              if (furniture.source_url) {
                window.open(furniture.source_url, '_blank', 'noopener,noreferrer')
              } else {
                onOpenDetails(furniture)
              }
            }}
          >
            {furniture.source_url ? 'Voir sur le site' : 'Détails'}
          </button>
        </div>

        <a
          className="svc-wa-btn"
          href={currentUser ? wa : '#'}
          target={currentUser ? '_blank' : '_self'}
          rel="noreferrer"
          onClick={handleWA}
          style={{ background: '#0b162c' }}
        >
          <Phone size={16} /> Contacter le vendeur
        </a>
      </div>
    </article>
  )
}

/* ─────────── Main Page ─────────── */
export default function FurniturePage() {
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
  const [condition, setCondition] = useState('all')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [selectedFurniture, setSelectedFurniture] = useState(null)

  // Filter only furniture_rental listings
  const furnitureItems = useMemo(() => {
    return allServices.filter(s => s.service_type === 'furniture_rental')
  }, [allServices])

  const filtered = useMemo(() => {
    return furnitureItems.filter((s) => {
      if (city !== 'all' && s.location_city !== city) return false
      const price = Number(s.price ?? 0)
      if (priceMin && price < Number(priceMin)) return false
      if (priceMax && price > Number(priceMax)) return false
      
      if (activeCat !== 'all') {
        const hay = `${s.category ?? ''} ${s.title ?? ''} ${s.description ?? ''}`.toLowerCase()
        if (!hay.includes(activeCat)) return false
      }

      if (condition !== 'all') {
        const hay = `${s.category ?? ''} ${s.title ?? ''} ${s.description ?? ''}`.toLowerCase()
        if (!hay.includes(condition)) return false
      }

      if (search.trim()) {
        const q = search.trim().toLowerCase()
        const hay = `${s.title ?? ''} ${s.category ?? ''} ${s.description ?? ''} ${s.location_city ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [furnitureItems, city, priceMin, priceMax, activeCat, condition, search])

  function reset() {
    setSearch(''); setCity('all'); setPriceMin(''); setPriceMax(''); setActiveCat('all'); setCondition('all')
  }

  return (
    <div className="svc-page">

      {/* ── Hero Banner ── */}
      <section className="svc-hero" style={{ background: 'linear-gradient(135deg, #0b162c 0%, #334155 100%)' }}>
        <div className="svc-hero-overlay" />
        <div className="svc-hero-content">
          <p className="svc-hero-eyebrow">Aménagez votre intérieur</p>
          <h1 className="svc-hero-title">Meubles & Déco</h1>
          <p className="svc-hero-sub">Trouvez les plus beaux meubles neufs et d'occasion au meilleur prix</p>
        </div>
      </section>

      {/* ── Category Pills ── */}
      <div className="svc-cats-bar">
        <div className="svc-cats-inner">
          {FURNITURE_CATS.map((cat) => (
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
                placeholder="Rechercher un meuble spécifique..."
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
              <label>Rechercher</label>
              <input 
                type="text" 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                placeholder="Canapé, table..." 
                className="filter-input"
              />
            </div>
            <div className="svc-filter-group">
              <label>Ville</label>
              <select value={city} onChange={(e) => setCity(e.target.value)} className="filter-select">
                <option value="all">Toutes les villes</option>
                {meta.cities.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="svc-filter-group">
              <label>État</label>
              <select value={condition} onChange={(e) => setCondition(e.target.value)} className="filter-select">
                <option value="all">Tous les états</option>
                <option value="neuf">Neuf</option>
                <option value="occasion">Occasion</option>
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
          <h2 className="svc-results-title">Annonces Meubles</h2>
          <span className="svc-results-count">
            {loading ? 'Chargement…' : `${filtered.length} meuble(s) trouvé(s)`}
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
              <FurnitureListingCard
                key={item.id}
                furniture={item}
                isFavorite={favorites.includes(item.id)}
                onToggleFavorite={toggleFavorite}
                currentUser={currentUser}
                getWhatsAppLink={getWhatsAppLink}
                onOpenDetails={setSelectedFurniture}
              />
            ))}
          </div>
        ) : (
          <div className="svc-empty">
            <div className="svc-empty-icon">🛋️</div>
            <h3>Aucun meuble trouvé</h3>
            <p>Désolé, nous n'avons trouvé aucun meuble correspondant à vos critères.</p>
            <button type="button" className="svc-reset-btn-lg" onClick={reset} style={{ background: '#f97316' }}>
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
              <div className="svc-trust-icon" style={{ background: '#fff7ed', color: '#f97316' }}>{item.icon}</div>
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
        <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#0b162c', marginBottom: '12px' }}>Envie de changement ?</h3>
        <p style={{ color: '#64748b', marginBottom: '24px' }}>Découvrez notre sélection de sites partenaires pour le mobilier et la décoration.</p>
        <button 
          onClick={() => navigate('/sites-utiles')}
          className="svc-reset-btn-lg" 
          style={{ background: '#f97316' }}
        >
          Voir les sites utiles
        </button>
      </section>

      <PublicAnnonceDetailsModal
        service={selectedFurniture}
        onClose={() => setSelectedFurniture(null)}
      />

    </div>
  )
}
