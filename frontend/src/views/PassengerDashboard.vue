<template>
  <div class="passenger-dashboard page-wrapper">
    <div class="container">
      <!-- Welcome Header -->
      <div class="dashboard-header">
        <div>
          <h1 class="page-title">Welcome back, {{ authStore.userName }}! ✈️</h1>
          <p class="page-subtitle">Review your booking and passenger records.</p>
        </div>
        <router-link to="/flights" class="btn btn-gold btn-lg">
          🔍 Book New Flight
        </router-link>
      </div>

      <!-- Quick Metrics Cards -->
      <div class="metrics-grid">
        <div class="metric-card card">
          <div class="metric-icon blue-bg">🎫</div>
          <div class="metric-meta">
            <span class="metric-val">{{ totalBookingsCount }}</span>
            <span class="metric-title">Total Bookings</span>
          </div>
        </div>

        <div class="metric-card card">
          <div class="metric-icon green-bg">✈️</div>
          <div class="metric-meta">
            <span class="metric-val">{{ activeBookingsCount }}</span>
            <span class="metric-title">Active Flights</span>
          </div>
        </div>

        <div class="metric-card card">
          <div class="metric-icon red-bg">🔄</div>
          <div class="metric-meta">
            <span class="metric-val">{{ cancelledBookingsCount }}</span>
            <span class="metric-title">Cancelled bookings</span>
          </div>
        </div>

        <div class="metric-card card">
          <div class="metric-icon gold-bg">📱</div>
          <div class="metric-meta">
            <span class="metric-val">{{ boardedBookingsCount }}</span>
            <span class="metric-title">Boarded bookings</span>
          </div>
        </div>
      </div>

      <!-- Quick Action Cards -->
      <div class="quick-actions-grid">
        <router-link to="/flights" class="action-tile card">
          <div class="tile-icon">🔍</div>
          <h3>Search Flights</h3>
          <p>Search by destination and flight status using the fields in the current database.</p>
        </router-link>

        <router-link to="/my-bookings" class="action-tile card">
          <div class="tile-icon">📑</div>
          <h3>My Bookings</h3>
          <p>View booking details or cancel a confirmed reservation and release its seat.</p>
        </router-link>

        <router-link to="/boarding-pass" class="action-tile card">
          <div class="tile-icon">🚪</div>
          <h3>Web Check-in & Pass</h3>
          <p>Check in or verify a booking when the required reservation schema is available.</p>
        </router-link>

        <router-link to="/profile" class="action-tile card">
          <div class="tile-icon">👤</div>
          <h3>Passenger Profile</h3>
          <p>Manage account details and password.</p>
        </router-link>
      </div>

      <!-- Upcoming & Recent Bookings -->
      <div class="recent-bookings-section card">
        <div class="section-top-row">
          <h3 class="card-title">Recent Reservations</h3>
          <router-link to="/my-bookings" class="btn btn-outline btn-sm">View All ➔</router-link>
        </div>

        <div v-if="loading" class="text-center py-24">
          <div class="spinner"></div>
          <p>Loading your flight history...</p>
        </div>

        <div v-else-if="loadError" class="text-center py-24" role="alert">
          Could not load bookings: {{ loadError }}
        </div>

        <div v-else-if="bookings.length === 0" class="empty-bookings text-center py-24">
          <p>No bookings found yet. Ready for your next journey?</p>
          <router-link to="/flights" class="btn btn-primary btn-sm mt-12">Search Flights Now</router-link>
        </div>

        <div v-else class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>PNR</th>
                <th>Flight</th>
                <th>Destination</th>
                <th>Booking Date</th>
                <th>Seat</th>
                <th>Class</th>
                <th>Fare</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="b in bookings.slice(0, 5)" :key="b.id">
                <td><strong class="pnr-text">{{ b.pnr }}</strong></td>
                <td>{{ b.flight_number }}</td>
                <td>{{ b.destination || 'Unavailable' }}</td>
                <td>{{ formatDateTime(b.booking_date) }}</td>
                <td>{{ b.seat_number || 'Unavailable' }}</td>
                <td>{{ b.travel_class }}</td>
                <td>₹{{ Number(b.fare).toLocaleString() }}</td>
                <td><span class="badge" :class="'badge-' + b.booking_status.toLowerCase()">{{ b.booking_status }}</span></td>
                <td>
                  <router-link :to="'/booking-details/' + b.id" class="btn btn-outline btn-sm">
                    Details
                  </router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '../stores/authStore';
import { useBookingStore } from '../stores/bookingStore';

const authStore = useAuthStore();
const bookingStore = useBookingStore();

const loading = ref(true);
const loadError = ref('');
const bookings = computed(() => bookingStore.myBookings);

const totalBookingsCount = computed(() => bookings.value.length);
const activeBookingsCount = computed(() => bookings.value.filter(b => b.booking_status === 'CONFIRMED').length);
const cancelledBookingsCount = computed(() => bookings.value.filter(b => b.booking_status === 'CANCELLED').length);
const boardedBookingsCount = computed(() => bookings.value.filter(b => b.booking_status === 'BOARDED').length);

onMounted(async () => {
  try {
    await bookingStore.fetchUserBookings();
  } catch (err) {
    loadError.value = err.message || 'Unable to load bookings.';
  } finally {
    loading.value = false;
  }
});

function formatDateTime(str) {
  if (!str) return '';
  const d = new Date(str);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}
</script>

<style scoped>
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
}

.metric-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.blue-bg { background: var(--brand-sky-soft); color: var(--brand-blue); }
.green-bg { background: var(--success-soft); color: #065f46; }
.red-bg { background: var(--danger-soft); color: #991b1b; }
.gold-bg { background: var(--brand-gold-soft); color: #92400e; }

.metric-meta {
  display: flex;
  flex-direction: column;
}

.metric-val {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--primary-900);
}

.metric-title {
  font-size: 0.8125rem;
  color: var(--text-muted);
  font-weight: 600;
}

.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 36px;
}

.action-tile {
  padding: 28px 24px;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  color: var(--text-main);
}

.action-tile:hover {
  transform: translateY(-4px);
  border-color: var(--brand-blue);
  box-shadow: var(--shadow-lg);
}

.tile-icon {
  font-size: 2rem;
  margin-bottom: 16px;
}

.action-tile h3 {
  font-size: 1.125rem;
  margin-bottom: 8px;
}

.action-tile p {
  font-size: 0.875rem;
  color: var(--text-muted);
  line-height: 1.5;
}

.recent-bookings-section {
  padding: 28px;
}

.section-top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.pnr-text {
  color: var(--brand-blue);
  letter-spacing: 0.05em;
}

.mt-12 {
  margin-top: 12px;
}

@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
}
</style>
