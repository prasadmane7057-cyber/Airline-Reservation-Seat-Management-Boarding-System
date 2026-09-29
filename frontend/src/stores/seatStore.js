import { defineStore } from 'pinia';
import { seatApi } from '../services/api';

export const useSeatStore = defineStore('seat', {
  state: () => ({
    seats: [],
    selectedSeats: [], // Array of seat objects { seat_number, seat_class, price, row_number, column_letter }
    maxSelectable: 1,
    travelClass: 'Economy',
    loading: false,
    error: null
  }),

  getters: {
    firstClassSeats: (state) => state.seats.filter(s => s.seat_class === 'First Class'),
    businessClassSeats: (state) => state.seats.filter(s => s.seat_class === 'Business'),
    economyClassSeats: (state) => state.seats.filter(s => s.seat_class === 'Economy'),
    
    selectedSeatNumbers: (state) => state.selectedSeats.map(s => s.seat_number),
    
    // Group seats by row for aircraft matrix rendering
    seatRows: (state) => {
      const rowsMap = {};
      state.seats.forEach(seat => {
        if (!rowsMap[seat.row_number]) {
          rowsMap[seat.row_number] = {
            rowNumber: seat.row_number,
            seatClass: seat.seat_class,
            leftCol: [],  // A, B, C
            rightCol: []  // D, E, F
          };
        }
        if (['A', 'B', 'C'].includes(seat.column_letter)) {
          rowsMap[seat.row_number].leftCol.push(seat);
        } else {
          rowsMap[seat.row_number].rightCol.push(seat);
        }
      });
      return Object.values(rowsMap).sort((a, b) => a.rowNumber - b.rowNumber);
    }
  },

  actions: {
    async fetchSeats(flightId) {
      this.loading = true;
      this.error = null;
      try {
        const res = await seatApi.getSeatsByFlight(flightId);
        this.seats = res.seats || [];
      } catch (err) {
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    setMaxSelectable(count) {
      this.maxSelectable = parseInt(count, 10) || 1;
    },

    setTravelClass(cls) {
      this.travelClass = cls;
      this.selectedSeats = []; // reset if class changes
    },

    toggleSeat(seat) {
      if (seat.is_occupied || seat.is_blocked) {
        return { success: false, message: 'This seat is already occupied or blocked.' };
      }

      const index = this.selectedSeats.findIndex(s => s.seat_number === seat.seat_number);

      if (index !== -1) {
        // Deselect
        this.selectedSeats.splice(index, 1);
        return { success: true, action: 'removed' };
      } else {
        // Select
        if (this.selectedSeats.length >= this.maxSelectable) {
          if (this.maxSelectable === 1) {
            this.selectedSeats = [seat];
            return { success: true, action: 'replaced' };
          }
          return {
            success: false,
            message: `You can only select up to ${this.maxSelectable} seats for this booking.`
          };
        }
        this.selectedSeats.push(seat);
        return { success: true, action: 'added' };
      }
    },

    clearSelection() {
      this.selectedSeats = [];
    }
  }
});
