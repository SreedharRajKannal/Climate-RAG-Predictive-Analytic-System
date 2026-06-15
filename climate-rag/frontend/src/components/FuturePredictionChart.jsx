import React from "react"
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

export default function FuturePredictionChart({ data = [], timezoneAbbr }) {
  const formattedData = data.map(d => {
    const timeStr = d.time || d.recorded_at
    let timeLabel = timeStr
    if (timeStr && timeStr.includes("T")) {
      const [h, m] = timeStr.split("T")[1].split(":")
      timeLabel = `${h}:${m} ${timezoneAbbr || ""}`.trim()
    }
    return {
      ...d,
      time: timeLabel,
      // Generate range array [min, max] between temperature and precipitation probability to shade the region between them
      range: [d.temperature ?? 0, d.precip_prob ?? 0]
    }
  })

  return (
    <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 font-sans">Future Prediction</h3>
          <p className="text-[10px] text-slate-400">Atmospheric parameters forecasted for the next 24 hours</p>
        </div>
        <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
          Forecast
        </span>
      </div>

      <div className="h-[220px] w-full mt-auto">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={formattedData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="prediction-shade" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
            <XAxis dataKey="time" tick={{ fontSize: 9, fill: "#64748b" }} stroke="#334155" />
            <YAxis tick={{ fontSize: 9, fill: "#64748b" }} stroke="#334155" />
            <Tooltip 
              contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", color: "#fff" }}
              labelStyle={{ fontSize: 10, fontWeight: "bold", color: "#94a3b8" }}
              itemStyle={{ fontSize: 10 }}
            />
            <Legend wrapperStyle={{ fontSize: 9, paddingTop: 8 }} />
            
            {/* Shaded Area between the two lines */}
            <Area 
              type="monotone" 
              dataKey="range" 
              fill="url(#prediction-shade)" 
              stroke="none" 
              name="Difference Area" 
              activeDot={false} 
              legendType="none"
            />

            {/* Temperature Line */}
            <Line 
              type="monotone" 
              dataKey="temperature" 
              stroke="#fb923c" 
              strokeWidth={2} 
              dot={false} 
              name="Temperature (°C)" 
            />

            {/* Precipitation Probability Line */}
            <Line 
              type="monotone" 
              dataKey="precip_prob" 
              stroke="#38bdf8" 
              strokeWidth={2} 
              dot={false} 
              name="Rain Probability (%)" 
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
