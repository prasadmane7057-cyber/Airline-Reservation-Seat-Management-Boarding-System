<template>
  <div class="boarding-pass-page page-wrapper">
    <div class="container-narrow">
      <div class="pass-top-bar no-print">
        <div>
          <h1 class="page-title">Digital Boarding Pass</h1>
          <p class="page-subtitle">Instant digital boarding pass with live web check-in and gate assignments.</p>
        </div>

        <div class="pass-actions">
          <button @click="printPass" class="btn btn-outline">
            🖨️ Print Boarding Pass
          </button>
        </div>
      </div>

      <!-- PNR Search Bar if no pass loaded -->
      <div class="search-pnr-box card no-print" v-if="!selectedPass">
        <form @submit.prevent="fetchPassByPnr" class="pnr-form">
          <div class="form-group mb-0">
            <label class="form-label">Lookup Boarding Pass by PNR</label>
            <input 
              type="text" 
              v-model="inputPnr" 
              class="form-input" 
              placeholder="e.g. AI8K92 or SK7M41" 
              required 
            />
          </div>
          <button type="submit" class="btn btn-primary search-pnr-btn">
            Find Boarding Pass
          </button>
        </form>
      </div>

      <div v-if="loading" class="card text-center py-48">
        <div class="spinner"></div>
        <p>Loading digital boarding pass...</p>
      </div>

      <div v-else-if="errorMessage" class="error-banner card no-print">
        ⚠️ {{ errorMessage }}
      </div>

      <div v-else-if="passes.length > 0" class="passes-container">
        <!-- Self Check-in Banner if not checked in -->
        <div 
          v-if="passes[0].check_in_status === 'NOT_CHECKED_IN'" 
          class="checkin-banner card no-print"
        >
          <div class="checkin-info">
            <h3>Web Check-in is Open!</h3>
            <p>Check in online now to confirm your boarding pass and gate clearance.</p>
          </div>
          <button @click="performSelfCheckIn" class="btn btn-gold btn-lg" :disabled="checkingIn">
            <span v-if="checkingIn">Checking in...</span>
            <span v-else>✈️ Check-In Online Now</span>
          </button>
        </div>

        <!-- Boarding Pass Card Visual -->
        <div 
          v-for="pass in passes" 
          :key="pass.booking_id"
          class="boarding-pass-card"
        >
          <!-- Main Body -->
          <div class="pass-main">
            <div class="pass-header-row">
              <div class="pass-airline">
                <span class="pass-icon">✈</span>
                <div>
                  <span class="airline-bold">{{ pass.airline || 'SkyWings Airlines' }}</span>
                  <span class="pass-doc-title">OFFICIAL BOARDING PASS</span>
                </div>
              </div>

              <div class="pass-flight-pill">
                <span class="flt-lbl">FLIGHT</span>
                <span class="flt-no">{{ pass.flight_number }}</span>
              </div>
            </div>

            <div class="pass-pax-row">
              <div class="pax-data-col">
                <span class="data-label">PASSENGER NAME</span>
                <span class="data-value pax-full">{{ pass.passenger_name }}</span>
              </div>
              <div class="pax-data-col">
                <span class="data-label">BOOKING REF (PNR)</span>
                <span class="data-value pnr-val">{{ pass.pnr }}</span>
              </div>
              <div class="pax-data-col">
                <span class="data-label">CABIN CLASS</span>
                <span class="data-value class-val">{{ pass.travel_class }}</span>
              </div>
            </div>

            <div class="pass-airports-row">
              <div class="airport-block">
                <span class="apt-code">{{ pass.from_code || 'BOM' }}</span>
                <span class="apt-city">{{ pass.from_city || 'Mumbai' }}</span>
                <span class="apt-time">{{ pass.departure_time || '08:30 AM' }}</span>
              </div>
              <div class="flight-mid-route">
                <span class="route-line-text">{{ pass.duration || '2h 15m' }} Non-stop</span>
                <span class="plane-sym">✈ ➔</span>
              </div>
              <div class="airport-block right">
                <span class="apt-code">{{ pass.to_code || 'DEL' }}</span>
                <span class="apt-city">{{ pass.to_city || pass.destination || 'Delhi' }}</span>
                <span class="apt-time">{{ pass.arrival_time || '10:45 AM' }}</span>
              </div>
            </div>

            <div class="pass-boarding-meta">
              <div class="meta-box">
                <span class="meta-label">SEAT</span>
                <span class="meta-val seat-highlight">{{ pass.seat_number }}</span>
              </div>
              <div class="meta-box">
                <span class="meta-label">GATE</span>
                <span class="meta-val highlight-val">{{ pass.gate || 'Gate 3B' }}</span>
              </div>
              <div class="meta-box">
                <span class="meta-label">BOARDING TIME</span>
                <span class="meta-val">{{ pass.boarding_time || '07:55 AM' }}</span>
              </div>
              <div class="meta-box">
                <span class="meta-label">GROUP</span>
                <span class="meta-val">{{ pass.boarding_group || 'Group 1' }}</span>
              </div>
              <div class="meta-box">
                <span class="meta-label">CHECK-IN</span>
                <span class="badge" :class="pass.check_in_status === 'CHECKED_IN' ? 'badge-confirmed' : 'badge-pending'">
                  {{ pass.check_in_status }}
                </span>
              </div>
            </div>

            <div class="status-banner-bottom">
              <span>BOARDING STATUS:</span>
              <span class="badge" :class="'badge-' + String(pass.boarding_status || 'not_checked_in').toLowerCase()">
                {{ pass.boarding_status }}
              </span>
            </div>
          </div>

          <!-- Perforated Stub / QR Barcode Visual -->
          <div class="pass-stub">
            <div class="stub-header">
              <span class="stub-brand">BOARDING STUB</span>
              <span class="stub-seat">{{ pass.seat_number }}</span>
            </div>

            <div class="stub-pax">
              <div class="data-label">PASSENGER</div>
              <div class="stub-pax-name">{{ pass.passenger_name }}</div>
            </div>

            <div class="stub-flight-row">
              <div>Flight: <strong>{{ pass.flight_number }}</strong></div>
              <div>Route: <strong>{{ pass.from_code }} ➔ {{ pass.to_code }}</strong></div>
              <div>Gate: <strong>{{ pass.gate || 'Gate 3B' }}</strong></div>
            </div>

            <div class="qr-container">
              <div class="qr-graphic">
                <div class="qr-corner top-left"></div>
                <div class="qr-corner top-right"></div>
                <div class="qr-corner bottom-left"></div>
                <span class="qr-plane-center">✈</span>
              </div>
              <div class="qr-caption">SCAN AT BOARDING GATE</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { boardingApi } from '../services/api';

