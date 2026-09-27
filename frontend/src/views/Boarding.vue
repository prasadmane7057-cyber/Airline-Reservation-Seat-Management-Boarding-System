<script setup>
import { computed, ref } from 'vue'
import { useAirlineStore } from '../stores/airlineStore'
import BoardingQueue from '../components/BoardingQueue.vue'
const { state, boardPassenger } = useAirlineStore()
const flightId = ref('SK-204')
const flight = computed(() => state.flights.find((item) => item.id === flightId.value))
const passengers = computed(() => state.passengers.filter((person) => person.flight === flightId.value))
</script>
<template><div class="page-enter"><div class="page-heading"><div><div class="eyebrow"><span class="eyebrow-line"></span> GATE CONTROL · {{ flight.gate }}</div><h1>Boarding</h1><p>Verify passengers and manage boarding progress.</p></div><label class="flight-select"><select v-model="flightId" aria-label="Choose flight"><option v-for="item in state.flights" :key="item.id" :value="item.id">{{ item.id }} · {{ item.route }}</option></select></label></div><section class="boarding-banner"><div><span class="live-label"><i></i> BOARDING IN PROGRESS</span><h2>{{ flight.id }} <span>·</span> {{ flight.route }}</h2><p>Gate {{ flight.gate }} · Departure {{ flight.departure }} · {{ flight.aircraft }}</p></div><div class="boarding-progress"><b>{{ passengers.filter((person) => person.status === 'Boarded').length }}<small> / {{ passengers.length }}</small></b><span>BOARDED</span><i><b :style="{ width: `${passengers.length ? passengers.filter((person) => person.status === 'Boarded').length / passengers.length * 100 : 0}%` }"></b></i></div></section><BoardingQueue :passengers="passengers" @board="boardPassenger" /></div></template>