import { useNavigate } from 'react-router-dom'
import { MapPin, Heart } from 'lucide-react'
import { billingUnitLabels, formatPrice, serviceTypeConfig } from '../lib/marketplace'

export default function ServiceCard({
  service,
  isFavorite,
  isActive,
  onSelect,
  onToggleFavorite,
  whatsappLink,
  canFavorite = false,
  currentUser,
  onWhatsAppClick,
}) {
  const typeCfg = serviceTypeConfig[service.service_type]
  const navigate = useNavigate()

  function handleWhatsApp(e) {
    if (!currentUser) {
      e.preventDefault()
      navigate('/login', { state: { from: 'whatsapp' } })
      return
    }
    if (onWhatsAppClick && onWhatsAppClick() === false) {
      e.preventDefault()
    }
  }

  return (
    <article className={isActive ? 'listing-card active' : 'listing-card'}>
      <button
        type="button"
        className="listing-body"
        onClick={() => onSelect(service)}
      >
        <div
          className="listing-image"
          style={{
            backgroundImage: service.image_url
              ? `url(${service.image_url})`
              : `linear-gradient(135deg, ${typeCfg?.color ?? '#eee'} 0%, #fff 100%)`,
          }}
        >
          {!service.image_url ? (
            <span className="listing-image-placeholder">{typeCfg?.icon}</span>
          ) : null}
          {service.is_featured ? <span className="listing-badge">Top</span> : null}
        </div>

        <div className="listing-content">
          <h3 className="listing-title">{service.title}</h3>
          <div className="listing-price">{formatPrice(service.price)}</div>
          <p className="listing-meta" style={{alignItems:'center'}}>
            <span style={{display:'flex', alignItems:'center', gap:'4px'}}><MapPin size={12} /> {service.location_city}</span>
            {service.billing_unit ? (
              <>
                <span className="dot">·</span>
                <span>{billingUnitLabels[service.billing_unit]}</span>
              </>
            ) : null}
          </p>
          <p className="listing-category">
            <span
              className="category-chip"
              style={{ background: typeCfg?.color, color: typeCfg?.accent }}
            >
              {typeCfg?.label ?? service.service_type}
            </span>
            {service.category ? (
              <span className="listing-subcat">{service.category}</span>
            ) : null}
          </p>
        </div>
      </button>

      <div className="listing-actions">
        {canFavorite ? (
          <button
            type="button"
            className={isFavorite ? 'fav-btn active' : 'fav-btn'}
            onClick={() => onToggleFavorite(service.id)}
            aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} strokeWidth={2} />
          </button>
        ) : null}
        {service.source_url ? (
          <a className="wa-btn" href={service.source_url} target="_blank" rel="noreferrer">
            Voir le site
          </a>
        ) : whatsappLink ? (
          <a
            className="wa-btn"
            href={currentUser ? whatsappLink : '#'}
            target={currentUser ? '_blank' : '_self'}
            rel="noreferrer"
            onClick={handleWhatsApp}
          >
            WhatsApp
          </a>
        ) : null}
      </div>
    </article>
  )
}
