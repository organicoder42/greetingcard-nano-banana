import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY not found in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2024-06-20',
});

export const STRIPE_CONFIG = {
  PRICE_ID_CARD: process.env.STRIPE_PRICE_ID_CARD || 'price_placeholder',
  SUCCESS_URL: process.env.STRIPE_SUCCESS_URL || 'http://localhost:3000/thanks?session_id={CHECKOUT_SESSION_ID}',
  CANCEL_URL: process.env.STRIPE_CANCEL_URL || 'http://localhost:3000/cancelled',
  CURRENCY: process.env.CURRENCY || 'DKK',
  WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder',
};