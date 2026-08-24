import { useState } from "react"
import {
  TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp,
  ExternalLink, AlertTriangle, CheckCircle, Eye, LineChart
} from "lucide-react"
import ChartModal from "./ChartModal"

const sentimentConfig = {
  positive: { cls: "badge-positive", icon: TrendingUp,   label: "Positive" },
  negative: { cls: "badge-negative", icon: TrendingDown, label: "Negative" },
  neutral:  { cls: "badge-neutral",  icon: Minus,        label: "Neutral"  },
}

const actionConfig = {
  "BUY":                     { cls: "action-buy",   icon: TrendingUp,    color: "#6ee7b7" },
  "SELL":                    { cls: "action-sell",  icon: TrendingDown,  color: "#f87171" },
  "HOLD":                    { cls: "action-hold",  icon: Minus,         color: "#fbbf24" },
  "WATCH CLOSELY":           { cls: "action-watch", icon: Eye,           color: "#60a5fa" },
  "CONSIDER BOOKING PROFIT": { cls: "action-buy",   icon: CheckCircle,   color: "#6ee7b7" },
  "REVIEW POSITION":         { cls: "action-sell",  icon: AlertTriangle, color: "#f87171" },
}

const riskColors = { low: "#6ee7b7", medium: "#fbbf24", high: "#f87171" }

