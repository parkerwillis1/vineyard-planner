import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Check, Sparkles, Zap, Building2, Crown, Shield, Download, Users, Calendar, Gift } from "lucide-react";
import { PRICING_TIERS } from "@/shared/config/pricing";
import { useAuth } from "@/auth/AuthContext";
import { useSubscription } from "@/shared/hooks/useSubscription";
import { redirectToStripeCheckout } from "@/shared/lib/stripeCheckout";

const currency = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

// Icon mapping for tiers
const tierIcons = {
  free: Sparkles,
  starter: Zap,
  professional: Building2,
  enterprise: Crown,
};

export default function PricingPage() {
  const { user } = useAuth();
  const subscription = useSubscription();
  const currentTier = subscription?.tier;
  const [processing, setProcessing] = useState(false);
  const [searchParams] = useSearchParams();
  const fromTrial = searchParams.get('trial') === 'true';

  // Note: Trial activation for PAID tiers now happens via Stripe Checkout
  // The fake trial activation API is removed in favor of real Stripe subscriptions

  const handleSelect = async (tierId) => {
    console.log('[DEBUG] handleSelect called with tierId:', tierId);
    console.log('[DEBUG] user:', user);

    // Skip free tier
    if (tierId === 'free') {
      console.log('[DEBUG] Free tier selected, skipping');
      return;
    }

    if (!user) {
      console.log('[DEBUG] No user found');
      alert('You must be signed in to upgrade.');
      return;
    }

    console.log('[DEBUG] Starting checkout process...');

    // SECURITY: Price ID is determined SERVER-SIDE in Edge Function
    // Client only sends tierId; server maps to correct Price ID

    try {
      setProcessing(true);
      console.log('[DEBUG] Processing set to true, calling redirectToStripeCheckout...');
      await redirectToStripeCheckout({
        tierId, // Server will map to correct Price ID
        user // Pass user directly from context
      });
      console.log('[DEBUG] redirectToStripeCheckout completed');
    } catch (error) {
      console.error('[Stripe] Upgrade checkout failed', error);
      console.error('[DEBUG] Full error object:', JSON.stringify(error, null, 2));
      alert('We could not start the checkout process. Please try again.');
      setProcessing(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-teal-50 via-vine-green-50/40 to-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Trial Welcome Banner */}
        {user && currentTier === 'free' && (
          <div className="mx-auto max-w-4xl mb-12">
            <div className="rounded-2xl bg-gradient-to-r from-teal-600 to-vine-green-600 p-8 shadow-xl">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Gift className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Welcome! Start Your 2-Week Free Trial
                  </h2>
                  <p className="text-teal-50 text-base mb-4">
                    You're currently on the free Planner tier. Upgrade to unlock Vineyard Operations or Wine Production features with a 14-day free trial—no credit card required upfront.
                  </p>
                  <div className="flex flex-wrap gap-3 text-sm text-white">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      <span>14 days completely free</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      <span>Cancel anytime</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      <span>No credit card required</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <header className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-100 to-vine-green-100 px-4 py-1.5 mb-4">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <p className="text-sm font-semibold tracking-wide text-teal-700">
              Simple, Transparent Pricing
            </p>
          </div>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl bg-gradient-to-r from-teal-700 via-vine-green-700 to-teal-700 bg-clip-text text-transparent">
            Plans that scale with your vineyard
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Start free and upgrade as you grow. All plans include email support,
            automatic saves, and access to our award-winning planning tools.
          </p>
        </header>

        {/* Trust badges */}
        <div className="mx-auto mt-10 max-w-2xl flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-teal-600" />
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-teal-600" />
            <span>Export your data anytime</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-teal-600" />
            <span>14-day free trial</span>
          </div>
        </div>

        {/* Pricing grid */}
        <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-6 lg:mx-0 lg:max-w-none lg:grid-cols-4">
          {Object.values(PRICING_TIERS).map((tier) => {
            const isCurrent = user && currentTier === tier.id;
            const isUpgrade =
              user &&
              PRICING_TIERS[currentTier] &&
              tier.price > PRICING_TIERS[currentTier].price;
            const TierIcon = tierIcons[tier.id] || Sparkles;

            return (
              <section
                key={tier.id}
                aria-labelledby={`tier-${tier.id}`}
                className={[
                  "relative rounded-3xl bg-white p-8 ring-1 transition-all hover:shadow-lg",
                  tier.popular
                    ? "ring-2 ring-teal-500 shadow-xl scale-105 lg:scale-110"
                    : "ring-gray-200",
                ].join(" ")}
              >
                {/* Popular badge */}
                {tier.popular && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                    <div className="rounded-full bg-gradient-to-r from-teal-500 to-vine-green-500 px-4 py-1.5 shadow-lg">
                      <p className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Most Popular
                      </p>
                    </div>
                  </div>
                )}

                {/* Icon */}
                <div className={[
                  "inline-flex items-center justify-center w-12 h-12 rounded-xl mb-5",
                  tier.popular
                    ? "bg-gradient-to-br from-teal-100 to-vine-green-100"
                    : "bg-gray-100"
                ].join(" ")}>
                  <TierIcon className={[
                    "w-6 h-6",
                    tier.popular ? "text-teal-600" : "text-gray-600"
                  ].join(" ")} />
                </div>

                <h3
                  id={`tier-${tier.id}`}
                  className="text-xl font-bold tracking-tight text-gray-900"
                >
                  {tier.name}
                </h3>

                {/* Subtext / value prop */}
                {tier.tagline && (
                  <p className="mt-2 text-sm text-gray-500 min-h-[40px]">{tier.tagline}</p>
                )}

                {/* Price */}
                <div className="mt-6 flex items-baseline gap-x-2">
                  <span className={[
                    "text-5xl font-bold",
                    tier.popular ? "bg-gradient-to-r from-teal-600 to-vine-green-600 bg-clip-text text-transparent" : "text-gray-900"
                  ].join(" ")}>
                    {currency.format(tier.price)}
                  </span>
                  <span className="text-sm font-medium text-gray-500">
                    /{tier.billingPeriod}
                  </span>
                </div>

                {/* Features */}
                <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex gap-x-3">
                      <Check
                        className={[
                          "h-5 w-5 flex-none",
                          tier.popular ? "text-teal-600" : "text-vine-green-600"
                        ].join(" ")}
                        aria-hidden="true"
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div className="mt-8">
                  {!user ? (
                    <Link
                      to={
                        tier.id === 'free'
                          ? "/signup"
                          : `/signup?redirect=/pricing&tier=${tier.id}&startTrial=true`
                      }
                      className={[
                        "block w-full rounded-xl px-4 py-3 text-center text-sm font-bold shadow-sm transition-all",
                        tier.popular
                          ? "bg-gradient-to-r from-teal-600 to-vine-green-600 text-white hover:from-teal-500 hover:to-vine-green-500 shadow-md hover:shadow-lg"
                          : "bg-gray-100 text-gray-900 hover:bg-gray-200",
                      ].join(" ")}
                    >
                      {tier.id === 'free' ? 'Get Started Free' : 'Start 2-Week Free Trial'}
                    </Link>
                  ) : isCurrent ? (
                    <button
                      disabled
                      className="block w-full rounded-xl bg-gradient-to-r from-teal-100 to-vine-green-100 px-4 py-3 text-center text-sm font-bold text-teal-700"
                      aria-disabled="true"
                    >
                      ✓ Current Plan
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSelect(tier.id)}
                      disabled={processing}
                      className={[
                        "block w-full rounded-xl px-4 py-3 text-center text-sm font-bold shadow-sm transition-all",
                        tier.popular
                          ? "bg-gradient-to-r from-teal-600 to-vine-green-600 text-white hover:from-teal-500 hover:to-vine-green-500 shadow-md hover:shadow-lg"
                          : "bg-gray-100 text-gray-900 hover:bg-gray-200",
                        processing && "opacity-50 cursor-not-allowed"
                      ].join(" ")}
                    >
                      {processing ? "Redirecting..." : (tier.id === 'free' ? 'Get Started Free' : (isUpgrade ? "Start 2-Week Free Trial" : "Start 2-Week Free Trial"))}
                    </button>
                  )}
                </div>

                {/* Fine print */}
                <p className="mt-5 text-[11px] leading-5 text-center text-gray-400">
                  {tier.id === 'free' ? 'Free forever' : 'Cancel anytime • USD pricing'}
                </p>
              </section>
            );
          })}
        </div>

        {/* Feature comparison table */}
        <div className="mx-auto mt-24 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Compare Features
            </h2>
            <p className="mt-3 text-lg text-gray-600">
              See what's included in each plan
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200 bg-gradient-to-r from-teal-50 to-vine-green-50">
                    <th className="py-4 px-6 text-sm font-bold text-gray-900">Feature</th>
                    <th className="py-4 px-4 text-center text-sm font-bold text-gray-900">Planner</th>
                    <th className="py-4 px-4 text-center text-sm font-bold text-gray-900">Vineyard</th>
                    <th className="py-4 px-4 text-center text-sm font-bold text-teal-700">Professional</th>
                    <th className="py-4 px-4 text-center text-sm font-bold text-gray-900">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr className="hover:bg-gray-50/50">
                    <td className="py-4 px-6 text-sm text-gray-700">Number of Plans</td>
                    <td className="py-4 px-4 text-center text-sm text-gray-600">1</td>
                    <td className="py-4 px-4 text-center text-sm text-gray-600">Unlimited</td>
                    <td className="py-4 px-4 text-center text-sm text-gray-600">Unlimited</td>
                    <td className="py-4 px-4 text-center text-sm text-gray-600">Unlimited</td>
                  </tr>
                  <tr className="hover:bg-gray-50/50">
                    <td className="py-4 px-6 text-sm text-gray-700">PDF Exports</td>
                    <td className="py-4 px-4 text-center text-sm text-gray-600">3/month</td>
                    <td className="py-4 px-4 text-center text-sm text-gray-600">Unlimited</td>
                    <td className="py-4 px-4 text-center text-sm text-gray-600">Unlimited</td>
                    <td className="py-4 px-4 text-center text-sm text-gray-600">Unlimited</td>
                  </tr>
                  <tr className="hover:bg-gray-50/50">
                    <td className="py-4 px-6 text-sm text-gray-700">Max Acreage per Plan</td>
                    <td className="py-4 px-4 text-center text-sm text-gray-600">10 acres</td>
                    <td className="py-4 px-4 text-center text-sm text-gray-600">50 acres</td>
                    <td className="py-4 px-4 text-center text-sm text-gray-600">200 acres</td>
                    <td className="py-4 px-4 text-center text-sm text-gray-600">Unlimited</td>
                  </tr>
                  <tr className="hover:bg-gray-50/50">
                    <td className="py-4 px-6 text-sm text-gray-700">Team Members</td>
                    <td className="py-4 px-4 text-center text-sm text-gray-600">1</td>
                    <td className="py-4 px-4 text-center text-sm text-gray-600">2</td>
                    <td className="py-4 px-4 text-center text-sm text-gray-600">5</td>
                    <td className="py-4 px-4 text-center text-sm text-gray-600">Unlimited</td>
                  </tr>
                  <tr className="hover:bg-gray-50/50 bg-teal-50/30">
                    <td className="py-4 px-6 text-sm font-semibold text-gray-900">Financial Planning</td>
                    <td className="py-4 px-4 text-center"><Check className="w-5 h-5 text-teal-600 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><Check className="w-5 h-5 text-teal-600 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><Check className="w-5 h-5 text-teal-600 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><Check className="w-5 h-5 text-teal-600 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-gray-50/50">
                    <td className="py-4 px-6 text-sm text-gray-700">Vineyard Operations</td>
                    <td className="py-4 px-4 text-center text-gray-300">—</td>
                    <td className="py-4 px-4 text-center"><Check className="w-5 h-5 text-teal-600 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><Check className="w-5 h-5 text-teal-600 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><Check className="w-5 h-5 text-teal-600 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-gray-50/50">
                    <td className="py-4 px-6 text-sm text-gray-700">Production Tracking</td>
                    <td className="py-4 px-4 text-center text-gray-300">—</td>
                    <td className="py-4 px-4 text-center text-gray-300">—</td>
                    <td className="py-4 px-4 text-center"><Check className="w-5 h-5 text-teal-600 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><Check className="w-5 h-5 text-teal-600 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-gray-50/50">
                    <td className="py-4 px-6 text-sm text-gray-700">Inventory Management</td>
                    <td className="py-4 px-4 text-center text-gray-300">—</td>
                    <td className="py-4 px-4 text-center text-gray-300">—</td>
                    <td className="py-4 px-4 text-center"><Check className="w-5 h-5 text-teal-600 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><Check className="w-5 h-5 text-teal-600 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-gray-50/50">
                    <td className="py-4 px-6 text-sm text-gray-700">Sales & Distribution</td>
                    <td className="py-4 px-4 text-center text-gray-300">—</td>
                    <td className="py-4 px-4 text-center text-gray-300">—</td>
                    <td className="py-4 px-4 text-center text-gray-300">—</td>
                    <td className="py-4 px-4 text-center"><Check className="w-5 h-5 text-teal-600 mx-auto" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mx-auto mt-24 max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 text-center mb-10">
            Frequently Asked Questions
          </h2>
          <dl className="divide-y divide-gray-200/70 rounded-2xl bg-white ring-1 ring-gray-200 shadow-sm">
            <div className="p-6 hover:bg-teal-50/30 transition-colors">
              <dt className="text-base font-bold text-gray-900">
                Can I change plans later?
              </dt>
              <dd className="mt-2 text-base text-gray-600">
                Yes—upgrade or downgrade anytime. Changes take effect immediately and are prorated to ensure you only pay for what you use.
              </dd>
            </div>
            <div className="p-6 hover:bg-teal-50/30 transition-colors">
              <dt className="text-base font-bold text-gray-900">
                What payment methods do you accept?
              </dt>
              <dd className="mt-2 text-base text-gray-600">
                All major credit and debit cards (Visa, Mastercard, American Express, Discover). Annual invoicing is available for Enterprise customers.
              </dd>
            </div>
            <div className="p-6 hover:bg-teal-50/30 transition-colors">
              <dt className="text-base font-bold text-gray-900">
                Is there a free trial?
              </dt>
              <dd className="mt-2 text-base text-gray-600">
                The Planner tier is free forever—no credit card required. Paid tiers include a 14-day free trial so you can test all features risk-free.
              </dd>
            </div>
            <div className="p-6 hover:bg-teal-50/30 transition-colors">
              <dt className="text-base font-bold text-gray-900">
                What happens to my data if I cancel?
              </dt>
              <dd className="mt-2 text-base text-gray-600">
                Your data is always yours. Export it anytime as PDF or CSV. If you cancel, you'll be downgraded to the free tier but retain access to your plans.
              </dd>
            </div>
          </dl>
        </div>

        {/* Final CTA */}
        <div className="mx-auto mt-20 max-w-2xl text-center">
          <div className="rounded-2xl bg-gradient-to-r from-teal-600 to-vine-green-600 p-10 shadow-xl">
            <h3 className="text-2xl font-bold text-white">
              Ready to grow your vineyard?
            </h3>
            <p className="mt-3 text-teal-50">
              Join hundreds of vineyard owners planning smarter, more profitable operations.
            </p>
            <Link
              to="/signup"
              className="mt-6 inline-block rounded-xl bg-white px-8 py-3 text-sm font-bold text-teal-700 shadow-lg hover:bg-teal-50 transition-colors"
            >
              Start Free Today
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
