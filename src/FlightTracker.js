
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

    const selectedIata = ref('TS');
    const BACKEND_URL = 'https://flight-tracker-backend-98vm.onrender.com/api';

    // NEW: Reactive variables for the drawer
    const isDrawerOpen = ref(false);
    const selectedFlight = ref(null);

    let map = null;
    let markerLayer = null;
    let currentTrajectory = null;
    let updateInterval = null;
    let userLocation = null; // NEW: Stores the user's coordinates
    const flightCount = ref(0); // NEW: Tracks the number of planes

    // 2. Lifecycle hooks
    onMounted(() => {
      initMap();
      fetchLiveFlights();
      updateInterval = setInterval(fetchLiveFlights, 300000);
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
      const elegantSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28">
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
      if (currentTrajectory) map.removeLayer(currentTrajectory);

      const activeAirline = airlines.find(a => a.iata === selectedIata.value);
      if (!activeAirline) return;

      try {
        const response = await fetch(`${BACKEND_URL}/flights/${activeAirline.icao}`);
        const flights = await response.json();

        // 2. NEW: Instantly update the Vue counter with the total array length
        flightCount.value = flights.length;

        flights.forEach(flight => {
          const marker = L.marker([flight.lat, flight.lng], { icon: createPlaneIcon(flight.heading) });

          // NEW: Replace Leaflet Popups with standard click events
          marker.on('click', (e) => {
            // Stop click from propagating to the map and instantly closing the drawer
            L.DomEvent.stopPropagation(e);

            // Set initial state
            selectedFlight.value = {
              ...flight,
              makeModel: 'Loading...',
              registration: 'Loading...',
              routeOrigin: 'Loading DB...',
              routeDest: null
            };

            isDrawerOpen.value = true;

            // Fetch asynchronous data
            fetchAirplaneDetails(flight.icao24);
            fetchRoute(flight.callsign, flight.icao24);
            // NEW: Instantly draw the trajectory when the plane is clicked!
            drawTrajectory(flight.icao24, flight.callsign);
          });

          markerLayer.addLayer(marker);
        });
      } catch (error) {
        console.error('Failed to fetch flight data:', error);
      }
    };

    // NEW: Update reactive state instead of document.getElementById
    const fetchAirplaneDetails = async (icao24) => {
      try {
        const res = await fetch(`${BACKEND_URL}/aircraft/${icao24}`);
        const data = await res.json();
        if (selectedFlight.value && selectedFlight.value.icao24 === icao24) {
          selectedFlight.value.makeModel = `${data.make} ${data.model}`;
          selectedFlight.value.registration = data.registration;
        }
      } catch (err) {
        if (selectedFlight.value && selectedFlight.value.icao24 === icao24) {
          selectedFlight.value.makeModel = 'Data Unavailable';
          selectedFlight.value.registration = 'Data Unavailable';
        }
      }
    };

    // NEW: Update reactive state instead of document.getElementById
    const fetchRoute = async (callsign, icao24) => {
      try {
        const res = await fetch(`${BACKEND_URL}/route/${callsign}`);
        if (res.ok) {
          const data = await res.json();
          if (selectedFlight.value && selectedFlight.value.icao24 === icao24) {
            selectedFlight.value.routeOrigin = data.origin;
            selectedFlight.value.routeDest = data.destination;
          }
        } else {
          if (selectedFlight.value && selectedFlight.value.icao24 === icao24) {
            selectedFlight.value.routeOrigin = 'Not in public DB';
          }
        }
      } catch (err) {
        if (selectedFlight.value && selectedFlight.value.icao24 === icao24) {
          selectedFlight.value.routeOrigin = 'Not in public DB';
        }
      }
    };

    const drawTrajectory = async (icao24, callsign) => {
      if (currentTrajectory) map.removeLayer(currentTrajectory);

      const trajectoryBtn = document.getElementById(`btn-${icao24}`);

      try {
        if (trajectoryBtn) {
          trajectoryBtn.innerText = 'Tracing...';
          trajectoryBtn.style.opacity = '0.7';
        }

        const response = await fetch(`${BACKEND_URL}/route/${callsign}`);
        if (!response.ok) throw new Error('Route not found');
        const data = await response.json();

        if (!data.originCoords || !data.destCoords) {
          throw new Error('Coordinates missing');
        }

        currentTrajectory = L.polyline([data.originCoords, data.destCoords], {
          color: '#e74c3c', weight: 3, dashArray: '5, 10', opacity: 0.8
        }).addTo(map);

        map.fitBounds(currentTrajectory.getBounds(), { padding: [50, 50] });

        if (trajectoryBtn) {
          trajectoryBtn.innerText = '✓ Trajectory Drawn';
          trajectoryBtn.style.backgroundColor = '#10b981';
          trajectoryBtn.style.opacity = '1';
        }
      } catch (error) {
        if (trajectoryBtn) {
          trajectoryBtn.classList.add('error-shake');
          trajectoryBtn.innerText = '☁️ Route Unknown';
          trajectoryBtn.style.backgroundColor = '#64748b';
          trajectoryBtn.style.cursor = 'not-allowed';
          trajectoryBtn.style.opacity = '1';
          trajectoryBtn.disabled = true;
          setTimeout(() => trajectoryBtn.classList.remove('error-shake'), 500);
        }
      }
    };

    // NEW: Function to slide the drawer out of view
    const closeDrawer = () => {
      isDrawerOpen.value = false;
    };

    // CRITICAL: Return everything the HTML template needs
    return {
      airlines,
      selectedIata,
      fetchLiveFlights,
      isDrawerOpen,
      selectedFlight,
      closeDrawer,
      drawTrajectory,
      flightCount
    };
  }
} 