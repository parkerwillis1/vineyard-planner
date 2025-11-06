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

  const equipmentCosts = Array.isArray(stNum.equipmentOps)
    ? stNum.equipmentOps.reduce((sum, item) =>
        sum + (item.include ? (item.annualTotal || 0) : 0), 0)
    : 0;

  return (
    <div className="max-w-5xl mx-auto bg-white" id="business-plan-report">
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
      <div className="hidden print:block mb-8 pb-4 border-b-2 border-gray-900">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Vineyard Business Plan</h1>
        <p className="text-lg text-gray-600">Financial Analysis & Project Summary</p>
        <p className="text-sm text-gray-500 mt-2">Prepared: {formatDate()}</p>
      </div>

      {/* Document Content */}
      <div className="space-y-12 p-8 print:p-0">

        {/* 1. Executive Summary */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-gray-300">
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
                  {beIdx >= 0 ? Math.round((beIdx + 1) / projYears * 100) : 100}% of projection period
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
        <section className="break-before-page">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-gray-300">
            II. Project Overview
          </h2>

          <h3 className="text-lg font-semibold text-gray-900 mb-4">Vineyard Specifications</h3>
          <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-8">
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Total Acreage</span>
              <span className="font-semibold text-gray-900">{stNum.acres} acres</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Vine Spacing</span>
              <span className="font-semibold text-gray-900">{vineyardLayout?.spacing?.vine || 6}' × {vineyardLayout?.spacing?.row || 10}'</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Total Vines</span>
              <span className="font-semibold text-gray-900">{vineyardLayout?.calculatedLayout?.vineLayout?.totalVines?.toLocaleString() || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Vines per Acre</span>
              <span className="font-semibold text-gray-900">{vineyardLayout?.calculatedLayout?.vineLayout?.vinesPerAcre?.toLocaleString() || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Number of Rows</span>
              <span className="font-semibold text-gray-900">{vineyardLayout?.calculatedLayout?.vineLayout?.numberOfRows || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Vines per Row</span>
              <span className="font-semibold text-gray-900">{vineyardLayout?.calculatedLayout?.vineLayout?.vinesPerRow || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Row Length</span>
              <span className="font-semibold text-gray-900">
                {vineyardLayout?.calculatedLayout?.dimensions?.rowLength
                  ? `${Math.round(vineyardLayout.calculatedLayout.dimensions.rowLength)} ft`
                  : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Vineyard Perimeter</span>
              <span className="font-semibold text-gray-900">
                {vineyardLayout?.calculatedLayout?.dimensions?.perimeter
                  ? `${Math.round(vineyardLayout.calculatedLayout.dimensions.perimeter)} ft`
                  : 'N/A'}
              </span>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Model</h3>
          <div className="grid grid-cols-2 gap-x-12 gap-y-4">
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Sales Model</span>
              <span className="font-semibold text-gray-900">{stNum.salesMode === 'wine' ? 'Bottled Wine' : 'Bulk Grapes'}</span>
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
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600">Grape Price (Target)</span>
                <span className="font-semibold text-gray-900">${formatMoney(stNum.grapeSalePrice)}/ton</span>
              </div>
            )}
          </div>
        </section>

        {/* 3. Capital Requirements */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-gray-300">
            III. Capital Requirements
          </h2>

          <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
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
                  <td className="px-6 py-4 text-sm text-right font-medium">${formatMoney(equipmentCosts)}</td>
                  <td className="px-6 py-4 text-sm text-right">{totalEstCost > 0 ? ((equipmentCosts / totalEstCost) * 100).toFixed(1) : 0}%</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-6 py-4 text-sm text-gray-900">Permits & Licensing</td>
                  <td className="px-6 py-4 text-sm text-right font-medium">${formatMoney(stNum.licenseCost || 0)}</td>
                  <td className="px-6 py-4 text-sm text-right">{totalEstCost > 0 ? (((stNum.licenseCost || 0) / totalEstCost) * 100).toFixed(1) : 0}%</td>
                </tr>
                <tr className="bg-gray-900">
                  <td className="px-6 py-4 text-sm font-bold text-white">Total Capital Required</td>
                  <td className="px-6 py-4 text-sm text-right font-bold text-white">${formatMoney(totalEstCost)}</td>
                  <td className="px-6 py-4 text-sm text-right font-bold text-white">100.0%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Setup Costs</h3>
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

        {/* 4. Financial Projections */}
        <section className="break-before-page">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-gray-300">
            IV. Financial Projections ({projYears} Years)
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

        {/* 5. Production Timeline */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-gray-300">
            V. Year-by-Year Production Timeline
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
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-gray-700 h-2 rounded-full transition-all"
                        style={{ width: `${maturityPercent}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 6. Revenue Model Analysis */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-gray-300">
            VI. Revenue Model Analysis
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
                  <span className="font-medium text-gray-900">${formatMoney(stNum.opCost * stNum.acres)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Cost per Acre</span>
                  <span className="font-medium text-gray-900">${formatMoney(stNum.opCost)}</span>
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

        {/* 7. Financing Ratios (LTC/LTV) */}
        <section className="break-before-page">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-gray-300">
            VII. Financing Ratios & Collateral Analysis
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

        {/* 8. Profitability & Break-Even Analysis */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-gray-300">
            VIII. Profitability & Break-Even Analysis
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

        {/* 9. Bottle Economics & Price Point Analysis */}
        {stNum.salesMode === 'wine' && (
          <section className="break-before-page">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-gray-300">
              IX. Bottle Economics & Price Point Analysis
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

        {/* 10. Strategic Recommendations */}
        <section className="break-before-page">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-gray-300">
            X. Strategic Recommendations
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

        {/* 11. Key Assumptions */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-gray-300">
            XI. Key Assumptions
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
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-700">Grape price per ton</span>
                <span className="font-semibold text-gray-900">${formatMoney(stNum.grapeSalePrice)}</span>
              </div>
            )}
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-700">Annual operating costs</span>
              <span className="font-semibold text-gray-900">${formatMoney(stNum.opCost * stNum.acres)}</span>
            </div>
          </div>
        </section>

        {/* 12. Risk Analysis */}
        <section className="break-before-page">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-gray-300">
            XII. Risk Analysis & Mitigation
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
