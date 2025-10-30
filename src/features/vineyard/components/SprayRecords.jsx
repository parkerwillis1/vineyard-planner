import React, { useState, useEffect } from 'react';
import { useAuth } from '@/auth/AuthContext';
import {
  Plus,
  Droplet,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  X,
  Shield,
  CloudRain,
  Settings,
  FileCheck,
  Package,
  MapPin,
  Calendar as CalendarIcon,
  Clock,
  Trash2,
  Eye,
  Zap
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { QuickSpray } from './QuickSpray';
import {
  listVineyardBlocks,
  listInventoryItems,
  listSprayApplications,
  createSprayApplication,
  checkSprayCompliance,
  getActivePHILocks
} from '@/shared/lib/vineyardApi';

const SPRAY_METHODS = ['Airblast', 'Boom', 'Handgun', 'Backpack', 'Drone'];
const INVERSION_RISKS = ['None', 'Low', 'Moderate', 'High'];

export function SprayRecords() {
  const { user } = useAuth();
  const [sprayRecords, setSprayRecords] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [chemicals, setChemicals] = useState([]);
  const [activePHILocks, setActivePHILocks] = useState([]);
  const [showWizard, setShowWizard] = useState(false);
  const [showQuickSpray, setShowQuickSpray] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [complianceWarnings, setComplianceWarnings] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Wizard form data
  const [wizardData, setWizardData] = useState({
    // Step 1: Blocks & Chemicals
    selectedBlocks: [], // [{ block_id, block_name, acres_treated }]
    tankMix: [], // [{ item_id, rate_per_acre, unit, total_quantity, purpose }]

    // Step 2: Weather & Applicator
    application_date: new Date().toISOString().split('T')[0],
    start_time: '',
    end_time: '',
    applicator_name: '',
    applicator_license: '',
    wind_mph: '',
    wind_direction: '',
    temp_f: '',
    humidity_pct: '',
    cloud_cover: '',
    inversion_risk: 'None',

    // Step 3: Application Details
    spray_method: '',
    nozzle_type: '',
    nozzle_size: '',
    pressure_psi: '',
    gpa: '',
    total_tank_gal: '',
    target_pest: '',
    growth_stage: '',
    buffer_zones_respected: true,
    notes: ''
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    const [blocksRes, chemicalsRes, spraysRes, phiRes] = await Promise.all([
      listVineyardBlocks(),
      listInventoryItems('chemical'),
      listSprayApplications(),
      getActivePHILocks()
    ]);

    if (blocksRes.data) setBlocks(blocksRes.data);
    if (chemicalsRes.data) setChemicals(chemicalsRes.data);
    if (spraysRes.data) setSprayRecords(spraysRes.data);
    if (phiRes.data) setActivePHILocks(phiRes.data);
  };

  const openWizard = () => {
    setShowWizard(true);
    setCurrentStep(1);
    setComplianceWarnings([]);
  };

  const closeWizard = () => {
    setShowWizard(false);
    setCurrentStep(1);
    setWizardData({
      selectedBlocks: [],
      tankMix: [],
      application_date: new Date().toISOString().split('T')[0],
      start_time: '',
      end_time: '',
      applicator_name: '',
      applicator_license: '',
      wind_mph: '',
      wind_direction: '',
      temp_f: '',
      humidity_pct: '',
      cloud_cover: '',
      inversion_risk: 'None',
      spray_method: '',
      nozzle_type: '',
      nozzle_size: '',
      pressure_psi: '',
      gpa: '',
      total_tank_gal: '',
      target_pest: '',
      growth_stage: '',
      buffer_zones_respected: true,
      notes: ''
    });
  };

  const canProceedToStep = (step) => {
    switch (step) {
      case 2:
        return wizardData.selectedBlocks.length > 0 && wizardData.tankMix.length > 0;
      case 3:
        return wizardData.application_date && wizardData.applicator_name;
      case 4:
        return wizardData.spray_method;
      default:
        return true;
    }
  };

  const nextStep = async () => {
    if (currentStep === 3) {
      // Run compliance checks before step 4
      await runComplianceChecks();
    }
    if (canProceedToStep(currentStep + 1)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const runComplianceChecks = async () => {
    const warnings = await checkSprayCompliance(
      wizardData.selectedBlocks.map(b => ({ block_id: b.block_id, block_name: b.block_name })),
      wizardData.tankMix.map(tm => {
        const chemical = chemicals.find(c => c.id === tm.item_id);
        return { ...tm, frac_code: chemical?.frac_code };
      }),
      wizardData.application_date
    );
    setComplianceWarnings(warnings);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const totalAcres = wizardData.selectedBlocks.reduce((sum, b) => sum + parseFloat(b.acres_treated || 0), 0);

      const sprayData = {
        application_date: wizardData.application_date,
        start_time: wizardData.start_time || null,
        end_time: wizardData.end_time || null,
        applicator_name: wizardData.applicator_name,
        applicator_license: wizardData.applicator_license || null,
        wind_mph: parseFloat(wizardData.wind_mph) || null,
        wind_direction: wizardData.wind_direction || null,
        temp_f: parseFloat(wizardData.temp_f) || null,
        humidity_pct: parseFloat(wizardData.humidity_pct) || null,
        cloud_cover: wizardData.cloud_cover || null,
        inversion_risk: wizardData.inversion_risk,
        spray_method: wizardData.spray_method,
        nozzle_type: wizardData.nozzle_type || null,
        nozzle_size: wizardData.nozzle_size || null,
        pressure_psi: parseFloat(wizardData.pressure_psi) || null,
        gpa: parseFloat(wizardData.gpa) || null,
        total_tank_gal: parseFloat(wizardData.total_tank_gal) || null,
        treated_acres: totalAcres,
        target_pest: wizardData.target_pest || null,
        growth_stage: wizardData.growth_stage || null,
        buffer_zones_respected: wizardData.buffer_zones_respected,
        notes: wizardData.notes || null,
        status: 'submitted'
      };

      const blocksData = wizardData.selectedBlocks.map(b => ({
        block_id: b.block_id,
        acres_treated: parseFloat(b.acres_treated)
      }));

      const mixData = wizardData.tankMix.map(tm => ({
        item_id: tm.item_id,
        rate_per_acre: parseFloat(tm.rate_per_acre),
        unit: tm.unit,
        total_quantity: parseFloat(tm.total_quantity),
        total_cost: parseFloat(tm.total_cost) || null,
        purpose: tm.purpose || null
      }));

      const { error } = await createSprayApplication(sprayData, blocksData, mixData);

      if (error) {
        console.error('Error creating spray application:', error);
        alert('Failed to create spray application');
      } else {
        await loadData();
        closeWizard();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 1: Block & Chemical Selection
  const toggleBlock = (block) => {
    const existing = wizardData.selectedBlocks.find(b => b.block_id === block.id);
    if (existing) {
      setWizardData({
        ...wizardData,
        selectedBlocks: wizardData.selectedBlocks.filter(b => b.block_id !== block.id)
      });
    } else {
      setWizardData({
        ...wizardData,
        selectedBlocks: [
          ...wizardData.selectedBlocks,
          {
            block_id: block.id,
            block_name: block.name,
            acres_treated: block.acres || 0
          }
        ]
      });
    }
  };

  const addChemicalToMix = (chemical) => {
    const totalAcres = wizardData.selectedBlocks.reduce((sum, b) => sum + parseFloat(b.acres_treated || 0), 0);

    setWizardData({
      ...wizardData,
      tankMix: [
        ...wizardData.tankMix,
        {
          item_id: chemical.id,
          chemical_name: chemical.name,
          rate_per_acre: 0,
          unit: chemical.unit,
          total_quantity: 0,
          total_cost: 0,
          purpose: 'fungicide',
          // Include for display
          epa_reg_no: chemical.epa_reg_no,
          frac_code: chemical.frac_code,
          phi_days: chemical.phi_days,
          rei_hours: chemical.rei_hours
        }
      ]
    });
  };

  const removeFromMix = (index) => {
    setWizardData({
      ...wizardData,
      tankMix: wizardData.tankMix.filter((_, i) => i !== index)
    });
  };

  const updateMixLine = (index, field, value) => {
    const newMix = [...wizardData.tankMix];
    newMix[index][field] = value;

    // Auto-calculate total quantity
    if (field === 'rate_per_acre') {
      const totalAcres = wizardData.selectedBlocks.reduce((sum, b) => sum + parseFloat(b.acres_treated || 0), 0);
      newMix[index].total_quantity = parseFloat(value) * totalAcres;
    }

    setWizardData({ ...wizardData, tankMix: newMix });
  };

  const getDaysUntilRelease = (releaseDate) => {
    const today = new Date();
    const release = new Date(releaseDate);
    const diffTime = release - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleQuickSpraySubmit = async (sprayData, blocksData, mixData) => {
    setIsSubmitting(true);
    try {
      const { error } = await createSprayApplication(sprayData, blocksData, mixData);

      if (error) {
        console.error('Error creating spray application:', error);
        alert('Failed to create spray application');
      } else {
        await loadData();
        setShowQuickSpray(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Spray Applications</h2>
          <p className="text-sm text-gray-600 mt-1">
            Pesticide application tracking with PHI/REI compliance
          </p>
        </div>
        {!showWizard && !showQuickSpray && (
          <div className="flex gap-3">
            <Button
              onClick={() => setShowQuickSpray(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <Zap className="w-4 h-4" />
              Quick Spray
            </Button>
            <Button
              onClick={openWizard}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              <Plus className="w-4 h-4" />
              Full Wizard
            </Button>
          </div>
        )}
      </div>

      {/* Active PHI Locks Alert */}
      {activePHILocks.length > 0 && !showWizard && !showQuickSpray && (
        <Card className="border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Shield className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="flex-grow">
                <h3 className="text-lg font-bold text-orange-900 mb-3">
                  Active PHI Restrictions ({activePHILocks.length})
                </h3>
                <div className="space-y-2">
                  {activePHILocks.map(lock => (
                    <div key={lock.id} className="bg-white rounded-lg p-3 border border-orange-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{lock.vineyard_blocks?.name}</p>
                          <p className="text-sm text-gray-700">{lock.inventory_items?.name}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            EPA Reg: {lock.inventory_items?.epa_reg_no}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-orange-600">
                            {getDaysUntilRelease(lock.phi_release_date)}
                          </p>
                          <p className="text-xs text-gray-600">days until harvest-safe</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(lock.phi_release_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Spray Modal */}
      {showQuickSpray && (
        <QuickSpray
          blocks={blocks}
          chemicals={chemicals}
          onSubmit={handleQuickSpraySubmit}
          onCancel={() => setShowQuickSpray(false)}
          stateCode="DEFAULT"
        />
      )}

      {/* 4-Step Wizard */}
      {showWizard && (
        <Card className="border-2 border-blue-200 shadow-2xl">
          {/* Wizard Header */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Droplet className="w-6 h-6" />
                  Spray Application Wizard
                </h3>
                <p className="text-blue-100 text-sm mt-1">
                  Step {currentStep} of 4
                </p>
              </div>
              <button
                onClick={closeWizard}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Progress Indicator */}
            <div className="flex items-center gap-2 mt-4">
              {[1, 2, 3, 4].map(step => (
                <div
                  key={step}
                  className={`flex-1 h-2 rounded-full transition-all ${
                    step <= currentStep ? 'bg-white' : 'bg-blue-400'
                  }`}
                />
              ))}
            </div>
          </div>

          <CardContent className="pt-6">
            {/* Step 1: Blocks & Chemicals */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">Select Blocks & Build Tank Mix</h4>
                    <p className="text-sm text-gray-600">Choose which blocks to spray and what chemicals to apply</p>
                  </div>
                </div>

                {/* Block Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Blocks to Spray ({wizardData.selectedBlocks.length} selected)
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {blocks.map(block => {
                      const isSelected = wizardData.selectedBlocks.some(b => b.block_id === block.id);
                      return (
                        <button
                          key={block.id}
                          onClick={() => toggleBlock(block)}
                          className={`p-4 rounded-lg border-2 text-left transition-all ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 bg-white hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-grow">
                              <p className="font-semibold text-gray-900">{block.name}</p>
                              <p className="text-sm text-gray-600">{block.variety || 'Unknown variety'}</p>
                              <p className="text-xs text-gray-500 mt-1">{block.acres} acres</p>
                            </div>
                            {isSelected && (
                              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {blocks.length === 0 && (
                    <p className="text-gray-500 text-sm italic">No blocks found. Create blocks first.</p>
                  )}
                </div>

                {/* Tank Mix */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Tank Mix ({wizardData.tankMix.length} products)
                  </label>

                  {wizardData.tankMix.length > 0 && (
                    <div className="space-y-3 mb-4">
                      {wizardData.tankMix.map((mix, index) => (
                        <div key={index} className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border-2 border-purple-200">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-grow">
                              <p className="font-semibold text-gray-900">{mix.chemical_name}</p>
                              <p className="text-xs text-gray-600">EPA: {mix.epa_reg_no} | FRAC: {mix.frac_code || 'N/A'}</p>
                              <div className="flex gap-4 mt-1">
                                {mix.phi_days && (
                                  <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                    PHI: {mix.phi_days} days
                                  </span>
                                )}
                                {mix.rei_hours && (
                                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                    REI: {mix.rei_hours} hrs
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => removeFromMix(index)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-white rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Rate/Acre
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={mix.rate_per_acre}
                                onChange={(e) => updateMixLine(index, 'rate_per_acre', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="0.00"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Unit
                              </label>
                              <input
                                type="text"
                                value={mix.unit}
                                onChange={(e) => updateMixLine(index, 'unit', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="oz, lb, gal"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Total {mix.unit}
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={mix.total_quantity}
                                readOnly
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-gray-50"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Chemical Dropdown */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Add Chemical
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      value=""
                      onChange={(e) => {
                        const chemical = chemicals.find(c => c.id === e.target.value);
                        if (chemical) addChemicalToMix(chemical);
                      }}
                    >
                      <option value="">Select a chemical...</option>
                      {chemicals
                        .filter(c => !wizardData.tankMix.some(tm => tm.item_id === c.id))
                        .map(chemical => (
                          <option key={chemical.id} value={chemical.id}>
                            {chemical.name} ({chemical.epa_reg_no})
                          </option>
                        ))}
                    </select>
                    {chemicals.length === 0 && (
                      <p className="text-gray-500 text-xs italic mt-2">No chemicals in inventory. Add chemicals first.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Weather & Applicator */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center">
                    <CloudRain className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">Weather Conditions & Applicator</h4>
                    <p className="text-sm text-gray-600">Record application conditions and operator details</p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-6 border-2 border-blue-200">
                  <h5 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5" />
                    Date & Time
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Application Date *
                      </label>
                      <input
                        type="date"
                        value={wizardData.application_date}
                        onChange={(e) => setWizardData({ ...wizardData, application_date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={wizardData.start_time}
                        onChange={(e) => setWizardData({ ...wizardData, start_time: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={wizardData.end_time}
                        onChange={(e) => setWizardData({ ...wizardData, end_time: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border-2 border-green-200">
                  <h5 className="font-semibold text-green-900 mb-4">Applicator Information</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Applicator Name *
                      </label>
                      <input
                        type="text"
                        value={wizardData.applicator_name}
                        onChange={(e) => setWizardData({ ...wizardData, applicator_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Full name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Applicator License #
                      </label>
                      <input
                        type="text"
                        value={wizardData.applicator_license}
                        onChange={(e) => setWizardData({ ...wizardData, applicator_license: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="License number (if applicable)"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-lg p-6 border-2 border-sky-200">
                  <h5 className="font-semibold text-sky-900 mb-4">Weather Conditions</h5>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Temperature (°F)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={wizardData.temp_f}
                        onChange={(e) => setWizardData({ ...wizardData, temp_f: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="72"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Humidity (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={wizardData.humidity_pct}
                        onChange={(e) => setWizardData({ ...wizardData, humidity_pct: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="65"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Wind Speed (mph)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={wizardData.wind_mph}
                        onChange={(e) => setWizardData({ ...wizardData, wind_mph: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Wind Direction
                      </label>
                      <input
                        type="text"
                        value={wizardData.wind_direction}
                        onChange={(e) => setWizardData({ ...wizardData, wind_direction: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="N, NE, E, etc."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cloud Cover
                      </label>
                      <input
                        type="text"
                        value={wizardData.cloud_cover}
                        onChange={(e) => setWizardData({ ...wizardData, cloud_cover: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Clear, Partly cloudy, etc."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Inversion Risk
                      </label>
                      <select
                        value={wizardData.inversion_risk}
                        onChange={(e) => setWizardData({ ...wizardData, inversion_risk: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        {INVERSION_RISKS.map(risk => (
                          <option key={risk} value={risk}>{risk}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Application Details */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Settings className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">Application Details</h4>
                    <p className="text-sm text-gray-600">Equipment settings and target information</p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border-2 border-purple-200">
                  <h5 className="font-semibold text-purple-900 mb-4">Equipment & Method</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Spray Method *
                      </label>
                      <select
                        value={wizardData.spray_method}
                        onChange={(e) => setWizardData({ ...wizardData, spray_method: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        required
                      >
                        <option value="">Select method...</option>
                        {SPRAY_METHODS.map(method => (
                          <option key={method} value={method}>{method}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        GPA (Gallons per Acre)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={wizardData.gpa}
                        onChange={(e) => setWizardData({ ...wizardData, gpa: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nozzle Type
                      </label>
                      <input
                        type="text"
                        value={wizardData.nozzle_type}
                        onChange={(e) => setWizardData({ ...wizardData, nozzle_type: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="e.g., Disc-Core, Hollow Cone"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nozzle Size
                      </label>
                      <input
                        type="text"
                        value={wizardData.nozzle_size}
                        onChange={(e) => setWizardData({ ...wizardData, nozzle_size: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="e.g., D4-25"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pressure (PSI)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={wizardData.pressure_psi}
                        onChange={(e) => setWizardData({ ...wizardData, pressure_psi: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total Tank Volume (gal)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={wizardData.total_tank_gal}
                        onChange={(e) => setWizardData({ ...wizardData, total_tank_gal: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="500"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg p-6 border-2 border-amber-200">
                  <h5 className="font-semibold text-amber-900 mb-4">Target & Purpose</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Target Pest/Disease
                      </label>
                      <input
                        type="text"
                        value={wizardData.target_pest}
                        onChange={(e) => setWizardData({ ...wizardData, target_pest: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="e.g., Powdery Mildew"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Growth Stage
                      </label>
                      <input
                        type="text"
                        value={wizardData.growth_stage}
                        onChange={(e) => setWizardData({ ...wizardData, growth_stage: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="e.g., Bloom, Veraison"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={wizardData.notes}
                    onChange={(e) => setWizardData({ ...wizardData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows="3"
                    placeholder="Additional observations or remarks..."
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="buffer_zones"
                    checked={wizardData.buffer_zones_respected}
                    onChange={(e) => setWizardData({ ...wizardData, buffer_zones_respected: e.target.checked })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <label htmlFor="buffer_zones" className="text-sm text-gray-700">
                    Buffer zones and setback requirements respected
                  </label>
                </div>
              </div>
            )}

            {/* Step 4: Review & Compliance */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <FileCheck className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">Review & Compliance Checks</h4>
                    <p className="text-sm text-gray-600">Verify all details before submitting</p>
                  </div>
                </div>

                {/* Compliance Warnings */}
                {complianceWarnings.length > 0 && (
                  <div className="space-y-3">
                    {complianceWarnings.map((warning, index) => {
                      const colors = {
                        info: 'blue',
                        warning: 'yellow',
                        critical: 'orange',
                        blocking: 'red'
                      };
                      const color = colors[warning.severity] || 'gray';

                      return (
                        <div
                          key={index}
                          className={`bg-${color}-50 border-2 border-${color}-300 rounded-lg p-4`}
                        >
                          <div className="flex items-start gap-3">
                            <AlertTriangle className={`w-5 h-5 text-${color}-600 flex-shrink-0 mt-0.5`} />
                            <div>
                              <p className={`font-semibold text-${color}-900`}>{warning.message}</p>
                              {warning.details && (
                                <p className={`text-sm text-${color}-700 mt-1`}>
                                  {JSON.stringify(warning.details)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {complianceWarnings.length === 0 && (
                  <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      <p className="font-semibold text-green-900">No compliance issues detected</p>
                    </div>
                  </div>
                )}

                {/* Summary */}
                <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
                  <h5 className="font-bold text-gray-900 mb-4">Application Summary</h5>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-600">Date</p>
                      <p className="text-sm font-medium text-gray-900">{wizardData.application_date}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Applicator</p>
                      <p className="text-sm font-medium text-gray-900">{wizardData.applicator_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Method</p>
                      <p className="text-sm font-medium text-gray-900">{wizardData.spray_method}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Total Acres</p>
                      <p className="text-sm font-medium text-gray-900">
                        {wizardData.selectedBlocks.reduce((sum, b) => sum + parseFloat(b.acres_treated || 0), 0).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-gray-300 pt-4 mb-4">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Blocks ({wizardData.selectedBlocks.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {wizardData.selectedBlocks.map(block => (
                        <span key={block.block_id} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {block.block_name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-gray-300 pt-4">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Tank Mix ({wizardData.tankMix.length})</p>
                    <div className="space-y-2">
                      {wizardData.tankMix.map((mix, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span className="text-gray-900">{mix.chemical_name}</span>
                          <span className="text-gray-600">
                            {mix.rate_per_acre} {mix.unit}/acre × {mix.total_quantity} {mix.unit} total
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </Button>

              {currentStep < 4 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={!canProceedToStep(currentStep + 1)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || complianceWarnings.some(w => w.severity === 'blocking')}
                  className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                  <CheckCircle className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Spray Records List */}
      {!showWizard && (
        <div className="space-y-4">
          {sprayRecords.length === 0 ? (
            <Card className="border-2 border-dashed border-gray-300">
              <CardContent className="py-12 text-center">
                <Droplet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">No spray applications yet</p>
                <p className="text-sm text-gray-500">
                  Create your first application using the wizard above
                </p>
              </CardContent>
            </Card>
          ) : (
            sprayRecords.map(spray => (
              <Card key={spray.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {new Date(spray.application_date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {spray.applicator_name} • {spray.spray_method}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        spray.status === 'submitted' ? 'bg-green-100 text-green-800' :
                        spray.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {spray.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-600">Blocks Treated</p>
                      <p className="text-sm font-medium text-gray-900">
                        {spray.spray_blocks?.length || 0} blocks
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Total Acres</p>
                      <p className="text-sm font-medium text-gray-900">
                        {spray.treated_acres?.toFixed(2) || '0.00'} ac
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Products Applied</p>
                      <p className="text-sm font-medium text-gray-900">
                        {spray.spray_mix_lines?.length || 0} products
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Temperature</p>
                      <p className="text-sm font-medium text-gray-900">
                        {spray.temp_f ? `${spray.temp_f}°F` : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {spray.spray_mix_lines && spray.spray_mix_lines.length > 0 && (
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Tank Mix</p>
                      <div className="flex flex-wrap gap-2">
                        {spray.spray_mix_lines.map((line, index) => (
                          <div key={index} className="bg-purple-50 border border-purple-200 rounded px-3 py-2">
                            <p className="text-sm font-medium text-gray-900">
                              {line.inventory_items?.name || 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-600">
                              {line.rate_per_acre} {line.unit}/acre
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
