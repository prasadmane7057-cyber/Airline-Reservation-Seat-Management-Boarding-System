<template>
  <div class="admin-flights-view">
    <div class="page-top-actions">
      <div>
        <h1 class="page-title mb-0">Flight Records</h1>
        <p class="page-subtitle">Manage only fields supported by the existing flights table.</p>
      </div>
      <button @click="openAddModal" class="btn btn-primary">
        + Add Flight Record
      </button>
    </div>

    <!-- Filter & Search Bar -->
    <div class="card filter-card">
      <div class="filter-row">
        <input 
          type="text" 
          v-model="searchQuery" 
          class="form-input" 
          placeholder="Search by flight number or destination..."
        />
        <input v-model.trim="statusFilter" class="form-input status-select" placeholder="Exact status (optional)" />
      </div>
    </div>

    <!-- Flights Table -->
    <div class="card table-card">
      <div v-if="loading" class="text-center py-32">
        <div class="spinner"></div>
        <p>Loading flight records...</p>
      </div>

      <div v-else-if="adminStore.error" class="empty-state card" role="alert">
        Could not load flight records: {{ adminStore.error }}
      </div>

      <div v-else class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Flight No</th>
              <th>Destination</th>
              <th>Created</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="f in filteredFlights" :key="f.id">
              <td>
                <strong>{{ f.flight_number }}</strong>
              </td>
              <td>{{ f.destination }}</td>
              <td>{{ formatDate(f.created_at) }}</td>
              <td>
                <span class="badge" :class="'badge-' + String(f.status || 'unknown').toLowerCase()">
                  {{ f.status || 'Unknown' }}
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
          <h3>{{ isEditing ? 'Edit Flight Record' : 'Add Flight Record' }}</h3>
          <button @click="showModal = false" class="modal-close">×</button>
        </div>

        <form @submit.prevent="saveFlight">
          <div class="form-group">
            <label class="form-label">Flight Number *</label>
            <input type="text" v-model.trim="form.flight_number" class="form-input" required />
          </div>

          <div class="form-group">
            <label class="form-label">Destination *</label>
            <input type="text" v-model.trim="form.destination" class="form-input" required />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Status</label>
              <input type="text" v-model.trim="form.status" class="form-input" placeholder="Optional" />
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
  destination: '',
  status: ''
});

const loading = computed(() => adminStore.loading);
const flights = computed(() => adminStore.flights);

const filteredFlights = computed(() => {
  return flights.value.filter(f => {
    const matchQuery = !searchQuery.value || 
      String(f.flight_number || '').toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      String(f.destination || '').toLowerCase().includes(searchQuery.value.toLowerCase());

    const matchStatus = !statusFilter.value || f.status === statusFilter.value;
    return matchQuery && matchStatus;
  });
});

onMounted(() => adminStore.fetchAdminFlights());

function openAddModal() {
  isEditing.value = false;
  currentFlightId.value = null;
  form.value = { flight_number: '', destination: '', status: '' };
  showModal.value = true;
}

function openEditModal(flight) {
  isEditing.value = true;
  currentFlightId.value = flight.id;
  form.value = {
    flight_number: flight.flight_number,
    destination: flight.destination,
    status: flight.status || ''
  };
  showModal.value = true;
}

async function saveFlight() {
  saving.value = true;
  try {
    if (isEditing.value) {
      await adminStore.updateFlight(currentFlightId.value, {
        flight_number: form.value.flight_number,
        destination: form.value.destination,
        ...(form.value.status ? { status: form.value.status } : {})
      });
    } else {
      await adminStore.createFlight({
        flight_number: form.value.flight_number,
        destination: form.value.destination,
        ...(form.value.status ? { status: form.value.status } : {})
      });
    }
    showModal.value = false;
  } catch (err) {
    alert(err.message || 'Failed to save flight schedule.');
  } finally {
    saving.value = false;
  }
}

async function confirmDelete(flight) {
  if (confirm(`Are you sure you want to delete flight ${flight.flight_number}? Deletion is blocked if reservations reference it.`)) {
    try {
      await adminStore.deleteFlight(flight.id);
    } catch (err) {
      alert(err.message || 'Failed to delete flight.');
    }
  }
}

function formatDate(str) {
  if (!str) return '';
  return new Date(str).toLocaleDateString();
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
