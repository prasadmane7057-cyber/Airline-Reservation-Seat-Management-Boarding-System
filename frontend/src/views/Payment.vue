<template>
  <div class="payment-page page-wrapper">
    <div class="container-narrow">
      <!-- Steps Bar -->
      <div class="payment-top-bar">
        <button @click="router.back()" class="btn btn-outline btn-sm">
          ← Back
        </button>
        <div class="step-indicator">
          <span class="step done">1. Flight Details</span>
          <span class="step-sep">➔</span>
          <span class="step done">2. Seat Selection</span>
          <span class="step-sep">➔</span>
          <span class="step done">3. Passenger Info</span>
          <span class="step-sep">➔</span>
          <span class="step active">4. Payment</span>
        </div>
      </div>

      <div class="payment-layout">
        <!-- Payment Methods Card -->
        <div class="card payment-box">
          <div class="box-header">
            <h1 class="page-title">Simulated Payment Gateway</h1>
            <p class="page-subtitle">Academic project payment simulation. No real money will be charged.</p>
          </div>

          <div class="payment-tabs">
            <button 
              type="button" 
              class="pay-tab" 
              :class="{ active: paymentMethod === 'Credit Card' }"
              @click="paymentMethod = 'Credit Card'"
            >
              💳 Credit Card
            </button>
            <button 
              type="button" 
              class="pay-tab" 
              :class="{ active: paymentMethod === 'Debit Card' }"
              @click="paymentMethod = 'Debit Card'"
            >
              💳 Debit Card
            </button>
            <button 
              type="button" 
              class="pay-tab" 
              :class="{ active: paymentMethod === 'UPI' }"
              @click="paymentMethod = 'UPI'"
            >
              📱 UPI / QR
            </button>
            <button 
              type="button" 
              class="pay-tab" 
              :class="{ active: paymentMethod === 'Net Banking' }"
              @click="paymentMethod = 'Net Banking'"
            >
              🏦 Net Banking
            </button>
          </div>

          <!-- Card Form -->
          <div v-if="paymentMethod === 'Credit Card' || paymentMethod === 'Debit Card'" class="tab-content">
            <div class="form-group">
              <label class="form-label">Card Number</label>
              <input 
                type="text" 
                v-model="cardForm.number" 
                class="form-input font-mono" 
                placeholder="4532 •••• •••• 8901" 
                maxlength="19" 
              />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Cardholder Name</label>
                <input 
                  type="text" 
                  v-model="cardForm.name" 
                  class="form-input" 
                  placeholder="e.g. AARAV SHARMA" 
                />
              </div>
              <div class="form-group">
                <label class="form-label">Expiry (MM/YY)</label>
                <input 
                  type="text" 
                  v-model="cardForm.expiry" 
                  class="form-input font-mono" 
                  placeholder="12/28" 
                  maxlength="5" 
                />
              </div>
              <div class="form-group">
                <label class="form-label">CVV</label>
                <input 
                  type="password" 
                  v-model="cardForm.cvv" 
                  class="form-input font-mono" 
                  placeholder="•••" 
                  maxlength="3" 
                />
              </div>
            </div>
          </div>

          <!-- UPI Form -->
          <div v-else-if="paymentMethod === 'UPI'" class="tab-content text-center">
            <div class="upi-box">
              <div class="qr-mock">
                <div class="qr-pattern">
                  <div class="qr-box top-left"></div>
                  <div class="qr-box top-right"></div>
                  <div class="qr-box bottom-left"></div>
                  <span class="qr-icon">✈</span>
                </div>
              </div>
              <p class="upi-inst">Scan QR code using any UPI App (GPay, PhonePe, Paytm)</p>
              <div class="upi-id-input">
                <input 
                  type="text" 
                  v-model="upiId" 
                  class="form-input" 
                  placeholder="username@okhdfcbank" 
                />
              </div>
            </div>
          </div>

          <!-- Net Banking Form -->
          <div v-else class="tab-content">
            <div class="form-group">
              <label class="form-label">Select Your Bank</label>
              <select v-model="selectedBank" class="form-select">
                <option value="HDFC Bank">HDFC Bank</option>
                <option value="State Bank of India">State Bank of India (SBI)</option>
                <option value="ICICI Bank">ICICI Bank</option>
                <option value="Axis Bank">Axis Bank</option>
                <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
              </select>
            </div>
          </div>

          <div v-if="errorMessage" class="error-banner">
            ⚠️ {{ errorMessage }}
          </div>

          <button 
            @click="handlePayment" 
            class="btn btn-gold btn-lg btn-full pay-now-btn"
            :disabled="processing"
          >
            <span v-if="processing">Processing Transaction & Generating PNR...</span>
            <span v-else>Pay ₹{{ totalFare.toLocaleString() }} & Confirm Booking ➔</span>
          </button>
        </div>

        <!-- Right Side Order Summary -->
        <div class="card summary-box">
          <h3 class="card-title">Fare Breakdown</h3>

          <div class="breakdown-list">
            <div class="breakdown-item">
              <span>Base Fare:</span>
              <span>₹{{ baseFare.toLocaleString() }}</span>
            </div>
            <div class="breakdown-item">
              <span>Aviation GST (18%):</span>
              <span>₹{{ taxAmount.toLocaleString() }}</span>
            </div>
            <div class="breakdown-item green-txt">
              <span>Academic Discount:</span>
              <span>- ₹{{ discountAmount.toLocaleString() }}</span>
            </div>
            <div class="breakdown-item total-item">
              <span>Total Payable:</span>
              <span class="grand-fare">₹{{ totalFare.toLocaleString() }}</span>
            </div>
          </div>

          <div class="booking-features">
            <div class="feature-line">✓ Instant PNR Generation</div>
            <div class="feature-line">✓ Seat Allocation Locked in MySQL</div>
            <div class="feature-line">✓ Automated Boarding Pass Creation</div>
            <div class="feature-line">✓ Downloadable PDF/Printable E-Ticket</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useBookingStore } from '../stores/bookingStore';

