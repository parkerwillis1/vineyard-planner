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
  FileText
} from 'lucide-react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';

export function LaborManagement() {
  const { user } = useAuth();
  const [workers, setWorkers] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [isAddingWorker, setIsAddingWorker] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);
  const [activeTab, setActiveTab] = useState('workers'); // workers, timesheet, payroll
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    hourlyRate: '',
    phone: '',
    email: '',
    startDate: '',
    status: 'active',
    notes: ''
  });

  // Load data
  useEffect(() => {
    if (user) {
      const loadedWorkers = JSON.parse(localStorage.getItem(`vineyard_workers_${user.id}`) || '[]');
      const loadedTimeEntries = JSON.parse(localStorage.getItem(`vineyard_time_entries_${user.id}`) || '[]');
      setWorkers(loadedWorkers);
      setTimeEntries(loadedTimeEntries);
    }
  }, [user]);

  // Save workers
  const saveWorkers = (newWorkers) => {
    if (user) {
      localStorage.setItem(`vineyard_workers_${user.id}`, JSON.stringify(newWorkers));
      setWorkers(newWorkers);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (editingWorker) {
      const updated = workers.map(w =>
        w.id === editingWorker.id ? { ...formData, id: w.id } : w
      );
      saveWorkers(updated);
      setEditingWorker(null);
    } else {
      const newWorker = {
        ...formData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      saveWorkers([...workers, newWorker]);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      role: '',
      hourlyRate: '',
      phone: '',
      email: '',
      startDate: '',
      status: 'active',
      notes: ''
    });
    setIsAddingWorker(false);
    setEditingWorker(null);
  };

  const handleEdit = (worker) => {
    setFormData(worker);
    setEditingWorker(worker);
    setIsAddingWorker(true);
  };

  const handleDelete = (workerId) => {
    if (confirm('Are you sure you want to delete this worker?')) {
      saveWorkers(workers.filter(w => w.id !== workerId));
    }
  };

  const roles = [
    'Vineyard Manager',
    'Field Worker',
    'Equipment Operator',
    'Irrigation Specialist',
    'Harvest Crew',
    'Pruning Crew',
    'Spraying Technician',
    'General Labor',
    'Seasonal Worker',
    'Other'
  ];

  // Calculate analytics
  const analytics = useMemo(() => {
    const activeWorkers = workers.filter(w => w.status === 'active').length;
    const totalPayroll = timeEntries.reduce((sum, entry) => {
      const worker = workers.find(w => w.id === entry.workerId);
      const rate = parseFloat(worker?.hourlyRate || 0);
      const hours = parseFloat(entry.hours || 0);
      return sum + (rate * hours);
    }, 0);

    const thisMonthEntries = timeEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      const now = new Date();
      return entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear();
    });

    const thisMonthHours = thisMonthEntries.reduce((sum, e) => sum + (parseFloat(e.hours) || 0), 0);
    const thisMonthPayroll = thisMonthEntries.reduce((sum, entry) => {
      const worker = workers.find(w => w.id === entry.workerId);
      const rate = parseFloat(worker?.hourlyRate || 0);
      const hours = parseFloat(entry.hours || 0);
      return sum + (rate * hours);
    }, 0);

    return {
      activeWorkers,
      totalPayroll,
      thisMonthHours,
      thisMonthPayroll
    };
  }, [workers, timeEntries]);

  const getWorkerHours = (workerId, period = 'month') => {
    const now = new Date();
    return timeEntries
      .filter(entry => {
        if (entry.workerId !== workerId) return false;
        const entryDate = new Date(entry.date);
        if (period === 'month') {
          return entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear();
        }
        return true;
      })
      .reduce((sum, e) => sum + (parseFloat(e.hours) || 0), 0);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{workers.length}</div>
            <div className="text-sm text-gray-600">Total Workers</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{analytics.activeWorkers}</div>
            <div className="text-sm text-gray-600">Active Workers</div>
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
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {[
          { value: 'workers', label: 'Workers', icon: Users },
          { value: 'timesheet', label: 'Timesheet', icon: Clock },
          { value: 'payroll', label: 'Payroll', icon: DollarSign }
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2 ${
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

      {/* Workers Tab */}
      {activeTab === 'workers' && (
        <>
          {!isAddingWorker && (
            <div className="flex justify-end">
              <Button
                onClick={() => setIsAddingWorker(true)}
                className="bg-vine-green-500 hover:bg-vine-green-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Worker
              </Button>
            </div>
          )}

          {/* Add/Edit Form */}
          {isAddingWorker && (
            <Card className="border-2 border-vine-green-200 bg-vine-green-50">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingWorker ? 'Edit Worker' : 'Add New Worker'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <Input
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="John Doe"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role *
                      </label>
                      <select
                        required
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vine-green-500"
                      >
                        <option value="">Select role...</option>
                        {roles.map(role => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hourly Rate *
                      </label>
                      <Input
                        required
                        type="number"
                        step="0.01"
                        value={formData.hourlyRate}
                        onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="(555) 123-4567"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="email@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <Input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status *
                      </label>
                      <select
                        required
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vine-green-500"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="seasonal">Seasonal</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vine-green-500"
                      rows="3"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Additional notes..."
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" className="bg-vine-green-500 hover:bg-vine-green-600">
                      {editingWorker ? 'Update Worker' : 'Add Worker'}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Workers List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workers.map((worker) => {
              const monthHours = getWorkerHours(worker.id, 'month');
              const monthPay = monthHours * parseFloat(worker.hourlyRate || 0);

              return (
                <Card key={worker.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900">{worker.name}</h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              worker.status === 'active'
                                ? 'bg-green-100 text-green-700'
                                : worker.status === 'seasonal'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {worker.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{worker.role}</p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(worker)}
                          className="p-2 text-gray-600 hover:text-vine-green-600 hover:bg-gray-100 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(worker.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Hourly Rate:</span>
                        <span className="font-medium text-gray-900">
                          ${parseFloat(worker.hourlyRate || 0).toFixed(2)}/hr
                        </span>
                      </div>

                      {worker.phone && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Phone:</span>
                          <span className="font-medium text-gray-900">{worker.phone}</span>
                        </div>
                      )}

                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-2">This Month</p>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Hours:</span>
                          <span className="font-semibold text-gray-900">{monthHours.toFixed(1)}</span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-gray-600">Earned:</span>
                          <span className="font-semibold text-vine-green-600">
                            ${monthPay.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {workers.length === 0 && !isAddingWorker && (
            <Card className="border-2 border-dashed border-gray-300">
              <CardContent className="py-12 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">No workers added yet</p>
                <p className="text-sm text-gray-500">
                  Start by adding your vineyard workers to track labor and payroll
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Timesheet & Payroll Tabs */}
      {activeTab !== 'workers' && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">{activeTab === 'timesheet' ? 'Timesheet' : 'Payroll'} Coming Soon</p>
              <p className="text-sm text-gray-500">
                Full time tracking and payroll features will be available in the next update
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
