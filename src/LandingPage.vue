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

    <section class="hero-panel" aria-label="Trip planner hero">
      <div class="hero-panel__backdrop" aria-hidden="true"></div>
      <div class="hero-panel__content">
        <div class="hero-panel__eyebrow">TRIP PLANNER</div>

        <h1>Where will<br />your next trip take you?</h1>
        <p>Tell us what kind of trip you're dreaming about and we'll find the best destinations and flight options for you.</p>

        <div class="hero-search" role="search">
          <div class="hero-search__input">
            <span class="hero-search__spark" aria-hidden="true">✦</span>
            <input
              v-model.trim="searchQuery"
              type="search"
              placeholder="1-week beach trip in Europe from Montréal in May for a family of 4"
              aria-label="Search destination ideas"
              @focus="scrollExploreIntoView"
              @keydown.enter="submitSearch"
              @blur="rememberSearch"
            />
            <button v-if="searchQuery" class="hero-search__clear" type="button" aria-label="Clear search" @click="searchQuery = ''">×</button>
          </div>
          <button class="hero-search__cta" type="button" @click="submitSearch">Find my trip <span aria-hidden="true">→</span></button>
        </div>

        <div class="travel-tags" aria-label="Suggested trip ideas">
          <button type="button" class="travel-tag" @click="searchQuery = 'Beach trip in winter'">
            <svg class="travel-tag__icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M2 14.5c2.1-1.9 4.2-1.9 6.3 0s4.2 1.9 6.3 0 4.2-1.9 6.3 0" />
              <path d="M4.5 7.5h.01M13.5 5.5h.01M16.5 8.5h.01" />
            </svg>
            <span>Beach trip in winter</span>
          </button>
          <button type="button" class="travel-tag" @click="searchQuery = 'Family vacation'">
            <svg class="travel-tag__icon" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="8" cy="8" r="2.5" />
              <circle cx="16" cy="8" r="2.5" />
              <path d="M3.5 18c.8-2.4 2.7-3.6 4.5-3.6S9.7 15.6 10.5 18M13.5 18c.8-2.4 2.7-3.6 4.5-3.6s3.7 1.2 4.5 3.6" />
            </svg>
            <span>Family vacation</span>
          </button>
          <button type="button" class="travel-tag" @click="searchQuery = 'Warm destination in March'">
            <svg class="travel-tag__icon" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v3M12 19v3M22 12h-3M5 12H2M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1M18.4 18.4l-2.1-2.1M7.7 7.7L5.6 5.6" />
            </svg>
            <span>Warm destination in March</span>
          </button>
          <button type="button" class="travel-tag" @click="searchQuery = 'City break in Europe'">
            <svg class="travel-tag__icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 19V7.5h4V5h7v2.5h5V19M7 19v-5h3v5M13 19v-8h3v8M16 19v-6h3v6" />
            </svg>
            <span>City break in Europe</span>
          </button>
          <button type="button" class="travel-tag" @click="searchQuery = 'Direct flights'">
            <svg class="travel-tag__icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M2.5 12h7.5L13 7h2l1.5 5L22 12l-5.5 0L15 17h-2l-3 5H2.5l4-5h3l-1.5-5H6.5l-4 5z" />
            </svg>
            <span>Direct flights</span>
          </button>
          <button type="button" class="travel-tag" @click="searchQuery = 'Nature and adventure'">
            <svg class="travel-tag__icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 18L9.5 7l4 6 7-11v16H3z" />
            </svg>
            <span>Nature and adventure</span>
          </button>
        </div>
      </div>
    </section>

    <section class="travel-home__content" aria-label="Destinations">
      <section class="quick-destinations" aria-labelledby="quick-destinations-title">
        <div class="section-heading">
          <h2 id="quick-destinations-title">Explore by travel interest</h2>
        </div>

        <div v-if="displayedQuickDestinations.length" class="quick-destinations__rail">
          <button v-for="destination in displayedQuickDestinations.slice(0, 5)" :key="destination.code" class="quick-destination" type="button" @click="openDestination(destination.code, destination.image)">
            <img class="quick-destination__image" :src="destination.image" :alt="`${destination.city}, ${destination.country}`" @error="handleImageError($event, destination)" />
            <span class="quick-destination__meta">
              <span class="quick-destination__label">{{ destination.city }}</span>
              <span class="quick-destination__arrow" aria-hidden="true">›</span>
            </span>
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

const emit = defineEmits(['start', 'plan-route', 'show-destinations'])
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

const submitSearch = () => {
  const query = searchQuery.value.trim()
  if (query.length < 3) return
  rememberSearch()
  emit('plan-route', { code: '', image: '', query })
}

const clearSearchHistory = () => {
  searchHistory.value = []
  persistSearchHistory()
}

const scrollExploreIntoView = () => {
  const section = document.getElementById('quick-destinations-title')
  if (!section) return

  const headerHeight = document.querySelector('.travel-home__header')?.getBoundingClientRect().height || 0
  const top = section.getBoundingClientRect().top + window.scrollY - headerHeight - 12
  window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' })
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
