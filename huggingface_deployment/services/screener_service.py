import yfinance as yf
import pandas as pd
import time
import urllib.request
import io
from typing import List, Dict

# Cache to store price data dataframe (lasts for 5 minutes)
_screener_cache = {
    "timestamp": 0,
    "data": None
}
CACHE_TTL = 5 * 60  # 5 minutes

def get_nifty_200_symbols() -> List[str]:
    url = 'https://archives.nseindia.com/content/indices/ind_nifty200list.csv'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        response = urllib.request.urlopen(req)
        csv_data = response.read().decode('utf-8')
        df = pd.read_csv(io.StringIO(csv_data))
        symbols = df['Symbol'].tolist()
        # Append .NS for Yahoo Finance
        return [f"{sym}.NS" for sym in symbols]
    except Exception as e:
        print(f"Failed to fetch Nifty 200 list: {e}")
        # Fallback to a hardcoded small list if NSE is blocking
        return ['RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS', 'SBIN.NS', 'BHARTIARTL.NS', 'ITC.NS']

def get_all_market_symbols() -> List[str]:
    tickers = get_nifty_200_symbols()
    import json, os
    indexes_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'indexes.json')
    try:
        with open(indexes_path, 'r') as f:
            index_data = json.load(f)
        for symbols in index_data.get('indexes', {}).values():
            tickers.extend(symbols)
    except Exception:
        pass
    return list(set(tickers))

def run_ma_convergence_screener(ma_periods: List[int], tolerance_pct: float = 0.05, min_price: float = 50.0, force_refresh: bool = False, indexes: List[str] = None) -> List[Dict]:
    global _screener_cache
    
    if not ma_periods or len(ma_periods) < 2:
        raise ValueError("At least two moving averages must be provided.")
        
    max_ma_needed = max(ma_periods)
    close_data = None
    
    all_tickers = get_all_market_symbols()

    if not force_refresh and _screener_cache["data"] is not None and (time.time() - _screener_cache["timestamp"]) < CACHE_TTL:
        close_data = _screener_cache["data"]
    else:
        # Ensure we download enough data for the largest MA (e.g. 200 days needs 1y, 400 days needs 2y)
        period_needed = '1y' if max_ma_needed <= 250 else '2y'
        data = yf.download(all_tickers, period=period_needed, interval='1d', progress=False)
        
        if 'Close' in data.columns:
            close_data = data['Close']
        else:
            close_data = data
            
        _screener_cache["data"] = close_data
        _screener_cache["timestamp"] = time.time()

    tickers_to_screen = all_tickers
    if indexes:
        import json, os
        indexes_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'indexes.json')
        selected_symbols = set()
        try:
            with open(indexes_path, 'r') as f:
                index_data = json.load(f)
            for idx_name in indexes:
                symbols = index_data.get('indexes', {}).get(idx_name, [])
                selected_symbols.update(symbols)
        except Exception:
            pass
        tickers_to_screen = [t for t in all_tickers if t in selected_symbols]

    results = []

    for ticker in tickers_to_screen:
        if ticker not in close_data.columns:
            continue
        close = close_data[ticker].dropna()
        if len(close) < max_ma_needed:
            continue
            
        current_price = float(close.iloc[-1])
        if current_price < min_price:
            continue
            
        # Calculate dynamic moving averages
        ma_values = []
        ma_dict = {}
        for period in ma_periods:
            val = float(close.rolling(period).mean().iloc[-1])
            ma_values.append(val)
            ma_dict[f"ma{period}"] = round(val, 2)
        
        max_ma = max(ma_values)
        min_ma = min(ma_values)
        
        diff_pct = (max_ma - min_ma) / min_ma
        if diff_pct <= tolerance_pct:
            company_name = ticker.replace('.NS', '')
            results.append({
                'symbol': ticker,
                'company_name': company_name,
                'current_price': round(current_price, 2),
                'mas': ma_dict,
                'diff_pct': round(diff_pct * 100, 2)
            })

    results = sorted(results, key=lambda x: x['diff_pct'])
    return results
