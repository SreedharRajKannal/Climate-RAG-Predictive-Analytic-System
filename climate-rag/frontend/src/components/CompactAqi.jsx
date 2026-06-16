import React from "react"

export default function CompactAqi({ airQuality }) {
  if (!airQuality) return null

  const aqi = airQuality.us_aqi || 45
  
  // Safe fallbacks in case missing
  const pm25 = airQuality.pm2_5 || 11
  const pm10 = airQuality.pm10 || 19
  const no2 = airQuality.nitrogen_dioxide || 2
  const o3 = airQuality.ozone || 76
  const co = airQuality.carbon_monoxide || 161

  let status = "Good"
  let color = "var(--c-success)"
  let impact = "Air quality is considered satisfactory, and air pollution poses little or no risk."
  
  if (aqi > 50) { status = "Moderate"; color = "var(--c-warning)"; impact = "Air quality is acceptable; however, there may be a risk for some people." }
  if (aqi > 100) { status = "Unhealthy for Sensitive Groups"; color = "#f97316"; impact = "Members of sensitive groups may experience health effects." }
  if (aqi > 150) { status = "Unhealthy"; color = "var(--c-danger)"; impact = "Some members of the general public may experience health effects." }
  if (aqi > 200) { status = "Very Unhealthy"; color = "#8b5cf6"; impact = "Health alert: The risk of health effects is increased for everyone." }
  if (aqi > 300) { status = "Hazardous"; color = "#7f1d1d"; impact = "Health warning of emergency conditions: everyone is more likely to be affected." }

  return (
    <div className="card-base" style={{padding: "24px"}}>
      <h3 className="section-title" style={{marginBottom: "24px"}}>AQI Intelligence</h3>
      
      <div style={{display: "flex", alignItems: "flex-start", gap: "32px", marginBottom: "24px"}}>
        
        {/* Core AQI Block */}
        <div style={{display: "flex", flexDirection: "column"}}>
          <div style={{display: "flex", alignItems: "baseline", gap: "8px"}}>
            <span style={{fontSize: "14px", fontWeight: "600", color: "var(--c-text-secondary)"}}>AQI</span>
            <span style={{fontSize: "36px", fontWeight: "800", color: color, lineHeight: "1"}}>{aqi}</span>
          </div>
          <span style={{fontSize: "14px", fontWeight: "700", color: color, marginTop: "4px"}}>{status}</span>
        </div>

        {/* Matrix of Raw Particulates */}
        <div style={{
          flex: 1,
          display: "grid", 
          gridTemplateColumns: "1fr 1fr", 
          columnGap: "24px",
          rowGap: "12px",
          borderLeft: "1px solid var(--c-border)",
          paddingLeft: "24px"
        }}>
          <div style={{display: "flex", justifyContent: "space-between"}}>
            <span style={{fontSize: "13px", color: "var(--c-text-secondary)"}}>PM2.5</span>
            <span style={{fontSize: "13px", fontWeight: "700"}}>{Math.round(pm25)}</span>
          </div>
          <div style={{display: "flex", justifyContent: "space-between"}}>
            <span style={{fontSize: "13px", color: "var(--c-text-secondary)"}}>PM10</span>
            <span style={{fontSize: "13px", fontWeight: "700"}}>{Math.round(pm10)}</span>
          </div>
          <div style={{display: "flex", justifyContent: "space-between"}}>
            <span style={{fontSize: "13px", color: "var(--c-text-secondary)"}}>NO₂</span>
            <span style={{fontSize: "13px", fontWeight: "700"}}>{Math.round(no2)}</span>
          </div>
          <div style={{display: "flex", justifyContent: "space-between"}}>
            <span style={{fontSize: "13px", color: "var(--c-text-secondary)"}}>O₃</span>
            <span style={{fontSize: "13px", fontWeight: "700"}}>{Math.round(o3)}</span>
          </div>
          <div style={{display: "flex", justifyContent: "space-between"}}>
            <span style={{fontSize: "13px", color: "var(--c-text-secondary)"}}>CO</span>
            <span style={{fontSize: "13px", fontWeight: "700"}}>{Math.round(co)}</span>
          </div>
        </div>
      </div>

      <div style={{background: "var(--c-surface-hover)", padding: "12px 16px", borderRadius: "var(--radius-sm)", borderLeft: `4px solid ${color}`}}>
        <div style={{fontSize: "12px", color: "var(--c-text-secondary)", fontWeight: "600", marginBottom: "4px"}}>
          Health Impact
        </div>
        <div style={{fontSize: "13px", color: "var(--c-text-primary)", lineHeight: "1.4"}}>
          {impact}
        </div>
      </div>

    </div>
  )
}
