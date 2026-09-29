<template>
  <div class="boarding-pass-page page-wrapper">
    <div class="container-narrow">
      <div class="pass-top-bar no-print">
        <div>
          <h1 class="page-title">Digital Boarding Pass</h1>
          <p class="page-subtitle">Present this digital boarding pass at airport security and departure gate.</p>
        </div>

        <div class="pass-actions">
          <button @click="printPass" class="btn btn-outline">
            🖨️ Print Pass
          </button>
        </div>
      </div>

      <!-- PNR Search Bar if no pass loaded -->
      <div class="search-pnr-box card no-print" v-if="!selectedPass">
        <form @submit.prevent="fetchPassByPnr" class="pnr-form">
          <div class="form-group mb-0">
            <label class="form-label">Lookup by PNR Reference</label>
            <input 
              type="text" 
              v-model="inputPnr" 
              class="form-input" 
              placeholder="e.g. SK7M41 or AI8K92" 
              required 
            />
          </div>
          <button type="submit" class="btn btn-primary search-pnr-btn">
            Retrieve Boarding Pass
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
          v-if="passes[0].boarding_status === 'NOT_CHECKED_IN'" 
          class="checkin-banner card no-print"
        >
          <div class="checkin-info">
            <h3>Web Check-in is Open!</h3>
            <p>Confirm your attendance and generate your authorized gate boarding barcode.</p>
          </div>
          <button @click="performSelfCheckIn" class="btn btn-gold btn-lg" :disabled="checkingIn">
            <span v-if="checkingIn">Checking in...</span>
            <span v-else>✈️ Check-In Online Now</span>
          </button>
        </div>

        <!-- Boarding Pass Card Visual -->
        <div 
          v-for="pass in passes" 
          :key="pass.boarding_id" 
          class="boarding-pass-card"
        >
          <!-- Main Body -->
          <div class="pass-main">
            <div class="pass-header-row">
              <div class="pass-airline">
                <span class="pass-icon">✈</span>
                <div>
                  <span class="airline-bold">SkyWings Airlines</span>
                  <span class="pass-doc-title">BOARDING PASS</span>
                </div>
              </div>

              <div class="pass-flight-pill">
                <span class="flt-lbl">FLIGHT</span>
                <span class="flt-no">{{ pass.flight_number }}</span>
              </div>
            </div>

            <!-- Passenger & Route -->
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
                <span class="apt-code">{{ pass.from_code }}</span>
                <span class="apt-city">{{ pass.from_city }}</span>
              </div>
              <div class="flight-mid-route">
                <span>NONSTOP</span>
                <span class="plane-sym">✈ ➔</span>
              </div>
              <div class="airport-block right">
                <span class="apt-code">{{ pass.to_code }}</span>
                <span class="apt-city">{{ pass.to_city }}</span>
              </div>
            </div>

            <!-- Gate & Times -->
            <div class="pass-boarding-meta">
              <div class="meta-box">
                <span class="meta-label">GATE</span>
                <span class="meta-val gate-val">{{ pass.gate || 'Gate 3B' }}</span>
              </div>
              <div class="meta-box">
                <span class="meta-label">BOARDING TIME</span>
                <span class="meta-val highlight-val">{{ formatTime(pass.boarding_time) }}</span>
              </div>
              <div class="meta-box">
                <span class="meta-label">DEPARTURE</span>
                <span class="meta-val">{{ formatTime(pass.departure_time) }}</span>
              </div>
              <div class="meta-box">
                <span class="meta-label">SEAT</span>
                <span class="meta-val seat-highlight">{{ pass.seat_number }}</span>
              </div>
              <div class="meta-box">
                <span class="meta-label">GROUP</span>
                <span class="meta-val">{{ pass.boarding_group || 'Group 2' }}</span>
              </div>
            </div>

            <div class="status-banner-bottom">
              <span>BOARDING STATUS:</span>
              <span class="badge" :class="'badge-' + pass.boarding_status.toLowerCase()">
                {{ pass.boarding_status }}
              </span>
            </div>
          </div>

          <!-- Perforated Stub / QR Barcode Visual -->
          <div class="pass-stub">
            <div class="stub-header">
              <span class="stub-brand">SkyWings</span>
              <span class="stub-seat">{{ pass.seat_number }}</span>
            </div>

            <div class="stub-pax">
              <div class="data-label">PASSENGER</div>
              <div class="stub-pax-name">{{ pass.passenger_name }}</div>
            </div>

            <div class="stub-flight-row">
              <div><strong>{{ pass.flight_number }}</strong></div>
              <div>{{ pass.from_code }} ➔ {{ pass.to_code }}</div>
            </div>

            <!-- Academic Demonstration QR Pattern -->
            <div class="qr-container">
              <div class="qr-graphic">
                <div class="qr-corner top-left"></div>
                <div class="qr-corner top-right"></div>
                <div class="qr-corner bottom-left"></div>
                <div class="qr-matrix-dots"></div>
                <div class="qr-plane-center">✈</div>
              </div>
              <span class="qr-caption">ENC: {{ pass.pnr }} • {{ pass.seat_number }}</span>
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
import { useBookingStore } from '../stores/bookingStore';

