import React from "react"

export default function WeatherIcon({ condition, temp, precipProb, cloudCover, size = 64 }) {
  // Determine dominant weather state
  let type = "sunny"
  if (precipProb > 50) {
    type = "rainy"
  } else if (cloudCover > 70) {
    type = "cloudy"
  } else if (temp > 35) {
    type = "hot"
  } else if (cloudCover > 30) {
    type = "partly-cloudy"
  }

  // Common animation style block
  const styleBlock = (
    <style dangerouslySetInnerHTML={{ __html: `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-4px); }
      }
      @keyframes rain {
        0% { transform: translateY(-10px); opacity: 0; }
        50% { opacity: 1; }
        100% { transform: translateY(8px); opacity: 0; }
      }
      @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 0.9; }
        50% { transform: scale(1.06); opacity: 1; }
      }
      .anim-spin { animation: spin 20s linear infinite; transform-origin: center; }
      .anim-float { animation: float 4s ease-in-out infinite; }
      .anim-rain-1 { animation: rain 1.5s infinite linear; }
      .anim-rain-2 { animation: rain 1.5s infinite linear; animation-delay: 0.5s; }
      .anim-rain-3 { animation: rain 1.5s infinite linear; animation-delay: 1s; }
      .anim-pulse { animation: pulse 3s ease-in-out infinite; transform-origin: center; }
    ` }} />
  )

  switch (type) {
    case "rainy":
      return (
        <div className="relative flex items-center justify-center anim-float" style={{ width: size, height: size }}>
          {styleBlock}
          <svg className="w-full h-full text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 18a5 5 0 0 0-1-9.9c-.2-.6-.5-1.2-1-1.7s-1.1-.8-1.7-1a5 5 0 0 0-8.9 2.1A5 5 0 0 0 6 18h11z" fill="currentColor" fillOpacity="0.1" />
            <line className="anim-rain-1" x1="8" y1="19" x2="8" y2="21" stroke="#38bdf8" />
            <line className="anim-rain-2" x1="12" y1="19" x2="12" y2="21" stroke="#38bdf8" />
            <line className="anim-rain-3" x1="16" y1="19" x2="16" y2="21" stroke="#38bdf8" />
          </svg>
        </div>
      )
    case "cloudy":
      return (
        <div className="relative flex items-center justify-center anim-float" style={{ width: size, height: size }}>
          {styleBlock}
          <svg className="w-full h-full text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 18a5 5 0 0 0-1-9.9c-.2-.6-.5-1.2-1-1.7s-1.1-.8-1.7-1a5 5 0 0 0-8.9 2.1A5 5 0 0 0 6 18h11z" fill="currentColor" fillOpacity="0.2" />
          </svg>
        </div>
      )
    case "hot":
      return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
          {styleBlock}
          <svg className="w-full h-full text-amber-500 anim-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="5" fill="currentColor" fillOpacity="0.3" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
          <div className="absolute inset-0 anim-pulse bg-amber-500/10 rounded-full blur-xl -z-10" />
        </div>
      )
    case "partly-cloudy":
      return (
        <div className="relative flex items-center justify-center anim-float" style={{ width: size, height: size }}>
          {styleBlock}
          <svg className="w-2/3 h-2/3 text-amber-500 absolute top-1 left-1 anim-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="5" fill="currentColor" fillOpacity="0.3" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
          </svg>
          <svg className="w-3/4 h-3/4 text-slate-300 absolute bottom-1 right-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 18a5 5 0 0 0-1-9.9c-.2-.6-.5-1.2-1-1.7s-1.1-.8-1.7-1a5 5 0 0 0-8.9 2.1A5 5 0 0 0 6 18h11z" fill="currentColor" fillOpacity="0.4" />
          </svg>
        </div>
      )
    default:
      return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
          {styleBlock}
          <svg className="w-full h-full text-yellow-400 anim-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="5" fill="currentColor" fillOpacity="0.3" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
          <div className="absolute inset-0 anim-pulse bg-yellow-400/10 rounded-full blur-xl -z-10" />
        </div>
      )
  }
}
