<template>
  <div class="admin-airports-view">
    <div class="page-top-actions">
      <div>
        <h1 class="page-title mb-0">Airport &amp; Route Hubs</h1>
        <p class="page-subtitle">Manage domestic and international airport nodes, IATA codes, and hub status.</p>
      </div>
      <button @click="showAddModal = true" class="btn btn-primary">
        + Add Airport Hub
      </button>
    </div>

    <!-- Airports Table -->
    <div class="card table-card">
      <div v-if="loading" class="text-center py-32">
        <div class="spinner"></div>
        <p>Loading airport hubs...</p>
      </div>

      <div v-else-if="adminStore.error" class="empty-state card" role="alert">
        Could not load airport records: {{ adminStore.error }}
      </div>

      <div v-else class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>IATA Code</th>
              <th>Airport Name</th>
              <th>City</th>
              <th>Country</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="a in airports" :key="a.airport_code">
              <td>
                <strong class="iata-tag">{{ a.airport_code }}</strong>
              </td>
              <td>{{ a.airport_name }}</td>
              <td>{{ a.city }}</td>
              <td>{{ a.country || 'India' }}</td>
              <td>
                <span class="badge badge-ontime">Active</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add Airport Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Add Airport Hub</h3>
          <button @click="showAddModal = false" class="modal-close">×</button>
        </div>

        <form @submit.prevent="saveAirport">
          <div class="form-group">
            <label class="form-label">IATA Code (3 Letters) *</label>
            <input type="text" v-model.trim="form.airport_code" class="form-input" maxlength="3" placeholder="e.g. MAA" required />
          </div>

          <div class="form-group">
            <label class="form-label">Airport Name *</label>
            <input type="text" v-model.trim="form.airport_name" class="form-input" placeholder="e.g. Chennai International Airport" required />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">City *</label>
              <input type="text" v-model.trim="form.city" class="form-input" placeholder="e.g. Chennai" required />
            </div>
            <div class="form-group">
              <label class="form-label">Country</label>
              <input type="text" v-model.trim="form.country" class="form-input" placeholder="India" />
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" @click="showAddModal = false" class="btn btn-outline">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              <span v-if="saving">Adding...</span>
              <span v-else>Save Airport</span>
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

const showAddModal = ref(false);
const saving = ref(false);
const form = ref({
  airport_code: '',
  airport_name: '',
  city: '',
  country: 'India'
});

const loading = computed(() => adminStore.loading);
const airports = computed(() => adminStore.airports);

onMounted(() => adminStore.fetchAirports());

async function saveAirport() {
  saving.value = true;
  try {
    await adminStore.createAirport(form.value);
    showAddModal.value = false;
    form.value = { airport_code: '', airport_name: '', city: '', country: 'India' };
  } catch (err) {
    alert(err.message || 'Failed to save airport.');
  } finally {
    saving.value = false;
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

.iata-tag {
  background: var(--brand-sky-soft);
  color: var(--brand-blue);
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.9375rem;
  letter-spacing: 0.05em;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}
</style>
