<template>
  <div class="admin-bookings-view">
    <div class="page-top-actions">
      <div>
        <h1 class="page-title mb-0">Reservation Records</h1>
        <p class="page-subtitle">Review reservation fields and cancel eligible bookings. Payments are not configured.</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="card filter-card">
      <div class="filter-grid">
        <input 
          type="text" 
          v-model="searchPnr" 
          class="form-input" 
          placeholder="Filter by PNR Reference..." 
          @input="applyFilters"
        />

        <select v-model="statusFilter" class="form-select" @change="applyFilters">
          <option value="">All Booking Statuses</option>
          <option value="CONFIRMED">CONFIRMED</option>
          <option value="WAITLISTED">WAITLISTED</option>
          <option value="CANCELLED">CANCELLED</option>
          <option value="BOARDED">BOARDED</option>
        </select>
      </div>
    </div>

    <!-- Bookings Table -->
    <div class="card table-card">
      <div v-if="loading" class="text-center py-32">
        <div class="spinner"></div>
        <p>Loading bookings from the database...</p>
      </div>

      <div v-else-if="adminStore.error" class="empty-state card" role="alert">
        Could not load bookings: {{ adminStore.error }}
      </div>

      <div v-else class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>PNR</th>
              <th>Passenger</th>
              <th>Flight</th>
              <th>Destination</th>
              <th>Seat</th>
              <th>Class</th>
              <th>Fare</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="b in bookings" :key="b.id">
              <td>#{{ b.id }}</td>
              <td><strong class="pnr-tag">{{ b.pnr }}</strong></td>
              <td>
                <div><strong>{{ b.passenger_name }}</strong></div>
                <div class="email-sub">{{ b.passenger_email }}</div>
              </td>
              <td><strong>{{ b.flight_number }}</strong></td>
              <td>{{ b.destination || 'Unavailable' }}</td>
              <td><span class="seat-pill">{{ b.seat_number || 'Unavailable' }}</span></td>
              <td>{{ b.travel_class }}</td>
              <td><strong>₹{{ Number(b.fare).toLocaleString() }}</strong></td>
              <td><span class="badge" :class="'badge-' + b.booking_status.toLowerCase()">{{ b.booking_status }}</span></td>
              <td>
                <div class="action-buttons">
                  <button
                    v-if="b.booking_status === 'CONFIRMED'"
                    @click="cancelBooking(b)"
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
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAdminStore } from '../../stores/adminStore';

const adminStore = useAdminStore();

const searchPnr = ref('');
const statusFilter = ref('');

const loading = computed(() => adminStore.loading);
const bookings = computed(() => adminStore.bookings);

onMounted(async () => {
  await applyFilters();
});

async function applyFilters() {
  await adminStore.fetchAllBookings({
    pnr: searchPnr.value,
    status: statusFilter.value
  });
}

async function cancelBooking(booking) {
  if (confirm(`Cancel booking ${booking.pnr}? Its seat will be released. No payment or refund is processed.`)) {
    try {
      await adminStore.cancelBookingAdmin(booking.id);
    } catch (err) {
      alert(err.message || 'Failed to cancel booking.');
    }
  }
}

</script>

<style scoped>
.page-top-actions {
  margin-bottom: 24px;
}

.filter-card {
  padding: 16px;
  margin-bottom: 24px;
}

.filter-grid {
  display: grid;
  grid-template-columns: 1fr 220px;
  gap: 16px;
}

.table-card {
  padding: 0;
  overflow: hidden;
}

.pnr-tag {
  color: var(--brand-blue);
  letter-spacing: 0.05em;
}

.email-sub {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.seat-pill {
  background: #f1f5f9;
  padding: 3px 8px;
  border-radius: 4px;
  font-weight: 700;
  font-size: 0.8125rem;
}

.action-buttons {
  display: flex;
  gap: 6px;
}

@media (max-width: 600px) {
  .filter-grid {
    grid-template-columns: 1fr;
  }
}
</style>
