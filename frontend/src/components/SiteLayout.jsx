import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Home, Armchair, Wrench, Heart, Settings, Sun, Moon, ClipboardList, LogOut, Mail, Globe, MapPin, Phone } from 'lucide-react'
import { useMarketplace } from '../context/MarketplaceContext'
import { roleLabels } from '../lib/marketplace'

function navClass({ isActive }) {
  return isActive ? 'top-link active' : 'top-link'
}

export default function SiteLayout() {
  const { currentUser, logout, darkMode, toggleDarkMode } = useMarketplace()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const isHomePage = location.pathname === '/'

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const initials = currentUser?.name
    ? currentUser.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : ''

  const headerClass = `site-header ${isHomePage && !scrolled ? 'transparent' : ''}`

  return (
    <div className="app-shell">
      <header className={headerClass}>
        <div className="topbar">
          <NavLink to="/" className="nav-brand">
            <span className="nav-brand-dari">Dari</span>
            <span className="nav-brand-hub">Hub</span>
          </NavLink>

          <nav className="top-nav">
            <NavLink to="/categories/house_rental" className={navClass}>
              Immobilier
            </NavLink>
            <NavLink to="/categories/furniture_rental" className={navClass}>
              Meubles
            </NavLink>
            <NavLink to="/categories/home_service" className={navClass}>
              Services maison
            </NavLink>
            {currentUser ? (
              <>
                <NavLink to="/mes-annonces" className={navClass}>Mes annonces</NavLink>
                {currentUser.role === 'admin' && (
                  <NavLink to="/admin" className={navClass}>
                    <span className="admin-badge-link" style={{display:'flex', alignItems:'center', gap:'4px'}}><Settings size={14} /> Admin</span>
                  </NavLink>
                )}
              </>
            ) : null}
          </nav>

          <div className="top-actions">
            <button
              type="button"
              className="theme-toggle"
              onClick={toggleDarkMode}
              aria-label={darkMode ? 'Mode clair' : 'Mode sombre'}
              title={darkMode ? 'Passer en mode clair' : 'Passer en mode sombre'}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {currentUser ? (
              <div className="user-menu-wrapper">
                <button
                  type="button"
                  className="user-avatar-btn"
                  onClick={() => setMenuOpen((o) => !o)}
                  aria-expanded={menuOpen}
                >
                  <span className="user-avatar">{initials}</span>
                  <span className="user-name-short">{currentUser.name.split(' ')[0]}</span>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                    <path d="M6 8L1 3h10z"/>
                  </svg>
                </button>

                {menuOpen && (
                  <div className="user-dropdown" onClick={() => setMenuOpen(false)}>
                    <div className="dropdown-header">
                      <strong>{currentUser.name}</strong>
                      <span>{roleLabels[currentUser.role] ?? currentUser.role}</span>
                    </div>
                    <NavLink to="/mes-annonces" className="dropdown-item">
                      <ClipboardList size={16} /> Mes annonces
                    </NavLink>
                    <NavLink to="/favoris" className="dropdown-item">
                      <Heart size={16} /> Favoris
                    </NavLink>
                    {currentUser.role === 'admin' && (
                      <NavLink to="/admin" className="dropdown-item">
                        <Settings size={16} /> Dashboard Admin
                      </NavLink>
                    )}
                    <button
                      type="button"
                      className="dropdown-item dropdown-logout"
                      onClick={logout}
                    >
                      <LogOut size={16} /> Déconnexion
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <NavLink to="/login" className="btn-connect">
                Se connecter
              </NavLink>
            )}
          </div>
        </div>
      </header>

      <main className="page-shell">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="footer-grid">
          <div className="footer-col">
            <div className="nav-brand" style={{ marginBottom: '16px' }}>
              <span className="nav-brand-dari">Dari</span>
              <span className="nav-brand-hub">Hub</span>
            </div>
            <p>La première marketplace marocaine qui centralise l'immobilier, la location de meubles et les prestataires de services à domicile.</p>
            <div className="social-links" style={{ marginTop: '16px' }}>
              <a href="#" className="social-icon">Facebook</a>
              <a href="#" className="social-icon">Twitter</a>
              <a href="#" className="social-icon">Instagram</a>
              <a href="#" className="social-icon">LinkedIn</a>
            </div>
          </div>
          
          <div className="footer-col">
            <h4>Explorer</h4>
            <NavLink to="/categories/house_rental" className="footer-link">Immobilier</NavLink>
            <NavLink to="/categories/furniture_rental" className="footer-link">Meubles</NavLink>
            <NavLink to="/categories/home_service" className="footer-link">Services maison</NavLink>
            <NavLink to="/register" className="footer-link">Publier une annonce</NavLink>
          </div>
          
          <div className="footer-col">
            <h4>Support</h4>
            <a href="#" className="footer-link">Centre d'aide</a>
            <a href="#" className="footer-link">Conditions générales</a>
            <a href="#" className="footer-link">Politique de confidentialité</a>
            <a href="#" className="footer-link">Contactez-nous</a>
          </div>
          
          <div className="footer-col">
            <h4>Nos Informations</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem', color: 'var(--text-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={16} /> <span>Centre d'innovation, Casablanca, Maroc</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={16} /> <span>contact@darihub.ma</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={16} /> <span>+212 5 22 00 00 00</span>
              </div>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          &copy; {new Date().getFullYear()} DariHub. Tous droits réservés. Plateforme développée dans le cadre du Projet de Fin d'Études.
        </div>
      </footer>
    </div>
  )
}
