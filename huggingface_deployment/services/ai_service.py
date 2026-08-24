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


def generate_technical_digest_sync(symbol: str, company_name: str, ta_data: dict) -> dict:
    """
    Generate an AI Technical Analysis Report using Gemini API based on computed indicators.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    current_price = ta_data.get("current_price", 0)
    change_pct = ta_data.get("change_percent", 0)
    rsi = ta_data.get("rsi_14", 50)
    macd = ta_data.get("macd", {})
    mas = ta_data.get("moving_averages", {})
    bb = ta_data.get("bollinger_bands", {})
    pivots = ta_data.get("pivot_points", {})
    score = ta_data.get("technical_score", 50)
    stance = ta_data.get("overall_stance", "Neutral")

    # Smart technical target and stop-loss defaults based on Pivot Points / MAs
    r1 = pivots.get("r1", 0)
    s1 = pivots.get("s1", 0)
    default_target = round(r1, 2) if (r1 and r1 > current_price) else round(current_price * 1.05, 2)
    default_stop = round(s1, 2) if (s1 and s1 > 0 and s1 < current_price) else round(current_price * 0.96, 2)
    risk = max(round(current_price - default_stop, 2), 0.1)
    reward = max(round(default_target - current_price, 2), 0.1)
    default_rr = f"1:{round(reward / risk, 1)}"

    if not api_key:
        return {
            "technical_stance": stance,
            "confidence_score": score,
            "summary": f"{company_name} ({symbol}) is trading at ₹{current_price} ({change_pct}% today). RSI is at {rsi} and MA signal is '{mas.get('ma_signal', 'N/A')}'. Add GEMINI_API_KEY in backend/.env for AI trade reasoning.",
            "key_levels": {
                "support_1": pivots.get("s1", round(current_price * 0.96, 2)),
                "support_2": pivots.get("s2", round(current_price * 0.92, 2)),
                "resistance_1": pivots.get("r1", round(current_price * 1.05, 2)),
                "resistance_2": pivots.get("r2", round(current_price * 1.08, 2))
            },
            "indicator_signals": [
                f"RSI (14): {rsi} - {'Overbought (>70)' if rsi > 70 else 'Oversold (<30)' if rsi < 30 else 'Healthy Momentum Zone'}",
                f"MACD Histogram: {macd.get('histogram', 0)} ({macd.get('crossover', 'Neutral')} crossover)",
                f"MA20: ₹{mas.get('ma20', 0)} | MA50: ₹{mas.get('ma50', 0)} | MA200: ₹{mas.get('ma200', 0)}"
            ],
            "trade_bias": {
                "action": "BUY ON DIPS" if score >= 70 else ("ACCUMULATE" if score >= 50 else "HOLD / REVIEW"),
                "target_price": default_target,
                "stop_loss": default_stop,
                "risk_reward_ratio": default_rr
            }
        }

    prompt = f"""You are a senior quantitative technical analyst.
Analyze the technical indicators for {company_name} ({symbol}):

MARKET SNAPSHOT:
- Current Price: ₹{current_price} | Change Today: {change_pct}%
- 52-Week Range: ₹{ta_data.get('low_52w')} - ₹{ta_data.get('high_52w')}

TECHNICAL INDICATORS:
- RSI (14): {rsi}
- MACD Line: {macd.get('macd_line')} | Signal Line: {macd.get('signal_line')} | Histogram: {macd.get('histogram')} | Crossover: {macd.get('crossover')}
- Moving Averages: EMA9=₹{mas.get('ema9')}, EMA21=₹{mas.get('ema21')}, MA20=₹{mas.get('ma20')}, MA50=₹{mas.get('ma50')}, MA200=₹{mas.get('ma200')}
- MA Alignment: {mas.get('ma_signal')} | Long Term: {mas.get('cross_signal')}
- Bollinger Bands: Upper=₹{bb.get('upper_band')}, Mid=₹{bb.get('middle_band')}, Lower=₹{bb.get('lower_band')}, %B={bb.get('percent_b')}
- Pivot Points: Pivot=₹{pivots.get('pivot')}, R1=₹{pivots.get('r1')}, R2=₹{pivots.get('r2')}, S1=₹{pivots.get('s1')}, S2=₹{pivots.get('s2')}
- Quant Score: {score}/100 | Stance: {stance}

RULES FOR TARGET PRICE & STOP LOSS:
1. target_price MUST be distinct and HIGHER than current price (₹{current_price}) for bullish setup, typically near Resistance R1 (₹{pivots.get('r1')}) or R2 (₹{pivots.get('r2')}).
2. stop_loss MUST be distinct and LOWER than current price (₹{current_price}), typically near Support S1 (₹{pivots.get('s1')}) or S2 (₹{pivots.get('s2')}).
3. NEVER set target_price or stop_loss equal to current price.

Respond ONLY with valid JSON (no markdown fences, no formatting text):
{{
  "technical_stance": "Strong Bullish / Bullish / Neutral / Bearish / Strong Bearish",
  "confidence_score": integer 1-100,
  "summary": "2-3 crisp sentences summarizing chart structure, momentum, and key setup",
  "key_levels": {{
    "support_1": float,
    "support_2": float,
    "resistance_1": float,
    "resistance_2": float
  }},
  "indicator_signals": [
    "3 specific bullet strings analyzing RSI, MACD, MAs, and Bollinger Bands"
  ],
  "trade_bias": {{
    "action": "BUY ON DIPS / ACCUMULATE / HOLD / TAKE PROFIT / AVOID",
    "target_price": float,
    "stop_loss": float,
    "risk_reward_ratio": "e.g. 1:2.2"
  }}
}}"""

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

        parsed = json.loads(text)

        # Sanity check: Ensure target_price != stop_loss != current_price
        tb = parsed.get("trade_bias", {})
        if not tb.get("target_price") or tb.get("target_price") == current_price:
            tb["target_price"] = default_target
        if not tb.get("stop_loss") or tb.get("stop_loss") == current_price:
            tb["stop_loss"] = default_stop
        parsed["trade_bias"] = tb

        return parsed
    except Exception as e:
        return {
            "technical_stance": stance,
            "confidence_score": score,
            "summary": f"Technical analysis summary for {company_name}: RSI at {rsi}, Price ₹{current_price}. {str(e)[:50]}",
            "key_levels": {
                "support_1": pivots.get("s1", round(current_price * 0.96, 2)),
                "support_2": pivots.get("s2", round(current_price * 0.92, 2)),
                "resistance_1": pivots.get("r1", round(current_price * 1.05, 2)),
                "resistance_2": pivots.get("r2", round(current_price * 1.08, 2))
            },
            "indicator_signals": [
                f"RSI (14): {rsi}",
                f"MACD Histogram: {macd.get('histogram', 0)}",
                f"MA20: ₹{mas.get('ma20', 0)} | MA50: ₹{mas.get('ma50', 0)}"
            ],
            "trade_bias": {
                "action": "HOLD",
                "target_price": default_target,
                "stop_loss": default_stop,
                "risk_reward_ratio": default_rr
            }
        }



async def generate_technical_digest(*args, **kwargs):
    import asyncio
    return await asyncio.to_thread(generate_technical_digest_sync, *args, **kwargs)

