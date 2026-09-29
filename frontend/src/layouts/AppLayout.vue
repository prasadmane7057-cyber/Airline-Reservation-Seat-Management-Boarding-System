<template>
  <div class="app-layout">
    <!-- Main Top Navigation -->
    <header class="navbar">
      <div class="container nav-content">
        <router-link to="/" class="brand-logo">
          <div class="logo-icon">✈</div>
          <div class="logo-text">
            <span class="brand-name">SkyWings</span>
            <span class="brand-sub">AIRLINES</span>
          </div>
        </router-link>

        <nav class="nav-links">
          <router-link to="/" class="nav-item" exact-active-class="active">Home</router-link>
          <router-link to="/flights" class="nav-item" active-class="active">Search Flights</router-link>
          
          <template v-if="authStore.isAuthenticated">
            <router-link to="/my-bookings" class="nav-item" active-class="active">My Bookings</router-link>
            <router-link to="/boarding-pass" class="nav-item" active-class="active">Boarding Pass</router-link>
            <router-link to="/dashboard" class="nav-item" active-class="active" v-if="!authStore.isAdmin">Dashboard</router-link>
            <router-link to="/admin/dashboard" class="nav-item admin-badge-link" v-if="authStore.isAdmin">
              ⚡ Admin Portal
            </router-link>
          </template>
        </nav>

        <div class="nav-actions">
          <template v-if="authStore.isAuthenticated">
            <div class="user-menu">
              <router-link to="/profile" class="user-pill">
                <span class="avatar">{{ userInitial }}</span>
                <span class="user-name">{{ authStore.userName }}</span>
              </router-link>
              <button @click="handleLogout" class="btn btn-outline btn-sm" title="Log Out">
                Logout
              </button>
            </div>
          </template>
          <template v-else>
            <router-link to="/login" class="btn btn-outline btn-sm">Login</router-link>
            <router-link to="/register" class="btn btn-primary btn-sm">Register</router-link>
          </template>
        </div>
      </div>
    </header>

    <!-- Main View Outlet -->
    <main class="main-content">
      <router-view />
    </main>

    <!-- Modern Footer -->
    <footer class="footer">
      <div class="container footer-grid">
        <div class="footer-col">
          <div class="brand-logo footer-logo">
            <div class="logo-icon">✈</div>
            <div class="logo-text">
              <span class="brand-name">SkyWings Airlines</span>
              <span class="brand-sub">ENGINEERING ACADEMIC PROJECT</span>
            </div>
          </div>
          <p class="footer-desc">
            Next-generation full-stack Airline Reservation, Seat Management & Boarding System designed with modular architecture, transactional consistency, and intuitive user experience.
          </p>
        </div>

        <div class="footer-col">
          <h4>Quick Navigation</h4>
          <ul>
            <li><router-link to="/">Home Flight Search</router-link></li>
            <li><router-link to="/flights">Available Schedules</router-link></li>
            <li><router-link to="/my-bookings">Manage Bookings</router-link></li>
            <li><router-link to="/boarding-pass">Web Check-in & Pass</router-link></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>System Modules</h4>
          <ul>
            <li><span class="tech-tag">Vue 3 + Vite</span></li>
            <li><span class="tech-tag">Express.js API</span></li>
            <li><span class="tech-tag">MySQL Relational DB</span></li>
            <li><span class="tech-tag">Java OOP Model</span></li>
            <li><span class="tech-tag">OpenGL FreeGLUT CG</span></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>Demo Credentials</h4>
          <p class="demo-info"><strong>Admin:</strong> admin@airline.com (admin123)</p>
          <p class="demo-info"><strong>Passenger:</strong> passenger@airline.com (pass123)</p>
          <div class="status-indicator">
            <span class="dot-online"></span> System Operational
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        <div class="container bottom-content">
          <p>© 2026 SkyWings Airlines. Academic Engineering Final Practical Demonstration.</p>
          <div class="academic-note">Computer Engineering & Information Technology</div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';

const authStore = useAuthStore();
const router = useRouter();

const userInitial = computed(() => {
  return authStore.user?.name ? authStore.user.name.charAt(0).toUpperCase() : 'U';
});

function handleLogout() {
  authStore.logout();
  router.push('/login');
}
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  background: #ffffff;
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: var(--shadow-sm);
}

.nav-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 72px;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.logo-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, var(--brand-blue) 0%, #0369a1 100%);
  color: #ffffff;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  box-shadow: 0 4px 10px rgba(2, 132, 199, 0.3);
}

.logo-text {
  display: flex;
  flex-direction: column;
}

.brand-name {
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--primary-900);
}

.brand-sub {
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  color: var(--brand-blue);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 24px;
}

.nav-item {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--primary-700);
  padding: 8px 12px;
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
}

.nav-item:hover, .nav-item.active {
  color: var(--brand-blue);
  background: var(--brand-sky-soft);
}

.admin-badge-link {
  background: #fef3c7;
  color: #92400e !important;
  font-weight: 700;
  border: 1px solid #fde68a;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  background: #f1f5f9;
  border-radius: 9999px;
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--primary-900);
  transition: background 0.2s ease;
}

.user-pill:hover {
  background: #e2e8f0;
}

.avatar {
  width: 28px;
  height: 28px;
  background: var(--brand-blue);
  color: #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8125rem;
  font-weight: 700;
}

.main-content {
  flex: 1;
}

.footer {
  background: var(--primary-950);
  color: #94a3b8;
  padding: 56px 0 0 0;
  margin-top: auto;
}

.footer-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1.5fr;
  gap: 40px;
  padding-bottom: 48px;
}

.footer-logo .brand-name {
  color: #ffffff;
}

.footer-desc {
  font-size: 0.875rem;
  line-height: 1.6;
  margin-top: 16px;
  color: #64748b;
}

.footer-col h4 {
  color: #ffffff;
  font-size: 1rem;
  margin-bottom: 16px;
  font-weight: 700;
}

.footer-col ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.footer-col a {
  font-size: 0.875rem;
  color: #94a3b8;
  transition: color 0.2s ease;
}

.footer-col a:hover {
  color: var(--brand-sky);
}

.tech-tag {
  display: inline-block;
  background: var(--primary-900);
  color: var(--brand-sky);
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid var(--primary-800);
}

.demo-info {
  font-size: 0.8125rem;
  margin-bottom: 6px;
}

.status-indicator {
  margin-top: 14px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: rgba(16, 185, 129, 0.1);
  color: #34d399;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.dot-online {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 8px #10b981;
}

.footer-bottom {
  border-top: 1px solid var(--primary-900);
  padding: 24px 0;
  font-size: 0.8125rem;
  color: #64748b;
}

.bottom-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

@media (max-width: 900px) {
  .footer-grid {
    grid-template-columns: 1fr 1fr;
  }
  .nav-links {
    display: none;
  }
}

@media (max-width: 600px) {
  .footer-grid {
    grid-template-columns: 1fr;
  }
  .bottom-content {
    flex-direction: column;
    gap: 8px;
    text-align: center;
  }
}
</style>
