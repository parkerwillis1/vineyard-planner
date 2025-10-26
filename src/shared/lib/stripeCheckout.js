import { loadStripe } from '@stripe/stripe-js';
import { supabase } from './supabaseClient';

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

/**
 * Creates a Stripe Checkout Session via Supabase Edge Function and redirects the browser.
 * @param {object} params
 * @param {string} params.priceId Stripe Price identifier for the selected subscription tier.
 * @param {string} params.tierId Internal tier identifier (free/starter/professional/enterprise).
 */
export async function redirectToStripeCheckout({ priceId, tierId }) {
  if (!priceId) {
    throw new Error('Missing Stripe price id for tier');
  }

  if (!publishableKey) {
    console.error('[Stripe] VITE_STRIPE_PUBLISHABLE_KEY missing');
    throw new Error('Stripe is not configured. Please contact support.');
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error('[Stripe] Failed to fetch current user', userError);
    throw userError;
  }

  if (!user) {
    throw new Error('You must be signed in to upgrade.');
  }

  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: {
      priceId,
      tierId,
      userId: user.id,
      email: user.email,
    },
  });

  if (error) {
    console.error('[Stripe] Failed to create checkout session', error);
    throw error;
  }

  if (!data?.sessionId) {
    throw new Error('Stripe checkout session was not returned.');
  }

  const stripe = await stripePromise;
  if (!stripe) {
    throw new Error('Stripe failed to initialise.');
  }
  const { error: redirectError } = await stripe.redirectToCheckout({
    sessionId: data.sessionId,
  });

  if (redirectError) {
    console.error('[Stripe] Redirect failed', redirectError);
    throw redirectError;
  }
}
