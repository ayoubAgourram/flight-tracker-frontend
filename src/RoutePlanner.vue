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
        <input
          id="route-destination"
          v-model.trim="destination"
          list="transat-destinations"
          maxlength="3"
          placeholder="CDG"
          autocomplete="off"
          :disabled="isLoadingRoutes"
          @input="handleDestinationInput"
        />
        <datalist id="transat-destinations">
          <option value="ALL" label="All destinations" />
          <optgroup v-for="group in destinationAirportGroups" :key="group.country" :label="group.country">
            <option v-for="airport in group.airports" :key="airport.code" :value="airport.code" :label="airport.label" />
          </optgroup>
        </datalist>

        <label for="route-date">Travel date</label>
        <input id="route-date" v-model="travelDate" type="date" :min="today" />

        <p v-if="isLoadingRoutes" class="form-message form-message--neutral">Loading Air Transat routes...</p>
        <p v-else-if="formMessage" class="form-message" role="alert">{{ formMessage }}</p>
        <button class="route-submit" type="submit" :disabled="isSubmitDisabled">View Air Transat flights</button>
      </form>
    </section>
  </main>
</template>

<script src="./RoutePlanner.js"></script>

<style scoped src="./RoutePlanner.css"></style>
