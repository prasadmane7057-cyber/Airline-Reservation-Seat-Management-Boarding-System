<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Activity, Armchair, ClipboardList, LayoutDashboard, Plane, Ticket, Users, UserRoundPlus, Waypoints } from '@lucide/vue'
import { useAirlineStore } from '../stores/airlineStore'

defineProps({ open: Boolean })
defineEmits(['navigate'])
const route = useRoute()
const { state } = useAirlineStore()
const links = computed(() => [
  { label: 'Overview', to: '/', icon: LayoutDashboard },
  { label: 'Flights', to: '/flights', icon: Plane, count: String(state.flights.length).padStart(2, '0') },
  { label: 'Passengers', to: '/passengers', icon: Users },
  { label: 'Bookings', to: '/booking', icon: Ticket },
  { label: 'Seat management', to: '/seats', icon: Armchair },
  { label: 'Waitlist', to: '/waitlist', icon: UserRoundPlus, count: String(state.waitlist.length).padStart(2, '0') },
  { label: 'Boarding', to: '/boarding', icon: Activity },
  { label: 'Manifest', to: '/manifest', icon: ClipboardList },
  { label: 'Route graphics', to: '/graphics', icon: Waypoints },
])
</script>

<template>
  <aside class="sidebar" :class="{ 'sidebar-open': open }">
    <RouterLink to="/" class="brand" @click="$emit('navigate')"><span class="brand-mark"><Plane :size="19" /></span><span class="brand-name">SKY<span>OPS</span><small>FLIGHT OPERATIONS</small></span></RouterLink>
    <div class="sidebar-section">OPERATIONS</div>
    <nav class="side-nav">
      <RouterLink v-for="link in links" :key="link.to" :to="link.to" class="nav-link" :class="{ active: route.path === link.to }" @click="$emit('navigate')">
        <component :is="link.icon" :size="17" :stroke-width="1.8" /><span>{{ link.label }}</span><b v-if="link.count">{{ link.count }}</b>
      </RouterLink>
    </nav>
    <div class="sidebar-bottom"><div class="shift-card"><span class="shift-dot"></span><div><b>Operations live</b><small>Shift A · 06:00–14:00</small></div></div><div class="staff-row"><span class="avatar avatar-coral">AM</span><span><b>Alex Morgan</b><small>Flight controller</small></span><span class="staff-menu">···</span></div></div>
  </aside>
</template>