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
          <form @submit.prevent="handleSearch" class="search-form-grid">
            <div class="form-group">
              <label class="form-label">Source airport</label>
              <select v-model="form.from" class="form-select" required>
                <option value="" disabled>Select departure city or airport</option>
                <option v-for="apt in airports" :key="apt.id" :value="apt.airport_code">
                  {{ apt.city }} ({{ apt.airport_code }}) - {{ apt.airport_name }}
                </option>
              </select>
              <span v-if="selectedOrigin" class="airport-selection">{{ selectedOrigin.city }} · {{ selectedOrigin.airport_code }}</span>
            </div>

            <div class="form-group">
              <label class="form-label">Destination airport</label>
              <select v-model="form.to" class="form-select" required>
                <option value="" disabled>Select arrival city or airport</option>
                <option v-for="apt in airports" :key="apt.id" :value="apt.airport_code" :disabled="apt.airport_code === form.from">
                  {{ apt.city }} ({{ apt.airport_code }}) - {{ apt.airport_name }}
                </option>
              </select>
              <span v-if="selectedDestination" class="airport-selection">{{ selectedDestination.city }} · {{ selectedDestination.airport_code }}</span>
            </div>

            <div class="form-group">
              <label class="form-label">Departure Date</label>
              <input type="date" v-model="form.date" class="form-input" :min="todayDate" required />
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
          <p v-if="airports.length" class="airport-options-note">
            Available airports: {{ airports.map(airport => `${airport.city} (${airport.airport_code})`).join(' · ') }}
          </p>
          <p v-else class="airport-options-note" role="status">
            {{ flightStore.airportError ? `Airport list unavailable: ${flightStore.airportError}` : 'Loading airport options…' }}
          </p>
        </div>
      </div>
    </section>

    <section class="section route-map-section">
      <div class="container">
        <div class="section-header">
          <span class="modules-eyebrow">FLIGHT NETWORK</span>
          <h2 class="section-title">Routes across India</h2>
          <p class="section-desc">A visual overview of the airports and routes available in the demo schedule.</p>
        </div>
        <div class="route-map-card">
          <div class="route-map-copy">
            <span class="map-live-dot"></span>
            <span>ROUTE PREVIEW</span>
            <strong>{{ selectedOrigin?.city || 'Source' }} <span>→</span> {{ selectedDestination?.city || 'Destination' }}</strong>
            <p>Choose a source and destination above to preview your route.</p>
          </div>
          <svg class="india-route-map" viewBox="0 0 760 470" role="img" aria-label="Schematic map showing airline routes between Indian airports">
            <path class="india-outline" d="M285 34 375 47 435 80 480 121 557 148 600 202 632 251 598 293 573 344 526 370 508 420 461 443 424 397 398 346 356 326 336 286 301 259 271 221 248 173 221 127 249 86Z" />
            <path
              v-for="connection in routeConnections"
              :key="connection.from + connection.to"
              class="map-route"
              :class="{ highlighted: isSelectedConnection(connection) }"
              :d="getRoutePath(connection.from, connection.to)"
            />
            <path
              v-if="selectedOriginPoint && selectedDestinationPoint && !routeConnections.some(connection => isSelectedConnection(connection))"
              class="map-route highlighted"
              :d="getRoutePath(form.from, form.to)"
            />
            <g v-for="airport in mapAirports" :key="airport.code" class="map-airport" :class="{ active: airport.code === form.from || airport.code === form.to }">
              <circle :cx="airport.x" :cy="airport.y" r="6" />
              <text :x="airport.x + airport.labelX" :y="airport.y + airport.labelY">{{ airport.code }}</text>
            </g>
            <g v-if="selectedOriginPoint && selectedDestinationPoint" class="selected-route">
              <circle :cx="selectedOriginPoint.x" :cy="selectedOriginPoint.y" r="11" />
              <circle :cx="selectedDestinationPoint.x" :cy="selectedDestinationPoint.y" r="11" />
            </g>
            <text class="map-caption" x="28" y="440">SCHEMATIC ROUTE MAP · NOT TO SCALE</text>
          </svg>
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
          <div class="route-img" :style="{ backgroundImage: route.image }">
            <span class="route-badge">{{ route.tag }}</span>
            <span class="route-art-plane" aria-hidden="true">✈</span>
            <span class="route-art-codes">{{ route.from }} <span>→</span> {{ route.to }}</span>
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

    <!-- Integrated project modules -->
    <section id="modules" class="section modules-section">
      <div class="container">
        <div class="section-header">
          <span class="modules-eyebrow">THE COMPLETE PROJECT</span>
          <h2 class="section-title">One airline system. Every layer connected.</h2>
          <p class="section-desc">
            Explore the passenger experience and the engineering modules that power the reservation,
            seat-management, and boarding workflows.
          </p>
        </div>

        <div class="modules-grid">
          <article v-for="(module, index) in projectModules" :key="module.title" class="module-card">
            <div class="module-card-top">
              <span class="module-icon" aria-hidden="true">{{ module.icon }}</span>
              <span class="module-number">0{{ index + 1 }}</span>
            </div>
            <p class="module-discipline">{{ module.discipline }}</p>
            <h3>{{ module.title }}</h3>
            <p class="module-description">{{ module.description }}</p>
            <ul class="module-activities">
              <li v-for="activity in module.activities" :key="activity">{{ activity }}</li>
            </ul>
            <div class="module-card-footer">
              <code>{{ module.source }}</code>
              <router-link v-if="module.link" :to="module.link" class="module-link">
                {{ module.linkLabel }} <span aria-hidden="true">→</span>
              </router-link>
            </div>
          </article>
        </div>

        <div class="journey-panel">
          <div>
            <p class="module-discipline">FROM SEARCH TO GATE</p>
            <h3>Follow the passenger journey</h3>
            <p>Each step connects to a working screen in the reservation app.</p>
          </div>
          <div class="journey-steps">
            <router-link to="/flights"><span>01</span> Find a flight</router-link>
            <router-link to="/login"><span>02</span> Sign in</router-link>
            <router-link to="/my-bookings"><span>03</span> Manage bookings</router-link>
            <router-link to="/boarding-pass"><span>04</span> Check in & board</router-link>
          </div>
        </div>
      </div>
    </section>

    <!-- Live Performance Stats -->
    <section class="section stats-banner">
      <div class="container stats-grid">
        <div class="stat-item">
          <div class="stat-number">4</div>
          <div class="stat-label">Engineering Disciplines</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">6</div>
          <div class="stat-label">Integrated Project Modules</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">3</div>
          <div class="stat-label">Cabin Classes</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">1</div>
          <div class="stat-label">Connected Airline Platform</div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useFlightStore } from '../stores/flightStore';

