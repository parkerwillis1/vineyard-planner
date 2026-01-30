import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Barrel, Plus, Edit2, Trash2, Droplet, AlertCircle, Check,
  Package, Clock, TrendingUp, Grid, List, Filter, Map, Layers, Sparkles, Copy, Users, X, QrCode, Printer, Grape
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { DocLink } from '@/shared/components/DocLink';
import {
  listContainers,
  createContainer,
  updateContainer,
  deleteContainer,
  listLots
} from '@/shared/lib/productionApi';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';

// Smart naming utility functions
const detectNamingPattern = (name) => {
  // Extract base name and suffix - must have a space or delimiter before the suffix
  const numericMatch = name.match(/^(.+)\s+(\d+)$/);
  if (numericMatch) {
    return {
      type: 'numeric',
      base: numericMatch[1],
      suffix: parseInt(numericMatch[2]),
      original: name
    };
  }

  const letterMatch = name.match(/^(.+)\s+([A-Z])$/i);
  if (letterMatch) {
    return {
      type: 'letter',
      base: letterMatch[1],
      suffix: letterMatch[2],
      original: name
    };
  }

  // No pattern detected - treat as base name only
  return {
    type: 'none',
    base: name.trim(),
    suffix: null,
    original: name
  };
};

const incrementName = (pattern, increment = 1) => {
  if (pattern.type === 'numeric') {
    return `${pattern.base} ${pattern.suffix + increment}`;
  } else if (pattern.type === 'letter') {
    const newCharCode = pattern.suffix.charCodeAt(0) + increment;
    if (newCharCode > 90) { // Beyond 'Z'
      return `${pattern.base} ${String.fromCharCode(65)}`; // Wrap to 'A'
    }
    return `${pattern.base} ${String.fromCharCode(newCharCode)}`;
  } else {
    // No existing pattern - start with 1
    return `${pattern.base} ${increment + 1}`;
  }
};

const generateUniqueNames = (baseName, count, existingNames) => {
  const pattern = detectNamingPattern(baseName);
  const names = [];
  const existingSet = new Set(existingNames);

  let currentIncrement = 0;

  for (let i = 0; i < count; i++) {
    let candidateName;
    let attempts = 0;

    do {
      candidateName = incrementName(pattern, currentIncrement);
      currentIncrement++;
      attempts++;
    } while (existingSet.has(candidateName) && attempts < 1000);

    if (attempts >= 1000) {
      candidateName = `${pattern.base} ${Date.now()}-${i}`;
    }

    names.push(candidateName);
    existingSet.add(candidateName);
  }

  return names;
};

