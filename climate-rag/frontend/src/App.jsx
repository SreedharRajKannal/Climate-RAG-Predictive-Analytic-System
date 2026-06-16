import React, { useEffect, useState } from "react"
import { 
  fetchConditions, 
  fetchAdvisory, 
  fetchForecast, 
  fetchAirQuality,
  fetchDailyForecast,
  updateLocation 
} from "./api"
import CommandPalette from "./components/CommandPalette"
import AiCommandCenter from "./components/AiCommandCenter"
import DailyForecast from "./components/DailyForecast"
import RagTimeline from "./components/RagTimeline"
import TrendAnalysis from "./components/TrendAnalysis"
import ActionCenter from "./components/ActionCenter"
import CompactAqi from "./components/CompactAqi"
import SunVisualizer from "./components/SunVisualizer"
import WeatherAlerts from "./components/WeatherAlerts"
import PredictionAccuracy from "./components/PredictionAccuracy"
import AiPredictionTimeline from "./components/AiPredictionTimeline"
import CurrentWeatherHero from "./components/CurrentWeatherHero"
import HourlyForecast from "./components/HourlyForecast"
import AccuracyValidationChart from "./components/AccuracyValidationChart"

export default function App() {
  const [theme, setTheme] = useState("dark")
  const [conditions, setConditions] = useState(null)
  const [forecast, setForecast] = useState([])
  const [dailyForecast, setDailyForecast] = useState([])
  const [airQuality, setAirQuality] = useState(null)
  
  // AI Advisory State
  const [advisoryData, setAdvisoryData] = useState(null)
  const [retrievedChunks, setRetrievedChunks] = useState([])

  const [coords, setCoords] = useState({ lat: 8.5241, lon: 76.9366 })
  const [errorMsg, setErrorMsg] = useState("")
  const [lastUpdated, setLastUpdated] = useState("")

  // Apply Theme
  useEffect(() => {
    document.body.className = `theme-${theme}`
  }, [theme])

  // Master Data Loader
  const loadData = async (lat, lon) => {
    try {
      setErrorMsg("")
      
      const [condRes, foreRes, dailyRes, aqiRes, advRes] = await Promise.all([
        fetchConditions(lat, lon),
        fetchForecast(lat, lon),
        fetchDailyForecast(lat, lon),
        fetchAirQuality(lat, lon),
        fetchAdvisory(lat, lon)
      ])

      if (condRes.data.error) throw new Error(condRes.data.error)
      setConditions(condRes.data)
      setForecast(foreRes.data || [])
      setDailyForecast(dailyRes.data || [])
      setAirQuality(aqiRes.data || null)

      if (advRes.data) {
        setAdvisoryData(advRes.data.advisory)
        setRetrievedChunks(advRes.data.retrieved_chunks || [])
      }

      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))

    } catch (err) {
      console.error(err)
      setErrorMsg(err.message || "Failed to load climate data.")
    }
  }

  // Initial load
  useEffect(() => {
    loadData(coords.lat, coords.lon)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectCity = async (city) => {
    if (!city || !city.latitude || !city.longitude) return
    const displayName = `${city.name}${city.country ? `, ${city.country}` : ""}`
    setCoords({ lat: city.latitude, lon: city.longitude })
    await updateLocation(city.latitude, city.longitude, displayName)
    await loadData(city.latitude, city.longitude)
  }


    <div className="dashboard-layout">
      {/* HEADER */}
      <header className="dashboard-header" style={{paddingBottom: "16px", borderBottom: "1px solid var(--c-border)"}}>
        <div className="header-logo">
          <div className="logo-icon">✦</div>
          <h1 className="logo-text">Climate Intelligence</h1>
        </div>
        
        <CommandPalette onSelectCity={handleSelectCity} />

        <div className="header-controls">
          <select 
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            style={{
              background: "var(--c-surface)",
              color: "var(--c-text-primary)",
              border: "1px solid var(--c-border)",
              padding: "8px 12px",
              borderRadius: "var(--radius-sm)",
              fontSize: "13px",
              outline: "none",
              cursor: "pointer"
            }}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="amoled">AMOLED</option>
          </select>
        </div>
      </header>
      {errorMsg && <div className="error-banner" style={{color: "var(--c-danger)", padding: "16px", background: "rgba(239, 68, 68, 0.1)", borderRadius: "var(--radius-md)", border: "1px solid var(--c-danger)", marginBottom: "24px"}}>{errorMsg}</div>}

      <main className="dashboard-main" style={{display: "flex", flexDirection: "column", gap: "24px"}}>
        <WeatherAlerts conditions={conditions} />

        {/* 2. CURRENT CONDITIONS HERO */}
        <CurrentWeatherHero conditions={conditions} dailyData={dailyForecast} advisoryData={advisoryData} lastUpdated={lastUpdated} />

        {/* 3. AI ADVISORY */}
        <AiCommandCenter advisoryData={advisoryData} />
        
        {/* 4. AI FORECAST TIMELINE */}
        <AiPredictionTimeline forecast={forecast} />

        {/* 5. FORECAST CONFIDENCE (CHIPS) */}
        <PredictionAccuracy advisoryData={advisoryData} />

        {/* 6. 24 HOUR FORECAST */}
        <HourlyForecast forecast={forecast} />

        {/* 7. 7 DAY FORECAST */}
        <DailyForecast dailyData={dailyForecast} />

        {/* 8. TREND ANALYSIS (PAST 24H) */}
        <TrendAnalysis forecast={forecast} />

        <div className="grid-2col">
          {/* 9. ACTIVITY SCORES */}
          <ActionCenter conditions={conditions} advisoryData={advisoryData} />
          
          <div style={{display: "flex", flexDirection: "column", gap: "24px", marginTop: "16px"}}>
            {/* 10. AQI CARD */}
            <CompactAqi airQuality={airQuality} />

            {/* 12. SUN & MOON */}
            <SunVisualizer 
              sunrise={conditions?.sunrise}
              sunset={conditions?.sunset}
              isDay={conditions?.is_day}
            />
          </div>
        </div>

        {/* 11. RAG EVIDENCE & TRANSPARENCY */}
        <RagTimeline retrievedChunks={retrievedChunks} />

        {/* AI Accuracy Validation (Trust builder) */}
        <AccuracyValidationChart lat={coords.lat} lon={coords.lon} />

      </main>

      <footer style={{textAlign: "center", padding: "40px 0", color: "var(--c-text-muted)", fontSize: "12px", borderTop: "1px solid var(--c-border)", marginTop: "40px"}}>
        <p>AI Climate Intelligence Assistant · Powered by Llama3 & RAG</p>
      </footer>
    </div>
  )
}