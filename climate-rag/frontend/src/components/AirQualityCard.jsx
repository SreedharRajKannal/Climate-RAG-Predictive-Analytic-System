import React from "react"

const getAqiLevel = (aqi) => {
  if (aqi == null) return { label: "Unknown", color: "#64748b", bg: "rgba(100,116,139,0.1)" }
  if (aqi <= 25) return { label: "Excellent", color: "#10B981", bg: "rgba(16,185,129,0.1)" }
  if (aqi <= 50) return { label: "Good", color: "#10B981", bg: "rgba(16,185,129,0.08)" }
  if (aqi <= 75) return { label: "Moderate", color: "#F59E0B", bg: "rgba(245,158,11,0.1)" }
  if (aqi <= 100) return { label: "Unhealthy for Sensitive", color: "#F59E0B", bg: "rgba(245,158,11,0.1)" }
  if (aqi <= 150) return { label: "Unhealthy", color: "#EF4444", bg: "rgba(239,68,68,0.1)" }
  return { label: "Very Unhealthy", color: "#DC2626", bg: "rgba(220,38,38,0.15)" }
}

const PollutantBar = ({ label, value, max, unit }) => {
  const pct = value != null ? Math.min((value / max) * 100, 100) : 0
  const color = pct > 75 ? "#EF4444" : pct > 50 ? "#F59E0B" : pct > 25 ? "#06B6D4" : "#10B981"
  return (
    <div className="pollutant-row">
      <span className="pollutant-label">{label}</span>
      <div className="pollutant-bar-track">
        <div className="pollutant-bar-fill" style={{width: `${pct}%`, background: color}} />
      </div>
      <span className="pollutant-value">{value != null ? `${Math.round(value * 10) / 10}` : "—"} <span className="pollutant-unit">{unit}</span></span>
    </div>
  )
}

export default function AirQualityCard({ airQuality }) {
  if (!airQuality) return null

  const aqi = airQuality.european_aqi
  const level = getAqiLevel(aqi)
  
  // Arc calculation for AQI gauge
  const aqiNorm = Math.min((aqi || 0) / 200, 1)
  const arcAngle = aqiNorm * 180
  const r = 50
  const cx = 60
  const cy = 55
  const startAngle = Math.PI
  const endAngle = Math.PI - (arcAngle * Math.PI / 180)
  const x2 = cx + r * Math.cos(endAngle)
  const y2 = cy - r * Math.sin(endAngle)
  const largeArc = arcAngle > 180 ? 1 : 0

  return (
    <div className="aqi-card" style={{borderColor: `${level.color}22`}}>
      <div className="section-header">
        <h3 className="section-title">Air Quality</h3>
        <span className="aqi-badge" style={{background: level.bg, color: level.color}}>{level.label}</span>
      </div>
      
      <div className="aqi-body">
        <div className="aqi-gauge">
          <svg viewBox="0 0 120 65" className="aqi-arc">
            <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} stroke="#1e293b" strokeWidth="8" fill="none" strokeLinecap="round" />
            {aqi != null && (
              <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`} stroke={level.color} strokeWidth="8" fill="none" strokeLinecap="round" />
            )}
          </svg>
          <div className="aqi-score" style={{color: level.color}}>{aqi ?? "—"}</div>
          <div className="aqi-label">EAQI</div>
        </div>

        <div className="aqi-pollutants">
          <PollutantBar label="PM2.5" value={airQuality.pm2_5} max={75} unit="μg/m³" />
          <PollutantBar label="PM10" value={airQuality.pm10} max={150} unit="μg/m³" />
          <PollutantBar label="CO" value={airQuality.co} max={10000} unit="μg/m³" />
          <PollutantBar label="NO₂" value={airQuality.no2} max={200} unit="μg/m³" />
          <PollutantBar label="O₃" value={airQuality.o3} max={180} unit="μg/m³" />
        </div>
      </div>
    </div>
  )
}
