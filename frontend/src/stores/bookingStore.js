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
        baseFare: 0,
        taxAmount: 0,
        discountAmount: 0,
        totalFare: 0
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

      const fareByClass = {
        Economy: 5000,
        Business: 10000,
        'First Class': 20000
      };
      const baseUnitPrice = fareByClass[this.draft.travelClass];
      if (baseUnitPrice === undefined) {
        throw new Error('A supported travel class is required to calculate the academic fare.');
      }

      const count = Math.max(1, this.draft.seats.length || this.draft.passengers.length || 1);
      const totalBase = Math.round(baseUnitPrice * count * 100) / 100;

      this.draft.fare = {
        baseFare: totalBase,
        taxAmount: 0,
        discountAmount: 0,
        totalFare: totalBase
      };
    },

    async confirmBooking() {
      this.loading = true;
      this.error = null;
      try {
        if (this.draft.passengers.length !== 1 || this.draft.seats.length !== 1) {
          throw new Error('The current reservation API supports one passenger and one seat per booking.');
        }
        const seat = this.draft.seats[0];
        if (!seat.id) throw new Error('The selected seat is not backed by a database seat record.');
        const passenger = this.draft.passengers[0];
        const { passenger: profile } = await passengerApi.getMine();
        if (!profile?.id) throw new Error('A passenger profile is not linked to this account.');
        await passengerApi.update(profile.id, {
          fullName: passenger.fullName,
          email: passenger.email,
          phone: passenger.phone || ''
        });
        const payload = {
          flightId: this.draft.flight.id,
          passengerId: profile.id,
          seatId: seat.id,
          travelClass: this.draft.travelClass,
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
