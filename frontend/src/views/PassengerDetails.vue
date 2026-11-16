<template>
  <div class="passenger-details-page page-wrapper">
    <div class="container">
      <!-- Steps Indicator -->
      <div class="details-top-bar">
        <button @click="router.back()" class="btn btn-outline btn-sm">
          ← Back to Seat Selection
        </button>
        <div class="step-indicator">
          <span class="step done">1. Flight Details</span>
          <span class="step-sep">➔</span>
          <span class="step done">2. Seat Selection</span>
          <span class="step-sep">➔</span>
          <span class="step active">3. Passenger Info</span>
          <span class="step-sep">➔</span>
          <span class="step">4. Reservation</span>
        </div>
      </div>

      <div class="passenger-form-layout">
        <!-- Passenger Forms -->
        <div class="form-container">
          <div class="form-header-box">
            <h1 class="page-title">Passenger Information</h1>
            <p class="page-subtitle">Please enter passenger details matching government-issued identification.</p>
          </div>

          <div v-if="validationError" class="error-banner">
            ⚠️ {{ validationError }}
          </div>

          <form @submit.prevent="confirmReservation">
            <div 
              v-for="(passenger, index) in passengerList" 
              :key="index" 
              class="passenger-card card"
            >
              <div class="passenger-card-header">
                <div class="pax-title">
                  <span class="pax-num-badge">Passenger {{ index + 1 }}</span>
                  <span class="assigned-seat-badge">
                    Seat: <strong>{{ passenger.seatNumber }}</strong> ({{ bookingStore.draft.travelClass }})
                  </span>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Full Name (as per ID) *</label>
                  <input 
                    type="text" 
                    v-model="passenger.fullName" 
                    class="form-input" 
                    placeholder="e.g. Aarav Sharma" 
                    required 
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Email *</label>
                  <input
                    type="email"
                    v-model="passenger.email"
                    class="form-input"
                    placeholder="passenger@example.com"
                    required
                  />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Contact Phone</label>
                  <input 
                    type="tel" 
                    v-model="passenger.phone" 
                    class="form-input" 
                    placeholder="+91-9876543210" 
                  />
                </div>
              </div>
            </div>

            <div class="form-submit-row">
              <button type="submit" class="btn btn-gold btn-lg proceed-payment-btn" :disabled="bookingStore.loading">
                <span v-if="bookingStore.loading">Creating reservation...</span>
                <span v-else>Create reservation (no payment)</span>
              </button>
            </div>
          </form>
        </div>

        <!-- Sticky Summary Sidebar -->
        <aside class="sidebar-summary">
          <div class="card summary-card">
            <h3 class="card-title">Itinerary Summary</h3>

            <div v-if="flight" class="flight-route-box">
              <div class="route-flight-no">Flight {{ flight.flight_number }}</div>
              <div>Destination: {{ flight.destination || 'Not available in the current flight schema' }}</div>
            </div>

            <div class="summary-section">
              <span class="section-sub">Allocated Seats</span>
              <div class="seat-badge-list">
                <span 
                  v-for="s in bookingStore.draft.seats" 
                  :key="s.seat_number" 
                  class="summary-seat-tag"
                >
                  {{ s.seat_number }} ({{ bookingStore.draft.travelClass }})
                </span>
              </div>
            </div>

            <div class="summary-section">
              <span class="section-sub">Fare Breakdown</span>
              <div class="fare-rows">
                <div class="fare-row">
                  <span>Academic base fare:</span>
                  <span>₹{{ bookingStore.draft.fare.baseFare.toLocaleString() }}</span>
                </div>
                <div class="fare-row total-fare-row"><span>Payment:</span><span class="grand-total">Not configured</span></div>
              </div>
            </div>

            <div class="security-note">No card or banking details are collected. This action creates a reservation only.</div>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useBookingStore } from '../stores/bookingStore';
import { useAuthStore } from '../stores/authStore';

const router = useRouter();
const bookingStore = useBookingStore();
const authStore = useAuthStore();

