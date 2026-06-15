import React from "react"
import WeatherIcon, { getConditionText } from "./WeatherIcon"

export default function DailyForecast({ dailyData }) {
  if (!dailyData || dailyData.length === 0) return null

  const getDayName = (dateStr, index) => {
    if (index === 0) return "Today"
    if (index === 1) return "Tomorrow"
    try {
      const d = new Date(dateStr + "T00:00:00")
      return d.toLocaleDateString("en-US", { weekday: "short" })
    } catch { return dateStr }
  }

  return (
    <div className="daily-card">
      <div className="section-header">
        <h3 className="section-title">7-Day Forecast</h3>
      </div>
      <div className="daily-list">
        {dailyData.map((day, i) => {
          const condText = getConditionText(day.weather_code)
          const rainWidth = Math.min(day.precip_prob_max || 0, 100)
          return (
            <div key={i} className={`daily-row ${i === 0 ? "daily-row-today" : ""}`}>
              <span className="daily-day">{getDayName(day.date, i)}</span>
              <div className="daily-icon-wrap">
                <WeatherIcon weatherCode={day.weather_code} size={28} />
              </div>
              <span className="daily-condition">{condText}</span>
              <div className="daily-rain-bar-wrap">
                {rainWidth > 0 && (
                  <div className="daily-rain-bar" style={{width: `${rainWidth}%`}} />
                )}
                {rainWidth > 0 && <span className="daily-rain-pct">{day.precip_prob_max}%</span>}
              </div>
              <span className="daily-low">{day.temp_min != null ? `${Math.round(day.temp_min)}°` : "—"}</span>
              <div className="daily-temp-range">
                <div className="daily-temp-track">
                  <div className="daily-temp-fill" style={{
                    left: `${Math.max(0, ((day.temp_min || 0) + 10) / 60 * 100)}%`,
                    width: `${Math.max(10, ((day.temp_max || 30) - (day.temp_min || 20)) / 60 * 100)}%`,
                  }} />
                </div>
              </div>
              <span className="daily-high">{day.temp_max != null ? `${Math.round(day.temp_max)}°` : "—"}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
