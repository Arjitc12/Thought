import React from 'react';
import './MiniMap.css';

export default function MiniMap({ lat, lng }) {
  // Simple Equirectangular projection mapping to percentages
  const xPos = ((lng + 180) / 360) * 100;
  const yPos = ((90 - lat) / 180) * 100;

  return (
    <div className="mini-map-container">
      <div className="map-inner">
        <div className="map-header">
          <div className="status-indicator">
            <div className="pulse-small" />
            <span>GEO_LOC_LINK</span>
          </div>
          <div className="map-title">Geographic Origin</div>
        </div>
        
        <div className="map-wrapper">
          <div className="scan-line" />
          <img src={`${import.meta.env.BASE_URL}world-map.svg`} alt="World Map" className="world-svg" />
          
          {lat !== undefined && lng !== undefined && (
            <div 
              className="pulse-dot"
              style={{ 
                left: `${xPos}%`, 
                top: `${yPos}%` 
              }}
            />
          )}

          <div className="corner-accent tl" />
          <div className="corner-accent tr" />
          <div className="corner-accent bl" />
          <div className="corner-accent br" />
        </div>
        
        <div className="map-footer">
          <div className="data-readout">
            <span className="label">COORDINATES:</span>
            <span className="value">{lat !== undefined ? `${lat.toFixed(4)}°, ${lng.toFixed(4)}°` : 'SIGNAL_LOST'}</span>
          </div>
          <div className="data-readout">
            <span className="label">STATUS:</span>
            <span className="value">LOCKED</span>
          </div>
        </div>
      </div>
    </div>
  );
}
