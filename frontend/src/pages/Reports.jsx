import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import Sidebar from '../components/Sidebar'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

const STATUS_COLORS = {
  'New': '#3B82F6', 'Hot': '#EF4444', 'Warm': '#F59E0B',
  'Cold': '#06B6D4', 'Won': '#10B981', 'Lost': '#6B7280',
}

export default function Reports({ orgId }) {
  const [leads, setLeads] = useState([])
  const [deals, setDeals] = useState([])
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (orgId) fetchAll()
  }, [orgId])

  const fetchAll = async () => {
    const [leadsRes, dealsRes, contactsRes] = await Promise.all([
      supabase.from('leads').select('*').eq('org_id', orgId),
      supabase.from('deals').select('*').eq('org_id', orgId),
      supabase.from('contacts').select('*').eq('org_id', orgId),
    ])
    setLeads(leadsRes.data || [])
    setDeals(dealsRes.data || [])
    setContacts(contactsRes.data || [])
    setLoading(false)
  }

  const leadsByStatus = Object.entries(
    leads.reduce((acc, l) => { acc[l.status] = (acc[l.status] || 0) + 1; return acc }, {})
  ).map(([name, value]) => ({ name, value }))

  const leadsBySource = Object.entries(
    leads.reduce((acc, l) => { if (l.source) acc[l.source] = (acc[l.source] || 0) + 1; return acc }, {})
  ).map(([name, count]) => ({ name, count }))

  const dealsByStage = Object.entries(
    deals.reduce((acc, d) => { acc[d.stage] = (acc[d.stage] || 0) + 1; return acc }, {})
  ).map(([name, count]) => ({ name, count }))

  const revenueByStage = Object.entries(
    deals.reduce((acc, d) => { acc[d.stage] = (acc[d.stage] || 0) + (d.value || 0); return acc }, {})
  ).map(([name, value]) => ({ name, value }))

  const totalRevenue = deals.reduce((sum, d) => sum + (d.value || 0), 0)
  const wonRevenue = deals.filter(d => d.stage === 'Won').reduce((sum, d) => sum + (d.value || 0), 0)
  const wonDeals = deals.filter(d => d.stage === 'Won').length
  const lostDeals = deals.filter(d => d.stage === 'Lost').length
  const winRate = deals.length > 0 ? ((wonDeals / deals.length) * 100).toFixed(1) : 0

  if (loading) return (
    <div className="flex min-h-screen">
      <Sidebar active="Reports" />
      <div className="flex-1 flex items-center justify-center">
        <p className="text-blue-800 text-xl font-semibold">Loading...</p>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      <Sidebar active="Reports" />
      <div className="flex-1 p-6">
        <h2 className="text-2xl font-bold text-gray-700 mb-6">Reports & Analytics</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl shadow text-center">
            <p className="text-gray-500 text-xs">Total Leads</p>
            <p className="text-3xl font-bold text-blue-800 mt-1">{leads.length}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow text-center">
            <p className="text-gray-500 text-xs">Total Contacts</p>
            <p className="text-3xl font-bold text-purple-600 mt-1">{contacts.length}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow text-center">
            <p className="text-gray-500 text-xs">Win Rate</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{winRate}%</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow text-center">
            <p className="text-gray-500 text-xs">Won Revenue</p>
            <p className="text-2xl font-bold text-green-600 mt-1">₹{wonRevenue.toLocaleString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="text-lg font-bold text-gray-700 mb-4">Leads by Status</h3>
            {leadsByStatus.length === 0 ? <p className="text-gray-400 text-center py-12">Koi data nahi</p> : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={leadsByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(e) => e.name + ': ' + e.value}>
                    {leadsByStatus.map((entry, i) => <Cell key={i} fill={STATUS_COLORS[entry.name] || '#888'} />)}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="text-lg font-bold text-gray-700 mb-4">Leads by Source</h3>
            {leadsBySource.length === 0 ? <p className="text-gray-400 text-center py-12">Koi data nahi</p> : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={leadsBySource}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="text-lg font-bold text-gray-700 mb-4">Deals by Stage</h3>
            {dealsByStage.length === 0 ? <p className="text-gray-400 text-center py-12">Koi data nahi</p> : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dealsByStage}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1E3A8A" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="text-lg font-bold text-gray-700 mb-4">Revenue by Stage (₹)</h3>
            {revenueByStage.length === 0 ? <p className="text-gray-400 text-center py-12">Koi data nahi</p> : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={revenueByStage}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip formatter={(value) => '₹' + value.toLocaleString()} />
                  <Bar dataKey="value" fill="#10B981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-lg font-bold text-gray-700 mb-4">Summary</h3>
          <table className="w-full text-sm">
            <thead className="bg-blue-800 text-white">
              <tr>
                <th className="px-4 py-3 text-left">Metric</th>
                <th className="px-4 py-3 text-left">Value</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Total Leads', leads.length],
                ['Hot Leads', leads.filter(l => l.status === 'Hot').length],
                ['Total Contacts', contacts.length],
                ['Total Deals', deals.length],
                ['Deals Won', wonDeals],
                ['Deals Lost', lostDeals],
                ['Win Rate', winRate + '%'],
                ['Total Pipeline Value', '₹' + totalRevenue.toLocaleString()],
                ['Won Revenue', '₹' + wonRevenue.toLocaleString()],
              ].map(([metric, value], i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="px-4 py-3 font-medium text-gray-700">{metric}</td>
                  <td className="px-4 py-3 text-blue-800 font-bold">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}