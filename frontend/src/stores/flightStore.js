import { defineStore } from 'pinia';
import { flightApi, airportApi } from '../services/api';

export const useFlightStore = defineStore('flight', {
  state: () => ({
    flights: [],
    airports: [],
    airportError: null,
    selectedFlight: null,
    searchParams: {
      from: '',
      to: '',
      date: '',
      returnDate: '',
      passengers: 1,
      travelClass: 'Economy',
      sortBy: 'departure',
      maxPrice: null
    },
    loading: false,
    error: null
  }),

  actions: {
    async fetchAirports() {
      if (this.airports.length > 0) return;
      this.airportError = null;
      try {
        const res = await airportApi.getAirports();
        if (!Array.isArray(res.airports)) {
          throw new Error('The airport service returned an invalid response.');
        }
        this.airports = res.airports || [];
      } catch (err) {
        this.airportError = err.message || 'Unable to load airports.';
        throw err;
      }
    },

    async searchFlights(customParams = {}) {
      this.loading = true;
      this.error = null;
      try {
        const params = {
          ...this.searchParams,
          ...customParams
        };
        const res = await flightApi.getFlights(params);
        this.flights = res.flights || [];
        return this.flights;
      } catch (err) {
        this.error = err.message;
        this.flights = [];
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async fetchFlightDetails(id) {
      this.loading = true;
      this.error = null;
      try {
        const res = await flightApi.getFlightById(id);
        this.selectedFlight = res.flight;
        return res.flight;
      } catch (err) {
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    setSearchParams(params) {
      this.searchParams = { ...this.searchParams, ...params };
    },

    setSelectedFlight(flight) {
      this.selectedFlight = flight;
    }
  }
});
