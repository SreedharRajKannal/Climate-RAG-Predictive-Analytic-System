import React from "react"

// WMO Weather Code → condition mapping
const WMO_CONDITIONS = {
  0: { label: "Clear Sky", type: "sunny" },
  1: { label: "Mainly Clear", type: "sunny" },
  2: { label: "Partly Cloudy", type: "partly-cloudy" },
  3: { label: "Overcast", type: "cloudy" },
  45: { label: "Foggy", type: "foggy" },
  48: { label: "Rime Fog", type: "foggy" },
  51: { label: "Light Drizzle", type: "drizzle" },
  53: { label: "Drizzle", type: "drizzle" },
  55: { label: "Heavy Drizzle", type: "drizzle" },
  61: { label: "Light Rain", type: "rainy" },
  63: { label: "Rain", type: "rainy" },
  65: { label: "Heavy Rain", type: "rainy" },
  71: { label: "Light Snow", type: "snowy" },
  73: { label: "Snow", type: "snowy" },
  75: { label: "Heavy Snow", type: "snowy" },
  80: { label: "Rain Showers", type: "rainy" },
  81: { label: "Heavy Showers", type: "rainy" },
  82: { label: "Violent Showers", type: "rainy" },
  85: { label: "Snow Showers", type: "snowy" },
  86: { label: "Heavy Snow Showers", type: "snowy" },
  95: { label: "Thunderstorm", type: "thunderstorm" },
  96: { label: "Thunderstorm with Hail", type: "thunderstorm" },
  99: { label: "Severe Thunderstorm", type: "thunderstorm" },
}

export function getConditionText(weatherCode) {
  return WMO_CONDITIONS[weatherCode]?.label || "Clear"
}

export function getConditionType(weatherCode) {
  return WMO_CONDITIONS[weatherCode]?.type || "sunny"
}

