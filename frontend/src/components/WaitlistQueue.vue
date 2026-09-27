<script setup>
import { ArrowUpRight } from '@lucide/vue'
defineProps({ entries: { type: Array, required: true } })
defineEmits(['promote'])
</script>
<template>
  <section class="data-panel"><div class="toolbar-row"><span class="record-count">Priority queue · first requested, first served</span><span class="live-label"><i></i> UPDATED JUST NOW</span></div><div class="queue-list"><div v-for="(entry, index) in entries" :key="entry.id" class="queue-item"><span class="queue-number">{{ String(index + 1).padStart(2, '0') }}</span><span class="queue-person"><b>{{ entry.name }}</b><small>{{ entry.id }} · {{ entry.cabin }} · Flight {{ entry.flight }}</small></span><span class="queue-side"><small>{{ entry.requested }}</small><button class="table-action" @click="$emit('promote', entry.id)">Offer seat <ArrowUpRight :size="13" /></button></span></div><div v-if="!entries.length" class="empty-state">The waitlist is clear.</div></div></section>
</template>