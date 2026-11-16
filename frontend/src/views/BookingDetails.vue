<template>
  <div class="booking-details-page page-wrapper">
    <div class="container-narrow">
      <div class="top-nav-bar">
        <router-link to="/my-bookings" class="btn btn-outline btn-sm">
          ← Back to My Bookings
        </router-link>
        <div class="pnr-title" v-if="booking">
          PNR: <span class="pnr-badge">{{ booking.pnr }}</span>
        </div>
      </div>

      <div v-if="loading" class="card text-center py-48">
        <div class="spinner"></div>
        <p>Loading booking records...</p>
      </div>

      <div v-else-if="errorMessage" class="card text-center py-48" role="alert">
        {{ errorMessage }}
      </div>

      <div v-else-if="booking" class="details-stack">
        <div class="card header-card">
          <div class="header-card-top">
            <div>
              <span class="flight-no-tag">Flight {{ booking.flight_number }}</span>
              <span class="airline-text">Destination: {{ booking.destination || 'Unavailable' }}</span>
            </div>
            <span class="badge" :class="'badge-' + booking.booking_status.toLowerCase()">
              {{ booking.booking_status }}
            </span>
          </div>

          <div class="route-details-grid">
            <div>
              <div class="point-city">{{ booking.passenger?.full_name || 'Passenger' }}</div>
              <div class="point-name">{{ booking.passenger?.email }}</div>
            </div>

            <div class="route-mid-box">
              <span>Seat</span>
              <div class="line">{{ booking.seat?.seat_number || 'Unavailable' }}</div>
              <span>{{ booking.travel_class }}</span>
            </div>

            <div class="text-right">
              <div class="point-city">Flight status</div>
              <div class="point-name">{{ booking.flight?.status || 'Unavailable' }}</div>
            </div>
          </div>
        </div>

        <div class="card passengers-card">
          <h3 class="card-title">Booking record</h3>
          <p>Passenger: {{ booking.passenger?.full_name || 'Unavailable' }}</p>
          <p>Seat: {{ booking.seat?.seat_number || 'Unavailable' }}</p>
          <p>Booked on: {{ formatDateTime(booking.booking_date) }}</p>
          <p v-if="booking.checked_in_at">Checked in: {{ formatDateTime(booking.checked_in_at) }}</p>
        </div>

        <div class="card payment-card">
          <h3 class="card-title">Fare and payment</h3>
          <div class="payment-grid">
            <div class="payment-info-left">
              <div><strong>Payment:</strong> Not processed; no provider is configured.</div>
              <div><strong>Reservation status:</strong> {{ booking.booking_status }}</div>
            </div>

            <div class="payment-fares-right">
              <div class="fare-line grand-total-line"><span>Recorded fare (not a receipt):</span> <span class="cost">₹{{ Number(booking.fare).toLocaleString() }}</span></div>
            </div>
          </div>
        </div>

        <div class="details-bottom-actions">
          <router-link :to="'/booking-confirmation/' + booking.pnr" class="btn btn-outline btn-lg">
            View Reservation Record
          </router-link>
          <router-link :to="'/boarding-pass?pnr=' + booking.pnr" class="btn btn-primary btn-lg">
            Check-In Status
          </router-link>
          <button 
            v-if="booking.booking_status === 'CONFIRMED'"
            @click="handleCancel"
            class="btn btn-danger btn-lg"
          >
            Cancel Reservation
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useBookingStore } from '../stores/bookingStore';

const route = useRoute();
const bookingStore = useBookingStore();

const booking = ref(null);
const loading = ref(true);
const errorMessage = ref('');

onMounted(async () => {
  const idOrPnr = route.params.id;
  try {
    booking.value = await bookingStore.fetchBookingDetails(idOrPnr);
  } catch (err) {
    errorMessage.value = err.message || 'Could not load this booking.';
  } finally {
    loading.value = false;
  }
});

async function handleCancel() {
  if (confirm(`Are you sure you want to cancel booking ${booking.value.pnr}? Seats will be released immediately.`)) {
    try {
      await bookingStore.cancelBooking(booking.value.id);
      booking.value.booking_status = 'CANCELLED';
      alert('Booking cancelled and the seat released. No payment or refund was processed.');
    } catch (err) {
      alert(err.message || 'Failed to cancel.');
    }
  }
}

function formatDateTime(str) {
  if (!str) return '';
  const d = new Date(str);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}
</script>

<style scoped>
.top-nav-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.pnr-title {
  font-size: 1.125rem;
  font-weight: 700;
}

.pnr-badge {
  background: var(--brand-sky-soft);
  color: var(--brand-blue);
  padding: 4px 10px;
  border-radius: 6px;
  letter-spacing: 0.08em;
}

.details-stack {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.header-card {
  padding: 28px;
}

.header-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 16px;
  margin-bottom: 20px;
}

.flight-no-tag {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--primary-900);
  margin-right: 12px;
}

.airline-text {
  font-weight: 600;
  color: var(--text-muted);
}

.route-details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  align-items: center;
  gap: 16px;
}

.point-city {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--primary-900);
}

.point-name {
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.point-time {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--brand-blue);
  margin-top: 6px;
}

.point-date {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.route-mid-box {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.passenger-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.passenger-item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f8fafc;
  padding: 14px 20px;
  border-radius: var(--radius-md);
}

.pax-identity {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pax-avatar {
  width: 38px;
  height: 38px;
  background: var(--brand-blue);
  color: #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.pax-name {
  font-weight: 700;
  font-size: 1rem;
}

.pax-meta {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.pax-seat-badge {
  text-align: center;
}

.seat-label {
  display: block;
  font-size: 0.6875rem;
  color: var(--text-muted);
  text-transform: uppercase;
}

.seat-val {
  font-weight: 800;
  font-size: 1.125rem;
  color: #92400e;
  background: #fef3c7;
  padding: 2px 10px;
  border-radius: 6px;
}

.payment-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.payment-info-left {
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 0.875rem;
}

.payment-fares-right {
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-left: 1px solid var(--border-color);
  padding-left: 24px;
}

.fare-line {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: var(--primary-700);
}

.green-txt {
  color: var(--success);
  font-weight: 600;
}

.grand-total-line {
  border-top: 1.5px solid var(--border-color);
  padding-top: 10px;
  font-weight: 800;
  font-size: 1rem;
  color: var(--primary-900);
}

.cost {
  font-size: 1.25rem;
  color: var(--brand-blue);
}

.details-bottom-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .route-details-grid {
    grid-template-columns: 1fr;
    text-align: center;
  }
  .text-right {
    text-align: center;
  }
  .passenger-item-row {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  .payment-grid {
    grid-template-columns: 1fr;
  }
  .payment-fares-right {
    border-left: none;
    padding-left: 0;
    border-top: 1px solid var(--border-color);
    padding-top: 16px;
  }
}
</style>
