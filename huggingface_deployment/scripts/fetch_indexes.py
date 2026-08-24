import urllib.request
import csv
import json
import os
import ssl

# Disable SSL verification if needed for urllib
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def fetch_nse_index(url):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        response = urllib.request.urlopen(req, context=ctx)
        content = response.read().decode('utf-8').splitlines()
        
        reader = csv.DictReader(content)
        symbols = []
        for row in reader:
            # Keys or values in the CSV might be None due to malformed trailing commas
            cleaned_row = {}
            for k, v in row.items():
                k_str = k.strip() if k else ""
                v_str = v.strip() if v else ""
                cleaned_row[k_str] = v_str
            
            symbol = cleaned_row.get("Symbol")
            if symbol:
                symbols.append(symbol + ".NS")
        return symbols
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return []

NSE_URLS = {
    "NIFTY 50": "https://niftyindices.com/IndexConstituent/ind_nifty50list.csv",
    "NIFTY NEXT 50": "https://niftyindices.com/IndexConstituent/ind_niftynext50list.csv",
    "NIFTY 100": "https://niftyindices.com/IndexConstituent/ind_nifty100list.csv",
    "NIFTY 200": "https://niftyindices.com/IndexConstituent/ind_nifty200list.csv",
    "NIFTY 500": "https://niftyindices.com/IndexConstituent/ind_nifty500list.csv",
    "NIFTY MIDCAP 50": "https://niftyindices.com/IndexConstituent/ind_niftymidcap50list.csv",
    "NIFTY MIDCAP 100": "https://niftyindices.com/IndexConstituent/ind_niftymidcap100list.csv",
    "NIFTY MIDCAP 150": "https://niftyindices.com/IndexConstituent/ind_niftymidcap150list.csv",
    "NIFTY SMALLCAP 50": "https://niftyindices.com/IndexConstituent/ind_niftysmallcap50list.csv",
    "NIFTY SMALLCAP 100": "https://niftyindices.com/IndexConstituent/ind_niftysmallcap100list.csv",
    "NIFTY SMALLCAP 250": "https://niftyindices.com/IndexConstituent/ind_niftysmallcap250list.csv",
    "NIFTY BANK": "https://niftyindices.com/IndexConstituent/ind_niftybanklist.csv",
    "NIFTY AUTO": "https://niftyindices.com/IndexConstituent/ind_niftyautolist.csv",
    "NIFTY IT": "https://niftyindices.com/IndexConstituent/ind_niftyitlist.csv",
    "NIFTY PHARMA": "https://niftyindices.com/IndexConstituent/ind_niftypharmalist.csv",
    "NIFTY FMCG": "https://niftyindices.com/IndexConstituent/ind_niftyfmcglist.csv",
    "NIFTY METAL": "https://niftyindices.com/IndexConstituent/ind_niftymetallist.csv",
    "NIFTY REALTY": "https://niftyindices.com/IndexConstituent/ind_niftyrealtylist.csv",
    "NIFTY MEDIA": "https://niftyindices.com/IndexConstituent/ind_niftymedialist.csv",
    "NIFTY ENERGY": "https://niftyindices.com/IndexConstituent/ind_niftyenergylist.csv",
    "NIFTY INFRA": "https://niftyindices.com/IndexConstituent/ind_niftyinfralist.csv",
    "NIFTY FIN SERVICE": "https://niftyindices.com/IndexConstituent/ind_niftyfinlist.csv"
}

# Hardcoded SENSEX 30 constituents
SENSEX = [
    "ASIANPAINT", "AXISBANK", "BAJAJ-AUTO", "BAJFINANCE", "BAJAJFINSV", 
    "BHARTIARTL", "HCLTECH", "HDFCBANK", "HINDUNILVR", "ICICIBANK", 
    "INDUSINDBK", "INFY", "ITC", "JSWSTEEL", "KOTAKBANK", 
    "LT", "M&M", "MARUTI", "NESTLEIND", "NTPC", 
    "ONGC", "POWERGRID", "RELIANCE", "SBIN", "SUNPHARMA", 
    "TCS", "TATAMOTORS", "TATASTEEL", "TECHM", "TITAN", 
    "ULTRACEMCO", "WIPRO"
]

def main():
    indexes_data = {}
    
    # Process NSE
    for name, url in NSE_URLS.items():
        print(f"Fetching {name}...")
        symbols = fetch_nse_index(url)
        if symbols:
            indexes_data[name] = symbols
            print(f"  -> Found {len(symbols)} symbols.")
        else:
            print(f"  -> Failed to fetch {name}.")
    
    # Add BSE Sensex
    print("Adding BSE SENSEX...")
    indexes_data["BSE SENSEX"] = [s + ".BO" for s in SENSEX]
    print(f"  -> Added {len(SENSEX)} symbols.")
    
    # Write to JSON
    # Go up one level from scripts to backend
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    output_path = os.path.join(base_dir, "data", "indexes.json")
    
    # Ensure data directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, "w") as f:
        json.dump({"indexes": indexes_data}, f, indent=2)
    
    print(f"Successfully generated {output_path} with {len(indexes_data)} indexes.")

if __name__ == "__main__":
    main()
