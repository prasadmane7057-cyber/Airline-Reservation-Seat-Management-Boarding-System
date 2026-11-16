<template>
  <div class="seat-selection-page page-wrapper">
    <div class="container">
      <!-- Top Steps Bar -->
      <div class="seat-top-bar">
        <button @click="router.back()" class="btn btn-outline btn-sm">
          ← Back
        </button>
        <div class="step-indicator">
          <span class="step done">1. Flight Details</span>
          <span class="step-sep">➔</span>
          <span class="step active">2. Seat Selection</span>
          <span class="step-sep">➔</span>
          <span class="step">3. Passenger Info</span>
          <span class="step-sep">➔</span>
          <span class="step">4. Payment</span>
        </div>
      </div>

      <div class="seat-layout-grid">
        <div class="cabin-container">
          <div class="card inventory-container">
            <h3 class="card-title">Seat inventory</h3>
            <p>Rows are derived from real seat numbers. This view does not assume an aircraft layout.</p>

            <div class="seat-legend">
              <div class="legend-item">
                <span class="legend-box available"></span>
                <span>Available</span>
              </div>
              <div class="legend-item">
                <span class="legend-box selected"></span>
                <span>Selected</span>
              </div>
              <div class="legend-item">
                <span class="legend-box occupied"></span>
                <span>Occupied</span>
              </div>
              <div class="legend-item">
                <span class="legend-box blocked"></span>
                <span>Blocked</span>
              </div>
              <div class="legend-item">
                <span class="legend-box unavailable"></span>
                <span>Other class</span>
              </div>
            </div>

            <div v-if="seatStore.loading" class="text-center py-48">
              <div class="spinner"></div>
              <p>Loading saved seat records...</p>
            </div>

            <div v-else-if="seatStore.error" class="empty-state card" role="alert">
              Could not load seat inventory: {{ seatStore.error }}
            </div>

            <div v-else-if="seatStore.seats.length === 0" class="empty-state card" role="status">
              <h3>No seat inventory is configured for this flight</h3>
              <p>Only seats entered from the airline's actual inventory can be reserved.</p>
            </div>

            <div v-else class="seat-matrix">
              <div v-for="row in seatStore.seatRows" :key="'row-' + row.rowNumber" class="seat-row-wrapper">
                <div class="seat-row-number">{{ row.rowNumber }}</div>
                <div class="seat-group">
                  <button
                    v-for="seat in row.seats"
                    :key="seat.id"
                    :class="getSeatClass(seat)"
                    :disabled="seat.seat_class !== travelClass || seat.seat_status !== 'AVAILABLE'"
                    @click="handleSeatClick(seat)"
                    class="seat-btn"
                    :title="getSeatTooltip(seat)"
                  >
                    {{ seat.seat_number }}
                    <span class="seat-class-label">{{ seat.seat_class }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Seating & Fare Summary Sidebar -->
        <aside class="seat-summary-sidebar">
          <div class="card summary-card">
            <h3 class="card-title">Booking Summary</h3>

            <div v-if="flight" class="flight-mini-info">
              <div class="mini-route">Destination: {{ flight.destination || 'Unavailable' }}</div>
              <div class="mini-meta">
                <span>Flight {{ flight.flight_number }}</span> • <span>{{ travelClass }}</span>
              </div>
            </div>

            <!-- Seat Selection Status -->
            <div class="selection-status-box">
              <div class="status-top">
                <span class="status-title">Selected Seats ({{ seatStore.selectedSeats.length }} / {{ maxPassengers }})</span>
                <button 
                  v-if="seatStore.selectedSeats.length > 0" 
                  @click="seatStore.clearSelection" 
                  class="btn-clear"
                >
                  Clear
                </button>
              </div>

              <div v-if="seatStore.selectedSeats.length === 0" class="no-selection-msg">
                Please click on the aircraft map to select <strong>{{ maxPassengers }}</strong> seat(s).
              </div>

              <div v-else class="chips-container">
                <div 
                  v-for="s in seatStore.selectedSeats" 
                  :key="s.seat_number" 
                  class="seat-chip"
                >
                  <span>Seat <strong>{{ s.seat_number }}</strong> ({{ s.seat_class }})</span>
                </div>
              </div>
            </div>

            <!-- Dynamic Fare Breakdown -->
            <div class="fare-breakdown-box">
              <div class="fare-row">
                <span>Academic base fare (not charged)</span>
                <span v-if="computedFare.baseFare !== null">₹{{ computedFare.baseFare.toLocaleString() }}</span>
                <span v-else>Unavailable</span>
              </div>
              <div class="fare-row total-row">
                <span>Payment status</span>
                <span class="total-fare">Not configured</span>
              </div>
            </div>

            <div v-if="errorMessage" class="error-msg">
              ⚠️ {{ errorMessage }}
            </div>

            <button 
              @click="proceedToPassengerDetails" 
              class="btn btn-gold btn-lg btn-full"
              :disabled="passengerCountUnsupported || unsupportedTravelClass || seatStore.selectedSeats.length !== maxPassengers"
            >
              Continue to Passenger Details ➔
            </button>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSeatStore } from '../stores/seatStore';
import { useFlightStore } from '../stores/flightStore';
import { useBookingStore } from '../stores/bookingStore';

const route = useRoute();
const router = useRouter();
const seatStore = useSeatStore();
const flightStore = useFlightStore();
const bookingStore = useBookingStore();

const flightId = route.params.flightId;
const maxPassengers = ref(1);
const travelClass = ref(route.query.travelClass || 'Economy');
const errorMessage = ref('');
const passengerCountUnsupported = ref(false);
const unsupportedTravelClass = ref(false);

