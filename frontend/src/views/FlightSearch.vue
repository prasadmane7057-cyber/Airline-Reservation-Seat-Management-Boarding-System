<template>
  <div class="search-page page-wrapper">
    <div class="container">
      <div class="search-bar-card card">
        <form @submit.prevent="executeSearch" class="search-bar-grid">
          <div class="form-group mb-0">
            <label class="form-label" for="destination-filter">Destination</label>
            <input id="destination-filter" v-model.trim="filters.to" class="form-input" placeholder="Exact destination (optional)" />
          </div>

          <div class="form-group mb-0">
            <label class="form-label" for="status-filter">Status</label>
            <input id="status-filter" v-model.trim="filters.status" class="form-input" placeholder="Exact status (optional)" />
          </div>

          <div class="search-action-cell">
            <button type="submit" class="btn btn-primary btn-full search-action-btn">Search Flights</button>
          </div>
        </form>
      </div>

      <div class="results-layout">
        <aside class="filter-sidebar card">
          <h3 class="sidebar-title">Academic base fares</h3>
          <p>These project rates are not flight-specific and are not a payment quote.</p>
          <label class="form-label" for="travel-class">Travel class</label>
          <select id="travel-class" v-model="filters.travelClass" class="form-select">
            <option value="Economy">Economy — ₹5,000</option>
            <option value="Business">Business — ₹10,000</option>
            <option value="First Class">First Class — ₹20,000</option>
          </select>
          <p class="mt-16">Schedule, origin, aircraft, and availability are not present in the current flight schema.</p>
        </aside>

        <section class="results-content">
          <div v-if="flightStore.error" class="empty-state card" role="alert">
            <h3>Could not load flights</h3>
            <p>{{ flightStore.error }}</p>
            <button @click="executeSearch" class="btn btn-outline btn-sm mt-16">Retry</button>
          </div>

          <div class="results-header">
            <h2 class="results-count">
              Available Flights 
              <span class="count-tag">({{ flights.length }})</span>
            </h2>
          </div>

          <div v-if="flightStore.loading" class="loading-state card">
            <div class="spinner"></div>
            <p>Loading flight records...</p>
          </div>

          <div v-else-if="flights.length === 0 && !flightStore.error" class="empty-state card">
            <div class="empty-icon">✈️</div>
            <h3>No flights found matching your criteria</h3>
            <p>Try changing the destination or status filter.</p>
            <button @click="resetFilters" class="btn btn-outline btn-sm mt-16">Reset Filters</button>
          </div>

          <div v-else class="flight-cards-list">
            <div class="flight-card card" v-for="flight in flights" :key="flight.id">
              <div class="flight-card-main">
                <div class="flight-top">
                  <div class="airline-brand">
                    <span class="flight-icon">✈</span>
                    <div>
                      <span class="flight-no">{{ flight.flight_number }}</span>
                      <span class="aircraft-name">Flight ID: {{ flight.id }}</span>
                    </div>
                  </div>
                  <span class="badge" :class="'badge-' + String(flight.status || 'unknown').toLowerCase()">
                    {{ flight.status || 'Unknown status' }}
                  </span>
                </div>

                <div class="flight-schedule">
                  <div class="time-block">
                    <div class="time-val">Destination</div>
                    <div class="airport-code">{{ flight.destination }}</div>
                  </div>

                  <div class="duration-path">
                    <div class="flight-line">
                      <span class="line-dot start"></span>
                      <span class="line-plane">✈</span>
                      <span class="line-dot end"></span>
                    </div>
                    <span class="stop-text">No schedule data</span>
                  </div>

                  <div class="time-block right-align">
                    <div class="time-val">Status</div>
                    <div class="airport-code">{{ flight.status || 'Unknown' }}</div>
                  </div>
                </div>

                <div class="flight-sub-info">
                  <span class="date-chip">No departure date in current schema</span>
                  <span class="seats-chip">Seat inventory must be configured separately</span>
                </div>
              </div>

              <div class="flight-card-action">
                <p>Academic base fare: {{ selectedFare }}</p>
                <button @click="selectFlight(flight)" class="btn btn-gold btn-full select-btn">View Flight ➔</button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useFlightStore } from '../stores/flightStore';
import { useBookingStore } from '../stores/bookingStore';

const route = useRoute();
const router = useRouter();
const flightStore = useFlightStore();
const bookingStore = useBookingStore();

const filters = ref({
  to: route.query.to || '',
  travelClass: route.query.travelClass || 'Economy',
  status: route.query.status || ''
});

