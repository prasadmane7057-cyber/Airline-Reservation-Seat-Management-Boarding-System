<template>
  <div class="auth-page page-wrapper">
    <div class="container-narrow">
      <div class="auth-card card">
        <div class="auth-header">
          <div class="auth-icon">✈</div>
          <h1 class="auth-title">Create Passenger Account</h1>
          <p class="auth-subtitle">Join SkyWings Airlines for fast bookings, seat selection, and rewards.</p>
        </div>

        <div v-if="errorMessage" class="error-banner">
          ⚠️ {{ errorMessage }}
        </div>

        <form @submit.prevent="handleRegister" class="auth-form">
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input 
              type="text" 
              v-model="form.name" 
              class="form-input" 
              placeholder="e.g. Aarav Sharma" 
              required 
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input 
                type="email" 
                v-model="form.email" 
                class="form-input" 
                placeholder="name@example.com" 
                required 
              />
            </div>

            <div class="form-group">
              <label class="form-label">Phone Number</label>
              <input 
                type="tel" 
                v-model="form.phone" 
                class="form-input" 
                placeholder="+91-9876543210" 
                required 
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Password (min 6 chars)</label>
              <input 
                type="password" 
                v-model="form.password" 
                class="form-input" 
                placeholder="••••••••" 
                required 
              />
            </div>

            <div class="form-group">
              <label class="form-label">Confirm Password</label>
              <input 
                type="password" 
                v-model="form.confirmPassword" 
                class="form-input" 
                placeholder="••••••••" 
                required 
              />
            </div>
          </div>

          <button type="submit" class="btn btn-primary btn-lg btn-full" :disabled="loading">
            <span v-if="loading">Creating Account...</span>
            <span v-else>Register & Continue</span>
          </button>
        </form>

        <div class="auth-footer">
          <p>Already have an account? <router-link to="/login" class="link-highlight">Sign In</router-link></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';

const router = useRouter();
const authStore = useAuthStore();

const form = ref({
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: ''
});

const loading = ref(false);
const errorMessage = ref('');

async function handleRegister() {
  errorMessage.value = '';

  if (form.value.password !== form.value.confirmPassword) {
    errorMessage.value = 'Passwords do not match.';
    return;
  }

  if (form.value.password.length < 6) {
    errorMessage.value = 'Password must be at least 6 characters.';
    return;
  }

  loading.value = true;
  try {
    await authStore.register({
      name: form.value.name,
      email: form.value.email,
      phone: form.value.phone,
      password: form.value.password,
      confirmPassword: form.value.confirmPassword
    });

    router.push('/dashboard');
  } catch (err) {
    errorMessage.value = err.message || 'Registration failed. Please try again.';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.auth-page {
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-card {
  max-width: 560px;
  margin: 0 auto;
  padding: 40px;
  text-align: center;
}

.auth-icon {
  width: 48px;
  height: 48px;
  background: var(--brand-sky-soft);
  color: var(--brand-blue);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin: 0 auto 16px auto;
}

.auth-title {
  font-size: 1.75rem;
  margin-bottom: 8px;
}

.auth-subtitle {
  color: var(--text-muted);
  font-size: 0.9375rem;
  margin-bottom: 24px;
}

.error-banner {
  background: var(--danger-soft);
  color: #991b1b;
  padding: 12px;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 20px;
  text-align: left;
}

.auth-form {
  margin-bottom: 24px;
}

.auth-footer {
  border-top: 1px solid var(--border-color);
  padding-top: 20px;
  font-size: 0.9375rem;
  color: var(--text-muted);
}

.link-highlight {
  color: var(--brand-blue);
  font-weight: 700;
}

.link-highlight:hover {
  text-decoration: underline;
}
</style>
