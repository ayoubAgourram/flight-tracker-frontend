<template>
  <Transition name="page-handoff">
    <LandingPage v-if="showLanding" @start="startTracking" />
    <FlightTracker v-else />
  </Transition>
</template>

<script setup>
import { ref } from 'vue'
import LandingPage from './LandingPage.vue'
import FlightTracker from './FlightTracker.vue'

const showLanding = ref(true)

const startTracking = () => {
  showLanding.value = false
}
</script>

<style>
/* A tiny bit of global CSS to remove default browser margins 
   so your map touches the absolute edges of the screen */
body {
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.page-handoff-enter-active {
  position: relative;
  z-index: 1;
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