import React from "react"

export default function RagTimeline({ retrievedChunks }) {
  if (!retrievedChunks || retrievedChunks.length === 0) return null

  return (
    <div className="card-base" style={{padding: "32px"}}>
      <h3 className="section-title" style={{marginBottom: "24px"}}>Prediction Evidence</h3>
      
      <div style={{display: "flex", flexDirection: "column", gap: "24px", position: "relative"}}>
        {/* Vertical line connecting nodes */}
        <div style={{position: "absolute", left: "11px", top: "24px", bottom: "24px", width: "2px", background: "var(--c-border)", zIndex: 0}} />

        <div style={{display: "flex", gap: "16px", position: "relative", zIndex: 1}}>
          <div style={{width: "24px", height: "24px", borderRadius: "50%", background: "var(--c-surface)", border: "2px solid var(--c-text-muted)", display: "flex", alignItems: "center", justifyContent: "center"}}>
            <div style={{width: "8px", height: "8px", borderRadius: "50%", background: "var(--c-text-muted)"}} />
          </div>
          <div style={{display: "flex", flexDirection: "column", flex: 1}}>
            <span style={{fontSize: "14px", fontWeight: "600"}}>Current Conditions Assessed</span>
            <span style={{fontSize: "12px", color: "var(--c-text-secondary)", marginTop: "4px"}}>System recorded active weather variables.</span>
          </div>
        </div>

        <div style={{display: "flex", gap: "16px", position: "relative", zIndex: 1}}>
          <div style={{width: "24px", height: "24px", borderRadius: "50%", background: "var(--c-surface)", border: "2px solid var(--c-primary)", display: "flex", alignItems: "center", justifyContent: "center"}}>
            <div style={{width: "8px", height: "8px", borderRadius: "50%", background: "var(--c-primary)"}} />
          </div>
          <div style={{display: "flex", flexDirection: "column", flex: 1}}>
            <span style={{fontSize: "14px", fontWeight: "600"}}>Historical Match Found</span>
            <span style={{fontSize: "12px", color: "var(--c-text-secondary)", marginTop: "4px"}}>
              Found {retrievedChunks.length} matching events in ChromaDB.
            </span>
          </div>
        </div>

        <div style={{display: "flex", gap: "16px", position: "relative", zIndex: 1}}>
          <div style={{width: "24px", height: "24px", borderRadius: "50%", background: "var(--c-surface)", border: "2px solid var(--c-accent)", display: "flex", alignItems: "center", justifyContent: "center"}}>
            <div style={{width: "8px", height: "8px", borderRadius: "50%", background: "var(--c-accent)"}} />
          </div>
          <div style={{display: "flex", flexDirection: "column", flex: 1}}>
            <span style={{fontSize: "14px", fontWeight: "600"}}>Retrieved Records</span>
            <div style={{display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px"}}>
              {retrievedChunks.map((chunk, idx) => (
                <div key={idx} style={{background: "rgba(255,255,255,0.03)", padding: "12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--c-border)"}}>
                  <span style={{fontSize: "11px", color: "var(--c-accent)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px"}}>{chunk.source}</span>
                  <p style={{fontSize: "12px", color: "var(--c-text-secondary)", marginTop: "4px", lineHeight: "1.5"}}>{chunk.excerpt || chunk.text.substring(0, 150) + "..."}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{display: "flex", gap: "16px", position: "relative", zIndex: 1}}>
          <div style={{width: "24px", height: "24px", borderRadius: "50%", background: "var(--c-surface)", border: "2px solid var(--c-success)", display: "flex", alignItems: "center", justifyContent: "center"}}>
            <div style={{width: "8px", height: "8px", borderRadius: "50%", background: "var(--c-success)"}} />
          </div>
          <div style={{display: "flex", flexDirection: "column", flex: 1}}>
            <span style={{fontSize: "14px", fontWeight: "600"}}>AI Analysis & Forecast Generation</span>
            <span style={{fontSize: "12px", color: "var(--c-text-secondary)", marginTop: "4px"}}>Llama 3 applied prediction logic to generate final narrative.</span>
          </div>
        </div>

      </div>
    </div>
  )
}
