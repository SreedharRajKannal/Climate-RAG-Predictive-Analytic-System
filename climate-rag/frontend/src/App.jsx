import React, { useEffect, useState } from "react"
import { 
  fetchConditions, 
  fetchHistory, 
  fetchAdvisory, 
  fetchForecast, 
  fetchComparison, 
  updateLocation 
} from "./api"
import ConditionCard from "./components/ConditionCard"
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
        fetchHistory(lat, lon),
        fetchAdvisory(lat, lon),
        fetchForecast(lat, lon),
        fetchComparison(lat, lon)
      ])
      
      setConditions(cond.data)
      setHistory(hist.data)
      setAdvisory(adv.data.advisory)
      setSeverity(adv.data.severity)
      setSource(adv.data.source)
      
      if (!fore.data.error) setForecast(fore.data)
      if (!comp.data.error) setComparison(fore.data.error ? [] : comp.data)
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

  return (
    <div className="min-h-screen bg-[#0f1117] text-slate-100 p-4 md:p-6 lg:p-8 font-sans">
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
                  <span>Last updated {new Date(conditions.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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

        {/* MAIN BODY GRID - 40% Left, 60% Right on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          
          {/* LEFT COLUMN: Current Weather & Key Metric Tiles (40% width -> 2/5 columns) */}
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

            {/* Weather Metrics Grid - 2x3 Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ConditionCard label="AQI" value={conditions?.aqi} unit="" />
              <ConditionCard label="Feels like" value={conditions?.feels_like} unit="°C" />
              <ConditionCard label="Humidity" value={conditions?.humidity} unit="%" />
              <ConditionCard label="Wind" value={conditions?.wind_speed} unit="km/h" />
              <ConditionCard label="UV Index" value={conditions?.uv_index} unit="" />
              <ConditionCard label="Rain" value={conditions?.precip_prob} unit="%" />
              <ConditionCard label="Cloud Cover" value={conditions?.cloud_cover} unit="%" />
              <ConditionCard label="Pressure" value={conditions?.pressure} unit="hPa" />
            </div>
          </section>

          {/* RIGHT COLUMN: AI Advisory Panel + Graphs Section (60% width -> 3/5 columns) */}
          <section className="lg:col-span-3 flex flex-col gap-6">
            
            {/* AI Advisory Panel (Top of Right Column) */}
            <AdvisoryPanel advisory={advisory} severity={severity} source={source} />
            
            {/* Graphs Section (Below advisory) */}
            <div className="flex flex-col gap-6">
              
              {/* Sun Cycle Visualizer */}
              <SunVisualizer sunrise={conditions?.sunrise} sunset={conditions?.sunset} />
              
              {/* Comparison Graph */}
              <ComparisonChart data={comparison} />

              {/* Advanced Graphs: Side-by-side or stacked on layout size */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <TrendChart data={history} />
                <FuturePredictionChart data={forecast} />
              </div>

            </div>
          </section>
        </div>

      </div>
    </div>
  )
}