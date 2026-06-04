import { useState, useEffect } from "react"
import { Plus, Trash2, Search, ExternalLink, RefreshCw, TrendingUp, TrendingDown, Minus, LineChart } from "lucide-react"
import ChartModal from "../components/ChartModal"

const INITIAL_WATCHLIST = [
  { symbol: "NIFTY50",   name: "Nifty 50 Index",          note: "Track overall market" },
  { symbol: "BANKNIFTY", name: "Bank Nifty",               note: "Banking sector index" },
  { symbol: "IRCTC",     name: "Indian Railway Catering",  note: "Monopoly stock" },
]

const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8000"

export default function Watchlist() {
  const [watchlist, setWatchlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem("stockpulse_watchlist")) || INITIAL_WATCHLIST }
    catch { return INITIAL_WATCHLIST }
  })
  const [form,       setForm]       = useState({ symbol: "", name: "", note: "" })
  const [showForm,   setShowForm]   = useState(false)
  const [search,     setSearch]     = useState("")
  const [prices,     setPrices]     = useState({})
  const [loadingPrices, setLoadingPrices] = useState(false)
  const [chartStock, setChartStock] = useState(null)

  const filtered = watchlist.filter(s =>
    s.symbol.toLowerCase().includes(search.toLowerCase()) ||
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  // Fetch live prices for all watchlist symbols
  const fetchPrices = async () => {
    if (watchlist.length === 0) return
    setLoadingPrices(true)
    try {
      const res  = await fetch(`${apiBase}/stock/batch`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ symbols: watchlist.map(s => s.symbol) }),
      })
      const data = await res.json()
      setPrices(data)
    } catch (err) {
      console.error("Failed to fetch watchlist prices:", err)
    } finally {
      setLoadingPrices(false)
    }
  }

  // Fetch on mount and whenever watchlist changes
  useEffect(() => { fetchPrices() }, [watchlist])

  const handleAdd = () => {
    if (!form.symbol.trim()) return
    const updated = [...watchlist, { ...form, symbol: form.symbol.toUpperCase() }]
    setWatchlist(updated)
    localStorage.setItem("stockpulse_watchlist", JSON.stringify(updated))
    setForm({ symbol: "", name: "", note: "" })
    setShowForm(false)
  }

  const handleRemove = (symbol) => {
    const updated = watchlist.filter(s => s.symbol !== symbol)
    setWatchlist(updated)
    localStorage.setItem("stockpulse_watchlist", JSON.stringify(updated))
    setPrices(prev => { const p = { ...prev }; delete p[symbol]; return p })
  }

  // Build a synthetic "stock" object for ChartModal
  const buildChartStock = (wl) => {
    const price = prices[wl.symbol] || {}
    return {
      symbol:         wl.symbol,
      company_name:   wl.name || wl.symbol,
      current_price:  price.current_price || 0,
      change_percent: price.change_percent || 0,
      week52_high:    price.week52_high || 0,
      week52_low:     price.week52_low  || 0,
      pnl:            0,
      ai_summary:     null,
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8 fade-up">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">
            My <span className="gradient-text">Watchlist</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            {watchlist.length} stocks • Live prices
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchPrices} disabled={loadingPrices}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all disabled:opacity-50"
            style={{ background: "var(--surface)", color: "var(--muted)", border: "1px solid var(--border)" }}>
            <RefreshCw size={13} className={loadingPrices ? "animate-spin" : ""} />
            Refresh
          </button>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: "linear-gradient(135deg, #6ee7b7, #60a5fa)", color: "#000", fontWeight: 600 }}>
            <Plus size={16} /> Watch Stock
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6 fade-up-1">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search watchlist..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: "var(--card)", border: "1px solid var(--border)", color: "#e5e7eb" }}
        />
      </div>

      {/* Add form */}
      {showForm && (
        <div className="card p-5 mb-6 fade-up" style={{ borderColor: "rgba(96,165,250,0.3)" }}>
          <h3 className="font-display font-semibold text-white mb-4">Add to Watchlist</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            {[
              { key: "symbol", label: "Symbol",           placeholder: "e.g. ZOMATO" },
              { key: "name",   label: "Company",          placeholder: "Zomato Ltd" },
              { key: "note",   label: "Note (optional)",  placeholder: "Why watching?" },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-xs mb-1.5" style={{ color: "var(--muted)" }}>{label}</label>
                <input
                  value={form[key]}
                  onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "#e5e7eb" }}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={handleAdd}
              className="px-5 py-2 rounded-lg text-sm font-semibold"
              style={{ background: "linear-gradient(135deg, #6ee7b7, #60a5fa)", color: "#000" }}>
              Add to Watchlist
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-5 py-2 rounded-lg text-sm"
              style={{ background: "var(--surface)", color: "var(--muted)", border: "1px solid var(--border)" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Watchlist items */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="card p-10 text-center">
            <p className="font-display font-semibold text-white mb-2">Nothing here yet</p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>Add stocks you want to track but haven't bought</p>
          </div>
        )}

        {filtered.map((s, i) => {
          const price      = prices[s.symbol]
          const isUp       = price ? price.change_percent >= 0 : null
          const hasPrice   = price && price.current_price > 0

          return (
            <div key={s.symbol} className="card p-4 fade-up transition-all"
              style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-mono font-bold flex-shrink-0"
                  style={{
                    background: "var(--surface)",
                    color: isUp === true ? "#6ee7b7" : isUp === false ? "#f87171" : "#a78bfa",
                    border: "1px solid var(--border)"
                  }}>
                  {s.symbol.slice(0, 3)}
                </div>

                {/* Name & note */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-sm">{s.name || s.symbol}</span>
                    <span className="text-xs font-mono px-1.5 py-0.5 rounded"
                      style={{ background: "var(--surface)", color: "var(--muted)" }}>{s.symbol}</span>
                  </div>
                  {s.note && <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>📌 {s.note}</p>}
                </div>

                {/* Live price */}
                <div className="text-right flex-shrink-0 min-w-[80px]">
                  {loadingPrices && !hasPrice ? (
                    <div className="h-4 w-20 rounded shimmer ml-auto" />
                  ) : hasPrice ? (
                    <>
                      <div className="font-mono font-semibold text-white text-sm">
                        ₹{price.current_price.toLocaleString("en-IN")}
                      </div>
                      <div className={`flex items-center justify-end gap-0.5 text-xs font-mono mt-0.5 ${isUp ? "text-emerald-400" : "text-red-400"}`}>
                        {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {isUp ? "+" : ""}{price.change_percent?.toFixed(2)}%
                      </div>
                    </>
                  ) : (
                    <span className="text-xs" style={{ color: "var(--muted)" }}>—</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Chart button */}
                  <button onClick={() => setChartStock(buildChartStock(s))}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-blue-500/20"
                    style={{ color: "#60a5fa" }}
                    title="View chart">
                    <LineChart size={14} />
                  </button>
                  <a href={`https://finance.yahoo.com/quote/${s.symbol}.NS`}
                    target="_blank" rel="noopener noreferrer"
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-blue-500/20"
                    style={{ color: "var(--muted)" }}>
                    <ExternalLink size={14} />
                  </a>
                  <button onClick={() => handleRemove(s.symbol)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-red-500/20"
                    style={{ color: "var(--muted)" }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Chart modal */}
      {chartStock && <ChartModal stock={chartStock} onClose={() => setChartStock(null)} />}
    </div>
  )
}
