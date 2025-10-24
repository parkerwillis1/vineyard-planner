// src/shared/components/ui/VineyardIcons.jsx
// Professional vineyard-specific icons
import React from 'react';

export const GrapeVineIcon = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="18" r="2" />
    <circle cx="9" cy="15" r="2" />
    <circle cx="15" cy="15" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="9" cy="9" r="2" />
    <circle cx="15" cy="9" r="2" />
    <path d="M12 12V3" />
    <path d="M12 3c-1.5 0-2.5-1-2.5-2 0 1-1 2-2.5 2 1.5 0 2.5 1 2.5 2 0-1 1-2 2.5-2z" />
  </svg>
);

export const WineBarrelIcon = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M8 2h8" />
    <path d="M6 6h12" />
    <path d="M18 6c0 4.4-3.6 8-8 8H10c-4.4 0-8-3.6-8-8" />
    <path d="M18 6v12c0 2.2-1.8 4-4 4h-4c-2.2 0-4-1.8-4-4V6" />
    <line x1="9" y1="10" x2="15" y2="10" />
  </svg>
);

export const VineyardIcon = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M2 22h20" />
    <path d="M4 22V12l4-4v14" />
    <path d="M12 22V8l4-4v18" />
    <path d="M20 22V12l-4-4v14" />
    <circle cx="6" cy="6" r="1.5" />
    <circle cx="14" cy="2" r="1.5" />
    <circle cx="18" cy="6" r="1.5" />
  </svg>
);

export const HarvestIcon = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M20 6L9 17l-5-5" />
    <path d="M12 2v6" />
    <circle cx="6" cy="14" r="2" />
    <circle cx="18" cy="14" r="2" />
    <circle cx="12" cy="20" r="2" />
  </svg>
);

export const IrrigationIcon = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 2v6" />
    <path d="M12 8a4 4 0 0 0-4 4v8a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-8a4 4 0 0 0-4-4z" />
    <path d="M8 16h8" />
    <path d="M6 10l-2 2" />
    <path d="M18 10l2 2" />
  </svg>
);

export const PlantingIcon = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 22v-8" />
    <path d="M12 14c-2.5 0-4.5-2-4.5-4.5S9.5 5 12 5s4.5 2 4.5 4.5S14.5 14 12 14z" />
    <path d="M12 5V2" />
    <circle cx="12" cy="9.5" r="1.5" />
    <path d="M18 22H6" />
  </svg>
);

export const TrellisIcon = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M4 2v20" />
    <path d="M20 2v20" />
    <path d="M4 6h16" />
    <path d="M4 12h16" />
    <path d="M4 18h16" />
    <circle cx="8" cy="9" r="1" />
    <circle cx="12" cy="9" r="1" />
    <circle cx="16" cy="9" r="1" />
    <circle cx="8" cy="15" r="1" />
    <circle cx="12" cy="15" r="1" />
    <circle cx="16" cy="15" r="1" />
  </svg>
);

export const SoilIcon = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M2 12h20" />
    <path d="M2 16h20" />
    <path d="M2 20h20" />
    <circle cx="6" cy="8" r="1.5" />
    <circle cx="12" cy="6" r="1.5" />
    <circle cx="18" cy="8" r="1.5" />
  </svg>
);
