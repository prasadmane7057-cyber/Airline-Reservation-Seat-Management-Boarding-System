<script setup>
import { computed, ref } from 'vue'
import { Search } from '@lucide/vue'
const props = defineProps({ bookings: { type: Array, required: true } })
const emit = defineEmits(['confirm'])
const query = ref('')
const filtered = computed(() => props.bookings.filter((booking) => Object.values(booking).join(' ').toLowerCase().includes(query.value.toLowerCase())))
</script>
<template>
  <section class="data-panel"><div class="toolbar-row"><span class="record-count">{{ filtered.length }} reservations</span><label class="table-search"><Search :size="14" /><input v-model="query" placeholder="Find a booking" /></label></div><div class="table-wrap"><table><thead><tr><th>Booking reference</th><th>Passenger</th><th>Route</th><th>Flight</th><th>Departure</th><th>Seat</th><th>Fare</th><th>Status</th><th></th></tr></thead><tbody><tr v-for="booking in filtered" :key="booking.id"><td><b>{{ booking.id }}</b></td><td>{{ booking.passenger }}</td><td>{{ booking.route }}</td><td><b>{{ booking.flight }}</b></td><td class="muted-cell">{{ booking.date }}</td><td>{{ booking.seat }}</td><td><b>{{ booking.amount }}</b></td><td><span class="status-pill" :class="`status-${booking.status.toLowerCase()}`">{{ booking.status }}</span></td><td><button v-if="booking.status === 'Pending'" class="table-action" @click="emit('confirm', booking.id)">Confirm</button></td></tr><tr v-if="!filtered.length"><td colspan="9" class="empty-state">No bookings match this search.</td></tr></tbody></table></div></section>
</template>