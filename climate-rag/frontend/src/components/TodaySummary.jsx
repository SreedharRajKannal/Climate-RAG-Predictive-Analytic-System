import React from "react"

export default function TodaySummary({ conditions, dailyData, hourlyData }) {
  if (!conditions || !dailyData || dailyData.length === 0 || !hourlyData || hourlyData.length === 0) return null

  const today = dailyData[0]
  const high = today.temp_max != null ? Math.round(today.temp_max) : "—"
  const low = today.temp_min != null ? Math.round(today.temp_min) : "—"
  
  // Max rain prob across today's hourly
  const todayHourly = hourlyData.slice(0, 24)
  const peakRain = todayHourly.reduce((max, h) => Math.max(max, h.precip_prob || 0), 0)
  const peakUv = todayHourly.reduce((max, h) => Math.max(max, h.uv_index || 0), 0)

  // Find Best and Worst windows
  // A window is ~3 hours
  let bestWindow = null
  let worstWindow = null
  let bestScore = -9999
  let worstScore = 9999

  for (let i = 0; i <= todayHourly.length - 3; i++) {
    const chunk = todayHourly.slice(i, i + 3)
    const avgTemp = chunk.reduce((s, h) => s + (h.temperature || 0), 0) / 3
    const avgRain = chunk.reduce((s, h) => s + (h.precip_prob || 0), 0) / 3
    const avgUv = chunk.reduce((s, h) => s + (h.uv_index || 0), 0) / 3
    const isDaylight = chunk.some(h => h.is_day === 1)

    // Rough score: 
    // Negative impacts: rain (-2 per %), extreme temp distance from 22C (-1 per degree), high UV (-5 per UV)
    // Positive impacts: daylight (+10)
    let tempDiff = Math.abs(avgTemp - 22)
    let score = - (avgRain * 2) - (tempDiff * 3) - (avgUv * 5)
    if (isDaylight) score += 20

    if (score < worstScore) {
      worstScore = score
      worstWindow = { start: i, end: i + 3, avgRain, avgTemp, avgUv, isDaylight }
    }
  }

  // Find Peak Feels Like
  const peakFeelsLike = todayHourly.reduce((max, h) => Math.max(max, h.apparent_temperature || h.temperature || 0), 0)
  
  // Find Strongest Wind
  const strongestWind = todayHourly.reduce((max, h) => Math.max(max, h.wind_speed || 0), 0)

  // Find Wettest Hour
  let wettestHourObj = todayHourly[0]
  for (let h of todayHourly) {
    if ((h.precip_prob || 0) > (wettestHourObj.precip_prob || 0)) {
      wettestHourObj = h
    }
  }
  const wettestHourDate = new Date(wettestHourObj.time)
  const wettestHourStr = wettestHourDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

  const formatHour = (offset) => {
    const d = new Date()
    d.setHours(d.getHours() + offset)
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }

  const formatWindowStr = (win) => {
    if (!win) return "N/A"
    return `${formatHour(win.start)} – ${formatHour(win.end)}`
  }



  const getWorstReason = (win) => {
    if (!win) return "Data unavailable."
    if (win.avgRain > 50) return "Peak rain probability."
    if (win.avgUv > 6) return "Highest heat stress and UV exposure."
    if (win.avgTemp > 35) return "Extreme heat conditions."
    return "Least favorable weather window today."
  }

  return (
    <div className="card-base" style={{padding: "24px", display: "flex", flexDirection: "column", height: "100%"}}>
      <h3 className="section-title" style={{marginBottom: "24px"}}>Today's Summary</h3>
      
      <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px"}}>
        <div style={{display: "flex", flexDirection: "column"}}>
          <span style={{fontSize: "13px", color: "var(--c-text-secondary)", fontWeight: "600"}}>Feels Like Peak</span>
          <span style={{fontSize: "20px", fontWeight: "700", color: "var(--c-text-primary)"}}>{Math.round(peakFeelsLike)}°C</span>
        </div>
        <div style={{display: "flex", flexDirection: "column"}}>
          <span style={{fontSize: "13px", color: "var(--c-text-secondary)", fontWeight: "600"}}>Strongest Wind</span>
          <span style={{fontSize: "20px", fontWeight: "700", color: "var(--c-text-primary)"}}>{Math.round(strongestWind)} km/h</span>
        </div>
        <div style={{display: "flex", flexDirection: "column"}}>
          <span style={{fontSize: "13px", color: "var(--c-text-secondary)", fontWeight: "600"}}>Wettest Hour</span>
          <span style={{fontSize: "20px", fontWeight: "700", color: "var(--c-text-primary)"}}>{(wettestHourObj.precip_prob || 0) > 0 ? wettestHourStr : "None"}</span>
        </div>
        <div style={{display: "flex", flexDirection: "column"}}>
          <span style={{fontSize: "13px", color: "var(--c-text-secondary)", fontWeight: "600"}}>Rain Chance</span>
          <span style={{fontSize: "20px", fontWeight: "700", color: "var(--c-text-primary)"}}>{Math.round(peakRain)}%</span>
        </div>
      </div>

      <div style={{flex: 1, display: "flex", flexDirection: "column", gap: "16px"}}>

        <div style={{background: "var(--c-surface-hover)", padding: "16px", borderRadius: "var(--radius-sm)", borderLeft: "4px solid var(--c-danger)"}}>
          <div style={{fontSize: "14px", fontWeight: "700", color: "var(--c-text-primary)", marginBottom: "4px"}}>
            Worst Weather Window
          </div>
          <div style={{fontSize: "16px", fontWeight: "600", color: "var(--c-danger)", marginBottom: "8px"}}>
            {formatWindowStr(worstWindow)}
          </div>
          <div style={{fontSize: "12px", color: "var(--c-text-secondary)"}}>
            <strong style={{color: "var(--c-text-primary)"}}>Reason:</strong> {getWorstReason(worstWindow)}
          </div>
        </div>
      </div>
    </div>
  )
}
