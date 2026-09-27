<script setup>
import { Check, ScanLine } from '@lucide/vue'
defineProps({ passengers: { type: Array, required: true } })
defineEmits(['board'])
</script>
<template>
  <section class="data-panel"><div class="toolbar-row"><span class="record-count">{{ passengers.filter((person) => person.status === 'Boarded').length }} of {{ passengers.length }} passengers boarded</span><span class="gate-badge"><ScanLine :size="14" /> GATE SCAN ACTIVE</span></div><div class="queue-list"><div v-for="person in passengers" :key="person.id" class="queue-item"><span class="avatar" :class="person.status === 'Boarded' ? 'avatar-green' : 'avatar-neutral'">{{ person.name.split(' ').map((part) => part[0]).join('') }}</span><span class="queue-person"><b>{{ person.name }}</b><small>{{ person.id }} · Seat {{ person.seat }} · {{ person.cabin }}</small></span><span class="queue-side"><span class="status-pill" :class="`status-${person.status.toLowerCase().replaceAll(' ', '-')}`">{{ person.status }}</span><button v-if="person.status !== 'Boarded'" class="table-action" @click="$emit('board', person.id)">Board <Check :size="13" /></button></span></div></div></section>
</template>