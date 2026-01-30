import React, { useState } from 'react';
import { ArrowLeft, Edit2, Trash2, Barrel, Package, Droplet, MapPin, CheckCircle2, MoreVertical, Grape } from 'lucide-react';

export function VesselHeader({
  container,
  lot,
  currentVolume,
  onBack,
  onEdit,
  onDelete,
  onChangeLot,
  onAssignLot
}) {
  const [showMenu, setShowMenu] = useState(false);

  const getVesselIcon = () => {
    switch (container.type) {
      case 'barrel': return Barrel;
      case 'tank': return Package;
      case 'tote': return Package;
      default: return Package;
    }
  };

  const VesselIcon = getVesselIcon();

  const fillPercentage = currentVolume && container
    ? Math.min((currentVolume / container.capacity_gallons) * 100, 100)
    : 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="px-4 py-4 sm:px-6 sm:py-5">
        {/* Top Row - Back button and Menu */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium hidden sm:inline">Back</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-2">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onEdit();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors text-left"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span className="text-sm font-medium">Edit Vessel</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      lot ? onChangeLot() : onAssignLot();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors text-left"
                  >
                    <Grape className="w-4 h-4" />
                    <span className="text-sm font-medium">{lot ? 'Change Lot' : 'Assign Lot'}</span>
                  </button>
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onDelete();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors text-left"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-sm font-medium">Delete Vessel</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex items-center gap-4">
          {/* Vessel Icon */}
          <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-[#7C203A] to-[#5a1a2d] flex items-center justify-center shadow-lg">
            <VesselIcon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
          </div>

          {/* Vessel Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
              {container.name}
            </h1>
            <p className="text-sm text-gray-600 mt-0.5">
              {lot ? (
                <span className="text-[#7C203A] font-medium">
                  {lot.vintage} {lot.varietal} <span className="text-gray-400">·</span> {currentVolume?.toFixed(0) || 0} gal
                </span>
              ) : (
                <span>
                  {container.capacity_gallons} gal capacity
                </span>
              )}
            </p>
            {lot && (
              <p className="text-xs text-gray-500 mt-0.5">
                Status: <span className="capitalize">{lot.status?.replace(/_/g, ' ')}</span>
                {lot.press_date && (() => {
                  const months = Math.round((new Date() - new Date(lot.press_date)) / (1000 * 60 * 60 * 24 * 30.44));
                  return months > 0 ? ` (${months} months)` : '';
                })()}
              </p>
            )}
          </div>
        </div>

        {/* Info Chips */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium capitalize">
            <VesselIcon className="w-3 h-3" />
            {container.type}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
            <Droplet className="w-3 h-3" />
            {container.capacity_gallons} gal
          </span>
          {container.location && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
              <MapPin className="w-3 h-3" />
              {container.location}
            </span>
          )}
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
            container.status === 'in_use' ? 'bg-green-100 text-green-700' :
            container.status === 'empty' ? 'bg-gray-100 text-gray-700' :
            container.status === 'sanitized' ? 'bg-emerald-100 text-emerald-700' :
            container.status === 'needs_cip' ? 'bg-orange-100 text-orange-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            <CheckCircle2 className="w-3 h-3" />
            {container.status.replace(/_/g, ' ')}
          </span>
        </div>
      </div>
    </div>
  );
}
