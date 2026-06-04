import yfinance as yf
import pandas as pd
from typing import Optional

def get_stock_info(symbol: str) -> dict:
    """
    Fetch stock price from Yahoo Finance (yfinance).
    Tries NSE suffix (.NS) first, then BSE (.BO).
    """
    clean = symbol.replace(".NS","").replace(".BO","").strip().upper()
    
    for suffix in [".NS", ".BO", ""]:
        try:
            ticker_symbol = clean + suffix
            ticker = yf.Ticker(ticker_symbol)
            hist = ticker.history(period="5d")
            if hist.empty:
                continue
            current_price = float(hist["Close"].iloc[-1])
            prev_close    = float(hist["Close"].iloc[-2]) if len(hist) > 1 else current_price
            change        = current_price - prev_close
            change_pct    = (change / prev_close * 100) if prev_close else 0
            info = ticker.fast_info
            
            # 52-week high/low
            try:
                week52_high = getattr(info, "year_high", None) or 0
                week52_low  = getattr(info, "year_low", None) or 0
            except Exception:
                week52_high, week52_low = 0, 0

            return {
                "symbol":         clean,
                "ticker_used":    ticker_symbol,
                "current_price":  round(current_price, 2),
                "prev_close":     round(prev_close, 2),
                "change":         round(change, 2),
                "change_percent": round(change_pct, 2),
                "company_name":   getattr(info, "display_name", clean) or clean,
                "volume":         getattr(info, "three_month_average_volume", 0) or 0,
                "week52_high":    round(week52_high, 2),
                "week52_low":     round(week52_low, 2),
            }
        except Exception:
            continue

    # Graceful fallback
    return {
        "symbol": clean, "ticker_used": clean,
        "current_price": 0, "prev_close": 0,
        "change": 0, "change_percent": 0,
        "company_name": clean,
        "volume": 0, "week52_high": 0, "week52_low": 0,
    }


def _compute_ma(series: pd.Series, period: int) -> list:
    """Compute simple moving average and return as list aligned with dates."""
    ma = series.rolling(window=period, min_periods=1).mean()
    return [round(float(v), 2) if not pd.isna(v) else None for v in ma]


def _compute_ema(series: pd.Series, period: int) -> list:
    """Compute exponential moving average."""
    ema = series.ewm(span=period, adjust=False).mean()
    return [round(float(v), 2) if not pd.isna(v) else None for v in ema]


PERIOD_MAP = {
    "1W": "5d",
    "1M": "1mo",
    "3M": "3mo",
    "6M": "6mo",
    "1Y": "1y",
    "2Y": "2y",
}

def get_stock_chart(symbol: str, period: str = "3M") -> dict:
    """
    Fetch OHLCV data and compute MA20, MA50, MA200, EMA9, EMA21 for charting.
    Returns data in lightweight-charts compatible format.
    """
    clean = symbol.replace(".NS","").replace(".BO","").strip().upper()
    yf_period = PERIOD_MAP.get(period.upper(), "3mo")

    for suffix in [".NS", ".BO", ""]:
        try:
            ticker_symbol = clean + suffix
            ticker = yf.Ticker(ticker_symbol)
            hist = ticker.history(period=yf_period, interval="1d")
            if hist.empty or len(hist) < 2:
                continue

            hist.index = hist.index.tz_localize(None) if hist.index.tzinfo else hist.index
            hist = hist.sort_index()

            close = hist["Close"]
            dates = [str(d.date()) for d in hist.index]

            # Candlestick bars
            candles = []
            for i, (idx, row) in enumerate(hist.iterrows()):
                candles.append({
                    "time":   str(idx.date()),
                    "open":   round(float(row["Open"]), 2),
                    "high":   round(float(row["High"]), 2),
                    "low":    round(float(row["Low"]), 2),
                    "close":  round(float(row["Close"]), 2),
                    "volume": int(row.get("Volume", 0) or 0),
                })

            # Moving averages as {time, value} series for lightweight-charts
            def _make_line(ma_values: list) -> list:
                return [
                    {"time": d, "value": v}
                    for d, v in zip(dates, ma_values)
                    if v is not None
                ]

            return {
                "symbol":  clean,
                "period":  period,
                "candles": candles,
                "ma20":    _make_line(_compute_ma(close, 20)),
                "ma50":    _make_line(_compute_ma(close, 50)),
                "ma200":   _make_line(_compute_ma(close, 200)),
                "ema9":    _make_line(_compute_ema(close, 9)),
                "ema21":   _make_line(_compute_ema(close, 21)),
            }
        except Exception:
            continue

    return {"symbol": clean, "period": period, "candles": [], "ma20": [], "ma50": [], "ma200": [], "ema9": [], "ema21": []}
