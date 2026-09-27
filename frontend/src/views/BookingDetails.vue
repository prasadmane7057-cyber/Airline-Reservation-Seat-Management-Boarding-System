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

      <div v-else-if="booking" class="details-stack">
        <!-- Status & Flight Card -->
        <div class="card header-card">
          <div class="header-card-top">
            <div>
              <span class="flight-no-tag">Flight {{ booking.flight_number }}</span>
              <span class="airline-text">{{ booking.airline || 'SkyWings Airlines' }}</span>
            </div>
            <span class="badge" :class="'badge-' + booking.booking_status.toLowerCase()">
              {{ booking.booking_status }}
            </span>
          </div>

          <div class="route-details-grid">
            <div>
              <div class="point-city">{{ booking.from_city }} ({{ booking.from_code }})</div>
              <div class="point-name">{{ booking.from_name }}</div>
              <div class="point-time">{{ formatTime(booking.departure_time) }}</div>
              <div class="point-date">{{ formatDate(booking.departure_time) }}</div>
            </div>

            <div class="route-mid-box">
              <span class="dur">{{ booking.duration || '2h 15m' }}</span>
              <div class="line">✈ ➔</div>
              <span class="badge badge-economy">{{ booking.travel_class }}</span>
            </div>

            <div class="text-right">
              <div class="point-city">{{ booking.to_city }} ({{ booking.to_code }})</div>
              <div class="point-name">{{ booking.to_name }}</div>
              <div class="point-time">{{ formatTime(booking.arrival_time) }}</div>
              <div class="point-date">{{ formatDate(booking.arrival_time) }}</div>
            </div>
          </div>
        </div>

        <!-- Passengers Card -->
        <div class="card passengers-card">
          <h3 class="card-title">Passengers & Seat Assignments</h3>
          <div class="passenger-list">
            <div 
              v-for="p in booking.passengers" 
              :key="p.id" 
              class="passenger-item-row"
            >
              <div class="pax-identity">
                <span class="pax-avatar">{{ p.full_name ? p.full_name.charAt(0) : 'P' }}</span>
                <div>
                  <div class="pax-name">{{ p.full_name }}</div>
                  <div class="pax-meta">{{ p.age }} yrs • {{ p.gender }} • ID: {{ p.passport_id || 'N/A' }}</div>
                </div>
              </div>

              <div class="pax-seat-badge">
                <span class="seat-label">Assigned Seat</span>
                <span class="seat-val">{{ p.seat_number }}</span>
              </div>

              <div class="pax-boarding-status">
                <span class="badge" :class="'badge-' + (p.boarding_status ? p.boarding_status.toLowerCase() : 'scheduled')">
                  {{ p.boarding_status || 'NOT_CHECKED_IN' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Payment & Receipt Card -->
        <div class="card payment-card">
          <h3 class="card-title">Payment & Fare Breakdown</h3>
          <div class="payment-grid">
            <div class="payment-info-left">
              <div><strong>Payment Status:</strong> <span class="badge badge-paid">{{ booking.payment_status }}</span></div>
              <div><strong>Transaction ID:</strong> {{ booking.transaction_id || 'TXN-908234' }}</div>
              <div><strong>Payment Method:</strong> {{ booking.payment_method || 'Credit Card' }}</div>
              <div><strong>Booked On:</strong> {{ formatDateTime(booking.booking_date) }}</div>
            </div>

            <div class="payment-fares-right">
              <div class="fare-line"><span>Base Fare:</span> <span>₹{{ (booking.base_fare || 0).toLocaleString() }}</span></div>
              <div class="fare-line"><span>Aviation Taxes (18%):</span> <span>₹{{ (booking.tax_amount || 0).toLocaleString() }}</span></div>
              <div class="fare-line green-txt"><span>Discount Applied:</span> <span>- ₹{{ (booking.discount_amount || 0).toLocaleString() }}</span></div>
              <div class="fare-line grand-total-line"><span>Total Fare Paid:</span> <span class="cost">₹{{ (booking.total_fare || 0).toLocaleString() }}</span></div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="details-bottom-actions">
          <router-link :to="'/booking-confirmation/' + booking.pnr" class="btn btn-outline btn-lg">
            🖨️ View / Print E-Ticket
          </router-link>
          <router-link :to="'/boarding-pass?pnr=' + booking.pnr" class="btn btn-primary btn-lg">
            📱 Web Check-in & Boarding Pass
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
import { useRoute, useRouter } from 'vue-router';
import { useBookingStore } from '../stores/bookingStore';

const route = useRoute();
const router = useRouter();
const bookingStore = useBookingStore();

const booking = ref(null);
const loading = ref(true);

onMounted(async () => {
  const idOrPnr = route.params.id;
  try {
    booking.value = await bookingStore.fetchBookingDetails(idOrPnr);
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
});

async function handleCancel() {
  if (confirm(`Are you sure you want to cancel booking ${booking.value.pnr}? Seats will be released immediately.`)) {
    try {
      await bookingStore.cancelBooking(booking.value.id);
      booking.value.booking_status = 'CANCELLED';
      booking.value.payment_status = 'REFUNDED';
      alert('Booking cancelled and seats released.');
    } catch (err) {
      alert(err.message || 'Failed to cancel.');
    }
  }
}

function formatTime(str) {
  if (!str) return '';
  const d = new Date(str);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDate(str) {
  if (!str) return '';
  const d = new Date(str);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
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
