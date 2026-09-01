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

      <form class="route-form" @submit.prevent="startTracking">
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
            <button class="destination-option destination-option--all" type="button" @mousedown.prevent="selectDestination('ALL')">
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

        <label for="route-date">Travel date</label>
        <select id="route-date" v-model="travelDate" :disabled="isCalendarLoading || availableTravelDates.length === 0">
          <option value="">Select an available date</option>
          <option v-for="date in availableTravelDates" :key="date" :value="date">{{ formatTravelDate(date) }}</option>
        </select>

        <p v-if="isLoadingRoutes" class="form-message form-message--neutral">Loading Air Transat routes...</p>
        <p v-else-if="isCalendarLoading" class="form-message form-message--neutral">Loading available travel dates...</p>
        <p v-else-if="formMessage" class="form-message" role="alert">{{ formMessage }}</p>
        <button class="route-submit" type="submit" :disabled="isSubmitDisabled">View Air Transat flights</button>
      </form>
    </section>
  </main>
</template>

<script src="./RoutePlanner.js"></script>

<style scoped src="./RoutePlanner.css"></style>
