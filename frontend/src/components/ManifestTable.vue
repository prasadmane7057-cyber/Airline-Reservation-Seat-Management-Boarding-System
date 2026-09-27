<script setup>
import { computed } from 'vue'
const props = defineProps({ flight: { type: Object, required: true }, passengers: { type: Array, required: true } })
const manifest = computed(() => props.passengers.filter((person) => person.flight === props.flight.id))
</script>
<template>
  <section class="data-panel"><div class="manifest-banner"><div><span class="eyebrow">PASSENGER MANIFEST</span><h2>{{ flight.id }} <span>·</span> {{ flight.route }}</h2><p>{{ flight.departure }} departure <i></i> Gate {{ flight.gate }} <i></i> {{ flight.aircraft }}</p></div><div class="manifest-count"><b>{{ manifest.length }}</b><small>PASSENGERS LISTED</small></div></div><div class="table-wrap"><table><thead><tr><th>Passenger name</th><th>Passenger ID</th><th>Seat</th><th>Cabin</th><th>Check-in status</th></tr></thead><tbody><tr v-for="person in manifest" :key="person.id"><td><b>{{ person.name }}</b></td><td class="muted-cell">{{ person.id }}</td><td><b>{{ person.seat }}</b></td><td>{{ person.cabin }}</td><td><span class="status-pill" :class="`status-${person.status.toLowerCase().replaceAll(' ', '-')}`">{{ person.status }}</span></td></tr><tr v-if="!manifest.length"><td colspan="5" class="empty-state">No passengers assigned to this flight.</td></tr></tbody></table></div></section>
</template>