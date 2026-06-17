import React from "react"

export default function AiPredictionTimeline({ forecast }) {
  if (!forecast || forecast.length === 0) return null

  const now = new Date()
  const futureForecast = forecast.filter(f => new Date(f.time) >= now && f.temperature != null && f.temperature < 100 && f.temperature > -100)

  if (futureForecast.length < 12) return null

  // Function to generate an intelligence string based on a future hour vs current hour
  const getInsight = (current, future) => {
    if (!current || !future) return "Stable Conditions"
    
    const tempDelta = future.temperature - current.temperature
    const rainDelta = future.precip_prob - current.precip_prob
    const humDelta = future.humidity - current.humidity

    if (rainDelta > 30) return "Rain Probability Rising Sharply"
    if (rainDelta > 10) return "Slight Rain Risk Emerging"
    if (tempDelta > 3) return "Temperature Increasing Considerably"
    if (tempDelta < -3) return "Significant Cooling Trend"
    if (humDelta > 15) return "Humidity Increasing"
    if (humDelta < -15) return "Air Becoming Drier"
    if (future.wind_speed > 25 && future.wind_speed > current.wind_speed) return "Winds Picking Up"
    
    return "Conditions Stabilizing"
  }

  const current = futureForecast[0]
  
  // Extract specific future intervals
  const intervals = [
    { label: "Now", data: current, text: "Current Conditions" },
    { label: "+3h", data: futureForecast[3], text: getInsight(current, futureForecast[3]) },
    { label: "+6h", data: futureForecast[6], text: getInsight(futureForecast[3], futureForecast[6]) },
    { label: "+9h", data: futureForecast[9], text: getInsight(futureForecast[6], futureForecast[9]) },
    { label: "+12h", data: futureForecast[12], text: getInsight(futureForecast[9], futureForecast[12]) }
  ]

  return (
    <div className="card-base" style={{padding: "24px"}}>
      <h3 className="section-title" style={{marginBottom: "24px"}}>Weather Intelligence Timeline</h3>
      
      <div style={{display: "flex", flexDirection: "column", gap: "0", position: "relative"}}>
        {intervals.map((node, idx) => (
          <div key={idx} style={{display: "flex", gap: "16px", position: "relative", zIndex: 1, paddingBottom: idx === intervals.length - 1 ? 0 : "24px"}}>
            
            {/* The vertical line segments */}
            {idx !== intervals.length - 1 && (
              <div style={{position: "absolute", left: "4px", top: "20px", bottom: "0", width: "1px", background: "var(--c-border)", zIndex: 0}} />
            )}

            {/* The node dot */}
            <div style={{width: "9px", height: "9px", borderRadius: "50%", background: "var(--c-primary)", display: "flex", alignItems: "center", justifyContent: "center", marginTop: "4px", position: "relative", zIndex: 2}} />
            
            <div style={{display: "flex", flexDirection: "column", flex: 1, marginTop: "-2px"}}>
              <span style={{fontSize: "14px", fontWeight: "700", color: "var(--c-text-primary)"}}>{node.label}</span>
              <span style={{fontSize: "13px", color: "var(--c-text-secondary)", marginTop: "4px"}}>{node.text}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
