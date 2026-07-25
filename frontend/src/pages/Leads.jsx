import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import Sidebar from '../components/Sidebar'
import * as XLSX from 'xlsx'

export default function Leads({ orgId }) {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [form, setForm] = useState({
    name: '', phone: '', email: '', source: '', status: 'New', notes: ''
  })

  useEffect(() => {
    if (orgId) fetchLeads()
  }, [orgId])

  const fetchLeads = async () => {
    const { data } = await supabase
      .from('leads')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
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
      if (error) { alert('Error: ' + error.message) }
      else { alert('Lead update ho gaya! ✅'); resetForm(); fetchLeads() }
    } else {
      const { error } = await supabase.from('leads').insert([{
        ...form,
        org_id: orgId,
        created_at: new Date().toISOString()
      }])
      if (error) { alert('Error: ' + error.message) }
      else { alert('Lead add hua! ✅'); resetForm(); fetchLeads() }
    }
    setLoading(false)
  }

  const handleEdit = (lead) => {
    setForm({ name: lead.name || '', phone: lead.phone || '', email: lead.email || '', source: lead.source || '', status: lead.status || 'New', notes: lead.notes || '' })
    setEditingId(lead.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete karna chahte ho?')) return
    await supabase.from('leads').delete().eq('id', id)
    fetchLeads()
  }

  const handleExport = () => {
    const exportData = leads.map(l => ({
      Name: l.name, Phone: l.phone, Email: l.email,
      Source: l.source, Status: l.status, Notes: l.notes,
      'AI Score': l.lead_score, 'AI Tag': l.lead_tag,
      'Created At': l.created_at
    }))
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Leads')
    XLSX.writeFile(wb, 'Leads.xlsx')
  }

  const handleImport = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (evt) => {
      const wb = XLSX.read(evt.target.result, { type: 'binary' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const data = XLSX.utils.sheet_to_json(ws)
      const toInsert = data.map(row => ({
        name: row['Name'] || row['name'] || '',
        phone: row['Phone'] || row['phone'] || '',
        email: row['Email'] || row['email'] || '',
        source: row['Source'] || row['source'] || '',
        status: row['Status'] || row['status'] || 'New',
        notes: row['Notes'] || row['notes'] || '',
        org_id: orgId,
        created_at: new Date().toISOString()
      })).filter(r => r.name && r.phone)
      if (toInsert.length === 0) { alert('Koi valid data nahi mila!'); return }
      const { error } = await supabase.from('leads').insert(toInsert)
      if (error) { alert('Import error: ' + error.message) }
      else { alert(toInsert.length + ' leads import ho gaye! ✅'); fetchLeads() }
    }
    reader.readAsBinaryString(file)
    e.target.value = ''
  }

  const filteredLeads = leads.filter(lead => {
    const matchSearch = search === '' ||
      lead.name?.toLowerCase().includes(search.toLowerCase()) ||
      lead.phone?.includes(search) ||
      lead.email?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === '' || lead.status === filterStatus
    return matchSearch && matchStatus
  })

  const tagBadge = (tag) => {
    const styles = {
      Hot: 'bg-red-100 text-red-600',
      Warm: 'bg-yellow-100 text-yellow-600',
      Cold: 'bg-cyan-100 text-cyan-700',
    }
    const emojis = { Hot: '🔥', Warm: '⭐', Cold: '❄️' }
    const t = tag || 'Cold'
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[t] || styles.Cold}`}>
        {emojis[t] || '❄️'} {t}
      </span>
    )
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      <Sidebar active="Leads" />
      <div className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-700">Leads</h2>
          <div className="flex gap-2">
            <button onClick={handleExport} className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 text-sm">Export Excel</button>
            <label className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-yellow-600 text-sm cursor-pointer">
              Import Excel
              <input type="file" accept=".xlsx,.csv" onChange={handleImport} className="hidden" />
            </label>
            <button onClick={() => { resetForm(); setShowForm(!showForm) }} className="bg-blue-800 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-900 text-sm">+ Add Lead</button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow mb-4 flex gap-3 flex-wrap">
          <input
            type="text"
            placeholder="🔍 Search by name, phone, email..."
            className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="New">New</option>
            <option value="Hot">Hot 🔥</option>
            <option value="Warm">Warm ⭐</option>
            <option value="Cold">Cold ❄️</option>
            <option value="Won">Won ✅</option>
            <option value="Lost">Lost ❌</option>
          </select>
          {(search || filterStatus) && (
            <button onClick={() => { setSearch(''); setFilterStatus('') }} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm">Clear</button>
          )}
        </div>

        {showForm && (
          <div className="bg-white p-6 rounded-xl shadow mb-6">
            <h3 className="text-lg font-bold text-gray-700 mb-4">{editingId ? 'Edit Lead' : 'New Lead'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-600 text-sm mb-1">Name *</label>
                <input type="text" className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Customer name" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-gray-600 text-sm mb-1">Phone *</label>
                <input type="text" className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Mobile number" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} />
              </div>
              <div>
                <label className="block text-gray-600 text-sm mb-1">Email</label>
                <input type="email" className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Email address" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-gray-600 text-sm mb-1">Source</label>
                <select className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.source} onChange={(e) => setForm({...form, source: e.target.value})}>
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
                <select className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.status} onChange={(e) => setForm({...form, status: e.target.value})}>
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
                <input type="text" className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Any notes" value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleSubmit} disabled={loading} className="bg-blue-800 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-900">
                {loading ? 'Saving...' : (editingId ? 'Update Lead' : 'Save Lead')}
              </button>
              <button onClick={resetForm} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300">Cancel</button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <div className="px-4 py-2 text-sm text-gray-500 border-b">{filteredLeads.length} leads found</div>
          <table className="w-full text-sm">
            <thead className="bg-blue-800 text-white">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Phone</th>
                <th className="px-4 py-3 text-left">Source</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">AI Score 🎯</th>
                <th className="px-4 py-3 text-left">Notes</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.length === 0 ? (
                <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-400">Koi lead nahi — Add Lead se add karo!</td></tr>
              ) : (
                filteredLeads.map((lead, i) => (
                  <tr key={lead.id} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-4 py-3 font-medium">{lead.name}</td>
                    <td className="px-4 py-3">{lead.phone}</td>
                    <td className="px-4 py-3">{lead.source}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${lead.status === 'Hot' ? 'bg-red-100 text-red-600' : lead.status === 'Warm' ? 'bg-yellow-100 text-yellow-600' : lead.status === 'Won' ? 'bg-green-100 text-green-600' : lead.status === 'Lost' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-600'}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {tagBadge(lead.lead_tag)}
                        <span className="text-xs text-gray-400">{lead.lead_score ?? 0}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{lead.notes}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(lead)} className="text-blue-600 hover:text-blue-800 text-xs font-semibold">Edit</button>
                        <button onClick={() => handleDelete(lead.id)} className="text-red-600 hover:text-red-800 text-xs font-semibold">Delete</button>
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
