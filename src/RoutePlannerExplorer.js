import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { createDestinationSearchIndex, getSearchTerms, searchDestinations } from './destinationMetadata'

const DEFAULT_ORIGIN = 'YUL'
const ALL_DESTINATIONS = 'ALL'
const MINIMUM_STAY_NIGHTS = 2
// A flight-calendar request returns the 15 days centred on its date, so one request per window covers a range.
const FLIGHT_WINDOW_RADIUS_DAYS = 7
const MAX_FLIGHT_CHECK_ROUTES = 4
const backendUrl = 'https://flight-tracker-backend-98vm.onrender.com/api'
const BOOKING_URL = 'https://www.airtransat.com/en-CA/FlightSearch/Engine/ManageFlightSearch'

const toUtcDate = (date) => new Date(`${date}T00:00:00Z`)

const formatAirportLabel = (airport) => {
  if (!airport) return ''
  return `${airport.code} - ${airport.city} - ${airport.country}`
}

// Dates are plain calendar days stored as UTC midnight, so format in UTC to avoid a one-day shift west of Greenwich.
const formatDate = (date) => new Intl.DateTimeFormat('en-CA', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC'
}).format(toUtcDate(date))

const formatMonth = (date) => new Intl.DateTimeFormat('en-CA', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC'
}).format(toUtcDate(date))

const getNights = (departureDate, returnDate) => Math.round((toUtcDate(returnDate) - toUtcDate(departureDate)) / 86400000)

const addDays = (date, days) => {
  const shifted = toUtcDate(date)
  shifted.setUTCDate(shifted.getUTCDate() + days)
  return shifted.toISOString().slice(0, 10)
}

// Values like "2026-09-19T14:00:00" are local YUL/gateway times with no offset; format them as-is.
const formatFlightDateTime = (value) => {
  if (!value) return ''
  const [datePart, timePart] = value.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute] = (timePart || '00:00').split(':').map(Number)
  const displayDate = new Intl.DateTimeFormat('en-CA', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, day)))
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
    },
    initialSearchQuery: {
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
    const naturalLanguageQuery = ref(props.initialSearchQuery)
    // A query carried over from the landing page only pre-fills the field; suggestions wait for the user to edit it.
    const suppressSuggestions = ref(Boolean(props.initialSearchQuery))
    const handleNaturalLanguageInput = () => {
      suppressSuggestions.value = false
    }
    // Month (1-12) named in the search; manual destination picks clear it.
    const preferredMonth = ref(getSearchTerms(props.initialSearchQuery).month)
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
    const destinationSearchIndex = computed(() => createDestinationSearchIndex(destinationAirportGroups.value))
    const naturalLanguageSuggestions = computed(() => {
      const query = naturalLanguageQuery.value.trim()
      if (!query || suppressSuggestions.value) return []
      return searchDestinations(destinationSearchIndex.value, query, 6)
        .map(({ destination: group, metadata, score }) => ({ group, metadata, score }))
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
      day: new Intl.DateTimeFormat('en-CA', { day: '2-digit', timeZone: 'UTC' }).format(toUtcDate(date)),
      weekday: new Intl.DateTimeFormat('en-CA', { weekday: 'short', timeZone: 'UTC' }).format(toUtcDate(date)),
      month: new Intl.DateTimeFormat('en-CA', { month: 'short', timeZone: 'UTC' }).format(toUtcDate(date))
      })))

    const handleDestinationInput = () => {
      selectedDestinationCodes.value = null
      preferredMonth.value = null
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
      preferredMonth.value = null
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
      preferredMonth.value = getSearchTerms(naturalLanguageQuery.value).month
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

    // direction is 'outbound' (YUL to the airport) or 'inbound' (airport back to YUL), both read from a YUL-to-airport request.
    const filterDatesWithFlights = async (dates, arrivalCodes, direction) => {
      // Checking many routes would mean hundreds of requests, so fall back to the regular calendar.
      if (arrivalCodes.length > MAX_FLIGHT_CHECK_ROUTES) return dates

      const anchors = []
      let coveredUntil = ''
      dates.forEach((date) => {
        if (date <= coveredUntil) return
        const anchor = addDays(date, FLIGHT_WINDOW_RADIUS_DAYS)
        anchors.push(anchor)
        coveredUntil = addDays(anchor, FLIGHT_WINDOW_RADIUS_DAYS)
      })

      const calendars = await Promise.all(arrivalCodes.flatMap((arrivalCode) => anchors.map((anchor) => (
        loadFlightCalendar(DEFAULT_ORIGIN, arrivalCode, anchor, anchor)
      ))))

      const availableDates = new Set()
      calendars.forEach((calendar) => {
        calendar[direction]?.forEach((flight) => availableDates.add(flight.departureDate?.slice(0, 10)))
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
        if (!futureDates.length) return
        availableDepartureDates.value = await filterDatesWithFlights(futureDates, arrivalCodes, 'outbound')
        if (!departureDate.value && (preferredMonth.value || props.initialDestinationCode)) {
          const options = departureDateOptions.value
          const monthMatch = preferredMonth.value
            ? options.find((option) => Number(option.date.slice(5, 7)) === preferredMonth.value)
            : null
          if (monthMatch) {
            departureDate.value = monthMatch.date
          } else if (preferredMonth.value) {
            const monthName = new Intl.DateTimeFormat('en-CA', { month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(2000, preferredMonth.value - 1, 1)))
            validationMessage.value = `No departures available in ${monthName}. Choose another date.`
          } else {
            departureDate.value = options[0]?.date || ''
          }
        }
      } catch (error) {
        validationMessage.value = error.message
      } finally {
        isDepartureLoading.value = false
      }
    })

    watch(departureDate, async (date) => {
      if (!date) return
      await nextTick()
      document.querySelector('.departure-card.is-selected')?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
    })

    watch(departureDate, async (selectedDepartureDate) => {
      availableReturnDates.value = []
      returnDate.value = ''
      if (!selectedDepartureDate || selectedArrivalCodes.value.length === 0) return

      isReturnLoading.value = true
      try {
        const regularDates = await loadRegularDates(selectedArrivalCodes.value, [DEFAULT_ORIGIN])
        // Windows come from the full date list so the same requests (and cache entries) are reused for every departure.
        const flightDates = await filterDatesWithFlights(regularDates, selectedArrivalCodes.value, 'inbound')
        availableReturnDates.value = flightDates.filter((date) => getNights(selectedDepartureDate, date) >= MINIMUM_STAY_NIGHTS)
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

    // Outbound runs YUL to the card's airport on the departure date; inbound is the reverse on the return date.
    const buildBookingUrl = (route) => {
      const params = new URLSearchParams({
        departureDate: departureDate.value,
        departureFromCode: DEFAULT_ORIGIN,
        departureFromType: 'airport',
        departureToCode: route.code,
        departureToType: 'airport',
        returnDate: returnDate.value,
        returnFromCode: route.code,
        returnFromType: 'airport',
        returnToCode: DEFAULT_ORIGIN,
        returnToType: 'airport',
        adultNumber: '1',
        childNumber: '0',
        babySeatNumber: '0',
        babyKneeNumber: '0'
      })
      return `${BOOKING_URL}?${params}`
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
      suppressSuggestions,
      handleNaturalLanguageInput,
      naturalLanguageSuggestions,
      isReturnLoading,
      isSubmitDisabled,
      openDestinationMenu,
      originLabel,
      returnDate,
      returnOptions,
      selectedRoutes,
      visibleSelectedRoutes,
      buildBookingUrl,
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
