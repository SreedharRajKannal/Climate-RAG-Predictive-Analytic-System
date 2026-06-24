import React, { useEffect, useState } from "react"
import {
  ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, LineChart, Line, Cell
} from "recharts"
import { fetchClusterScatter, fetchElbow, fetchCurrentCluster, fetchClusterDescriptions } from "../api"

const CLUSTER_COLORS = [
  "#6366f1", "#f59e0b", "#10b981", "#ef4444",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"
]

// Custom diamond shape for the "current reading" marker
const DiamondDot = (props) => {
  const { cx, cy } = props
  if (!cx || !cy) return null
  return (
    <polygon
      points={`${cx},${cy-10} ${cx+8},${cy} ${cx},${cy+10} ${cx-8},${cy}`}
      fill="#ffffff"
      stroke="#ffffff"
      strokeWidth={2}
      filter="drop-shadow(0 0 6px rgba(255,255,255,0.8))"
    />
  )
}

export default function WeatherClusters() {
  const [activeTab, setActiveTab] = useState("scatter")
  const [scatterData, setScatterData] = useState(null)
  const [elbowData, setElbowData] = useState([])
  const [currentCluster, setCurrentCluster] = useState(null)
  const [clusterDescs, setClusterDescs] = useState(null)
  const [descsLoading, setDescsLoading] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [xAxis, setXAxis] = useState("temperature")
  const [yAxis, setYAxis] = useState("humidity")

  const featureOptions = [
    { key: "temperature", label: "Temperature (\u00b0C)" },
    { key: "humidity", label: "Humidity (%)" },
    { key: "precipitation", label: "Precipitation (mm)" },
    { key: "wind_speed", label: "Wind Speed (km/h)" },
    { key: "uv_index", label: "UV Index" },
    { key: "apparent_temperature", label: "Feels Like (\u00b0C)" },
  ]

  // Load scatter + elbow data on mount
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

  // Load current cluster on mount and every 15 minutes
  useEffect(() => {
    async function loadCurrent() {
      try {
        const res = await fetchCurrentCluster()
        setCurrentCluster(res.data)
      } catch (err) {
        console.error("Failed to load current cluster", err)
      }
    }
    loadCurrent()
    const interval = setInterval(loadCurrent, 15 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Load cluster descriptions on mount
  useEffect(() => {
    async function loadDescs() {
      setDescsLoading(true)
      try {
        const res = await fetchClusterDescriptions()
        setClusterDescs(res.data?.descriptions || [])
      } catch (err) {
        console.error("Failed to load cluster descriptions", err)
      } finally {
        setDescsLoading(false)
      }
    }
    loadDescs()
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

  // Build current reading point for the scatter chart
  const currentPoint = currentCluster ? {
    [xAxis]: currentCluster.conditions?.[xAxis] ?? currentCluster.conditions?.temperature ?? 0,
    [yAxis]: currentCluster.conditions?.[yAxis] ?? currentCluster.conditions?.humidity ?? 0,
    cluster: currentCluster.cluster_id,
    isCurrent: true,
    temperature: currentCluster.conditions?.temperature,
    humidity: currentCluster.conditions?.humidity,
    precipitation: currentCluster.conditions?.precip_prob,
    wind_speed: currentCluster.conditions?.wind_speed,
    uv_index: currentCluster.conditions?.uv_index,
    apparent_temperature: currentCluster.conditions?.apparent_temperature,
  } : null

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
        {d.isCurrent && (
          <div style={{fontWeight: "700", color: "#ffffff", marginBottom: "4px", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px"}}>
            Current Reading
          </div>
        )}
        <div style={{fontWeight: "700", color: CLUSTER_COLORS[d.cluster % CLUSTER_COLORS.length], marginBottom: "6px"}}>
          {cluster?.label || `Cluster ${d.cluster}`}
        </div>
        <div style={{color: "var(--c-text-secondary)"}}>Temp: {d.temperature}\u00b0C</div>
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

  const activeClusterId = currentCluster?.cluster_id

  return (
    <div className="card-base" style={{padding: "32px", marginTop: "24px"}}>

      {/* CURRENT CLUSTER BANNER */}
      {currentCluster && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          padding: "16px 20px",
          marginBottom: "24px",
          background: "var(--c-surface-hover)",
          borderRadius: "var(--radius-md)",
          borderLeft: `4px solid ${CLUSTER_COLORS[currentCluster.cluster_id % CLUSTER_COLORS.length]}`
        }}>
          <div style={{
            padding: "4px 14px",
            borderRadius: "var(--radius-full)",
            background: CLUSTER_COLORS[currentCluster.cluster_id % CLUSTER_COLORS.length],
            color: "#fff",
            fontSize: "13px",
            fontWeight: "700",
            whiteSpace: "nowrap"
          }}>
            {currentCluster.cluster_label}
          </div>
          <div style={{fontSize: "14px", color: "var(--c-text-secondary)", lineHeight: "1.4"}}>
            {currentCluster.description}
          </div>
        </div>
      )}

      {/* CLUSTER DESCRIPTIONS 2x2 GRID */}
      {descsLoading ? (
        <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px"}}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{
              padding: "20px",
              background: "var(--c-surface-hover)",
              borderRadius: "var(--radius-md)",
              borderLeft: "4px solid var(--c-border)",
              minHeight: "80px",
              animation: "pulse 1.5s ease-in-out infinite"
            }}>
              <div style={{width: "120px", height: "14px", background: "var(--c-border)", borderRadius: "4px", marginBottom: "12px"}} />
              <div style={{width: "100%", height: "12px", background: "var(--c-border)", borderRadius: "4px", marginBottom: "8px"}} />
              <div style={{width: "80%", height: "12px", background: "var(--c-border)", borderRadius: "4px"}} />
            </div>
          ))}
          <style>{`@keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }`}</style>
        </div>
      ) : clusterDescs && clusterDescs.length > 0 ? (
        <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px"}}>
          {clusterDescs.map((desc, i) => {
            const isActive = desc.cluster_id === activeClusterId
            const color = CLUSTER_COLORS[desc.cluster_id % CLUSTER_COLORS.length]
            return (
              <div key={desc.cluster_id} style={{
                padding: "20px",
                background: isActive ? `${color}11` : "var(--c-surface-hover)",
                borderRadius: "var(--radius-md)",
                borderLeft: `4px solid ${color}`,
                boxShadow: isActive ? `0 0 20px ${color}22, inset 0 0 20px ${color}08` : "none",
                transition: "all 0.3s ease"
              }}>
                <div style={{
                  fontSize: "14px",
                  fontWeight: "700",
                  color: color,
                  marginBottom: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  {desc.cluster_label}
                  {isActive && (
                    <span style={{
                      fontSize: "10px",
                      fontWeight: "600",
                      padding: "2px 8px",
                      borderRadius: "var(--radius-full)",
                      background: color,
                      color: "#fff",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px"
                    }}>NOW</span>
                  )}
                </div>
                <div style={{fontSize: "13px", color: "var(--c-text-secondary)", lineHeight: "1.5"}}>
                  {desc.description}
                </div>
              </div>
            )
          })}
        </div>
      ) : null}

      {/* Header */}
      <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px"}}>
        <div>
          <h3 className="section-title" style={{margin: 0}}>Weather Pattern Clusters</h3>
          <p style={{fontSize: "12px", color: "var(--c-text-secondary)", marginTop: "4px"}}>
            K-Means Clustering \u2022 {scatterData.n_clusters} Patterns Identified \u2022 {points.length} Data Points
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

      {/* Cluster Legend — active cluster is bold/underlined */}
      <div style={{display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "24px", alignItems: "center"}}>
        {clusters.map((c, i) => {
          const isActive = c.id === activeClusterId
          return (
            <div key={c.id} style={{display: "flex", alignItems: "center", gap: "8px"}}>
              <div style={{
                width: "12px", height: "12px", borderRadius: "50%",
                background: CLUSTER_COLORS[i % CLUSTER_COLORS.length],
                boxShadow: isActive ? `0 0 8px ${CLUSTER_COLORS[i % CLUSTER_COLORS.length]}` : "none"
              }} />
              <span style={{
                fontSize: "13px",
                color: isActive ? "var(--c-text-primary)" : "var(--c-text-secondary)",
                fontWeight: isActive ? "700" : "500",
                textDecoration: isActive ? "underline" : "none",
                textUnderlineOffset: "3px"
              }}>
                {c.label} ({c.count}){isActive ? " \u25c6" : ""}
              </span>
            </div>
          )
        })}
        {currentPoint && (
          <div style={{display: "flex", alignItems: "center", gap: "8px", marginLeft: "8px"}}>
            <div style={{width: "12px", height: "12px", background: "#ffffff", transform: "rotate(45deg)"}} />
            <span style={{fontSize: "13px", color: "var(--c-text-muted)", fontWeight: "500"}}>Current</span>
          </div>
        )}
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
                {/* Historical data points */}
                <Scatter data={points} fill="#8884d8">
                  {points.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CLUSTER_COLORS[entry.cluster % CLUSTER_COLORS.length]}
                      fillOpacity={0.5}
                      r={3}
                    />
                  ))}
                </Scatter>
                {/* Current reading as white diamond */}
                {currentPoint && (
                  <Scatter
                    data={[currentPoint]}
                    shape={<DiamondDot />}
                    fill="#ffffff"
                  />
                )}
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
              {clusters.map((c, i) => {
                const isActive = c.id === activeClusterId
                return (
                  <tr key={c.id}
                    style={{
                      borderBottom: "1px solid var(--c-border)",
                      transition: "background 0.2s",
                      background: isActive ? "rgba(99, 102, 241, 0.08)" : "transparent"
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = isActive ? "rgba(99, 102, 241, 0.12)" : "var(--c-surface-hover)"}
                    onMouseLeave={e => e.currentTarget.style.background = isActive ? "rgba(99, 102, 241, 0.08)" : "transparent"}>
                    <td style={{padding: "12px 16px"}}>
                      <div style={{display: "flex", alignItems: "center", gap: "10px"}}>
                        <div style={{
                          width: "10px", height: "10px", borderRadius: "50%",
                          background: CLUSTER_COLORS[i % CLUSTER_COLORS.length],
                          flexShrink: 0
                        }} />
                        <span style={{
                          fontWeight: isActive ? "700" : "600",
                          color: "var(--c-text-primary)",
                          textDecoration: isActive ? "underline" : "none",
                          textUnderlineOffset: "3px"
                        }}>
                          {c.label} {isActive ? "\u25c6" : ""}
                        </span>
                      </div>
                    </td>
                    <td style={{textAlign: "right", padding: "12px 16px", color: "var(--c-text-secondary)", fontWeight: "600"}}>{c.count}</td>
                    <td style={{textAlign: "right", padding: "12px 16px", color: "var(--c-text-secondary)"}}>{c.center.temperature}\u00b0C</td>
                    <td style={{textAlign: "right", padding: "12px 16px", color: "var(--c-text-secondary)"}}>{c.center.humidity}%</td>
                    <td style={{textAlign: "right", padding: "12px 16px", color: "var(--c-text-secondary)"}}>{c.center.precipitation} mm</td>
                    <td style={{textAlign: "right", padding: "12px 16px", color: "var(--c-text-secondary)"}}>{c.center.wind_speed} km/h</td>
                    <td style={{textAlign: "right", padding: "12px 16px", color: "var(--c-text-secondary)"}}>{c.center.uv_index}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
