<script setup>
import { computed, ref } from 'vue'
import { Armchair } from '@lucide/vue'
import SeatMap from '../components/SeatMap.vue'
import { useAirlineStore } from '../stores/airlineStore'
const { state } = useAirlineStore()
const flightId = ref(state.flights[0].id)
const flight = computed(() => state.flights.find((item) => item.id === flightId.value))
</script>
<template><div class="page-enter"><div class="page-heading"><div><div class="eyebrow"><span class="eyebrow-line"></span> CABIN MANAGEMENT</div><h1>Seat management</h1><p>Review cabin occupancy and availability by flight.</p></div><label class="flight-select"><Armchair :size="15" /><select v-model="flightId" aria-label="Choose flight"><option v-for="item in state.flights" :key="item.id" :value="item.id">{{ item.id }} · {{ item.route }}</option></select></label></div><div class="module-grid"><div class="seat-panel"><div class="panel-heading"><div><h2>{{ flight.aircraft }}</h2><p>Seat plan · {{ flight.id }}</p></div><span class="status-pill">{{ flight.occupied }} occupied</span></div><SeatMap :flight="flight" /></div><aside class="side-summary"><h3>Cabin occupancy</h3><p>Seat availability for {{ flight.id }}</p><div class="summary-value">{{ Math.round(flight.occupied / flight.capacity * 100) }}%</div><div class="terminal-progress"><i><b :style="{ width: `${flight.occupied / flight.capacity * 100}%` }"></b></i></div><div class="summary-divider"></div><div class="summary-line"><span>Occupied</span><b>{{ flight.occupied }}</b></div><div class="summary-line"><span>Available</span><b>{{ flight.capacity - flight.occupied }}</b></div><div class="summary-line"><span>Capacity</span><b>{{ flight.capacity }}</b></div></aside></div></div></template>