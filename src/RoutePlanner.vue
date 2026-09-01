<template>
  <main class="route-planner">
    <section class="route-planner__content" aria-labelledby="planner-title">
      <button class="back-button" type="button" @click="$emit('back')">Back</button>

      <div class="route-planner__heading">
        <img src="./tails/TS-tail.png" alt="Air Transat" class="airline-mark" />
        <p class="eyebrow">Air Transat</p>
        <h1 id="planner-title">Plan your route</h1>
        <p>Build an itinerary for Air Transat flights.</p>
      </div>

      <form class="route-form" @submit.prevent="startTracking">
        <label for="route-origin">Departure airport</label>
        <input id="route-origin" v-model.trim="origin" list="transat-origins" maxlength="3" placeholder="YUL" autocomplete="off" :disabled="isLoadingRoutes" @input="updateOrigin" />
        <datalist id="transat-origins">
          <optgroup v-for="group in originAirportGroups" :key="group.country" :label="group.country">
            <option v-for="airport in group.airports" :key="airport.code" :value="airport.code" :label="airport.label" />
          </optgroup>
        </datalist>

        <label for="route-destination">Arrival airport</label>
        <input id="route-destination" v-model.trim="destination" list="transat-destinations" maxlength="3" placeholder="CDG" autocomplete="off" :disabled="!origin || isLoadingRoutes" @input="destination = destination.toUpperCase()" />
        <datalist id="transat-destinations">
          <option value="ALL" label="All destinations" />
          <optgroup v-for="group in destinationAirportGroups" :key="group.country" :label="group.country">
            <option v-for="airport in group.airports" :key="airport.code" :value="airport.code" :label="airport.label" />
          </optgroup>
        </datalist>

        <label for="route-date">Travel date</label>
        <input id="route-date" v-model="travelDate" type="date" :min="today" />

        <p v-if="isLoadingRoutes" class="form-message form-message--neutral">Loading Air Transat routes...</p>
        <p v-else-if="routeLoadError || validationMessage" class="form-message" role="alert">{{ routeLoadError || validationMessage }}</p>
        <button class="route-submit" type="submit" :disabled="isLoadingRoutes || Boolean(routeLoadError)">View Air Transat flights</button>
      </form>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'

const emit = defineEmits(['back', 'track'])
const origin = ref('')
const destination = ref('')
const travelDate = ref(new Date().toISOString().slice(0, 10))
const validationMessage = ref('')
const routes = ref({})
const airports = ref([])
const isLoadingRoutes = ref(true)
const routeLoadError = ref('')
const today = new Date().toISOString().slice(0, 10)
const backendUrl = 'https://flight-tracker-backend-98vm.onrender.com/api'

const originAirports = computed(() => Object.keys(routes.value).sort())
const destinationAirports = computed(() => routes.value[origin.value] || [])
const airportByCode = computed(() => new Map(airports.value.map((airport) => [airport.code, airport])))

const groupAirportsByCountry = (airportCodes) => {
  const groups = new Map()
  airportCodes.forEach((code) => {
    const airport = airportByCode.value.get(code)
    if (!airport) return
    const group = groups.get(airport.country) || []
    group.push({ ...airport, label: `${airport.code} - ${airport.city} - ${airport.country}` })
    groups.set(airport.country, group)
  })
  return [...groups.entries()]
    .sort(([firstCountry], [secondCountry]) => firstCountry.localeCompare(secondCountry))
    .map(([country, groupedAirports]) => ({ country, airports: groupedAirports.sort((first, second) => first.label.localeCompare(second.label)) }))
}

const originAirportGroups = computed(() => groupAirportsByCountry(originAirports.value))
const destinationAirportGroups = computed(() => groupAirportsByCountry(destinationAirports.value))

const updateOrigin = () => {
  origin.value = origin.value.toUpperCase()
  if (destination.value !== 'ALL' && !destinationAirports.value.includes(destination.value)) destination.value = ''
}

