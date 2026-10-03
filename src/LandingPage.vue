<template>
  <main class="travel-home" @touchstart.passive="startPull" @touchmove.passive="movePull" @touchend="endPull" @touchcancel="endPull">
    <div
      v-show="pullDistance > 0 || isRefreshing"
      class="home-refresh"
      :class="{ 'is-ready': pullDistance >= PULL_THRESHOLD || isRefreshing }"
      :style="{ transform: `translate(-50%, ${pullDistance - 40}px)` }"
      role="status"
    >
      {{ isRefreshing ? 'Refreshing...' : pullDistance >= PULL_THRESHOLD ? 'Release to refresh' : 'Pull to refresh' }}
    </div>
    <header class="travel-home__header">
      <div class="brand-mark"><span class="brand-mark__word">Air Transat</span><span class="brand-mark__tagline">VACY PLANNER</span></div>
      <div class="travel-home__header-actions">
        <!--button class="tracker-link" type="button" @click="$emit('start')">Flight tracker</button-->
        <!--button class="icon-button" type="button" aria-label="Notifications">♧</button-->
      </div>
    </header>

    <section class="travel-home__content">
      <div class="travel-search">
        <span class="travel-search__icon" aria-hidden="true">⌕</span>
        <input v-model.trim="searchQuery" type="search" placeholder="Where do you want to go?" aria-label="Search destinations by travel idea" @keydown.enter="rememberSearch" @blur="rememberSearch" />
        <button v-if="searchQuery" class="travel-search__clear" type="button" aria-label="Clear search" @click="searchQuery = ''">×</button>
      </div>

      <section v-if="!searchQuery" class="search-history" aria-label="Search ideas">
        <template v-if="searchHistory.length">
          <div class="search-history__heading">
            <span>Recent searches</span>
            <button type="button" @click="clearSearchHistory">Clear</button>
          </div>
          <div class="search-history__chips">
            <button v-for="item in searchHistory" :key="item" type="button" class="search-history__chip" @click="searchQuery = item">{{ item }}</button>
          </div>
        </template>
        <template v-if="suggestedSearches.length">
          <div class="search-history__heading">
            <span>Try searching for</span>
          </div>
          <div class="search-history__chips">
            <button v-for="item in suggestedSearches" :key="item" type="button" class="search-history__chip" @click="searchQuery = item">{{ item }}</button>
          </div>
        </template>
      </section>

      <section class="quick-destinations" aria-labelledby="quick-destinations-title">
        <div class="section-heading">
          <h1 id="quick-destinations-title">{{ searchQuery ? 'Destinations for your trip' : 'Popular from Montreal' }}</h1>
          <button type="button" @click="openDestination('', '')">See all</button>
        </div>
        <div v-if="displayedQuickDestinations.length" class="quick-destinations__rail">
          <button v-for="destination in displayedQuickDestinations" :key="destination.code" class="quick-destination" type="button" @click="openDestination(destination.code, destination.image)">
            <img class="quick-destination__image" :src="destination.image" :alt="`${destination.city}, ${destination.country}`" @error="handleImageError($event, destination)" />
            <strong>{{ destination.city }}</strong><small>{{ destination.code }}</small>
          </button>
        </div>
        <p v-else class="empty-search">No available route matches that travel idea yet.</p>
      </section>

      <button class="featured-destination" type="button" @click="openDestination(displayedFeaturedDestination.code, displayedFeaturedDestination.image)">
        <img class="featured-destination__image" :src="displayedFeaturedDestination.image" :alt="`${displayedFeaturedDestination.city}, ${displayedFeaturedDestination.country}`" @error="handleImageError($event, displayedFeaturedDestination)" />
        <span class="featured-destination__copy"><small>{{ searchQuery ? 'Matched to your search' : 'Air Transat route inspiration' }}</small><strong>{{ displayedFeaturedDestination.city }}</strong><span>{{ displayedFeaturedDestination.country }} · Direct route from Montreal</span></span>
        <span class="featured-destination__arrow" aria-hidden="true">↗</span>
      </button>

      <section class="route-deals" aria-labelledby="route-deals-title">
        <div class="section-heading"><div><h2 id="route-deals-title">{{ searchQuery ? 'More ideas for your trip' : 'Explore the network' }}</h2><p>{{ searchQuery ? 'These destinations also fit your request.' : 'Find direct routes around the world.' }}</p></div></div>
        <div v-if="displayedRouteHighlights.length" class="route-deals__rail">
          <button v-for="destination in displayedRouteHighlights" :key="destination.code" class="route-deal" type="button" @click="openDestination(destination.code, destination.image)">
            <img class="route-deal__image" :src="destination.image" :alt="`${destination.city}, ${destination.country}`" @error="handleImageError($event, destination)" /><span class="route-deal__label">Direct route</span><strong>{{ destination.city }}</strong><small>{{ destination.country }}</small><span class="route-deal__price"><small>From</small><strong>$999</strong><small>/ person</small></span>
          </button>
        </div>
      </section>
    </section>

  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { createDestinationSearchIndex, searchDestinations } from './destinationMetadata'
