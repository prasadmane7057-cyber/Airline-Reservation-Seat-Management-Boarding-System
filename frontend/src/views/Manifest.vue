<script setup>
import { computed, ref } from 'vue'
import { Download } from '@lucide/vue'
import ManifestTable from '../components/ManifestTable.vue'
import { useAirlineStore } from '../stores/airlineStore'
const { state } = useAirlineStore()
const flightId = ref('SK-204')
const flight = computed(() => state.flights.find((item) => item.id === flightId.value))
function exportManifest() {
	const rows = state.passengers.filter((person) => person.flight === flightId.value)
	const csv = ['Passenger ID,Name,Seat,Cabin,Status', ...rows.map((person) => [person.id, person.name, person.seat, person.cabin, person.status].join(','))].join('\n')
	const link = document.createElement('a')
	link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
	link.download = `${flightId.value}-manifest.csv`
	link.click()
	URL.revokeObjectURL(link.href)
}
</script>
<template><div class="page-enter"><div class="page-heading"><div><div class="eyebrow"><span class="eyebrow-line"></span> FLIGHT DOCUMENTS</div><h1>Manifest</h1><p>Passenger manifest and check-in record for each departure.</p></div><button class="button button-secondary" @click="exportManifest"><Download :size="15" /> Export CSV</button></div><div class="manifest-tools"><label class="flight-select"><select v-model="flightId" aria-label="Choose flight"><option v-for="item in state.flights" :key="item.id" :value="item.id">{{ item.id }} · {{ item.route }}</option></select></label></div><ManifestTable :flight="flight" :passengers="state.passengers" /></div></template>