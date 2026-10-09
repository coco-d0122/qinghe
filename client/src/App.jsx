import React, { createContext, useContext, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { api, getToken, setToken } from './api.js'
import Layout from './components/Layout.jsx'
import Login from './pages/Login.jsx'
import Home from './pages/Home.jsx'
import Policies from './pages/Policies.jsx'
import PolicyDetail from './pages/PolicyDetail.jsx'
import Assistant from './pages/Assistant.jsx'
import MyClaims from './pages/MyClaims.jsx'
import ClaimNew from './pages/ClaimNew.jsx'
import ClaimDetail from './pages/ClaimDetail.jsx'
import PolicyAdmin from './pages/PolicyAdmin.jsx'
import FinanceAdmin from './pages/FinanceAdmin.jsx'
import Me from './pages/Me.jsx'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

function Protected({ roles, children }) {
  const auth = useAuth()
  const location = useLocation()
  if (!auth.user) return <Navigate to="/login" state={{ from: location }} replace />
  if (roles && !roles.includes(auth.user.role)) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(!!getToken())

  useEffect(() => {
    if (!getToken()) return
    api('/auth/me')
      .then((d) => setUser(d.user))
      .catch(() => setToken(null))
      .finally(() => setLoading(false))
  }, [])

  const login = (token, u) => {
    setToken(token)
    setUser(u)
  }
  const logout = () => {
    setToken(null)
    setUser(null)
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-qinghe-50">
        <div className="flex items-center gap-3 text-qinghe-600">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-qinghe-200 border-t-qinghe-600" />
          <span className="text-sm">正在进入青禾报销助手…</span>
        </div>
      </div>
    )
  }

  return (
    <AuthCtx.Provider value={{ user, login, logout }}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
          <Route
            element={
              <Protected>
                <Layout />
              </Protected>
            }
          >
            <Route path="/" element={<Home />} />
            <Route path="/policies" element={<Policies />} />
            <Route path="/policies/:id" element={<PolicyDetail />} />
            <Route path="/assistant" element={<Assistant />} />
            <Route path="/claims" element={<MyClaims />} />
            <Route path="/claims/new" element={<ClaimNew />} />
            <Route path="/claims/:id" element={<ClaimDetail />} />
            <Route
              path="/admin/policies"
              element={
                <Protected roles={['admin']}>
                  <PolicyAdmin />
                </Protected>
              }
            />
            <Route
              path="/finance"
              element={
                <Protected roles={['finance']}>
                  <FinanceAdmin />
                </Protected>
              }
            />
            <Route path="/me" element={<Me />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthCtx.Provider>
  )
}
