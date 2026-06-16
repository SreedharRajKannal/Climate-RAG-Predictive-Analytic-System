import React, { useState } from "react"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

export default function TrendAnalysis({ forecast }) {
  const [activeTab, setActiveTab] = useState("temp")

  if (!forecast || forecast.length === 0) return null

  // Process data for charts (Past 24 hours)
  const now = new Date()
  const data = []
  
  // To get the past 24 hours up to now, we can iterate backwards or forwards.
  // We want chronological order. We'll find all items < now, and take the last 24 of them.
  const pastItems = forecast.filter(f => new Date(f.time) <= now && f.temperature != null && f.temperature < 100 && f.temperature > -100)
  
  // Take only the most recent 24 from the past
  const recentPast = pastItems.slice(-24)

  for (const f of recentPast) {
    const d = new Date(f.time)
    data.push({
      time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      temp: f.temperature,
      hum: f.humidity,
      rain: f.precip_prob,
      wind: f.wind_speed,
      pressure: f.surface_pressure
    })
  }

  const tabs = [
    { id: "temp", label: "Temperature", color: "var(--c-primary)", dataKey: "temp", unit: "°C" },
    { id: "hum", label: "Humidity", color: "var(--c-accent)", dataKey: "hum", unit: "%" },
    { id: "rain", label: "Rain", color: "var(--c-success)", dataKey: "rain", unit: "%" },
    { id: "wind", label: "Wind", color: "var(--c-warning)", dataKey: "wind", unit: "km/h" },
    { id: "pressure", label: "Pressure", color: "var(--c-danger)", dataKey: "pressure", unit: "hPa" }
  ]

  const activeTabData = tabs.find(t => t.id === activeTab)

  return (
    <div className="card-base" style={{padding: "24px", marginTop: "16px"}}>
      <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px"}}>
        <h3 className="section-title" style={{margin: 0}}>Trend Analysis</h3>
        <div style={{display: "flex", gap: "8px", background: "var(--c-surface-hover)", padding: "4px", borderRadius: "var(--radius-md)"}}>
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

      <div style={{width: "100%", height: "250px"}}>
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${activeTab}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={activeTabData.color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={activeTabData.color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" vertical={false} />
            <XAxis 
              dataKey="time" 
              tick={{fill: "var(--c-text-muted)", fontSize: 11}} 
              tickMargin={10}
              axisLine={false}
              tickLine={false}
              minTickGap={30}
            />
            <YAxis 
              tick={{fill: "var(--c-text-muted)", fontSize: 11}} 
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
              fill={`url(#grad-${activeTab})`} 
              animationDuration={500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
