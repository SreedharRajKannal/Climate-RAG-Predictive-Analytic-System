import React from "react"

export default function ActionCenter({ conditions, advisoryData }) {
  if (!conditions) return null

  const temp = conditions.temperature || 25
  const feelsLike = conditions.feels_like || temp
  const rainProb = conditions.precip_prob || 0
  const wind = conditions.wind_speed || 0
  const hum = conditions.humidity || 50
  const risk = advisoryData?.risk_level || "Low"

  // Activity logic generator
  const getActivityData = (base, rainPen, windPen, heatPen, aqiPen) => {
    let score = base
    let limiter = null
    let worstPen = 0
    let reasons = []

    let rP = 0
    if (rainProb > 50) rP = rainPen
    else if (rainProb > 20) rP = rainPen * 0.5
    
    let wP = 0
    if (wind > 35) wP = windPen
    else if (wind > 20) wP = windPen * 0.5

    let hP = 0
    if (feelsLike > 38) hP = heatPen
    else if (feelsLike > 32) hP = heatPen * 0.5

    let aP = 0
    if (risk === "Severe") aP = aqiPen
    else if (risk === "High") aP = aqiPen * 0.5

    score = score - rP - wP - hP - aP
    score = Math.max(0, Math.min(100, Math.round(score)))

    if (rP > worstPen) { worstPen = rP; limiter = "Rain Risk" }
    if (wP > worstPen) { worstPen = wP; limiter = "High Winds" }
    if (hP > worstPen) { worstPen = hP; limiter = "Heat Stress" }
    if (aP > worstPen) { worstPen = aP; limiter = "Air Quality" }

    if (feelsLike > 32) reasons.push(`Feels like ${Math.round(feelsLike)}°C`)
    if (hum > 70) reasons.push(`Humidity ${Math.round(hum)}%`)
    if (rainProb > 20) reasons.push(`Rain probability ${Math.round(rainProb)}%`)
    if (wind > 20) reasons.push(`Winds at ${Math.round(wind)} km/h`)
    if (risk === "High" || risk === "Severe") reasons.push(`Elevated risk`)
    
    if (reasons.length === 0) {
      reasons.push("Favorable temperatures")
      reasons.push("Clear conditions")
    }

    let rec = "Excellent Conditions"
    if (score < 80) rec = "Favorable Conditions"
    if (score < 65) rec = "Moderate Conditions"
    if (score < 50) rec = "Not Recommended"
    if (score < 30) rec = "Avoid"

    return {
      score,
      limiter,
      reasons: reasons.slice(0, 2), // Keep extremely compact (2 reasons max)
      rec
    }
  }

  const activities = [
    { name: "Running", icon: "🏃", ...getActivityData(95, 25, 10, 30, 25) },
    { name: "Cycling", icon: "🚴", ...getActivityData(95, 25, 25, 20, 25) },
    { name: "Exercise", icon: "💪", ...getActivityData(95, 20, 5, 20, 25) },
    { name: "Construction", icon: "🏗", ...getActivityData(90, 35, 25, 15, 10) },
    { name: "Agriculture", icon: "🌾", ...getActivityData(85, 15, 15, 10, 0) },
    { name: "Photography", icon: "📷", ...getActivityData(92, 35, 15, 5, 10) }
  ]

  activities.sort((a, b) => b.score - a.score)

  const getColor = (s) => {
    if (s >= 80) return "var(--c-success)"
    if (s >= 50) return "var(--c-warning)"
    return "var(--c-danger)"
  }

  return (
    <div className="card-base" style={{
      display: "flex", 
      flexDirection: "column", 
      height: "100%", 
      maxHeight: "560px", // Strict bounding box to perfectly balance the right column
      overflow: "hidden" 
    }}>
      <div style={{padding: "24px 24px 16px 24px", borderBottom: "1px solid var(--c-border)"}}>
        <h3 className="section-title" style={{margin: 0}}>Activity Intelligence</h3>
      </div>
      
      <div style={{
        overflowY: "auto", 
        display: "flex", 
        flexDirection: "column"
      }}>
        {activities.map((act, index) => (
          <div key={act.name} style={{
            display: "grid", 
            gridTemplateColumns: "minmax(120px, 1.5fr) 60px 2fr", 
            alignItems: "center", 
            gap: "16px",
            padding: "16px 24px",
            borderBottom: index !== activities.length - 1 ? "1px solid var(--c-border)" : "none",
            borderLeft: `4px solid ${getColor(act.score)}`,
            background: "transparent",
            transition: "background 0.2s"
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-surface-hover)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            {/* Column 1: Icon + Name */}
            <div style={{display: "flex", alignItems: "center", gap: "10px"}}>
              <span style={{fontSize: "20px"}}>{act.icon}</span>
              <span style={{fontSize: "14px", fontWeight: "600", color: "var(--c-text-primary)"}}>{act.name}</span>
            </div>

            {/* Column 2: Score */}
            <div style={{fontSize: "20px", fontWeight: "800", color: getColor(act.score), textAlign: "left"}}>
              {act.score}
            </div>

            {/* Column 3: Recommendations & Reasons */}
            <div style={{display: "flex", flexDirection: "column", gap: "4px"}}>
              <div style={{fontSize: "13px", fontWeight: "700", color: getColor(act.score)}}>
                {act.rec}
              </div>
              <div style={{display: "flex", flexDirection: "column", gap: "2px"}}>
                {act.reasons.map((r, i) => (
                  <span key={i} style={{fontSize: "12px", color: "var(--c-text-secondary)", lineHeight: "1.4"}}>
                    • {r}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
