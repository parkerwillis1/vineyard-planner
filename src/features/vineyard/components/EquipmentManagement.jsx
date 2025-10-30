import React, { useState, useEffect } from 'react';
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
  Settings
} from 'lucide-react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';

export function EquipmentManagement() {
  const { user } = useAuth();
  const [equipment, setEquipment] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [isAddingEquipment, setIsAddingEquipment] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    manufacturer: '',
    model: '',
    year: '',
    serialNumber: '',
    purchasePrice: '',
    purchaseDate: '',
    hoursUsed: '',
    status: 'operational',
    notes: ''
  });

  // Load data
  useEffect(() => {
    if (user) {
      const loadedEquipment = JSON.parse(localStorage.getItem(`vineyard_equipment_${user.id}`) || '[]');
      const loadedMaintenance = JSON.parse(localStorage.getItem(`vineyard_maintenance_${user.id}`) || '[]');
      setEquipment(loadedEquipment);
      setMaintenance(loadedMaintenance);
    }
  }, [user]);

  // Save equipment
  const saveEquipment = (newEquipment) => {
    if (user) {
      localStorage.setItem(`vineyard_equipment_${user.id}`, JSON.stringify(newEquipment));
      setEquipment(newEquipment);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (editingEquipment) {
      const updated = equipment.map(eq =>
        eq.id === editingEquipment.id ? { ...formData, id: eq.id } : eq
      );
      saveEquipment(updated);
      setEditingEquipment(null);
    } else {
      const newEquipment = {
        ...formData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      saveEquipment([...equipment, newEquipment]);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      manufacturer: '',
      model: '',
      year: '',
      serialNumber: '',
      purchasePrice: '',
      purchaseDate: '',
      hoursUsed: '',
      status: 'operational',
      notes: ''
    });
    setIsAddingEquipment(false);
    setEditingEquipment(null);
  };

  const handleEdit = (eq) => {
    setFormData(eq);
    setEditingEquipment(eq);
    setIsAddingEquipment(true);
  };

  const handleDelete = (eqId) => {
    if (confirm('Are you sure you want to delete this equipment?')) {
      saveEquipment(equipment.filter(eq => eq.id !== eqId));
    }
  };

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

  const statusColors = {
    operational: 'green',
    maintenance: 'yellow',
    repair: 'red',
    retired: 'gray'
  };

  const getMaintenanceStatus = (equipmentId) => {
    const eqMaintenance = maintenance.filter(m => m.equipmentId === equipmentId);
    const overdue = eqMaintenance.filter(m => {
      if (!m.nextDue) return false;
      return new Date(m.nextDue) < new Date();
    });
    return {
      total: eqMaintenance.length,
      overdue: overdue.length,
      nextDue: eqMaintenance
        .filter(m => m.nextDue && new Date(m.nextDue) >= new Date())
        .sort((a, b) => new Date(a.nextDue) - new Date(b.nextDue))[0]
    };
  };

  const totalValue = equipment.reduce((sum, eq) => sum + (parseFloat(eq.purchasePrice) || 0), 0);
  const operationalCount = equipment.filter(eq => eq.status === 'operational').length;
  const maintenanceNeeded = equipment.filter(eq => {
    const status = getMaintenanceStatus(eq.id);
    return status.overdue > 0;
  }).length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                <Wrench className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{equipment.length}</div>
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
            <div className="text-3xl font-bold text-gray-900 mb-1">{operationalCount}</div>
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
            <div className="text-3xl font-bold text-gray-900 mb-1">{maintenanceNeeded}</div>
            <div className="text-sm text-gray-600">Needs Maintenance</div>
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
              ${totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
            <div className="text-sm text-gray-600">Total Value</div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      {!isAddingEquipment && (
        <div className="flex justify-end">
          <Button
            onClick={() => setIsAddingEquipment(true)}
            className="bg-vine-green-500 hover:bg-vine-green-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Equipment
          </Button>
        </div>
      )}

      {/* Add/Edit Form */}
      {isAddingEquipment && (
        <Card className="border-2 border-vine-green-200 bg-vine-green-50">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingEquipment ? 'Edit Equipment' : 'Add New Equipment'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Equipment Name *
                  </label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Main Tractor"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type *
                  </label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vine-green-500"
                  >
                    <option value="">Select type...</option>
                    {equipmentTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Manufacturer
                  </label>
                  <Input
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    placeholder="e.g., John Deere"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model
                  </label>
                  <Input
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="e.g., 5075E"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year
                  </label>
                  <Input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    placeholder="e.g., 2020"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Serial Number
                  </label>
                  <Input
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    placeholder="Serial #"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purchase Price
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purchase Date
                  </label>
                  <Input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hours Used
                  </label>
                  <Input
                    type="number"
                    value={formData.hoursUsed}
                    onChange={(e) => setFormData({ ...formData, hoursUsed: e.target.value })}
                    placeholder="0"
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
                    <option value="operational">Operational</option>
                    <option value="maintenance">In Maintenance</option>
                    <option value="repair">Needs Repair</option>
                    <option value="retired">Retired</option>
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
                  {editingEquipment ? 'Update Equipment' : 'Add Equipment'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Equipment List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {equipment.map((eq) => {
          const maintenanceStatus = getMaintenanceStatus(eq.id);
          const statusColor = statusColors[eq.status] || 'gray';

          return (
            <Card key={eq.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{eq.name}</h3>
                    <p className="text-sm text-gray-600">{eq.type}</p>
                    {eq.manufacturer && eq.model && (
                      <p className="text-xs text-gray-500 mt-1">
                        {eq.manufacturer} {eq.model}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(eq)}
                      className="p-2 text-gray-600 hover:text-vine-green-600 hover:bg-gray-100 rounded"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(eq.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Status:</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium bg-${statusColor}-100 text-${statusColor}-700 capitalize`}
                    >
                      {eq.status}
                    </span>
                  </div>

                  {eq.year && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Year:</span>
                      <span className="font-medium text-gray-900">{eq.year}</span>
                    </div>
                  )}

                  {eq.hoursUsed && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Hours:
                      </span>
                      <span className="font-medium text-gray-900">{eq.hoursUsed}</span>
                    </div>
                  )}

                  {eq.purchasePrice && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Value:</span>
                      <span className="font-medium text-gray-900">
                        ${parseFloat(eq.purchasePrice).toLocaleString()}
                      </span>
                    </div>
                  )}

                  {maintenanceStatus.overdue > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-amber-600">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {maintenanceStatus.overdue} overdue maintenance
                        </span>
                      </div>
                    </div>
                  )}

                  {maintenanceStatus.nextDue && maintenanceStatus.overdue === 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-blue-600">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">
                          Next service: {new Date(maintenanceStatus.nextDue.nextDue).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {equipment.length === 0 && !isAddingEquipment && (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="py-12 text-center">
            <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No equipment added yet</p>
            <p className="text-sm text-gray-500">
              Start by adding your vineyard equipment to track maintenance and costs
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
