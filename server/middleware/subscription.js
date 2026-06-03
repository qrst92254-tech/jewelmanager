const { supabaseAdmin } = require('../services/supabase');
const { getTokenFromRequest } = require('./auth');

async function checkSubscription(req, res, next) {
  const accessToken = getTokenFromRequest(req);
  if (!accessToken) {
    return res.redirect('/login');
  }

  try {
    ensureSupabaseConfigured();
  } catch (err) {
    console.error('Supabase not configured:', err.message);
    return res.status(500).send('Server misconfiguration: subscription check unavailable.');
  }

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(accessToken);
  if (userError || !userData?.user) {
    return res.redirect('/login');
  }

  req.user = userData.user;

  const { data: subscriptions, error: subscriptionError } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })
    .limit(1);

  if (subscriptionError) {
    console.error('Subscription lookup failed:', subscriptionError);
    return res.redirect('/pricing?message=Unable to verify subscription.');
  }

  const subscription = subscriptions?.[0];
  if (!subscription) {
    return res.redirect('/pricing?message=Please start a plan to access the dashboard.');
  }

  const now = new Date();
  const currentPeriodEnd = subscription.current_period_end ? new Date(subscription.current_period_end) : null;

  if (subscription.plan === 'trial' && currentPeriodEnd && currentPeriodEnd < now) {
    return res.redirect('/pricing?message=Your trial has expired');
  }

  if (subscription.plan === 'monthly' && subscription.status === 'expired') {
    return res.redirect('/pricing?message=Your monthly subscription has expired');
  }

  if (subscription.plan === 'lifetime' && subscription.status === 'active') {
    req.subscription = subscription;
    return next();
  }

  if (subscription.plan === 'monthly' && subscription.status === 'active') {
    req.subscription = subscription;
    return next();
  }

  if (subscription.plan === 'trial' && (!currentPeriodEnd || currentPeriodEnd >= now)) {
    req.subscription = subscription;
    return next();
  }

  return res.redirect('/pricing?message=Please renew your subscription.');
}

module.exports = {
  checkSubscription,
};
