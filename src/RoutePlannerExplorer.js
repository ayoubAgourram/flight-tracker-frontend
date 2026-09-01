import { computed, onMounted, ref, watch } from 'vue'

const DEFAULT_ORIGIN = 'YUL'
const ALL_DESTINATIONS = 'ALL'
const MINIMUM_STAY_NIGHTS = 2
const backendUrl = 'https://flight-tracker-backend-98vm.onrender.com/api'

const toUtcDate = (date) => new Date(`${date}T00:00:00Z`)

const formatAirportLabel = (airport) => {
  if (!airport) return ''
  return `${airport.code} - ${airport.city} - ${airport.country}`
}

const formatDate = (date) => new Intl.DateTimeFormat('en-CA', {
  weekday: 'short',
  month: 'short',
  day: 'numeric'
}).format(toUtcDate(date))

const formatMonth = (date) => new Intl.DateTimeFormat('en-CA', {
  month: 'long',
  year: 'numeric'
}).format(toUtcDate(date))

const getNights = (departureDate, returnDate) => Math.round((toUtcDate(returnDate) - toUtcDate(departureDate)) / 86400000)

const getMontrealTimeParts = () => Object.fromEntries(
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Toronto',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(new Date())
    .filter((part) => part.type !== 'literal')
    .map((part) => [part.type, part.value])
)

const getEarliestDepartureDate = () => {
  const montrealTime = getMontrealTimeParts()
  const earliestDate = new Date(Date.UTC(
    Number(montrealTime.year),
    Number(montrealTime.month) - 1,
    Number(montrealTime.day)
  ))

  if (Number(montrealTime.hour) >= 18) earliestDate.setUTCDate(earliestDate.getUTCDate() + 1)
  return earliestDate.toISOString().slice(0, 10)
}

