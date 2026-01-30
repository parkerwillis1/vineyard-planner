import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Download,
  Calendar,
  Wine,
  BarChart3,
  Package,
  Droplet,
  FileSpreadsheet,
  Printer,
  Filter,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { listLots, listContainers, listFermentationLogs } from '@/shared/lib/productionApi';
import {
  generateCurrentInventoryPDF,
  generateCurrentInventoryExcel,
  generateCurrentInventoryCSV,
  generateInventoryByVarietalPDF,
  generateInventoryByVarietalExcel,
  generateInventoryByVintagePDF,
  generateInventoryByVintageExcel,
  generateFermentationLogPDF,
  generateFermentationLogCSV,
  generateContainerUtilizationPDF,
  generateVolumeTrackingPDF,
  generateProductionTimelinePDF,
  generateYieldAnalysisPDF,
  generateYieldAnalysisExcel,
  generateVintageComparisonPDF,
  generateVintageComparisonExcel,
  generateVarietalPerformancePDF,
  generateVarietalPerformanceExcel,
  generateFermentationMetricsPDF,
  generateFermentationMetricsExcel,
  generateLabelInformationPDF,
  generateLabelInformationExcel,
  exportToExcel,
  exportToCSV
} from '@/shared/lib/exportUtils';

export function Reports() {
  const navigate = useNavigate();
  const [selectedReport, setSelectedReport] = useState(null);
  const [dateRange, setDateRange] = useState('all');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Data
  const [lots, setLots] = useState([]);
  const [containers, setContainers] = useState([]);
  const [fermentationLogs, setFermentationLogs] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [lotsRes, containersRes] = await Promise.all([
        listLots(),
        listContainers()
      ]);

      if (!lotsRes.error) setLots(lotsRes.data || []);
      if (!containersRes.error) setContainers(containersRes.data || []);

      // Load fermentation logs for all lots in parallel
      if (lotsRes.data && lotsRes.data.length > 0) {
        const logPromises = lotsRes.data.map(lot =>
          listFermentationLogs(lot.id).then(logsRes => ({
            lotName: lot.name,
            lotId: lot.id,
            logs: logsRes.error ? [] : logsRes.data || []
          }))
        );

        const lotsWithLogs = await Promise.all(logPromises);
        const allLogs = lotsWithLogs.flatMap(({ lotName, lotId, logs }) =>
          logs.map(log => ({ ...log, lot_name: lotName, lot_id: lotId }))
        );

        console.log('Loaded fermentation logs:', allLogs.length);
        setFermentationLogs(allLogs);
      }
    } catch (err) {
      console.error('Error loading report data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleExport(reportId, format) {
    setExporting(true);
    try {
      switch (reportId) {
        case 'current-inventory':
          if (format === 'PDF') generateCurrentInventoryPDF(lots);
          else if (format === 'Excel') generateCurrentInventoryExcel(lots);
          else if (format === 'CSV') generateCurrentInventoryCSV(lots);
          break;

        case 'inventory-by-varietal':
          if (format === 'PDF') generateInventoryByVarietalPDF(lots);
          else if (format === 'Excel') generateInventoryByVarietalExcel(lots);
          break;

        case 'inventory-by-vintage':
          if (format === 'PDF') generateInventoryByVintagePDF(lots);
          else if (format === 'Excel') generateInventoryByVintageExcel(lots);
          break;

        case 'container-utilization':
          if (format === 'PDF') {
            generateContainerUtilizationPDF(containers);
          } else if (format === 'Excel') {
            const containerData = containers.map(c => ({
              'Container Name': c.name,
              'Type': c.type,
              'Capacity (gal)': c.capacity_gallons?.toFixed(0) || '0',
              'Current Volume (gal)': c.current_volume_gallons?.toFixed(0) || '0',
              'Utilization': c.capacity_gallons > 0
                ? ((c.current_volume_gallons / c.capacity_gallons) * 100).toFixed(1) + '%'
                : '0%',
              'Status': c.current_volume_gallons > 0 ? 'In Use' : 'Empty'
            }));
            exportToExcel(containerData, 'container-utilization', 'Containers');
          }
          break;

        case 'fermentation-log':
          if (format === 'PDF') generateFermentationLogPDF(fermentationLogs);
          else if (format === 'CSV') generateFermentationLogCSV(fermentationLogs);
          else if (format === 'Excel') {
            const data = fermentationLogs.map(log => ({
              'Lot Name': log.lot_name,
              'Date': new Date(log.log_date).toLocaleDateString(),
              'Brix': log.brix?.toFixed(1) || '',
              'Temp (°F)': log.temp_f?.toFixed(0) || '',
              'pH': log.ph?.toFixed(2) || '',
              'TA': log.ta?.toFixed(2) || '',
              'Notes': log.notes || ''
            }));
            exportToExcel(data, 'fermentation-logs', 'Fermentation Logs');
          }
          break;

        case 'volume-tracking':
          if (format === 'PDF') {
            generateVolumeTrackingPDF(lots);
          } else if (format === 'Excel') {
            const volumeData = lots.map(lot => ({
              'Lot Name': lot.name,
              'Initial Volume (gal)': lot.initial_volume_gallons?.toFixed(1) || '0',
              'Current Volume (gal)': lot.current_volume_gallons?.toFixed(1) || '0',
              'Volume Lost (gal)': ((lot.initial_volume_gallons || 0) - (lot.current_volume_gallons || 0)).toFixed(1),
              'Loss %': lot.initial_volume_gallons > 0
                ? (((lot.initial_volume_gallons - lot.current_volume_gallons) / lot.initial_volume_gallons) * 100).toFixed(1) + '%'
                : '0%'
            }));
            exportToExcel(volumeData, 'volume-tracking', 'Volume Tracking');
          }
          break;

        case 'production-timeline':
          if (format === 'PDF') generateProductionTimelinePDF(lots);
          break;

        case 'yield-analysis':
          if (format === 'PDF') generateYieldAnalysisPDF(lots);
          else if (format === 'Excel') generateYieldAnalysisExcel(lots);
          break;

        case 'vintage-comparison':
          if (format === 'PDF') generateVintageComparisonPDF(lots);
          else if (format === 'Excel') generateVintageComparisonExcel(lots);
          break;

        case 'varietal-performance':
          if (format === 'PDF') generateVarietalPerformancePDF(lots);
          else if (format === 'Excel') generateVarietalPerformanceExcel(lots);
          break;

        case 'fermentation-metrics':
          if (format === 'PDF') generateFermentationMetricsPDF(lots, fermentationLogs);
          else if (format === 'Excel') generateFermentationMetricsExcel(lots, fermentationLogs);
          break;

        case 'label-information':
          if (format === 'PDF') generateLabelInformationPDF(lots);
          else if (format === 'Excel') generateLabelInformationExcel(lots);
          break;

        case 'ttb-report':
          navigate('/production?view=ttb-report');
          break;

        case 'ttb-transactions':
          navigate('/production?view=ttb-transactions');
          break;

        case 'audit-trail':
          alert(`${reportId} export coming soon - requires additional data tracking`);
          break;

        default:
          alert(`Export for ${reportId} as ${format} not yet implemented`);
      }
    } catch (err) {
      console.error('Export error:', err);
      alert('Error generating export. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  const reportCategories = [
    {
      title: 'Inventory Reports',
      icon: Package,
      reports: [
        {
          id: 'current-inventory',
          name: 'Current Inventory',
          description: 'Snapshot of all lots, volumes, and containers',
          format: ['PDF', 'Excel', 'CSV']
        },
        {
          id: 'inventory-by-varietal',
          name: 'Inventory by Varietal',
          description: 'Breakdown of current stock by grape variety',
          format: ['PDF', 'Excel']
        },
        {
          id: 'inventory-by-vintage',
          name: 'Inventory by Vintage',
          description: 'Volume and lot count by vintage year',
          format: ['PDF', 'Excel']
        },
        {
          id: 'container-utilization',
          name: 'Container Utilization',
          description: 'Tank, barrel, and tote usage and capacity',
          format: ['PDF', 'Excel']
        }
      ]
    },
    {
      title: 'Production Reports',
      icon: Wine,
      reports: [
        {
          id: 'fermentation-log',
          name: 'Fermentation Log',
          description: 'Complete fermentation history with Brix, temp, pH',
          format: ['PDF', 'Excel', 'CSV']
        },
        {
          id: 'volume-tracking',
          name: 'Volume Tracking',
          description: 'Volume changes, transfers, and losses',
          format: ['PDF', 'Excel']
        },
        {
          id: 'production-timeline',
          name: 'Production Timeline',
          description: 'Lot status progression from harvest to bottling',
          format: ['PDF']
        },
        {
          id: 'yield-analysis',
          name: 'Yield Analysis',
          description: 'Grape to wine yields by varietal and vintage',
          format: ['PDF', 'Excel']
        }
      ]
    },
    {
      title: 'Analytics Reports',
      icon: BarChart3,
      reports: [
        {
          id: 'vintage-comparison',
          name: 'Vintage Comparison',
          description: 'Year-over-year production metrics',
          format: ['PDF', 'Excel']
        },
        {
          id: 'varietal-performance',
          name: 'Varietal Performance',
          description: 'Analysis of production by grape variety',
          format: ['PDF', 'Excel']
        },
        {
          id: 'fermentation-metrics',
          name: 'Fermentation Metrics',
          description: 'Average fermentation times, success rates',
          format: ['PDF', 'Excel']
        }
      ]
    },
    {
      title: 'Compliance & Labels',
      icon: FileText,
      reports: [
        {
          id: 'ttb-report',
          name: 'TTB Form 5120.17',
          description: 'Federal wine premises operations report',
          format: ['Open Generator'],
          isLink: true
        },
        {
          id: 'ttb-transactions',
          name: 'TTB Transaction Log',
          description: 'View all TTB-reportable transactions',
          format: ['View Log'],
          isLink: true
        },
        {
          id: 'label-information',
          name: 'Label Information',
          description: 'Lot details for wine label compliance',
          format: ['PDF', 'Excel']
        },
        {
          id: 'audit-trail',
          name: 'Audit Trail',
          description: 'Complete activity and change log',
          format: ['PDF', 'CSV']
        }
      ]
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#7C203A] animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading report data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="pt-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Generate and export production reports</p>
        </div>
        {exporting && (
          <div className="flex items-center gap-2 text-[#7C203A]">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">Generating export...</span>
          </div>
        )}
      </div>

      {/* Date Range Filter */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-5 h-5 text-[#7C203A]" />
          <h2 className="text-lg font-bold text-gray-900">Date Range</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {['all', '30-days', '90-days', '6-months', 'current-year', 'custom'].map(range => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 rounded-xl border transition-all text-sm font-medium ${
                dateRange === range
                  ? 'bg-[#7C203A] text-white border-[#7C203A]'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
              }`}
            >
              {range === 'all' ? 'All Time' :
               range === '30-days' ? 'Last 30 Days' :
               range === '90-days' ? 'Last 90 Days' :
               range === '6-months' ? 'Last 6 Months' :
               range === 'current-year' ? 'Current Year' :
               'Custom Range'}
            </button>
          ))}
        </div>
      </div>

      {/* Report Categories */}
      {reportCategories.map((category, catIndex) => {
        const CategoryIcon = category.icon;

        return (
          <div key={catIndex} className="bg-white p-6 rounded-2xl border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <CategoryIcon className="w-5 h-5 text-[#7C203A]" />
              <h2 className="text-lg font-bold text-gray-900">{category.title}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {category.reports.map(report => (
                <div
                  key={report.id}
                  className="p-5 rounded-xl border border-gray-100 hover:border-gray-200 transition-all"
                >
                  <div className="mb-4">
                    <h3 className="font-bold text-gray-900 mb-1">{report.name}</h3>
                    <p className="text-sm text-gray-500">{report.description}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {report.format.map(format => (
                      <button
                        key={format}
                        disabled={exporting}
                        className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                          report.isLink
                            ? 'bg-[#7C203A]/10 hover:bg-[#7C203A]/20 border-[#7C203A]/30 text-[#7C203A]'
                            : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700'
                        }`}
                        onClick={() => handleExport(report.id, format)}
                      >
                        {report.isLink ? <ExternalLink className="w-4 h-4" /> :
                         format === 'PDF' ? <FileText className="w-4 h-4" /> :
                         format === 'Excel' ? <FileSpreadsheet className="w-4 h-4" /> :
                         <Download className="w-4 h-4" />}
                        {format}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Quick Export Section */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-2xl border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <Download className="w-5 h-5 text-[#7C203A]" />
          <h2 className="text-lg font-bold text-gray-900">Quick Exports</h2>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Export all your data for backup or analysis
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            disabled={exporting}
            onClick={() => generateCurrentInventoryExcel(lots)}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export All Lots (Excel)
          </button>

          <button
            disabled={exporting}
            onClick={() => {
              const data = containers.map(c => ({
                'Name': c.name,
                'Type': c.type,
                'Capacity (gal)': c.capacity_gallons || 0,
                'Current Volume (gal)': c.current_volume_gallons || 0,
                'Material': c.material || '',
                'Location': c.location || ''
              }));
              exportToExcel(data, 'all-containers', 'Containers');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export All Containers (Excel)
          </button>

          <button
            disabled={exporting}
            onClick={() => generateFermentationLogCSV(fermentationLogs)}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText className="w-4 h-4" />
            Export Fermentation Logs (CSV)
          </button>

          <button
            disabled={exporting}
            onClick={() => {
              generateCurrentInventoryPDF(lots);
              setTimeout(() => generateInventoryByVarietalPDF(lots), 500);
              setTimeout(() => generateInventoryByVintagePDF(lots), 1000);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Printer className="w-4 h-4" />
            Print Key Reports (PDF)
          </button>
        </div>
      </div>
    </div>
  );
}
