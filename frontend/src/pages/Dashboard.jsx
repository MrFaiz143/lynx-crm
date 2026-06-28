import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Dashboard() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <div className="bg-blue-800 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Lynx Soft. CRM</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm">{user?.email}</span>
          <button
            onClick={handleLogout}
            className="bg-white text-blue-800 px-4 py-1 rounded-lg text-sm font-semibold hover:bg-gray-100"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-700 mb-6">Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl shadow text-center">
            <p className="text-gray-500 text-sm">Total Leads</p>
            <p className="text-4xl font-bold text-blue-800 mt-2">0</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow text-center">
            <p className="text-gray-500 text-sm">Hot Leads</p>
            <p className="text-4xl font-bold text-red-500 mt-2">0</p>
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
          <div className="bg-white p-6 rounded-xl shadow hover:shadow-md cursor-pointer">
            <h3 className="text-lg font-bold text-blue-800 mb-2">📋 Leads</h3>
            <p className="text-gray-500 text-sm">Manage all your leads</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow hover:shadow-md cursor-pointer">
            <h3 className="text-lg font-bold text-blue-800 mb-2">💼 Deals</h3>
            <p className="text-gray-500 text-sm">Track your sales pipeline</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow hover:shadow-md cursor-pointer">
            <h3 className="text-lg font-bold text-blue-800 mb-2">📊 Reports</h3>
            <p className="text-gray-500 text-sm">View analytics & reports</p>
          </div>
        </div>
      </div>
    </div>
  )
}