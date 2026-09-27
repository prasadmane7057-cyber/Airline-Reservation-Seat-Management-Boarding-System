<script setup>
import { Bell, Menu, Search } from '@lucide/vue'
import { useRoute } from 'vue-router'
defineEmits(['toggle-menu'])
const route = useRoute()
</script>

<template>
  <header class="topbar"><button class="icon-button menu-toggle" aria-label="Toggle navigation" @click="$emit('toggle-menu')"><Menu :size="19" /></button><div class="breadcrumb"><span>Operations</span><b>/</b><strong>{{ route.name }}</strong></div><div class="topbar-tools"><label class="search-box"><Search :size="16" /><input placeholder="Search flights, passengers..." aria-label="Search" /><kbd>⌘ K</kbd></label><button class="icon-button notification-button" aria-label="Notifications"><Bell :size="18" /><i></i></button><span class="topbar-divider"></span><span class="date-chip">SUNDAY, 27 SEP <b>·</b> 09:14 EDT</span></div></header>
</template>