const route = useRoute();
const bookingStore = useBookingStore();

const inputPnr = ref(route.query.pnr || 'SK7M41');
const passes = ref([]);
const selectedPass = ref(null);
const loading = ref(false);
const checkingIn = ref(false);
const errorMessage = ref('');

onMounted(async () => {
  if (route.query.pnr) {
    inputPnr.value = route.query.pnr;
    await fetchPassByPnr();
  } else {
    // Attempt to load from user's latest booking
    try {
      const userBookings = await bookingStore.fetchUserBookings();
      if (userBookings.length > 0) {
        inputPnr.value = userBookings[0].pnr;
        await fetchPassByPnr();
      }
    } catch {
      // ignore
    }
  }
});

async function fetchPassByPnr() {
  if (!inputPnr.value) return;
  loading.value = true;
  errorMessage.value = '';
  try {
    const res = await boardingApi.getBoardingPass(inputPnr.value.toUpperCase().trim());
    passes.value = res.boardingPasses || [];
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
    await boardingApi.selfCheckIn({ pnr: inputPnr.value });
    await fetchPassByPnr();
    alert('Web check-in complete! Your boarding status is now CHECKED_IN.');
  } catch (err) {
    alert(err.message || 'Check-in failed.');
  } finally {
    checkingIn.value = false;
  }
}

function printPass() {
  window.print();
}

function formatTime(str) {
  if (!str) return '';
  const d = new Date(str);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
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
  width: 40px;
  height: 40px;
  background: var(--brand-blue);
  color: #ffffff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.airline-bold {
  font-size: 1.1875rem;
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
  padding: 6px 14px;
  border-radius: 8px;
  text-align: right;
}

.flt-lbl {
  display: block;
  font-size: 0.625rem;
  color: #94a3b8;
}

.flt-no {
  font-size: 1.125rem;
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
  font-size: 1.1875rem;
}

.pnr-val {
  font-size: 1.125rem;
  color: var(--brand-blue);
}

.pass-airports-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
  padding: 16px 20px;
  border-radius: var(--radius-md);
  margin-bottom: 24px;
}

.apt-code {
  font-size: 1.75rem;
  font-weight: 900;
  color: var(--primary-900);
  display: block;
}

.apt-city {
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.flight-mid-route {
  text-align: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--brand-blue);
}

.plane-sym {
  display: block;
  font-size: 1.125rem;
  margin-top: 2px;
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
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--primary-800);
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
}

.stub-seat {
  font-weight: 900;
  font-size: 1.25rem;
  color: #92400e;
}

.stub-pax-name {
  font-weight: 700;
  font-size: 0.9375rem;
}

.stub-flight-row {
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.qr-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
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
  width: 20px;
  height: 20px;
  border: 3px solid #0f172a;
  background: #ffffff;
}

.qr-corner.top-left { top: 4px; left: 4px; }
.qr-corner.top-right { top: 4px; right: 4px; }
.qr-corner.bottom-left { bottom: 4px; left: 4px; }

.qr-plane-center {
  font-size: 1.5rem;
  color: var(--brand-blue);
  z-index: 2;
}

.qr-caption {
  font-size: 0.6875rem;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.05em;
}

@media (max-width: 768px) {
  .pass-pax-row {
    grid-template-columns: 1fr;
  }
  .pass-boarding-meta {
    grid-template-columns: repeat(2, 1fr);
  }
  .pnr-form {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
