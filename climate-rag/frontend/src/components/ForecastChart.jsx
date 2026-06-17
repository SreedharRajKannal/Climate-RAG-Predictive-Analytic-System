import React from "react"
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ComposedChart } from "recharts"

export default function ForecastChart({ forecast, timezoneAbbr }) {
  if (!forecast || forecast.length === 0) return null

  const data = forecast.slice(0, 24).map(d => {
    const timeStr = d.time || ""
    let label = ""
    if (timeStr.includes("T")) {
      const h = parseInt(timeStr.split("T")[1].split(":")[0], 10)
      label = h === 0 ? "12a" : h === 12 ? "12p" : h > 12 ? `${h-12}p` : `${h}a`
    }
    return {
      time: label,
      temp: d.temperature != null ? Math.round(d.temperature * 10) / 10 : null,
      rain: d.precip_prob ?? 0,
      wind: d.wind_speed ?? 0,
    }
  })

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null
    return (
      <div className="chart-tooltip">
        <div className="chart-tooltip-label">{label} {timezoneAbbr || ""}</div>
        {payload.map((p, i) => (
          <div key={i} className="chart-tooltip-row" style={{color: p.color}}>
            <span>{p.name}:</span>
            <span className="chart-tooltip-val">{p.value}{p.name === "Temp" ? "°C" : p.name === "Rain" ? "%" : " km/h"}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="forecast-chart-card">
      <div className="section-header">
        <h3 className="section-title">24-Hour Forecast</h3>
        <div className="chart-legend">
          <span className="legend-dot" style={{background:"#3B82F6"}} /> Temp
          <span className="legend-dot" style={{background:"#06B6D4",marginLeft:12}} /> Rain
          <span className="legend-dot" style={{background:"#8B5CF6",marginLeft:12}} /> Wind
        </div>
      </div>
      <div style={{width:"100%", height: 220}}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{top:10, right:10, left:-20, bottom:0}}>
            <defs>
              <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="time" tick={{fontSize:10, fill:"#64748b"}} stroke="#1e293b" axisLine={false} tickLine={false} />
            <YAxis yAxisId="temp" tick={{fontSize:10, fill:"#64748b"}} stroke="none" axisLine={false} tickLine={false} />
            <YAxis yAxisId="rain" orientation="right" domain={[0,100]} hide />
            <Tooltip content={<CustomTooltip />} />
            <Bar yAxisId="rain" dataKey="rain" fill="#06B6D4" fillOpacity={0.15} radius={[2,2,0,0]} name="Rain" />
            <Area yAxisId="temp" type="monotone" dataKey="temp" stroke="#3B82F6" strokeWidth={2.5} fill="url(#tempGrad)" dot={false} name="Temp" />
            <Line yAxisId="temp" type="monotone" dataKey="wind" stroke="#8B5CF6" strokeWidth={1.5} dot={false} name="Wind" strokeDasharray="4 3" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
