from services.screener_service import run_ma_convergence_screener

print('Running Screener... (Checking Nifty 200 stocks)')
results = run_ma_convergence_screener(ma_periods=[20, 50, 200])
print(f'Found {len(results)} stocks where MA20, MA50, and MA200 are within 5% of each other:')
for r in results[:5]:
    print(f"- {r['company_name']}: Price INR {r['current_price']} | MA20: {r['mas']['ma20']} | MA50: {r['mas']['ma50']} | MA200: {r['mas']['ma200']} (Spread: {r['diff_pct']}%)")
if len(results) > 5:
    print(f'...and {len(results)-5} more.')
