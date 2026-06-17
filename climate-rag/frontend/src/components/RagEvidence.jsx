import React, { useState } from "react"

export default function RagEvidence({ retrievedChunks }) {
  const [isOpen, setIsOpen] = useState(false)

  if (!retrievedChunks || retrievedChunks.length === 0) return null

  return (
    <div className="rag-accordion">
      <button className="rag-header" onClick={() => setIsOpen(!isOpen)}>
        Why does the AI believe this?
        <span className={`rag-icon ${isOpen ? "open" : ""}`}>▼</span>
      </button>

      {isOpen && (
        <div className="rag-body">
          <h4 className="rag-title">Retrieved Evidence</h4>
          <ul className="rag-list">
            {retrievedChunks.map((chunk, idx) => (
              <li key={idx}>
                <span className="rag-bullet">•</span>
                <span>
                  {chunk.excerpt || chunk.text.substring(0, 150) + "..."}
                  <div style={{ fontSize: "11px", color: "var(--c-text-muted)", marginTop: "4px" }}>
                    Source: {chunk.source || `Document ${idx+1}`}
                  </div>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
