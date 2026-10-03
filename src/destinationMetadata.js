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
  .replace(/[^a-z0-9]+/g, ' ')
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

const monthNumbers = {
  january: 1, janvier: 1, february: 2, fevrier: 2, march: 3, mars: 3, april: 4, avril: 4,
  may: 5, mai: 5, june: 6, juin: 6, july: 7, juillet: 7, august: 8, aout: 8,
  september: 9, septembre: 9, sept: 9, october: 10, octobre: 10, november: 11, novembre: 11,
  december: 12, decembre: 12
}

export const getSearchTerms = (query) => {
  const normalizedQuery = normalizeText(query)
  const intentKeywords = {
    beach: ['beach', 'beaches', 'seaside', 'seaside holiday', 'coast', 'coastal', 'island', 'islands', 'ocean', 'sea', 'plage', 'plages', 'mer', 'bord de mer', 'littoral', 'isla'],
    relaxation: ['relax', 'relaxing', 'relaxation', 'rest', 'repos', 'quiet', 'calm', 'detente', 'détente', 'resort', 'peaceful'],
    nature: ['nature', 'mountain', 'mountains', 'forest', 'hiking', 'outdoor', 'wildlife', 'naturel', 'randonnee', 'randonnée'],
    city: ['city', 'cities', 'urban', 'museum', 'museums', 'ville', 'villes', 'musee', 'musée'],
    culture: ['culture', 'history', 'historic', 'art', 'architecture', 'culturel', 'historique'],
    food: ['food', 'restaurant', 'restaurants', 'cuisine', 'gastronomy', 'gastronomie', 'culinary'],
    family: ['family', 'kids', 'children', 'famille', 'enfants', 'child friendly'],
    adventure: ['adventure', 'sport', 'sports', 'aventura', 'aventure', 'active holiday'],
    winter: ['winter', 'ski', 'snow', 'hiver', 'neige', 'northern lights'],
    warm: ['warm', 'hot', 'sunny', 'sunshine', 'tropical', 'warm weather', 'ensoleille', 'ensoleillé', 'soleil', 'chaud']
  }

  const intents = Object.entries(intentKeywords)
    .filter(([, keywords]) => keywords.some((keyword) => ` ${normalizedQuery} `.includes(` ${normalizeText(keyword)} `)))
    .map(([intent]) => intent)

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

  const durationMatch = normalizedQuery.match(/\b(\d+)\s*(day|days|jour|jours|night|nights|nuit|nuits)\b/)
  let nights = null
  if (durationMatch) {
    const amount = Number(durationMatch[1])
    const unit = durationMatch[2]
    nights = unit.startsWith('day') || unit.startsWith('jour') ? Math.max(1, amount - 1) : amount
  } else if (/\b(long weekend|long week end|week end prolonge)\b/.test(normalizedQuery)) {
    nights = 3
  } else if (/\b(weekend|week end)\b/.test(normalizedQuery)) {
    nights = 2
  } else if (/\b(two weeks|2 weeks|fortnight|deux semaines)\b/.test(normalizedQuery)) {
    nights = 13
  } else if (/\b(one week|a week|1 week|une semaine)\b/.test(normalizedQuery)) {
    nights = 6
  }

  const stopWords = new Set(['i', 'want', 'would', 'like', 'to', 'go', 'for', 'in', 'with', 'the', 'a', 'an', 'and', 'or', 'of', 'from', 'destination', 'destinations', 'trip', 'travel', 'holiday', 'holidays', 'vacation', 'vacations', 'please', 'me', 'some', 'find', 'show', 'looking', 'looking for'])
  const queryWords = normalizedQuery.split(' ')
  const month = queryWords.reduce((found, word, position) => {
    if (found || !(word in monthNumbers)) return found
    // "may" is also a common verb, so require month-like context for it.
    if (word === 'may' && !(['in', 'during', 'for', 'early', 'late', 'mid', 'of'].includes(queryWords[position - 1]) || /^\d+$/.test(queryWords[position + 1] || ''))) return found
    return monthNumbers[word]
  }, null)
  const textTerms = queryWords.filter((word) => word.length > 1 && !stopWords.has(word) && !/^\d+$/.test(word) && !(word in monthNumbers))
  return {
    intents,
    region,
    nights,
    month,
    textTerms
  }
}

export const normalizeCountry = normalizeText

// Airport data uses French country names; users often type the English ones.
const countryAliases = {
  'Afrique du Sud': ['south africa'], 'Allemagne': ['germany'], 'Autriche': ['austria'], 'Belgique': ['belgium'],
  'Brésil': ['brazil'], 'Chypre': ['cyprus'], 'Croatie': ['croatia'], 'Danemark': ['denmark'],
  'Égypte': ['egypt'], 'Émirats arabes unis': ['uae', 'united arab emirates', 'dubai'], 'Équateur': ['ecuador'],
  'Espagne': ['spain'], 'États-Unis': ['usa', 'united states', 'america'], 'Finlande': ['finland'],
  'Grèce': ['greece'], 'Hongrie': ['hungary'], 'Irlande': ['ireland'], 'Islande': ['iceland'],
  'Italie': ['italy'], 'Jamaïque': ['jamaica'], 'Japon': ['japan'], 'Maroc': ['morocco'],
  'Mexique': ['mexico'], 'Norvège': ['norway'], 'Pays-Bas': ['netherlands', 'holland'], 'Pérou': ['peru'],
  'Pologne': ['poland'], 'République dominicaine': ['dominican republic'], 'République tchèque': ['czech republic', 'czechia'],
  'Roumanie': ['romania'], 'Royaume-Uni': ['uk', 'united kingdom', 'england', 'britain'], 'Sainte-Lucie': ['saint lucia', 'st lucia'],
  'Suède': ['sweden'], 'Suisse': ['switzerland'], 'Thaïlande': ['thailand'], 'Tunisie': ['tunisia'],
  'Turquie': ['turkey'], 'Colombie': ['colombia'], 'Argentine': ['argentina'], 'Chili': ['chile'],
  'Australie': ['australia'], 'Inde': ['india'], 'Chine': ['china'], 'Algérie': ['algeria']
}

