<template>
  <div class="my-bookings-page page-wrapper">
    <div class="container">
      <div class="page-header-row">
        <div>
          <h1 class="page-title">My Flight Reservations</h1>
          <p class="page-subtitle">View and manage your upcoming flights, e-tickets, and cancellation requests.</p>
        </div>
        <router-link to="/flights" class="btn btn-gold">
          + Book Another Flight
        </router-link>
      </div>

      <!-- Filter Tabs -->
      <div class="filter-tabs">
        <button 
          class="tab-btn" 
          :class="{ active: currentTab === 'ALL' }" 
          @click="currentTab = 'ALL'"
        >
          All Bookings ({{ bookings.length }})
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: currentTab === 'CONFIRMED' }" 
          @click="currentTab = 'CONFIRMED'"
        >
          Confirmed ({{ confirmedCount }})
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: currentTab === 'CANCELLED' }" 
          @click="currentTab = 'CANCELLED'"
        >
          Cancelled ({{ cancelledCount }})
        </button>
      </div>

      <!-- Bookings Table / Cards -->
      <div class="card bookings-card">
        <div v-if="loading" class="text-center py-48">
          <div class="spinner"></div>
          <p>Retrieving your booking records from MySQL...</p>
        </div>

        <div v-else-if="filteredBookings.length === 0" class="empty-state py-48">
          <div class="empty-icon">✈️</div>
          <h3>No {{ currentTab !== 'ALL' ? currentTab.toLowerCase() : '' }} bookings found</h3>
          <p>You have no flight reservations matching this category.</p>
          <router-link to="/flights" class="btn btn-primary btn-sm mt-16">Search Flights</router-link>
        </div>

        <div v-else class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>PNR</th>
                <th>Flight No</th>
                <th>Origin ➔ Dest</th>
                <th>Departure Time</th>
                <th>Seats</th>
                <th>Class</th>
                <th>Total Fare</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="b in filteredBookings" :key="b.id">
                <td><strong class="pnr-link">{{ b.pnr }}</strong></td>
                <td><strong>{{ b.flight_number }}</strong></td>
                <td>{{ b.from_code }} ➔ {{ b.to_code }}</td>
                <td>{{ formatDateTime(b.departure_time) }}</td>
                <td><span class="seat-badge">{{ b.seat_numbers || 'Assigned' }}</span></td>
                <td><span class="badge" :class="'badge-' + (b.travel_class ? b.travel_class.toLowerCase().replace(' ', '') : 'economy')">{{ b.travel_class }}</span></td>
                <td><strong>₹{{ (b.total_fare || 0).toLocaleString() }}</strong></td>
                <td>
                  <span class="badge" :class="'badge-' + b.booking_status.toLowerCase()">
                    {{ b.booking_status }}
                  </span>
                </td>
                <td>
                  <div class="action-buttons">
                    <router-link :to="'/booking-details/' + b.id" class="btn btn-outline btn-sm">
                      View
                    </router-link>
                    <router-link :to="'/booking-confirmation/' + b.pnr" class="btn btn-outline btn-sm" title="E-Ticket">
                      Ticket
                    </router-link>
                    <button 
                      v-if="b.booking_status === 'CONFIRMED'"
                      @click="promptCancelBooking(b)"
                      class="btn btn-danger btn-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Cancel Booking Modal -->
      <div v-if="showCancelModal" class="modal-overlay" @click.self="showCancelModal = false">
        <div class="modal-card">
          <div class="modal-header">
            <h3>Confirm Flight Cancellation</h3>
            <button @click="showCancelModal = false" class="modal-close">×</button>
          </div>

          <div class="modal-body" v-if="bookingToCancel">
            <p class="modal-warning-text">
              Are you sure you want to cancel booking reference <strong>{{ bookingToCancel.pnr }}</strong>?
            </p>
            <div class="cancel-summary-box">
              <div><strong>Flight:</strong> {{ bookingToCancel.flight_number }} ({{ bookingToCancel.from_code }} ➔ {{ bookingToCancel.to_code }})</div>
              <div><strong>Seats to Release:</strong> {{ bookingToCancel.seat_numbers }}</div>
              <div><strong>Refund Amount:</strong> ₹{{ (bookingToCancel.total_fare || 0).toLocaleString() }} (Full Refund)</div>
            </div>
            <p class="cancel-notice">
              ⚠️ Once cancelled, all assigned seats will immediately be released back into the aircraft inventory and payment status updated to REFUNDED.
            </p>
          </div>

          <div class="modal-actions">
            <button @click="showCancelModal = false" class="btn btn-outline" :disabled="cancelling">
              Keep Booking
            </button>
            <button @click="confirmCancellation" class="btn btn-danger" :disabled="cancelling">
              <span v-if="cancelling">Processing Cancellation...</span>
              <span v-else>Confirm & Release Seats</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useBookingStore } from '../stores/bookingStore';

const bookingStore = useBookingStore();

const currentTab = ref('ALL');
const loading = ref(true);
const showCancelModal = ref(false);
const bookingToCancel = ref(null);
const cancelling = ref(false);

const bookings = computed(() => bookingStore.myBookings);

const confirmedCount = computed(() => bookings.value.filter(b => b.booking_status === 'CONFIRMED').length);
const cancelledCount = computed(() => bookings.value.filter(b => b.booking_status === 'CANCELLED').length);

const filteredBookings = computed(() => {
  if (currentTab.value === 'ALL') return bookings.value;
  return bookings.value.filter(b => b.booking_status === currentTab.value);
});

onMounted(async () => {
  try {
    await bookingStore.fetchUserBookings();
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
});

function promptCancelBooking(booking) {
  bookingToCancel.value = booking;
  showCancelModal.value = true;
}

async function confirmCancellation() {
  if (!bookingToCancel.value) return;
  cancelling.value = true;
  try {
    await bookingStore.cancelBooking(bookingToCancel.value.id);
    showCancelModal.value = false;
    bookingToCancel.value = null;
  } catch (err) {
    alert(err.message || 'Failed to cancel booking.');
  } finally {
    cancelling.value = false;
  }
}

function formatDateTime(str) {
  if (!str) return '';
  const d = new Date(str);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}
</script>

<style scoped>
.page-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.filter-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.tab-btn {
  background: #ffffff;
  border: 1.5px solid var(--border-color);
  padding: 8px 18px;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--primary-700);
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn.active {
  background: var(--brand-blue);
  border-color: var(--brand-blue);
  color: #ffffff;
}

.bookings-card {
  padding: 0;
  overflow: hidden;
}

.pnr-link {
  color: var(--brand-blue);
  letter-spacing: 0.05em;
}

.seat-badge {
  background: #f1f5f9;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 700;
  font-size: 0.8125rem;
}

.action-buttons {
  display: flex;
  gap: 6px;
}

.cancel-summary-box {
  background: #f8fafc;
  padding: 14px;
  border-radius: var(--radius-md);
  margin: 16px 0;
  font-size: 0.875rem;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cancel-notice {
  font-size: 0.8125rem;
  color: #b91c1c;
  background: var(--danger-soft);
  padding: 10px;
  border-radius: var(--radius-sm);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

@media (max-width: 768px) {
  .page-header-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
}
</style>
