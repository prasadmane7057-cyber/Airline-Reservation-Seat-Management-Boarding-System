<script setup>
import { UserPlus } from '@lucide/vue'
import PassengerTable from '../components/PassengerTable.vue'
import { useAirlineStore } from '../stores/airlineStore'
import { ref } from 'vue'
const { state, addPassenger } = useAirlineStore()
const showForm = ref(false)
const notice = ref('')
function createPassenger(event) {
	const data = new FormData(event.target)
	addPassenger({ name: data.get('name'), flight: data.get('flight'), seat: 'Unassigned', cabin: data.get('cabin'), status: 'Pending' })
	showForm.value = false
	notice.value = 'Passenger added to today’s records.'
	setTimeout(() => { notice.value = '' }, 2500)
}
</script>
<template><div class="page-enter"><div class="page-heading"><div><div class="eyebrow"><span class="eyebrow-line"></span> CUSTOMER OPERATIONS</div><h1>Passengers</h1><p>Passenger records and check-in status across today's departures.</p></div><button class="button button-primary" @click="showForm = !showForm"><UserPlus :size="15" /> Add passenger</button></div><form v-if="showForm" class="form-panel" @submit.prevent="createPassenger"><div class="form-grid"><div class="form-field"><label for="passenger-name">Passenger name</label><input id="passenger-name" name="name" required placeholder="Full name" /></div><div class="form-field"><label for="passenger-flight">Flight</label><select id="passenger-flight" name="flight"><option v-for="flight in state.flights" :key="flight.id" :value="flight.id">{{ flight.id }} · {{ flight.route }}</option></select></div><div class="form-field"><label for="passenger-cabin">Cabin</label><select id="passenger-cabin" name="cabin"><option>Economy</option><option>Business</option><option>First</option></select></div><button class="button button-primary" type="submit">Add to passenger list</button></div></form><div class="graphics-stats"><div class="graphics-stat"><small>Registered passengers</small><b>{{ state.passengers.length }}</b></div><div class="graphics-stat"><small>Checked in</small><b>{{ state.passengers.filter((person) => person.status === 'Checked in' || person.status === 'Boarded').length }}</b></div><div class="graphics-stat"><small>Awaiting check-in</small><b>{{ state.passengers.filter((person) => person.status === 'Pending').length }}</b></div></div><PassengerTable :passengers="state.passengers" /><div v-if="notice" class="toast" role="status">{{ notice }}</div></div></template>