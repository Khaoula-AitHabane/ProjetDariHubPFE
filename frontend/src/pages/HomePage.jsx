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
    navigate(`/categories/${searchCategory === 'all' ? 'house_rental' : searchCategory}`)
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
              <li><Link to="/categories/house_rental"><Home size={18} className="list-icon" /> Location <ChevronRight size={18} className="chevron" /></Link></li>
              <li><Link to="/categories/house_rental"><Building size={18} className="list-icon" /> Vente <ChevronRight size={18} className="chevron" /></Link></li>
              <li><Link to="/categories/house_rental"><Building size={18} className="list-icon" /> Appartements <ChevronRight size={18} className="chevron" /></Link></li>
              <li><Link to="/categories/house_rental"><Home size={18} className="list-icon" /> Villas <ChevronRight size={18} className="chevron" /></Link></li>
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
              <li><Link to="/categories/furniture_rental"><Armchair size={18} className="list-icon" /> Neuf <ChevronRight size={18} className="chevron" /></Link></li>
              <li><Link to="/categories/furniture_rental"><Armchair size={18} className="list-icon" /> Occasion <ChevronRight size={18} className="chevron" /></Link></li>
              <li><Link to="/categories/furniture_rental"><Armchair size={18} className="list-icon" /> Canapés <ChevronRight size={18} className="chevron" /></Link></li>
              <li><Link to="/categories/furniture_rental"><Armchair size={18} className="list-icon" /> Tables <ChevronRight size={18} className="chevron" /></Link></li>
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
          {/* Ad 1 */}
          <div className="ad-card">
            <div className="ad-image">
              <img src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=600" alt="Appartement meublé" />
              <span className="ad-badge badge-rent">À Louer</span>
            </div>
            <div className="ad-content">
              <h4>Appartement meublé</h4>
              <div className="ad-location"><MapPin size={14} /> Casablanca</div>
              <div className="ad-price">5 500 DH / mois</div>
            </div>
          </div>

          {/* Ad 2 */}
          <div className="ad-card">
            <div className="ad-image">
              <img src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=600" alt="Villa moderne" />
              <span className="ad-badge badge-sale">À Vendre</span>
            </div>
            <div className="ad-content">
              <h4>Villa moderne</h4>
              <div className="ad-location"><MapPin size={14} /> Marrakech</div>
              <div className="ad-price">2 450 000 DH</div>
            </div>
          </div>

          {/* Ad 3 */}
          <div className="ad-card">
            <div className="ad-image">
              <img src="https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&q=80&w=600" alt="Canapé d'angle" />
              <span className="ad-badge badge-new">Neuf</span>
            </div>
            <div className="ad-content">
              <h4>Canapé d'angle</h4>
              <div className="ad-location"><MapPin size={14} /> Rabat</div>
              <div className="ad-price">4 200 DH</div>
            </div>
          </div>

          {/* Ad 4 */}
          <div className="ad-card">
            <div className="ad-image">
              <img src="https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&q=80&w=600" alt="Installation électrique" />
              <span className="ad-badge badge-service">Service</span>
            </div>
            <div className="ad-content">
              <h4>Installation électrique</h4>
              <div className="ad-location"><MapPin size={14} /> Casablanca</div>
              <div className="ad-price">À partir de 250 DH</div>
            </div>
          </div>
          
          {/* Ad 5 (Nettoyage complet) as seen in mockup is actually the 4th card, but I'll stick to 4. Oh wait, the mockup has 4 cards. 
              Let's update Ad 4 to the cleaning one or keep electrical, actually the mockup shows 4: Appartement, Villa, Canapé, and a 4th one (Installation electrique) and a 5th? Wait, looking at the image: 
              Appartement (A Louer), Villa (A Vendre), Canapé (Neuf), Installation (Service), Nettoyage (Service). It has 5 cards? No, it's a 4 column layout and some might be scrolled or it's 5 columns. Let's make it 4 or 5 columns. 
              Looking closely, there's 5 cards in a row? No, Appartement meuble, Villa moderne, Canapé d'angle, Installation electrique, Nettoyage complet. 
              Actually, the image shows 4 cards visible and a piece of a 5th? No, it's perfectly 4 cards or 5 cards. Let me count:
              1. Appartement, 2. Villa, 3. Canape, 4. Installation electrique. Wait, next to it is Nettoyage complet. So it's 5 cards.
              Let's add the 5th one. */}
           <div className="ad-card">
            <div className="ad-image">
              <img src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=600" alt="Nettoyage complet" />
              <span className="ad-badge badge-service">Service</span>
            </div>
            <div className="ad-content">
              <h4>Nettoyage complet</h4>
              <div className="ad-location"><MapPin size={14} /> Tanger</div>
              <div className="ad-price">À partir de 200 DH</div>
            </div>
          </div>

        </div>

        <div className="view-more-container">
          <Link to="/categories/house_rental" className="btn-view-more">Voir plus d'annonces</Link>
        </div>
      </section>

    </div>
  )
}
