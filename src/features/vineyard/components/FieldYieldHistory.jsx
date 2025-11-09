import React, { useState, useEffect } from 'react';
import { TrendingUp, Plus, Edit2, Trash2, X, Calendar, DollarSign, BarChart3 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { SkeletonCard, SkeletonTable } from '@/shared/components/ui/skeleton';
import {
  listFieldYieldHistory,
  createFieldYieldHistory,
  updateFieldYieldHistory,
  deleteFieldYieldHistory
} from '@/shared/lib/vineyardApi';

export function FieldYieldHistory({ fieldId, fieldName, fieldAcres }) {
  const [yields, setYields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingYield, setEditingYield] = useState(null);
  const [formData, setFormData] = useState({
    harvest_year: new Date().getFullYear(),
    harvest_date: '',
    tons_harvested: '',
    tons_per_acre: '',
    brix: '',
    ph: '',
    ta: '',
    cluster_count: '',
    berry_weight_g: '',
    quality_grade: '',
    destination: '',
    buyer_name: '',
    price_per_ton: '',
    notes: ''
  });

  useEffect(() => {
    if (fieldId) {
      loadYieldHistory();
    }
  }, [fieldId]);

  const loadYieldHistory = async () => {
    setLoading(true);
    const { data, error } = await listFieldYieldHistory(fieldId);
    if (!error && data) {
      setYields(data);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      harvest_year: new Date().getFullYear(),
      harvest_date: '',
      tons_harvested: '',
      tons_per_acre: '',
      brix: '',
      ph: '',
      ta: '',
      cluster_count: '',
      berry_weight_g: '',
      quality_grade: '',
      destination: '',
      buyer_name: '',
      price_per_ton: '',
      notes: ''
    });
    setIsAdding(false);
    setEditingYield(null);
  };

  const handleEdit = (yieldRecord) => {
    setFormData({
      harvest_year: yieldRecord.harvest_year || new Date().getFullYear(),
      harvest_date: yieldRecord.harvest_date || '',
      tons_harvested: yieldRecord.tons_harvested || '',
      tons_per_acre: yieldRecord.tons_per_acre || '',
      brix: yieldRecord.brix || '',
      ph: yieldRecord.ph || '',
      ta: yieldRecord.ta || '',
      cluster_count: yieldRecord.cluster_count || '',
      berry_weight_g: yieldRecord.berry_weight_g || '',
      quality_grade: yieldRecord.quality_grade || '',
      destination: yieldRecord.destination || '',
      buyer_name: yieldRecord.buyer_name || '',
      price_per_ton: yieldRecord.price_per_ton || '',
      notes: yieldRecord.notes || ''
    });
    setEditingYield(yieldRecord);
    setIsAdding(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Convert empty strings to null for numeric fields
    const yieldData = {
      field_id: fieldId,
      harvest_year: parseInt(formData.harvest_year),
      harvest_date: formData.harvest_date || null,
      tons_harvested: formData.tons_harvested ? parseFloat(formData.tons_harvested) : null,
      tons_per_acre: formData.tons_per_acre ? parseFloat(formData.tons_per_acre) : null,
      brix: formData.brix ? parseFloat(formData.brix) : null,
      ph: formData.ph ? parseFloat(formData.ph) : null,
      ta: formData.ta ? parseFloat(formData.ta) : null,
      cluster_count: formData.cluster_count ? parseInt(formData.cluster_count) : null,
      berry_weight_g: formData.berry_weight_g ? parseFloat(formData.berry_weight_g) : null,
      quality_grade: formData.quality_grade || null,
      destination: formData.destination || null,
      buyer_name: formData.buyer_name || null,
      price_per_ton: formData.price_per_ton ? parseFloat(formData.price_per_ton) : null,
      notes: formData.notes || null
    };

    // Calculate tons per acre if tons harvested is provided and tons_per_acre is not
    if (yieldData.tons_harvested && fieldAcres && !yieldData.tons_per_acre) {
      yieldData.tons_per_acre = yieldData.tons_harvested / parseFloat(fieldAcres);
    }

    if (editingYield) {
      const { error } = await updateFieldYieldHistory(editingYield.id, yieldData);
      if (error) {
        alert(`Error updating yield: ${error.message}`);
        return;
      }
    } else {
      const { error } = await createFieldYieldHistory(yieldData);
      if (error) {
        alert(`Error creating yield: ${error.message}`);
        return;
      }
    }

    await loadYieldHistory();
    resetForm();
  };

  const handleDelete = async (yieldId) => {
    if (!confirm('Delete this yield record?')) return;

    const { error } = await deleteFieldYieldHistory(yieldId);
    if (!error) {
      await loadYieldHistory();
    } else {
      alert(`Error deleting yield: ${error.message}`);
    }
  };

  // Calculate statistics
  const stats = yields.length > 0 ? {
    avgTonsPerAcre: yields.reduce((sum, y) => sum + (parseFloat(y.tons_per_acre) || 0), 0) / yields.length,
    avgBrix: yields.filter(y => y.brix).reduce((sum, y) => sum + parseFloat(y.brix), 0) / yields.filter(y => y.brix).length || 0,
    totalRevenue: yields.reduce((sum, y) => {
      const tons = parseFloat(y.tons_harvested) || 0;
      const price = parseFloat(y.price_per_ton) || 0;
      return sum + (tons * price);
    }, 0)
  } : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Yield History</h2>
        {!isAdding && (
          <Button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Harvest Record
          </Button>
        )}
      </div>

      <div>
        {/* Statistics */}
        {stats && (
          <Card className="shadow-sm">
            <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Avg Tons/Acre</p>
                  <TrendingUp className="w-5 h-5 text-gray-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.avgTonsPerAcre.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">Average yield per acre</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Avg Brix</p>
                  <BarChart3 className="w-5 h-5 text-gray-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.avgBrix ? stats.avgBrix.toFixed(1) : 'N/A'}°</p>
                <p className="text-xs text-gray-500 mt-1">Sugar content</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Total Revenue</p>
                  <DollarSign className="w-5 h-5 text-gray-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900">${stats.totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Lifetime earnings</p>
              </div>
            </div>
            </CardContent>
          </Card>
        )}

        {/* Add/Edit Form */}
        {isAdding && (
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="p-1.5 bg-gray-200 rounded-lg">
                  <Plus className="w-5 h-5 text-gray-700" />
                </div>
                {editingYield ? 'Edit Harvest Record' : 'New Harvest Record'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Harvest Year <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.harvest_year}
                      onChange={(e) => setFormData({ ...formData, harvest_year: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Harvest Date
                    </label>
                    <input
                      type="date"
                      value={formData.harvest_date}
                      onChange={(e) => setFormData({ ...formData, harvest_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quality Grade
                    </label>
                    <select
                      value={formData.quality_grade}
                      onChange={(e) => setFormData({ ...formData, quality_grade: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Select...</option>
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="poor">Poor</option>
                    </select>
                  </div>
                </div>

                {/* Yield Data */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tons Harvested
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.tons_harvested}
                      onChange={(e) => setFormData({ ...formData, tons_harvested: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tons/Acre
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.tons_per_acre}
                      onChange={(e) => setFormData({ ...formData, tons_per_acre: e.target.value })}
                      placeholder="Auto-calculated if empty"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                {/* Quality Metrics */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Brix (°)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.brix}
                      onChange={(e) => setFormData({ ...formData, brix: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      pH
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.ph}
                      onChange={(e) => setFormData({ ...formData, ph: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      TA (g/L)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.ta}
                      onChange={(e) => setFormData({ ...formData, ta: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                {/* Sales Info */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Destination
                    </label>
                    <select
                      value={formData.destination}
                      onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Select...</option>
                      <option value="winery">Own Winery</option>
                      <option value="sold">Sold</option>
                      <option value="discarded">Discarded</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Buyer Name
                    </label>
                    <input
                      type="text"
                      value={formData.buyer_name}
                      onChange={(e) => setFormData({ ...formData, buyer_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price/Ton ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price_per_ton}
                      onChange={(e) => setFormData({ ...formData, price_per_ton: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                    {editingYield ? 'Update' : 'Add'} Record
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Yield Records List */}
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div className="p-1.5 bg-gray-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-gray-600" />
              </div>
              Harvest Records
              <span className="text-sm font-normal text-gray-500">({yields.length})</span>
            </h3>

            {loading ? (
              <SkeletonTable rows={5} columns={6} />
            ) : yields.length === 0 ? (
              <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
                <div className="inline-block p-4 bg-white rounded-full shadow-sm mb-4">
                  <TrendingUp className="w-12 h-12 text-gray-400" />
                </div>
                <p className="text-gray-700 font-semibold text-lg">No harvest records yet</p>
                <p className="text-sm text-gray-500 mt-2">Add your first harvest record above to start tracking yields</p>
              </div>
            ) : (
              <div className="space-y-4">
                {yields.map((yieldRecord) => (
                  <div key={yieldRecord.id} className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-amber-300 transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="text-lg font-bold text-gray-900">{yieldRecord.harvest_year}</h4>
                          {yieldRecord.quality_grade && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              yieldRecord.quality_grade === 'excellent' ? 'bg-green-100 text-green-800' :
                              yieldRecord.quality_grade === 'good' ? 'bg-blue-100 text-blue-800' :
                              yieldRecord.quality_grade === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {yieldRecord.quality_grade}
                            </span>
                          )}
                        </div>
                        {yieldRecord.harvest_date && (
                          <p className="text-sm text-gray-600 mt-1">
                            {new Date(yieldRecord.harvest_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(yieldRecord)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all hover:scale-110"
                          title="Edit record"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(yieldRecord.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all hover:scale-110"
                          title="Delete record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-sm">
                      {yieldRecord.tons_harvested && (
                        <div>
                          <p className="text-gray-600">Tons Harvested</p>
                          <p className="font-semibold text-gray-900">{parseFloat(yieldRecord.tons_harvested).toFixed(2)}</p>
                        </div>
                      )}
                      {yieldRecord.tons_per_acre && (
                        <div>
                          <p className="text-gray-600">Tons/Acre</p>
                          <p className="font-semibold text-gray-900">{parseFloat(yieldRecord.tons_per_acre).toFixed(2)}</p>
                        </div>
                      )}
                      {yieldRecord.brix && (
                        <div>
                          <p className="text-gray-600">Brix</p>
                          <p className="font-semibold text-gray-900">{parseFloat(yieldRecord.brix).toFixed(1)}°</p>
                        </div>
                      )}
                      {yieldRecord.price_per_ton && (
                        <div>
                          <p className="text-gray-600">Revenue</p>
                          <p className="font-semibold text-green-600">
                            ${((parseFloat(yieldRecord.tons_harvested) || 0) * parseFloat(yieldRecord.price_per_ton)).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>

                    {yieldRecord.notes && (
                      <p className="text-sm text-gray-600 mt-3 pt-3 border-t border-gray-200">
                        {yieldRecord.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
