import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TradingViewWidget from '../components/TradingViewWidget';
import TradingViewTaGauge from '../components/TradingViewTaGauge';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const SUGGESTED_STOCKS = [
  { symbol: 'RELIANCE', name: 'Reliance Ind.' },
  { symbol: 'TCS', name: 'TCS' },
  { symbol: 'INFY', name: 'Infosys' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank' },
  { symbol: 'BATS:AAPL', name: 'Apple Inc' },
  { symbol: 'BATS:NVDA', name: 'NVIDIA' },
];

export default function TradingViewHub() {
  const { symbol: urlSymbol } = useParams();
  const navigate = useNavigate();

  const [activeSymbol, setActiveSymbol] = useState(urlSymbol || 'RELIANCE');
  const [searchInput, setSearchInput] = useState(urlSymbol || 'RELIANCE');
  const [timeframe, setTimeframe] = useState('D');
  
  const [loading, setLoading] = useState(true);
  const [taData, setTaData] = useState(null);
  const [aiDigest, setAiDigest] = useState(null);
  const [error, setError] = useState(null);

  const [cdpStatus, setCdpStatus] = useState(null);
  const [checkingCdp, setCheckingCdp] = useState(false);

  useEffect(() => {
    if (urlSymbol && urlSymbol !== activeSymbol) {
      setActiveSymbol(urlSymbol);
      setSearchInput(urlSymbol);
    }
  }, [urlSymbol]);

  // Fetch Technical Analysis & Gemini AI Digest
  const fetchAnalysis = async (sym) => {
    setLoading(true);
    setError(null);
    try {
      const cleanSym = sym.split(':').pop();
      const res = await fetch(`${API_BASE}/api/ta/analysis/${cleanSym}`);
      if (!res.ok) throw new Error('Failed to fetch technical analysis');
      const data = await res.json();
      setTaData(data.ta_data);
      setAiDigest(data.ai_digest);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error loading analysis');
    } finally {
      setLoading(false);
    }
  };

  // Check optional local CDP debug status
  const checkCdp = async () => {
    setCheckingCdp(true);
    try {
      const res = await fetch(`${API_BASE}/api/ta/cdp-status`);
      const data = await res.json();
      setCdpStatus(data);
    } catch {
      setCdpStatus({ cdp_available: false, tradingview_connected: false });
    } finally {
      setCheckingCdp(false);
    }
  };

  useEffect(() => {
    fetchAnalysis(activeSymbol);
    checkCdp();
  }, [activeSymbol]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setActiveSymbol(searchInput.trim().toUpperCase());
      navigate(`/tradingview/${searchInput.trim().toUpperCase()}`);
    }
  };

  const selectStock = (sym) => {
    setActiveSymbol(sym);
    setSearchInput(sym);
    navigate(`/tradingview/${sym}`);
  };

  const getStanceColor = (stance) => {
    if (!stance) return 'bg-slate-700 text-slate-200';
    const lower = stance.toLowerCase();
    if (lower.includes('strong bullish') || lower.includes('bullish')) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    if (lower.includes('strong bearish') || lower.includes('bearish')) return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
    return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
              TradingView Studio & AI Analyst
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Gemini 1.5 Flash Powered
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Interactive multi-timeframe charting with live technical indicators & Gemini AI trade signal reports.
          </p>
        </div>

        {/* Search & Quick Chips */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="flex items-center w-full sm:w-auto gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search ticker (e.g. RELIANCE, INFY, AAPL)..."
              className="bg-slate-800/90 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-full sm:w-64"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm px-4 py-2 rounded-xl transition shadow-md shadow-blue-600/20 shrink-0"
            >
              Analyze
            </button>
          </form>

          {/* CDP Local Status Toggle Badge */}
          <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-1.5 text-xs">
            <div className={`w-2.5 h-2.5 rounded-full ${cdpStatus?.tradingview_connected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span className="text-slate-300">
              {cdpStatus?.tradingview_connected ? 'TV Desktop (CDP 9222) Linked' : 'Cloud API & Widgets Mode'}
            </span>
            <button
              onClick={checkCdp}
              disabled={checkingCdp}
              className="text-slate-400 hover:text-slate-200 transition ml-1"
              title="Refresh CDP connection check"
            >
              🔄
            </button>
          </div>
        </div>
      </div>

      {/* Suggested Quick Ticker Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0 mr-1">Quick Select:</span>
        {SUGGESTED_STOCKS.map((item) => (
          <button
            key={item.symbol}
            onClick={() => selectStock(item.symbol)}
            className={`px-3 py-1 text-xs rounded-lg border transition font-medium whitespace-nowrap ${
              activeSymbol.toUpperCase().includes(item.symbol.split(':').pop())
                ? 'bg-blue-600/30 text-blue-300 border-blue-500/50 shadow-sm'
                : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            {item.name}
          </button>
        ))}
      </div>

      {/* Main Grid: Left Interactive Chart (60%), Right AI Analysis (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive TradingView Widget */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-2.5 gap-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-bold text-slate-200 text-sm">{taData?.tradingview_symbol || activeSymbol}</span>
              {taData?.current_price > 0 && (
                <span className={`text-sm font-semibold ${taData.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ₹{taData.current_price} ({taData.change >= 0 ? '+' : ''}{taData.change_percent}%)
                </span>
              )}
              {/* Direct link to TradingView.com for restricted symbols like GRAPHITE */}
              <a
                href={`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(taData?.tradingview_symbol || activeSymbol)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 px-2.5 py-1 rounded-lg transition flex items-center gap-1 font-medium"
                title="Open chart directly on TradingView.com"
              >
                <span>🔗 Open on TradingView.com</span>
              </a>
            </div>

            {/* Timeframe Selector Buttons */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-medium">
              {['1', '5', '15', '60', 'D', 'W'].map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-2.5 py-1 rounded-md transition ${
                    timeframe === tf ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tf === '1' ? '1m' : tf === '5' ? '5m' : tf === '15' ? '15m' : tf === '60' ? '1h' : tf}
                </button>
              ))}
            </div>
          </div>


          {/* Embedded TradingView Advanced Charting Widget */}
          <div className="h-[560px]">
            <TradingViewWidget
              symbol={taData?.tradingview_symbol || activeSymbol}
              interval={timeframe}
              theme="dark"
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>💡 If TradingView restricts widget embedding for a specific symbol (e.g. GRAPHITE), click <strong className="text-blue-400">"🔗 Open on TradingView.com"</strong> above to view full chart.</span>
            <span className="hidden md:inline">Gemini AI Analysis remains active for all stocks.</span>
          </div>

        </div>

        {/* Right Column: Gemini AI Technical Analysis & Official TA Gauge */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-5">
          {/* Gemini AI Analysis Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-lg">🤖</span>
                <h3 className="font-semibold text-slate-100 text-base">Gemini AI Technical Digest</h3>
              </div>
              {aiDigest?.technical_stance && (
                <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getStanceColor(aiDigest.technical_stance)}`}>
                  {aiDigest.technical_stance}
                </span>
              )}
            </div>

            {loading ? (
              <div className="space-y-3 py-6 text-center">
                <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-400">Computing technical indicators & running Gemini AI analysis...</p>
              </div>
            ) : error ? (
              <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
                ⚠️ {error}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Confidence Bar */}
                {aiDigest?.confidence_score && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-400">
                      <span>Technical Score & Confidence</span>
                      <span className="text-slate-200 font-bold">{aiDigest.confidence_score}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${aiDigest.confidence_score}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* AI Summary */}
                {aiDigest?.summary && (
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                    {aiDigest.summary}
                  </p>
                )}

                {/* Market Regime & Trade Status Badges */}
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <div className="bg-blue-500/10 border border-blue-500/30 text-blue-300 px-2.5 py-1 rounded-lg font-mono font-medium">
                    Regime: <span className="font-bold">{aiDigest?.market_regime || taData?.market_regime}</span>
                  </div>
                  <div className="bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 px-2.5 py-1 rounded-lg font-mono font-medium">
                    Status: <span className="font-bold">{aiDigest?.trade_status || taData?.trade_status}</span>
                  </div>
                </div>

                {/* AI Summary */}
                {aiDigest?.summary && (
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                    {aiDigest.summary}
                  </p>
                )}

                {/* Trade Setup Action Card */}
                {aiDigest?.trade_setup && (
                  <div className="bg-gradient-to-br from-slate-800/90 to-slate-900 border border-slate-700/60 rounded-xl p-3.5 space-y-2.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-medium">Trade Setup Action:</span>
                      <span className={`font-extrabold tracking-wide uppercase px-2 py-0.5 rounded ${
                        aiDigest.trade_setup.action === 'LONG' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        aiDigest.trade_setup.action === 'SHORT' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {aiDigest.trade_setup.action}
                      </span>
                    </div>

                    {/* Trigger Condition */}
                    {aiDigest.trade_setup.trigger && (
                      <div className="text-[11px] bg-slate-950/80 p-2 rounded-lg border border-slate-800 text-slate-300">
                        <span className="text-slate-400 font-medium block">Trade Trigger Condition:</span>
                        <span>{aiDigest.trade_setup.trigger}</span>
                      </div>
                    )}

                    {/* Entry / Stop Loss / Targets Grid */}
                    <div className="grid grid-cols-4 gap-1.5 text-center text-xs pt-1 border-t border-slate-800">
                      <div>
                        <div className="text-slate-500 text-[10px]">Entry</div>
                        <div className="font-semibold text-slate-200">₹{aiDigest.trade_setup.entry || taData?.current_price}</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-[10px]">Stop Loss</div>
                        <div className="font-semibold text-rose-400">₹{aiDigest.trade_setup.stop_loss}</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-[10px]">Target 1 / 2</div>
                        <div className="font-semibold text-emerald-400">₹{aiDigest.trade_setup.target_1}</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-[10px]">R:R Ratio</div>
                        <div className="font-semibold text-indigo-300">{aiDigest.trade_setup.risk_reward || aiDigest.trade_setup.risk_reward_ratio}</div>
                      </div>
                    </div>

                    {/* Invalidation rule */}
                    {aiDigest.invalidation && (
                      <div className="text-[10px] text-amber-400/90 pt-1 border-t border-slate-800/80">
                        <span className="font-semibold">Invalidation Rule:</span> {aiDigest.invalidation}
                      </div>
                    )}
                  </div>
                )}


                {/* 7-Tier Technical Key Levels Roadmap */}
                {taData?.pivot_points && (
                  <div className="space-y-1.5 pt-1">
                    <div className="text-xs font-semibold text-slate-400">Technical Key Levels Roadmap:</div>
                    <div className="space-y-1 text-xs">
                      {/* 🔴 Major Resistance */}
                      <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300">
                        <span className="flex items-center gap-1.5 font-medium">🔴 Major resistance</span>
                        <span className="font-mono font-bold">₹{taData.pivot_points.major_resistance}</span>
                      </div>

                      {/* 🟠 Resistance */}
                      <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-300">
                        <span className="flex items-center gap-1.5 font-medium">🟠 Resistance</span>
                        <span className="font-mono font-bold">₹{taData.pivot_points.resistance}</span>
                      </div>

                      {/* 🟠 Near Resistance */}
                      <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300">
                        <span className="flex items-center gap-1.5 font-medium">🟠 Near resistance</span>
                        <span className="font-mono font-bold">₹{taData.pivot_points.near_resistance}</span>
                      </div>

                      {/* ⚪ Current / Pivot Area */}
                      <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 font-semibold">
                        <span className="flex items-center gap-1.5">⚪ Current/pivot area</span>
                        <span className="font-mono font-extrabold text-blue-400">₹{taData.current_price} <span className="text-[10px] text-slate-400 font-normal">(Pivot: ₹{taData.pivot_points.pivot})</span></span>
                      </div>

                      {/* 🟢 Support */}
                      <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                        <span className="flex items-center gap-1.5 font-medium">🟢 Support</span>
                        <span className="font-mono font-bold">₹{taData.pivot_points.support}</span>
                      </div>

                      {/* 🟢 Strong Support */}
                      <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-emerald-600/15 border border-emerald-500/30 text-emerald-400">
                        <span className="flex items-center gap-1.5 font-medium">🟢 Strong support</span>
                        <span className="font-mono font-bold">₹{taData.pivot_points.strong_support}</span>
                      </div>

                      {/* 🟢 Major Support */}
                      <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-emerald-700/20 border border-emerald-500/40 text-emerald-300">
                        <span className="flex items-center gap-1.5 font-medium">🟢 Major support</span>
                        <span className="font-mono font-bold">₹{taData.pivot_points.major_support}</span>
                      </div>
                    </div>
                  </div>
                )}


                {/* Indicator Bullet Points */}
                {aiDigest?.indicator_signals?.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-xs font-semibold text-slate-400">Indicator Insights:</div>
                    <ul className="space-y-1 text-xs text-slate-300">
                      {aiDigest.indicator_signals.map((sig, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-blue-400 mt-0.5">•</span>
                          <span>{sig}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Official TradingView TA Gauge Widget */}
          <TradingViewTaGauge symbol={taData?.tradingview_symbol || activeSymbol} interval="1D" />
        </div>
      </div>

      {/* Bottom Technical Indicators Breakdown Table */}
      {taData && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
            <span>📊</span> Quantitative Indicator Matrix ({taData.symbol})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <div className="text-slate-500 text-[11px]">RSI (14)</div>
              <div className="text-base font-bold text-slate-200 mt-0.5">{taData.rsi_14}</div>
              <div className="text-[10px] text-slate-400 mt-1">
                {taData.rsi_14 > 70 ? 'Overbought' : taData.rsi_14 < 30 ? 'Oversold' : 'Neutral'}
              </div>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <div className="text-slate-500 text-[11px]">MACD Histogram</div>
              <div className={`text-base font-bold mt-0.5 ${taData.macd.histogram >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {taData.macd.histogram}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">{taData.macd.crossover} Crossover</div>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <div className="text-slate-500 text-[11px]">MA20 vs MA50</div>
              <div className="text-base font-bold text-slate-200 mt-0.5">₹{taData.moving_averages.ma20}</div>
              <div className="text-[10px] text-slate-400 mt-1">{taData.moving_averages.ma_signal}</div>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <div className="text-slate-500 text-[11px]">MA50 vs MA200</div>
              <div className="text-base font-bold text-slate-200 mt-0.5">₹{taData.moving_averages.ma50}</div>
              <div className="text-[10px] text-slate-400 mt-1">{taData.moving_averages.cross_signal}</div>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <div className="text-slate-500 text-[11px]">Bollinger Band Upper</div>
              <div className="text-base font-bold text-indigo-300 mt-0.5">₹{taData.bollinger_bands.upper_band}</div>
              <div className="text-[10px] text-slate-400 mt-1">Lower: ₹{taData.bollinger_bands.lower_band}</div>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <div className="text-slate-500 text-[11px]">Pivot Point (Daily)</div>
              <div className="text-base font-bold text-amber-300 mt-0.5">₹{taData.pivot_points.pivot}</div>
              <div className="text-[10px] text-slate-400 mt-1">R1: ₹{taData.pivot_points.r1} | S1: ₹{taData.pivot_points.s1}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
