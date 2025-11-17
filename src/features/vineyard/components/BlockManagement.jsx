import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import {
  Plus,
  Edit2,
  Trash2,
  MapPin,
  Download,
  Grape,
  Calculator,
  TrendingUp,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Shield,
  Clock,
  Map as MapIcon,
  List,
  Camera,
  BarChart3,
  Printer,
  Beaker,
  X
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { ImportPlanModal } from './ImportPlanModal';
import { BlockMap } from './BlockMap';
import { FieldPhotos } from './FieldPhotos';
import { FieldYieldHistory } from './FieldYieldHistory';
import {
  listVineyardBlocks,
  createVineyardBlock,
  updateVineyardBlock,
  deleteVineyardBlock,
  getActivePHILocks,
  getActiveREILocks,
  createHarvestSample,
  getLatestSampleByBlock
} from '@/shared/lib/vineyardApi';

export function BlockManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddingBlock, setIsAddingBlock] = useState(false);
  const [editingBlock, setEditingBlock] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showDerived, setShowDerived] = useState(false);
  const [phiLocks, setPhiLocks] = useState([]);
  const [reiLocks, setReiLocks] = useState([]);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [autoStartDrawing, setAutoStartDrawing] = useState(false);
  const [showPhotos, setShowPhotos] = useState(false);
  const [showYieldHistory, setShowYieldHistory] = useState(false);
  const [selectedField, setSelectedField] = useState(null);
  const [showCustomFields, setShowCustomFields] = useState(false);
  const [newCustomFieldKey, setNewCustomFieldKey] = useState('');
  const [newCustomFieldValue, setNewCustomFieldValue] = useState('');
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [selectedBlockForSample, setSelectedBlockForSample] = useState(null);
  const [savingSample, setSavingSample] = useState(false);
  const [sampleFormData, setSampleFormData] = useState({
    brix: '',
    ta: '',
    ph: '',
    berry_size: '',
    cluster_condition: '',
    disease_pressure: '',
    ready_to_pick: false,
    estimated_days_to_harvest: '',
    notes: ''
  });

  const [formData, setFormData] = useState({
    // Identity
    name: '',
    status: 'active',
    // Viticulture
    variety: 'Cabernet Sauvignon',
    rootstock: '',
    clone: '',
    trellis_system: 'VSP',
    row_spacing_ft: 10,
    vine_spacing_ft: 6,
    row_orientation_deg: null,
    year_planted: null,
    vine_count_reported: null,
    // Area
    acres: '',
    geom: null, // Geometry from map
    // Operations
    irrigation_zone: '',
    // Soil Data
    soil_type: '',
    soil_ph: null,
    soil_texture: '',
    soil_drainage: null,
    soil_organic_matter_percent: null,
    soil_notes: '',
    // Custom Fields
    custom_fields: {},
    notes: '',
    // Auto-calculated metrics (user can override)
    estimated_vines: null,
    estimated_rows: null
  });

  // Load blocks from Supabase
  useEffect(() => {
    if (user) {
      loadBlocks();
    }
  }, [user]);

  // Prevent body scroll when modal is open and reset scroll position
  useEffect(() => {
    if (isAddingBlock) {
      document.body.style.overflow = 'hidden';
      // Reset scroll position to top when modal opens
      window.scrollTo(0, 0);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isAddingBlock]);

  const loadBlocks = async () => {
    setLoading(true);
    const [blocksRes, phiRes, reiRes] = await Promise.all([
      listVineyardBlocks(),
      getActivePHILocks(),
      getActiveREILocks()
    ]);

    if (!blocksRes.error && blocksRes.data) {
      setBlocks(blocksRes.data);
    }
    if (!phiRes.error && phiRes.data) {
      setPhiLocks(phiRes.data);
    }
    if (!reiRes.error && reiRes.data) {
      setReiLocks(reiRes.data);
    }
    setLoading(false);
  };

  // Calculate derived metrics
  const calculateMetrics = (data) => {
    const acres = parseFloat(data.acres) || 0;
    const rowSpacing = parseFloat(data.row_spacing_ft) || 10;
    const vineSpacing = parseFloat(data.vine_spacing_ft) || 6;

    if (acres === 0 || rowSpacing === 0 || vineSpacing === 0) {
      return {
        vinesPerAcre: 0,
        estimatedVines: 0,
        estimatedRows: 0,
        estimatedPosts: 0,
        estimatedWireFt: 0
      };
    }

    // Vines per acre = 43,560 sq ft / (row spacing * vine spacing)
    const vinesPerAcre = Math.round(43560 / (rowSpacing * vineSpacing));

    // Estimated total vines
    const estimatedVines = Math.round(acres * vinesPerAcre);

    // Estimated row length (approximate as square root of area for estimation)
    const areaFt = acres * 43560;
    const rowLengthFt = Math.sqrt(areaFt);

    // Estimated rows
    const estimatedRows = Math.round(areaFt / (rowSpacing * rowLengthFt));

    // Estimated posts (every 30 feet)
    const totalWireLengthFt = estimatedRows * rowLengthFt;
    const estimatedPosts = Math.ceil(totalWireLengthFt / 30);

    return {
      vinesPerAcre,
      estimatedVines: data.vine_count_reported || estimatedVines,
      estimatedRows,
      estimatedPosts,
      estimatedWireFt: Math.round(totalWireLengthFt)
    };
  };

  const metrics = calculateMetrics(formData);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Convert empty strings to null for numeric fields
    const blockData = { ...formData };
    ['row_orientation_deg', 'year_planted', 'vine_count_reported', 'acres'].forEach(field => {
      if (blockData[field] === '' || blockData[field] === null) {
        blockData[field] = null;
      }
    });

    // Convert numeric strings to numbers
    if (blockData.acres) blockData.acres = parseFloat(blockData.acres);
    if (blockData.row_spacing_ft) blockData.row_spacing_ft = parseFloat(blockData.row_spacing_ft);
    if (blockData.vine_spacing_ft) blockData.vine_spacing_ft = parseFloat(blockData.vine_spacing_ft);

    if (editingBlock) {
      const { error } = await updateVineyardBlock(editingBlock.id, blockData);
      if (!error) {
        await loadBlocks();
        resetForm();
      } else {
        alert(`Error updating block: ${error.message}`);
      }
    } else {
      const { error } = await createVineyardBlock(blockData);
      if (!error) {
        await loadBlocks();
        resetForm();
      } else {
        alert(`Error creating block: ${error.message}`);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      status: 'active',
      variety: 'Cabernet Sauvignon',
      rootstock: '',
      clone: '',
      trellis_system: 'VSP',
      row_spacing_ft: 10,
      vine_spacing_ft: 6,
      row_orientation_deg: null,
      year_planted: null,
      vine_count_reported: null,
      acres: '',
      geom: null,
      irrigation_zone: '',
      soil_type: '',
      soil_ph: null,
      soil_texture: '',
      soil_drainage: null,
      soil_organic_matter_percent: null,
      soil_notes: '',
      custom_fields: {},
      notes: '',
      estimated_vines: null,
      estimated_rows: null
    });
    setIsAddingBlock(false);
    setEditingBlock(null);
    setShowAdvanced(false);
    setShowDerived(false);
  };

  const handleEdit = (block) => {
    const blockMetrics = calculateMetrics({
      acres: block.acres,
      row_spacing_ft: block.row_spacing_ft,
      vine_spacing_ft: block.vine_spacing_ft,
      vine_count_reported: block.vine_count_reported
    });

    setFormData({
      name: block.name || '',
      status: block.status || 'active',
      variety: block.variety || 'Cabernet Sauvignon',
      rootstock: block.rootstock || '',
      clone: block.clone || '',
      trellis_system: block.trellis_system || 'VSP',
      row_spacing_ft: block.row_spacing_ft || 10,
      vine_spacing_ft: block.vine_spacing_ft || 6,
      row_orientation_deg: block.row_orientation_deg || null,
      year_planted: block.year_planted || null,
      vine_count_reported: block.vine_count_reported || null,
      acres: block.acres || '',
      geom: block.geom || null,
      irrigation_zone: block.irrigation_zone || '',
      soil_type: block.soil_type || '',
      soil_ph: block.soil_ph || null,
      soil_texture: block.soil_texture || '',
      soil_drainage: block.soil_drainage || null,
      soil_organic_matter_percent: block.soil_organic_matter_percent || null,
      soil_notes: block.soil_notes || '',
      custom_fields: block.custom_fields || {},
      notes: block.notes || '',
      estimated_vines: blockMetrics.estimatedVines,
      estimated_rows: blockMetrics.estimatedRows
    });
    setEditingBlock(block);
    setIsAddingBlock(true);
  };

  const handleDelete = async (blockId) => {
    if (confirm('Are you sure you want to delete this block?')) {
      const { error } = await deleteVineyardBlock(blockId);
      if (!error) {
        await loadBlocks();
      } else {
        alert(`Error deleting block: ${error.message}`);
      }
    }
  };

  const handleOpenSampleModal = (block) => {
    setSelectedBlockForSample(block);
    setShowSampleModal(true);
  };

  const handleAddSample = async (e) => {
    e.preventDefault();
    setSavingSample(true);

    const sampleData = {
      block_id: selectedBlockForSample.id,
      sample_date: new Date().toISOString().split('T')[0],
      brix: sampleFormData.brix ? parseFloat(sampleFormData.brix) : null,
      ta: sampleFormData.ta ? parseFloat(sampleFormData.ta) : null,
      ph: sampleFormData.ph ? parseFloat(sampleFormData.ph) : null,
      berry_size: sampleFormData.berry_size || null,
      cluster_condition: sampleFormData.cluster_condition || null,
      disease_pressure: sampleFormData.disease_pressure || null,
      ready_to_pick: sampleFormData.ready_to_pick,
      estimated_days_to_harvest: sampleFormData.estimated_days_to_harvest ? parseInt(sampleFormData.estimated_days_to_harvest) : null,
      notes: sampleFormData.notes || null
    };

    console.log('Creating field sample:', sampleData);
    const { data, error } = await createHarvestSample(sampleData);

    if (error) {
      console.error('Error creating sample:', error);
      alert(`Error creating sample: ${error.message}`);
    } else {
      console.log('Sample created successfully:', data);
      setShowSampleModal(false);
      setSelectedBlockForSample(null);
      setSampleFormData({
        brix: '',
        ta: '',
        ph: '',
        berry_size: '',
        cluster_condition: '',
        disease_pressure: '',
        ready_to_pick: false,
        estimated_days_to_harvest: '',
        notes: ''
      });
      await loadBlocks();
    }

    setSavingSample(false);
  };

  const handleAddMap = (block) => {
    setSelectedBlockId(block.id);
    setAutoStartDrawing(true);
    setViewMode('map');
  };

  const handleAddCustomField = () => {
    if (!newCustomFieldKey.trim()) {
      alert('Please enter a field name');
      return;
    }

    setFormData({
      ...formData,
      custom_fields: {
        ...formData.custom_fields,
        [newCustomFieldKey.trim()]: newCustomFieldValue.trim()
      }
    });

    setNewCustomFieldKey('');
    setNewCustomFieldValue('');
  };

  const handleRemoveCustomField = (key) => {
    const updatedFields = { ...formData.custom_fields };
    delete updatedFields[key];
    setFormData({
      ...formData,
      custom_fields: updatedFields
    });
  };

  const handleUpdateCustomField = (oldKey, newKey, value) => {
    const updatedFields = { ...formData.custom_fields };
    if (oldKey !== newKey) {
      delete updatedFields[oldKey];
    }
    updatedFields[newKey] = value;
    setFormData({
      ...formData,
      custom_fields: updatedFields
    });
  };

  const handleAutoCalculateMetrics = () => {
    const calculated = calculateMetrics(formData);
    setFormData({
      ...formData,
      estimated_vines: calculated.estimatedVines,
      estimated_rows: calculated.estimatedRows
    });
  };

  const handleDrawFieldOnMap = () => {
    // Close the form and open map mode with drawing enabled
    setIsAddingBlock(false);
    setViewMode('map');
    setAutoStartDrawing(true);
  };

  const handleExportCSV = () => {
    if (blocks.length === 0) {
      alert('No fields to export');
      return;
    }

    // Collect all unique custom field keys across all blocks
    const allCustomFieldKeys = new Set();
    blocks.forEach(block => {
      if (block.custom_fields) {
        Object.keys(block.custom_fields).forEach(key => allCustomFieldKeys.add(key));
      }
    });
    const customFieldKeys = Array.from(allCustomFieldKeys).sort();

    // Define CSV headers
    const headers = [
      'Field Name',
      'Status',
      'Acres',
      'Variety',
      'Rootstock',
      'Clone',
      'Trellis System',
      'Row Spacing (ft)',
      'Vine Spacing (ft)',
      'Vines per Acre',
      'Total Vines',
      'Estimated Rows',
      'Year Planted',
      'Row Orientation (deg)',
      'Irrigation Zone',
      'Soil Type',
      'Soil Texture',
      'Soil pH',
      'Soil Drainage',
      'Organic Matter (%)',
      'Soil Notes',
      ...customFieldKeys.map(key => `Custom: ${key}`),
      'Has Map Geometry',
      'Notes'
    ];

    // Convert blocks to CSV rows
    const rows = blocks.map(block => {
      const metrics = calculateMetrics({
        acres: block.acres,
        row_spacing_ft: block.row_spacing_ft,
        vine_spacing_ft: block.vine_spacing_ft,
        vine_count_reported: block.vine_count_reported
      });

      const customFieldValues = customFieldKeys.map(key =>
        (block.custom_fields && block.custom_fields[key]) || ''
      );

      return [
        block.name || '',
        block.status || '',
        block.acres || '',
        block.variety || '',
        block.rootstock || '',
        block.clone || '',
        block.trellis_system || '',
        block.row_spacing_ft || '',
        block.vine_spacing_ft || '',
        metrics.vinesPerAcre || '',
        metrics.estimatedVines || '',
        metrics.estimatedRows || '',
        block.year_planted || '',
        block.row_orientation_deg || '',
        block.irrigation_zone || '',
        block.soil_type || '',
        block.soil_texture || '',
        block.soil_ph || '',
        block.soil_drainage || '',
        block.soil_organic_matter_percent || '',
        block.soil_notes || '',
        ...customFieldValues,
        (block.geom && block.geom.coordinates) ? 'Yes' : 'No',
        block.notes ? `"${block.notes.replace(/"/g, '""')}"` : ''
      ];
    });

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        // Escape cells that contain commas or quotes
        const cellStr = String(cell);
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `vineyard-fields-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = () => {
    if (blocks.length === 0) {
      alert('No fields to print');
      return;
    }

    // Generate HTML report
    const reportContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Vineyard Fields Report - ${new Date().toLocaleDateString()}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Arial', 'Helvetica', sans-serif;
              padding: 20px;
              color: #333;
            }
            h1 {
              color: #059669;
              margin-bottom: 10px;
              font-size: 28px;
            }
            .report-date {
              color: #666;
              margin-bottom: 30px;
              font-size: 14px;
            }
            .field-card {
              border: 1px solid #ddd;
              border-radius: 8px;
              padding: 20px;
              margin-bottom: 20px;
              page-break-inside: avoid;
            }
            .field-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 15px;
              border-bottom: 2px solid #059669;
              padding-bottom: 10px;
            }
            .field-name {
              font-size: 20px;
              font-weight: bold;
              color: #1f2937;
            }
            .field-variety {
              color: #059669;
              font-size: 16px;
              font-weight: 600;
            }
            .field-status {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
            }
            .status-active { background: #d1fae5; color: #065f46; }
            .status-fallow { background: #f3f4f6; color: #374151; }
            .status-new { background: #dbeafe; color: #1e40af; }
            .status-removed { background: #fee2e2; color: #991b1b; }
            .info-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 15px;
              margin-bottom: 15px;
            }
            .info-item {
              background: #f9fafb;
              padding: 10px;
              border-radius: 6px;
            }
            .info-label {
              font-size: 11px;
              color: #6b7280;
              text-transform: uppercase;
              font-weight: 600;
              margin-bottom: 4px;
            }
            .info-value {
              font-size: 15px;
              color: #1f2937;
              font-weight: 600;
            }
            .section-title {
              font-size: 14px;
              font-weight: 700;
              color: #374151;
              margin: 15px 0 8px 0;
              text-transform: uppercase;
            }
            .custom-fields {
              background: #fef3c7;
              padding: 10px;
              border-radius: 6px;
              margin-top: 10px;
            }
            .custom-field-item {
              display: flex;
              justify-content: space-between;
              padding: 4px 0;
              font-size: 13px;
            }
            .notes {
              background: #f0f9ff;
              padding: 10px;
              border-radius: 6px;
              margin-top: 10px;
              font-size: 13px;
              color: #374151;
              line-height: 1.5;
            }
            @media print {
              body { padding: 10px; }
              .field-card { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <h1>Vineyard Fields Report</h1>
          <div class="report-date">Generated on ${new Date().toLocaleString()}</div>

          ${blocks.map(block => {
            const metrics = calculateMetrics({
              acres: block.acres,
              row_spacing_ft: block.row_spacing_ft,
              vine_spacing_ft: block.vine_spacing_ft,
              vine_count_reported: block.vine_count_reported
            });

            return `
              <div class="field-card">
                <div class="field-header">
                  <div>
                    <div class="field-name">${block.name}</div>
                    <div class="field-variety">${block.variety}</div>
                  </div>
                  <span class="field-status status-${block.status}">${block.status}</span>
                </div>

                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">Acres</div>
                    <div class="info-value">${block.acres}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Total Vines</div>
                    <div class="info-value">${metrics.estimatedVines.toLocaleString()}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Vines/Acre</div>
                    <div class="info-value">${metrics.vinesPerAcre.toLocaleString()}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Trellis System</div>
                    <div class="info-value">${block.trellis_system}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Row Spacing</div>
                    <div class="info-value">${block.row_spacing_ft} ft</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Vine Spacing</div>
                    <div class="info-value">${block.vine_spacing_ft} ft</div>
                  </div>
                  ${block.rootstock ? `
                    <div class="info-item">
                      <div class="info-label">Rootstock</div>
                      <div class="info-value">${block.rootstock}</div>
                    </div>
                  ` : ''}
                  ${block.clone ? `
                    <div class="info-item">
                      <div class="info-label">Clone</div>
                      <div class="info-value">${block.clone}</div>
                    </div>
                  ` : ''}
                  ${block.year_planted ? `
                    <div class="info-item">
                      <div class="info-label">Year Planted</div>
                      <div class="info-value">${block.year_planted}</div>
                    </div>
                  ` : ''}
                  ${block.irrigation_zone ? `
                    <div class="info-item">
                      <div class="info-label">Irrigation Zone</div>
                      <div class="info-value">${block.irrigation_zone}</div>
                    </div>
                  ` : ''}
                </div>

                ${block.soil_type || block.soil_ph || block.soil_texture || block.soil_drainage ? `
                  <div class="section-title">Soil Information</div>
                  <div class="info-grid">
                    ${block.soil_type ? `
                      <div class="info-item">
                        <div class="info-label">Soil Type</div>
                        <div class="info-value">${block.soil_type}</div>
                      </div>
                    ` : ''}
                    ${block.soil_texture ? `
                      <div class="info-item">
                        <div class="info-label">Soil Texture</div>
                        <div class="info-value">${block.soil_texture}</div>
                      </div>
                    ` : ''}
                    ${block.soil_ph ? `
                      <div class="info-item">
                        <div class="info-label">Soil pH</div>
                        <div class="info-value">${block.soil_ph}</div>
                      </div>
                    ` : ''}
                    ${block.soil_drainage ? `
                      <div class="info-item">
                        <div class="info-label">Drainage</div>
                        <div class="info-value">${block.soil_drainage}</div>
                      </div>
                    ` : ''}
                    ${block.soil_organic_matter_percent ? `
                      <div class="info-item">
                        <div class="info-label">Organic Matter</div>
                        <div class="info-value">${block.soil_organic_matter_percent}%</div>
                      </div>
                    ` : ''}
                  </div>
                ` : ''}

                ${block.custom_fields && Object.keys(block.custom_fields).length > 0 ? `
                  <div class="section-title">Custom Fields</div>
                  <div class="custom-fields">
                    ${Object.entries(block.custom_fields).map(([key, value]) => `
                      <div class="custom-field-item">
                        <strong>${key}:</strong>
                        <span>${value}</span>
                      </div>
                    `).join('')}
                  </div>
                ` : ''}

                ${block.notes ? `
                  <div class="section-title">Notes</div>
                  <div class="notes">${block.notes}</div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </body>
      </html>
    `;

    // Open in new window and trigger print
    const printWindow = window.open('', '_blank');
    printWindow.document.write(reportContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  };

  const handleImportPlan = async (plan) => {
    console.log('🚀 IMPORT STARTED - Function is running!', plan.name);

    const planData = plan.data || {};
    const st = planData.st || {};
    const vineyardLayout = st.vineyardLayout || {};
    const calculatedLayout = vineyardLayout.calculatedLayout || {};
    const fieldLayouts = vineyardLayout.fieldLayouts || {}; // Per-field layout data

    // Dump ENTIRE data structure to see what we have
    console.log('📦 COMPLETE PLAN DATA:', JSON.stringify(planData, null, 2));
    console.log('🌿 vineyardLayout object:', vineyardLayout);
    console.log('📐 calculatedLayout object:', calculatedLayout);
    console.log('🏗️ st object:', st);
    console.log('📊 fieldLayouts object:', fieldLayouts);

    // Check ALL possible keys in vineyardLayout
    console.log('🔍 ALL vineyardLayout keys:', Object.keys(vineyardLayout));
    console.log('🔍 ALL calculatedLayout keys:', Object.keys(calculatedLayout));
    console.log('🔍 ALL st keys:', Object.keys(st));
    console.log('🔍 ALL fieldLayouts keys:', Object.keys(fieldLayouts));

    // Try multiple possible locations for fields data
    let fields = [];

    // Try savedFields first (most common location for field polygon data)
    if (vineyardLayout.savedFields && Array.isArray(vineyardLayout.savedFields)) {
      console.log('✅ Found fields at vineyardLayout.savedFields');
      fields = vineyardLayout.savedFields;
    } else if (st.vineyardFields && Array.isArray(st.vineyardFields)) {
      console.log('✅ Found fields at st.vineyardFields');
      fields = st.vineyardFields;
    } else if (st.savedFields && Array.isArray(st.savedFields)) {
      console.log('✅ Found fields at st.savedFields');
      fields = st.savedFields;
    } else if (planData.savedFields && Array.isArray(planData.savedFields)) {
      console.log('✅ Found fields at planData.savedFields');
      fields = planData.savedFields;
    } else if (planData.vineyardFields && Array.isArray(planData.vineyardFields)) {
      console.log('✅ Found fields at planData.vineyardFields');
      fields = planData.vineyardFields;
    } else if (vineyardLayout.fields && Array.isArray(vineyardLayout.fields)) {
      console.log('✅ Found fields at vineyardLayout.fields');
      fields = vineyardLayout.fields;
    } else if (planData.fields && Array.isArray(planData.fields)) {
      console.log('✅ Found fields at planData.fields');
      fields = planData.fields;
    } else if (calculatedLayout.fields && Array.isArray(calculatedLayout.fields)) {
      console.log('✅ Found fields at calculatedLayout.fields');
      fields = calculatedLayout.fields;
    } else {
      console.log('❌ NO FIELDS ARRAY FOUND IN ANY LOCATION');
    }

    console.log('📥 Fields found:', fields.length);
    if (fields.length > 0) {
      console.log('📥 First field:', fields[0]);
      console.table(fields);
    }

    // Check if there are multiple fields with polygons
    if (fields.length > 0) {
      // Import each field as a separate block
      let successCount = 0;
      for (const field of fields) {
        if (field.polygonPath && field.polygonPath.length >= 3) {
          // Convert Google Maps path to GeoJSON
          const coordinates = field.polygonPath.map(point => [point.lng, point.lat]);
          // Close the ring if not already closed
          if (coordinates.length > 0) {
            const first = coordinates[0];
            const last = coordinates[coordinates.length - 1];
            if (first[0] !== last[0] || first[1] !== last[1]) {
              coordinates.push([...first]);
            }
          }

          const geom = {
            type: 'Polygon',
            coordinates: [coordinates]
          };

          // Calculate acres from polygonPath if available
          let acres = st.acres || 0;
          if (window.google && window.google.maps && window.google.maps.geometry) {
            const googlePath = field.polygonPath.map(point =>
              new window.google.maps.LatLng(point.lat, point.lng)
            );
            const polygon = new window.google.maps.Polygon({ paths: googlePath });
            const areaSquareMeters = window.google.maps.geometry.spherical.computeArea(polygon.getPath());
            acres = areaSquareMeters / 4046.86; // Convert to acres
          }

          // Calculate vine count for this specific field
          let fieldVineCount = null;
          let fieldRows = null;

          // First, try to get from fieldLayouts (most accurate - per-field calculation)
          if (fieldLayouts[field.id]?.vineLayout) {
            fieldVineCount = fieldLayouts[field.id].vineLayout.totalVines;
            fieldRows = fieldLayouts[field.id].vineLayout.numberOfRows;
            console.log(`✅ Using fieldLayouts data for ${field.name}: ${fieldVineCount} vines, ${fieldRows} rows`);
          }
          // Second, try proportional calculation based on acreage
          else if (calculatedLayout.vineLayout?.totalVines && st.acres) {
            const vinesPerAcre = calculatedLayout.vineLayout.totalVines / st.acres;
            fieldVineCount = Math.round(vinesPerAcre * acres);
            console.log(`📐 Using proportional calculation for ${field.name}: ${fieldVineCount} vines`);
          }
          // Third, try field.vines if it exists
          else if (field.vines) {
            fieldVineCount = field.vines;
            fieldRows = field.rows;
            console.log(`📋 Using field.vines for ${field.name}: ${fieldVineCount} vines`);
          }

          const newBlockData = {
            name: field.name || `${plan.name} - ${field.name || `Field ${successCount + 1}`}`,
            variety: st.variety || st.grapeVariety || 'Cabernet Sauvignon',
            acres: parseFloat(acres.toFixed(2)),
            rootstock: st.rootstock || '',
            row_spacing_ft: calculatedLayout.spacing?.row || st.rowSpacing || 10,
            vine_spacing_ft: calculatedLayout.spacing?.vine || st.vineSpacing || 6,
            vine_count_reported: fieldVineCount,
            trellis_system: st.trellisSystem || 'VSP',
            row_orientation_deg: field.orientation === 'vertical' ? 0 : 90,
            geom: geom,
            notes: `Imported from Vineyard Planner: "${plan.name}"\nField: ${field.name}\nField Vines: ${fieldVineCount || 'N/A'}\nField Rows: ${fieldRows || 'N/A'}`,
            status: 'active'
          };

          const { error } = await createVineyardBlock(newBlockData);
          if (!error) {
            successCount++;
          } else {
            console.error(`Error importing field ${field.name}:`, error);
          }
        }
      }

      await loadBlocks();
      if (successCount > 0) {
        alert(`Successfully imported ${successCount} field${successCount !== 1 ? 's' : ''} from "${plan.name}"!`);
      } else {
        alert('No fields with geometry were found to import.');
      }
    } else {
      // No fields/polygons - import basic data without geometry
      const newBlockData = {
        name: plan.name || 'Imported Block',
        variety: st.variety || st.grapeVariety || 'Cabernet Sauvignon',
        acres: st.acres || 0,
        rootstock: st.rootstock || '',
        row_spacing_ft: st.rowSpacing || 10,
        vine_spacing_ft: st.vineSpacing || 6,
        vine_count_reported: calculatedLayout.vineLayout?.totalVines || null,
        trellis_system: st.trellisSystem || 'VSP',
        notes: `Imported from Vineyard Planner: "${plan.name}"\nTotal Vines: ${calculatedLayout.vineLayout?.totalVines || 0}\nRows: ${calculatedLayout.vineLayout?.numberOfRows || 0}\n\nNote: No geometry was available in the plan.`,
        status: 'active'
      };

      const { error } = await createVineyardBlock(newBlockData);
      if (!error) {
        await loadBlocks();
        alert(`Successfully imported "${plan.name}" as a vineyard field!\n\nNote: No map geometry was found. You can draw the field boundary on the map.`);
      } else {
        alert(`Error importing plan: ${error.message}`);
      }
    }
  };

  const trellisOptions = ['VSP', 'GDC', 'Scott Henry', 'Smart-Dyson', 'California Sprawl', 'Other'];
  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'fallow', label: 'Fallow' },
    { value: 'new', label: 'New Planting' },
    { value: 'removed', label: 'Removed' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Vineyard Fields</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage fields with viticulture data and auto-calculated metrics
          </p>
        </div>
        {!isAddingBlock && (
          <div className="flex gap-3">
            {/* View Toggle */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-1 flex gap-1">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 rounded flex items-center gap-2 text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <List className="w-4 h-4" />
                List
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-3 py-2 rounded flex items-center gap-2 text-sm font-medium transition-colors ${
                  viewMode === 'map'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <MapIcon className="w-4 h-4" />
                Map
              </button>
            </div>

            <Button
              onClick={handleExportCSV}
              className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white"
              disabled={blocks.length === 0}
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
            <Button
              onClick={handlePrintPDF}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-800 text-white"
              disabled={blocks.length === 0}
            >
              <Printer className="w-4 h-4" />
              Print / PDF
            </Button>
            <Button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Download className="w-4 h-4" />
              Import from Planner
            </Button>
            <Button
              onClick={() => setIsAddingBlock(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="w-4 h-4" />
              Add Field
            </Button>
          </div>
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {isAddingBlock && createPortal(
        <div
          className="fixed inset-0 bg-black/50 z-50 overflow-y-auto"
          onClick={(e) => {
            // Only close if clicking directly on the backdrop, not on children
            if (e.target === e.currentTarget) {
              resetForm();
            }
          }}
        >
          <div className="min-h-screen flex items-start justify-center p-4 pt-8 pb-8" onClick={(e) => {
            // Only close if clicking on the padding area
            if (e.target === e.currentTarget) {
              resetForm();
            }
          }}>
            <Card
              className="border border-gray-200 shadow-xl bg-white w-full max-w-6xl overflow-hidden rounded-lg"
              onClick={(e) => e.stopPropagation()}
            >
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-4 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Grape className="w-6 h-6" />
                    {editingBlock ? 'Edit Field' : 'New Vineyard Field'}
                  </h3>
                  <p className="text-emerald-50 text-sm mt-1">
                    Enter viticulture details - vine counts and metrics are calculated automatically
                  </p>
                </div>
                <button
                  onClick={resetForm}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                  type="button"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <CardContent className="p-6" onClick={(e) => e.stopPropagation()}>
              <form onSubmit={handleSubmit} className="space-y-8" onClick={(e) => e.stopPropagation()}>
              {/* Basic Information */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                  Field Identity
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Field Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Field A1"
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Acres
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.01"
                        value={formData.acres}
                        onChange={(e) => setFormData({ ...formData, acres: e.target.value })}
                        placeholder="Draw on map or enter manually"
                        className="flex-1 px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      />
                      <button
                        type="button"
                        onClick={handleDrawFieldOnMap}
                        className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                        title="Draw field boundary on map to calculate acres"
                      >
                        <MapIcon className="w-4 h-4" />
                        Draw on Map
                      </button>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Draw field boundary on map for accurate acreage</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    >
                      {statusOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Viticulture */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Grape className="w-5 h-5 text-emerald-600" />
                  Viticulture Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Variety <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.variety}
                      onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                      placeholder="e.g., Cabernet Sauvignon"
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Trellis System <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.trellis_system}
                      onChange={(e) => setFormData({ ...formData, trellis_system: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    >
                      {trellisOptions.map(trellis => (
                        <option key={trellis} value={trellis}>{trellis}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Row Spacing (ft) <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="number"
                      step="0.1"
                      value={formData.row_spacing_ft}
                      onChange={(e) => setFormData({ ...formData, row_spacing_ft: e.target.value })}
                      placeholder="10"
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Vine Spacing (ft) <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="number"
                      step="0.1"
                      value={formData.vine_spacing_ft}
                      onChange={(e) => setFormData({ ...formData, vine_spacing_ft: e.target.value })}
                      placeholder="6"
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Row Direction (degrees)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="360"
                      step="1"
                      value={formData.row_orientation_deg === null ? '' : formData.row_orientation_deg}
                      onChange={(e) => setFormData({ ...formData, row_orientation_deg: e.target.value === '' ? null : parseInt(e.target.value) })}
                      placeholder="0-360 (0=N, 90=E, 180=S, 270=W)"
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      Custom rotation: 0°=North, 90°=East, 180°=South, 270°=West
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Vine Count (Actual)
                    </label>
                    <input
                      type="number"
                      value={formData.vine_count_reported || ''}
                      onChange={(e) => setFormData({ ...formData, vine_count_reported: e.target.value })}
                      placeholder="Leave blank for auto-calculation"
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                    <p className="text-xs text-gray-600 mt-1">Override estimated count with your actual vine count</p>
                  </div>
                </div>

                {/* Advanced Section (collapsible) */}
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    Advanced Options
                  </button>

                  {showAdvanced && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Rootstock
                        </label>
                        <input
                          type="text"
                          value={formData.rootstock}
                          onChange={(e) => setFormData({ ...formData, rootstock: e.target.value })}
                          placeholder="e.g., 101-14"
                          className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Clone
                        </label>
                        <input
                          type="text"
                          value={formData.clone}
                          onChange={(e) => setFormData({ ...formData, clone: e.target.value })}
                          placeholder="e.g., Clone 4"
                          className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Year Planted
                        </label>
                        <input
                          type="number"
                          min="1900"
                          max={new Date().getFullYear()}
                          value={formData.year_planted || ''}
                          onChange={(e) => setFormData({ ...formData, year_planted: e.target.value })}
                          placeholder={new Date().getFullYear().toString()}
                          className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Irrigation Zone
                        </label>
                        <input
                          type="text"
                          value={formData.irrigation_zone}
                          onChange={(e) => setFormData({ ...formData, irrigation_zone: e.target.value })}
                          placeholder="e.g., Zone A"
                          className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Soil Data */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                  Soil Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Soil Type
                    </label>
                    <input
                      type="text"
                      value={formData.soil_type}
                      onChange={(e) => setFormData({ ...formData, soil_type: e.target.value })}
                      placeholder="e.g., Loam, Clay"
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Soil Texture
                    </label>
                    <input
                      type="text"
                      value={formData.soil_texture}
                      onChange={(e) => setFormData({ ...formData, soil_texture: e.target.value })}
                      placeholder="e.g., Sandy loam"
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Soil pH
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="3.0"
                      max="9.0"
                      value={formData.soil_ph || ''}
                      onChange={(e) => setFormData({ ...formData, soil_ph: e.target.value })}
                      placeholder="e.g., 6.5"
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Drainage
                    </label>
                    <select
                      value={formData.soil_drainage || ''}
                      onChange={(e) => setFormData({ ...formData, soil_drainage: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    >
                      <option value="">Select drainage...</option>
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="moderate">Moderate</option>
                      <option value="poor">Poor</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Organic Matter (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.soil_organic_matter_percent || ''}
                      onChange={(e) => setFormData({ ...formData, soil_organic_matter_percent: e.target.value })}
                      placeholder="e.g., 2.5"
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Soil Notes
                    </label>
                    <input
                      type="text"
                      value={formData.soil_notes}
                      onChange={(e) => setFormData({ ...formData, soil_notes: e.target.value })}
                      placeholder="Additional soil observations"
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Custom Fields */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCustomFields(!showCustomFields)}
                  className="flex items-center gap-2 text-lg font-semibold text-gray-900"
                >
                  {showCustomFields ? <ChevronUp className="w-5 h-5 text-emerald-600" /> : <ChevronDown className="w-5 h-5 text-emerald-600" />}
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Custom Fields
                </button>
                <p className="text-sm text-gray-600 mt-1 ml-7">Add your own custom data fields</p>

                {showCustomFields && (
                  <div className="mt-4 space-y-4">
                    {/* Existing Custom Fields */}
                    {Object.keys(formData.custom_fields || {}).length > 0 && (
                      <div className="space-y-2">
                        {Object.entries(formData.custom_fields).map(([key, value]) => (
                          <div key={key} className="flex gap-2 items-center bg-white p-3 rounded-lg border border-gray-200">
                            <input
                              type="text"
                              value={key}
                              onChange={(e) => handleUpdateCustomField(key, e.target.value, value)}
                              placeholder="Field name"
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <input
                              type="text"
                              value={value}
                              onChange={(e) => handleUpdateCustomField(key, key, e.target.value)}
                              placeholder="Value"
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomField(key)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove field"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add New Custom Field */}
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Add New Field</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newCustomFieldKey}
                          onChange={(e) => setNewCustomFieldKey(e.target.value)}
                          placeholder="Field name (e.g., Certification)"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCustomField();
                            }
                          }}
                        />
                        <input
                          type="text"
                          value={newCustomFieldValue}
                          onChange={(e) => setNewCustomFieldValue(e.target.value)}
                          placeholder="Value (e.g., Organic)"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCustomField();
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomField}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Field Metrics (Editable with Auto-Calculate) */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-6 border-2 border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-bold text-blue-900 flex items-center gap-2">
                      <Calculator className="w-5 h-5" />
                      Field Metrics
                    </h4>
                    <p className="text-sm text-blue-700 mt-1">Enter your actual field data or use auto-calculate</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoCalculateMetrics}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <Calculator className="w-4 h-4" />
                    Auto-Calculate
                  </button>
                </div>

                {/* Manual Input Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Total Vines
                    </label>
                    <input
                      type="number"
                      value={formData.estimated_vines || ''}
                      onChange={(e) => setFormData({ ...formData, estimated_vines: e.target.value ? parseInt(e.target.value) : null })}
                      placeholder="e.g., 2420"
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Number of Rows
                    </label>
                    <input
                      type="number"
                      value={formData.estimated_rows || ''}
                      onChange={(e) => setFormData({ ...formData, estimated_rows: e.target.value ? parseInt(e.target.value) : null })}
                      placeholder="e.g., 55"
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Calculated Estimates */}
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <p className="text-xs font-semibold text-gray-600 uppercase mb-3">Estimates based on spacing & acreage</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white rounded-lg p-3 border border-blue-200">
                      <p className="text-xs text-gray-600 mb-1">Total Vines</p>
                      <p className="text-lg font-bold text-blue-900">{metrics.estimatedVines.toLocaleString()}</p>
                    </div>

                    <div className="bg-white rounded-lg p-3 border border-blue-200">
                      <p className="text-xs text-gray-600 mb-1">Number of Rows</p>
                      <p className="text-lg font-bold text-blue-900">{metrics.estimatedRows}</p>
                    </div>

                    <div className="bg-white rounded-lg p-3 border border-blue-200">
                      <p className="text-xs text-gray-600 mb-1">Vines/Acre</p>
                      <p className="text-lg font-bold text-blue-900">{metrics.vinesPerAcre.toLocaleString()}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Based on {formData.row_spacing_ft}' × {formData.vine_spacing_ft}' spacing and {formData.acres || 0} acres
                  </p>
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
                  placeholder="Any additional information about this block..."
                />
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Grape className="w-5 h-5" />
                  {editingBlock ? 'Update Field' : 'Add Field'}
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
          </div>
        </div>,
        document.body
      )}

      {/* Blocks Display - Map or List */}
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            <p className="text-gray-600 mt-4">Loading fields...</p>
          </CardContent>
        </Card>
      ) : blocks.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="py-12 text-center">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No fields added yet</p>
            <p className="text-sm text-gray-500">
              Start by adding your first vineyard field to track operations
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'map' ? (
        <div className="h-[600px] rounded-lg overflow-hidden shadow-lg border border-gray-200">
          <BlockMap
            blocks={blocks}
            onBlockCreate={async (blockData) => {
              // Pre-fill form with map data (acres and geometry)
              setFormData({
                ...formData,
                acres: blockData.acres || '',
                name: blockData.name || `Field ${blocks.length + 1}`,
                geom: blockData.geom // Store geometry from map
              });

              // Always open form with pre-filled data for user to complete
              setIsAddingBlock(true);
              setAutoStartDrawing(false);
            }}
            onBlockUpdate={async (blockId, blockData) => {
              // Optimistically update local state first for immediate UI feedback
              setBlocks(prevBlocks =>
                prevBlocks.map(block =>
                  block.id === blockId ? { ...block, ...blockData } : block
                )
              );

              // Then update database in background
              const { error } = await updateVineyardBlock(blockId, blockData);
              if (error) {
                // If database update fails, reload to get correct state
                alert(`Error updating block: ${error.message}`);
                await loadBlocks();
              }
              // Don't reload on success - we already updated local state
              setAutoStartDrawing(false);
            }}
            selectedBlockId={selectedBlockId}
            onBlockSelect={setSelectedBlockId}
            autoStartDrawing={autoStartDrawing}
            onDrawingModeChange={(isDrawing) => {
              if (!isDrawing) {
                setAutoStartDrawing(false);
              }
            }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {blocks.map((block) => {
            const blockMetrics = calculateMetrics({
              acres: block.acres,
              row_spacing_ft: block.row_spacing_ft,
              vine_spacing_ft: block.vine_spacing_ft,
              vine_count_reported: block.vine_count_reported
            });

            return (
              <Card
                key={block.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => {
                  console.log('🔍 Navigating to field:', block.id);
                  console.log('📍 Path:', `/vineyard/field/${block.id}`);
                  navigate(`/vineyard/field/${block.id}`);
                }}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-lg font-semibold text-gray-900">{block.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          block.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                          block.status === 'fallow' ? 'bg-gray-100 text-gray-700' :
                          block.status === 'new' ? 'bg-blue-100 text-blue-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {block.status}
                        </span>

                        {/* PHI Lock Badge */}
                        {(() => {
                          const phiLock = phiLocks.find(lock => lock.block_id === block.id);
                          if (phiLock) {
                            const today = new Date();
                            const release = new Date(phiLock.phi_release_date);
                            const daysRemaining = Math.ceil((release - today) / (1000 * 60 * 60 * 24));
                            return (
                              <span className="flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                                <Shield className="w-3 h-3" />
                                PHI: {daysRemaining}d
                              </span>
                            );
                          }
                          return null;
                        })()}

                        {/* REI Lock Badge */}
                        {(() => {
                          const reiLock = reiLocks.find(lock => lock.block_id === block.id);
                          if (reiLock) {
                            const now = new Date();
                            const release = new Date(reiLock.rei_release_datetime);
                            const hoursRemaining = Math.ceil((release - now) / (1000 * 60 * 60));
                            return (
                              <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                                <Clock className="w-3 h-3" />
                                REI: {hoursRemaining}h
                              </span>
                            );
                          }
                          return null;
                        })()}

                        {/* Map Geometry Badge */}
                        {block.geom && block.geom.coordinates ? (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            <MapIcon className="w-3 h-3" />
                            Mapped
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                            <MapIcon className="w-3 h-3" />
                            Not Mapped
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{block.variety}</p>
                      <p className="text-xs text-gray-500">{block.trellis_system}</p>
                    </div>
                    <div className="flex gap-1">
                      {/* Add Map button for unmapped blocks */}
                      {!block.geom && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddMap(block);
                          }}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Add map boundary"
                        >
                          <MapPin className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenSampleModal(block);
                        }}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Field Sample"
                      >
                        <Beaker className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedField(block);
                          setShowPhotos(true);
                        }}
                        className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded"
                        title="Photos"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedField(block);
                          setShowYieldHistory(true);
                        }}
                        className="p-2 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded"
                        title="Yield History"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(block);
                        }}
                        className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-gray-100 rounded"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(block.id);
                        }}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-gray-50 rounded p-2">
                        <span className="text-gray-600 block text-xs">Acres</span>
                        <span className="font-semibold text-gray-900">{block.acres}</span>
                      </div>
                      <div className="bg-gray-50 rounded p-2">
                        <span className="text-gray-600 block text-xs">Vines</span>
                        <span className="font-semibold text-gray-900">{blockMetrics.estimatedVines.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="text-sm border-t border-gray-200 pt-3">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-600">Spacing:</span>
                        <span className="font-medium text-gray-900">{block.row_spacing_ft}' × {block.vine_spacing_ft}'</span>
                      </div>
                      {block.rootstock && (
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-600">Rootstock:</span>
                          <span className="font-medium text-gray-900">{block.rootstock}</span>
                        </div>
                      )}
                      {block.year_planted && (
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-600">Planted:</span>
                          <span className="font-medium text-gray-900">{block.year_planted}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>{blockMetrics.vinesPerAcre.toLocaleString()} vines/ac</span>
                        <span>{blockMetrics.estimatedRows} rows est.</span>
                      </div>
                    </div>

                    {block.custom_fields && Object.keys(block.custom_fields).length > 0 && (
                      <div className="pt-2 border-t border-gray-200">
                        <p className="text-xs font-semibold text-gray-700 mb-1">Custom Fields:</p>
                        <div className="space-y-1">
                          {Object.entries(block.custom_fields).slice(0, 3).map(([key, value]) => (
                            <div key={key} className="flex justify-between text-xs">
                              <span className="text-gray-600">{key}:</span>
                              <span className="font-medium text-gray-900 truncate ml-2">{value}</span>
                            </div>
                          ))}
                          {Object.keys(block.custom_fields).length > 3 && (
                            <p className="text-xs text-gray-500 italic">
                              +{Object.keys(block.custom_fields).length - 3} more
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {block.notes && (
                      <div className="pt-2 border-t border-gray-200">
                        <p className="text-gray-600 text-xs line-clamp-2">{block.notes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Import Plan Modal */}
      <ImportPlanModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportPlan}
      />

      {/* Field Photos Modal */}
      {showPhotos && selectedField && (
        <FieldPhotos
          fieldId={selectedField.id}
          fieldName={selectedField.name}
          onClose={() => {
            setShowPhotos(false);
            setSelectedField(null);
          }}
        />
      )}

      {/* Yield History Modal */}
      {showYieldHistory && selectedField && (
        <FieldYieldHistory
          fieldId={selectedField.id}
          fieldName={selectedField.name}
          fieldAcres={selectedField.acres}
          onClose={() => {
            setShowYieldHistory(false);
            setSelectedField(null);
          }}
        />
      )}

      {/* Field Sample Modal */}
      {showSampleModal && selectedBlockForSample && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto hide-scrollbar">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Beaker className="w-6 h-6" />
                  Field Sample - {selectedBlockForSample.name}
                </h2>
                <p className="text-blue-50 text-sm mt-1">Record berry quality metrics</p>
              </div>
              <button
                onClick={() => {
                  setShowSampleModal(false);
                  setSelectedBlockForSample(null);
                }}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSample} className="p-6 space-y-6">
              {/* Quality Metrics */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Brix
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={sampleFormData.brix}
                    onChange={(e) => setSampleFormData({ ...sampleFormData, brix: e.target.value })}
                    placeholder="e.g., 24.5"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    TA (g/L)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={sampleFormData.ta}
                    onChange={(e) => setSampleFormData({ ...sampleFormData, ta: e.target.value })}
                    placeholder="e.g., 6.2"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    pH
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={sampleFormData.ph}
                    onChange={(e) => setSampleFormData({ ...sampleFormData, ph: e.target.value })}
                    placeholder="e.g., 3.55"
                    className="w-full"
                  />
                </div>
              </div>

              {/* Visual Observations */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Berry Size
                  </label>
                  <select
                    value={sampleFormData.berry_size}
                    onChange={(e) => setSampleFormData({ ...sampleFormData, berry_size: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select...</option>
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Cluster Condition
                  </label>
                  <select
                    value={sampleFormData.cluster_condition}
                    onChange={(e) => setSampleFormData({ ...sampleFormData, cluster_condition: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select...</option>
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Disease Pressure
                  </label>
                  <select
                    value={sampleFormData.disease_pressure}
                    onChange={(e) => setSampleFormData({ ...sampleFormData, disease_pressure: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select...</option>
                    <option value="none">None</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              {/* Harvest Readiness */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-4 mb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sampleFormData.ready_to_pick}
                      onChange={(e) => setSampleFormData({ ...sampleFormData, ready_to_pick: e.target.checked })}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="font-semibold text-gray-900">Ready to Pick</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Estimated Days to Harvest
                  </label>
                  <Input
                    type="number"
                    value={sampleFormData.estimated_days_to_harvest}
                    onChange={(e) => setSampleFormData({ ...sampleFormData, estimated_days_to_harvest: e.target.value })}
                    placeholder="e.g., 7"
                    className="w-full"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={sampleFormData.notes}
                  onChange={(e) => setSampleFormData({ ...sampleFormData, notes: e.target.value })}
                  placeholder="Additional observations..."
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={savingSample}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingSample ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Beaker className="w-5 h-5" />
                      Save Sample
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSampleModal(false);
                    setSelectedBlockForSample(null);
                  }}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
