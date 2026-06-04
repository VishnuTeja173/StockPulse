import { createContext, useContext, useState, useEffect } from "react"
import { useAuth } from "./AuthContext"

const PortfolioContext = createContext(null)

export function PortfolioProvider({ children }) {
  const { token, user } = useAuth()
  const [portfolio, setPortfolio] = useState([])

  const [digest, setDigest] = useState(null)
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [apiBase] = useState(import.meta.env.VITE_API_URL || "http://localhost:8000")

  const fetchUserWatchlist = async () => {
    if (!token) return
    try {
      const res = await fetch(`${apiBase}/user/watchlist/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      // Convert watchlist symbols to a dummy portfolio structure for the UI
      const wlStocks = (data.symbols || []).map(sym => ({
        symbol: sym, company_name: sym, buy_price: 0, quantity: 1, exchange: "NSE"
      }))
      setPortfolio(wlStocks)
    } catch (err) {
      console.error("Failed to fetch watchlist:", err)
    }
  }

  useEffect(() => {
    if (user) {
      fetchUserWatchlist()
    } else {
      setPortfolio([])
      setDigest(null)
    }
  }, [user])

  const addStock = async (stock) => {
    if (!token) return
    const res = await fetch(`${apiBase}/user/watchlist/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ symbol: stock.symbol })
    })
    if (res.ok) fetchUserWatchlist()
  }

  const removeStock = async (symbol) => {
    if (!token) return
    const res = await fetch(`${apiBase}/user/watchlist/${symbol}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) fetchUserWatchlist()
  }

  const updateStock = (symbol, updates) => {
    setPortfolio(prev => prev.map(s => s.symbol === symbol ? { ...s, ...updates } : s))
  }

  const fetchDigest = async () => {
    if (portfolio.length === 0) return
    setLoading(true)
    try {
      const res = await fetch(`${apiBase}/digest`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ stocks: portfolio })
      })
      const data = await res.json()
      setDigest(data.digest)
      setLastUpdated(new Date())
    } catch (err) {
      console.error("Failed to fetch digest:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <PortfolioContext.Provider value={{
      portfolio, setPortfolio,
      addStock, removeStock, updateStock,
      digest, fetchDigest, loading, lastUpdated,
      apiBase
    }}>
      {children}
    </PortfolioContext.Provider>
  )
}

export const usePortfolio = () => useContext(PortfolioContext)
