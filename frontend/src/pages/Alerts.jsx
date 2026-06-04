import { useState } from "react"
import { Bell, Plus, Trash2, BellOff } from "lucide-react"
import { usePortfolio } from "../context/PortfolioContext"

const ALERT_TYPES = [
  { value: "price_above", label: "Price goes above ₹" },
  { value: "price_below", label: "Price drops below ₹" },
  { value: "pnl_percent", label: "P&L crosses %" },
]

export default function Alerts() {
  const { portfolio } = usePortfolio()
  const [alerts, setAlerts] = useState(() => {
    try { return JSON.parse(localStorage.getItem("stockpulse_alerts")) || [] }
    catch { return [] }
  })
  const [form, setForm] = useState({ symbol: "", type: "price_above", value: "" })
  const [showForm, setShowForm] = useState(false)

  const handleAdd = () => {
    if (!form.symbol || !form.value) return
    const updated = [...alerts, { ...form, id: Date.now(), active: true }]
    setAlerts(updated)
    localStorage.setItem("stockpulse_alerts", JSON.stringify(updated))
    setForm({ symbol: "", type: "price_above", value: "" })
    setShowForm(false)
  }

  const toggleAlert = (id) => {
    const updated = alerts.map(a => a.id === id ? { ...a, active: !a.active } : a)
    setAlerts(updated)
    localStorage.setItem("stockpulse_alerts", JSON.stringify(updated))
  }

  const removeAlert = (id) => {
    const updated = alerts.filter(a => a.id !== id)
    setAlerts(updated)
    localStorage.setItem("stockpulse_alerts", JSON.stringify(updated))
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8 fade-up">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">
            Price <span className="gradient-text">Alerts</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            Get notified when your stocks hit your targets
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
          style={{ background: "linear-gradient(135deg, #6ee7b7, #60a5fa)", color: "#000", fontWeight: 600 }}>
          <Plus size={16} /> New Alert
        </button>
      </div>

      {/* Coming soon banner */}
      <div className="card p-4 mb-6 fade-up flex items-start gap-3" style={{ borderColor: "rgba(251,191,36,0.3)" }}>
        <Bell size={18} style={{ color: "#fbbf24", flexShrink: 0, marginTop: 2 }} />
        <div>
          <p className="text-sm font-semibold" style={{ color: "#fbbf24" }}>Push notifications coming soon</p>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
            Alerts are saved locally for now. WhatsApp & email notifications will be available in the next release.
          </p>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="card p-5 mb-6 fade-up" style={{ borderColor: "rgba(110,231,183,0.3)" }}>
          <h3 className="font-display font-semibold text-white mb-4">Create Alert</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "var(--muted)" }}>Stock</label>
              <select value={form.symbol} onChange={e => setForm(p => ({ ...p, symbol: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "#e5e7eb" }}>
                <option value="">Select stock</option>
                {portfolio.map(s => (
                  <option key={s.symbol} value={s.symbol}>{s.symbol}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "var(--muted)" }}>Alert Type</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "#e5e7eb" }}>
                {ALERT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "var(--muted)" }}>Target Value</label>
              <input type="number" value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))}
                placeholder="e.g. 2500"
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "#e5e7eb" }} />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleAdd}
              className="px-5 py-2 rounded-lg text-sm font-semibold"
              style={{ background: "linear-gradient(135deg, #6ee7b7, #60a5fa)", color: "#000" }}>
              Create Alert
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-5 py-2 rounded-lg text-sm"
              style={{ background: "var(--surface)", color: "var(--muted)", border: "1px solid var(--border)" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Alerts list */}
      <div className="space-y-3">
        {alerts.length === 0 && (
          <div className="card p-12 text-center fade-up">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(251,191,36,0.1)" }}>
              <Bell size={22} style={{ color: "#fbbf24" }} />
            </div>
            <p className="font-display font-semibold text-white mb-2">No alerts yet</p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>Set price targets for your stocks</p>
          </div>
        )}

        {alerts.map((alert, i) => {
          const type = ALERT_TYPES.find(t => t.value === alert.type)
          return (
            <div key={alert.id} className="card p-4 flex items-center gap-4 fade-up"
              style={{ animationDelay: `${i * 0.05}s`, opacity: alert.active ? 1 : 0.5 }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: alert.active ? "rgba(251,191,36,0.15)" : "var(--surface)" }}>
                {alert.active ? <Bell size={16} style={{ color: "#fbbf24" }} /> : <BellOff size={16} style={{ color: "var(--muted)" }} />}
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-mono font-semibold text-white text-sm">{alert.symbol}</span>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                  {type?.label}{alert.value}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => toggleAlert(alert.id)}
                  className="text-xs px-3 py-1.5 rounded-lg transition-all"
                  style={{
                    background: alert.active ? "rgba(110,231,183,0.1)" : "var(--surface)",
                    color: alert.active ? "#6ee7b7" : "var(--muted)",
                    border: `1px solid ${alert.active ? "rgba(110,231,183,0.25)" : "var(--border)"}`
                  }}>
                  {alert.active ? "Active" : "Paused"}
                </button>
                <button onClick={() => removeAlert(alert.id)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-red-500/20"
                  style={{ color: "var(--muted)" }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
