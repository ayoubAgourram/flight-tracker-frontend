<template>
  <main class="destinations-page">
    <header class="destinations-header">
      <button type="button" class="destinations-header__back" @click="$emit('back')">← Back</button>
      <div>
        <h1>Destinations</h1>
        <p>Browse Air Transat destinations across Canada, the Caribbean, Central America, Europe, Mexico, South America, Africa and the United States.</p>
      </div>
    </header>

    <section class="route-deals" aria-labelledby="destinations-popular-title">
      <div class="section-heading section-heading--popular">
        <h2 id="destinations-popular-title">Popular right now</h2>
        <button type="button" class="popular-link" @click="openDestination('', '')">See more destinations <span aria-hidden="true">→</span></button>
      </div>

      <div v-if="displayedRouteHighlights.length" class="route-deals__rail">
        <button v-for="destination in displayedRouteHighlights" :key="destination.code" class="route-deal" type="button" @click="openDestination(destination.code, destination.image)">
          <img class="route-deal__image" :src="destination.image" :alt="`${destination.city}, ${destination.country}`" @error="handleImageError($event, destination)" />
          <div class="route-deal__content">
            <strong>{{ destination.city }}</strong>
            <small>{{ destination.context.airTransatRegion || destination.country }}</small>
            <small class="route-deal__description">{{ destination.context.description }}</small>
          </div>
        </button>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { createDestinationSearchIndex, getCountryMetadata, searchDestinations } from './destinationMetadata'
import acapulcoImage from './Destinations/Acapulco.jpg'
import amsterdamImage from './Destinations/Amsterdam.jpg'
import bordeauxImage from './Destinations/Bordeaux.jpg'
import fallbackImage from './Destinations/default-image.jpg'
import malagaImage from './Destinations/Malaga.jpg'
import samanaImage from './Destinations/Samana.jpg'

const emit = defineEmits(['back', 'plan-route'])
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
  Martinique: 'https://images.unsplash.com/photo-1589979481223-deb893043163?auto=format&fit=crop&w=500&q=80',
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
    context: getCountryMetadata(airport.country),
    image: images[airport.code] || destinationImages[normalizeDestinationName(city)] || countryImages[airport.country] || fallbackImage
  }
}

const destinationSearchIndex = computed(() => createDestinationSearchIndex(availableDestinations.value))
const contextualDestinations = computed(() => searchDestinations(destinationSearchIndex.value, searchQuery.value).map(({ destination }) => destination))
const displayedRouteHighlights = computed(() => contextualDestinations.value.slice(0, 6))

const openDestination = (code, image) => {
  emit('plan-route', { code, image, query: searchQuery.value.trim() })
}

const handleImageError = (event) => {
  if (event.target.src === fallbackImage) {
    event.target.onerror = null
    return
  }
  event.target.src = fallbackImage
}

onMounted(async () => {
  try {
    const [airportsResponse, routesResponse] = await Promise.all([
      fetch(`${backendUrl}/transat/airports`),
      fetch(`${backendUrl}/transat/routes`)
    ])
    const [airportsData, routesData] = await Promise.all([airportsResponse.json(), routesResponse.json()])
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

<style scoped>
.destinations-page {
  min-height: 100vh;
  background: #f4f7fa;
  padding: 1.5rem 1.25rem 3.5rem;
}

.destinations-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  max-width: 1440px;
  margin: 0 auto 1.5rem;
}

.destinations-header h1 {
  margin: 0;
  color: rgb(0, 40, 85);
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 900;
  letter-spacing: -0.06em;
}

.destinations-header p {
  margin: 0.35rem 0 0;
  color: #49657d;
  font: 500 0.95rem/1.5 system-ui, sans-serif;
}

.destinations-header__back {
  border: 1px solid rgba(0, 40, 85, 0.12);
  border-radius: 999px;
  background: #fff;
  color: rgb(0, 40, 85);
  padding: 0.65rem 1rem;
  font: 700 0.9rem/1 system-ui, sans-serif;
  cursor: pointer;
}

.route-deals {
  max-width: 1440px;
  margin: 0 auto;
}
</style>
