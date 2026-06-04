import { createContext, useState, useEffect, useContext } from "react"
import { useNavigate } from "react-router-dom"

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8000"

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem("token"))
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token)
      fetchUser()
    } else {
      localStorage.removeItem("token")
      setUser(null)
      setLoading(false)
    }
  }, [token])

  const fetchUser = async () => {
    try {
      const res = await fetch(`${apiBase}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setUser(data)
      } else {
        setToken(null)
      }
    } catch (err) {
      console.error("Failed to fetch user", err)
      setToken(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    const formData = new URLSearchParams()
    formData.append('username', email)
    formData.append('password', password)

    const res = await fetch(`${apiBase}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData,
    })
    
    if (!res.ok) throw new Error("Invalid email or password")
    const data = await res.json()
    setToken(data.access_token)
    navigate("/")
  }

  const register = async (email, password) => {
    const res = await fetch(`${apiBase}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    
    if (!res.ok) {
      const errorData = await res.json()
      throw new Error(errorData.detail || "Registration failed")
    }
    const data = await res.json()
    setToken(data.access_token)
    navigate("/")
  }

  const logout = () => {
    setToken(null)
    navigate("/login")
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
