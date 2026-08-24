from fastapi import APIRouter, HTTPException, Query
import urllib.request
import json
from services.ta_service import get_stock_ta_data
from services.ai_service import generate_technical_digest

router = APIRouter(prefix="/api/ta", tags=["Technical Analysis"])

@router.get("/analysis/{symbol}")
async def get_ta_analysis(symbol: str, period: str = Query("6M", description="1W | 1M | 3M | 6M | 1Y | 2Y")):
    """
    Fetch live technical analysis data + Gemini AI technical digest for any symbol.
    """
    try:
        ta_data = get_stock_ta_data(symbol, period)
        ai_digest = await generate_technical_digest(
            symbol=ta_data.get("symbol", symbol),
            company_name=ta_data.get("symbol", symbol),
            ta_data=ta_data
        )
        return {
            "success": True,
            "ta_data": ta_data,
            "ai_digest": ai_digest
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate technical analysis: {str(e)}")

@router.get("/cdp-status")
async def get_cdp_status():
    """
    Optional check if local TradingView Desktop app is open with CDP debug port 9222.
    """
    try:
        req = urllib.request.Request("http://localhost:9222/json/list", headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=2) as response:
            targets = json.loads(response.read().decode('utf-8'))
            tv_target = next((t for t in targets if t.get('type') == 'page' and 'tradingview' in t.get('url', '').lower()), None)
            return {
                "cdp_available": True,
                "tradingview_connected": tv_target is not None,
                "target_url": tv_target.get('url') if tv_target else None,
                "target_title": tv_target.get('title') if tv_target else None
            }
    except Exception:
        return {
            "cdp_available": False,
            "tradingview_connected": False,
            "note": "CDP port 9222 not active. Using Cloud API & Widgets mode."
        }