const validationError = ref('');
const passengerList = ref([]);

const flight = computed(() => bookingStore.draft.flight);

onMounted(() => {
  if (!flight.value || bookingStore.draft.seats.length === 0) {
    router.push('/flights');
    return;
  }

  // Prepopulate first passenger with auth user details if available
  const existingPax = bookingStore.draft.passengers || [];
  passengerList.value = bookingStore.draft.seats.map((seat, idx) => {
    const prev = existingPax[idx] || {};
    return {
      fullName: prev.fullName || (idx === 0 && authStore.user ? authStore.user.name : ''),
      seatNumber: seat.seat_number,
      phone: prev.phone || (idx === 0 && authStore.user ? authStore.user.phone : ''),
      email: prev.email || (idx === 0 && authStore.user ? authStore.user.email : '')
    };
  });
});

async function confirmReservation() {
  validationError.value = '';

  if (passengerList.value.length !== 1) {
    validationError.value = 'The current reservation schema supports one passenger per booking. Book each traveler separately.';
    return;
  }

  for (let i = 0; i < passengerList.value.length; i++) {
    const p = passengerList.value[i];
    if (!p.fullName.trim() || !p.email.trim()) {
      validationError.value = `Please complete all required fields for Passenger ${i + 1}.`;
      return;
    }
  }

  bookingStore.setPassengers(passengerList.value);
  try {
    const result = await bookingStore.confirmBooking();
    router.push(`/booking-confirmation/${encodeURIComponent(result.booking.pnr)}`);
  } catch (err) {
    validationError.value = err.message || 'Could not create the reservation.';
  }
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

.step.done {
  color: var(--success);
}

.passenger-form-layout {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 32px;
  align-items: start;
}

.form-header-box {
  margin-bottom: 24px;
}

.passenger-card {
  margin-bottom: 24px;
  padding: 24px;
}

.passenger-card-header {
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 14px;
  margin-bottom: 18px;
}

.pax-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pax-num-badge {
  font-size: 1rem;
  font-weight: 800;
  color: var(--primary-900);
}

.assigned-seat-badge {
  background: var(--brand-gold-soft);
  color: #92400e;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.8125rem;
}

.form-submit-row {
  margin-top: 24px;
}

.proceed-payment-btn {
  width: 100%;
}

.error-banner {
  background: var(--danger-soft);
  color: #991b1b;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  margin-bottom: 20px;
  font-weight: 600;
  font-size: 0.875rem;
}

.sidebar-summary {
  position: sticky;
  top: 96px;
}

.flight-route-box {
  background: #f8fafc;
  padding: 14px;
  border-radius: var(--radius-md);
  margin-bottom: 20px;
}

.route-flight-no {
  font-weight: 800;
  color: var(--brand-blue);
  font-size: 0.875rem;
  margin-bottom: 4px;
}

.route-city-row {
  display: flex;
  justify-content: space-between;
  font-weight: 700;
  font-size: 0.9375rem;
}

.route-time-row {
  display: flex;
  gap: 8px;
  font-size: 0.8125rem;
  color: var(--text-muted);
  margin-top: 6px;
}

.summary-section {
  margin-bottom: 20px;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 16px;
}

.section-sub {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  margin-bottom: 10px;
}

.seat-badge-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.summary-seat-tag {
  background: #f1f5f9;
  border: 1px solid var(--border-color);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8125rem;
  font-weight: 600;
}

.fare-rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.fare-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: var(--primary-700);
}

.green-text {
  color: var(--success);
  font-weight: 600;
}

.total-fare-row {
  border-top: 1.5px solid var(--border-color);
  padding-top: 10px;
  font-weight: 800;
  font-size: 1rem;
  color: var(--primary-900);
}

.grand-total {
  font-size: 1.25rem;
  color: var(--brand-blue);
}

.security-note {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-align: center;
  margin-top: 14px;
}

@media (max-width: 960px) {
  .passenger-form-layout {
    grid-template-columns: 1fr;
  }
}
</style>
