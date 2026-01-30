import React, { useState, useEffect } from 'react';
import {
  Building2,
  FileText,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  Calendar,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import {
  getWineryRegistration,
  saveWineryRegistration,
  batchUpdateLotTaxClasses
} from '@/shared/lib/ttbApi';
import {
  REPORTING_PERIODS,
  REPORTING_PERIOD_LABELS,
  validateWineryRegistration,
  formatEIN
} from '@/shared/lib/ttbUtils';

const US_STATES = [
  { value: 'AL', label: 'Alabama' }, { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' }, { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' }, { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' }, { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' }, { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' }, { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' }, { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' }, { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' }, { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' }, { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' }, { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' }, { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' }, { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' }, { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' }, { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' }, { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' }, { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' }, { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' }, { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' }, { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' }, { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' }, { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' }, { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' }, { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' }, { value: 'WY', label: 'Wyoming' }
];

export function TTBSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const [formData, setFormData] = useState({
    ein: '',
    registry_number: '',
    operated_by: '',
    trade_name: '',
    premises_address: '',
    premises_city: '',
    premises_state: '',
    premises_zip: '',
    mailing_address: '',
    mailing_city: '',
    mailing_state: '',
    mailing_zip: '',
    reporting_period: 'monthly',
    contact_name: '',
    contact_phone: '',
    contact_email: ''
  });

  const [sameAsPremises, setSameAsPremises] = useState(true);

  useEffect(() => {
    loadRegistration();
  }, []);

  async function loadRegistration() {
    setLoading(true);
    try {
      const { data, error } = await getWineryRegistration();
      if (error) throw error;

      if (data) {
        setFormData({
          ein: data.ein || '',
          registry_number: data.registry_number || '',
          operated_by: data.operated_by || '',
          trade_name: data.trade_name || '',
          premises_address: data.premises_address || '',
          premises_city: data.premises_city || '',
          premises_state: data.premises_state || '',
          premises_zip: data.premises_zip || '',
          mailing_address: data.mailing_address || '',
          mailing_city: data.mailing_city || '',
          mailing_state: data.mailing_state || '',
          mailing_zip: data.mailing_zip || '',
          reporting_period: data.reporting_period || 'monthly',
          contact_name: data.contact_name || '',
          contact_phone: data.contact_phone || '',
          contact_email: data.contact_email || ''
        });

        // Check if mailing is same as premises
        const mailingSame = !data.mailing_address ||
          (data.mailing_address === data.premises_address &&
           data.mailing_city === data.premises_city);
        setSameAsPremises(mailingSame);
      }
    } catch (err) {
      console.error('Error loading registration:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }));
    setValidationErrors(prev => ({ ...prev, [field]: null }));
    setError(null);
    setSuccess(null);
  }

  function handleEINChange(value) {
    // Format as XX-XXXXXXX
    const digits = value.replace(/\D/g, '').slice(0, 9);
    let formatted = digits;
    if (digits.length > 2) {
      formatted = `${digits.slice(0, 2)}-${digits.slice(2)}`;
    }
    handleChange('ein', formatted);
  }

  async function handleSave(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate
    const { valid, errors } = validateWineryRegistration(formData);
    if (!valid) {
      setValidationErrors(errors);
      return;
    }

    setSaving(true);
    try {
      // Prepare data - copy premises to mailing if same
      const saveData = { ...formData };
      if (sameAsPremises) {
        saveData.mailing_address = formData.premises_address;
        saveData.mailing_city = formData.premises_city;
        saveData.mailing_state = formData.premises_state;
        saveData.mailing_zip = formData.premises_zip;
      }

      // Clean empty strings to null
      Object.keys(saveData).forEach(key => {
        if (saveData[key] === '') saveData[key] = null;
      });

      const { error } = await saveWineryRegistration(saveData);
      if (error) throw error;

      setSuccess('TTB registration saved successfully');
    } catch (err) {
      console.error('Error saving registration:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateTaxClasses() {
    setUpdating(true);
    setError(null);
    try {
      const { data, error } = await batchUpdateLotTaxClasses();
      if (error) throw error;

      setSuccess(`Updated tax classes for ${data.updated} lots`);
    } catch (err) {
      console.error('Error updating tax classes:', err);
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#7C203A] animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading TTB settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="pt-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">TTB Compliance Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure your winery registration for Form 5120.17 reporting
          </p>
        </div>
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
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-green-700">{success}</p>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Business Information */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="w-5 h-5 text-[#7C203A]" />
            <h2 className="text-lg font-bold text-gray-900">Business Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Legal Business Name *
              </label>
              <input
                type="text"
                value={formData.operated_by}
                onChange={e => handleChange('operated_by', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#7C203A]/20 focus:border-[#7C203A] ${
                  validationErrors.operated_by ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="As registered with TTB"
              />
              {validationErrors.operated_by && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.operated_by}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trade Name (DBA)
              </label>
              <input
                type="text"
                value={formData.trade_name}
                onChange={e => handleChange('trade_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A]/20 focus:border-[#7C203A]"
                placeholder="Optional"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                EIN (Employer ID Number) *
              </label>
              <input
                type="text"
                value={formData.ein}
                onChange={e => handleEINChange(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#7C203A]/20 focus:border-[#7C203A] ${
                  validationErrors.ein ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="XX-XXXXXXX"
                maxLength={10}
              />
              {validationErrors.ein && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.ein}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                TTB Registry Number *
              </label>
              <input
                type="text"
                value={formData.registry_number}
                onChange={e => handleChange('registry_number', e.target.value.toUpperCase())}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#7C203A]/20 focus:border-[#7C203A] ${
                  validationErrors.registry_number ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="BWC-CA-1234"
              />
              {validationErrors.registry_number && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.registry_number}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">Format: BWC-XX-#### (e.g., BWC-CA-1234)</p>
            </div>
          </div>
        </div>

        {/* Premises Address */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <MapPin className="w-5 h-5 text-[#7C203A]" />
            <h2 className="text-lg font-bold text-gray-900">Premises Address</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Street Address *
              </label>
              <input
                type="text"
                value={formData.premises_address}
                onChange={e => handleChange('premises_address', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#7C203A]/20 focus:border-[#7C203A] ${
                  validationErrors.premises_address ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="123 Vineyard Lane"
              />
              {validationErrors.premises_address && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.premises_address}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City *
              </label>
              <input
                type="text"
                value={formData.premises_city}
                onChange={e => handleChange('premises_city', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#7C203A]/20 focus:border-[#7C203A] ${
                  validationErrors.premises_city ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {validationErrors.premises_city && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.premises_city}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State *
                </label>
                <select
                  value={formData.premises_state}
                  onChange={e => handleChange('premises_state', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#7C203A]/20 focus:border-[#7C203A] ${
                    validationErrors.premises_state ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select</option>
                  {US_STATES.map(state => (
                    <option key={state.value} value={state.value}>{state.label}</option>
                  ))}
                </select>
                {validationErrors.premises_state && (
                  <p className="text-sm text-red-600 mt-1">{validationErrors.premises_state}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP Code *
                </label>
                <input
                  type="text"
                  value={formData.premises_zip}
                  onChange={e => handleChange('premises_zip', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#7C203A]/20 focus:border-[#7C203A] ${
                    validationErrors.premises_zip ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="95476"
                  maxLength={10}
                />
                {validationErrors.premises_zip && (
                  <p className="text-sm text-red-600 mt-1">{validationErrors.premises_zip}</p>
                )}
              </div>
            </div>
          </div>

          {/* Mailing Address Toggle */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={sameAsPremises}
                onChange={e => setSameAsPremises(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[#7C203A] focus:ring-[#7C203A]"
              />
              <span className="text-sm text-gray-700">Mailing address is the same as premises</span>
            </label>

            {!sameAsPremises && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mailing Street Address
                  </label>
                  <input
                    type="text"
                    value={formData.mailing_address}
                    onChange={e => handleChange('mailing_address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A]/20 focus:border-[#7C203A]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.mailing_city}
                    onChange={e => handleChange('mailing_city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A]/20 focus:border-[#7C203A]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <select
                      value={formData.mailing_state}
                      onChange={e => handleChange('mailing_state', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A]/20 focus:border-[#7C203A]"
                    >
                      <option value="">Select</option>
                      {US_STATES.map(state => (
                        <option key={state.value} value={state.value}>{state.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      value={formData.mailing_zip}
                      onChange={e => handleChange('mailing_zip', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A]/20 focus:border-[#7C203A]"
                      maxLength={10}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contact & Reporting */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-5 h-5 text-[#7C203A]" />
            <h2 className="text-lg font-bold text-gray-900">Reporting & Contact</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reporting Period
              </label>
              <select
                value={formData.reporting_period}
                onChange={e => handleChange('reporting_period', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A]/20 focus:border-[#7C203A]"
              >
                {Object.entries(REPORTING_PERIOD_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Wineries under 20,000 gallons/year may file annually
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Name
              </label>
              <input
                type="text"
                value={formData.contact_name}
                onChange={e => handleChange('contact_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A]/20 focus:border-[#7C203A]"
                placeholder="Person responsible for TTB filings"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Phone className="w-4 h-4 inline mr-1" />
                Contact Phone
              </label>
              <input
                type="tel"
                value={formData.contact_phone}
                onChange={e => handleChange('contact_phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A]/20 focus:border-[#7C203A]"
                placeholder="(555) 123-4567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Mail className="w-4 h-4 inline mr-1" />
                Contact Email
              </label>
              <input
                type="email"
                value={formData.contact_email}
                onChange={e => handleChange('contact_email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A]/20 focus:border-[#7C203A]"
                placeholder="ttb@winery.com"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#7C203A] text-white rounded-xl hover:bg-[#7C203A]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Registration
              </>
            )}
          </button>
        </div>
      </form>

      {/* Tax Class Update Utility */}
      <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-2xl border border-amber-200">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="w-5 h-5 text-amber-700" />
          <h2 className="text-lg font-bold text-gray-900">Tax Class Management</h2>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Automatically calculate and update TTB tax classes for all existing lots based on their
          alcohol percentage and wine type. Run this after initial setup or when updating alcohol data.
        </p>

        <button
          onClick={handleUpdateTaxClasses}
          disabled={updating}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {updating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4" />
              Update All Tax Classes
            </>
          )}
        </button>
      </div>
    </div>
  );
}