onMounted(async () => {
  try {
    const [routesResponse, airportsResponse] = await Promise.all([
      fetch(`${backendUrl}/transat/routes`),
      fetch(`${backendUrl}/transat/airports`)
    ])
    const [routesData, airportsData] = await Promise.all([routesResponse.json(), airportsResponse.json()])
    if (!routesResponse.ok) throw new Error(routesData.error || 'Air Transat routes are unavailable.')
    if (!airportsResponse.ok) throw new Error(airportsData.error || 'Air Transat airports are unavailable.')
    routes.value = routesData.routes || {}
    airports.value = airportsData.airports || []
  } catch (error) {
    routeLoadError.value = error.message
  } finally {
    isLoadingRoutes.value = false
  }
})

const startTracking = () => {
  if (isLoadingRoutes || routeLoadError.value) return

  if (!/^[A-Z]{3}$/.test(origin.value) || (destination.value !== 'ALL' && !/^[A-Z]{3}$/.test(destination.value))) {
    validationMessage.value = 'Enter a three-letter departure airport and select an arrival airport or ALL.'
    return
  }

  if (destination.value !== 'ALL' && origin.value === destination.value) {
    validationMessage.value = 'Departure and arrival airports must be different.'
    return
  }

  if (destination.value !== 'ALL' && !destinationAirports.value.includes(destination.value)) {
    validationMessage.value = 'Choose a valid Air Transat round-trip route.'
    return
  }

  validationMessage.value = ''
  emit('track', { origin: origin.value, destination: destination.value, travelDate: travelDate.value })
}
</script>

<style scoped>
.route-planner {
  min-height: 100dvh;
  box-sizing: border-box;
  display: grid;
  place-items: center;
  padding: 2rem;
  color: #172033;
  background: #eef2ff;
  font-family: Georgia, 'Times New Roman', serif;
  overflow-y: auto;
}

.route-planner__content {
  width: min(100%, 520px);
}

.back-button {
  padding: 0;
  border: 0;
  background: transparent;
  color: #4f46e5;
  font: 700 0.9rem/1 system-ui, sans-serif;
  cursor: pointer;
}

.route-planner__heading {
  margin: 2.5rem 0 2rem;
}

.airline-mark {
  width: 72px;
  height: 72px;
  object-fit: contain;
}

.eyebrow {
  margin: 1.5rem 0 0.5rem;
  color: #4f46e5;
  font: 700 0.75rem/1.2 system-ui, sans-serif;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  font-size: 3rem;
  font-weight: 700;
  line-height: 1;
}

.route-planner__heading > p:last-child {
  margin: 0.8rem 0 0;
  color: #475569;
  font: 1rem/1.5 system-ui, sans-serif;
}

.route-form {
  display: grid;
  gap: 0.7rem;
  padding: 1.5rem;
  border: 1px solid #c7d2fe;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 14px 32px rgba(49, 46, 129, 0.12);
}

.route-form label {
  margin-top: 0.55rem;
  font: 700 0.8rem/1.2 system-ui, sans-serif;
}

.route-form input {
  min-height: 42px;
  box-sizing: border-box;
  border: 1px solid #94a3b8;
  border-radius: 5px;
  padding: 0.65rem 0.75rem;
  color: #172033;
  font: 600 1rem/1 system-ui, sans-serif;
}

.route-form input:focus {
  outline: 3px solid rgba(79, 70, 229, 0.25);
  border-color: #4f46e5;
}

.form-message {
  margin: 0.5rem 0 0;
  color: #b91c1c;
  font: 0.85rem/1.4 system-ui, sans-serif;
}

.form-message--neutral {
  color: #475569;
}

.route-submit {
  min-height: 44px;
  margin-top: 0.8rem;
  border: 0;
  border-radius: 5px;
  background: #4f46e5;
  color: #ffffff;
  font: 700 0.95rem/1 system-ui, sans-serif;
  cursor: pointer;
}

.route-submit:hover {
  background: #3730a3;
}

.route-submit:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

@media (max-width: 600px) {
  .route-planner {
    display: block;
    padding: 1.25rem;
  }

  .route-planner__heading {
    margin: 2rem 0 1.5rem;
  }

  h1 {
    font-size: 2.5rem;
  }
}
</style>
