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
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={api_key}"
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
    import asyncio
    return await asyncio.to_thread(summarize_news_sync, *args, **kwargs)


def generate_technical_digest_sync(symbol: str, company_name: str, ta_data: dict) -> dict:
    """
    Core Technical Analysis and Trade-Setup Engine for StockPulse.
    Analyzes stocks using deterministic mathematical calculations, market structure,
    volume, support/resistance confluence zones, and risk/reward.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    current_price = ta_data.get("current_price", 0)
    change_pct = ta_data.get("change_percent", 0)
    rsi = ta_data.get("rsi_14", 50)
    macd = ta_data.get("macd", {})
    mas = ta_data.get("moving_averages", {})
    bb = ta_data.get("bollinger_bands", {})
    pivots = ta_data.get("pivot_points", {})
    zones = ta_data.get("confluence_zones", {})
    market_regime = ta_data.get("market_regime", "NO_CLEAR_SETUP")
    trade_status = ta_data.get("trade_status", "WAIT")
    setup_score = ta_data.get("setup_score", 50)
    stance = ta_data.get("overall_stance", "Neutral")
    vol_status = ta_data.get("volume_status", "Neutral")

    # Calculated target and stop-loss defaults
    r1, r2, r3 = pivots.get("r1", 0), pivots.get("r2", 0), pivots.get("r3", 0)
    s1, s2, s3 = pivots.get("s1", 0), pivots.get("s2", 0), pivots.get("s3", 0)

    t1 = round(r1, 2) if (r1 and r1 > current_price) else round(current_price * 1.04, 2)
    t2 = round(r2, 2) if (r2 and r2 > t1) else round(current_price * 1.08, 2)
    t3 = round(r3, 2) if (r3 and r3 > t2) else round(current_price * 1.12, 2)

    sl = round(s1, 2) if (s1 and s1 > 0 and s1 < current_price) else round(current_price * 0.96, 2)
    risk = max(round(current_price - sl, 2), 0.1)
    reward = max(round(t1 - current_price, 2), 0.1)
    rr_str = f"1:{round(reward / risk, 1)}"

    system_prompt = f"""You are the core Technical Analysis and Trade-Setup Engine for StockPulse.
Your job is to analyze stocks using deterministic mathematical calculations, market structure, price action, volume, volatility, support/resistance, pivot points, trend, and risk/reward.

CRITICAL RULES:
1. NEVER invent market data. Use only the supplied OHLCV parameters.
2. Distinguish between a PRICE LEVEL, a TRADE TRIGGER, and a TRADE SETUP.
3. R1/R2/R3 are potential resistance/target references. S1/S2/S3 are potential support references.
4. Stop loss MUST NOT automatically equal S1/S2; use structural invalidation below support.
5. If risk/reward is poor (< 1:1) or setup score < 50, trade_status must be NO_TRADE or WAIT.
6. Never use absolute words ("guaranteed", "certain", "100%").

DATA PROVIDED FOR {company_name} ({symbol}):
- Current Price: ₹{current_price} (Prev Close: ₹{ta_data.get('prev_close', current_price)})
- 52-Week Range: ₹{ta_data.get('low_52w')} - ₹{ta_data.get('high_52w')}
- Calculated Market Regime: {market_regime}
- Calculated Trade Status: {trade_status}
- Setup Score: {setup_score}/100
- Volume Status: {vol_status} (Volume: {ta_data.get('volume')}, 20 MA Vol: {ta_data.get('avg_volume_20')})
- RSI (14): {rsi}
- MACD Line: {macd.get('macd_line')}, Signal: {macd.get('signal_line')}, Histogram: {macd.get('histogram')} ({macd.get('crossover')} Crossover)
- Moving Averages: EMA9=₹{mas.get('ema9')}, EMA21=₹{mas.get('ema21')}, MA20=₹{mas.get('ma20')}, MA50=₹{mas.get('ma50')}, MA200=₹{mas.get('ma200')} ({mas.get('ma_signal')}, {mas.get('cross_signal')})
- Bollinger Bands: Upper=₹{bb.get('upper_band')}, Mid=₹{bb.get('middle_band')}, Lower=₹{bb.get('lower_band')}, Bandwidth: {bb.get('bandwidth_pct')}%
- Daily Floor Pivots: P=₹{pivots.get('pivot')}, R1=₹{r1}, R2=₹{r2}, R3=₹{r3}, S1=₹{s1}, S2=₹{s2}, S3=₹{s3}

