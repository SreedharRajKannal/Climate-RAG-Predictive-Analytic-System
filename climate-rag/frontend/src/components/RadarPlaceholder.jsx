import React from "react"

export default function RadarPlaceholder({ locationName }) {
  return (
    <div className="radar-card">
      <div className="radar-bg">
        {/* Grid lines */}
        <svg className="radar-grid" viewBox="0 0 400 200" preserveAspectRatio="none">
          {[0,1,2,3,4,5,6,7,8].map(i => (
            <line key={`v${i}`} x1={i*50} y1="0" x2={i*50} y2="200" stroke="rgba(59,130,246,0.06)" strokeWidth="1" />
          ))}
          {[0,1,2,3,4].map(i => (
            <line key={`h${i}`} x1="0" y1={i*50} x2="400" y2={i*50} stroke="rgba(59,130,246,0.06)" strokeWidth="1" />
          ))}
          {/* Radar sweep lines */}
          <circle cx="200" cy="100" r="60" stroke="rgba(59,130,246,0.08)" strokeWidth="1" fill="none" />
          <circle cx="200" cy="100" r="120" stroke="rgba(59,130,246,0.05)" strokeWidth="1" fill="none" strokeDasharray="4 4" />
        </svg>

        {/* Location pin */}
        <div className="radar-pin">
          <div className="radar-pin-dot" />
          <span className="radar-pin-label">{locationName || "Location"}</span>
        </div>

        {/* Coming soon overlay */}
        <div className="radar-overlay">
          <div className="radar-overlay-icon">📡</div>
          <div className="radar-overlay-title">Weather Radar</div>
          <div className="radar-overlay-subtitle">Coming Soon</div>
        </div>
      </div>
    </div>
  )
}
