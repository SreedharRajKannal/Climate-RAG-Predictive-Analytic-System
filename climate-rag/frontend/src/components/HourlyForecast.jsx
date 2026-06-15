import React from "react"
import WeatherIcon from "./WeatherIcon"

export default function HourlyForecast({ forecast }) {
  if (!forecast || forecast.length === 0) return null

  // Take the next 24 hours
  const hours = forecast.slice(0, 24).filter(f => f.temperature != null && f.temperature < 100 && f.temperature > -100)

  return (
    <div className="card-base" style={{padding: "24px"}}>
      <h3 className="section-title" style={{marginBottom: "16px"}}>24-Hour Forecast</h3>
      
      <div style={{
        display: "flex", 
        gap: "24px", 
        overflowX: "auto", 
        paddingBottom: "16px",
        scrollbarWidth: "none", // Firefox
        msOverflowStyle: "none"  // IE
      }}>
        {/* Hide scrollbar for webkit but allow scrolling */}
        <style dangerouslySetInnerHTML={{__html: `
          .hourly-scroll::-webkit-scrollbar { display: none; }
        `}} />
        
        <div className="hourly-scroll" style={{display: "flex", gap: "24px"}}>
          {hours.map((hour, idx) => {
            const d = new Date(hour.time)
            const timeStr = idx === 0 ? "Now" : d.toLocaleTimeString([], { hour: 'numeric' })
            return (
              <div key={idx} style={{display: "flex", flexDirection: "column", alignItems: "center", minWidth: "50px", gap: "12px"}}>
                <span style={{fontSize: "13px", fontWeight: idx === 0 ? "700" : "500", color: idx === 0 ? "var(--c-primary)" : "var(--c-text-secondary)"}}>
                  {timeStr}
                </span>
                <WeatherIcon weatherCode={hour.weather_code} size={28} />
                <span style={{fontSize: "15px", fontWeight: "600"}}>{Math.round(hour.temperature)}°</span>
                <span style={{fontSize: "11px", color: "var(--c-accent)", fontWeight: "600"}}>
                  {hour.precip_prob > 0 ? `${hour.precip_prob}%` : ""}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
