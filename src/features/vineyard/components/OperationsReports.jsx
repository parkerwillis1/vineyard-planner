import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Grape,
  BarChart3,
  Package,
  Droplet,
  FileSpreadsheet,
  Printer,
  Loader2,
  Wind,
  Users,
  Wrench,
  ClipboardList,
  Tractor,
  DollarSign
} from 'lucide-react';
import {
  listVineyardBlocks,
  listSprayApplications,
  listLaborLogs,
  listInventoryItems,
  listInventoryTransactions,
  listFieldYieldHistory
} from '@/shared/lib/vineyardApi';
import { listIrrigationEvents } from '@/shared/lib/irrigationApi';
import { supabase } from '@/shared/lib/supabaseClient';
import { useAuth } from '@/auth/AuthContext';
import { exportToCSV, exportToExcel } from '@/shared/lib/exportUtils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LoadingSpinner } from './LoadingSpinner';

export function OperationsReports() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState('all');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Data
  const [blocks, setBlocks] = useState([]);
  const [sprayRecords, setSprayRecords] = useState([]);
  const [laborLogs, setLaborLogs] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [inventoryTransactions, setInventoryTransactions] = useState([]);
  const [irrigationEvents, setIrrigationEvents] = useState([]);
  const [yieldHistory, setYieldHistory] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [equipment, setEquipment] = useState([]);

  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData() {
    if (!user) return;
    setLoading(true);

    try {
      const [
        blocksRes,
        sprayRes,
        laborRes,
        inventoryRes,
        transactionsRes,
        irrigationRes,
        yieldRes
      ] = await Promise.all([
        listVineyardBlocks(),
        listSprayApplications(),
        listLaborLogs({}),
        listInventoryItems(),
        listInventoryTransactions(null, 1000),
        listIrrigationEvents(),
        listFieldYieldHistory(null, new Date().getFullYear())
      ]);

      if (!blocksRes.error) setBlocks(blocksRes.data || []);
      if (!sprayRes.error) setSprayRecords(sprayRes.data || []);
      if (!laborRes.error) setLaborLogs(laborRes.data || []);
      if (!inventoryRes.error) setInventoryItems(inventoryRes.data || []);
      if (!transactionsRes.error) setInventoryTransactions(transactionsRes.data || []);
      if (!irrigationRes.error) setIrrigationEvents(irrigationRes.data || []);
      if (!yieldRes.error) setYieldHistory(yieldRes.data || []);

      // Load tasks from localStorage (or Supabase if available)
      const storedTasks = JSON.parse(localStorage.getItem(`vineyard_tasks_${user.id}`) || '[]');
      setTasks(storedTasks);

      // Load equipment
      const { data: equipData } = await supabase
        .from('equipment')
        .select('*')
        .eq('user_id', user.id);
      setEquipment(equipData || []);

    } catch (err) {
      console.error('Error loading report data:', err);
    } finally {
      setLoading(false);
    }
  }

  // ===== PDF GENERATION HELPERS =====

  function createPDF(title, subtitle = '') {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(28, 39, 57); // Dark navy
    doc.text(title, 14, 20);
    if (subtitle) {
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(subtitle, 14, 28);
    }
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Generated ${new Date().toLocaleDateString()} | Trellis Vineyard Management`, 14, doc.internal.pageSize.height - 10);
    return doc;
  }

  // ===== EXPORT HANDLERS =====

  async function handleExport(reportId, format) {
    setExporting(true);
    try {
      switch (reportId) {
        // VINEYARD REPORTS
        case 'field-summary':
          if (format === 'PDF') {
            const doc = createPDF('Field Summary Report', `${blocks.length} fields`);
            autoTable(doc, {
              startY: 35,
              head: [['Field Name', 'Varietal', 'Acres', 'Vines', 'Row Spacing', 'Vine Spacing']],
              body: blocks.map(b => [
                b.name || '',
                b.varietal || '',
                b.acres?.toFixed(2) || '0',
                b.vine_count || '',
                b.row_spacing_ft ? `${b.row_spacing_ft} ft` : '',
                b.vine_spacing_ft ? `${b.vine_spacing_ft} ft` : ''
              ]),
              theme: 'striped',
              headStyles: { fillColor: [28, 39, 57] }
            });
            doc.save('field-summary.pdf');
          } else if (format === 'Excel') {
            const data = blocks.map(b => ({
              'Field Name': b.name || '',
              'Varietal': b.varietal || '',
              'Acres': b.acres?.toFixed(2) || '0',
              'Vine Count': b.vine_count || '',
              'Row Spacing (ft)': b.row_spacing_ft || '',
              'Vine Spacing (ft)': b.vine_spacing_ft || '',
              'Rootstock': b.rootstock || '',
              'Year Planted': b.year_planted || ''
            }));
            exportToExcel(data, 'field-summary', 'Fields');
          } else if (format === 'CSV') {
            const data = blocks.map(b => ({
              'Field Name': b.name || '',
              'Varietal': b.varietal || '',
              'Acres': b.acres?.toFixed(2) || '0',
              'Vine Count': b.vine_count || '',
              'Rootstock': b.rootstock || ''
            }));
            exportToCSV(data, 'field-summary');
          }
          break;

        case 'varietal-breakdown':
          const varietalData = {};
          blocks.forEach(b => {
            const varietal = b.varietal || 'Unknown';
            if (!varietalData[varietal]) {
              varietalData[varietal] = { acres: 0, vines: 0, fields: 0 };
            }
            varietalData[varietal].acres += b.acres || 0;
            varietalData[varietal].vines += b.vine_count || 0;
            varietalData[varietal].fields += 1;
          });

          if (format === 'PDF') {
            const doc = createPDF('Varietal Breakdown', `${Object.keys(varietalData).length} varietals`);
            autoTable(doc, {
              startY: 35,
              head: [['Varietal', 'Total Acres', 'Total Vines', 'Fields']],
              body: Object.entries(varietalData).map(([name, data]) => [
                name,
                data.acres.toFixed(2),
                data.vines.toLocaleString(),
                data.fields
              ]),
              theme: 'striped',
              headStyles: { fillColor: [28, 39, 57] }
            });
            doc.save('varietal-breakdown.pdf');
          } else if (format === 'Excel') {
            const data = Object.entries(varietalData).map(([name, d]) => ({
              'Varietal': name,
              'Total Acres': d.acres.toFixed(2),
              'Total Vines': d.vines,
              'Number of Fields': d.fields
            }));
            exportToExcel(data, 'varietal-breakdown', 'Varietals');
          }
          break;

        // SPRAY REPORTS
        case 'spray-log':
          if (format === 'PDF') {
            const doc = createPDF('Spray Application Log', `${sprayRecords.length} applications`);
            autoTable(doc, {
              startY: 35,
              head: [['Date', 'Field', 'Product', 'Rate', 'Method', 'Applicator']],
              body: sprayRecords.map(s => [
                s.application_date ? new Date(s.application_date).toLocaleDateString() : '',
                s.vineyard_blocks?.name || s.block_name || '',
                s.product_name || '',
                s.application_rate ? `${s.application_rate} ${s.rate_unit || ''}` : '',
                s.application_method || '',
                s.applicator_name || ''
              ]),
              theme: 'striped',
              headStyles: { fillColor: [28, 39, 57] }
            });
            doc.save('spray-log.pdf');
          } else if (format === 'Excel') {
            const data = sprayRecords.map(s => ({
              'Date': s.application_date ? new Date(s.application_date).toLocaleDateString() : '',
              'Field': s.vineyard_blocks?.name || s.block_name || '',
              'Product': s.product_name || '',
              'Rate': s.application_rate || '',
              'Rate Unit': s.rate_unit || '',
              'Method': s.application_method || '',
              'Target Pest/Disease': s.target_pest || '',
              'Applicator': s.applicator_name || '',
              'REI (hours)': s.rei_hours || '',
              'PHI (days)': s.phi_days || '',
              'Notes': s.notes || ''
            }));
            exportToExcel(data, 'spray-log', 'Spray Applications');
          } else if (format === 'CSV') {
            const data = sprayRecords.map(s => ({
              'Date': s.application_date || '',
              'Field': s.vineyard_blocks?.name || s.block_name || '',
              'Product': s.product_name || '',
              'Rate': s.application_rate || '',
              'Method': s.application_method || ''
            }));
            exportToCSV(data, 'spray-log');
          }
          break;

        case 'chemical-usage':
          const chemicalData = {};
          sprayRecords.forEach(s => {
            const product = s.product_name || 'Unknown';
            if (!chemicalData[product]) {
              chemicalData[product] = { applications: 0, totalAmount: 0 };
            }
            chemicalData[product].applications += 1;
            chemicalData[product].totalAmount += parseFloat(s.application_rate) || 0;
          });

          if (format === 'PDF') {
            const doc = createPDF('Chemical Usage Summary', `${Object.keys(chemicalData).length} products used`);
            autoTable(doc, {
              startY: 35,
              head: [['Product', 'Applications', 'Total Amount Used']],
              body: Object.entries(chemicalData).map(([name, data]) => [
                name,
                data.applications,
                data.totalAmount.toFixed(2)
              ]),
              theme: 'striped',
              headStyles: { fillColor: [28, 39, 57] }
            });
            doc.save('chemical-usage.pdf');
          } else if (format === 'Excel') {
            const data = Object.entries(chemicalData).map(([name, d]) => ({
              'Product': name,
              'Number of Applications': d.applications,
              'Total Amount Used': d.totalAmount.toFixed(2)
            }));
            exportToExcel(data, 'chemical-usage', 'Chemical Usage');
          }
          break;

        // IRRIGATION REPORTS
        case 'irrigation-log':
          if (format === 'PDF') {
            const doc = createPDF('Irrigation Log', `${irrigationEvents.length} events`);
            autoTable(doc, {
              startY: 35,
              head: [['Date', 'Field', 'Duration (hrs)', 'Water (gal)', 'Method', 'Source']],
              body: irrigationEvents.map(e => [
                e.event_date ? new Date(e.event_date).toLocaleDateString() : '',
                e.vineyard_blocks?.name || '',
                e.duration_hours?.toFixed(1) || '',
                e.total_water_gallons?.toLocaleString() || '',
                e.irrigation_method || '',
                e.source || ''
              ]),
              theme: 'striped',
              headStyles: { fillColor: [28, 39, 57] }
            });
            doc.save('irrigation-log.pdf');
          } else if (format === 'Excel') {
            const data = irrigationEvents.map(e => ({
              'Date': e.event_date ? new Date(e.event_date).toLocaleDateString() : '',
              'Field': e.vineyard_blocks?.name || '',
              'Duration (hours)': e.duration_hours || '',
              'Water Used (gallons)': e.total_water_gallons || '',
              'Method': e.irrigation_method || '',
              'Source': e.source || '',
              'Flow Rate (GPM)': e.flow_rate_gpm || '',
              'Notes': e.notes || ''
            }));
            exportToExcel(data, 'irrigation-log', 'Irrigation Events');
          } else if (format === 'CSV') {
            const data = irrigationEvents.map(e => ({
              'Date': e.event_date || '',
              'Field': e.vineyard_blocks?.name || '',
              'Duration': e.duration_hours || '',
              'Water Gallons': e.total_water_gallons || ''
            }));
            exportToCSV(data, 'irrigation-log');
          }
          break;

        case 'water-usage':
          const waterByField = {};
          irrigationEvents.forEach(e => {
            const field = e.vineyard_blocks?.name || 'Unknown';
            if (!waterByField[field]) {
              waterByField[field] = { events: 0, totalWater: 0, totalHours: 0 };
            }
            waterByField[field].events += 1;
            waterByField[field].totalWater += e.total_water_gallons || 0;
            waterByField[field].totalHours += e.duration_hours || 0;
          });

          if (format === 'PDF') {
            const doc = createPDF('Water Usage by Field');
            autoTable(doc, {
              startY: 35,
              head: [['Field', 'Events', 'Total Water (gal)', 'Total Hours']],
              body: Object.entries(waterByField).map(([name, data]) => [
                name,
                data.events,
                data.totalWater.toLocaleString(),
                data.totalHours.toFixed(1)
              ]),
              theme: 'striped',
              headStyles: { fillColor: [28, 39, 57] }
            });
            doc.save('water-usage.pdf');
          } else if (format === 'Excel') {
            const data = Object.entries(waterByField).map(([name, d]) => ({
              'Field': name,
              'Irrigation Events': d.events,
              'Total Water (gallons)': d.totalWater,
              'Total Hours': d.totalHours.toFixed(1)
            }));
            exportToExcel(data, 'water-usage', 'Water Usage');
          }
          break;

        // HARVEST REPORTS
        case 'harvest-summary':
          if (format === 'PDF') {
            const doc = createPDF('Harvest Summary', `${yieldHistory.length} records`);
            autoTable(doc, {
              startY: 35,
              head: [['Year', 'Field', 'Varietal', 'Tons', 'Brix', 'Tons/Acre']],
              body: yieldHistory.map(h => [
                h.year || '',
                h.vineyard_blocks?.name || h.block_name || '',
                h.vineyard_blocks?.varietal || '',
                h.tons_harvested?.toFixed(2) || '',
                h.avg_brix?.toFixed(1) || '',
                h.tons_per_acre?.toFixed(2) || ''
              ]),
              theme: 'striped',
              headStyles: { fillColor: [28, 39, 57] }
            });
            doc.save('harvest-summary.pdf');
          } else if (format === 'Excel') {
            const data = yieldHistory.map(h => ({
              'Year': h.year || '',
              'Field': h.vineyard_blocks?.name || h.block_name || '',
              'Varietal': h.vineyard_blocks?.varietal || '',
              'Tons Harvested': h.tons_harvested || '',
              'Average Brix': h.avg_brix || '',
              'Tons/Acre': h.tons_per_acre || '',
              'Notes': h.notes || ''
            }));
            exportToExcel(data, 'harvest-summary', 'Harvest Data');
          } else if (format === 'CSV') {
            const data = yieldHistory.map(h => ({
              'Year': h.year || '',
              'Field': h.vineyard_blocks?.name || '',
              'Tons': h.tons_harvested || '',
              'Brix': h.avg_brix || ''
            }));
            exportToCSV(data, 'harvest-summary');
          }
          break;

        // LABOR REPORTS
        case 'labor-summary':
          if (format === 'PDF') {
            const doc = createPDF('Labor Summary', `${laborLogs.length} entries`);
            autoTable(doc, {
              startY: 35,
              head: [['Date', 'Worker', 'Task Type', 'Hours', 'Cost']],
              body: laborLogs.map(l => [
                l.work_date ? new Date(l.work_date).toLocaleDateString() : '',
                l.worker_name || '',
                l.task_type || '',
                l.hours_worked?.toFixed(1) || '',
                l.total_cost ? `$${l.total_cost.toFixed(2)}` : ''
              ]),
              theme: 'striped',
              headStyles: { fillColor: [28, 39, 57] }
            });
            doc.save('labor-summary.pdf');
          } else if (format === 'Excel') {
            const data = laborLogs.map(l => ({
              'Date': l.work_date ? new Date(l.work_date).toLocaleDateString() : '',
              'Worker': l.worker_name || '',
              'Task Type': l.task_type || '',
              'Field': l.vineyard_blocks?.name || '',
              'Hours Worked': l.hours_worked || '',
              'Hourly Rate': l.hourly_rate || '',
              'Total Cost': l.total_cost || '',
              'Notes': l.notes || ''
            }));
            exportToExcel(data, 'labor-summary', 'Labor Log');
          } else if (format === 'CSV') {
            const data = laborLogs.map(l => ({
              'Date': l.work_date || '',
              'Worker': l.worker_name || '',
              'Task': l.task_type || '',
              'Hours': l.hours_worked || '',
              'Cost': l.total_cost || ''
            }));
            exportToCSV(data, 'labor-summary');
          }
          break;

        case 'labor-by-task':
          const laborByTask = {};
          laborLogs.forEach(l => {
            const task = l.task_type || 'General';
            if (!laborByTask[task]) {
              laborByTask[task] = { entries: 0, totalHours: 0, totalCost: 0 };
            }
            laborByTask[task].entries += 1;
            laborByTask[task].totalHours += l.hours_worked || 0;
            laborByTask[task].totalCost += l.total_cost || 0;
          });

          if (format === 'PDF') {
            const doc = createPDF('Labor Costs by Task Type');
            autoTable(doc, {
              startY: 35,
              head: [['Task Type', 'Entries', 'Total Hours', 'Total Cost']],
              body: Object.entries(laborByTask).map(([name, data]) => [
                name,
                data.entries,
                data.totalHours.toFixed(1),
                `$${data.totalCost.toFixed(2)}`
              ]),
              theme: 'striped',
              headStyles: { fillColor: [28, 39, 57] }
            });
            doc.save('labor-by-task.pdf');
          } else if (format === 'Excel') {
            const data = Object.entries(laborByTask).map(([name, d]) => ({
              'Task Type': name,
              'Number of Entries': d.entries,
              'Total Hours': d.totalHours.toFixed(1),
              'Total Cost': d.totalCost.toFixed(2)
            }));
            exportToExcel(data, 'labor-by-task', 'Labor by Task');
          }
          break;

        // INVENTORY REPORTS
        case 'inventory-current':
          if (format === 'PDF') {
            const doc = createPDF('Current Inventory', `${inventoryItems.length} items`);
            autoTable(doc, {
              startY: 35,
              head: [['Item', 'Category', 'Quantity', 'Unit', 'Unit Cost', 'Total Value']],
              body: inventoryItems.map(i => [
                i.name || '',
                i.category || '',
                i.quantity || 0,
                i.unit || '',
                i.unit_cost ? `$${i.unit_cost.toFixed(2)}` : '',
                i.quantity && i.unit_cost ? `$${(i.quantity * i.unit_cost).toFixed(2)}` : ''
              ]),
              theme: 'striped',
              headStyles: { fillColor: [28, 39, 57] }
            });
            doc.save('inventory-current.pdf');
          } else if (format === 'Excel') {
            const data = inventoryItems.map(i => ({
              'Item Name': i.name || '',
              'Category': i.category || '',
              'Quantity': i.quantity || 0,
              'Unit': i.unit || '',
              'Unit Cost': i.unit_cost || '',
              'Total Value': i.quantity && i.unit_cost ? (i.quantity * i.unit_cost).toFixed(2) : '',
              'Reorder Point': i.reorder_point || '',
              'Supplier': i.supplier || ''
            }));
            exportToExcel(data, 'inventory-current', 'Inventory');
          } else if (format === 'CSV') {
            const data = inventoryItems.map(i => ({
              'Item': i.name || '',
              'Category': i.category || '',
              'Quantity': i.quantity || 0,
              'Unit': i.unit || ''
            }));
            exportToCSV(data, 'inventory-current');
          }
          break;

        case 'inventory-transactions':
          if (format === 'PDF') {
            const doc = createPDF('Inventory Transactions', `${inventoryTransactions.length} transactions`);
            autoTable(doc, {
              startY: 35,
              head: [['Date', 'Item', 'Type', 'Quantity', 'Notes']],
              body: inventoryTransactions.slice(0, 100).map(t => [
                t.transaction_date ? new Date(t.transaction_date).toLocaleDateString() : '',
                t.inventory_items?.name || '',
                t.transaction_type || '',
                t.quantity || 0,
                t.notes || ''
              ]),
              theme: 'striped',
              headStyles: { fillColor: [28, 39, 57] }
            });
            doc.save('inventory-transactions.pdf');
          } else if (format === 'Excel') {
            const data = inventoryTransactions.map(t => ({
              'Date': t.transaction_date ? new Date(t.transaction_date).toLocaleDateString() : '',
              'Item': t.inventory_items?.name || '',
              'Transaction Type': t.transaction_type || '',
              'Quantity': t.quantity || 0,
              'Reference': t.reference || '',
              'Notes': t.notes || ''
            }));
            exportToExcel(data, 'inventory-transactions', 'Transactions');
          } else if (format === 'CSV') {
            const data = inventoryTransactions.map(t => ({
              'Date': t.transaction_date || '',
              'Item': t.inventory_items?.name || '',
              'Type': t.transaction_type || '',
              'Quantity': t.quantity || 0
            }));
            exportToCSV(data, 'inventory-transactions');
          }
          break;

        // EQUIPMENT REPORTS
        case 'equipment-list':
          if (format === 'PDF') {
            const doc = createPDF('Equipment Inventory', `${equipment.length} items`);
            autoTable(doc, {
              startY: 35,
              head: [['Name', 'Type', 'Make/Model', 'Year', 'Status', 'Value']],
              body: equipment.map(e => [
                e.name || '',
                e.equipment_type || '',
                `${e.make || ''} ${e.model || ''}`.trim(),
                e.year || '',
                e.status || '',
                e.purchase_price ? `$${e.purchase_price.toLocaleString()}` : ''
              ]),
              theme: 'striped',
              headStyles: { fillColor: [28, 39, 57] }
            });
            doc.save('equipment-list.pdf');
          } else if (format === 'Excel') {
            const data = equipment.map(e => ({
              'Name': e.name || '',
              'Type': e.equipment_type || '',
              'Make': e.make || '',
              'Model': e.model || '',
              'Year': e.year || '',
              'Serial Number': e.serial_number || '',
              'Status': e.status || '',
              'Purchase Price': e.purchase_price || '',
              'Purchase Date': e.purchase_date || '',
              'Notes': e.notes || ''
            }));
            exportToExcel(data, 'equipment-list', 'Equipment');
          }
          break;

        // TASK REPORTS
        case 'task-summary':
          if (format === 'PDF') {
            const doc = createPDF('Task Summary', `${tasks.length} tasks`);
            autoTable(doc, {
              startY: 35,
              head: [['Task', 'Type', 'Due Date', 'Priority', 'Status', 'Assigned To']],
              body: tasks.slice(0, 100).map(t => [
                t.title || '',
                t.taskType || '',
                t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '',
                t.priority || '',
                t.completed ? 'Completed' : 'Pending',
                t.assignedTo || ''
              ]),
              theme: 'striped',
              headStyles: { fillColor: [28, 39, 57] }
            });
            doc.save('task-summary.pdf');
          } else if (format === 'Excel') {
            const data = tasks.map(t => ({
              'Task': t.title || '',
              'Type': t.taskType || '',
              'Description': t.description || '',
              'Due Date': t.dueDate || '',
              'Priority': t.priority || '',
              'Status': t.completed ? 'Completed' : 'Pending',
              'Assigned To': t.assignedTo || '',
              'Field': t.block || ''
            }));
            exportToExcel(data, 'task-summary', 'Tasks');
          } else if (format === 'CSV') {
            const data = tasks.map(t => ({
              'Task': t.title || '',
              'Type': t.taskType || '',
              'Due Date': t.dueDate || '',
              'Status': t.completed ? 'Completed' : 'Pending'
            }));
            exportToCSV(data, 'task-summary');
          }
          break;

        default:
          alert(`Export for ${reportId} not yet implemented`);
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
      title: 'Vineyard Reports',
      icon: Grape,
      reports: [
        {
          id: 'field-summary',
          name: 'Field Summary',
          description: 'All fields with varietals, acreage, and planting details',
          format: ['PDF', 'Excel', 'CSV']
        },
        {
          id: 'varietal-breakdown',
          name: 'Varietal Breakdown',
          description: 'Acreage and vine counts by grape variety',
          format: ['PDF', 'Excel']
        }
      ]
    },
    {
      title: 'Spray Records',
      icon: Wind,
      reports: [
        {
          id: 'spray-log',
          name: 'Spray Application Log',
          description: 'Complete history of all spray applications',
          format: ['PDF', 'Excel', 'CSV']
        },
        {
          id: 'chemical-usage',
          name: 'Chemical Usage Summary',
          description: 'Total usage by product with application counts',
          format: ['PDF', 'Excel']
        }
      ]
    },
    {
      title: 'Irrigation Reports',
      icon: Droplet,
      reports: [
        {
          id: 'irrigation-log',
          name: 'Irrigation Log',
          description: 'All irrigation events with duration and volume',
          format: ['PDF', 'Excel', 'CSV']
        },
        {
          id: 'water-usage',
          name: 'Water Usage by Field',
          description: 'Total water consumption summarized by field',
          format: ['PDF', 'Excel']
        }
      ]
    },
    {
      title: 'Harvest Reports',
      icon: Tractor,
      reports: [
        {
          id: 'harvest-summary',
          name: 'Harvest Summary',
          description: 'Yield data with tons, Brix, and tons per acre',
          format: ['PDF', 'Excel', 'CSV']
        }
      ]
    },
    {
      title: 'Labor Reports',
      icon: Users,
      reports: [
        {
          id: 'labor-summary',
          name: 'Labor Log',
          description: 'All labor entries with hours and costs',
          format: ['PDF', 'Excel', 'CSV']
        },
        {
          id: 'labor-by-task',
          name: 'Labor Costs by Task',
          description: 'Total hours and costs grouped by task type',
          format: ['PDF', 'Excel']
        }
      ]
    },
    {
      title: 'Inventory Reports',
      icon: Package,
      reports: [
        {
          id: 'inventory-current',
          name: 'Current Inventory',
          description: 'All inventory items with quantities and values',
          format: ['PDF', 'Excel', 'CSV']
        },
        {
          id: 'inventory-transactions',
          name: 'Inventory Transactions',
          description: 'History of inventory additions and usage',
          format: ['PDF', 'Excel', 'CSV']
        }
      ]
    },
    {
      title: 'Equipment Reports',
      icon: Wrench,
      reports: [
        {
          id: 'equipment-list',
          name: 'Equipment Inventory',
          description: 'All equipment with details and values',
          format: ['PDF', 'Excel']
        }
      ]
    },
    {
      title: 'Task Reports',
      icon: ClipboardList,
      reports: [
        {
          id: 'task-summary',
          name: 'Task Summary',
          description: 'All tasks with status and assignments',
          format: ['PDF', 'Excel', 'CSV']
        }
      ]
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#1C2739] animate-spin mx-auto mb-4" />
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
          <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Generate and export vineyard operations reports</p>
        </div>
        {exporting && (
          <div className="flex items-center gap-2 text-[#1C2739]">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">Generating export...</span>
          </div>
        )}
      </div>

      {/* Date Range Filter */}
      <div className="bg-white p-5 rounded-xl border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-5 h-5 text-gray-400" />
          <h2 className="text-sm font-medium text-gray-900">Date Range</h2>
        </div>

        <div className="flex flex-wrap gap-2">
          {['all', '30-days', '90-days', '6-months', 'current-year'].map(range => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                dateRange === range
                  ? 'bg-[#1C2739] text-white border-[#1C2739]'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
              }`}
            >
              {range === 'all' ? 'All Time' :
               range === '30-days' ? 'Last 30 Days' :
               range === '90-days' ? 'Last 90 Days' :
               range === '6-months' ? 'Last 6 Months' :
               'Current Year'}
            </button>
          ))}
        </div>
      </div>

      {/* Report Categories */}
      {reportCategories.map((category, catIndex) => {
        const CategoryIcon = category.icon;

        return (
          <div key={catIndex} className="bg-white p-5 rounded-xl border border-gray-200">
            <div className="flex items-center gap-3 mb-5">
              <CategoryIcon className="w-5 h-5 text-[#1C2739]" />
              <h2 className="text-base font-semibold text-gray-900">{category.title}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {category.reports.map(report => (
                <div
                  key={report.id}
                  className="p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                >
                  <div className="mb-3">
                    <h3 className="font-medium text-gray-900 mb-1">{report.name}</h3>
                    <p className="text-sm text-gray-500">{report.description}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {report.format.map(format => (
                      <button
                        key={format}
                        disabled={exporting}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleExport(report.id, format)}
                      >
                        {format === 'PDF' ? <FileText className="w-3.5 h-3.5" /> :
                         format === 'Excel' ? <FileSpreadsheet className="w-3.5 h-3.5" /> :
                         <Download className="w-3.5 h-3.5" />}
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
      <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <Download className="w-5 h-5 text-[#1C2739]" />
          <h2 className="text-base font-semibold text-gray-900">Quick Exports</h2>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Export all your data for backup or analysis
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            disabled={exporting}
            onClick={() => handleExport('field-summary', 'Excel')}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export All Fields
          </button>

          <button
            disabled={exporting}
            onClick={() => handleExport('spray-log', 'Excel')}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Spray Records
          </button>

          <button
            disabled={exporting}
            onClick={() => handleExport('labor-summary', 'Excel')}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Labor Log
          </button>

          <button
            disabled={exporting}
            onClick={() => handleExport('inventory-current', 'Excel')}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Inventory
          </button>

          <button
            disabled={exporting}
            onClick={() => {
              handleExport('field-summary', 'PDF');
              setTimeout(() => handleExport('spray-log', 'PDF'), 500);
              setTimeout(() => handleExport('harvest-summary', 'PDF'), 1000);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            Print Key Reports
          </button>
        </div>
      </div>
    </div>
  );
}
