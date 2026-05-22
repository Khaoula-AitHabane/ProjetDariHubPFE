import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search,
  ChevronRight,
  MapPin,
  Building,
  Armchair,
  Wrench,
  ShieldCheck,
  CheckCircle,
  Headset,
  Home,
  Sparkles,
  Ruler,
  BedDouble,
  ArrowRight,
} from 'lucide-react'
import { useMarketplace } from '../context/MarketplaceContext'
import { apiRequest, formatPrice, serviceTypeConfig } from '../lib/marketplace'
import SearchBar from '../components/SmartSearch/SearchBar'

const SEARCH_CATEGORY_LABELS = {
  all: '',
  house_rental: 'immobilier',
  furniture_rental: 'meubles',
  home_service: 'services maison',
}

function buildNaturalSearchQuery(query, category, city) {
  const baseQuery = String(query ?? '').trim()
  const categoryHint = SEARCH_CATEGORY_LABELS[category] ?? ''
  const cityHint = city !== 'all' ? String(city ?? '').trim() : ''
  const normalizedBase = baseQuery.toLowerCase()
  const segments = []

  if (baseQuery) {
    segments.push(baseQuery)
  }

  if (categoryHint && !normalizedBase.includes(categoryHint.toLowerCase())) {
    segments.push(categoryHint)
  }

  if (cityHint && !normalizedBase.includes(cityHint.toLowerCase())) {
    segments.push(`a ${cityHint}`)
  }

  return segments.join(' ').replace(/\s+/g, ' ').trim()
}

// buildSmartSearchChips function removed since we use IntentChips

function SmartSearchResultCard({ service, onOpen }) {
  const typeConfig = serviceTypeConfig[service.service_type] ?? null
  const badgeLabel = typeConfig?.label ?? 'Annonce'
  const badgeColor =
    service.service_type === 'house_rental'
      ? '#2563eb'
      : service.service_type === 'furniture_rental'
        ? '#f97316'
        : '#16a34a'
  const imageFallback = `https://picsum.photos/seed/${service.id ?? service.title}/600/400`

  return (
    <article className="smart-search-card">
      <div className="smart-search-card-media">
        <img
          src={service.image_url || imageFallback}
          alt={service.title}
          className="smart-search-card-image"
          loading="lazy"
          onError={(event) => {
            event.target.src = imageFallback
          }}
        />
        <span
          className="smart-search-card-badge"
          style={{ backgroundColor: badgeColor }}
        >
          {badgeLabel}
        </span>
      </div>

      <div className="smart-search-card-body">
        <div className="smart-search-card-topline">
          <span className="smart-search-card-city">
            <MapPin size={14} />
            {service.location_city ?? 'Maroc'}
          </span>
          {service.surface ? (
            <span className="smart-search-card-city">
              <Ruler size={14} />
              {service.surface} m2
            </span>
          ) : null}
          {service.bedrooms ? (
            <span className="smart-search-card-city">
              <BedDouble size={14} />
              {service.bedrooms}
            </span>
          ) : null}
        </div>

        <h4 className="smart-search-card-title">{service.title}</h4>

        <p className="smart-search-card-category">
          {service.category || badgeLabel}
        </p>

        <div className="smart-search-card-footer">
          <div className="smart-search-card-price">
            {formatPrice(service.price ?? 0)}
          </div>
          <button
            type="button"
            className="smart-search-card-action"
            onClick={() => onOpen(service)}
          >
            Voir
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </article>
  )
}