// Country tags are coarse, so inland cities must not satisfy beach intents.
const inlandCities = new Set([
  'Madrid', 'Séville', 'Grenade', 'Valladolid', 'Cordoba', 'Vitoria', 'Saragosse', 'Logrono', 'Bilbao', 'Corvera',
  'Saint-Jacques-de-Compostelle', 'Xérès', 'Oviedo',
  'Paris', 'Lyon', 'Toulouse', 'Lille', 'Limoges', 'Strasbourg', 'Tarbes', 'Chambéry', 'Bergerac', 'Rodez',
  'Brive-la-Gaillarde', 'Carcassonne', 'Clermont-Ferrand', 'Dole', 'Poitiers', 'Tours', 'Saint-Pierre-des-Corps',
  'Chalons-en-Champagne', 'Arras', 'Angers', 'Avignon', 'Le Mans', 'Metz-Nancy Lorraine', 'Reims Champagne-Ardenne',
  'Laval', 'Aix-en-provence', 'Nantes', 'Rennes', 'Nîmes', 'Bordeaux',
  'Rome', 'Milan', 'Bologne', 'Turin', 'Vérone', 'Florence', 'Pérouse',
  'Kozani', 'Kastoria', 'Ioannina', 'Larissa',
  'Kayseri', 'Ankara', 'Konya', 'Gaziantep', 'Zagreb',
  'Mexico', 'Mexico City', 'Guadalajara', 'Monterrey', 'Queretaro', 'Puebla', 'Toluca', 'Leon', 'Morelia', 'Aguascalientes', 'Chihuahua',
  'Bogota', 'Medellin', 'Cali', 'Brasilia', 'Belo Horizonte'
].map(normalizeText))

export const createDestinationSearchIndex = (destinations) => destinations.map((destination) => {
  const metadata = getCountryMetadata(destination.country)
  const airportText = Array.isArray(destination.airports)
    ? destination.airports.map((airport) => `${airport.code || ''} ${airport.city || ''} ${airport.label || ''}`).join(' ')
    : `${destination.code || ''} ${destination.city || ''} ${destination.label || ''}`
  const aliases = (countryAliases[destination.country] || []).map(normalizeText)
  const cities = Array.isArray(destination.airports) ? destination.airports.map((airport) => airport.city) : [destination.city]
  const isInland = cities.length > 0 && cities.every((city) => inlandCities.has(normalizeText(city || '')))
  return {
    destination,
    metadata,
    isInland,
    searchText: normalizeText(`${destination.country || ''} ${aliases.join(' ')} ${airportText}`),
    countryNames: [normalizeText(destination.country || ''), ...aliases].filter(Boolean)
  }
})

export const searchDestinations = (index, query, limit = Infinity) => {
  const normalizedQuery = normalizeText(query)
  if (!normalizedQuery) return index.map(({ destination, metadata }) => ({ destination, metadata, score: 0 }))

  const { intents, region, nights, month, textTerms } = getSearchTerms(query)
  const hasStructuredIntent = intents.length > 0 || region !== null || nights !== null || month !== null
  const paddedQuery = ` ${normalizedQuery} `
  const namedCountries = index.filter((entry) => entry.countryNames.some((name) => paddedQuery.includes(` ${name} `)))
  const candidates = namedCountries.length ? namedCountries : index
  const results = []

  for (const entry of candidates) {
    const { destination, metadata, searchText, isInland } = entry
    if (region && metadata.region !== region) continue

    const isExplicitCountry = namedCountries.length > 0
    const matchingIntents = intents.filter((intent) => {
      if (isInland && (intent === 'beach' || intent === 'warm')) return false
      return metadata.tags.includes(intent) || (intent === 'warm' && (metadata.tags.includes('beach') || metadata.tags.includes('relaxation')))
    })
    const matchingTextTerms = textTerms.filter((term) => searchText.includes(term))
    const durationFit = nights === null || (nights >= metadata.minNights && nights <= metadata.maxNights)

    if (intents.length && matchingIntents.length === 0 && (!isExplicitCountry || isInland)) continue
    if (textTerms.length && !hasStructuredIntent && matchingTextTerms.length === 0 && !isExplicitCountry) continue

    const score = (isExplicitCountry ? 100 : 0)
      + matchingIntents.length * 12
      + matchingTextTerms.length * 8
      + (durationFit && nights !== null ? 6 : nights !== null ? -4 : 0)
      + (region ? 15 : 0)

    results.push({ destination, metadata, score })
  }

  results.sort((first, second) => second.score - first.score || String(first.destination.country || '').localeCompare(String(second.destination.country || '')))
  return results.slice(0, limit)
}
