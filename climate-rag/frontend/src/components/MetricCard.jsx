import React from "react"

const METRIC_ICONS = {
  Humidity: "💧",
  Wind: "💨",
  "UV Index": "☀️",
  Visibility: "👁",
  "Dew Point": "🌡",
  Pressure: "🔵",
  "Heat Index": "🌡",
  "Cloud Cover": "☁️",
  "Wind Dir": "🧭",
}

const getStatus = (label, value) => {
  if (value == null) return { color: "#64748b", text: "—" }
  const v = parseFloat(value)
  if (isNaN(v)) return { color: "#64748b", text: "—" }

  switch (label) {
    case "Humidity":
      if (v > 90) return { color: "#EF4444", text: "Very High" }
      if (v > 70) return { color: "#F59E0B", text: "High" }
      if (v > 40) return { color: "#10B981", text: "Normal" }
      return { color: "#06B6D4", text: "Low" }
    case "Wind":
      if (v > 60) return { color: "#EF4444", text: "Dangerous" }
      if (v > 40) return { color: "#F59E0B", text: "Strong" }
      if (v > 20) return { color: "#06B6D4", text: "Moderate" }
      return { color: "#10B981", text: "Calm" }
    case "UV Index":
      if (v > 10) return { color: "#EF4444", text: "Extreme" }
      if (v > 7) return { color: "#F59E0B", text: "Very High" }
      if (v > 5) return { color: "#F59E0B", text: "High" }
      if (v > 2) return { color: "#06B6D4", text: "Moderate" }
      return { color: "#10B981", text: "Low" }
    case "Visibility":
      if (v >= 10000) return { color: "#10B981", text: "Excellent" }
      if (v >= 5000) return { color: "#06B6D4", text: "Good" }
      if (v >= 1000) return { color: "#F59E0B", text: "Moderate" }
      return { color: "#EF4444", text: "Poor" }
    case "Pressure":
      if (v > 1020) return { color: "#10B981", text: "High" }
      if (v > 1000) return { color: "#06B6D4", text: "Normal" }
      return { color: "#F59E0B", text: "Low" }
    case "Heat Index":
      if (v > 42) return { color: "#EF4444", text: "Dangerous" }
      if (v > 36) return { color: "#F59E0B", text: "High Stress" }
      if (v > 30) return { color: "#F59E0B", text: "Moderate" }
      return { color: "#10B981", text: "Comfortable" }
    case "Cloud Cover":
      if (v > 80) return { color: "#64748b", text: "Overcast" }
      if (v > 50) return { color: "#94a3b8", text: "Mostly Cloudy" }
      if (v > 20) return { color: "#06B6D4", text: "Partly Cloudy" }
      return { color: "#10B981", text: "Clear" }
    default:
      return { color: "#64748b", text: "" }
  }
}

const formatValue = (label, value) => {
  if (value == null) return "—"
  if (label === "Visibility") {
    const km = value / 1000
    return km >= 1 ? `${km.toFixed(1)} km` : `${Math.round(value)} m`
  }
  return String(Math.round(value * 10) / 10)
}

const UNITS = {
  Humidity: "%",
  Wind: " km/h",
  "UV Index": "",
  Visibility: "",
  "Dew Point": "°C",
  Pressure: " hPa",
  "Heat Index": "°C",
  "Cloud Cover": "%",
  "Wind Dir": "°",
}

export default function MetricCard({ label, value, windDirText }) {
  const icon = METRIC_ICONS[label] || "📊"
  const status = getStatus(label, value)
  const displayVal = formatValue(label, value)
  const unit = label === "Visibility" ? "" : (UNITS[label] || "")

  return (
    <div className="metric-card">
      <div className="metric-top">
        <span className="metric-icon">{icon}</span>
        <span className="metric-label">{label}</span>
      </div>
      <div className="metric-value">
        {displayVal}{unit && <span className="metric-unit">{unit}</span>}
        {label === "Wind Dir" && windDirText && <span className="metric-unit" style={{marginLeft:4}}>{windDirText}</span>}
      </div>
      <div className="metric-status">
        <span className="metric-status-dot" style={{background: status.color}} />
        <span className="metric-status-text">{status.text}</span>
      </div>
    </div>
  )
}
