import { ref, onMounted, onBeforeUnmount, effect } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default {
  setup() {
    // 1. All your variables
    const airlines = [
      { iata: 'TS', icao: 'TSC', name: 'Air Transat' },
      { iata: 'AC', icao: 'ACA', name: 'Air Canada' },
      { iata: 'QR', icao: 'QTR', name: 'Qatar Airways' },
      { iata: 'RX', icao: 'RXI', name: 'Riyadh Air' },
      { iata: 'AA', icao: 'AAL', name: 'American Airlines' },
      { iata: 'AF', icao: 'AFR', name: 'Air France' },
      { iata: 'BA', icao: 'BAW', name: 'British Airways' },
      { iata: 'DL', icao: 'DAL', name: 'Delta Air Lines' },
      { iata: 'UA', icao: 'UAL', name: 'United Airlines' }
    ];

    const closeDrawer = () => {
      isDrawerOpen.value = false;
      // Cleanup the trajectory line when the user closes the drawer
      if (currentTrajectory) {
        map.removeLayer(currentTrajectory);
        currentTrajectory = null;
      }
    };
    const selectedIata = ref('TS');
    const BACKEND_URL = 'https://flight-tracker-backend-98vm.onrender.com/api';
    //const BACKEND_URL = 'http://localhost:3000/api';

    // NEW: Reactive variables for the drawer
    const isDrawerOpen = ref(false);
    const selectedFlight = ref(null);

    let map = null;
    let markerLayer = null;
    let currentTrajectory = null;
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

    const createPlaneIcon = (heading) => {
      // A clean, symmetric, top-down vector graphic of a commercial airliner
      const elegantSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28">
      <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" 
            fill="#ffffff" 
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

    const fetchLiveFlights = async () => {
      markerLayer.clearLayers();
      const airline = airlines.find(a => a.iata === selectedIata.value);
      if (!airline) return;

      try {
        const res = await fetch(`${BACKEND_URL}/flights/${airline.icao}`);
        const flights = await res.json();
        flightCount.value = flights.length;

        flights.forEach(f => {
          const marker = L.marker([f.lat, f.lng], { icon: createPlaneIcon(f.heading) });

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
        makeModel: 'Loading...',
        registration: 'Loading...',
        route: 'Loading...'
      };
      isDrawerOpen.value = true;
      if (currentTrajectory) map.removeLayer(currentTrajectory);

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
          console.log(`Route data for ${flight.callsign}:`, route);
          selectedFlight.value.route = `${route.origin} → ${route.destination}`;

          // Only draw trajectory if we have valid coords
          if (route.originCoords && route.destCoords) {
            currentTrajectory = L.polyline([route.originCoords, route.destCoords], {
              color: '#e74c3c', weight: 3, dashArray: '5, 10'
            }).addTo(map);
            map.fitBounds(currentTrajectory.getBounds(), { padding: [50, 50] });
          }
        } else {
          selectedFlight.value.route = 'Not in public DB';
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
      openFlightDetails // Expose this one instead of the old ones
    };
  }
}