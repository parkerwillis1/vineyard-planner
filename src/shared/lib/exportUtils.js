import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Export utilities for generating PDFs, Excel, and CSV files
 */

// ===== CSV EXPORTS =====

export function exportToCSV(data, filename) {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);

  // Build CSV content
  let csvContent = headers.join(',') + '\n';

  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header] ?? '';
      // Escape commas and quotes
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    csvContent += values.join(',') + '\n';
  });

  // Create download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ===== EXCEL EXPORTS (using HTML table method) =====

export function exportToExcel(data, filename, sheetName = 'Sheet1') {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  const headers = Object.keys(data[0]);

  // Build HTML table
  let htmlTable = '<table>';

  // Headers
  htmlTable += '<thead><tr>';
  headers.forEach(header => {
    htmlTable += `<th>${header}</th>`;
  });
  htmlTable += '</tr></thead>';

  // Rows
  htmlTable += '<tbody>';
  data.forEach(row => {
    htmlTable += '<tr>';
    headers.forEach(header => {
      htmlTable += `<td>${row[header] ?? ''}</td>`;
    });
    htmlTable += '</tr>';
  });
  htmlTable += '</tbody></table>';

  // Create Excel file using data URI
  const uri = 'data:application/vnd.ms-excel;base64,';
  const template = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>${sheetName}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
    <body>${htmlTable}</body>
    </html>`;

  const base64 = function(s) { return window.btoa(unescape(encodeURIComponent(s))); };

  const link = document.createElement('a');
  link.href = uri + base64(template);
  link.download = `${filename}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ===== PDF EXPORTS =====

export function exportToPDF(title, data, columns, filename) {
  const doc = new jsPDF();

  // Add title
  doc.setFontSize(18);
  doc.setTextColor(124, 32, 58); // Brand color #7C203A
  doc.text(title, 14, 22);

  // Add date
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

  // Add table using autoTable
  autoTable(doc, {
    head: [columns.map(col => col.header)],
    body: data.map(row => columns.map(col => row[col.dataKey] ?? '')),
    startY: 35,
    theme: 'grid',
    headStyles: {
      fillColor: [124, 32, 58], // Brand color
      textColor: 255,
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 9,
      cellPadding: 3
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250]
    }
  });

  // Save
  doc.save(`${filename}.pdf`);
}

// ===== SPECIFIC REPORT GENERATORS =====

export function generateCurrentInventoryPDF(lots) {
  const columns = [
    { header: 'Lot Name', dataKey: 'name' },
    { header: 'Varietal', dataKey: 'varietal' },
    { header: 'Vintage', dataKey: 'vintage' },
    { header: 'Volume (gal)', dataKey: 'current_volume_gallons' },
    { header: 'Status', dataKey: 'status' },
    { header: 'Container', dataKey: 'container_name' }
  ];

  const data = lots.map(lot => ({
    name: lot.name,
    varietal: lot.varietal,
    vintage: lot.vintage,
    current_volume_gallons: lot.current_volume_gallons?.toFixed(1) || '0',
    status: lot.status?.charAt(0).toUpperCase() + lot.status?.slice(1) || 'Unknown',
    container_name: lot.container_name || 'Unassigned'
  }));

  exportToPDF('Current Inventory Report', data, columns, 'current-inventory');
}

export function generateCurrentInventoryExcel(lots) {
  const data = lots.map(lot => ({
    'Lot Name': lot.name,
    'Varietal': lot.varietal,
    'Vintage': lot.vintage,
    'Volume (gal)': lot.current_volume_gallons?.toFixed(1) || '0',
    'Status': lot.status?.charAt(0).toUpperCase() + lot.status?.slice(1) || 'Unknown',
    'Container': lot.container_name || 'Unassigned',
    'Harvest Date': lot.harvest_date || 'N/A',
    'Current Brix': lot.current_brix?.toFixed(1) || 'N/A',
    'Current pH': lot.current_ph?.toFixed(2) || 'N/A'
  }));

  exportToExcel(data, 'current-inventory', 'Inventory');
}

export function generateCurrentInventoryCSV(lots) {
  const data = lots.map(lot => ({
    lot_name: lot.name,
    varietal: lot.varietal,
    vintage: lot.vintage,
    volume_gallons: lot.current_volume_gallons?.toFixed(1) || '0',
    status: lot.status,
    container: lot.container_name || 'Unassigned',
    harvest_date: lot.harvest_date || '',
    brix: lot.current_brix?.toFixed(1) || '',
    ph: lot.current_ph?.toFixed(2) || ''
  }));

  exportToCSV(data, 'current-inventory');
}

