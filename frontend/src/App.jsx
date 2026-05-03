import { startTransition, useDeferredValue, useEffect, useState } from 'react'
import './App.css'
import { fallbackOverview, fallbackServices } from './data/fallbackData'

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

const serviceTypeLabels = {
  house_rental: 'Location de maisons',
  furniture_rental: 'Location de mafrouchat',
  home_service: 'Services a domicile',
}

const billingUnitLabels = {
  per_night: '/ nuit',
  per_day: '/ jour',
  per_service: '/ prestation',
}

const roleCards = [
  {
    title: 'Client',
    description:
      'Recherche, compare et reserve rapidement selon le prix, la ville, la disponibilite et le type de prestation.',
  },
  {
    title: 'Prestataire',
    description:
      'Publie ses offres, suit ses reservations et gere sa visibilite sur les trois grands axes du projet.',
  },
  {
    title: 'Administrateur',
    description:
      'Supervise les comptes, verifie les offres, suit les commandes et garde une vue globale sur la plateforme.',
  },
]

const processSteps = [
  'Recherche avancee par ville, budget et categorie.',
  'Comparaison rapide des offres avec details utiles.',
  'Reservation en ligne avec suivi du paiement et du statut.',
  'Gestion centralisee pour clients, prestataires et administration.',
]

function getApiUrl(path) {
  return `${API_BASE_URL}${path}`
}

function formatPrice(price) {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    maximumFractionDigits: 0,
  }).format(price)
}

function buildMetaFromServices(services) {
  return {
    availableCities: [...new Set(services.map((service) => service.location_city))].sort(),
    availableTypes: [...new Set(services.map((service) => service.service_type))].sort(),
  }
}

