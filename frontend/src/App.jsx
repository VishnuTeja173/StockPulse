import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { PortfolioProvider } from "./context/PortfolioContext"
import { AuthProvider, useAuth } from "./context/AuthContext"
import Navbar from "./components/Navbar"
import Dashboard from "./pages/Dashboard"
import Portfolio from "./pages/Portfolio"
import Watchlist from "./pages/Watchlist"
import Alerts from "./pages/Alerts"
import Screener from "./pages/Screener"
import Login from "./pages/Login"
import Register from "./pages/Register"

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? children : <Navigate to="/login" />
}

function MainLayout({ children }) {
  const { user } = useAuth()
  if (!user) return children
  return (
    <>
      <Navbar />
      <main>{children}</main>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PortfolioProvider>
          <div style={{ minHeight: "100vh", background: "var(--night)" }}>
            <MainLayout>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/portfolio" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
                <Route path="/watchlist" element={<ProtectedRoute><Watchlist /></ProtectedRoute>} />
                <Route path="/screener" element={<ProtectedRoute><Screener /></ProtectedRoute>} />
                <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
              </Routes>
            </MainLayout>
          </div>
        </PortfolioProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
