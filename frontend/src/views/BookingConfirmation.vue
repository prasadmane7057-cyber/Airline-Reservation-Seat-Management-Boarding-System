<template>
  <div class="confirmation-page page-wrapper">
    <div class="container-narrow">
      <div v-if="loading" class="card text-center py-48">
        <div class="spinner"></div>
        <p>Loading confirmed booking details & generating ticket...</p>
      </div>

      <div v-else-if="booking" class="confirmation-container">
        <!-- Success Banner -->
        <div class="success-banner card">
          <div class="success-icon">✓</div>
          <h1 class="success-title">Booking Confirmed!</h1>
          <p class="success-subtitle">
            Your flight has been reserved and ticket issued. Your PNR is 
            <span class="pnr-highlight">{{ booking.pnr }}</span>
          </p>
        </div>

        <!-- Printable E-Ticket View -->
        <div class="ticket-card card ticket-print-view" id="printableTicket">
          <!-- Ticket Header -->
          <div class="ticket-header">
            <div class="ticket-brand">
              <span class="logo-icon">✈</span>
              <div>
                <div class="airline-name">SkyWings Airlines</div>
                <div class="ticket-doc-type">ELECTRONIC TICKET & RECEIPT</div>
              </div>
            </div>

            <div class="pnr-block">
              <span class="pnr-label">BOOKING REFERENCE (PNR)</span>
              <span class="pnr-code">{{ booking.pnr }}</span>
            </div>
          </div>

          <!-- Route & Schedule Row -->
          <div class="ticket-route-grid">
            <div class="ticket-point">
              <span class="t-label">FROM</span>
              <span class="t-city">{{ booking.from_city }} ({{ booking.from_code }})</span>
              <span class="t-airport">{{ booking.from_name }}</span>
              <span class="t-time">{{ formatTime(booking.departure_time) }}</span>
              <span class="t-date">{{ formatDate(booking.departure_time) }}</span>
            </div>

            <div class="ticket-flight-center">
              <span class="t-flight-no">Flight {{ booking.flight_number }}</span>
              <div class="t-line">✈ ➔</div>
              <span class="t-class badge" :class="'badge-' + (booking.travel_class ? booking.travel_class.toLowerCase().replace(' ', '') : 'economy')">
                {{ booking.travel_class }}
              </span>
            </div>

            <div class="ticket-point text-right">
              <span class="t-label">TO</span>
              <span class="t-city">{{ booking.to_city }} ({{ booking.to_code }})</span>
              <span class="t-airport">{{ booking.to_name }}</span>
              <span class="t-time">{{ formatTime(booking.arrival_time) }}</span>
              <span class="t-date">{{ formatDate(booking.arrival_time) }}</span>
            </div>
          </div>

          <!-- Passenger & Seat Table -->
          <div class="passenger-table-section">
            <h4 class="section-title-sm">PASSENGER DETAILS & SEAT ALLOCATIONS</h4>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Passenger Name</th>
                  <th>Age / Gender</th>
                  <th>Passport / ID</th>
                  <th>Seat Number</th>
                  <th>Class</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in booking.passengers" :key="p.id">
                  <td><strong>{{ p.full_name }}</strong></td>
                  <td>{{ p.age }} yrs / {{ p.gender }}</td>
                  <td>{{ p.passport_id || 'N/A' }}</td>
                  <td><span class="seat-badge-pill">{{ p.seat_number }}</span></td>
                  <td>{{ p.travel_class }}</td>
                  <td><span class="badge badge-confirmed">Confirmed</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Payment Summary Footer -->
          <div class="ticket-footer-grid">
            <div class="payment-meta">
              <div><strong>Payment Status:</strong> <span class="badge badge-confirmed">{{ booking.payment_status }}</span></div>
              <div><strong>Transaction ID:</strong> {{ booking.transaction_id || 'TXN-SIMULATED-SUCCESS' }}</div>
              <div><strong>Payment Method:</strong> {{ booking.payment_method || 'Credit Card' }}</div>
            </div>

            <div class="fare-total-box">
              <div class="fare-row"><span>Base Fare:</span> <span>₹{{ (booking.base_fare || 0).toLocaleString() }}</span></div>
              <div class="fare-row"><span>Taxes & Fees:</span> <span>₹{{ (booking.tax_amount || 0).toLocaleString() }}</span></div>
              <div class="fare-row"><span>Discount:</span> <span>- ₹{{ (booking.discount_amount || 0).toLocaleString() }}</span></div>
              <div class="fare-row total-row"><span>Total Paid:</span> <span class="total-cost">₹{{ (booking.total_fare || 0).toLocaleString() }}</span></div>
            </div>
          </div>
        </div>

        <!-- Action Buttons (Hidden during Print) -->
        <div class="confirmation-actions no-print">
          <button @click="printTicket" class="btn btn-outline btn-lg">
            🖨️ Print / Download Ticket
          </button>
          <router-link :to="'/boarding-pass?pnr=' + booking.pnr" class="btn btn-primary btn-lg">
            📱 View Boarding Pass
          </router-link>
          <router-link to="/my-bookings" class="btn btn-secondary btn-lg">
            Go to My Bookings ➔
          </router-link>
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

