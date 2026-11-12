const { createSupabaseClient } = require('../lib/supabaseClient');

async function getAuthenticatedUser(req) {
  const authorization = req.headers.authorization || '';
  const [scheme, token] = authorization.split(' ');
  if (scheme !== 'Bearer' || !token) return null;

  const client = createSupabaseClient(token);
  const { data: authData, error: authError } = await client.auth.getUser(token);
  if (authError) {
    if (authError.status === 401 || authError.status === 403) return null;
    throw authError;
  }
  if (!authData.user) return null;

  const { data: profile, error: profileError } = await client
    .from('users')
    .select('id, name, email, role, phone, address, dob, status, created_at')
    .eq('id', authData.user.id)
    .maybeSingle();

  if (profileError) throw profileError;
  if (!profile || profile.status !== 'ACTIVE') return null;

  req.supabase = client;
  req.user = { ...authData.user, ...profile, id: authData.user.id };
  return req.user;
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
