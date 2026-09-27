<script setup>
import { ref } from 'vue'
import Navbar from './components/Navbar.vue'
import Sidebar from './components/Sidebar.vue'

const sidebarOpen = ref(false)
</script>

<template>
  <div class="app-shell">
    <Sidebar :open="sidebarOpen" @navigate="sidebarOpen = false" />
    <div class="workspace">
      <Navbar @toggle-menu="sidebarOpen = !sidebarOpen" />
      <main class="page-content"><RouterView /></main>
      <footer class="app-footer"><span>SKYOPS AIRLINE OPERATIONS</span><span>CONTROL CENTER <i></i> LIVE</span></footer>
    </div>
  </div>
</template>