export function generateInventoryByVarietalPDF(lots) {
  // Group by varietal
  const varietalMap = {};
  lots.forEach(lot => {
    const varietal = lot.varietal || 'Unknown';
    if (!varietalMap[varietal]) {
      varietalMap[varietal] = { count: 0, volume: 0 };
    }
    varietalMap[varietal].count++;
    varietalMap[varietal].volume += (lot.current_volume_gallons || 0);
  });

  const data = Object.entries(varietalMap).map(([varietal, stats]) => ({
    varietal,
    count: stats.count,
    volume: stats.volume.toFixed(1),
    avg_lot_size: (stats.volume / stats.count).toFixed(1)
  }));

  const columns = [
    { header: 'Varietal', dataKey: 'varietal' },
    { header: 'Lots', dataKey: 'count' },
    { header: 'Total Volume (gal)', dataKey: 'volume' },
    { header: 'Avg Lot Size (gal)', dataKey: 'avg_lot_size' }
  ];

  exportToPDF('Inventory by Varietal', data, columns, 'inventory-by-varietal');
}

export function generateInventoryByVarietalExcel(lots) {
  const varietalMap = {};
  lots.forEach(lot => {
    const varietal = lot.varietal || 'Unknown';
    if (!varietalMap[varietal]) {
      varietalMap[varietal] = { count: 0, volume: 0 };
    }
    varietalMap[varietal].count++;
    varietalMap[varietal].volume += (lot.current_volume_gallons || 0);
  });

  const data = Object.entries(varietalMap).map(([varietal, stats]) => ({
    'Varietal': varietal,
    'Lots': stats.count,
    'Total Volume (gal)': stats.volume.toFixed(1),
    'Avg Lot Size (gal)': (stats.volume / stats.count).toFixed(1),
    'Percentage of Total': ((stats.volume / lots.reduce((sum, l) => sum + (l.current_volume_gallons || 0), 0)) * 100).toFixed(1) + '%'
  }));

  exportToExcel(data, 'inventory-by-varietal', 'By Varietal');
}

export function generateInventoryByVintagePDF(lots) {
  const vintageMap = {};
  lots.forEach(lot => {
    const vintage = lot.vintage || 'Unknown';
    if (!vintageMap[vintage]) {
      vintageMap[vintage] = { count: 0, volume: 0 };
    }
    vintageMap[vintage].count++;
    vintageMap[vintage].volume += (lot.current_volume_gallons || 0);
  });

  const data = Object.entries(vintageMap)
    .sort((a, b) => b[0] - a[0]) // Sort by vintage descending
    .map(([vintage, stats]) => ({
      vintage,
      count: stats.count,
      volume: stats.volume.toFixed(1)
    }));

  const columns = [
    { header: 'Vintage', dataKey: 'vintage' },
    { header: 'Lots', dataKey: 'count' },
    { header: 'Total Volume (gal)', dataKey: 'volume' }
  ];

  exportToPDF('Inventory by Vintage', data, columns, 'inventory-by-vintage');
}

export function generateInventoryByVintageExcel(lots) {
  const vintageMap = {};
  lots.forEach(lot => {
    const vintage = lot.vintage || 'Unknown';
    if (!vintageMap[vintage]) {
      vintageMap[vintage] = { count: 0, volume: 0 };
    }
    vintageMap[vintage].count++;
    vintageMap[vintage].volume += (lot.current_volume_gallons || 0);
  });

  const data = Object.entries(vintageMap)
    .sort((a, b) => b[0] - a[0])
    .map(([vintage, stats]) => ({
      'Vintage': vintage,
      'Lots': stats.count,
      'Total Volume (gal)': stats.volume.toFixed(1)
    }));

  exportToExcel(data, 'inventory-by-vintage', 'By Vintage');
}

