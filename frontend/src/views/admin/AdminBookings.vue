<template>
  <div class="admin-bookings-view">
    <div class="page-top-actions">
      <div>
        <h1 class="page-title mb-0">Global Reservations Monitor</h1>
        <p class="page-subtitle">Track, verify, update, and manage all passenger bookings across the airline system.</p>
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
          <option value="CANCELLED">CANCELLED</option>
          <option value="COMPLETED">COMPLETED</option>
        </select>
      </div>
    </div>

    <!-- Bookings Table -->
    <div class="card table-card">
      <div v-if="loading" class="text-center py-32">
        <div class="spinner"></div>
        <p>Loading global bookings from database...</p>
      </div>

      <div v-else class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>PNR</th>
              <th>Passenger</th>
              <th>Flight</th>
              <th>Route</th>
              <th>Seats</th>
              <th>Class</th>
              <th>Total Fare</th>
              <th>Payment</th>
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
              <td>{{ b.from_code }} ➔ {{ b.to_code }}</td>
              <td><span class="seat-pill">{{ b.seats || 'Assigned' }}</span></td>
              <td><span class="badge" :class="'badge-' + (b.travel_class ? b.travel_class.toLowerCase().replace(' ', '') : 'economy')">{{ b.travel_class }}</span></td>
              <td><strong>₹{{ (b.total_fare || 0).toLocaleString() }}</strong></td>
              <td><span class="badge badge-paid">{{ b.payment_status || 'PAID' }}</span></td>
              <td><span class="badge" :class="'badge-' + b.booking_status.toLowerCase()">{{ b.booking_status }}</span></td>
              <td>
                <div class="action-buttons">
                  <button 
                    v-if="b.booking_status === 'CONFIRMED'"
                    @click="cancelBooking(b)" 
                    class="btn btn-danger btn-sm"
                  >
                    Cancel & Refund
                  </button>
                  <button 
                    v-if="b.booking_status === 'CONFIRMED'"
                    @click="markCompleted(b)" 
                    class="btn btn-outline btn-sm"
                  >
                    Complete
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
  if (confirm(`Cancel booking ${booking.pnr}? Seats will be released back into inventory and status set to REFUNDED.`)) {
    try {
      await adminStore.cancelBookingAdmin(booking.id);
    } catch (err) {
      alert(err.message || 'Failed to cancel booking.');
    }
  }
}

async function markCompleted(booking) {
  try {
    await adminStore.updateBookingStatus(booking.id, { booking_status: 'COMPLETED' });
  } catch (err) {
    alert(err.message || 'Failed to update status.');
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
