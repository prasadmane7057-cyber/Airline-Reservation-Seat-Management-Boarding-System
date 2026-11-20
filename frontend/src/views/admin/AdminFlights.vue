<template>
  <div class="admin-flights-view">
    <div class="page-top-actions">
      <div>
        <h1 class="page-title mb-0">Flight Schedule &amp; Route Management</h1>
        <p class="page-subtitle">Configure flight routes, departure schedules, aircraft models, and base cabin fares.</p>
      </div>
      <button @click="openAddModal" class="btn btn-primary">
        + Add Flight Schedule
      </button>
    </div>

    <!-- Filter & Search Bar -->
    <div class="card filter-card">
      <div class="filter-row">
        <input 
          type="text" 
          v-model="searchQuery" 
          class="form-input" 
          placeholder="Search by flight number, origin, or destination..."
        />
        <input v-model.trim="statusFilter" class="form-input status-select" placeholder="Filter by status (e.g. On Time)" />
      </div>
    </div>

    <!-- Flights Table -->
    <div class="card table-card">
      <div v-if="loading" class="text-center py-32">
        <div class="spinner"></div>
        <p>Loading flight records &amp; inventory...</p>
      </div>

      <div v-else-if="adminStore.error" class="empty-state card" role="alert">
        Could not load flight records: {{ adminStore.error }}
      </div>

      <div v-else class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Flight No</th>
              <th>Airline &amp; Aircraft</th>
              <th>Route (From ➔ To)</th>
              <th>Schedule</th>
              <th>Available Seats</th>
              <th>Economy Fare</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="f in filteredFlights" :key="f.id">
              <td>
                <strong class="text-blue">{{ f.flight_number }}</strong>
              </td>
              <td>
                <div><strong>{{ f.airline || 'SkyWings' }}</strong></div>
                <span class="aircraft-sub">{{ f.aircraft_model || 'Airbus A320neo' }}</span>
              </td>
              <td>
                <span class="route-tag">
                  {{ f.from_city || 'Mumbai' }} ({{ f.from_code || 'BOM' }})
                  ➔
                  {{ f.to_city || f.destination || 'Delhi' }} ({{ f.to_code || 'DEL' }})
                </span>
              </td>
              <td>
                <div>{{ f.departure_time || '08:00 AM' }} - {{ f.arrival_time || '10:15 AM' }}</div>
                <small class="text-muted">{{ f.duration || '2h 15m' }} Non-stop</small>
              </td>
              <td>
                <span class="inventory-badge">
                  {{ f.available_seats !== undefined ? f.available_seats : (f.total_seats || 116) }} / {{ f.total_seats || 116 }}
                </span>
              </td>
              <td>
                <strong>₹{{ (f.economy_fare || 5000).toLocaleString() }}</strong>
              </td>
              <td>
                <span class="badge" :class="'badge-' + String(f.status || 'ontime').toLowerCase().replace(' ', '')">
                  {{ f.status || 'On Time' }}
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
          <h3>{{ isEditing ? 'Edit Flight Schedule' : 'Create New Flight Route' }}</h3>
          <button @click="showModal = false" class="modal-close">×</button>
        </div>

        <form @submit.prevent="saveFlight">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Flight Number *</label>
              <input type="text" v-model.trim="form.flight_number" class="form-input" placeholder="e.g. AI-505" required />
            </div>
            <div class="form-group">
              <label class="form-label">Airline Name</label>
              <input type="text" v-model.trim="form.airline" class="form-input" placeholder="e.g. SkyWings Airlines" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Origin City (From) *</label>
              <input type="text" v-model.trim="form.from_city" class="form-input" placeholder="e.g. Mumbai" required />
            </div>
            <div class="form-group">
              <label class="form-label">Origin Airport Code *</label>
              <input type="text" v-model.trim="form.from_code" class="form-input" placeholder="e.g. BOM" required />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Destination City (To) *</label>
              <input type="text" v-model.trim="form.to_city" class="form-input" placeholder="e.g. Delhi" required />
            </div>
            <div class="form-group">
              <label class="form-label">Destination Airport Code *</label>
              <input type="text" v-model.trim="form.to_code" class="form-input" placeholder="e.g. DEL" required />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Departure Time</label>
              <input type="text" v-model.trim="form.departure_time" class="form-input" placeholder="e.g. 09:30 AM" />
            </div>
            <div class="form-group">
              <label class="form-label">Arrival Time</label>
              <input type="text" v-model.trim="form.arrival_time" class="form-input" placeholder="e.g. 11:45 AM" />
            </div>
            <div class="form-group">
              <label class="form-label">Duration</label>
              <input type="text" v-model.trim="form.duration" class="form-input" placeholder="e.g. 2h 15m" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Economy Fare (₹)</label>
              <input type="number" v-model.number="form.economy_fare" class="form-input" placeholder="5000" />
            </div>
            <div class="form-group">
              <label class="form-label">Business Fare (₹)</label>
              <input type="number" v-model.number="form.business_fare" class="form-input" placeholder="10000" />
            </div>
            <div class="form-group">
              <label class="form-label">First Class Fare (₹)</label>
              <input type="number" v-model.number="form.first_class_fare" class="form-input" placeholder="20000" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Aircraft Model</label>
              <input type="text" v-model.trim="form.aircraft_model" class="form-input" placeholder="e.g. Airbus A320neo" />
            </div>
            <div class="form-group">
              <label class="form-label">Flight Status</label>
              <select v-model="form.status" class="form-select">
                <option value="On Time">On Time</option>
                <option value="Delayed">Delayed</option>
                <option value="Boarding">Boarding</option>
                <option value="Departed">Departed</option>
                <option value="Cancelled">Cancelled</option>
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

