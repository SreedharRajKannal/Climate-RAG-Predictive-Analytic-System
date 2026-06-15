import React from "react"

export default function WeatherAlerts({ conditions }) {
  if (!conditions) return null

  const alerts = []

  if (conditions.temperature && conditions.temperature >= 40)
    alerts.push({ icon: "🔥", label: "Extreme Heat Warning", severity: "critical", desc: `Temperature at ${conditions.temperature}°C` })
  else if (conditions.temperature && conditions.temperature >= 35)
    alerts.push({ icon: "☀️", label: "Heat Advisory", severity: "warning", desc: `Temperature at ${conditions.temperature}°C` })

  if (conditions.precip_prob && conditions.precip_prob >= 80)
    alerts.push({ icon: "🌧", label: "Heavy Rain Expected", severity: "warning", desc: `${conditions.precip_prob}% probability` })

  if (conditions.uv_index && conditions.uv_index >= 8)
    alerts.push({ icon: "☀️", label: "High UV Alert", severity: "warning", desc: `UV Index: ${conditions.uv_index}` })
  
  if (conditions.wind_speed && conditions.wind_speed >= 50)
    alerts.push({ icon: "💨", label: "Strong Wind Warning", severity: "warning", desc: `${conditions.wind_speed} km/h` })

  if (conditions.aqi && conditions.aqi >= 150)
    alerts.push({ icon: "😷", label: "Unhealthy Air Quality", severity: "critical", desc: `AQI: ${conditions.aqi}` })

  if (conditions.weather_code && [95, 96, 99].includes(conditions.weather_code))
    alerts.push({ icon: "⛈", label: "Thunderstorm Warning", severity: "critical", desc: "Active thunderstorm detected" })

  if (alerts.length === 0) return null

  return (
    <div className="alerts-strip">
      {alerts.map((a, i) => (
        <div key={i} className={`alert-chip alert-${a.severity}`}>
          <span className="alert-icon">{a.icon}</span>
          <div className="alert-text">
            <span className="alert-label">{a.label}</span>
            <span className="alert-desc">{a.desc}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
