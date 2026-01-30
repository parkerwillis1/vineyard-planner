import React, { useState, useEffect } from 'react';
import {
  List,
  Plus,
  Filter,
  Calendar,
  Wine,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  AlertCircle,
  ChevronDown,
  X,
  Trash2,
  Edit2
} from 'lucide-react';
import {
  listTTBTransactions,
  createTTBTransaction,
  deleteTTBTransaction
} from '@/shared/lib/ttbApi';
import {
  TAX_CLASSES,
  TAX_CLASS_LABELS,
  TAX_CLASS_SHORT_LABELS,
  TRANSACTION_TYPES,
  TRANSACTION_TYPE_LABELS,
  TRANSACTION_LINE_NUMBERS,
  getTransactionTypeOptions,
  getAvailablePeriods
} from '@/shared/lib/ttbUtils';
import { listLots } from '@/shared/lib/productionApi';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';

export function TTBTransactionLog() {
  const [transactions, setTransactions] = useState([]);
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Filters
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [filterTaxClass, setFilterTaxClass] = useState('all');
  const [filterType, setFilterType] = useState('all');

  // Add transaction modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    transaction_type: '',
    tax_class: '',
    volume_gallons: '',
    lot_id: '',
    transaction_date: new Date().toISOString().split('T')[0],
    counterparty_registry: '',
    counterparty_name: '',
    reference_number: '',
    notes: ''
  });

  // Confirm dialog
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    variant: 'danger'
  });

  // Period options for filter
  const periods = getAvailablePeriods('monthly', 2);

  useEffect(() => {
    loadData();
  }, [filterPeriod, filterTaxClass, filterType]);

  async function loadData() {
    setLoading(true);
    try {
      // Build filters
      const filters = { limit: 200 };

      if (filterPeriod !== 'all') {
        const period = periods.find(p => p.value === filterPeriod);
        if (period) {
          filters.startDate = period.start.toISOString().split('T')[0];
          filters.endDate = period.end.toISOString().split('T')[0];
        }
      }

      if (filterTaxClass !== 'all') {
        filters.taxClass = filterTaxClass;
      }

      if (filterType !== 'all') {
        filters.transactionType = filterType;
      }

      const [txResult, lotsResult] = await Promise.all([
        listTTBTransactions(filters),
        listLots()
      ]);

      if (txResult.error) throw txResult.error;
      if (lotsResult.error) throw lotsResult.error;

      setTransactions(txResult.data || []);
      setLots(lotsResult.data || []);
    } catch (err) {
      console.error('Error loading transactions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!formData.transaction_type) {
      setError('Transaction type is required');
      return;
    }
    if (!formData.tax_class) {
      setError('Tax class is required');
      return;
    }
    if (!formData.volume_gallons || parseFloat(formData.volume_gallons) <= 0) {
      setError('Volume must be greater than 0');
      return;
    }

    setSaving(true);
    try {
      const txData = {
        transaction_type: formData.transaction_type,
        tax_class: formData.tax_class,
        volume_gallons: parseFloat(formData.volume_gallons),
        lot_id: formData.lot_id || null,
        transaction_date: formData.transaction_date,
        counterparty_registry: formData.counterparty_registry || null,
        counterparty_name: formData.counterparty_name || null,
        reference_number: formData.reference_number || null,
        notes: formData.notes || null
      };

      const { error } = await createTTBTransaction(txData);
      if (error) throw error;

      setSuccess('Transaction recorded successfully');
      setShowAddModal(false);
      resetForm();
      loadData();
    } catch (err) {
      console.error('Error creating transaction:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(txId) {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Transaction',
      message: 'Are you sure you want to delete this TTB transaction? This cannot be undone and may affect your report accuracy.',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const { error } = await deleteTTBTransaction(txId);
          if (error) throw error;
          setSuccess('Transaction deleted');
          loadData();
        } catch (err) {
          console.error('Error deleting transaction:', err);
          setError(err.message);
        }
      }
    });
  }

  function resetForm() {
    setFormData({
      transaction_type: '',
      tax_class: '',
      volume_gallons: '',
      lot_id: '',
      transaction_date: new Date().toISOString().split('T')[0],
      counterparty_registry: '',
      counterparty_name: '',
      reference_number: '',
      notes: ''
    });
  }

  function isAdditionType(type) {
    return [
      TRANSACTION_TYPES.BULK_ON_HAND_BEGIN,
      TRANSACTION_TYPES.PRODUCED_FERMENTATION,
      TRANSACTION_TYPES.PRODUCED_SWEETENING,
      TRANSACTION_TYPES.PRODUCED_SPIRITS,
      TRANSACTION_TYPES.PRODUCED_BLENDING,
      TRANSACTION_TYPES.PRODUCED_AMELIORATION,
      TRANSACTION_TYPES.RECEIVED_BOND,
      TRANSACTION_TYPES.BOTTLED_DUMPED_BULK,
      TRANSACTION_TYPES.BULK_INVENTORY_GAIN,
      TRANSACTION_TYPES.BOTTLED_ON_HAND_BEGIN,
      TRANSACTION_TYPES.BOTTLED_PRODUCED,
      TRANSACTION_TYPES.BOTTLED_RECEIVED_BOND,
      TRANSACTION_TYPES.BOTTLED_INVENTORY_GAIN
    ].includes(type);
  }

  const transactionOptions = getTransactionTypeOptions();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#7C203A] animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="pt-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">TTB Transaction Log</h1>
          <p className="text-sm text-gray-500 mt-1">
            All reportable transactions for Form 5120.17
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#7C203A] text-white rounded-xl hover:bg-[#7C203A]/90 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Transaction
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <Filter className="w-5 h-5 text-[#7C203A]" />
          <h2 className="font-semibold text-gray-900">Filters</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
            <select
              value={filterPeriod}
              onChange={e => setFilterPeriod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A]/20 focus:border-[#7C203A]"
            >
              <option value="all">All Time</option>
              {periods.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tax Class</label>
            <select
              value={filterTaxClass}
              onChange={e => setFilterTaxClass(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A]/20 focus:border-[#7C203A]"
            >
              <option value="all">All Classes</option>
              {Object.entries(TAX_CLASS_SHORT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A]/20 focus:border-[#7C203A]"
            >
              <option value="all">All Types</option>
              <optgroup label="Bulk Additions">
                {transactionOptions.bulk_additions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </optgroup>
              <optgroup label="Bulk Removals">
                {transactionOptions.bulk_removals.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </optgroup>
              <optgroup label="Bottled Additions">
                {transactionOptions.bottled_additions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </optgroup>
              <optgroup label="Bottled Removals">
                {transactionOptions.bottled_removals.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {transactions.length === 0 ? (
          <div className="p-12 text-center">
            <List className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Transactions</h3>
            <p className="text-gray-500 mb-4">
              No TTB transactions found for the selected filters.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#7C203A] text-white rounded-lg hover:bg-[#7C203A]/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Manual Transaction
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {transactions.map(tx => {
              const isAddition = isAdditionType(tx.transaction_type);
              const lineNumber = TRANSACTION_LINE_NUMBERS[tx.transaction_type] || '';

              return (
                <div key={tx.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${isAddition ? 'bg-green-100' : 'bg-red-100'}`}>
                        {isAddition ? (
                          <ArrowDownLeft className={`w-5 h-5 text-green-600`} />
                        ) : (
                          <ArrowUpRight className={`w-5 h-5 text-red-600`} />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">
                            {TRANSACTION_TYPE_LABELS[tx.transaction_type] || tx.transaction_type}
                          </span>
                          {lineNumber && (
                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                              Line {lineNumber}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(tx.transaction_date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Wine className="w-4 h-4" />
                            {TAX_CLASS_SHORT_LABELS[tx.tax_class] || tx.tax_class}
                          </span>
                          {tx.lot && (
                            <span className="text-[#7C203A]">
                              {tx.lot.name}
                            </span>
                          )}
                        </div>

                        {tx.notes && (
                          <p className="text-sm text-gray-500 mt-1">{tx.notes}</p>
                        )}

                        {(tx.counterparty_name || tx.counterparty_registry) && (
                          <p className="text-sm text-gray-500 mt-1">
                            Counterparty: {tx.counterparty_name || tx.counterparty_registry}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className={`text-lg font-bold ${isAddition ? 'text-green-600' : 'text-red-600'}`}>
                          {isAddition ? '+' : '-'}{parseFloat(tx.volume_gallons).toFixed(2)} gal
                        </div>
                        {tx.source_event_type && (
                          <span className="text-xs text-gray-400">Auto-logged</span>
                        )}
                      </div>

                      {!tx.source_event_type && (
                        <button
                          onClick={() => handleDelete(tx.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete transaction"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Add TTB Transaction</h2>
              <button
                onClick={() => { setShowAddModal(false); resetForm(); }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transaction Type *
                </label>
                <select
                  value={formData.transaction_type}
                  onChange={e => handleChange('transaction_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A]/20 focus:border-[#7C203A]"
                  required
                >
                  <option value="">Select type...</option>
                  <optgroup label="Bulk Additions">
                    {transactionOptions.bulk_additions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label} ({opt.line})</option>
                    ))}
                  </optgroup>
                  <optgroup label="Bulk Removals">
                    {transactionOptions.bulk_removals.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label} ({opt.line})</option>
                    ))}
                  </optgroup>
                  <optgroup label="Bottled Additions">
                    {transactionOptions.bottled_additions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label} ({opt.line})</option>
                    ))}
                  </optgroup>
                  <optgroup label="Bottled Removals">
                    {transactionOptions.bottled_removals.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label} ({opt.line})</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tax Class *
                </label>
                <select
                  value={formData.tax_class}
                  onChange={e => handleChange('tax_class', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A]/20 focus:border-[#7C203A]"
                  required
                >
                  <option value="">Select tax class...</option>
                  {Object.entries(TAX_CLASS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Volume (gallons) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.volume_gallons}
                    onChange={e => handleChange('volume_gallons', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A]/20 focus:border-[#7C203A]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transaction Date *
                  </label>
                  <input
                    type="date"
                    value={formData.transaction_date}
                    onChange={e => handleChange('transaction_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A]/20 focus:border-[#7C203A]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Related Lot
                </label>
                <select
                  value={formData.lot_id}
                  onChange={e => handleChange('lot_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A]/20 focus:border-[#7C203A]"
                >
                  <option value="">None</option>
                  {lots.map(lot => (
                    <option key={lot.id} value={lot.id}>
                      {lot.name} - {lot.varietal} {lot.vintage}
                    </option>
                  ))}
                </select>
              </div>

              {/* Counterparty fields for transfers */}
              {(formData.transaction_type?.includes('transferred') ||
                formData.transaction_type?.includes('received')) && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Counterparty Registry
                    </label>
                    <input
                      type="text"
                      value={formData.counterparty_registry}
                      onChange={e => handleChange('counterparty_registry', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A]/20 focus:border-[#7C203A]"
                      placeholder="BWC-XX-####"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Counterparty Name
                    </label>
                    <input
                      type="text"
                      value={formData.counterparty_name}
                      onChange={e => handleChange('counterparty_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A]/20 focus:border-[#7C203A]"
                      placeholder="Other winery name"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference Number
                </label>
                <input
                  type="text"
                  value={formData.reference_number}
                  onChange={e => handleChange('reference_number', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A]/20 focus:border-[#7C203A]"
                  placeholder="Invoice, BOL, or other reference"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={e => handleChange('notes', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A]/20 focus:border-[#7C203A]"
                  rows={3}
                  placeholder="Additional details..."
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); resetForm(); }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-[#7C203A] text-white rounded-lg hover:bg-[#7C203A]/90 transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Transaction'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        onConfirm={() => {
          confirmDialog.onConfirm?.();
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