const adminStore = useAdminStore();

const searchQuery = ref('');
const statusFilter = ref('');
const showModal = ref(false);
const isEditing = ref(false);
const currentFlightId = ref(null);
const saving = ref(false);

const form = ref({
  flight_number: '',
  airline: 'SkyWings Airlines',
  from_city: 'Mumbai',
  from_code: 'BOM',
  to_city: '',
  to_code: '',
  destination: '',
  departure_time: '09:00 AM',
  arrival_time: '11:15 AM',
  duration: '2h 15m',
  economy_fare: 5000,
  business_fare: 10000,
  first_class_fare: 20000,
  aircraft_model: 'Airbus A320neo',
  status: 'On Time'
});

const loading = computed(() => adminStore.loading);
const flights = computed(() => adminStore.flights);

const filteredFlights = computed(() => {
  return flights.value.filter(f => {
    const q = searchQuery.value.toLowerCase();
    const matchQuery = !q || 
      String(f.flight_number || '').toLowerCase().includes(q) ||
      String(f.from_city || '').toLowerCase().includes(q) ||
      String(f.from_code || '').toLowerCase().includes(q) ||
      String(f.to_city || '').toLowerCase().includes(q) ||
      String(f.to_code || '').toLowerCase().includes(q) ||
      String(f.destination || '').toLowerCase().includes(q);

    const matchStatus = !statusFilter.value || (f.status && f.status.toLowerCase() === statusFilter.value.toLowerCase());
    return matchQuery && matchStatus;
  });
});

onMounted(() => adminStore.fetchAdminFlights());

function openAddModal() {
  isEditing.value = false;
  currentFlightId.value = null;
  form.value = {
    flight_number: '',
    airline: 'SkyWings Airlines',
    from_city: 'Mumbai',
    from_code: 'BOM',
    to_city: '',
    to_code: '',
    destination: '',
    departure_time: '09:00 AM',
    arrival_time: '11:15 AM',
    duration: '2h 15m',
    economy_fare: 5000,
    business_fare: 10000,
    first_class_fare: 20000,
    aircraft_model: 'Airbus A320neo',
    status: 'On Time'
  };
  showModal.value = true;
}

function openEditModal(flight) {
  isEditing.value = true;
  currentFlightId.value = flight.id;
  form.value = {
    flight_number: flight.flight_number,
    airline: flight.airline || 'SkyWings Airlines',
    from_city: flight.from_city || 'Mumbai',
    from_code: flight.from_code || 'BOM',
    to_city: flight.to_city || flight.destination || 'Delhi',
    to_code: flight.to_code || 'DEL',
    destination: flight.destination || flight.to_city || 'Delhi',
    departure_time: flight.departure_time || '09:00 AM',
    arrival_time: flight.arrival_time || '11:15 AM',
    duration: flight.duration || '2h 15m',
    economy_fare: flight.economy_fare || 5000,
    business_fare: flight.business_fare || 10000,
    first_class_fare: flight.first_class_fare || 20000,
    aircraft_model: flight.aircraft_model || 'Airbus A320neo',
    status: flight.status || 'On Time'
  };
  showModal.value = true;
}

async function saveFlight() {
  saving.value = true;
  form.value.destination = form.value.to_city;
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
  if (confirm(`Are you sure you want to delete flight ${flight.flight_number}?`)) {
    try {
      await adminStore.deleteFlight(flight.id);
    } catch (err) {
      alert(err.message || 'Failed to delete flight.');
    }
  }
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
  max-width: 240px;
}

.table-card {
  padding: 0;
  overflow: hidden;
}

.text-blue {
  color: var(--brand-blue);
  font-size: 1rem;
}

.aircraft-sub {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.route-tag {
  font-weight: 700;
  color: var(--primary-900);
}

.inventory-badge {
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
  padding: 3px 8px;
  border-radius: 4px;
  font-weight: 700;
  font-size: 0.8125rem;
}

.action-buttons {
  display: flex;
  gap: 6px;
}

.modal-lg {
  max-width: 780px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}
</style>
