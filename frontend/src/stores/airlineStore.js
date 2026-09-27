import { reactive } from 'vue'

const state = reactive({
  flights: [
    { id: 'SK-204', route: 'New York → London', origin: 'JFK', destination: 'LHR', departure: '09:35', gate: 'B12', status: 'Boarding', aircraft: 'Boeing 787-9', capacity: 286, occupied: 241 },
    { id: 'SK-118', route: 'New York → Paris', origin: 'JFK', destination: 'CDG', departure: '10:20', gate: 'A06', status: 'On time', aircraft: 'Airbus A350-900', capacity: 312, occupied: 278 },
    { id: 'SK-087', route: 'Boston → Dublin', origin: 'BOS', destination: 'DUB', departure: '11:05', gate: 'C03', status: 'On time', aircraft: 'Boeing 737 MAX 8', capacity: 178, occupied: 132 },
    { id: 'SK-331', route: 'New York → Tokyo', origin: 'JFK', destination: 'HND', departure: '12:40', gate: 'B08', status: 'Delayed', aircraft: 'Airbus A350-1000', capacity: 348, occupied: 319 },
    { id: 'SK-052', route: 'Chicago → Madrid', origin: 'ORD', destination: 'MAD', departure: '13:15', gate: 'D14', status: 'On time', aircraft: 'Boeing 787-8', capacity: 254, occupied: 187 },
  ],
  passengers: [
    { id: 'P-10428', name: 'Olivia Bennett', flight: 'SK-204', seat: '14A', cabin: 'Business', status: 'Checked in' },
    { id: 'P-10429', name: 'Marcus Chen', flight: 'SK-204', seat: '14C', cabin: 'Business', status: 'Boarded' },
    { id: 'P-10430', name: 'Amara Okafor', flight: 'SK-118', seat: '22F', cabin: 'Economy', status: 'Checked in' },
    { id: 'P-10431', name: 'James Whitaker', flight: 'SK-087', seat: '08D', cabin: 'Economy', status: 'Pending' },
    { id: 'P-10432', name: 'Sofia Laurent', flight: 'SK-204', seat: '02A', cabin: 'First', status: 'Boarded' },
    { id: 'P-10433', name: 'Noah Williams', flight: 'SK-331', seat: '31B', cabin: 'Economy', status: 'Checked in' },
    { id: 'P-10434', name: 'Priya Patel', flight: 'SK-118', seat: '06K', cabin: 'Business', status: 'Checked in' },
  ],
  bookings: [
    { id: 'BK-83912', passenger: 'Olivia Bennett', route: 'JFK → LHR', flight: 'SK-204', date: '27 Sep 2026', seat: '14A', amount: '$2,480', status: 'Confirmed' },
    { id: 'BK-83911', passenger: 'Amara Okafor', route: 'JFK → CDG', flight: 'SK-118', date: '27 Sep 2026', seat: '22F', amount: '$940', status: 'Confirmed' },
    { id: 'BK-83910', passenger: 'James Whitaker', route: 'BOS → DUB', flight: 'SK-087', date: '27 Sep 2026', seat: '08D', amount: '$1,125', status: 'Pending' },
    { id: 'BK-83909', passenger: 'Sofia Laurent', route: 'JFK → LHR', flight: 'SK-204', date: '27 Sep 2026', seat: '02A', amount: '$4,820', status: 'Confirmed' },
  ],
  waitlist: [
    { id: 'WL-2048', name: 'Ethan Brooks', flight: 'SK-204', cabin: 'Business', requested: '08:42', priority: 'Gold' },
    { id: 'WL-2047', name: 'Maya Singh', flight: 'SK-118', cabin: 'Economy', requested: '08:36', priority: 'Standard' },
    { id: 'WL-2046', name: 'Lucas Meyer', flight: 'SK-204', cabin: 'Economy', requested: '08:21', priority: 'Silver' },
    { id: 'WL-2045', name: 'Ava Thompson', flight: 'SK-087', cabin: 'Economy', requested: '08:04', priority: 'Standard' },
  ],
})

export function useAirlineStore() {
  return {
    state,
    boardPassenger(id) {
      const passenger = state.passengers.find((item) => item.id === id)
      if (passenger) passenger.status = 'Boarded'
    },
    confirmBooking(id) {
      const booking = state.bookings.find((item) => item.id === id)
      if (booking) booking.status = 'Confirmed'
    },
    promoteWaitlist(id) {
      const index = state.waitlist.findIndex((item) => item.id === id)
      if (index < 0) return
      const [waiting] = state.waitlist.splice(index, 1)
      state.passengers.unshift({ id: `P-${Date.now().toString().slice(-5)}`, name: waiting.name, flight: waiting.flight, seat: 'Assign seat', cabin: waiting.cabin, status: 'Pending' })
    },
    addPassenger(passenger) {
      state.passengers.unshift({ id: `P-${Date.now().toString().slice(-5)}`, ...passenger })
    },
  }
}