# IconLabel Component System

## Overview

A comprehensive solution for the "icon square + label" pattern used throughout the application. This system ensures consistent vertical alignment and eliminates the common misalignment issues caused by default heading margins and inconsistent line-heights.

## Problem Statement

The application had 111+ instances of the "icon square + label" pattern across 25+ files with inconsistent alignment. Some labels were vertically misaligned due to:

1. **Default heading margins** (`h2` has `margin: 2rem 0 0.75rem` in index.css) - top margin pushes headings down
2. **Inconsistent line-height** on labels (default h2 line-height: 1.15 vs no specification)
3. **Missing `items-center`** on some flex containers
4. **Heading elements** (`<h2>`, `<h3>`) inheriting margins that break alignment

## Root Causes Fixed

### 1. Heading Margins (Primary Issue)
**Before:**
```jsx
<h2 className="text-lg font-bold text-gray-900">Temp Alerts</h2>
// Inherits margin: 2rem 0 0.75rem from index.css line 36
```

**After:**
```jsx
<Heading className={`${headingSize} font-bold text-gray-900 m-0 leading-none`}>
  {label}
</Heading>
// Explicit m-0 overrides default margins
```

### 2. Inconsistent Line-Height
**Before:**
```jsx
<p className="font-semibold text-gray-900 text-sm">New Harvest</p>
// Uses default line-height, may not align
```

**After:**
```jsx
<p className="font-semibold text-gray-900 text-sm m-0 leading-tight">{label}</p>
// Consistent leading-tight for all labels
```

### 3. Icon Container Alignment
**Before:**
```jsx
<div className="w-8 h-8 bg-[#7C203A] rounded-lg flex items-center justify-center">
  // Some instances missing items-center or justify-center
</div>
```

**After:**
```jsx
<div className={`${sizes.container} ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
  // Always includes items-center, justify-center, flex-shrink-0
</div>
```

### 4. Flex Container Alignment
**Before:**
```jsx
<div className="flex gap-2 mb-4">
  // Missing items-center in some instances
</div>
```

**After:**
```jsx
<div className={`flex items-center gap-${gap} ${className}`}>
  // Always includes items-center for vertical alignment
</div>
```

## Components

### 1. IconLabel
Basic icon + label combination with zero margins and consistent alignment.

```jsx
import { IconLabel } from '@/shared/components/ui/IconLabel';
import { Thermometer } from 'lucide-react';

<IconLabel
  icon={Thermometer}
  label="Temperature"
  iconSize="md"          // sm|md|lg|xl
  iconColor="text-white"
  iconBg="bg-[#7C203A]"
  gap="2"                // Tailwind gap value
/>
```

**Icon Sizes:**
- `sm`: container 8x8 (w-8 h-8), icon 4x4 (w-4 h-4)
- `md`: container 10x10 (w-10 h-10), icon 5x5 (w-5 h-5) - **default**
- `lg`: container 12x12 (w-12 h-12), icon 6x6 (w-6 h-6)
- `xl`: container 14x14 (w-14 h-14), icon 7x7 (w-7 h-7)

### 2. IconLabelHeading
Specialized for section headings with semantic HTML and zero margins.

```jsx
import { IconLabelHeading } from '@/shared/components/ui/IconLabel';
import { BarChart3 } from 'lucide-react';

<IconLabelHeading
  icon={BarChart3}
  label="Production Pipeline"
  headingLevel="h2"      // h1|h2|h3|h4
  iconSize="sm"          // sm|md|lg
  className="mb-4"
/>
```

**Heading Sizes:**
- `h1`: text-2xl
- `h2`: text-xl - **default**
- `h3`: text-lg
- `h4`: text-base

**Key Feature:** Renders semantic HTML (`<h1>`, `<h2>`, etc.) with `m-0 leading-none` to override index.css defaults.

### 3. IconLabelButton
Interactive button/link version with hover states.

```jsx
import { IconLabelButton } from '@/shared/components/ui/IconLabel';
import { Grape } from 'lucide-react';

<IconLabelButton
  icon={Grape}
  label="New Harvest"
  subtitle="Record incoming fruit"
  onClick={() => navigate('/production?view=harvest')}
  iconSize="sm"
