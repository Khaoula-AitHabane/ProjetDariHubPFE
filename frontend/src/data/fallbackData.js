export const fallbackServices = [
  {
    id: 1,
    title: 'Appartement familial avec terrasse',
    service_type: 'house_rental',
    category: 'Maison',
    description:
      'Appartement meuble avec cuisine equipee, Wi-Fi et parking prive a quelques minutes de la corniche.',
    location_city: 'Casablanca',
    location_address: 'Ain Diab, Casablanca',
    price: 850,
    billing_unit: 'per_night',
    rating: 4.8,
    reviews_count: 37,
    is_featured: true,
    features: ['Wi-Fi', 'Parking', 'Cuisine equipee', 'Vue terrasse'],
    image_url:
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
    provider: {
      id: 2,
      name: 'Asmae Immobilier',
      city: 'Casablanca',
    },
  },
  {
    id: 2,
    title: 'Villa piscine pour weekend',
    service_type: 'house_rental',
    category: 'Villa',
    description:
      'Villa spacieuse pour familles et petits groupes avec jardin, piscine et service de gardiennage.',
    location_city: 'Marrakech',
    location_address: 'Route de l Ourika, Marrakech',
    price: 1800,
    billing_unit: 'per_night',
    rating: 4.9,
    reviews_count: 19,
    is_featured: true,
    features: ['Piscine', 'Jardin', 'Climatisation', 'Cuisine ouverte'],
    image_url:
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
    provider: {
      id: 2,
      name: 'Asmae Immobilier',
      city: 'Casablanca',
    },
  },
  {
    id: 3,
    title: 'Pack salon marocain evenement',
    service_type: 'furniture_rental',
    category: 'Mafrouchat',
    description:
      'Salon complet avec banquettes, tables basses et tapis pour receptions familiales et fetes.',
    location_city: 'Marrakech',
    location_address: 'Gueliz, Marrakech',
    price: 1200,
    billing_unit: 'per_day',
    rating: 4.7,
    reviews_count: 24,
    is_featured: true,
    features: ['Livraison', 'Installation', 'Tapis inclus', 'Style traditionnel'],
    image_url:
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
    provider: {
      id: 3,
      name: 'Youssef Mafrouchat',
      city: 'Marrakech',
    },
  },
  {
    id: 4,
    title: 'Tables et chaises pour receptions',
    service_type: 'furniture_rental',
    category: 'Reception',
    description:
      'Lot flexible de tables rondes, chaises rembourrees et nappes pour ceremonies et reunions.',
    location_city: 'Rabat',
    location_address: 'Souissi, Rabat',
    price: 450,
    billing_unit: 'per_day',
    rating: 4.5,
    reviews_count: 15,
    is_featured: false,
    features: ['Montage rapide', 'Transport inclus', 'Choix de nappes'],
    image_url:
      'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80',
    provider: {
      id: 3,
      name: 'Youssef Mafrouchat',
      city: 'Marrakech',
    },
  },
  {
    id: 5,
    title: 'Menage premium a domicile',
    service_type: 'home_service',
    category: 'Menage',
    description:
      'Equipe experimentee pour nettoyage complet, vitres, sols et cuisine avec produits inclus.',
    location_city: 'Casablanca',
    location_address: 'Maarif, Casablanca',
    price: 250,
    billing_unit: 'per_service',
    rating: 4.8,
    reviews_count: 41,
    is_featured: true,
    features: ['Produits inclus', 'Equipe verifiee', 'Ponctualite'],
    image_url:
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80',
    provider: {
      id: 4,
      name: 'Salma Home Services',
      city: 'Rabat',
    },
  },
  {
    id: 6,
    title: 'Plomberie express 7j/7',
    service_type: 'home_service',
    category: 'Plomberie',
    description:
      'Depannage de fuites, chauffe-eau, robinetterie et entretien sanitaire dans la journee.',
    location_city: 'Rabat',
    location_address: 'Agdal, Rabat',
    price: 320,
    billing_unit: 'per_service',
    rating: 4.6,
    reviews_count: 18,
    is_featured: false,
    features: ['Urgence', 'Pieces standard', 'Technicien certifie'],
    image_url:
      'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1200&q=80',
    provider: {
      id: 4,
      name: 'Salma Home Services',
      city: 'Rabat',
    },
  },
  {
    id: 7,
    title: 'Electricien de confiance',
    service_type: 'home_service',
    category: 'Electricite',
    description:
      'Installation luminaires, prises, disjoncteurs et verification securite pour appartements et villas.',
    location_city: 'Casablanca',
    location_address: 'Sidi Maarouf, Casablanca',
    price: 280,
    billing_unit: 'per_service',
    rating: 4.7,
    reviews_count: 22,
    is_featured: false,
    features: ['Diagnostic securise', 'Materiel standard', 'Support apres visite'],
    image_url:
      'https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=1200&q=80',
    provider: {
      id: 4,
      name: 'Salma Home Services',
      city: 'Rabat',
    },
  },
  {
    id: 8,
    title: 'Entretien jardin et arrosage',
    service_type: 'home_service',
    category: 'Jardinage',
    description:
      'Tonte, taille, plantation et planification d arrosage pour petits et grands espaces verts.',
    location_city: 'Marrakech',
    location_address: 'Palmeraie, Marrakech',
    price: 390,
    billing_unit: 'per_service',
    rating: 4.4,
    reviews_count: 11,
    is_featured: false,
    features: ['Taille', 'Nettoyage', 'Conseils entretien'],
    image_url:
      'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=1200&q=80',
    provider: {
      id: 4,
      name: 'Salma Home Services',
      city: 'Rabat',
    },
  },
]

export const fallbackOverview = {
  platform: {
    name: 'Khadamat Dar',
    tagline:
      'La plateforme PFE qui relie clients et prestataires de services a domicile.',
    cities: ['Casablanca', 'Marrakech', 'Rabat'],
  },
  stats: {
    services: 8,
    providers: 3,
    clients: 2,
    bookings: 3,
  },
  serviceTypes: [
    {
      key: 'house_rental',
      label: 'Location de maisons',
      description: 'Appartements, villas et logements equipes.',
      count: 2,
    },
    {
      key: 'furniture_rental',
      label: 'Location de mafrouchat',
      description: 'Salons, tables, chaises et equipements pour evenements.',
      count: 2,
    },
    {
      key: 'home_service',
      label: 'Services a domicile',
      description: 'Menage, plomberie, electricite et jardinage.',
      count: 4,
    },
  ],
  featuredServices: fallbackServices.filter((service) => service.is_featured).slice(0, 3),
}
