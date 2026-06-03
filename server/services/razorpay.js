const crypto = require('crypto');
let Razorpay;
try {
  Razorpay = require('razorpay');
} catch (e) {
  Razorpay = null;
}

const razorpayKeyId = process.env.RAZORPAY_KEY_ID || null;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || null;

let razorpay = null;
if (Razorpay && razorpayKeyId && razorpayKeySecret) {
  try {
    razorpay = new Razorpay({ key_id: razorpayKeyId, key_secret: razorpayKeySecret });
  } catch (err) {
    console.error('Failed to initialize Razorpay client:', err.message);
    razorpay = null;
  }
}

function verifyPaymentSignature(payload, signature) {
  if (!razorpayKeySecret) return false;
  const expected = crypto.createHmac('sha256', razorpayKeySecret).update(payload).digest('hex');
  return expected === signature;
}

function verifyWebhookSignature(rawBody, signature) {
  return verifyPaymentSignature(rawBody, signature);
}

module.exports = {
  razorpay,
  verifyPaymentSignature,
  verifyWebhookSignature,
};
