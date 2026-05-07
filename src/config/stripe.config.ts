import Stripe from 'stripe';
import env from './env.config';

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-04-10',
  typescript: true,
});

export default stripe;
