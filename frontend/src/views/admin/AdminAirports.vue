<template>
  <div class="admin-airports-view">
    <div class="page-top-actions">
      <div>
        <h1 class="page-title mb-0">Airport Hubs & Terminals</h1>
        <p class="page-subtitle">Manage domestic and international airport destinations in the airline network.</p>
      </div>
      <button @click="openAddModal" class="btn btn-primary">
        + Add Airport Hub
      </button>
    </div>

    <!-- Airports Table -->
    <div class="card table-card">
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Airport Code</th>
              <th>Airport Full Name</th>
              <th>City</th>
              <th>Country</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="a in airports" :key="a.id">
              <td><span class="code-badge">{{ a.airport_code }}</span></td>
              <td><strong>{{ a.airport_name }}</strong></td>
              <td>{{ a.city }}</td>
              <td>{{ a.country }}</td>
              <td>
                <div class="action-buttons">
                  <button @click="openEditModal(a)" class="btn btn-outline btn-sm">Edit</button>
                  <button @click="confirmDelete(a)" class="btn btn-danger btn-sm">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add / Edit Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3>{{ isEditing ? 'Edit Airport' : 'Add Airport Hub' }}</h3>
          <button @click="showModal = false" class="modal-close">×</button>
        </div>

        <form @submit.prevent="saveAirport">
          <div class="form-group">
            <label class="form-label">IATA Airport Code (3 Letters) *</label>
            <input 
              type="text" 
              v-model="form.airport_code" 
              class="form-input" 
              placeholder="e.g. BOM" 
              maxlength="10" 
              required 
            />
          </div>

          <div class="form-group">
            <label class="form-label">Airport Name *</label>
            <input 
              type="text" 
              v-model="form.airport_name" 
              class="form-input" 
              placeholder="e.g. Chhatrapati Shivaji Maharaj International Airport" 
              required 
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">City *</label>
              <input 
                type="text" 
                v-model="form.city" 
                class="form-input" 
                placeholder="e.g. Mumbai" 
                required 
              />
            </div>

            <div class="form-group">
              <label class="form-label">Country *</label>
              <input 
                type="text" 
                v-model="form.country" 
                class="form-input" 
                placeholder="e.g. India" 
                required 
              />
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" @click="showModal = false" class="btn btn-outline">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              <span v-if="saving">Saving...</span>
              <span v-else>{{ isEditing ? 'Update Airport' : 'Create Airport' }}</span>
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

const showModal = ref(false);
const isEditing = ref(false);
const currentAirportId = ref(null);
const saving = ref(false);

const form = ref({
  airport_code: '',
  airport_name: '',
  city: '',
  country: 'India'
});

const airports = computed(() => adminStore.airports);

onMounted(async () => {
  await adminStore.fetchAirports();
});

function openAddModal() {
  isEditing.value = false;
  currentAirportId.value = null;
  form.value = {
    airport_code: '',
    airport_name: '',
    city: '',
    country: 'India'
  };
  showModal.value = true;
}

function openEditModal(airport) {
  isEditing.value = true;
  currentAirportId.value = airport.id;
  form.value = {
    airport_code: airport.airport_code,
    airport_name: airport.airport_name,
    city: airport.city,
    country: airport.country
  };
  showModal.value = true;
}

async function saveAirport() {
  saving.value = true;
  try {
    if (isEditing.value) {
      await adminStore.updateAirport(currentAirportId.value, form.value);
    } else {
      await adminStore.createAirport(form.value);
    }
    showModal.value = false;
  } catch (err) {
    alert(err.message || 'Failed to save airport.');
  } finally {
    saving.value = false;
  }
}

async function confirmDelete(airport) {
  if (confirm(`Delete airport ${airport.airport_code} (${airport.city})?`)) {
    try {
      await adminStore.deleteAirport(airport.id);
    } catch (err) {
      alert(err.message || 'Failed to delete airport.');
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

.table-card {
  padding: 0;
  overflow: hidden;
}

.code-badge {
  background: var(--brand-sky-soft);
  color: var(--brand-blue);
  padding: 4px 10px;
  border-radius: 6px;
  font-weight: 800;
  letter-spacing: 0.05em;
}

.action-buttons {
  display: flex;
  gap: 6px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}
</style>
