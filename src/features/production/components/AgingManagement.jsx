import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Barrel, Calendar, Plus, Droplet, AlertTriangle, Clock, TrendingUp, CheckCircle2, ArrowRight, Wine, Zap, ExternalLink, Layers
} from 'lucide-react';
import { listLots, listContainers, updateContainer, updateLot, logLotAssignment, createLot, createFermentationLog } from '@/shared/lib/productionApi';

export function AgingManagement() {
  const navigate = useNavigate();
  const [lots, setLots] = useState([]);
  const [barrels, setBarrels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedBarrels, setSelectedBarrels] = useState([]);
  const [assigningLot, setAssigningLot] = useState(null);
  const [selectedBarrel, setSelectedBarrel] = useState(null);
  const [autoFilling, setAutoFilling] = useState(false);

  // Filter states
  const [filterVarietal, setFilterVarietal] = useState('all');
  const [filterVintage, setFilterVintage] = useState('all');
  const [filterParentLot, setFilterParentLot] = useState('all');
  const [sortBy, setSortBy] = useState('barrel'); // barrel, age-new, age-old, name-asc, name-desc

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [lotsResult, containersResult] = await Promise.all([
        listLots({ status: 'aging,pressed,blending' }),
        listContainers()
      ]);

      if (!lotsResult.error) {
        setLots(lotsResult.data || []);
      }
      if (!containersResult.error) {
        // Only load barrels - wine ages in barrels only
        const barrelData = (containersResult.data || []).filter(c => c.type === 'barrel');
        setBarrels(barrelData);
      }
    } catch (err) {
      console.error('Error loading aging data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get barrels that need topping
  const getBarrelsNeedingTopping = () => {
    const needsTopping = barrels.filter(barrel => {
      if (barrel.status !== 'in_use') return false;

      const lastTopping = barrel.last_topping_date;
      if (!lastTopping) return true;

      const daysSinceTopping = Math.floor((new Date() - new Date(lastTopping)) / (1000 * 60 * 60 * 24));
      return daysSinceTopping > 30; // Need topping every 30 days
    });

    // Sort by barrel number
    return needsTopping.sort((a, b) => {
      const aNum = parseInt(a.name.match(/\d+/)?.[0] || '999');
      const bNum = parseInt(b.name.match(/\d+/)?.[0] || '999');
      if (aNum !== bNum) return aNum - bNum;
      return a.name.localeCompare(b.name);
    });
  };

  // Get barrels approaching retirement
  const getBarrelsForReplacement = () => {
    return barrels.filter(barrel => {
      const fills = barrel.total_fills || 0;
      const age = barrel.purchase_date
        ? Math.floor((new Date() - new Date(barrel.purchase_date)) / (1000 * 60 * 60 * 24 * 365))
        : 0;

      return fills >= 4 || age >= 5; // Replace after 5 fills or 5 years
    });
  };

  // Handle bulk topping
  const handleBulkTopping = async () => {
    try {
      const toppingDate = new Date().toISOString().split('T')[0];

      await Promise.all(
        selectedBarrels.map(id =>
          updateContainer(id, {
            last_topping_date: toppingDate
          })
        )
      );

      setSuccess(`Marked ${selectedBarrels.length} barrel(s) as topped`);
      setSelectedBarrels([]);
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  // Toggle barrel selection
  const toggleBarrelSelection = (barrelId) => {
    setSelectedBarrels(prev =>
      prev.includes(barrelId)
        ? prev.filter(id => id !== barrelId)
        : [...prev, barrelId]
    );
  };

  // Fix duplicate barrel names by renaming them sequentially
  const fixDuplicateBarrelNames = async () => {
    setLoading(true);
    setError(null);
    try {
      const barrelNames = {};
      barrels.forEach(barrel => {
        if (!barrelNames[barrel.name]) {
          barrelNames[barrel.name] = [];
        }
        barrelNames[barrel.name].push(barrel);
      });

      const duplicates = Object.entries(barrelNames).filter(([_, barrels]) => barrels.length > 1);

      if (duplicates.length === 0) {
        setSuccess('No duplicate barrel names found!');
        setTimeout(() => setSuccess(null), 3000);
        setLoading(false);
        return;
      }

      // Find the highest barrel number currently in use
      let maxBarrelNum = 0;
      barrels.forEach(barrel => {
        const match = barrel.name.match(/Barrel (\d+)/);
        if (match) {
          const num = parseInt(match[1]);
          if (num > maxBarrelNum) maxBarrelNum = num;
        }
      });

      let fixedCount = 0;
      let nextBarrelNum = maxBarrelNum + 1;

      // For each set of duplicates, keep the first one and rename the rest
      for (const [barrelName, duplicateBarrels] of duplicates) {
        // Keep first barrel with original name, rename the rest
        for (let i = 1; i < duplicateBarrels.length; i++) {
          const barrelToRename = duplicateBarrels[i];
          const newName = `Barrel ${nextBarrelNum}`;

          await updateContainer(barrelToRename.id, {
            name: newName
          });

          nextBarrelNum++;
          fixedCount++;
        }
      }

      setSuccess(`Renamed ${fixedCount} duplicate barrels!`);
      loadData();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('Error fixing duplicate barrel names:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Assign pressed wine to barrel
  const assignToBarrel = async (lotId, barrelId) => {
    try {
      const lot = lots.find(l => l.id === lotId);
      const barrel = barrels.find(b => b.id === barrelId);

      if (!lot || !barrel) {
        throw new Error('Lot or barrel not found');
      }

      // Update lot to assign to barrel and change status to aging
      await updateLot(lotId, {
        container_id: barrelId,
        status: 'aging'
      });

      // Update barrel status and increment fill count
      await updateContainer(barrelId, {
        status: 'in_use',
        total_fills: (barrel.total_fills || 0) + 1
      });

      // Log the assignment in vessel history
      await logLotAssignment(barrelId, lotId, lot.current_volume_gallons || 0);

      setSuccess(`${lot.name} assigned to ${barrel.name} for aging`);
      setAssigningLot(null);
      setSelectedBarrel(null);
      loadData();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error assigning to barrel:', err);
      setError(err.message);
    }
  };

  // Auto-fill barrels from a large lot
  const autoFillBarrels = async (lotId) => {
    setAutoFilling(true);
    setError(null);

    try {
      const lot = lots.find(l => l.id === lotId);
      if (!lot || !lot.current_volume_gallons) {
        throw new Error('Lot or volume not found');
      }

      const totalVolume = lot.current_volume_gallons;

      // Sort available barrels by name to maintain consistent ordering
      const sortedBarrels = [...availableBarrels].sort((a, b) => {
        // Extract numbers from names for natural sorting (e.g., "Barrel 1", "Barrel 2")
        const aNum = parseInt(a.name.match(/\d+/)?.[0] || '999');
        const bNum = parseInt(b.name.match(/\d+/)?.[0] || '999');
        if (aNum !== bNum) return aNum - bNum;
        // If no numbers or same numbers, sort alphabetically
        return a.name.localeCompare(b.name);
      });

      if (sortedBarrels.length === 0) {
        throw new Error('No available barrels. Clean or sanitize barrels first.');
      }

      // Calculate barrel allocation
      let remainingVolume = totalVolume;
      const allocations = [];

      for (const barrel of sortedBarrels) {
        if (remainingVolume <= 0) break;

        const fillVolume = Math.min(remainingVolume, barrel.capacity_gallons);
        allocations.push({
          barrel,
          volume: fillVolume
        });
        remainingVolume -= fillVolume;
      }

      if (remainingVolume > 0) {
        throw new Error(`Not enough barrel capacity. Need ${remainingVolume.toFixed(0)} more gallons.`);
      }

      // Create child lots and assign to barrels
      const createdLots = [];
      for (let i = 0; i < allocations.length; i++) {
        const { barrel, volume } = allocations[i];

        // Create child lot
        const childLot = await createLot({
          name: `${lot.name} - Barrel ${i + 1}`,
          vintage: lot.vintage,
          varietal: lot.varietal,
          appellation: lot.appellation,
          block_id: lot.block_id,
          parent_lot_id: lot.id,
          status: 'aging',
          container_id: barrel.id,
          current_volume_gallons: volume,
          current_brix: lot.current_brix,
          current_ph: lot.current_ph,
          current_ta: lot.current_ta,
          harvest_date: lot.harvest_date,
          press_date: lot.press_date,
          yeast_strain: lot.yeast_strain
        });

        if (childLot.error) {
          throw childLot.error;
        }

        if (!childLot.data) {
          throw new Error('Failed to create child lot');
        }

        // Update barrel
        await updateContainer(barrel.id, {
          status: 'in_use',
          total_fills: (barrel.total_fills || 0) + 1
        });

        // Log assignment
        await logLotAssignment(barrel.id, childLot.data.id, volume);

        createdLots.push(childLot.data);
      }

      // Update parent lot to "barreled" or "aging" status (archived)
      await updateLot(lotId, {
        status: 'aging',
        notes: `Split into ${allocations.length} barrels`
      });

      setSuccess(`Successfully filled ${allocations.length} barrels with ${totalVolume.toFixed(0)} gallons`);
      setAssigningLot(null);
      loadData();

      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('Error auto-filling barrels:', err);
      setError(err.message);
    } finally {
      setAutoFilling(false);
    }
  };

  // Calculate remaining volume for a lot (total - already barreled children)
  const getRemainingVolume = (lot) => {
    const childLots = lots.filter(l => l.parent_lot_id === lot.id && l.status === 'aging');
    const barreledVolume = childLots.reduce((sum, child) => sum + (child.current_volume_gallons || 0), 0);
    return (lot.current_volume_gallons || 0) - barreledVolume;
  };

  // Preview barrel allocation for a lot
  const getBarrelAllocationPreview = (lot) => {
    const totalVolume = getRemainingVolume(lot);
    if (totalVolume <= 0) return null;

    // Sort available barrels by name to maintain consistent ordering
    const sortedBarrels = [...availableBarrels].sort((a, b) => {
      const aNum = parseInt(a.name.match(/\d+/)?.[0] || '999');
      const bNum = parseInt(b.name.match(/\d+/)?.[0] || '999');
      if (aNum !== bNum) return aNum - bNum;
      return a.name.localeCompare(b.name);
    });

    let remainingVolume = totalVolume;
    const allocations = [];

    for (const barrel of sortedBarrels) {
      if (remainingVolume <= 0) break;
      const fillVolume = Math.min(remainingVolume, barrel.capacity_gallons);
      allocations.push({ barrel, volume: fillVolume });
      remainingVolume -= fillVolume;
    }

    return {
      allocations,
      barrelCount: allocations.length,
      remainingVolume,
      canFit: remainingVolume <= 0
    };
  };

  const needsTopping = getBarrelsNeedingTopping();
  const needsReplacement = getBarrelsForReplacement();

  // Get lots ready for blending (aged at least 6 months)
  const getLotsReadyForBlending = () => {
    return lots.filter(lot => {
      if (lot.status !== 'aging' || !lot.container_id) return false;

      // Calculate aging time
      const container = barrels.find(b => b.id === lot.container_id);
      if (!container) return false;

      const monthsAging = lot.updated_at
        ? Math.floor((new Date() - new Date(lot.updated_at)) / (1000 * 60 * 60 * 24 * 30))
        : 0;

      // Ready if aged for at least 6 months
      return monthsAging >= 6;
    }).sort((a, b) => {
      // Sort by aging time (oldest first)
      const aTime = a.updated_at ? new Date(a.updated_at) : new Date();
      const bTime = b.updated_at ? new Date(b.updated_at) : new Date();
      return aTime - bTime;
    });
  };

  const readyForBlending = getLotsReadyForBlending();

  // Detect duplicate barrel names in the containers table
  const duplicateBarrelNames = React.useMemo(() => {
    const barrelNames = {};
    barrels.forEach(barrel => {
      if (!barrelNames[barrel.name]) {
        barrelNames[barrel.name] = [];
      }
      barrelNames[barrel.name].push(barrel);
    });
    const duplicates = Object.entries(barrelNames).filter(([_, barrels]) => barrels.length > 1);
    console.log('Duplicate barrel names:', duplicates.length, duplicates);
    return duplicates;
  }, [barrels]);

  // Get unique values for filters
  const varietals = ['all', ...new Set(lots.filter(l => l.status === 'aging').map(l => l.varietal).filter(Boolean))];
  const vintages = ['all', ...new Set(lots.filter(l => l.status === 'aging').map(l => l.vintage).filter(Boolean))].sort((a, b) => {
    if (a === 'all') return -1;
    if (b === 'all') return 1;
    return b - a;
  });
  const parentLots = ['all', ...new Set(lots.filter(l => l.status === 'aging' && l.parent_lot_id).map(l => {
    const parent = lots.find(p => p.id === l.parent_lot_id);
    return parent?.name;
  }).filter(Boolean))];

  // Filter and sort aging lots
  const agingLots = lots
    .filter(lot => {
      // Only show lots that are actually in barrels
      if (lot.status !== 'aging' || !lot.container_id) return false;

      // Check if the container exists in our barrels list
      const container = barrels.find(b => b.id === lot.container_id);
      if (!container) return false;

      // Apply filters
      if (filterVarietal !== 'all' && lot.varietal !== filterVarietal) return false;
      if (filterVintage !== 'all' && lot.vintage !== parseInt(filterVintage)) return false;
      if (filterParentLot !== 'all') {
        const parent = lots.find(p => p.id === lot.parent_lot_id);
        if (parent?.name !== filterParentLot) return false;
      }

      return true;
    })
    .sort((a, b) => {
      // Apply sorting
      switch (sortBy) {
        case 'barrel':
          // Sort by barrel number (1-X)
          const aContainer = barrels.find(barrel => barrel.id === a.container_id);
          const bContainer = barrels.find(barrel => barrel.id === b.container_id);
          const aName = aContainer?.name || '';
          const bName = bContainer?.name || '';
          const aNum = parseInt(aName.match(/\d+/)?.[0] || '999999');
          const bNum = parseInt(bName.match(/\d+/)?.[0] || '999999');
          if (aNum !== bNum) return aNum - bNum;
          return aName.localeCompare(bName);
        case 'age-new':
          // Newest first (most recent press_date)
          return new Date(b.press_date || 0) - new Date(a.press_date || 0);
        case 'age-old':
          // Oldest first (earliest press_date)
          return new Date(a.press_date || 0) - new Date(b.press_date || 0);
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        default:
          // Default: sort by barrel number
          const aContainerDef = barrels.find(barrel => barrel.id === a.container_id);
          const bContainerDef = barrels.find(barrel => barrel.id === b.container_id);
          const aNameDef = aContainerDef?.name || '';
          const bNameDef = bContainerDef?.name || '';
          const aNumDef = parseInt(aNameDef.match(/\d+/)?.[0] || '999999');
          const bNumDef = parseInt(bNameDef.match(/\d+/)?.[0] || '999999');
          if (aNumDef !== bNumDef) return aNumDef - bNumDef;
          return aNameDef.localeCompare(bNameDef);
      }
    });

  // Only show pressed lots that still have volume remaining to barrel
  const pressedLots = lots.filter(lot => {
    if (lot.status !== 'pressed') return false;
    const remaining = getRemainingVolume(lot);
    return remaining > 0;
  });

  // Available barrels: must be empty/sanitized AND not currently assigned to any lot
  const availableBarrels = barrels.filter(b => {
    // Must be empty or sanitized status
    if (b.status !== 'empty' && b.status !== 'sanitized') return false;

    // Check if any lot is currently using this barrel
    const lotInBarrel = lots.find(lot => lot.container_id === b.id && lot.status === 'aging');
    return !lotInBarrel; // Only available if no lot is using it
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-[#7C203A] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading aging data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="pt-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Aging Management</h2>
          <p className="text-gray-600 mt-1">Barrel rotation, topping schedules, and aging timeline</p>
        </div>
        {duplicateBarrelNames.length > 0 && (
          <button
            onClick={fixDuplicateBarrelNames}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
          >
            <AlertTriangle className="w-5 h-5" />
            Fix {duplicateBarrelNames.length} Duplicate Barrel Name{duplicateBarrelNames.length > 1 ? 's' : ''}
          </button>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle2 className="w-5 h-5" />
            <span>{success}</span>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Barrel className="w-8 h-8 text-[#7C203A]" />
            <span className="text-sm font-medium text-gray-600">Total Barrels</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{barrels.length}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8 text-[#7C203A]" />
            <span className="text-sm font-medium text-gray-600">Aging Lots</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{agingLots.length}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Droplet className="w-8 h-8 text-amber-600" />
            <span className="text-sm font-medium text-gray-600">Needs Topping</span>
          </div>
          <p className="text-3xl font-bold text-amber-700">{needsTopping.length}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <span className="text-sm font-medium text-gray-600">Replacement Due</span>
          </div>
          <p className="text-3xl font-bold text-red-700">{needsReplacement.length}</p>
        </div>
      </div>

      {/* Pressed Wine Ready for Barrels */}
      {pressedLots.length > 0 && (
        <div className="bg-gradient-to-br from-purple-50 to-rose-50 rounded-xl border-2 border-purple-200 shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Wine className="w-6 h-6 text-purple-700" />
            <div>
              <h3 className="text-xl font-bold text-gray-900">Pressed Wine Ready for Aging</h3>
              <p className="text-sm text-gray-600 mt-1">Assign these lots to barrels to begin aging</p>
            </div>
          </div>

          <div className="space-y-4">
            {pressedLots.map(lot => {
              const remainingVolume = getRemainingVolume(lot);
              const preview = getBarrelAllocationPreview(lot);

              return (
                <div key={lot.id} className="bg-white rounded-lg border border-purple-200 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-gray-900">{lot.name}</h4>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span>{lot.varietal} • {lot.vintage}</span>
                        {lot.current_volume_gallons && (
                          <span className="font-medium text-purple-700">
                            Total: {lot.current_volume_gallons} gal
                          </span>
                        )}
                        {remainingVolume !== lot.current_volume_gallons && (
                          <span className="font-semibold text-orange-700">
                            Remaining: {remainingVolume.toFixed(0)} gal
                          </span>
                        )}
                        {lot.press_date && (
                          <span>Pressed: {new Date(lot.press_date).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => autoFillBarrels(lot.id)}
                        disabled={autoFilling || remainingVolume <= 0}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {autoFilling ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Filling...
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4" />
                            Auto-Fill Barrels
                          </>
                        )}
                      </button>
                    <button
                      onClick={() => setAssigningLot(lot.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
                    >
                      <Barrel className="w-4 h-4" />
                      Manual Assign
                    </button>
                  </div>
                </div>

                {/* Allocation Preview */}
                {preview && remainingVolume > 0 && (
                  <div className="mt-3 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-indigo-900 mb-1">
                          Auto-fill will use {preview.barrelCount} barrel{preview.barrelCount !== 1 ? 's' : ''}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {preview.allocations.slice(0, 5).map((alloc, idx) => (
                            <span key={idx} className="text-xs bg-white px-2 py-1 rounded border border-indigo-200 text-gray-700">
                              {alloc.barrel.name}: {alloc.volume.toFixed(0)} gal
                            </span>
                          ))}
                          {preview.allocations.length > 5 && (
                            <span className="text-xs text-indigo-700">
                              +{preview.allocations.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                      {!preview.canFit && (
                        <div className="ml-3 px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold">
                          Need {preview.remainingVolume.toFixed(0)} more gal capacity
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Barrel Selection */}
                {assigningLot === lot.id && (
                  <div className="mt-4 pt-4 border-t border-purple-200">
                    <p className="text-sm font-medium text-gray-700 mb-3">Select a barrel:</p>
                    {availableBarrels.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        No available barrels. Clean or sanitize a barrel first.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {availableBarrels.map(barrel => (
                          <button
                            key={barrel.id}
                            onClick={() => assignToBarrel(lot.id, barrel.id)}
                            className="p-3 text-left border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900">{barrel.name}</p>
                                <p className="text-sm text-gray-600 mt-1">
                                  {barrel.cooperage || 'Barrel'} • {barrel.capacity_gallons} gal
                                  {barrel.total_fills > 0 && ` • ${barrel.total_fills} fills`}
                                </p>
                              </div>
                              <ArrowRight className="w-5 h-5 text-purple-600" />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => setAssigningLot(null)}
                      className="mt-3 text-sm text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Topping Schedule */}
      {needsTopping.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Droplet className="w-5 h-5 text-[#7C203A]" />
              <h3 className="text-lg font-semibold text-gray-900">Topping Schedule</h3>
            </div>
            <div className="flex items-center gap-2">
              {selectedBarrels.length === 0 ? (
                <button
                  onClick={() => setSelectedBarrels(needsTopping.map(b => b.id))}
                  className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Select All ({needsTopping.length})
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setSelectedBarrels([])}
                    className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Clear Selection
                  </button>
                  <button
                    onClick={handleBulkTopping}
                    className="flex items-center gap-2 px-4 py-2 bg-[#7C203A] text-white rounded-lg hover:bg-[#8B2E48] transition-colors shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Mark {selectedBarrels.length} Topped
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {needsTopping.map(barrel => {
              const lot = lots.find(l => l.container_id === barrel.id);
              const daysSinceTopping = barrel.last_topping_date
                ? Math.floor((new Date() - new Date(barrel.last_topping_date)) / (1000 * 60 * 60 * 24))
                : 999;
              const isSelected = selectedBarrels.includes(barrel.id);

              return (
                <div
                  key={barrel.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#7C203A] bg-rose-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                  onClick={() => toggleBarrelSelection(barrel.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <p className="font-semibold text-gray-900">{barrel.name}</p>
                        {lot && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                            {lot.name}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {barrel.cooperage && `${barrel.cooperage} • `}
                        {barrel.capacity_gallons} gal
                        {barrel.last_topping_date && ` • Last topped: ${daysSinceTopping} days ago`}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      daysSinceTopping > 45
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {daysSinceTopping > 45 ? 'Urgent' : 'Due Soon'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Aging Lots */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#7C203A]" />
            <h3 className="text-lg font-semibold text-gray-900">Aging Timeline</h3>
            <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
              {agingLots.length}
            </span>
          </div>
        </div>

        {/* Filters */}
        {lots.filter(l => l.status === 'aging').length > 0 && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Varietal</label>
                <select
                  value={filterVarietal}
                  onChange={(e) => setFilterVarietal(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                >
                  {varietals.map(v => (
                    <option key={v} value={v}>{v === 'all' ? 'All Varietals' : v}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vintage</label>
                <select
                  value={filterVintage}
                  onChange={(e) => setFilterVintage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                >
                  {vintages.map(v => (
                    <option key={v} value={v}>{v === 'all' ? 'All Vintages' : v}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fermentation Tank</label>
                <select
                  value={filterParentLot}
                  onChange={(e) => setFilterParentLot(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                >
                  {parentLots.map(p => (
                    <option key={p} value={p}>{p === 'all' ? 'All Tanks' : p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C203A] focus:border-transparent"
                >
                  <option value="barrel">Barrel Number (1-X)</option>
                  <option value="age-new">Newest First</option>
                  <option value="age-old">Oldest First</option>
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {agingLots.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No lots currently aging</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agingLots.map(lot => {
              const daysAging = lot.press_date
                ? Math.floor((new Date() - new Date(lot.press_date)) / (1000 * 60 * 60 * 24))
                : 0;
              const monthsAging = (daysAging / 30).toFixed(1);
              const targetMonths = 18; // Default target
              const progress = Math.min((monthsAging / targetMonths) * 100, 100);
              const container = barrels.find(b => b.id === lot.container_id);

              return (
                <button
                  key={lot.id}
                  onClick={() => container && navigate(`/production/vessel/${container.id}?from=aging`)}
                  className="p-4 rounded-xl border-2 border-gray-200 hover:border-amber-500 hover:shadow-lg bg-white transition-all text-left group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Barrel className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <p className="font-bold text-gray-900 truncate group-hover:text-amber-700 transition-colors">
                          {container?.name || 'Unknown Vessel'}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{lot.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{lot.varietal} • {lot.vintage}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-amber-600 transition-colors flex-shrink-0 ml-2" />
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-amber-50 rounded-lg p-2">
                      <p className="text-xs text-gray-600">Aging Time</p>
                      <p className="text-sm font-bold text-amber-700">{monthsAging} mo</p>
                    </div>
                    {lot.current_volume_gallons && (
                      <div className="bg-purple-50 rounded-lg p-2">
                        <p className="text-xs text-gray-600">Volume</p>
                        <p className="text-sm font-bold text-purple-700">{lot.current_volume_gallons.toFixed(0)} gal</p>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{progress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-[#7C203A] h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Ready for Blending */}
      {readyForBlending.length > 0 && (
        <div className="bg-gradient-to-br from-rose-50 to-purple-50 rounded-xl border-2 border-rose-200 shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-6 h-6 text-rose-600" />
              <h3 className="text-lg font-semibold text-gray-900">Ready for Blending</h3>
              <span className="ml-2 px-2.5 py-0.5 bg-rose-100 text-rose-700 rounded-full text-sm font-medium">
                {readyForBlending.length}
              </span>
            </div>
            <button
              onClick={() => navigate('/production?view=blending')}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-600 to-purple-600 text-white rounded-lg hover:from-rose-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
            >
              <Layers className="w-4 h-4" />
              <span>Create Blend</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            These lots have aged for 6+ months and are ready to be blended
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {readyForBlending.map(lot => {
              const monthsAging = lot.updated_at
                ? Math.floor((new Date() - new Date(lot.updated_at)) / (1000 * 60 * 60 * 24 * 30))
                : 0;
              const container = barrels.find(b => b.id === lot.container_id);

              return (
                <div
                  key={lot.id}
                  className="p-4 rounded-xl border-2 border-rose-200 hover:border-rose-400 bg-white hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Wine className="w-4 h-4 text-rose-600 flex-shrink-0" />
                        <p className="font-bold text-gray-900 truncate">{lot.name}</p>
                      </div>
                      <p className="text-xs text-gray-500">{lot.varietal} • {lot.vintage}</p>
                      {container && (
                        <p className="text-xs text-gray-500 mt-1">
                          <Barrel className="w-3 h-3 inline mr-1" />
                          {container.name}
                        </p>
                      )}
                    </div>
                    <span className="ml-2 px-2 py-1 bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold whitespace-nowrap">
                      {monthsAging} mo
                    </span>
                  </div>

                  {/* Chemistry */}
                  <div className="grid grid-cols-3 gap-2">
                    {lot.current_ph && (
                      <div className="bg-blue-50 rounded-lg p-2">
                        <p className="text-xs text-gray-600">pH</p>
                        <p className="text-sm font-bold text-blue-700">{lot.current_ph.toFixed(2)}</p>
                      </div>
                    )}
                    {lot.current_ta && (
                      <div className="bg-green-50 rounded-lg p-2">
                        <p className="text-xs text-gray-600">TA</p>
                        <p className="text-sm font-bold text-green-700">{lot.current_ta.toFixed(2)}</p>
                      </div>
                    )}
                    {lot.current_volume_gallons && (
                      <div className="bg-purple-50 rounded-lg p-2">
                        <p className="text-xs text-gray-600">Vol</p>
                        <p className="text-sm font-bold text-purple-700">{lot.current_volume_gallons.toFixed(0)} gal</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-rose-200">
            <p className="text-sm text-gray-600 italic">
              💡 Tip: Select multiple lots from different barrels to create complex blends with balanced chemistry
            </p>
          </div>
        </div>
      )}

      {/* Barrel Replacement Planning */}
      {needsReplacement.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900">Barrel Replacement Planning</h3>
          </div>

          <div className="space-y-2">
            {needsReplacement.map(barrel => {
              const age = barrel.purchase_date
                ? Math.floor((new Date() - new Date(barrel.purchase_date)) / (1000 * 60 * 60 * 24 * 365))
                : 0;
              const fills = barrel.total_fills || 0;

              return (
                <div key={barrel.id} className="p-4 rounded-lg border border-red-200 bg-red-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{barrel.name}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {barrel.cooperage && `${barrel.cooperage} • `}
                        Age: {age} years • Fills: {fills}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                      Consider Replacement
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
