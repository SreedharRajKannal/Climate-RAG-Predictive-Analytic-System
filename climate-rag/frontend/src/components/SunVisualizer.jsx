import React, { useEffect, useState } from "react"

// Ensure dates are parsed to a unified day baseline for time comparison
const calculateDaylightProgress = (sunriseStr, sunsetStr, currentStr) => {
  const parseTime = (str) => {
    // Handle both "06:04 AM" and "6:04 AM" safely
    const parts = str.trim().split(' ');
    if (parts.length < 2) return 0;
    const time = parts[0];
    const modifier = parts[1].toUpperCase();
    
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours !== 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes; // returns minutes from midnight
  };

  const sunrise = parseTime(sunriseStr);
  const sunset = parseTime(sunsetStr);
  const current = parseTime(currentStr);   

  if (current < sunrise || current > sunset) {
    return { pct: 0, remHours: 0, remMins: 0 };
  }

  const totalDaylight = sunset - sunrise;
  const elapsed = current - sunrise;
  const remaining = sunset - current;

  const pct = Math.min(Math.max((elapsed / totalDaylight) * 100, 0), 100);
  const remHours = Math.floor(remaining / 60);
  const remMins = remaining % 60;

  return { pct, remHours, remMins };
};

export default function SunVisualizer({ sunrise, sunset, isDay = 1, utcOffsetSeconds = 0 }) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  if (!sunrise || !sunset) return null

  // Calculate the current local time in the target city
  const localBrowserOffset = new Date().getTimezoneOffset() * 60000;
  const targetCityTime = new Date(now.getTime() + localBrowserOffset + (utcOffsetSeconds * 1000));

  const formatTimeStr = (dateObj) => {
    return dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const sRise = new Date(sunrise)
  const sSet = new Date(sunset)
  const sunriseStr = formatTimeStr(sRise)
  const sunsetStr = formatTimeStr(sSet)
  const nowStr = formatTimeStr(targetCityTime)

  if (isDay === 1) {
    const { pct, remHours, remMins } = calculateDaylightProgress(sunriseStr, sunsetStr, nowStr);

    return (
      <div className="card-base" style={{padding: "24px", display: "flex", flexDirection: "column", height: "100%"}}>
        <h3 className="section-title" style={{marginBottom: "24px"}}>☀️ Sun Tracker</h3>
        
        <div style={{display: "flex", flexDirection: "column", justifyContent: "center", flex: 1}}>
          <div style={{display: "flex", alignItems: "center", gap: "12px", width: "100%", marginBottom: "24px"}}>
            <span style={{fontSize: "13px", fontWeight: "600", color: "var(--c-text-primary)", whiteSpace: "nowrap"}}>{sunriseStr}</span>
            
            <div style={{flex: 1, height: "2px", background: "var(--c-border)", position: "relative", display: "flex", alignItems: "center"}}>
               <div style={{
                 position: "absolute",
                 left: 0,
                 height: "2px",
                 background: "linear-gradient(90deg, #f59e0b, #fbbf24)",
                 width: `${pct}%`
               }} />
               <div style={{
                 position: "absolute",
                 left: `${pct}%`,
                 transform: "translateX(-50%)",
                 fontSize: "16px",
                 filter: "drop-shadow(0 0 4px rgba(245, 158, 11, 0.4))",
                 zIndex: 10
               }}>
                 ☀️
               </div>
            </div>

            <span style={{fontSize: "13px", fontWeight: "600", color: "var(--c-text-primary)", whiteSpace: "nowrap"}}>{sunsetStr}</span>
          </div>

          <div style={{background: "var(--c-surface-hover)", padding: "16px", borderRadius: "var(--radius-sm)", borderLeft: "4px solid #fbbf24"}}>
             <div style={{fontSize: "16px", fontWeight: "700", color: "var(--c-text-primary)", marginBottom: "8px"}}>
               {Math.round(pct)}% Through Daylight
             </div>
             <div style={{fontSize: "13px", color: "var(--c-text-secondary)"}}>
               Remaining: <span style={{fontWeight: "600", color: "var(--c-text-primary)"}}>{remHours}h {remMins}m</span>
             </div>
          </div>
        </div>
      </div>
    )
  } else {
    // Nighttime Logic
    let nextSunrise = new Date(sRise)
    if (targetCityTime > sRise) {
      nextSunrise.setDate(nextSunrise.getDate() + 1)
    }

    const remainingMs = Math.max(0, nextSunrise - targetCityTime)
    const remHours = Math.floor(remainingMs / (1000 * 60 * 60))
    const remMins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60))

    return (
      <div className="card-base" style={{padding: "24px", display: "flex", flexDirection: "column", height: "100%"}}>
        <h3 className="section-title" style={{marginBottom: "24px"}}>🌅 Next Sunrise</h3>
        
        <div style={{display: "flex", flexDirection: "column", justifyContent: "center", flex: 1}}>
          <div style={{fontSize: "36px", fontWeight: "800", color: "var(--c-text-primary)", marginBottom: "24px", textAlign: "center"}}>
            {formatTimeStr(nextSunrise)}
          </div>

          <div style={{background: "var(--c-surface-hover)", padding: "16px", borderRadius: "var(--radius-sm)", borderLeft: "4px solid #8b5cf6"}}>
            <div style={{display: "flex", justifyContent: "space-between", marginBottom: "8px"}}>
              <span style={{fontSize: "13px", color: "var(--c-text-secondary)"}}>Current Time:</span>
              <span style={{fontSize: "13px", fontWeight: "600", color: "var(--c-text-primary)"}}>{nowStr}</span>
            </div>
            <div style={{display: "flex", justifyContent: "space-between"}}>
              <span style={{fontSize: "13px", color: "var(--c-text-secondary)"}}>Time Until Sunrise:</span>
              <span style={{fontSize: "13px", fontWeight: "600", color: "var(--c-text-primary)"}}>{remHours}h {remMins}m</span>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
