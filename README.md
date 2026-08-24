# 📊 StockPulse — AI-Powered Portfolio Digest for Indian Retail Investors

> Get a personalized morning news digest for every stock in your portfolio, with plain-English AI analysis and risk signals.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+ and Python 3.10+
- A free Gemini API key from https://aistudio.google.com/app/apikey

### 1. Backend Setup
```bash
cd backend
pip install -r requirements.txt

# Copy env file and add your Gemini key
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Start backend
uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

App runs at: http://localhost:5173

---

## 🏗️ Project Structure

```
stockpulse/
├── backend/
│   ├── main.py                 # FastAPI app
│   ├── services/
│   │   ├── stock_service.py    # yfinance — live NSE/BSE prices (free)
│   │   ├── news_service.py     # Google News RSS — stock news (free)
│   │   └── ai_service.py       # Gemini 1.5 Flash — AI summaries (free)
│   ├── requirements.txt
│   ├── render.yaml             # Render deployment config
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── pages/              # Dashboard, Portfolio, Watchlist, Alerts
    │   ├── components/         # StockCard, Navbar, Stats, Skeleton
    │   └── context/            # Portfolio state (localStorage)
    ├── vercel.json             # Vercel deployment config
    └── .env                    # API URL config
```

---

## 🆓 Free Tools Used (Zero Cost to Run)

| Tool | Purpose | Limit |
|------|---------|-------|
| **yfinance** | Live NSE/BSE stock prices | Unlimited |
| **Google News RSS** | Stock-specific news feed | Unlimited |
| **Gemini 1.5 Flash** | AI news summarization | 15 req/min free |
| **Render (free tier)** | Backend hosting | 750 hrs/month |
| **Vercel (free tier)** | Frontend hosting | Unlimited |

---

## 🌍 Deploy to Production

### Backend → Render (Free)
1. Push `backend/` to a GitHub repo
2. Go to https://render.com → New Web Service
3. Connect your GitHub repo
4. Set build command: `pip install -r requirements.txt`
5. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add env variable: `GEMINI_API_KEY = your_key`
7. Deploy → copy your Render URL

### Frontend → Vercel (Free)
1. Push `frontend/` to GitHub
2. Go to https://vercel.com → Import project
3. Add env variable: `VITE_API_URL = https://your-render-url.onrender.com`
4. Deploy → your app is live!

---

## 🔑 Features

- ✅ **Morning Digest** — AI analysis of all your stocks in one feed
- ✅ **Portfolio Manager** — Add/edit/remove stocks with buy price & qty
- ✅ **Watchlist** — Track stocks you're considering
- ✅ **Price Alerts** — Set custom price targets (notifications coming soon)
- ✅ **Risk Signals** — High/medium/low risk flags per stock
- ✅ **P&L Tracking** — Real-time profit & loss per holding
- ✅ **Sentiment Analysis** — AI-powered positive/negative/neutral scoring

---

## 📱 Upcoming (Phase 2)
- WhatsApp digest delivery via Twilio
- Zerodha Kite API integration (auto-import portfolio)
- Hindi language support
- Panic-sell prevention alerts

---

## 🛠️ Built With
- **Frontend:** React + Vite + TailwindCSS
- **Backend:** FastAPI + Python
- **AI:** Google Gemini 1.5 Flash
- **Data:** yfinance + Google News RSS
- **Deploy:** Vercel + Render
