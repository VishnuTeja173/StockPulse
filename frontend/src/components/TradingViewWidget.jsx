import React, { useEffect, useRef } from 'react';

export default function TradingViewWidget({ symbol = 'NSE:RELIANCE', theme = 'dark', interval = 'D' }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear previous widget completely
    container.innerHTML = '';

    // Format symbol properly (e.g. RELIANCE -> NSE:RELIANCE, AAPL -> BATS:AAPL)
    let formattedSymbol = symbol.trim().toUpperCase();
    if (!formattedSymbol.includes(':')) {
      if (['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'BATS', 'QQQ', 'SPY'].includes(formattedSymbol)) {
        formattedSymbol = `BATS:${formattedSymbol}`;
      } else {
        formattedSymbol = `NSE:${formattedSymbol}`;
      }
    }

    // Map interval format for TradingView widget (1 -> 1, 5 -> 5, 15 -> 15, 60 -> 60, D -> D, W -> W)
    const formattedInterval = interval === '1' ? '1' : interval === '5' ? '5' : interval === '15' ? '15' : interval === '60' ? '60' : interval === 'W' ? 'W' : 'D';

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
      interval: formattedInterval,
      timezone: 'Asia/Kolkata',
      theme: theme,
      style: '1',
      locale: 'en',
      enable_publishing: false,
      allow_symbol_change: true,
      calendar: false,
      support_host: 'https://www.tradingview.com'
    });

    widgetHolder.appendChild(script);
    container.appendChild(widgetHolder);

    return () => {
      if (container) container.innerHTML = '';
    };
  }, [symbol, theme, interval]);

  return (
    <div className="w-full h-full min-h-[520px] rounded-xl overflow-hidden shadow-lg border border-slate-700/60 bg-slate-900" ref={containerRef}>
      <div className="flex items-center justify-center h-full text-slate-400 text-sm">
        Loading TradingView Chart...
      </div>
    </div>
  );
}
