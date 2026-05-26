const COLORS = {
  blue:   { bg: 'bg-blue-50',   text: 'text-blue-600',   icon: 'bg-blue-100 text-blue-600' },
  green:  { bg: 'bg-green-50',  text: 'text-green-600',  icon: 'bg-green-100 text-green-600' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', icon: 'bg-purple-100 text-purple-600' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600', icon: 'bg-orange-100 text-orange-600' },
  red:    { bg: 'bg-red-50',    text: 'text-red-600',    icon: 'bg-red-100 text-red-600' },
  gray:   { bg: 'bg-gray-50',   text: 'text-gray-700',   icon: 'bg-gray-100 text-gray-700' },
  pink:   { bg: 'bg-pink-50',   text: 'text-pink-600',   icon: 'bg-pink-100 text-pink-600' },
  teal:   { bg: 'bg-teal-50',   text: 'text-teal-600',   icon: 'bg-teal-100 text-teal-600' },
}

export default function KPICard({ icon: Icon, color = 'blue', label, value, sub }) {
  const c = COLORS[color] || COLORS.blue
  return (
    <div className="kpi-card">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide truncate">{label}</p>
          <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1 truncate">{value}</p>
          {sub && <p className="text-xs text-gray-500 mt-1 truncate">{sub}</p>}
        </div>
        {Icon && (
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${c.icon}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  )
}
