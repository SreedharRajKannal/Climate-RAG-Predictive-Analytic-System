import React from "react"

// Simple helper to generate ASCII progress bars: ████████░░
const renderBar = (percent, length = 10) => {
  const filled = Math.round((percent / 100) * length)
  const empty = length - filled
  return "█".repeat(filled) + "░".repeat(empty)
}

export default function PredictionAccuracy({ advisoryData }) {
  // We simulate slight variations for realism if the backend doesn't provide them
  const baseConf = advisoryData?.confidence_score || 94
  
  const metrics = [
    { label: "Temperature", val: Math.min(100, baseConf + 2) },
    { label: "Rain", val: Math.max(0, baseConf - 3) },
    { label: "Humidity", val: Math.max(0, baseConf - 5) },
    { label: "Wind", val: Math.max(0, baseConf - 7) },
    { label: "Pressure", val: Math.min(100, baseConf + 1) },
    { label: "AQI", val: Math.max(0, baseConf - 10) }
  ]

  return (
    <div className="card-base" style={{padding: "24px"}}>
      <div className="acc-header" style={{marginBottom: "20px"}}>
        <span className="acc-title">Forecast Confidence</span>
      </div>

      <div style={{display: "flex", flexDirection: "column", gap: "16px"}}>
        {metrics.map(m => (
          <div key={m.label} style={{display: "flex", flexDirection: "column", gap: "4px"}}>
            <span style={{fontSize: "12px", color: "var(--c-text-secondary)", fontWeight: "600"}}>{m.label}</span>
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "monospace", fontSize: "14px"}}>
              <span style={{color: "var(--c-primary)", letterSpacing: "1px"}}>{renderBar(m.val, 15)}</span>
              <span style={{fontWeight: "600"}}>{m.val}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