defineOptions({ name: 'AirlineHome' });

const router = useRouter();
const flightStore = useFlightStore();

const validationError = ref('');

function localDateString(date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().split('T')[0];
}

const todayDate = localDateString(new Date());
const tomorrowDate = new Date();
tomorrowDate.setDate(tomorrowDate.getDate() + 1);

const form = ref({
  from: 'BOM',
  to: 'DEL',
  date: localDateString(tomorrowDate),
  passengers: 1,
  travelClass: 'Economy'
});

const airports = computed(() => flightStore.airports);
const selectedOrigin = computed(() => airports.value.find(airport => airport.airport_code === form.value.from));
const selectedDestination = computed(() => airports.value.find(airport => airport.airport_code === form.value.to));

const mapAirports = [
  { code: 'DEL', x: 362, y: 128, labelX: -29, labelY: -13 },
  { code: 'CCU', x: 501, y: 201, labelX: 10, labelY: 2 },
  { code: 'BOM', x: 286, y: 260, labelX: -39, labelY: 5 },
  { code: 'PNQ', x: 324, y: 279, labelX: -35, labelY: 22 },
  { code: 'HYD', x: 409, y: 285, labelX: 11, labelY: 5 },
  { code: 'BLR', x: 401, y: 358, labelX: -13, labelY: 25 },
  { code: 'MAA', x: 472, y: 382, labelX: 11, labelY: 7 }
];