export default {
  emits: ['back', 'track'],
  setup(_, { emit }) {
    const origin = ref(DEFAULT_ORIGIN)
    const destination = ref('')
    const selectedDestinationCodes = ref(null)
    const routes = ref({})
    const airports = ref([])
    const isLoadingRoutes = ref(true)
    const routeLoadError = ref('')
    const isDestinationMenuOpen = ref(false)
    const availableDepartureDates = ref([])
    const availableReturnDates = ref([])
    const isDepartureLoading = ref(false)
    const isReturnLoading = ref(false)
    const departureDate = ref('')
    const returnDate = ref('')
    const earliestDepartureDate = ref(getEarliestDepartureDate())
    const durationFilter = ref('escape')
    const validationMessage = ref('')

    const airportByCode = computed(() => new Map(airports.value.map((airport) => [airport.code, airport])))
    const originLabel = computed(() => formatAirportLabel(airportByCode.value.get(DEFAULT_ORIGIN)) || DEFAULT_ORIGIN)
    const destinationAirportCodes = computed(() => (routes.value[DEFAULT_ORIGIN] || [])
      .filter((code) => airportByCode.value.has(code)))
    const selectedArrivalCodes = computed(() => {
      const typedValue = destination.value.trim().toUpperCase()
      if (typedValue === ALL_DESTINATIONS) return destinationAirportCodes.value
      if (selectedDestinationCodes.value) return selectedDestinationCodes.value
      return destinationAirportCodes.value.includes(typedValue) ? [typedValue] : []
    })
    const hasDestinationSelection = computed(() => selectedArrivalCodes.value.length > 0)
    const formMessage = computed(() => routeLoadError.value || validationMessage.value)
    const isSubmitDisabled = computed(() => isLoadingRoutes.value || isDepartureLoading.value || isReturnLoading.value)
    const selectedRoutes = computed(() => {
      const originAirport = airportByCode.value.get(DEFAULT_ORIGIN)
      return selectedArrivalCodes.value
        .map((airportCode) => airportByCode.value.get(airportCode))
        .filter(Boolean)
        .map((arrivalAirport) => ({
          origin: formatAirportLabel(originAirport),
          destination: formatAirportLabel(arrivalAirport)
        }))
    })

    const groupAirportsByCountry = (airportCodes) => {
      const groups = new Map()
      airportCodes.forEach((code) => {
        const airport = airportByCode.value.get(code)
        if (!airport) return
        const airportsForCountry = groups.get(airport.country) || []
        airportsForCountry.push({ ...airport, label: formatAirportLabel(airport) })
        groups.set(airport.country, airportsForCountry)
      })
      return [...groups.entries()]
        .sort(([firstCountry], [secondCountry]) => firstCountry.localeCompare(secondCountry))
        .map(([country, groupedAirports]) => ({
          country,
          airports: groupedAirports.sort((first, second) => first.label.localeCompare(second.label))
        }))
    }

    const destinationAirportGroups = computed(() => groupAirportsByCountry(destinationAirportCodes.value))
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

    const returnOptions = computed(() => availableReturnDates.value
      .map((date) => ({ date, nights: departureDate.value ? getNights(departureDate.value, date) : 0 }))
      .filter((option) => option.nights >= MINIMUM_STAY_NIGHTS)
      .filter((option) => {
        if (durationFilter.value === 'escape') return option.nights <= 4
        if (durationFilter.value === 'week') return option.nights >= 6 && option.nights <= 9
        if (durationFilter.value === 'fortnight') return option.nights >= 13 && option.nights <= 16
        return true
      }))

    const departureDateOptions = computed(() => availableDepartureDates.value
      .filter((date) => date >= earliestDepartureDate.value)
      .map((date) => ({
      date,
      day: new Intl.DateTimeFormat('en-CA', { day: '2-digit' }).format(toUtcDate(date)),
      weekday: new Intl.DateTimeFormat('en-CA', { weekday: 'short' }).format(toUtcDate(date)),
      month: new Intl.DateTimeFormat('en-CA', { month: 'short' }).format(toUtcDate(date))
      })))

    const handleDestinationInput = () => {
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

    const selectAllDestinations = () => {
      destination.value = ALL_DESTINATIONS
      selectedDestinationCodes.value = null
      validationMessage.value = ''
      closeDestinationMenu()
    }

    const loadRegularDates = async (departureCodes, arrivalCodes) => {
      const searchParams = new URLSearchParams({
        departureCodes: departureCodes.join(','),
        arrivalCodes: arrivalCodes.join(',')
      })
      const response = await fetch(`${backendUrl}/transat/calendar?${searchParams}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Air Transat travel dates are unavailable.')
      return data.dates || []
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

    watch(selectedArrivalCodes, async (arrivalCodes) => {
      availableDepartureDates.value = []
      availableReturnDates.value = []
      departureDate.value = ''
      returnDate.value = ''
      if (arrivalCodes.length === 0) return

      isDepartureLoading.value = true
      try {
        earliestDepartureDate.value = getEarliestDepartureDate()
        const regularDates = await loadRegularDates([DEFAULT_ORIGIN], arrivalCodes)
        availableDepartureDates.value = regularDates.filter((date) => date >= earliestDepartureDate.value)
      } catch (error) {
        validationMessage.value = error.message
      } finally {
        isDepartureLoading.value = false
      }
    })

    watch(departureDate, async (selectedDepartureDate) => {
      availableReturnDates.value = []
      returnDate.value = ''
      if (!selectedDepartureDate || selectedArrivalCodes.value.length === 0) return

      isReturnLoading.value = true
      try {
        availableReturnDates.value = await loadRegularDates(selectedArrivalCodes.value, [DEFAULT_ORIGIN])
      } catch (error) {
        validationMessage.value = error.message
      } finally {
        isReturnLoading.value = false
      }
    })

    const selectDepartureDate = (date) => {
      departureDate.value = date
      validationMessage.value = ''
    }

    const selectReturnDate = (date) => {
      returnDate.value = date
      validationMessage.value = ''
    }

    const setDurationFilter = (filter) => {
      durationFilter.value = filter
      if (!returnOptions.value.some((option) => option.date === returnDate.value)) returnDate.value = ''
    }

    const startTracking = () => {
      const destinationCode = destination.value.trim().toUpperCase()
      const hasSpecificAirport = destinationAirportCodes.value.includes(destinationCode)
      if (!hasDestinationSelection.value || (!selectedDestinationCodes.value && destinationCode !== ALL_DESTINATIONS && !hasSpecificAirport)) {
        validationMessage.value = 'Select an Air Transat destination, country, or ALL.'
        return
      }
      if (!departureDateOptions.value.some((option) => option.date === departureDate.value)) {
        validationMessage.value = 'Choose an available departure date.'
        return
      }
      if (!returnOptions.value.some((option) => option.date === returnDate.value)) {
        validationMessage.value = 'Choose a valid return date with at least two nights away.'
        return
      }

      const originAirport = airportByCode.value.get(DEFAULT_ORIGIN)
      const routeOptions = selectedArrivalCodes.value
        .map((airportCode) => airportByCode.value.get(airportCode))
        .filter(Boolean)
        .map((arrivalAirport) => ({
          origin: formatAirportLabel(originAirport),
          destination: formatAirportLabel(arrivalAirport)
        }))

      emit('track', {
        origin: origin.value,
        destination: selectedDestinationCodes.value ? destination.value : destinationCode,
        destinationCodes: selectedDestinationCodes.value,
        travelDate: departureDate.value,
        returnTravelDate: returnDate.value,
        routeOptions
      })
    }

    onMounted(loadRouteData)

    return {
      departureDate,
      departureDateOptions,
      destination,
      formMessage,
      formatDate,
      formatMonth,
      handleDestinationInput,
      hasDestinationSelection,
      isDepartureLoading,
      isDestinationMenuOpen,
      isLoadingRoutes,
      isReturnLoading,
      isSubmitDisabled,
      openDestinationMenu,
      originLabel,
      returnDate,
      returnOptions,
      selectedRoutes,
      selectAllDestinations,
      selectCountry,
      selectDepartureDate,
      selectDestination,
      selectReturnDate,
      setDurationFilter,
      startTracking,
      visibleDestinationAirportGroups,
      closeDestinationMenu,
      durationFilter
    }
  }
}
