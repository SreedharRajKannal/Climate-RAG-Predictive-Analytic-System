import React, { useEffect, useState } from "react"

// Parse hour:min from ISO string like "2024-10-10T06:04"
const parseHourMin = (str) => {
  if (!str || str.length < 16) return 0;
  const timePart = str.split('T')[1];
  if (!timePart) return 0;
  const [hours, minutes] = timePart.split(':').map(Number);
  return hours * 60 + minutes;
};

// Calculate daylight progress using sunrise/sunset ISO strings and current city time
const calculateDaylightProgress = (sunriseStr, sunsetStr, currentCityTime) => {
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

// Format ISO time string to readable format like "07:14 AM"
const parseIsoToTimeStr = (iso) => {
  if (!iso) return "";
  const timePart = iso.split('T')[1];
  if (!timePart) return "";
  let [h, m] = timePart.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12;
  return `${h < 10 ? '0'+h : h}:${m < 10 ? '0'+m : m} ${ampm}`;
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

  const sunriseLabel = parseIsoToTimeStr(sunrise);
  const sunsetLabel = parseIsoToTimeStr(sunset);

  // ALWAYS compute isDaylight from sunrise/sunset math, never trust API isDay alone
  const { pct, remHours, remMins, isDaylight } = calculateDaylightProgress(sunrise, sunset, targetCityTime);

  // Calculate time until next sunrise (for nighttime display)
  const getTimeUntilSunrise = () => {
    const sunriseMinutes = parseHourMin(sunrise);
    const nowMinutes = targetCityTime.getHours() * 60 + targetCityTime.getMinutes();
    
    let diff = sunriseMinutes - nowMinutes;
    if (diff <= 0) diff += 24 * 60; // next day's sunrise
    
    return {
      hours: Math.floor(diff / 60),
      mins: diff % 60
    };
  };

  if (isDaylight) {
    // ☀️ DAYTIME VIEW
    return (
      <div className="card-base" style={{padding: "24px", display: "flex", flexDirection: "column", height: "100%"}}>
        <h3 className="section-title" style={{marginBottom: "24px"}}>☀️ Sun Tracker</h3>
        
        <div style={{display: "flex", flexDirection: "column", justifyContent: "center", flex: 1}}>
          <div style={{textAlign: "center", marginBottom: "8px", fontSize: "14px", fontWeight: "700", color: "var(--c-text-primary)"}}>
            ☀️ {Math.round(pct)}% Through Daylight
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
                 zIndex: 10,
                 color: "#fbbf24"
               }}>
                 ●
               </div>
            </div>

            <span style={{fontSize: "13px", fontWeight: "600", color: "var(--c-text-primary)", whiteSpace: "nowrap"}}>{sunsetLabel}</span>
          </div>

          <div style={{background: "var(--c-surface-hover)", padding: "16px", borderRadius: "var(--radius-sm)", borderLeft: "4px solid #fbbf24"}}>
            <div style={{fontSize: "13px", color: "var(--c-text-secondary)"}}>
              Remaining Daylight: <span style={{fontWeight: "600", color: "var(--c-text-primary)"}}>{remHours}h {remMins}m</span>
            </div>
          </div>
        </div>
      </div>
    )
  } else {
    // 🌙 NIGHTTIME VIEW
    const timeUntil = getTimeUntilSunrise();

    return (
      <div className="card-base" style={{padding: "24px", display: "flex", flexDirection: "column", height: "100%"}}>
        <h3 className="section-title" style={{marginBottom: "24px"}}>🌙 Moon Tracker</h3>
        
        <div style={{display: "flex", flexDirection: "column", justifyContent: "center", flex: 1}}>
          <div style={{textAlign: "center", marginBottom: "8px", fontSize: "14px", fontWeight: "700", color: "var(--c-text-primary)"}}>
            🌙 Night Time
          </div>

          <div style={{display: "flex", alignItems: "center", gap: "12px", width: "100%", marginBottom: "24px"}}>
            <span style={{fontSize: "13px", fontWeight: "600", color: "var(--c-text-muted)", whiteSpace: "nowrap"}}>{sunsetLabel}</span>
            
            <div style={{flex: 1, height: "2px", background: "var(--c-border)", position: "relative", display: "flex", alignItems: "center"}}>
               <div style={{
                 position: "absolute",
                 left: 0,
                 height: "2px",
                 background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
                 width: "100%",
                 opacity: 0.4
               }} />
               <div style={{
                 position: "absolute",
                 left: "50%",
                 transform: "translateX(-50%)",
                 fontSize: "16px",
                 filter: "drop-shadow(0 0 6px rgba(139, 92, 246, 0.5))",
                 zIndex: 10
               }}>
                 🌙
               </div>
            </div>

            <span style={{fontSize: "13px", fontWeight: "600", color: "var(--c-text-muted)", whiteSpace: "nowrap"}}>{sunriseLabel}</span>
          </div>

          <div style={{display: "flex", flexDirection: "column", gap: "12px"}}>
            <div style={{background: "var(--c-surface-hover)", padding: "16px", borderRadius: "var(--radius-sm)", borderLeft: "4px solid #8b5cf6"}}>
              <div style={{fontSize: "13px", color: "var(--c-text-secondary)"}}>
                Next Sunrise: <span style={{fontWeight: "600", color: "var(--c-text-primary)"}}>{sunriseLabel}</span>
              </div>
              <div style={{fontSize: "13px", color: "var(--c-text-secondary)", marginTop: "4px"}}>
                Time Until Sunrise: <span style={{fontWeight: "600", color: "var(--c-text-primary)"}}>{timeUntil.hours}h {timeUntil.mins}m</span>
              </div>
            </div>
            <div style={{background: "var(--c-surface-hover)", padding: "12px 16px", borderRadius: "var(--radius-sm)", display: "flex", justifyContent: "space-between", alignItems: "center"}}>
              <span style={{fontSize: "12px", color: "var(--c-text-muted)"}}>Current Time</span>
              <span style={{fontSize: "14px", fontWeight: "600", color: "var(--c-text-primary)"}}>{targetCityTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
