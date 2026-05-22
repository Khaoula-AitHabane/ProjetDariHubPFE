import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  BadgeInfo,
  CalendarDays,
  Copy,
  Heart,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Share2,
  UserCircle2,
} from 'lucide-react'
import ListingReadonlyMap from '../components/ListingReadonlyMap'
import { useMarketplace } from '../context/MarketplaceContext'
import { formatPrice } from '../lib/marketplace'
import {
  formatListingDate,
  getGoogleMapsUrl,
  getListingCoordinates,
  getListingImages,
} from '../lib/listingDetails'

export default function DetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    allServices,
    loading,
    apiError,
    currentUser,
    favorites,
    toggleFavorite,
    getWhatsAppLink,
  } = useMarketplace()

  const listing = useMemo(
    () =>
      allServices.find(
        (service) =>
          String(service.id) === String(id) && service.service_type === 'house_rental',
      ) ?? null,
    [allServices, id],
  )

  const gallery = useMemo(
    () => getListingImages(listing?.image_url, `listing-${id}`),
    [listing?.image_url, id],
  )
  const [activeImage, setActiveImage] = useState(0)

  useEffect(() => {
    setActiveImage(0)
  }, [listing?.id])

  const similarListings = useMemo(() => {
    if (!listing) {
      return []
    }

    return allServices
      .filter((service) => {
        if (service.id === listing.id || service.service_type !== 'house_rental') {
          return false
        }

        const sameCity = service.location_city === listing.location_city
        const sameCategory = service.category === listing.category
        return sameCity || sameCategory
      })
      .slice(0, 3)
  }, [allServices, listing])

  const providerName =
    listing?.provider?.name || listing?.provider_name || 'Vendeur local'
  const providerPhone =
    listing?.phone || listing?.provider?.phone || 'Non communique'
  const providerEmail =
    listing?.provider?.email || 'Non communique'
  const mapsUrl = listing ? getGoogleMapsUrl(getListingCoordinates(listing)) : '#'

  async function handleShare() {
    if (!listing) {
      return
    }

    const shareData = {
      title: listing.title,
      text: `${listing.title} - ${formatPrice(listing.price)} - ${listing.location_city}`,
      url: window.location.href,
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(window.location.href)
        toast.success('Lien de l annonce copie.')
      }
    } catch {
      try {
        await navigator.clipboard.writeText(window.location.href)
        toast.success('Lien de l annonce copie.')
      } catch {
        toast.error('Partage indisponible pour le moment.')
      }
    }
  }

  function handleContactSeller() {
    if (!listing) {
      return
    }

    if (!currentUser) {
      navigate('/login', { state: { from: `/listing/${listing.id}` } })
      return
    }

    window.open(getWhatsAppLink(listing), '_blank', 'noopener,noreferrer')
  }

  if (loading) {
    return (
      <section className="min-h-[70vh] bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl animate-pulse space-y-6">
          <div className="h-6 w-40 rounded-full bg-slate-200" />
          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
            <div className="space-y-4">
              <div className="h-[420px] rounded-[2rem] bg-slate-200" />
              <div className="grid grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-24 rounded-[1.5rem] bg-slate-200" />
                ))}
              </div>
            </div>
            <div className="space-y-4 rounded-[2rem] bg-white p-6 shadow-sm">
              <div className="h-10 w-3/4 rounded-xl bg-slate-200" />
              <div className="h-5 w-1/2 rounded-xl bg-slate-200" />
              <div className="h-28 rounded-[1.5rem] bg-slate-200" />
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (!listing) {
    return (
      <section className="min-h-[70vh] bg-slate-50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-orange-600">
            <BadgeInfo className="h-6 w-6" />
          </p>
          <h1 className="text-3xl font-black tracking-tight text-slate-950">
            Cette annonce est introuvable
          </h1>
          <p className="mt-3 text-base text-slate-600">
            {apiError || 'Le bien demande n existe pas ou n est plus disponible.'}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/immobilier')}
              className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Retour aux annonces
            </button>
            <Link
              to="/"
              className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
            >
              Aller a l accueil
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </button>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-950"
            >
              <Share2 className="h-4 w-4" />
              Partager
            </button>
            <button
              type="button"
              onClick={() => toggleFavorite(listing.id)}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold shadow-sm transition ${
                favorites.includes(listing.id)
                  ? 'bg-orange-500 text-white hover:bg-orange-600'
                  : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-950'
              }`}
            >
              <Heart
                className="h-4 w-4"
                fill={favorites.includes(listing.id) ? 'currentColor' : 'none'}
              />
              {favorites.includes(listing.id) ? 'Sauvegardee' : 'Sauvegarder'}
            </button>
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.45fr_0.75fr]">
          <div className="space-y-8">
            <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="overflow-hidden rounded-[1.75rem] bg-slate-100">
                  <img
                    src={gallery[activeImage]}
                    alt={listing.title}
                    className="h-[260px] w-full object-cover sm:h-[360px] lg:h-[520px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
                  {gallery.slice(0, 4).map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() => setActiveImage(index)}
                      className={`overflow-hidden rounded-[1.5rem] border transition ${
                        activeImage === index
                          ? 'border-orange-400 ring-4 ring-orange-100'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${listing.title} ${index + 1}`}
                        className="h-24 w-full object-cover lg:h-[122px]"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-blue-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-blue-700">
                      {listing.category || 'Immobilier'}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600">
                      <CalendarDays className="h-4 w-4" />
                      Publiee le {formatListingDate(listing.created_at)}
                    </span>
                  </div>

                  <div>
                    <h1 className="max-w-4xl text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                      {listing.title}
                    </h1>
                    <p className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-slate-500 sm:text-base">
                      <MapPin className="h-4 w-4 text-orange-500" />
                      {listing.location_city || 'Maroc'}
                      {listing.location_address ? `, ${listing.location_address}` : ''}
                    </p>
                  </div>
                </div>

                <div className="rounded-[1.75rem] bg-slate-950 px-6 py-5 text-white shadow-lg shadow-slate-950/10">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
                    Prix
                  </p>
                  <p className="mt-2 text-3xl font-black">{formatPrice(listing.price)}</p>
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <InfoTile label="Categorie" value={listing.category || 'Immobilier'} />
                <InfoTile label="Ville" value={listing.location_city || 'Maroc'} />
                <InfoTile label="Chambres" value={listing.bedrooms ? String(listing.bedrooms) : 'A preciser'} />
                <InfoTile label="Surface" value={listing.surface ? `${listing.surface} m2` : 'A preciser'} />
                <InfoTile
                  label="Coordonnees"
                  value={`${getListingCoordinates(listing).lat.toFixed(4)}, ${getListingCoordinates(listing).lng.toFixed(4)}`}
                />
              </div>

              <div className="mt-8 space-y-3">
                <h2 className="text-xl font-black text-slate-950">Description complete</h2>
                <p className="leading-8 text-slate-600">
                  {listing.description || 'Aucune description detaillee pour ce bien.'}
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-slate-950">
                    Localisation
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Carte Google en lecture seule avec la position du bien.
                  </p>
                </div>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hidden rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-950 sm:inline-flex"
                >
                  Ouvrir dans Google Maps
                </a>
              </div>

              <ListingReadonlyMap listing={listing} />
            </section>

            {similarListings.length > 0 ? (
              <section className="space-y-4">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-slate-950">
                    Annonces similaires
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    D autres biens proches pour continuer votre recherche.
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {similarListings.map((item) => {
                    const image = getListingImages(item.image_url, `similar-${item.id}`)[0]

                    return (
                      <article
                        key={item.id}
                        className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                      >
                        <img
                          src={image}
                          alt={item.title}
                          className="h-48 w-full object-cover"
                        />
                        <div className="space-y-4 p-5">
                          <div className="space-y-2">
                            <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-600">
                              {item.category || 'Immobilier'}
                            </p>
                            <h3 className="line-clamp-2 text-lg font-bold text-slate-950">
                              {item.title}
                            </h3>
                            <p className="inline-flex items-center gap-2 text-sm text-slate-500">
                              <MapPin className="h-4 w-4 text-slate-400" />
                              {item.location_city || 'Maroc'}
                            </p>
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            <p className="text-lg font-black text-slate-950">
                              {formatPrice(item.price)}
                            </p>
                            <button
                              type="button"
                              onClick={() => navigate(`/listing/${item.id}`)}
                              className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                            >
                              Voir details
                            </button>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </section>
            ) : null}
          </div>

          <aside className="space-y-6">
            <section className="sticky top-24 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                  <UserCircle2 className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
                    Vendeur
                  </p>
                  <h2 className="text-xl font-black text-slate-950">{providerName}</h2>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <SellerRow icon={Phone} label="Telephone" value={providerPhone} />
                <SellerRow icon={Mail} label="Email" value={providerEmail} />
                <SellerRow
                  icon={MapPin}
                  label="Ville"
                  value={listing.location_city || 'Maroc'}
                />
              </div>

              <div className="mt-8 space-y-3">
                <button
                  type="button"
                  onClick={handleContactSeller}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
                >
                  <MessageCircle className="h-4 w-4" />
                  Contacter le vendeur
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white hover:text-slate-950"
                >
                  <Copy className="h-4 w-4" />
                  Copier le lien
                </button>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </section>
  )
}

function InfoTile({ label, value }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-4">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-slate-900 sm:text-base">{value}</p>
    </div>
  )
}

function SellerRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="mt-0.5 rounded-full bg-white p-2 text-slate-600 shadow-sm">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
          {label}
        </p>
        <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  )
}
