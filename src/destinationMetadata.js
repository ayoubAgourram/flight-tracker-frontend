const curatedCountryMetadata = {
  'Afrique du Sud': { tags: ['beach', 'nature', 'wildlife', 'adventure', 'city'], minNights: 3, maxNights: 21, description: 'Coasts, wildlife and dramatic landscapes.' },
  'Allemagne': { tags: ['city', 'culture', 'history', 'food'], minNights: 2, maxNights: 10, description: 'Historic cities, museums and food.' },
  'Argentine': { tags: ['nature', 'adventure', 'food', 'city'], minNights: 5, maxNights: 21, description: 'Big cities, food and wide-open landscapes.' },
  'Australie': { tags: ['beach', 'nature', 'adventure', 'wildlife'], minNights: 7, maxNights: 30, description: 'Beaches, wildlife and outdoor adventure.' },
  'Bahamas': { tags: ['beach', 'relaxation', 'family', 'water'], minNights: 3, maxNights: 14, description: 'Clear water, beaches and easy relaxation.' },
  'Barbade': { tags: ['beach', 'relaxation', 'family', 'water', 'food'], minNights: 4, maxNights: 14, description: 'Warm beaches, water and island food.' },
  'Brésil': { tags: ['beach', 'city', 'nature', 'adventure', 'food'], minNights: 5, maxNights: 21, description: 'Beaches, lively cities and natural wonders.' },
  'Canada': { tags: ['nature', 'city', 'family', 'adventure', 'winter'], minNights: 2, maxNights: 14, description: 'Nature, cities and four-season escapes.' },
  'Chili': { tags: ['nature', 'adventure', 'food', 'city'], minNights: 5, maxNights: 21, description: 'Diverse landscapes, wine and adventure.' },
  'Colombie': { tags: ['beach', 'nature', 'city', 'culture', 'food', 'adventure'], minNights: 4, maxNights: 18, description: 'Caribbean coast, culture and mountain cities.' },
  'Costa Rica': { tags: ['beach', 'nature', 'wildlife', 'adventure', 'family'], minNights: 5, maxNights: 18, description: 'Rainforest, wildlife, volcanoes and beaches.' },
  'Cuba': { tags: ['beach', 'relaxation', 'family', 'culture', 'water'], minNights: 3, maxNights: 14, description: 'Sunny beaches, music and relaxed island stays.' },
  'Égypte': { tags: ['beach', 'history', 'culture', 'adventure', 'family'], minNights: 4, maxNights: 14, description: 'Red Sea beaches and ancient history.' },
  'Espagne': { tags: ['beach', 'city', 'culture', 'food', 'family'], minNights: 3, maxNights: 14, description: 'Mediterranean beaches, cities and food.' },
  'États-Unis': { tags: ['beach', 'city', 'family', 'nature', 'adventure', 'food'], minNights: 3, maxNights: 21, description: 'Beaches, cities, parks and family trips.' },
  'France': { tags: ['beach', 'city', 'culture', 'history', 'food', 'family'], minNights: 3, maxNights: 14, description: 'Coastal escapes, culture and great food.' },
  'Grèce': { tags: ['beach', 'relaxation', 'culture', 'history', 'food', 'family'], minNights: 4, maxNights: 14, description: 'Island beaches, ancient sites and food.' },
  'Guadeloupe': { tags: ['beach', 'relaxation', 'nature', 'family', 'water'], minNights: 4, maxNights: 14, description: 'Caribbean beaches, nature and warm water.' },
  'Inde': { tags: ['culture', 'food', 'history', 'adventure'], minNights: 6, maxNights: 21, description: 'Rich culture, food and memorable journeys.' },
  'Irlande': { tags: ['nature', 'culture', 'history', 'food'], minNights: 3, maxNights: 12, description: 'Green landscapes, history and coastal towns.' },
  'Islande': { tags: ['nature', 'adventure', 'winter', 'wildlife'], minNights: 4, maxNights: 12, description: 'Volcanoes, waterfalls and northern landscapes.' },
  'Italie': { tags: ['city', 'culture', 'history', 'food', 'beach'], minNights: 4, maxNights: 14, description: 'Art, history, food and Mediterranean coasts.' },
  'Jamaïque': { tags: ['beach', 'relaxation', 'water', 'family', 'music'], minNights: 4, maxNights: 14, description: 'Caribbean beaches, music and island life.' },
  'Japon': { tags: ['city', 'culture', 'history', 'food', 'nature'], minNights: 7, maxNights: 21, description: 'Food, technology, tradition and nature.' },
  'Maroc': { tags: ['beach', 'culture', 'history', 'food', 'adventure'], minNights: 3, maxNights: 14, description: 'Markets, coastlines, food and desert landscapes.' },
  'Martinique': { tags: ['beach', 'relaxation', 'nature', 'family', 'water'], minNights: 4, maxNights: 14, description: 'French Caribbean beaches and lush nature.' },
  'Mexique': { tags: ['beach', 'relaxation', 'family', 'culture', 'food', 'adventure'], minNights: 4, maxNights: 18, description: 'Beach resorts, culture, food and adventure.' },
  'Norvège': { tags: ['nature', 'adventure', 'winter', 'wildlife'], minNights: 4, maxNights: 14, description: 'Fjords, northern lights and outdoor adventure.' },
  'Panama': { tags: ['beach', 'nature', 'city', 'adventure'], minNights: 4, maxNights: 14, description: 'Tropical beaches, rainforest and city life.' },
  'Pérou': { tags: ['culture', 'history', 'nature', 'adventure', 'food'], minNights: 5, maxNights: 18, description: 'Ancient history, food and dramatic nature.' },
  'Portugal': { tags: ['beach', 'city', 'culture', 'food', 'family'], minNights: 3, maxNights: 14, description: 'Atlantic beaches, cities and relaxed food trips.' },
  'République dominicaine': { tags: ['beach', 'relaxation', 'family', 'water'], minNights: 4, maxNights: 14, description: 'Warm beaches, all-inclusive stays and clear water.' },
  'Sainte-Lucie': { tags: ['beach', 'relaxation', 'nature', 'water'], minNights: 4, maxNights: 14, description: 'Quiet beaches, water and lush volcanic scenery.' },
  'Turquie': { tags: ['beach', 'culture', 'history', 'food', 'family'], minNights: 4, maxNights: 14, description: 'Coasts, bazaars, history and generous food.' },
  'Émirats arabes unis': { tags: ['beach', 'city', 'family', 'food', 'shopping'], minNights: 3, maxNights: 10, description: 'Warm beaches, modern cities and family attractions.' }
}

