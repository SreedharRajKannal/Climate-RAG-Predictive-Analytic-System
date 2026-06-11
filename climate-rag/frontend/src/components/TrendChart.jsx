import React from "react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

export default function TrendChart({ data = [] }) {
  const formattedData = data.map(d => ({
    ...d,
    time: new Date(d.recorded_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
  }))

  return (
    <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">Trend Analysis</h3>
          <p className="text-[10px] text-slate-400">Atmospheric parameters observed over the last 24 hours</p>
        </div>
        <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
          Historical
        </span>
      </div>

      <div className="h-[220px] w-full mt-auto">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="trend-temp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="trend-humid" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="trend-uv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#eab308" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
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
            <Area type="monotone" dataKey="temperature" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#trend-temp)" name="Temp °C" dot={false} />
            <Area type="monotone" dataKey="humidity" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#trend-humid)" name="Humidity %" dot={false} />
            <Area type="monotone" dataKey="uv_index" stroke="#eab308" strokeWidth={2} fillOpacity={1} fill="url(#trend-uv)" name="UV Index" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
