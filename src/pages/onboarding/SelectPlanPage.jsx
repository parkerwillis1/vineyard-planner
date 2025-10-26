import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { useSubscription } from '@/shared/hooks/useSubscription';
import { PRICING_TIERS } from '@/shared/config/pricing';
import { supabase } from '@/shared/lib/supabaseClient';
import { redirectToStripeCheckout } from '@/shared/lib/stripeCheckout';
import { getPriceIdForTier } from '@/shared/config/stripePrices';

export default function SelectPlanPage() {
  const { user } = useAuth();
  const { tier, loading: subLoading } = useSubscription();
  const navigate = useNavigate();
  const [selecting, setSelecting] = useState(false);

  // If user already has a plan, redirect to home
  useEffect(() => {
    if (!subLoading && tier && tier !== 'free') {
      navigate('/');
    }
  }, [tier, subLoading, navigate]);

  const handleSelectPlan = async (tierId) => {
    if (!user) return;

    setSelecting(true);

    try {
      if (tierId === 'free') {
        const { error } = await supabase
          .from('subscriptions')
          .update({
            tier: 'free',
            modules: ['planner'],
            status: 'active'
          })
          .eq('user_id', user.id);

        if (error) throw error;

        // Redirect to home
        navigate('/');
      } else {
        const priceId = getPriceIdForTier(tierId);
        if (!priceId) {
          alert('Stripe price ID is not configured for this plan. Please contact support.');
          return;
        }

        await redirectToStripeCheckout({ priceId, tierId });
      }
    } catch (error) {
      console.error('Error selecting plan:', error);
      alert('Error selecting plan. Please try again.');
    } finally {
      setSelecting(false);
    }
  };

  if (subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-vine-green-50/40 to-white py-20">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Vine Pioneer
          </h1>
          <p className="text-xl text-gray-600">
            Choose a plan to get started. You can always upgrade later.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.values(PRICING_TIERS).map((plan) => {
            const priceMissing = plan.id !== 'free' && !getPriceIdForTier(plan.id);
            return (
            <PlanCard
              key={plan.id}
              plan={plan}
              onSelect={() => handleSelectPlan(plan.id)}
              selecting={selecting}
              popular={plan.popular}
              priceMissing={priceMissing}
            />
            );
          })}
        </div>

        {/* Skip option */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            I'll choose later
          </button>
        </div>
      </div>
    </div>
  );
}

function PlanCard({ plan, onSelect, selecting, popular, priceMissing }) {
  return (
    <div
      className={`relative bg-white rounded-2xl p-6 border-2 transition-all hover:shadow-xl ${
        popular
          ? 'border-teal-500 shadow-lg scale-105'
          : 'border-gray-200 hover:border-teal-300'
      }`}
    >
      {popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <div className="bg-gradient-to-r from-teal-500 to-vine-green-500 text-white text-xs font-bold px-4 py-1 rounded-full">
            POPULAR
          </div>
        </div>
      )}

      <div className="text-center mb-4">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
        <div className="mb-3">
          <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
          <span className="text-gray-600">/{plan.billingPeriod}</span>
        </div>
        {plan.tagline && (
          <p className="text-sm text-gray-500">{plan.tagline}</p>
        )}
      </div>

      <ul className="space-y-2 mb-6">
        {plan.features.slice(0, 4).map((feature, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm">
            <Check className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onSelect}
        disabled={selecting || priceMissing}
        className={`w-full py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
          popular
            ? 'bg-gradient-to-r from-teal-600 to-vine-green-600 text-white hover:from-teal-500 hover:to-vine-green-500 shadow-md hover:shadow-lg'
            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {plan.id === 'free' ? 'Start Free' : 'Choose Plan'}
        <ArrowRight className="w-4 h-4" />
      </button>
      {priceMissing && (
        <p className="text-xs text-red-600 mt-2">
          Configure the Stripe price ID for this tier to enable checkout.
        </p>
      )}
    </div>
  );
}
