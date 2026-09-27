import { computed, onMounted, ref, watch } from 'vue'
import { getCountryMetadata, getSearchTerms, normalizeCountry } from './destinationMetadata'

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

// Values like "2026-09-19T14:00:00" are local YUL/gateway times with no offset; format them as-is.
const formatFlightDateTime = (value) => {
  if (!value) return ''
  const [datePart, timePart] = value.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute] = (timePart || '00:00').split(':').map(Number)
  const displayDate = new Intl.DateTimeFormat('en-CA', { month: 'short', day: 'numeric' }).format(new Date(Date.UTC(year, month - 1, day)))
  return `${displayDate}, ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

const formatFlightDuration = (value) => {
  if (!value) return ''
  const [hours, minutes] = value.split(':').map(Number)
  if (!hours) return `${minutes}m`
  if (!minutes) return `${hours}h`
  return `${hours}h ${minutes}m`
}

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
  props: {
    initialDestinationCode: {
      type: String,
      default: ''
    },
    initialDestinationImage: {
      type: String,
      default: ''
    }
  },
  setup(props, { emit }) {
    const origin = ref(DEFAULT_ORIGIN)
    const destination = ref('')
    const selectedDestinationCodes = ref(null)
    const routes = ref({})
    const airports = ref([])
    const isLoadingRoutes = ref(true)
    const routeLoadError = ref('')
    const isDestinationMenuOpen = ref(false)
    const naturalLanguageQuery = ref('')
    const availableDepartureDates = ref([])
    const availableReturnDates = ref([])
    const isDepartureLoading = ref(false)
    const isReturnLoading = ref(false)
    const departureDate = ref('')
    const returnDate = ref('')
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
        .map((airportCode) => ({ code: airportCode, airport: airportByCode.value.get(airportCode) }))
        .filter((entry) => entry.airport)
        .map(({ code, airport }) => ({
          code,
          origin: formatAirportLabel(originAirport),
          destination: formatAirportLabel(airport)
        }))
    })
    const flightScheduleByDestination = ref({})
    const isFlightScheduleLoading = ref(false)
    const flightScheduleError = ref('')
    const visibleSelectedRoutes = computed(() => {
      if (isFlightScheduleLoading.value) return selectedRoutes.value
      return selectedRoutes.value.filter((route) => {
        const schedule = flightScheduleByDestination.value[route.code]
        return schedule?.outbound?.length > 0 && schedule?.inbound?.length > 0
      })
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
    const naturalLanguageSuggestions = computed(() => {
      const query = naturalLanguageQuery.value.trim()
      if (!query) return []

      const { intents, nights, region } = getSearchTerms(query)
      const normalizedQuery = normalizeCountry(query)
      return destinationAirportGroups.value
        .filter((group) => !region || getCountryMetadata(group.country).region === region)
        .map((group) => {
          const metadata = getCountryMetadata(group.country)
          const normalizedCountry = normalizeCountry(group.country)
          const countryMatches = normalizedCountry.includes(normalizedQuery)
          const intentScore = intents.reduce((score, intent) => score + (metadata.tags.includes(intent) ? 4 : 0), 0)
          const durationMatches = nights === null || (nights >= metadata.minNights && nights <= metadata.maxNights)
          const score = intentScore + (countryMatches ? 8 : 0) + (durationMatches && nights !== null ? 2 : 0)
          return { group, metadata, score, durationMatches, countryMatches }
        })
        .filter(({ score, countryMatches }) => score > 0 || countryMatches)
        .sort((first, second) => second.score - first.score || first.group.country.localeCompare(second.group.country))
        .slice(0, 6)
    })
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
      .filter((date) => date >= getEarliestDepartureDate())
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

    const selectNaturalLanguageSuggestion = (suggestion) => {
      selectCountry(suggestion.group)
      naturalLanguageQuery.value = ''
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

    const loadFlightCalendar = async (departureCode, arrivalCode, departureDateValue, returnDateValue) => {
      const searchParams = new URLSearchParams({
        departureCode,
        arrivalCode,
        departureDate: departureDateValue,
        returnDate: returnDateValue
      })
      const response = await fetch(`${backendUrl}/transat/flightcalendar?${searchParams}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Air Transat flight schedules are unavailable.')
      return data
    }

    const filterDatesWithFlights = async (dates, departureCodes, arrivalCodes, direction, departureDateValue, probeReturnDate) => {
      const availableDates = new Set()
      const calendars = await Promise.all(departureCodes.flatMap((departureCode) => arrivalCodes.map((arrivalCode) => loadFlightCalendar(
        departureCode,
        arrivalCode,
        direction === 'outbound' ? dates[0] : departureDateValue,
        direction === 'outbound' ? probeReturnDate : probeReturnDate
      ))))

      calendars.forEach((calendar) => {
        const flights = direction === 'outbound' ? calendar.outbound : calendar.inbound
        flights?.forEach((flight) => {
          const flightDate = flight.departureDate?.slice(0, 10)
          if (dates.includes(flightDate)) availableDates.add(flightDate)
        })
      })

      return dates.filter((date) => availableDates.has(date))
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
        if (props.initialDestinationCode && destinationAirportCodes.value.includes(props.initialDestinationCode)) {
          destination.value = props.initialDestinationCode
          selectedDestinationCodes.value = [props.initialDestinationCode]
        }
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
        const regularDates = await loadRegularDates([DEFAULT_ORIGIN], arrivalCodes)
        const futureDates = regularDates.filter((date) => date >= getEarliestDepartureDate())
        const returnDates = await loadRegularDates(arrivalCodes, [DEFAULT_ORIGIN])
        const probeReturnDate = returnDates.find((date) => getNights(futureDates[0], date) >= MINIMUM_STAY_NIGHTS)
        if (!futureDates.length || !probeReturnDate) return
        availableDepartureDates.value = await filterDatesWithFlights(
          futureDates,
          [DEFAULT_ORIGIN],
          arrivalCodes,
          'outbound',
          '',
          probeReturnDate
        )
        if (props.initialDestinationCode && !departureDate.value) {
          departureDate.value = departureDateOptions.value[0]?.date || ''
        }
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
        const regularDates = await loadRegularDates(selectedArrivalCodes.value, [DEFAULT_ORIGIN])
        const probeReturnDate = regularDates.find((date) => getNights(selectedDepartureDate, date) >= MINIMUM_STAY_NIGHTS)
        if (!probeReturnDate) return
        availableReturnDates.value = await filterDatesWithFlights(
          regularDates,
          selectedArrivalCodes.value,
          [DEFAULT_ORIGIN],
          'inbound',
          selectedDepartureDate,
          probeReturnDate
        )
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

    watch(returnDate, async (selectedReturnDate) => {
      flightScheduleByDestination.value = {}
      flightScheduleError.value = ''
      if (!selectedReturnDate || !departureDate.value || selectedArrivalCodes.value.length === 0) return

      isFlightScheduleLoading.value = true
      try {
        const entries = await Promise.all(selectedArrivalCodes.value.map(async (code) => {
          const data = await loadFlightCalendar(
            DEFAULT_ORIGIN,
            code,
            departureDate.value,
            selectedReturnDate
          )

          const outbound = (data.outbound || []).filter((flight) => flight.departureDate?.startsWith(departureDate.value))
          const inbound = (data.inbound || []).filter((flight) => flight.departureDate?.startsWith(selectedReturnDate))
          return [code, { outbound, inbound }]
        }))
        flightScheduleByDestination.value = Object.fromEntries(entries)
      } catch (error) {
        flightScheduleError.value = error.message
      } finally {
        isFlightScheduleLoading.value = false
      }
    })

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
      flightScheduleByDestination,
      flightScheduleError,
      formMessage,
      formatDate,
      formatFlightDateTime,
      formatFlightDuration,
      formatMonth,
      handleDestinationInput,
      hasDestinationSelection,
      isDepartureLoading,
      isDestinationMenuOpen,
      isFlightScheduleLoading,
      isLoadingRoutes,
      naturalLanguageQuery,
      naturalLanguageSuggestions,
      isReturnLoading,
      isSubmitDisabled,
      openDestinationMenu,
      originLabel,
      returnDate,
      returnOptions,
      selectedRoutes,
      visibleSelectedRoutes,
      selectAllDestinations,
      selectCountry,
      selectDepartureDate,
      selectDestination,
      selectNaturalLanguageSuggestion,
      selectReturnDate,
      setDurationFilter,
      startTracking,
      visibleDestinationAirportGroups,
      closeDestinationMenu,
      durationFilter
    }
  }
}
