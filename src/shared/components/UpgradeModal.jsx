import React from 'react';
import { X, Check, Clock } from 'lucide-react';
import * as Icons from 'lucide-react';
import { MODULES } from '../config/modules';
import { PRICING_TIERS } from '../config/pricing';

export const UpgradeModal = ({ moduleId, onClose }) => {
  const module = MODULES[moduleId];
  const requiredTier = module?.requiredTier || 'starter';
  const tierInfo = PRICING_TIERS[requiredTier];
  const Icon = module ? Icons[module.icon] : Icons.Package;
  
  if (!module) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            Unlock {module.name}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {module.comingSoon ? (
            // Coming Soon View
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Coming Soon!</h3>
              <p className="text-gray-600 mb-6">
                {module.description}
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Expected launch: {module.expectedLaunch}
              </p>
              <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Join Waitlist
              </button>
            </div>
          ) : (
            // Upgrade Required View
            <>
              <div className="bg-gradient-to-br from-vine-green-50 to-vine-green-100 rounded-xl p-6 mb-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <Icon className="w-6 h-6 text-vine-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-vine-green-900 mb-2">
                      {module.name}
                    </h3>
                    <p className="text-vine-green-700">
                      {module.description}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Pricing Card */}
              <div className="border-2 border-vine-green-500 rounded-xl p-6 mb-6">
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-bold text-gray-900">
                    ${tierInfo.price}
                  </span>
                  <span className="text-gray-600">/{tierInfo.billingPeriod}</span>
                </div>
                <h4 className="text-xl font-semibold mb-4">{tierInfo.name}</h4>
                <ul className="space-y-3 mb-6">
                  {tierInfo.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-vine-green-600 shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button className="w-full py-3 bg-vine-green-600 text-white rounded-lg hover:bg-vine-green-700 font-semibold">
                  Upgrade to {tierInfo.name}
                </button>
              </div>
              
              {/* Compare Plans Link */}
              <div className="text-center">
                <button 
                  onClick={() => window.location.href = '/pricing'}
                  className="text-sm text-vine-green-600 hover:text-vine-green-700"
                >
                  Compare all plans →
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};