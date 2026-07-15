import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import Sidebar from '../components/Sidebar'

const ACTIVITY_TYPES = ['Call', 'Email', 'Meeting', 'WhatsApp', 'Follow-up', 'Note']

const TYPE_COLORS = {
  'Call': 'bg-blue-100 text-blue-700',
  'Email': 'bg-purple-100 text-purple-700',
  'Meeting': 'bg-green-100 text-green-700',
  'WhatsApp': 'bg-emerald-100 text-emerald-700',
  'Follow-up': 'bg-yellow-100 text-yellow-700',
  'Note': 'bg-gray-100 text-gray-700',
}

const TYPE_ICONS = {
  'Call': '📞',
  'Email': '📧',
  'Meeting': '🤝',
  'WhatsApp': '💬',
  'Follow-up': '🔔',
  'Note': '📝',
}

export default function Activities({ orgId }) {
  const [activities, setActivities] = useState([])
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    lead_id: '', type: 'Call', note: ''
  })

  useEffect(() => {
    if (orgId) {
      fetchActivities()
      fetchLeads()
    }
  }, [orgId])

  const fetchActivities = async () => {
    const { data } = await supabase
      .from('activities')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
    setActivities(data || [])
  }

  const fetchLeads = async () => {
    const { data } = await supabase
      .from('leads')
      .select('id, name')
      .eq('org_id', orgId)
    setLeads(data || [])
  }

  const resetForm = () => {
    setForm({ lead_id: '', type: 'Call', note: '' })
    setShowForm(false)
  }

  const handleSubmit = async () => {
    if (!form.note) {
      alert('Note zaruri hai!')
      return
    }
    setLoading(true)
    const { error } = await supabase.from('activities').insert([{
      lead_id: form.lead_id ? parseInt(form.lead_id) : null,
      type: form.type,
      note: form.note,
      org_id: orgId,
      created_at: new Date().toISOString()
    }])
    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('Activity add ho gayi! ✅')
      resetForm()
      fetchActivities()
    }
    setLoading(false)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete karna chahte ho?')) return
    await supabase.from('activities').delete().eq('id', id)
    fetchActivities()
  }

  const getLeadName = (lead_id) => {
    const lead = leads.find(l => l.id === lead_id)
    return lead ? lead.name : 'General'
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      <Sidebar active="Activities" />
      <div className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-700">Activity Timeline</h2>
          <button onClick={() => setShowForm(!showForm)} className="bg-blue-800 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-900">
            + Add Activity
          </button>
        </div>

        {showForm && (
          <div className="bg-white p-6 rounded-xl shadow mb-6">
            <h3 className="text-lg font-bold text-gray-700 mb-4">New Activity</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-600 text-sm mb-1">Activity Type</label>
                <select className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.type} onChange={(e) => setForm({...form, type: e.target.value})}>
                  {ACTIVITY_TYPES.map(t => <option key={t} value={t}>{TYPE_ICONS[t]} {t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-gray-600 text-sm mb-1">Related Lead (Optional)</label>
                <select className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.lead_id} onChange={(e) => setForm({...form, lead_id: e.target.value})}>
                  <option value="">Select Lead</option>
                  {leads.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-600 text-sm mb-1">Note *</label>
                <textarea className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Activity details likho..." rows={3} value={form.note} onChange={(e) => setForm({...form, note: e.target.value})} />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleSubmit} disabled={loading} className="bg-blue-800 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-900">
                {loading ? 'Saving...' : 'Save Activity'}
              </button>
              <button onClick={resetForm} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300">Cancel</button>
            </div>
          </div>
        )}

        <div className="relative">
          {activities.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-8 text-center text-gray-400">
              Koi activity nahi — Add Activity button se add karo!
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="bg-white rounded-xl shadow p-4 flex gap-4 items-start">
                  <div className="text-2xl mt-1">{TYPE_ICONS[activity.type] || '📝'}</div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${TYPE_COLORS[activity.type] || 'bg-gray-100 text-gray-700'}`}>
                          {activity.type}
                        </span>
                        <span className="ml-2 text-sm text-gray-500">
                          {activity.lead_id ? '👤 ' + getLeadName(activity.lead_id) : '📌 General'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">{formatDate(activity.created_at)}</span>
                        <button onClick={() => handleDelete(activity.id)} className="text-red-500 hover:text-red-700 text-xs font-semibold">Delete</button>
                      </div>
                    </div>
                    <p className="text-gray-700 mt-2 text-sm">{activity.note}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}