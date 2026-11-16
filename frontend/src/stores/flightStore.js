import { defineStore } from 'pinia';
import { flightApi } from '../services/api';

export const useFlightStore = defineStore('flight', {
  state: () => ({
    flights: [],
    selectedFlight: null,
    searchParams: {
      to: '',
      status: ''
    },
    loading: false,
    error: null
  }),

  actions: {
    async searchFlights(customParams = {}) {
      this.loading = true;
      this.error = null;
      try {
        const requested = {
          ...this.searchParams,
          ...customParams
        };
        const params = {};
        for (const key of ['to', 'status']) {
          if (typeof requested[key] === 'string' && requested[key].trim()) {
            params[key] = requested[key].trim();
          }
        }
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
      this.searchParams = {
        to: typeof params.to === 'string' ? params.to : this.searchParams.to,
        status: typeof params.status === 'string' ? params.status : this.searchParams.status
      };
    },

    setSelectedFlight(flight) {
      this.selectedFlight = flight;
    }
  }
});