export default function WeatherIcon({ weatherCode, temp, precipProb, cloudCover, size = 64 }) {
  let type = getConditionType(weatherCode)
  
  // Fallback heuristics if no weather_code provided
  if (weatherCode === undefined || weatherCode === null) {
    if (precipProb > 50) type = "rainy"
    else if (cloudCover > 70) type = "cloudy"
    else if (temp > 35) type = "hot"
    else if (cloudCover > 30) type = "partly-cloudy"
    else type = "sunny"
  }

  const s = size

  const styles = `
    @keyframes wi-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes wi-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
    @keyframes wi-rain { 0% { transform: translateY(-8px); opacity: 0; } 50% { opacity: 1; } 100% { transform: translateY(8px); opacity: 0; } }
    @keyframes wi-pulse { 0%, 100% { transform: scale(1); opacity: 0.85; } 50% { transform: scale(1.08); opacity: 1; } }
    @keyframes wi-flash { 0%, 100% { opacity: 0; } 10% { opacity: 1; } 20% { opacity: 0; } }
    .wi-spin { animation: wi-spin 25s linear infinite; transform-origin: center; }
    .wi-float { animation: wi-float 4s ease-in-out infinite; }
    .wi-pulse { animation: wi-pulse 3s ease-in-out infinite; transform-origin: center; }
    .wi-rain-1 { animation: wi-rain 1.4s infinite linear; }
    .wi-rain-2 { animation: wi-rain 1.4s infinite linear 0.4s; }
    .wi-rain-3 { animation: wi-rain 1.4s infinite linear 0.8s; }
    .wi-flash { animation: wi-flash 3s infinite; }
  `

  const wrap = (children) => (
    <div className="relative flex items-center justify-center" style={{ width: s, height: s }}>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      {children}
    </div>
  )

  switch (type) {
    case "thunderstorm":
      return wrap(
        <>
          <svg className="w-full h-full wi-float" viewBox="0 0 48 48" fill="none">
            <path d="M34 36a10 10 0 00-2-19.8c-.4-1.2-1-2.4-2-3.4s-2.2-1.6-3.4-2a10 10 0 00-17.8 4.2A10 10 0 0012 36h22z" fill="#475569" fillOpacity="0.3" stroke="#64748b" strokeWidth="1.5"/>
            <path d="M24 28l-4 8h5l-2 6 7-10h-5l3-6z" fill="#fbbf24" className="wi-flash"/>
            <line className="wi-rain-1" x1="16" y1="37" x2="16" y2="41" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round"/>
            <line className="wi-rain-2" x1="32" y1="37" x2="32" y2="41" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <div className="absolute inset-0 wi-pulse rounded-full" style={{background:"radial-gradient(circle, rgba(251,191,36,0.08) 0%, transparent 70%)"}}/>
        </>
      )
    case "rainy":
      return wrap(
        <svg className="w-full h-full wi-float" viewBox="0 0 48 48" fill="none">
          <path d="M34 32a10 10 0 00-2-19.8c-.4-1.2-1-2.4-2-3.4s-2.2-1.6-3.4-2a10 10 0 00-17.8 4.2A10 10 0 0012 32h22z" fill="#475569" fillOpacity="0.2" stroke="#64748b" strokeWidth="1.5"/>
          <line className="wi-rain-1" x1="17" y1="35" x2="17" y2="40" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round"/>
          <line className="wi-rain-2" x1="24" y1="35" x2="24" y2="40" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round"/>
          <line className="wi-rain-3" x1="31" y1="35" x2="31" y2="40" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      )
    case "drizzle":
      return wrap(
        <svg className="w-full h-full wi-float" viewBox="0 0 48 48" fill="none">
          <path d="M34 32a10 10 0 00-2-19.8c-.4-1.2-1-2.4-2-3.4s-2.2-1.6-3.4-2a10 10 0 00-17.8 4.2A10 10 0 0012 32h22z" fill="#475569" fillOpacity="0.15" stroke="#64748b" strokeWidth="1.5"/>
          <circle className="wi-rain-1" cx="18" cy="37" r="1" fill="#38bdf8"/>
          <circle className="wi-rain-2" cx="24" cy="38" r="1" fill="#38bdf8"/>
          <circle className="wi-rain-3" cx="30" cy="37" r="1" fill="#38bdf8"/>
        </svg>
      )
    case "snowy":
      return wrap(
        <svg className="w-full h-full wi-float" viewBox="0 0 48 48" fill="none">
          <path d="M34 32a10 10 0 00-2-19.8c-.4-1.2-1-2.4-2-3.4s-2.2-1.6-3.4-2a10 10 0 00-17.8 4.2A10 10 0 0012 32h22z" fill="#475569" fillOpacity="0.15" stroke="#94a3b8" strokeWidth="1.5"/>
          <circle className="wi-rain-1" cx="17" cy="37" r="1.5" fill="#e2e8f0"/>
          <circle className="wi-rain-2" cx="24" cy="39" r="1.5" fill="#e2e8f0"/>
          <circle className="wi-rain-3" cx="31" cy="37" r="1.5" fill="#e2e8f0"/>
        </svg>
      )
    case "foggy":
      return wrap(
        <svg className="w-full h-full" viewBox="0 0 48 48" fill="none" style={{opacity:0.8}}>
          <line x1="10" y1="20" x2="38" y2="20" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 3"/>
          <line x1="12" y1="26" x2="36" y2="26" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 3"/>
          <line x1="14" y1="32" x2="34" y2="32" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 3"/>
        </svg>
      )
    case "cloudy":
      return wrap(
        <svg className="w-full h-full wi-float" viewBox="0 0 48 48" fill="none">
          <path d="M34 32a10 10 0 00-2-19.8c-.4-1.2-1-2.4-2-3.4s-2.2-1.6-3.4-2a10 10 0 00-17.8 4.2A10 10 0 0012 32h22z" fill="#475569" fillOpacity="0.25" stroke="#94a3b8" strokeWidth="1.5"/>
        </svg>
      )
    case "partly-cloudy":
      return wrap(
        <>
          <svg className="w-3/5 h-3/5 absolute top-1 left-1 wi-spin" viewBox="0 0 48 48" fill="none" style={{color:"#fbbf24"}}>
            <circle cx="24" cy="24" r="8" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="2"/>
            {[0,45,90,135,180,225,270,315].map(a => (
              <line key={a} x1="24" y1="4" x2="24" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" transform={`rotate(${a} 24 24)`}/>
            ))}
          </svg>
          <svg className="w-3/5 h-3/5 absolute bottom-2 right-1" viewBox="0 0 48 48" fill="none">
            <path d="M34 32a10 10 0 00-2-19.8c-.4-1.2-1-2.4-2-3.4s-2.2-1.6-3.4-2a10 10 0 00-17.8 4.2A10 10 0 0012 32h22z" fill="#475569" fillOpacity="0.35" stroke="#94a3b8" strokeWidth="1.5"/>
          </svg>
        </>
      )
    case "hot":
      return wrap(
        <>
          <svg className="w-full h-full wi-spin" viewBox="0 0 48 48" fill="none" style={{color:"#f59e0b"}}>
            <circle cx="24" cy="24" r="10" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="2"/>
            {[0,45,90,135,180,225,270,315].map(a => (
              <line key={a} x1="24" y1="2" x2="24" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" transform={`rotate(${a} 24 24)`}/>
            ))}
          </svg>
          <div className="absolute inset-0 wi-pulse rounded-full" style={{background:"radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)"}}/>
        </>
      )
    default: // sunny
      return wrap(
        <>
          <svg className="w-full h-full wi-spin" viewBox="0 0 48 48" fill="none" style={{color:"#fbbf24"}}>
            <circle cx="24" cy="24" r="10" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="2"/>
            {[0,45,90,135,180,225,270,315].map(a => (
              <line key={a} x1="24" y1="2" x2="24" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" transform={`rotate(${a} 24 24)`}/>
            ))}
          </svg>
          <div className="absolute inset-0 wi-pulse rounded-full" style={{background:"radial-gradient(circle, rgba(251,191,36,0.1) 0%, transparent 70%)"}}/>
        </>
      )
  }
}