const routeConnections = [
  { from: 'BOM', to: 'DEL' },
  { from: 'DEL', to: 'BLR' },
  { from: 'PNQ', to: 'HYD' },
  { from: 'BOM', to: 'BLR' },
  { from: 'HYD', to: 'BOM' }
];

const selectedOriginPoint = computed(() => mapAirports.find(airport => airport.code === form.value.from));
const selectedDestinationPoint = computed(() => mapAirports.find(airport => airport.code === form.value.to));

const projectModules = [
  {
    icon: '✈',
    discipline: 'PASSENGER & ADMIN EXPERIENCE',
    title: 'Reservation workflows',
    description: 'The Vue frontend brings the end-to-end airline booking and operations flows together.',
    activities: [
      'Register, sign in, and manage a passenger profile',
      'Search flights, choose seats, and enter passenger details',
      'Process payment, retrieve bookings, and cancel a booking',
      'Check in, view boarding passes, and manage admin operations'
    ],
    source: 'frontend/src/views · airline-backend/src',
    link: '/flights',
    linkLabel: 'Search flights'
  },
  {
    icon: '☕',
    discipline: 'JAVA · OBJECT-ORIENTED PROGRAMMING',
    title: 'Airline domain model',
    description: 'Java models the people, flights, airports, seats, and booking lifecycle.',
    activities: [
      'Inheritance and polymorphism across passenger and seat classes',
      'Booking and PNR validation utilities',
      'Booking file read/write and recovery checks',
      'Flight status form and fare-calculation examples'
    ],
    source: 'java-oop/src · java-oop-coa-ui/src'
  },
  {
    icon: '▦',
    discipline: 'C++ · DATA STRUCTURES',
    title: 'Passenger & seat operations',
    description: 'Standalone demonstrations apply core structures to airline manifests and cabin allocation.',
    activities: [
      'Passenger arrays and a two-dimensional seat matrix',
      'FIFO waitlist promotion',
      'Chronological booking audit trail with a linked list',
      'Doubly linked manifest merge using a two-pointer technique'
    ],
    source: 'cpp-ds/src'
  },
  {
    icon: '⌘',
    discipline: '64-BIT ASSEMBLY · COMPUTER ORGANIZATION',
    title: 'Fare, fuel & processor logic',
    description: 'Assembly programs and a register simulator demonstrate airline calculations at the machine level.',
    activities: [
      'Fare calculation using base fare, aviation tax, and discount',
      'Fuel and weight consumption calculation',
      'Hexadecimal-to-decimal and packed BCD conversion',
      'CPU register and ALU simulation'
    ],
    source: 'coa-nasm · assembly-component'
  },
  {
    icon: '◉',
    discipline: 'C++ · COMPUTER GRAPHICS',
    title: 'Routes & cabin visualization',
    description: 'Graphics programs visualize flight paths and cabin layouts using raster and geometric algorithms.',
    activities: [
      'Bresenham rasterization and DDA line comparison',
      'Flight trajectory and airport-node route map',
      'Plane glyph and interactive seat-matrix selector',
      'Seat-map zoom, transformation, and clipping'
    ],
    source: 'cpp-cg/src'
  },
  {
    icon: '▤',
    discipline: 'EXPRESS API · MYSQL',
    title: 'Shared data & services',
    description: 'The backend API and relational schema persist the same reservation lifecycle used by the frontend.',
    activities: [
      'Authentication, flights, airports, seats, and passengers',
      'Bookings, passenger-seat assignments, and payments',
      'PNR records, check-in, and boarding status',
      'Admin dashboard and operational management'
    ],
    source: 'airline-backend/src · database/schema.sql',
    link: '/flights',
    linkLabel: 'Explore the app'
  }
];

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
    image: 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 58%, #38bdf8 100%)'
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
    image: 'linear-gradient(135deg, #172554 0%, #2563eb 52%, #67e8f9 100%)'
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
    image: 'linear-gradient(135deg, #064e3b 0%, #059669 54%, #a3e635 100%)'
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
    image: 'linear-gradient(135deg, #312e81 0%, #7c3aed 55%, #f0abfc 100%)'
  }
];

