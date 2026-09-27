<script setup>
import { Plane } from '@lucide/vue'
defineProps({ flight: { type: Object, required: true } })
</script>

<template>
  <div class="flight-row"><div class="flight-identity"><span class="flight-icon"><Plane :size="15" /></span><div><b>{{ flight.id }}</b><small>{{ flight.aircraft }}</small></div></div><div class="flight-route"><b>{{ flight.route }}</b><small>{{ flight.origin }} → {{ flight.destination }}</small></div><span class="flight-time">{{ flight.departure }}</span><span class="status-pill" :class="`status-${flight.status.toLowerCase().replaceAll(' ', '-')}`">{{ flight.status }}</span></div>
</template>