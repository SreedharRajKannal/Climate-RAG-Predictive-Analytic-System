import React, { useState } from "react"

export default function AdvisoryPanel({ advisoryText, source, retrievedChunks, conditions }) {
  const [showSources, setShowSources] = useState(false)

  // Generate action chips based on conditions
  const generateActionChips = () => {
    if (!conditions) return []
    const chips = []
    const temp = conditions.temperature ?? 25
    const wind = conditions.wind_speed ?? 10
    const rain = conditions.precip_prob ?? 0
    const uv = conditions.uv_index ?? 3
    const aqi = conditions.aqi ?? 50

    if (temp >= 15 && temp <= 28 && wind < 20 && rain < 10) {
      chips.push({ icon: "✓", text: "Great day for outdoor activities", type: "positive" })
    }
    if (rain > 50) {
      chips.push({ icon: "⚠", text: "Carry an umbrella today", type: "warning" })
    }
    if (uv > 6) {
      chips.push({ icon: "⚠", text: "UV peaks at noon, wear sunscreen", type: "warning" })
    }
    if (aqi < 100) {
      chips.push({ icon: "✓", text: "Air quality suitable for exercise", type: "positive" })
    } else if (aqi >= 100) {
      chips.push({ icon: "⚠", text: "Limit prolonged outdoor exertion", type: "warning" })
    }
    if (temp > 25 && wind < 25 && rain < 10) {
      chips.push({ icon: "✓", text: "Beach conditions are good", type: "positive" })
    }
    
    // Deduplicate and limit to 4
    return chips.slice(0, 4)
  }

  const chips = generateActionChips()
  
  const sourceLabel = source === "alert_engine" ? "Rule Engine" : "RAG · Llama3"
  const sourceColor = source === "alert_engine" ? "#EF4444" : "#8B5CF6"

  return (
    <div className="insights-card">
      <div className="section-header">
        <h3 className="section-title">Smart Insights</h3>
        <span className="insight-source" style={{color: sourceColor, backgroundColor: `${sourceColor}15`, border: `1px solid ${sourceColor}30`}}>
          {sourceLabel}
        </span>
      </div>

      <div className="insight-body">
        <p className="insight-text">{advisoryText || "Loading insights..."}</p>
        
        {chips.length > 0 && (
          <div className="action-center">
            <h4 className="action-center-title">Today's Recommendations</h4>
            <div className="action-chips">
              {chips.map((chip, i) => (
                <div key={i} className={`action-chip action-chip-${chip.type}`}>
                  <span className="action-chip-icon">{chip.icon}</span>
                  <span className="action-chip-text">{chip.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {retrievedChunks && retrievedChunks.length > 0 && (
          <div className="sources-toggle-wrap">
            <button className="sources-toggle" onClick={() => setShowSources(!showSources)}>
              {showSources ? "Hide Sources" : "View Sources"}
            </button>
            {showSources && (
              <div className="sources-list">
                {retrievedChunks.map((chunk, idx) => (
                  <div key={idx} className="source-item">
                    <span className="source-badge">
                      📄 {chunk.filename || `Chunk ${idx + 1}`}
                      {chunk.similarity && ` · ${(chunk.similarity * 100).toFixed(1)}%`}
                    </span>
                    <p className="source-text">{chunk.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}