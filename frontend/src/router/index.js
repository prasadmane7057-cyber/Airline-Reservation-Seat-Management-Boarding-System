import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/authStore';

// Layouts
import AppLayout from '../layouts/AppLayout.vue';
import AdminLayout from '../layouts/AdminLayout.vue';

// Public & Booking Views
import Home from '../views/Home.vue';
import Login from '../views/Login.vue';
import Register from '../views/Register.vue';
import FlightSearch from '../views/FlightSearch.vue';
import FlightDetails from '../views/FlightDetails.vue';
import SeatSelection from '../views/SeatSelection.vue';
import PassengerDetails from '../views/PassengerDetails.vue';
import Payment from '../views/Payment.vue';
import BookingConfirmation from '../views/BookingConfirmation.vue';

// Passenger Views
import PassengerDashboard from '../views/PassengerDashboard.vue';
import MyBookings from '../views/MyBookings.vue';
import BookingDetails from '../views/BookingDetails.vue';
import BoardingPass from '../views/BoardingPass.vue';
import Profile from '../views/Profile.vue';

// Admin Views
import AdminDashboard from '../views/admin/AdminDashboard.vue';
import AdminFlights from '../views/admin/AdminFlights.vue';
import AdminAirports from '../views/admin/AdminAirports.vue';
import AdminPassengers from '../views/admin/AdminPassengers.vue';
import AdminBookings from '../views/admin/AdminBookings.vue';
import AdminBoarding from '../views/admin/AdminBoarding.vue';

const routes = [
  {
    path: '/',
    component: AppLayout,
    children: [
      { path: '', name: 'Home', component: Home, meta: { title: 'SkyWings Airlines | Fly Smarter' } },
      { path: 'login', name: 'Login', component: Login, meta: { title: 'Login | SkyWings', guestOnly: true } },
      { path: 'register', name: 'Register', component: Register, meta: { title: 'Register | SkyWings', guestOnly: true } },
      { path: 'flights', name: 'FlightSearch', component: FlightSearch, meta: { title: 'Search Flights | SkyWings' } },
      { path: 'flights/:id', name: 'FlightDetails', component: FlightDetails, meta: { title: 'Flight Details | SkyWings' } },
      { path: 'seat-selection/:flightId', name: 'SeatSelection', component: SeatSelection, meta: { title: 'Select Seats | SkyWings', requiresAuth: true } },
      { path: 'passenger-details/:flightId', name: 'PassengerDetails', component: PassengerDetails, meta: { title: 'Passenger Details | SkyWings', requiresAuth: true } },
      { path: 'payment', name: 'Payment', component: Payment, meta: { title: 'Payment | SkyWings', requiresAuth: true } },
      { path: 'booking-confirmation/:pnr', name: 'BookingConfirmation', component: BookingConfirmation, meta: { title: 'Booking Confirmed | SkyWings', requiresAuth: true } },
      { path: 'dashboard', name: 'PassengerDashboard', component: PassengerDashboard, meta: { title: 'Passenger Dashboard | SkyWings', requiresAuth: true } },
      { path: 'my-bookings', name: 'MyBookings', component: MyBookings, meta: { title: 'My Bookings | SkyWings', requiresAuth: true } },
      { path: 'booking-details/:id', name: 'BookingDetails', component: BookingDetails, meta: { title: 'Booking Details | SkyWings', requiresAuth: true } },
      { path: 'boarding-pass', name: 'BoardingPass', component: BoardingPass, meta: { title: 'Digital Boarding Pass | SkyWings' } },
      { path: 'profile', name: 'Profile', component: Profile, meta: { title: 'Profile | SkyWings', requiresAuth: true } }
    ]
  },
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      { path: '', redirect: '/admin/dashboard' },
      { path: 'dashboard', name: 'AdminDashboard', component: AdminDashboard, meta: { title: 'Admin Dashboard | SkyWings' } },
      { path: 'flights', name: 'AdminFlights', component: AdminFlights, meta: { title: 'Flight Management | SkyWings' } },
      { path: 'airports', name: 'AdminAirports', component: AdminAirports, meta: { title: 'Airports Management | SkyWings' } },
      { path: 'passengers', name: 'AdminPassengers', component: AdminPassengers, meta: { title: 'Passengers Management | SkyWings' } },
      { path: 'bookings', name: 'AdminBookings', component: AdminBookings, meta: { title: 'Bookings Management | SkyWings' } },
      { path: 'boarding', name: 'AdminBoarding', component: AdminBoarding, meta: { title: 'Boarding Operations | SkyWings' } }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 };
  }
});

// Navigation Guards
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  // Set Page Title
  if (to.meta.title) {
    document.title = to.meta.title;
  }

  // Check Guest Only routes (e.g. Login / Register)
  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return next(authStore.isAdmin ? '/admin/dashboard' : '/dashboard');
  }

  // Check Auth Requirements
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next({ path: '/login', query: { redirect: to.fullPath } });
  }

  // Check Admin Requirements
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    return next('/dashboard');
  }

  next();
});

export default router;
