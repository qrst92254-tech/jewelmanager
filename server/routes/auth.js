const express = require('express');
const crypto = require('crypto');
const { supabase, supabaseAdmin } = require('../services/supabase');
const { requireFormOrJson } = require('../middleware/auth');

const router = express.Router();

router.get('/signup', (req, res) => {
    return res.render('signup', { error: null });
});

router.get('/login', (req, res) => {
    return res.render('login', { error: null });
});

router.post('/signup', requireFormOrJson, async (req, res) => {
    const { full_name, email, password, phone, city } = req.body;
    if (!full_name || !email || !password || !phone || !city) {
        return res.status(400).render('signup', { error: 'All fields are required.' });
    }

    if (!/^[0-9]{10}$/.test(phone)) {
        return res.status(400).render('signup', { error: 'Phone number must be 10 digits.' });
    }

    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            console.error('Supabase signup error:', error);
            return res.status(400).render('signup', { error: error.message });
        }

        const user = data.user;
        if (!user) {
            return res.status(500).render('signup', { error: 'Unable to create account. Please try again.' });
        }

        const userInsert = await supabaseAdmin.from('users').upsert({
            id: user.id,
            email,
            full_name,
            phone,
            city,
            role: 'user',
            created_at: new Date().toISOString(),
        }, { onConflict: 'id', ignoreDuplicates: false });

        if (userInsert.error) {
            console.error('Supabase users insert failed:', userInsert.error);
            return res.status(500).render('signup', { error: 'Unable to save your profile. Please contact support.' });
        }

        const trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        const subscriptionInsert = await supabaseAdmin.from('subscriptions').insert({
            id: crypto.randomUUID(),
            user_id: user.id,
            plan: 'trial',
            status: 'active',
            razorpay_subscription_id: null,
            razorpay_payment_id: null,
            trial_started_at: new Date().toISOString(),
            current_period_end: trialEnd,
            created_at: new Date().toISOString(),
        });

        if (subscriptionInsert.error) {
            console.error('Supabase subscriptions insert failed:', subscriptionInsert.error);
            return res.status(500).render('signup', { error: 'Unable to create trial subscription. Please contact support.' });
        }

        if (data.session?.access_token) {
            res.cookie('sb-access-token', data.session.access_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });
        }

        return res.redirect('/dashboard');
    } catch (error) {
        console.error('Signup error:', error);
        return res.status(500).render('signup', { error: 'Unable to create account right now. Please try again later.' });
    }
});

router.post('/login', requireFormOrJson, async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).render('login', { error: 'Email and password are required.' });
    }

    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            console.error('Supabase login error:', error);
            if (error.code === 'email_not_confirmed') {
              return res.status(400).json({
                message: 'Your email is not confirmed. Please check your inbox or contact admin.'
              });
            }
            if (error.code === 'invalid_credentials') {
              return res.status(401).json({
                message: 'Incorrect email or password. Please try again.'
              });
            }
            return res.status(401).json({ error: error.message });
        }

        if (data.session?.access_token) {
            res.cookie('sb-access-token', data.session.access_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });
        }

        const isJson = (req.headers['content-type'] || '').includes('application/json');
        if (isJson) {
            return res.json({ success: true, token: data.session?.access_token, email });
        }
        return res.redirect('/dashboard');
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).render('login', { error: 'Unable to sign in right now. Please try again later.' });
    }
});

// Accept a client-side Supabase access token and set a secure cookie server-side
router.post('/session', requireFormOrJson, async (req, res) => {
    const { access_token } = req.body;
    if (!access_token) {
        return res.status(400).json({ error: 'Missing access_token' });
    }

    try {
        const { data, error } = await supabase.auth.getUser(access_token);
        if (error || !data?.user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        res.cookie('sb-access-token', access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return res.json({ success: true });
    } catch (err) {
        console.error('Session set failed:', err);
        return res.status(500).json({ error: 'Unable to set session' });
    }
});

module.exports = router;