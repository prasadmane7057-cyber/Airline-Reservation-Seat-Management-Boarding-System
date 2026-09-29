import { defineStore } from 'pinia';
import { authApi } from '../services/api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('airline_user') || 'null'),
    token: localStorage.getItem('airline_token') || null,
    loading: false,
    error: null
  }),

  getters: {
    isAuthenticated: (state) => !!state.token && !!state.user,
    isAdmin: (state) => state.user?.role === 'admin',
    isPassenger: (state) => state.user?.role === 'passenger',
    userName: (state) => state.user?.name || 'Guest'
  },

  actions: {
    async login(credentials) {
      this.loading = true;
      this.error = null;
      try {
        const response = await authApi.login(credentials);
        this.token = response.token;
        this.user = response.user;

        localStorage.setItem('airline_token', response.token);
        localStorage.setItem('airline_user', JSON.stringify(response.user));
        return response;
      } catch (err) {
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async register(userData) {
      this.loading = true;
      this.error = null;
      try {
        const response = await authApi.register(userData);
        this.token = response.token;
        this.user = response.user;

        localStorage.setItem('airline_token', response.token);
        localStorage.setItem('airline_user', JSON.stringify(response.user));
        return response;
      } catch (err) {
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async fetchProfile() {
      try {
        const res = await authApi.getMe();
        this.user = res.user;
        localStorage.setItem('airline_user', JSON.stringify(res.user));
      } catch (err) {
        console.error('Failed to refresh profile', err);
      }
    },

    async updateProfile(profileData) {
      this.loading = true;
      try {
        const res = await authApi.updateProfile(profileData);
        await this.fetchProfile();
        return res;
      } catch (err) {
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async changePassword(passwordData) {
      this.loading = true;
      try {
        return await authApi.changePassword(passwordData);
      } catch (err) {
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    logout() {
      this.user = null;
      this.token = null;
      this.error = null;
      localStorage.removeItem('airline_token');
      localStorage.removeItem('airline_user');
    }
  }
});
