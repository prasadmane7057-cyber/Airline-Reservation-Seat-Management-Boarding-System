<template>
  <div class="admin-boarding-view">
    <div class="page-top-actions">
      <div>
        <h1 class="page-title mb-0">Boarding & Gate Operations</h1>
        <p class="page-subtitle">Manage passenger check-ins, gate manifests, and the multi-phase boarding lifecycle.</p>
      </div>
    </div>

    <!-- Flight Selector -->
    <div class="card flight-selector-card">
      <div class="selector-row">
        <div class="form-group mb-0">
          <label class="form-label">Select Flight Schedule</label>
          <select v-model.number="selectedFlightId" class="form-select" @change="loadManifest">
            <option v-for="f in flights" :key="f.id" :value="f.id">
              {{ f.flight_number }} : {{ f.from_code }} ({{ f.from_city }}) ➔ {{ f.to_code }} ({{ f.to_city }}) [{{ f.departure_time ? f.departure_time.split('T')[0] : '' }}]
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Manifest Table -->
    <div class="card table-card">
      <div class="card-header-bar">
        <h3 class="card-title mb-0">
          Passenger Flight Manifest
          <span class="count-tag" v-if="manifest.length > 0">({{ manifest.length }} Booked Passengers)</span>
        </h3>
      </div>

      <div v-if="loading" class="text-center py-32">
        <div class="spinner"></div>
        <p>Loading boarding manifest for selected flight...</p>
      </div>

      <div v-else-if="manifest.length === 0" class="empty-manifest py-32 text-center">
        <div class="empty-icon">🚪</div>
        <h3>No passengers checked in or booked for this flight</h3>
        <p>Passengers with confirmed bookings will automatically appear in this gate manifest.</p>
      </div>

      <div v-else class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Seat</th>
              <th>Passenger Name</th>
              <th>PNR</th>
              <th>Class</th>
              <th>Gate / Group</th>
              <th>Check-in Status</th>
              <th>Boarding Status</th>
              <th>Gate Action (Sequential Lifecycle)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in manifest" :key="p.boarding_id">
              <td><span class="seat-badge-bold">{{ p.seat_number }}</span></td>
              <td>
                <div><strong>{{ p.passenger_name }}</strong></div>
                <div class="age-sub">{{ p.age }} yrs • {{ p.gender }}</div>
              </td>
              <td><strong class="pnr-tag">{{ p.pnr }}</strong></td>
              <td><span class="badge" :class="'badge-' + (p.travel_class ? p.travel_class.toLowerCase().replace(' ', '') : 'economy')">{{ p.travel_class }}</span></td>
              <td>
                <div><strong>{{ p.gate || 'Gate 3B' }}</strong></div>
                <div class="age-sub">{{ p.boarding_group || 'Group 2' }}</div>
              </td>
              <td>
                <span class="badge" :class="p.check_in_status === 'CHECKED_IN' ? 'badge-confirmed' : 'badge-pending'">
                  {{ p.check_in_status }}
                </span>
              </td>
              <td>
                <span class="badge" :class="'badge-' + p.boarding_status.toLowerCase()">
                  {{ p.boarding_status }}
                </span>
              </td>
              <td>
                <div class="lifecycle-buttons">
                  <!-- Step 1: Check-in -->
                  <button 
                    v-if="p.boarding_status === 'NOT_CHECKED_IN'"
                    @click="updateStatus(p.boarding_id, 'CHECKED_IN')" 
                    class="btn btn-outline btn-sm"
                  >
                    1. Check In
                  </button>

                  <!-- Step 2: Mark Boarding -->
                  <button 
                    v-if="p.boarding_status === 'CHECKED_IN'"
                    @click="updateStatus(p.boarding_id, 'BOARDING')" 
                    class="btn btn-gold btn-sm"
                  >
                    2. Mark Boarding
                  </button>

                  <!-- Step 3: Mark Boarded -->
                  <button 
                    v-if="p.boarding_status === 'BOARDING'"
                    @click="updateStatus(p.boarding_id, 'BOARDED')" 
                    class="btn btn-success btn-sm"
                  >
                    3. Mark Boarded ✓
                  </button>

                  <!-- Completed State -->
                  <span v-if="p.boarding_status === 'BOARDED'" class="boarded-check">
                    ✓ Passenger on Board
                  </span>
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

const selectedFlightId = ref(1);

const loading = computed(() => adminStore.loading);
const flights = computed(() => adminStore.flights);
const manifest = computed(() => adminStore.boardingManifest);

onMounted(async () => {
  await adminStore.fetchAdminFlights();
  if (flights.value.length > 0) {
    selectedFlightId.value = flights.value[0].id;
    await loadManifest();
  }
});

async function loadManifest() {
  if (selectedFlightId.value) {
    await adminStore.fetchBoardingManifest(selectedFlightId.value);
  }
}

async function updateStatus(boardingId, nextStatus) {
  try {
    await adminStore.updateBoardingStatus(boardingId, nextStatus);
  } catch (err) {
    alert(err.message || 'Failed to update boarding status.');
  }
}
</script>

<style scoped>
.page-top-actions {
  margin-bottom: 24px;
}

.flight-selector-card {
  padding: 20px;
  margin-bottom: 24px;
}

.selector-row {
  max-width: 600px;
}

.mb-0 {
  margin-bottom: 0;
}

.table-card {
  padding: 0;
  overflow: hidden;
}

.card-header-bar {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
}

.count-tag {
  color: var(--brand-blue);
}

.seat-badge-bold {
  font-weight: 900;
  font-size: 1rem;
  color: #92400e;
  background: #fef3c7;
  padding: 4px 10px;
  border-radius: 6px;
}

.age-sub {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.pnr-tag {
  color: var(--brand-blue);
}

.lifecycle-buttons {
  display: flex;
  align-items: center;
  gap: 6px;
}

.boarded-check {
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--success);
}
</style>
