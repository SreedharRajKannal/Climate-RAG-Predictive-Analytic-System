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
    potential_impact,
    reasoning_bullets = []
  } = advisoryData

  return (
    <div className="ai-hero">
      <div className="ai-hero-header">
        <span className="ai-badge">✦ AI Weather Advisory</span>
        <span className={`risk-badge risk-${risk_level}`}>Risk Level: {risk_level}</span>
      </div>

      <h2 className="ai-narrative">{summary}</h2>

      {reasoning_bullets.length > 0 && (
        <div style={{marginTop: "16px", marginBottom: "24px", background: "var(--c-surface-hover)", padding: "16px", borderRadius: "var(--radius-md)", borderLeft: "4px solid var(--c-primary)"}}>
          <div style={{fontSize: "13px", fontWeight: "700", color: "var(--c-text-primary)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em"}}>Why this advisory?</div>
          <div style={{display: "flex", flexDirection: "column", gap: "6px"}}>
            {reasoning_bullets.map((bullet, idx) => (
              <span key={idx} style={{fontSize: "14px", color: "var(--c-text-secondary)", lineHeight: "1.4"}}>• {bullet}</span>
            ))}
          </div>
        </div>
      )}

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
