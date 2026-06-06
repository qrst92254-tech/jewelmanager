function requireFormOrJson(req, res, next) {
  const type = req.headers['content-type'] || '';
  if (type.includes('application/json') || type.includes('application/x-www-form-urlencoded')) {
    return next();
  }
  return res.status(400).send('Invalid request type');
}

function isAdminEmail(email) {
  if (!email) return false;
  const admin = process.env.ADMIN_EMAIL || process.env.CREATOR_EMAIL;
  return Boolean(admin && email === admin);
}

function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  req.user = { id: req.session.userId, email: req.session.userEmail };
  next();
}

function requireApiAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
  req.user = { id: req.session.userId, email: req.session.userEmail };
  next();
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
  requireAuth,
  requireApiAuth,
  requireCreator,
  requireAdminApi,
  isAdminEmail,
};
