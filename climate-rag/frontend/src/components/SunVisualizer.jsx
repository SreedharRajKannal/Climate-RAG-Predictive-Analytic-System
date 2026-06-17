import React, { useEffect, useState } from "react"

// Ensure dates are parsed to a unified day baseline for time comparison
const calculateDaylightProgress = (sunriseStr, sunsetStr, currentCityTime) => {
  // sunriseStr: "2024-10-10T06:04"
  // sunsetStr: "2024-10-10T18:41"
  const parseHourMin = (str) => {
    if (!str || str.length < 16) return 0;
    const timePart = str.split('T')[1];
    if (!timePart) return 0;
    const [hours, minutes] = timePart.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const sunrise = parseHourMin(sunriseStr);
  const sunset = parseHourMin(sunsetStr);
  
  const nowH = currentCityTime.getHours();
  const nowM = currentCityTime.getMinutes();
  const current = nowH * 60 + nowM;

  if (current < sunrise || current > sunset) {
    return { pct: 0, remHours: 0, remMins: 0, isDaylight: false };
  }

  const totalDaylight = sunset - sunrise;
  const elapsed = current - sunrise;
  const remaining = sunset - current;

  const pct = Math.min(Math.max((elapsed / totalDaylight) * 100, 0), 100);
  const remHours = Math.floor(remaining / 60);
  const remMins = remaining % 60;

  return { pct, remHours, remMins, isDaylight: true };
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
  
  // Format target city strings by using local time trick, but wait, the ISO string has local time already embedded in the YYYY-MM-DDTHH:MM
  const parseIsoToTimeStr = (iso) => {
    if (!iso) return "";
    const timePart = iso.split('T')[1];
    if (!timePart) return "";
    let [h, m] = timePart.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12;
    return `${h < 10 ? '0'+h : h}:${m < 10 ? '0'+m : m} ${ampm}`;
  }

  const sunriseLabel = parseIsoToTimeStr(sunrise);
  const sunsetLabel = parseIsoToTimeStr(sunset);

  if (isDay === 1) {
    const { pct, remHours, remMins, isDaylight } = calculateDaylightProgress(sunrise, sunset, targetCityTime);

    return (
      <div className="card-base" style={{padding: "24px", display: "flex", flexDirection: "column", height: "100%"}}>
        <h3 className="section-title" style={{marginBottom: "24px"}}>☀️ Sun Tracker</h3>
        
        <div style={{display: "flex", flexDirection: "column", justifyContent: "center", flex: 1}}>
          <div style={{textAlign: "center", marginBottom: "8px", fontSize: "14px", fontWeight: "700", color: "var(--c-text-primary)"}}>
            ☀️ {isDaylight ? `${Math.round(pct)}% Through Daylight` : "Daylight Ended"}
          </div>

          <div style={{display: "flex", alignItems: "center", gap: "12px", width: "100%", marginBottom: "24px"}}>
            <span style={{fontSize: "13px", fontWeight: "600", color: "var(--c-text-primary)", whiteSpace: "nowrap"}}>{sunriseLabel}</span>
            
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
                 ●
               </div>
            </div>

            <span style={{fontSize: "13px", fontWeight: "600", color: "var(--c-text-primary)", whiteSpace: "nowrap"}}>{sunsetLabel}</span>
          </div>

          {isDaylight ? (
            <div style={{background: "var(--c-surface-hover)", padding: "16px", borderRadius: "var(--radius-sm)", borderLeft: "4px solid #fbbf24"}}>
              <div style={{fontSize: "13px", color: "var(--c-text-secondary)"}}>
                Remaining Daylight: <span style={{fontWeight: "600", color: "var(--c-text-primary)"}}>{remHours}h {remMins}m</span>
              </div>
            </div>
          ) : (
            <div style={{background: "var(--c-surface-hover)", padding: "16px", borderRadius: "var(--radius-sm)", borderLeft: "4px solid var(--c-border)"}}>
              <div style={{fontSize: "13px", color: "var(--c-text-secondary)"}}>
                Waiting for sunrise.
              </div>
            </div>
          )}
        </div>
      </div>
    )
  } else {
    // Nighttime Logic
    let nextSunrise = new Date(sRise)
    if (targetCityTime > sRise) {
      nextSunrise.setDate(nextSunrise.getDate() + 1)
    }

    return (
      <div className="card-base" style={{padding: "24px", display: "flex", flexDirection: "column", height: "100%"}}>
        <h3 className="section-title" style={{marginBottom: "24px"}}>🌙 Next Sunrise</h3>
        <div style={{display: "flex", flexDirection: "column", justifyContent: "center", flex: 1, gap: "16px"}}>
          <div style={{display: "flex", alignItems: "center", justifyContent: "space-between"}}>
            <span style={{fontSize: "14px", color: "var(--c-text-secondary)"}}>Sunrise</span>
            <span style={{fontSize: "18px", fontWeight: "700", color: "var(--c-text-primary)"}}>{sunriseLabel}</span>
          </div>
          <div style={{background: "var(--c-surface-hover)", padding: "16px", borderRadius: "var(--radius-sm)", borderLeft: "4px solid var(--c-primary)"}}>
             <div style={{fontSize: "13px", color: "var(--c-text-secondary)"}}>
               Current Time: <span style={{fontWeight: "600", color: "var(--c-text-primary)"}}>{targetCityTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
             </div>
          </div>
        </div>
      </div>
    )
  }
}
