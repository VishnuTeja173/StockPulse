import { useEffect, useRef, useState } from "react"
import { X, TrendingUp, TrendingDown, Minus } from "lucide-react"
import StockChart from "./StockChart"

export default function ChartModal({ stock, onClose }) {
  const overlayRef = useRef(null)

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handleKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handleKey)
      document.body.style.overflow = ""
    }
  }, [onClose])

  const isUp = (stock.pnl ?? 0) >= 0

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="w-full max-w-5xl rounded-2xl overflow-hidden flex flex-col"
        style={{
          background:  "var(--card)",
          border:      "1px solid var(--border)",
          maxHeight:   "90vh",
          animation:   "fadeUp 0.3s ease forwards",
        }}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-4">
            {/* Symbol badge */}
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-mono font-bold"
              style={{ background: "var(--surface)", color: isUp ? "#6ee7b7" : "#f87171", border: "1px solid var(--border)" }}>
              {stock.symbol?.slice(0, 3)}
            </div>
            <div>
              <h2 className="font-display font-bold text-white">
                {stock.company_name || stock.symbol}
              </h2>
              <div className="flex items-center gap-3 text-xs mt-0.5">
                <span className="font-mono" style={{ color: "var(--muted)" }}>{stock.symbol} • NSE</span>
                {stock.current_price > 0 && (
                  <>
                    <span className="font-mono font-semibold text-white">₹{stock.current_price?.toLocaleString("en-IN")}</span>
                    <span className={`flex items-center gap-0.5 font-mono ${isUp ? "text-emerald-400" : "text-red-400"}`}>
                      {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                      {isUp ? "+" : ""}{stock.change_percent?.toFixed(2)}%
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6">
            {stock.week52_high > 0 && (
              <div className="text-right hidden md:block">
                <div className="text-xs mb-1" style={{ color: "var(--muted)" }}>52W Range</div>
                <div className="text-xs font-mono">
                  <span style={{ color: "#f87171" }}>₹{stock.week52_low?.toLocaleString("en-IN")}</span>
                  <span style={{ color: "var(--muted)" }}> — </span>
                  <span style={{ color: "#6ee7b7" }}>₹{stock.week52_high?.toLocaleString("en-IN")}</span>
                </div>
              </div>
            )}
            <button onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-red-500/20"
              style={{ color: "var(--muted)", border: "1px solid var(--border)" }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Chart area */}
        <div className="p-6 overflow-y-auto flex-1">
          <StockChart
            symbol={stock.symbol}
            companyName={stock.company_name || stock.symbol}
          />
        </div>

        {/* Footer — AI summary strip */}
        {stock.ai_summary?.key_point && (
          <div className="px-6 py-3 flex items-center gap-2 text-xs"
            style={{ borderTop: "1px solid var(--border)", background: "rgba(96,165,250,0.05)" }}>
            <span style={{ color: "#60a5fa" }}>💡 AI:</span>
            <span style={{ color: "#c8d6e5" }}>{stock.ai_summary.key_point}</span>
          </div>
        )}
      </div>
    </div>
  )
}
