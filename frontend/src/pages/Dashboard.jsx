import { useEffect, useState } from "react"
import { RefreshCw, Zap, AlertCircle, TrendingUp, TrendingDown } from "lucide-react"
import { usePortfolio } from "../context/PortfolioContext"
import StockCard from "../components/StockCard"
import SkeletonCard from "../components/SkeletonCard"
import PortfolioStats from "../components/PortfolioStats"
import { Link } from "react-router-dom"

export default function Dashboard() {
  const { portfolio, digest, fetchDigest, loading, lastUpdated } = usePortfolio()
  const [tickerPrices, setTickerPrices] = useState([])

  const now = new Date()
  const greeting    = now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening"
  const isMarketOpen = now.getHours() >= 9 && now.getHours() < 16 && now.getDay() > 0 && now.getDay() < 6

  // Fetch digest on mount (only if not already loaded)
  useEffect(() => {
    if (!digest) fetchDigest()
  }, [])

  // Build ticker data from digest whenever it updates
  useEffect(() => {
    if (digest && digest.length > 0) {
      setTickerPrices(digest.map(s => ({
        symbol:         s.symbol,
        price:          s.current_price,
        change_percent: s.change_percent,
      })))
    }
  }, [digest])

  const TickerItem = ({ item }) => {
    const up = item.change_percent >= 0
    return (
      <span className="inline-flex items-center gap-2 px-5" style={{ whiteSpace: "nowrap" }}>
        <span className="font-mono text-xs font-semibold" style={{ color: "#e5e7eb" }}>{item.symbol}</span>
        <span className="font-mono text-xs" style={{ color: up ? "#6ee7b7" : "#f87171" }}>
          ₹{item.price?.toLocaleString("en-IN")}
        </span>
        <span className={`text-xs font-mono flex items-center gap-0.5 ${up ? "text-emerald-400" : "text-red-400"}`}>
          {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          {up ? "+" : ""}{item.change_percent?.toFixed(2)}%
        </span>
        <span style={{ color: "var(--border)" }}>•</span>
      </span>
    )
  }

  return (
    <div>
      {/* Live ticker bar */}
      {tickerPrices.length > 0 && (
        <div className="ticker-wrap py-2"
          style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
          <div className="ticker-inner">
            {/* Duplicate for seamless loop */}
            {[...tickerPrices, ...tickerPrices].map((item, i) => (
              <TickerItem key={i} item={item} />
            ))}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero header */}
        <div className="mb-8 fade-up">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm mb-1" style={{ color: "var(--muted)", fontFamily: "'DM Sans'" }}>
                {greeting} 👋 &nbsp;
                <span className="text-xs">
                  {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </span>
              </p>
              <h1 className="font-display text-3xl font-bold text-white">
                Your Portfolio <span className="gradient-text">Digest</span>
              </h1>
              <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
                {portfolio.length} stocks tracked &nbsp;•&nbsp;
                <span className={isMarketOpen ? "text-emerald-400" : "text-yellow-400"}>
                  {isMarketOpen ? "🟢 Market Open" : "🔴 Market Closed"}
                </span>
                {lastUpdated && (
                  <span> &nbsp;•&nbsp; Last updated: {lastUpdated.toLocaleTimeString("en-IN")}</span>
                )}
              </p>
            </div>

            <button onClick={fetchDigest} disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, rgba(110,231,183,0.15), rgba(96,165,250,0.15))",
                border:     "1px solid rgba(110,231,183,0.3)",
                color:      "#6ee7b7",
              }}>
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              {loading ? "Fetching..." : "Refresh Digest"}
            </button>
          </div>
        </div>

        {/* Empty portfolio CTA */}
        {portfolio.length === 0 && (
          <div className="card p-12 text-center fade-up">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(110,231,183,0.1)" }}>
              <Zap size={24} style={{ color: "#6ee7b7" }} />
            </div>
            <h3 className="font-display text-xl font-bold text-white mb-2">No stocks yet</h3>
            <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
              Add your stocks to start getting personalized news and analysis
            </p>
            <Link to="/portfolio"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium"
              style={{ background: "linear-gradient(135deg, #6ee7b7, #60a5fa)", color: "#000" }}>
              Add Your Stocks
            </Link>
          </div>
        )}

        {/* Stats + Allocation chart */}
        {digest && <PortfolioStats digest={digest} />}

        {/* High-risk alert banner */}
        {!loading && digest && digest.some(s => s.ai_summary?.risk_level === "high") && (
          <div className="mb-6 p-4 rounded-xl flex items-start gap-3 fade-up"
            style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>
            <AlertCircle size={18} style={{ color: "#f87171", flexShrink: 0, marginTop: 2 }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: "#f87171" }}>⚠️ High Risk Alert</p>
              <p className="text-sm mt-0.5" style={{ color: "#c8d6e5" }}>
                {digest.filter(s => s.ai_summary?.risk_level === "high").map(s => s.company_name).join(", ")}{" "}
                {digest.filter(s => s.ai_summary?.risk_level === "high").length === 1 ? "has" : "have"} high risk signals today. Review carefully.
              </p>
            </div>
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {[...Array(portfolio.length || 3)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Digest cards */}
        {!loading && digest && digest.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {digest.map((item, i) => (
              <StockCard key={item.symbol} data={item} index={i} />
            ))}
          </div>
        )}

        {/* Empty digest state */}
        {!loading && !digest && portfolio.length > 0 && (
          <div className="card p-12 text-center fade-up">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(96,165,250,0.1)" }}>
              <RefreshCw size={24} style={{ color: "#60a5fa" }} />
            </div>
            <h3 className="font-display text-xl font-bold text-white mb-2">Ready to fetch your digest</h3>
            <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
              Click Refresh Digest to get today's personalized news and analysis
            </p>
            <button onClick={fetchDigest}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium"
              style={{ background: "linear-gradient(135deg, #6ee7b7, #60a5fa)", color: "#000" }}>
              <Zap size={16} /> Get My Digest
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
