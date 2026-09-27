<template>
  <main class="travel-home">
    <header class="travel-home__header">
      <div class="brand-mark"><span class="brand-mark__word">AIR TRANSAT</span><span class="brand-mark__tagline">ROUTE PLANNER</span></div>
      <div class="travel-home__header-actions">
        <!--button class="tracker-link" type="button" @click="$emit('start')">Flight tracker</button-->
        <!--button class="icon-button" type="button" aria-label="Notifications">♧</button-->
      </div>
    </header>

    <section class="travel-home__content">
      <div class="travel-search">
        <span class="travel-search__icon" aria-hidden="true">⌕</span>
        <input v-model.trim="searchQuery" type="search" placeholder="Where do you want to go?" aria-label="Search destinations by travel idea" />
        <button v-if="searchQuery" class="travel-search__clear" type="button" aria-label="Clear search" @click="searchQuery = ''">×</button>
      </div>

      <section class="quick-destinations" aria-labelledby="quick-destinations-title">
        <div class="section-heading">
          <h1 id="quick-destinations-title">{{ searchQuery ? 'Destinations for your trip' : 'Popular from Montreal' }}</h1>
          <button type="button" @click="$emit('plan-route')">See all</button>
        </div>
        <div v-if="displayedQuickDestinations.length" class="quick-destinations__rail">
          <button v-for="destination in displayedQuickDestinations" :key="destination.code" class="quick-destination" type="button" @click="openDestination(destination.code)">
            <img class="quick-destination__image" :src="destination.image" :alt="`${destination.city}, ${destination.country}`" @error="handleImageError($event, destination)" />
            <strong>{{ destination.city }}</strong><small>{{ destination.code }}</small>
          </button>
        </div>
        <p v-else class="empty-search">No available route matches that travel idea yet.</p>
      </section>

      <button class="featured-destination" type="button" @click="openDestination(displayedFeaturedDestination.code)">
        <img class="featured-destination__image" :src="displayedFeaturedDestination.image" :alt="`${displayedFeaturedDestination.city}, ${displayedFeaturedDestination.country}`" @error="handleImageError($event, displayedFeaturedDestination)" />
        <span class="featured-destination__copy"><small>{{ searchQuery ? 'Matched to your search' : 'Air Transat route inspiration' }}</small><strong>{{ displayedFeaturedDestination.city }}</strong><span>{{ displayedFeaturedDestination.country }} · Direct route from Montreal</span></span>
        <span class="featured-destination__arrow" aria-hidden="true">↗</span>
      </button>

      <section class="route-deals" aria-labelledby="route-deals-title">
        <div class="section-heading"><div><h2 id="route-deals-title">{{ searchQuery ? 'More ideas for your trip' : 'Explore the network' }}</h2><p>{{ searchQuery ? 'These destinations also fit your request.' : 'Find direct routes around the world.' }}</p></div></div>
        <div v-if="displayedRouteHighlights.length" class="route-deals__rail">
          <button v-for="destination in displayedRouteHighlights" :key="destination.code" class="route-deal" type="button" @click="openDestination(destination.code)">
            <img class="route-deal__image" :src="destination.image" :alt="`${destination.city}, ${destination.country}`" @error="handleImageError($event, destination)" /><span class="route-deal__label">Direct route</span><strong>{{ destination.city }}</strong><small>{{ destination.country }}</small><span class="route-deal__price"><small>From</small><strong>$999</strong><small>/ person</small></span>
          </button>
        </div>
      </section>
    </section>

  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { getCountryMetadata, getSearchTerms, normalizeCountry } from './destinationMetadata'
import acapulcoImage from './Destinations/Acapulco.jpg'
import amsterdamImage from './Destinations/Amsterdam.jpg'
import bordeauxImage from './Destinations/Bordeaux.jpg'
import europeFallbackImage from './Destinations/EuropeFallback.svg'
import fallbackImage from './Destinations/fallbackImage.jpg'
import malagaImage from './Destinations/Malaga.jpg'
import samanaImage from './Destinations/Samana.jpg'

