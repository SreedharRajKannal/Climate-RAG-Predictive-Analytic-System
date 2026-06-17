import React from "react"
import WeatherIcon from "./WeatherIcon"

export default function PredictionTimeline({ forecast, dailyForecast }) {
  if (!forecast || forecast.length === 0) return null

  // Helper to extract future conditions
  const getNextPeriod = (hoursAhead) => {
    // Current hour + hoursAhead
    // Assuming forecast is an array of 24 hours starting from current hour
    if (forecast.length > hoursAhead) {
      return forecast[hoursAhead]
    }
    return forecast[forecast.length - 1]
  }

  const next6 = getNextPeriod(6)
  const next24 = getNextPeriod(23)
  
  // Next 3 days from daily forecast
  let next3d = null
  if (dailyForecast && dailyForecast.length > 3) {
    next3d = dailyForecast[3]
  }

  // Generate trend strings
  const generateTrend = (current, future, isTemp) => {
    if (!current || !future) return "Stable"
    const diff = future - current
    if (Math.abs(diff) < 2) return "Stable"
    if (diff > 0) return isTemp ? "Trending Warmer" : "Increasing"
    return isTemp ? "Trending Cooler" : "Decreasing"
  }

  const currentTemp = forecast[0]?.temperature || 25

  return (
    <div className="prediction-timeline">
      <div className="pred-card">
        <span className="pred-title">Next 6 Hours</span>
        <div className="pred-val">
          <WeatherIcon weatherCode={next6?.weather_code} size={28} />
          {Math.round(next6?.temperature || 0)}°
        </div>
        <span className="pred-trend">{generateTrend(currentTemp, next6?.temperature, true)}</span>
      </div>

      <div className="pred-card">
        <span className="pred-title">Next 24 Hours</span>
        <div className="pred-val">
          <WeatherIcon weatherCode={next24?.weather_code} size={28} />
          {Math.round(next24?.temperature || 0)}°
        </div>
        <span className="pred-trend">{generateTrend(currentTemp, next24?.temperature, true)}</span>
      </div>

      <div className="pred-card">
        <span className="pred-title">Next 3 Days</span>
        <div className="pred-val">
          {next3d ? (
            <>
              <WeatherIcon weatherCode={next3d?.weather_code} size={28} />
              {Math.round(next3d?.temp_max || 0)}°
            </>
          ) : (
            <span style={{fontSize: "14px", color: "var(--c-text-secondary)"}}>Loading...</span>
          )}
        </div>
        <span className="pred-trend">Broad Outlook</span>
      </div>
    </div>
  )
}
