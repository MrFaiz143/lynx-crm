import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import Sidebar from '../components/Sidebar'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [totalLeads, setTotalLeads] = useState(0)
  const [hotLeads, setHotLeads] = useState(0)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })
    fetchStats()
  }, [])

  const fetchStats = async () => {
    const { data } = await supabase.from('leads').select('*')
    if (data) {
      setTotalLeads(data.length)
      setHotLeads(data.filter(l => l.status === 'Hot').length)
    }
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      <Sidebar active="Dashboard" />

      <div className="flex-1">
        {/* Top bar - desktop only */}
        <div className="hidden md:flex bg-white shadow px-6 py-4 justify-between items-center">
          <h2 className="text-xl font-bold text-gray-700">Dashboard</h2>
          <span className="text-sm text-gray-500">{user?.email}</span>
        </div>

        <div className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-xl shadow text-center">
              <p className="text-gray-500 text-sm">Total Leads</p>
              <p className="text-4xl font-bold text-blue-800 mt-2">{totalLeads}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow text-center">
              <p className="text-gray-500 text-sm">Hot Leads</p>
              <p className="text-4xl font-bold text-red-500 mt-2">{hotLeads}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow text-center">
              <p className="text-gray-500 text-sm">Deals Won</p>
              <p className="text-4xl font-bold text-green-500 mt-2">0</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow text-center">
              <p className="text-gray-500 text-sm">Revenue</p>
              <p className="text-4xl font-bold text-purple-600 mt-2">₹0</p>
            </div>
          </div>

          {/* Quick Links */}
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