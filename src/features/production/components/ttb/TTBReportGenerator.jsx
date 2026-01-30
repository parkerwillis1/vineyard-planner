import React, { useState, useEffect } from 'react';
import {
  FileText,
  Calendar,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Download,
  Eye,
  Save
} from 'lucide-react';
import {
  getAvailablePeriods,
  REPORTING_PERIODS,
  TAX_CLASS_SHORT_LABELS
} from '@/shared/lib/ttbUtils';
import { generateTTBReport, TAX_CLASS_ORDER } from '@/shared/lib/ttbReportGenerator';
import { saveTTBReport, getTTBReportByPeriod, getWineryRegistration } from '@/shared/lib/ttbApi';
import { TTBReportViewer } from './TTBReportViewer';

export function TTBReportGenerator() {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [wineryInfo, setWineryInfo] = useState(null);
  const [periodType, setPeriodType] = useState(REPORTING_PERIODS.MONTHLY);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [reportData, setReportData] = useState(null);
  const [existingReport, setExistingReport] = useState(null);
  const [showViewer, setShowViewer] = useState(false);

  const periods = getAvailablePeriods(periodType, 2);

  useEffect(() => {
    loadWineryInfo();
  }, []);

  useEffect(() => {
    // Reset selection when period type changes
    setSelectedPeriod('');
    setReportData(null);
    setExistingReport(null);
  }, [periodType]);

  useEffect(() => {
    if (selectedPeriod) {
      checkExistingReport();
    }
  }, [selectedPeriod]);

  async function loadWineryInfo() {
    try {
      const { data } = await getWineryRegistration();
      setWineryInfo(data);
    } catch (err) {
      console.error('Error loading winery info:', err);
    }
  }

  async function checkExistingReport() {
    const period = periods.find(p => p.value === selectedPeriod);
    if (!period) return;

    try {
      const { data } = await getTTBReportByPeriod(
        period.start.toISOString().split('T')[0],
        period.end.toISOString().split('T')[0]
      );
      setExistingReport(data);
    } catch (err) {
      console.error('Error checking existing report:', err);
    }
  }

  async function handleGenerate() {
    const period = periods.find(p => p.value === selectedPeriod);
    if (!period) {
      setError('Please select a reporting period');
      return;
    }

    setGenerating(true);
    setError(null);
    setSuccess(null);
    setReportData(null);

    try {
      const { data, error } = await generateTTBReport(
        period.start.toISOString().split('T')[0],
        period.end.toISOString().split('T')[0]
      );

      if (error) throw error;
      setReportData(data);
      setSuccess('Report generated successfully');
    } catch (err) {
      console.error('Error generating report:', err);
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!reportData) {
      setError('Please generate a report first before saving');
      return;
    }

    const period = periods.find(p => p.value === selectedPeriod);
    if (!period) {
      setError('Please select a reporting period');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { data, error } = await saveTTBReport({
        period_type: periodType,
        period_start: period.start.toISOString().split('T')[0],
        period_end: period.end.toISOString().split('T')[0],
        status: 'draft',
        report_data: reportData
      });

      if (error) {
        // Handle specific Supabase errors
        if (error.code === '42P01') {
          throw new Error('TTB tables not found. Please run the TTB migration first.');
        }
        throw error;
      }

      setSuccess('Report saved as draft');
      setExistingReport({ status: 'draft', report_data: reportData, id: data?.id });
    } catch (err) {
      console.error('Error saving report:', err);
      setError(err.message || 'Failed to save report. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (showViewer && reportData) {
    return (
      <TTBReportViewer
        reportData={reportData}
        wineryInfo={wineryInfo}
        onBack={() => setShowViewer(false)}
      />
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="pt-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">TTB Form 5120.17</h1>
          <p className="text-sm text-gray-500 mt-1">
            Report of Wine Premises Operations
          </p>
        </div>
      </div>

      {/* Winery Info Warning */}
      {!wineryInfo?.operated_by && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-800 font-medium">Winery Registration Incomplete</p>
            <p className="text-sm text-amber-700 mt-1">
              Please complete your winery registration in TTB Settings before generating reports.
            </p>
          </div>
        </div>
      )}

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {/* Period Selection */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="w-5 h-5 text-[#7C203A]" />
          <h2 className="text-lg font-bold text-gray-900">Reporting Period</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Period Type
            </label>
            <div className="flex gap-2">
              {Object.values(REPORTING_PERIODS).map(type => (
                <button
                  key={type}
                  onClick={() => setPeriodType(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    periodType === type
                      ? 'bg-[#7C203A] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Period
            </label>
            <select
              value={selectedPeriod}
              onChange={e => setSelectedPeriod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A]/20 focus:border-[#7C203A]"
            >
              <option value="">Select a period...</option>
              {periods.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>

        {existingReport && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              A {existingReport.status} report already exists for this period.
              Generating will update the existing report.
            </p>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleGenerate}
            disabled={!selectedPeriod || generating}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#7C203A] text-white rounded-xl hover:bg-[#7C203A]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Generate Report
              </>
            )}
          </button>
        </div>
      </div>

      {/* Report Preview */}
      {reportData && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-[#7C203A]" />
              <h2 className="text-lg font-bold text-gray-900">Report Summary</h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Draft
              </button>
              <button
                onClick={() => setShowViewer(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#7C203A] text-white rounded-lg hover:bg-[#7C203A]/90 transition-colors"
              >
                <Eye className="w-4 h-4" />
                View Full Report
              </button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500 mb-1">Bulk Produced</p>
              <p className="text-2xl font-bold text-gray-900">
                {reportData.summary.totalBulkProduced.toFixed(0)} gal
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500 mb-1">Bulk On Hand</p>
              <p className="text-2xl font-bold text-gray-900">
                {reportData.summary.totalBulkOnHand.toFixed(0)} gal
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500 mb-1">Bottled Produced</p>
              <p className="text-2xl font-bold text-gray-900">
                {reportData.summary.totalBottledProduced.toFixed(0)} gal
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500 mb-1">Bottled On Hand</p>
              <p className="text-2xl font-bold text-gray-900">
                {reportData.summary.totalBottledOnHand.toFixed(0)} gal
              </p>
            </div>
          </div>

          {/* By Tax Class */}
          <h3 className="font-semibold text-gray-900 mb-3">By Tax Class</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-medium text-gray-700">Tax Class</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-700">Bulk Produced</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-700">Bulk On Hand</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-700">Bottled Produced</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-700">Bottled On Hand</th>
                </tr>
              </thead>
              <tbody>
                {TAX_CLASS_ORDER.map(tc => {
                  const data = reportData.summary.byTaxClass[tc];
                  const hasData = data && (
                    data.bulkProduced > 0 ||
                    data.bulkOnHand > 0 ||
                    data.bottledProduced > 0 ||
                    data.bottledOnHand > 0
                  );

                  if (!hasData) return null;

                  return (
                    <tr key={tc} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-3 font-medium text-gray-900">
                        {TAX_CLASS_SHORT_LABELS[tc]}
                      </td>
                      <td className="text-right py-2 px-3 text-gray-700">
                        {data.bulkProduced > 0 ? data.bulkProduced.toFixed(2) : '-'}
                      </td>
                      <td className="text-right py-2 px-3 text-gray-700">
                        {data.bulkOnHand > 0 ? data.bulkOnHand.toFixed(2) : '-'}
                      </td>
                      <td className="text-right py-2 px-3 text-gray-700">
                        {data.bottledProduced > 0 ? data.bottledProduced.toFixed(2) : '-'}
                      </td>
                      <td className="text-right py-2 px-3 text-gray-700">
                        {data.bottledOnHand > 0 ? data.bottledOnHand.toFixed(2) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-medium">
                  <td className="py-2 px-3">Total</td>
                  <td className="text-right py-2 px-3">
                    {reportData.summary.totalBulkProduced.toFixed(2)}
                  </td>
                  <td className="text-right py-2 px-3">
                    {reportData.summary.totalBulkOnHand.toFixed(2)}
                  </td>
                  <td className="text-right py-2 px-3">
                    {reportData.summary.totalBottledProduced.toFixed(2)}
                  </td>
                  <td className="text-right py-2 px-3">
                    {reportData.summary.totalBottledOnHand.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            Report generated from {reportData.transactionCount} transactions.
            Generated at {new Date(reportData.generatedAt).toLocaleString()}.
          </p>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-2xl border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-3">About Form 5120.17</h3>
        <div className="text-sm text-gray-600 space-y-2">
          <p>
            TTB Form 5120.17 (Report of Wine Premises Operations) is required for all
            bonded wine premises to report production, removals, and inventory.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Monthly filing is required if you produced 20,000+ gallons in the preceding year</li>
            <li>Quarterly filing if you produced more than 60,000 gallons per quarter</li>
            <li>Annual filing allowed for wineries under 20,000 gallons per year</li>
            <li>Reports are due by the 15th of the month following the reporting period</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
