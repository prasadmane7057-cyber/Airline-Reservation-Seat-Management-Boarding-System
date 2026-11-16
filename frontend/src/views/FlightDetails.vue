<template>
  <div class="flight-details-page page-wrapper">
    <div class="container-narrow">
      <div v-if="loading" class="card text-center py-48">
        <div class="spinner"></div>
        <p>Loading the fields available for this flight...</p>
      </div>

      <div v-else-if="flight" class="details-container">
        <!-- Back Navigation -->
        <div class="details-top-bar">
          <router-link to="/flights" class="btn btn-outline btn-sm">
            ← Back to Flights
          </router-link>
          <div class="step-indicator">
            <span class="step active">1. Flight Details</span>
            <span class="step-sep">➔</span>
            <span class="step">2. Seat Selection</span>
            <span class="step-sep">➔</span>
            <span class="step">3. Passenger Info</span>
            <span class="step-sep">➔</span>
            <span class="step">4. Payment</span>
          </div>
        </div>

        <!-- Main Flight Header Card -->
        <div class="flight-hero-card card">
          <div class="hero-card-top">
            <div class="flight-badge-group">
              <span class="flight-code-badge">{{ flight.flight_number }}</span>
              <span class="airline-tag">Destination: {{ flight.destination || 'Unavailable' }}</span>
            </div>
            <span class="badge" :class="'badge-' + (flight.status || 'scheduled').toLowerCase()">
              {{ flight.status }}
            </span>
          </div>

          <div class="itinerary-grid">
            <div class="itinerary-point">
              <div class="point-code">Flight</div>
              <div class="point-name">{{ flight.flight_number }}</div>
              <div class="point-city">Status: {{ flight.status }}</div>
            </div>

            <div class="itinerary-mid">
              <div class="duration-label">Recorded flight</div>
              <div class="route-line-graphic">
                <span class="circle-start"></span>
                <span class="line-bar"></span>
                <span class="plane-icon">✈</span>
                <span class="circle-end"></span>
              </div>
              <div class="flight-date-tag">No schedule in current schema</div>
            </div>

            <div class="itinerary-point text-right">
              <div class="point-code">Destination</div>
              <div class="point-name">{{ flight.destination || 'Unavailable' }}</div>
              <div class="point-city">No airport details available</div>
            </div>
          </div>
        </div>

        <!-- Class Selection & Fare Breakdown -->
        <div class="classes-grid">
          <!-- Economy Card -->
          <div 
            class="class-card card" 
            :class="{ active: selectedClass === 'Economy' }"
            @click="selectedClass = 'Economy'"
          >
            <div class="class-header">
              <span class="badge badge-economy">Economy</span>
              <div class="class-price">₹5,000</div>
            </div>
            <p class="class-desc">Academic base fare only; fare and amenities are not stored per flight.</p>
            <ul class="amenities-list">
              <li>Seat class must match the selected seat.</li>
              <li>Payment is not configured.</li>
            </ul>
          </div>

          <!-- Business Card -->
          <div 
            class="class-card card" 
            :class="{ active: selectedClass === 'Business' }"
            @click="selectedClass = 'Business'"
          >
            <div class="class-header">
              <span class="badge badge-business">Business</span>
              <div class="class-price">₹10,000</div>
            </div>
            <p class="class-desc">Academic base fare only; fare and amenities are not stored per flight.</p>
            <ul class="amenities-list">
              <li>Seat class must match the selected seat.</li>
              <li>Payment is not configured.</li>
            </ul>
          </div>

          <!-- First Class Card -->
          <div 
            class="class-card card" 
            :class="{ active: selectedClass === 'First Class' }"
            @click="selectedClass = 'First Class'"
          >
            <div class="class-header">
              <span class="badge badge-first">First Class</span>
              <div class="class-price">₹20,000</div>
            </div>
            <p class="class-desc">Academic base fare only; fare and amenities are not stored per flight.</p>
            <ul class="amenities-list">
              <li>Seat class must match the selected seat.</li>
              <li>Payment is not configured.</li>
            </ul>
          </div>
        </div>

        <!-- Action Card -->
        <div class="action-card card">
          <div class="action-summary">
            <div>
              <span class="summary-label">Selected Class:</span>
              <strong class="summary-val">{{ selectedClass }}</strong>
            </div>
            <div>
              <span class="summary-label">Base Fare per Passenger:</span>
              <strong class="summary-fare">₹{{ getBaseFare(selectedClass).toLocaleString() }}</strong>
            </div>
          </div>

          <button @click="proceedToSeatSelection" class="btn btn-gold btn-lg proceed-btn">
            Continue to Seat Selection ➔
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useFlightStore } from '../stores/flightStore';
import { useBookingStore } from '../stores/bookingStore';

