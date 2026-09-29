<template>
  <div class="admin-flights-view">
    <div class="page-top-actions">
      <div>
        <h1 class="page-title mb-0">Flight Schedule Management</h1>
        <p class="page-subtitle">Configure routes, timings, class fare tiers, and aircraft allocations.</p>
      </div>
      <button @click="openAddModal" class="btn btn-primary">
        + Add New Flight Schedule
      </button>
    </div>

    <!-- Filter & Search Bar -->
    <div class="card filter-card">
      <div class="filter-row">
        <input 
          type="text" 
          v-model="searchQuery" 
          class="form-input" 
          placeholder="Search by flight number or city..." 
        />
        <select v-model="statusFilter" class="form-select status-select">
          <option value="">All Statuses</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="DELAYED">Delayed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>
    </div>

    <!-- Flights Table -->
    <div class="card table-card">
      <div v-if="loading" class="text-center py-32">
        <div class="spinner"></div>
        <p>Loading flight schedules...</p>
      </div>

      <div v-else class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Flight No</th>
              <th>Origin ➔ Destination</th>
              <th>Departure</th>
              <th>Arrival</th>
              <th>Duration</th>
              <th>Fares (Eco / Bus / First)</th>
              <th>Seats Avail</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="f in filteredFlights" :key="f.id">
              <td>
                <strong>{{ f.flight_number }}</strong>
                <div class="aircraft-sub">{{ f.airline }}</div>
              </td>
              <td>
                <div><strong>{{ f.from_code }}</strong> ({{ f.from_city }})</div>
                <div>➔ <strong>{{ f.to_code }}</strong> ({{ f.to_city }})</div>
              </td>
              <td>{{ formatDateTime(f.departure_time) }}</td>
              <td>{{ formatDateTime(f.arrival_time) }}</td>
              <td>{{ f.duration }}</td>
              <td>
                <div class="fare-triplet">
                  <span>₹{{ f.economy_fare }}</span> / 
                  <span>₹{{ f.business_fare }}</span> / 
                  <span>₹{{ f.first_class_fare }}</span>
                </div>
              </td>
              <td><strong>{{ f.available_seats }}</strong> / {{ f.total_seats }}</td>
              <td>
                <span class="badge" :class="'badge-' + f.status.toLowerCase()">
                  {{ f.status }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button @click="openEditModal(f)" class="btn btn-outline btn-sm">Edit</button>
                  <button @click="confirmDelete(f)" class="btn btn-danger btn-sm">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add / Edit Flight Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-card modal-lg">
        <div class="modal-header">
          <h3>{{ isEditing ? 'Edit Flight Schedule' : 'Add New Flight Schedule' }}</h3>
          <button @click="showModal = false" class="modal-close">×</button>
        </div>

        <form @submit.prevent="saveFlight">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Flight Number *</label>
              <input type="text" v-model="form.flight_number" class="form-input" placeholder="e.g. AI707" required />
            </div>

            <div class="form-group">
              <label class="form-label">Airline Name</label>
              <input type="text" v-model="form.airline" class="form-input" placeholder="SkyWings Airlines" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Origin Airport *</label>
              <select v-model.number="form.from_airport_id" class="form-select" required>
                <option value="" disabled>Select Origin</option>
                <option v-for="apt in airports" :key="apt.id" :value="apt.id">
                  {{ apt.city }} ({{ apt.airport_code }}) - {{ apt.airport_name }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Destination Airport *</label>
              <select v-model.number="form.to_airport_id" class="form-select" required>
                <option value="" disabled>Select Destination</option>
                <option v-for="apt in airports" :key="apt.id" :value="apt.id">
                  {{ apt.city }} ({{ apt.airport_code }}) - {{ apt.airport_name }}
                </option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Departure Date & Time *</label>
              <input type="datetime-local" v-model="form.departure_time" class="form-input" required />
            </div>

            <div class="form-group">
              <label class="form-label">Arrival Date & Time *</label>
              <input type="datetime-local" v-model="form.arrival_time" class="form-input" required />
            </div>

            <div class="form-group">
              <label class="form-label">Duration</label>
              <input type="text" v-model="form.duration" class="form-input" placeholder="e.g. 2h 15m" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Economy Fare (₹) *</label>
              <input type="number" v-model.number="form.economy_fare" class="form-input" required />
            </div>

            <div class="form-group">
              <label class="form-label">Business Fare (₹) *</label>
              <input type="number" v-model.number="form.business_fare" class="form-input" required />
            </div>

            <div class="form-group">
              <label class="form-label">First Class Fare (₹) *</label>
              <input type="number" v-model.number="form.first_class_fare" class="form-input" required />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Status</label>
              <select v-model="form.status" class="form-select">
                <option value="SCHEDULED">SCHEDULED</option>
                <option value="DELAYED">DELAYED</option>
                <option value="CANCELLED">CANCELLED</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" @click="showModal = false" class="btn btn-outline">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              <span v-if="saving">Saving...</span>
              <span v-else>{{ isEditing ? 'Update Flight' : 'Create Flight' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAdminStore } from '../../stores/adminStore';
import { useFlightStore } from '../../stores/flightStore';

const adminStore = useAdminStore();
const flightStore = useFlightStore();

const searchQuery = ref('');
const statusFilter = ref('');
const showModal = ref(false);
const isEditing = ref(false);
const currentFlightId = ref(null);
const saving = ref(false);

const form = ref({
  flight_number: '',
  airline: 'SkyWings Airlines',
  aircraft_id: 1,
  from_airport_id: '',
  to_airport_id: '',
  departure_time: '',
  arrival_time: '',
  duration: '2h 15m',
  economy_fare: 4500,
  business_fare: 11500,
  first_class_fare: 21000,
  total_seats: 116,
  status: 'SCHEDULED'
});

const loading = computed(() => adminStore.loading);
const flights = computed(() => adminStore.flights);
const airports = computed(() => flightStore.airports);

const filteredFlights = computed(() => {
  return flights.value.filter(f => {
    const matchQuery = !searchQuery.value || 
      f.flight_number.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      f.from_city?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      f.to_city?.toLowerCase().includes(searchQuery.value.toLowerCase());

    const matchStatus = !statusFilter.value || f.status === statusFilter.value;
    return matchQuery && matchStatus;
  });
});

onMounted(async () => {
  await flightStore.fetchAirports();
  await adminStore.fetchAdminFlights();
});

function openAddModal() {
  isEditing.value = false;
  currentFlightId.value = null;
  form.value = {
    flight_number: '',
    airline: 'SkyWings Airlines',
    aircraft_id: 1,
    from_airport_id: airports.value[0]?.id || 1,
    to_airport_id: airports.value[1]?.id || 2,
    departure_time: '2026-10-20T08:00',
    arrival_time: '2026-10-20T10:15',
    duration: '2h 15m',
    economy_fare: 4500,
    business_fare: 11500,
    first_class_fare: 21000,
    total_seats: 116,
    status: 'SCHEDULED'
  };
  showModal.value = true;
}

function openEditModal(flight) {
  isEditing.value = true;
  currentFlightId.value = flight.id;
  form.value = {
    flight_number: flight.flight_number,
    airline: flight.airline,
    aircraft_id: flight.aircraft_id || 1,
    from_airport_id: flight.from_airport_id,
    to_airport_id: flight.to_airport_id,
    departure_time: flight.departure_time ? flight.departure_time.substring(0, 16) : '',
    arrival_time: flight.arrival_time ? flight.arrival_time.substring(0, 16) : '',
    duration: flight.duration,
    economy_fare: flight.economy_fare,
    business_fare: flight.business_fare,
    first_class_fare: flight.first_class_fare,
    total_seats: flight.total_seats,
    status: flight.status
  };
  showModal.value = true;
}

async function saveFlight() {
  saving.value = true;
  try {
    if (isEditing.value) {
      await adminStore.updateFlight(currentFlightId.value, form.value);
    } else {
      await adminStore.createFlight(form.value);
    }
    showModal.value = false;
  } catch (err) {
    alert(err.message || 'Failed to save flight schedule.');
  } finally {
    saving.value = false;
  }
}

async function confirmDelete(flight) {
  if (confirm(`Are you sure you want to delete flight ${flight.flight_number}? This will remove all associated seats.`)) {
    try {
      await adminStore.deleteFlight(flight.id);
    } catch (err) {
      alert(err.message || 'Failed to delete flight.');
    }
  }
}

function formatDateTime(str) {
  if (!str) return '';
  const d = new Date(str);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}
</script>

<style scoped>
.page-top-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.filter-card {
  padding: 16px;
  margin-bottom: 24px;
}

.filter-row {
  display: flex;
  gap: 16px;
}

.status-select {
  max-width: 220px;
}

.table-card {
  padding: 0;
  overflow: hidden;
}

.aircraft-sub {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.fare-triplet {
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--primary-800);
}

.action-buttons {
  display: flex;
  gap: 6px;
}

.modal-lg {
  max-width: 720px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}
</style>
