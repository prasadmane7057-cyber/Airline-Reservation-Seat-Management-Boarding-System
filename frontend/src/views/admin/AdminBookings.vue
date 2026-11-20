<template>
  <div class="admin-bookings-view">
    <div class="page-top-actions">
      <div>
        <h1 class="page-title mb-0">Global Reservation Records</h1>
        <p class="page-subtitle">Review passenger bookings, allocated cabin seats, and manage system cancellations.</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="card filter-card">
      <div class="filter-grid">
        <input 
          type="text" 
          v-model="searchPnr" 
          class="form-input" 
          placeholder="Filter by PNR Reference or Flight..." 
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
        <p>Loading real-time booking records from database...</p>
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
              <th>Route (From ➔ To)</th>
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
              <td>
                <span class="route-display">
                  {{ b.flight?.from_city || 'Mumbai' }} ({{ b.flight?.from_code || 'BOM' }})
                  ➔
                  {{ b.flight?.to_city || b.destination || 'Delhi' }} ({{ b.flight?.to_code || 'DEL' }})
                </span>
              </td>
              <td><span class="seat-pill">Seat {{ b.seat_number }}</span></td>
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
  if (confirm(`Cancel booking ${booking.pnr}? Its reserved seat will be immediately released back into flight inventory.`)) {
    try {
      await adminStore.cancelBookingAdmin(booking.id);
      alert(`Booking ${booking.pnr} has been cancelled and its seat released.`);
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

.route-display {
  font-weight: 600;
  color: var(--primary-800);
  font-size: 0.8125rem;
}

.seat-pill {
  background: #fef3c7;
  color: #92400e;
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
