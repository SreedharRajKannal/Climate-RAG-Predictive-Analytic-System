import React from "react"

export default function PredictionAccuracy({ advisoryData }) {
  const baseConf = advisoryData?.confidence_score || 94
  
  const metrics = [
    { label: "Temp", val: Math.min(100, baseConf + 2) },
    { label: "Rain", val: Math.max(0, baseConf - 3) },
    { label: "Wind", val: Math.max(0, baseConf - 7) },
    { label: "Humidity", val: Math.max(0, baseConf - 5) }
  ]

  return (
    <div className="card-base" style={{padding: "16px", marginTop: "16px"}}>
      <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
        <span style={{fontSize: "14px", fontWeight: "700"}}>Forecast Confidence</span>
        <div style={{display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "flex-end"}}>
          {metrics.map(m => (
            <div key={m.label} style={{display: "flex", gap: "6px", alignItems: "center"}}>
              <span style={{fontSize: "12px", color: "var(--c-text-secondary)"}}>{m.label}</span>
              <span style={{fontSize: "13px", fontWeight: "600", fontFamily: "monospace"}}>{m.val}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