onMounted(async () => {
  const pnr = route.params.pnr;
  try {
    booking.value = await bookingStore.fetchBookingDetails(pnr);
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
});

function printTicket() {
  window.print();
}

function formatTime(dateTimeStr) {
  if (!dateTimeStr) return '';
  const d = new Date(dateTimeStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDate(dateTimeStr) {
  if (!dateTimeStr) return '';
  const d = new Date(dateTimeStr);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}
</script>

<style scoped>
.success-banner {
  background: linear-gradient(135deg, #065f46 0%, #047857 100%);
  color: #ffffff;
  text-align: center;
  padding: 32px;
  margin-bottom: 28px;
}

.success-icon {
  width: 54px;
  height: 54px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  margin: 0 auto 16px auto;
  font-weight: 800;
}

.success-title {
  font-size: 2rem;
  color: #ffffff;
  margin-bottom: 8px;
}

.success-subtitle {
  font-size: 1rem;
  color: #a7f3d0;
}

.pnr-highlight {
  font-weight: 800;
  color: #ffffff;
  background: rgba(0, 0, 0, 0.3);
  padding: 4px 10px;
  border-radius: 6px;
  letter-spacing: 0.08em;
}

.ticket-card {
  padding: 32px;
  margin-bottom: 28px;
}

.ticket-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid var(--border-color);
  padding-bottom: 20px;
  margin-bottom: 24px;
}

.ticket-brand {
  display: flex;
  align-items: center;
  gap: 14px;
}

.ticket-brand .logo-icon {
  width: 44px;
  height: 44px;
  background: var(--brand-blue);
  color: #ffffff;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.airline-name {
  font-size: 1.375rem;
  font-weight: 800;
  color: var(--primary-900);
}

.ticket-doc-type {
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  color: var(--brand-blue);
}

.pnr-block {
  text-align: right;
}

.pnr-label {
  display: block;
  font-size: 0.6875rem;
  font-weight: 700;
  color: var(--text-muted);
}

.pnr-code {
  font-size: 1.625rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  color: var(--brand-blue);
}

.ticket-route-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  align-items: center;
  gap: 20px;
  background: #f8fafc;
  padding: 24px;
  border-radius: var(--radius-md);
  margin-bottom: 28px;
}

.ticket-point {
  display: flex;
  flex-direction: column;
}

.t-label {
  font-size: 0.6875rem;
  font-weight: 700;
  color: var(--text-muted);
}

.t-city {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--primary-900);
}

.t-airport {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.t-time {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--brand-blue);
  margin-top: 6px;
}

.t-date {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.ticket-flight-center {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.t-flight-no {
  font-weight: 800;
  font-size: 1rem;
}

.t-line {
  color: var(--brand-blue);
  font-size: 1rem;
}

.passenger-table-section {
  margin-bottom: 28px;
}

.section-title-sm {
  font-size: 0.8125rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--primary-700);
  margin-bottom: 12px;
}

.seat-badge-pill {
  background: #fef3c7;
  color: #92400e;
  padding: 4px 10px;
  border-radius: 6px;
  font-weight: 800;
}

.ticket-footer-grid {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  border-top: 1px solid var(--border-color);
  padding-top: 20px;
}

.payment-meta {
  font-size: 0.8125rem;
  color: var(--primary-800);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.fare-total-box {
  width: 240px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.fare-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.8125rem;
  color: var(--primary-700);
}

.total-row {
  border-top: 1px solid var(--border-color);
  padding-top: 8px;
  font-size: 0.9375rem;
  font-weight: 800;
  color: var(--primary-900);
}

.total-cost {
  font-size: 1.125rem;
  color: var(--brand-blue);
}

.confirmation-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .ticket-route-grid {
    grid-template-columns: 1fr;
    text-align: center;
  }
  .ticket-point.text-right {
    text-align: center;
  }
  .ticket-footer-grid {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
}
</style>
