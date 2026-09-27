<template>
  <Transition name="page-handoff">
    <LandingPage v-if="currentView === 'landing'" @start="startTracking" @plan-route="openRoutePlanner" />
    <RoutePlanner v-else-if="currentView === 'planner'" @back="showLanding" @track="startTracking" />
    <FlightTracker v-else :route-plan="routePlan" />
  </Transition>

  <nav class="travel-home__nav" aria-label="Main navigation">
    <button :class="{ 'is-active': currentView === 'landing' }" type="button" @click="showLanding"><span aria-hidden="true">⌂</span><strong>Home</strong></button>
    <button :class="{ 'is-active': currentView === 'planner' }" type="button" @click="openRoutePlanner"><span aria-hidden="true">✈</span><strong>Plan</strong></button>
    <button :class="{ 'is-active': currentView === 'tracker' }" type="button" @click="showTracker"><span aria-hidden="true">◎</span><strong>Track</strong></button>
    <button type="button" @click="openRoutePlanner"><span aria-hidden="true">Ex</span><strong>Explore</strong></button>
  </nav>
</template>

<script setup>
import { ref } from 'vue'
import LandingPage from './LandingPage.vue'
import FlightTracker from './FlightTracker.vue'
import RoutePlanner from './RoutePlanner.vue'

const currentView = ref('landing')
const routePlan = ref(null)

const startTracking = (plan = null) => {
  routePlan.value = plan
  currentView.value = 'tracker'
}

const showTracker = () => {
  currentView.value = 'tracker'
}

const openRoutePlanner = () => {
  currentView.value = 'planner'
}

const showLanding = () => {
  currentView.value = 'landing'
}
</script>

<style>
/* A tiny bit of global CSS to remove default browser margins 
   so your map touches the absolute edges of the screen */
body {
  margin: 0;
  padding: 0;
  overflow-x: hidden;
}

html,
body,
#app {
  width: 100%;
  min-height: 100%;
}

.page-handoff-enter-active {
  position: relative;
  z-index: 1;
}

.travel-home__nav {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 10;
  display: flex;
  justify-content: space-around;
  padding: 0.55rem 0.3rem calc(0.55rem + env(safe-area-inset-bottom));
  background: #fbfbfc;
  box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.12);
}

.travel-home__nav button {
  display: grid;
  min-width: 44px;
  gap: 0.2rem;
  justify-items: center;
  border: 0;
  padding: 0.15rem;
  background: transparent;
  color: #002855;
  font: 700 0.65rem/1 system-ui, sans-serif;
  cursor: pointer;
}

.travel-home__nav button span { font-size: 1.4rem; line-height: 1; }
.travel-home__nav button.is-active { color: #005eba; }

@media (max-width: 360px) {
  .travel-home__nav button { min-width: 42px; font-size: 0.62rem; }
}

.page-handoff-leave-active {
  position: fixed;
  inset: 0;
  z-index: 2;
  transition: transform 2.1s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform;
}

.page-handoff-leave-to {
  transform: translateY(-100%);
}

@media (prefers-reduced-motion: reduce) {
  .page-handoff-leave-active {
    transition-duration: 0.01ms;
  }
}
</style>