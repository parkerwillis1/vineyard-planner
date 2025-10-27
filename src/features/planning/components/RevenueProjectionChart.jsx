import { BarChart3 } from "lucide-react";

export function RevenueProjectionChart({ projection, breakEven, totalYears = 10 }) {
  if (!projection || projection.length === 0) {
    return null;
  }

  // Group years into phases
  const phases = [
    {
      label: "Year 1-3",
      years: projection.filter(p => p.year >= 1 && p.year <= 3),
      color: "from-red-400 to-red-500"
    },
    {
      label: "Year 4-5",
      years: projection.filter(p => p.year >= 4 && p.year <= 5),
      color: "from-yellow-400 to-yellow-500"
    },
    {
      label: `Year 6-${totalYears}`,
      years: projection.filter(p => p.year >= 6 && p.year <= totalYears),
      color: "from-teal-500 to-vine-green-500"
    }
  ];

  // Calculate average revenue for each phase
  const phaseData = phases.map(phase => {
    const avgRevenue = phase.years.length > 0
      ? phase.years.reduce((sum, p) => sum + p.revenue, 0) / phase.years.length
      : 0;
    return {
      ...phase,
      avgRevenue,
      displayRevenue: avgRevenue > 0 ? `$${Math.round(avgRevenue).toLocaleString()}/yr` : "$0"
    };
  });

  // Find max revenue for scaling bars
  const maxRevenue = Math.max(...phaseData.map(p => p.avgRevenue), 1);

  return (
    <div className="rounded-2xl bg-gradient-to-br from-gray-50 to-white p-8 shadow-xl border-2 border-gray-200">
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <span className="text-sm font-semibold text-gray-700">{totalYears}-Year Revenue Projection</span>
          <BarChart3 className="w-5 h-5 text-teal-600" />
        </div>

        <div className="space-y-3">
          {phaseData.map((phase, index) => (
            <div key={index}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">{phase.label}</span>
                <span className="font-semibold text-gray-900">{phase.displayRevenue}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`bg-gradient-to-r ${phase.color} h-2 rounded-full transition-all duration-500`}
                  style={{ width: `${(phase.avgRevenue / maxRevenue) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Break-Even</span>
            <span className="text-lg font-bold text-teal-600">
              Year {typeof breakEven === 'number' ? breakEven : breakEven}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
