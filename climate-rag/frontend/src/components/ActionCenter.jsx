import React from "react"

export default function ActionCenter({ conditions, advisoryData }) {
  if (!conditions) return null

  const temp = conditions.temperature ?? 25
  const wind = conditions.wind_speed ?? 10
  const rain = conditions.precip_prob ?? 0
  const uv = conditions.uv_index ?? 3
  const aqi = conditions.aqi ?? 50
  
  // Use risk level from AI Advisory if available to influence actions
  const riskLevel = advisoryData?.risk_level || "Low"

  // Base logic for scores
  const getActivityRec = (activity) => {
    let score = 10
    let reason = "Conditions are ideal."

    if (riskLevel === "Severe") {
      return { score: 1, reason: "Avoid due to severe weather risk." }
    }

    switch (activity) {
      case "Outdoor Activities":
        if (temp > 35) { score -= 4; reason = "Too hot for prolonged activity." }
        if (rain > 40) { score -= 4; reason = "High chance of rain." }
        if (aqi > 100) { score -= 3; reason = "Poor air quality." }
        break
      case "Driving & Travel":
        if (rain > 60) { score -= 5; reason = "Heavy rain affects visibility and roads." }
        if (wind > 50) { score -= 4; reason = "Strong winds may be hazardous." }
        break
      case "Photography":
        if (rain > 30) { score -= 3; reason = "Risk of equipment damage." }
        if (conditions.cloud_cover > 30 && conditions.cloud_cover < 70) { 
          reason = "Great diffused lighting conditions." 
        }
        break
      case "Agriculture":
        if (temp > 35 && rain < 10) { score -= 3; reason = "High heat, increased watering needed." }
        if (rain > 80) { score -= 2; reason = "Heavy rainfall expected, delay spraying." }
        break
      case "Construction":
        if (wind > 40) { score -= 5; reason = "Unsafe wind speeds for scaffolding." }
        if (temp > 38) { score -= 3; reason = "Heat stress risk for workers." }
        break
      default:
        break
    }

    score = Math.max(1, score)
    if (score >= 8 && reason === "Conditions are ideal.") reason = "Optimal conditions."
    return { score, reason }
  }

  const activities = [
    { name: "Outdoor Activities", icon: "🏃" },
    { name: "Driving & Travel", icon: "🚗" },
    { name: "Photography", icon: "📷" },
    { name: "Agriculture", icon: "🌾" },
    { name: "Construction", icon: "🏗" }
  ]

  return (
    <div className="action-center-wrap" style={{marginTop: "8px"}}>
      <h3 className="section-title" style={{marginBottom: "16px"}}>Recommended Actions</h3>
      <div className="grid-2col">
        {activities.map(act => {
          const { score, reason } = getActivityRec(act.name)
          const color = score >= 8 ? "var(--c-success)" : score >= 5 ? "var(--c-warning)" : "var(--c-danger)"
          
          return (
            <div key={act.name} className="pred-card" style={{flexDirection: "row", alignItems: "center", gap: "16px"}}>
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
                <span style={{fontSize: "12px", color: "var(--c-text-secondary)", marginTop: "4px"}}>
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
