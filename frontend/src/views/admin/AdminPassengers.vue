<template>
  <div class="admin-passengers-view">
    <div class="page-top-actions">
      <div>
        <h1 class="page-title mb-0">Passenger Directory</h1>
        <p class="page-subtitle">View registered passengers, booking history counts, and account statuses.</p>
      </div>
    </div>

    <!-- Passengers Table -->
    <div class="card table-card">
      <div v-if="loading" class="text-center py-32">
        <div class="spinner"></div>
        <p>Loading passenger directory...</p>
      </div>

      <div v-else class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Passenger Name</th>
              <th>Email Address</th>
              <th>Phone</th>
              <th>Total Bookings</th>
              <th>Active Bookings</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in passengers" :key="p.user_id">
              <td><strong>#{{ p.user_id }}</strong></td>
              <td><strong>{{ p.name }}</strong></td>
              <td>{{ p.email }}</td>
              <td>{{ p.phone || 'N/A' }}</td>
              <td><span class="count-pill">{{ p.total_bookings }}</span></td>
              <td><span class="count-pill active-pill">{{ p.active_bookings }}</span></td>
              <td>
                <span class="badge" :class="p.status === 'ACTIVE' ? 'badge-active' : 'badge-inactive'">
                  {{ p.status }}
                </span>
              </td>
              <td>
                <button 
                  @click="toggleStatus(p)" 
                  class="btn btn-sm"
                  :class="p.status === 'ACTIVE' ? 'btn-danger' : 'btn-success'"
                >
                  {{ p.status === 'ACTIVE' ? 'Deactivate' : 'Activate' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue';
import { useAdminStore } from '../../stores/adminStore';

const adminStore = useAdminStore();

const loading = computed(() => adminStore.loading);
const passengers = computed(() => adminStore.passengers);

onMounted(async () => {
  await adminStore.fetchPassengers();
});

async function toggleStatus(passenger) {
  const newStatus = passenger.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  if (confirm(`Change status of ${passenger.name} to ${newStatus}?`)) {
    try {
      await adminStore.togglePassengerStatus(passenger.user_id, newStatus);
    } catch (err) {
      alert(err.message || 'Failed to update status.');
    }
  }
}
</script>

<style scoped>
.page-top-actions {
  margin-bottom: 24px;
}

.table-card {
  padding: 0;
  overflow: hidden;
}

.count-pill {
  background: #f1f5f9;
  padding: 4px 10px;
  border-radius: 9999px;
  font-weight: 700;
  font-size: 0.8125rem;
}

.active-pill {
  background: var(--success-soft);
  color: #065f46;
}
</style>
