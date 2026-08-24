import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';

export default function TradingViewWidget({
  symbol = 'NSE:RELIANCE',
  candles = [],
  pivots = {},
  movingAverages = {},
  theme = 'dark',
  interval = 'D'
}) {
  const [chartMode, setChartMode] = useState('lightweight'); // 'lightweight' or 'iframe'
  const chartContainerRef = useRef(null);
  const iframeContainerRef = useRef(null);

  // Render TradingView Lightweight Canvas Chart (100% reliable, zero popups, zero AAPL resets)
  useEffect(() => {
    if (chartMode !== 'lightweight' || !chartContainerRef.current || !candles || !candles.length) return;

    chartContainerRef.current.innerHTML = '';

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 490,
      layout: {
        background: { color: '#0f172a' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: '#1e293b' },
        horzLines: { color: '#1e293b' },
      },
      crosshair: {
        mode: 0,
      },
      priceScale: {
        borderColor: '#334155',
      },
      timeScale: {
        borderColor: '#334155',
        timeVisible: true,
      },
    });

    // Candlestick Series (Green / Red)
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    const formattedCandles = candles.map(c => ({
      time: c.time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close
    }));

    candlestickSeries.setData(formattedCandles);

    // Volume Histogram Series
    const volumeSeries = chart.addHistogramSeries({
      color: '#3b82f6',
      priceFormat: { type: 'volume' },
      priceScaleId: '',
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    volumeSeries.setData(candles.map(c => ({
      time: c.time,
      value: c.volume,
      color: c.close >= c.open ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'
    })));

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [candles, symbol, chartMode]);

  // Render TradingView iFrame Embed (Fallback)
  useEffect(() => {
    if (chartMode !== 'iframe' || !iframeContainerRef.current) return;

    const container = iframeContainerRef.current;
    container.innerHTML = '';

    let formattedSymbol = symbol.trim().toUpperCase();
    if (!formattedSymbol.includes(':')) {
      formattedSymbol = `NSE:${formattedSymbol}`;
    }

    const widgetHolder = document.createElement('div');
    widgetHolder.className = 'tradingview-widget-container__widget';
    widgetHolder.style.height = '100%';
    widgetHolder.style.width = '100%';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: formattedSymbol,
      interval: interval,
      timezone: 'Asia/Kolkata',
      theme: theme,
      style: '1',
      locale: 'en',
      allow_symbol_change: true,
      support_host: 'https://www.tradingview.com'
    });

    widgetHolder.appendChild(script);
    container.appendChild(widgetHolder);

    return () => {
      if (container) container.innerHTML = '';
    };
  }, [symbol, theme, interval, chartMode]);

  return (
    <div className="w-full h-full min-h-[540px] rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-900 flex flex-col">
      {/* Chart Engine Switcher Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2 font-semibold text-slate-300">
          <span className="text-blue-400">⚡ Active Chart:</span>
          <span>{symbol}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setChartMode('lightweight')}
            className={`px-3 py-1 rounded-md font-semibold transition ${
              chartMode === 'lightweight' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            📊 TradingView Engine (No Licensing Block)
          </button>
          <button
            onClick={() => setChartMode('iframe')}
            className={`px-3 py-1 rounded-md font-semibold transition ${
              chartMode === 'iframe' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🌐 iFrame Embed
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="flex-1 w-full p-2 relative">
        {chartMode === 'lightweight' ? (
          candles && candles.length > 0 ? (
            <div ref={chartContainerRef} className="w-full h-full min-h-[480px]" />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm py-20">
              Fetching OHLC price data for {symbol}...
            </div>
          )
        ) : (
          <div ref={iframeContainerRef} className="w-full h-full min-h-[480px]" />
        )}
      </div>
    </div>
  );
}
