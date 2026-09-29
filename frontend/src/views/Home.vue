<template>
  <div class="home-page">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-backdrop"></div>
      <div class="container hero-content">
        <div class="hero-badge">
          ✨ Premium Airline Reservation & Boarding Management
        </div>
        <h1 class="hero-title">
          Fly Smarter. <span class="gradient-text">Travel Better.</span>
        </h1>
        <p class="hero-subtitle">
          Experience seamless airline booking, real-time aircraft seat selection, authoritative fare computation, and instant digital boarding passes.
        </p>

        <!-- Flight Search Widget Card -->
        <div class="search-widget card">
          <div class="search-tabs">
            <button 
              type="button" 
              class="tab-btn" 
              :class="{ active: tripType === 'one-way' }" 
              @click="tripType = 'one-way'"
            >
              One Way
            </button>
            <button 
              type="button" 
              class="tab-btn" 
              :class="{ active: tripType === 'round-trip' }" 
              @click="tripType = 'round-trip'"
            >
              Round Trip
            </button>
          </div>

          <form @submit.prevent="handleSearch" class="search-form-grid">
            <div class="form-group">
              <label class="form-label">From (Origin)</label>
              <select v-model="form.from" class="form-select" required>
                <option value="" disabled>Select Departure Airport</option>
                <option v-for="apt in airports" :key="apt.id" :value="apt.airport_code">
                  {{ apt.city }} ({{ apt.airport_code }}) - {{ apt.airport_name }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">To (Destination)</label>
              <select v-model="form.to" class="form-select" required>
                <option value="" disabled>Select Arrival Airport</option>
                <option v-for="apt in airports" :key="apt.id" :value="apt.airport_code">
                  {{ apt.city }} ({{ apt.airport_code }}) - {{ apt.airport_name }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Departure Date</label>
              <input type="date" v-model="form.date" class="form-input" :min="todayDate" required />
            </div>

            <div class="form-group" v-if="tripType === 'round-trip'">
              <label class="form-label">Return Date</label>
              <input type="date" v-model="form.returnDate" class="form-input" :min="form.date || todayDate" />
            </div>

            <div class="form-group">
              <label class="form-label">Passengers</label>
              <select v-model="form.passengers" class="form-select">
                <option :value="1">1 Passenger</option>
                <option :value="2">2 Passengers</option>
                <option :value="3">3 Passengers</option>
                <option :value="4">4 Passengers</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Travel Class</label>
              <select v-model="form.travelClass" class="form-select">
                <option value="Economy">Economy Class</option>
                <option value="Business">Business Class</option>
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
        </div>
      </div>
    </section>

    <!-- Popular Flight Routes -->
    <section class="section popular-routes container">
      <div class="section-header">
        <h2 class="section-title">Popular Domestic Routes</h2>
        <p class="section-desc">Handpicked daily flights connecting major metropolitan business and tourism hubs.</p>
      </div>

      <div class="routes-grid">
        <div class="route-card card" v-for="route in popularRoutes" :key="route.code">
          <div class="route-img" :style="{ backgroundImage: `url(${route.image})` }">
            <span class="route-badge">{{ route.tag }}</span>
          </div>
          <div class="route-info">
            <div class="route-cities">
              <span class="city-name">{{ route.fromCity }}</span>
              <span class="route-arrow">✈</span>
              <span class="city-name">{{ route.toCity }}</span>
            </div>
            <div class="route-meta">
              <span>Flight: {{ route.flightNo }}</span>
              <span>Duration: {{ route.duration }}</span>
            </div>
            <div class="route-footer">
              <div class="fare-tag">
                <span class="from-txt">Starting from</span>
                <span class="fare-val">₹{{ route.fare.toLocaleString() }}</span>
              </div>
              <button @click="quickBook(route)" class="btn btn-outline btn-sm">Book Flight</button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Why Choose SkyWings -->
    <section class="section features-section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">Engineered for Reliability</h2>
          <p class="section-desc">State-of-the-art features guaranteeing seamless reservation, seating, and boarding.</p>
        </div>

        <div class="features-grid">
          <div class="feature-card card">
            <div class="feature-icon">💺</div>
            <h3>Visual Seat Matrix</h3>
            <p>Interactive cabin grid displaying real-time available, selected, occupied, and blocked seats with class separation.</p>
          </div>

          <div class="feature-card card">
            <div class="feature-icon">🎫</div>
            <h3>Guaranteed Unique PNR</h3>
            <p>Cryptographically collision-free 6-character PNR generation ensuring instantaneous retrieval and verification.</p>
          </div>

          <div class="feature-card card">
            <div class="feature-icon">🛡️</div>
            <h3>Atomic Seat Locking</h3>
            <p>Transactional database consistency preventing race conditions and duplicate bookings under high concurrency.</p>
          </div>

          <div class="feature-card card">
            <div class="feature-icon">📱</div>
            <h3>Digital Boarding & QR</h3>
            <p>Real-time boarding lifecycle status: Not Checked In ➔ Checked In ➔ Boarding ➔ Boarded with pass simulation.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Live Performance Stats -->
    <section class="section stats-banner">
      <div class="container stats-grid">
        <div class="stat-item">
          <div class="stat-number">99.8%</div>
          <div class="stat-label">On-Time Performance</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">100%</div>
          <div class="stat-label">ACID Seat Allocation</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">&lt; 100ms</div>
          <div class="stat-label">Search API Response</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">24 / 7</div>
          <div class="stat-label">Automated Web Check-in</div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useFlightStore } from '../stores/flightStore';

const router = useRouter();
const flightStore = useFlightStore();

const tripType = ref('one-way');
const validationError = ref('');

const todayDate = new Date().toISOString().split('T')[0];

const form = ref({
  from: 'BOM',
  to: 'DEL',
  date: '2026-10-15',
  returnDate: '',
  passengers: 1,
  travelClass: 'Economy'
});

const airports = computed(() => flightStore.airports);

const popularRoutes = [
  {
    code: 'BOM-DEL',
    from: 'BOM',
    to: 'DEL',
    fromCity: 'Mumbai',
    toCity: 'New Delhi',
    flightNo: 'AI101',
    duration: '2h 15m',
    fare: 4500,
    tag: 'Daily Express',
    image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=600&q=80'
  },
  {
    code: 'DEL-BLR',
    from: 'DEL',
    to: 'BLR',
    fromCity: 'New Delhi',
    toCity: 'Bengaluru',
    flightNo: 'AI202',
    duration: '2h 45m',
    fare: 5200,
    tag: 'Silicon Connect',
    image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=600&q=80'
  },
  {
    code: 'PNQ-HYD',
    from: 'PNQ',
    to: 'HYD',
    fromCity: 'Pune',
    toCity: 'Hyderabad',
    flightNo: 'AI303',
    duration: '1h 20m',
    fare: 3800,
    tag: 'Quick Hop',
    image: 'https://images.unsplash.com/photo-1600100397608-f010e4250000?auto=format&fit=crop&w=600&q=80'
  },
  {
    code: 'BOM-BLR',
    from: 'BOM',
    to: 'BLR',
    fromCity: 'Mumbai',
    toCity: 'Bengaluru',
    flightNo: 'AI404',
    duration: '1h 45m',
    fare: 4800,
    tag: 'Business Nonstop',
    image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=600&q=80'
  }
];

onMounted(async () => {
  await flightStore.fetchAirports();
});

function handleSearch() {
  validationError.value = '';

  if (form.value.from === form.value.to) {
    validationError.value = 'Departure and arrival airports cannot be identical.';
    return;
  }

  flightStore.setSearchParams({
    from: form.value.from,
    to: form.value.to,
    date: form.value.date,
    passengers: form.value.passengers,
    travelClass: form.value.travelClass
  });

  router.push({
    path: '/flights',
    query: {
      from: form.value.from,
      to: form.value.to,
      date: form.value.date,
      passengers: form.value.passengers,
      travelClass: form.value.travelClass
    }
  });
}

function quickBook(route) {
  form.value.from = route.from;
  form.value.to = route.to;
  handleSearch();
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

.search-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.tab-btn {
  background: #f1f5f9;
  border: none;
  padding: 8px 18px;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--primary-700);
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn.active {
  background: var(--brand-blue);
  color: #ffffff;
}

.search-form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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

/* Sections */
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
  grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
  gap: 24px;
}

.route-card {
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.route-img {
  height: 160px;
  background-size: cover;
  background-position: center;
  position: relative;
  padding: 14px;
}

.route-badge {
  background: rgba(15, 23, 42, 0.85);
  color: #ffffff;
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
  backdrop-filter: blur(4px);
}

.route-info {
  padding: 20px;
  display: flex;
  flex-direction: column;
  flex: 1;
  justify-content: space-between;
}

.route-cities {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.125rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.route-arrow {
  color: var(--brand-blue);
  font-size: 0.875rem;
}

.route-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.8125rem;
  color: var(--text-muted);
  margin-bottom: 20px;
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
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--brand-blue);
}

/* Features */
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

/* Stats */
.stats-banner {
  background: var(--primary-900);
  color: #ffffff;
  padding: 48px 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 32px;
  text-align: center;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--brand-sky);
  margin-bottom: 6px;
}

.stat-label {
  font-size: 0.875rem;
  color: #94a3b8;
  font-weight: 600;
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
