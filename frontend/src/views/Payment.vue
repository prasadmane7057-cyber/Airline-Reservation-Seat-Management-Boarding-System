<template>
  <div class="payment-page page-wrapper">
    <div class="container-narrow">
      <div class="card payment-unavailable">
        <h1 class="page-title">Payment is unavailable</h1>
        <p role="status" aria-live="polite">
          This project has no configured payment provider. No payment details will be collected,
          no payment will be reported as successful, and no booking will be created from this page.
        </p>
        <p>
          Academic base fares are Economy ₹5,000, Business ₹10,000, and First Class ₹20,000.
          These values are not a payment quote or receipt.
        </p>
        <button type="button" class="btn btn-outline" @click="router.back()">
          Back to passenger details
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();
</script>

<style scoped>
.payment-unavailable {
  display: grid;
  gap: 18px;
  max-width: 720px;
  margin: 40px auto;
  padding: 32px;
}

.payment-unavailable p {
  line-height: 1.6;
}
</style>
