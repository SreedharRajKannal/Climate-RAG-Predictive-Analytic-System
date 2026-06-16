import React from "react"

export default function RagTimeline({ retrievedChunks }) {
  if (!retrievedChunks || retrievedChunks.length === 0) return null

  return (
    <div className="card-base" style={{padding: "24px"}}>
      <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px"}}>
        <div>
          <h3 className="section-title">How This Forecast Works</h3>
          <p style={{fontSize: "13px", color: "var(--c-text-secondary)", marginTop: "8px", maxWidth: "400px", lineHeight: "1.5"}}>
            <strong style={{color: "var(--c-text-primary)"}}>Forecast:</strong> Open-Meteo Weather Model<br/>
            <strong style={{color: "var(--c-text-primary)"}}>AI Advisory:</strong> Historical Climate Patterns + Current Conditions + Retrieval-Augmented Analysis
          </p>
        </div>
      </div>

      <h4 style={{fontSize: "12px", fontWeight: "700", color: "var(--c-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "16px"}}>
        RAG Evidence Retrieved
      </h4>

      <div style={{display: "flex", flexDirection: "column", gap: "16px"}}>
        {retrievedChunks.map((chunk, i) => (
          <div key={i} style={{
            padding: "16px",
            background: "var(--c-surface-hover)",
            borderRadius: "var(--radius-md)",
            borderLeft: "3px solid var(--c-primary)"
          }}>
            <div style={{fontSize: "12px", fontWeight: "700", color: "var(--c-primary)", marginBottom: "6px"}}>
              SOURCE: {chunk.source}
            </div>
            <div style={{fontSize: "13px", color: "var(--c-text-primary)", lineHeight: "1.6"}}>
              "{chunk.excerpt}"
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
