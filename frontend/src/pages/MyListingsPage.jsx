import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { MapPin, Edit2, Trash2, PlusCircle, ShieldCheck, BrainCircuit, Star, Lock } from 'lucide-react'
import AiDescriptionAssistant from '../components/AiDescriptionAssistant'
import ListingLocationPicker from '../components/ListingLocationPicker'
import { useMarketplace } from '../context/MarketplaceContext'
import { formatPrice, serviceTypeMenu } from '../lib/marketplace'
import {
  generateListingDescription,
  getAiDescriptionErrorMessage,
} from '../services/aiDescriptionService'

const emptyForm = {
  title: '',
  description: '',
  serviceType: '',
  category: '',
  bedrooms: '',
  surface: '',
  additionalInfo: '',
  locationCity: '',
  locationAddress: '',
  latitude: '',
  longitude: '',
  phone: '',
  price: '',
  imageUrl: '',
}

const MAX_IMAGE_SIZE_BYTES = 1.5 * 1024 * 1024

const STATUS_LABELS = {
  pending: 'En attente',
  en_attente: 'En attente',
  active: 'Validee',
  validee: 'Validee',
  rejected: 'Refusee',
  refusee: 'Refusee',
}

const STATUS_CLASSES = {
  pending: 'status-badge-pending',
  en_attente: 'status-badge-pending',
  active: 'status-badge-active',
  validee: 'status-badge-active',
  rejected: 'status-badge-rejected',
  refusee: 'status-badge-rejected',
}

const AI_STYLE_LABELS = {}

// Sous-catégories dynamiques selon le type
const SUBCATEGORIES = {
  house_rental: [
    { value: 'Appartement', label: '🏢 Appartements' },
    { value: 'Villa',        label: '🏡 Villas' },
    { value: 'Maison',       label: '🏠 Maisons' },
    { value: 'Terrain',      label: '🌱 Terrains' },
    { value: 'Bureau',       label: '💼 Bureaux' },
    { value: 'Magasin',      label: '🏪 Magasins' },
    { value: 'Autre',         label: '🛠️ Autre' },
  ],
  furniture_rental: [
    { value: 'Neuf',      label: '✨ Neuf' },
    { value: 'Occasion', label: '♻️ Occasion' },
  ],
  home_service: [
    { value: 'Électricité',   label: '⚡ Électricité' },
    { value: 'Plomberie',     label: '🔧 Plomberie' },
    { value: 'Nettoyage',     label: '🧹 Nettoyage' },
    { value: 'Jardinage',     label: '🌿 Jardinage' },
    { value: 'Peinture',      label: '🎨 Peinture' },
    { value: 'Climatisation', label: '❄️ Climatisation' },
    { value: 'Déménagement',  label: '📦 Déménagement' },
    { value: 'Autre',         label: '🛠️ Autre' },
  ],
}

function getListingImages(imageValue) {
  if (!imageValue) {
    return []
  }

  if (Array.isArray(imageValue)) {
    return imageValue.filter(Boolean)
  }

  if (typeof imageValue !== 'string') {
    return []
  }

  try {
    const parsed = JSON.parse(imageValue)
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [imageValue].filter(Boolean)
  } catch {
    return [imageValue].filter(Boolean)
  }
}

