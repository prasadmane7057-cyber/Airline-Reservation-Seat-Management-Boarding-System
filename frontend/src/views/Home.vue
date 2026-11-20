<template>
  <div class="home-page">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-backdrop"></div>
      <div class="container hero-content">
        <div class="hero-badge">
          SkyWings Airlines · Reservation &amp; Seat Management System
        </div>
        <h1 class="hero-title">
          Fly Smarter. <span class="gradient-text">Travel Better.</span>
        </h1>
        <p class="hero-subtitle">
          Experience seamless online flight reservations, interactive 116-seat aircraft selection, instant digital boarding passes, and real-time flight operations.
        </p>

        <div class="search-widget card">
          <form @submit.prevent="handleSearch" class="search-form-grid">
            <div class="form-group">
              <label class="form-label" for="origin">From (Origin)</label>
              <input id="origin" v-model.trim="form.from" class="form-input" placeholder="e.g. Mumbai, BOM" />
            </div>

            <div class="form-group">
              <label class="form-label" for="destination">To (Destination)</label>
              <input id="destination" v-model.trim="form.to" class="form-input" placeholder="e.g. Pune, Delhi, BLR" />
            </div>

            <div class="form-group">
              <label class="form-label" for="cabin-class">Class</label>
              <select id="cabin-class" v-model="form.travelClass" class="form-select">
                <option value="Economy">Economy</option>
                <option value="Business">Business</option>
                <option value="First Class">First Class</option>
              </select>
            </div>

            <div class="form-submit-cell">
              <button type="submit" class="btn btn-gold btn-lg btn-full search-btn">
                🔍 Search Flights
              </button>
            </div>
          </form>

          <div v-if="validationError" class="validation-msg">
            ⚠️ {{ validationError }}
          </div>
          <div v-if="flightStore.error" class="validation-msg" role="alert">
            Could not load flights: {{ flightStore.error }}
          </div>
        </div>
      </div>
    </section>

    <!-- Available Flights Grid -->
    <section class="section popular-routes container">
      <div class="section-header">
        <h2 class="section-title">Featured Direct Flights</h2>
        <p class="section-desc">Real-time scheduled domestic routes with live seat inventory and instant boarding pass issuance.</p>
      </div>

      <div v-if="flightStore.loading" class="card text-center py-48" role="status">Loading flights…</div>
      <div v-else-if="flightStore.flights.length === 0" class="card text-center py-48">
        No flight records match the current search.
      </div>
      <div v-else class="routes-grid">
        <div class="route-card card" v-for="flight in flightStore.flights" :key="flight.id">
          <div class="route-info">
            <div class="flight-top-row">
              <div class="route-cities">
                <span>{{ flight.flight_number }}</span>
                <span class="flight-airline-sub">{{ flight.airline || 'SkyWings' }}</span>
              </div>
              <span class="badge" :class="'badge-' + String(flight.status || 'ontime').toLowerCase().replace(' ', '')">
                {{ flight.status || 'On Time' }}
              </span>
            </div>

            <div class="route-endpoints">
              <div class="endpoint">
                <span class="code">{{ flight.from_code || 'BOM' }}</span>
                <span class="city">{{ flight.from_city || 'Origin' }}</span>
                <span class="time">{{ flight.departure_time || '08:00 AM' }}</span>
              </div>
              <div class="route-arrow-box">
                <span class="duration">{{ flight.duration || '2h 15m' }}</span>
                <span class="arrow-sym">✈ ➔</span>
                <span class="stop">Direct</span>
              </div>
              <div class="endpoint text-right">
                <span class="code">{{ flight.to_code || 'DEL' }}</span>
                <span class="city">{{ flight.to_city || flight.destination || 'Destination' }}</span>
                <span class="time">{{ flight.arrival_time || '10:15 AM' }}</span>
              </div>
            </div>

            <div class="route-inventory-chip">
              💺 <strong>{{ flight.available_seats !== undefined ? flight.available_seats : (flight.total_seats || 116) }}</strong> seats available
            </div>

            <div class="route-footer">
              <div class="fare-tag">
                <span class="from-txt">Fares From</span>
                <span class="fare-val">₹{{ (flight.economy_fare || 5000).toLocaleString() }}</span>
              </div>
              <button @click="viewFlight(flight)" class="btn btn-outline btn-sm">Select Seat ➔</button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Key Platform Features -->
    <section class="section features-section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">Platform Features &amp; Architecture</h2>
          <p class="section-desc">Engineered with high concurrency seat locking, real-time inventory synchronization, and digital boarding passes.</p>
        </div>

        <div class="features-grid">
          <div class="feature-card card">
            <div class="feature-icon">💺</div>
            <h3>116-Seat Cabin Layout</h3>
            <p>Interactive seat selection with distinct First Class, Business Class, and Economy sections with emergency exit restrictions.</p>
          </div>

          <div class="feature-card card">
            <div class="feature-icon">🎫</div>
            <h3>Instant PNR &amp; Confirmation</h3>
            <p>Automated PNR generation with persistent booking records, passenger manifest linkage, and one-click cancellation.</p>
          </div>

          <div class="feature-card card">
            <div class="feature-icon">🛡️</div>
            <h3>Live Seat Inventory</h3>
            <p>Real-time seat state tracking preventing overbooking; cancelling any reservation immediately restores the available seat count.</p>
          </div>

          <div class="feature-card card">
            <div class="feature-icon">📱</div>
            <h3>Digital Boarding Pass &amp; Check-In</h3>
            <p>Self check-in workflow with gate assignment, boarding group priority, and scannable QR ticket verification.</p>
          </div>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useFlightStore } from '../stores/flightStore';

