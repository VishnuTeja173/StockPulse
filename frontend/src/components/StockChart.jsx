import { useEffect, useRef, useState } from "react"
import { createChart, ColorType, CrosshairMode } from "lightweight-charts"
import { TrendingUp, TrendingDown, Activity } from "lucide-react"

const PERIODS = ["1W", "1M", "3M", "6M", "1Y", "2Y"]

const MA_LINES = [
  { key: "ema9",  label: "EMA 9",   color: "#a78bfa" },  // purple
  { key: "ema21", label: "EMA 21",  color: "#fbbf24" },  // yellow
  { key: "ma20",  label: "MA 20",   color: "#60a5fa" },  // blue
  { key: "ma50",  label: "MA 50",   color: "#f97316" },  // orange
  { key: "ma200", label: "MA 200",  color: "#f87171" },  // red
]

const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8000"

export default function StockChart({ symbol, companyName }) {
  const chartContainerRef = useRef(null)
  const chartRef = useRef(null)
  const seriesRefs = useRef({})

  const [period, setPeriod] = useState("3M")
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState(null)
  const [ohlc, setOhlc]     = useState(null)
  const [visibleMAs, setVisibleMAs] = useState(
    MA_LINES.reduce((acc, m) => ({ ...acc, [m.key]: true }), {})
  )

  // Create chart on mount
  useEffect(() => {
    if (!chartContainerRef.current) return

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#13131a" },
        textColor: "#6b7280",
        fontSize: 11,
        fontFamily: "'JetBrains Mono', monospace",
      },
      grid: {
        vertLines: { color: "#1e1e2e" },
        horzLines: { color: "#1e1e2e" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "#6b7280", width: 1, style: 1 },
        horzLine: { color: "#6b7280", width: 1, style: 1 },
      },
      rightPriceScale: {
        borderColor: "#2a2a38",
        textColor: "#6b7280",
      },
      timeScale: {
        borderColor: "#2a2a38",
        timeVisible: true,
        secondsVisible: false,
      },
      watermark: {
        visible: true,
        fontSize: 24,
        horzAlign: "center",
        vertAlign: "center",
        color: "rgba(255,255,255,0.03)",
        text: symbol,
      },
      width: chartContainerRef.current.clientWidth,
      height: 420,
    })

    chartRef.current = chart

    // Candlestick series
    const candleSeries = chart.addCandlestickSeries({
      upColor:          "#6ee7b7",
      downColor:        "#f87171",
      borderUpColor:    "#6ee7b7",
      borderDownColor:  "#f87171",
      wickUpColor:      "#6ee7b7",
      wickDownColor:    "#f87171",
    })
    seriesRefs.current["candles"] = candleSeries

    // Volume histogram (on separate pane)
    const volumeSeries = chart.addHistogramSeries({
      color:       "#60a5fa",
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    })
    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    })
    seriesRefs.current["volume"] = volumeSeries

    // MA / EMA line series
    MA_LINES.forEach(({ key, color }) => {
      const lineSeries = chart.addLineSeries({
        color,
        lineWidth:       1.5,
        crosshairMarkerVisible: false,
        lastValueVisible: true,
        priceLineVisible: false,
      })
      seriesRefs.current[key] = lineSeries
    })

    // Responsive resize
    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current?.clientWidth || 600 })
    }
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      chart.remove()
      chartRef.current = null
    }
  }, [symbol])

  // Fetch data when symbol or period changes
  useEffect(() => {
    fetchChartData()
  }, [symbol, period])

  // Toggle MA visibility
  useEffect(() => {
    MA_LINES.forEach(({ key }) => {
      const series = seriesRefs.current[key]
      if (!series) return
      series.applyOptions({ visible: visibleMAs[key] })
    })
  }, [visibleMAs])

  const fetchChartData = async (isPolling = false) => {
    if (!isPolling) {
      setLoading(true)
      setError(null)
    }
    try {
      const res  = await fetch(`${apiBase}/stock/chart/${symbol}?period=${period}`)
      const data = await res.json()

      if (!data.candles || data.candles.length === 0) {
        setError("No chart data available for this symbol.")
        setLoading(false)
        return
      }

      // Update OHLC display
      const last = data.candles[data.candles.length - 1]
      setOhlc(last)

      // Set candlestick data
      seriesRefs.current["candles"]?.setData(data.candles.map(c => ({
        time: c.time, open: c.open, high: c.high, low: c.low, close: c.close
      })))

      // Set volume data
      seriesRefs.current["volume"]?.setData(data.candles.map(c => ({
        time:  c.time,
        value: c.volume,
        color: c.close >= c.open ? "rgba(110,231,183,0.35)" : "rgba(248,113,113,0.35)",
      })))

      // Set MA/EMA lines
      MA_LINES.forEach(({ key }) => {
        seriesRefs.current[key]?.setData(data[key] || [])
      })

      chartRef.current?.timeScale().fitContent()
    } catch (err) {
      setError("Failed to load chart data. Is the backend running?")
    } finally {
      if (!isPolling) setLoading(false)
    }
  }

  // Live auto-polling every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchChartData(true)
    }, 60000)
    return () => clearInterval(interval)
  }, [symbol, period])

  const toggleMA = (key) => {
    setVisibleMAs(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display font-bold text-white text-lg">{companyName}</h2>
          <p className="text-xs font-mono" style={{ color: "var(--muted)" }}>{symbol} • NSE</p>
        </div>

        {/* OHLC display */}
        {ohlc && (
          <div className="flex items-center gap-4 text-xs font-mono flex-wrap">
            {[["O", ohlc.open], ["H", ohlc.high], ["L", ohlc.low], ["C", ohlc.close]].map(([label, val]) => (
              <span key={label} style={{ color: label === "H" ? "#6ee7b7" : label === "L" ? "#f87171" : "#e5e7eb" }}>
                <span style={{ color: "var(--muted)" }}>{label} </span>₹{val?.toLocaleString("en-IN")}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Period selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs mr-1" style={{ color: "var(--muted)" }}>Period:</span>
        {PERIODS.map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
            style={{
              background: period === p ? "rgba(110,231,183,0.2)" : "var(--surface)",
              color:      period === p ? "#6ee7b7" : "var(--muted)",
              border:     `1px solid ${period === p ? "rgba(110,231,183,0.4)" : "var(--border)"}`,
            }}>
            {p}
          </button>
        ))}

        {/* MA toggles */}
        <div className="flex items-center gap-1.5 ml-auto flex-wrap">
          {MA_LINES.map(({ key, label, color }) => (
            <button key={key} onClick={() => toggleMA(key)}
              className="px-2.5 py-1 rounded-lg text-xs font-mono transition-all"
              style={{
                background: visibleMAs[key] ? `${color}18` : "var(--surface)",
                color:      visibleMAs[key] ? color : "var(--muted)",
                border:     `1px solid ${visibleMAs[key] ? `${color}40` : "var(--border)"}`,
                opacity:    visibleMAs[key] ? 1 : 0.5,
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="relative rounded-xl overflow-hidden"
        style={{ border: "1px solid var(--border)", background: "#13131a" }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10"
            style={{ background: "rgba(19,19,26,0.8)" }}>
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--muted)" }}>
              <Activity size={16} className="animate-pulse" />
              Loading chart...
            </div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center z-10"
            style={{ background: "rgba(19,19,26,0.9)" }}>
            <p className="text-sm text-center px-4" style={{ color: "#f87171" }}>{error}</p>
          </div>
        )}
        <div ref={chartContainerRef} style={{ width: "100%", height: 420 }} />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded" style={{ background: "#6ee7b7", display: "inline-block" }}></span>
          <span style={{ color: "var(--muted)" }}>Bullish candle</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded" style={{ background: "#f87171", display: "inline-block" }}></span>
          <span style={{ color: "var(--muted)" }}>Bearish candle</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-10 h-0.5 rounded" style={{ background: "#6b7280", display: "inline-block" }}></span>
          <span style={{ color: "var(--muted)" }}>Volume</span>
        </div>
      </div>
    </div>
  )
}