export function generateFermentationLogPDF(fermentationLogs) {
  const columns = [
    { header: 'Lot Name', dataKey: 'lot_name' },
    { header: 'Date', dataKey: 'log_date' },
    { header: 'Brix', dataKey: 'brix' },
    { header: 'Temp (°F)', dataKey: 'temp_f' },
    { header: 'pH', dataKey: 'ph' },
    { header: 'TA', dataKey: 'ta' },
    { header: 'Notes', dataKey: 'notes' }
  ];

  const data = fermentationLogs.map(log => ({
    lot_name: log.lot_name || 'Unknown',
    log_date: new Date(log.log_date).toLocaleDateString(),
    brix: log.brix?.toFixed(1) || 'N/A',
    temp_f: log.temp_f?.toFixed(0) || 'N/A',
    ph: log.ph?.toFixed(2) || 'N/A',
    ta: log.ta?.toFixed(2) || 'N/A',
    notes: log.notes || ''
  }));

  exportToPDF('Fermentation Logs', data, columns, 'fermentation-logs');
}

export function generateContainerUtilizationPDF(containers) {
  const columns = [
    { header: 'Container Name', dataKey: 'name' },
    { header: 'Type', dataKey: 'type' },
    { header: 'Capacity (gal)', dataKey: 'capacity' },
    { header: 'Current Volume (gal)', dataKey: 'current' },
    { header: 'Utilization', dataKey: 'utilization' },
    { header: 'Status', dataKey: 'status' }
  ];

  const data = containers.map(c => ({
    name: c.name,
    type: c.type,
    capacity: c.capacity_gallons?.toFixed(0) || '0',
    current: c.current_volume_gallons?.toFixed(0) || '0',
    utilization: c.capacity_gallons > 0
      ? ((c.current_volume_gallons / c.capacity_gallons) * 100).toFixed(1) + '%'
      : '0%',
    status: c.current_volume_gallons > 0 ? 'In Use' : 'Empty'
  }));

  exportToPDF('Container Utilization Report', data, columns, 'container-utilization');
}

export function generateVolumeTrackingPDF(lots) {
  const columns = [
    { header: 'Lot Name', dataKey: 'name' },
    { header: 'Initial Volume (gal)', dataKey: 'initial' },
    { header: 'Current Volume (gal)', dataKey: 'current' },
    { header: 'Volume Lost (gal)', dataKey: 'lost' },
    { header: 'Loss %', dataKey: 'loss_pct' }
  ];

  const data = lots.map(lot => ({
    name: lot.name,
    initial: lot.initial_volume_gallons?.toFixed(1) || '0',
    current: lot.current_volume_gallons?.toFixed(1) || '0',
    lost: ((lot.initial_volume_gallons || 0) - (lot.current_volume_gallons || 0)).toFixed(1),
    loss_pct: lot.initial_volume_gallons > 0
      ? (((lot.initial_volume_gallons - lot.current_volume_gallons) / lot.initial_volume_gallons) * 100).toFixed(1) + '%'
      : '0%'
  }));

  exportToPDF('Volume Tracking Report', data, columns, 'volume-tracking');
}

export function generateFermentationLogCSV(fermentationLogs) {
  const data = fermentationLogs.map(log => ({
    lot_name: log.lot_name,
    log_date: log.log_date,
    brix: log.brix?.toFixed(1) || '',
    temp_f: log.temp_f?.toFixed(0) || '',
    temp_c: log.temp_c?.toFixed(1) || '',
    ph: log.ph?.toFixed(2) || '',
    ta: log.ta?.toFixed(2) || '',
    notes: log.notes || ''
  }));

  exportToCSV(data, 'fermentation-logs');
}

export function generateProductionTimelinePDF(lots) {
  const statusOrder = {
    'harvested': 1,
    'fermenting': 2,
    'pressing': 3,
    'aging': 4,
    'blending': 5,
    'bottling': 6,
    'bottled': 7,
    'archived': 8
  };

  const data = lots
    .map(lot => ({
      name: lot.name,
      varietal: lot.varietal,
      vintage: lot.vintage,
      status: lot.status?.charAt(0).toUpperCase() + lot.status?.slice(1) || 'Unknown',
      harvest_date: lot.harvest_date ? new Date(lot.harvest_date).toLocaleDateString() : 'N/A',
      days_in_production: lot.harvest_date
        ? Math.floor((new Date() - new Date(lot.harvest_date)) / (1000 * 60 * 60 * 24))
        : 0,
      statusOrder: statusOrder[lot.status] || 99
    }))
    .sort((a, b) => a.statusOrder - b.statusOrder);

  const columns = [
    { header: 'Lot Name', dataKey: 'name' },
    { header: 'Varietal', dataKey: 'varietal' },
    { header: 'Vintage', dataKey: 'vintage' },
    { header: 'Status', dataKey: 'status' },
    { header: 'Harvest Date', dataKey: 'harvest_date' },
    { header: 'Days in Production', dataKey: 'days_in_production' }
  ];

  exportToPDF('Production Timeline', data, columns, 'production-timeline');
}

