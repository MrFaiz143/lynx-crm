import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import Sidebar from '../components/Sidebar'
import * as XLSX from 'xlsx'

export default function Contacts() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({
    name: '', phone: '', email: '', company: '', address: '', notes: ''
  })

  useEffect(() => {
    fetchContacts()
  }, [])

  const fetchContacts = async () => {
    const { data } = await supabase.from('contacts').select('*').order('created_at', { ascending: false })
    setContacts(data || [])
  }

  const resetForm = () => {
    setForm({ name: '', phone: '', email: '', company: '', address: '', notes: '' })
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
      const { error } = await supabase.from('contacts').update(form).eq('id', editingId)
      if (error) { alert('Error: ' + error.message) }
      else { alert('Contact update ho gaya! ✅'); resetForm(); fetchContacts() }
    } else {
      const { error } = await supabase.from('contacts').insert([{ ...form, created_at: new Date().toISOString() }])
      if (error) { alert('Error: ' + error.message) }
      else { alert('Contact add hua! ✅'); resetForm(); fetchContacts() }
    }
    setLoading(false)
  }

  const handleEdit = (contact) => {
    setForm({ name: contact.name || '', phone: contact.phone || '', email: contact.email || '', company: contact.company || '', address: contact.address || '', notes: contact.notes || '' })
    setEditingId(contact.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete karna chahte ho?')) return
    await supabase.from('contacts').delete().eq('id', id)
    fetchContacts()
  }

  const handleExport = () => {
    const exportData = contacts.map(c => ({
      Name: c.name, Phone: c.phone, Email: c.email,
      Company: c.company, Address: c.address, Notes: c.notes,
      'Created At': c.created_at
    }))
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Contacts')
    XLSX.writeFile(wb, 'Contacts.xlsx')
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
        company: row['Company'] || row['company'] || '',
        address: row['Address'] || row['address'] || '',
        notes: row['Notes'] || row['notes'] || '',
        created_at: new Date().toISOString()
      })).filter(r => r.name && r.phone)
      if (toInsert.length === 0) { alert('Koi valid data nahi mila!'); return }
      const { error } = await supabase.from('contacts').insert(toInsert)
      if (error) { alert('Import error: ' + error.message) }
      else { alert(toInsert.length + ' contacts import ho gaye! ✅'); fetchContacts() }
    }
    reader.readAsBinaryString(file)
    e.target.value = ''
  }

  // Filter contacts
  const filteredContacts = contacts.filter(contact => {
    return search === '' ||
      contact.name?.toLowerCase().includes(search.toLowerCase()) ||
      contact.phone?.includes(search) ||
      contact.email?.toLowerCase().includes(search.toLowerCase()) ||
      contact.company?.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      <Sidebar active="Contacts" />
      <div className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-700">Contacts</h2>
          <div className="flex gap-2">
            <button onClick={handleExport} className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 text-sm">Export Excel</button>
            <label className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-yellow-600 text-sm cursor-pointer">
              Import Excel
              <input type="file" accept=".xlsx,.csv" onChange={handleImport} className="hidden" />
            </label>
            <button onClick={() => { resetForm(); setShowForm(!showForm) }} className="bg-blue-800 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-900 text-sm">+ Add Contact</button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-xl shadow mb-4 flex gap-3">
          <input
            type="text"
            placeholder="🔍 Search by name, phone, email, company..."
            className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-300"
            >
              Clear
            </button>
          )}
        </div>

        {showForm && (
          <div className="bg-white p-6 rounded-xl shadow mb-6">
            <h3 className="text-lg font-bold text-gray-700 mb-4">{editingId ? 'Edit Contact' : 'New Contact'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-600 text-sm mb-1">Name *</label>
                <input type="text" className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Contact name" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} />
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
                <label className="block text-gray-600 text-sm mb-1">Company</label>
                <input type="text" className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Company name" value={form.company} onChange={(e) => setForm({...form, company: e.target.value})} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-600 text-sm mb-1">Address</label>
                <input type="text" className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Full address" value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-600 text-sm mb-1">Notes</label>
                <input type="text" className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Any notes" value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleSubmit} disabled={loading} className="bg-blue-800 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-900">
                {loading ? 'Saving...' : (editingId ? 'Update Contact' : 'Save Contact')}
              </button>
              <button onClick={resetForm} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300">Cancel</button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <div className="px-4 py-2 text-sm text-gray-500 border-b">
            {filteredContacts.length} contacts found
          </div>
          <table className="w-full text-sm">
            <thead className="bg-blue-800 text-white">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Phone</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Company</th>
                <th className="px-4 py-3 text-left">Notes</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.length === 0 ? (
                <tr><td colSpan="6" className="px-4 py-8 text-center text-gray-400">Koi contact nahi mila!</td></tr>
              ) : (
                filteredContacts.map((contact, i) => (
                  <tr key={contact.id} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-4 py-3 font-medium">{contact.name}</td>
                    <td className="px-4 py-3">{contact.phone}</td>
                    <td className="px-4 py-3">{contact.email}</td>
                    <td className="px-4 py-3">{contact.company}</td>
                    <td className="px-4 py-3 text-gray-500">{contact.notes}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(contact)} className="text-blue-600 hover:text-blue-800 text-xs font-semibold">Edit</button>
                        <button onClick={() => handleDelete(contact.id)} className="text-red-600 hover:text-red-800 text-xs font-semibold">Delete</button>
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