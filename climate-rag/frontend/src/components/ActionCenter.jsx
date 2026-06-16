import React from "react"

export default function ActionCenter({ conditions, advisoryData }) {
  if (!conditions) return null

  // Baseline data
  const temp = conditions.temperature || 25
  const rainProb = conditions.precip_prob || 0
  const wind = conditions.wind_speed || 0
  // Approximate AQI via visibility or risk level if actual AQI isn't passed here, 
  // but we can look at advisoryData risk level as a proxy for severe conditions
  const risk = advisoryData?.risk_level || "Low"
  
  // High heat penalizes everything slightly, but rain and wind penalize specific things heavily.
  // Severe risk drops running/cycling/exercise heavily.

  const calcScore = (base, rainPenalty, windPenalty, heatPenalty, aqiPenalty) => {
    let score = base
    if (rainProb > 20) score -= (rainProb / 20) * rainPenalty
    if (wind > 20) score -= (wind / 10) * windPenalty
    if (temp > 35) score -= heatPenalty
    if (risk === "High" || risk === "Severe") score -= aqiPenalty
    return Math.max(0, Math.min(100, Math.round(score)))
  }

  // Exact Requested Activities
  const activities = [
    { name: "Running", icon: "🏃", score: calcScore(95, 30, 5, 25, 40) },
    { name: "Cycling", icon: "🚴", score: calcScore(95, 30, 25, 20, 40) },
    { name: "Exercise", icon: "💪", score: calcScore(95, 25, 5, 20, 40) },
    { name: "Construction", icon: "🏗", score: calcScore(90, 40, 30, 15, 10) },
    { name: "Agriculture", icon: "🌾", score: calcScore(85, 20, 10, 10, 0) },
    { name: "Photography", icon: "📷", score: calcScore(92, 40, 15, 5, 10) },
    { name: "Outdoor Activities", icon: "⛺", score: calcScore(95, 35, 10, 20, 20) }
  ]

  // Sort by score descending
  activities.sort((a, b) => b.score - a.score)

  const getColor = (s) => {
    if (s >= 80) return "var(--c-success)"
    if (s >= 50) return "var(--c-warning)"
    return "var(--c-danger)"
  }

  return (
    <div className="card-base" style={{padding: "24px"}}>
      <h3 className="section-title" style={{marginBottom: "24px"}}>Activity Intelligence</h3>
      <div style={{
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", 
        gap: "16px"
      }}>
        {activities.map(act => (
          <div key={act.name} style={{
            display: "flex", 
            flexDirection: "column",
            alignItems: "flex-start", 
            background: "var(--c-surface-hover)",
            padding: "16px",
            borderRadius: "var(--radius-sm)",
            borderTop: `4px solid ${getColor(act.score)}`,
            border: "1px solid var(--c-border)",
            borderTopWidth: "4px"
          }}>
            <div style={{display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px"}}>
              <span style={{fontSize: "24px"}}>{act.icon}</span>
              <span style={{fontSize: "13px", fontWeight: "600", color: "var(--c-text-primary)", lineHeight: "1.2"}}>{act.name}</span>
            </div>
            <div style={{fontSize: "24px", fontWeight: "800", color: getColor(act.score)}}>
              {act.score}<span style={{fontSize: "12px", color: "var(--c-text-secondary)", fontWeight: "500"}}>/100</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
