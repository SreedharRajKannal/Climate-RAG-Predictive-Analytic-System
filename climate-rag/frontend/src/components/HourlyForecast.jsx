import React, { useState } from "react"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

export default function HourlyForecast({ forecast }) {
  const [activeTab, setActiveTab] = useState("temp")

  if (!forecast || forecast.length === 0) return null

  // Process future 24h data
  const now = new Date()
  const futureItems = forecast.filter(f => new Date(f.time) >= now && f.temperature != null && f.temperature < 100 && f.temperature > -100)
  
  const data = []
  let added = 0
  for (const f of futureItems) {
    if (added >= 24) break
    const d = new Date(f.time)
    data.push({
      time: added === 0 ? "Now" : d.toLocaleTimeString([], { hour: 'numeric' }),
      temp: f.temperature,
      hum: f.humidity,
      rain: f.precip_prob,
      wind: f.wind_speed,
      aqi: f.aqi || 0
    })
    added++
  }

  const tabs = [
    { id: "temp", label: "Temperature", color: "var(--c-primary)", dataKey: "temp", unit: "°C" },
    { id: "rain", label: "Rain", color: "var(--c-success)", dataKey: "rain", unit: "%" },
    { id: "hum", label: "Humidity", color: "var(--c-accent)", dataKey: "hum", unit: "%" },
    { id: "wind", label: "Wind", color: "var(--c-warning)", dataKey: "wind", unit: "km/h" },
    { id: "aqi", label: "AQI", color: "var(--c-danger)", dataKey: "aqi", unit: " AQI" }
  ]

  const activeTabData = tabs.find(t => t.id === activeTab)

  return (
    <div className="card-base" style={{padding: "32px", marginTop: "24px"}}>
      <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", flexWrap: "wrap", gap: "16px"}}>
        <h3 className="section-title" style={{margin: 0}}>24-Hour Forecast</h3>
        <div style={{display: "flex", gap: "8px", background: "var(--c-surface-hover)", padding: "4px", borderRadius: "var(--radius-md)", flexWrap: "wrap", marginBottom: "16px"}}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id ? "var(--c-surface)" : "transparent",
                border: activeTab === tab.id ? "1px solid var(--c-border)" : "1px solid transparent",
                color: activeTab === tab.id ? "var(--c-text-primary)" : "var(--c-text-secondary)",
                padding: "6px 12px",
                borderRadius: "var(--radius-sm)",
                fontSize: "12px",
                fontWeight: activeTab === tab.id ? "600" : "500",
                cursor: "pointer",
                boxShadow: activeTab === tab.id ? "var(--shadow-sm)" : "none",
                transition: "all 0.2s"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{width: "100%", height: "350px"}}>
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-hourly-${activeTab}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={activeTabData.color} stopOpacity={0.4}/>
                <stop offset="95%" stopColor={activeTabData.color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" vertical={false} />
            <XAxis 
              dataKey="time" 
              tick={{fill: "var(--c-text-muted)", fontSize: 13, fontWeight: "500"}} 
              tickMargin={16}
              axisLine={false}
              tickLine={false}
              minTickGap={40}
            />
            <YAxis 
              domain={['auto', 'auto']}
              tick={{fill: "var(--c-text-muted)", fontSize: 13, fontWeight: "500"}} 
              tickMargin={16}
              axisLine={false}
              tickLine={false}
              tickFormatter={(val) => `${val}${activeTabData.unit === 'km/h' ? '' : activeTabData.unit}`}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: "var(--c-surface)",
                border: "1px solid var(--c-border)",
                borderRadius: "var(--radius-md)",
                boxShadow: "var(--shadow-lg)"
              }}
              itemStyle={{color: "var(--c-text-primary)", fontWeight: "600"}}
              formatter={(value) => [`${value} ${activeTabData.unit}`, activeTabData.label]}
            />
            <Area 
              type="monotone" 
              dataKey={activeTabData.dataKey} 
              stroke={activeTabData.color} 
              strokeWidth={3}
              fillOpacity={1} 
              fill={`url(#grad-hourly-${activeTab})`} 
              animationDuration={500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
