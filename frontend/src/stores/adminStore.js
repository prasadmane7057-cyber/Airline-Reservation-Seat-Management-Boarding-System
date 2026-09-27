import { defineStore } from 'pinia';
import { adminApi, flightApi, airportApi, bookingApi, boardingApi, passengerApi } from '../services/api';

export const useAdminStore = defineStore('admin', {
  state: () => ({
    stats: null,
    flights: [],
    airports: [],
    bookings: [],
    passengers: [],
    boardingManifest: [],
    selectedFlightForBoarding: null,
    loading: false,
    error: null
  }),

  actions: {
    async fetchDashboardStats() {
      this.loading = true;
      try {
        const res = await adminApi.getDashboardStats();
        this.stats = res.stats;
        return res.stats;
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    async fetchAdminFlights(params = {}) {
      this.loading = true;
      try {
        const res = await flightApi.getFlights(params);
        this.flights = res.flights || [];
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    async createFlight(data) {
      const res = await flightApi.createFlight(data);
      await this.fetchAdminFlights();
      return res;
    },

    async updateFlight(id, data) {
      const res = await flightApi.updateFlight(id, data);
      await this.fetchAdminFlights();
      return res;
    },

    async deleteFlight(id) {
      const res = await flightApi.deleteFlight(id);
      await this.fetchAdminFlights();
      return res;
    },

    async fetchAirports() {
      try {
        const res = await airportApi.getAirports();
        this.airports = res.airports || [];
      } catch (err) {
        this.error = err.message;
      }
    },

    async createAirport(data) {
      const res = await airportApi.createAirport(data);
      await this.fetchAirports();
      return res;
    },

    async updateAirport(id, data) {
      const res = await airportApi.updateAirport(id, data);
      await this.fetchAirports();
      return res;
    },

    async deleteAirport(id) {
      const res = await airportApi.deleteAirport(id);
      await this.fetchAirports();
      return res;
    },

    async fetchAllBookings(params = {}) {
      this.loading = true;
      try {
        const res = await bookingApi.getAllBookings(params);
        this.bookings = res.bookings || [];
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    async updateBookingStatus(id, data) {
      const res = await bookingApi.updateBookingStatus(id, data);
      await this.fetchAllBookings();
      return res;
    },

    async cancelBookingAdmin(id) {
      const res = await bookingApi.cancelBooking(id);
      await this.fetchAllBookings();
      return res;
    },

    async fetchPassengers() {
      this.loading = true;
      try {
        const res = await passengerApi.getPassengers();
        this.passengers = res.passengers || [];
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    async togglePassengerStatus(id, newStatus) {
      const res = await passengerApi.updateStatus(id, { status: newStatus });
      await this.fetchPassengers();
      return res;
    },

    async fetchBoardingManifest(flightId) {
      this.loading = true;
      try {
        const res = await boardingApi.getBoardingByFlight(flightId);
        this.boardingManifest = res.manifest || [];
        this.selectedFlightForBoarding = flightId;
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    async updateBoardingStatus(boardingId, newStatus) {
      const res = await boardingApi.updateBoardingStatus(boardingId, { status: newStatus });
      if (this.selectedFlightForBoarding) {
        await this.fetchBoardingManifest(this.selectedFlightForBoarding);
      }
      return res;
    }
  }
});
