import { createRouter, createWebHistory } from 'vue-router'

const pages = ['Dashboard', 'Flights', 'Passengers', 'Booking', 'Seats', 'Waitlist', 'Boarding', 'Manifest', 'Graphics']

export default createRouter({
  history: createWebHistory(),
  routes: pages.map((name) => ({
    path: name === 'Dashboard' ? '/' : `/${name.toLowerCase()}`,
    name,
    component: () => import(`../views/${name}.vue`),
  })),
})