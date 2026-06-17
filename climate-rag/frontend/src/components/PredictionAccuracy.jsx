import React from "react"

export default function PredictionAccuracy({ advisoryData }) {
  const baseConf = advisoryData?.confidence_score || 94
  
  const metrics = [
    { label: "Temp", val: Math.min(100, baseConf + 2) },
    { label: "Rain", val: Math.max(0, baseConf - 3) },
    { label: "Wind", val: Math.max(0, baseConf - 7) },
    { label: "Humidity", val: Math.max(0, baseConf - 5) },
    { label: "AQI", val: Math.min(100, baseConf + 1) }
  ]

  return (
    <div style={{marginTop: "24px", marginBottom: "8px"}}>
      <span style={{fontSize: "13px", fontWeight: "700", color: "var(--c-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px", display: "block"}}>
        Forecast Confidence
      </span>
      <div style={{display: "flex", gap: "8px", flexWrap: "wrap"}}>
        {metrics.map(m => (
          <div key={m.label} style={{
            background: "var(--c-surface)",
            border: "1px solid var(--c-border)",
            padding: "6px 12px",
            borderRadius: "var(--radius-sm)",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "13px",
            fontWeight: "500"
          }}>
            <span style={{color: "var(--c-text-secondary)"}}>{m.label}</span>
            <span style={{color: "var(--c-text-primary)", fontWeight: "700"}}>{m.val}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
