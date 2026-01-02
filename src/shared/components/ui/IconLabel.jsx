import React from 'react';

/**
 * IconLabel - A reusable component for icon square + label patterns
 *
 * Ensures consistent vertical alignment across the entire application by:
 * - Using flex with items-center for perfect vertical alignment
 * - Fixed square icon container with centered flex layout
 * - Zero margins and consistent line-height on labels
 * - Support for different icon sizes and colors
 *
 * @param {React.ComponentType} icon - Lucide icon component
 * @param {string|React.ReactNode} label - Text label or React node
 * @param {string} iconSize - Icon container size: 'sm' (8), 'md' (10), 'lg' (12), 'xl' (14)
 * @param {string} iconColor - Icon color class (e.g., 'text-white', 'text-[#7C203A]')
 * @param {string} iconBg - Icon background class (e.g., 'bg-[#7C203A]', 'bg-gradient-to-br from-emerald-500 to-teal-600')
 * @param {string} gap - Gap between icon and label: '1', '2', '3', '4'
 * @param {string} labelClassName - Additional classes for the label
 * @param {string} className - Additional classes for the container
 * @param {React.ReactNode} children - Optional children (for complex label content)
 */
export function IconLabel({
  icon: Icon,
  label,
  iconSize = 'md',
  iconColor = 'text-white',
  iconBg = 'bg-[#7C203A]',
  gap = '2',
  labelClassName = '',
  className = '',
  children
}) {
  // Icon container size mapping
  const sizeMap = {
    sm: { container: 'w-8 h-8', icon: 'w-4 h-4' },
    md: { container: 'w-10 h-10', icon: 'w-5 h-5' },
    lg: { container: 'w-12 h-12', icon: 'w-6 h-6' },
    xl: { container: 'w-14 h-14', icon: 'w-7 h-7' }
  };

  const sizes = sizeMap[iconSize] || sizeMap.md;

  return (
    <div className={`flex items-center gap-${gap} ${className}`}>
      <div className={`${sizes.container} ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
        {Icon && <Icon className={`${sizes.icon} ${iconColor}`} />}
      </div>
      {label && (
        <span className={`m-0 leading-none ${labelClassName}`}>
          {label}
        </span>
      )}
      {children}
    </div>
  );
}

/**
 * IconLabelHeading - Specialized version for section headings
 * Uses larger text and enforces zero margins
 */
export function IconLabelHeading({
  icon: Icon,
  label,
  iconSize = 'sm',
  iconColor = 'text-white',
  iconBg = 'bg-[#7C203A]',
  gap = '2',
  headingLevel = 'h2',
  className = ''
}) {
  const Heading = headingLevel;

  // Icon container size mapping
  const sizeMap = {
    sm: { container: 'w-8 h-8', icon: 'w-5 h-5' },
    md: { container: 'w-10 h-10', icon: 'w-6 h-6' },
    lg: { container: 'w-12 h-12', icon: 'w-7 h-7' }
  };

  const sizes = sizeMap[iconSize] || sizeMap.sm;

  // Heading size mapping
  const headingSizeMap = {
    h1: 'text-2xl',
    h2: 'text-xl',
    h3: 'text-lg',
    h4: 'text-base'
  };

  const headingSize = headingSizeMap[headingLevel] || headingSizeMap.h2;

  return (
    <div className={`flex items-center gap-${gap} ${className}`}>
      <div className={`${sizes.container} ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
        {Icon && <Icon className={`${sizes.icon} ${iconColor}`} />}
      </div>
      <Heading className={`${headingSize} font-bold text-gray-900 m-0 leading-none`}>
        {label}
      </Heading>
    </div>
  );
}

/**
 * IconLabelButton - Specialized version for clickable buttons/links
 * Includes hover states and transition effects
 */
export function IconLabelButton({
  icon: Icon,
  label,
  subtitle,
  iconSize = 'sm',
  iconColor = 'text-gray-600 group-hover:text-white',
  iconBg = 'bg-gray-100 group-hover:bg-[#7C203A]',
  gap = '3',
  onClick,
  className = '',
  ...props
}) {
  const sizeMap = {
    sm: { container: 'w-8 h-8', icon: 'w-4 h-4' },
    md: { container: 'w-10 h-10', icon: 'w-5 h-5' },
    lg: { container: 'w-12 h-12', icon: 'w-6 h-6' }
  };

  const sizes = sizeMap[iconSize] || sizeMap.sm;

  return (
    <button
      onClick={onClick}
      className={`group w-full flex items-center gap-${gap} px-4 py-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors ${className}`}
      {...props}
    >
      <div className={`${sizes.container} ${iconBg} rounded-lg flex items-center justify-center transition-colors flex-shrink-0`}>
        {Icon && <Icon className={`${sizes.icon} ${iconColor} transition-colors`} />}
      </div>
      <div className="text-left flex-1">
        <p className="font-semibold text-gray-900 text-sm m-0 leading-tight">{label}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1 m-0 leading-tight">{subtitle}</p>}
      </div>
    </button>
  );
}

/**
 * IconLabelStat - Specialized version for stat cards
 * Includes icon, label, value, and optional change indicator
 */
export function IconLabelStat({
  icon: Icon,
  label,
  value,
  iconSize = 'xl',
  iconColor,
  iconBg,
  color = 'emerald',
  className = ''
}) {
  // Default colors based on color prop
  const defaultIconColor = iconColor || `text-${color}-600`;
  const defaultIconBg = iconBg || `bg-gradient-to-br from-${color}-50 to-${color}-100`;

  const sizeMap = {
    xl: { container: 'w-14 h-14', icon: 'w-7 h-7' }
  };

  const sizes = sizeMap[iconSize] || sizeMap.xl;

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`${sizes.container} ${defaultIconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
          {Icon && <Icon className={`${sizes.icon} ${defaultIconColor}`} />}
        </div>
      </div>
      <div className="text-3xl font-bold text-gray-900 m-0 leading-none">{value}</div>
      <div className="text-sm font-medium text-gray-600 mt-2 m-0 leading-tight">{label}</div>
    </div>
  );
}
