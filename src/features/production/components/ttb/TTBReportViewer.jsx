import React, { useRef } from 'react';
import {
  ArrowLeft,
  Download,
  Printer,
  FileText
} from 'lucide-react';
import {
  TAX_CLASS_SHORT_LABELS,
  formatTTBDate
} from '@/shared/lib/ttbUtils';
import { TAX_CLASS_ORDER } from '@/shared/lib/ttbReportGenerator';

export function TTBReportViewer({ reportData, wineryInfo, onBack }) {
  const printRef = useRef();

  function handlePrint() {
    window.print();
  }

  if (!reportData) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">No report data available</p>
      </div>
    );
  }

  const columnHeaders = [
    { key: 'table_wine_16', label: '(a) Table ≤16%' },
    { key: 'table_wine_21', label: '(b) Table 16-21%' },
    { key: 'table_wine_24', label: '(c) Table 21-24%' },
    { key: 'artificially_carbonated', label: '(d) Carbonated' },
    { key: 'sparkling_bf', label: '(e) Sparkling BF' },
    { key: 'sparkling_bp', label: '(e) Sparkling BP' },
    { key: 'hard_cider', label: '(f) Hard Cider' }
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="pt-4 flex items-center justify-between print:hidden">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Generator
        </button>

        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      {/* Report Document */}
      <div ref={printRef} className="bg-white p-8 rounded-2xl border border-gray-200 print:border-0 print:p-0 print:rounded-none">
        {/* Form Header */}
        <div className="border-b-2 border-black pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold">REPORT OF WINE PREMISES OPERATIONS</h1>
              <p className="text-sm text-gray-600">TTB Form 5120.17</p>
            </div>
            <div className="text-right text-sm">
              <p className="font-medium">OMB No. 1513-0018</p>
              <p>Expires: 12/31/2026</p>
            </div>
          </div>
        </div>

        {/* Winery Info */}
        <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
          <div>
            <div className="mb-3">
              <p className="text-xs text-gray-500 uppercase">1. Serial Number</p>
              <p className="font-medium border-b border-gray-300 pb-1">
                {reportData.period.label}
              </p>
            </div>
            <div className="mb-3">
              <p className="text-xs text-gray-500 uppercase">2. Operated By</p>
              <p className="font-medium border-b border-gray-300 pb-1">
                {wineryInfo?.operated_by || '___________________'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">3. Location</p>
              <p className="font-medium border-b border-gray-300 pb-1">
                {wineryInfo?.premises_address ? (
                  `${wineryInfo.premises_address}, ${wineryInfo.premises_city}, ${wineryInfo.premises_state} ${wineryInfo.premises_zip}`
                ) : '___________________'}
              </p>
            </div>
          </div>
          <div>
            <div className="mb-3">
              <p className="text-xs text-gray-500 uppercase">4. Registry Number</p>
              <p className="font-medium border-b border-gray-300 pb-1">
                {wineryInfo?.registry_number || '___________________'}
              </p>
            </div>
            <div className="mb-3">
              <p className="text-xs text-gray-500 uppercase">5. Employer ID Number</p>
              <p className="font-medium border-b border-gray-300 pb-1">
                {wineryInfo?.ein || '___________________'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase">6. Period Beginning</p>
                <p className="font-medium border-b border-gray-300 pb-1">
                  {formatTTBDate(reportData.period.start)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">7. Period Ending</p>
                <p className="font-medium border-b border-gray-300 pb-1">
                  {formatTTBDate(reportData.period.end)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Part I - Section A: Bulk Wines */}
        <div className="mb-8">
          <h2 className="text-lg font-bold bg-gray-100 px-3 py-2 mb-4">
            PART I - WINE IN BULK (Gallons) - Section A: Wine Account
          </h2>

          {/* Additions */}
          <h3 className="font-semibold text-sm mb-2 text-gray-700">ADDITIONS</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-2 py-1 text-left w-8">Line</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">Description</th>
                  {columnHeaders.map(col => (
                    <th key={col.key} className="border border-gray-300 px-2 py-1 text-right w-20">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reportData.bulk.additions.map(row => (
                  <tr key={row.line} className={row.isTotal ? 'bg-gray-100 font-semibold' : ''}>
                    <td className="border border-gray-300 px-2 py-1">{row.line}</td>
                    <td className="border border-gray-300 px-2 py-1">{row.label}</td>
                    {TAX_CLASS_ORDER.map(tc => (
                      <td key={tc} className="border border-gray-300 px-2 py-1 text-right">
                        {formatValue(row.values[tc])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Removals */}
          <h3 className="font-semibold text-sm mb-2 mt-4 text-gray-700">REMOVALS AND LOSSES</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-2 py-1 text-left w-8">Line</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">Description</th>
                  {columnHeaders.map(col => (
                    <th key={col.key} className="border border-gray-300 px-2 py-1 text-right w-20">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reportData.bulk.removals.map(row => (
                  <tr
                    key={row.line}
                    className={`
                      ${row.isTotal ? 'bg-gray-100 font-semibold' : ''}
                      ${row.isEndBalance ? 'bg-blue-50 font-semibold' : ''}
                    `}
                  >
                    <td className="border border-gray-300 px-2 py-1">{row.line}</td>
                    <td className="border border-gray-300 px-2 py-1">{row.label}</td>
                    {TAX_CLASS_ORDER.map(tc => (
                      <td key={tc} className="border border-gray-300 px-2 py-1 text-right">
                        {formatValue(row.values[tc])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Part I - Section B: Bottled Wines */}
        <div className="mb-8">
          <h2 className="text-lg font-bold bg-gray-100 px-3 py-2 mb-4">
            PART I - Section B: Bottled and Packed Wine Account (Wine Gallons)
          </h2>

          {/* Additions */}
          <h3 className="font-semibold text-sm mb-2 text-gray-700">ADDITIONS</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-2 py-1 text-left w-8">Line</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">Description</th>
                  {columnHeaders.map(col => (
                    <th key={col.key} className="border border-gray-300 px-2 py-1 text-right w-20">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reportData.bottled.additions.map(row => (
                  <tr key={row.line} className={row.isTotal ? 'bg-gray-100 font-semibold' : ''}>
                    <td className="border border-gray-300 px-2 py-1">{row.line}</td>
                    <td className="border border-gray-300 px-2 py-1">{row.label}</td>
                    {TAX_CLASS_ORDER.map(tc => (
                      <td key={tc} className="border border-gray-300 px-2 py-1 text-right">
                        {formatValue(row.values[tc])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Removals */}
          <h3 className="font-semibold text-sm mb-2 mt-4 text-gray-700">REMOVALS AND LOSSES</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-2 py-1 text-left w-8">Line</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">Description</th>
                  {columnHeaders.map(col => (
                    <th key={col.key} className="border border-gray-300 px-2 py-1 text-right w-20">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reportData.bottled.removals.map(row => (
                  <tr
                    key={row.line}
                    className={`
                      ${row.isTotal ? 'bg-gray-100 font-semibold' : ''}
                      ${row.isEndBalance ? 'bg-blue-50 font-semibold' : ''}
                    `}
                  >
                    <td className="border border-gray-300 px-2 py-1">{row.line}</td>
                    <td className="border border-gray-300 px-2 py-1">{row.label}</td>
                    {TAX_CLASS_ORDER.map(tc => (
                      <td key={tc} className="border border-gray-300 px-2 py-1 text-right">
                        {formatValue(row.values[tc])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Signature Block */}
        <div className="border-t-2 border-black pt-4 mt-8 print:mt-4">
          <p className="text-xs text-gray-600 mb-4">
            Under penalties of perjury, I declare that I have examined this report, and to the best of my
            knowledge and belief, it is true, correct, and complete.
          </p>

          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-xs text-gray-500 mb-1">Signature of Proprietor or Authorized Person</p>
              <div className="border-b border-gray-400 h-8"></div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Title</p>
              <div className="border-b border-gray-400 h-8"></div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Date</p>
              <div className="border-b border-gray-400 h-8"></div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200 text-xs text-gray-500 print:hidden">
          <p>
            Generated by Trellis Winery Management Software.
            This is a working document. Official TTB submissions should be made through
            Permits Online or paper filing.
          </p>
          <p className="mt-1">
            Report generated: {new Date(reportData.generatedAt).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          #root {
            padding: 0 !important;
          }
          [class*="bg-white"][class*="rounded-2xl"] {
            visibility: visible;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0.5in;
            border: none !important;
            border-radius: 0 !important;
          }
          [class*="bg-white"][class*="rounded-2xl"] * {
            visibility: visible;
          }
          table {
            font-size: 9px !important;
          }
          th, td {
            padding: 2px 4px !important;
          }
        }
      `}</style>
    </div>
  );
}

function formatValue(value) {
  if (value === undefined || value === null || value === 0) return '';
  return parseFloat(value).toFixed(2);
}
