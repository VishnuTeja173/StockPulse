import { useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { BarChart2, Mail, Lock, ArrowRight } from "lucide-react"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: "var(--night)" }}>
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] pointer-events-none opacity-20" style={{ background: "#6ee7b7" }}></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] pointer-events-none opacity-20" style={{ background: "#60a5fa" }}></div>

      <div className="w-full max-w-md fade-up">
        <div className="card p-8 text-center" style={{ border: "1px solid rgba(255,255,255,0.05)", background: "rgba(19, 19, 26, 0.7)", backdropFilter: "blur(20px)" }}>
          
          <div className="w-12 h-12 mx-auto rounded-2xl flex items-center justify-center mb-6"
            style={{ background: "linear-gradient(135deg, #6ee7b7, #60a5fa)" }}>
            <BarChart2 size={24} className="text-black" />
          </div>

          <h2 className="font-display text-3xl font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-sm mb-8" style={{ color: "var(--muted)" }}>Log in to access your live portfolio and screener.</p>

          {error && (
            <div className="p-3 mb-6 rounded-lg text-sm" style={{ background: "rgba(248,113,113,0.1)", color: "#f87171", border: "1px solid rgba(248,113,113,0.2)" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted)" }}>Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
                <input 
                  type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full bg-transparent rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none transition-all"
                  style={{ border: "1px solid var(--border)", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.2)" }}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted)" }}>Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
                <input 
                  type="password" required value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full bg-transparent rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none transition-all"
                  style={{ border: "1px solid var(--border)", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.2)" }}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button disabled={loading} type="submit"
              className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-black transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #6ee7b7, #60a5fa)" }}>
              {loading ? "Signing in..." : "Sign In"} <ArrowRight size={16} />
            </button>
          </form>

          <p className="mt-8 text-xs" style={{ color: "var(--muted)" }}>
            Don't have an account? <Link to="/register" className="font-bold text-white hover:underline" style={{ color: "#60a5fa" }}>Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
