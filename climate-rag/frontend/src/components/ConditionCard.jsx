import React from "react"

const METRIC_METADATA = {
  "Temperature": {
    color: "from-orange-500/10 to-amber-500/5 border-white/10 text-amber-400",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )
  },
  "Feels like": {
    color: "from-red-500/10 to-orange-500/5 border-white/10 text-orange-400",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
  },
  "Humidity": {
    color: "from-sky-500/10 to-blue-500/5 border-white/10 text-sky-400",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 9.172V5L8 4z" />
      </svg>
    )
  },
  "Wind": {
    color: "from-teal-500/10 to-emerald-500/5 border-white/10 text-teal-400",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707-.707" />
      </svg>
    )
  },
  "UV Index": {
    color: "from-yellow-500/10 to-purple-500/5 border-white/10 text-yellow-400",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
      </svg>
    )
  },
  "Rain": {
    color: "from-blue-500/10 to-indigo-500/5 border-white/10 text-blue-400",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5" />
      </svg>
    )
  },
  "Cloud Cover": {
    color: "from-slate-500/10 to-slate-700/5 border-white/10 text-slate-300",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
      </svg>
    )
  },
  "AQI": {
    color: "from-purple-500/10 to-violet-500/5 border-white/10 text-purple-400",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 009 11M5 11V9a2 2 0 012-2h12a2 2 0 012 2v2m-7 0a2 2 0 002 2h2a2 2 0 002-2M9 11v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2" />
      </svg>
    )
  }
}

const getSeverityColor = (label, value) => {
  if (value === null || value === undefined) return "text-slate-100"
  const val = parseFloat(value)
  if (isNaN(val)) return "text-slate-100"

  // Thresholds: AQI >150 red, UV >8 red >6 orange, Rain% >80 red >60 orange, Humidity >90 orange, Wind >60 red.
  // Color coding: green safe, yellow moderate, orange high, red critical
  if (label === "AQI") {
    if (val > 150) return "text-red-500 font-extrabold"
    if (val > 100) return "text-orange-500 font-bold"
    if (val > 50) return "text-yellow-500"
    return "text-emerald-500"
  }
  if (label === "UV Index") {
    if (val > 8) return "text-red-500 font-extrabold"
    if (val > 6) return "text-orange-500 font-bold"
    if (val > 2) return "text-yellow-500"
    return "text-emerald-500"
  }
  if (label === "Rain") {
    if (val > 80) return "text-red-500 font-extrabold"
    if (val > 60) return "text-orange-500 font-bold"
    if (val > 30) return "text-yellow-500"
    return "text-emerald-500"
  }
  if (label === "Humidity") {
    if (val > 90) return "text-orange-500 font-bold"
    if (val > 70) return "text-yellow-500"
    return "text-emerald-500"
  }
  if (label === "Wind") {
    if (val > 60) return "text-red-500 font-extrabold"
    if (val > 40) return "text-orange-500 font-bold"
    if (val > 20) return "text-yellow-500"
    return "text-emerald-500"
  }
  return "text-slate-100"
}

export default function ConditionCard({ label, value, unit }) {
  const meta = METRIC_METADATA[label] || {
    color: "from-slate-500/10 to-slate-600/5 border-white/10 text-slate-300",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }

  // Set descriptive status tags for AQI / UV index
  let statusText = ""
  if (label === "AQI" && value !== null) {
    if (value <= 50) statusText = "Good"
    else if (value <= 100) statusText = "Mod"
    else statusText = "Unhealthy"
  } else if (label === "UV Index" && value !== null) {
    if (value <= 2) statusText = "Low"
    else if (value <= 5) statusText = "Mod"
    else if (value <= 7) statusText = "High"
    else statusText = "Very High"
  }

  const valColorClass = getSeverityColor(label, value)

  return (
    <div className={`bg-gradient-to-br ${meta.color} border border-white/10 bg-slate-900/40 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between hover:scale-[1.02] hover:bg-slate-900/60 transition-all shadow-lg duration-200`}>
      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">{label}</span>
        <span className={`text-xl font-bold flex items-baseline ${valColorClass}`}>
          {value ?? "—"}
          {unit && <span className="text-xs font-normal text-slate-400 ml-0.5">{unit}</span>}
        </span>
      </div>

      <div className="flex flex-col items-end gap-1">
        <div className="p-2 rounded-xl bg-slate-950/40 border border-white/10">
          {meta.icon}
        </div>
        {statusText && (
          <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 bg-slate-950/40 px-1.5 py-0.5 rounded">
            {statusText}
          </span>
        )}
      </div>
    </div>
  )
}