const emit = defineEmits(['start', 'plan-route'])
const backendUrl = 'https://flight-tracker-backend-98vm.onrender.com/api'
const searchQuery = ref('')
const availableDestinations = ref([])
const images = {
  BKK: 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?auto=format&fit=crop&w=500&q=80',
  CUN: 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=500&q=80',
  LIS: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=500&q=80',
  FDF: 'https://images.unsplash.com/photo-1589979481223-deb893043163?auto=format&fit=crop&w=500&q=80'
}
const countryImages = {
  Mexique: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=800&q=80',
  Portugal: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=800&q=80',
  Martinique: 'https://images.unsplash.com/photo-1589979481223-deb893043163?auto=format&fit=crop&w=800&q=80',
  Cuba: 'https://images.unsplash.com/photo-1500759285222-a95626b934cb?auto=format&fit=crop&w=800&q=80',
  Espagne: 'https://images.unsplash.com/photo-1509840841025-9088ba78a826?auto=format&fit=crop&w=800&q=80',
  France: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
  Grèce: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80',
  Italie: 'https://images.unsplash.com/photo-1529260830199-42c24126f198?auto=format&fit=crop&w=800&q=80',
  Maroc: 'https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?auto=format&fit=crop&w=800&q=80',
  Thaïlande: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=800&q=80'
}
const destinationImages = {
  acapulco: acapulcoImage,
  amsterdam: amsterdamImage,
  bordeaux: bordeauxImage,
  malaga: malagaImage,
  samana: samanaImage
}
const normalizeDestinationName = (value) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]/g, '')

const makeDestination = (airport) => {
  const city = airport.city.split(',')[0].trim()
  const isEuropeanDestination = getCountryMetadata(airport.country).region === 'europe'
  return {
    ...airport,
    city,
    image: images[airport.code] || destinationImages[normalizeDestinationName(city)] || countryImages[airport.country] || (isEuropeanDestination ? europeFallbackImage : fallbackImage),
    fallbackImage: isEuropeanDestination ? europeFallbackImage : fallbackImage
  }
}
const openDestination = (code) => emit('plan-route', code)
const handleImageError = (event, destination) => {
  const fallback = destination.fallbackImage || fallbackImage
  if (event.target.src === fallback) {
    event.target.onerror = null
    return
  }
  event.target.src = fallback
}

const contextualDestinations = computed(() => {
  if (!searchQuery.value) return availableDestinations.value
  const { intents, nights, region } = getSearchTerms(searchQuery.value)
  const normalizedQuery = normalizeCountry(searchQuery.value)
  return availableDestinations.value.filter((destination) => {
    if (!region) return true
    return getCountryMetadata(destination.country).region === region
  }).map((destination) => {
    const metadata = getCountryMetadata(destination.country)
    const countryMatch = normalizeCountry(destination.country).includes(normalizedQuery)
    const intentScore = intents.reduce((score, intent) => score + (metadata.tags.includes(intent) ? 5 : 0), 0)
    const durationScore = nights === null || (nights >= metadata.minNights && nights <= metadata.maxNights) ? 2 : -3
    return { destination, score: intentScore + durationScore + (countryMatch ? 10 : 0) }
  }).filter(({ score }) => score > 0).sort((first, second) => second.score - first.score).map(({ destination }) => destination)
})
const displayedQuickDestinations = computed(() => contextualDestinations.value.slice(0, 25))
const displayedFeaturedDestination = computed(() => contextualDestinations.value[Math.floor(Math.random() * contextualDestinations.value.length)] || { code: '', city: 'Explore the network', country: 'Air Transat', image: fallbackImage })
const displayedRouteHighlights = computed(() => contextualDestinations.value.slice(4, 10))

onMounted(async () => {
  try {
    const response = await fetch(`${backendUrl}/transat/airports`)
    const data = await response.json()
    availableDestinations.value = (data.airports || []).filter((airport) => airport.code !== 'YUL').map(makeDestination)
  } catch {
    availableDestinations.value = []
  }
})
</script>

<style scoped src="./LandingPage.css"></style>
