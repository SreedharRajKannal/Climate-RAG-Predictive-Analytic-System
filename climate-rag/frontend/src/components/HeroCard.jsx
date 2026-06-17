import React from "react"
import WeatherIcon, { getConditionText } from "./WeatherIcon"

const WEATHER_GRADIENTS = {
  sunny: "from-amber-900/20 via-orange-950/10 to-slate-950",
  hot: "from-red-900/20 via-orange-950/10 to-slate-950",
  "partly-cloudy": "from-blue-900/15 via-slate-900/30 to-slate-950",
  cloudy: "from-slate-800/30 via-slate-900/20 to-slate-950",
  rainy: "from-blue-950/30 via-slate-900/20 to-slate-950",
  drizzle: "from-sky-950/20 via-slate-900/20 to-slate-950",
  thunderstorm: "from-purple-950/30 via-slate-900/20 to-slate-950",
  snowy: "from-blue-900/20 via-slate-800/20 to-slate-950",
  foggy: "from-slate-700/20 via-slate-800/20 to-slate-950",
}

export default function HeroCard({ conditions, advisory, timezoneAbbr, utcOffsetSeconds }) {
  if (!conditions) {
    return (
      <div className="hero-card" style={{minHeight: 280}}>
        <div className="hero-skeleton">
          <div className="skeleton-line" style={{width:"40%",height:64}} />
          <div className="skeleton-line" style={{width:"60%",height:20,marginTop:12}} />
          <div className="skeleton-line" style={{width:"80%",height:14,marginTop:8}} />
        </div>
      </div>
    )
  }

  const weatherCode = conditions.weather_code ?? 0
  const conditionText = getConditionText(weatherCode)
  const condType = conditions.weather_code !== undefined 
    ? (require("./WeatherIcon").getConditionType(weatherCode)) 
    : (conditions.precip_prob > 50 ? "rainy" : conditions.cloud_cover > 70 ? "cloudy" : "sunny")
  const grad = WEATHER_GRADIENTS[condType] || WEATHER_GRADIENTS.sunny

  // Format time
  const formatTime = () => {
    const d = new Date()
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000)
    const target = new Date(utc + ((utcOffsetSeconds || 0) * 1000))
    const h = target.getHours()
    const m = target.getMinutes().toString().padStart(2, "0")
    const ampm = h >= 12 ? "PM" : "AM"
    const h12 = h % 12 || 12
    return `${h12}:${m} ${ampm} ${timezoneAbbr || ""}`
  }

  // Wind direction text
  const windDirText = (deg) => {
    if (deg == null) return ""
    const dirs = ["N","NE","E","SE","S","SW","W","NW"]
    return dirs[Math.round(deg / 45) % 8]
  }

  // Extract AI summary (first sentence)
  const aiSummary = advisory ? advisory.split(/[.!]/)[0] + "." : ""

  // Location display name
  const locationName = conditions.location 
    ? (conditions.location.includes("(") ? conditions.location.split("(")[0].trim() : conditions.location)
    : "—"

  return (
    <div className={`hero-card bg-gradient-to-br ${grad}`}>
      {/* Ambient glow */}
      <div className="hero-glow" />

      <div className="hero-content">
        {/* Left: Icon */}
        <div className="hero-icon-wrap">
          <WeatherIcon weatherCode={weatherCode} temp={conditions.temperature} precipProb={conditions.precip_prob} cloudCover={conditions.cloud_cover} size={120} />
        </div>

        {/* Center: Temperature + Condition */}
        <div className="hero-main">
          <div className="hero-temp">
            {conditions.temperature !== undefined ? `${Math.round(conditions.temperature)}°` : "—"}
          </div>
          <div className="hero-condition">{conditionText}</div>
          
          <div className="hero-meta">
            <span>Feels {conditions.feels_like != null ? `${Math.round(conditions.feels_like)}°` : "—"}</span>
            <span className="hero-dot">·</span>
            <span>H:{conditions.daily_high != null ? `${Math.round(conditions.daily_high)}°` : "—"} L:{conditions.daily_low != null ? `${Math.round(conditions.daily_low)}°` : "—"}</span>
          </div>

          <div className="hero-meta secondary">
            <span>🌧 {conditions.precip_prob ?? 0}%</span>
            <span className="hero-dot">·</span>
            <span>💨 {conditions.wind_speed ?? "—"} km/h {windDirText(conditions.wind_dir)}</span>
          </div>
        </div>

        {/* Right: Location + Time */}
        <div className="hero-side">
          <div className="hero-location">{locationName}</div>
          <div className="hero-updated">Updated {formatTime()}</div>
        </div>
      </div>

      {/* AI Summary */}
      {aiSummary && (
        <div className="hero-ai-summary">
          <span className="hero-ai-icon">✦</span>
          {aiSummary}
        </div>
      )}
    </div>
  )
}
