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
              <span class="airline-text">{{ booking.flight?.airline || 'SkyWings Airlines' }} · {{ booking.flight?.aircraft_model || 'Airbus A320neo' }}</span>
            </div>
            <span class="badge" :class="'badge-' + booking.booking_status.toLowerCase()">
              {{ booking.booking_status }}
            </span>
          </div>

          <div class="route-details-grid">
            <div class="point-box">
              <span class="point-label">ORIGIN</span>
              <div class="point-city">{{ booking.flight?.from_city || 'Mumbai' }} ({{ booking.flight?.from_code || 'BOM' }})</div>
              <div class="point-time">{{ booking.flight?.departure_time || '08:30 AM' }}</div>
            </div>

            <div class="route-mid-box">
              <span class="route-duration">{{ booking.flight?.duration || '2h 15m' }}</span>
              <div class="route-arrow">✈ ➔</div>
              <span class="seat-badge">Seat {{ booking.seat_number }} ({{ booking.travel_class }})</span>
            </div>

            <div class="point-box text-right">
              <span class="point-label">DESTINATION</span>
              <div class="point-city">{{ booking.flight?.to_city || booking.destination || 'Delhi' }} ({{ booking.flight?.to_code || 'DEL' }})</div>
              <div class="point-time">{{ booking.flight?.arrival_time || '10:45 AM' }}</div>
            </div>
          </div>
        </div>

        <div class="card passengers-card">
          <h3 class="card-title">Passenger &amp; Reservation Details</h3>
          <div class="pax-info-grid">
            <div><strong>Passenger Name:</strong> {{ booking.passenger_name || 'Aarav Sharma' }}</div>
            <div><strong>Email Address:</strong> {{ booking.passenger_email || 'passenger@skywings.com' }}</div>
            <div><strong>Contact Phone:</strong> {{ booking.passenger_phone || '+91-9876543211' }}</div>
            <div><strong>Allocated Seat:</strong> Seat {{ booking.seat_number }} ({{ booking.travel_class }})</div>
            <div><strong>Booking Date:</strong> {{ formatDateTime(booking.booking_date) }}</div>
            <div><strong>Boarding Status:</strong> {{ booking.booking_status === 'BOARDED' ? 'BOARDED' : (booking.checked_in_at ? 'CHECKED_IN' : 'CONFIRMED') }}</div>
          </div>
        </div>

        <div class="card payment-card">
          <h3 class="card-title">Fare &amp; Payment Summary</h3>
          <div class="payment-grid">
            <div class="payment-info-left">
              <div><strong>Payment Status:</strong> <span class="status-confirmed">COMPLETED</span></div>
              <div><strong>Payment Method:</strong> {{ booking.payment_method || 'Online Payment' }}</div>
              <div><strong>Transaction Reference:</strong> {{ booking.transaction_id || 'TXN-984210' }}</div>
            </div>

            <div class="payment-fares-right">
              <div class="fare-line grand-total-line">
                <span>Total Amount Paid:</span>
                <span class="cost">₹{{ Number(booking.fare || 5600).toLocaleString() }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="details-bottom-actions">
          <router-link :to="'/booking-confirmation/' + booking.pnr" class="btn btn-outline btn-lg">
            Print Ticket Record
          </router-link>
          <router-link :to="'/boarding-pass?pnr=' + booking.pnr" class="btn btn-primary btn-lg">
            Digital Boarding Pass ➔
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
  if (confirm(`Are you sure you want to cancel booking ${booking.value.pnr}? Seat ${booking.value.seat_number} will be released immediately.`)) {
    try {
      await bookingStore.cancelBooking(booking.value.id);
      booking.value.booking_status = 'CANCELLED';
      alert('Booking cancelled successfully and the seat has been released back into inventory.');
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
  background: #f8fafc;
  padding: 20px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}

.point-label {
  font-size: 0.6875rem;
  font-weight: 700;
  color: var(--text-muted);
}

.point-city {
  font-size: 1.125rem;
  font-weight: 800;
  color: var(--primary-900);
}

.point-time {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--brand-blue);
  margin-top: 4px;
}

.route-mid-box {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.route-duration {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
}

.route-arrow {
  font-size: 1.125rem;
  color: var(--brand-blue);
}

.seat-badge {
  background: #fef3c7;
  color: #92400e;
  padding: 4px 10px;
  border-radius: 6px;
  font-weight: 800;
  font-size: 0.8125rem;
}

.pax-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-top: 14px;
  font-size: 0.9375rem;
}

.payment-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-top: 14px;
}

.payment-info-left {
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 0.875rem;
}

.status-confirmed {
  color: #166534;
  font-weight: 800;
}

.payment-fares-right {
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-left: 1px solid var(--border-color);
  padding-left: 24px;
}

.grand-total-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 800;
  font-size: 1.125rem;
  color: var(--primary-900);
}

.cost {
  font-size: 1.5rem;
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
  .point-box.text-right {
    text-align: center;
  }
  .pax-info-grid {
    grid-template-columns: 1fr;
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
