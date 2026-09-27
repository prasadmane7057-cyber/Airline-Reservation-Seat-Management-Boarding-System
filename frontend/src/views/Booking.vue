<script setup>
import { ref } from 'vue'
import { CirclePlus } from '@lucide/vue'
import BookingTable from '../components/BookingTable.vue'
import { useAirlineStore } from '../stores/airlineStore'
const { state, confirmBooking } = useAirlineStore()
const showForm = ref(false)
const notice = ref('')
function createBooking(event) {
	const data = new FormData(event.target)
	const flight = state.flights.find((item) => item.id === data.get('flight'))
	state.bookings.unshift({ id: `BK-${Date.now().toString().slice(-5)}`, passenger: data.get('passenger'), route: `${flight.origin} → ${flight.destination}`, flight: flight.id, date: '27 Sep 2026', seat: 'Unassigned', amount: '$940', status: 'Confirmed' })
	notice.value = 'Booking created successfully.'
	showForm.value = false
	setTimeout(() => { notice.value = '' }, 2500)
}
</script>
<template><div class="page-enter"><div class="page-heading"><div><div class="eyebrow"><span class="eyebrow-line"></span> RESERVATIONS</div><h1>Bookings</h1><p>Reservation activity and passenger itineraries.</p></div><button class="button button-primary" @click="showForm = !showForm"><CirclePlus :size="15" /> New booking</button></div><form v-if="showForm" class="form-panel" @submit.prevent="createBooking"><div class="form-grid"><div class="form-field"><label for="booking-passenger">Passenger name</label><input id="booking-passenger" name="passenger" required placeholder="Full name" /></div><div class="form-field"><label for="booking-flight">Flight</label><select id="booking-flight" name="flight"><option v-for="flight in state.flights" :key="flight.id" :value="flight.id">{{ flight.id }} · {{ flight.route }}</option></select></div><button class="button button-primary form-full" type="submit">Create reservation</button></div></form><BookingTable :bookings="state.bookings" @confirm="confirmBooking" /><div v-if="notice" class="toast" role="status">{{ notice }}</div></div></template>