const { supabaseAdmin, ensureSupabaseConfigured } = require('../services/supabase');
const { claimOrphanDataForUser } = require('../db/claimOrphanData');

function requireFormOrJson(req, res, next) {
  const type = req.headers['content-type'] || '';
  if (type.includes('application/json') || type.includes('application/x-www-form-urlencoded')) {
    return next();
  }
  return res.status(400).send('Invalid request type');
}

function getTokenFromRequest(req) {
  if (req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    return parts.length === 2 && parts[0].toLowerCase() === 'bearer' ? parts[1] : req.headers.authorization;
  }
  return req.cookies?.['sb-access-token'] || null;
}

function isAdminEmail(email) {
  if (!email) return false;
  const admin = process.env.ADMIN_EMAIL || process.env.CREATOR_EMAIL;
  return Boolean(admin && email === admin);
}

async function resolveUserFromToken(accessToken) {
  ensureSupabaseConfigured();
  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
  if (error || !data?.user) {
    return null;
  }
  return data.user;
}

async function validateActiveSession(userId, accessToken) {
  const { data: sessionData, error: sessionError } = await supabaseAdmin
    .from('active_sessions')
    .select('id')
    .eq('user_id', userId)
    .eq('session_token', accessToken)
    .maybeSingle();

  if (sessionError) {
    console.error('Session lookup failed:', sessionError.message);
    return { valid: false, reason: 'SESSION_CHECK_FAILED' };
  }
  if (!sessionData) {
    return { valid: false, reason: 'SESSION_INVALIDATED' };
  }

  await supabaseAdmin
    .from('active_sessions')
    .update({ last_active: new Date().toISOString() })
    .eq('session_token', accessToken);

  return { valid: true };
}

async function attachUser(req, accessToken) {
  const user = await resolveUserFromToken(accessToken);
  if (!user) return false;

  const sessionCheck = await validateActiveSession(user.id, accessToken);
  if (!sessionCheck.valid) {
    req.sessionInvalidated = sessionCheck.reason === 'SESSION_INVALIDATED';
    return false;
  }

  req.user = user;
  try {
    claimOrphanDataForUser(user.id);
  } catch (err) {
    console.error('Legacy data claim skipped:', err.message);
  }
  return true;
}

async function requireAuth(req, res, next) {
  const accessToken = getTokenFromRequest(req);
  if (!accessToken) {
    return res.redirect('/login');
  }

  try {
    const ok = await attachUser(req, accessToken);
    if (!ok) {
      return res.redirect('/login');
    }
    return next();
  } catch (err) {
    console.error('Supabase not configured:', err.message);
    return res.status(500).send('Server misconfiguration: authentication unavailable.');
  }
}

async function requireApiAuth(req, res, next) {
  const accessToken = getTokenFromRequest(req);
  if (!accessToken) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const ok = await attachUser(req, accessToken);
    if (!ok) {
      if (req.sessionInvalidated) {
        return res.status(401).json({
          message: 'Session expired. You have been logged in on another device.',
          code: 'SESSION_INVALIDATED',
        });
      }
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    return next();
  } catch (err) {
    console.error('API auth error:', err.message);
    return res.status(500).json({ message: 'Authentication unavailable' });
  }
}

function requireCreator(req, res, next) {
  if (!isAdminEmail(req.user?.email)) {
    return res.status(403).render('403', { message: 'Forbidden: admin access only.' });
  }
  return next();
}

function requireAdminApi(req, res, next) {
  if (!isAdminEmail(req.user?.email)) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  return next();
}

module.exports = {
  requireFormOrJson,
  getTokenFromRequest,
  requireAuth,
  requireApiAuth,
  requireCreator,
  requireAdminApi,
  isAdminEmail,
  resolveUserFromToken,
};