onMounted(async () => {
  await flightStore.fetchAirports();
});

function handleSearch() {
  validationError.value = '';

  if (!form.value.from || !form.value.to) {
    validationError.value = 'Select both a source and destination airport.';
    return;
  }

  if (form.value.from === form.value.to) {
    validationError.value = 'Departure and arrival airports cannot be identical.';
    return;
  }

  if (form.value.date < todayDate) {
    validationError.value = 'Choose a departure date that is today or later.';
    return;
  }

  flightStore.setSearchParams({
    from: form.value.from,
    to: form.value.to,
    date: form.value.date,
    passengers: form.value.passengers,
    travelClass: form.value.travelClass,
    sortBy: 'departure'
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

function getRoutePath(fromCode, toCode) {
  const from = mapAirports.find(airport => airport.code === fromCode);
  const to = mapAirports.find(airport => airport.code === toCode);
  if (!from || !to) return '';

  const middleX = (from.x + to.x) / 2;
  const middleY = (from.y + to.y) / 2 - 34;
  return `M ${from.x} ${from.y} Q ${middleX} ${middleY} ${to.x} ${to.y}`;
}

function isSelectedConnection(connection) {
  return (
    (connection.from === form.value.from && connection.to === form.value.to) ||
    (connection.from === form.value.to && connection.to === form.value.from)
  );
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

.airport-selection {
  display: block;
  margin-top: 6px;
  color: var(--brand-blue);
  font-size: 0.78rem;
  font-weight: 700;
}

.airport-options-note {
  margin-top: 16px;
  color: var(--text-muted);
  font-size: 0.78rem;
  line-height: 1.6;
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

.route-map-section {
  background: #f1f5f9;
}

.route-map-card {
  display: grid;
  grid-template-columns: minmax(190px, 0.65fr) 1.5fr;
  align-items: center;
  gap: 20px;
  padding: 24px;
  overflow: hidden;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  background:
    radial-gradient(ellipse at 65% 45%, rgba(56, 189, 248, 0.12), transparent 48%),
    #ffffff;
  box-shadow: var(--shadow-md);
}

.route-map-copy {
  display: grid;
  grid-template-columns: 10px 1fr;
  align-items: center;
  gap: 9px;
}

.route-map-copy > span:nth-child(2) {
  color: var(--text-muted);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.12em;
}

.map-live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--success);
  box-shadow: 0 0 0 4px var(--success-soft);
}

.route-map-copy strong,
.route-map-copy p {
  grid-column: 1 / -1;
}

.route-map-copy strong {
  margin-top: 8px;
  color: var(--primary-900);
  font-size: 1.35rem;
}

.route-map-copy strong span {
  color: var(--brand-blue);
}

.route-map-copy p {
  color: var(--text-muted);
  font-size: 0.86rem;
  line-height: 1.65;
}

.india-route-map {
  width: 100%;
  max-height: 420px;
}

.india-outline {
  fill: #eaf4f7;
  stroke: #d5e6ea;
  stroke-width: 2;
}

.map-route {
  fill: none;
  stroke: #a5c4d1;
  stroke-dasharray: 5 7;
  stroke-linecap: round;
  stroke-width: 2;
}

.map-route.highlighted {
  stroke: var(--brand-blue);
  stroke-dasharray: none;
  stroke-width: 4;
}

.map-airport circle {
  fill: #ffffff;
  stroke: #64748b;
  stroke-width: 3;
}

.map-airport.active circle {
  fill: var(--brand-gold);
  stroke: #ffffff;
  stroke-width: 4;
}

.map-airport text {
  fill: var(--primary-800);
  font-size: 13px;
  font-weight: 800;
}

.map-airport.active text {
  fill: var(--brand-blue-hover);
}

.selected-route circle {
  fill: none;
  stroke: var(--brand-gold);
  stroke-width: 2;
}

.map-caption {
  fill: #94a3b8;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.4px;
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
  position: relative;
  z-index: 1;
  background: rgba(15, 23, 42, 0.85);
  color: #ffffff;
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
  backdrop-filter: blur(4px);
}

.route-art-plane {
  position: absolute;
  top: 48px;
  left: 50%;
  color: rgba(255, 255, 255, 0.9);
  font-size: 2.4rem;
  transform: translateX(-50%) rotate(-12deg);
}

.route-art-codes {
  position: absolute;
  right: 18px;
  bottom: 14px;
  left: 18px;
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-align: center;
  text-shadow: 0 1px 8px rgba(15, 23, 42, 0.5);
}

.route-art-codes span {
  margin: 0 8px;
  color: rgba(255, 255, 255, 0.75);
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

.modules-section {
  background: #ffffff;
}

.modules-eyebrow,
.module-discipline {
  color: var(--brand-blue);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.12em;
}

.modules-eyebrow {
  display: inline-block;
  margin-bottom: 12px;
}

.modules-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}

.module-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 24px;
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.module-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg);
}

.module-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.module-icon {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border-radius: 13px;
  background: var(--brand-sky-soft);
  color: var(--brand-blue);
  font-size: 1.35rem;
  font-weight: 800;
}

.module-number {
  color: #cbd5e1;
  font-size: 1.2rem;
  font-weight: 800;
}

.module-card .module-discipline {
  margin-bottom: 8px;
}

.module-card h3,
.journey-panel h3 {
  margin-bottom: 8px;
  font-size: 1.2rem;
}

.module-description,
.journey-panel p:not(.module-discipline) {
  color: var(--text-muted);
  font-size: 0.9rem;
  line-height: 1.65;
}

.module-activities {
  display: grid;
  gap: 9px;
  margin: 18px 0 22px;
  padding: 0;
  list-style: none;
}

.module-activities li {
  position: relative;
  padding-left: 18px;
  color: var(--primary-700);
  font-size: 0.86rem;
  line-height: 1.5;
}

.module-activities li::before {
  position: absolute;
  top: 0.55em;
  left: 0;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--success);
  content: '';
}

