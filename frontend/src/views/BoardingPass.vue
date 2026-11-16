<template>
  <div class="boarding-pass-page page-wrapper">
    <div class="container-narrow">
      <div class="pass-top-bar no-print">
        <div>
          <h1 class="page-title">Booking and Check-In Status</h1>
          <p class="page-subtitle">This project does not issue airline boarding passes or gate assignments.</p>
        </div>

        <div class="pass-actions">
          <button @click="printPass" class="btn btn-outline">
            🖨️ Print Status
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
              placeholder="Enter your PNR"
              required 
            />
          </div>
          <button type="submit" class="btn btn-primary search-pnr-btn">
            Find Booking
          </button>
        </form>
      </div>

      <div v-if="loading" class="card text-center py-48">
        <div class="spinner"></div>
        <p>Loading booking and check-in status...</p>
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
            <p>Check in a confirmed booking. Airport gate and schedule details are not available.</p>
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
                  <span class="airline-bold">Airline Reservation Project</span>
                    <span class="pass-doc-title">BOOKING STATUS</span>
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
                <span class="apt-code">{{ pass.flight_number }}</span>
                <span class="apt-city">Flight</span>
              </div>
              <div class="flight-mid-route">
                <span>DESTINATION</span>
                <span class="plane-sym">{{ pass.destination || 'Unavailable' }}</span>
              </div>
              <div class="airport-block right">
                <span class="apt-code">{{ pass.flight_status || 'Unavailable' }}</span>
                <span class="apt-city">Flight status</span>
              </div>
            </div>

            <div class="pass-boarding-meta">
              <div class="meta-box">
                <span class="meta-label">SEAT</span>
                <span class="meta-val seat-highlight">{{ pass.seat_number || 'Unavailable' }}</span>
              </div>
              <div class="meta-box">
                <span class="meta-label">BOOKING STATUS</span>
                <span class="meta-val">{{ pass.booking_status }}</span>
              </div>
              <div class="meta-box">
                <span class="meta-label">CHECK-IN</span>
                <span class="meta-val">{{ pass.check_in_status }}</span>
              </div>
            </div>
            <p class="status-banner-bottom">Gate and boarding time are not available in the connected schema.</p>

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
              <span class="stub-brand">Reservation</span>
              <span class="stub-seat">{{ pass.seat_number }}</span>
            </div>

            <div class="stub-pax">
              <div class="data-label">PASSENGER</div>
              <div class="stub-pax-name">{{ pass.passenger_name }}</div>
            </div>

            <div class="stub-flight-row">
              <div><strong>{{ pass.flight_number }}</strong></div>
              <div>{{ pass.destination || 'Destination unavailable' }}</div>
            </div>

            <div class="qr-caption">Reservation record only — not a scannable boarding pass.</div>
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
    alert('Check-in complete.');
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
