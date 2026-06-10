import { useEffect, useState } from "react"
import { fetchConditions, fetchHistory, fetchAdvisory } from "./api"
import ConditionCard  from "./components/ConditionCard"
import AdvisoryPanel  from "./components/AdvisoryPanel"
import HistoryChart   from "./components/HistoryChart"

export default function App() {
  const [conditions, setConditions] = useState(null)
  const [history,    setHistory]    = useState([])
  const [advisory,   setAdvisory]   = useState(null)
  const [severity,   setSeverity]   = useState("Informational")

  const loadData = async () => {
    const [cond, hist, adv] = await Promise.all([
      fetchConditions(),
      fetchHistory(),
      fetchAdvisory(),
    ])
    setConditions(cond.data)
    setHistory(hist.data)
    setAdvisory(adv.data.advisory)
    setSeverity(adv.data.severity)
  }

  useEffect(() => {
    loadData()

    const ws = new WebSocket("ws://localhost:8000/ws")
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data)
      if (msg.type === "conditions") setConditions(msg.data)
    }

    const interval = setInterval(loadData, 15 * 60 * 1000)
    return () => {
      ws.close()
      clearInterval(interval)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">

        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Climate Advisory</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {conditions?.recorded_at
              ? `Last updated ${new Date(conditions.recorded_at).toLocaleTimeString()}`
              : "Loading..."}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <ConditionCard label="Temperature" value={conditions?.temperature} unit="°C"/>
          <ConditionCard label="Feels like"  value={conditions?.feels_like}  unit="°C"/>
          <ConditionCard label="Humidity"    value={conditions?.humidity}    unit="%"/>
          <ConditionCard label="Wind"        value={conditions?.wind_speed}  unit="km/h"/>
          <ConditionCard label="UV Index"    value={conditions?.uv_index}    unit=""/>
          <ConditionCard label="Rain"        value={conditions?.precip_prob} unit="%"/>
          <ConditionCard label="Cloud Cover" value={conditions?.cloud_cover} unit="%"/>
          <ConditionCard label="AQI"         value={conditions?.aqi}         unit=""/>
        </div>

        <AdvisoryPanel advisory={advisory} severity={severity}/>

        <HistoryChart data={history}/>

      </div>
    </div>
  )
}