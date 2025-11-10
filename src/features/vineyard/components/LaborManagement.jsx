import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/auth/AuthContext';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  DollarSign,
  Clock,
  TrendingUp,
  UserCheck,
  UserX,
  FileText,
  Download,
  CheckCircle,
  XCircle,
  PlayCircle,
  StopCircle,
  AlertTriangle,
  Award,
  MapPin,
  ClipboardList,
  TrendingDown,
  BarChart3,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Save,
  X
} from 'lucide-react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { listOrganizationMembers } from '@/shared/lib/vineyardApi';
import { listVineyardBlocks } from '@/shared/lib/vineyardApi';
import {
  listTimeEntries,
  createTimeEntry,
  updateTimeEntry,
  deleteTimeEntry,
  approveTimeEntry,
  rejectTimeEntry,
  listCertifications,
  createCertification,
  updateCertification,
  deleteCertification,
  getExpiringCertifications,
  getLaborSummary
} from '@/shared/lib/laborApi';
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

export function LaborManagement() {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedWeek, setSelectedWeek] = useState(getWeekDates(new Date()));
  const [selectedMonth, setSelectedMonth] = useState({
    month: new Date().getMonth(),
    year: new Date().getFullYear()
  });
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState(null);

  // Forms
  const [editingEntry, setEditingEntry] = useState(null);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [timeEntryForm, setTimeEntryForm] = useState({
    member_id: '',
    date: new Date().toISOString().split('T')[0],
    clock_in: '',
    clock_out: '',
    break_minutes: 30,
    block_id: '',
    task: '',
    pieces: '',
    notes: ''
  });

  const [editingCert, setEditingCert] = useState(null);
  const [showCertForm, setShowCertForm] = useState(false);
  const [certForm, setCertForm] = useState({
    member_id: '',
    name: '',
    certification_type: '',
    cert_number: '',
    issued_date: '',
    expiry_date: '',
    notes: ''
  });

  // Load data
  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user]);

  function getWeekDates(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    const sunday = new Date(d.setDate(diff));
    const saturday = new Date(d.setDate(sunday.getDate() + 6));
    return {
      start: sunday.toISOString().split('T')[0],
      end: saturday.toISOString().split('T')[0]
    };
  }

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [membersRes, entriesRes, certsRes, blocksRes] = await Promise.all([
        listOrganizationMembers(),
        listTimeEntries(),
        listCertifications(),
        listVineyardBlocks()
      ]);

      if (!membersRes.error && membersRes.data) setTeamMembers(membersRes.data);
      if (!entriesRes.error && entriesRes.data) setTimeEntries(entriesRes.data);
      if (!certsRes.error && certsRes.data) setCertifications(certsRes.data);
      if (!blocksRes.error && blocksRes.data) setBlocks(blocksRes.data);
    } catch (error) {
      console.error('Error loading labor data:', error);
      setNotification({ type: 'error', message: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  };

  // Time Entry Management
  const handleSubmitTimeEntry = async (e) => {
    e.preventDefault();
    try {
      if (editingEntry) {
        const { error } = await updateTimeEntry(editingEntry.id, timeEntryForm);
        if (error) throw error;
        setNotification({ type: 'success', message: 'Time entry updated successfully' });
      } else {
        const { error } = await createTimeEntry({ ...timeEntryForm, status: 'pending' });
        if (error) throw error;
        setNotification({ type: 'success', message: 'Time entry created successfully' });
      }
      resetTimeEntryForm();
      loadAllData();
    } catch (error) {
      console.error('Error saving time entry:', error);
      setNotification({ type: 'error', message: error.message });
    }
  };

  const resetTimeEntryForm = () => {
    setTimeEntryForm({
      member_id: '',
      date: new Date().toISOString().split('T')[0],
      clock_in: '',
      clock_out: '',
      break_minutes: 30,
      block_id: '',
      task: '',
      pieces: '',
      notes: ''
    });
    setEditingEntry(null);
    setShowEntryForm(false);
  };

  const handleEditEntry = (entry) => {
    setTimeEntryForm({
      member_id: entry.member_id,
      date: entry.date,
      clock_in: entry.clock_in || '',
      clock_out: entry.clock_out || '',
      break_minutes: entry.break_minutes || 30,
      block_id: entry.block_id || '',
      task: entry.task || '',
      pieces: entry.pieces || '',
      notes: entry.notes || ''
    });
    setEditingEntry(entry);
    setShowEntryForm(true);
  };

  const handleDeleteEntry = async (entryId) => {
    if (!confirm('Are you sure you want to delete this time entry?')) return;
    try {
      const { error } = await deleteTimeEntry(entryId);
      if (error) throw error;
      setNotification({ type: 'success', message: 'Time entry deleted' });
      loadAllData();
    } catch (error) {
      console.error('Error deleting entry:', error);
      setNotification({ type: 'error', message: error.message });
    }
  };

  const handleApproveEntry = async (entryId) => {
    try {
      const { error } = await approveTimeEntry(entryId);
      if (error) throw error;
      setNotification({ type: 'success', message: 'Time entry approved' });
      loadAllData();
    } catch (error) {
      console.error('Error approving entry:', error);
      setNotification({ type: 'error', message: error.message });
    }
  };

  const handleRejectEntry = async (entryId) => {
    const reason = prompt('Rejection reason (optional):');
    try {
      const { error } = await rejectTimeEntry(entryId, reason);
      if (error) throw error;
      setNotification({ type: 'success', message: 'Time entry rejected' });
      loadAllData();
    } catch (error) {
      console.error('Error rejecting entry:', error);
      setNotification({ type: 'error', message: error.message });
    }
  };

  const handleClockIn = async (memberId) => {
    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 5);

    try {
      const { error } = await createTimeEntry({
        member_id: memberId,
        date: new Date().toISOString().split('T')[0],
        clock_in: timeStr,
        clock_out: null,
        break_minutes: 30,
        status: 'pending'
      });
      if (error) throw error;
      setNotification({ type: 'success', message: 'Clocked in successfully' });
      loadAllData();
    } catch (error) {
      console.error('Error clocking in:', error);
      setNotification({ type: 'error', message: error.message });
    }
  };

  const handleClockOut = async (entryId) => {
    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 5);

    try {
      const { error } = await updateTimeEntry(entryId, { clock_out: timeStr });
      if (error) throw error;
      setNotification({ type: 'success', message: 'Clocked out successfully' });
      loadAllData();
    } catch (error) {
      console.error('Error clocking out:', error);
      setNotification({ type: 'error', message: error.message });
    }
  };

  // Certification Management
  const handleSubmitCert = async (e) => {
    e.preventDefault();
    try {
      if (editingCert) {
        const { error } = await updateCertification(editingCert.id, certForm);
        if (error) throw error;
        setNotification({ type: 'success', message: 'Certification updated' });
      } else {
        const { error } = await createCertification(certForm);
        if (error) throw error;
        setNotification({ type: 'success', message: 'Certification added' });
      }
      resetCertForm();
      loadAllData();
    } catch (error) {
      console.error('Error saving certification:', error);
      setNotification({ type: 'error', message: error.message });
    }
  };

  const resetCertForm = () => {
    setCertForm({
      member_id: '',
      name: '',
      certification_type: '',
      cert_number: '',
      issued_date: '',
      expiry_date: '',
      notes: ''
    });
    setEditingCert(null);
    setShowCertForm(false);
  };

  const handleEditCert = (cert) => {
    setCertForm({
      member_id: cert.member_id,
      name: cert.name,
      certification_type: cert.certification_type || '',
      cert_number: cert.cert_number || '',
      issued_date: cert.issued_date || '',
      expiry_date: cert.expiry_date || '',
      notes: cert.notes || ''
    });
    setEditingCert(cert);
    setShowCertForm(true);
  };

  const handleDeleteCert = async (certId) => {
    if (!confirm('Are you sure you want to delete this certification?')) return;
    try {
      const { error } = await deleteCertification(certId);
      if (error) throw error;
      setNotification({ type: 'success', message: 'Certification deleted' });
      loadAllData();
    } catch (error) {
      console.error('Error deleting certification:', error);
      setNotification({ type: 'error', message: error.message });
    }
  };

  // Calculations
  const calculateHours = (entry) => {
    if (!entry.clock_in || !entry.clock_out) return 0;

    const [inH, inM] = entry.clock_in.split(':').map(Number);
    const [outH, outM] = entry.clock_out.split(':').map(Number);

    const inMins = inH * 60 + inM;
    const outMins = outH * 60 + outM;

    let totalMins = outMins - inMins;
    if (totalMins < 0) totalMins += 24 * 60;

    totalMins -= (entry.break_minutes || 0);

    return Math.max(0, totalMins / 60);
  };

  const calculatePay = (entry, member) => {
    if (!member || !member.hourly_rate) return 0;
    const hours = calculateHours(entry);
    return hours * parseFloat(member.hourly_rate);
  };

  const calculateOvertime = (memberId, weekStart, weekEnd) => {
    const weekEntries = timeEntries.filter(entry =>
      entry.member_id === memberId &&
      entry.date >= weekStart &&
      entry.date <= weekEnd &&
      entry.status === 'approved'
    );

    const totalHours = weekEntries.reduce((sum, entry) => sum + calculateHours(entry), 0);

    return {
      regularHours: Math.min(totalHours, 40),
      overtimeHours: Math.max(0, totalHours - 40)
    };
  };

  // Analytics
  const analytics = useMemo(() => {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const todayStr = now.toISOString().split('T')[0];

    const activeMembers = teamMembers.filter(m => !m.status || m.status === 'active').length;

    const todayEntries = timeEntries.filter(e => e.date === todayStr);
    const clockedInToday = todayEntries.filter(e => e.clock_in && !e.clock_out).length;

    const thisMonthEntries = timeEntries.filter(entry =>
      entry.date >= thisMonthStart && entry.status === 'approved'
    );

    const thisMonthHours = thisMonthEntries.reduce((sum, entry) =>
      sum + calculateHours(entry), 0
    );

    const thisMonthPayroll = thisMonthEntries.reduce((sum, entry) => {
      const member = teamMembers.find(m => m.id === entry.member_id);
      return sum + calculatePay(entry, member);
    }, 0);

    const pendingApprovals = timeEntries.filter(e => e.status === 'pending').length;

    // Labor by field
    const laborByField = {};
    thisMonthEntries.forEach(entry => {
      const blockId = entry.block_id || 'unassigned';
      const blockName = entry.vineyard_blocks?.name || 'Unassigned';
      if (!laborByField[blockId]) {
        laborByField[blockId] = { name: blockName, hours: 0, cost: 0 };
      }
      const member = teamMembers.find(m => m.id === entry.member_id);
      const hours = calculateHours(entry);
      laborByField[blockId].hours += hours;
      laborByField[blockId].cost += calculatePay(entry, member);
    });

    // Labor by task
    const laborByTask = {};
    thisMonthEntries.forEach(entry => {
      const task = entry.task || 'Unassigned';
      if (!laborByTask[task]) {
        laborByTask[task] = { hours: 0, cost: 0 };
      }
      const member = teamMembers.find(m => m.id === entry.member_id);
      const hours = calculateHours(entry);
      laborByTask[task].hours += hours;
      laborByTask[task].cost += calculatePay(entry, member);
    });

    // Labor by member
    const laborByMember = {};
    thisMonthEntries.forEach(entry => {
      const memberId = entry.member_id;
      const memberName = entry.organization_members?.full_name || 'Unknown';
      if (!laborByMember[memberId]) {
        laborByMember[memberId] = { name: memberName, hours: 0, cost: 0, entries: 0 };
      }
      const member = teamMembers.find(m => m.id === entry.member_id);
      const hours = calculateHours(entry);
      laborByMember[memberId].hours += hours;
      laborByMember[memberId].cost += calculatePay(entry, member);
      laborByMember[memberId].entries++;
    });

    // Expiring certifications
    const expiringCerts = certifications.filter(cert => {
      if (!cert.expiry_date) return false;
      const daysUntilExpiry = Math.ceil((new Date(cert.expiry_date) - now) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    });

    return {
      activeMembers,
      clockedInToday,
      thisMonthHours,
      thisMonthPayroll,
      pendingApprovals,
      laborByField: Object.values(laborByField),
      laborByTask: Object.entries(laborByTask).map(([task, data]) => ({ task, ...data })),
      laborByMember: Object.values(laborByMember),
      expiringCerts
    };
  }, [teamMembers, timeEntries, certifications]);

  const roles = [
    'Vineyard Manager',
    'Field Worker',
    'Equipment Operator',
    'Irrigation Specialist',
    'Harvest Crew',
    'Pruning Crew',
    'Spraying Technician',
    'Canopy Management',
    'General Labor',
    'Seasonal Worker',
    'Other'
  ];

  const tasks = [
    'Pruning',
    'Tying',
    'Shoot Thinning',
    'Leaf Removal',
    'Hedging',
    'Mowing',
    'Spraying',
    'Irrigation',
    'Harvesting',
    'Sorting',
    'Equipment Maintenance',
    'General Maintenance',
    'Planting',
    'Other'
  ];

  const certificationTypes = [
    'Pesticide Applicator License',
    'Forklift Operator',
    'Tractor Operator',
    'First Aid/CPR',
    'Food Safety',
    'Equipment Certification',
    'H-2A Compliance',
    'Other'
  ];

  // Export payroll
  const exportPayrollCSV = () => {
    const weekEntries = timeEntries.filter(entry =>
      entry.date >= selectedWeek.start &&
      entry.date <= selectedWeek.end &&
      entry.status === 'approved'
    );

    const payrollData = teamMembers.map(member => {
      const memberEntries = weekEntries.filter(e => e.member_id === member.id);
      if (memberEntries.length === 0) return null;

      const totalHours = memberEntries.reduce((sum, e) => sum + calculateHours(e), 0);
      const regularHours = Math.min(totalHours, 40);
      const overtimeHours = Math.max(0, totalHours - 40);
      const hourlyRate = parseFloat(member.hourly_rate || 0);
      const regularPay = regularHours * hourlyRate;
      const overtimePay = overtimeHours * hourlyRate * 1.5;
      const totalPay = regularPay + overtimePay;

      return {
        name: member.full_name,
        role: member.role,
        regularHours: regularHours.toFixed(2),
        overtimeHours: overtimeHours.toFixed(2),
        totalHours: totalHours.toFixed(2),
        hourlyRate: hourlyRate.toFixed(2),
        regularPay: regularPay.toFixed(2),
        overtimePay: overtimePay.toFixed(2),
        totalPay: totalPay.toFixed(2)
      };
    }).filter(Boolean);

    const headers = ['Name', 'Role', 'Regular Hours', 'OT Hours', 'Total Hours', 'Hourly Rate', 'Regular Pay', 'OT Pay', 'Total Pay'];
    const rows = payrollData.map(d => [
      d.name, d.role, d.regularHours, d.overtimeHours, d.totalHours, d.hourlyRate, d.regularPay, d.overtimePay, d.totalPay
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll_${selectedWeek.start}_to_${selectedWeek.end}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading labor data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Labor Management</h2>
          <p className="text-sm text-gray-600 mt-1">
            Track hours, payroll, and productivity for your team
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{analytics.activeMembers}</div>
            <div className="text-sm text-gray-600">Active Team Members</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{analytics.clockedInToday}</div>
            <div className="text-sm text-gray-600">Working Today</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {analytics.thisMonthHours.toFixed(0)}
            </div>
            <div className="text-sm text-gray-600">Hours This Month</div>
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
              ${analytics.thisMonthPayroll.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
            <div className="text-sm text-gray-600">Payroll This Month</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{analytics.pendingApprovals}</div>
            <div className="text-sm text-gray-600">Pending Approvals</div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {analytics.expiringCerts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-orange-900 mb-1">Certifications Expiring Soon</p>
                <p className="text-sm text-orange-800">
                  {analytics.expiringCerts.length} certification{analytics.expiringCerts.length !== 1 ? 's' : ''} expiring within 30 days. Review in Certifications tab.
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
          { value: 'timeclock', label: 'Time Clock', icon: Clock },
          { value: 'timesheet', label: 'Timesheet', icon: ClipboardList },
          { value: 'payroll', label: 'Payroll', icon: DollarSign },
          { value: 'certifications', label: 'Certifications', icon: Award },
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

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Today's Attendance */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-green-600" />
                Today's Attendance
              </h3>

              {(() => {
                const todayStr = new Date().toISOString().split('T')[0];
                const todayEntries = timeEntries.filter(e => e.date === todayStr);

                if (todayEntries.length === 0) {
                  return (
                    <div className="text-center py-8 text-gray-500">
                      <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>No one clocked in today yet</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {todayEntries.map(entry => {
                      const member = teamMembers.find(m => m.id === entry.member_id);
                      if (!member) return null;

                      const isClockedIn = entry.clock_in && !entry.clock_out;
                      const hours = calculateHours(entry);
                      const block = blocks.find(b => b.id === entry.block_id);

                      return (
                        <div
                          key={entry.id}
                          className={`p-4 rounded-lg border-2 ${
                            isClockedIn ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold text-gray-900">{member.full_name}</p>
                              <p className="text-sm text-gray-600">{member.role}</p>
                            </div>
                            {isClockedIn && (
                              <span className="px-2 py-1 bg-green-600 text-white text-xs font-medium rounded-full">
                                Active
                              </span>
                            )}
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Clock In:</span>
                              <span className="font-medium">{entry.clock_in || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Clock Out:</span>
                              <span className="font-medium">{entry.clock_out || '-'}</span>
                            </div>
                            {entry.clock_out && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Hours:</span>
                                <span className="font-medium">{hours.toFixed(2)}</span>
                              </div>
                            )}
                            {entry.task && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Task:</span>
                                <span className="font-medium">{entry.task}</span>
                              </div>
                            )}
                            {block && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Field:</span>
                                <span className="font-medium">{block.name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {timeEntries
                  .slice()
                  .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                  .slice(0, 10)
                  .map(entry => {
                    const member = teamMembers.find(m => m.id === entry.member_id);
                    if (!member) return null;

                    const hours = calculateHours(entry);
                    const block = blocks.find(b => b.id === entry.block_id);

                    return (
                      <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{member.full_name}</p>
                            <p className="text-sm text-gray-600">
                              {entry.date} • {entry.task || 'No task'} • {hours.toFixed(2)}hrs
                              {block && ` • ${block.name}`}
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          entry.status === 'approved' ? 'bg-green-100 text-green-700' :
                          entry.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {entry.status}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Time Clock Tab */}
      {activeTab === 'timeclock' && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Clock In/Out</h3>
            <p className="text-sm text-gray-600 mb-6">Team members can quickly clock in and out for the day</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamMembers.filter(m => !m.status || m.status === 'active').map(member => {
                const todayStr = new Date().toISOString().split('T')[0];
                const todayEntry = timeEntries.find(e =>
                  e.member_id === member.id &&
                  e.date === todayStr &&
                  e.clock_in &&
                  !e.clock_out
                );

                const isClockedIn = !!todayEntry;

                return (
                  <div
                    key={member.id}
                    className={`p-4 rounded-lg border-2 ${
                      isClockedIn ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">{member.full_name}</p>
                        <p className="text-sm text-gray-600">{member.role}</p>
                      </div>
                      {isClockedIn && (
                        <span className="px-2 py-1 bg-green-600 text-white text-xs font-medium rounded-full animate-pulse">
                          Active
                        </span>
                      )}
                    </div>

                    {isClockedIn ? (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">
                          Clocked in at <span className="font-medium text-gray-900">{todayEntry.clock_in}</span>
                        </p>
                        <Button
                          onClick={() => handleClockOut(todayEntry.id)}
                          className="w-full bg-red-500 hover:bg-red-600 flex items-center justify-center gap-2"
                        >
                          <StopCircle className="w-4 h-4" />
                          Clock Out
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => handleClockIn(member.id)}
                        className="w-full bg-green-500 hover:bg-green-600 flex items-center justify-center gap-2"
                      >
                        <PlayCircle className="w-4 h-4" />
                        Clock In
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>

            {teamMembers.filter(m => !m.status || m.status === 'active').length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <UserX className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No active team members</p>
                <p className="text-sm">Add team members in My Vineyard > Team tab first</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Timesheet Tab - Continuing in next message due to length */}
      {activeTab === 'timesheet' && (
        <div className="space-y-6">
          {!showEntryForm && (
            <div className="flex justify-end">
              <Button
                onClick={() => setShowEntryForm(true)}
                className="bg-teal-600 hover:bg-teal-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Time Entry
              </Button>
            </div>
          )}

          {/* Add/Edit Form */}
          {showEntryForm && (
            <Card className="border-2 border-teal-200 bg-teal-50">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingEntry ? 'Edit Time Entry' : 'Add Time Entry'}
                </h3>
                <form onSubmit={handleSubmitTimeEntry} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Team Member *
                      </label>
                      <select
                        required
                        value={timeEntryForm.member_id}
                        onChange={(e) => setTimeEntryForm({ ...timeEntryForm, member_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="">Select member...</option>
                        {teamMembers.filter(m => !m.status || m.status === 'active').map(member => (
                          <option key={member.id} value={member.id}>{member.full_name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date *
                      </label>
                      <Input
                        required
                        type="date"
                        value={timeEntryForm.date}
                        onChange={(e) => setTimeEntryForm({ ...timeEntryForm, date: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Clock In *
                      </label>
                      <Input
                        required
                        type="time"
                        value={timeEntryForm.clock_in}
                        onChange={(e) => setTimeEntryForm({ ...timeEntryForm, clock_in: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Clock Out *
                      </label>
                      <Input
                        required
                        type="time"
                        value={timeEntryForm.clock_out}
                        onChange={(e) => setTimeEntryForm({ ...timeEntryForm, clock_out: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Break (minutes)
                      </label>
                      <Input
                        type="number"
                        value={timeEntryForm.break_minutes}
                        onChange={(e) => setTimeEntryForm({ ...timeEntryForm, break_minutes: parseInt(e.target.value) || 0 })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Field
                      </label>
                      <select
                        value={timeEntryForm.block_id}
                        onChange={(e) => setTimeEntryForm({ ...timeEntryForm, block_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="">Select field...</option>
                        {blocks.map(block => (
                          <option key={block.id} value={block.id}>{block.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Task
                      </label>
                      <select
                        value={timeEntryForm.task}
                        onChange={(e) => setTimeEntryForm({ ...timeEntryForm, task: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="">Select task...</option>
                        {tasks.map(task => (
                          <option key={task} value={task}>{task}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pieces (if piece rate)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        value={timeEntryForm.pieces}
                        onChange={(e) => setTimeEntryForm({ ...timeEntryForm, pieces: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                      rows="2"
                      value={timeEntryForm.notes}
                      onChange={(e) => setTimeEntryForm({ ...timeEntryForm, notes: e.target.value })}
                      placeholder="Additional notes..."
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" className="bg-teal-600 hover:bg-teal-700">
                      <Save className="w-4 h-4 mr-2" />
                      {editingEntry ? 'Update Entry' : 'Add Entry'}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetTimeEntryForm}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Time Entries List */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Time Entries</h3>

              {/* Filters */}
              <div className="flex gap-3 mb-4">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="space-y-3">
                {timeEntries
                  .filter(e => filterStatus === 'all' || e.status === filterStatus)
                  .slice(0, 50)
                  .map(entry => {
                    const member = teamMembers.find(m => m.id === entry.member_id);
                    if (!member) return null;

                    const hours = calculateHours(entry);
                    const block = blocks.find(b => b.id === entry.block_id);

                    return (
                      <div key={entry.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="font-medium text-gray-900">{member.full_name}</p>
                              <p className="text-sm text-gray-600">
                                {entry.date} • {entry.clock_in} - {entry.clock_out || 'In progress'} • {hours.toFixed(2)}hrs
                              </p>
                              {entry.task && (
                                <p className="text-xs text-gray-500">Task: {entry.task}</p>
                              )}
                              {block && (
                                <p className="text-xs text-gray-500">Field: {block.name}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            entry.status === 'approved' ? 'bg-green-100 text-green-700' :
                            entry.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {entry.status}
                          </span>
                          {entry.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApproveEntry(entry.id)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded"
                                title="Approve"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRejectEntry(entry.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                                title="Reject"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleEditEntry(entry)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payroll Tab */}
      {activeTab === 'payroll' && (
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Weekly Payroll</h3>
                  <p className="text-sm text-gray-600">
                    {selectedWeek.start} to {selectedWeek.end}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedWeek(getWeekDates(new Date(new Date(selectedWeek.start).getTime() - 7 * 24 * 60 * 60 * 1000)))}
                    className="p-2 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedWeek(getWeekDates(new Date(new Date(selectedWeek.start).getTime() + 7 * 24 * 60 * 60 * 1000)))}
                    className="p-2 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <Button onClick={exportPayrollCSV} variant="outline" className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Export CSV
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Regular Hrs</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">OT Hrs</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Hrs</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Rate</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Regular Pay</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">OT Pay</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Pay</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(() => {
                      const weekEntries = timeEntries.filter(entry =>
                        entry.date >= selectedWeek.start &&
                        entry.date <= selectedWeek.end &&
                        entry.status === 'approved'
                      );

                      return teamMembers.map(member => {
                        const memberEntries = weekEntries.filter(e => e.member_id === member.id);
                        if (memberEntries.length === 0) return null;

                        const totalHours = memberEntries.reduce((sum, e) => sum + calculateHours(e), 0);
                        const regularHours = Math.min(totalHours, 40);
                        const overtimeHours = Math.max(0, totalHours - 40);
                        const hourlyRate = parseFloat(member.hourly_rate || 0);
                        const regularPay = regularHours * hourlyRate;
                        const overtimePay = overtimeHours * hourlyRate * 1.5;
                        const totalPay = regularPay + overtimePay;

                        return (
                          <tr key={member.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{member.full_name}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{member.role}</td>
                            <td className="px-4 py-3 text-sm text-right text-gray-900">{regularHours.toFixed(2)}</td>
                            <td className="px-4 py-3 text-sm text-right text-orange-600">{overtimeHours.toFixed(2)}</td>
                            <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">{totalHours.toFixed(2)}</td>
                            <td className="px-4 py-3 text-sm text-right text-gray-600">${hourlyRate.toFixed(2)}</td>
                            <td className="px-4 py-3 text-sm text-right text-gray-900">${regularPay.toFixed(2)}</td>
                            <td className="px-4 py-3 text-sm text-right text-orange-600">${overtimePay.toFixed(2)}</td>
                            <td className="px-4 py-3 text-sm text-right font-bold text-green-600">${totalPay.toFixed(2)}</td>
                          </tr>
                        );
                      }).filter(Boolean);
                    })()}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Certifications Tab */}
      {activeTab === 'certifications' && (
        <div className="space-y-6">
          {!showCertForm && (
            <div className="flex justify-end">
              <Button
                onClick={() => setShowCertForm(true)}
                className="bg-teal-600 hover:bg-teal-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Certification
              </Button>
            </div>
          )}

          {/* Add/Edit Form */}
          {showCertForm && (
            <Card className="border-2 border-teal-200 bg-teal-50">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingCert ? 'Edit Certification' : 'Add Certification'}
                </h3>
                <form onSubmit={handleSubmitCert} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Team Member *
                      </label>
                      <select
                        required
                        value={certForm.member_id}
                        onChange={(e) => setCertForm({ ...certForm, member_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="">Select member...</option>
                        {teamMembers.map(member => (
                          <option key={member.id} value={member.id}>{member.full_name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Certification Type *
                      </label>
                      <select
                        required
                        value={certForm.certification_type}
                        onChange={(e) => setCertForm({ ...certForm, certification_type: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="">Select type...</option>
                        {certificationTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Certification Name *
                      </label>
                      <Input
                        required
                        value={certForm.name}
                        onChange={(e) => setCertForm({ ...certForm, name: e.target.value })}
                        placeholder="e.g., California Pesticide Applicator"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Certificate Number
                      </label>
                      <Input
                        value={certForm.cert_number}
                        onChange={(e) => setCertForm({ ...certForm, cert_number: e.target.value })}
                        placeholder="Cert #"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Issued Date
                      </label>
                      <Input
                        type="date"
                        value={certForm.issued_date}
                        onChange={(e) => setCertForm({ ...certForm, issued_date: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expiry Date *
                      </label>
                      <Input
                        required
                        type="date"
                        value={certForm.expiry_date}
                        onChange={(e) => setCertForm({ ...certForm, expiry_date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                      rows="2"
                      value={certForm.notes}
                      onChange={(e) => setCertForm({ ...certForm, notes: e.target.value })}
                      placeholder="Additional notes..."
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" className="bg-teal-600 hover:bg-teal-700">
                      <Save className="w-4 h-4 mr-2" />
                      {editingCert ? 'Update Certification' : 'Add Certification'}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetCertForm}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Certifications List */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Certifications</h3>
              <div className="space-y-3">
                {certifications.map(cert => {
                  const member = teamMembers.find(m => m.id === cert.member_id);
                  if (!member) return null;

                  const daysUntilExpiry = Math.ceil((new Date(cert.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
                  const isExpiring = daysUntilExpiry <= 30 && daysUntilExpiry > 0;
                  const isExpired = daysUntilExpiry <= 0;

                  return (
                    <div key={cert.id} className={`p-4 rounded-lg border-2 ${
                      isExpired ? 'bg-red-50 border-red-200' :
                      isExpiring ? 'bg-orange-50 border-orange-200' :
                      'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-gray-900">{cert.name}</p>
                            {isExpired && (
                              <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-medium rounded-full">
                                Expired
                              </span>
                            )}
                            {isExpiring && !isExpired && (
                              <span className="px-2 py-0.5 bg-orange-600 text-white text-xs font-medium rounded-full">
                                Expiring Soon
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{member.full_name} • {cert.certification_type}</p>
                          {cert.cert_number && (
                            <p className="text-xs text-gray-500">Certificate #: {cert.cert_number}</p>
                          )}
                          <p className="text-xs text-gray-500">
                            {cert.issued_date && `Issued: ${cert.issued_date} • `}
                            Expires: {cert.expiry_date}
                            {daysUntilExpiry > 0 && ` (${daysUntilExpiry} days)`}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEditCert(cert)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCert(cert.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {certifications.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Award className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No certifications added yet</p>
                  <p className="text-sm">Track important certifications and expiration dates</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Labor by Field */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Labor Cost by Field</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={analytics.laborByField}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="hours" fill="#8884d8" name="Hours" />
                  <Bar yAxisId="right" dataKey="cost" fill="#82ca9d" name="Cost ($)" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Labor by Task */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Hours by Task</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.laborByTask}
                      dataKey="hours"
                      nameKey="task"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {analytics.laborByTask.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Labor Cost by Task</h3>
                <div className="space-y-3">
                  {analytics.laborByTask
                    .sort((a, b) => b.cost - a.cost)
                    .slice(0, 8)
                    .map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-sm text-gray-700">{item.task}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900">${item.cost.toFixed(0)}</p>
                          <p className="text-xs text-gray-500">{item.hours.toFixed(1)}hrs</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Labor by Member */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Labor by Team Member (This Month)</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Entries</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Hours</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cost</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg $/Hr</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {analytics.laborByMember
                      .sort((a, b) => b.hours - a.hours)
                      .map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.name}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-600">{item.entries}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-900">{item.hours.toFixed(1)}</td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">${item.cost.toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-600">
                            ${item.hours > 0 ? (item.cost / item.hours).toFixed(2) : '0.00'}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
