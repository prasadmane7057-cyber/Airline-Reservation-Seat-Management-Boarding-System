<template>
  <div class="auth-page page-wrapper">
    <div class="container-narrow">
      <div class="auth-card card">
        <div class="auth-header">
          <div class="auth-icon">✈</div>
          <h1 class="auth-title">Welcome Back</h1>
          <p class="auth-subtitle">Sign in to manage your flight reservations and boarding passes.</p>
        </div>

        <div class="demo-helpers">
          <span class="demo-label">Account access</span>
          <p class="account-note">Use an account registered for this application; demo credentials are not provided. Admin pages require an authenticated account with the admin role.</p>
        </div>

        <div v-if="route.query.redirect" class="booking-login-notice" role="status">
          Sign in is required to continue. Admin routes additionally require the admin role.
        </div>

        <div v-if="errorMessage" class="error-banner">
          ⚠️ {{ errorMessage }}
        </div>

        <form @submit.prevent="handleLogin" class="auth-form">
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
            <label class="form-label">Password</label>
            <input 
              type="password" 
              v-model="form.password" 
              class="form-input" 
              placeholder="••••••••" 
              required 
            />
          </div>

          <button type="submit" class="btn btn-primary btn-lg btn-full" :disabled="loading">
            <span v-if="loading">Signing in...</span>
            <span v-else>Sign In</span>
          </button>
        </form>

        <div class="auth-footer">
          <p>Don't have an account? <router-link to="/register" class="link-highlight">Create Account</router-link></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/authStore';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const form = ref({
  email: '',
  password: ''
});

const loading = ref(false);
const errorMessage = ref('');

async function handleLogin() {
  errorMessage.value = '';
  loading.value = true;
  try {
    const res = await authStore.login({
      email: form.value.email,
      password: form.value.password
    });

    const redirectPath = route.query.redirect || (res.user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
    router.push(redirectPath);
  } catch (err) {
    errorMessage.value = err.message || 'Login failed. Please check your credentials.';
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
  max-width: 480px;
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

.demo-helpers {
  background: #f8fafc;
  border: 1px dashed var(--border-color);
  padding: 12px;
  border-radius: var(--radius-md);
  margin-bottom: 24px;
}

.demo-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  margin-bottom: 8px;
}

.account-note {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.875rem;
  line-height: 1.5;
}

.booking-login-notice {
  margin-bottom: 20px;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: #eff6ff;
  color: var(--primary-700);
  font-size: 0.875rem;
  font-weight: 600;
  text-align: left;
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
