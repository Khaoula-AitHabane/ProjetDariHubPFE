import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { ClipboardList } from 'lucide-react'
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

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm((current) => ({ ...current, [name]: value }))
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
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
    setFeedback(null)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.price) {
      setFeedback({ type: 'error', message: 'Titre et prix requis.' })
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
      setFeedback({ type: 'success', message: 'Annonce modifiee avec succes.' })
    } else {
      createUserListing(form)
      setFeedback({ type: 'success', message: 'Annonce publiee avec succes.' })
    }

    setEditingId(null)
    setForm(emptyForm)
  }

  function handleDelete(id) {
    if (window.confirm('Supprimer definitivement cette annonce ?')) {
      deleteUserListing(id)
      if (editingId === id) cancelEdit()
    }
  }

  return (
    <div className="home-page">
      <section
        className="category-banner"
        style={{ background: '#eaf4ff', color: '#1d4ed8' }}
      >
        <div className="category-banner-inner">
          <ClipboardList size={48} className="category-banner-icon" />
          <div>
            <h1>Mes annonces</h1>
            <p>Publie, modifie ou supprime tes propres annonces.</p>
          </div>
        </div>
      </section>

      {/* Formulaire */}
      <section className="listings-section">
        <div className="section-head">
          <h2>{editingId ? 'Modifier l annonce' : 'Publier une annonce'}</h2>
          {editingId ? (
            <button type="button" className="ghost-button" onClick={cancelEdit}>
              Annuler
            </button>
          ) : null}
        </div>

        <form className="my-listing-form" onSubmit={handleSubmit}>
          <div className="two-columns">
            <label>
              <span>Titre *</span>
              <input
                required
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Ex: Appartement 3 chambres a Maarif"
              />
            </label>
            <label>
              <span>Categorie *</span>
              <select name="serviceType" value={form.serviceType} onChange={handleChange}>
                {serviceTypeMenu.map((cat) => (
                  <option key={cat.key} value={cat.key}>{cat.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="two-columns">
            <label>
              <span>Sous-categorie</span>
              <input
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder="Ex: Appartement, Salon, Plomberie..."
              />
            </label>
            <label>
              <span>Prix (MAD) *</span>
              <input
                required
                type="number"
                min="0"
                name="price"
                value={form.price}
                onChange={handleChange}
              />
            </label>
          </div>

          <div className="two-columns">
            <label>
              <span>Ville</span>
              <input
                name="locationCity"
                value={form.locationCity}
                onChange={handleChange}
                placeholder="Casablanca, Rabat..."
              />
            </label>
            <label>
              <span>Adresse / quartier</span>
              <input
                name="locationAddress"
                value={form.locationAddress}
                onChange={handleChange}
                placeholder="Maarif, Casablanca"
              />
            </label>
          </div>

          <label>
            <span>URL image (optionnel)</span>
            <input
              name="imageUrl"
              value={form.imageUrl}
              onChange={handleChange}
              placeholder="https://..."
            />
          </label>

          <label>
            <span>Description</span>
            <textarea
              rows="3"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Decris ton annonce..."
            />
          </label>

          <button type="submit" className="primary-button">
            {editingId ? 'Enregistrer les modifications' : 'Publier l annonce'}
          </button>

          {feedback ? (
            <div className={feedback.type === 'success' ? 'feedback success' : 'feedback error'}>
              {feedback.message}
            </div>
          ) : null}
        </form>
      </section>

      {/* Liste des annonces */}
      <section className="listings-section">
        <div className="section-head">
          <h2>Mes annonces publiees</h2>
          <span className="result-count">{myListings.length} annonce(s)</span>
        </div>

        {myListings.length === 0 ? (
          <div className="empty-state">
            <h3>Tu n as pas encore publie d annonce</h3>
            <p>Utilise le formulaire ci-dessus pour creer ta premiere annonce.</p>
          </div>
        ) : (
          <div className="my-listings-grid">
            {myListings.map((listing) => (
              <article key={listing.id} className="my-listing-row">
                <div
                  className="my-listing-image"
                  style={{
                    backgroundImage: listing.image_url
                      ? `url(${listing.image_url})`
                      : 'linear-gradient(135deg, #e0e7ff, #f9fafb)',
                  }}
                />
                <div className="my-listing-info">
                  <h4>{listing.title}</h4>
                  <p className="listing-price">{formatPrice(listing.price)}</p>
                  <p className="listing-meta">
                    {listing.location_city} · {listing.category || listing.service_type}
                  </p>
                </div>
                <div className="my-listing-actions">
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => startEdit(listing)}
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    className="danger-button"
                    onClick={() => handleDelete(listing.id)}
                  >
                    Supprimer
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
