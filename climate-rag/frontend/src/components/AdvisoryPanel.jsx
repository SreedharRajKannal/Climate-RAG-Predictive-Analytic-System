const SEVERITY_STYLES = {
  Informational: "bg-green-50  border-green-400  text-green-800",
  Caution:       "bg-yellow-50 border-yellow-400 text-yellow-800",
  Warning:       "bg-orange-50 border-orange-400 text-orange-800",
  Critical:      "bg-red-50    border-red-500    text-red-800",
}

const SEVERITY_BADGE = {
  Informational: "bg-green-100  text-green-700",
  Caution:       "bg-yellow-100 text-yellow-700",
  Warning:       "bg-orange-100 text-orange-700",
  Critical:      "bg-red-100    text-red-700",
}

export default function AdvisoryPanel({ advisory, severity }) {
  if (!advisory) return null

  const box   = SEVERITY_STYLES[severity] ?? SEVERITY_STYLES.Informational
  const badge = SEVERITY_BADGE[severity]  ?? SEVERITY_BADGE.Informational

  return (
    <div className={`rounded-xl border-l-4 p-5 ${box}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge}`}>
          {severity}
        </span>
        <span className="text-xs text-gray-400">Latest advisory</span>
      </div>
      <p className="text-sm leading-relaxed">{advisory}</p>
    </div>
  )
}