const route = useRoute();

const inputPnr = ref(route.query.pnr || '');
const passes = ref([]);
const selectedPass = ref(null);
const loading = ref(false);
const checkingIn = ref(false);
const errorMessage = ref('');

onMounted(async () => {
  if (route.query.pnr) {
    inputPnr.value = route.query.pnr;
    await fetchPassByPnr();
  }
});

async function fetchPassByPnr() {
  if (!inputPnr.value) return;
  loading.value = true;
  errorMessage.value = '';
  selectedPass.value = null;
  passes.value = [];
  try {
    const res = await boardingApi.getBoardingPass(inputPnr.value.toUpperCase().trim());
    passes.value = res.boardingPass ? [res.boardingPass] : [];
    if (passes.value.length > 0) {
      selectedPass.value = passes.value[0];
    }
  } catch (err) {
    errorMessage.value = err.message || 'Boarding pass not found for this PNR reference.';
    passes.value = [];
  } finally {
    loading.value = false;
  }
}

async function performSelfCheckIn() {
  checkingIn.value = true;
  try {
    await boardingApi.selfCheckIn({ pnr: inputPnr.value.trim().toUpperCase() });
    await fetchPassByPnr();
    alert('Check-in complete! Your digital boarding pass is now active.');
  } catch (err) {
    alert(err.message || 'Check-in failed.');
  } finally {
    checkingIn.value = false;
  }
}

function printPass() {
  window.print();
}
</script>

<style scoped>
.pass-top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.search-pnr-box {
  padding: 20px;
  margin-bottom: 28px;
}

.pnr-form {
  display: flex;
  gap: 16px;
  align-items: flex-end;
}

.mb-0 {
  margin-bottom: 0;
  flex: 1;
}

.search-pnr-btn {
  height: 44px;
}

