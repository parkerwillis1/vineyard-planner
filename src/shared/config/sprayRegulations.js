// State-specific spray application regulations and requirements

export const SPRAY_REGULATIONS = {
  CA: {
    name: 'California',
    // California has strictest requirements
    required_fields: {
      applicator_license: true,
      weather_conditions: true,
      equipment_details: true,
      buffer_zones: true,
      nozzle_info: true
    },
    license_required: true,
    record_retention_years: 2,
    notes: 'California requires detailed records for all pesticide applications. Applicator license required for most commercial applications.'
  },

  TX: {
    name: 'Texas',
    // Texas is more flexible - only license required if spraying for hire
    required_fields: {
      applicator_license: false, // Only if spraying for hire
      weather_conditions: false,
      equipment_details: false,
      buffer_zones: false,
      nozzle_info: false
    },
    license_required: false, // Only for commercial applicators
    record_retention_years: 2,
    notes: 'License only required if spraying for hire. Recommended to keep records for safety and liability.'
  },

  OR: {
    name: 'Oregon',
    required_fields: {
      applicator_license: true,
      weather_conditions: true,
      equipment_details: false,
      buffer_zones: true,
      nozzle_info: false
    },
    license_required: true,
    record_retention_years: 3,
    notes: 'Oregon requires records for all restricted-use pesticides.'
  },

  WA: {
    name: 'Washington',
    required_fields: {
      applicator_license: true,
      weather_conditions: true,
      equipment_details: false,
      buffer_zones: true,
      nozzle_info: false
    },
    license_required: true,
    record_retention_years: 2,
    notes: 'Washington requires detailed records for commercial applications.'
  },

  NY: {
    name: 'New York',
    required_fields: {
      applicator_license: true,
      weather_conditions: true,
      equipment_details: false,
      buffer_zones: true,
      nozzle_info: false
    },
    license_required: true,
    record_retention_years: 3,
    notes: 'New York requires certified applicators for commercial use.'
  },

  DEFAULT: {
    name: 'Other State',
    required_fields: {
      applicator_license: false,
      weather_conditions: false,
      equipment_details: false,
      buffer_zones: false,
      nozzle_info: false
    },
    license_required: false,
    record_retention_years: 2,
    notes: 'Check your state regulations. Keeping detailed records is always recommended.'
  }
};

export const US_STATES = [
  { code: 'CA', name: 'California' },
  { code: 'TX', name: 'Texas' },
  { code: 'OR', name: 'Oregon' },
  { code: 'WA', name: 'Washington' },
  { code: 'NY', name: 'New York' },
  { code: 'VA', name: 'Virginia' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'OH', name: 'Ohio' },
  { code: 'MI', name: 'Michigan' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'CO', name: 'Colorado' },
  { code: 'ID', name: 'Idaho' },
  { code: 'OTHER', name: 'Other' }
];

export function getStateRegulations(stateCode) {
  return SPRAY_REGULATIONS[stateCode] || SPRAY_REGULATIONS.DEFAULT;
}

export function isFieldRequired(stateCode, fieldName) {
  const regulations = getStateRegulations(stateCode);
  return regulations.required_fields[fieldName] || false;
}