/>
```

**Features:**
- Group hover effects (icon bg changes on hover)
- Optional subtitle line
- Consistent padding and transitions
- Full-width by default

### 4. IconLabelStat
Specialized for stat cards with value display.

```jsx
import { IconLabelStat } from '@/shared/components/ui/IconLabel';
import { Wine } from 'lucide-react';

<IconLabelStat
  icon={Wine}
  label="Total Volume"
  value="1,245 gal"
  color="emerald"        // emerald|rose|purple|amber etc
/>
```

## Usage Examples

### Section Heading (Most Common)
**Before:**
```jsx
<div className="flex items-center gap-2 mb-4">
  <div className="w-8 h-8 bg-[#7C203A] rounded-lg flex items-center justify-center">
    <Thermometer className="w-5 h-5 text-white" />
  </div>
  <h2 className="text-lg font-bold text-gray-900">Temp Alerts</h2>
</div>
```

**After:**
```jsx
<IconLabelHeading
  icon={Thermometer}
  label="Temp Alerts"
  headingLevel="h2"
  className="mb-4"
/>
```

### Quick Action Button
**Before:**
```jsx
<button
  onClick={() => navigate('/production?view=harvest')}
  className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors group"
>
  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-[#7C203A] transition-colors">
    <Grape className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
  </div>
  <div className="text-left flex-1">
    <p className="font-semibold text-gray-900 text-sm">New Harvest</p>
    <p className="text-xs text-gray-500">Record incoming fruit</p>
  </div>
</button>
```

**After:**
```jsx
<IconLabelButton
  icon={Grape}
  label="New Harvest"
  subtitle="Record incoming fruit"
  onClick={() => navigate('/production?view=harvest')}
/>
```

## Migration Guide

### Files Updated (Initial Implementation)

1. **Created:** `/src/shared/components/ui/IconLabel.jsx` - Core component library
2. **Updated:** `/src/features/production/components/ProductionDashboard.jsx`
   - 4 section headings converted to `IconLabelHeading`
   - 4 quick action buttons converted to `IconLabelButton`
   - ~40 more instances remain (to be migrated)

### Recommended Migration Order

1. **High Priority** - Section headings (most visible misalignment):
   - Production Dashboard
   - Vineyard Dashboard
   - Analytics pages

2. **Medium Priority** - Quick action buttons:
   - Navigation sections
   - Dashboard action grids

3. **Low Priority** - Feature cards and marketing content:
   - Homepage features
   - Documentation pages
   - Settings pages

### Migration Checklist

For each file:
- [ ] Import the appropriate component(s)
- [ ] Replace manual flex + icon wrapper + label with component
- [ ] Test that alignment is correct
- [ ] Verify hover states (for buttons)
- [ ] Check responsive behavior

## Design System Benefits

1. **Consistency**: All icon+label patterns use the same spacing and alignment
2. **Maintainability**: One place to update styling for all 111+ instances
3. **Type Safety**: Clear prop interfaces prevent misuse
4. **Accessibility**: Semantic HTML with proper heading levels
5. **Performance**: Reusable components reduce bundle duplication

## Technical Details

### Alignment Strategy

```css
/* Container */
display: flex;
align-items: center;  /* Vertical centering */
gap: var(--gap);      /* Consistent spacing */

/* Icon Wrapper */
display: flex;
align-items: center;
justify-content: center;
flex-shrink: 0;       /* Prevent squashing */

/* Label */
margin: 0;            /* Override h* defaults */
line-height: 1;       /* leading-none for perfect alignment */
```

### Tailwind Classes Used

- **Alignment**: `flex items-center justify-center`
- **Margins**: `m-0` (overrides index.css h* margins)
- **Line Height**: `leading-none` (labels), `leading-tight` (subtitles)
- **Flex Shrink**: `flex-shrink-0` (prevents icon squashing)
- **Sizing**: `w-{size} h-{size}` (consistent square containers)

## Future Improvements

1. **Full Migration**: Convert all 111+ instances to use components
2. **Variants**: Add more preset color schemes
3. **Storybook**: Document all variants visually
4. **Tests**: Add unit tests for alignment edge cases
5. **A11y**: Enhance screen reader support

## Files Affected (Full List - 25+ files)

See top of this document for the complete list of 25 files with 111+ pattern instances identified during the codebase search.
