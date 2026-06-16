import React from "react"

export default function SunVisualizer({ sunrise, sunset, isDay = 1 }) {
  if (!sunrise || !sunset) return null

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

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

  // If it's night, we'll simulate a moon cycle for the visual (from sunset to next sunrise)
  // In a real app we'd use moonrise/moonset from Open-Meteo, but we'll approximate using night duration
  let nightPercent = 0
  let nextSunrise = new Date(sRise)
  nextSunrise.setDate(nextSunrise.getDate() + 1)
  
  if (isDay === 0) {
    if (now >= sSet) {
      const totalNight = nextSunrise - sSet
      const elapsedNight = now - sSet
      nightPercent = (elapsedNight / totalNight) * 100
    } else if (now < sRise) {
      // It's past midnight but before sunrise
      const prevSunset = new Date(sSet)
      prevSunset.setDate(prevSunset.getDate() - 1)
      const totalNight = sRise - prevSunset
      const elapsedNight = now - prevSunset
      nightPercent = (elapsedNight / totalNight) * 100
    }
  }

  return (
    <div className="card-base" style={{padding: "24px"}}>
      <h3 className="section-title" style={{marginBottom: "24px"}}>
        {isDay ? "☀️ Sun Cycle" : "🌙 Moon Cycle"}
      </h3>
      
      {isDay === 1 ? (
        <>
          <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", fontSize: "14px", fontWeight: "600"}}>
            <span>{formatTime(sunrise)}</span>
            <span>{formatTime(sunset)}</span>
          </div>

          <div style={{position: "relative", height: "4px", background: "var(--c-border)", borderRadius: "2px", margin: "16px 0"}}>
            <div style={{
              position: "absolute",
              left: 0,
              top: 0,
              height: "100%",
              width: `${percent}%`,
              background: "linear-gradient(90deg, #f59e0b, #fbbf24)",
              borderRadius: "2px"
            }} />
            
            {percent > 0 && percent < 100 && (
              <div style={{
                position: "absolute",
                left: `calc(${percent}% - 6px)`,
                top: "-4px",
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: "var(--c-surface)",
                border: "2px solid #fbbf24",
                boxShadow: "0 0 8px rgba(0,0,0,0.2)"
              }} />
            )}
          </div>
          <div style={{textAlign: "center", fontSize: "12px", color: "var(--c-text-secondary)", marginTop: "8px"}}>
            Current Position
          </div>
        </>
      ) : (
        <>
          <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", fontSize: "14px", fontWeight: "600"}}>
            <span>Sunset</span>
            <span>Next Sunrise</span>
          </div>

          <div style={{position: "relative", height: "4px", background: "var(--c-border)", borderRadius: "2px", margin: "16px 0"}}>
            <div style={{
              position: "absolute",
              left: 0,
              top: 0,
              height: "100%",
              width: `${Math.max(0, Math.min(100, nightPercent))}%`,
              background: "linear-gradient(90deg, #475569, #94a3b8)",
              borderRadius: "2px"
            }} />
            
            {nightPercent > 0 && nightPercent < 100 && (
              <div style={{
                position: "absolute",
                left: `calc(${nightPercent}% - 6px)`,
                top: "-4px",
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: "var(--c-surface)",
                border: "2px solid #94a3b8",
                boxShadow: "0 0 8px rgba(0,0,0,0.2)"
              }} />
            )}
          </div>
          
          <div style={{display: "flex", justifyContent: "space-between", marginTop: "16px"}}>
            <div style={{display: "flex", flexDirection: "column"}}>
               <span style={{fontSize: "11px", color: "var(--c-text-secondary)"}}>Moon Phase</span>
               <span style={{fontSize: "13px", fontWeight: "600"}}>Waning Crescent</span>
            </div>
            <div style={{display: "flex", flexDirection: "column", alignItems: "flex-end"}}>
               <span style={{fontSize: "11px", color: "var(--c-text-secondary)"}}>Illumination</span>
               <span style={{fontSize: "13px", fontWeight: "600"}}>14%</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
