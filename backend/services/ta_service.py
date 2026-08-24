import yfinance as yf
import pandas as pd
import numpy as np
from typing import Dict, Any, List

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
    """
    Calculate Classic/Traditional Floor Pivot Points.
    P = (H + L + C) / 3
    R1 = (2 * P) - L, R2 = P + (H - L), R3 = P + 2 * (H - L)
    S1 = (2 * P) - H, S2 = P - (H - L), S3 = P - 2 * (H - L)
    """
    pivot = (high + low + close) / 3.0
    r1 = (2 * pivot) - low
    s1 = (2 * pivot) - high
    r2 = pivot + (high - low)
    s2 = pivot - (high - low)
    r3 = pivot + (2 * (high - low))
    s3 = pivot - (2 * (high - low))
    
    return {
        "pivot": round(pivot, 2),
        "r1": round(r1, 2),
        "r2": round(r2, 2),
        "r3": round(r3, 2),
        "s1": round(s1, 2),
        "s2": round(s2, 2),
        "s3": round(s3, 2),
        "major_resistance": round(r3, 2),
        "resistance": round(r2, 2),
        "near_resistance": round(r1, 2),
        "support": round(s1, 2),
        "strong_support": round(s2, 2),
        "major_support": round(s3, 2),
    }

def _build_confluence_zones(current_price: float, pivots: dict, mas: dict) -> Dict[str, List[dict]]:
    """Build multi-level Support and Resistance Confluence Zones with strength scoring."""
    r1, r2, r3 = pivots["r1"], pivots["r2"], pivots["r3"]
    s1, s2, s3 = pivots["s1"], pivots["s2"], pivots["s3"]
    ma20, ma50, ma200 = mas["ma20"], mas["ma50"], mas["ma200"]
    
    # Resistance Zones
    r_zones = []
    # Zone 1: Near Resistance R1
    r1_high = round(max(r1, ma20 if ma20 > current_price else r1), 2)
    r1_low = round(min(r1, ma20 if ma20 > current_price else r1), 2)
    r_zones.append({
        "label": "Near Resistance (R1 Zone)",
        "range": f"₹{r1_low} - ₹{r1_high}" if r1_high != r1_low else f"₹{r1}",
        "min": r1_low, "max": r1_high,
        "strength": "Strong" if abs(r1 - ma20) / current_price < 0.015 else "Moderate",
        "confluence_score": 75 if abs(r1 - ma20) / current_price < 0.015 else 60
    })
    # Zone 2: Resistance R2 / R3
    r_zones.append({
        "label": "Major Resistance (R2 / R3 Zone)",
        "range": f"₹{r2} - ₹{r3}",
        "min": r2, "max": r3,
        "strength": "Very Strong",
        "confluence_score": 85
    })

    # Support Zones
    s_zones = []
    # Zone 1: Immediate Support S1
    s1_high = round(max(s1, ma20 if ma20 < current_price else s1), 2)
    s1_low = round(min(s1, ma20 if ma20 < current_price else s1), 2)
    s_zones.append({
        "label": "Immediate Support (S1 Zone)",
        "range": f"₹{s1_low} - ₹{s1_high}" if s1_high != s1_low else f"₹{s1}",
        "min": s1_low, "max": s1_high,
        "strength": "Strong" if abs(s1 - ma20) / current_price < 0.015 else "Moderate",
        "confluence_score": 70 if abs(s1 - ma20) / current_price < 0.015 else 60
    })
    # Zone 2: Major Support S2 / S3
    s_zones.append({
        "label": "Major Support (S2 / S3 Floor)",
        "range": f"₹{s3} - ₹{s2}",
        "min": s3, "max": s2,
        "strength": "Very Strong",
        "confluence_score": 90
    })

    return {"resistance_zones": r_zones, "support_zones": s_zones}

