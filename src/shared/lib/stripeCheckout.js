import { loadStripe } from '@stripe/stripe-js';
import { supabase } from './supabaseClient';

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

/**
 * Creates a Stripe Checkout Session via Supabase Edge Function and redirects the browser.
 * @param {object} params
 * @param {string} params.tierId Internal tier identifier (professional/estate/enterprise).
 * @param {object} params.user Optional user object (if not provided, will fetch from Supabase)
 *
 * NOTE: Price IDs are determined SERVER-SIDE for security. Do NOT pass priceId from client.
 */
export async function redirectToStripeCheckout({ tierId, user: providedUser }) {
  console.log('[Stripe] Starting checkout...', { tierId, hasUser: !!providedUser });

  if (!tierId) {
    throw new Error('Missing tier identifier');
  }

  if (!publishableKey) {
    console.error('[Stripe] VITE_STRIPE_PUBLISHABLE_KEY missing');
    throw new Error('Stripe is not configured. Please contact support.');
  }

  let user = providedUser;

  // Only fetch user if not provided
  if (!user) {
    console.log('[Stripe] Getting user from Supabase...');
    try {
      const {
        data: { user: fetchedUser },
        error: userError,
      } = await Promise.race([
        supabase.auth.getUser(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Auth timeout')), 10000)
        )
      ]);

      console.log('[Stripe] getUser completed:', { user: fetchedUser?.email, error: userError });

      if (userError) {
        console.error('[Stripe] Failed to fetch current user', userError);
        throw userError;
      }

      if (!fetchedUser) {
        throw new Error('You must be signed in to upgrade.');
      }

      user = fetchedUser;
    } catch (err) {
      console.error('[Stripe] Exception getting user:', err);
      throw err;
    }
  }

  console.log('[Stripe] User found:', user.email);
  console.log('[Stripe] Calling edge function...', {
    functionName: 'create-checkout-session',
    payload: { tierId, userId: user.id, email: user.email }
  });

  let data, error;
  try {
    console.log('[Stripe] About to call edge function directly...');

    // Call edge function directly with fetch (using anon key for auth)
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`;
    // SECURITY: Only send tierId - server determines Price ID based on tier
    const payload = {
      tierId,
      userId: user.id,
      email: user.email,
    };

    console.log('[Stripe] Calling:', url);
    console.log('[Stripe] Payload:', payload);

    const response = await Promise.race([
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(payload),
      }),
      new Promise((_, reject) =>
        setTimeout(() => {
          console.error('[Stripe] Timeout reached!');
          reject(new Error('Edge function timeout after 15s'));
        }, 15000)
      )
    ]);

    console.log('[Stripe] Got fetch response:', response);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Stripe] Edge function error response:', errorText);
      throw new Error(`Edge function returned ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('[Stripe] Edge function JSON result:', result);

    data = result;
    error = result.error || null;

    console.log('[Stripe] Edge function response:', { data, error });

    if (error) {
      console.error('[Stripe] Failed to create checkout session', error);
      throw error;
    }

    // Validate we have either url or sessionId
    if (!data?.url && !data?.sessionId) {
      console.error('[Stripe] No url or sessionId in response:', data);
      throw new Error('Stripe checkout session was not returned.');
    }
  } catch (err) {
    console.error('[Stripe] Edge function exception:', err);
    console.error('[Stripe] Error details:', {
      message: err?.message,
      name: err?.name,
      stack: err?.stack
    });
    throw err;
  }

  // Prefer modern URL redirect approach
  if (data.url) {
    console.log('[Stripe] Checkout session created, url:', data.url);
    console.log('[Stripe] Redirecting to Stripe checkout via URL...');
    window.location.assign(data.url);
    return;
  }

  // Fallback to sessionId approach (backwards compatibility)
  if (data.sessionId) {
    console.log('[Stripe] Checkout session created, sessionId:', data.sessionId);
    const stripe = await stripePromise;
    if (!stripe) {
      throw new Error('Stripe failed to initialise.');
    }

    console.log('[Stripe] Redirecting to Stripe checkout via sessionId...');
    const { error: redirectError } = await stripe.redirectToCheckout({
      sessionId: data.sessionId,
    });

    if (redirectError) {
      console.error('[Stripe] Redirect failed', redirectError);
      throw redirectError;
    }
  }
}
