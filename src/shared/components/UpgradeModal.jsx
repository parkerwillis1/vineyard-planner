import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Clock } from 'lucide-react';
import * as Icons from 'lucide-react';
import { MODULES } from '../config/modules';
import { PRICING_TIERS } from '../config/pricing';
import { redirectToStripeCheckout } from '../lib/stripeCheckout';

export const UpgradeModal = ({ moduleId, onClose }) => {
  const module = MODULES[moduleId];
  const requiredTier = module?.requiredTier || 'professional';
  const tierInfo = PRICING_TIERS[requiredTier];
  const Icon = module ? Icons[module.icon] : Icons.Package;
  const [processing, setProcessing] = useState(false);

  if (!module) return null;

  const handleUpgrade = async () => {
    if (requiredTier === 'free') {
      // Free tier doesn't need checkout
      return;
    }

    try {
      setProcessing(true);
      // SECURITY: Price ID determined server-side
      await redirectToStripeCheckout({ tierId: requiredTier });
    } catch (error) {
      console.error('[Stripe] Upgrade checkout failed', error);
      alert('We could not start the checkout process. Please try again.');
      setProcessing(false);
    }
  };
  
  return createPortal(
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Content */}
        <div className="p-10">
          {module.comingSoon ? (
            // Coming Soon View
            <div className="text-center py-6">
              <div className="w-24 h-24 rounded-lg flex items-center justify-center mx-auto mb-8" style={{ backgroundColor: '#117753' }}>
                <Icon className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-3 text-gray-900">{module.name}</h2>
              <p className="text-gray-600 text-lg mb-8">
                {module.description}
              </p>
              <p className="text-sm text-gray-500 mb-10">
                Expected launch: {module.expectedLaunch}
              </p>
              <button className="px-10 py-4 rounded-lg text-white text-lg font-semibold hover:opacity-90 transition-opacity" style={{ backgroundColor: '#117753' }}>
                Join Waitlist
              </button>
            </div>
          ) : (
            // Upgrade Required View
            <div className="grid grid-cols-2 gap-12">
              {/* Left Column - Info */}
              <div>
                {/* Icon and Title */}
                <div className="mb-8">
                  <div className="w-16 h-16 rounded-lg flex items-center justify-center mb-5" style={{ backgroundColor: '#117753' }}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Upgrade to {tierInfo.name}
                  </h2>
                  <p className="text-gray-600 text-base">
                    Unlock {module.name} and more
                  </p>
                </div>

                {/* Pricing */}
                <div className="mb-8">
                  <div className="mb-4">
                    <span className="text-5xl font-bold text-gray-900">
                      ${tierInfo.price}
                    </span>
                    <span className="text-xl text-gray-500">
                      /{tierInfo.billingPeriod}
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2.5 rounded-full text-sm font-medium">
                    <Clock className="w-4 h-4" />
                    14-day free trial
                  </div>
                </div>

                {/* CTA Button */}
                <button
                  className="w-full py-4 rounded-lg text-white text-lg font-bold transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg mb-4"
                  style={{ backgroundColor: '#117753' }}
                  onClick={handleUpgrade}
                  disabled={processing}
                >
                  {processing ? 'Starting your trial...' : 'Start 14-Day Free Trial'}
                </button>

                {/* Fine print */}
                <p className="text-center text-sm text-gray-500">
                  No credit card required • Cancel anytime
                </p>
              </div>

              {/* Right Column - Features */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-5">
                  What's Included
                </h3>
                <ul className="space-y-3">
                  {tierInfo.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="shrink-0 mt-0.5">
                        <Check className="w-5 h-5" style={{ color: '#117753' }} strokeWidth={2.5} />
                      </div>
                      <span className="text-gray-700 text-base">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
