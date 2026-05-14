// Aucune donnee factice : le catalogue est alimente uniquement par l API Laravel.
// Les donnees proviennent soit des utilisateurs qui publient une annonce, soit du
// scraper Playwright (voir dossier /scraper) qui importe de vraies annonces
// depuis des sites marocains (Avito, Mubawab, etc.).

export const fallbackServices = []

export const fallbackOverview = {
  platform: {
    name: 'DariHub',
    tagline:
      'La plateforme marocaine des annonces immobilier, meubles et services maison.',
    cities: [],
  },
  stats: {
    services: 0,
    providers: 0,
    clients: 0,
    bookings: 0,
  },
  serviceTypes: [
    {
      key: 'house_rental',
      label: 'Immobilier',
      description: 'Appartements, villas, maisons et terrains au Maroc.',
      count: 0,
    },
    {
      key: 'furniture_rental',
      label: 'Meubles',
      description: 'Salons, chambres, electromenagers et decoration.',
      count: 0,
    },
    {
      key: 'home_service',
      label: 'Services maison',
      description: 'Menage, plomberie, electricite, jardinage et bricolage.',
      count: 0,
    },
  ],
  featuredServices: [],
}
