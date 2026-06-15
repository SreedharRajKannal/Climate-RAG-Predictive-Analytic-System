import React, { useEffect, useState } from "react"
import { 
  fetchConditions, 
  fetchAdvisory, 
  fetchComparison, 
  updateLocation,
  fetchOpenMeteoHistory,
  fetchOpenMeteoForecast
} from "./api"
import ConditionCard from "./components/ConditionCard"
import ThermalStressCard from "./components/ThermalStressCard"
import AdvisoryPanel from "./components/AdvisoryPanel"
import TrendChart from "./components/TrendChart"
import ComparisonChart from "./components/ComparisonChart"
import SunVisualizer from "./components/SunVisualizer"
import WeatherIcon from "./components/WeatherIcon"
import FuturePredictionChart from "./components/FuturePredictionChart"
import axios from "axios"

export default function App() {
  const [conditions, setConditions] = useState(null)
  const [history, setHistory] = useState([])
  const [forecast, setForecast] = useState([])
  const [comparison, setComparison] = useState([])
  const [advisory, setAdvisory] = useState(null)
  const [severity, setSeverity] = useState("Informational")
  const [source, setSource] = useState("rag")
  const [retrievedChunks, setRetrievedChunks] = useState([])
  const [timezoneAbbr, setTimezoneAbbr] = useState("")
  const [utcOffsetSeconds, setUtcOffsetSeconds] = useState(0)

  // Location search state
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  // Target coordinates state
  const [coords, setCoords] = useState(null)

  const loadData = async (targetCoords = coords) => {
    setIsUpdating(true)
    try {
      const lat = targetCoords?.lat
      const lon = targetCoords?.lon
      const [cond, hist, adv, fore, comp] = await Promise.all([
        fetchConditions(lat, lon),
        fetchOpenMeteoHistory(lat, lon),
        fetchAdvisory(lat, lon),
        fetchOpenMeteoForecast(lat, lon),
        fetchComparison(lat, lon)
      ])
      
      setConditions(cond.data)
      setTimezoneAbbr(cond.data.timezone_abbreviation || "UTC")
      setUtcOffsetSeconds(cond.data.utc_offset_seconds || 0)
      
      // Filter history for exactly the last 24h
      const now = new Date()
      if (hist.data && hist.data.hourly) {
        const offsetMs = (cond.data.utc_offset_seconds || 0) * 1000
        const hTimes = hist.data.hourly.time
        const filteredHistory = []
        for (let i = 0; i < hTimes.length; i++) {
          // parse local string by assuming UTC then adding offset
          const tDate = new Date(hTimes[i] + "Z")
          const realDate = new Date(tDate.getTime() - offsetMs)
          const diffMs = now - realDate
          if (diffMs >= 0 && diffMs <= 24 * 3600 * 1000) {
            filteredHistory.push({
              time: hTimes[i],
              temperature: hist.data.hourly.temperature_2m[i],
              humidity: hist.data.hourly.relative_humidity_2m[i],
              uv_index: hist.data.hourly.uv_index ? hist.data.hourly.uv_index[i] : 0,
              precip_prob: hist.data.hourly.precipitation_probability[i]
            })
          }
        }
        setHistory(filteredHistory)
      }

      // Filter forecast for exactly the next 24h
      if (fore.data && fore.data.hourly) {
        const offsetMs = (cond.data.utc_offset_seconds || 0) * 1000
        const fTimes = fore.data.hourly.time
        const filteredForecast = []
        for (let i = 0; i < fTimes.length; i++) {
          const tDate = new Date(fTimes[i] + "Z")
          const realDate = new Date(tDate.getTime() - offsetMs)
          const diffMs = realDate - now
          if (diffMs > 0 && diffMs <= 24 * 3600 * 1000) {
            filteredForecast.push({
              time: fTimes[i],
              temperature: fore.data.hourly.temperature_2m[i],
              precip_prob: fore.data.hourly.precipitation_probability[i]
            })
          }
        }
        setForecast(filteredForecast)
      }

      setAdvisory(adv.data.advisory)
      setSeverity(adv.data.severity)
      setSource(adv.data.source)
      setRetrievedChunks(adv.data.retrieved_chunks || [])
      
      if (!comp.data.error) setComparison(comp.data.error ? [] : comp.data)
    } catch (e) {
      console.error("Error loading dashboard data", e)
    } finally {
      setIsUpdating(false)
    }
  }

  useEffect(() => {
    loadData()

    const ws = new WebSocket("ws://localhost:8000/ws")
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data)
      if (msg.type === "conditions") {
        setConditions(msg.data)
      }
    }

    const interval = setInterval(() => {
      loadData()
    }, 15 * 60 * 1000)

    return () => {
      ws.close()
      clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords])

  // Geocoding city search handler (autocomplete on type)
  const handleSearchChange = async (e) => {
    const query = e.target.value
    setSearchQuery(query)

    if (query.trim().length < 2) {
      setSearchResults([])
      return
    }

    setSearchLoading(true)
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`
      const res = await axios.get(url)
      setSearchResults(res.data.results || [])
      setShowDropdown(true)
    } catch (err) {
      console.error("Geocoding error", err)
    } finally {
      setSearchLoading(false)
    }
  }

  // Submit search directly (submit on Enter or submit button)
  const handleSearchSubmit = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setSearchLoading(true)
    setShowDropdown(false)
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=1&language=en&format=json`
      const res = await axios.get(url)
      const results = res.data.results || []
      if (results.length > 0) {
        const city = results[0]
        await handleSelectLocation(city.latitude, city.longitude, city.name, city.country_code || "")
      } else {
        alert(`City "${searchQuery}" not found. Please try another search.`)
      }
    } catch (err) {
      console.error("Geocoding submit error", err)
    } finally {
      setSearchLoading(false)
    }
  }

  // Handle location update selection
  const handleSelectLocation = async (lat, lon, cityName, country) => {
    setShowDropdown(false)
    setSearchQuery("")
    setCoords({ lat, lon })
    setIsUpdating(true)
    try {
      const displayName = `${cityName}, ${country}`
      await updateLocation(lat, lon, displayName)
      await loadData({ lat, lon })
    } catch (e) {
      console.error("Error setting location", e)
    } finally {
      setIsUpdating(false)
    }
  }

  const GlobalBanner = () => {
    if (!severity || severity === "Informational") return null
    
    let bannerColor = ""
    let isCritical = severity === "Critical"
    
    if (severity === "Caution") bannerColor = "bg-yellow-500/20 text-yellow-300 border-yellow-500/50"
    else if (severity === "Warning") bannerColor = "bg-orange-500/20 text-orange-300 border-orange-500/50"
    else if (severity === "Critical") bannerColor = "bg-red-500/20 text-red-200 border-red-500/50"
    
    return (
      <div className={`w-full border rounded-xl px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg ${bannerColor} ${isCritical ? "animate-pulse" : ""}`}>
        <div className="flex items-center gap-3">
          <span className="font-bold tracking-widest uppercase text-xs">⚠ {severity}</span>
          <span className="text-sm font-medium line-clamp-1">— {advisory}</span>
        </div>
        <div className="text-[10px] font-bold uppercase tracking-wider opacity-80 whitespace-nowrap">
          Source: {source === "rag" ? "RAG · Llama3" : "Rule Engine"}
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-[#0f1117] text-slate-100 p-4 md:p-6 lg:p-8 font-sans theme-${severity.toLowerCase()}`}>
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        
        {/* HEADER BAR */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 border border-white/10 rounded-2xl p-5 backdrop-blur-md shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 text-white font-bold text-lg">
              C
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Climate Advisory</h1>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5 font-medium">
                {isUpdating ? (
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
                    Updating dashboard...
                  </span>
                ) : conditions?.recorded_at ? (
                  <span>
                    Last updated {(() => {
                      // Format the current time in the target timezone manually
                      const d = new Date()
                      const utc = d.getTime() + (d.getTimezoneOffset() * 60000)
                      const targetDate = new Date(utc + (utcOffsetSeconds * 1000))
                      const hrs = targetDate.getHours().toString().padStart(2, "0")
                      const mins = targetDate.getMinutes().toString().padStart(2, "0")
                      return `${hrs}:${mins} ${timezoneAbbr}`
                    })()}
                  </span>
                ) : (
                  <span>Loading dashboard...</span>
                )}
              </p>
            </div>
          </div>

          {/* Quick Select & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 relative">
            
            {/* Quick selectors */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSelectLocation(8.5241, 76.9366, "Trivandrum", "IN")}
                className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1.5 bg-slate-950/60 hover:bg-indigo-600/20 border border-white/10 hover:border-indigo-500/50 rounded-lg text-slate-300 hover:text-indigo-200 transition-all"
              >
                Trivandrum
              </button>
              <button
                onClick={() => handleSelectLocation(40.7128, -74.0060, "New York", "US")}
                className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1.5 bg-slate-950/60 hover:bg-indigo-600/20 border border-white/10 hover:border-indigo-500/50 rounded-lg text-slate-300 hover:text-indigo-200 transition-all"
              >
                New York
              </button>
              <button
                onClick={() => handleSelectLocation(51.5074, -0.1278, "London", "UK")}
                className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1.5 bg-slate-950/60 hover:bg-indigo-600/20 border border-white/10 hover:border-indigo-500/50 rounded-lg text-slate-300 hover:text-indigo-200 transition-all"
              >
                London
              </button>
            </div>

            {/* City Autocomplete Search Box */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[200px]">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search city..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => setShowDropdown(true)}
                  className="w-full bg-slate-950/80 border border-white/10 focus:border-indigo-500 rounded-xl pl-4 pr-10 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition-all"
                />
                <button type="submit" className="absolute right-3 top-2.5 text-slate-400 hover:text-white">
                  {searchLoading ? (
                    <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Dropdown Menu */}
              {showDropdown && searchResults.length > 0 && (
                <ul className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50">
                  {searchResults.map((city) => (
                    <li
                      key={city.id}
                      onClick={() => handleSelectLocation(city.latitude, city.longitude, city.name, city.country_code || "")}
                      className="px-4 py-2.5 text-xs text-slate-300 hover:bg-indigo-600 hover:text-white cursor-pointer transition-colors flex flex-col gap-0.5"
                    >
                      <span className="font-semibold">{city.name}</span>
                      <span className="text-[10px] text-slate-400 opacity-90">{city.admin1 || ""}, {city.country || ""}</span>
                    </li>
                  ))}
                </ul>
              )}
            </form>
          </div>
        </header>

        <GlobalBanner />

        {/* MAIN BODY GRID - 40% Left, 60% Right on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          
          {/* LEFT COLUMN: Current Weather + Key Metrics + Sun Visualizer (40% width -> 2/5 columns) */}
          <section className="lg:col-span-2 flex flex-col gap-5">
            {/* Primary Weather Card */}
            <div className="bg-gradient-to-br from-indigo-950/20 to-slate-900/40 border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col items-center">
              <div className="absolute top-3 left-4 text-[10px] uppercase tracking-widest font-extrabold text-indigo-400">
                Current Weather
              </div>

              <div className="mt-4 flex flex-col items-center gap-3">
                <WeatherIcon 
                  temp={conditions?.temperature} 
                  precipProb={conditions?.precip_prob} 
                  cloudCover={conditions?.cloud_cover} 
                  size={84} 
                />
                <div className="flex flex-col items-center">
                  <span className="text-6xl font-extrabold text-white tracking-tighter">
                    {conditions?.temperature !== undefined ? `${conditions.temperature}°` : "—"}
                  </span>
                  <span className="text-xs text-slate-400 mt-2 font-semibold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    {conditions?.location || "Trivandrum"}
                  </span>
                </div>
              </div>
            </div>

            <ThermalStressCard apparentTemperature={conditions?.feels_like} temperature={conditions?.temperature} />

            {/* Weather Metrics Grid - 2x3 Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ConditionCard label="AQI" value={conditions?.aqi} unit="" />
              <ConditionCard label="Humidity" value={conditions?.humidity} unit="%" />
              <ConditionCard label="Wind" value={conditions?.wind_speed} unit="km/h" />
              <ConditionCard label="UV Index" value={conditions?.uv_index} unit="" />
              <ConditionCard label="Rain" value={conditions?.precip_prob} unit="%" />
              <ConditionCard label="Cloud Cover" value={conditions?.cloud_cover} unit="%" />
              <ConditionCard label="Pressure" value={conditions?.pressure} unit="hPa" />
            </div>
          </section>

          {/* RIGHT COLUMN: AI Advisory Panel (60% width -> 3/5 columns) */}
          <section className="lg:col-span-3 flex flex-col gap-6">
            
            {/* AI Advisory Panel (Top of Right Column) */}
            <AdvisoryPanel advisory={advisory} severity={severity} source={source} retrievedChunks={retrievedChunks} />
            
            {/* Comparison Graph — "Previous Prediction vs Current" */}
            <ComparisonChart data={comparison} timezoneAbbr={timezoneAbbr} />

          </section>
        </div>

        {/* BOTTOM SECTION: History & Trend Graphs — Full Width */}
        <section className="flex flex-col gap-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <TrendChart data={history} timezoneAbbr={timezoneAbbr} />
            <FuturePredictionChart data={forecast} timezoneAbbr={timezoneAbbr} />
          </div>
          
          <div className="w-full xl:w-1/2 mx-auto pt-2">
            <SunVisualizer 
              sunrise={conditions?.sunrise} 
              sunset={conditions?.sunset} 
              sunriseTomorrow={conditions?.sunrise_tomorrow}
              utcOffsetSeconds={utcOffsetSeconds} 
            />
          </div>
        </section>

      </div>
    </div>
  )
}