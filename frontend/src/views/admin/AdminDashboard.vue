<template>
  <div class="admin-dashboard-view">
    <div v-if="loading" class="card text-center py-48">
      <div class="spinner"></div>
      <p>Calculating database metrics and revenue statistics...</p>
    </div>

    <div v-else-if="stats" class="dashboard-grid-container">
      <!-- Top Metrics KPIs -->
      <div class="kpi-grid">
        <div class="kpi-card card">
          <div class="kpi-icon blue-grad">✈️</div>
          <div class="kpi-data">
            <span class="kpi-num">{{ stats.totalFlights }}</span>
            <span class="kpi-lbl">Total Flights</span>
          </div>
        </div>

        <div class="kpi-card card">
          <div class="kpi-icon green-grad">👥</div>
          <div class="kpi-data">
            <span class="kpi-num">{{ stats.totalPassengers }}</span>
            <span class="kpi-lbl">Passengers</span>
          </div>
        </div>

        <div class="kpi-card card">
          <div class="kpi-icon gold-grad">📑</div>
          <div class="kpi-data">
            <span class="kpi-num">{{ stats.totalBookings }}</span>
            <span class="kpi-lbl">Total Bookings</span>
          </div>
        </div>

        <div class="kpi-card card">
          <div class="kpi-icon emerald-grad">💰</div>
          <div class="kpi-data">
            <span class="kpi-num">₹{{ stats.totalRevenue.toLocaleString() }}</span>
            <span class="kpi-lbl">Net Revenue</span>
          </div>
        </div>

        <div class="kpi-card card">
          <div class="kpi-icon purple-grad">💺</div>
          <div class="kpi-data">
            <span class="kpi-num">{{ stats.availableSeats }}</span>
            <span class="kpi-lbl">Available Seats</span>
          </div>
        </div>

        <div class="kpi-card card">
          <div class="kpi-icon teal-grad">🚪</div>
          <div class="kpi-data">
            <span class="kpi-num">{{ stats.boardedPassengers }}</span>
            <span class="kpi-lbl">Boarded Pax</span>
          </div>
        </div>

        <div class="kpi-card card">
          <div class="kpi-icon orange-grad">📊</div>
          <div class="kpi-data">
            <span class="kpi-num">{{ stats.occupancyRate }}%</span>
            <span class="kpi-lbl">Cabin Occupancy</span>
          </div>
        </div>

        <div class="kpi-card card">
          <div class="kpi-icon red-grad">🔄</div>
          <div class="kpi-data">
            <span class="kpi-num">{{ stats.cancelledBookings }}</span>
            <span class="kpi-lbl">Cancelled / Refunded</span>
          </div>
        </div>
      </div>

      <!-- Middle Analytics Grid -->
      <div class="analytics-row">
        <!-- Class Distribution Breakdown -->
        <div class="card class-breakdown-card">
          <h3 class="card-title">Bookings Distribution by Travel Class</h3>
          <div class="class-bars-list">
            <div 
              v-for="item in stats.classDistribution" 
              :key="item.travel_class" 
              class="class-bar-item"
            >
              <div class="bar-info-row">
                <span class="class-name">{{ item.travel_class }}</span>
                <span class="class-count"><strong>{{ item.count }}</strong> bookings</span>
              </div>
              <div class="progress-track">
                <div 
                  class="progress-fill" 
                  :class="getClassProgressColor(item.travel_class)"
                  :style="{ width: calculatePercentage(item.count) + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Occupancy Gauge Card -->
        <div class="card occupancy-gauge-card">
          <h3 class="card-title">Live Aircraft Load Factor</h3>
          <div class="gauge-center">
            <div class="radial-ring">
              <span class="ring-val">{{ stats.occupancyRate }}%</span>
              <span class="ring-sub">LOAD FACTOR</span>
            </div>
          </div>
          <p class="gauge-desc">
            Computed from total assigned seats vs total aircraft capacities in active flights.
          </p>
        </div>
      </div>

      <!-- Recent Bookings Table -->
      <div class="card recent-bookings-card">
        <div class="card-title">
          <span>Recent System Bookings</span>
          <router-link to="/admin/bookings" class="btn btn-outline btn-sm">
            View All Global Bookings ➔
          </router-link>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>PNR</th>
                <th>Passenger</th>
                <th>Flight</th>
                <th>Route</th>
                <th>Class</th>
                <th>Fare</th>
                <th>Booking Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="b in stats.recentBookings" :key="b.id">
                <td><strong class="text-blue">{{ b.pnr }}</strong></td>
                <td>{{ b.passenger_name }}</td>
                <td><strong>{{ b.flight_number }}</strong></td>
                <td>{{ b.from_code }} ➔ {{ b.to_code }}</td>
                <td><span class="badge" :class="'badge-' + b.travel_class.toLowerCase().replace(' ', '')">{{ b.travel_class }}</span></td>
                <td><strong>₹{{ (b.total_fare || 0).toLocaleString() }}</strong></td>
                <td>{{ formatDateTime(b.booking_date) }}</td>
                <td><span class="badge" :class="'badge-' + b.booking_status.toLowerCase()">{{ b.booking_status }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue';
import { useAdminStore } from '../../stores/adminStore';

const adminStore = useAdminStore();

const loading = computed(() => adminStore.loading);
const stats = computed(() => adminStore.stats);

onMounted(async () => {
  await adminStore.fetchDashboardStats();
});

function calculatePercentage(count) {
  if (!stats.value || stats.value.confirmedBookings === 0) return 0;
  return Math.round((count / stats.value.confirmedBookings) * 100);
}

function getClassProgressColor(cls) {
  if (cls === 'First Class') return 'bg-first';
  if (cls === 'Business') return 'bg-business';
  return 'bg-economy';
}

function formatDateTime(str) {
  if (!str) return '';
  const d = new Date(str);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}
</script>

<style scoped>
.dashboard-grid-container {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
}

.kpi-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
}

