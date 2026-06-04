import { Link, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { BarChart2, Briefcase, Bell, Settings, Zap, Activity } from "lucide-react"

const navLinks = [
  { path: "/",          label: "Digest",    icon: Zap },
  { path: "/portfolio", label: "Portfolio", icon: Briefcase },
  { path: "/watchlist", label: "Watchlist", icon: BarChart2 },
  { path: "/screener",  label: "Screener",  icon: Activity },
  { path: "/alerts",    label: "Alerts",    icon: Bell },
]

export default function Navbar() {
  const { pathname } = useLocation()
  const { logout } = useAuth()

  return (
    <nav style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}
      className="sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
      
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #6ee7b7, #60a5fa)" }}>
          <BarChart2 size={16} className="text-black" />
        </div>
        <span className="font-display font-bold text-lg gradient-text">StockPulse</span>
      </Link>

      {/* Nav Links */}
      <div className="flex items-center gap-1">
        {navLinks.map(({ path, label, icon: Icon }) => {
          const active = pathname === path
          return (
            <Link key={path} to={path}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                color: active ? "#6ee7b7" : "var(--muted)",
                background: active ? "rgba(110,231,183,0.1)" : "transparent",
              }}>
              <Icon size={15} />
              <span className="hidden md:block">{label}</span>
            </Link>
          )
        })}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
          style={{ background: "rgba(110,231,183,0.1)", color: "#6ee7b7", border: "1px solid rgba(110,231,183,0.2)" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" style={{ background: "#6ee7b7" }}></span>
          Live
        </div>
        <button onClick={logout} className="ml-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-80"
          style={{ background: "rgba(248,113,113,0.1)", color: "#f87171", border: "1px solid rgba(248,113,113,0.2)" }}>
          Logout
        </button>
      </div>
    </nav>
  )
}
