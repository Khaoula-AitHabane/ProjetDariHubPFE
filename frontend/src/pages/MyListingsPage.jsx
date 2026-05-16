import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { MapPin, Edit2, Trash2, PlusCircle, ShieldCheck, BrainCircuit, Star, Lock } from 'lucide-react'
import { useMarketplace } from '../context/MarketplaceContext'
import { formatPrice, serviceTypeMenu } from '../lib/marketplace'

const emptyForm = {
  title: '',
  description: '',
  serviceType: 'house_rental',
  category: '',
  locationCity: '',
  locationAddress: '',
  price: '',
  imageUrl: '',
}

export default function MyListingsPage() {
  const {
    currentUser,
    myListings,
    createUserListing,
    updateUserListing,
    deleteUserListing,
  } = useMarketplace()

  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function handleImageFile(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setForm((current) => ({ ...current, imageUrl: ev.target.result }))
      setImagePreview(ev.target.result)
    }
    reader.readAsDataURL(file)
  }

  function startEdit(listing) {
    setEditingId(listing.id)
    setForm({
      title: listing.title,
      description: listing.description,
      serviceType: listing.service_type,
      category: listing.category,
      locationCity: listing.location_city,
      locationAddress: listing.location_address ?? '',
      price: String(listing.price),
      imageUrl: listing.image_url ?? '',
    })
    setImagePreview(listing.image_url ?? null)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
    setFeedback(null)
    setShowForm(false)
    setImagePreview(null)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) {
      setFeedback({ type: 'error', message: 'Le titre est obligatoire.' })
      return
    }
    if (!form.category.trim()) {
      setFeedback({ type: 'error', message: 'La sous-catégorie est obligatoire.' })
      return
    }
    if (!form.price) {
      setFeedback({ type: 'error', message: 'Le prix est obligatoire.' })
      return
    }
    if (!form.locationCity) {
      setFeedback({ type: 'error', message: 'La ville est obligatoire.' })
      return
    }
    if (!form.locationAddress.trim()) {
      setFeedback({ type: 'error', message: "L'adresse est obligatoire." })
      return
    }
    if (!form.imageUrl) {
      setFeedback({ type: 'error', message: "L'image est obligatoire." })
      return
    }
    if (!form.description.trim()) {
      setFeedback({ type: 'error', message: 'La description est obligatoire.' })
      return
    }

    if (editingId) {
      updateUserListing(editingId, {
        title: form.title,
        description: form.description,
        service_type: form.serviceType,
        category: form.category,
        location_city: form.locationCity,
        location_address: form.locationAddress,
        price: form.price,
        image_url: form.imageUrl || null,
      })
      setFeedback({ type: 'success', message: 'Annonce modifiée avec succès.' })
    } else {
      createUserListing(form)
      setFeedback({ type: 'success', message: 'Annonce publiée avec succès.' })
    }

    setEditingId(null)
    setForm(emptyForm)
    setTimeout(() => {
      setShowForm(false)
      setFeedback(null)
    }, 2000)
  }

  function handleDelete(id) {
    if (window.confirm('Supprimer définitivement cette annonce ?')) {
      deleteUserListing(id)
      if (editingId === id) cancelEdit()
    }
  }

  return (
    <div className="home-page-redesign" style={{ backgroundColor: '#f9fafb', minHeight: '100vh', paddingBottom: '40px' }}>
      
      {/* ===== HERO SECTION ===== */}
      <section style={{ backgroundColor: '#fff', paddingTop: '60px', paddingBottom: '40px', borderRadius: '0 0 24px 24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', marginBottom: '40px' }}>
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center', padding: '0 20px' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#111827', marginBottom: '16px' }}>
            Gérez vos annonces
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#6b7280', marginBottom: '32px' }}>
            Retrouvez, modifiez ou supprimez vos annonces en toute simplicité
          </p>
          
          {!showForm && (
            <button 
              onClick={() => setShowForm(true)}
              className="btn-search-primary" 
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: '600' }}
            >
              <PlusCircle size={20} />
              Déposer une nouvelle annonce
            </button>
          )}
        </div>
      </section>

      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        
        {/* Formulaire */}
        {showForm && (
          <section className="listings-section" style={{ backgroundColor: '#fff', padding: '32px', borderRadius: '16px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', marginBottom: '40px' }}>
            <div className="section-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>{editingId ? 'Modifier l\'annonce' : 'Publier une annonce'}</h2>
              <button type="button" className="ghost-button" onClick={cancelEdit} style={{ color: '#6b7280', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: '500' }}>
                Annuler
              </button>
            </div>

            <form className="my-listing-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontWeight: '500', color: '#374151' }}>
                  <span>Titre <span style={{color:'#dc2626'}}>*</span></span>
                  <input
                    required
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="Ex: Appartement 3 chambres à Maarif"
                    style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                  />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontWeight: '500', color: '#374151' }}>
                  <span>Catégorie <span style={{color:'#dc2626'}}>*</span></span>
                  <select required name="serviceType" value={form.serviceType} onChange={handleChange} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#fff' }}>
                    {serviceTypeMenu.map((cat) => (
                      <option key={cat.key} value={cat.key}>{cat.label}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontWeight: '500', color: '#374151' }}>
                  <span>Sous-catégorie <span style={{color:'#dc2626'}}>*</span></span>
                  <input
                    required
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    placeholder="Ex: Appartement, Salon, Plomberie..."
                    style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                  />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontWeight: '500', color: '#374151' }}>
                  <span>Prix (MAD) <span style={{color:'#dc2626'}}>*</span></span>
                  <input
                    required
                    type="number"
                    min="0"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                  />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontWeight: '500', color: '#374151' }}>
                  <span>Ville <span style={{color:'#dc2626'}}>*</span></span>
                  <select
                    required
                    name="locationCity"
                    value={form.locationCity}
                    onChange={handleChange}
                    style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#fff' }}
                  >
                    <option value="">-- Choisir une ville --</option>
                    <option value="Casablanca">Casablanca</option>
                    <option value="Rabat">Rabat</option>
                    <option value="Marrakech">Marrakech</option>
                    <option value="Fès">Fès</option>
                    <option value="Tanger">Tanger</option>
                    <option value="Agadir">Agadir</option>
                    <option value="Meknès">Meknès</option>
                    <option value="Oujda">Oujda</option>
                    <option value="Kenitra">Kénitra</option>
                    <option value="Tétouan">Tétouan</option>
                    <option value="Safi">Safi</option>
                    <option value="El Jadida">El Jadida</option>
                    <option value="Béni Mellal">Béni Mellal</option>
                    <option value="Settat">Settat</option>
                    <option value="Nador">Nador</option>
                    <option value="Mohammedia">Mohammedia</option>
                  </select>
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontWeight: '500', color: '#374151' }}>
                  <span>Adresse / quartier <span style={{color:'#dc2626'}}>*</span></span>
                  <input
                    required
                    name="locationAddress"
                    value={form.locationAddress}
                    onChange={handleChange}
                    placeholder="Maarif, Casablanca"
                    style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                  />
                </label>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontWeight: '500', color: '#374151' }}>Image <span style={{color:'#dc2626'}}>*</span></span>
                <label
                  htmlFor="imageFileInput"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    padding: '20px',
                    borderRadius: '12px',
                    border: `2px dashed ${!imagePreview ? '#f97316' : '#d1d5db'}`,
                    backgroundColor: '#f9fafb',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s',
                    minHeight: '120px',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#f97316'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#d1d5db'}
                >
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Aperçu"
                      style={{ maxHeight: '160px', maxWidth: '100%', borderRadius: '8px', objectFit: 'cover' }}
                    />
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                      <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Cliquer pour choisir une image</span>
                      <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>PNG, JPG, WEBP — max 5 MB</span>
                    </>
                  )}
                </label>
                <input
                  id="imageFileInput"
                  type="file"
                  accept="image/*"
                  onChange={handleImageFile}
                  style={{ display: 'none' }}
                />
                {imagePreview && (
                  <button
                    type="button"
                    onClick={() => { setImagePreview(null); setForm(f => ({ ...f, imageUrl: '' })) }}
                    style={{ alignSelf: 'flex-start', fontSize: '0.8rem', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    ✕ Supprimer l'image
                  </button>
                )}
              </div>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontWeight: '500', color: '#374151' }}>
                <span>Description <span style={{color:'#dc2626'}}>*</span></span>
                <textarea
                  required
                  rows="3"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Décris ton annonce..."
                  style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db', resize: 'vertical' }}
                />
              </label>

              <button type="submit" className="btn-search-primary" style={{ padding: '12px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: '600', alignSelf: 'flex-start' }}>
                {editingId ? 'Enregistrer les modifications' : 'Publier l\'annonce'}
              </button>

              {feedback ? (
                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: feedback.type === 'success' ? '#d1fae5' : '#fee2e2', color: feedback.type === 'success' ? '#065f46' : '#991b1b', marginTop: '16px' }}>
                  {feedback.message}
                </div>
              ) : null}
            </form>
          </section>
        )}

        {/* Liste des annonces */}
        <section className="section-latest" style={{ padding: 0 }}>
          <div className="section-title-wrapper" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 className="section-title" style={{ margin: 0, fontSize: '1.5rem' }}>Mes annonces</h3>
            <span style={{ backgroundColor: '#e5e7eb', padding: '4px 12px', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>
              {myListings.length} annonce(s)
            </span>
          </div>

          {myListings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
              <h3 style={{ fontSize: '1.25rem', color: '#374151', marginBottom: '8px' }}>Tu n'as pas encore publié d'annonce</h3>
              <p style={{ color: '#6b7280', marginBottom: '24px' }}>Utilise le bouton "Déposer une nouvelle annonce" pour commencer.</p>
              <button 
                onClick={() => setShowForm(true)}
                className="btn-search-primary" 
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: '600' }}
              >
                <PlusCircle size={18} />
                Publier une annonce
              </button>
            </div>
          ) : (
            <div className="latest-grid">
              {myListings.map((listing) => (
                <div key={listing.id} className="ad-card" style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
                  <div className="ad-image" style={{ height: '200px' }}>
                    <img 
                      src={listing.image_url || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=600'} 
                      alt={listing.title} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <span className={`ad-badge ${listing.service_type === 'house_rental' ? 'badge-rent' : listing.service_type === 'furniture_rental' ? 'badge-new' : 'badge-service'}`}>
                      {listing.category || (listing.service_type === 'house_rental' ? 'Immobilier' : listing.service_type === 'furniture_rental' ? 'Meubles' : 'Services')}
                    </span>
                  </div>
                  <div className="ad-content" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <h4 style={{ fontSize: '1.1rem', marginBottom: '8px', color: '#111827', fontWeight: '600' }}>{listing.title}</h4>
                    <div className="ad-location" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6b7280', fontSize: '0.875rem', marginBottom: '12px' }}>
                      <MapPin size={14} /> {listing.location_city}
                    </div>
                    <div className="ad-price" style={{ color: '#2563eb', fontWeight: '700', fontSize: '1.1rem', marginTop: 'auto' }}>
                      {formatPrice(listing.price)}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f3f4f6' }}>
                      <button
                        type="button"
                        onClick={() => startEdit(listing)}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: '#fff', color: '#374151', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500' }}
                      >
                        <Edit2 size={16} />
                        Modifier
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(listing.id)}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', borderRadius: '6px', border: '1px solid #fca5a5', backgroundColor: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500' }}
                      >
                        <Trash2 size={16} />
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Features Section (Like Mockup) */}
        <section style={{ marginTop: '60px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: '#f0f9ff', padding: '20px', borderRadius: '12px' }}>
            <div style={{ color: '#0369a1' }}><ShieldCheck size={32} /></div>
            <div>
              <h4 style={{ fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>Annonces vérifiées</h4>
              <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Des annonces fiables et vérifiées</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: '#f5f3ff', padding: '20px', borderRadius: '12px' }}>
            <div style={{ color: '#6d28d9' }}><BrainCircuit size={32} /></div>
            <div>
              <h4 style={{ fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>Recherche intelligente</h4>
              <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Trouvez exactement ce que vous cherchez</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: '#fffbeb', padding: '20px', borderRadius: '12px' }}>
            <div style={{ color: '#b45309' }}><Star size={32} /></div>
            <div>
              <h4 style={{ fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>Recommandations</h4>
              <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Des suggestions personnalisées</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: '#f0fdf4', padding: '20px', borderRadius: '12px' }}>
            <div style={{ color: '#15803d' }}><Lock size={32} /></div>
            <div>
              <h4 style={{ fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>Paiement sécurisé</h4>
              <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Vos transactions sont protégées</p>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
