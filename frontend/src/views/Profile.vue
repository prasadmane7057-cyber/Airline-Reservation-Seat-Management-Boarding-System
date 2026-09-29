<template>
  <div class="profile-page page-wrapper">
    <div class="container-narrow">
      <div class="profile-header-card card">
        <div class="profile-avatar-large">
          {{ userInitial }}
        </div>
        <div class="profile-title-block">
          <h1 class="page-title mb-0">{{ authStore.userName }}</h1>
          <p class="user-role-badge">
            <span class="badge" :class="authStore.isAdmin ? 'badge-first' : 'badge-confirmed'">
              {{ authStore.user?.role?.toUpperCase() || 'PASSENGER' }}
            </span>
            <span class="email-text">{{ authStore.user?.email }}</span>
          </p>
        </div>
      </div>

      <div class="profile-sections-grid">
        <!-- Edit Profile Form -->
        <div class="card form-card">
          <h3 class="card-title">Personal Details</h3>

          <div v-if="profileSuccess" class="alert-success">
            ✓ {{ profileSuccess }}
          </div>
          <div v-if="profileError" class="alert-danger">
            ⚠️ {{ profileError }}
          </div>

          <form @submit.prevent="saveProfile">
            <div class="form-group">
              <label class="form-label">Full Name</label>
              <input type="text" v-model="profileForm.name" class="form-input" required />
            </div>

            <div class="form-group">
              <label class="form-label">Email Address (Read-only)</label>
              <input type="email" :value="authStore.user?.email" class="form-input" disabled />
            </div>

            <div class="form-group">
              <label class="form-label">Phone Number</label>
              <input type="tel" v-model="profileForm.phone" class="form-input" />
            </div>

            <div class="form-group">
              <label class="form-label">Date of Birth</label>
              <input type="date" v-model="profileForm.dob" class="form-input" />
            </div>

            <div class="form-group">
              <label class="form-label">Address</label>
              <textarea v-model="profileForm.address" class="form-textarea" rows="3"></textarea>
            </div>

            <button type="submit" class="btn btn-primary" :disabled="savingProfile">
              <span v-if="savingProfile">Saving Changes...</span>
              <span v-else>Save Profile</span>
            </button>
          </form>
        </div>

        <!-- Change Password Form -->
        <div class="card form-card">
          <h3 class="card-title">Security & Password</h3>

          <div v-if="pwdSuccess" class="alert-success">
            ✓ {{ pwdSuccess }}
          </div>
          <div v-if="pwdError" class="alert-danger">
            ⚠️ {{ pwdError }}
          </div>

          <form @submit.prevent="savePassword">
            <div class="form-group">
              <label class="form-label">Current Password</label>
              <input 
                type="password" 
                v-model="pwdForm.currentPassword" 
                class="form-input" 
                placeholder="••••••••" 
                required 
              />
            </div>

            <div class="form-group">
              <label class="form-label">New Password (min 6 chars)</label>
              <input 
                type="password" 
                v-model="pwdForm.newPassword" 
                class="form-input" 
                placeholder="••••••••" 
                required 
              />
            </div>

            <div class="form-group">
              <label class="form-label">Confirm New Password</label>
              <input 
                type="password" 
                v-model="pwdForm.confirmPassword" 
                class="form-input" 
                placeholder="••••••••" 
                required 
              />
            </div>

            <button type="submit" class="btn btn-gold" :disabled="savingPassword">
              <span v-if="savingPassword">Updating Password...</span>
              <span v-else>Update Password</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '../stores/authStore';

const authStore = useAuthStore();

const profileForm = ref({
  name: '',
  phone: '',
  dob: '',
  address: ''
});

const pwdForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const savingProfile = ref(false);
const savingPassword = ref(false);
const profileSuccess = ref('');
const profileError = ref('');
const pwdSuccess = ref('');
const pwdError = ref('');

const userInitial = computed(() => {
  return authStore.user?.name ? authStore.user.name.charAt(0).toUpperCase() : 'U';
});

onMounted(() => {
  if (authStore.user) {
    profileForm.value.name = authStore.user.name || '';
    profileForm.value.phone = authStore.user.phone || '';
    profileForm.value.dob = authStore.user.dob ? authStore.user.dob.split('T')[0] : '';
    profileForm.value.address = authStore.user.address || '';
  }
});

async function saveProfile() {
  profileSuccess.value = '';
  profileError.value = '';
  savingProfile.value = true;
  try {
    await authStore.updateProfile(profileForm.value);
    profileSuccess.value = 'Profile updated successfully!';
  } catch (err) {
    profileError.value = err.message || 'Failed to update profile.';
  } finally {
    savingProfile.value = false;
  }
}

async function savePassword() {
  pwdSuccess.value = '';
  pwdError.value = '';

  if (pwdForm.value.newPassword !== pwdForm.value.confirmPassword) {
    pwdError.value = 'New passwords do not match.';
    return;
  }

  savingPassword.value = true;
  try {
    await authStore.changePassword({
      currentPassword: pwdForm.value.currentPassword,
      newPassword: pwdForm.value.newPassword
    });
    pwdSuccess.value = 'Password changed successfully!';
    pwdForm.value.currentPassword = '';
    pwdForm.value.newPassword = '';
    pwdForm.value.confirmPassword = '';
  } catch (err) {
    pwdError.value = err.message || 'Failed to change password.';
  } finally {
    savingPassword.value = false;
  }
}
</script>

<style scoped>
.profile-header-card {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 32px;
  margin-bottom: 28px;
}

.profile-avatar-large {
  width: 72px;
  height: 72px;
  background: linear-gradient(135deg, var(--brand-blue) 0%, #0369a1 100%);
  color: #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 800;
  box-shadow: 0 6px 16px rgba(2, 132, 199, 0.35);
}

.mb-0 {
  margin-bottom: 0;
}

.user-role-badge {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 6px;
}

.email-text {
  color: var(--text-muted);
  font-size: 0.9375rem;
}

.profile-sections-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 28px;
}

.alert-success {
  background: var(--success-soft);
  color: #065f46;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  margin-bottom: 16px;
  font-size: 0.875rem;
  font-weight: 600;
}

.alert-danger {
  background: var(--danger-soft);
  color: #991b1b;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  margin-bottom: 16px;
  font-size: 0.875rem;
  font-weight: 600;
}

@media (max-width: 768px) {
  .profile-sections-grid {
    grid-template-columns: 1fr;
  }
}
</style>
