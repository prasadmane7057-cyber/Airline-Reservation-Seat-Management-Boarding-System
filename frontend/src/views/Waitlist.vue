<script setup>
import { ref } from 'vue'
import WaitlistQueue from '../components/WaitlistQueue.vue'
import { useAirlineStore } from '../stores/airlineStore'
const { state, promoteWaitlist } = useAirlineStore()
const notice = ref('')
function promote(id) {
	promoteWaitlist(id)
	notice.value = 'Seat offer sent and passenger added to passenger records.'
	setTimeout(() => { notice.value = '' }, 2600)
}
</script>
<template><div class="page-enter"><div class="page-heading"><div><div class="eyebrow"><span class="eyebrow-line"></span> RESERVATIONS</div><h1>Waitlist</h1><p>Priority queue for passengers awaiting a seat.</p></div><span class="count-chip">{{ state.waitlist.length }} WAITING</span></div><div class="graphics-stats"><div class="graphics-stat"><small>Passengers waiting</small><b>{{ state.waitlist.length }}</b></div><div class="graphics-stat"><small>Next departure</small><b>SK-204 · 09:35</b></div><div class="graphics-stat"><small>Seats currently open</small><b>116</b></div></div><WaitlistQueue :entries="state.waitlist" @promote="promote" /><div v-if="notice" class="toast" role="status">{{ notice }}</div></div></template>