import os
import json
import requests
from typing import List

def summarize_news_sync(
    symbol: str,
    company_name: str,
    news_items: List[dict],
    buy_price: float,
    current_price: float,
    quantity: int
) -> dict:
    pnl = (current_price - buy_price) * quantity
    pnl_pct = ((current_price - buy_price) / buy_price * 100) if buy_price else 0

    api_key = os.getenv("GEMINI_API_KEY")
    
    # Graceful degradation if no API key or no news
    if not api_key or not news_items:
        sentiment = "positive" if pnl > 0 else "negative" if pnl < 0 else "neutral"
        action = "HOLD"
        if pnl_pct > 10: action = "CONSIDER BOOKING PROFIT"
        elif pnl_pct < -8: action = "REVIEW POSITION"
        return {
            "summary": f"You own {quantity} shares of {company_name} at ₹{buy_price}. Current price: ₹{current_price}. {'No recent news found.' if not news_items else 'Add GEMINI_API_KEY in .env for AI analysis.'}",
            "sentiment": sentiment,
            "action": action,
            "impact": f"P&L: ₹{round(pnl, 2)} ({round(pnl_pct, 2)}%)",
            "key_point": "Add GEMINI_API_KEY in backend/.env for AI-powered analysis." if news_items else "No news today.",
            "risk_level": "medium"
        }

    news_text = "\n".join([f"- {item['title']} ({item.get('source', '')})" for item in news_items[:5]])

    prompt = f"""You are a friendly stock advisor for Indian retail investors.
Analyze these news for {company_name} ({symbol}).

PORTFOLIO CONTEXT:
- Bought at: ₹{buy_price} | Current: ₹{current_price} | Shares: {quantity}
- P&L: ₹{round(pnl,2)} ({round(pnl_pct,2)}%)

NEWS:
{news_text}

Respond ONLY with valid JSON (no markdown, no extra text):
{{"summary":"2-3 sentence plain English explanation","sentiment":"positive/negative/neutral","action":"BUY/HOLD/SELL/WATCH CLOSELY","impact":"one line about their specific holding","key_point":"the single most important thing today","risk_level":"low/medium/high"}}"""

    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
        headers = {"Content-Type": "application/json"}
        data = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.2}
        }
        
        response = requests.post(url, headers=headers, json=data, timeout=15)
        response.raise_for_status()
        
        result = response.json()
        text = result["candidates"][0]["content"]["parts"][0]["text"].strip()
        text = text.replace("```json", "").replace("```", "").strip()
        
        return json.loads(text)
    except Exception as e:
        return {
            "summary": f"AI analysis unavailable for {company_name}. Check manually.",
            "sentiment": "neutral",
            "action": "HOLD",
            "impact": f"P&L: ₹{round(pnl,2)} ({round(pnl_pct,2)}%)",
            "key_point": f"API Error: {str(e)[:50]}...",
            "risk_level": "medium"
        }

async def summarize_news(*args, **kwargs):
    # Wrapper to maintain async signature expected by main.py
    import asyncio
    return await asyncio.to_thread(summarize_news_sync, *args, **kwargs)
