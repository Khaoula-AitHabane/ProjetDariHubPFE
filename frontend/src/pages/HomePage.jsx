import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, ChevronRight, MapPin, Building, Armchair, Wrench, ShieldCheck, CheckCircle, Headset, Home } from 'lucide-react'
import { useMarketplace } from '../context/MarketplaceContext'

export default function HomePage() {
  const { services, meta } = useMarketplace()
  const navigate = useNavigate()

  const [searchQuery, setSearchQuery] = useState('')
  const [searchCategory, setSearchCategory] = useState('all')
  const [searchCity, setSearchCity] = useState('all')

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchCategory === 'furniture_rental') {
      navigate('/meubles')
    } else if (searchCategory === 'home_service') {
      navigate('/services-maison')
    } else if (searchCategory === 'house_rental' || searchCategory === 'all') {
      navigate('/immobilier')
    } else {
      navigate(`/categories/${searchCategory}`)
    }
  }

  return (
    <div className="home-page-redesign">
      
      {/* ===== HERO SECTION ===== */}
      <section className="hero-split">
        <div className="hero-split-left">
          <div className="hero-content-wrapper">
            <div className="hero-logo-large">
              <div className="hero-logo-icons">
                <Home size={40} className="icon-red" fill="currentColor" />
                <Armchair size={48} className="icon-orange" fill="currentColor" />
                <span className="icon-leaf">🌿</span>
              </div>
              <h1 className="hero-logo-text">
                <span className="text-orange">Dari</span><span className="text-blue">Hub</span>
              </h1>
              <div className="hero-logo-subtitle">
                <div className="line"></div>
                <span>Plateforme d'Annonces Marocaines</span>
                <div className="line"></div>
              </div>
            </div>

            <h2 className="hero-main-title">Votre maison, notre priorité</h2>
            
            <p className="hero-main-desc">
              DariHub est une plateforme marocaine qui regroupe
              l'immobilier, les meubles et les services maison.
              Notre objectif est de simplifier votre quotidien en vous
              offrant des solutions complètes, fiables et accessibles.
              Trouvez, achetez, vendez ou réservez en toute confiance.
            </p>

            <div className="hero-features">
              <div className="feature-item">
                <ShieldCheck size={28} className="feature-icon" />
                <div className="feature-text">
                  <strong>Fiable</strong>
                  <span>et sécurisé</span>
                </div>
              </div>
              <div className="feature-item">
                <CheckCircle size={28} className="feature-icon" />
                <div className="feature-text">
                  <strong>Qualité</strong>
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

        <div className="hero-split-right" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=2000")' }}>
          {/* Background image of the modern villa */}
        </div>

        {/* Floating Search Bar */}
        <div className="hero-search-floating">
          <form className="hero-search-form" onSubmit={handleSearch}>
            <div className="search-input-group">
              <input 
                type="text" 
                placeholder="Que recherchez-vous ?" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search size={20} className="input-icon" />
            </div>
            <div className="divider"></div>
            <div className="search-select-group">
              <select value={searchCategory} onChange={(e) => setSearchCategory(e.target.value)}>
                <option value="all">Toutes les catégories</option>
                <option value="house_rental">Immobilier</option>
                <option value="furniture_rental">Meubles</option>
                <option value="home_service">Services Maison</option>
              </select>
            </div>
            <div className="divider"></div>
            <div className="search-select-group">
              <select value={searchCity} onChange={(e) => setSearchCity(e.target.value)}>
                <option value="all">Localisation</option>
                {meta.cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <MapPin size={20} className="input-icon-right" />
            </div>
            <button type="submit" className="btn-search-primary">Rechercher</button>
          </form>
        </div>
      </section>

      {/* ===== NOS CATEGORIES ===== */}
      <section className="section-categories">
        <h3 className="section-title">Nos Catégories</h3>
        
        <div className="categories-grid">
          {/* Card 1: Immobilier */}
          <div className="category-card category-blue">
            <div className="category-header">
              <Building size={24} className="cat-icon" />
              <h4>IMMOBILIER</h4>
            </div>
            <div className="category-image">
              <img src="https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&q=80&w=600" alt="Immobilier" />
            </div>
            <ul className="category-list">
              <li><Link to="/immobilier"><Home size={18} className="list-icon" /> Location <ChevronRight size={18} className="chevron" /></Link></li>
              <li><Link to="/immobilier"><Building size={18} className="list-icon" /> Vente <ChevronRight size={18} className="chevron" /></Link></li>
              <li><Link to="/immobilier"><Building size={18} className="list-icon" /> Appartements <ChevronRight size={18} className="chevron" /></Link></li>
              <li><Link to="/immobilier"><Home size={18} className="list-icon" /> Villas <ChevronRight size={18} className="chevron" /></Link></li>
            </ul>
          </div>

          {/* Card 2: Meubles */}
          <div className="category-card category-orange">
            <div className="category-header">
              <Armchair size={24} className="cat-icon" />
              <h4>MEUBLES</h4>
            </div>
            <div className="category-image">
              <img src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=600" alt="Meubles" />
            </div>
            <ul className="category-list">
              <li><Link to="/meubles"><Armchair size={18} className="list-icon" /> Neuf <ChevronRight size={18} className="chevron" /></Link></li>
              <li><Link to="/meubles"><Armchair size={18} className="list-icon" /> Occasion <ChevronRight size={18} className="chevron" /></Link></li>
              <li><Link to="/meubles"><Armchair size={18} className="list-icon" /> Canapés <ChevronRight size={18} className="chevron" /></Link></li>
              <li><Link to="/meubles"><Armchair size={18} className="list-icon" /> Tables <ChevronRight size={18} className="chevron" /></Link></li>
            </ul>
          </div>

          {/* Card 3: Services Maison */}
          <div className="category-card category-green">
            <div className="category-header">
              <Wrench size={24} className="cat-icon" />
              <h4>SERVICES MAISON</h4>
            </div>
            <div className="category-image">
              <img src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=600" alt="Services" />
            </div>
            <ul className="category-list">
              <li><Link to="/categories/home_service"><Wrench size={18} className="list-icon" /> Électricité <ChevronRight size={18} className="chevron" /></Link></li>
              <li><Link to="/categories/home_service"><Wrench size={18} className="list-icon" /> Plomberie <ChevronRight size={18} className="chevron" /></Link></li>
              <li><Link to="/categories/home_service"><Wrench size={18} className="list-icon" /> Nettoyage <ChevronRight size={18} className="chevron" /></Link></li>
              <li><Link to="/categories/home_service"><Wrench size={18} className="list-icon" /> Réparation <ChevronRight size={18} className="chevron" /></Link></li>
            </ul>
          </div>
        </div>
      </section>

      {/* ===== DERNIERES ANNONCES ===== */}
      <section className="section-latest">
        <div className="section-title-wrapper">
          <h3 className="section-title">Dernières annonces</h3>
          <div className="title-underline"></div>
        </div>
        
        <div className="latest-grid">
          {services.slice(0, 5).map((service) => (
            <div key={service.id} className="ad-card" onClick={() => navigate(`/categories/${service.service_type}`)} style={{ cursor: 'pointer' }}>
              <div className="ad-image">
                <img src={service.image_url || `https://picsum.photos/seed/${service.id}/600/400`} alt={service.title} />
                <span className={`ad-badge ${
                  service.service_type === 'house_rental' ? 'badge-rent' : 
                  service.service_type === 'furniture_rental' ? 'badge-new' : 
                  'badge-service'
                }`}>
                  {service.category || 'Annonce'}
                </span>
              </div>
              <div className="ad-content">
                <h4>{service.title}</h4>
                <div className="ad-location"><MapPin size={14} /> {service.location_city}</div>
                <div className="ad-price">
                  {service.price ? `${Number(service.price).toLocaleString()} DH` : 'Prix sur demande'}
                  {service.billing_unit === 'per_night' ? ' / nuit' : service.billing_unit === 'per_month' ? ' / mois' : ''}
                </div>
              </div>
            </div>
          ))}
          {services.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#64748b' }}>
              Aucune annonce disponible pour le moment.
            </div>
          )}
        </div>

        <div className="view-more-container">
          <Link to="/immobilier" className="btn-view-more">Voir plus d'annonces</Link>
        </div>
      </section>

    </div>
  )
}
