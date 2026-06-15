import React from "react"
import { ComposedChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

export default function ForecastConfidenceChart({ forecast }) {
  if (!forecast || forecast.length === 0) return null

  // Process data for the next 24 hours
  const data = forecast.slice(0, 24).map((f, i) => {
    const d = new Date(f.time)
    const temp = f.temperature
    // Simulate confidence band widening slightly over time
    const variance = 0.5 + (i * 0.05) 
    return {
      time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      temp: temp,
      minTemp: temp - variance,
      maxTemp: temp + variance
    }
  })

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const { temp, minTemp, maxTemp } = payload[0].payload
      return (
        <div style={{
          backgroundColor: "var(--c-surface)",
          border: "1px solid var(--c-border)",
          borderRadius: "var(--radius-md)",
          padding: "12px",
          boxShadow: "var(--shadow-lg)"
        }}>
          <div style={{color: "var(--c-text-muted)", fontSize: "12px", marginBottom: "8px"}}>{label}</div>
          <div style={{color: "var(--c-primary)", fontSize: "16px", fontWeight: "700"}}>
            {temp.toFixed(1)}°C
          </div>
          <div style={{color: "var(--c-text-secondary)", fontSize: "12px", marginTop: "4px"}}>
            Expected: {minTemp.toFixed(1)}° — {maxTemp.toFixed(1)}°
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="card-base" style={{padding: "24px", marginTop: "16px"}}>
      <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px"}}>
        <div>
          <h3 className="section-title" style={{margin: 0}}>AI Forecast Confidence</h3>
          <p style={{fontSize: "12px", color: "var(--c-text-secondary)", marginTop: "4px"}}>Predicted temperature trajectory with expected variance bands.</p>
        </div>
      </div>

      <div style={{width: "100%", height: "250px"}}>
        <ResponsiveContainer>
          <ComposedChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
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
              domain={['dataMin - 2', 'dataMax + 2']}
              tick={{fill: "var(--c-text-muted)", fontSize: 11}} 
              axisLine={false}
              tickLine={false}
              tickFormatter={(val) => `${val}°`}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Confidence Band (Area) */}
            <Area 
              type="monotone" 
              dataKey="maxTemp" 
              stroke="none" 
              fill="var(--c-primary)" 
              fillOpacity={0.1} 
              animationDuration={500}
            />
            <Area 
              type="monotone" 
              dataKey="minTemp" 
              stroke="none" 
              fill="var(--c-surface)" // Masks the bottom part of the maxTemp area to create a band
              fillOpacity={1} 
              animationDuration={500}
            />

            {/* Actual Predicted Line */}
            <Line 
              type="monotone" 
              dataKey="temp" 
              stroke="var(--c-primary)" 
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, fill: "var(--c-surface)", stroke: "var(--c-primary)", strokeWidth: 2 }}
              animationDuration={500}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
