import React from "react"

export default function ActionCenter({ conditions, advisoryData }) {
  if (!conditions) return null

  const temp = conditions.temperature ?? 25
  const wind = conditions.wind_speed ?? 10
  const rain = conditions.precip_prob ?? 0
  const uv = conditions.uv_index ?? 3
  const aqi = conditions.aqi ?? 50
  
  const riskLevel = advisoryData?.risk_level || "Low"

  // Strict deterministic scoring engine
  const getActivityRec = (activity) => {
    let score = 10
    let reasons = []

    if (riskLevel === "Severe") {
      return { score: 1, reason: "Avoid due to severe weather risk." }
    }

    switch (activity) {
      case "Outdoor Activities":
        if (temp > 35) { score -= 4; reasons.push("High heat") }
        if (temp < 5) { score -= 3; reasons.push("Freezing temps") }
        if (rain > 40) { score -= 4; reasons.push("High rain chance") }
        if (rain > 70) { score -= 3; }
        if (aqi > 100) { score -= 3; reasons.push("Poor air quality") }
        if (uv > 7) { score -= 2; reasons.push("High UV") }
        break
      case "Driving & Travel":
        if (rain > 60) { score -= 5; reasons.push("Heavy rain/low visibility") }
        if (wind > 40) { score -= 4; reasons.push("Strong winds") }
        if (temp < 0) { score -= 3; reasons.push("Ice risk") }
        break
      case "Photography":
        if (rain > 30) { score -= 4; reasons.push("Equipment damage risk") }
        if (wind > 30) { score -= 2; reasons.push("Tripod instability") }
        if (conditions.cloud_cover > 30 && conditions.cloud_cover < 70 && score > 7) { 
          reasons.push("Great diffused lighting") 
        }
        break
      case "Agriculture":
        if (temp > 35 && rain < 10) { score -= 3; reasons.push("High heat, needs watering") }
        if (rain > 70) { score -= 3; reasons.push("Heavy rain, delay spraying") }
        if (wind > 20) { score -= 2; reasons.push("Too windy for spraying") }
        break
      case "Construction":
        if (rain > 40) { score -= 4; reasons.push("Rain hazard on site") }
        if (wind > 30) { score -= 5; reasons.push("Unsafe for scaffolding/cranes") }
        if (temp > 38) { score -= 3; reasons.push("Heat stress risk") }
        if (aqi > 150) { score -= 2; reasons.push("Unhealthy air for labor") }
        break
      default:
        break
    }

    score = Math.max(1, score)
    let finalReason = reasons.length > 0 ? reasons.join(", ") + "." : "Conditions are ideal."
    if (score >= 8 && reasons.length === 0) finalReason = "Optimal conditions."
    
    return { score, reason: finalReason }
  }

  const activities = [
    { name: "Outdoor Activities", icon: "🏃" },
    { name: "Driving & Travel", icon: "🚗" },
    { name: "Photography", icon: "📷" },
    { name: "Agriculture", icon: "🌾" },
    { name: "Construction", icon: "🏗" }
  ]

  return (
    <div className="action-center-wrap" style={{marginTop: "16px"}}>
      <h3 className="section-title" style={{marginBottom: "16px"}}>Activity Intelligence</h3>
      <div className="grid-2col">
        {activities.map(act => {
          const { score, reason } = getActivityRec(act.name)
          const color = score >= 8 ? "var(--c-success)" : score >= 5 ? "var(--c-warning)" : "var(--c-danger)"
          
          return (
            <div key={act.name} className="pred-card" style={{flexDirection: "row", alignItems: "center", gap: "16px", padding: "16px"}}>
              <div style={{
                width: "48px", height: "48px", borderRadius: "50%", 
                border: `3px solid ${color}`, display: "flex", 
                alignItems: "center", justifyContent: "center",
                fontSize: "18px", fontWeight: "700", color: color
              }}>
                {score}
              </div>
              <div style={{display: "flex", flexDirection: "column", flex: 1}}>
                <span style={{fontSize: "14px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px"}}>
                  {act.icon} {act.name}
                </span>
                <span style={{fontSize: "12px", color: "var(--c-text-secondary)", marginTop: "4px", lineHeight: "1.4"}}>
                  {reason}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