const normalizeText = (value) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim()

const regionCountries = {
  europe: [
    'Albanie', 'Allemagne', 'Autriche', 'Belgique', 'Bosnie-Herzégovine', 'Bulgarie',
    'Chypre', 'Croatie', 'Danemark', 'Espagne', 'Estonie', 'Finlande', 'France',
    'Grèce', 'Gibraltar', 'Hongrie', 'Irlande', 'Islande', 'Italie', 'Île de Man',
    'Jersey', 'Kosovo', 'Lettonie', 'Lituanie', 'Luxembourg', 'Macédoine', 'Malte',
    'Moldavie', 'Monténégro', 'Norvège', 'Pays-Bas', 'Pologne', 'Portugal',
    'République tchèque', 'Roumanie', 'Royaume-Uni', 'Serbie', 'Slovaquie',
    'Slovénie', 'Suède', 'Suisse', 'Turquie', 'Ukraine'
  ],
  northAmerica: ['Canada', 'États-Unis', 'Mexique', 'Cuba', 'Bahamas', 'Jamaïque', 'Porto Rico'],
  centralAmerica: ['Costa Rica', 'Guatemala', 'Honduras', 'Nicaragua', 'Panama', 'Salvador'],
  southAmerica: ['Argentine', 'Brésil', 'Chili', 'Colombie', 'Équateur', 'Guyana', 'Paraguay', 'Pérou', 'Uruguay', 'Vénézuela'],
  caribbean: ['Antigua', 'Aruba', 'Barbade', 'Curaçao', 'Grenade', 'Guadeloupe', 'Martinique', 'République dominicaine', 'Sainte-Lucie', 'St-Martin', 'Îles Caïmans'],
  africa: ['Afrique du Sud', 'Algérie', 'Cap-Vert', 'Égypte', 'Gambie', 'Ghana', 'Guinée Bissau', 'Maroc', 'Maurice', 'Mozambique', 'Sénégal', 'Tunisie'],
  asia: ['Arabie saoudite', 'Arménie', 'Azerbaijan', 'Bangladesh', 'Chine', 'Émirats arabes unis', 'Géorgie', 'Inde', 'Irak', 'Iran', 'Israël', 'Japon', 'Jordanie', 'Koweït', 'Liban', 'Pakistan', 'Philippines', 'Sri Lanka', 'Taiwan', 'Thaïlande'],
  oceania: ['Australie', 'Nouvelle-Zélande']
}