async function fetchJson(path) {
  const response = await fetch(getApiUrl(path), {
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return response.json()
}

function App() {
  const [overview, setOverview] = useState(fallbackOverview)
  const [services, setServices] = useState(fallbackServices)
  const [meta, setMeta] = useState(buildMetaFromServices(fallbackServices))
  const [loading, setLoading] = useState(true)
  const [demoMode, setDemoMode] = useState(false)
  const [selectedType, setSelectedType] = useState('all')
  const [selectedCity, setSelectedCity] = useState('all')
  const [priceLimit, setPriceLimit] = useState('2000')
  const [search, setSearch] = useState('')
  const [activeServiceId, setActiveServiceId] = useState(fallbackServices[0]?.id ?? null)
  const [submitting, setSubmitting] = useState(false)
  const [bookingResult, setBookingResult] = useState(null)
  const [bookingForm, setBookingForm] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    startDate: '',
    endDate: '',
    quantity: 1,
    paymentMethod: 'cash',
    serviceAddress: '',
    notes: '',
  })

  const deferredSearch = useDeferredValue(search.trim().toLowerCase())

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      try {
        const [overviewResponse, servicesResponse] = await Promise.all([
          fetchJson('/api/platform/overview'),
          fetchJson('/api/services'),
        ])

        if (cancelled) {
          return
        }

        const nextServices = servicesResponse.data ?? fallbackServices

        setOverview(overviewResponse)
        setServices(nextServices)
        setMeta(servicesResponse.meta ?? buildMetaFromServices(nextServices))
        setDemoMode(false)
        setActiveServiceId(nextServices[0]?.id ?? null)
      } catch {
        if (cancelled) {
          return
        }

        setOverview(fallbackOverview)
        setServices(fallbackServices)
        setMeta(buildMetaFromServices(fallbackServices))
        setDemoMode(true)
        setActiveServiceId(fallbackServices[0]?.id ?? null)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      cancelled = true
    }
  }, [])

  const filteredServices = services.filter((service) => {
    const matchesType =
      selectedType === 'all' || service.service_type === selectedType
    const matchesCity =
      selectedCity === 'all' || service.location_city === selectedCity
    const matchesPrice = Number(service.price) <= Number(priceLimit || 0)
    const haystack = [
      service.title,
      service.category,
      service.description,
      service.location_city,
      service.provider?.name,
    ]
      .join(' ')
      .toLowerCase()
    const matchesSearch = !deferredSearch || haystack.includes(deferredSearch)

    return matchesType && matchesCity && matchesPrice && matchesSearch
  })

  const effectiveActiveServiceId = filteredServices.some(
    (service) => service.id === activeServiceId,
  )
    ? activeServiceId
    : (filteredServices[0]?.id ?? null)

  const activeService =
    filteredServices.find((service) => service.id === effectiveActiveServiceId) ??
    filteredServices[0] ??
    null

  const featuredServices =
    overview.featuredServices?.length > 0
      ? overview.featuredServices
      : services.filter((service) => service.is_featured).slice(0, 3)

  const stats = overview.stats ?? {
    services: services.length,
    providers: 3,
    clients: 2,
    bookings: 3,
  }

  function handleFilterChange(setter, value) {
    startTransition(() => {
      setter(value)
    })
  }

  function handleBookingInput(event) {
    const { name, value } = event.target

    setBookingForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  function handleSelectService(service) {
    setActiveServiceId(service.id)
    setBookingResult(null)
    setBookingForm((current) => ({
      ...current,
      serviceAddress: current.serviceAddress || service.location_address || '',
    }))
  }

  async function handleBookingSubmit(event) {
    event.preventDefault()

    if (!activeService) {
      return
    }

    setSubmitting(true)
    setBookingResult(null)

    const payload = {
      service_id: activeService.id,
      client_name: bookingForm.clientName,
      client_email: bookingForm.clientEmail,
      client_phone: bookingForm.clientPhone,
      start_date: bookingForm.startDate,
      end_date: bookingForm.endDate || bookingForm.startDate,
      quantity: Number(bookingForm.quantity),
      payment_method: bookingForm.paymentMethod,
      service_address: bookingForm.serviceAddress,
      notes: bookingForm.notes,
    }

    try {
      if (demoMode) {
        setBookingResult({
          type: 'success',
          message: `Reservation de demonstration creee pour ${activeService.title}.`,
          reference: 'DEMO-PFE',
        })
      } else {
        const response = await fetch(getApiUrl('/api/bookings'), {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message ?? 'Impossible de creer la reservation.')
        }

        setBookingResult({
          type: 'success',
          message: data.message,
          reference: data.data.booking_reference,
        })
      }

      setBookingForm({
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        startDate: '',
        endDate: '',
        quantity: 1,
        paymentMethod: 'cash',
        serviceAddress: activeService.location_address || '',
        notes: '',
      })
    } catch (error) {
      setBookingResult({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Une erreur est survenue pendant la reservation.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-shell">
      <header className="hero-section">
        <div className="hero-copy">
          <span className="eyebrow">Projet PFE Laravel + React</span>
          <h1>Khadamat Dar</h1>
          <p className="hero-text">
            Une plateforme web de services a domicile qui centralise la location
            de maisons, la location de mafrouchat et les prestations du
            quotidien dans une seule experience.
          </p>

          <div className="hero-actions">
            <a href="#services" className="primary-link">
              Explorer les offres
            </a>
            <a href="#booking" className="secondary-link">
              Tester une reservation
            </a>
          </div>

          <div className="stats-grid">
            <article>
              <strong>{stats.services}</strong>
              <span>offres actives</span>
            </article>
            <article>
              <strong>{stats.providers}</strong>
              <span>prestataires</span>
            </article>
            <article>
              <strong>{stats.clients}</strong>
              <span>clients</span>
            </article>
            <article>
              <strong>{stats.bookings}</strong>
              <span>reservations</span>
            </article>
          </div>
        </div>

        <div className="hero-panel">
          <div className="panel-card panel-card-primary">
            <p>Services principaux</p>
            <ul className="service-type-list">
              {overview.serviceTypes?.map((type) => (
                <li key={type.key}>
                  <strong>{type.label}</strong>
                  <span>{type.count} offres</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="panel-card">
            <p>Selection du moment</p>
            <div className="featured-mini-list">
              {featuredServices.map((service) => (
                <article key={service.id}>
                  <strong>{service.title}</strong>
                  <span>
                    {service.location_city} - {formatPrice(service.price)}
                  </span>
                </article>
              ))}
            </div>
          </div>
        </div>
      </header>

      {demoMode ? (
        <div className="status-banner">
          L'API Laravel n'est pas accessible pour le moment. L'interface tourne
          en mode demo avec des donnees locales.
        </div>
      ) : null}

      <section className="filters-section">
        <div className="section-heading">
          <span className="eyebrow">Recherche avancee</span>
          <h2>Trouver le bon service en quelques clics</h2>
        </div>

        <div className="filter-panel">
          <div className="filter-pill-row">
            <button
              type="button"
              className={selectedType === 'all' ? 'pill active' : 'pill'}
              onClick={() => handleFilterChange(setSelectedType, 'all')}
            >
              Tout
            </button>
            {Object.entries(serviceTypeLabels).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={selectedType === key ? 'pill active' : 'pill'}
                onClick={() => handleFilterChange(setSelectedType, key)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="filter-grid">
            <label>
              <span>Mot-cle</span>
              <input
                type="search"
                value={search}
                placeholder="Maison, menage, plomberie..."
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <label>
              <span>Ville</span>
              <select
                value={selectedCity}
                onChange={(event) =>
                  handleFilterChange(setSelectedCity, event.target.value)
                }
              >
                <option value="all">Toutes les villes</option>
                {meta.availableCities?.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Budget max</span>
              <input
                type="range"
                min="200"
                max="2500"
                step="50"
                value={priceLimit}
                onChange={(event) => setPriceLimit(event.target.value)}
              />
              <small>{formatPrice(Number(priceLimit))}</small>
            </label>
          </div>
        </div>
      </section>

      <section className="services-section" id="services">
        <div className="section-heading">
          <span className="eyebrow">Catalogue</span>
          <h2>Offres disponibles sur la plateforme</h2>
          <p>
            {loading
              ? 'Chargement des offres...'
              : `${filteredServices.length} offre(s) correspondent a votre recherche.`}
          </p>
        </div>

        <div className="services-layout">
          <div className="services-grid">
            {filteredServices.map((service) => (
              <article
                key={service.id}
                className={
                  effectiveActiveServiceId === service.id
                    ? 'service-card active'
                    : 'service-card'
                }
              >
                <div
                  className="service-cover"
                  style={{
                    backgroundImage: `linear-gradient(180deg, rgba(14, 30, 37, 0.1), rgba(14, 30, 37, 0.75)), url(${service.image_url})`,
                  }}
                >
                  <span className="badge">
                    {serviceTypeLabels[service.service_type]}
                  </span>
                  {service.is_featured ? (
                    <span className="badge badge-highlight">Vedette</span>
                  ) : null}
                </div>

                <div className="service-content">
                  <div className="service-headline">
                    <div>
                      <p className="muted">{service.category}</p>
                      <h3>{service.title}</h3>
                    </div>
                    <strong>{formatPrice(service.price)}</strong>
                  </div>

                  <p className="service-description">{service.description}</p>

                  <div className="service-meta">
                    <span>{service.location_city}</span>
                    <span>{billingUnitLabels[service.billing_unit]}</span>
                    <span>{service.rating}/5</span>
                  </div>

                  <div className="feature-list">
                    {service.features?.slice(0, 4).map((feature) => (
                      <span key={feature}>{feature}</span>
                    ))}
                  </div>

                  <div className="service-footer">
                    <div>
                      <p className="muted">Prestataire</p>
                      <strong>{service.provider?.name}</strong>
                    </div>
                    <button
                      type="button"
                      className="card-link"
                      onClick={() => handleSelectService(service)}
                    >
                      Reserver
                    </button>
                  </div>
                </div>
              </article>
            ))}

            {filteredServices.length === 0 ? (
              <div className="empty-state">
                Aucun resultat pour cette combinaison. Essaie une autre ville,
                un autre type ou un budget plus large.
              </div>
            ) : null}
          </div>

          <aside className="booking-panel" id="booking">
            {activeService ? (
              <>
                <div className="section-heading compact">
                  <span className="eyebrow">Reservation</span>
                  <h2>{activeService.title}</h2>
                  <p>
                    {activeService.location_city} -{' '}
                    {formatPrice(activeService.price)}{' '}
                    {billingUnitLabels[activeService.billing_unit]}
                  </p>
                </div>

                <form className="booking-form" onSubmit={handleBookingSubmit}>
                  <label>
                    <span>Nom complet</span>
                    <input
                      required
                      name="clientName"
                      value={bookingForm.clientName}
                      onChange={handleBookingInput}
                    />
                  </label>

                  <label>
                    <span>Email</span>
                    <input
                      required
                      type="email"
                      name="clientEmail"
                      value={bookingForm.clientEmail}
                      onChange={handleBookingInput}
                    />
                  </label>

                  <label>
                    <span>Telephone</span>
                    <input
                      name="clientPhone"
                      value={bookingForm.clientPhone}
                      onChange={handleBookingInput}
                    />
                  </label>

                  <div className="double-field">
                    <label>
                      <span>Date debut</span>
                      <input
                        required
                        type="date"
                        name="startDate"
                        value={bookingForm.startDate}
                        onChange={handleBookingInput}
                      />
                    </label>

                    <label>
                      <span>Date fin</span>
                      <input
                        type="date"
                        name="endDate"
                        value={bookingForm.endDate}
                        onChange={handleBookingInput}
                      />
                    </label>
                  </div>

                  <div className="double-field">
                    <label>
                      <span>Quantite</span>
                      <input
                        min="1"
                        max="30"
                        type="number"
                        name="quantity"
                        value={bookingForm.quantity}
                        onChange={handleBookingInput}
                      />
                    </label>

                    <label>
                      <span>Paiement</span>
                      <select
                        name="paymentMethod"
                        value={bookingForm.paymentMethod}
                        onChange={handleBookingInput}
                      >
                        <option value="cash">Especes</option>
                        <option value="card">Carte</option>
                        <option value="transfer">Virement</option>
                      </select>
                    </label>
                  </div>

                  <label>
                    <span>Adresse d'intervention / livraison</span>
                    <input
                      name="serviceAddress"
                      value={bookingForm.serviceAddress}
                      onChange={handleBookingInput}
                    />
                  </label>

                  <label>
                    <span>Notes</span>
                    <textarea
                      rows="4"
                      name="notes"
                      value={bookingForm.notes}
                      onChange={handleBookingInput}
                    />
                  </label>

                  <button className="submit-button" type="submit" disabled={submitting}>
                    {submitting ? 'Envoi...' : 'Confirmer la reservation'}
                  </button>
                </form>

                {bookingResult ? (
                  <div
                    className={
                      bookingResult.type === 'success'
                        ? 'feedback success'
                        : 'feedback error'
                    }
                  >
                    <strong>{bookingResult.message}</strong>
                    {bookingResult.reference ? (
                      <span>Reference: {bookingResult.reference}</span>
                    ) : null}
                  </div>
                ) : null}
              </>
            ) : (
              <div className="empty-state">
                Selectionne une offre pour remplir la reservation.
              </div>
            )}
          </aside>
        </div>
      </section>

      <section className="info-grid">
        <article className="info-card">
          <span className="eyebrow">Fonctionnement</span>
          <h2>Parcours utilisateur cible</h2>
          <ul className="plain-list">
            {processSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </article>

        <article className="info-card">
          <span className="eyebrow">Technique</span>
          <h2>Socle applicatif</h2>
          <ul className="plain-list">
            <li>Laravel pour une API REST securisee et claire.</li>
            <li>React + Vite pour une interface moderne et interactive.</li>
            <li>MySQL ou SQLite pour les utilisateurs, services et transactions.</li>
            <li>Architecture prete pour auth, gestion des commandes et paiements.</li>
          </ul>
        </article>
      </section>

      <section className="roles-section">
        <div className="section-heading">
          <span className="eyebrow">Acteurs</span>
          <h2>Trois profils autour d'une meme plateforme</h2>
        </div>

        <div className="roles-grid">
          {roleCards.map((role) => (
            <article key={role.title} className="role-card">
              <h3>{role.title}</h3>
              <p>{role.description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

export default App
