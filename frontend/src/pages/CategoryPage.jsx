import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import ServiceCard from '../components/ServiceCard'
import ServiceDetailPanel from '../components/ServiceDetailPanel'
import { useMarketplace } from '../context/MarketplaceContext'
import { serviceTypeConfig } from '../lib/marketplace'

// ── Filtres spécifiques selon la catégorie ────────────────────────────────
function HouseFilters({ filters, setFilter, meta }) {
  return (
    <>
      <select
        value={filters.transactionType}
        onChange={(e) => setFilter('transactionType', e.target.value)}
        className="filter-select"
      >
        <option value="all">Louer ou Vendre</option>
        <option value="location">À louer</option>
        <option value="vente">À vendre</option>
      </select>

      <select
        value={filters.furnished}
        onChange={(e) => setFilter('furnished', e.target.value)}
        className="filter-select"
      >
        <option value="all">Meublé ou non</option>
        <option value="meuble">Meublé</option>
        <option value="non_meuble">Non meublé</option>
      </select>

      <select
        value={filters.city}
        onChange={(e) => setFilter('city', e.target.value)}
        className="filter-select"
      >
        <option value="all">Toutes les villes</option>
        {meta.cities.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <div className="filter-range">
        <input
          type="number"
          placeholder="Prix min (MAD)"
          value={filters.priceMin}
          onChange={(e) => setFilter('priceMin', e.target.value)}
          className="filter-input"
          min="0"
        />
        <span className="range-sep">—</span>
        <input
          type="number"
          placeholder="Prix max"
          value={filters.priceMax}
          onChange={(e) => setFilter('priceMax', e.target.value)}
          className="filter-input"
          min="0"
        />
      </div>

      <div className="filter-range">
        <input
          type="number"
          placeholder="Surface min (m²)"
          value={filters.surfaceMin}
          onChange={(e) => setFilter('surfaceMin', e.target.value)}
          className="filter-input"
          min="0"
        />
        <span className="range-sep">—</span>
        <input
          type="number"
          placeholder="Surface max"
          value={filters.surfaceMax}
          onChange={(e) => setFilter('surfaceMax', e.target.value)}
          className="filter-input"
          min="0"
        />
      </div>
    </>
  )
}

function FurnitureFilters({ filters, setFilter, meta }) {
  return (
    <>
      <select
        value={filters.condition}
        onChange={(e) => setFilter('condition', e.target.value)}
        className="filter-select"
      >
        <option value="all">Neuf ou Occasion</option>
        <option value="neuf">Neuf</option>
        <option value="occasion">Occasion</option>
      </select>

      <select
        value={filters.city}
        onChange={(e) => setFilter('city', e.target.value)}
        className="filter-select"
      >
        <option value="all">Toutes les villes</option>
        {meta.cities.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <div className="filter-range">
        <input
          type="number"
          placeholder="Prix min (MAD)"
          value={filters.priceMin}
          onChange={(e) => setFilter('priceMin', e.target.value)}
          className="filter-input"
          min="0"
        />
        <span className="range-sep">—</span>
        <input
          type="number"
          placeholder="Prix max"
          value={filters.priceMax}
          onChange={(e) => setFilter('priceMax', e.target.value)}
          className="filter-input"
          min="0"
        />
      </div>
    </>
  )
}

function HomeServiceFilters({ filters, setFilter, meta }) {
  return (
    <>
      <input
        type="search"
        placeholder="Type ou nom de service..."
        value={filters.serviceSearch}
        onChange={(e) => setFilter('serviceSearch', e.target.value)}
        className="filter-input filter-search-main"
      />

      <select
        value={filters.city}
        onChange={(e) => setFilter('city', e.target.value)}
        className="filter-select"
      >
        <option value="all">Toutes les villes</option>
        {meta.cities.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
    </>
  )
}

// ── Logique de filtrage local enrichie ────────────────────────────────────
function applyLocalFilters(services, type, filters) {
  return services.filter((s) => {
    // Filtre ville
    if (filters.city !== 'all' && s.location_city !== filters.city) return false

    // Filtre prix
    const price = Number(s.price ?? 0)
    if (filters.priceMin && price < Number(filters.priceMin)) return false
    if (filters.priceMax && price > Number(filters.priceMax)) return false

    if (type === 'house_rental') {
      // Filtre louer/vendre
      if (filters.transactionType !== 'all') {
        const cat = (s.category ?? '').toLowerCase()
        const title = (s.title ?? '').toLowerCase()
        const desc = (s.description ?? '').toLowerCase()
        const haystack = `${cat} ${title} ${desc}`
        if (filters.transactionType === 'location') {
          if (!haystack.includes('loue') && !haystack.includes('location') && !haystack.includes('louer')) return false
        } else if (filters.transactionType === 'vente') {
          if (!haystack.includes('vente') && !haystack.includes('vendre') && !haystack.includes('achat')) return false
        }
      }

      // Filtre meublé/non meublé
      if (filters.furnished !== 'all') {
        const haystack = `${(s.category ?? '')} ${(s.title ?? '')} ${(s.description ?? '')} ${(s.features ?? []).join(' ')}`.toLowerCase()
        if (filters.furnished === 'meuble') {
          if (!haystack.includes('meuble') && !haystack.includes('meublé') && !haystack.includes('furnished')) return false
        } else if (filters.furnished === 'non_meuble') {
          if (haystack.includes('meuble') || haystack.includes('meublé') || haystack.includes('furnished')) return false
        }
      }

      // Filtre surface
      const surface = Number(s.surface ?? s.capacity ?? 0)
      if (filters.surfaceMin && surface < Number(filters.surfaceMin)) return false
      if (filters.surfaceMax && surface > Number(filters.surfaceMax)) return false
    }

    if (type === 'furniture_rental') {
      // Filtre neuf/occasion
      if (filters.condition !== 'all') {
        const haystack = `${(s.category ?? '')} ${(s.title ?? '')} ${(s.description ?? '')}`.toLowerCase()
        if (filters.condition === 'neuf') {
          if (!haystack.includes('neuf') && !haystack.includes('new') && !haystack.includes('nouveau')) return false
        } else if (filters.condition === 'occasion') {
          if (!haystack.includes('occasion') && !haystack.includes('used') && !haystack.includes('ancien')) return false
        }
      }
    }

    if (type === 'home_service') {
      // Recherche par nom/type de service
      if (filters.serviceSearch) {
        const q = filters.serviceSearch.toLowerCase()
        const haystack = `${s.title} ${s.category} ${s.description}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
    }

    return true
  })
}

// ── Composant principal ───────────────────────────────────────────────────
export default function CategoryPage() {
  const { type } = useParams()
  
  if (type === 'house_rental') return <Navigate to="/immobilier" replace />
  if (type === 'furniture_rental') return <Navigate to="/meubles" replace />
  if (type === 'home_service') return <Navigate to="/services-maison" replace />

  const navigate = useNavigate()
  const category = serviceTypeConfig[type]

  const {
    loading,
    apiError,
    meta,
    favorites,
    getWhatsAppLink,
    activeServiceId,
    activeService,
    selectService,
    toggleFavorite,
    getServicesByType,
    currentUser,
  } = useMarketplace()

  // Filtres enrichis par catégorie
  const [filters, setFilters] = useState({
    city: 'all',
    priceMin: '',
    priceMax: '',
    surfaceMin: '',
    surfaceMax: '',
    transactionType: 'all',   // house_rental
    furnished: 'all',          // house_rental
    condition: 'all',          // furniture_rental
    serviceSearch: '',         // home_service
  })

  function setFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  function resetFilters() {
    setFilters({
      city: 'all', priceMin: '', priceMax: '',
      surfaceMin: '', surfaceMax: '',
      transactionType: 'all', furnished: 'all',
      condition: 'all', serviceSearch: '',
    })
  }

  const rawServices = category ? getServicesByType(type) : []
  const categoryServices = applyLocalFilters(rawServices, type, filters)

  const categoryActiveService =
    categoryServices.find((s) => s.id === activeServiceId) ??
    categoryServices[0] ??
    null

  useEffect(() => {
    if (
      category &&
      categoryServices.length > 0 &&
      !categoryServices.some((s) => s.id === activeServiceId)
    ) {
      selectService(categoryServices[0])
    }
  }, [activeServiceId, categoryServices, selectService, category])

  if (!category) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="category-page">
      <section
        className="category-banner"
        style={{ background: category.color, color: category.accent }}
      >
        <div className="category-banner-inner">
          <span className="category-banner-icon">{category.icon}</span>
          <div>
            <h1>{category.title}</h1>
            <p>{category.description}</p>
          </div>
        </div>
      </section>

      {/* ── Filtres enrichis ── */}
      <section className="filters-bar">
        {type === 'house_rental' && (
          <HouseFilters filters={filters} setFilter={setFilter} meta={meta} />
        )}
        {type === 'furniture_rental' && (
          <FurnitureFilters filters={filters} setFilter={setFilter} meta={meta} />
        )}
        {type === 'home_service' && (
          <HomeServiceFilters filters={filters} setFilter={setFilter} meta={meta} />
        )}

        <button type="button" className="ghost-button filter-reset-btn" onClick={resetFilters}>
          Réinitialiser
        </button>

        <Link to="/" className="ghost-button">← Accueil</Link>

        <span className="result-count">
          {loading ? 'Chargement...' : `${categoryServices.length} annonce(s)`}
        </span>
      </section>

      {apiError ? (
        <div className="alert-banner">API indisponible : {apiError}</div>
      ) : null}

      <div className="category-layout">
        <div className="listings-grid">
          {categoryServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              isFavorite={favorites.includes(service.id)}
              isActive={categoryActiveService?.id === service.id}
              onSelect={selectService}
              onToggleFavorite={toggleFavorite}
              whatsappLink={getWhatsAppLink(service)}
              canFavorite={!!currentUser}
              currentUser={currentUser}
              onWhatsAppClick={() => {
                if (!currentUser) {
                  navigate('/login')
                  return false
                }
                return true
              }}
            />
          ))}

          {categoryServices.length === 0 && !loading ? (
            <div className="empty-state">
              <h3>Aucune annonce dans {category.label}</h3>
              <p>Essaie de modifier les filtres ou publie ta propre annonce.</p>
              <div className="empty-cta">
                <button type="button" className="ghost-button" onClick={resetFilters}>
                  Réinitialiser les filtres
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <aside className="category-aside">
          <ServiceDetailPanel service={categoryActiveService ?? activeService} />
        </aside>
      </div>
    </div>
  )
}
