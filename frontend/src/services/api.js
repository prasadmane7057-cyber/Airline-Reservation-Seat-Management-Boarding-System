import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

// Request Interceptor: Attach JWT Token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('airline_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Global Errors (401, 403, 500)
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response ? error.response.status : null;
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred.';

    if (status === 401) {
      // Clear token and redirect to login if session expired
      localStorage.removeItem('airline_token');
      localStorage.removeItem('airline_user');
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login?expired=true';
      }
    }

    return Promise.reject(new Error(message));
  }
);

// Auth Service
export const authApi = {
  register: (data) => apiClient.post('/auth/register', data),
  login: (data) => apiClient.post('/auth/login', data),
  getMe: () => apiClient.get('/auth/me'),
  updateProfile: (data) => apiClient.put('/auth/profile', data),
  changePassword: (data) => apiClient.put('/auth/change-password', data)
};

// Flight Service
export const flightApi = {
  getFlights: (params) => apiClient.get('/flights', { params }),
  getFlightById: (id) => apiClient.get(`/flights/${id}`),
  createFlight: (data) => apiClient.post('/flights', data),
  updateFlight: (id, data) => apiClient.put(`/flights/${id}`, data),
  deleteFlight: (id) => apiClient.delete(`/flights/${id}`)
};

// Airport Service
export const airportApi = {
  getAirports: () => apiClient.get('/airports'),
  createAirport: (data) => apiClient.post('/airports', data),
  updateAirport: (id, data) => apiClient.put(`/airports/${id}`, data),
  deleteAirport: (id) => apiClient.delete(`/airports/${id}`)
};

// Seat Service
export const seatApi = {
  getSeatsByFlight: (flightId) => apiClient.get(`/seats/flight/${flightId}`),
  updateSeatStatus: (seatId, data) => apiClient.put(`/seats/${seatId}`, data)
};

// Booking Service
export const bookingApi = {
  createBooking: (data) => apiClient.post('/bookings', data),
  getUserBookings: () => apiClient.get('/bookings'),
  getBookingById: (idOrPnr) => apiClient.get(`/bookings/${idOrPnr}`),
  cancelBooking: (id) => apiClient.post(`/bookings/${id}/cancel`),
  getAllBookings: (params) => apiClient.get('/bookings/admin/all', { params }),
  updateBookingStatus: (id, data) => apiClient.put(`/bookings/${id}/status`, data)
};

// Boarding Service
export const boardingApi = {
  getBoardingByFlight: (flightId) => apiClient.get(`/boarding/flight/${flightId}`),
  getBoardingPass: (identifier) => apiClient.get(`/boarding/pass/${identifier}`),
  updateBoardingStatus: (id, data) => apiClient.put(`/boarding/${id}/status`, data),
  selfCheckIn: (data) => apiClient.post('/boarding/checkin', data)
};

// Payment Service
export const paymentApi = {
  processPayment: (data) => apiClient.post('/payments', data)
};

// Passenger Service
export const passengerApi = {
  getPassengers: () => apiClient.get('/passengers'),
  updateStatus: (id, data) => apiClient.put(`/passengers/${id}/status`, data)
};

// Admin Service
export const adminApi = {
  getDashboardStats: () => apiClient.get('/admin/dashboard')
};

export default apiClient;
