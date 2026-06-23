import React, { useEffect, useState } from "react"
import {
  ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, LineChart, Line, Cell, Legend
} from "recharts"
import { fetchClusterScatter, fetchElbow } from "../api"

const CLUSTER_COLORS = [
  "#6366f1", "#f59e0b", "#10b981", "#ef4444",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"
]

export default function WeatherClusters() {
  const [activeTab, setActiveTab] = useState("scatter")
  const [scatterData, setScatterData] = useState(null)
  const [elbowData, setElbowData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [xAxis, setXAxis] = useState("temperature")
  const [yAxis, setYAxis] = useState("humidity")

  const featureOptions = [
    { key: "temperature", label: "Temperature (°C)" },
    { key: "humidity", label: "Humidity (%)" },
    { key: "precipitation", label: "Precipitation (mm)" },
    { key: "wind_speed", label: "Wind Speed (km/h)" },
    { key: "uv_index", label: "UV Index" },
    { key: "apparent_temperature", label: "Feels Like (°C)" },
  ]

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [scatterRes, elbowRes] = await Promise.all([
          fetchClusterScatter(500),
          fetchElbow()
        ])
        setScatterData(scatterRes.data)
        setElbowData(elbowRes.data || [])
      } catch (err) {
        console.error("Failed to load cluster data", err)
        setError("No clustering data available. Run historical_fetch.py first.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="card-base" style={{padding: "48px", textAlign: "center", marginTop: "24px"}}>
        <div style={{fontSize: "14px", color: "var(--c-text-muted)"}}>Loading cluster analysis...</div>
      </div>
    )
  }

  if (error || !scatterData || !scatterData.points || scatterData.points.length === 0) {
    return (
      <div className="card-base" style={{padding: "48px", textAlign: "center", marginTop: "24px"}}>
        <h3 className="section-title" style={{marginBottom: "8px"}}>Weather Pattern Clusters</h3>
        <div style={{fontSize: "13px", color: "var(--c-text-muted)"}}>
          {error || "No historical data available. Run historical_fetch.py to populate."}
        </div>
      </div>
    )
  }

  const clusters = scatterData.clusters || []
  const points = scatterData.points || []

  const tabs = [
    { id: "scatter", label: "Cluster Scatter" },
    { id: "elbow", label: "Elbow Method" },
  ]

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null
    const d = payload[0]?.payload
    if (!d) return null
    const cluster = clusters.find(c => c.id === d.cluster)
    return (
      <div style={{
        background: "var(--c-surface)",
        border: "1px solid var(--c-border)",
        borderRadius: "var(--radius-md)",
        padding: "12px",
        boxShadow: "var(--shadow-lg)",
        fontSize: "12px"
      }}>
        <div style={{fontWeight: "700", color: CLUSTER_COLORS[d.cluster % CLUSTER_COLORS.length], marginBottom: "6px"}}>
          {cluster?.label || `Cluster ${d.cluster}`}
        </div>
        <div style={{color: "var(--c-text-secondary)"}}>Temp: {d.temperature}°C</div>
        <div style={{color: "var(--c-text-secondary)"}}>Humidity: {d.humidity}%</div>
        <div style={{color: "var(--c-text-secondary)"}}>Precip: {d.precipitation} mm</div>
        <div style={{color: "var(--c-text-secondary)"}}>Wind: {d.wind_speed} km/h</div>
        <div style={{color: "var(--c-text-secondary)"}}>UV: {d.uv_index}</div>
      </div>
    )
  }

  const ElbowTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null
    const d = payload[0]?.payload
    return (
      <div style={{
        background: "var(--c-surface)",
        border: "1px solid var(--c-border)",
        borderRadius: "var(--radius-md)",
        padding: "12px",
        boxShadow: "var(--shadow-lg)",
        fontSize: "12px"
      }}>
        <div style={{color: "var(--c-text-primary)", fontWeight: "600"}}>K = {d.k}</div>
        <div style={{color: "var(--c-text-secondary)"}}>Inertia: {d.inertia.toLocaleString()}</div>
      </div>
    )
  }

  const AxisSelector = ({ label, value, onChange }) => (
    <div style={{display: "flex", alignItems: "center", gap: "8px"}}>
      <span style={{fontSize: "12px", color: "var(--c-text-muted)", fontWeight: "600"}}>{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: "var(--c-surface)",
          color: "var(--c-text-primary)",
          border: "1px solid var(--c-border)",
          padding: "4px 8px",
          borderRadius: "var(--radius-sm)",
          fontSize: "12px",
          cursor: "pointer",
          outline: "none"
        }}
      >
        {featureOptions.map(f => (
          <option key={f.key} value={f.key}>{f.label}</option>
        ))}
      </select>
    </div>
  )

  return (
    <div className="card-base" style={{padding: "32px", marginTop: "24px"}}>
      {/* Header */}
      <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px"}}>
        <div>
          <h3 className="section-title" style={{margin: 0}}>Weather Pattern Clusters</h3>
          <p style={{fontSize: "12px", color: "var(--c-text-secondary)", marginTop: "4px"}}>
            K-Means Clustering • {scatterData.n_clusters} Patterns Identified • {points.length} Data Points
          </p>
        </div>
        <div style={{display: "flex", gap: "8px", background: "var(--c-surface-hover)", padding: "4px", borderRadius: "var(--radius-md)"}}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id ? "var(--c-surface)" : "transparent",
                border: activeTab === tab.id ? "1px solid var(--c-border)" : "1px solid transparent",
                color: activeTab === tab.id ? "var(--c-text-primary)" : "var(--c-text-secondary)",
                padding: "6px 16px",
                borderRadius: "var(--radius-sm)",
                fontSize: "12px",
                fontWeight: activeTab === tab.id ? "600" : "500",
                cursor: "pointer",
                boxShadow: activeTab === tab.id ? "var(--shadow-sm)" : "none",
                transition: "all 0.2s"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cluster Legend */}
      <div style={{display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "24px"}}>
        {clusters.map((c, i) => (
          <div key={c.id} style={{display: "flex", alignItems: "center", gap: "8px"}}>
            <div style={{
              width: "12px", height: "12px", borderRadius: "50%",
              background: CLUSTER_COLORS[i % CLUSTER_COLORS.length]
            }} />
            <span style={{fontSize: "13px", color: "var(--c-text-secondary)", fontWeight: "500"}}>
              {c.label} ({c.count})
            </span>
          </div>
        ))}
      </div>

      {/* SCATTER TAB */}
      {activeTab === "scatter" && (
        <>
          <div style={{display: "flex", gap: "24px", marginBottom: "16px", flexWrap: "wrap"}}>
            <AxisSelector label="X-Axis" value={xAxis} onChange={setXAxis} />
            <AxisSelector label="Y-Axis" value={yAxis} onChange={setYAxis} />
          </div>
          <div style={{width: "100%", height: "420px"}}>
            <ResponsiveContainer>
              <ScatterChart margin={{ top: 20, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
                <XAxis
                  dataKey={xAxis}
                  type="number"
                  name={featureOptions.find(f => f.key === xAxis)?.label}
                  tick={{fill: "var(--c-text-muted)", fontSize: 11}}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  dataKey={yAxis}
                  type="number"
                  name={featureOptions.find(f => f.key === yAxis)?.label}
                  tick={{fill: "var(--c-text-muted)", fontSize: 11}}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Scatter data={points} fill="#8884d8">
                  {points.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CLUSTER_COLORS[entry.cluster % CLUSTER_COLORS.length]}
                      fillOpacity={0.6}
                      r={4}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* ELBOW TAB */}
      {activeTab === "elbow" && (
        <div style={{width: "100%", height: "420px"}}>
          {elbowData.length > 0 ? (
            <ResponsiveContainer>
              <LineChart data={elbowData} margin={{ top: 20, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
                <XAxis
                  dataKey="k"
                  tick={{fill: "var(--c-text-muted)", fontSize: 12}}
                  axisLine={false}
                  tickLine={false}
                  label={{ value: "Number of Clusters (K)", position: "insideBottom", offset: -5, style: { fill: "var(--c-text-muted)", fontSize: 12 } }}
                />
                <YAxis
                  tick={{fill: "var(--c-text-muted)", fontSize: 12}}
                  axisLine={false}
                  tickLine={false}
                  label={{ value: "Inertia", angle: -90, position: "insideLeft", style: { fill: "var(--c-text-muted)", fontSize: 12 } }}
                />
                <Tooltip content={<ElbowTooltip />} />
                <Line
                  type="monotone"
                  dataKey="inertia"
                  stroke="var(--c-primary)"
                  strokeWidth={2}
                  dot={{ fill: "var(--c-primary)", r: 5, strokeWidth: 2, stroke: "var(--c-surface)" }}
                  activeDot={{ r: 7, stroke: "var(--c-primary)", strokeWidth: 2, fill: "var(--c-surface)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{display: "flex", alignItems: "center", justifyContent: "center", height: "100%"}}>
              <span style={{color: "var(--c-text-muted)", fontSize: "14px"}}>No elbow data available.</span>
            </div>
          )}
        </div>
      )}

      {/* CLUSTER SUMMARY TABLE */}
      <div style={{marginTop: "32px"}}>
        <h4 style={{fontSize: "14px", fontWeight: "700", color: "var(--c-text-primary)", marginBottom: "16px"}}>
          Cluster Summary
        </h4>
        <div style={{overflowX: "auto"}}>
          <table style={{width: "100%", borderCollapse: "collapse", fontSize: "13px"}}>
            <thead>
              <tr style={{borderBottom: "2px solid var(--c-border)"}}>
                <th style={{textAlign: "left", padding: "12px 16px", color: "var(--c-text-secondary)", fontWeight: "600"}}>Cluster</th>
                <th style={{textAlign: "right", padding: "12px 16px", color: "var(--c-text-secondary)", fontWeight: "600"}}>Records</th>
                <th style={{textAlign: "right", padding: "12px 16px", color: "var(--c-text-secondary)", fontWeight: "600"}}>Avg Temp</th>
                <th style={{textAlign: "right", padding: "12px 16px", color: "var(--c-text-secondary)", fontWeight: "600"}}>Avg Humidity</th>
                <th style={{textAlign: "right", padding: "12px 16px", color: "var(--c-text-secondary)", fontWeight: "600"}}>Avg Precip</th>
                <th style={{textAlign: "right", padding: "12px 16px", color: "var(--c-text-secondary)", fontWeight: "600"}}>Avg Wind</th>
                <th style={{textAlign: "right", padding: "12px 16px", color: "var(--c-text-secondary)", fontWeight: "600"}}>Avg UV</th>
              </tr>
            </thead>
            <tbody>
              {clusters.map((c, i) => (
                <tr key={c.id} style={{borderBottom: "1px solid var(--c-border)", transition: "background 0.2s"}}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--c-surface-hover)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{padding: "12px 16px"}}>
                    <div style={{display: "flex", alignItems: "center", gap: "10px"}}>
                      <div style={{
                        width: "10px", height: "10px", borderRadius: "50%",
                        background: CLUSTER_COLORS[i % CLUSTER_COLORS.length],
                        flexShrink: 0
                      }} />
                      <span style={{fontWeight: "600", color: "var(--c-text-primary)"}}>{c.label}</span>
                    </div>
                  </td>
                  <td style={{textAlign: "right", padding: "12px 16px", color: "var(--c-text-secondary)", fontWeight: "600"}}>{c.count}</td>
                  <td style={{textAlign: "right", padding: "12px 16px", color: "var(--c-text-secondary)"}}>{c.center.temperature}°C</td>
                  <td style={{textAlign: "right", padding: "12px 16px", color: "var(--c-text-secondary)"}}>{c.center.humidity}%</td>
                  <td style={{textAlign: "right", padding: "12px 16px", color: "var(--c-text-secondary)"}}>{c.center.precipitation} mm</td>
                  <td style={{textAlign: "right", padding: "12px 16px", color: "var(--c-text-secondary)"}}>{c.center.wind_speed} km/h</td>
                  <td style={{textAlign: "right", padding: "12px 16px", color: "var(--c-text-secondary)"}}>{c.center.uv_index}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
