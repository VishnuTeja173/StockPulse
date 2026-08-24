from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import time
from dotenv import load_dotenv
from services.news_service import get_stock_news
from services.ai_service import summarize_news
from services.stock_service import get_stock_info, get_stock_chart
from services.screener_service import run_ma_convergence_screener
from database import engine, Base
import models
from routes import auth_routes, watchlist_routes, ta_routes
from auth import get_current_user

# Create database tables
Base.metadata.create_all(bind=engine)

load_dotenv()

app = FastAPI(title="StockPulse API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router)
app.include_router(watchlist_routes.router)
app.include_router(ta_routes.router)


@app.get("/indexes")
async def get_indexes():
    """Return list of market indexes and their symbols."""
    import json, os
    indexes_path = os.path.join(os.path.dirname(__file__), "data", "indexes.json")
    try:
        with open(indexes_path, "r") as f:
            data = json.load(f)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


_cache: dict = {}
CACHE_TTL = 300  # 5 minutes

def _cache_get(key: str):
    if key in _cache:
        ts, data = _cache[key]
        if time.time() - ts < CACHE_TTL:
            return data
        del _cache[key]
    return None

def _cache_set(key: str, data):
    _cache[key] = (time.time(), data)


class Stock(BaseModel):
    symbol: str
    company_name: Optional[str] = ""
    buy_price: float
    quantity: int
    exchange: Optional[str] = "NSE"

class Portfolio(BaseModel):
    stocks: List[Stock]

class WatchlistStocks(BaseModel):
    symbols: List[str]


@app.get("/")
def root():
    return {"message": "StockPulse API is running 🚀", "version": "2.0.0"}


@app.get("/stock/info/{symbol}")
async def stock_info(symbol: str):
    """Fetch live price info for a single stock."""
    cache_key = f"info:{symbol.upper()}"
    cached = _cache_get(cache_key)
    if cached:
        return cached
    try:
        info = get_stock_info(symbol)
        _cache_set(cache_key, info)
        return info
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/stock/batch")
async def stock_batch(body: WatchlistStocks):
    """Fetch live prices for multiple symbols in one call (used by Watchlist)."""
    results = {}
    for sym in body.symbols:
        cache_key = f"info:{sym.upper()}"
        cached = _cache_get(cache_key)
        if cached:
            results[sym] = cached
            continue
        try:
            info = get_stock_info(sym)
            _cache_set(cache_key, info)
            results[sym] = info
        except Exception as e:
            results[sym] = {"symbol": sym, "error": str(e), "current_price": 0, "change_percent": 0}
    return results

@app.get("/screener/ma-convergence")
async def get_ma_convergence(
    mas: List[int] = Query([20, 50, 200]), 
    force: bool = False, 
    indexes: List[str] = Query(None),
    current_user: models.User = Depends(get_current_user)
):
    try:
        # Pass indexes to screener service; if None, service will use full list
        stocks = run_ma_convergence_screener(
            ma_periods=mas, 
            tolerance_pct=0.05, 
            min_price=50.0, 
            force_refresh=force,
            indexes=indexes
        )
        return {"screener_results": stocks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@app.get("/stock/chart/{symbol}")
async def stock_chart(symbol: str, period: str = Query("3M", description="1W | 1M | 3M | 6M | 1Y | 2Y")):
    """
    Returns OHLCV candlestick data + moving averages (MA20, MA50, MA200, EMA9, EMA21).
    Compatible with lightweight-charts format.
    """
    cache_key = f"chart:{symbol.upper()}:{period}"
    cached = _cache_get(cache_key)
    if cached:
        return cached
    try:
        data = get_stock_chart(symbol, period)
        _cache_set(cache_key, data)
        return data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/digest")
async def get_digest(portfolio: Portfolio, current_user: models.User = Depends(get_current_user)):
    """Get AI-powered morning digest for all stocks in portfolio."""
    results = []
    for stock in portfolio.stocks:
        try:
            # Fetch news
            news_items = get_stock_news(stock.symbol, stock.company_name)
            
            # Live price (with cache)
            cache_key = f"info:{stock.symbol.upper()}"
            stock_data = _cache_get(cache_key)
            if not stock_data:
                stock_data = get_stock_info(stock.symbol)
                _cache_set(cache_key, stock_data)
            
            current_price = stock_data.get("current_price", stock.buy_price) or stock.buy_price
            change_percent = stock_data.get("change_percent", 0)
            week52_high   = stock_data.get("week52_high", 0)
            week52_low    = stock_data.get("week52_low", 0)

            # P&L
            pnl         = (current_price - stock.buy_price) * stock.quantity
            pnl_percent = ((current_price - stock.buy_price) / stock.buy_price) * 100 if stock.buy_price else 0

            # AI summary
            summary = await summarize_news(
                symbol=stock.symbol,
                company_name=stock.company_name or stock.symbol,
                news_items=news_items,
                buy_price=stock.buy_price,
                current_price=current_price,
                quantity=stock.quantity
            )

            results.append({
                "symbol":        stock.symbol,
                "company_name":  stock.company_name or stock.symbol,
                "buy_price":     stock.buy_price,
                "current_price": current_price,
                "quantity":      stock.quantity,
                "pnl":           round(pnl, 2),
                "pnl_percent":   round(pnl_percent, 2),
                "change_percent":round(change_percent, 2),
                "week52_high":   week52_high,
                "week52_low":    week52_low,
                "news_count":    len(news_items),
                "news_items":    news_items[:3],
                "ai_summary":    summary,
                "sentiment":     summary.get("sentiment", "neutral"),
                "action":        summary.get("action", "HOLD"),
            })
        except Exception as e:
            results.append({
                "symbol":        stock.symbol,
                "company_name":  stock.company_name or stock.symbol,
                "buy_price":     stock.buy_price,
                "current_price": stock.buy_price,
                "quantity":      stock.quantity,
                "pnl":           0,
                "pnl_percent":   0,
                "change_percent":0,
                "week52_high":   0,
                "week52_low":    0,
                "news_count":    0,
                "news_items":    [],
                "ai_summary":    {
                    "summary":   f"Could not fetch data: {str(e)}",
                    "sentiment": "neutral", "action": "HOLD",
                    "impact":    "Unknown", "key_point": "", "risk_level": "medium"
                },
                "sentiment":     "neutral",
                "action":        "HOLD",
                "error":         str(e)
            })

    return {"digest": results, "total_stocks": len(results)}


@app.get("/news/{symbol}")
async def get_news(symbol: str, company: str = ""):
    """Fetch raw news for a stock."""
    news = get_stock_news(symbol, company)
    return {"symbol": symbol, "news": news}
