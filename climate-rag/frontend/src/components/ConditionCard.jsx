export default function ConditionCard({ label, value, unit }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col gap-1">
      <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
      <span className="text-2xl font-semibold text-gray-800">
        {value ?? "—"}<span className="text-sm font-normal text-gray-400 ml-1">{unit}</span>
      </span>
    </div>
  )
}