import React, { useRef } from "react"
import WeatherIcon from "./WeatherIcon"

export default function HourlyTimeline({ forecast, utcOffsetSeconds, timezoneAbbr }) {
  const scrollRef = useRef(null)

  if (!forecast || forecast.length === 0) return null

  const now = new Date()
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000)
  const targetNow = new Date(utc + ((utcOffsetSeconds || 0) * 1000))
  const currentHour = targetNow.getHours()

  const formatHour = (timeStr) => {
    if (!timeStr || !timeStr.includes("T")) return ""
    const h = parseInt(timeStr.split("T")[1].split(":")[0], 10)
    if (h === 0) return "12 AM"
    if (h === 12) return "12 PM"
    return h > 12 ? `${h - 12} PM` : `${h} AM`
  }

  const isCurrentHour = (timeStr) => {
    if (!timeStr || !timeStr.includes("T")) return false
    const h = parseInt(timeStr.split("T")[1].split(":")[0], 10)
    return h === currentHour
  }

  return (
    <div className="timeline-card">
      <div className="timeline-header">
        <h3 className="section-title">Hourly Forecast</h3>
        <span className="section-badge">{timezoneAbbr || "UTC"}</span>
      </div>
      <div className="timeline-scroll" ref={scrollRef}>
        {forecast.slice(0, 24).map((item, i) => {
          const isCurrent = i === 0 || isCurrentHour(item.time)
          return (
            <div key={i} className={`timeline-cell ${isCurrent && i === 0 ? "timeline-cell-active" : ""}`}>
              <span className="timeline-time">{i === 0 ? "Now" : formatHour(item.time)}</span>
              <WeatherIcon 
                weatherCode={item.weather_code} 
                temp={item.temperature} 
                precipProb={item.precip_prob}
                size={32} 
              />
              <span className="timeline-temp">{item.temperature != null ? `${Math.round(item.temperature)}°` : "—"}</span>
              {item.precip_prob != null && item.precip_prob > 0 && (
                <div className="timeline-rain">
                  <div className="timeline-rain-bar" style={{height: `${Math.min(item.precip_prob, 100)}%`}} />
                </div>
              )}
              <span className="timeline-rain-label">{item.precip_prob != null && item.precip_prob > 0 ? `${item.precip_prob}%` : ""}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