import acapulcoImage from './Destinations/Acapulco.jpg'
import amsterdamImage from './Destinations/Amsterdam.jpg'
import bordeauxImage from './Destinations/Bordeaux.jpg'
import fallbackImage from './Destinations/default-image.jpg'
import malagaImage from './Destinations/Malaga.jpg'
import samanaImage from './Destinations/Samana.jpg'

const emit = defineEmits(['start', 'plan-route'])
const backendUrl = 'https://flight-tracker-backend-98vm.onrender.com/api'
const searchQuery = ref('')

const PULL_THRESHOLD = 60
const PULL_MAX = 90
const pullDistance = ref(0)
const isRefreshing = ref(false)
let pullStartY = null

const startPull = (event) => {
  if (event.currentTarget.scrollTop > 0 || event.touches.length !== 1) return
  pullStartY = event.touches[0].clientY
}

const movePull = (event) => {
  if (pullStartY === null) return
  const distance = event.touches[0].clientY - pullStartY
  // Damped so the indicator trails the finger; abandon if the page scrolled or the finger moved up.
  pullDistance.value = distance > 0 && event.currentTarget.scrollTop === 0 ? Math.min(distance * 0.5, PULL_MAX) : 0
}

const endPull = () => {
  if (pullStartY === null) return
  pullStartY = null
  if (pullDistance.value >= PULL_THRESHOLD) {
    isRefreshing.value = true
    window.location.reload()
    return
  }
  pullDistance.value = 0
}
const HISTORY_KEY = 'landing-search-history'
const HISTORY_LIMIT = 6
const starterSearches = ['Beach for 4 days in Europe', 'Warm getaway in the Caribbean', 'Food and culture in Italy', 'Long weekend city break']

const loadSearchHistory = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
    return Array.isArray(saved) ? saved.filter((item) => typeof item === 'string').slice(0, HISTORY_LIMIT) : []
  } catch {
    return []
  }
}

const searchHistory = ref(loadSearchHistory())
const suggestedSearches = computed(() => {
  const seen = new Set(searchHistory.value.map((item) => item.toLowerCase()))
  return starterSearches.filter((item) => !seen.has(item.toLowerCase()))
})

const persistSearchHistory = () => {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(searchHistory.value))
  } catch {
    // Storage can be unavailable (private mode); history just stays in memory.
  }
}

const rememberSearch = () => {
  const query = searchQuery.value.trim()
  if (query.length < 3) return
  const key = query.toLowerCase()
  searchHistory.value = [query, ...searchHistory.value.filter((item) => item.toLowerCase() !== key)].slice(0, HISTORY_LIMIT)
  persistSearchHistory()
}

const clearSearchHistory = () => {
  searchHistory.value = []
  persistSearchHistory()
}
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
  return {
    ...airport,
    city,
    image: images[airport.code] || destinationImages[normalizeDestinationName(city)] || countryImages[airport.country] || fallbackImage
  }
}
const openDestination = (code, image) => {
  rememberSearch()
  emit('plan-route', { code, image, query: searchQuery.value.trim() })
}
const handleImageError = (event) => {
  if (event.target.src === fallbackImage) {
    event.target.onerror = null
    return
  }
  event.target.src = fallbackImage
}

const displayedQuickDestinations = computed(() => contextualDestinations.value.slice(0, 25))
const displayedFeaturedDestination = computed(() => contextualDestinations.value[Math.floor(Math.random() * contextualDestinations.value.length)] || { code: '', city: 'Explore the network', country: 'Air Transat', image: fallbackImage })
const displayedRouteHighlights = computed(() => contextualDestinations.value.slice(4, 10))
const destinationSearchIndex = computed(() => createDestinationSearchIndex(availableDestinations.value))
const contextualDestinations = computed(() => searchDestinations(destinationSearchIndex.value, searchQuery.value).map(({ destination }) => destination))

onMounted(async () => {
  try {
    const [airportsResponse, routesResponse] = await Promise.all([
      fetch(`${backendUrl}/transat/airports`),
      fetch(`${backendUrl}/transat/routes`)
    ])
    const [airportsData, routesData] = await Promise.all([airportsResponse.json(), routesResponse.json()])
    // The planner departs from YUL only, so cards must be limited to its served routes.
    const servedCodes = new Set(routesData.routes?.YUL || [])
    availableDestinations.value = (airportsData.airports || [])
      .filter((airport) => airport.code !== 'YUL' && servedCodes.has(airport.code))
      .map(makeDestination)
  } catch {
    availableDestinations.value = []
  }
})
</script>

<style scoped src="./LandingPage.css"></style>
