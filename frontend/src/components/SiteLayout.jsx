import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Home, Armchair, Wrench, Heart, Settings, Sun, Moon, ClipboardList, LogOut, Mail, Globe, MapPin, Phone, User, Building } from 'lucide-react'
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

  const headerClass = `site-header ${isHomePage && !scrolled ? 'transparent-home' : ''}`

  return (
    <div className="app-shell">
      <header className={headerClass}>
        <div className="topbar">
          <NavLink to="/" className="nav-brand">
            <span className="nav-brand-dari">Dari</span>
            <span className="nav-brand-hub">Hub</span>
          </NavLink>

          <nav className="top-nav">
            <NavLink to="/" className={navClass}>
              <Home size={18} /> Home
            </NavLink>
            <NavLink to="/categories/house_rental" className={navClass}>
              <Building size={18} /> Immobilier
            </NavLink>
            <NavLink to="/categories/furniture_rental" className={navClass}>
              <Armchair size={18} /> Meubles
            </NavLink>
            <NavLink to="/services-maison" className={navClass}>
              <Wrench size={18} /> Services Maison
            </NavLink>
            {currentUser && (
              <>
                <NavLink to="/mes-annonces" className={navClass}>
                  <ClipboardList size={18} /> Mes Annonces
                </NavLink>
                {currentUser.role === 'admin' && (
                  <NavLink to="/admin" className={navClass}>
                    <span className="admin-badge-link" style={{display:'flex', alignItems:'center', gap:'4px'}}><Settings size={14} /> Admin</span>
                  </NavLink>
                )}
              </>
            )}
          </nav>

          <div className="top-actions">
            {!currentUser ? (
              <>
                <NavLink to="/register" className="btn-register">
                  <User size={16} /> Register
                </NavLink>
                <NavLink to="/login" className="btn-connect">
                  <User size={16} /> Se connecter
                </NavLink>
              </>
            ) : (
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
            )}
          </div>
        </div>
      </header>

      <main className="page-shell">
        <Outlet />
      </main>

      <footer className="site-footer new-footer">
        <div className="footer-container">
          <div className="footer-col footer-contact">
            <h4>Contact</h4>
            <div className="footer-contact-items">
              <div className="contact-item">
                <Mail size={18} /> <span>contact@darihub.com</span>
              </div>
              <div className="contact-item">
                <Phone size={18} /> <span>+212 6 00 00 00 00</span>
              </div>
              <div className="contact-item">
                <MapPin size={18} /> <span>Maroc</span>
              </div>
            </div>
          </div>
          
          <div className="footer-col footer-social">
            <h4>Suivez-nous</h4>
            <div className="social-icons">
              <a href="#" className="social-btn facebook">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              </a>
              <a href="#" className="social-btn instagram">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </a>
              <a href="#" className="social-btn linkedin">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
              </a>
              <a href="#" className="social-btn youtube">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
              </a>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom-bar">
          <p>&copy; {new Date().getFullYear()} DariHub. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  )
}
