import { TrendingUp, TrendingDown, Activity, DollarSign, PieChart } from "lucide-react"
import { PieChart as RePieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts"

const CHART_COLORS = [
  "#6ee7b7", "#60a5fa", "#f97316", "#a78bfa",
  "#fbbf24", "#f87171", "#34d399", "#38bdf8",
  "#fb923c", "#c084fc",
]

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0]
    return (
      <div className="rounded-xl p-3 text-xs"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <p className="font-semibold text-white mb-1">{d.name}</p>
        <p style={{ color: "#60a5fa" }}>₹{d.value?.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
        <p style={{ color: "var(--muted)" }}>{d.payload.percent?.toFixed(1)}% of portfolio</p>
      </div>
    )
  }
  return null
}

export default function PortfolioStats({ digest }) {
  if (!digest || digest.length === 0) return null

  const totalInvested = digest.reduce((sum, s) => sum + s.buy_price * s.quantity, 0)
  const totalCurrent  = digest.reduce((sum, s) => sum + s.current_price * s.quantity, 0)
  const totalPnl      = totalCurrent - totalInvested
  const totalPnlPct   = (totalPnl / totalInvested) * 100
  const positive      = digest.filter(s => s.pnl >= 0).length
  const negative      = digest.filter(s => s.pnl < 0).length
  const isUp          = totalPnl >= 0

  // Pie chart data — allocation by current value
  const pieData = digest.map((s, i) => ({
    name:    s.company_name || s.symbol,
    symbol:  s.symbol,
    value:   s.current_price * s.quantity,
    percent: totalCurrent > 0 ? (s.current_price * s.quantity / totalCurrent) * 100 : 0,
    color:   CHART_COLORS[i % CHART_COLORS.length],
  }))

  const stats = [
    {
      label: "Total Invested",
      value: `₹${totalInvested.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
      icon: DollarSign, color: "#60a5fa",
    },
    {
      label: "Current Value",
      value: `₹${totalCurrent.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
      icon: Activity, color: "#a78bfa",
    },
    {
      label: "Overall P&L",
      value: `${isUp ? "+" : ""}₹${Math.abs(totalPnl).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
      sub:   `${isUp ? "+" : ""}${totalPnlPct.toFixed(2)}%`,
      icon:  isUp ? TrendingUp : TrendingDown,
      color: isUp ? "#6ee7b7" : "#f87171",
    },
    {
      label: "Gainers / Losers",
      value: `${positive} / ${negative}`,
      icon: Activity, color: "#fbbf24",
    },
  ]

  return (
    <div className="mb-8 space-y-4">
      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(({ label, value, sub, icon: Icon, color }, i) => (
          <div key={i} className="card p-4 fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs" style={{ color: "var(--muted)", fontFamily: "'DM Sans'" }}>{label}</span>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: `${color}18` }}>
                <Icon size={14} style={{ color }} />
              </div>
            </div>
            <div className="font-mono font-bold text-lg text-white">{value}</div>
            {sub && <div className="text-xs mt-0.5 font-mono" style={{ color }}>{sub}</div>}
          </div>
        ))}
      </div>

      {/* Portfolio allocation pie chart */}
      {digest.length > 1 && (
        <div className="card p-5 fade-up">
          <div className="flex items-center gap-2 mb-4">
            <PieChart size={16} style={{ color: "#a78bfa" }} />
            <h3 className="font-display font-semibold text-white text-sm">Portfolio Allocation</h3>
            <span className="text-xs ml-auto" style={{ color: "var(--muted)" }}>by current value</span>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Donut chart */}
            <div style={{ width: 200, height: 180, flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={`cell-${i}`} fill={entry.color} stroke="var(--card)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </RePieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend table */}
            <div className="flex-1 w-full">
              <div className="space-y-2">
                {pieData.map((d, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: d.color, display: "inline-block" }} />
                    <span className="flex-1 font-medium truncate" style={{ color: "#e5e7eb" }}>{d.name}</span>
                    <span className="font-mono" style={{ color: "var(--muted)" }}>
                      ₹{d.value?.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </span>
                    <span className="font-mono w-12 text-right" style={{ color: d.color }}>
                      {d.percent.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
