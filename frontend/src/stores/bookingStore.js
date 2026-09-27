import { defineStore } from 'pinia';
import { bookingApi } from '../services/api';

export const useBookingStore = defineStore('booking', {
  state: () => ({
    draft: {
      flight: null,
      travelClass: 'Economy',
      seats: [],
      passengers: [], // [{ fullName, age, gender, passportId, seatNumber, email, phone }]
      fare: {
        baseFare: 0,
        taxAmount: 0,
        discountAmount: 500,
        totalFare: 0
      },
      paymentMethod: 'Credit Card'
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
        age: '',
        gender: 'Male',
        passportId: '',
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

      let baseUnitPrice = this.draft.flight.economy_fare;
      if (this.draft.travelClass === 'Business') {
        baseUnitPrice = this.draft.flight.business_fare;
      } else if (this.draft.travelClass === 'First Class') {
        baseUnitPrice = this.draft.flight.first_class_fare;
      }

      const count = Math.max(1, this.draft.seats.length || this.draft.passengers.length || 1);
      const totalBase = Math.round(baseUnitPrice * count * 100) / 100;
      const tax = Math.round(totalBase * 0.18 * 100) / 100;
      const discount = 500;
      const total = Math.round((totalBase + tax - discount) * 100) / 100;

      this.draft.fare = {
        baseFare: totalBase,
        taxAmount: tax,
        discountAmount: discount,
        totalFare: total
      };
    },

    async confirmBooking(paymentMethod = 'Credit Card') {
      this.loading = true;
      this.error = null;
      try {
        const payload = {
          flightId: this.draft.flight.id,
          travelClass: this.draft.travelClass,
          passengers: this.draft.passengers,
          paymentMethod: paymentMethod,
          customDiscount: this.draft.fare.discountAmount
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
