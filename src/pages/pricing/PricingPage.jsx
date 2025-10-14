import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { PRICING_TIERS } from "@/shared/config/pricing";
import { useAuth } from "@/auth/AuthContext";
import { useSubscription } from "@/shared/hooks/useSubscription";

export default function PricingPage() {
  const { user } = useAuth();
  const subscription = useSubscription();

  return (
    <div className="bg-gradient-to-b from-vine-green-50 to-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-base font-semibold leading-7 text-vine-green-600">Pricing</h2>
          <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Choose the right plan for your vineyard
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Start free, upgrade as you grow. All plans include unlimited users and email support.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-4">
          {Object.values(PRICING_TIERS).map((tier) => (
            <div
              key={tier.id}
              className={`rounded-3xl p-8 ring-1 ${
                tier.popular
                  ? "ring-2 ring-vine-green-600 bg-white shadow-2xl scale-105"
                  : "ring-gray-200 bg-white"
              }`}
            >
              {tier.popular && (
                <p className="text-sm font-semibold leading-6 text-vine-green-600 mb-4">
                  Most Popular
                </p>
              )}
              
              <h3 className="text-2xl font-bold tracking-tight text-gray-900">
                {tier.name}
              </h3>
              
              <p className="mt-6 flex items-baseline gap-x-1">
                <span className="text-5xl font-bold tracking-tight text-gray-900">
                  ${tier.price}
                </span>
                <span className="text-sm font-semibold leading-6 text-gray-600">
                  /{tier.billingPeriod}
                </span>
              </p>

              {/* Features */}
              <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <Check className="h-6 w-5 flex-none text-vine-green-600" />
                    {feature}
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <div className="mt-8">
                {!user ? (
                  <Link
                    to="/signup"
                    className={`block w-full rounded-lg px-3 py-2 text-center text-sm font-semibold ${
                      tier.popular
                        ? "bg-vine-green-600 text-white hover:bg-vine-green-500"
                        : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                    }`}
                  >
                    Get started
                  </Link>
                ) : subscription.tier === tier.id ? (
                  <button
                    disabled
                    className="block w-full rounded-lg px-3 py-2 text-center text-sm font-semibold bg-gray-100 text-gray-500 cursor-not-allowed"
                  >
                    Current plan
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      // TODO: Implement upgrade flow
                      alert(`Upgrade to ${tier.name} - Coming soon!`);
                    }}
                    className={`block w-full rounded-lg px-3 py-2 text-center text-sm font-semibold ${
                      tier.popular
                        ? "bg-vine-green-600 text-white hover:bg-vine-green-500"
                        : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                    }`}
                  >
                    {tier.price > PRICING_TIERS[subscription.tier].price ? "Upgrade" : "Downgrade"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mx-auto mt-24 max-w-2xl">
          <h3 className="text-2xl font-bold tracking-tight text-gray-900 text-center mb-12">
            Frequently asked questions
          </h3>
          <dl className="space-y-8">
            <div>
              <dt className="text-base font-semibold leading-7 text-gray-900">
                Can I change plans later?
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                Yes! You can upgrade or downgrade at any time. Changes take effect immediately.
              </dd>
            </div>
            <div>
              <dt className="text-base font-semibold leading-7 text-gray-900">
                What payment methods do you accept?
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                We accept all major credit cards and debit cards.
              </dd>
            </div>
            <div>
              <dt className="text-base font-semibold leading-7 text-gray-900">
                Is there a free trial?
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                The Planner tier is free forever. Paid tiers include a 14-day free trial.
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}