const flight = computed(() => flightStore.selectedFlight || bookingStore.draft.flight);

const computedFare = computed(() => {
  const fares = { Economy: 5000, Business: 10000, 'First Class': 20000 };
  const totalBase = fares[travelClass.value] ?? null;

  return {
    baseFare: totalBase,
  };
});

onMounted(async () => {
  const requestedPassengers = Number(route.query.passengers || 1);
  if (!Number.isSafeInteger(requestedPassengers) || requestedPassengers !== 1) {
    passengerCountUnsupported.value = true;
    errorMessage.value = 'The current reservation schema supports one passenger per booking.';
  }
  if (!['Economy', 'Business', 'First Class'].includes(travelClass.value)) {
    unsupportedTravelClass.value = true;
    errorMessage.value = 'Select one of the supported travel classes.';
  }
  seatStore.setMaxSelectable(maxPassengers.value);
  seatStore.setTravelClass(travelClass.value);

  try {
    if (!flight.value) {
      await flightStore.fetchFlightDetails(flightId);
    }
  } catch (err) {
    errorMessage.value = err.message || 'Could not load flight details.';
  }
  try {
    await seatStore.fetchSeats(flightId);
  } catch {
    // The seat store exposes the load error above the inventory view.
  }
});

function getSeatClass(seat) {
  if (seat.seat_class !== travelClass.value) return 'unavailable';
  const isSelected = seatStore.selectedSeatNumbers.includes(seat.seat_number);
  if (isSelected) return 'selected';
  if (seat.is_occupied) return 'occupied';
  if (seat.is_blocked) return 'blocked';
  return 'available';
}

function getSeatTooltip(seat) {
  if (seat.seat_class !== travelClass.value) return `Seat ${seat.seat_number} (${seat.seat_class})`;
  if (seat.is_occupied) return `Seat ${seat.seat_number} (Occupied)`;
  if (seat.is_blocked) return `Seat ${seat.seat_number} (Blocked)`;
  return `Seat ${seat.seat_number} - ${seat.seat_class} (Available)`;
}

function handleSeatClick(seat) {
  if (passengerCountUnsupported.value) return;
  errorMessage.value = '';
  const result = seatStore.toggleSeat(seat);
  if (!result.success) {
    errorMessage.value = result.message;
  }
}

function proceedToPassengerDetails() {
  if (passengerCountUnsupported.value) return;
  if (seatStore.selectedSeats.length !== maxPassengers.value) {
    errorMessage.value = `Please select exactly ${maxPassengers.value} seat(s).`;
    return;
  }

  bookingStore.setSeats(seatStore.selectedSeats);
  router.push(`/passenger-details/${flightId}`);
}
</script>

<style scoped>
.seat-top-bar {
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

.step.done {
  color: var(--success);
}

.seat-layout-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 32px;
  align-items: start;
}

.seat-legend {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 24px;
  padding: 12px;
  background: #f8fafc;
  border-radius: var(--radius-md);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8125rem;
  font-weight: 600;
}

.legend-box {
  width: 18px;
  height: 18px;
  border-radius: 4px;
}

.legend-box.available {
  background: #f0fdf4;
  border: 1.5px solid #86efac;
}

.legend-box.selected {
  background: var(--brand-gold);
  border: 1.5px solid #b45309;
}

.legend-box.occupied {
  background: #e2e8f0;
  border: 1.5px solid #cbd5e1;
}

.legend-box.blocked {
  background: #fee2e2;
  border: 1.5px solid #fca5a5;
}

.legend-box.unavailable {
  background: #f1f5f9;
  border: 1.5px dashed #94a3b8;
}

.seat-class-label {
  display: block;
  font-size: 0.6rem;
  font-weight: 500;
}

.cabin-section-header {
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  padding: 8px 12px;
  border-radius: 6px;
  text-align: center;
  margin: 14px 0 8px 0;
}

.first-class-header {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fde68a;
}

.business-header {
  background: #e0e7ff;
  color: #3730a3;
  border: 1px solid #c7d2fe;
}

.economy-header {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.seat-summary-sidebar {
  position: sticky;
  top: 96px;
}

.flight-mini-info {
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 14px;
  margin-bottom: 16px;
}

.mini-route {
  font-size: 1.125rem;
  color: var(--primary-900);
}

.mini-meta {
  font-size: 0.8125rem;
  color: var(--text-muted);
  margin-top: 4px;
}

.selection-status-box {
  background: #f8fafc;
  padding: 16px;
  border-radius: var(--radius-md);
  margin-bottom: 20px;
}

.status-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.status-title {
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--primary-800);
}

.btn-clear {
  background: transparent;
  border: none;
  font-size: 0.75rem;
  color: var(--danger);
  font-weight: 700;
  cursor: pointer;
}

.no-selection-msg {
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.chips-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.seat-chip {
  background: #ffffff;
  border: 1.5px solid var(--brand-gold);
  color: var(--primary-900);
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.8125rem;
}

.fare-breakdown-box {
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.fare-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: var(--primary-700);
}

.discount-row {
  color: var(--success);
  font-weight: 600;
}

.total-row {
  border-top: 1.5px solid var(--border-color);
  padding-top: 12px;
  font-size: 1rem;
  font-weight: 800;
  color: var(--primary-900);
}

.total-fare {
  font-size: 1.25rem;
  color: var(--brand-blue);
}

.error-msg {
  background: var(--danger-soft);
  color: #991b1b;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  font-size: 0.8125rem;
  margin-bottom: 16px;
}

@media (max-width: 960px) {
  .seat-layout-grid {
    grid-template-columns: 1fr;
  }
}
</style>
