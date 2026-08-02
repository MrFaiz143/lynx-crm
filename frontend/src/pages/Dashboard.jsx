import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import Sidebar from '../components/Sidebar'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

const STATUS_COLORS = {
  'New': '#3B82F6', 'Hot': '#EF4444', 'Warm': '#F59E0B',
  'Cold': '#06B6D4', 'Won': '#10B981', 'Lost': '#6B7280',
}

const TAG_COLORS = {
  'Hot': '#EF4444', 'Warm': '#F59E0B', 'Cold': '#06B6D4',
}

export default function Dashboard({ orgId }) {
  const [user, setUser] = useState(null)
  const [totalLeads, setTotalLeads] = useState(0)
  const [hotLeads, setHotLeads] = useState(0)
  const [leadsByStatus, setLeadsByStatus] = useState([])
  const [leadsByTag, setLeadsByTag] = useState([])
  const [dealsByStage, setDealsByStage] = useState([])
  const [totalDealValue, setTotalDealValue] = useState(0)
  const [wonValue, setWonValue] = useState(0)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    if (orgId) fetchStats()
  }, [orgId])

  useEffect(() => {
    if (!orgId) return

    const channel = supabase
      .channel('leads-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'leads', filter: `org_id=eq.${orgId}` },
        (payload) => {
          const lead = payload.new
          setToast(lead)
          fetchStats()
          setTimeout(() => setToast(null), 6000)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orgId])

  const fetchStats = async () => {
    const { data: leads } = await supabase.from('leads').select('*').eq('org_id', orgId)
    const { data: deals } = await supabase.from('deals').select('*').eq('org_id', orgId)

    if (leads) {
      setTotalLeads(leads.length)
      setHotLeads(leads.filter(l => l.lead_tag === 'Hot').length)

      const statusCount = {}
      leads.forEach(l => { statusCount[l.status] = (statusCount[l.status] || 0) + 1 })
      setLeadsByStatus(Object.keys(statusCount).map(key => ({ name: key, value: statusCount[key] })))

      const tagCount = { Hot: 0, Warm: 0, Cold: 0 }
      leads.forEach(l => {
        const tag = l.lead_tag || 'Cold'
        tagCount[tag] = (tagCount[tag] || 0) + 1
      })
      setLeadsByTag(Object.keys(tagCount).map(key => ({ name: key, value: tagCount[key] })))
    }

    if (deals) {
      const stageCount = {}
      deals.forEach(d => { stageCount[d.stage] = (stageCount[d.stage] || 0) + 1 })
      setDealsByStage(Object.keys(stageCount).map(key => ({ name: key, count: stageCount[key] })))
      setTotalDealValue(deals.reduce((sum, d) => sum + (d.value || 0), 0))
      setWonValue(deals.filter(d => d.stage === 'Won').reduce((sum, d) => sum + (d.value || 0), 0))
    }
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      <Sidebar active="Dashboard" />

      {toast && (
        <div className="fixed top-5 right-5 z-50 w-80 bg-white rounded-xl shadow-2xl border-l-4 border-green-500 p-4 animate-[slideIn_0.3s_ease-out]">
          <div className="flex items-start gap-3">
            <div className="text-2xl animate-bounce">🎉</div>
            <div className="flex-1">
              <p className="font-bold text-gray-800 text-sm">New Lead Added!</p>
              <p className="text-gray-600 text-sm mt-1">{toast.name}</p>
              <p className="text-gray-400 text-xs mt-0.5">{toast.phone} {toast.source ? `• ${toast.source}` : ''}</p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-gray-400 hover:text-gray-700 text-sm"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="flex-1">
        <div className="hidden md:flex bg-white shadow px-6 py-4 justify-between items-center">
          <h2 className="text-xl font-bold text-gray-700">Dashboard</h2>
          <span className="text-sm text-gray-500">{user?.email}</span>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-xl shadow text-center">
              <p className="text-gray-500 text-sm">Total Leads</p>
              <p className="text-4xl font-bold text-blue-800 mt-2">{totalLeads}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow text-center">
              <p className="text-gray-500 text-sm">🔥 Hot Leads</p>
              <p className="text-4xl font-bold text-red-500 mt-2">{hotLeads}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow text-center">
              <p className="text-gray-500 text-sm">Pipeline Value</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">₹{totalDealValue.toLocaleString()}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow text-center">
              <p className="text-gray-500 text-sm">Won Value</p>
              <p className="text-3xl font-bold text-green-600 mt-2">₹{wonValue.toLocaleString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow">
              <h3 className="text-lg font-bold text-gray-700 mb-4">Leads by Status</h3>
              {leadsByStatus.length === 0 ? (
                <p className="text-gray-400 text-center py-12">Koi data nahi hai</p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={leadsByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(e) => e.name + ': ' + e.value}>
                      {leadsByStatus.map((entry, index) => (
                        <Cell key={index} fill={STATUS_COLORS[entry.name] || '#888'} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white p-6 rounded-xl shadow">
              <h3 className="text-lg font-bold text-gray-700 mb-4">Leads by AI Score 🎯</h3>
              {leadsByTag.length === 0 || totalLeads === 0 ? (
                <p className="text-gray-400 text-center py-12">Koi data nahi hai</p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={leadsByTag} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(e) => e.name + ': ' + e.value}>
                      {leadsByTag.map((entry, index) => (
                        <Cell key={index} fill={TAG_COLORS[entry.name] || '#888'} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white p-6 rounded-xl shadow">
              <h3 className="text-lg font-bold text-gray-700 mb-4">Deals by Stage</h3>
              {dealsByStage.length === 0 ? (
                <p className="text-gray-400 text-center py-12">Koi data nahi hai</p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dealsByStage}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#1E3A8A" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a href="/leads" className="bg-white p-6 rounded-xl shadow hover:shadow-md cursor-pointer block">
              <h3 className="text-lg font-bold text-blue-800 mb-2">📋 Leads</h3>
              <p className="text-gray-500 text-sm">Manage all your leads</p>
            </a>
            <a href="/contacts" className="bg-white p-6 rounded-xl shadow hover:shadow-md cursor-pointer block">
              <h3 className="text-lg font-bold text-blue-800 mb-2">👤 Contacts</h3>
              <p className="text-gray-500 text-sm">Customer database</p>
            </a>
            <a href="/deals" className="bg-white p-6 rounded-xl shadow hover:shadow-md cursor-pointer block">
              <h3 className="text-lg font-bold text-blue-800 mb-2">💼 Deals</h3>
              <p className="text-gray-500 text-sm">Track your sales pipeline</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}