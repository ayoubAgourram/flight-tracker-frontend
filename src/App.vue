<template>
  <header class="travel-home__header">
    <button type="button" class="brand-mark" aria-label="Go to landing page" @click="showLanding">
      <span class="brand-mark__icon" aria-hidden="true">✈</span>
    </button>

    <nav class="travel-home__header-nav" :class="{ 'is-open': isMenuOpen }" aria-label="Primary navigation">
      <button type="button" :class="{ 'is-active': activeTab === 'plan' }" @click="handleNavClick(openRoutePlanner)">Plan</button>
      <button type="button" :class="{ 'is-active': activeTab === 'destinations' }" @click="handleNavClick(showDestinations)">Destinations</button>
      <button type="button" :class="{ 'is-active': activeTab === 'tracker' }" @click="handleNavClick(startTracking)">Flying with us</button>
    </nav>

    <div class="travel-home__header-tools" aria-label="Account and language controls">
      <button type="button" class="tool-search" aria-label="Search">⌕</button>
      <button type="button" class="tool-button">CA | EN ▾</button>
      <button type="button" class="sign-in">Sign in</button>
      <button type="button" class="mobile-menu-toggle" aria-label="Toggle menu" :class="{ 'is-open': isMenuOpen }" @click="toggleMenu">
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>
  </header>

  <Transition name="page-handoff" mode="out-in">
    <LandingPage
      v-if="currentView === 'landing'"
      key="landing"
      @start="startTracking"
      @plan-route="openRoutePlanner"
      @show-destinations="showDestinations"
    />
    <Destinations
      v-else-if="currentView === 'destinations'"
      key="destinations"
      @back="showLanding"
      @plan-route="openRoutePlanner"
    />
    <RoutePlanner
      v-else-if="currentView === 'planner'"
      key="planner"
      :initial-destination-code="plannerSelection.code"
      :initial-destination-image="plannerSelection.image"
      :initial-search-query="plannerSelection.query"
      @back="showLanding"
      @track="startTracking"
    />
    <FlightTracker
      v-else
      key="tracker"
      :route-plan="routePlan"
      @home="showLanding"
    />
  </Transition>
</template>

<script setup>
import { computed, ref } from 'vue'
import LandingPage from './LandingPage.vue'
import Destinations from './Destinations.vue'
import FlightTracker from './FlightTracker.vue'
import RoutePlanner from './RoutePlanner.vue'

const currentView = ref('landing')
const routePlan = ref(null)
const plannerSelection = ref({ code: '', image: '', query: '' })
const isMenuOpen = ref(false)
const activeTab = computed(() => {
  if (currentView.value === 'destinations') return 'destinations'
  if (currentView.value === 'planner') return 'plan'
  if (currentView.value === 'tracker') return 'tracker'
  return ''
})

const startTracking = (plan = null) => {
  routePlan.value = plan
  currentView.value = 'tracker'
}

const showTracker = () => {
  currentView.value = 'tracker'
}

const openRoutePlanner = (selection) => {
  plannerSelection.value = typeof selection === 'string'
    ? { code: selection, image: '', query: '' }
    : { code: selection?.code || '', image: selection?.image || '', query: selection?.query || '' }
  currentView.value = 'planner'
}

const showLanding = () => {
  currentView.value = 'landing'
  isMenuOpen.value = false
}

const showDestinations = () => {
  currentView.value = 'destinations'
  isMenuOpen.value = false
}

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const handleNavClick = (action) => {
  action()
  isMenuOpen.value = false
}
</script>

<style>
/* A tiny bit of global CSS to remove default browser margins 
   so your map touches the absolute edges of the screen */
body {
  margin: 0;
  padding: 0;
  overflow-x: hidden;
  background: #f4f7fa;
}

html,
body,
#app {
  width: 100%;
  min-height: 100%;
}

.travel-home__header {
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  height: 50px;
  padding: 0 1.5rem;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(19, 64, 116, 0.08);
}

.brand-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  min-width: 0;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.brand-mark__icon {
  display: inline-grid;
  place-items: center;
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 50%;
  background: linear-gradient(135deg, #1ca4ff, #0f58d9);
  color: #fff;
  font-size: 1.05rem;
  box-shadow: 0 8px 18px rgba(24, 98, 223, 0.28);
}

.brand-mark__word {
  color: rgb(0, 40, 85);
  font-size: clamp(1.1rem, 1.8vw, 2rem);
  font-weight: 800;
  letter-spacing: -0.06em;
  line-height: 1;
}

.brand-mark__word span {
  font-weight: 700;
}

.travel-home__header-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 0.9rem;
  min-width: 0;
}