export default function HomePage() {
  const { services, meta } = useMarketplace()
  const navigate = useNavigate()
  const smartResultsRef = useRef(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchCategory, setSearchCategory] = useState('all')
  const [searchCity, setSearchCity] = useState('all')
  const [smartSearchLoading, setSmartSearchLoading] = useState(false)
  const [smartSearchError, setSmartSearchError] = useState('')
  const [smartSearchResults, setSmartSearchResults] = useState([])
  const [smartSearchMeta, setSmartSearchMeta] = useState(null)
  const [hasSmartSearchRun, setHasSmartSearchRun] = useState(false)

  async function handleSearch(event) {
    event.preventDefault()

    const naturalQuery = buildNaturalSearchQuery(
      searchQuery,
      searchCategory,
      searchCity,
    )

    if (naturalQuery.length < 3) {
      setSmartSearchError('Saisis une recherche ou choisis au moins une ville/categorie.')
      setSmartSearchResults([])
      setSmartSearchMeta(null)
      setHasSmartSearchRun(true)
      return
    }

    setSmartSearchLoading(true)
    setSmartSearchError('')
    setHasSmartSearchRun(true)

    try {
      const response = await apiRequest('/api/ai/smart-search', {
        method: 'POST',
        body: {
          query: naturalQuery,
          per_page: 9,
        },
      })

      setSmartSearchResults(Array.isArray(response.data) ? response.data : [])
      setSmartSearchMeta(response.meta ?? null)

      window.requestAnimationFrame(() => {
        smartResultsRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      })
    } catch (error) {
      setSmartSearchResults([])
      setSmartSearchMeta(null)
      setSmartSearchError(
        error instanceof Error
          ? error.message
          : 'La recherche intelligente est indisponible pour le moment.',
      )
    } finally {
      setSmartSearchLoading(false)
    }
  }

  function openSearchResult(service) {
    if (service.source_url) {
      window.open(service.source_url, '_blank', 'noopener,noreferrer')
      return
    }

    navigate(`/listing/${service.id}`)
  }

  function clearSmartSearch() {
    setSmartSearchError('')
    setSmartSearchResults([])
    setSmartSearchMeta(null)
    setHasSmartSearchRun(false)
  }

  return (
    <div className="home-page-redesign">
      <section className="hero-split flex flex-col lg:flex-row w-full min-h-[85vh]">
        <div className="hero-split-left">
          <div className="hero-content-wrapper">
            <div
              className="hero-logo-large"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <img
                src="/logo.png"
                alt="DariHub Logo"
                className="hero-brand-logo"
                style={{ height: '350px', width: 'auto', marginBottom: '-120px' }}
              />
              <h1
                className="hero-logo-text"
                style={{ fontSize: '72px', margin: '0', lineHeight: '0.6' }}
              >
                <span className="brand-dari">Dari</span>
                <span className="brand-hub">Hub</span>
              </h1>
              <div className="hero-logo-subtitle">
                <div className="line"></div>
                <span className="brand-subtitle-large">
                  Plateforme d'Annonces Marocaines
                </span>
                <div className="line"></div>
              </div>
            </div>

            <h2 className="hero-main-title">Votre maison, notre priorite</h2>

            <p className="hero-main-desc">
              DariHub est une plateforme marocaine qui regroupe
              l&apos;immobilier, les meubles et les services maison.
              Notre objectif est de simplifier votre quotidien en vous
              offrant des solutions completes, fiables et accessibles.
              Trouvez, achetez, vendez ou reservez en toute confiance.
            </p>

            <div className="hero-features">
              <div className="feature-item">
                <ShieldCheck size={28} className="feature-icon" />
                <div className="feature-text">
                  <strong>Fiable</strong>
                  <span>et securise</span>
                </div>
              </div>
              <div className="feature-item">
                <CheckCircle size={28} className="feature-icon" />
                <div className="feature-text">
                  <strong>Qualite</strong>
                  <span>garantie</span>
                </div>
              </div>
              <div className="feature-item">
                <Headset size={28} className="feature-icon" />
                <div className="feature-text">
                  <strong>Support</strong>
                  <span>24/7</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className="hero-split-right"
          style={{
            backgroundImage:
              'url("https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=2000")',
          }}
        >
          {/* Background image of the modern villa */}
        </div>

        <div className="hero-search-floating w-full px-4 md:px-0 z-50">
          <SearchBar 
            isSearching={smartSearchLoading} 
            onSearch={(results, meta) => {
              setSmartSearchResults(results)
              setSmartSearchMeta(meta)
              setHasSmartSearchRun(true)
              setSmartSearchError('')
              window.requestAnimationFrame(() => {
                  smartResultsRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  })
                })
            }} 
          />
        </div>
      </section>

      {(hasSmartSearchRun || smartSearchLoading) && (
        <section ref={smartResultsRef} className="smart-search-results-section">
          <div className="smart-search-results-shell">
            <div className="smart-search-results-header">
              <div>
                <p className="smart-search-results-kicker">
                  <Sparkles size={16} />
                  Recherche intelligente active
                </p>
                <h3 className="smart-search-results-title">
                  Resultats de la Smart Search
                </h3>
                <p className="smart-search-results-subtitle">
                  {smartSearchMeta?.query
                    ? `Requete comprise: "${smartSearchMeta.query}"`
                    : 'L IA analyse ta demande et retrouve les annonces les plus proches.'}
                </p>
              </div>

              <button
                type="button"
                className="smart-search-clear-btn"
                onClick={clearSmartSearch}
              >
                Effacer
              </button>
            </div>

            {/* Intent chips are now displayed in the SearchBar directly */}

            {smartSearchLoading ? (
              <div className="smart-search-skeleton-grid">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="smart-search-skeleton-card">
                    <div className="smart-search-skeleton-media" />
                    <div className="smart-search-skeleton-line w-85" />
                    <div className="smart-search-skeleton-line w-55" />
                    <div className="smart-search-skeleton-line w-35" />
                  </div>
                ))}
              </div>
            ) : smartSearchError ? (
              <div className="smart-search-feedback smart-search-feedback-error">
                {smartSearchError}
              </div>
            ) : smartSearchResults.length > 0 ? (
              <>
                <div className="smart-search-results-meta">
                  {smartSearchMeta?.pagination?.total
                    ? `${smartSearchMeta.pagination.total} annonce(s) trouvee(s)`
                    : `${smartSearchResults.length} annonce(s) trouvee(s)`}
                </div>

                <div className="smart-search-results-grid">
                  {smartSearchResults.map((service) => (
                    <SmartSearchResultCard
                      key={service.id}
                      service={service}
                      onOpen={openSearchResult}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="smart-search-feedback">
                Aucune annonce ne correspond a cette recherche pour le moment.
              </div>
            )}
          </div>
        </section>
      )}

      <section className="section-categories">
        <h3 className="section-title text-2xl md:text-3xl font-bold text-center mb-8">
          Nos Categories
        </h3>

        <div className="categories-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4 md:px-8 max-w-7xl mx-auto">
          <div className="category-card category-blue">
            <div className="category-header">
              <Building size={24} className="cat-icon" />
              <h4>IMMOBILIER</h4>
            </div>
            <div className="category-image">
              <img
                src="https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&q=80&w=600"
                alt="Immobilier"
              />
            </div>
            <ul className="category-list">
              <li>
                <Link to="/immobilier">
                  <Home size={18} className="list-icon" />
                  Location
                  <ChevronRight size={18} className="chevron" />
                </Link>
              </li>
              <li>
                <Link to="/immobilier">
                  <Building size={18} className="list-icon" />
                  Vente
                  <ChevronRight size={18} className="chevron" />
                </Link>
              </li>
              <li>
                <Link to="/immobilier">
                  <Building size={18} className="list-icon" />
                  Appartements
                  <ChevronRight size={18} className="chevron" />
                </Link>
              </li>
              <li>
                <Link to="/immobilier">
                  <Home size={18} className="list-icon" />
                  Villas
                  <ChevronRight size={18} className="chevron" />
                </Link>
              </li>
            </ul>
          </div>

          <div className="category-card category-orange">
            <div className="category-header">
              <Armchair size={24} className="cat-icon" />
              <h4>MEUBLES</h4>
            </div>
            <div className="category-image">
              <img
                src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=600"
                alt="Meubles"
              />
            </div>
            <ul className="category-list">
              <li>
                <Link to="/meubles">
                  <Armchair size={18} className="list-icon" />
                  Neuf
                  <ChevronRight size={18} className="chevron" />
                </Link>
              </li>
              <li>
                <Link to="/meubles">
                  <Armchair size={18} className="list-icon" />
                  Occasion
                  <ChevronRight size={18} className="chevron" />
                </Link>
              </li>
              <li>
                <Link to="/meubles">
                  <Armchair size={18} className="list-icon" />
                  Canapes
                  <ChevronRight size={18} className="chevron" />
                </Link>
              </li>
              <li>
                <Link to="/meubles">
                  <Armchair size={18} className="list-icon" />
                  Tables
                  <ChevronRight size={18} className="chevron" />
                </Link>
              </li>
            </ul>
          </div>

          <div className="category-card category-green">
            <div className="category-header">
              <Wrench size={24} className="cat-icon" />
              <h4>SERVICES MAISON</h4>
            </div>
            <div className="category-image">
              <img
                src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=600"
                alt="Services"
              />
            </div>
            <ul className="category-list">
              <li>
                <Link to="/categories/home_service">
                  <Wrench size={18} className="list-icon" />
                  Electricite
                  <ChevronRight size={18} className="chevron" />
                </Link>
              </li>
              <li>
                <Link to="/categories/home_service">
                  <Wrench size={18} className="list-icon" />
                  Plomberie
                  <ChevronRight size={18} className="chevron" />
                </Link>
              </li>
              <li>
                <Link to="/categories/home_service">
                  <Wrench size={18} className="list-icon" />
                  Nettoyage
                  <ChevronRight size={18} className="chevron" />
                </Link>
              </li>
              <li>
                <Link to="/categories/home_service">
                  <Wrench size={18} className="list-icon" />
                  Reparation
                  <ChevronRight size={18} className="chevron" />
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section-latest">
        <div className="section-title-wrapper mb-8">
          <h3 className="section-title text-2xl md:text-3xl font-bold text-center">
            Dernieres annonces
          </h3>
          <div className="title-underline"></div>
        </div>

        <div className="latest-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 px-4 md:px-8 max-w-7xl mx-auto">
          {services.slice(0, 5).map((service) => (
            <div
              key={service.id}
              className="ad-card"
              onClick={() => navigate(`/categories/${service.service_type}`)}
              style={{ cursor: 'pointer' }}
            >
              <div className="ad-image">
                <img
                  src={service.image_url || `https://picsum.photos/seed/${service.id}/600/400`}
                  alt={service.title}
                />
                <span
                  className={`ad-badge ${
                    service.service_type === 'house_rental'
                      ? 'badge-rent'
                      : service.service_type === 'furniture_rental'
                        ? 'badge-new'
                        : 'badge-service'
                  }`}
                >
                  {service.category || 'Annonce'}
                </span>
              </div>
              <div className="ad-content">
                <h4>{service.title}</h4>
                <div className="ad-location">
                  <MapPin size={14} />
                  {service.location_city}
                </div>
                <div className="ad-price">
                  {service.price
                    ? `${Number(service.price).toLocaleString()} DH`
                    : 'Prix sur demande'}
                  {service.billing_unit === 'per_night'
                    ? ' / nuit'
                    : service.billing_unit === 'per_month'
                      ? ' / mois'
                      : ''}
                </div>
              </div>
            </div>
          ))}
          {services.length === 0 && (
            <div
              style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '40px',
                color: '#64748b',
              }}
            >
              Aucune annonce disponible pour le moment.
            </div>
          )}
        </div>

        <div className="view-more-container">
          <Link to="/immobilier" className="btn-view-more">
            Voir plus d&apos;annonces
          </Link>
        </div>
      </section>
    </div>
  )
}