.kpi-icon {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.blue-grad { background: var(--brand-sky-soft); color: var(--brand-blue); }
.green-grad { background: var(--success-soft); color: #065f46; }
.gold-grad { background: var(--brand-gold-soft); color: #92400e; }
.emerald-grad { background: #dcfce7; color: #15803d; }
.purple-grad { background: #ede9fe; color: #6d28d9; }
.teal-grad { background: #ccfbf1; color: #0f766e; }
.orange-grad { background: #ffedd5; color: #c2410c; }
.red-grad { background: var(--danger-soft); color: #991b1b; }

.kpi-data {
  display: flex;
  flex-direction: column;
}

.kpi-num {
  font-size: 1.625rem;
  font-weight: 800;
  color: var(--primary-900);
}

.kpi-lbl {
  font-size: 0.8125rem;
  color: var(--text-muted);
  font-weight: 600;
}

.analytics-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
}

.class-breakdown-card, .occupancy-gauge-card {
  padding: 24px;
}

.class-bars-list {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-top: 16px;
}

.bar-info-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  margin-bottom: 6px;
}

.class-name {
  font-weight: 700;
  color: var(--primary-800);
}

.progress-track {
  width: 100%;
  height: 12px;
  background: #f1f5f9;
  border-radius: 9999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 9999px;
  transition: width 0.6s ease;
}

.bg-first { background: linear-gradient(90deg, #f59e0b, #d97706); }
.bg-business { background: linear-gradient(90deg, #6366f1, #4f46e5); }
.bg-economy { background: linear-gradient(90deg, #0284c7, #0369a1); }

.gauge-center {
  display: flex;
  justify-content: center;
  margin: 20px 0;
}

.radial-ring {
  width: 130px;
  height: 130px;
  border-radius: 50%;
  border: 10px solid var(--brand-sky-soft);
  border-top-color: var(--brand-blue);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.ring-val {
  font-size: 1.75rem;
  font-weight: 900;
  color: var(--primary-900);
}

.ring-sub {
  font-size: 0.625rem;
  color: var(--text-muted);
  font-weight: 800;
  letter-spacing: 0.05em;
}

.gauge-desc {
  font-size: 0.8125rem;
  color: var(--text-muted);
  text-align: center;
  line-height: 1.4;
}

.text-blue {
  color: var(--brand-blue);
}

@media (max-width: 900px) {
  .analytics-row {
    grid-template-columns: 1fr;
  }
}
</style>
