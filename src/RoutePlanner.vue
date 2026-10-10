<template>
  <main class="route-planner">
    <section class="route-planner__content" aria-labelledby="planner-title">
      <div class="route-form">
        <header class="planner-results__header">
          <div class="planner-results__intro">
            <span class="planner-results__eyebrow">Your trip ideas</span>
            <h1 id="planner-title">{{ tripTitle }}</h1>
            <p class="planner-results__summary">{{ tripSummary }}</p>
          </div>
          <button class="planner-edit-search" type="button" :aria-expanded="isEditingSearch" @click="isEditingSearch = !isEditingSearch">
            <span aria-hidden="true">↗</span> {{ isEditingSearch ? 'Close edit' : 'Edit search' }}
          </button>
        </header>

        <section v-if="isEditingSearch" class="planner-edit-panel" aria-label="Edit trip search">
          <section class="destination-search" aria-labelledby="destination-search-title">
            <div class="destination-search__heading">
              <label id="destination-search-title" for="natural-language-destination">Search by travel idea</label>
              <span>Try “beach for 4 days”</span>
            </div>
            <input
              id="natural-language-destination"
              v-model.trim="naturalLanguageQuery"
              placeholder="What kind of trip are you imagining?"
              autocomplete="off"
              :disabled="isLoadingRoutes"
              @input="handleNaturalLanguageInput"
            />
            <div v-if="naturalLanguageSuggestions.length" class="destination-suggestions" aria-label="Suggested destinations">
              <button
                v-for="suggestion in naturalLanguageSuggestions"
                :key="suggestion.group.country"
                type="button"
                class="destination-suggestion"
                @click="selectNaturalLanguageSuggestion(suggestion)"
              >
                <strong>{{ suggestion.group.country }}</strong>
                <span>{{ suggestion.metadata.description }}</span>
              </button>
            </div>
            <p v-else-if="naturalLanguageQuery && !suppressSuggestions" class="form-message">No matching destinations are available from Montreal.</p>
          </section>

          <div class="planner-field">
            <label for="route-origin">Departure airport</label>
            <input id="route-origin" :value="originLabel" readonly aria-readonly="true" />
          </div>

          <div class="planner-field">
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
              <div v-show="isDestinationMenuOpen" id="transat-destinations" class="destination-menu" role="listbox">
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
          </div>
        </section>

        <p v-if="isLoadingRoutes" class="form-message form-message--neutral">Finding destinations that match your trip...</p>
        <p v-else-if="formMessage" class="form-message" role="alert">{{ formMessage }}</p>

        <nav class="planner-result-filters" aria-label="Sort destination results">
          <button type="button" :class="{ 'is-selected': activeResultFilter === 'recommended' }" @click="activeResultFilter = 'recommended'">Recommended</button>
          <button type="button" :class="{ 'is-selected': activeResultFilter === 'lowest-price' }" disabled title="Fare data is not available">Lowest price</button>
          <button type="button" :class="{ 'is-selected': activeResultFilter === 'direct' }" @click="activeResultFilter = 'direct'">Direct flights</button>
          <button type="button" :class="{ 'is-selected': activeResultFilter === 'warmest' }" disabled title="Weather data is not available">Warmest weather</button>
        </nav>

        <section class="planner-destinations" aria-label="Matching destinations">
          <div v-if="visibleDestinationResults.length" class="planner-destinations__grid">
            <article v-for="(result, index) in visibleDestinationResults" :key="result.code" class="planner-destination-card">
              <div class="planner-destination-card__image-wrap">
                <img :src="result.image" :alt="`${result.city}, ${result.country}`" class="planner-destination-card__image" />
                <span v-if="index === 0" class="planner-destination-card__badge">Recommended</span>
                <button
                  class="planner-destination-card__favorite"
                  type="button"
                  :aria-label="favoriteDestinationCodes.includes(result.code) ? `Remove ${result.city} from saved trips` : `Save ${result.city}`"
                  :aria-pressed="favoriteDestinationCodes.includes(result.code)"
                  @click="toggleFavorite(result.code)"
                >{{ favoriteDestinationCodes.includes(result.code) ? '♥' : '♡' }}</button>
                <div class="planner-destination-card__location">
                  <strong>{{ result.city }}</strong>
                  <span>{{ result.country }}</span>
                </div>
              </div>
              <div class="planner-destination-card__details">
                <span class="planner-destination-card__route"><span aria-hidden="true">✈</span> Direct Air Transat route</span>
                <span class="planner-destination-card__code">{{ result.code }} · Round trip</span>
                <button type="button" class="planner-destination-card__action" @click="selectResultDestination(result)">
                  {{ selectedDestinationCodes?.length === 1 && selectedDestinationCodes.includes(result.code) ? 'Change dates' : 'View dates' }}
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </article>
          </div>
          <p v-else-if="!isLoadingRoutes" class="planner-empty-state">No destinations match this trip yet. Edit your search or choose an airport.</p>
        </section>

        <div v-if="isDatePanelOpen && hasDestinationSelection" class="date-panel-backdrop" @click.self="closeDatePanel">
          <section ref="datePanel" class="date-panel" role="dialog" aria-modal="true" aria-labelledby="date-panel-title" tabindex="-1" @keydown.esc.stop.prevent="closeDatePanel">
            <header v-if="!showFlightOptions" class="date-panel__header">
              <div>
                <span class="date-panel__eyebrow">Choose your trip dates</span>
                <h2 id="date-panel-title">{{ selectedDestinationAirport?.city || destination }}</h2>
                <p>{{ selectedDestinationAirport?.country }} · Round trip from Montréal</p>
              </div>
              <button class="date-panel__close" type="button" aria-label="Close date selection" @click="closeDatePanel">×</button>
            </header>
            <header v-else class="trip-review__header">
              <button type="button" class="trip-review__back" aria-label="Back to date selection" @click="showFlightOptions = false">‹</button>
              <h2 id="date-panel-title">Review your trip</h2>
              <button type="button" class="trip-review__edit" @click="showFlightOptions = false">Edit</button>
            </header>

            <div v-if="!showFlightOptions" ref="datePanelBody" class="date-panel__body">
              <section class="date-panel__section" aria-labelledby="departure-heading">
                <div class="date-panel__section-heading">
                  <span class="date-panel__step">1</span>
                  <div>
                    <h3 id="departure-heading">Departure</h3>
                    <p v-if="departureDate">{{ formatDate(departureDate) }}</p>
                    <p v-else>Choose an available day</p>
                  </div>
                </div>
                <p v-if="isDepartureLoading" class="form-message form-message--neutral">Finding available departures...</p>
                <div v-else ref="departureRail" class="departure-rail" role="listbox" aria-label="Available departure dates">
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
                  <p v-if="!departureDateOptions.length && !isDepartureLoading" class="form-message">No departure dates match this trip.</p>
                </div>
              </section>

              <section class="date-panel__section" aria-labelledby="duration-heading">
                <div class="date-panel__section-heading">
                  <span class="date-panel__step">2</span>
                  <div>
                    <h3 id="duration-heading">Trip length</h3>
                    <p>Select a stay duration</p>
                  </div>
                </div>
                <div class="duration-filters" aria-label="Trip duration">
                  <button type="button" :class="{ 'is-selected': durationFilter === 'escape' }" @click="setDurationFilter('escape')">2–4 nights</button>
                  <button type="button" :class="{ 'is-selected': durationFilter === 'week' }" @click="setDurationFilter('week')">1 week</button>
                  <button type="button" :class="{ 'is-selected': durationFilter === 'fortnight' }" @click="setDurationFilter('fortnight')">2 weeks</button>
                  <button type="button" :class="{ 'is-selected': durationFilter === 'flexible' }" @click="setDurationFilter('flexible')">Flexible</button>
                </div>
              </section>

              <section v-if="departureDate" class="date-panel__section" aria-labelledby="return-heading">
                <div class="date-panel__section-heading">
                  <span class="date-panel__step">3</span>
                  <div>
                    <h3 id="return-heading">Return</h3>
                    <p v-if="returnDate">{{ formatDate(returnDate) }} · {{ getNights(departureDate, returnDate) }} nights</p>
                    <p v-else>Choose a matching return date</p>
                  </div>
                </div>
                <p v-if="isReturnLoading" class="form-message form-message--neutral">Finding return options...</p>
                <div v-else class="return-options" aria-label="Available return dates">
                  <button
                    v-for="option in returnOptions"
                    :key="option.date"
                    type="button"
                    class="return-option"
                    :class="{ 'is-selected': returnDate === option.date }"
                    :aria-pressed="returnDate === option.date"
                    @click="selectReturnDate(option.date)"
                  >
                    <strong>{{ formatDate(departureDate) }} → {{ formatDate(option.date) }}</strong>
                    <span>{{ option.nights }} nights</span>
                  </button>
                  <p v-if="returnOptions.length === 0" class="form-message">No returns match this stay length. Try Flexible.</p>
                </div>
              </section>

            </div>

            <div v-else ref="datePanelBody" class="date-panel__body trip-review__body">
              <section class="trip-review__destination" aria-label="Selected destination">
                <img :src="selectedDestinationResult?.image" :alt="selectedDestinationResult ? `${selectedDestinationResult.city}, ${selectedDestinationResult.country}` : ''" />
                <div>
                  <strong>{{ selectedDestinationResult?.city || destination }}</strong>
                  <span>{{ selectedDestinationResult?.country }}</span>
                </div>
              </section>

              <div class="trip-review__summary">
                <strong>{{ formatReviewDate(departureDate) }} – {{ formatReviewDate(returnDate) }}</strong>
                <span>{{ travelerCount }} {{ travelerCount === 1 ? 'traveller' : 'travellers' }}</span>
              </div>

              <section class="trip-review__flights" aria-labelledby="review-flights-title">
                <h3 id="review-flights-title">Flights</h3>
                <p v-if="isFlightScheduleLoading" class="form-message form-message--neutral">Finding nonstop flights...</p>
                <p v-else-if="flightScheduleError" class="form-message" role="alert">{{ flightScheduleError }}</p>
                <template v-else-if="reviewSchedule?.outbound?.length && reviewSchedule?.inbound?.length">
                  <article v-for="flight in reviewSchedule.outbound" :key="`outbound-${flight.flightNumber}`" class="trip-review__leg">
                    <header>
                      <strong>Outbound</strong>
                      <time>{{ formatReviewDate(departureDate) }}</time>
                    </header>
                    <div class="trip-review__timeline">
                      <span class="trip-review__timeline-dot" aria-hidden="true"></span>
                      <div class="trip-review__stops">
                        <div class="trip-review__stop">
                          <time>{{ formatFlightTime(flight.departureDate) }}</time>
                          <strong>{{ flight.departureCode }}</strong>
                        </div>
                        <div class="trip-review__stop">
                          <time>{{ formatFlightTime(flight.arrivalDate) }}</time>
                          <strong>{{ flight.arrivalCode }}</strong>
                        </div>
                      </div>
                      <span class="trip-review__timeline-end" aria-hidden="true"></span>
                    </div>
                    <div class="trip-review__flight-meta">
                      <span><span aria-hidden="true">✈</span> Non-stop · {{ formatFlightDuration(flight.fullDuration) }}</span>
                      <span><span aria-hidden="true">✦</span> Air Transat · TS{{ flight.flightNumber }}</span>
                      <span v-if="flight.aircraftType">Aircraft {{ flight.aircraftType }}</span>
                    </div>
                  </article>

                  <article v-for="flight in reviewSchedule.inbound" :key="`inbound-${flight.flightNumber}`" class="trip-review__leg">
                    <header>
                      <strong>Return</strong>
                      <time>{{ formatReviewDate(returnDate) }}</time>
                    </header>
                    <div class="trip-review__timeline">
                      <span class="trip-review__timeline-dot" aria-hidden="true"></span>
                      <div class="trip-review__stops">
                        <div class="trip-review__stop">
                          <time>{{ formatFlightTime(flight.departureDate) }}</time>
                          <strong>{{ flight.departureCode }}</strong>
                        </div>
                        <div class="trip-review__stop">
                          <time>{{ formatFlightTime(flight.arrivalDate) }}</time>
                          <strong>{{ flight.arrivalCode }}</strong>
                        </div>
                      </div>
                      <span class="trip-review__timeline-end" aria-hidden="true"></span>
                    </div>
                    <div class="trip-review__flight-meta">
                      <span><span aria-hidden="true">✈</span> Non-stop · {{ formatFlightDuration(flight.fullDuration) }}</span>
                      <span><span aria-hidden="true">✦</span> Air Transat · TS{{ flight.flightNumber }}</span>
                      <span v-if="flight.aircraftType">Aircraft {{ flight.aircraftType }}</span>
                    </div>
                  </article>
                </template>
                <p v-else class="form-message form-message--neutral">No nonstop flights were found for these dates. Edit your trip to choose another date.</p>
              </section>

              <section class="trip-review__fare" aria-label="Fare and cabin">
                <img :src="selectedDestinationResult?.image" alt="" />
                <div>
                  <strong>Fare &amp; cabin</strong>
                  <span>Choose your fare on Air Transat</span>
                </div>
                <a v-if="selectedRoutes[0]" :href="buildBookingUrl(selectedRoutes[0])" target="_blank" rel="noopener noreferrer">View fare details</a>
              </section>
            </div>

            <footer class="date-panel__footer">
              <template v-if="!showFlightOptions">
                <div class="date-panel__summary" aria-live="polite">
                <span>{{ DEFAULT_ORIGIN }} → {{ selectedDestinationAirport?.city || destination }}</span>
                <strong>{{ selectedTripSummary }}</strong>
                </div>
                <button type="button" class="date-panel__submit" :disabled="!canViewFlights" @click="viewFlightOptions">View flights</button>
              </template>
              <a v-else-if="selectedRoutes[0]" class="date-panel__submit" :href="buildBookingUrl(selectedRoutes[0])" target="_blank" rel="noopener noreferrer">Continue to booking <span aria-hidden="true">→</span></a>
            </footer>
          </section>
        </div>
      </div>
    </section>
  </main>
</template>

<script src="./RoutePlannerExplorer.js"></script>

<style scoped src="./RoutePlanner.css"></style>
