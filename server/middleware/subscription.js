const { supabaseAdmin } = require('../services/supabase');

async function checkSubscription(req, res, next) {
  // Skip check if not logged in (auth middleware handles that)
  if (!req.session.userId) return next();

  // Admin is never blocked
  const adminEmail = process.env.ADMIN_EMAIL || process.env.CREATOR_EMAIL;
  if (req.session.userEmail && req.session.userEmail === adminEmail) return next();

  try {
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .select('plan, status, current_period_end')
      .eq('user_id', req.session.userId)
      .single();

    if (error || !data) {
      // No subscription found — block access
      return res.status(403).json({ 
        blocked: true, 
        reason: 'no_subscription',
        message: 'No active subscription found. Please contact the administrator.' 
      });
    }

    const now = new Date();
    const expiry = new Date(data.current_period_end);

    if (data.plan === 'trial' && now > expiry) {
      // Trial has expired — block access
      return res.status(403).json({ 
        blocked: true, 
        reason: 'trial_expired',
        message: 'Your 14-day free trial has expired. Please contact the administrator to continue.' 
      });
    }

    if (data.status === 'cancelled' || data.status === 'expired') {
      return res.status(403).json({ 
        blocked: true, 
        reason: 'subscription_expired',
        message: 'Your subscription has expired. Please contact the administrator.' 
      });
    }

    // All good — attach subscription info to request
    req.subscription = data;
    return next();
  } catch (err) {
    console.error('Subscription check error:', err.message);
    return next(); // On unexpected error, allow access (fail open)
  }
}

module.exports = { checkSubscription };
