// src/shared/components/ui/NounProjectIcon.jsx
import React, { useState, useEffect } from 'react';
import { getIconById, getIconSvg } from '@/shared/lib/nounProjectApi';

/**
 * Component to display a Noun Project icon by ID
 * @param {number} iconId - The Noun Project icon ID
 * @param {string} className - Additional CSS classes
 * @param {number} size - Size in pixels (default: 24)
 */
export function NounProjectIcon({ iconId, className = '', size = 24 }) {
  const [svgContent, setSvgContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadIcon() {
      setLoading(true);
      const icon = await getIconById(iconId);

      if (icon && icon.icon_url) {
        const svg = await getIconSvg(icon.icon_url);
        setSvgContent(svg);
      }

      setLoading(false);
    }

    if (iconId) {
      loadIcon();
    }
  }, [iconId]);

  if (loading) {
    return <div className={`inline-block ${className}`} style={{ width: size, height: size }} />;
  }

  if (!svgContent) {
    return null;
  }

  return (
    <div
      className={`inline-block ${className}`}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}

/**
 * Component to display a Noun Project icon from direct SVG content
 * @param {string} svgContent - Raw SVG content
 * @param {string} className - Additional CSS classes
 * @param {number} size - Size in pixels (default: 24)
 */
export function NounProjectSvgIcon({ svgContent, className = '', size = 24 }) {
  if (!svgContent) return null;

  return (
    <div
      className={`inline-block ${className}`}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}
