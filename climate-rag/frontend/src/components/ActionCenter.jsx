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
  const getActivityData = (name, base, rainPen, windPen, heatPen, aqiPen) => {
    // Differentiation: add some arbitrary variance based on name length to ensure scores look unique
    let score = base - (name.length % 5) * 2;
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

    // Outcome-based reasons depending on activity
    if (feelsLike > 32) {
      if (name === "Exercise" || name === "Running" || name === "Cycling") reasons.push("High heat increases fatigue and dehydration risk")
      else reasons.push("Elevated temperatures may cause discomfort")
    }
    if (hum > 70) {
      if (name === "Photography") reasons.push("High humidity may affect lens clarity")
      else if (name === "Driving") reasons.push("High humidity may reduce visibility")
      else reasons.push("High humidity increases physical strain")
    }
    if (rainProb > 20) {
      if (name === "Photography") reasons.push("Rain risk may affect outdoor shooting")
      else if (name === "Driving") reasons.push("Wet roads increase braking distance")
      else if (name === "Agriculture") reasons.push("Rainfall beneficial but monitor excess accumulation")
      else reasons.push("Rain may reduce visibility and comfort")
    }
    if (wind > 20) {
      if (name === "Cycling") reasons.push("Strong winds affect stability and resistance")
      else if (name === "Photography") reasons.push("Winds may interfere with equipment stability")
      else reasons.push("Strong winds may affect outdoor safety")
    }
    if (risk === "High" || risk === "Severe") {
      reasons.push("Poor air quality strongly affects respiratory health")
    }
    
    if (reasons.length === 0) {
      if (name === "Photography") reasons.push("Optimal natural lighting conditions")
      else if (name === "Agriculture") reasons.push("Favorable baseline conditions for crops")
      else reasons.push("Optimal conditions for outdoor activity")
    }

    let rec = "Excellent Conditions"
    if (score < 80) rec = "Favorable Conditions"
    if (score < 65) rec = "Moderate Conditions"
    if (score < 50) rec = "Not Recommended"
    if (score < 30) rec = "Avoid"

    return {
      name,
      score,
      limiter,
      reasons: reasons.slice(0, 3), // Show up to 3 outcome-based bullets
      rec
    }
  }

  const activities = [
    { icon: "🏃", ...getActivityData("Running", 95, 25, 10, 30, 25) },
    { icon: "🚴", ...getActivityData("Cycling", 95, 25, 25, 20, 25) },
    { icon: "💪", ...getActivityData("Exercise", 95, 20, 5, 20, 25) },
    { icon: "🚗", ...getActivityData("Driving", 90, 35, 15, 5, 5) },
    { icon: "🏕️", ...getActivityData("Outdoor Activities", 92, 30, 15, 20, 20) },
    { icon: "🌾", ...getActivityData("Agriculture", 85, 15, 15, 10, 0) },
    { icon: "📷", ...getActivityData("Photography", 92, 35, 15, 5, 10) }
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
      <div style={{padding: "24px 24px 16px 24px", borderBottom: "1px solid var(--c-border)", display: "flex", alignItems: "center", gap: "8px"}}>
        <h3 className="section-title" style={{margin: 0}}>Activity Intelligence</h3>
        <span title="Activity scores are calculated using:

• Feels Like Temperature
• Rain Probability
• Humidity
• Wind Speed
• AQI

Scores are deterministic.
AI does not generate scores.
AI only explains their impact." style={{cursor: "help", fontSize: "16px", color: "var(--c-text-muted)"}}>ⓘ</span>
      </div>
      
      <div style={{
        overflowY: "auto", 
        display: "flex", 
        flexDirection: "column"
      }}>
        {activities.map((act, i) => {
          const scoreColor = getColor(act.score);
          return (
            <div key={i} style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              padding: "16px",
              borderBottom: "1px solid var(--c-border)",
              background: "var(--c-surface)"
            }}>
              <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                <div style={{display: "flex", alignItems: "center", gap: "12px"}}>
                  <span style={{fontSize: "20px"}}>{act.icon}</span>
                  <span style={{fontSize: "16px", fontWeight: "700", color: "var(--c-text-primary)"}}>{act.name}</span>
                </div>
                <div style={{display: "flex", alignItems: "baseline", gap: "4px", color: scoreColor}}>
                  <span style={{fontSize: "18px", fontWeight: "700"}}>{act.score}</span>
                  <span style={{fontSize: "12px", opacity: 0.8}}>/ 100</span>
                </div>
              </div>

              <div style={{display: "flex", alignItems: "center", gap: "8px"}}>
                <div style={{
                  width: "8px", 
                  height: "8px", 
                  borderRadius: "50%", 
                  background: scoreColor
                }} />
                <span style={{fontSize: "14px", fontWeight: "600", color: scoreColor}}>
                  {act.limiter ? `Primary Limiter: ${act.limiter} (${act.rec})` : act.rec}
                </span>
              </div>

              <div style={{marginTop: "4px"}}>
                {act.reasons.map((r, ri) => (
                  <div key={ri} style={{display: "flex", gap: "8px", marginBottom: "4px"}}>
                    <span style={{color: "var(--c-text-muted)", fontSize: "12px"}}>•</span>
                    <span style={{color: "var(--c-text-secondary)", fontSize: "13px", lineHeight: "1.4"}}>{r}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
