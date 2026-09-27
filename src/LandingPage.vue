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
import iledeSanAndresImage from './Destinations/IleSanAndres.jpg'
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
  ilesandres: iledeSanAndresImage,
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
  const destinationQuery = encodeURIComponent(`${city} ${airport.country} travel`)
  return {
    ...airport,
    city,
    image: images[airport.code] || destinationImages[normalizeDestinationName(city)] || countryImages[airport.country] || `https://loremflickr.com/900/700/${destinationQuery}`
  }
}
const openDestination = (code) => emit('plan-route', code)
const handleImageError = (event, destination) => {
  const fallback = countryImages[destination.country] || 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80'
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
const displayedQuickDestinations = computed(() => contextualDestinations.value.slice(0, 4))
const displayedFeaturedDestination = computed(() => contextualDestinations.value[0] || { code: '', city: 'Explore the network', country: 'Air Transat', image: 'https://loremflickr.com/900/700/travel,destination' })
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

<style scoped>
:global(*) { box-sizing: border-box; }

.travel-home {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 100svh;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 0.9rem 0.85rem calc(5.8rem + env(safe-area-inset-bottom));
  overscroll-behavior-y: contain;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
  color: #f8fafc;
  background: #132934;
  font-family: Georgia, 'Times New Roman', serif;
}

.travel-home__header,
.travel-home__content {
  width: 100%;
  min-width: 0;
  max-width: 720px;
  margin: 0 auto;
}

.travel-home__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.65rem 0.15rem 1.6rem;
}

