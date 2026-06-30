import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import Sidebar from '../components/Sidebar'

export default function Leads() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({
    name: '', phone: '', email: '', source: '', status: 'New', notes: ''
  })

  useEffect(() => {
    fetchLeads()
  }, [])

  const fetchLeads = async () => {
    const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false })
    setLeads(data || [])
  }

  const resetForm = () => {
    setForm({ name: '', phone: '', email: '', source: '', status: 'New', notes: '' })
    setEditingId(null)
    setShowForm(false)
  }

  const handleSubmit = async () => {
    if (!form.name || !form.phone) {
      alert('Name aur Phone zaruri hai!')
      return
    }
    setLoading(true)

    if (editingId) {
      const { error } = await supabase.from('leads').update(form).eq('id', editingId)
      if (error) {
        alert('Error: ' + error.message)
      } else {
        alert('Lead update ho gaya! ✅')
        resetForm()
        fetchLeads()
      }
    } else {
      const { error } = await supabase.from('leads').insert([{
        ...form,
        created_at: new Date().toISOString()
      }])
      if (error) {
        alert('Error: ' + error.message)
      } else {
        alert('Lead successfully add hua! ✅')
        resetForm()
        fetchLeads()
      }
    }
    setLoading(false)
  }

  const handleEdit = (lead) => {
    setForm({
      name: lead.name || '',
      phone: lead.phone || '',
      email: lead.email || '',
      source: lead.source || '',
      status: lead.status || 'New',
      notes: lead.notes || ''
    })
    setEditingId(lead.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Kya tum is lead ko delete karna chahte ho?')) return
    const { error } = await supabase.from('leads').delete().eq('id', id)
    if (error) {
      alert('Error: ' + error.message)
    } else {
      fetchLeads()
    }
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      <Sidebar active="Leads" />

      <div className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-700">Leads</h2>
          <button
            onClick={() => { resetForm(); setShowForm(!showForm) }}
            className="bg-blue-800 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-900"
          >
            + Add Lead
          </button>
        </div>

        {showForm && (
          <div className="bg-white p-6 rounded-xl shadow mb-6">
            <h3 className="text-lg font-bold text-gray-700 mb-4">{editingId ? 'Edit Lead' : 'New Lead'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-600 text-sm mb-1">Name *</label>
                <input
                  type="text"
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Customer name"
                  value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-gray-600 text-sm mb-1">Phone *</label>
                <input
                  type="text"
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Mobile number"
                  value={form.phone}
                  onChange={(e) => setForm({...form, phone: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-gray-600 text-sm mb-1">Email</label>
                <input
                  type="email"
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Email address"
                  value={form.email}
                  onChange={(e) => setForm({...form, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-gray-600 text-sm mb-1">Source</label>
                <select
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.source}
                  onChange={(e) => setForm({...form, source: e.target.value})}
                >
                  <option value="">Select Source</option>
                  <option value="Website">Website</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Facebook">Facebook</option>
                  <option value="IndiaMART">IndiaMART</option>
                  <option value="Referral">Referral</option>
                  <option value="Cold Call">Cold Call</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-600 text-sm mb-1">Status</label>
                <select
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.status}
                  onChange={(e) => setForm({...form, status: e.target.value})}
                >
                  <option value="New">New</option>
                  <option value="Hot">Hot 🔥</option>
                  <option value="Warm">Warm ⭐</option>
                  <option value="Cold">Cold ❄️</option>
                  <option value="Won">Won ✅</option>
                  <option value="Lost">Lost ❌</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-600 text-sm mb-1">Notes</label>
                <input
                  type="text"
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Any notes"
                  value={form.notes}
                  onChange={(e) => setForm({...form, notes: e.target.value})}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-blue-800 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-900"
              >
                {loading ? 'Saving...' : (editingId ? 'Update Lead' : 'Save Lead')}
              </button>
              <button
                onClick={resetForm}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-blue-800 text-white">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Phone</th>
                <th className="px-4 py-3 text-left">Source</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Notes</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-400">
                    Koi lead nahi hai — Add Lead button se add karo!
                  </td>
                </tr>
              ) : (
                leads.map((lead, i) => (
                  <tr key={lead.id} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-4 py-3 font-medium">{lead.name}</td>
                    <td className="px-4 py-3">{lead.phone}</td>
                    <td className="px-4 py-3">{lead.source}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        lead.status === 'Hot' ? 'bg-red-100 text-red-600' :
                        lead.status === 'Warm' ? 'bg-yellow-100 text-yellow-600' :
                        lead.status === 'Won' ? 'bg-green-100 text-green-600' :
                        lead.status === 'Lost' ? 'bg-gray-100 text-gray-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{lead.notes}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(lead)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(lead.id)}
                          className="text-red-600 hover:text-red-800 text-xs font-semibold"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}