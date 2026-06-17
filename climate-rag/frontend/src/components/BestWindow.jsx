import React from "react"

export default function BestWindow({ hourlyData }) {
  if (!hourlyData || hourlyData.length === 0) return null

  // A window is ~3 hours
  const todayHourly = hourlyData.slice(0, 24)
  let bestWindow = null
  let bestScore = -9999

  for (let i = 0; i <= todayHourly.length - 3; i++) {
    const chunk = todayHourly.slice(i, i + 3)
    const avgTemp = chunk.reduce((s, h) => s + (h.temperature || 0), 0) / 3
    const avgRain = chunk.reduce((s, h) => s + (h.precip_prob || 0), 0) / 3
    const avgUv = chunk.reduce((s, h) => s + (h.uv_index || 0), 0) / 3
    const isDaylight = chunk.some(h => h.is_day === 1)

    // Rough score: 
    let tempDiff = Math.abs(avgTemp - 22)
    let score = - (avgRain * 2) - (tempDiff * 3) - (avgUv * 5)
    if (isDaylight) score += 20

    if (score > bestScore) {
      bestScore = score
      bestWindow = { start: i, end: i + 3, avgRain, avgTemp, avgUv, isDaylight }
    }
  }

  const formatHour = (offset) => {
    const d = new Date()
    d.setHours(d.getHours() + offset)
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }

  const formatWindowStr = (win) => {
    if (!win) return "N/A"
    return `${formatHour(win.start)} – ${formatHour(win.end)}`
  }

  const getBestReason = (win) => {
    if (!win) return "Data unavailable."
    if (win.avgRain === 0) return "Zero rain risk and comfortable temperatures."
    if (win.avgRain < 20) return "Lowest rain risk and manageable conditions."
    return "Most optimal available timeframe today."
  }

  if (!bestWindow) return null

  return (
    <div className="card-base" style={{padding: "24px", marginTop: "24px"}}>
      <h3 className="section-title" style={{marginBottom: "16px"}}>Optimal Outdoor Window</h3>
      <div style={{background: "var(--c-surface-hover)", padding: "16px", borderRadius: "var(--radius-sm)", borderLeft: "4px solid var(--c-success)"}}>
        <div style={{fontSize: "16px", fontWeight: "600", color: "var(--c-success)", marginBottom: "8px"}}>
          {formatWindowStr(bestWindow)}
        </div>
        <div style={{fontSize: "13px", color: "var(--c-text-secondary)"}}>
          <strong style={{color: "var(--c-text-primary)"}}>Reason:</strong> {getBestReason(bestWindow)}
        </div>
      </div>
    </div>
  )
}
