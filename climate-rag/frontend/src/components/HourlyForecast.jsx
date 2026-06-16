import React from "react"
import { ResponsiveContainer, ComposedChart, Line, XAxis, YAxis, Tooltip, Area, CartesianGrid } from "recharts"
import WeatherIcon from "./WeatherIcon"

export default function HourlyForecast({ forecast }) {
  if (!forecast || forecast.length === 0) return null

  // Take the next 24 hours from the current time
  const now = new Date()
  const data = []
  
  let added = 0
  for (let i = 0; i < forecast.length; i++) {
    const f = forecast[i]
    if (f.temperature == null || f.temperature > 100 || f.temperature < -100) continue
    
    const d = new Date(f.time)
    if (d < now && i !== 0) continue // Skip past hours, except maybe the very first exact match
    
    if (added >= 24) break

    data.push({
      time: added === 0 ? "Now" : d.toLocaleTimeString([], { hour: 'numeric' }),
      temp: f.temperature,
      hum: f.humidity,
      rain: f.precip_prob,
      wind: f.wind_speed,
      weather_code: f.weather_code,
      is_day: f.is_day ?? 1
    })
    added++
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload
      return (
        <div className="card-base" style={{padding: "12px", border: "1px solid var(--c-border)", background: "var(--c-surface)"}}>
          <div style={{fontWeight: "600", marginBottom: "8px"}}>{label}</div>
          <div style={{display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px"}}>
             <WeatherIcon weatherCode={p.weather_code} isDay={p.is_day} size={24} />
             <span style={{fontSize: "16px", fontWeight: "700"}}>{Math.round(p.temp)}°</span>
          </div>
          <div style={{fontSize: "12px", color: "var(--c-text-secondary)"}}>Rain: {p.rain}%</div>
          <div style={{fontSize: "12px", color: "var(--c-text-secondary)"}}>Humidity: {p.hum}%</div>
          <div style={{fontSize: "12px", color: "var(--c-text-secondary)"}}>Wind: {Math.round(p.wind)} km/h</div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="card-base" style={{padding: "24px"}}>
      <h3 className="section-title" style={{marginBottom: "24px"}}>24-Hour Forecast</h3>
      
      <div style={{height: "250px", width: "100%"}}>
        <ResponsiveContainer>
          <ComposedChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--c-border)" opacity={0.5} />
            <XAxis dataKey="time" stroke="var(--c-text-muted)" fontSize={11} tickLine={false} axisLine={false} minTickGap={20} />
            <YAxis stroke="var(--c-text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `${v}°`} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--c-border)', strokeWidth: 1, strokeDasharray: '4 4' }} />
            
            {/* Smooth Temperature Curve */}
            <Line type="monotone" dataKey="temp" stroke="var(--c-primary)" strokeWidth={3} dot={false} activeDot={{r: 6, fill: "var(--c-primary)", stroke: "var(--c-surface)", strokeWidth: 2}} />
            
            {/* Smooth Rain Probability Area underneath */}
            <Area type="monotone" dataKey="rain" fill="var(--c-accent)" stroke="none" fillOpacity={0.1} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