.travel-home__header-nav button,
.travel-home__header-tools button {
  border: 0;
  background: transparent;
  color: rgb(0, 40, 85);
  font: 600 0.86rem/1.2 system-ui, sans-serif;
  cursor: pointer;
}

.travel-home__header-nav button {
  padding: 0.55rem 0.45rem;
  white-space: nowrap;
}

.travel-home__header-nav button.is-active {
  text-decoration: underline;
  text-underline-offset: 0.3rem;
  text-decoration-thickness: 2px;
}

.travel-home__header-tools {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.mobile-menu-toggle {
  display: none;
  position: relative;
  width: 2.9rem;
  height: 2.9rem;
  padding: 0.6rem 0.55rem;
  border: 1px solid rgba(0, 40, 85, 0.1);
  border-radius: 0.8rem;
  background: rgba(17, 95, 181, 0.05);
  cursor: pointer;
}

.mobile-menu-toggle span {
  position: absolute;
  left: 0.6rem;
  width: calc(100% - 1.2rem);
  height: 2px;
  border-radius: 999px;
  background: rgb(0, 40, 85);
  transition: transform 0.25s ease, opacity 0.25s ease;
}

.mobile-menu-toggle span:nth-child(1) { top: 0.8rem; }
.mobile-menu-toggle span:nth-child(2) { top: 1.35rem; }
.mobile-menu-toggle span:nth-child(3) { top: 1.9rem; }

.mobile-menu-toggle.is-open span:nth-child(1) {
  transform: translateY(0.55rem) rotate(45deg);
}

.mobile-menu-toggle.is-open span:nth-child(2) {
  opacity: 0;
}

.mobile-menu-toggle.is-open span:nth-child(3) {
  transform: translateY(-0.55rem) rotate(-45deg);
}

.tool-search {
  display: inline-grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: rgba(19, 68, 134, 0.08);
}

.tool-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 4.2rem;
  padding: 0.55rem 0.8rem;
  border-radius: 999px;
  background: rgba(19, 68, 134, 0.06);
}

.sign-in {
  padding: 0.65rem 1rem;
  border-radius: 999px;
  background: rgba(17, 95, 181, 0.08);
  color: rgb(0, 40, 85);
  font-weight: 700;
}

.page-handoff-enter-active,
.page-handoff-leave-active {
  position: relative;
  transition:
    opacity 0.45s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform, opacity;
}

.page-handoff-enter-from,
.page-handoff-leave-to {
  opacity: 0;
  transform: translateY(18px) scale(0.985);
}

.page-handoff-enter-to,
.page-handoff-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}

@media (max-width: 760px) {
  .travel-home__header {
    padding: 0 0.9rem;
  }

  .travel-home__header-nav {
    position: absolute;
    top: calc(100% + 0.5rem);
    right: 0.9rem;
    left: 0.9rem;
    z-index: 25;
    display: none;
    flex-direction: column;
    align-items: stretch;
    gap: 0.35rem;
    padding: 0.8rem;
    border: 1px solid rgba(0, 40, 85, 0.08);
    border-radius: 1rem;
    background: rgba(255, 255, 255, 0.97);
    box-shadow: 0 18px 40px rgba(11, 29, 52, 0.12);
  }

  .travel-home__header-nav.is-open {
    display: flex;
  }

  .travel-home__header-nav button {
    width: 100%;
    padding: 0.8rem 0.9rem;
    border-radius: 0.75rem;
    text-align: left;
  }

  .travel-home__header-nav button.is-active {
    background: rgba(17, 95, 181, 0.06);
    text-decoration: none;
  }

  .travel-home__header-tools .tool-button,
  .travel-home__header-tools .sign-in,
  .travel-home__header-tools .tool-search {
    display: none;
  }

  .mobile-menu-toggle {
    display: block;
  }
}

@media (prefers-reduced-motion: reduce) {
  .page-handoff-enter-active,
  .page-handoff-leave-active {
    transition-duration: 0.01ms;
  }
}
</style>