export default function MyListingsPage() {
  const {
    currentUser,
    myListings,
    createUserListing,
    updateUserListing,
    deleteUserListing,
    token,
  } = useMarketplace()

  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [imagePreviews, setImagePreviews] = useState([])
  const [customCategory, setCustomCategory] = useState('')
  const [transType, setTransType] = useState('')
  const [furnitureType, setFurnitureType] = useState('')
  const [customFurnitureType, setCustomFurnitureType] = useState('')
  const [aiLoadingAction, setAiLoadingAction] = useState(null)

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  if (currentUser.role === 'admin') {
    return <Navigate to="/admin" replace />
  }

  const safeListings = Array.isArray(myListings) ? myListings : []

  function handleChange(e) {
    const { name, value } = e.target
    // Reset category when service type changes
    if (name === 'serviceType') {
      setCustomCategory('')
      setTransType('')
      setFurnitureType('')
      setCustomFurnitureType('')
      setForm((current) => ({
        ...current,
        serviceType: value,
        category: '',
        latitude: '',
        longitude: '',
      }))
    } else {
      setForm((current) => ({ ...current, [name]: value }))
    }
  }

  function handleImageFile(e) {
    const files = Array.from(e.target.files)
    if (files.length === 0) return
    
    // Limit to 5 files total (existing + new)
    const maxFiles = 5
    const currentCount = imagePreviews.length
    const allowedCount = maxFiles - currentCount
    
    if (allowedCount <= 0) {
      setFeedback({ type: 'error', message: 'Vous ne pouvez pas ajouter plus de 5 photos.' })
      return
    }
    
    const oversizedFile = files.find((file) => file.size > MAX_IMAGE_SIZE_BYTES)
    if (oversizedFile) {
      setFeedback({
        type: 'error',
        message: 'Chaque image doit etre inferieure a 1.5 MB pour eviter les problemes de stockage.',
      })
      e.target.value = ''
      return
    }

    const filesToUpload = files.slice(0, allowedCount)
    
    const newPreviews = []
    let loaded = 0
    
    filesToUpload.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        newPreviews.push(ev.target.result)
        loaded++
        
        if (loaded === filesToUpload.length) {
          const updatedPreviews = [...imagePreviews, ...newPreviews]
          setImagePreviews(updatedPreviews)
          setForm((current) => ({ ...current, imageUrl: JSON.stringify(updatedPreviews) }))
          setFeedback(null)
        }
      }
      reader.readAsDataURL(file)
    })

    e.target.value = ''
  }

  function buildFinalCategory() {
    const baseCategory = form.category === 'Autre' ? customCategory.trim() : form.category
    let finalCategory = baseCategory

    if (form.serviceType === 'house_rental' && transType) {
      finalCategory = `${baseCategory} - ${transType}`
    } else if (form.serviceType === 'furniture_rental' && furnitureType) {
      const type = furnitureType === 'autre' ? customFurnitureType.trim() : furnitureType
      finalCategory = `${type} - ${form.category}`
    }

    return finalCategory.trim()
  }

  function buildListingKind() {
    if (form.serviceType !== 'house_rental') {
      return null
    }

    if (transType === 'A vendre' || transType === 'À vendre') {
      return 'sale'
    }

    if (transType === 'A louer' || transType === 'À louer') {
      return 'rent'
    }

    return null
  }

  function getCategorySelectionMessage() {
    if (form.serviceType === 'house_rental') {
      return 'Choisis le type de bien avant la generation.'
    }

    if (form.serviceType === 'furniture_rental') {
      return 'Choisis l etat du meuble avant la generation.'
    }

    if (form.serviceType === 'home_service') {
      return 'Choisis la specialite avant la generation.'
    }

    return 'Choisis une sous-categorie avant la generation.'
  }

  function getValidationMessage() {
    if (!form.title.trim()) {
      return 'Le titre est obligatoire.'
    }
    if (!form.serviceType) {
      return 'La categorie principale est obligatoire.'
    }
    if (!form.category.trim()) {
      return getCategorySelectionMessage()
    }
    if (form.category === 'Autre' && !customCategory.trim()) {
      return 'Merci de preciser votre categorie.'
    }
    if (form.serviceType === 'house_rental' && !transType) {
      return 'Le type d annonce est obligatoire pour l immobilier.'
    }
    if (form.serviceType === 'furniture_rental' && !furnitureType) {
      return 'Le type de meuble est obligatoire.'
    }
    if (form.serviceType === 'furniture_rental' && furnitureType === 'autre' && !customFurnitureType.trim()) {
      return 'Merci de preciser le type de meuble.'
    }
    if (form.serviceType !== 'home_service' && !form.price) {
      return 'Le prix est obligatoire.'
    }
    if (!form.locationCity) {
      return 'La ville est obligatoire.'
    }
    if (!form.locationAddress.trim()) {
      return "L'adresse est obligatoire."
    }
    if (!form.phone.trim()) {
      return 'Le telephone est obligatoire.'
    }
    if (!form.imageUrl) {
      return "L'image est obligatoire."
    }
    if (!form.description.trim()) {
      return 'La description est obligatoire.'
    }

    return ''
  }

  function startEdit(listing) {
    setEditingId(listing.id)

    const rawCategory = listing.category ?? ''
    let nextCategory = rawCategory
    let nextCustomCategory = ''
    let nextTransType = ''
    let nextFurnitureType = ''
    let nextCustomFurnitureType = ''

    if (listing.service_type === 'house_rental') {
      const [baseCategory = '', listingType = ''] = rawCategory.split(' - ')
      const isStandard = (SUBCATEGORIES.house_rental ?? []).some((opt) => opt.value === baseCategory)
      nextCategory = isStandard ? baseCategory : 'Autre'
      nextCustomCategory = isStandard ? '' : baseCategory
      nextTransType = listingType
    } else if (listing.service_type === 'furniture_rental') {
      const [type = '', condition = ''] = rawCategory.split(' - ')
      const isStandardCondition = (SUBCATEGORIES.furniture_rental ?? []).some((opt) => opt.value === condition)
      const standardTypes = ['salon', 'chambre', 'electromenager', 'decoration', 'tables', 'cuisine']

      nextCategory = isStandardCondition ? condition : ''
      if (standardTypes.includes(type)) {
        nextFurnitureType = type
      } else if (type) {
        nextFurnitureType = 'autre'
        nextCustomFurnitureType = type
      }
    } else {
      const isStandard = (SUBCATEGORIES.home_service ?? []).some((opt) => opt.value === rawCategory)
      nextCategory = isStandard ? rawCategory : 'Autre'
      nextCustomCategory = isStandard ? '' : rawCategory
    }

    setForm({
      title: listing.title,
      description: listing.description,
      serviceType: listing.service_type,
      category: nextCategory,
      bedrooms: listing.bedrooms != null ? String(listing.bedrooms) : '',
      surface: listing.surface != null ? String(listing.surface) : '',
      additionalInfo: '',
      locationCity: listing.location_city,
      locationAddress: listing.location_address ?? '',
      latitude: listing.latitude != null ? String(listing.latitude) : '',
      longitude: listing.longitude != null ? String(listing.longitude) : '',
      phone: listing.phone ?? '',
      price: String(listing.price),
      imageUrl: listing.image_url ?? '',
    })
    setCustomCategory(nextCustomCategory)
    setTransType(nextTransType)
    setFurnitureType(nextFurnitureType)
    setCustomFurnitureType(nextCustomFurnitureType)
    setImagePreviews(getListingImages(listing.image_url))
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
    setCustomCategory('')
    setTransType('')
    setFurnitureType('')
    setCustomFurnitureType('')
    setAiLoadingAction(null)
    setFeedback(null)
    setShowForm(false)
    setImagePreviews([])
  }

  function handleLocationChange(nextValue) {
    setForm((current) => {
      if (typeof nextValue === 'function') {
        return nextValue(current)
      }

      return {
        ...current,
        ...nextValue,
      }
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const validationMessage = getValidationMessage()
    if (validationMessage) {
      setFeedback({ type: 'error', message: validationMessage })
      return
    }

    const finalCategory = buildFinalCategory()
    const listingKind = buildListingKind()
    const primaryImage = getListingImages(form.imageUrl)[0] || null

    try {
      if (editingId) {
        const response = await updateUserListing(editingId, {
          title: form.title,
          description: form.description,
          service_type: form.serviceType,
          category: finalCategory,
          location_city: form.locationCity,
          location_address: form.locationAddress,
          latitude: form.latitude ? Number(form.latitude) : null,
          longitude: form.longitude ? Number(form.longitude) : null,
          phone: form.phone,
          price: form.serviceType === 'home_service' ? 0 : Number(form.price),
          surface: form.surface ? Number(form.surface) : null,
          bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
          listing_kind: listingKind,
          image_url: primaryImage,
        })
        const pendingReview = response?.data?.status === 'pending' || response?.data?.status === 'en_attente'
        setFeedback({
          type: 'success',
          message: pendingReview
            ? 'Annonce modifiee. Elle revient en attente de validation admin.'
            : 'Annonce modifiee avec succes.',
        })
      } else {
        const response = await createUserListing({
          ...form,
          price: form.serviceType === 'home_service' ? 0 : Number(form.price),
          category: finalCategory,
          latitude: form.latitude,
          longitude: form.longitude,
          phone: form.phone,
          surface: form.surface,
          bedrooms: form.bedrooms,
          listingKind,
          imageUrl: primaryImage,
        })
        const pendingReview = response?.data?.status === 'pending' || response?.data?.status === 'en_attente'
        setFeedback({
          type: 'success',
          message: pendingReview
            ? 'Annonce envoyee. Elle restera invisible jusqu a validation par un admin.'
            : 'Annonce publiee avec succes.',
        })
      }

      setEditingId(null)
      setForm(emptyForm)
      setImagePreviews([])
      setCustomCategory('')
      setTransType('')
      setFurnitureType('')
      setCustomFurnitureType('')
      setTimeout(() => {
        setShowForm(false)
        setFeedback(null)
      }, 2200)
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Impossible d enregistrer cette annonce pour le moment.',
      })
    }
  }

  function getAiValidationMessage() {
    return (
      !form.title.trim()
        ? 'Renseigne au moins le titre avant de lancer l IA.'
        : !form.serviceType
          ? 'Choisis une categorie principale avant la generation.'
          : !form.category.trim()
            ? getCategorySelectionMessage()
            : form.category === 'Autre' && !customCategory.trim()
              ? 'Precise la categorie personnalisee avant la generation.'
              : !form.locationCity
                ? 'Choisis une ville avant la generation.'
                : (form.serviceType !== 'home_service' && !form.price)
                  ? 'Ajoute un prix avant la generation.'
                  : form.serviceType === 'house_rental' && !transType
                    ? 'Choisis si le bien est a louer ou a vendre avant la generation.'
                    : form.serviceType === 'furniture_rental' && !furnitureType
                    ? 'Choisis le type de meuble avant la generation.'
                    : form.serviceType === 'furniture_rental' && furnitureType === 'autre' && !customFurnitureType.trim()
                        ? 'Precise le type de meuble avant la generation.'
                        : ''
    )
  }

  function buildAiPayload() {
    return {
      title: form.title.trim(),
      city: form.locationCity,
      price: form.serviceType === 'home_service' ? 0 : Number(form.price),
      service_type: form.serviceType,
      category: buildFinalCategory(),
      listing_kind: buildListingKind(),
      bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
      surface: form.surface ? Number(form.surface) : null,
      description: form.description.trim() || null,
      additional_info: form.additionalInfo.trim() || null,
    }
  }

  async function handleGenerateDescription() {
    const validationMessage = getAiValidationMessage()

    if (validationMessage) {
      toast.error(validationMessage)
      return
    }

    if (!token) {
      toast.error('La session a expire. Reconnecte-toi pour utiliser l assistant IA.')
      return
    }

    setAiLoadingAction('generate')

    try {
      const response = await generateListingDescription(token, buildAiPayload())

      setForm((current) => ({
        ...current,
        description: response?.data?.description ?? current.description,
      }))

      toast.success('Description generee automatiquement a partir du formulaire.')
    } catch (error) {
      toast.error(getAiDescriptionErrorMessage(error))
    } finally {
      setAiLoadingAction(null)
    }
  }

  async function handleDelete(id) {
    if (window.confirm('Supprimer definitivement cette annonce ?')) {
      try {
        await deleteUserListing(id)
        if (editingId === id) cancelEdit()
        setFeedback({ type: 'success', message: 'Annonce supprimee avec succes.' })
      } catch (error) {
        setFeedback({
          type: 'error',
          message: error instanceof Error ? error.message : 'Suppression impossible pour le moment.',
        })
      }
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

              {/* ── Titre + Prix ── */}
              <div className={form.serviceType === 'home_service' ? "grid grid-cols-1 gap-5" : "grid grid-cols-1 md:grid-cols-2 gap-5"}>
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
                {form.serviceType !== 'home_service' && (
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
                )}
              </div>

              {/* ── Catégorie → Sous-catégorie (côte à côte) ── */}
              <div className="flex flex-col md:flex-row md:items-end gap-3">
                {/* Catégorie principale */}
                <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontWeight: '500', color: '#374151', flex: 1 }}>
                  <span>Catégorie <span style={{color:'#dc2626'}}>*</span></span>
                  <select
                    required
                    name="serviceType"
                    value={form.serviceType}
                    onChange={handleChange}
                    style={{ padding: '10px 16px', borderRadius: '8px', border: `1px solid ${!form.serviceType ? '#f97316' : '#d1d5db'}`, backgroundColor: '#fff', cursor: 'pointer', fontSize: '15px' }}
                  >
                    <option value="">-- Choisir --</option>
                    {serviceTypeMenu.map((cat) => (
                      <option key={cat.key} value={cat.key}>{cat.label}</option>
                    ))}
                  </select>
                </label>

                {/* Flèche indicateur */}
                {SUBCATEGORIES[form.serviceType] && (
                  <div className="hidden md:block pb-2 text-orange-500 text-2xl font-bold shrink-0">
                    →
                  </div>
                )}

                {/* Sous-catégorie — apparaît dynamiquement */}
                {SUBCATEGORIES[form.serviceType] && (
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontWeight: '500', color: '#374151', flex: 1, animation: 'svcSlideDown 0.2s ease' }}>
                    <span>
                      {form.serviceType === 'house_rental' ? 'Type de bien' : form.serviceType === 'furniture_rental' ? 'État du meuble' : 'Spécialité'}
                      {' '}<span style={{color:'#dc2626'}}>*</span>
                    </span>
                    <select
                      required
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      style={{
                        padding: '10px 16px',
                        borderRadius: '8px',
                        border: `2px solid ${!form.category ? '#f97316' : '#16a34a'}`,
                        backgroundColor: !form.category ? '#fff7ed' : '#f0fdf4',
                        cursor: 'pointer',
                        fontSize: '15px',
                        fontWeight: '600',
                        color: !form.category ? '#92400e' : '#15803d',
                        transition: 'all 0.2s',
                      }}
                    >
                      <option value="">-- Choisir --</option>
                      {SUBCATEGORIES[form.serviceType].map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </label>
                )}

                {/* Type de transaction — apparaît uniquement pour Immobilier */}
                {form.serviceType === 'house_rental' && (
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontWeight: '500', color: '#374151', flex: 1, animation: 'svcSlideDown 0.2s ease' }}>
                    <span>Transaction <span style={{color:'#dc2626'}}>*</span></span>
                    <select
                      required
                      value={transType}
                      onChange={(e) => setTransType(e.target.value)}
                      style={{
                        padding: '10px 16px',
                        borderRadius: '8px',
                        border: `2px solid ${!transType ? '#f97316' : '#16a34a'}`,
                        backgroundColor: !transType ? '#fff7ed' : '#f0fdf4',
                        cursor: 'pointer',
                        fontSize: '15px',
                        fontWeight: '600',
                        color: !transType ? '#92400e' : '#15803d',
                        transition: 'all 0.2s',
                      }}
                    >
                      <option value="">-- Choisir --</option>
                      <option value="À louer">🔑 À louer</option>
                      <option value="À vendre">🏷️ À vendre</option>
                    </select>
                  </label>
                )}

                {/* Type de meuble — apparaît uniquement pour Meubles */}
                {form.serviceType === 'furniture_rental' && (
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontWeight: '500', color: '#374151', flex: 1, animation: 'svcSlideDown 0.2s ease' }}>
                    <span>Type de meuble <span style={{color:'#dc2626'}}>*</span></span>
                    <select
                      required
                      value={furnitureType}
                      onChange={(e) => setFurnitureType(e.target.value)}
                      style={{
                        padding: '10px 16px',
                        borderRadius: '8px',
                        border: `2px solid ${!furnitureType ? '#f97316' : '#16a34a'}`,
                        backgroundColor: !furnitureType ? '#fff7ed' : '#f0fdf4',
                        cursor: 'pointer',
                        fontSize: '15px',
                        fontWeight: '600',
                        color: !furnitureType ? '#92400e' : '#15803d',
                        transition: 'all 0.2s',
                      }}
                    >
                      <option value="">-- Choisir --</option>
                      <option value="salon">🛋️ Salons</option>
                      <option value="chambre">🛏️ Chambres</option>
                      <option value="electromenager">🔌 Électroménager</option>
                      <option value="decoration">🖼️ Décoration</option>
                      <option value="tables">🪑 Tables & Chaises</option>
                      <option value="cuisine">🍳 Cuisine</option>
                      <option value="autre">🛠️ Autre</option>
                    </select>
                  </label>
                )}
              </div>

              {form.serviceType === 'furniture_rental' && furnitureType === 'autre' && (
                <div style={{ display: 'flex', animation: 'svcSlideDown 0.2s ease', marginTop: '12px' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontWeight: '500', color: '#374151', flex: 1 }}>
                    <span>Précisez le type de meuble <span style={{color:'#dc2626'}}>*</span></span>
                    <input
                      required
                      type="text"
                      value={customFurnitureType}
                      onChange={(e) => setCustomFurnitureType(e.target.value)}
                      placeholder="Ex: Armoire, Bureau..."
                      style={{
                        padding: '10px 16px',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        fontSize: '15px',
                        outline: 'none',
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#f97316'}
                      onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                    />
                  </label>
                </div>
              )}

              {form.category === 'Autre' && (
                <div style={{ display: 'flex', animation: 'svcSlideDown 0.2s ease' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontWeight: '500', color: '#374151', flex: 1 }}>
                    <span>Précisez votre service <span style={{color:'#dc2626'}}>*</span></span>
                    <input
                      required
                      name="customCategory"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="Ex: Réparation de serrure"
                      style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                    />
                  </label>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                    <option value="Laâyoune">Laâyoune</option>
                  </select>
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontWeight: '500', color: '#374151' }}>
                  <span>Adresse / quartier</span>
                  <input
                    name="locationAddress"
                    value={form.locationAddress}
                    onChange={handleChange}
                    placeholder="Maarif, Casablanca"
                    style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                  />
                </label>
              </div>

              {form.serviceType === 'house_rental' && (
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 md:p-5">
                  <ListingLocationPicker
                    city={form.locationCity}
                    address={form.locationAddress}
                    latitude={form.latitude}
                    longitude={form.longitude}
                    onChange={handleLocationChange}
                  />
                </div>
              )}

              {form.serviceType !== 'home_service' && (
                <div className={`grid gap-5 ${form.serviceType === 'house_rental' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                  {form.serviceType === 'house_rental' && (
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontWeight: '500', color: '#374151' }}>
                      <span>Nombre de chambres</span>
                      <input
                        type="number"
                        min="0"
                        name="bedrooms"
                        value={form.bedrooms}
                        onChange={handleChange}
                        placeholder="Ex: 3"
                        style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                      />
                    </label>
                  )}

                  <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontWeight: '500', color: '#374151' }}>
                    <span>Superficie (m2)</span>
                    <input
                      type="number"
                      min="1"
                      name="surface"
                      value={form.surface}
                      onChange={handleChange}
                      placeholder={form.serviceType === 'house_rental' ? 'Ex: 120' : 'Ex: 35'}
                      style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                    />
                  </label>
                </div>
              )}

              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontWeight: '500', color: '#374151' }}>
                <span>Informations supplementaires</span>
                <textarea
                  rows="3"
                  name="additionalInfo"
                  value={form.additionalInfo}
                  onChange={handleChange}
                  placeholder="Ex: balcon ensoleille, residence securisee, meuble quasi neuf, intervention rapide, parking, ascenseur..."
                  style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid #d1d5db', resize: 'vertical' }}
                />
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontWeight: '500', color: '#374151' }}>
                  <span>Telephone WhatsApp <span style={{color:'#dc2626'}}>*</span></span>
                  <input
                    required
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="06 12 34 56 78"
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
                    border: `2px dashed ${imagePreviews.length === 0 ? '#f97316' : '#d1d5db'}`,
                    backgroundColor: '#f9fafb',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s',
                    minHeight: '120px',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#f97316'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#d1d5db'}
                >
                  {imagePreviews.length > 0 ? (
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', width: '100%' }}>
                      {imagePreviews.map((src, index) => (
                        <div key={index} style={{ position: 'relative', width: '120px', height: '120px' }}>
                          <img
                            src={src}
                            alt={`Aperçu ${index + 1}`}
                            style={{ width: '100%', height: '100%', borderRadius: '8px', objectFit: 'cover' }}
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              const updated = imagePreviews.filter((_, i) => i !== index)
                              setImagePreviews(updated)
                              setForm(f => ({ ...f, imageUrl: JSON.stringify(updated) }))
                            }}
                            style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      {imagePreviews.length < 5 && (
                        <div style={{ width: '120px', height: '120px', border: '1px dashed #d1d5db', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '24px' }}>
                          +
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                      <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Cliquer pour choisir une image</span>
                      <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>PNG, JPG, WEBP — max 5 MB (Max 5 photos)</span>
                    </>
                  )}
                </label>
                <input
                  id="imageFileInput"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageFile}
                  style={{ display: 'none' }}
                />
              </div>

              <AiDescriptionAssistant
                onGenerate={handleGenerateDescription}
                loadingAction={aiLoadingAction}
              />

              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontWeight: '500', color: '#374151' }}>
                <span>Description <span style={{color:'#dc2626'}}>*</span></span>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>1 paragraphe, style pro, max 120 mots</span>
                <textarea
                  required
                  rows="5"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Décris ton annonce..."
                  style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid #d1d5db', resize: 'vertical', minHeight: '140px' }}
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
              {safeListings.length} annonce(s)
            </span>
          </div>

          {safeListings.length === 0 ? (
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
            <div className="my-listings-grid">
              {safeListings.map((listing) => {
                const imageSrc =
                  getListingImages(listing.image_url)[0] ||
                  'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=600'
                const statusClass = STATUS_CLASSES[listing.status] || 'status-badge-pending'

                return (
                <div key={listing.id} className="my-ad-card">
                  <div className="ad-image">
                    <img 
                      src={imageSrc}
                      alt={listing.title} 
                      loading="lazy"
                    />
                    <span className={`ad-badge ${listing.service_type === 'house_rental' ? 'badge-rent' : listing.service_type === 'furniture_rental' ? 'badge-new' : 'badge-service'}`}>
                      {listing.category || (listing.service_type === 'house_rental' ? 'Immobilier' : listing.service_type === 'furniture_rental' ? 'Meubles' : 'Services')}
                    </span>
                  </div>
                  <div className="ad-content">
                    <div>
                      <span className={`status-badge ${statusClass}`}>
                        {STATUS_LABELS[listing.status] ?? listing.status ?? 'En attente'}
                      </span>
                    </div>
                    <h4 className="ad-title">{listing.title}</h4>
                    <div className="ad-location">
                      <MapPin size={14} /> {listing.location_city}
                    </div>
                    <div className="ad-price">
                      {listing.service_type === 'home_service'
                        ? <span className="ad-price-devis">Sur devis</span>
                        : formatPrice(listing.price)}
                    </div>
                    
                    <div className="card-actions">
                      <button
                        type="button"
                        onClick={() => startEdit(listing)}
                        className="btn-edit"
                      >
                        <Edit2 size={16} />
                        Modifier
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(listing.id)}
                        className="btn-delete"
                      >
                        <Trash2 size={16} />
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
                )
              })}
            </div>
          )}
        </section>


      </div>
    </div>
  )
}