export default function StockCard({ data, index }) {
  const [expanded,  setExpanded]  = useState(false)
  const [showChart, setShowChart] = useState(false)

  const {
    symbol, company_name, buy_price, current_price,
    quantity, pnl, pnl_percent, news_items,
    ai_summary, sentiment, action,
    change_percent, week52_high, week52_low,
  } = data

  const isUp    = pnl >= 0
  const dayUp   = (change_percent ?? 0) >= 0
  const sConfig = sentimentConfig[sentiment] || sentimentConfig.neutral
  const aConfig = actionConfig[action] || actionConfig["HOLD"]
  const SIcon   = sConfig.icon
  const AIcon   = aConfig.icon
  const riskColor = riskColors[ai_summary?.risk_level || "medium"]

  return (
    <>
      <div
        className="card fade-up overflow-hidden transition-all duration-300 hover:border-opacity-60"
        style={{ animationDelay: `${index * 0.08}s`, borderColor: isUp ? "rgba(110,231,183,0.2)" : "rgba(248,113,113,0.2)" }}
      >
        {/* Top colour bar */}
        <div className="h-0.5 w-full" style={{
          background: isUp
            ? "linear-gradient(90deg, #6ee7b7, transparent)"
            : "linear-gradient(90deg, #f87171, transparent)"
        }} />

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-mono font-bold"
                style={{ background: "var(--surface)", color: isUp ? "#6ee7b7" : "#f87171", border: "1px solid var(--border)" }}>
                {symbol.slice(0, 3)}
              </div>
              <div>
                <h3 className="font-display font-semibold text-white text-base leading-tight">{company_name}</h3>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)", fontFamily: "'JetBrains Mono'" }}>{symbol}</p>
              </div>
            </div>

            {/* Price & daily change */}
            <div className="text-right flex-shrink-0">
              <div className="font-mono font-semibold text-white text-lg">₹{current_price?.toLocaleString("en-IN")}</div>
              <div className={`text-xs font-mono flex items-center justify-end gap-1 mt-0.5 ${dayUp ? "text-emerald-400" : "text-red-400"}`}>
                {dayUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {dayUp ? "+" : ""}{change_percent?.toFixed(2)}% today
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-3">
            {[
              { label: "Bought At", value: `₹${buy_price?.toLocaleString("en-IN")}` },
              { label: "Qty",       value: quantity },
              {
                label: "P&L",
                value: `${isUp ? "+" : ""}₹${Math.abs(pnl)?.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
                color: isUp ? "#6ee7b7" : "#f87171",
              },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl p-3 text-center" style={{ background: "var(--surface)" }}>
                <div className="text-xs mb-1" style={{ color: "var(--muted)" }}>{label}</div>
                <div className="font-mono text-sm font-semibold" style={{ color: color || "#e5e7eb" }}>{value}</div>
              </div>
            ))}
          </div>

          {/* 52-week range */}
          {week52_high > 0 && (
            <div className="mb-3 px-3 py-2 rounded-xl text-xs flex items-center justify-between"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <span style={{ color: "var(--muted)" }}>52W</span>
              <div className="flex items-center gap-2 font-mono">
                <span style={{ color: "#f87171" }}>L ₹{week52_low?.toLocaleString("en-IN")}</span>
                <span style={{ color: "var(--border)" }}>|</span>
                <span style={{ color: "#6ee7b7" }}>H ₹{week52_high?.toLocaleString("en-IN")}</span>
              </div>
            </div>
          )}

          {/* AI Summary */}
          {ai_summary?.summary && (
            <div className="rounded-xl p-4 mb-4" style={{ background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.15)" }}>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
                  style={{ background: "rgba(96,165,250,0.2)" }}>
                  <span className="text-xs" style={{ color: "#60a5fa" }}>AI</span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "#c8d6e5" }}>{ai_summary.summary}</p>
              </div>
              {ai_summary.key_point && (
                <div className="mt-2 pt-2 text-xs flex items-center gap-1.5"
                  style={{ borderTop: "1px solid rgba(96,165,250,0.1)", color: "#60a5fa" }}>
                  <span>💡</span> {ai_summary.key_point}
                </div>
              )}
            </div>
          )}

          {/* Badge row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`${sConfig.cls} inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium`}>
              <SIcon size={11} /> {sConfig.label}
            </span>
            <span className={`${aConfig.cls} inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium`}
              style={{ border: `1px solid ${aConfig.color}33` }}>
              <AIcon size={11} /> {action}
            </span>
            {ai_summary?.risk_level && (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ background: `${riskColor}15`, color: riskColor, border: `1px solid ${riskColor}30` }}>
                <AlertTriangle size={11} /> {ai_summary.risk_level} risk
              </span>
            )}

            {/* Chart button */}
            <button onClick={() => setShowChart(true)}
              className="ml-auto flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium transition-all hover:opacity-90"
              style={{ background: "rgba(96,165,250,0.12)", color: "#60a5fa", border: "1px solid rgba(96,165,250,0.25)" }}>
              <LineChart size={11} /> Quick Chart
            </button>

            {/* TradingView Studio link button */}
            <a href={`/tradingview/${symbol}`}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium transition-all hover:opacity-90"
              style={{ background: "rgba(110,231,183,0.12)", color: "#6ee7b7", border: "1px solid rgba(110,231,183,0.25)" }}>
              <TrendingUp size={11} /> TradingView
            </a>


            {/* News toggle */}
            <button onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs transition-colors"
              style={{ color: "var(--muted)" }}>
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {expanded ? "Less" : `News${news_items?.length > 0 ? ` (${news_items.length})` : ""}`}
            </button>
          </div>

          {/* Expanded news */}
          {expanded && news_items?.length > 0 && (
            <div className="mt-4 space-y-2 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
              <p className="text-xs font-medium mb-2" style={{ color: "var(--muted)" }}>Recent News</p>
              {news_items.map((item, i) => (
                <a key={i} href={item.link} target="_blank" rel="noopener noreferrer"
                  className="flex items-start gap-2 p-3 rounded-lg group transition-all"
                  style={{ background: "var(--surface)" }}>
                  <span className="text-xs mt-0.5 flex-shrink-0" style={{ color: "var(--muted)" }}>{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug group-hover:text-white transition-colors line-clamp-2"
                      style={{ color: "#c8d6e5" }}>{item.title}</p>
                    <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>{item.source}</p>
                  </div>
                  <ExternalLink size={12} className="flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--muted)" }} />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chart Modal */}
      {showChart && <ChartModal stock={data} onClose={() => setShowChart(false)} />}
    </>
  )
}
