import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState, lazy, Suspense } from 'react'
import { supabase } from './supabaseClient'

const Login = lazy(() => import('./pages/Login'))
const Signup = lazy(() => import('./pages/Signup'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Leads = lazy(() => import('./pages/Leads'))
const Contacts = lazy(() => import('./pages/Contacts'))
const Deals = lazy(() => import('./pages/Deals'))
const Activities = lazy(() => import('./pages/Activities'))
const Tasks = lazy(() => import('./pages/Tasks'))
const Reports = lazy(() => import('./pages/Reports'))
const Quotes = lazy(() => import('./pages/Quotes'))
const QuoteBuilder = lazy(() => import('./pages/QuoteBuilder'))

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-blue-800 text-xl font-semibold">Loading...</p>
    </div>
  )
}

function App() {
  const [session, setSession] = useState(null)
  const [orgId, setOrgId] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session) {
        fetchOrgId(data.session.user.id)
      } else {
        setLoading(false)
      }
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        fetchOrgId(session.user.id)
      } else {
        setOrgId(null)
        setLoading(false)
      }
    })
  }, [])

  const fetchOrgId = async (userId) => {
    const { data } = await supabase
      .from('org_users')
      .select('org_id')
      .eq('user_id', userId)
      .single()
    setOrgId(data?.org_id || null)
    setLoading(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-blue-800 text-xl font-semibold">Loading...</p>
    </div>
  )

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={!session ? <Login /> : <Navigate to="/dashboard" />} />
          <Route path="/signup" element={!session ? <Signup /> : <Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={session ? <Dashboard orgId={orgId} /> : <Navigate to="/" />} />
          <Route path="/leads" element={session ? <Leads orgId={orgId} /> : <Navigate to="/" />} />
          <Route path="/contacts" element={session ? <Contacts orgId={orgId} /> : <Navigate to="/" />} />
          <Route path="/deals" element={session ? <Deals orgId={orgId} /> : <Navigate to="/" />} />
          <Route path="/activities" element={session ? <Activities orgId={orgId} /> : <Navigate to="/" />} />
          <Route path="/tasks" element={session ? <Tasks orgId={orgId} /> : <Navigate to="/" />} />
          <Route path="/reports" element={session ? <Reports orgId={orgId} /> : <Navigate to="/" />} />
          <Route path="/quotes" element={session ? <Quotes orgId={orgId} /> : <Navigate to="/" />} />
          <Route path="/quotes/new" element={session ? <QuoteBuilder orgId={orgId} /> : <Navigate to="/" />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
