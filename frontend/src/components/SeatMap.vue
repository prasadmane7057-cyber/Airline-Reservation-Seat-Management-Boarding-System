<script setup>
import { computed, ref } from 'vue'
const props = defineProps({ flight: { type: Object, required: true } })
const selectedSeat = ref('')
const rows = computed(() => Array.from({ length: 12 }, (_, index) => index + 1))
const seats = ['A', 'B', 'C', 'D', 'E', 'F']
const unavailable = computed(() => new Set(Array.from({ length: Math.round((props.flight.occupied / props.flight.capacity) * 60) }, (_, index) => `${Math.floor(index / 6) + 1}${seats[index % 6]}`)))
</script>
<template>
  <div><div class="seat-map-frame"><div class="seat-map-label">FRONT OF AIRCRAFT</div><div class="seat-cabin"><div v-for="row in rows" :key="row" class="seat-row"><span class="seat-row-label">{{ String(row).padStart(2, '0') }}</span><template v-for="(seat, index) in seats" :key="seat"><button class="seat" :class="{ 'is-taken': unavailable.has(`${row}${seat}`), 'is-selected': selectedSeat === `${row}${seat}` }" :disabled="unavailable.has(`${row}${seat}`)" :aria-label="`Seat ${row}${seat}`" @click="selectedSeat = `${row}${seat}`">{{ seat }}</button><span v-if="index === 2" class="seat-gap"></span></template></div></div></div><div class="seat-legend"><span><i></i> Available</span><span><i class="taken-key"></i> Occupied</span><span><i class="selected-key"></i> Selected</span><b v-if="selectedSeat">Seat {{ selectedSeat }}</b></div></div>
</template>