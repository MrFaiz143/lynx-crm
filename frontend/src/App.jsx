import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Leads from './pages/Leads'
import Contacts from './pages/Contacts'
import Deals from './pages/Deals'
import Activities from './pages/Activities'
import Tasks from './pages/Tasks'
import Reports from './pages/Reports'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-blue-800 text-xl font-semibold">Loading...</p>
    </div>
  )

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={!session ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={session ? <Dashboard /> : <Navigate to="/" />} />
        <Route path="/leads" element={session ? <Leads /> : <Navigate to="/" />} />
        <Route path="/contacts" element={session ? <Contacts /> : <Navigate to="/" />} />
        <Route path="/deals" element={session ? <Deals /> : <Navigate to="/" />} />
        <Route path="/activities" element={session ? <Activities /> : <Navigate to="/" />} />
        <Route path="/tasks" element={session ? <Tasks /> : <Navigate to="/" />} />
        <Route path="/reports" element={session ? <Reports /> : <Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App