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
          <span class="step">4. Reservation</span>
        </div>
      </div>

      <div class="seat-layout-grid">
        <div class="cabin-container">
          <div class="card inventory-container">
            <div class="cabin-header-box">
              <h3 class="card-title mb-0">Aircraft Cabin Seat Map</h3>
              <span class="aircraft-type-chip">{{ flight?.aircraft_model || 'Airbus A320neo' }} · 116 Seats</span>
            </div>
            <p class="cabin-subtext">
              Select your preferred seat. Rows 1–2 are First Class, Rows 3–6 are Business Class, and Rows 7–21 are Economy. Row 11 is an emergency exit row.
            </p>

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
                <span>Blocked / Exit</span>
              </div>
              <div class="legend-item">
                <span class="legend-box unavailable"></span>
                <span>Other Class</span>
              </div>
            </div>

            <div v-if="seatStore.loading" class="text-center py-48">
              <div class="spinner"></div>
              <p>Loading real-time cabin seat layout...</p>
            </div>

            <div v-else-if="seatStore.error" class="empty-state card" role="alert">
              Could not load seat inventory: {{ seatStore.error }}
            </div>

            <div v-else class="seat-matrix">
              <!-- Fuselage Nose Visual -->
              <div class="plane-nose-tip">
                <span>✈ COCKPIT / NOSE</span>
              </div>

              <!-- First Class Section (Rows 1-2) -->
              <div class="cabin-section-header first-class-header">
                FIRST CLASS · 2×2 LAYOUT (ROWS 1–2)
              </div>
              <div
                v-for="row in firstClassRows"
                :key="'fc-row-' + row.rowNumber"
                class="seat-row-wrapper"
              >
                <div class="seat-row-number">{{ row.rowNumber }}</div>
                <div class="seat-group premium-group">
                  <button
                    v-for="seat in row.seats"
                    :key="seat.id"
                    :class="getSeatClass(seat)"
                    :disabled="seat.seat_class !== travelClass || seat.seat_status !== 'AVAILABLE'"
                    @click="handleSeatClick(seat)"
                    class="seat-btn premium-seat"
                    :title="getSeatTooltip(seat)"
                  >
                    {{ seat.seat_number }}
                  </button>
                </div>
              </div>

              <!-- Business Class Section (Rows 3-6) -->
              <div class="cabin-section-header business-header">
                BUSINESS CLASS · 2×2 LAYOUT (ROWS 3–6)
              </div>
              <div
                v-for="row in businessClassRows"
                :key="'biz-row-' + row.rowNumber"
                class="seat-row-wrapper"
              >
                <div class="seat-row-number">{{ row.rowNumber }}</div>
                <div class="seat-group premium-group">
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
                  </button>
                </div>
              </div>

              <!-- Economy Class Section (Rows 7-21) -->
              <div class="cabin-section-header economy-header">
                ECONOMY CABIN · 3×3 LAYOUT (ROWS 7–21)
              </div>
              <div
                v-for="row in economyClassRows"
                :key="'eco-row-' + row.rowNumber"
                class="seat-row-wrapper"
                :class="{ 'exit-row': row.rowNumber === 11 }"
              >
                <div class="seat-row-number">
                  {{ row.rowNumber }}
                  <span v-if="row.rowNumber === 11" class="exit-marker">EXIT</span>
                </div>
                <div class="seat-group standard-group">
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
              <div class="mini-route">
                {{ flight.from_city || 'Origin' }} ({{ flight.from_code || 'BOM' }})
                ➔
                {{ flight.to_city || flight.destination || 'Destination' }} ({{ flight.to_code || 'DEL' }})
              </div>
              <div class="mini-meta">
                <span>Flight {{ flight.flight_number }}</span> • <span>{{ travelClass }}</span>
              </div>
              <div class="mini-times">
                <span>{{ flight.departure_time || '08:00 AM' }} - {{ flight.arrival_time || '10:15 AM' }}</span>
              </div>
            </div>

            <!-- Seat Selection Status -->
            <div class="selection-status-box">
              <div class="status-top">
                <span class="status-title">Selected Seat ({{ seatStore.selectedSeats.length }} / {{ maxPassengers }})</span>
                <button 
                  v-if="seatStore.selectedSeats.length > 0" 
                  @click="seatStore.clearSelection" 
                  class="btn-clear"
                >
                  Clear
                </button>
              </div>

              <div v-if="seatStore.selectedSeats.length === 0" class="no-selection-msg">
                Please click on the cabin seat map to choose your seat.
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
                <span>Base Fare ({{ travelClass }})</span>
                <span>₹{{ computedFare.baseFare.toLocaleString() }}</span>
              </div>
              <div class="fare-row">
                <span>Taxes &amp; Airport Surcharges</span>
                <span>₹{{ computedFare.tax.toLocaleString() }}</span>
              </div>
              <div class="fare-row total-row">
                <span>Total Amount</span>
                <span class="total-fare">₹{{ computedFare.total.toLocaleString() }}</span>
              </div>
            </div>

            <div v-if="errorMessage" class="error-msg">
              ⚠️ {{ errorMessage }}
            </div>

            <button 
              @click="proceedToPassengerDetails" 
              class="btn btn-gold btn-lg btn-full"
              :disabled="seatStore.selectedSeats.length !== maxPassengers"
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

