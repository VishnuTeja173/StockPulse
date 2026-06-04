import { useState, useEffect } from "react"
import { Activity, LineChart, ShieldCheck, Zap, Settings2 } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import ChartModal from "../components/ChartModal"

const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8000"

export default function Screener() {
  const { token } = useAuth()
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [chartStock, setChartStock] = useState(null)
  
  // Custom MA state
  const [maInput, setMaInput] = useState("20, 50, 200")
  // Index selection state
  const [indexes, setIndexes] = useState([])
  const [selectedIndexes, setSelectedIndexes] = useState([])
  const [indexSearch, setIndexSearch] = useState("")

  const toggleIndex = (idx) => {
    if (selectedIndexes.includes(idx)) {
      setSelectedIndexes(selectedIndexes.filter(i => i !== idx))
    } else {
      setSelectedIndexes([...selectedIndexes, idx])
    }
    setIndexSearch("") // Clear search to show only selected indexes
  }

  const filteredIndexes = indexSearch.trim() === "" 
    ? selectedIndexes 
    : indexes.filter(idx => idx.toLowerCase().includes(indexSearch.toLowerCase()))

  useEffect(() => {
    // Fetch available indexes on component mount
    const fetchIndexes = async () => {
      try {
        const res = await fetch(`${apiBase}/indexes`)
        if (!res.ok) throw new Error("Failed to fetch indexes")
        const data = await res.json()
        setIndexes(data.indexes ? Object.keys(data.indexes) : [])
      } catch (e) {
        console.error(e)
      }
    }
    fetchIndexes()
  }, [])

  const fetchScreener = async (force = false) => {
    if (!token) return
    setLoading(true)
    setError(null)
    
    // Parse MA inputs
    const mas = maInput.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n))
    if (mas.length < 2) {
      setError("Please provide at least two valid moving average periods (e.g. 20, 50)")
      setLoading(false)
      return
    }

    try {
      const queryParams = new URLSearchParams()
        // Append selected indexes to query params if any
        if (selectedIndexes.length > 0) {
          selectedIndexes.forEach(idx => queryParams.append("indexes", idx))
        }
      if (force) queryParams.append("force", "true")
      mas.forEach(ma => queryParams.append("mas", ma))

      const res = await fetch(`${apiBase}/screener/ma-convergence?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error("Failed to fetch screener data")
      const data = await res.json()
      const filtered = (data.screener_results || []).filter(r => {
  // Ensure current price is above all moving averages (slightly above)
  const masValues = Object.values(r.mas || {});
  const aboveAll = masValues.every(ma => r.current_price > ma);
  return aboveAll;
});
setResults(filtered);
    } catch (err) {
      setError("Failed to load screener data. Backend might be busy or offline.")
    } finally {
      setLoading(false)
    }
  }

  const buildChartStock = (r) => {
    return {
      symbol: r.symbol,
      company_name: r.company_name,
      current_price: r.current_price,
      change_percent: 0,
      pnl: 0,
    }
  }

  // Define colors for the dynamic MA pills in the UI
  const maColors = ["#60a5fa", "#f97316", "#f87171", "#a78bfa", "#6ee7b7"]

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8 fade-up">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">
            Market <span className="gradient-text">Screener</span>
          </h1>
          <p className="text-sm mt-1 flex items-center gap-2" style={{ color: "var(--muted)" }}>
            <ShieldCheck size={14} style={{ color: "#6ee7b7" }} />
            Find stocks experiencing Moving Average convergence squeezes
          </p>
        </div>
      </div>

      {/* Configuration Panel */}
      <div className="card p-6 mb-8 fade-up" style={{ background: "rgba(19, 19, 26, 0.5)", border: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex flex-col md:flex-row items-end gap-4">
          <div className="flex-1 w-full">
            <label className="block text-xs font-medium mb-1.5 flex items-center gap-2" style={{ color: "var(--muted)" }}>
              <Settings2 size={14} /> Moving Average Periods (comma separated)
            </label>
            <input 
              type="text" 
              value={maInput} 
              onChange={(e) => setMaInput(e.target.value)}
              className="w-full bg-transparent rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none transition-all"
              style={{ border: "1px solid var(--border)", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.2)" }}
              placeholder="e.g. 20, 50, 200"
            />

            {/* Index selection dropdown */}
            <div className="mt-4">
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted)" }}>Select Indexes (optional)</label>
              <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "rgba(0,0,0,0.2)" }}>
                <input 
                  type="text" 
                  value={indexSearch}
                  onChange={(e) => setIndexSearch(e.target.value)}
                  placeholder="Search indexes..." 
                  className="w-full bg-transparent p-2.5 px-4 text-sm text-white focus:outline-none border-b"
                  style={{ borderBottomColor: "var(--border)" }}
                />
                {(indexSearch.trim() !== "" || selectedIndexes.length > 0) && (
                  <div className="max-h-40 overflow-y-auto p-2 scrollbar-hide">
                    {filteredIndexes.length > 0 ? (
                      filteredIndexes.map(idx => (
                        <label key={idx} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors">
                          <input 
                            type="checkbox" 
                            checked={selectedIndexes.includes(idx)}
                            onChange={() => toggleIndex(idx)}
                            className="rounded border-gray-600"
                            style={{ accentColor: "#60a5fa" }}
                          />
                          <span className="text-sm text-gray-200">{idx}</span>
                        </label>
                      ))
                    ) : (
                      <div className="p-3 text-xs text-center" style={{ color: "var(--muted)" }}>
                        No matching indexes found
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button onClick={() => fetchScreener(false)} disabled={loading}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "var(--surface)", color: "#e5e7eb", border: "1px solid var(--border)" }}>
              {loading ? "Scanning..." : "Scan Market"}
            </button>
            <button onClick={() => fetchScreener(true)} disabled={loading}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-black transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #6ee7b7, #60a5fa)" }}>
              <Zap size={16} />
              {loading ? "Scanning..." : "Force Live Data Scan"}
            </button>
          </div>
        </div>
      </div>

      {loading && !results ? (
        <div className="card p-12 text-center fade-up flex flex-col items-center justify-center">
          <Activity size={32} className="animate-pulse mb-4" style={{ color: "#60a5fa" }} />
          <h3 className="font-display text-xl font-bold text-white mb-2">Scanning Universe...</h3>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Downloading data and calculating custom indicators. This takes 5-15 seconds.
          </p>
        </div>
      ) : error ? (
        <div className="card p-8 text-center" style={{ borderColor: "rgba(248,113,113,0.3)" }}>
          <p style={{ color: "#f87171" }}>{error}</p>
        </div>
      ) : results?.length === 0 ? (
        <div className="card p-12 text-center fade-up">
          <p className="font-display text-xl font-bold text-white mb-2">No tight convergences found for these settings.</p>
        </div>
      ) : results && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {results.map((r, i) => (
            <div key={r.symbol} className="card p-4 fade-up transition-all hover:border-opacity-60"
              style={{ animationDelay: `${(i % 10) * 0.05}s`, borderColor: "rgba(96,165,250,0.2)" }}>
              
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0 pr-2">
                  <h3 className="font-bold text-white text-sm truncate">{r.company_name}</h3>
                  <p className="text-xs font-mono" style={{ color: "var(--muted)" }}>{r.symbol}</p>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-sm text-white">₹{r.current_price?.toLocaleString("en-IN")}</div>
                </div>
              </div>

              {/* Spread badge */}
              <div className="mb-3">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-semibold"
                  style={{ background: "rgba(110,231,183,0.15)", color: "#6ee7b7" }}>
                  Spread: {r.diff_pct}%
                </span>
              </div>

              {/* Dynamic MAs */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {Object.entries(r.mas).map(([key, val], idx) => (
                  <div key={key} className="p-1.5 rounded text-center" style={{ background: "var(--surface)" }}>
                    <div className="text-[10px] uppercase" style={{ color: "var(--muted)" }}>{key}</div>
                    <div className="font-mono text-xs font-medium" style={{ color: maColors[idx % maColors.length] }}>{val}</div>
                  </div>
                ))}
              </div>

              <button onClick={() => setChartStock(buildChartStock(r))}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
                style={{ background: "var(--surface)", color: "#60a5fa", border: "1px solid rgba(96,165,250,0.3)" }}>
                <LineChart size={14} /> Open Chart
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Chart modal */}
      {chartStock && <ChartModal stock={chartStock} onClose={() => setChartStock(null)} />}
    </div>
  )
}