.module-card-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: auto;
  padding-top: 14px;
  border-top: 1px solid var(--border-color);
}

.module-card-footer code {
  color: var(--text-muted);
  font-size: 0.7rem;
  overflow-wrap: anywhere;
}

.module-link {
  color: var(--brand-blue);
  font-size: 0.82rem;
  font-weight: 800;
  white-space: nowrap;
}

.module-link:hover {
  color: var(--brand-blue-hover);
}

.journey-panel {
  display: grid;
  grid-template-columns: minmax(220px, 0.8fr) 1.5fr;
  align-items: center;
  gap: 28px;
  margin-top: 28px;
  padding: 28px;
  border-radius: var(--radius-lg);
  background: var(--primary-900);
  color: #ffffff;
}

.journey-panel h3 {
  color: #ffffff;
}

.journey-panel p:not(.module-discipline) {
  color: #cbd5e1;
}

.journey-steps {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.journey-steps a {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 88px;
  padding: 14px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: var(--radius-md);
  color: #ffffff;
  font-size: 0.82rem;
  font-weight: 700;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.journey-steps a:hover {
  border-color: rgba(56, 189, 248, 0.65);
  background: rgba(56, 189, 248, 0.1);
}

.journey-steps span {
  color: var(--brand-sky);
  font-size: 0.72rem;
  letter-spacing: 0.08em;
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
  .modules-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .journey-panel {
    grid-template-columns: 1fr;
  }
  .journey-steps {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .route-map-card {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 540px) {
  .modules-grid {
    grid-template-columns: 1fr;
  }
}
</style>
