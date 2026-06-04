import { useState } from "react"
import { Plus, Trash2, Edit3, Check, X, TrendingUp, TrendingDown } from "lucide-react"
import { usePortfolio } from "../context/PortfolioContext"

const POPULAR = [
  { symbol: "RELIANCE",  name: "Reliance Industries" },
  { symbol: "TCS",       name: "Tata Consultancy Services" },
  { symbol: "HDFCBANK",  name: "HDFC Bank" },
  { symbol: "INFY",      name: "Infosys" },
  { symbol: "ICICIBANK", name: "ICICI Bank" },
  { symbol: "SBIN",      name: "State Bank of India" },
  { symbol: "WIPRO",     name: "Wipro" },
  { symbol: "TATAMOTORS",name: "Tata Motors" },
  { symbol: "ADANIPORTS",name: "Adani Ports" },
  { symbol: "BAJFINANCE",name: "Bajaj Finance" },
]

const emptyForm = { symbol: "", company_name: "", buy_price: "", quantity: "", exchange: "NSE" }

export default function Portfolio() {
  const { portfolio, addStock, removeStock, updateStock } = usePortfolio()
  const [form, setForm] = useState(emptyForm)
  const [editIdx, setEditIdx] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [showForm, setShowForm] = useState(false)
  const [errors, setErrors] = useState({})

  const validate = (f) => {
    const e = {}
    if (!f.symbol.trim()) e.symbol = "Required"
    if (!f.buy_price || isNaN(f.buy_price) || +f.buy_price <= 0) e.buy_price = "Enter valid price"
    if (!f.quantity || isNaN(f.quantity) || +f.quantity <= 0) e.quantity = "Enter valid qty"
    return e
  }

  const handleAdd = () => {
    const e = validate(form)
    if (Object.keys(e).length) { setErrors(e); return }
    addStock({ ...form, symbol: form.symbol.toUpperCase(), buy_price: +form.buy_price, quantity: +form.quantity })
    setForm(emptyForm); setShowForm(false); setErrors({})
  }

  const handleSaveEdit = (symbol) => {
    const e = validate(editForm)
    if (Object.keys(e).length) { setErrors(e); return }
    updateStock(symbol, { ...editForm, buy_price: +editForm.buy_price, quantity: +editForm.quantity })
    setEditIdx(null); setErrors({})
  }

  const quickAdd = (s) => {
    if (portfolio.find(p => p.symbol === s.symbol)) return
    setForm({ ...emptyForm, symbol: s.symbol, company_name: s.name })
    setShowForm(true)
  }

  const invested = portfolio.reduce((sum, s) => sum + s.buy_price * s.quantity, 0)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8 fade-up">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">
            My <span className="gradient-text">Portfolio</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            {portfolio.length} stocks • Total invested: ₹{invested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{ background: "linear-gradient(135deg, #6ee7b7, #60a5fa)", color: "#000", fontWeight: 600 }}>
          <Plus size={16} /> Add Stock
        </button>
      </div>

      {/* Add Stock Form */}
      {showForm && (
        <div className="card p-6 mb-6 fade-up" style={{ borderColor: "rgba(110,231,183,0.3)" }}>
          <h3 className="font-display font-semibold text-white mb-4">Add New Stock</h3>

          {/* Quick Add */}
          <div className="mb-4">
            <p className="text-xs mb-2" style={{ color: "var(--muted)" }}>Quick add popular NSE stocks:</p>
            <div className="flex flex-wrap gap-2">
              {POPULAR.map(s => {
                const already = portfolio.find(p => p.symbol === s.symbol)
                return (
                  <button key={s.symbol} onClick={() => quickAdd(s)} disabled={!!already}
                    className="text-xs px-3 py-1.5 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: "var(--surface)", color: already ? "var(--muted)" : "#60a5fa", border: "1px solid var(--border)" }}>
                    {s.symbol} {already && "✓"}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              { key: "symbol",       label: "Symbol",       placeholder: "e.g. INFY",    type: "text" },
              { key: "company_name", label: "Company Name", placeholder: "e.g. Infosys", type: "text" },
              { key: "buy_price",    label: "Buy Price (₹)",placeholder: "e.g. 1500",    type: "number" },
              { key: "quantity",     label: "Quantity",     placeholder: "e.g. 10",      type: "number" },
            ].map(({ key, label, placeholder, type }) => (
              <div key={key}>
                <label className="block text-xs mb-1.5" style={{ color: "var(--muted)" }}>{label}</label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={e => { setForm(p => ({ ...p, [key]: e.target.value })); setErrors(p => ({ ...p, [key]: "" })) }}
                  placeholder={placeholder}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
                  style={{
                    background: "var(--surface)",
                    border: `1px solid ${errors[key] ? "#f87171" : "var(--border)"}`,
                    color: "#e5e7eb",
                    fontFamily: key === "symbol" ? "'JetBrains Mono'" : "'DM Sans'"
                  }}
                />
                {errors[key] && <p className="text-xs mt-1" style={{ color: "#f87171" }}>{errors[key]}</p>}
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={handleAdd}
              className="px-5 py-2 rounded-lg text-sm font-medium"
              style={{ background: "linear-gradient(135deg, #6ee7b7, #60a5fa)", color: "#000", fontWeight: 600 }}>
              Add to Portfolio
            </button>
            <button onClick={() => { setShowForm(false); setErrors({}) }}
              className="px-5 py-2 rounded-lg text-sm"
              style={{ background: "var(--surface)", color: "var(--muted)", border: "1px solid var(--border)" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Stock list */}
      <div className="space-y-3">
        {portfolio.length === 0 && (
          <div className="card p-12 text-center fade-up">
            <p className="text-lg font-display font-semibold text-white mb-2">No stocks added yet</p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>Click "Add Stock" to start building your portfolio</p>
          </div>
        )}

        {portfolio.map((stock, i) => {
          const isEditing = editIdx === i
          const totalCost = stock.buy_price * stock.quantity

          return (
            <div key={stock.symbol} className="card p-4 fade-up transition-all"
              style={{ animationDelay: `${i * 0.06}s` }}>

              {isEditing ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { key: "symbol",    label: "Symbol",    type: "text" },
                    { key: "company_name", label: "Name",  type: "text" },
                    { key: "buy_price", label: "Buy Price", type: "number" },
                    { key: "quantity",  label: "Quantity",  type: "number" },
                  ].map(({ key, label, type }) => (
                    <div key={key}>
                      <label className="text-xs mb-1 block" style={{ color: "var(--muted)" }}>{label}</label>
                      <input type={type} value={editForm[key] || ""}
                        onChange={e => setEditForm(p => ({ ...p, [key]: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                        style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "#e5e7eb" }} />
                    </div>
                  ))}
                  <div className="col-span-2 md:col-span-4 flex gap-2 mt-1">
                    <button onClick={() => handleSaveEdit(stock.symbol)}
                      className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-sm font-medium"
                      style={{ background: "rgba(110,231,183,0.15)", color: "#6ee7b7" }}>
                      <Check size={13} /> Save
                    </button>
                    <button onClick={() => setEditIdx(null)}
                      className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-sm"
                      style={{ background: "var(--surface)", color: "var(--muted)" }}>
                      <X size={13} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-mono font-bold"
                    style={{ background: "var(--surface)", color: "#60a5fa", border: "1px solid var(--border)" }}>
                    {stock.symbol.slice(0, 3)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-sm">{stock.company_name || stock.symbol}</span>
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: "var(--surface)", color: "var(--muted)" }}>{stock.symbol}</span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                      {stock.quantity} shares @ ₹{stock.buy_price.toLocaleString('en-IN')} = ₹{totalCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => { setEditIdx(i); setEditForm({ ...stock }) }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-blue-500/20"
                      style={{ color: "var(--muted)" }}>
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => removeStock(stock.symbol)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-red-500/20"
                      style={{ color: "var(--muted)" }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
