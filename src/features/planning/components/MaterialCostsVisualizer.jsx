// src/MaterialCostsVisualizer.jsx
import React from "react";

export const MaterialCostsVisualizer = ({ materialCosts, layout }) => {
  if (!materialCosts || !layout) return null;

  const totalCost = Object.values(materialCosts).reduce((sum, cost) => sum + cost, 0);

  const costBreakdown = [
    { category: 'Posts', cost: materialCosts.posts, color: 'bg-amber-500', icon: '🗂️' },
    { category: 'Trellis Wire', cost: materialCosts.wire, color: 'bg-orange-500', icon: '🔗' },
    { category: 'Irrigation', cost: materialCosts.irrigation, color: 'bg-blue-500', icon: '💧' },
    { category: 'Hardware', cost: materialCosts.hardware, color: 'bg-gray-500', icon: '🔧' },
    { category: 'Earth Anchors', cost: materialCosts.earthAnchors, color: 'bg-stone-600', icon: '⚓' },
  ].sort((a, b) => b.cost - a.cost);

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-6">
      <h3 className="text-lg font-semibold text-blue-800 mb-4">Material Cost Breakdown</h3>

      <div className="mb-6">
        <div className="text-center mb-4">
          <span className="text-3xl font-bold text-blue-800">
            ${totalCost.toLocaleString()}
          </span>
          <p className="text-gray-600">Total Material Cost</p>
        </div>

        <div className="space-y-3">
          {costBreakdown.map((item) => {
            const percentage = (item.cost / totalCost) * 100;
            return (
              <div key={item.category} className="flex items-center gap-3">
                <span className="text-lg">{item.icon}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{item.category}</span>
                    <span className="font-semibold">${item.cost.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${item.color} transition-all duration-300`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {percentage.toFixed(1)}% of total cost
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm border-t pt-4">
        <div>
          <span className="text-gray-600">Cost per vine:</span>
          <span className="ml-2 font-medium">
            ${(totalCost / layout.vineLayout.totalVines).toFixed(2)}
          </span>
        </div>
        <div>
          <span className="text-gray-600">Cost per acre:</span>
          <span className="ml-2 font-medium">
            ${(totalCost / layout.dimensions.totalSqft * 43560).toFixed(0)}
          </span>
        </div>
      </div>
    </div>
  );
};
