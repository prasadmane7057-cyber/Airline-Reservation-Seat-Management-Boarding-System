<script setup>
import { computed, ref } from 'vue'
import { Search } from '@lucide/vue'
const props = defineProps({ passengers: { type: Array, required: true } })
const query = ref('')
const filtered = computed(() => props.passengers.filter((person) => Object.values(person).join(' ').toLowerCase().includes(query.value.toLowerCase())))
</script>
<template>
  <section class="data-panel"><div class="toolbar-row"><span class="record-count">{{ filtered.length }} passenger records</span><label class="table-search"><Search :size="14" /><input v-model="query" placeholder="Filter passengers" /></label></div><div class="table-wrap"><table><thead><tr><th>Passenger</th><th>Passenger ID</th><th>Flight</th><th>Seat</th><th>Cabin</th><th>Check-in</th></tr></thead><tbody><tr v-for="person in filtered" :key="person.id"><td><b>{{ person.name }}</b></td><td class="muted-cell">{{ person.id }}</td><td><b>{{ person.flight }}</b></td><td>{{ person.seat }}</td><td>{{ person.cabin }}</td><td><span class="status-pill" :class="`status-${person.status.toLowerCase().replaceAll(' ', '-')}`">{{ person.status }}</span></td></tr><tr v-if="!filtered.length"><td colspan="6" class="empty-state">No passengers match this search.</td></tr></tbody></table></div></section>
</template>