export function generateYieldAnalysisPDF(lots) {
  const varietalYields = {};

  lots.forEach(lot => {
    const varietal = lot.varietal || 'Unknown';
    if (!varietalYields[varietal]) {
      varietalYields[varietal] = {
        totalVolume: 0,
        count: 0,
        avgYield: 0
      };
    }

    varietalYields[varietal].totalVolume += (lot.current_volume_gallons || 0);
    varietalYields[varietal].count++;
  });

  const data = Object.entries(varietalYields).map(([varietal, stats]) => ({
    varietal,
    total_volume: stats.totalVolume.toFixed(1),
    lot_count: stats.count,
    avg_yield: (stats.totalVolume / stats.count).toFixed(1)
  }));

  const columns = [
    { header: 'Varietal', dataKey: 'varietal' },
    { header: 'Total Volume (gal)', dataKey: 'total_volume' },
    { header: 'Lot Count', dataKey: 'lot_count' },
    { header: 'Avg Yield per Lot (gal)', dataKey: 'avg_yield' }
  ];

  exportToPDF('Yield Analysis by Varietal', data, columns, 'yield-analysis');
}

export function generateYieldAnalysisExcel(lots) {
  const varietalYields = {};

  lots.forEach(lot => {
    const varietal = lot.varietal || 'Unknown';
    if (!varietalYields[varietal]) {
      varietalYields[varietal] = {
        totalVolume: 0,
        count: 0
      };
    }

    varietalYields[varietal].totalVolume += (lot.current_volume_gallons || 0);
    varietalYields[varietal].count++;
  });

  const data = Object.entries(varietalYields).map(([varietal, stats]) => ({
    'Varietal': varietal,
    'Total Volume (gal)': stats.totalVolume.toFixed(1),
    'Lot Count': stats.count,
    'Avg Yield per Lot (gal)': (stats.totalVolume / stats.count).toFixed(1),
    'Total Bottles (750ml)': Math.floor(stats.totalVolume * 3.785 / 0.75)
  }));

  exportToExcel(data, 'yield-analysis', 'Yield Analysis');
}

export function generateVintageComparisonPDF(lots) {
  const vintageStats = {};

  lots.forEach(lot => {
    const vintage = lot.vintage || 'Unknown';
    if (!vintageStats[vintage]) {
      vintageStats[vintage] = {
        volume: 0,
        count: 0,
        varietals: new Set()
      };
    }

    vintageStats[vintage].volume += (lot.current_volume_gallons || 0);
    vintageStats[vintage].count++;
    if (lot.varietal) vintageStats[vintage].varietals.add(lot.varietal);
  });

  const data = Object.entries(vintageStats)
    .sort((a, b) => b[0] - a[0])
    .map(([vintage, stats]) => ({
      vintage,
      volume: stats.volume.toFixed(1),
      lots: stats.count,
      varietals: stats.varietals.size,
      avg_lot_size: (stats.volume / stats.count).toFixed(1)
    }));

  const columns = [
    { header: 'Vintage', dataKey: 'vintage' },
    { header: 'Total Volume (gal)', dataKey: 'volume' },
    { header: 'Lots', dataKey: 'lots' },
    { header: 'Varietals', dataKey: 'varietals' },
    { header: 'Avg Lot Size (gal)', dataKey: 'avg_lot_size' }
  ];

  exportToPDF('Vintage Comparison', data, columns, 'vintage-comparison');
}

export function generateVintageComparisonExcel(lots) {
  const vintageStats = {};

  lots.forEach(lot => {
    const vintage = lot.vintage || 'Unknown';
    if (!vintageStats[vintage]) {
      vintageStats[vintage] = {
        volume: 0,
        count: 0,
        varietals: new Set()
      };
    }

    vintageStats[vintage].volume += (lot.current_volume_gallons || 0);
    vintageStats[vintage].count++;
    if (lot.varietal) vintageStats[vintage].varietals.add(lot.varietal);
  });

  const data = Object.entries(vintageStats)
    .sort((a, b) => b[0] - a[0])
    .map(([vintage, stats]) => ({
      'Vintage': vintage,
      'Total Volume (gal)': stats.volume.toFixed(1),
      'Lots': stats.count,
      'Varietals': stats.varietals.size,
      'Avg Lot Size (gal)': (stats.volume / stats.count).toFixed(1)
    }));

  exportToExcel(data, 'vintage-comparison', 'Vintage Comparison');
}