const route = useRoute();
const router = useRouter();
const flightStore = useFlightStore();
const bookingStore = useBookingStore();

const flight = ref(null);
const loading = ref(true);
const selectedClass = ref(route.query.travelClass || 'Economy');
const passengerCount = ref(parseInt(route.query.passengers, 10) || 1);

onMounted(async () => {
  const flightId = route.params.id;
  try {
    flight.value = await flightStore.fetchFlightDetails(flightId);
    if (!bookingStore.draft.flight) {
      bookingStore.initBooking(flight.value, selectedClass.value, passengerCount.value);
    }
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
});

function getBaseFare(cls) {
  if (cls === 'Business') return 10000;
  if (cls === 'First Class') return 20000;
  return 5000;
}

function proceedToSeatSelection() {
  bookingStore.initBooking(flight.value, selectedClass.value, passengerCount.value);
  router.push({
    path: `/seat-selection/${flight.value.id}`,
    query: {
      travelClass: selectedClass.value,
      passengers: passengerCount.value
    }
  });
}

</script>

<style scoped>
.details-top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.step-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-muted);
}

.step.active {
  color: var(--brand-blue);
  font-weight: 800;
}

.flight-hero-card {
  margin-bottom: 32px;
  padding: 32px;
}

.hero-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 18px;
}

.flight-badge-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.flight-code-badge {
  background: var(--primary-900);
  color: #ffffff;
  padding: 6px 14px;
  border-radius: 8px;
  font-weight: 800;
  font-size: 1.125rem;
}

.airline-tag {
  font-weight: 700;
  color: var(--primary-800);
}

.aircraft-tag {
  background: #f1f5f9;
  color: var(--text-muted);
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.8125rem;
}

.itinerary-grid {
  display: grid;
  grid-template-columns: 1fr 1.5fr 1fr;
  align-items: center;
  gap: 20px;
}

.point-time {
  font-size: 2rem;
  font-weight: 800;
  color: var(--primary-900);
}

.point-code {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--brand-blue);
}

.point-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--primary-800);
  margin-top: 4px;
}

.point-city {
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.text-right {
  text-align: right;
}

.itinerary-mid {
  text-align: center;
}

.duration-label {
  font-weight: 700;
  font-size: 0.9375rem;
  color: var(--primary-700);
}

.route-line-graphic {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  margin: 12px 0;
}

.line-bar {
  flex: 1;
  height: 2px;
  background: #cbd5e1;
}

.circle-start, .circle-end {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--brand-blue);
}

.plane-icon {
  background: #ffffff;
  padding: 0 8px;
  color: var(--brand-blue);
  font-size: 1.125rem;
}

.flight-date-tag {
  font-size: 0.875rem;
  color: var(--text-muted);
  font-weight: 600;
}

.classes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.class-card {
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;
}

.class-card:hover {
  border-color: #cbd5e1;
  transform: translateY(-3px);
}

.class-card.active {
  border-color: var(--brand-gold);
  background: #fffdfa;
  box-shadow: 0 0 16px rgba(245, 158, 11, 0.2);
}

.class-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.class-price {
  font-size: 1.375rem;
  font-weight: 800;
  color: var(--primary-900);
}

.class-desc {
  font-size: 0.8125rem;
  color: var(--text-muted);
  margin-bottom: 16px;
  line-height: 1.5;
}

.amenities-list {
  list-style: none;
  font-size: 0.8125rem;
  color: var(--primary-800);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 32px;
}

.action-summary {
  display: flex;
  gap: 32px;
}

.summary-label {
  display: block;
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
}

.summary-val {
  font-size: 1.125rem;
  color: var(--primary-900);
}

.summary-fare {
  font-size: 1.375rem;
  font-weight: 800;
  color: var(--brand-blue);
}

.proceed-btn {
  min-width: 280px;
}

@media (max-width: 768px) {
  .itinerary-grid {
    grid-template-columns: 1fr;
    text-align: center;
  }
  .text-right {
    text-align: center;
  }
  .action-card {
    flex-direction: column;
    gap: 20px;
  }
  .proceed-btn {
    width: 100%;
  }
}
</style>
