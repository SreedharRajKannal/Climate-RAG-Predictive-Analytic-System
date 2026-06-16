import React from "react"

export default function CompactAqi({ airQuality }) {
  if (!airQuality) return null
  
  const aqi = airQuality.aqi || 45
  const pm25 = airQuality.pm2_5 || 12
  const pm10 = airQuality.pm10 || 20
  const no2 = airQuality.no2 || 15
  const co = airQuality.co || 200
  const o3 = airQuality.o3 || 45

  let category = "Good"
  let color = "var(--c-success)"
  let impact = "Air quality is satisfactory. No health risk."
  
  if (aqi > 50) { category = "Moderate"; color = "var(--c-warning)"; impact = "Unusually sensitive people should consider reducing prolonged outdoor exertion." }
  if (aqi > 100) { category = "Unhealthy"; color = "var(--c-danger)"; impact = "Everyone may begin to experience health effects. Sensitive groups should avoid outdoors." }
  if (aqi > 200) { category = "Hazardous"; color = "var(--c-danger)"; impact = "Health warnings of emergency conditions. The entire population is likely to be affected." }

  return (
    <div className="card-base" style={{padding: "24px"}}>
      <h3 className="section-title" style={{marginBottom: "24px"}}>Air Quality Intelligence</h3>
      
      <div style={{display: "flex", alignItems: "center", gap: "24px", marginBottom: "24px"}}>
        <div style={{
          fontSize: "48px", 
          fontWeight: "800", 
          color: color,
          lineHeight: "1"
        }}>
          {Math.round(aqi)}
        </div>
        <div>
          <div style={{fontSize: "20px", fontWeight: "700", color: "var(--c-text-primary)"}}>{category}</div>
          <div style={{fontSize: "13px", color: "var(--c-text-secondary)", marginTop: "4px", lineHeight: "1.4"}}>{impact}</div>
        </div>
      </div>

      <div style={{
        display: "grid", 
        gridTemplateColumns: "repeat(5, 1fr)", 
        gap: "8px", 
        background: "var(--c-surface-hover)", 
        padding: "16px", 
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--c-border)"
      }}>
        <div style={{display: "flex", flexDirection: "column", gap: "4px"}}>
          <span style={{fontSize: "11px", color: "var(--c-text-secondary)", fontWeight: "600"}}>PM2.5</span>
          <span style={{fontSize: "14px", fontWeight: "700"}}>{Math.round(pm25)}</span>
        </div>
        <div style={{display: "flex", flexDirection: "column", gap: "4px"}}>
          <span style={{fontSize: "11px", color: "var(--c-text-secondary)", fontWeight: "600"}}>PM10</span>
          <span style={{fontSize: "14px", fontWeight: "700"}}>{Math.round(pm10)}</span>
        </div>
        <div style={{display: "flex", flexDirection: "column", gap: "4px"}}>
          <span style={{fontSize: "11px", color: "var(--c-text-secondary)", fontWeight: "600"}}>NO₂</span>
          <span style={{fontSize: "14px", fontWeight: "700"}}>{Math.round(no2)}</span>
        </div>
        <div style={{display: "flex", flexDirection: "column", gap: "4px"}}>
          <span style={{fontSize: "11px", color: "var(--c-text-secondary)", fontWeight: "600"}}>O₃</span>
          <span style={{fontSize: "14px", fontWeight: "700"}}>{Math.round(o3)}</span>
        </div>
        <div style={{display: "flex", flexDirection: "column", gap: "4px"}}>
          <span style={{fontSize: "11px", color: "var(--c-text-secondary)", fontWeight: "600"}}>CO</span>
          <span style={{fontSize: "14px", fontWeight: "700"}}>{Math.round(co)}</span>
        </div>
      </div>
    </div>
  )
}