const flight = computed(() => flightStore.selectedFlight || bookingStore.draft.flight);

const firstClassRows = computed(() => seatStore.seatRows.filter(r => r.rowNumber <= 2));
const businessClassRows = computed(() => seatStore.seatRows.filter(r => r.rowNumber >= 3 && r.rowNumber <= 6));
const economyClassRows = computed(() => seatStore.seatRows.filter(r => r.rowNumber >= 7));

const computedFare = computed(() => {
  let baseFare = 5000;
  if (flight.value) {
    if (travelClass.value === 'First Class') baseFare = flight.value.first_class_fare || 20000;
    else if (travelClass.value === 'Business') baseFare = flight.value.business_fare || 10000;
    else baseFare = flight.value.economy_fare || 5000;
  }
  const tax = Math.round(baseFare * 0.12);
  return {
    baseFare,
    tax,
    total: baseFare + tax
  };
});

onMounted(async () => {
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
  } catch (err) {
    console.error('Failed to load seats:', err);
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
  if (seat.is_blocked) return `Seat ${seat.seat_number} (Emergency Exit / Blocked)`;
  return `Seat ${seat.seat_number} - ${seat.seat_class} (Available)`;
}

function handleSeatClick(seat) {
  errorMessage.value = '';
  const result = seatStore.toggleSeat(seat);
  if (!result.success) {
    errorMessage.value = result.message;
  }
}

function proceedToPassengerDetails() {
  if (seatStore.selectedSeats.length !== maxPassengers.value) {
    errorMessage.value = `Please select exactly ${maxPassengers.value} seat.`;
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

.inventory-container {
  padding: 24px;
}

.cabin-header-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.aircraft-type-chip {
  background: #f1f5f9;
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--primary-800);
}

.cabin-subtext {
  font-size: 0.8125rem;
  color: var(--text-muted);
  margin-bottom: 20px;
}

.seat-legend {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 28px;
  padding: 12px;
  background: #f8fafc;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  flex-wrap: wrap;
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

.plane-nose-tip {
  text-align: center;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  color: var(--brand-blue);
  background: var(--brand-sky-soft);
  padding: 8px;
  border-radius: 20px 20px 0 0;
  margin-bottom: 16px;
  border: 1px dashed var(--brand-blue);
}

.cabin-section-header {
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  padding: 8px 12px;
  border-radius: 6px;
  text-align: center;
  margin: 18px 0 10px 0;
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

.seat-row-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 8px;
}

.seat-row-number {
  width: 36px;
  font-weight: 700;
  font-size: 0.8125rem;
  color: var(--text-muted);
  text-align: right;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.exit-marker {
  font-size: 0.6rem;
  color: #dc2626;
  font-weight: 800;
}

.seat-group {
  display: flex;
  gap: 8px;
}

.premium-group {
  gap: 16px;
}

.seat-btn {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1.5px solid transparent;
}

.premium-seat {
  width: 52px;
  height: 48px;
}

.seat-btn.available {
  background: #f0fdf4;
  border-color: #86efac;
  color: #166534;
}

.seat-btn.available:hover {
  transform: scale(1.08);
  border-color: var(--brand-gold);
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}

.seat-btn.selected {
  background: var(--brand-gold);
  border-color: #b45309;
  color: #ffffff;
  box-shadow: 0 0 10px rgba(245, 158, 11, 0.5);
}

.seat-btn.occupied {
  background: #e2e8f0;
  border-color: #cbd5e1;
  color: #94a3b8;
  cursor: not-allowed;
}

.seat-btn.blocked {
  background: #fee2e2;
  border-color: #fca5a5;
  color: #b91c1c;
  cursor: not-allowed;
}

.seat-btn.unavailable {
  background: #f8fafc;
  border-color: #e2e8f0;
  color: #cbd5e1;
  cursor: not-allowed;
  opacity: 0.6;
}

.exit-row {
  background: #fff1f2;
  border-radius: 8px;
  padding: 4px;
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
  font-size: 1.0625rem;
  font-weight: 800;
  color: var(--primary-900);
}

.mini-meta {
  font-size: 0.8125rem;
  color: var(--text-muted);
  margin-top: 4px;
}

.mini-times {
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--brand-blue);
  margin-top: 2px;
}

.selection-status-box {
  background: #f8fafc;
  padding: 16px;
  border-radius: var(--radius-md);
  margin-bottom: 20px;
  border: 1px solid var(--border-color);
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

.total-row {
  border-top: 1.5px solid var(--border-color);
  padding-top: 12px;
  font-size: 1rem;
  font-weight: 800;
  color: var(--primary-900);
}

.total-fare {
  font-size: 1.375rem;
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
