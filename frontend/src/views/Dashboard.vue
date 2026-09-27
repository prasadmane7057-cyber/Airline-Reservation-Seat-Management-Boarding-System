<script setup>
import { computed } from 'vue'
import { Activity, Armchair, ArrowDownRight, ArrowRight, ArrowUpRight, CirclePlus, PlaneTakeoff, Users } from '@lucide/vue'
import FlightCard from '../components/FlightCard.vue'
import { useAirlineStore } from '../stores/airlineStore'

const { state } = useAirlineStore()
const totalPassengers = computed(() => state.flights.reduce((total, flight) => total + flight.occupied, 0))
const totalCapacity = computed(() => state.flights.reduce((total, flight) => total + flight.capacity, 0))
const stats = computed(() => [
  { label: 'Active flights', value: String(state.flights.length).padStart(2, '0'), delta: `${state.flights.filter((flight) => flight.status === 'Boarding').length} boarding now`, direction: 'up', icon: PlaneTakeoff },
  { label: 'Passengers today', value: totalPassengers.value.toLocaleString(), delta: '+12.8% vs yesterday', direction: 'up', icon: Users },
  { label: 'Load factor', value: `${(totalPassengers.value / totalCapacity.value * 100).toFixed(1)}%`, delta: 'Across all departures', direction: 'up', icon: ArrowUpRight },
  { label: 'Open seats', value: (totalCapacity.value - totalPassengers.value).toLocaleString(), delta: `Across ${state.flights.length} flights`, direction: 'down', icon: Armchair },
])
</script>

<template>
  <div class="dashboard-page page-enter">
    <div class="page-heading dashboard-heading"><div><div class="eyebrow"><span class="eyebrow-line"></span> SUNDAY, SEPTEMBER 27, 2026</div><h1>Good morning, Alex<span>.</span></h1><p>Here’s what’s happening across your network today.</p></div><RouterLink class="button button-primary" to="/booking"><CirclePlus :size="16" /> New booking</RouterLink></div>
    <section class="stat-grid" aria-label="Today's operations"><article v-for="(stat, index) in stats" :key="stat.label" class="stat-card" :style="{ '--delay': `${index * 70}ms` }"><div class="stat-top"><span>{{ stat.label }}</span><component :is="stat.icon" :size="17" /></div><div class="stat-value">{{ stat.value }}</div><div class="stat-foot"><span :class="`delta-${stat.direction}`"><component :is="stat.direction === 'up' ? ArrowUpRight : ArrowDownRight" :size="14" /></span>{{ stat.delta }}</div></article></section>
    <section class="dashboard-columns">
      <div class="panel flight-panel"><div class="panel-heading"><div><h2>Today’s departures</h2><p>Live status across your network</p></div><RouterLink to="/flights" class="text-link">All flights <ArrowRight :size="14" /></RouterLink></div><div class="flight-list"><FlightCard v-for="flight in state.flights.slice(0, 4)" :key="flight.id" :flight="flight" /></div></div>
      <div class="panel activity-panel"><div class="panel-heading"><div><h2>Departure pulse</h2><p>Passenger movement · today</p></div><span class="live-label"><i></i> LIVE</span></div><div class="pulse-number">{{ totalPassengers.toLocaleString() }} <span>passengers</span></div><div class="chart-labels"><span>06:00</span><span>08:00</span><span>10:00</span><span>12:00</span><span>14:00</span><span>16:00</span></div><div class="pulse-chart" aria-label="Passenger departures trending upward"><div v-for="(height, index) in [28,38,31,48,42,54,44,63,56,69,59,76,70,88,73,96,81,74,91,67,77,61,83,57]" :key="index" class="pulse-bar" :style="{ height: `${height}%`, '--bar-delay': `${index * 22}ms` }"></div></div><div class="chart-legend"><span><i></i> Departures</span><b>Peak at 12:00 <ArrowUpRight :size="13" /></b></div><div class="quick-note"><span class="note-icon">!</span><p><b>Heads up</b> Flight SK-331 to Tokyo is delayed by 25 minutes.</p><RouterLink to="/flights" aria-label="View delayed flight"><ArrowRight :size="15" /></RouterLink></div></div>
    </section>
    <section class="bottom-strip"><div class="bottom-strip-title"><span class="strip-icon"><PlaneTakeoff :size="16" /></span><div><b>Terminal overview</b><small>JFK International · Terminal 4</small></div></div><div class="terminal-metric"><span>Gates active</span><b>12 <small>/ 16</small></b></div><div class="terminal-metric"><span>On-time departures</span><b>94.2<span class="percent">%</span></b></div><div class="terminal-progress"><div><span>Terminal capacity</span><b>72%</b></div><i><b></b></i></div><RouterLink class="strip-link" to="/graphics" aria-label="View terminal details"><ArrowRight :size="16" /></RouterLink></section>
  </div>
</template>