import React from "react"

const ACTIVITIES = [
  { id: "running", label: "Running", icon: "🏃" },
  { id: "cycling", label: "Cycling", icon: "🚴" },
  { id: "beach", label: "Beach", icon: "🏖" },
  { id: "photography", label: "Photography", icon: "📷" },
  { id: "travel", label: "Travel", icon: "✈️" },
]

function calcScore(activity, conditions) {
  if (!conditions) return 5
  const temp = conditions.temperature ?? 25
  const rain = conditions.precip_prob ?? 0
  const wind = conditions.wind_speed ?? 10
  const uv = conditions.uv_index ?? 3
  const aqi = conditions.aqi ?? 50
  const cloud = conditions.cloud_cover ?? 50

  let score = 10

  switch (activity) {
    case "running":
      if (temp > 38) score -= 4; else if (temp > 32) score -= 2; else if (temp < 5) score -= 2
      if (rain > 60) score -= 3; else if (rain > 30) score -= 1
      if (wind > 40) score -= 2; else if (wind > 25) score -= 1
      if (aqi > 100) score -= 3; else if (aqi > 75) score -= 1
      if (uv > 8) score -= 1
      break
    case "cycling":
      if (temp > 36) score -= 3; else if (temp < 5) score -= 2
      if (rain > 50) score -= 3; else if (rain > 20) score -= 1
      if (wind > 35) score -= 3; else if (wind > 20) score -= 1
      if (aqi > 100) score -= 2
      break
    case "beach":
      if (temp < 22) score -= 4; else if (temp > 38) score -= 2
      if (rain > 40) score -= 4; else if (rain > 20) score -= 2
      if (wind > 30) score -= 2
      if (uv > 10) score -= 2; else if (uv > 7) score -= 1
      if (cloud > 80) score -= 1
      break
    case "photography":
      // Golden hour, cloudy = softer light = better
      if (rain > 50) score -= 3; else if (rain > 20) score -= 1
      if (wind > 40) score -= 1
      if (cloud > 30 && cloud < 70) score += 0 // diffused light is good
      if (uv > 9) score -= 1 // harsh light
      break
    case "travel":
      if (rain > 60) score -= 2; else if (rain > 30) score -= 1
      if (wind > 50) score -= 2
      if (temp > 40) score -= 2; else if (temp < 0) score -= 2
      // Visibility
      const vis = conditions.visibility ?? 10000
      if (vis < 1000) score -= 3; else if (vis < 5000) score -= 1
      break
    default:
      break
  }

  return Math.max(1, Math.min(10, Math.round(score)))
}

function ScoreRing({ score }) {
  const r = 18
  const circ = 2 * Math.PI * r
  const pct = score / 10
  const offset = circ * (1 - pct)
  const color = score >= 8 ? "#10B981" : score >= 5 ? "#F59E0B" : "#EF4444"

  return (
    <div className="score-ring-wrap">
      <svg width="48" height="48" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={r} fill="none" stroke="#1e293b" strokeWidth="3" />
        <circle cx="24" cy="24" r={r} fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          transform="rotate(-90 24 24)" style={{transition: "stroke-dashoffset 0.6s ease"}} />
      </svg>
      <span className="score-ring-value" style={{color}}>{score}</span>
    </div>
  )
}

export default function ActivityCard({ conditions }) {
  return (
    <div className="activity-card">
      <div className="section-header">
        <h3 className="section-title">Activity Scores</h3>
      </div>
      <div className="activity-grid">
        {ACTIVITIES.map(a => {
          const score = calcScore(a.id, conditions)
          return (
            <div key={a.id} className="activity-item">
              <ScoreRing score={score} />
              <div className="activity-info">
                <span className="activity-icon">{a.icon}</span>
                <span className="activity-label">{a.label}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
