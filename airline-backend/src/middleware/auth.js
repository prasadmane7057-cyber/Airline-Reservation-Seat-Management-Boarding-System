const { createSupabaseClient } = require('../lib/supabaseClient');
const userStore = require('../utils/userStore');

async function getAuthenticatedUser(req) {
  const authorization = req.headers.authorization || '';
  const [scheme, token] = authorization.split(' ');
  if (scheme !== 'Bearer' || !token) return null;

  // 1. Check if token is locally signed by userStore
  const localPayload = userStore.verifyToken(token);
  if (localPayload && localPayload.id) {
    const user = userStore.getUserById(localPayload.id);
    if (user && user.status === 'ACTIVE') {
      const pubUser = userStore.toPublicUser(user);
      req.user = pubUser;
      req.supabase = createSupabaseClient();
      return pubUser;
    }
  }

  // 2. Otherwise verify through Supabase Auth
  try {
    const client = createSupabaseClient(token);
    const { data: authData, error: authError } = await client.auth.getUser(token);
    if (authError || !authData.user) return null;

    let profile = null;
    try {
      const { data, error: profileError } = await client
        .from('users')
        .select('id, name, email, role, phone, address, dob, status, created_at')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (!profileError && data) {
        profile = data;
      }
    } catch (e) {
      // Table may not exist yet
    }

    if (!profile) {
      const meta = authData.user.user_metadata || {};
      profile = {
        id: authData.user.id,
        name: meta.name || authData.user.email.split('@')[0],
        email: authData.user.email,
        role: meta.role || 'passenger',
        phone: meta.phone || '',
        address: '',
        dob: null,
        status: 'ACTIVE',
        created_at: authData.user.created_at || new Date().toISOString()
      };
    }

    if (profile.status !== 'ACTIVE') return null;

    req.supabase = client;
    req.user = { ...authData.user, ...profile, id: authData.user.id };
    return req.user;
  } catch (err) {
    return null;
  }
}

function authenticateToken(req, res, next) {
  getAuthenticatedUser(req)
    .then(user => {
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Your session is missing or expired. Please sign in again.'
        });
      }
      next();
    })
    .catch(next);
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden. Administrator privileges are required.'
    });
  }
  next();
}

function optionalAuth(req, res, next) {
  getAuthenticatedUser(req)
    .then(() => next())
    .catch(next);
}

module.exports = {
  authenticateToken,
  requireAdmin,
  optionalAuth
};
