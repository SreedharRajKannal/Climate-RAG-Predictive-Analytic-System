import React from "react"

const getAqiStatus = (aqi) => {
  if (aqi == null) return { text: "Unknown", color: "var(--c-text-muted)" }
  if (aqi <= 50) return { text: "Good", color: "var(--c-success)" }
  if (aqi <= 100) return { text: "Moderate", color: "var(--c-warning)" }
  return { text: "Unhealthy", color: "var(--c-danger)" }
}

export default function CompactAqi({ airQuality }) {
  if (!airQuality) return null

  const aqi = airQuality.european_aqi
  const status = getAqiStatus(aqi)

  return (
    <div className="card-base" style={{display: "flex", flexDirection: "column", gap: "16px"}}>
      <div className="section-header" style={{marginBottom: 0}}>
        <h3 className="section-title">Air Quality</h3>
      </div>
      
      <div style={{display: "flex", alignItems: "baseline", gap: "12px"}}>
        <span style={{fontSize: "32px", fontWeight: "800", lineHeight: 1}}>{aqi ?? "—"}</span>
        <span style={{fontSize: "14px", fontWeight: "600", color: status.color}}>{status.text}</span>
      </div>

      <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "8px"}}>
        <div style={{display: "flex", justifyContent: "space-between", fontSize: "12px"}}>
          <span style={{color: "var(--c-text-secondary)"}}>PM2.5</span>
          <span style={{fontWeight: "600"}}>{airQuality.pm2_5 ?? "—"}</span>
        </div>
        <div style={{display: "flex", justifyContent: "space-between", fontSize: "12px"}}>
          <span style={{color: "var(--c-text-secondary)"}}>PM10</span>
          <span style={{fontWeight: "600"}}>{airQuality.pm10 ?? "—"}</span>
        </div>
        <div style={{display: "flex", justifyContent: "space-between", fontSize: "12px"}}>
          <span style={{color: "var(--c-text-secondary)"}}>CO</span>
          <span style={{fontWeight: "600"}}>{airQuality.co ?? "—"}</span>
        </div>
        <div style={{display: "flex", justifyContent: "space-between", fontSize: "12px"}}>
          <span style={{color: "var(--c-text-secondary)"}}>NO₂</span>
          <span style={{fontWeight: "600"}}>{airQuality.no2 ?? "—"}</span>
        </div>
      </div>

      <div style={{fontSize: "12px", color: "var(--c-success)", fontWeight: "600", marginTop: "4px"}}>
        ↑ Improving Trend
      </div>
    </div>
  )
}
