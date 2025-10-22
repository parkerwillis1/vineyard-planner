import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { PRICING_TIERS } from "@/shared/config/pricing";
import { useAuth } from "@/auth/AuthContext";
import { useSubscription } from "@/shared/hooks/useSubscription";

const currency = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default function PricingPage() {
  const { user } = useAuth();
  const subscription = useSubscription();
  const currentTier = subscription?.tier;

  const handleSelect = (tierId) => {
    // Fire your global upgrade modal event (already handled in App.jsx)
    window.dispatchEvent(
      new CustomEvent("show-upgrade-modal", { detail: { moduleId: tierId } })
    );
  };

  return (
    <div className="bg-gradient-to-b from-vine-green-50/60 to-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <header className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold tracking-wide text-vine-green-700">
            Pricing
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
            Plans that scale with your vineyard
          </h1>
          <p className="mt-5 text-lg leading-8 text-gray-600">
            Start free and upgrade as you grow. All plans include unlimited users,
            email support, and access to core planning tools.
          </p>
        </header>

        {/* Pricing grid */}
        <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-4">
          {Object.values(PRICING_TIERS).map((tier) => {
            const isCurrent = user && currentTier === tier.id;
            const isUpgrade =
              user &&
              PRICING_TIERS[currentTier] &&
              tier.price > PRICING_TIERS[currentTier].price;

            return (
              <section
                key={tier.id}
                aria-labelledby={`tier-${tier.id}`}
                className={[
                  "relative rounded-3xl bg-white p-8 ring-1 transition-all",
                  tier.popular
                    ? "ring-vine-green-600/80 shadow-2xl"
                    : "ring-gray-200 hover:shadow-md",
                ].join(" ")}
              >
                {/* Popular badge */}
                {tier.popular && (
                  <p className="absolute -top-3 left-6 rounded-full bg-vine-green-50 px-3 py-1 text-xs font-semibold text-vine-green-700 ring-1 ring-inset ring-vine-green-200">
                    Most popular
                  </p>
                )}

                <h3
                  id={`tier-${tier.id}`}
                  className="text-2xl font-semibold tracking-tight text-gray-900"
                >
                  {tier.name}
                </h3>

                {/* Price */}
                <div className="mt-6 flex items-baseline gap-x-2">
                  <span className="text-5xl font-semibold text-gray-900">
                    {currency.format(tier.price)}
                  </span>
                  <span className="text-sm font-medium text-gray-600">
                    /{tier.billingPeriod}
                  </span>
                </div>

                {/* Subtext / value prop */}
                {tier.tagline && (
                  <p className="mt-3 text-sm text-gray-500">{tier.tagline}</p>
                )}

                {/* Features */}
                <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-700">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex gap-x-3">
                      <Check className="h-5 w-5 flex-none text-vine-green-600" aria-hidden="true" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div className="mt-8">
                  {!user ? (
                    <Link
                      to="/signup"
                      className={[
                        "block w-full rounded-lg px-4 py-2.5 text-center text-sm font-semibold",
                        tier.popular
                          ? "bg-vine-green-600 text-white hover:bg-vine-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vine-green-600"
                          : "bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400",
                      ].join(" ")}
                    >
                      Get started
                    </Link>
                  ) : isCurrent ? (
                    <button
                      disabled
                      className="block w-full rounded-lg bg-gray-100 px-4 py-2.5 text-center text-sm font-semibold text-gray-500"
                      aria-disabled="true"
                    >
                      Current plan
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSelect(tier.id)}
                      className={[
                        "block w-full rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition-colors",
                        tier.popular
                          ? "bg-vine-green-600 text-white hover:bg-vine-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vine-green-600"
                          : "bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400",
                      ].join(" ")}
                    >
                      {isUpgrade ? "Upgrade" : "Downgrade"}
                    </button>
                  )}
                </div>

                {/* Fine print */}
                <p className="mt-4 text-[11px] leading-5 text-gray-500">
                  Prices in USD. Taxes may apply. Cancel anytime.
                </p>
              </section>
            );
          })}
        </div>

        {/* Guarantees / trust */}
        <div className="mx-auto mt-16 max-w-3xl text-center">
          <p className="text-sm text-gray-500">
            14-day free trial on paid plans • No setup fees • Export your data anytime
          </p>
        </div>

        {/* FAQ */}
        <div className="mx-auto mt-24 max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900 text-center mb-10">
            Frequently asked questions
          </h2>
          <dl className="divide-y divide-gray-200/70 rounded-2xl bg-white ring-1 ring-gray-200">
            <div className="p-6">
              <dt className="text-base font-semibold text-gray-900">
                Can I change plans later?
              </dt>
              <dd className="mt-2 text-base text-gray-600">
                Yes—upgrade or downgrade anytime. Changes take effect immediately and are prorated.
              </dd>
            </div>
            <div className="p-6">
              <dt className="text-base font-semibold text-gray-900">
                What payment methods do you accept?
              </dt>
              <dd className="mt-2 text-base text-gray-600">
                All major debit/credit cards are supported. Invoicing is available on annual Business plans.
              </dd>
            </div>
            <div className="p-6">
              <dt className="text-base font-semibold text-gray-900">
                Is there a free trial?
              </dt>
              <dd className="mt-2 text-base text-gray-600">
                The Planner tier is free forever. Paid tiers include a 14-day free trial—no card required to start.
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
