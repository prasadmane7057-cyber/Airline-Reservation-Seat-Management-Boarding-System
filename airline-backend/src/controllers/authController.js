const { supabase, createSupabaseClient } = require('../lib/supabaseClient');
const userStore = require('../utils/userStore');

function publicUser(profile) {
  if (!profile) return null;
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role || 'passenger',
    phone: profile.phone || '',
    address: profile.address || '',
    dob: profile.dob || null,
    status: profile.status || 'ACTIVE',
    created_at: profile.created_at
  };
}

async function getProfile(client, userId, fallbackUser) {
  try {
    const { data, error } = await client
      .from('users')
      .select('id, name, email, role, phone, address, dob, status, created_at')
      .eq('id', userId)
      .single();
    if (!error && data) return data;
  } catch (err) {
    // If public.users table is not yet in Supabase, return fallback
  }

  if (fallbackUser) {
    return {
      id: fallbackUser.id || userId,
      name: fallbackUser.name || (fallbackUser.email ? fallbackUser.email.split('@')[0] : 'Passenger'),
      email: fallbackUser.email,
      role: fallbackUser.role || 'passenger',
      phone: fallbackUser.phone || '',
      address: fallbackUser.address || '',
      dob: fallbackUser.dob || null,
      status: fallbackUser.status || 'ACTIVE',
      created_at: fallbackUser.created_at || new Date().toISOString()
    };
  }

  const local = userStore.getUserById(userId);
  if (local) return publicUser(local);

  return null;
}

async function register(req, res, next) {
  try {
    const { name, email, phone, password, confirmPassword } = req.body;
    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.'
      });
    }
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }
    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if account already exists locally
    const existingLocal = userStore.getUserByEmail(cleanEmail);
    if (existingLocal) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please sign in.'
      });
    }

    // 1. Create account in local secure persistent store (hashed with bcrypt)
    const newUser = userStore.createUser({
      name: name.trim(),
      email: cleanEmail,
      password,
      phone: phone || '',
      role: 'passenger'
    });

    const localToken = userStore.generateToken(newUser);

    // 2. Best-effort registration with Supabase Auth
    try {
      await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: { name: name.trim(), phone: phone || '' }
        }
      });
    } catch (supabaseErr) {
      console.warn('[AUTH] Supabase background registration note:', supabaseErr.message);
    }

    // 3. Always return a valid token and user profile so the user can immediately continue!
    return res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome aboard.',
      token: localToken,
      user: newUser
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Step 1: Check Local User Store
    const localUser = userStore.getUserByEmail(cleanEmail);
    if (localUser) {
      const passwordMatch = userStore.verifyPassword(password, localUser.password_hash);
      if (passwordMatch) {
        if (localUser.status !== 'ACTIVE') {
          return res.status(403).json({
            success: false,
            message: 'Account is deactivated. Please contact customer support.'
          });
        }

        const token = userStore.generateToken(localUser);
        return res.json({
          success: true,
          message: `Welcome back, ${localUser.name}!`,
          token,
          user: userStore.toPublicUser(localUser)
        });
      }
    }

    // Step 2: Fallback to Supabase Auth
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password
      });

      if (!error && data?.session) {
        const client = createSupabaseClient(data.session.access_token);
        let profile = await getProfile(client, data.user.id, {
          id: data.user.id,
          name: data.user.user_metadata?.name || cleanEmail.split('@')[0],
          email: cleanEmail,
          role: data.user.user_metadata?.role || 'passenger',
          phone: data.user.user_metadata?.phone || '',
          status: 'ACTIVE'
        });

        // Cache in local store for seamless future sessions
        if (!localUser) {
          try {
            userStore.createUser({
              name: profile.name,
              email: cleanEmail,
              password,
              phone: profile.phone,
              role: profile.role
            });
          } catch (e) {
            // Already created or ignore
          }
        }

        return res.json({
          success: true,
          message: `Welcome back, ${profile.name}!`,
          token: data.session.access_token,
          user: publicUser(profile)
        });
      }

      // If Supabase failed because email is not confirmed, but the user is registered:
      if (error && error.message.includes('Email not confirmed')) {
        return res.status(401).json({
          success: false,
          message: 'Your email is not confirmed yet. If you registered previously, please sign in with your registered password.'
        });
      }
    } catch (supabaseErr) {
      console.warn('[AUTH] Supabase sign-in check failed:', supabaseErr.message);
    }

    // If both failed:
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password. Please verify your credentials or register a new account.'
    });
  } catch (err) {
    next(err);
  }
}

async function getMe(req, res, next) {
  try {
    if (req.user) {
      return res.json({ success: true, user: publicUser(req.user) });
    }
    const profile = await getProfile(req.supabase || supabase, req.userId);
    return res.json({ success: true, user: publicUser(profile) });
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const allowed = ['name', 'phone', 'address', 'dob'];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([key, value]) => allowed.includes(key) && value !== undefined)
    );
    if (updates.name !== undefined && !updates.name.trim()) {
      return res.status(400).json({ success: false, message: 'Name cannot be empty.' });
    }

    // Update in local store
    userStore.updateUser(req.user.id, updates);

    // Also attempt Supabase update if Supabase client available
    if (req.supabase) {
      try {
        await req.supabase.from('users').update(updates).eq('id', req.user.id);
      } catch (e) {}
    }

    const updated = userStore.getUserById(req.user.id) || req.user;
    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: publicUser(updated)
    });
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'A new password of at least 6 characters is required.'
      });
    }

    userStore.updateUser(req.user.id, { password: newPassword });

    if (req.supabase) {
      try {
        await req.supabase.auth.updateUser({ password: newPassword });
      } catch (e) {}
    }

    return res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword
};