const countryRegion = new Map(Object.entries(regionCountries).flatMap(([region, countries]) => countries.map((country) => [normalizeText(country), region])))
const getCountryRegion = (country) => countryRegion.get(normalizeText(country)) || null

export const getCountryMetadata = (country) => ({ ...(curatedCountryMetadata[country] || {
  tags: ['city', 'culture', 'nature', 'food'],
  minNights: 2,
  maxNights: 21,
  description: `Explore ${country} through its cities, culture and local experiences.`
}), region: getCountryRegion(country) })

export const getSearchTerms = (query) => {
  const normalizedQuery = normalizeText(query)
  const terms = []
  const intentKeywords = {
    beach: ['beach', 'sea', 'coast', 'island', 'plage', 'mer', 'bord de mer', 'isla'],
    relaxation: ['relax', 'relaxation', 'rest', 'repos', 'quiet', 'calm', 'detente', 'resort'],
    nature: ['nature', 'mountain', 'forest', 'hiking', 'outdoor', 'naturel', 'randonnee'],
    city: ['city', 'urban', 'museum', 'ville', 'musee'],
    culture: ['culture', 'history', 'historic', 'art', 'culturel', 'historique'],
    food: ['food', 'restaurant', 'cuisine', 'gastronomy', 'gastronomie'],
    family: ['family', 'kids', 'children', 'famille', 'enfants'],
    adventure: ['adventure', 'sport', 'aventura', 'aventure'],
    winter: ['winter', 'ski', 'snow', 'hiver', 'neige']
  }

  Object.entries(intentKeywords).forEach(([intent, keywords]) => {
    if (keywords.some((keyword) => normalizedQuery.includes(normalizeText(keyword)))) terms.push(intent)
  })

  const regionKeywords = {
    europe: ['europe', 'european', 'européen', 'européenne'],
    northAmerica: ['north america', 'north american', 'amerique du nord', 'amérique du nord'],
    centralAmerica: ['central america', 'central american', 'amerique centrale', 'amérique centrale'],
    southAmerica: ['south america', 'south american', 'amerique du sud', 'amérique du sud'],
    caribbean: ['caribbean', 'caribean', 'caraibes', 'caraïbes'],
    africa: ['africa', 'african', 'afrique'],
    asia: ['asia', 'asian', 'asie'],
    oceania: ['oceania', 'australasia', 'oceanie', 'océanie']
  }
  const region = Object.entries(regionKeywords).find(([, keywords]) => keywords.some((keyword) => normalizedQuery.includes(normalizeText(keyword))))?.[0] || null

  const durationMatch = normalizedQuery.match(/(\d+)\s*(day|days|jour|jours|night|nights|nuit|nuits)/)
  return {
    intents: terms,
    region,
    nights: durationMatch ? Math.max(1, Number(durationMatch[1]) - (durationMatch[0].includes('day') || durationMatch[0].includes('jour') ? 1 : 0)) : null
  }
}

export const normalizeCountry = normalizeText
