const { supabase } = require('../lib/supabaseClient');

function publicUser(profile) {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role,
    phone: profile.phone || '',
    address: profile.address || '',
    dob: profile.dob || null,
    status: profile.status,
    created_at: profile.created_at
  };
}

async function getProfile(client, userId) {
  const { data, error } = await client
    .from('users')
    .select('id, name, email, role, phone, address, dob, status, created_at')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
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

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { name: name.trim(), phone: phone || '' }
      }
    });
    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    if (!data.session) {
      return res.status(202).json({
        success: true,
        requiresEmailConfirmation: true,
        message: 'Check your email to confirm your account, then sign in.'
      });
    }

    const client = require('../lib/supabaseClient').createSupabaseClient(data.session.access_token);
    const profile = await getProfile(client, data.user.id);
    return res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome aboard.',
      token: data.session.access_token,
      user: publicUser(profile)
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

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password
    });
    if (error || !data.session) {
      return res.status(401).json({ success: false, message: error?.message || 'Sign-in failed.' });
    }

    const client = require('../lib/supabaseClient').createSupabaseClient(data.session.access_token);
    const profile = await getProfile(client, data.user.id);
    if (profile.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact customer support.'
      });
    }

    return res.json({
      success: true,
      message: `Welcome back, ${profile.name}!`,
      token: data.session.access_token,
      user: publicUser(profile)
    });
  } catch (err) {
    next(err);
  }
}

async function getMe(req, res, next) {
  try {
    const profile = await getProfile(req.supabase, req.user.id);
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
    const { error } = await req.supabase.from('users').update(updates).eq('id', req.user.id);
    if (error) throw error;
    const profile = await getProfile(req.supabase, req.user.id);
    return res.json({ success: true, message: 'Profile updated successfully.', user: publicUser(profile) });
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
    const { error } = await req.supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
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
