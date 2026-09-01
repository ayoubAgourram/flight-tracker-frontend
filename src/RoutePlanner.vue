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

      <div class="route-form">
        <label for="route-origin">Departure airport</label>
        <input id="route-origin" :value="originLabel" readonly aria-readonly="true" />

        <label for="route-destination">Arrival airport</label>
        <div class="destination-picker">
          <input
            id="route-destination"
            v-model.trim="destination"
            placeholder="Airport, country, or ALL"
            autocomplete="off"
            role="combobox"
            :aria-expanded="isDestinationMenuOpen"
            aria-controls="transat-destinations"
            :disabled="isLoadingRoutes"
            @focus="openDestinationMenu"
            @input="handleDestinationInput"
            @blur="closeDestinationMenu"
          />
          <div
            v-show="isDestinationMenuOpen"
            id="transat-destinations"
            class="destination-menu"
            role="listbox"
          >
            <button class="destination-option destination-option--all" type="button" @mousedown.prevent="selectAllDestinations">
              ALL - All destinations
            </button>
            <section v-for="group in visibleDestinationAirportGroups" :key="group.country" class="destination-country-group">
              <button class="destination-country-button" type="button" @mousedown.prevent="selectCountry(group)">
                {{ group.country }}
              </button>
              <button
                v-for="airport in group.airports"
                :key="airport.code"
                class="destination-option"
                type="button"
                @mousedown.prevent="selectDestination(airport.code)"
              >
                {{ airport.label }}
              </button>
            </section>
          </div>
        </div>

        <section v-if="hasDestinationSelection" class="trip-explorer" aria-label="Round trip dates">
          <div class="trip-explorer__section">
            <div class="trip-explorer__heading">
              <span>Choose a departure</span>
              <strong v-if="departureDate">{{ formatDate(departureDate) }}</strong>
            </div>
            <p v-if="isDepartureLoading" class="form-message form-message--neutral">Finding available departures...</p>
            <div v-else class="departure-rail" role="listbox" aria-label="Available departure dates">
              <button
                v-for="option in departureDateOptions"
                :key="option.date"
                type="button"
                class="departure-card"
                :class="{ 'is-selected': departureDate === option.date }"
                :aria-selected="departureDate === option.date"
                @click="selectDepartureDate(option.date)"
              >
                <span>{{ option.weekday }}</span>
                <strong>{{ option.day }}</strong>
                <span>{{ option.month }}</span>
              </button>
            </div>
          </div>

          <div v-if="departureDate" class="trip-explorer__section">
            <div class="trip-explorer__heading">
              <span>Pick your return</span>
              <strong v-if="returnDate">{{ formatDate(returnDate) }}</strong>
            </div>
            <div class="duration-filters" aria-label="Trip duration">
              <button type="button" :class="{ 'is-selected': durationFilter === 'flexible' }" @click="setDurationFilter('flexible')">Flexible</button>
              <button type="button" :class="{ 'is-selected': durationFilter === 'escape' }" @click="setDurationFilter('escape')">Quick escape</button>
              <button type="button" :class="{ 'is-selected': durationFilter === 'week' }" @click="setDurationFilter('week')">One week</button>
              <button type="button" :class="{ 'is-selected': durationFilter === 'fortnight' }" @click="setDurationFilter('fortnight')">Two weeks</button>
            </div>
            <p v-if="isReturnLoading" class="form-message form-message--neutral">Finding return options...</p>
            <div v-else class="return-options" aria-label="Available return dates">
              <button
                v-for="option in returnOptions"
                :key="option.date"
                type="button"
                class="return-option"
                :class="{ 'is-selected': returnDate === option.date }"
                @click="selectReturnDate(option.date)"
              >
                <strong>{{ formatDate(option.date) }}</strong>
                <span>{{ option.nights }} nights</span>
              </button>
              <p v-if="returnOptions.length === 0" class="form-message">No return dates match this stay length.</p>
            </div>
          </div>

          <section v-if="returnDate" class="selected-routes" aria-label="Selected round-trip routes">
            <div class="trip-explorer__heading">
              <span>Your round trip</span>
              <strong>{{ formatDate(departureDate) }} to {{ formatDate(returnDate) }}</strong>
            </div>
            <div v-for="route in selectedRoutes" :key="route.destination" class="selected-route">
              <span>{{ route.origin }}</span>
              <span class="selected-route__arrow" aria-hidden="true">→</span>
              <span>{{ route.destination }}</span>
            </div>
            <div v-for="route in selectedRoutes" :key="`return-${route.destination}`" class="selected-route">
              <span>{{ route.destination }}</span>
              <span class="selected-route__arrow" aria-hidden="true">→</span>
              <span>{{ route.origin }}</span>
            </div>
          </section>
        </section>

        <p v-if="isLoadingRoutes" class="form-message form-message--neutral">Loading Air Transat routes...</p>
        <p v-else-if="formMessage" class="form-message" role="alert">{{ formMessage }}</p>
      </div>
    </section>
  </main>
</template>

<script src="./RoutePlannerExplorer.js"></script>

<style scoped src="./RoutePlanner.css"></style>
