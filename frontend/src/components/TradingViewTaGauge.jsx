import React, { useEffect, useRef } from 'react';

export default function TradingViewTaGauge({ symbol = 'NSE:RELIANCE', interval = '1D' }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';

    let formattedSymbol = symbol.trim().toUpperCase();
    if (!formattedSymbol.includes(':')) {
      if (['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'BATS', 'QQQ', 'SPY'].includes(formattedSymbol)) {
        formattedSymbol = `BATS:${formattedSymbol}`;
      } else {
        formattedSymbol = `NSE:${formattedSymbol}`;
      }
    }

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      interval: interval,
      width: '100%',
      isTransparent: false,
      height: '420',
      symbol: formattedSymbol,
      showIntervalTabs: true,
      displayMode: 'single',
      locale: 'en',
      colorTheme: 'dark'
    });

    const widgetHolder = document.createElement('div');
    widgetHolder.className = 'tradingview-widget-container__widget';
    widgetHolder.appendChild(script);

    container.appendChild(widgetHolder);

    return () => {
      container.innerHTML = '';
    };
  }, [symbol, interval]);

  return (
    <div className="w-full rounded-xl overflow-hidden shadow-md border border-slate-700/60 bg-slate-900" ref={containerRef}>
      <div className="p-4 text-center text-slate-400 text-xs">
        Loading TradingView Technical Analysis...
      </div>
    </div>
  );
}
