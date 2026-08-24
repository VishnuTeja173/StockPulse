import yfinance as yf
import pandas as pd
import numpy as np
from typing import Dict, Any

PERIOD_MAP = {
    "1W": "5d",
    "1M": "1mo",
    "3M": "3mo",
    "6M": "6mo",
    "1Y": "1y",
    "2Y": "2y",
}

def _calculate_rsi(series: pd.Series, period: int = 14) -> float:
    """Calculate Relative Strength Index (RSI)."""
    delta = series.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    
    rs = gain / (loss + 1e-10)
    rsi = 100 - (100 / (1 + rs))
    val = rsi.iloc[-1]
    return round(float(val), 2) if not pd.isna(val) else 50.0

def _calculate_macd(series: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9) -> Dict[str, float]:
    """Calculate MACD Line, Signal Line, and Histogram."""
    ema_fast = series.ewm(span=fast, adjust=False).mean()
    ema_slow = series.ewm(span=slow, adjust=False).mean()
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal, adjust=False).mean()
    histogram = macd_line - signal_line
    
    return {
        "macd_line": round(float(macd_line.iloc[-1]), 2),
        "signal_line": round(float(signal_line.iloc[-1]), 2),
        "histogram": round(float(histogram.iloc[-1]), 2),
        "crossover": "Bullish" if macd_line.iloc[-1] > signal_line.iloc[-1] else "Bearish"
    }

def _calculate_bollinger_bands(series: pd.Series, period: int = 20, std_dev: int = 2) -> Dict[str, float]:
    """Calculate Bollinger Bands (Upper, Middle, Lower)."""
    sma = series.rolling(window=period).mean()
    std = series.rolling(window=period).std()
    upper = sma + (std * std_dev)
    lower = sma - (std * std_dev)
    
    current_price = series.iloc[-1]
    up_val = upper.iloc[-1]
    low_val = lower.iloc[-1]
    mid_val = sma.iloc[-1]
    
    bandwidth = ((up_val - low_val) / mid_val * 100) if mid_val else 0
    percent_b = ((current_price - low_val) / (up_val - low_val)) if (up_val - low_val) else 0.5
    
    return {
        "upper_band": round(float(up_val), 2),
        "middle_band": round(float(mid_val), 2),
        "lower_band": round(float(low_val), 2),
        "bandwidth_pct": round(float(bandwidth), 2),
        "percent_b": round(float(percent_b), 2),
    }

def _calculate_pivots(high: float, low: float, close: float) -> Dict[str, float]:
    """Calculate Pivot Points (Classic Pivot, R1, R2, S1, S2)."""
    pivot = (high + low + close) / 3.0
    r1 = (2 * pivot) - low
    s1 = (2 * pivot) - high
    r2 = pivot + (high - low)
    s2 = pivot - (high - low)
    
    return {
        "pivot": round(pivot, 2),
        "r1": round(r1, 2),
        "r2": round(r2, 2),
        "s1": round(s1, 2),
        "s2": round(s2, 2),
    }

