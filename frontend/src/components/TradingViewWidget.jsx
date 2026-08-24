import React, { useEffect, useRef } from 'react';

export default function TradingViewWidget({ symbol = 'NSE:RELIANCE', theme = 'dark', interval = 'D' }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear previous widget
    container.innerHTML = '';

    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container__widget';
    widgetContainer.style.height = '100%';
    widgetContainer.style.width = '100%';
    container.appendChild(widgetContainer);

    // Format symbol properly (e.g. RELIANCE -> NSE:RELIANCE, AAPL -> BATS:AAPL)
    let formattedSymbol = symbol.trim().toUpperCase();
    if (!formattedSymbol.includes(':')) {
      if (['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'BATS', 'QQQ', 'SPY'].includes(formattedSymbol)) {
        formattedSymbol = `BATS:${formattedSymbol}`;
      } else {
        formattedSymbol = `NSE:${formattedSymbol}`;
      }
    }

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (window.TradingView) {
        new window.TradingView.widget({
          autosize: true,
          symbol: formattedSymbol,
          interval: interval,
          timezone: 'Asia/Kolkata',
          theme: theme,
          style: '1',
          locale: 'en',
          toolbar_bg: '#f1f3f6',
          enable_publishing: false,
          allow_symbol_change: true,
          container_id: widgetContainer.id || (widgetContainer.id = `tv_chart_${Math.random().toString(36).substring(2, 9)}`),
          details: true,
          hotlist: true,
          calendar: true,
          studies: [
            'STD;RSI',
            'STD;MACD',
            'STD;EMA'
          ],
        });
      }
    };
    container.appendChild(script);

    return () => {
      container.innerHTML = '';
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