.brand-mark { display: grid; gap: 0.18rem; }
.brand-mark__word { font-size: clamp(1rem, 5vw, 1.35rem); letter-spacing: 0.12em; }
.brand-mark__tagline { color: #b8c3c8; font: 700 0.48rem/1 system-ui, sans-serif; letter-spacing: 0.22em; }
.travel-home__header-actions { display: flex; align-items: center; gap: 0.35rem; }
.tracker-link { border: 1px solid #d9b16a; border-radius: 999px; padding: 0.42rem 0.55rem; background: transparent; color: #f5d18d; font: 700 0.62rem/1 system-ui, sans-serif; white-space: nowrap; cursor: pointer; }
.icon-button { border: 0; padding: 0.1rem; background: transparent; color: #fff; font: 1.55rem/1 Georgia, serif; cursor: pointer; }

.travel-home__content { display: grid; min-width: 0; gap: 1.45rem; }
.travel-home__content > * { min-width: 0; }
.travel-search { display: flex; align-items: center; gap: 0.7rem; min-height: 58px; border-radius: 16px; padding: 0 0.95rem; background: #fbfbfc; }
.travel-search input { width: 100%; min-width: 0; flex: 1; border: 0; outline: 0; background: transparent; color: #172033; font: 700 1rem/1.2 system-ui, sans-serif; }
.travel-search input::placeholder { color: #9aa4b4; }
.travel-search__icon { color: #b38a45; font: 2.25rem/0.5 Georgia, serif; }
.travel-search__clear { border: 0; background: transparent; color: #64748b; font-size: 1.35rem; cursor: pointer; }

.section-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.75rem; }
.section-heading h1, .section-heading h2 { margin: 0; color: #f8fafc; font: 700 1.18rem/1.15 Georgia, serif; }
.section-heading p { margin: 0.3rem 0 0; color: #d0d9dd; font: 0.82rem/1.3 system-ui, sans-serif; }
.section-heading button { flex: 0 0 auto; border: 0; padding: 0.25rem 0; background: transparent; color: #d9b16a; font: 700 0.72rem/1 system-ui, sans-serif; cursor: pointer; }

.quick-destinations__rail, .route-deals__rail { display: flex; gap: 0.8rem; overflow-x: auto; padding: 0.15rem 0 0.35rem; scrollbar-width: none; overscroll-behavior-x: contain; touch-action: pan-x; }
.quick-destinations__rail::-webkit-scrollbar, .route-deals__rail::-webkit-scrollbar { display: none; }
.quick-destination { display: grid; flex: 0 0 68px; justify-items: center; gap: 0.3rem; border: 0; padding: 0; background: transparent; color: #fff; cursor: pointer; }
.quick-destination__image { width: 68px; aspect-ratio: 1; border-radius: 50%; object-fit: cover; box-shadow: 0 5px 14px #0000003d; }
.quick-destination strong { max-width: 100%; overflow: hidden; font: 500 0.72rem/1.1 system-ui, sans-serif; text-overflow: ellipsis; white-space: nowrap; }
.quick-destination small { color: #aebbc1; font: 0.62rem/1 system-ui, sans-serif; }
.empty-search { margin: 0; color: #b8c3c8; font: 0.85rem/1.4 system-ui, sans-serif; }

.featured-destination { position: relative; display: grid; width: 100%; min-height: 245px; overflow: hidden; border: 0; border-radius: 18px; padding: 0; color: #fff; text-align: left; background: #29414c; cursor: pointer; }
.featured-destination__image { position: absolute; inset: 0 0 36%; width: 100%; height: 64%; object-fit: cover; }
.featured-destination__copy { position: absolute; right: 0; bottom: 0; left: 0; display: grid; gap: 0.3rem; padding: 0.9rem 1rem 1rem; background: #29414c; }
.featured-destination__copy small { color: #d9b16a; font: 700 0.62rem/1 system-ui, sans-serif; letter-spacing: 0.07em; text-transform: uppercase; }
.featured-destination__copy strong { font: 700 1.35rem/1.05 Georgia, serif; }
.featured-destination__copy span { color: #d7e0e3; font: 0.78rem/1.3 system-ui, sans-serif; }
.featured-destination__arrow { position: absolute; top: 0.7rem; right: 0.75rem; display: grid; width: 32px; height: 32px; place-items: center; border-radius: 50%; background: #132934b8; font-size: 1.1rem; }

.route-deal { position: relative; display: grid; flex: 0 0 170px; min-height: 170px; align-content: end; overflow: hidden; border: 0; border-radius: 16px; padding: 0.8rem; color: #fff; text-align: left; background: #2f6670; cursor: pointer; box-shadow: 0 10px 22px #061c2440; }
.route-deal::after { position: absolute; inset: 0; z-index: 0; background: linear-gradient(180deg, #06242b0d 18%, #06242bb8 100%); content: ''; }
.route-deal__image { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: brightness(1.08) saturate(1.18) contrast(1.02); }
.route-deal strong, .route-deal small, .route-deal__label, .route-deal__price { position: relative; z-index: 1; }
.route-deal strong { font: 700 1rem/1.05 Georgia, serif; }
.route-deal small { font: 0.7rem/1.2 system-ui, sans-serif; }
.route-deal__label { justify-self: start; margin-bottom: 1.25rem; padding: 0.28rem 0.4rem; border-radius: 4px; background: #fffde6e6; color: #16444b; font: 700 0.6rem/1 system-ui, sans-serif; }
.route-deal__price { display: flex; align-items: baseline; gap: 0.28rem; margin-top: 0.55rem; }
.route-deal__price small { color: #f6fbf3; font-size: 0.62rem; }
.route-deal__price strong { color: #ffe08a; font: 700 1.25rem/1 Georgia, serif; }

@media (max-width: 699px) {
  .travel-home__header,
  .travel-home__content {
    max-width: none;
  }

  .section-heading h1,
  .section-heading h2 {
    min-width: 0;
    overflow-wrap: anywhere;
  }
}

@media (min-width: 700px) {
  .travel-home { padding: 1.5rem 2rem calc(6rem + env(safe-area-inset-bottom)); }
  .travel-home__header { padding-bottom: 2.5rem; }
  .travel-search { min-height: 72px; }
  .travel-search input { font-size: 1.15rem; }
  .quick-destinations__rail { justify-content: space-between; }
  .route-deals__rail { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); overflow: visible; }
  .route-deal { min-width: 0; }
}
</style>
