import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/auth/AuthContext';
import {
  Wrench,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  DollarSign,
  Clock,
  TrendingUp,
  FileText,
  Settings,
  Fuel,
  BarChart3,
  ClipboardList,
  Package,
  Save,
  X,
  Download
} from 'lucide-react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  listEquipment,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  listMaintenanceRecords,
  createMaintenanceRecord,
  updateMaintenanceRecord,
  deleteMaintenanceRecord,
  listMaintenanceSchedules,
  createMaintenanceSchedule,
  updateMaintenanceSchedule,
  deleteMaintenanceSchedule,
  getOverdueMaintenance,
  getUpcomingMaintenance,
  listUsageLogs,
  createUsageLog,
  updateUsageLog,
  deleteUsageLog,
  listFuelLogs,
  createFuelLog,
  updateFuelLog,
  deleteFuelLog,
  listEquipmentExpenses,
  createEquipmentExpense,
  updateEquipmentExpense,
  deleteEquipmentExpense,
  getEquipmentSummary
} from '@/shared/lib/equipmentApi';
import { listOrganizationMembers, listVineyardBlocks } from '@/shared/lib/vineyardApi';
import {
  BarChart as RechartsBarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export function EquipmentManagement() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [notification, setNotification] = useState(null);

  // Data states
  const [equipment, setEquipment] = useState([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const [maintenanceSchedules, setMaintenanceSchedules] = useState([]);
  const [usageLogs, setUsageLogs] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [overdueMaintenance, setOverdueMaintenance] = useState([]);
  const [upcomingMaintenance, setUpcomingMaintenance] = useState([]);

  // Form states
  const [showEquipmentForm, setShowEquipmentForm] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [equipmentForm, setEquipmentForm] = useState({
    name: '',
    type: '',
    category: '',
    manufacturer: '',
    model: '',
    year: '',
    serial_number: '',
    purchase_price: '',
    purchase_date: '',
    current_hours: 0,
    status: 'operational',
    notes: ''
  });

  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState(null);
  const [maintenanceForm, setMaintenanceForm] = useState({
    equipment_id: '',
    maintenance_type: '',
    service_date: new Date().toISOString().split('T')[0],
    hours_at_service: '',
    performed_by: '',
    cost: '',
    description: '',
    notes: '',
    next_service_date: '',
    next_service_hours: ''
  });

  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    equipment_id: '',
    maintenance_type: '',
    frequency_type: 'hours',
    frequency_value: '',
    last_service_date: '',
    last_service_hours: '',
    is_active: true,
    reminder_days_before: 7,
    notes: ''
  });

  const [showUsageForm, setShowUsageForm] = useState(false);
  const [editingUsage, setEditingUsage] = useState(null);
  const [usageForm, setUsageForm] = useState({
    equipment_id: '',
    usage_date: new Date().toISOString().split('T')[0],
    operator_id: '',
    start_hours: '',
    end_hours: '',
    hours_used: '',
    block_id: '',
    task: '',
    notes: ''
  });

  const [showFuelForm, setShowFuelForm] = useState(false);
  const [editingFuel, setEditingFuel] = useState(null);
  const [fuelForm, setFuelForm] = useState({
    equipment_id: '',
    fill_date: new Date().toISOString().split('T')[0],
    gallons: '',
    cost_per_gallon: '',
    total_cost: '',
    odometer_hours: '',
    fuel_type: 'Diesel',
    notes: ''
  });

  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [expenseForm, setExpenseForm] = useState({
    equipment_id: '',
    expense_date: new Date().toISOString().split('T')[0],
    expense_type: '',
    amount: '',
    vendor: '',
    description: '',
    notes: ''
  });

  // Load all data
  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [
        equipmentRes,
        maintenanceRes,
        schedulesRes,
        usageRes,
        fuelRes,
        expensesRes,
        membersRes,
        blocksRes,
        overdueRes,
        upcomingRes
      ] = await Promise.all([
        listEquipment(),
        listMaintenanceRecords(),
        listMaintenanceSchedules(),
        listUsageLogs(),
        listFuelLogs(),
        listEquipmentExpenses(),
        listOrganizationMembers(),
        listVineyardBlocks(),
        getOverdueMaintenance(),
        getUpcomingMaintenance()
      ]);

      if (!equipmentRes.error && equipmentRes.data) setEquipment(equipmentRes.data);
      if (!maintenanceRes.error && maintenanceRes.data) setMaintenanceRecords(maintenanceRes.data);
      if (!schedulesRes.error && schedulesRes.data) setMaintenanceSchedules(schedulesRes.data);
      if (!usageRes.error && usageRes.data) setUsageLogs(usageRes.data);
      if (!fuelRes.error && fuelRes.data) setFuelLogs(fuelRes.data);
      if (!expensesRes.error && expensesRes.data) setExpenses(expensesRes.data);
      if (!membersRes.error && membersRes.data) setTeamMembers(membersRes.data);
      if (!blocksRes.error && blocksRes.data) setBlocks(blocksRes.data);
      if (!overdueRes.error && overdueRes.data) setOverdueMaintenance(overdueRes.data);
      if (!upcomingRes.error && upcomingRes.data) setUpcomingMaintenance(upcomingRes.data);
    } catch (error) {
      console.error('Error loading equipment data:', error);
      setNotification({ type: 'error', message: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  };

  // Equipment handlers
  const handleSubmitEquipment = async (e) => {
    e.preventDefault();
    try {
      if (editingEquipment) {
        const { error } = await updateEquipment(editingEquipment.id, equipmentForm);
        if (error) throw error;
        setNotification({ type: 'success', message: 'Equipment updated successfully' });
      } else {
        const { error } = await createEquipment(equipmentForm);
        if (error) throw error;
        setNotification({ type: 'success', message: 'Equipment added successfully' });
      }
      resetEquipmentForm();
      loadAllData();
    } catch (error) {
      console.error('Error saving equipment:', error);
      setNotification({ type: 'error', message: error.message });
    }
  };

  const resetEquipmentForm = () => {
    setEquipmentForm({
      name: '',
      type: '',
      category: '',
      manufacturer: '',
      model: '',
      year: '',
      serial_number: '',
      purchase_price: '',
      purchase_date: '',
      current_hours: 0,
      status: 'operational',
      notes: ''
    });
    setEditingEquipment(null);
    setShowEquipmentForm(false);
  };

  const handleEditEquipment = (eq) => {
    setEquipmentForm(eq);
    setEditingEquipment(eq);
    setShowEquipmentForm(true);
  };

  const handleDeleteEquipment = async (equipmentId) => {
    if (!confirm('Are you sure you want to delete this equipment?')) return;
    try {
      const { error } = await deleteEquipment(equipmentId);
      if (error) throw error;
      setNotification({ type: 'success', message: 'Equipment deleted' });
      loadAllData();
    } catch (error) {
      console.error('Error deleting equipment:', error);
      setNotification({ type: 'error', message: error.message });
    }
  };

  // Maintenance handlers
  const handleSubmitMaintenance = async (e) => {
    e.preventDefault();
    try {
      if (editingMaintenance) {
        const { error } = await updateMaintenanceRecord(editingMaintenance.id, maintenanceForm);
        if (error) throw error;
        setNotification({ type: 'success', message: 'Maintenance record updated' });
      } else {
        const { error } = await createMaintenanceRecord(maintenanceForm);
        if (error) throw error;
        setNotification({ type: 'success', message: 'Maintenance record added' });
      }
      resetMaintenanceForm();
      loadAllData();
    } catch (error) {
      console.error('Error saving maintenance:', error);
      setNotification({ type: 'error', message: error.message });
    }
  };

  const resetMaintenanceForm = () => {
    setMaintenanceForm({
      equipment_id: '',
      maintenance_type: '',
      service_date: new Date().toISOString().split('T')[0],
      hours_at_service: '',
      performed_by: '',
      cost: '',
      description: '',
      notes: '',
      next_service_date: '',
      next_service_hours: ''
    });
    setEditingMaintenance(null);
    setShowMaintenanceForm(false);
  };

  const handleEditMaintenance = (record) => {
    setMaintenanceForm({
      equipment_id: record.equipment_id,
      maintenance_type: record.maintenance_type,
      service_date: record.service_date,
      hours_at_service: record.hours_at_service || '',
      performed_by: record.performed_by || '',
      cost: record.cost || '',
      description: record.description || '',
      notes: record.notes || '',
      next_service_date: record.next_service_date || '',
      next_service_hours: record.next_service_hours || ''
    });
    setEditingMaintenance(record);
    setShowMaintenanceForm(true);
  };

  const handleDeleteMaintenance = async (recordId) => {
    if (!confirm('Are you sure you want to delete this maintenance record?')) return;
    try {
      const { error } = await deleteMaintenanceRecord(recordId);
      if (error) throw error;
      setNotification({ type: 'success', message: 'Maintenance record deleted' });
      loadAllData();
    } catch (error) {
      console.error('Error deleting maintenance:', error);
      setNotification({ type: 'error', message: error.message });
    }
  };

  // Schedule handlers
  const handleSubmitSchedule = async (e) => {
    e.preventDefault();
    try {
      if (editingSchedule) {
        const { error } = await updateMaintenanceSchedule(editingSchedule.id, scheduleForm);
        if (error) throw error;
        setNotification({ type: 'success', message: 'Schedule updated' });
      } else {
        const { error } = await createMaintenanceSchedule(scheduleForm);
        if (error) throw error;
        setNotification({ type: 'success', message: 'Schedule created' });
      }
      resetScheduleForm();
      loadAllData();
    } catch (error) {
      console.error('Error saving schedule:', error);
      setNotification({ type: 'error', message: error.message });
    }
  };

  const resetScheduleForm = () => {
    setScheduleForm({
      equipment_id: '',
      maintenance_type: '',
      frequency_type: 'hours',
      frequency_value: '',
      last_service_date: '',
      last_service_hours: '',
      is_active: true,
      reminder_days_before: 7,
      notes: ''
    });
    setEditingSchedule(null);
    setShowScheduleForm(false);
  };

  const handleEditSchedule = (schedule) => {
    setScheduleForm(schedule);
    setEditingSchedule(schedule);
    setShowScheduleForm(true);
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;
    try {
      const { error} = await deleteMaintenanceSchedule(scheduleId);
      if (error) throw error;
      setNotification({ type: 'success', message: 'Schedule deleted' });
      loadAllData();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      setNotification({ type: 'error', message: error.message });
    }
  };

  // Usage log handlers
  const handleSubmitUsage = async (e) => {
    e.preventDefault();
    try {
      if (editingUsage) {
        const { error } = await updateUsageLog(editingUsage.id, usageForm);
        if (error) throw error;
        setNotification({ type: 'success', message: 'Usage log updated' });
      } else {
        const { error } = await createUsageLog(usageForm);
        if (error) throw error;
        setNotification({ type: 'success', message: 'Usage log added' });
      }
      resetUsageForm();
      loadAllData();
    } catch (error) {
      console.error('Error saving usage log:', error);
      setNotification({ type: 'error', message: error.message });
    }
  };

  const resetUsageForm = () => {
    setUsageForm({
      equipment_id: '',
      usage_date: new Date().toISOString().split('T')[0],
      operator_id: '',
      start_hours: '',
      end_hours: '',
      hours_used: '',
      block_id: '',
      task: '',
      notes: ''
    });
    setEditingUsage(null);
    setShowUsageForm(false);
  };

  const handleEditUsage = (log) => {
    setUsageForm({
      equipment_id: log.equipment_id,
      usage_date: log.usage_date,
      operator_id: log.operator_id || '',
      start_hours: log.start_hours || '',
      end_hours: log.end_hours || '',
      hours_used: log.hours_used || '',
      block_id: log.block_id || '',
      task: log.task || '',
      notes: log.notes || ''
    });
    setEditingUsage(log);
    setShowUsageForm(true);
  };

  const handleDeleteUsage = async (logId) => {
    if (!confirm('Are you sure you want to delete this usage log?')) return;
    try {
      const { error } = await deleteUsageLog(logId);
      if (error) throw error;
      setNotification({ type: 'success', message: 'Usage log deleted' });
      loadAllData();
    } catch (error) {
      console.error('Error deleting usage log:', error);
      setNotification({ type: 'error', message: error.message });
    }
  };

  // Fuel log handlers
  const handleSubmitFuel = async (e) => {
    e.preventDefault();
    try {
      if (editingFuel) {
        const { error } = await updateFuelLog(editingFuel.id, fuelForm);
        if (error) throw error;
        setNotification({ type: 'success', message: 'Fuel log updated' });
      } else {
        const { error } = await createFuelLog(fuelForm);
        if (error) throw error;
        setNotification({ type: 'success', message: 'Fuel log added' });
      }
      resetFuelForm();
      loadAllData();
    } catch (error) {
      console.error('Error saving fuel log:', error);
      setNotification({ type: 'error', message: error.message });
    }
  };

  const resetFuelForm = () => {
    setFuelForm({
      equipment_id: '',
      fill_date: new Date().toISOString().split('T')[0],
      gallons: '',
      cost_per_gallon: '',
      total_cost: '',
      odometer_hours: '',
      fuel_type: 'Diesel',
      notes: ''
    });
    setEditingFuel(null);
    setShowFuelForm(false);
  };

  const handleEditFuel = (log) => {
    setFuelForm({
      equipment_id: log.equipment_id,
      fill_date: log.fill_date,
      gallons: log.gallons || '',
      cost_per_gallon: log.cost_per_gallon || '',
      total_cost: log.total_cost || '',
      odometer_hours: log.odometer_hours || '',
      fuel_type: log.fuel_type || 'Diesel',
      notes: log.notes || ''
    });
    setEditingFuel(log);
    setShowFuelForm(true);
  };

  const handleDeleteFuel = async (logId) => {
    if (!confirm('Are you sure you want to delete this fuel log?')) return;
    try {
      const { error } = await deleteFuelLog(logId);
      if (error) throw error;
      setNotification({ type: 'success', message: 'Fuel log deleted' });
      loadAllData();
    } catch (error) {
      console.error('Error deleting fuel log:', error);
      setNotification({ type: 'error', message: error.message });
    }
  };

  // Expense handlers
  const handleSubmitExpense = async (e) => {
    e.preventDefault();
    try {
      if (editingExpense) {
        const { error } = await updateEquipmentExpense(editingExpense.id, expenseForm);
        if (error) throw error;
        setNotification({ type: 'success', message: 'Expense updated' });
      } else {
        const { error } = await createEquipmentExpense(expenseForm);
        if (error) throw error;
        setNotification({ type: 'success', message: 'Expense added' });
      }
      resetExpenseForm();
      loadAllData();
    } catch (error) {
      console.error('Error saving expense:', error);
      setNotification({ type: 'error', message: error.message });
    }
  };

  const resetExpenseForm = () => {
    setExpenseForm({
      equipment_id: '',
      expense_date: new Date().toISOString().split('T')[0],
      expense_type: '',
      amount: '',
      vendor: '',
      description: '',
      notes: ''
    });
    setEditingExpense(null);
    setShowExpenseForm(false);
  };

  const handleEditExpense = (expense) => {
    setExpenseForm({
      equipment_id: expense.equipment_id,
      expense_date: expense.expense_date,
      expense_type: expense.expense_type,
      amount: expense.amount || '',
      vendor: expense.vendor || '',
      description: expense.description || '',
      notes: expense.notes || ''
    });
    setEditingExpense(expense);
    setShowExpenseForm(true);
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
      const { error } = await deleteEquipmentExpense(expenseId);
      if (error) throw error;
      setNotification({ type: 'success', message: 'Expense deleted' });
      loadAllData();
    } catch (error) {
      console.error('Error deleting expense:', error);
      setNotification({ type: 'error', message: error.message });
    }
  };

  // Analytics
  const analytics = useMemo(() => {
    const totalValue = equipment.reduce((sum, eq) => sum + (parseFloat(eq.purchase_price) || 0), 0);
    const operationalCount = equipment.filter(eq => eq.status === 'operational').length;
    const totalExpenses = expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
    const totalFuelCost = fuelLogs.reduce((sum, log) => sum + (parseFloat(log.total_cost) || 0), 0);
    const totalHours = usageLogs.reduce((sum, log) => sum + (parseFloat(log.hours_used) || 0), 0);

    // Expenses by type
    const expensesByType = {};
    expenses.forEach(exp => {
      const type = exp.expense_type || 'Other';
      if (!expensesByType[type]) {
        expensesByType[type] = { count: 0, total: 0 };
      }
      expensesByType[type].count++;
      expensesByType[type].total += parseFloat(exp.amount) || 0;
    });

    // Usage by equipment
    const usageByEquipment = {};
    usageLogs.forEach(log => {
      const eqId = log.equipment_id;
      const eqName = log.equipment?.name || 'Unknown';
      if (!usageByEquipment[eqId]) {
        usageByEquipment[eqId] = { name: eqName, hours: 0, uses: 0 };
      }
      usageByEquipment[eqId].hours += parseFloat(log.hours_used) || 0;
      usageByEquipment[eqId].uses++;
    });

    // Equipment by type
    const equipmentByType = {};
    equipment.forEach(eq => {
      const type = eq.type || 'Other';
      if (!equipmentByType[type]) {
        equipmentByType[type] = { count: 0, value: 0 };
      }
      equipmentByType[type].count++;
      equipmentByType[type].value += parseFloat(eq.purchase_price) || 0;
    });

    return {
      totalEquipment: equipment.length,
      totalValue,
      operationalCount,
      totalExpenses,
      totalFuelCost,
      totalHours,
      costPerHour: totalHours > 0 ? (totalExpenses + totalFuelCost) / totalHours : 0,
      expensesByType: Object.entries(expensesByType).map(([type, data]) => ({ type, ...data })),
      usageByEquipment: Object.values(usageByEquipment),
      equipmentByType: Object.entries(equipmentByType).map(([type, data]) => ({ type, ...data })),
      overdueCount: overdueMaintenance.length,
      upcomingCount: upcomingMaintenance.length
    };
  }, [equipment, expenses, fuelLogs, usageLogs, overdueMaintenance, upcomingMaintenance]);

  const equipmentTypes = [
    'Tractor',
    'Sprayer',
    'Harvester',
    'Pruner',
    'Mower',
    'Cultivator',
    'Trailer',
    'ATV/UTV',
    'Irrigation Equipment',
    'Hand Tools',
    'Other'
  ];

  const maintenanceTypes = [
    'Oil Change',
    'Filter Replacement',
    'Tire Maintenance',
    'Belt Replacement',
    'Fluid Check',
    'Brake Service',
    'Inspection',
    'Repair',
    'Cleaning',
    'Calibration',
    'Other'
  ];

  const expenseTypes = [
    'Maintenance',
    'Repair',
    'Fuel',
    'Insurance',
    'Registration',
    'Parts',
    'Tires',
    'Fluids',
    'Labor',
    'Other'
  ];

  const taskTypes = [
    'Spraying',
    'Mowing',
    'Cultivation',
    'Harvesting',
    'Pruning',
    'Planting',
    'Hauling',
    'Irrigation',
    'General Maintenance',
    'Other'
  ];

  const fuelTypes = ['Diesel', 'Gasoline', 'Propane', 'Electric'];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading equipment data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Equipment Management</h2>
          <p className="text-sm text-gray-600 mt-1">
            Track equipment, maintenance, usage, and costs
          </p>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <Card className={`border-2 ${
          notification.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <p className={`font-medium ${
                notification.type === 'success' ? 'text-green-900' : 'text-red-900'
              }`}>
                {notification.message}
              </p>
              <button
                onClick={() => setNotification(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                <Wrench className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{analytics.totalEquipment}</div>
            <div className="text-sm text-gray-600">Total Equipment</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{analytics.operationalCount}</div>
            <div className="text-sm text-gray-600">Operational</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{analytics.overdueCount}</div>
            <div className="text-sm text-gray-600">Overdue Maintenance</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              ${analytics.totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
            <div className="text-sm text-gray-600">Total Value</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              ${analytics.totalExpenses.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
            <div className="text-sm text-gray-600">Total Expenses</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {analytics.totalHours.toFixed(0)}
            </div>
            <div className="text-sm text-gray-600">Total Hours</div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {analytics.overdueCount > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900 mb-1">Overdue Maintenance</p>
                <p className="text-sm text-red-800">
                  {analytics.overdueCount} equipment item{analytics.overdueCount !== 1 ? 's have' : ' has'} overdue maintenance. Check Maintenance tab.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {analytics.upcomingCount > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-orange-900 mb-1">Upcoming Maintenance</p>
                <p className="text-sm text-orange-800">
                  {analytics.upcomingCount} maintenance task{analytics.upcomingCount !== 1 ? 's are' : ' is'} due in the next 30 days.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 overflow-x-auto hide-scrollbar">
        {[
          { value: 'overview', label: 'Overview', icon: BarChart3 },
          { value: 'equipment', label: 'Equipment', icon: Wrench },
          { value: 'maintenance', label: 'Maintenance', icon: Settings },
          { value: 'usage', label: 'Usage', icon: ClipboardList },
          { value: 'fuel', label: 'Fuel', icon: Fuel },
          { value: 'expenses', label: 'Expenses', icon: DollarSign },
          { value: 'analytics', label: 'Analytics', icon: TrendingUp }
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === tab.value
                ? 'bg-white text-gray-900 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB - Due to character limit, I'll continue in the next message */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Recent Activity */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {[...maintenanceRecords, ...usageLogs, ...fuelLogs]
                  .sort((a, b) => new Date(b.created_at || b.usage_date || b.fill_date) - new Date(a.created_at || a.usage_date || a.fill_date))
                  .slice(0, 10)
                  .map((item, idx) => {
                    const isMaintenance = item.maintenance_type !== undefined;
                    const isUsage = item.usage_date !== undefined && !item.gallons;
                    const isFuel = item.gallons !== undefined;

                    return (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isMaintenance ? 'bg-blue-100' : isUsage ? 'bg-green-100' : 'bg-orange-100'
                          }`}>
                            {isMaintenance && <Settings className="w-5 h-5 text-blue-600" />}
                            {isUsage && <Clock className="w-5 h-5 text-green-600" />}
                            {isFuel && <Fuel className="w-5 h-5 text-orange-600" />}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {isMaintenance && `Maintenance: ${item.maintenance_type}`}
                              {isUsage && `Usage: ${parseFloat(item.hours_used || 0).toFixed(1)} hours`}
                              {isFuel && `Fuel: ${parseFloat(item.gallons || 0).toFixed(1)} gal`}
                            </p>
                            <p className="text-sm text-gray-600">
                              {item.equipment?.name || 'Unknown Equipment'} • {item.service_date || item.usage_date || item.fill_date}
                            </p>
                          </div>
                        </div>
                        {(isMaintenance || isFuel) && item.cost && (
                          <span className="text-sm font-medium text-gray-900">
                            ${parseFloat(item.cost || item.total_cost).toFixed(2)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                {[...maintenanceRecords, ...usageLogs, ...fuelLogs].length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No activity yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Equipment by Type</h3>
                {analytics.equipmentByType.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={analytics.equipmentByType}
                        dataKey="count"
                        nameKey="type"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {analytics.equipmentByType.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-gray-500">No equipment data</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Expenses by Type</h3>
                {analytics.expensesByType.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={analytics.expensesByType}
                        dataKey="total"
                        nameKey="type"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {analytics.expensesByType.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-gray-500">No expense data</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* EQUIPMENT TAB */}
      {activeTab === 'equipment' && (
        <div className="space-y-6">
          {!showEquipmentForm && (
            <div className="flex justify-end">
              <Button onClick={() => setShowEquipmentForm(true)} className="bg-teal-600 hover:bg-teal-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Equipment
              </Button>
            </div>
          )}

          {showEquipmentForm && (
            <Card className="border-2 border-teal-200 bg-teal-50">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingEquipment ? 'Edit Equipment' : 'Add Equipment'}
                </h3>
                <form onSubmit={handleSubmitEquipment} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                      <Input required value={equipmentForm.name} onChange={(e) => setEquipmentForm({ ...equipmentForm, name: e.target.value })} placeholder="e.g., Main Tractor" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                      <select required value={equipmentForm.type} onChange={(e) => setEquipmentForm({ ...equipmentForm, type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500">
                        <option value="">Select type...</option>
                        {equipmentTypes.map(type => <option key={type} value={type}>{type}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
                      <Input value={equipmentForm.manufacturer} onChange={(e) => setEquipmentForm({ ...equipmentForm, manufacturer: e.target.value })} placeholder="e.g., John Deere" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                      <Input value={equipmentForm.model} onChange={(e) => setEquipmentForm({ ...equipmentForm, model: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                      <Input type="number" value={equipmentForm.year} onChange={(e) => setEquipmentForm({ ...equipmentForm, year: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                      <Input value={equipmentForm.serial_number} onChange={(e) => setEquipmentForm({ ...equipmentForm, serial_number: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price</label>
                      <Input type="number" step="0.01" value={equipmentForm.purchase_price} onChange={(e) => setEquipmentForm({ ...equipmentForm, purchase_price: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
                      <Input type="date" value={equipmentForm.purchase_date} onChange={(e) => setEquipmentForm({ ...equipmentForm, purchase_date: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Hours</label>
                      <Input type="number" step="0.1" value={equipmentForm.current_hours} onChange={(e) => setEquipmentForm({ ...equipmentForm, current_hours: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select value={equipmentForm.status} onChange={(e) => setEquipmentForm({ ...equipmentForm, status: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500">
                        <option value="operational">Operational</option>
                        <option value="maintenance">In Maintenance</option>
                        <option value="repair">Needs Repair</option>
                        <option value="retired">Retired</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500" rows="3" value={equipmentForm.notes} onChange={(e) => setEquipmentForm({ ...equipmentForm, notes: e.target.value })} />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="bg-teal-600 hover:bg-teal-700"><Save className="w-4 h-4 mr-2" />{editingEquipment ? 'Update' : 'Add'} Equipment</Button>
                    <Button type="button" variant="outline" onClick={resetEquipmentForm}>Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {equipment.map(eq => {
              // Calculate stats for this equipment
              const eqUsage = usageLogs.filter(log => log.equipment_id === eq.id);
              const eqMaintenance = maintenanceRecords.filter(rec => rec.equipment_id === eq.id);
              const eqFuel = fuelLogs.filter(log => log.equipment_id === eq.id);
              const eqExpenses = expenses.filter(exp => exp.equipment_id === eq.id);

              const totalHours = eqUsage.reduce((sum, log) => sum + (parseFloat(log.hours_used) || 0), 0);
              const totalMaintenanceCost = eqMaintenance.reduce((sum, rec) => sum + (parseFloat(rec.cost) || 0), 0);
              const totalFuelCost = eqFuel.reduce((sum, log) => sum + (parseFloat(log.total_cost) || 0), 0);
              const totalExpenseCost = eqExpenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
              const totalCost = totalMaintenanceCost + totalFuelCost + totalExpenseCost;

              const lastMaintenance = eqMaintenance.length > 0
                ? eqMaintenance.sort((a, b) => new Date(b.service_date) - new Date(a.service_date))[0]
                : null;

              const lastUsage = eqUsage.length > 0
                ? eqUsage.sort((a, b) => new Date(b.usage_date) - new Date(a.usage_date))[0]
                : null;

              const age = eq.year ? new Date().getFullYear() - parseInt(eq.year) : null;

              return (
                <Card key={eq.id} className="hover:shadow-lg transition-shadow border-2">
                  <CardContent className="pt-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">{eq.name}</h3>
                          {age !== null && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                              {age}yr{age !== 1 ? 's' : ''} old
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
                            {eq.type}
                          </span>
                          <span className={`px-2.5 py-1 text-sm font-medium rounded-full ${
                            eq.status === 'operational' ? 'bg-green-100 text-green-700' :
                            eq.status === 'maintenance' ? 'bg-yellow-100 text-yellow-700' :
                            eq.status === 'repair' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {eq.status}
                          </span>
                        </div>
                        {(eq.manufacturer || eq.model) && (
                          <p className="text-sm text-gray-600 mt-2 font-medium">
                            {eq.manufacturer} {eq.model}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 ml-4">
                        <button
                          onClick={() => handleEditEquipment(eq)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEquipment(eq.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-4 h-4 text-gray-600" />
                          <p className="text-xs text-gray-600 font-medium">Total Hours</p>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{totalHours.toFixed(1)}</p>
                        <p className="text-xs text-gray-500 mt-1">Current: {parseFloat(eq.current_hours || 0).toFixed(1)}</p>
                      </div>

                      <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <DollarSign className="w-4 h-4 text-gray-600" />
                          <p className="text-xs text-gray-600 font-medium">Value</p>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">
                          ${eq.purchase_price ? parseFloat(eq.purchase_price).toLocaleString('en-US', { maximumFractionDigits: 0 }) : '0'}
                        </p>
                        {eq.purchase_date && (
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(eq.purchase_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="w-4 h-4 text-gray-600" />
                          <p className="text-xs text-gray-600 font-medium">Total Costs</p>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">
                          ${totalCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {eqExpenses.length + eqMaintenance.length + eqFuel.length} transactions
                        </p>
                      </div>

                      <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Settings className="w-4 h-4 text-gray-600" />
                          <p className="text-xs text-gray-600 font-medium">Maintenance</p>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{eqMaintenance.length}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          ${totalMaintenanceCost.toLocaleString('en-US', { maximumFractionDigits: 0 })} spent
                        </p>
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="border-t pt-4 space-y-2">
                      <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Recent Activity</p>
                      {lastUsage && (
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <Clock className="w-3 h-3 text-gray-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-900 font-medium truncate">
                              Last used {parseFloat(lastUsage.hours_used || 0).toFixed(1)} hrs
                            </p>
                            <p className="text-gray-500 text-xs">
                              {new Date(lastUsage.usage_date).toLocaleDateString()} • {lastUsage.task || 'No task'}
                            </p>
                          </div>
                        </div>
                      )}
                      {lastMaintenance && (
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <Settings className="w-3 h-3 text-gray-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-900 font-medium truncate">{lastMaintenance.maintenance_type}</p>
                            <p className="text-gray-500 text-xs">
                              {new Date(lastMaintenance.service_date).toLocaleDateString()}
                              {lastMaintenance.cost && ` • $${parseFloat(lastMaintenance.cost).toFixed(2)}`}
                            </p>
                          </div>
                        </div>
                      )}
                      {eqFuel.length > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <Fuel className="w-3 h-3 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-gray-900 font-medium">{eqFuel.length} fuel fill{eqFuel.length !== 1 ? 's' : ''}</p>
                            <p className="text-gray-500 text-xs">${totalFuelCost.toFixed(2)} total</p>
                          </div>
                        </div>
                      )}
                      {!lastUsage && !lastMaintenance && eqFuel.length === 0 && (
                        <p className="text-gray-400 text-sm italic py-2">No activity recorded</p>
                      )}
                    </div>

                    {/* Quick Actions */}
                    <div className="border-t pt-4 mt-4 grid grid-cols-3 gap-2">
                      <button
                        onClick={() => {
                          setUsageForm({ ...usageForm, equipment_id: eq.id });
                          setShowUsageForm(true);
                          setActiveTab('usage');
                        }}
                        className="px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded transition-colors"
                      >
                        Log Usage
                      </button>
                      <button
                        onClick={() => {
                          setMaintenanceForm({ ...maintenanceForm, equipment_id: eq.id });
                          setShowMaintenanceForm(true);
                          setActiveTab('maintenance');
                        }}
                        className="px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded transition-colors"
                      >
                        Add Service
                      </button>
                      <button
                        onClick={() => {
                          setFuelForm({ ...fuelForm, equipment_id: eq.id });
                          setShowFuelForm(true);
                          setActiveTab('fuel');
                        }}
                        className="px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded transition-colors"
                      >
                        Log Fuel
                      </button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {equipment.length === 0 && !showEquipmentForm && (
            <Card className="border-2 border-dashed border-gray-300">
              <CardContent className="py-16 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wrench className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Equipment Yet</h3>
                <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                  Start tracking your vineyard equipment to monitor usage, maintenance, and costs
                </p>
                <Button onClick={() => setShowEquipmentForm(true)} className="bg-teal-600 hover:bg-teal-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Equipment
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* MAINTENANCE TAB */}
      {activeTab === 'maintenance' && (
        <div className="space-y-6">
          {!showMaintenanceForm && (
            <div className="flex justify-end">
              <Button onClick={() => setShowMaintenanceForm(true)} className="bg-teal-600 hover:bg-teal-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Maintenance Record
              </Button>
            </div>
          )}

          {showMaintenanceForm && (
            <Card className="border-2 border-teal-200 bg-teal-50">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingMaintenance ? 'Edit Maintenance Record' : 'Add Maintenance Record'}
                </h3>
                <form onSubmit={handleSubmitMaintenance} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Equipment *</label>
                      <select required value={maintenanceForm.equipment_id} onChange={(e) => setMaintenanceForm({ ...maintenanceForm, equipment_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500">
                        <option value="">Select equipment...</option>
                        {equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Maintenance Type *</label>
                      <select required value={maintenanceForm.maintenance_type} onChange={(e) => setMaintenanceForm({ ...maintenanceForm, maintenance_type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500">
                        <option value="">Select type...</option>
                        {maintenanceTypes.map(type => <option key={type} value={type}>{type}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Service Date *</label>
                      <Input required type="date" value={maintenanceForm.service_date} onChange={(e) => setMaintenanceForm({ ...maintenanceForm, service_date: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Hours at Service</label>
                      <Input type="number" step="0.1" value={maintenanceForm.hours_at_service} onChange={(e) => setMaintenanceForm({ ...maintenanceForm, hours_at_service: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Performed By</label>
                      <Input value={maintenanceForm.performed_by} onChange={(e) => setMaintenanceForm({ ...maintenanceForm, performed_by: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cost</label>
                      <Input type="number" step="0.01" value={maintenanceForm.cost} onChange={(e) => setMaintenanceForm({ ...maintenanceForm, cost: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Next Service Date</label>
                      <Input type="date" value={maintenanceForm.next_service_date} onChange={(e) => setMaintenanceForm({ ...maintenanceForm, next_service_date: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Next Service Hours</label>
                      <Input type="number" step="0.1" value={maintenanceForm.next_service_hours} onChange={(e) => setMaintenanceForm({ ...maintenanceForm, next_service_hours: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500" rows="2" value={maintenanceForm.description} onChange={(e) => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })} />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="bg-teal-600 hover:bg-teal-700"><Save className="w-4 h-4 mr-2" />{editingMaintenance ? 'Update' : 'Add'} Record</Button>
                    <Button type="button" variant="outline" onClick={resetMaintenanceForm}>Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Maintenance Records</h3>
              <div className="space-y-3">
                {maintenanceRecords.map(record => (
                  <div key={record.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{record.equipment?.name} - {record.maintenance_type}</p>
                      <p className="text-sm text-gray-600">{record.service_date} • {record.performed_by || 'N/A'}</p>
                      {record.description && <p className="text-xs text-gray-500 mt-1">{record.description}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      {record.cost && <span className="text-sm font-medium text-gray-900">${parseFloat(record.cost).toFixed(2)}</span>}
                      <button onClick={() => handleEditMaintenance(record)} className="p-2 text-gray-600 hover:bg-gray-100 rounded"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteMaintenance(record.id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
                {maintenanceRecords.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Settings className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No maintenance records yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* USAGE TAB */}
      {activeTab === 'usage' && (
        <div className="space-y-6">
          {!showUsageForm && (
            <div className="flex justify-end">
              <Button onClick={() => setShowUsageForm(true)} className="bg-teal-600 hover:bg-teal-700">
                <Plus className="w-4 h-4 mr-2" />
                Log Usage
              </Button>
            </div>
          )}

          {showUsageForm && (
            <Card className="border-2 border-teal-200 bg-teal-50">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingUsage ? 'Edit Usage Log' : 'Log Equipment Usage'}
                </h3>
                <form onSubmit={handleSubmitUsage} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Equipment *</label>
                      <select required value={usageForm.equipment_id} onChange={(e) => setUsageForm({ ...usageForm, equipment_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500">
                        <option value="">Select equipment...</option>
                        {equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                      <Input required type="date" value={usageForm.usage_date} onChange={(e) => setUsageForm({ ...usageForm, usage_date: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Operator</label>
                      <select value={usageForm.operator_id} onChange={(e) => setUsageForm({ ...usageForm, operator_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500">
                        <option value="">Select operator...</option>
                        {teamMembers.map(member => <option key={member.id} value={member.id}>{member.full_name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Hours</label>
                      <Input type="number" step="0.1" value={usageForm.start_hours} onChange={(e) => setUsageForm({ ...usageForm, start_hours: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Hours</label>
                      <Input type="number" step="0.1" value={usageForm.end_hours} onChange={(e) => setUsageForm({ ...usageForm, end_hours: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Hours Used</label>
                      <Input type="number" step="0.1" value={usageForm.hours_used} onChange={(e) => setUsageForm({ ...usageForm, hours_used: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Field</label>
                      <select value={usageForm.block_id} onChange={(e) => setUsageForm({ ...usageForm, block_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500">
                        <option value="">Select field...</option>
                        {blocks.map(block => <option key={block.id} value={block.id}>{block.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Task</label>
                      <select value={usageForm.task} onChange={(e) => setUsageForm({ ...usageForm, task: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500">
                        <option value="">Select task...</option>
                        {taskTypes.map(task => <option key={task} value={task}>{task}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500" rows="2" value={usageForm.notes} onChange={(e) => setUsageForm({ ...usageForm, notes: e.target.value })} />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="bg-teal-600 hover:bg-teal-700"><Save className="w-4 h-4 mr-2" />{editingUsage ? 'Update' : 'Log'} Usage</Button>
                    <Button type="button" variant="outline" onClick={resetUsageForm}>Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage Logs</h3>
              <div className="space-y-3">
                {usageLogs.map(log => (
                  <div key={log.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{log.equipment?.name} - {parseFloat(log.hours_used || 0).toFixed(1)} hours</p>
                      <p className="text-sm text-gray-600">{log.usage_date} • {log.organization_members?.full_name || 'No operator'} • {log.task || 'No task'}</p>
                      {log.vineyard_blocks && <p className="text-xs text-gray-500">Field: {log.vineyard_blocks.name}</p>}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleEditUsage(log)} className="p-2 text-gray-600 hover:bg-gray-100 rounded"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteUsage(log.id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
                {usageLogs.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No usage logs yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* FUEL TAB */}
      {activeTab === 'fuel' && (
        <div className="space-y-6">
          {!showFuelForm && (
            <div className="flex justify-end">
              <Button onClick={() => setShowFuelForm(true)} className="bg-teal-600 hover:bg-teal-700">
                <Plus className="w-4 h-4 mr-2" />
                Log Fuel
              </Button>
            </div>
          )}

          {showFuelForm && (
            <Card className="border-2 border-teal-200 bg-teal-50">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingFuel ? 'Edit Fuel Log' : 'Log Fuel'}
                </h3>
                <form onSubmit={handleSubmitFuel} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Equipment *</label>
                      <select required value={fuelForm.equipment_id} onChange={(e) => setFuelForm({ ...fuelForm, equipment_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500">
                        <option value="">Select equipment...</option>
                        {equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                      <Input required type="date" value={fuelForm.fill_date} onChange={(e) => setFuelForm({ ...fuelForm, fill_date: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Type</label>
                      <select value={fuelForm.fuel_type} onChange={(e) => setFuelForm({ ...fuelForm, fuel_type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500">
                        {fuelTypes.map(type => <option key={type} value={type}>{type}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gallons *</label>
                      <Input required type="number" step="0.01" value={fuelForm.gallons} onChange={(e) => setFuelForm({ ...fuelForm, gallons: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cost per Gallon</label>
                      <Input type="number" step="0.01" value={fuelForm.cost_per_gallon} onChange={(e) => setFuelForm({ ...fuelForm, cost_per_gallon: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total Cost</label>
                      <Input type="number" step="0.01" value={fuelForm.total_cost} onChange={(e) => setFuelForm({ ...fuelForm, total_cost: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Odometer Hours</label>
                      <Input type="number" step="0.1" value={fuelForm.odometer_hours} onChange={(e) => setFuelForm({ ...fuelForm, odometer_hours: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500" rows="2" value={fuelForm.notes} onChange={(e) => setFuelForm({ ...fuelForm, notes: e.target.value })} />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="bg-teal-600 hover:bg-teal-700"><Save className="w-4 h-4 mr-2" />{editingFuel ? 'Update' : 'Log'} Fuel</Button>
                    <Button type="button" variant="outline" onClick={resetFuelForm}>Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Fuel Logs</h3>
              <div className="space-y-3">
                {fuelLogs.map(log => (
                  <div key={log.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{log.equipment?.name} - {parseFloat(log.gallons).toFixed(1)} gal {log.fuel_type}</p>
                      <p className="text-sm text-gray-600">{log.fill_date}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {log.total_cost && <span className="text-sm font-medium text-gray-900">${parseFloat(log.total_cost).toFixed(2)}</span>}
                      <button onClick={() => handleEditFuel(log)} className="p-2 text-gray-600 hover:bg-gray-100 rounded"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteFuel(log.id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
                {fuelLogs.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Fuel className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No fuel logs yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* EXPENSES TAB */}
      {activeTab === 'expenses' && (
        <div className="space-y-6">
          {!showExpenseForm && (
            <div className="flex justify-end">
              <Button onClick={() => setShowExpenseForm(true)} className="bg-teal-600 hover:bg-teal-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Expense
              </Button>
            </div>
          )}

          {showExpenseForm && (
            <Card className="border-2 border-teal-200 bg-teal-50">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingExpense ? 'Edit Expense' : 'Add Expense'}
                </h3>
                <form onSubmit={handleSubmitExpense} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Equipment *</label>
                      <select required value={expenseForm.equipment_id} onChange={(e) => setExpenseForm({ ...expenseForm, equipment_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500">
                        <option value="">Select equipment...</option>
                        {equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                      <Input required type="date" value={expenseForm.expense_date} onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                      <select required value={expenseForm.expense_type} onChange={(e) => setExpenseForm({ ...expenseForm, expense_type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500">
                        <option value="">Select type...</option>
                        {expenseTypes.map(type => <option key={type} value={type}>{type}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                      <Input required type="number" step="0.01" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                      <Input value={expenseForm.vendor} onChange={(e) => setExpenseForm({ ...expenseForm, vendor: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500" rows="2" value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="bg-teal-600 hover:bg-teal-700"><Save className="w-4 h-4 mr-2" />{editingExpense ? 'Update' : 'Add'} Expense</Button>
                    <Button type="button" variant="outline" onClick={resetExpenseForm}>Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Equipment Expenses</h3>
              <div className="space-y-3">
                {expenses.map(expense => (
                  <div key={expense.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{expense.equipment?.name} - {expense.expense_type}</p>
                      <p className="text-sm text-gray-600">{expense.expense_date} • {expense.vendor || 'No vendor'}</p>
                      {expense.description && <p className="text-xs text-gray-500 mt-1">{expense.description}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-900">${parseFloat(expense.amount).toFixed(2)}</span>
                      <button onClick={() => handleEditExpense(expense)} className="p-2 text-gray-600 hover:bg-gray-100 rounded"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteExpense(expense.id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
                {expenses.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No expenses yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage by Equipment</h3>
              {analytics.usageByEquipment.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsBarChart data={analytics.usageByEquipment}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="hours" fill="#8884d8" name="Hours" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-gray-500">No usage data</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Total Expenses</p>
                  <p className="text-2xl font-bold text-gray-900">${analytics.totalExpenses.toFixed(2)}</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Total Fuel Cost</p>
                  <p className="text-2xl font-bold text-gray-900">${analytics.totalFuelCost.toFixed(2)}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Cost per Hour</p>
                  <p className="text-2xl font-bold text-gray-900">${analytics.costPerHour.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