def get_stock_ta_data(symbol: str, period: str = "6M") -> Dict[str, Any]:
    """
    Fetch price history and compute comprehensive technical analysis indicators.
    Returns ticker info, price action, MAs, RSI, MACD, Bollinger Bands, and Pivot Points.
    """
    clean = symbol.replace(".NS", "").replace(".BO", "").strip().upper()
    yf_period = PERIOD_MAP.get(period.upper(), "6mo")
    
    for suffix in [".NS", ".BO", ""]:
        try:
            ticker_symbol = clean + suffix
            ticker = yf.Ticker(ticker_symbol)
            hist = ticker.history(period=yf_period, interval="1d")
            if hist.empty or len(hist) < 26:
                continue

            hist.index = hist.index.tz_localize(None) if hist.index.tzinfo else hist.index
            hist = hist.sort_index()

            close = hist["Close"]
            high = hist["High"]
            low = hist["Low"]
            volume = hist["Volume"]

            current_price = round(float(close.iloc[-1]), 2)
            prev_close = round(float(close.iloc[-2]), 2)
            change = round(current_price - prev_close, 2)
            change_pct = round((change / prev_close * 100) if prev_close else 0, 2)

            # Moving Averages
            ma20 = round(float(close.rolling(20).mean().iloc[-1]), 2)
            ma50 = round(float(close.rolling(50).mean().iloc[-1]), 2) if len(hist) >= 50 else ma20
            ma200 = round(float(close.rolling(200).mean().iloc[-1]), 2) if len(hist) >= 200 else ma50
            ema9 = round(float(close.ewm(span=9, adjust=False).mean().iloc[-1]), 2)
            ema21 = round(float(close.ewm(span=21, adjust=False).mean().iloc[-1]), 2)

            # Moving Average Signal
            ma_signal = "Bullish Alignment" if (current_price > ma20 > ma50) else (
                "Bearish Alignment" if (current_price < ma20 < ma50) else "Neutral / Mixed"
            )

            # Golden Cross / Death Cross
            cross_signal = "Golden Cross (MA50 > MA200)" if (ma50 > ma200) else "Death Cross (MA50 < MA200)"

            # RSI & MACD & BB & Pivots
            rsi = _calculate_rsi(close, 14)
            macd = _calculate_macd(close)
            bb = _calculate_bollinger_bands(close)
            pivots = _calculate_pivots(float(high.iloc[-2]), float(low.iloc[-2]), float(close.iloc[-2]))

            # Overall Technical Score calculation
            score = 0
            if current_price > ma20: score += 20
            if current_price > ma50: score += 20
            if current_price > ma200: score += 20
            if 40 <= rsi <= 65: score += 20
            if macd["histogram"] > 0: score += 20

            overall_stance = "Strong Bullish" if score >= 80 else (
                "Bullish" if score >= 60 else (
                    "Neutral" if score >= 40 else (
                        "Bearish" if score >= 20 else "Strong Bearish"
                    )
                )
            )

            # TradingView Ticker format (e.g. NSE:RELIANCE or BATS:AAPL)
            tv_symbol = f"NSE:{clean}" if suffix == ".NS" else (
                f"BSE:{clean}" if suffix == ".BO" else f"NASDAQ:{clean}"
            )

            return {
                "symbol": clean,
                "ticker_used": ticker_symbol,
                "tradingview_symbol": tv_symbol,
                "current_price": current_price,
                "change": change,
                "change_percent": change_pct,
                "volume": int(volume.iloc[-1]),
                "avg_volume_20": int(volume.rolling(20).mean().iloc[-1]) if len(volume) >= 20 else int(volume.iloc[-1]),
                "high_52w": round(float(high.max()), 2),
                "low_52w": round(float(low.min()), 2),
                "moving_averages": {
                    "ema9": ema9,
                    "ema21": ema21,
                    "ma20": ma20,
                    "ma50": ma50,
                    "ma200": ma200,
                    "ma_signal": ma_signal,
                    "cross_signal": cross_signal
                },
                "rsi_14": rsi,
                "macd": macd,
                "bollinger_bands": bb,
                "pivot_points": pivots,
                "technical_score": score,
                "overall_stance": overall_stance,
            }

        except Exception as e:
            continue

    # Fallback default
    return {
        "symbol": clean,
        "ticker_used": clean,
        "tradingview_symbol": f"NSE:{clean}",
        "current_price": 0.0,
        "change": 0.0,
        "change_percent": 0.0,
        "volume": 0,
        "avg_volume_20": 0,
        "high_52w": 0.0,
        "low_52w": 0.0,
        "moving_averages": {"ema9": 0, "ema21": 0, "ma20": 0, "ma50": 0, "ma200": 0, "ma_signal": "N/A", "cross_signal": "N/A"},
        "rsi_14": 50.0,
        "macd": {"macd_line": 0, "signal_line": 0, "histogram": 0, "crossover": "Neutral"},
        "bollinger_bands": {"upper_band": 0, "middle_band": 0, "lower_band": 0, "bandwidth_pct": 0, "percent_b": 0.5},
        "pivot_points": {"pivot": 0, "r1": 0, "r2": 0, "s1": 0, "s2": 0},
        "technical_score": 50,
        "overall_stance": "Neutral",
        "error": "Could not fetch history"
    }
