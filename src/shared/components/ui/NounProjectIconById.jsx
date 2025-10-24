// src/shared/components/ui/NounProjectIconById.jsx
import React, { useState, useEffect } from 'react';
import { getIconById } from '@/shared/lib/nounProjectApi';

/**
 * Component to display a Noun Project icon by ID with consistent styling
 * @param {number} iconId - The Noun Project icon ID
 * @param {string} className - Additional CSS classes
 * @param {number} size - Size in pixels (default: 24)
 * @param {string} color - Color for the icon (default: currentColor)
 */
export function NounProjectIconById({ iconId, className = '', size = 24, color = 'currentColor' }) {
  const [thumbnailUrl, setThumbnailUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadIcon() {
      setLoading(true);
      const icon = await getIconById(iconId);

      if (icon && icon.thumbnail_url) {
        setThumbnailUrl(icon.thumbnail_url);
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

  if (!thumbnailUrl) {
    return null;
  }

  // Dark chocolate brown color filter
  const getColorFilter = () => {
    if (color === '#654321') {
      // Dark chocolate brown
      return 'brightness(0) saturate(100%) invert(25%) sepia(45%) saturate(1000%) hue-rotate(15deg) brightness(85%) contrast(95%)';
    }
    return 'brightness(85%) contrast(200%)';
  };

  return (
    <img
      src={thumbnailUrl}
      alt="icon"
      className={`inline-block ${className}`}
      style={{
        width: size,
        height: size,
        filter: getColorFilter(),
        imageRendering: '-webkit-optimize-contrast',
        WebkitFontSmoothing: 'antialiased'
      }}
    />
  );
}
