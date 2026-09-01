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
    const returnTravelDate = ref('')
    const availableReturnDates = ref([])
    const isReturnCalendarLoading = ref(false)
    const calendarMonth = ref(new Date())
    const returnCalendarMonth = ref(new Date())
    const calendarWeekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const airportByCode = computed(() => new Map(airports.value.map((airport) => [airport.code, airport])))
const originAirport = computed(() => airportByCode.value.get(DEFAULT_ORIGIN))
const originLabel = computed(() => formatAirportLabel(originAirport.value) || DEFAULT_ORIGIN)
const destinationAirports = computed(() => (routes.value[DEFAULT_ORIGIN] || [])
  .filter((code) => airportByCode.value.has(code)))
const formMessage = computed(() => routeLoadError.value || validationMessage.value)
const isSubmitDisabled = computed(() => isLoadingRoutes.value || Boolean(routeLoadError.value))
const hasDestinationSelection = computed(() => calendarArrivalCodes.value.length > 0)
const availableTravelDateSet = computed(() => new Set(availableTravelDates.value))
const availableReturnDateSet = computed(() => new Set(availableReturnDates.value))
const firstAvailableDate = computed(() => availableTravelDates.value[0] || '')
const lastAvailableDate = computed(() => availableTravelDates.value.at(-1) || '')
const firstAvailableReturnDate = computed(() => availableReturnDates.value[0] || '')
const lastAvailableReturnDate = computed(() => availableReturnDates.value.at(-1) || '')
const calendarMonthLabel = computed(() => new Intl.DateTimeFormat('en-CA', {
  month: 'long',
  year: 'numeric'
}).format(calendarMonth.value))
const calendarLeadingDays = computed(() => {
  const firstDay = new Date(calendarMonth.value.getFullYear(), calendarMonth.value.getMonth(), 1)
  return Array.from({ length: firstDay.getDay() }, (_, index) => index)
})
const calendarDays = computed(() => {
  const year = calendarMonth.value.getFullYear()
  const month = calendarMonth.value.getMonth()
  const lastDay = new Date(year, month + 1, 0).getDate()

  return Array.from({ length: lastDay }, (_, index) => {
    const dayNumber = index + 1
    const value = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`
    return { dayNumber, value, isAvailable: availableTravelDateSet.value.has(value) }
  })
})
const calendarMonthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
const canShowPreviousMonth = computed(() => Boolean(firstAvailableDate.value) && calendarMonthKey(calendarMonth.value) > firstAvailableDate.value.slice(0, 7))
const canShowNextMonth = computed(() => Boolean(lastAvailableDate.value) && calendarMonthKey(calendarMonth.value) < lastAvailableDate.value.slice(0, 7))
const returnCalendarMonthLabel = computed(() => new Intl.DateTimeFormat('en-CA', { month: 'long', year: 'numeric' }).format(returnCalendarMonth.value))
const returnCalendarLeadingDays = computed(() => Array.from({ length: new Date(returnCalendarMonth.value.getFullYear(), returnCalendarMonth.value.getMonth(), 1).getDay() }, (_, index) => index))
const returnCalendarDays = computed(() => createCalendarDays(returnCalendarMonth.value, availableReturnDateSet.value, travelDate.value))
const canShowPreviousReturnMonth = computed(() => Boolean(firstAvailableReturnDate.value) && calendarMonthKey(returnCalendarMonth.value) > firstAvailableReturnDate.value.slice(0, 7))
const canShowNextReturnMonth = computed(() => Boolean(lastAvailableReturnDate.value) && calendarMonthKey(returnCalendarMonth.value) < lastAvailableReturnDate.value.slice(0, 7))
const calendarArrivalCodes = computed(() => {
  const destinationCode = destination.value.trim().toUpperCase()
  if (destinationCode === ALL_DESTINATIONS) return destinationAirports.value
  if (selectedDestinationCodes.value) return selectedDestinationCodes.value
  return destinationAirports.value.includes(destinationCode) ? [destinationCode] : []
})

const formatAirportLabel = (airport) => {
  if (!airport) return ''
  return `${airport.code} - ${airport.city} - ${airport.country}`
}

const createCalendarDays = (monthDate, availableDates, minimumDate = '') => {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const lastDay = new Date(year, month + 1, 0).getDate()
  return Array.from({ length: lastDay }, (_, index) => {
    const dayNumber = index + 1
    const value = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`
    return { dayNumber, value, isAvailable: availableDates.has(value) && (!minimumDate || value >= minimumDate) }
  })
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

const selectTravelDate = (date) => {
  if (!availableTravelDateSet.value.has(date)) return
  travelDate.value = date
  validationMessage.value = ''
}

const selectReturnTravelDate = (date) => {
  if (!availableReturnDateSet.value.has(date) || date < travelDate.value) return
  returnTravelDate.value = date
  validationMessage.value = ''
}

const showPreviousMonth = () => {
  if (canShowPreviousMonth.value) calendarMonth.value = new Date(calendarMonth.value.getFullYear(), calendarMonth.value.getMonth() - 1, 1)
}

const showNextMonth = () => {
  if (canShowNextMonth.value) calendarMonth.value = new Date(calendarMonth.value.getFullYear(), calendarMonth.value.getMonth() + 1, 1)
}

const showPreviousReturnMonth = () => {
  if (canShowPreviousReturnMonth.value) returnCalendarMonth.value = new Date(returnCalendarMonth.value.getFullYear(), returnCalendarMonth.value.getMonth() - 1, 1)
}

const showNextReturnMonth = () => {
  if (canShowNextReturnMonth.value) returnCalendarMonth.value = new Date(returnCalendarMonth.value.getFullYear(), returnCalendarMonth.value.getMonth() + 1, 1)
}

const loadCalendar = async (arrivalCodes) => {
  availableTravelDates.value = []
  travelDate.value = ''
  availableReturnDates.value = []
  returnTravelDate.value = ''
  if (arrivalCodes.length === 0) return

  isCalendarLoading.value = true
  try {
    const searchParams = new URLSearchParams({ departureCodes: DEFAULT_ORIGIN, arrivalCodes: arrivalCodes.join(',') })
    const response = await fetch(`${backendUrl}/transat/calendar?${searchParams}`)
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Air Transat travel dates are unavailable.')
    availableTravelDates.value = data.dates || []
    travelDate.value = availableTravelDates.value.find((date) => date >= today) || ''
    if (travelDate.value) calendarMonth.value = new Date(`${travelDate.value}T00:00:00`)
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

watch(travelDate, async (departureDate) => {
  availableReturnDates.value = []
  returnTravelDate.value = ''
  if (!departureDate || calendarArrivalCodes.value.length === 0) return

  isReturnCalendarLoading.value = true
  try {
    const searchParams = new URLSearchParams({
      departureCodes: calendarArrivalCodes.value.join(','),
      arrivalCodes: DEFAULT_ORIGIN
    })
    const response = await fetch(`${backendUrl}/transat/calendar?${searchParams}`)
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Air Transat return dates are unavailable.')
    availableReturnDates.value = data.dates || []
    returnTravelDate.value = availableReturnDates.value.find((date) => date >= departureDate) || ''
    if (returnTravelDate.value) returnCalendarMonth.value = new Date(`${returnTravelDate.value}T00:00:00`)
  } catch (error) {
    validationMessage.value = error.message
  } finally {
    isReturnCalendarLoading.value = false
  }
})

  const startTracking = () => {
  if (isSubmitDisabled.value || isCalendarLoading.value) return

  const destinationCode = destination.value.trim().toUpperCase()
  if (destinationCode === ALL_DESTINATIONS) destination.value = ALL_DESTINATIONS

  if (destinationCode !== ALL_DESTINATIONS && !selectedDestinationCodes.value && !/^[A-Z]{3}$/.test(destinationCode)) {
    validationMessage.value = 'Select an arrival airport or ALL.'
    return
  }

  if (destinationCode !== ALL_DESTINATIONS && !selectedDestinationCodes.value && origin.value === destinationCode) {
    validationMessage.value = 'Departure and arrival airports must be different.'
    return
  }

  if (destinationCode !== ALL_DESTINATIONS && !selectedDestinationCodes.value && !destinationAirports.value.includes(destinationCode)) {
    validationMessage.value = 'Choose a valid Air Transat round-trip route.'
    return
  }

  if (!availableTravelDates.value.includes(travelDate.value)) {
    validationMessage.value = 'Select an available regular travel date.'
    return
  }

  if (!availableReturnDates.value.includes(returnTravelDate.value) || returnTravelDate.value < travelDate.value) {
    validationMessage.value = 'Select an available return date after the departure date.'
    return
  }

  validationMessage.value = ''
      emit('track', {
        origin: origin.value,
        destination: destination.value,
        destinationCodes: selectedDestinationCodes.value,
        travelDate: travelDate.value,
        returnTravelDate: returnTravelDate.value
      })
    }

    return {
      destination,
      destinationAirportGroups,
      availableTravelDates,
      calendarDays,
      calendarLeadingDays,
      calendarMonthLabel,
      calendarWeekdays,
      canShowNextMonth,
      canShowPreviousMonth,
      canShowNextReturnMonth,
      canShowPreviousReturnMonth,
      formMessage,
      formatTravelDate,
      handleDestinationInput,
      isDestinationMenuOpen,
      isCalendarLoading,
      isLoadingRoutes,
      isReturnCalendarLoading,
      isSubmitDisabled,
      openDestinationMenu,
      originLabel,
      closeDestinationMenu,
      selectDestination,
      selectCountry,
      selectTravelDate,
      selectReturnTravelDate,
      showNextMonth,
      showPreviousMonth,
      showNextReturnMonth,
      showPreviousReturnMonth,
      startTracking,
      today,
      travelDate,
      returnCalendarDays,
      returnCalendarLeadingDays,
      returnCalendarMonthLabel,
      returnTravelDate,
      hasDestinationSelection,
      visibleDestinationAirportGroups
    }
  }
}