def get_stock_ta_data(symbol: str, period: str = "6M") -> Dict[str, Any]:
    """
    Fetch price history and compute deterministic technical analysis indicators.
    Uses previous completed session's H, L, C for daily pivot calculation.
    """
    clean = symbol.replace(".NS", "").replace(".BO", "").strip().upper()
    yf_period = PERIOD_MAP.get(period.upper(), "6mo")
    
    for suffix in [".NS", ".BO", ""]:
        try:
            ticker_symbol = clean + suffix
            ticker = yf.Ticker(ticker_symbol)
            hist = ticker.history(period=yf_period, interval="1d")
            if hist.empty or len(hist) < 5:
                hist = yf.download(ticker_symbol, period=yf_period, progress=False)
            if hist.empty or len(hist) < 5:
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

            # Previous COMPLETED session's OHLC for daily pivots (Section 1)
            prev_session_high = float(high.iloc[-2])
            prev_session_low = float(low.iloc[-2])
            prev_session_close = float(close.iloc[-2])

            # Moving Averages
            ma20 = round(float(close.rolling(20).mean().iloc[-1]), 2)
            ma50 = round(float(close.rolling(50).mean().iloc[-1]), 2) if len(hist) >= 50 else ma20
            ma200 = round(float(close.rolling(200).mean().iloc[-1]), 2) if len(hist) >= 200 else ma50
            ema9 = round(float(close.ewm(span=9, adjust=False).mean().iloc[-1]), 2)
            ema21 = round(float(close.ewm(span=21, adjust=False).mean().iloc[-1]), 2)

            # Volume status
            avg_vol_20 = int(volume.rolling(20).mean().iloc[-1]) if len(volume) >= 20 else int(volume.iloc[-1])
            curr_vol = int(volume.iloc[-1])
            volume_status = "Volume Confirmed (> Avg)" if curr_vol >= avg_vol_20 else "Volume Weak (< Avg)"

            # Technical Oscillators
            rsi = _calculate_rsi(close, 14)
            macd = _calculate_macd(close)
            bb = _calculate_bollinger_bands(close)
            pivots = _calculate_pivots(prev_session_high, prev_session_low, prev_session_close)
            zones = _build_confluence_zones(current_price, pivots, {"ma20": ma20, "ma50": ma50, "ma200": ma200})

            # Market Regime Classification (Section 4)
            if current_price > pivots["r1"] and curr_vol > avg_vol_20:
                market_regime = "BULLISH_BREAKOUT"
            elif current_price < pivots["s1"] and curr_vol > avg_vol_20:
                market_regime = "BEARISH_BREAKDOWN"
            elif current_price > pivots["pivot"] and current_price > ma20 and ma20 > ma50:
                market_regime = "BULLISH_TREND"
            elif current_price < pivots["pivot"] and current_price < ma20 and ma20 < ma50:
                market_regime = "BEARISH_TREND"
            elif bb["bandwidth_pct"] > 15:
                market_regime = "HIGH_VOLATILITY"
            elif pivots["s1"] <= current_price <= pivots["r1"]:
                market_regime = "RANGE"
            else:
                market_regime = "NO_CLEAR_SETUP"

            # Confluence Setup Score (0 - 100) (Section 20)
            setup_score = 0
            if current_price > pivots["pivot"]: setup_score += 10
            if current_price > ma20: setup_score += 15
            if current_price > ma50: setup_score += 15
            if current_price > ma200: setup_score += 10
            if curr_vol > avg_vol_20: setup_score += 15
            if 45 <= rsi <= 65: setup_score += 10
            if macd["histogram"] > 0: setup_score += 10
            if market_regime in ["BULLISH_TREND", "BULLISH_BREAKOUT"]: setup_score += 15

            # Trade Status (Section 21)
            if setup_score >= 80 and market_regime == "BULLISH_BREAKOUT":
                trade_status = "BREAKOUT_CONFIRMED"
            elif setup_score >= 65 and market_regime in ["BULLISH_TREND", "BULLISH_BREAKOUT"]:
                trade_status = "LONG_SETUP"
            elif market_regime == "BEARISH_BREAKDOWN":
                trade_status = "BREAKDOWN_CONFIRMED"
            elif setup_score <= 35 and market_regime == "BEARISH_TREND":
                trade_status = "SHORT_SETUP"
            elif pivots["s1"] <= current_price <= pivots["r1"]:
                trade_status = "WATCH"
            elif setup_score < 50:
                trade_status = "NO_TRADE"
            else:
                trade_status = "WAIT"

            # Extract OHLC Candles history for TradingView Lightweight Chart Engine
            candles = []
            for idx, row in hist.iterrows():
                candles.append({
                    "time": idx.strftime("%Y-%m-%d"),
                    "open": round(float(row["Open"]), 2),
                    "high": round(float(row["High"]), 2),
                    "low": round(float(row["Low"]), 2),
                    "close": round(float(row["Close"]), 2),
                    "volume": int(row["Volume"])
                })

            return {
                "symbol": clean,
                "ticker_used": ticker_symbol,
                "tradingview_symbol": tv_symbol,
                "current_price": current_price,
                "prev_close": prev_close,
                "change": change,
                "change_percent": change_pct,
                "volume": curr_vol,
                "avg_volume_20": avg_vol_20,
                "volume_status": volume_status,
                "high_52w": round(float(high.max()), 2),
                "low_52w": round(float(low.min()), 2),
                "market_regime": market_regime,
                "trade_status": trade_status,
                "setup_score": setup_score,
                "candles": candles,
                "moving_averages": {
                    "ema9": ema9,
                    "ema21": ema21,
                    "ma20": ma20,
                    "ma50": ma50,
                    "ma200": ma200,
                    "ma_signal": "Bullish Alignment" if current_price > ma20 > ma50 else ("Bearish Alignment" if current_price < ma20 < ma50 else "Neutral / Mixed"),
                    "cross_signal": "Golden Cross (MA50 > MA200)" if ma50 > ma200 else "Death Cross (MA50 < MA200)"
                },
                "rsi_14": rsi,
                "macd": macd,
                "bollinger_bands": bb,
                "pivot_points": pivots,
                "confluence_zones": zones,
                "technical_score": setup_score,
                "overall_stance": "Strong Bullish" if setup_score >= 80 else ("Bullish" if setup_score >= 60 else ("Neutral" if setup_score >= 40 else "Bearish")),

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
        "volume_status": "Weak",
        "high_52w": 0.0,
        "low_52w": 0.0,
        "market_regime": "NO_CLEAR_SETUP",
        "trade_status": "DATA_ERROR",
        "setup_score": 0,
        "moving_averages": {"ema9": 0, "ema21": 0, "ma20": 0, "ma50": 0, "ma200": 0, "ma_signal": "N/A", "cross_signal": "N/A"},
        "rsi_14": 50.0,
        "macd": {"macd_line": 0, "signal_line": 0, "histogram": 0, "crossover": "Neutral"},
        "bollinger_bands": {"upper_band": 0, "middle_band": 0, "lower_band": 0, "bandwidth_pct": 0, "percent_b": 0.5},
        "pivot_points": {"pivot": 0, "r1": 0, "r2": 0, "r3": 0, "s1": 0, "s2": 0, "s3": 0, "major_resistance": 0, "resistance": 0, "near_resistance": 0, "support": 0, "strong_support": 0, "major_support": 0},
        "confluence_zones": {"resistance_zones": [], "support_zones": []},
        "technical_score": 0,
        "overall_stance": "Neutral",
        "error": "DATA_ERROR"
    }
