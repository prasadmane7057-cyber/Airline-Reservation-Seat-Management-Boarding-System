<template>
  <div class="admin-layout">
    <!-- Sidebar -->
    <aside class="admin-sidebar">
      <div class="sidebar-header">
        <router-link to="/admin/dashboard" class="admin-brand">
          <span class="admin-logo-badge">⚡</span>
          <div>
            <div class="brand-title">SkyWings Admin</div>
            <div class="brand-subtitle">OPERATIONS CENTER</div>
          </div>
        </router-link>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section-title">CONTROL PANEL</div>
        <router-link to="/admin/dashboard" class="sidebar-item" active-class="active">
          <span class="sidebar-icon">📊</span> Dashboard Overview
        </router-link>
        <router-link to="/admin/flights" class="sidebar-item" active-class="active">
          <span class="sidebar-icon">✈️</span> Flight Schedules
        </router-link>
        <router-link to="/admin/airports" class="sidebar-item" active-class="active">
          <span class="sidebar-icon">🏢</span> Airports & Hubs
        </router-link>
        <router-link to="/admin/bookings" class="sidebar-item" active-class="active">
          <span class="sidebar-icon">🎫</span> Global Bookings
        </router-link>
        <router-link to="/admin/boarding" class="sidebar-item" active-class="active">
          <span class="sidebar-icon">🚪</span> Boarding Operations
        </router-link>
        <router-link to="/admin/passengers" class="sidebar-item" active-class="active">
          <span class="sidebar-icon">👥</span> Passenger Directory
        </router-link>

        <div class="nav-section-title">SHORTCUTS</div>
        <router-link to="/" class="sidebar-item exit-item">
          <span class="sidebar-icon">🌐</span> Passenger Website
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <div class="admin-user-info">
          <div class="admin-avatar">AD</div>
          <div class="admin-meta">
            <div class="admin-name">{{ authStore.userName }}</div>
            <div class="admin-role">System Administrator</div>
          </div>
        </div>
        <button @click="handleLogout" class="btn-logout" title="Sign out of Admin">
          🚪 Logout
        </button>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div class="admin-main">
      <!-- Admin Top Bar -->
      <header class="admin-topbar">
        <div class="topbar-left">
          <h2 class="section-heading">{{ routeTitle }}</h2>
        </div>

        <div class="topbar-right">
          <div class="system-chip">
            <span class="dot-live"></span> Live System: MySQL Active
          </div>
          <router-link to="/profile" class="btn btn-outline btn-sm">Admin Profile</router-link>
        </div>
      </header>

      <!-- Subview Content -->
      <main class="admin-content-view">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();

const routeTitle = computed(() => {
  return route.meta?.title || 'Admin Control Panel';
});

function handleLogout() {
  authStore.logout();
  router.push('/login');
}
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background-color: #f1f5f9;
}

.admin-sidebar {
  width: 270px;
  background: var(--primary-950);
  color: #94a3b8;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  border-right: 1px solid var(--primary-900);
}

.sidebar-header {
  padding: 24px 20px;
  border-bottom: 1px solid var(--primary-900);
}

.admin-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.admin-logo-badge {
  font-size: 1.5rem;
  background: var(--brand-blue);
  color: #ffffff;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
}

.brand-title {
  color: #ffffff;
  font-weight: 800;
  font-size: 1.0625rem;
}

.brand-subtitle {
  font-size: 0.625rem;
  color: var(--brand-sky);
  font-weight: 700;
  letter-spacing: 0.1em;
}

.sidebar-nav {
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.nav-section-title {
  font-size: 0.6875rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  color: #475569;
  padding: 12px 12px 6px 12px;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 14px;
  border-radius: var(--radius-md);
  color: #94a3b8;
  font-weight: 600;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.sidebar-item:hover {
  background: var(--primary-900);
  color: #ffffff;
}

.sidebar-item.active {
  background: linear-gradient(135deg, var(--brand-blue) 0%, #0369a1 100%);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(2, 132, 199, 0.35);
}

.exit-item {
  color: var(--brand-sky);
}

.sidebar-footer {
  padding: 20px;
  border-top: 1px solid var(--primary-900);
  background: #060a12;
}

.admin-user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.admin-avatar {
  width: 36px;
  height: 36px;
  background: var(--brand-blue);
  color: #ffffff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.8125rem;
}

.admin-name {
  color: #ffffff;
  font-weight: 700;
  font-size: 0.875rem;
}

.admin-role {
  font-size: 0.6875rem;
  color: #64748b;
}

.btn-logout {
  width: 100%;
  padding: 8px;
  background: var(--primary-900);
  border: 1px solid var(--primary-800);
  color: #ef4444;
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 0.8125rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-logout:hover {
  background: rgba(239, 68, 68, 0.15);
  border-color: #ef4444;
}

.admin-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
}

.admin-topbar {
  background: #ffffff;
  border-bottom: 1px solid var(--border-color);
  padding: 16px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-heading {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--primary-900);
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.system-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8125rem;
  font-weight: 600;
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
  padding: 6px 14px;
  border-radius: 9999px;
}

.dot-live {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
}

.admin-content-view {
  padding: 32px;
  flex: 1;
}

@media (max-width: 960px) {
  .admin-layout {
    flex-direction: column;
  }
  .admin-sidebar {
    width: 100%;
  }
}
</style>
