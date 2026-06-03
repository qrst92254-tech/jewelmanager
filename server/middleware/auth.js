const { supabaseAdmin, ensureSupabaseConfigured } = require('../services/supabase');

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

async function requireAuth(req, res, next) {
  const accessToken = getTokenFromRequest(req);
  if (!accessToken) {
    return res.redirect('/login');
  }

  try {
    ensureSupabaseConfigured();
  } catch (err) {
    console.error('Supabase not configured:', err.message);
    return res.status(500).send('Server misconfiguration: authentication unavailable.');
  }

  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
  if (error || !data?.user) {
    return res.redirect('/login');
  }

  req.user = data.user;
  return next();
}

function requireCreator(req, res, next) {
  const creatorEmail = process.env.CREATOR_EMAIL;
  if (!req.user || !creatorEmail || req.user.email !== creatorEmail) {
    return res.status(403).render('403', { message: 'Forbidden: creator access only.' });
  }
  return next();
}

module.exports = {
  requireFormOrJson,
  getTokenFromRequest,
  requireAuth,
  requireCreator,
};
