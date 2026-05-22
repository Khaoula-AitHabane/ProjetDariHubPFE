import { createContext, useContext, useDeferredValue, useEffect, useState } from 'react'
import { fallbackOverview } from '../data/fallbackData'
import {
  apiRequest,
  buildMetaFromServices,
  clearStoredAuth,
  createBookingForm,
  createEmptyPublishForm,
  defaultBillingUnitByType,
  filterServices,
  getSupportWhatsAppLink,
  getWhatsAppLink,
  readStoredAuth,
  readStoredComments,
  readStoredFavorites,
  readStoredUserListings,
  saveStoredAuth,
  saveStoredComments,
  saveStoredFavorites,
  saveStoredUserListings,
  sortServicesForDisplay,
  syncOverviewSnapshot,
} from '../lib/marketplace'

const MarketplaceContext = createContext(null)

export function MarketplaceProvider({ children }) {
  const storedAuth = readStoredAuth()

  const [token, setToken] = useState(storedAuth.token)
  const [currentUser, setCurrentUser] = useState(storedAuth.user)
  const [authSubmitting, setAuthSubmitting] = useState(false)
  const [authFeedback, setAuthFeedback] = useState(null)

  const [overview, setOverview] = useState(fallbackOverview)
  const [services, setServices] = useState([])
  const [meta, setMeta] = useState({ cities: [], types: [] })
  const [loading, setLoading] = useState(true)
  const [demoMode, setDemoMode] = useState(false)
  const [apiError, setApiError] = useState(null)
  const [favorites, setFavorites] = useState(readStoredFavorites())
  const [comments, setComments] = useState(readStoredComments())
  const [userListings, setUserListings] = useState(readStoredUserListings())
  const [notifications, setNotifications] = useState([])
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [notificationsUnreadCount, setNotificationsUnreadCount] = useState(0)

  const [selectedType, setSelectedType] = useState('all')
  const [selectedCity, setSelectedCity] = useState('all')
  const [search, setSearch] = useState('')
  const [activeServiceId, setActiveServiceId] = useState(null)

  // Dark mode
  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem('daihub-dark') === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
    try {
      localStorage.setItem('daihub-dark', String(darkMode))
    } catch {}
  }, [darkMode])

  function toggleDarkMode() {
    setDarkMode((prev) => !prev)
  }

  const [bookingForm, setBookingForm] = useState(
    createBookingForm(storedAuth.user, null),
  )
  const [bookingSubmitting, setBookingSubmitting] = useState(false)
  const [bookingFeedback, setBookingFeedback] = useState(null)
  const [myBookings, setMyBookings] = useState([])
  const [bookingsLoading, setBookingsLoading] = useState(false)

  const [publishForm, setPublishForm] = useState(createEmptyPublishForm(storedAuth.user))
  const [publishSubmitting, setPublishSubmitting] = useState(false)
  const [publishFeedback, setPublishFeedback] = useState(null)
  const [managedServices, setManagedServices] = useState([])
  const [managedBookings, setManagedBookings] = useState([])
  const [managementLoading, setManagementLoading] = useState(false)

  const deferredSearch = useDeferredValue(search.trim().toLowerCase())

  useEffect(() => {
    saveStoredFavorites(favorites)
  }, [favorites])

  useEffect(() => {
    saveStoredComments(comments)
  }, [comments])

  useEffect(() => {
    saveStoredUserListings(userListings)
  }, [userListings])

  useEffect(() => {
    let cancelled = false

    async function loadPublicData() {
      try {
        let combined = []
        let apiOk = false
        try {
          const apiResponse = await apiRequest('/api/services')
          if (Array.isArray(apiResponse?.data) && apiResponse.data.length > 0) {
            combined = apiResponse.data
            apiOk = true
          }
        } catch {
          /* API offline = on tombe sur le fallback JSON statique ci-dessous */
        }

        if (!apiOk) {
          const datasetResponse = await fetch('/data/listings.json', {
            cache: 'no-store',
          })
          if (datasetResponse.ok) {
            const dataset = await datasetResponse.json()
            combined = Array.isArray(dataset) ? dataset : []
          }
        }

        if (cancelled) {
          return
        }

        const nextServices = sortServicesForDisplay(combined)
        const computedMeta = buildMetaFromServices(nextServices)

        setServices(nextServices)
        setMeta(computedMeta)
        setOverview({
          ...fallbackOverview,
          stats: {
            ...fallbackOverview.stats,
            services: nextServices.length,
          },
          platform: {
            ...fallbackOverview.platform,
            cities: computedMeta.cities,
          },
        })
        setDemoMode(false)
        setApiError(null)
        setActiveServiceId(nextServices[0]?.id ?? null)
      } catch (error) {
        if (cancelled) {
          return
        }

        setOverview(fallbackOverview)
        setServices([])
        setMeta({ cities: [], types: [] })
        setDemoMode(false)
        setApiError(
          error instanceof Error
            ? error.message
            : 'Impossible de charger les annonces.',
        )
        setActiveServiceId(null)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadPublicData()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function restoreSession() {
      if (!token) {
        return
      }

      try {
        const response = await apiRequest('/api/me', { token })

        if (cancelled) {
          return
        }

        const user = response.data
        setCurrentUser(user)
        setBookingForm((current) => ({
          ...current,
          serviceAddress: current.serviceAddress || user?.address || '',
        }))
        setPublishForm(createEmptyPublishForm(user))
        saveStoredAuth(token, user)
      } catch {
        if (cancelled) {
          return
        }

        setToken('')
        setCurrentUser(null)
        setPublishForm(createEmptyPublishForm())
        clearStoredAuth()
      }
    }

    restoreSession()

    return () => {
      cancelled = true
    }
  }, [token])

  useEffect(() => {
    let cancelled = false

    async function loadMyBookings() {
      if (!token || !currentUser || demoMode) {
        setMyBookings([])
        setBookingsLoading(false)
        return
      }

      setBookingsLoading(true)

      try {
        const response = await apiRequest('/api/my/bookings', { token })

        if (!cancelled) {
          setMyBookings(response.data ?? [])
        }
      } catch {
        if (!cancelled) {
          setMyBookings([])
        }
      } finally {
        if (!cancelled) {
          setBookingsLoading(false)
        }
      }
    }

    loadMyBookings()

    return () => {
      cancelled = true
    }
  }, [token, currentUser, demoMode])

  useEffect(() => {
    let cancelled = false

    async function loadMyServices() {
      if (!token || !currentUser || demoMode) {
        setManagedServices([])
        return
      }

      try {
        const response = await apiRequest('/api/my/services', { token })

        if (!cancelled) {
          setManagedServices(response.data ?? [])
        }
      } catch {
        if (!cancelled) {
          setManagedServices([])
        }
      }
    }

    loadMyServices()

    return () => {
      cancelled = true
    }
  }, [token, currentUser, demoMode])

  useEffect(() => {
    let cancelled = false

    async function loadNotifications() {
      if (!token || !currentUser || demoMode) {
        setNotifications([])
        setNotificationsUnreadCount(0)
        setNotificationsLoading(false)
        return
      }

      setNotificationsLoading(true)

      try {
        const response = await apiRequest('/api/notifications', { token })

        if (!cancelled) {
          setNotifications(response.data ?? [])
          setNotificationsUnreadCount(response.meta?.unread_count ?? 0)
        }
      } catch {
        if (!cancelled) {
          setNotifications([])
          setNotificationsUnreadCount(0)
        }
      } finally {
        if (!cancelled) {
          setNotificationsLoading(false)
        }
      }
    }

    loadNotifications()

    return () => {
      cancelled = true
    }
  }, [token, currentUser, demoMode])

  useEffect(() => {
    let cancelled = false

    async function loadManagementBookings() {
      if (!token || !currentUser || demoMode || !['provider', 'admin'].includes(currentUser.role)) {
        setManagedBookings([])
        setManagementLoading(false)
        return
      }

      setManagementLoading(true)

      try {
        const response = await apiRequest('/api/bookings', { token })

        if (!cancelled) {
          setManagedBookings(response.data ?? [])
        }
      } catch {
        if (!cancelled) {
          setManagedBookings([])
        }
      } finally {
        if (!cancelled) {
          setManagementLoading(false)
        }
      }
    }

    loadManagementBookings()

    return () => {
      cancelled = true
    }
  }, [token, currentUser, demoMode])

  // Les annonces publiques viennent uniquement des annonces validees chargees depuis l'API.
  const allServices = [...services]

  const filteredServices = filterServices(allServices, {
    type: selectedType,
    city: selectedCity,
    search: deferredSearch,
  })

  const effectiveActiveServiceId = filteredServices.some(
    (service) => service.id === activeServiceId,
  )
    ? activeServiceId
    : (filteredServices[0]?.id ?? null)

  const activeService =
    allServices.find((service) => service.id === effectiveActiveServiceId) ??
    filteredServices[0] ??
    null

  const favoriteServices = allServices.filter((service) =>
    favorites.includes(service.id),
  )
  const featuredServices =
    overview.featuredServices?.length > 0
      ? overview.featuredServices
      : services.filter((service) => service.is_featured).slice(0, 3)

  const stats = overview.stats ?? {
    services: services.length,
    providers: 0,
    clients: 0,
    bookings: 0,
  }

  const accessMode = currentUser?.role ?? 'guest'
  const canPublish = !!currentUser

  function clearAuthFeedback() {
    setAuthFeedback(null)
  }

  function updateBookingField(name, value) {
    setBookingForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  function updatePublishField(name, value) {
    setPublishForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'serviceType'
        ? { billingUnit: defaultBillingUnitByType[value] ?? current.billingUnit }
        : {}),
    }))
  }

  function toggleFavorite(serviceId) {
    setFavorites((current) =>
      current.includes(serviceId)
        ? current.filter((id) => id !== serviceId)
        : [...current, serviceId],
    )
  }

  function selectService(service) {
    setActiveServiceId(service.id)
    setBookingFeedback(null)
    setBookingForm((current) => ({
      ...current,
      serviceAddress: service.location_address || current.serviceAddress,
    }))
  }

  function applyAuthSession(nextToken, user, message) {
    setToken(nextToken)
    setCurrentUser(user)
    setAuthFeedback({ type: 'success', message })
    setBookingFeedback(null)
    setPublishFeedback(null)
    setPublishForm(createEmptyPublishForm(user))
    setBookingForm((current) => ({
      ...current,
      serviceAddress:
        current.serviceAddress || activeService?.location_address || user?.address || '',
    }))
    saveStoredAuth(nextToken, user)
  }

  function clearAuthSession(message = '') {
    setToken('')
    setCurrentUser(null)
    setMyBookings([])
    setManagedServices([])
    setManagedBookings([])
    setBookingFeedback(null)
    setPublishFeedback(null)
    setBookingForm(createBookingForm(null, activeService))
    setPublishForm(createEmptyPublishForm())
    clearStoredAuth()

    if (message) {
      setAuthFeedback({ type: 'success', message })
    }
  }

  async function login(credentials) {
    if (demoMode) {
      setAuthFeedback({
        type: 'error',
        message: 'Lance l API Laravel pour utiliser login.',
      })
      return false
    }

    setAuthSubmitting(true)
    setAuthFeedback(null)

    try {
      const response = await apiRequest('/api/login', {
        method: 'POST',
        body: credentials,
      })

      applyAuthSession(response.token, response.data, response.message)
      return response // Retourne tout l'objet au lieu de true
    } catch (error) {
      setAuthFeedback({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Impossible de se connecter.',
      })
      return null
    } finally {
      setAuthSubmitting(false)
    }
  }

  async function register(values) {
    if (demoMode) {
      setAuthFeedback({
        type: 'error',
        message: 'Lance l API Laravel pour utiliser register.',
      })
      return null
    }

    setAuthSubmitting(true)
    setAuthFeedback(null)

    try {
      const response = await apiRequest('/api/register', {
        method: 'POST',
        body: {
          name: values.name,
          email: values.email,
          phone: values.phone,
          city: values.city,
          role: values.role,
          password: values.password,
          password_confirmation: values.passwordConfirmation,
        },
      })

      applyAuthSession(response.token, response.data, response.message)
      return response // Retourne tout l'objet au lieu de true
    } catch (error) {
      setAuthFeedback({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Impossible de creer le compte.',
      })
      return null
    } finally {
      setAuthSubmitting(false)
    }
  }

  async function logout() {
    if (!token) {
      clearAuthSession()
      return
    }

    try {
      if (!demoMode) {
        await apiRequest('/api/logout', {
          method: 'POST',
          token,
        })
      }
    } catch {
      // If the token is invalid, we still clear the local session.
    } finally {
      clearAuthSession('Deconnexion reussie.')
    }
  }

  async function submitBooking() {
    if (!activeService) {
      return false
    }

    if (!currentUser) {
      setBookingFeedback({
        type: 'error',
        message: 'Connecte-toi d abord pour reserver un service.',
      })
      return false
    }

    if (demoMode) {
      setBookingFeedback({
        type: 'error',
        message: 'Le backend doit etre lance pour enregistrer la reservation.',
      })
      return false
    }

    setBookingSubmitting(true)
    setBookingFeedback(null)

    try {
      const response = await apiRequest('/api/bookings', {
        method: 'POST',
        token,
        body: {
          service_id: activeService.id,
          client_name: currentUser.name,
          client_email: currentUser.email,
          client_phone: currentUser.phone,
          start_date: bookingForm.startDate,
          end_date: bookingForm.endDate || bookingForm.startDate,
          quantity: Number(bookingForm.quantity),
          payment_method: bookingForm.paymentMethod,
          service_address:
            bookingForm.serviceAddress || activeService.location_address || '',
          notes: bookingForm.notes,
        },
      })

      setBookingFeedback({
        type: 'success',
        message: `${response.message} Reference: ${response.data.booking_reference}`,
      })

      setBookingForm(createBookingForm(currentUser, activeService))

      if (token) {
        const bookingsResponse = await apiRequest('/api/my/bookings', { token })
        setMyBookings(bookingsResponse.data ?? [])
      }

      return true
    } catch (error) {
      setBookingFeedback({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Reservation impossible pour le moment.',
      })
      return false
    } finally {
      setBookingSubmitting(false)
    }
  }

  async function submitPublish() {
    if (!currentUser || !token || !canPublish) {
      setPublishFeedback({
        type: 'error',
        message: 'Tu dois etre connecte pour publier une annonce.',
      })
      return false
    }

    if (demoMode) {
      setPublishFeedback({
        type: 'error',
        message: 'L API doit etre lancee pour publier une nouvelle offre.',
      })
      return false
    }

    setPublishSubmitting(true)
    setPublishFeedback(null)

    try {
      const response = await apiRequest('/api/services', {
        method: 'POST',
        token,
        body: {
          service_type: publishForm.serviceType,
          category: publishForm.category,
          title: publishForm.title,
          description: publishForm.description,
          location_city: publishForm.city,
          location_address: publishForm.address,
          price: Number(publishForm.price),
          billing_unit: publishForm.billingUnit,
          capacity: publishForm.capacity ? Number(publishForm.capacity) : null,
          duration_label: publishForm.durationLabel,
          features: publishForm.features
            .split(/[\n,]/)
            .map((feature) => feature.trim())
            .filter(Boolean),
          image_url: publishForm.imageUrl || null,
        },
      })

      const createdService = response.data
      const nextManagedServices = [
        createdService,
        ...managedServices.filter((service) => service.id !== createdService.id),
      ]

      setManagedServices(nextManagedServices)
      if (createdService.status === 'active') {
        const nextServices = sortServicesForDisplay([
          createdService,
          ...services.filter((service) => service.id !== createdService.id),
        ])

        setServices(nextServices)
        setMeta(buildMetaFromServices(nextServices))
        setOverview((current) => syncOverviewSnapshot(current, nextServices))
      }
      setActiveServiceId(createdService.id)
      setPublishForm(createEmptyPublishForm(currentUser))
      setPublishFeedback({
        type: 'success',
        message:
          createdService.status === 'active'
            ? `${response.message} Elle apparait maintenant dans le catalogue.`
            : response.message,
      })

      return true
    } catch (error) {
      setPublishFeedback({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Publication impossible pour le moment.',
      })
      return false
    } finally {
      setPublishSubmitting(false)
    }
  }

  function getServicesByType(type) {
    return filterServices(allServices, {
      type,
      city: selectedCity,
      search: deferredSearch,
    })
  }

  // ---------- Commentaires (localStorage, par annonce) ----------
  function getCommentsForService(serviceId) {
    return Array.isArray(comments[serviceId]) ? comments[serviceId] : []
  }

  function addComment(serviceId, body) {
    if (!currentUser || !body?.trim()) return false
    const newComment = {
      id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      serviceId,
      authorId: currentUser.id ?? currentUser.email,
      authorName: currentUser.name,
      body: body.trim(),
      createdAt: new Date().toISOString(),
    }
    setComments((current) => ({
      ...current,
      [serviceId]: [...(current[serviceId] ?? []), newComment],
    }))
    return true
  }

  function deleteComment(serviceId, commentId) {
    if (!currentUser) return
    setComments((current) => {
      const list = current[serviceId] ?? []
      return {
        ...current,
        [serviceId]: list.filter(
          (c) =>
            c.id !== commentId ||
            c.authorId !== (currentUser.id ?? currentUser.email),
        ),
      }
    })
  }

  // ---------- Annonces du client (localStorage) ----------
  async function createUserListing(formValues) {
    if (!currentUser) return null

    if (demoMode || !token) {
      const listing = {
        id: `u-${Date.now()}`,
        service_type: formValues.serviceType ?? 'home_service',
        category: formValues.category ?? '',
        title: formValues.title ?? '',
        description: formValues.description ?? '',
        location_city: formValues.locationCity ?? currentUser.city ?? 'Maroc',
        location_address: formValues.locationAddress ?? '',
        latitude: formValues.latitude ? Number(formValues.latitude) : null,
        longitude: formValues.longitude ? Number(formValues.longitude) : null,
        phone: formValues.phone ?? currentUser.phone ?? '',
        price: Number(formValues.price ?? 0),
        surface: formValues.surface ? Number(formValues.surface) : null,
        bedrooms: formValues.bedrooms ? Number(formValues.bedrooms) : null,
        listing_kind: formValues.listingKind ?? null,
        billing_unit:
          formValues.billingUnit ??
          defaultBillingUnitByType[formValues.serviceType ?? 'home_service'],
        image_url: formValues.imageUrl ?? null,
        is_featured: false,
        rating: 0,
        reviews_count: 0,
        features: [],
        ownerId: currentUser.id ?? currentUser.email,
        ownerName: currentUser.name,
        createdAt: new Date().toISOString(),
        status: 'pending',
      }
      setUserListings((current) => [listing, ...current])
      return listing
    }

    const response = await apiRequest('/api/services', {
      method: 'POST',
      token,
      body: {
        service_type: formValues.serviceType ?? 'home_service',
        category: formValues.category ?? '',
        title: formValues.title ?? '',
        description: formValues.description ?? '',
        location_city: formValues.locationCity ?? currentUser.city ?? 'Maroc',
        location_address: formValues.locationAddress ?? '',
        latitude: formValues.latitude ? Number(formValues.latitude) : null,
        longitude: formValues.longitude ? Number(formValues.longitude) : null,
        phone: formValues.phone ?? currentUser.phone ?? '',
        price: Number(formValues.price ?? 0),
        surface: formValues.surface ? Number(formValues.surface) : null,
        bedrooms: formValues.bedrooms ? Number(formValues.bedrooms) : null,
        listing_kind: formValues.listingKind ?? null,
        billing_unit:
          formValues.billingUnit ??
          defaultBillingUnitByType[formValues.serviceType ?? 'home_service'],
        image_url: formValues.imageUrl ?? null,
      },
    })

    setManagedServices((current) => [response.data, ...current.filter((listing) => listing.id !== response.data.id)])

    return response
  }

  async function updateUserListing(id, patch) {
    if (!currentUser) return null

    if (demoMode || !token) {
      setUserListings((current) =>
        current.map((listing) =>
          listing.id === id &&
          listing.ownerId === (currentUser.id ?? currentUser.email)
            ? { ...listing, ...patch, price: Number(patch.price ?? listing.price), status: 'pending' }
            : listing,
        ),
      )
      return true
    }

    const response = await apiRequest(`/api/services/${id}`, {
      method: 'PATCH',
      token,
      body: {
        ...patch,
        price: patch.price !== undefined ? Number(patch.price) : undefined,
      },
    })

    setManagedServices((current) =>
      current.map((listing) => (listing.id === id ? response.data : listing)),
    )

    return response
  }

  async function deleteUserListing(id) {
    if (!currentUser) return false

    if (demoMode || !token) {
      setUserListings((current) =>
        current.filter(
          (listing) =>
            !(
              listing.id === id &&
              listing.ownerId === (currentUser.id ?? currentUser.email)
            ),
        ),
      )
      return true
    }

    await apiRequest(`/api/services/${id}`, {
      method: 'DELETE',
      token,
    })

    setManagedServices((current) => current.filter((listing) => listing.id !== id))
    return true
  }

  async function markNotificationsAsRead() {
    if (!token || !currentUser || demoMode || notificationsUnreadCount === 0) {
      return
    }

    try {
      await apiRequest('/api/notifications/read-all', {
        method: 'PUT',
        token,
      })

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          read_at: item.read_at ?? new Date().toISOString(),
        })),
      )
      setNotificationsUnreadCount(0)
    } catch {
      // Ignore: the dropdown can still render old notifications.
    }
  }

  const myListings = currentUser
    ? demoMode
      ? userListings.filter(
          (listing) =>
            listing.ownerId === (currentUser.id ?? currentUser.email),
        )
      : managedServices
    : []

  const value = {
    currentUser,
    authSubmitting,
    authFeedback,
    clearAuthFeedback,
    login,
    register,
    logout,
    darkMode,
    toggleDarkMode,
    overview,
    services,
    meta,
    stats,
    loading,
    demoMode,
    apiError,
    favorites,
    featuredServices,
    favoriteServices,
    search,
    setSearch,
    selectedType,
    setSelectedType,
    selectedCity,
    setSelectedCity,
    filteredServices,
    activeServiceId,
    activeService,
    selectService,
    toggleFavorite,
    getWhatsAppLink,
    getSupportWhatsAppLink,
    bookingForm,
    updateBookingField,
    submitBooking,
    bookingSubmitting,
    bookingFeedback,
    myBookings,
    bookingsLoading,
    canPublish,
    publishForm,
    updatePublishField,
    submitPublish,
    publishSubmitting,
    publishFeedback,
    managedServices,
    managedBookings,
    managementLoading,
    getServicesByType,
    notifications,
    notificationsLoading,
    notificationsUnreadCount,
    markNotificationsAsRead,
    // Commentaires
    getCommentsForService,
    addComment,
    deleteComment,
    // Annonces du client
    createUserListing,
    updateUserListing,
    deleteUserListing,
    myListings,
    accessMode,
    token,
    allServices,
  }

  return (
    <MarketplaceContext.Provider value={value}>
      {children}
    </MarketplaceContext.Provider>
  )
}

export function useMarketplace() {
  const context = useContext(MarketplaceContext)
  if (!context) {
    throw new Error('useMarketplace must be used within MarketplaceProvider')
  }
  return context
}
