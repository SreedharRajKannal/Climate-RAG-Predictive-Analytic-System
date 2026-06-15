import React, { useState } from "react"

const SEVERITY_STYLES = {
  Informational: {
    panel: "bg-emerald-950/20 border-emerald-500/40 border-l-4 border-l-emerald-500 text-emerald-200 shadow-emerald-500/5",
    badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    glow: "bg-emerald-500/5",
    icon: (
      <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  Caution: {
    panel: "bg-yellow-950/20 border-yellow-500/40 border-l-4 border-l-yellow-500 text-yellow-200 shadow-yellow-500/5",
    badge: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    glow: "bg-yellow-500/5",
    icon: (
      <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    )
  },
  Warning: {
    panel: "bg-orange-950/20 border-orange-500/40 border-l-4 border-l-orange-500 text-orange-200 shadow-orange-500/5",
    badge: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    glow: "bg-orange-500/5",
    icon: (
      <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    )
  },
  Critical: {
    panel: "bg-red-950/30 border-red-500/60 border-l-4 border-l-red-500 text-red-200 shadow-[0_0_20px_#f8514922] ring-1 ring-red-500/20 anim-pulse-border",
    badge: "bg-red-500/20 text-red-300 border-red-500/40",
    glow: "bg-red-500/10 blur-xl",
    icon: (
      <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    )
  }
}

export default function AdvisoryPanel({ advisory, severity, source, retrievedChunks = [] }) {
  const [showSources, setShowSources] = useState(false)

  if (!advisory) return null

  const style = SEVERITY_STYLES[severity] || SEVERITY_STYLES.Informational

  const styleBlock = (
    <style dangerouslySetInnerHTML={{ __html: `
      @keyframes pulseBorder {
        0%, 100% { border-color: rgba(239, 68, 68, 0.4); box-shadow: 0 0 5px rgba(239, 68, 68, 0.1); }
        50% { border-color: rgba(239, 68, 68, 1); box-shadow: 0 0 20px rgba(248, 81, 73, 0.3); }
      }
      @keyframes flashWarning {
        0%, 100% { opacity: 0.3; transform: scale(0.95); }
        50% { opacity: 1; transform: scale(1.05); }
      }
      .anim-pulse-border {
        animation: pulseBorder 2.5s infinite ease-in-out;
      }
      .anim-flash-warning {
        animation: flashWarning 1.2s infinite ease-in-out;
      }
    ` }} />
  )

  const sourceBadge = source === "alert_engine" 
    ? <span className="text-[9px] font-extrabold px-2 py-0.5 rounded border tracking-wider bg-orange-500/20 text-orange-300 border-orange-500/30">Rule Engine</span>
    : <span className="text-[9px] font-extrabold px-2 py-0.5 rounded border tracking-wider bg-blue-500/20 text-blue-300 border-blue-500/30">RAG · Llama3</span>

  return (
    <div className={`relative overflow-hidden border rounded-2xl p-6 transition-all duration-300 ${style.panel}`}>
      {styleBlock}
      <div className={`absolute -inset-10 ${style.glow} -z-10 rounded-full`} />
      
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-950/40 border border-white/10">
            {style.icon}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">AI Advisory</h3>
            <p className="text-[10px] text-slate-400">
              Generated via {source === "alert_engine" ? "Rule Alert Engine" : "ChromaDB + LLM RAG"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {sourceBadge}
          {severity === "Critical" && (
            <span className="anim-flash-warning text-red-500">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </span>
          )}
          <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full border tracking-widest uppercase ${style.badge}`}>
            {severity}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm leading-relaxed text-slate-200 font-normal">
          {advisory}
        </p>
        
        {source === "alert_engine" && (
          <div className="mt-2 text-[10px] text-red-400 bg-red-500/5 border border-red-500/20 rounded-lg p-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            <span>This advisory originates directly from critical rule engine thresholds.</span>
          </div>
        )}

        {source === "rag" && retrievedChunks.length > 0 && (
          <div className="mt-4 border-t border-white/10 pt-3">
            <button 
              onClick={() => setShowSources(!showSources)}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <svg className={`w-3.5 h-3.5 transition-transform ${showSources ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
              {showSources ? "Hide Sources" : "View Sources"}
            </button>
            {showSources && (
              <div className="mt-3 flex flex-wrap gap-2">
                {retrievedChunks.map((chunk, idx) => (
                  <span 
                    key={idx} 
                    title={chunk.excerpt}
                    className="cursor-help px-2.5 py-1 bg-slate-900/80 border border-slate-700 rounded-md text-[10px] text-slate-300 font-medium hover:border-slate-500 hover:bg-slate-800 transition-colors"
                  >
                    {chunk.source}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}