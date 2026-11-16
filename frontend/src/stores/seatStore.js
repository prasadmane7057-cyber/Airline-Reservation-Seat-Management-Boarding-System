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
    
    seatRows: (state) => {
      const rowsMap = new Map();
      state.seats.forEach(seat => {
        const rowNumber = seat.row_number;
        const key = Number.isSafeInteger(rowNumber) ? rowNumber : 'other';
        if (!rowsMap.has(key)) {
          rowsMap.set(key, { rowNumber, seats: [] });
        }
        rowsMap.get(key).seats.push(seat);
      });
      return [...rowsMap.values()]
        .map(row => ({
          ...row,
          seats: row.seats.sort((left, right) =>
            left.seat_number.localeCompare(right.seat_number, undefined, { numeric: true })
          )
        }))
        .sort((left, right) => {
          if (left.rowNumber === null) return 1;
          if (right.rowNumber === null) return -1;
          return left.rowNumber - right.rowNumber;
        });
    }
  },

  actions: {
    async fetchSeats(flightId) {
      this.loading = true;
      this.error = null;
      try {
        const res = await seatApi.getSeatsByFlight(flightId);
        this.seats = (res.seats || []).map(seat => {
          const match = /^(\d+)([A-Z]{1,2})$/.exec(seat.seat_number);
          return {
            ...seat,
            row_number: match ? Number(match[1]) : null,
            column_letter: match ? match[2] : null,
            is_occupied: seat.seat_status === 'BOOKED',
            is_blocked: seat.seat_status === 'BLOCKED'
          };
        });
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
      if (seat.seat_status !== 'AVAILABLE' || seat.is_occupied || seat.is_blocked) {
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
