import { defineStore } from 'pinia';
import { bookingApi, passengerApi } from '../services/api';

export const useBookingStore = defineStore('booking', {
  state: () => ({
    draft: {
      flight: null,
      travelClass: 'Economy',
      seats: [],
      passengers: [], // [{ fullName, seatNumber, email, phone }]
      fare: {
        baseFare: 5000,
        taxAmount: 600,
        discountAmount: 0,
        totalFare: 5600
      },
    },
    currentBooking: null,
    myBookings: [],
    loading: false,
    error: null
  }),

  actions: {
    initBooking(flight, travelClass = 'Economy', passengerCount = 1) {
      this.draft.flight = flight;
      this.draft.travelClass = travelClass;
      this.draft.seats = [];
      this.draft.passengers = Array.from({ length: passengerCount }, () => ({
        fullName: '',
        seatNumber: '',
        phone: '',
        email: ''
      }));
      this.calculateFare();
    },

    setSeats(seats) {
      this.draft.seats = seats;
      // Assign seat numbers to passenger drafts
      seats.forEach((s, idx) => {
        if (this.draft.passengers[idx]) {
          this.draft.passengers[idx].seatNumber = s.seat_number;
        }
      });
      this.calculateFare();
    },

    setPassengers(passengers) {
      this.draft.passengers = passengers;
    },

    calculateFare() {
      if (!this.draft.flight) return;

      const flight = this.draft.flight;
      let unitPrice = 5000;
      if (this.draft.travelClass === 'First Class') {
        unitPrice = flight.first_class_fare || 20000;
      } else if (this.draft.travelClass === 'Business') {
        unitPrice = flight.business_fare || 10000;
      } else {
        unitPrice = flight.economy_fare || 5000;
      }

      const count = Math.max(1, this.draft.seats.length || this.draft.passengers.length || 1);
      const totalBase = Math.round(unitPrice * count);
      const tax = Math.round(totalBase * 0.12);

      this.draft.fare = {
        baseFare: totalBase,
        taxAmount: tax,
        discountAmount: 0,
        totalFare: totalBase + tax
      };
    },

    async confirmBooking() {
      this.loading = true;
      this.error = null;
      try {
        const seat = this.draft.seats[0] || {};
        const passenger = this.draft.passengers[0] || {};

        let profileId = 1;
        try {
          const profileRes = await passengerApi.getMine();
          if (profileRes?.passenger?.id) {
            profileId = profileRes.passenger.id;
          }
       } catch {
  // Fall back gracefully
}

        const payload = {
          flightId: this.draft.flight.id,
          passengerId: profileId,
          seatId: seat.id,
          seatNumber: seat.seat_number || '12A',
          travelClass: this.draft.travelClass,
          fare: this.draft.fare.totalFare,
          passenger: {
            fullName: passenger.fullName,
            email: passenger.email,
            phone: passenger.phone || ''
          },
          passengers: [
            {
              fullName: passenger.fullName,
              email: passenger.email,
              phone: passenger.phone || '',
              seatNumber: seat.seat_number || '12A'
            }
          ]
        };

        const res = await bookingApi.createBooking(payload);
        this.currentBooking = res.booking;
        return res;
      } catch (err) {
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async fetchUserBookings() {
      this.loading = true;
      this.error = null;
      try {
        const res = await bookingApi.getUserBookings();
        this.myBookings = res.bookings || [];
        return this.myBookings;
      } catch (err) {
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async fetchBookingDetails(idOrPnr) {
      this.loading = true;
      this.error = null;
      try {
        const res = await bookingApi.getBookingById(idOrPnr);
        this.currentBooking = res.booking;
        return res.booking;
      } catch (err) {
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async cancelBooking(bookingId) {
      this.loading = true;
      try {
        const res = await bookingApi.cancelBooking(bookingId);
        await this.fetchUserBookings();
        return res;
      } catch (err) {
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    }
  }
});
