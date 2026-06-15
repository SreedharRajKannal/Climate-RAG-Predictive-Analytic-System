import React, { useState } from "react"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts"

const METRIC_CONFIGS = {
  Temp: {
    predKey: "temp_predicted",
    currKey: "temp_current",
    unit: "°C",
    name: "Temperature",
    predColor: "#c084fc", // purple
    currColor: "#3b82f6"  // blue
  },
  Humidity: {
    predKey: "humidity_predicted",
    currKey: "humidity_current",
    unit: "%",
    name: "Humidity",
    predColor: "#e879f9", // fuchsia
    currColor: "#0ea5e9"  // sky
  },
  Rain: {
    predKey: "rain_predicted",
    currKey: "rain_current",
    unit: "%",
    name: "Rain Probability",
    predColor: "#f472b6", // pink
    currColor: "#2563eb"  // royal blue
  },
  Wind: {
    predKey: "wind_predicted",
    currKey: "wind_current",
    unit: " km/h",
    name: "Wind Speed",
    predColor: "#a78bfa", // violet
    currColor: "#10b981"  // emerald
  }
}

export default function ComparisonChart({ data, timezoneAbbr }) {
  const [activeMetrics, setActiveMetrics] = useState({
    Temp: true,
    Humidity: false,
    Rain: false,
    Wind: false
  })

  const handleToggle = (metric) => {
    setActiveMetrics(prev => {
      const next = { ...prev, [metric]: !prev[metric] }
      // Ensure at least one metric remains active to avoid an empty chart
      const activeCount = Object.values(next).filter(Boolean).length
      return activeCount > 0 ? next : prev
    })
  }

  const formatted = data.map(d => {
    const timeStr = d.time || d.recorded_at
    let timeLabel = timeStr
    if (timeStr && timeStr.includes("T")) {
      const [h, m] = timeStr.split("T")[1].split(":")
      timeLabel = `${h}:${m} ${timezoneAbbr || ""}`.trim()
    }
    return { ...d, time: timeLabel }
  })

  return (
    <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row gap-6">
      {/* Chart Section */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-100">Comparison Analysis</h3>
            <p className="text-[11px] text-slate-400">Previous Prediction vs Current Actual Values (Past 24h)</p>
          </div>
          <div className="flex gap-2">
            {Object.entries(activeMetrics).map(([metric, active]) => active && (
              <span key={metric} className="text-[9px] text-indigo-300 font-bold uppercase tracking-wider bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                {metric}
              </span>
            ))}
          </div>
        </div>

        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formatted} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#64748b" }} stroke="#334155" />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} stroke="#334155" />
              <Tooltip 
                contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "8px" }}
                labelStyle={{ fontSize: 11, fontWeight: "bold", color: "#94a3b8" }}
                itemStyle={{ fontSize: 11 }}
              />
              <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
              
              {Object.entries(activeMetrics).map(([metric, isActive]) => {
                if (!isActive) return null
                const config = METRIC_CONFIGS[metric]
                return [
                  <Line 
                    key={`${metric}-predicted`}
                    type="monotone" 
                    dataKey={config.predKey} 
                    stroke={config.predColor} 
                    strokeWidth={2}
                    dot={false} 
                    name={`Predicted ${metric} (${config.unit})`}
                    strokeDasharray="4 4"
                  />,
                  <Line 
                    key={`${metric}-current`}
                    type="monotone" 
                    dataKey={config.currKey} 
                    stroke={config.currColor} 
                    strokeWidth={2}
                    dot={false} 
                    name={`Current Actual ${metric} (${config.unit})`}
                  />
                ]
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Control Panel Section */}
      <div className="md:w-[150px] flex flex-col gap-3 justify-center border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
        <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-1 block">Toggle Metrics</span>
        
        {Object.keys(METRIC_CONFIGS).map((metric) => {
          const config = METRIC_CONFIGS[metric]
          const isActive = activeMetrics[metric]
          return (
            <button
              key={metric}
              onClick={() => handleToggle(metric)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
                isActive
                  ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-200 shadow-md shadow-indigo-500/10"
                  : "bg-slate-950/40 border-white/5 text-slate-400 hover:border-white/10 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full flex items-center justify-center border border-white/20">
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />}
                </span>
                <span>{metric}</span>
              </div>
              
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: config.currColor }} title="Current" />
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: config.predColor }} title="Predicted" />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