Respond ONLY with a valid JSON object following this exact schema:
{{
  "stock": "{symbol}",
  "current_price": {current_price},
  "market_regime": "{market_regime}",
  "trade_status": "{trade_status}",
  "technical_stance": "{stance}",
  "confidence_score": {setup_score},
  "summary": "2-3 sentence technical overview synthesizing trend, momentum, and key setup",
  "market_structure": "Crisp analysis of price structure, trend, higher highs/lows or range",
  "volume": "{vol_status}",
  "momentum": "{'Positive' if macd.get('histogram', 0) > 0 else 'Negative' if macd.get('histogram', 0) < 0 else 'Neutral'}",
  "key_support_zones": [
    {{ "zone": "₹{s1}–₹{s2}", "strength": "Strong Support Zone" }},
    {{ "zone": "₹{s3} Floor", "strength": "Major Support Level" }}
  ],
  "key_resistance_zones": [
    {{ "zone": "₹{r1}–₹{r2}", "strength": "Resistance Zone" }},
    {{ "zone": "₹{r3} Ceiling", "strength": "Major Resistance Level" }}
  ],
  "trade_setup": {{
    "action": "{'LONG' if setup_score >= 60 else ('SHORT' if setup_score <= 35 else 'NONE')}",
    "entry": {current_price},
    "trigger": "Candle close above R1 with volume confirmation or pull-back to S1 support",
    "stop_loss": {sl},
    "target_1": {t1},
    "target_2": {t2},
    "target_3": {t3},
    "risk_reward": "{rr_str}",
    "setup_score": {setup_score}
  }},
  "invalidation": "Clean drop below Support S1 (₹{s1}) or 20 EMA invalidates long bias",
  "why": "Setup derived from pivot positioning, EMA alignment, and RSI momentum."
}}"""

    if not api_key:
        return {
            "stock": symbol,
            "current_price": current_price,
            "market_regime": market_regime,
            "trade_status": trade_status,
            "technical_stance": stance,
            "confidence_score": setup_score,
            "summary": f"{company_name} ({symbol}) is trading at ₹{current_price} in a {market_regime.replace('_', ' ')} regime. RSI is at {rsi} and MA signal is '{mas.get('ma_signal', 'N/A')}'. Add GEMINI_API_KEY in backend/.env for AI trade reasoning.",
            "market_structure": f"Price is trading {'above' if current_price > pivots.get('pivot', 0) else 'below'} Central Pivot ₹{pivots.get('pivot')} with {mas.get('ma_signal', 'mixed MAs')}.",
            "volume": vol_status,
            "momentum": "Positive" if macd.get("histogram", 0) > 0 else "Negative",
            "key_support_zones": [
                { "zone": f"₹{s1}–₹{s2}", "strength": "Strong Support" },
                { "zone": f"₹{s3}", "strength": "Major Support" }
            ],
            "key_resistance_zones": [
                { "zone": f"₹{r1}–₹{r2}", "strength": "Resistance Zone" },
                { "zone": f"₹{r3}", "strength": "Major Resistance" }
            ],
            "trade_setup": {
                "action": "LONG" if setup_score >= 60 else ("SHORT" if setup_score <= 35 else "NONE"),
                "entry": current_price,
                "trigger": "Candle close above Near Resistance R1 or bounce from Support S1",
                "stop_loss": sl,
                "target_1": t1,
                "target_2": t2,
                "target_3": t3,
                "risk_reward": rr_str,
                "setup_score": setup_score
            },
            "invalidation": f"Price drop below Support S1 (₹{s1}) invalidates setup.",
            "why": f"Quantitative score of {setup_score}/100 based on pivot alignment and moving averages."
        }

    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={api_key}"
        headers = {"Content-Type": "application/json"}
        data = {
            "contents": [{"parts": [{"text": system_prompt}]}],
            "generationConfig": {"temperature": 0.2}
        }

        response = requests.post(url, headers=headers, json=data, timeout=15)
        response.raise_for_status()

        result = response.json()
        text = result["candidates"][0]["content"]["parts"][0]["text"].strip()
        text = text.replace("```json", "").replace("```", "").strip()

        parsed = json.loads(text)

        # Sanity check: Ensure target_1 != stop_loss != current_price
        ts = parsed.get("trade_setup", {})
        if not ts.get("target_1") or ts.get("target_1") == current_price:
            ts["target_1"] = t1
        if not ts.get("stop_loss") or ts.get("stop_loss") == current_price:
            ts["stop_loss"] = sl
        parsed["trade_setup"] = ts

        return parsed
    except Exception as e:
        return {
            "stock": symbol,
            "current_price": current_price,
            "market_regime": market_regime,
            "trade_status": trade_status,
            "technical_stance": stance,
            "confidence_score": setup_score,
            "summary": f"Technical analysis for {company_name}: RSI at {rsi}, Price ₹{current_price}. {str(e)[:50]}",
            "market_structure": f"Price trading near Pivot ₹{pivots.get('pivot')}.",
            "volume": vol_status,
            "momentum": "Neutral",
            "key_support_zones": [{ "zone": f"₹{s1}–₹{s2}", "strength": "Support" }],
            "key_resistance_zones": [{ "zone": f"₹{r1}–₹{r2}", "strength": "Resistance" }],
            "trade_setup": {
                "action": "NONE",
                "entry": current_price,
                "trigger": "Wait for breakout confirmation",
                "stop_loss": sl,
                "target_1": t1,
                "target_2": t2,
                "target_3": t3,
                "risk_reward": rr_str,
                "setup_score": setup_score
            },
            "invalidation": f"Price drop below S1 (₹{s1}) invalidates setup.",
            "why": f"Backend calculated score {setup_score}/100."
        }


async def generate_technical_digest(*args, **kwargs):
    import asyncio
    return await asyncio.to_thread(generate_technical_digest_sync, *args, **kwargs)