const router = useRouter();
const bookingStore = useBookingStore();

const paymentMethod = ref('Credit Card');
const upiId = ref('passenger@okaxis');
const selectedBank = ref('HDFC Bank');
const processing = ref(false);
const errorMessage = ref('');

const cardForm = ref({
  number: '4532 8921 4451 9012',
  name: 'AARAV SHARMA',
  expiry: '08/29',
  cvv: '889'
});

const baseFare = computed(() => bookingStore.draft.fare?.baseFare || 5000);
const taxAmount = computed(() => bookingStore.draft.fare?.taxAmount || 900);
const discountAmount = computed(() => bookingStore.draft.fare?.discountAmount || 500);
const totalFare = computed(() => bookingStore.draft.fare?.totalFare || 5400);

onMounted(() => {
  if (!bookingStore.draft.flight || bookingStore.draft.passengers.length === 0) {
    router.push('/flights');
  }
});

async function handlePayment() {
  errorMessage.value = '';
  processing.value = true;
  try {
    const res = await bookingStore.confirmBooking(paymentMethod.value);
    // Success -> Navigate to booking confirmation with PNR
    router.push(`/booking-confirmation/${res.booking.pnr}`);
  } catch (err) {
    errorMessage.value = err.message || 'Payment processing failed. Please try again.';
  } finally {
    processing.value = false;
  }
}
</script>

<style scoped>
.payment-top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.step-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-muted);
}

.step.active {
  color: var(--brand-blue);
  font-weight: 800;
}

.step.done {
  color: var(--success);
}

.payment-layout {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 32px;
  align-items: start;
}

.payment-box {
  padding: 32px;
}

.box-header {
  margin-bottom: 24px;
}

.payment-tabs {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 24px;
}

.pay-tab {
  background: #f1f5f9;
  border: 1.5px solid var(--border-color);
  padding: 10px;
  border-radius: var(--radius-md);
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--primary-700);
  cursor: pointer;
  transition: all 0.2s ease;
}

.pay-tab.active {
  background: #ffffff;
  border-color: var(--brand-blue);
  color: var(--brand-blue);
  box-shadow: 0 4px 10px rgba(2, 132, 199, 0.15);
}

.tab-content {
  margin-bottom: 24px;
}

.font-mono {
  font-family: monospace;
  letter-spacing: 0.05em;
}

.upi-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #f8fafc;
  border-radius: var(--radius-lg);
}

.qr-mock {
  width: 140px;
  height: 140px;
  background: #ffffff;
  border: 2px solid var(--border-color);
  border-radius: 12px;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-pattern {
  width: 100%;
  height: 100%;
  position: relative;
  background-image: radial-gradient(#0f172a 20%, transparent 20%), radial-gradient(#0f172a 20%, transparent 20%);
  background-size: 10px 10px;
  background-position: 0 0, 5px 5px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-box {
  position: absolute;
  width: 24px;
  height: 24px;
  border: 3px solid #0f172a;
  background: #ffffff;
}

.qr-box.top-left { top: 0; left: 0; }
.qr-box.top-right { top: 0; right: 0; }
.qr-box.bottom-left { bottom: 0; left: 0; }

.qr-icon {
  font-size: 1.5rem;
  background: #ffffff;
  padding: 4px;
  border-radius: 50%;
}

.upi-inst {
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.upi-id-input {
  width: 100%;
  max-width: 320px;
}

.pay-now-btn {
  height: 52px;
}

.error-banner {
  background: var(--danger-soft);
  color: #991b1b;
  padding: 12px;
  border-radius: var(--radius-md);
  margin-bottom: 20px;
  font-size: 0.875rem;
  font-weight: 600;
}

.summary-box {
  padding: 24px;
}

.breakdown-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.breakdown-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: var(--primary-700);
}

.green-txt {
  color: var(--success);
  font-weight: 600;
}

.total-item {
  border-top: 1.5px solid var(--border-color);
  padding-top: 14px;
  font-weight: 800;
  font-size: 1rem;
  color: var(--primary-900);
}

.grand-fare {
  font-size: 1.375rem;
  color: var(--brand-blue);
}

.booking-features {
  border-top: 1px dashed var(--border-color);
  padding-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.feature-line {
  font-size: 0.8125rem;
  color: var(--primary-800);
  font-weight: 600;
}

@media (max-width: 900px) {
  .payment-layout {
    grid-template-columns: 1fr;
  }
  .payment-tabs {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