export function generateVarietalPerformancePDF(lots) {
  const varietalStats = {};

  lots.forEach(lot => {
    const varietal = lot.varietal || 'Unknown';
    if (!varietalStats[varietal]) {
      varietalStats[varietal] = {
        volume: 0,
        count: 0,
        initialVolume: 0,
        currentVolume: 0
      };
    }

    varietalStats[varietal].volume += (lot.current_volume_gallons || 0);
    varietalStats[varietal].count++;
    varietalStats[varietal].initialVolume += (lot.initial_volume_gallons || 0);
    varietalStats[varietal].currentVolume += (lot.current_volume_gallons || 0);
  });

  const data = Object.entries(varietalStats).map(([varietal, stats]) => ({
    varietal,
    lots: stats.count,
    volume: stats.volume.toFixed(1),
    loss: (stats.initialVolume - stats.currentVolume).toFixed(1),
    loss_pct: stats.initialVolume > 0
      ? (((stats.initialVolume - stats.currentVolume) / stats.initialVolume) * 100).toFixed(1) + '%'
      : '0%'
  }));

  const columns = [
    { header: 'Varietal', dataKey: 'varietal' },
    { header: 'Lots', dataKey: 'lots' },
    { header: 'Current Volume (gal)', dataKey: 'volume' },
    { header: 'Volume Loss (gal)', dataKey: 'loss' },
    { header: 'Loss %', dataKey: 'loss_pct' }
  ];

  exportToPDF('Varietal Performance Analysis', data, columns, 'varietal-performance');
}

export function generateVarietalPerformanceExcel(lots) {
  const varietalStats = {};

  lots.forEach(lot => {
    const varietal = lot.varietal || 'Unknown';
    if (!varietalStats[varietal]) {
      varietalStats[varietal] = {
        volume: 0,
        count: 0,
        initialVolume: 0,
        currentVolume: 0
      };
    }

    varietalStats[varietal].volume += (lot.current_volume_gallons || 0);
    varietalStats[varietal].count++;
    varietalStats[varietal].initialVolume += (lot.initial_volume_gallons || 0);
    varietalStats[varietal].currentVolume += (lot.current_volume_gallons || 0);
  });

  const data = Object.entries(varietalStats).map(([varietal, stats]) => ({
    'Varietal': varietal,
    'Lots': stats.count,
    'Current Volume (gal)': stats.volume.toFixed(1),
    'Initial Volume (gal)': stats.initialVolume.toFixed(1),
    'Volume Loss (gal)': (stats.initialVolume - stats.currentVolume).toFixed(1),
    'Loss %': stats.initialVolume > 0
      ? (((stats.initialVolume - stats.currentVolume) / stats.initialVolume) * 100).toFixed(1) + '%'
      : '0%'
  }));

  exportToExcel(data, 'varietal-performance', 'Varietal Performance');
}

export function generateFermentationMetricsPDF(lots, fermentationLogs) {
  // Calculate metrics per lot
  const lotMetrics = {};

  fermentationLogs.forEach(log => {
    const lotId = log.lot_id || log.lot_name;
    if (!lotMetrics[lotId]) {
      lotMetrics[lotId] = {
        name: log.lot_name,
        logCount: 0,
        avgBrix: 0,
        avgTemp: 0,
        avgPH: 0,
        brixSum: 0,
        tempSum: 0,
        phSum: 0
      };
    }

    lotMetrics[lotId].logCount++;
    if (log.brix) lotMetrics[lotId].brixSum += log.brix;
    if (log.temp_f) lotMetrics[lotId].tempSum += log.temp_f;
    if (log.ph) lotMetrics[lotId].phSum += log.ph;
  });

  const data = Object.values(lotMetrics).map(metric => ({
    lot_name: metric.name,
    log_count: metric.logCount,
    avg_brix: metric.logCount > 0 ? (metric.brixSum / metric.logCount).toFixed(1) : 'N/A',
    avg_temp: metric.logCount > 0 ? (metric.tempSum / metric.logCount).toFixed(1) : 'N/A',
    avg_ph: metric.logCount > 0 ? (metric.phSum / metric.logCount).toFixed(2) : 'N/A'
  }));

  const columns = [
    { header: 'Lot Name', dataKey: 'lot_name' },
    { header: 'Log Entries', dataKey: 'log_count' },
    { header: 'Avg Brix', dataKey: 'avg_brix' },
    { header: 'Avg Temp (°F)', dataKey: 'avg_temp' },
    { header: 'Avg pH', dataKey: 'avg_ph' }
  ];

  exportToPDF('Fermentation Metrics', data, columns, 'fermentation-metrics');
}

