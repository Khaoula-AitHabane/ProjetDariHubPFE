import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, ChevronRight, Home, Armchair, Wrench, ShieldCheck, Zap, Globe, Mail, Send, Phone, MapPin } from 'lucide-react'
import { useMarketplace } from '../context/MarketplaceContext'
import ServiceCard from '../components/ServiceCard'

export default function HomePage() {
  const { services, meta, favorites, toggleFavorite, currentUser, getWhatsAppLink, selectService } = useMarketplace()
  const navigate = useNavigate()

  const [searchCategory, setSearchCategory] = useState('house_rental')
  const [searchCity, setSearchCity] = useState('all')
  const [searchPrice, setSearchPrice] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    // Redirect to the selected category page, and we could pass state. For simplicity, just navigate.
    navigate(`/categories/${searchCategory}`)
  }

  // Get some "popular" listings (top 4 featured or latest)
  const popularListings = services
    .sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0))
    .slice(0, 4)

  return (
    <div className="home-page-premium">
      
      {/* ===== HERO SECTION ===== */}
      <section 
        className="hero-full"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=2000")'
        }}
      >
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title-main">
            Trouvez votre maison, vos meubles et vos services en un seul endroit
          </h1>
          <p className="hero-subtitle">
            La première plateforme marocaine 100% dédiée à l'habitat. Plus de {services.length > 0 ? services.length : '5000'} annonces vérifiées partout au Maroc.
          </p>

          <form className="hero-search-bar" onSubmit={handleSearch}>
            <select 
              className="hero-search-select" 
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value)}
              style={{ borderLeft: 'none' }}
            >
              <option value="house_rental">Immobilier</option>
              <option value="furniture_rental">Meubles</option>
              <option value="home_service">Services Maison</option>
            </select>
            
            <select 
              className="hero-search-select"
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
            >
              <option value="all">Toutes les villes</option>
              {meta.cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            
            <input 
              type="number" 
              className="hero-search-input" 
              placeholder="Budget Max (MAD)" 
              value={searchPrice}
              onChange={(e) => setSearchPrice(e.target.value)}
            />
            
            <button type="submit" className="hero-search-btn">
              <Search size={20} strokeWidth={2.5} /> Rechercher
            </button>
          </form>
        </div>
      </section>

      {/* ===== STATS SECTION ===== */}
      <div className="home-stats-wrapper">
        <div className="home-stats">
          <div className="stat-box">
            <strong>5000+</strong>
            <span>Annonces</span>
          </div>
          <div className="stat-box">
            <strong>1200+</strong>
            <span>Utilisateurs</span>
          </div>
          <div className="stat-box">
            <strong>300+</strong>
            <span>Services</span>
          </div>
          <div className="stat-box">
            <strong>50+</strong>
            <span>Villes couvertes</span>
          </div>
        </div>
      </div>

      {/* ===== CATEGORIES ===== */}
      <section className="home-section container-boxed">
        <div className="section-header">
          <h2>Explorez nos catégories</h2>
          <p>Tout ce dont vous avez besoin pour votre habitat, réparti dans trois catégories principales pour faciliter votre recherche.</p>
        </div>
        
        <div className="cat-cards-grid">
          <Link to="/categories/house_rental" className="modern-cat-card">
            <img src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=800" alt="Immobilier" className="cat-bg-img" />
            <div className="cat-card-overlay">
              <div className="cat-card-icon"><Home size={28} color="white" /></div>
              <h3>Immobilier</h3>
              <p>Appartements, villas et maisons à louer ou à vendre.</p>
            </div>
          </Link>

          <Link to="/categories/furniture_rental" className="modern-cat-card">
            <img src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800" alt="Meubles" className="cat-bg-img" />
            <div className="cat-card-overlay">
              <div className="cat-card-icon" style={{background: '#e94848'}}><Armchair size={28} color="white" /></div>
              <h3>Meubles</h3>
              <p>Salons marocains, chambres et électroménagers.</p>
            </div>
          </Link>

          <Link to="/categories/home_service" className="modern-cat-card">
            <img src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=800" alt="Services" className="cat-bg-img" />
            <div className="cat-card-overlay">
              <div className="cat-card-icon" style={{background: '#16a864'}}><Wrench size={28} color="white" /></div>
              <h3>Services Maison</h3>
              <p>Ménage, plomberie, électricité et jardinage.</p>
            </div>
          </Link>
        </div>
      </section>



      {/* ===== WHY CHOOSE US ===== */}
      <section className="home-section container-boxed">
        <div className="section-header">
          <h2>Pourquoi choisir DariHub ?</h2>
          <p>Nous simplifions votre quotidien avec une plateforme sécurisée et facile à utiliser.</p>
        </div>

        <div className="features-grid">
          <div className="feature-box">
            <div className="feature-icon-wrap"><Zap size={32} /></div>
            <h3>Rapide</h3>
            <p>Trouvez ce que vous cherchez en quelques clics grâce à notre moteur de recherche avancé.</p>
          </div>
          <div className="feature-box">
            <div className="feature-icon-wrap"><ShieldCheck size={32} /></div>
            <h3>Sécurisé</h3>
            <p>Des annonces modérées et des profils vérifiés pour une confiance totale.</p>
          </div>
          <div className="feature-box">
            <div className="feature-icon-wrap"><Search size={32} /></div>
            <h3>Simple</h3>
            <p>Une interface claire et intuitive pensée pour tous les utilisateurs.</p>
          </div>
          <div className="feature-box">
            <div className="feature-icon-wrap"><Globe size={32} /></div>
            <h3>Partout au Maroc</h3>
            <p>De Tanger à Lagouira, trouvez des services dans plus de 50 villes marocaines.</p>
          </div>
        </div>
      </section>



      {/* ===== CONTACT US ===== */}
      <section className="app-cta-section container-boxed" id="contact">
        <div className="app-cta-card" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #7c2d12 100%)', alignItems: 'flex-start' }}>
          <div className="app-cta-content" style={{ flex: 1 }}>
            <h2>Contactez-nous</h2>
            <p>Une question, une suggestion ou besoin d'assistance ? Remplissez le formulaire et notre équipe vous répondra dans les plus brefs délais.</p>
            
            <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Mail size={24} /> <span>contact@darihub.ma</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Phone size={24} /> <span>+212 5 22 00 00 00</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <MapPin size={24} /> <span>Centre d'innovation, Casablanca, Maroc</span>
              </div>
            </div>
          </div>
          
          <div style={{ flex: 1, width: '100%', maxWidth: '450px', background: 'var(--surface)', padding: '32px', borderRadius: 'var(--radius-lg)', color: 'var(--text)', boxShadow: 'var(--shadow-xl)' }}>
            <h3 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: '700' }}>Envoyez-nous un message</h3>
            <form onSubmit={(e) => { e.preventDefault(); alert('Message envoyé avec succès !'); e.target.reset(); }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: '600' }}>Nom complet</label>
                <input type="text" required placeholder="Votre nom" style={{ padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', width: '100%' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: '600' }}>Email</label>
                <input type="email" required placeholder="votre@email.com" style={{ padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', width: '100%' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: '600' }}>Message</label>
                <textarea required rows="4" placeholder="Comment pouvons-nous vous aider ?" style={{ padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', width: '100%', resize: 'none' }} />
              </div>
              <button type="submit" className="primary-button" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px' }}>
                <Send size={18} /> Envoyer le message
              </button>
            </form>
          </div>
        </div>
      </section>

    </div>
  )
}
