import React from "react"
import WeatherIcon, { getConditionText } from "./WeatherIcon"

export default function CurrentWeatherHero({ conditions, dailyData, advisoryData, lastUpdated }) {
  if (!conditions) return null

  const temp = conditions.temperature != null ? Math.round(conditions.temperature) : "—"
  const feelsLike = conditions.feels_like != null ? Math.round(conditions.feels_like) : "—"
  const code = conditions.weather_code ?? 0
  const isDay = conditions.is_day ?? 1
  
  let high = "—"
  let low = "—"
  if (dailyData && dailyData.length > 0) {
    const today = dailyData[0]
    high = today.temp_max != null ? Math.round(today.temp_max) : "—"
    low = today.temp_min != null ? Math.round(today.temp_min) : "—"
  }

  const hum = conditions.humidity ?? "—"
  const wind = conditions.wind_speed != null ? Math.round(conditions.wind_speed) : "—"
  const rain = conditions.precip_prob ?? "0"

  const riskLevel = advisoryData?.risk_level || "Low"
  
  let riskColor = "var(--c-success)"
  if (riskLevel === "Moderate") riskColor = "var(--c-warning)"
  if (riskLevel === "High" || riskLevel === "Severe") riskColor = "var(--c-danger)"

  const locString = conditions.location || "Unknown Location"
  let displayLoc = locString
  if (locString.includes("(")) {
    displayLoc = locString.split("(")[0].trim()
  }
  
  const tzAbbr = conditions.timezone_abbreviation || "UTC"
  const offsetHours = conditions.utc_offset_seconds ? (conditions.utc_offset_seconds / 3600) : 0
  const offsetStr = offsetHours >= 0 ? `+${offsetHours}` : `${offsetHours}`
  const localTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="card-base" style={{
      display: "flex", 
      flexDirection: "row", 
      alignItems: "center", 
      justifyContent: "space-between",
      padding: "32px",
      flexWrap: "wrap",
      gap: "32px"
    }}>
      
      {/* LEFT: LOCATION AND TIME */}
      <div style={{display: "flex", flexDirection: "column", gap: "12px", minWidth: "250px"}}>
        <div style={{fontSize: "20px", fontWeight: "700", color: "var(--c-text-primary)"}}>📍 {displayLoc}</div>
        
        <div style={{
          border: "1px solid var(--c-border)",
          borderRadius: "var(--radius-sm)",
          display: "inline-flex",
          flexDirection: "column",
          overflow: "hidden",
          background: "var(--c-surface)"
        }}>
          <div style={{padding: "8px 16px", borderBottom: "1px solid var(--c-border)", fontSize: "24px", fontWeight: "600", color: "var(--c-text-primary)"}}>
             {localTimeStr}
          </div>
          <div style={{padding: "6px 16px", fontSize: "13px", color: "var(--c-text-secondary)", background: "var(--c-surface-hover)"}}>
             {tzAbbr} UTC{offsetStr}
          </div>
        </div>
        {lastUpdated && <div style={{fontSize: "12px", color: "var(--c-text-muted)"}}>Last Updated: {lastUpdated}</div>}
      </div>

      {/* RIGHT: WEATHER METRICS */}
      <div style={{display: "flex", flexDirection: "column", alignItems: "flex-end", flex: 1, minWidth: "300px"}}>
        <div style={{display: "flex", alignItems: "center", gap: "24px"}}>
          <WeatherIcon weatherCode={code} isDay={isDay} size={84} />
          <div style={{fontSize: "84px", fontWeight: "800", letterSpacing: "-4px", lineHeight: "1", color: "var(--c-text-primary)"}}>
            {temp}°
          </div>
        </div>
        
        <div style={{fontSize: "22px", fontWeight: "600", color: "var(--c-text-primary)", marginTop: "12px"}}>
          {getConditionText(code)}
        </div>

        <div style={{
          marginTop: "16px", 
          padding: "8px 16px", 
          background: "var(--c-surface-hover)", 
          borderRadius: "var(--radius-full)",
          display: "inline-flex",
          alignItems: "center",
          gap: "12px",
          fontSize: "16px",
          fontWeight: "600"
        }}>
          <span style={{color: "var(--c-text-secondary)"}}>Feels Like {feelsLike}°</span>
          <div style={{width: "4px", height: "4px", borderRadius: "50%", background: "var(--c-border)"}} />
          <span style={{color: riskColor}}>{riskLevel} Risk</span>
        </div>

        <div style={{fontSize: "14px", color: "var(--c-text-secondary)", marginTop: "20px", display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "flex-end"}}>
          <span>H: {high}° L: {low}°</span>
          <span style={{opacity: 0.5}}>•</span>
          <span>Humidity: {hum}%</span>
          <span style={{opacity: 0.5}}>•</span>
          <span>Wind: {wind} km/h</span>
          <span style={{opacity: 0.5}}>•</span>
          <span>Rain: {rain}%</span>
        </div>
      </div>

    </div>
  )
}
