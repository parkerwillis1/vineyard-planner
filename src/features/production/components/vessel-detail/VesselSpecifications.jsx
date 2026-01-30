import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Edit2, X, ChevronDown, Plus } from 'lucide-react';
import { listContainers } from '@/shared/lib/productionApi';

// ComboBox component - dropdown with existing options + ability to add new
function ComboBox({ value, onChange, options, placeholder, label }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');
  const wrapperRef = useRef(null);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt =>
    opt.toLowerCase().includes(inputValue.toLowerCase())
  );

  const showAddNew = inputValue && !options.some(opt => opt.toLowerCase() === inputValue.toLowerCase());

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            onChange(e.target.value);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A]/20 focus:border-[#7C203A]"
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
        >
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && (filteredOptions.length > 0 || showAddNew) && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filteredOptions.map((opt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setInputValue(opt);
                onChange(opt);
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
            >
              {opt}
            </button>
          ))}
          {showAddNew && (
            <button
              type="button"
              onClick={() => {
                onChange(inputValue);
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm text-[#7C203A] hover:bg-[#7C203A]/5 transition-colors flex items-center gap-2 border-t border-gray-100"
            >
              <Plus className="w-4 h-4" />
              Add "{inputValue}"
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function VesselSpecifications({ container, onSave }) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [existingOptions, setExistingOptions] = useState({
    locations: [],
    cooperages: [],
    toastLevels: [],
    cipProducts: []
  });

  // Load existing options from other containers
  useEffect(() => {
    async function loadOptions() {
      try {
        const { data: containers } = await listContainers();
        if (containers) {
          const locations = [...new Set(containers.map(c => c.location).filter(Boolean))];
          const cooperages = [...new Set(containers.map(c => c.cooperage).filter(Boolean))];
          const toastLevels = [...new Set(containers.map(c => c.toast_level).filter(Boolean))];
          const cipProducts = [...new Set(containers.map(c => c.cip_product).filter(Boolean))];

          setExistingOptions({
            locations: locations.sort(),
            cooperages: cooperages.sort(),
            toastLevels: toastLevels.sort(),
            cipProducts: cipProducts.sort()
          });
        }
      } catch (err) {
        console.error('Error loading options:', err);
      }
    }
    loadOptions();
  }, []);

  const openEditModal = () => {
    setFormData({
      name: container.name || '',
      type: container.type || 'tank',
      material: container.material || 'stainless',
      capacity_gallons: container.capacity_gallons || '',
      location: container.location || '',
      status: container.status || 'empty',
      cooperage: container.cooperage || '',
      toast_level: container.toast_level || '',
      purchase_date: container.purchase_date || '',
      total_fills: container.total_fills || 0,
      last_cip_date: container.last_cip_date || '',
      cip_product: container.cip_product || '',
      notes: container.notes || ''
    });
    setShowEditModal(true);
  };

  const handleSave = async () => {
    if (!onSave) return;

    setIsSaving(true);
    try {
      await onSave({
        name: formData.name,
        type: formData.type,
        material: formData.material,
        capacity_gallons: parseFloat(formData.capacity_gallons),
        location: formData.location || null,
        status: formData.status,
        cooperage: formData.cooperage || null,
        toast_level: formData.toast_level || null,
        purchase_date: formData.purchase_date || null,
        total_fills: parseInt(formData.total_fills) || 0,
        last_cip_date: formData.last_cip_date || null,
        cip_product: formData.cip_product || null,
        notes: formData.notes || null
      });
      setShowEditModal(false);
    } catch (err) {
      console.error('Error saving vessel:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Standard toast levels for barrels
  const toastLevelOptions = [
    'Light',
    'Light Plus',
    'Medium',
    'Medium Plus',
    'Heavy',
    ...existingOptions.toastLevels.filter(t => !['Light', 'Light Plus', 'Medium', 'Medium Plus', 'Heavy'].includes(t))
  ];

  const specs = [
    { label: 'Type', value: container.type, capitalize: true },
    { label: 'Capacity', value: `${container.capacity_gallons} gal` },
    { label: 'Material', value: container.material?.replace(/_/g, ' '), capitalize: true },
    { label: 'Location', value: container.location },
  ];

  // Barrel-specific specs
  if (container.type === 'barrel') {
    specs.push(
      { label: 'Cooperage', value: container.cooperage },
      { label: 'Toast', value: container.toast_level },
      { label: 'Fills', value: container.total_fills?.toString() },
      { label: 'Purchase', value: container.purchase_date ? new Date(container.purchase_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : null }
    );
  }

  // Status
  specs.push({
    label: 'Status',
    value: container.status?.replace(/_/g, ' '),
    capitalize: true
  });

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Vessel Specifications</h3>
          <button
            onClick={openEditModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {specs.map(({ label, value, capitalize: cap }) => (
            value && (
              <div key={label} className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                <p className={`text-sm font-semibold text-gray-900 ${cap ? 'capitalize' : ''}`}>
                  {value}
                </p>
              </div>
            )
          ))}
        </div>

        {container.notes && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-0.5">Notes</p>
            <p className="text-sm text-gray-700">{container.notes}</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && formData && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <h2 className="text-lg font-bold text-gray-900">Edit Vessel Details</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A]/20 focus:border-[#7C203A]"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A]/20 focus:border-[#7C203A]"
                  >
                    <option value="tank">Tank</option>
                    <option value="barrel">Barrel</option>
                    <option value="tote">Tote</option>
                    <option value="ibc">IBC</option>
                    <option value="bin">Bin</option>
                  </select>
                </div>

                {/* Capacity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (gal)</label>
                  <input
                    type="number"
                    value={formData.capacity_gallons}
                    onChange={(e) => setFormData({ ...formData, capacity_gallons: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A]/20 focus:border-[#7C203A]"
                  />
                </div>

                {/* Material */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
                  <select
                    value={formData.material}
                    onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A]/20 focus:border-[#7C203A]"
                  >
                    <option value="stainless">Stainless Steel</option>
                    <option value="oak_french">French Oak</option>
                    <option value="oak_american">American Oak</option>
                    <option value="oak_hungarian">Hungarian Oak</option>
                    <option value="oak_slavonian">Slavonian Oak</option>
                    <option value="acacia">Acacia</option>
                    <option value="chestnut">Chestnut</option>
                    <option value="concrete">Concrete</option>
                    <option value="clay">Clay/Amphora</option>
                    <option value="plastic">Plastic</option>
                    <option value="fiberglass">Fiberglass</option>
                  </select>
                </div>

                {/* Location - ComboBox */}
                <ComboBox
                  label="Location"
                  value={formData.location}
                  onChange={(val) => setFormData({ ...formData, location: val })}
                  options={existingOptions.locations}
                  placeholder="Select or add location..."
                />

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A]/20 focus:border-[#7C203A]"
                  >
                    <option value="empty">Empty</option>
                    <option value="in_use">In Use</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="needs_cip">Needs CIP</option>
                    <option value="sanitized">Sanitized</option>
                    <option value="needs_repair">Needs Repair</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>

                {/* Barrel-specific fields */}
                {formData.type === 'barrel' && (
                  <>
                    {/* Cooperage - ComboBox */}
                    <ComboBox
                      label="Cooperage"
                      value={formData.cooperage}
                      onChange={(val) => setFormData({ ...formData, cooperage: val })}
                      options={existingOptions.cooperages}
                      placeholder="Select or add cooperage..."
                    />

                    {/* Toast Level - ComboBox with standard options */}
                    <ComboBox
                      label="Toast Level"
                      value={formData.toast_level}
                      onChange={(val) => setFormData({ ...formData, toast_level: val })}
                      options={toastLevelOptions}
                      placeholder="Select toast level..."
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total Fills</label>
                      <input
                        type="number"
                        value={formData.total_fills}
                        onChange={(e) => setFormData({ ...formData, total_fills: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A]/20 focus:border-[#7C203A]"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
                      <input
                        type="date"
                        value={formData.purchase_date}
                        onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A]/20 focus:border-[#7C203A]"
                      />
                    </div>
                  </>
                )}

                {/* CIP fields */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last CIP Date</label>
                  <input
                    type="date"
                    value={formData.last_cip_date}
                    onChange={(e) => setFormData({ ...formData, last_cip_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A]/20 focus:border-[#7C203A]"
                  />
                </div>

                {/* CIP Product - ComboBox */}
                <ComboBox
                  label="CIP Product"
                  value={formData.cip_product}
                  onChange={(val) => setFormData({ ...formData, cip_product: val })}
                  options={existingOptions.cipProducts}
                  placeholder="Select or add product..."
                />

                {/* Notes - Full width */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A]/20 focus:border-[#7C203A] resize-none"
                    rows={3}
                    placeholder="Any additional notes..."
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3 flex-shrink-0">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !formData.name || !formData.capacity_gallons}
                className="flex-1 px-4 py-2.5 bg-[#7C203A] text-white rounded-lg hover:bg-[#5a1a2d] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
