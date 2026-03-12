import React from 'react';
import './MiniMap.css';

export default function MiniMap({ lat, lng }) {
  // Simple Equirectangular projection mapping to percentages
  // Lng: -180 (left) to 180 (right)
  // Lat: 90 (top) to -90 (bottom)
  
  const xPos = ((lng + 180) / 360) * 100;
  // Offset slightly for visual centering depending on the SVG used
  const yPos = ((90 - lat) / 180) * 100;

  return (
    <div className="mini-map-container">
      <div className="map-title">Geographic Origin</div>
      <div className="map-wrapper">
        <img src="/world-map.svg" alt="World Map" className="world-svg" />
        
        {lat !== undefined && lng !== undefined && (
          <div 
            className="pulse-dot"
            style={{ 
              left: `${xPos}%`, 
              top: `${yPos}%` 
            }}
          />
        )}
      </div>
      <div className="coords-display">
        {lat !== undefined ? `${lat.toFixed(2)}°, ${lng.toFixed(2)}°` : 'Unknown Location'}
      </div>
    </div>
  );
}
