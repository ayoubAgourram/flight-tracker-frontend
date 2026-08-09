import { ref, onMounted, onBeforeUnmount, effect } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default {
  setup() {
    // 1. All your variables
    const airlines = [
      { iata: 'TS', icao: 'TSC', name: 'Air Transat', color: '#00A5D8' },
      { iata: 'AC', icao: 'ACA', name: 'Air Canada', color: '#D71920' },
      { iata: 'WS', icao: 'WJA', name: 'WestJet', color: '#00AAA6' },
      { iata: 'PD', icao: 'POE', name: 'Porter', color: '#0A4CA3' },
      { iata: 'AT', icao: 'RAM', name: 'Royal Air Maroc', color: '#C2002F' },
      { iata: 'QR', icao: 'QTR', name: 'Qatar Airways', color: '#5B1D4A' },
      { iata: 'RX', icao: 'RXI', name: 'Riyadh Air', color: '#250854' },
      { iata: 'AA', icao: 'AAL', name: 'American Airlines', color: '#36495A' },
      { iata: 'AF', icao: 'AFR', name: 'Air France', color: '#00205B' },
      { iata: 'BA', icao: 'BAW', name: 'British Airways', color: '#CC3333' },
      { iata: 'DL', icao: 'DAL', name: 'Delta Air Lines', color: '#003366' },
      { iata: 'UA', icao: 'UAL', name: 'United Airlines', color: '#1414D2' }
    ];

    const closeDrawer = () => {
      isDrawerOpen.value = false;
      // Cleanup the trajectory line and airport labels when the user closes the drawer
      if (routeAnimationTimer) {
        clearInterval(routeAnimationTimer);
        routeAnimationTimer = null;
      }
      if (routeLayer) {
        routeLayer.clearLayers();
      }
      currentTrajectory = null;
      routeMarkers = [];
    };
    const selectedIata = ref('TS');
    const BACKEND_URL = 'https://flight-tracker-backend-98vm.onrender.com/api';
    //const BACKEND_URL = 'http://localhost:3000/api';

    // NEW: Reactive variables for the drawer
    const isDrawerOpen = ref(false);
    const selectedFlight = ref(null);

    let map = null;
    let markerLayer = null;
    let routeLayer = null;
    let currentTrajectory = null;
    let routeMarkers = [];
    let routeAnimationTimer = null;
    let updateInterval = null;
    let userLocation = null; // NEW: Stores the user's coordinates
    const flightCount = ref(0); // NEW: Tracks the number of planes
    let isFetchingRoute = false;

    // 2. Lifecycle hooks
    onMounted(() => {
      initMap();
      fetchLiveFlights();
      // every 6 hours:
      updateInterval = setInterval(fetchLiveFlights, 6 * 60 * 60 * 1000);
    });

    onBeforeUnmount(() => {
      if (updateInterval) clearInterval(updateInterval);
      window.removeEventListener('resize', handleResize); // NEW: Clean up the listener
      if (map) map.remove();
    });

    // 3. All your functions
    const initMap = () => {
      map = L.map('map').setView([40, -40], 3);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors, © CARTO'
      }).addTo(map);

      markerLayer = L.layerGroup().addTo(map);
      routeLayer = L.layerGroup().addTo(map);

      // Close the drawer if the user taps empty space on the map
      map.on('click', closeDrawer);

      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;

            // 1. Save the location so the app remembers it
            userLocation = [userLat, userLng];

            map.flyTo(userLocation, 7, { animate: true, duration: 1.5 });
            L.circleMarker(userLocation, {
              color: '#ffffff', fillColor: '#3b82f6', fillOpacity: 1, weight: 2, radius: 8
            }).addTo(map).bindPopup('<b>You are here!</b>');
          },
          (error) => console.warn('Geolocation error:', error.message),
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      }

      // 2. Listen for any screen size changes (phone rotation, browser resize)
      window.addEventListener('resize', handleResize);
    };

    // 3. The function that forces the map to recenter
    const handleResize = () => {
      if (map) {
        // Crucial for Leaflet: forces it to redraw if the container size changed
        map.invalidateSize();

        // If we have the user's location, push them back to the center
        if (userLocation) {
          map.panTo(userLocation, { animate: true });
        }
      }
    };

    const createPlaneIcon = (heading, fillColor = '#ffffff') => {
      // A clean, symmetric, top-down vector graphic of a commercial airliner
      const elegantSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28">
      <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" 
            fill="${fillColor}" 
            stroke="#0f172a" 
            stroke-width="1.5" />
    </svg>
  `;

      return L.divIcon({
        // We wrap the SVG in a div to handle the rotation based on the live heading
        html: `<div class="elegant-plane" style="transform: rotate(${heading}deg);">${elegantSvg}</div>`,
        className: 'custom-plane-icon',
        iconSize: [28, 28],
        iconAnchor: [14, 14] // Exactly half the width/height so the plane rotates around its true center
      });
    };

    const createAirportCodeIcon = (code) => {
      const safeCode = (code || 'AIR').toString().slice(0, 4).toUpperCase();

      return L.divIcon({
        html: `<div style="background: rgba(15, 23, 42, 0.82); color: white; padding: 4px 8px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.45); box-shadow: 0 3px 10px rgba(15, 23, 42, 0.28); font-size: 10px; font-weight: 700; line-height: 1; letter-spacing: 0.08em; white-space: nowrap;">${safeCode}</div>`,
        className: 'airport-code-marker',
        iconSize: [52, 22],
        iconAnchor: [26, 11]
      });
    };

    const getAirlineTailUrl = (iata) => {
      const normalizedIata = (iata || selectedIata.value || 'TS').toUpperCase();
      return new URL(`./tails/${normalizedIata}-tail.png`, import.meta.url).href;
    };

    const animateSelectedRoute = (polyline) => {
      if (!polyline) return;
      if (routeAnimationTimer) clearInterval(routeAnimationTimer);

      routeAnimationTimer = setInterval(() => {
        if (!polyline || !map) return;
        const offset = (Date.now() / 45) % 36;
        polyline.setStyle({ dashOffset: `${-offset}` });
      }, 40);
    };

    const createCurvedRoutePoints = (originAirport, aircraftPosition, destinationAirport) => {
      const start = originAirport || aircraftPosition;
      const end = destinationAirport || aircraftPosition;

      if (!start || !end) return [start, end].filter(Boolean);

      const [lat1, lng1] = start;
      const [lat2, lng2] = end;
      const dx = lng2 - lng1;
      const dy = lat2 - lat1;
      const distance = Math.hypot(dx, dy) || 1;

      const bend = Math.min(Math.max(distance * 0.18, 8), 24);
      const curveLat = (lat1 + lat2) / 2 + bend;
      const curveLng = (lng1 + lng2) / 2;

      const points = [];
      for (let i = 0; i <= 40; i += 1) {
        const t = i / 40;
        const lat = (1 - t) * (1 - t) * lat1 + 2 * (1 - t) * t * curveLat + t * t * lat2;
        const lng = (1 - t) * (1 - t) * lng1 + 2 * (1 - t) * t * curveLng + t * t * lng2;
        points.push([lat, lng]);
      }

      return points;
    };

    const parseDateValue = (value) => {
      if (!value || value === 'N/A') return null;

      const stringValue = String(value).trim();
      if (!stringValue) return null;

      const normalized = stringValue.replace(' ', 'T');
      const hasExplicitTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized);

      const parsed = hasExplicitTimezone
        ? new Date(normalized)
        : new Date(`${normalized}Z`);

      return Number.isNaN(parsed.getTime()) ? null : parsed;
    };

    const formatClockTime = (value) => {
      const parsed = parseDateValue(value);
      if (parsed) {
        return parsed.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      }

      if (typeof value === 'string' && value.includes('T')) {
        const match = value.match(/T(\d{1,2}:\d{2})(?::\d{2})?/);
        if (match) return match[1];
      }

      if (typeof value === 'string' && /^\d{1,2}:\d{2}/.test(value.trim())) {
        return value.trim().slice(0, 5);
      }

      return value || 'N/A';
    };

    const formatFlightDuration = (value) => {
      if (value === null || value === undefined || value === '') return 'N/A';

      const totalMinutes = Number(value);
      if (Number.isNaN(totalMinutes)) return String(value);

      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      if (hours === 0) return `${minutes}m`;
      if (minutes === 0) return `${hours}h`;
      return `${hours}h ${minutes}m`;
    };

    const formatRemainingArrivalTime = (arrivalValue, departureValue = null, durationValue = null) => {
      if (arrivalValue === null || arrivalValue === undefined || arrivalValue === '') return 'N/A';

      const arrivalDate = parseDateValue(arrivalValue);
      const departureDate = parseDateValue(departureValue);
      const totalMinutes = Number(durationValue);

      let candidateMinutes = null;

      if (arrivalDate) {
        candidateMinutes = Math.max(0, Math.round((arrivalDate.getTime() - Date.now()) / 60000));
      }

      if (Number.isFinite(totalMinutes) && totalMinutes > 0 && departureDate) {
        const elapsedMinutes = Math.max(0, Math.round((Date.now() - departureDate.getTime()) / 60000));
        const durationBasedRemaining = Math.max(0, totalMinutes - elapsedMinutes);

        if (candidateMinutes === null || Math.abs(durationBasedRemaining - candidateMinutes) > 90) {
          candidateMinutes = durationBasedRemaining;
        }
      }

      if (candidateMinutes === null) return 'N/A';

      const hours = Math.floor(candidateMinutes / 60);
      const minutes = candidateMinutes % 60;

      if (hours === 0) return `${minutes}m`;
      if (minutes === 0) return `${hours}h`;
      return `${hours}h ${minutes}m`;
    };

    const formatDelayValue = (value) => {
      if (value === null || value === undefined || value === '') return null;

      if (typeof value === 'number') {
        return `${value} min`;
      }

      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return null;

        if (/^\d+$/.test(trimmed)) {
          return `${trimmed} min`;
        }

        return trimmed;
      }

      return String(value);
    };

    const hasAnyDelay = (flight) => {
      return flight && (
        flight.dep_delayed !== null && flight.dep_delayed !== undefined && flight.dep_delayed !== ''
        || flight.arr_delayed !== null && flight.arr_delayed !== undefined && flight.arr_delayed !== ''
      );
    };

    const isArrivalNextDay = (arrivalValue, departureValue) => {
      const arrivalDate = parseDateValue(arrivalValue);
      const departureDate = parseDateValue(departureValue);

      if (!arrivalDate || !departureDate) return false;

      const arrivalDay = new Date(
        arrivalDate.getFullYear(),
        arrivalDate.getMonth(),
        arrivalDate.getDate()
      );
      const departureDay = new Date(
        departureDate.getFullYear(),
        departureDate.getMonth(),
        departureDate.getDate()
      );

      return arrivalDay.getTime() - departureDay.getTime() >= 24 * 60 * 60 * 1000;
    };

    const drawFallbackRoute = (flight) => {
      if (!flight || !map) return;

      const heading = Number(flight.heading) || 0;
      const angle = ((heading - 90) * Math.PI) / 180;
      const endLat = flight.lat + Math.cos(angle) * 12;
      const endLng = flight.lng + Math.sin(angle) * 18;

      const routeEnd = [endLat, endLng];
      const curvePoints = createCurvedRoutePoints([flight.lat, flight.lng], [flight.lat, flight.lng], routeEnd);

      currentTrajectory = L.polyline(curvePoints, {
        color: '#e74c3c',
        weight: 4,
        opacity: 0.95,
        dashArray: '4 12',
        dashOffset: '0'
      }).addTo(routeLayer);

      routeMarkers = [
        L.marker([flight.lat, flight.lng], { icon: createAirportCodeIcon(flight.origin || 'ORG') }),
        L.marker(routeEnd, { icon: createAirportCodeIcon(flight.destination || 'DST') })
      ];

      routeMarkers.forEach(marker => routeLayer.addLayer(marker));
      animateSelectedRoute(currentTrajectory);
      map.fitBounds(currentTrajectory.getBounds(), { padding: [50, 50] });
    };

    const drawAirportRoute = (route, flight) => {
      const airline = airlines.find(a => a.iata === selectedIata.value) || airlines[0];
      const routeColor = airline.color || '#e74c3c';
      const flightStart = [flight.lat, flight.lng];
      const routeEnd = route.destCoords || route.originCoords;
      const originPoint = route.originCoords || flightStart;
      const curvePoints = createCurvedRoutePoints(originPoint, flightStart, routeEnd);

      currentTrajectory = L.polyline(curvePoints, {
        color: routeColor,
        weight: 4,
        opacity: 0.98,
        lineCap: 'round',
        lineJoin: 'round',
        dashArray: '4 12',
        dashOffset: '0'
      });

      const originCode = route.origin || flight.origin || 'N/A';
      const destinationCode = route.destination || flight.destination || 'N/A';

      routeMarkers = [
        L.marker(route.originCoords, { icon: createAirportCodeIcon(originCode) }),
        L.marker(route.destCoords || route.originCoords, { icon: createAirportCodeIcon(destinationCode) })
      ];

      routeLayer.addLayer(currentTrajectory);
      routeMarkers.forEach(marker => routeLayer.addLayer(marker));
      animateSelectedRoute(currentTrajectory);
      map.fitBounds(currentTrajectory.getBounds(), { padding: [50, 50] });
    };

    const fetchLiveFlights = async () => {
      if (routeAnimationTimer) {
        clearInterval(routeAnimationTimer);
        routeAnimationTimer = null;
      }
      if (routeLayer) routeLayer.clearLayers();
      currentTrajectory = null;
      routeMarkers = [];
      selectedFlight.value = null;
      isDrawerOpen.value = false;
      markerLayer.clearLayers();

      const airline = airlines.find(a => a.iata === selectedIata.value);
      if (!airline) return;

      try {
        const res = await fetch(`${BACKEND_URL}/flights/${airline.icao}`);
        const flights = await res.json();
        flightCount.value = flights.length;

        flights.forEach(f => {
          const marker = L.marker([f.lat, f.lng], { icon: createPlaneIcon(f.heading, '#ffffff') });
          marker.__flightKey = f.icao24 || f.callsign || `${f.lat}-${f.lng}`;
          marker.__flightHeading = Number(f.heading) || 0;

          // The dependency is now purely event-driven. 
          // When clicked, it calls the manager function.
          marker.on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            openFlightDetails(f); // <--- This handles EVERYTHING for that plane
          });

          markerLayer.addLayer(marker);
        });
      } catch (err) { console.error('Fetch error:', err); }
    };


    

    const openFlightDetails = async (flight) => {
      // 1. Reset state
      selectedFlight.value = {
        ...flight,
        dep_actual: flight.dep_actual || flight.dep_time || 'N/A',
        arr_actual: flight.arr_actual || flight.arr_estimated || flight.arr_time || 'N/A',
        arr_estimated: flight.arr_estimated || flight.arr_actual || flight.arr_time || null,
        dep_delayed: flight.dep_delayed ?? null,
        arr_delayed: flight.arr_delayed ?? null,
        duration_minutes: flight.duration_minutes ?? flight.duration ?? null,
        makeModel: 'Loading...',
        registration: 'Loading...',
        route: 'Loading...',
        routeOrigin: flight.origin || 'Unknown',
        routeDest: flight.destination || 'Unknown'
      };
      isDrawerOpen.value = true;
      if (routeAnimationTimer) {
        clearInterval(routeAnimationTimer);
        routeAnimationTimer = null;
      }
      if (routeLayer) routeLayer.clearLayers();
      currentTrajectory = null;
      routeMarkers = [];

      const airline = airlines.find(a => a.iata === selectedIata.value) || airlines[0];
      const selectedColor = airline.color || '#ffffff';
      const selectedFlightKey = flight.icao24 || flight.callsign || `${flight.lat}-${flight.lng}`;

      markerLayer.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          const layerFlightKey = layer.__flightKey || `${layer.getLatLng?.().lat ?? ''}-${layer.getLatLng?.().lng ?? ''}`;
          const baseHeading = Number(layer.__flightHeading ?? flight.heading ?? 0) || 0;
          const sameFlight = layerFlightKey === selectedFlightKey;

          layer.setIcon(createPlaneIcon(baseHeading, sameFlight ? selectedColor : '#ffffff'));
        }
      });

      try {
        // 2. Fetch all data in parallel using Promise.all (Only 2 network calls total)
        // Call #1: Get Aircraft Details
        // Call #2: Get Route Data 
        const [aircraftRes, routeRes] = await Promise.all([
          fetch(`${BACKEND_URL}/aircraft/${flight.icao24}`),
          fetch(`${BACKEND_URL}/route/${flight.callsign}`)
        ]);

        const aircraft = await aircraftRes.json();

        // 3. Update UI details
        selectedFlight.value.makeModel = `${aircraft.make} ${aircraft.model}`;
        selectedFlight.value.registration = aircraft.registration;

        // 4. Handle Route data
        if (routeRes.ok) {
          const route = await routeRes.json();
          // console.log(`Route data for ${flight.callsign}:`, route);

          const originCode = route.origin || route.dep_iata || flight.origin || 'Ayoub';
          const destinationCode = route.destination || route.arr_iata || flight.destination || 'Unknown';
          const originName = route.originCity || route.dep_city || flight.originCity || originCode;
          const destinationName = route.destinationCity || route.arr_city || flight.destinationCity || destinationCode;

          selectedFlight.value.routeOrigin = originName;
          selectedFlight.value.routeDest = destinationName;
          selectedFlight.value.route = `${originName} → ${destinationName}`;
          selectedFlight.value.dep_actual = route.dep_actual || route.dep_time || selectedFlight.value.dep_actual || 'N/A';
          selectedFlight.value.arr_actual = route.arr_actual || route.arr_estimated || route.arr_time || selectedFlight.value.arr_actual || 'N/A';
          selectedFlight.value.arr_estimated = route.arr_estimated || route.arr_actual || route.arr_time || selectedFlight.value.arr_estimated || null;
          selectedFlight.value.dep_delayed = route.dep_delayed ?? selectedFlight.value.dep_delayed ?? null;
          selectedFlight.value.arr_delayed = route.arr_delayed ?? selectedFlight.value.arr_delayed ?? null;
          selectedFlight.value.duration_minutes = route.duration_minutes ?? route.duration ?? selectedFlight.value.duration_minutes ?? null;

          // Only draw trajectory if we have valid coords
          if (route.originCoords && route.destCoords) {
            drawAirportRoute(route, flight);
          } else {
            drawFallbackRoute(flight);
          }
        } else {
          selectedFlight.value.route = 'Not in public DB';
          drawFallbackRoute(flight);
        }
      } catch (err) {
        console.error('Data fetch error:', err);
      }
    };
    // CRITICAL: Return everything the HTML template needs
    // At the bottom of your setup()
    return {
      airlines,
      selectedIata,
      fetchLiveFlights,
      isDrawerOpen,
      selectedFlight,
      closeDrawer,
      flightCount,
      openFlightDetails,
      formatClockTime,
      formatFlightDuration,
      formatRemainingArrivalTime,
      formatDelayValue,
      hasAnyDelay,
      isArrivalNextDay,
      getAirlineTailUrl
    };
  }
}