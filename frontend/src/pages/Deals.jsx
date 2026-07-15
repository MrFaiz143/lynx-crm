import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import Sidebar from '../components/Sidebar'

const STAGES = ['New', 'Contacted', 'Qualified', 'Quote Sent', 'Won', 'Lost']

const STAGE_COLORS = {
  'New': 'bg-blue-100 text-blue-700 border-blue-300',
  'Contacted': 'bg-yellow-100 text-yellow-700 border-yellow-300',
  'Qualified': 'bg-purple-100 text-purple-700 border-purple-300',
  'Quote Sent': 'bg-orange-100 text-orange-700 border-orange-300',
  'Won': 'bg-green-100 text-green-700 border-green-300',
  'Lost': 'bg-red-100 text-red-700 border-red-300',
}

export default function Deals({ orgId }) {
  const [deals, setDeals] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({
    title: '', contact_name: '', value: '', stage: 'New', notes: ''
  })

  useEffect(() => {
    if (orgId) fetchDeals()
  }, [orgId])

  const fetchDeals = async () => {
    const { data } = await supabase
      .from('deals')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
    setDeals(data || [])
  }

  const resetForm = () => {
    setForm({ title: '', contact_name: '', value: '', stage: 'New', notes: '' })
    setEditingId(null)
    setShowForm(false)
  }

  const handleSubmit = async () => {
    if (!form.title || !form.contact_name) {
      alert('Title aur Contact Name zaruri hai!')
      return
    }
    setLoading(true)
    const payload = {
      ...form,
      value: form.value ? parseFloat(form.value) : 0,
      org_id: orgId,
    }
    if (editingId) {
      const { error } = await supabase.from('deals').update(payload).eq('id', editingId)
      if (error) { alert('Error: ' + error.message) }
      else { alert('Deal update ho gaya! ✅'); resetForm(); fetchDeals() }
    } else {
      const { error } = await supabase.from('deals').insert([{
        ...payload,
        created_at: new Date().toISOString()
      }])
      if (error) { alert('Error: ' + error.message) }
      else { alert('Deal add hua! ✅'); resetForm(); fetchDeals() }
    }
    setLoading(false)
  }

  const handleEdit = (deal) => {
    setForm({
      title: deal.title || '',
      contact_name: deal.contact_name || '',
      value: deal.value || '',
      stage: deal.stage || 'New',
      notes: deal.notes || ''
    })
    setEditingId(deal.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete karna chahte ho?')) return
    await supabase.from('deals').delete().eq('id', id)
    fetchDeals()
  }

  const moveStage = async (dealId, newStage) => {
    await supabase.from('deals').update({ stage: newStage }).eq('id', dealId)
    fetchDeals()
  }

  const totalValue = deals.reduce((sum, d) => sum + (d.value || 0), 0)
  const wonValue = deals.filter(d => d.stage === 'Won').reduce((sum, d) => sum + (d.value || 0), 0)

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      <Sidebar active="Deals" />
      <div className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-700">Deals Pipeline</h2>
          <button onClick={() => { resetForm(); setShowForm(!showForm) }} className="bg-blue-800 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-900">+ Add Deal</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow text-center">
            <p className="text-gray-500 text-sm">Total Deals</p>
            <p className="text-2xl font-bold text-blue-800">{deals.length}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow text-center">
            <p className="text-gray-500 text-sm">Pipeline Value</p>
            <p className="text-2xl font-bold text-purple-600">₹{totalValue.toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow text-center">
            <p className="text-gray-500 text-sm">Won Value</p>
            <p className="text-2xl font-bold text-green-600">₹{wonValue.toLocaleString()}</p>
          </div>
        </div>

        {showForm && (
          <div className="bg-white p-6 rounded-xl shadow mb-6">
            <h3 className="text-lg font-bold text-gray-700 mb-4">{editingId ? 'Edit Deal' : 'New Deal'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-600 text-sm mb-1">Deal Title *</label>
                <input type="text" className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. CCTV Installation" value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} />
              </div>
              <div>
                <label className="block text-gray-600 text-sm mb-1">Contact Name *</label>
                <input type="text" className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Customer name" value={form.contact_name} onChange={(e) => setForm({...form, contact_name: e.target.value})} />
              </div>
              <div>
                <label className="block text-gray-600 text-sm mb-1">Deal Value (₹)</label>
                <input type="number" className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" value={form.value} onChange={(e) => setForm({...form, value: e.target.value})} />
              </div>
              <div>
                <label className="block text-gray-600 text-sm mb-1">Stage</label>
                <select className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.stage} onChange={(e) => setForm({...form, stage: e.target.value})}>
                  {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-600 text-sm mb-1">Notes</label>
                <input type="text" className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Any notes" value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleSubmit} disabled={loading} className="bg-blue-800 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-900">
                {loading ? 'Saving...' : (editingId ? 'Update Deal' : 'Save Deal')}
              </button>
              <button onClick={resetForm} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300">Cancel</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {STAGES.map(stage => (
            <div key={stage} className="bg-gray-200 rounded-xl p-3 min-h-[200px]">
              <h3 className="font-bold text-gray-700 text-sm mb-3 text-center">
                {stage} ({deals.filter(d => d.stage === stage).length})
              </h3>
              <div className="space-y-2">
                {deals.filter(d => d.stage === stage).map(deal => (
                  <div key={deal.id} className={`bg-white p-3 rounded-lg shadow border-l-4 ${STAGE_COLORS[stage]}`}>
                    <p className="font-semibold text-sm text-gray-800">{deal.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{deal.contact_name}</p>
                    <p className="text-sm font-bold text-blue-800 mt-1">₹{deal.value?.toLocaleString() || 0}</p>
                    <select value={deal.stage} onChange={(e) => moveStage(deal.id, e.target.value)} className="w-full mt-2 text-xs border rounded px-1 py-1">
                      {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => handleEdit(deal)} className="text-blue-600 hover:text-blue-800 text-xs font-semibold">Edit</button>
                      <button onClick={() => handleDelete(deal.id)} className="text-red-600 hover:text-red-800 text-xs font-semibold">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}