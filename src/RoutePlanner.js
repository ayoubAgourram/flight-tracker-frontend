import { computed, onMounted, ref } from 'vue'

export default {
  emits: ['back', 'track'],
  setup(_, { emit }) {
    const DEFAULT_ORIGIN = 'YUL'
    const ALL_DESTINATIONS = 'ALL'
    const backendUrl = 'https://flight-tracker-backend-98vm.onrender.com/api'

    const origin = ref(DEFAULT_ORIGIN)
    const destination = ref('')
    const travelDate = ref(new Date().toISOString().slice(0, 10))
    const validationMessage = ref('')
    const routes = ref({})
    const airports = ref([])
    const isLoadingRoutes = ref(true)
    const routeLoadError = ref('')
    const today = new Date().toISOString().slice(0, 10)

const airportByCode = computed(() => new Map(airports.value.map((airport) => [airport.code, airport])))
const originAirport = computed(() => airportByCode.value.get(DEFAULT_ORIGIN))
const originLabel = computed(() => formatAirportLabel(originAirport.value) || DEFAULT_ORIGIN)
const destinationAirports = computed(() => (routes.value[DEFAULT_ORIGIN] || [])
  .filter((code) => airportByCode.value.get(code)?.webCheckInEligible))
const formMessage = computed(() => routeLoadError.value || validationMessage.value)
const isSubmitDisabled = computed(() => isLoadingRoutes.value || Boolean(routeLoadError.value))

const formatAirportLabel = (airport) => {
  if (!airport) return ''
  return `${airport.code} - ${airport.city} - ${airport.country}`
}

const groupAirportsByCountry = (airportCodes) => {
  const groups = new Map()
  airportCodes.forEach((code) => {
    const airport = airportByCode.value.get(code)
    if (!airport?.webCheckInEligible) return

    const group = groups.get(airport.country) || []
    group.push({ ...airport, label: formatAirportLabel(airport) })
    groups.set(airport.country, group)
  })

  return [...groups.entries()]
    .sort(([firstCountry], [secondCountry]) => firstCountry.localeCompare(secondCountry))
    .map(([country, groupedAirports]) => ({
      country,
      airports: groupedAirports.sort((first, second) => first.label.localeCompare(second.label))
    }))
}

const destinationAirportGroups = computed(() => groupAirportsByCountry(destinationAirports.value))

const handleDestinationInput = () => {
  destination.value = destination.value.toUpperCase()
  validationMessage.value = ''
}

const loadRouteData = async () => {
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
}

onMounted(loadRouteData)

  const startTracking = () => {
  if (isSubmitDisabled.value) return

  if (destination.value !== ALL_DESTINATIONS && !/^[A-Z]{3}$/.test(destination.value)) {
    validationMessage.value = 'Select an arrival airport or ALL.'
    return
  }

  if (destination.value !== ALL_DESTINATIONS && origin.value === destination.value) {
    validationMessage.value = 'Departure and arrival airports must be different.'
    return
  }

  if (destination.value !== ALL_DESTINATIONS && !destinationAirports.value.includes(destination.value)) {
    validationMessage.value = 'Choose a valid Air Transat round-trip route.'
    return
  }

  validationMessage.value = ''
      emit('track', { origin: origin.value, destination: destination.value, travelDate: travelDate.value })
    }

    return {
      destination,
      destinationAirportGroups,
      formMessage,
      handleDestinationInput,
      isLoadingRoutes,
      isSubmitDisabled,
      originLabel,
      startTracking,
      today,
      travelDate
    }
  }
}