export function ContainerManagement() {
  const navigate = useNavigate();
  const [containers, setContainers] = useState([]);
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingContainer, setEditingContainer] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list', or 'map'
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name-asc'); // Sort option
  const [selectedContainers, setSelectedContainers] = useState([]); // For bulk actions
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Duplicate & Bulk Create state
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicatingContainer, setDuplicatingContainer] = useState(null);
  const [showBulkCreateModal, setShowBulkCreateModal] = useState(false);
  const [bulkCreateTemplate, setBulkCreateTemplate] = useState(null);
  const [bulkCount, setBulkCount] = useState(10);
  const [bulkBaseName, setBulkBaseName] = useState('');
  const [bulkPreviewNames, setBulkPreviewNames] = useState([]);

  // QR Code state
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrContainer, setQRContainer] = useState(null);
  const printRef = useRef();

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    variant: 'warning'
  });

  const [formData, setFormData] = useState({
    name: '',
    type: 'tank',
    material: 'stainless',
    capacity_gallons: '',
    location: '',
    status: 'empty',
    cooperage: '',
    toast_level: '',
    purchase_date: '',
    total_fills: 0,
    last_cip_date: '',
    cip_product: '',
    notes: '',
    quantity: 1 // For bulk creation
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [containersResult, lotsResult] = await Promise.all([
        listContainers(),
        listLots()
      ]);

      if (containersResult.error) throw containersResult.error;
      if (lotsResult.error) throw lotsResult.error;

      const containerData = containersResult.data || [];
      const lotData = lotsResult.data || [];

      setContainers(containerData);
      setLots(lotData);

      // Auto-sync container statuses based on lot assignments
      await syncContainerStatuses(containerData, lotData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Sync container statuses based on whether they have lots assigned
  const syncContainerStatuses = async (containerData, lotData) => {
    try {
      // Find all containers that have lots but status is "empty"
      const containersToUpdate = containerData.filter(container => {
        const hasLot = lotData.some(lot => lot.container_id === container.id);
        return hasLot && container.status === 'empty';
      });

      // Update each container to "in_use"
      if (containersToUpdate.length > 0) {
        await Promise.all(
          containersToUpdate.map(container =>
            updateContainer(container.id, { status: 'in_use' })
          )
        );

        // Reload data to reflect changes
        if (containersToUpdate.length > 0) {
          const freshContainers = await listContainers();
          if (!freshContainers.error) {
            setContainers(freshContainers.data || []);
          }
        }
      }
    } catch (err) {
      console.error('Error syncing container statuses:', err);
      // Don't throw - this is a background operation
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const quantity = parseInt(formData.quantity) || 1;

      // If editing or quantity is 1, create/update single vessel
      if (editingContainer || quantity === 1) {
        const { quantity: _, ...containerDataWithoutQuantity } = formData;
        const containerData = {
          ...containerDataWithoutQuantity,
          capacity_gallons: parseFloat(formData.capacity_gallons),
          total_fills: parseInt(formData.total_fills) || 0,
          purchase_date: formData.purchase_date || null,
          last_cip_date: formData.last_cip_date || null
        };

        if (editingContainer) {
          const { error: updateError } = await updateContainer(editingContainer.id, containerData);
          if (updateError) throw updateError;
          setSuccess('Vessel updated successfully');
        } else {
          const { error: createError } = await createContainer(containerData);
          if (createError) throw createError;
          setSuccess('Vessel created successfully');
        }
      } else {
        // Bulk creation
        const existingNames = containers.map(c => c.name);
        const names = generateUniqueNames(formData.name, quantity, existingNames);

        let successCount = 0;
        const errors = [];

        for (const newName of names) {
          const { quantity: _, ...containerDataWithoutQuantity } = formData;
          const containerData = {
            ...containerDataWithoutQuantity,
            name: newName,
            capacity_gallons: parseFloat(formData.capacity_gallons),
            total_fills: 0,
            status: 'empty',
            purchase_date: formData.purchase_date || null,
            last_cip_date: null,
            cip_product: ''
          };

          const { error: createError } = await createContainer(containerData);
          if (createError) {
            errors.push(`${newName}: ${createError.message}`);
          } else {
            successCount++;
          }
        }

        if (errors.length > 0) {
          setError(`Created ${successCount}/${quantity} vessels. Errors: ${errors.join('; ')}`);
        } else {
          setSuccess(`Successfully created ${successCount} vessel${successCount !== 1 ? 's' : ''}`);
        }
      }

      resetForm();
      loadData();
    } catch (err) {
      console.error('Error saving container:', err);
      setError(err.message);
    }
  };

  const handleEdit = (container) => {
    setEditingContainer(container);
    setFormData({
      name: container.name,
      type: container.type,
      material: container.material || 'stainless',
      capacity_gallons: container.capacity_gallons,
      location: container.location || '',
      status: container.status,
      cooperage: container.cooperage || '',
      toast_level: container.toast_level || '',
      purchase_date: container.purchase_date || '',
      total_fills: container.total_fills || 0,
      last_cip_date: container.last_cip_date || '',
      cip_product: container.cip_product || '',
      notes: container.notes || '',
      quantity: 1
    });
    setShowForm(true);
  };

  const handleDelete = async (containerId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Vessel',
      message: 'Are you sure you want to delete this vessel? This action cannot be undone.',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const { error: deleteError } = await deleteContainer(containerId);
          if (deleteError) throw deleteError;
          setSuccess('Vessel deleted successfully');
          loadData();
        } catch (err) {
          console.error('Error deleting container:', err);
          setError(err.message);
        }
      }
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'tank',
      material: 'stainless',
      capacity_gallons: '',
      location: '',
      status: 'empty',
      cooperage: '',
      toast_level: '',
      purchase_date: '',
      total_fills: 0,
      last_cip_date: '',
      cip_product: '',
      notes: '',
      quantity: 1
    });
    setEditingContainer(null);
    setShowForm(false);
  };

  // Duplicate vessel handler
  const handleDuplicate = (container) => {
    const existingNames = containers.map(c => c.name);
    const newName = generateUniqueNames(container.name, 1, existingNames)[0];

    setDuplicatingContainer({
      ...container,
      name: newName
    });
    setShowDuplicateModal(true);
  };

  const handleDuplicateSubmit = async () => {
    try {
      setError(null);
      const { id, created_at, updated_at, user_id, ...containerData } = duplicatingContainer;

      // Reset some fields for new vessel
      const newContainerData = {
        ...containerData,
        status: 'empty',
        total_fills: 0,
        last_cip_date: null,
        cip_product: '',
        purchase_date: new Date().toISOString().split('T')[0]
      };

      const { error: createError } = await createContainer(newContainerData);
      if (createError) throw createError;

      setSuccess('Vessel duplicated successfully');
      setShowDuplicateModal(false);
      setDuplicatingContainer(null);
      loadData();
    } catch (err) {
      console.error('Error duplicating vessel:', err);
      setError(err.message);
    }
  };

  // Bulk create handler
  const handleBulkCreate = (container = null) => {
    const template = container || containers.find(c => c.type === 'barrel') || containers[0];
    setBulkCreateTemplate(template);
    setBulkCount(10);
    setBulkBaseName(template.name || 'Barrel');
    updateBulkPreview(template.name || 'Barrel', 10);
    setShowBulkCreateModal(true);
  };

  const updateBulkPreview = (baseName, count) => {
    if (!baseName) return;
    const existingNames = containers.map(c => c.name);
    const names = generateUniqueNames(baseName, count, existingNames);
    setBulkPreviewNames(names);
  };

  const handleBulkCreateSubmit = async () => {
    try {
      setError(null);
      const { id, created_at, updated_at, user_id, name, ...templateData } = bulkCreateTemplate;

      let successCount = 0;
      const errors = [];

      for (const newName of bulkPreviewNames) {
        const newContainerData = {
          ...templateData,
          name: newName,
          status: 'empty',
          total_fills: 0,
          last_cip_date: null,
          cip_product: '',
          purchase_date: bulkCreateTemplate.purchase_date || new Date().toISOString().split('T')[0]
        };

        const { error: createError } = await createContainer(newContainerData);
        if (createError) {
          errors.push(`${newName}: ${createError.message}`);
        } else {
          successCount++;
        }
      }

      if (errors.length > 0) {
        setError(`Created ${successCount}/${bulkPreviewNames.length} vessels. Errors: ${errors.join('; ')}`);
      } else {
        setSuccess(`Successfully created ${successCount} vessels`);
      }

      setShowBulkCreateModal(false);
      setBulkCreateTemplate(null);
      setBulkPreviewNames([]);
      loadData();
    } catch (err) {
      console.error('Error bulk creating vessels:', err);
      setError(err.message);
    }
  };

  // Bulk actions
  const toggleContainerSelection = (containerId) => {
    setSelectedContainers(prev =>
      prev.includes(containerId)
        ? prev.filter(id => id !== containerId)
        : [...prev, containerId]
    );
  };

  const handleBulkStatusChange = async (newStatus) => {
    try {
      await Promise.all(
        selectedContainers.map(id => updateContainer(id, { status: newStatus }))
      );
      setSuccess(`Updated ${selectedContainers.length} vessel(s) to ${newStatus}`);
      setSelectedContainers([]);
      setShowBulkActions(false);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleBulkCIP = async () => {
    const cipDate = new Date().toISOString().split('T')[0];
    try {
      await Promise.all(
        selectedContainers.map(id =>
          updateContainer(id, {
            status: 'sanitized',
            last_cip_date: cipDate
          })
        )
      );
      setSuccess(`Marked ${selectedContainers.length} vessel(s) as sanitized`);
      setSelectedContainers([]);
      setShowBulkActions(false);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  // QR Code handlers
  const handleShowQR = (container) => {
    setQRContainer(container);
    setShowQRModal(true);
  };

  const handlePrintLabel = () => {
    const lot = getLotForContainer(qrContainer.id);

    // Get the QR code SVG from the modal and serialize it
    const qrSvg = document.querySelector('#qr-code-container svg');
    let qrSvgString = '';
    if (qrSvg) {
      // Clone and set explicit size
      const clonedSvg = qrSvg.cloneNode(true);
      clonedSvg.setAttribute('width', '144');
      clonedSvg.setAttribute('height', '144');
      qrSvgString = new XMLSerializer().serializeToString(clonedSvg);
    }

    // Create a new window with just the label
    const printWindow = window.open('', '_blank', 'width=600,height=400');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Label - ${qrContainer.name}</title>
          <style>
            @page {
              size: 4in 2in landscape;
              margin: 0;
            }

            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }

            body {
              width: 4in;
              height: 2in;
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            }

            .label-container {
              width: 4in;
              height: 2in;
              padding: 0.15in;
              border: 2px solid #000;
              display: flex;
              align-items: center;
            }

            .text-side {
              width: 2.2in;
              padding: 0.1in;
            }

            .qr-side {
              width: 1.6in;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 0.1in;
            }

            .qr-side svg {
              width: 144px;
              height: 144px;
            }

            .field {
              margin-bottom: 4px;
            }

            .field-label {
              font-size: 8px;
              color: #666;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 2px;
            }

            .field-value {
              font-size: 12px;
              font-weight: 600;
              color: #000;
              line-height: 1.2;
            }

            .field-value.large {
              font-size: 14px;
              font-weight: bold;
            }

            .footer {
              padding-top: 4px;
              border-top: 1px solid #ccc;
              margin-top: 4px;
              font-size: 7px;
              color: #888;
            }

            @media print {
              body {
                width: 4in;
                height: 2in;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .label-container {
                border: 2px solid #000 !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="label-container">
            <div class="text-side">
              <div class="field">
                <div class="field-label">VESSEL ID</div>
                <div class="field-value large">${qrContainer.name}</div>
              </div>
              <div class="field">
                <div class="field-label">VARIETY</div>
                <div class="field-value">${lot?.varietal || '—'}</div>
              </div>
              <div class="field">
                <div class="field-label">VINTAGE</div>
                <div class="field-value">${lot?.vintage || '—'}</div>
              </div>
              <div class="footer">
                ${qrContainer.capacity_gallons} gal • ${qrContainer.material?.replace('_', ' ') || '—'}
              </div>
            </div>
            <div class="qr-side">
              ${qrSvgString}
            </div>
          </div>
          <script>
            // Auto-print after a brief delay to ensure rendering
            setTimeout(function() { window.print(); }, 100);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getContainerStats = () => {
    const total = containers.length;
    const empty = containers.filter(c => c.status === 'empty').length;
    const inUse = containers.filter(c => c.status === 'in_use').length;
    const totalCapacity = containers.reduce((sum, c) => sum + (c.capacity_gallons || 0), 0);
    const totalVolume = containers.reduce((sum, c) => {
      const lot = getLotForContainer(c.id);
      const volume = lot?.current_volume_gallons || c.current_volume_gallons || 0;
      return sum + volume;
    }, 0);
    const utilization = totalCapacity > 0 ? (totalVolume / totalCapacity) * 100 : 0;

    // Calculate harvest volume statistics
    const currentYear = new Date().getFullYear();
    const currentSeasonLots = lots.filter(lot => lot.vintage === currentYear);
    const totalHarvestVolume = currentSeasonLots.reduce((sum, lot) => sum + (lot.current_volume_gallons || 0), 0);
    const harvestAllocation = totalHarvestVolume > 0 ? (totalVolume / totalHarvestVolume) * 100 : 0;

    // Count barrels
    const barrels = containers.filter(c => c.type === 'barrel').length;

    return {
      total,
      empty,
      inUse,
      totalCapacity,
      totalVolume,
      utilization,
      totalHarvestVolume,
      harvestAllocation,
      barrels
    };
  };

  const getFilteredContainers = () => {
    let filtered = containers.filter(c => {
      const typeMatch = filterType === 'all' || c.type === filterType;
      const statusMatch = filterStatus === 'all' || c.status === filterStatus;
      return typeMatch && statusMatch;
    });

    // Sort containers
    const [sortField, sortOrder] = sortBy.split('-');

    filtered.sort((a, b) => {
      let compareA, compareB;

      switch (sortField) {
        case 'name':
          // Extract numbers from name for numeric sorting
          const numA = parseInt(a.name.match(/\d+/)?.[0] || '0');
          const numB = parseInt(b.name.match(/\d+/)?.[0] || '0');

          // If both have numbers, sort numerically
          if (numA && numB) {
            compareA = numA;
            compareB = numB;
          } else {
            // Otherwise sort alphabetically
            compareA = a.name.toLowerCase();
            compareB = b.name.toLowerCase();
          }
          break;
        case 'capacity':
          compareA = a.capacity_gallons || 0;
          compareB = b.capacity_gallons || 0;
          break;
        case 'fill':
          const lotA = getLotForContainer(a.id);
          const lotB = getLotForContainer(b.id);
          const volumeA = lotA?.current_volume_gallons || a.current_volume_gallons || 0;
          const volumeB = lotB?.current_volume_gallons || b.current_volume_gallons || 0;
          const fillA = a.capacity_gallons > 0 ? (volumeA / a.capacity_gallons) * 100 : 0;
          const fillB = b.capacity_gallons > 0 ? (volumeB / b.capacity_gallons) * 100 : 0;
          compareA = fillA;
          compareB = fillB;
          break;
        case 'type':
          compareA = a.type;
          compareB = b.type;
          break;
        default:
          compareA = a.name;
          compareB = b.name;
      }

      if (compareA < compareB) return sortOrder === 'asc' ? -1 : 1;
      if (compareA > compareB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  };

  const getLotForContainer = (containerId) => {
    return lots.find(lot => lot.container_id === containerId);
  };

  const getContainerIcon = (type) => {
    switch (type) {
      case 'barrel': return Barrel;
      case 'tank': return Package;
      case 'tote': return Droplet;
      default: return Package;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'empty': return 'bg-gray-100 text-gray-700';
      case 'in_use': return 'bg-green-100 text-green-700';
      case 'cleaning': return 'bg-blue-100 text-blue-700';
      case 'needs_cip': return 'bg-orange-100 text-orange-700';
      case 'sanitized': return 'bg-emerald-100 text-emerald-700';
      case 'needs_repair': return 'bg-red-100 text-red-700';
      case 'retired': return 'bg-gray-300 text-gray-600';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Get lot status color for display on vessel cards
  const getLotStatusColor = (status) => {
    switch (status) {
      case 'fermenting': return 'bg-orange-100 text-orange-700';
      case 'pressed': return 'bg-purple-100 text-purple-700';
      case 'aging': return 'bg-amber-100 text-amber-700';
      case 'blending': return 'bg-indigo-100 text-indigo-700';
      case 'ready_to_bottle': return 'bg-green-100 text-green-700';
      case 'bottled': return 'bg-emerald-100 text-emerald-700';
      case 'filtering': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Get status display and color for map view
  const getStatusIndicator = (status) => {
    switch (status) {
      case 'empty': return { bg: 'bg-gray-300', border: 'border-gray-400', ring: '' };
      case 'in_use': return { bg: 'bg-green-500', border: 'border-green-600', ring: 'ring-2 ring-green-300' };
      case 'cleaning': return { bg: 'bg-blue-500', border: 'border-blue-600', ring: 'ring-2 ring-blue-300 animate-pulse' };
      case 'needs_cip': return { bg: 'bg-orange-500', border: 'border-orange-600', ring: 'ring-2 ring-orange-300' };
      case 'sanitized': return { bg: 'bg-emerald-400', border: 'border-emerald-500', ring: 'ring-2 ring-emerald-200' };
      case 'needs_repair': return { bg: 'bg-red-500', border: 'border-red-600', ring: 'ring-4 ring-red-300' };
      default: return { bg: 'bg-gray-300', border: 'border-gray-400', ring: '' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-[#7C203A] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading vessel inventory...</p>
        </div>
      </div>
    );
  }

  const stats = getContainerStats();
  const filteredContainers = getFilteredContainers();

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between pt-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vessel Management</h1>
          <p className="text-sm text-gray-500 mt-1">Track tanks, barrels, and container inventory. <DocLink docId="production/vessels" /></p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-[#7C203A] text-white rounded-lg hover:bg-[#8B2E48] transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Vessel
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-800">
            <Check className="w-5 h-5" />
            <span>{success}</span>
          </div>
        </div>
      )}

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Vessels */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Total Vessels</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-xs text-gray-500 mt-1">{stats.empty} empty • {stats.inUse} in use</p>
        </div>

        {/* Total Capacity */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Total Capacity</p>
          <p className="text-2xl font-bold text-gray-900">{stats.totalCapacity.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">gallons</p>
        </div>

        {/* Utilization */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Utilization</p>
          <p className="text-2xl font-bold text-gray-900">{stats.utilization.toFixed(0)}%</p>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-[#7C203A] h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(stats.utilization, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Barrels */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Barrels</p>
          <p className="text-2xl font-bold text-gray-900">{stats.barrels}</p>
          <p className="text-xs text-gray-500 mt-1">
            {containers.filter(c => c.type === 'barrel' && c.status === 'empty').length} empty
          </p>
        </div>

        {/* Season Harvest */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Season Harvest</p>
          <p className="text-2xl font-bold text-gray-900">{stats.totalHarvestVolume.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">{new Date().getFullYear()} vintage</p>
        </div>

        {/* Harvest Allocated */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Harvest Allocated</p>
          <p className="text-2xl font-bold text-gray-900">{stats.harvestAllocation.toFixed(0)}%</p>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-[#7C203A] h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(stats.harvestAllocation, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingContainer ? 'Edit Vessel' : 'New Vessel'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name * {!editingContainer && formData.quantity > 1 && (
                    <span className="text-xs text-gray-500">
                      (will create: "{formData.name} 1", "{formData.name} 2", etc.)
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  placeholder="e.g., Oak Barrel, Tank"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                />
              </div>

              {!editingContainer && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity * <span className="text-xs text-gray-500">(how many to create)</span>
                  </label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 1})}
                    required
                    min="1"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                  />
                </div>
              )}
            </div>

            {/* Names Preview Box */}
            {!editingContainer && formData.quantity > 1 && formData.name && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="font-semibold text-gray-900 text-sm mb-2">
                  Names Preview ({formData.quantity} vessels)
                </p>
                <div className="bg-white rounded border border-gray-200 p-3 max-h-40 overflow-y-auto">
                  <div className="space-y-1">
                    {(() => {
                      const existingNames = containers.map(c => c.name);
                      const previewNames = generateUniqueNames(formData.name, Math.min(formData.quantity, 20), existingNames);
                      return (
                        <>
                          {previewNames.map((name, idx) => (
                            <div key={idx} className="text-gray-700 text-sm">
                              {name}
                            </div>
                          ))}
                          {formData.quantity > 20 && (
                            <p className="text-gray-500 italic text-sm pt-1">
                              + {formData.quantity - 20} more...
                            </p>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                >
                  <option value="tank">Tank</option>
                  <option value="barrel">Barrel</option>
                  <option value="tote">Tote</option>
                  <option value="ibc">IBC</option>
                  <option value="bin">Bin</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
                <select
                  value={formData.material}
                  onChange={(e) => setFormData({...formData, material: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                >
                  <option value="stainless">Stainless Steel</option>
                  <option value="oak_french">French Oak</option>
                  <option value="oak_american">American Oak</option>
                  <option value="oak_hungarian">Hungarian Oak</option>
                  <option value="concrete">Concrete</option>
                  <option value="plastic">Plastic</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (gallons) *</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.capacity_gallons}
                  onChange={(e) => setFormData({...formData, capacity_gallons: e.target.value})}
                  required
                  placeholder="e.g., 60"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="e.g., Cellar A, Row 3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                >
                  <option value="empty">Empty</option>
                  <option value="in_use">In Use</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="needs_cip">Needs CIP</option>
                  <option value="sanitized">Sanitized - Ready</option>
                  <option value="needs_repair">Needs Repair</option>
                  <option value="retired">Retired</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last CIP Date</label>
                <input
                  type="date"
                  value={formData.last_cip_date}
                  onChange={(e) => setFormData({...formData, last_cip_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CIP Product</label>
                <input
                  type="text"
                  value={formData.cip_product}
                  onChange={(e) => setFormData({...formData, cip_product: e.target.value})}
                  placeholder="e.g., Soda ash, PAA"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                />
              </div>
            </div>

            {/* Barrel-specific fields */}
            {formData.type === 'barrel' && (
              <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Barrel Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cooperage</label>
                    <input
                      type="text"
                      value={formData.cooperage}
                      onChange={(e) => setFormData({...formData, cooperage: e.target.value})}
                      placeholder="e.g., Taransaud, Francois Freres"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Toast Level</label>
                    <input
                      type="text"
                      value={formData.toast_level}
                      onChange={(e) => setFormData({...formData, toast_level: e.target.value})}
                      placeholder="e.g., Medium, Medium+"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
                    <input
                      type="date"
                      value={formData.purchase_date}
                      onChange={(e) => setFormData({...formData, purchase_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Fills</label>
                    <input
                      type="number"
                      value={formData.total_fills}
                      onChange={(e) => setFormData({...formData, total_fills: e.target.value})}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows="3"
                placeholder="Optional notes..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button
                type="submit"
                className="px-6 py-2 bg-[#7C203A] text-white rounded-lg hover:bg-[#8B2E48] transition-colors shadow-sm"
              >
                {editingContainer ? 'Update Vessel' : 'Create Vessel'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters and View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-gray-500" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="tank">Tanks</option>
            <option value="barrel">Barrels</option>
            <option value="tote">Totes</option>
            <option value="ibc">IBCs</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="empty">Empty</option>
            <option value="in_use">In Use</option>
            <option value="cleaning">Cleaning</option>
            <option value="needs_cip">Needs CIP</option>
            <option value="sanitized">Sanitized</option>
            <option value="needs_repair">Needs Repair</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
          >
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="capacity-asc">Capacity (Low-High)</option>
            <option value="capacity-desc">Capacity (High-Low)</option>
            <option value="fill-asc">Fill % (Low-High)</option>
            <option value="fill-desc">Fill % (High-Low)</option>
            <option value="type-asc">Type (A-Z)</option>
            <option value="type-desc">Type (Z-A)</option>
          </select>

          {selectedContainers.length > 0 && (
            <button
              onClick={() => setShowBulkActions(!showBulkActions)}
              className="flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
            >
              <Layers className="w-4 h-4" />
              {selectedContainers.length} Selected
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-[#7C203A] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            title="Grid View"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded ${viewMode === 'list' ? 'bg-[#7C203A] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            title="List View"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`p-2 rounded ${viewMode === 'map' ? 'bg-[#7C203A] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            title="Cellar Map View"
          >
            <Map className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bulk Actions Panel */}
      {showBulkActions && selectedContainers.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-purple-900 mb-3">Bulk Actions ({selectedContainers.length} vessels)</h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleBulkStatusChange('empty')}
              className="px-3 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 border border-gray-300 text-sm font-medium"
            >
              Mark Empty
            </button>
            <button
              onClick={() => handleBulkStatusChange('needs_cip')}
              className="px-3 py-2 bg-white text-orange-700 rounded-lg hover:bg-orange-50 border border-orange-300 text-sm font-medium"
            >
              Needs CIP
            </button>
            <button
              onClick={handleBulkCIP}
              className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Mark Sanitized
            </button>
            <button
              onClick={() => setSelectedContainers([])}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium ml-auto"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Vessel List/Grid/Map */}
      {filteredContainers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 mb-4">No vessels found</p>
          <button
            onClick={() => setShowForm(true)}
            className="text-[#7C203A] hover:text-[#8B2E48] font-medium"
          >
            Add your first vessel
          </button>
        </div>
      ) : viewMode === 'map' ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Map className="w-5 h-5 text-[#7C203A]" />
              <h3 className="text-lg font-semibold text-gray-900">Cellar Map</h3>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-gray-300"></div><span>Empty</span></div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-green-500"></div><span>In Use</span></div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-emerald-400"></div><span>Sanitized</span></div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-orange-500"></div><span>Needs CIP</span></div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div><span>Cleaning</span></div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-500"></div><span>Needs Repair</span></div>
            </div>
          </div>

          {/* Simplified Cellar Schematic */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-8 min-h-[500px]">
            {/* Group containers by location */}
            {Array.from(new Set(filteredContainers.map(c => c.location || 'Unassigned'))).map((location, locIdx) => {
              const locationContainers = filteredContainers.filter(c => (c.location || 'Unassigned') === location);

              return (
                <div key={location} className={`mb-6 ${locIdx > 0 ? 'mt-8' : ''}`}>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Map className="w-4 h-4" />
                    {location}
                  </h4>

                  <div className="grid grid-cols-5 md:grid-cols-8 lg:grid-cols-12 gap-2">
                    {locationContainers.map((container) => {
                      const Icon = getContainerIcon(container.type);
                      const indicator = getStatusIndicator(container.status);
                      const isSelected = selectedContainers.includes(container.id);
                      const lot = getLotForContainer(container.id);

                      return (
                        <button
                          key={container.id}
                          onClick={() => toggleContainerSelection(container.id)}
                          className={`relative group aspect-square ${indicator.bg} ${indicator.border} border-2 rounded-lg
                            hover:scale-110 transition-all ${indicator.ring} ${isSelected ? 'ring-4 ring-purple-500' : ''}`}
                          title={`${container.name} - ${container.status}${lot ? ` (${lot.name})` : ''}`}
                        >
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Icon className="w-4 h-4 md:w-6 md:h-6 text-white opacity-80" />
                          </div>

                          {/* Tooltip on hover */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                            <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                              <p className="font-semibold">{container.name}</p>
                              <p className="text-gray-300">{container.capacity_gallons} gal</p>
                              {lot && <p className="text-purple-300">{lot.name}</p>}
                            </div>
                          </div>

                          {/* Selection indicator */}
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 text-sm text-gray-600">
            <p className="flex items-center gap-2">
              <span className="font-medium">Tip:</span> Click vessels to select them for bulk actions
            </p>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContainers.map((container) => {
            const Icon = getContainerIcon(container.type);
            const lot = getLotForContainer(container.id);
            const currentVolume = lot?.current_volume_gallons || container.current_volume_gallons || 0;
            const utilization = container.capacity_gallons > 0
              ? (currentVolume / container.capacity_gallons) * 100
              : 0;

            return (
              <div
                key={container.id}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/production/vessel/${container.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{container.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{container.type}</p>
                    </div>
                  </div>
                  {/* Show lot status if there's a lot, otherwise container status */}
                  {lot ? (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getLotStatusColor(lot.status)}`}>
                      {lot.status.replace(/_/g, ' ')}
                    </span>
                  ) : (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(container.status)}`}>
                      {container.status.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>

                {lot && (
                  <div className="mb-3 p-2 bg-purple-50 rounded-lg">
                    <p className="text-sm font-medium text-purple-900">{lot.varietal} • {lot.vintage}</p>
                    {lot.block?.name && (
                      <p className="text-xs text-purple-700">{lot.block.name}</p>
                    )}
                  </div>
                )}

                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Capacity:</span>
                    <span className="font-medium text-gray-900">{container.capacity_gallons} gal</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Fill:</span>
                    <span className="font-medium text-gray-900">{utilization.toFixed(0)}%</span>
                  </div>
                  {container.location && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Location:</span>
                      <span className="font-medium text-gray-900">{container.location}</span>
                    </div>
                  )}
                  {container.type === 'barrel' && container.total_fills !== null && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Fills:</span>
                      <span className="font-medium text-gray-900">{container.total_fills}</span>
                    </div>
                  )}
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div
                    className="bg-[#7C203A] h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(utilization, 100)}%` }}
                  ></div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(container);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShowQR(container);
                    }}
                    className="px-3 py-2 text-sm text-[#7C203A] hover:bg-[#7C203A]/10 rounded transition-colors"
                    title="View QR Code"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicate(container);
                    }}
                    className="px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Duplicate"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(container.id);
                    }}
                    className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-bold text-gray-700 uppercase">Name</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-gray-700 uppercase">Type</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-gray-700 uppercase">Capacity</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-gray-700 uppercase">Utilization</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-gray-700 uppercase">Status</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-gray-700 uppercase">Location</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredContainers.map((container) => {
                const lot = getLotForContainer(container.id);
                const currentVolume = lot?.current_volume_gallons || container.current_volume_gallons || 0;
                const utilization = container.capacity_gallons > 0
                  ? (currentVolume / container.capacity_gallons) * 100
                  : 0;

                return (
                  <tr
                    key={container.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/production/vessel/${container.id}`)}
                  >
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{container.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-700 capitalize">{container.type}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{container.capacity_gallons} gal</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-[#7C203A] h-2 rounded-full"
                            style={{ width: `${Math.min(utilization, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-700">{utilization.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {/* Show lot status if there's a lot, otherwise container status */}
                      {lot ? (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getLotStatusColor(lot.status)}`}>
                          {lot.status.replace(/_/g, ' ')}
                        </span>
                      ) : (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(container.status)}`}>
                          {container.status.replace(/_/g, ' ')}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">{container.location || '—'}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(container);
                          }}
                          className="text-[#7C203A] hover:text-[#8B2E48]"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShowQR(container);
                          }}
                          className="text-[#7C203A] hover:text-[#8B2E48]"
                          title="View QR Code"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicate(container);
                          }}
                          className="text-blue-600 hover:text-blue-700"
                          title="Duplicate"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(container.id);
                          }}
                          className="text-gray-500 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Duplicate Vessel Modal */}
      {showDuplicateModal && duplicatingContainer && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="bg-gray-800 px-6 py-4 flex items-center justify-between rounded-t-xl">
              <div>
                <h3 className="text-xl font-bold text-white">Duplicate Vessel</h3>
                <p className="text-gray-300 text-sm">Creating copy of {duplicatingContainer.name.split(' ').slice(0, -1).join(' ')}</p>
              </div>
              <button
                onClick={() => setShowDuplicateModal(false)}
                className="hover:bg-gray-700 p-2 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-900 stroke-2" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* New Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Vessel Name *</label>
                <input
                  type="text"
                  value={duplicatingContainer.name}
                  onChange={(e) => setDuplicatingContainer({...duplicatingContainer, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Key Properties Preview */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="font-semibold text-gray-900 text-sm mb-2">Properties to Copy</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600">Type</p>
                    <p className="font-medium text-gray-900 capitalize">{duplicatingContainer.type}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Capacity</p>
                    <p className="font-medium text-gray-900">{duplicatingContainer.capacity_gallons} gal</p>
                  </div>
                  {duplicatingContainer.type === 'barrel' && (
                    <>
                      <div>
                        <p className="text-gray-600">Cooperage</p>
                        <p className="font-medium text-gray-900">{duplicatingContainer.cooperage || '—'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Toast Level</p>
                        <p className="font-medium text-gray-900">{duplicatingContainer.toast_level || '—'}</p>
                      </div>
                    </>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">Status will be set to Empty, fills reset to 0</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleDuplicateSubmit}
                  className="flex-1 px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Create Duplicate
                </button>
                <button
                  onClick={() => setShowDuplicateModal(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Bulk Create Modal */}
      {showBulkCreateModal && bulkCreateTemplate && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full">
            <div className="bg-gray-800 px-6 py-4 flex items-center justify-between rounded-t-xl">
              <div>
                <h3 className="text-xl font-bold text-white">Bulk Create Vessels</h3>
                <p className="text-gray-300 text-sm">Create multiple vessels from template</p>
              </div>
              <button
                onClick={() => setShowBulkCreateModal(false)}
                className="hover:bg-gray-700 p-2 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-900 stroke-2" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Base Name Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base Name * <span className="text-gray-500 text-xs">(vessels will be named: "{bulkBaseName} 1", "{bulkBaseName} 2", etc.)</span>
                </label>
                <input
                  type="text"
                  value={bulkBaseName}
                  onChange={(e) => {
                    setBulkBaseName(e.target.value);
                    updateBulkPreview(e.target.value, bulkCount);
                  }}
                  placeholder="e.g., Texas Oak Barrel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
                />
              </div>

              {/* Template Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template Vessel (for properties)</label>
                <select
                  value={bulkCreateTemplate.id}
                  onChange={(e) => {
                    const template = containers.find(c => c.id === e.target.value);
                    setBulkCreateTemplate(template);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
                >
                  {containers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type}, {c.capacity_gallons} gal)
                    </option>
                  ))}
                </select>
              </div>

              {/* Number of Vessels */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Vessels: <span className="text-gray-800 font-bold">{bulkCount}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={bulkCount}
                  onChange={(e) => {
                    const count = parseInt(e.target.value);
                    setBulkCount(count);
                    updateBulkPreview(bulkBaseName, count);
                  }}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>1</span>
                  <span>100</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Template Properties */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="font-semibold text-gray-900 text-sm mb-2">Template Properties</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium text-gray-900 capitalize">{bulkCreateTemplate.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Capacity:</span>
                      <span className="font-medium text-gray-900">{bulkCreateTemplate.capacity_gallons} gal</span>
                    </div>
                    {bulkCreateTemplate.type === 'barrel' && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Cooperage:</span>
                          <span className="font-medium text-gray-900">{bulkCreateTemplate.cooperage || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Toast:</span>
                          <span className="font-medium text-gray-900">{bulkCreateTemplate.toast_level || '—'}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Name Preview */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="font-semibold text-gray-900 text-sm mb-2">
                    Names Preview ({bulkPreviewNames.length})
                  </p>
                  <div className="bg-white rounded border border-gray-200 p-2 max-h-32 overflow-y-auto text-sm space-y-0.5">
                    {bulkPreviewNames.slice(0, 10).map((name, idx) => (
                      <div key={idx} className="text-gray-700 text-xs">
                        {name}
                      </div>
                    ))}
                    {bulkPreviewNames.length > 10 && (
                      <p className="text-gray-500 italic text-xs">+ {bulkPreviewNames.length - 10} more...</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleBulkCreateSubmit}
                  className="flex-1 px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  Create {bulkCount} Vessel{bulkCount !== 1 ? 's' : ''}
                </button>
                <button
                  onClick={() => setShowBulkCreateModal(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* QR Code Modal with Printable Sticker Label */}
      {showQRModal && qrContainer && createPortal(
        <>
          <style>{`
            @media print {
              @page {
                size: 4in 2in;
                margin: 0;
              }

              html, body {
                width: 4in;
                height: 2in;
                margin: 0;
                padding: 0;
                overflow: hidden;
              }

              * {
                visibility: hidden;
              }

              .print-only-label,
              .print-only-label * {
                visibility: visible;
              }

              .print-only-label {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 4in !important;
                height: 2in !important;
                margin: 0 !important;
                padding: 0.15in !important;
                box-sizing: border-box !important;
                overflow: hidden !important;
              }
            }

            .print-only-label {
              display: none;
            }

            @media print {
              .print-only-label {
                display: block !important;
              }
            }
          `}</style>

          {/* Screen view - Modal */}
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 print:hidden">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full">
              <div className="bg-gray-800 px-6 py-4 flex items-center justify-between rounded-t-xl">
                <div>
                  <h3 className="text-xl font-bold text-white">Vessel Label</h3>
                  <p className="text-gray-300 text-sm">Optimized for 4" x 2" sticker printer</p>
                </div>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="hover:bg-gray-700 p-2 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-900 stroke-2" />
                </button>
              </div>

              <div className="p-8">
                {/* Preview of sticker */}
                <div
                  className="border-2 border-gray-800 bg-white mx-auto"
                  style={{ width: '4in', height: '2in', padding: '0.15in' }}
                >
                  <div className="flex items-stretch h-full gap-2">
                    {/* Left side - Text info */}
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="space-y-1">
                        <div>
                          <p className="text-[8px] text-gray-600 font-semibold uppercase tracking-wide">Barrel ID</p>
                          <p className="text-[14px] font-bold text-gray-900 leading-tight">{qrContainer.name}</p>
                        </div>
                        <div>
                          <p className="text-[8px] text-gray-600 font-semibold uppercase tracking-wide">Variety</p>
                          <p className="text-[12px] font-semibold text-gray-900 leading-tight">
                            {(() => {
                              const lot = getLotForContainer(qrContainer.id);
                              return lot?.varietal || '—';
                            })()}
                          </p>
                        </div>
                        <div>
                          <p className="text-[8px] text-gray-600 font-semibold uppercase tracking-wide">Vintage</p>
                          <p className="text-[12px] font-semibold text-gray-900 leading-tight">
                            {(() => {
                              const lot = getLotForContainer(qrContainer.id);
                              return lot?.vintage || '—';
                            })()}
                          </p>
                        </div>
                        <div className="pt-1 border-t border-gray-300">
                          <p className="text-[7px] text-gray-500">
                            {qrContainer.capacity_gallons} gal • {qrContainer.material?.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right side - QR Code */}
                    <div id="qr-code-container" className="flex items-center justify-center" style={{ width: '1.6in' }}>
                      <QRCode
                        value={`${window.location.origin}/production/vessel/${qrContainer.id}?scan=true`}
                        size={144}
                        level="H"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-center text-sm text-gray-600">
                  <p className="font-medium">Preview of 4" x 2" sticker label</p>
                  <p className="text-xs mt-1">Click "Print Label" to print on your sticker printer</p>
                </div>
              </div>

              <div className="px-6 pb-6 flex items-center gap-3">
                <button
                  onClick={handlePrintLabel}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#7C203A] text-white rounded-lg hover:bg-[#8B2E48] transition-colors font-medium"
                >
                  <Printer className="w-5 h-5" />
                  Print Label
                </button>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>

          {/* Print-only version - Hidden on screen, shows when printing */}
          <div className="print-only-label" style={{ position: 'absolute', left: 0, top: 0 }}>
            <table
              style={{
                width: '4in',
                height: '2in',
                padding: '0.15in',
                border: '2px solid #000',
                background: 'white',
                boxSizing: 'border-box',
                borderCollapse: 'collapse',
                tableLayout: 'fixed'
              }}
            >
              <tbody>
                <tr>
                  {/* Left side - Text info */}
                  <td style={{ width: '2.4in', verticalAlign: 'middle', padding: '0.1in' }}>
                    <div>
                      <div style={{ marginBottom: '4px' }}>
                        <div style={{ fontSize: '8px', color: '#666', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>BARREL ID</div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#000', lineHeight: 1.2 }}>{qrContainer.name}</div>
                      </div>
                      <div style={{ marginBottom: '4px' }}>
                        <div style={{ fontSize: '8px', color: '#666', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>VARIETY</div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#000', lineHeight: 1.2 }}>
                          {(() => {
                            const lot = getLotForContainer(qrContainer.id);
                            return lot?.varietal || '—';
                          })()}
                        </div>
                      </div>
                      <div style={{ marginBottom: '4px' }}>
                        <div style={{ fontSize: '8px', color: '#666', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>VINTAGE</div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#000', lineHeight: 1.2 }}>
                          {(() => {
                            const lot = getLotForContainer(qrContainer.id);
                            return lot?.vintage || '—';
                          })()}
                        </div>
                      </div>
                      <div style={{ paddingTop: '4px', borderTop: '1px solid #ccc', marginTop: '4px' }}>
                        <div style={{ fontSize: '7px', color: '#888' }}>
                          {qrContainer.capacity_gallons} gal • {qrContainer.material?.replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Right side - QR Code */}
                  <td style={{ width: '1.6in', textAlign: 'center', verticalAlign: 'middle', padding: '0.1in' }}>
                    <QRCode
                      value={`${window.location.origin}/production/vessel/${qrContainer.id}?scan=true`}
                      size={144}
                      level="H"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>,
        document.body
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        confirmText="OK"
        cancelText="Cancel"
      />
    </div>
  );
}
