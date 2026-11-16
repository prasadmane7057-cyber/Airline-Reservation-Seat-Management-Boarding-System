<template>
  <div class="admin-passengers-view">
    <div class="page-top-actions">
      <div>
        <h1 class="page-title mb-0">Passenger Directory</h1>
        <p class="page-subtitle">View passenger records and their booking counts.</p>
      </div>
    </div>

    <!-- Passengers Table -->
    <div class="card table-card">
      <div v-if="loading" class="text-center py-32">
        <div class="spinner"></div>
        <p>Loading passenger directory...</p>
      </div>

      <div v-else-if="adminStore.error" class="empty-state card" role="alert">
        Could not load passengers: {{ adminStore.error }}
      </div>

      <div v-else class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Passenger ID</th>
              <th>Passenger Name</th>
              <th>Email Address</th>
              <th>Phone</th>
              <th>Total Bookings</th>
              <th>Active Bookings</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in passengers" :key="p.id">
              <td><strong>#{{ p.id }}</strong></td>
              <td><strong>{{ p.full_name }}</strong></td>
              <td>{{ p.email }}</td>
              <td>{{ p.phone || 'N/A' }}</td>
              <td><span class="count-pill">{{ p.total_bookings }}</span></td>
              <td><span class="count-pill active-pill">{{ p.active_bookings }}</span></td>
              <td>{{ formatDate(p.created_at) }}</td>
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

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : 'Unavailable';
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
