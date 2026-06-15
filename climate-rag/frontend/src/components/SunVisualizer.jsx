import React from "react"

export default function SunVisualizer({ sunrise, sunset }) {
  if (!sunrise || !sunset) return null

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Calculate percentage of day elapsed
  const now = new Date()
  const sRise = new Date(sunrise)
  const sSet = new Date(sunset)
  
  let percent = 0
  if (now > sRise && now < sSet) {
    const total = sSet - sRise
    const elapsed = now - sRise
    percent = (elapsed / total) * 100
  } else if (now >= sSet) {
    percent = 100
  }

  return (
    <div className="card-base" style={{padding: "24px"}}>
      <h3 className="section-title" style={{marginBottom: "24px"}}>Sun Cycle</h3>
      
      <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", fontSize: "14px", fontWeight: "600"}}>
        <span>{formatTime(sunrise)}</span>
        <span>{formatTime(sunset)}</span>
      </div>

      <div style={{position: "relative", height: "4px", background: "var(--c-border)", borderRadius: "2px", margin: "16px 0"}}>
        {/* Progress Fill */}
        <div style={{
          position: "absolute",
          left: 0,
          top: 0,
          height: "100%",
          width: `${percent}%`,
          background: "linear-gradient(90deg, var(--c-warning), var(--c-primary))",
          borderRadius: "2px"
        }} />
        
        {/* Current Position Dot */}
        {percent > 0 && percent < 100 && (
          <div style={{
            position: "absolute",
            left: `calc(${percent}% - 6px)`,
            top: "-4px",
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            background: "var(--c-surface)",
            border: "2px solid var(--c-primary)",
            boxShadow: "0 0 8px rgba(0,0,0,0.2)"
          }} />
        )}
      </div>

      {percent > 0 && percent < 100 && (
        <div style={{textAlign: "center", fontSize: "12px", color: "var(--c-text-secondary)", marginTop: "8px"}}>
          Current Position
        </div>
      )}
    </div>
  )
}
