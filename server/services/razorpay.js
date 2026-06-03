const crypto = require('crypto');
const Razorpay = require('razorpay');

const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

if (!razorpayKeyId || !razorpayKeySecret) {
  throw new Error('Missing Razorpay env vars. Ensure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are set.');
}

const razorpay = new Razorpay({
  key_id: razorpayKeyId,
  key_secret: razorpayKeySecret,
});

function verifyPaymentSignature(payload, signature) {
  const expected = crypto
    .createHmac('sha256', razorpayKeySecret)
    .update(payload)
    .digest('hex');
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
