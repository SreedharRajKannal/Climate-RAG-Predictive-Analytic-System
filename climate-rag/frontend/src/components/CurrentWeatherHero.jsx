import React from "react"
import WeatherIcon, { getConditionText } from "./WeatherIcon"

export default function CurrentWeatherHero({ conditions, dailyData }) {
  if (!conditions) return null

  const temp = conditions.temperature ?? "—"
  const feelsLike = conditions.feels_like ?? "—"
  const code = conditions.weather_code ?? 0
  
  // Try to find today's high and low from daily forecast
  let high = "—"
  let low = "—"
  if (dailyData && dailyData.length > 0) {
    const today = dailyData[0]
    high = today.temp_max != null ? Math.round(today.temp_max) : "—"
    low = today.temp_min != null ? Math.round(today.temp_min) : "—"
  }

  return (
    <div style={{
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      justifyContent: "center",
      padding: "40px 20px",
      textAlign: "center"
    }}>
      <div style={{fontSize: "96px", fontWeight: "800", letterSpacing: "-4px", lineHeight: "1", color: "var(--c-text-primary)", display: "flex", alignItems: "center", gap: "16px"}}>
        <WeatherIcon weatherCode={code} size={84} />
        {temp}°
      </div>
      
      <div style={{fontSize: "20px", fontWeight: "600", color: "var(--c-text-primary)", marginTop: "16px"}}>
        {getConditionText(code)}
      </div>

      <div style={{fontSize: "16px", color: "var(--c-text-secondary)", marginTop: "8px", display: "flex", gap: "16px", justifyContent: "center"}}>
        <span>Feels Like {feelsLike}°</span>
        <span style={{opacity: 0.5}}>|</span>
        <span>High {high}°</span>
        <span style={{opacity: 0.5}}>|</span>
        <span>Low {low}°</span>
      </div>
    </div>
  )
}