const flights = computed(() => flightStore.flights);
const selectedFare = computed(() => ({
  Economy: '₹5,000 (not charged)',
  Business: '₹10,000 (not charged)',
  'First Class': '₹20,000 (not charged)'
}[filters.value.travelClass]));

onMounted(() => executeSearch());

async function executeSearch() {
  const params = { to: filters.value.to, status: filters.value.status };
  flightStore.setSearchParams(params);
  try {
    await flightStore.searchFlights(params);
  } catch {
    // The store exposes the error in the results area.
  }
}

function resetFilters() {
  filters.value.to = '';
  filters.value.travelClass = 'Economy';
  filters.value.status = '';
  executeSearch();
}

function selectFlight(flight) {
  flightStore.setSelectedFlight(flight);
  bookingStore.initBooking(flight, filters.value.travelClass, 1);
  router.push({
    path: `/flights/${flight.id}`,
    query: { travelClass: filters.value.travelClass }
  });
}
</script>

<style scoped>
.search-bar-card {
  margin-bottom: 32px;
  padding: 20px;
}

.search-bar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
  align-items: flex-end;
}

.mb-0 {
  margin-bottom: 0;
}

.search-action-btn {
  height: 44px;
}

.results-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 28px;
}

.filter-sidebar {
  height: fit-content;
  padding: 24px;
}

.sidebar-title {
  font-size: 1.125rem;
  margin-bottom: 20px;
}

.filter-block {
  margin-bottom: 24px;
}

.filter-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--primary-700);
  margin-bottom: 10px;
}

.range-slider {
  width: 100%;
  accent-color: var(--brand-blue);
  cursor: pointer;
}

.range-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 4px;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  color: var(--primary-800);
  cursor: pointer;
}

.results-header {
  margin-bottom: 16px;
}

.results-count {
  font-size: 1.375rem;
}

.count-tag {
  color: var(--brand-blue);
  font-weight: 800;
}

.flight-cards-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.flight-card {
  padding: 0;
  display: grid;
  grid-template-columns: 1fr 260px;
  overflow: hidden;
}

.flight-card-main {
  padding: 24px;
  border-right: 1px solid var(--border-color);
}

.flight-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.airline-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.flight-icon {
  width: 36px;
  height: 36px;
  background: var(--brand-sky-soft);
  color: var(--brand-blue);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.125rem;
}

.flight-no {
  font-weight: 800;
  color: var(--primary-900);
  font-size: 1.0625rem;
  display: block;
}

.aircraft-name {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.flight-schedule {
  display: grid;
  grid-template-columns: 1fr 1.5fr 1fr;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.time-val {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--primary-900);
}

.airport-code {
  font-size: 1rem;
  font-weight: 700;
  color: var(--brand-blue);
}

.city-name {
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.right-align {
  text-align: right;
}

.duration-path {
  text-align: center;
}

.duration-text {
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--primary-700);
}

.flight-line {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  margin: 6px 0;
}

.flight-line::before {
  content: '';
  position: absolute;
  left: 10px;
  right: 10px;
  height: 2px;
  background: #cbd5e1;
}

.line-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--brand-blue);
  z-index: 1;
}

.line-plane {
  color: var(--brand-blue);
  z-index: 1;
  background: #ffffff;
  padding: 0 4px;
  font-size: 0.875rem;
}

.stop-text {
  font-size: 0.75rem;
  color: var(--success);
  font-weight: 600;
}

.flight-sub-info {
  display: flex;
  gap: 16px;
  font-size: 0.8125rem;
  border-top: 1px dashed var(--border-color);
  padding-top: 14px;
}

.date-chip, .seats-chip {
  background: #f8fafc;
  padding: 4px 10px;
  border-radius: 6px;
  color: var(--primary-700);
}

.flight-card-action {
  padding: 24px;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.class-pricing-tabs {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.fare-choice {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  background: #ffffff;
  border: 1.5px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s ease;
}

.fare-choice.selected {
  border-color: var(--brand-gold);
  background: #fffbeb;
}

.class-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--primary-700);
}

.class-price {
  font-size: 0.9375rem;
  font-weight: 800;
  color: var(--primary-900);
}

.select-btn {
  height: 44px;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 48px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--brand-sky-soft);
  border-top-color: var(--brand-blue);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px auto;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 16px;
}

.mt-16 {
  margin-top: 16px;
}

@media (max-width: 900px) {
  .results-layout {
    grid-template-columns: 1fr;
  }
  .flight-card {
    grid-template-columns: 1fr;
  }
  .flight-card-main {
    border-right: none;
    border-bottom: 1px solid var(--border-color);
  }
}
</style>
