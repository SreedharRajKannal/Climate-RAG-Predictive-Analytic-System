import React from "react"

export default function SunVisualizer({ sunrise, sunset, timezoneAbbr }) {
  if (!sunrise || !sunset) return null

  // Calculate Golden Hour (roughly 1 hour before sunset)
  const sunsetDate = new Date(sunset)
  const goldenHourDate = new Date(sunsetDate.getTime() - (60 * 60 * 1000))
  
  // Calculate Moonrise (approximate for demo)
  const moonriseDate = new Date(sunsetDate.getTime() + (90 * 60 * 1000))

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Simplified moon phase determination (static for demo, but could be dynamic)
  const getMoonPhase = () => "Waxing Crescent"

  return (
    <div className="card-base" style={{padding: "24px"}}>
      <div className="section-header">
        <h3 className="section-title">Sun & Moon</h3>
      </div>
      
      <div style={{display: "flex", flexDirection: "column", gap: "20px", marginTop: "16px"}}>
        <div style={{display: "flex", flexDirection: "column", gap: "4px"}}>
          <span style={{fontSize: "14px", fontWeight: "600"}}>☀ Sunrise</span>
          <span style={{fontSize: "14px", color: "var(--c-text-secondary)"}}>{formatTime(sunrise)}</span>
        </div>

        <div style={{display: "flex", flexDirection: "column", gap: "4px"}}>
          <span style={{fontSize: "14px", fontWeight: "600"}}>🌤 Golden Hour</span>
          <span style={{fontSize: "14px", color: "var(--c-text-secondary)"}}>{formatTime(goldenHourDate)}</span>
        </div>

        <div style={{display: "flex", flexDirection: "column", gap: "4px"}}>
          <span style={{fontSize: "14px", fontWeight: "600"}}>🌇 Sunset</span>
          <span style={{fontSize: "14px", color: "var(--c-text-secondary)"}}>{formatTime(sunset)}</span>
        </div>

        <div style={{display: "flex", flexDirection: "column", gap: "4px"}}>
          <span style={{fontSize: "14px", fontWeight: "600"}}>🌙 Moon Phase</span>
          <span style={{fontSize: "14px", color: "var(--c-text-secondary)"}}>{getMoonPhase()}</span>
        </div>

        <div style={{display: "flex", flexDirection: "column", gap: "4px"}}>
          <span style={{fontSize: "14px", fontWeight: "600"}}>🌙 Moonrise</span>
          <span style={{fontSize: "14px", color: "var(--c-text-secondary)"}}>{formatTime(moonriseDate)}</span>
        </div>
      </div>
    </div>
  )
}
