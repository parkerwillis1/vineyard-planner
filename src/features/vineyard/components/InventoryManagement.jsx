import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/auth/AuthContext';
import { DocLink } from '@/shared/components/DocLink';
import { LoadingSpinner } from './LoadingSpinner';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Search,
  Download,
  Calendar,
  DollarSign,
  History,
  Shield,
  Droplet,
  Sprout,
  HardHat,
  Box
} from 'lucide-react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  listInventoryItems,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  adjustInventoryStock,
  listInventoryTransactions
} from '@/shared/lib/vineyardApi';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function InventoryManagement() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTransactions, setShowTransactions] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');
  const [formData, setFormData] = useState({
    category: 'chemical',
    name: '',
    manufacturer: '',
    product_code: '',
    unit: 'gal',
    on_hand_qty: 0,
    min_qty: 0,
    max_qty: null,
    unit_cost: null,
    lot_number: '',
    expires_on: '',
    // Chemical-specific
    epa_reg_no: '',
    frac_code: '',
    hrac_code: '',
    irac_code: '',
    rei_hours: null,
    phi_days: null,
    active_ingredient: '',
    concentration: '',
    signal_word: '',
    storage_location: '',
    sds_url: '',
    notes: ''
  });

  // Load items
  useEffect(() => {
    if (user) {
      loadInventory();
      loadTransactions();
    }
  }, [user, selectedCategory]);

  const loadInventory = async () => {
    setLoading(true);
    const category = selectedCategory === 'all' ? null : selectedCategory;
    const { data, error } = await listInventoryItems(category);
    if (!error && data) {
      setItems(data);
    }
    setLoading(false);
  };

  const loadTransactions = async () => {
    const { data, error } = await listInventoryTransactions(null, 50);
    if (!error && data) {
      setTransactions(data);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const itemData = { ...formData };

    // Convert empty strings to null for numeric fields
    ['on_hand_qty', 'min_qty', 'max_qty', 'unit_cost', 'rei_hours', 'phi_days'].forEach(field => {
      if (itemData[field] === '' || itemData[field] === null) {
        itemData[field] = field === 'on_hand_qty' ? 0 : null;
      }
    });

    // Convert empty date strings to null
    if (itemData.expires_on === '' || itemData.expires_on === null) {
      itemData.expires_on = null;
    }

    console.log('📦 Submitting inventory item:', itemData);

    if (editingItem) {
      const { data, error } = await updateInventoryItem(editingItem.id, itemData);
      if (error) {
        console.error('❌ Error updating item:', error);
        alert(`Error updating item: ${error.message}`);
      } else {
        console.log('✅ Item updated successfully:', data);
        await loadInventory();
        resetForm();
      }
    } else {
      const { data, error } = await createInventoryItem(itemData);
      if (error) {
        console.error('❌ Error creating item:', error);
        console.error('Full error details:', JSON.stringify(error, null, 2));
        alert(`Error creating item: ${error.message}\n\nDetails: ${error.hint || error.details || 'Check console for more info'}`);
      } else {
        console.log('✅ Item created successfully:', data);
        await loadInventory();
        resetForm();
      }
    }
  };

  const resetForm = () => {
    setFormData({
      category: 'chemical',
      name: '',
      manufacturer: '',
      product_code: '',
      unit: 'gal',
      on_hand_qty: 0,
      min_qty: 0,
      max_qty: null,
      unit_cost: null,
      lot_number: '',
      expires_on: '',
      epa_reg_no: '',
      frac_code: '',
      hrac_code: '',
      irac_code: '',
      rei_hours: null,
      phi_days: null,
      active_ingredient: '',
      concentration: '',
      signal_word: '',
      storage_location: '',
      sds_url: '',
      notes: ''
    });
    setIsAddingItem(false);
    setEditingItem(null);
  };

  const handleEdit = (item) => {
    setFormData(item);
    setEditingItem(item);
    setIsAddingItem(true);
  };

  const handleDelete = async (itemId) => {
    if (confirm('Are you sure you want to delete this item?')) {
      const { error } = await deleteInventoryItem(itemId);
      if (!error) {
        await loadInventory();
      }
    }
  };

  const handleAdjustStock = async (item, quantity) => {
    const reason = prompt(`Adjusting ${item.name} by ${quantity} ${item.unit}. Enter reason:`);
    if (reason !== null) {
      await adjustInventoryStock(item.id, parseFloat(quantity), 'adjust', reason);
      await loadInventory();
      await loadTransactions();
    }
  };

  const handleExport = () => {
    setShowExportDialog(true);
  };

  const confirmExport = () => {
    setShowExportDialog(false);

    if (exportFormat === 'csv') {
      exportCSV();
    } else {
      exportPDF();
    }
  };

  const exportCSV = () => {
    // Create CSV header
    const headers = [
      'Category',
      'Name',
      'Manufacturer',
      'Product Code',
      'On Hand',
      'Unit',
      'Min Qty',
      'Max Qty',
      'Unit Cost',
      'Total Value',
      'Lot Number',
      'Expires On',
      'Storage Location',
      'EPA Reg No',
      'FRAC Code',
      'REI Hours',
      'PHI Days',
      'Active Ingredient',
      'Signal Word'
    ];

    // Create CSV rows
    const rows = filteredItems.map(item => [
      item.category,
      item.name,
      item.manufacturer || '',
      item.product_code || '',
      item.on_hand_qty,
      item.unit,
      item.min_qty || '',
      item.max_qty || '',
      item.unit_cost || '',
      item.unit_cost ? (parseFloat(item.on_hand_qty) * parseFloat(item.unit_cost)).toFixed(2) : '',
      item.lot_number || '',
      item.expires_on || '',
      item.storage_location || '',
      item.epa_reg_no || '',
      item.frac_code || '',
      item.rei_hours || '',
      item.phi_days || '',
      item.active_ingredient || '',
      item.signal_word || ''
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = () => {
    try {
      const doc = new jsPDF('l', 'mm', 'a4'); // Landscape orientation

      // Add title
      doc.setFontSize(18);
      doc.text('Inventory Export', 14, 15);

      // Add metadata
      doc.setFontSize(10);
      const categoryLabel = categories.find(c => c.value === selectedCategory)?.label || 'All Items';
      doc.text(`Category: ${categoryLabel}`, 14, 22);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 27);
      doc.text(`Total Items: ${filteredItems.length}`, 14, 32);

      // Prepare table data
      const tableHeaders = [
        'Name',
        'Category',
        'On Hand',
        'Min/Max',
        'Unit Cost',
        'Total Value',
        'Expires',
        'Location'
      ];

      const tableRows = filteredItems.map(item => [
        item.name,
        item.category,
        `${item.on_hand_qty} ${item.unit}`,
        `${item.min_qty || '-'}/${item.max_qty || '-'}`,
        item.unit_cost ? `$${parseFloat(item.unit_cost).toFixed(2)}` : '-',
        item.unit_cost ? `$${(parseFloat(item.on_hand_qty) * parseFloat(item.unit_cost)).toFixed(2)}` : '-',
        item.expires_on ? new Date(item.expires_on).toLocaleDateString() : '-',
        item.storage_location || '-'
      ]);

      // Add table using autoTable function
      autoTable(doc, {
        head: [tableHeaders],
        body: tableRows,
        startY: 38,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [71, 85, 105], textColor: 255 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 14, right: 14 }
      });

      // Save PDF
      doc.save(`inventory-export-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try CSV export instead.');
    }
  };

  const categories = [
    { value: 'all', label: 'All Items', icon: Package, color: 'gray' },
    { value: 'chemical', label: 'Chemicals', icon: Droplet, color: 'blue' },
    { value: 'fertilizer', label: 'Fertilizers', icon: Sprout, color: 'green' },
    { value: 'ppe', label: 'PPE', icon: HardHat, color: 'yellow' },
    { value: 'supplies', label: 'Supplies', icon: Box, color: 'purple' }
  ];

  const units = ['gal', 'L', 'lb', 'kg', 'oz', 'ea', 'qt', 'pt'];
  const signalWords = ['CAUTION', 'WARNING', 'DANGER'];

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.manufacturer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.active_ingredient?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockItems = items.filter(item =>
    parseFloat(item.on_hand_qty) <= parseFloat(item.min_qty)
  );

  const expiringItems = items.filter(item => {
    if (!item.expires_on) return false;
    const daysUntilExpiry = Math.ceil((new Date(item.expires_on) - new Date()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  });

  const totalValue = items.reduce((sum, item) => {
    const qty = parseFloat(item.on_hand_qty) || 0;
    const cost = parseFloat(item.unit_cost) || 0;
    return sum + (qty * cost);
  }, 0);

  const getCategoryIcon = (category) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.icon : Package;
  };

  const getCategoryColor = (category) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.color : 'gray';
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="pt-2 sm:pt-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Inventory Management</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1 hidden sm:block">
          Track supplies, chemicals, and materials for your vineyard. <DocLink docId="operations/inventory" />
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{items.length}</div>
            <div className="text-sm text-gray-600">Total Items</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{lowStockItems.length}</div>
            <div className="text-sm text-gray-600">Low Stock Alerts</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{expiringItems.length}</div>
            <div className="text-sm text-gray-600">Expiring Soon</div>
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

      {/* Alerts */}
      {(lowStockItems.length > 0 || expiringItems.length > 0) && (
        <div className="space-y-3">
          {lowStockItems.slice(0, 3).map(item => (
            <Card key={item.id} className="border-l-4 border-l-amber-500 bg-amber-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-600">
                      Stock: {item.on_hand_qty} {item.unit} (Min: {item.min_qty} {item.unit})
                    </p>
                  </div>
                  <Button size="sm" className="bg-amber-500 hover:bg-amber-600">
                    Reorder
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
        {/* Left Side: Search and Category Tabs */}
        <div className="flex flex-col sm:flex-row flex-1 gap-3">
          {/* Search */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search inventory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 overflow-x-auto hide-scrollbar">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                    selectedCategory === cat.value
                      ? 'bg-white text-gray-900 shadow'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title={cat.label}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Action Buttons */}
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => setShowTransactions(!showTransactions)}
            className="inline-flex items-center justify-center px-3 h-10 text-sm font-medium text-white bg-slate-700 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <History className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">History</span>
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center justify-center px-3 h-10 text-sm font-medium text-white bg-slate-700 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Download className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Export</span>
          </button>
          {!isAddingItem && (
            <button
              onClick={() => setIsAddingItem(true)}
              className="inline-flex items-center justify-center px-4 h-10 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-sm hover:shadow transition-all"
            >
              <Plus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Add Item</span>
            </button>
          )}
        </div>
      </div>

      {/* Add/Edit Form */}
      {isAddingItem && (
        <Card className="border border-gray-200 shadow-xl bg-white overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Package className="w-6 h-6" />
              {editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
            </h3>
            <p className="text-emerald-50 text-sm mt-1">
              {formData.category === 'chemical'
                ? 'Complete all chemical compliance fields for regulatory tracking'
                : 'Fill in the details below to add this item to your inventory'}
            </p>
          </div>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information Section */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Box className="w-5 h-5 text-emerald-600" />
                  Basic Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    >
                      {categories.filter(c => c.value !== 'all').map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Mancozeb 75DF"
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Manufacturer
                    </label>
                    <input
                      type="text"
                      value={formData.manufacturer}
                      onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                      placeholder="e.g., Dow AgroSciences"
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Product Code
                    </label>
                    <input
                      type="text"
                      value={formData.product_code}
                      onChange={(e) => setFormData({ ...formData, product_code: e.target.value })}
                      placeholder="SKU or Code"
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Unit <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    >
                      {units.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Stock & Cost Section */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  Inventory & Pricing
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      On Hand Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      value={formData.on_hand_qty}
                      onChange={(e) => setFormData({ ...formData, on_hand_qty: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Minimum Quantity
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.min_qty}
                      onChange={(e) => setFormData({ ...formData, min_qty: e.target.value })}
                      placeholder="Reorder level"
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Maximum Quantity
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.max_qty || ''}
                      onChange={(e) => setFormData({ ...formData, max_qty: e.target.value })}
                      placeholder="Max capacity"
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Unit Cost ($)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.unit_cost || ''}
                        onChange={(e) => setFormData({ ...formData, unit_cost: e.target.value })}
                        placeholder="0.00"
                        className="w-full pl-8 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Chemical-Specific Fields */}
              {formData.category === 'chemical' && (
                <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg p-6 border-2 border-red-200">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-red-900 flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Chemical Compliance & Safety
                      </h4>
                      <p className="text-sm text-red-700 mt-1">Required for regulatory compliance and safety tracking</p>
                    </div>
                    <div className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                      REGULATED
                    </div>
                  </div>
                  <div className="space-y-6">
                    {/* Registration & Classification */}
                    <div className="bg-white rounded-lg p-4 border border-red-200">
                      <h5 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Registration & Classification</h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            EPA Reg No.
                          </label>
                          <input
                            type="text"
                            value={formData.epa_reg_no}
                            onChange={(e) => setFormData({ ...formData, epa_reg_no: e.target.value })}
                            placeholder="e.g., 66222-182"
                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            FRAC Code
                          </label>
                          <input
                            type="text"
                            value={formData.frac_code}
                            onChange={(e) => setFormData({ ...formData, frac_code: e.target.value })}
                            placeholder="e.g., M3"
                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Signal Word
                          </label>
                          <select
                            value={formData.signal_word}
                            onChange={(e) => setFormData({ ...formData, signal_word: e.target.value })}
                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                          >
                            <option value="">Select...</option>
                            {signalWords.map(word => (
                              <option key={word} value={word}>{word}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Safety Intervals */}
                    <div className="bg-white rounded-lg p-4 border border-red-200">
                      <h5 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Safety Intervals</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            REI (hours) - Re-Entry Interval
                          </label>
                          <input
                            type="number"
                            value={formData.rei_hours || ''}
                            onChange={(e) => setFormData({ ...formData, rei_hours: e.target.value })}
                            placeholder="e.g., 24"
                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                          />
                          <p className="text-xs text-gray-600 mt-1">Hours before workers can re-enter treated area</p>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            PHI (days) - Pre-Harvest Interval
                          </label>
                          <input
                            type="number"
                            value={formData.phi_days || ''}
                            onChange={(e) => setFormData({ ...formData, phi_days: e.target.value })}
                            placeholder="e.g., 14"
                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                          />
                          <p className="text-xs text-gray-600 mt-1">Days between application and harvest</p>
                        </div>
                      </div>
                    </div>

                    {/* Active Ingredient */}
                    <div className="bg-white rounded-lg p-4 border border-red-200">
                      <h5 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Active Ingredient</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Active Ingredient
                          </label>
                          <input
                            type="text"
                            value={formData.active_ingredient}
                            onChange={(e) => setFormData({ ...formData, active_ingredient: e.target.value })}
                            placeholder="e.g., Mancozeb"
                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Concentration
                          </label>
                          <input
                            type="text"
                            value={formData.concentration}
                            onChange={(e) => setFormData({ ...formData, concentration: e.target.value })}
                            placeholder="e.g., 75%"
                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Safety Data Sheet (SDS) URL
                          </label>
                          <input
                            type="url"
                            value={formData.sds_url}
                            onChange={(e) => setFormData({ ...formData, sds_url: e.target.value })}
                            placeholder="https://..."
                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Lot & Expiration Section */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                  Tracking & Storage
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Lot Number
                    </label>
                    <input
                      type="text"
                      value={formData.lot_number}
                      onChange={(e) => setFormData({ ...formData, lot_number: e.target.value })}
                      placeholder="Batch/Lot ID"
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Expiration Date
                    </label>
                    <input
                      type="date"
                      value={formData.expires_on}
                      onChange={(e) => setFormData({ ...formData, expires_on: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Storage Location
                    </label>
                    <input
                      type="text"
                      value={formData.storage_location}
                      onChange={(e) => setFormData({ ...formData, storage_location: e.target.value })}
                      placeholder="e.g., Chemical Shed A"
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  rows="4"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional information about this item..."
                />
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Package className="w-5 h-5" />
                  {editingItem ? 'Update Item' : 'Add to Inventory'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Items List */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <LoadingSpinner message="Loading inventory..." />
        ) : filteredItems.length === 0 ? (
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="py-12 text-center">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No items found</p>
              <p className="text-sm text-gray-500">
                {searchQuery ? 'Try adjusting your search' : 'Add your first inventory item to get started'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredItems.map((item) => {
            const Icon = getCategoryIcon(item.category);
            const color = getCategoryColor(item.category);
            const isLowStock = parseFloat(item.on_hand_qty) <= parseFloat(item.min_qty);
            const isExpiringSoon = item.expires_on &&
              Math.ceil((new Date(item.expires_on) - new Date()) / (1000 * 60 * 60 * 24)) <= 30;

            return (
              <Card key={item.id} className={`hover:shadow-lg transition-shadow ${isLowStock ? 'border-l-4 border-l-amber-500' : ''}`}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-lg bg-${color}-50 flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-6 h-6 text-${color}-600`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                          {item.manufacturer && (
                            <p className="text-sm text-gray-600">{item.manufacturer}</p>
                          )}
                          {item.active_ingredient && (
                            <p className="text-xs text-gray-500 mt-1">
                              Active: {item.active_ingredient} {item.concentration && `(${item.concentration})`}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1 ml-4">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-2 text-gray-600 hover:text-vine-green-600 hover:bg-gray-100 rounded"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-gray-500">On Hand</p>
                          <p className={`text-sm font-semibold ${isLowStock ? 'text-amber-600' : 'text-gray-900'}`}>
                            {item.on_hand_qty} {item.unit}
                          </p>
                        </div>

                        {item.min_qty > 0 && (
                          <div>
                            <p className="text-xs text-gray-500">Min / Max</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {item.min_qty} / {item.max_qty || '—'} {item.unit}
                            </p>
                          </div>
                        )}

                        {item.unit_cost && (
                          <div>
                            <p className="text-xs text-gray-500">Value</p>
                            <p className="text-sm font-semibold text-gray-900">
                              ${(parseFloat(item.on_hand_qty) * parseFloat(item.unit_cost)).toFixed(2)}
                            </p>
                          </div>
                        )}

                        {item.expires_on && (
                          <div>
                            <p className="text-xs text-gray-500">Expires</p>
                            <p className={`text-sm font-semibold ${isExpiringSoon ? 'text-red-600' : 'text-gray-900'}`}>
                              {new Date(item.expires_on).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Chemical Compliance Info */}
                      {item.category === 'chemical' && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {item.epa_reg_no && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                              EPA: {item.epa_reg_no}
                            </span>
                          )}
                          {item.frac_code && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                              FRAC: {item.frac_code}
                            </span>
                          )}
                          {item.rei_hours && (
                            <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded">
                              REI: {item.rei_hours}h
                            </span>
                          )}
                          {item.phi_days && (
                            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                              PHI: {item.phi_days}d
                            </span>
                          )}
                          {item.signal_word && (
                            <span className={`px-2 py-1 text-xs rounded font-semibold ${
                              item.signal_word === 'DANGER' ? 'bg-red-200 text-red-900' :
                              item.signal_word === 'WARNING' ? 'bg-orange-200 text-orange-900' :
                              'bg-yellow-200 text-yellow-900'
                            }`}>
                              {item.signal_word}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Quick Adjust Buttons */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAdjustStock(item, -10)}
                        >
                          <TrendingDown className="w-3 h-3 mr-1" />
                          -10
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAdjustStock(item, -1)}
                        >
                          -1
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAdjustStock(item, 1)}
                        >
                          +1
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAdjustStock(item, 10)}
                        >
                          <TrendingUp className="w-3 h-3 mr-1" />
                          +10
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Transaction History Modal */}
      {showTransactions && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
                <button
                  onClick={() => setShowTransactions(false)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  ×
                </button>
              </div>
              <div className="overflow-y-auto max-h-[60vh]">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">Date</th>
                      <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">Item</th>
                      <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">Type</th>
                      <th className="text-right py-2 px-3 text-sm font-semibold text-gray-700">Quantity</th>
                      <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((txn) => (
                      <tr key={txn.id} className="border-b border-gray-100">
                        <td className="py-2 px-3 text-sm text-gray-900">
                          {new Date(txn.transaction_date).toLocaleDateString()}
                        </td>
                        <td className="py-2 px-3 text-sm text-gray-900">
                          {txn.inventory_items?.name}
                        </td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            txn.transaction_type === 'receive' ? 'bg-green-100 text-green-700' :
                            txn.transaction_type === 'use' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {txn.transaction_type}
                          </span>
                        </td>
                        <td className={`py-2 px-3 text-sm text-right font-semibold ${
                          txn.quantity > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {txn.quantity > 0 ? '+' : ''}{txn.quantity}
                        </td>
                        <td className="py-2 px-3 text-sm text-gray-600 truncate max-w-xs">
                          {txn.notes}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>,
        document.body
      )}

      {/* Export Confirmation Dialog */}
      {showExportDialog && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-slate-700 to-slate-600 px-6 py-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Download className="w-6 h-6" />
                Export Inventory
              </h3>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                You are about to export <span className="font-bold text-gray-900">{filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}</span> from{' '}
                <span className="font-bold text-gray-900">
                  {categories.find(c => c.value === selectedCategory)?.label || 'All Items'}
                </span>.
              </p>
              {searchQuery && (
                <p className="text-sm text-amber-600 mb-4">
                  Note: Only items matching your search "{searchQuery}" will be exported.
                </p>
              )}

              {/* Format Selection */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Export Format
                </label>
                <div className="space-y-2">
                  <label className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${exportFormat === 'csv' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'}`}>
                    <input
                      type="radio"
                      name="exportFormat"
                      value="csv"
                      checked={exportFormat === 'csv'}
                      onChange={(e) => setExportFormat(e.target.value)}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="ml-3 flex-1">
                      <div className="text-sm font-semibold text-gray-900">CSV (Spreadsheet)</div>
                      <div className="text-xs text-gray-600">Best for Excel, Google Sheets, or data analysis</div>
                    </div>
                  </label>
                  <label className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${exportFormat === 'pdf' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'}`}>
                    <input
                      type="radio"
                      name="exportFormat"
                      value="pdf"
                      checked={exportFormat === 'pdf'}
                      onChange={(e) => setExportFormat(e.target.value)}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="ml-3 flex-1">
                      <div className="text-sm font-semibold text-gray-900">PDF (Document)</div>
                      <div className="text-xs text-gray-600">Best for printing or sharing as a report</div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={confirmExport}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Export {exportFormat.toUpperCase()}
                </button>
                <button
                  onClick={() => setShowExportDialog(false)}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