export function generateFermentationMetricsExcel(lots, fermentationLogs) {
  const lotMetrics = {};

  fermentationLogs.forEach(log => {
    const lotId = log.lot_id || log.lot_name;
    if (!lotMetrics[lotId]) {
      lotMetrics[lotId] = {
        name: log.lot_name,
        logCount: 0,
        brixSum: 0,
        tempSum: 0,
        phSum: 0,
        taSum: 0
      };
    }

    lotMetrics[lotId].logCount++;
    if (log.brix) lotMetrics[lotId].brixSum += log.brix;
    if (log.temp_f) lotMetrics[lotId].tempSum += log.temp_f;
    if (log.ph) lotMetrics[lotId].phSum += log.ph;
    if (log.ta) lotMetrics[lotId].taSum += log.ta;
  });

  const data = Object.values(lotMetrics).map(metric => ({
    'Lot Name': metric.name,
    'Log Entries': metric.logCount,
    'Avg Brix': metric.logCount > 0 ? (metric.brixSum / metric.logCount).toFixed(1) : 'N/A',
    'Avg Temp (°F)': metric.logCount > 0 ? (metric.tempSum / metric.logCount).toFixed(1) : 'N/A',
    'Avg pH': metric.logCount > 0 ? (metric.phSum / metric.logCount).toFixed(2) : 'N/A',
    'Avg TA': metric.logCount > 0 ? (metric.taSum / metric.logCount).toFixed(2) : 'N/A'
  }));

  exportToExcel(data, 'fermentation-metrics', 'Fermentation Metrics');
}

export function generateLabelInformationPDF(lots) {
  const data = lots.map(lot => ({
    name: lot.name,
    varietal: lot.varietal,
    vintage: lot.vintage,
    volume_gal: lot.current_volume_gallons?.toFixed(1) || '0',
    volume_bottles: Math.floor((lot.current_volume_gallons || 0) * 3.785 / 0.75),
    harvest_date: lot.harvest_date ? new Date(lot.harvest_date).toLocaleDateString() : 'N/A',
    alcohol: lot.alcohol_pct?.toFixed(1) + '%' || 'TBD'
  }));

  const columns = [
    { header: 'Lot Name', dataKey: 'name' },
    { header: 'Varietal', dataKey: 'varietal' },
    { header: 'Vintage', dataKey: 'vintage' },
    { header: 'Volume (gal)', dataKey: 'volume_gal' },
    { header: 'Est. Bottles (750ml)', dataKey: 'volume_bottles' },
    { header: 'Harvest Date', dataKey: 'harvest_date' },
    { header: 'ABV', dataKey: 'alcohol' }
  ];

  exportToPDF('Label Information Report', data, columns, 'label-information');
}

export function generateLabelInformationExcel(lots) {
  const data = lots.map(lot => ({
    'Lot Name': lot.name,
    'Varietal': lot.varietal,
    'Vintage': lot.vintage,
    'Volume (gal)': lot.current_volume_gallons?.toFixed(1) || '0',
    'Est. Bottles (750ml)': Math.floor((lot.current_volume_gallons || 0) * 3.785 / 0.75),
    'Harvest Date': lot.harvest_date ? new Date(lot.harvest_date).toLocaleDateString() : 'N/A',
    'ABV': lot.alcohol_pct?.toFixed(1) + '%' || 'TBD',
    'pH': lot.current_ph?.toFixed(2) || 'N/A',
    'TA': lot.current_ta?.toFixed(2) || 'N/A'
  }));

  exportToExcel(data, 'label-information', 'Label Info');
}
