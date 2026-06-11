import React from "react"

export default function SunVisualizer({ sunrise, sunset }) {
  // Parse iso date string (e.g. "2026-06-11T06:05")
  const parseToMinutes = (dateStr) => {
    if (!dateStr) return null
    try {
      const date = new Date(dateStr)
      return date.getHours() * 60 + date.getMinutes()
    } catch (e) {
      return null
    }
  }

  const formatTimeStr = (dateStr) => {
    if (!dateStr) return "--:--"
    try {
      const date = new Date(dateStr)
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } catch (e) {
      return "--:--"
    }
  }

  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const riseMinutes = parseToMinutes(sunrise) ?? (6 * 60) // Fallback 6:00 AM
  const setMinutes = parseToMinutes(sunset) ?? (18 * 60 + 30) // Fallback 6:30 PM

  // Calculate sun position percentage
  let fraction = 0
  let isDay = false

  if (currentMinutes >= riseMinutes && currentMinutes <= setMinutes) {
    fraction = (currentMinutes - riseMinutes) / (setMinutes - riseMinutes)
    isDay = true
  }

  // Coordinates on a 200x100 SVG space (radius 80, center at 100,100)
  const r = 80
  const cx = 100
  const cy = 90

  // Angle from Math.PI (180deg - sunrise) to 0 (sunset)
  const angle = Math.PI - fraction * Math.PI
  const sunX = cx + r * Math.cos(angle)
  const sunY = cy - r * Math.sin(angle)

  // Background transitions: dark blue (night) to orange gradient (dawn/dusk) to light blue (day)
  const getBackgroundStyle = () => {
    if (currentMinutes >= riseMinutes - 45 && currentMinutes <= riseMinutes + 45) {
      // Dawn (orange gradient)
      return "from-amber-950/20 via-slate-900/80 to-blue-950/20 border-amber-500/20"
    }
    if (currentMinutes >= setMinutes - 45 && currentMinutes <= setMinutes + 45) {
      // Dusk (orange gradient)
      return "from-blue-950/20 via-slate-900/80 to-amber-950/20 border-orange-500/20"
    }
    if (currentMinutes > riseMinutes + 45 && currentMinutes < setMinutes - 45) {
      // Day (light blue tint)
      return "from-sky-950/20 to-slate-900/80 border-sky-500/20"
    }
    // Night (dark blue/neutral)
    return "from-slate-950 to-slate-900/80 border-white/10"
  }

  const bgGradient = getBackgroundStyle()

  return (
    <div className={`bg-gradient-to-br ${bgGradient} backdrop-blur-md border rounded-2xl p-5 shadow-xl flex flex-col gap-4 transition-all duration-1000`}>
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <h3 className="text-sm font-medium text-slate-300">Sun Cycle Visualizer</h3>
        <span className="text-[10px] text-indigo-400 uppercase tracking-widest font-semibold bg-indigo-500/10 px-2 py-0.5 rounded-full">
          Live Track
        </span>
      </div>

      <div className="relative flex flex-col items-center py-2">
        <svg className="w-full max-w-[280px]" viewBox="0 0 200 110" fill="none">
          <defs>
            <linearGradient id="sun-gradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#fb7185" />
              <stop offset="50%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
          </defs>
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes pulse-glow {
              0%, 100% { filter: drop-shadow(0 0 2px rgba(251, 191, 36, 0.6)); }
              50% { filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.9)); }
            }
            @keyframes pulse-glow-moon {
              0%, 100% { filter: drop-shadow(0 0 2px rgba(148, 163, 184, 0.4)); }
              50% { filter: drop-shadow(0 0 6px rgba(148, 163, 184, 0.7)); }
            }
            .glow-sun { animation: pulse-glow 3s infinite ease-in-out; }
            .glow-moon { animation: pulse-glow-moon 3s infinite ease-in-out; }
          ` }} />

          {/* Dotted path representation of the sun's trajectory */}
          <path
            d="M 20 90 A 80 80 0 0 1 180 90"
            stroke="#334155"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />

          {/* Dotted path glow if daytime (completed path is lit) */}
          {isDay && (
            <path
              d={`M 20 90 A 80 80 0 0 1 ${sunX} ${sunY}`}
              stroke="url(#sun-gradient)"
              strokeWidth="2"
            />
          )}

          {/* Horizon baseline */}
          <line x1="10" y1="90" x2="190" y2="90" stroke="#475569" strokeWidth="1.5" />

          {/* Dynamically moving sun icon with time */}
          {isDay ? (
            <g transform={`translate(${sunX - 7}, ${sunY - 7})`} className="glow-sun">
              <circle cx="7" cy="7" r="5" fill="#fbbf24" />
              {/* Sun rays */}
              <circle cx="7" cy="7" r="7" stroke="#fbbf24" strokeWidth="0.8" strokeDasharray="2 1" />
            </g>
          ) : (
            // Moon icon centered at top during night
            <g transform={`translate(100, 40)`} className="glow-moon">
              <path d="M-2,-4 A5,5 0 1,0 6,4 A4,4 0 1,1 -2,-4" fill="#94a3b8" />
            </g>
          )}

          {/* Sunrise and Sunset labels at baseline endpoints */}
          <circle cx="20" cy="90" r="3" fill="#64748b" />
          <circle cx="180" cy="90" r="3" fill="#64748b" />

          {/* Text Labels inside SVG */}
          <text x="20" y="103" textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="500">
            {formatTimeStr(sunrise)}
          </text>
          <text x="180" y="103" textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="500">
            {formatTimeStr(sunset)}
          </text>
          <text x="100" y="107" textAnchor="middle" fill="#475569" fontSize="7" letterSpacing="0.5">
            Dynamically moving sun with time
          </text>
        </svg>

        {/* Legend */}
        <div className="flex w-full justify-between px-3 mt-1 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
            <span>Sunrise: {formatTimeStr(sunrise)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-slate-500 rounded-full" />
            <span>Sunset: {formatTimeStr(sunset)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