.checkin-banner {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 1.5px solid #f59e0b;
  padding: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.checkin-info h3 {
  color: #78350f;
  margin-bottom: 4px;
}

.checkin-info p {
  color: #92400e;
  font-size: 0.875rem;
}

.boarding-pass-card {
  background: #ffffff;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  display: grid;
  grid-template-columns: 1fr 280px;
  overflow: hidden;
  border: 1px solid var(--border-color);
  margin-bottom: 28px;
}

.pass-main {
  padding: 32px;
  border-right: 2px dashed #cbd5e1;
  position: relative;
}

.pass-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid var(--border-color);
  padding-bottom: 16px;
  margin-bottom: 20px;
}

.pass-airline {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pass-icon {
  width: 44px;
  height: 44px;
  background: var(--brand-blue);
  color: #ffffff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.airline-bold {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--primary-900);
  display: block;
}

.pass-doc-title {
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  color: var(--brand-blue);
}

.pass-flight-pill {
  background: var(--primary-900);
  color: #ffffff;
  padding: 8px 16px;
  border-radius: 8px;
  text-align: right;
}

.flt-lbl {
  display: block;
  font-size: 0.625rem;
  color: #94a3b8;
}

.flt-no {
  font-size: 1.25rem;
  font-weight: 800;
}

.pass-pax-row {
  display: grid;
  grid-template-columns: 2fr 1.5fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.data-label {
  display: block;
  font-size: 0.6875rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
}

.data-value {
  font-weight: 800;
  color: var(--primary-900);
}

.pax-full {
  font-size: 1.25rem;
}

.pnr-val {
  font-size: 1.25rem;
  color: var(--brand-blue);
}

.pass-airports-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
  padding: 18px 24px;
  border-radius: var(--radius-md);
  margin-bottom: 24px;
  border: 1px solid var(--border-color);
}

.apt-code {
  font-size: 2rem;
  font-weight: 900;
  color: var(--primary-900);
  display: block;
}

.apt-city {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--primary-800);
  display: block;
}

.apt-time {
  font-size: 0.8125rem;
  color: var(--brand-blue);
  font-weight: 600;
}

.flight-mid-route {
  text-align: center;
}

.route-line-text {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--primary-700);
  display: block;
}

.plane-sym {
  font-size: 1.25rem;
  color: var(--brand-blue);
  margin-top: 4px;
}

.airport-block.right {
  text-align: right;
}

.pass-boarding-meta {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  border-top: 1px solid var(--border-color);
  padding-top: 16px;
  margin-bottom: 18px;
}

.meta-label {
  display: block;
  font-size: 0.6875rem;
  font-weight: 700;
  color: var(--text-muted);
}

.meta-val {
  font-size: 1.125rem;
  font-weight: 800;
  color: var(--primary-900);
}

.highlight-val {
  color: var(--brand-blue);
}

.seat-highlight {
  color: #92400e;
  background: #fef3c7;
  padding: 2px 6px;
  border-radius: 4px;
}

.status-banner-bottom {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--primary-800);
}

.pass-stub {
  background: #f8fafc;
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.stub-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 10px;
}

.stub-brand {
  font-weight: 800;
  color: var(--brand-blue);
  font-size: 0.75rem;
  letter-spacing: 0.08em;
}

.stub-seat {
  font-weight: 900;
  font-size: 1.5rem;
  color: #92400e;
}

.stub-pax-name {
  font-weight: 700;
  font-size: 1rem;
}

.stub-flight-row {
  font-size: 0.8125rem;
  color: var(--text-muted);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.qr-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
}

.qr-graphic {
  width: 120px;
  height: 120px;
  background: #ffffff;
  border: 2px solid #0f172a;
  border-radius: 8px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-corner {
  position: absolute;
  width: 22px;
  height: 22px;
  border: 3px solid #0f172a;
  background: #ffffff;
}

.qr-corner.top-left { top: 4px; left: 4px; }
.qr-corner.top-right { top: 4px; right: 4px; }
.qr-corner.bottom-left { bottom: 4px; left: 4px; }

.qr-plane-center {
  font-size: 1.75rem;
  color: var(--brand-blue);
  z-index: 2;
}

.qr-caption {
  font-size: 0.6875rem;
  font-weight: 800;
  color: var(--text-muted);
  letter-spacing: 0.08em;
}

@media (max-width: 860px) {
  .boarding-pass-card {
    grid-template-columns: 1fr;
  }
  .pass-main {
    border-right: none;
    border-bottom: 2px dashed #cbd5e1;
  }
}
</style>
