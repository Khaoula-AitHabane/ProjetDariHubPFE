export const SMART_LOCATION_DICTIONARY = {
  tokenReplacements: [
    { aliases: ['9rib', '9reb', 'qrib', '9rib mn', '9reb mn'], replacement: 'pres de' },
    { aliases: ['7da', 'hda', 'hdah', '7dah'], replacement: 'pres de' },
    { aliases: ['près', 'pres', 'pres de', 'proche de'], replacement: 'pres de' },
    { aliases: ['mcdo', 'macdo', 'mcdonald', 'mcdonalds'], replacement: "McDonald's" },
    { aliases: ['casa', 'casa blanka', 'dar البيضاء'], replacement: 'Casablanca' },
    { aliases: ['rbat', 'rbat'], replacement: 'Rabat' },
    { aliases: ['marrakch', 'marrakech', 'marrakesh'], replacement: 'Marrakech' },
    { aliases: ['tanja', 'طنجة'], replacement: 'Tanger' },
    { aliases: ['gueliz', 'geliz', 'gueliz', 'gouliz'], replacement: 'Gueliz Marrakech' },
    { aliases: ['agdal rabat', 'agdal'], replacement: 'Agdal Rabat' },
    { aliases: ['gare casa', 'gare casa', 'casa voyageurs'], replacement: 'Casa Voyageurs Casablanca' },
    { aliases: ['marjane', 'marjan'], replacement: 'Marjane' },
    { aliases: ['cafe france', 'café france', 'cafe de france'], replacement: 'Cafe de France' },
    { aliases: ['bab dokala', 'bab doukala', 'bab doukkala', 'bd dokala'], replacement: 'Bab Doukkala Marrakech' },
    { aliases: ['dar', 'appart', 'appartement', 'maison'], replacement: '' },
  ],
  cityAliases: {
    Casablanca: ['casablanca', 'casa', 'dar البيضاء'],
    Rabat: ['rabat', 'rbat'],
    Marrakech: ['marrakech', 'marrakch', 'marrakesh'],
    Tanger: ['tanger', 'tanja', 'طنجة'],
    Agadir: ['agadir'],
    Fes: ['fes', 'fès'],
    Laayoune: ['laayoune', 'laâyoune', 'al aaiún', 'العيون'],
  },
  landmarks: [
    {
      canonical: 'McDonald’s Gueliz Marrakech',
      aliases: ['mcdo gueliz', 'mcdonald gueliz', 'macdo gueliz', 'gueliz mcdo'],
      city: 'Marrakech',
    },
    {
      canonical: 'Marjane Rabat',
      aliases: ['marjane rabat', '7da marjane rabat', 'pres de marjane rabat'],
      city: 'Rabat',
    },
    {
      canonical: 'Casa Voyageurs Casablanca',
      aliases: ['gare casa', 'gare casablanca', 'casa voyageurs', 'pres de gare casa'],
      city: 'Casablanca',
    },
    {
      canonical: 'Agdal Rabat',
      aliases: ['agdal', 'dar f agdal', 'agdal rabat'],
      city: 'Rabat',
    },
    {
      canonical: 'Cafe de France Marrakech',
      aliases: ['cafe france marrakech', 'café france marrakech', 'pres cafe france marrakech'],
      city: 'Marrakech',
    },
    {
      canonical: 'Gueliz Marrakech',
      aliases: ['gueliz', 'geliz', 'gueliz', 'gouliz'],
      city: 'Marrakech',
    },
    {
      canonical: 'Bab Doukkala Marrakech',
      aliases: ['bab dokala', 'bab doukala', 'bab doukkala', 'bd dokala'],
      city: 'Marrakech',
    },
    {
      canonical: 'Hay Riad Rabat',
      aliases: ['hay riad', 'hay ryad', 'حي الرياض'],
      city: 'Rabat',
    },
    {
      canonical: 'Maarif Casablanca',
      aliases: ['maarif', 'ma3arif', 'المعاريف'],
      city: 'Casablanca',
    },
  ],
}

export const SMART_LOCATION_SUGGESTIONS = [
  '9rib mn mcdo gueliz',
  '7da marjane rabat',
  'pres de gare casa',
  'dar f agdal',
  'près café france marrakech',
  'bab dokala marrakech',
  'Hay Riad Rabat',
  'Maarif Casablanca',
]
