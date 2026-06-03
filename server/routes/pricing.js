const express = require('express');
const { supabaseAdmin } = require('../services/supabase');
const { razorpay, verifyPaymentSignature, verifyWebhookSignature } = require('../services/razorpay');
const { requireAuth, requireFormOrJson } = require('../middleware/auth');

const router = express.Router();

router.get('/pricing', (req, res) => {
  return res.render('pricing', {
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    message: req.query.message || null,
  });
});

router.post('/api/subscription/create-subscription', requireFormOrJson, requireAuth, async (req, res) => {
  try {
    const planId = process.env.RAZORPAY_MONTHLY_PLAN_ID;
    if (!planId) {
      return res.status(500).json({ error: 'Monthly Razorpay plan ID is not configured.' });
    }

    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      total_count: 12,
      notes: {
        user_id: req.user.id,
      },
    });

    return res.json({
      success: true,
      keyId: process.env.RAZORPAY_KEY_ID,
      subscriptionId: subscription.id,
      name: 'JewelManager Pro Monthly',
    });
  } catch (error) {
    console.error('Razorpay subscription creation failed:', error);
    return res.status(500).json({ error: 'Unable to create subscription checkout. Please try again later.' });
  }
});

router.post('/api/subscription/create-order', requireFormOrJson, requireAuth, async (req, res) => {
  try {
    const receipt = `jewel-lifetime-${req.user.id}-${Date.now()}`;
    const order = await razorpay.orders.create({
      amount: 487900,
      currency: 'INR',
      receipt,
      payment_capture: 1,
      notes: {
        user_id: req.user.id,
      },
    });

    return res.json({
      success: true,
      keyId: process.env.RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      name: 'JewelManager Pro Lifetime',
    });
  } catch (error) {
    console.error('Razorpay order creation failed:', error);
    return res.status(500).json({ error: 'Unable to create lifetime order. Please try again later.' });
  }
});

router.post('/api/subscription/activate', requireFormOrJson, requireAuth, async (req, res) => {
  const { plan, razorpay_payment_id, razorpay_subscription_id, razorpay_order_id, razorpay_signature } = req.body;
  if (!plan || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing payment verification fields.' });
  }

  try {
    let payload;
    if (plan === 'monthly') {
      if (!razorpay_subscription_id) {
        return res.status(400).json({ error: 'Missing subscription ID for monthly plan.' });
      }
      payload = `${razorpay_subscription_id}|${razorpay_payment_id}`;
    } else if (plan === 'lifetime') {
      if (!razorpay_order_id) {
        return res.status(400).json({ error: 'Missing order ID for lifetime plan.' });
      }
      payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    } else {
      return res.status(400).json({ error: 'Unsupported plan type.' });
    }

    if (!verifyPaymentSignature(payload, razorpay_signature)) {
      return res.status(400).json({ error: 'Invalid Razorpay signature.' });
    }

    const updates = {
      plan,
      status: 'active',
      razorpay_payment_id,
      created_at: new Date().toISOString(),
    };

    if (plan === 'monthly') {
      updates.razorpay_subscription_id = razorpay_subscription_id;
      updates.current_period_end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      updates.trial_started_at = null;
    } else if (plan === 'lifetime') {
      updates.current_period_end = null;
      updates.razorpay_subscription_id = null;
      updates.trial_started_at = null;
    }

    const existing = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('user_id', req.user.id)
      .limit(1)
      .single();

    if (existing.error && existing.status !== 406) {
      console.error('Subscription lookup failed before activation:', existing.error);
      return res.status(500).json({ error: 'Unable to activate subscription.' });
    }

    if (existing.data?.id) {
      await supabaseAdmin
        .from('subscriptions')
        .update(updates)
        .eq('user_id', req.user.id);
    } else {
      await supabaseAdmin.from('subscriptions').insert({
        id: require('crypto').randomUUID(),
        user_id: req.user.id,
        plan,
        status: 'active',
        razorpay_subscription_id: razorpay_subscription_id || null,
        razorpay_payment_id,
        trial_started_at: null,
        current_period_end: updates.current_period_end,
        created_at: new Date().toISOString(),
      });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Subscription activation failed:', error);
    return res.status(500).json({ error: 'Failed to activate subscription.' });
  }
});

router.post('/api/webhook/razorpay', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const rawBody = req.body;
  const payload = rawBody.toString('utf8');
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!signature || !secret || !verifyWebhookSignature(payload, signature)) {
    return res.status(400).json({ error: 'Invalid webhook signature' });
  }

  let event;
  try {
    event = JSON.parse(payload);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid webhook payload' });
  }

  const type = event.event;
  const data = event.payload?.subscription?.entity || event.payload?.payment?.entity;
  const subscriptionId = data?.id || data?.subscription_id;
  const paymentId = data?.id || data?.payment_id;

  try {
    if (type === 'subscription.activated') {
      await supabaseAdmin
        .from('subscriptions')
        .update({ status: 'active' })
        .eq('razorpay_subscription_id', subscriptionId);
    }

    if (type === 'subscription.charged') {
      const nextEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      await supabaseAdmin
        .from('subscriptions')
        .update({ current_period_end: nextEnd, status: 'active' })
        .eq('razorpay_subscription_id', subscriptionId);
    }

    if (type === 'subscription.cancelled') {
      await supabaseAdmin
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('razorpay_subscription_id', subscriptionId);
    }

    if (type === 'payment.captured') {
      await supabaseAdmin
        .from('subscriptions')
        .update({ plan: 'lifetime', status: 'active', current_period_end: null, razorpay_payment_id: paymentId })
        .eq('razorpay_payment_id', paymentId);
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Webhook processing failed:', error);
    return res.status(500).json({ error: 'Webhook processing error' });
  }
});

module.exports = router;
