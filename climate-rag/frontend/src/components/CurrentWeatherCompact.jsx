import React from "react"
import WeatherIcon from "./WeatherIcon"

export default function CurrentWeatherCompact({ conditions }) {
  if (!conditions) return null

  const temp = Math.round(conditions.temperature || 0)
  const feelsLike = Math.round(conditions.feels_like || 0)
  const humidity = Math.round(conditions.humidity || 0)
  const wind = Math.round(conditions.wind_speed || 0)
  const rainProb = Math.round(conditions.precip_prob || 0)

  return (
    <div className="current-weather-compact">
      <div className="cw-item" style={{flexDirection: "row", alignItems: "center", gap: "12px", borderRight: "none", flex: 2}}>
        <WeatherIcon weatherCode={conditions.weather_code} size={48} />
        <div style={{display: "flex", flexDirection: "column"}}>
          <span className="cw-val" style={{fontSize: "36px"}}>{temp}°</span>
          <span className="cw-lbl" style={{fontSize: "14px"}}>Feels like {feelsLike}°</span>
        </div>
      </div>

      <div className="cw-item">
        <span className="cw-val">{humidity}%</span>
        <span className="cw-lbl">Humidity</span>
      </div>

      <div className="cw-item">
        <span className="cw-val">{wind} <span style={{fontSize:"12px"}}>km/h</span></span>
        <span className="cw-lbl">Wind</span>
      </div>

      <div className="cw-item">
        <span className="cw-val" style={{color: rainProb > 30 ? "var(--c-primary)" : "inherit"}}>{rainProb}%</span>
        <span className="cw-lbl">Rain Chance</span>
      </div>
    </div>
  )
}
