import React, { useEffect, useState } from "react"
import {
  ResponsiveContainer, CartesianGrid, LineChart, Line,
  XAxis, YAxis, Tooltip
} from "recharts"
import Plotly from "plotly.js-dist-min"
import createPlotlyComponent from "react-plotly.js/factory"
import { fetchClusterScatter, fetchElbow, fetchCurrentCluster, fetchClusterDescriptions, fetchPCA } from "../api"

const Plot = createPlotlyComponent(Plotly)

const CLUSTER_COLORS = [
  "#6366f1", "#f59e0b", "#10b981", "#ef4444",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"
]

export default function WeatherClusters() {
  const [activeTab, setActiveTab] = useState("scatter")
  const [scatterData, setScatterData] = useState(null)
  const [elbowData, setElbowData] = useState([])
  const [currentCluster, setCurrentCluster] = useState(null)
  const [clusterDescs, setClusterDescs] = useState(null)
  const [descsLoading, setDescsLoading] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [scatterMode, setScatterMode] = useState("features") // "features" or "pca"
  const [pcaData, setPcaData] = useState(null)
  const [pcaLoading, setPcaLoading] = useState(false)

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

  // Load PCA data when mode switches to PCA
  useEffect(() => {
    if (scatterMode !== "pca" || pcaData) return
    async function loadPCA() {
      setPcaLoading(true)
      try {
        const res = await fetchPCA()
        setPcaData(res.data)
      } catch (err) {
        console.error("Failed to load PCA data", err)
      } finally {
        setPcaLoading(false)
      }
    }
    loadPCA()
  }, [scatterMode, pcaData])

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
  const activeClusterId = currentCluster?.cluster_id

  const tabs = [
    { id: "scatter", label: "Cluster Scatter" },
    { id: "elbow", label: "Elbow Method" },
  ]

  // Build Plotly 3D scatter traces for Feature Axes mode
  const build3DFeatureTraces = () => {
    const traces = []
    // Group points by cluster
    const grouped = {}
    points.forEach(p => {
      if (!grouped[p.cluster]) grouped[p.cluster] = []
      grouped[p.cluster].push(p)
    })

    Object.keys(grouped).forEach(cid => {
      const clusterPoints = grouped[cid]
      const cluster = clusters.find(c => c.id === parseInt(cid))
      const color = CLUSTER_COLORS[parseInt(cid) % CLUSTER_COLORS.length]
      traces.push({
        type: "scatter3d",
        mode: "markers",
        name: cluster?.label || `Cluster ${cid}`,
        x: clusterPoints.map(p => p.humidity),
        y: clusterPoints.map(p => p.temperature),
        z: clusterPoints.map(p => p.precipitation),
        marker: {
          size: 3,
          color: color,
          opacity: 0.6,
        },
        hovertemplate:
          `<b>${cluster?.label}</b><br>` +
          "Humidity: %{x}%<br>" +
          "Temp: %{y}\u00b0C<br>" +
          "Precip: %{z}mm<br>" +
          "<extra></extra>"
      })
    })

    // Add current reading as white star
    if (currentCluster) {
      const c = currentCluster.conditions
      traces.push({
        type: "scatter3d",
        mode: "markers",
        name: "Current Reading",
        x: [c?.humidity ?? 0],
        y: [c?.temperature ?? 0],
        z: [c?.precip_prob ?? 0],
        marker: {
          size: 10,
          color: "#ffffff",
          symbol: "diamond",
          line: { color: "#ffffff", width: 2 },
        },
        hovertemplate:
          "<b>Current Reading</b><br>" +
          "Humidity: %{x}%<br>" +
          "Temp: %{y}\u00b0C<br>" +
          "Precip: %{z}mm<br>" +
          "<extra></extra>"
      })
    }

    return traces
  }

  // Build Plotly 3D scatter traces for PCA mode
  const build3DPCATraces = () => {
    if (!pcaData || !pcaData.points) return []
    const traces = []
    const grouped = {}
    pcaData.points.forEach(p => {
      if (!grouped[p.cluster]) grouped[p.cluster] = []
      grouped[p.cluster].push(p)
    })

    Object.keys(grouped).forEach(cid => {
      const clusterPoints = grouped[cid]
      const color = CLUSTER_COLORS[parseInt(cid) % CLUSTER_COLORS.length]
      const label = clusterPoints[0]?.cluster_label || `Cluster ${cid}`
      traces.push({
        type: "scatter3d",
        mode: "markers",
        name: label,
        x: clusterPoints.map(p => p.pc1),
        y: clusterPoints.map(p => p.pc2),
        z: clusterPoints.map(p => p.pc3),
        marker: {
          size: 3,
          color: color,
          opacity: 0.6,
        },
        hovertemplate:
          `<b>${label}</b><br>` +
          "PC1: %{x:.2f}<br>" +
          "PC2: %{y:.2f}<br>" +
          "PC3: %{z:.2f}<br>" +
          "<extra></extra>"
      })
    })

    return traces
  }

  const variance = pcaData?.variance || [0, 0, 0]

  const featureLayout = {
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    font: { color: "#94a3b8", size: 11 },
    margin: { l: 0, r: 0, t: 30, b: 0 },
    scene: {
      xaxis: { title: "Humidity (%)", gridcolor: "rgba(148,163,184,0.15)", backgroundcolor: "rgba(0,0,0,0)" },
      yaxis: { title: "Temperature (\u00b0C)", gridcolor: "rgba(148,163,184,0.15)", backgroundcolor: "rgba(0,0,0,0)" },
      zaxis: { title: "Precipitation (mm)", gridcolor: "rgba(148,163,184,0.15)", backgroundcolor: "rgba(0,0,0,0)" },
      bgcolor: "rgba(0,0,0,0)",
    },
    legend: { x: 0, y: 1, font: { size: 11 } },
    showlegend: true,
  }

  const pcaLayout = {
    ...featureLayout,
    scene: {
      xaxis: { title: `PC1 (${variance[0]}%)`, gridcolor: "rgba(148,163,184,0.15)", backgroundcolor: "rgba(0,0,0,0)" },
      yaxis: { title: `PC2 (${variance[1]}%)`, gridcolor: "rgba(148,163,184,0.15)", backgroundcolor: "rgba(0,0,0,0)" },
      zaxis: { title: `PC3 (${variance[2]}%)`, gridcolor: "rgba(148,163,184,0.15)", backgroundcolor: "rgba(0,0,0,0)" },
      bgcolor: "rgba(0,0,0,0)",
    },
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

  const ModeToggle = ({ value, onChange }) => (
    <div style={{display: "flex", gap: "4px", background: "var(--c-surface-hover)", padding: "3px", borderRadius: "var(--radius-sm)"}}>
      {[{id: "features", label: "Feature Axes"}, {id: "pca", label: "PCA Projection"}].map(opt => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          style={{
            background: value === opt.id ? "var(--c-surface)" : "transparent",
            border: value === opt.id ? "1px solid var(--c-border)" : "1px solid transparent",
            color: value === opt.id ? "var(--c-text-primary)" : "var(--c-text-muted)",
            padding: "4px 12px",
            borderRadius: "var(--radius-sm)",
            fontSize: "11px",
            fontWeight: value === opt.id ? "600" : "500",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )

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
            K-Means Clustering {"\u2022"} {scatterData.n_clusters} Patterns Identified {"\u2022"} {points.length} Data Points
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
        {currentCluster && (
          <div style={{display: "flex", alignItems: "center", gap: "8px", marginLeft: "8px"}}>
            <div style={{width: "12px", height: "12px", background: "#ffffff", transform: "rotate(45deg)"}} />
            <span style={{fontSize: "13px", color: "var(--c-text-muted)", fontWeight: "500"}}>Current</span>
          </div>
        )}
      </div>

      {/* SCATTER TAB — 3D Plotly */}
      {activeTab === "scatter" && (
        <>
          <div style={{display: "flex", justifyContent: "flex-end", marginBottom: "12px"}}>
            <ModeToggle value={scatterMode} onChange={setScatterMode} />
          </div>
          <div style={{width: "100%", height: "500px"}}>
            {scatterMode === "features" ? (
              <Plot
                data={build3DFeatureTraces()}
                layout={featureLayout}
                config={{ responsive: true, displayModeBar: true, displaylogo: false }}
                style={{ width: "100%", height: "100%" }}
                useResizeHandler
              />
            ) : pcaLoading ? (
              <div style={{display: "flex", alignItems: "center", justifyContent: "center", height: "100%"}}>
                <div style={{fontSize: "14px", color: "var(--c-text-muted)"}}>Computing PCA projection...</div>
              </div>
            ) : pcaData ? (
              <Plot
                data={build3DPCATraces()}
                layout={pcaLayout}
                config={{ responsive: true, displayModeBar: true, displaylogo: false }}
                style={{ width: "100%", height: "100%" }}
                useResizeHandler
              />
            ) : (
              <div style={{display: "flex", alignItems: "center", justifyContent: "center", height: "100%"}}>
                <span style={{color: "var(--c-text-muted)", fontSize: "14px"}}>Failed to load PCA data.</span>
              </div>
            )}
          </div>
          {scatterMode === "pca" && pcaData && (
            <div style={{marginTop: "8px", fontSize: "12px", color: "var(--c-text-muted)", textAlign: "center"}}>
              Total variance explained: {(variance[0] + variance[1] + variance[2]).toFixed(1)}% &mdash;
              PC1: {variance[0]}% &middot; PC2: {variance[1]}% &middot; PC3: {variance[2]}%
            </div>
          )}
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
                    <td style={{textAlign: "right", padding: "12px 16px", color: "var(--c-text-secondary)"}}>{c.center.temperature}{"\u00b0"}C</td>
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