defineOptions({ name: 'HomePage' });

const router = useRouter();
const flightStore = useFlightStore();

const validationError = ref('');
const form = ref({
  from: '',
  to: '',
  travelClass: 'Economy'
});

onMounted(() => flightStore.searchFlights().catch(() => {}));

async function handleSearch() {
  const params = {
    from: form.value.from,
    to: form.value.to,
    travelClass: form.value.travelClass
  };
  validationError.value = '';
  flightStore.setSearchParams(params);
  router.push({ path: '/flights', query: params });
}

function viewFlight(flight) {
  router.push(`/flights/${flight.id}`);
}
</script>

<style scoped>
.hero-section {
  position: relative;
  background: linear-gradient(180deg, #090d16 0%, #0f172a 60%, #1e293b 100%);
  color: #ffffff;
  padding: 80px 0 100px 0;
  overflow: hidden;
}

.hero-backdrop {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle at 50% 20%, rgba(2, 132, 199, 0.25) 0%, transparent 70%);
  pointer-events: none;
}

.hero-content {
  position: relative;
  z-index: 2;
  text-align: center;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 8px 18px;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 24px;
  backdrop-filter: blur(8px);
}

.hero-title {
  font-size: 3.25rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #ffffff;
  margin-bottom: 18px;
  line-height: 1.15;
}

.gradient-text {
  background: linear-gradient(135deg, var(--brand-sky) 0%, #ffffff 70%, var(--brand-gold) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-subtitle {
  font-size: 1.125rem;
  color: #cbd5e1;
  max-width: 720px;
  margin: 0 auto 48px auto;
  line-height: 1.6;
}

.search-widget {
  background: #ffffff;
  border-radius: var(--radius-xl);
  padding: 28px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
  color: var(--text-main);
  max-width: 1100px;
  margin: 0 auto;
}

.search-form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  align-items: flex-end;
}

.form-submit-cell {
  grid-column: span 1;
}

.search-btn {
  height: 48px;
}

.validation-msg {
  margin-top: 16px;
  background: var(--danger-soft);
  color: #991b1b;
  padding: 10px 16px;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 600;
  text-align: left;
}

.section {
  padding: 72px 0;
}

.section-header {
  text-align: center;
  margin-bottom: 48px;
}

.section-title {
  font-size: 2.25rem;
  margin-bottom: 12px;
}

.section-desc {
  font-size: 1.0625rem;
  color: var(--text-muted);
  max-width: 600px;
  margin: 0 auto;
}

.routes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.route-card {
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.route-info {
  padding: 24px;
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 16px;
}

.flight-top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.route-cities {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--primary-900);
  display: flex;
  flex-direction: column;
}

.flight-airline-sub {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 600;
}

.route-endpoints {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  align-items: center;
  background: #f8fafc;
  padding: 14px 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}

.endpoint {
  display: flex;
  flex-direction: column;
}

.endpoint .code {
  font-size: 1.25rem;
  font-weight: 900;
  color: var(--primary-900);
}

.endpoint .city {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--primary-800);
}

.endpoint .time {
  font-size: 0.75rem;
  color: var(--brand-blue);
  font-weight: 700;
}

.route-arrow-box {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.route-arrow-box .duration {
  font-size: 0.6875rem;
  font-weight: 700;
  color: var(--text-muted);
}

.route-arrow-box .arrow-sym {
  font-size: 1rem;
  color: var(--brand-blue);
}

.route-arrow-box .stop {
  font-size: 0.6875rem;
  color: var(--success);
  font-weight: 700;
}

.route-inventory-chip {
  font-size: 0.8125rem;
  color: #065f46;
  background: #ecfdf5;
  padding: 6px 12px;
  border-radius: 6px;
  font-weight: 600;
  border: 1px solid #a7f3d0;
  text-align: center;
}

.route-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid var(--border-color);
  padding-top: 14px;
}

.fare-tag {
  display: flex;
  flex-direction: column;
}

.from-txt {
  font-size: 0.6875rem;
  color: var(--text-muted);
  text-transform: uppercase;
}

.fare-val {
  font-size: 1.375rem;
  font-weight: 900;
  color: var(--brand-blue);
}

.features-section {
  background: #f1f5f9;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
}

.feature-card {
  text-align: left;
  padding: 32px 24px;
}

.feature-icon {
  font-size: 2.25rem;
  margin-bottom: 16px;
}

.feature-card h3 {
  font-size: 1.1875rem;
  margin-bottom: 10px;
}

.feature-card p {
  color: var(--text-muted);
  font-size: 0.9375rem;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2.25rem;
  }
  .search-form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
