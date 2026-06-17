import React from "react"

export default function AiCommandCenter({ advisoryData }) {
  if (!advisoryData) {
    return (
      <div className="ai-hero">
        <div className="ai-narrative" style={{opacity: 0.5}}>Initializing Intelligence...</div>
      </div>
    )
  }

  const {
    summary,
    peak_window,
    intensity,
    risk_level,
    confidence_score,
    potential_impact
  } = advisoryData

  return (
    <div className="ai-hero">
      <div className="ai-hero-header">
        <span className="ai-badge">✦ AI Weather Advisory</span>
        <span className={`risk-badge risk-${risk_level}`}>Risk Level: {risk_level}</span>
      </div>

      <h2 className="ai-narrative">{summary}</h2>

      <div className="ai-grid">
        <div className="ai-metric">
          <span className="ai-metric-lbl">Peak Window</span>
          <span className="ai-metric-val">{peak_window}</span>
        </div>
        <div className="ai-metric">
          <span className="ai-metric-lbl">Expected Intensity</span>
          <span className="ai-metric-val">{intensity}</span>
        </div>
        <div className="ai-metric">
          <span className="ai-metric-lbl">Confidence</span>
          <span className="ai-metric-val">{confidence_score}%</span>
        </div>
        <div className="ai-metric">
          <span className="ai-metric-lbl">Potential Impact</span>
          <span className="ai-metric-val" style={{color: "var(--c-warning)"}}>{potential_impact}</span>
        </div>
      </div>
    </div>
  )
}
