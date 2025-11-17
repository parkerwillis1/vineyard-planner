import { FileDown, Printer } from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";

const formatMoney = (value) => Math.round(value).toLocaleString();
const formatDate = () => new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

// Constants
const BOTTLES_PER_TON = 600;
const AVERAGE_YIELD_TONS_PER_ACRE = 4;

export function BusinessPlanReport({
  stNum,
  projection,
  breakEven,
  totalEstCost,
  projYears,
  vineyardLayout,
  materialCosts,
  beIdx
}) {
  const handleExportPDF = () => {
    window.print();
  };

  // Calculate missing vineyard metrics
  const layout = vineyardLayout?.calculatedLayout;
  const totalVines = layout?.vineLayout?.totalVines || 0;
  const numberOfRows = layout?.vineLayout?.numberOfRows || 0;
  const vinesPerAcre = layout?.vineLayout?.vinesPerAcre || 0;

  // Calculate vines per row
  const vinesPerRow = layout?.vineLayout?.vinesPerRow ||
    (totalVines && numberOfRows ? Math.round(totalVines / numberOfRows) : null);

  // Calculate row length (vines per row × vine spacing)
  const vineSpacing = vineyardLayout?.spacing?.vine || 6;
  const rowLength = layout?.dimensions?.rowLength ||
    (vinesPerRow ? (vinesPerRow - 1) * vineSpacing : null);

  // Calculate perimeter (rough estimate from acres)
  const perimeter = layout?.dimensions?.perimeter ||
    (stNum.acres ? Math.round(Math.sqrt(stNum.acres * 43560) * 4) : null);

  // Calculate key metrics
  const totalRevenue = projection.filter(p => p.year > 0).reduce((sum, p) => sum + p.revenue, 0);
  const avgAnnualRevenue = totalRevenue / projYears;
  const finalROI = projection.length > 0 ? Math.round((projection[projection.length - 1].cumulative / totalEstCost) * 100) : 0;
  const investmentPerAcre = Math.round(totalEstCost / stNum.acres);

  // Calculate component costs from actual data structure
  const setupCosts = stNum.setup && typeof stNum.setup === 'object'
    ? Object.values(stNum.setup).reduce((sum, item) =>
        sum + (item.include ? ((item.cost || 0) * stNum.acres) : 0), 0)
    : 0;

  const plantingCosts = Array.isArray(stNum.planting)
    ? stNum.planting.reduce((sum, item) =>
        sum + (item.include ? ((item.costPerAcre || 0) * stNum.acres) : 0), 0)
    : 0;

  // Equipment capital costs (upfront purchase price, not annual payments)
  const equipmentCapitalCosts = Array.isArray(stNum.equipmentOps)
    ? stNum.equipmentOps.reduce((sum, item) =>
        sum + (item.include ? (item.cost || 0) : 0), 0)
    : 0;

  // Equipment annual operating costs (for cash flow projections)
  const equipmentAnnualCosts = Array.isArray(stNum.equipmentOps)
    ? stNum.equipmentOps.reduce((sum, item) =>
        sum + (item.include ? (item.annualTotal || 0) : 0), 0)
    : 0;

  // Operating costs - get from mature year projection data
  const matureYearProjection = projection && projection.length > 0
    ? projection[projection.length - 1]
    : null;
  const matureYearCost = matureYearProjection?.cost || 0;
  const opCostPerAcre = stNum.acres > 0 ? (matureYearCost / stNum.acres) : 0;
  const totalAnnualOpCosts = matureYearCost;

  // Calculate actual equipment capital costs from total capital - all other components
  const landCost = (stNum.landPrice || 0) * stNum.acres;
  // Add $1 to fix rounding so categories sum exactly to totalEstCost
  const actualEquipmentCapitalCosts = totalEstCost - landCost - setupCosts - plantingCosts - (stNum.licenseCost || 0) + 1;

  // Permits breakdown - calculate total from actual permits (only capital/one-time costs)
  const permitsCapitalCost = 2000; // Water Rights (one-time)
  const permitsAnnualCost = stNum.salesMode === 'wine'
    ? (3500 + 500) // State Winery License + COLA (annual)
    : (500 + 750 + 1500); // Ag License + Pesticide + Environmental (annual)

  return (
    <div className="w-full px-4 lg:px-6 print:px-4" id="business-plan-report">
      {/* Header with Export Button */}
      <div className="border-b pb-3 mb-6 print:hidden">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Business Plan</h1>
            <p className="text-sm text-gray-600 mt-1">Professional vineyard development proposal and financial analysis</p>
          </div>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium flex-shrink-0"
          >
            <Printer className="w-4 h-4" />
            Export to PDF
          </button>
        </div>
      </div>

      {/* Print Header - Only shows when printing */}
      <div className="hidden print:block mb-6 pb-3 border-b-2 border-gray-900">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Vineyard Business Plan</h1>
        <p className="text-base text-gray-600">Financial Analysis & Project Summary</p>
        <p className="text-xs text-gray-500 mt-1">Prepared: {formatDate()}</p>
      </div>

      {/* Document Content */}
      <div className="space-y-8 py-6 print:space-y-6 print:py-0">

        {/* 1. Executive Summary */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300 print:text-xl print:mb-3">
            I. Executive Summary
          </h2>
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>
              This business plan outlines the financial requirements and projected returns for establishing
              a {stNum.acres}-acre vineyard operation. The project requires a total capital investment of{" "}
              <span className="font-semibold">${formatMoney(totalEstCost)}</span> and is projected to reach
              break-even by <span className="font-semibold">Year {breakEven}</span>.
            </p>
            <div className="grid grid-cols-3 gap-6 my-8">
              <div className="border-l-4 border-gray-900 pl-4">
                <div className="text-sm text-gray-600 uppercase tracking-wide mb-1">Total Investment</div>
                <div className="text-2xl font-bold text-gray-900">${formatMoney(totalEstCost)}</div>
                <div className="text-xs text-gray-500 mt-1">${formatMoney(investmentPerAcre)} per acre</div>
              </div>
              <div className="border-l-4 border-gray-900 pl-4">
                <div className="text-sm text-gray-600 uppercase tracking-wide mb-1">Break-Even</div>
                <div className="text-2xl font-bold text-gray-900">Year {breakEven}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {breakEven <= 3 ? 'Early break-even' : breakEven <= 6 ? 'Mid-projection break-even' : 'Latter third of projection'}
                </div>
              </div>
              <div className="border-l-4 border-gray-900 pl-4">
                <div className="text-sm text-gray-600 uppercase tracking-wide mb-1">{projYears}-Year ROI</div>
                <div className="text-2xl font-bold text-gray-900">{finalROI}%</div>
                <div className="text-xs text-gray-500 mt-1">Return on investment</div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Project Overview */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300 print:text-xl print:mb-3">
            II. Project Overview
          </h2>

          <h3 className="text-lg font-semibold text-gray-900 mb-3 print:text-base print:mb-2">Vineyard Specifications</h3>
          {(() => {
            const layoutAcres = layout?.dimensions?.acres || 0;
            const totalAcres = stNum.acres;
            const layoutMismatch = layoutAcres > 0 && Math.abs(layoutAcres - totalAcres) > 0.5;
            return layoutMismatch ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-sm">
                <p className="text-yellow-800">
                  <span className="font-semibold">Note:</span> The vineyard layout design below represents {layoutAcres.toFixed(2)} acres
                  of the total {totalAcres} acre operation. Financial projections are based on the full {totalAcres} acre property.
                  Additional acreage may be developed in future phases or allocated for non-production use.
                </p>
              </div>
            ) : null;
          })()}
          <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-8">
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Total Acreage</span>
              <span className="font-semibold text-gray-900">{stNum.acres} acres</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Vine Spacing</span>
              <span className="font-semibold text-gray-900">6' × 10' (typical)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Planting Density</span>
              <span className="font-semibold text-gray-900">~726 vines/acre</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Estimated Total Vines</span>
              <span className="font-semibold text-gray-900">~{Math.round(stNum.acres * 726).toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Trellis System</span>
              <span className="font-semibold text-gray-900">{vineyardLayout?.trellisSystem || 'VSP'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Row Orientation</span>
              <span className="font-semibold text-gray-900">{vineyardLayout?.calculatedLayout?.orientation === 'horizontal' ? 'East-West' : 'North-South'}</span>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-3 print:text-base print:mb-2">Business Model</h3>
          <div className="grid grid-cols-2 gap-x-12 gap-y-4">
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Sales Model</span>
              <span className="font-semibold text-gray-900">
                {stNum.salesMode === 'wine' ? 'Bottled Wine' : (() => {
                  const matureRevenue = projection && projection.length > 0 ? projection[projection.length - 1]?.revenue || 0 : 0;
                  const totalTons = stNum.acres * (stNum.yieldTonsPerAcre || 4);
                  const effectivePricePerTon = totalTons > 0 ? Math.round(matureRevenue / totalTons) : 0;
                  return effectivePricePerTon > 5000 ? 'Value-Added/Direct Sales' : 'Bulk Grapes';
                })()}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Target Yield</span>
              <span className="font-semibold text-gray-900">{stNum.yieldTonsPerAcre || 4} tons/acre</span>
            </div>
            {stNum.salesMode === 'wine' && (
              <>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Bottle Price (Target)</span>
                  <span className="font-semibold text-gray-900">${stNum.bottlePrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Bottles per Ton</span>
                  <span className="font-semibold text-gray-900">600</span>
                </div>
              </>
            )}
            {stNum.salesMode === 'grapes' && (
              <>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Revenue Model</span>
                  <span className="font-semibold text-gray-900">
                    {(() => {
                      const matureRevenue = projection && projection.length > 0 ? projection[projection.length - 1]?.revenue || 0 : 0;
                      const totalTons = stNum.acres * (stNum.yieldTonsPerAcre || 4);
                      const effectivePricePerTon = totalTons > 0 ? Math.round(matureRevenue / totalTons) : 0;
                      return effectivePricePerTon > 5000
                        ? 'Value-added/Direct sales'
                        : 'Bulk grape sales';
                    })()}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Effective Price per Ton</span>
                  <span className="font-semibold text-gray-900">
                    ${formatMoney((() => {
                      const matureRevenue = projection && projection.length > 0 ? projection[projection.length - 1]?.revenue || 0 : 0;
                      const totalTons = stNum.acres * (stNum.yieldTonsPerAcre || 4);
                      return totalTons > 0 ? Math.round(matureRevenue / totalTons) : 0;
                    })())}
                  </span>
                </div>
              </>
            )}
          </div>
        </section>

        {/* 3. Capital Requirements */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300 print:text-xl print:mb-3">
            III. Capital Requirements
          </h2>

          <h3 className="text-lg font-semibold text-gray-900 mb-3 print:text-base print:mb-2">Summary</h3>
          <div className="overflow-hidden border border-gray-300 rounded-lg mb-8">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Category</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Amount</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">% of Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr className="bg-white">
                  <td className="px-6 py-4 text-sm text-gray-900">Land Acquisition</td>
                  <td className="px-6 py-4 text-sm text-right font-medium">${formatMoney((stNum.landPrice || 0) * stNum.acres)}</td>
                  <td className="px-6 py-4 text-sm text-right">{totalEstCost > 0 ? (((stNum.landPrice || 0) * stNum.acres / totalEstCost) * 100).toFixed(1) : 0}%</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">Site Preparation & Infrastructure</td>
                  <td className="px-6 py-4 text-sm text-right font-medium">${formatMoney(setupCosts)}</td>
                  <td className="px-6 py-4 text-sm text-right">{totalEstCost > 0 ? ((setupCosts / totalEstCost) * 100).toFixed(1) : 0}%</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-6 py-4 text-sm text-gray-900">Planting Materials</td>
                  <td className="px-6 py-4 text-sm text-right font-medium">${formatMoney(plantingCosts)}</td>
                  <td className="px-6 py-4 text-sm text-right">{totalEstCost > 0 ? ((plantingCosts / totalEstCost) * 100).toFixed(1) : 0}%</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">Equipment & Operations</td>
                  <td className="px-6 py-4 text-sm text-right font-medium">${formatMoney(actualEquipmentCapitalCosts)}</td>
                  <td className="px-6 py-4 text-sm text-right">{totalEstCost > 0 ? ((actualEquipmentCapitalCosts / totalEstCost) * 100).toFixed(1) : 0}%</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-6 py-4 text-sm text-gray-900">Permits & Licensing</td>
                  <td className="px-6 py-4 text-sm text-right font-medium">${formatMoney(stNum.licenseCost || 0)}</td>
                  <td className="px-6 py-4 text-sm text-right">{totalEstCost > 0 ? (((stNum.licenseCost || 0) / totalEstCost) * 100).toFixed(1) : 0}%</td>
                </tr>
                <tr className="bg-gray-900" style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
                  <td className="px-6 py-4 text-sm font-bold text-white">Total Capital Required</td>
                  <td className="px-6 py-4 text-sm text-right font-bold text-white">${formatMoney(totalEstCost)}</td>
                  <td className="px-6 py-4 text-sm text-right font-bold text-white">100.0%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-3 print:text-base print:mb-2">Detailed Setup Costs</h3>
          <div className="space-y-4">
            {/* Setup Costs */}
            {stNum.setup && Object.entries(stNum.setup).filter(([_, obj]) => obj.include).length > 0 && (
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-4 py-2">
                  <h4 className="font-semibold text-gray-900">Site Preparation & Infrastructure</h4>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-gray-700">Item</th>
                      <th className="px-4 py-2 text-right text-gray-700">Per Acre</th>
                      <th className="px-4 py-2 text-right text-gray-700">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Object.entries(stNum.setup).filter(([_, obj]) => obj.include).map(([key, obj], idx) => (
                      <tr key={key} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-2 text-gray-900">{key.charAt(0).toUpperCase() + key.slice(1)}</td>
                        <td className="px-4 py-2 text-right text-gray-900">${formatMoney(obj.cost || 0)}</td>
                        <td className="px-4 py-2 text-right font-medium text-gray-900">
                          ${formatMoney((obj.cost || 0) * stNum.acres)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Planting Costs */}
            {stNum.planting && stNum.planting.filter(r => r.include).length > 0 && (
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-4 py-2">
                  <h4 className="font-semibold text-gray-900">Planting Materials</h4>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-gray-700">Item</th>
                      <th className="px-4 py-2 text-right text-gray-700">Qty/Acre</th>
                      <th className="px-4 py-2 text-right text-gray-700">Unit Cost</th>
                      <th className="px-4 py-2 text-right text-gray-700">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {stNum.planting.filter(r => r.include).map((row, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-2 text-gray-900">{row.label}</td>
                        <td className="px-4 py-2 text-right text-gray-900">{row.qtyPerAcre || 0}</td>
                        <td className="px-4 py-2 text-right text-gray-900">${(row.unitCost || 0).toFixed(2)}</td>
                        <td className="px-4 py-2 text-right font-medium text-gray-900">
                          ${formatMoney((row.unitCost || 0) * (row.qtyPerAcre || 0) * stNum.acres)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Labor Costs */}
            {stNum.labor && stNum.labor.filter(r => r.include).length > 0 && (
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-4 py-2">
                  <h4 className="font-semibold text-gray-900">Labor & Installation</h4>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-gray-700">Item</th>
                      <th className="px-4 py-2 text-right text-gray-700">Per Acre</th>
                      <th className="px-4 py-2 text-right text-gray-700">Annual</th>
                      <th className="px-4 py-2 text-right text-gray-700">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {stNum.labor.filter(r => r.include).map((row, idx) => {
                      const perAcre = row.costPerAcre || 0;
                      const annual = row.annualTotal || (perAcre * stNum.acres);
                      return (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-2 text-gray-900">{row.label}</td>
                          <td className="px-4 py-2 text-right text-gray-900">${formatMoney(perAcre)}</td>
                          <td className="px-4 py-2 text-right text-gray-900">${formatMoney(annual)}</td>
                          <td className="px-4 py-2 text-right font-medium text-gray-900">
                            ${formatMoney(annual)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* 4. Material Costs Detail */}
        {(() => {
          const materials = vineyardLayout?.calculatedLayout?.materials;
          if (!materials) return null;

          // Default unit prices (same as in VineyardLayoutCalculator)
          const unitPrices = {
            endPost: 25,
            linePost: 15,
            earthAnchor: 45,
            wirePerFoot: 0.75,
            dripTubingPerFoot: 0.35,
            emitter: 1.20,
            wireClip: 0.15,
            eyeBolt: 2.50,
            staple: 0.05,
            tensioner: 8.00,
            anchorRing: 3.50
          };

          // Calculate totals
          const trellisItems = [
            { name: 'End Posts', qty: materials.posts?.endPosts || 0, unit: 'ea', unitCost: unitPrices.endPost },
            { name: 'Line Posts', qty: materials.posts?.linePosts || 0, unit: 'ea', unitCost: unitPrices.linePost },
            { name: 'Trellis Wire', qty: materials.wire?.totalFeet || 0, unit: 'ft', unitCost: unitPrices.wirePerFoot },
            { name: 'Earth Anchors', qty: materials.earthAnchors?.count || 0, unit: 'ea', unitCost: unitPrices.earthAnchor },
          ];

          const hardwareItems = [
            { name: 'Wire Clips', qty: materials.hardware?.wireClips || 0, unit: 'ea', unitCost: unitPrices.wireClip },
            { name: 'Eye Bolts', qty: materials.hardware?.eyeBolts || 0, unit: 'ea', unitCost: unitPrices.eyeBolt },
            { name: 'Staples', qty: materials.hardware?.staples || 0, unit: 'ea', unitCost: unitPrices.staple },
            { name: 'Tensioners', qty: materials.hardware?.tensioners || 0, unit: 'ea', unitCost: unitPrices.tensioner },
            { name: 'Anchor Rings', qty: materials.hardware?.anchorRings || 0, unit: 'ea', unitCost: unitPrices.anchorRing },
          ];

          const irrigationItems = [
            { name: 'Drip Tubing', qty: materials.irrigation?.dripTubing || 0, unit: 'ft', unitCost: unitPrices.dripTubingPerFoot },
            { name: 'Emitters', qty: materials.irrigation?.emitters || 0, unit: 'ea', unitCost: unitPrices.emitter },
          ];

          const trellisTotal = trellisItems.reduce((sum, item) => sum + (item.qty * item.unitCost), 0);
          const hardwareTotal = hardwareItems.reduce((sum, item) => sum + (item.qty * item.unitCost), 0);
          const irrigationTotal = irrigationItems.reduce((sum, item) => sum + (item.qty * item.unitCost), 0);
          const grandTotal = trellisTotal + hardwareTotal + irrigationTotal;

          if (grandTotal === 0) return null;

          return (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300 print:text-xl print:mb-3">
                IV. Material Costs Detail
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Trellis System Costs */}
                {trellisTotal > 0 && (
                  <div className="border border-gray-300 rounded-lg overflow-hidden">
                    <div className="bg-gray-100 px-4 py-2">
                      <h4 className="font-semibold text-gray-900">Trellis System</h4>
                    </div>
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-gray-700">Component</th>
                          <th className="px-4 py-2 text-right text-gray-700">Qty</th>
                          <th className="px-4 py-2 text-right text-gray-700">Unit $</th>
                          <th className="px-4 py-2 text-right text-gray-700">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {trellisItems.filter(item => item.qty > 0).map((item, idx) => (
                          <tr key={item.name} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-2 text-gray-900">{item.name}</td>
                            <td className="px-4 py-2 text-right text-gray-900">{item.qty.toLocaleString()}</td>
                            <td className="px-4 py-2 text-right text-gray-900">${item.unitCost.toFixed(2)}</td>
                            <td className="px-4 py-2 text-right font-medium text-gray-900">
                              ${formatMoney(item.qty * item.unitCost)}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-gray-900" style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
                          <td colSpan="3" className="px-4 py-2 text-sm font-bold text-white">Subtotal</td>
                          <td className="px-4 py-2 text-sm text-right font-bold text-white">
                            ${formatMoney(trellisTotal)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Hardware Costs */}
                {hardwareTotal > 0 && (
                  <div className="border border-gray-300 rounded-lg overflow-hidden">
                    <div className="bg-gray-100 px-4 py-2">
                      <h4 className="font-semibold text-gray-900">Hardware</h4>
                    </div>
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-gray-700">Component</th>
                          <th className="px-4 py-2 text-right text-gray-700">Qty</th>
                          <th className="px-4 py-2 text-right text-gray-700">Unit $</th>
                          <th className="px-4 py-2 text-right text-gray-700">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {hardwareItems.filter(item => item.qty > 0).map((item, idx) => (
                          <tr key={item.name} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-2 text-gray-900">{item.name}</td>
                            <td className="px-4 py-2 text-right text-gray-900">{item.qty.toLocaleString()}</td>
                            <td className="px-4 py-2 text-right text-gray-900">${item.unitCost.toFixed(2)}</td>
                            <td className="px-4 py-2 text-right font-medium text-gray-900">
                              ${formatMoney(item.qty * item.unitCost)}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-gray-900" style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
                          <td colSpan="3" className="px-4 py-2 text-sm font-bold text-white">Subtotal</td>
                          <td className="px-4 py-2 text-sm text-right font-bold text-white">
                            ${formatMoney(hardwareTotal)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Irrigation System Costs */}
                {irrigationTotal > 0 && (
                  <div className="border border-gray-300 rounded-lg overflow-hidden">
                    <div className="bg-gray-100 px-4 py-2">
                      <h4 className="font-semibold text-gray-900">Irrigation System</h4>
                    </div>
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-gray-700">Component</th>
                          <th className="px-4 py-2 text-right text-gray-700">Qty</th>
                          <th className="px-4 py-2 text-right text-gray-700">Unit $</th>
                          <th className="px-4 py-2 text-right text-gray-700">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {irrigationItems.filter(item => item.qty > 0).map((item, idx) => (
                          <tr key={item.name} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-2 text-gray-900">{item.name}</td>
                            <td className="px-4 py-2 text-right text-gray-900">{item.qty.toLocaleString()}</td>
                            <td className="px-4 py-2 text-right text-gray-900">${item.unitCost.toFixed(2)}</td>
                            <td className="px-4 py-2 text-right font-medium text-gray-900">
                              ${formatMoney(item.qty * item.unitCost)}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-gray-900" style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
                          <td colSpan="3" className="px-4 py-2 text-sm font-bold text-white">Subtotal</td>
                          <td className="px-4 py-2 text-sm text-right font-bold text-white">
                            ${formatMoney(irrigationTotal)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="mt-6 bg-gray-50 border border-gray-300 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Total Material Costs</span>
                  <span className="text-2xl font-bold text-gray-900">
                    ${formatMoney(grandTotal)}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Includes all posts, wire, anchors, hardware, drip lines, and emitters for complete vineyard installation
                </p>
              </div>
            </section>
          );
        })()}

        {/* 5. Equipment Financing */}
        {equipmentCapitalCosts > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300 print:text-xl print:mb-3">
              V. Equipment Financing
            </h2>

            <div className="border border-gray-300 rounded-lg overflow-hidden mb-6">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Equipment Item</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-900">Purchase Price</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-900">Annual Payment</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-900">Term (Years)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stNum.equipmentOps.filter(e => e.include).map((equip, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 text-gray-900">{equip.label}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        ${formatMoney(equip.cost || 0)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900">
                        ${formatMoney(equip.annualTotal || 0)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900">
                        {equip.financeTerm || 5}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-900" style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
                    <td className="px-4 py-3 text-sm font-bold text-white">Total Equipment Investment</td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-white">
                      ${formatMoney(equipmentCapitalCosts)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-white">
                      ${formatMoney(equipmentAnnualCosts)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-white">—</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Financing Note:</span> Equipment financing terms typically range from 3-7 years
                depending on the asset type. Annual payments shown include principal and interest. Consider leasing options
                for equipment that may need frequent upgrades.
              </p>
            </div>
          </section>
        )}

        {/* 6. Annual Operating Costs Breakdown */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300 print:text-xl print:mb-3">
            VI. Annual Operating Costs Breakdown
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cultural Operations */}
            <div className="border border-gray-300 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Cultural Operations</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-700">Spraying & Pest Management</span>
                  <span className="font-medium text-gray-900">${formatMoney(totalAnnualOpCosts * 0.15)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-700">Canopy Management</span>
                  <span className="font-medium text-gray-900">${formatMoney(totalAnnualOpCosts * 0.12)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-700">Pruning</span>
                  <span className="font-medium text-gray-900">${formatMoney(totalAnnualOpCosts * 0.18)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-700">Fertilization & Soil Amendments</span>
                  <span className="font-medium text-gray-900">${formatMoney(totalAnnualOpCosts * 0.08)}</span>
                </div>
                <div className="flex justify-between py-2 bg-gray-50 px-2 rounded">
                  <span className="font-bold text-gray-900">Subtotal</span>
                  <span className="font-bold text-gray-900">${formatMoney(totalAnnualOpCosts * 0.53)}</span>
                </div>
              </div>
            </div>

            {/* Harvest & Operations */}
            <div className="border border-gray-300 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Harvest & Hauling</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-700">Harvest Labor</span>
                  <span className="font-medium text-gray-900">${formatMoney(totalAnnualOpCosts * 0.20)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-700">Transportation & Hauling</span>
                  <span className="font-medium text-gray-900">${formatMoney(totalAnnualOpCosts * 0.07)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-700">Equipment & Supplies</span>
                  <span className="font-medium text-gray-900">${formatMoney(totalAnnualOpCosts * 0.05)}</span>
                </div>
                <div className="flex justify-between py-2 bg-gray-50 px-2 rounded">
                  <span className="font-bold text-gray-900">Subtotal</span>
                  <span className="font-bold text-gray-900">${formatMoney(totalAnnualOpCosts * 0.32)}</span>
                </div>
              </div>
            </div>

            {/* Water & Irrigation */}
            <div className="border border-gray-300 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Water & Irrigation</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-700">Water Usage</span>
                  <span className="font-medium text-gray-900">${formatMoney(totalAnnualOpCosts * 0.06)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-700">System Maintenance</span>
                  <span className="font-medium text-gray-900">${formatMoney(totalAnnualOpCosts * 0.03)}</span>
                </div>
                <div className="flex justify-between py-2 bg-gray-50 px-2 rounded">
                  <span className="font-bold text-gray-900">Subtotal</span>
                  <span className="font-bold text-gray-900">${formatMoney(totalAnnualOpCosts * 0.09)}</span>
                </div>
              </div>
            </div>

            {/* Insurance & Overhead */}
            <div className="border border-gray-300 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Insurance & Overhead</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-700">Crop Insurance</span>
                  <span className="font-medium text-gray-900">${formatMoney(totalAnnualOpCosts * 0.03)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-700">General Insurance</span>
                  <span className="font-medium text-gray-900">${formatMoney(totalAnnualOpCosts * 0.02)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-700">Administrative Overhead</span>
                  <span className="font-medium text-gray-900">${formatMoney(totalAnnualOpCosts * 0.01)}</span>
                </div>
                <div className="flex justify-between py-2 bg-gray-50 px-2 rounded">
                  <span className="font-bold text-gray-900">Subtotal</span>
                  <span className="font-bold text-gray-900">${formatMoney(totalAnnualOpCosts * 0.06)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-gray-50 border border-gray-300 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-gray-900">Total Annual Operating Costs</span>
              <span className="text-2xl font-bold text-gray-900">${formatMoney(totalAnnualOpCosts)}</span>
            </div>
            <p className="text-xs text-gray-600 mt-2">Per acre: ${formatMoney(opCostPerAcre)}</p>
          </div>
        </section>

        {/* 7. Labor Budget */}
        {stNum.labor && stNum.labor.filter(l => l.include).length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300 print:text-xl print:mb-3">
              VII. Labor Budget
            </h2>

            <div className="border border-gray-300 rounded-lg overflow-hidden mb-6">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Position</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-900">Per Acre</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-900">Annual Total</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-900">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stNum.labor.filter(l => l.include).map((labor, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 text-gray-900">{labor.label}</td>
                      <td className="px-4 py-3 text-right text-gray-900">${formatMoney(labor.costPerAcre || 0)}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        ${formatMoney(labor.annualTotal || (labor.costPerAcre * stNum.acres))}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600 text-xs">
                        {labor.label.toLowerCase().includes('manager') || labor.label.toLowerCase().includes('winemaker')
                          ? 'Full-time'
                          : 'Seasonal'}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50">
                    <td colSpan="2" className="px-4 py-3 text-sm font-semibold text-gray-900">Benefits & Payroll Taxes (15%)</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      ${formatMoney(stNum.labor.filter(l => l.include).reduce((sum, l) =>
                        sum + (l.annualTotal || (l.costPerAcre * stNum.acres)), 0) * 0.15)}
                    </td>
                    <td className="px-4 py-3"></td>
                  </tr>
                  <tr className="bg-gray-900" style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
                    <td colSpan="2" className="px-4 py-3 text-sm font-bold text-white">Total Labor Budget</td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-white">
                      ${formatMoney(stNum.labor.filter(l => l.include).reduce((sum, l) =>
                        sum + (l.annualTotal || (l.costPerAcre * stNum.acres)), 0) * 1.15)}
                    </td>
                    <td className="px-4 py-3"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Labor Allocation:</span> Labor costs include vineyard management, seasonal harvest workers,
                {stNum.salesMode === 'wine' && ' winemaking staff,'} and all payroll taxes and benefits. Seasonal labor requirements
                peak during pruning and harvest seasons.
              </p>
            </div>
          </section>
        )}

        {/* 8. Permits & Licenses Detail */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300 print:text-xl print:mb-3">
            VIII. Permits & Licenses Detail
          </h2>

          <div className="border border-gray-300 rounded-lg overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Permit/License</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-900">Cost</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-900">Frequency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stNum.salesMode === 'wine' ? (
                  <>
                    <tr className="bg-white">
                      <td className="px-4 py-3 text-gray-900">TTB Winery Basic Permit</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">$5,000</td>
                      <td className="px-4 py-3 text-right text-gray-600">One-time (capital)</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-4 py-3 text-gray-900">State Winery License</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">$3,500</td>
                      <td className="px-4 py-3 text-right text-gray-600">Annual (operating)</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="px-4 py-3 text-gray-900">Label Approval (COLA)</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">$500</td>
                      <td className="px-4 py-3 text-right text-gray-600">Per vintage (operating)</td>
                    </tr>
                  </>
                ) : (
                  <>
                    <tr className="bg-white">
                      <td className="px-4 py-3 text-gray-900">Agricultural Business License</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">$500</td>
                      <td className="px-4 py-3 text-right text-gray-600">Annual (operating)</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-4 py-3 text-gray-900">Pesticide Application Permit</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">$750</td>
                      <td className="px-4 py-3 text-right text-gray-600">Annual (operating)</td>
                    </tr>
                  </>
                )}
                <tr className={stNum.salesMode === 'wine' ? 'bg-gray-50' : 'bg-white'}>
                  <td className="px-4 py-3 text-gray-900">Water Rights/Permits</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">$2,000</td>
                  <td className="px-4 py-3 text-right text-gray-600">One-time (capital)</td>
                </tr>
                <tr className={stNum.salesMode === 'wine' ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 text-gray-900">Environmental Compliance</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">$1,500</td>
                  <td className="px-4 py-3 text-right text-gray-600">Annual (operating)</td>
                </tr>
                <tr className="bg-gray-100">
                  <td colSpan="3" className="px-4 py-2 text-xs text-gray-600 italic">
                    Capital costs (one-time) included in total investment; Annual costs in operating expenses
                  </td>
                </tr>
                <tr className="bg-gray-900" style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
                  <td className="px-4 py-3 text-sm font-bold text-white">Total Capital (One-time) Permits</td>
                  <td className="px-4 py-3 text-sm text-right font-bold text-white">
                    ${formatMoney(stNum.licenseCost || 0)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-bold text-white">—</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
            <p className="text-sm text-gray-700 mb-3">
              <span className="font-semibold">Regulatory Note:</span> Permit costs vary significantly by state and jurisdiction.
              {stNum.salesMode === 'wine' && ' TTB approval typically takes 4-6 months.'} The table above shows typical regulatory
              requirements; actual costs and requirements should be verified with local authorities.
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Financial Model:</span> This business plan includes <span className="font-semibold">${formatMoney(stNum.licenseCost || 0)}</span> in
              one-time regulatory and permitting costs as part of the total capital investment. Annual recurring permit fees (approximately {stNum.salesMode === 'wine' ? '$4,000' : '$2,750'})
              are included in the operating cost projections.
            </p>
          </div>
        </section>

        {/* 9. Financial Projections */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300 print:text-xl print:mb-3">
            IX. Financial Projections ({projYears} Years)
          </h2>

          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Total Projected Revenue</div>
              <div className="text-2xl font-bold text-gray-900">${formatMoney(totalRevenue)}</div>
              <div className="text-xs text-gray-500 mt-1">Over {projYears} years</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Average Annual Revenue</div>
              <div className="text-2xl font-bold text-gray-900">${formatMoney(avgAnnualRevenue)}</div>
              <div className="text-xs text-gray-500 mt-1">At full production</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Cumulative Profit (Year {projYears})</div>
              <div className="text-2xl font-bold text-gray-900">
                ${formatMoney(projection[projection.length - 1]?.cumulative || 0)}
              </div>
              <div className="text-xs text-gray-500 mt-1">{finalROI}% ROI</div>
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-300 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Year</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-900">Revenue</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-900">Expenses</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-900">Net Income</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-900">Cumulative</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {projection.slice(0, Math.min(11, projection.length)).map((p, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {p.year === 0 ? 'Setup' : `Year ${p.year}`}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900">${formatMoney(p.revenue)}</td>
                    <td className="px-4 py-3 text-right text-gray-900">${formatMoney(p.cost)}</td>
                    <td className={`px-4 py-3 text-right font-medium ${p.net >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                      ${formatMoney(p.net)}
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${p.cumulative >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                      ${formatMoney(p.cumulative)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 10. Production Timeline */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300 print:text-xl print:mb-3">
            X. Year-by-Year Production Timeline
          </h2>
          <div className="space-y-3">
            {projection.slice(0, Math.min(8, projection.length)).map((p, idx) => {
              const maturityPercent = p.year === 0 ? 0 : Math.min(100, (p.year / 6) * 100);
              return (
                <div key={idx} className="border-l-4 border-gray-400 pl-4 py-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-gray-900">
                      {p.year === 0 ? 'Setup Year' : `Year ${p.year}`}
                    </span>
                    <span className="text-sm text-gray-600">
                      {p.year === 0 ? 'Establishment' : `~${Math.round(maturityPercent)}% maturity`}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700">
                    Revenue: <span className="font-medium">${formatMoney(p.revenue)}</span> |
                    Expenses: <span className="font-medium">${formatMoney(p.cost)}</span> |
                    Net: <span className={`font-medium ${p.net >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                      ${formatMoney(p.net)}
                    </span>
                  </div>
                  {p.year > 0 && (
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2" style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
                      <div
                        className="bg-gray-700 h-2 rounded-full transition-all"
                        style={{ width: `${maturityPercent}%`, printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}
                      ></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 11. Revenue Model Analysis */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300 print:text-xl print:mb-3">
            XI. Revenue Model Analysis
          </h2>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="border border-gray-300 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Revenue Drivers</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Total Vineyard Area</span>
                  <span className="font-medium text-gray-900">{stNum.acres} acres</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Target Yield (mature)</span>
                  <span className="font-medium text-gray-900">{stNum.yieldTonsPerAcre || 4} tons/acre</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Total Production</span>
                  <span className="font-medium text-gray-900">
                    {((stNum.yieldTonsPerAcre || 4) * stNum.acres).toFixed(1)} tons/year
                  </span>
                </div>
                {stNum.salesMode === 'wine' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Bottle Price</span>
                      <span className="font-medium text-gray-900">${stNum.bottlePrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Bottles per Ton</span>
                      <span className="font-medium text-gray-900">600</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Total Bottles (mature)</span>
                      <span className="font-medium text-gray-900">
                        {((stNum.yieldTonsPerAcre || 4) * stNum.acres * 600).toLocaleString()}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="border border-gray-300 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Operating Metrics</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Annual Operating Cost</span>
                  <span className="font-medium text-gray-900">${formatMoney(totalAnnualOpCosts)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Cost per Acre</span>
                  <span className="font-medium text-gray-900">${formatMoney(opCostPerAcre)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Max Revenue (mature)</span>
                  <span className="font-medium text-gray-900">
                    ${formatMoney(projection[projection.length - 1]?.revenue || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Max Net Income</span>
                  <span className="font-medium text-gray-900">
                    ${formatMoney(projection[projection.length - 1]?.net || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Profit Margin (mature)</span>
                  <span className="font-medium text-gray-900">
                    {projection[projection.length - 1]?.revenue > 0
                      ? Math.round((projection[projection.length - 1].net / projection[projection.length - 1].revenue) * 100)
                      : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {stNum.salesMode === 'wine' && (
            <div className="border border-gray-300 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Price Point Analysis</h3>
              <p className="text-sm text-gray-700 mb-3">
                At the current bottle price of ${stNum.bottlePrice.toFixed(2)}, the vineyard will generate
                approximately ${formatMoney((stNum.yieldTonsPerAcre || 4) * stNum.acres * 600 * stNum.bottlePrice)}
                in annual revenue at full production. Adjusting the price point by $5-10 could significantly impact
                profitability while maintaining market competitiveness.
              </p>
              <div className="bg-gray-50 p-3 rounded text-sm">
                <p className="text-gray-700">
                  <span className="font-semibold">Recommendation:</span> Consider a price range of
                  ${Math.max(15, stNum.bottlePrice - 5).toFixed(2)} - ${(stNum.bottlePrice + 10).toFixed(2)}
                  per bottle to optimize revenue while maintaining market positioning. Premium varietals and
                  direct-to-consumer sales can support higher price points.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* 12. Financing Ratios (LTC/LTV) */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300 print:text-xl print:mb-3">
            XII. Financing Ratios & Collateral Analysis
          </h2>

          {(() => {
            // Typical lending scenarios
            const loanAmounts = [
              { label: "50% LTC", amount: totalEstCost * 0.5 },
              { label: "65% LTC", amount: totalEstCost * 0.65 },
              { label: "80% LTC", amount: totalEstCost * 0.80 }
            ];

            // Land + Improvements value (typically land + all capital costs)
            const landValue = stNum.landPrice * stNum.acres;
            const improvementsValue = totalEstCost - landValue;
            const totalPropertyValue = landValue + improvementsValue;

            return (
              <>
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="border border-gray-300 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Property Valuation</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-700">Land Value</span>
                        <span className="font-semibold text-gray-900">${formatMoney(landValue)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-700">Improvements</span>
                        <span className="font-semibold text-gray-900">${formatMoney(improvementsValue)}</span>
                      </div>
                      <div className="flex justify-between py-2 bg-gray-50 px-2 rounded">
                        <span className="font-bold text-gray-900">Total Property Value</span>
                        <span className="font-bold text-gray-900">${formatMoney(totalPropertyValue)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-300 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Loan Scenarios</h3>
                    <div className="space-y-2 text-sm">
                      {loanAmounts.map((scenario, idx) => {
                        const ltc = (scenario.amount / totalEstCost) * 100;
                        const ltv = (scenario.amount / totalPropertyValue) * 100;
                        return (
                          <div key={idx} className="border-b border-gray-200 pb-2">
                            <div className="font-semibold text-gray-900 mb-1">{scenario.label}</div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-600">Loan Amount:</span>
                              <span className="font-medium text-gray-900">${formatMoney(scenario.amount)}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-600">LTV Ratio:</span>
                              <span className="font-medium text-gray-900">{ltv.toFixed(1)}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Financing Definitions</h3>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p>
                      <span className="font-semibold">LTC (Loan-to-Cost):</span> Total loan principal divided by total project cost.
                      A higher LTC means you're financing a larger share of the build-out expenses.
                    </p>
                    <p>
                      <span className="font-semibold">LTV (Loan-to-Value):</span> Total loan principal divided by the collateral's
                      appraised value (land + improvements). Lenders watch this ratio to ensure the asset is worth more than
                      the debt secured against it.
                    </p>
                    <p>
                      <span className="font-semibold">Land + Improvements:</span> The combined market value of the raw land
                      purchase plus all permanent site improvements (buildings, trellis, irrigation, etc.).
                    </p>
                  </div>
                </div>
              </>
            );
          })()}
        </section>

        {/* 13. Profitability & Break-Even Analysis */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300 print:text-xl print:mb-3">
            XIII. Profitability & Break-Even Analysis
          </h2>

          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Cumulative Profitability Over Time</h3>
            <div className="h-80 border border-gray-300 rounded-lg p-4 bg-white">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={projection.filter(p => p.year >= 0)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="year"
                    label={{ value: 'Year', position: 'insideBottom', offset: -5 }}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    label={{ value: 'Cumulative Profit ($)', angle: -90, position: 'insideLeft' }}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value) => [`$${formatMoney(value)}`, 'Cumulative Profit']}
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '6px' }}
                  />
                  <Legend />
                  <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" label="Break-Even" />
                  <Line
                    type="monotone"
                    dataKey="cumulative"
                    stroke="#1f2937"
                    strokeWidth={2}
                    dot={{ fill: '#1f2937', r: 4 }}
                    name="Cumulative Profit"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="text-sm text-gray-600 mb-1">Break-Even Year</div>
                <div className="text-2xl font-bold text-gray-900">Year {breakEven}</div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="text-sm text-gray-600 mb-1">Years to Profitability</div>
                <div className="text-2xl font-bold text-gray-900">{beIdx + 1} years</div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="text-sm text-gray-600 mb-1">Final Cumulative Profit</div>
                <div className="text-2xl font-bold text-gray-900">
                  ${formatMoney(projection[projection.length - 1]?.cumulative || 0)}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 14. Bottle Economics & Price Point Analysis */}
        {stNum.salesMode === 'wine' && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300 print:text-xl print:mb-3">
              XIV. Bottle Economics & Price Point Analysis
            </h2>

            {(() => {
              const annualFixed = stNum.opCost * stNum.acres;
              const costPerBottle = annualFixed / (stNum.acres * AVERAGE_YIELD_TONS_PER_ACRE * BOTTLES_PER_TON);

              // Generate price point scenarios
              const pricePoints = Array.from({ length: 7 }, (_, i) => {
                const price = Math.max(5, stNum.bottlePrice - 15 + (i * 5));
                const profit = price - costPerBottle;
                const yearlyProfit = profit * stNum.acres * AVERAGE_YIELD_TONS_PER_ACRE * BOTTLES_PER_TON;
                const margin = (profit / price) * 100;
                return { price, profit: yearlyProfit, margin };
              }).filter(p => p.price > 0);

              return (
                <>
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div className="border border-gray-300 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Bottle Economics</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between py-2 border-b border-gray-200">
                          <span className="text-gray-700">Total Bottles (at maturity)</span>
                          <span className="font-medium text-gray-900">
                            {(stNum.acres * AVERAGE_YIELD_TONS_PER_ACRE * BOTTLES_PER_TON).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-200">
                          <span className="text-gray-700">Cost per Bottle</span>
                          <span className="font-medium text-gray-900">${costPerBottle.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-200">
                          <span className="text-gray-700">Current Bottle Price</span>
                          <span className="font-medium text-gray-900">${stNum.bottlePrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between py-2 bg-gray-50 px-2 rounded">
                          <span className="font-bold text-gray-900">Profit per Bottle</span>
                          <span className="font-bold text-gray-900">
                            ${(stNum.bottlePrice - costPerBottle).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="border border-gray-300 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Annual Revenue (at maturity)</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between py-2 border-b border-gray-200">
                          <span className="text-gray-700">Gross Revenue</span>
                          <span className="font-medium text-gray-900">
                            ${formatMoney(stNum.bottlePrice * stNum.acres * AVERAGE_YIELD_TONS_PER_ACRE * BOTTLES_PER_TON)}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-200">
                          <span className="text-gray-700">Operating Costs</span>
                          <span className="font-medium text-gray-900">${formatMoney(annualFixed)}</span>
                        </div>
                        <div className="flex justify-between py-2 bg-gray-50 px-2 rounded">
                          <span className="font-bold text-gray-900">Net Income</span>
                          <span className="font-bold text-gray-900">
                            ${formatMoney((stNum.bottlePrice - costPerBottle) * stNum.acres * AVERAGE_YIELD_TONS_PER_ACRE * BOTTLES_PER_TON)}
                          </span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-gray-700">Profit Margin</span>
                          <span className="font-medium text-gray-900">
                            {((stNum.bottlePrice - costPerBottle) / stNum.bottlePrice * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Price Point Impact Analysis</h3>
                    <div className="h-80 border border-gray-300 rounded-lg p-4 bg-white">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={pricePoints}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis
                            dataKey="price"
                            label={{ value: 'Bottle Price ($)', position: 'insideBottom', offset: -5 }}
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis
                            yAxisId="left"
                            label={{ value: 'Annual Profit ($)', angle: -90, position: 'insideLeft' }}
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                          />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            label={{ value: 'Profit Margin (%)', angle: 90, position: 'insideRight' }}
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip
                            formatter={(value, name) => [
                              name === 'profit' ? `$${formatMoney(value)}` : `${value.toFixed(1)}%`,
                              name === 'profit' ? 'Annual Profit' : 'Profit Margin'
                            ]}
                            labelFormatter={value => `Bottle Price: $${value}`}
                            contentStyle={{ backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '6px' }}
                          />
                          <Legend />
                          <Bar yAxisId="left" dataKey="profit" name="Annual Profit" fill="#1f2937" />
                          <Bar yAxisId="right" dataKey="margin" name="Profit Margin %" fill="#6b7280" />
                          <ReferenceLine
                            yAxisId="left"
                            x={stNum.bottlePrice}
                            stroke="#ef4444"
                            strokeDasharray="3 3"
                            label={{ position: 'top', value: 'Current Price', fill: '#ef4444', fontSize: 12 }}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold">Analysis:</span> At your current price point (${stNum.bottlePrice.toFixed(2)}),
                        you'll achieve a {((stNum.bottlePrice - costPerBottle) / stNum.bottlePrice * 100).toFixed(1)}% profit margin
                        and approximately ${formatMoney((stNum.bottlePrice - costPerBottle) * stNum.acres * AVERAGE_YIELD_TONS_PER_ACRE * BOTTLES_PER_TON)}
                        in annual profit at full production. Consider price points between ${Math.max(15, stNum.bottlePrice - 5).toFixed(2)}
                        and ${(stNum.bottlePrice + 10).toFixed(2)} to optimize profitability while maintaining market competitiveness.
                      </p>
                    </div>
                  </div>
                </>
              );
            })()}
          </section>
        )}

        {/* Bottling Strategy (Wine Mode Only) */}
        {stNum.salesMode === 'wine' && projYears && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300 print:text-xl print:mb-3">
              Bottling Strategy & Inventory Management
            </h2>

            {(() => {
              const totalBottlesPerYear = stNum.acres * (stNum.yieldTonsPerAcre || 4) * 600;
              const agingStrategy = projection.slice(1, Math.min(7, projection.length)).map((p, idx) => {
                const year = p.year;
                const maturityPercent = Math.min(100, (year / 6) * 100);
                const bottlesProduced = Math.round(totalBottlesPerYear * (maturityPercent / 100));
                const bottlesSold = Math.round(bottlesProduced * 0.75); // Assume 75% sell in first year
                const unsoldBottles = bottlesProduced - bottlesSold;
                const agingValue = unsoldBottles * stNum.bottlePrice * 1.15; // 15% value increase with aging

                return {
                  year,
                  produced: bottlesProduced,
                  sold: bottlesSold,
                  unsold: unsoldBottles,
                  agingValue
                };
              });

              return (
                <>
                  <div className="border border-gray-300 rounded-lg overflow-hidden mb-6">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-900">Year</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-900">Bottles Produced</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-900">Bottles Sold</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-900">Unsold Inventory</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-900">Aging Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {agingStrategy.map((item, idx) => (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-3 font-medium text-gray-900">Year {item.year}</td>
                            <td className="px-4 py-3 text-right text-gray-900">{item.produced.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right text-gray-900">{item.sold.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right font-medium text-gray-900">{item.unsold.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right text-gray-900">${formatMoney(item.agingValue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Aging Strategy Impact</h3>
                      <p className="text-sm text-gray-700 mb-3">
                        Holding back 25% of production for aging can increase wine value by 15-30% while improving quality perception.
                        This strategy requires adequate storage facilities and impacts short-term cash flow.
                      </p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between py-2 border-b border-gray-200">
                          <span className="text-gray-700">Annual Production (mature)</span>
                          <span className="font-medium text-gray-900">{totalBottlesPerYear.toLocaleString()} bottles</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-200">
                          <span className="text-gray-700">Immediate Release (75%)</span>
                          <span className="font-medium text-gray-900">{Math.round(totalBottlesPerYear * 0.75).toLocaleString()} bottles</span>
                        </div>
                        <div className="flex justify-between py-2 bg-white px-2 rounded">
                          <span className="font-bold text-gray-900">Reserve/Aging (25%)</span>
                          <span className="font-bold text-gray-900">{Math.round(totalBottlesPerYear * 0.25).toLocaleString()} bottles</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Cash Flow Considerations</h3>
                      <p className="text-sm text-gray-700 mb-3">
                        Unsold inventory represents deferred revenue. Budget for storage costs ($0.50-1.00/bottle/year) and
                        ensure adequate working capital to cover operating expenses while inventory ages.
                      </p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between py-2 border-b border-gray-200">
                          <span className="text-gray-700">Year 1 Deferred Revenue</span>
                          <span className="font-medium text-red-600">
                            -${formatMoney(totalBottlesPerYear * 0.25 * stNum.bottlePrice * 0.5)}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-200">
                          <span className="text-gray-700">Year 2+ Aged Sales Premium</span>
                          <span className="font-medium text-gray-900">
                            +${formatMoney(totalBottlesPerYear * 0.25 * stNum.bottlePrice * 1.15)}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 bg-white px-2 rounded">
                          <span className="font-bold text-gray-900">Net Aging Benefit</span>
                          <span className="font-bold text-gray-900">
                            +${formatMoney(totalBottlesPerYear * 0.25 * stNum.bottlePrice * 0.15)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </section>
        )}

        {/* Sensitivity Analysis */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300 print:text-xl print:mb-3">
            Sensitivity Analysis
          </h2>

          {(() => {
            // Base scenario metrics
            const baseRevenue = projection[projection.length - 1]?.revenue || 0;
            const baseCumulative = projection[projection.length - 1]?.cumulative || 0;

            // Scenario 1: Yield -20%
            const yieldLowRevenue = baseRevenue * 0.8;
            const yieldLowCost = projection[projection.length - 1]?.cost * 0.95; // Costs slightly lower
            const yieldLowNet = yieldLowRevenue - yieldLowCost;
            const yieldLowCumulative = baseCumulative - (baseRevenue - yieldLowRevenue) * projYears * 0.5;

            // Scenario 2: Price -15%
            const priceLowRevenue = baseRevenue * 0.85;
            const priceLowNet = priceLowRevenue - projection[projection.length - 1]?.cost;
            const priceLowCumulative = baseCumulative - (baseRevenue - priceLowRevenue) * projYears * 0.5;

            // Scenario 3: Costs +10%
            const costHighCost = projection[projection.length - 1]?.cost * 1.10;
            const costHighNet = baseRevenue - costHighCost;
            const costHighCumulative = baseCumulative - (costHighCost - projection[projection.length - 1]?.cost) * projYears * 0.5;

            const scenarios = [
              {
                name: 'Base Case',
                description: 'Current projections',
                revenue: baseRevenue,
                netIncome: projection[projection.length - 1]?.net || 0,
                cumulative: baseCumulative,
                roi: finalROI
              },
              {
                name: 'Yield -20%',
                description: 'Lower than expected yield due to weather, disease, or vine maturity',
                revenue: yieldLowRevenue,
                netIncome: yieldLowNet,
                cumulative: yieldLowCumulative,
                roi: Math.round((yieldLowCumulative / totalEstCost) * 100)
              },
              {
                name: 'Price -15%',
                description: 'Market downturn or increased competition lowers prices',
                revenue: priceLowRevenue,
                netIncome: priceLowNet,
                cumulative: priceLowCumulative,
                roi: Math.round((priceLowCumulative / totalEstCost) * 100)
              },
              {
                name: 'Costs +10%',
                description: 'Inflation, labor shortages, or input cost increases',
                revenue: baseRevenue,
                netIncome: costHighNet,
                cumulative: costHighCumulative,
                roi: Math.round((costHighCumulative / totalEstCost) * 100)
              }
            ];

            return (
              <>
                <div className="border border-gray-300 rounded-lg overflow-hidden mb-6">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Scenario</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-900">Annual Revenue</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-900">Net Income</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-900">Cumulative Profit</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-900">ROI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {scenarios.map((scenario, idx) => (
                        <tr key={idx} className={idx === 0 ? 'bg-gray-50 font-semibold' : 'bg-white'}>
                          <td className="px-4 py-3">
                            <div className="text-gray-900">{scenario.name}</div>
                            <div className="text-xs text-gray-600 mt-1">{scenario.description}</div>
                          </td>
                          <td className="px-4 py-3 text-right text-gray-900">${formatMoney(scenario.revenue)}</td>
                          <td className={`px-4 py-3 text-right ${scenario.netIncome >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                            ${formatMoney(scenario.netIncome)}
                          </td>
                          <td className={`px-4 py-3 text-right font-medium ${scenario.cumulative >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                            ${formatMoney(scenario.cumulative)}
                          </td>
                          <td className={`px-4 py-3 text-right font-medium ${scenario.roi >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                            {scenario.roi}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="font-semibold text-red-900 mb-2">Most Vulnerable To</h3>
                    <p className="text-sm text-red-800">
                      {Math.abs(priceLowCumulative - baseCumulative) > Math.abs(yieldLowCumulative - baseCumulative)
                        ? 'Price fluctuations have the greatest impact on profitability. Focus on premium positioning and direct sales.'
                        : 'Yield variations significantly affect returns. Invest in vineyard management and crop insurance.'}
                    </p>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="font-semibold text-yellow-900 mb-2">Mitigation Strategies</h3>
                    <ul className="text-sm text-yellow-800 space-y-1 list-disc ml-4">
                      <li>Diversify revenue streams</li>
                      <li>Maintain cost discipline</li>
                      <li>Secure crop insurance</li>
                      <li>Build financial reserves</li>
                    </ul>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-semibold text-green-900 mb-2">Worst Case Outcome</h3>
                    <p className="text-sm text-green-800">
                      Even under the worst scenario (-20% yield), the project maintains a{' '}
                      {Math.round((yieldLowCumulative / totalEstCost) * 100)}% ROI over {projYears} years,
                      demonstrating investment resilience.
                    </p>
                  </div>
                </div>
              </>
            );
          })()}
        </section>

        {/* Implementation Timeline */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300 print:text-xl print:mb-3">
            Implementation Timeline
          </h2>

          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Year 0: Establishment Phase (Month-by-Month)</h3>
            <div className="space-y-3">
              {[
                { months: 'Months 1-2', tasks: ['Finalize land purchase and financing', 'Obtain necessary permits and licenses', 'Conduct detailed soil analysis', 'Design vineyard layout and infrastructure'] },
                { months: 'Months 3-4', tasks: ['Clear and prepare land', 'Install irrigation main lines', 'Set up trellis posts and anchors', 'Prepare planting sites'] },
                { months: 'Months 5-6', tasks: ['Plant vines (optimal planting window)', 'Install drip irrigation lines', 'Complete trellis wire installation', 'Set up weather monitoring equipment'] },
                { months: 'Months 7-8', tasks: ['Initial canopy training', 'Weed management program', 'Fertilization based on soil tests', 'Pest and disease monitoring setup'] },
                { months: 'Months 9-12', tasks: ['Winter pruning training', 'Equipment winterization', 'Plan Year 1 operations', 'Review and adjust budget'] }
              ].map((period, idx) => (
                <div key={idx} className="border-l-4 border-gray-400 pl-4 py-2">
                  <div className="font-semibold text-gray-900 mb-2">{period.months}</div>
                  <ul className="list-disc ml-5 text-sm text-gray-700 space-y-1">
                    {period.tasks.map((task, tidx) => (
                      <li key={tidx}>{task}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Production Milestones</h3>
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Year</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Milestone</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-900">Expected Yield</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Key Activities</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="bg-white">
                    <td className="px-4 py-3 font-medium text-gray-900">Year 1</td>
                    <td className="px-4 py-3 text-gray-900">Vine Establishment</td>
                    <td className="px-4 py-3 text-right text-gray-900">None</td>
                    <td className="px-4 py-3 text-gray-700 text-xs">Focus on root development, remove all fruit</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">Year 2</td>
                    <td className="px-4 py-3 text-gray-900">Early Growth</td>
                    <td className="px-4 py-3 text-right text-gray-900">0-10%</td>
                    <td className="px-4 py-3 text-gray-700 text-xs">Limited cropping, canopy development</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-4 py-3 font-medium text-gray-900">Year 3</td>
                    <td className="px-4 py-3 text-gray-900">First Commercial Harvest</td>
                    <td className="px-4 py-3 text-right text-gray-900">30-50%</td>
                    <td className="px-4 py-3 text-gray-700 text-xs">Crop thinning, quality focus</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">Year 4</td>
                    <td className="px-4 py-3 text-gray-900">Increasing Production</td>
                    <td className="px-4 py-3 text-right text-gray-900">60-70%</td>
                    <td className="px-4 py-3 text-gray-700 text-xs">Optimize canopy management</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-4 py-3 font-medium text-gray-900">Year 5</td>
                    <td className="px-4 py-3 text-gray-900">Near Full Production</td>
                    <td className="px-4 py-3 text-right text-gray-900">80-90%</td>
                    <td className="px-4 py-3 text-gray-700 text-xs">Fine-tune quality protocols</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">Year 6+</td>
                    <td className="px-4 py-3 text-gray-900">Full Maturity</td>
                    <td className="px-4 py-3 text-right text-gray-900">100%</td>
                    <td className="px-4 py-3 text-gray-700 text-xs">Sustainable production achieved</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Critical Success Factors:</span> Timely completion of Year 0 tasks is essential
              for vine establishment. Delays in planting can push back the entire timeline and affect break-even projections.
              Budget adequate contingency time for permitting and site preparation phases.
            </p>
          </div>
        </section>

        {/* Strategic Recommendations */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300 print:text-xl print:mb-3">
            Strategic Recommendations
          </h2>
          <div className="space-y-4">
            <div className="border-l-4 border-gray-700 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">Revenue Optimization</h3>
              <ul className="list-disc ml-5 text-sm text-gray-700 space-y-1">
                <li>Allocate 30-40% of production to direct-to-consumer channels for improved margins</li>
                <li>Consider wine club memberships to stabilize cash flow and build customer loyalty</li>
                {stNum.salesMode === 'wine' && (
                  <li>Evaluate premium pricing for reserve wines and single-vineyard designations</li>
                )}
                <li>Explore tasting room revenue as supplementary income stream</li>
              </ul>
            </div>

            <div className="border-l-4 border-gray-700 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">Operational Excellence</h3>
              <ul className="list-disc ml-5 text-sm text-gray-700 space-y-1">
                <li>Implement precision viticulture techniques to optimize yield and quality</li>
                <li>Invest in soil analysis and vineyard health monitoring systems</li>
                <li>Consider organic or sustainable certification to access premium markets</li>
                <li>Maintain equipment reserves and preventative maintenance schedules</li>
              </ul>
            </div>

            <div className="border-l-4 border-gray-700 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">Financial Management</h3>
              <ul className="list-disc ml-5 text-sm text-gray-700 space-y-1">
                <li>Budget minimum 10% contingency on all capital costs</li>
                <li>Maintain operating capital reserves for 12-18 months of expenses</li>
                <li>Explore crop insurance options to mitigate weather-related risks</li>
                <li>Consider phased expansion if expanding beyond {stNum.acres} acres</li>
              </ul>
            </div>

            <div className="border-l-4 border-gray-700 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">Growth Considerations</h3>
              <ul className="list-disc ml-5 text-sm text-gray-700 space-y-1">
                <li>
                  {stNum.acres < 10
                    ? "Scaling to 10+ acres would improve economies of scale for equipment and labor"
                    : "Current scale supports efficient equipment utilization and operational efficiency"}
                </li>
                <li>Evaluate contract winemaking vs. on-site winery based on volume and margins</li>
                <li>Build relationships with distributors and retailers before peak production</li>
                <li>Invest in brand development and marketing infrastructure early</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Key Assumptions */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300 print:text-xl print:mb-3">
            Key Assumptions
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-700">Vineyard reaches full production</span>
              <span className="font-semibold text-gray-900">Year 5-6</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-700">Target yield at maturity</span>
              <span className="font-semibold text-gray-900">{stNum.yieldTonsPerAcre || 4} tons per acre</span>
            </div>
            {stNum.salesMode === 'wine' ? (
              <>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-700">Wine bottle price</span>
                  <span className="font-semibold text-gray-900">${stNum.bottlePrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-700">Bottles per ton</span>
                  <span className="font-semibold text-gray-900">600 bottles</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-700">Revenue model</span>
                  <span className="font-semibold text-gray-900">
                    {(() => {
                      const matureRevenue = projection && projection.length > 0 ? projection[projection.length - 1]?.revenue || 0 : 0;
                      const totalTons = stNum.acres * (stNum.yieldTonsPerAcre || 4);
                      const effectivePricePerTon = totalTons > 0 ? Math.round(matureRevenue / totalTons) : 0;
                      return effectivePricePerTon > 5000
                        ? 'Value-added/Direct sales'
                        : 'Bulk grape sales';
                    })()}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-700">Effective revenue per ton</span>
                  <span className="font-semibold text-gray-900">
                    ${formatMoney((() => {
                      const matureRevenue = projection && projection.length > 0 ? projection[projection.length - 1]?.revenue || 0 : 0;
                      const totalTons = stNum.acres * (stNum.yieldTonsPerAcre || 4);
                      return totalTons > 0 ? Math.round(matureRevenue / totalTons) : 0;
                    })())}
                  </span>
                </div>
              </>
            )}
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-700">Annual operating costs</span>
              <span className="font-semibold text-gray-900">${formatMoney(totalAnnualOpCosts)}</span>
            </div>
          </div>
        </section>

        {/* Risk Analysis */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300 print:text-xl print:mb-3">
            Risk Analysis & Mitigation
          </h2>
          <div className="space-y-4">
            <div className="border-l-4 border-gray-400 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">Market Risk</h3>
              <p className="text-sm text-gray-700">
                Wine and grape prices may fluctuate. Conservative pricing assumptions have been used in projections.
                Diversification of grape varieties and sales channels can mitigate this risk.
              </p>
            </div>
            <div className="border-l-4 border-gray-400 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">Weather & Climate Risk</h3>
              <p className="text-sm text-gray-700">
                Yield variations due to weather are expected. Modern irrigation systems and vineyard management
                practices help stabilize production. Crop insurance is recommended.
              </p>
            </div>
            <div className="border-l-4 border-gray-400 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">Establishment Period Risk</h3>
              <p className="text-sm text-gray-700">
                Break-even is projected at Year {breakEven}. Adequate capital reserves should be maintained to
                cover operating expenses during the non-productive establishment period.
              </p>
            </div>
          </div>
        </section>

        {/* Footer / Disclaimer */}
        <section className="mt-12 pt-8 border-t-2 border-gray-300">
          <p className="text-xs text-gray-500 leading-relaxed">
            This business plan summary is generated based on user-provided inputs and industry averages.
            Actual results may vary based on market conditions, management decisions, and unforeseen circumstances.
            This document is intended for planning purposes and should be reviewed by financial advisors and
            agricultural professionals before making investment decisions.
          </p>
          <p className="text-xs text-gray-500 mt-4">
            <span className="font-semibold">Prepared:</span> {formatDate()}
          </p>
        </section>

      </div>
    </div>
  );
}
