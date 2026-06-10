import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts"

export default function HistoryChart({ data }) {
  const formatted = data.map(d => ({
    ...d,
    time: new Date(d.recorded_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }))

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">24-hour trend</p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={formatted}>
          <XAxis dataKey="time" tick={{ fontSize: 11 }} interval="preserveStartEnd"/>
          <YAxis tick={{ fontSize: 11 }} width={30}/>
          <Tooltip/>
          <Legend/>
          <Line type="monotone" dataKey="temperature" stroke="#E8593C" dot={false} name="Temp °C"/>
          <Line type="monotone" dataKey="humidity"    stroke="#3B8BD4" dot={false} name="Humidity %"/>
          <Line type="monotone" dataKey="uv_index"    stroke="#F2A623" dot={false} name="UV Index"/>
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}