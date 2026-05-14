import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MapPin, Heart, Lock } from 'lucide-react'
import { useMarketplace } from '../context/MarketplaceContext'
import {
  formatDate,
  formatPrice,
  serviceTypeConfig,
} from '../lib/marketplace'
import ServiceMap from './ServiceMap'

export default function ServiceDetailPanel({ service }) {
  const {
    currentUser,
    favorites,
    toggleFavorite,
    getWhatsAppLink,
    bookingForm,
    updateBookingField,
    submitBooking,
    bookingSubmitting,
    bookingFeedback,
    getCommentsForService,
    addComment,
    deleteComment,
  } = useMarketplace()
  const [newComment, setNewComment] = useState('')
  const navigate = useNavigate()

  async function handleBookingSubmit(event) {
    event.preventDefault()
    await submitBooking()
  }

  function handleWhatsApp(e) {
    if (!currentUser) {
      e.preventDefault()
      navigate('/login', { state: { from: 'whatsapp' } })
    }
  }

  if (!service) {
    return (
      <aside className="card detail-panel">
        <div className="empty-box">Choisis une annonce pour voir le détail.</div>
      </aside>
    )
  }

  return (
    <aside className="card detail-panel">
      <div className="section-head">
        <div>
          <p className="small-label">Détail</p>
          <h2>{service.title}</h2>
        </div>
      </div>

      <div
        className="detail-image"
        style={{
          backgroundImage: service.image_url
            ? `linear-gradient(180deg, rgba(8, 17, 20, 0.08), rgba(8, 17, 20, 0.66)), url(${service.image_url})`
            : 'linear-gradient(135deg, #2e6a65 0%, #102425 100%)',
        }}
      />

      <p className="detail-description">{service.description}</p>

      <div className="detail-meta">
        <div>
          <span>Type</span>
          <strong>{serviceTypeConfig[service.service_type]?.label ?? service.service_type}</strong>
        </div>
        <div>
          <span>Prix</span>
          <strong>{formatPrice(service.price)}</strong>
        </div>
        <div>
          <span>Disponibilité</span>
          <strong>
            {formatDate(service.available_from)} - {formatDate(service.available_to)}
          </strong>
        </div>
      </div>

      <div className="feature-list">
        {(service.features ?? []).map((feature) => (
          <span key={feature}>{feature}</span>
        ))}
      </div>

      {/* ── Carte Google Maps ── */}
      <div className="detail-map-section">
        <h4 className="detail-map-title" style={{display:'flex', alignItems:'center', gap:'6px'}}><MapPin size={16} /> Localisation</h4>
        <ServiceMap service={service} />
      </div>

      <div className="detail-actions">
        {currentUser ? (
          <button
            type="button"
            className={favorites.includes(service.id) ? 'secondary-button' : 'primary-button'}
            onClick={() => toggleFavorite(service.id)}
          >
            {favorites.includes(service.id) ? <><Heart size={16} fill="currentColor" style={{verticalAlign:'text-bottom', marginRight:'6px'}}/> Déjà en favori</> : <><Heart size={16} style={{verticalAlign:'text-bottom', marginRight:'6px'}}/> Mettre en favori</>}
          </button>
        ) : null}
        {service.source_url ? (
          <a
            className="whatsapp-button"
            href={service.source_url}
            target="_blank"
            rel="noreferrer"
          >
            Voir sur le site
          </a>
        ) : (
          <a
            className="whatsapp-button"
            href={currentUser ? getWhatsAppLink(service) : '#'}
            target={currentUser ? '_blank' : '_self'}
            rel="noreferrer"
            onClick={handleWhatsApp}
          >
            {currentUser ? 'Contacter sur WhatsApp' : <><Lock size={16} style={{verticalAlign:'text-bottom', marginRight:'6px'}}/> Se connecter pour WhatsApp</>}
          </a>
        )}
      </div>

      {/* Commentaires */}
      <CommentsSection
        service={service}
        currentUser={currentUser}
        comments={getCommentsForService(service.id)}
        newComment={newComment}
        setNewComment={setNewComment}
        onAdd={() => {
          if (addComment(service.id, newComment)) setNewComment('')
        }}
        onDelete={(commentId) => deleteComment(service.id, commentId)}
      />

      {currentUser ? (
        <form className="booking-form" onSubmit={handleBookingSubmit}>
          <div className="two-columns">
            <label>
              <span>Date début</span>
              <input
                required
                type="date"
                name="startDate"
                value={bookingForm.startDate}
                onChange={(event) => updateBookingField('startDate', event.target.value)}
              />
            </label>

            <label>
              <span>Date fin</span>
              <input
                type="date"
                name="endDate"
                value={bookingForm.endDate}
                onChange={(event) => updateBookingField('endDate', event.target.value)}
              />
            </label>
          </div>

          <div className="two-columns">
            <label>
              <span>Quantité</span>
              <input
                min="1"
                max="30"
                type="number"
                name="quantity"
                value={bookingForm.quantity}
                onChange={(event) => updateBookingField('quantity', event.target.value)}
              />
            </label>

            <label>
              <span>Adresse</span>
              <input
                name="serviceAddress"
                value={bookingForm.serviceAddress}
                onChange={(event) => updateBookingField('serviceAddress', event.target.value)}
              />
            </label>
          </div>

          <label>
            <span>Notes</span>
            <textarea
              rows="3"
              name="notes"
              value={bookingForm.notes}
              onChange={(event) => updateBookingField('notes', event.target.value)}
            />
          </label>

          <button className="primary-button" type="submit" disabled={bookingSubmitting}>
            {bookingSubmitting ? 'Réservation...' : 'Réserver ce service'}
          </button>
        </form>
      ) : (
        <div className="empty-box">
          <Link to="/login">Connecte-toi</Link> pour réserver ou contacter via WhatsApp.
        </div>
      )}

      {bookingFeedback ? (
        <div className={bookingFeedback.type === 'success' ? 'feedback success' : 'feedback error'}>
          {bookingFeedback.message}
        </div>
      ) : null}
    </aside>
  )
}

function CommentsSection({
  currentUser,
  comments,
  newComment,
  setNewComment,
  onAdd,
  onDelete,
}) {
  return (
    <div className="comments-section">
      <h3 className="comments-title">
        Commentaires <span className="comments-count">({comments.length})</span>
      </h3>

      {comments.length === 0 ? (
        <p className="comments-empty">Aucun commentaire pour cette annonce.</p>
      ) : (
        <ul className="comments-list">
          {comments.map((c) => {
            const mine =
              currentUser &&
              c.authorId === (currentUser.id ?? currentUser.email)
            return (
              <li key={c.id} className="comment-item">
                <div className="comment-head">
                  <strong>{c.authorName}</strong>
                  <span className="comment-date">
                    {new Date(c.createdAt).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="comment-body">{c.body}</p>
                {mine ? (
                  <button
                    type="button"
                    className="comment-delete"
                    onClick={() => onDelete(c.id)}
                  >
                    Supprimer
                  </button>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}

      {currentUser ? (
        <form
          className="comment-form"
          onSubmit={(e) => {
            e.preventDefault()
            onAdd()
          }}
        >
          <textarea
            rows="2"
            placeholder="Écris un commentaire..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <button
            type="submit"
            className="primary-button"
            disabled={!newComment.trim()}
          >
            Publier
          </button>
        </form>
      ) : (
        <p className="comments-login">
          <Link to="/login">Connecte-toi</Link> pour écrire un commentaire.
        </p>
      )}
    </div>
  )
}
