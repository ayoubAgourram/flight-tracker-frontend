import { computed, onMounted, ref, watch } from 'vue'

export default {
  emits: ['back', 'track'],
  setup(_, { emit }) {
    const DEFAULT_ORIGIN = 'YUL'
    const ALL_DESTINATIONS = 'ALL'
    const backendUrl = 'https://flight-tracker-backend-98vm.onrender.com/api'

    const origin = ref(DEFAULT_ORIGIN)
    const destination = ref('')
    const travelDate = ref('')
    const validationMessage = ref('')
    const routes = ref({})
    const airports = ref([])
    const isLoadingRoutes = ref(true)
    const routeLoadError = ref('')
    const today = new Date().toISOString().slice(0, 10)
    const isDestinationMenuOpen = ref(false)
    const selectedDestinationCodes = ref(null)
    const availableTravelDates = ref([])
    const isCalendarLoading = ref(false)

const airportByCode = computed(() => new Map(airports.value.map((airport) => [airport.code, airport])))
const originAirport = computed(() => airportByCode.value.get(DEFAULT_ORIGIN))
const originLabel = computed(() => formatAirportLabel(originAirport.value) || DEFAULT_ORIGIN)
const destinationAirports = computed(() => (routes.value[DEFAULT_ORIGIN] || [])
  .filter((code) => airportByCode.value.has(code)))
const formMessage = computed(() => routeLoadError.value || validationMessage.value)
const isSubmitDisabled = computed(() => isLoadingRoutes.value || Boolean(routeLoadError.value))
const calendarArrivalCodes = computed(() => {
  if (destination.value === ALL_DESTINATIONS) return destinationAirports.value
  if (selectedDestinationCodes.value) return selectedDestinationCodes.value
  return destinationAirports.value.includes(destination.value) ? [destination.value] : []
})

const formatAirportLabel = (airport) => {
  if (!airport) return ''
  return `${airport.code} - ${airport.city} - ${airport.country}`
}

const groupAirportsByCountry = (airportCodes) => {
  const groups = new Map()
  airportCodes.forEach((code) => {
    const airport = airportByCode.value.get(code)
    if (!airport) return

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
const visibleDestinationAirportGroups = computed(() => {
  const query = destination.value.trim().toLowerCase()
  if (!query || query === ALL_DESTINATIONS.toLowerCase()) return destinationAirportGroups.value

  return destinationAirportGroups.value
    .map((group) => ({
      ...group,
      airports: group.airports.filter((airport) => airport.label.toLowerCase().includes(query))
    }))
    .filter((group) => group.country.toLowerCase().includes(query) || group.airports.length > 0)
})

const handleDestinationInput = () => {
  destination.value = destination.value.toUpperCase()
  selectedDestinationCodes.value = null
  validationMessage.value = ''
}

const openDestinationMenu = () => {
  isDestinationMenuOpen.value = true
}

const closeDestinationMenu = () => {
  isDestinationMenuOpen.value = false
}

const selectDestination = (airportCode) => {
  destination.value = airportCode
  selectedDestinationCodes.value = [airportCode]
  validationMessage.value = ''
  closeDestinationMenu()
}

const selectCountry = (group) => {
  destination.value = `${group.country} - All destinations`
  selectedDestinationCodes.value = group.airports.map((airport) => airport.code)
  validationMessage.value = ''
  closeDestinationMenu()
}

const formatTravelDate = (date) => new Intl.DateTimeFormat('en-CA', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric'
}).format(new Date(`${date}T00:00:00`))

const loadCalendar = async (arrivalCodes) => {
  availableTravelDates.value = []
  travelDate.value = ''
  if (arrivalCodes.length === 0) return

  isCalendarLoading.value = true
  try {
    const searchParams = new URLSearchParams({ departureCodes: DEFAULT_ORIGIN, arrivalCodes: arrivalCodes.join(',') })
    const response = await fetch(`${backendUrl}/transat/calendar?${searchParams}`)
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Air Transat travel dates are unavailable.')
    availableTravelDates.value = data.dates || []
    travelDate.value = availableTravelDates.value.find((date) => date >= today) || ''
  } catch (error) {
    validationMessage.value = error.message
  } finally {
    isCalendarLoading.value = false
  }
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

watch(calendarArrivalCodes, (arrivalCodes) => {
  loadCalendar(arrivalCodes)
})

  const startTracking = () => {
  if (isSubmitDisabled.value || isCalendarLoading.value) return

  if (destination.value !== ALL_DESTINATIONS && !selectedDestinationCodes.value && !/^[A-Z]{3}$/.test(destination.value)) {
    validationMessage.value = 'Select an arrival airport or ALL.'
    return
  }

  if (destination.value !== ALL_DESTINATIONS && !selectedDestinationCodes.value && origin.value === destination.value) {
    validationMessage.value = 'Departure and arrival airports must be different.'
    return
  }

  if (destination.value !== ALL_DESTINATIONS && !selectedDestinationCodes.value && !destinationAirports.value.includes(destination.value)) {
    validationMessage.value = 'Choose a valid Air Transat round-trip route.'
    return
  }

  if (!availableTravelDates.value.includes(travelDate.value)) {
    validationMessage.value = 'Select an available regular travel date.'
    return
  }

  validationMessage.value = ''
      emit('track', {
        origin: origin.value,
        destination: destination.value,
        destinationCodes: selectedDestinationCodes.value,
        travelDate: travelDate.value
      })
    }

    return {
      destination,
      destinationAirportGroups,
      availableTravelDates,
      formMessage,
      formatTravelDate,
      handleDestinationInput,
      isDestinationMenuOpen,
      isCalendarLoading,
      isLoadingRoutes,
      isSubmitDisabled,
      openDestinationMenu,
      originLabel,
      closeDestinationMenu,
      selectDestination,
      selectCountry,
      startTracking,
      today,
      travelDate,
      visibleDestinationAirportGroups
    }
  }
}
