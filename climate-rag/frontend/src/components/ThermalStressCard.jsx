import React from "react"

export default function ThermalStressCard({ apparentTemperature, temperature }) {
  if (apparentTemperature === undefined) return null

  let label = ""
  let colorClass = ""

  if (apparentTemperature < 30) {
    label = "Minimal heat stress"
    colorClass = "bg-gradient-to-br from-emerald-900/40 to-emerald-950/20 border-emerald-500/30 text-emerald-100"
  } else if (apparentTemperature < 36) {
    label = "Moderate heat stress"
    colorClass = "bg-gradient-to-br from-yellow-900/40 to-yellow-950/20 border-yellow-500/30 text-yellow-100"
  } else if (apparentTemperature < 42) {
    label = "High heat stress"
    colorClass = "bg-gradient-to-br from-orange-900/40 to-orange-950/20 border-orange-500/30 text-orange-100"
  } else {
    label = "Dangerous heat load"
    colorClass = "bg-gradient-to-br from-red-900/40 to-red-950/20 border-red-500/30 text-red-100 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
  }

  return (
    <div className={`border rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-center items-center transition-all ${colorClass}`}>
      <div className="absolute top-3 left-4 text-[10px] uppercase tracking-widest font-extrabold opacity-70">
        Thermal Stress Index
      </div>
      <div className="mt-4 flex flex-col items-center">
        <span className="text-6xl font-black tracking-tighter">
          {apparentTemperature}°
        </span>
        <span className="text-sm opacity-80 mt-1 font-medium">
          Actual: {temperature}°C
        </span>
        <span className="mt-4 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-black/20 border border-white/10">
          {label}
        </span>
      </div>
    </div>
  )
}
